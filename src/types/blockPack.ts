/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** 第一版只支援的板子；日後擴充時加入其他板子 ID */
export const BLOCK_PACK_BOARDS = ['esp32'] as const;
export type BlockPackBoard = (typeof BLOCK_PACK_BOARDS)[number];

export const BLOCK_PACK_LOCALES = [
	'bg',
	'cs',
	'de',
	'en',
	'es',
	'fr',
	'hu',
	'it',
	'ja',
	'ko',
	'pl',
	'pt-br',
	'ru',
	'tr',
	'zh-hant',
] as const;

/** 字串，或以語系為鍵的對照表 */
export type LocalizedText = string | Record<string, string>;

export type PackInputKind = 'value' | 'number' | 'text' | 'dropdown' | 'pin' | 'statement';

export interface PackInput {
	name: string;
	kind: PackInputKind;
	check?: 'Number' | 'Boolean' | 'String';
	default?: string | number;
	min?: number;
	max?: number;
	precision?: number;
	options?: Array<[LocalizedText, string]>;
	mode?: 'digital' | 'analog';
	direction?: 'input' | 'output';
	exclusive?: boolean;
}

export interface PackBlock {
	name: string;
	shape: 'statement' | 'value';
	output?: 'Number' | 'Boolean' | 'String';
	label: LocalizedText;
	tooltip?: LocalizedText;
	inputs?: PackInput[];
}

export interface PackTarget {
	includes?: string[];
	libDeps?: string[];
	globals?: string;
	setup?: string;
	blocks: Record<string, string>;
}

export interface BlockPack {
	formatVersion: 1;
	id: string;
	version: string;
	author?: string;
	defaultLocale: string;
	category: { name: LocalizedText; colour: number };
	blocks: PackBlock[];
	targets: Partial<Record<BlockPackBoard, PackTarget>>;
}

/** 存進專案工作區的積木包，多了匯入資訊 */
export interface InstalledBlockPack extends BlockPack {
	importedAt?: string;
	sourceName?: string;
}

export interface BlockPackSnapshot {
	formatVersion: 1;
	packs: InstalledBlockPack[];
}

export type BlockPackErrorCode =
	| 'INVALID_JSON'
	| 'UNSUPPORTED_FORMAT_VERSION'
	| 'MISSING_FIELD'
	| 'INVALID_VALUE'
	| 'UNKNOWN_FIELD'
	| 'UNSUPPORTED_BOARD'
	| 'DUPLICATE_NAME'
	| 'LABEL_INPUT_MISMATCH'
	| 'MISSING_TEMPLATE'
	| 'UNKNOWN_TEMPLATE_INPUT'
	| 'INVALID_LIB_DEP'
	| 'UNTRUSTED_WORKSPACE';

export interface BlockPackError {
	code: BlockPackErrorCode;
	path: string;
}

export type BlockPackValidationResult = { ok: true; pack: BlockPack } | { ok: false; errors: BlockPackError[] };
