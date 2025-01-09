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

delete window.arduinoGenerator.definitions_['setup'];
delete window.arduinoGenerator.definitions_['loop'];

// 運算子優先順序常數定義
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
