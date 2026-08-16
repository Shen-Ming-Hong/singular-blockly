/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { log } from './logging';
import { createExecFilePromise } from './platformioProcess';
import {
	PlatformioInvocation,
	parsePlatformioCustomPath,
	resolvePlatformioInvocation,
} from './platformioInvocationResolver';
import { MonitorStartResult, MonitorStopReason, isEsp32Board } from '../types/arduino';
import { CoreEnvironmentManager } from './coreEnvironmentManager';

/**
 * 預設 Baud Rate
 * 與積木生成的 Serial.begin(9600) 保持一致
 */
const DEFAULT_BAUD_RATE = 9600;
const PROCESS_START_TIMEOUT_MS = 5000;

interface MonitorInvocation {
	command: string;
	prefixArgs: readonly string[];
	env?: Readonly<NodeJS.ProcessEnv>;
}

type SpawnMonitorProcess = (
	command: string,
	args: readonly string[],
	options: { cwd: string; env: NodeJS.ProcessEnv; shell: false; windowsHide: true }
) => ChildProcessWithoutNullStreams;

export interface ArduinoMonitorServiceOptions {
	resolvePlatformio?: () => Promise<PlatformioInvocation | null>;
	coreEnvironmentManager?: CoreEnvironmentManager;
	spawnProcess?: SpawnMonitorProcess;
	isWorkspaceTrusted?: () => boolean;
}

class ArduinoMonitorPseudoterminal implements vscode.Pseudoterminal {
	private readonly writeEmitter = new vscode.EventEmitter<string>();
	private readonly closeEmitter = new vscode.EventEmitter<number>();
	private opened = false;
	private bufferedOutput: string[] = [];
	readonly onDidWrite = this.writeEmitter.event;
	readonly onDidClose = this.closeEmitter.event;

	constructor(private readonly child: ChildProcessWithoutNullStreams) {
		child.stdout.on('data', chunk => this.write(String(chunk)));
		child.stderr.on('data', chunk => this.write(String(chunk)));
		child.once('exit', code => this.closeEmitter.fire(code ?? 1));
		child.once('error', error => this.write(`${error.message}\r\n`));
	}

	open(): void {
		this.opened = true;
		for (const output of this.bufferedOutput) {this.writeEmitter.fire(output);}
		this.bufferedOutput = [];
	}

	close(): void {
		if (this.child.exitCode === null && !this.child.killed) {this.child.kill();}
	}

	private write(value: string): void {
		const output = value.replace(/\r?\n/g, '\r\n');
		if (this.opened) {this.writeEmitter.fire(output);}
		else {this.bufferedOutput.push(output);}
	}
}

/**
 * Arduino Serial Monitor 服務
 * 使用 PlatformIO CLI 的 pio device monitor 命令
 */
export class ArduinoMonitorService {
	private terminal: vscode.Terminal | null = null;
	private isRunningFlag = false;
	private currentPort: string | null = null;
	private currentBoard: string | null = null;
	private wasRunningBeforeUpload = false;
	private isStoppingForUpload = false;
	private onStoppedCallback: ((reason: MonitorStopReason) => void) | null = null;
	private disposables: vscode.Disposable[] = [];
	private readonly resolvePlatformio: () => Promise<PlatformioInvocation | null>;
	private readonly coreEnvironmentManager?: CoreEnvironmentManager;
	private readonly spawnProcess: SpawnMonitorProcess;
	private readonly isWorkspaceTrusted: () => boolean;
	private activeProcess: ChildProcessWithoutNullStreams | null = null;

