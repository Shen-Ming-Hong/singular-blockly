/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	BLOCK_PACK_BOARDS,
	BLOCK_PACK_LOCALES,
	BlockPack,
	BlockPackError,
	BlockPackErrorCode,
	BlockPackSnapshot,
	BlockPackValidationResult,
	InstalledBlockPack,
} from '../types/blockPack';

export const BLOCK_PACK_MAX_BYTES = 256 * 1024;
const MAX_BLOCKS = 50;
const MAX_INPUTS = 10;
const MAX_OPTIONS = 50;
const MAX_TEXT = 200;
const MAX_CODE = 20000;

const PACK_ID = /^[a-z][a-z0-9_]{1,31}$/;
const HEX_COLOUR = /^#[0-9a-fA-F]{6}$/;
const BLOCK_NAME = /^[a-z][a-z0-9_]{0,31}$/;
const INPUT_NAME = /^[A-Z][A-Z0-9_]{0,31}$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const OPTION_VALUE = /^[A-Za-z0-9_]+$/;
export const INCLUDE = /^[A-Za-z0-9_./-]+\.h(pp)?$/;
export const LIB_DEP = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.][A-Za-z0-9_. -]*@[~^]?\d+\.\d+\.\d+$/;
const LABEL_SLOT = /\{([A-Z][A-Z0-9_]*)\}/g;
const TEMPLATE_SLOT = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;

const PACK_KEYS = ['$schema', 'formatVersion', 'id', 'version', 'author', 'defaultLocale', 'category', 'blocks', 'targets', 'designer'];
const DESIGNER_KEYS = ['formatVersion', 'globals', 'blocks'];
const DESIGNER_BLOCK_KEYS = ['name', 'state', 'body'];
/** 設計器保存的 Blockly 設計工作區狀態上限（JSON 字元數） */
const MAX_DESIGN_STATE = 100000;
const INSTALLED_KEYS = [...PACK_KEYS, 'importedAt', 'sourceName'];
const BLOCK_KEYS = ['name', 'shape', 'output', 'label', 'tooltip', 'inputs'];
const TARGET_KEYS = ['includes', 'libDeps', 'globals', 'setup', 'blocks'];
const CHECKS = ['Number', 'Boolean', 'String'];
const INPUT_KEYS: Record<string, string[]> = {
	value: ['name', 'kind', 'check', 'default'],
	number: ['name', 'kind', 'default', 'min', 'max', 'precision'],
	text: ['name', 'kind', 'default'],
	dropdown: ['name', 'kind', 'options'],
	pin: ['name', 'kind', 'mode', 'direction', 'exclusive'],
	statement: ['name', 'kind'],
};

/** Blockly 型別名稱：pack_<積木包 id>_<積木名稱> */
export function getBlockPackBlockType(packId: string, blockName: string): string {
	return `pack_${packId}_${blockName}`;
}

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

class Collector {
	readonly errors: BlockPackError[] = [];

	add(code: BlockPackErrorCode, path: string): void {
		this.errors.push({ code, path });
	}

	keys(value: Obj, allowed: string[], path: string): void {
		for (const key of Object.keys(value)) {
			if (!allowed.includes(key)) {
				this.add('UNKNOWN_FIELD', `${path}${path ? '.' : ''}${key}`);
			}
		}
	}

	required(value: Obj, key: string, path: string): boolean {
		if (value[key] === undefined) {
			this.add('MISSING_FIELD', `${path}${path ? '.' : ''}${key}`);
			return false;
		}
		return true;
	}

	string(value: unknown, path: string, pattern?: RegExp, max = MAX_TEXT): value is string {
		if (typeof value !== 'string' || value.length === 0 || value.length > max || (pattern && !pattern.test(value))) {
			this.add('INVALID_VALUE', path);
			return false;
		}
		return true;
	}

	code(value: unknown, path: string): void {
		if (value !== undefined && (typeof value !== 'string' || value.length > MAX_CODE)) {
			this.add('INVALID_VALUE', path);
		}
	}

