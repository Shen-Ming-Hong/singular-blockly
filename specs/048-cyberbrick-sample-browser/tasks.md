# Tasks: CyberBrick 範例工作區瀏覽器

**Input**: Design documents from `/specs/048-cyberbrick-sample-browser/`
**Prerequisites**: plan.md ✓ | spec.md ✓ | research.md ✓ | data-model.md ✓ | contracts/postmessage.md ✓

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可與其他任務平行執行（不同檔案、無相依關係）
- **[US1/US2/US3/US4]**: 對應 spec.md 中的 User Story
- 每個描述包含明確檔案路徑

---

## Phase 1: Setup（共用基礎建設）

**Purpose**: 建立必要的範例資料目錄，所有後續任務的前提。

- [ ] T001 在 `media/samples/index.json` 建立初始範例目錄，包含版本欄位 `version: 1` 與足球機器人條目（含所有 15 個語系的 title / description）

---

## Phase 2: Foundational（阻塞所有 User Story 的前置基礎）

**Purpose**: 建立 Extension Host 端的 service 層，包含所有業務邏輯。需在任何 User Story 實作前完成。

**⚠️ CRITICAL**: 所有 User Story 的 Extension Host 實作均依賴此 service 存在。

- [ ] T002 建立 `src/services/sampleBrowserService.ts`，包含：TypeScript 型別介面（`SampleIndex`、`SampleEntry`、`LocalizedText`、`SampleWorkspace`、`FetchResult<T>`）、`fetchWithTimeout(url, ms)` 工具函式（含 `AbortController`）、`fetchSampleIndex(extensionPath)` 函式（雲端優先 + 10s timeout + 本機 fallback，回傳 `FetchResult<SampleIndex>`）、`fetchSampleWorkspace(filename, extensionPath)` 函式（雲端優先 + 10s timeout + 本機 fallback，回傳 `FetchResult<SampleWorkspace>`）、`validateSampleWorkspace(json)` 函式（確認 `workspace` 欄位存在且 `board === 'cyberbrick'`）

**Checkpoint**: SampleBrowserService 建立完成，可開始所有 User Story 實作

---

## Phase 3: User Story 1 — 核心範例載入流程 (Priority: P1) 🎯 MVP

**Goal**: 使用者可在 CyberBrick 板模式下點擊「範例」按鈕，從模態瀏覽器選取範例，確認後替換目前工作區。

**Independent Test**: 選定 CyberBrick 板，點擊「範例」按鈕，模態開啟並顯示卡片，點選足球機器人並確認，驗證工作區積木被正確替換。

### Implementation for User Story 1

