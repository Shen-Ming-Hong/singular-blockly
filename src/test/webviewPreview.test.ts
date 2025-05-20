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
import { WebViewManager } from '../webview/webviewManager';
import { FileService } from '../services/fileService';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('WebView Preview', () => {
        let fsServiceMock: any;
        let fsMock: FSMock;
        let vscodeMock: VSCodeMock;
        let originalVscode: any;
        let webViewManager: WebViewManager;
        const extensionPath = '/mock/extension';
        const workspacePath = '/mock/workspace';
        const backupRelPath = path.join('blockly', 'backup', 'test.json');
        const backupFullPath = path.join(workspacePath, backupRelPath);

        beforeEach(() => {
                originalVscode = (global as any).vscode;
                vscodeMock = new VSCodeMock();
                vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspacePath } }];
                (global as any).vscode = vscodeMock;

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
                        fsModule.exports = fsServiceMock;
                }

                fsMock.addDirectory(path.join(extensionPath, 'media'));

                const context = {
                        extensionPath,
                        subscriptions: [],
                };
                webViewManager = new WebViewManager(context as any);
        });

        afterEach(() => {
                (global as any).vscode = originalVscode;
                sinon.restore();
                fsMock.reset();
        });

        it('should create preview panel and load backup content', async () => {
                fsMock.addFile(backupFullPath, '{"workspace": {"blocks": []}}');

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
                fsMock.addFile(backupFullPath, JSON.stringify({ workspace: { blocks: [] } }));
                (webViewManager as any).fileService = new FileService(workspacePath);
                const panel: any = { webview: { postMessage: sinon.stub().resolves() } };

                await (webViewManager as any).loadBackupContent(backupFullPath, panel);

                assert(panel.webview.postMessage.calledWithMatch({ command: 'loadWorkspaceState' }));
        });

        it('loadBackupContent should post loadError on failure', async () => {
                fsMock.addFile(backupFullPath, '');
                (webViewManager as any).fileService = new FileService(workspacePath);
                const panel: any = { webview: { postMessage: sinon.stub().resolves() } };

                await (webViewManager as any).loadBackupContent(backupFullPath, panel);

                assert(panel.webview.postMessage.calledWithMatch({ command: 'loadError' }));
        });
});
