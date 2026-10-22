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

	Blockly.serialization.registry.register(SERIALIZER_NAME, {
		priority: SERIALIZER_PRIORITY,
		save(workspace) {
			const packs = getPacks(workspace);
			return packs.length > 0 ? { formatVersion: 1, packs: JSON.parse(JSON.stringify(packs)) } : null;
		},
		load(state, workspace) {
			setPacks(workspace, normalizeSnapshot(state));
		},
		clear(workspace) {
			workspaceStates.delete(workspace);
		},
	});

	window.blockPacks = {
		SUPPORTED_BOARD,
		PLACEHOLDER_STATEMENT,
		PLACEHOLDER_VALUE,
		activatePacks,
		blockJson,
		blockType,
		getPackBlockForType,
		getPackForType,
		getPacks,
		isPackBlockType,
		localize,
		pinOptions,
		setPacks,
	};
})();
