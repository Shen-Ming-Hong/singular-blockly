/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller 積木程式碼生成器
 */

'use strict';

function getTxtProcessFunctionName(block) {
	const safeBlockId = (block.id || 'process').replace(/[^A-Za-z0-9_]+/g, '_');
	return `_txt_process_${safeBlockId}`;
}

// === 頂層容器積木 ===

function generateTxtSetupCode(block) {
	window.txtGenerator.addImport('import ftrobopy');
	const rawChildCode = window.txtGenerator.statementToCode(block, 'DO');
	const childCode = rawChildCode.replace(/^    /gm, '');
	let code = "txt = ftrobopy.ftrobopy('auto')\n\n";
	const setConfigCode = window.txtGenerator.buildSetConfig();
	if (setConfigCode) {
		code += setConfigCode + '\n\n';
	}
	const preCreationsCode = window.txtGenerator.buildPreCreations();
	if (preCreationsCode) {
		code += preCreationsCode + '\n\n';
	}
	if (childCode) {
		code += childCode;
	}
	return code;
}

window.txtGenerator.forBlock['txt_setup'] = function (block) {
	return generateTxtSetupCode(block);
};

window.txtGenerator.forBlock['txt_process'] = function (block) {
	const processName = (block.getFieldValue('NAME') || '').replace(/[\r\n]+/g, ' ').trim();
	const functionName = getTxtProcessFunctionName(block);

	const previousFunction = window.txtGenerator.currentFunction_;
	window.txtGenerator.currentFunction_ = functionName;
	if (!window.txtGenerator.functionGlobals_.has(functionName)) {
		window.txtGenerator.functionGlobals_.set(functionName, new Set());
	}

	const rawChildCode = window.txtGenerator.statementToCode(block, 'DO');
	const branch = rawChildCode || `${window.txtGenerator.INDENT}pass\n`;

	window.txtGenerator.currentFunction_ = previousFunction;

	const globals = window.txtGenerator.functionGlobals_.get(functionName);
	const filteredGlobals = globals ? Array.from(globals).sort() : [];
	const globalDecl = filteredGlobals.length > 0 ? window.txtGenerator.INDENT + 'global ' + filteredGlobals.join(', ') + '\n' : '';

	let functionCode = '';
	if (processName) {
		functionCode += `# TXT Process: ${processName}\n`;
	}
	functionCode += `def ${functionName}():\n`;
	functionCode += globalDecl;
	functionCode += branch;

	window.txtGenerator.addFunction(functionName, functionCode);
	window.txtGenerator.addProcessDescriptor({
		functionName,
		threadNameLiteral: window.txtGenerator.quote_(processName || functionName),
	});

	return '';
};

// === 馬達積木 ===

/**
 * txt_motor_speed: 設定馬達速度與方向
 */
window.txtGenerator.forBlock['txt_motor_speed'] = function (block) {
	const motor = block.getFieldValue('MOTOR');
	const direction = block.getFieldValue('DIRECTION');
	const speed = window.txtGenerator.valueToCode(block, 'SPEED', window.txtGenerator.ORDER_NONE) || '0';

	// 記錄此馬達埠號，供 txt_setup 預先建立 mot 物件
	window.txtGenerator.addMotorPort(motor);

	let speedCode;
	if (direction === 'BACKWARD') {
		speedCode = `-(${speed})`;
	} else {
		speedCode = speed;
	}

	// 使用預先建立的 _m{N} 物件（在 txt_setup 初始化時建立一次），
	// 避免在迴圈中反覆呼叫 txt.motor(N)（會累加 config_id 造成 CONFIG_IO 風暴）。
	// ftrobopy setSpeed() 需要整數，且內部以 int(pwm/2) 縮放至 ubyte(0-255)；
	// 超過 512 的値（如搖桿超出預期範圍）會讓 int(val/2)>255 觸發 struct.error。
	// 用 max(-512, min(512, int(...))) 夾錢確保永遠在合法範圍內。
	return `_m${motor}.setSpeed(max(-512, min(512, int(${speedCode}))))\n`;
};

/**
 * txt_motor_stop: 停止馬達
 */
window.txtGenerator.forBlock['txt_motor_stop'] = function (block) {
	const motor = block.getFieldValue('MOTOR');
	// 記錄此馬達埠號，供 txt_setup 預先建立 mot 物件
	window.txtGenerator.addMotorPort(motor);
	return `_m${motor}.setSpeed(0)\n`;
};

