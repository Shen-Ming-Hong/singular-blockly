# 研究報告：鎖定函式積木 (Lock Function Block)

**Phase**: 0 — 技術研究  
**Branch**: `050-lock-function-block`  
**Date**: 2026-04-08

---

## 1. Blockly ContextMenuRegistry API

### 決定
使用 `Blockly.ContextMenuRegistry.registry.register()` 以 `ScopeType.BLOCK` 範圍，統一為三種函式積木注冊右鍵選單項目。

### 理由
- Blockly 12.x 的官方 API 為 `ContextMenuRegistry`；`customContextMenu()` 仍可用但為舊式做法，且需要在每個積木定義中個別新增。
- 使用 registry 可在一個地方控制三種積木（`arduino_function`、`procedures_defnoreturn`、`procedures_defreturn`），減少重複。

### 替代方案評估
| 方案 | 評估 |
|---|---|
| `block.customContextMenu()` | 需在三個積木定義中分別新增，重複程式碼 |
| `Blockly.ContextMenuRegistry.registry.register()` ✅ | 統一注冊，`preconditionFn` 過濾積木類型，最簡潔 |

### API 形式
```javascript
Blockly.ContextMenuRegistry.registry.register({
    id: 'lock_function_block',
    weight: 100,
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    displayText: (scope) => {
        const block = scope.block;
        return block.isLocked_
            ? window.languageManager.getMessage('FUNCTION_UNLOCK_BLOCK')
            : window.languageManager.getMessage('FUNCTION_LOCK_BLOCK');
    },
    preconditionFn: (scope) => {
        const type = scope.block?.type;
        return ['arduino_function', 'procedures_defnoreturn', 'procedures_defreturn'].includes(type)
            ? 'enabled'
            : 'hidden';
    },
    callback: (scope) => {
        const block = scope.block;
        block.setLocked_(!block.isLocked_);
    },
});
```

---

## 2. 鎖定行為實作策略

### 決定
使用 `applyLockState_()` 方法，透過 Blockly 原生 API 組合達成四種保護：

| 保護目標 | Blockly API |
|---|---|
| 防止刪除整個積木 | `block.setDeletable(!locked)` |
| 防止重新命名 | `this.getField('NAME').setEnabled(!locked)` |
| 防止修改 STACK（拖入/拖出）| `onchange` guard: `Blockly.Events.BLOCK_MOVE` + `e.reason` 包含 `connect`/`disconnect` |
| 防止 mutator 修改參數 | 覆寫 `compose()`: locked 時直接 return，不修改 `arguments_` |

### 重要細節—STACK 保護
Blockly 沒有直接鎖定 Statement Input 的 API，因此使用事件監聽 + 還原策略：
- 監聽 `Blockly.Events.BLOCK_MOVE`
- 若被移動積木的父積木是鎖定的函式積木，且目標是 STACK 輸入 → 還原移動（`block.unplug()`，回到原位置）
- 此還原需包在 `Blockly.Events.disable()` / `Blockly.Events.enable()` 裡，避免還原動作本身進入 undo 佇列

### 重要細節—Undo 不可復原（FR-014）
鎖定/解鎖呼叫 `applyLockState_()` 前後，包裹 `Blockly.Events.disable()` / `Blockly.Events.enable()`，使鎖定操作不進入 undo 佇列。

### 替代方案評估
| 方案 | 評估 |
|---|---|
| `block.setEditable(false)` | 會一次停用所有欄位（包括應該保留的折疊按鈕），過度鎖定 |
| `StatementInput.connection.setShadowDom()` | 不適用，shadow 只影響空連接的預設值 |
| `onchange` + 還原 ✅ | 精準控制，可選擇性保護 |

---

## 3. 序列化策略

### arduino_function（XML Mutation）

**決定**：在現有 `mutationToDom`/`domToMutation` 中加入 `locked` 屬性。

```xml
<!-- 鎖定時 -->
<mutation locked="1">
  <arg name="x" type="int"/>
</mutation>

<!-- 未鎖定時（舊版相容）-->
<mutation>
  <arg name="x" type="int"/>
</mutation>
```

