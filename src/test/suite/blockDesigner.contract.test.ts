/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { validateBlockPack } from '../../services/blockPackValidator';

const ROOT = path.join(__dirname, '..', '..', '..');

function runScript(relativePath: string): void {
	const filePath = path.join(ROOT, relativePath);
	vm.runInThisContext(`(function () {\n${fs.readFileSync(filePath, 'utf8')}\n})();`, { filename: filePath });
}

/** 依英文後援字串代入 {0}，與 WebView 的 formatBlockPackMessage 相同 */
function formatMessage(_key: string, fallback: string, ...args: unknown[]): string {
	return fallback.replace(/\{(\d+)\}/g, (match, index) => (args[Number(index)] === undefined ? match : String(args[Number(index)])));
}

suite('Block designer WebView contract', () => {
	let Blockly: any;
	let win: any;
	let designer: any;
	let generator: any;
	let originalGenerator: any;
	let originalBoard: string;
	const restoreGlobals: Array<() => void> = [];

	function setGlobal(name: string, value: unknown): void {
		const g = global as any;
		const had = Object.prototype.hasOwnProperty.call(g, name);
		const previous = g[name];
		g[name] = value;
		restoreGlobals.push(() => {
			if (had) {g[name] = previous;}
			else {delete g[name];}
		});
	}

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
		runScript('media/blockly/generators/arduino/logic.js');
		// 每個 suite 都重新載入，讓積木包產生器註冊在這次建立的 arduinoGenerator 上
		if (Blockly.registry.hasItem(Blockly.registry.Type.SERIALIZER, 'customBlocks')) {
			Blockly.registry.unregister(Blockly.registry.Type.SERIALIZER, 'customBlocks');
		}
		runScript('media/blockly/blockPacks.js');
		generator = win.arduinoGenerator;
		setGlobal('formatBlockPackMessage', formatMessage);
		if (!(global as any).document) {
			setGlobal('document', { readyState: 'complete', getElementById: () => null, addEventListener() {} });
		}
		runScript('media/js/blockDesigner.js');
		designer = win.blockDesigner.internals;
		designer.defineDesignBlocks();
	});

	suiteTeardown(() => {
		win.blockPacks?.activatePacks([]);
		win.arduinoGenerator = originalGenerator;
		win.currentBoard = originalBoard;
		delete win.blockDesigner;
		restoreGlobals.reverse().forEach(restore => restore());
	});

	setup(() => {
		win.currentBoard = 'esp32';
		win.blockPacks.activatePacks([]);
	});

	/** 從起始設計加入零件後編譯 */
	function compile(addPieces: (root: any, append: (type: string, fields: Record<string, unknown>) => any) => void): any {
		const workspace = new Blockly.Workspace();
		try {
			Blockly.serialization.workspaces.load(designer.starterState('readSensor', 'read sensor'), workspace);
			const root = workspace.getTopBlocks(false).find((block: any) => block.type === 'bd_block');
			let last = root.getInput('PIECES').connection;
			while (last.targetBlock()) {last = last.targetBlock().nextConnection;}
			const append = (type: string, fields: Record<string, unknown>) => {
				const piece = workspace.newBlock(type);
				// CHECK 先設定，讓預設值欄位換成對應的型別
				if (fields.CHECK !== undefined) {piece.setFieldValue(fields.CHECK, 'CHECK');}
				for (const [name, value] of Object.entries(fields)) {piece.setFieldValue(value, name);}
				last.connect(piece.previousConnection);
				last = piece.nextConnection;
				return piece;
			};
			addPieces(root, append);
			return designer.compileDesign(root);
		} finally {
			workspace.dispose();
		}
	}

	function packFrom(compiled: any, body: string): any {
		return {
			formatVersion: 1,
			id: 'custom_1',
			version: '1.0.0',
			defaultLocale: 'en',
			category: { name: 'My blocks', colour: '#a5745b' },
			blocks: [compiled.block],
			targets: {
				esp32: {
					globals: designer.functionSource(compiled, body) + '\n',
					blocks: { [compiled.block.name]: compiled.template },
				},
			},
			designer: { formatVersion: 1, globals: '', blocks: [{ name: compiled.block.name, state: {}, body }] },
		};
	}

	test('builds the function frame, call template and value defaults from the pieces', () => {
		const compiled = compile((_root, append) => {
			append('bd_value', { NAME: 'speed', CHECK: 'Number', DEFAULT: 42 });
			append('bd_value', { NAME: 'on', CHECK: 'Boolean', DEFAULT: 'false' });
			append('bd_value', { NAME: 'msg', CHECK: 'String', DEFAULT: 'hi' });
		});
		assert.deepStrictEqual(compiled.problems, []);
		assert.strictEqual(compiled.signature, 'float readSensor(int pin, float speed, bool on, String msg)');
		assert.strictEqual(compiled.template, 'readSensor({{PIN}}, {{SPEED}}, {{ON}}, {{MSG}})');
		assert.strictEqual(compiled.block.label, 'read sensor {PIN} {SPEED} {ON} {MSG}');
		assert.deepStrictEqual(
			compiled.block.inputs.slice(1).map((input: any) => [input.name, input.check, input.default]),
			[
				['SPEED', 'Number', 42],
				['ON', 'Boolean', 'false'],
				['MSG', 'String', 'hi'],
			]
		);
		assert.deepStrictEqual(compiled.paramNames, { PIN: 'pin', SPEED: 'speed', ON: 'on', MSG: 'msg' });
	});

	test('a designed pack passes the import validator and generates the function once with the call', () => {
		const compiled = compile((_root, append) => {
			append('bd_value', { NAME: 'on', CHECK: 'Boolean', DEFAULT: 'false' });
		});
		const pack = packFrom(compiled, '  return analogRead(pin) * (on ? 2 : 1);\n');
		assert.deepStrictEqual(validateBlockPack(pack).ok ? [] : (validateBlockPack(pack) as any).errors, []);

		const [category] = win.blockPacks.toolboxCategories([pack]);
		assert.deepStrictEqual(category.contents[0].inputs, { ON: { shadow: { type: 'logic_boolean', fields: { BOOL: 'FALSE' } } } });

		const workspace = new Blockly.Workspace();
		try {
			win.blockPacks.setPacks(workspace, [pack]);
			const setupLoop = workspace.newBlock('arduino_setup_loop');
			const print = workspace.newBlock('text_print');
			setupLoop.getInput('LOOP').connection.connect(print.previousConnection);
			const read = workspace.newBlock('pack_custom_1_read_sensor');
			print.getInput('TEXT').connection.connect(read.outputConnection);
			read.setFieldValue('34', 'PIN');
			const code = generator.workspaceToCode(workspace);
			assert.strictEqual(code.match(/float readSensor\(int pin, bool on\) \{/g)?.length, 1);
			assert.match(code, /readSensor\(34, \(false\)\)/);
		} finally {
			workspace.dispose();
		}
	});

	test('a block with an inner statement returns bool and runs the inner blocks when true', () => {
		const compiled = compile((root, append) => {
			root.setFieldValue('statement', 'SHAPE');
			append('bd_statement', { NAME: 'DO' });
		});
		assert.deepStrictEqual(compiled.problems, []);
		assert.strictEqual(compiled.returnType, 'bool');
		assert.strictEqual(compiled.template, 'if (readSensor({{PIN}})) {\n{{DO}}}');
	});

	test('reports naming problems instead of producing invalid C++', () => {
		const compiled = compile((root, append) => {
			root.setFieldValue('statement', 'SHAPE');
			append('bd_number', { NAME: 'pin' });
			append('bd_dropdown', { NAME: 'mode', OPTIONS: ' , ' });
		});
		assert.deepStrictEqual(compiled.problems, ['Two pieces are both named "pin".', 'The menu "mode" needs at least one option.']);
	});

	test('checks return statements against the block shape', () => {
		const problems = designer.returnProblems;
		assert.deepStrictEqual(problems('float', '  return analogRead(pin);\n'), []);
		assert.deepStrictEqual(problems('float', '  // return 1;\n  delay(1);\n'), ['The function must return a number, but the code has no return.']);
		assert.deepStrictEqual(problems('bool', '  if (x) return;\n  return true;\n'), ['Every return needs a true/false value after it.']);
		assert.deepStrictEqual(problems('void', '  return 1;\n'), [
			'This block only does something, so return cannot have a value. Use return; or remove it.',
		]);
		assert.deepStrictEqual(problems('float', '  return "hot";\n'), ['A return gives the wrong kind of value. This block returns a number.']);
		for (const body of ['  return true;\n', '  return 0;\n', '  return -1.5;\n']) {
			assert.deepStrictEqual(problems('String', body), ['A return gives the wrong kind of value. This block returns a text.'], body);
		}
		assert.deepStrictEqual(problems('String', '  return String(analogRead(pin));\n'), []);
		assert.deepStrictEqual(problems('String', ''), []);
		assert.strictEqual(designer.functionSource({ notes: [], signature: 'String label()', returnType: 'String' }, ''), 'String label() {\n  return "";\n}');
	});

	test('blocks plugged into a removed input move to the top level instead of breaking the load', () => {
		const before = compile((_root, append) => append('bd_value', { NAME: 'speed', CHECK: 'Number', DEFAULT: 7 }));
		const after = compile(() => undefined);
		const oldPack = packFrom(before, '');
		const newPack = packFrom(after, '');
		const source = new Blockly.Workspace();
		const target = new Blockly.Workspace();
		try {
			win.blockPacks.setPacks(source, [oldPack]);
			const read = source.newBlock('pack_custom_1_read_sensor');
			read.moveBy(100, 50);
			const number = source.newBlock('math_number');
			number.setFieldValue(99, 'NUM');
			read.getInput('SPEED').connection.connect(number.outputConnection);
			const state = Blockly.serialization.workspaces.save(source);
			state.customBlocks = { formatVersion: 1, packs: [newPack] };
			Blockly.serialization.workspaces.load(win.blockPacks.prepareState(state), target);
			const types = target.getTopBlocks(false).map((block: any) => block.type).sort();
			assert.deepStrictEqual(types, ['math_number', 'pack_custom_1_read_sensor']);
			const moved = target.getTopBlocks(false).find((block: any) => block.type === 'math_number');
			assert.strictEqual(moved.getFieldValue('NUM'), 99);
		} finally {
			source.dispose();
			target.dispose();
		}
	});
});
