/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import { log } from './logging';
import { getDefaultPlatformioExecutablePath, getExecutableDirectory, getExecutableSearchDirectories, resolveExecutable } from './executableResolver';
import * as vscode from 'vscode';
import { CYBERBRICK_OTA_AGENT_TARGET_VERSION, WifiNetworkSuggestion } from '../types/cyberbrickUpload';
import {
	buildCyberBrickRcMainOtaBootstrap,
	CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END,
	CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START,
	withCyberBrickRcMainOtaBootstrap,
} from './cyberbrickOtaAgentSource';

/**
 * 上傳階段類型
 */
export type UploadStage =
	| 'preparing'
	| 'checking_tool'
	| 'installing_tool'
	| 'connecting'
	| 'resetting'
	| 'backing_up'
	| 'uploading'
	| 'restarting'
	| 'completed'
	| 'failed';

/**
 * 上傳進度介面
 */
export interface UploadProgress {
	stage: UploadStage;
	progress: number; // 0-100
	message: string;
	error?: string;
}

/**
 * 上傳結果介面
 */
export interface UploadResult {
	success: boolean;
	timestamp: string;
	port: string;
	duration: number; // 毫秒
	error?: {
		stage: UploadStage;
		message: string;
		details?: string;
		errorCode?: string | null;
	};
	backup?: {
		created: boolean;
		path?: string;
	};
}

/**
 * COM 埠資訊介面
 */
export interface ComPortInfo {
	path: string;
	vendorId: string;
	productId: string;
	manufacturer?: string;
	description?: string;
	serialNumber?: string;
}

/**
 * 上傳請求介面
 */
export interface UploadRequest {
	code: string;
	board: string;
	port?: string;
}

/**
 * 進度回調類型
 */
export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * 指令執行介面（用於依賴注入）
 */
export interface CommandExecutor {
	exec(command: string): Promise<{ stdout: string; stderr: string }>;
	execFile?(file: string, args: string[]): Promise<{ stdout: string; stderr: string }>;
}

/**
 * CyberBrick USB 識別資訊
 */
const CYBERBRICK_USB = {
	vid: '303A',
	pid: '1001',
};

/**
 * 裝置上的目標路徑
 */
const DEVICE_PATH = '/app/rc_main.py';

/**
 * MicroPython 上傳服務
 * 負責將 MicroPython 程式碼上傳到 CyberBrick
 */
export class MicropythonUploader {
	private executor: CommandExecutor;
	private pythonPath: string | null = null;
	private mpremotePath: string | null = null;

	/**
	 * 建立 MicropythonUploader 實例
	 * @param workspacePath 工作區路徑
	 * @param executor 指令執行器（可選，用於測試）
	 */
	constructor(private workspacePath: string, executor?: CommandExecutor) {
		// 使用預設的 child_process 執行器或注入的執行器
		this.executor = executor || {
			exec: (command: string) => {
				const { exec } = require('child_process');
				return new Promise((resolve, reject) => {
					exec(command, { encoding: 'utf8' }, (error: Error | null, stdout: string, stderr: string) => {
						if (error) {
							reject({ error, stdout, stderr });
						} else {
							resolve({ stdout, stderr });
						}
					});
				});
			},
			execFile: (file: string, args: string[]) => {
				const { execFile } = require('child_process');
				return new Promise((resolve, reject) => {
					execFile(file, args, { encoding: 'utf8' }, (error: Error | null, stdout: string, stderr: string) => {
						if (error) {
							reject({ error, stdout, stderr });
						} else {
							resolve({ stdout, stderr });
						}
					});
				});
			},
		};
	}

	private getPlatformioSearchDirectories(): string[] {
		const searchDirectories = getExecutableSearchDirectories();
		const resolvedPioPath = resolveExecutable({
			candidatePaths: [getDefaultPlatformioExecutablePath('pio')],
			searchDirectories,
			executableNames: ['pio'],
		});
		const pioDirectory = getExecutableDirectory(resolvedPioPath);

		return [...new Set([...(pioDirectory ? [pioDirectory] : []), ...searchDirectories])];
	}

	/**
	 * 取得 PlatformIO Python 環境路徑
	 * @returns Python 執行檔路徑
	 */
	getPlatformioPythonPath(): string {
		const defaultPath = getDefaultPlatformioExecutablePath('python');
		return resolveExecutable({
			candidatePaths: [defaultPath],
			searchDirectories: this.getPlatformioSearchDirectories(),
			executableNames: ['python3', 'python'],
		}) ?? defaultPath;
	}

	/**
	 * 取得 mpremote 執行路徑
	 * @returns mpremote 執行檔路徑
	 */
	getMpremotePath(): string {
		const defaultPath = getDefaultPlatformioExecutablePath('mpremote');
		return resolveExecutable({
			candidatePaths: [defaultPath],
			searchDirectories: this.getPlatformioSearchDirectories(),
			executableNames: ['mpremote'],
		}) ?? defaultPath;
	}

	/**
	 * 檢查 PlatformIO Python 環境是否存在
	 * @returns 是否存在
	 */
	async checkPythonEnvironment(): Promise<boolean> {
		const pythonPath = this.getPlatformioPythonPath();
		const fs = require('fs');

		if (!fs.existsSync(pythonPath)) {
			log('[blockly] PlatformIO Python 環境不存在', 'warn', { path: pythonPath });
			return false;
		}

		try {
			const result = await this.execExecutable(pythonPath, ['--version']);
			log('[blockly] PlatformIO Python 環境檢查成功', 'info', { version: result.stdout.trim() });
			this.pythonPath = pythonPath;
			return true;
		} catch (error) {
			log('[blockly] PlatformIO Python 環境檢查失敗', 'error', error);
			return false;
		}
	}

	/**
	 * 檢查 mpremote 是否已安裝
	 * @returns 是否已安裝
	 */
	async checkMpremoteInstalled(): Promise<boolean> {
		const mpremotePath = this.getMpremotePath();
		const fs = require('fs');

		if (!fs.existsSync(mpremotePath)) {
			log('[blockly] mpremote 未安裝', 'info', { path: mpremotePath });
			return false;
		}

		try {
			const result = await this.execExecutable(mpremotePath, ['version']);
			log('[blockly] mpremote 已安裝', 'info', { version: result.stdout.trim() });
			this.mpremotePath = mpremotePath;
			return true;
		} catch (error) {
			log('[blockly] mpremote 版本檢查失敗', 'warn', error);
			return false;
		}
	}

