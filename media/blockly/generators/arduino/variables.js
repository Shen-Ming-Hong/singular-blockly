/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 檢查變數是否為函數參數，如果是則返回轉換後的參數名稱
 * @param {string} varName - 原始變數名稱
 * @returns {string} - 轉換後的變數名稱（如果是函數參數）或原始名稱
 */
function getConvertedParamName(varName) {
	// 檢查是否有函數參數對應表
	if (window.arduinoGenerator.functionParamMap) {
		// 遍歷所有函數的參數對應表
		for (const [funcName, paramMap] of window.arduinoGenerator.functionParamMap) {
			if (paramMap.has(varName)) {
				return paramMap.get(varName);
			}
		}
	}
	// 如果不是函數參數，檢查是否需要轉換（包含中文或其他非法字符）
	const containsChinese = /[\u4e00-\u9fa5]/.test(varName);
	const startsWithNumber = /^\d/.test(varName);
	const containsDash = varName.includes('-');

	if (containsChinese || startsWithNumber || containsDash) {
		// 使用與函數名稱相同的轉換邏輯
		return window.arduinoGenerator.convertFunctionName(varName);
	}

	return varName;
}

// 在 ORDER_NONE 定義後面加入變數相關的生成器
window.arduinoGenerator.forBlock['variables_get'] = function (block) {
	const varName = block.getField('VAR').getText();
	// 檢查是否為函數參數，如果是則使用轉換後的名稱
	const convertedName = getConvertedParamName(varName);
	return [convertedName, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['variables_set'] = function (block) {
	const varName = block.getField('VAR').getText();
	// 檢查是否為函數參數，如果是則使用轉換後的名稱
	const convertedName = getConvertedParamName(varName);
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
	// 注意：使用轉換後的名稱作為 key 和變數名稱
	if (!window.arduinoGenerator.variables_[convertedName]) {
		window.arduinoGenerator.variables_[convertedName] = `${varType} ${convertedName};`;
	}

	return `${convertedName} = ${value};\n`;
};
