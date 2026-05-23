# Tasks: 編輯器主題 surface 一致性

**輸入**：來自 `/specs/057-editor-theme-surface-consistency/` 的設計文件  
**前置文件**：`plan.md`（必要）、`spec.md`（必要）、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

**測試策略**：包含測試任務。此功能的 plan 與 contracts 已明確要求 source-contract tests，用來鎖定 HTML/CSS 主題 ownership、即時主題切換、高對比 allowlist 與 touched feedback 規則。每個故事的測試任務必須先撰寫，並在實作前確認會失敗。

**組織方式**：任務依 user story 分組，讓每個故事都能獨立實作與驗證。

## 格式：`[ID] [P?] [Story] 任務描述`

- **[P]**：可平行執行；代表該任務碰觸不同檔案，且不依賴尚未完成的任務。
- **[Story]**：user story 標籤（`US1`、`US2`、`US3`、`US4`），僅用於 story phases。
- 每個任務描述都必須包含明確的 workspace-relative 檔案路徑。

## Phase 1: Setup（共享基礎設施）

**目的**：準備輕量驗證 scaffold，不改變產品行為。

- [ ] T001 建立 quickstart 驗證矩陣標題與紀錄欄位於 `specs/057-editor-theme-surface-consistency/manual-validation.md`
- [ ] T002 [P] 建立 source-contract 檔案讀取與 allowlist 共用 helper 於 `src/test/suite/editorThemeSurfaceContractUtils.ts`

---

## Phase 2: Foundational（阻塞性前置任務）

**目的**：建立所有 user stories 都會依賴的 editor-owned token 與共用契約基礎。

**⚠️ 重要**：此 phase 完成前，不應開始任何 user story 實作。

- [ ] T003 在 `media/css/blocklyEdit.css` 定義共享 editor-owned CSS custom properties，涵蓋 surface、field、card、notice、focus ring、scrollbar、description 與 warning
- [ ] T004 [P] 在 `src/test/suite/editorThemeSurfaceContractUtils.ts` 編碼 host-token allowlist 規則，涵蓋高對比、focus ring、font token 與 standalone host-themed pages
- [ ] T005 [P] 在 `src/test/webviewManager.test.ts` 補 WebView initial theme injection source-contract coverage，鎖定 `window.initialTheme` 與 `body.theme-{theme}`
- [ ] T006 [P] 在 `src/test/suite/editorThemeSwitchContract.test.ts` 補 runtime theme switch source-contract coverage，鎖定 `updateTheme(theme)` 更新 body class、呼叫 Blockly `setTheme`，且不重設 `webview.html`

**Checkpoint**：Foundation ready；source-contract helper 與共享 editor-owned tokens 已存在。

---

## Phase 3: User Story 1 - 主要編輯器視窗在交錯主題下仍保持一致（Priority: P1）🎯 MVP

**目標**：TXT connection modal 與 Sample Browser 必須跟隨 Blockly editor theme，而不是 VS Code host theme；即使 host/editor 使用相反 light/dark 主題也一致。

**獨立驗證**：將 VS Code 與 Blockly editor 設為相反 light/dark 主題，開啟 TXT connection modal 與 Sample Browser，確認兩者使用 editor theme；在視窗保持開啟時切換 editor theme，確認 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 即換色，且不 reload、不重開、不清空輸入內容。

### User Story 1 測試任務

> 先撰寫這些測試，並在實作前確認它們會失敗。

- [ ] T007 [P] [US1] 在 `src/test/suite/editorThemeSurfaceTxtModalContract.test.ts` 新增失敗中的 source-contract test，確認 TXT connection modal inputs 不含 inline `--vscode-input-*` styles
- [ ] T008 [P] [US1] 在 `src/test/suite/editorThemeSurfaceSampleBrowserContract.test.ts` 新增失敗中的 source-contract test，確認 Sample Browser card、category、notice、loading 與 empty-state selectors 不使用 host base tokens
- [ ] T009 [P] [US1] 在 `src/test/suite/editorThemeMainSurfaceSwitchContract.test.ts` 新增失敗中的 source-contract test，確認主要 editor surfaces 透過 runtime `updateTheme(theme)` 更新，且沒有 WebView reload 假設

### User Story 1 實作任務

