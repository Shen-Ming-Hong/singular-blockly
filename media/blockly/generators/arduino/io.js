window.arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
	const pin = block.getFieldValue('PIN');
	const value = block.getFieldValue('VALUE');
	return `digitalWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
	const pin = block.getFieldValue('PIN');
	return [`digitalRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
	const pin = block.getFieldValue('PIN');
	const value = block.getFieldValue('VALUE');
	return `analogWrite(${pin}, ${value});\n`;
};

window.arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
	const pin = block.getFieldValue('PIN');
	return [`analogRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_delay'] = function (block) {
	const time = block.getFieldValue('TIME');
	return `delay(${time});\n`;
};
