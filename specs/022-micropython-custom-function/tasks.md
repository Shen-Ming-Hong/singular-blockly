# Tasks: MicroPython Custom Function Generator

**Input**: Design documents from `/specs/022-micropython-custom-function/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 無自動化測試需求（WebView UI 測試例外適用，將使用手動測試驗證）

**Organization**: 任務按 User Story 分組，確保每個 Story 可獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案，無相依性）
-   **[Story]**: 任務所屬的 User Story（例如 US1, US2, US3）
-   包含精確的檔案路徑

## Path Conventions

本專案為 VSCode Extension，源碼結構：

-   **Extension**: `src/`
-   **WebView Assets**: `media/blockly/generators/micropython/`
-   **Specs**: `specs/022-micropython-custom-function/`

---

## Phase 1: Setup (環境確認)

**Purpose**: 確認開發環境已就緒，熟悉相關程式碼

-   [ ] T001 確認開發環境：執行 `npm run watch` 並確認無編譯錯誤
-   [ ] T002 [P] 檢閱現有 Arduino 函數生成器程式碼 `media/blockly/generators/arduino/functions.js`
-   [ ] T003 [P] 檢閱現有 MicroPython 生成器架構 `media/blockly/generators/micropython/index.js`

---

## Phase 2: Foundational (基礎修改)

**Purpose**: 修改 MicroPython 生成器基礎設施，確保 `arduino_function` 可作為頂層積木

**⚠️ CRITICAL**: 此階段必須完成，否則函數定義會出現在錯誤位置

-   [ ] T004 **[CRITICAL]** [FR-006] 將 `'arduino_function'` 加入 `allowedTopLevelBlocks_` 陣列，位於 `media/blockly/generators/micropython/index.js`

**Checkpoint**: 基礎設施就緒 - 可開始實作 User Story

---

## Phase 3: User Story 1 - 自訂函數生成 Python 代碼 (Priority: P1) 🎯 MVP

**Goal**: 使用者在 CyberBrick Python 模式下建立自訂函數時，系統能正確生成 Python `def` 函數定義

**Independent Test**: 在 CyberBrick Python 模式建立一個無參數的自訂函數 `myFunction` 並呼叫，確認生成代碼語法正確且無錯誤

### Implementation for User Story 1

-   [ ] T005 [US1] [FR-001, FR-004, FR-005] 新增 `arduino_function` MicroPython 生成器於 `media/blockly/generators/micropython/functions.js`

    -   取得函數名稱（支援中文）
    -   生成 Python `def funcName():` 格式
    -   空函數體自動加入 `pass`
    -   使用 `generator.addFunction(funcName, code)` 將函數註冊到 `functions_` Map（確保函數定義輸出到頂層區塊）

-   [ ] T006 [US1] [FR-002, FR-007] 新增 `arduino_function_call` MicroPython 生成器於 `media/blockly/generators/micropython/functions.js`

    -   取得函數名稱
    -   生成 `funcName()\n` 呼叫語句

-   [ ] T007 [US1] 手動測試：驗證無參數自訂函數在 CyberBrick 模式下正確生成
    -   建立無參數函數
    -   在主程式中呼叫
    -   確認無 "MicroPython generator does not know how to generate code" 錯誤

**Checkpoint**: 此時 User Story 1 應該可獨立運作 - 無參數自訂函數功能完整

---

## Phase 4: User Story 2 - 帶參數的自訂函數 (Priority: P1)

**Goal**: 使用者能為自訂函數定義參數，並在呼叫時傳入不同的值

**Independent Test**: 建立一個帶有 2 個參數的自訂函數，在呼叫時傳入數值，確認生成代碼正確處理參數

### Implementation for User Story 2

-   [ ] T008 [US2] [FR-003, FR-004] 擴展 `arduino_function` 生成器支援參數，於 `media/blockly/generators/micropython/functions.js`

    -   讀取 `block.arguments_` 陣列
    -   生成 `def funcName(arg1, arg2):` 格式（忽略型別）

-   [ ] T009 [US2] [FR-007, FR-008] 擴展 `arduino_function_call` 生成器支援參數值，於 `media/blockly/generators/micropython/functions.js`

    -   使用 `generator.valueToCode()` 取得 `ARG0`, `ARG1`... 參數值
    -   未連接參數使用 `None` 作為預設值（參見 spec.md Edge Case 定義）
    -   生成 `funcName(value1, value2)\n` 呼叫語句

-   [ ] T010 [US2] 手動測試：驗證帶參數自訂函數在 CyberBrick 模式下正確生成
    -   建立帶 2 個參數的函數
    -   呼叫時傳入數值積木
    -   確認參數正確傳遞

**Checkpoint**: 此時 User Story 1 和 2 都應獨立運作 - 含參數的自訂函數功能完整

---

## Phase 5: User Story 3 - 函數定義位置正確 (Priority: P2)

**Goal**: 確保函數定義出現在生成程式碼的正確位置（`# [4] User Functions` 區塊），位於主程式之前

