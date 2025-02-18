/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['controls_if'] = function (block) {
	let code = '';
	const condition = window.arduinoGenerator.valueToCode(block, 'IF0', window.arduinoGenerator.ORDER_NONE) || 'false';
	const branch = window.arduinoGenerator.statementToCode(block, 'DO0');

	code += `if (${condition}) {\n${branch}}\n`;

	for (let i = 1; i <= block.elseifCount_; i++) {
		const condition = window.arduinoGenerator.valueToCode(block, 'IF' + i, window.arduinoGenerator.ORDER_NONE) || 'false';
		const branch = window.arduinoGenerator.statementToCode(block, 'DO' + i);
		code += `else if (${condition}) {\n${branch}}\n`;
	}

	if (block.elseCount_) {
		const branch = window.arduinoGenerator.statementToCode(block, 'ELSE');
		code += `else {\n${branch}}\n`;
	}

	return code;
};

window.arduinoGenerator.forBlock['logic_compare'] = function (block) {
	const OPERATORS = {
		EQ: '==',
		NEQ: '!=',
		LT: '<',
		LTE: '<=',
		GT: '>',
		GTE: '>=',
	};
	const operator = OPERATORS[block.getFieldValue('OP')];
	const order = window.arduinoGenerator.ORDER_RELATIONAL;
	const argument0 = window.arduinoGenerator.valueToCode(block, 'A', order) || '0';
	const argument1 = window.arduinoGenerator.valueToCode(block, 'B', order) || '0';
	return [`${argument0} ${operator} ${argument1}`, order];
};

window.arduinoGenerator.forBlock['logic_operation'] = function (block) {
	const OPERATORS = {
		AND: '&&',
		OR: '||',
	};
	const operator = OPERATORS[block.getFieldValue('OP')];
	const order = operator === '&&' ? window.arduinoGenerator.ORDER_LOGICAL_AND : window.arduinoGenerator.ORDER_LOGICAL_OR;
	const argument0 = window.arduinoGenerator.valueToCode(block, 'A', order) || 'false';
	const argument1 = window.arduinoGenerator.valueToCode(block, 'B', order) || 'false';
	const code = `${argument0} ${operator} ${argument1}`;
	return [code, order];
};

window.arduinoGenerator.forBlock['logic_negate'] = function (block) {
	const argument0 = window.arduinoGenerator.valueToCode(block, 'BOOL', window.arduinoGenerator.ORDER_UNARY_PREFIX) || 'false';
	const code = '!' + argument0;
	return [code, window.arduinoGenerator.ORDER_UNARY_PREFIX];
};

window.arduinoGenerator.forBlock['logic_boolean'] = function (block) {
	const code = block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['logic_null'] = function (block) {
	return ['NULL', window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['logic_ternary'] = function (block) {
	const condition = window.arduinoGenerator.valueToCode(block, 'IF', window.arduinoGenerator.ORDER_CONDITIONAL) || 'false';
	const thenValue = window.arduinoGenerator.valueToCode(block, 'THEN', window.arduinoGenerator.ORDER_CONDITIONAL) || 'null';
	const elseValue = window.arduinoGenerator.valueToCode(block, 'ELSE', window.arduinoGenerator.ORDER_CONDITIONAL) || 'null';
	const code = `(${condition} ? ${thenValue} : ${elseValue})`;
	return [code, window.arduinoGenerator.ORDER_CONDITIONAL];
};
