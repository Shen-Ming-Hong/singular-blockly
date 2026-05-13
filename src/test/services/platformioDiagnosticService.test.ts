/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { PlatformioDiagnosticService } from '../../services/platformioDiagnosticService';

interface StubLocaleService {
	getLocalizedMessage(key: string, fallbackOrArg?: string | any, ...args: any[]): Promise<string>;
}

function createLocaleServiceStub(): StubLocaleService {
	return {
		async getLocalizedMessage(_key: string, fallbackOrArg?: string | any, ...args: any[]) {
			let template = typeof fallbackOrArg === 'string' ? fallbackOrArg : _key;
			const values = typeof fallbackOrArg === 'string' ? args : [fallbackOrArg, ...args].filter(value => value !== undefined);
			values.forEach((value, index) => {
				template = template.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value));
			});
			return template;
		},
	};
}

suite('PlatformioDiagnosticService Tests', () => {
	let sandbox: sinon.SinonSandbox;
	let execFileStub: sinon.SinonStub;
	let existsSyncStub: sinon.SinonStub;
	const now = new Date('2026-01-02T03:04:05.000Z');
	const localeService = createLocaleServiceStub();

	setup(() => {
		sandbox = sinon.createSandbox();
		execFileStub = sandbox.stub();
		existsSyncStub = sandbox.stub().returns(false);
	});

	teardown(() => {
		sandbox.restore();
	});

	test('returns fixed item order and resolves tools via PATH fallback', async () => {
		const pathEntries = ['/custom/penv/bin'];
		const availablePaths = new Set([
			'/custom/penv/bin/pio',
			'/custom/penv',
			'/custom/penv/bin/python3',
			'/custom/penv/bin/pip3',
			'/custom/penv/bin/mpremote',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.callsFake(async (filePath: string) => {
			return { stdout: `${filePath} version`, stderr: '' };
		});

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: pathEntries.join(':') },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
		});

		const session = await service.collectDiagnostics('/workspace/demo');

		assert.deepStrictEqual(
			session.items.map(item => item.id),
			['pio', 'penvRoot', 'python', 'pip', 'mpremote'],
			'Should keep the fixed diagnostic item order'
		);
		assert.strictEqual(session.requestedAt, now.toISOString());
		assert.strictEqual(session.overallStatus, 'operational');
		assert.strictEqual(session.items[0].resolvedPath, '/custom/penv/bin/pio');
		assert.strictEqual(session.items[0].source, 'path-search');
		assert.strictEqual(session.items[1].resolvedPath, '/custom/penv');
		assert.strictEqual(session.items[1].source, 'resolved-pio-sibling');
		assert.strictEqual(session.items[2].source, 'derived-from-penv');
		assert.strictEqual(session.items[2].isFromDetectedPenv, true);
		assert.strictEqual(session.items[4].status, 'ok');
		assert.strictEqual(execFileStub.callCount, 4, 'Should probe the four executable items');
	});

	test('does not treat a generic PATH pio location as a detected penv', async () => {
		const availablePaths = new Set([
			'/usr/local/bin/pio',
			'/usr/local',
			'/usr/local/bin/python3',
			'/usr/local/bin/pip3',
			'/usr/local/bin/mpremote',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.callsFake(async (filePath: string) => {
			return { stdout: `${filePath} version`, stderr: '' };
		});

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '/usr/local/bin' },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
		});

		const session = await service.collectDiagnostics('/workspace/demo');

		assert.strictEqual(session.overallStatus, 'degraded');
		assert.strictEqual(session.items[1].status, 'warning');
		assert.strictEqual(session.items[1].resolvedPath, '/usr/local');
		assert.strictEqual(session.items[2].source, 'path-search');
		assert.strictEqual(session.items[2].isFromDetectedPenv, false);
		assert.strictEqual(session.items[3].isFromDetectedPenv, false);
		assert.strictEqual(session.items[4].isFromDetectedPenv, false);
	});

	test('reports unavailable when pio cannot be resolved', async () => {
		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '' },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
		});

		const session = await service.collectDiagnostics(null);

		assert.strictEqual(session.overallStatus, 'unavailable');
		assert.strictEqual(session.items[0].status, 'error');
		assert.strictEqual(session.items[0].resolvedPath, null);
		assert.ok(session.items[0].nextStep, 'Missing pio should include a next step');
		assert.strictEqual(session.items[1].status, 'error', 'penv root should also show unresolved when pio is missing');
		assert.strictEqual(execFileStub.callCount, 0, 'Should not probe commands that are not resolved');
	});

	test('marks session degraded when a resolved executable fails its version probe', async () => {
		const availablePaths = new Set([
			'/custom/penv/bin/pio',
			'/custom/penv',
			'/custom/penv/bin/python3',
			'/custom/penv/bin/pip3',
			'/custom/penv/bin/mpremote',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.callsFake(async (filePath: string) => {
			if (filePath.endsWith('mpremote')) {
				const timeoutError = new Error('version probe timed out') as Error & { stderr?: string };
				timeoutError.stderr = 'timeout';
				throw timeoutError;
			}
			return { stdout: `${filePath} version`, stderr: '' };
		});

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '/custom/penv/bin' },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
		});

		const session = await service.collectDiagnostics('/workspace/demo');
		const mpremoteItem = session.items[4];

		assert.strictEqual(session.overallStatus, 'degraded');
		assert.strictEqual(mpremoteItem.status, 'warning');
		assert.ok(mpremoteItem.reason.includes('/custom/penv/bin/mpremote'));
		assert.ok(mpremoteItem.nextStep, 'Probe failures should include a remediation step');
		assert.strictEqual(mpremoteItem.versionProbe?.succeeded, false);
	});

	test('buildClipboardSummary includes key diagnostic details', async () => {
		const availablePaths = new Set([
			'/custom/penv/bin/pio',
			'/custom/penv',
			'/custom/penv/bin/python3',
			'/custom/penv/bin/pip3',
			'/custom/penv/bin/mpremote',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.resolves({ stdout: 'PlatformIO Core, version 6.1.18', stderr: '' });

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '/custom/penv/bin' },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
		});

		const session = await service.collectDiagnostics('/workspace/demo');
		const summary = await service.buildClipboardSummary(session);

		assert.strictEqual(summary.generatedAt, now.toISOString());
		assert.strictEqual(summary.overallStatus, 'operational');
		assert.ok(summary.plainText.includes('PlatformIO Diagnostic'));
		assert.ok(summary.plainText.includes('/custom/penv/bin/pio'));
		assert.ok(summary.plainText.includes('Overall status: Operational'));
	});
});
