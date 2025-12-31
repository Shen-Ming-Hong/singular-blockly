# Tasks: i18n 硬編碼字串修復

**Input**: Design documents from `/specs/024-i18n-hardcode-fix/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 未明確要求測試任務，本任務清單專注於實作。

**Organization**: 任務按 User Story 分組，以便獨立實作和測試每個故事。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案，無依賴）
-   **[Story]**: 任務所屬的 User Story（如 US1、US2、US3、US4）
-   描述中包含確切檔案路徑

## Path Conventions

本專案為 VSCode Extension，使用以下結構：

-   **原始碼**: `src/` 目錄
-   **翻譯檔案**: `media/locales/{lang}/messages.js`
-   **測試**: `src/test/`

---

## Phase 1: Setup（共用基礎設施）

**Purpose**: 建立 i18n 常數檔案和基礎架構

-   [ ] T001 建立 i18n 鍵名常數檔案 `src/types/i18nKeys.ts`，定義所有訊息鍵名分類（MESSAGE_KEYS, UPLOAD_KEYS, UPLOAD_ERROR_KEYS, BACKUP_KEYS, BUTTON_KEYS, ERROR_KEYS）
-   [ ] T002 [P] 驗證 TypeScript 設定，確保 `src/types/` 目錄下的型別檔案被正確編譯
    -   **驗證項目**：
        1. 確認 `tsconfig.json` 的 `include` 陣列包含 `src/**/*`
        2. 執行 `npm run compile` 無編譯錯誤
        3. 在 `src/services/localeService.ts` 中 import `I18nKey` 型別，確認 IntelliSense 正常運作

---

## Phase 2: Foundational（阻塞性前置作業）

**Purpose**: 強化 LocaleService 回退鏈機制，這是所有 User Story 的共同基礎

**⚠️ CRITICAL**: 此階段必須完成，所有 User Story 才能開始

-   [ ] T003 新增 `loadEnglishMessages()` 私有方法到 `src/services/localeService.ts`，用於載入英文翻譯作為回退
-   [ ] T004 修改 `getLocalizedMessage()` 方法簽章，新增 `fallback` 參數支援 `src/services/localeService.ts`
-   [ ] T005 實作 `getLocalizedMessage()` 回退鏈邏輯：當前語言 → 英文翻譯 → fallback 參數 → 鍵名 `src/services/localeService.ts`
-   [ ] T006 [P] 新增英文翻譯鍵值到 `media/locales/en/messages.js`（UPLOAD_KEYS, UPLOAD_ERROR_KEYS, BACKUP_KEYS, BUTTON_KEYS, ERROR_KEYS）

**Checkpoint**: LocaleService 回退鏈機制就緒，User Story 實作可開始

### 參數替換驗證

作為 Phase 2 的一部分，T005 實作時需驗證參數替換邏輯正確運作：

**測試案例**（可在開發過程中手動驗證或透過 console.log）：

```typescript
// 單一參數替換
await getLocalizedMessage('BACKUP_CONFIRM_DELETE', 'Delete "{0}"?', 'backup1');
// 預期輸出: "Delete \"backup1\"?" 或對應翻譯

