/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

type MessageListener = (event: { data: unknown }) => void;

function createRuntimeHarness() {
	const listeners = new Map<string, Set<(...args: any[]) => void>>();
	const postedMessages: any[] = [];
	let promptAdapter: ((message: string, defaultValue: string, callback: (value: string | null) => void) => void) | null = null;
	let confirmAdapter: ((message: string, callback: (confirmed: boolean) => void) => void) | null = null;
	let uuidSequence = 0;
	const focusTarget = { isConnected: true, focusCalls: 0, focus() { this.focusCalls++; } };
	const windowStub: any = {
		BLOCKLY_RUNTIME_CONFIG: { mode: 'edit', mediaUri: 'vscode-resource:/blockly/media/', localeUris: {} },
		crypto: { randomUUID: () => `uuid-${++uuidSequence}` },
		addEventListener(type: string, listener: (...args: any[]) => void) {
			const typeListeners = listeners.get(type) || new Set();
			typeListeners.add(listener);
			listeners.set(type, typeListeners);
		},
		removeEventListener(type: string, listener: (...args: any[]) => void) {
			listeners.get(type)?.delete(listener);
		},
	};
	const blocklyStub: any = {
		inject: () => ({ dispose() {} }),
		serialization: { workspaces: { save: () => ({}), load: () => undefined } },
		dialog: {
			setPrompt(adapter: typeof promptAdapter) { promptAdapter = adapter; },
			setConfirm(adapter: typeof confirmAdapter) { confirmAdapter = adapter; },
		},
	};
	const context = vm.createContext({
		window: windowStub,
		document: { activeElement: focusTarget },
		Blockly: blocklyStub,
		Date,
		Object,
		String,
		Map,
		Set,
		TypeError,
	});
	const runtimePath = path.join(__dirname, '..', '..', '..', 'media', 'js', 'blocklyRuntime.js');
	vm.runInContext(fs.readFileSync(runtimePath, 'utf8'), context, { filename: runtimePath });
	windowStub.blocklyRuntime.installDialogAdapter(
		{ postMessage: (message: unknown) => postedMessages.push(message) },
		() => 'cyberbrick'
	);

	return {
		windowStub,
		postedMessages,
		focusTarget,
		prompt(message: string, defaultValue: string, callback: (value: string | null) => void) {
			assert.ok(promptAdapter);
			promptAdapter!(message, defaultValue, callback);
		},
		confirm(message: string, callback: (confirmed: boolean) => void) {
			assert.ok(confirmAdapter);
			confirmAdapter!(message, callback);
		},
		dispatchMessage(data: unknown) {
			for (const listener of listeners.get('message') || []) {
				(listener as MessageListener)({ data });
			}
		},
	};
}

suite('Blockly dialog adapter contract', () => {
	test('prompt 以 request ID 配對取消結果，且重複結果只完成一次', () => {
		const harness = createRuntimeHarness();
		const results: Array<string | null> = [];
		harness.prompt('Variable name', 'speed', value => results.push(value));

		assert.deepStrictEqual(JSON.parse(JSON.stringify(harness.postedMessages[0])), {
			command: 'blocklyDialogPrompt',
			requestId: 'dlg-uuid-1',
			message: 'Variable name',
			defaultValue: 'speed',
			board: 'cyberbrick',
		});
		harness.dispatchMessage({ command: 'blocklyDialogPromptResult', requestId: 'dlg-uuid-1', value: null });
		harness.dispatchMessage({ command: 'blocklyDialogPromptResult', requestId: 'dlg-uuid-1', value: 'duplicate' });

		assert.deepStrictEqual(results, [null]);
		assert.strictEqual(harness.focusTarget.focusCalls, 1);
	});

	test('confirm 只接受同 ID 的 boolean result', () => {
		const harness = createRuntimeHarness();
		const results: boolean[] = [];
		harness.confirm('Delete?', confirmed => results.push(confirmed));
		const request = harness.postedMessages[0];

		harness.dispatchMessage({ command: 'blocklyDialogConfirmResult', requestId: request.requestId, confirmed: 'yes' });
		harness.dispatchMessage({ command: 'blocklyDialogConfirmResult', requestId: 'unknown', confirmed: true });
		assert.deepStrictEqual(results, []);

		harness.dispatchMessage({ command: 'blocklyDialogConfirmResult', requestId: request.requestId, confirmed: false });
		assert.deepStrictEqual(results, [false]);
	});

	test('dispose 會取消所有 pending callbacks', () => {
		const harness = createRuntimeHarness();
		const promptResults: Array<string | null> = [];
		const confirmResults: boolean[] = [];
		harness.prompt('Name', '', value => promptResults.push(value));
		harness.confirm('Continue?', value => confirmResults.push(value));

		harness.windowStub.blocklyRuntime.disposeDialogAdapter();

		assert.deepStrictEqual(promptResults, [null]);
		assert.deepStrictEqual(confirmResults, [false]);
	});
});
