# Implementation Plan: 鎖定函式積木 (Lock Function Block)

**Branch**: `050-lock-function-block` | **Date**: 2026-04-08 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/050-lock-function-block/spec.md`

## Summary

在函式定義積木（`arduino_function`、`procedures_defnoreturn`、`procedures_defreturn`）的右鍵選單中加入「鎖定積木」/「解鎖積木」切換選項。鎖定後：積木外觀改為灰色並顯示 🔒 圖示、名稱欄位不可編輯、刪除操作被拒絕、STACK 拖入/拖出操作被還原、mutator 參數修改不套用。鎖定狀態序列化至存檔 JSON，重開後自動恢復。鎖定/解鎖不進入 undo 佇列。

**技術方案**：
- 以 `Blockly.ContextMenuRegistry.registry.register()` 統一注冊右鍵選單（三種積木共用一個 entry）
- `arduino_function` 透過現有 XML Mutation 序列化 `locked="1"` 屬性
- MicroPython 積木透過包裹 `saveExtraState`/`loadExtraState` 序列化 `locked: true` 鍵
- STACK 保護使用 workspace `onchange` 事件監聽 + 移動還原策略
- 視覺效果使用新增的 `locked_procedure_blocks` 主題樣式

## Technical Context

**Language/Version**: JavaScript ES2023（WebView browser context）+ TypeScript 5.9.3（Extension Host）  
**Primary Dependencies**: Blockly 12.3.1、`Blockly.ContextMenuRegistry`、`Blockly.Events`  
**Storage**: Blockly JSON workspace 序列化（`.json` 專案檔）  
**Testing**: 手動測試（WebView Blockly 互動，契約測試框架不適用），`npm run validate:i18n`  
**Target Platform**: VS Code WebView（Browser Context）  
**Project Type**: VS Code Extension — WebView 積木編輯器功能擴充  
**Performance Goals**: 鎖定/解鎖切換視覺更新 < 500ms（SC-006）  
**Constraints**: 不可修改 Extension Host（`src/`）TypeScript 程式碼；所有實作均在 `media/blockly/` 中；不可使用 `console.log`（WebView 使用 `log.info`）  
**Scale/Scope**: 3 種積木類型 × 15 語系；主要影響單一檔案 `media/blockly/blocks/functions.js`  
**Interface Contracts**: 本功能不建立 `contracts/` 目錄。理由：所有實作均在 WebView JavaScript 內（`media/blockly/`），不新增任何 Extension Host ↔ WebView `postMessage` 指令、不呼叫 VS Code API、不新增 `src/` TypeScript 型別介面。`data-model.md`（方法簽名、序列化格式）扮演等效的內部介面合約角色。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 評估 | 結論 |
|---|---|---|
| I. Simplicity | 使用 Blockly 原生 API（`setDeletable`、`setStyle`、`ContextMenuRegistry`），無自訂框架 | ✅ Pass |
| II. Modularity | 鎖定邏輯集中在 `functions.js` 的方法中，context menu 在檔案底部統一注冊 | ✅ Pass |
| III. Avoid Over-Development | 只實作 spec 定義的 16 個 FR，不加密碼、不加角色管理 | ✅ Pass |
| IV. Flexibility | 使用資料驅動方式（`isLocked_` 屬性），可擴充支援更多積木類型 | ✅ Pass |
| VI. Structured Logging | 全部使用 `log.info()`/`log.error()`，無 `console.log` | ✅ Pass |
| VII. Test Coverage | WebView 互動採手動測試矩陣（quickstart.md），i18n 使用自動驗證 | ✅ Pass（含例外說明）|
| VIII. Pure Functions | `applyLockState_()` 為純副作用方法，`setLocked_()` 為外圍控制層 | ✅ Pass |
| IX. Traditional Chinese Docs | 所有規格文件均為繁體中文 | ✅ Pass |
| V. Research-Driven | 使用已知的 Blockly 12.3.1 ContextMenuRegistry API；ContextMenuRegistry 在 research.md Phase 0 已驗證 | N/A（無外部 API 版本不確定性）|
| X. Release Management | 本功能為 WebView 積木邏輯實作，不涉及版本發布操作 | N/A（發布由獨立 PR 流程處理）|
| XI. Agent Skills | 本功能未建立新 Agent Skill，使用現有 speckit 技能流程 | N/A（現有技能已足夠）|

**Gates after Phase 1 design**: 全部通過，無違規。

## Project Structure

### Documentation (this feature)

```text
specs/050-lock-function-block/
├── spec.md              # 功能規格
├── plan.md              # 本檔案（規劃輸出）
├── research.md          # Phase 0 研究結論
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 手動測試指南
└── tasks.md             # Phase 2 輸出（/speckit.tasks 指令建立）
```

### Source Code（本功能影響的檔案）

```text
media/
├── blockly/
│   ├── blocks/
│   │   └── functions.js          ★ 主要修改目標
│   │       ├── functionMutator.mutationToDom()   → 加入 locked 屬性序列化
│   │       ├── functionMutator.domToMutation()   → 讀取 locked 屬性並還原
│   │       ├── functionMutator.compose()         → 鎖定時 early return
│   │       ├── arduino_function.init()           → 初始化 isLocked_ = false
│   │       ├── arduino_function.setLocked_()     → 新增：鎖定控制入口
│   │       ├── arduino_function.applyLockState_() → 新增：套用視覺與行為
│   │       ├── (MicroPython procedures wrapping)  → 新增：saveExtraState/loadExtraState 包裹
│   │       └── registerFunctionLockMenu()         → 新增：ContextMenuRegistry 注冊
│   └── themes/
│       ├── singular.js            ★ 新增 locked_procedure_blocks 樣式
│       └── singularDark.js        ★ 新增 locked_procedure_blocks 樣式
└── locales/                       ★ 15 個語系
    ├── en/messages.js
    ├── zh-hant/messages.js
    ├── ja/messages.js
    └── ... (共 15 個)
