# API 合約：Generator 層介面

**功能分支**: `044-prevent-orphan-blocks`
**建立日期**: 2025-07-15

## 概述

本功能不涉及 REST/GraphQL 外部 API。以下定義的是 JavaScript 內部介面合約，規範 Generator 層的函式簽名、輸入輸出與行為保證。

---

## 合約 1：isInAllowedContext(block)

### 簽名
```typescript
/**
 * 檢查積木是否位於合法的程式碼生成容器內
 * @param block - Blockly.Block 實例
 * @returns boolean - true 表示在合法容器內，false 表示孤立
 */
function isInAllowedContext(block: Blockly.Block): boolean
```

### 行為規範
- **MUST** 使用 `getSurroundParent()` 遞迴向上遍歷父層鏈
- **MUST** 在到達合法容器時回傳 `true`
- **MUST** 在父層鏈結束（到達工作區頂層）時回傳 `false`
- **MUST NOT** 產生任何副作用
- **MUST NOT** 修改積木狀態

### 合法容器判定
```typescript
// Arduino 模式合法容器
const ARDUINO_CONTAINERS = [
    'arduino_setup_loop',
    'arduino_function',
    'procedures_defnoreturn',
    'procedures_defreturn',
];

// MicroPython 模式合法容器
const MICROPYTHON_CONTAINERS = [
    'micropython_main',
    'arduino_function',
    'procedures_defnoreturn',
    'procedures_defreturn',
];
```

### 範例
```javascript
// 場景 1：積木在 loop() 內 → true
// [arduino_setup_loop] → [loop statement] → [controls_whileUntil]
isInAllowedContext(whileBlock); // → true

// 場景 2：積木在工作區空白處 → false
// [workspace root] → [controls_whileUntil]
isInAllowedContext(whileBlock); // → false

// 場景 3：積木嵌套在孤立積木內 → false
// [workspace root] → [controls_if] → [controls_whileUntil]
isInAllowedContext(whileBlock); // → false（controls_if 不是合法容器）
```

---

## 合約 2：workspaceToCode(workspace)（Arduino 覆寫）

### 簽名
```typescript
/**
 * 將工作區積木轉換為 Arduino C++ 程式碼，僅處理允許的頂層積木
 * @param workspace - Blockly.Workspace 實例
 * @returns string - 生成的 Arduino C++ 程式碼
 */
function workspaceToCode(workspace: Blockly.Workspace): string
```

### 行為規範
- **MUST** 呼叫 `this.init(workspace)` 初始化 generator 狀態
- **MUST** 使用 `workspace.getTopBlocks(true)` 取得排序後的頂層積木
- **MUST** 跳過 `!block.isEnabled()` 或 `block.getInheritedDisabled()` 的積木
- **MUST** 僅對 `allowedTopLevelBlocks_` 清單中的積木呼叫 `this.blockToCode(block)`
- **MUST** 為被跳過的非允許頂層積木加入程式碼註解
- **MUST** 呼叫 `this.finish(code)` 組裝最終程式碼
- **MUST NOT** 影響 `alwaysGenerateBlocks_` 的掃描邏輯（該邏輯在 `arduino_setup_loop.forBlock` 內部）

### 被跳過積木的註解格式
```cpp
// [Skipped] Orphan block: {blockType} (not in setup/loop/function)
```

### 與 MicroPython 實作的一致性
Arduino 覆寫 **MUST** 遵循與 MicroPython `workspaceToCode()` 相同的過濾模式。

---

## 合約 3：forBlock Guard 模式

### 簽名
```typescript
/**
 * 控制流程積木的 forBlock handler（含深層防護 guard）
 * @param block - Blockly.Block 實例
 * @returns string - 生成的程式碼，或空字串（孤立時）
 */
function forBlock_controlFlow(block: Blockly.Block): string
```

### 行為規範
- **MUST** 在函式開頭檢查 `isInAllowedContext(block)`
- **MUST** 在檢查失敗時回傳空字串 `''`
- **MUST NOT** 在檢查失敗時產生任何程式碼片段
- **MUST** 在檢查通過時執行原有的程式碼生成邏輯，行為完全不變

### 範例實作
```javascript
// 統一 guard 模式（適用於所有受防護的 forBlock）
window.arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
    // 深層防護：孤立積木不生成程式碼
    if (!window.arduinoGenerator.isInAllowedContext(block)) {
        return '';
    }
    // === 原有邏輯，完全不變 ===
    const until = block.getFieldValue('MODE') === 'UNTIL';
    // ...
};
```

---

## 合約 4：block.onchange 警告回呼

### 簽名
```typescript
/**
 * 積木的 onchange 回呼，用於檢查並設定孤立警告
 * 此函式在積木結構變更時自動觸發
 * @this Blockly.Block
 */
function onchange(this: Blockly.Block): void
```

### 行為規範
- **MUST** 使用 `isInAllowedContext(this)` 判斷積木是否孤立
- **MUST** 在孤立時呼叫 `this.setWarningText(message)` 設定警告
- **MUST** 在非孤立時呼叫 `this.setWarningText(null)` 清除警告
- **MUST** 根據當前 generator 模式選擇對應的 i18n 鍵：Arduino 模式使用 `window.languageManager.getMessage('ORPHAN_BLOCK_WARNING_ARDUINO')`，MicroPython 模式使用 `window.languageManager.getMessage('ORPHAN_BLOCK_WARNING_MICROPYTHON')`
- **MUST** 提供英文 fallback 訊息
- **MUST NOT** 與 `singular_flow_statements` 已有的迴圈檢查衝突

### 與現有警告的整合
- `singular_flow_statements` 保留原有的迴圈內檢查邏輯
- 新增的孤立檢查是**額外**的檢查層，兩者共存
- 優先顯示孤立警告（若積木同時孤立且不在迴圈內）

---

## 合約 5：i18n 鍵值

### 新增鍵值
```typescript
/**
 * i18n 鍵值定義
 * 必須在所有 15 個語系的 messages.js 中新增
 */
interface OrphanBlockI18n {
    /** 孤立積木警告訊息（Arduino 模式 — 提及 setup()/loop()/函式） */
    ORPHAN_BLOCK_WARNING_ARDUINO: string;
    /** 孤立積木警告訊息（MicroPython 模式 — 提及 main()/函式） */
    ORPHAN_BLOCK_WARNING_MICROPYTHON: string;
}
```

### 行為規範
- **MUST** 在所有 15 個語系檔案中新增 `ORPHAN_BLOCK_WARNING_ARDUINO` 和 `ORPHAN_BLOCK_WARNING_MICROPYTHON` 鍵值
- **MUST** Arduino 訊息內容提及 `setup()`、`loop()` 和函式；MicroPython 訊息內容提及 `main()` 和函式
- **MUST** 英文作為 fallback 預設值
- **MUST** 遵循 `window.languageManager.getMessage(key, defaultValue)` 呼叫模式
