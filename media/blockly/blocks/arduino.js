Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		this.appendStatementInput('SETUP').setCheck(null).appendField('初始化');
		this.appendStatementInput('LOOP').setCheck(null).appendField('重複執行');
		this.setColour(230);
		this.setTooltip('Arduino 程式的基本結構');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_write'] = {
	init: function () {
		// 保存當前開發板狀態，用於後續檢測變化
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField('數位寫入')
			.appendField('腳位')
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);

		this.appendValueInput('VALUE')
			.setCheck(['Boolean', 'Number', 'String'])
			.appendField('數值')
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="text"><field name="TEXT">LOW</field></shadow>'));

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入數位輸出值到指定的腳位，可以是布林值、數字或變數');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		// 在移動過程中保持連接的有效性
		if (e.type === Blockly.Events.BLOCK_MOVE) {
			const valueInput = this.getInput('VALUE');
			if (valueInput && valueInput.connection && !valueInput.connection.targetConnection) {
				// 如果輸入沒有連接，確保 shadow block 存在
				if (!valueInput.connection.shadowDom_) {
					valueInput.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="text"><field name="TEXT">LOW</field></shadow>'));
				}
			}
		}
	},
};

Blockly.Blocks['arduino_digital_read'] = {
	init: function () {
		this.appendDummyInput().appendField('數位讀取').appendField('腳位');
		this.appendValueInput('PIN').setCheck('Number');
		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取數位輸入值');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_analog_write'] = {
	init: function () {
		// 保存當前開發板狀態，用於後續檢測變化
		this.lastKnownBoard_ = window.currentBoard;
		const range = window.getAnalogOutputRange();

		this.appendDummyInput()
			.appendField('類比寫入')
			.appendField('腳位')
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);

		this.appendValueInput('VALUE')
			.setCheck(['Number', 'String'])
			.appendField('數值')
			.setShadowDom(
				Blockly.utils.xml.textToDom(`<shadow type="math_number"><field name="NUM">${range.defaultValue}</field></shadow>`)
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip(`寫入類比值(${range.min}-${range.max})到指定的腳位`);
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const range = window.getAnalogOutputRange();
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
		}

		// 在移動過程中保持連接的有效性
		if (e.type === Blockly.Events.BLOCK_MOVE) {
			const valueInput = this.getInput('VALUE');
			if (valueInput && valueInput.connection && !valueInput.connection.targetConnection) {
				// 如果輸入沒有連接，確保 shadow block 存在
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
		this.appendDummyInput().appendField('類比讀取').appendField('腳位');
		this.appendValueInput('PIN').setCheck('Number');
		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取類比值(0-1023)');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_delay'] = {
	init: function () {
		this.appendDummyInput().appendField('等待').appendField(new Blockly.FieldNumber(1000, 0), 'TIME').appendField('毫秒');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('暫停程式執行指定的毫秒數');
		this.setHelpUrl('');
	},
};
