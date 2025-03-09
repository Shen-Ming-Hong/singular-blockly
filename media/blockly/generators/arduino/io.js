/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// 建立一個全局物件來追蹤腳位模式的歷史記錄
window.arduinoGenerator.pinModes_ = {};

// 標準化腳位名稱的輔助函數 (將 'A0', 'A1', 'D0', 'D1' 等轉換為內部一致的格式)
window.arduinoGenerator.normalizePin = function (pin) {
	// 先將 pin 轉為字串以確保一致性
	let pinStr = String(pin);

	// 處理腳位名稱格式，例如將 'D3' 中的數字部分提取出來
	if (pinStr.startsWith('D')) {
		return pinStr.substring(1); // 移除 'D' 前綴，保留數字部分
	}

	// 類比腳位保持原樣 (例如 "A0" 保持為 "A0")
	return pinStr;
};

// 新增檢查腳位模式的輔助函數
window.arduinoGenerator.checkPinMode = function (pin, requiredMode) {
	// 標準化腳位名稱，確保一致性比較
	const normalizedPin = window.arduinoGenerator.normalizePin(pin);

	// 檢查腳位歷史模式
	const currentMode = window.arduinoGenerator.pinModes_[normalizedPin];

	// 如果已有模式且不同於所需模式，新增警告但允許使用
	if (currentMode && currentMode !== requiredMode) {
		// 只在腳位模式衝突時才添加警告
		window.arduinoGenerator.warnings_.push(
			`提示：腳位 ${pin} 已被設為 ${currentMode} 模式，現在正被用作 ${requiredMode} 模式。若在同一程式流程中，可能需要重新設定腳位模式。`
		);

		// 更新腳位模式為當前要求的模式
		window.arduinoGenerator.pinModes_[normalizedPin] = requiredMode;

		// 添加腳位模式切換程式碼 (這裡選擇不自動添加模式切換，僅提供警告)
		// window.arduinoGenerator.setupCode_.push(`pinMode(${pin}, ${requiredMode}); // 自動切換腳位模式`);
		return false; // 返回 false 表示有衝突
	} else if (!currentMode) {
		// 如果之前沒設定過模式，則記錄並自動加入設定
		window.arduinoGenerator.setupCode_.push(`pinMode(${pin}, ${requiredMode}); // 自動設定腳位模式`);
		window.arduinoGenerator.pinModes_[normalizedPin] = requiredMode;
	}

	return true; // 返回 true 表示沒有衝突
};

window.arduinoGenerator.forBlock['arduino_digital_write'] = function (block) {
	try {
		const pin = block.getFieldValue('PIN');
		let value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ATOMIC) || 'LOW';

		// 檢查腳位模式 - 寫入需要 OUTPUT 模式
		window.arduinoGenerator.checkPinMode(pin, 'OUTPUT');

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
		// 檢查腳位模式 - 讀取需要 INPUT 模式
		window.arduinoGenerator.checkPinMode(pin, 'INPUT');

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

		// 檢查腳位模式 - 類比寫入需要 OUTPUT 模式
		window.arduinoGenerator.checkPinMode(pin, 'OUTPUT');

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
		// 檢查腳位模式 - 類比讀取需要 INPUT 模式
		window.arduinoGenerator.checkPinMode(pin, 'INPUT');

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
		// 記錄腳位模式
		window.arduinoGenerator.pinModes_[pin] = 'INPUT_PULLUP';
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
		// 記錄腳位模式
		window.arduinoGenerator.pinModes_[pin] = mode;
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
    // 記錄這些腳位是 OUTPUT 模式
    // 無法直接獲取腳位編號，七段顯示器會使用 digitalWrite
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
    // 預設腳位不可直接透過索引獲取，因此不記錄特定狀態
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

window.arduinoGenerator.forBlock['threshold_function_setup'] = function (block) {
	const name = block.getFieldValue('NAME');
	const pin = block.getFieldValue('PIN');
	const threshold = window.arduinoGenerator.valueToCode(block, 'THRESHOLD', window.arduinoGenerator.ORDER_ATOMIC) || '450';
	const highValue = window.arduinoGenerator.valueToCode(block, 'HIGH_VALUE', window.arduinoGenerator.ORDER_ATOMIC) || '1';
	const lowValue = window.arduinoGenerator.valueToCode(block, 'LOW_VALUE', window.arduinoGenerator.ORDER_ATOMIC) || '0';

	// 檢查腳位模式 - 類比讀取需要 INPUT 模式
	window.arduinoGenerator.checkPinMode(pin, 'INPUT');

	// 根據高/低輸出值判斷返回類型
	let returnType = 'int'; // 預設為 int

	// 檢查高值和低值是否有引號（字串）
	if ((highValue.startsWith('"') && highValue.endsWith('"')) || (lowValue.startsWith('"') && lowValue.endsWith('"'))) {
		returnType = 'String';
	}
	// 檢查是否包含小數點（浮點數）
	else if (highValue.includes('.') || lowValue.includes('.')) {
		returnType = 'float';
	}
	// 檢查是否為布林值
	else if ((highValue === 'true' || highValue === 'false') && (lowValue === 'true' || lowValue === 'false')) {
		returnType = 'boolean';
	}

	// Generate the threshold function with proper return type
	window.arduinoGenerator.functions_[`${name}_read`] = `
${returnType} ${name}_read() {
    int sensorValue = analogRead(${pin});
    return (sensorValue > ${threshold}) ? ${highValue} : ${lowValue};
}`;

	return ''; // Setup block doesn't generate inline code
};

window.arduinoGenerator.forBlock['threshold_function_read'] = function (block) {
	const func = block.getFieldValue('FUNC');
	const code = `${func}_read()`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};
