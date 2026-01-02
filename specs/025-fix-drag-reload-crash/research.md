# Research: 修復拖曳時 FileWatcher 重載崩潰問題

**Date**: 2026-01-03  
**Feature**: 025-fix-drag-reload-crash

## 研究摘要

本文件記錄了為解決 FileWatcher 重載競態條件問題所進行的技術研究，包含 Blockly 拖曳 API、變數 API 遷移、以及剪貼簿操作處理的最佳實踐。

---

## 1. Blockly 拖曳狀態管理

### 1.1 BLOCK_DRAG 事件

**決定**: 使用 `Blockly.Events.BLOCK_DRAG` 事件搭配 `event.isStart` 屬性來追蹤拖曳狀態

**原理**:

-   Blockly 在積木拖曳開始時觸發 `BLOCK_DRAG` 事件，`event.isStart === true`
-   拖曳結束時觸發相同事件類型，但 `event.isStart === false`
-   這是 Blockly 官方推薦的拖曳狀態追蹤方式

**替代方案被拒絕因素**:

-   `workspace.isDragging()` 方法：在某些邊緣情況（如 InsertionMarkerPreviewer 期間）可能不準確
-   自訂滑鼠事件監聽：會與 Blockly 內部事件處理衝突

### 1.2 雙重拖曳檢查策略

**決定**: 採用 OR 邏輯同時檢查 `isDraggingBlock` 旗標和 `workspace.isDragging()`

**原理**:

```javascript
const isCurrentlyDragging = isDraggingBlock || workspace.isDragging();
```

-   `isDraggingBlock`: 自訂旗標，由 `BLOCK_DRAG` 事件維護，精確追蹤拖曳開始/結束
-   `workspace.isDragging()`: Blockly 內建 API，作為備用檢查
-   使用 OR 邏輯確保即使一個檢測機制失效，另一個仍能保護

**替代方案被拒絕因素**:

-   僅使用 `workspace.isDragging()`：在 InsertionMarker 顯示期間可能返回錯誤值
-   僅使用 `isDraggingBlock`：無法捕捉 Blockly 內部拖曳狀態

---

## 2. FileWatcher 重載延遲機制

### 2.1 待處理重載請求

**決定**: 使用單一變數 `pendingReloadFromFileWatcher` 暫存待處理的 `loadWorkspace` 訊息

**原理**:

-   當拖曳進行中收到 FileWatcher 觸發的重載請求，暫存而非立即執行
-   拖曳結束後檢查是否有待處理請求，若有則執行
-   只保留最新一筆請求，舊的被新的覆蓋

**替代方案被拒絕因素**:

-   佇列機制（保留所有請求）：過於複雜，且多次重載無意義
-   完全忽略拖曳期間的重載：可能導致工作區狀態與檔案不同步

### 2.2 重載來源標記

**決定**: 使用 `message.source === 'fileWatcher'` 區分 FileWatcher 觸發和其他來源

**原理**:

-   現有程式碼已使用此機制（`isLoadingFromFileWatcher`）
-   擴展此機制以支援延遲重載邏輯
-   Extension 側在發送訊息時設置 `source: 'fileWatcher'`

---

## 3. 剪貼簿操作鎖定機制

### 3.1 鍵盤事件監聽

**決定**: 監聽 `keydown` 事件偵測 Ctrl+C/V/X，設置 `isClipboardOperationInProgress` 旗標

**原理**:

-   剪貼簿操作（貼上大量積木）可能觸發多個 `BLOCK_CREATE` 事件
-   在操作期間立即儲存可能捕捉到不完整狀態
-   鎖定期間跳過自動儲存

**替代方案被拒絕因素**:

-   直接監聽 `BLOCK_CREATE` 事件計數：無法區分剪貼簿操作和一般拖放
-   使用 Clipboard API：瀏覽器安全限制，無法可靠偵測

### 3.2 動態延長鎖定

