/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ManagedRuntimeService, ManagedRuntimeServiceError } from '../../services/managedRuntimeService';
import { ManagedRuntimeInstallerError } from '../../services/managedRuntimeInstaller';
import { ManagedRuntimeStorage } from '../../services/managedRuntimeStorage';
import { ManagedRuntimeInstallRecord, RuntimeArtifact, RuntimeManifest } from '../../types/managedRuntime';

suite('ManagedRuntime Service', () => {
	let root: string;
	let storage: ManagedRuntimeStorage;
	let artifact: RuntimeArtifact;
	let manifest: RuntimeManifest;
	let installCalls: number;
	const manifestSha256 = 'a'.repeat(64);

	setup(async () => {
		root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-service-'));
		storage = new ManagedRuntimeStorage(path.join(root, 'runtime'));
		await storage.initialize();
		artifact = {
			id: 'linux-x64', platform: 'linux', arch: 'x64', libc: 'glibc', support: 'stable',
			url: 'https://github.com/example/runtime', sha256: 'b'.repeat(64), size: 1,
			archiveFormat: 'tar.gz', pythonRelativePath: 'python/bin/python3', license: 'MIT', source: 'https://github.com/example',
		};
		manifest = {
			schemaVersion: 1, runtimeVersion: 'runtime-1', pythonVersion: '3.11.16',
			installer: { url: 'https://raw.githubusercontent.com/example/installer', sha256: 'c'.repeat(64), size: 1, license: 'Apache-2.0', source: 'https://github.com/example' },
			platformio: { channel: 'stable', testedVersionRange: '>=6.1.0 <7.0.0' },
			mpremoteVersion: '1.28.0', platformPackages: { atmelavr: 'platformio/atmelavr@5.3.0' }, artifacts: [artifact],
		};
		installCalls = 0;
	});

	teardown(() => fs.rmSync(root, { recursive: true, force: true }));

	function createRecord(versionDirectory = 'installed-v1'): ManagedRuntimeInstallRecord {
		return {
			schemaVersion: 1,
			runtimeVersion: manifest.runtimeVersion,
			artifactId: artifact.id,
			manifestSha256,
			installedAt: '2026-08-15T00:00:00.000Z',
			versionDirectory,
			tools: {
				bootstrapPython: { relativePath: 'python/bin/python3', version: 'Python 3.11.16' },
				python: { relativePath: 'core/penv/bin/python', version: 'Python 3.11.16' },
				pip: { relativePath: 'core/penv/bin/pip', version: 'pip 25' },
				pio: { relativePath: 'core/penv/bin/pio', version: 'PlatformIO Core, version 6.1.18' },
				mpremote: { relativePath: 'core/penv/bin/mpremote', version: 'mpremote 1.28.0' },
			},
			health: { status: 'healthy', checkedAt: '2026-08-15T00:00:00.000Z' },
		};
	}

	async function writeInstalledRecord(record = createRecord()): Promise<void> {
		for (const tool of Object.values(record.tools)) {
			const relative = path.join('versions', record.versionDirectory, tool.relativePath);
			await storage.files.writeFile(relative, 'tool');
		}
		await storage.files.writeFileAtomic('current.json', JSON.stringify(record));
	}

	function createService(record = createRecord()): ManagedRuntimeService {
		return new ManagedRuntimeService({
			storage,
			manifest,
			manifestSha256,
			platform: 'linux',
			arch: 'x64',
			libc: 'glibc',
			installer: {
				install: async () => {
					installCalls += 1;
					await writeInstalledRecord(record);
					return record;
				},
			},
		});
	}

	test('deduplicates concurrent first-use installation', async () => {
		const service = createService();
		const [first, second] = await Promise.all([service.ensureReady(), service.ensureReady()]);

		assert.strictEqual(first.versionDirectory, second.versionDirectory);
		assert.strictEqual(installCalls, 1);
	});

	test('shares one provisioning transaction between concurrent ensure and repair', async () => {
		const service = createService();
		const [ensured, repaired] = await Promise.all([service.ensureReady(), service.repair()]);

		assert.strictEqual(ensured.versionDirectory, repaired.versionDirectory);
		assert.strictEqual(installCalls, 1);
	});

	test('does not swallow an explicit repair behind a ready-state check', async () => {
		await writeInstalledRecord();
		const repairedRecord = createRecord('repaired-v2');
		const service = createService(repairedRecord);

		const [ensured, repaired] = await Promise.all([service.ensureReady(), service.repair()]);

		assert.strictEqual(ensured.versionDirectory, 'installed-v1');
		assert.strictEqual(repaired.versionDirectory, 'repaired-v2');
		assert.strictEqual(installCalls, 1);
	});

	test('exposes an in-flight background provisioning stage without starting another attempt', async () => {
		const record = createRecord();
		let finishInstallation: (() => void) | undefined;
		let markInstallationStarted: (() => void) | undefined;
		const installationStarted = new Promise<void>(resolve => {markInstallationStarted = resolve;});
		const service = new ManagedRuntimeService({
			storage, manifest, manifestSha256, platform: 'linux', arch: 'x64', libc: 'glibc',
			now: () => new Date('2026-08-17T04:00:00.000Z'),
			installer: {
				install: async (_artifact, options) => {
					options?.onProgress?.({ stage: 'installing-platformio', percent: 40 });
					markInstallationStarted?.();
					await new Promise<void>(resolve => {finishInstallation = resolve;});
					return record;
				},
			},
		});

		const installation = service.ensureReady({ trigger: 'activation' });
		await installationStarted;
		const running = service.getProvisioningState();
		assert.strictEqual(running.status, 'running');
		if (running.status === 'running') {
			assert.strictEqual(running.trigger, 'activation');
			assert.strictEqual(running.stage, 'installing-platformio');
			assert.strictEqual(running.percent, 40);
		}
		finishInstallation?.();
		await installation;
		assert.deepStrictEqual(service.getProvisioningState(), { status: 'idle', attempt: 1 });
	});

	test('records storage initialization failures as the first provisioning stage', async () => {
		let installerCalled = false;
		storage.initialize = async () => {
			throw Object.assign(new Error(`permission denied at ${storage.layout.root}`), { code: 'EACCES' });
		};
		const service = new ManagedRuntimeService({
			storage, manifest, manifestSha256, platform: 'linux', arch: 'x64', libc: 'glibc',
			now: () => new Date('2026-08-17T04:00:00.000Z'),
			installer: { install: async () => {installerCalled = true; return createRecord();} },
		});

		await assert.rejects(
			() => service.ensureReady({ trigger: 'editor-open' }),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError &&
				error.failureDomain === 'managed-provisioning' &&
				error.code === 'eacces' &&
				!error.message.includes(storage.layout.root)
		);

		assert.strictEqual(installerCalled, false);
		const failed = service.getProvisioningState();
		assert.strictEqual(failed.status, 'failed');
		if (failed.status === 'failed') {
			assert.strictEqual(failed.attempt, 1);
			assert.strictEqual(failed.trigger, 'editor-open');
			assert.strictEqual(failed.failure.stage, 'waiting-lock');
			assert.strictEqual(failed.failure.code, 'eacces');
			assert.ok(!failed.failure.message.includes(storage.layout.root));
		}
	});

	test('retains only privacy-redacted evidence after provisioning fails', async () => {
		const token = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD';
		const service = new ManagedRuntimeService({
			storage, manifest, manifestSha256, platform: 'linux', arch: 'x64', libc: 'glibc',
			now: () => new Date('2026-08-17T04:00:00.000Z'),
			installer: {
				install: async (_artifact, options) => {
					options?.onProgress?.({ stage: 'installing-platformio', percent: 40 });
					throw new ManagedRuntimeInstallerError(`1`, `failed under ${storage.layout.root}`, {
						stage: 'installing-platformio', started: true,
						stdout: `token=${token}`, stderr: `path=${storage.layout.root}`,
					});
				},
			},
		});

		await assert.rejects(() => service.ensureReady({ trigger: 'activation' }));
		const failed = service.getProvisioningState();
		assert.strictEqual(failed.status, 'failed');
		if (failed.status === 'failed') {
			assert.strictEqual(failed.failure.stage, 'installing-platformio');
			assert.strictEqual(failed.failure.started, true);
			assert.ok(failed.failure.stderr.includes('<managed-runtime>'));
			assert.ok(!JSON.stringify(failed).includes(storage.layout.root));
			assert.ok(!JSON.stringify(failed).includes(token));
		}
	});

	test('reuses a valid current record without any download or install', async () => {
		await writeInstalledRecord();
		const service = createService();

		const record = await service.ensureReady();

		assert.strictEqual(record.versionDirectory, 'installed-v1');
		assert.strictEqual(installCalls, 0);
	});

	test('keeps the shareable storage summary redacted while exposing the host reveal target', () => {
		const service = createService();

		assert.strictEqual(service.getStorageRoot(), storage.layout.root);
		assert.match(service.getStorageSummary(), /^<managed-storage:[a-f0-9]{12}>$/);
		assert.ok(!service.getStorageSummary().includes(storage.layout.root));
	});

	test('returns invalid rather than ready when a declared tool is missing', async () => {
		const record = createRecord();
		await writeInstalledRecord(record);
		fs.unlinkSync(path.join(storage.layout.versions, record.versionDirectory, record.tools.mpremote.relativePath));
		const status = await createService().getStatus();

		assert.strictEqual(status.status, 'invalid');
	});

	test('does not trust a ready record when the root ownership marker is missing', async () => {
		await writeInstalledRecord();
		fs.unlinkSync(path.join(storage.layout.root, '.singular-managed-runtime-root.json'));

		assert.strictEqual((await createService().getStatus()).status, 'invalid');
	});

	test('accepts only managed-root-contained tool symlinks', async function () {
		if (process.platform === 'win32') {this.skip();}
		const record = createRecord();
		await writeInstalledRecord(record);
		const pythonRelative = path.join('versions', record.versionDirectory, record.tools.python.relativePath);
		const pythonPath = storage.files.resolveSafePath(pythonRelative);
		const containedTarget = path.join(path.dirname(pythonPath), 'python3.11');
		fs.writeFileSync(containedTarget, 'python');
		fs.unlinkSync(pythonPath);
		fs.symlinkSync('python3.11', pythonPath);

		const service = createService();
		assert.strictEqual((await service.getStatus()).status, 'ready');
		assert.strictEqual((await service.getCoreEnvironment('file:///workspace')).pythonPath, pythonPath);

		const outsideTarget = path.join(root, 'outside-python');
		fs.writeFileSync(outsideTarget, 'outside');
		fs.unlinkSync(pythonPath);
		fs.symlinkSync(outsideTarget, pythonPath);
		assert.strictEqual((await service.getStatus()).status, 'invalid');
	});

	test('builds isolated PlatformIO environment variables per workspace without shadow project', async () => {
		await writeInstalledRecord();
		const service = createService();
		const environment = await service.getCoreEnvironment('file:///workspace/學生 專案');

		assert.strictEqual(environment.id, 'managed');
		assert.strictEqual(environment.invocation.command, environment.pythonPath);
		assert.deepStrictEqual(environment.invocation.prefixArgs, ['-m', 'platformio']);
		assert.ok(environment.invocation.env.PLATFORMIO_BUILD_DIR?.startsWith(storage.layout.workspaces));
		assert.ok(!environment.invocation.env.PLATFORMIO_BUILD_DIR?.includes('學生'));
		assert.strictEqual(environment.invocation.env.PLATFORMIO_SETTING_ENABLE_TELEMETRY, 'No');
	});

	test('rejects unsupported or unverified targets before installation', async () => {
		const service = new ManagedRuntimeService({
			storage, manifest, manifestSha256, platform: 'linux', arch: 'arm64', libc: 'glibc',
			installer: { install: async () => {throw new Error('must not install');} },
		});

		await assert.rejects(
			() => service.ensureReady(),
			(error: unknown) => error instanceof ManagedRuntimeServiceError && error.code === 'unsupported-runtime'
		);
	});

	test('requires an explicit policy opt-in before using a release-candidate artifact', async () => {
		manifest = {
			...manifest,
			artifacts: [{ ...artifact, support: 'release-candidate' }],
		};
		const guarded = createService();
		assert.strictEqual((await guarded.getStatus()).status, 'unsupported');

		const enabled = new ManagedRuntimeService({
			storage,
			manifest,
			manifestSha256,
			platform: 'linux',
			arch: 'x64',
			libc: 'glibc',
			allowReleaseCandidate: true,
			installer: {
				install: async () => {
					installCalls += 1;
					const record = createRecord();
					await writeInstalledRecord(record);
					return record;
				},
			},
		});
		assert.strictEqual((await enabled.ensureReady()).artifactId, artifact.id);
		assert.strictEqual(installCalls, 1);
	});

	test('repair creates a new transaction even when current is healthy', async () => {
		await writeInstalledRecord();
		const repaired = createRecord('repaired-v2');
		const service = createService(repaired);

		const result = await service.repair();

		assert.strictEqual(result.versionDirectory, 'repaired-v2');
		assert.strictEqual(installCalls, 1);
	});

	test('repair claims and validates an empty root before invoking the installer', async () => {
		const freshRoot = path.join(root, 'fresh-repair-root');
		const freshStorage = new ManagedRuntimeStorage(freshRoot);
		const repaired = createRecord('fresh-repair');
		const service = new ManagedRuntimeService({
			storage: freshStorage,
			manifest,
			manifestSha256,
			platform: 'linux',
			arch: 'x64',
			libc: 'glibc',
			installer: { install: async () => repaired },
		});

		assert.strictEqual((await service.repair()).versionDirectory, 'fresh-repair');
		assert.strictEqual(await freshStorage.isOwnedRoot(), true);
	});
});
