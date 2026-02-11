# API 合約：積木警告與工作區事件

**功能分支**: `044-prevent-orphan-blocks`
**建立日期**: 2025-07-15

## 概述

定義積木警告系統與工作區事件處理的介面合約，確保孤立積木檢測與使用者回饋的一致性。

---

## 合約 1：控制積木 onchange 警告回呼

### 適用積木
以下積木的 Block 定義需新增或擴展 `onchange` 回呼：

| 積木類型 | 定義檔案 | 現有 onchange | 操作 |
|----------|----------|---------------|------|
| `controls_repeat_ext` | `media/blockly/blocks/loops.js` | 無 | 新增 |
| `controls_whileUntil` | `media/blockly/blocks/loops.js` | 無 | 新增 |
| `controls_for` | `media/blockly/blocks/loops.js` | 無 | 新增 |
| `controls_forEach` | `media/blockly/blocks/loops.js` | 無 | 新增 |
| `controls_if` | Blockly 內建 | 無自訂 | 透過 Extension 新增 |
| `singular_flow_statements` | `media/blockly/blocks/loops.js` | 已有（迴圈檢查） | 整合擴展 |
| `controls_duration` | `media/blockly/blocks/loops.js` | 無 | 新增 |

### onchange 回呼規範

```javascript
/**
 * 孤立積木警告 onchange 回呼
 * 適用於所有控制流程積木
 */
onchange: function () {
    // 1. 檢查積木是否在工作區中（排除 flyout 中的積木）
    if (!this.workspace || this.workspace.isFlyout) return;

    // 2. 使用共用 helper 檢查合法容器
    const isInContext = isInAllowedContext(this);

    // 3. 設定或清除警告
    if (isInContext) {
        this.setWarningText(null);
    } else {
        this.setWarningText(
            window.languageManager.getMessage('ORPHAN_BLOCK_WARNING') ||
            'This block must be placed inside setup(), loop(), or a function to generate code.'
        );
    }
}
```

### singular_flow_statements 整合規範

```javascript
/**
 * singular_flow_statements 擴展後的 onchange
 * 需同時檢查「迴圈內」與「合法容器內」
 */
onchange: function () {
    if (!this.workspace || this.workspace.isFlyout) return;

    // 1. 原有的迴圈檢查
    let inLoop = false;
    let block = this;
    do {
        block = block.getSurroundParent();
        if (!block) break;
        if (['controls_duration', 'controls_repeat', 'controls_repeat_ext',
             'controls_forEach', 'controls_for', 'controls_whileUntil'].includes(block.type)) {
            inLoop = true;
            break;
        }
    } while (block);

    // 2. 孤立容器檢查
    const inContext = isInAllowedContext(this);

    // 3. 警告優先序：孤立 > 不在迴圈內
    if (!inContext) {
        this.setWarningText(
            window.languageManager.getMessage('ORPHAN_BLOCK_WARNING') ||
            'This block must be placed inside setup(), loop(), or a function to generate code.'
        );
    } else if (!inLoop) {
        this.setWarningText(
            window.languageManager.getMessage('CONTROLS_FLOW_STATEMENTS_WARNING') ||
            'Break and continue statements can only be used within a loop.'
        );
    } else {
        this.setWarningText(null);
    }
}
```

---

## 合約 2：isInAllowedContext 共用 Helper

### 定義位置
- Arduino generator: `media/blockly/generators/arduino/index.js`
- MicroPython generator: `media/blockly/generators/micropython/index.js`
- Block 定義共用: `media/blockly/blocks/loops.js`（全域函式或 window 掛載）

### 共用方案

```javascript
/**
 * 全域共用的合法容器檢查函式
 * 掛載於 window 以供所有模組使用
 */
window.isInAllowedContext = function (block) {
    const ALLOWED_CONTAINERS = [
        'arduino_setup_loop',
        'arduino_function',
        'procedures_defnoreturn',
        'procedures_defreturn',
        'micropython_main',
    ];

    let current = block;
    while (current) {
        current = current.getSurroundParent();
        if (!current) return false;
        if (ALLOWED_CONTAINERS.includes(current.type)) return true;
    }
    return false;
};
```

### 行為保證
- **MUST** 回傳 `boolean`
- **MUST** 在無父層時回傳 `false`
- **MUST** 在遇到合法容器時立即回傳 `true`，不繼續遍歷
- **MUST** 正確處理多層嵌套（如 `loop()` 內的 `if` 內的 `while`）
- **MUST NOT** 將控制積木視為合法容器（防止嵌套孤立積木誤判）

---

## 合約 3：工作區事件處理

### 程式碼生成觸發

現有的 `debouncedCodeUpdate()` 機制（300ms debounce）已足以處理孤立積木過濾，因為過濾邏輯在 `workspaceToCode()` 內部執行。

### 警告更新觸發

`block.onchange` 由 Blockly 框架在以下事件時自動觸發：
- 積木建立（`BLOCK_CREATE`）
- 積木移動到新位置（`BLOCK_MOVE`）
- 積木結構變更（父層關係改變）
- 工作區載入完成（`FINISHED_LOADING`）

**不需要額外的 workspace change listener** — Blockly 的 `onchange` 機制已涵蓋所有需要的觸發場景。

---

## 合約 4：程式碼輸出註解格式

### Arduino C++ 註解
```cpp
// [Skipped] Orphan block: controls_whileUntil (not in setup/loop/function)
```

### MicroPython 註解
```python
# [Skipped] Orphan block: controls_whileUntil (not in setup/loop/function)
```

### 行為規範
- **MUST** 包含積木的 `type` 屬性
- **MUST** 使用一致的 `[Skipped]` 前綴
- **MUST** 以英文撰寫（程式碼註解可用英文，依憲法第 IX 原則）
- **MUST** 在 `workspaceToCode()` 過濾階段產生，非在 `forBlock` guard 階段
