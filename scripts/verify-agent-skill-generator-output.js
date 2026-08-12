/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadRuntime } = require('./generate-skill-contract.js');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_ROOT = path.join(ROOT, 'src', 'test', 'fixtures', 'agent-skills');

function loadGeneratorModules(directory) {
	const files = fs
		.readdirSync(directory)
		.filter(file => file.endsWith('.js'))
		.sort((left, right) => {
			if (left === 'index.js') return -1;
			if (right === 'index.js') return 1;
			return left.localeCompare(right, 'en');
		});
	for (const file of files) {
		const filePath = path.join(directory, file);
		vm.runInThisContext(fs.readFileSync(filePath, 'utf8'), { filename: filePath });
	}
}

function normalizeGeneratedAt(code) {
	return code.replace(/^# Generated:.*\n/m, '');
}

const runtime = loadRuntime();
const originalLog = console.log;
console.log = () => {};
try {
	for (const language of ['arduino', 'micropython', 'txt']) {
		loadGeneratorModules(path.join(ROOT, 'media', 'blockly', 'generators', language));
	}
} finally {
	console.log = originalLog;
}

const cases = [
	{ fixture: 'arduino.json', generator: window.arduinoGenerator, golden: 'arduino.cpp' },
	{ fixture: 'cyberbrick.json', generator: window.micropythonGenerator, golden: 'cyberbrick.py' },
	{ fixture: 'txt.json', generator: window.txtGenerator, golden: 'txt.py' },
];
for (const testCase of cases) {
	const document = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'workspaces', testCase.fixture), 'utf8'));
	window.currentBoard = document.board;
	window.currentProgrammingLanguage = window.BOARD_CONFIGS[document.board]?.language || 'arduino';
	const workspace = new runtime.Blockly.Workspace();
	try {
		runtime.setWorkspace(workspace);
		runtime.Blockly.serialization.workspaces.load(document.workspace, workspace);
		const actual = normalizeGeneratedAt(testCase.generator.workspaceToCode(workspace));
		const expected = fs.readFileSync(path.join(FIXTURE_ROOT, 'expected', testCase.golden), 'utf8');
		assert.strictEqual(actual, expected, testCase.fixture);
	} finally {
		workspace.dispose();
	}
}

process.stdout.write('Agent Skill generator output is current.\n');
