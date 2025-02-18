/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
	const repeats = window.arduinoGenerator.valueToCode(block, 'TIMES', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');
	// 使用固定的變數名稱模式
	const loopVar = '_i' + Math.floor(Math.random() * 10000);

	return `for (int ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
	const until = block.getFieldValue('MODE') === 'UNTIL';
	const argument0 = window.arduinoGenerator.valueToCode(block, 'BOOL', window.arduinoGenerator.ORDER_NONE) || 'false';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	if (until) {
		return `while (!${argument0}) {\n${branch}}\n`;
	} else {
		return `while (${argument0}) {\n${branch}}\n`;
	}
};

window.arduinoGenerator.forBlock['controls_for'] = function (block) {
	// 直接從變數欄位獲取名稱
	const varField = block.getField('VAR');
	const variable = varField ? varField.getText() : 'i'; // 使用 getText() 獲取實際顯示的變數名稱

	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const step = window.arduinoGenerator.valueToCode(block, 'BY', window.arduinoGenerator.ORDER_ASSIGNMENT) || '1';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	return `for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${step}) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_forEach'] = function (block) {
	// 對 forEach 使用相同的方式
	const varField = block.getField('VAR');
	const variable = varField ? varField.getText() : 'x'; // 使用 getText() 獲取實際顯示的變數名稱

	const list = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_ASSIGNMENT) || '[]';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	return `for (auto ${variable} : ${list}) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_flow_statements'] = function (block) {
	const flowType = block.getFieldValue('FLOW');
	let code = '';

	switch (flowType) {
		case 'BREAK':
			code = 'break;\n';
			break;
		case 'CONTINUE':
			code = 'continue;\n';
			break;
	}

	return code;
};

window.arduinoGenerator.forBlock['controls_duration'] = function (block) {
	const duration = window.arduinoGenerator.valueToCode(block, 'DURATION', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');
	const timeVar = '_startTime' + Math.floor(Math.random() * 10000);

	// 返回使用 millis() 函數實現的定時迴圈
	return `unsigned long ${timeVar} = millis();\n` + `while (millis() - ${timeVar} < ${duration}) {\n` + branch + `}\n`;
};
