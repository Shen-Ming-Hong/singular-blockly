/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 列表積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (lists.js)');
		return;
	}

	/**
	 * 建立空列表
	 */
	generator.forBlock['lists_create_empty'] = function (block) {
		return ['[]', generator.ORDER_ATOMIC];
	};

	/**
	 * 建立列表（含元素）
	 */
	generator.forBlock['lists_create_with'] = function (block) {
		const elements = new Array(block.itemCount_);
		for (let i = 0; i < block.itemCount_; i++) {
			elements[i] = generator.valueToCode(block, 'ADD' + i, generator.ORDER_NONE) || 'None';
		}
		const code = '[' + elements.join(', ') + ']';
		return [code, generator.ORDER_ATOMIC];
	};

	/**
	 * 重複元素建立列表
	 */
	generator.forBlock['lists_repeat'] = function (block) {
		const element = generator.valueToCode(block, 'ITEM', generator.ORDER_NONE) || 'None';
		const count = generator.valueToCode(block, 'NUM', generator.ORDER_NONE) || '0';
		const code = '[' + element + '] * int(' + count + ')';
		return [code, generator.ORDER_MULTIPLICATIVE];
	};

	/**
	 * 取得列表長度
	 */
	generator.forBlock['lists_length'] = function (block) {
		const list = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '[]';
		return ['len(' + list + ')', generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列表是否為空
	 */
	generator.forBlock['lists_isEmpty'] = function (block) {
		const list = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '[]';
		const code = 'not len(' + list + ')';
		return [code, generator.ORDER_LOGICAL_NOT];
	};

	/**
	 * 在列表中尋找
	 */
	generator.forBlock['lists_indexOf'] = function (block) {
		const operator = block.getFieldValue('END') === 'FIRST' ? 'index' : 'rindex';
		const item = generator.valueToCode(block, 'FIND', generator.ORDER_NONE) || "''";
		const list = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '[]';

		if (operator === 'index') {
			// 使用 try/except 處理找不到的情況
			generator.addFunction(
				'list_index',
				`def list_index(lst, item):
    try:
        return lst.index(item) + 1
    except ValueError:
        return 0`
			);
			return ['list_index(' + list + ', ' + item + ')', generator.ORDER_FUNCTION_CALL];
		} else {
			generator.addFunction(
				'list_rindex',
				`def list_rindex(lst, item):
    for i in range(len(lst) - 1, -1, -1):
        if lst[i] == item:
            return i + 1
    return 0`
			);
			return ['list_rindex(' + list + ', ' + item + ')', generator.ORDER_FUNCTION_CALL];
		}
	};

	/**
	 * 取得列表元素
	 */
	generator.forBlock['lists_getIndex'] = function (block) {
		const mode = block.getFieldValue('MODE') || 'GET';
		const where = block.getFieldValue('WHERE') || 'FROM_START';
		const list = generator.valueToCode(block, 'VALUE', generator.ORDER_MEMBER) || '[]';

		let code;

		switch (where) {
			case 'FIRST':
				if (mode === 'GET') {
					code = list + '[0]';
					return [code, generator.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop(0)';
					return [code, generator.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop(0)\n';
				}
				break;
			case 'LAST':
				if (mode === 'GET') {
					code = list + '[-1]';
					return [code, generator.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop()';
					return [code, generator.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop()\n';
				}
				break;
			case 'FROM_START':
				const at = generator.valueToCode(block, 'AT', generator.ORDER_NONE) || '1';
				if (mode === 'GET') {
					code = list + '[int(' + at + ') - 1]';
					return [code, generator.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop(int(' + at + ') - 1)';
					return [code, generator.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop(int(' + at + ') - 1)\n';
				}
				break;
			case 'FROM_END':
				const atEnd = generator.valueToCode(block, 'AT', generator.ORDER_NONE) || '1';
				if (mode === 'GET') {
					code = list + '[-int(' + atEnd + ')]';
					return [code, generator.ORDER_MEMBER];
				} else if (mode === 'GET_REMOVE') {
					code = list + '.pop(-int(' + atEnd + '))';
					return [code, generator.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					return list + '.pop(-int(' + atEnd + '))\n';
				}
				break;
			case 'RANDOM':
				generator.addImport('import random');
				if (mode === 'GET') {
					code = 'random.choice(' + list + ')';
					return [code, generator.ORDER_FUNCTION_CALL];
				} else if (mode === 'GET_REMOVE') {
					generator.addFunction(
						'list_pop_random',
						`def list_pop_random(lst):
    i = random.randint(0, len(lst) - 1)
    return lst.pop(i)`
					);
					code = 'list_pop_random(' + list + ')';
					return [code, generator.ORDER_FUNCTION_CALL];
				} else if (mode === 'REMOVE') {
					generator.addFunction(
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
	generator.forBlock['lists_setIndex'] = function (block) {
		const mode = block.getFieldValue('MODE') || 'SET';
		const where = block.getFieldValue('WHERE') || 'FROM_START';
		const list = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
		const value = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || 'None';

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
				const at = generator.valueToCode(block, 'AT', generator.ORDER_NONE) || '1';
				if (mode === 'SET') {
					return list + '[int(' + at + ') - 1] = ' + value + '\n';
				} else if (mode === 'INSERT') {
					return list + '.insert(int(' + at + ') - 1, ' + value + ')\n';
				}
				break;
			case 'FROM_END':
				const atEnd = generator.valueToCode(block, 'AT', generator.ORDER_NONE) || '1';
				if (mode === 'SET') {
					return list + '[-int(' + atEnd + ')] = ' + value + '\n';
				} else if (mode === 'INSERT') {
					return list + '.insert(-int(' + atEnd + '), ' + value + ')\n';
				}
				break;
			case 'RANDOM':
				generator.addImport('import random');
				if (mode === 'SET') {
					generator.addFunction(
						'list_set_random',
						`def list_set_random(lst, value):
    i = random.randint(0, len(lst) - 1)
    lst[i] = value`
					);
					return 'list_set_random(' + list + ', ' + value + ')\n';
				} else if (mode === 'INSERT') {
					generator.addFunction(
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
	generator.forBlock['lists_getSublist'] = function (block) {
		const list = generator.valueToCode(block, 'LIST', generator.ORDER_MEMBER) || '[]';
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

		const code = list + '[' + at1 + ':' + at2 + ']';
		return [code, generator.ORDER_MEMBER];
	};

	/**
	 * 列表排序
	 */
	generator.forBlock['lists_sort'] = function (block) {
		const list = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
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
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列表分割/合併
	 */
	generator.forBlock['lists_split'] = function (block) {
		const mode = block.getFieldValue('MODE');
		let code;

		if (mode === 'SPLIT') {
			const text = generator.valueToCode(block, 'INPUT', generator.ORDER_MEMBER) || "''";
			const delimiter = generator.valueToCode(block, 'DELIM', generator.ORDER_NONE) || "','";
			code = text + '.split(' + delimiter + ')';
		} else {
			const list = generator.valueToCode(block, 'INPUT', generator.ORDER_NONE) || '[]';
			const delimiter = generator.valueToCode(block, 'DELIM', generator.ORDER_MEMBER) || "','";
			code = delimiter + '.join([str(x) for x in ' + list + '])';
		}
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 列表反轉
	 */
	generator.forBlock['lists_reverse'] = function (block) {
		const list = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
		const code = 'list(reversed(' + list + '))';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	console.log('[blockly] MicroPython 列表生成器已載入');
})();
