/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller Python code generator
 * Generates ftrobopy-based Python code for fischertechnik TXT Controller
 */

'use strict';

/**
 * TXT Controller 程式碼生成器
 */
window.txtGenerator = new Blockly.Generator('TXT');

// 設定縮排（4 空格，Python 標準）
window.txtGenerator.INDENT = '    ';

// 運算子優先順序（Python）
window.txtGenerator.ORDER_ATOMIC = 0;
window.txtGenerator.ORDER_COLLECTION = 1;
window.txtGenerator.ORDER_MEMBER = 2.1;
window.txtGenerator.ORDER_FUNCTION_CALL = 2.2;
window.txtGenerator.ORDER_EXPONENTIATION = 3;
window.txtGenerator.ORDER_UNARY_SIGN = 4;
window.txtGenerator.ORDER_MULTIPLICATIVE = 5;
window.txtGenerator.ORDER_ADDITIVE = 6;
window.txtGenerator.ORDER_RELATIONAL = 11;
window.txtGenerator.ORDER_LOGICAL_NOT = 12;
window.txtGenerator.ORDER_LOGICAL_AND = 13;
window.txtGenerator.ORDER_LOGICAL_OR = 14;
window.txtGenerator.ORDER_NONE = 99;

/**
 * Import 追蹤集合
 */
window.txtGenerator.imports_ = new Set();

/**
 * 自訂函數定義
 */
window.txtGenerator.functions_ = new Map();

/**
 * 輸入感測器配置追蹤（port → sensorType）
 */
window.txtGenerator.inputConfigs_ = new Map();

/**
 * 重置生成器狀態
 */
window.txtGenerator.reset = function () {
	this.imports_.clear();
	this.functions_.clear();
	this.inputConfigs_.clear();
};

/**
 * 加入 import 語句
 * @param {string} importStatement 完整 import 語句，例如 'import time'
 */
window.txtGenerator.addImport = function (importStatement) {
	this.imports_.add(importStatement);
};

/**
 * 記錄輸入感測器配置，供 txt_main 生成 setConfig()
 * @param {number} port 輸入埠號（1~8）
 * @param {string} sensorType 感測器類型 'BUTTON' | 'GATE' | 'ULTRASONIC'
 */
window.txtGenerator.addInputConfig = function (port, sensorType) {
	this.inputConfigs_.set(port, sensorType);
};

/**
 * 根據已記錄的感測器配置，生成 setConfig() + updateConfig() 程式碼
 * 只有在使用非預設感測器（如超音波）時才生成
 * @returns {string} setConfig 程式碼，或空字串
 */
window.txtGenerator.buildSetConfig = function () {
	const needsConfig = [...this.inputConfigs_.values()].some(t => t === 'ULTRASONIC');
	if (!needsConfig) return '';
	const inputConfigs = [];
	for (let i = 1; i <= 8; i++) {
		const t = this.inputConfigs_.get(i);
		inputConfigs.push(t === 'ULTRASONIC' ? '(txt.C_ULTRASONIC, txt.C_ANALOG)' : '(txt.C_SWITCH, txt.C_DIGITAL)');
	}
	return `M, I = txt.getConfig()\n` +
		`I = [${inputConfigs.join(', ')}]\n` +
		`txt.setConfig(M, I)\ntxt.updateConfig()`;
};

/**
 * 允許的頂層積木類型
 */
window.txtGenerator.allowedTopLevelBlocks_ = ['txt_main', 'procedures_defnoreturn', 'procedures_defreturn', 'arduino_function'];

/**
 * 自訂 workspaceToCode 方法
 * 只處理允許的頂層積木，忽略流浪的積木
 * @param {!Blockly.Workspace} workspace Blockly 工作區
 * @returns {string} 生成的程式碼
 */
window.txtGenerator.workspaceToCode = function (workspace) {
	if (!workspace) {
		console.warn('[TXT] No workspace provided');
		return '';
	}

	this.init(workspace);

	const blocks = workspace.getTopBlocks(true);
	let code = '';

	for (const block of blocks) {
		if (!block.isEnabled() || block.getInheritedDisabled()) {
			continue;
		}

		if (this.allowedTopLevelBlocks_.includes(block.type)) {
			const blockCode = this.blockToCode(block);
			if (typeof blockCode === 'string') {
				code += blockCode;
			}
		} else {
			code += `# [Skipped] Orphan block: ${block.type} (not in main/function)\n`;
		}
	}

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
window.txtGenerator.init = function (workspace) {
	this.reset();

	if (!this.nameDB_) {
		this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
	} else {
		this.nameDB_.reset();
	}

	this.nameDB_.setVariableMap(workspace.getVariableMap());
	this.nameDB_.populateVariables(workspace);
	this.nameDB_.populateProcedures(workspace);
};

/**
 * 完成生成器
 * @param {string} code 生成的程式碼
 * @returns {string} 完整的程式碼
 */
window.txtGenerator.finish = function (code) {
	const imports = Array.from(this.imports_).sort().join('\n');

	const functions = Array.from(this.functions_.values())
		.map(f => f.code)
		.join('\n\n');

	let fullCode = '# === TXT Controller Python ===\n';
	fullCode += `# Generated: ${new Date().toISOString()}\n\n`;

	// 抑制 SIGTERM 時 ftrobopy Thread-1 印出的 SerialException 雜訊
	// sys._is_finalizing() 為 True 代表 Python 正在關閉，此時的 thread exception 可安全忽略
	fullCode += 'import threading as _t, sys as _s\n';
	fullCode += '_t.excepthook = lambda a: None if _s._is_finalizing() else _t.__excepthook__(a)\n\n';

	if (imports) {
		fullCode += '# [1] Imports\n';
		fullCode += imports + '\n\n';
	}

	if (functions) {
		fullCode += '# [2] User Functions\n';
		fullCode += functions + '\n\n';
	}

	if (code) {
		fullCode += '# [3] Main Program\n';
		fullCode += code;
	}

	return fullCode;
};

/**
 * 保留字（Python + ftrobopy）
 */
window.txtGenerator.RESERVED_WORDS_ =
	'False,None,True,and,as,assert,async,await,break,class,continue,def,del,' +
	'elif,else,except,finally,for,from,global,if,import,in,is,lambda,nonlocal,' +
	'not,or,pass,raise,return,try,while,with,yield,' +
	'ftrobopy,txt,motor,output,input,setSpeed,setLevel,state,range';
