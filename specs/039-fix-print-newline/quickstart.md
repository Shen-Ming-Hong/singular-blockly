# Quickstart: 修復 text_print 積木換行控制

**Feature**: `039-fix-print-newline` | **Target**: MicroPython Generator  
**Estimated Time**: 30 分鐘 | **Difficulty**: ⭐ Easy

## TL;DR (快速摘要)

修改一個檔案,新增兩行程式碼,修復 MicroPython 版本的 `text_print` 積木 NEW_LINE checkbox 功能。

```diff
// media/blockly/generators/micropython/text.js

window.micropythonGenerator.forBlock['text_print'] = function (block) {
    const msg = window.micropythonGenerator.valueToCode(
        block,
        'TEXT',
        window.micropythonGenerator.ORDER_NONE
    ) || '""';

+   // 讀取 NEW_LINE 欄位
+   const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

-   return `print(${msg})`;
+   return `print(${msg}${newLine ? '' : ', end=""'})`;
};
```

**效果**: 取消勾選「換行」checkbox 時,產生 `print(msg, end="")` 而非 `print(msg)`。

---

## Prerequisites (前置條件)

### 必備知識

- ✅ 基礎 JavaScript/TypeScript 語法
- ✅ Blockly 基本概念 (blocks, generators)
- ✅ Python `print()` 函數用法
- ⚠️ 不需要 MicroPython 開發經驗
- ⚠️ 不需要 Blockly API 深度知識

### 開發環境

```bash
# 1. 安裝依賴
npm install

# 2. 啟動監視模式
npm run watch

# 3. 開啟除錯 (F5 或 Ctrl+Shift+D)
# 選擇 "Run Extension" launch configuration
```

### 參考文件

- [research.md](research.md) - 研究結果與技術背景
- [data-model.md](data-model.md) - 資料模型與實體定義
- [contracts/generator-contract.md](contracts/generator-contract.md) - Generator 介面契約

---

## Step-by-Step Implementation

### Step 1: 定位目標檔案 (2 分鐘)

開啟 MicroPython text generator:

```bash
media/blockly/generators/micropython/text.js
```

找到 `text_print` generator 函數 (預計在第 1-10 行):

```javascript
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	// 目前的錯誤實作
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	return `print(${msg})`; // ❌ 未處理 NEW_LINE 欄位
};
```

---

### Step 2: 新增欄位讀取邏輯 (5 分鐘)

在 `return` 語句前,新增 NEW_LINE 欄位讀取:

```javascript
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	// ✅ 新增: 讀取 NEW_LINE checkbox 值
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	return `print(${msg})`; // 下一步修改
};
```

**說明**:

- `getFieldValue('NEW_LINE')` 返回字串 `"TRUE"` 或 `"FALSE"`
- 與字串 `'TRUE'` 比較得到 boolean 值
- 參考 [research.md#2-blockly-generator-api](research.md#2-blockly-generator-api---field-讀取方法)

---

### Step 3: 條件式程式碼生成 (10 分鐘)

修改 `return` 語句,根據 `newLine` 值決定是否添加 `end=""` 參數:

```javascript
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// ✅ 修改: 條件式生成程式碼
	return `print(${msg}${newLine ? '' : ', end=""'})`;
};
```

**邏輯說明**:

| `newLine` | Template String                    | 展開結果             |
| --------- | ---------------------------------- | -------------------- |
| `true`    | `` `print(${msg}${''})`  ``        | `print(msg)`         |
| `false`   | `` `print(${msg}${', end=""'})` `` | `print(msg, end="")` |

**參考**:

- Arduino 版本使用相同模式: [research.md#3-arduino-generator](research.md#3-arduino-generator-現有實作模式)
- MicroPython print() API: [research.md#1-micropython-print](research.md#1-micropython-print-函數-end-參數)

---

### Step 4: 儲存並重新載入 (3 分鐘)

1. **儲存檔案**: `Ctrl+S` 或 `Cmd+S`
2. **重新載入 Extension**:
    - 按 `Ctrl+Shift+F5` (Windows/Linux)
    - 或按 `Cmd+Shift+F5` (macOS)
    - 或在 Extension Development Host 中按 `F1` → "Developer: Reload Window"

---

### Step 5: 手動測試驗證 (10 分鐘)

#### 5.1 建立測試專案

1. 開啟指令面板: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. 執行: `Singular Blockly: New Project`
3. 選擇 **CyberBrick** 板子
4. 專案名稱: `test-print-newline`

#### 5.2 建立測試積木

從 Toolbox 拖曳以下積木到 Workspace:

```
[when program starts] (起始積木)
  ↓
[text_print: TEXT = "A", NEW_LINE = ☐ 未勾選]
  ↓
[text_print: TEXT = "B", NEW_LINE = ☐ 未勾選]
  ↓
[text_print: TEXT = "C", NEW_LINE = ☑ 勾選]
```

#### 5.3 檢查生成的程式碼

開啟 `main.py`,檢查是否正確生成:

```python
# 預期輸出
print("A", end="")
print("B", end="")
print("C")
```

#### 5.4 硬體測試 (選配)

如果有 CyberBrick 硬體:

1. 點擊「上傳程式碼」按鈕
2. 開啟終端機監控
3. 檢查輸出: `ABC` (在同一行,最後換行)

**預期結果**:

| 情境                  | 預期終端機輸出      |
| --------------------- | ------------------- |
| 三個 print 都勾選換行 | `A\nB\nC\n` (三行)  |
| 前兩個不換行,最後換行 | `ABC\n` (一行+換行) |
| 三個都不換行          | `ABC` (一行,無換行) |

---

## Verification Checklist

完成以下檢查確保修復成功:

- [ ] **檔案已修改**: `media/blockly/generators/micropython/text.js` 包含新程式碼
- [ ] **程式碼編譯通過**: 無 TypeScript/ESLint 錯誤
- [ ] **Extension 已重新載入**: F5 或 Ctrl+Shift+F5
- [ ] **勾選換行**: 產生 `print(msg)` (無 `end` 參數)
- [ ] **取消勾選換行**: 產生 `print(msg, end="")` (有 `end=""`)
- [ ] **空輸入**: 產生 `print("")` 或 `print("", end="")`
- [ ] **變數輸入**: 產生 `print(variable_name)` (無引號)
- [ ] **硬體測試** (選配): 終端機輸出符合預期

---

## Troubleshooting (常見問題)

### 問題 1: 修改後程式碼未生效

**症狀**: 積木產生的程式碼仍然是舊版本 (沒有 `end=""`)

**原因**: Extension 未重新載入,仍在使用快取的舊版本

**解決方案**:

```bash
# 方法 1: 重新載入視窗
Ctrl+Shift+F5 (Windows/Linux)
Cmd+Shift+F5 (macOS)

# 方法 2: 手動重啟
1. 關閉 Extension Development Host 視窗
2. 重新按 F5 啟動
```

---

### 問題 2: 取消勾選 checkbox 但仍然換行

**症狀**: 在終端機上看到輸出仍然換行

**診斷步驟**:

1. 開啟 `main.py`
2. 檢查生成的程式碼

**可能情況**:

| 生成的程式碼         | 診斷結果                           |
| -------------------- | ---------------------------------- |
| `print("A", end="")` | ✅ Generator 正確,可能是硬體問題   |
| `print("A")`         | ❌ Generator 未修復,重新檢查程式碼 |

**解決方案**:

- Generator 正確: 檢查 CyberBrick 韌體版本是否支援 `end` 參數
- Generator 錯誤: 確認程式碼修改正確,重新載入 Extension

---

### 問題 3: ESLint 報錯

**症狀**: 儲存檔案後出現紅色波浪線

**常見錯誤**:

```javascript
// ❌ 錯誤: 使用單引號 (應使用雙引號)
return `print(${msg}, end='')`;

// ✅ 正確: 使用雙引號
return `print(${msg}, end="")`;
```

**解決方案**:

- 參考 Generator Contract: [contracts/generator-contract.md](contracts/generator-contract.md#rule-2-end-parameter-placement)
- 使用雙引號: `end=""`

---

### 問題 4: 變數輸入被加上引號

**症狀**: `print(message)` 變成 `print("message")`

**原因**: `valueToCode()` 返回的字串已包含引號 (如果是字串常量)

**檢查**:

```javascript
const msg = valueToCode(block, 'TEXT', ORDER_NONE);
console.log(msg); // 觀察返回值

// 字串常量: msg = '"Hello"' (有引號)
// 變數: msg = 'myVar' (無引號)
```

**解決方案**:

- 不要手動添加引號,直接使用 `valueToCode()` 的返回值
- 參考實作: [Step 3](#step-3-條件式程式碼生成-10-分鐘)

---

## Additional Resources

### Code Examples

#### 完整實作 (參考解答)

```javascript
/**
 * MicroPython Generator for text_print block
 *
 * Generates: print(msg) or print(msg, end="")
 * Based on NEW_LINE checkbox state
 */
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	// 取得 TEXT 輸入 (字串/變數/表達式)
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""'; // 預設空字串

	// 讀取 NEW_LINE checkbox
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// 條件式程式碼生成
	// - newLine = true  → print(msg)
	// - newLine = false → print(msg, end="")
	return `print(${msg}${newLine ? '' : ', end=""'})`;
};
```

#### 測試場景範例

```javascript
// 場景 1: 勾選換行 + 字串常量
// 積木: text_print("Hello", NEW_LINE = TRUE)
// 生成: print("Hello")

// 場景 2: 取消勾選換行 + 字串常量
// 積木: text_print("World", NEW_LINE = FALSE)
// 生成: print("World", end="")

// 場景 3: 勾選換行 + 變數
// 積木: text_print(message, NEW_LINE = TRUE)
// 生成: print(message)

// 場景 4: 取消勾選換行 + 表達式
// 積木: text_print(str(x) + str(y), NEW_LINE = FALSE)
// 生成: print(str(x) + str(y), end="")
```

---

### Related Files

#### 需要修改的檔案

| 檔案                                           | 說明                  | 修改內容        |
| ---------------------------------------------- | --------------------- | --------------- |
| `media/blockly/generators/micropython/text.js` | MicroPython Generator | 新增 2 行程式碼 |

#### 不需修改的檔案 (已正確)

| 檔案                                       | 說明              | 狀態                        |
| ------------------------------------------ | ----------------- | --------------------------- |
| `media/blockly/blocks/arduino.js`          | Block 定義        | ✅ 已包含 NEW_LINE checkbox |
| `media/blockly/generators/arduino/text.js` | Arduino Generator | ✅ 功能正常 (參考實作)      |
| `media/locales/*/messages.js`              | i18n 翻譯         | ✅ 已包含「換行」翻譯       |
| `media/toolbox/cyberbrick.json`            | Toolbox 配置      | ✅ 預設值為 "TRUE"          |

---

### Testing Tools

#### 開發者工具 Console

在 Extension Development Host 中開啟 Developer Tools:

1. 右鍵點擊 Blockly 編輯器
2. 選擇「檢查元素」或「Inspect」
3. 切換到 Console 標籤
4. 執行測試程式碼:

```javascript
// 取得當前 workspace
const workspace = Blockly.getMainWorkspace();

// 取得所有 text_print 積木
const blocks = workspace.getBlocksByType('text_print');

// 檢查第一個積木的 NEW_LINE 值
const block = blocks[0];
console.log(block.getFieldValue('NEW_LINE')); // "TRUE" or "FALSE"

// 手動產生程式碼
const code = window.micropythonGenerator.blockToCode(block);
console.log(code); // 查看生成的程式碼
```

---

## Next Steps (下一步)

完成實作後:

1. **執行測試**: 參考 [Testing Strategy](research.md#4-generator-函數測試策略)
2. **建立 PR**: 使用 Git Workflow Skill (`.github/skills/git-workflow/SKILL.md`)
3. **更新 CHANGELOG**: 記錄變更於 `CHANGELOG.md`
4. **準備發布**: 遵循版本管理流程 (憲章 Principle X)

---

## Learning Resources

### Blockly Generator 基礎

- **官方文件**: [Blockly Generators Guide](https://developers.google.com/blockly/guides/create-custom-blocks/generating-code)
- **專案範例**: 參考 `media/blockly/generators/arduino/` 下的其他 generator

### MicroPython print() 函數

- **Python 官方文件**: [Built-in Functions - print()](https://docs.python.org/3/library/functions.html#print)
- **Research 報告**: [research.md#1-micropython-print](research.md#1-micropython-print-函數-end-參數)

### 專案架構

- **Copilot Instructions**: `.github/copilot-instructions.md` - 專案架構與開發規範
- **憲章**: `.specify/memory/constitution.md` - 核心開發原則

---

**Quickstart Version**: 1.0  
**Last Updated**: 2026年2月4日  
**Status**: ✅ Ready for Development
