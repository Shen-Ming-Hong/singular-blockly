/** @type {import('blockly')} */
const Blockly = window.Blockly;

window.arduinoGenerator = new Blockly.Generator('Arduino');

window.arduinoGenerator.init = function (workspace) {
	window.arduinoGenerator.definitions_ = Object.create(null);
	window.arduinoGenerator.functionNames_ = Object.create(null);

	// 初始化 nameDB_
	if (!window.arduinoGenerator.nameDB_) {
		window.arduinoGenerator.nameDB_ = new Blockly.Names(Blockly.Names.DEVELOPER_VARIABLE_TYPE);
	}
	// 重置 nameDB_
	window.arduinoGenerator.nameDB_.reset();
};

window.arduinoGenerator.finish = function (code) {
	// 先輸出所有定義
	let definitions = '';
	for (let name in window.arduinoGenerator.definitions_) {
		definitions += window.arduinoGenerator.definitions_[name];
	}
	// 確保返回完整的程式碼
	return definitions + code;
};

// 修改 arduino_setup_loop 的產生器
window.arduinoGenerator.forBlock['arduino_setup_loop'] = function (block) {
	// 取得 setup 和 loop 區塊的程式碼
	let setupCode = window.arduinoGenerator.statementToCode(block, 'SETUP') || '';
	let loopCode = window.arduinoGenerator.statementToCode(block, 'LOOP') || '';

	// 確保縮排正確
	setupCode = setupCode
		.split('\n')
		.map(line => '  ' + line)
		.join('\n');
	loopCode = loopCode
		.split('\n')
		.map(line => '  ' + line)
		.join('\n');

	// 產生完整的程式碼結構
	let code = '#include <Arduino.h>\n\n';
	code += 'void setup() {\n' + setupCode + '}\n\n';
	code += 'void loop() {\n' + loopCode + '}\n';

	return code;
};

// 移除在 definitions_ 中的 setup 和 loop，因為現在直接在上面產生
delete window.arduinoGenerator.definitions_['setup'];
delete window.arduinoGenerator.definitions_['loop'];

// IO 相關積木生成器
window.arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '13';
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || 'HIGH';
	return `digitalWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '2';
	return [`digitalRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '3';
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || '0';
	return `analogWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '0';
	return [`analogRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_delay'] = function (block) {
	const delay = window.arduinoGenerator.valueToCode(block, 'DELAY', window.arduinoGenerator.ORDER_ATOMIC) || '1000';
	return `delay(${delay});\n`;
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

// 邏輯操作
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

// 邏輯否定
window.arduinoGenerator.forBlock['logic_negate'] = function (block) {
	const argument0 = window.arduinoGenerator.valueToCode(block, 'BOOL', window.arduinoGenerator.ORDER_UNARY_PREFIX) || 'false';
	const code = '!' + argument0;
	return [code, window.arduinoGenerator.ORDER_UNARY_PREFIX];
};

