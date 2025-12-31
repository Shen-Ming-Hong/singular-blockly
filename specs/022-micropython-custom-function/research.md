# Research: MicroPython Custom Function Generator

**Date**: 2025-12-31  
**Feature Branch**: `022-micropython-custom-function`

## 研究摘要

本文件記錄為 `arduino_function` 和 `arduino_function_call` 積木新增 MicroPython 程式碼生成器所需的技術研究結果。

---

## 1. 現有 arduino_function 積木結構分析

### 1.1 積木定義位置

**來源**: `media/blockly/blocks/functions.js`

### 1.2 arduino_function 積木屬性

| 屬性             | 型別             | 說明                                             |
| ---------------- | ---------------- | ------------------------------------------------ |
| `NAME`           | `FieldTextInput` | 函數名稱（可為中文）                             |
| `arguments_`     | `string[]`       | 參數名稱陣列                                     |
| `argumentTypes_` | `string[]`       | 參數型別陣列（'int', 'float', 'bool', 'String'） |
| `STACK`          | `StatementInput` | 函數體語句                                       |

**Mutation 機制**:

-   使用 `mutationToDom()` / `domToMutation()` 序列化/反序列化參數
-   支援透過 mutator UI 動態新增/移除參數

### 1.3 arduino_function_call 積木屬性

| 屬性                | 型別         | 說明                       |
| ------------------- | ------------ | -------------------------- |
| `NAME`              | `FieldLabel` | 函數名稱（唯讀，自動同步） |
| `arguments_`        | `string[]`   | 參數名稱陣列               |
| `argumentTypes_`    | `string[]`   | 參數型別陣列               |
| `ARG0`, `ARG1`, ... | `ValueInput` | 參數值輸入                 |

**連接類型**:

-   `setPreviousStatement(true)` - 語句積木
-   `setNextStatement(true)` - 可串接
-   `setOutput(false)` - 無回傳值

---

## 2. 現有 Arduino 函數生成器分析

### 2.1 arduino_function 生成器

**來源**: `media/blockly/generators/arduino/functions.js`

```javascript
window.arduinoGenerator.forBlock['arduino_function'] = function (block) {
	const displayName = block.getFieldValue('NAME');
	const funcName = window.arduinoGenerator.convertFunctionName(displayName);
	const statements = window.arduinoGenerator.statementToCode(block, 'STACK');

	// 處理參數（帶型別）
	const args = [];
	for (let i = 0; i < block.arguments_.length; i++) {
		args.push(block.argumentTypes_[i] + ' ' + block.arguments_[i]);
	}

	// 生成 C++ 函數定義
	let code = `void ${funcName}(${args.join(', ')}) {\n${statements}}\n`;

	// 註冊到 functions_ 集合
	window.arduinoGenerator.functions_[funcName] = code;
	return null;
};
```

### 2.2 arduino_function_call 生成器

```javascript
window.arduinoGenerator.forBlock['arduino_function_call'] = function (block) {
	const displayName = block.getFieldValue('NAME');
	const funcName = window.arduinoGenerator.functionNameMap?.get(displayName) || window.arduinoGenerator.convertFunctionName(displayName);

	// 取得參數值
	const args = [];
	for (let i = 0; i < block.arguments_.length; i++) {
		const argCode = window.arduinoGenerator.valueToCode(block, 'ARG' + i, window.arduinoGenerator.ORDER_ATOMIC);
		args.push(argCode || getDefaultValueForType(block.argumentTypes_[i]));
	}

	return `${funcName}(${args.join(', ')});\n`;
};
```

**關鍵發現**:

1. Arduino 生成器使用 `convertFunctionName()` 將中文轉為合法 C++ 識別符
2. MicroPython 可直接使用中文函數名稱（Python 3 支援 Unicode 識別符）
3. 函數定義註冊到 `functions_` 集合，最終輸出時統一處理

---

## 3. 現有 MicroPython 生成器架構

### 3.1 生成器主檔結構

**來源**: `media/blockly/generators/micropython/index.js`

**關鍵元件**:

-   `micropythonGenerator.imports_` - import 語句集合
-   `micropythonGenerator.variables_` - 全域變數集合
-   `micropythonGenerator.hardwareInit_` - 硬體初始化集合
-   `micropythonGenerator.functions_` - 自訂函數定義 Map
-   `micropythonGenerator.allowedTopLevelBlocks_` - 允許的頂層積木類型

### 3.2 allowedTopLevelBlocks\_ 當前設定

```javascript
window.micropythonGenerator.allowedTopLevelBlocks_ = ['micropython_main', 'procedures_defnoreturn', 'procedures_defreturn'];
```

**Decision**: 需將 `'arduino_function'` 加入此清單

**Rationale**: 確保 `arduino_function` 積木能作為頂層積木生成，函數定義不會被嵌套

### 3.3 addFunction() 方法

