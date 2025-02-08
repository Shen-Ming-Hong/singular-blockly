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
		this.appendDummyInput().appendField('數位寫入').appendField('腳位');
		this.appendValueInput('PIN').setCheck('Number');
		this.appendDummyInput().appendField('數值');
		this.appendValueInput('VALUE').setCheck('Boolean');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入數位輸出值到指定的腳位');
		this.setHelpUrl('');
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
		this.appendDummyInput().appendField('類比寫入').appendField('腳位');
		this.appendValueInput('PIN').setCheck('Number');
		this.appendDummyInput().appendField('數值');
		this.appendValueInput('VALUE').setCheck('Number');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入類比值(0-255)到指定的腳位');
		this.setHelpUrl('');
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
