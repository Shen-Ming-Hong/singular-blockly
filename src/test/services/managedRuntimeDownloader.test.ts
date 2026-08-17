/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileService } from '../../services/fileService';
import {
	ManagedRuntimeDownloadError,
	ManagedRuntimeDownloader,
} from '../../services/managedRuntimeDownloader';
import { RuntimeDownload } from '../../types/managedRuntime';
import { sha256 } from '../../services/managedRuntimeManifest';

suite('ManagedRuntime Downloader', () => {
	let root: string;
	const bytes = Buffer.from('verified runtime bytes');
	let download: RuntimeDownload;

	setup(() => {
		root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-download-'));
		download = {
			url: 'https://github.com/example/runtime.tar.gz',
			sha256: sha256(bytes),
			size: bytes.length,
			license: 'MIT',
			source: 'https://github.com/example/runtime',
		};
	});

	teardown(() => fs.rmSync(root, { recursive: true, force: true }));

	test('writes exact bytes only after length and checksum verification', async () => {
		const fetcher: typeof fetch = async () => ({
			ok: true,
			status: 200,
			url: download.url,
			headers: new Headers({ 'content-length': String(bytes.length) }),
			arrayBuffer: async () => bytes,
		}) as unknown as Response;
		const downloader = new ManagedRuntimeDownloader(new FileService(root), { fetcher });

		const result = await downloader.download(download, 'downloads/runtime.tar.gz');

		assert.strictEqual(result.sha256, download.sha256);
		assert.deepStrictEqual(fs.readFileSync(path.join(root, 'downloads', 'runtime.tar.gz')), bytes);
	});

	test('does not commit bytes when the checksum is wrong', async () => {
		const fetcher: typeof fetch = async () => ({
			ok: true,
			status: 200,
			url: download.url,
			headers: new Headers({ 'content-length': String(bytes.length) }),
			arrayBuffer: async () => bytes,
		}) as unknown as Response;
		const downloader = new ManagedRuntimeDownloader(new FileService(root), { fetcher });

		await assert.rejects(
			() => downloader.download({ ...download, sha256: '0'.repeat(64) }, 'downloads/runtime.tar.gz'),
			(error: unknown) => error instanceof ManagedRuntimeDownloadError && error.code === 'checksum-mismatch'
		);
		assert.ok(!fs.existsSync(path.join(root, 'downloads', 'runtime.tar.gz')));
	});

	test('accepts a compressed transfer length while still verifying decoded bytes', async () => {
		const decodedBytes = Buffer.from('decoded-runtime-bytes');
		const compressedDownload = { ...download, sha256: sha256(decodedBytes), size: decodedBytes.length };
		const fetcher: typeof fetch = async () => ({
			ok: true,
			status: 200,
			url: compressedDownload.url,
			headers: new Headers({ 'content-length': '7', 'content-encoding': 'gzip' }),
			arrayBuffer: async () => decodedBytes,
		}) as unknown as Response;
		const result = await new ManagedRuntimeDownloader(new FileService(root), { fetcher })
			.download(compressedDownload, 'downloads/runtime.tar.gz');
		assert.strictEqual(result.size, decodedBytes.length);
		assert.deepStrictEqual(fs.readFileSync(path.join(root, 'downloads', 'runtime.tar.gz')), decodedBytes);
	});

	test('rejects an untrusted final redirect and oversized response', async () => {
		const redirected: typeof fetch = async () => ({
			ok: true,
			status: 200,
			url: 'https://attacker.invalid/runtime.tar.gz',
			headers: new Headers(),
			arrayBuffer: async () => bytes,
		}) as unknown as Response;
		await assert.rejects(
			() => new ManagedRuntimeDownloader(new FileService(root), { fetcher: redirected }).download(download, 'runtime'),
			(error: unknown) => error instanceof ManagedRuntimeDownloadError && error.code === 'untrusted-redirect'
		);

		const oversized: typeof fetch = async () => ({
			ok: true,
			status: 200,
			url: download.url,
			headers: new Headers({ 'content-length': String(bytes.length + 1) }),
			arrayBuffer: async () => bytes,
		}) as unknown as Response;
		await assert.rejects(
			() => new ManagedRuntimeDownloader(new FileService(root), { fetcher: oversized }).download(download, 'runtime'),
			(error: unknown) => error instanceof ManagedRuntimeDownloadError && error.code === 'unexpected-size'
		);
	});

	test('validates every redirect hop before requesting it', async () => {
		const requested: string[] = [];
		const fetcher: typeof fetch = async input => {
			requested.push(String(input));
			return {
				ok: false,
				status: 302,
				url: download.url,
				headers: new Headers({ location: 'https://attacker.invalid/runtime.tar.gz' }),
				arrayBuffer: async () => new ArrayBuffer(0),
			} as unknown as Response;
		};

		await assert.rejects(
			() => new ManagedRuntimeDownloader(new FileService(root), { fetcher }).download(download, 'runtime'),
			(error: unknown) => error instanceof ManagedRuntimeDownloadError && error.code === 'untrusted-redirect'
		);
		assert.deepStrictEqual(requested, [download.url]);
	});

	test('follows an allowed redirect with manual redirect handling', async () => {
		const redirectedUrl = 'https://objects.githubusercontent.com/example/runtime.tar.gz';
		const fetcher: typeof fetch = async input => String(input) === download.url
			? ({
				ok: false,
				status: 302,
				url: download.url,
				headers: new Headers({ location: redirectedUrl }),
				arrayBuffer: async () => new ArrayBuffer(0),
			} as unknown as Response)
			: ({
				ok: true,
				status: 200,
				url: redirectedUrl,
				headers: new Headers({ 'content-length': String(bytes.length) }),
				arrayBuffer: async () => bytes,
			} as unknown as Response);

		const result = await new ManagedRuntimeDownloader(new FileService(root), { fetcher })
			.download(download, 'runtime');

		assert.strictEqual(result.sha256, download.sha256);
	});

	test('honors cancellation before making a request', async () => {
		let called = false;
		const fetcher: typeof fetch = async () => {
			called = true;
			throw new Error('should not run');
		};
		const controller = new AbortController();
		controller.abort();
		await assert.rejects(
			() => new ManagedRuntimeDownloader(new FileService(root), { fetcher }).download(download, 'runtime', { signal: controller.signal }),
			(error: unknown) => error instanceof ManagedRuntimeDownloadError && error.code === 'cancelled'
		);
		assert.strictEqual(called, false);
	});
});
