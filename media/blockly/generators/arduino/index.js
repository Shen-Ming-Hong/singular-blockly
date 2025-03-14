/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {import('blockly')} */
const Blockly = window.Blockly;

window.arduinoGenerator = new Blockly.Generator('Arduino');

window.arduinoGenerator.init = function (workspace) {
	window.arduinoGenerator.includes_ = Object.create(null); // 新增 includes 用於儲存 include 標頭檔
	window.arduinoGenerator.variables_ = Object.create(null); // 新增 variables 用於儲存全域變數
	window.arduinoGenerator.definitions_ = Object.create(null); // 新增 definitions 用於儲存其他定義
	window.arduinoGenerator.functions_ = Object.create(null); // 新增 functions 用於儲存函數
	window.arduinoGenerator.setupCode_ = []; // 新增 setupCode_ 用於儲存 setup 區塊的程式碼
	window.arduinoGenerator.warnings_ = []; // 新增 warnings_ 用於儲存警告訊息，如腳位模式不正確
	window.arduinoGenerator.pinModes_ = {}; // 每次生成代碼時重置腳位模式追蹤

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

	// 輸出警告訊息為註解
	let warnings = '';
	if (window.arduinoGenerator.warnings_ && window.arduinoGenerator.warnings_.length > 0) {
		warnings += '/* 腳位模式警告:\n';
		warnings += window.arduinoGenerator.warnings_.map(w => ' * ' + w).join('\n');
		warnings += '\n */\n\n';
	}

	// 同步腳位模式到 Blockly 積木 (確保積木上能正確顯示警告)
	if (window.pinModeTracker && typeof window.pinModeTracker.syncFromGenerator === 'function') {
		// 使用 setTimeout 確保在 UI 更新週期中執行，避免與當前代碼生成發生衝突
		setTimeout(function () {
			window.pinModeTracker.syncFromGenerator();
		}, 0);
	}

	// 返回完整程式碼，依序是：警告、includes、變數、定義、函數、主程式
	return warnings + includes + variables + definitions + functions + code;
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
