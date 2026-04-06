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
	nameTranslations?: NameTranslations;
}

/**
 * 單一名稱（函式 / 變數）的多語系翻譯對照表。
 * key 為語言代碼（不含 zh-hant，以原始名稱為基準語言）。
 * 所有翻譯值必須符合 Python 3 識別字規則；不合法的值在套用時會被跳過並執行回退。
 */
export interface NameTranslationEntry {
	en?: string;
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

/**
 * 範本 JSON 頂層的名稱翻譯表。
 * variables 映射同時涵蓋工作區變數 name 與函式參數名稱（extraState 中的 arg name）。
 * functions 映射涵蓋函式定義名稱（fields.NAME 與 extraState mutation name 屬性）。
 */
export interface NameTranslations {
	/** 變數與函式參數名稱的翻譯映射（key：zh-hant 原始名稱）*/
	variables?: Record<string, NameTranslationEntry>;
	/** 函式定義名稱的翻譯映射（key：zh-hant 原始名稱）*/
	functions?: Record<string, NameTranslationEntry>;
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
 * Validate that a sample filename is a safe basename with .json extension.
 * Throws if the filename contains path separators or is not a .json file.
 */
function validateSampleFilename(filename: string): string {
	if (
		filename.length === 0 ||
		filename !== path.basename(filename) ||
		filename.includes('/') ||
		filename.includes('\\') ||
		path.extname(filename) !== '.json'
	) {
		log(`Rejected invalid sample filename '${filename}'`, 'warn');
		throw new Error(`Invalid sample filename '${filename}'`);
	}
	return filename;
}

/**
 * Fetch a specific sample workspace JSON, with cloud-first strategy and local fallback.
 */
export async function fetchSampleWorkspace(
	filename: string,
	extensionPath: string,
	readFileSyncFn: typeof fs.readFileSync = fs.readFileSync
): Promise<FetchResult<SampleWorkspace>> {
	const safeFilename = validateSampleFilename(filename);

	// 1. Try cloud
	try {
		const url = SAMPLE_BASE_URL + safeFilename;
		const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = (await response.json()) as SampleWorkspace;
		log(`Sample workspace '${safeFilename}' fetched from cloud`, 'info');
		return { data, isOffline: false };
	} catch (err: unknown) {
		const isTimeout = err instanceof Error && err.name === 'AbortError';
		log(
			isTimeout
				? `Sample workspace '${safeFilename}' fetch timed out after ${FETCH_TIMEOUT_MS}ms, falling back to local copy`
				: `Sample workspace '${safeFilename}' fetch failed: ${String(err)}, falling back to local copy`,
			'warn'
		);
	}

	// 2. Fallback to local bundled copy
	const localPath = path.join(extensionPath, 'media', 'samples', safeFilename);
	try {
		const raw = readFileSyncFn(localPath, 'utf-8') as string;
		const data = JSON.parse(raw) as SampleWorkspace;
		log(`Sample workspace '${safeFilename}' loaded from local copy`, 'info');
		return { data, isOffline: true };
	} catch (err) {
		log(`Sample workspace '${safeFilename}' local fallback failed: ${String(err)}`, 'error');
		throw new Error(`Cannot load sample workspace '${safeFilename}': ${String(err)}`);
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

// ─── Name Translation ────────────────────────────────────────────────────────

/**
 * 驗證字串是否為合法的 Python 3 / MicroPython 識別字。
 * 使用 Unicode-aware 正規表達式，符合 PEP 3131 規則：
 * 以 Unicode 字母或底線開頭，後接字母、數字、底線，不含空格或符號。
 */
function isValidIdentifier(name: string): boolean {
	if (!name || name.length === 0) {
		return false;
	}
	return /^[^\d\W]\w*$/u.test(name);
}

/**
 * 從翻譯映射中解析目標語系的合法識別字名稱，實作三層回退策略。
 * (1) 目標語系翻譯 → (2) en 翻譯 → (3) 原始名稱
 *
 * @param original    原始名稱（zh-hant 基準）
 * @param entry       該名稱的翻譯對照表
 * @param language    目標語系代碼
 * @returns           最終使用的名稱
 */
function resolveTranslatedName(original: string, entry: NameTranslationEntry, language: string): string {
	// zh-hant 為基準語言，直接回傳原始名稱
	if (language === 'zh-hant') {
		return original;
	}

	// 第一層：目標語系
	const targetTranslation = entry[language];
	if (targetTranslation !== undefined) {
		if (isValidIdentifier(targetTranslation)) {
			return targetTranslation;
		}
		log(`名稱翻譯值 '${targetTranslation}' (語系: ${language}) 不符合識別字規則，嘗試 en 回退`, 'warn');
	}

	// 第二層：en 回退
	if (language !== 'en' && entry['en'] !== undefined) {
		const enTranslation = entry['en'];
		if (isValidIdentifier(enTranslation)) {
			return enTranslation;
		}
		log(`名稱翻譯值 '${enTranslation}' (語系: en) 不符合識別字規則，保留原始名稱`, 'warn');
	}

	// 第三層：保留原始名稱
	return original;
}

/**
 * 遞迴遍歷積木樹並套用名稱翻譯。
 * 處理 arduino_function（函式定義）與 arduino_function_call（函式呼叫）。
 */
function translateBlocks(blocks: unknown, nameTranslations: NameTranslations, language: string): void {
	if (!Array.isArray(blocks)) {
		return;
	}
	for (const block of blocks) {
		if (typeof block !== 'object' || block === null) {
			continue;
		}
		const b = block as Record<string, unknown>;
		const blockType = b['type'] as string | undefined;
		const fields = b['fields'] as Record<string, unknown> | undefined;
		const inputs = b['inputs'] as Record<string, unknown> | undefined;

		// 函式定義積木：替換 fields.NAME 與 extraState 中的 arg name
		if (blockType === 'arduino_function' && fields) {
			const funcName = fields['NAME'] as string | undefined;
			if (funcName !== undefined) {
				const funcEntry = nameTranslations.functions?.[funcName];
				if (funcEntry) {
					const translated = resolveTranslatedName(funcName, funcEntry, language);
					fields['NAME'] = translated;
				}
			}
			// 替換 extraState 中的 <arg name="...">（函式參數名稱）
			const extraState = b['extraState'] as string | undefined;
			if (extraState && nameTranslations.variables) {
				b['extraState'] = translateArgNames(extraState, nameTranslations.variables, language);
			}
		}

		// 函式呼叫積木：替換 extraState 中的 mutation name="..." 與 <arg name="...">
		if (blockType === 'arduino_function_call') {
			const extraState = b['extraState'] as string | undefined;
			if (extraState) {
				let translated = extraState;
				// 替換 mutation 元素的 name="..." 屬性（函式呼叫名稱）
				if (nameTranslations.functions) {
					translated = translateMutationName(translated, nameTranslations.functions, language);
				}
				// 替換 <arg name="..."> 參數名稱
				if (nameTranslations.variables) {
					translated = translateArgNames(translated, nameTranslations.variables, language);
				}
				b['extraState'] = translated;
			}
		}

		// 遞迴處理巢狀積木（inputs 中的每個輸入）
		if (inputs) {
			for (const inputKey of Object.keys(inputs)) {
				const input = inputs[inputKey] as Record<string, unknown> | undefined;
				if (input) {
					const innerBlock = input['block'];
					const shadowBlock = input['shadow'];
					if (innerBlock) {
						translateBlocks([innerBlock], nameTranslations, language);
					}
					if (shadowBlock) {
						translateBlocks([shadowBlock], nameTranslations, language);
					}
				}
			}
		}

		// 遞迴處理 next 連接的積木
		const next = b['next'] as Record<string, unknown> | undefined;
		if (next?.['block']) {
			translateBlocks([next['block']], nameTranslations, language);
		}
	}
}

/**
 * 替換 extraState XML 字串中的 mutation name="originalName" 屬性。
 * 僅匹配 mutation 層級的 name 屬性（前置空白，區分 <arg name=>）。
 */
function translateMutationName(extraState: string, functionsMap: Record<string, NameTranslationEntry>, language: string): string {
	return extraState.replace(/ name="([^"]+)"/g, (match, original: string) => {
		const entry = functionsMap[original];
		if (!entry) {
			return match;
		}
		const translated = resolveTranslatedName(original, entry, language);
		return ` name="${translated}"`;
	});
}

/**
 * 替換 extraState XML 字串中的 <arg name="originalName" 屬性。
 */
function translateArgNames(extraState: string, variablesMap: Record<string, NameTranslationEntry>, language: string): string {
	return extraState.replace(/<arg name="([^"]+)"/g, (match, original: string) => {
		const entry = variablesMap[original];
		if (!entry) {
			return match;
		}
		const translated = resolveTranslatedName(original, entry, language);
		return `<arg name="${translated}"`;
	});
}

