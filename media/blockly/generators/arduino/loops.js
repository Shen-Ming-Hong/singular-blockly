window.arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
	const repeats = window.arduinoGenerator.valueToCode(block, 'TIMES', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');
	let code = '';
	const loopVar = window.arduinoGenerator.variableDB_.getDistinctName('count', 'VARIABLE');

	code += `for (int ${loopVar} = 0; ${loopVar} < ${repeats}; ${loopVar}++) {\n${branch}}\n`;
	return code;
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
	const variable = window.arduinoGenerator.valueToCode(block, 'VAR', window.arduinoGenerator.ORDER_ATOMIC) || 'i';
	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const step = window.arduinoGenerator.valueToCode(block, 'BY', window.arduinoGenerator.ORDER_ASSIGNMENT) || '1';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');

	return `for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${step}) {\n${branch}}\n`;
};

window.arduinoGenerator.forBlock['controls_forEach'] = function (block) {
	const variable = window.arduinoGenerator.valueToCode(block, 'VAR', window.arduinoGenerator.ORDER_ATOMIC) || 'x';
	const list = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_ASSIGNMENT) || '[]';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO');
	const loopVar = window.arduinoGenerator.variableDB_.getDistinctName('count', 'VARIABLE');

	return `for (auto ${variable} : ${list}) {\n${branch}}\n`;
};
