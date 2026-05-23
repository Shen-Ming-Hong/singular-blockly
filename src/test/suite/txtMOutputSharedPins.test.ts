/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import { txtMOutputBlock, txtOutputBlock, txtProcessBlock, txtSetupBlock, txtWorkspace } from '../helpers/txtWorkspaceBuilder';

type TxtMOutputValidationApi = {
	validateWorkspace(source: unknown): {
		conflicts: Array<{ kind: string; mPort: string; relatedOPorts: string[] }>;
		canUpload: boolean;
		canExport: boolean;
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

suite('TXT M Output Shared Pin Tests', () => {
	const sharedCases: Array<[mPort: 'M1' | 'M2' | 'M4', oPort: 'O1' | 'O2' | 'O3' | 'O8']> = [
		['M1', 'O1'],
		['M1', 'O2'],
		['M2', 'O3'],
		['M4', 'O8'],
	];

	for (const [mPort, oPort] of sharedCases) {
		test(`${mPort} 與 ${oPort} 共用腳位時應 blocking`, () => {
			const workspace = txtWorkspace([
				txtSetupBlock(),
				txtProcessBlock([
					txtMOutputBlock({ id: `${mPort}-lamp`, port: mPort, component: 'LAMP' }),
					txtOutputBlock({ id: `${oPort}-output`, port: oPort }),
				]),
			]);

			const result = validation.validateWorkspace(workspace);
			const conflict = result.conflicts.find(item => item.kind === 'M_O_SHARED_PIN_CONFLICT');

			assert.strictEqual(result.canUpload, false);
			assert.strictEqual(result.canExport, false);
			assert.ok(conflict, `${mPort}/${oPort} should create a shared-pin conflict`);
			assert.strictEqual(conflict?.mPort, mPort);
			assert.deepStrictEqual(conflict?.relatedOPorts, [oPort]);
		});
	}

	const nonSharedCases: Array<[mPort: 'M1' | 'M2' | 'M3', oPort: 'O3' | 'O1' | 'O7']> = [
		['M1', 'O3'],
		['M2', 'O1'],
		['M3', 'O7'],
	];

	for (const [mPort, oPort] of nonSharedCases) {
		test(`${mPort} 與 ${oPort} 非共用腳位時不應 blocking`, () => {
			const workspace = txtWorkspace([
				txtSetupBlock(),
				txtProcessBlock([
					txtMOutputBlock({ id: `${mPort}-motor`, port: mPort, component: 'MOTOR' }),
					txtOutputBlock({ id: `${oPort}-output`, port: oPort }),
				]),
			]);

			const result = validation.validateWorkspace(workspace);

			assert.strictEqual(result.canUpload, true);
			assert.strictEqual(result.canExport, true);
			assert.deepStrictEqual(result.conflicts, []);
		});
	}

	test('M-only workspace 不應產生 shared-pin conflict', () => {
		const workspace = txtWorkspace([
			txtSetupBlock(),
			txtProcessBlock([txtMOutputBlock({ id: 'm-only', port: 'M1', component: 'MOTOR' })]),
		]);

		assert.deepStrictEqual(validation.validateWorkspace(workspace).conflicts, []);
	});

	test('O-only workspace 不應產生 shared-pin conflict', () => {
		const workspace = txtWorkspace([
			txtSetupBlock(),
			txtProcessBlock([txtOutputBlock({ id: 'o-only', port: 'O1' })]),
		]);

		assert.deepStrictEqual(validation.validateWorkspace(workspace).conflicts, []);
	});
});