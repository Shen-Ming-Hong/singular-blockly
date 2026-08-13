/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const TOOLBOX_ROOT = path.join(ROOT, 'media', 'toolbox');
const OUTPUT_ROOT = path.join(
	ROOT,
	'resources',
	'project-skills',
	'singular-blockly',
	'canonical',
	'references'
);
const CONTRACT_PATH = path.join(OUTPUT_ROOT, 'block-contract.json');
const CONTRACT_SHARD_ROOT = path.join(OUTPUT_ROOT, 'block-contract');
const SCHEMA_PATH = path.join(OUTPUT_ROOT, 'workspace.schema.json');
const CONTRACT_SCHEMA_VERSION = 3;
const SHARED_SHARD_ID = 'shared';
const SHARD_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

const TOOLBOX_BOARDS = {
	'index.json': ['uno', 'nano', 'mega', 'esp32', 'supermini'],
	'cyberbrick.json': ['cyberbrick'],
	'txt.json': ['txt'],
};

const DYNAMIC_TYPES = {
	VARIABLE: ['variables_get', 'variables_set'],
	FUNCTION: ['arduino_function', 'arduino_function_call'],
};

const ESP32_BOARD_IDS = new Set(['esp32', 'supermini']);

const BLOCK_DEFINITION_FILES = [
	'board_configs.js',
	'arduino.js',
	'functions.js',
	'sensors.js',
	'motors.js',
	'loops.js',
	'pixetto.js',
	'huskylens.js',
	'esp32-wifi-mqtt.js',
	'cyberbrick.js',
	'txt.js',
	'x11.js',
	'x12.js',
	'rc.js',
];

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stableUnique(values) {
	return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));
}

function collectBlockTypes(value, result) {
	if (!value || typeof value !== 'object') return;
	if ((value.kind === 'block' || value.kind === 'shadow') && typeof value.type === 'string') {
		result.add(value.type);
	}
	for (const child of Object.values(value)) {
		if (Array.isArray(child)) child.forEach(item => collectBlockTypes(item, result));
		else if (child && typeof child === 'object') collectBlockTypes(child, result);
	}
}

function resolveToolbox(toolboxFile, boards, membership) {
	const toolboxPath = path.join(TOOLBOX_ROOT, toolboxFile);
	const toolbox = readJson(toolboxPath);
	for (const item of toolbox.contents || []) {
		if (item.$include) {
			const includePath = path.resolve(path.dirname(toolboxPath), item.$include);
			if (!includePath.startsWith(`${TOOLBOX_ROOT}${path.sep}`)) {
				throw new Error(`Toolbox include escapes the toolbox root: ${item.$include}`);
			}
			const category = path.basename(includePath, '.json');
			const types = new Set();
			collectBlockTypes(readJson(includePath), types);
			for (const type of types) addMembership(membership, type, category, boards);
			continue;
		}
		if (item.custom && DYNAMIC_TYPES[item.custom]) {
			const category = item.custom === 'VARIABLE' ? 'variables' : 'functions';
			for (const type of DYNAMIC_TYPES[item.custom]) addMembership(membership, type, category, boards);
		}
	}
}

function addMembership(membership, type, category, boards) {
	const value = membership.get(type) || { categories: new Set(), boards: new Set() };
	value.categories.add(category);
	const supportedBoards = category === 'communication' || type === 'esp32_pwm_setup'
		? boards.filter(board => ESP32_BOARD_IDS.has(board))
		: boards;
	supportedBoards.forEach(board => value.boards.add(board));
	membership.set(type, value);
}

