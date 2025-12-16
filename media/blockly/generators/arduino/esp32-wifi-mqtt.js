/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * ESP32 WiFi 與 MQTT 代碼生成器
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

/**
 * 生成非 ESP32 板子的警告訊息
 * @returns {string} 警告註解
 */
function generateBoardWarning() {
	return '// 警告：WiFi/MQTT 功能僅支援 ESP32 系列板子\n';
}

// =============================================================================
// WiFi 代碼生成器
// =============================================================================

/**
 * WiFi 連線積木生成器
 * 生成帶有 10 秒超時的 WiFi 連線代碼
 */
window.arduinoGenerator.forBlock['esp32_wifi_connect'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	const ssid = block.getFieldValue('SSID');
	const password = block.getFieldValue('PASSWORD');

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	// 生成連線代碼（含 10 秒超時）
	let code = `// WiFi 連線到 ${ssid}\n`;
	code += `WiFi.mode(WIFI_STA);\n`;
	code += `WiFi.begin("${ssid}", "${password}");\n`;
	code += `unsigned long _wifiStartTime = millis();\n`;
	code += `while (WiFi.status() != WL_CONNECTED && millis() - _wifiStartTime < 10000) {\n`;
	code += `  delay(500);\n`;
	code += `}\n`;

	return code;
};

/**
 * WiFi 斷線積木生成器
 */
window.arduinoGenerator.forBlock['esp32_wifi_disconnect'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	let code = `// WiFi 斷線\n`;
	code += `WiFi.disconnect();\n`;

	return code;
};

/**
 * WiFi 連線狀態積木生成器
 */
window.arduinoGenerator.forBlock['esp32_wifi_status'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	return ['(WiFi.status() == WL_CONNECTED)', window.arduinoGenerator.ORDER_ATOMIC];
};

/**
 * 取得 WiFi IP 位址積木生成器
 */
window.arduinoGenerator.forBlock['esp32_wifi_get_ip'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['String("")', window.arduinoGenerator.ORDER_ATOMIC];
	}

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	return ['WiFi.localIP().toString()', window.arduinoGenerator.ORDER_ATOMIC];
};

/**
 * WiFi 掃描積木生成器
 */
window.arduinoGenerator.forBlock['esp32_wifi_scan'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	return ['WiFi.scanNetworks()', window.arduinoGenerator.ORDER_ATOMIC];
};

/**
 * 取得掃描到的 WiFi SSID 積木生成器
 */
window.arduinoGenerator.forBlock['esp32_wifi_get_ssid'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['String("")', window.arduinoGenerator.ORDER_ATOMIC];
	}

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	const index = window.arduinoGenerator.valueToCode(block, 'INDEX', window.arduinoGenerator.ORDER_NONE) || '0';

	return [`WiFi.SSID(${index})`, window.arduinoGenerator.ORDER_ATOMIC];
};

/**
 * 取得掃描到的 WiFi 訊號強度積木生成器
 */
window.arduinoGenerator.forBlock['esp32_wifi_get_rssi'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}

	// 添加 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	const index = window.arduinoGenerator.valueToCode(block, 'INDEX', window.arduinoGenerator.ORDER_NONE) || '0';

	return [`WiFi.RSSI(${index})`, window.arduinoGenerator.ORDER_ATOMIC];
};

// =============================================================================
// MQTT 代碼生成器
// =============================================================================

/**
 * MQTT 設定積木生成器
 * 生成全域變數、callback 函數與初始化代碼
 */
window.arduinoGenerator.forBlock['esp32_mqtt_setup'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	const server = block.getFieldValue('SERVER');
	const port = block.getFieldValue('PORT');
	const clientId = block.getFieldValue('CLIENT_ID');

	// 添加標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';
	window.arduinoGenerator.includes_['pubsubclient'] = '#include <PubSubClient.h>';

	// 添加 PubSubClient 庫依賴
	if (!window.arduinoGenerator.lib_deps_) {
		window.arduinoGenerator.lib_deps_ = [];
	}
	if (!window.arduinoGenerator.lib_deps_.includes('knolleary/PubSubClient@^2.8')) {
		window.arduinoGenerator.lib_deps_.push('knolleary/PubSubClient@^2.8');
	}

	// 添加全域變數
	window.arduinoGenerator.variables_['mqtt_vars'] = `
// MQTT 全域變數
WiFiClient _wifiClient;
PubSubClient mqttClient(_wifiClient);
String lastMqttTopic = "";
String lastMqttMessage = "";
const char* _mqttClientId = "${clientId}";
`;

	// 添加 callback 函數
	window.arduinoGenerator.functions_['mqtt_callback'] = `
// MQTT 訊息回調函數
void _mqttCallback(char* topic, byte* payload, unsigned int length) {
  lastMqttTopic = String(topic);
  lastMqttMessage = "";
  for (unsigned int i = 0; i < length; i++) {
    lastMqttMessage += (char)payload[i];
  }
}
`;

	// 生成 setup 代碼
	let code = `// MQTT 設定 - 伺服器: ${server}:${port}\n`;
	code += `mqttClient.setServer("${server}", ${port});\n`;
	code += `mqttClient.setCallback(_mqttCallback);\n`;

	return code;
};

