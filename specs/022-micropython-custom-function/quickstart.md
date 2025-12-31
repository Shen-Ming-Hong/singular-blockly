# Quickstart: MicroPython Custom Function Generator

**Date**: 2025-12-31  
**Feature Branch**: `022-micropython-custom-function`

## 快速開始

本指南說明如何為 `arduino_function` 和 `arduino_function_call` 積木新增 MicroPython 程式碼生成器。

---

## 1. 先決條件

-   熟悉 Blockly 程式碼生成器架構
-   了解現有 MicroPython 生成器（`micropythonGenerator`）
-   開發環境已設定完成（`npm run watch`）

---

## 2. 實作步驟概覽

### 步驟 1：修改 allowedTopLevelBlocks\_

**檔案**: `media/blockly/generators/micropython/index.js`

找到：

```javascript
window.micropythonGenerator.allowedTopLevelBlocks_ = ['micropython_main', 'procedures_defnoreturn', 'procedures_defreturn'];
```

修改為：

```javascript
window.micropythonGenerator.allowedTopLevelBlocks_ = [
	'micropython_main',
	'procedures_defnoreturn',
	'procedures_defreturn',
	'arduino_function', // 新增
];
```

### 步驟 2：新增 arduino_function 生成器

**檔案**: `media/blockly/generators/micropython/functions.js`

在檔案末尾（`console.log` 之前）新增：

```javascript
/**
 * 自訂函數定義 (arduino_function)
 * 生成 Python def 語法
 */
generator.forBlock['arduino_function'] = function (block) {
	// 取得函數名稱（支援中文）
	const funcName = block.getFieldValue('NAME');

	// 取得參數名稱（忽略型別，Python 是動態型別）
	const args = block.arguments_ || [];

	// 生成函數體
	let branch = generator.statementToCode(block, 'STACK');

	// 空函數體需要 pass
	if (!branch || !branch.trim()) {
		branch = generator.INDENT + 'pass\n';
	}

	// 組裝 Python 函數定義
	const code = `def ${funcName}(${args.join(', ')}):\n${branch}`;

	// 註冊到 functions_ 集合
	generator.addFunction(funcName, code);

	console.log(`[blockly] 已生成 MicroPython 函數: ${funcName}`);
	return null;
};
```

### 步驟 3：新增 arduino_function_call 生成器

**檔案**: `media/blockly/generators/micropython/functions.js`

接續上面的程式碼新增：

```javascript
/**
 * 自訂函數呼叫 (arduino_function_call)
 * 生成 Python 函數呼叫語法
 */
generator.forBlock['arduino_function_call'] = function (block) {
	// 取得函數名稱
	const funcName = block.getFieldValue('NAME');

	// 取得參數值
	const args = [];
	const argCount = block.arguments_?.length || 0;

	for (let i = 0; i < argCount; i++) {
		const argCode = generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE);
		// 未連接的參數使用 None 作為預設值
		args.push(argCode || 'None');
	}

	// 生成函數呼叫（語句形式，帶換行）
	const code = `${funcName}(${args.join(', ')})\n`;

	return code;
};
```

---

## 3. 測試驗證

### 3.1 手動測試步驟

1. **啟動開發模式**

    ```bash
    npm run watch
    ```

2. **按 F5 啟動擴充功能開發主機**

3. **選擇 CyberBrick 主板**

    - 開啟 Blockly 編輯器
    - 從主板選單選擇 "CyberBrick"

4. **建立自訂函數**

    - 從「函數」分類拖拉「自訂函數」積木
    - 設定函數名稱（可使用中文）
    - 可選：透過齒輪圖示新增參數

5. **呼叫自訂函數**

    - 從「函數」分類拖拉「呼叫」積木
    - 連接到主程式積木內

6. **檢查生成程式碼**
    - 檢視程式碼面板
    - 確認函數定義出現在 `# [4] User Functions` 區塊
    - 確認函數呼叫出現在 `# [5] Main Program` 區塊

### 3.2 預期輸出範例

**Blockly 工作區**:

-   一個函數定義積木：`馬達控制(speed)`
-   主程式積木內呼叫：`馬達控制(100)`

**預期生成程式碼**:

```python
# === CyberBrick MicroPython ===
# Generated: 2025-12-31T...

# [4] User Functions
def 馬達控制(speed):
    pass

# [5] Main Program
def main():
    馬達控制(100)

# Entry point
if __name__ == "__main__":
    main()
```

### 3.3 驗收情境檢查清單

-   [x] 無參數函數生成正確（`def funcName():`）
-   [x] 帶參數函數生成正確（`def funcName(a, b):`）
-   [x] 空函數體生成 `pass`
-   [x] 函數呼叫生成正確（`funcName(arg1, arg2)`）
-   [x] 中文函數名稱保留原樣
-   [x] 不再出現 "MicroPython generator does not know how to generate code" 錯誤

---

## 4. 常見問題

### Q1: 為什麼函數定義沒有輸出？

**原因**: `arduino_function` 未加入 `allowedTopLevelBlocks_`

**解決**: 確認 `index.js` 中的 `allowedTopLevelBlocks_` 陣列包含 `'arduino_function'`

### Q2: 函數定義出現在錯誤位置？

**原因**: 函數定義應該透過 `addFunction()` 註冊，而不是直接返回程式碼

**解決**: 確認 `forBlock['arduino_function']` 返回 `null`，並使用 `generator.addFunction()`

### Q3: 參數值顯示為 undefined？

**原因**: 參數輸入未正確讀取

**解決**: 使用 `generator.valueToCode(block, 'ARG' + i, generator.ORDER_NONE)` 並提供預設值 `'None'`

---

## 5. 相關檔案

| 檔案                                                | 用途                     |
| --------------------------------------------------- | ------------------------ |
| `media/blockly/blocks/functions.js`                 | 函數積木定義（無需修改） |
| `media/blockly/generators/arduino/functions.js`     | Arduino 生成器（參考用） |
| `media/blockly/generators/micropython/index.js`     | MicroPython 生成器主檔   |
| `media/blockly/generators/micropython/functions.js` | MicroPython 函數生成器   |

---

## 6. 下一步

完成實作後：

1. 執行完整的手動測試
2. 確認所有驗收情境通過
3. 提交程式碼變更