	/**
	 * 安裝 mpremote
	 * @param onProgress 進度回調
	 * @returns 是否安裝成功
	 */
	async installMpremote(onProgress?: ProgressCallback): Promise<boolean> {
		if (!this.pythonPath) {
			const hasPython = await this.checkPythonEnvironment();
			if (!hasPython) {
				return false;
			}
		}

		onProgress?.({
			stage: 'installing_tool',
			progress: 30,
			message: 'Installing mpremote...',
		});

		try {
			const pipPath = this.getPipPath();
			log('[blockly] 開始安裝 mpremote', 'info', { pip: pipPath });

			await this.execExecutable(pipPath, ['install', 'mpremote']);

			// 驗證安裝
			const installed = await this.checkMpremoteInstalled();
			if (installed) {
				log('[blockly] mpremote 安裝成功', 'info');
				return true;
			} else {
				log('[blockly] mpremote 安裝後驗證失敗', 'error');
				return false;
			}
		} catch (error) {
			log('[blockly] mpremote 安裝失敗', 'error', error);
			return false;
		}
	}

	/**
	 * 取得 pip 執行路徑
	 * @returns pip 執行檔路徑
	 */
	private getPipPath(): string {
		const defaultPath = getDefaultPlatformioExecutablePath('pip');
		return resolveExecutable({
			candidatePaths: [defaultPath],
			searchDirectories: this.getPlatformioSearchDirectories(),
			executableNames: ['pip3', 'pip'],
		}) ?? defaultPath;
	}

	/**
	 * 列出可用的 COM 埠
	 * @param filter 過濾類型
	 * @returns COM 埠清單
	 */
	async listPorts(filter?: 'all' | 'cyberbrick'): Promise<{ ports: ComPortInfo[]; autoDetected?: string }> {
		if (!this.mpremotePath) {
			const installed = await this.checkMpremoteInstalled();
			if (!installed) {
				log('[blockly] 無法列出埠：mpremote 未安裝', 'error');
				return { ports: [] };
			}
		}

		try {
			const result = await this.execMpremote(['connect', 'list']);
			const ports = this.parsePortList(result.stdout);
			const { filteredPorts, autoDetected } = this.filterPorts(ports, filter);

			log('[blockly] 已列出 COM 埠', 'info', { count: filteredPorts.length, autoDetected });
			return { ports: filteredPorts, autoDetected };
		} catch (error) {
			log('[blockly] 列出 COM 埠失敗', 'error', error);
			return { ports: [] };
		}
	}

	/**
	 * 使用 PlatformIO Python + pyserial 列出本機序列埠。
	 * 供 USB monitor 偵測使用，避免把 Wi‑Fi fallback 綁死在 mpremote 狀態上。
	 */
	async listSerialPorts(filter?: 'all' | 'cyberbrick'): Promise<{ ports: ComPortInfo[]; autoDetected?: string }> {
		const fs = require('fs');
		const tempDir = os.tmpdir();
		const scriptFile = path.join(tempDir, `cyberbrick_serial_ports_${Date.now()}_${Math.random().toString(16).slice(2)}.py`);
		const pythonPath = this.getPythonPath();
		const script = [
			'import json',
			'try:',
			'    from serial.tools import list_ports',
			'except Exception as exc:',
			"    print(json.dumps({'error': str(exc), 'ports': []}))",
			'else:',
			'    ports = []',
			'    for info in list_ports.comports():',
			"        vid = ('%04X' % info.vid) if getattr(info, 'vid', None) is not None else ''",
			"        pid = ('%04X' % info.pid) if getattr(info, 'pid', None) is not None else ''",
			"        ports.append({'path': getattr(info, 'device', '') or '', 'vendorId': vid, 'productId': pid, 'manufacturer': getattr(info, 'manufacturer', None), 'description': getattr(info, 'description', None), 'serialNumber': getattr(info, 'serial_number', None)})",
			"    print(json.dumps({'ports': ports}))",
			'',
		].join('\n');
		fs.writeFileSync(scriptFile, script, 'utf8');

		try {
			const result = await this.execExecutable(pythonPath, [scriptFile], 10000);
			const payload = this.parseJsonLine<{ ports?: Array<Partial<ComPortInfo>>; error?: string }>(result.stdout);
			if (payload?.error) {
				log('[blockly] 列出本機序列埠失敗', 'warn', { error: payload.error });
				return { ports: [] };
			}

			const ports = (Array.isArray(payload?.ports) ? payload.ports : [])
				.map(port => ({
					path: typeof port.path === 'string' ? port.path.trim() : '',
					vendorId: typeof port.vendorId === 'string' ? port.vendorId.trim().toUpperCase() : '',
					productId: typeof port.productId === 'string' ? port.productId.trim().toUpperCase() : '',
					manufacturer: typeof port.manufacturer === 'string' && port.manufacturer.trim() ? port.manufacturer.trim() : undefined,
					description: typeof port.description === 'string' && port.description.trim() ? port.description.trim() : undefined,
					serialNumber: typeof port.serialNumber === 'string' && port.serialNumber.trim() ? port.serialNumber.trim() : undefined,
				}))
				.filter(port => port.path.length > 0);
			const { filteredPorts, autoDetected } = this.filterPorts(ports, filter);

			log('[blockly] 已列出本機序列埠', 'info', { count: filteredPorts.length, autoDetected });
			return { ports: filteredPorts, autoDetected };
		} catch (error) {
			log('[blockly] 本機序列埠偵測失敗', 'error', error);
			return { ports: [] };
		} finally {
			try {
				fs.unlinkSync(scriptFile);
			} catch {
				// 忽略清理錯誤
			}
		}
	}

