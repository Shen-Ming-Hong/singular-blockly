/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { WorkspaceValidator } from '../../services/workspaceValidator';
import { SettingsManager } from '../../services/settingsManager';
import { LocaleService } from '../../services/localeService';
import { WorkspaceValidationResult, SETTING_KEY, BLOCKLY_FOLDER_NAME, MESSAGE_KEYS } from '../../types/safetyGuard';

/**
 * 測試套件: WorkspaceValidator
 *
 * 涵蓋範圍:
 * 1. validateWorkspace() - 4 種情境
 * 2. showSafetyWarning() - 6 種對話框回應
 * 3. getUserPreference() - 2 種情境
 * 4. saveUserPreference() - 2 種情境
 * 5. 整合場景 - 完整流程測試
 * 6. 錯誤處理 - 異常情境
 *
 * 目標: 100% 程式碼覆蓋率
 */

suite('WorkspaceValidator Tests', () => {
	let sandbox: sinon.SinonSandbox;
	let mockSettingsManager: sinon.SinonStubbedInstance<SettingsManager>;
	let mockLocaleService: sinon.SinonStubbedInstance<LocaleService>;
	let mockShowWarningMessage: sinon.SinonStub;
	let mockVscodeFs: { stat: sinon.SinonStub };

	const testWorkspacePath = '/test/workspace';

	setup(() => {
		sandbox = sinon.createSandbox();

		// Mock SettingsManager
		mockSettingsManager = sandbox.createStubInstance(SettingsManager);

		// Mock LocaleService
		mockLocaleService = sandbox.createStubInstance(LocaleService);
		mockLocaleService.getLocalizedMessage.callsFake(async (key: string, ...args: any[]) => args[0] || key);

		// Mock vscode.window.showWarningMessage (對話框)
		mockShowWarningMessage = sandbox.stub(vscode.window, 'showWarningMessage');

		// Mock VSCodeFileSystemLike (不直接 stub vscode.workspace.fs)
		mockVscodeFs = {
			stat: sandbox.stub(),
		};
	});

	teardown(() => {
		sandbox.restore();
	});

	suite('validateWorkspace()', () => {
		test('Should identify Blockly project (blockly/ folder exists)', async () => {
			// 模擬 blockly/ 資料夾存在
			mockVscodeFs.stat.resolves({} as vscode.FileStat);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.validateWorkspace();

			assert.strictEqual(result.isBlocklyProject, true, 'Should be identified as Blockly project');
			assert.strictEqual(result.shouldShowWarning, false, 'Should not show warning for Blockly project');
			assert.strictEqual(result.workspacePath, testWorkspacePath);
		});

		test('Should identify non-Blockly project with detected type (Node.js)', async () => {
			// 模擬 blockly/ 資料夾不存在
			mockVscodeFs.stat.rejects(new Error('Folder not found'));

			// 模擬工作區有 package.json (Node.js 專案)
			const fsStub = sandbox.stub(require('fs'), 'existsSync');
			fsStub.withArgs(testWorkspacePath).returns(true);
			fsStub.withArgs(sinon.match(/package\.json$/)).returns(true);
			fsStub.returns(false);

			// 模擬使用者未選擇不再提醒
			mockSettingsManager.readSetting.resolves(false);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.validateWorkspace();

			assert.strictEqual(result.isBlocklyProject, false, 'Should not be Blockly project');
			assert.strictEqual(result.projectType, 'Node.js', 'Should detect Node.js project');
			assert.strictEqual(result.shouldShowWarning, true, 'Should show warning');
			assert.strictEqual(result.suppressWarning, false, 'Should not suppress warning');
		});

		test('Should not show warning if user suppressed (suppressWarning = true)', async () => {
			// 模擬 blockly/ 資料夾不存在
			mockVscodeFs.stat.rejects(new Error('Folder not found'));

			// 模擬使用者選擇不再提醒
			mockSettingsManager.readSetting.resolves(true);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.validateWorkspace();

			assert.strictEqual(result.isBlocklyProject, false, 'Should not be Blockly project');
			assert.strictEqual(result.shouldShowWarning, false, 'Should not show warning due to user preference');
			assert.strictEqual(result.suppressWarning, true, 'Should indicate suppression active');
		});

		test('Should handle invalid workspace path gracefully', async () => {
			const validator = new WorkspaceValidator('', mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.validateWorkspace();

			assert.strictEqual(result.isBlocklyProject, false);
			assert.strictEqual(result.shouldShowWarning, false, 'Should not show warning for invalid path');
			assert.strictEqual(result.projectType, undefined);
		});
	});

	suite('showSafetyWarning()', () => {
		let validator: WorkspaceValidator;

		setup(() => {
			validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
		});

		test('Should return "continue" when user clicks continue button', async () => {
			mockShowWarningMessage.resolves('繼續');

			const result = await validator.showSafetyWarning();

			assert.strictEqual(result, 'continue', 'Should return continue action');
			assert.ok(mockShowWarningMessage.calledOnce, 'Should show warning dialog');
		});

		test('Should return "cancel" when user clicks cancel button', async () => {
			mockShowWarningMessage.resolves('取消');

			const result = await validator.showSafetyWarning();

			assert.strictEqual(result, 'cancel', 'Should return cancel action');
		});

		test('Should return "suppress" when user clicks suppress button', async () => {
			mockShowWarningMessage.resolves('不再提醒');

			const result = await validator.showSafetyWarning();

			assert.strictEqual(result, 'suppress', 'Should return suppress action');
		});

		test('Should return "cancel" when user closes dialog (ESC or X)', async () => {
			mockShowWarningMessage.resolves(undefined);

			const result = await validator.showSafetyWarning();

			assert.strictEqual(result, 'cancel', 'Should treat close as cancel');
		});

		test('Should show message with project type when provided', async () => {
			mockShowWarningMessage.resolves('繼續');

			await validator.showSafetyWarning('Node.js');

			const callArgs = mockShowWarningMessage.firstCall.args;
			const message = callArgs[0] as string;
			assert.ok(message.includes('Node.js'), 'Message should include project type');
		});

		test('Should show generic message when project type not provided', async () => {
			mockShowWarningMessage.resolves('繼續');

			await validator.showSafetyWarning();

			const callArgs = mockShowWarningMessage.firstCall.args;
			const message = callArgs[0] as string;
			assert.ok(message.length > 0, 'Should show generic message');
			// 不應包含 {0} 占位符
			assert.ok(!message.includes('{0}'), 'Should not contain placeholder');
		});
	});

	suite('getUserPreference()', () => {
		test('Should return user preference (suppress = true)', async () => {
			mockSettingsManager.readSetting.resolves(true);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.getUserPreference();

			assert.strictEqual(result, true, 'Should return true when user suppressed warnings');
			assert.ok(mockSettingsManager.readSetting.calledWith(SETTING_KEY, false), 'Should read correct setting');
		});

		test('Should return false by default', async () => {
			mockSettingsManager.readSetting.resolves(false);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.getUserPreference();

			assert.strictEqual(result, false, 'Should return false by default');
		});

		test('Should handle read errors gracefully', async () => {
			mockSettingsManager.readSetting.rejects(new Error('Read error'));

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.getUserPreference();

			assert.strictEqual(result, false, 'Should return false on error');
		});
	});

	suite('saveUserPreference()', () => {
		test('Should save suppress preference (true)', async () => {
			mockSettingsManager.updateSetting.resolves();

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			await validator.saveUserPreference(true);

			assert.ok(mockSettingsManager.updateSetting.calledWith(SETTING_KEY, true), 'Should save suppress=true');
		});

		test('Should save suppress preference (false)', async () => {
			mockSettingsManager.updateSetting.resolves();

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			await validator.saveUserPreference(false);

			assert.ok(mockSettingsManager.updateSetting.calledWith(SETTING_KEY, false), 'Should save suppress=false');
		});

		test('Should propagate save errors', async () => {
			mockSettingsManager.updateSetting.rejects(new Error('Write error'));

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);

			await assert.rejects(async () => await validator.saveUserPreference(true), /Write error/, 'Should throw error on save failure');
		});
	});

	suite('Integration Scenarios', () => {
		test('Complete flow: Non-Blockly project → Show warning → User continues', async () => {
			// Setup: 非 Blockly 專案
			mockVscodeFs.stat.rejects(new Error('Folder not found'));
			mockSettingsManager.readSetting.resolves(false);

			// Mock Node.js 專案
			const fsStub = sandbox.stub(require('fs'), 'existsSync');
			fsStub.withArgs(testWorkspacePath).returns(true);
			fsStub.withArgs(sinon.match(/package\.json$/)).returns(true);
			fsStub.returns(false);

			// Mock 使用者點擊 "繼續"
			mockShowWarningMessage.resolves('繼續');

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);

			// Step 1: 驗證工作區
			const validationResult = await validator.validateWorkspace();
			assert.strictEqual(validationResult.isBlocklyProject, false);
			assert.strictEqual(validationResult.shouldShowWarning, true);
			assert.strictEqual(validationResult.projectType, 'Node.js');

			// Step 2: 顯示警告
			const action = await validator.showSafetyWarning(validationResult.projectType);
			assert.strictEqual(action, 'continue', 'User should continue');
		});

		test('Complete flow: Non-Blockly project → Show warning → User suppresses', async () => {
			// Setup
			mockVscodeFs.stat.rejects(new Error('Folder not found'));
			mockSettingsManager.readSetting.resolves(false);
			mockSettingsManager.updateSetting.resolves();
			mockShowWarningMessage.resolves('不再提醒');

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);

			// Step 1: 驗證
			const validationResult = await validator.validateWorkspace();
			assert.strictEqual(validationResult.shouldShowWarning, true);

			// Step 2: 顯示警告
			const action = await validator.showSafetyWarning();
			assert.strictEqual(action, 'suppress');

			// Step 3: 儲存偏好
			await validator.saveUserPreference(true);
			assert.ok(mockSettingsManager.updateSetting.calledWith(SETTING_KEY, true));
		});

		test('Complete flow: Blockly project → No warning shown', async () => {
			// Setup: Blockly 專案
			mockVscodeFs.stat.resolves({} as vscode.FileStat);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);

			// 驗證工作區
			const validationResult = await validator.validateWorkspace();

			assert.strictEqual(validationResult.isBlocklyProject, true);
			assert.strictEqual(validationResult.shouldShowWarning, false);
			// 不應顯示對話框
			assert.ok(mockShowWarningMessage.notCalled, 'Should not show dialog for Blockly project');
		});
	});

	suite('Error Handling', () => {
		test('Should handle vscode.workspace.fs.stat error gracefully', async () => {
			mockVscodeFs.stat.rejects(new Error('Permission denied'));
			mockSettingsManager.readSetting.resolves(false);

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);
			const result = await validator.validateWorkspace();

			assert.strictEqual(result.isBlocklyProject, false, 'Should treat error as non-Blockly project');
		});

		test('Should handle LocaleService failure gracefully', async () => {
			// LocaleService 拋出錯誤時使用後備訊息
			mockLocaleService.getLocalizedMessage.throws(new Error('Locale error'));
			mockShowWarningMessage.resolves('繼續');

			const validator = new WorkspaceValidator(testWorkspacePath, mockSettingsManager, mockLocaleService, mockVscodeFs as any);

			// 應仍能顯示對話框(使用後備訊息)
			const result = await validator.showSafetyWarning();
			assert.ok(result, 'Should still work with fallback messages');
		});
	});

	suite('Default Service Instantiation', () => {
		test('Should create default services when not injected', () => {
			// 不注入 SettingsManager 和 LocaleService,應自動建立
			const validator = new WorkspaceValidator(testWorkspacePath);

			// 若能成功建立實例,測試通過
			assert.ok(validator, 'Should create validator with default services');
		});
	});
});
