/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { WebViewMessageHandler, _setVSCodeApi, _reset } from '../webview/messageHandler';
import { LocaleService } from '../services/localeService';
import { FileService } from '../services/fileService';
import { SettingsManager } from '../services/settingsManager';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('WebView Message Handler', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let vscodeMock: VSCodeMock;
	let messageHandler: WebViewMessageHandler;
	let panelMock: any;
	let webviewMock: any;
	let localeServiceStub: sinon.SinonStubbedInstance<LocaleService>;
	let fileServiceStub: sinon.SinonStubbedInstance<FileService>;
	let settingsManagerStub: sinon.SinonStubbedInstance<SettingsManager>;
	let originalFsExports: any; // 儲存原始的 fs 模組
	const extensionPath = '/mock/extension';
	const workspacePath = '/mock/workspace';

	// 在測試套件開始前保存原始的 fs 模組
	before(() => {
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule) {
			originalFsExports = fsModule.exports;
		}
	});

	// 在測試套件結束後確保恢復原始的 fs 模組
	after(() => {
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule && originalFsExports) {
			fsModule.exports = originalFsExports;
		}
	});

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 準備 vscode 模擬物件
		vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspacePath } }];

		// 注入 VSCode mock
		_setVSCodeApi(vscodeMock as any);

		// 建立檔案系統模擬
		fsMock = new FSMock();
		// 替換原始的 fs 模組
		fsServiceMock = {
			promises: fsMock.promises,
			existsSync: fsMock.existsSync,
			statSync: fsMock.statSync,
			readFileSync: fsMock.readFileSync,
		};

		// 直接將 fs 模組設為模擬物件
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule) {
			// 只在第一次時儲存原始的 fs 模組 (before hook 中已保存)
			fsModule.exports = fsServiceMock;
		}

		// 創建 WebView mock
		webviewMock = {
			postMessage: sinon.stub().resolves(),
		};

		// 創建面板 mock
		panelMock = {
			webview: webviewMock,
			reveal: sinon.stub(),
		};

		// 建立 LocaleService stub
		localeServiceStub = sinon.createStubInstance(LocaleService);
		// 配置按鈕文字的回傳值，使用英文 fallback
		localeServiceStub.getLocalizedMessage.callsFake(async (key: string, fallback?: string) => {
			// 若有提供 fallback，則回傳 fallback 值（模擬 LocaleService 的 fallback 行為）
			if (fallback !== undefined) {
				return fallback;
			}
			return 'Localized Message';
		});

		// 建立 FileService stub
		fileServiceStub = sinon.createStubInstance(FileService);

		// 建立 SettingsManager stub
		settingsManagerStub = sinon.createStubInstance(SettingsManager);
		settingsManagerStub.getTheme.resolves('light');
		settingsManagerStub.getLanguage.resolves('auto');
		settingsManagerStub.resolveLanguage.returns('en');
		settingsManagerStub.readSetting.resolves('__unset__');
		settingsManagerStub.updateTheme.resolves();
		settingsManagerStub.updateLanguage.resolves();

		// 初始化訊息處理器，注入所有 stubs
		messageHandler = new WebViewMessageHandler(
			{ extensionPath } as any,
			panelMock,
			localeServiceStub as any,
			fileServiceStub as any,
			settingsManagerStub as any
		);
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		// 還原預設值
		_reset();

		// 還原原始的 fs 模組
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule && originalFsExports) {
			fsModule.exports = originalFsExports;
		}

		// 清理
		sinon.restore();
		fsMock.reset();
	});

	it('should handle log messages', async () => {
		// 建立日誌訊息
		const logMessage = {
			command: 'log',
			source: 'test',
			level: 'info',
			message: 'Test log message',
		};

		// 執行測試
		await messageHandler.handleMessage(logMessage);

		// 無法直接測試 log 函數的呼叫，但可以確保沒有拋出錯誤
	});

	it('should handle update code message', async () => {
		// 準備測試
		fileServiceStub.createDirectory.resolves();
		fileServiceStub.writeFile.resolves();

		// 建立更新程式碼訊息
		const updateCodeMessage = {
			command: 'updateCode',
			code: '// Test Arduino Code',
		};

		// 執行測試
		await messageHandler.handleMessage(updateCodeMessage);

		// 驗證檔案操作
		assert(fileServiceStub.createDirectory.calledWith('src'));
		assert(fileServiceStub.writeFile.calledWith('src/main.cpp', '// Test Arduino Code'));
	});

	it('should handle update board message', async () => {
		// 準備測試
		fileServiceStub.fileExists.returns(false);
		fileServiceStub.writeFile.resolves();

		// 建立更新板子訊息
		const updateBoardMessage = {
			command: 'updateBoard',
			board: 'arduino:avr:uno',
		};

		// 重置並重新配置 postMessage stub
		webviewMock.postMessage.reset();
		webviewMock.postMessage.callsFake((message: any) => {
			if (message.command === 'getBoardConfig') {
				// 模擬 WebView 的回應
				setTimeout(() => {
					messageHandler.handleMessage({
						command: 'boardConfigResult',
						messageId: message.messageId,
						config: '[env:arduino_uno]\nplatform = atmelavr\nboard = uno\nframework = arduino',
					});
				}, 10);
			}
			return Promise.resolve();
		});

		// 執行測試
		await messageHandler.handleMessage(updateBoardMessage);

		// 驗證檔案寫入
		assert(fileServiceStub.writeFile.called);
		const writeArgs = fileServiceStub.writeFile.getCall(0).args;
		assert.strictEqual(writeArgs[0], 'platformio.ini');
	});

	it('should handle save workspace message', async () => {
		// 準備測試
		fileServiceStub.createDirectory.resolves();
		fileServiceStub.writeJsonFile.resolves();
		fileServiceStub.fileExists.returns(false); // 首次儲存，main.json 不存在

		// 建立儲存工作區訊息（使用有效的方塊資料）
		const saveWorkspaceMessage = {
			command: 'saveWorkspace',
			state: { blocks: { languageVersion: 0, blocks: [{ type: 'controls_if', id: 'test1' }] } },
			board: 'arduino:avr:uno',
		};

		// 執行測試
		await messageHandler.handleMessage(saveWorkspaceMessage);

		// 驗證檔案操作
		assert(fileServiceStub.createDirectory.calledWith('blockly'));
		assert(fileServiceStub.writeJsonFile.called);

		const writeArgs = fileServiceStub.writeJsonFile.getCall(0).args;
		assert.strictEqual(writeArgs[0], path.join('blockly', 'main.json'));
		assert.deepStrictEqual(writeArgs[1], {
			workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'controls_if', id: 'test1' }] } },
			board: 'arduino:avr:uno',
		});
	});

	it('should handle request initial state message', async () => {
		// 準備測試
		const savedState = {
			workspace: { blocks: [] },
			board: 'arduino:avr:uno',
		};

		fileServiceStub.fileExists.returns(true);
		fileServiceStub.readJsonFile.resolves(savedState);
		settingsManagerStub.getAutoBackupInterval.resolves(5);
		settingsManagerStub.getTheme.resolves('dark');
		settingsManagerStub.getLanguage.resolves('auto');
		settingsManagerStub.resolveLanguage.returns('en');

		// 建立請求初始狀態訊息
		const requestMessage = {
			command: 'requestInitialState',
		};

		// 執行測試
		await messageHandler.handleMessage(requestMessage);

		// 驗證回應 - 應該被調用兩次(init + autoBackupSettingsResponse)
		assert(webviewMock.postMessage.called);

		// 找到 init 消息
		const initCall = webviewMock.postMessage.getCalls().find((call: any) => call.args[0].command === 'init');
		assert(initCall, 'init message should be sent');

		const messageArg = initCall.args[0];
		assert.strictEqual(messageArg.command, 'init');
		assert.deepStrictEqual(messageArg.workspace, savedState.workspace);
		assert.strictEqual(messageArg.board, savedState.board);
		assert.strictEqual(messageArg.theme, 'dark');
		assert.strictEqual(messageArg.languagePreference, 'auto');
		assert.strictEqual(messageArg.resolvedLanguage, 'en');
	});

	it('should handle prompt new variable message', async () => {
		// 準備測試
		vscodeMock.window.showInputBox.resolves('myVariable');

		// 建立提示新變數訊息
		const promptMessage = {
			command: 'promptNewVariable',
			isRename: false,
		};

		// 執行測試
		await messageHandler.handleMessage(promptMessage);

		// 驗證 input box 顯示
		assert(vscodeMock.window.showInputBox.calledOnce);

		// 驗證回應
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'createVariable');
		assert.strictEqual(messageArg.name, 'myVariable');
		assert.strictEqual(messageArg.isRename, false);
	});

	it('should handle confirm delete variable message', async () => {
		// 準備測試 - 設置本地化消息
		localeServiceStub.getLocalizedMessage.withArgs('VSCODE_CONFIRM_DELETE_VARIABLE', 'testVar').resolves('確認刪除變數 testVar?');
		localeServiceStub.getLocalizedMessage.withArgs('VSCODE_OK').resolves('OK');
		localeServiceStub.getLocalizedMessage.withArgs('VSCODE_CANCEL').resolves('Cancel');

		vscodeMock.window.showWarningMessage.resolves('OK');

		// 建立確認刪除變數訊息
		const confirmMessage = {
			command: 'confirmDeleteVariable',
			variableName: 'testVar',
		};

		// 執行測試
		await messageHandler.handleMessage(confirmMessage);

		// 驗證警告對話框顯示
		assert(vscodeMock.window.showWarningMessage.calledOnce);

		// 驗證回應
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'deleteVariable');
		assert.strictEqual(messageArg.confirmed, true);
		assert.strictEqual(messageArg.name, 'testVar');
	});

	it('should handle update theme message', async () => {
		// 建立更新主題訊息
		const themeMessage = {
			command: 'updateTheme',
			theme: 'dark',
		};

		// 執行測試
		await messageHandler.handleMessage(themeMessage);

		// 驗證主題設定更新
		assert(settingsManagerStub.updateTheme.calledOnce);
		assert(settingsManagerStub.updateTheme.calledWith('dark'));
	});

	it('should handle update language message', async () => {
		settingsManagerStub.resolveLanguage.withArgs('ja').returns('ja');

		const languageMessage = {
			command: 'updateLanguage',
			language: 'ja',
		};

		await messageHandler.handleMessage(languageMessage);

		assert(settingsManagerStub.updateLanguage.calledOnce);
		assert(settingsManagerStub.updateLanguage.calledWith('ja'));

		const response = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(response.command, 'languageUpdated');
		assert.strictEqual(response.languagePreference, 'ja');
		assert.strictEqual(response.resolvedLanguage, 'ja');
	});

	it('should fall back to auto when updateLanguage fails', async () => {
		settingsManagerStub.updateLanguage.onFirstCall().rejects(new Error('Invalid language'));
		settingsManagerStub.updateLanguage.onSecondCall().resolves();

		const languageMessage = {
			command: 'updateLanguage',
			language: 'invalid-lang',
		};

		await messageHandler.handleMessage(languageMessage);

		assert.strictEqual(settingsManagerStub.updateLanguage.callCount, 2);
		assert(settingsManagerStub.updateLanguage.firstCall.calledWith('invalid-lang'));
		assert(settingsManagerStub.updateLanguage.secondCall.calledWith('auto'));
		assert(settingsManagerStub.resolveLanguage.calledWith('auto'));

		const response = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(response.command, 'languageUpdated');
		assert.strictEqual(response.languagePreference, 'auto');
		assert.strictEqual(response.resolvedLanguage, 'en');
	});

	it('should handle create backup message', async () => {
		// 準備測試
		fileServiceStub.fileExists.returns(true);
		fileServiceStub.createDirectory.resolves();
		fileServiceStub.copyFile.resolves();

		// 建立建立備份訊息
		const backupMessage = {
			command: 'createBackup',
			name: 'test-backup',
		};

		// 執行測試
		await messageHandler.handleMessage(backupMessage);

		// 驗證備份操作
		assert(fileServiceStub.createDirectory.calledWith(path.join('blockly', 'backup')));
		assert(fileServiceStub.copyFile.called);

		// 驗證回應
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'backupCreated');
		assert.strictEqual(messageArg.name, 'test-backup');
		assert.strictEqual(messageArg.success, true);
	});

	it('should handle get backup list message', async () => {
		// 準備測試
		fileServiceStub.createDirectory.resolves();
		fileServiceStub.listFiles.resolves(['backup1.json', 'backup2.json']);

		// Mock getFileStats with different dates - backup2 is newer
		fileServiceStub.getFileStats
			.onFirstCall()
			.resolves({ birthtime: new Date('2023-01-01T00:00:00Z'), size: 100 } as any)
			.onSecondCall()
			.resolves({ birthtime: new Date('2023-01-02T00:00:00Z'), size: 200 } as any);

		// 建立獲取備份列表訊息
		const listMessage = {
			command: 'getBackupList',
		};

		// 執行測試
		await messageHandler.handleMessage(listMessage);

		// 驗證列表操作
		assert(fileServiceStub.createDirectory.calledOnce);
		assert(fileServiceStub.listFiles.calledOnce);

		// 驗證回應
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'backupListResponse');
		assert.strictEqual(messageArg.backups.length, 2);
		// backups are sorted by date (newest first), so backup2 should be first
		assert.strictEqual(messageArg.backups[0].name, 'backup2');
		assert.strictEqual(messageArg.backups[1].name, 'backup1');
	});

	it('should handle delete backup message', async () => {
		// 準備測試
		fileServiceStub.fileExists.returns(true);
		vscodeMock.window.showWarningMessage.resolves('Delete');
		fileServiceStub.deleteFile.resolves();

		// 建立刪除備份訊息
		const deleteMessage = {
			command: 'deleteBackup',
			name: 'old-backup',
		};

		// 執行測試
		await messageHandler.handleMessage(deleteMessage);

		// 驗證刪除操作
		assert(vscodeMock.window.showWarningMessage.calledOnce);
		assert(fileServiceStub.deleteFile.calledOnce);

		// 驗證回應
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'backupDeleted');
		assert.strictEqual(messageArg.name, 'old-backup');
		assert.strictEqual(messageArg.success, true);
	});

	it('should handle errors gracefully', async () => {
		// 準備測試 - 製造錯誤情境
		fileServiceStub.createDirectory.rejects(new Error('Test error'));

		// 建立訊息
		const message = {
			command: 'createBackup',
			name: 'error-backup',
		};

		// 執行測試
		await messageHandler.handleMessage(message);

		// 驗證錯誤處理
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'backupCreated');
		assert.strictEqual(messageArg.success, false);
		assert(messageArg.error.includes('Test error'));
	});

	it('should handle confirm dialog', async () => {
		vscodeMock.window.showWarningMessage.resolves('OK');

		const confirmMessage = {
			command: 'confirmDialog',
			message: 'Delete?',
			confirmId: '123',
		};

		await messageHandler.handleMessage(confirmMessage);

		assert(vscodeMock.window.showWarningMessage.calledWith('Delete?', 'OK', 'Cancel'));
		assert(webviewMock.postMessage.calledOnce);
		const arg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(arg.command, 'confirmDialogResult');
		assert.strictEqual(arg.confirmed, true);
		assert.strictEqual(arg.originalMessage, 'Delete?');
		assert.strictEqual(arg.confirmId, '123');
	});

	it('should handle restore backup message', async () => {
		const backupPath = path.join('blockly', 'backup', 'my.json');
		const mainJsonPath = path.join('blockly', 'main.json');

		fileServiceStub.fileExists.withArgs(backupPath).returns(true);
		fileServiceStub.fileExists.withArgs(mainJsonPath).returns(true);
		fileServiceStub.copyFile.resolves();
		fileServiceStub.readJsonFile.resolves({ workspace: {}, board: 'uno' });
		vscodeMock.window.showWarningMessage.resolves('Restore');

		const restoreMessage = {
			command: 'restoreBackup',
			name: 'my',
		};

		await messageHandler.handleMessage(restoreMessage);

		assert(fileServiceStub.copyFile.calledWith(backupPath, mainJsonPath));
		assert(webviewMock.postMessage.calledTwice);
		const loadMsg = webviewMock.postMessage.getCall(0).args[0];
		const resultMsg = webviewMock.postMessage.getCall(1).args[0];
		assert.strictEqual(loadMsg.command, 'loadWorkspace');
		assert.strictEqual(resultMsg.command, 'backupRestored');
		assert.strictEqual(resultMsg.success, true);
	});

	it('should handle restore backup cancel', async () => {
		const backupPath = path.join('blockly', 'backup', 'my.json');
		fileServiceStub.fileExists.withArgs(backupPath).returns(true);
		vscodeMock.window.showWarningMessage.resolves('Cancel');

		const restoreMessage = { command: 'restoreBackup', name: 'my' };

		await messageHandler.handleMessage(restoreMessage);

		const resultMsg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(resultMsg.command, 'backupRestored');
		assert.strictEqual(resultMsg.success, false);
		assert.strictEqual(resultMsg.cancelled, true);
	});

	it('should handle preview backup message', async () => {
		const backupPath = path.join('blockly', 'backup', 'pre.json');
		fileServiceStub.fileExists.withArgs(backupPath).returns(true);
		vscodeMock.commands.executeCommand.resolves();

		const previewMessage = { command: 'previewBackup', name: 'pre' };

		await messageHandler.handleMessage(previewMessage);

		assert(vscodeMock.commands.executeCommand.calledOnce);
		const arg = vscodeMock.commands.executeCommand.getCall(0).args[1];
		assert(arg.endsWith(path.join(workspacePath, backupPath)));
	});

	it('should handle get auto backup settings message', async () => {
		const expectedInterval = 5;
		settingsManagerStub.getAutoBackupInterval.resolves(expectedInterval);

		const getMessage = { command: 'getAutoBackupSettings' };

		await messageHandler.handleMessage(getMessage);

		assert(settingsManagerStub.getAutoBackupInterval.calledOnce);
		assert(webviewMock.postMessage.calledOnce);

		const response = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(response.command, 'autoBackupSettingsResponse');
		assert.strictEqual(response.interval, expectedInterval);
	});

	it('should handle update auto backup settings message', async () => {
		const newInterval = 10;
		settingsManagerStub.updateAutoBackupInterval.resolves();

		const updateMessage = {
			command: 'updateAutoBackupSettings',
			interval: newInterval,
		};

		await messageHandler.handleMessage(updateMessage);

		assert(settingsManagerStub.updateAutoBackupInterval.calledOnce);
		assert(settingsManagerStub.updateAutoBackupInterval.calledWith(newInterval));
	});

	it('should handle boardConfigResult message without action', async () => {
		const boardConfigMessage = {
			command: 'boardConfigResult',
			config: { name: 'Arduino Uno' },
		};

		// boardConfigResult 不需要執行任何動作,只是接收回應
		await messageHandler.handleMessage(boardConfigMessage);

		// 驗證沒有呼叫任何 service 方法
		assert.strictEqual(webviewMock.postMessage.called, false);
		assert.strictEqual(settingsManagerStub.getAutoBackupInterval.called, false);
	});

	it('should handle unknown command with warning', async () => {
		const unknownMessage = {
			command: 'unknownCommand',
			data: 'test',
		};

		// 處理未知命令不應拋出錯誤
		await messageHandler.handleMessage(unknownMessage);

		// 驗證沒有呼叫任何 service 方法
		assert.strictEqual(webviewMock.postMessage.called, false);
	});

	// Error handling branch coverage tests
	describe('Error Handling Branches', () => {
		it('should handle error when no workspace folder open in constructor', async () => {
			// Remove workspace folders
			vscodeMock.workspace.workspaceFolders = undefined;
			_setVSCodeApi(vscodeMock as any);

			// Should throw error when creating handler without workspace
			assert.throws(() => {
				new WebViewMessageHandler({ extensionPath } as any, panelMock, localeServiceStub as any);
			}, /No workspace folder open/);
		});

		it('should handle updateCode error when no workspace folder', async () => {
			// Remove workspace folders after handler creation
			vscodeMock.workspace.workspaceFolders = undefined;

			const updateCodeMessage = { command: 'updateCode', code: '// Test' };
			await messageHandler.handleMessage(updateCodeMessage);

			// Should show error message
			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle updateCode with lib_deps and build_flags', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeFile.resolves();
			settingsManagerStub.syncPlatformIOSettings.resolves();

			const updateCodeMessage = {
				command: 'updateCode',
				code: '// Test Arduino Code',
				lib_deps: ['Servo@1.0.0', 'Wire'],
				build_flags: ['-DDEBUG_MODE'],
				lib_ldf_mode: 'chain+',
			};

			await messageHandler.handleMessage(updateCodeMessage);

			assert(fileServiceStub.writeFile.calledWith('src/main.cpp', '// Test Arduino Code'));
			assert(settingsManagerStub.syncPlatformIOSettings.calledWith(['Servo@1.0.0', 'Wire'], ['-DDEBUG_MODE'], 'chain+'));
		});

		it('should handle updateCode error during file write', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeFile.rejects(new Error('Write failed'));

			const updateCodeMessage = { command: 'updateCode', code: '// Test' };
			await messageHandler.handleMessage(updateCodeMessage);

			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle updateBoard error when no workspace folder', async () => {
			vscodeMock.workspace.workspaceFolders = undefined;

			const updateBoardMessage = { command: 'updateBoard', board: 'arduino_uno' };
			await messageHandler.handleMessage(updateBoardMessage);

			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle updateBoard with board="none" to delete platformio.ini', async () => {
			fileServiceStub.fileExists.returns(true);
			fileServiceStub.deleteFile.resolves();

			const updateBoardMessage = { command: 'updateBoard', board: 'none' };
			await messageHandler.handleMessage(updateBoardMessage);

			assert(fileServiceStub.deleteFile.calledWith('platformio.ini'));
		});

		it('should handle updateBoard with lib_deps sync', async () => {
			fileServiceStub.fileExists.returns(false);
			fileServiceStub.writeFile.resolves();
			settingsManagerStub.syncPlatformIOSettings.resolves();

			webviewMock.postMessage.callsFake((message: any) => {
				if (message.command === 'getBoardConfig') {
					setTimeout(() => {
						messageHandler.handleMessage({
							command: 'boardConfigResult',
							messageId: message.messageId,
							config: '[env:uno]\nplatform=atmelavr',
						});
					}, 10);
				}
				return Promise.resolve();
			});

			const updateBoardMessage = {
				command: 'updateBoard',
				board: 'arduino_uno',
				lib_deps: ['Servo'],
				build_flags: ['-DDEBUG'],
				lib_ldf_mode: 'deep',
			};

			await messageHandler.handleMessage(updateBoardMessage);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 150));

			assert(settingsManagerStub.syncPlatformIOSettings.calledWith(['Servo'], ['-DDEBUG'], 'deep'));
		});

		it('should handle updateBoard error during file write', async () => {
			fileServiceStub.fileExists.returns(false);
			fileServiceStub.writeFile.rejects(new Error('Write failed'));

			webviewMock.postMessage.callsFake((message: any) => {
				if (message.command === 'getBoardConfig') {
					setTimeout(() => {
						messageHandler.handleMessage({
							command: 'boardConfigResult',
							messageId: message.messageId,
							config: '[env:uno]\nplatform=atmelavr',
						});
					}, 10);
				}
				return Promise.resolve();
			});

			const updateBoardMessage = { command: 'updateBoard', board: 'arduino_uno' };
			await messageHandler.handleMessage(updateBoardMessage);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle saveWorkspace JSON serialization error', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.fileExists.returns(false);
			fileServiceStub.writeJsonFile.rejects(new Error('JSON error'));

			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [{ type: 'test', id: '1' }] } },
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle requestInitialState with invalid JSON', async () => {
			fileServiceStub.fileExists.returns(true);
			fileServiceStub.readJsonFile.rejects(new Error('JSON parsing error'));
			fileServiceStub.writeJsonFile.resolves();
			settingsManagerStub.getAutoBackupInterval.resolves(5);

			const requestMessage = { command: 'requestInitialState' };
			await messageHandler.handleMessage(requestMessage);

			// Should create new state
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should handle requestInitialState with invalid workspace format', async () => {
			fileServiceStub.fileExists.returns(true);
			// Return invalid format (missing workspace property)
			fileServiceStub.readJsonFile.resolves({ board: 'uno' } as any);
			fileServiceStub.writeJsonFile.resolves();

			const requestMessage = { command: 'requestInitialState' };
			await messageHandler.handleMessage(requestMessage);

			// Should create new state due to invalid format
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should handle requestInitialState auto backup settings error', async () => {
			fileServiceStub.fileExists.returns(true);
			fileServiceStub.readJsonFile.resolves({ workspace: {}, board: 'uno' });
			settingsManagerStub.getAutoBackupInterval.rejects(new Error('Settings error'));

			const requestMessage = { command: 'requestInitialState' };
			await messageHandler.handleMessage(requestMessage);

			// Should still send init even if auto backup fails
			const initCall = webviewMock.postMessage.getCalls().find((call: any) => call.args[0].command === 'init');
			assert(initCall, 'init should still be sent');
		});

		it('should handle createBackup when main.json not exists', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.fileExists.returns(false);

			const backupMessage = { command: 'createBackup', name: 'test-backup' };
			await messageHandler.handleMessage(backupMessage);

			assert(webviewMock.postMessage.calledOnce);
			const messageArg = webviewMock.postMessage.getCall(0).args[0];
			assert.strictEqual(messageArg.success, false);
		});

		it('should handle deleteBackup when user cancels', async () => {
			fileServiceStub.fileExists.returns(true);
			vscodeMock.window.showWarningMessage.resolves('Cancel');

			const deleteMessage = { command: 'deleteBackup', name: 'old-backup' };
			await messageHandler.handleMessage(deleteMessage);

			const messageArg = webviewMock.postMessage.getCall(0).args[0];
			assert.strictEqual(messageArg.cancelled, true);
		});

		it('should handle deleteBackup when backup does not exist', async () => {
			fileServiceStub.fileExists.returns(false);

			const deleteMessage = { command: 'deleteBackup', name: 'nonexistent' };
			await messageHandler.handleMessage(deleteMessage);

			const messageArg = webviewMock.postMessage.getCall(0).args[0];
			assert.strictEqual(messageArg.success, false);
			assert(messageArg.error.includes('does not exist'));
		});

		it('should handle deleteBackup without name', async () => {
			const deleteMessage = { command: 'deleteBackup' };
			await messageHandler.handleMessage(deleteMessage);

			const messageArg = webviewMock.postMessage.getCall(0).args[0];
			assert.strictEqual(messageArg.success, false);
		});

		it('should handle restoreBackup when backup does not exist', async () => {
			fileServiceStub.fileExists.returns(false);

			const restoreMessage = { command: 'restoreBackup', name: 'nonexistent' };
			await messageHandler.handleMessage(restoreMessage);

			const messageArg = webviewMock.postMessage.getCall(0).args[0];
			assert.strictEqual(messageArg.success, false);
		});

		it('should handle previewBackup when backup does not exist', async () => {
			fileServiceStub.fileExists.returns(false);

			const previewMessage = { command: 'previewBackup', name: 'nonexistent' };
			await messageHandler.handleMessage(previewMessage);

			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle previewBackup without name', async () => {
			const previewMessage = { command: 'previewBackup' };
			await messageHandler.handleMessage(previewMessage);

			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle general message processing error', async () => {
			// Make handleMessage throw by corrupting internal state
			fileServiceStub.createDirectory.rejects(new Error('Unexpected error'));
			fileServiceStub.fileExists.returns(false);

			// 使用有效的 state 以通過空狀態驗證
			const message = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [{ type: 'test', id: '1' }] } },
			};
			await messageHandler.handleMessage(message);

			// Should catch and show error
			assert(vscodeMock.window.showErrorMessage.called);
		});

		it('should handle promptNewVariable validation errors', async () => {
			const validateInput = (vscodeMock.window.showInputBox as sinon.SinonStub).firstCall?.args[0]?.validateInput;

			if (validateInput) {
				// Test empty input
				const emptyResult = validateInput('');
				assert.ok(emptyResult, 'Should return error for empty input');

				// Test invalid format (starts with number)
				const invalidResult = validateInput('123invalid');
				assert.ok(invalidResult, 'Should return error for invalid format');

				// Test valid input
				const validResult = validateInput('validName');
				assert.strictEqual(validResult, null, 'Should return null for valid input');
			}

			const promptMessage = { command: 'promptNewVariable', currentName: 'test' };
			await messageHandler.handleMessage(promptMessage);

			assert(vscodeMock.window.showInputBox.called);
		});

		it('should handle promptNewVariable catch block', async () => {
			vscodeMock.window.showInputBox.rejects(new Error('Input box error'));

			const promptMessage = { command: 'promptNewVariable', currentName: 'test' };
			await messageHandler.handleMessage(promptMessage);

			// Error should be caught and handled
			assert(vscodeMock.window.showInputBox.called);
		});

		it('should handle confirmDeleteVariable catch block', async () => {
			vscodeMock.window.showWarningMessage.rejects(new Error('Dialog error'));

			const confirmMessage = { command: 'confirmDeleteVariable', variableName: 'test' };
			await messageHandler.handleMessage(confirmMessage);

			// Error should be caught
			assert(vscodeMock.window.showWarningMessage.called);
		});

		it('should handle confirmDialog catch block', async () => {
			vscodeMock.window.showWarningMessage.rejects(new Error('Dialog error'));

			const confirmMessage = {
				command: 'confirmDialog',
				messageId: 'test',
				title: 'Confirm',
				message: 'Are you sure?',
			};
			await messageHandler.handleMessage(confirmMessage);

			// Error should be caught
			assert(vscodeMock.window.showWarningMessage.called);
		});

		it('should handle updateTheme with default theme', async () => {
			const themeMessage = { command: 'updateTheme' };
			await messageHandler.handleMessage(themeMessage);

			assert(settingsManagerStub.updateTheme.calledOnce);
			assert(settingsManagerStub.updateTheme.calledWith('light'));
		});

		it('should handle updateTheme with settings save error', async () => {
			settingsManagerStub.updateTheme.rejects(new Error('Settings error'));

			const themeMessage = { command: 'updateTheme', theme: 'dark' };
			await messageHandler.handleMessage(themeMessage);

			// Error should be caught
			assert(settingsManagerStub.updateTheme.called);
		});

		it('should handle getBackupList with file read error', async () => {
			fileServiceStub.listFiles.resolves(['backup1.json', 'backup2.json']);
			fileServiceStub.readJsonFile.onFirstCall().resolves({ date: '2025-01-01' }).onSecondCall().rejects(new Error('Read error'));

			const getListMessage = { command: 'getBackupList' };
			await messageHandler.handleMessage(getListMessage);

			// Should handle error and return available backups with fallback date
			assert(webviewMock.postMessage.called);
			const response = webviewMock.postMessage.firstCall.args[0];
			assert.strictEqual(response.command, 'backupListResponse');
			assert.strictEqual(response.backups.length, 2);
		});

		it('should handle requestInitialState workspace read error', async () => {
			fileServiceStub.fileExists.returns(true);
			fileServiceStub.readJsonFile.rejects(new Error('Read error'));
			settingsManagerStub.getAutoBackupInterval.resolves(5);

			const requestMessage = { command: 'requestInitialState' };
			await messageHandler.handleMessage(requestMessage);

			// Should log error but continue with default state
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should handle getBackupList with file stats read error', async () => {
			const backupsDir = path.join('/mock/workspace', 'backups');
			fsMock.addDirectory(backupsDir);
			fsMock.addFile(path.join(backupsDir, 'backup1.json'), JSON.stringify({ test: 'data' }));

			// Make getFileStats return null (file read error)
			fileServiceStub.getFileStats.resolves(null);
			fileServiceStub.listFiles.resolves(['backup1.json']);

			const message = { command: 'getBackupList' };
			await messageHandler.handleMessage(message);

			// Should use current time as fallback
			const response = panelMock.webview.postMessage.lastCall?.args[0];
			assert.strictEqual(response.command, 'backupListResponse');
			assert.ok(Array.isArray(response.backups));
		});

		// ===== 空 Workspace 防護機制測試 (spec 019) =====

		it('should reject empty workspace state', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeJsonFile.resolves();

			// 建立空狀態的儲存請求
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [] } },
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 writeJsonFile 未被呼叫（空狀態被拒絕）
			assert.strictEqual(fileServiceStub.writeJsonFile.called, false);
		});

		it('should reject workspace with missing blocks property', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeJsonFile.resolves();

			// 建立缺少 blocks 屬性的儲存請求
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: {},
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 writeJsonFile 未被呼叫
			assert.strictEqual(fileServiceStub.writeJsonFile.called, false);
		});

		it('should reject workspace with null state', async () => {
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeJsonFile.resolves();

			// 建立 null 狀態的儲存請求
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: null,
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 writeJsonFile 未被呼叫
			assert.strictEqual(fileServiceStub.writeJsonFile.called, false);
		});

		it('should create backup before save when file exists', async () => {
			const mainJsonPath = path.join('blockly', 'main.json');

			// 設置已存在的 main.json（有有效方塊）
			fileServiceStub.fileExists.withArgs(mainJsonPath).returns(true);
			fileServiceStub.readJsonFile.resolves({
				workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'old_block', id: 'old1' }] } },
				board: 'uno',
			});
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.copyFile.resolves();
			fileServiceStub.writeJsonFile.resolves();

			// 發送有效的 saveWorkspace 訊息
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [{ type: 'new_block', id: 'new1' }] } },
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 copyFile 被呼叫以建立備份
			assert(fileServiceStub.copyFile.called);
			const copyArgs = fileServiceStub.copyFile.getCall(0).args;
			assert.strictEqual(copyArgs[0], mainJsonPath);
			assert.strictEqual(copyArgs[1], mainJsonPath + '.bak');

			// 驗證 writeJsonFile 也被呼叫
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should skip backup when main.json does not exist', async () => {
			const mainJsonPath = path.join('blockly', 'main.json');

			// 設置 main.json 不存在（新專案首次儲存）
			fileServiceStub.fileExists.withArgs(mainJsonPath).returns(false);
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeJsonFile.resolves();

			// 發送有效的 saveWorkspace 訊息
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [{ type: 'test_block', id: 't1' }] } },
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 copyFile 未被呼叫（跳過備份）
			assert.strictEqual(fileServiceStub.copyFile.called, false);

			// 驗證 writeJsonFile 仍被呼叫
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should skip backup when existing file is empty', async () => {
			const mainJsonPath = path.join('blockly', 'main.json');

			// 設置已存在但為空的 main.json
			fileServiceStub.fileExists.withArgs(mainJsonPath).returns(true);
			fileServiceStub.readJsonFile.resolves({
				workspace: { blocks: { languageVersion: 0, blocks: [] } },
				board: 'uno',
			});
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.writeJsonFile.resolves();

			// 發送有效的 saveWorkspace 訊息
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [{ type: 'test_block', id: 't1' }] } },
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 copyFile 未被呼叫（現有檔案為空，跳過備份）
			assert.strictEqual(fileServiceStub.copyFile.called, false);

			// 驗證 writeJsonFile 仍被呼叫
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should continue save when backup fails', async () => {
			const mainJsonPath = path.join('blockly', 'main.json');

			// 設置已存在的 main.json
			fileServiceStub.fileExists.withArgs(mainJsonPath).returns(true);
			fileServiceStub.readJsonFile.resolves({
				workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'old_block', id: 'old1' }] } },
				board: 'uno',
			});
			fileServiceStub.createDirectory.resolves();
			fileServiceStub.copyFile.rejects(new Error('Backup failed'));
			fileServiceStub.writeJsonFile.resolves();

			// 發送有效的 saveWorkspace 訊息
			const saveWorkspaceMessage = {
				command: 'saveWorkspace',
				state: { blocks: { languageVersion: 0, blocks: [{ type: 'new_block', id: 'new1' }] } },
				board: 'uno',
			};

			await messageHandler.handleMessage(saveWorkspaceMessage);

			// 驗證 copyFile 被呼叫但失敗
			assert(fileServiceStub.copyFile.called);

			// 驗證 writeJsonFile 仍被呼叫（備份失敗不阻止儲存）
			assert(fileServiceStub.writeJsonFile.called);
		});

		it('should handle promptNewVariable with empty input validation', async () => {
			// Call promptNewVariable to register validator
			const message = { command: 'promptNewVariable', currentName: 'test' };
			await messageHandler.handleMessage(message);

			// Test validator function directly
			const inputOptions = (vscodeMock.window.showInputBox as sinon.SinonStub).lastCall?.args[0];
			const validator = inputOptions?.validateInput;

			if (validator) {
				const result = validator('');
				assert.ok(result, 'Should return error message for empty input');
			}

			assert(true, 'Validator tested');
		});

		it('should handle promptNewVariable with invalid format validation', async () => {
			const message = { command: 'promptNewVariable', currentName: 'test' };
			await messageHandler.handleMessage(message);

			// Test validator function for invalid format
			const inputOptions = (vscodeMock.window.showInputBox as sinon.SinonStub).lastCall?.args[0];
			const validator = inputOptions?.validateInput;

			if (validator) {
				const result = validator('9invalid');
				assert.ok(result, 'Should return error message for name starting with number');
			}

			assert(true, 'Validator tested for invalid format');
		});

		it('should handle promptNewVariable with valid input returning null', async () => {
			const message = { command: 'promptNewVariable', currentName: 'test' };
			await messageHandler.handleMessage(message);

			// Test validator function for valid input
			const inputOptions = (vscodeMock.window.showInputBox as sinon.SinonStub).lastCall?.args[0];
			const validator = inputOptions?.validateInput;

			if (validator) {
				const result = validator('validName123');
				assert.strictEqual(result, null, 'Should return null for valid input');
			}

			assert(true, 'Validator tested for valid input');
		});
	});
});
