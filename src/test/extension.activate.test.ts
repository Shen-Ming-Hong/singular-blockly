/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-nocheck
import assert = require('assert');
import * as sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { activate, deactivate } from '../extension';
import * as logging from '../services/logging';
import { VSCodeMock } from './helpers/mocks';

describe('Extension activate', () => {
    let vscodeMock: VSCodeMock;
    let originalVscode: any;
    let context: any;

    beforeEach(() => {
        originalVscode = (global as any).vscode;
        vscodeMock = new VSCodeMock();
        vscodeMock.window.registerWebviewViewProvider = sinon.stub().returns({ dispose: sinon.stub() });
        (global as any).vscode = vscodeMock;
        context = { extensionPath: '/mock/extension', subscriptions: [] };
    });

    afterEach(() => {
        (global as any).vscode = originalVscode;
        sinon.restore();
    });

    it('registers commands and creates status bar on activate', () => {
        activate(context as any);

        const registered = vscodeMock.commands.registerCommand.getCalls().map(c => c.args[0]);
        assert(registered.includes('singular-blockly.openBlocklyEdit'));
        assert(registered.includes('singular-blockly.toggleTheme'));
        assert(registered.includes('singular-blockly.showOutput'));
        assert(registered.includes('singular-blockly.previewBackup'));
        assert(vscodeMock.window.createStatusBarItem.calledOnce);
    });

    it('disposes output channel on deactivate', () => {
        const disposeStub = sinon.stub(logging, 'disposeOutputChannel');
        deactivate();
        assert(disposeStub.calledOnce);
    });
});
