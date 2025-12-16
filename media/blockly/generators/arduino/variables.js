/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// 在 ORDER_NONE 定義後面加入變數相關的生成器
window.arduinoGenerator.forBlock['variables_get'] = function (block) {
	const varName = block.getField('VAR').getText();
	// 不在這裡處理變數宣告,讓各模組自行決定變數類型
	return [varName, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['variables_set'] = function (block) {
	const varName = block.getField('VAR').getText();
	const value = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_ASSIGNMENT) || '0';

	// 檢查連接的值積木類型
	const valueBlock = block.getInputTargetBlock('VALUE');
	let varType = 'int'; // 預設類型

	if (valueBlock) {
		// 根據連接的積木類型決定變數型態，符合 Arduino 標準
		switch (valueBlock.type) {
			case 'text':
			case 'text_join':
				varType = 'String';
				break;
			case 'math_number':
				// 將數值轉換為字串後再檢查是否包含小數點
				const num = valueBlock.getFieldValue('NUM').toString();
				if (num.includes('.')) {
					varType = 'float';
				} else {
					// 檢查數值範圍決定整數型態
					const numValue = parseInt(num);
					if (numValue >= -128 && numValue <= 127) {
						varType = 'int8_t';
					} else if (numValue >= -32768 && numValue <= 32767) {
						varType = 'int16_t';
					} else {
						varType = 'long';
					}
				}
				break;
			case 'logic_boolean':
				varType = 'boolean';
				break;
			case 'lists_create_with':
				varType = 'int[]';
				break;
			case 'arduino_analog_read':
				varType = 'uint16_t'; // analog read 回傳 0-1023
				break;
			case 'arduino_digital_read':
				varType = 'boolean';
				break;
			case 'text_char':
				varType = 'char';
				break;
			case 'math_unsigned_number':
				varType = 'unsigned long';
				break;
			default:
				varType = 'int';
				break;
		}
	}

	// 如果是第一次使用此變數，加入變數宣告
	if (!window.arduinoGenerator.variables_[varName]) {
		window.arduinoGenerator.variables_[varName] = `${varType} ${varName};`;
	}

	return `${varName} = ${value};\n`;
};