// === 輸出積木 ===

/**
 * txt_output: 設定數位輸出
 */
window.txtGenerator.forBlock['txt_output'] = function (block) {
	const output = block.getFieldValue('OUTPUT');
	const state = block.getFieldValue('STATE');
	const level = state === 'ON' ? '512' : '0';
	return `txt.output(${output}).setLevel(${level})\n`;
};

// === 輸入積木 ===

/**
 * txt_input_sensor: 感測器輸入積木（按鈕 / 光柵 / 超音波）
 * 按鈕/光柵 → .state()，回傳 0 或 1
 * 超音波   → .distance()，回傳距離 cm；並自動記錄 setConfig 需求
 */
window.txtGenerator.forBlock['txt_input_sensor'] = function (block) {
	const sensorType = block.getFieldValue('SENSOR_TYPE');
	const input = block.getFieldValue('INPUT');
	// 記錄感測器配置；txt_setup 在 statementToCode 完成後呼叫 buildSetConfig()
	window.txtGenerator.addInputConfig(parseInt(input), sensorType);
	if (sensorType === 'ULTRASONIC') {
		// 超音波量測失敗時（無回波、距離太近/太遠），ftrobopy 回傳 0。
		// 若直接使用 0 作為速度/輸出值，會瞬間讓馬達或燈泡停止，造成可見閃爍。
		// _read_ultrasonic() 使用懶性初始化（每埠只呼叫一次 txt.ultrasonic()），
		// 後續迴圈只呼叫 .distance() 讀取緩衝區，不會累加 config_id 造成 CONFIG_IO 閃爍。
		window.txtGenerator.addFunction(
			'_read_ultrasonic',
			`_ultrasonic_cache_ = {}\n` +
				`_ultrasonic_last_ = {}\n` +
				`def _read_ultrasonic(port):\n` +
				`    if port not in _ultrasonic_cache_:\n` +
				`        _ultrasonic_cache_[port] = txt.ultrasonic(port)\n` +
				`    v = _ultrasonic_cache_[port].distance()\n` +
				`    if v > 0:\n` +
				`        _ultrasonic_last_[port] = v\n` +
				`    return _ultrasonic_last_.get(port, 0)`
		);
		return [`_read_ultrasonic(${input})`, window.txtGenerator.ORDER_FUNCTION_CALL];
	}
	// BUTTON（按鈕）和 GATE（光柵）都使用 .state()，回傳 0 或 1
	return [`txt.input(${input}).state()`, window.txtGenerator.ORDER_FUNCTION_CALL];
};

// === 延遲積木 ===

/**
 * txt_wait: 等待毫秒
 */
window.txtGenerator.forBlock['txt_wait'] = function (block) {
	const ms = window.txtGenerator.valueToCode(block, 'MS', window.txtGenerator.ORDER_NONE) || '0';
	// txt_wait 是「使用者可感知的延遲」，在 shared-txt 多流程模型下應只暫停目前流程。
	// 若改用 txt.updateWait()，會與其他流程共用 ftrobopy 內部的 _update_status，造成延遲互相干擾。
	// time.sleep() 只阻塞目前 Python thread，而 ftrobopy 的 exchange thread 仍可持續維護硬體狀態。
	window.txtGenerator.addImport('import time');
	return `time.sleep(max(0.0, (${ms}) / 1000.0))\n`;
};

// === 全部停止積木 ===

/**
 * txt_stop_all: 停止所有馬達與輸出
 * 使用 addMotorPort 登記 M1-M4，讓 txt_setup 預先建立 _mN 物件，
 * 避免在此處直接呼叫 txt.motor(i) 累加 config_id（CONFIG_IO 風暴）。
 */
window.txtGenerator.forBlock['txt_stop_all'] = function (_block) {
	// 登記所有馬達埠號，確保 txt_setup 預先建立 _m1~_m4 物件
	window.txtGenerator.addMotorPort(1);
	window.txtGenerator.addMotorPort(2);
	window.txtGenerator.addMotorPort(3);
	window.txtGenerator.addMotorPort(4);
	return '_m1.setSpeed(0)\n_m2.setSpeed(0)\n_m3.setSpeed(0)\n_m4.setSpeed(0)\n' +
		'for i in range(1, 9):\n    txt.output(i).setLevel(0)\n';
};
