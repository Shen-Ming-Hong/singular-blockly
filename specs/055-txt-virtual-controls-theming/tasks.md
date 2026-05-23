# 任務清單：TXT 虛擬控制主題一致性

**輸入**：來自 `specs/055-txt-virtual-controls-theming/` 的設計文件
**前置條件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`
**測試要求**：本功能規格已明確包含使用者情境與測試、獨立驗證與成功準則；`plan.md` 也要求自動化測試與 WebView 手動矩陣，因此本 `tasks.md` 必須納入測試任務。

**組織方式**：任務依使用者故事分組，讓每個故事都能獨立實作與驗證。

## 格式：`[ID] [P?] [故事標記] 任務描述`

- **[P]**：可平行執行（不同檔案、且沒有依賴未完成任務）
- **[故事標記]**：僅使用者故事階段使用，例如 `[US1]`
- 每個任務描述都包含明確檔案路徑

---

## Phase 1：準備（共用基礎設施）

**目的**：建立共用 WebView helper 與資源載入骨架，供 edit 與 preview 後續共用。

- [X] T001 在 `media/js/txtVirtualControlsContrast.js` 建立共用 TXT 對比輔助模組骨架
- [X] T002 在 `media/html/blocklyEdit.html` 與 `media/html/blocklyPreview.html` 加入 TXT 對比輔助 script placeholder
- [X] T003 在 `src/webview/webviewManager.ts` 串接 edit 與 preview WebView 的 `txtVirtualControlsContrastUri` 取代邏輯

---

## Phase 2：基礎建設（阻塞型前置條件）

**目的**：完成所有使用者故事都需要的 contrast helper、resource injection test 與 CSS token foundation。

**⚠️ 關鍵提醒**：此階段完成前，不應開始任何使用者故事實作。

- [X] T004 [P] 在 `src/test/suite/txtVirtualControlsContrast.test.ts` 新增對比輔助模組契約測試，涵蓋顏色解析、相對亮度、對比比值，並採用不依賴 DOM 的測試載入方式
- [X] T005 在 `media/js/txtVirtualControlsContrast.js` 實作 hex/rgb 顏色解析、相對亮度、對比比值、可讀文字色與主題有效樣式純函式
- [X] T006 [P] 在 `media/css/blocklyEdit.css` 新增 TXT 主題化 CSS variable foundation，涵蓋 panel、canvas、button、inspector field/code、state 與 focus token
- [X] T007 [P] 在 `src/test/webviewManager.test.ts` 新增 WebView 共用 helper 資源注入回歸測試

**檢查點**：共用 helper、CSS token foundation 與 resource injection 測試就緒後，三個使用者故事可依優先順序或平行開始。

---

## Phase 3：使用者故事 1 - 在任何支援主題下清楚使用 TXT 控制（優先級：P1）🎯 MVP

**目標**：讓 TXT virtual controls 在 light、dark、高對比深色與高對比淺色的 edit/preview 中，都維持 panel、canvas、button、有效配色與 focus 的清楚呈現。

**獨立驗證**：使用同一份含多顆虛擬按鈕的 TXT 專案與備份，在四種主題下開啟 edit 與 preview，確認 panel/canvas/button/focus/說明文字皆可辨識，且不需重新開啟內容。

### 使用者故事 1 的測試任務

> **注意**：先建立或更新測試／驗證項，再實作對應行為。

- [X] T008 [P] [US1] 在 `src/test/webviewManager.test.ts` 新增 edit 與 preview 主題資源注入斷言

### 使用者故事 1 的實作任務

- [X] T009 [US1] 在 `media/js/blocklyEdit.js` 於 `updateTheme()` 後重新套用 TXT 主題有效樣式與可見輔助
- [X] T010 [US1] 在 `media/js/blocklyPreview.js` 於 `updateTheme()` 後刷新 TXT preview 主題有效樣式
- [X] T011 [US1] 在 `media/css/blocklyEdit.css` 以 theme token CSS variables 取代硬編碼的 TXT 虛擬按鈕陰影
- [X] T012 [US1] 在 `media/css/blocklyEdit.css` 加入 generic high contrast 與 `forced-colors` 的 TXT panel/canvas/button 樣式，並以手動矩陣覆蓋高對比深色與淺色案例
- [X] T013 [US1] 在 `media/css/blocklyEdit.css` 補齊 preview panel/canvas 的 high contrast 細修樣式
- [X] T014 [US1] 在 `media/js/txtVirtualControlsContrast.js` 新增 TXT canvas 與 panel surface 的 WebView 顏色解析輔助函式

**檢查點**：US1 完成後，TXT edit/preview 應能在四種支援主題下維持清楚可辨識，作為 MVP 可獨立展示。

---

## Phase 4：使用者故事 2 - 主題別手動配色與自動初始色（優先級：P1）

**目標**：亮色與暗色各自提供可讀初始色；使用者在特定主題手動調整顏色後，系統保留該主題的手動記錄，不再顯示額外配色提示。

**獨立驗證**：建立未手動調色、只在亮色調色、亮暗皆調色三種按鈕案例，切換主題並開啟 preview，確認有效配色符合目前主題，且不出現額外配色提示。

### 使用者故事 2 的測試任務

> **注意**：先建立或更新測試／驗證項，再實作對應行為。

- [X] T015 [P] [US2] 在 `src/test/suite/txtVirtualControlsContrast.test.ts` 新增可讀文字色、亮暗預設樣式與主題有效樣式測試
- [X] T016 [P] [US2] 在 `src/test/webviewPreview.test.ts` 新增 non-TXT preview 不出現 TXT 主題樣式副作用的回歸測試
- [X] T017 [P] [US2] 在 `src/test/suite/txtVirtualControlsPersistence.test.ts` 擴充顏色持久化與舊備份載入回歸測試，確認 `themeStyles` 被保留且暫態 UI metadata 不會被序列化

### 使用者故事 2 的實作任務

- [X] T018 [US2] 在 `media/js/blocklyEdit.js` 實作 edit 端主題有效樣式解析
- [X] T019 [US2] 在 `media/js/blocklyEdit.js` 將顏色 input 變更寫入目前主題的 `themeStyles` 手動記錄
- [X] T020 [US2] 在 `media/js/blocklyEdit.js` 於 render 與 inspector 中套用目前主題有效背景色與文字色
- [X] T021 [US2] 在 `media/js/blocklyPreview.js` 實作 preview 端主題有效樣式解析
- [X] T022 [US2] 在 `media/js/blocklyPreview.js` 讓 readonly preview 按鈕依目前主題套用有效配色
- [X] T023 [US2] 在 `media/css/blocklyEdit.css` 移除已淘汰的配色提示樣式並保留狀態/焦點 cue
- [X] T024 [US2] 在 `media/locales/en/messages.js` 移除已無使用的英文配色提示 locale keys
- [X] T025 [P] [US2] 在 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js` 移除已無使用的配色提示 locale keys
- [X] T026 [P] [US2] 在 `media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js` 移除已無使用的配色提示 locale keys
- [X] T027 [P] [US2] 在 `media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js`、`media/locales/zh-hant/messages.js` 移除已無使用的配色提示 locale keys
- [X] T028 [US2] 在 `media/js/blocklyEdit.js` 與 `media/js/blocklyPreview.js` 於語言切換時刷新狀態與 readonly 文字，不再刷新已移除的配色提示 UI

