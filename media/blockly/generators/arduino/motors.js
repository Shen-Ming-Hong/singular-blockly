// filepath: e:\singular-blockly\media\blockly\generators\arduino\motors.js
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['servo_setup'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const pin = block.getFieldValue('PIN');
		// Include Servo library
		window.arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		// Declare servo variable
		window.arduinoGenerator.variables_['servo_' + varName] = `Servo ${varName};`;
		// Attach servo in setup
		window.arduinoGenerator.setupCode_.push(`  ${varName}.attach(${pin});`);
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
