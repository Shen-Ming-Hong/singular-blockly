// filepath: e:\singular-blockly\media\blockly\blocks\motors.js
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.Blocks['servo_setup'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SERVO_SETUP'))
			.appendField(new Blockly.FieldTextInput('myServo'), 'VAR')
			.appendField(window.languageManager.getMessage('SERVO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('SERVO_SETUP_TOOLTIP'));
		this.setHelpUrl('');
	},
};

Blockly.Blocks['servo_move'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SERVO_MOVE'))
			.appendField(new Blockly.FieldTextInput('myServo'), 'VAR')
			.appendField(window.languageManager.getMessage('SERVO_ANGLE'))
			.appendField(new Blockly.FieldNumber(90, 0, 180), 'ANGLE');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('SERVO_MOVE_TOOLTIP'));
		this.setHelpUrl('');
	},
};