// 邏輯布林值
window.arduinoGenerator.forBlock['logic_boolean'] = function (block) {
	const code = block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false';
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

// 三元運算子
window.arduinoGenerator.forBlock['logic_ternary'] = function (block) {
	const condition = window.arduinoGenerator.valueToCode(block, 'IF', window.arduinoGenerator.ORDER_CONDITIONAL) || 'false';
	const thenValue = window.arduinoGenerator.valueToCode(block, 'THEN', window.arduinoGenerator.ORDER_CONDITIONAL) || 'null';
	const elseValue = window.arduinoGenerator.valueToCode(block, 'ELSE', window.arduinoGenerator.ORDER_CONDITIONAL) || 'null';
	const code = `(${condition} ? ${thenValue} : ${elseValue})`;
	return [code, window.arduinoGenerator.ORDER_CONDITIONAL];
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

// For 迴圈
window.arduinoGenerator.forBlock['controls_for'] = function (block) {
	// 使用變數名稱作為迴圈變數，如果無法獲取則使用默認值
	let variable;
	try {
		variable = block.getField('VAR').getText();
	} catch (e) {
		variable = 'i';
	}

	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	const step = window.arduinoGenerator.valueToCode(block, 'BY', window.arduinoGenerator.ORDER_ASSIGNMENT) || '1';
	let branch = window.arduinoGenerator.statementToCode(block, 'DO');

	return `for (int ${variable} = ${from}; ${variable} <= ${to}; ${variable} += ${step}) {\n${branch}}\n`;
};

// forEach 迴圈
window.arduinoGenerator.forBlock['controls_forEach'] = function (block) {
	// 獲取變數名稱
	let variable;
	try {
		variable = block.getField('VAR').getText();
	} catch (e) {
		variable = 'item';
	}

	// 獲取要遍歷的列表
	const listCode = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_ASSIGNMENT) || '{}';

	// 獲取迴圈體
	let branch = window.arduinoGenerator.statementToCode(block, 'DO');

	// 產生臨時變數名稱用於迴圈計數
	const indexVar = window.arduinoGenerator.nameDB_
		? window.arduinoGenerator.nameDB_.getDistinctName(variable + '_index', 'VARIABLE')
		: 'i';

	// 產生臨時變數名稱用於儲存列表
	const listVar = window.arduinoGenerator.nameDB_
		? window.arduinoGenerator.nameDB_.getDistinctName(variable + '_list', 'VARIABLE')
		: 'list';

	// 定義列表變數
	let code = '';
	code += `int ${listVar}[] = ${listCode};\n`;
	code += `int ${listVar}_length = sizeof(${listVar}) / sizeof(${listVar}[0]);\n`;
	code += `for (int ${indexVar} = 0; ${indexVar} < ${listVar}_length; ${indexVar}++) {\n`;
	code += `  int ${variable} = ${listVar}[${indexVar}];\n`;
	code += branch;
	code += '}\n';

	return code;
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

// 數學常數
window.arduinoGenerator.forBlock['math_constant'] = function (block) {
	const CONSTANTS = {
		PI: 'PI',
		E: 'E',
		GOLDEN_RATIO: '1.61803398875',
		SQRT2: '1.41421356237',
		SQRT1_2: '0.707106781187',
		INFINITY: 'INFINITY',
	};
	const constant = block.getFieldValue('CONSTANT');
	return [CONSTANTS[constant], window.arduinoGenerator.ORDER_ATOMIC];
};

// 數學單一運算
window.arduinoGenerator.forBlock['math_single'] = function (block) {
	const operator = block.getFieldValue('OP');
	let arg = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
	let code;

	switch (operator) {
		case 'ABS':
			code = `abs(${arg})`;
			break;
		case 'NEG':
			code = `-${arg}`;
			break;
		case 'ROUND':
			code = `round(${arg})`;
			break;
		case 'ROUNDUP':
			code = `ceil(${arg})`;
			break;
		case 'ROUNDDOWN':
			code = `floor(${arg})`;
			break;
		default:
			throw new Error('Unknown math operator: ' + operator);
	}

	return [code, window.arduinoGenerator.ORDER_UNARY_PREFIX];
};

// 三角函數
window.arduinoGenerator.forBlock['math_trig'] = function (block) {
	const operator = block.getFieldValue('OP');
	const arg = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
	const code = operator.toLowerCase() + '(' + arg + ')';
	return [code, window.arduinoGenerator.ORDER_UNARY_PREFIX];
};

// 文字積木
window.arduinoGenerator.forBlock['text'] = function (block) {
	const textValue = block.getFieldValue('TEXT');
	return [`"${textValue}"`, window.arduinoGenerator.ORDER_ATOMIC];
};

// 文字拼接
window.arduinoGenerator.forBlock['text_join'] = function (block) {
	const items = new Array(block.itemCount_);
	for (let i = 0; i < block.itemCount_; i++) {
		items[i] = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '""';
	}
	const code = 'String(' + items.join(') + String(') + ')';
	return [code, window.arduinoGenerator.ORDER_ADDITIVE];
};

// 文字輸出（Serial.println）
window.arduinoGenerator.forBlock['text_print'] = function (block) {
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	// 確保 Serial 初始化
	window.arduinoGenerator.definitions_['serial_begin'] = '  Serial.begin(9600);\n';
	return `  Serial.println(${msg});\n`;
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
