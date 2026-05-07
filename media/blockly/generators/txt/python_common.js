/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller 通用 Python 積木生成器
 * 提供 math, logic, loops, variables, functions, text 等基礎積木的 Python 程式碼生成。
 * TXT 執行於標準 CPython 3，因此不使用 MicroPython 專屬 API（如 time.sleep_ms）。
 */

'use strict';

(function () {
	const g = window.txtGenerator;
	if (!g) {
		console.error('[blockly] TXT 生成器尚未載入 (python_common.js)');
		return;
	}

	// ── 輔助狀態與方法 ───────────────────────────────────────────────────────

	g.variables_ = g.variables_ || new Map();
	g.functionGlobals_ = g.functionGlobals_ || new Map();
	g.currentFunction_ = g.currentFunction_ || null;

	/** 重置時也清除通用狀態（包裝原有 reset） */
	const _origReset = g.reset.bind(g);
	g.reset = function () {
		_origReset();
		this.variables_.clear();
		this.functionGlobals_.clear();
		this.currentFunction_ = null;
	};

	/** 登記自訂函數（去重） */
	g.addFunction = function (name, code) {
		if (!this.functions_.has(name)) {
			this.functions_.set(name, { name, code });
		}
	};

	/** 登記全域變數初始值（去重） */
	g.addVariable = function (name, initialValue) {
		if (!this.variables_.has(name)) {
			this.variables_.set(name, { name, initialValue });
		}
	};

	/** 檢查積木是否在合法的容器積木（txt_main / 函數定義）內 */
	g.isInAllowedContext = function (block) {
		let current = block;
		while (current) {
			current = current.getSurroundParent();
			if (!current) return false;
			if (this.allowedTopLevelBlocks_.includes(current.type)) return true;
		}
		return false;
	};

	// ── Math ─────────────────────────────────────────────────────────────────

	g.forBlock['math_number'] = function (block) {
		const num = Number(block.getFieldValue('NUM'));
		// 必須回傳字串，否則 0 為 falsy，呼叫端 `|| 'default'` 會誤用預設值
		const code = String(num);
		const order = num >= 0 ? g.ORDER_ATOMIC : g.ORDER_UNARY_SIGN;
		return [code, order];
	};

	g.forBlock['math_arithmetic'] = function (block) {
		const OPERATORS = {
			ADD: [' + ', g.ORDER_ADDITIVE],
			MINUS: [' - ', g.ORDER_ADDITIVE],
			MULTIPLY: [' * ', g.ORDER_MULTIPLICATIVE],
			DIVIDE: [' / ', g.ORDER_MULTIPLICATIVE],
			POWER: [' ** ', g.ORDER_EXPONENTIATION],
		};
		const [operator, order] = OPERATORS[block.getFieldValue('OP')];
		const a = g.valueToCode(block, 'A', order) || '0';
		const b = g.valueToCode(block, 'B', order) || '0';
		return [a + operator + b, order];
	};

	g.forBlock['math_single'] = function (block) {
		const op = block.getFieldValue('OP');
		const arg = g.valueToCode(block, 'NUM', g.ORDER_NONE) || '0';
		let code;
		switch (op) {
			case 'ROOT':
				g.addImport('import math');
				code = 'math.sqrt(' + arg + ')';
				break;
			case 'ABS':
				code = 'abs(' + arg + ')';
				break;
			case 'NEG':
				code = '-' + arg;
				break;
			case 'LN':
				g.addImport('import math');
				code = 'math.log(' + arg + ')';
				break;
			case 'LOG10':
				g.addImport('import math');
				code = 'math.log10(' + arg + ')';
				break;
			case 'EXP':
				g.addImport('import math');
				code = 'math.exp(' + arg + ')';
				break;
			case 'POW10':
				code = '10 ** ' + arg;
				break;
			default:
				throw Error('Unknown math operator: ' + op);
		}
		return [code, g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['math_trig'] = function (block) {
		const OPERATORS = { SIN: 'math.sin', COS: 'math.cos', TAN: 'math.tan', ASIN: 'math.asin', ACOS: 'math.acos', ATAN: 'math.atan' };
		const operator = OPERATORS[block.getFieldValue('OP')];
		g.addImport('import math');
		const arg = g.valueToCode(block, 'NUM', g.ORDER_NONE) || '0';
		const code = block.getFieldValue('OP').startsWith('A') ? operator + '(' + arg + ') / math.pi * 180' : operator + '(' + arg + ' / 180 * math.pi)';
		return [code, g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['math_constant'] = function (block) {
		const CONSTANTS = {
			PI: ['math.pi', g.ORDER_MEMBER],
			E: ['math.e', g.ORDER_MEMBER],
			GOLDEN_RATIO: ['(1 + math.sqrt(5)) / 2', g.ORDER_MULTIPLICATIVE],
			SQRT2: ['math.sqrt(2)', g.ORDER_FUNCTION_CALL],
			SQRT1_2: ['math.sqrt(0.5)', g.ORDER_FUNCTION_CALL],
			INFINITY: ['float("inf")', g.ORDER_FUNCTION_CALL],
		};
		const constant = block.getFieldValue('CONSTANT');
		if (constant !== 'INFINITY') g.addImport('import math');
		return CONSTANTS[constant];
	};

	g.forBlock['math_number_property'] = function (block) {
		const prop = block.getFieldValue('PROPERTY');
		const number = g.valueToCode(block, 'NUMBER_TO_CHECK', g.ORDER_NONE) || '0';
		let code;
		switch (prop) {
			case 'EVEN':
				code = number + ' % 2 == 0';
				break;
			case 'ODD':
				code = number + ' % 2 == 1';
				break;
			case 'PRIME':
				g.addFunction(
					'is_prime',
					'def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n ** 0.5) + 1):\n        if n % i == 0:\n            return False\n    return True'
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
			case 'DIVISIBLE_BY': {
				const divisor = g.valueToCode(block, 'DIVISOR', g.ORDER_NONE) || '1';
				code = number + ' % ' + divisor + ' == 0';
				break;
			}
			default:
				throw Error('Unknown property: ' + prop);
		}
		return [code, g.ORDER_RELATIONAL];
	};

	g.forBlock['math_round'] = function (block) {
		const op = block.getFieldValue('OP');
		const arg = g.valueToCode(block, 'NUM', g.ORDER_NONE) || '0';
		switch (op) {
			case 'ROUND':
				return ['round(' + arg + ')', g.ORDER_FUNCTION_CALL];
			case 'ROUNDUP':
				g.addImport('import math');
				return ['math.ceil(' + arg + ')', g.ORDER_FUNCTION_CALL];
			case 'ROUNDDOWN':
				g.addImport('import math');
				return ['math.floor(' + arg + ')', g.ORDER_FUNCTION_CALL];
			default:
				throw Error('Unknown round operator: ' + op);
		}
	};

	g.forBlock['math_modulo'] = function (block) {
		const a = g.valueToCode(block, 'DIVIDEND', g.ORDER_MULTIPLICATIVE) || '0';
		const b = g.valueToCode(block, 'DIVISOR', g.ORDER_MULTIPLICATIVE) || '1';
		return [a + ' % ' + b, g.ORDER_MULTIPLICATIVE];
	};

	g.forBlock['math_constrain'] = function (block) {
		const value = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '0';
		const low = g.valueToCode(block, 'LOW', g.ORDER_NONE) || '0';
		const high = g.valueToCode(block, 'HIGH', g.ORDER_NONE) || '0';
		return ['max(' + low + ', min(' + high + ', ' + value + '))', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['math_random_int'] = function (block) {
		g.addImport('import random');
		const from = g.valueToCode(block, 'FROM', g.ORDER_NONE) || '0';
		const to = g.valueToCode(block, 'TO', g.ORDER_NONE) || '0';
		return ['random.randint(' + from + ', ' + to + ')', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['math_random_float'] = function (_block) {
		g.addImport('import random');
		return ['random.random()', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['math_atan2'] = function (block) {
		g.addImport('import math');
		const x = g.valueToCode(block, 'X', g.ORDER_NONE) || '0';
		const y = g.valueToCode(block, 'Y', g.ORDER_NONE) || '0';
		return ['math.atan2(' + y + ', ' + x + ') / math.pi * 180', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['math_map'] = function (block) {
		const value = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '0';
		const fromLow = g.valueToCode(block, 'FROM_LOW', g.ORDER_NONE) || '0';
		const fromHigh = g.valueToCode(block, 'FROM_HIGH', g.ORDER_NONE) || '1023';
		const toLow = g.valueToCode(block, 'TO_LOW', g.ORDER_NONE) || '0';
		const toHigh = g.valueToCode(block, 'TO_HIGH', g.ORDER_NONE) || '255';
		g.addFunction(
			'map_value',
			`def map_value(x, in_min, in_max, out_min, out_max):
    return int((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min)`
		);
		const code = `map_value(${value}, ${fromLow}, ${fromHigh}, ${toLow}, ${toHigh})`;
		return [code, g.ORDER_FUNCTION_CALL];
	};

	// ── Logic ─────────────────────────────────────────────────────────────────

	g.forBlock['controls_if'] = function (block) {
		if (!g.isInAllowedContext(block)) return '';
		let code = '';
		const cond0 = g.valueToCode(block, 'IF0', g.ORDER_NONE) || 'False';
		let branch0 = g.statementToCode(block, 'DO0') || g.INDENT + 'pass\n';
		code += 'if ' + cond0 + ':\n' + branch0;
		for (let i = 1; i <= block.elseifCount_; i++) {
			const cond = g.valueToCode(block, 'IF' + i, g.ORDER_NONE) || 'False';
			const branch = g.statementToCode(block, 'DO' + i) || g.INDENT + 'pass\n';
			code += 'elif ' + cond + ':\n' + branch;
		}
		if (block.elseCount_) {
			const branch = g.statementToCode(block, 'ELSE') || g.INDENT + 'pass\n';
			code += 'else:\n' + branch;
		}
		return code;
	};

	g.forBlock['logic_boolean'] = function (block) {
		return [block.getFieldValue('BOOL') === 'TRUE' ? 'True' : 'False', g.ORDER_ATOMIC];
	};

	g.forBlock['logic_negate'] = function (block) {
		const value = g.valueToCode(block, 'BOOL', g.ORDER_LOGICAL_NOT) || 'True';
		return ['not ' + value, g.ORDER_LOGICAL_NOT];
	};

	g.forBlock['logic_compare'] = function (block) {
		const OPERATORS = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
		const operator = OPERATORS[block.getFieldValue('OP')];
		const a = g.valueToCode(block, 'A', g.ORDER_RELATIONAL) || '0';
		const b = g.valueToCode(block, 'B', g.ORDER_RELATIONAL) || '0';
		return [a + ' ' + operator + ' ' + b, g.ORDER_RELATIONAL];
	};

	g.forBlock['logic_operation'] = function (block) {
		const operator = block.getFieldValue('OP') === 'AND' ? 'and' : 'or';
		const order = operator === 'and' ? g.ORDER_LOGICAL_AND : g.ORDER_LOGICAL_OR;
		const a = g.valueToCode(block, 'A', order) || 'False';
		const b = g.valueToCode(block, 'B', order) || 'False';
		return [a + ' ' + operator + ' ' + b, order];
	};

	g.forBlock['logic_ternary'] = function (block) {
		const cond = g.valueToCode(block, 'IF', g.ORDER_NONE) || 'False';
		const then = g.valueToCode(block, 'THEN', g.ORDER_NONE) || 'None';
		const els = g.valueToCode(block, 'ELSE', g.ORDER_NONE) || 'None';
		return [then + ' if ' + cond + ' else ' + els, g.ORDER_NONE];
	};

	g.forBlock['logic_null'] = function (_block) {
		return ['None', g.ORDER_ATOMIC];
	};

	// ── Loops ─────────────────────────────────────────────────────────────────

	g.forBlock['controls_whileUntil'] = function (block) {
		if (!g.isInAllowedContext(block)) return '';
		const until = block.getFieldValue('MODE') === 'UNTIL';
		let cond = g.valueToCode(block, 'BOOL', until ? g.ORDER_LOGICAL_NOT : g.ORDER_NONE) || 'False';
		let branch = g.statementToCode(block, 'DO') || g.INDENT + 'pass\n';
		if (until) cond = 'not ' + cond;
		// 無限迴圈（while True）若迴圈內有使用超音波感測器，且使用者沒有自行加入 delay，
		// 自動補上 50ms 延遲以降低 CPU 使用率（迴圈約 20 Hz）。
		// 注意：ftrobopy exchange thread 預設以 100 Hz 執行（update_interval=0.01），
		// 此 sleep 並非超音波感測所必須，而是防止使用者空間迴圈無限速運轉消耗 CPU。
		const hasUltrasonic = [...g.inputConfigs_.values()].some(t => t === 'ULTRASONIC');
		if (!until && cond === 'True' && hasUltrasonic && !branch.includes('time.sleep')) {
			g.addImport('import time');
			branch += g.INDENT + 'time.sleep(0.05)  # 50 ms loop delay to reduce CPU load (~20 Hz loop rate)\n';
		}
		return 'while ' + cond + ':\n' + branch;
	};

	g.forBlock['controls_repeat_ext'] = function (block) {
		if (!g.isInAllowedContext(block)) return '';
		const times = g.valueToCode(block, 'TIMES', g.ORDER_NONE) || '0';
		const branch = g.statementToCode(block, 'DO') || g.INDENT + 'pass\n';
		const loopVar = g.nameDB_.getDistinctName('count', Blockly.VARIABLE_CATEGORY_NAME);
		return 'for ' + loopVar + ' in range(int(' + times + ')):\n' + branch;
	};

	g.forBlock['controls_repeat'] = g.forBlock['controls_repeat_ext'];

	g.forBlock['controls_for'] = function (block) {
		if (!g.isInAllowedContext(block)) return '';
		const variable = g.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const from = g.valueToCode(block, 'FROM', g.ORDER_NONE) || '0';
		const to = g.valueToCode(block, 'TO', g.ORDER_NONE) || '0';
		const by = g.valueToCode(block, 'BY', g.ORDER_NONE) || '1';
		const branch = g.statementToCode(block, 'DO') || g.INDENT + 'pass\n';
		return 'for ' + variable + ' in range(int(' + from + '), int(' + to + ') + 1, int(' + by + ')):\n' + branch;
	};

	g.forBlock['controls_forEach'] = function (block) {
		if (!g.isInAllowedContext(block)) return '';
		const variable = g.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const list = g.valueToCode(block, 'LIST', g.ORDER_NONE) || '[]';
		const branch = g.statementToCode(block, 'DO') || g.INDENT + 'pass\n';
		return 'for ' + variable + ' in ' + list + ':\n' + branch;
	};

	g.forBlock['controls_duration'] = function (block) {
		// TXT 執行於標準 CPython — 使用 time.time() 而非 MicroPython 的 time.ticks_ms()
		if (!g.isInAllowedContext(block)) return '';
		g.addImport('import time');
		const duration = g.valueToCode(block, 'DURATION', g.ORDER_NONE) || '0';
		const branch = g.statementToCode(block, 'DO') || g.INDENT + 'pass\n';
		const timeVar = g.nameDB_.getDistinctName('start_s', Blockly.VARIABLE_CATEGORY_NAME);
		return timeVar + ' = time.time()\nwhile (time.time() - ' + timeVar + ') * 1000 < ' + duration + ':\n' + branch;
	};

	g.forBlock['singular_flow_statements'] = function (block) {
		if (!g.isInAllowedContext(block)) return '';
		return block.getFieldValue('FLOW') === 'BREAK' ? 'break\n' : 'continue\n';
	};

	// ── Variables ─────────────────────────────────────────────────────────────

	g.forBlock['variables_get'] = function (block) {
		const varName = g.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		return [varName, g.ORDER_ATOMIC];
	};

	g.forBlock['variables_set'] = function (block) {
		const varName = g.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const value = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || '0';
		// 追蹤 global 宣告（函數內使用全域變數時需要）
		const currentFunc = g.currentFunction_ || 'main';
		if (!g.functionGlobals_.has(currentFunc)) g.functionGlobals_.set(currentFunc, new Set());
		g.functionGlobals_.get(currentFunc).add(varName);
		return varName + ' = ' + value + '\n';
	};

	// ── Functions ─────────────────────────────────────────────────────────────

	g.forBlock['procedures_defnoreturn'] = function (block) {
		const funcName = g.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		const args = block.getVars().map(v => g.nameDB_.getName(v, Blockly.VARIABLE_CATEGORY_NAME));

		const prevFunc = g.currentFunction_;
		g.currentFunction_ = funcName;
		if (!g.functionGlobals_.has(funcName)) g.functionGlobals_.set(funcName, new Set());

		let branch = g.statementToCode(block, 'STACK') || g.INDENT + 'pass\n';

		g.currentFunction_ = prevFunc;

		const globals = g.functionGlobals_.get(funcName);
		const argsSet = new Set(args);
		const filteredGlobals = globals ? Array.from(globals).filter(v => !argsSet.has(v)) : [];
		const globalDecl = filteredGlobals.length > 0 ? g.INDENT + 'global ' + filteredGlobals.join(', ') + '\n' : '';

		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + globalDecl + branch;
		g.addFunction(funcName, code);
		return null;
	};

	g.forBlock['procedures_defreturn'] = function (block) {
		const funcName = g.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		const args = block.getVars().map(v => g.nameDB_.getName(v, Blockly.VARIABLE_CATEGORY_NAME));

		const prevFunc = g.currentFunction_;
		g.currentFunction_ = funcName;
		if (!g.functionGlobals_.has(funcName)) g.functionGlobals_.set(funcName, new Set());

		let branch = g.statementToCode(block, 'STACK') || g.INDENT + 'pass\n';
		const returnValue = g.valueToCode(block, 'RETURN', g.ORDER_NONE) || 'None';

		g.currentFunction_ = prevFunc;

		const globals = g.functionGlobals_.get(funcName);
		const argsSet = new Set(args);
		const filteredGlobals = globals ? Array.from(globals).filter(v => !argsSet.has(v)) : [];
		const globalDecl = filteredGlobals.length > 0 ? g.INDENT + 'global ' + filteredGlobals.join(', ') + '\n' : '';

		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + globalDecl + branch + g.INDENT + 'return ' + returnValue + '\n';
		g.addFunction(funcName, code);
		return null;
	};

	g.forBlock['procedures_callnoreturn'] = function (block) {
		const funcName = g.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		const args = block.getVars().map((_, i) => g.valueToCode(block, 'ARG' + i, g.ORDER_NONE) || 'None');
		return funcName + '(' + args.join(', ') + ')\n';
	};

	g.forBlock['procedures_callreturn'] = function (block) {
		const funcName = g.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		const args = block.getVars().map((_, i) => g.valueToCode(block, 'ARG' + i, g.ORDER_NONE) || 'None');
		return [funcName + '(' + args.join(', ') + ')', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['procedures_ifreturn'] = function (block) {
		const cond = g.valueToCode(block, 'CONDITION', g.ORDER_NONE) || 'False';
		let code = 'if ' + cond + ':\n';
		if (block.hasReturnValue_) {
			const value = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || 'None';
			code += g.INDENT + 'return ' + value + '\n';
		} else {
			code += g.INDENT + 'return\n';
		}
		return code;
	};

	// ── Text ──────────────────────────────────────────────────────────────────

	g.forBlock['text'] = function (block) {
		const code = g.quote_(block.getFieldValue('TEXT'));
		return [code, g.ORDER_ATOMIC];
	};

	g.forBlock['text_join'] = function (block) {
		if (block.itemCount_ === 0) return ["''", g.ORDER_ATOMIC];
		if (block.itemCount_ === 1) {
			const el = g.valueToCode(block, 'ADD0', g.ORDER_NONE) || "''";
			return ['str(' + el + ')', g.ORDER_FUNCTION_CALL];
		}
		const parts = [];
		for (let i = 0; i < block.itemCount_; i++) {
			parts.push('str(' + (g.valueToCode(block, 'ADD' + i, g.ORDER_NONE) || "''") + ')');
		}
		return [parts.join(' + '), g.ORDER_ADDITIVE];
	};

	g.forBlock['text_length'] = function (block) {
		const text = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || "''";
		return ['len(' + text + ')', g.ORDER_FUNCTION_CALL];
	};

	g.forBlock['text_isEmpty'] = function (block) {
		const text = g.valueToCode(block, 'VALUE', g.ORDER_NONE) || "''";
		return ['len(' + text + ') == 0', g.ORDER_RELATIONAL];
	};

	g.forBlock['text_print'] = function (block) {
		const value = g.valueToCode(block, 'TEXT', g.ORDER_NONE) || "''";
		return 'print(' + value + ')\n';
	};

	console.log('[blockly] TXT 通用 Python 生成器已載入');
})();