- [ ] T010 [US1] 在 `media/html/blocklyEdit.html` 將 TXT connection input 的 inline host styles 改為可重用的 `txt-connection-input` class attributes
- [ ] T011 [US1] 在 `media/css/blocklyEdit.css` 為 TXT connection modal 套用 editor-owned modal、label、input、hint、status 與 button styles
- [ ] T012 [US1] 在 `media/css/blocklyEdit.css` 將 Sample Browser modal、category header、sample card、offline notice、loading、empty-state 與 action-button styles 改用 editor-owned tokens
- [ ] T013 [US1] 在 `media/js/blocklyEdit.js` 確認 Sample Browser rendering 保留可 theme 的 card、description、button、spinner、offline notice 與 empty notice classes
- [ ] T014 [US1] 在 `media/js/blocklyEdit.js` 確認 Extension Host theme update message 會呼叫 `updateTheme(theme)`，並在保持 open modal state、input value 與 scroll state 的情況下完成下一次 repaint 換色

**Checkpoint**：User Story 1 可用相反 host/editor 主題獨立驗證 TXT modal 與 Sample Browser。

---

## Phase 4: User Story 2 - 編輯器控制面與外框維持單一主題 owner（Priority: P1）

**目標**：TXT virtual controls chrome 使用 editor-owned tokens，同時保留使用者自訂 control colors。

**獨立驗證**：在相反 host/editor 主題下開啟 TXT virtual controls，確認 panel/canvas/inspector/chrome 跟隨 editor theme；保持 controls 開啟並切換 editor theme，確認 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 即換色，且自訂 control colors 不被覆蓋。

### User Story 2 測試任務

> 先撰寫這些測試，並在實作前確認它們會失敗。

- [ ] T015 [P] [US2] 在 `src/test/suite/editorThemeSurfaceTxtVirtualControlsContract.test.ts` 新增失敗中的 source-contract test，確認 TXT virtual controls base tokens 不由 `body.vscode-light` 或 `body.vscode-dark` 指派
- [ ] T016 [P] [US2] 在 `src/test/suite/editorThemeTxtVirtualControlsSwitchContract.test.ts` 新增失敗中的 source-contract test，確認 TXT virtual controls theme-switch refresh 保留自訂 colors，且沒有 WebView reload 假設

### User Story 2 實作任務

- [ ] T017 [US2] 在 `media/css/blocklyEdit.css` 將 TXT virtual controls base token assignments 從 `body.vscode-light` / `body.vscode-dark` 移到 `body.theme-light` / `body.theme-dark`
- [ ] T018 [US2] 在 `media/css/blocklyEdit.css` 將 TXT virtual controls panel、canvas、inspector、splitter、toolbar 與 mode badge chrome 改用共享 editor-owned tokens
- [ ] T019 [US2] 在 `media/css/blocklyEdit.css` 將 TXT virtual controls warning 與 invalid-reference chrome 的 host tokens 改為 editor-owned warning tokens，同時保留 allowlisted contrast rings
- [ ] T020 [US2] 在 `media/js/txtVirtualControlsContrast.js` 更新 TXT virtual controls contrast fallback logic，讓 editor-owned defaults 優先使用 `theme-dark` 而不是 `vscode-dark`
- [ ] T021 [US2] 在 `media/js/blocklyEdit.js` 確認 `updateTheme(theme)` 會 refresh TXT virtual controls UI，且不覆蓋使用者自訂 colors

**Checkpoint**：User Story 2 可用相反 host/editor 主題獨立驗證 TXT virtual controls。

---

## Phase 5: User Story 3 - 本輪觸及到的提示維持原意且更容易看懂（Priority: P2）

**目標**：本輪 touched hints、notices、status text 與 warnings 保留既有角色，同時在 editor light/dark 主題下都可讀。

**獨立驗證**：在 TXT modal、Sample Browser 與 TXT virtual controls 中觸發本輪 touched feedback，確認每個 element 保留原角色、關鍵資訊不是 hover-only，且在 editor light/dark 下清楚可讀。

### User Story 3 測試任務

> 先撰寫這些測試，並在實作前確認它們會失敗。

- [ ] T022 [P] [US3] 在 `src/test/suite/editorThemeTouchedFeedbackContract.test.ts` 新增失敗中的 source-contract test，檢查 touched feedback 的低對比 leakage 與禁止的固定 `#888` patterns
- [ ] T023 [P] [US3] 在 `src/test/suite/editorThemeTouchedFeedbackI18nContract.test.ts` 新增失敗中的 source-contract test，確認 touched feedback visible text 維持不變，或有 locale keys 支援

### User Story 3 實作任務

