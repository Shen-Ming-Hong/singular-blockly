window.arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC);
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC);
	return `digitalWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC);
	return [`digitalRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC);
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC);
	return `analogWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
	const pin = window.arduinoGenerator.valueToCode(block, 'PIN', window.arduinoGenerator.ORDER_ATOMIC);
	return [`analogRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_delay'] = function (block) {
	const time = block.getFieldValue('TIME');
	return `delay(${time});\n`;
};