function loadRuntime() {
	const Blockly = require('blockly');
	Blockly.setLocale(require('blockly/msg/en'));
	require('blockly/blocks');

	const experimental = new Set();
	let currentWorkspace;
	global.Blockly = Blockly;
	global.log = { debug() {}, info() {}, warn() {}, error() {} };
	global.window = {
		Blockly,
		currentBoard: 'uno',
		currentProgrammingLanguage: 'arduino',
		potentialExperimentalBlocks: [],
		experimentalBlocks: [],
		getCurrentBoard() {
			return this.currentBoard;
		},
		getBlocklyWorkspace() {
			return currentWorkspace;
		},
		blocklyRuntime: {
			createImeSafeFieldTextInput(initialValue, validator) {
				return new Blockly.FieldTextInput(initialValue, validator);
			},
		},
		languageManager: { getMessage: key => key },
		addEventListener() {},
		removeEventListener() {},
		registerExperimentalBlock(type) {
			experimental.add(type);
		},
		registerPreviewBlock() {},
		isInAllowedContext: () => true,
		setupFunctionStackProtection() {},
		cyberbrickNameValidation: {
			isHydrating: () => true,
			validateName: ({ name }) => ({ severity: 'valid', normalizedName: name }),
		},
		txtMOutputValidation: {
			isHydrating: () => true,
			validate: value => value,
		},
		getTxtVirtualButtonOptions: () => [['Button', '1']],
		getTxtVirtualButtonColorOptions: () => [['Red', '#ff0000']],
		getTxtVirtualButtonLabel: value => String(value),
	};

	const originalLog = console.log;
	console.log = () => {};
	try {
		for (const file of BLOCK_DEFINITION_FILES) {
			const filePath = path.join(ROOT, 'media', 'blockly', 'blocks', file);
			vm.runInThisContext(fs.readFileSync(filePath, 'utf8'), { filename: filePath });
		}
	} finally {
		console.log = originalLog;
	}

	return {
		Blockly,
		experimental,
		setWorkspace(workspace) {
			currentWorkspace = workspace;
		},
	};
}

function connectionMetadata(connection) {
	return {
		enabled: Boolean(connection),
		check: connection ? connection.getCheck() || null : null,
	};
}

function jsonSafeValue(value) {
	if (value === undefined || typeof value === 'function') return undefined;
	try {
		return JSON.parse(JSON.stringify(value));
	} catch {
		return String(value);
	}
}

function getFieldKind(Blockly, field) {
	const kinds = [
		['variable', Blockly.FieldVariable],
		['dropdown', Blockly.FieldDropdown],
		['checkbox', Blockly.FieldCheckbox],
		['colour', Blockly.FieldColour],
		['angle', Blockly.FieldAngle],
		['number', Blockly.FieldNumber],
		['text-input', Blockly.FieldTextInput],
		['serializable-label', Blockly.FieldLabelSerializable],
		['label', Blockly.FieldLabel],
	];
	for (const [kind, constructor] of kinds) {
		if (constructor && field instanceof constructor) return kind;
	}
	return 'custom';
}

function fieldMetadata(Blockly, field) {
	if (!field.name) return undefined;
	const metadata = {
		name: field.name,
		kind: getFieldKind(Blockly, field),
	};
	let value;
	if (Blockly.FieldVariable && field instanceof Blockly.FieldVariable) {
		const variable = field.getVariable();
		value = variable ? { name: variable.name, type: variable.type || '' } : undefined;
	} else {
		value = jsonSafeValue(typeof field.saveState === 'function' ? field.saveState() : field.getValue());
	}
	if (value !== undefined) metadata.defaultValue = value;
	if (!(Blockly.FieldVariable && field instanceof Blockly.FieldVariable) && typeof field.getOptions === 'function') {
		metadata.optionsMode = typeof field.menuGenerator_ === 'function' ? 'dynamic' : 'static';
		try {
			metadata.options = stableUnique(field.getOptions(false).map(option => String(option[1])));
		} catch {
			// Dynamic dropdowns may not expose options until attached to a rendered workspace.
		}
	}
	return metadata;
}

function stripUnstableIds(value) {
	if (Array.isArray(value)) return value.map(stripUnstableIds);
	if (!value || typeof value !== 'object') return value;
	const result = {};
	for (const [key, child] of Object.entries(value)) {
		if (key === 'id' || key === 'x' || key === 'y') continue;
		result[key] = stripUnstableIds(child);
	}
	return result;
}

