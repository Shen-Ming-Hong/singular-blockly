/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick X12 發射端擴展板積木定義
 */

'use strict';

// === 搖桿通道選項 ===
const X12_JOYSTICK_CHANNEL_OPTIONS = [
	['L1', '0'],
	['L2', '1'],
	['L3', '2'],
	['R1', '3'],
	['R2', '4'],
	['R3', '5'],
];

// === 按鈕通道選項 ===
const X12_BUTTON_CHANNEL_OPTIONS = [
	['K1', '6'],
	['K2', '7'],
	['K3', '8'],
	['K4', '9'],
];

// === 讀取本機搖桿值 ===
Blockly.Blocks['x12_get_joystick'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X12_GET_JOYSTICK_PREFIX', '本機搖桿'))
			.appendField(new Blockly.FieldDropdown(X12_JOYSTICK_CHANNEL_OPTIONS), 'CHANNEL');
		this.setOutput(true, 'Number');
		this.setColour(150);
		this.setTooltip(window.languageManager.getMessage('X12_GET_JOYSTICK_TOOLTIP', '讀取發射端本機搖桿的 ADC 值 (0-4095)'));
		this.setHelpUrl('');
	},
};

// === 讀取並映射本機搖桿值 ===
Blockly.Blocks['x12_get_joystick_mapped'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X12_GET_JOYSTICK_MAPPED_PREFIX', '本機搖桿'))
			.appendField(new Blockly.FieldDropdown(X12_JOYSTICK_CHANNEL_OPTIONS), 'CHANNEL')
			.appendField(window.languageManager.getMessage('X12_GET_JOYSTICK_MAPPED_MIN', '映射'));
		this.appendValueInput('MIN').setCheck('Number');
		this.appendDummyInput().appendField(window.languageManager.getMessage('X12_GET_JOYSTICK_MAPPED_MAX', '~'));
		this.appendValueInput('MAX').setCheck('Number');
		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setColour(150);
		this.setTooltip(window.languageManager.getMessage('X12_GET_JOYSTICK_MAPPED_TOOLTIP', '讀取發射端本機搖桿並映射到指定範圍'));
		this.setHelpUrl('');
	},
};

// === 檢查本機按鈕是否按下 ===
Blockly.Blocks['x12_is_button_pressed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X12_IS_BUTTON_PRESSED_PREFIX', '本機按鈕'))
			.appendField(new Blockly.FieldDropdown(X12_BUTTON_CHANNEL_OPTIONS), 'BUTTON')
			.appendField(window.languageManager.getMessage('X12_IS_BUTTON_PRESSED_SUFFIX', '被按下?'));
		this.setOutput(true, 'Boolean');
		this.setColour(150);
		this.setTooltip(window.languageManager.getMessage('X12_IS_BUTTON_PRESSED_TOOLTIP', '檢查發射端本機按鈕是否被按下'));
		this.setHelpUrl('');
	},
};

// === 讀取本機按鈕狀態 ===
Blockly.Blocks['x12_get_button'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X12_GET_BUTTON_PREFIX', '本機按鈕'))
			.appendField(new Blockly.FieldDropdown(X12_BUTTON_CHANNEL_OPTIONS), 'BUTTON')
			.appendField(window.languageManager.getMessage('X12_GET_BUTTON_SUFFIX', '狀態'));
		this.setOutput(true, 'Number');
		this.setColour(150);
		this.setTooltip(window.languageManager.getMessage('X12_GET_BUTTON_TOOLTIP', '讀取發射端本機按鈕狀態 (0=按下, 1=放開)'));
		this.setHelpUrl('');
	},
};

// 記錄載入訊息
console.log('[blockly] X12 發射端擴展板積木定義已載入');