- [ ] T024 [US3] 在 `media/css/blocklyEdit.css` 將 editor-owned description、notice、loading、status 與 empty-state tokens 套用到 TXT SSH hint 與 Sample Browser feedback
- [ ] T025 [US3] 在 `media/css/blocklyEdit.css` 將 editor-owned hint、empty-state、warning 與 invalid-reference tokens 套用到 TXT virtual controls feedback surfaces
- [ ] T026 [US3] 在 `media/html/blocklyEdit.html` 保留既有 visible text，只調整 touched feedback 的 class/style ownership
- [ ] T027 [US3] 在 `media/js/blocklyEdit.js` 保留既有 visible text 與 locale-key usage，只更新 touched feedback rendering classes

**Checkpoint**：User Story 3 可用既有 feedback roles 與可讀 touched hints/notices/status text 獨立驗證。

---

## Phase 6: User Story 4 - 在高對比與交錯主題情境下仍可完成核心操作（Priority: P3）

**目標**：P1 surfaces 在高對比 smoke check 與所有必要 light/dark host/editor 組合下仍可用。

**獨立驗證**：執行 quickstart 的高對比 smoke check 與四組 light/dark matrix；高對比通過標準為主要文字可讀、input/card/panel 邊界可辨識、focus ring 可見、主要操作按鈕可辨識、必要 status/hint 沒有消失，且不需要切回相同 host/editor 主題才能完成核心操作。

### User Story 4 測試任務

> 先撰寫這些測試，並在實作前確認它們會失敗。

- [ ] T028 [P] [US4] 在 `src/test/suite/editorThemeHighContrastContract.test.ts` 新增失敗中的 source-contract test，確認 high-contrast、focus、font 與 contrast token usages 符合明確 allowlist

### User Story 4 實作任務

- [ ] T029 [US4] 在 `media/css/blocklyEdit.css` 新增或保留 TXT modal、Sample Browser 與 TXT virtual controls editor-owned tokens 的 high-contrast 與 forced-colors overrides
- [ ] T030 [US4] 在 `specs/057-editor-theme-surface-consistency/manual-validation.md` 記錄 M5 high-contrast smoke-check 結果、截圖或備註，並逐項確認文字、邊界、focus ring、主要按鈕與必要 status/hint

**Checkpoint**：User Story 4 可用高對比 smoke-check evidence 獨立驗證。

---

## Phase 7: Polish & Cross-Cutting Concerns

**目的**：完成跨 stories 的最終驗證、文件紀錄與回歸檢查。

- [ ] T031 [P] 執行 compile、lint 與 source-contract test verification，並將 command results 記錄於 `specs/057-editor-theme-surface-consistency/manual-validation.md`
- [ ] T032 [P] 執行 i18n validation，或在沒有 visible text 變更時將原因記錄於 `specs/057-editor-theme-surface-consistency/manual-validation.md`
- [ ] T033 依 quickstart 執行 M1-M4 manual light/dark matrix，並將 pass/fail notes 記錄於 `specs/057-editor-theme-surface-consistency/manual-validation.md`
- [ ] T034 [P] 檢查 `media/css/platformioDiagnostic.css` 仍維持 standalone host-themed exception，並將排除理由記錄於 `specs/057-editor-theme-surface-consistency/manual-validation.md`
- [ ] T035 [P] 若本輪實作觸及 `media/css/shadowBlock.css` 或相關 secondary overlay 檔案，則補上 editor-theme/即時更新修正或在 `specs/057-editor-theme-surface-consistency/manual-validation.md` 明確記錄刻意例外
- [ ] T036 [P] 從 `media/css/blocklyEdit.css` 移除最終 touched editor files 中的暫時 debugging styles 或 comments
- [ ] T037 [P] 從 `media/html/blocklyEdit.html` 移除最終 touched editor markup 中的暫時 debugging attributes 或 comments

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：沒有依賴，可立即開始。
- **Foundational（Phase 2）**：依賴 Setup 完成；會阻塞所有 user stories。
- **User Stories（Phase 3+）**：依賴 Foundational 完成。
  - **US1 與 US2 都是 P1**，Foundation 完成後可平行推進，但若多人同時修改 `media/css/blocklyEdit.css` 必須協調合併。
  - **US3（P2）** 依賴 US1/US2 相關 touched feedback selectors 穩定後開始，但仍可透過 feedback contract 獨立驗證。
  - **US4（P3）** 依賴 P1 token structure 與 high-contrast allowlist rules。
