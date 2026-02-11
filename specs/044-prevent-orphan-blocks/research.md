# 研究報告：防止孤立積木產生無效程式碼

**功能分支**: `044-prevent-orphan-blocks`
**研究日期**: 2025-07-15
**狀態**: 完成

## 研究摘要

本研究報告針對「防止孤立積木產生無效程式碼」功能進行技術可行性分析，涵蓋現有程式碼架構、Blockly 12.x API 能力、以及最佳實作模式的調查。

---

## 研究項目 1：Arduino Generator workspaceToCode 行為

### 決策
在 Arduino generator 新增自訂 `workspaceToCode()` 覆寫，採用與 MicroPython generator 相同的 `allowedTopLevelBlocks_` 過濾模式。

### 理由
- Arduino generator 目前 **未覆寫** `workspaceToCode()`，使用 Blockly.Generator 的預設實作
- 預設實作會對 **所有** 頂層積木呼叫 `blockToCode()`，包含孤立的控制積木
- MicroPython generator 已成功實作此模式（`allowedTopLevelBlocks_` + 自訂 `workspaceToCode`），可直接參考

### 已評估替代方案
1. **在 `finish()` 中過濾**：不可行，`finish()` 接收的是已生成的程式碼字串，無法辨識來源積木
2. **僅依賴個別 forBlock guard**：不充分，頂層過濾是第一層防護，guard 是深層防護
3. **修改 Blockly 核心**：違反模組化原則，且升級 Blockly 時會產生維護負擔

### 現有程式碼參考
```javascript
// MicroPython generator 已有的 workspaceToCode 覆寫模式
// 位置：media/blockly/generators/micropython/index.js (Line 106-148)
window.micropythonGenerator.workspaceToCode = function (workspace) {
    this.init(workspace);
    const blocks = workspace.getTopBlocks(true);
    let code = '';
    for (const block of blocks) {
        if (!block.isEnabled() || block.getInheritedDisabled()) continue;
        if (this.allowedTopLevelBlocks_.includes(block.type)) {
            const blockCode = this.blockToCode(block);
            if (typeof blockCode === 'string') code += blockCode;
        }
    }
    code = this.finish(code);
    return code;
};
```

---

## 研究項目 2：isInAllowedContext() Helper 設計

### 決策
建立共用的 `isInAllowedContext(block)` helper 函式，使用 `getSurroundParent()` 遞迴向上遍歷父層鏈。

### 理由
- `getSurroundParent()` 是 Blockly 12.x 官方支援的 API，回傳最近的 Statement 容器父層
- 現有 `singular_flow_statements` 積木已使用相同模式進行迴圈檢查，已驗證可行
- 純函式設計（輸入積木，輸出布林值），符合憲法第 VIII 原則

### 已評估替代方案
1. **使用 `getParent()`**：已棄用，且回傳的是直接父層而非容器，不適合多層嵌套
2. **使用 `getTopStackBlock()`**：只回傳同一 stack 的最頂層積木，無法判斷容器關係
3. **在 workspace 層級維護映射表**：過度複雜，違反 YAGNI 原則

### 合法容器類型
```javascript
// Arduino 模式
const ALLOWED_CONTAINERS_ARDUINO = [
    'arduino_setup_loop',    // setup() + loop() 容器
    'arduino_function',       // 自訂函式
    'procedures_defnoreturn', // 無回傳值函式
    'procedures_defreturn',   // 有回傳值函式
];

// MicroPython 模式
const ALLOWED_CONTAINERS_MICROPYTHON = [
    'micropython_main',       // 主程式容器
    'procedures_defnoreturn', // 無回傳值函式
    'procedures_defreturn',   // 有回傳值函式
    'arduino_function',       // 共用函式積木
];
```

### 實作策略
```javascript
function isInAllowedContext(block, allowedContainers) {
    let current = block;
    while (current) {
        current = current.getSurroundParent();
        if (!current) return false;
        if (allowedContainers.includes(current.type)) return true;
    }
    return false;
}
```

---

## 研究項目 3：alwaysGenerateBlocks_ 機制與共存

### 決策
在 Arduino `workspaceToCode` 覆寫中保留 `alwaysGenerateBlocks_` 的掃描邏輯，確保已註冊的 setup 類積木（如 `servo_setup`）不受過濾影響。

### 理由
- `alwaysGenerateBlocks_` 是 `arduino_setup_loop` forBlock 內的掃描機制
- 這些積木雖然放在工作區頂層，但其程式碼是在 `arduino_setup_loop` 處理時被掃描生成
- 過濾發生在 `workspaceToCode` 層級，`alwaysGenerateBlocks_` 的掃描發生在 `arduino_setup_loop.forBlock` 內部
- 兩個機制在不同層級運作，天然相容

### 已評估替代方案
1. **將 alwaysGenerateBlocks 也加入 allowedTopLevelBlocks**：不正確，因為這些積木的程式碼不應被 `workspaceToCode` 直接生成，而是由 `arduino_setup_loop` 的 forBlock 掃描處理
2. **合併兩個清單為統一機制**：增加複雜度且破壞現有行為

