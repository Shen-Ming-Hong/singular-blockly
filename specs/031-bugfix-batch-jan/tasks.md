# Tasks: January 2026 Bugfix Batch

**Input**: Design documents from `/specs/031-bugfix-batch-jan/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 確認開發環境和分支準備

- [ ] T001 切換到功能分支 `031-bugfix-batch-jan` 並確認環境
- [ ] T002 [P] 執行 `npm run watch` 確認編譯無錯誤

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基礎設施，必須在實作 User Story 前完成

**⚠️ CRITICAL**: 無基礎相依性 - 四個 bug 為獨立修復，可直接進入 User Story 階段

**Checkpoint**: 無基礎設施阻擋項，直接進入 User Story 實作

---

## Phase 3: User Story 1 - Delete Duplicate Main Program Blocks (Priority: P1) 🎯 MVP

**Goal**: 讓使用者能夠刪除多餘的主程式積木，並限制新積木只能有一個實例

**Independent Test**: 載入包含多個 `micropython_main` 的專案，驗證能否刪除多餘積木；切換至 CyberBrick 模式，驗證無法從工具箱拖曳第二個主程式積木

### Implementation for User Story 1

- [ ] T003 [US1] 在 `media/js/blocklyEdit.js` 的 `Blockly.inject()` 添加 `maxInstances` 配置限制主程式積木為單一實例
- [ ] T004 [US1] 在 `media/js/blocklyEdit.js` 實作 `updateMainBlockDeletable()` 函數，動態控制 deletable 狀態
- [ ] T005 [US1] 在 `media/js/blocklyEdit.js` 的 `loadWorkspace` 處理後呼叫 `updateMainBlockDeletable()`
- [ ] T006 [US1] 在 `media/js/blocklyEdit.js` 添加 workspace change listener 監聽 `BLOCK_DELETE` 和 `BLOCK_CREATE` 事件，重新計算 deletable 狀態
- [ ] T007 [P] [US1] 在 `media/blockly/blocks/arduino.js` 的 `arduino_setup_loop` 積木定義中添加 `this.setDeletable(false)`
- [ ] T008 [US1] 在多積木偵測時透過 `postMessage` 顯示 Toast 警告訊息，使用 `languageManager.getMessage('MAIN_BLOCK_DUPLICATE_WARNING', '偵測到多個主程式積木，請刪除多餘的積木')` 取得翻譯文字
- [ ] T009 [US1] 手動測試：載入舊專案含多個主程式積木 → 確認可刪除多餘 → 確認最後一個不可刪除
- [ ] T010 [US1] 手動測試：CyberBrick 模式拖曳第二個 `micropython_main` → 確認被阻止

**Checkpoint**: User Story 1 完成 - 主程式積木刪除限制功能正常運作

---

## Phase 4: User Story 2 - Preview Backup File Successfully (Priority: P2)

**Goal**: 使用者點擊備份預覽按鈕後能正確開啟 JSON 檔案

**Independent Test**: 點擊備份管理中的預覽按鈕，驗證檔案是否正確開啟

### Implementation for User Story 2

- [ ] T011 [US2] 修改 `src/webview/messageHandler.ts` 的 `handlePreviewBackup()` 方法，將 `fullPath` 包裝為 `vscode.Uri.file()`
- [ ] T012 [P] [US2] 更新 `src/test/suite/messageHandler.test.ts` 添加備份預覽 URI 單元測試
- [ ] T013 [US2] 手動測試：點擊備份預覽按鈕 → 確認檔案正確開啟

**Checkpoint**: User Story 2 完成 - 備份預覽功能正常運作

---

## Phase 5: User Story 3 - Auto Backup Before Restore (Priority: P2)

**Goal**: 還原備份前自動備份當前工作區狀態

**Independent Test**: 執行還原操作後，檢查 `blockly/backup/` 目錄是否有新的 `auto_restore_*` 檔案

### Implementation for User Story 3

- [ ] T014 [US3] 修改 `src/webview/messageHandler.ts` 的 `handleRestoreBackup()` 方法，在 `copyFile()` 前檢查 `main.json` 是否存在
- [ ] T015 [US3] 在 `handleRestoreBackup()` 實作自動備份邏輯：生成 `auto_restore_YYYYMMDD_HHMMSS.json` 並複製
- [ ] T016 [US3] 修改 `backupRestored` 回應訊息，添加 `autoBackupName` 欄位
- [ ] T017 [P] [US3] 更新 `src/test/suite/messageHandler.test.ts` 添加還原前自動備份單元測試
- [ ] T018 [US3] 手動測試：還原備份 → 確認 `auto_restore_*` 備份已建立 → 確認備份列表顯示

**Checkpoint**: User Story 3 完成 - 還原前自動備份功能正常運作

---

## Phase 6: User Story 4 - Correct Translation for Loop Blocks (Priority: P3)

**Goal**: 建立翻譯鍵掃描工具並補充所有缺失的 Blockly.Msg 翻譯鍵

**Independent Test**: 切換到英文模式，檢查迴圈積木顯示 "do"；執行 `npm run scan:blockly-msg` 確認無缺失鍵

### Implementation for User Story 4

- [ ] T019 [US4] 建立 `scripts/i18n/scan-blockly-msg.js` 掃描工具：從 Blockly 官方訊息檔案提取所有 Msg 鍵
- [ ] T020 [US4] 在掃描工具中實作比對邏輯：掃描專案積木定義找出使用的鍵，比對翻譯檔案識別缺失
- [ ] T021 [US4] 在掃描工具中實作報告輸出：鍵名、英文預設值、受影響積木類型
- [ ] T022 [US4] 在 `package.json` 添加 `npm run scan:blockly-msg` script
- [ ] T023 [US4] 執行掃描工具產生缺失報告
- [ ] T024 [P] [US4] 補充 `media/locales/en/messages.js` 缺失翻譯鍵（含 `CONTROLS_REPEAT_INPUT_DO`、`MAIN_BLOCK_DUPLICATE_WARNING`）
- [ ] T025 [P] [US4] 補充 `media/locales/zh-hant/messages.js` 缺失翻譯鍵
- [ ] T026 [P] [US4] 補充 `media/locales/ja/messages.js` 缺失翻譯鍵
- [ ] T027 [P] [US4] 補充 `media/locales/ko/messages.js` 缺失翻譯鍵
- [ ] T028 [P] [US4] 補充 `media/locales/de/messages.js` 缺失翻譯鍵
- [ ] T029 [P] [US4] 補充 `media/locales/fr/messages.js` 缺失翻譯鍵
- [ ] T030 [P] [US4] 補充 `media/locales/es/messages.js` 缺失翻譯鍵
- [ ] T031 [P] [US4] 補充 `media/locales/pt-br/messages.js` 缺失翻譯鍵
- [ ] T032 [P] [US4] 補充 `media/locales/it/messages.js` 缺失翻譯鍵
- [ ] T033 [P] [US4] 補充 `media/locales/ru/messages.js` 缺失翻譯鍵
- [ ] T034 [P] [US4] 補充 `media/locales/pl/messages.js` 缺失翻譯鍵
- [ ] T035 [P] [US4] 補充 `media/locales/hu/messages.js` 缺失翻譯鍵
- [ ] T036 [P] [US4] 補充 `media/locales/tr/messages.js` 缺失翻譯鍵
- [ ] T037 [P] [US4] 補充 `media/locales/bg/messages.js` 缺失翻譯鍵
- [ ] T038 [P] [US4] 補充 `media/locales/cs/messages.js` 缺失翻譯鍵
- [ ] T039 [US4] 執行 `npm run validate:i18n` 驗證所有翻譯檔案格式正確
- [ ] T040 [US4] 手動測試：切換英文 → 確認迴圈積木顯示 "do"

**Checkpoint**: User Story 4 完成 - 所有翻譯鍵補充完成，掃描工具可用

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 跨 User Story 的收尾工作

- [ ] T041 執行全部單元測試 `npm test` 確認無回歸
- [ ] T042 [P] 更新 CHANGELOG.md 記錄四個 bug 修復
- [ ] T043 執行 quickstart.md 驗證流程確認功能正常
- [ ] T044 程式碼審查與清理

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 無阻擋項 - 直接進入 User Story
- **User Stories (Phase 3-6)**: 四個 bug 修復彼此獨立，可並行實作
- **Polish (Phase 7)**: 依賴所有 User Story 完成

### User Story Dependencies

- **User Story 1 (P1)**: 獨立 - 不依賴其他 Story
- **User Story 2 (P2)**: 獨立 - 不依賴其他 Story
- **User Story 3 (P2)**: 獨立 - 不依賴其他 Story
- **User Story 4 (P3)**: 獨立 - 不依賴其他 Story

### Within Each User Story

- 實作任務按順序執行
- [P] 標記的任務可並行
- 手動測試在實作完成後執行

### Parallel Opportunities

**跨 Story 並行** (若多人開發):

```
Developer A: User Story 1 (Phase 3)
Developer B: User Story 2 + 3 (Phase 4, 5)
Developer C: User Story 4 (Phase 6)
```

**US1 內部並行**:

- T007 (`arduino.js`) 可與 T003-T006 (`blocklyEdit.js`) 並行

**US4 內部並行**:

```
# 掃描工具完成後，所有 15 個語言翻譯可同時進行:
T024, T025, T026, T027, T028, T029, T030, T031, T032, T033, T034, T035, T036, T037, T038
```

---

## Parallel Example: User Story 4

```bash
# 掃描工具完成後 (T019-T023)，同時補充所有語言:
Task T024: "補充 media/locales/en/messages.js"
Task T025: "補充 media/locales/zh-hant/messages.js"
Task T026: "補充 media/locales/ja/messages.js"
... (其他 12 個語言)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 3: User Story 1 (主程式積木刪除限制)
3. **驗證點**: 測試 US1 獨立運作
4. 可先發布 patch 版本

### Incremental Delivery

1. Setup → 環境就緒
2. 加入 User Story 1 → 測試 → 發布 (MVP!)
3. 加入 User Story 2 + 3 → 測試 → 發布
4. 加入 User Story 4 → 測試 → 發布 (完整版)

### Sequential Delivery (單人開發)

1. Phase 1: Setup (T001-T002)
2. Phase 3: User Story 1 (T003-T010)
3. Phase 4: User Story 2 (T011-T013)
4. Phase 5: User Story 3 (T014-T018)
5. Phase 6: User Story 4 (T019-T040)
6. Phase 7: Polish (T041-T044)

---

## Notes

- 所有四個 bug 修復為獨立任務，無交叉相依性
- WebView 互動使用手動測試（符合 Constitution 例外條款）
- Extension Host 邏輯使用單元測試 (`messageHandler.test.ts`)
- 每個 User Story 完成後執行對應手動測試驗證
- [P] 標記任務為不同檔案，無相依性衝突
