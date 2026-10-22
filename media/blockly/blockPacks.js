/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

/**
 * 積木包（ESP32 第一版）：快照存在 Blockly 工作區序列化狀態的 customBlocks 區段，
 * 載入時動態註冊積木與 Arduino 產生器。模板只做字串替換，不執行作者程式。
 * 格式與驗證規則見 specs/072-esp32-block-packs/。
 */
(function () {
	const SUPPORTED_BOARD = 'esp32';
	const SERIALIZER_NAME = 'customBlocks';
	const SERIALIZER_PRIORITY = 200; // 高於 blocks（50），積木型別先註冊再反序列化
	const TYPE_PREFIX = 'pack_';
	const PLACEHOLDER_STATEMENT = 'block_pack_placeholder_statement';
	const PLACEHOLDER_VALUE = 'block_pack_placeholder_value';
	const INPUT_ONLY_PINS = new Set(['34', '35', '36', '39']);
	const PACK_ID = /^[a-z][a-z0-9_]{1,31}$/;
	const BLOCK_NAME = /^[a-z][a-z0-9_]{0,31}$/;
	const INPUT_NAME = /^[A-Z][A-Z0-9_]{0,31}$/;
	const LABEL_TOKEN = /\{([A-Z][A-Z0-9_]{0,31})\}/g;
	const TEMPLATE_TOKEN = /\{\{([A-Z][A-Z0-9_]{0,31})\}\}/g;
	const FALLBACK_VALUES = { Number: '0', Boolean: 'false', String: '""' };

	const Blockly = window.Blockly;
	const workspaceStates = new WeakMap();
	/** @type {Map<string, {pack: object, block: object}>} 目前註冊中的積木包型別 */
	const registeredTypes = new Map();

	function message(key, fallback) {
		return window.languageManager && typeof window.languageManager.getMessage === 'function'
			? window.languageManager.getMessage(key, fallback)
			: fallback;
	}

	function currentLanguage() {
		return (window.languageManager && window.languageManager.currentLanguage) || 'en';
	}

	/** 依目前語系 → en → defaultLocale 取文字 */
	function localize(text, pack) {
		if (typeof text === 'string') return text;
		if (!text || typeof text !== 'object') return '';
		const language = currentLanguage();
		for (const locale of [language, 'en', pack && pack.defaultLocale]) {
			if (locale && typeof text[locale] === 'string') return text[locale];
		}
		const first = Object.values(text).find(value => typeof value === 'string');
		return first || '';
	}

	function blockType(packId, blockName) {
		return `${TYPE_PREFIX}${packId}_${blockName}`;
	}

	function isPackBlockType(type) {
		return typeof type === 'string' && type.startsWith(TYPE_PREFIX);
	}

	function packTarget(pack) {
		return pack && pack.targets && pack.targets[SUPPORTED_BOARD];
	}

	/**
	 * WebView 端只做防禦性檢查（完整規則由 Extension Host 驗證）：
	 * 結構不完整的積木包略過，不讓整個工作區載入失敗。
	 */
	function isUsablePack(pack) {
		const target = packTarget(pack);
		return Boolean(
			pack &&
				typeof pack === 'object' &&
				PACK_ID.test(String(pack.id)) &&
				Array.isArray(pack.blocks) &&
				target &&
				target.blocks &&
				typeof target.blocks === 'object' &&
				pack.blocks.every(
					block =>
						block &&
						BLOCK_NAME.test(String(block.name)) &&
						typeof target.blocks[block.name] === 'string' &&
						(block.inputs || []).every(input => input && INPUT_NAME.test(String(input.name)))
				)
		);
	}

	function normalizeSnapshot(state) {
		if (!state || typeof state !== 'object' || !Array.isArray(state.packs)) return [];
		const seen = new Set();
		return state.packs.filter(pack => {
			if (!isUsablePack(pack) || seen.has(pack.id)) {
				if (typeof log !== 'undefined') log.warn(`[blockPacks] 略過無法使用的積木包：${pack && pack.id}`);
				return false;
			}
			seen.add(pack.id);
			return true;
		});
	}

	// ===== 積木定義 =====

	function pinOptions(input) {
		const config = (window.BOARD_CONFIGS && window.BOARD_CONFIGS[SUPPORTED_BOARD]) || {};
		const pins = (input.mode === 'analog' ? config.analogPins : config.digitalPins) || [];
		const filtered = pins.filter(([, value]) => input.direction !== 'output' || !INPUT_ONLY_PINS.has(String(value)));
		return filtered.length > 0 ? filtered.map(([label, value]) => [label, String(value)]) : [['GPIO2', '2']];
	}

	function inputArg(input, pack) {
		switch (input.kind) {
			case 'value':
				return { type: 'input_value', name: input.name, check: input.check || null };
			case 'statement':
				return { type: 'input_statement', name: input.name };
			case 'number': {
				const arg = { type: 'field_number', name: input.name, value: Number(input.default) || 0 };
				if (typeof input.min === 'number') arg.min = input.min;
				if (typeof input.max === 'number') arg.max = input.max;
				if (typeof input.precision === 'number') arg.precision = input.precision;
				return arg;
			}
			case 'text':
				return { type: 'field_input', name: input.name, text: String(input.default ?? '') };
			case 'dropdown':
				return {
					type: 'field_dropdown',
					name: input.name,
					options: (input.options || []).map(([label, value]) => [localize(label, pack) || String(value), String(value)]),
				};
			case 'pin':
				return { type: 'field_dropdown', name: input.name, options: pinOptions(input) };
			default:
				return { type: 'input_dummy' };
		}
	}

	/** 把 `{NAME}` 標籤轉成 Blockly jsonInit 的 message0／args0 */
	function blockJson(pack, block) {
		const label = localize(block.label, pack);
		const inputs = new Map((block.inputs || []).map(input => [input.name, input]));
		const args = [];
		let lastIndex = 0;
		let message0 = '';
		LABEL_TOKEN.lastIndex = 0;
		for (let match = LABEL_TOKEN.exec(label); match; match = LABEL_TOKEN.exec(label)) {
			const input = inputs.get(match[1]);
			message0 += label.slice(lastIndex, match.index).replace(/%/g, '%%');
			lastIndex = match.index + match[0].length;
			if (!input) {
				message0 += match[0];
				continue;
			}
			args.push(inputArg(input, pack));
			message0 += `%${args.length}`;
		}
		message0 += label.slice(lastIndex).replace(/%/g, '%%');

		const json = {
			type: blockType(pack.id, block.name),
			message0: message0.trim() || block.name,
			args0: args,
			colour: Number(pack.category && pack.category.colour) || 0,
			tooltip: localize(block.tooltip, pack),
			inputsInline: !(block.inputs || []).some(input => input.kind === 'statement'),
		};
		if (block.shape === 'value') {
			json.output = block.output || null;
		} else {
			json.previousStatement = null;
			json.nextStatement = null;
		}
		return json;
	}

	function updateOrphanWarning(event) {
		if (!this.workspace || this.workspace.isFlyout) return;
		if (
			event &&
			event.type !== Blockly.Events.BLOCK_MOVE &&
			event.type !== Blockly.Events.BLOCK_CREATE &&
			event.type !== Blockly.Events.FINISHED_LOADING
		) {
			return;
		}
		const orphan = typeof window.isInAllowedContext === 'function' && !window.isInAllowedContext(this);
		this.setWarningText(
			orphan
				? message('ORPHAN_BLOCK_WARNING_ARDUINO', 'This block must be placed inside setup(), loop(), or a function to generate code.')
				: null,
			'block-pack-orphan'
		);
	}

	// ===== 產生器 =====

	function cppString(value) {
		return `"${String(value)
			.replace(/\\/g, '\\\\')
			.replace(/"/g, '\\"')
			.replace(/\r/g, '\\r')
			.replace(/\n/g, '\\n')
			.replace(/\t/g, '\\t')}"`;
	}

	function fallbackValue(input) {
		if (input.default === undefined) return FALLBACK_VALUES[input.check] || '0';
		return typeof input.default === 'number' ? String(input.default) : cppString(input.default);
	}

	function pickOption(value, options) {
		const values = options.map(([, optionValue]) => String(optionValue));
		return values.includes(String(value)) ? String(value) : values[0] || '0';
	}

	function inputCode(generator, block, input, pack) {
		switch (input.kind) {
			case 'value': {
				const code = generator.valueToCode(block, input.name, generator.ORDER_NONE);
				return `(${code || fallbackValue(input)})`;
			}
			case 'statement':
				return generator.statementToCode(block, input.name);
			case 'number': {
				let value = Number(block.getFieldValue(input.name));
				if (!Number.isFinite(value)) value = Number(input.default) || 0;
				if (typeof input.min === 'number') value = Math.max(input.min, value);
				if (typeof input.max === 'number') value = Math.min(input.max, value);
				return String(value);
			}
			case 'text':
				return cppString(block.getFieldValue(input.name) ?? '');
			case 'dropdown':
				return pickOption(block.getFieldValue(input.name), input.options || []);
			case 'pin':
				return pickOption(block.getFieldValue(input.name), pinOptions(input));
			default:
				return '';
		}
	}

	/** 識別字後接一組完整括號（例如 `f(a, b)`）視為原子運算式，不再外加括號 */
	function isCallExpression(code) {
		const open = code.indexOf('(');
		if (open <= 0 || !/^[A-Za-z_][A-Za-z0-9_:.>-]*$/.test(code.slice(0, open)) || !code.endsWith(')')) return false;
		let depth = 0;
		for (let index = open; index < code.length; index++) {
			if (code[index] === '(') depth++;
			if (code[index] === ')' && --depth === 0) return index === code.length - 1;
		}
		return false;
	}

	/** 積木包層級的 include、全域宣告、setup 與函式庫，每次產生只輸出一次 */
	function addPackSupport(generator, pack) {
		const target = packTarget(pack);
		if (!target) return;
		for (const header of target.includes || []) {
			generator.includes_[`blockpack_include_${header}`] = `#include <${header}>`;
		}
		if (target.globals && generator.definitions_) {
			const globals = target.globals.endsWith('\n') ? target.globals : `${target.globals}\n`;
			generator.definitions_[`blockpack_${pack.id}`] = `// Block pack: ${pack.id} ${pack.version || ''}\n${globals}\n`;
		}
		if (target.setup && Array.isArray(generator.setupCode_)) {
			const lines = target.setup.replace(/\s+$/, '').split('\n');
			const entry = [`// Block pack: ${pack.id}`, ...lines].join('\n  ');
			if (!generator.setupCode_.includes(entry)) generator.setupCode_.push(entry);
		}
		if (Array.isArray(target.libDeps) && target.libDeps.length > 0) {
			if (!Array.isArray(generator.lib_deps_)) generator.lib_deps_ = [];
			for (const dependency of target.libDeps) {
				if (!generator.lib_deps_.includes(dependency)) generator.lib_deps_.push(dependency);
			}
		}
	}

	function unsupportedCode(generator, block, type) {
		const note = `[block pack] ${type} is not supported on this board`;
		if (block.shape === 'value') {
			return [`${FALLBACK_VALUES[block.output] || '0'} /* ${note} */`, generator.ORDER_ATOMIC];
		}
		return `// ${note}\n`;
	}

	function makeGenerator(pack, packBlock) {
		const type = blockType(pack.id, packBlock.name);
		return function (block) {
			const generator = window.arduinoGenerator;
			if (window.getCurrentBoard() !== SUPPORTED_BOARD) return unsupportedCode(generator, packBlock, type);
			if (!generator.isInAllowedContext(block)) {
				return packBlock.shape === 'value'
					? [FALLBACK_VALUES[packBlock.output] || '0', generator.ORDER_ATOMIC]
					: `// [Skipped] ${type} must be inside setup(), loop(), or a function\n`;
			}
			addPackSupport(generator, pack);
			const values = Object.create(null);
			for (const input of packBlock.inputs || []) {
				values[input.name] = inputCode(generator, block, input, pack);
			}
			const template = packTarget(pack).blocks[packBlock.name];
			const code = template.replace(TEMPLATE_TOKEN, (token, name) => (name in values ? values[name] : token));
			if (packBlock.shape === 'value') {
				const expression = code.trim();
				return [isCallExpression(expression) ? expression : `(${expression})`, generator.ORDER_ATOMIC];
			}
			return code.endsWith('\n') ? code : `${code}\n`;
		};
	}

	// ===== 註冊 =====

	function unregisterType(type) {
		delete Blockly.Blocks[type];
		if (window.arduinoGenerator && window.arduinoGenerator.forBlock) delete window.arduinoGenerator.forBlock[type];
		registeredTypes.delete(type);
	}

	/**
	 * 讓 Blockly 的積木型別與傳入的積木包完全一致：
	 * 註冊新型別、覆寫同名型別、移除不在清單中的積木包型別。
	 */
	function activatePacks(packs) {
		const usable = normalizeSnapshot({ packs });
		const nextTypes = new Map();
		for (const pack of usable) {
			for (const packBlock of pack.blocks) {
				nextTypes.set(blockType(pack.id, packBlock.name), { pack, block: packBlock });
			}
		}
		for (const type of [...registeredTypes.keys()]) {
			if (!nextTypes.has(type)) unregisterType(type);
		}
		for (const [type, entry] of nextTypes) {
			const json = () => blockJson(entry.pack, entry.block);
			Blockly.Blocks[type] = {
				init() {
					this.jsonInit(json());
				},
				onchange: updateOrphanWarning,
			};
			if (window.arduinoGenerator && window.arduinoGenerator.forBlock) {
				window.arduinoGenerator.forBlock[type] = makeGenerator(entry.pack, entry.block);
			}
			registeredTypes.set(type, entry);
		}
		return usable;
	}

	function getPacks(workspace) {
		return (workspace && workspaceStates.get(workspace)) || [];
	}

	function setPacks(workspace, packs) {
		const usable = activatePacks(packs || []);
		if (workspace) workspaceStates.set(workspace, usable);
		return usable;
	}

	function getPackForType(type) {
		const entry = registeredTypes.get(type);
		return entry ? entry.pack : null;
	}

	function getPackBlockForType(type) {
		const entry = registeredTypes.get(type);
		return entry ? entry.block : null;
	}

	// 產生程式前預先登記被使用的積木包，避免函式定義在 setup/loop 之後時 setup 程式遺失
	if (window.arduinoGenerator && !window.arduinoGenerator.blockPackInitWrapped_) {
		const generator = window.arduinoGenerator;
		const originalInit = generator.init;
		generator.init = function (workspace) {
			originalInit.call(this, workspace);
			if (!workspace || typeof window.getCurrentBoard !== 'function' || window.getCurrentBoard() !== SUPPORTED_BOARD) return;
			const packs = new Set();
			for (const block of workspace.getAllBlocks(false)) {
				const pack = getPackForType(block.type);
				if (pack && block.isEnabled() && !block.getInheritedDisabled() && generator.isInAllowedContext(block)) {
					packs.add(pack);
				}
			}
			packs.forEach(pack => addPackSupport(generator, pack));
		};
		generator.blockPackInitWrapped_ = true;
	}

	// ===== 佔位積木 =====

	function placeholderLabel(block) {
		const original = block.original_ && typeof block.original_.type === 'string' ? block.original_.type : '?';
		return `${message('BLOCK_PACK_PLACEHOLDER_LABEL', 'Missing block pack block')}: ${original}`;
	}

	function definePlaceholder(type, isValue) {
		Blockly.Blocks[type] = {
			init() {
				this.original_ = null;
				this.appendDummyInput('LABEL').appendField(new Blockly.FieldLabel(''), 'TEXT');
				if (isValue) {
					this.setOutput(true, null);
				} else {
					this.setPreviousStatement(true, null);
					this.setNextStatement(true, null);
				}
				this.setColour('#9e9e9e');
				this.setTooltip(
					message(
						'BLOCK_PACK_PLACEHOLDER_TOOLTIP',
						'This block comes from a block pack that is not in this project. Import the block pack again to restore it.'
					)
				);
			},
			saveExtraState() {
				return { original: this.original_ };
			},
			loadExtraState(state) {
				this.original_ = state && state.original && typeof state.original === 'object' ? state.original : null;
				this.setFieldValue(placeholderLabel(this), 'TEXT');
			},
			onchange(event) {
				if (!this.workspace || this.workspace.isFlyout) return;
				if (event && event.type !== Blockly.Events.FINISHED_LOADING && event.type !== Blockly.Events.BLOCK_CREATE) return;
				this.setWarningText(
					message('BLOCK_PACK_PLACEHOLDER_WARNING', 'Import the block pack again to restore this block. It does not generate code.'),
					'block-pack-placeholder'
				);
			},
		};
		if (window.arduinoGenerator && window.arduinoGenerator.forBlock) {
			window.arduinoGenerator.forBlock[type] = function (block) {
				const original = block.original_ && block.original_.type ? block.original_.type : 'unknown';
				return isValue
					? [`0 /* [block pack] missing ${original} */`, window.arduinoGenerator.ORDER_ATOMIC]
					: `// [block pack] missing ${original}\n`;
			};
		}
	}

	definePlaceholder(PLACEHOLDER_STATEMENT, false);
	definePlaceholder(PLACEHOLDER_VALUE, true);

	function isPlaceholderType(type) {
		return type === PLACEHOLDER_STATEMENT || type === PLACEHOLDER_VALUE;
	}

	/** 判斷 parentType 的 inputName 是否為語句輸入；無法判斷時回傳 null */
	function isStatementInput(parentType, inputName, packsByType) {
		const packEntry = packsByType.get(parentType);
		if (packEntry) {
			const input = (packEntry.block.inputs || []).find(candidate => candidate.name === inputName);
			return input ? input.kind === 'statement' : null;
		}
		if (!Blockly.Blocks[parentType] || isPackBlockType(parentType)) return null;
		const probe = new Blockly.Workspace();
		try {
			const input = probe.newBlock(parentType).getInput(inputName);
			return input ? input.type === Blockly.inputs.inputTypes.STATEMENT : null;
		} catch {
			return null;
		} finally {
			probe.dispose();
		}
	}

	function cloneJson(value) {
		return JSON.parse(JSON.stringify(value));
	}

	/**
	 * Blockly 遇到未知型別會整個載入失敗，所以在載入前把專案中找不到定義的 pack_ 積木換成
	 * 形狀相同的佔位積木（完整原始狀態放在 extraState.original），積木包回來時再還原。
	 */
	function prepareState(state) {
		if (!state || typeof state !== 'object' || !state.blocks || !Array.isArray(state.blocks.blocks)) return state;
		const packsByType = new Map();
		for (const pack of normalizeSnapshot(state[SERIALIZER_NAME])) {
			for (const packBlock of pack.blocks) packsByType.set(blockType(pack.id, packBlock.name), { pack, block: packBlock });
		}

		const transform = (blockState, connection) => {
			if (!blockState || typeof blockState !== 'object') return blockState;
			let current = blockState;
			if (isPackBlockType(current.type) && !packsByType.has(current.type)) {
				const original = cloneJson(current);
				delete original.next;
				delete original.x;
				delete original.y;
				const isValue = connection === 'value';
				current = {
					type: isValue ? PLACEHOLDER_VALUE : PLACEHOLDER_STATEMENT,
					...(current.id !== undefined ? { id: current.id } : {}),
					...(current.x !== undefined ? { x: current.x, y: current.y } : {}),
					extraState: { original },
					...(current.next ? { next: current.next } : {}),
				};
			} else if (
				isPlaceholderType(current.type) &&
				current.extraState &&
				current.extraState.original &&
				packsByType.has(current.extraState.original.type)
			) {
				const restored = cloneJson(current.extraState.original);
				if (current.id !== undefined) restored.id = current.id;
				if (current.x !== undefined) {
					restored.x = current.x;
					restored.y = current.y;
				}
				if (current.next) restored.next = current.next;
				else delete restored.next;
				current = restored;
			}
			for (const [inputName, input] of Object.entries(current.inputs || {})) {
				if (!input || typeof input !== 'object') continue;
				const statement = isStatementInput(current.type, inputName, packsByType);
				const kind = statement === null ? (input.block && input.block.next ? 'statement' : 'value') : statement ? 'statement' : 'value';
				if (input.block) input.block = transform(input.block, kind);
				if (input.shadow) input.shadow = transform(input.shadow, kind);
			}
			if (current.next && current.next.block) current.next.block = transform(current.next.block, 'statement');
			return current;
		};

		state.blocks.blocks = state.blocks.blocks.map(block => transform(block, 'top'));
		return state;
	}

	/** 工作區中屬於某積木包的積木數（含佔位積木） */
	function countPackBlocks(workspace, packId, blockNames) {
		const prefix = `${TYPE_PREFIX}${packId}_`;
		const names = blockNames ? new Set(blockNames.map(name => blockType(packId, name))) : null;
		return workspace.getAllBlocks(false).filter(block => {
			const type = isPlaceholderType(block.type) ? block.original_ && block.original_.type : block.type;
			return typeof type === 'string' && type.startsWith(prefix) && (!names || names.has(type));
		}).length;
	}

	// ===== 工具箱、contract 與預覽 =====

	const PREFERRED_PINS = {
		digital: ['4', '5', '13', '14', '16', '17', '18', '19', '25', '26', '27', '32', '33', '23', '22', '21'],
		analog: ['34', '35', '32', '33', '36', '39'],
	};

	/** 工具箱中每個積木的腳位欄位預設用不同的常用腳位，避開開機用的 GPIO0 */
	function defaultPins(packBlock) {
		const used = new Set();
		const fields = {};
		for (const input of packBlock.inputs || []) {
			if (input.kind !== 'pin') continue;
			const allowed = pinOptions(input).map(([, value]) => value);
			const preferred = PREFERRED_PINS[input.mode === 'analog' ? 'analog' : 'digital'];
			const pin = preferred.find(value => allowed.includes(value) && !used.has(value)) || allowed[0];
			used.add(pin);
			fields[input.name] = pin;
		}
		return fields;
	}

	function toolboxBlock(pack, packBlock) {
		const item = { kind: 'block', type: blockType(pack.id, packBlock.name) };
		const fields = defaultPins(packBlock);
		if (Object.keys(fields).length > 0) item.fields = fields;
		const inputs = {};
		for (const input of packBlock.inputs || []) {
			if (input.kind !== 'value' || input.default === undefined) continue;
			inputs[input.name] =
				typeof input.default === 'number'
					? { shadow: { type: 'math_number', fields: { NUM: input.default } } }
					: { shadow: { type: 'text', fields: { TEXT: String(input.default) } } };
		}
		if (Object.keys(inputs).length > 0) item.inputs = inputs;
		return item;
	}

	function toolboxCategories(packs) {
		return (packs || []).map(pack => ({
			kind: 'category',
			name: localize(pack.category && pack.category.name, pack) || pack.id,
			colour: String(Number(pack.category && pack.category.colour) || 0),
			contents: pack.blocks.map(packBlock => toolboxBlock(pack, packBlock)),
		}));
	}

	/** 外部候選驗證用的 contract 條目；積木包積木在所有 Arduino 板子都可載入（非 ESP32 顯示警告） */
	function contractEntries(packs, boards) {
		const boardIds = (boards || []).filter(board => board.language === 'arduino').map(board => board.id);
		const entry = (type, fields) => {
			const variants = {};
			for (const board of boardIds) variants[board] = { fields };
			return { type, categories: ['block_packs'], boards: boardIds, variants };
		};
		const entries = [entry(PLACEHOLDER_STATEMENT, []), entry(PLACEHOLDER_VALUE, [])];
		for (const pack of normalizeSnapshot({ packs })) {
			for (const packBlock of pack.blocks) {
				const fields = [];
				for (const input of packBlock.inputs || []) {
					if (input.kind === 'number') fields.push({ name: input.name, kind: 'number' });
					else if (input.kind === 'text') fields.push({ name: input.name, kind: 'text' });
					else if (input.kind === 'dropdown' || input.kind === 'pin') {
						const options = input.kind === 'pin' ? pinOptions(input) : input.options || [];
						fields.push({ name: input.name, kind: 'dropdown', optionsMode: 'static', options: options.map(([, value]) => String(value)) });
					}
				}
				entries.push(entry(blockType(pack.id, packBlock.name), fields));
			}
		}
		return entries;
	}

	/** 以預設值產生每個積木的 C++ 預覽（不需要工作區） */
	function previewCode(pack) {
		const target = packTarget(pack) || { blocks: {} };
		const lines = [];
		for (const header of target.includes || []) lines.push(`#include <${header}>`);
		if (lines.length > 0) lines.push('');
		if (target.globals) lines.push(target.globals.replace(/\s+$/, ''), '');
		if (target.setup) lines.push('void setup() {', ...target.setup.replace(/\s+$/, '').split('\n').map(line => `  ${line}`), '}', '');
		for (const packBlock of pack.blocks || []) {
			const pins = defaultPins(packBlock);
			const values = Object.create(null);
			for (const input of packBlock.inputs || []) {
				if (input.kind === 'pin') values[input.name] = pins[input.name];
				else if (input.kind === 'number') values[input.name] = String(Number(input.default) || 0);
				else if (input.kind === 'text') values[input.name] = cppString(input.default ?? '');
				else if (input.kind === 'dropdown') values[input.name] = String(((input.options || [])[0] || [])[1] ?? '');
				else if (input.kind === 'value') values[input.name] = `(${fallbackValue(input)})`;
				else if (input.kind === 'statement') values[input.name] = '  // ...\n';
			}
			const template = target.blocks[packBlock.name] || '';
			const code = template.replace(TEMPLATE_TOKEN, (token, name) => (name in values ? values[name] : token)).replace(/\s+$/, '');
			lines.push(`// ${localize(packBlock.label, pack).replace(LABEL_TOKEN, '[$1]')}`, packBlock.shape === 'value' ? `${code};` : code, '');
		}
		return lines.join('\n').replace(/\n+$/, '\n');
	}

	/** 讓編輯器在主工作區的積木包改變時重新整理工具箱 */
	function notifyLoaded(workspace) {
		if (typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') return;
		window.dispatchEvent(new CustomEvent('blockPacksLoaded', { detail: { workspace } }));
	}

	Blockly.serialization.registry.register(SERIALIZER_NAME, {
		priority: SERIALIZER_PRIORITY,
		save(workspace) {
			const packs = getPacks(workspace);
			return packs.length > 0 ? { formatVersion: 1, packs: JSON.parse(JSON.stringify(packs)) } : null;
		},
		load(state, workspace) {
			setPacks(workspace, normalizeSnapshot(state));
			notifyLoaded(workspace);
		},
		clear(workspace) {
			const hadPacks = getPacks(workspace).length > 0;
			workspaceStates.delete(workspace);
			if (hadPacks) notifyLoaded(workspace);
		},
	});

	window.blockPacks = {
		SUPPORTED_BOARD,
		PLACEHOLDER_STATEMENT,
		PLACEHOLDER_VALUE,
		activatePacks,
		blockJson,
		blockType,
		contractEntries,
		countPackBlocks,
		getPackBlockForType,
		getPackForType,
		getPacks,
		isPackBlockType,
		isPlaceholderType,
		localize,
		normalizeSnapshot,
		pinOptions,
		prepareState,
		previewCode,
		setPacks,
		toolboxCategories,
	};
})();
