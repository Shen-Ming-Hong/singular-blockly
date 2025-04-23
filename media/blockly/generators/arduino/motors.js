/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 模組載入時自動註冊需要強制掃描的積木類型
(function () {
	// 確保 arduinoGenerator 已初始化
	if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
		// 註冊 servo_setup 積木
		window.arduinoGenerator.registerAlwaysGenerateBlock('servo_setup');
	} else {
		// 如果 arduinoGenerator 尚未初始化，則設置一個載入完成後執行的回調
		window.addEventListener('load', function () {
			if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
				window.arduinoGenerator.registerAlwaysGenerateBlock('servo_setup');
			}
		});
	}
})();

window.arduinoGenerator.forBlock['servo_setup'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const pin = block.getFieldValue('PIN');
		// Include Servo library
		window.arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		// Declare servo variable
		window.arduinoGenerator.variables_['servo_' + varName] = `Servo ${varName};`;
		// Attach servo in setup
		window.arduinoGenerator.setupCode_.push(`${varName}.attach(${pin});`);
		// Add to lib_deps for platformio.ini
		if (!window.arduinoGenerator.lib_deps_) {
			window.arduinoGenerator.lib_deps_ = [];
		}
		if (!window.arduinoGenerator.lib_deps_.includes('arduino-libraries/Servo@^1.2.2')) {
			window.arduinoGenerator.lib_deps_.push('arduino-libraries/Servo@^1.2.2');
		}
		return '';
	} catch (e) {
		log.error('Servo setup code generation error:', e);
		return '';
	}
};

window.arduinoGenerator.forBlock['servo_move'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const angle = block.getFieldValue('ANGLE');
		// Ensure Servo library is included
		window.arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		// Move servo
		return `${varName}.write(${angle});\n`;
	} catch (e) {
		log.error('Servo move code generation error:', e);
		return '';
	}
};
