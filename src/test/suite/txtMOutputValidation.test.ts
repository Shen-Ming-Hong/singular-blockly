/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import {
	txtMOutputBlock,
	txtMStopBlock,
	txtOutputBlock,
	txtProcessBlock,
	txtSetupBlock,
	txtWorkspace,
} from '../helpers/txtWorkspaceBuilder';

type TxtMOutputValidationApi = {
	COMPONENT_KEYS: { MOTOR: 'MOTOR'; LAMP: 'LAMP' };
	M_COMPONENTS: Record<string, { requiresDirection: boolean; generatorMode: string }>;
	M_TO_O_PORTS: Record<string, readonly string[]>;
	normalizeMPort(value: unknown): string | null;
	normalizeOPort(value: unknown): string | null;
	normalizeComponent(value: unknown): string;
	validateWorkspace(source: unknown): {
		conflicts: Array<{ kind: string; mPort: string; components?: string[]; relatedOPorts: string[]; blockIds: string[] }>;
		canUpload: boolean;
		canExport: boolean;
		blockWarnings: Record<string, string[]>;
	};
};

const validation = require(path.join(
	__dirname,
	'..',
	'..',
	'..',
	'media',
	'js',
	'txtMOutputValidation.js'
)) as TxtMOutputValidationApi;

suite('TXT M Output Validation Tests', () => {
	test('helper module 應匯出 namespace、component keys 與 shared-pin mapping', () => {
		assert.strictEqual(validation.COMPONENT_KEYS.MOTOR, 'MOTOR');
		assert.strictEqual(validation.COMPONENT_KEYS.LAMP, 'LAMP');
		assert.strictEqual(validation.M_COMPONENTS.MOTOR.requiresDirection, true);
		assert.strictEqual(validation.M_COMPONENTS.LAMP.requiresDirection, false);
		assert.deepStrictEqual(validation.M_TO_O_PORTS.M1, ['O1', 'O2']);
		assert.deepStrictEqual(validation.M_TO_O_PORTS.M4, ['O7', 'O8']);
	});

	test('port 與 component normalization 應支援欄位值與 legacy fallback', () => {
		assert.strictEqual(validation.normalizeMPort('1'), 'M1');
		assert.strictEqual(validation.normalizeMPort('M2'), 'M2');
		assert.strictEqual(validation.normalizeMPort('9'), null);
		assert.strictEqual(validation.normalizeOPort('O8'), 'O8');
		assert.strictEqual(validation.normalizeComponent(undefined), 'MOTOR');
		assert.strictEqual(validation.normalizeComponent(''), 'MOTOR');
		assert.strictEqual(validation.normalizeComponent('unknown'), 'MOTOR');
		assert.strictEqual(validation.normalizeComponent('lamp'), 'LAMP');
	});

	test('同一 M 埠不同 component 應產生 blocking conflict', () => {
		const workspace = txtWorkspace([
			txtSetupBlock(),
			txtProcessBlock([
				txtMOutputBlock({ id: 'm1-motor', port: 'M1', component: 'MOTOR' }),
				txtMOutputBlock({ id: 'm1-lamp', port: 'M1', component: 'LAMP' }),
			]),
		]);

		const result = validation.validateWorkspace(workspace);

		assert.strictEqual(result.canUpload, false);
		assert.strictEqual(result.canExport, false);
		assert.strictEqual(result.conflicts.length, 1);
		assert.strictEqual(result.conflicts[0].kind, 'M_COMPONENT_CONFLICT');
		assert.strictEqual(result.conflicts[0].mPort, 'M1');
		assert.deepStrictEqual(result.conflicts[0].components?.sort(), ['LAMP', 'MOTOR']);
		assert.ok(result.blockWarnings['m1-motor'].some(message => message.includes('M1')));
	});

	test('同一 M 埠相同 component 不應產生 conflict', () => {
		const workspace = txtWorkspace([
			txtSetupBlock(),
			txtProcessBlock([
				txtMOutputBlock({ id: 'm2-a', port: 'M2', component: 'MOTOR' }),
				txtMOutputBlock({ id: 'm2-b', port: 'M2', component: 'MOTOR' }),
			]),
		]);

		const result = validation.validateWorkspace(workspace);

		assert.strictEqual(result.canUpload, true);
		assert.strictEqual(result.canExport, true);
		assert.deepStrictEqual(result.conflicts, []);
	});

	test('metadata-defined future component 應沿用相同 M/O conflict rules', () => {
		const workspace = txtWorkspace([
			txtSetupBlock(),
			txtProcessBlock([
				txtMOutputBlock({ id: 'm3-output', port: 'M3', component: 'LAMP' }),
				txtMStopBlock({ id: 'm4-stop', port: 'M4' }),
				txtOutputBlock({ id: 'o8-output', port: 'O8' }),
			]),
		]);

		const result = validation.validateWorkspace(workspace);

		assert.strictEqual(result.conflicts.length, 1);
		assert.strictEqual(result.conflicts[0].kind, 'M_O_SHARED_PIN_CONFLICT');
		assert.strictEqual(result.conflicts[0].mPort, 'M4');
		assert.deepStrictEqual(result.conflicts[0].relatedOPorts, ['O8']);
	});
});