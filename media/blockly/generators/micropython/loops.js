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
	 * 檢查程式碼最外層是否包含延遲（不檢查 if/else 等第二層以內的內容）
	 * @param {string} branch - 迴圈內的程式碼
	 * @returns {boolean} 最外層是否有延遲
	 */
	function hasDelayAtTopLevel(branch) {
		// 分析每一行，只檢查第一層縮排（4 spaces 或 1 tab）的延遲
		const lines = branch.split('\n');
		const delayPattern = /time\.sleep|sleep_ms|sleep_us|machine\.idle/;
		const topLevelIndent = '    '; // generator.INDENT = 4 spaces

		for (const line of lines) {
			// 檢查是否為第一層縮排（剛好一個縮排，不多不少）
			if (line.startsWith(topLevelIndent) && !line.startsWith(topLevelIndent + topLevelIndent)) {
				if (delayPattern.test(line)) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * 無限迴圈
	 */
	generator.forBlock['controls_whileUntil'] = function (block) {
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

		const until = block.getFieldValue('MODE') === 'UNTIL';
		let argument0 = generator.valueToCode(block, 'BOOL', until ? generator.ORDER_LOGICAL_NOT : generator.ORDER_NONE) || 'False';
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';
		if (until) {
			argument0 = 'not ' + argument0;
		}

		// 如果是無限迴圈 (while True) 且最外層沒有延遲，加入最小延遲避免無法中斷
		// 只檢查第一層，if/else 內的延遲不算（因為條件不成立時不會執行）
		const isInfiniteLoop = argument0 === 'True';
		if (isInfiniteLoop && !hasDelayAtTopLevel(branch)) {
			generator.addImport('import time');
			// 在迴圈結尾加入 10ms 延遲，確保 CPU 有機會處理中斷
			branch += generator.INDENT + 'time.sleep_ms(10)  # 確保可中斷\n';
		}

		return 'while ' + argument0 + ':\n' + branch;
	};

	/**
	 * 重複 N 次
	 */
	generator.forBlock['controls_repeat_ext'] = function (block) {
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

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
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

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
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

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
	generator.forBlock['singular_flow_statements'] = function (block) {
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

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
