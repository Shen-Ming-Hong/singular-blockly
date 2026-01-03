/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick X11 擴展板 MicroPython 程式碼生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (x11.js)');
		return;
	}

	// === 180° 伺服馬達角度控制 ===
	generator.forBlock['x11_servo_180_angle'] = function (block) {
		// 添加 import
		generator.addImport('from bbl.servos import ServosController');

		// 添加硬體初始化
		generator.addHardwareInit('servos', 'servos = ServosController()');

		// 取得參數
		const port = block.getFieldValue('PORT');
		const angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_NONE) || '0';

		// 生成程式碼 (含 clamp 0-180)
		return `servos.set_angle(${port}, max(0, min(180, ${angle})))\n`;
	};

	// === 360° 伺服馬達速度控制 ===
	generator.forBlock['x11_servo_360_speed'] = function (block) {
		// 添加 import
		generator.addImport('from bbl.servos import ServosController');

		// 添加硬體初始化
		generator.addHardwareInit('servos', 'servos = ServosController()');

		// 取得參數
		const port = block.getFieldValue('PORT');
		const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_NONE) || '0';

		// 生成程式碼 (含 clamp -100 到 100)
		return `servos.set_speed(${port}, max(-100, min(100, ${speed})))\n`;
	};

	// === 停止伺服馬達 ===
	generator.forBlock['x11_servo_stop'] = function (block) {
		// 添加 import
		generator.addImport('from bbl.servos import ServosController');

		// 添加硬體初始化
		generator.addHardwareInit('servos', 'servos = ServosController()');

		// 取得參數
		const port = block.getFieldValue('PORT');

		// 生成程式碼
		return `servos.stop(${port})\n`;
	};

	// === 直流馬達速度控制 ===
	generator.forBlock['x11_motor_speed'] = function (block) {
		// 添加 import
		generator.addImport('from bbl.motors import MotorsController');

		// 添加硬體初始化
		generator.addHardwareInit('motors', 'motors = MotorsController()');

		// 取得參數
		const port = block.getFieldValue('PORT');
		const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_NONE) || '0';

		// 生成程式碼 (含 clamp -2048 到 2048)
		return `motors.set_speed(${port}, max(-2048, min(2048, ${speed})))\n`;
	};

	// === 停止直流馬達 ===
	generator.forBlock['x11_motor_stop'] = function (block) {
		// 添加 import
		generator.addImport('from bbl.motors import MotorsController');

		// 添加硬體初始化
		generator.addHardwareInit('motors', 'motors = MotorsController()');

		// 取得參數
		const port = block.getFieldValue('PORT');

		// 生成程式碼
		return `motors.stop(${port})\n`;
	};

	// === LED 燈條設定顏色 ===
	generator.forBlock['x11_led_set_color'] = function (block) {
		// 添加 import
		generator.addImport('from machine import Pin');
		generator.addImport('from neopixel import NeoPixel');

		// 取得參數
		const port = block.getFieldValue('PORT'); // GPIO 編號 (21 或 20)
		const index = block.getFieldValue('INDEX'); // 0-3 或 'all'
		const red = generator.valueToCode(block, 'RED', generator.ORDER_NONE) || '0';
		const green = generator.valueToCode(block, 'GREEN', generator.ORDER_NONE) || '0';
		const blue = generator.valueToCode(block, 'BLUE', generator.ORDER_NONE) || '0';

		// 添加硬體初始化（每個埠位一個 NeoPixel 物件）
		const portName = port === '21' ? 'd1' : 'd2';
		generator.addHardwareInit(`np_${portName}`, `np_${portName} = NeoPixel(Pin(${port}), 4)`);

		// 生成程式碼
		let code = '';
		if (index === 'all') {
			// 設定所有 LED
			code += `for i in range(4):\n`;
			code += `    np_${portName}[i] = (max(0, min(255, ${red})), max(0, min(255, ${green})), max(0, min(255, ${blue})))\n`;
		} else {
			// 設定單顆 LED
			code += `np_${portName}[${index}] = (max(0, min(255, ${red})), max(0, min(255, ${green})), max(0, min(255, ${blue})))\n`;
		}
		code += `np_${portName}.write()\n`;

		return code;
	};

	// 記錄載入訊息
	console.log('[blockly] X11 MicroPython 生成器已載入');
})();
