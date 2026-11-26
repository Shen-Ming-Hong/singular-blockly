/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { classifyCoreFailure, isCoreFallbackAllowed, isWindowsPathLengthFailure } from '../../services/coreFailureClassifier';
import { PlatformioProcessError } from '../../services/platformioProcess';

suite('Core failure classifier', () => {
	const cases: Array<[string, unknown, Parameters<typeof classifyCoreFailure>[1]]> = [
		['missing-executable', Object.assign(new Error('spawn pio'), { code: 'ENOENT' }), 'probe'],
		['python-import', new Error("ModuleNotFoundError: No module named 'platformio'"), 'prepare'],
		['permission', Object.assign(new Error('permission denied'), { code: 'EACCES' }), 'prepare'],
		['local-store-corruption', new Error('corrupt local core metadata'), 'prepare'],
		['local-store-corruption', new PlatformioProcessError('PlatformIO package preparation failed', true, 1, 'Resolving esp32 dependencies...', "MissingPackageManifestError: Could not find one of 'package.json' manifest files in the package"), 'prepare'],
		['managed-provisioning', Object.assign(new Error('managed installer failed'), { failureDomain: 'managed-provisioning', started: true, code: 1 }), 'probe'],
		['compile', new Error('main.cpp:2: error: missing symbol'), 'project-process'],
		['project-config', new Error('Invalid project configuration in platformio.ini'), 'project-process'],
		['dns', Object.assign(new Error('getaddrinfo failed'), { code: 'ENOTFOUND' }), 'prepare'],
		['proxy', new Error('407 Proxy Authentication Required'), 'prepare'],
		['tls', new Error('self-signed certificate in certificate chain'), 'prepare'],
		['registry', new Error('PlatformIO registry download failed'), 'prepare'],
		['device', new Error('No device connected'), 'project-process'],
		['serial', new Error('Could not open port COM7'), 'project-process'],
		['cancelled', Object.assign(new Error('aborted'), { code: 'ABORT_ERR' }), 'prepare'],
		['path-too-long', Object.assign(new Error('No short local folder'), { code: 'path-too-long' }), 'probe'],
		['path-too-long', new PlatformioProcessError('PlatformIO package preparation failed', true, 1, '', 'OSError: [WinError 206] The filename or extension is too long'), 'prepare'],
	];

	for (const [expected, error, phase] of cases) {
		test(`classifies ${expected}`, () => assert.strictEqual(classifyCoreFailure(error, phase), expected));
	}

	test('allows only local failures before spawn', () => {
		for (const failure of ['spawn', 'missing-executable', 'python-import', 'permission', 'local-store-corruption'] as const) {
			assert.strictEqual(isCoreFallbackAllowed(failure, 'prepare', false), true);
			assert.strictEqual(isCoreFallbackAllowed(failure, 'project-process', true), false);
		}
		assert.strictEqual(isCoreFallbackAllowed('managed-provisioning', 'probe', true), true);
		assert.strictEqual(isCoreFallbackAllowed('managed-provisioning', 'prepare', true), true);
		assert.strictEqual(isCoreFallbackAllowed('managed-provisioning', 'project-process', false), false);
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

	test('keeps cancellation fail-closed even when provisioning evidence is present', () => {
		const error = Object.assign(new Error('Managed runtime installation was cancelled'), {
			failureDomain: 'managed-provisioning', code: 'ABORT_ERR', started: true,
		});
		const failure = classifyCoreFailure(error, 'probe');
		assert.strictEqual(failure, 'cancelled');
		assert.strictEqual(isCoreFallbackAllowed(failure, 'probe', true), false);
	});

	suite('Windows path length failures (spec 074)', () => {
		const deepPath = `C:\\Users\\ray\\AppData\\Roaming\\Code\\User\\globalStorage\\singular-ray.singular-blockly\\runtime-v1\\versions\\${'a'.repeat(36)}\\core\\packages\\framework-arduinoespressif32\\tools\\sdk\\esp32s3\\include\\libsodium\\libsodium\\src\\libsodium\\include\\sodium\\crypto_box_curve25519xchacha20poly1305.h`;

		test('detects explicit long-path messages from Windows, pip, and PlatformIO', () => {
			for (const message of [
				'The filename or extension is too long.',
				'This error might have occurred since this system does not have Windows Long Path support enabled.',
				'Path too long',
				'The filename, directory name, or volume label syntax is incorrect.',
			]) {
				assert.strictEqual(isWindowsPathLengthFailure(message), true, message);
			}
		});

		test('detects a missing file only when its Windows path is near MAX_PATH', () => {
			assert.ok(deepPath.length >= 248);
			assert.strictEqual(isWindowsPathLengthFailure(`fatal error: ${deepPath}: No such file or directory`), true);
			assert.strictEqual(isWindowsPathLengthFailure(`ERROR: [Errno 2] No such file or directory: '${deepPath.replace('ray', 'Ray Chen')}'`), true);
			assert.strictEqual(
				classifyCoreFailure(new Error('src/main.cpp:1:10: fatal error: Servo.h: No such file or directory'), 'project-process'),
				'compile',
				'an ordinary missing include stays a compile error'
			);
			assert.strictEqual(isWindowsPathLengthFailure('C:\\Users\\ray\\project\\src\\main.cpp: No such file or directory'), false);
		});

		test('allows a pre-start fallback to the other Core', () => {
			assert.strictEqual(isCoreFallbackAllowed('path-too-long', 'probe', false), true);
			assert.strictEqual(isCoreFallbackAllowed('path-too-long', 'project-process', true), false);
		});
	});
});
