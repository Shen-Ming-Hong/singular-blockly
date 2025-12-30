/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 邏輯積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (logic.js)');
		return;
	}

	/**
	 * 條件判斷（if/elif/else）
	 */
	generator.forBlock['controls_if'] = function (block) {
		let code = '';
		const condition0 = generator.valueToCode(block, 'IF0', generator.ORDER_NONE) || 'False';
		let branch0 = generator.statementToCode(block, 'DO0');
		branch0 = branch0 || generator.INDENT + 'pass\n';

		code += 'if ' + condition0 + ':\n' + branch0;

		// 處理 elif 分支
		for (let i = 1; i <= block.elseifCount_; i++) {
			const condition = generator.valueToCode(block, 'IF' + i, generator.ORDER_NONE) || 'False';
			let branch = generator.statementToCode(block, 'DO' + i);
			branch = branch || generator.INDENT + 'pass\n';
			code += 'elif ' + condition + ':\n' + branch;
		}

		// 處理 else 分支
		if (block.elseCount_) {
			let branch = generator.statementToCode(block, 'ELSE');
			branch = branch || generator.INDENT + 'pass\n';
			code += 'else:\n' + branch;
		}

		return code;
	};

	/**
	 * 布林值
	 */
	generator.forBlock['logic_boolean'] = function (block) {
		const code = block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False';
		return [code, generator.ORDER_ATOMIC];
	};

	/**
	 * 否定
	 */
	generator.forBlock['logic_negate'] = function (block) {
		const value = generator.valueToCode(block, 'BOOL', generator.ORDER_LOGICAL_NOT) || 'True';
		return ['not ' + value, generator.ORDER_LOGICAL_NOT];
	};

	/**
	 * 比較運算
	 */
	generator.forBlock['logic_compare'] = function (block) {
		const OPERATORS = {
			EQ: '==',
			NEQ: '!=',
			LT: '<',
			LTE: '<=',
			GT: '>',
			GTE: '>=',
		};
		const operator = OPERATORS[block.getFieldValue('OP')];
		const order = generator.ORDER_RELATIONAL;
		const argument0 = generator.valueToCode(block, 'A', order) || '0';
		const argument1 = generator.valueToCode(block, 'B', order) || '0';
		const code = argument0 + ' ' + operator + ' ' + argument1;
		return [code, order];
	};

	/**
	 * 邏輯運算（AND/OR）
	 */
	generator.forBlock['logic_operation'] = function (block) {
		const operator = block.getFieldValue('OP') === 'AND' ? 'and' : 'or';
		const order = operator === 'and' ? generator.ORDER_LOGICAL_AND : generator.ORDER_LOGICAL_OR;
		let argument0 = generator.valueToCode(block, 'A', order) || 'False';
		let argument1 = generator.valueToCode(block, 'B', order) || 'False';
		const code = argument0 + ' ' + operator + ' ' + argument1;
		return [code, order];
	};

	/**
	 * 三元條件運算
	 */
	generator.forBlock['logic_ternary'] = function (block) {
		const condition = generator.valueToCode(block, 'IF', generator.ORDER_CONDITIONAL) || 'False';
		const thenValue = generator.valueToCode(block, 'THEN', generator.ORDER_CONDITIONAL) || 'None';
		const elseValue = generator.valueToCode(block, 'ELSE', generator.ORDER_CONDITIONAL) || 'None';
		const code = thenValue + ' if ' + condition + ' else ' + elseValue;
		return [code, generator.ORDER_CONDITIONAL];
	};

	/**
	 * 空值
	 */
	generator.forBlock['logic_null'] = function (block) {
		return ['None', generator.ORDER_ATOMIC];
	};

	console.log('[blockly] MicroPython 邏輯生成器已載入');
})();
