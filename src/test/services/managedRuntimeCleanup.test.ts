/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ManagedRuntimeService } from '../../services/managedRuntimeService';
import { ManagedRuntimeStorage } from '../../services/managedRuntimeStorage';
import { RuntimeManifest } from '../../types/managedRuntime';

suite('ManagedRuntime cleanup ownership', () => {
	let parent: string;
	let storage: ManagedRuntimeStorage;
	let service: ManagedRuntimeService;

	setup(async () => {
		parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-cleanup-'));
		storage = new ManagedRuntimeStorage(path.join(parent, 'managed'));
		await storage.initialize();
		const manifest: RuntimeManifest = {
			schemaVersion: 1,
			runtimeVersion: 'test-1',
			pythonVersion: '3.11.16',
			installer: { url: 'https://raw.githubusercontent.com/a/b', sha256: 'a'.repeat(64), size: 1, license: 'MIT', source: 'source' },
			platformio: { channel: 'stable', testedVersionRange: '>=6 <7' },
			mpremoteVersion: '1.28.0',
			platformPackages: { atmelavr: 'platformio/atmelavr@5.3.0' },
			artifacts: [{
				id: 'linux-x64', platform: 'linux', arch: 'x64', libc: 'glibc', support: 'stable', archiveFormat: 'tar.gz',
				pythonRelativePath: 'python/bin/python3', url: 'https://github.com/a/b', sha256: 'b'.repeat(64), size: 1,
				license: 'MIT', source: 'source',
			}],
		};
		service = new ManagedRuntimeService({
			storage,
			manifest,
			manifestSha256: 'c'.repeat(64),
			installer: { install: async () => {throw new Error('not used');} },
			platform: 'linux', arch: 'x64', libc: 'glibc',
		});
	});

	teardown(() => fs.rmSync(parent, { recursive: true, force: true }));

	test('removes only manifest downloads and marker-owned stale versions', async () => {
		await storage.files.writeFileAtomic(path.join('downloads', `${'a'.repeat(64)}.py`), 'installer');
		await storage.files.writeFileAtomic(path.join('downloads', `${'d'.repeat(64)}.py`), 'unknown');
		await storage.files.createDirectory(path.join('versions', 'owned-old'));
		await storage.files.writeJsonFile(path.join('versions', 'owned-old', '.singular-runtime-owned.json'), {
			schemaVersion: 1, runtimeVersion: 'old', artifactId: 'linux-x64',
		});
		await storage.files.createDirectory(path.join('versions', 'unknown-user-folder'));
		await storage.files.writeFile('versions/unknown-user-folder/keep.txt', 'keep');

		const result = await service.cleanup();

		assert.deepStrictEqual(result, { downloads: 1, staging: 0, versions: 1 });
		assert.strictEqual(fs.existsSync(path.join(storage.layout.downloads, `${'d'.repeat(64)}.py`)), true);
		assert.strictEqual(fs.existsSync(path.join(storage.layout.versions, 'unknown-user-folder', 'keep.txt')), true);
	});

	test('removes only marker-owned staging transactions and their candidate versions', async () => {
		const ownedTransaction = '11111111-1111-4111-8111-111111111111';
		const unknownTransaction = '22222222-2222-4222-8222-222222222222';
		await storage.files.createDirectory(path.join('staging', ownedTransaction));
		await storage.files.writeJsonFile(path.join('staging', ownedTransaction, 'transaction.json'), {
			schemaVersion: 1,
			versionDirectory: 'candidate-version',
			createdAt: '2026-08-16T00:00:00.000Z',
		});
		await storage.files.createDirectory(path.join('versions', 'candidate-version'));
		await storage.files.writeFile(path.join('versions', 'candidate-version', 'partial.txt'), 'partial');
		await storage.files.createDirectory(path.join('staging', unknownTransaction));
		await storage.files.writeFile(path.join('staging', unknownTransaction, 'keep.txt'), 'keep');

		const result = await service.cleanup();

		assert.deepStrictEqual(result, { downloads: 0, staging: 1, versions: 1 });
		assert.strictEqual(fs.existsSync(path.join(storage.layout.staging, unknownTransaction, 'keep.txt')), true);
	});

	test('does no cleanup while an installation lock is active', async () => {
		await storage.files.writeFileAtomic(path.join('downloads', `${'a'.repeat(64)}.py`), 'installer');
		await storage.files.writeFileAtomic('locks/install.lock', JSON.stringify({
			schemaVersion: 1,
			ownerId: 'active-installer',
			pid: 1234,
			createdAt: '2026-08-16T00:00:00.000Z',
			leaseUntil: '2099-01-01T00:00:00.000Z',
		}));

		await assert.rejects(
			() => service.cleanup(),
			(error: unknown) => error instanceof Error && 'code' in error && error.code === 'install-locked'
		);
		assert.strictEqual(fs.existsSync(path.join(storage.layout.downloads, `${'a'.repeat(64)}.py`)), true);
		assert.strictEqual(fs.existsSync(storage.layout.installLock), true);
	});

	test('never touches provider or project directories outside managed storage', async () => {
		const provider = path.join(parent, '.platformio', 'penv', 'keep.txt');
		const project = path.join(parent, 'project', 'platformio.ini');
		fs.mkdirSync(path.dirname(provider), { recursive: true });
		fs.mkdirSync(path.dirname(project), { recursive: true });
		fs.writeFileSync(provider, 'provider');
		fs.writeFileSync(project, 'project');

		await service.cleanup();

		assert.strictEqual(fs.readFileSync(provider, 'utf8'), 'provider');
		assert.strictEqual(fs.readFileSync(project, 'utf8'), 'project');
	});

	test('returns a stable privacy summary instead of the storage path', () => {
		const summary = service.getStorageSummary();
		assert.match(summary, /^<managed-storage:[a-f0-9]{12}>$/);
		assert.ok(!summary.includes(parent));
	});

	test('reports owned storage usage without exposing the root path', async () => {
		const baseline = await service.getStorageUsageBytes();
		await storage.files.writeFileAtomic('downloads/usage.py', '12345');

		assert.strictEqual(await service.getStorageUsageBytes(), (baseline ?? 0) + 5);
	});
});
