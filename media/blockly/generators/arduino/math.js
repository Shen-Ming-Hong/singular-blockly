/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['math_number'] = function (block) {
	const code = Number(block.getFieldValue('NUM'));
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_arithmetic'] = function (block) {
	const OPERATORS = {
		ADD: [' + ', window.arduinoGenerator.ORDER_ADDITIVE],
		MINUS: [' - ', window.arduinoGenerator.ORDER_ADDITIVE],
		MULTIPLY: [' * ', window.arduinoGenerator.ORDER_MULTIPLICATIVE],
		DIVIDE: [' / ', window.arduinoGenerator.ORDER_MULTIPLICATIVE],
		POWER: [' pow ', window.arduinoGenerator.ORDER_NONE],
	};
	const tuple = OPERATORS[block.getFieldValue('OP')];
	const operator = tuple[0];
	const order = tuple[1];
	const argument0 = window.arduinoGenerator.valueToCode(block, 'A', order) || '0';
	const argument1 = window.arduinoGenerator.valueToCode(block, 'B', order) || '0';

	let code;
	if (operator === ' pow ') {
		code = 'pow(' + argument0 + ', ' + argument1 + ')';
	} else {
		code = argument0 + operator + argument1;
	}
	return [code, order];
};

window.arduinoGenerator.forBlock['math_constant'] = function (block) {
	const CONSTANTS = {
		PI: 'PI',
		E: 'E',
		GOLDEN_RATIO: '1.61803398875',
		SQRT2: 'sqrt(2)',
		SQRT1_2: 'sqrt(0.5)',
		INFINITY: 'INFINITY',
	};
	const constant = block.getFieldValue('CONSTANT');
	return [CONSTANTS[constant], window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_single'] = function (block) {
	const operator = block.getFieldValue('OP');
	const arg = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
	let code;

	switch (operator) {
		case 'ABS':
			code = `abs(${arg})`;
			break;
		case 'ROOT':
			code = `sqrt(${arg})`;
			break;
		case 'LN':
			code = `log(${arg})`;
			break;
		case 'LOG10':
			code = `log10(${arg})`;
			break;
		case 'EXP':
			code = `exp(${arg})`;
			break;
		case 'POW10':
			code = `pow(10,${arg})`;
			break;
		case 'NEG':
			code = `-${arg}`;
			break;
	}
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_trig'] = function (block) {
	const operator = block.getFieldValue('OP');
	const arg = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
	const code = `${operator.toLowerCase()}(${arg})`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_number_property'] = function (block) {
	const number = window.arduinoGenerator.valueToCode(block, 'NUMBER_TO_CHECK', window.arduinoGenerator.ORDER_NONE) || '0';
	const property = block.getFieldValue('PROPERTY');
	let code;

	// 根據不同屬性處理
	switch (property) {
		case 'EVEN':
			code = `((int)(${number}) % 2 == 0)`;
			break;
		case 'ODD':
			code = `((int)(${number}) % 2 == 1)`;
			break;
		case 'PRIME':
			// 在 setup() 之前添加 isPrime 函數
			window.arduinoGenerator.functions_['isPrime'] = `
bool isPrime(int n) {
    if (n <= 1) return false;
    if (n == 2) return true;
    if (n % 2 == 0) return false;
    for (int i = 3; i * i <= n; i += 2) {
        if (n % i == 0) return false;
    }
    return true;
}
`;
			code = `isPrime((int)(${number}))`;
			break;
		case 'WHOLE':
			code = `(floor(${number}) == ${number})`;
			break;
		case 'POSITIVE':
			code = `(${number} > 0)`;
			break;
		case 'NEGATIVE':
			code = `(${number} < 0)`;
			break;
		case 'DIVISIBLE_BY':
			const divisor = window.arduinoGenerator.valueToCode(block, 'DIVISOR', window.arduinoGenerator.ORDER_NONE) || '0';
			code = `((int)(${number}) % (int)(${divisor}) == 0)`;
			break;
	}
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_round'] = function (block) {
	const operation = block.getFieldValue('OP');
	const number = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
	let code;

	switch (operation) {
		case 'ROUND':
			code = `round(${number})`;
			break;
		case 'ROUNDUP':
			code = `ceil(${number})`;
			break;
		case 'ROUNDDOWN':
			code = `floor(${number})`;
			break;
	}
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_modulo'] = function (block) {
	const dividend = window.arduinoGenerator.valueToCode(block, 'DIVIDEND', window.arduinoGenerator.ORDER_NONE) || '0';
	const divisor = window.arduinoGenerator.valueToCode(block, 'DIVISOR', window.arduinoGenerator.ORDER_NONE) || '0';
	const code = `(${dividend} % ${divisor})`;
	return [code, window.arduinoGenerator.ORDER_MULTIPLICATIVE];
};

window.arduinoGenerator.forBlock['math_constrain'] = function (block) {
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '0';
	const low = window.arduinoGenerator.valueToCode(block, 'LOW', window.arduinoGenerator.ORDER_NONE) || '0';
	const high = window.arduinoGenerator.valueToCode(block, 'HIGH', window.arduinoGenerator.ORDER_NONE) || '0';
	const code = `constrain(${value}, ${low}, ${high})`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_random_int'] = function (block) {
	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_NONE) || '0';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_NONE) || '0';
	const code = `random(${from}, ${to} + 1)`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_random_float'] = function (block) {
	return ['(random(0, RAND_MAX) / (float)RAND_MAX)', window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['math_atan2'] = function (block) {
	const x = window.arduinoGenerator.valueToCode(block, 'X', window.arduinoGenerator.ORDER_NONE) || '0';
	const y = window.arduinoGenerator.valueToCode(block, 'Y', window.arduinoGenerator.ORDER_NONE) || '0';
	const code = `atan2(${y}, ${x})`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};
