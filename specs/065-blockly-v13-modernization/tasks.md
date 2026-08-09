# 任務：Blockly 13 現代化升級

**輸入**：`specs/065-blockly-v13-modernization/` 下的 spec、plan、research、data model、contracts 與 quickstart

**測試要求**：本功能明確要求相容性、鍵盤、語系、效能及封裝驗收，因此各使用者故事均包含自動或人工測試任務。

## Phase 1：設定與升級前基準

**目的**：在更換 Blockly 版本前固定可重現的資料、程式輸出及效能基準。

- [ ] T001 建立 Arduino、CyberBrick、TXT、變數、函式、mutator、shadow、locked、orphan 的 v12 JSON/XML fixtures 與預期輸出於 `src/test/fixtures/blockly-v13/`
- [ ] T002 [P] 建立固定 500-block workspace benchmark harness 於 `scripts/benchmark-blockly-workspace.js`
- [ ] T003 使用 Blockly 12.3.1 執行 fixtures 與 benchmark，記錄環境、輸出與時間基準於 `specs/065-blockly-v13-modernization/validation/baseline.md`
- [ ] T004 將 Blockly、Modern theme 與 Node engine 更新至計畫版本於 `package.json`
- [ ] T005 重新解析並鎖定相依版本，確認 Blockly runtime/media/theme 內容於 `package-lock.json`

---

## Phase 2：共同基礎（阻擋所有使用者故事）

**目的**：建立 editor／preview 共用的 runtime、明確 workspace ownership 與相容性守門測試。

**⚠️ 關鍵**：本階段完成前不得開始使用者故事實作。

- [ ] T006 建立 runtime config、canonical workspace accessor、重建 guard 與 dispose lifecycle 於 `media/js/blocklyRuntime.js`
- [ ] T007 將共用 runtime script、套件內 media URI 與十五語系 core URI map 注入 editor／preview 於 `src/webview/webviewManager.ts`、`media/html/blocklyEdit.html`、`media/html/blocklyPreview.html`
- [ ] T008 [P] 新增 editor／preview runtime、media 與 locale URI 注入 contract tests 於 `src/test/webviewManager.test.ts`、`src/test/webviewPreview.test.ts`
- [ ] T009 將 editor／preview 核心流程改用 canonical accessor 或明確 workspace 參數於 `media/js/blocklyEdit.js`、`media/js/blocklyPreview.js`
- [ ] T010 [P] 將 AI、shadow 與實驗標記模組改用明確 workspace 參數於 `media/js/shadowBlockManager.js`、`media/js/shadowKeyboardHandler.js`、`media/js/experimentalBlockMarker.js`
- [ ] T011 [P] 將自訂 block methods 的 main workspace fallback 改為 `this.workspace` 或 app accessor 於 `media/blockly/blocks/arduino.js`、`media/blockly/blocks/motors.js`
- [ ] T012 [P] 將 generator 的 main workspace 查詢改為呼叫端 workspace 於 `media/blockly/generators/arduino/index.js`
- [ ] T013 建立禁止新增已移除 API、private fields、internal DOM path 與核心 prototype monkeypatch 的 contract test，先將升級前既有命中逐項列為 temporary allowlist 於 `src/test/suite/blocklyV13Compatibility.contract.test.ts`
- [ ] T014 執行共同基礎 contract tests，確認 temporary allowlist 以外無新命中並修正 runtime script 載入順序於 `src/test/webviewManager.test.ts`、`src/test/webviewPreview.test.ts`、`src/test/suite/blocklyV13Compatibility.contract.test.ts`

**Checkpoint**：editor 與 preview 可建立／取得／dispose 明確 workspace，且所有後續變更有禁止 API 守門測試。

---

## Phase 3：使用者故事 1－既有專案可無痛延續（優先級：P1）🎯 MVP

**目標**：既有 JSON/XML 工作區可載入、儲存及產生等價程式，變數與動態積木狀態完整。

**獨立測試**：執行三種開發板 fixtures 的 load/save/reopen/code generation，比對所有動態狀態與 golden output。

### 測試

- [ ] T015 [P] [US1] 新增 JSON/XML workspace round-trip 與舊備份不可覆寫 contract tests 於 `src/test/suite/blocklyV13WorkspaceCompatibility.test.ts`
- [ ] T016 [P] [US1] 新增 Arduino、MicroPython、TXT generator golden output tests 於 `src/test/suite/blocklyV13GeneratorCompatibility.test.ts`
- [ ] T017 [P] [US1] 新增函式參數、mutator、shadow、locked 與 variable extra-state contract tests 於 `src/test/suite/blocklyV13DynamicState.contract.test.ts`
- [ ] T018 [P] [US1] 新增 prompt／confirm request ID、取消、重複 result 與板別驗證 message tests 於 `src/test/messageHandler.test.ts`、`src/test/webview/blocklyDialog.contract.test.ts`

