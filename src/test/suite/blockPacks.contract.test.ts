/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const ROOT = path.join(__dirname, '..', '..', '..');
const EXAMPLES = path.join(ROOT, 'resources', 'block-pack-examples');

function readExample(name: string): any {
	return JSON.parse(fs.readFileSync(path.join(EXAMPLES, name), 'utf8'));
}

function runScript(relativePath: string): void {
	const filePath = path.join(ROOT, relativePath);
	// 包在函式內執行，避免重複載入時頂層 const 重複宣告
	vm.runInThisContext(`(function () {\n${fs.readFileSync(filePath, 'utf8')}\n})();`, { filename: filePath });
}

suite('Block pack WebView runtime contract', () => {
	let Blockly: any;
	let win: any;
	let generator: any;
	let originalGenerator: any;
	let originalBoard: string;

	suiteSetup(() => {
		const { loadRuntime } = require(path.join(ROOT, 'scripts', 'generate-skill-contract.js'));
		Blockly = (global as any).Blockly?.Blocks?.arduino_setup_loop ? (global as any).Blockly : loadRuntime().Blockly;
		win = (global as any).window;
		originalGenerator = win.arduinoGenerator;
		originalBoard = win.currentBoard;
		delete win.arduinoGenerator;
		runScript('media/blockly/generators/arduino/index.js');
		runScript('media/blockly/generators/arduino/text.js');
		runScript('media/blockly/generators/arduino/math.js');
		// 每個 suite 都重新載入，讓積木包產生器註冊在這次建立的 arduinoGenerator 上
		if (Blockly.registry.hasItem(Blockly.registry.Type.SERIALIZER, 'customBlocks')) {
			Blockly.registry.unregister(Blockly.registry.Type.SERIALIZER, 'customBlocks');
		}
		runScript('media/blockly/blockPacks.js');
		generator = win.arduinoGenerator;
	});

	suiteTeardown(() => {
		win.blockPacks?.activatePacks([]);
		win.arduinoGenerator = originalGenerator;
		win.currentBoard = originalBoard;
	});

	setup(() => {
		win.currentBoard = 'esp32';
		win.blockPacks.activatePacks([]);
	});

	function buildProgram(workspace: any): any {
		const setupLoop = workspace.newBlock('arduino_setup_loop');
		const hot = workspace.newBlock('pack_dht11_when_hot');
		setupLoop.getInput('LOOP').connection.connect(hot.previousConnection);
		const print = workspace.newBlock('text_print');
		hot.getInput('DO').connection.connect(print.previousConnection);
		const distance = workspace.newBlock('pack_hc_sr04_distance');
		print.getInput('TEXT').connection.connect(distance.outputConnection);
		const second = workspace.newBlock('pack_dht11_read');
		const print2 = workspace.newBlock('text_print');
		hot.nextConnection.connect(print2.previousConnection);
		print2.getInput('TEXT').connection.connect(second.outputConnection);
		hot.setFieldValue('4', 'PIN');
		second.setFieldValue('4', 'PIN');
		second.setFieldValue('true', 'WHAT');
		distance.setFieldValue('5', 'TRIG');
		distance.setFieldValue('18', 'ECHO');
		return setupLoop;
	}

	test('registers pack blocks, generates code once per pack, and collects library dependencies', () => {
		const workspace = new Blockly.Workspace();
		try {
			win.blockPacks.setPacks(workspace, [readExample('dht11.sbpack.json'), readExample('hc-sr04.sbpack.json')]);
			buildProgram(workspace);
			const code = generator.workspaceToCode(workspace);
			assert.strictEqual(code.match(/#include <DHT\.h>/g)?.length, 1);
			assert.strictEqual(code.match(/float dht11Read\(/g)?.length, 1);
			assert.strictEqual(code.match(/float hcSr04Distance\(/g)?.length, 1);
			assert.match(code, /if \(dht11Read\(4, false\) > \(30\)\) \{/);
			assert.match(code, /Serial\.println\(hcSr04Distance\(5, 18\)\);/);
			assert.match(code, /Serial\.println\(dht11Read\(4, true\)\);/);
			assert.deepStrictEqual(generator.lib_deps_, [
				'adafruit/DHT sensor library@^1.4.6',
				'adafruit/Adafruit Unified Sensor@^1.1.14',
			]);
		} finally {
			workspace.dispose();
		}
	});

	test('non-ESP32 boards get comments and safe fallback values instead of pack code', () => {
		const workspace = new Blockly.Workspace();
		try {
			win.blockPacks.setPacks(workspace, [readExample('dht11.sbpack.json'), readExample('hc-sr04.sbpack.json')]);
			buildProgram(workspace);
			win.currentBoard = 'uno';
			const code = generator.workspaceToCode(workspace);
			assert.doesNotMatch(code, /DHT\.h|dht11Read\(|hcSr04Distance\(/);
			assert.match(code, /\/\/ \[block pack\] pack_dht11_when_hot is not supported on this board/);
			assert.match(code, /Serial\.println\(0 \/\* \[block pack\] pack_dht11_read is not supported on this board \*\/\);/);
			assert.deepStrictEqual(generator.lib_deps_, []);
		} finally {
			workspace.dispose();
		}
	});

	test('substitutes text, number, value and pin inputs safely', () => {
		const pack = {
			formatVersion: 1,
			id: 'demo',
			version: '1.0.0',
			defaultLocale: 'en',
			category: { name: 'Demo', colour: 120 },
			blocks: [
				{
					name: 'say',
					shape: 'statement',
					label: 'say {MSG} {TIMES} times at 100% on {PIN} plus {EXTRA}',
					inputs: [
						{ name: 'MSG', kind: 'text', default: 'hi' },
						{ name: 'TIMES', kind: 'number', default: 2, min: 1, max: 5 },
						{ name: 'PIN', kind: 'pin', mode: 'digital', direction: 'output' },
						{ name: 'EXTRA', kind: 'value', check: 'Number', default: 7 },
					],
				},
				{ name: 'sum', shape: 'value', output: 'Number', label: 'sum', inputs: [] },
				{ name: 'mix', shape: 'value', output: 'Number', label: 'mix', inputs: [] },
			],
			targets: {
				esp32: {
					setup: 'Serial.begin(115200);\ndelay(10);',
					blocks: { say: 'say({{MSG}}, {{TIMES}}, {{PIN}}, {{EXTRA}});', sum: '1 + 2', mix: 'f("(") + g(")")' },
				},
			},
		};
		const workspace = new Blockly.Workspace();
		try {
			win.blockPacks.setPacks(workspace, [pack]);
			const block = workspace.newBlock('pack_demo_say');
			assert.ok(!win.blockPacks.pinOptions(pack.blocks[0].inputs![2]).some(([, value]: string[]) => ['34', '35', '36', '39'].includes(value)));
			assert.match(block.inputList.map((input: any) => input.fieldRow.map((field: any) => field.getText()).join(' ')).join(' '), /100%/);
			block.setFieldValue('a "quoted"\\ line\nnext', 'MSG');
			block.setFieldValue(9, 'TIMES');
			generator.init(workspace);
			assert.strictEqual(generator.forBlock.pack_demo_say.call(block, block, generator), '// [Skipped] pack_demo_say must be inside setup(), loop(), or a function\n');
			const setupLoop = workspace.newBlock('arduino_setup_loop');
			setupLoop.getInput('SETUP').connection.connect(block.previousConnection);
			const sum = workspace.newBlock('pack_demo_sum');
			block.getInput('EXTRA').connection.connect(sum.outputConnection);
			const code = generator.workspaceToCode(workspace);
			assert.match(code, /say\("a \\"quoted\\"\\\\ line\\nnext", 5, 0, \(\(1 \+ 2\)\)\);/);
			assert.strictEqual(code.match(/\/\/ Block pack: demo\n {2}Serial\.begin\(115200\);\n {2}delay\(10\);/g)?.length, 1);
			sum.dispose();
			assert.match(generator.workspaceToCode(workspace), /say\(.*, \(7\)\);/);
			const mix = workspace.newBlock('pack_demo_mix');
			block.getInput('EXTRA').connection.connect(mix.outputConnection);
			assert.match(generator.workspaceToCode(workspace), /, \(\(f\("\("\) \+ g\("\)"\)\)\)\);/);
		} finally {
			workspace.dispose();
		}
	});

	test('the customBlocks serializer round-trips packs, is omitted when empty, and unregisters removed packs', () => {
		const first = new Blockly.Workspace();
		const second = new Blockly.Workspace();
		const empty = new Blockly.Workspace();
		try {
			const dht = readExample('dht11.sbpack.json');
			win.blockPacks.setPacks(first, [dht]);
			first.newBlock('pack_dht11_read');
			const saved = Blockly.serialization.workspaces.save(first);
			assert.strictEqual(saved.customBlocks.formatVersion, 1);
			assert.deepStrictEqual(saved.customBlocks.packs.map((pack: any) => pack.id), ['dht11']);
			win.blockPacks.activatePacks([]);
			assert.strictEqual(Blockly.Blocks.pack_dht11_read, undefined);
			Blockly.serialization.workspaces.load(saved, second);
			assert.deepStrictEqual(second.getAllBlocks(false).map((block: any) => block.type), ['pack_dht11_read']);
			assert.deepStrictEqual(Blockly.serialization.workspaces.save(second), saved);
			assert.strictEqual('customBlocks' in Blockly.serialization.workspaces.save(empty), false);
		} finally {
			first.dispose();
			second.dispose();
			empty.dispose();
		}
	});

	test('missing pack blocks become placeholders that keep the full original state and are restored later', () => {
		const dht = readExample('dht11.sbpack.json');
		const source = new Blockly.Workspace();
		const withoutPack = new Blockly.Workspace();
		try {
			win.blockPacks.setPacks(source, [dht, readExample('hc-sr04.sbpack.json')]);
			buildProgram(source);
			const original = Blockly.serialization.workspaces.save(source);
			const missing = JSON.parse(JSON.stringify(original));
			missing.customBlocks.packs = missing.customBlocks.packs.filter((pack: any) => pack.id !== 'dht11');
			win.blockPacks.activatePacks([]);
			Blockly.serialization.workspaces.load(win.blockPacks.prepareState(missing), withoutPack);
			const types = withoutPack.getAllBlocks(false).map((block: any) => block.type).sort();
			assert.deepStrictEqual(types, ['arduino_setup_loop', 'block_pack_placeholder_statement', 'block_pack_placeholder_value', 'text_print']);
			win.currentBoard = 'esp32';
			assert.match(generator.workspaceToCode(withoutPack), /\/\/ \[block pack\] missing pack_dht11_when_hot/);
			assert.match(generator.workspaceToCode(withoutPack), /Serial\.println\(0 \/\* \[block pack\] missing pack_dht11_read \*\/\);/);
			assert.strictEqual(win.blockPacks.countPackBlocks(withoutPack, 'dht11'), 2);
			assert.strictEqual(win.blockPacks.countPackBlocks(withoutPack, 'dht11', ['read']), 1);

			const saved = Blockly.serialization.workspaces.save(withoutPack);
			saved.customBlocks = { formatVersion: 1, packs: [dht, readExample('hc-sr04.sbpack.json')] };
			const restored = win.blockPacks.prepareState(saved);
			assert.strictEqual(JSON.stringify(restored.blocks), JSON.stringify(original.blocks));
		} finally {
			source.dispose();
			withoutPack.dispose();
		}
	});

	test('derives toolbox categories, contract entries and a code preview from a pack', () => {
		const dht = readExample('dht11.sbpack.json');
		const hc = readExample('hc-sr04.sbpack.json');
		const [category] = win.blockPacks.toolboxCategories([hc]);
		assert.strictEqual(category.kind, 'category');
		assert.strictEqual(category.colour, '200');
		assert.deepStrictEqual(category.contents, [{ kind: 'block', type: 'pack_hc_sr04_distance', fields: { TRIG: '4', ECHO: '5' } }]);
		const [, , ...rest] = win.blockPacks.toolboxCategories([dht])[0].contents;
		assert.deepStrictEqual(rest, []);
		assert.deepStrictEqual(win.blockPacks.toolboxCategories([dht])[0].contents[1].inputs, {
			LIMIT: { shadow: { type: 'math_number', fields: { NUM: 30 } } },
		});

		const entries = win.blockPacks.contractEntries([dht], [
			{ id: 'esp32', language: 'arduino' },
			{ id: 'uno', language: 'arduino' },
			{ id: 'cyberbrick', language: 'micropython' },
		]);
		const read = entries.find((entry: any) => entry.type === 'pack_dht11_read');
		assert.deepStrictEqual(read.boards, ['esp32', 'uno']);
		assert.deepStrictEqual(read.variants.esp32.fields[1], { name: 'WHAT', kind: 'dropdown', optionsMode: 'static', options: ['false', 'true'] });
		assert.ok(entries.some((entry: any) => entry.type === 'block_pack_placeholder_value'));

		const preview = win.blockPacks.previewCode(dht);
		assert.match(preview, /^#include <DHT\.h>/);
		assert.match(preview, /dht11Read\(4, false\);/);
		assert.match(preview, /if \(dht11Read\(4, false\) > \(30\)\) \{/);
	});

	test('the edit and preview WebViews load the block pack runtime after the generators', () => {
		const manager = fs.readFileSync(path.join(ROOT, 'src', 'webview', 'webviewManager.ts'), 'utf8');
		assert.strictEqual(manager.match(/media\/blockly\/blockPacks\.js/g)?.length, 2);
		for (const html of ['blocklyEdit.html', 'blocklyPreview.html']) {
			const source = fs.readFileSync(path.join(ROOT, 'media', 'html', html), 'utf8');
			const packIndex = source.indexOf('{blockPacksUri}');
			assert.ok(packIndex > source.indexOf('{arduinoGeneratorUri}'), html);
			assert.ok(packIndex > source.indexOf('{boardConfigsUri}'), html);
		}
	});
});
