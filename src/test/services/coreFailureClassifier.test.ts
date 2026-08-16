/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { classifyCoreFailure, isCoreFallbackAllowed } from '../../services/coreFailureClassifier';
import { PlatformioProcessError } from '../../services/platformioProcess';

suite('Core failure classifier', () => {
	const cases: Array<[string, unknown, Parameters<typeof classifyCoreFailure>[1]]> = [
		['missing-executable', Object.assign(new Error('spawn pio'), { code: 'ENOENT' }), 'probe'],
		['python-import', new Error("ModuleNotFoundError: No module named 'platformio'"), 'prepare'],
		['permission', Object.assign(new Error('permission denied'), { code: 'EACCES' }), 'prepare'],
		['local-store-corruption', new Error('corrupt local core metadata'), 'prepare'],
		['compile', new Error('main.cpp:2: error: missing symbol'), 'project-process'],
		['project-config', new Error('Invalid project configuration in platformio.ini'), 'project-process'],
		['dns', Object.assign(new Error('getaddrinfo failed'), { code: 'ENOTFOUND' }), 'prepare'],
		['proxy', new Error('407 Proxy Authentication Required'), 'prepare'],
		['tls', new Error('self-signed certificate in certificate chain'), 'prepare'],
		['registry', new Error('PlatformIO registry download failed'), 'prepare'],
		['device', new Error('No device connected'), 'project-process'],
		['serial', new Error('Could not open port COM7'), 'project-process'],
		['cancelled', Object.assign(new Error('aborted'), { code: 'ABORT_ERR' }), 'prepare'],
	];

	for (const [expected, error, phase] of cases) {
		test(`classifies ${expected}`, () => assert.strictEqual(classifyCoreFailure(error, phase), expected));
	}

	test('allows only local failures before spawn', () => {
		for (const failure of ['spawn', 'missing-executable', 'python-import', 'permission', 'local-store-corruption'] as const) {
			assert.strictEqual(isCoreFallbackAllowed(failure, 'prepare', false), true);
			assert.strictEqual(isCoreFallbackAllowed(failure, 'project-process', true), false);
		}
		for (const failure of ['compile', 'project-config', 'dns', 'proxy', 'tls', 'registry', 'device', 'serial', 'cancelled', 'unknown-after-start'] as const) {
			assert.strictEqual(isCoreFallbackAllowed(failure, 'prepare', false), false);
		}
	});

	test('treats a spawned upload failure as non-fallback even when its code resembles a local failure', () => {
		const error = new PlatformioProcessError('spawned upload failed', true, 'ENOENT');
		const failure = classifyCoreFailure(error, 'project-process');
		assert.strictEqual(failure, 'missing-executable');
		assert.strictEqual(isCoreFallbackAllowed(failure, 'project-process', true), false);
	});

	test('reads execFile callback failures from the nested error field', () => {
		const failure = classifyCoreFailure({
			error: Object.assign(new Error('spawn python failed'), { code: 'ENOENT' }),
			stdout: '',
			stderr: '',
		}, 'probe');
		assert.strictEqual(failure, 'missing-executable');
	});

	test('allows a local prepare failure after the preflight process starts', () => {
		assert.strictEqual(isCoreFallbackAllowed('python-import', 'prepare', true), true);
		assert.strictEqual(isCoreFallbackAllowed('python-import', 'project-process', true), false);
	});
});
