/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Blockly = require('blockly');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const FIXTURE_ROOT = path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'blockly-v13');
const OUTPUT_BLOCK_TYPES = new Set(['logic_boolean', 'math_number', 'text', 'variables_get']);

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function visitSerializedBlock(block, visitor) {
	if (!block || typeof block !== 'object') {
		return;
	}
	visitor(block);
	for (const input of Object.values(block.inputs || {})) {
		visitSerializedBlock(input.block, visitor);
		visitSerializedBlock(input.shadow, visitor);
	}
	visitSerializedBlock(block.next?.block, visitor);
}

function collectJsonSchema(workspaceState) {
	const schemaByType = new Map();
	const nestedTypes = new Set();
	for (const topBlock of workspaceState.blocks?.blocks || []) {
		visitSerializedBlock(topBlock, block => {
			const schema = schemaByType.get(block.type) || { fields: new Set(), inputs: new Map() };
			for (const fieldName of Object.keys(block.fields || {})) {
				schema.fields.add(fieldName);
			}
			for (const [inputName, input] of Object.entries(block.inputs || {})) {
				const child = input.block || input.shadow;
				schema.inputs.set(inputName, child && OUTPUT_BLOCK_TYPES.has(child.type) ? 'value' : 'statement');
				if (child) {
					nestedTypes.add(child.type);
				}
			}
			if (block.next?.block) {
				nestedTypes.add(block.next.block.type);
			}
			schemaByType.set(block.type, schema);
		});
	}
	return { schemaByType, nestedTypes };
}

function registerFixtureBlocks(schemaByType, nestedTypes) {
	for (const [type, schema] of schemaByType) {
		if (Blockly.Blocks[type]) {
			continue;
		}
		Blockly.Blocks[type] = {
			init() {
				for (const fieldName of schema.fields) {
					this.appendDummyInput(`FIELD_${fieldName}`).appendField(new Blockly.FieldTextInput(''), fieldName);
				}
				for (const [inputName, inputKind] of schema.inputs) {
					if (inputKind === 'value') {
						this.appendValueInput(inputName);
					} else {
						this.appendStatementInput(inputName);
					}
				}
				if (nestedTypes.has(type)) {
					this.setPreviousStatement(true);
					this.setNextStatement(true);
				}
			},
			loadExtraState(state) {
				this.fixtureExtraState_ = state;
			},
			saveExtraState() {
				return this.fixtureExtraState_;
			},
		};
	}
}

function summarizeJsonState(workspaceState) {
	const summary = {
		blocks: 0,
		shadows: 0,
		lockedBlocks: 0,
		extraStates: 0,
		orphanTypes: [],
		variables: (workspaceState.variables || []).length,
	};
	for (const topBlock of workspaceState.blocks?.blocks || []) {
		summary.orphanTypes.push(topBlock.type);
		visitSerializedBlock(topBlock, block => {
			summary.blocks++;
			if (String(block.id || '').includes('shadow')) {
				summary.shadows++;
			}
			if (block.deletable === false || block.movable === false || block.editable === false) {
				summary.lockedBlocks++;
			}
			if (block.extraState !== undefined) {
				summary.extraStates++;
			}
		});
	}
	summary.orphanTypes.sort();
	return summary;
}

function validateJsonFixture(fixture, inputPath) {
	const document = readJson(inputPath);
	assert(document.board === fixture.board, `${fixture.id}: board mismatch`);
	assert(document.workspace?.blocks?.blocks, `${fixture.id}: missing workspace blocks`);
	const { schemaByType, nestedTypes } = collectJsonSchema(document.workspace);
	registerFixtureBlocks(schemaByType, nestedTypes);

	const before = summarizeJsonState(document.workspace);
	const workspace = new Blockly.Workspace();
	Blockly.serialization.workspaces.load(document.workspace, workspace);
	const saved = Blockly.serialization.workspaces.save(workspace);
	const after = summarizeJsonState(saved);
	workspace.dispose();

	assert(after.blocks === before.blocks, `${fixture.id}: block count changed during round-trip`);
	assert(after.variables === before.variables, `${fixture.id}: variable count changed during round-trip`);
	assert(after.shadows === before.shadows, `${fixture.id}: shadow count changed during round-trip`);
	assert(after.lockedBlocks === before.lockedBlocks, `${fixture.id}: locked flags changed during round-trip`);
	assert(after.extraStates === before.extraStates, `${fixture.id}: extra state count changed during round-trip`);
	return before;
}

function validateXmlFixture(fixture, inputPath) {
	const xmlText = fs.readFileSync(inputPath, 'utf8');
	const document = Blockly.utils.xml.textToDom(xmlText);
	const blockElements = Array.from(document.querySelectorAll('block, shadow'));
	const schemaByType = new Map();
	for (const element of blockElements) {
		const type = element.getAttribute('type');
		if (!Blockly.Blocks[type]) {
			schemaByType.set(type, { fields: new Set(), inputs: new Map() });
		}
	}
	registerFixtureBlocks(schemaByType, new Set());

	const workspace = new Blockly.Workspace();
	Blockly.Xml.domToWorkspace(document, workspace);
	const savedDocument = Blockly.Xml.workspaceToDom(workspace);
	const savedText = Blockly.Xml.domToText(savedDocument);
	workspace.dispose();

	const count = selector => blockElements.filter(element => element.matches(selector)).length;
	const result = {
		blocks: count('block') + count('shadow'),
		shadows: count('shadow'),
		lockedBlocks: blockElements.filter(element => element.getAttribute('deletable') === 'false').length,
		extraStates: document.querySelectorAll('mutation').length,
		variables: document.querySelectorAll('variables > variable').length,
	};
	assert(savedText.includes('legacy-root'), `${fixture.id}: root block missing after XML round-trip`);
	assert(savedText.includes('legacy-counter'), `${fixture.id}: variable missing after XML round-trip`);
	assert(savedText.includes('legacy-number-shadow'), `${fixture.id}: shadow missing after XML round-trip`);
	return result;
}

function main() {
	const manifest = readJson(path.join(FIXTURE_ROOT, 'manifest.json'));
	if (process.argv.includes('--baseline-only')) {
		assert(manifest.baselineBlocklyVersion === Blockly.VERSION, 'Installed Blockly version does not match fixture baseline');
	}
	const reports = [];
	for (const fixture of manifest.fixtures) {
		const inputPath = path.join(FIXTURE_ROOT, fixture.input);
		const expectedCodePath = path.join(FIXTURE_ROOT, fixture.expectedCode);
		assert(fs.existsSync(inputPath), `${fixture.id}: input fixture is missing`);
		assert(fs.existsSync(expectedCodePath), `${fixture.id}: expected code is missing`);
		assert(fs.readFileSync(expectedCodePath, 'utf8').trim().length > 0, `${fixture.id}: expected code is empty`);
		const summary = fixture.format === 'xml'
			? validateXmlFixture(fixture, inputPath)
			: validateJsonFixture(fixture, inputPath);
		reports.push({ id: fixture.id, format: fixture.format, board: fixture.board, ...summary });
	}
	process.stdout.write(`${JSON.stringify({
		baselineBlocklyVersion: manifest.baselineBlocklyVersion,
		blocklyVersion: Blockly.VERSION,
		fixtures: reports,
	}, null, 2)}\n`);
}

try {
	main();
} catch (error) {
	process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
	process.exitCode = 1;
}
