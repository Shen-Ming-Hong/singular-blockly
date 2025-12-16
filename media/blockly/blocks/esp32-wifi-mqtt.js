/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * ESP32 WiFi 與 MQTT 積木定義
 * 僅支援 ESP32 系列開發板 (esp32, supermini)
 */

'use strict';

/**
 * 檢查當前板子是否為 ESP32 系列
 * @returns {boolean} 是否為 ESP32 板子
 */
function isEsp32Board() {
	return window.currentBoard === 'esp32' || window.currentBoard === 'supermini';
}

// =============================================================================
// WiFi 積木定義
// =============================================================================

/**
 * WiFi 連線積木
 * 連線到指定的 WiFi 網路（超時 10 秒）
 */
Blockly.Blocks['esp32_wifi_connect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_WIFI_CONNECT', 'WiFi 連線'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_WIFI_CONNECT_SSID', 'SSID'))
			.appendField(new Blockly.FieldTextInput('MyWiFi'), 'SSID');

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_WIFI_CONNECT_PASSWORD', '密碼'))
			.appendField(new Blockly.FieldTextInput(''), 'PASSWORD');

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_CONNECT_TOOLTIP', '連線到 WiFi 網路（超時 10 秒）'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_connect');
	},
};

/**
 * WiFi 斷線積木
 * 斷開 WiFi 連線
 */
Blockly.Blocks['esp32_wifi_disconnect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_WIFI_DISCONNECT', 'WiFi 斷線'));

		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_DISCONNECT_TOOLTIP', '斷開 WiFi 連線'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_disconnect');
	},
};

/**
 * WiFi 連線狀態積木
 * 回傳布林值，表示是否已連線
 */
Blockly.Blocks['esp32_wifi_status'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_WIFI_STATUS', 'WiFi 已連線?'));

		this.setOutput(true, 'Boolean');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_STATUS_TOOLTIP', '回傳 WiFi 連線狀態'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_status');
	},
};

/**
 * 取得 WiFi IP 位址積木
 * 回傳字串格式的 IP 位址
 */
Blockly.Blocks['esp32_wifi_get_ip'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_WIFI_GET_IP', 'WiFi IP 位址'));

		this.setOutput(true, 'String');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_GET_IP_TOOLTIP', '取得目前 IP 位址'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_get_ip');
	},
};

/**
 * WiFi 掃描積木
 * 回傳附近 WiFi 網路數量
 */
Blockly.Blocks['esp32_wifi_scan'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_WIFI_SCAN', '掃描 WiFi 網路'));

		this.setOutput(true, 'Number');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_SCAN_TOOLTIP', '掃描並回傳附近 WiFi 網路數量'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_scan');
	},
};

/**
 * 取得掃描到的 WiFi SSID 積木
 * 回傳指定索引的 WiFi 名稱
 */
Blockly.Blocks['esp32_wifi_get_ssid'] = {
	init: function () {
		this.appendValueInput('INDEX')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('ESP32_WIFI_GET_SSID', '取得 WiFi SSID'))
			.appendField(window.languageManager.getMessage('ESP32_WIFI_GET_SSID_INDEX', '索引'));

		this.setOutput(true, 'String');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_GET_SSID_TOOLTIP', '取得指定索引的 WiFi 名稱'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_get_ssid');
	},
};

/**
 * 取得掃描到的 WiFi 訊號強度積木
 * 回傳指定索引的訊號強度 (dBm)
 */
Blockly.Blocks['esp32_wifi_get_rssi'] = {
	init: function () {
		this.appendValueInput('INDEX')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('ESP32_WIFI_GET_RSSI', '取得 WiFi 訊號強度'))
			.appendField(window.languageManager.getMessage('ESP32_WIFI_GET_RSSI_INDEX', '索引'));

		this.setOutput(true, 'Number');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_WIFI_GET_RSSI_TOOLTIP', '取得指定索引的訊號強度 (dBm)'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_wifi_get_rssi');
	},
};

// =============================================================================
// MQTT 積木定義
// =============================================================================

/**
 * MQTT 設定積木
 * 設定 MQTT 伺服器連線參數
 */
