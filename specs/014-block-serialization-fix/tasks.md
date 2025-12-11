# Tasks: Blockly 積木 JSON 序列化修復

**Input**: Design documents from `/specs/014-block-serialization-fix/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 本功能主要依賴手動 WebView 測試（符合專案 Constitution 例外條款），自動測試為可選。

**Organization**: 任務按 User Story 分組，確保每個 Story 可獨立實作和測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案，無依賴）
-   **[Story]**: 任務所屬的 User Story（例如 US1, US2）
-   描述中包含完整檔案路徑

## Path Conventions

-   **積木定義**: `media/blockly/blocks/`
-   **程式碼生成器**: `media/blockly/generators/arduino/`
-   **測試**: `src/test/`（可選）

---

## Phase 1: Setup（基礎設置）

**Purpose**: 確認開發環境與理解現有程式碼

-   [ ] T001 切換到功能分支 `014-block-serialization-fix` 並執行 `npm run watch`
-   [ ] T002 閱讀 `media/blockly/blocks/motors.js` 中現有 encoder 積木定義，理解 `mutationToDom`/`domToMutation` 實作
-   [ ] T003 [P] 閱讀 `media/blockly/generators/arduino/index.js` 了解 `arduinoGenerator` 結構

---

## Phase 2: Foundational（基礎設施）

**Purpose**: 實作 `scrubNakedValue` 防護機制 - 這是所有 User Story 的前置需求

**⚠️ CRITICAL**: 必須先完成此階段，確保即使序列化失敗也不會產生編譯錯誤

-   [ ] T004 在 `media/blockly/generators/arduino/index.js` 中實作 `arduinoGenerator.scrubNakedValue` 方法，將獨立 value block 轉為註釋
-   [ ] T005 手動測試：放置獨立的 `math_number` 積木，確認生成的程式碼為註釋而非裸露數字

**Checkpoint**: scrubNakedValue 防護機制就緒，獨立 value block 不再造成編譯錯誤

---

## Phase 3: User Story 1 - 編碼馬達積木序列化修復 (Priority: P1) 🎯 MVP

**Goal**: 修復 5 個 encoder 積木的 JSON 序列化，確保連接關係在保存後正確保持

**Independent Test**: 建立 `encoder_read` 連接到 `text_print` 的積木組合 → 保存 → 重新載入 → 確認連接保持且程式碼生成正確

### Implementation for User Story 1

#### encoder_setup 積木

-   [ ] T006 [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_setup` 積木添加 `saveExtraState` 方法，返回 `{ useInterrupt: boolean }`
-   [ ] T007 [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_setup` 積木添加 `loadExtraState` 方法，還原 `useInterruptPins_` 並更新 UI

#### encoder_read 積木（用戶報告的主要問題）

-   [ ] T008 [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_read` 積木添加 `saveExtraState` 方法，返回 `{ encoder: string }`
-   [ ] T009 [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_read` 積木添加 `loadExtraState` 方法，還原 `restoredEncoderValue` 和欄位值

#### encoder_reset 積木

-   [ ] T010 [P] [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_reset` 積木添加 `saveExtraState` 方法，返回 `{ encoder: string }`
-   [ ] T011 [P] [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_reset` 積木添加 `loadExtraState` 方法，還原 `restoredEncoderValue` 和欄位值

#### encoder_pid_setup 積木

-   [ ] T012 [P] [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_pid_setup` 積木添加 `saveExtraState` 方法，返回 `{ encoder: string }`
-   [ ] T013 [P] [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_pid_setup` 積木添加 `loadExtraState` 方法，還原 `restoredEncoderValue` 和欄位值

#### encoder_pid_compute 積木

-   [ ] T014 [P] [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_pid_compute` 積木添加 `saveExtraState` 方法，返回 `{ pid: string }`
-   [ ] T015 [P] [US1] 在 `media/blockly/blocks/motors.js` 中為 `encoder_pid_compute` 積木添加 `loadExtraState` 方法，還原 `restoredPIDValue` 和欄位值

#### User Story 1 驗證

-   [ ] T016 [US1] 手動測試：建立 `encoder_setup` + `encoder_read` 連接到 `text_print` 的積木組合，保存後重新載入，確認連接關係正確保持
-   [ ] T017 [US1] 手動測試：檢查生成的程式碼，確認 `myEncoder.getCount()` 出現在正確的上下文中（如 `Serial.println()`）
-   [ ] T018 [US1] 手動測試：載入舊版 `main.json`（只有 XML extraState），確認 encoder 積木狀態正確還原（向後相容）

**Checkpoint**: 所有 5 個 encoder 積木的 JSON 序列化已修復，連接關係在保存/載入後正確保持

---

## Phase 4: User Story 2 - 裸露表達式防護機制 (Priority: P1)

**Goal**: 確保獨立的 value block 不會產生裸露表達式，避免編譯錯誤

**Independent Test**: 故意將 value block 獨立放置 → 生成程式碼 → 確認無裸露表達式

### Implementation for User Story 2

-   [ ] T019 [US2] 手動測試：故意將 `encoder_read` 獨立放置（不連接到任何積木），確認生成的程式碼為 `// 未連接的表達式: myEncoder.getCount()` 而非裸露表達式
-   [ ] T020 [US2] 手動測試：獨立放置 `math_number` 積木，確認該數字不會作為裸露表達式出現在程式碼中
-   [ ] T021 [US2] 手動測試：測試混合情境 - 工作區同時有已連接和獨立的 encoder 積木，確認各自生成正確的程式碼

**Checkpoint**: scrubNakedValue 防護機制完整運作，所有獨立 value block 都轉為註釋

---

## Phase 5: Edge Cases（邊界情況測試）

**Purpose**: 驗證各種邊界情況的處理

-   [ ] T022 手動測試：複製含 mutation 的 encoder 積木後，貼上並確認新積木的序列化正確
-   [ ] T023 手動測試：執行 Undo/Redo 操作後，確認 encoder 積木的序列化狀態一致
-   [ ] T024 手動測試：在工作區建立多個不同名稱的編碼馬達，確認各自的序列化獨立正確
-   [ ] T025 手動測試：測試 dropdown 欄位值為預設值或空值時，序列化是否能正確處理

**Checkpoint**: 所有邊界情況處理正確

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 程式碼品質與文件更新

-   [ ] T026 [P] 執行 `npm run lint` 確認程式碼符合 ESLint 規範
-   [ ] T027 [P] 在程式碼中添加描述性註釋，說明 JSON hooks 的用途
-   [ ] T028 更新 `specs/014-block-serialization-fix/quickstart.md` 的檢查清單，標記所有完成項目
-   [ ] T029 執行 quickstart.md 中的所有驗證步驟，確認功能完整

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - 阻擋所有 User Story
-   **User Story 1 (Phase 3)**: 依賴 Foundational 完成
-   **User Story 2 (Phase 4)**: 依賴 Foundational 完成（可與 US1 平行）
-   **Edge Cases (Phase 5)**: 依賴 US1 和 US2 完成
-   **Polish (Phase 6)**: 依賴所有 User Story 完成

### User Story Dependencies

-   **User Story 1 (P1)**: Foundational 完成後可開始 - 這是核心修復
-   **User Story 2 (P1)**: Foundational 完成後可開始 - 實際上 Foundational 階段已包含 scrubNakedValue 實作，此 Phase 主要是驗證

### Within User Story 1

-   encoder_setup (T006-T007) 無依賴，可首先完成
-   encoder_read (T008-T009) 無依賴，可與其他積木平行（推薦優先，因是用戶報告問題）
-   encoder_reset (T010-T011)、encoder_pid_setup (T012-T013)、encoder_pid_compute (T014-T015) 可完全平行
-   驗證任務 (T016-T018) 依賴所有積木修改完成

### Parallel Opportunities

-   T002 和 T003：可同時閱讀不同檔案
-   T010-T015：所有帶 [P] 標記的積木修改可平行執行（不同積木定義，無衝突）
-   T026-T027：Polish 階段的 [P] 任務可平行

---

## Parallel Example: User Story 1

```bash
# 同時修改所有 encoder 積木（不同程式碼區塊，無衝突）：
# 注意：encoder_read 建議優先，因是用戶報告的主要問題

Task T008: "encoder_read saveExtraState"
Task T009: "encoder_read loadExtraState"

# 以下可與 encoder_read 平行：
Task T010: "encoder_reset saveExtraState"
Task T011: "encoder_reset loadExtraState"
Task T012: "encoder_pid_setup saveExtraState"
Task T013: "encoder_pid_setup loadExtraState"
Task T014: "encoder_pid_compute saveExtraState"
Task T015: "encoder_pid_compute loadExtraState"
```

---

## Implementation Strategy

### MVP First (僅 User Story 1)

1. 完成 Phase 1: Setup（理解現有程式碼）
2. 完成 Phase 2: Foundational（scrubNakedValue 防護）
3. 完成 Phase 3: User Story 1（encoder 積木序列化修復）
4. **驗證**: 執行 T016-T018 測試
5. 如通過，MVP 即完成！

### Incremental Delivery

1. Setup + Foundational → 防護機制就緒
2. User Story 1 → 測試通過 → **核心問題已修復** ✅
3. User Story 2 驗證 → 確認防護機制運作
4. Edge Cases → 確保穩健性
5. Polish → 程式碼品質

### 單人開發推薦順序

1. T001-T003（Setup）
2. T004-T005（Foundational）
3. T008-T009（encoder_read - 用戶報告問題）
4. T016（快速驗證修復是否有效）
5. T006-T007, T010-T015（其餘 encoder 積木）
6. T017-T018（完整驗證）
7. T019-T029（剩餘任務）

---

## Notes

-   [P] 標記 = 不同檔案或程式碼區塊，無依賴
-   [US1]/[US2] 標記 = 任務所屬 User Story，便於追蹤
-   所有修改都在同一個檔案 `motors.js`，但針對不同積木定義，可分批完成
-   建議在每個積木修改後執行手動測試，確保功能正確
-   保留現有 XML hooks 確保向後相容，**不要刪除** `mutationToDom`/`domToMutation`
-   提交時建議按 User Story 分組：先提交 scrubNakedValue，再提交 encoder 積木修復