- [ ] T003 [P] [US1] 在所有 15 個 `media/locales/*/messages.js` 新增 10 個 SAMPLE*BROWSER*\* i18n 鍵值（`SAMPLE_BROWSER_BUTTON_TITLE`、`SAMPLE_BROWSER_TITLE`、`SAMPLE_BROWSER_LOADING`、`SAMPLE_BROWSER_OFFLINE_NOTICE`、`SAMPLE_BROWSER_LOAD_BUTTON`、`SAMPLE_BROWSER_EMPTY`、`SAMPLE_BROWSER_CONFIRM_LOAD`、`SAMPLE_BROWSER_CONFIRM_YES`、`SAMPLE_BROWSER_CONFIRM_NO`、`SAMPLE_BROWSER_ERROR_INVALID`）
- [ ] T004 [US1] 在 `media/html/blocklyEdit.html` 工具列區域新增：`<div class="sample-switch" id="sampleContainer" style="display:none">` 包含 book-open SVG 圖示按鈕（`id="sampleButton"`），以及 `<div id="sampleModal">` 模態結構（含標題列、loading spinner `id="sampleSpinner"`、離線提示橫幅 `id="sampleOfflineNotice"` 預設隱藏、卡片容器 `id="sampleCardContainer"`、空清單提示 `id="sampleEmptyNotice"` 預設隱藏、關閉按鈕）
- [ ] T005 [P] [US1] 在 `media/css/blocklyEdit.css` 新增：`.sample-switch` 按鈕容器樣式（對齊工具列 `.backup-switch` 模式）、`#sampleModal` 覆層 + 卡片格線樣式、`.sample-card` 卡片樣式（標題、描述、載入按鈕）、`@keyframes` spinner 旋轉動畫、`#sampleOfflineNotice` 離線提示橫幅樣式
- [ ] T006 [US1] 在 `media/js/blocklyEdit.js` 的 `DOMContentLoaded` 事件處理段落新增：取得 `sampleButton` 元素，綁定 click 事件 → 計算 `hasBlocks`（`Blockly.getMainWorkspace().getAllBlocks(false).length > 0`）→ `vscode.postMessage({ command: 'openSampleBrowserRequest', hasBlocks })`，並在按下時顯示模態骨架（spinner 可見）
- [ ] T007 [US1] 在 `media/js/blocklyEdit.js` `window.addEventListener('message')` switch/case 新增 `showSampleBrowser` case：隱藏 spinner、依 `samples` 陣列動態建立 `.sample-card` DOM 元素（含本地化 title/description 解析：`entry.title[language] ?? entry.title['en']`）、若 `samples` 為空則顯示 `#sampleEmptyNotice`
- [ ] T008 [US1] 在 `media/js/blocklyEdit.js` 卡片容器委派事件（或每張卡片個別綁定）：偵測「載入」按鈕點擊 → `vscode.postMessage({ command: 'loadSelectedSampleRequest', filename, hasBlocks })`
- [ ] T009 [US1] 在 `media/js/blocklyEdit.js` `window.addEventListener('message')` switch/case 新增 `loadSampleWorkspace` case：關閉 `#sampleModal`、呼叫 `handleWorkspaceLoadMessage(message)` 載入工作區（與現有 loadWorkspace 相同處理路徑）
- [ ] T010 [P] [US1] 在 `src/webview/messageHandler.ts` `handleMessage()` switch 中新增 `case 'openSampleBrowserRequest'`，呼叫 `await this.handleOpenSampleBrowser(message)`
- [ ] T011 [US1] 在 `src/webview/messageHandler.ts` 新增 `private async handleOpenSampleBrowser(message)` 方法：呼叫 `fetchSampleIndex(this.extensionPath)`，取得 language（從 `settingsManager` 或 vscode.env.language），post `showSampleBrowser` 訊息（`samples`, `isOffline`, `language`）至 WebView
- [ ] T012 [US1] 在 `src/webview/messageHandler.ts` `handleMessage()` switch 中新增 `case 'loadSelectedSampleRequest'`，呼叫 `await this.handleLoadSelectedSample(message)`
- [ ] T013 [US1] 在 `src/webview/messageHandler.ts` 新增 `private async handleLoadSelectedSample(message)` 方法：若 `message.hasBlocks` 則顯示 `vscode.window.showWarningMessage()` 確認（使用者取消則返回）、呼叫 `fetchSampleWorkspace(filename, this.extensionPath)`、呼叫 `validateSampleWorkspace(data)`（失敗顯示 `showErrorMessage()` 並返回）、post `loadSampleWorkspace` 訊息至 WebView

**Checkpoint**: User Story 1 完整可運作——CyberBrick 板模式下可開啟模態、選取範例、替換工作區

---

## Phase 4: User Story 2 — 離線 fallback UI 提示 (Priority: P2)

**Goal**: 無網路環境下，系統自動使用內建版本並在模態中顯示離線提示橫幅，使用者知悉目前為內建版本。

**Independent Test**: 關閉網路（或封鎖 `raw.githubusercontent.com`），開啟範例瀏覽器，驗證橫幅文字顯示「使用內建版本」且範例卡片仍正確渲染。

### Implementation for User Story 2

- [ ] T014 [US2] 在 `media/js/blocklyEdit.js` `showSampleBrowser` case 中，依 `message.isOffline` 旗標切換 `#sampleOfflineNotice` 的 `display` 屬性（`true` 時顯示，`false` 時隱藏）；離線文字內容取自 `window.languageManager` 解析 `SAMPLE_BROWSER_OFFLINE_NOTICE` i18n 鍵值

**Checkpoint**: User Stories 1 & 2 均可獨立驗證——有網路時正常載入、無網路時自動 fallback 並顯示提示

---

## Phase 5: User Story 3 — 按鈕可見性控制 (Priority: P3)

**Goal**: 範例按鈕僅在 CyberBrick 板時顯示，切換至 Arduino 板時立即消失。

**Independent Test**: 分別切換至 `esp32`（Arduino）與 `cyberbrick` 板，觀察工具列 `#sampleContainer` 是否正確顯示/隱藏。

### Implementation for User Story 3

- [ ] T015 [US3] 在 `media/js/blocklyEdit.js` `updateUIForBoard(boardId, isCyberBrick)` 函式中新增：`const sampleContainer = document.getElementById('sampleContainer'); if (sampleContainer) sampleContainer.style.display = isCyberBrick ? 'flex' : 'none';`

**Checkpoint**: User Stories 1、2、3 均完整運作——按鈕可見性、範例載入、離線 fallback 皆正確

---

## Phase 6: User Story 4 — 雲端可更新架構驗證 (Priority: P4)

**Goal**: 驗證新增範例條目只需更新 `index.json`，不需修改任何 extension 程式碼，多張卡片可正確渲染。

