/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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

window.arduinoGenerator.forBlock['arduino_level'] = function (block) {
	const level = block.getFieldValue('LEVEL');
	return [level, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['arduino_pullup'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		// 添加到 setup 區塊的程式碼
		window.arduinoGenerator.setupCode_.push(`pinMode(${pin}, INPUT_PULLUP);`);
		return '';
	} catch (e) {
		console.log('Pullup block code generation error:', e);
		return ''; // 發生錯誤時返回空字串
	}
};

window.arduinoGenerator.forBlock['arduino_pin_mode'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		const mode = block.getFieldValue('MODE');
		// 添加到 setup 區塊的程式碼
		window.arduinoGenerator.setupCode_.push(`pinMode(${pin}, ${mode});`);
		return '';
	} catch (e) {
		console.log('Pin mode block code generation error:', e);
		return ''; // 發生錯誤時返回空字串
	}
};

window.arduinoGenerator.forBlock['seven_segment_pins'] = function (block) {
	try {
		const segments = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'];
		const pinValues = segments.map(segment => block.getFieldValue('PIN_' + segment));

		// 定義七段顯示器腳位陣列
		window.arduinoGenerator.variables_['seven_segment_pins'] = `
// 七段顯示器的引腳連接 (A, B, C, D, E, F, G, DP)
byte sevenSegmentPins[] = {${pinValues.join(', ')}};
        `;

		// 將設置引腳模式的程式碼添加到 setup 區塊
		window.arduinoGenerator.setupCode_.push(`
  // 設置七段顯示器引腳為輸出模式
  for (int i = 0; i < 8; i++) {
    pinMode(sevenSegmentPins[i], OUTPUT);
  }
        `);

		return '// 七段顯示器引腳已設定\n';
	} catch (e) {
		console.log('Seven segment pins block code generation error:', e);
		return ''; // 發生錯誤時返回空字串
	}
};

window.arduinoGenerator.forBlock['seven_segment_display'] = function (block) {
	try {
		const type = block.getFieldValue('TYPE');
		const number = window.arduinoGenerator.valueToCode(block, 'NUMBER', window.arduinoGenerator.ORDER_NONE) || '0';
		const decimalPoint = block.getFieldValue('DECIMAL_POINT') === 'TRUE';

		// 七段顯示器碼位定義 (0-9)
		window.arduinoGenerator.definitions_['seven_segment_digits'] = `
// 七段顯示器碼位定義 (0-9)
const byte SEVEN_SEGMENT_DIGITS[] = {
  0b00111111, // 0
  0b00000110, // 1
  0b01011011, // 2
  0b01001111, // 3
  0b01100110, // 4
  0b01101101, // 5
  0b01111101, // 6
  0b00000111, // 7
  0b01111111, // 8
  0b01101111  // 9
};
        `;

		// 添加七段顯示器函數
		window.arduinoGenerator.functions_['display_seven_segment'] = `
void displaySevenSegment(byte pins[], byte value, bool isCommonAnode, bool decimalPoint) {
  if (value > 9) value = 9;
  
  byte segmentValue = SEVEN_SEGMENT_DIGITS[value];
  if (decimalPoint) {
    segmentValue |= 0b10000000; // 添加小數點
  }
  
  for (int i = 0; i < 8; i++) {
    bool segmentState = bitRead(segmentValue, i);
    if (isCommonAnode) {
      segmentState = !segmentState; // 如果是共陽極，反轉信號
    }
    digitalWrite(pins[i], segmentState);
  }
}
        `;

		// 檢查是否已定義 sevenSegmentPins 數組
		if (!window.arduinoGenerator.variables_['seven_segment_pins']) {
			window.arduinoGenerator.variables_['seven_segment_pins'] = `
// 七段顯示器的引腳連接 (A, B, C, D, E, F, G, DP)
byte sevenSegmentPins[] = {2, 3, 4, 5, 6, 7, 8, 9}; // 預設引腳連接
            `;

			// 添加設置引腳模式的程式碼
			window.arduinoGenerator.setupCode_.push(`
  // 設置七段顯示器引腳為輸出模式
  for (int i = 0; i < 8; i++) {
    pinMode(sevenSegmentPins[i], OUTPUT);
  }
            `);
		}

		const isCommonAnode = type === 'COMMON_ANODE' ? 'true' : 'false';
		return `displaySevenSegment(sevenSegmentPins, constrain(${number}, 0, 9), ${isCommonAnode}, ${decimalPoint});\n`;
	} catch (e) {
		console.log('Seven segment display block code generation error:', e);
		return ''; // 發生錯誤時返回空字串
	}
};