// 多參數替換
await getLocalizedMessage('TEST_KEY', '{0} to {1}', 'A', 'B');
// 預期輸出: "A to B"
```

---

## Phase 3: User Story 1 - 英文環境下警告訊息正確顯示 (Priority: P1) 🎯 MVP

**Goal**: 解決英文版 VSCode 中安全警告對話框顯示 i18n 鍵名而非正確英文訊息的問題

**Independent Test**: 在英文版 VSCode 中開啟非 Blockly 專案，啟動 Blockly 編輯器，驗證警告對話框顯示正確英文文字

### Implementation for User Story 1

-   [ ] T007 [US1] 將 `workspaceValidator.ts` 中 `getFallbackMessage()` 的繁體中文 fallback 改為英文 `src/services/workspaceValidator.ts`
-   [ ] T008 [US1] 修改 `workspaceValidator.ts` 中所有 `getLocalizedMessage()` 呼叫，新增英文 fallback 參數 `src/services/workspaceValidator.ts`
-   [ ] T009 [US1] 匯入 i18nKeys 常數到 `workspaceValidator.ts`，取代硬編碼字串 `src/services/workspaceValidator.ts`
-   [ ] T010 [P] [US1] 新增繁體中文翻譯鍵值到 `media/locales/zh-hant/messages.js`（確保完整）
-   [ ] T011 [P] [US1] 新增日文翻譯鍵值到 `media/locales/ja/messages.js`
-   [ ] T012 [P] [US1] 新增韓文翻譯鍵值到 `media/locales/ko/messages.js`

**Checkpoint**: User Story 1 完成，英文環境下警告訊息正確顯示

---

## Phase 4: User Story 2 - MicroPython 上傳進度訊息本地化 (Priority: P1)

**Goal**: 解決 MicroPython 上傳時進度訊息硬編碼中文的問題

**Independent Test**: 在英文版 VSCode 中選擇 CyberBrick 開發板，上傳程式，驗證進度訊息顯示英文

**WebView 整合說明**: MicroPython 上傳訊息透過 `sendUploadProgress()` 發送到 WebView。WebView 端已有完整的翻譯機制 (`window.languageManager.getMessage`)，會根據 `stage` 參數自動顯示對應語言的訊息。Extension Host 只需將訊息改為英文（作為 fallback），WebView 會負責本地化顯示。**無需修改 WebView 端程式碼**。

### Implementation for User Story 2

-   [ ] T013 [US2] 匯入 i18nKeys 常數（UPLOAD_KEYS, UPLOAD_ERROR_KEYS）到 `src/services/micropythonUploader.ts`
-   [ ] T014 [US2] 將 `micropythonUploader.ts` 中「準備上傳...」等進度訊息改為英文常數 `src/services/micropythonUploader.ts`
-   [ ] T015 [US2] 將 `micropythonUploader.ts` 中「僅支援 CyberBrick 主板」等錯誤訊息改為英文常數 `src/services/micropythonUploader.ts`
-   [ ] T016 [US2] 將 `micropythonUploader.ts` 中所有 `sendUploadProgress()` 呼叫改用英文訊息 `src/services/micropythonUploader.ts`
-   [ ] T017 [P] [US2] 新增西班牙文翻譯鍵值到 `media/locales/es/messages.js`
-   [ ] T018 [P] [US2] 新增法文翻譯鍵值到 `media/locales/fr/messages.js`
-   [ ] T019 [P] [US2] 新增德文翻譯鍵值到 `media/locales/de/messages.js`

**Checkpoint**: User Story 2 完成，MicroPython 上傳進度訊息可本地化

---

## Phase 5: User Story 3 - 備份功能訊息本地化 (Priority: P2)

**Goal**: 解決備份功能確認對話框和錯誤訊息硬編碼中文的問題

**Independent Test**: 在英文版 VSCode 中使用備份功能，驗證確認對話框和錯誤訊息顯示英文

### Implementation for User Story 3

-   [ ] T020 [US3] 匯入 i18nKeys 常數（BACKUP_KEYS, BUTTON_KEYS, ERROR_KEYS）到 `src/webview/messageHandler.ts`
-   [ ] T021 [US3] 將 `messageHandler.ts` 中「確定要刪除備份檔案」等確認訊息改用 LocaleService `src/webview/messageHandler.ts`
-   [ ] T022 [US3] 將 `messageHandler.ts` 中「刪除」、「取消」等按鈕文字改用 LocaleService `src/webview/messageHandler.ts`
-   [ ] T023 [US3] 將 `messageHandler.ts` 中「建立備份失敗」等錯誤訊息改用 LocaleService `src/webview/messageHandler.ts`
-   [ ] T024 [US3] 將 `messageHandler.ts` 中「確定要還原備份」確認訊息改用 LocaleService `src/webview/messageHandler.ts`
-   [ ] T025 [US3] 將 `messageHandler.ts` 中「處理訊息時發生錯誤」等通用錯誤改用 LocaleService `src/webview/messageHandler.ts`
-   [ ] T026 [P] [US3] 新增義大利文翻譯鍵值到 `media/locales/it/messages.js`
-   [ ] T027 [P] [US3] 新增俄文翻譯鍵值到 `media/locales/ru/messages.js`
-   [ ] T028 [P] [US3] 新增波蘭文翻譯鍵值到 `media/locales/pl/messages.js`

**Checkpoint**: User Story 3 完成，備份功能訊息可本地化

---

## Phase 6: User Story 4 - 統一 i18n 常數管理 (Priority: P2)

**Goal**: 確保所有 i18n 鍵名有 TypeScript 類型檢查支援，減少硬編碼字串

**Independent Test**: 開發者檢查新建的常數檔案，驗證 IntelliSense 和類型檢查運作正常

### Implementation for User Story 4

-   [ ] T029 [US4] 確認所有訊息鍵名都已加入 `I18nKey` 聯合型別 `src/types/i18nKeys.ts`
-   [ ] T030 [US4] 更新 `localeService.ts` 的 `getLocalizedMessage()` 參數型別，接受 `I18nKey` 型別 `src/services/localeService.ts`
-   [ ] T031 [P] [US4] 新增匈牙利文翻譯鍵值到 `media/locales/hu/messages.js`
-   [ ] T032 [P] [US4] 新增土耳其文翻譯鍵值到 `media/locales/tr/messages.js`
-   [ ] T033 [P] [US4] 新增保加利亞文翻譯鍵值到 `media/locales/bg/messages.js`
-   [ ] T034 [P] [US4] 新增捷克文翻譯鍵值到 `media/locales/cs/messages.js`
-   [ ] T035 [P] [US4] 新增葡萄牙文（巴西）翻譯鍵值到 `media/locales/pt-br/messages.js`

**Checkpoint**: User Story 4 完成，所有 i18n 鍵名有完整類型安全支援

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 最終驗證和跨功能改進

-   [ ] T036 執行 `npm run validate:i18n` 驗證所有 15 種語言翻譯完整性
    -   **成功標準**：腳本執行無錯誤，所有新增鍵名在 15 種語言中都有對應翻譯
-   [ ] T037 [P] 搜尋並確認 Extension Host 端無殘留硬編碼中文字串（MCP 工具除外）
    -   **驗證命令**：
        ```powershell
        # 在專案根目錄執行
        Get-ChildItem -Path "src" -Include "*.ts" -Recurse | Select-String -Pattern "[\u4e00-\u9fff]+" | Where-Object { $_.Path -notmatch "mcp" }
        ```
    -   **成功標準**：上述命令輸出應為空（無結果），或僅包含允許的例外（如註解中的中文說明）
    -   **已知排除**：
        -   `src/mcp/**/*.ts` - MCP 工具保持英文（FR-010）
        -   TypeScript 註解中的中文說明（非使用者可見）
-   [ ] T038 [P] 更新相關文件，記錄新增的 i18n 鍵名和使用方式
    -   **更新檔案**：`README.md` 或 `CONTRIBUTING.md` 中的 i18n 開發指南（如適用）
    -   **內容**：說明如何使用 `I18nKey` 型別和 `LocaleService.getLocalizedMessage()` 的新 fallback 參數
-   [ ] T039 執行 quickstart.md 中的手動驗證流程
    -   **成功標準**：所有 User Story 的 Acceptance Scenarios 通過
    -   **驗證項目**：
        1. 英文環境警告訊息顯示正確英文
        2. 繁體中文環境警告訊息顯示正確中文
        3. 英文環境上傳進度訊息顯示英文
        4. 英文環境備份對話框顯示英文

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有 User Stories**
-   **User Stories (Phase 3-6)**: 全部依賴 Foundational 階段完成
    -   User Stories 可平行進行（若有多人）
    -   或按優先級順序執行（P1 → P2）
-   **Polish (Phase 7)**: 依賴所有 User Stories 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 可在 Foundational 完成後開始 - 無其他依賴
-   **User Story 2 (P1)**: 可在 Foundational 完成後開始 - 無其他依賴
-   **User Story 3 (P2)**: 可在 Foundational 完成後開始 - 無其他依賴
-   **User Story 4 (P2)**: 可在 Foundational 完成後開始 - 可與其他 User Story 平行

### Within Each User Story

-   匯入 i18nKeys → 修改訊息呼叫 → 新增翻譯檔案
-   實作完成前不移至下一任務

### Parallel Opportunities

**Setup Phase**:

-   T001, T002 可平行

**Foundational Phase**:

-   T003-T005 需順序執行（核心邏輯）
-   T006 可與 T003-T005 平行（不同檔案）

**User Story Phases**:

-   所有標記 [P] 的翻譯檔案任務可平行
-   US1, US2, US3, US4 可由不同開發者平行處理

---

## Parallel Example: Foundational + User Story 1

```bash
# Foundational 階段可平行的部分：
Task T003-T005: LocaleService 回退鏈（順序）
Task T006: 英文翻譯檔案（可平行）

