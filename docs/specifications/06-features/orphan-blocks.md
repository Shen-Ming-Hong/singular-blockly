# 防止孤立積木規格

> 來源：spec/044-prevent-orphan-blocks（2026-02）

## 概述

**目標**：防止孤立（orphan）控制/流程類積木（如 while/for/if）在非合法容器（setup/loop/自訂函式）中產生程式碼，並提供視覺警告引導使用者正確操作。

**狀態**：✅ 完成

---

## 三層防護機制

### 第一層：`workspaceToCode` 過濾

在 `workspaceToCode` 函數中，掃描頂層積木，跳過不在允許清單中的積木，並在輸出程式碼中加入跳過註解：

```javascript
// Arduino 生成器
// [Skipped: controls_whileUntil - must be inside setup()/loop() or function]

// MicroPython 生成器
# [Skipped: controls_for - must be inside main() or function]
```

**允許的頂層積木**：

| 生成器      | 允許積木                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------ |
| Arduino     | `arduino_setup_loop`, `arduino_function`, `procedures_defnoreturn`, `procedures_defreturn` |
| MicroPython | `micropython_main`, `procedures_defnoreturn`, `procedures_defreturn`                       |

> ⚠️ `alwaysGenerateBlocks_`（如 setup 類積木）不受此過濾，永遠正常生成。

### 第二層：`forBlock` Guard

對以下控制/流程積木加入 `isInAllowedContext()` 檢查，若孤立則回傳空字串：

- `controls_whileUntil`
- `controls_for`
- `controls_forEach`
- `controls_repeat_ext`
- `controls_if`
- `controls_flow_statements`（break/continue）

```javascript
// 每個控制積木的 forBlock 開頭加入防護
arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
	if (!isInAllowedContext(block)) return '';
	// ... 原有生成邏輯
};
```

### 第三層：`onchange` 視覺警告

孤立積木透過 `setWarningText()` 顯示警告，說明需放入合法容器。警告訊息為 generator-specific：

- **Arduino**：「此積木需放置在 `setup()` / `loop()` 或自訂函式中」
- **MicroPython**：「此積木需放置在 `main()` 或自訂函式中」

積木移入合法容器後，警告自動消失。

使用 `wrapOnchange` 輔助函數（見 `media/blockly/blocks/loops.js`）一次性為多個積木掛載 `onchange` 處理器。

---

## `isInAllowedContext` 輔助函數

```javascript
/**
 * 判斷積木是否在允許的容器中（setup_loop、main、函式定義內）
 * @param {Blockly.Block} block
 * @returns {boolean}
 */
function isInAllowedContext(block) {
	const ALLOWED_PARENTS = new Set(['arduino_setup_loop', 'micropython_main', 'arduino_function', 'procedures_defnoreturn', 'procedures_defreturn']);

	let parent = block.getSurroundParent();
	while (parent) {
		if (ALLOWED_PARENTS.has(parent.type)) return true;
		parent = parent.getSurroundParent();
	}
	return false;
}
```

---

## i18n 訊息鍵

共 2 個 generator-specific 警告鍵，需覆蓋全部 15 種語言：

| 鍵名                               | 說明                     |
| ---------------------------------- | ------------------------ |
| `ORPHAN_BLOCK_WARNING_ARDUINO`     | Arduino 孤立積木警告     |
| `ORPHAN_BLOCK_WARNING_MICROPYTHON` | MicroPython 孤立積木警告 |

---

## 相關文件

- 積木定義：`media/blockly/blocks/loops.js`（`wrapOnchange` 模式）
- Arduino 生成器：`media/blockly/generators/arduino/arduino.js`（`workspaceToCode`）
- MicroPython 生成器：`media/blockly/generators/micropython/micropython.js`（`workspaceToCode`）
