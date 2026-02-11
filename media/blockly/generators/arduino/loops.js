/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
	// 深層防護：孤立積木不生成程式碼
	if (!window.arduinoGenerator.isInAllowedContext(block)) {
		return '';
	}

	const repeats= window.arduinoGenerator.valueToCode(block, 'TIMES', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');
	// 使用固定的變數名稱模式
	const loopVar = '_i' + Math.floor(Math.random() * 10000);

	return `for (int ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
	// 深層防護：孤立積木不生成程式碼
	if (!window.arduinoGenerator.isInAllowedContext(block)) {
		return '';
	}

	const until= block.getFieldValue('MODE') === 'UNTIL';
	const argument0 = window.arduinoGenerator.valueToCode(block, 'BOOL', window.arduinoGenerator.ORDER_NONE) || 'false';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	if (until) {
		return `while (!(${argument0})) {\n${branch}}\n`;
	} else {
		return `while (${argument0}) {\n${branch}}\n`;
	}
};

window.arduinoGenerator.forBlock['controls_for'] = function (block) {
	// 深層防護：孤立積木不生成程式碼
	if (!window.arduinoGenerator.isInAllowedContext(block)) {
		return '';
	}

	// 直接從變數欄位獲取名稱
	const varField = block.getField('VAR');
	const variable = varField ? varField.getText() : 'i'; // 使用 getText() 獲取實際顯示的變數名稱

	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const step = window.arduinoGenerator.valueToCode(block, 'BY', window.arduinoGenerator.ORDER_ASSIGNMENT) || '1';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	// 嘗試解析數值來決定迴圈方向
	const fromNum = parseFloat(from);
	const toNum = parseFloat(to);
	const stepNum = parseFloat(step);

	// 如果 from 和 to 都是數字且 from > to，生成遞減迴圈
	if (!isNaN(fromNum) && !isNaN(toNum) && fromNum > toNum) {
		// 取 step 的絕對值，避免 -= -5 這種雙重否定
		const absStep = !isNaN(stepNum) ? Math.abs(stepNum) : `abs(${step})`;
		return `for (int ${variable} = ${from}; ${variable} >= ${to}; ${variable} -= ${absStep}) {\n${branch}}\n`;
	}

	// 如果無法確定（變數或表達式），使用執行時判斷
	// 或者預設為遞增迴圈（標準行為）
	return `for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${step}) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_forEach'] = function (block) {
	// 深層防護：孤立積木不生成程式碼
	if (!window.arduinoGenerator.isInAllowedContext(block)) {
		return '';
	}

	// 對 forEach 使用相同的方式
	const varField = block.getField('VAR');
	const variable = varField ? varField.getText() : 'x'; // 使用 getText() 獲取實際顯示的變數名稱

	const list = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_ASSIGNMENT) || '[]';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	return `for (auto ${variable} : ${list}) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['singular_flow_statements'] = function (block) {
	// 深層防護：孤立積木不生成程式碼
	if (!window.arduinoGenerator.isInAllowedContext(block)) {
		return '';
	}

	const flowType= block.getFieldValue('FLOW');
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
	// 深層防護：孤立積木不生成程式碼
	if (!window.arduinoGenerator.isInAllowedContext(block)) {
		return '';
	}

	const duration= window.arduinoGenerator.valueToCode(block, 'DURATION', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');
	const timeVar = '_startTime' + Math.floor(Math.random() * 10000);

	// 返回使用 millis() 函數實現的定時迴圈
	return `unsigned long ${timeVar} = millis();\n` + `while (millis() - ${timeVar} < ${duration}) {\n` + branch + `}\n`;
};
