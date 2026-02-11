/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython code generator for CyberBrick
 */

'use strict';

/**
 * MicroPython 程式碼生成器
 * 為 CyberBrick 主板生成 MicroPython 程式碼
 */
window.micropythonGenerator = new Blockly.Generator('MicroPython');

// 設定縮排（4 空格，Python 標準）
window.micropythonGenerator.INDENT = '    ';

// 運算子優先順序（參考 Python 官方文件）
window.micropythonGenerator.ORDER_ATOMIC = 0; // 0 "" ...
window.micropythonGenerator.ORDER_COLLECTION = 1; // tuples, lists, dictionaries
window.micropythonGenerator.ORDER_STRING_CONVERSION = 1; // `expression...`
window.micropythonGenerator.ORDER_MEMBER = 2.1; // . []
window.micropythonGenerator.ORDER_FUNCTION_CALL = 2.2; // ()
window.micropythonGenerator.ORDER_EXPONENTIATION = 3; // **
window.micropythonGenerator.ORDER_UNARY_SIGN = 4; // + -
window.micropythonGenerator.ORDER_BITWISE_NOT = 4; // ~
window.micropythonGenerator.ORDER_MULTIPLICATIVE = 5; // * / // %
window.micropythonGenerator.ORDER_ADDITIVE = 6; // + -
window.micropythonGenerator.ORDER_BITWISE_SHIFT = 7; // << >>
window.micropythonGenerator.ORDER_BITWISE_AND = 8; // &
window.micropythonGenerator.ORDER_BITWISE_XOR = 9; // ^
window.micropythonGenerator.ORDER_BITWISE_OR = 10; // |
window.micropythonGenerator.ORDER_RELATIONAL = 11; // in, not in, is, is not, <, <=, >, >=, <>, !=, ==
window.micropythonGenerator.ORDER_LOGICAL_NOT = 12; // not
window.micropythonGenerator.ORDER_LOGICAL_AND = 13; // and
window.micropythonGenerator.ORDER_LOGICAL_OR = 14; // or
window.micropythonGenerator.ORDER_CONDITIONAL = 15; // if else
window.micropythonGenerator.ORDER_LAMBDA = 16; // lambda
window.micropythonGenerator.ORDER_NONE = 99; // (...)

/**
 * Import 追蹤集合
 * 用於收集生成程式碼所需的 import 語句
 */
window.micropythonGenerator.imports_ = new Set();

/**
 * 全域變數追蹤
 * 用於收集全域變數宣告
 */
window.micropythonGenerator.variables_ = new Map();

/**
 * 目前正在生成的函式
 */
window.micropythonGenerator.currentFunction_ = 'main';

/**
 * 函式內賦值追蹤
 */
window.micropythonGenerator.functionGlobals_ = new Map();

/**
 * 硬體初始化追蹤
 * 用於收集硬體初始化程式碼（Pin, PWM, ADC 等）
 */
window.micropythonGenerator.hardwareInit_ = new Map();

/**
 * 自訂函數定義
 */
window.micropythonGenerator.functions_ = new Map();

/**
 * 重置生成器狀態
 * 在每次生成程式碼前呼叫
 */
window.micropythonGenerator.reset = function () {
	this.imports_.clear();
	this.variables_.clear();
	this.hardwareInit_.clear();
	this.functions_.clear();
	this.currentFunction_ = 'main';
	this.functionGlobals_.clear();
};

/**
 * 允許獨立生成的積木類型（不需要連接到主程式）
 * 主要是自訂函數定義，它們會被放到 functions_ 區塊
 */
window.micropythonGenerator.allowedTopLevelBlocks_ = [
	'micropython_main',
	'procedures_defnoreturn',
	'procedures_defreturn',
	'arduino_function',
];

/**
 * 自訂 workspaceToCode 方法
 * 只處理允許的頂層積木，忽略流浪的積木
 * @param {!Blockly.Workspace} workspace Blockly 工作區
 * @returns {string} 生成的程式碼
 */