- 舊版 `domToMutation` 讀取 `xmlElement.childNodes`，完全不處理未知屬性 → **自動向下相容 ✅**
- `domToMutation` 讀取 `locked` 屬性後呼叫 `applyLockState_()`

### procedures_defnoreturn / procedures_defreturn（JSON saveExtraState）

**決定**：包裹（wrap）原生 `saveExtraState`/`loadExtraState`，在 state 物件中加入 `locked` 鍵。

```javascript
// 包裹 saveExtraState
const originalSave = block.saveExtraState.bind(block);
block.saveExtraState = function() {
    const state = originalSave();
    if (this.isLocked_) state.locked = true;
    return state;
};

// 包裹 loadExtraState
const originalLoad = block.loadExtraState.bind(block);
block.loadExtraState = function(state) {
    originalLoad(state);
    if (state.locked) this.applyLockState_(true);
};
```

- MicroPython procedures 透過 JSON 序列化，不使用 XML mutationToDom → **不可用 XML 方法 ✅**
- 舊版 `loadExtraState` 只讀已知鍵，忽略 `locked` → **自動向下相容 ✅**

---

## 4. 視覺設計

### 決定
- **顏色**：新增 `locked_procedure_blocks` 主題樣式（灰褐色，兩個主題均需新增），鎖定時 `setStyle('locked_procedure_blocks')`，解鎖時恢復 `setStyle('procedure_blocks')`
- **🔒 圖示**：在 `MAIN` Input 的第一個 FieldLabel 位置插入圖示欄位，或將現有第一個 FieldLabel 文字前加 `🔒` 前綴

### 顏色規格（提案）

| 主題 | `colourPrimary` | 說明 |
|---|---|---|
| singular (淺色) | `#9E9E9E` | 中性灰，明顯區別於未鎖定的靛藍 `#7986CB` |
| singularDark (深色) | `#757575` | 稍深的灰，在深色背景下仍清晰可見 |

### 替代方案評估
| 方案 | 評估 |
|---|---|
| `block.setColour()` 直接設定十六進位 | 繞過主題系統，不推薦 |
| `setStyle('locked_procedure_blocks')` ✅ | 符合現有主題架構，易於維護 |

---

## 5. 複製貼上保持鎖定（FR-015）

### 決定
在 `arduino_function.onchange` 監聽 `Blockly.Events.CREATE` 事件，若新建積木有 `isLocked_ === true`（來自 XML mutation 的 `domToMutation` 已設定），則確認 `applyLockState_(true)` 已被呼叫。

MicroPython 積木的複製貼上經由 `saveExtraState`/`loadExtraState`，新增積木時若 state 包含 `locked: true` 即自動套用。

---

## 6. STACK 內子積木的非修改性操作（FR-016）

### 決定
STACK 移動保護只攔截「目標父積木為鎖定函式積木的 STACK 輸入」的連接/斷連事件，不影響：
- 子積木本身的折疊/展開（不觸發 BLOCK_MOVE）
- 右鍵說明（BLOCK_HELP 事件）
- 子積木之間的順序調整（**在** STACK 內部移動仍需攔截，因為這屬於 STACK 結構性修改）

---

## 7. 模組入口點

Context Menu 的 `register()` 呼叫須在所有積木定義載入後執行。建議在 `functions.js` 底部，在所有積木 `Blockly.Blocks[...]` 定義完成後，加入一個 `registerFunctionLockMenu()` 函式並立即呼叫。

---

## NEEDS CLARIFICATION 已全部解決

| 項目 | 狀態 |
|---|---|
| Blockly ContextMenuRegistry API 形式 | ✅ 已確認 |
| STACK 保護機制 | ✅ onchange + 還原策略 |
| Mutator compose 保護 | ✅ 條件式 early return |
| XML vs JSON 序列化 | ✅ 兩種積木各用對應策略 |
| Undo 不進佇列 | ✅ Events.disable/enable 包裹 |
| 複製貼上保持鎖定 | ✅ 透過序列化自然保持 |
| 視覺設計 | ✅ 主題樣式 + 積木首行 🔒 圖示 |
