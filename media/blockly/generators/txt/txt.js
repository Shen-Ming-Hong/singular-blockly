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
	const childCode = window.txtGenerator.statementToCode(block, 'DO');
	let code = "txt = ftrobopy.ftrobopy('auto')\n\n";
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

	let speedCode;
	if (direction === 'BACKWARD') {
		speedCode = `-${speed}`;
	} else {
		speedCode = speed;
	}

	return `txt.motor(${motor}).setSpeed(${speedCode})\n`;
};

/**
 * txt_motor_stop: 停止馬達
 */
window.txtGenerator.forBlock['txt_motor_stop'] = function (block) {
	const motor = block.getFieldValue('MOTOR');
	return `txt.motor(${motor}).setSpeed(0)\n`;
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
 * txt_input_read: 讀取數位輸入 (value block)
 */
window.txtGenerator.forBlock['txt_input_read'] = function (block) {
	const input = block.getFieldValue('INPUT');
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
 */
window.txtGenerator.forBlock['txt_stop_all'] = function (_block) {
	return 'for i in range(1, 5):\n    txt.motor(i).setSpeed(0)\nfor i in range(1, 9):\n    txt.output(i).setLevel(0)\n';
};
