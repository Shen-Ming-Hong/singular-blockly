/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ManagedRuntimeStorage, createWorkspaceStorageKey } from '../../services/managedRuntimeStorage';

suite('ManagedRuntime cross-platform path matrix', () => {
	const roots: string[] = [];

	teardown(() => {
		for (const root of roots.splice(0)) {fs.rmSync(root, { recursive: true, force: true });}
	});

	for (const label of [
		'中文 路徑',
		'special []()@#$!',
		'emoji-🚀-runtime',
		'Cafe\u0301-normalized',
		`long-${'segment123-'.repeat(12)}`,
	]) {
		test(`atomically writes and reopens state under ${label}`, async () => {
			const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-path-matrix-'));
			roots.push(parent);
			const storage = new ManagedRuntimeStorage(path.join(parent, label));
			await storage.initialize();
			await storage.files.writeFileAtomic('current.json', JSON.stringify({ ready: true }));
			assert.deepStrictEqual(JSON.parse(await storage.files.readFile('current.json')), { ready: true });
			assert.ok(storage.workspaceRoot(`file:///${label}`).startsWith(storage.layout.workspaces));
		});
	}

	test('normalizes composed and decomposed workspace URIs to one storage key', () => {
		assert.strictEqual(createWorkspaceStorageKey('file:///Café'), createWorkspaceStorageKey('file:///Cafe\u0301'));
	});

	test('surfaces a real read-only root before creating a ready record', async function () {
		if (process.platform === 'win32' || typeof process.getuid !== 'function' || process.getuid() === 0) {this.skip();}
		const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-readonly-'));
		roots.push(parent);
		const readOnly = path.join(parent, 'root');
		fs.mkdirSync(readOnly);
		fs.chmodSync(readOnly, 0o555);
		try {
			await assert.rejects(() => new ManagedRuntimeStorage(readOnly).initialize(), error =>
				(error as NodeJS.ErrnoException).code === 'EACCES' || (error as NodeJS.ErrnoException).code === 'EPERM');
			assert.strictEqual(fs.existsSync(path.join(readOnly, 'current.json')), false);
		} finally {
			fs.chmodSync(readOnly, 0o755);
		}
	});
});
