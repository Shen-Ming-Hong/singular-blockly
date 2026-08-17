/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { ManagedRuntimeInitializationCoordinator } from '../../services/managedRuntimeInitializationCoordinator';

function record(): any {
	return { schemaVersion: 1, runtimeVersion: 'test', artifactId: 'test', manifestSha256: 'a'.repeat(64) };
}

suite('ManagedRuntimeInitializationCoordinator', () => {
	test('does not install when activation finds a ready runtime', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'ready', record: record() }), ensureReady: sinon.stub() };
		const result = await new ManagedRuntimeInitializationCoordinator(runtime).initialize('activation');
		assert.strictEqual(result.status, 'already-ready');
		assert.ok(runtime.ensureReady.notCalled);
	});

	test('starts installation during activation when runtime is missing', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'missing' }), ensureReady: sinon.stub().resolves(record()) };
		const result = await new ManagedRuntimeInitializationCoordinator(runtime).initialize('activation');
		assert.strictEqual(result.status, 'installed');
		assert.ok(runtime.ensureReady.calledOnce);
	});

	test('editor-open check repairs an invalid runtime', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'invalid', reason: 'mismatch' }), ensureReady: sinon.stub().resolves(record()) };
		const result = await new ManagedRuntimeInitializationCoordinator(runtime).initialize('editor-open');
		assert.strictEqual(result.trigger, 'editor-open');
		assert.ok(runtime.ensureReady.calledOnce);
	});

	test('forwards cancellation to background provisioning', async () => {
		const controller = new AbortController();
		const runtime = {
			getStatus: sinon.stub().resolves({ status: 'missing' }),
			ensureReady: sinon.stub().callsFake(async options => {
				assert.strictEqual(options.signal, controller.signal);
				return record();
			}),
		};

		await new ManagedRuntimeInitializationCoordinator(runtime).initialize(
			'activation',
			undefined,
			controller.signal
		);

		assert.ok(runtime.ensureReady.calledOnce);
	});

	test('deduplicates simultaneous activation and editor-open initialization', async () => {
		let release!: () => void;
		const pending = new Promise<void>(resolve => {release = resolve;});
		const runtime = {
			getStatus: sinon.stub().resolves({ status: 'missing' }),
			ensureReady: sinon.stub().callsFake(async () => {await pending; return record();}),
		};
		const coordinator = new ManagedRuntimeInitializationCoordinator(runtime);
		const activation = coordinator.initialize('activation');
		const editor = coordinator.initialize('editor-open');
		release();
		assert.deepStrictEqual(await editor, await activation);
		assert.ok(runtime.ensureReady.calledOnce);
	});

	test('does not attempt installation on an unsupported platform', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'unsupported', reason: 'unsupported' }), ensureReady: sinon.stub() };
		const result = await new ManagedRuntimeInitializationCoordinator(runtime).initialize('activation');
		assert.strictEqual(result.status, 'unsupported');
		assert.ok(runtime.ensureReady.notCalled);
	});
});