Blockly.Blocks['esp32_mqtt_setup'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_MQTT_SETUP', 'MQTT 設定'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_MQTT_SETUP_SERVER', '伺服器'))
			.appendField(new Blockly.FieldTextInput('broker.hivemq.com'), 'SERVER');

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_MQTT_SETUP_PORT', '埠號'))
			.appendField(new Blockly.FieldNumber(1883, 1, 65535, 1), 'PORT');

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_MQTT_SETUP_CLIENT_ID', '客戶端 ID'))
			.appendField(new Blockly.FieldTextInput('esp32client'), 'CLIENT_ID');

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_SETUP_TOOLTIP', '設定 MQTT 伺服器連線參數'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_setup');
	},
};

/**
 * MQTT 連線積木
 * 連線到 MQTT 伺服器
 */
Blockly.Blocks['esp32_mqtt_connect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_MQTT_CONNECT', 'MQTT 連線'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_MQTT_CONNECT_USERNAME', '帳號'))
			.appendField(new Blockly.FieldTextInput(''), 'USERNAME');

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ESP32_MQTT_CONNECT_PASSWORD', '密碼'))
			.appendField(new Blockly.FieldTextInput(''), 'PASSWORD');

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_CONNECT_TOOLTIP', '連線到 MQTT 伺服器'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_connect');
	},
};

/**
 * MQTT 發布訊息積木
 * 發布訊息到指定主題
 */
Blockly.Blocks['esp32_mqtt_publish'] = {
	init: function () {
		this.appendValueInput('TOPIC')
			.setCheck('String')
			.appendField(window.languageManager.getMessage('ESP32_MQTT_PUBLISH', 'MQTT 發布訊息'))
			.appendField(window.languageManager.getMessage('ESP32_MQTT_PUBLISH_TOPIC', '主題'));

		this.appendValueInput('MESSAGE')
			.setCheck('String')
			.appendField(window.languageManager.getMessage('ESP32_MQTT_PUBLISH_MESSAGE', '訊息'));

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_PUBLISH_TOOLTIP', '發布訊息到指定主題'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_publish');
	},
};

/**
 * MQTT 訂閱積木
 * 訂閱指定主題的訊息
 */
Blockly.Blocks['esp32_mqtt_subscribe'] = {
	init: function () {
		this.appendValueInput('TOPIC')
			.setCheck('String')
			.appendField(window.languageManager.getMessage('ESP32_MQTT_SUBSCRIBE', 'MQTT 訂閱'))
			.appendField(window.languageManager.getMessage('ESP32_MQTT_SUBSCRIBE_TOPIC', '主題'));

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_SUBSCRIBE_TOOLTIP', '訂閱指定主題的訊息'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_subscribe');
	},
};

/**
 * MQTT 處理訊息積木
 * 維持連線並處理收到的訊息（放在 loop 中）
 */
Blockly.Blocks['esp32_mqtt_loop'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_MQTT_LOOP', 'MQTT 處理訊息'));

		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_LOOP_TOOLTIP', '維持連線並處理收到的訊息（放在 loop 中）'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_loop');
	},
};

/**
 * 取得 MQTT 最新主題積木
 * 回傳最近收到訊息的主題
 */
Blockly.Blocks['esp32_mqtt_get_topic'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_MQTT_GET_TOPIC', 'MQTT 最新主題'));

		this.setOutput(true, 'String');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_GET_TOPIC_TOOLTIP', '取得最近收到訊息的主題'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_get_topic');
	},
};

/**
 * 取得 MQTT 最新訊息積木
 * 回傳最近收到的訊息內容
 */
Blockly.Blocks['esp32_mqtt_get_message'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_MQTT_GET_MESSAGE', 'MQTT 最新訊息'));

		this.setOutput(true, 'String');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_GET_MESSAGE_TOOLTIP', '取得最近收到的訊息內容'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_get_message');
	},
};

/**
 * MQTT 連線狀態積木
 * 檢查是否已連線到 MQTT 伺服器
 */
Blockly.Blocks['esp32_mqtt_status'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ESP32_MQTT_STATUS', 'MQTT 已連線'));

		this.setOutput(true, 'Boolean');
		this.setColour(210);
		this.setTooltip(window.languageManager.getMessage('ESP32_MQTT_STATUS_TOOLTIP', '檢查是否已連線到 MQTT 伺服器'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('esp32_mqtt_status');
	},
};
