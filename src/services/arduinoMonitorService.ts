/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { log } from './logging';
import { MonitorStartResult, MonitorStopReason, isEsp32Board } from '../types/arduino';

/**
 * 預設 Baud Rate
 * 與積木生成的 Serial.begin(9600) 保持一致
 */
const DEFAULT_BAUD_RATE = 9600;

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
	private onStoppedCallback: ((reason: MonitorStopReason) => void) | null = null;
	private disposables: vscode.Disposable[] = [];

	/**
	 * 建立 ArduinoMonitorService 實例
	 * @param workspacePath 工作區路徑
	 */
	constructor(private workspacePath: string) {
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

		// 若已在運行，返回成功
		if (this.isRunningFlag) {
			log('[arduino-monitor] Monitor 已在運行中', 'info', { port: this.currentPort });
			return { success: true, port: this.currentPort! };
		}

		try {
			// 取得 baud rate
			const baudRate = this.getBaudRate(projectPath);

			// 建構 pio device monitor 命令
			const args = ['pio', 'device', 'monitor', '--baud', String(baudRate), '--project-dir', projectPath];

			// ESP32 系列自動啟用 exception decoder
			if (isEsp32Board(board)) {
				args.push('--filter', 'esp32_exception_decoder');
				log('[arduino-monitor] ESP32 系列，啟用 exception decoder', 'info');
			}

			// 建立終端機
			this.terminal = vscode.window.createTerminal({
				name: 'Serial Monitor',
				cwd: projectPath,
			});

			this.terminal.sendText(args.join(' '));
			this.terminal.show(true);

			this.isRunningFlag = true;
			this.currentPort = 'auto'; // PlatformIO 自動偵測
			this.currentBoard = board;

			log('[arduino-monitor] Serial Monitor 已啟動', 'info', { board, baudRate });

			return { success: true, port: 'auto' };
		} catch (error) {
			log('[arduino-monitor] 啟動 Serial Monitor 失敗', 'error', error);
			return {
				success: false,
				port: '',
				error: {
					code: 'UNKNOWN',
					message: error instanceof Error ? error.message : String(error),
				},
			};
		}
	}

	/**
	 * 停止 Serial Monitor
	 */
	async stop(): Promise<void> {
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
		}
		this.isRunningFlag = false;
		this.currentPort = null;
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
			await this.stop();
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

		log('[arduino-monitor] Monitor 終端機已關閉', 'info', { port });

		// 通知回調（如果不是上傳時關閉的）
		this.onStoppedCallback?.('user_closed');
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