	number(value: unknown, path: string, min?: number, max?: number): value is number {
		if (typeof value !== 'number' || !Number.isFinite(value) || (min !== undefined && value < min) || (max !== undefined && value > max)) {
			this.add('INVALID_VALUE', path);
			return false;
		}
		return true;
	}
}

/** 取出 LocalizedText 的所有語系字串；格式錯誤時回傳空陣列並記錄錯誤 */
function localizedTexts(c: Collector, value: unknown, path: string, defaultLocale: string): string[] {
	if (typeof value === 'string') {
		return c.string(value, path) ? [value] : [];
	}
	if (!isObject(value) || Object.keys(value).length === 0) {
		c.add('INVALID_VALUE', path);
		return [];
	}
	const texts: string[] = [];
	for (const [locale, text] of Object.entries(value)) {
		if (!(BLOCK_PACK_LOCALES as readonly string[]).includes(locale)) {
			c.add('INVALID_VALUE', `${path}.${locale}`);
		} else if (c.string(text, `${path}.${locale}`)) {
			texts.push(text);
		}
	}
	if (value[defaultLocale] === undefined) {
		c.add('MISSING_FIELD', `${path}.${defaultLocale}`);
	}
	return texts;
}

function validateInput(c: Collector, input: unknown, path: string, defaultLocale: string): string | undefined {
	if (!isObject(input)) {
		c.add('INVALID_VALUE', path);
		return undefined;
	}
	c.required(input, 'name', path);
	c.required(input, 'kind', path);
	const name = c.string(input.name, `${path}.name`, INPUT_NAME) ? (input.name as string) : undefined;
	const kind = input.kind as string;
	const allowed = INPUT_KEYS[kind];
	if (!allowed) {
		if (input.kind !== undefined) {
			c.add('INVALID_VALUE', `${path}.kind`);
		}
		return name;
	}
	c.keys(input, allowed, path);
	switch (kind) {
		case 'value':
			if (input.check !== undefined && !CHECKS.includes(input.check as string)) {
				c.add('INVALID_VALUE', `${path}.check`);
			}
			if (input.default !== undefined && typeof input.default !== 'number' && typeof input.default !== 'string') {
				c.add('INVALID_VALUE', `${path}.default`);
			}
			break;
		case 'number': {
			if (c.required(input, 'default', path)) {
				c.number(input.default, `${path}.default`);
			}
			const min = input.min === undefined || c.number(input.min, `${path}.min`) ? input.min : undefined;
			const max = input.max === undefined || c.number(input.max, `${path}.max`) ? input.max : undefined;
			if (typeof min === 'number' && typeof max === 'number' && min > max) {
				c.add('INVALID_VALUE', `${path}.max`);
			}
			if (input.precision !== undefined) {
				c.number(input.precision, `${path}.precision`, 0);
			}
			break;
		}
		case 'text':
			if (c.required(input, 'default', path) && (typeof input.default !== 'string' || input.default.length > MAX_TEXT)) {
				c.add('INVALID_VALUE', `${path}.default`);
			}
			break;
		case 'dropdown': {
			if (!c.required(input, 'options', path)) {
				break;
			}
			const options = input.options;
			if (!Array.isArray(options) || options.length === 0 || options.length > MAX_OPTIONS) {
				c.add('INVALID_VALUE', `${path}.options`);
				break;
			}
			const values = new Set<string>();
			options.forEach((option, index) => {
				const optionPath = `${path}.options[${index}]`;
				if (!Array.isArray(option) || option.length !== 2) {
					c.add('INVALID_VALUE', optionPath);
					return;
				}
				localizedTexts(c, option[0], `${optionPath}[0]`, defaultLocale);
				if (c.string(option[1], `${optionPath}[1]`, OPTION_VALUE)) {
					if (values.has(option[1])) {
						c.add('DUPLICATE_NAME', `${optionPath}[1]`);
					}
					values.add(option[1]);
				}
			});
			break;
		}
		case 'pin':
			if (c.required(input, 'mode', path) && input.mode !== 'digital' && input.mode !== 'analog') {
				c.add('INVALID_VALUE', `${path}.mode`);
			}
			if (input.direction !== undefined && input.direction !== 'input' && input.direction !== 'output') {
				c.add('INVALID_VALUE', `${path}.direction`);
			}
			// 類比腳位只能讀取
			if (input.mode === 'analog' && input.direction === 'output') {
				c.add('INVALID_VALUE', `${path}.direction`);
			}
			if (input.exclusive !== undefined && typeof input.exclusive !== 'boolean') {
				c.add('INVALID_VALUE', `${path}.exclusive`);
			}
			break;
	}
	return name;
}

