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
import {
	ManagedRuntimeArchiveError,
	extractManagedRuntimeArchive,
	validateRuntimeArchiveEntry,
} from '../../services/managedRuntimeArchive';

suite('ManagedRuntime Archive', () => {
	let root: string;

	setup(() => {
		root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-archive-'));
	});

	teardown(() => fs.rmSync(root, { recursive: true, force: true }));

	test('extracts regular Unicode files into a new staging directory', async () => {
		const source = path.join(root, 'source');
		fs.mkdirSync(path.join(source, 'python', 'bin'), { recursive: true });
		fs.writeFileSync(path.join(source, 'python', 'bin', '學生 python3'), 'runtime');
		const archive = path.join(root, 'runtime.tar.gz');
		await tar.create({ cwd: source, file: archive, gzip: true, portable: true }, ['python']);
		const destination = path.join(root, 'staging', '環境 🚀');

		const result = await extractManagedRuntimeArchive(archive, destination);

		assert.ok(result.entryCount >= 3);
		assert.strictEqual(fs.readFileSync(path.join(destination, 'python', 'bin', '學生 python3'), 'utf8'), 'runtime');
	});

	test('rejects traversal, absolute paths, control characters, and unsafe links', () => {
		for (const entryPath of ['../escape', '/absolute', 'C:\\absolute', 'safe/../escape', 'bad\0name']) {
			assert.throws(() => validateRuntimeArchiveEntry(entryPath, 'File', 1), ManagedRuntimeArchiveError);
		}
		assert.strictEqual(validateRuntimeArchiveEntry('python/bin/python3', 'SymbolicLink', 0, 'python3.11'), 'python/bin/python3');
		assert.throws(() => validateRuntimeArchiveEntry('python/link', 'SymbolicLink', 0, '../../escape'), ManagedRuntimeArchiveError);
		assert.throws(() => validateRuntimeArchiveEntry('python/hard', 'Link', 0), ManagedRuntimeArchiveError);
	});

	test('rejects an escaping symbolic link before extracting files', async function () {
		if (process.platform === 'win32') {this.skip();}
		const source = path.join(root, 'source');
		fs.mkdirSync(path.join(source, 'python'), { recursive: true });
		fs.symlinkSync('/tmp', path.join(source, 'python', 'link'));
		const archive = path.join(root, 'linked.tar.gz');
		await tar.create({ cwd: source, file: archive, gzip: true, portable: true }, ['python']);
		const destination = path.join(root, 'destination');

		await assert.rejects(
			() => extractManagedRuntimeArchive(archive, destination),
			(error: unknown) => error instanceof ManagedRuntimeArchiveError && error.code === 'unsafe-link-target'
		);
		assert.ok(!fs.existsSync(destination));
	});

	test('validates and omits an archive-internal alias symbolic link', async function () {
		if (process.platform === 'win32') {this.skip();}
		const source = path.join(root, 'source');
		fs.mkdirSync(path.join(source, 'python', 'bin'), { recursive: true });
		fs.writeFileSync(path.join(source, 'python', 'bin', 'python3.11'), 'runtime');
		fs.symlinkSync('python3.11', path.join(source, 'python', 'bin', 'python3'));
		const archive = path.join(root, 'linked.tar.gz');
		await tar.create({ cwd: source, file: archive, gzip: true, portable: true }, ['python']);
		const destination = path.join(root, 'destination');

		await extractManagedRuntimeArchive(archive, destination);

		assert.strictEqual(fs.readFileSync(path.join(destination, 'python', 'bin', 'python3.11'), 'utf8'), 'runtime');
		assert.ok(!fs.existsSync(path.join(destination, 'python', 'bin', 'python3')));
	});

	test('rejects archive expansion beyond the configured limit', async () => {
		const source = path.join(root, 'source');
		fs.mkdirSync(source);
		fs.writeFileSync(path.join(source, 'large'), Buffer.alloc(128));
		const archive = path.join(root, 'large.tar.gz');
		await tar.create({ cwd: source, file: archive, gzip: true, portable: true }, ['large']);

		await assert.rejects(
			() => extractManagedRuntimeArchive(archive, path.join(root, 'destination'), { maxExpandedBytes: 64 }),
			(error: unknown) => error instanceof ManagedRuntimeArchiveError && error.code === 'archive-too-large'
		);
	});
});
