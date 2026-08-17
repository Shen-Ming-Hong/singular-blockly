/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
	ManagedRuntimeStorage,
	ManagedRuntimeStorageError,
	assertManagedDescendant,
	createManagedRuntimeLayout,
	createWorkspaceStorageKey,
	resolveManagedRuntimeRoot,
} from '../../services/managedRuntimeStorage';

suite('ManagedRuntime Storage', () => {
	const temporaryRoots: string[] = [];

	teardown(() => {
		for (const root of temporaryRoots.splice(0)) {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	test('uses global storage by default and accepts Unicode local paths', () => {
		assert.strictEqual(resolveManagedRuntimeRoot('/Users/學生/Library/storage', undefined, 'darwin'), '/Users/學生/Library/storage/runtime-v1');
		assert.strictEqual(resolveManagedRuntimeRoot('/unused', '/Volumes/工具 環境/🚀', 'darwin'), '/Volumes/工具 環境/🚀');
	});

	test('rejects relative, root, and Windows network paths before writing', () => {
		assert.throws(() => resolveManagedRuntimeRoot('/storage', 'relative/path', 'linux'), ManagedRuntimeStorageError);
		assert.throws(() => resolveManagedRuntimeRoot('/storage', '/', 'linux'), ManagedRuntimeStorageError);
		assert.throws(() => resolveManagedRuntimeRoot('C:\\storage', '\\\\server\\share\\runtime', 'win32'), (error: unknown) =>
			error instanceof ManagedRuntimeStorageError && error.code === 'network-path-not-supported');
	});

	test('creates stable workspace hashes without embedding the original path', () => {
		const nfc = 'file:///Users/student/專案-é'.normalize('NFC');
		const nfd = 'file:///Users/student/專案-é'.normalize('NFD');
		const key = createWorkspaceStorageKey(nfc);
		assert.strictEqual(key, createWorkspaceStorageKey(nfd));
		assert.match(key, /^[a-f0-9]{64}$/);
		assert.ok(!key.includes('student'));
	});

	test('only accepts strict descendants for managed cleanup', () => {
		assert.strictEqual(assertManagedDescendant('/runtime', '/runtime/versions/v1', 'linux'), '/runtime/versions/v1');
		assert.throws(() => assertManagedDescendant('/runtime', '/runtime', 'linux'), ManagedRuntimeStorageError);
		assert.throws(() => assertManagedDescendant('/runtime', '/runtime-other/file', 'linux'), ManagedRuntimeStorageError);
	});

	test('initializes the owned layout and proves it is writable', async () => {
		const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-runtime-學生 '));
		temporaryRoots.push(root);
		const storage = new ManagedRuntimeStorage(path.join(root, '環境 🚀'));
		await storage.initialize();

		const layout = createManagedRuntimeLayout(path.join(root, '環境 🚀'));
		for (const directory of [layout.downloads, layout.staging, layout.versions, layout.workspaces]) {
			assert.ok(fs.statSync(directory).isDirectory());
		}
		assert.deepStrictEqual(
			JSON.parse(fs.readFileSync(path.join(layout.root, '.singular-managed-runtime-root.json'), 'utf8')),
			{ schemaVersion: 1, owner: 'singular-blockly-managed-runtime' }
		);
		assert.strictEqual(await storage.isOwnedRoot(), true);
		await storage.initialize();
		assert.ok(storage.workspaceRoot('file:///tmp/學生 專案').startsWith(layout.workspaces));
	});

	test('reports an absent or malformed root marker as unowned without creating it', async () => {
		const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-runtime-status-'));
		temporaryRoots.push(root);
		const storage = new ManagedRuntimeStorage(root);
		assert.strictEqual(await storage.isOwnedRoot(), false);
		assert.strictEqual(fs.existsSync(path.join(root, '.singular-managed-runtime-root.json')), false);
		fs.writeFileSync(path.join(root, '.singular-managed-runtime-root.json'), 'not-json');
		assert.strictEqual(await storage.isOwnedRoot(), false);
	});

	test('refuses to claim a non-empty custom root and preserves its contents', async () => {
		const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-runtime-unowned-'));
		temporaryRoots.push(root);
		fs.writeFileSync(path.join(root, 'keep.txt'), 'user content');

		await assert.rejects(
			() => new ManagedRuntimeStorage(root).initialize(),
			(error: unknown) => error instanceof ManagedRuntimeStorageError && error.code === 'unowned-root-not-empty'
		);
		assert.strictEqual(fs.readFileSync(path.join(root, 'keep.txt'), 'utf8'), 'user content');
	});

	test('checks ownership before running a writable probe in an unowned non-empty root', async () => {
		const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-runtime-probe-order-'));
		temporaryRoots.push(root);
		fs.writeFileSync(path.join(root, 'keep.txt'), 'user content');
		const storage = new ManagedRuntimeStorage(root);
		let probed = false;
		storage.files.validateWritableRoot = async () => {probed = true;};

		await assert.rejects(() => storage.initialize(), ManagedRuntimeStorageError);

		assert.strictEqual(probed, false);
	});

	test('rejects an invalid ownership marker without creating managed directories', async () => {
		const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-runtime-owner-'));
		temporaryRoots.push(root);
		fs.writeFileSync(path.join(root, '.singular-managed-runtime-root.json'), '{"owner":"someone-else"}');

		await assert.rejects(
			() => new ManagedRuntimeStorage(root).initialize(),
			(error: unknown) => error instanceof ManagedRuntimeStorageError && error.code === 'invalid-root-owner'
		);
		assert.strictEqual(fs.existsSync(path.join(root, 'versions')), false);
	});

	test('rejects an existing symbolic-link path segment', async function () {
		if (process.platform === 'win32') {this.skip();}
		const temporaryRoot = fs.realpathSync(os.tmpdir());
		const root = fs.mkdtempSync(path.join(temporaryRoot, 'managed-runtime-link-'));
		const outside = fs.mkdtempSync(path.join(temporaryRoot, 'managed-runtime-outside-'));
		temporaryRoots.push(root, outside);
		const linked = path.join(root, 'linked');
		fs.symlinkSync(outside, linked, 'dir');

		await assert.rejects(() => new ManagedRuntimeStorage(path.join(linked, 'runtime')).initialize(), /symbolic-link/i);
		assert.deepStrictEqual(fs.readdirSync(outside), [], 'symlink target must remain untouched');
	});
});
