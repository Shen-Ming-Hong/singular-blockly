window.arduinoGenerator.forBlock['lists_create_with'] = function (block) {
	const elements = new Array(block.itemCount_);
	for (let i = 0; i < block.itemCount_; i++) {
		elements[i] = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '0';
	}
	// 使用 Arduino array
	const code = `(int[]){${elements.join(', ')}}`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['lists_repeat'] = function (block) {
	const item = window.arduinoGenerator.valueToCode(block, 'ITEM', window.arduinoGenerator.ORDER_NONE) || '0';
	const times = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
	// 生成一個重複元素的陣列
	window.arduinoGenerator.definitions_['array_repeat'] = `
int* array_repeat(int value, int times) {
    int* arr = new int[times];
    for(int i = 0; i < times; i++) {
        arr[i] = value;
    }
    return arr;
}`;
	const code = `array_repeat(${item}, ${times})`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['lists_length'] = function (block) {
	const list = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '[]';
	// 使用陣列長度
	window.arduinoGenerator.definitions_['array_length'] = `
int array_length(int* arr) {
    return sizeof(arr)/sizeof(arr[0]);
}`;
	const code = `array_length(${list})`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['lists_isEmpty'] = function (block) {
	const list = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '[]';
	const code = `array_length(${list}) == 0`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['lists_indexOf'] = function (block) {
	const item = window.arduinoGenerator.valueToCode(block, 'FIND', window.arduinoGenerator.ORDER_NONE) || '0';
	const list = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '[]';
	const operator = block.getFieldValue('END') === 'FIRST' ? true : false;

	window.arduinoGenerator.definitions_['array_indexOf'] = `
int array_indexOf(int* arr, int len, int value, bool first) {
    for(int i = first ? 0 : len-1; first ? i < len : i >= 0; first ? i++ : i--) {
        if(arr[i] == value) return i + 1;
    }
    return 0;
}`;

	const code = `array_indexOf(${list}, array_length(${list}), ${item}, ${operator})`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['lists_getIndex'] = function (block) {
	const list = window.arduinoGenerator.valueToCode(block, 'VALUE', window.arduinoGenerator.ORDER_NONE) || '[]';
	const where = block.getFieldValue('WHERE') || 'FROM_START';
	const at = window.arduinoGenerator.valueToCode(block, 'AT', window.arduinoGenerator.ORDER_NONE) || '1';

	const code = `${list}[${at} - 1]`;
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};

window.arduinoGenerator.forBlock['lists_setIndex'] = function (block) {
	const list = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_NONE) || '[]';
	const where = block.getFieldValue('WHERE') || 'FROM_START';
	const at = window.arduinoGenerator.valueToCode(block, 'AT', window.arduinoGenerator.ORDER_NONE) || '1';
	const value = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_NONE) || '0';

	return `${list}[${at} - 1] = ${value};\n`;
};

window.arduinoGenerator.forBlock['lists_sort'] = function (block) {
	const list = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_NONE) || '[]';

	window.arduinoGenerator.definitions_['array_sort'] = `
void array_sort(int* arr, int len) {
    for(int i = 0; i < len-1; i++) {
        for(int j = 0; j < len-i-1; j++) {
            if(arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}`;

	return `array_sort(${list}, array_length(${list}));\n`;
};

window.arduinoGenerator.forBlock['lists_reverse'] = function (block) {
	const list = window.arduinoGenerator.valueToCode(block, 'LIST', window.arduinoGenerator.ORDER_NONE) || '[]';

	window.arduinoGenerator.definitions_['array_reverse'] = `
void array_reverse(int* arr, int len) {
    for(int i = 0; i < len/2; i++) {
        int temp = arr[i];
        arr[i] = arr[len-1-i];
        arr[len-1-i] = temp;
    }
}`;

	return `array_reverse(${list}, array_length(${list}));\n`;
};