	/**
	 * 建立 ArduinoMonitorService 實例
	 * @param workspacePath 工作區路徑
	 */
	constructor(
		private workspacePath: string,
		optionsOrResolver: ArduinoMonitorServiceOptions | (() => Promise<PlatformioInvocation | null>) = {}
	) {
		const options = typeof optionsOrResolver === 'function'
			? { resolvePlatformio: optionsOrResolver }
			: optionsOrResolver;
		this.coreEnvironmentManager = options.coreEnvironmentManager;
		this.spawnProcess = options.spawnProcess ?? ((command, args, processOptions) => spawn(command, args, processOptions));
		this.isWorkspaceTrusted = options.isWorkspaceTrusted ?? (() => vscode.workspace.isTrusted !== false);
		this.resolvePlatformio = options.resolvePlatformio ?? (async () => {
			const customPath = vscode.workspace.getConfiguration('platformio-ide').get<unknown>('customPATH');
			const resolution = await resolvePlatformioInvocation({
				existsSync: fs.existsSync,
				probe: createExecFilePromise,
				customPathEntries: parsePlatformioCustomPath(customPath),
			});
			return resolution.invocation;
		});

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
	 * @param board 開發板類型
	 * @param workspacePath 專案目錄路徑（可選，使用建構時的路徑）
	 * @returns 啟動結果
	 */
	async start(board: string, workspacePath?: string): Promise<MonitorStartResult> {
		const projectPath = workspacePath || this.workspacePath;
		if (!this.isWorkspaceTrusted()) {
			return { success: false, port: '', error: { code: 'WORKSPACE_UNTRUSTED', message: 'Trust this workspace before starting device processes.' } };
		}

		// 若已在運行，返回成功
		if (this.isRunningFlag) {
			log('[arduino-monitor] Monitor 已在運行中', 'info', { port: this.currentPort });
			return { success: true, port: this.currentPort! };
		}

		try {
			const invocation = await this.resolveInvocation(projectPath);
			if (!invocation) {
				return {
					success: false,
					port: '',
					error: {
						code: 'PIO_NOT_FOUND',
						message: 'PlatformIO Core is unavailable.',
					},
				};
			}

			// 取得 baud rate
			const baudRate = this.getBaudRate(projectPath);

			// 建構 pio device monitor 命令
			const args = ['device', 'monitor', '--baud', String(baudRate), '--project-dir', projectPath];

			// ESP32 系列自動啟用 exception decoder
			if (isEsp32Board(board)) {
				args.push('--filter', 'esp32_exception_decoder');
				log('[arduino-monitor] ESP32 系列，啟用 exception decoder', 'info');
			}

			const child = this.spawnProcess(invocation.command, [...invocation.prefixArgs, ...args], {
				cwd: projectPath,
				env: { ...process.env, ...invocation.env },
				shell: false,
				windowsHide: true,
			});
			await this.waitForProcessStart(child);
			this.activeProcess = child;
			const pty = new ArduinoMonitorPseudoterminal(child);

			// 以 Pseudoterminal 顯示非 shell 子程序輸出。
			this.terminal = vscode.window.createTerminal({
				name: 'Serial Monitor',
				pty,
			});
			this.terminal.show(true);

			this.isRunningFlag = true;
			this.currentPort = 'auto'; // PlatformIO 自動偵測
			this.currentBoard = board;

			log('[arduino-monitor] Serial Monitor 已啟動', 'info', { board, baudRate });

			return { success: true, port: 'auto' };
		} catch (error) {
			log('[arduino-monitor] 啟動 Serial Monitor 失敗', 'error', { code: this.errorCode(error) });
			return {
				success: false,
				port: '',
				error: {
					code: 'CONNECTION_FAILED',
					message: 'Unable to start the serial monitor process.',
				},
			};
		}
	}

	/**
	 * 停止 Serial Monitor
	 */
	async stop(): Promise<void> {
		const termination = this.terminateActiveProcess();
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
		}
		this.isRunningFlag = false;
		this.currentPort = null;
		await termination;
		log('[arduino-monitor] Monitor 已停止', 'info');
	}

