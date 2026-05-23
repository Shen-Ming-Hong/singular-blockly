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
 * 馬達埠號追蹤（供 txt_setup 預先建立 mot 物件，避免在迴圈中反覆呼叫 txt.motor(N)）
 * 每次呼叫 txt.motor(N) 都會執行 setConfig() 累加 config_id，
 * 導致 exchange thread 在每次迴圈都送出 CONFIG_IO 指令，可能造成馬達/燈光閃爍。
 */
window.txtGenerator.motorPorts_ = new Set();

/**
 * M/O 輸出 usage metadata（供 generated-code diagnostics 與 validation summary 使用）
 */
window.txtGenerator.mOutputUsages_ = [];
window.txtGenerator.oOutputUsages_ = [];

/**
 * TXT 流程描述（函式名稱 / 顯示名稱）
 */
window.txtGenerator.processDescriptors_ = [];

/**
 * 重置生成器狀態
 */
window.txtGenerator.reset = function () {
	this.imports_.clear();
	this.functions_.clear();
	this.inputConfigs_.clear();
	this.motorPorts_.clear();
	this.mOutputUsages_ = [];
	this.oOutputUsages_ = [];
	this.processDescriptors_ = [];
};

/**
 * 加入 import 語句
 * @param {string} importStatement 完整 import 語句，例如 'import time'
 */
window.txtGenerator.addImport = function (importStatement) {
	this.imports_.add(importStatement);
};

/**
 * 記錄輸入感測器配置，供 txt_setup 生成 setConfig()
 * @param {number} port 輸入埠號（1~8）
 * @param {string} sensorType 感測器類型 'BUTTON' | 'GATE' | 'ULTRASONIC'
 */
window.txtGenerator.addInputConfig = function (port, sensorType) {
	this.inputConfigs_.set(port, sensorType);
};

/**
 * 記錄使用中的馬達埠號，供 txt_setup 生成預先建立的 mot 物件
 * @param {number|string} port 馬達埠號（1~4）
 */
window.txtGenerator.addMotorPort = function (port) {
	this.motorPorts_.add(Number(port));
};

/**
 * 記錄 M 輸出設定 usage。
 * @param {number|string} port M 埠號（1~4）
 * @param {string} component component key（MOTOR/LAMP）
 * @param {string} blockId Blockly block id
 */
window.txtGenerator.addMOutputUsage = function (port, component, blockId) {
	this.mOutputUsages_.push({
		kind: 'm-output',
		port: `M${Number(port)}`,
		component: component || 'MOTOR',
		blockId: blockId || '',
	});
};

/**
 * 記錄 M 停止 usage。
 * @param {number|string} port M 埠號（1~4）
 * @param {string} blockId Blockly block id
 */
window.txtGenerator.addMStopUsage = function (port, blockId) {
	this.mOutputUsages_.push({
		kind: 'm-stop',
		port: `M${Number(port)}`,
		component: null,
		blockId: blockId || '',
	});
};

/**
 * 記錄 O 輸出 usage。
 * @param {number|string} port O 埠號（1~8）
 * @param {string} blockId Blockly block id
 */
window.txtGenerator.addOOutputUsage = function (port, blockId) {
	this.oOutputUsages_.push({
		kind: 'o-output',
		oPort: `O${Number(port)}`,
		blockId: blockId || '',
	});
};

/**
 * 取得目前 code generation 收集到的 M/O usage metadata。
 * @returns {{mRecords: Array, oRecords: Array}}
 */
window.txtGenerator.getMOutputUsageMetadata = function () {
	return {
		mRecords: [...this.mOutputUsages_],
		oRecords: [...this.oOutputUsages_],
	};
};

/**
 * 記錄 TXT 流程描述，供主程式統一啟動 threads
 * @param {{functionName: string, threadNameLiteral: string}} descriptor 流程描述
 */
window.txtGenerator.addProcessDescriptor = function (descriptor) {
	this.processDescriptors_.push(descriptor);
};

/**
 * 生成馬達物件預先建立程式碼：_m1 = txt.motor(1) 等
 * 在 while 迴圈外只建立一次，避免迴圈中反覆 setConfig() 累加 config_id 造成閃爍
 * @returns {string} 預建程式碼，或空字串
 */
