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
	// 使用 getFieldValue 而不是 valueToCode 來獲取變數名稱
	const variable = block.getFieldValue('VARIABLE') || 'i';
	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const step = window.arduinoGenerator.valueToCode(block, 'BY', window.arduinoGenerator.ORDER_ASSIGNMENT) || '1';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	return `for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${step}) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_forEach'] = function (block) {
	// 使用 getFieldValue 取得變數名稱，與 controls_for 保持一致
	const variable = block.getFieldValue('VARIABLE') || 'x';
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