function createBlockVariant(runtime, type, board) {
	const { Blockly } = runtime;
	window.currentBoard = board;
	window.currentProgrammingLanguage = window.BOARD_CONFIGS[board]?.language || 'arduino';

	const workspace = new Blockly.Workspace();
	runtime.setWorkspace(workspace);
	let block;
	try {
		block = workspace.newBlock(type);
		const savedState = Blockly.serialization.blocks.save(block, { addCoordinates: false });
		if (!savedState) throw new Error(`Blockly returned no serialized state for ${type}`);
		const minimalState = stripUnstableIds(savedState);

		const roundTripWorkspace = new Blockly.Workspace();
		runtime.setWorkspace(roundTripWorkspace);
		try {
			Blockly.serialization.workspaces.load(
				{ blocks: { languageVersion: 0, blocks: [minimalState] } },
				roundTripWorkspace
			);
			const normalized = Blockly.serialization.workspaces.save(roundTripWorkspace);
			if (!normalized?.blocks?.blocks?.length) throw new Error(`Minimal state did not round-trip for ${type}`);
		} finally {
			roundTripWorkspace.dispose();
			runtime.setWorkspace(workspace);
		}

		const fields = block.inputList
			.flatMap(input => input.fieldRow.map(field => fieldMetadata(Blockly, field)))
			.filter(Boolean)
			.sort((left, right) => left.name.localeCompare(right.name, 'en'));
		const inputs = block.inputList
			.map(input => ({
				name: input.name || '',
				kind: Blockly.inputs.inputTypes[input.type] || String(input.type),
				connection: connectionMetadata(input.connection),
			}))
			.sort((left, right) => left.name.localeCompare(right.name, 'en'));
		const variant = {
			connections: {
				previous: connectionMetadata(block.previousConnection),
				next: connectionMetadata(block.nextConnection),
				output: connectionMetadata(block.outputConnection),
			},
			inputs,
			fields,
			minimalState,
		};
		if (Object.prototype.hasOwnProperty.call(minimalState, 'extraState')) {
			variant.extraState = minimalState.extraState;
		}
		return variant;
	} finally {
		if (block && !block.disposed) block.dispose(false);
		workspace.dispose();
	}
}

function createBlockMetadata(runtime, type, member) {
	const boards = stableUnique([...member.boards]);
	return {
		type,
		categories: stableUnique([...member.categories]),
		boards,
		variants: Object.fromEntries(boards.map(board => [board, createBlockVariant(runtime, type, board)])),
	};
}

function getBlocklyVersion() {
	const entry = require.resolve('blockly');
	let directory = path.dirname(entry);
	while (directory !== path.dirname(directory)) {
		const candidate = path.join(directory, 'package.json');
		if (fs.existsSync(candidate)) return readJson(candidate).version;
		directory = path.dirname(directory);
	}
	throw new Error('Cannot locate the installed Blockly package metadata');
}

function buildContract() {
	const membership = new Map();
	for (const [toolbox, boards] of Object.entries(TOOLBOX_BOARDS)) resolveToolbox(toolbox, boards, membership);
	const runtime = loadRuntime();
	const unknownTypes = [...membership.keys()].filter(type => !runtime.Blockly.Blocks[type]);
	if (unknownTypes.length) throw new Error(`Public toolbox types are not registered: ${unknownTypes.join(', ')}`);

	const boards = Object.entries(TOOLBOX_BOARDS)
		.flatMap(([toolbox, boardIds]) =>
			boardIds.map(id => ({
				id,
				language: window.BOARD_CONFIGS[id]?.language || 'arduino',
				toolbox: path.basename(toolbox, '.json'),
			}))
		)
		.sort((left, right) => left.id.localeCompare(right.id, 'en'));
	const blocks = stableUnique([...membership.keys()]).map(type => createBlockMetadata(runtime, type, membership.get(type)));
	return { schemaVersion: CONTRACT_SCHEMA_VERSION, blocklyVersion: getBlocklyVersion(), boards, blocks };
}

