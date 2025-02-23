/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		this.appendStatementInput('SETUP').setCheck(null).appendField(window.languageManager.getMessage('ARDUINO_SETUP'));
		this.appendStatementInput('LOOP').setCheck(null).appendField(window.languageManager.getMessage('ARDUINO_LOOP'));
		this.setColour('#00979C');
		this.setTooltip('Arduino 程式的基本結構');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_write'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_DIGITAL_WRITE'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);

		this.appendValueInput('VALUE')
			.setCheck(['Boolean', 'Number', 'String'])
			.appendField(window.languageManager.getMessage('ARDUINO_VALUE'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="arduino_level"><field name="LEVEL">LOW</field></shadow>'));

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip('寫入數位輸出值到指定的腳位，可以是布林值、數字或變數');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}

		if (e.type === Blockly.Events.BLOCK_MOVE) {
			const valueInput = this.getInput('VALUE');
			if (valueInput && valueInput.connection && !valueInput.connection.targetConnection) {
				if (!valueInput.connection.shadowDom_) {
					valueInput.setShadowDom(
						Blockly.utils.xml.textToDom('<shadow type="arduino_level"><field name="LEVEL">LOW</field></shadow>')
					);
				}
			}
		}
	},
};

Blockly.Blocks['arduino_digital_read'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_DIGITAL_READ'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);
		this.setOutput(true, 'Boolean');
		this.setColour('#00979C');
		this.setTooltip('從指定的腳位讀取數位輸入值');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}
	},
};

Blockly.Blocks['arduino_analog_write'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;
		const range = window.getAnalogOutputRange();

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_ANALOG_WRITE'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions().filter(pin => pin[0].includes('PWM'));
				}),
				'PIN'
			);

		this.appendValueInput('VALUE')
			.setCheck(['Number', 'String'])
			.appendField(window.languageManager.getMessage('ARDUINO_VALUE'))
			.setShadowDom(
				Blockly.utils.xml.textToDom(`<shadow type="math_number"><field name="NUM">${range.defaultValue}</field></shadow>`)
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(`寫入類比值(${range.min}-${range.max})到指定的腳位`);
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const range = window.getAnalogOutputRange();
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
			}

			const valueBlock = this.getInput('VALUE').connection.targetBlock();
			if (valueBlock && valueBlock.type === 'math_number' && valueBlock.isShadow()) {
				const numField = valueBlock.getField('NUM');
				const currentValue = numField.getValue();
				if (currentValue < range.min) {
					numField.setValue(range.min);
				}
				if (currentValue > range.max) {
					numField.setValue(range.max);
				}
			}
			this.setTooltip(`寫入類比值(${range.min}-${range.max})到指定的腳位`);
			this.render();
		}

		if (e.type === Blockly.Events.BLOCK_MOVE) {
			const valueInput = this.getInput('VALUE');
			if (valueInput && valueInput.connection && !valueInput.connection.targetConnection) {
				const range = window.getAnalogOutputRange();
				if (!valueInput.connection.shadowDom_) {
					valueInput.setShadowDom(
						Blockly.utils.xml.textToDom(`<shadow type="math_number"><field name="NUM">${range.defaultValue}</field></shadow>`)
					);
				}
			}
		}
	},
};

Blockly.Blocks['arduino_analog_read'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_ANALOG_READ'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getAnalogPinOptions();
				}),
				'PIN'
			);
		this.setOutput(true, 'Number');
		this.setColour('#00979C');
		this.setTooltip('從指定的腳位讀取類比值');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}
	},
};

Blockly.Blocks['arduino_delay'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_DELAY'))
			.appendField(new Blockly.FieldNumber(1000, 0), 'TIME')
			.appendField(window.languageManager.getMessage('ARDUINO_DELAY_MS'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip('暫停程式執行指定的毫秒數');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_level'] = {
	init: function () {
		this.appendDummyInput().appendField(
			new Blockly.FieldDropdown([
				['HIGH', 'HIGH'],
				['LOW', 'LOW'],
			]),
			'LEVEL'
		);
		this.setOutput(true, ['Boolean', 'Number']);
		this.setColour('#00979C');
		this.setTooltip('Arduino 的 HIGH (1) 或 LOW (0) 常數');
		this.setHelpUrl('https://www.arduino.cc/reference/en/language/variables/constants/constants/');
	},
};

Blockly.Blocks['arduino_pullup'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_PULLUP'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getPullupPinOptions();
				}),
				'PIN'
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(window.languageManager.getMessage('ARDUINO_PULLUP'));
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}
	},
};

Blockly.Blocks['controls_duration'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('DURATION_REPEAT'));
		this.appendValueInput('DURATION')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('DURATION_TIME'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">1000</field></shadow>'));
		this.appendDummyInput().appendField(window.languageManager.getMessage('DURATION_MS'));
		this.appendStatementInput('DO').setCheck(null).appendField(window.languageManager.getMessage('DURATION_DO'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#A1887F');
		this.setTooltip('在指定的時間內重複執行程式');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['text_print'] = {
	init: function () {
		this.appendValueInput('TEXT').setCheck(null).appendField(window.languageManager.getMessage('TEXT_PRINT_SHOW'));
		this.appendDummyInput()
			.appendField(new Blockly.FieldCheckbox('TRUE'), 'NEW_LINE')
			.appendField(window.languageManager.getMessage('TEXT_PRINT_NEWLINE'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#FB8C00');
		this.setTooltip('在序列埠監控視窗顯示文字');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_pin_mode'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIN_MODE_SET'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			)
			.appendField(window.languageManager.getMessage('ARDUINO_MODE'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('ARDUINO_MODE_INPUT'), 'INPUT'],
					[window.languageManager.getMessage('ARDUINO_MODE_OUTPUT'), 'OUTPUT'],
				]),
				'MODE'
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip('設定指定腳位的運作模式（輸入/輸出）');
		this.setHelpUrl('');
	},

	onchange: function () {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}
	},
};
