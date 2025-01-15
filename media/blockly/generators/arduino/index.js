/** @type {import('blockly')} */
const Blockly = window.Blockly;

window.arduinoGenerator = new Blockly.Generator('Arduino');

window.arduinoGenerator.init = function (workspace) {
	window.arduinoGenerator.includes_ = Object.create(null); // 新增 includes 用於儲存 include 標頭檔
	window.arduinoGenerator.variables_ = Object.create(null); // 新增 variables 用於儲存全域變數
	window.arduinoGenerator.definitions_ = Object.create(null); // 新增 definitions 用於儲存其他定義
	window.arduinoGenerator.functions_ = Object.create(null); // 新增 functions 用於儲存函數
	window.arduinoGenerator.setupCode_ = []; // 新增 setupCode_ 用於儲存 setup 區塊的程式碼

	// 初始化 nameDB_
	if (!window.arduinoGenerator.nameDB_) {
		window.arduinoGenerator.nameDB_ = new Blockly.Names(Blockly.Names.DEVELOPER_VARIABLE_TYPE);
	}
	// 重置 nameDB_
	window.arduinoGenerator.nameDB_.reset();
};

window.arduinoGenerator.finish = function (code) {
	// 首先輸出所有 include
	let includes = '';
	for (let name in window.arduinoGenerator.includes_) {
		includes += window.arduinoGenerator.includes_[name] + '\n';
	}
	includes += '\n';

	// 輸出全域變數宣告
	let variables = '';
	for (let name in window.arduinoGenerator.variables_) {
		variables += window.arduinoGenerator.variables_[name] + '\n';
	}
	if (variables) {
		variables += '\n';
	}

	// 輸出其他定義
	let definitions = '';
	for (let name in window.arduinoGenerator.definitions_) {
		definitions += window.arduinoGenerator.definitions_[name];
	}

	// 輸出函數定義
	let functions = '';
	for (let name in window.arduinoGenerator.functions_) {
		functions += window.arduinoGenerator.functions_[name] + '\n';
	}

	// 返回完整程式碼，依序是：includes、變數、定義、函數、主程式
	return includes + variables + definitions + functions + code;
};

window.arduinoGenerator.scrub_ = function (block, code, opt_thisOnly) {
	const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
	const nextCode = opt_thisOnly ? '' : window.arduinoGenerator.blockToCode(nextBlock);
	return code + nextCode;
};

window.arduinoGenerator.forBlock['arduino_setup_loop'] = function (block) {
	// 自動包含 Arduino.h
	window.arduinoGenerator.includes_['arduino'] = '#include <Arduino.h>';

	// 取得一般的 setup 和 loop 區塊程式碼
	let setupCode = window.arduinoGenerator.statementToCode(block, 'SETUP');
	let loopCode = window.arduinoGenerator.statementToCode(block, 'LOOP');

	// 處理 setupCode_ 陣列中的額外初始化代碼
	let extraSetupCode = '';
	if (window.arduinoGenerator.setupCode_ && window.arduinoGenerator.setupCode_.length > 0) {
		// 移除重複的程式碼
		const uniqueSetupCode = [...new Set(window.arduinoGenerator.setupCode_)];
		extraSetupCode = uniqueSetupCode.join('\n  ') + '\n';
	}

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

	// 產生程式碼，確保 extraSetupCode 加在 setup 的最後面
	let code = '\n';
	code += 'void setup() {\n';
	code += extraSetupCode ? '  ' + extraSetupCode : ''; // 加入額外的初始化代碼
	code += setupCode ? setupCode + '\n' : '';
	code += '}\n\n';
	code += 'void loop() {\n';
	code += loopCode ? loopCode + '\n' : '';
	code += '}\n';

	return code;
};

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
window.arduinoGenerator.ORDER_NONE = 99; // ()

// 在 ORDER_NONE 定義後面加入變數相關的生成器
window.arduinoGenerator.forBlock['variables_get'] = function (block) {
	const varName = block.getField('VAR').getText();
	// 不在這裡處理變數宣告,讓各模組自行決定變數類型
	return [varName, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['variables_set'] = function (block) {
	const varName = block.getField('VAR').getText();
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';
	// 不在這裡處理變數宣告,讓各模組自行決定變數類型
	return `${varName} = ${value};\n`;
};