function splitContract(contract) {
	const grouped = new Map();
	for (const block of contract.blocks) {
		const shardId = block.categories.length === 1 ? block.categories[0] : SHARED_SHARD_ID;
		if (block.categories.length === 1 && shardId === SHARED_SHARD_ID) {
			throw new Error(`Reserved block contract shard id: ${SHARED_SHARD_ID}`);
		}
		if (!SHARD_ID_PATTERN.test(shardId)) {
			throw new Error(`Unsafe block contract shard id: ${shardId}`);
		}
		const blocks = grouped.get(shardId) || [];
		blocks.push(block);
		grouped.set(shardId, blocks);
	}

	const shards = [...grouped.entries()]
		.sort(([left], [right]) => left.localeCompare(right, 'en'))
		.map(([category, blocks]) => ({
			category,
			path: `block-contract/${category}.json`,
			blockTypes: blocks.map(block => block.type),
			contents: {
				schemaVersion: CONTRACT_SCHEMA_VERSION,
				category,
				blocks,
			},
		}));

	return {
		index: {
			schemaVersion: CONTRACT_SCHEMA_VERSION,
			blocklyVersion: contract.blocklyVersion,
			boards: contract.boards,
			shards: shards.map(({ category, path: shardPath, blockTypes }) => ({
				category,
				path: shardPath,
				blockTypes,
			})),
		},
		shards,
	};
}

function buildWorkspaceSchema(boardIds) {
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$id: 'singular-blockly://workspace.schema.json',
		title: 'Singular Blockly workspace document',
		description: 'Document-level shape for blockly/main.json. Blockly runtime validation is still required.',
		type: 'object',
		required: ['board', 'workspace'],
		properties: {
			board: { type: 'string', enum: boardIds },
			workspace: {
				type: 'object',
				description: 'Blockly serialization state consumed by Blockly.serialization.workspaces.load.',
			},
			txtVirtualControls: {
				description: 'Optional TXT Controller virtual control configuration.',
			},
		},
		additionalProperties: true,
	};
}

function formatJson(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

function atomicWrite(filePath, contents) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	const temporary = `${filePath}.tmp-${process.pid}`;
	try {
		fs.writeFileSync(temporary, contents);
		fs.renameSync(temporary, filePath);
	} finally {
		if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
	}
}

function buildOutputs(contract) {
	const split = splitContract(contract);
	return [
		[CONTRACT_PATH, formatJson(split.index)],
		[SCHEMA_PATH, formatJson(buildWorkspaceSchema(contract.boards.map(board => board.id)))],
		...split.shards.map(shard => [path.join(OUTPUT_ROOT, shard.path), formatJson(shard.contents)]),
	];
}

function findObsoleteShardPaths(outputs) {
	if (!fs.existsSync(CONTRACT_SHARD_ROOT)) return [];
	const expected = new Set(outputs.map(([filePath]) => path.resolve(filePath)));
	return fs.readdirSync(CONTRACT_SHARD_ROOT)
		.filter(file => file.endsWith('.json'))
		.map(file => path.join(CONTRACT_SHARD_ROOT, file))
		.filter(filePath => !expected.has(path.resolve(filePath)))
		.sort((left, right) => left.localeCompare(right, 'en'));
}

function main() {
	const checkOnly = process.argv.includes('--check');
	const contract = buildContract();
	const outputs = buildOutputs(contract);
	const obsolete = findObsoleteShardPaths(outputs);
	if (checkOnly) {
		const stale = outputs.filter(([filePath, contents]) => !fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== contents);
		if (stale.length || obsolete.length) {
			for (const [filePath] of stale) console.error(`Generated Skill contract is stale: ${path.relative(ROOT, filePath)}`);
			for (const filePath of obsolete) console.error(`Generated Skill contract shard is obsolete: ${path.relative(ROOT, filePath)}`);
			process.exitCode = 1;
			return;
		}
		console.log(`Skill contract is current (${contract.blocks.length} public block types in ${outputs.length - 2} shards).`);
		return;
	}
	for (const [filePath, contents] of outputs) atomicWrite(filePath, contents);
	for (const filePath of obsolete) fs.unlinkSync(filePath);
	console.log(`Generated Skill contract for ${contract.blocks.length} public block types in ${outputs.length - 2} shards.`);
}

if (require.main === module) main();

module.exports = {
	buildContract,
	buildOutputs,
	buildWorkspaceSchema,
	loadRuntime,
	splitContract,
};
