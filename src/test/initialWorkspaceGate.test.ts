/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { LocaleService } from '../services/localeService';
import { FileService } from '../services/fileService';
import { WorkspaceCandidateService } from '../services/workspaceCandidateService';
import { WebViewManager, _reset, _setVSCodeApi } from '../webview/webviewManager';
import { _reset as resetHandler, _setVSCodeApi as setHandlerVSCodeApi } from '../webview/messageHandler';
import { VSCodeMock } from './helpers/mocks';

const ROOT = path.join(__dirname, '..', '..');

suite('Initial workspace load boundary', () => {
	let workspace: string;

	setup(() => {
		workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-initial-gate-'));
		fs.mkdirSync(path.join(workspace, 'blockly'), { recursive: true });
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), JSON.stringify({
			board: 'cyberbrick',
			theme: 'dark',
			workspace: {
				blocks: {
					languageVersion: 0,
					blocks: [{
						type: 'micropython_main',
						id: 'legacy-root',
						inputs: {
							MAIN: {
								block: {
									type: 'controls_if',
									id: 'legacy-if',
									extraState: { hasElse: true },
									inputs: {
										IF0: { block: { type: 'logic_boolean', fields: { BOOL: 'TRUE' } } },
										DO0: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'yes' } } } } } },
										ELSE: { block: { type: 'text_print', inputs: { TEXT: { shadow: { type: 'text', fields: { TEXT: 'no' } } } } } },
									},
								},
							},
						},
					}],
				},
			},
		}));
	});

	teardown(() => {
		_reset();
		resetHandler();
		fs.rmSync(workspace, { recursive: true, force: true });
	});

	test('requestInitialState loads an untouched legacy project without treating it as an external candidate', async () => {
		const vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspace } }];
		_setVSCodeApi(vscodeMock as any);
		setHandlerVSCodeApi(vscodeMock as any);
		const candidate = new WorkspaceCandidateService(workspace).start(vscodeMock.workspace);
		const context = { extensionPath: ROOT, subscriptions: [] } as any;
		const manager = new WebViewManager(
			context,
			new LocaleService(ROOT, undefined, vscodeMock as any),
			new FileService(ROOT),
			new FileService(workspace)
		);

		try {
			await manager.createAndShowWebView();
			const panel: any = manager.getPanel();
			const originalMain = fs.readFileSync(path.join(workspace, 'blockly', 'main.json'));

			await panel.webview.dispatchMessage({ command: 'requestInitialState' });

			const messages = panel.webview.postMessage.getCalls().map((call: any) => call.args[0]);
			const init = messages.find((message: any) => message.command === 'init');
			assert.ok(init, 'the existing workspace should be delivered through the normal init message');
			assert.strictEqual(init.board, 'cyberbrick');
			assert.strictEqual(init.workspace.blocks.blocks[0].inputs.MAIN.block.inputs.ELSE.block.type, 'text_print');
			assert.strictEqual(messages.some((message: any) => message.command === 'validateWorkspaceCandidate'), false);
			assert.strictEqual(messages.some((message: any) => message.command === 'loadWorkspace'), false);
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), originalMain);
			assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.invalid.json')), false);
			assert.ok(init.initialLoadRequestId, 'the initial runtime load should be correlated before seeding recovery');
			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult',
				requestId: init.initialLoadRequestId,
				success: true,
				normalizedDocument: init.document,
			});
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), originalMain);
			assert.deepStrictEqual(
				JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')),
				init.document
			);
		} finally {
			manager.closePanel();
			candidate.dispose();
		}
	});

	test('commits a repaired initial CyberBrick document to main and backup without changing its program', async () => {
		const source = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8'));
		source.workspace.blocks.blocks[0].disabledReasons = ['MANUALLY_DISABLED', 'EXTERNAL_POLICY'];
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), JSON.stringify(source));
		const vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspace } }];
		_setVSCodeApi(vscodeMock as any);
		setHandlerVSCodeApi(vscodeMock as any);
		const candidate = new WorkspaceCandidateService(workspace).start(vscodeMock.workspace);
		const manager = new WebViewManager(
			{ extensionPath: ROOT, subscriptions: [] } as any,
			new LocaleService(ROOT, undefined, vscodeMock as any),
			new FileService(ROOT),
			new FileService(workspace)
		);

		try {
			await manager.createAndShowWebView();
			const panel: any = manager.getPanel();
			await panel.webview.dispatchMessage({ command: 'requestInitialState' });
			const init = panel.webview.postMessage.getCalls().map((call: any) => call.args[0])
				.find((message: any) => message.command === 'init');
			const repaired = JSON.parse(JSON.stringify(init.document));
			delete repaired.workspace.blocks.blocks[0].disabledReasons;
			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult',
				requestId: init.initialLoadRequestId,
				success: true,
				normalizedDocument: repaired,
				mainBlockStateRepaired: true,
			});

			const main = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8'));
			const backup = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8'));
			assert.deepStrictEqual(main, repaired);
			assert.deepStrictEqual(backup, repaired);
			assert.strictEqual(main.workspace.blocks.blocks[0].inputs.MAIN.block.inputs.ELSE.block.type, 'text_print');
		} finally {
			manager.closePanel();
			candidate.dispose();
		}
	});

	test('ignores stale or malformed repair acknowledgements and never overwrites newer source bytes', async () => {
		const vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspace } }];
		_setVSCodeApi(vscodeMock as any);
		setHandlerVSCodeApi(vscodeMock as any);
		const candidate = new WorkspaceCandidateService(workspace).start(vscodeMock.workspace);
		const manager = new WebViewManager(
			{ extensionPath: ROOT, subscriptions: [] } as any,
			new LocaleService(ROOT, undefined, vscodeMock as any),
			new FileService(ROOT),
			new FileService(workspace)
		);

		try {
			await manager.createAndShowWebView();
			const panel: any = manager.getPanel();
			await panel.webview.dispatchMessage({ command: 'requestInitialState' });
			const init = panel.webview.postMessage.getCalls().map((call: any) => call.args[0])
				.find((message: any) => message.command === 'init');
			const normalized = { ...init.document, repaired: true };
			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult', requestId: 'stale-request', success: true,
				normalizedDocument: normalized, mainBlockStateRepaired: true,
			});
			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult', requestId: init.initialLoadRequestId, success: true,
				normalizedDocument: normalized, mainBlockStateRepaired: 'true',
			});
			assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.json.bak')), false);

			const newer = Buffer.from(JSON.stringify({ ...init.document, newer: true }));
			fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), newer);
			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult', requestId: init.initialLoadRequestId, success: true,
				normalizedDocument: normalized, mainBlockStateRepaired: true,
			});
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), newer);
			assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.json.bak')), false);
		} finally {
			manager.closePanel();
			candidate.dispose();
		}
	});

	test('requestInitialState canonicalizes a legacy board id without rewriting the original main bytes', async () => {
		const legacy = {
			board: 'arduino_uno',
			workspace: {
				blocks: { languageVersion: 0, blocks: [{ type: 'arduino_setup_loop', id: 'legacy-arduino-root' }] },
			},
		};
		const legacyBytes = Buffer.from(JSON.stringify(legacy));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), legacyBytes);
		const vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspace } }];
		_setVSCodeApi(vscodeMock as any);
		setHandlerVSCodeApi(vscodeMock as any);
		const candidate = new WorkspaceCandidateService(workspace).start(vscodeMock.workspace);
		const manager = new WebViewManager(
			{ extensionPath: ROOT, subscriptions: [] } as any,
			new LocaleService(ROOT, undefined, vscodeMock as any),
			new FileService(ROOT),
			new FileService(workspace)
		);

		try {
			await manager.createAndShowWebView();
			const panel: any = manager.getPanel();
			await panel.webview.dispatchMessage({ command: 'requestInitialState' });
			const init = panel.webview.postMessage.getCalls().map((call: any) => call.args[0])
				.find((message: any) => message.command === 'init');
			assert.strictEqual(init.board, 'uno');
			assert.strictEqual(init.document.board, 'uno');
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), legacyBytes);
			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult', requestId: init.initialLoadRequestId,
				success: true, normalizedDocument: init.document,
			});
			assert.strictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')).board, 'uno');
		} finally {
			manager.closePanel();
			candidate.dispose();
		}
	});

	test('malformed initial bytes are quarantined without being replaced by a blank project', async () => {
		const malformed = Buffer.from('{"board":"cyberbrick",');
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), malformed);
		const vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspace } }];
		_setVSCodeApi(vscodeMock as any);
		setHandlerVSCodeApi(vscodeMock as any);
		const candidate = new WorkspaceCandidateService(workspace).start(vscodeMock.workspace);
		const manager = new WebViewManager(
			{ extensionPath: ROOT, subscriptions: [] } as any,
			new LocaleService(ROOT, undefined, vscodeMock as any),
			new FileService(ROOT),
			new FileService(workspace)
		);

		try {
			await manager.createAndShowWebView();
			const panel: any = manager.getPanel();
			await panel.webview.dispatchMessage({ command: 'requestInitialState' });
			const messages = panel.webview.postMessage.getCalls().map((call: any) => call.args[0]);
			const init = messages.find((message: any) => message.command === 'init');
			assert.ok(init, 'the editor should still receive a safe empty in-memory state');
			assert.deepStrictEqual(init.workspace, {});
			assert.strictEqual(init.initialLoadRequestId, undefined);
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.invalid.json')), malformed);
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), malformed);
		} finally {
			manager.closePanel();
			candidate.dispose();
		}
	});

	test('runtime-invalid initial JSON is quarantined and replaced by the last valid project', async () => {
		const invalidDocument = {
			board: 'uno',
			workspace: {
				blocks: {
					languageVersion: 0,
					blocks: [{ type: 'missing_external_block', id: 'invalid-root' }],
				},
			},
		};
		const recoveryDocument = {
			board: 'uno',
			workspace: {
				blocks: {
					languageVersion: 0,
					blocks: [{ type: 'arduino_setup_loop', id: 'valid-root' }],
				},
			},
		};
		const invalidBytes = Buffer.from(JSON.stringify(invalidDocument));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), invalidBytes);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), `${JSON.stringify(recoveryDocument)}\n`);

		const vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: workspace } }];
		_setVSCodeApi(vscodeMock as any);
		setHandlerVSCodeApi(vscodeMock as any);
		const candidate = new WorkspaceCandidateService(workspace).start(vscodeMock.workspace);
		const manager = new WebViewManager(
			{ extensionPath: ROOT, subscriptions: [] } as any,
			new LocaleService(ROOT, undefined, vscodeMock as any),
			new FileService(ROOT),
			new FileService(workspace)
		);

		try {
			await manager.createAndShowWebView();
			const panel: any = manager.getPanel();
			await panel.webview.dispatchMessage({ command: 'requestInitialState' });
			const firstInit = panel.webview.postMessage.getCalls()
				.map((call: any) => call.args[0])
				.find((message: any) => message.command === 'init');
			assert.ok(firstInit?.initialLoadRequestId);

			await panel.webview.dispatchMessage({
				command: 'workspaceInitialLoadResult',
				requestId: firstInit.initialLoadRequestId,
				success: false,
				issue: { code: 'UNKNOWN_BLOCK_TYPE', blockType: 'missing_external_block' },
			});

			const initMessages = panel.webview.postMessage.getCalls()
				.map((call: any) => call.args[0])
				.filter((message: any) => message.command === 'init');
			assert.strictEqual(initMessages.length, 2);
			assert.strictEqual(initMessages[1].document.workspace.blocks.blocks[0].type, 'arduino_setup_loop');
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.invalid.json')), invalidBytes);
			assert.deepStrictEqual(
				JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')),
				recoveryDocument
			);
		} finally {
			manager.closePanel();
			candidate.dispose();
		}
	});
});
