/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller 積木程式碼生成器
 */

'use strict';

// === 主程式容器積木 ===

/**
 * txt_main: TXT 主程式容器
 * 自動匯入 ftrobopy 並建立連線 (使用 'auto' 模式，程式在 TXT 上執行)
 */
window.txtGenerator.forBlock['txt_main'] = function (block) {
	window.txtGenerator.addImport('import ftrobopy');
	// statementToCode 回傳的程式碼每行都有一層 INDENT（4 空格），
	// 以前放進 while True: 裡剛好正確，現在 txt_main 沒有外層容器，
	// 必須去除這一層多餘縮排，否則頂層的 while/def 等會產生 IndentationError。
	const rawChildCode = window.txtGenerator.statementToCode(block, 'DO');
	const childCode = rawChildCode.replace(/^    /gm, '');
	let code = "txt = ftrobopy.ftrobopy('auto')\n\n";
	// 若使用了需要特殊配置的感測器（如超音波），動態生成 setConfig() + updateConfig()
	// statementToCode 已觸發所有子積木的 generator，inputConfigs_ 此時已填好
	const setConfigCode = window.txtGenerator.buildSetConfig();
	if (setConfigCode) {
		code += setConfigCode + '\n\n';
	}
	// 預先建立馬達物件（_m1 = txt.motor(1) 等）
	// 避免在迴圈中反覆呼叫 txt.motor(N) 造成 setConfig() 累加 config_id，
	// 進而觸發 exchange thread 在每次迴圈都送出 CONFIG_IO 指令，造成馬達/燈光閃爍
	const preCreationsCode = window.txtGenerator.buildPreCreations();
	if (preCreationsCode) {
		code += preCreationsCode + '\n\n';
	}
	// 直接輸出子積木程式碼，不加外層 while True。
	// 使用者若需要持續輪詢，應自行在容器內加入「重複當 真」迴圈積木。
	if (childCode) {
		code += childCode;
	}
	return code;
};

// === 初始化積木 ===

/**
 * txt_init: 建立 ftrobopy 連線 (保留供向下相容)
 * 注意：建議改用 txt_main 容器積木，連線已自動處理
 */
window.txtGenerator.forBlock['txt_init'] = function (_block) {
	window.txtGenerator.addImport('import ftrobopy');
	return "txt = ftrobopy.ftrobopy('auto')\n";
};

// === 馬達積木 ===

/**
 * txt_motor_speed: 設定馬達速度與方向
 */
window.txtGenerator.forBlock['txt_motor_speed'] = function (block) {
	const motor = block.getFieldValue('MOTOR');
	const direction = block.getFieldValue('DIRECTION');
	const speed = window.txtGenerator.valueToCode(block, 'SPEED', window.txtGenerator.ORDER_NONE) || '0';

	// 記錄此馬達埠號，供 txt_main 預先建立 mot 物件
	window.txtGenerator.addMotorPort(motor);

	let speedCode;
	if (direction === 'BACKWARD') {
		speedCode = `-(${speed})`;
	} else {
		speedCode = speed;
	}

	// 使用預先建立的 _m{N} 物件（在 txt_main 初始化時建立一次），
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
	// 記錄此馬達埠號，供 txt_main 預先建立 mot 物件
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
 * txt_input_read: 讀取數位輸入 (value block) — 保留供向下相容
 */
window.txtGenerator.forBlock['txt_input_read'] = function (block) {
	const input = block.getFieldValue('INPUT');
	return [`txt.input(${input}).state()`, window.txtGenerator.ORDER_FUNCTION_CALL];
};

/**
 * txt_input_sensor: 感測器輸入積木（按鈕 / 光柵 / 超音波）
 * 按鈕/光柵 → .state()，回傳 0 或 1
 * 超音波   → .distance()，回傳距離 cm；並自動記錄 setConfig 需求
 */
window.txtGenerator.forBlock['txt_input_sensor'] = function (block) {
	const sensorType = block.getFieldValue('SENSOR_TYPE');
	const input = block.getFieldValue('INPUT');
	// 記錄感測器配置；txt_main 在 statementToCode 完成後呼叫 buildSetConfig()
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
	window.txtGenerator.addImport('import time');
	const ms = window.txtGenerator.valueToCode(block, 'MS', window.txtGenerator.ORDER_NONE) || '0';
	return `time.sleep(${ms} / 1000.0)\n`;
};

// === 全部停止積木 ===

/**
 * txt_stop_all: 停止所有馬達與輸出
 * 使用 addMotorPort 登記 M1-M4，讓 txt_main 預先建立 _mN 物件，
 * 避免在此處直接呼叫 txt.motor(i) 累加 config_id（CONFIG_IO 風暴）。
 */
window.txtGenerator.forBlock['txt_stop_all'] = function (_block) {
	// 登記所有馬達埠號，確保 txt_main 預先建立 _m1~_m4 物件
	window.txtGenerator.addMotorPort(1);
	window.txtGenerator.addMotorPort(2);
	window.txtGenerator.addMotorPort(3);
	window.txtGenerator.addMotorPort(4);
	return '_m1.setSpeed(0)\n_m2.setSpeed(0)\n_m3.setSpeed(0)\n_m4.setSpeed(0)\n' +
		'for i in range(1, 9):\n    txt.output(i).setLevel(0)\n';
};
