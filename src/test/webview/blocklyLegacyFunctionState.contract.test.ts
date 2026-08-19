/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

function collectBlocks(state: any): any[] {
	const blocks: any[] = [];
	const visit = (block: any) => {
		if (!block || typeof block !== 'object') {
			return;
		}
		blocks.push(block);
		for (const input of Object.values(block.inputs || {}) as any[]) {
			visit(input.block);
			visit(input.shadow);
		}
		visit(block.next?.block);
	};
	for (const topBlock of state.blocks?.blocks || []) {
		visit(topBlock);
	}
	return blocks;
}

function createRuntimeHarness() {
	const loadedStates: any[] = [];
	const windowStub: any = {
		BLOCKLY_RUNTIME_CONFIG: {
			mode: 'edit',
			mediaUri: 'vscode-resource:/blockly/media/',
			localeUris: {},
		},
		addEventListener() {},
		removeEventListener() {},
	};
	class FieldTextInputStub {
		onHtmlInputKeyDown_() {}
	}
	const blocklyStub: any = {
		FieldTextInput: FieldTextInputStub,
		fieldRegistry: { unregister() {}, register() {} },
		inject() {
			return { dispose() {} };
		},
		serialization: {
			workspaces: {
				save() {
					return {};
				},
				load(state: any) {
					loadedStates.push(state);
				},
			},
		},
		dialog: {
			setPrompt() {},
			setConfirm() {},
		},
	};
	const context = vm.createContext({
		window: windowStub,
		document: { activeElement: null },
		Blockly: blocklyStub,
		Object,
		String,
		Number,
		Map,
		Set,
		Promise,
		TypeError,
	});
	const runtimePath = path.join(PROJECT_ROOT, 'media', 'js', 'blocklyRuntime.js');
	vm.runInContext(fs.readFileSync(runtimePath, 'utf8'), context, { filename: runtimePath });
	return { windowStub, loadedStates };
}

suite('Blockly legacy function state contract', () => {
	test('真實 Blockly 13 load/save 可保留舊呼叫積木名稱、定義關聯與 ARG shadow', () => {
		const output = execFileSync(
			process.env.npm_node_execpath || 'node',
			[path.join(PROJECT_ROOT, 'scripts', 'validate-blockly-legacy-functions.js')],
			{ cwd: PROJECT_ROOT, encoding: 'utf8' }
		);
		const report = JSON.parse(output);
		assert.match(report.blocklyVersion, /^13\./);
		assert.deepStrictEqual(report.callNames, ['前進', '停止']);
		assert.strictEqual(report.argument, '速度');
		assert.strictEqual(report.shadowValue, 100);
		assert.strictEqual(report.roundTrips, 2);
	});

	test('既有 sample 的 XML extraState 在 Blockly 13 載入前轉成 JSON 並保留函式關聯', () => {
		const harness = createRuntimeHarness();
		const sample = JSON.parse(
			fs.readFileSync(path.join(PROJECT_ROOT, 'media', 'samples', 'cyberbrick-motor-led-test.json'), 'utf8')
		);

		assert.strictEqual(harness.windowStub.blocklyRuntime.loadWorkspaceState(sample.workspace, {}), true);
		assert.strictEqual(harness.loadedStates.length, 1);

		const blocks = collectBlocks(harness.loadedStates[0]);
		const definitions = blocks.filter(block => block.type === 'arduino_function');
		const calls = blocks.filter(block => block.type === 'arduino_function_call');
		assert.ok(definitions.length >= 10, 'sample 應涵蓋多個函式定義');
		assert.ok(calls.length >= 10, 'sample 應涵蓋多個函式呼叫');
		assert.ok(definitions.every(block => typeof block.extraState === 'object'));
		assert.ok(calls.every(block => typeof block.extraState === 'object'));
		assert.ok(calls.every(block => block.extraState.name && block.extraState.name !== 'myFunction'));

		const forwardCall = calls.find(block => block.extraState.name === '前進');
		assert.deepStrictEqual(JSON.parse(JSON.stringify(forwardCall.extraState)), {
			version: 1,
			name: '前進',
			arguments: ['前進速度'],
			argumentTypes: ['int'],
		});
		assert.strictEqual(forwardCall.inputs.ARG0.shadow.fields.NUM, 100);

		const motorDefinition = definitions.find(block => block.fields?.NAME === '馬達移動');
		assert.deepStrictEqual(JSON.parse(JSON.stringify(motorDefinition.extraState.arguments)), ['左輪速度', '右輪速度']);
		assert.deepStrictEqual(JSON.parse(JSON.stringify(motorDefinition.extraState.argumentTypes)), ['int', 'int']);
	});

	test('legacy XML attribute entities 與 locked 狀態會安全解碼', () => {
		const harness = createRuntimeHarness();
		const state = {
			blocks: {
				blocks: [
					{
						type: 'arduino_function_call',
						extraState:
							'<mutation name="A &amp; B"><arg name="x &quot;y&quot;" type="String"></arg></mutation>',
					},
					{
						type: 'arduino_function',
						extraState: '<mutation locked="true"><arg name="次數" type="int"></arg></mutation>',
					},
				],
			},
		};

		harness.windowStub.blocklyRuntime.loadWorkspaceState(state, {});
		const [call, definition] = harness.loadedStates[0].blocks.blocks;
		assert.strictEqual(call.extraState.name, 'A & B');
		assert.deepStrictEqual(JSON.parse(JSON.stringify(call.extraState.arguments)), ['x "y"']);
		assert.strictEqual(definition.extraState.locked, true);
	});

	test('migration 不使用 DOM injection 或擴大 legacy Blockly API allowlist', () => {
		const source = fs.readFileSync(path.join(PROJECT_ROOT, 'media', 'js', 'blocklyRuntime.js'), 'utf8');
		assert.doesNotMatch(source, /DOMParser|innerHTML|Blockly\.Xml\./);
		assert.match(source, /load\(normalizeWorkspaceState\(state\), workspace\)/);
	});
});