function validateBlock(c: Collector, block: unknown, path: string, defaultLocale: string): { name?: string; inputs: Set<string> } {
	const inputs = new Set<string>();
	if (!isObject(block)) {
		c.add('INVALID_VALUE', path);
		return { inputs };
	}
	c.keys(block, BLOCK_KEYS, path);
	for (const key of ['name', 'shape', 'label']) {
		c.required(block, key, path);
	}
	const name = c.string(block.name, `${path}.name`, BLOCK_NAME) ? (block.name as string) : undefined;
	if (block.shape !== 'statement' && block.shape !== 'value') {
		if (block.shape !== undefined) {
			c.add('INVALID_VALUE', `${path}.shape`);
		}
	}
	if (block.output !== undefined && (block.shape !== 'value' || !CHECKS.includes(block.output as string))) {
		c.add('INVALID_VALUE', `${path}.output`);
	}
	if (block.tooltip !== undefined) {
		localizedTexts(c, block.tooltip, `${path}.tooltip`, defaultLocale);
	}
	if (block.inputs !== undefined) {
		if (!Array.isArray(block.inputs) || block.inputs.length > MAX_INPUTS) {
			c.add('INVALID_VALUE', `${path}.inputs`);
		} else {
			block.inputs.forEach((input, index) => {
				const inputName = validateInput(c, input, `${path}.inputs[${index}]`, defaultLocale);
				if (inputName) {
					if (inputs.has(inputName)) {
						c.add('DUPLICATE_NAME', `${path}.inputs[${index}].name`);
					}
					inputs.add(inputName);
				}
			});
		}
	}
	if (block.label !== undefined) {
		for (const label of localizedTexts(c, block.label, `${path}.label`, defaultLocale)) {
			const slots = [...label.matchAll(LABEL_SLOT)].map(match => match[1]);
			const unique = new Set(slots);
			const matches = slots.length === unique.size && unique.size === inputs.size && [...unique].every(slot => inputs.has(slot));
			if (!matches) {
				c.add('LABEL_INPUT_MISMATCH', `${path}.label`);
				break;
			}
		}
	}
	return { name, inputs };
}

function validateTarget(c: Collector, target: unknown, path: string, blocks: Map<string, Set<string>>): void {
	if (!isObject(target)) {
		c.add('INVALID_VALUE', path);
		return;
	}
	c.keys(target, TARGET_KEYS, path);
	for (const [key, pattern, code] of [
		['includes', INCLUDE, 'INVALID_VALUE'],
		['libDeps', LIB_DEP, 'INVALID_LIB_DEP'],
	] as const) {
		const list = target[key];
		if (list === undefined) {
			continue;
		}
		if (!Array.isArray(list)) {
			c.add('INVALID_VALUE', `${path}.${key}`);
			continue;
		}
		list.forEach((item, index) => {
			if (typeof item !== 'string' || !pattern.test(item)) {
				c.add(code, `${path}.${key}[${index}]`);
			}
		});
	}
	c.code(target.globals, `${path}.globals`);
	c.code(target.setup, `${path}.setup`);
	if (!c.required(target, 'blocks', path)) {
		return;
	}
	const templates = target.blocks;
	if (!isObject(templates)) {
		c.add('INVALID_VALUE', `${path}.blocks`);
		return;
	}
	for (const [blockName, inputs] of blocks) {
		const template = templates[blockName];
		const templatePath = `${path}.blocks.${blockName}`;
		if (template === undefined) {
			c.add('MISSING_TEMPLATE', templatePath);
			continue;
		}
		if (typeof template !== 'string' || template.length > MAX_CODE) {
			c.add('INVALID_VALUE', templatePath);
			continue;
		}
		for (const match of template.matchAll(TEMPLATE_SLOT)) {
			if (!inputs.has(match[1])) {
				c.add('UNKNOWN_TEMPLATE_INPUT', templatePath);
				break;
			}
		}
	}
	for (const key of Object.keys(templates)) {
		if (!blocks.has(key)) {
			c.add('UNKNOWN_FIELD', `${path}.blocks.${key}`);
		}
	}
}