### 實作

- [ ] T019 [US1] 將 procedure generator 的參數存取改為 VariableModel 名稱並維持輸出於 `media/blockly/generators/micropython/functions.js`、`media/blockly/generators/txt/python_common.js`
- [ ] T020 [US1] 實作 `blocklyDialogPrompt/Result` 與 `blocklyDialogConfirm/Result` Extension Host handler 於 `src/webview/messageHandler.ts`
- [ ] T021 [US1] 安裝 Blockly 公開 dialog adapter 並移除 FieldVariable、Variables.createVariable 特殊覆寫於 `media/js/blocklyRuntime.js`、`media/js/blocklyEdit.js`
- [ ] T022 [US1] 將變數新增、重新命名、刪除與查詢統一為 VariableMap 並移除偽造事件於 `media/js/blocklyEdit.js`、`media/blockly/blocks/functions.js`
- [ ] T023 [US1] 將舊事件別名改為 v13 block event 常數於 `media/blockly/blocks/functions.js`
- [ ] T024 [US1] 將 VARIABLE 與 FUNCTION dynamic flyout 改為 JSON flyout items 於 `media/js/blocklyEdit.js`
- [ ] T025 [US1] 將 runtime shadow XML 建立改為 JSON shadow state 於 `media/blockly/blocks/arduino.js`、`media/blockly/blocks/functions.js`、`media/blockly/blocks/loops.js`、`media/blockly/blocks/txt.js`
- [ ] T026 [US1] 稽核所有動態積木的 `saveExtraState/loadExtraState` 並僅保留 legacy mutation hooks 於 `media/blockly/blocks/arduino.js`、`media/blockly/blocks/functions.js`、`media/blockly/blocks/motors.js`、`media/blockly/blocks/txt.js`
- [ ] T027 [US1] 移除 WorkspaceSvg.cleanUp prototype 覆寫，讓整理座標由集中式 debounced save 與既有空狀態 guard 保存於 `media/js/blocklyEdit.js`

**Checkpoint**：P1 fixtures 全數通過；可獨立交付「資料與程式輸出相容」MVP。

---

## Phase 4：使用者故事 2－使用新版且一致的積木介面（優先級：P2）

**目標**：editor／preview 採品牌化 Thrasos、套件內媒體及新版焦點／輸入視覺。

**獨立測試**：在明亮、深色、高對比及離線環境檢查兩種工作區的積木、控制、toolbox、flyout 與 preview。

### 測試

- [ ] T028 [P] [US2] 新增 Thrasos、Singular theme、套件內 media 與 preview read-only contract tests 於 `src/test/suite/blocklyV13Ui.contract.test.ts`
- [ ] T029 [P] [US2] 新增搜尋高亮及實驗標記不得存取 renderer internal path／prototype 的 contract tests 於 `src/test/suite/blocklyV13Marker.contract.test.ts`

### 實作

- [ ] T030 [US2] 在 editor／preview 明確設定 Thrasos、Singular theme 與套件內 media 於 `media/js/blocklyEdit.js`、`media/js/blocklyPreview.js`
- [ ] T031 [US2] 調整 Thrasos block、focus ring、invalid input、flyout DOM、border-box 與 forced-colors 樣式於 `media/css/blocklyEdit.css`、`media/css/experimentalBlocks.css`
- [ ] T032 [US2] 將搜尋高亮改為對 block SVG root 套用 app-owned class 於 `media/js/blocklyEdit.js`、`media/css/blocklyEdit.css`
- [ ] T033 [US2] 將實驗積木標記改用 workspace events、公開 toolbox/flyout getter 與 MutationObserver 於 `media/js/experimentalBlockMarker.js`
- [ ] T034 [US2] 移除 toolbox/flyout private field 與手動 flyout 高度操作，改用公開 getter 及 v13 版面行為於 `media/js/blocklyEdit.js`、`media/blockly/blocks/functions.js`
- [ ] T035 [US2] 執行明亮／深色／高對比／離線 editor-preview 視覺矩陣並記錄結果於 `specs/065-blockly-v13-modernization/validation/ui.md`

