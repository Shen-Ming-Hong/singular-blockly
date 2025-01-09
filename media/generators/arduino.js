/** @type {import('blockly')} */
const Blockly = window.Blockly;

window.arduinoGenerator = new Blockly.Generator('Arduino');

window.arduinoGenerator.init = function (workspace) {
	// 只初始化變數，不預設任何程式碼
	window.arduinoGenerator.definitions_ = Object.create(null);
	window.arduinoGenerator.functionNames_ = Object.create(null);
};

window.arduinoGenerator.finish = function (code) {
	let definitions = '';
	for (let name in window.arduinoGenerator.definitions_) {
		definitions += window.arduinoGenerator.definitions_[name];
	}

	// 只在有 setup 和 loop 定義時才添加基本結構
	if (!window.arduinoGenerator.definitions_['setup'] && !window.arduinoGenerator.definitions_['loop']) {
		return code; // 如果沒有 setup 和 loop，直接返回代碼
	}

	return definitions + code;
};

// Arduino setup_loop 積木的代碼生成
window.arduinoGenerator.forBlock['arduino_setup_loop'] = function (block) {
	let setupCode = window.arduinoGenerator.statementToCode(block, 'SETUP') || '';
	let loopCode = window.arduinoGenerator.statementToCode(block, 'LOOP') || '';

	// 當這個積木被使用時，添加必要的結構
	window.arduinoGenerator.definitions_['include'] = '#include <Arduino.h>\n';
	window.arduinoGenerator.definitions_['setup'] = 'void setup() {\n' + setupCode + '}\n\n';
	window.arduinoGenerator.definitions_['loop'] = 'void loop() {\n' + loopCode + '}\n';

	return '';
};

// 邏輯積木
window.arduinoGenerator.forBlock['controls_if'] = function (block) {
	let code = '';
	let condition = window.arduinoGenerator.valueToCode(block, 'IF0', window.arduinoGenerator.ORDER_NONE) || 'false';
	let branch = window.arduinoGenerator.statementToCode(block, 'DO0');

	code += `if (${condition}) {\n${branch}}\n`;

	for (let i = 1; i <= block.elseifCount_; i++) {
		condition = window.arduinoGenerator.valueToCode(block, 'IF' + i, window.arduinoGenerator.ORDER_NONE) || 'false';
		branch = window.arduinoGenerator.statementToCode(block, 'DO' + i);
		code += `else if (${condition}) {\n${branch}}\n`;
	}

	if (block.elseCount_) {
		branch = window.arduinoGenerator.statementToCode(block, 'ELSE');
		code += `else {\n${branch}}\n`;
	}

	return code;
};

// 比較運算
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
	const argument0 = window.arduinoGenerator.valueToCode(block, 'A', window.arduinoGenerator.ORDER_RELATIONAL) || '0';
	const argument1 = window.arduinoGenerator.valueToCode(block, 'B', window.arduinoGenerator.ORDER_RELATIONAL) || '0';
	return [`${argument0} ${operator} ${argument1}`, window.arduinoGenerator.ORDER_RELATIONAL];
};

// 迴圈積木
window.arduinoGenerator.forBlock['controls_repeat_ext'] = function (block) {
	const repeats = window.arduinoGenerator.valueToCode(block, 'TIMES', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	let branch = window.arduinoGenerator.statementToCode(block, 'DO');
	branch = window.arduinoGenerator.addLoopTrap(branch, block);
	let code = '';
	const loopVar = window.arduinoGenerator.nameDB_ ? window.arduinoGenerator.nameDB_.getDistinctName('count', 'VARIABLE') : 'count';
	code += 'for (int ' + loopVar + ' = 0; ' + loopVar + ' < ' + repeats + '; ' + loopVar + '++) {\n' + branch + '}\n';
	return code;
};

// while 迴圈
window.arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
	const until = block.getFieldValue('MODE') === 'UNTIL';
	let argument0 = window.arduinoGenerator.valueToCode(block, 'BOOL', window.arduinoGenerator.ORDER_NONE) || 'false';
	let branch = window.arduinoGenerator.statementToCode(block, 'DO');
	if (until) {
		argument0 = `!(${argument0})`;
	}
	return `while (${argument0}) {\n${branch}}\n`;
};

// 數字積木
window.arduinoGenerator.forBlock['math_number'] = function (block) {
	const code = String(block.getFieldValue('NUM'));
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

// 數學運算
window.arduinoGenerator.forBlock['math_arithmetic'] = function (block) {
	const OPERATORS = {
		ADD: ['+', window.arduinoGenerator.ORDER_ADDITIVE],
		MINUS: ['-', window.arduinoGenerator.ORDER_ADDITIVE],
		MULTIPLY: ['*', window.arduinoGenerator.ORDER_MULTIPLICATIVE],
		DIVIDE: ['/', window.arduinoGenerator.ORDER_MULTIPLICATIVE],
		POWER: ['^', window.arduinoGenerator.ORDER_NONE],
	};
	const tuple = OPERATORS[block.getFieldValue('OP')];
	const operator = tuple[0];
	const order = tuple[1];
	const argument0 = window.arduinoGenerator.valueToCode(block, 'A', order) || '0';
	const argument1 = window.arduinoGenerator.valueToCode(block, 'B', order) || '0';
	const code = `${argument0} ${operator} ${argument1}`;
	return [code, order];
};

// 文字積木
window.arduinoGenerator.forBlock['text'] = function (block) {
	const textValue = block.getFieldValue('TEXT');
	return [`"${textValue}"`, window.arduinoGenerator.ORDER_ATOMIC];
};

// 文字輸出（Serial.println）
window.arduinoGenerator.forBlock['text_print'] = function (block) {
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	return `Serial.println(${msg});\n`;
};

// 設定運算子優先順序常數
window.arduinoGenerator.ORDER_ATOMIC = 0; // 0 "" ...
window.arduinoGenerator.ORDER_UNARY_POSTFIX = 1; // expr++ expr--
window.arduinoGenerator.ORDER_UNARY_PREFIX = 2; // -expr !expr
window.arduinoGenerator.ORDER_MULTIPLICATIVE = 3; // * / %
window.arduinoGenerator.ORDER_ADDITIVE = 4; // + -
window.arduinoGenerator.ORDER_SHIFT = 5; // << >>
window.arduinoGenerator.ORDER_RELATIONAL = 6; // < <= > >=
window.arduinoGenerator.ORDER_EQUALITY = 7; // == !=
window.arduinoGenerator.ORDER_BITWISE_AND = 8; // &
window.arduinoGenerator.ORDER_BITWISE_XOR = 9; // ^
window.arduinoGenerator.ORDER_BITWISE_OR = 10; // |
window.arduinoGenerator.ORDER_LOGICAL_AND = 11; // &&
window.arduinoGenerator.ORDER_LOGICAL_OR = 12; // ||
window.arduinoGenerator.ORDER_CONDITIONAL = 13; // ?:
window.arduinoGenerator.ORDER_ASSIGNMENT = 14; // = += -= *= /=
window.arduinoGenerator.ORDER_NONE = 99; // (...)
