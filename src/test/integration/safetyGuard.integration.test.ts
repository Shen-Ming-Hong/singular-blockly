/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { WorkspaceValidator } from '../../services/workspaceValidator';
import { SettingsManager } from '../../services/settingsManager';
import { LocaleService } from '../../services/localeService';
import { MESSAGE_KEYS } from '../../types/safetyGuard';

/**
 * Integration Tests: Safety Guard 專案類型偵測
 *
 * 目標: 驗證在不同專案類型中顯示正確的警告訊息
 * Phase 4 (User Story 2) - T014
 *
 * 測試策略:
 * - 測試 showSafetyWarning() 方法對不同專案類型的處理
 * - 驗證訊息內容正確包含專案類型
 * - 驗證未知專案類型使用通用訊息
 */
suite('Safety Guard Integration Tests - Project Type Detection', () => {
	let mockSettingsManager: sinon.SinonStubbedInstance<SettingsManager>;
	let mockLocaleService: sinon.SinonStubbedInstance<LocaleService>;
	let mockVscodeFs: any;
	let mockShowWarningMessage: sinon.SinonStub;
	let validator: WorkspaceValidator;

	setup(() => {
		// Mock SettingsManager
		mockSettingsManager = {
			readSetting: sinon.stub().resolves(false),
			updateSetting: sinon.stub().resolves(),
		} as any;

		// Mock LocaleService - 返回真實的訊息模板
		mockLocaleService = {
			getLocalizedMessage: sinon.stub().callsFake(async (key: string, defaultValue: string) => {
				const messages: Record<string, string> = {
					[MESSAGE_KEYS.SAFETY_WARNING_BODY_WITH_TYPE]:
						'偵測到這是一個 {0} 專案。在非 Blockly 專案中開啟編輯器可能會導致檔案遺失。是否繼續?',
					[MESSAGE_KEYS.SAFETY_WARNING_BODY_NO_TYPE]:
						'偵測到這可能不是 Blockly 專案。在非 Blockly 專案中開啟編輯器可能會導致檔案遺失。是否繼續?',
					[MESSAGE_KEYS.BUTTON_CONTINUE]: '繼續',
					[MESSAGE_KEYS.BUTTON_SUPPRESS]: '不再提醒',
				};
				return messages[key] || defaultValue;
			}),
		} as any;

		// Mock vscode.workspace.fs
		mockVscodeFs = {
			stat: sinon.stub().rejects(new Error('Folder not found')),
		};

		// Mock vscode.window.showWarningMessage
		// 注意: 返回 string (按鈕文字) 而非 MessageItem 物件
		mockShowWarningMessage = sinon.stub(vscode.window, 'showWarningMessage').resolves('繼續' as any);

		// 建立 validator 實例
		validator = new WorkspaceValidator('/mock/workspace', mockSettingsManager, mockLocaleService, mockVscodeFs);
	});

	teardown(() => {
		sinon.restore();
	});

	/**
	 * Scenario 1: Node.js 專案偵測
	 * 當專案類型為 Node.js 時應顯示包含 "Node.js" 的警告訊息
	 */
	test('Should show typed warning message for Node.js project', async () => {
		const action = await validator.showSafetyWarning('Node.js');

		// 驗證對話框被呼叫
		assert.ok(mockShowWarningMessage.calledOnce, 'Should show warning message');

		// 驗證訊息內容
		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('Node.js'), 'Message should include "Node.js" project type');
		assert.ok(message.includes('非 Blockly 專案'), 'Message should warn about non-Blockly project');
		assert.ok(!message.includes('{0}'), 'Message should not contain placeholder');

		// 驗證返回值
		assert.strictEqual(action, 'continue', 'Should return user action');
	});

	/**
	 * Scenario 2: Python 專案偵測
	 * 當專案類型為 Python 時應顯示包含 "Python" 的警告訊息
	 */
	test('Should show typed warning message for Python project', async () => {
		await validator.showSafetyWarning('Python');

		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('Python'), 'Message should include "Python" project type');
		assert.ok(message.includes('非 Blockly 專案'), 'Message should warn about non-Blockly project');
		assert.ok(!message.includes('{0}'), 'Message should not contain placeholder');
	});

	/**
	 * Scenario 3: Java Maven 專案偵測
	 * 當專案類型為 Java Maven 時應顯示包含 "Java Maven" 的警告訊息
	 */
	test('Should show typed warning message for Java Maven project', async () => {
		await validator.showSafetyWarning('Java Maven');

		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('Java Maven'), 'Message should include "Java Maven" project type');
		assert.ok(message.includes('非 Blockly 專案'), 'Message should warn about non-Blockly project');
		assert.ok(!message.includes('{0}'), 'Message should not contain placeholder');
	});

	/**
	 * Scenario 4: 未知專案類型
	 * 當專案類型未知時應顯示通用警告訊息(不包含特定專案類型)
	 */
	test('Should show generic warning message for unknown project type', async () => {
		await validator.showSafetyWarning(undefined);

		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('可能不是 Blockly 專案'), 'Message should show generic warning');
		assert.ok(!message.includes('{0}'), 'Message should not contain placeholder');
		assert.ok(!message.includes('Node.js'), 'Message should not mention Node.js');
		assert.ok(!message.includes('Python'), 'Message should not mention Python');
		assert.ok(!message.includes('Java'), 'Message should not mention Java');
	});

	/**
	 * Scenario 5: Java Gradle 專案
	 * 當專案類型為 Java Gradle 時應顯示包含 "Java Gradle" 的警告訊息
	 */
	test('Should show typed warning message for Java Gradle project', async () => {
		await validator.showSafetyWarning('Java Gradle');

		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('Java Gradle'), 'Message should include "Java Gradle" project type');
	});

	/**
	 * Scenario 6: .NET 專案
	 * 當專案類型為 .NET 時應顯示包含 ".NET" 的警告訊息
	 */
	test('Should show typed warning message for .NET project', async () => {
		await validator.showSafetyWarning('.NET');

		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('.NET'), 'Message should include ".NET" project type');
	});

	/**
	 * Scenario 7: Go 專案
	 * 當專案類型為 Go 時應顯示包含 "Go" 的警告訊息
	 */
	test('Should show typed warning message for Go project', async () => {
		await validator.showSafetyWarning('Go');

		const callArgs = mockShowWarningMessage.firstCall.args;
		const message = callArgs[0] as string;

		assert.ok(message.includes('Go'), 'Message should include "Go" project type');
	});

	/**
	 * Scenario 8: 訊息模板驗證
	 * 確認使用了正確的訊息鍵(WITH_TYPE vs NO_TYPE)
	 */
	test('Should use correct message key based on project type presence', async () => {
		// 有專案類型 - 應使用 WITH_TYPE 模板
		await validator.showSafetyWarning('Node.js');
		assert.ok(
			mockLocaleService.getLocalizedMessage.calledWith(MESSAGE_KEYS.SAFETY_WARNING_BODY_WITH_TYPE),
			'Should use WITH_TYPE template when project type is provided'
		);

		// 重置 mock
		mockLocaleService.getLocalizedMessage.resetHistory();

		// 無專案類型 - 應使用 NO_TYPE 模板
		await validator.showSafetyWarning(undefined);
		assert.ok(
			mockLocaleService.getLocalizedMessage.calledWith(MESSAGE_KEYS.SAFETY_WARNING_BODY_NO_TYPE),
			'Should use NO_TYPE template when project type is undefined'
		);
	});

	/**
	 * Scenario 9: 使用者互動 - 所有按鈕選項
	 * 驗證三種使用者選擇都能正確處理
	 */
	test('Should handle all user choices correctly with typed message', async () => {
		// 測試 "繼續" 按鈕
		mockShowWarningMessage.resolves('繼續' as any);
		let action = await validator.showSafetyWarning('Python');
		assert.strictEqual(action, 'continue', 'Should return "continue" for continue button');

		// 測試 "不再提醒" 按鈕
		mockShowWarningMessage.resolves('不再提醒' as any);
		action = await validator.showSafetyWarning('Python');
		assert.strictEqual(action, 'suppress', 'Should return "suppress" for suppress button');

		// 測試關閉對話框 (undefined)
		mockShowWarningMessage.resolves(undefined as any);
		action = await validator.showSafetyWarning('Python');
		assert.strictEqual(action, 'cancel', 'Should return "cancel" for dialog dismissal');
	});
});