/**
 * 將 workspace 中的函式名稱和變數名稱翻譯為目標語系。
 * 純函式：不修改輸入物件，回傳深層複製的新物件。
 * 無法翻譯的名稱（無翻譯映射或翻譯值不合法）保留原始名稱。
 *
 * @param workspace        Blockly workspace state 物件
 * @param nameTranslations 翻譯映射表（來自 SampleWorkspace.nameTranslations）
 * @param language         目標語系代碼（如 'en'、'ja'）
 * @returns                翻譯後的 workspace 物件（深層複製）
 */
export function applyNameTranslations(workspace: object, nameTranslations: NameTranslations, language: string): object {
	// 深層複製，確保純函式特性
	const cloned = JSON.parse(JSON.stringify(workspace)) as Record<string, unknown>;

	// (a) 替換工作區變數名稱
	const variables = cloned['variables'] as Array<Record<string, unknown>> | undefined;
	if (Array.isArray(variables) && nameTranslations.variables) {
		for (const variable of variables) {
			const name = variable['name'] as string | undefined;
			if (name !== undefined) {
				const entry = nameTranslations.variables[name];
				if (entry) {
					variable['name'] = resolveTranslatedName(name, entry, language);
				}
			}
		}
	}

	// (b)(c)(d) 遞迴替換積木樹中的函式名稱與參數名稱
	const blocksWrapper = cloned['blocks'] as Record<string, unknown> | undefined;
	if (blocksWrapper) {
		const topBlocks = blocksWrapper['blocks'] as unknown[] | undefined;
		if (Array.isArray(topBlocks)) {
			translateBlocks(topBlocks, nameTranslations, language);
		}
	}

	return cloned;
}