/**
 * MQTT 連線積木生成器
 * 使用 mqtt_setup 設定的 CLIENT_ID
 */
window.arduinoGenerator.forBlock['esp32_mqtt_connect'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	const username = block.getFieldValue('USERNAME');
	const password = block.getFieldValue('PASSWORD');

	// 添加標頭檔（防止未使用 mqtt_setup 時遺漏）
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';
	window.arduinoGenerator.includes_['pubsubclient'] = '#include <PubSubClient.h>';

	let code = `// MQTT 連線\n`;

	// 根據是否提供帳密選擇連線方式
	if (username && password) {
		code += `mqttClient.connect(_mqttClientId, "${username}", "${password}");\n`;
	} else {
		code += `mqttClient.connect(_mqttClientId);\n`;
	}

	return code;
};

/**
 * MQTT 發布訊息積木生成器
 */
window.arduinoGenerator.forBlock['esp32_mqtt_publish'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	const topic = window.arduinoGenerator.valueToCode(block, 'TOPIC', window.arduinoGenerator.ORDER_NONE) || '"test/topic"';
	const message = window.arduinoGenerator.valueToCode(block, 'MESSAGE', window.arduinoGenerator.ORDER_NONE) || '"Hello"';

	// 添加標頭檔
	window.arduinoGenerator.includes_['pubsubclient'] = '#include <PubSubClient.h>';

	let code = `// MQTT 發布訊息\n`;
	code += `mqttClient.publish(String(${topic}).c_str(), String(${message}).c_str());\n`;

	return code;
};

/**
 * MQTT 訂閱積木生成器
 */
window.arduinoGenerator.forBlock['esp32_mqtt_subscribe'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	const topic = window.arduinoGenerator.valueToCode(block, 'TOPIC', window.arduinoGenerator.ORDER_NONE) || '"test/topic"';

	// 添加標頭檔
	window.arduinoGenerator.includes_['pubsubclient'] = '#include <PubSubClient.h>';

	let code = `// MQTT 訂閱主題\n`;
	code += `mqttClient.subscribe(String(${topic}).c_str());\n`;

	return code;
};

/**
 * MQTT 處理訊息積木生成器
 */
window.arduinoGenerator.forBlock['esp32_mqtt_loop'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return generateBoardWarning();
	}

	// 添加標頭檔
	window.arduinoGenerator.includes_['pubsubclient'] = '#include <PubSubClient.h>';

	return `mqttClient.loop();\n`;
};

/**
 * 取得 MQTT 最新主題積木生成器
 */
window.arduinoGenerator.forBlock['esp32_mqtt_get_topic'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['String("")', window.arduinoGenerator.ORDER_ATOMIC];
	}

	return ['lastMqttTopic', window.arduinoGenerator.ORDER_ATOMIC];
};

/**
 * 取得 MQTT 最新訊息積木生成器
 */
window.arduinoGenerator.forBlock['esp32_mqtt_get_message'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['String("")', window.arduinoGenerator.ORDER_ATOMIC];
	}

	return ['lastMqttMessage', window.arduinoGenerator.ORDER_ATOMIC];
};

/**
 * MQTT 連線狀態積木生成器
 */
window.arduinoGenerator.forBlock['esp32_mqtt_status'] = function (block) {
	// 板子檢查
	if (!isEsp32Board()) {
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}

	// 添加標頭檔
	window.arduinoGenerator.includes_['pubsubclient'] = '#include <PubSubClient.h>';

	return ['mqttClient.connected()', window.arduinoGenerator.ORDER_ATOMIC];
};
