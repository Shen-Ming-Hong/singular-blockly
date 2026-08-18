/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { BlockContractService } from '../../services/blockContractService';

const ROOT = path.join(__dirname, '..', '..', '..');
const FIXTURES = path.join(ROOT, 'src', 'test', 'fixtures', 'agent-skills');
const CONTRACT = new BlockContractService(ROOT).load().contract;

suite('Workspace Candidate Runtime Contract', () => {
	let runtime: any;

	suiteSetup(() => {
		const { loadRuntime } = require(path.join(ROOT, 'scripts', 'generate-skill-contract.js'));
		runtime = loadRuntime();
		vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'media', 'js', 'blocklyRuntime.js'), 'utf8'), {
			filename: path.join(ROOT, 'media', 'js', 'blocklyRuntime.js'),
		});
	});

	test('Arduino, CyberBrick, and TXT fixtures survive real Blockly load/save/load', () => {
		for (const name of ['arduino', 'cyberbrick', 'txt']) {
			const document = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'workspaces', `${name}.json`), 'utf8'));
			(global as any).window.currentBoard = document.board;
			(global as any).window.currentProgrammingLanguage =
				(global as any).window.BOARD_CONFIGS[document.board]?.language || 'arduino';
			const first = new runtime.Blockly.Workspace();
			const second = new runtime.Blockly.Workspace();
			try {
				runtime.setWorkspace(first);
				runtime.Blockly.serialization.workspaces.load(document.workspace, first);
				const normalized = runtime.Blockly.serialization.workspaces.save(first);
				runtime.setWorkspace(second);
				runtime.Blockly.serialization.workspaces.load(normalized, second);
				const reopened = runtime.Blockly.serialization.workspaces.save(second);
				assert.ok(reopened?.blocks?.blocks?.length, `${name} fixture must remain non-empty`);
				assert.strictEqual(reopened.blocks.blocks[0].type, document.workspace.blocks.blocks[0].type);
			} finally {
				first.dispose();
				second.dispose();
			}
		}
	});

	test('negative fixtures are covered by stable document, field, connection, state, board, and orphan guards', () => {
		const source = fs.readFileSync(path.join(ROOT, 'media', 'js', 'blocklyEdit.js'), 'utf8');
		for (const code of [
			'EMPTY_WORKSPACE',
			'UNKNOWN_BLOCK_TYPE',
			'INVALID_FIELD',
			'INVALID_CONNECTION',
			'INVALID_EXTRA_STATE',
			'BOARD_MISMATCH',
			'ORPHAN_BLOCK',
			'ROUND_TRIP_FAILED',
		]) {
			assert.match(source, new RegExp(`code: '${code}'`), `${code} must be emitted by the WebView validator`);
		}
		assert.match(source, /blockContract\.boards\.includes\(documentState\.board\)/);
		assert.match(source, /blockContract\.variants\?\.\[documentState\.board\]/);
		assert.match(source, /loadWithConnectionClassification/);
		assert.match(source, /missing a\\\(n\\\) \(\?:next\|previous\|output\)/);
		assert.doesNotMatch(source, /const inputs = new Map\(blockContract\.inputs/);
		assert.match(source, /validateField/);
		assert.match(source, /field\.optionsMode !== 'dynamic'/);
		assert.match(source, /validateDynamicDropdowns/);
		assert.match(source, /serializedConnectionsPreserved/);
		assert.match(source, /requiredExtraState/);
		assert.strictEqual((source.match(/new Blockly\.Workspace\(\)/g) || []).length >= 2, true);
		assert.match(source, /firstWorkspace\?\.dispose\(\)/);
		assert.match(source, /secondWorkspace\?\.dispose\(\)/);
	});

	test('connection preservation detects a child silently missing from normalized state', () => {
		const policy = (global as any).window.blocklyRuntime;
		const candidate = {
			blocks: {
				languageVersion: 0,
				blocks: [{
					type: 'arduino_setup_loop', id: 'root',
					inputs: { LOOP: { block: { type: 'text_print', id: 'child' } } },
				}],
			},
		};
		const normalized = {
			blocks: { languageVersion: 0, blocks: [{ type: 'arduino_setup_loop', id: 'root' }] },
		};
		assert.strictEqual(policy.serializedConnectionsPreserved(candidate, normalized), false);
		assert.strictEqual(policy.serializedConnectionsPreserved(candidate, JSON.parse(JSON.stringify(candidate))), true);
		const replacedBySameType = JSON.parse(JSON.stringify(candidate));
		replacedBySameType.blocks.blocks[0].inputs.LOOP.block.id = 'different-child';
		assert.strictEqual(
			policy.serializedConnectionsPreserved(candidate, replacedBySameType),
			false,
			'a same-type replacement must not count as preserving the original connection'
		);
	});

	test('formal live loads recheck their deadline after asynchronous board preparation', () => {
		const source = fs.readFileSync(path.join(ROOT, 'media', 'js', 'blocklyEdit.js'), 'utf8');
		const deadlineChecks = source.match(/isWorkspaceLoadExpired\(message\)/g) || [];
		assert.ok(deadlineChecks.length >= 2, 'the deadline must be checked before and after board preparation');
		assert.match(
			source,
			/await updateToolboxForBoard\(workspace, message\.board\);[\s\S]*isWorkspaceLoadExpired\(message\)[\s\S]*loadWorkspaceState\(workspaceState, workspace\)/
		);
	});

	test('initial-load acknowledgements strictly validate the optional repair flag', () => {
		const validation = require('../../types/workspaceValidation');
		assert.strictEqual(typeof validation.isWorkspaceInitialLoadResultMessage, 'function');
		const document = {
			board: 'cyberbrick',
			workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'micropython_main' }] } },
		};
		const base = {
			command: 'workspaceInitialLoadResult',
			requestId: 'initial-1',
			success: true,
			normalizedDocument: document,
		};
		assert.strictEqual(validation.isWorkspaceInitialLoadResultMessage(base), true);
		assert.strictEqual(validation.isWorkspaceInitialLoadResultMessage({ ...base, mainBlockStateRepaired: true }), true);
		assert.strictEqual(validation.isWorkspaceInitialLoadResultMessage({ ...base, mainBlockStateRepaired: false }), true);
		for (const invalid of ['true', 1, null, {}]) {
			assert.strictEqual(
				validation.isWorkspaceInitialLoadResultMessage({ ...base, mainBlockStateRepaired: invalid }),
				false
			);
		}
		assert.strictEqual(validation.isWorkspaceInitialLoadResultMessage({
			command: 'workspaceInitialLoadResult', requestId: 'failed', success: false,
			issue: { code: 'ROUND_TRIP_FAILED' }, mainBlockStateRepaired: true,
		}), false);
		assert.strictEqual(validation.isWorkspaceInitialLoadResultMessage({ ...base, normalizedDocument: undefined }), false);
	});

	test('TXT virtual-control-only candidates remain valid and normalize their companion document', () => {
		const source = fs.readFileSync(path.join(ROOT, 'media', 'js', 'blocklyEdit.js'), 'utf8');
		assert.match(source, /cloneTxtVirtualControlsDocument\(documentState\.txtVirtualControls, \{ forceEditingMode: true \}\)/);
		assert.match(source, /if \(!hasCandidateBlocks && !hasTxtVirtualControls\)/);
		assert.match(source, /normalizedDocument\.txtVirtualControls = normalizedTxtVirtualControls/);
	});

	test('legacy dynamic inputs survive a numeric external edit and real Blockly load/save/load', () => {
		const document = JSON.parse(
			fs.readFileSync(path.join(FIXTURES, 'candidates', 'legacy-dynamic-input.json'), 'utf8')
		);
		const baselineDocument = JSON.parse(JSON.stringify(document));
		baselineDocument.workspace.blocks.blocks[0].inputs.LOOP.block.inputs.IF0.block.inputs.A.block.fields.NUM = 41;
		(global as any).window.currentBoard = document.board;
		(global as any).window.currentProgrammingLanguage = 'arduino';
		const baseline = new runtime.Blockly.Workspace();
		const first = new runtime.Blockly.Workspace();
		const second = new runtime.Blockly.Workspace();
		const withNewOrphan = new runtime.Blockly.Workspace();
		try {
			runtime.setWorkspace(baseline);
			runtime.Blockly.serialization.workspaces.load(baselineDocument.workspace, baseline);
			runtime.setWorkspace(first);
			runtime.Blockly.serialization.workspaces.load(document.workspace, first);
			const policy = (global as any).window.blocklyRuntime;
			const allowedRoots = ['arduino_setup_loop', 'micropython_main', 'txt_setup', 'arduino_function'];
			assert.strictEqual(
				policy.findNewOrphanStatementBlock(first, baseline, allowedRoots),
				null,
				'an unchanged legacy orphan must not reject an unrelated numeric edit'
			);
			const normalized = runtime.Blockly.serialization.workspaces.save(first);
			runtime.setWorkspace(second);
			runtime.Blockly.serialization.workspaces.load(normalized, second);
			const reopened = runtime.Blockly.serialization.workspaces.save(second);
			const rootState = reopened.blocks.blocks.find((block: any) => block.type === 'arduino_setup_loop');
			const ifState = rootState.inputs.LOOP.block;
			assert.strictEqual(ifState.extraState.hasElse, true);
			assert.strictEqual(ifState.inputs.ELSE.block.type, 'text_print');
			assert.strictEqual(ifState.inputs.IF0.block.inputs.A.block.fields.NUM, 42);

			const addedOrphanState = JSON.parse(JSON.stringify(normalized));
			addedOrphanState.blocks.blocks.push({ type: 'text_print', id: 'new-external-orphan' });
			runtime.setWorkspace(withNewOrphan);
			runtime.Blockly.serialization.workspaces.load(addedOrphanState, withNewOrphan);
			assert.strictEqual(
				policy.findNewOrphanStatementBlock(withNewOrphan, baseline, allowedRoots)?.id,
				'new-external-orphan',
				'a newly introduced orphan must remain rejectable'
			);
		} finally {
			baseline.dispose();
			first.dispose();
			second.dispose();
			withNewOrphan.dispose();
		}
	});

	test('every fixture type belongs to its selected board in the generated contract', () => {
		const blocks = new Map(CONTRACT.blocks.map((block: any) => [block.type, block]));
		for (const name of ['arduino', 'cyberbrick', 'txt']) {
			const document = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'workspaces', `${name}.json`), 'utf8'));
			for (const state of document.workspace.blocks.blocks) {
				const entry = blocks.get(state.type) as any;
				assert.ok(entry, state.type);
				assert.ok(entry.boards.includes(document.board), `${state.type} must support ${document.board}`);
			}
		}
	});

	test('generator output locations remain exact and board-specific', () => {
		const skill = fs.readFileSync(
			path.join(ROOT, 'resources', 'project-skills', 'singular-blockly', 'canonical', 'references', 'workspace-format.md'),
			'utf8'
		);
		assert.match(skill, /Arduino boards:[^\n]*`src\/main\.cpp`/);
		assert.match(skill, /CyberBrick:[^\n]*`src\/rc_main\.py`/);
		assert.match(skill, /TXT Controller:[^\n]*`src\/main\.py`/);
		const handler = fs.readFileSync(path.join(ROOT, 'src', 'webview', 'messageHandler.ts'), 'utf8');
		assert.match(handler, /src\/main\.cpp/);
		assert.match(handler, /src\/rc_main\.py/);
		assert.match(handler, /src\/main\.py/);
	});
});
