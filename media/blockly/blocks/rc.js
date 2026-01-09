/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick RC 遙控通訊積木定義
 */

'use strict';

// === 搖桿通道選項 ===
const RC_JOYSTICK_CHANNEL_OPTIONS = [
	['L1', '0'],
	['L2', '1'],
	['L3', '2'],
	['R1', '3'],
	['R2', '4'],
	['R3', '5'],
];

// === 按鈕通道選項 ===
const RC_BUTTON_CHANNEL_OPTIONS = [
	['K1', '6'],
	['K2', '7'],
	['K3', '8'],
	['K4', '9'],
];

// === RC Master 初始化 (發射端) ===
Blockly.Blocks['rc_master_init'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('RC_MASTER_INIT', '初始化發射端 (Master)'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_MASTER_INIT_TOOLTIP', '初始化為發射端模式，用於遙控器上'));
		this.setHelpUrl('');
	},
};

// === RC Slave 初始化 (接收端) ===
Blockly.Blocks['rc_slave_init'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('RC_SLAVE_INIT', '初始化接收端 (Slave)'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_SLAVE_INIT_TOOLTIP', '初始化為接收端模式，用於被遙控的裝置上'));
		this.setHelpUrl('');
	},
};

// === 讀取遠端搖桿值 ===
Blockly.Blocks['rc_get_joystick'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('RC_GET_JOYSTICK_PREFIX', '遠端搖桿'))
			.appendField(new Blockly.FieldDropdown(RC_JOYSTICK_CHANNEL_OPTIONS), 'CHANNEL');
		this.setOutput(true, 'Number');
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_GET_JOYSTICK_TOOLTIP', '讀取遠端搖桿的 ADC 值 (0-4095)，2048 為中點'));
		this.setHelpUrl('');
	},
};

// === 讀取並映射遠端搖桿值 ===
Blockly.Blocks['rc_get_joystick_mapped'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('RC_GET_JOYSTICK_MAPPED_PREFIX', '遠端搖桿'))
			.appendField(new Blockly.FieldDropdown(RC_JOYSTICK_CHANNEL_OPTIONS), 'CHANNEL')
			.appendField(window.languageManager.getMessage('RC_GET_JOYSTICK_MAPPED_MIN', '映射'));
		this.appendValueInput('MIN').setCheck('Number');
		this.appendDummyInput().appendField(window.languageManager.getMessage('RC_GET_JOYSTICK_MAPPED_MAX', '~'));
		this.appendValueInput('MAX').setCheck('Number');
		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_GET_JOYSTICK_MAPPED_TOOLTIP', '讀取遠端搖桿並映射到指定範圍'));
		this.setHelpUrl('');
	},
};

// === 檢查遠端按鈕是否按下 ===
Blockly.Blocks['rc_is_button_pressed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('RC_IS_BUTTON_PRESSED_PREFIX', '遠端按鈕'))
			.appendField(new Blockly.FieldDropdown(RC_BUTTON_CHANNEL_OPTIONS), 'BUTTON')
			.appendField(window.languageManager.getMessage('RC_IS_BUTTON_PRESSED_SUFFIX', '被按下?'));
		this.setOutput(true, 'Boolean');
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_IS_BUTTON_PRESSED_TOOLTIP', '檢查遠端按鈕是否被按下'));
		this.setHelpUrl('');
	},
};

// === 讀取遠端按鈕狀態 ===
Blockly.Blocks['rc_get_button'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('RC_GET_BUTTON_PREFIX', '遠端按鈕'))
			.appendField(new Blockly.FieldDropdown(RC_BUTTON_CHANNEL_OPTIONS), 'BUTTON')
			.appendField(window.languageManager.getMessage('RC_GET_BUTTON_SUFFIX', '狀態'));
		this.setOutput(true, 'Number');
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_GET_BUTTON_TOOLTIP', '讀取遠端按鈕狀態 (0=按下, 1=放開)'));
		this.setHelpUrl('');
	},
};

// === 檢查是否已連線 ===
Blockly.Blocks['rc_is_connected'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('RC_IS_CONNECTED', '已連線?'));
		this.setOutput(true, 'Boolean');
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_IS_CONNECTED_TOOLTIP', '檢查是否已與發射端/接收端配對連線'));
		this.setHelpUrl('');
	},
};

// === 取得配對索引 ===
Blockly.Blocks['rc_get_rc_index'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('RC_GET_RC_INDEX', '配對索引'));
		this.setOutput(true, 'Number');
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('RC_GET_RC_INDEX_TOOLTIP', '取得配對索引 (0=未配對, 1=Slave 1, 2=Slave 2)'));
		this.setHelpUrl('');
	},
};

// 記錄載入訊息
console.log('[blockly] RC 遙控通訊積木定義已載入');
