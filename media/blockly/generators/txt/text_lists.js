/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller 文字、列表與列表數學積木生成器
 * 與 MicroPython 生成器使用相同的 Python 語意；TXT 執行於標準 CPython 3。
 */

'use strict';

(function () {
	const g = window.txtGenerator;
	if (!g) {
		console.error('[blockly] TXT 生成器尚未載入 (text_lists.js)');
		return;
	}

	/** 修改變數的積木在函數內需要 global 宣告，與 variables_set 相同 */
	function trackGlobal(varName) {
		const currentFunc = g.currentFunction_ || 'main';
		if (!g.functionGlobals_.has(currentFunc)) g.functionGlobals_.set(currentFunc, new Set());
		g.functionGlobals_.get(currentFunc).add(varName);
	}

	// 無效輸入回傳 0，與 Arduino String.toInt()/toFloat() 一致
	const TEXT_TO_INT = `def text_to_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0`;
	const TEXT_TO_FLOAT = `def text_to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0`;

	// ── Text ─────────────────────────────────────────────────────────────────

	g.forBlock['text_append'] = function (block) {
		const varName = g.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const value = g.valueToCode(block, 'TEXT', g.ORDER_NONE) || "''";
		trackGlobal(varName);
		return varName + ' = str(' + varName + ') + str(' + value + ')\n';
	};

	g.forBlock['text_to_number'] = function (block) {
		const text = g.valueToCode(block, 'TEXT', g.ORDER_NONE) || "''";
		if (block.getFieldValue('TYPE') === 'FLOAT') {
			g.addFunction('text_to_float', TEXT_TO_FLOAT);
			return ['text_to_float(' + text + ')', g.ORDER_FUNCTION_CALL];
		}
		g.addFunction('text_to_int', TEXT_TO_INT);
		return ['text_to_int(' + text + ')', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['to_string'] = function (block) {
		const value = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '0';
		return ['str(' + value + ')', g.ORDER_FUNCTION_CALL];
	};

	/**
	 * 在文字中尋找
	 */
	g.forBlock['text_indexOf'] = function (block) {
		const operator = block.getFieldValue('END') === 'FIRST' ? 'find' : 'rfind';
		const substring = g.valueToCode(block, 'FIND', g.ORDER_NONE) || "''";
		const text = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || "''";
		const code = text + '.' + operator + '(' + substring + ') + 1';
		return [code, g.ORDER_ADDITIVE];
	};

	/**
	 * 取得字元
	 */
	g.forBlock['text_charAt'] = function (block) {
		const where = block.getFieldValue('WHERE') || 'FROM_START';
		const text = g.valueToCode(block, 'VALUE', g.ORDER_MEMBER) || "''";
		let code;

		switch (where) {
			case 'FIRST':
				code = text + '[0]';
				break;
			case 'LAST':
				code = text + '[-1]';
				break;
			case 'FROM_START':
				const at = g.valueToCode(block, 'AT', g.ORDER_NONE) || '1';
				code = text + '[int(' + at + ') - 1]';
				break;
			case 'FROM_END':
				const atEnd = g.valueToCode(block, 'AT', g.ORDER_NONE) || '1';
				code = text + '[-int(' + atEnd + ')]';
				break;
			case 'RANDOM':
				g.addImport('import random');
				code = 'random.choice(' + text + ')';
				break;
			default:
				throw Error('Unknown location: ' + where);
		}
		return [code, g.ORDER_MEMBER];
	};

	/**
	 * 取得子字串
	 */
	g.forBlock['text_getSubstring'] = function (block) {
		const text = g.valueToCode(block, 'STRING', g.ORDER_MEMBER) || "''";
		const where1 = block.getFieldValue('WHERE1');
		const where2 = block.getFieldValue('WHERE2');

		let at1, at2;

		switch (where1) {
			case 'FROM_START':
				at1 = 'int(' + (g.valueToCode(block, 'AT1', g.ORDER_NONE) || '1') + ') - 1';
				break;
			case 'FROM_END':
				at1 = '-int(' + (g.valueToCode(block, 'AT1', g.ORDER_NONE) || '1') + ')';
				break;
			case 'FIRST':
				at1 = '0';
				break;
			default:
				throw Error('Unknown start location: ' + where1);
		}

		switch (where2) {
			case 'FROM_START':
				at2 = 'int(' + (g.valueToCode(block, 'AT2', g.ORDER_NONE) || '1') + ')';
				break;
			case 'FROM_END':
				at2 = '-int(' + (g.valueToCode(block, 'AT2', g.ORDER_NONE) || '1') + ') + 1 or None';
				break;
			case 'LAST':
				at2 = '';
				break;
			default:
				throw Error('Unknown end location: ' + where2);
		}

		const code = text + '[' + at1 + ':' + at2 + ']';
		return [code, g.ORDER_MEMBER];
	};

	/**
	 * 提示輸入
	 */
	g.forBlock['text_prompt_ext'] = function (block) {
		const msg = g.valueToCode(block, 'TEXT', g.ORDER_NONE) || "''";
		const code = 'input(' + msg + ')';

		// 如果需要數字，進行轉換
		const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
		if (toNumber) {
			return ['float(' + code + ')', g.ORDER_FUNCTION_CALL];
		}
		return [code, g.ORDER_FUNCTION_CALL];
	};

	/**
	 * 文字計數
	 */
	g.forBlock['text_count'] = function (block) {
		const text = g.valueToCode(block, 'TEXT', g.ORDER_MEMBER) || "''";
		const sub = g.valueToCode(block, 'SUB', g.ORDER_NONE) || "''";
		const code = text + '.count(' + sub + ')';
		return [code, g.ORDER_FUNCTION_CALL];
	};

	/**
	 * 文字反轉
	 */
	g.forBlock['text_reverse'] = function (block) {
		const text = g.valueToCode(block, 'TEXT', g.ORDER_MEMBER) || "''";
		const code = text + '[::-1]';
		return [code, g.ORDER_MEMBER];
	};

	// ── Lists ────────────────────────────────────────────────────────────────

	/**
	 * 建立空列表
	 */
	g.forBlock['lists_create_empty'] = function (block) {
		return ['[]', g.ORDER_ATOMIC];
	};

	/**
	 * 建立列表（含元素）
	 */
	g.forBlock['lists_create_with'] = function (block) {
		const elements = new Array(block.itemCount_);
		for (let i = 0; i < block.itemCount_; i++) {
			elements[i] = g.valueToCode(block, 'ADD' + i, g.ORDER_NONE) || 'None';
		}
		const code = '[' + elements.join(', ') + ']';
		return [code, g.ORDER_ATOMIC];
	};

	/**
	 * 重複元素建立列表
	 */
	g.forBlock['lists_repeat'] = function (block) {
		const element = g.valueToCode(block, 'ITEM', g.ORDER_NONE) || 'None';
		const count = g.valueToCode(block, 'NUM', g.ORDER_NONE) || '0';
		const code = '[' + element + '] * int(' + count + ')';
		return [code, g.ORDER_MULTIPLICATIVE];
	};

	/**
	 * 取得列表長度
	 */
	g.forBlock['lists_length'] = function (block) {
		const list = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '[]';
		return ['len(' + list + ')', g.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列表是否為空
	 */
	g.forBlock['lists_isEmpty'] = function (block) {
		const list = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '[]';
		const code = 'not len(' + list + ')';
		return [code, g.ORDER_LOGICAL_NOT];
	};

	/**
	 * 在列表中尋找
	 */
	g.forBlock['lists_indexOf'] = function (block) {
		const operator = block.getFieldValue('END') === 'FIRST' ? 'index' : 'rindex';
		const item = g.valueToCode(block, 'FIND', g.ORDER_NONE) || "''";
		const list = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '[]';

		if (operator === 'index') {
			// 使用 try/except 處理找不到的情況
			g.addFunction(
				'list_index',
				`def list_index(lst, item):
    try:
        return lst.index(item) + 1
    except ValueError:
        return 0`
			);
			return ['list_index(' + list + ', ' + item + ')', g.ORDER_FUNCTION_CALL];
		} else {
			g.addFunction(
				'list_rindex',
				`def list_rindex(lst, item):
    for i in range(len(lst) - 1, -1, -1):
        if lst[i] == item:
            return i + 1
    return 0`
			);
			return ['list_rindex(' + list + ', ' + item + ')', g.ORDER_FUNCTION_CALL];
		}
	};

	/**
	 * 取得列表元素
	 */
	g.forBlock['lists_getIndex'] = function (block) {
		const mode = block.getFieldValue('MODE') || 'GET';
		const where = block.getFieldValue('WHERE') || 'FROM_START';
		const list = g.valueToCode(block, 'VALUE', g.ORDER_MEMBER) || '[]';

		let code;

		switch (where) {
			case 'FIRST':
				if (mode === 'GET') {
					code = list + '[0]';
					return [code, g.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop(0)';
					return [code, g.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop(0)\n';
				}
				break;
			case 'LAST':
				if (mode === 'GET') {
					code = list + '[-1]';
					return [code, g.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop()';
					return [code, g.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop()\n';
				}
				break;
			case 'FROM_START':
				const at = g.valueToCode(block, 'AT', g.ORDER_NONE) || '1';
				if (mode === 'GET') {
					code = list + '[int(' + at + ') - 1]';
					return [code, g.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop(int(' + at + ') - 1)';
					return [code, g.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop(int(' + at + ') - 1)\n';
				}
				break;
			case 'FROM_END':
				const atEnd = g.valueToCode(block, 'AT', g.ORDER_NONE) || '1';
				if (mode === 'GET') {
					code = list + '[-int(' + atEnd + ')]';
					return [code, g.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop(-int(' + atEnd + '))';
					return [code, g.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop(-int(' + atEnd + '))\n';
				}
				break;
			case 'RANDOM':
				g.addImport('import random');
				if (mode === 'GET') {
					code = 'random.choice(' + list + ')';
					return [code, g.ORDER_FUNCTION_CALL];
				} else if (mode === 'GET_REMOVE') {
					g.addFunction(
						'list_pop_random',
						`def list_pop_random(lst):
    i = random.randint(0, len(lst) - 1)
    return lst.pop(i)`
					);
					code = 'list_pop_random(' + list + ')';
					return [code, g.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					g.addFunction(
						'list_remove_random',
						`def list_remove_random(lst):
    i = random.randint(0, len(lst) - 1)
    lst.pop(i)`
					);
					return 'list_remove_random(' + list + ')\n';
				}
				break;
		}
		throw Error('Unhandled combination (lists_getIndex).');
	};

	/**
	 * 設定列表元素
	 */
	g.forBlock['lists_setIndex'] = function (block) {
		const mode = block.getFieldValue('MODE') || 'SET';
		const where = block.getFieldValue('WHERE') || 'FROM_START';
		const list = g.valueToCode(block, 'LIST', g.ORDER_MEMBER) || '[]';
		const value = g.valueToCode(block, 'TO', g.ORDER_NONE) || 'None';

		let code;

		switch (where) {
			case 'FIRST':
				if (mode === 'SET') {
					return list + '[0] = ' + value + '\n';
				} else if (mode === 'INSERT') {
					return list + '.insert(0, ' + value + ')\n';
				}
				break;
			case 'LAST':
				if (mode === 'SET') {
					return list + '[-1] = ' + value + '\n';
				} else if (mode === 'INSERT') {
					return list + '.append(' + value + ')\n';
				}
				break;
			case 'FROM_START':
				const at = g.valueToCode(block, 'AT', g.ORDER_NONE) || '1';
				if (mode === 'SET') {
					return list + '[int(' + at + ') - 1] = ' + value + '\n';
				} else if (mode === 'INSERT') {
					return list + '.insert(int(' + at + ') - 1, ' + value + ')\n';
				}
				break;
			case 'FROM_END':
				const atEnd = g.valueToCode(block, 'AT', g.ORDER_NONE) || '1';
				if (mode === 'SET') {
					return list + '[-int(' + atEnd + ')] = ' + value + '\n';
				} else if (mode === 'INSERT') {
					return list + '.insert(-int(' + atEnd + '), ' + value + ')\n';
				}
				break;
			case 'RANDOM':
				g.addImport('import random');
				if (mode === 'SET') {
					g.addFunction(
						'list_set_random',
						`def list_set_random(lst, value):
    i = random.randint(0, len(lst) - 1)
    lst[i] = value`
					);
					return 'list_set_random(' + list + ', ' + value + ')\n';
				} else if (mode === 'INSERT') {
					g.addFunction(
						'list_insert_random',
						`def list_insert_random(lst, value):
    i = random.randint(0, len(lst))
    lst.insert(i, value)`
					);
					return 'list_insert_random(' + list + ', ' + value + ')\n';
				}
				break;
		}
		throw Error('Unhandled combination (lists_setIndex).');
	};

	/**
	 * 取得子列表
	 */
	g.forBlock['lists_getSublist'] = function (block) {
		const list = g.valueToCode(block, 'LIST', g.ORDER_MEMBER) || '[]';
		const where1 = block.getFieldValue('WHERE1');
		const where2 = block.getFieldValue('WHERE2');

		let at1, at2;

		switch (where1) {
			case 'FROM_START':
				at1 = 'int(' + (g.valueToCode(block, 'AT1', g.ORDER_NONE) || '1') + ') - 1';
				break;
			case 'FROM_END':
				at1 = '-int(' + (g.valueToCode(block, 'AT1', g.ORDER_NONE) || '1') + ')';
				break;
			case 'FIRST':
				at1 = '0';
				break;
			default:
				throw Error('Unknown start location: ' + where1);
		}

		switch (where2) {
			case 'FROM_START':
				at2 = 'int(' + (g.valueToCode(block, 'AT2', g.ORDER_NONE) || '1') + ')';
				break;
			case 'FROM_END':
				at2 = '-int(' + (g.valueToCode(block, 'AT2', g.ORDER_NONE) || '1') + ') + 1 or None';
				break;
			case 'LAST':
				at2 = '';
				break;
			default:
				throw Error('Unknown end location: ' + where2);
		}

		const code = list + '[' + at1 + ':' + at2 + ']';
		return [code, g.ORDER_MEMBER];
	};

	/**
	 * 列表排序
	 */
	g.forBlock['lists_sort'] = function (block) {
		const list = g.valueToCode(block, 'LIST', g.ORDER_NONE) || '[]';
		const type = block.getFieldValue('TYPE');
		const direction = block.getFieldValue('DIRECTION');

		let code;
		const reverse = direction === '-1' ? 'True' : 'False';

		switch (type) {
			case 'NUMERIC':
				code = 'sorted(' + list + ', key=float, reverse=' + reverse + ')';
				break;
			case 'TEXT':
				code = 'sorted(' + list + ', key=str, reverse=' + reverse + ')';
				break;
			case 'IGNORE_CASE':
				code = 'sorted(' + list + ', key=lambda x: str(x).lower(), reverse=' + reverse + ')';
				break;
			default:
				code = 'sorted(' + list + ', reverse=' + reverse + ')';
		}
		return [code, g.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列表分割/合併
	 */
	g.forBlock['lists_split'] = function (block) {
		const mode = block.getFieldValue('MODE');
		let code;

		if (mode === 'SPLIT') {
			const text = g.valueToCode(block, 'INPUT', g.ORDER_MEMBER) || "''";
			const delimiter = g.valueToCode(block, 'DELIM', g.ORDER_NONE) || "','";
			code = text + '.split(' + delimiter + ')';
		} else {
			const list = g.valueToCode(block, 'INPUT', g.ORDER_NONE) || '[]';
			const delimiter = g.valueToCode(block, 'DELIM', g.ORDER_MEMBER) || "','";
			code = delimiter + '.join([str(x) for x in ' + list + '])';
		}
		return [code, g.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列表反轉
	 */
	g.forBlock['lists_reverse'] = function (block) {
		const list = g.valueToCode(block, 'LIST', g.ORDER_NONE) || '[]';
		const code = 'list(reversed(' + list + '))';
		return [code, g.ORDER_FUNCTION_CALL];
	};

	// ── Math on lists ────────────────────────────────────────────────────────

	/**
	 * 數學運算（對列表）
	 */
	g.forBlock['math_on_list'] = function (block) {
		const func = block.getFieldValue('OP');
		const list = g.valueToCode(block, 'LIST', g.ORDER_NONE) || '[]';
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
				g.addFunction(
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
				g.addFunction(
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
				g.addImport('import math');
				g.addFunction(
					'std_dev',
					`def std_dev(lst):
    avg = sum(lst) / len(lst)
    variance = sum((x - avg) ** 2 for x in lst) / len(lst)
    return math.sqrt(variance)`
				);
				code = 'std_dev(' + list + ')';
				break;
			case 'RANDOM':
				g.addImport('import random');
				code = 'random.choice(' + list + ')';
				break;
			default:
				throw Error('Unknown operator: ' + func);
		}
		return [code, g.ORDER_FUNCTION_CALL];
	};

	console.log('[blockly] TXT 文字與列表生成器已載入');
})();
