/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as tar from 'tar';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { ManagedRuntimeStorage } from '../../services/managedRuntimeStorage';
import {
	ManagedRuntimeInstaller,
	ManagedRuntimeInstallerError,
	ManagedRuntimeInstallerOptions,
	assertWindowsManagedRuntimePathBudget,
} from '../../services/managedRuntimeInstaller';
import { PlatformioProcessError, PlatformioProcessResult } from '../../services/platformioProcess';
import { RuntimeArtifact, RuntimeManifest } from '../../types/managedRuntime';
import { sha256 } from '../../services/managedRuntimeManifest';

suite('ManagedRuntime Installer', () => {
	let root: string;
	let archivePath: string;
	let archiveBytes: Buffer;
	let manifest: RuntimeManifest;
	let artifact: RuntimeArtifact;
	let storage: ManagedRuntimeStorage;
	let processCalls: Array<{ command: string; args: readonly string[] }>;
	let installerTempPaths: string[];

	setup(async () => {
		root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-installer-'));
		const source = path.join(root, 'fixture');
		fs.mkdirSync(path.join(source, 'python', 'bin'), { recursive: true });
		fs.writeFileSync(path.join(source, 'python', 'bin', 'python3'), '#!/bin/sh\n');
		archivePath = path.join(root, 'fixture.tar.gz');
		await tar.create({ cwd: source, file: archivePath, gzip: true, portable: true }, ['python']);
		archiveBytes = fs.readFileSync(archivePath);
		artifact = {
			id: 'fake-linux-x64',
			platform: 'linux',
			arch: 'x64',
			libc: 'glibc',
			support: 'stable',
			url: 'https://github.com/example/fake.tar.gz',
			sha256: sha256(archiveBytes),
			size: archiveBytes.length,
			archiveFormat: 'tar.gz',
			pythonRelativePath: 'python/bin/python3',
			license: 'MIT',
			source: 'https://github.com/example/release',
		};
		const installerBytes = Buffer.from('# installer');
		manifest = {
			schemaVersion: 1,
			runtimeVersion: 'test-1',
			pythonVersion: '3.11.16',
			installer: {
				url: 'https://raw.githubusercontent.com/example/get-platformio.py',
				sha256: sha256(installerBytes),
				size: installerBytes.length,
				license: 'Apache-2.0',
				source: 'https://github.com/example/installer',
			},
			platformio: { channel: 'stable', testedVersionRange: '>=6.1.0 <7.0.0' },
			mpremoteVersion: '1.28.0',
			platformPackages: { atmelavr: 'platformio/atmelavr@5.3.0' },
			artifacts: [artifact],
		};
		storage = new ManagedRuntimeStorage(path.join(root, '環境 🚀'));
		await storage.initialize();
		processCalls = [];
		installerTempPaths = [];
	});

	teardown(() => fs.rmSync(root, { recursive: true, force: true }));

	function createOptions(overrides: Partial<ManagedRuntimeInstallerOptions> = {}): ManagedRuntimeInstallerOptions {
		return {
			storage,
			manifest,
			manifestSha256: sha256(JSON.stringify(manifest)),
			downloader: {
				download: async (download, destination) => {
					const bytes = download.sha256 === artifact.sha256 ? archiveBytes : Buffer.from('# installer');
					await storage.files.writeFileAtomic(destination, bytes);
					return { relativePath: destination, sha256: download.sha256, size: bytes.length };
				},
			},
			runProcess: async (command, args, options) => {
				processCalls.push({ command, args });
				if (args.length === 1 && args[0].endsWith('.py')) {
					const coreRoot = options.env?.PLATFORMIO_CORE_DIR;
					const installerTemp = options.env?.PLATFORMIO_INSTALLER_TMPDIR;
					const constraintPath = options.env?.PIP_CONSTRAINT;
					assert.ok(coreRoot);
					assert.ok(installerTemp && fs.statSync(installerTemp).isDirectory());
					installerTempPaths.push(installerTemp!);
					assert.ok(constraintPath);
					assert.strictEqual(
						fs.readFileSync(fileURLToPath(constraintPath!), 'utf8'),
						'platformio>=6.1.0,<7.0.0\n'
					);
					assert.ok(coreRoot?.includes(`${path.sep}versions${path.sep}`));
					assert.ok(!coreRoot?.includes(`${path.sep}staging${path.sep}`));
					const bin = path.join(coreRoot!, 'penv', 'bin');
					fs.mkdirSync(bin, { recursive: true });
					for (const name of ['python', 'pip', 'pio', 'mpremote']) {
						fs.writeFileSync(path.join(bin, name), name);
					}
				}
				let stdout = 'ok';
				if (args.includes('--version')) {stdout = args.includes('pip') ? 'pip 25.0' : 'PlatformIO Core, version 6.1.18';}
				if (args.includes('version')) {stdout = 'mpremote 1.28.0';}
				return { started: true, exitCode: 0, signal: null, stdout, stderr: '' } satisfies PlatformioProcessResult;
			},
			now: () => new Date('2026-08-15T00:00:00.000Z'),
			createId: () => 'transaction-id',
			...overrides,
		};
	}

	test('commits a healthy immutable version and writes current.json last', async () => {
		const record = await new ManagedRuntimeInstaller(createOptions()).install(artifact);

		assert.strictEqual(record.health.status, 'healthy');
		assert.strictEqual(record.artifactId, artifact.id);
		assert.strictEqual(record.versionDirectory, 'transaction-id', 'Immutable version directories should not repeat long manifest identifiers');
		assert.ok(fs.existsSync(path.join(storage.layout.versions, record.versionDirectory, record.tools.pio.relativePath)));
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(storage.layout.currentRecord, 'utf8')), record);
		assert.ok(processCalls.some(call => call.args.includes(`mpremote==${manifest.mpremoteVersion}`)));
		assert.ok(processCalls.some(call => call.args.includes('--json-output')));
		assert.ok(!fs.existsSync(path.join(storage.layout.staging, 'transaction-id')));
		assert.ok(installerTempPaths.every(installerTemp => !installerTemp.includes(storage.layout.root)));
		assert.ok(installerTempPaths.every(installerTemp => !fs.existsSync(installerTemp)));
	});

	test('rejects a Windows runtime root that cannot leave sufficient descendant path headroom', () => {
		const runtimePath = `C:\\Users\\student\\${'deep-folder\\'.repeat(12)}versions\\transaction-id`;
		assert.throws(
			() => assertWindowsManagedRuntimePathBudget(
				runtimePath,
				'C:\\Users\\student\\AppData\\Local\\Temp\\singular-blockly\\core-installer\\0123456789abcdef0123',
				'win32'
			),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError && error.code === 'path-too-long'
		);
	});

	test('accepts the default Windows global-storage shape with the short installer temp root', () => {
		assert.doesNotThrow(() => assertWindowsManagedRuntimePathBudget(
			'C:\\Users\\student\\AppData\\Roaming\\Code\\User\\globalStorage\\singular-ray.singular-blockly\\runtime-v1\\versions\\01234567-89ab-cdef-0123-456789abcdef',
			'C:\\Users\\student\\AppData\\Local\\Temp\\singular-blockly\\core-installer\\0123456789abcdef0123',
			'win32'
		));
	});

	test('does not claim or delete a pre-existing installer temp directory', async () => {
		const installerTempRoot = path.join(root, 'installer-temp');
		const leaf = createHash('sha256')
			.update(`${storage.layout.root}\0transaction-id`)
			.digest('hex')
			.slice(0, 20);
		const collisionDirectory = path.join(installerTempRoot, 'singular-blockly', 'core-installer', leaf);
		fs.mkdirSync(collisionDirectory, { recursive: true });
		fs.writeFileSync(path.join(collisionDirectory, 'unknown-user-file.txt'), 'preserve me');

		await assert.rejects(
			() => new ManagedRuntimeInstaller(createOptions({ installerTempRoot })).install(artifact),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError &&
				error.code === 'installer-temp-collision'
		);
		assert.strictEqual(
			fs.readFileSync(path.join(collisionDirectory, 'unknown-user-file.txt'), 'utf8'),
			'preserve me'
		);
	});

	test('adopts a runtime completed by another window after acquiring the install lock', async () => {
		const existing = {
			schemaVersion: 1 as const,
			runtimeVersion: manifest.runtimeVersion,
			artifactId: artifact.id,
			manifestSha256: sha256(JSON.stringify(manifest)),
			installedAt: '2026-08-17T00:00:00.000Z',
			versionDirectory: 'other-window',
			tools: {} as any,
			health: { status: 'healthy' as const, checkedAt: '2026-08-17T00:00:00.000Z' },
		};
		const adoptExisting = async () => existing;

		const result = await new ManagedRuntimeInstaller(createOptions()).install(artifact, { adoptExisting });

		assert.strictEqual(result, existing);
		assert.strictEqual(processCalls.length, 0);
		assert.strictEqual(fs.existsSync(path.join(storage.layout.staging, 'transaction-id')), false);
	});

	test('retains the previous current record when an update probe fails', async () => {
		const first = await new ManagedRuntimeInstaller(createOptions()).install(artifact);
		const failing = createOptions({
			createId: () => 'failed-update',
			runProcess: async () => {
				throw new PlatformioProcessError('probe failed', true, 1, '', 'broken local store');
			},
		});

		await assert.rejects(() => new ManagedRuntimeInstaller(failing).install(artifact), ManagedRuntimeInstallerError);
		assert.strictEqual(JSON.parse(fs.readFileSync(storage.layout.currentRecord, 'utf8')).versionDirectory, first.versionDirectory);
		assert.ok(!fs.existsSync(path.join(storage.layout.staging, 'failed-update')));
	});

	test('preserves redacted subprocess evidence and the failing installer stage', async () => {
		const token = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD';
		const options = createOptions({
			runProcess: async () => {
				throw new PlatformioProcessError(
					`installer failed under ${storage.layout.root}`,
					true,
					1,
					`stdout token=${token}`,
					`stderr path=${storage.layout.root}`
				);
			},
		});

		await assert.rejects(
			() => new ManagedRuntimeInstaller(options).install(artifact),
			(error: unknown) => {
				if (!(error instanceof ManagedRuntimeInstallerError)) {return false;}
				assert.strictEqual(error.failureDomain, 'managed-provisioning');
				assert.strictEqual(error.stage, 'installing-platformio');
				assert.strictEqual(error.started, true);
				assert.strictEqual(error.code, '1');
				assert.ok(error.stderr.includes('<managed-runtime>'));
				assert.ok(!`${error.message}\n${error.stdout}\n${error.stderr}`.includes(storage.layout.root));
				assert.ok(!error.stdout.includes(token));
				return true;
			}
		);
	});

	test('classifies the PlatformIO Windows long-path hint as path-too-long', async () => {
		const windowsArtifact = { ...artifact, platform: 'win32' as const };
		const options = createOptions({
			runProcess: async () => {
				throw new PlatformioProcessError(
					'installer failed',
					true,
					1,
					'',
					'This error might have occurred since this system does not have Windows Long Path support enabled.'
				);
			},
		});

		await assert.rejects(
			() => new ManagedRuntimeInstaller(options).install(windowsArtifact),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError && error.code === 'path-too-long'
		);
	});

	test('does not create a ready record after ENOSPC', async () => {
		const options = createOptions({
			downloader: {
				download: async () => {
					const error = new Error('disk full') as NodeJS.ErrnoException;
					error.code = 'ENOSPC';
					throw error;
				},
			},
		});

		await assert.rejects(() => new ManagedRuntimeInstaller(options).install(artifact), ManagedRuntimeInstallerError);
		assert.ok(!fs.existsSync(storage.layout.currentRecord));
	});

	test('rejects a PlatformIO version outside the packaged tested range', async () => {
		const options = createOptions();
		const normalRunProcess = options.runProcess!;
		options.runProcess = async (command, args, processOptions) => {
			const result = await normalRunProcess(command, args, processOptions);
			return args.includes('platformio') && args.includes('--version')
				? { ...result, stdout: 'PlatformIO Core, version 7.0.0' }
				: result;
		};

		await assert.rejects(
			() => new ManagedRuntimeInstaller(options).install(artifact),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError && error.code === 'platformio-version-unsupported'
		);
		assert.strictEqual(fs.existsSync(storage.layout.currentRecord), false);
	});

	test('refuses a second active lock without deleting it', async () => {
		await storage.files.writeFileAtomic('locks/install.lock', JSON.stringify({
			schemaVersion: 1,
			ownerId: 'other-window',
			pid: 1234,
			createdAt: '2026-08-15T00:00:00.000Z',
			leaseUntil: '2099-01-01T00:00:00.000Z',
		}));
		const options = createOptions({ lockWaitMs: 0 });

		await assert.rejects(
			() => new ManagedRuntimeInstaller(options).install(artifact),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError && error.code === 'install-locked'
		);
		assert.ok(fs.existsSync(storage.layout.installLock));
	});

	test('reclaims an expired valid lock before starting a new transaction', async () => {
		await storage.files.writeFileAtomic('locks/install.lock', JSON.stringify({
			schemaVersion: 1,
			ownerId: 'stale-window',
			pid: 999_999_999,
			createdAt: '2025-08-15T00:00:00.000Z',
			leaseUntil: '2025-08-15T00:02:00.000Z',
		}));

		const record = await new ManagedRuntimeInstaller(createOptions()).install(artifact);

		assert.strictEqual(record.health.status, 'healthy');
		assert.strictEqual(fs.existsSync(storage.layout.installLock), false);
	});

	test('does not reclaim an expired lock while its owner process is still alive', async () => {
		await storage.files.writeFileAtomic('locks/install.lock', JSON.stringify({
			schemaVersion: 1,
			ownerId: 'live-window',
			pid: process.pid,
			createdAt: '2025-08-15T00:00:00.000Z',
			leaseUntil: '2025-08-15T00:02:00.000Z',
		}));

		await assert.rejects(
			() => new ManagedRuntimeInstaller(createOptions({ lockWaitMs: 0 })).install(artifact),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError && error.code === 'install-locked'
		);
		assert.strictEqual(JSON.parse(fs.readFileSync(storage.layout.installLock, 'utf8')).ownerId, 'live-window');
	});

	test('fails closed when another process owns stale-lock recovery', async () => {
		await storage.files.writeFileAtomic('locks/install.reclaim.lock', JSON.stringify({
			schemaVersion: 1,
			ownerId: 'other-reclaimer',
			pid: process.pid,
			createdAt: '2026-08-15T00:00:00.000Z',
			leaseUntil: '2099-08-15T00:00:30.000Z',
		}));

		await assert.rejects(
			() => new ManagedRuntimeInstaller(createOptions({ lockWaitMs: 0 })).install(artifact),
			(error: unknown) => error instanceof ManagedRuntimeInstallerError && error.code === 'install-locked'
		);
		assert.strictEqual(fs.existsSync(path.join(storage.layout.root, 'locks', 'install.reclaim.lock')), true);
	});

	test('reclaims an expired recovery guard after its owner process exits', async () => {
		await storage.files.writeFileAtomic('locks/install.reclaim.lock', JSON.stringify({
			schemaVersion: 1,
			ownerId: 'crashed-reclaimer',
			pid: 999_999_999,
			createdAt: '2025-08-15T00:00:00.000Z',
			leaseUntil: '2025-08-15T00:00:30.000Z',
		}));

		const record = await new ManagedRuntimeInstaller(createOptions()).install(artifact);

		assert.strictEqual(record.health.status, 'healthy');
		assert.strictEqual(fs.existsSync(path.join(storage.layout.root, 'locks', 'install.reclaim.lock')), false);
	});
});
