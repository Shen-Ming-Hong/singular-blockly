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

		let branch = generator.statementToCode(block, 'STACK');
		if (generator.STATEMENT_PREFIX) {
			branch = generator.prefixLines(generator.injectId(generator.STATEMENT_PREFIX, block), generator.INDENT) + branch;
		}
		if (!branch) {
			branch = generator.INDENT + 'pass\n';
		}

		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + xfix1 + loopTrap + branch;

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

		let branch = generator.statementToCode(block, 'STACK');
		if (generator.STATEMENT_PREFIX) {
			branch = generator.prefixLines(generator.injectId(generator.STATEMENT_PREFIX, block), generator.INDENT) + branch;
		}
		if (!branch) {
			branch = '';
		}

		let returnValue = generator.valueToCode(block, 'RETURN', generator.ORDER_NONE) || 'None';
		returnValue = generator.INDENT + 'return ' + returnValue + '\n';

		const code = 'def ' + funcName + '(' + args.join(', ') + '):\n' + xfix1 + loopTrap + branch + returnValue;

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

	console.log('[blockly] MicroPython 函數生成器已載入');
})();
