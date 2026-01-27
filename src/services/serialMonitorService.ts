/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { log } from './logging';
import { MicropythonUploader } from './micropythonUploader';
import { MonitorError, MonitorStartResult } from '../types/arduino';

/**
 * Serial Monitor 服務
 * 提供 CyberBrick MicroPython 裝置的串口監控功能
 */
export class SerialMonitorService {
	private terminal: vscode.Terminal | null = null;
	private currentPort: string | null = null;
	private disposables: vscode.Disposable[] = [];
	private uploader: MicropythonUploader;
	private isStoppingForUpload = false;

	private onStoppedCallback?: (reason: 'user_closed' | 'upload_started' | 'device_disconnected') => void;

	/**
	 * 建立 SerialMonitorService 實例
	 * @param workspacePath 工作區路徑
	 */
	constructor(workspacePath: string) {
		this.uploader = new MicropythonUploader(workspacePath);

		// 監聽終端機關閉事件
		this.disposables.push(
			vscode.window.onDidCloseTerminal(closedTerminal => {
				if (closedTerminal === this.terminal) {
					this.handleTerminalClosed();
				}
			})
		);
	}

	/**
	 * 啟動 Serial Monitor
	 * @returns 啟動結果
	 */
	async start(): Promise<MonitorStartResult> {
		// 若已在運行，返回成功
		if (this.terminal) {
			return { success: true, port: this.currentPort! };
		}

		// 檢查 mpremote
		const hasMpremote = await this.uploader.checkMpremoteInstalled();
		if (!hasMpremote) {
			const installed = await this.uploader.installMpremote();
			if (!installed) {
				return {
					success: false,
					port: '',
					error: {
						code: 'MPREMOTE_NOT_INSTALLED',
						message: 'mpremote 工具安裝失敗',
					},
				};
			}
		}

		// 偵測裝置
		const { autoDetected } = await this.uploader.listPorts('cyberbrick');
		if (!autoDetected) {
			return {
				success: false,
				port: '',
				error: {
					code: 'DEVICE_NOT_FOUND',
					message: '找不到 CyberBrick 裝置',
				},
			};
		}

		// 建立終端機
		const mpremotePath = this.uploader.getMpremotePath();
		this.terminal = vscode.window.createTerminal({
			name: 'CyberBrick Monitor',
			hideFromUser: false,
		});

		this.currentPort = autoDetected;
		this.terminal.show(false);

		// 先用 pyserial 發送 Ctrl+C + Ctrl+D 來中斷程式並觸發軟重置
		// 然後再進入 repl 終端模式查看輸出
		try {
			await this.resetAndStartMonitor(autoDetected, mpremotePath);
		} catch (error) {
			log('[blockly] 無法重置裝置，直接進入 repl', 'warn', error);
			// 備用方案：直接進入 repl
			setTimeout(() => {
				if (this.terminal) {
					this.terminal.sendText(`& "${mpremotePath}" connect ${autoDetected} repl`, true);
				}
			}, 500);
		}

		log('[blockly] Monitor 已啟動', 'info', { port: autoDetected });

		return { success: true, port: autoDetected };
	}

