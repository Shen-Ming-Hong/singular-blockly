# Tasks: TXT 預覽虛擬控制畫布

**Input**: Design documents from `/specs/054-preview-txt-controls/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: 本 feature 依 `plan.md` 採「Host/message 自動化測試 + WebView 互動手動驗證」策略；未要求 TDD，因此測試任務安排為各故事的驗證/覆蓋任務，而非 fail-first 測試階段。

**Organization**: 任務依使用者故事分組，確保每個故事可獨立實作、驗證與展示。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、或不依賴尚未完成的任務）
- **[Story]**: 僅使用者故事階段需要標示，例如 `[US1]`
- 每個任務都包含明確檔案路徑

---

## Phase 1: Setup（共享準備）

**Purpose**: 建立實作共同理解，確認現有 preview pipeline 與新設計契約對齊。

- [X] T001 審閱 feature 需求與規劃範圍於 `specs/054-preview-txt-controls/spec.md`、`specs/054-preview-txt-controls/plan.md`
- [X] T002 [P] 盤點 Host preview 入口與型別邊界於 `src/webview/webviewManager.ts`、`src/types/previewMessages.ts`
- [X] T003 [P] 盤點 Preview WebView 既有 DOM/JS/CSS 結構於 `media/html/blocklyPreview.html`、`media/js/blocklyPreview.js`、`media/css/blocklyEdit.css`

---

## Phase 2: Foundational（阻塞性基礎）

**Purpose**: 建立所有使用者故事共用的 TXT preview contract、board mapping、基礎 warning 與 fixture 能力。

**⚠️ CRITICAL**: 此階段完成前，不應開始任何使用者故事實作。

- [X] T004 擴充 preview board/message 型別以支援 `txt`、`txtVirtualControls`、`previewWarnings` 於 `src/types/previewMessages.ts`
- [X] T005 在 preview board mapping 中新增 TXT 對應並保留既有 fallback 行為於 `src/webview/webviewManager.ts`
- [X] T006 建立 TXT preview payload 正規化 helper 與 `PreviewWarning` 建立流程於 `src/webview/webviewManager.ts`
- [X] T007 [P] 建立 TXT preview 備份測試 fixture 與 postMessage assertion helper 於 `src/test/webviewPreview.test.ts`

**Checkpoint**: Preview contract、TXT board mapping 與測試 fixture 已可供三個使用者故事共用。

---

## Phase 3: User Story 1 - 檢視完整 TXT 預覽內容 (Priority: P1) 🎯 MVP

**Goal**: 使用者開啟含 `txtVirtualControls` 的 TXT 備份時，可在同一個 preview 視窗中同時看到 Blockly 工作區與保存時的虛擬控制畫布。

**Independent Test**: 開啟一份含多個虛擬控制元件的 TXT 備份，確認 preview 同時顯示 Blockly 內容與按鈕名稱、外觀、位置、尺寸。

### Implementation for User Story 1

- [X] T008 [US1] 在備份載入成功時把 `txtVirtualControls` 與空的 `previewWarnings` 傳入 `loadWorkspaceState` 訊息於 `src/webview/webviewManager.ts`
- [X] T009 [US1] 在 preview HTML 產生流程注入 TXT blocks/generator 與必要 modules URI 於 `src/webview/webviewManager.ts`
- [X] T010 [P] [US1] 新增 TXT preview panel、canvas、warning list、empty state、splitter 與基本 ARIA 屬性的 DOM 結構於 `media/html/blocklyPreview.html`
- [X] T011 [P] [US1] 新增 TXT preview panel、canvas overflow scroll 與基礎版面樣式於 `media/css/blocklyEdit.css`
- [X] T012 [US1] 在 Preview WebView 訊息處理中接收 `txtVirtualControls` 並呼叫 readonly presenter 入口於 `media/js/blocklyPreview.js`
- [X] T013 [US1] 實作 readonly control rendering，保留 `displayName`、`position`、`size`、`style` 於 `media/js/blocklyPreview.js`
- [X] T014 [US1] 新增有效 TXT 備份會傳送 `txtVirtualControls` 並維持 `setBoard` → `loadWorkspaceState` 順序的覆蓋於 `src/test/webviewPreview.test.ts`
- [X] T015 [US1] 記錄有效 TXT 備份 preview 的手動驗證結果欄位於 `specs/054-preview-txt-controls/quickstart.md`

**Checkpoint**: User Story 1 可作為 MVP 獨立展示：TXT preview 能顯示完整保存畫布，但尚未要求完整唯讀防守與降級 UX。

---

## Phase 4: User Story 2 - 在預覽中明確維持唯讀 (Priority: P2)

**Goal**: 使用者能調整檢視比例與捲動畫布，但無法修改任何虛擬控制內容，也不會產生任何保存或 runtime 訊息。

**Independent Test**: 在 TXT preview 中嘗試拖曳、改名、改色、新增、刪除、按壓虛擬控制元件，確認內容不變；調整左右佔比後重開 preview，確認回到預設比例。

### Implementation for User Story 2

- [X] T016 [US2] 實作左右佔比 splitter 與 canvas scroll 的 session-local 狀態與預設比例回復於 `media/js/blocklyPreview.js`
- [X] T017 [US2] 加入 pointer、keyboard、contextmenu 的 readonly guard，阻止虛擬控制內容編輯於 `media/js/blocklyPreview.js`
- [X] T018 [P] [US2] 新增 `.preview-mode` 下 readonly button、panel、splitter、cursor、hover 覆蓋樣式於 `media/css/blocklyEdit.css`
- [X] T019 [US2] 確保 TXT preview 虛擬控制互動不會送出 `saveWorkspace`、`txtUpload`、`txtVirtualControlStateChanged` 於 `media/js/blocklyPreview.js`
- [X] T020 [US2] 補上 preview 不持久化左右佔比與禁止保存/runtime 訊息的覆蓋測試於 `src/test/webviewPreview.test.ts`
- [X] T021 [US2] 記錄 readonly、splitter、canvas scroll、重開回預設比例與唯讀辨識 checklist 的手動驗證結果欄位於 `specs/054-preview-txt-controls/quickstart.md`

**Checkpoint**: User Story 1 + User Story 2 可獨立驗證：preview 是可檢視、可調整檢視比例，但不可編輯的唯讀投影。

---

## Phase 5: User Story 3 - 穩定處理舊備份與不完整資料 (Priority: P3)

**Goal**: 舊版 TXT 備份、空虛擬控制資料與部分損壞資料都能正常 preview，並提供可理解的空狀態或非阻斷 warning。

**Independent Test**: 分別開啟缺少 `txtVirtualControls`、`controls` 為空、部分控制項資料損壞的 TXT 備份，確認 preview 不崩潰、可恢復內容仍顯示、無法還原的部分有提示。

### Implementation for User Story 3

- [X] T022 [US3] 在 Host 正規化中處理缺少 `txtVirtualControls` 與空 `controls` 的 warning 產生於 `src/webview/webviewManager.ts`
- [X] T023 [US3] 在 Host 正規化中處理部分損壞控制項、無法還原項目與可恢復項目分流於 `src/webview/webviewManager.ts`
- [X] T024 [US3] 實作 TXT preview 空狀態顯示與 legacy-missing / empty-controls 狀態切換於 `media/js/blocklyPreview.js`
- [X] T025 [US3] 實作 `previewWarnings` 的可被螢幕閱讀器讀取 warning list、placeholder 或 recovered 標示呈現於 `media/js/blocklyPreview.js`
- [X] T026 [P] [US3] 新增 empty state、warning list、recovered/invalid placeholder 視覺樣式於 `media/css/blocklyEdit.css`
- [X] T027 [P] [US3] 新增空狀態、唯讀提示、warning 文案到 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js`、`media/locales/zh-hant/messages.js`
- [X] T028 [US3] 補上舊備份、空 controls、部分損壞資料的 Host payload 與 warning 覆蓋於 `src/test/webviewPreview.test.ts`

