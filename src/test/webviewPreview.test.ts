/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import { describe, it, before, beforeEach, after, afterEach } from 'mocha';
import { WebViewManager, _setVSCodeApi as setWebViewManagerVSCodeApi, _reset as resetWebViewManager } from '../webview/webviewManager';
import { _setVSCodeApi as setMessageHandlerVSCodeApi, _reset as resetMessageHandler } from '../webview/messageHandler';
import { LocaleService } from '../services/localeService';
import { FileService } from '../services/fileService';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('WebView Preview', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let vscodeMock: VSCodeMock;
	let webViewManager: WebViewManager;
	let localeService: LocaleService;
	let extensionFileService: FileService;
	let originalFsExports: any; // 儲存原始的 fs 模組
	const extensionPath = path.normalize('/mock/extension');
	const workspacePath = path.normalize('/mock/workspace');
	const backupRelPath = path.join('blockly', 'backup', 'test.json');
	const backupFullPath = path.join(workspacePath, backupRelPath);

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

	beforeEach(() => {
		vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspacePath } }];

		// 注入 VSCode mock
		setWebViewManagerVSCodeApi(vscodeMock as any);
		setMessageHandlerVSCodeApi(vscodeMock as any);

		fsMock = new FSMock();
		fsServiceMock = {
			promises: fsMock.promises,
			existsSync: fsMock.existsSync,
			statSync: fsMock.statSync,
			readFileSync: fsMock.readFileSync,
			writeFileSync: fsMock.writeFileSync,
		};
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule) {
			// 只在第一次時儲存原始的 fs 模組 (before hook 中已保存)
			fsModule.exports = fsServiceMock;
		}

		fsMock.addDirectory(path.join(extensionPath, 'media'));

		// 添加語言檔案
		const localePath = path.join(extensionPath, 'media/locales/en/messages.js');
		fsMock.addFile(localePath, `Blockly.Msg['VSCODE_PLEASE_OPEN_PROJECT'] = 'Please open a folder first.';`);
		fsMock.addDirectory(path.join(extensionPath, 'media/locales'));
		fsMock.addDirectory(path.join(extensionPath, 'media/locales/en'));

		// 初始化 services
		localeService = new LocaleService(extensionPath, fsServiceMock as any, vscodeMock as any);
		extensionFileService = new FileService(extensionPath, fsServiceMock as any);

		const context = {
			extensionPath,
			subscriptions: [],
		};
		webViewManager = new WebViewManager(context as any, localeService, extensionFileService);
	});

	afterEach(() => {
		// 還原預設值
		resetWebViewManager();
		resetMessageHandler();

		// 還原原始的 fs 模組
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule && originalFsExports) {
			fsModule.exports = originalFsExports;
		}

		sinon.restore();
		fsMock.reset();
	});

	it('should create preview panel and load backup content', async () => {
		fsMock.addFile(backupFullPath, '{"workspace": {"blocks": []}}');

		// 確保 fileService 使用正確的 fsMock
		(webViewManager as any).fileService = new FileService(workspacePath, fsServiceMock as any);

		sinon.stub(webViewManager as any, 'getPreviewContent').resolves('<html></html>');
		const loadStub = sinon.stub(webViewManager as any, 'loadBackupContent').resolves();

		await webViewManager.previewBackup(backupFullPath);

		assert(vscodeMock.window.createWebviewPanel.calledOnce);
		assert((webViewManager as any).previewPanels.has(backupFullPath));
		assert(loadStub.calledWith(backupFullPath));
	});
	it('should handle preview messages', async () => {
		const panelSender: any = {
			webview: { postMessage: sinon.stub().resolves() },
			reveal: sinon.stub(),
		};
		const otherPanel: any = {
			webview: { postMessage: sinon.stub().resolves() },
			reveal: sinon.stub(),
		};
		const mainPanel: any = { webview: { postMessage: sinon.stub().resolves() } };
		(webViewManager as any).panel = mainPanel;
		(webViewManager as any).previewPanels.set(backupFullPath, panelSender);
		(webViewManager as any).previewPanels.set('other', otherPanel);

		const updateThemeStub = sinon.stub().resolves();
		sinon.stub(require('../services/settingsManager'), 'SettingsManager').callsFake(function () {
			return { updateTheme: updateThemeStub };
		});

		await (webViewManager as any).handlePreviewMessage({ command: 'themeChanged', theme: 'dark' }, backupFullPath, panelSender);

		assert(updateThemeStub.calledWith('dark'));
		assert(mainPanel.webview.postMessage.calledWithMatch({ command: 'updateTheme', theme: 'dark' }));
		assert(otherPanel.webview.postMessage.calledWithMatch({ command: 'updateTheme', theme: 'dark' }));
		assert.strictEqual(panelSender.webview.postMessage.called, false);

		const loadStub = sinon.stub(webViewManager as any, 'loadBackupContent').resolves();
		await (webViewManager as any).handlePreviewMessage({ command: 'loadBackupData' }, backupFullPath, panelSender);
		assert(loadStub.calledOnceWith(backupFullPath, panelSender));
	});

	it('loadBackupContent should post workspace state on success', async () => {
		const backupData = { workspace: { blocks: [] } };
		const backupContent = JSON.stringify(backupData);

		// 使用 path.join 計算的實際完整路徑
		const actualFullPath = path.join(workspacePath, backupRelPath);

		// 添加多個可能的路徑變體(確保 Windows/Unix 路徑兼容性)
		fsMock.addFile(backupFullPath, backupContent);
		fsMock.addFile(actualFullPath, backupContent);
		fsMock.addFile(backupRelPath, backupContent);

		(webViewManager as any).fileService = new FileService(workspacePath, fsServiceMock as any);
		const panel: any = { webview: { postMessage: sinon.stub().resolves() } };

		await (webViewManager as any).loadBackupContent(backupFullPath, panel);

		assert(panel.webview.postMessage.calledWithMatch({ command: 'loadWorkspaceState' }));
	});
	it('loadBackupContent should post loadError on failure', async () => {
		fsMock.addFile(backupFullPath, '');
		(webViewManager as any).fileService = new FileService(workspacePath, fsServiceMock as any);
		const panel: any = { webview: { postMessage: sinon.stub().resolves() } };

		await (webViewManager as any).loadBackupContent(backupFullPath, panel);

		assert(panel.webview.postMessage.calledWithMatch({ command: 'loadError' }));
	});
});
