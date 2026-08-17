/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { CoreEnvironmentManager, CoreEnvironmentProvider } from '../../services/coreEnvironmentManager';
import { CoreEnvironment, CoreEnvironmentId } from '../../types/coreEnvironment';
import { PlatformioProcessError } from '../../services/platformioProcess';

function environment(id: CoreEnvironmentId): CoreEnvironment {
	return {
		id,
		displaySource: id,
		invocation: { command: id, prefixArgs: [], env: {}, source: id },
		pythonPath: id === 'managed' ? '/python' : null,
		mpremotePath: id === 'managed' ? '/mpremote' : null,
		storageRoot: null,
		health: { status: 'healthy', checkedAt: null, packageStatus: 'unknown', failureClass: null },
	};
}

function fakeProvider(id: CoreEnvironmentId, calls: string[], result: () => Promise<CoreEnvironment | null>): CoreEnvironmentProvider {
	return { id, resolve: async () => {calls.push(id); return result();} };
}

suite('CoreEnvironmentManager', () => {
	test('uses provider first for Arduino and managed first for Python', async () => {
		const calls: string[] = [];
		const manager = new CoreEnvironmentManager(
			fakeProvider('provider', calls, async () => environment('provider')),
			fakeProvider('managed', calls, async () => environment('managed'))
		);
		assert.strictEqual((await manager.getEnvironment('arduino', 'file:///workspace')).selected?.id, 'provider');
		assert.strictEqual((await manager.getEnvironment('python', 'file:///workspace')).selected?.id, 'managed');
		assert.deepStrictEqual(calls, ['provider', 'managed']);
	});

	test('falls back once for a missing primary and keeps the fallback sticky', async () => {
		const calls: string[] = [];
		const manager = new CoreEnvironmentManager(
			fakeProvider('provider', calls, async () => null),
			fakeProvider('managed', calls, async () => environment('managed'))
		);
		const first = await manager.getEnvironment('arduino', 'file:///workspace');
		const second = await manager.getEnvironment('arduino', 'file:///workspace');
		assert.strictEqual(first.selected?.id, 'managed');
		assert.strictEqual(first.fallbackUsed, true);
		assert.strictEqual(second.selected?.id, 'managed');
		assert.deepStrictEqual(calls, ['provider', 'managed'], 'Sticky fallback should reuse the cached environment');
		assert.strictEqual(manager.getSelection('arduino', 'file:///workspace').stickyReason, 'missing-executable');
	});

	test('does not fall back for network, configuration, compile, device, serial, or cancellation failures', async () => {
		for (const message of ['getaddrinfo failed', 'Invalid project configuration', 'error: compile', 'No device connected', 'Could not open port COM7', 'cancelled']) {
			const calls: string[] = [];
			const manager = new CoreEnvironmentManager(
				fakeProvider('provider', calls, async () => {throw new Error(message);}),
				fakeProvider('managed', calls, async () => environment('managed'))
			);
			const result = await manager.getEnvironment('arduino', 'file:///workspace');
			assert.strictEqual(result.selected, null, message);
			assert.deepStrictEqual(calls, ['provider'], message);
		}
	});

	test('uses a healthy provider when managed provisioning fails before a Python workload starts', async () => {
		const calls: string[] = [];
		const provisioningError = Object.assign(new Error('managed installer exited with code 1'), {
			failureDomain: 'managed-provisioning', started: true, code: 1,
		});
		const manager = new CoreEnvironmentManager(
			fakeProvider('provider', calls, async () => environment('provider')),
			fakeProvider('managed', calls, async () => {throw provisioningError;})
		);

		const result = await manager.getEnvironment('python', 'file:///workspace');

		assert.strictEqual(result.selected?.id, 'provider');
		assert.strictEqual(result.fallbackUsed, true);
		assert.deepStrictEqual(calls, ['managed', 'provider']);
		assert.strictEqual(manager.getSelection('python', 'file:///workspace').stickyReason, 'managed-provisioning');
	});

	test('retries a pre-start local operation failure with the other Core and makes it sticky', async () => {
		const calls: string[] = [];
		const operations: string[] = [];
		const manager = new CoreEnvironmentManager(
			fakeProvider('provider', calls, async () => environment('provider')),
			fakeProvider('managed', calls, async () => environment('managed'))
		);
		const value = await manager.run({
			workload: 'arduino', workspaceUri: 'file:///workspace', phase: 'project-process',
			operation: async core => {
				operations.push(core.id);
				if (core.id === 'provider') {throw new PlatformioProcessError('missing executable', false, 'ENOENT');}
				return 'ok';
			},
		});
		assert.strictEqual(value, 'ok');
		assert.deepStrictEqual(operations, ['provider', 'managed']);
		assert.strictEqual(manager.getSelection('arduino', 'file:///workspace').selected, 'managed');
	});

	test('never retries after the upload process has spawned', async () => {
		const calls: string[] = [];
		const operations: string[] = [];
		const manager = new CoreEnvironmentManager(
			fakeProvider('provider', calls, async () => environment('provider')),
			fakeProvider('managed', calls, async () => environment('managed'))
		);
		await assert.rejects(() => manager.run({
			workload: 'arduino', workspaceUri: 'file:///workspace', phase: 'project-process',
			operation: async core => {
				operations.push(core.id);
				throw new PlatformioProcessError('upload failed', true, 'ENOENT');
			},
		}));
		assert.deepStrictEqual(operations, ['provider']);
	});

	test('reset clears sticky routing for an explicit retest', async () => {
		const calls: string[] = [];
		let providerReady = false;
		const manager = new CoreEnvironmentManager(
			fakeProvider('provider', calls, async () => providerReady ? environment('provider') : null),
			fakeProvider('managed', calls, async () => environment('managed'))
		);
		await manager.getEnvironment('arduino', 'file:///workspace');
		providerReady = true;
		manager.reset('arduino');
		assert.strictEqual((await manager.getEnvironment('arduino', 'file:///workspace')).selected?.id, 'provider');
	});
});
