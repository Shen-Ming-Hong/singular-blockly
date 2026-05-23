/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import * as fs from 'fs';
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

	function createWorkspaceState(blocks: any[] = []): any {
		return { blocks: { blocks } };
	}

	function createTxtVirtualControlsDocument(controls: any[] = []): any {
		return {
			schemaVersion: 1,
			canvas: { mode: 'editing' },
			controls,
		};
	}

	function createVirtualButton(overrides: any = {}): any {
		return {
			stableId: 'btn-1',
			displayName: 'Start',
			identifier: 'start',
			kind: 'button',
			position: { x: 16, y: 24 },
			size: { width: 120, height: 48 },
			style: { backgroundColor: '#0288d1', textColor: '#ffffff' },
			...overrides,
		};
	}

	function addBackupFile(content: any): void {
		const backupContent = typeof content === 'string' ? content : JSON.stringify(content);
		const actualFullPath = path.join(workspacePath, backupRelPath);
		fsMock.addFile(backupFullPath, backupContent);
		fsMock.addFile(actualFullPath, backupContent);
		fsMock.addFile(backupRelPath, backupContent);
	}

	async function loadBackupMessages(backupData: any): Promise<any[]> {
		addBackupFile(backupData);
		(webViewManager as any).fileService = new FileService(workspacePath, fsServiceMock as any);
		const panel: any = { webview: { postMessage: sinon.stub().resolves() } };

		await (webViewManager as any).loadBackupContent(backupFullPath, panel);

		return panel.webview.postMessage.getCalls().map((call: sinon.SinonSpyCall) => call.args[0]);
	}

	function getPostedMessage(messages: any[], command: string): any {
		return messages.find(message => message.command === command);
	}

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

	it('should ignore forbidden TXT preview mutation/runtime messages', async () => {
		const panel: any = { webview: { postMessage: sinon.stub().resolves() } };
		const loadStub = sinon.stub(webViewManager as any, 'loadBackupContent').resolves();

		for (const command of ['saveWorkspace', 'txtUpload', 'txtVirtualControlStateChanged']) {
			await (webViewManager as any).handlePreviewMessage({ command }, backupFullPath, panel);
		}

		assert.strictEqual(loadStub.called, false);
		assert.strictEqual(panel.webview.postMessage.called, false);
	});

	it('TXT preview readonly controls should keep keyboard activation guarded', () => {
		const source = fs.readFileSync(path.join(process.cwd(), 'media/js/blocklyPreview.js'), 'utf8');

		assert(
			source.includes("['pointerdown', 'click', 'dblclick', 'contextmenu', 'keydown', 'dragstart']"),
			'preview guard should capture keyboard and pointer activation events'
		);
		assert(source.includes('preventTxtPreviewEdit(event);'), 'preview guard should prevent guarded activation events');
		assert(source.includes("button.setAttribute('aria-disabled', 'true');"), 'readonly buttons should expose disabled semantics');
		assert(source.includes('button.tabIndex = -1;'), 'readonly buttons should stay out of the tab order');
	});

	it('should sync language updates to preview panels', async () => {
		const panelA: any = { webview: { postMessage: sinon.stub().resolves() } };
		const panelB: any = { webview: { postMessage: sinon.stub().resolves() } };
		(webViewManager as any).previewPanels.set('a', panelA);
		(webViewManager as any).previewPanels.set('b', panelB);

		// 確保 fileService 使用正確的 fsMock
		(webViewManager as any).fileService = new FileService(workspacePath, fsServiceMock as any);

		sinon.stub(require('../services/settingsManager'), 'SettingsManager').callsFake(function () {
			return {
				getLanguage: sinon.stub().resolves('ja'),
				resolveLanguage: sinon.stub().returns('ja'),
			};
		});

		await (webViewManager as any).syncPreviewLanguage();

		assert(panelA.webview.postMessage.calledWithMatch({ command: 'updateLanguage', languagePreference: 'ja', resolvedLanguage: 'ja' }));
		assert(panelB.webview.postMessage.calledWithMatch({ command: 'updateLanguage', languagePreference: 'ja', resolvedLanguage: 'ja' }));
	});

	it('loadBackupContent should post workspace state on success', async () => {
		const backupData = { workspace: createWorkspaceState() };
		addBackupFile(backupData);
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

	it('loadBackupContent should map txt board and send virtual controls after setBoard', async () => {
		const txtVirtualControls = createTxtVirtualControlsDocument([createVirtualButton()]);
		const messages = await loadBackupMessages({
			board: 'txt',
			workspace: createWorkspaceState(),
			txtVirtualControls,
		});

		assert.strictEqual(messages[0].command, 'setBoard');
		assert.strictEqual(messages[0].board, 'txt');
		assert.strictEqual(messages[1].command, 'loadWorkspaceState');
		assert.deepStrictEqual(messages[1].txtVirtualControls.controls, txtVirtualControls.controls);
		assert.deepStrictEqual(messages[1].previewWarnings, []);
	});

	it('loadBackupContent should downgrade legacy txt backups with a warning', async () => {
		const messages = await loadBackupMessages({
			board: 'txt',
			workspace: createWorkspaceState(),
		});

		const loadMessage = getPostedMessage(messages, 'loadWorkspaceState');
		assert.strictEqual(loadMessage.txtVirtualControls.controls.length, 0);
		assert(loadMessage.previewWarnings.some((warning: any) => warning.code === 'legacy-missing-document'));
	});

	it('loadBackupContent should report empty txt controls without failing preview', async () => {
		const messages = await loadBackupMessages({
			board: 'txt',
			workspace: createWorkspaceState(),
			txtVirtualControls: createTxtVirtualControlsDocument([]),
		});

		const loadMessage = getPostedMessage(messages, 'loadWorkspaceState');
		assert.strictEqual(loadMessage.txtVirtualControls.controls.length, 0);
		assert(loadMessage.previewWarnings.some((warning: any) => warning.code === 'empty-controls'));
	});

	it('loadBackupContent should recover partial txt controls and report missing references', async () => {
		const workspace = createWorkspaceState([
			{
				id: 'block-1',
				type: 'txt_virtual_button_state',
				fields: { BUTTON_ID: 'missing-button' },
				extraState: { displayNameSnapshot: 'Missing Button' },
			},
		]);
		const messages = await loadBackupMessages({
			board: 'txt',
			workspace,
			txtVirtualControls: createTxtVirtualControlsDocument([
				createVirtualButton(),
				{ displayName: 'No Stable ID' },
				{ stableId: 'recoverable-button' },
			]),
		});

		const loadMessage = getPostedMessage(messages, 'loadWorkspaceState');
		assert.strictEqual(loadMessage.txtVirtualControls.controls.length, 2);
		assert(loadMessage.txtVirtualControls.controls.some((control: any) => control.stableId === 'recoverable-button'));
		assert(loadMessage.previewWarnings.some((warning: any) => warning.code === 'invalid-control-shape'));
		assert(loadMessage.previewWarnings.some((warning: any) => warning.code === 'missing-control-reference'));
	});

	it('loadBackupContent should not attach txt controls to non-TXT previews', async () => {
		const messages = await loadBackupMessages({
			board: 'cyberbrick',
			workspace: createWorkspaceState(),
			txtVirtualControls: createTxtVirtualControlsDocument([createVirtualButton()]),
		});

		const setBoardMessage = getPostedMessage(messages, 'setBoard');
		const loadMessage = getPostedMessage(messages, 'loadWorkspaceState');
		assert.strictEqual(setBoardMessage.board, 'cyberbrick');
		assert.strictEqual('txtVirtualControls' in loadMessage, false);
		assert.deepStrictEqual(loadMessage.previewWarnings, []);
	});

	it('getPreviewContent should inject TXT preview resources', async () => {
		const htmlTemplate = `<!DOCTYPE html><html><head><title>{fileName}</title></head><body>
			<div class="preview-title">{fileName}</div>
			<script src="{blocklyCompressedJsUri}"></script>
			<script src="{txtGeneratorUri}"></script>
			<script src="{txtBlocksUri}"></script>
			{txtModules}
			<script src="{txtVirtualControlsContrastUri}"></script>
			<script src="{previewJsUri}"></script>
		</body></html>`;
		fsMock.addFile(path.join(extensionPath, 'media/html/blocklyPreview.html'), htmlTemplate);
		sinon.stub(webViewManager as any, 'loadLocaleScripts').resolves('');
		sinon.stub(webViewManager as any, 'discoverArduinoModules').resolves([]);
		sinon.stub(webViewManager as any, 'discoverMicroPythonModules').resolves([]);
		sinon.stub(webViewManager as any, 'discoverTxtModules').resolves(['txt.js']);

		const html = await (webViewManager as any).getPreviewContent('test.json');

		assert(html.includes('media/blockly/generators/txt/index.js'));
		assert(html.includes('media/blockly/blocks/txt.js'));
		assert(html.includes('media/blockly/generators/txt/txt.js'));
		assert(html.includes('media/js/txtVirtualControlsContrast.js'));
		assert(
			html.indexOf('media/js/txtVirtualControlsContrast.js') < html.indexOf('media/js/blocklyPreview.js'),
			'TXT contrast helper should load before blocklyPreview.js'
		);
	});
});
