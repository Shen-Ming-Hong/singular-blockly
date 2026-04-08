/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * FootBot MicroPython 程式碼生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (singular-footbot.js)');
		return;
	}

	// === 足球車：馬達移動 ===
	generator.forBlock['singular_footbot_motor_move'] = function (block) {
		generator.addImport('from bbl.motors import MotorsController');
		generator.addHardwareInit('motors', 'motors = MotorsController()');
		const left = generator.valueToCode(block, 'LEFT', generator.ORDER_NONE) || '0';
		const right = generator.valueToCode(block, 'RIGHT', generator.ORDER_NONE) || '0';
		
		let code = `motors.set_speed(1, max(-2048, min(2048, int(-(${left}) * 20.48))))\n`;
		code += `motors.set_speed(2, max(-2048, min(2048, int((${right}) * 20.48))))\n`;
		return code;
	};

	// === 足球車：停止移動 ===
	generator.forBlock['singular_footbot_stop'] = function (block) {
		generator.addImport('from bbl.motors import MotorsController');
		generator.addHardwareInit('motors', 'motors = MotorsController()');
		generator.addImport('from bbl.servos import ServosController');
		generator.addHardwareInit('servos', 'servos = ServosController()');
		return `motors.stop(1)\nmotors.stop(2)\nservos.stop(1)\n`;
	};

	// === 足球車：後退 ===
	generator.forBlock['singular_footbot_backward'] = function (block) {
		generator.addImport('from bbl.motors import MotorsController');
		generator.addHardwareInit('motors', 'motors = MotorsController()');
		const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_NONE) || '0';
		
		let code = `motors.set_speed(1, max(-2048, min(2048, int((${speed}) * 20.48))))\n`;
		code += `motors.set_speed(2, max(-2048, min(2048, int(-(${speed}) * 20.48))))\n`;
		return code;
	};

	// === 足球車：原地左轉 ===
	generator.forBlock['singular_footbot_spin_left'] = function (block) {
		generator.addImport('from bbl.motors import MotorsController');
		generator.addHardwareInit('motors', 'motors = MotorsController()');
		const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_NONE) || '0';
		
		let code = `motors.set_speed(1, max(-2048, min(2048, int((${speed}) * 20.48))))\n`;
		code += `motors.set_speed(2, max(-2048, min(2048, int((${speed}) * 20.48))))\n`;
		return code;
	};

	// === 足球車：原地右轉 ===
	generator.forBlock['singular_footbot_spin_right'] = function (block) {
		generator.addImport('from bbl.motors import MotorsController');
		generator.addHardwareInit('motors', 'motors = MotorsController()');
		const speed = generator.valueToCode(block, 'SPEED', generator.ORDER_NONE) || '0';
		
		let code = `motors.set_speed(1, max(-2048, min(2048, int(-(${speed}) * 20.48))))\n`;
		code += `motors.set_speed(2, max(-2048, min(2048, int(-(${speed}) * 20.48))))\n`;
		return code;
	};

	// === 足球車：踢球 ===
	generator.forBlock['singular_footbot_kick'] = function (block) {
		generator.addImport('from bbl.servos import ServosController');
		generator.addHardwareInit('servos', 'servos = ServosController()');
		return `servos.set_speed(1, 100)\n`;
	};

	// === 足球車：抬球 ===
	generator.forBlock['singular_footbot_lift'] = function (block) {
		generator.addImport('from bbl.servos import ServosController');
		generator.addHardwareInit('servos', 'servos = ServosController()');
		return `servos.set_speed(1, -100)\n`;
	};

	// 記錄載入訊息
	console.log('[blockly] FootBot MicroPython 生成器已載入');
})();
