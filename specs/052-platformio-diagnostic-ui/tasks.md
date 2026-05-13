---
description: "PlatformIO 診斷 UI 功能實作任務清單"
---

# 任務清單：PlatformIO 診斷 UI

**輸入**：`specs/052-platformio-diagnostic-ui/`  
**前置文件**：plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**測試**：依 `plan.md` 的驗證策略，本功能需補 targeted service / extension / panel tests，並執行 `compile`、`lint`、`validate:i18n` 與手動 smoke test。  
**組織方式**：任務依使用者故事分組，讓每個故事都能以最小可驗證增量交付，並完整對齊「獨立診斷 panel + 完整清單 + retest / copy」方案。

## 格式說明

- **[P]**: 可與同 Phase 其他任務並行（不同檔案，無未完成依賴）
- **[USx]**: 對應 `spec.md` 的使用者故事編號
- 所有任務含明確檔案路徑

---

## 第 1 階段：共享基礎設定

**目的**：先把 command、panel、i18n 與資料模型骨架準備好，避免後續故事各自長出不同命名與 message flow。

- [X] T001 [P] 在 `package.json`、`package.nls.json`、`package.nls.bg.json`、`package.nls.cs.json`、`package.nls.de.json`、`package.nls.es.json`、`package.nls.fr.json`、`package.nls.hu.json`、`package.nls.it.json`、`package.nls.ja.json`、`package.nls.ko.json`、`package.nls.pl.json`、`package.nls.pt-br.json`、`package.nls.ru.json`、`package.nls.tr.json` 與 `package.nls.zh-hant.json` 新增 `singular-blockly.checkPlatformioStatus` 與 `command.checkPlatformioStatus.title` 的命令貢獻與標題翻譯鍵
- [X] T002 [P] 在 `src/types/i18nKeys.ts`、`media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js` 與 `media/locales/zh-hant/messages.js` 新增 summary / status / reason / nextStep / action / scope 文案鍵與預設文案
- [X] T003 在 `src/types/platformioDiagnostic.ts` 建立 `DiagnosticItemId`、`DiagnosticSource`、`PlatformioDiagnosticItem`、`PlatformioDiagnosticSession`、`PlatformioDiagnosticPanelState`、`VersionProbeResult`、`ClipboardSummary` 與 panel message payload 型別
- [X] T004 在 `src/services/platformioDiagnosticService.ts` 建立 `PlatformioDiagnosticService` 基礎骨架，封裝 probe timeout、source classification、reason / nextStep builder 與 clipboard summary helper 邊界
- [X] T005 在 `src/webview/platformioDiagnosticPanel.ts` 與 `src/extension.ts` 建立單例 panel host 骨架、open / reveal 入口與 service 注入流程

---

## 第 2 階段：使用者故事 1 - 在獨立 panel 查看完整診斷清單（優先級：P1）🎯 MVP

**目標**：讓使用者可從 Command Palette 主動開啟一個獨立診斷 panel，查看 `pio`、`penv`、`python`、`pip`、`mpremote` 的完整結果，而不是只看通知摘要。  
**獨立驗證方式**：從 Command Palette 執行 `singular-blockly.checkPlatformioStatus`，會開啟或 reveal 同一個 panel，並顯示五個固定項目的狀態、實際 path、來源、reason、nextStep 與 scope 提醒。

### 使用者故事 1 的測試

- [X] T006 [P] [US1] 在 `src/test/services/platformioDiagnosticService.test.ts` 新增五個固定項目、PATH fallback、sibling `penv`、`reason` / `nextStep`、部分失敗與整體狀態判定的測試案例
- [X] T007 [P] [US1] 在 `src/test/extension.activate.test.ts` 新增 `singular-blockly.checkPlatformioStatus` 命令註冊與 panel open / reveal 行為的測試案例
- [X] T008 [P] [US1] 在 `src/test/webview/platformioDiagnosticPanel.test.ts` 新增 panel 初始 loading、完整清單 render、summary / tools / scope 三段結構與單例 lifecycle 的測試案例

