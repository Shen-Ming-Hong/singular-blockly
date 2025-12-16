/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';

// 建立輸出頻道
let outputChannel: vscode.LogOutputChannel | undefined;

// VSCode API 引用（可在測試中注入）
let vscodeApi: typeof vscode = vscode;

/**
 * 設置 VSCode API 引用（僅用於測試）
 * @param api VSCode API 實例
 */
export function _setVSCodeApi(api: typeof vscode): void {
	vscodeApi = api;
	// 重置 output channel，以便使用新的 API
	outputChannel = undefined;
}

/**
 * 獲取當前的 output channel（僅用於測試）
 */
export function _getOutputChannel(): vscode.LogOutputChannel | undefined {
	return outputChannel;
}

/**
 * 輸出日誌訊息至 VSCode 輸出窗口
 *
 * @param message 日誌訊息
 * @param level 日誌層級
 * @param args 附加參數
 */
export function log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info', ...args: any[]): void {
	// 確保輸出頻道已建立
	if (!outputChannel) {
		outputChannel = vscodeApi.window.createOutputChannel('Singular Blockly', { log: true });
	}

	// 格式化訊息
	const formattedMessage =
		args.length > 0
			? message + ' ' + args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ')
			: message;

	// 根據日誌級別使用對應的輸出方法
	switch (level) {
		case 'debug':
			outputChannel.debug(formattedMessage);
			break;
		case 'info':
			outputChannel.info(formattedMessage);
			break;
		case 'warn':
			outputChannel.warn(formattedMessage);
			break;
		case 'error':
			outputChannel.error(formattedMessage);
			break;
		default:
			outputChannel.info(formattedMessage);
	}
}

/**
 * 處理來自 WebView 的日誌訊息
 *
 * @param source 來源識別
 * @param level 日誌層級
 * @param message 日誌訊息
 * @param args 附加參數
 */
export function handleWebViewLog(source: string, level: string, message: string, ...args: any[]): void {
	const prefix = `[WebView:${source}][${level}]`;
	// 將來自 WebView 的日誌層級轉換為內部日誌層級
	const logLevel =
		level === 'debug' || level === 'info' || level === 'warn' || level === 'error'
			? (level as 'debug' | 'info' | 'warn' | 'error')
			: 'info'; // 若是未知層級則視為 info
	log(`${prefix} ${message}`, logLevel, ...args);
}

/**
 * 顯示輸出頻道
 */
export function showOutputChannel(): void {
	if (!outputChannel) {
		outputChannel = vscodeApi.window.createOutputChannel('Singular Blockly', { log: true });
	}
	outputChannel.show();
}

/**
 * 清理輸出頻道資源
 */
export function disposeOutputChannel(): void {
	if (outputChannel) {
		outputChannel.dispose();
		outputChannel = undefined;
	}
}