window.txtGenerator.buildPreCreations = function () {
	const lines = [];
	for (const port of [...this.motorPorts_].sort((a, b) => a - b)) {
		lines.push(`_m${port} = txt.motor(${port})`);
	}
	return lines.join('\n');
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
 * 根據已註冊的 TXT 流程，生成 thread 啟動與主執行緒 keep-alive 程式碼
 * @returns {string} 啟動流程的主程式碼，或空字串
 */
window.txtGenerator.buildProcessStartCode = function () {
	if (!this.processDescriptors_.length) {
		return '';
	}

	this.addImport('import threading');

	const lines = ['_txt_threads = []'];
	for (const descriptor of this.processDescriptors_) {
		lines.push(
			`_txt_threads.append(threading.Thread(target=${descriptor.functionName}, name=${descriptor.threadNameLiteral}, daemon=True))`
		);
	}

	lines.push('');
	lines.push('for _txt_thread in _txt_threads:');
	lines.push(`${this.INDENT}_txt_thread.start()`);
	lines.push('');
	// 主執行緒只需要等待 worker threads 結束，不應再呼叫 txt.updateWait() 參與
	// shared txt 的 exchange-cycle 同步；否則會干擾各流程內部的 txt_wait / pacing。
	lines.push('while any(_txt_thread.is_alive() for _txt_thread in _txt_threads):');
	lines.push(`${this.INDENT}for _txt_thread in _txt_threads:`);
	lines.push(`${this.INDENT}${this.INDENT}_txt_thread.join(0.05)`);

	return lines.join('\n');
};

/**
 * 串接下一個積木的程式碼
 * Blockly 12 的 base Generator.scrub_() 不追蹤 nextConnection，必須覆寫才能正確生成連續 statement 積木的程式碼
 * @param {!Blockly.Block} block 目前積木
 * @param {string} code 目前積木已生成的程式碼
 * @param {boolean=} opt_thisOnly 若為 true 則不追蹤 next 連接
 * @returns {string} 串接後的完整程式碼
 */
window.txtGenerator.scrub_ = function (block, code, opt_thisOnly) {
	const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
	const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
	return code + nextCode;
};

/**
 * 引用文字
 * 與 MicroPython generator 保持一致，供 txt_process thread name 與 text 類積木使用。
 * @param {string} text 原始文字
 * @returns {string} 帶引號的文字
 */
window.txtGenerator.quote_ = function (text) {
	text = String(text ?? '')
		.replace(/\\/g, '\\\\')
		.replace(/'/g, "\\'")
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '\\r');
	return "'" + text + "'";
};

/**
 * 多行引用文字
 * 與 MicroPython generator 保持一致，供未來 TXT text_multiline 類積木重用。
 * @param {string} text 原始文字
 * @returns {string} 帶三重引號的文字
 */
window.txtGenerator.multiline_quote_ = function (text) {
	const lines = String(text ?? '')
		.split(/\n/g)
		.map(line => line.replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
	return "'''" + lines.join('\n') + "'''";
};

/**
 * 允許的頂層積木類型
 */
window.txtGenerator.allowedTopLevelBlocks_ = ['txt_setup', 'txt_process', 'procedures_defnoreturn', 'procedures_defreturn', 'arduino_function'];

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
	const setupBlocks = [];
	const processBlocks = [];
	const functionBlocks = [];
	const orphanBlocks = [];
	let code = '';

	for (const block of blocks) {
		if (!block.isEnabled() || block.getInheritedDisabled()) {
			continue;
		}

		switch (block.type) {
			case 'txt_setup':
				setupBlocks.push(block);
				break;
			case 'txt_process':
				processBlocks.push(block);
				break;
			case 'procedures_defnoreturn':
			case 'procedures_defreturn':
			case 'arduino_function':
				functionBlocks.push(block);
				break;
			default:
				orphanBlocks.push(block);
		}
	}

	const primarySetupBlock = setupBlocks[0] || null;
	const skippedSetupBlocks = primarySetupBlock ? setupBlocks.slice(1) : [];

	for (const block of functionBlocks) {
		this.blockToCode(block);
	}

	for (const block of processBlocks) {
		this.blockToCode(block);
	}

	if (primarySetupBlock) {
		const setupCode = this.blockToCode(primarySetupBlock);
		if (typeof setupCode === 'string') {
			code += setupCode;
		}
	}

	for (const block of skippedSetupBlocks) {
		code += `# [Skipped] Duplicate TXT setup block: ${block.id}\n`;
	}

	for (const block of orphanBlocks) {
		code += `# [Skipped] Orphan block: ${block.type} (not in TXT setup/process or function)\n`;
	}

	if (this.processDescriptors_.length > 0) {
		if (primarySetupBlock) {
			const processStartCode = this.buildProcessStartCode();
			if (processStartCode) {
				if (code && !code.endsWith('\n')) {
					code += '\n';
				}
				if (code && !code.endsWith('\n\n')) {
					code += '\n';
				}
				code += processStartCode + '\n';
			}
		} else {
			code += '# [Skipped] TXT process blocks require a TXT Setup block\n';
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
	// sys.is_finalizing() 為 True 代表 Python 正在關閉，此時的 thread exception 可安全忽略
	// 注意：Python 3.9+ 使用 sys.is_finalizing()，舊版私有 API _is_finalizing() 已移除
	fullCode += 'import threading as _t, sys as _s\n';
	fullCode += '_t.excepthook = lambda a: None if _s.is_finalizing() else _t.__excepthook__(a)\n\n';

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