**Independent Test**: 在 `media/samples/index.json` 手動新增第二個假條目，開啟範例瀏覽器並確認出現兩張卡片（第二張點擊「載入」後會顯示找不到檔案的錯誤通知，此為預期行為）。

### Implementation for User Story 4

- [ ] T016 [US4] 在 `media/samples/index.json` 驗證多卡片架構：暫時新增第二個條目（例如 `"cyberbrick-obstacle-avoider"` 佔位條目），執行手動測試確認兩張卡片正確渲染後，**移除**佔位條目，保持 `index.json` 僅含足球機器人（架構驗證任務，非新增功能）

**Checkpoint**: 所有 4 個 User Story 均通過驗收——功能開發完成

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 測試覆蓋、i18n 驗證與手動驗收測試。

- [ ] T017 建立 `src/test/suite/services/sampleBrowserService.test.ts`：測試 `fetchWithTimeout` timeout 觸發後回傳錯誤、`fetchSampleIndex` 在 HTTP 失敗時 `isOffline === true` 且回傳本機資料、`validateSampleWorkspace` 傳入有效資料回傳 `true`、傳入缺少 `workspace` 欄位回傳 `false`、傳入 `board !== 'cyberbrick'` 回傳 `false`
- [ ] T018 [P] 執行 `npm run validate:i18n` 確認 15 個語系的 SAMPLE*BROWSER*\* 鍵值均完整，無遺漏
- [ ] T019 依據 `specs/048-cyberbrick-sample-browser/quickstart.md` 手動測試清單執行 P1–P4 所有驗收場景（有網路 / 無網路 / Arduino 板 / 空白工作區 / 有積木工作區）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 無依賴，立即可開始
- **Phase 2 (Foundational)**: 依賴 Phase 1（需要 index.json 進行 fallback 路徑推導）—— **阻塞所有 User Story**
- **Phase 3–6 (User Stories)**: 均依賴 Phase 2 完成後才能開始
    - Phase 3 (US1) 先完成，其他 phase 依賴度如下
    - Phase 4 (US2) 依賴 Phase 3 T007 (showSampleBrowser handler 已存在才能修改)
    - Phase 5 (US3) 依賴 Phase 3 T006 (DOMContentLoaded 一併加入 sampleContainer 存取)
    - Phase 6 (US4) 依賴 Phase 3 完成（需要完整 UI 才能驗證多卡片渲染）
- **Phase 7 (Polish)**: 依賴 Phase 2–6 完成

### User Story Dependencies

- **US1 (P1)**: Phase 2 完成後可開始，MVP 核心
- **US2 (P2)**: 依賴 US1 的 T007 完成後才能修改 showSampleBrowser handler
- **US3 (P3)**: 依賴 US1 的 T004（HTML 需先有 `#sampleContainer`）與 T006
- **US4 (P4)**: 依賴 US1–US3 完成（驗證完整功能）

### Within User Story 1 (Phase 3)

- T003、T005、T010 可與 T004、T006–T009、T011–T013 平行（不同檔案）
- T004 必須早於 T006–T009（HTML 結構需先存在）
- T011 必須早於（或與）T010 一起完成（方法需在 case 呼叫前定義）
- T012 必須早於 T013（routing 先於 handler 方法）

### Parallel Opportunities (Phase 3)

| 並行群組 A                | 並行群組 B（不同檔案）           |
| ------------------------- | -------------------------------- |
| T003（15 個 locale 檔案） | T004（blocklyEdit.html）         |
|                           | T005（blocklyEdit.css）          |
|                           | T010 + T011（messageHandler.ts） |
| T006 → T007 → T008 → T009 | T012 → T013（messageHandler.ts） |

---

## Implementation Strategy

### MVP Scope（最小可交付範圍）

完成 **Phase 1 → Phase 2 → Phase 3** = User Story 1 全部可運作。  
此時使用者已可：點擊按鈕 → 看到卡片 → 選取並替換工作區。

### Incremental Delivery Order

1. **MVP**: T001 → T002 → T003–T013（US1 完整流程）
2. **+Offline UX**: T014（US2 離線提示）
3. **+Visibility control**: T015（US3 按鈕僅 CyberBrick 可見）
4. **+Architecture validation**: T016（US4 多卡片架構確認）
5. **+Quality**: T017–T019（測試 + i18n 驗證 + 手動驗收）

---

## Summary

| 統計項目               | 數量 |
| ---------------------- | ---- |
| 總任務數               | 19   |
| Setup (Phase 1)        | 1    |
| Foundational (Phase 2) | 1    |
| US1 (Phase 3)          | 11   |
| US2 (Phase 4)          | 1    |
| US3 (Phase 5)          | 1    |
| US4 (Phase 6)          | 1    |
| Polish (Phase 7)       | 3    |
| 可平行任務 [P]         | 4    |
| MVP 所需任務           | 13   |