	/**
	 * 停止 Serial Monitor
	 */
	async stop(): Promise<void> {
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
			this.currentPort = null;
			log('[blockly] Monitor 已停止', 'info');
		}
	}

	/**
	 * 為上傳作業停止 Monitor
	 * 會通知 WebView 並等待 COM 埠釋放
	 */
	async stopForUpload(): Promise<void> {
		if (this.terminal) {
			this.isStoppingForUpload = true;
			this.terminal.dispose();
			this.terminal = null;
			this.currentPort = null;
			this.onStoppedCallback?.('upload_started');
			// 等待 COM 埠釋放
			await new Promise(resolve => setTimeout(resolve, 500));
			this.isStoppingForUpload = false;
		}
	}

	/**
	 * 檢查 Monitor 是否正在運行
	 * @returns 是否運行中
	 */
	isRunning(): boolean {
		return this.terminal !== null;
	}

	/**
	 * 取得當前連接的埠
	 * @returns 埠名稱或 null
	 */
	getCurrentPort(): string | null {
		return this.currentPort;
	}

	/**
	 * 註冊 Monitor 停止回調
	 * @param callback 停止時的回調函數
	 */
	onStopped(callback: (reason: 'user_closed' | 'upload_started' | 'device_disconnected') => void): void {
		this.onStoppedCallback = callback;
	}

	/**
	 * 處理終端機關閉事件
	 */
	private handleTerminalClosed(): void {
		const wasStoppingForUpload = this.isStoppingForUpload;
		this.terminal = null;
		const port = this.currentPort;
		this.currentPort = null;

		log('[blockly] Monitor 終端機已關閉', 'info', { port });

		// 如果是上傳時自動關閉，不需要再次通知（已在 stopForUpload 中處理）
		if (!wasStoppingForUpload) {
			// 判斷是使用者手動關閉還是裝置斷線
			// 注意：目前無法可靠區分，預設為使用者關閉
			this.onStoppedCallback?.('user_closed');
		}
	}

	/**
	 * 重置裝置並啟動 Monitor
	 * 使用 pyserial 發送重置命令並持續監控輸出
	 * @param port 連接埠
	 * @param mpremotePath mpremote 路徑（未使用，保留參數相容性）
	 */
	private async resetAndStartMonitor(port: string, _mpremotePath: string): Promise<void> {
		const homeDir = os.homedir();
		const isWindows = process.platform === 'win32';
		const pythonPath = isWindows
			? path.join(homeDir, '.platformio', 'penv', 'Scripts', 'python.exe')
			: path.join(homeDir, '.platformio', 'penv', 'bin', 'python');

		const tempDir = os.tmpdir();
		const scriptFile = path.join(tempDir, 'blockly_monitor.py');

		// 寫入 Python 腳本：重置後持續監控輸出
		// 這個腳本會保持 serial 連接並即時輸出，不會錯過任何 print
		const monitorScript = `import serial
import sys
import time

port = '${port}'
try:
    s = serial.Serial(port, 115200, timeout=0.1)
    
    # 發送雙重 Ctrl+C 中斷正在運行的程式
    s.write(b'\\x03\\x03')
    time.sleep(0.1)
    
    # 發送 Ctrl+D 觸發軟重置，重新執行 boot.py
    s.write(b'\\x04')
    
    print(f"Connected to {port}")
    print("Press Ctrl+C to stop, Ctrl+D to restart program")
    print("-" * 40)
    sys.stdout.flush()
    
    # 持續讀取並輸出
    while True:
        try:
            data = s.read(1024)
            if data:
                # 直接輸出原始資料，解碼為 UTF-8
                try:
                    text = data.decode('utf-8', errors='replace')
                    sys.stdout.write(text)
                    sys.stdout.flush()
                except:
                    pass
        except KeyboardInterrupt:
            # 使用者按 Ctrl+C
            s.write(b'\\x03')
            time.sleep(0.1)
            # 檢查是否按了兩次（快速連按）
            continue
        except Exception as e:
            print(f"\\nError: {e}")
            break
    
    s.close()
except serial.SerialException as e:
    print(f"Serial Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
`;
		fs.writeFileSync(scriptFile, monitorScript, 'utf8');

		// 在終端機執行 Python 腳本
		if (this.terminal) {
			this.terminal.sendText(`& "${pythonPath}" "${scriptFile}"`, true);
		}

		log('[blockly] 使用 pyserial 啟動 Monitor', 'info', { port, scriptFile });
	}

	/**
	 * 釋放資源
	 */
	dispose(): void {
		this.stop();
		this.disposables.forEach(d => d.dispose());
	}
}
