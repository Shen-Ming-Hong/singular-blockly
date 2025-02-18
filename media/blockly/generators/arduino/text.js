/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['text'] = function (block) {
	const text = block.getFieldValue('TEXT');
	return [`"${text}"`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_join'] = function (block) {
	const items = new Array(block.itemCount_);
	for (let i = 0; i < block.itemCount_; i++) {
		items[i] = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '""';
	}
	const code = 'String(' + items.join(' + ') + ')';
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

// 重新定義 text_print block
window.arduinoGenerator.forBlock['text_print'] = function (block) {
	// 確保包含必要的標頭檔
	window.arduinoGenerator.includes_['arduino'] = '#include <Arduino.h>';

	// 在 setup 中初始化 Serial，確保只添加一次
	if (!window.arduinoGenerator.setupCode_) {
		window.arduinoGenerator.setupCode_ = [];
	}
	if (!window.arduinoGenerator.setupCode_.includes('Serial.begin(9600);')) {
		window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');
	}

	// 獲取要打印的文字
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// 檢查是否勾選換行
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// 根據換行選項使用不同的輸出函數
	return `Serial.${newLine ? 'println' : 'print'}(${msg});\n`;
};

window.arduinoGenerator.forBlock['text_length'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';
	return [text + '.length()', window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_isEmpty'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';
	return [text + '.length() == 0', window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_append'] = function (block) {
	const varName = block.getFieldValue('VAR');
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	if (!window.arduinoGenerator.variables_[varName]) {
		window.arduinoGenerator.variables_[varName] = `String ${varName};`;
	}
	return `${varName} += ${text};\n`;
};

window.arduinoGenerator.forBlock['text_indexOf'] = function (block) {
	const operator = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
	const substring = window.arduinoGenerator.valueToCode(block, 'FIND', window.arduinoGenerator.ORDER_NONE) || '""';
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';

	// 直接使用運算，不需要額外變數宣告
	// indexOf 返回 -1 時表示沒找到，此時應該返回 0（Blockly 約定）
	// 找到時需要 +1 因為 Blockly 使用 1-based 索引
	return [`(${text}.${operator}(${substring}) + 1)`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_charAt'] = function (block) {
	const where = block.getFieldValue('WHERE') || 'FROM_START';
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';
	let at;

	switch (where) {
		case 'FROM_START':
			at = window.arduinoGenerator.valueToCode(block, 'AT', window.arduinoGenerator.ORDER_NONE) || '0';
			// 將 1-based 索引轉換為 0-based
			return [`${text}.charAt(${at} - 1)`, window.arduinoGenerator.ORDER_ATOMIC];
		case 'FROM_END':
			at = window.arduinoGenerator.valueToCode(block, 'AT', window.arduinoGenerator.ORDER_NONE) || '0';
			return [`${text}.charAt(${text}.length() - ${at})`, window.arduinoGenerator.ORDER_ATOMIC];
		case 'FIRST':
			return [`${text}.charAt(0)`, window.arduinoGenerator.ORDER_ATOMIC];
		case 'LAST':
			return [`${text}.charAt(${text}.length() - 1)`, window.arduinoGenerator.ORDER_ATOMIC];
		case 'RANDOM':
			return [`${text}.charAt(random(${text}.length()))`, window.arduinoGenerator.ORDER_ATOMIC];
		default:
			return [`${text}.charAt(0)`, window.arduinoGenerator.ORDER_ATOMIC];
	}
};

window.arduinoGenerator.forBlock['text_getSubstring'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'STRING', window.arduinoGenerator.ORDER_NONE) || '""';
	const where1 = block.getFieldValue('WHERE1');
	const where2 = block.getFieldValue('WHERE2');

	let at1, at2;

	// 處理起始位置
	switch (where1) {
		case 'FROM_START':
			at1 = window.arduinoGenerator.valueToCode(block, 'AT1', window.arduinoGenerator.ORDER_NONE) || '1';
			at1 = `(${at1} - 1)`; // 轉換為 0-based 索引
			break;
		case 'FROM_END':
			at1 = window.arduinoGenerator.valueToCode(block, 'AT1', window.arduinoGenerator.ORDER_NONE) || '1';
			at1 = `(${text}.length() - ${at1})`;
			break;
		case 'FIRST':
			at1 = '0';
			break;
		default:
			at1 = '0';
	}

	// 處理結束位置
	switch (where2) {
		case 'FROM_START':
			at2 = window.arduinoGenerator.valueToCode(block, 'AT2', window.arduinoGenerator.ORDER_NONE) || '1';
			at2 = `(${at2})`; // 保持 inclusive end
			break;
		case 'FROM_END':
			at2 = window.arduinoGenerator.valueToCode(block, 'AT2', window.arduinoGenerator.ORDER_NONE) || '1';
			at2 = `(${text}.length() - ${at2} + 1)`;
			break;
		case 'LAST':
			at2 = `${text}.length()`;
			break;
		default:
			at2 = `${text}.length()`;
	}

	return [`${text}.substring(${at1}, ${at2})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_count'] = function (block) {
	const sub = window.arduinoGenerator.valueToCode(block, 'SUB', window.arduinoGenerator.ORDER_NONE) || '""';
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// 優化計數函數的實作
	window.arduinoGenerator.functions_['countSubstring'] = `
int countSubstring(String text, String sub) {
    if (sub.length() == 0) return 0;
    int count = 0;
    int pos = 0;
    while ((pos = text.indexOf(sub, pos)) != -1) {
        count++;
        pos += 1; // 只移動一個位置，確保重疊的情況也能計數
    }
    return count;
}`;

	return [`countSubstring(${text}, ${sub})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_reverse'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// 優化字串反轉函數
	window.arduinoGenerator.functions_['reverseString'] = `
String reverseString(String str) {
    int length = str.length();
    String reversed;
    reversed.reserve(length); // 預先分配空間以提高效能
    for (int i = length - 1; i >= 0; i--) {
        reversed += str[i];
    }
    return reversed;
}`;

	return [`reverseString(${text})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_prompt_ext'] = function (block) {
	const type = block.getFieldValue('TYPE');
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// 確保包含必要的標頭檔
	window.arduinoGenerator.includes_['arduino'] = '#include <Arduino.h>';

	// 在 setup 中初始化 Serial，確保只添加一次
	if (!window.arduinoGenerator.setupCode_) {
		window.arduinoGenerator.setupCode_ = [];
	}
	if (!window.arduinoGenerator.setupCode_.includes('Serial.begin(9600);')) {
		window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');
	}

	// 改進的 serialPrompt 函數，增加錯誤處理和超時機制
	window.arduinoGenerator.functions_['serialPrompt'] = `
String serialPrompt(String msg) {
    Serial.println(msg);
    String input = "";
    unsigned long startTime = millis();
    while (true) {
        if (Serial.available()) {
            char c = Serial.read();
            if (c == '\\n' || c == '\\r') {
                if (input.length() > 0) break;
            } else {
                input += c;
            }
        }
        // 10秒超時保護
        if (millis() - startTime > 10000) {
            Serial.println("Timeout!");
            return "";
        }
        delay(10);
    }
    return input;
}`;

	if (type === 'NUMBER') {
		return [`serialPrompt(${msg}).toInt()`, window.arduinoGenerator.ORDER_ATOMIC];
	}
	return [`serialPrompt(${msg})`, window.arduinoGenerator.ORDER_ATOMIC];
};
