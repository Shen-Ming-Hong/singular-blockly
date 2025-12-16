/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// audit-utils: helper functions for frequency estimation and simple utilities

function estimateFrequency(key) {
	if (!key) {
		return 30;
	}
	if (key.startsWith('CATEGORY_') || key.startsWith('TOOLBOX_') || key.startsWith('WORKSPACE_')) {
		return 95;
	}
	const common = [
		'ARDUINO_DIGITAL_WRITE',
		'ARDUINO_DIGITAL_READ',
		'ARDUINO_ANALOG_WRITE',
		'ARDUINO_ANALOG_READ',
		'ARDUINO_DELAY',
		'SERVO_WRITE',
		'SERVO_READ',
		'CONTROLS_IF',
		'CONTROLS_REPEAT',
		'MATH_NUMBER',
		'LOGIC_COMPARE',
	];
	if (common.includes(key)) {
		return 70;
	}
	if (key.startsWith('ERROR_') || key.startsWith('WARNING_') || key.startsWith('SUCCESS_')) {
		return 50;
	}
	if (key.endsWith('_TOOLTIP') || key.endsWith('_HELPURL') || key.startsWith('SENSOR_') || key.startsWith('MOTOR_')) {
		return 40;
	}
	if (
		key.startsWith('ADVANCED_') ||
		key.includes('_MUTATOR_') ||
		key.startsWith('LIST_') ||
		key.startsWith('TEXT_') ||
		key.startsWith('PROCEDURE_')
	) {
		return 20;
	}
	return 30;
}

module.exports = { estimateFrequency };