	/**
	 * 在指定 CyberBrick USB 連線上執行一段短 MicroPython 程式。
	 * 注意：script 可能包含 provisioning secret，呼叫端與本方法都不可把 script 內容寫入 log。
	 */
	async runCyberBrickPython(port: string, script: string, timeoutMs = 15000): Promise<{ stdout: string; stderr: string }> {
		await this.ensureMpremoteReady();
		const fs = require('fs');
		const tempDir = os.tmpdir();
		const scriptFile = path.join(tempDir, `cyberbrick_exec_${Date.now()}_${Math.random().toString(16).slice(2)}.py`);
		fs.writeFileSync(scriptFile, script, 'utf8');

		try {
			// CyberBrick 上通常會自動執行 /app/rc_main.py；直接 `mpremote run` 會先 soft-reset，
			// 學生程式重新啟動後可能讓 mpremote 無法進入 raw REPL。
			// 沿用 USB 上傳流程：先中斷程式進入正常 REPL，再用 resume + run 避免額外 soft-reset。
			await this.interruptDevice(port);
			
			// Windows 平台需要額外時間讓 COM port 驅動完全釋放
			if (process.platform === 'win32') {
				await this.delay(1500);
			}
			
			const normalizedPort = this.normalizeCOMPort(port);
			
			// Windows 路徑相容性：使用短路徑格式避免特殊字符問題
			const finalScriptFile = this.getWindowsShortPath(scriptFile);

			const args = ['connect', normalizedPort, 'resume', '+', 'run', finalScriptFile];
			log('[blockly] 執行 CyberBrick mpremote helper', 'debug', { port, normalizedPort, timeoutMs, mode: 'resume-run' });
			
			// Windows 平台重試機制：偵測 port busy 錯誤
			const maxRetries = process.platform === 'win32' ? 3 : 1;
			let lastError: unknown;
			
			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					return await this.execMpremote(args, timeoutMs);
				} catch (error) {
					lastError = error;
					const errorMsg = this.formatCommandError(error).toLowerCase();
					
					// 僅針對 "port busy" 類錯誤重試
					const isPortBusy = errorMsg.includes('in use') || 
					                   errorMsg.includes('access is denied') || 
					                   errorMsg.includes('permissionerror') ||
					                   errorMsg.includes('cannot access');
					
					if (isPortBusy && attempt < maxRetries) {
						log(`[blockly] COM port 忙碌，等待後重試 (${attempt}/${maxRetries})`, 'warn', { port: normalizedPort });
						await this.delay(500);
						continue;
					}
					
					// 其他錯誤或已達重試上限，立即拋出
					break;
				}
			}
			