	/**
	 * 為上傳作業停止 Monitor
	 * 會記錄當前狀態並等待 COM 埠釋放
	 */
	async stopForUpload(): Promise<void> {
		this.wasRunningBeforeUpload = this.isRunningFlag;

		if (this.isRunningFlag) {
			log('[arduino-monitor] 為上傳作業停止 Monitor', 'info');
			this.isStoppingForUpload = true;
			await this.stop();
			this.isStoppingForUpload = false;
			this.onStoppedCallback?.('upload_started');
			// 等待 COM 埠釋放
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}

	/**
	 * 上傳成功後條件性重啟 Monitor
	 * @param board 開發板類型
	 * @param workspacePath 專案目錄路徑
	 */
	async restartAfterUpload(board: string, workspacePath: string): Promise<void> {
		if (this.wasRunningBeforeUpload) {
			log('[arduino-monitor] 上傳成功，重啟 Monitor', 'info');
			await this.start(board, workspacePath);
		}
		this.wasRunningBeforeUpload = false;
	}

	/**
	 * 檢查 Monitor 是否正在運行
	 * @returns 是否運行中
	 */
	isRunning(): boolean {
		return this.isRunningFlag;
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
	onStopped(callback: (reason: MonitorStopReason) => void): void {
		this.onStoppedCallback = callback;
	}

	/**
	 * 處理終端機關閉事件
	 */
	private handleTerminalClosed(): void {
		const port = this.currentPort;
		this.terminal = null;
		this.isRunningFlag = false;
		this.currentPort = null;
		this.activeProcess = null;

		log('[arduino-monitor] Monitor 終端機已關閉', 'info', { port });

		// 通知回調（如果不是上傳時關閉的，避免雙重回調）
		if (!this.isStoppingForUpload) {
			this.onStoppedCallback?.('user_closed');
		}
	}

	private async resolveInvocation(projectPath: string): Promise<MonitorInvocation | null> {
		if (!this.coreEnvironmentManager) {return this.resolvePlatformio();}
		const selection = await this.coreEnvironmentManager.getEnvironment('arduino', projectPath);
		return selection.selected?.invocation ?? null;
	}

	private async waitForProcessStart(child: ChildProcessWithoutNullStreams): Promise<void> {
		if (child.pid !== undefined) {return;}
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				cleanup();
				if (!child.killed) {child.kill();}
				reject(new Error('Serial monitor process did not start in time'));
			}, PROCESS_START_TIMEOUT_MS);
			const onSpawn = () => {cleanup(); resolve();};
			const onError = (error: Error) => {cleanup(); reject(error);};
			const cleanup = () => {
				clearTimeout(timeout);
				child.off('spawn', onSpawn);
				child.off('error', onError);
			};
			child.once('spawn', onSpawn);
			child.once('error', onError);
		});
	}

	private async terminateActiveProcess(): Promise<void> {
		const child = this.activeProcess;
		this.activeProcess = null;
		if (!child || child.exitCode !== null) {return;}
		await new Promise<void>(resolve => {
			let settled = false;
			const finish = () => {
				if (settled) {return;}
				settled = true;
				clearTimeout(timeout);
				child.off('close', finish);
				resolve();
			};
			const timeout = setTimeout(() => {
				if (child.exitCode === null) {child.kill('SIGKILL');}
				finish();
			}, PROCESS_START_TIMEOUT_MS);
			timeout.unref();
			child.once('close', finish);
			if (!child.killed) {child.kill();}
		});
	}

	private errorCode(error: unknown): string {
		return typeof error === 'object' && error !== null && 'code' in error
			? String((error as { code?: unknown }).code ?? 'unknown')
			: 'unknown';
	}

	/**
	 * 從 platformio.ini 讀取 baud rate
	 * @param workspacePath 專案目錄路徑
	 * @returns baud rate 值
	 */
	private getBaudRate(workspacePath: string): number {
		const iniPath = path.join(workspacePath, 'platformio.ini');

		try {
			if (!fs.existsSync(iniPath)) {
				log('[arduino-monitor] platformio.ini 不存在，使用預設 baud rate', 'info', { baudRate: DEFAULT_BAUD_RATE });
				return DEFAULT_BAUD_RATE;
			}

			const content = fs.readFileSync(iniPath, 'utf-8');
			const match = content.match(/monitor_speed\s*=\s*(\d+)/);

			if (match) {
				const baud = parseInt(match[1], 10);
				log('[arduino-monitor] 從 platformio.ini 讀取 baud rate', 'info', { baudRate: baud });
				return baud;
			}
		} catch (error) {
			log('[arduino-monitor] 解析 platformio.ini 失敗，使用預設值', 'warn', error);
		}

		return DEFAULT_BAUD_RATE;
	}

	/**
	 * 釋放資源
	 */
	dispose(): void {
		this.stop();
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}
