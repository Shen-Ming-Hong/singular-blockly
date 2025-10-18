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
import { log, handleWebViewLog, showOutputChannel, disposeOutputChannel, _setVSCodeApi, _getOutputChannel } from '../services/logging';

describe('Logging Service', () => {
	let vscodeMock: VSCodeMock;

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 準備 vscode 模擬物件
		vscodeMock = new VSCodeMock();

		// 注入 mock 到 logging service
		_setVSCodeApi(vscodeMock);

		// 確保每次測試開始時 output channel 是乾淨的
		vscodeMock.resetOutputChannel();
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		// 先釋放 output channel
		disposeOutputChannel();

		// 清理
		sinon.restore();
	});

	it('should create output channel and log messages', () => {
		// 測試日誌輸出
		log('Test message', 'info');

		// 獲取實際創建的 output channel
		const outputChannel = _getOutputChannel();

		// 驗證輸出頻道是否被建立且調用正確的方法
		assert(vscodeMock.window.createOutputChannel.calledOnce);
		assert(outputChannel.info.calledWith('Test message'));
	});

	it('should log messages with different levels', () => {
		// 測試各種日誌級別
		log('Debug message', 'debug');
		log('Info message', 'info');
		log('Warning message', 'warn');
		log('Error message', 'error');

		const outputChannel = _getOutputChannel();

		// 驗證每個級別的日誌都正確調用
		assert(outputChannel.debug.calledWith('Debug message'));
		assert(outputChannel.info.calledWith('Info message'));
		assert(outputChannel.warn.calledWith('Warning message'));
		assert(outputChannel.error.calledWith('Error message'));
	});

	it('should format additional arguments', () => {
		// 測試帶有額外參數的日誌
		log('Message with args', 'info', 123, { key: 'value' });

		const outputChannel = _getOutputChannel();

		// 驗證參數是否被正確格式化
		assert(outputChannel.info.calledWith('Message with args 123 {"key":"value"}'));
	});

	it('should handle WebView logs with source prefix', () => {
		// 測試處理來自 WebView 的日誌
		handleWebViewLog('blockly', 'info', 'WebView message');

		const outputChannel = _getOutputChannel();

		// 驗證 WebView 日誌前綴和訊息
		assert(outputChannel.info.calledWith('[WebView:blockly][info] WebView message'));
	});

	it('should show output channel when requested', () => {
		// 測試顯示輸出頻道
		showOutputChannel();

		const outputChannel = _getOutputChannel();

		// 驗證輸出頻道是否顯示
		assert(outputChannel.show.calledOnce);
	});

	it('should dispose output channel', () => {
		// 首先確保頻道被建立
		log('Test', 'info');

		const outputChannel = _getOutputChannel();

		// 測試釋放輸出頻道
		disposeOutputChannel();

		// 驗證釋放方法被調用
		assert(outputChannel.dispose.calledOnce);
	});
});