**Independent Test**: 建立函數並在主程式呼叫，檢查生成代碼結構符合 Python 語法規範

### Implementation for User Story 3

-   [ ] T011 [US3] [FR-006] 驗證 `generator.addFunction()` 正確註冊函數到 `functions_` Map

    -   確認 `finish()` 方法會將函數輸出到 `# [4] User Functions` 區塊
    -   確認函數定義在 `# [5] Main Program` 之前

-   [ ] T012 [US3] 手動測試：驗證函數定義位置
    -   建立多個自訂函數
    -   確認所有函數定義都在 `# [4] User Functions` 區塊
    -   確認函數定義在主程式之前

**Checkpoint**: 所有 User Stories 功能完整且位置正確

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 邊界案例處理與文件更新

-   [ ] T013 [P] 測試邊界案例：中文函數名稱

    -   建立中文名稱的函數（如「馬達控制」）
    -   確認名稱保留原樣

-   [ ] T014 [P] 測試邊界案例：空函數體

    -   建立無任何內容的函數
    -   確認生成 `pass` 語句

-   [ ] T015 [P] 測試邊界案例：多個函數

    -   建立多個自訂函數
    -   確認按工作區順序生成

-   [ ] T016 執行 quickstart.md 驗收清單完整驗證
    -   無參數函數生成正確
    -   帶參數函數生成正確
    -   空函數體生成 `pass`
    -   函數呼叫生成正確
    -   中文函數名稱保留原樣
    -   不再出現錯誤訊息

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依性 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻擋所有 User Stories**
-   **User Stories (Phase 3-5)**: 都依賴 Foundational 完成
    -   US1 和 US2 可平行（但建議 US1 先完成作為 MVP）
    -   US3 依賴 US1 完成（需有函數才能驗證位置）
-   **Polish (Phase 6)**: 依賴所有 User Stories 完成

### User Story Dependencies

-   **User Story 1 (P1)**: Foundational 完成後即可開始 - 無其他相依性
-   **User Story 2 (P1)**: Foundational 完成後即可開始 - 可與 US1 合併實作
-   **User Story 3 (P2)**: 需 US1 完成以驗證函數位置

### Within Each User Story

-   實作生成器程式碼
-   手動測試驗證
-   標記完成

### Parallel Opportunities

-   T002, T003 可平行（檢閱不同檔案）
-   T013, T014, T015 可平行（測試不同邊界案例）
-   US1 和 US2 的實作可合併（修改同一檔案，建議一起完成）

---

## Parallel Example: Phase 1 Setup

```bash
# 可同時執行：
Task T002: "檢閱現有 Arduino 函數生成器程式碼"
Task T003: "檢閱現有 MicroPython 生成器架構"
```

## Parallel Example: Phase 6 Polish

```bash
# 可同時執行：
Task T013: "測試邊界案例：中文函數名稱"
Task T014: "測試邊界案例：空函數體"
Task T015: "測試邊界案例：多個函數"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵** - 阻擋所有 Stories）
3. 完成 Phase 3: User Story 1（無參數函數）
4. **停止並驗證**：測試 User Story 1 獨立運作
5. 可部署/展示（MVP 完成！）

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. 加入 User Story 1 → 測試 → MVP 可展示
3. 加入 User Story 2 → 測試 → 參數功能完整
4. 加入 User Story 3 → 測試 → 位置驗證完成
5. 每個 Story 都不會破壞之前的功能

### Recommended Implementation Order

由於 US1 和 US2 修改同一檔案，建議合併實作：

1. T001 → T002, T003 (平行) → T004
2. T005 + T008 (合併：一次實作完整 `arduino_function` 生成器)
3. T006 + T009 (合併：一次實作完整 `arduino_function_call` 生成器)
4. T007, T010, T011, T012 (手動測試)
5. T013, T014, T015 (平行邊界測試) → T016

---

## Summary

| 指標                | 數值                           |
| ------------------- | ------------------------------ |
| 總任務數            | 16                             |
| User Story 1 任務數 | 3                              |
| User Story 2 任務數 | 3                              |
| User Story 3 任務數 | 2                              |
| 可平行機會          | 4 組                           |
| MVP 範圍            | Phase 1-3（US1 完成）          |
| 預估修改檔案        | 2 個（index.js, functions.js） |

---

## Notes

-   [P] 任務 = 不同檔案，無相依性
-   [Story] 標籤對應特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成與測試
-   每個任務或邏輯群組完成後提交
-   可在任何 Checkpoint 停止以獨立驗證 Story
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 相依性