window.micropythonGenerator.workspaceToCode = function (workspace) {
	if (!workspace) {
		console.warn('[MicroPython] No workspace provided');
		return '';
	}

	// 初始化
	this.init(workspace);

	// 取得所有頂層積木
	const blocks = workspace.getTopBlocks(true);
	let code = '';

	// 只處理允許的頂層積木
	for (const block of blocks) {
		if (!block.isEnabled() || block.getInheritedDisabled()) {
			continue;
		}

		// 檢查是否為允許的頂層積木
		if (this.allowedTopLevelBlocks_.includes(block.type)) {
			const blockCode = this.blockToCode(block);
			if (typeof blockCode === 'string') {
				code += blockCode;
			} else if (Array.isArray(blockCode)) {
				// Value block 返回 [code, order]
				// 頂層的 value block 應該被忽略
			}
		} else {
			// 孤立積木：加上跳過註解
			code += `# [Skipped] Orphan block: ${block.type} (not in setup/loop/function)\n`;
		}
	}

	// 完成處理
	code = this.finish(code);

	// 清理縮排
	code = code.replace(/^\s+\n/gm, '\n');
	code = code.replace(/\n\n+/g, '\n\n');
	code = code.replace(/^\n+/, '');
	code = code.replace(/\n+$/, '\n');

	return code;
};

/**
 * 初始化生成器
 * @param {!Blockly.Workspace} workspace Blockly 工作區
 */