**檢查點**：US2 完成後，缺少目前主題手動記錄的按鈕應使用主題初始色；已手動調整過的亮/暗主題顏色應各自保留，且不再顯示額外配色提示。

---

## Phase 5：使用者故事 3 - 在各種狀態下都能看懂按鈕目前代表什麼（優先級：P2）

**目標**：補齊 selected、running、pressed、readonly preview、keyboard focus 與 high contrast 情境下的非單一顏色狀態線索。

**獨立驗證**：在 edit 與 preview 中分別檢查 selected、running、pressed、readonly、focus-visible 與 keyboard guard，確認所有支援主題下都能辨識狀態且 preview 不可操作。

### 使用者故事 3 的測試任務

> **注意**：先建立或更新測試／驗證項，再實作對應行為。

- [X] T029 [P] [US3] 在 `src/test/webviewPreview.test.ts` 新增 preview 唯讀鍵盤防護回歸測試

### 使用者故事 3 的實作任務

- [X] T030 [US3] 在 `media/css/blocklyEdit.css` 新增 edit 的 focus-visible、selected、running 與 pressed 非單一顏色狀態線索
- [X] T031 [US3] 在 `media/css/blocklyEdit.css` 新增 preview readonly 的 focus-visible 與 inactive 狀態提示
- [X] T032 [US3] 在 `media/js/blocklyEdit.js` 更新 edit 虛擬按鈕於 selected/running/pressed/focus 狀態下的 ARIA labels 與 title
- [X] T033 [US3] 在 `media/js/blocklyPreview.js` 更新 preview 虛擬按鈕的 focusability 與 readonly ARIA semantics
- [X] T034 [US3] 在 `media/js/blocklyPreview.js` 確保 preview 在 focusability 變更後仍阻擋鍵盤啟動行為
- [X] T035 [US3] 在 `media/locales/en/messages.js` 新增英文狀態與焦點可近性 locale keys
- [X] T036 [P] [US3] 在 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js` 新增狀態與焦點可近性 locale keys
- [X] T037 [P] [US3] 在 `media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js` 新增狀態與焦點可近性 locale keys
- [X] T038 [P] [US3] 在 `media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js`、`media/locales/zh-hant/messages.js` 新增狀態與焦點可近性 locale keys

**檢查點**：US3 完成後，使用者應能在 edit 與 preview 中辨識主要狀態；preview 即使可被鍵盤聚焦也仍是唯讀。

---

## Phase 6：收尾與跨領域檢查

**目的**：完成 i18n、驗證紀錄、安全檢查與整體回歸。

- [X] T039 [P] 執行涵蓋所有 `media/locales/*/messages.js` 的 i18n 驗證，並修復缺少的 TXT 主題化 keys
- [X] T040 [P] 執行亮色／暗色／高對比手動驗證矩陣，明確涵蓋既有 TXT 專案、舊 TXT 備份、暗色 edit inspector 識別字/輸入欄可讀性，並在 `specs/055-txt-virtual-controls-theming/quickstart.md` 記錄證據與 preview 唯讀阻擋結果
- [X] T041 執行 compile 與 lint，並修復 `src/webview/webviewManager.ts`、`media/js/blocklyEdit.js`、`media/js/blocklyPreview.js`、`media/css/blocklyEdit.css` 的問題
- [X] T042 執行相關 Mocha 測試，並修復 `src/test/webviewManager.test.ts`、`src/test/webviewPreview.test.ts`、`src/test/suite/txtVirtualControlsContrast.test.ts`、`src/test/suite/txtVirtualControlsPersistence.test.ts` 的回歸
- [X] T043 [P] 在 `media/js/blocklyEdit.js` 與 `media/js/blocklyPreview.js` 執行安全文字渲染與 no-eval 安全檢查
- [X] T044 在 `media/css/blocklyEdit.css` 與 `media/html/blocklyEdit.html` 修正暗色主題下 TXT panel/canvas、識別字 value 與 inspector input 仍可能吃到亮色 token 的回歸

---

## 相依關係與執行順序

### 各階段相依關係

- **準備階段（Phase 1）**：無依賴，可立即開始。
- **基礎建設階段（Phase 2）**：依賴 Phase 1；完成後才開始使用者故事。
- **使用者故事 1（Phase 3，P1 MVP）**：依賴 Phase 2。
- **使用者故事 2（Phase 4，P1）**：依賴 Phase 2；可與 US1 平行，但若人力有限建議 US1 → US2。
- **使用者故事 3（Phase 5，P2）**：依賴 Phase 2；與 US1/US2 無硬性資料依賴，但視覺 cue 最好在主題有效樣式與 foundation 穩定後整合。
- **收尾階段（Phase 6）**：依賴欲交付的使用者故事完成。

### 使用者故事相依關係

- **US1**：可在 Phase 2 後獨立完成，是建議 MVP。
- **US2**：可在 Phase 2 後獨立完成，但會共用 US1 的 theme surface foundation。
- **US3**：可在 Phase 2 後獨立完成，但最終驗證需與 US1/US2 的 high contrast 與主題有效樣式 cues 同時檢查。

### 每個使用者故事內部順序

- 測試任務先於實作任務。
- 共用 helper / API contract 先於 DOM render integration，且 helper 必須維持純函式、不得依賴 WebView DOM。
- 先建立 CSS token 與 generic high contrast 基礎，再進行視覺狀態細修；高對比深色與淺色以手動矩陣驗證。
- 先補齊 locale keys，再做最終 i18n 驗證。
- 每個故事的檢查點後都可停下來獨立驗證。

---

## 可平行處理的機會

- T004、T006、T007 可在 Phase 2 平行處理，因為分別修改 test、CSS、WebViewManager test。
- US1 的 T009/T010 可分別由 edit/preview 負責人平行處理；T011/T012/T013 都在 `media/css/blocklyEdit.css`，應序列化避免衝突。
- US2 的 T015/T016/T017 可平行建立測試；T025/T026/T027 可由不同人分語系批次平行處理。
- US3 的 T029 與 CSS/JS 任務可先平行，但 T033/T034 都在 `media/js/blocklyPreview.js`，應同一人或序列化。
- 收尾階段的 T039/T040/T043 可平行；T041/T042 建議在主要程式碼穩定後執行。

---

## 平行處理範例：使用者故事 1

```text
任務："T009 [US1] 在 media/js/blocklyEdit.js 於 updateTheme() 後重新計算 TXT 主題有效樣式"
任務："T010 [US1] 在 media/js/blocklyPreview.js 於 updateTheme() 後刷新 TXT preview 主題有效樣式"
任務："T014 [US1] 在 media/js/txtVirtualControlsContrast.js 新增 TXT canvas 與 panel surface 顏色解析輔助函式"
```

## 平行處理範例：使用者故事 2

```text
任務："T015 [US2] 在 src/test/suite/txtVirtualControlsContrast.test.ts 新增主題有效樣式測試"
任務："T016 [US2] 在 src/test/webviewPreview.test.ts 新增 non-TXT preview 回歸測試"
任務："T025 [US2] 在 media/locales/{bg,cs,de,es,fr}/messages.js 移除已淘汰的配色提示 locale keys"
任務："T026 [US2] 在 media/locales/{hu,it,ja,ko,pl}/messages.js 移除已淘汰的配色提示 locale keys"
任務："T027 [US2] 在 media/locales/{pt-br,ru,tr,zh-hant}/messages.js 移除已淘汰的配色提示 locale keys"
```

## 平行處理範例：使用者故事 3

```text
任務："T029 [US3] 在 src/test/webviewPreview.test.ts 新增 preview 唯讀鍵盤防護回歸測試"
任務："T036 [US3] 在 media/locales/{bg,cs,de,es,fr}/messages.js 新增狀態與焦點 locale keys"
任務："T037 [US3] 在 media/locales/{hu,it,ja,ko,pl}/messages.js 新增狀態與焦點 locale keys"
任務："T038 [US3] 在 media/locales/{pt-br,ru,tr,zh-hant}/messages.js 新增狀態與焦點 locale keys"
```

---

## 實作策略

### 先完成 MVP（僅使用者故事 1）

1. 完成 Phase 1：準備階段。
2. 完成 Phase 2：基礎建設階段。
3. 完成 Phase 3：US1。
4. 停下來驗證：使用 TXT edit/preview 在 light、dark、高對比深色、高對比淺色下確認 panel/canvas/button/focus 可辨識。
5. 若 MVP 驗證通過，再進入 US2 主題別手動配色與自動初始色。

### 漸進式交付

1. 準備階段 + 基礎建設階段 → helper / resource / CSS foundation 就緒。
2. US1 → 主題一致性 MVP，可獨立展示。
3. US2 → 主題別手動配色與自動初始色。
4. US3 → 補齊狀態、focus 與 readonly cues，並驗證 preview 唯讀阻擋語意。
5. 收尾階段 → i18n、compile/lint/tests、quickstart 驗證證據、安全檢查。

### 平行團隊策略

1. 一人處理 WebView helper/resource injection，一人處理 CSS token foundation，一人處理測試 scaffold。
2. Foundation 完成後：
   - 開發者 A：負責 US1 的主題與高對比 edit/preview。
   - 開發者 B：負責 US2 的主題有效樣式與 locale 批次清理。
   - 開發者 C：負責 US3 的 focus / readonly / state cues。
3. 最後共同執行 Phase 6 回歸與手動矩陣。

---

## 備註

- `[P]` 代表不同檔案或可安全分批處理，不代表可忽略依賴。
- 所有使用者故事任務都有 `[US1]` / `[US2]` / `[US3]` 可追蹤標記。
- WebView 視覺驗證依憲法允許的 UI 測試例外，以 `quickstart.md` 矩陣記錄。
- 高對比深色與淺色的驗證以手動矩陣為正式驗收依據；runtime 不強制要求穩定分辨兩種變體。
- 使用者輸入的 `displayName` / `identifier` 僅能以安全文字 API 呈現，不得用未清理 HTML。
- 不得自動改寫 `txtVirtualControls.controls[].style.backgroundColor` 或 `textColor`。