# User Story 1 翻譯檔案可平行：
Task T010: 繁體中文翻譯
Task T011: 日文翻譯
Task T012: 韓文翻譯
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵 - 阻塞所有 Stories**）
3. 完成 Phase 3: User Story 1
4. 完成 Phase 4: User Story 2
5. **停止並驗證**: 測試英文環境下警告訊息和上傳進度
6. 若就緒可部署/展示

### Incremental Delivery

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4 → 獨立測試 → 部署/展示
6. 每個 Story 都能獨立增加價值

### Parallel Team Strategy

若有多位開發者：

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
    - 開發者 A: User Story 1
    - 開發者 B: User Story 2
    - 開發者 C: User Story 3 + 4
3. 每個 Story 獨立完成並整合

---

## Notes

-   [P] 任務 = 不同檔案，無依賴
-   [Story] 標籤將任務對應到特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成和測試
-   每個任務或邏輯群組完成後提交
-   在任何 Checkpoint 停止以獨立驗證 Story
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 依賴

---

## Task Summary

| Phase     | 描述              | 任務數 |
| --------- | ----------------- | ------ |
| Phase 1   | Setup             | 2      |
| Phase 2   | Foundational      | 4      |
| Phase 3   | User Story 1 (P1) | 6      |
| Phase 4   | User Story 2 (P1) | 7      |
| Phase 5   | User Story 3 (P2) | 9      |
| Phase 6   | User Story 4 (P2) | 7      |
| Phase 7   | Polish            | 4      |
| **Total** |                   | **39** |

### Per User Story Task Count

-   **US1**: 6 tasks (T007-T012)
-   **US2**: 7 tasks (T013-T019)
-   **US3**: 9 tasks (T020-T028)
-   **US4**: 7 tasks (T029-T035)

### Parallel Opportunities

-   **Setup**: 1 parallel opportunity
-   **Foundational**: 1 parallel opportunity (T006)
-   **US1**: 3 parallel opportunities (T010-T012)
-   **US2**: 3 parallel opportunities (T017-T019)
-   **US3**: 3 parallel opportunities (T026-T028)
-   **US4**: 5 parallel opportunities (T031-T035)
-   **Polish**: 2 parallel opportunities (T037-T038)
