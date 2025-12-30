/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 數學積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (math.js)');
		return;
	}

	/**
	 * 數字
	 */
	generator.forBlock['math_number'] = function (block) {
		const code = Number(block.getFieldValue('NUM'));
		const order = code >= 0 ? generator.ORDER_ATOMIC : generator.ORDER_UNARY_SIGN;
		return [code, order];
	};

	/**
	 * 算術運算
	 */
	generator.forBlock['math_arithmetic'] = function (block) {
		const OPERATORS = {
			ADD: [' + ', generator.ORDER_ADDITIVE],
			MINUS: [' - ', generator.ORDER_ADDITIVE],
			MULTIPLY: [' * ', generator.ORDER_MULTIPLICATIVE],
			DIVIDE: [' / ', generator.ORDER_MULTIPLICATIVE],
			POWER: [' ** ', generator.ORDER_EXPONENTIATION],
		};
		const tuple = OPERATORS[block.getFieldValue('OP')];
		const operator = tuple[0];
		const order = tuple[1];
		const argument0 = generator.valueToCode(block, 'A', order) || '0';
		const argument1 = generator.valueToCode(block, 'B', order) || '0';
		const code = argument0 + operator + argument1;
		return [code, order];
	};

	/**
	 * 單一數學函數
	 */
	generator.forBlock['math_single'] = function (block) {
		const operator = block.getFieldValue('OP');
		let code;
		let arg = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';

		switch (operator) {
			case 'ROOT':
				generator.addImport('import math');
				code = 'math.sqrt(' + arg + ')';
				break;
			case 'ABS':
				code = 'abs(' + arg + ')';
				break;
			case 'NEG':
				code = '-' + arg;
				break;
			case 'LN':
				generator.addImport('import math');
				code = 'math.log(' + arg + ')';
				break;
			case 'LOG10':
				generator.addImport('import math');
				code = 'math.log10(' + arg + ')';
				break;
			case 'EXP':
				generator.addImport('import math');
				code = 'math.exp(' + arg + ')';
				break;
			case 'POW10':
				code = '10 ** ' + arg;
				break;
			default:
				throw Error('Unknown math operator: ' + operator);
		}
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 三角函數
	 */
	generator.forBlock['math_trig'] = function (block) {
		const OPERATORS = {
			SIN: 'math.sin',
			COS: 'math.cos',
			TAN: 'math.tan',
			ASIN: 'math.asin',
			ACOS: 'math.acos',
			ATAN: 'math.atan',
		};
		const operator = OPERATORS[block.getFieldValue('OP')];
		generator.addImport('import math');
		const argument0 = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';

		// 角度轉弧度
		let code;
		if (block.getFieldValue('OP').startsWith('A')) {
			// 反三角函數，結果需要轉換為角度
			code = operator + '(' + argument0 + ') / math.pi * 180';
		} else {
			// 三角函數，輸入需要轉換為弧度
			code = operator + '(' + argument0 + ' / 180 * math.pi)';
		}
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 常數
	 */
	generator.forBlock['math_constant'] = function (block) {
		const CONSTANTS = {
			PI: ['math.pi', generator.ORDER_MEMBER],
			E: ['math.e', generator.ORDER_MEMBER],
			GOLDEN_RATIO: ['(1 + math.sqrt(5)) / 2', generator.ORDER_MULTIPLICATIVE],
			SQRT2: ['math.sqrt(2)', generator.ORDER_FUNCTION_CALL],
			SQRT1_2: ['math.sqrt(0.5)', generator.ORDER_FUNCTION_CALL],
			INFINITY: ['float("inf")', generator.ORDER_FUNCTION_CALL],
		};
		const constant = block.getFieldValue('CONSTANT');
		if (constant !== 'INFINITY') {
			generator.addImport('import math');
		}
		return CONSTANTS[constant];
	};

	/**
	 * 數字檢查
	 */
	generator.forBlock['math_number_property'] = function (block) {
		const property = block.getFieldValue('PROPERTY');
		const number = generator.valueToCode(block, 'NUMBER_TO_CHECK', generator.ORDER_NONE) || '0';
		let code;

		switch (property) {
			case 'EVEN':
				code = number + ' % 2 == 0';
				break;
			case 'ODD':
				code = number + ' % 2 == 1';
				break;
			case 'PRIME':
				// 簡單的質數檢查函數
				generator.addFunction(
					'is_prime',
					`def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True`
				);
				code = 'is_prime(' + number + ')';
				break;
			case 'WHOLE':
				code = number + ' % 1 == 0';
				break;
			case 'POSITIVE':
				code = number + ' > 0';
				break;
			case 'NEGATIVE':
				code = number + ' < 0';
				break;
			case 'DIVISIBLE_BY':
				const divisor = generator.valueToCode(block, 'DIVISOR', generator.ORDER_NONE) || '1';
				code = number + ' % ' + divisor + ' == 0';
				break;
			default:
				throw Error('Unknown property: ' + property);
		}
		return [code, generator.ORDER_RELATIONAL];
	};

	/**
	 * 取整函數
	 */
	generator.forBlock['math_round'] = function (block) {
		const operator = block.getFieldValue('OP');
		const argument0 = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';
		let code;

		switch (operator) {
			case 'ROUND':
				code = 'round(' + argument0 + ')';
				break;
			case 'ROUNDUP':
				generator.addImport('import math');
				code = 'math.ceil(' + argument0 + ')';
				break;
			case 'ROUNDDOWN':
				generator.addImport('import math');
				code = 'math.floor(' + argument0 + ')';
				break;
			default:
				throw Error('Unknown rounding operator: ' + operator);
		}
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 求餘數
	 */
	generator.forBlock['math_modulo'] = function (block) {
		const argument0 = generator.valueToCode(block, 'DIVIDEND', generator.ORDER_MULTIPLICATIVE) || '0';
		const argument1 = generator.valueToCode(block, 'DIVISOR', generator.ORDER_MULTIPLICATIVE) || '0';
		const code = argument0 + ' % ' + argument1;
		return [code, generator.ORDER_MULTIPLICATIVE];
	};

	/**
	 * 限制範圍
	 */
	generator.forBlock['math_constrain'] = function (block) {
		const argument0 = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '0';
		const argument1 = generator.valueToCode(block, 'LOW', generator.ORDER_NONE) || '0';
		const argument2 = generator.valueToCode(block, 'HIGH', generator.ORDER_NONE) || 'float("inf")';
		const code = 'max(min(' + argument0 + ', ' + argument2 + '), ' + argument1 + ')';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 隨機整數
	 */
	generator.forBlock['math_random_int'] = function (block) {
		generator.addImport('import random');
		const argument0 = generator.valueToCode(block, 'FROM', generator.ORDER_NONE) || '0';
		const argument1 = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || '0';
		const code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 隨機小數
	 */
	generator.forBlock['math_random_float'] = function (block) {
		generator.addImport('import random');
		return ['random.random()', generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 數學運算（對列表）
	 */
	generator.forBlock['math_on_list'] = function (block) {
		const func = block.getFieldValue('OP');
		const list = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
		let code;

		switch (func) {
			case 'SUM':
				code = 'sum(' + list + ')';
				break;
			case 'MIN':
				code = 'min(' + list + ')';
				break;
			case 'MAX':
				code = 'max(' + list + ')';
				break;
			case 'AVERAGE':
				code = 'sum(' + list + ') / len(' + list + ')';
				break;
			case 'MEDIAN':
				generator.addFunction(
					'median',
					`def median(lst):
    sorted_lst = sorted(lst)
    n = len(sorted_lst)
    if n % 2 == 1:
        return sorted_lst[n // 2]
    return (sorted_lst[n // 2 - 1] + sorted_lst[n // 2]) / 2`
				);
				code = 'median(' + list + ')';
				break;
			case 'MODE':
				generator.addFunction(
					'mode',
					`def mode(lst):
    counts = {}
    for item in lst:
        counts[item] = counts.get(item, 0) + 1
    max_count = max(counts.values())
    for item, count in counts.items():
        if count == max_count:
            return item`
				);
				code = 'mode(' + list + ')';
				break;
			case 'STD_DEV':
				generator.addImport('import math');
				generator.addFunction(
					'std_dev',
					`def std_dev(lst):
    avg = sum(lst) / len(lst)
    variance = sum((x - avg) ** 2 for x in lst) / len(lst)
    return math.sqrt(variance)`
				);
				code = 'std_dev(' + list + ')';
				break;
			case 'RANDOM':
				generator.addImport('import random');
				code = 'random.choice(' + list + ')';
				break;
			default:
				throw Error('Unknown operator: ' + func);
		}
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 數學映射（map）
	 */
	generator.forBlock['math_map'] = function (block) {
		const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '0';
		const fromLow = generator.valueToCode(block, 'FROMLOW', generator.ORDER_NONE) || '0';
		const fromHigh = generator.valueToCode(block, 'FROMHIGH', generator.ORDER_NONE) || '1023';
		const toLow = generator.valueToCode(block, 'TOLOW', generator.ORDER_NONE) || '0';
		const toHigh = generator.valueToCode(block, 'TOHIGH', generator.ORDER_NONE) || '255';

		// 定義 map 函數
		generator.addFunction(
			'map_value',
			`def map_value(x, in_min, in_max, out_min, out_max):
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min`
		);

		const code = `map_value(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	console.log('[blockly] MicroPython 數學生成器已載入');
})();
