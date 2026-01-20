/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick 硬體積木的 MicroPython 程式碼生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (cyberbrick.js)');
		return;
	}

	// === 主程式積木 ===
	generator.forBlock['micropython_main'] = function (block) {
		// statementToCode 已經會自動添加一層縮排
		// 這裡的程式碼會被 finish() 放入 def main(): 中
		let mainCode = generator.statementToCode(block, 'MAIN');

		// 如果內容為空，返回空字串（finish() 會處理 pass）
		if (!mainCode || !mainCode.trim()) {
			return '';
		}

		return mainCode;
	};

	// === 板載 LED 積木 ===

	/**
	 * 設定板載 LED 顏色
	 */
	generator.forBlock['cyberbrick_led_set_color'] = function (block) {
		// 添加必要的 import
		generator.addImport('from machine import Pin');
		generator.addImport('from neopixel import NeoPixel');

		// 添加硬體初始化（板載 LED 在 GPIO 8，1 顆 WS2812）
		generator.addHardwareInit('onboard_led', 'onboard_led = NeoPixel(Pin(8), 1)');

		// 取得 RGB 值
		const red = generator.valueToCode(block, 'RED', generator.ORDER_NONE) || '0';
		const green = generator.valueToCode(block, 'GREEN', generator.ORDER_NONE) || '0';
		const blue = generator.valueToCode(block, 'BLUE', generator.ORDER_NONE) || '0';

		// 生成設定顏色的程式碼
		let code = `onboard_led[0] = (${red}, ${green}, ${blue})\n`;
		code += 'onboard_led.write()\n';

		return code;
	};

	/**
	 * 關閉板載 LED
	 */
	generator.forBlock['cyberbrick_led_off'] = function (block) {
		// 添加必要的 import
		generator.addImport('from machine import Pin');
		generator.addImport('from neopixel import NeoPixel');

		// 添加硬體初始化
		generator.addHardwareInit('onboard_led', 'onboard_led = NeoPixel(Pin(8), 1)');

		// 生成關閉 LED 的程式碼
		let code = 'onboard_led[0] = (0, 0, 0)\n';
		code += 'onboard_led.write()\n';

		return code;
	};

	// === GPIO 積木 ===

	/**
	 * 設定 GPIO 輸出
	 */
	generator.forBlock['cyberbrick_gpio_set'] = function (block) {
		// 添加必要的 import
		generator.addImport('from machine import Pin');

		const pin = block.getFieldValue('PIN');
		const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || 'False';

		// 添加腳位初始化
		const pinVarName = `pin_${pin}`;
		generator.addHardwareInit(pinVarName, `${pinVarName} = Pin(${pin}, Pin.OUT)`);

		// 將布林值轉換為 Python 的 True/False 或 1/0
		const code = `${pinVarName}.value(1 if ${value} else 0)\n`;

		return code;
	};

	/**
	 * 讀取 GPIO 輸入
	 */
	generator.forBlock['cyberbrick_gpio_read'] = function (block) {
		// 添加必要的 import
		generator.addImport('from machine import Pin');

		const pin = block.getFieldValue('PIN');

		// 添加腳位初始化（輸入模式，帶上拉電阻）
		const pinVarName = `pin_${pin}_in`;
		generator.addHardwareInit(pinVarName, `${pinVarName} = Pin(${pin}, Pin.IN, Pin.PULL_UP)`);

		// 讀取值並轉換為布林值
		const code = `bool(${pinVarName}.value())`;

		return [code, generator.ORDER_FUNCTION_CALL];
	};

	// === 時序積木 ===

	/**
	 * 取得目前毫秒數
	 */
	generator.forBlock['cyberbrick_ticks_ms'] = function (block) {
		generator.addImport('import time');

		const code = 'time.ticks_ms()';

		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 計算時間差
	 */
	generator.forBlock['cyberbrick_ticks_diff'] = function (block) {
		generator.addImport('import time');

		const now = generator.valueToCode(block, 'NOW', generator.ORDER_NONE) || '0';
		const start = generator.valueToCode(block, 'START', generator.ORDER_NONE) || '0';

		const code = `time.ticks_diff(${now}, ${start})`;

		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 延時（毫秒）
	 */
	generator.forBlock['cyberbrick_delay_ms'] = function (block) {
		// 添加必要的 import
		generator.addImport('import time');

		const time = generator.valueToCode(block, 'TIME', generator.ORDER_NONE) || '0';

		const code = `time.sleep_ms(${time})\n`;

		return code;
	};

	/**
	 * 延時（秒）
	 */
	generator.forBlock['cyberbrick_delay_s'] = function (block) {
		// 添加必要的 import
		generator.addImport('import time');

		const time = generator.valueToCode(block, 'TIME', generator.ORDER_NONE) || '0';

		const code = `time.sleep(${time})\n`;

		return code;
	};

	// === WiFi 積木 ===

	/**
	 * WiFi 連線
	 */
	generator.forBlock['cyberbrick_wifi_connect'] = function (block) {
		// 添加必要的 import
		generator.addImport('import network');
		generator.addImport('import time');

		// 添加 WiFi 物件初始化
		generator.addHardwareInit('wlan', 'wlan = network.WLAN(network.STA_IF)');

		const ssid = generator.valueToCode(block, 'SSID', generator.ORDER_NONE) || '""';
		const password = generator.valueToCode(block, 'PASSWORD', generator.ORDER_NONE) || '""';

		// 生成連線程式碼
		let code = 'wlan.active(True)\n';
		code += `wlan.connect(${ssid}, ${password})\n`;
		code += '# 等待連線（最多 10 秒）\n';
		code += 'for _ in range(20):\n';
		code += '    if wlan.isconnected():\n';
		code += '        break\n';
		code += '    time.sleep(0.5)\n';

		return code;
	};

	/**
	 * WiFi 斷線
	 */
	generator.forBlock['cyberbrick_wifi_disconnect'] = function (block) {
		// 添加必要的 import
		generator.addImport('import network');

		// 添加 WiFi 物件初始化
		generator.addHardwareInit('wlan', 'wlan = network.WLAN(network.STA_IF)');

		const code = 'wlan.disconnect()\n';

		return code;
	};

	/**
	 * WiFi 是否已連線
	 */
	generator.forBlock['cyberbrick_wifi_is_connected'] = function (block) {
		// 添加必要的 import
		generator.addImport('import network');

		// 添加 WiFi 物件初始化
		generator.addHardwareInit('wlan', 'wlan = network.WLAN(network.STA_IF)');

		const code = 'wlan.isconnected()';

		return [code, generator.ORDER_FUNCTION_CALL];
	};

	/**
	 * 取得 IP 位址
	 */
	generator.forBlock['cyberbrick_wifi_get_ip'] = function (block) {
		// 添加必要的 import
		generator.addImport('import network');

		// 添加 WiFi 物件初始化
		generator.addHardwareInit('wlan', 'wlan = network.WLAN(network.STA_IF)');

		const code = 'wlan.ifconfig()[0]';

		return [code, generator.ORDER_MEMBER];
	};

	// 記錄載入訊息
	console.log('[blockly] CyberBrick MicroPython 生成器已載入');
})();