**決定**: 使用計時器機制，每次 `BLOCK_CREATE` 事件延長鎖定時間，但設置最大鎖定時間上限（5000ms）

**原理**:

```javascript
// 初始鎖定 300ms
clipboardLockStartTime = Date.now();
clipboardLockTimer = setTimeout(() => {
    isClipboardOperationInProgress = false;
    clipboardLockStartTime = null;
}, 300);

// BLOCK_CREATE 時延長（需檢查最大時間）
if (isClipboardOperationInProgress) {
    const elapsed = Date.now() - clipboardLockStartTime;
    if (elapsed < CLIPBOARD_MAX_LOCK_TIME) { // 5000ms
        clearTimeout(clipboardLockTimer);
        clipboardLockTimer = setTimeout(..., 300);
    }
    // 若已超過最大時間，不再延長，讓現有計時器自然超時
}
```

-   貼上大量積木時，每個積木建立事件重設計時器
-   確保所有積木建立完成後才解除鎖定
-   300ms 基於實測足以涵蓋 Blockly 內部處理時間
-   **新增**: 5000ms 最大鎖定時間防止無限延長

**替代方案被拒絕因素**:

-   無上限動態延長：可能導致無限鎖定
-   固定計數限制：不同操作規模差異大，固定計數不夠靈活

---

## 4. Blockly Variable API 遷移

### 4.1 棄用 API 識別

**決定**: 更新所有 `workspace.getAllVariables()` 和 `workspace.getVariableById()` 呼叫

**原理**:

-   Blockly v12 開始棄用直接的 workspace 變數方法
-   官方文件指出：「v12: 使用 `Blockly.Workspace.getVariableMap().getAllVariables()`」
-   為 Blockly v13 升級做準備

**遷移映射**:
| 舊 API | 新 API |
|--------|--------|
| `workspace.getAllVariables()` | `workspace.getVariableMap().getAllVariables()` |
| `workspace.getVariableById(id)` | `workspace.getVariableMap().getVariableById(id)` |

### 4.2 專案中的影響範圍

**搜尋結果**:

-   `blocklyEdit.js`: 已使用新 API（`getVariableMap().getAllVariables()`, `getVariableMap().getVariable()`）
-   `functions.js:148`: 仍使用 `workspace.getVariableById(varId)` ❌ 需更新

---

## 5. Debounce 時間調整

### 5.1 自動儲存 Debounce

**決定**: 將 debounce 時間從 150ms 增加到 300ms

**原理**:

-   現有 150ms 在大量積木操作時可能過短
-   Blockly 內部狀態更新可能需要更長時間
-   300ms 在響應速度和穩定性之間取得平衡

**替代方案被拒絕因素**:

-   500ms+：延遲過長影響使用體驗
-   100ms-：太短，問題仍可能發生

---

## 6. 實作決策總結

| 議題             | 決定                                                 | 理由                     |
| ---------------- | ---------------------------------------------------- | ------------------------ |
| 拖曳狀態追蹤     | `isDraggingBlock` + `workspace.isDragging()` OR 邏輯 | 雙重保險，涵蓋邊緣情況   |
| FileWatcher 重載 | 延遲至拖曳結束，只保留最新請求                       | 避免競態條件，簡化邏輯   |
| 剪貼簿鎖定       | keydown 偵測 + 動態延長計時器                        | 可靠偵測，自適應大量積木 |
| Variable API     | 遷移到 `getVariableMap()` 方法                       | 官方推薦，消除警告       |
| Debounce 時間    | 150ms → 300ms                                        | 提升穩定性，影響可忽略   |

---

## 7. 風險評估

| 風險                       | 影響 | 緩解措施                                   |
| -------------------------- | ---- | ------------------------------------------ |
| 延遲重載可能導致短暫不同步 | 低   | 拖曳結束後立即執行重載                     |
| 剪貼簿鎖定過長             | 低   | 動態機制自適應，最長不超過操作完成後 300ms |
| 新 API 相容性              | 無   | Blockly 12.3.1 已支援，向後相容            |
