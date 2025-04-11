/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-nocheck
/* 暫時禁用 TypeScript 型別檢查，以便測試能夠執行
 * 這是一個臨時措施，在後續重構中應當逐步解決型別問題
 */

import assert = require('assert');
import * as sinon from 'sinon';
import { VSCodeMock } from './helpers/mocks';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { log, handleWebViewLog, showOutputChannel, disposeOutputChannel } from '../services/logging';

describe('Logging Service', () => {
	let vscodeMock: VSCodeMock;
	let originalVscode: any;
	let outputChannelMock: any;

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 備份原始 vscode 模組
		originalVscode = (global as any).vscode;

		// 準備 vscode 模擬物件
		vscodeMock = new VSCodeMock();
		outputChannelMock = vscodeMock.window.createOutputChannel();

		// 替換全域的 vscode 為模擬物件
		(global as any).vscode = vscodeMock;
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		// 還原原始的 vscode 模組
		(global as any).vscode = originalVscode;

		// 清理
		sinon.restore();
	});

	it('should create output channel and log messages', () => {
		// 測試日誌輸出
		log('Test message', 'info');

		// 驗證輸出頻道是否被建立且調用正確的方法
		assert(vscodeMock.window.createOutputChannel.calledOnce);
		assert(outputChannelMock.info.calledWith('Test message'));
	});

	it('should log messages with different levels', () => {
		// 測試各種日誌級別
		log('Debug message', 'debug');
		log('Info message', 'info');
		log('Warning message', 'warn');
		log('Error message', 'error');

		// 驗證每個級別的日誌都正確調用
		assert(outputChannelMock.debug.calledWith('Debug message'));
		assert(outputChannelMock.info.calledWith('Info message'));
		assert(outputChannelMock.warn.calledWith('Warning message'));
		assert(outputChannelMock.error.calledWith('Error message'));
	});

	it('should format additional arguments', () => {
		// 測試帶有額外參數的日誌
		log('Message with args', 'info', 123, { key: 'value' });

		// 驗證參數是否被正確格式化
		assert(outputChannelMock.info.calledWith('Message with args 123 {"key":"value"}'));
	});

	it('should handle WebView logs with source prefix', () => {
		// 測試處理來自 WebView 的日誌
		handleWebViewLog('blockly', 'info', 'WebView message');

		// 驗證 WebView 日誌前綴和訊息
		assert(outputChannelMock.info.calledWith('[WebView:blockly][info] WebView message'));
	});

	it('should show output channel when requested', () => {
		// 測試顯示輸出頻道
		showOutputChannel();

		// 驗證輸出頻道是否顯示
		assert(outputChannelMock.show.calledOnce);
	});

	it('should dispose output channel', () => {
		// 首先確保頻道被建立
		log('Test', 'info');

		// 測試釋放輸出頻道
		disposeOutputChannel();

		// 驗證釋放方法被調用
		assert(outputChannelMock.dispose.calledOnce);
	});
});
