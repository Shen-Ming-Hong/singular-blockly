/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick RC 遙控通訊積木定義
 * 使用 ESP-NOW 協定，支援配對 ID (1-255) 和 WiFi 頻道 (1-11)
 */

'use strict';

(function () {
	// 取得翻譯函數
	const getMessage = function (key, defaultValue) {
		return window.languageManager ? window.languageManager.getMessage(key, defaultValue) : defaultValue || key;
	};

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
		['K1', '0'],
		['K2', '1'],
		['K3', '2'],
		['K4', '3'],
	];

	// === 發射端初始化 ===
	Blockly.Blocks['rc_master_init'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_MASTER_INIT', '初始化 RC 發射端'))
				.appendField(getMessage('RC_MASTER_INIT_PAIR_ID', '配對ID'))
				.appendField(new Blockly.FieldNumber(1, 1, 255, 1), 'PAIR_ID')
				.appendField(getMessage('RC_MASTER_INIT_CHANNEL', '頻道'))
				.appendField(new Blockly.FieldNumber(1, 1, 11, 1), 'CHANNEL');
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setColour(160);
			this.setTooltip(getMessage('RC_MASTER_INIT_TOOLTIP', '初始化遙控發射端，設定配對 ID (1-255) 和頻道 (1-11)'));
			this.setHelpUrl('');
		},
	};

	// === 發送資料 ===
	Blockly.Blocks['rc_send'] = {
		init: function () {
			this.appendDummyInput().appendField(getMessage('RC_SEND', '發送 RC 資料'));
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setColour(160);
			this.setTooltip(getMessage('RC_SEND_TOOLTIP', '讀取 X12 搖桿/按鈕資料並發送給接收端'));
			this.setHelpUrl('');
		},
	};

	// === 接收端初始化 ===
	Blockly.Blocks['rc_slave_init'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_SLAVE_INIT', '初始化 RC 接收端'))
				.appendField(getMessage('RC_SLAVE_INIT_PAIR_ID', '配對ID'))
				.appendField(new Blockly.FieldNumber(1, 1, 255, 1), 'PAIR_ID')
				.appendField(getMessage('RC_SLAVE_INIT_CHANNEL', '頻道'))
				.appendField(new Blockly.FieldNumber(1, 1, 11, 1), 'CHANNEL');
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setColour(160);
			this.setTooltip(getMessage('RC_SLAVE_INIT_TOOLTIP', '初始化遙控接收端，設定配對 ID (1-255) 和頻道 (1-11)'));
			this.setHelpUrl('');
		},
	};

	// === 等待配對 ===
	Blockly.Blocks['rc_wait_connection'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_WAIT_CONNECTION', '等待配對'))
				.appendField(getMessage('RC_WAIT_TIMEOUT', '超時'))
				.appendField(new Blockly.FieldNumber(30, 1, 60, 1), 'TIMEOUT')
				.appendField(getMessage('RC_WAIT_SECONDS', '秒'));
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setColour(160);
			this.setTooltip(getMessage('RC_WAIT_TOOLTIP', '等待發射端連線，LED 藍色閃爍，超時後繼續執行'));
			this.setHelpUrl('');
		},
	};

	// === 是否已連線 ===
	Blockly.Blocks['rc_is_connected'] = {
		init: function () {
			this.appendDummyInput().appendField(getMessage('RC_IS_CONNECTED', 'RC 已連線?'));
			this.setOutput(true, 'Boolean');
			this.setColour(160);
			this.setTooltip(getMessage('RC_IS_CONNECTED_TOOLTIP', '檢查是否在 500ms 內收到資料'));
			this.setHelpUrl('');
		},
	};

	// === 讀取遠端搖桿值 ===
	Blockly.Blocks['rc_get_joystick'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_GET_JOYSTICK_PREFIX', '遠端搖桿'))
				.appendField(new Blockly.FieldDropdown(RC_JOYSTICK_CHANNEL_OPTIONS), 'CHANNEL');
			this.setOutput(true, 'Number');
			this.setColour(160);
			this.setTooltip(getMessage('RC_GET_JOYSTICK_TOOLTIP', '讀取遠端搖桿的 ADC 值 (0-4095)，2048 為中點'));
			this.setHelpUrl('');
		},
	};

	// === 讀取並映射遠端搖桿值 ===
	Blockly.Blocks['rc_get_joystick_mapped'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_GET_JOYSTICK_MAPPED_PREFIX', '遠端搖桿'))
				.appendField(new Blockly.FieldDropdown(RC_JOYSTICK_CHANNEL_OPTIONS), 'CHANNEL')
				.appendField(getMessage('RC_GET_JOYSTICK_MAPPED_MIN', '映射'));
			this.appendValueInput('MIN').setCheck('Number');
			this.appendDummyInput().appendField(getMessage('RC_GET_JOYSTICK_MAPPED_MAX', '~'));
			this.appendValueInput('MAX').setCheck('Number');
			this.setInputsInline(true);
			this.setOutput(true, 'Number');
			this.setColour(160);
			this.setTooltip(getMessage('RC_GET_JOYSTICK_MAPPED_TOOLTIP', '讀取遠端搖桿並映射到指定範圍'));
			this.setHelpUrl('');
		},
	};

	// === 檢查遠端按鈕是否按下 ===
	Blockly.Blocks['rc_is_button_pressed'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_IS_BUTTON_PRESSED_PREFIX', '遠端按鈕'))
				.appendField(new Blockly.FieldDropdown(RC_BUTTON_CHANNEL_OPTIONS), 'BUTTON')
				.appendField(getMessage('RC_IS_BUTTON_PRESSED_SUFFIX', '被按下?'));
			this.setOutput(true, 'Boolean');
			this.setColour(160);
			this.setTooltip(getMessage('RC_IS_BUTTON_PRESSED_TOOLTIP', '檢查遠端按鈕是否被按下'));
			this.setHelpUrl('');
		},
	};

	// === 讀取遠端按鈕狀態 ===
	Blockly.Blocks['rc_get_button'] = {
		init: function () {
			this.appendDummyInput()
				.appendField(getMessage('RC_GET_BUTTON_PREFIX', '遠端按鈕'))
				.appendField(new Blockly.FieldDropdown(RC_BUTTON_CHANNEL_OPTIONS), 'BUTTON')
				.appendField(getMessage('RC_GET_BUTTON_SUFFIX', '狀態'));
			this.setOutput(true, 'Number');
			this.setColour(160);
			this.setTooltip(getMessage('RC_GET_BUTTON_TOOLTIP', '讀取遠端按鈕狀態 (0=按下, 1=放開)'));
			this.setHelpUrl('');
		},
	};

	// 記錄載入訊息
	console.log('[blockly] RC 遙控通訊積木定義已載入');
})();
