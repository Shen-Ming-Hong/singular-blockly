/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { performance } = require('node:perf_hooks');
const Blockly = require('blockly');

const BLOCK_COUNT = 500;
const DEFAULT_ITERATIONS = 12;
const WARMUP_ITERATIONS = 3;

function parseIterations(argv) {
	const index = argv.indexOf('--iterations');
	if (index === -1) {
		return DEFAULT_ITERATIONS;
	}
	const value = Number(argv[index + 1]);
	if (!Number.isInteger(value) || value < 1) {
		throw new Error('--iterations must be a positive integer');
	}
	return value;
}

function createWorkspaceState() {
	const workspace = new Blockly.Workspace();
	for (let index = 0; index < BLOCK_COUNT; index++) {
		const block = workspace.newBlock('math_number');
		block.setFieldValue(String(index), 'NUM');
	}
	const state = Blockly.serialization.workspaces.save(workspace);
	workspace.dispose();
	return state;
}

function timeOperation(operation) {
	const startedAt = performance.now();
	operation();
	return performance.now() - startedAt;
}

function summarize(samples) {
	const sorted = [...samples].sort((left, right) => left - right);
	const total = sorted.reduce((sum, value) => sum + value, 0);
	return {
		minMs: Number(sorted[0].toFixed(3)),
		medianMs: Number(sorted[Math.floor(sorted.length / 2)].toFixed(3)),
		meanMs: Number((total / sorted.length).toFixed(3)),
		maxMs: Number(sorted[sorted.length - 1].toFixed(3)),
	};
}

function runIteration(state) {
	const workspace = new Blockly.Workspace();
	const loadMs = timeOperation(() => Blockly.serialization.workspaces.load(state, workspace));
	if (workspace.getAllBlocks(false).length !== BLOCK_COUNT) {
		throw new Error(`Expected ${BLOCK_COUNT} blocks after load`);
	}
	const saveMs = timeOperation(() => Blockly.serialization.workspaces.save(workspace));
	workspace.dispose();
	return { loadMs, saveMs };
}

function main() {
	const iterations = parseIterations(process.argv.slice(2));
	const state = createWorkspaceState();
	for (let index = 0; index < WARMUP_ITERATIONS; index++) {
		runIteration(state);
	}

	const loads = [];
	const saves = [];
	for (let index = 0; index < iterations; index++) {
		const result = runIteration(state);
		loads.push(result.loadMs);
		saves.push(result.saveMs);
	}

	const report = {
		blocklyVersion: Blockly.VERSION,
		nodeVersion: process.version,
		platform: `${process.platform}-${process.arch}`,
		blockCount: BLOCK_COUNT,
		iterations,
		serializedBytes: Buffer.byteLength(JSON.stringify(state)),
		load: summarize(loads),
		save: summarize(saves),
	};
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

try {
	main();
} catch (error) {
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
}
