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
const RUNTIME_PATH = path.join(ROOT, 'media', 'js', 'blocklyRuntime.js');
const EDITOR_PATH = path.join(ROOT, 'media', 'js', 'blocklyEdit.js');
const FIXTURE_ROOT = path.join(ROOT, 'src', 'test', 'fixtures', 'main-block-disable-guard');
const REQUIRED_TYPES = ['arduino_setup_loop', 'micropython_main', 'txt_setup'];

function loadGeneratorModules(directory: string): void {
	const files = fs.readdirSync(directory).filter(file => file.endsWith('.js')).sort((left, right) => {
		if (left === 'index.js') {return -1;}
		if (right === 'index.js') {return 1;}
		return left.localeCompare(right, 'en');
	});
	for (const file of files) {
		const filePath = path.join(directory, file);
		vm.runInThisContext(fs.readFileSync(filePath, 'utf8'), { filename: filePath });
	}
}

suite('Main block disable guard contract', () => {
	let runtime: any;
	let Blockly: any;
	let policy: any;

	suiteSetup(() => {
		if ((global as any).Blockly?.Blocks?.arduino_setup_loop) {
			let currentWorkspace: any;
			runtime = {
				Blockly: (global as any).Blockly,
				setWorkspace(workspace: any) {
					currentWorkspace = workspace;
					(global as any).window.getBlocklyWorkspace = () => currentWorkspace;
				},
			};
		} else {
			const { loadRuntime } = require(path.join(ROOT, 'scripts', 'generate-skill-contract.js'));
			runtime = loadRuntime();
		}
		Blockly = runtime.Blockly;
		vm.runInThisContext(fs.readFileSync(RUNTIME_PATH, 'utf8'), { filename: RUNTIME_PATH });
		policy = (global as any).window.blocklyRuntime;
		const originalLog = console.log;
		console.log = () => {};
		try {
			for (const [language, globalName] of [
				['arduino', 'arduinoGenerator'],
				['micropython', 'micropythonGenerator'],
				['txt', 'txtGenerator'],
			] as const) {
				if (!(global as any).window[globalName]) {
					loadGeneratorModules(path.join(ROOT, 'media', 'blockly', 'generators', language));
				}
			}
		} finally {
			console.log = originalLog;
		}
	});

	setup(() => {
		Blockly.ContextMenuRegistry.registry.reset();
		Blockly.ContextMenuItems.registerDefaultOptions();
		while (!Blockly.Events.isEnabled()) {Blockly.Events.enable();}
	});

	teardown(() => {
		while (!Blockly.Events.isEnabled()) {Blockly.Events.enable();}
	});

	function loadFixture(name: string): { document: any; workspace: any } {
		const document = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, `${name}.json`), 'utf8'));
		const workspace = new Blockly.Workspace();
		runtime.setWorkspace(workspace);
		Blockly.serialization.workspaces.load(document.workspace, workspace);
		return { document, workspace };
	}

	test('hides the core disable item for all required main blocks and delegates ordinary blocks', () => {
		const registry = Blockly.ContextMenuRegistry.registry;
		const original = registry.getItem('blockDisable');
		assert.ok(original);
		assert.strictEqual(policy.installRequiredMainBlockDisableGuard(), true);
		const wrapped = registry.getItem('blockDisable');
		assert.ok(wrapped);
		assert.notStrictEqual(wrapped, original);
		for (const key of Object.keys(original)) {
			if (key !== 'preconditionFn') {assert.strictEqual(wrapped[key], original[key], key);}
		}

		const workspace = new Blockly.Workspace();
		try {
			for (const type of REQUIRED_TYPES) {
				const block = workspace.newBlock(type);
				assert.strictEqual(wrapped.preconditionFn({ block }, {}), 'hidden', type);
			}
			const ordinary = workspace.newBlock('text_print');
			assert.strictEqual(
				wrapped.preconditionFn({ block: ordinary }, {}),
				original.preconditionFn({ block: ordinary }, {})
			);
			wrapped.callback({ block: ordinary });
			assert.strictEqual(ordinary.hasDisabledReason('MANUALLY_DISABLED'), true);
			wrapped.callback({ block: ordinary });
			assert.strictEqual(ordinary.isEnabled(), true);
		} finally {
			workspace.dispose();
		}
	});

	test('is idempotent, survives a registry reset, and fails safely when the core item is absent', () => {
		const registry = Blockly.ContextMenuRegistry.registry;
		assert.strictEqual(policy.installRequiredMainBlockDisableGuard(), true);
		const firstWrapped = registry.getItem('blockDisable');
		assert.strictEqual(policy.installRequiredMainBlockDisableGuard(), false);
		assert.strictEqual(registry.getItem('blockDisable'), firstWrapped);

		registry.reset();
		assert.strictEqual(policy.installRequiredMainBlockDisableGuard(), false);
		assert.strictEqual(registry.getItem('blockDisable'), null);

		Blockly.ContextMenuItems.registerDefaultOptions();
		assert.strictEqual(policy.installRequiredMainBlockDisableGuard(), true);
		assert.notStrictEqual(registry.getItem('blockDisable'), firstWrapped);
	});

	test('removes every required-main reason while preserving ordinary, function, and TXT process reasons', () => {
		for (const name of ['arduino', 'cyberbrick', 'txt']) {
			const { document, workspace } = loadFixture(name);
			try {
				const before = new Map(
					workspace.getAllBlocks(false).map((block: any) => [block.id, [...block.getDisabledReasons()]])
				);
				assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), true, name);
				for (const block of workspace.getAllBlocks(false)) {
					if (REQUIRED_TYPES.includes(block.type)) {
						assert.deepStrictEqual([...block.getDisabledReasons()], [], block.type);
					} else {
						assert.deepStrictEqual([...block.getDisabledReasons()], before.get(block.id), block.type);
					}
				}
				const normalized = Blockly.serialization.workspaces.save(workspace);
				const protectedStates = normalized.blocks.blocks.filter((block: any) => REQUIRED_TYPES.includes(block.type));
				assert.ok(protectedStates.every((block: any) => block.disabledReasons === undefined));
				assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), false);
				assert.strictEqual(normalized.blocks.blocks[0].id, document.workspace.blocks.blocks[0].id);
			} finally {
				workspace.dispose();
			}
		}
	});

	test('keeps the core disable callback available for ordinary, function, and TXT process blocks', () => {
		policy.installRequiredMainBlockDisableGuard();
		const item = Blockly.ContextMenuRegistry.registry.getItem('blockDisable');
		const workspace = new Blockly.Workspace();
		try {
			for (const type of ['text_print', 'arduino_function', 'procedures_defnoreturn', 'txt_process']) {
				const block = workspace.newBlock(type);
				item.callback({ block });
				assert.strictEqual(block.hasDisabledReason('MANUALLY_DISABLED'), true, type);
				block.setDisabledReason(true, `UNKNOWN_${type}`);
				assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), false, type);
				assert.deepStrictEqual(
					new Set(block.getDisabledReasons()),
					new Set(['MANUALLY_DISABLED', `UNKNOWN_${type}`]),
					type
				);
				item.callback({ block });
				assert.strictEqual(block.hasDisabledReason('MANUALLY_DISABLED'), false, type);
				assert.strictEqual(block.hasDisabledReason(`UNKNOWN_${type}`), true, type);
			}
		} finally {
			workspace.dispose();
		}
	});

	test('suppresses repair events, preserves a disabled event system, and restores events after errors', () => {
		const { workspace } = loadFixture('cyberbrick');
		try {
			let changeEvents = 0;
			workspace.addChangeListener(() => changeEvents++);
			const undoCount = (workspace.undoStack_ || []).length;
			assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), true);
			assert.strictEqual(changeEvents, 0);
			assert.strictEqual((workspace.undoStack_ || []).length, undoCount);

			const block = workspace.getBlocksByType('micropython_main', false)[0];
			block.setDisabledReason(true, 'SECOND_PASS');
			Blockly.Events.disable();
			assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), true);
			assert.strictEqual(Blockly.Events.isEnabled(), false);
			Blockly.Events.enable();

			const failingWorkspace = {
				getAllBlocks: () => [{
					type: 'micropython_main',
					getDisabledReasons: () => new Set(['FAIL']),
					setDisabledReason: () => { throw new Error('injected repair failure'); },
				}],
			};
			assert.throws(
				() => policy.repairRequiredMainBlockDisabledReasons(failingWorkspace),
				/injected repair failure/
			);
			assert.strictEqual(Blockly.Events.isEnabled(), true);
		} finally {
			workspace.dispose();
		}
	});

	test('editor integrates create, delete, disabled, load, board, and language entry points', () => {
		const source = fs.readFileSync(EDITOR_PATH, 'utf8');
		assert.match(source, /const protectMainBlockState = workspace =>/);
		assert.match(source, /event\.type === Blockly\.Events\.BLOCK_CHANGE && event\.element === 'disabled'/);
		assert.match(source, /BLOCK_CREATE[\s\S]*BLOCK_DELETE[\s\S]*protectMainBlockState\(workspace\)/);
		assert.match(source, /rebuildEditorWorkspaceForLanguage[\s\S]*protectMainBlockState\(workspace\)/);
		assert.match(source, /boardSelect\.addEventListener\('change'[\s\S]*protectMainBlockState\(workspace\)/);
		assert.match(source, /loadWorkspaceState\(workspaceState, workspace\)[\s\S]*protectMainBlockState\(workspace\)/);
	});

	test('retains the seven-board maxInstances and board-main mapping contract', () => {
		const source = fs.readFileSync(EDITOR_PATH, 'utf8');
		for (const type of REQUIRED_TYPES) {assert.match(source, new RegExp(`${type}: 1`));}
		assert.match(source, /boardId === 'txt'[\s\S]*return 'txt_setup'/);
		assert.match(source, /boardId === 'cyberbrick'[\s\S]*return 'micropython_main'/);
		for (const board of ['uno', 'nano', 'mega', 'esp32', 'supermini', 'cyberbrick', 'txt']) {
			assert.ok(board.length > 0);
		}
	});

	test('repairs the required main entry for every supported board', () => {
		policy.installRequiredMainBlockDisableGuard();
		const menuItem = Blockly.ContextMenuRegistry.registry.getItem('blockDisable');
		const cases = [
			{ board: 'uno', fixture: 'arduino', type: 'arduino_setup_loop' },
			{ board: 'nano', fixture: 'arduino', type: 'arduino_setup_loop' },
			{ board: 'mega', fixture: 'arduino', type: 'arduino_setup_loop' },
			{ board: 'esp32', fixture: 'arduino', type: 'arduino_setup_loop' },
			{ board: 'supermini', fixture: 'arduino', type: 'arduino_setup_loop' },
			{ board: 'cyberbrick', fixture: 'cyberbrick', type: 'micropython_main' },
			{ board: 'txt', fixture: 'txt', type: 'txt_setup' },
		];
		for (const testCase of cases) {
			const { workspace } = loadFixture(testCase.fixture);
			try {
				(global as any).window.currentBoard = testCase.board;
				const mainBlock = workspace.getBlocksByType(testCase.type, false)[0];
				assert.ok(mainBlock, testCase.board);
				assert.strictEqual(menuItem.preconditionFn({ block: mainBlock }, {}), 'hidden', testCase.board);
				assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), true, testCase.board);
				assert.deepStrictEqual([...mainBlock.getDisabledReasons()], [], testCase.board);
			} finally {
				workspace.dispose();
			}
		}
	});

	test('retains single/duplicate deletability, warning, and TXT validation after enable repair', () => {
		const source = fs.readFileSync(EDITOR_PATH, 'utf8');
		const policyStart = source.indexOf('const protectMainBlockState = workspace =>');
		const repairAt = source.indexOf('repairRequiredMainBlockDisabledReasons(workspace)', policyStart);
		const countAt = source.indexOf('workspace.getBlocksByType(blockType, false)', policyStart);
		assert.ok(policyStart >= 0 && repairAt > policyStart && countAt > repairAt);
		assert.match(source, /const shouldBeDeletable = blocks\.length > 1;[\s\S]*block\.setDeletable\(shouldBeDeletable\)/);
		assert.match(source, /const shouldWarn =[\s\S]*blocks\.length > 1[\s\S]*MAIN_BLOCK_DUPLICATE_WARNING/);
		assert.match(source, /mainBlockCountState\.count = blocks\.length;[\s\S]*updateTxtWorkspaceValidation\(workspace\)/);
	});

	test('repaired workspaces retain Arduino, CyberBrick, and TXT generator entry points', () => {
		const cases = [
			{
				fixture: 'arduino', board: 'uno', generator: (global as any).window.arduinoGenerator,
				assertCode: (code: string) => {
					assert.match(code, /void setup\(\)/);
					assert.match(code, /void loop\(\)/);
					assert.match(code, /Arduino main/);
				},
			},
			{
				fixture: 'cyberbrick', board: 'cyberbrick', generator: (global as any).window.micropythonGenerator,
				assertCode: (code: string) => {
					assert.match(code, /def main\(\):/);
					assert.match(code, /CyberBrick main/);
				},
			},
			{
				fixture: 'txt', board: 'txt', generator: (global as any).window.txtGenerator,
				assertCode: (code: string) => {
					assert.match(code, /txt = ftrobopy\.ftrobopy\('auto'\)/);
					assert.match(code, /def _txt_process_txt_process_enabled\(\):/);
					assert.match(code, /threading\.Thread\(target=_txt_process_txt_process_enabled/);
					assert.doesNotMatch(code, /_txt_process_txt_process_disabled/);
				},
			},
		];

		for (const testCase of cases) {
			const { workspace } = loadFixture(testCase.fixture);
			try {
				(global as any).window.currentBoard = testCase.board;
				(global as any).window.currentProgrammingLanguage =
					(global as any).window.BOARD_CONFIGS[testCase.board]?.language || 'arduino';
				assert.strictEqual(policy.repairRequiredMainBlockDisabledReasons(workspace), true);
				testCase.assertCode(testCase.generator.workspaceToCode(workspace));
			} finally {
				workspace.dispose();
			}
		}
	});
});
