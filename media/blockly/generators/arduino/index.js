/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {import('blockly')} */
const Blockly = window.Blockly;

window.arduinoGenerator = new Blockly.Generator('Arduino');

// 註冊積木類型到 alwaysGenerateBlocks_ 列表的輔助函數
window.arduinoGenerator.registerAlwaysGenerateBlock = function (blockType) {
	// 確保 alwaysGenerateBlocks_ 陣列已初始化
	window.arduinoGenerator.alwaysGenerateBlocks_ = window.arduinoGenerator.alwaysGenerateBlocks_ || [];
	// 確保不重複添加
	if (!window.arduinoGenerator.alwaysGenerateBlocks_.includes(blockType)) {
		window.arduinoGenerator.alwaysGenerateBlocks_.push(blockType);
		if (typeof log !== 'undefined') {
			log.debug(`已註冊積木類型 "${blockType}" 到 alwaysGenerateBlocks_ 列表`);
		}
	}
};

// 函式名稱轉換器: 將中文函式名稱或包含非法字符的函式名稱轉換為合法的 C++ 函式名稱
window.arduinoGenerator.convertFunctionName = function (name) {
	// 檢查是否包含中文字符
	const containsChinese = /[\u4e00-\u9fa5]/.test(name);
	// 檢查是否以數字開頭
	const startsWithNumber = /^\d/.test(name);
	// 檢查是否包含短橫線
	const containsDash = name.includes('-');

	// 如果不包含中文、不以數字開頭，且不包含短橫線，直接返回原始名稱
	if (!containsChinese && !startsWithNumber && !containsDash) {
		return name;
	}

	// 替換短橫線為底線
	let processedName = name.replace(/-/g, '_');

	// 如果以數字開頭但不包含中文，只需加前綴
	if (startsWithNumber && !containsChinese) {
		return 'fn' + processedName;
	}

	// 如果包含中文，進行轉換
	if (containsChinese) {
		return (
			'fn' +
			Array.from(processedName)
				.map(char => {
					if (/[a-zA-Z0-9_]/.test(char)) {
						return char;
					}
					return char.charCodeAt(0).toString(16);
				})
				.join('_')
		);
	}

	// 若只有短橫線，已經替換為底線的名稱可直接返回
	return processedName;
};