### 使用者故事 1 的實作

- [X] T009 [US1] 在 `src/services/platformioDiagnosticService.ts` 實作 `pio` 與 `penv` 根目錄收集邏輯，沿用 `src/services/executableResolver.ts` 與現有 fallback 規則
- [X] T010 [US1] 在 `src/services/platformioDiagnosticService.ts` 實作 `python`、`pip`、`mpremote` 的 `penv` 感知診斷、來源標記、版本探測、`reason` 與 `nextStep`
- [X] T011 [US1] 在 `media/html/platformioDiagnostic.html`、`media/css/platformioDiagnostic.css`、`media/js/platformioDiagnostic.js` 實作摘要區、完整工具清單區、scope 區與既有 repo 視覺語言一致的 panel shell
- [X] T012 [US1] 在 `src/webview/platformioDiagnosticPanel.ts` 與 `src/extension.ts` 實作首次 command 開啟 panel 時的 loading / ready render pipeline；再次執行 command 僅 reveal 既有 panel，重新診斷只由 `platformioDiagnostic:retest` 觸發，且不綁定 upload 流程

**檢查點**：此時使用者故事 1 應可獨立運作，使用者能在獨立 panel 中看見完整診斷結果。

---

## 第 3 階段：使用者故事 2 - 重新測試並更新結果（優先級：P2）

**目標**：讓使用者在同一個 panel 內按下 `重新測試` 後，真正重新執行檢查並更新最新結果。  
**獨立驗證方式**：開啟 panel 後按下 `重新測試`，畫面會回到 loading，再顯示新的時間戳與更新後的五個固定項目。

### 使用者故事 2 的測試

- [X] T013 [P] [US2] 在 `src/test/extension.activate.test.ts` 與 `src/test/webview/platformioDiagnosticPanel.test.ts` 新增 `platformioDiagnostic:retest` 會重新進入 loading 並重新 render 的測試案例
- [X] T014 [P] [US2] 在 `src/test/services/platformioDiagnosticService.test.ts` 新增 fresh session timestamp、重新探測、部分失敗更新，以及單一工具 probe timeout 會結束等待並回傳可用結果／失敗狀態而不是讓 panel 卡死 loading 的測試案例

### 使用者故事 2 的實作

- [X] T015 [US2] 在 `media/js/platformioDiagnostic.js` 實作 `重新測試` 按鈕事件、loading 中按鈕鎖定與 message 發送
- [X] T016 [US2] 在 `src/webview/platformioDiagnosticPanel.ts` 與 `src/extension.ts` 實作 `platformioDiagnostic:retest` 處理流程，確保每次點擊都重新收集診斷而不沿用前一次結果

**檢查點**：此時使用者故事 2 應可獨立驗證，重新測試會產生新結果並正確更新 panel 狀態。

---

## 第 4 階段：使用者故事 3 - 複製可分享的診斷摘要（優先級：P3）

**目標**：讓使用者可以從 panel 複製固定格式的純文字診斷摘要，直接用於回報或求助。  
**獨立驗證方式**：在 panel 中按下 `複製診斷摘要`，剪貼簿內會得到含時間戳、整體狀態、五項結果、scope 提醒與警告／失敗摘要的純文字內容。

### 使用者故事 3 的測試

- [X] T017 [P] [US3] 在 `src/test/services/platformioDiagnosticService.test.ts` 新增 clipboard summary 格式、五項固定順序、`reason` / `nextStep` 精簡資訊與 scope 提醒的測試案例
- [X] T018 [P] [US3] 在 `src/test/extension.activate.test.ts` 與 `src/test/webview/platformioDiagnosticPanel.test.ts` 新增 `platformioDiagnostic:copySummary`、clipboard 寫入與 copyResult 回饋的測試案例

### 使用者故事 3 的實作

