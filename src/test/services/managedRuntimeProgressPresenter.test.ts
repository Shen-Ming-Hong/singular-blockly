/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { ManagedRuntimeProgressPresenter, ManagedRuntimeProgressUi } from '../../services/managedRuntimeProgressPresenter';

function record(): any {
	return {
		schemaVersion: 1,
		runtimeVersion: 'test',
		artifactId: 'test',
		manifestSha256: 'a'.repeat(64),
		installedAt: '2026-08-17T00:00:00.000Z',
		versionDirectory: 'runtime',
		tools: {},
		health: { status: 'healthy', checkedAt: '2026-08-17T00:00:00.000Z' },
	};
}

function localizer(): any {
	return {
		getLocalizedMessage: sinon.stub().callsFake(async (_key: string, fallback = '') => fallback),
	};
}

function createUi(selection?: string): ManagedRuntimeProgressUi & {
	reports: Array<{ message?: string; increment?: number }>;
	cancel(): void;
	showErrorMessage: sinon.SinonStub;
	openDiagnostics: sinon.SinonStub;
	chooseShorterFolder: sinon.SinonStub;
	copyRepairPacket: sinon.SinonStub;
} {
	const reports: Array<{ message?: string; increment?: number }> = [];
	let cancellationListener: () => void = () => undefined;
	return {
		reports,
		withProgress: async (_options, task) => task(
			{ report: update => reports.push(update) },
			{
				isCancellationRequested: false,
				onCancellationRequested: listener => {
					cancellationListener = listener;
					return { dispose: () => undefined };
				},
			}
		),
		showErrorMessage: sinon.stub().resolves(selection),
		openDiagnostics: sinon.stub().resolves(),
		chooseShorterFolder: sinon.stub().resolves(),
		copyRepairPacket: sinon.stub().resolves(),
		cancel: () => cancellationListener(),
	};
}

