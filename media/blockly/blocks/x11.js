/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick X11 擴展板積木定義
 */

'use strict';

// === 伺服馬達埠位選項 ===
const X11_SERVO_PORT_OPTIONS = [
	['S1', '1'],
	['S2', '2'],
	['S3', '3'],
	['S4', '4'],
];

// === 直流馬達埠位選項 ===
const X11_MOTOR_PORT_OPTIONS = [
	['M1', '1'],
	['M2', '2'],
];

// === LED 燈條埠位選項 (依據 bbl.leds 源碼: LED_CHANNEL1=21, LED_CHANNEL2=20) ===
const X11_LED_PORT_OPTIONS = [
	['D1', '21'],
	['D2', '20'],
];

// === 180° 伺服馬達角度控制 ===
Blockly.Blocks['x11_servo_180_angle'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_SERVO_180_ANGLE_PREFIX', '伺服馬達(180°)'))
			.appendField(new Blockly.FieldDropdown(X11_SERVO_PORT_OPTIONS), 'PORT')
			.appendField(window.languageManager.getMessage('X11_SERVO_180_ANGLE_SUFFIX', '轉到'));
		this.appendValueInput('ANGLE').setCheck('Number');
		this.appendDummyInput().appendField('°');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('X11_SERVO_180_ANGLE_TOOLTIP', '適用於 180° 伺服馬達 (PG001)，直接轉到指定角度'));
		this.setHelpUrl('');
	},
};

// === 360° 伺服馬達速度控制 ===
Blockly.Blocks['x11_servo_360_speed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_SERVO_360_SPEED_PREFIX', '伺服馬達(360°)'))
			.appendField(new Blockly.FieldDropdown(X11_SERVO_PORT_OPTIONS), 'PORT')
			.appendField(window.languageManager.getMessage('X11_SERVO_360_SPEED_SUFFIX', '速度'));
		this.appendValueInput('SPEED').setCheck('Number');
		this.appendDummyInput().appendField('%');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(
			window.languageManager.getMessage('X11_SERVO_360_SPEED_TOOLTIP', '適用於 360° 伺服馬達 (PG002)，正值順時針、負值逆時針、0 停止')
		);
		this.setHelpUrl('');
	},
};

// === 停止伺服馬達 ===
Blockly.Blocks['x11_servo_stop'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_SERVO_STOP', '停止伺服馬達'))
			.appendField(new Blockly.FieldDropdown(X11_SERVO_PORT_OPTIONS), 'PORT');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('X11_SERVO_STOP_TOOLTIP', '停止指定埠位的伺服馬達'));
		this.setHelpUrl('');
	},
};

// === 直流馬達速度控制 ===
Blockly.Blocks['x11_motor_speed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_MOTOR_SPEED_PREFIX', '直流馬達'))
			.appendField(new Blockly.FieldDropdown(X11_MOTOR_PORT_OPTIONS), 'PORT')
			.appendField(window.languageManager.getMessage('X11_MOTOR_SPEED_SUFFIX', '速度'));
		this.appendValueInput('SPEED').setCheck('Number');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('X11_MOTOR_SPEED_TOOLTIP', '設定直流馬達速度，範圍 -2048 到 2048'));
		this.setHelpUrl('');
	},
};

// === 停止直流馬達 ===
Blockly.Blocks['x11_motor_stop'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_MOTOR_STOP', '停止直流馬達'))
			.appendField(new Blockly.FieldDropdown(X11_MOTOR_PORT_OPTIONS), 'PORT');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('X11_MOTOR_STOP_TOOLTIP', '停止指定埠位的直流馬達'));
		this.setHelpUrl('');
	},
};

// === LED 燈條索引選項（動態生成以支援 i18n） ===
function getX11LedIndexOptions() {
	return [
		['1', '0'],
		['2', '1'],
		['3', '2'],
		['4', '3'],
		[window.languageManager.getMessage('X11_LED_INDEX_ALL', '全部'), 'all'],
	];
}

// === LED 燈條設定顏色 ===
Blockly.Blocks['x11_led_set_color'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_LED_SET_COLOR_PREFIX', 'LED 燈條'))
			.appendField(new Blockly.FieldDropdown(X11_LED_PORT_OPTIONS), 'PORT')
			.appendField(window.languageManager.getMessage('X11_LED_SET_COLOR_INDEX', '第'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return getX11LedIndexOptions();
				}),
				'INDEX'
			)
			.appendField(window.languageManager.getMessage('X11_LED_SET_COLOR_INDEX_SUFFIX', '顆'));
		this.appendValueInput('RED').setCheck('Number').appendField('R');
		this.appendValueInput('GREEN').setCheck('Number').appendField('G');
		this.appendValueInput('BLUE').setCheck('Number').appendField('B');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('X11_LED_SET_COLOR_TOOLTIP', '設定 WS2812 LED 燈條顏色，R/G/B 範圍 0-255'));
		this.setHelpUrl('');
	},
};

// 記錄載入訊息
console.log('[blockly] X11 擴展板積木定義已載入');
