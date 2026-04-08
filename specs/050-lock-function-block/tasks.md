# Tasks: 鎖定函式積木 (Lock Function Block)

**Input**: Design documents from `/specs/050-lock-function-block/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案，無未完成前置依賴）
- **[Story]**: 對應的使用者故事（US1–US5）
- 所有路徑均為工作區根目錄的相對路徑

---

## Phase 1: Setup — 基礎視覺與語言資源

**Purpose**: 建立主題樣式與 i18n 翻譯鍵，所有後續積木邏輯均依賴這兩者。此階段兩個任務完全獨立、可並行。

- [ ] T001 [P] 在 `media/blockly/themes/singular.js` 的 `blockStyles` 區塊中、`procedure_blocks` 之後，新增 `locked_procedure_blocks` 樣式（`colourPrimary: '#9E9E9E'`, `colourSecondary: '#A3A3A3'`, `colourTertiary: '#ABABAB'`）
- [ ] T002 [P] 在 `media/blockly/themes/singularDark.js` 的 `blockStyles` 區塊中、`procedure_blocks` 之後，新增 `locked_procedure_blocks` 樣式（`colourPrimary: '#757575'`, `colourSecondary: '#7A7A7A'`, `colourTertiary: '#808080'`）
- [ ] T003 [P] 在所有 15 個 `media/locales/*/messages.js` 的 `FUNCTION_CALL` 鍵之後，新增 `FUNCTION_LOCK_BLOCK` 與 `FUNCTION_UNLOCK_BLOCK` 兩個 i18n 鍵（參見下方各語系翻譯表）

**T003 各語系翻譯對照表**:

| locale | `FUNCTION_LOCK_BLOCK` | `FUNCTION_UNLOCK_BLOCK` |
|---|---|---|
| `en` | `'Lock Block'` | `'Unlock Block'` |
| `zh-hant` | `'鎖定積木'` | `'解鎖積木'` |
| `ja` | `'ブロックをロック'` | `'ブロックのロック解除'` |
| `ko` | `'블록 잠금'` | `'블록 잠금 해제'` |
| `de` | `'Block sperren'` | `'Block entsperren'` |
| `fr` | `'Verrouiller le bloc'` | `'Déverrouiller le bloc'` |
| `es` | `'Bloquear bloque'` | `'Desbloquear bloque'` |
| `it` | `'Blocca il blocco'` | `'Sblocca il blocco'` |
| `pt-br` | `'Bloquear bloco'` | `'Desbloquear bloco'` |
| `ru` | `'Заблокировать блок'` | `'Разблокировать блок'` |
| `pl` | `'Zablokuj blok'` | `'Odblokuj blok'` |
| `cs` | `'Zamknout blok'` | `'Odemknout blok'` |
| `hu` | `'Blokk zárolása'` | `'Blokk zárolásának feloldása'` |
| `bg` | `'Заключване на блок'` | `'Отключване на блок'` |
| `tr` | `'Bloğu kilitle'` | `'Bloğun kilidini aç'` |

**Checkpoint**: T001–T003 完成後，可執行 `npm run validate:i18n` 確認翻譯鍵正確。

---

## Phase 2: Foundational — arduino_function 核心鎖定機制

**Purpose**: 實作 `arduino_function` 的鎖定核心邏輯，這是 US1（P1）的基礎，也是後續所有使用者故事的公共方法來源。**⚠️ 必須在 Phase 3 之前完成。**

**⚠️ CRITICAL**: Phase 3–6 的任何工作均需等待此階段完成。

- [ ] T004 在 `media/blockly/blocks/functions.js` 的 `arduino_function.init()` 函式末尾，初始化 `this.isLocked_ = false`（緊接現有 `this.oldName_ = 'myFunction'` 之後）
- [ ] T005 在 `media/blockly/blocks/functions.js` 的 `arduino_function` 積木物件中（緊接 `updateRelatedFunctionCalls` 方法之後），新增 `setLocked_()` 方法：包裹在 `Blockly.Events.disable()` / `Blockly.Events.enable()` 之間，設定 `this.isLocked_`，並呼叫 `applyLockState_()`（FR-014）
- [ ] T006 在 T005 的 `setLocked_()` 之後，新增 `applyLockState_()` 方法，按順序執行下列四個步驟：
  1. `this.setDeletable(!locked)` — 函式定義積木本身刪除保護
  2. `this.getField('NAME').setEnabled(!locked)` — 重新命名保護
  3. 當 locked=true：`this.setStyle('locked_procedure_blocks')` + `this.getInput('').insertFieldAt(0, new Blockly.FieldLabel('🔒 '), 'LOCK_ICON')`（需先檢查 `getField('LOCK_ICON')` 不存在才插入）；當 locked=false：`this.setStyle('procedure_blocks')` + `this.getInput('').removeField('LOCK_ICON')`（需先檢查 `getField('LOCK_ICON')` 存在才移除）
  4. 迭代 STACK 内子積木，對每個子積木呼叫 `child.setDeletable(!locked)`（FR-006：保護子積木不被 Delete 鍵直接刪除）：`const stackConn = this.getInput('STACK')?.connection; let child = stackConn?.targetBlock(); while (child) { child.setDeletable(!locked); child = child.getNextBlock(); }`
- [ ] T007 修改 `media/blockly/blocks/functions.js` 中的 `functionMutator.mutationToDom()`：在現有 `arg` 參數序列化之後、`return container` 之前，加入 `if (this.isLocked_) container.setAttribute('locked', '1');`
- [ ] T008 修改 `media/blockly/blocks/functions.js` 中的 `functionMutator.domToMutation()`：在現有參數反序列化完成（`this.updateShape_()` 呼叫）之後，加入讀取 `locked` 屬性的邏輯：`if (xmlElement.getAttribute('locked') === '1') { this.isLocked_ = true; setTimeout(() => this.applyLockState_(true), 0); }` 以確保 SVG 初始化完成後再套用（FR-009、FR-013 向下相容）
- [ ] T009 修改 `media/blockly/blocks/functions.js` 中的 `functionMutator.compose()`：在函式最開頭加入 `if (this.isLocked_) return;` 的 early return，防止鎖定時 mutator UI 修改套用（FR-004）

**Checkpoint**: T004–T009 完成後，`arduino_function` 積木應具備基本鎖定能力（Visual + 刪除保護 + 重命名保護 + mutator 保護 + 序列化）

---

## Phase 3: User Story 1 — 老師鎖定函式防止學生誤操作 (Priority: P1) 🎯 MVP

**Goal**: 老師可透過右鍵選單鎖定 `arduino_function`，鎖定後四種修改操作均被阻止，函式呼叫積木仍可正常使用。

**Independent Test**: 建立函式積木 → 右鍵鎖定 → 嘗試重新命名、增刪參數、拖入/拖出 STACK 積木、Delete 刪除，全部應被阻止；函式呼叫積木拖入 Setup/Loop 後程式碼正確生成（測試矩陣 A、quickstart.md）。

### US1 實作

- [ ] T010 [US1] 在 `media/blockly/blocks/functions.js` 底部（所有積木定義結束後），新增 `registerFunctionLockMenu()` 函式並立即呼叫：使用 `Blockly.ContextMenuRegistry.registry.register()` 注冊 id 為 `'lock_function_block'`、`scopeType` 為 `Blockly.ContextMenuRegistry.ScopeType.BLOCK` 的選單項目；`preconditionFn` 針對三種積木類型（`arduino_function`、`procedures_defnoreturn`、`procedures_defreturn`）返回 `'enabled'`，其他返回 `'hidden'`；`displayText` 依 `scope.block.isLocked_` 切換顯示 `FUNCTION_LOCK_BLOCK` 或 `FUNCTION_UNLOCK_BLOCK`；`callback` 呼叫 `scope.block.setLocked_(!scope.block.isLocked_)` (FR-001、FR-010)
- [ ] T011 [US1] 在 `media/blockly/blocks/functions.js` 底部，新增全域 workspace STACK 保護監聽器函式 `setupFunctionStackProtection(workspace)`，監聽 `Blockly.Events.BLOCK_MOVE` 事件，必須處理兩個案例：**案例 A 移入**（FR-005）：檢查 `e.newParentId` 指向鎖定積木且 `e.newInputName === 'STACK'` → `Events.disable()/enable()` 包裹執行 `block.unplug()`；**案例 B 移出**（FR-006）：檢查 `e.oldParentId` 指向鎖定積木且 `e.oldInputName === 'STACK'` → `Events.disable()/enable()` 包裹將積木重新連接回 STACK 末尾。執行時機：`functions.js` 底部先嘗試 `if (typeof window !== 'undefined' && window.workspace) { setupFunctionStackProtection(window.workspace); }`；同時必須在 `blocklyEdit.js` 的工作區建立完成後（`workspace` 賦值後）呼叫 `setupFunctionStackProtection(workspace)`，以確保不會漏掉保護。若需防止重複注冊，可用 `window._functionStackProtectionRegistered` flag 作為防重複旗標

**Checkpoint**: US1 完整可測：右鍵鎖定 → 四種操作被阻止 → 呼叫積木正常使用

---

## Phase 4: User Story 2 — 鎖定狀態持久化 (Priority: P2)

**Goal**: 鎖定的 `arduino_function` 儲存後重開，自動恢復鎖定狀態。

**Independent Test**: 鎖定函式 → Ctrl+S → 關閉重開 → 積木應顯示灰色 + 🔒，且所有限制仍有效（測試矩陣 B）。

### US2 實作

- [ ] T012 [US2] 驗證 T007（`mutationToDom` 加入 `locked="1"`）與 T008（`domToMutation` 讀取並還原）已正確實作；在儲存的 `.json` 檔案中確認包含 `locked="1"` XML 屬性；確認重開後視覺與行為限制均自動恢復。此為整合驗證任務，若 T007–T008 實作正確則無需額外修改程式碼（FR-009）

**Checkpoint**: US2 可測：存檔重開後鎖定狀態完整恢復

---

## Phase 5: User Story 3 — 解鎖恢復編輯 (Priority: P2)

**Goal**: 已鎖定的函式可透過右鍵「解鎖積木」恢復為可編輯狀態，右鍵選單正確 toggle。

**Independent Test**: 鎖定函式 → 右鍵確認顯示「解鎖積木」→ 點選解鎖 → 顏色恢復 🔒 消失 → 嘗試重新命名 → 成功（測試矩陣 A 步驟 11–12）。

### US3 實作

- [ ] T013 [US3] 驗證 T010 中 `registerFunctionLockMenu()` 的 `displayText` toggle 邏輯，以及 `callback` 中 `setLocked_(!isLocked_)` 的解鎖路徑；確認 `applyLockState_(false)` 正確還原 `setDeletable(true)`、`getField('NAME').setEnabled(true)` 與樣式回到 `procedure_blocks`。此為整合驗證任務，若 T005–T006、T010 實作正確則無需額外修改程式碼（FR-010）

**Checkpoint**: US3 可測：unlock → 所有編輯操作恢復可用，右鍵顯示「鎖定積木」

---

## Phase 6: User Story 4 — CyberBrick MicroPython 函式鎖定 (Priority: P3)

**Goal**: `procedures_defnoreturn` 和 `procedures_defreturn` 積木支援相同的鎖定行為，鎖定狀態透過 `saveExtraState`/`loadExtraState` 序列化。

**Independent Test**: 切換至 CyberBrick → 建立 MicroPython 函式 → 右鍵鎖定 → 驗證四種保護均有效 → 存檔重開 → 鎖定狀態恢復（測試矩陣 E）。

### US4 實作

- [ ] T014 [US4] 在 `media/blockly/blocks/functions.js` 底部（`registerFunctionLockMenu()` 之前），新增 `wrapMicropythonLock(blockType)` 函式：包裹目標積木的 `init()` 以注入 `isLocked_ = false`、`setLocked_()` 與 `applyLockState_()` 方法（可提取為模組層級共用函式）；同時包裹 `saveExtraState`（加入 `if (this.isLocked_) state.locked = true`）與 `loadExtraState`（讀取 `state?.locked` 並以 `setTimeout` 呼叫 `applyLockState_(true)`）（FR-002、FR-009）。**FR-015 注意**：`saveExtraState`/`loadExtraState` 同時就是 Blockly 12.x 複製貼上的序列化路徑，確保在複製貼上時 `locked: true` 輸出正確，副本才能保持鎖定狀態
- [ ] T015 [US4] 在 `wrapMicropythonLock()` 定義之後，立即對 `'procedures_defnoreturn'` 和 `'procedures_defreturn'` 各呼叫一次 `wrapMicropythonLock()`（FR-002）
- [ ] T016 [US4] 確認 T011 的 STACK 保護監聽器也適用於 MicroPython 積木（`procedures_defnoreturn`、`procedures_defreturn` 有 STACK 輸入）；若監聽器已透過鎖定積木的通用 `isLocked_` 屬性判斷，則無需額外修改

**Checkpoint**: US4 可測：CyberBrick 板鎖定 MicroPython 函式，行為與 Arduino 函式一致

---

## Phase 7: User Story 5 — 舊版擴充套件向下相容 (Priority: P1)

**Goal**: 不含鎖定功能的舊版擴充套件開啟含 `locked="1"` 的 JSON 時，工作區正常載入，積木以未鎖定狀態顯示，無任何錯誤。

**Independent Test**: 儲存含鎖定函式的專案 → 確認 XML mutation 含 `locked="1"` → 模擬舊版（暫時移除 `domToMutation` 中讀取 `locked` 的邏輯）→ 重開 → 無報錯、積木未鎖定（測試矩陣 F）。

### US5 實作

- [ ] T017 [US5] 驗證 T008 的 `domToMutation` 實作：確認讀取 `locked` 屬性使用 `getAttribute('locked') === '1'`（非必要屬性，無值時自然為 `null !== '1'`，不觸發鎖定），不新增任何 `required` 的屬性驗證或例外拋出（FR-013）
- [ ] T018 [US5] 驗證 T014 的 `loadExtraState` 包裹實作：確認舊 state 物件（無 `locked` 鍵）傳入時，`state?.locked` 為 `undefined`（falsy），不觸發 `applyLockState_`，且原始 `origLoad(state)` 正常執行（FR-013）

**Checkpoint**: US5 可測：模擬舊版開啟新版存檔，工作區正常無錯誤

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: i18n 驗證、Ctrl+Z 行為確認、複製貼上確認、整合測試

- [ ] T019 執行 `npm run validate:i18n` 確認 15 個語系的 `FUNCTION_LOCK_BLOCK` 與 `FUNCTION_UNLOCK_BLOCK` 鍵均通過驗證（SC-005）
- [ ] T020 [P] 執行手動測試矩陣 C（Ctrl+Z 無法復原鎖定）：鎖定積木 → 按 Ctrl+Z → 確認積木仍為鎖定狀態，驗證 T005 的 `Events.disable/enable` 包裹有效（FR-014）
- [ ] T021 [P] 執行手動測試矩陣 D（複製貼上保持鎖定）：**必須分別驗證兩種積木類型**：① `arduino_function`：鎖定積木 → Ctrl+C/V → 確認副本為鎖定狀態（XML mutation 包含 `locked="1"`）；② `procedures_defnoreturn`：鎖定 MicroPython 函式 → Ctrl+C/V → 確認副本為鎖定狀態（JSON extra state 包含 `locked: true`）—驗證 Blockly 12.x 複製貼上使用 `saveExtraState`/`loadExtraState` 路徑，確保 FR-015 對 MicroPython 積木同樣生效（FR-015）
- [ ] T022 [P] 執行手動測試矩陣 G（右鍵選單只在函式積木顯示）：對非函式積木右鍵 → 確認無「鎖定積木」選項（FR-001、FR-002 的 `preconditionFn` 返回 `'hidden'`）
- [ ] T023 [P] 執行手動測試矩陣 H（多積木獨立鎖定）：新增 3 個函式積木，只鎖定第 2 個 → 確認第 1、3 個正常可編輯
- [ ] T024 執行手動測試矩陣 A（完整鎖定/解鎖流程）、B（持久化）、E（MicroPython）、F（向下相容）的完整測試矩陣，並明確驗證 SC-001–SC-006：其中 **SC-001** 需記錄錄影或計時，確認右鍵鎖定操作完整流程（右鍵選單出現→選擇鎖定）可在 **30 秒內**完成，更新 quickstart.md 測試矩陣 A 平均時間記錄
- [ ] T025 [P] 執行 FR-016 驗證（非破壞性 STACK 右鍵操作）：鎖定函式積木 → 對 STACK 內子積木右鍵 → 確認【說明】、【折疊】、【展開】、【複製】等非修改性操作仍然可用；應被限制的選項（刪除、拖出 STACK）應被置灰或隱藏，驗證 FR-016：確認所有非破壞性操作仍可使用，結構性操作受到限制（FR-016）
- [ ] T026 [P] 執行 Edge Case 驗證（全選後刪除）：鎖定函式積木 → Ctrl+A 全選工作區所有積木 → 按 Delete → 確認鎖定的函式定義積木不被刪除，其餘可刪除積木正常刪除，驗證 `setDeletable(false)` 對 Blockly 全選刪除流程生效（spec Edge Cases）

---

## Dependencies（使用者故事完成順序）

```
Phase 1 (T001–T003) ─┐
Phase 2 (T004–T009) ─┤──→ Phase 3 (US1, P1) ─→ Phase 4 (US2, P2) ─→ Phase 5 (US3, P2)
                      └──→ Phase 6 (US4, P3)
Phase 7 (US5, P1) ─── 可在 Phase 2 完成後立即執行（驗證任務）
Final Phase ─── 所有 Phase 完成後
```

**User Story 完成順序**:
1. **Phase 1 + Phase 2** 必須最先完成（US1 和 US5 的基礎）
2. **US1 (P1)** + **US5 (P1)** 可在 Phase 2 完成後並行
3. **US2 (P2)** 依賴 US1
4. **US3 (P2)** 依賴 US1
5. **US4 (P3)** 依賴 Phase 1 + Phase 2

## Parallel Execution Examples

### 完全並行（不同檔案，無依賴）
- T001、T002、T003 可同時進行（三個不同檔案）
- T020、T021、T022、T023 可同時進行（手動測試，互不影響）

### Phase 2 內的依賴鏈
```
T004 → T005 → T006 （同一積木物件，需順序）
T007 → T008         （同一方法，需順序）
T009               （獨立，可與 T004–T006 並行）
```

### US4 內的依賴鏈
```
T014 → T015 → T016 （需順序）
```

## Implementation Strategy

**MVP Scope（最小可展示版本）**: Phase 1 + Phase 2 + Phase 3（US1）
- 完成後即可展示：右鍵鎖定 `arduino_function`，視覺變化 + 四種保護有效

**完整功能交付順序**:
1. Phase 1（T001–T003）：主題 + i18n
2. Phase 2（T004–T009）：核心鎖定邏輯
3. Phase 3（T010–T011）：US1 右鍵選單 + STACK 保護 → **MVP 達成**
4. Phase 4–5（T012–T013）：US2 持久化驗證 + US3 解鎖驗證（低成本）
5. Phase 6（T014–T016）：US4 MicroPython 支援
6. Phase 7（T017–T018）：US5 向下相容驗證
7. Final Phase（T019–T026）：整合驗證

---

## Task Count Summary

| Phase | Tasks | User Story | Priority |
|---|---|---|---|
| Phase 1: Setup | T001–T003 (3) | 基礎設施 | — |
| Phase 2: Foundational | T004–T009 (6) | 基礎設施 | — |
| Phase 3 | T010–T011 (2) | US1 | P1 🎯 MVP |
| Phase 4 | T012 (1) | US2 | P2 |
| Phase 5 | T013 (1) | US3 | P2 |
| Phase 6 | T014–T016 (3) | US4 | P3 |
| Phase 7 | T017–T018 (2) | US5 | P1 |
| Final Phase | T019–T026 (8) | 整合 | — |
| **合計** | **26 tasks** | | |
