/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import { suite, test, teardown } from 'mocha';
import { CommandExecutor, MicropythonUploader } from '../../services/micropythonUploader';
import { CoreEnvironmentManager, CoreEnvironmentProvider } from '../../services/coreEnvironmentManager';
import { CoreEnvironment, CoreEnvironmentId } from '../../types/coreEnvironment';

function environment(id: CoreEnvironmentId): CoreEnvironment {
	return {
		id,
		displaySource: id,
		invocation: { command: `/${id}/pio`, prefixArgs: [], env: {}, source: id },
		pythonPath: `/${id}/python`,
		mpremotePath: `/${id}/mpremote`,
		storageRoot: `/${id}`,
		health: { status: 'healthy', checkedAt: null, packageStatus: 'unknown', failureClass: null },
	};
}

function provider(id: CoreEnvironmentId): CoreEnvironmentProvider {
	return { id, resolve: async () => environment(id) };
}

suite('MicropythonUploader environment availability', () => {
	const executor: CommandExecutor = {
		exec: async () => ({ stdout: '', stderr: '' }),
		execFile: async () => ({ stdout: '', stderr: '' }),
	};

	teardown(() => {
		sinon.restore();
	});

	test('reports initialization when a provider is installed but Python is unavailable', async () => {
		const uploader = new MicropythonUploader('/workspace', executor, () => true);
		sinon.stub(uploader, 'checkPythonEnvironment').resolves(false);

		const result = await uploader.ensureMpremoteAvailable();

		assert.strictEqual(result.success, false);
		if (!result.success) {
			assert.strictEqual(result.message, 'PlatformIO Python environment is not available.');
			assert.match(result.details ?? '', /still initializing/);
			assert.doesNotMatch(result.details ?? '', /install PlatformIO IDE/);
		}
	});

	test('suggests automatic setup when no provider is installed', async () => {
		const uploader = new MicropythonUploader('/workspace', executor, () => false);
		sinon.stub(uploader, 'checkPythonEnvironment').resolves(false);

		const result = await uploader.ensureMpremoteAvailable();

		assert.strictEqual(result.success, false);
		if (!result.success) {
			assert.match(result.details ?? '', /Open the Blockly editor/);
			assert.match(result.details ?? '', /pioarduino/);
		}
	});

	test('uses managed Python and mpremote before probing the provider environment', async () => {
		const calls: string[] = [];
		const coreManager = {
			run: async (options: {
				onProgress?: (progress: { stage: string; percent: number }) => void;
				operation: (candidate: CoreEnvironment) => Promise<CoreEnvironment>;
			}) => {
				calls.push('managed-ready');
				options.onProgress?.({ stage: 'installing-platformio', percent: 40 });
				calls.push('managed-environment');
				return options.operation(environment('managed'));
			},
			getSelection: () => ({ fallbackUsed: false }),
		};
		const uploader = new MicropythonUploader('/workspace', executor, () => true, coreManager as any);
		const providerProbe = sinon.stub(uploader, 'checkPythonEnvironment').callsFake(async () => {
			calls.push('provider-python');
			return true;
		});
		const progress: string[] = [];

		const result = await uploader.ensureMpremoteAvailable(update => progress.push(update.stage));

		assert.deepStrictEqual(result, { success: true });
		assert.deepStrictEqual(calls, ['managed-ready', 'managed-environment']);
		assert.strictEqual(providerProbe.called, false);
		assert.ok(progress.includes('installing_tool'));
	});

	test('falls back to the provider environment when managed setup fails locally', async () => {
		const managed: CoreEnvironmentProvider = {
			id: 'managed',
			resolve: async () => {throw Object.assign(new Error('permission denied'), { code: 'EACCES' });},
		};
		const manager = new CoreEnvironmentManager(provider('provider'), managed);
		const uploader = new MicropythonUploader('/workspace', executor, () => true, manager);

		const result = await uploader.ensureMpremoteAvailable();

		assert.deepStrictEqual(result, { success: true });
		assert.strictEqual(manager.getSelection('python', '/workspace').selected, 'provider');
		assert.strictEqual(manager.getSelection('python', '/workspace').fallbackUsed, true);
	});

	test('does not bypass the Core manager after a TLS failure forbids fallback', async () => {
		let providerCalls = 0;
		const providerCore: CoreEnvironmentProvider = {
			id: 'provider',
			resolve: async () => {
				providerCalls++;
				return environment('provider');
			},
		};
		const managed: CoreEnvironmentProvider = {
			id: 'managed',
			resolve: async () => {throw new Error('TLS certificate verification failed');},
		};
		const manager = new CoreEnvironmentManager(providerCore, managed);
		const uploader = new MicropythonUploader('/workspace', executor, () => true, manager);
		const legacyPythonProbe = sinon.stub(uploader, 'checkPythonEnvironment').resolves(true);

		const result = await uploader.ensureMpremoteAvailable();

		assert.strictEqual(result.success, false);
		if (!result.success) {
			assert.match(result.details ?? '', /fallback stopped \(tls\)/i);
		}
		assert.strictEqual(providerCalls, 0);
		assert.strictEqual(legacyPythonProbe.called, false);
	});

	test('probes managed tools and falls back when the managed mpremote executable is broken', async () => {
		const manager = new CoreEnvironmentManager(provider('provider'), provider('managed'));
		const probingExecutor: CommandExecutor = {
			exec: async () => ({ stdout: '', stderr: '' }),
			execFile: async file => {
				if (file === '/managed/mpremote') {
					throw Object.assign(new Error('managed mpremote probe failed'), {
						error: Object.assign(new Error('missing managed mpremote'), { code: 'ENOENT' }),
						stdout: '',
						stderr: '',
					});
				}
				return { stdout: 'ok', stderr: '' };
			},
		};
		const uploader = new MicropythonUploader('/workspace', probingExecutor, () => true, manager);

		const result = await uploader.ensureMpremoteAvailable();

		assert.deepStrictEqual(result, { success: true });
		assert.strictEqual(manager.getSelection('python', '/workspace').selected, 'provider');
		assert.strictEqual(manager.getSelection('python', '/workspace').fallbackUsed, true);
	});

	test('does not prepare tools or access a device when the workspace is untrusted', async () => {
		const coreManager = { run: sinon.stub() };
		const uploader = new MicropythonUploader('/workspace', executor, () => true, coreManager as any, () => false);
		const result = await uploader.upload({ code: 'print(1)', board: 'cyberbrick' });

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.message, 'Workspace is not trusted');
		assert.strictEqual(coreManager.run.called, false);
	});

	test('does not reselect another Core after a device operation begins', async () => {
		const coreManager = {
			run: sinon.stub().callsFake((options: { operation: (candidate: CoreEnvironment) => Promise<CoreEnvironment> }) =>
				options.operation(environment('managed'))),
			getSelection: () => ({ fallbackUsed: false }),
		};
		const uploader = new MicropythonUploader('/workspace', executor, () => true, coreManager as any, () => true);
		sinon.stub(uploader, 'listPorts').resolves({
			ports: [{ path: 'COM7', vendorId: '303A', productId: '1001' }],
			autoDetected: 'COM7',
		});
		sinon.stub(uploader as any, 'resetDevice').rejects(new Error('Could not open port COM7'));

		const result = await uploader.upload({ code: 'print(1)', board: 'cyberbrick' });

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.stage, 'resetting');
		assert.strictEqual(coreManager.run.callCount, 1);
	});
});
