/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 迴圈積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (loops.js)');
		return;
	}

	/**
	 * 無限迴圈
	 */
	generator.forBlock['controls_whileUntil'] = function (block) {
		const until = block.getFieldValue('MODE') === 'UNTIL';
		let argument0 = generator.valueToCode(block, 'BOOL', until ? generator.ORDER_LOGICAL_NOT : generator.ORDER_NONE) || 'False';
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';
		if (until) {
			argument0 = 'not ' + argument0;
		}
		return 'while ' + argument0 + ':\n' + branch;
	};

	/**
	 * 重複 N 次
	 */
	generator.forBlock['controls_repeat_ext'] = function (block) {
		const times = generator.valueToCode(block, 'TIMES', generator.ORDER_NONE) || '0';
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';
		const loopVar = generator.nameDB_.getDistinctName('count', Blockly.VARIABLE_CATEGORY_NAME);
		const code = 'for ' + loopVar + ' in range(int(' + times + ')):\n' + branch;
		return code;
	};

	/**
	 * 重複指定次數
	 */
	generator.forBlock['controls_repeat'] = generator.forBlock['controls_repeat_ext'];

	/**
	 * 計數迴圈
	 */
	generator.forBlock['controls_for'] = function (block) {
		const variable0 = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const argument0 = generator.valueToCode(block, 'FROM', generator.ORDER_NONE) || '0';
		const argument1 = generator.valueToCode(block, 'TO', generator.ORDER_NONE) || '0';
		const increment = generator.valueToCode(block, 'BY', generator.ORDER_NONE) || '1';
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';

		let code = '';
		// Python range 不包含結束值，需要 +1
		code += 'for ' + variable0 + ' in range(int(' + argument0 + '), int(' + argument1 + ') + 1, int(' + increment + ')):\n';
		code += branch;
		return code;
	};

	/**
	 * 迭代列表
	 */
	generator.forBlock['controls_forEach'] = function (block) {
		const variable0 = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const argument0 = generator.valueToCode(block, 'LIST', generator.ORDER_NONE) || '[]';
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';
		const code = 'for ' + variable0 + ' in ' + argument0 + ':\n' + branch;
		return code;
	};

	/**
	 * 迴圈流程控制（break/continue）
	 */
	generator.forBlock['controls_flow_statements'] = function (block) {
		const flow = block.getFieldValue('FLOW');
		switch (flow) {
			case 'BREAK':
				return 'break\n';
			case 'CONTINUE':
				return 'continue\n';
		}
		throw Error('Unknown flow statement.');
	};

	console.log('[blockly] MicroPython 迴圈生成器已載入');
})();