**Checkpoint**: 所有使用者故事皆可獨立驗證，且 TXT preview 對舊資料與壞資料具備降級能力。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 補齊跨故事品質、文件、i18n 與回歸驗證。

- [X] T029 [P] 新增非 TXT preview 不顯示、不啟用、不佔用 TXT panel 版面且既有載入流程不變的回歸覆蓋於 `src/test/webviewPreview.test.ts`
- [X] T030 [P] 檢查 postMessage 安全邊界與禁止訊息清單是否與契約一致於 `src/webview/webviewManager.ts`、`media/js/blocklyPreview.js`
- [X] T031 [P] 對齊任務完成後的設計文件與實作差異於 `specs/054-preview-txt-controls/plan.md`、`specs/054-preview-txt-controls/contracts/txt-preview-postmessage.md`、`specs/054-preview-txt-controls/contracts/txt-preview-readonly-rendering.md`
- [X] T032 執行 `npm run compile`、`npm run lint`、`npm run validate:i18n`、`npm test` 並將結果記錄於 `specs/054-preview-txt-controls/quickstart.md`
- [X] T033 [P] 依 quickstart 完成有效 TXT、舊備份、部分損壞、readonly、canvas scroll、splitter、可近性、唯讀辨識、效能 smoke、非 TXT 回歸手動驗證並記錄於 `specs/054-preview-txt-controls/quickstart.md`
- [X] T034 確認 `.github/copilot-instructions.md` 仍指向 `specs/054-preview-txt-controls/plan.md` 並更新必要後續註記於 `.github/copilot-instructions.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴，可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成，並阻塞所有 User Story
- **User Story 1 (Phase 3)**: 依賴 Foundational；建議作為 MVP 先完成
- **User Story 2 (Phase 4)**: 依賴 Foundational；可在 US1 的 DOM/render 基礎完成後接續，也可與 US3 的 Host 降級工作部分平行
- **User Story 3 (Phase 5)**: 依賴 Foundational；Host 降級部分可與 US2 的 CSS / quickstart 工作平行
- **Polish (Phase 6)**: 依賴欲交付的使用者故事完成

### User Story Dependencies

- **US1 (P1)**: MVP；需要 Phase 2 contract / mapping 完成，不依賴 US2 或 US3
- **US2 (P2)**: 需要 US1 的基本 panel / render 入口，強化唯讀互動與 session-local splitter
- **US3 (P3)**: 需要 Phase 2 正規化基礎；可在 US1 的 presenter 可顯示 warning 後完整驗證

### Within Each User Story

- Host contract / payload 任務先於 WebView render 任務
- DOM 結構先於 JS presenter 操作 DOM
- JS presenter 先於 CSS polish 的最終微調
- i18n 文案先於 `npm run validate:i18n`
- 每個故事完成後先按該故事的 Independent Test 驗證，再進入下一故事

---

## Parallel Opportunities

- T002 與 T003 可平行盤點不同層級檔案
- T007 可與 T004-T006 平行準備測試 fixture
- T010 與 T011 可平行實作 DOM 與 CSS 基礎
- T018 可與 T016-T017 平行補 CSS readonly 視覺
- T026 與 T027 可平行補樣式與 i18n 文案
- T029、T030、T031、T033 可在功能完成後平行執行

---

## Parallel Example: User Story 1

可平行派工：

- Task T010: 新增 TXT preview panel DOM 於 `media/html/blocklyPreview.html`
- Task T011: 新增 TXT preview panel 基礎樣式於 `media/css/blocklyEdit.css`

接著依序執行：

- Task T012: 在 `media/js/blocklyPreview.js` 接收 payload 並呼叫 presenter
- Task T013: 在 `media/js/blocklyPreview.js` 渲染 readonly controls

---

## Parallel Example: User Story 2

可平行派工：

- Task T016/T017/T019: 同一位開發者集中修改 `media/js/blocklyPreview.js`
- Task T018: 另一位開發者修改 `media/css/blocklyEdit.css`
- Task T021: Reviewer 或 QA 同步準備 `specs/054-preview-txt-controls/quickstart.md` 的手動驗證欄位

---

## Parallel Example: User Story 3

可平行派工：

- Task T022/T023: 一位開發者修改 `src/webview/webviewManager.ts`
- Task T026: 一位開發者修改 `media/css/blocklyEdit.css`
- Task T027: 一位開發者補 `media/locales/*/messages.js`

完成後整合：

- Task T024/T025: 在 `media/js/blocklyPreview.js` 顯示空狀態與 warning
- Task T028: 在 `src/test/webviewPreview.test.ts` 補 Host payload 覆蓋

---

## Implementation Strategy

### MVP First（只做 US1）

1. 完成 Phase 1 Setup
2. 完成 Phase 2 Foundational
3. 完成 Phase 3 User Story 1
4. **STOP and VALIDATE**: 使用含 `txtVirtualControls` 的 TXT 備份確認 preview 顯示完整畫布
5. 若 MVP 已可 demo，再進入 US2 的唯讀防守

### Incremental Delivery

1. Setup + Foundational → TXT preview contract 與 board mapping 可用
2. US1 → 能顯示完整 TXT 虛擬控制畫布（MVP）
3. US2 → 完成 readonly guard、splitter session-local 行為
4. US3 → 完成舊備份與部分損壞資料降級
5. Polish → 補齊非 TXT 回歸、i18n、驗證紀錄與文件對齊

### Validation Gates

- **Gate 1**: T004-T007 完成後，檢查 Host payload 型別與 TXT board mapping
- **Gate 2**: T008-T015 完成後，手動開啟有效 TXT 備份 preview
- **Gate 3**: T016-T021 完成後，嘗試所有禁止互動並確認無保存/runtime 訊息
- **Gate 4**: T022-T028 完成後，開啟 legacy / empty / partial backups 驗證降級
- **Gate 5**: T032-T033 完成後，確認自動化與手動驗證結果已記錄

---

## Notes

- `[P]` 任務表示不同檔案或不依賴未完成任務，可平行執行。
- `[US1]`、`[US2]`、`[US3]` 對應 `spec.md` 的三個使用者故事。
- Preview WebView 與 Extension Host 只透過 `postMessage` 溝通；不得讓 `media/js/blocklyPreview.js` 直接讀取檔案或啟動 TXT runtime。
- 不要直接重用 `blocklyEdit.js` 的可編輯 TXT virtual controls controller；preview 應使用專用 readonly presenter。
- 若新增任何使用者可見文案，必須補齊 `media/locales/*/messages.js` 並執行 i18n 驗證。
