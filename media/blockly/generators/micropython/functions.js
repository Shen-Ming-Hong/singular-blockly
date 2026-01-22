/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 函數積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (functions.js)');
		return;
	}

	/**
	 * 定義無回傳值的函數
	 */
	generator.forBlock['procedures_defnoreturn'] = function (block) {
		const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		let xfix1 = '';
		if (generator.STATEMENT_PREFIX) {
			xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
		}
		if (generator.STATEMENT_SUFFIX) {
			xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
		}
		if (xfix1) {
			xfix1 = generator.prefixLines(xfix1, generator.INDENT);
		}

		let loopTrap = '';
		if (generator.INFINITE_LOOP_TRAP) {
			loopTrap = generator.prefixLines(generator.injectId(generator.INFINITE_LOOP_TRAP, block), generator.INDENT);
		}

		const args = [];
		const variables = block.getVars();
		for (let i = 0; i < variables.length; i++) {
			args[i] = generator.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME);
		}

		const previousFunction = generator.currentFunction_ || 'main';
		generator.currentFunction_ = funcName;
		if (!generator.functionGlobals_) {
			generator.functionGlobals_ = new Map();
		}
		if (!generator.functionGlobals_.has(funcName)) {
			generator.functionGlobals_.set(funcName, new Set());
		}

		let branch = generator.statementToCode(block, 'STACK');
		if (generator.STATEMENT_PREFIX) {
			branch = generator.prefixLines(generator.injectId(generator.STATEMENT_PREFIX, block), generator.INDENT) + branch;
		}
		if (!branch) {
			branch = generator.INDENT + 'pass\n';
		}

		generator.currentFunction_ = previousFunction;

		const globals = generator.functionGlobals_.get(funcName);
		let globalDecl = '';
		if (globals && globals.size > 0) {
			// Filter out function parameters from globals to avoid Python syntax error:
			// "name 'x' is parameter and global"
			const argsSet = new Set(args);
			const filteredGlobals = Array.from(globals).filter(g => !argsSet.has(g));
			if (filteredGlobals.length > 0) {
				globalDecl = generator.INDENT + 'global ' + filteredGlobals.join(', ') + '\n';
			}
		}

		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + globalDecl + xfix1 + loopTrap + branch;

		// 將函數添加到自訂函數集合
		generator.addFunction(funcName, code);

		return null;
	};

	/**
	 * 定義有回傳值的函數
	 */
	generator.forBlock['procedures_defreturn'] = function (block) {
		const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		let xfix1 = '';
		if (generator.STATEMENT_PREFIX) {
			xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
		}
		if (generator.STATEMENT_SUFFIX) {
			xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
		}
		if (xfix1) {
			xfix1 = generator.prefixLines(xfix1, generator.INDENT);
		}

		let loopTrap = '';
		if (generator.INFINITE_LOOP_TRAP) {
			loopTrap = generator.prefixLines(generator.injectId(generator.INFINITE_LOOP_TRAP, block), generator.INDENT);
		}

		const args = [];
		const variables = block.getVars();
		for (let i = 0; i < variables.length; i++) {
			args[i] = generator.nameDB_.getName(variables[i], Blockly.VARIABLE_CATEGORY_NAME);
		}

		const previousFunction = generator.currentFunction_ || 'main';
		generator.currentFunction_ = funcName;
		if (!generator.functionGlobals_) {
			generator.functionGlobals_ = new Map();
		}
		if (!generator.functionGlobals_.has(funcName)) {
			generator.functionGlobals_.set(funcName, new Set());
		}

		let branch = generator.statementToCode(block, 'STACK');
		if (generator.STATEMENT_PREFIX) {
			branch = generator.prefixLines(generator.injectId(generator.STATEMENT_PREFIX, block), generator.INDENT) + branch;
		}
		if (!branch) {
			branch = '';
		}

		let returnValue = generator.valueToCode(block, 'RETURN', generator.ORDER_NONE) || 'None';
		returnValue = generator.INDENT + 'return ' + returnValue + '\n';

		generator.currentFunction_ = previousFunction;

		const globals = generator.functionGlobals_.get(funcName);
		let globalDecl = '';
		if (globals && globals.size > 0) {
			// Filter out function parameters from globals to avoid Python syntax error:
			// "name 'x' is parameter and global"
			const argsSet = new Set(args);
			const filteredGlobals = Array.from(globals).filter(g => !argsSet.has(g));
			if (filteredGlobals.length > 0) {
				globalDecl = generator.INDENT + 'global ' + filteredGlobals.join(', ') + '\n';
			}
		}

		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + globalDecl + xfix1 + loopTrap + branch + returnValue;

		// 將函數添加到自訂函數集合
		generator.addFunction(funcName, code);

		return null;
	};

	/**
	 * 呼叫無回傳值的函數
	 */
	generator.forBlock['procedures_callnoreturn'] = function (block) {
		const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		const args = [];
		const variables = block.getVars();
		for (let i = 0; i < variables.length; i++) {
			args[i] = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE) || 'None';
		}
		const code = funcName + '(' + args.join(', ') + ')\n';
		return code;
	};

	/**
	 * 呼叫有回傳值的函數
	 */
	generator.forBlock['procedures_callreturn'] = function (block) {
		const funcName = generator.nameDB_.getName(block.getFieldValue('NAME'), Blockly.PROCEDURE_CATEGORY_NAME);
		const args = [];
		const variables = block.getVars();
		for (let i = 0; i < variables.length; i++) {
			args[i] = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE) || 'None';
		}
		const code = funcName + '(' + args.join(', ') + ')';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 如果回傳
	 */
	generator.forBlock['procedures_ifreturn'] = function (block) {
		let condition = generator.valueToCode(block, 'CONDITION', generator.ORDER_NONE) || 'False';
		let code = 'if ' + condition + ':\n';

		if (generator.STATEMENT_SUFFIX) {
			code += generator.prefixLines(generator.injectId(generator.STATEMENT_SUFFIX, block), generator.INDENT);
		}

		if (block.hasReturnValue_) {
			const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || 'None';
			code += generator.INDENT + 'return ' + value + '\n';
		} else {
			code += generator.INDENT + 'return\n';
		}
		return code;
	};

	/**
	 * 自訂函數定義 (arduino_function)
	 * 生成 Python def 語法
	 * 支援中文函數名稱（Python 3 支援 Unicode 識別符）
	 */
	generator.forBlock['arduino_function'] = function (block) {
		// 取得函數名稱（支援中文，Python 3 原生支援）
		const funcName = block.getFieldValue('NAME');

		// 防禦性檢查：函數名稱不可為空
		if (!funcName) {
			console.warn('[blockly] arduino_function: 函數名稱為空，跳過生成');
			return null;
		}

		// 取得參數名稱（忽略型別，Python 是動態型別語言）
		const args = block.arguments_ || [];

		const previousFunction = generator.currentFunction_ || 'main';
		generator.currentFunction_ = funcName;
		if (!generator.functionGlobals_) {
			generator.functionGlobals_ = new Map();
		}
		if (!generator.functionGlobals_.has(funcName)) {
			generator.functionGlobals_.set(funcName, new Set());
		}

		// 生成函數體
		let branch = generator.statementToCode(block, 'STACK');

		// 空函數體需要 pass（Python 語法要求）
		if (!branch || !branch.trim()) {
			branch = generator.INDENT + 'pass\n';
		}

		generator.currentFunction_ = previousFunction;

		const globals = generator.functionGlobals_.get(funcName);
		let globalDecl = '';
		if (globals && globals.size > 0) {
			// Filter out function parameters from globals to avoid Python syntax error:
			// "name 'x' is parameter and global"
			const argsSet = new Set(args);
			const filteredGlobals = Array.from(globals).filter(g => !argsSet.has(g));
			if (filteredGlobals.length > 0) {
				globalDecl = generator.INDENT + 'global ' + filteredGlobals.join(', ') + '\n';
			}
		}

		// 組裝 Python 函數定義
		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + globalDecl + branch;

		// 註冊到 functions_ 集合，由 finish() 輸出到 [4] User Functions 區塊
		generator.addFunction(funcName, code);

		return null;
	};

	/**
	 * 自訂函數呼叫 (arduino_function_call)
	 * 生成 Python 函數呼叫語法
	 */
	generator.forBlock['arduino_function_call'] = function (block) {
		// 取得函數名稱
		const funcName = block.getFieldValue('NAME');

		// 防禦性檢查：函數名稱不可為空
		if (!funcName) {
			console.warn('[blockly] arduino_function_call: 函數名稱為空，跳過生成');
			return '';
		}

		// 取得參數值
		const args = [];
		const argCount = block.arguments_?.length || 0;

		for (let i = 0; i < argCount; i++) {
			const argCode = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE);
			// 未連接的參數使用 None 作為預設值（Python 慣例）
			args.push(argCode || 'None');
		}

		// 生成函數呼叫（語句形式，帶換行）
		const code = funcName + '(' + args.join(', ') + ')\n';

		return code;
	};

	console.log('[blockly] MicroPython 函數生成器已載入');
})();
