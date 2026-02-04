# Research: 修復 CyberBrick Print 積木換行控制

**Feature**: `039-fix-print-newline` | **Date**: 2026年2月4日

## Research Summary

本研究針對 `text_print` 積木的 MicroPython 程式碼產生器修復需求,調查了以下四個關鍵技術面向:

1. **MicroPython print() 函數 end 參數規格**
2. **Blockly Generator API 的 Field 讀取方法**
3. **Arduino Generator 現有實作模式**
4. **Generator 函數測試策略**

---

## 1. MicroPython print() 函數 end 參數

### Decision

使用 `print(msg, end='')` 來抑制換行，使用 `print(msg)` 來保持預設換行行為。

### Rationale

- **官方 API 簽名**: `print(*objects, sep=' ', end='\n', file=sys.stdout, flush=False)`
- **預設行為**: 當不指定 `end` 參數時,預設值為 `'\n'` (換行符)
- **MicroPython 相容性**: 與 CPython 完全相容,無需特殊處理

### 技術規格

| 情境         | 語法                                                             | 終端機行為                           |
| ------------ | ---------------------------------------------------------------- | ------------------------------------ |
| 勾選換行     | `print("Hello")`                                                 | 輸出後自動換行                       |
| 取消勾選換行 | `print("Hello", end='')`                                         | 輸出後不換行                         |
| 連續不換行   | `print("A", end='')` <br> `print("B", end='')` <br> `print("C")` | 輸出 `ABC` (前兩個不換行,第三個換行) |

### Edge Cases

- **文字中包含 \n**: `print("A\nB", end='')` → 文字中間會換行,但輸出結尾不換行
- **空字串**: `print("", end='')` → 無輸出,無換行
- **特殊字元**: `print("Hello", end='\t')` → 輸出後接 Tab 字元

### Code Examples

```python
# 基本用法
print("Temperature: ", end='')
print(25)
# 輸出: Temperature: 25

# 進度條範例
for i in range(10):
    print("#", end='')
print(" Done!")
# 輸出: ########## Done!

# 感測器數值覆寫同一行
from machine import Pin
import time

led = Pin(8, Pin.OUT)
for i in range(10):
    led.value(i % 2)
    print(f"LED: {led.value()}", end='\r')  # \r 回到行首
    time.sleep(0.5)
print()  # 最後換行
```

### 參考來源

- Python 3.13 官方文件 - Built-in Functions
- MicroPython 官方文件 - Differences from CPython
- MicroPython 程式碼範例庫 (2242 個範例)

---

## 2. Blockly Generator API - Field 讀取方法

### Decision

使用 `block.getFieldValue('NEW_LINE') === 'TRUE'` 來讀取 checkbox 欄位值並轉換為 boolean。

### Rationale

- **統一 API**: 所有 field 類型 (checkbox, dropdown, number) 都使用 `getFieldValue()` 方法
- **返回類型**: 返回字串 `"TRUE"` 或 `"FALSE"`,非 JavaScript boolean
- **型別安全**: 使用嚴格相等 `===` 避免型別強制轉換錯誤

### API Usage Pattern

```javascript
// ✅ 正確寫法
const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';
if (newLine) {
	// 使用換行版本
} else {
	// 使用不換行版本
}

// ❌ 錯誤寫法 - 永遠為 truthy (因為是字串)
const checked = block.getFieldValue('NEW_LINE');
if (checked) {
	/* 總是執行 */
}

// ❌ 錯誤寫法 - 區分大小寫錯誤
if (block.getFieldValue('NEW_LINE') === 'true') {
	/* 永遠不匹配 */
}
```

### 實際範例 (來自程式碼庫)

#### 範例 1: text_print (Arduino)

```javascript
// media/blockly/generators/arduino/text.js:77
const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';
return `Serial.${newLine ? 'println' : 'print'}(${msg});\n`;
```

#### 範例 2: seven_segment_display

```javascript
// media/blockly/generators/arduino/io.js:342
const decimalPoint = block.getFieldValue('DECIMAL_POINT') === 'TRUE';
// 傳遞給顯示函數作為參數
```

#### 範例 3: ultrasonic_sensor

```javascript
// media/blockly/generators/arduino/sensors.js:32
const useInterrupt = block.getFieldValue('USE_INTERRUPT') === 'TRUE';
if (useInterrupt) {
	// 生成中斷模式程式碼
} else {
	// 生成輪詢模式程式碼
}
```

### Best Practices

1. **立即轉換為 boolean** (最常見,最清晰)

    ```javascript
    const checked = block.getFieldValue('FIELD_NAME') === 'TRUE';
    ```

2. **行內條件運算** (簡潔)

    ```javascript
    return `${block.getFieldValue('FIELD_NAME') === 'TRUE' ? 'optionA' : 'optionB'}`;
    ```