window.arduinoGenerator.init = function (workspace) {
	window.arduinoGenerator.includes_ = Object.create(null); // 新增 includes 用於儲存 include 標頭檔
	window.arduinoGenerator.variables_ = Object.create(null); // 新增 variables 用於儲存全域變數
	window.arduinoGenerator.definitions_ = Object.create(null); // 新增 definitions 用於儲存其他定義
	window.arduinoGenerator.functions_ = Object.create(null); // 新增 functions 用於儲存函數
	window.arduinoGenerator.comments_ = Object.create(null); // 新增 comments_ 用於儲存註釋
	window.arduinoGenerator.setupCode_ = []; // 新增 setupCode_ 用於儲存 setup 區塊的程式碼
	window.arduinoGenerator.warnings_ = []; // 新增 warnings_ 用於儲存警告訊息，如腳位模式不正確
	window.arduinoGenerator.pinModes_ = {}; // 每次生成代碼時重置腳位模式追蹤
	window.arduinoGenerator.lib_deps_ = []; // 新增 lib_deps_ 用於儲存 platformio.ini 庫依賴
	window.arduinoGenerator.build_flags_ = []; // 新增 build_flags_ 用於儲存 platformio.ini 編譯標誌
	window.arduinoGenerator.lib_ldf_mode_ = null; // 新增 lib_ldf_mode_ 用於儲存 platformio.ini 庫連結模式
	// 初始化為空陣列，各模組將在載入時自動註冊它們的積木類型
	window.arduinoGenerator.alwaysGenerateBlocks_ = window.arduinoGenerator.alwaysGenerateBlocks_ || []; // 新增 alwaysGenerateBlocks_ 用於儲存「只要召喚出來就一定會有code不論積木放在哪一個位置」情況的所有積木類型

	// 初始化 nameDB_
	if (!window.arduinoGenerator.nameDB_) {
		window.arduinoGenerator.nameDB_ = new Blockly.Names(Blockly.Names.DEVELOPER_VARIABLE_TYPE);
	}
	// 重置 nameDB_
	window.arduinoGenerator.nameDB_.reset();

	// 預先檢查工作區中是否有特定積木，例如需要初始化Serial的積木
	if (workspace) {
		window.arduinoGenerator.preCheckWorkspace(workspace);
	}
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
	} // 處理函數: 1. 前向宣告, 2. 按照原始順序定義函數
	const functionNames = Object.keys(window.arduinoGenerator.functions_);
	let forwardDeclarations = '';
	let functionDefinitions = '';

	if (functionNames.length > 0) {
		// 生成所有函數的前向宣告
		functionNames.forEach(name => {
			// 從函數定義提取參數和返回類型
			const funcDef = window.arduinoGenerator.functions_[name];

			// 使用更健壯的正則表達式匹配函式定義
			// 匹配模式: 首先跳過註解，然後提取返回類型、函式名稱和參數列表
			const commentPattern = /(?:\/\/.*(?:\r?\n|\r)|\/\*[\s\S]*?\*\/\s*)*/.source;
			const returnTypePattern = /(\w+)/.source;
			const funcNamePattern = /\s+([\w\d_]+)/.source;
			const paramsPattern = /\s*\(([\s\S]*?)\)/.source;

			const fullPattern = new RegExp(`^\\s*${commentPattern}${returnTypePattern}${funcNamePattern}${paramsPattern}`);

			const signatureMatch = funcDef.match(fullPattern);

			if (signatureMatch) {
				const returnType = signatureMatch[1]; // void, int 等
				const funcName = signatureMatch[2]; // 函數名稱
				const params = signatureMatch[3].trim(); // 參數列表（去除首尾空白）

				// 創建前向宣告
				forwardDeclarations += `${returnType} ${funcName}(${params});\n`;
			} else {
				// 特殊情況處理：對於無法匹配的函式，嘗試更寬鬆的匹配或直接使用函式名
				log.warn(`無法解析函式簽名：${name}`);
				// 至少確保函式名稱正確
				// 默認假設為 void 函式，無參數
				forwardDeclarations += `void ${name}();\n`;
			}
		});

		// 使用原始順序生成函數定義
		functionNames.forEach(name => {
			functionDefinitions += window.arduinoGenerator.functions_[name];
		});

		// 使用日誌輸出函數定義順序
		if (typeof log !== 'undefined') {
			log.info('函數數量:', functionNames.length);
			log.info('函數列表:', functionNames);
		}
	}

	// 輸出前向宣告和原始順序的函數定義
	let functions = '';
	if (forwardDeclarations) {
		functions = '// 函數前向宣告\n' + forwardDeclarations + '\n';
	}
	functions += functionDefinitions;
	// 輸出警告訊息為註解
	let warnings = '';
	if (window.arduinoGenerator.warnings_ && window.arduinoGenerator.warnings_.length > 0) {
		warnings += '/* 腳位模式警告:\n';
		warnings += window.arduinoGenerator.warnings_.map(w => ' * ' + w).join('\n');
		warnings += '\n */\n\n';
	}

	// 處理註釋
	let comments = '';
	for (let name in window.arduinoGenerator.comments_) {
		comments += window.arduinoGenerator.comments_[name];
	}
	if (comments) {
		comments += '\n';
	}

	// 同步腳位模式到 Blockly 積木 (確保積木上能正確顯示警告)
	if (window.pinModeTracker && typeof window.pinModeTracker.syncFromGenerator === 'function') {
		// 使用 setTimeout 確保在 UI 更新週期中執行，避免與當前代碼生成發生衝突
		setTimeout(function () {
			window.pinModeTracker.syncFromGenerator();
		}, 0);
	}

	// 返回完整程式碼，依序是：警告、註釋、includes、變數、定義、函數、主程式
	return warnings + comments + includes + variables + definitions + functions + code;
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
	let loopCode = window.arduinoGenerator.statementToCode(block, 'LOOP'); // 【新增】通用掃描所有必須生成代碼的積木，不論位置
	// 使用 alwaysGenerateBlocks_ 陣列來動態確定哪些積木類型需要自動掃描
	const ws = Blockly.getMainWorkspace();
	ws.getAllBlocks(false)
		.filter(b => window.arduinoGenerator.alwaysGenerateBlocks_.includes(b.type))
		.forEach(b => window.arduinoGenerator.forBlock[b.type](b));

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

window.arduinoGenerator.preCheckWorkspace = function (workspace) {
	// 檢查工作區中所有積木，包括函數內部的積木
	const allBlocks = workspace.getAllBlocks(false);

	// 檢查是否有需要 Serial 初始化的積木（如 text_print, text_prompt_ext）
	const hasSerialBlocks = allBlocks.some(block => block.type === 'text_print' || block.type === 'text_prompt_ext');

	// 如果有需要 Serial 的積木，確保添加必要的設定
	if (hasSerialBlocks) {
		window.arduinoGenerator.includes_['arduino'] = '#include <Arduino.h>';
		if (!window.arduinoGenerator.setupCode_.includes('Serial.begin(9600);')) {
			window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');
		}
	}
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