/**
 * 圖形化積木設計器（073）保存的設計資訊：只做結構與大小檢查。
 * 程式碼產生只依 targets，designer 僅供重新開啟設計器時還原。
 */
function collectDesigner(c: Collector, value: unknown, path: string): void {
	if (!isObject(value)) {
		c.add('INVALID_VALUE', path);
		return;
	}
	c.keys(value, DESIGNER_KEYS, path);
	if (value.formatVersion !== 1) {
		c.add(value.formatVersion === undefined ? 'MISSING_FIELD' : 'UNSUPPORTED_FORMAT_VERSION', `${path}.formatVersion`);
	}
	c.code(value.globals, `${path}.globals`);
	if (!Array.isArray(value.blocks) || value.blocks.length > MAX_BLOCKS) {
		c.add('INVALID_VALUE', `${path}.blocks`);
		return;
	}
	value.blocks.forEach((entry, index) => {
		const at = `${path}.blocks[${index}]`;
		if (!isObject(entry)) {
			c.add('INVALID_VALUE', at);
			return;
		}
		c.keys(entry, DESIGNER_BLOCK_KEYS, at);
		c.string(entry.name, `${at}.name`, BLOCK_NAME);
		if (entry.body !== null) {
			c.code(entry.body, `${at}.body`);
		}
		if (!isObject(entry.state) || JSON.stringify(entry.state).length > MAX_DESIGN_STATE) {
			c.add('INVALID_VALUE', `${at}.state`);
		}
	});
}

