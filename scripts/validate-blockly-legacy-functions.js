/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Blockly = require('blockly');
require('blockly/blocks');
Blockly.setLocale(require('blockly/msg/en'));

const PROJECT_ROOT = path.resolve(__dirname, '..');

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

const log = {
	info() {},
	warn() {},
	error() {},
};
const windowStub = {
	BLOCKLY_RUNTIME_CONFIG: { mode: 'edit', mediaUri: '', localeUris: {} },
	languageManager: { getMessage(key, fallback) { return fallback || key; } },
	getCurrentBoard() { return 'arduino_uno'; },
	addEventListener() {},
	removeEventListener() {},
	log,
};
const context = vm.createContext({
	Blockly,
	window: windowStub,
	document: { createElement: Blockly.utils.xml.createElement, activeElement: null },
	log,
	console,
	setTimeout,
	clearTimeout,
	Object,
	String,
	Number,
	Map,
	Set,
	Promise,
	TypeError,
});

vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT, 'media/blockly/blocks/functions.js'), 'utf8'), context, {
	filename: 'functions.js',
});
vm.runInContext(fs.readFileSync(path.join(PROJECT_ROOT, 'media/js/blocklyRuntime.js'), 'utf8'), context, {
	filename: 'blocklyRuntime.js',
});

const legacyState = {
	blocks: {
		languageVersion: 0,
		blocks: [
			{
				type: 'arduino_function_call',
				id: 'legacy-call-forward',
				extraState:
					'<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="前進" has_return="false" return_type="void"><arg name="速度" type="int"></arg></mutation>',
				inputs: {
					ARG0: {
						shadow: {
							type: 'math_number',
							id: 'legacy-speed-shadow',
							fields: { NUM: 100 },
						},
					},
				},
				next: {
					block: {
						type: 'arduino_function_call',
						id: 'legacy-call-stop',
						extraState:
							'<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="停止" has_return="false" return_type="void"></mutation>',
					},
				},
			},
			{
				type: 'arduino_function',
				id: 'legacy-definition-forward',
				fields: { NAME: '前進' },
				extraState:
					'<mutation xmlns="http://www.w3.org/1999/xhtml"><arg name="速度" type="int"></arg></mutation>',
			},
			{
				type: 'arduino_function',
				id: 'legacy-definition-stop',
				fields: { NAME: '停止' },
				extraState: '<mutation xmlns="http://www.w3.org/1999/xhtml"></mutation>',
			},
		],
	},
};

function validateLoadedWorkspace(workspace) {
	const forwardCall = workspace.getBlockById('legacy-call-forward');
	const stopCall = workspace.getBlockById('legacy-call-stop');
	const forwardDefinition = workspace.getBlockById('legacy-definition-forward');
	assert(forwardCall?.getFieldValue('NAME') === '前進', 'legacy call name was not restored');
	assert(stopCall?.getFieldValue('NAME') === '停止', 'nested legacy call name was not restored');
	assert(forwardCall.arguments_[0] === '速度', 'legacy call argument was not restored');
	assert(forwardDefinition.arguments_[0] === '速度', 'legacy definition argument was not restored');
	assert(forwardCall.checkFunctionExists(), 'legacy call is not linked to its function definition');
	assert(stopCall.checkFunctionExists(), 'nested legacy call is not linked to its function definition');
	const speedShadow = forwardCall.getInputTargetBlock('ARG0');
	assert(speedShadow?.isShadow(), 'legacy ARG0 shadow connection was not restored');
	assert(speedShadow.getFieldValue('NUM') === 100, 'legacy ARG0 shadow value changed');
}

const workspace = new Blockly.Workspace();
windowStub.blocklyRuntime.loadWorkspaceState(legacyState, workspace);
validateLoadedWorkspace(workspace);
const savedState = Blockly.serialization.workspaces.save(workspace);
workspace.dispose();

const savedBlocks = savedState.blocks.blocks;
assert(savedBlocks.every(block => typeof block.extraState !== 'string'), 'saved top-level function state must use JSON');

const reopenedWorkspace = new Blockly.Workspace();
windowStub.blocklyRuntime.loadWorkspaceState(savedState, reopenedWorkspace);
validateLoadedWorkspace(reopenedWorkspace);
reopenedWorkspace.dispose();

process.stdout.write(
	`${JSON.stringify({
		blocklyVersion: Blockly.VERSION,
		callNames: ['前進', '停止'],
		argument: '速度',
		shadowValue: 100,
		roundTrips: 2,
	})}\n`
);
