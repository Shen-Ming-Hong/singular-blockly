/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 文字積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (text.js)');
		return;
	}

	/**
	 * 文字
	 */
	generator.forBlock['text'] = function (block) {
		const code = generator.quote_(block.getFieldValue('TEXT'));
		return [code, generator.ORDER_ATOMIC];
	};

	/**
	 * 多行文字
	 */
	generator.forBlock['text_multiline'] = function (block) {
		const code = generator.multiline_quote_(block.getFieldValue('TEXT'));
		return [code, generator.ORDER_ATOMIC];
	};

	/**
	 * 文字連接
	 */
	generator.forBlock['text_join'] = function (block) {
		const itemCount = block.itemCount_;
		if (itemCount === 0) {
			return ["''", generator.ORDER_ATOMIC];
		} else if (itemCount === 1) {
			const element = generator.valueToCode(block, 'ADD0', generator.ORDER_NONE) || "''";
			return ['str(' + element + ')', generator.ORDER_FUNCTION_CALL];
		} else {
			const elements = new Array(itemCount);
			for (let i = 0; i < itemCount; i++) {
				elements[i] = generator.valueToCode(block, 'ADD' + i, generator.ORDER_NONE) || "''";
			}
			const code = "''.join([str(x) for x in [" + elements.join(', ') + ']])';
			return [code, generator.ORDER_FUNCTION_CALL];
		}
	};

	/**
	 * 文字長度
	 */
	generator.forBlock['text_length'] = function (block) {
		const text = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || "''";
		return ['len(' + text + ')', generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 文字是否為空
	 */
	generator.forBlock['text_isEmpty'] = function (block) {
		const text = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || "''";
		const code = 'not len(' + text + ')';
		return [code, generator.ORDER_LOGICAL_NOT];
	};

	/**
	 * 在文字中尋找
	 */
	generator.forBlock['text_indexOf'] = function (block) {
		const operator = block.getFieldValue('END') === 'FIRST' ? 'find' : 'rfind';
		const substring = generator.valueToCode(block, 'FIND', generator.ORDER_NONE) || "''";
		const text = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || "''";
		const code = text + '.' + operator + '(' + substring + ') + 1';
		return [code, generator.ORDER_ADDITIVE];
	};

	/**
	 * 取得字元
	 */
	generator.forBlock['text_charAt'] = function (block) {
		const where = block.getFieldValue('WHERE') || 'FROM_START';
		const text = generator.valueToCode(block, 'VALUE', generator.ORDER_MEMBER) || "''";
		let code;

		switch (where) {
			case 'FIRST':
				code = text + '[0]';
				break;
			case 'LAST':
				code = text + '[-1]';
				break;
			case 'FROM_START':
				const at = generator.valueToCode(block, 'AT', generator.ORDER_NONE) || '1';
				code = text + '[int(' + at + ') - 1]';
				break;
			case 'FROM_END':
				const atEnd = generator.valueToCode(block, 'AT', generator.ORDER_NONE) || '1';
				code = text + '[-int(' + atEnd + ')]';
				break;
			case 'RANDOM':
				generator.addImport('import random');
				code = 'random.choice(' + text + ')';
				break;
			default:
				throw Error('Unknown location: ' + where);
		}
		return [code, generator.ORDER_MEMBER];
	};

	/**
	 * 取得子字串
	 */
	generator.forBlock['text_getSubstring'] = function (block) {
		const text = generator.valueToCode(block, 'STRING', generator.ORDER_MEMBER) || "''";
		const where1 = block.getFieldValue('WHERE1');
		const where2 = block.getFieldValue('WHERE2');

		let at1, at2;

		switch (where1) {
			case 'FROM_START':
				at1 = 'int(' + (generator.valueToCode(block, 'AT1', generator.ORDER_NONE) || '1') + ') - 1';
				break;
			case 'FROM_END':
				at1 = '-int(' + (generator.valueToCode(block, 'AT1', generator.ORDER_NONE) || '1') + ')';
				break;
			case 'FIRST':
				at1 = '0';
				break;
			default:
				throw Error('Unknown start location: ' + where1);
		}

		switch (where2) {
			case 'FROM_START':
				at2 = 'int(' + (generator.valueToCode(block, 'AT2', generator.ORDER_NONE) || '1') + ')';
				break;
			case 'FROM_END':
				at2 = '-int(' + (generator.valueToCode(block, 'AT2', generator.ORDER_NONE) || '1') + ') + 1 or None';
				break;
			case 'LAST':
				at2 = '';
				break;
			default:
				throw Error('Unknown end location: ' + where2);
		}

		const code = text + '[' + at1 + ':' + at2 + ']';
		return [code, generator.ORDER_MEMBER];
	};

	/**
	 * 變更大小寫
	 */
	generator.forBlock['text_changeCase'] = function (block) {
		const OPERATORS = {
			UPPERCASE: '.upper()',
			LOWERCASE: '.lower()',
			TITLECASE: '.title()',
		};
		const operator = OPERATORS[block.getFieldValue('CASE')];
		const text = generator.valueToCode(block, 'TEXT', generator.ORDER_MEMBER) || "''";
		const code = text + operator;
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 修剪空白
	 */
	generator.forBlock['text_trim'] = function (block) {
		const OPERATORS = {
			LEFT: '.lstrip()',
			RIGHT: '.rstrip()',
			BOTH: '.strip()',
		};
		const operator = OPERATORS[block.getFieldValue('MODE')];
		const text = generator.valueToCode(block, 'TEXT', generator.ORDER_MEMBER) || "''";
		const code = text + operator;
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列印（輸出到 Console）
	 */
	generator.forBlock['text_print'] = function (block) {
		const msg = generator.valueToCode(block, 'TEXT', generator.ORDER_NONE) || "''";
		return 'print(' + msg + ')\n';
	};

	/**
	 * 提示輸入（MicroPython 使用 input）
	 */
	generator.forBlock['text_prompt_ext'] = function (block) {
		const msg = generator.valueToCode(block, 'TEXT', generator.ORDER_NONE) || "''";
		const code = 'input(' + msg + ')';

		// 如果需要數字，進行轉換
		const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
		if (toNumber) {
			return ['float(' + code + ')', generator.ORDER_FUNCTION_CALL];
		}
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 文字計數
	 */
	generator.forBlock['text_count'] = function (block) {
		const text = generator.valueToCode(block, 'TEXT', generator.ORDER_MEMBER) || "''";
		const sub = generator.valueToCode(block, 'SUB', generator.ORDER_NONE) || "''";
		const code = text + '.count(' + sub + ')';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 文字替換
	 */
	generator.forBlock['text_replace'] = function (block) {
		const text = generator.valueToCode(block, 'TEXT', generator.ORDER_MEMBER) || "''";
		const from = generator.valueToCode(block, 'FROM', generator.ORDER_NONE) || "''";
		const to = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || "''";
		const code = text + '.replace(' + from + ', ' + to + ')';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 文字反轉
	 */
	generator.forBlock['text_reverse'] = function (block) {
		const text = generator.valueToCode(block, 'TEXT', generator.ORDER_MEMBER) || "''";
		const code = text + '[::-1]';
		return [code, generator.ORDER_MEMBER];
	};

	console.log('[blockly] MicroPython 文字生成器已載入');
})();