**Checkpoint**：新版 UI 可獨立展示，且不需外部 Blockly 資源。

---

## Phase 5：使用者故事 3－以鍵盤與輔助科技完成主要操作（優先級：P3）

**目標**：保留 Blockly 13 預設導覽，AI 與 IME 客製行為不偷取焦點或按鍵，VoiceOver 可理解主要流程。

**獨立測試**：只使用鍵盤及 VoiceOver 完成 toolbox → flyout → workspace → field → variable → mutator 的主要操作。

### 測試

- [ ] T036 [P] [US3] 新增 AI suggestion active/inactive、Blockly focus、文字欄位與 IME composition 快捷鍵 contract tests 於 `src/test/suite/shadowKeyboardHandler.contract.test.ts`
- [ ] T037 [P] [US3] 更新 IME compatibility contract 以禁止 protected prototype patch 並驗證 composition 行為於 `src/test/suite/blocklyImeCompatibility.contract.test.ts`
- [ ] T038 [P] [US3] 新增 custom block、field、input、icon 與 dialog ARIA label 稽核契約於 `src/test/suite/blocklyV13Accessibility.contract.test.ts`

### 實作

- [ ] T039 [US3] 將 AI 建議快捷鍵註冊至 ShortcutRegistry 並以 suggestion/focus/composition precondition 控制於 `media/js/shadowKeyboardHandler.js`
- [ ] T040 [US3] 移除 FieldInput keydown prototype patch；若 fixture 仍失敗則註冊限定用途的 app-owned FieldTextInput subclass 於 `media/js/blocklyRuntime.js`、`media/js/blocklyEdit.js`
- [ ] T041 [US3] 依 T038 稽核結果為描述不明確的 custom blocks、fields 與 inputs 補充可翻譯 ARIA 名稱於 `media/blockly/blocks/arduino.js`、`media/blockly/blocks/cyberbrick.js`、`media/blockly/blocks/esp32-wifi-mqtt.js`、`media/blockly/blocks/functions.js`、`media/blockly/blocks/huskylens.js`、`media/blockly/blocks/loops.js`、`media/blockly/blocks/motors.js`、`media/blockly/blocks/pixetto.js`、`media/blockly/blocks/rc.js`、`media/blockly/blocks/sensors.js`、`media/blockly/blocks/txt.js`、`media/blockly/blocks/x11.js`、`media/blockly/blocks/x12.js`、`media/locales/*/messages.js`
- [ ] T042 [US3] 驗證 dialog 關閉後的焦點恢復與 pending request 清理於 `media/js/blocklyRuntime.js`、`src/webview/messageHandler.ts`
- [ ] T043 [US3] 執行純鍵盤、VoiceOver 與高對比完整矩陣並記錄缺陷／結果於 `specs/065-blockly-v13-modernization/validation/accessibility.md`

**Checkpoint**：無阻斷性鍵盤問題，無嚴重／高優先級 VoiceOver 問題。

---

## Phase 6：使用者故事 4－切換語言後完整一致（優先級：P4）

**目標**：十五語系在 runtime 切換時同步更新 Blockly core 與 Singular 訊息，並安全重建 workspace。

**獨立測試**：對十五語系執行 A→B→A，確認 workspace、board、theme、visible labels 與 ARIA strings 無資料遺失或舊語言殘留。

### 測試

- [ ] T044 [P] [US4] 新增十五個官方 locale URI 存在、core-before-project 載入順序與 A→B→A contract tests 於 `src/test/suite/blocklyV13Locale.contract.test.ts`
- [ ] T045 [P] [US4] 新增語言重建期間空狀態 guard、失敗 rollback 與 preview 狀態保留 tests 於 `src/test/webview/languageSwitch.contract.test.ts`

### 實作

- [ ] T046 [US4] 實作官方 core locale script promise loader 與 project override 順序於 `media/js/blocklyRuntime.js`
- [ ] T047 [US4] 將 editor languageManager 改為保存 JSON、重建、還原 board/theme/listeners 的非同步流程於 `media/html/blocklyEdit.html`、`media/js/blocklyEdit.js`
- [ ] T048 [US4] 將 preview languageManager 改為相同的唯讀重建與 rollback 流程於 `media/html/blocklyPreview.html`、`media/js/blocklyPreview.js`
- [ ] T049 [US4] 擴充國際化驗證以檢查十五語系官方 core mapping 與新增 ARIA project keys 於 `scripts/validate-i18n.js`、`src/test/localeService.test.ts`
- [ ] T050 [US4] 執行十五語系 A→B→A visible/ARIA 驗收並記錄結果於 `specs/065-blockly-v13-modernization/validation/locales.md`

