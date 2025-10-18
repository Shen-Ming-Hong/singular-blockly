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
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { WebViewMessageHandler } from '../webview/messageHandler';
import { LocaleService } from '../services/localeService';
import { FileService } from '../services/fileService';
import { SettingsManager } from '../services/settingsManager';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('WebView Message Handler', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let vscodeMock: VSCodeMock;
	let originalVscode: any;
	let messageHandler: WebViewMessageHandler;
	let panelMock: any;
	let webviewMock: any;
	let localeServiceStub: sinon.SinonStubbedInstance<LocaleService>;
	let fileServiceStub: sinon.SinonStubbedInstance<FileService>;
	let settingsManagerStub: sinon.SinonStubbedInstance<SettingsManager>;
	const extensionPath = '/mock/extension';
	const workspacePath = '/mock/workspace';

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 備份原始 vscode 模組
		originalVscode = (global as any).vscode;

		// 準備 vscode 模擬物件
		vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspacePath } }];

		// 替換全域的 vscode 為模擬物件
		(global as any).vscode = vscodeMock;

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
		localeServiceStub.getLocalizedMessage.resolves('Localized Message');

	// 建立 FileService stub
	fileServiceStub = sinon.createStubInstance(FileService);

	// 建立 SettingsManager stub
	settingsManagerStub = sinon.createStubInstance(SettingsManager);

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
		// 還原原始的 vscode 模組
		(global as any).vscode = originalVscode;

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

		// 模擬 getBoardConfig 方法
		sinon.stub(webviewMock, 'postMessage').callsFake((message: any) => {
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

		// 建立儲存工作區訊息
		const saveWorkspaceMessage = {
			command: 'saveWorkspace',
			state: { blocks: [] },
			board: 'arduino:avr:uno',
			theme: 'light',
		};

		// 執行測試
		await messageHandler.handleMessage(saveWorkspaceMessage);

		// 驗證檔案操作
		assert(fileServiceStub.createDirectory.calledWith('blockly'));
		assert(fileServiceStub.writeJsonFile.called);

		const writeArgs = fileServiceStub.writeJsonFile.getCall(0).args;
		assert.strictEqual(writeArgs[0], path.join('blockly', 'main.json'));
		assert.deepStrictEqual(writeArgs[1], {
			workspace: { blocks: [] },
			board: 'arduino:avr:uno',
			theme: 'light',
		});
	});

	it('should handle request initial state message', async () => {
		// 準備測試
		const savedState = {
			workspace: { blocks: [] },
			board: 'arduino:avr:uno',
			theme: 'light',
		};

		fileServiceStub.fileExists.returns(true);
		fileServiceStub.readJsonFile.resolves(savedState);

		// 建立請求初始狀態訊息
		const requestMessage = {
			command: 'requestInitialState',
		};

		// 執行測試
		await messageHandler.handleMessage(requestMessage);

		// 驗證回應
		assert(webviewMock.postMessage.calledOnce);
		const messageArg = webviewMock.postMessage.getCall(0).args[0];
		assert.strictEqual(messageArg.command, 'loadWorkspace');
		assert.deepStrictEqual(messageArg.state, savedState.workspace);
		assert.strictEqual(messageArg.board, savedState.board);
		assert.strictEqual(messageArg.theme, savedState.theme);
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
		// 準備測試
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
		// 準備測試
		fileServiceStub.fileExists.returns(true);
		fileServiceStub.readJsonFile.resolves({});
		fileServiceStub.writeJsonFile.resolves();

		// 建立更新主題訊息
		const themeMessage = {
			command: 'updateTheme',
			theme: 'dark',
		};

		// 執行測試
		await messageHandler.handleMessage(themeMessage);

		// 驗證主題設定更新
		assert(fileServiceStub.readJsonFile.called);
		assert(fileServiceStub.writeJsonFile.called);
		// 檢查主題值
		const writeArgs = fileServiceStub.writeJsonFile.getCall(0).args;
		// 將 unknown 類型斷言為具有 theme 屬性的物件
		assert.strictEqual((writeArgs[1] as { theme: string }).theme, 'dark');
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
		fileServiceStub.readJsonFile.resolves({ created: '2023-01-01T00:00:00Z' });

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
		assert.strictEqual(messageArg.backups[0].name, 'backup1');
		assert.strictEqual(messageArg.backups[1].name, 'backup2');
	});

	it('should handle delete backup message', async () => {
		// 準備測試
		fileServiceStub.fileExists.returns(true);
		vscodeMock.window.showWarningMessage.resolves('刪除');
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
                fileServiceStub.readJsonFile.resolves({ workspace: {}, board: 'uno', theme: 'light' });
                vscodeMock.window.showWarningMessage.resolves('還原');

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
                vscodeMock.window.showWarningMessage.resolves('取消');

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
});