```javascript
window.micropythonGenerator.addFunction = function (name, code) {
	if (!this.functions_.has(name)) {
		this.functions_.set(name, { name, code });
	}
};
```

### 3.4 finish() 方法中的函數輸出

```javascript
// 組合自訂函數
const functions = Array.from(this.functions_.values())
	.map(f => f.code)
	.join('\n\n');

// 輸出到 [4] User Functions 區塊
if (functions) {
	fullCode += '# [4] User Functions\n';
	fullCode += functions + '\n\n';
}
```

---

## 4. MicroPython 函數生成策略

### 4.1 Python vs C++ 函數語法差異

| 特性     | C++ (Arduino)         | Python (MicroPython) |
| -------- | --------------------- | -------------------- |
| 函數定義 | `void func(int x) {}` | `def func(x):`       |
| 參數型別 | 必須宣告              | 不宣告（動態型別）   |
| 空函數體 | `{}` 即可             | 需要 `pass`          |
| 縮排     | 無意義                | 決定程式碼區塊       |
| 中文名稱 | ❌ 需轉換             | ✅ 原生支援          |

### 4.2 arduino_function MicroPython 生成器設計

**Decision**: 直接使用中文函數名稱，忽略參數型別

```javascript
generator.forBlock['arduino_function'] = function (block) {
	const funcName = block.getFieldValue('NAME');

	// Python 不需要參數型別，只取參數名稱
	const args = block.arguments_ || [];

	// 生成函數體
	let branch = generator.statementToCode(block, 'STACK');
	if (!branch) {
		branch = generator.INDENT + 'pass\n';
	}

	// 組裝 Python 函數定義
	const code = `def ${funcName}(${args.join(', ')}):\n${branch}`;

	// 註冊到 functions_ 集合
	generator.addFunction(funcName, code);

	return null;
};
```

### 4.3 arduino_function_call MicroPython 生成器設計

```javascript
generator.forBlock['arduino_function_call'] = function (block) {
	const funcName = block.getFieldValue('NAME');

	// 取得參數值
	const args = [];
	const argCount = block.arguments_?.length || 0;
	for (let i = 0; i < argCount; i++) {
		const argCode = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE);
		args.push(argCode || 'None'); // Python 預設值用 None
	}

	// 生成函數呼叫（語句形式，帶換行）
	return `${funcName}(${args.join(', ')})\n`;
};
```

---

## 5. 空函數體處理

### 5.1 問題說明

Python 語法要求函數體不能為空，必須至少有一個語句。

**錯誤範例**:

```python
def myFunction():
# SyntaxError: expected an indented block
```

**正確範例**:

```python
def myFunction():
    pass
```

### 5.2 解決方案

**Decision**: 當 `statementToCode()` 返回空字串時，自動插入 `pass`

```javascript
let branch = generator.statementToCode(block, 'STACK');
if (!branch || !branch.trim()) {
	branch = generator.INDENT + 'pass\n';
}
```

---

## 6. 函數生成順序

### 6.1 工作區積木順序

**Decision**: 按工作區積木順序生成（由上到下、由左到右）

**Rationale**:

1. 與使用者視覺順序一致
2. Blockly `workspace.getTopBlocks(true)` 已按此順序排列

### 6.2 實際輸出位置

函數定義會被輸出到生成程式碼的 `[4] User Functions` 區塊，位於：

1. Imports 之後
2. Hardware Initialization 之後
3. Global Variables 之後
4. Main Program 之前

這確保函數在被呼叫前已定義。

---

## 7. 研究結論

### 關鍵決策摘要

| 決策項目   | 選擇                          | 理由                         |
| ---------- | ----------------------------- | ---------------------------- |
| 函數名稱   | 保留原始（含中文）            | Python 3 支援 Unicode 識別符 |
| 參數型別   | 忽略                          | Python 動態型別，不需宣告    |
| 空函數體   | 自動加 `pass`                 | 符合 Python 語法要求         |
| 頂層積木   | 加入 `allowedTopLevelBlocks_` | 確保函數定義在正確位置       |
| 參數預設值 | `None`                        | Python 慣例                  |

### 需修改的檔案

1. **`media/blockly/generators/micropython/functions.js`**

    - 新增 `arduino_function` 生成器
    - 新增 `arduino_function_call` 生成器

2. **`media/blockly/generators/micropython/index.js`**
    - 將 `'arduino_function'` 加入 `allowedTopLevelBlocks_`

### 預期輸出範例

**輸入**（Blockly 工作區）:

-   一個 `arduino_function` 積木，名稱 `馬達控制`，參數 `speed` (int)
-   一個 `arduino_function_call` 積木，呼叫 `馬達控制(100)`

**輸出**（MicroPython 程式碼）:

```python
# === CyberBrick MicroPython ===
# Generated: 2025-12-31T...

# [4] User Functions
def 馬達控制(speed):
    # 函數內容...
    pass

# [5] Main Program
def main():
    馬達控制(100)

# Entry point
if __name__ == "__main__":
    main()
```