- **Polish（Phase 7）**：依賴欲交付的 user stories 完成。

### User Story Dependencies

- **US1（P1）**：Phase 2 後可開始；不依賴 US2、US3 或 US4。
- **US2（P1）**：Phase 2 後可開始；不依賴 US1、US3 或 US4，但需協調 `media/css/blocklyEdit.css` merge conflicts。
- **US3（P2）**：US1 和/或 US2 的 touched feedback selectors 存在後開始；不得改變 feedback role 或 text，除非同步 locale-backed 更新。
- **US4（P3）**：US1 與 US2 token changes 後開始；驗證 accessibility/high-contrast exceptions。

### 每個 User Story 內部順序

- 先寫測試，並在實作前確認測試會失敗。
- 同時需要 CSS/HTML 與 JS 時，先完成 CSS/HTML ownership changes，再檢查 JS refresh flow。
- 除非明確新增 locale-backed 文字，否則保留 user-visible text 不變。
- 每個 story 完成 checkpoint 後，再移往下一個 priority。

---

## Parallel Execution Examples

### User Story 1

```text
Task: T007 TXT modal inline host-token contract test in src/test/suite/editorThemeSurfaceTxtModalContract.test.ts
Task: T008 Sample Browser host-token contract test in src/test/suite/editorThemeSurfaceSampleBrowserContract.test.ts
Task: T009 Main surface theme-switch contract test in src/test/suite/editorThemeMainSurfaceSwitchContract.test.ts
```

### User Story 2

```text
Task: T015 TXT virtual controls host-theme leakage contract test in src/test/suite/editorThemeSurfaceTxtVirtualControlsContract.test.ts
Task: T016 TXT virtual controls theme-switch contract test in src/test/suite/editorThemeTxtVirtualControlsSwitchContract.test.ts
```

### User Story 3

```text
Task: T022 Touched feedback color leakage contract test in src/test/suite/editorThemeTouchedFeedbackContract.test.ts
Task: T023 Touched feedback i18n guard contract test in src/test/suite/editorThemeTouchedFeedbackI18nContract.test.ts
```

### User Story 4

```text
Task: T028 High-contrast allowlist contract test in src/test/suite/editorThemeHighContrastContract.test.ts
Task: T030 High-contrast manual evidence in specs/057-editor-theme-surface-consistency/manual-validation.md
```

---

## Implementation Strategy

### MVP First（只做 User Story 1）

1. 完成 Phase 1 Setup。
2. 完成 Phase 2 Foundational token 與 contract helper 工作。
3. 完成 Phase 3 User Story 1。
4. 停下來驗證相反 host/editor 主題下的 TXT connection modal 與 Sample Browser。
5. MVP 可 demo/review 後，再擴展到 TXT virtual controls。

### Incremental Delivery

1. Setup + Foundation 建立 editor-owned tokens 與共享 contract helpers。
2. US1 修正主要 modal/browser surfaces，交付可見 MVP。
3. US2 將相同 ownership 規則延伸到 TXT virtual controls chrome。
4. US3 強化 touched feedback readability，但不建立新的 feedback framework。
5. US4 驗證 high-contrast 與完整 matrix behavior。
6. Polish 記錄自動化與手動驗證 evidence。

### Parallel Team Strategy

多人協作時：

1. 一位開發者先完成 setup 與 contract helper scaffolding。
2. Foundation 完成後：
   - Developer A：US1 HTML/CSS 與 Sample Browser contracts。
   - Developer B：US2 TXT virtual controls CSS/JS contracts。
   - Developer C：在相關 selectors 穩定後處理 US3 feedback contracts。
3. 因為 US1、US2、US3、US4 都會碰到 `media/css/blocklyEdit.css`，需要小心協調 CSS edits。

---

## Notes

- `[P]` tasks 代表碰觸不同檔案，或是可獨立執行的驗證/紀錄任務。
- Source-contract tests 應採輕量 file-content checks，因為 WebView browser code 不能直接 import 到 Node.js tests。
- `media/css/platformioDiagnostic.css` 是明確 standalone host-themed exception，本功能不應轉成 editor-owned tokens。
- `media/css/shadowBlock.css` 是 opportunistic；只有本輪實作實際觸及時，才依 T035 套用相同 editor-theme 與 immediate-update 規則或記錄例外。
- 使用 git workflow 時，建議每完成一個 story 或 logical group 後提交一次。