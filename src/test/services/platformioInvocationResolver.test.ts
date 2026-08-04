/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as path from 'path';
import * as sinon from 'sinon';
import {
	formatPlatformioTerminalCommand,
	parsePlatformioCustomPath,
	resolvePlatformioInvocation,
} from '../../services/platformioInvocationResolver';

suite('PlatformioInvocationResolver Tests', () => {
	test('falls back to python -m platformio when pio.exe exists but cannot execute', async () => {
		const scriptsDir = path.win32.join('D:\\pio-core', 'penv', 'Scripts');
		const pioPath = path.win32.join(scriptsDir, 'pio.exe');
		const pythonPath = path.win32.join(scriptsDir, 'python.exe');
		const existing = new Set([pioPath, pythonPath]);
		const probe = sinon.stub();
		probe.withArgs(pioPath, ['--version'], sinon.match.any).rejects(new Error('Access denied'));
		probe.withArgs(pythonPath, ['-m', 'platformio', '--version'], sinon.match.any).resolves({
			stdout: 'PlatformIO Core, version 6.1.19',
			stderr: '',
		});

		const result = await resolvePlatformioInvocation({
			existsSync: filePath => existing.has(filePath),
			probe,
			platform: 'win32',
			homeDir: 'C:\\Users\\佑',
			env: {
				PATH: '',
				PLATFORMIO_CORE_DIR: 'D:\\pio-core',
			},
		});

		assert.deepStrictEqual(result.invocation, {
			command: pythonPath,
			prefixArgs: ['-m', 'platformio'],
			mode: 'python-module',
			source: 'platformio-core-dir',
		});
		assert.strictEqual(result.failures.length, 1);
	});

	test('checks the Windows system-drive Core directory for Unicode user profiles', async () => {
		const pythonPath = 'C:\\.platformio\\penv\\Scripts\\python.exe';
		const probe = sinon.stub().resolves({
			stdout: 'PlatformIO Core, version 6.1.19',
			stderr: '',
		});

		const result = await resolvePlatformioInvocation({
			existsSync: filePath => filePath === pythonPath,
			probe,
			platform: 'win32',
			homeDir: 'C:\\Users\\佑',
			env: { PATH: '' },
		});

		assert.strictEqual(result.invocation?.command, pythonPath);
		assert.strictEqual(result.invocation?.source, 'system-drive-core-dir');
	});

	test('honors an executable from platformio-ide.customPATH', async () => {
		const pioPath = '/official/penv/bin/pio';
		const probe = sinon.stub().resolves({
			stdout: 'PlatformIO Core, version 6.1.19',
			stderr: '',
		});

		const result = await resolvePlatformioInvocation({
			existsSync: filePath => filePath === pioPath,
			probe,
			customPathEntries: ['/official/penv/bin'],
			platform: 'linux',
			homeDir: '/home/student',
			env: { PATH: '' },
		});

		assert.strictEqual(result.invocation?.command, pioPath);
		assert.strictEqual(result.invocation?.source, 'official-custom-path');
	});

	test('continues probing after a found candidate fails', async () => {
		const probe = sinon.stub();
		probe.onFirstCall().rejects(new Error('blocked launcher'));
		probe.onSecondCall().resolves({
			stdout: 'PlatformIO Core, version 6.1.19',
			stderr: '',
		});

		const result = await resolvePlatformioInvocation({
			existsSync: () => true,
			probe,
			customPathEntries: ['/tools'],
			platform: 'linux',
			homeDir: '/home/student',
			env: { PATH: '' },
		});

		assert.strictEqual(result.invocation?.command, '/tools/platformio');
		assert.strictEqual(probe.callCount, 2);
	});

	test('returns found candidates separately from unavailable Core', async () => {
		const probe = sinon.stub().rejects(new Error('Access denied'));

		const result = await resolvePlatformioInvocation({
			existsSync: filePath => filePath.endsWith('pio.exe'),
			probe,
			platform: 'win32',
			homeDir: 'C:\\Users\\student',
			env: { PATH: '' },
		});

		assert.strictEqual(result.invocation, null);
		assert.ok(result.foundCandidates.length > 0);
		assert.strictEqual(result.failures.length, result.foundCandidates.length);
	});

	test('parses customPATH and formats a Python module terminal command safely', () => {
		assert.deepStrictEqual(
			parsePlatformioCustomPath('C:\\one;D:\\two;C:\\one', 'win32'),
			['C:\\one', 'D:\\two']
		);

		const command = formatPlatformioTerminalCommand({
			command: 'C:\\.platformio\\penv\\Scripts\\python.exe',
			prefixArgs: ['-m', 'platformio'],
			mode: 'python-module',
			source: 'system-drive-core-dir',
		}, ['device', 'monitor'], 'win32');

		assert.strictEqual(
			command,
			"& 'C:\\.platformio\\penv\\Scripts\\python.exe' '-m' 'platformio' 'device' 'monitor'"
		);
	});
});
