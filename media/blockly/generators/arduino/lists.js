/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

(function () {
	// Arduino 沒有 STL，清單以自帶長度的 SBList 表示（數值清單，元素為 float）。
	// SBList 為值語意：指定給變數或傳回時會複製內容，UNO 等 AVR 板也能編譯。

	const SB_LIST_WHERE = { FROM_START: 0, FROM_END: 1, FIRST: 2, LAST: 3, RANDOM: 4 };
	const SB_LIST_MATH_OPS = ['SUM', 'MIN', 'MAX', 'AVERAGE', 'MEDIAN', 'MODE', 'STD_DEV', 'RANDOM'];

	const SB_LIST_RUNTIME = `
struct SBList {
  float* items;
  int size;
  SBList() : items(nullptr), size(0) {}
  SBList(const SBList& other) : items(nullptr), size(0) { copyFrom(other); }
  SBList& operator=(const SBList& other) {
    if (this != &other) copyFrom(other);
    return *this;
  }
  ~SBList() { free(items); }
  bool resize(int count) {
    if (count < 0) count = 0;
    if (count == 0) {
      free(items);
      items = nullptr;
      size = 0;
      return true;
    }
    float* grown = (float*)realloc(items, count * sizeof(float));
    if (!grown) return false;
    for (int i = size; i < count; i++) grown[i] = 0;
    items = grown;
    size = count;
    return true;
  }
  void copyFrom(const SBList& other) {
    if (!resize(other.size)) return;
    for (int i = 0; i < size; i++) items[i] = other.items[i];
  }
  void push(float value) {
    if (resize(size + 1)) items[size - 1] = value;
  }
  float* begin() const { return items; }
  float* end() const { return items + size; }
};

SBList sbListOf(int count, ...) {
  SBList list;
  va_list args;
  va_start(args, count);
  for (int i = 0; i < count; i++) list.push((float)va_arg(args, double));
  va_end(args);
  return list;
}

SBList sbListRepeat(float value, int times) {
  SBList list;
  for (int i = 0; i < times; i++) list.push(value);
  return list;
}

int sbListIndex(const SBList& list, int where, int at) {
  switch (where) {
    case ${SB_LIST_WHERE.FROM_START}: return at - 1;
    case ${SB_LIST_WHERE.FROM_END}: return list.size - at;
    case ${SB_LIST_WHERE.FIRST}: return 0;
    case ${SB_LIST_WHERE.LAST}: return list.size - 1;
    default: return list.size > 0 ? (int)random(list.size) : 0;
  }
}

float sbListGet(const SBList& list, int where, int at) {
  int i = sbListIndex(list, where, at);
  return (i >= 0 && i < list.size) ? list.items[i] : 0;
}

float sbListTake(SBList& list, int where, int at) {
  int i = sbListIndex(list, where, at);
  if (i < 0 || i >= list.size) return 0;
  float value = list.items[i];
  for (int j = i; j < list.size - 1; j++) list.items[j] = list.items[j + 1];
  list.resize(list.size - 1);
  return value;
}

void sbListPut(SBList& list, int where, int at, float value, bool insert) {
  int i = sbListIndex(list, where, at);
  if (insert && where == ${SB_LIST_WHERE.LAST}) i = list.size;
  if (i < 0) return;
  if (insert) {
    if (i > list.size) i = list.size;
    if (!list.resize(list.size + 1)) return;
    for (int j = list.size - 1; j > i; j--) list.items[j] = list.items[j - 1];
  } else if (i >= list.size && !list.resize(i + 1)) {
    return;
  }
  list.items[i] = value;
}

int sbListIndexOf(const SBList& list, float value, bool first) {
  for (int n = 0; n < list.size; n++) {
    int i = first ? n : list.size - 1 - n;
    if (list.items[i] == value) return i + 1;
  }
  return 0;
}

SBList sbListSublist(const SBList& list, int where1, int at1, int where2, int at2) {
  int start = sbListIndex(list, where1, at1);
  int end = sbListIndex(list, where2, at2);
  if (start < 0) start = 0;
  if (end >= list.size) end = list.size - 1;
  SBList result;
  for (int i = start; i <= end; i++) result.push(list.items[i]);
  return result;
}

SBList sbListSorted(const SBList& list, int direction) {
  SBList result = list;
  for (int i = 1; i < result.size; i++) {
    float key = result.items[i];
    int j = i - 1;
    while (j >= 0 && (direction > 0 ? result.items[j] > key : result.items[j] < key)) {
      result.items[j + 1] = result.items[j];
      j--;
    }
    result.items[j + 1] = key;
  }
  return result;
}

SBList sbListReversed(const SBList& list) {
  SBList result;
  for (int i = list.size - 1; i >= 0; i--) result.push(list.items[i]);
  return result;
}

String sbListNumberText(float value) {
  if (value == (long)value) return String((long)value);
  return String(value, 2);
}

String sbListJoin(const SBList& list, String delimiter) {
  String text = "";
  for (int i = 0; i < list.size; i++) {
    if (i > 0) text += delimiter;
    text += sbListNumberText(list.items[i]);
  }
  return text;
}

SBList sbListSplit(String text, String delimiter) {
  SBList list;
  if (delimiter.length() == 0) {
    for (unsigned int i = 0; i < text.length(); i++) list.push(String(text.charAt(i)).toFloat());
    return list;
  }
  int start = 0;
  while (true) {
    int found = text.indexOf(delimiter, start);
    if (found < 0) {
      list.push(text.substring(start).toFloat());
      return list;
    }
    list.push(text.substring(start, found).toFloat());
    start = found + delimiter.length();
  }
}

float sbListMath(const SBList& list, int op) {
  if (list.size == 0) return 0;
  float result = list.items[0];
  if (op == 0 || op == 3 || op == 6) {
    float sum = 0;
    for (int i = 0; i < list.size; i++) sum += list.items[i];
    if (op == 0) return sum;
    float mean = sum / list.size;
    if (op == 3) return mean;
    float variance = 0;
    for (int i = 0; i < list.size; i++) variance += (list.items[i] - mean) * (list.items[i] - mean);
    return sqrt(variance / list.size);
  }
  if (op == 1 || op == 2) {
    for (int i = 1; i < list.size; i++) {
      if (op == 1 ? list.items[i] < result : list.items[i] > result) result = list.items[i];
    }
    return result;
  }
  if (op == 7) return list.items[random(list.size)];
  SBList sorted = sbListSorted(list, 1);
  if (op == 4) {
    int middle = sorted.size / 2;
    return sorted.size % 2 ? sorted.items[middle] : (sorted.items[middle - 1] + sorted.items[middle]) / 2;
  }
  int bestCount = 0;
  for (int i = 0; i < sorted.size;) {
    int j = i;
    while (j < sorted.size && sorted.items[j] == sorted.items[i]) j++;
    if (j - i > bestCount) {
      bestCount = j - i;
      result = sorted.items[i];
    }
    i = j;
  }
  return result;
}
`;

	// 會產生清單的積木；variables_set 依此把變數宣告為 SBList
	window.arduinoGenerator.isListBlock = function (block) {
		if (!block) {
			return false;
		}
		if (block.type === 'lists_split') {
			return block.getFieldValue('MODE') === 'SPLIT';
		}
		return ['lists_create_with', 'lists_repeat', 'lists_getSublist', 'lists_sort', 'lists_reverse'].includes(block.type);
	};

	window.arduinoGenerator.useListRuntime = useListRuntime;

	function useListRuntime() {
		const generator = window.arduinoGenerator;
		// 全域變數可能宣告為 SBList，執行環境必須在變數之前；finish 最先輸出 includes_
		if (!generator.includes_['arduino']) {
			generator.includes_['arduino'] = '#include <Arduino.h>';
		}
		generator.includes_['stdarg'] = '#include <stdarg.h>';
		generator.includes_['sb_list'] = SB_LIST_RUNTIME;
	}

	function listCode(block, name) {
		return window.arduinoGenerator.valueToCode(block, name, window.arduinoGenerator.ORDER_NONE) || 'SBList()';
	}

	function memberListCode(block, name) {
		return window.arduinoGenerator.valueToCode(block, name, window.arduinoGenerator.ORDER_UNARY_POSTFIX) || 'SBList()';
	}

	function atCode(block, name, where) {
		if (where !== 'FROM_START' && where !== 'FROM_END') {
			return '1';
		}
		return window.arduinoGenerator.valueToCode(block, name, window.arduinoGenerator.ORDER_NONE) || '1';
	}

	function locationArgs(block, listInput, where, atInput) {
		return `${listCode(block, listInput)}, ${SB_LIST_WHERE[where] ?? SB_LIST_WHERE.FROM_START}, ${atCode(block, atInput, where)}`;
	}

	window.arduinoGenerator.forBlock['lists_create_with'] = function (block) {
		useListRuntime();
		const elements = [];
		for (let i = 0; i < block.itemCount_; i++) {
			const value = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '0';
			// 可變參數以 double 讀取，整數必須先轉型
			elements.push(`(double)(${value})`);
		}
		const code = elements.length ? `sbListOf(${elements.length}, ${elements.join(', ')})` : 'SBList()';
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_repeat'] = function (block) {
		useListRuntime();
		const item = window.arduinoGenerator.valueToCode(block, 'ITEM', window.arduinoGenerator.ORDER_NONE) || '0';
		const times = window.arduinoGenerator.valueToCode(block, 'NUM', window.arduinoGenerator.ORDER_NONE) || '0';
		return [`sbListRepeat(${item}, ${times})`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_length'] = function (block) {
		useListRuntime();
		return [`${memberListCode(block, 'VALUE')}.size`, window.arduinoGenerator.ORDER_UNARY_POSTFIX];
	};

	window.arduinoGenerator.forBlock['lists_isEmpty'] = function (block) {
		useListRuntime();
		return [`(${memberListCode(block, 'VALUE')}.size == 0)`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_indexOf'] = function (block) {
		useListRuntime();
		const item = window.arduinoGenerator.valueToCode(block, 'FIND', window.arduinoGenerator.ORDER_NONE) || '0';
		const first = block.getFieldValue('END') === 'FIRST';
		return [`sbListIndexOf(${listCode(block, 'VALUE')}, ${item}, ${first})`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_getIndex'] = function (block) {
		useListRuntime();
		const mode = block.getFieldValue('MODE') || 'GET';
		const args = locationArgs(block, 'VALUE', block.getFieldValue('WHERE') || 'FROM_START', 'AT');
		if (mode === 'GET') {
			return [`sbListGet(${args})`, window.arduinoGenerator.ORDER_ATOMIC];
		}
		if (mode === 'GET_REMOVE') {
			return [`sbListTake(${args})`, window.arduinoGenerator.ORDER_ATOMIC];
		}
		return `sbListTake(${args});\n`;
	};

	window.arduinoGenerator.forBlock['lists_setIndex'] = function (block) {
		useListRuntime();
		const insert = block.getFieldValue('MODE') === 'INSERT';
		const args = locationArgs(block, 'LIST', block.getFieldValue('WHERE') || 'FROM_START', 'AT');
		const value = window.arduinoGenerator.valueToCode(block, 'TO', window.arduinoGenerator.ORDER_NONE) || '0';
		return `sbListPut(${args}, ${value}, ${insert});\n`;
	};

	window.arduinoGenerator.forBlock['lists_getSublist'] = function (block) {
		useListRuntime();
		const where1 = block.getFieldValue('WHERE1') || 'FROM_START';
		const where2 = block.getFieldValue('WHERE2') || 'LAST';
		const start = `${SB_LIST_WHERE[where1]}, ${atCode(block, 'AT1', where1)}`;
		const end = `${SB_LIST_WHERE[where2]}, ${atCode(block, 'AT2', where2)}`;
		return [`sbListSublist(${listCode(block, 'LIST')}, ${start}, ${end})`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_split'] = function (block) {
		useListRuntime();
		const delimiter = window.arduinoGenerator.valueToCode(block, 'DELIM', window.arduinoGenerator.ORDER_NONE) || '""';
		if (block.getFieldValue('MODE') === 'JOIN') {
			return [`sbListJoin(${listCode(block, 'INPUT')}, ${delimiter})`, window.arduinoGenerator.ORDER_ATOMIC];
		}
		const text = window.arduinoGenerator.valueToCode(block, 'INPUT', window.arduinoGenerator.ORDER_NONE) || '""';
		return [`sbListSplit(${text}, ${delimiter})`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_sort'] = function (block) {
		useListRuntime();
		const direction = block.getFieldValue('DIRECTION') === '-1' ? -1 : 1;
		return [`sbListSorted(${listCode(block, 'LIST')}, ${direction})`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['lists_reverse'] = function (block) {
		useListRuntime();
		return [`sbListReversed(${listCode(block, 'LIST')})`, window.arduinoGenerator.ORDER_ATOMIC];
	};

	window.arduinoGenerator.forBlock['math_on_list'] = function (block) {
		useListRuntime();
		const op = Math.max(0, SB_LIST_MATH_OPS.indexOf(block.getFieldValue('OP')));
		return [`sbListMath(${listCode(block, 'LIST')}, ${op})`, window.arduinoGenerator.ORDER_ATOMIC];
	};
})();