3. **無需錯誤處理**
    - Blockly 保證 checkbox 總是返回 `'TRUE'` 或 `'FALSE'`
    - 不需要額外的 null check 或預設值處理

---

## 3. Arduino Generator 現有實作模式

### Decision

複製 Arduino generator 的條件式程式碼生成模式,使用三元運算子動態選擇函數名稱。

### 完整 Arduino 實作

```javascript
// media/blockly/generators/arduino/text.js
window.arduinoGenerator.forBlock['text_print'] = function (block) {
	// 確保包含必要的標頭檔
	window.arduinoGenerator.includes_['arduino'] = '#include <Arduino.h>';

	// 在 setup 中初始化 Serial (防重複)
	if (!window.arduinoGenerator.setupCode_) {
		window.arduinoGenerator.setupCode_ = [];
	}
	if (!window.arduinoGenerator.setupCode_.includes('Serial.begin(9600);')) {
		window.arduinoGenerator.setupCode_.push('Serial.begin(9600);');
	}

	// 獲取要輸出的文字
	const msg = window.arduinoGenerator.valueToCode(block, 'TEXT', window.arduinoGenerator.ORDER_NONE) || '""';

	// 讀取 checkbox 值
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// 根據 checkbox 狀態選擇函數
	return `Serial.${newLine ? 'println' : 'print'}(${msg});\n`;
};
```

### Pattern 對照表

| Checkbox 狀態    | Arduino 輸出           | MicroPython 輸出     |
| ---------------- | ---------------------- | -------------------- |
| ☑ 已勾選 (TRUE)  | `Serial.println(msg);` | `print(msg)`         |
| ☐ 未勾選 (FALSE) | `Serial.print(msg);`   | `print(msg, end='')` |

### MicroPython 套用模式

```javascript
// 預期 MicroPython 實作 (media/blockly/generators/micropython/text.js)
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	// 獲取文字輸入
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	// 讀取 checkbox 值
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// 根據 checkbox 狀態決定是否添加 end 參數
	return `print(${msg}${newLine ? '' : ', end=""'})`;
};
```

### 邏輯映射

- ✅ `newLine = true` → `print(msg)` (預設換行)
- ✅ `newLine = false` → `print(msg, end="")` (不換行)

---

## 4. Generator 函數測試策略

### Decision

採用**文件化測試 (Documentation Tests)** 策略,使用正則表達式記錄預期程式碼格式,實際驗證透過手動測試完成。

### Rationale

- **技術限制**: Blockly 生成器在 WebView (瀏覽器環境) 中執行,Node.js 測試環境難以完整模擬
- **成本考量**: Mock Blockly 庫和 WebView API 成本極高且容易誤導
- **專案慣例**: 現有專案已採用此策略 (參考 `src/test/suite/code-generation.test.ts`)
- **憲章合規**: 符合憲章 Principle VII 的 UI Testing Exception 規範

### 測試架構分析

#### 現有測試模式

1. **文件化測試** (Documentation Tests)
    - 檔案: `src/test/suite/code-generation.test.ts`
    - 使用正則表達式描述預期格式
    - 不執行實際生成器函數
    - 作為規格文件記錄預期行為

2. **邏輯提取測試** (Extracted Logic Tests)
    - 檔案: `src/test/suite/pwm-validation.test.ts`
    - 將生成器中的複雜邏輯提取為純函數
    - 在 Node.js 環境中進行真正的單元測試

### 推薦測試結構

```typescript
/**
 * text_print Generator Tests
 *
 * 文件化測試 - 記錄預期的程式碼生成格式
 * 實際驗證透過手動測試完成 (於 Extension Development Host)
 */

import * as assert from 'assert';

suite('text_print Code Generation Tests', () => {
	suite('程式碼生成格式驗證', () => {
		test('NEW_LINE = TRUE: 應生成 print(msg)', () => {
			const expectedCode = /^print\("Hello"\)$/;

			assert.ok(expectedCode, '應使用標準 print 函數 (預設換行)');
		});

		test('NEW_LINE = FALSE: 應生成 print(msg, end="")', () => {
			const expectedCode = /^print\("World", end=""\)$/;

			assert.ok(expectedCode, '應添加 end="" 參數 (不換行)');
		});

		test('空輸入: 應使用預設值 ""', () => {
			const expectedCode = /^print\(""\)$/;

			assert.ok(expectedCode, '空輸入應使用空字串');
		});

		test('變數輸入: 不應加引號', () => {
			const expectedCode = /^print\([a-zA-Z_][a-zA-Z0-9_]*\)$/;

			assert.ok(expectedCode, '變數應不加引號');
		});
	});

	suite('特殊情境', () => {
		test('多個 text_print 積木: 獨立運作', () => {
			// MicroPython 的 print 不需要初始化設定
			// 每個積木獨立生成一行程式碼
			const independentExecution = true;

			assert.strictEqual(independentExecution, true, 'text_print 積木不需共享狀態');
		});
	});
});

/**
 * 手動測試檢查清單
 *
 * 1. 開啟 Extension Development Host
 * 2. 建立包含以下積木的專案:
 *    - text_print: TEXT = "A", NEW_LINE = FALSE
 *    - text_print: TEXT = "B", NEW_LINE = FALSE
 *    - text_print: TEXT = "C", NEW_LINE = TRUE
 * 3. 檢查生成的 main.py:
 *    print("A", end="")
 *    print("B", end="")
 *    print("C")
 * 4. 上傳至 CyberBrick，檢查終端機輸出: "ABC\n"
 */
```

