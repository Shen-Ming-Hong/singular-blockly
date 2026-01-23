# Tasks: HuskyLens ID-Based Block Query

**Input**: Design documents from `/specs/036-huskylens-id-blocks/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/block-api.md ✓, quickstart.md ✓

**Tests**: 依據 Constitution Principle VII UI Testing Exception，本功能使用手動測試（WebView 積木拖曳），不需要自動化測試任務。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **積木定義**: `media/blockly/blocks/huskylens.js`
- **Arduino 生成器**: `media/blockly/generators/arduino/huskylens.js`
- **Toolbox**: `media/toolbox/categories/vision-sensors.json`
- **翻譯檔案**: `media/locales/{lang}/messages.js`

---

## Phase 1: Setup (共用翻譯鍵)

**Purpose**: 新增所有語言的翻譯鍵，為後續積木開發做準備

- [ ] T001 [P] 新增繁體中文翻譯鍵至 media/locales/zh-hant/messages.js
- [ ] T002 [P] 新增英文翻譯鍵至 media/locales/en/messages.js
- [ ] T003 [P] 新增日文翻譯鍵至 media/locales/ja/messages.js
- [ ] T004 [P] 新增韓文翻譯鍵至 media/locales/ko/messages.js
- [ ] T005 [P] 新增西班牙文翻譯鍵至 media/locales/es/messages.js
- [ ] T006 [P] 新增法文翻譯鍵至 media/locales/fr/messages.js
- [ ] T007 [P] 新增德文翻譯鍵至 media/locales/de/messages.js
- [ ] T008 [P] 新增義大利文翻譯鍵至 media/locales/it/messages.js
- [ ] T009 [P] 新增俄文翻譯鍵至 media/locales/ru/messages.js
- [ ] T010 [P] 新增葡萄牙文(巴西)翻譯鍵至 media/locales/pt-br/messages.js
- [ ] T011 [P] 新增波蘭文翻譯鍵至 media/locales/pl/messages.js
- [ ] T012 [P] 新增匈牙利文翻譯鍵至 media/locales/hu/messages.js
- [ ] T013 [P] 新增土耳其文翻譯鍵至 media/locales/tr/messages.js
- [ ] T014 [P] 新增保加利亞文翻譯鍵至 media/locales/bg/messages.js
- [ ] T015 [P] 新增捷克文翻譯鍵至 media/locales/cs/messages.js
- [ ] T016 執行 npm run validate:i18n 驗證翻譯完整性

**Checkpoint**: 翻譯鍵準備完成，所有 15 種語言翻譯就緒

---

## Phase 2: Foundational (Toolbox 配置)

**Purpose**: 更新 Toolbox 以顯示新積木分類

**⚠️ CRITICAL**: Toolbox 配置必須先完成，積木才能在 UI 中顯示

- [ ] T017 新增分隔線和標籤到 media/toolbox/categories/vision-sensors.json
- [ ] T018 [P] 新增 huskylens_request_blocks_id 積木條目到 vision-sensors.json
- [ ] T019 [P] 新增 huskylens_count_blocks_id 積木條目到 vision-sensors.json
- [ ] T020 [P] 新增 huskylens_get_block_id 積木條目到 vision-sensors.json

**Checkpoint**: Toolbox 配置完成，積木位置定義就緒

---

## Phase 3: User Story 1 - 追蹤特定學習物件的位置 (Priority: P1) 🎯 MVP

**Goal**: 使用者可透過「依 ID 取得方塊資訊」積木直接取得特定 ID 物件的座標，無需迴圈遍歷

**Independent Test**: 在 Blockly 編輯器中拖曳「依 ID 取得方塊資訊」積木，設定 ID=1、索引=0、屬性=xCenter，驗證生成的程式碼為 `huskylens.getBlock(1, 0).xCenter`

### Implementation for User Story 1

- [ ] T021 [US1] 新增 huskylens_get_block_id 積木定義至 media/blockly/blocks/huskylens.js
- [ ] T022 [US1] 新增 huskylens_get_block_id 生成器至 media/blockly/generators/arduino/huskylens.js
- [ ] T023 [US1] 在 huskylens.js IIFE 中註冊 huskylens_get_block_id 為 AlwaysGenerateBlock

**Checkpoint**: User Story 1 功能完成，使用者可透過積木取得特定 ID 的方塊屬性

---

## Phase 4: User Story 2 - 只請求特定 ID 的辨識結果 (Priority: P2)

**Goal**: 使用者可透過「依 ID 請求辨識結果」積木只請求包含該 ID 的結果，優化效率

**Independent Test**: 在 Blockly 編輯器中使用「依 ID 請求辨識結果」積木，設定 ID=2，驗證生成程式碼為 `huskylens.requestBlocks(2);`

### Implementation for User Story 2

- [ ] T024 [US2] 新增 huskylens_request_blocks_id 積木定義至 media/blockly/blocks/huskylens.js
- [ ] T025 [US2] 新增 huskylens_request_blocks_id 生成器至 media/blockly/generators/arduino/huskylens.js
- [ ] T026 [US2] 在 huskylens.js IIFE 中註冊 huskylens_request_blocks_id 為 AlwaysGenerateBlock

**Checkpoint**: User Story 2 功能完成，使用者可請求特定 ID 的方塊

---

## Phase 5: User Story 3 - 依 ID 取得方塊數量 (Priority: P3)

**Goal**: 使用者可透過「依 ID 取得方塊數量」積木取得畫面中特定 ID 物件的數量

**Independent Test**: 使用「依 ID 取得方塊數量」積木，設定 ID=1，驗證生成程式碼為 `huskylens.countBlocks(1)`

### Implementation for User Story 3

- [ ] T027 [US3] 新增 huskylens_count_blocks_id 積木定義至 media/blockly/blocks/huskylens.js
- [ ] T028 [US3] 新增 huskylens_count_blocks_id 生成器至 media/blockly/generators/arduino/huskylens.js
- [ ] T029 [US3] 在 huskylens.js IIFE 中註冊 huskylens_count_blocks_id 為 AlwaysGenerateBlock

**Checkpoint**: 所有 User Stories 功能完成，三個新積木皆可正常運作

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 驗證、文件更新與最終檢查

- [ ] T030 執行 npm run generate:dictionary 更新 MCP block dictionary
- [ ] T031 手動測試：按 F5 啟動 Extension Development Host 驗證積木顯示
- [ ] T032 手動測試：拖曳三個新積木並驗證程式碼生成
- [ ] T033 手動測試：切換語言驗證翻譯顯示正確
- [ ] T034 執行 quickstart.md 驗證流程

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - 可立即開始翻譯工作
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS 所有 User Stories
- **User Stories (Phase 3-5)**: 全部依賴 Foundational phase 完成
    - User Stories 可平行進行（如有多人開發）
    - 或依優先順序進行 (P1 → P2 → P3)
- **Polish (Phase 6)**: 依賴所有 User Stories 完成

### User Story Dependencies

- **User Story 1 (P1)**: 完成 Phase 2 後即可開始 - 無其他 Story 依賴
- **User Story 2 (P2)**: 完成 Phase 2 後即可開始 - 獨立於 US1
- **User Story 3 (P3)**: 完成 Phase 2 後即可開始 - 獨立於 US1/US2

### Within Each User Story

- 積木定義 → 生成器 → IIFE 註冊
- 每個 Story 完成後可獨立測試

### Parallel Opportunities

- T001-T015: 所有翻譯任務可同時進行
- T018-T020: Toolbox 條目可同時進行
- Phase 3-5: 不同 User Stories 可由不同開發者同時進行

---

## Parallel Example: Phase 1 - 翻譯任務

```bash
# 同時進行所有翻譯任務:
Task: "新增繁體中文翻譯鍵至 media/locales/zh-hant/messages.js"
Task: "新增英文翻譯鍵至 media/locales/en/messages.js"
Task: "新增日文翻譯鍵至 media/locales/ja/messages.js"
# ... (其他 12 種語言同時進行)
```

## Parallel Example: Phase 3-5 - User Stories

```bash
# 多人開發時可同時進行:
Developer A: Phase 3 (User Story 1 - huskylens_get_block_id)
Developer B: Phase 4 (User Story 2 - huskylens_request_blocks_id)
Developer C: Phase 5 (User Story 3 - huskylens_count_blocks_id)
```

---

## Implementation Strategy

### MVP First (僅 User Story 1)

1. 完成 Phase 1: Setup (翻譯)
2. 完成 Phase 2: Foundational (Toolbox)
3. 完成 Phase 3: User Story 1 (huskylens_get_block_id)
4. **STOP and VALIDATE**: 手動測試 User Story 1
5. 若時程緊迫可先發布 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎建設完成
2. 加入 User Story 1 → 測試 → 部署 (MVP!)
3. 加入 User Story 2 → 測試 → 部署
4. 加入 User Story 3 → 測試 → 部署
5. 每個 Story 獨立增加價值，不影響已完成功能

### Single Developer Strategy

1. 完成 Phase 1 (T001-T016)
2. 完成 Phase 2 (T017-T020)
3. 依序完成 Phase 3 → Phase 4 → Phase 5
4. 完成 Phase 6 驗證

---

## Notes

- [P] tasks = 不同檔案，無相依性，可平行執行
- [Story] label 將任務對應到特定 User Story 以便追蹤
- 每個 User Story 可獨立完成與測試
- 依據 Constitution Principle VII，WebView UI 使用手動測試
- 每個任務完成後應 commit
- 可在任何 Checkpoint 停下來驗證已完成的 Story

---

## 翻譯鍵參考 (來自 contracts/block-api.md)

### 需新增的翻譯鍵

```javascript
// HuskyLens ID-Based 積木
HUSKYLENS_BY_ID_LABEL: '依 ID 查詢',
HUSKYLENS_REQUEST_BLOCKS_ID: '請求 HUSKYLENS ID',
HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX: '的方塊',
HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: '只請求特定 ID 的方塊辨識結果，可提高效率',
HUSKYLENS_COUNT_BLOCKS_ID: 'HUSKYLENS ID',
HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX: '的方塊數量',
HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: '取得特定 ID 的方塊數量',
HUSKYLENS_GET_BLOCK_ID: '取得 ID',
HUSKYLENS_GET_BLOCK_ID_INDEX: '的第',
HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX: '個方塊的',
HUSKYLENS_GET_BLOCK_ID_TOOLTIP: '取得特定 ID 方塊的位置、大小或 ID 資訊',
```

### 重用現有翻譯鍵

- `HUSKYLENS_X_CENTER`
- `HUSKYLENS_Y_CENTER`
- `HUSKYLENS_WIDTH`
- `HUSKYLENS_HEIGHT`
- `HUSKYLENS_ID`
