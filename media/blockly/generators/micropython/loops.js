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
	 * 建立 while 迴圈程式碼，並在無限迴圈需要時自動補最小延遲。
	 * @param {!Blockly.Block} block - 來源積木
	 * @param {string} condition - while 條件
	 * @returns {string} 生成的程式碼
	 */
	function buildWhileLoopCode(block, condition) {
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';

		if (condition === 'True' && !hasDelayAtTopLevel(branch)) {
			generator.addImport('import time');
			branch += generator.INDENT + 'time.sleep_ms(10)  # 確保可中斷\n';
		}

		return 'while ' + condition + ':\n' + branch;
	}

	/**
	 * 條件迴圈
	 */
	generator.forBlock['controls_whileUntil'] = function (block) {
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

		const until = block.getFieldValue('MODE') === 'UNTIL';
		let argument0 = generator.valueToCode(block, 'BOOL', until ? generator.ORDER_LOGICAL_NOT : generator.ORDER_NONE) || 'False';
		if (until) {
			argument0 = 'not ' + argument0;
		}

		return buildWhileLoopCode(block, argument0);
	};

	/**
	 * 兒童友善的無限迴圈
	 */
	generator.forBlock['controls_forever'] = function (block) {
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

		return buildWhileLoopCode(block, 'True');
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
	 * 計時重複（在指定毫秒內持續執行）
	 */
	generator.forBlock['controls_duration'] = function (block) {
		// 深層防護：孤立積木不生成程式碼
		if (!generator.isInAllowedContext(block)) {
			return '';
		}

		generator.addImport('import time');

		const duration = generator.valueToCode(block, 'DURATION', generator.ORDER_NONE) || '0';
		let branch = generator.statementToCode(block, 'DO');
		branch = branch || generator.INDENT + 'pass\n';

		// 使用唯一變數名避免巢狀使用時衝突
		const timeVar = generator.nameDB_.getDistinctName('start_ms', Blockly.VARIABLE_CATEGORY_NAME);

		// time.ticks_diff 可正確處理 32-bit 計時器溢位
		const code =
			timeVar + ' = time.ticks_ms()\n' + 'while time.ticks_diff(time.ticks_ms(), ' + timeVar + ') < ' + duration + ':\n' + branch;
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
