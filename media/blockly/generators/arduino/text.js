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

	// 在 setup 中初始化 Serial
	window.arduinoGenerator.setupCode_ = window.arduinoGenerator.setupCode_ || [];
	window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');

	// 獲取要打印的文字
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// 生成 Arduino 程式碼
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
	// 直接使用積木上的變數名稱
	const varName = block.getField('VAR').getText();
	window.arduinoGenerator.variables_[varName] = `String ${varName} = "";`;
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';
	return `${varName} += ${text};\n`;
};

window.arduinoGenerator.forBlock['text_indexOf'] = function (block) {
	const operator = block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
	const substring = window.arduinoGenerator.valueToCode(block, 'FIND', window.arduinoGenerator.ORDER_NONE) || '""';
	const varName = block.getInputTargetBlock('VALUE').getField('VAR').getText();
	// 加入 String 型態宣告
	window.arduinoGenerator.variables_[varName] = `String ${varName} = "";`;
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';

	return [`${text}.${operator}(${substring}) + 1`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_charAt'] = function (block) {
	const where = block.getFieldValue('WHERE') || 'FROM_START';
	const varName = block.getInputTargetBlock('VALUE').getField('VAR').getText();
	// 加入 String 型態宣告
	window.arduinoGenerator.variables_[varName] = `String ${varName} = "";`;
	const text = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '""';
	let at;

	// 處理變數輸入
	if (where === 'RANDOM') {
		at = `random(${text}.length())`;
	} else {
		at = window.arduinoGenerator.valueToCode(block, 'AT', window.arduinoGenerator.ORDER_NONE) || '0';
	}
	return [`${text}.charAt(${at})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_getSubstring'] = function (block) {
	const varName = block.getInputTargetBlock('STRING').getField('VAR').getText();
	// 加入 String 型態宣告
	window.arduinoGenerator.variables_[varName] = `String ${varName} = "";`;
	// 確保處理變數輸入
	const text = window.arduinoGenerator.valueToCode(block, 'STRING', window.arduinoGenerator.ORDER_NONE) || '""';
	const where1 = block.getFieldValue('WHERE1');
	const where2 = block.getFieldValue('WHERE2');
	let at1 = window.arduinoGenerator.valueToCode(block, 'AT1', window.arduinoGenerator.ORDER_NONE) || '0';
	let at2 = window.arduinoGenerator.valueToCode(block, 'AT2', window.arduinoGenerator.ORDER_NONE) || '0';

	return [`${text}.substring(${at1}, ${at2})`, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['text_count'] = function (block) {
	const sub = window.arduinoGenerator.valueToCode(block, 'SUB', window.arduinoGenerator.ORDER_NONE) || '""';
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	window.arduinoGenerator.functions_['countSubstring'] = `
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

window.arduinoGenerator.forBlock['text_reverse'] = function (block) {
	const text = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	window.arduinoGenerator.functions_['reverseString'] = `
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

	window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');

	window.arduinoGenerator.functions_['serialPrompt'] = `
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
