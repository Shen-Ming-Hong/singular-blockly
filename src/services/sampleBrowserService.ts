/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { log } from './logging';

// GitHub Raw URL for the sample index
const SAMPLE_INDEX_URL = 'https://raw.githubusercontent.com/Shen-Ming-Hong/singular-blockly/master/media/samples/index.json';
const SAMPLE_BASE_URL = 'https://raw.githubusercontent.com/Shen-Ming-Hong/singular-blockly/master/media/samples/';
const FETCH_TIMEOUT_MS = 10000;

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface LocalizedText {
	en: string;
	'zh-hant'?: string;
	ja?: string;
	ko?: string;
	de?: string;
	fr?: string;
	es?: string;
	it?: string;
	'pt-br'?: string;
	ru?: string;
	pl?: string;
	cs?: string;
	hu?: string;
	bg?: string;
	tr?: string;
	[key: string]: string | undefined;
}

export interface SampleEntry {
	id: string;
	filename: string;
	board: string;
	title: LocalizedText;
	description: LocalizedText;
}

export interface SampleIndex {
	version: number;
	samples: SampleEntry[];
}

export interface SampleWorkspace {
	workspace: object;
	board: string;
}

export interface FetchResult<T> {
	data: T;
	isOffline: boolean;
}

// ─── Fetch Utility ───────────────────────────────────────────────────────────

/**
 * Fetch a URL with timeout support.
 * Throws on network error or timeout.
 */
export async function fetchWithTimeout(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

// ─── Sample Index ────────────────────────────────────────────────────────────

/**
 * Fetch the sample index, with cloud-first strategy and local fallback.
 * Returns FetchResult<SampleIndex> with isOffline flag.
 */
export async function fetchSampleIndex(
	extensionPath: string,
	readFileSyncFn: typeof fs.readFileSync = fs.readFileSync
): Promise<FetchResult<SampleIndex>> {
	// 1. Try cloud
	try {
		const response = await fetchWithTimeout(SAMPLE_INDEX_URL, FETCH_TIMEOUT_MS);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = (await response.json()) as SampleIndex;
		log(`Sample index fetched from cloud (version ${data.version})`, 'info');
		return { data, isOffline: false };
	} catch (err: unknown) {
		const isTimeout = err instanceof Error && err.name === 'AbortError';
		log(
			isTimeout
				? `Sample index fetch timed out after ${FETCH_TIMEOUT_MS}ms, falling back to local copy`
				: `Sample index fetch failed: ${String(err)}, falling back to local copy`,
			'warn'
		);
	}

	// 2. Fallback to local bundled copy
	const localPath = path.join(extensionPath, 'media', 'samples', 'index.json');
	try {
		const raw = readFileSyncFn(localPath, 'utf-8') as string;
		const data = JSON.parse(raw) as SampleIndex;
		log(`Sample index loaded from local copy (version ${data.version})`, 'info');
		return { data, isOffline: true };
	} catch (err) {
		log(`Sample index local fallback failed: ${String(err)}`, 'error');
		throw new Error(`Cannot load sample index: ${String(err)}`);
	}
}

// ─── Sample Workspace ────────────────────────────────────────────────────────

/**
 * Fetch a specific sample workspace JSON, with cloud-first strategy and local fallback.
 */
export async function fetchSampleWorkspace(
	filename: string,
	extensionPath: string,
	readFileSyncFn: typeof fs.readFileSync = fs.readFileSync
): Promise<FetchResult<SampleWorkspace>> {
	// 1. Try cloud
	try {
		const url = SAMPLE_BASE_URL + filename;
		const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = (await response.json()) as SampleWorkspace;
		log(`Sample workspace '${filename}' fetched from cloud`, 'info');
		return { data, isOffline: false };
	} catch (err: unknown) {
		const isTimeout = err instanceof Error && err.name === 'AbortError';
		log(
			isTimeout
				? `Sample workspace '${filename}' fetch timed out after ${FETCH_TIMEOUT_MS}ms, falling back to local copy`
				: `Sample workspace '${filename}' fetch failed: ${String(err)}, falling back to local copy`,
			'warn'
		);
	}

	// 2. Fallback to local bundled copy
	const localPath = path.join(extensionPath, 'media', 'samples', filename);
	try {
		const raw = readFileSyncFn(localPath, 'utf-8') as string;
		const data = JSON.parse(raw) as SampleWorkspace;
		log(`Sample workspace '${filename}' loaded from local copy`, 'info');
		return { data, isOffline: true };
	} catch (err) {
		log(`Sample workspace '${filename}' local fallback failed: ${String(err)}`, 'error');
		throw new Error(`Cannot load sample workspace '${filename}': ${String(err)}`);
	}
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a sample workspace JSON (FR-011).
 * Checks that `workspace` is an object and `board === 'cyberbrick'`.
 */
export function validateSampleWorkspace(json: unknown): json is SampleWorkspace {
	if (typeof json !== 'object' || json === null) {
		log('Sample workspace validation failed: not an object', 'warn');
		return false;
	}
	const obj = json as Record<string, unknown>;
	if (typeof obj['workspace'] !== 'object' || obj['workspace'] === null) {
		log('Sample workspace validation failed: missing or invalid `workspace` field', 'warn');
		return false;
	}
	if (obj['board'] !== 'cyberbrick') {
		log(`Sample workspace validation failed: board is '${String(obj['board'])}', expected 'cyberbrick'`, 'warn');
		return false;
	}
	return true;
}