**Checkpoint**：十五語系切換無前一語言殘留且不遺失 workspace 狀態。

---

## Phase 7：收尾與跨領域驗證

**目的**：完成效能、封裝、離線、安全、文件與全部完成條件。

- [ ] T051 以相同環境重跑 500-block benchmark，確認退化不超過 10% 並記錄比較於 `specs/065-blockly-v13-modernization/validation/performance.md`
- [ ] T052 [P] 更新未發布相依升級、相容性說明與專案 runtime baseline 於 `CHANGELOG.md`、`docs/specifications/05-dependencies/dependency-upgrades.md`、`AGENTS.md`
- [ ] T053 執行 `npm run compile`、`npm run lint`、`npm test`、`npm run test:integration`、`npm run validate:i18n`、`npm run package` 並記錄結果於 `specs/065-blockly-v13-modernization/validation/automated.md`
- [ ] T054 執行 VSIX 封裝內容檢查及斷網 editor／preview smoke test，記錄 media/core/theme/locale 結果於 `specs/065-blockly-v13-modernization/validation/offline-package.md`
- [ ] T055 執行 security-checker，驗證 dialog request ID、postMessage payload、locale URI、CSP 與錯誤日誌於 `src/webview/messageHandler.ts`、`src/webview/webviewManager.ts`、`media/js/blocklyRuntime.js`
- [ ] T056 移除所有 temporary API allowlist，重跑禁止 API 掃描並將最終 allowlist 限定為契約核准的 preview XML parser 與 legacy mutation hooks 於 `src/test/suite/blocklyV13Compatibility.contract.test.ts`
- [ ] T057 依 `specs/065-blockly-v13-modernization/quickstart.md` 完成 SC-001～SC-010 最終核對並記錄於 `specs/065-blockly-v13-modernization/validation/final.md`

---

## 相依關係與執行順序

### Phase 相依

- **Phase 1**：無前置條件；必須先取得 v12 基準。
- **Phase 2**：依賴 Phase 1 的版本更新；阻擋所有使用者故事。
- **US1（Phase 3）**：依賴 Phase 2；是相容性 MVP。
- **US2（Phase 4）**：依賴 US1 完成，避免同時修改 `media/js/blocklyEdit.js` 與 `media/blockly/blocks/functions.js`；US2 階段內的獨立測試與 CSS 工作仍可平行。
- **US3（Phase 5）**：依賴 US2 的 Thrasos/focus CSS 與 Phase 2 runtime。
- **US4（Phase 6）**：依賴 Phase 2 runtime 與 US1 JSON round-trip；可與 US3 大部分平行。
- **Phase 7**：依賴 US1～US4 全部完成。

### 使用者故事圖

```text
Setup → Foundation → US1 (MVP) ─┬→ US2 → US3 ─┐
                                └→ US4 ───────┴→ Polish
```

## 平行執行範例

### 共同基礎

```text
T008 WebView runtime tests
T010 media/js workspace migration
T011 custom blocks workspace migration
T012 generator workspace migration
```

### 使用者故事 1

```text
T015 workspace round-trip tests
T016 generator golden tests
T017 dynamic state tests
T018 dialog contract tests
```

### 使用者故事 3／4

```text
US3 T036-T038 accessibility contract tests
US4 T044-T045 locale/rebuild contract tests
```

## 實作策略

### MVP 優先

1. 完成 Phase 1，保存 v12 可比較基準。
2. 完成 Phase 2，讓 v13 editor／preview 使用明確 workspace runtime。
3. 完成 US1，證明舊專案、變數、dynamic blocks 與三種 generator 相容。
4. 在 US1 通過後才將分支視為可安全繼續 UI 與無障礙工作的升級基線。

### 增量交付

1. **相容性增量**：US1 fixtures 與程式輸出全綠。
2. **視覺增量**：US2 品牌化 Thrasos 與離線媒體。
3. **無障礙增量**：US3 預設導覽、AI shortcut、IME 與 VoiceOver。
4. **語系增量**：US4 十五語系安全重建。
5. **發布前增量**：Phase 7 效能、封裝、安全與完整驗收。

## 格式驗證

- 任務總數：57
- Setup：5
- Foundational：9
- US1：13
- US2：8
- US3：8
- US4：7
- Polish：7
- 所有任務均包含 checkbox、連續 ID、必要的 `[P]`／`[USx]` 標籤與明確檔案路徑。