- [X] T019 [US3] 在 `src/services/platformioDiagnosticService.ts` 實作 clipboard plain-text summary builder，固定輸出五個項目、來源、`reason` / `nextStep` 精簡摘要與 scope 提醒
- [X] T020 [US3] 在 `media/js/platformioDiagnostic.js` 與 `src/webview/platformioDiagnosticPanel.ts` 實作 `複製診斷摘要` 動作、copyResult 回饋與無可複製資料時的處理

**檢查點**：此時使用者故事 3 應可獨立驗證，使用者能把可讀診斷摘要直接貼到 Issue 或對話中。

---

## 第 5 階段：收尾與跨故事工作

**目的**：收斂所有文案、視覺一致性、回歸保護與文件，確認功能真的能交付。

- [X] T021 [P] 在 `src/webview/platformioDiagnosticPanel.ts`、`media/html/platformioDiagnostic.html`、`media/css/platformioDiagnostic.css`、`media/js/platformioDiagnostic.js` 與 `src/services/localeService.ts` 校對 panel lifecycle、LocaleService 載入、狀態卡片、primary / secondary button 與 light / dark theme parity，確認視覺語言對齊 `media/html/blocklyEdit.html` 與 `media/css/blocklyEdit.css`
- [X] T022 [P] 逐一核對並同步 `specs/052-platformio-diagnostic-ui/spec.md`、`specs/052-platformio-diagnostic-ui/plan.md`、`specs/052-platformio-diagnostic-ui/research.md`、`specs/052-platformio-diagnostic-ui/data-model.md`、`specs/052-platformio-diagnostic-ui/quickstart.md`、`specs/052-platformio-diagnostic-ui/tasks.md`、`specs/052-platformio-diagnostic-ui/contracts/platformio-diagnostic-command.md`、`specs/052-platformio-diagnostic-ui/contracts/platformio-diagnostic-report.md` 與 `specs/052-platformio-diagnostic-ui/checklists/requirements.md`，確認 panel UX、baseline、manual override deferred 與 smoke test 語言一致
- [X] T023 對 `src/extension.ts`、`src/webview/platformioDiagnosticPanel.ts`、`src/types/platformioDiagnostic.ts`、`src/services/platformioDiagnosticService.ts`、`src/test/extension.activate.test.ts`、`src/test/webview/platformioDiagnosticPanel.test.ts`、`src/test/services/platformioDiagnosticService.test.ts`、`package.json`、`package.nls.json`、`package.nls.bg.json`、`package.nls.cs.json`、`package.nls.de.json`、`package.nls.es.json`、`package.nls.fr.json`、`package.nls.hu.json`、`package.nls.it.json`、`package.nls.ja.json`、`package.nls.ko.json`、`package.nls.pl.json`、`package.nls.pt-br.json`、`package.nls.ru.json`、`package.nls.tr.json`、`package.nls.zh-hant.json`、`src/types/i18nKeys.ts`、`media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js` 與 `media/locales/zh-hant/messages.js` 執行 targeted tests（含 probe timeout 相關案例），以及 `npm run compile`、`npm run lint`、`npm run validate:i18n` 與 `npm test`
- [X] T024 依 `specs/052-platformio-diagnostic-ui/quickstart.md` 執行 Extension Development Host 手動 smoke test，確認 command 開 panel 時約 1 秒內可見 loading UI、panel reopen / reveal、完整清單、`reason` / `nextStep`、`重新測試`、`複製診斷摘要`、theme parity，以及代表性 timeout / latency 情境下單次診斷於 10 秒內完成或以 timeout graceful 結束，且 `media/js/blocklyEdit.js` / `media/css/blocklyEdit.css` upload button icon 不會非預期旋轉
- [X] T025 在 `package.json`、`src/webview/platformioDiagnosticPanel.ts`、`media/html/platformioDiagnostic.html`、`media/js/platformioDiagnostic.js`、`src/services/arduinoUploader.ts` 與 `src/services/micropythonUploader.ts` 核對本次未新增手動 override 欄位、未將診斷入口綁進 upload 流程，並保留「手動設定 `pio` / `penv` / `python` / `pip` / `mpremote` 路徑屬於下一次 SDD」的範圍聲明

