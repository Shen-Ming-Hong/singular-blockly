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

window.arduinoGenerator.forBlock['text_print'] = function (block) {
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	window.arduinoGenerator.definitions_['include_serial'] = '#include <Arduino.h>';
	window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');
	return `Serial.println(${msg});\n`;
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
	const varName = window.arduinoGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE');
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	return `${varName} += ${text};\n`;
};

window.arduinoGenerator.forBlock['text_indexOf'] = function (block) {
	const operator = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
	const substring = window.arduinoGenerator.valueToCode(block, 'FIND', window.arduinoGenerator.ORDER_NONE) || '""';
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';
	return [`${text}.${operator}(${substring}) + 1`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_charAt'] = function (block) {
	const where = block.getFieldValue('WHERE') || 'FROM_START';
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';
	let at;
	if (where === 'RANDOM') {
		at = `random(${text}.length())`;
	} else {
		at = window.arduinoGenerator.valueToCode(block, 'AT', window.arduinoGenerator.ORDER_NONE) || '0';
	}
	return [`${text}.charAt(${at})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_getSubstring'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'STRING', window.arduinoGenerator.ORDER_NONE) || '""';
	const where1 = block.getFieldValue('WHERE1');
	const where2 = block.getFieldValue('WHERE2');
	let at1 = window.arduinoGenerator.valueToCode(block, 'AT1', window.arduinoGenerator.ORDER_NONE) || '0';
	let at2 = window.arduinoGenerator.valueToCode(block, 'AT2', window.arduinoGenerator.ORDER_NONE) || '0';

	return [`${text}.substring(${at1}, ${at2})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_changeCase'] = function (block) {
	const operator = block.getFieldValue('CASE');
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	let code;
	if (operator === 'UPPERCASE') {
		code = `${text}.toUpperCase()`;
	} else if (operator === 'LOWERCASE') {
		code = `${text}.toLowerCase()`;
	} else {
		return ['""', window.arduinoGenerator.ORDER_ATOMIC];
	}
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_trim'] = function (block) {
	const mode = block.getFieldValue('MODE');
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	return [`${text}.trim()`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_count'] = function (block) {
	const sub = window.arduinoGenerator.valueToCode(block, 'SUB', window.arduinoGenerator.ORDER_NONE) || '""';
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// Arduino String 沒有內建的 count 方法，需要自己實作
	window.arduinoGenerator.definitions_['text_count'] = `
int countSubstring(String text, String sub) {
  int count = 0;
  int idx = 0;
  while ((idx = text.indexOf(sub, idx)) != -1) {
    count++;
    idx += sub.length();
  }
  return count;
}`;

	return [`countSubstring(${text}, ${sub})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_replace'] = function (block) {
	const from = window.arduinoGenerator.valueToCode(block, 'FROM', window.arduinoGenerator.ORDER_NONE) || '""';
	const to = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_NONE) || '""';
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	return [`${text}.replace(${from}, ${to})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_reverse'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// Arduino String 沒有內建的 reverse 方法，需要自己實作
	window.arduinoGenerator.definitions_['text_reverse'] = `
String reverseString(String str) {
  String result = "";
  for (int i = str.length() - 1; i >= 0; i--) {
    result += str.charAt(i);
  }
  return result;
}`;

	return [`reverseString(${text})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_prompt_ext'] = function (block) {
	const type = block.getFieldValue('TYPE');
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	window.arduinoGenerator.definitions_['include_serial'] = '#include <Arduino.h>';
	window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');

	// 實作簡單的序列埠輸入
	window.arduinoGenerator.definitions_['text_prompt'] = `
String serialPrompt(String msg) {
  Serial.println(msg);
  while (!Serial.available()) {
    delay(10);
  }
  return Serial.readStringUntil('\\n');
}`;

	if (type === 'NUMBER') {
		return [`serialPrompt(${msg}).toInt()`, window.arduinoGenerator.ORDER_ATOMIC];
	}
	return [`serialPrompt(${msg})`, window.arduinoGenerator.ORDER_ATOMIC];
};
