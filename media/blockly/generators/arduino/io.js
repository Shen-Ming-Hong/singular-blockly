window.arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		let value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || 'LOW';

		// 處理文字值，移除引號
		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.slice(1, -1);
		}

		// 處理不同型態的輸入值
		if (value === 'true' || value === '1' || value === 'HIGH') {
			value = 'HIGH';
		} else if (value === 'false' || value === '0' || value === 'LOW') {
			value = 'LOW';
		} else if (!isNaN(Number(value))) {
			value = Number(value) ? 'HIGH' : 'LOW';
		}

		return `digitalWrite(${pin}, ${value});\n`;
	} catch (e) {
		console.log('Digital write block code generation error:', e);
		return ''; // 發生錯誤時返回空字串，允許其他積木繼續生成
	}
};

window.arduinoGenerator.forBlock['arduino_digital_read'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		return [`digitalRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (e) {
		console.log('Digital read block code generation error:', e);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC]; // 發生錯誤時返回安全的默認值
	}
};

window.arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		const currentBoard = window.getCurrentBoard();
		let value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || '0';

		// 根據當前開發板獲取範圍
		const range = window.getAnalogOutputRange();

		// 確保數值在開發板支援的範圍內
		if (!isNaN(Number(value))) {
			value = `constrain(${value}, ${range.min}, ${range.max})`;
		}

		// ESP32 需要特殊處理
		if (currentBoard === 'esp32') {
			let channel = window.getPWMChannel(pin);
			if (channel === null) {
				channel = 8 + (parseInt(pin) % 8);
			}

			window.arduinoGenerator.setupCode_.push(`ledcSetup(${channel}, 5000, 12);  // 通道${channel}, 5KHz PWM, 12位分辨率`);
			window.arduinoGenerator.setupCode_.push(`ledcAttachPin(${pin}, ${channel});  // 將通道${channel}附加到指定的腳位`);
			window.arduinoGenerator.includes_['esp32_ledc'] = '#include <esp32-hal-ledc.h>';

			return `ledcWrite(${channel}, ${value});\n`;
		}

		return `analogWrite(${pin}, ${value});\n`;
	} catch (e) {
		console.log('Analog write block code generation error:', e);
		return ''; // 發生錯誤時返回空字串，允許其他積木繼續生成
	}
};

window.arduinoGenerator.forBlock['arduino_analog_read'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		return [`analogRead(${pin})`, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (e) {
		console.log('Analog read block code generation error:', e);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC]; // 發生錯誤時返回安全的默認值
	}
};

window.arduinoGenerator.forBlock['arduino_delay'] = function (block) {
	try {
		const time = block.getFieldValue('TIME');
		return `delay(${time});\n`;
	} catch (e) {
		console.log('Delay block code generation error:', e);
		return ''; // 發生錯誤時返回空字串，允許其他積木繼續生成
	}
};
