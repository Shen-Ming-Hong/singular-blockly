/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 變數積木生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (variables.js)');
		return;
	}

	/**
	 * 取得變數
	 */
	generator.forBlock['variables_get'] = function (block) {
		const varName = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		return [varName, generator.ORDER_ATOMIC];
	};

	/**
	 * 設定變數
	 */
	generator.forBlock['variables_set'] = function (block) {
		const varName = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
		const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '0';

		generator.addVariable(varName, 'None');

		const currentFunc = generator.currentFunction_ || 'main';
		if (!generator.functionGlobals_) {
			generator.functionGlobals_ = new Map();
		}
		if (!generator.functionGlobals_.has(currentFunc)) {
			generator.functionGlobals_.set(currentFunc, new Set());
		}
		generator.functionGlobals_.get(currentFunc).add(varName);

		return `${varName} = ${value}\n`;
	};

	console.log('[blockly] MicroPython 變數生成器已載入');
})();
