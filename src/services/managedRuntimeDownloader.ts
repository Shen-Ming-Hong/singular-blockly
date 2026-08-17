/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileService } from './fileService';
import { assertAllowedRuntimeUrl, sha256 } from './managedRuntimeManifest';
import { RuntimeDownload } from '../types/managedRuntime';

export interface ManagedRuntimeDownloadResult {
	relativePath: string;
	sha256: string;
	size: number;
}

export interface ManagedRuntimeDownloadOptions {
	signal?: AbortSignal;
	timeoutMs?: number;
	onProgress?: (receivedBytes: number, totalBytes: number) => void;
}

export class ManagedRuntimeDownloadError extends Error {
	constructor(public readonly code: string, message: string) {
		super(message);
		this.name = 'ManagedRuntimeDownloadError';
	}
}

export class ManagedRuntimeDownloader {
	private readonly fetcher: typeof fetch;

	constructor(
		private readonly files: FileService,
		options: { fetcher?: typeof fetch } = {}
	) {
		this.fetcher = options.fetcher ?? globalThis.fetch;
	}

	async download(
		download: RuntimeDownload,
		destinationRelativePath: string,
		options: ManagedRuntimeDownloadOptions = {}
	): Promise<ManagedRuntimeDownloadResult> {
		assertAllowedRuntimeUrl(download.url);
		if (options.signal?.aborted) {
			throw new ManagedRuntimeDownloadError('cancelled', 'Runtime download was cancelled');
		}

		const controller = new AbortController();
		const abort = (): void => controller.abort();
		options.signal?.addEventListener('abort', abort, { once: true });
		const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 120_000);
		try {
			let response: Response;
			try {
				response = await this.fetchFollowingAllowedRedirects(download.url, controller.signal);
				} catch (error) {
					if (error instanceof ManagedRuntimeDownloadError) {throw error;}
					if (controller.signal.aborted) {
					throw new ManagedRuntimeDownloadError(options.signal?.aborted ? 'cancelled' : 'timeout', 'Runtime download did not complete');
				}
				throw new ManagedRuntimeDownloadError('network', error instanceof Error ? error.message : 'Runtime download failed');
			}
			if (!response.ok) {
				throw new ManagedRuntimeDownloadError('http-status', `Runtime download returned HTTP ${response.status}`);
			}
			try {
				assertAllowedRuntimeUrl(response.url || download.url);
			} catch {
				throw new ManagedRuntimeDownloadError('untrusted-redirect', 'Runtime download redirected to an untrusted host');
			}
			const declaredLength = response.headers.get('content-length');
			const contentEncoding = response.headers.get('content-encoding')?.trim().toLowerCase();
			if (
				declaredLength !== null &&
				(!contentEncoding || contentEncoding === 'identity') &&
				Number(declaredLength) !== download.size
			) {
				throw new ManagedRuntimeDownloadError('unexpected-size', 'Runtime download size does not match the manifest');
			}
			const bytes = Buffer.from(await response.arrayBuffer());
			if (bytes.length !== download.size) {
				throw new ManagedRuntimeDownloadError('unexpected-size', 'Runtime download size does not match the manifest');
			}
			const digest = sha256(bytes);
			if (digest !== download.sha256) {
				throw new ManagedRuntimeDownloadError('checksum-mismatch', 'Runtime download checksum does not match the manifest');
			}
			options.onProgress?.(bytes.length, download.size);
			await this.files.writeFileAtomic(destinationRelativePath, bytes);
			return { relativePath: destinationRelativePath, sha256: digest, size: bytes.length };
		} finally {
			clearTimeout(timeout);
			options.signal?.removeEventListener('abort', abort);
		}
	}

	private async fetchFollowingAllowedRedirects(initialUrl: string, signal: AbortSignal): Promise<Response> {
		const redirectStatuses = new Set([301, 302, 303, 307, 308]);
		let currentUrl = initialUrl;
		for (let redirectCount = 0; redirectCount <= 5; redirectCount++) {
			const response = await this.fetcher(currentUrl, {
				method: 'GET',
				redirect: 'manual',
				signal,
				headers: { 'User-Agent': 'Singular-Blockly-Managed-Runtime' },
			});
			if (!redirectStatuses.has(response.status)) {return response;}
			if (redirectCount === 5) {
				throw new ManagedRuntimeDownloadError('too-many-redirects', 'Runtime download exceeded the redirect limit');
			}
			const location = response.headers.get('location');
			if (!location) {
				throw new ManagedRuntimeDownloadError('invalid-redirect', 'Runtime download returned a redirect without a location');
			}
			let nextUrl: string;
			try {
				nextUrl = new URL(location, currentUrl).toString();
				assertAllowedRuntimeUrl(nextUrl);
			} catch {
				throw new ManagedRuntimeDownloadError('untrusted-redirect', 'Runtime download redirected to an untrusted host');
			}
			currentUrl = nextUrl;
		}
		throw new ManagedRuntimeDownloadError('too-many-redirects', 'Runtime download exceeded the redirect limit');
	}
}
