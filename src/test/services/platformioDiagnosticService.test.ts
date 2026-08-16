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

	test('uses platformio-ide.customPATH as an official settings path candidate', async () => {
		const availablePaths = new Set([
			'/official/penv/bin/pio',
			'/official/penv',
			'/official/penv/bin/python3',
			'/official/penv/bin/pip3',
			'/official/penv/bin/mpremote',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.callsFake(async (filePath: string) => {
			return { stdout: `${filePath} version`, stderr: '' };
		});

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '/missing/bin' },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
			configuration: {
				get(section: string, key: string) {
					return section === 'platformio-ide' && key === 'customPATH' ? '/official/penv/bin' : undefined;
				},
			},
		});

		const session = await service.collectDiagnostics('/workspace/demo');

		assert.strictEqual(session.items[0].resolvedPath, '/official/penv/bin/pio');
		assert.strictEqual(session.items[0].source, 'official-platformio-custom-path');
		assert.deepStrictEqual(session.settingsEvidence?.candidatePathEntries, ['/official/penv/bin']);
	});

	test('collects official PlatformIO and proxy settings evidence without failing when settings are absent', async () => {
		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '' },
			platform: 'darwin',
			homeDir: '/Users/tester',
			now: () => now,
			localeService,
			configuration: {
				get(section: string, key: string) {
					const values: Record<string, unknown> = {
						'platformio-ide.useBuiltinPIOCore': false,
						'platformio-ide.useBuiltinPython': true,
						'platformio-ide.useDevelopmentPIOCore': false,
						'platformio-ide.customPyPiIndexUrl': 'https://pypi.example/simple',
						'http.proxy': 'http://user:secret@proxy.example:8080',
						'http.proxyStrictSSL': false,
					};
					return values[`${section}.${key}`];
				},
			},
		});

		const session = await service.collectDiagnostics('/workspace/demo');

		assert.strictEqual(session.settingsEvidence?.useBuiltinPIOCore, false);
		assert.strictEqual(session.settingsEvidence?.useBuiltinPython, true);
		assert.strictEqual(session.settingsEvidence?.useDevelopmentPIOCore, false);
		assert.strictEqual(session.settingsEvidence?.customPyPiIndexUrl, 'https://pypi.example/simple');
		assert.strictEqual(session.settingsEvidence?.httpProxyConfigured, true);
		assert.strictEqual(session.settingsEvidence?.proxyStrictSsl, false);
		assert.ok(!session.settingsEvidence?.summary.includes('user:secret'), 'Proxy credentials must not appear in evidence summary');
	});

	test('splits Windows platformio-ide.customPATH entries with semicolon separators', async () => {
		const availablePaths = new Set([
			'C:\\tools\\penv\\Scripts\\pio.exe',
			'C:\\tools\\penv',
			'C:\\tools\\penv\\Scripts\\python.exe',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.callsFake(async (filePath: string) => {
			return { stdout: `${filePath} version`, stderr: '' };
		});

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: 'C:\\missing' },
			platform: 'win32',
			homeDir: 'C:\\Users\\Tester',
			now: () => now,
			localeService,
			configuration: {
				get(section: string, key: string) {
					return section === 'platformio-ide' && key === 'customPATH'
						? 'C:\\first;C:\\tools\\penv\\Scripts'
						: undefined;
				},
			},
		});

		const session = await service.collectDiagnostics('C:\\workspace\\demo');

		assert.deepStrictEqual(session.settingsEvidence?.candidatePathEntries, ['C:\\first', 'C:\\tools\\penv\\Scripts']);
		assert.strictEqual(session.items[0].resolvedPath, 'C:\\tools\\penv\\Scripts\\pio.exe');
		assert.strictEqual(session.items[0].source, 'official-platformio-custom-path');
	});

	test('reports Core usable through PLATFORMIO_CORE_DIR Python fallback when pio.exe is blocked', async () => {
		const pioPath = 'C:\\.platformio\\penv\\Scripts\\pio.exe';
		const pythonPath = 'C:\\.platformio\\penv\\Scripts\\python.exe';
		const availablePaths = new Set([
			pioPath,
			pythonPath,
			'C:\\.platformio\\penv',
		]);

		existsSyncStub.callsFake(filePath => availablePaths.has(filePath));
		execFileStub.callsFake(async (filePath: string, args: string[]) => {
			if (filePath === pioPath) {
				throw new Error('Access denied');
			}
			if (filePath === pythonPath && args.join(' ') === '-m platformio --version') {
				return { stdout: 'PlatformIO Core, version 6.1.19', stderr: '' };
			}
			return { stdout: 'Python 3.11.7', stderr: '' };
		});

		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: {
				PATH: '',
				PLATFORMIO_CORE_DIR: 'C:\\.platformio',
			},
			platform: 'win32',
			homeDir: 'C:\\Users\\佑',
			now: () => now,
			localeService,
		});

		const session = await service.collectDiagnostics('C:\\workspace\\demo');
		const pioItem = session.items[0];

		assert.strictEqual(session.overallStatus, 'degraded');
		assert.strictEqual(pioItem.status, 'ok');
		assert.strictEqual(pioItem.resolvedPath, pythonPath);
		assert.strictEqual(pioItem.versionProbe?.command, 'python.exe -m platformio --version');
		assert.ok(pioItem.versionProbe?.output?.includes('python -m platformio'));
	});

	test('reports both Core environments and workload selection without installing managed runtime', async () => {
		const managedRuntime = {
			getStatus: sinon.stub().resolves({
				status: 'ready',
				record: {
					schemaVersion: 1, runtimeVersion: 'test', artifactId: 'darwin-arm64', manifestSha256: 'a'.repeat(64),
					installedAt: now.toISOString(), versionDirectory: 'test-darwin-arm64',
					tools: {
						bootstrapPython: { relativePath: 'python/bin/python3', version: '3.11.16' },
						python: { relativePath: 'venv/bin/python', version: '3.11.16' },
						pip: { relativePath: 'venv/bin/pip', version: '26.0' },
						pio: { relativePath: 'venv/bin/pio', version: '6.1.18' },
						mpremote: { relativePath: 'venv/bin/mpremote', version: '1.28.0' },
					},
					health: { status: 'healthy', checkedAt: now.toISOString(), packageStatus: 'unknown', failureClass: null },
				},
			}),
			getStorageSummary: sinon.stub().returns('<managed-storage:123456789abc>'),
			getStorageUsageBytes: sinon.stub().resolves(4096),
		};
		const coreEnvironmentManager = {
			getSelection: sinon.stub().callsFake((workload: 'arduino' | 'python') => ({
				workload,
				primary: workload === 'arduino' ? 'provider' : 'managed',
				fallback: workload === 'arduino' ? 'managed' : 'provider',
				selected: workload === 'arduino' ? 'managed' : 'provider',
				fallbackUsed: true,
				stickyReason: 'missing-executable',
			})),
		};
		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub,
			execFile: execFileStub,
			env: { PATH: '' }, platform: 'darwin', homeDir: '/Users/tester', now: () => now, localeService,
			managedRuntime,
			coreEnvironmentManager,
		});

		const session = await service.collectDiagnostics('/workspace/demo');

		assert.strictEqual(managedRuntime.getStatus.callCount, 1);
		assert.strictEqual(session.coreDiagnostics?.environments.managed.status, 'healthy');
		assert.strictEqual(session.coreDiagnostics?.environments.managed.packageStatus, 'unknown');
		assert.strictEqual(session.coreDiagnostics?.environments.managed.storageSummary, '<managed-storage:123456789abc>');
		assert.strictEqual(session.coreDiagnostics?.environments.managed.storageUsageBytes, 4096);
		assert.strictEqual(session.coreDiagnostics?.selection.arduino.selected, 'managed');
		assert.strictEqual(session.coreDiagnostics?.selection.python.selected, 'provider');
	});

	test('reports missing and corrupt managed runtimes without starting an installer', async () => {
		for (const status of [
			{ status: 'missing' as const },
			{ status: 'invalid' as const, reason: 'record mismatch' },
		]) {
			const service = new PlatformioDiagnosticService({
				existsSync: existsSyncStub, execFile: execFileStub, env: { PATH: '' }, platform: 'darwin', homeDir: '/Users/tester',
				managedRuntime: { getStatus: sinon.stub().resolves(status), getStorageSummary: () => '<managed-storage:123456789abc>', getStorageUsageBytes: sinon.stub().resolves(0) },
			});
			const session = await service.collectDiagnostics(null);
			assert.strictEqual(
				session.coreDiagnostics?.environments.managed.status,
				status.status === 'invalid' ? 'degraded' : 'unavailable'
			);
			assert.strictEqual(session.coreDiagnostics?.environments.managed.packageStatus, 'unknown');
		}
	});

	test('clipboard summary includes only the managed storage privacy summary', async () => {
		const privatePath = '/Users/tester/Library/Application Support/managed';
		const service = new PlatformioDiagnosticService({
			existsSync: existsSyncStub, execFile: execFileStub, env: { PATH: '' }, platform: 'darwin', homeDir: '/Users/tester',
			managedRuntime: { getStatus: sinon.stub().resolves({ status: 'missing' }), getStorageSummary: () => '<managed-storage:123456789abc>', getStorageUsageBytes: sinon.stub().resolves(null) },
		});
		const session = await service.collectDiagnostics(null);
		const summary = await service.buildClipboardSummary(session);
		assert.ok(summary.plainText.includes('<managed-storage:123456789abc>'));
		assert.ok(summary.plainText.includes('Storage usage: -'));
		assert.ok(!summary.plainText.includes('Storage usage: - bytes'));
		assert.ok(!summary.plainText.includes(privatePath));
	});
});
