Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		this.appendStatementInput('SETUP').setCheck(null).appendField('初始化');
		this.appendStatementInput('LOOP').setCheck(null).appendField('重複執行');
		this.setColour(230);
		this.setDeletable(false);
		this.setTooltip('Arduino 程式的基本結構');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_write'] = {
	init: function () {
		this.appendValueInput('PIN').setCheck('Number').appendField('數位寫入 腳位');
		this.appendValueInput('VALUE').setCheck('Boolean').appendField('數值');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入數位輸出值到指定的腳位');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_read'] = {
	init: function () {
		this.appendValueInput('PIN').setCheck('Number').appendField('數位讀取 腳位');
		this.setOutput(true, 'Boolean');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取數位輸入值');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_analog_write'] = {
	init: function () {
		this.appendValueInput('PIN').setCheck('Number').appendField('類比寫入 腳位');
		this.appendValueInput('VALUE').setCheck('Number').appendField('數值');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入類比值(0-255)到指定的腳位');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_analog_read'] = {
	init: function () {
		this.appendValueInput('PIN').setCheck('Number').appendField('類比讀取 腳位');
		this.setOutput(true, 'Number');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取類比值(0-1023)');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_delay'] = {
	init: function () {
		this.appendValueInput('DELAY').setCheck('Number').appendField('等待');
		this.appendDummyInput().appendField('毫秒');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('暫停程式執行指定的毫秒數');
		this.setHelpUrl('');
	},
};
