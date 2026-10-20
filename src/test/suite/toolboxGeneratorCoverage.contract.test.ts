/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

/**
 * 每個工具箱積木放進主程式後都必須能產生程式碼。
 * 缺少 generator 或回傳格式錯誤時，Blockly 會讓整個 workspaceToCode 拋錯，
 * 使用者的程式碼預覽與上傳會一起失敗。
 */

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

const TARGETS = [
	{ board: 'uno', toolbox: 'index.json', root: 'arduino_setup_loop', generator: 'arduinoGenerator' },
	{ board: 'esp32', toolbox: 'index.json', root: 'arduino_setup_loop', generator: 'arduinoGenerator' },
	{ board: 'cyberbrick', toolbox: 'cyberbrick.json', root: 'micropython_main', generator: 'micropythonGenerator' },
	{ board: 'txt', toolbox: 'txt.json', root: 'txt_setup', generator: 'txtGenerator' },
];

function listScripts(relativeDir: string): string[] {
	return fs
		.readdirSync(path.join(PROJECT_ROOT, relativeDir))
		.filter(file => file.endsWith('.js'))
		.sort()
		.map(file => `${relativeDir}/${file}`);
}

// 積木定義沿用 Skill contract 產生器的共用 runtime（Blockly 的積木與擴充註冊是全域的，只能載入一次）
function loadBlockRuntime(): any {
	const shared = (global as any).Blockly;
	if (shared?.Blocks?.esp32_rc_receiver_init) {
		return { Blockly: shared };
	}
	const { loadRuntime } = require(path.join(PROJECT_ROOT, 'scripts', 'generate-skill-contract.js'));
	return loadRuntime();
}

// Generator 實例彼此獨立，放在隔離的 context 載入，不影響其他測試
function loadGenerators(Blockly: any): any {
	const quiet = { log() {}, info() {}, warn() {}, error() {}, debug() {} };
	const context: any = {
		Blockly,
		console: quiet,
		log: quiet,
		languageManager: { currentLanguage: 'en', getMessage: (key: string, fallback?: string) => fallback || key },
		getCurrentBoard: () => (global as any).window?.currentBoard || 'uno',
		setTimeout,
		clearTimeout,
	};
	context.window = context;
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT, 'media/blockly/blocks/board_configs.js'), 'utf8'), context);
	for (const language of ['arduino', 'micropython', 'txt']) {
		const scripts = listScripts(`media/blockly/generators/${language}`);
		const ordered = [`media/blockly/generators/${language}/index.js`, ...scripts.filter(file => !file.endsWith('/index.js'))];
		for (const script of ordered) {
			const filename = path.join(PROJECT_ROOT, script);
			vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename });
		}
	}
	return context;
}

function toolboxBlocks(toolboxFile: string): any[] {
	const resolve = (file: string): unknown => {
		const expand = (node: any): any => {
			if (Array.isArray(node)) {return node.map(expand);}
			if (node && typeof node === 'object') {
				if (node.$include) {return resolve(path.join(path.dirname(file), node.$include));}
				return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, expand(value)]));
			}
			return node;
		};
		return expand(JSON.parse(fs.readFileSync(file, 'utf8')));
	};
	const blocks: any[] = [];
	const collect = (node: any): void => {
		if (Array.isArray(node)) {node.forEach(collect);}
		else if (node && typeof node === 'object') {
			if (node.kind === 'block' && node.type) {blocks.push(node);}
			Object.values(node).forEach(collect);
		}
	};
	collect(resolve(path.join(PROJECT_ROOT, 'media', 'toolbox', toolboxFile)));
	return blocks;
}

suite('Toolbox generator coverage contract', () => {
	let Blockly: any;
	let generators: any;

	suiteSetup(function () {
		this.timeout(30000);
		Blockly = loadBlockRuntime().Blockly;
		generators = loadGenerators(Blockly);
	});

	for (const target of TARGETS) {
		test(`${target.board}: every toolbox block generates code inside the main block`, function () {
			this.timeout(30000);
			(global as any).window.currentBoard = target.board;
			const generator = generators[target.generator];
			const workspace = new Blockly.Workspace();
			const failures: string[] = [];
			const blocks = toolboxBlocks(target.toolbox);
			assert.ok(blocks.length > 0, 'toolbox should contain blocks');

			for (const definition of blocks) {
				workspace.clear();
				try {
					const root = workspace.newBlock(target.root);
					const statements = root.inputList.filter((input: any) => input.type === Blockly.inputs.inputTypes.STATEMENT);
					const body = statements[statements.length - 1].connection;
					const { kind: _kind, ...state } = definition;
					const block = Blockly.serialization.blocks.append(state, workspace);
					if (block.previousConnection) {
						body.connect(block.previousConnection);
					} else if (block.outputConnection) {
						const holder = workspace.newBlock('variables_set');
						body.connect(holder.previousConnection);
						holder.getInput('VALUE').connection.connect(block.outputConnection);
					}
					generator.workspaceToCode(workspace);
				} catch (error) {
					failures.push(`${definition.type}: ${(error as Error).message}`);
				}
			}
			workspace.dispose();
			assert.deepStrictEqual(failures, []);
		});
	}

	test('arduino: list variables use the SBList runtime declared before globals', () => {
		(global as any).window.currentBoard = 'uno';
		const workspace = new Blockly.Workspace();
		const number = (value: number) => ({ block: { type: 'math_number', fields: { NUM: value } } });
		Blockly.serialization.workspaces.load(
			{
				variables: [{ name: 'list', id: 'L' }],
				blocks: {
					languageVersion: 0,
					blocks: [
						{
							type: 'arduino_setup_loop',
							inputs: {
								SETUP: {
									block: {
										type: 'variables_set',
										fields: { VAR: { id: 'L' } },
										inputs: {
											VALUE: {
												block: {
													type: 'lists_create_with',
													extraState: { itemCount: 2 },
													inputs: { ADD0: number(1), ADD1: number(2) },
												},
											},
										},
									},
								},
							},
						},
					],
				},
			},
			workspace
		);
		const code: string = generators.arduinoGenerator.workspaceToCode(workspace);
		workspace.dispose();
		assert.ok(!code.includes('int[]'), code);
		assert.ok(code.includes('list = sbListOf(2, (double)(1), (double)(2));'), code);
		const runtime = code.indexOf('struct SBList');
		const declaration = code.indexOf('SBList list;');
		assert.ok(runtime >= 0 && declaration > runtime, code);
	});
});