```

**Structure Decision**: 單一 WebView 功能，所有修改均在 `media/` 目錄。不需要修改 `src/` Extension Host TypeScript 程式碼。不需要建立新檔案（只修改現有檔案）。

## Implementation Design

### 核心方法設計

#### `setLocked_(locked: boolean)`
定義於 `arduino_function` 積木物件，MicroPython 積木透過動態附加（`block.setLocked_ = lockFn`）。

```javascript
setLocked_: function(locked) {
    Blockly.Events.disable();
    try {
        this.isLocked_ = locked;
        this.applyLockState_(locked);
    } finally {
        Blockly.Events.enable();
    }
},
```

#### `applyLockState_(locked: boolean)`
```javascript
applyLockState_: function(locked) {
    // 1. 刪除保護（函式定義積木本身）
    this.setDeletable(!locked);
    // 2. 重新命名保護
    const nameField = this.getField('NAME');
    if (nameField) nameField.setEnabled(!locked);
    // 3. 視覺更新（主題色 + 🔒 圖示）
    if (locked) {
        this.setStyle('locked_procedure_blocks');
        // 在標題輸入的第一個位置插入 🔒 FieldLabel（若尚未存在）
        if (!this.getField('LOCK_ICON')) {
            this.getInput('').insertFieldAt(0, new Blockly.FieldLabel('🔒 '), 'LOCK_ICON');
        }
    } else {
        this.setStyle('procedure_blocks');
        // 移除 🔒 FieldLabel
        if (this.getField('LOCK_ICON')) {
            this.getInput('').removeField('LOCK_ICON');
        }
    }
    // 4. STACK 子積木刪除保護（FR-006：防止子積木被 Delete 鍵直接刪除）
    const stackConn = this.getInput('STACK')?.connection;
    let child = stackConn?.targetBlock();
    while (child) {
        child.setDeletable(!locked);
        child = child.getNextBlock();
    }
},
```

#### `functionMutator.compose()` 修改
```javascript
compose: function(containerBlock) {
    // 🔒 鎖定狀態下不套用 mutator 修改
    if (this.isLocked_) return;
    // ... 原有邏輯
},
```

#### STACK 保護（workspace onchange 監聽器）
在積木載入完成後（`functions.js` 底部）注冊全域監聽器，**需處理兩個案例**：

```javascript
function setupFunctionStackProtection(workspace) {
    workspace.addChangeListener((e) => {
        if (e.type !== Blockly.Events.BLOCK_MOVE) return;
        const block = workspace.getBlockById(e.blockId);
        if (!block) return;

        // 案例 A：積木被拖入鎖定函式的 STACK（FR-005）
        if (e.newParentId) {
            const newParent = workspace.getBlockById(e.newParentId);
            if (newParent?.isLocked_ && e.newInputName === 'STACK') {
                Blockly.Events.disable();
                try {
                    block.unplug();
                } finally {
                    Blockly.Events.enable();
                }
                return;
            }
        }

        // 案例 B：積木被從鎖定函式的 STACK 拖出（FR-006）
        if (e.oldParentId && e.oldInputName === 'STACK') {
            const oldParent = workspace.getBlockById(e.oldParentId);
            if (oldParent?.isLocked_) {
                Blockly.Events.disable();
                try {
                    // 重新連接回原 STACK 的末尾
                    const stackConn = oldParent.getInput('STACK').connection;
                    let lastConn = stackConn;
                    let cur = stackConn.targetBlock();
                    while (cur) { lastConn = cur.nextConnection; cur = cur.getNextBlock(); }
                    lastConn?.connect(block.previousConnection);
                } finally {
                    Blockly.Events.enable();
                }
            }
        }
    });
}
```

**工作區初始化注意事項**：`functions.js` 在 WebView 載入時執行，而 `window.workspace` 可能在稍後的 `blocklyEdit.js` 初始化後才建立。正確做法：
- 在 `functions.js` 底部嘗試立即注冊：`if (typeof window !== 'undefined' && window.workspace) { setupFunctionStackProtection(window.workspace); }`
- 同時在 `blocklyEdit.js` 的工作區建立完成後（`workspace` 賦值後）呼叫 `setupFunctionStackProtection(workspace)`
- 確保函式只注冊一次（可設 flag 或用 `workspace.hasChangeListener` 檢查）

#### `registerFunctionLockMenu()` ContextMenuRegistry 注冊
```javascript
function registerFunctionLockMenu() {
    Blockly.ContextMenuRegistry.registry.register({
        id: 'lock_function_block',
        weight: 100,
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        displayText: (scope) => {
            return scope.block.isLocked_
                ? window.languageManager.getMessage('FUNCTION_UNLOCK_BLOCK')
                : window.languageManager.getMessage('FUNCTION_LOCK_BLOCK');
        },
        preconditionFn: (scope) => {
            const type = scope.block?.type;
            return ['arduino_function', 'procedures_defnoreturn', 'procedures_defreturn'].includes(type)
                ? 'enabled' : 'hidden';
        },
        callback: (scope) => {
            scope.block.setLocked_(!scope.block.isLocked_);
        },
    });
}
registerFunctionLockMenu();
```

### 序列化整合

#### arduino_function mutationToDom
```javascript
mutationToDom: function() {
    const container = document.createElement('mutation');
    // ... 原有 arg 參數序列化 ...
    if (this.isLocked_) {
        container.setAttribute('locked', '1');
    }
    return container;
},
```

#### arduino_function domToMutation
```javascript
domToMutation: function(xmlElement) {
    // ... 原有參數反序列化 ...
    const locked = xmlElement.getAttribute('locked') === '1';
    if (locked) {
        this.isLocked_ = true;
        // 延遲套用：等 SVG 初始化完成
        setTimeout(() => this.applyLockState_(true), 0);
    }
},
```

#### MicroPython procedures saveExtraState/loadExtraState 包裹
在 `functions.js` 底部，積木定義完成後執行：

```javascript
function wrapMicropythonLock(blockType) {
    const proto = Blockly.Blocks[blockType];
    if (!proto) return;
    
    const origInit = proto.init;
    proto.init = function() {
        origInit.call(this);
        this.isLocked_ = false;
        this.setLocked_ = setLockedFn;
        this.applyLockState_ = applyLockStateFn;
        
        const origSave = this.saveExtraState?.bind(this);
        this.saveExtraState = function() {
            const state = origSave ? origSave() : {};
            if (this.isLocked_) state.locked = true;
            return state;
        };
        
        const origLoad = this.loadExtraState?.bind(this);
        this.loadExtraState = function(state) {
            if (origLoad) origLoad(state);
            if (state?.locked) {
                this.isLocked_ = true;
                setTimeout(() => this.applyLockState_(true), 0);
            }
        };
    };
}
['procedures_defnoreturn', 'procedures_defreturn'].forEach(wrapMicropythonLock);
```

## Complexity Tracking

> 無 Constitution 違規，此表格空白。

---

## 實作階段規劃

### 階段 1 — 主題樣式（可並行）
- `media/blockly/themes/singular.js`：新增 `locked_procedure_blocks` 樣式（`#9E9E9E`）
- `media/blockly/themes/singularDark.js`：新增 `locked_procedure_blocks` 樣式（`#757575`）

