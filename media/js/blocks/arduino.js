Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		this.appendDummyInput().appendField('Arduino 程式');
		this.appendStatementInput('SETUP').setCheck(null).appendField('初始化');
		this.appendStatementInput('LOOP').setCheck(null).appendField('重複執行');
		this.setColour(230);
		this.setDeletable(false);
		this.setTooltip('Arduino 程式的基本結構');
		this.setHelpUrl('');
	},
};

// Arduino 積木生成器
window.arduinoGenerator.forBlock['arduino_setup_loop'] = function (block) {
	let setupCode = window.arduinoGenerator.statementToCode(block, 'SETUP') || '';
	let loopCode = window.arduinoGenerator.statementToCode(block, 'LOOP') || '';

	// 更新 setup 和 loop 定義
	window.arduinoGenerator.definitions_['setup'] = 'void setup() {\n' + setupCode + '}\n\n';
	window.arduinoGenerator.definitions_['loop'] = 'void loop() {\n' + loopCode + '}\n';

	// 返回空字串因為程式碼會在 finish() 中組合
	return '';
};

// Digital Write Block
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

// Digital Read Block
Blockly.Blocks['arduino_digital_read'] = {
	init: function () {
		this.appendValueInput('PIN').setCheck('Number').appendField('數位讀取 腳位');
		this.setOutput(true, 'Boolean');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取數位輸入值');
		this.setHelpUrl('');
	},
};

// Analog Write Block
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

// Analog Read Block
Blockly.Blocks['arduino_analog_read'] = {
	init: function () {
		this.appendValueInput('PIN').setCheck('Number').appendField('類比讀取 腳位');
		this.setOutput(true, 'Number');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取類比值(0-1023)');
		this.setHelpUrl('');
	},
};

// Delay Block
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

// Arduino Generator Definitions
window.arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '13';
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || 'HIGH';
	return `digitalWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '2';
	return [`digitalRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '3';
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || '0';
	return `analogWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC) || '0';
	return [`analogRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_delay'] = function (block) {
	const delay = window.arduinoGenerator.valueToCode(block, 'DELAY', window.arduinoGenerator.ORDER_ATOMIC) || '1000';
	return `delay(${delay});\n`;
};
