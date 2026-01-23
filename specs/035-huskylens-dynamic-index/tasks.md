# Tasks: HuskyLens 積木動態編號輸入

**Input**: Design documents from `/specs/035-huskylens-dynamic-index/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 手動測試（WebView 積木互動），符合 Constitution VII UI Testing Exception

**Organization**: 任務依 User Story 分組，每個 Story 可獨立實作與測試

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可平行執行（不同檔案、無依賴）
- **[Story]**: 所屬 User Story（US1, US2, US3）
- 描述包含完整檔案路徑

## Path Conventions

- **積木定義**: `media/blockly/blocks/`
- **產生器**: `media/blockly/generators/arduino/`
- **工具箱**: `media/toolbox/categories/`

---

## Phase 1: Setup（共用基礎設施）

**Purpose**: 本功能無需專案初始化，直接修改現有檔案

> 本功能範圍小，無需 Setup 階段。直接進入 Foundational。

---

## Phase 2: Foundational（阻塞性前置作業）

**Purpose**: 核心基礎設施，所有 User Story 開始前必須完成

> 本功能無需 Foundational 階段。積木定義、產生器、toolbox 皆為獨立修改，無共用依賴。

**Checkpoint**: 基礎就緒 — 可直接開始 User Story 實作

---

## Phase 3: User Story 1 - 使用迴圈掃描所有偵測到的方塊 (Priority: P1) 🎯 MVP

**Goal**: 修改 `huskylens_get_block_info` 積木，使編號欄位可連接數字/變數積木

**Independent Test**: 從工具箱拖曳積木 → 連接變數積木到編號欄位 → 產生程式碼確認變數名稱正確

### Implementation for User Story 1

- [ ] T001 [US1] 修改 `huskylens_get_block_info` 積木定義：將 `FieldNumber` 改為 `appendValueInput('INDEX').setCheck('Number')`，並加入 `setInputsInline(true)` in `media/blockly/blocks/huskylens.js`
- [ ] T002 [US1] 更新 `huskylens_get_block_info` Arduino 產生器：將 `getFieldValue('INDEX')` 改為 `valueToCode(block, 'INDEX', ORDER_ATOMIC) || '0'` in `media/blockly/generators/arduino/huskylens.js`

**Checkpoint**: 方塊積木可接受動態編號，產生正確 Arduino 程式碼

---

## Phase 4: User Story 2 - 使用迴圈掃描所有偵測到的箭頭 (Priority: P1)

**Goal**: 修改 `huskylens_get_arrow_info` 積木，使編號欄位可連接數字/變數積木

**Independent Test**: 從工具箱拖曳箭頭積木 → 連接變數積木到編號欄位 → 產生程式碼確認變數名稱正確

### Implementation for User Story 2

- [ ] T003 [P] [US2] 修改 `huskylens_get_arrow_info` 積木定義：將 `FieldNumber` 改為 `appendValueInput('INDEX').setCheck('Number')`，並加入 `setInputsInline(true)` in `media/blockly/blocks/huskylens.js`
- [ ] T004 [P] [US2] 更新 `huskylens_get_arrow_info` Arduino 產生器：將 `getFieldValue('INDEX')` 改為 `valueToCode(block, 'INDEX', ORDER_ATOMIC) || '0'` in `media/blockly/generators/arduino/huskylens.js`

**Checkpoint**: 箭頭積木可接受動態編號，產生正確 Arduino 程式碼

---

## Phase 5: User Story 3 - 預設數字值維持使用體驗 (Priority: P2)

**Goal**: 工具箱中的積木預設包含數字 0 的 shadow block，維持新手使用體驗

**Independent Test**: 從工具箱拖曳積木到工作區，確認編號欄位已有預設數字 0

### Implementation for User Story 3

- [ ] T005 [US3] 更新工具箱設定：為 `huskylens_get_block_info` 新增 `inputs.INDEX.shadow` 設定（type: `math_number`, NUM: 0）in `media/toolbox/categories/vision-sensors.json`
- [ ] T006 [US3] 更新工具箱設定：為 `huskylens_get_arrow_info` 新增 `inputs.INDEX.shadow` 設定（type: `math_number`, NUM: 0）in `media/toolbox/categories/vision-sensors.json`

**Checkpoint**: 從工具箱拖曳的積木自動填入預設數字 0

---

## Phase 6: Polish & 驗證

**Purpose**: 整體驗證與品質確認

- [ ] T007 手動測試驗證：執行 `npm run watch` → F5 開啟 Extension Development Host → 測試所有 Acceptance Scenarios
- [ ] T008 產生程式碼驗證：建立包含 for 迴圈的測試積木組合，確認產生的 Arduino 程式碼語法正確

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1-2 (Setup/Foundational)**: 不適用 — 本功能無需初始化
- **Phase 3 (US1)**: 無前置依賴，可立即開始
- **Phase 4 (US2)**: 可與 Phase 3 平行進行（不同積木定義）
- **Phase 5 (US3)**: 依賴 Phase 3 & 4 完成（積木定義需先修改）
- **Phase 6 (Polish)**: 依賴所有 User Story 完成

### User Story Dependencies

- **User Story 1 (P1)**: 無依賴 — 可立即開始
- **User Story 2 (P1)**: 無依賴 — 可與 US1 平行進行
- **User Story 3 (P2)**: 依賴 US1 & US2 的積木定義修改完成

### Within Each User Story

- 積木定義修改 → 產生器更新（同檔案內順序）

### Parallel Opportunities

- T001 & T003 可平行執行（雖同檔案但不同積木定義區塊）
- T002 & T004 可平行執行（同檔案但不同產生器區塊）
- T005 & T006 可合併為單次編輯

---

## Parallel Example: User Stories 1 & 2

```bash
# 可平行執行的積木定義修改：
Task T001: "修改 huskylens_get_block_info 積木定義"
Task T003: "修改 huskylens_get_arrow_info 積木定義"

# 可平行執行的產生器更新：
Task T002: "更新 huskylens_get_block_info Arduino 產生器"
Task T004: "更新 huskylens_get_arrow_info Arduino 產生器"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 T001 & T002（方塊積木修改）
2. **STOP and VALIDATE**: 手動測試方塊積木功能
3. 繼續 User Story 2 & 3

### Incremental Delivery

1. US1 完成 → 測試方塊積木 → 可用（MVP!）
2. US2 完成 → 測試箭頭積木 → 功能對稱
3. US3 完成 → 測試預設值 → 使用體驗完整
4. 每個 Story 增加價值，不破壞前一個 Story

---

## Notes

- 本功能修改範圍小（3 檔案、8 任務），預估工時 < 2 小時
- 無需自動化測試（符合 Constitution VII UI Testing Exception）
- 所有修改遵循現有 Pixetto 積木實作模式
- Commit 建議：每個 User Story 完成後提交