			throw new Error(`CyberBrick helper failed: ${this.formatCommandError(lastError)}`);
		} finally {
			try {
				fs.unlinkSync(scriptFile);
			} catch {
				// 忽略清理錯誤
			}
		}
	}

	async readCyberBrickDeviceId(port: string): Promise<string | undefined> {
		const script = `import json
try:
    import cyberbrick_ota_config as cfg
    device_id = getattr(cfg, 'DEVICE_ID', '')
except Exception:
    device_id = ''
print(json.dumps({'deviceId': device_id}))
`;
		const result = await this.runCyberBrickPython(port, script, 10000);
		return this.parseJsonLine<{ deviceId?: string }>(result.stdout)?.deviceId?.trim() || undefined;
	}

	async writeCyberBrickDeviceId(port: string, deviceId: string): Promise<void> {
		const script = `DEVICE_ID = ${JSON.stringify(deviceId)}
with open('/cyberbrick_ota_config.py', 'w') as f:
    f.write('DEVICE_ID = ' + repr(DEVICE_ID) + '\\n')
print('OK')
`;
		await this.runCyberBrickPython(port, script, 10000);
	}

	async scanCyberBrickWifi(port: string): Promise<WifiNetworkSuggestion[]> {
		const script = [
			'import json',
			'import time',
			'try:',
			'    import network',
			'    wlan = network.WLAN(network.STA_IF)',
			'    try:',
			'        wlan.active(False)',
			'        time.sleep(0.3)',
			'    except Exception:',
			'        pass',
			'    wlan.active(True)',
			'    # Windows USB-Serial 延遲較高，增加初始化等待時間',
			'    time.sleep(1.5)',
			'    rows = wlan.scan()',
			'    networks = []',
			'    for row in rows:',
			"        ssid = row[0].decode() if isinstance(row[0], bytes) else str(row[0])",
			"        networks.append({'ssid': ssid, 'rssi': row[3], 'security': str(row[4]), 'channel': row[2], 'hidden': not bool(ssid)})",
			"    print(json.dumps({'networks': networks}))",
			'except Exception as exc:',
			"    print(json.dumps({'error': str(exc), 'networks': []}))",
			'',
		].join('\n');
		const result = await this.runCyberBrickPython(port, script, 20000);
		const payload = this.parseJsonLine<{ networks?: WifiNetworkSuggestion[]; error?: string }>(result.stdout);
		if (!payload) {
			throw new Error('Unable to parse CyberBrick Wi-Fi scan result');
		}
		if (payload.error) {
			throw new Error(payload.error);
		}
		return Array.isArray(payload.networks) ? payload.networks.filter(network => typeof network.ssid === 'string') : [];
	}

	async deployCyberBrickOtaAgent(port: string, agentSource: string): Promise<void> {
		await this.ensureMpremoteReady();
		const fs = require('fs');
		const tempDir = os.tmpdir();
		const sourceFile = path.join(tempDir, `cyberbrick_ota_agent_${Date.now()}_${Math.random().toString(16).slice(2)}.py`);
		fs.writeFileSync(sourceFile, agentSource, 'utf8');

		const normalizedPort = this.normalizeCOMPort(port);
		try {
			await this.interruptDevice(normalizedPort);
			
			const finalSourceFile = this.getWindowsShortPath(sourceFile);
			const args = ['connect', normalizedPort, 'resume', '+', 'fs', 'cp', finalSourceFile, ':/cyberbrick_ota_agent.py'];
			log('[blockly] 部署 CyberBrick OTA agent', 'info', { port });
			await this.execMpremote(args, 20000);
		} catch (error) {
			throw new Error(`CyberBrick OTA agent deploy failed: ${this.formatCommandError(error)}`);
		} finally {
			try {
				fs.unlinkSync(sourceFile);
			} catch {
				// 忽略清理錯誤
			}
		}
	}

	async configureCyberBrickOtaAgent(
		port: string,
		config: { deviceId: string; ssid: string; wifiPassword?: string; otaToken: string; pairingSecret: string; otaPort: number }
	): Promise<{ ipAddress?: string; agentVersion?: string; agentStarted?: boolean; agentMode?: string; agentError?: string; rcMainPatched?: boolean; rcMainError?: string }> {
		const configJson = JSON.stringify(config);
		const rcMainBootstrap = buildCyberBrickRcMainOtaBootstrap();
		// Build the script as an array of lines to guarantee spaces-only indentation
		// (template literals with TypeScript indentation mix tabs into the MicroPython source)
		const script = [
			'import json',
			'import gc',
			'import os',
			`config = json.loads(${JSON.stringify(configJson)})`,
			"with open('/cyberbrick_ota_config.py', 'w') as f:",
			"    f.write('DEVICE_ID = ' + repr(config['deviceId']) + '\\n')",
			"    f.write('SSID = ' + repr(config['ssid']) + '\\n')",
			"    f.write('WIFI_PASSWORD = ' + repr(config.get('wifiPassword') or '') + '\\n')",
			"    f.write('OTA_TOKEN = ' + repr(config['otaToken']) + '\\n')",
			"    f.write('PAIRING_SECRET = ' + repr(config['pairingSecret']) + '\\n')",
			"    f.write('OTA_PORT = ' + repr(config['otaPort']) + '\\n')",
			'# Save credentials and token before freeing config to reclaim heap for large file I/O',
			"_ssid = config.get('ssid') or ''",
			"_wifi_password = config.get('wifiPassword') or ''",
			"_ota_token = config.get('otaToken') or ''",
			'del config',
			'gc.collect()',
			'rc_main_patched = False',
			"rc_main_error = ''",
			'try:',
			`    start_marker = ${JSON.stringify(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START)}`,
			`    end_marker = ${JSON.stringify(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END)}`,
			'    def _ensure_dir(path):',
			'        try:',
			'            os.stat(path)',
			'        except OSError:',
			'            os.mkdir(path)',
			'    # Peek at the first 256 bytes to detect if bootstrap is already at the top.',
			'    try:',
			"        with open('/app/rc_main.py', 'rb') as _f:",
			'            _head = _f.read(256).decode()',
			'    except Exception:',
			"        _head = ''",
			'    if start_marker in _head:',
			'        # Bootstrap already at start of file; skip patching to conserve heap.',
			'        rc_main_patched = True',
			'    else:',
			'        # Bootstrap absent from file head; allocate bootstrap string and patch.',
			'        gc.collect()',
			`        rc_bootstrap = ${JSON.stringify(rcMainBootstrap)}`,
			'        try:',
			"            with open('/app/rc_main.py', 'r') as f:",
			'                rc_main_source = f.read()',
			'        except (OSError, MemoryError):',
			"            rc_main_source = ''",
			'        if start_marker in rc_main_source and end_marker in rc_main_source:',
			'            before, rest = rc_main_source.split(start_marker, 1)',
			'            _old, after = rest.split(end_marker, 1)',
			"            rc_main_source = before.rstrip() + '\\n\\n' + rc_bootstrap + '\\n\\n' + after.lstrip('\\n')",
			'        else:',
			"            rc_main_source = rc_bootstrap + '\\n\\n' + rc_main_source.lstrip('\\n')",
			"        _ensure_dir('/app')",
			"        with open('/app/rc_main.py', 'w') as f:",
			'            f.write(rc_main_source)',
			'        rc_main_patched = True',
			'except Exception as exc:',
			'    rc_main_error = str(exc)',
			'try:',
			'    import network, time',
			'    wlan = network.WLAN(network.STA_IF)',
			'    wlan.active(True)',
			'    if _ssid:',
			'        wlan.connect(_ssid, _wifi_password)',
			'        for _ in range(80):',
			'            if wlan.isconnected():',
			'                break',
			'            time.sleep(0.25)',
			"    ip = wlan.ifconfig()[0] if wlan.isconnected() else ''",
			'except Exception:',
			"    ip = ''",
			'agent_started = False',
			"agent_mode = ''",
			"agent_error = ''",
			'try:',
			'    import sys',
			"    if 'cyberbrick_ota_agent' in sys.modules:",
			'        try:',
			"            sys.modules['cyberbrick_ota_agent'].OTA_TOKEN = _ota_token",
			'        except Exception:',
			'            pass',
			'    import cyberbrick_ota_agent as ota_agent',
			'    start_result = ota_agent.start_background()',
			"    agent_started = bool(start_result.get('started'))",
			"    agent_mode = start_result.get('mode') or ''",
			"    ip = start_result.get('ipAddress') or ip",
			"    agent_error = start_result.get('error') or ''",
			'except Exception as exc:',
			'    agent_error = str(exc)',
			`print(json.dumps({'ipAddress': ip, 'agentVersion': ${JSON.stringify(CYBERBRICK_OTA_AGENT_TARGET_VERSION)}, 'agentStarted': agent_started, 'agentMode': agent_mode, 'agentError': agent_error, 'rcMainPatched': rc_main_patched, 'rcMainError': rc_main_error}))`,
			'',
		].join('\n');
		try {
			const result = await this.runCyberBrickPython(port, script, 30000);
			return this.parseJsonLine<{ ipAddress?: string; agentVersion?: string; agentStarted?: boolean; agentMode?: string; agentError?: string; rcMainPatched?: boolean; rcMainError?: string }>(result.stdout) || {};
		} catch (error) {
			log(`CyberBrick OTA configuration error: ${this.formatCommandError(error)}`, 'error');
			throw new Error('CyberBrick OTA configuration failed.');
		}
	}

	async removeCyberBrickOtaArtifacts(
		port: string
	): Promise<{
		removedAgent: boolean;
		removedConfig: boolean;
		rcMainPatched: boolean;
		rcMainHadBootstrap: boolean;
		rcMainError?: string;
		agentRemoveError?: string;
		configRemoveError?: string;
	}> {
		const script = `import json
import os
import gc
start_marker = ${JSON.stringify(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START)}
end_marker = ${JSON.stringify(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END)}
result = {'removedAgent': False, 'removedConfig': False, 'rcMainPatched': False, 'rcMainHadBootstrap': False}

def _exists(path):
    try:
        os.stat(path)
        return True
    except OSError:
        return False

def _unlink(path):
    fn = getattr(os, 'remove', None) or getattr(os, 'unlink', None)
    if not fn:
        raise OSError('no remove')
    fn(path)

try:
    if _exists('/app/rc_main.py'):
        with open('/app/rc_main.py', 'rb') as f:
            header = f.read(256)
        has_start = start_marker.encode() in header
        del header
        gc.collect()
        if has_start:
            result['rcMainHadBootstrap'] = True
            end_tag = end_marker.encode()
            found_after = -1
            with open('/app/rc_main.py', 'rb') as f:
                buf = b''
                file_pos = 0
                while True:
                    chunk = f.read(256)
                    if not chunk:
                        break
                    buf += chunk
                    idx = buf.find(end_tag)
                    if idx >= 0:
                        skip = idx + len(end_tag)
                        while skip < len(buf) and buf[skip] in (10, 13):
                            skip += 1
                        found_after = file_pos + skip
                        break
                    keep = len(end_tag) - 1
                    file_pos += len(buf) - keep
                    buf = buf[-keep:] if keep > 0 else b''
            del buf
            del end_tag
            gc.collect()
            if found_after >= 0:
                tmp = '/app/_rc_tmp.py'
                skip_nl = True
                with open('/app/rc_main.py', 'rb') as src:
                    src.seek(found_after)
                    with open(tmp, 'wb') as dst:
                        while True:
                            chunk = src.read(512)
                            if not chunk:
                                break
                            if skip_nl:
                                i = 0
                                while i < len(chunk) and chunk[i] in (10, 13):
                                    i += 1
                                chunk = chunk[i:]
                                if chunk:
                                    skip_nl = False
                            if chunk:
                                dst.write(chunk)
                gc.collect()
                with open(tmp, 'rb') as src2:
                    with open('/app/rc_main.py', 'w') as f:
                        while True:
                            chunk = src2.read(512)
                            if not chunk:
                                break
                            f.write(chunk.decode('utf-8'))
                _unlink(tmp)
                result['rcMainPatched'] = True
except Exception as exc:
    result['rcMainError'] = str(exc)

def _remove(path, key, error_key):
    if not _exists(path):
        result[key] = False
        return
    try:
        _unlink(path)
        result[key] = True
    except Exception as exc:
        result[key] = False
        result[error_key] = str(exc)

_remove('/cyberbrick_ota_agent.py', 'removedAgent', 'agentRemoveError')
_remove('/cyberbrick_ota_config.py', 'removedConfig', 'configRemoveError')
print(json.dumps(result))
`;
		const normalizedScript = script.replace(/\t/g, '    ');
		try {
			const result = await this.runCyberBrickPython(port, normalizedScript, 20000);
			return this.parseJsonLine<{
				removedAgent: boolean;
				removedConfig: boolean;
				rcMainPatched: boolean;
				rcMainHadBootstrap: boolean;
				rcMainError?: string;
				agentRemoveError?: string;
				configRemoveError?: string;
			}>(result.stdout) || {
				removedAgent: false,
				removedConfig: false,
				rcMainPatched: false,
				rcMainHadBootstrap: false,
			};
		} catch (error) {
			throw new Error(`CyberBrick OTA cleanup failed: ${this.formatCommandError(error)}`);
		}
	}

	/**
	 * 解析 mpremote connect list 輸出
	 * @param output mpremote 輸出
	 * @returns COM 埠清單
	 */
	private parsePortList(output: string): ComPortInfo[] {
		const ports: ComPortInfo[] = [];
		const lines = output.trim().split('\n');

		for (const line of lines) {
			// 格式：COM10 58:E6:C5:A7:76:54 303a:1001 Microsoft None
			// 或者：COM3 303a:1001 Microsoft None（某些版本）
			// 通用格式：PORT [MAC?] VID:PID MANUFACTURER DESCRIPTION

			// 嘗試匹配帶 MAC 地址的格式
			let match = line.match(/^(\S+)\s+(?:[0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5}\s+)?([0-9a-fA-F]+):([0-9a-fA-F]+)\s+(.*)$/);

			if (match) {
				const [, portPath, vid, pid, rest] = match;
				const parts = rest.trim().split(/\s+/);
				ports.push({
					path: portPath,
					vendorId: vid.toUpperCase(),
					productId: pid.toUpperCase(),
					manufacturer: parts[0] !== 'None' ? parts[0] : undefined,
					description: parts.slice(1).join(' ') || undefined,
				});
			}
		}

		return ports;
	}

	private filterPorts(ports: ComPortInfo[], filter?: 'all' | 'cyberbrick'): { filteredPorts: ComPortInfo[]; autoDetected?: string } {
		let filteredPorts = ports;
		let autoDetected: string | undefined;

		if (filter === 'cyberbrick') {
			filteredPorts = ports.filter(
				p => p.vendorId.toUpperCase() === CYBERBRICK_USB.vid && p.productId.toUpperCase() === CYBERBRICK_USB.pid
			);
			autoDetected = filteredPorts.length > 0 ? filteredPorts[0].path : undefined;
		} else {
			const cyberbrick = ports.find(
				p => p.vendorId.toUpperCase() === CYBERBRICK_USB.vid && p.productId.toUpperCase() === CYBERBRICK_USB.pid
			);
			autoDetected = cyberbrick?.path;
		}

		return { filteredPorts, autoDetected };
	}

	private parseJsonLine<T>(output: string): T | undefined {
		const lines = output
			.split(/\r?\n/)
			.map(line => line.trim())
			.filter(Boolean);
		for (let index = lines.length - 1; index >= 0; index--) {
			try {
				return JSON.parse(lines[index]) as T;
			} catch {
				// 嘗試上一行
			}
		}
		return undefined;
	}

	private async ensureMpremoteReady(): Promise<void> {
		if (!this.mpremotePath) {
			const installed = await this.checkMpremoteInstalled();
			if (!installed) {
				throw new Error('mpremote is not available');
			}
		}
	}

	/**
	 * 跨平台 shell 參數引號處理
	 * Python helpers and non-Windows mpremote use execFile argv when available;
	 * Windows mpremote still uses shell commands for resume + run / fs cp compatibility.
	 */
	private quoteShellArg(value: string): string {
		if (process.platform === 'win32') {
			// Windows paths cannot contain double quotes; reject them instead of trying to
			// escape a value that cmd.exe may parse differently across versions.
			if (/["\r\n]/.test(value)) {
				throw new Error('Windows shell argument contains unsupported characters');
			}
			return `"${value}"`;
		} else {
			// Unix shells: 使用單引號，內部單引號轉義為 '\\'
			return `'${value.replace(/'/g, `'\\''`)}'`;
		}
	}

	private buildShellCommand(executable: string, args: string[]): string {
		return [executable, ...args].map(value => this.quoteShellArg(value)).join(' ');
	}

	private buildWindowsMpremoteCommand(executable: string, args: string[]): string {
		const literalArgs = new Set(['connect', 'list', 'resume', '+', 'run', 'fs', 'cp', 'cat', 'reset']);
		return [
			this.quoteShellArg(executable),
			...args.map(arg => literalArgs.has(arg) || arg.startsWith(':/') ? arg : this.quoteShellArg(arg)),
		].join(' ');
	}

	private buildMpremoteCommand(executable: string, args: string[]): string {
		return process.platform === 'win32'
			? this.buildWindowsMpremoteCommand(executable, args)
			: this.buildShellCommand(executable, args);
	}

	/**
	 * 標準化 COM port 路徑格式
	 * mpremote 和 pyserial 可以直接處理標準的 COM{N} 格式
	 * 不使用 \\\\.\\COM{N} 前綴，避免被誤解為正則表達式轉義序列
	 */
	private normalizeCOMPort(port: string): string {
		if (process.platform !== 'win32') {
			return port;
		}
		// Windows: 確保 COM port 格式統一為大寫 COM{N}
		const comMatch = port.match(/^COM(\d+)$/i);
		if (comMatch) {
			const portNumber = parseInt(comMatch[1], 10);
			return `COM${portNumber}`;
		}
		return port;
	}

	/**
	 * Windows 平台取得檔案短路徑格式，避免特殊字符問題
	 * 如果無法取得短路徑或非 Windows 平台，則返回原路徑
	 */
	private getWindowsShortPath(filePath: string): string {
		if (process.platform !== 'win32') {
			return filePath;
		}
		try {
			const { execFileSync } = require('child_process');
			const shortPath = execFileSync(
				process.env.ComSpec || 'cmd.exe',
				['/d', '/c', 'for %I in ("%SINGULAR_BLOCKLY_SHORT_PATH_TARGET%") do @echo %~sI'],
				{
					encoding: 'utf8',
					env: {
						...process.env,
						SINGULAR_BLOCKLY_SHORT_PATH_TARGET: filePath,
					},
				}
			).trim();
			return this.isUsableWindowsPath(shortPath) && shortPath !== filePath ? shortPath : filePath;
		} catch {
			// 取得短路徑失敗時使用原路徑
			return filePath;
		}
	}

	private isUsableWindowsPath(filePath: string): boolean {
		return /^[A-Za-z]:\\[^"]+$/.test(filePath) || /^\\\\[^"]+$/.test(filePath);
	}

	private formatCommandError(error: unknown): string {
		if (error instanceof Error) {
			return this.enhanceWindowsErrorMessage(error.message);
		}
		if (error && typeof error === 'object') {
			const errorRecord = error as { error?: unknown; stdout?: unknown; stderr?: unknown };
			const parts: string[] = [];
			if (errorRecord.error instanceof Error) {
				parts.push(this.enhanceWindowsErrorMessage(errorRecord.error.message));
			} else if (typeof errorRecord.error === 'string') {
				parts.push(this.enhanceWindowsErrorMessage(errorRecord.error));
			}
			if (typeof errorRecord.stderr === 'string' && errorRecord.stderr.trim()) {
				parts.push(`stderr: ${this.truncateCommandOutput(errorRecord.stderr)}`);
			}
			if (typeof errorRecord.stdout === 'string' && errorRecord.stdout.trim()) {
				parts.push(`stdout: ${this.truncateCommandOutput(errorRecord.stdout)}`);
			}
			return parts.length > 0 ? parts.join(' | ') : 'unknown command error';
		}
		return String(error);
	}

	private truncateCommandOutput(output: string): string {
		const normalized = output.replace(/\s+/g, ' ').trim();
		return normalized.length > 500 ? `${normalized.slice(0, 500)}…` : normalized;
	}

	/**
	 * 增強 Windows 特定錯誤訊息，提供更明確的使用者提示
	 */
	private enhanceWindowsErrorMessage(message: string): string {
		if (process.platform !== 'win32') {
			return message;
		}
		
		const lowerMsg = message.toLowerCase();
		
		// Windows COM port 佔用錯誤
		if (lowerMsg.includes('permissionerror') || 
		    lowerMsg.includes('access is denied') || 
		    lowerMsg.includes('cannot access')) {
			return `${message}\n提示：COM port 可能被其他程式佔用。請關閉 Serial Monitor 或其他序列埠工具後重試。`;
		}
		
		// COM port 不存在
		if (lowerMsg.includes('could not open port') || 
		    lowerMsg.includes('no such file or directory')) {
			return `${message}\n提示：找不到指定的 COM port。請確認裝置已連接並在裝置管理員中顯示正確的 COM 編號。`;
		}
		
		return message;
	}

	/**
	 * 上傳程式到 CyberBrick
	 * @param request 上傳請求
	 * @param onProgress 進度回調
	 * @returns 上傳結果
	 */
	async upload(request: UploadRequest, onProgress?: ProgressCallback): Promise<UploadResult> {
		const startTime = Date.now();
		let port = request.port;

		// 階段 1: 準備
		onProgress?.({
			stage: 'preparing',
			progress: 0,
			message: 'Preparing...',
		});

		// 驗證主板類型
		if (request.board !== 'cyberbrick') {
			return this.createFailureResult(startTime, port || 'unknown', 'preparing', 'Only CyberBrick board is supported');
		}

		// 驗證程式碼
		if (!request.code || request.code.trim().length === 0) {
			return this.createFailureResult(startTime, port || 'unknown', 'preparing', 'Code cannot be empty');
		}

		// 階段 2: 檢查工具
		onProgress?.({
			stage: 'checking_tool',
			progress: 10,
			message: 'Checking mpremote tool...',
		});

		const hasPython = await this.checkPythonEnvironment();
		if (!hasPython) {
			return this.createFailureResult(
				startTime,
				port || 'unknown',
				'checking_tool',
				'PlatformIO Python environment not found. Please install PlatformIO first.'
			);
		}

		const hasMpremote = await this.checkMpremoteInstalled();
		if (!hasMpremote) {
			// 階段 3: 安裝工具
			onProgress?.({
				stage: 'installing_tool',
				progress: 20,
				message: 'Installing mpremote...',
			});

			const installed = await this.installMpremote(onProgress);
			if (!installed) {
				return this.createFailureResult(
					startTime,
					port || 'unknown',
					'installing_tool',
					'mpremote installation failed',
					'Please run manually: pip install mpremote'
				);
			}
		}

		// 階段 4: 連接裝置
		onProgress?.({
			stage: 'connecting',
			progress: 40,
			message: 'Detecting CyberBrick...',
		});

		// 自動偵測連接埠
		if (!port) {
			const { autoDetected } = await this.listPorts('cyberbrick');
			if (!autoDetected) {
				return this.createFailureResult(
					startTime,
					'unknown',
					'connecting',
					'CyberBrick device not found. Please ensure it is connected.'
				);
			}
			port = autoDetected;
		}

		log('[blockly] 使用連接埠', 'info', { port });

		// 階段 5: 重置裝置
		onProgress?.({
			stage: 'resetting',
			progress: 50,
			message: 'Resetting CyberBrick...',
		});

		try {
			await this.resetDevice(port);
		} catch (error) {
			return this.createFailureResult(startTime, port, 'resetting', 'Failed to reset device', this.getErrorMessage(error));
		}

		// 階段 6: 上傳程式
		onProgress?.({
			stage: 'uploading',
			progress: 70,
			message: 'Uploading program...',
		});

		try {
			await this.uploadCode(request.code, port);
		} catch (error) {
			return this.createFailureResult(startTime, port, 'uploading', 'Failed to upload program', this.getErrorMessage(error));
		}

		// 階段 7: 重啟裝置
		onProgress?.({
			stage: 'restarting',
			progress: 90,
			message: 'Restarting CyberBrick...',
		});

		try {
			await this.restartDevice(port);
		} catch (error) {
			// 重啟失敗不影響上傳結果，只記錄警告
			log('[blockly] 裝置重啟失敗（已忽略）', 'warn', error);
		}

		// 階段 8: 完成
		onProgress?.({
			stage: 'completed',
			progress: 100,
			message: 'Upload complete!',
		});

		const duration = Date.now() - startTime;
		log('[blockly] 上傳成功', 'info', { port, duration });

		return {
			success: true,
			timestamp: new Date().toISOString(),
			port,
			duration,
		};
	}

	/**
	 * 中斷裝置上正在運行的程式
	 * 使用 pyserial 直接發送 Ctrl+C 信號（經實測最可靠的方法）
	 * @param port 連接埠
	 */
	private async interruptDevice(port: string): Promise<void> {
		// 經過實際測試驗證的最佳方法：
		// 1. 使用 pyserial 發送雙重 Ctrl+C (\x03\x03) 中斷程式
		// 2. 發送 Ctrl+B (\x02) 進入正常 REPL
		// 3. 等待裝置穩定
		// 這個方法比 mpremote 的 soft-reset 更可靠，因為 soft-reset 會觸發程式重新執行

		const fs = require('fs');
		const pythonPath = this.getPythonPath();
		const tempDir = os.tmpdir();
		const scriptFile = path.join(tempDir, 'blockly_interrupt.py');

		// 寫入 Python 腳本到臨時檔案（避免命令行轉義問題）
		const normalizedPort = this.normalizeCOMPort(port);
		const serialScript = [
			'import serial',
			'import time',
			'try:',
			`    s = serial.Serial(${JSON.stringify(normalizedPort)}, 115200, timeout=2)`,
			'    # 發送雙重 Ctrl+C 中斷正在運行的程式',
			"    s.write(b'\\x03\\x03')",
			'    time.sleep(0.3)',
			'    # 發送 Ctrl+B 進入正常 REPL 模式',
			"    s.write(b'\\x02')",
			'    time.sleep(1)',
			'    s.close()',
			"    print('OK')",
			'except Exception as e:',
			"    print(f'ERROR: {e}')",
			'    exit(1)',
			'',
		].join('\n');
		fs.writeFileSync(scriptFile, serialScript, 'utf8');

		try {
			log('[blockly] 使用 pyserial 發送中斷信號', 'debug', { port, scriptFile });
			const result = await this.execExecutable(pythonPath, [scriptFile], 8000);

			if (result.stdout.includes('OK')) {
				log('[blockly] 程式已中斷，REPL 準備就緒', 'info');
			} else if (result.stdout.includes('ERROR') || result.stderr) {
				throw new Error(result.stdout + result.stderr);
			}

			// 額外等待確保穩定
			await this.delay(1000);
		} catch (error) {
			log('[blockly] pyserial 中斷失敗，嘗試硬體重置', 'warn', error);
			// 備用方案：使用 mpremote 硬體重置
			try {
				const normalizedPort = this.normalizeCOMPort(port);
				await this.execMpremote(['connect', normalizedPort, 'reset'], 5000);
				await this.delay(2000);
			} catch (resetError) {
				log('[blockly] 硬體重置也失敗', 'error', resetError);
				throw new Error('無法中斷裝置上的程式，請手動重置裝置');
			}
		} finally {
			// 清理臨時檔案
			try {
				fs.unlinkSync(scriptFile);
			} catch {
				// 忽略清理錯誤
			}
		}
	}

	/**
	 * 取得 Python 執行檔路徑
	 */
	private getPythonPath(): string {
		return this.pythonPath ?? this.getPlatformioPythonPath();
	}

	/**
	 * 帶超時的指令執行
	 * @param command 指令
	 * @param timeoutMs 超時毫秒數
	 */
	private async execWithTimeout(command: string, timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
		return this.runWithTimeout(() => this.executor.exec(command), timeoutMs);
	}

	private async execExecutable(executable: string, args: string[], timeoutMs?: number): Promise<{ stdout: string; stderr: string }> {
		const run = () => {
			if (this.executor.execFile) {
				return this.executor.execFile(executable, args);
			}
			return this.executor.exec(this.buildShellCommand(executable, args));
		};

		if (timeoutMs === undefined) {
			return run();
		}

		return this.runWithTimeout(run, timeoutMs);
	}

	private async runWithTimeout(
		run: () => Promise<{ stdout: string; stderr: string }>,
		timeoutMs: number
	): Promise<{ stdout: string; stderr: string }> {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error(`指令執行超時 (${timeoutMs}ms)`));
			}, timeoutMs);

			run()
				.then(result => {
					clearTimeout(timeoutId);
					resolve(result);
				})
				.catch(error => {
					clearTimeout(timeoutId);
					reject(error);
				});
		});
	}

	private async execMpremote(args: string[], timeoutMs?: number): Promise<{ stdout: string; stderr: string }> {
		const mpremotePath = this.mpremotePath || this.getMpremotePath();
		if (process.platform === 'win32') {
			const command = this.buildMpremoteCommand(mpremotePath, args);
			return timeoutMs === undefined ? this.executor.exec(command) : this.execWithTimeout(command, timeoutMs);
		}
		return this.execExecutable(mpremotePath, args, timeoutMs);
	}

	/**
	 * 重置裝置
	 * @param port 連接埠
	 */
	private async resetDevice(port: string): Promise<void> {
		// 中斷正在運行的程式並確認 REPL 準備就緒
		log('[blockly] 中斷裝置上正在運行的程式...', 'info');
		await this.interruptDevice(port);

		// Windows 需要額外時間讓 COM port 驅動完全釋放
		if (process.platform === 'win32') {
			await this.delay(1500);
		} else {
			await this.delay(500);
		}
	}

	/**
	 * 上傳程式碼到裝置
	 * 
	 * USB 上傳會先檢查裝置是否已設定 OTA（`cyberbrick_ota_config` 模組存在）：
	 * - 已設定 OTA → 注入 OTA bootstrap，確保裝置重啟後 OTA 功能持續運作
	 * - 未設定 OTA → 使用純淨程式碼，符合傳統 USB 燒錄語義
	 * - 檢查失敗（逾時、port busy 等）→ 保守策略：注入 bootstrap，避免已設定 OTA 的裝置失去 bootstrap
	 *   （bootstrap 含 try/except，對未設定 OTA 的裝置安全）
	 * 
	 * 對 OTA 功能的影響：
	 * - 裝置上的 OTA 配置檔和 agent 檔案不受影響
	 * - 若 USB 上傳前 OTA 已配置，bootstrap 會保留，OTA 繼續有效
	 * 
	 * @param code 程式碼
	 * @param port 連接埠
	 */
	private async uploadCode(code: string, port: string): Promise<void> {
		const fs = require('fs');
		const tempDir = os.tmpdir();
		const tempFile = path.join(tempDir, 'blockly_upload.py');

		// 檢查裝置是否已設定 OTA（檢查 /cyberbrick_ota_config.py 是否存在）
		// 失敗時採保守策略：注入 bootstrap。
		// 理由：bootstrap 已包含 try/except，對無 OTA 的裝置安全（靜默跳過）；
		// 反之若裝置有 OTA 卻因逾時/port busy 導致誤判為無 OTA，bootstrap 將被移除，OTA 功能損壞。
		let hasOtaConfig = true; // 預設保守：注入 bootstrap
		try {
			const checkScript = "try:\n    import cyberbrick_ota_config\n    print('YES')\nexcept:\n    print('NO')";
			const result = await this.runCyberBrickPython(port, checkScript, 5000);
			hasOtaConfig = result.stdout.trim().includes('YES');
			log('[blockly] OTA 設定檢查', 'debug', { hasOtaConfig });
		} catch {
			// 檢查失敗（逾時、port busy 等）→ 維持保守預設（hasOtaConfig = true）
			log('[blockly] OTA 設定檢查失敗，採保守策略：注入 bootstrap', 'warn');
		}

		// 如果已設定 OTA，則在程式碼中注入 OTA bootstrap；否則使用純淨程式碼
		const finalCode = hasOtaConfig ? withCyberBrickRcMainOtaBootstrap(code) : code;
		fs.writeFileSync(tempFile, finalCode, 'utf8');
		log('[blockly] 暫存檔已建立', 'debug', { path: tempFile, hasOtaBootstrap: hasOtaConfig });

		try {
			// 使用 resume + 避免觸發 soft-reset（這會導致程式重新執行）
			// 在 interruptDevice 之後，裝置已經在正常 REPL 模式
			const normalizedPort = this.normalizeCOMPort(port);
			const finalTempFile = this.getWindowsShortPath(tempFile);
			const args = ['connect', normalizedPort, 'resume', '+', 'fs', 'cp', finalTempFile, `:${DEVICE_PATH}`];
			const mpremotePath = this.mpremotePath || this.getMpremotePath();
			const command = this.buildMpremoteCommand(mpremotePath, args);
			log('[blockly] 執行上傳指令', 'debug', { port, normalizedPort, command });

			// Windows 平台重試機制：偵測 port busy 錯誤
			const maxRetries = process.platform === 'win32' ? 3 : 1;
			let lastError: unknown;

			for (let attempt = 1; attempt <= maxRetries; attempt++) {
				try {
					await this.execMpremote(args);
					return; // 成功上傳
				} catch (error) {
					lastError = error;
					const errorMsg = this.formatCommandError(error).toLowerCase();
					
					// 僅針對 "port busy" 類錯誤重試
					const isPortBusy = errorMsg.includes('in use') || 
					                   errorMsg.includes('access is denied') || 
					                   errorMsg.includes('permissionerror') ||
					                   errorMsg.includes('cannot access');
					
					if (isPortBusy && attempt < maxRetries) {
						log(`[blockly] COM port 忙碌，等待後重試 (${attempt}/${maxRetries})`, 'warn', { port: normalizedPort });
						await this.delay(500);
						continue;
					}
					
					// 其他錯誤或已達重試上限，立即拋出
					break;
				}
			}
			
			throw lastError;
		} finally {
			// 清理暫存檔
			try {
				fs.unlinkSync(tempFile);
			} catch {
				// 忽略清理錯誤
			}
		}
	}

	/**
	 * 重啟裝置
	 * @param port 連接埠
	 */
	private async restartDevice(port: string): Promise<void> {
		// 使用 resume + 確保不會觸發額外的 soft-reset
		const normalizedPort = this.normalizeCOMPort(port);
		const args = ['connect', normalizedPort, 'resume', '+', 'reset'];
		const mpremotePath = this.mpremotePath || this.getMpremotePath();
		const command = this.buildMpremoteCommand(mpremotePath, args);
		log('[blockly] 執行重啟指令', 'debug', { port, normalizedPort, command });
		await this.execMpremote(args);
	}

	/**
	 * 讀取裝置上的程式碼（用於備份）
	 * @param port 連接埠
	 * @returns 程式碼內容，若失敗則返回 null
	 */
	async readDeviceCode(port: string): Promise<string | null> {
		if (!this.mpremotePath) {
			const installed = await this.checkMpremoteInstalled();
			if (!installed) {
				return null;
			}
		}

		try {
			const normalizedPort = this.normalizeCOMPort(port);
			const args = ['connect', normalizedPort, 'fs', 'cat', `:${DEVICE_PATH}`];
			const mpremotePath = this.mpremotePath || this.getMpremotePath();
			const command = this.buildMpremoteCommand(mpremotePath, args);
			log('[blockly] 讀取裝置程式', 'debug', { command });
			const result = await this.execMpremote(args);
			return result.stdout;
		} catch (error) {
			log('[blockly] 讀取裝置程式失敗', 'warn', error);
			return null;
		}
	}

	/**
	 * 建立失敗結果
	 */
	private createFailureResult(startTime: number, port: string, stage: UploadStage, message: string, details?: string): UploadResult {
		log('[blockly] 上傳失敗', 'error', { stage, message, details });
		return {
			success: false,
			timestamp: new Date().toISOString(),
			port,
			duration: Date.now() - startTime,
			error: {
				stage,
				message,
				details,
			},
		};
	}

	/**
	 * 取得錯誤訊息
	 */
	private getErrorMessage(error: unknown): string {
		if (error && typeof error === 'object' && 'stderr' in error) {
			return (error as { stderr: string }).stderr;
		}
		if (error instanceof Error) {
			return error.message;
		}
		return String(error);
	}

	/**
	 * 延遲函數
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