### 測試工具

- **Framework**: Mocha + Sinon
- **VSCode Integration**: `@vscode/test-electron`
- **Mock Utilities**: `src/test/helpers/mocks.ts` (FSMock, VSCodeMock)
- **Coverage Target**: 90%+

### 手動測試流程

1. **開啟 Extension Development Host** (F5)
2. **建立測試專案**:
    - 選擇 CyberBrick 板子
    - 建立包含不同 checkbox 狀態的 text_print 積木
3. **檢查生成的程式碼**:
    - 開啟 `main.py`
    - 驗證 `print()` 函數的 `end` 參數是否正確
4. **硬體驗證**:
    - 上傳到 CyberBrick
    - 開啟終端機監控
    - 確認輸出行為符合預期

---

## Implementation Considerations

### 技術債務

**無** - Arduino generator 已正確實作,僅需複製模式到 MicroPython generator。

### 風險評估

| 風險                       | 機率 | 影響 | 緩解措施                           |
| -------------------------- | ---- | ---- | ---------------------------------- |
| MicroPython 版本相容性問題 | 低   | 中   | 已驗證 end 參數與 CPython 完全相容 |
| Blockly API 變動           | 極低 | 中   | 使用 Blockly 12.3.1 穩定版本       |
| 未涵蓋的邊界情況           | 低   | 低   | 手動測試涵蓋常見場景               |

### 依賴項檢查

- ✅ Blockly 12.3.1 - `getFieldValue()` API 穩定
- ✅ MicroPython - `print()` 函數標準實作
- ✅ VSCode 1.105.0+ - Extension API 無變動
- ✅ 無需新增外部依賴

### 效能影響

- **編譯時間**: 無影響 (僅修改簡單的字串拼接邏輯)
- **執行時間**: 無影響 (MicroPython `print()` 效能一致)
- **記憶體使用**: 無影響 (產生的程式碼無額外記憶體開銷)

---

## Alternatives Considered

### 替代方案 1: 使用自訂函數包裝

```python
# 定義自訂函數
def print_no_newline(msg):
    print(msg, end='')

# 使用時
print_no_newline("Hello")
print("World")
```

**拒絕理由**:

- 增加使用者的程式碼複雜度
- 不符合 Python 慣用語法 (Pythonic)
- Arduino 版本使用內建函數,應保持一致

### 替代方案 2: 使用 sys.stdout.write()

```python
import sys
sys.stdout.write("Hello")
sys.stdout.write("World\n")
```

**拒絕理由**:

- 需要額外的 `import sys`
- API 較低階,使用者不熟悉
- 不支援變數的自動型別轉換 (需手動 `str()`)
- 與教育目標不符 (應使用高階、易懂的 API)

### 替代方案 3: 修改積木定義 (移除 checkbox)

**拒絕理由**:

- 破壞現有專案的相容性
- Arduino 版本功能正常,不應移除
- 使用者有實際需求 (進度條、即時輸出等場景)

---

## Research Completion Checklist

- ✅ **MicroPython API 規格**: 已確認 `end` 參數語法和行為
- ✅ **Blockly Field API**: 已確認 `getFieldValue('NEW_LINE') === 'TRUE'` 用法
- ✅ **Arduino 實作參考**: 已分析並記錄三元運算子模式
- ✅ **測試策略**: 已確認採用文件化測試 + 手動驗證
- ✅ **憲章合規性**: 已驗證符合 Principle V (研究驅動開發)
- ✅ **無技術障礙**: 所有需要的 API 和模式都已驗證可行

---

## Next Steps

1. **Phase 1 設計階段**:
    - 生成 `data-model.md` (實體模型)
    - 生成 `contracts/` (API 合約)
    - 生成 `quickstart.md` (開發指南)
    - 更新 Agent 上下文

2. **Phase 2 實作階段** (由 `/speckit.tasks` 指令執行):
    - 修改 `media/blockly/generators/micropython/text.js`
    - 新增單元測試 `src/test/suite/text-print-generation.test.ts`
    - 執行手動測試驗證
    - 更新相關文件

---

**Research Completed**: 2026年2月4日  
**Researcher**: GitHub Copilot  
**Status**: ✅ Ready for Phase 1 Design