---

## 依賴與執行順序

### 階段依賴

- **第 1 階段：共享基礎設定** — 可立即開始
- **第 2 階段：使用者故事 1** — 依賴共享基礎設定完成，是 MVP
- **第 3 階段：使用者故事 2** — 依賴使用者故事 1 的 panel 與 session 基線
- **第 4 階段：使用者故事 3** — 依賴使用者故事 1 的 panel / summary 基線
- **第 5 階段：收尾與跨故事工作** — 依賴所有目標故事完成

### 使用者故事依賴

- **US1 (P1)**：Foundational 完成後可立即開始，無其他故事依賴
- **US2 (P2)**：依賴 US1 已有的 panel lifecycle 與結果呈現
- **US3 (P3)**：依賴 US1 已有的診斷 session 與 panel render state

### 各故事內部順序

- 測試任務先寫，並先看到失敗或缺功能狀態
- 型別 / service / panel host 先於 WebView 互動整合
- panel render 完成後，再做 story-specific 動作驗證

---

## 可並行機會

- **Setup**：`T001` 與 `T002` 可並行
- **Foundational**：`T003` 與 `T004` 可串接進行；`T005` 等 `T003` / `T004` 穩定後接續
- **US1**：`T006`、`T007`、`T008` 可並行
- **US2**：`T013` 與 `T014` 可並行
- **US3**：`T017` 與 `T018` 可並行
- **Polish**：`T021` 與 `T022` 可並行，`T023`、`T024`、`T025` 最後收尾

### 並行範例：使用者故事 1

- 參考 `T006`–`T008`：service、extension、panel 三條測試線可並行推進。

### 並行範例：使用者故事 2

- 參考 `T013`–`T014`：可同步驗證 retest message flow 與 probe timeout / fresh session 行為。

### 並行範例：使用者故事 3

- 參考 `T017`–`T018`：clipboard summary builder 與 copyResult message flow 可並行完成。

---

## 實作策略

### MVP 優先（先交付使用者故事 1）

1. 完成第 1 階段：共享基礎設定
2. 完成第 2 階段：使用者故事 1
3. **停止並驗證**：從 Command Palette 執行診斷，確認獨立 panel 會開啟、完整清單可讀、不是 Quick Pick / notification-only

### 漸進式交付

1. Setup 完成後，建立共用 panel / service 骨架
2. 交付 US1：先讓使用者看見獨立 panel 與完整清單（MVP）
3. 交付 US2：補上重新測試，讓 panel 形成完整排查閉環
4. 交付 US3：補上 clipboard summary，完成支援/回報閉環
5. 最後做 i18n、視覺一致性、baseline smoke 與文件收尾

### 多人協作策略

若多人並行：

1. 一人先完成 Setup + panel host skeleton
2. 之後可分工：
   - 開發者 A：US1 service + panel 初次 render 主流程
   - 開發者 B：US2 retest message flow 與測試
   - 開發者 C：US3 clipboard summary 與測試
3. 最後共同完成 Polish 與驗證

---

## 備註

- 所有任務皆以目前已落地的 `executableResolver.ts` / uploader fallback 行為為基線
- 第一版的主要 UI 載體是獨立 WebView 診斷 panel，不做 Quick Pick / notification-only 主介面
- 第一版不做自動修復、不做 PlatformIO extension 狀態檢查
- 第一版也不做手動設定工具路徑；若需要覆寫 `pio` / `penv` / `python` / `pip` / `mpremote`，請留待下一次 SDD
- `python`、`pip`、`mpremote` 必須明確表達是否來自偵測到的 `penv`
- 每個 story 完成後都應能單獨演示，不必等全部任務都做完才驗證
- upload button icon regression 與 executableResolver / uploader fallback 修正屬既有基線，必須持續受到 smoke / regression 保護
