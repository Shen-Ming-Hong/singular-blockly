/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INCLUDE, LIB_DEP } from './blockPackValidator';
import { fetchWithTimeout } from './sampleBrowserService';

/** 積木設計器的 PlatformIO 函式庫搜尋：只連 PlatformIO Registry，結果經過格式過濾後才交給 WebView */
const REGISTRY_URL = 'https://api.registry.platformio.org/v3';
const MAX_QUERY = 80;
const MAX_RESULTS = 10;
const MAX_DESCRIPTION = 300;
const MAX_HEADERS = 5;
const OWNER = /^[A-Za-z0-9_.-]+$/;
const NAME = /^[A-Za-z0-9_.][A-Za-z0-9_. -]*$/;
const VERSION = /^\d+\.\d+\.\d+$/;

export interface BlockPackLibraryItem {
	owner: string;
	name: string;
	version: string;
	description: string;
	/** 可直接放進 libDeps 的寫法，例如 adafruit/DHT sensor library@^1.4.7 */
	libDep: string;
}

export type FetchJson = (url: string) => Promise<unknown>;

export async function defaultFetchJson(url: string): Promise<unknown> {
	const response = await fetchWithTimeout(url, 10000);
	if (!response.ok) {
		throw new Error(`Registry responded ${response.status}`);
	}
	return response.json();
}

function record(value: unknown): Record<string, unknown> | null {
	return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function isValidLibraryQuery(query: unknown): query is string {
	return typeof query === 'string' && query.trim().length > 0 && query.length <= MAX_QUERY;
}

export function isValidLibraryName(owner: unknown, name: unknown): boolean {
	return typeof owner === 'string' && typeof name === 'string' && OWNER.test(owner) && NAME.test(name) && name.length <= 100;
}

/** 搜尋適用 ESP32 Arduino 的函式庫，依熱門程度排序 */
export async function searchBlockPackLibraries(query: string, fetchJson: FetchJson = defaultFetchJson): Promise<BlockPackLibraryItem[]> {
	// 移除使用者輸入中的篩選語法，固定加上本功能支援的平台條件
	const words = query.replace(/\b\w+:\S*/g, ' ').replace(/\s+/g, ' ').trim();
	const filter = `${words} type:library platform:espressif32 framework:arduino`;
	const url = `${REGISTRY_URL}/search?query=${encodeURIComponent(filter)}&sort=popularity&page=1`;
	const data = record(await fetchJson(url));
	const items = Array.isArray(data?.items) ? data.items : [];
	const results: BlockPackLibraryItem[] = [];
	for (const raw of items) {
		const item = record(raw);
		const owner = record(item?.owner)?.username;
		const version = record(item?.version)?.name;
		const name = item?.name;
		if (!isValidLibraryName(owner, name) || typeof version !== 'string' || !VERSION.test(version)) {
			continue;
		}
		const libDep = `${owner}/${name}@^${version}`;
		if (!LIB_DEP.test(libDep)) {
			continue;
		}
		const description = typeof item?.description === 'string' ? item.description.slice(0, MAX_DESCRIPTION) : '';
		results.push({ owner: owner as string, name: name as string, version, description, libDep });
		if (results.length >= MAX_RESULTS) {
			break;
		}
	}
	return results;
}

/** 取得函式庫提供的標頭檔，讓設計器自動填入 #include */
export async function getBlockPackLibraryHeaders(owner: string, name: string, fetchJson: FetchJson = defaultFetchJson): Promise<string[]> {
	const url = `${REGISTRY_URL}/packages/${encodeURIComponent(owner)}/library/${encodeURIComponent(name)}`;
	const data = record(await fetchJson(url));
	const headers = Array.isArray(data?.headers) ? data.headers : [];
	return headers.filter((header): header is string => typeof header === 'string' && INCLUDE.test(header)).slice(0, MAX_HEADERS);
}