suite('ManagedRuntimeProgressPresenter', () => {
	test('does not show progress when activation finds a ready runtime', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'ready', record: record() }), repair: sinon.stub() };
		const coordinator = { initialize: sinon.stub() };
		const ui = createUi();
		const withProgress = sinon.spy(ui, 'withProgress');

		const result = await new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui)
			.initialize('activation');

		assert.strictEqual(result.status, 'already-ready');
		assert.strictEqual(withProgress.called, false);
		assert.strictEqual(coordinator.initialize.called, false);
	});

	test('reports absolute installer percentages as incremental notification progress', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'missing' }), repair: sinon.stub() };
		const coordinator = {
			initialize: sinon.stub().callsFake(async (_trigger, onProgress) => {
				onProgress({ stage: 'waiting-lock', percent: 0 });
				onProgress({ stage: 'downloading-python', percent: 5 });
				onProgress({ stage: 'extracting-python', percent: 25 });
				onProgress({ stage: 'committing', percent: 100 });
				return { trigger: 'activation', status: 'installed' };
			}),
		};
		const ui = createUi();

		await new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui).initialize('activation');

		assert.deepStrictEqual(ui.reports.map(report => report.increment), [undefined, 5, 20, 75]);
		assert.ok(ui.reports[0].message?.includes('another window'));
		assert.ok(ui.reports[3].message?.includes('100%'));
	});

	test('bridges notification cancellation to the installer AbortSignal without a failure prompt', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'missing' }), repair: sinon.stub() };
		const ui = createUi();
		const coordinator = {
			initialize: sinon.stub().callsFake(async (_trigger, _onProgress, signal: AbortSignal) => {
				ui.cancel();
				assert.strictEqual(signal.aborted, true);
				throw new Error('process stopped after cancellation');
			}),
		};

		await assert.rejects(
			() => new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui).initialize('activation'),
			(error: unknown) => (error as Error).message === 'process stopped after cancellation'
		);
		assert.strictEqual(ui.showErrorMessage.called, false);
	});

	test('offers the shorter-folder action for a Windows path budget failure', async () => {
		const runtime = { getStatus: sinon.stub().resolves({ status: 'missing' }), repair: sinon.stub() };
		const coordinator = {
			initialize: sinon.stub().rejects(Object.assign(new Error('too long'), { code: 'path-too-long' })),
		};
		const ui = createUi('Choose shorter folder');

		await assert.rejects(
			() => new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui).initialize('activation')
		);

		assert.ok(ui.showErrorMessage.calledOnce);
		assert.ok(ui.showErrorMessage.firstCall.args[0].includes('shorter local folder'));
		assert.ok(ui.chooseShorterFolder.calledOnce);
		assert.strictEqual(ui.openDiagnostics.called, false);
		assert.strictEqual(ui.copyRepairPacket.called, false);
	});

	test('coalesces activation and editor-open into one notification and one installer call', async () => {
		let release!: () => void;
		const pending = new Promise<void>(resolve => {release = resolve;});
		const runtime = { getStatus: sinon.stub().resolves({ status: 'missing' }), repair: sinon.stub() };
		const coordinator = {
			initialize: sinon.stub().callsFake(async trigger => {
				await pending;
				return { trigger, status: 'installed' };
			}),
		};
		const ui = createUi();
		const withProgress = sinon.spy(ui, 'withProgress');
		const presenter = new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui);

		const activation = presenter.initialize('activation');
		const editor = presenter.initialize('editor-open');
		release();

		assert.deepStrictEqual(await editor, await activation);
		assert.strictEqual(withProgress.callCount, 1);
		assert.strictEqual(coordinator.initialize.callCount, 1);
	});

	test('coalesces concurrent repairs while a failed background initialization settles', async () => {
		let rejectInitialization!: (error: Error) => void;
		const pendingInitialization = new Promise((_resolve, reject) => {rejectInitialization = reject;});
		const installed = record();
		const runtime = {
			getStatus: sinon.stub().resolves({ status: 'missing' }),
			repair: sinon.stub().resolves(installed),
		};
		const coordinator = { initialize: sinon.stub().returns(pendingInitialization) };
		const ui = createUi();
		const withProgress = sinon.spy(ui, 'withProgress');
		const presenter = new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui);

		const initialization = presenter.initialize('activation');
		await new Promise(resolve => setImmediate(resolve));
		const firstRepair = presenter.repair();
		const secondRepair = presenter.repair();
		rejectInitialization(new Error('background failed'));

		await assert.rejects(() => initialization, /background failed/);
		assert.strictEqual(await firstRepair, installed);
		assert.strictEqual(await secondRepair, installed);
		assert.strictEqual(runtime.repair.callCount, 1);
		assert.strictEqual(withProgress.callCount, 2, 'one initialization and one repair notification');
	});

	test('executes the diagnostics and AI packet recovery actions selected after failure', async () => {
		for (const [selection, action] of [
			['Open diagnostics', 'openDiagnostics'],
			['Copy AI repair summary', 'copyRepairPacket'],
		] as const) {
			const runtime = { getStatus: sinon.stub().resolves({ status: 'missing' }), repair: sinon.stub() };
			const coordinator = { initialize: sinon.stub().rejects(new Error('failed')) };
			const ui = createUi(selection);

			await assert.rejects(
				() => new ManagedRuntimeProgressPresenter(runtime, coordinator, localizer(), ui).initialize('activation')
			);
			assert.strictEqual(ui[action].callCount, 1);
		}
	});

	test('shows progress for explicit repair and stays silent on success', async () => {
		const installed = record();
		const runtime = {
			getStatus: sinon.stub().resolves({ status: 'invalid', reason: 'broken' }),
			repair: sinon.stub().callsFake(async ({ onProgress }) => {
				onProgress({ stage: 'verifying', percent: 80 });
				onProgress({ stage: 'committing', percent: 100 });
				return installed;
			}),
		};
		const ui = createUi();

		assert.strictEqual(
			await new ManagedRuntimeProgressPresenter(runtime, { initialize: sinon.stub() }, localizer(), ui).repair(),
			installed
		);
		assert.deepStrictEqual(ui.reports.map(report => report.increment), [80, 20]);
		assert.strictEqual(ui.showErrorMessage.called, false);
	});
});
