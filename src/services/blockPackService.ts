/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import { FileService } from './fileService';
import { log } from './logging';
import { blockPackLibDeps, BLOCK_PACK_MAX_BYTES, parseBlockPack } from './blockPackValidator';
import type { BlockPack, BlockPackError } from '../types/blockPack';

/** WebView 告知目前專案已匯入的積木包 */
/** 積木包尚未完成硬體測試前以實驗性設定開啟，預設關閉 */
export const BLOCK_PACKS_SETTING_SECTION = 'singular-blockly';
export const BLOCK_PACKS_SETTING_KEY = 'experimental.blockPacks';

export function isBlockPacksEnabled(config: { get<T>(section: string, defaultValue: T): T }): boolean {
	return config.get<boolean>(BLOCK_PACKS_SETTING_KEY, false) === true;
}

export interface InstalledBlockPackSummary {
	id: string;
	version: string;
	blocks: string[];
}

export type BlockPackImportOutcome =
	| {
			kind: 'ready';
			pack: BlockPack;
			sourceName: string;
			change: 'new' | 'update' | 'same';
			previousVersion?: string;
			removedBlocks: string[];
	  }
	| { kind: 'rejected'; sourceName?: string; errors: BlockPackError[] }
	| { kind: 'cancelled' };

/** 可注入的外部相依，方便在測試中替換 VS Code API */
export interface BlockPackServiceDeps {
	pickFile(): Promise<string | undefined>;
	readFile(filePath: string): Promise<Buffer>;
	isWorkspaceTrusted(): boolean;
	confirmLibDeps(pack: BlockPack, libDeps: string[]): Promise<boolean>;
}

/** 透過 FileService 讀取使用者選擇的檔案（以檔案所在資料夾為根目錄） */
export async function readBlockPackFile(filePath: string): Promise<Buffer> {
	const fileService = new FileService(path.dirname(filePath));
	const stats = await fileService.getFileStats(path.basename(filePath));
	if (stats && stats.size > BLOCK_PACK_MAX_BYTES) {
		// 超過上限就不讀全文，讓驗證器以 INVALID_JSON 拒絕
		return Buffer.alloc(BLOCK_PACK_MAX_BYTES + 1, 0x20);
	}
	return fileService.readBuffer(path.basename(filePath));
}

export class BlockPackService {
	constructor(private readonly deps: BlockPackServiceDeps) {}

	/**
	 * 選檔、驗證、比對已匯入版本，並在含函式庫依賴時確認信任與使用者同意。
	 * 寫入專案由 WebView 預覽確認後經既有 saveWorkspace 完成。
	 */
	async importPack(installed: readonly InstalledBlockPackSummary[]): Promise<BlockPackImportOutcome> {
		const filePath = await this.deps.pickFile();
		if (!filePath) {
			return { kind: 'cancelled' };
		}
		const sourceName = path.basename(filePath);

		let text: string;
		try {
			text = (await this.deps.readFile(filePath)).toString('utf8');
		} catch (error) {
			log('Failed to read block pack file', 'warn', { sourceName, error: String(error) });
			return { kind: 'rejected', sourceName, errors: [{ code: 'INVALID_JSON', path: '' }] };
		}

		const result = parseBlockPack(text);
		if (!result.ok) {
			log('Rejected block pack', 'info', { sourceName, errors: result.errors });
			return { kind: 'rejected', sourceName, errors: result.errors };
		}
		const pack = result.pack;

		const libDeps = blockPackLibDeps(pack);
		if (libDeps.length > 0) {
			if (!this.deps.isWorkspaceTrusted()) {
				return { kind: 'rejected', sourceName, errors: [{ code: 'UNTRUSTED_WORKSPACE', path: 'targets.esp32.libDeps' }] };
			}
			if (!(await this.deps.confirmLibDeps(pack, libDeps))) {
				return { kind: 'cancelled' };
			}
		}

		const previous = installed.find(entry => entry.id === pack.id);
		const blockNames = new Set(pack.blocks.map(block => block.name));
		const removedBlocks = previous ? previous.blocks.filter(name => !blockNames.has(name)) : [];
		const change = !previous ? 'new' : previous.version === pack.version && removedBlocks.length === 0 ? 'same' : 'update';
		log('Block pack ready for preview', 'info', { id: pack.id, version: pack.version, change });
		return {
			kind: 'ready',
			pack,
			sourceName,
			change,
			...(previous ? { previousVersion: previous.version } : {}),
			removedBlocks,
		};
	}
}

/** 檢查 WebView 傳來的已匯入清單形狀 */
export function parseInstalledSummaries(value: unknown): InstalledBlockPackSummary[] | null {
	if (!Array.isArray(value) || value.length > 100) {
		return null;
	}
	const summaries: InstalledBlockPackSummary[] = [];
	for (const entry of value) {
		if (
			!entry ||
			typeof entry !== 'object' ||
			typeof entry.id !== 'string' ||
			typeof entry.version !== 'string' ||
			!Array.isArray(entry.blocks) ||
			!entry.blocks.every((name: unknown) => typeof name === 'string')
		) {
			return null;
		}
		summaries.push({ id: entry.id, version: entry.version, blocks: [...entry.blocks] });
	}
	return summaries;
}
