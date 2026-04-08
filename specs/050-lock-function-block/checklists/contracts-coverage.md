# Interface Contract Coverage Checklist: 鎖定函式積木 (Lock Function Block)

**Purpose**: 驗證「不需要 contracts/ 目錄」的決策品質——確認現有規格文件（plan.md、data-model.md）是否足夠替代合約文件，以及跨邊界介面判斷是否完整
**Created**: 2026-04-08
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)

**背景說明**：`contracts/` 是 `/speckit.plan` Phase 1 的條件性輸出，僅在功能有跨邊界介面（Extension Host ↔ WebView postMessage、VS Code API 呼叫、新增 `src/` TypeScript 型別）時才需建立。本 checklist 驗證此判斷與對應的文件覆蓋範圍是否完整。

---

## Requirement Completeness — 跨邊界介面判斷

- [ ] CHK001 - plan.md 是否明確說明本功能「不新增任何 Extension Host ↔ WebView postMessage 指令」，並以此作為不建立 contracts/ 的主要依據？ [Completeness, Gap]
- [ ] CHK002 - plan.md Constraints 區段是否明確陳述「所有實作均在 `media/blockly/`，不需修改 `src/` TypeScript」的範疇限制？ [Clarity, Spec §Technical Context]
- [ ] CHK003 - spec.md 或 plan.md 是否說明鎖定狀態序列化（存入工作區 JSON）路徑與現有 Extension Host `fileService.ts` 的關係——確認不引入新的 Extension Host 介面依賴？ [Coverage, Gap]
- [ ] CHK004 - `setupFunctionStackProtection(workspace)` 被設計為在 `blocklyEdit.js` 中呼叫（plan.md 新增說明），是否有文件說明此呼叫點的觸發時機與介面規格，以避免實作時猜測？ [Completeness, Gap]

---

## Requirement Clarity — data-model.md 作為合約替代品

- [ ] CHK005 - data-model.md 的 `setLocked_(locked)` 方法定義是否包含：回傳型別、錯誤處理規格、呼叫前置條件（precondition）？ [Clarity, Spec §data-model.md]
- [ ] CHK006 - data-model.md 的 `applyLockState_(locked)` 是否明確說明各步驟的執行順序與相依關係（例如：必須在 SVG 初始化後才能呼叫 `setStyle`）？ [Clarity, Spec §data-model.md]
- [ ] CHK007 - XML 序列化格式（`locked="1"` 屬性）是否有版本標記或明確說明何時引入，以支援未來的格式演進？ [Completeness, Gap]
- [ ] CHK008 - JSON extra state 格式（`{ locked: true }`）是否說明了所有可能的值（true / undefined）及其對應語意，足夠作為合約使用？ [Clarity, Spec §data-model.md]

---

## Consistency — 介面邊界一致性

- [ ] CHK009 - tasks.md T011 新增的 `setupFunctionStackProtection(workspace)` 函式，其在 `functions.js` 與 `blocklyEdit.js` 兩個呼叫點是否在設計文件中一致描述了相同的介面簽名和行為？ [Consistency]
- [ ] CHK010 - `wrapMicropythonLock()` 動態附加 `setLocked_` 與 `applyLockState_` 到積木原型的方式，是否與 `arduino_function` 靜態定義這兩個方法的合約相容（可透過相同呼叫模式使用）？ [Consistency, Spec §plan.md]
- [ ] CHK011 - ContextMenuRegistry 注冊的 `id: 'lock_function_block'` 是否在設計文件中有唯一性聲明，確保不與現有或未來的 context menu 項目衝突？ [Consistency, Gap]

---

## Edge Case Coverage — 隱性介面風險

- [ ] CHK012 - 鎖定/解鎖後觸發 Blockly workspace 的 `workspaceChanged` 事件嗎？若是，是否有文件說明此行為對 Extension Host `workspaceValidator.ts` 或自動存檔機制的影響？ [Coverage, Gap]
- [ ] CHK013 - `setTimeout(() => this.applyLockState_(true), 0)` 的延遲執行設計，是否有文件說明在哪些情境下可能出現競態條件（race condition），以及其影響範圍？ [Edge Case, Gap]
- [ ] CHK014 - 若 `Blockly.FieldLabel` 在 WebView 初始化時尚未完成，是否有明確的退化行為描述確保不因缺少 `LOCK_ICON` 欄位操作而靜默失敗？ [Edge Case, Spec §plan.md]

---

## Decision Documentation — 「不需要 contracts/」的明確性

- [ ] CHK015 - plan.md 是否有任何段落明確記錄「本功能評估後不建立 contracts/ 目錄」及其判斷依據（純 WebView 實作、無跨邊界介面新增）？ [Completeness, Gap]
- [ ] CHK016 - 若未來功能延伸（例如：從 Extension Host 觸發積木鎖定狀態），規格文件是否有足夠的基礎讓繼任者判斷屆時需要建立 contracts/？ [Completeness, Gap]

---

## 說明

- 標記 `[Gap]` 的項目：目前設計文件中尚未明確記載，建議在 plan.md 或 data-model.md 中補充
- 標記 `[Spec §...]` 的項目：內容應已在指定文件中存在，需驗證是否足夠清晰
- CHK015 是本 checklist 核心問題：若此項為「否」，建議在 plan.md Technical Context 末尾新增一行說明