function collectPack(c: Collector, value: unknown, path: string, allowedKeys: string[]): void {
	const at = (key: string) => `${path}${path ? '.' : ''}${key}`;
	if (!isObject(value)) {
		c.add('INVALID_JSON', path);
		return;
	}
	if (value.formatVersion !== 1) {
		c.add(value.formatVersion === undefined ? 'MISSING_FIELD' : 'UNSUPPORTED_FORMAT_VERSION', at('formatVersion'));
		return;
	}
	c.keys(value, allowedKeys, path);
	for (const key of ['id', 'version', 'defaultLocale', 'category', 'blocks', 'targets']) {
		c.required(value, key, path);
	}
	if (value.id !== undefined) {c.string(value.id, at('id'), PACK_ID);}
	if (value.version !== undefined) {c.string(value.version, at('version'), SEMVER);}
	if (value.author !== undefined) {c.string(value.author, at('author'), undefined, 80);}
	if (value.importedAt !== undefined) {c.string(value.importedAt, at('importedAt'));}
	if (value.sourceName !== undefined) {c.string(value.sourceName, at('sourceName'));}
	if (value.designer !== undefined) {collectDesigner(c, value.designer, at('designer'));}
	let defaultLocale = 'en';
	if (value.defaultLocale !== undefined) {
		if ((BLOCK_PACK_LOCALES as readonly string[]).includes(value.defaultLocale as string)) {
			defaultLocale = value.defaultLocale as string;
		} else {
			c.add('INVALID_VALUE', at('defaultLocale'));
		}
	}
	if (value.category !== undefined) {
		if (!isObject(value.category)) {
			c.add('INVALID_VALUE', at('category'));
		} else {
			c.keys(value.category, ['name', 'colour'], at('category'));
			if (c.required(value.category, 'name', at('category'))) {
				localizedTexts(c, value.category.name, at('category.name'), defaultLocale);
			}
			if (c.required(value.category, 'colour', at('category'))) {
				// 色相 0–360，或設計器的 RGB 十六進位色碼 #rrggbb
				if (typeof value.category.colour === 'string') {
					c.string(value.category.colour, at('category.colour'), HEX_COLOUR);
				} else {
					c.number(value.category.colour, at('category.colour'), 0, 360);
				}
			}
		}
	}
	const blocks = new Map<string, Set<string>>();
	if (value.blocks !== undefined) {
		if (!Array.isArray(value.blocks) || value.blocks.length === 0 || value.blocks.length > MAX_BLOCKS) {
			c.add('INVALID_VALUE', at('blocks'));
		} else {
			value.blocks.forEach((block, index) => {
				const result = validateBlock(c, block, at(`blocks[${index}]`), defaultLocale);
				if (result.name) {
					if (blocks.has(result.name)) {
						c.add('DUPLICATE_NAME', at(`blocks[${index}].name`));
					}
					blocks.set(result.name, result.inputs);
				}
			});
		}
	}
	if (value.targets !== undefined) {
		if (!isObject(value.targets) || Object.keys(value.targets).length === 0) {
			c.add('INVALID_VALUE', at('targets'));
		} else {
			for (const board of Object.keys(value.targets)) {
				if (!(BLOCK_PACK_BOARDS as readonly string[]).includes(board)) {
					c.add('UNSUPPORTED_BOARD', at(`targets.${board}`));
				}
			}
			for (const board of BLOCK_PACK_BOARDS) {
				if (value.targets[board] !== undefined) {
					validateTarget(c, value.targets[board], at(`targets.${board}`), blocks);
				}
			}
		}
	}
}

/** 驗證單一積木包物件（純函式） */
export function validateBlockPack(value: unknown): BlockPackValidationResult {
	const c = new Collector();
	collectPack(c, value, '', PACK_KEYS);
	return c.errors.length === 0 ? { ok: true, pack: value as BlockPack } : { ok: false, errors: c.errors };
}

/** 從檔案文字解析並驗證積木包 */
export function parseBlockPack(text: string): BlockPackValidationResult {
	if (Buffer.byteLength(text, 'utf8') > BLOCK_PACK_MAX_BYTES) {
		return { ok: false, errors: [{ code: 'INVALID_JSON', path: '' }] };
	}
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		return { ok: false, errors: [{ code: 'INVALID_JSON', path: '' }] };
	}
	return validateBlockPack(value);
}

/** 驗證專案工作區內的積木包快照（workspace.customBlocks） */
export function validateBlockPackSnapshot(value: unknown): { ok: true; snapshot: BlockPackSnapshot } | { ok: false; errors: BlockPackError[] } {
	const c = new Collector();
	if (!isObject(value) || value.formatVersion !== 1 || !Array.isArray(value.packs)) {
		c.add('INVALID_VALUE', 'customBlocks');
		return { ok: false, errors: c.errors };
	}
	c.keys(value, ['formatVersion', 'packs'], 'customBlocks');
	const ids = new Set<string>();
	value.packs.forEach((pack: unknown, index: number) => {
		const path = `customBlocks.packs[${index}]`;
		collectPack(c, pack, path, INSTALLED_KEYS);
		const id = isObject(pack) ? pack.id : undefined;
		if (typeof id === 'string') {
			if (ids.has(id)) {
				c.add('DUPLICATE_NAME', `${path}.id`);
			}
			ids.add(id);
		}
	});
	return c.errors.length === 0
		? { ok: true, snapshot: { formatVersion: 1, packs: value.packs as InstalledBlockPack[] } }
		: { ok: false, errors: c.errors };
}

/** 積木包是否需要下載第三方函式庫 */
export function blockPackLibDeps(pack: BlockPack): string[] {
	return BLOCK_PACK_BOARDS.flatMap(board => pack.targets[board]?.libDeps || []);
}