window.micropythonGenerator.init = function (workspace) {
	// 重置狀態
	this.reset();

	// 建立變數資料庫
	if (!this.nameDB_) {
		this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
	} else {
		this.nameDB_.reset();
	}

	// 每次初始化時覆寫 safeName 方法，保留中文識別符（Python 3 支援 Unicode 識別符）
	// 注意：Blockly 的方法名是 safeName（無底線）
	this.nameDB_.safeName = function (name) {
		if (!name) {
			return Blockly.Msg.UNNAMED_KEY || 'unnamed';
		}
		// Python 3 支援 Unicode 識別符，只需處理：
		// 1. 空格轉底線
		// 2. 移除特殊運算符號（保留中文、英文、數字、底線）
		// 3. 數字開頭加 my_ 前綴
		let safeName = name.replace(/ /g, '_');
		// 保留中文（CJK 統一漢字）、英文、數字、底線
		safeName = safeName.replace(/[^\w\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, '_');
		// 數字開頭加前綴
		if (/^[0-9]/.test(safeName)) {
			safeName = 'my_' + safeName;
		}
		return safeName || 'unnamed';
	};

	this.nameDB_.setVariableMap(workspace.getVariableMap());
	this.nameDB_.populateVariables(workspace);
	this.nameDB_.populateProcedures(workspace);

	this.currentFunction_ = 'main';
	this.functionGlobals_.clear();
	this.functionGlobals_.set('main', new Set());
};

/**
 * 完成生成器
 * @param {string} code 生成的程式碼
 * @returns {string} 完整的程式碼
 */
window.micropythonGenerator.finish = function (code) {
	// 組合 import 語句
	const imports = Array.from(this.imports_).sort().join('\n');

	// 組合硬體初始化（按 key 排序，確保 espnow_* 在 rc_* 之前）
	const hardwareInitKeys = Array.from(this.hardwareInit_.keys()).sort();
	const hardwareInit = hardwareInitKeys.map(k => this.hardwareInit_.get(k)).join('\n');

	// 組合全域變數
	const variables = Array.from(this.variables_.values())
		.map(v => `${v.name} = ${v.initialValue}`)
		.join('\n');

	// 組合自訂函數
	const functions = Array.from(this.functions_.values())
		.map(f => f.code)
		.join('\n\n');

	// 生成完整程式碼
	let fullCode = '# === CyberBrick MicroPython ===\n';
	fullCode += `# Generated: ${new Date().toISOString()}\n\n`;

	if (imports) {
		fullCode += '# [1] Imports\n';
		fullCode += imports + '\n\n';
	}

	if (hardwareInit) {
		fullCode += '# [2] Hardware Initialization\n';
		fullCode += hardwareInit + '\n\n';
	}

	if (variables) {
		fullCode += '# [3] Global Variables\n';
		fullCode += variables + '\n\n';
	}

	if (functions) {
		fullCode += '# [4] User Functions\n';
		fullCode += functions + '\n\n';
	}

	// 組合主程式，包裝在 def main(): 中
	const mainGlobals = this.functionGlobals_.get('main');
	let mainGlobalDecl = '';
	if (mainGlobals && mainGlobals.size > 0) {
		mainGlobalDecl = this.INDENT + 'global ' + Array.from(mainGlobals).join(', ') + '\n';
	}

	fullCode += '# [5] Main Program\n';
	fullCode += 'def main():\n';
	if (mainGlobalDecl) {
		fullCode += mainGlobalDecl;
	}
	if (code && code.trim()) {
		// code 已經有縮排，直接加入
		fullCode += code;
	} else {
		// 空的主程式需要 pass
		fullCode += this.INDENT + 'pass\n';
	}
	fullCode += '\n';

	// 程式進入點 (加入 KeyboardInterrupt 處理，確保可以中斷程式)
	fullCode += '\n# Entry point\n';
	fullCode += 'if __name__ == "__main__":\n';
	fullCode += this.INDENT + 'try:\n';
	fullCode += this.INDENT + this.INDENT + 'main()\n';
	fullCode += this.INDENT + 'except KeyboardInterrupt:\n';
	fullCode += this.INDENT + this.INDENT + 'pass\n';

	// 重置命名資料庫
	this.currentFunction_ = 'main';
	this.functionGlobals_.clear();
	this.nameDB_.reset();

	return fullCode;
};

/**
 * 淨化名稱（移除特殊字元）
 * @param {string} name 原始名稱
 * @returns {string} 安全的 Python 識別符
 */
window.micropythonGenerator.scrub_ = function (block, code, opt_thisOnly) {
	const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
	const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
	return code + nextCode;
};

/**
 * 處理獨立的 value block（naked value）
 * 在 Python 中，裸露的表達式雖然語法上有效，但在 MicroPython 硬體程式中
 * 未連接的積木不應生成程式碼，因此返回空字串
 *
 * @param {string} line - 由獨立 value block 生成的程式碼
 * @returns {string} 空字串（忽略未連接的表達式）
 */
window.micropythonGenerator.scrubNakedValue = function (line) {
	// 未連接的積木不生成程式碼
	return '';
};

/**
 * 引用文字
 * @param {string} text 原始文字
 * @returns {string} 帶引號的文字
 */
window.micropythonGenerator.quote_ = function (text) {
	// 處理特殊字元
	text = text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
	return "'" + text + "'";
};

/**
 * 多行引用文字
 * @param {string} text 原始文字
 * @returns {string} 帶三重引號的文字
 */
window.micropythonGenerator.multiline_quote_ = function (text) {
	const lines = text.split(/\n/g).map(line => line.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
	return "'''" + lines.join('\n') + "'''";
};

/**
 * Python 保留字列表
 */
window.micropythonGenerator.RESERVED_WORDS_ =
	'False,None,True,and,as,assert,async,await,break,class,continue,def,del,elif,else,except,finally,for,from,global,if,import,in,is,lambda,nonlocal,not,or,pass,raise,return,try,while,with,yield,' +
	// MicroPython 常用模組
	'machine,time,network,Pin,PWM,ADC,UART,I2C,SPI,Timer,NeoPixel';

/**
 * 添加 import 語句
 * @param {string} importStatement import 語句
 */
window.micropythonGenerator.addImport = function (importStatement) {
	this.imports_.add(importStatement);
};

/**
 * 添加硬體初始化
 * @param {string} key 唯一識別符
 * @param {string} code 初始化程式碼
 */
window.micropythonGenerator.addHardwareInit = function (key, code) {
	if (!this.hardwareInit_.has(key)) {
		this.hardwareInit_.set(key, code);
	}
};

/**
 * 添加全域變數
 * @param {string} name 變數名稱
 * @param {string} initialValue 初始值
 */
window.micropythonGenerator.addVariable = function (name, initialValue) {
	if (!this.variables_.has(name)) {
		this.variables_.set(name, { name, initialValue });
	}
};

/**
 * 添加自訂函數
 * @param {string} name 函數名稱
 * @param {string} code 函數程式碼
 */
window.micropythonGenerator.addFunction = function (name, code) {
	if (!this.functions_.has(name)) {
		this.functions_.set(name, { name, code });
	}
};

/**
 * 檢查積木是否位於合法的 MicroPython 程式碼生成容器內
 * 使用 getSurroundParent() 遞迴向上遍歷父層鏈
 * @param {!Blockly.Block} block - 要檢查的積木
 * @returns {boolean} true 表示在合法容器內，false 表示孤立
 */
window.micropythonGenerator.isInAllowedContext = function (block) {
	const allowedContainers = [
		'micropython_main',
		'arduino_function',
		'procedures_defnoreturn',
		'procedures_defreturn',
	];
	let current = block;
	while (current) {
		current = current.getSurroundParent();
		if (!current) return false;
		if (allowedContainers.includes(current.type)) return true;
	}
	return false;
};

// 記錄載入訊息
console.log('[blockly] MicroPython 生成器已載入');
