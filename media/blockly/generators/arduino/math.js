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