### 階段 2 — i18n（可與階段 1 並行）
- 在所有 15 個 `media/locales/*/messages.js` 新增 `FUNCTION_LOCK_BLOCK` 和 `FUNCTION_UNLOCK_BLOCK` 鍵

### 階段 3 — arduino_function 核心鎖定邏輯
- `arduino_function.init()`：初始化 `isLocked_ = false`
- 新增 `setLocked_()` 和 `applyLockState_()` 方法
- 修改 `functionMutator.mutationToDom()`：序列化 `locked` 屬性
- 修改 `functionMutator.domToMutation()`：反序列化並還原鎖定狀態
- 修改 `functionMutator.compose()`：鎖定時 early return

### 階段 4 — MicroPython 包裹
- `wrapMicropythonLock()` 函式包裹 `procedures_defnoreturn` 和 `procedures_defreturn`

### 階段 5 — STACK 保護
- 全域 workspace `onchange` 監聽器實作 STACK 移動還原邏輯

### 階段 6 — ContextMenuRegistry 注冊
- `registerFunctionLockMenu()` 在 `functions.js` 底部執行

### 階段 7 — 驗證
- `npm run validate:i18n`
- 手動測試矩陣（quickstart.md 中的測試 A–I）

### 對應 tasks.md 階段映射

> tasks.md 依使用者故事重新分組，階段編號與本計畫不同，對應關係如下：

| plan.md 階段 | 內容 | tasks.md Phase |
|---|---|---|
| 階段 1 | 主題樣式 | Phase 1: Setup (T001–T002) |
| 階段 2 | i18n | Phase 1: Setup (T003) |
| 階段 3 | arduino_function 核心邏輯 | Phase 2: Foundational (T004–T009) |
| 階段 4 | MicroPython 包裹 | Phase 6: US4 (T014–T016) |
| 階段 5 | STACK 保護 | Phase 3: US1 (T011) |
| 階段 6 | ContextMenuRegistry 注冊 | Phase 3: US1 (T010) |
| 階段 7 | 驗證 | Phase 3–7 + Final Phase (T012–T026) |