### 現有掃描程式碼
```javascript
// 位置：media/blockly/generators/arduino/index.js (Line 214-219)
const ws = Blockly.getMainWorkspace();
ws.getAllBlocks(false)
    .filter(b => window.arduinoGenerator.alwaysGenerateBlocks_.includes(b.type))
    .forEach(b => window.arduinoGenerator.forBlock[b.type](b));
```

---

## 研究項目 4：積木警告機制最佳實踐

### 決策
在控制流程積木的 block 定義中加入 `onchange` 回呼，使用 `setWarningText()` 顯示/清除警告，配合 `window.languageManager.getMessage()` 提供多語系支援。

### 理由
- `singular_flow_statements` 積木已使用此模式（`onchange` + `getSurroundParent()` + `setWarningText()`），驗證可行且穩定
- `block.onchange` 在積木結構變更（移入/移出容器）時自動觸發
- `setWarningText()` 是 Blockly 12.x 官方 API，會在積木上顯示黃色警告圖示
- `window.languageManager.getMessage()` 已整合 15 個語系的翻譯機制

### 已評估替代方案
1. **workspace.addChangeListener 集中處理**：需要遍歷所有積木，效能較差且邏輯分散
2. **自訂 WebView overlay**：需要自行追蹤積木位置與大小，過度複雜
3. **僅在 generator 輸出註解**：使用者無法在編輯時看到警告，回饋不即時

### 觸發時機
- `Blockly.Events.BLOCK_MOVE`：積木被拖放到新位置時
- `Blockly.Events.BLOCK_CREATE`：積木被建立（包含複製貼上）
- `Blockly.Events.FINISHED_LOADING`：工作區載入完成後（Undo/Redo 還原）

---

## 研究項目 5：需要加入 Guard 的控制流程積木

### 決策
在以下積木的 `forBlock` handler 中加入 `isInAllowedContext()` guard：

| 積木類型 | Arduino Generator | MicroPython Generator |
|----------|-------------------|----------------------|
| `controls_repeat_ext` | ✅ 加入 guard | ✅ 加入 guard |
| `controls_whileUntil` | ✅ 加入 guard | ✅ 加入 guard |
| `controls_for` | ✅ 加入 guard | ✅ 加入 guard |
| `controls_forEach` | ✅ 加入 guard | ✅ 加入 guard |
| `controls_if` | ✅ 加入 guard | ✅ 加入 guard |
| `singular_flow_statements` | ✅ 加入 guard | ✅ 加入 guard |
| `controls_duration` | ✅ 加入 guard（Arduino 專用）| N/A |

### 理由
- 這些是規格書明確指定的「控制/流程類積木」
- Guard 作為深層防護（defense-in-depth），即使 `workspaceToCode` 過濾失效也能防止程式碼生成
- Guard 回傳空字串 `''`，不影響其他積木的正常運作

### Guard 實作模式
```javascript
// 統一 guard 模式
window.arduinoGenerator.forBlock['controls_if'] = function (block) {
    // 深層防護：檢查是否在合法容器內
    if (!window.arduinoGenerator.isInAllowedContext(block)) {
        return '';
    }
    // ... 原有的程式碼生成邏輯 ...
};
```

---

## 研究項目 6：多語系警告訊息

### 決策
新增 `ORPHAN_BLOCK_WARNING` i18n 鍵值到所有 15 個語系檔案。

### 理由
- 現有 `CONTROLS_FLOW_STATEMENTS_WARNING` 僅針對 break/continue 在迴圈外的情境
- 孤立積木警告需要不同的訊息內容，告知使用者將積木放入 setup/loop/函式
- 需要涵蓋所有專案支援的語系（15 個）

### 已評估替代方案
1. **重用 `CONTROLS_FLOW_STATEMENTS_WARNING`**：訊息內容不同（迴圈 vs 容器）
2. **使用固定英文訊息**：違反 FR-008 多語系要求

### 翻譯鍵值設計
```javascript
// 新增鍵值：ORPHAN_BLOCK_WARNING
// 英文：'This block must be placed inside setup(), loop(), or a function to generate code.'
// 繁中：'此積木必須放在 setup()、loop() 或函式內才能產生程式碼。'
```

---

## 研究項目 7：被跳過積木的程式碼註解

### 決策
根據規格書 Clarification Session Q2 (Option A)，在輸出程式碼中為被跳過的孤立積木加入註解。

### 理由
- 使用者規格書明確選擇 Option A：在輸出程式碼中加入註解，包含積木 type 與簡短定位說明
- 註解幫助使用者理解為何某些積木未產生程式碼
- 不影響程式碼的正確性

### 實作方式
在 `workspaceToCode` 覆寫中，對被過濾的頂層積木加入註解：
```javascript
// 被跳過時的註解格式
// Arduino: // [Skipped] Orphan block: controls_whileUntil (not in setup/loop/function)
// MicroPython: # [Skipped] Orphan block: controls_whileUntil (not in setup/loop/function)
```

---

## 總結

所有「NEEDS CLARIFICATION」項目均已解決。技術方案的三層防護架構（workspaceToCode 過濾 → forBlock guard → 視覺警告）已完成可行性驗證，可進入 Phase 1 設計階段。
