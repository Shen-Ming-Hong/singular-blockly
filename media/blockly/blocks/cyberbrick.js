/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick 專用積木定義
 */

'use strict';

// === 主程式積木 ===
Blockly.Blocks['micropython_main'] = {
	init: function () {
		this.appendStatementInput('MAIN').setCheck(null).appendField(window.languageManager.getMessage('CYBERBRICK_MAIN', '主程式'));
		this.setStyle('procedure_blocks');
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_MAIN_TOOLTIP', 'MicroPython 程式入口點'));
		this.setHelpUrl('');
		this.setDeletable(false);
		this.setMovable(true);
	},
};

// === 板載 LED 積木 ===

/**
 * 設定板載 LED 顏色
 */
Blockly.Blocks['cyberbrick_led_set_color'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_LED_SET_COLOR_PREFIX', '設定板載 LED 顏色'));
		this.appendValueInput('RED').setCheck('Number').appendField('R');
		this.appendValueInput('GREEN').setCheck('Number').appendField('G');
		this.appendValueInput('BLUE').setCheck('Number').appendField('B');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_LED_SET_COLOR_TOOLTIP', '設定板載 WS2812 LED 的 RGB 顏色 (0-255)'));
		this.setHelpUrl('');
	},
};

/**
 * 關閉板載 LED
 */
Blockly.Blocks['cyberbrick_led_off'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_LED_OFF', '關閉板載 LED'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_LED_OFF_TOOLTIP', '關閉板載 LED（設為黑色）'));
		this.setHelpUrl('');
	},
};

// === GPIO 積木 ===

/**
 * 設定 GPIO 輸出
 */
Blockly.Blocks['cyberbrick_gpio_set'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('CYBERBRICK_GPIO_SET_PREFIX', '設定 GPIO'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions ? window.getDigitalPinOptions() : [['GPIO 0', '0']];
				}),
				'PIN'
			)
			.appendField(window.languageManager.getMessage('CYBERBRICK_GPIO_SET_TO', '為'));
		this.appendValueInput('VALUE').setCheck('Boolean');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_GPIO_SET_TOOLTIP', '設定 GPIO 腳位的數位輸出值'));
		this.setHelpUrl('');
	},
};

/**
 * 讀取 GPIO 輸入
 */
Blockly.Blocks['cyberbrick_gpio_read'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('CYBERBRICK_GPIO_READ', '讀取 GPIO'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions ? window.getDigitalPinOptions() : [['GPIO 0', '0']];
				}),
				'PIN'
			);
		this.setOutput(true, 'Boolean');
		this.setColour(230);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_GPIO_READ_TOOLTIP', '讀取 GPIO 腳位的數位輸入值'));
		this.setHelpUrl('');
	},
};

// === 時序積木 ===

/**
 * 延時（毫秒）
 */
Blockly.Blocks['cyberbrick_delay_ms'] = {
	init: function () {
		this.appendValueInput('TIME')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('CYBERBRICK_DELAY_MS_PREFIX', '延時'));
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_DELAY_MS_SUFFIX', '毫秒'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(120);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_DELAY_MS_TOOLTIP', '暫停執行指定的毫秒數'));
		this.setHelpUrl('');
	},
};

/**
 * 延時（秒）
 */
Blockly.Blocks['cyberbrick_delay_s'] = {
	init: function () {
		this.appendValueInput('TIME')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('CYBERBRICK_DELAY_S_PREFIX', '延時'));
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_DELAY_S_SUFFIX', '秒'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(120);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_DELAY_S_TOOLTIP', '暫停執行指定的秒數'));
		this.setHelpUrl('');
	},
};

// === WiFi 積木 ===

/**
 * WiFi 連線
 */
Blockly.Blocks['cyberbrick_wifi_connect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_WIFI_CONNECT', '連接 WiFi'));
		this.appendValueInput('SSID').setCheck('String').appendField(window.languageManager.getMessage('CYBERBRICK_WIFI_SSID', 'SSID'));
		this.appendValueInput('PASSWORD')
			.setCheck('String')
			.appendField(window.languageManager.getMessage('CYBERBRICK_WIFI_PASSWORD', '密碼'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_WIFI_CONNECT_TOOLTIP', '連接到指定的 WiFi 網路'));
		this.setHelpUrl('');
	},
};

/**
 * WiFi 斷線
 */
Blockly.Blocks['cyberbrick_wifi_disconnect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_WIFI_DISCONNECT', '斷開 WiFi'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_WIFI_DISCONNECT_TOOLTIP', '斷開目前的 WiFi 連線'));
		this.setHelpUrl('');
	},
};

/**
 * WiFi 是否已連線
 */
Blockly.Blocks['cyberbrick_wifi_is_connected'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_WIFI_IS_CONNECTED', 'WiFi 已連線？'));
		this.setOutput(true, 'Boolean');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP', '檢查 WiFi 是否已連線'));
		this.setHelpUrl('');
	},
};

/**
 * 取得 IP 位址
 */
Blockly.Blocks['cyberbrick_wifi_get_ip'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('CYBERBRICK_WIFI_GET_IP', '取得 IP 位址'));
		this.setOutput(true, 'String');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('CYBERBRICK_WIFI_GET_IP_TOOLTIP', '取得目前連線的 IP 位址'));
		this.setHelpUrl('');
	},
};

// 記錄載入訊息
console.log('[blockly] CyberBrick 積木定義已載入');
