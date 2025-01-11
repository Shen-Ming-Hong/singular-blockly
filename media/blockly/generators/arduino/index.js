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

// 新增 scrub_ 函數來處理區塊堆疊
window.arduinoGenerator.scrub_ = function (block, code, opt_thisOnly) {
	const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
	const nextCode = opt_thisOnly ? '' : window.arduinoGenerator.blockToCode(nextBlock);
	return code + nextCode;
};

window.arduinoGenerator.forBlock['arduino_setup_loop'] = function (block) {
	// 取得 setup 和 loop 區塊的程式碼
	let setupCode = window.arduinoGenerator.statementToCode(block, 'SETUP');
	let loopCode = window.arduinoGenerator.statementToCode(block, 'LOOP');

	// 處理縮排
	if (setupCode) {
		setupCode = setupCode
			.split('\n')
			.filter(line => line.length > 0)
			.map(line => '  ' + line.trim())
			.join('\n');
	}

	if (loopCode) {
		loopCode = loopCode
			.split('\n')
			.filter(line => line.length > 0)
			.map(line => '  ' + line.trim())
			.join('\n');
	}

	// 產生程式碼
	let code = '#include <Arduino.h>\n\n';
	code += 'void setup() {\n';
	code += setupCode ? setupCode + '\n' : '';
	code += '}\n\n';
	code += 'void loop() {\n';
	code += loopCode ? loopCode + '\n' : '';
	code += '}\n';

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
