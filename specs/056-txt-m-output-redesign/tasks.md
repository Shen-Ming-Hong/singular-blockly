# 任務：TXT M 系列輸出重設計

**輸入**：來自 `/specs/056-txt-m-output-redesign/` 的設計文件
**前置文件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`

**測試**：本功能的 `plan.md`、`quickstart.md` 與 contracts 明確要求自動化驗證，因此各 user story 皆包含測試任務。故事內測試任務應先撰寫並確認失敗，再進行對應實作。

**組織方式**：任務依 user story 分組，讓 shared foundation 完成後，每個故事都能獨立實作與驗證。

## 格式：`[ID] [P?] [Story] 任務描述`

- **[P]**：可平行處理，因為任務修改不同檔案，且不依賴同階段尚未完成的任務。
- **[Story]**：對應 user story 的追蹤標籤；只有故事階段任務包含 `[US1]`、`[US2]`、`[US3]` 或 `[US4]`。
- 每個任務都必須包含明確的 repository-relative 檔案路徑。

## Phase 1：Setup（共用基礎建設）

**目的**：為 TXT M 輸出重設計準備聚焦 helper、測試與 fixture scaffolding。

- [X] T001 [P] 在 `media/js/txtMOutputValidation.js` 建立 TXT M 輸出驗證 helper scaffold，並採用 UMD/CommonJS export pattern
- [X] T002 [P] 在 `src/test/suite/txtMOutputValidation.test.ts` 建立聚焦的驗證測試 suite scaffold
- [X] T003 [P] 在 `src/test/helpers/txtWorkspaceBuilder.ts` 建立可重用的 TXT workspace fixture builder scaffold

---

## Phase 2：Foundational（阻擋性前置工作）

**目的**：建立所有 user story 都會依賴的 shared metadata、mapping、helper 載入與 fixture utilities。

**⚠️ 重要**：此階段完成前，不應開始任何 user story 實作。

- [X] T004 在 `src/test/suite/txtMOutputValidation.test.ts` 新增 helper module smoke tests，驗證 exported namespace、component keys 與 shared-pin mapping
- [X] T005 在 `media/js/txtMOutputValidation.js` 定義 `M_COMPONENTS`、`MOTOR`/`LAMP` metadata、M1-M4 port constants 與 O-to-M shared-pin mapping
- [X] T006 在 `media/js/txtMOutputValidation.js` 實作 port normalization 與 legacy component fallback helpers
- [X] T007 [P] 在 `src/test/helpers/txtWorkspaceBuilder.ts` 實作最小 TXT workspace JSON builders，支援 M blocks、O blocks、setup blocks 與 process blocks
- [X] T008 在 `src/webview/webviewManager.ts` 註冊 `txtMOutputValidation.js` 作為 WebView resource URI
- [X] T009 在 `media/html/blocklyEdit.html` 載入 `txtMOutputValidation.js`，且順序必須早於 `blocklyEdit.js`

**檢查點**：helper metadata、helper loading 與 test fixtures 已準備完成；可以開始 user story 實作。

---

## Phase 3：User Story 1 - 用同一個 M 指令控制不同元件（Priority: P1）🎯 MVP

**目標**：使用者能用同一個 M 輸出積木選擇 M 埠與元件類型；馬達顯示方向與輸出值，燈泡只顯示亮度，停止積木維持通用語意。

**獨立測試**：在空白 TXT workspace 中，用同一個 block type 建立一個 M 馬達輸出與一個 M 燈泡輸出，並在不使用任何燈泡專用 block type 的前提下驗證 UI 欄位與產生的 TXT Python 行為。

### User Story 1 測試 ⚠️

> **NOTE**：先撰寫這些測試，並確認它們在實作前失敗。

- [X] T010 [P] [US1] 在 `src/test/suite/txtMOutputBlockUi.test.ts` 新增 contract tests，驗證 MOTOR/LAMP component fallback、方向欄位顯示預期與序列化後的 `COMPONENT` field 值
- [X] T011 [P] [US1] 在 `src/test/suite/txt-multi-flow-generation.test.ts` 新增 TXT generator regression tests，涵蓋 `txt_motor_speed` MOTOR、LAMP、缺少 `COMPONENT` 的 legacy fallback，以及 `txt_stop_all` 持續同時停止所有 M/O 輸出的行為
- [X] T012 [P] [US1] 在 `src/test/fixtures/txt-m-output-legacy.json` 與 `src/test/fixtures/txt-m-output-motor-lamp.json` 新增 legacy 與混合 MOTOR/LAMP workspace fixtures

### User Story 1 實作

- [X] T013 [US1] 在 `media/blockly/blocks/txt.js` 為 `txt_motor_speed` 新增 `COMPONENT` dropdown，預設值為 `MOTOR`
- [X] T014 [US1] 在 `media/blockly/blocks/txt.js` 實作 dynamic shape update，讓 MOTOR 顯示方向／輸出值欄位，LAMP 只顯示亮度欄位
- [X] T015 [US1] 在 `media/blockly/blocks/txt.js` 確保切換 `COMPONENT` shape 時保留 M 埠與數值
- [X] T016 [US1] 在 `media/blockly/blocks/txt.js` 套用 legacy load-time defaulting，讓舊版缺少 `COMPONENT` 的 `txt_motor_speed` blocks 以 MOTOR 行為載入
- [X] T017 [US1] 在 `media/blockly/generators/txt/txt.js` 更新 `txt_motor_speed` MOTOR code generation，保留既有 signed speed 與方向行為
- [X] T018 [US1] 在 `media/blockly/generators/txt/txt.js` 實作 `txt_motor_speed` LAMP code generation，輸出非方向性的 0..512 M output level
- [X] T019 [US1] 在 `media/blockly/generators/txt/txt.js` 新增 generator-side legacy fallback，處理缺失、空字串或未知的 `COMPONENT` 值
- [X] T020 [US1] 在 `media/blockly/blocks/txt.js` 將 `txt_motor_stop` block 文字更新為固定通用文案「停止輸出」，且不得新增 `COMPONENT` field
- [X] T021 [US1] 在 `media/blockly/generators/txt/txt.js` 確認 `txt_motor_stop` 永遠只將選取的 M 埠歸零且不推論 component，並確認 `txt_stop_all` 持續同時停止所有 M 與 O 輸出
- [X] T022 [US1] 在 `src/test/suite/txtWorkspaceFixtures.test.ts` 更新 fixture loading assertions，覆蓋 legacy M blocks 與混合 MOTOR/LAMP blocks

**檢查點**：US1 已可作為 MVP 獨立運作與驗證。

---

## Phase 4：User Story 2 - 在有衝突風險時得到明確提醒（Priority: P1）

**目標**：workspace 只在真實衝突時顯示警告並阻擋上傳／執行流程與匯出／程式碼輸出入口：同一 M 埠使用不同元件，或 M 埠與對應 O 輸出共用硬體腳位。

**獨立測試**：建立 M1 MOTOR + M1 LAMP 或 M1 + O1/O2 的 workspace，確認會 warning + blocking；建立 M1 + O3 的 workspace，確認不會 warning 也不會 blocking。

### User Story 2 測試 ⚠️

> **NOTE**：先撰寫這些測試，並確認它們在實作前失敗。

- [X] T023 [P] [US2] 在 `src/test/suite/txtMOutputValidation.test.ts` 新增 validation tests，覆蓋同一 M 埠不同 component 與同一 M 埠相同 component
- [X] T024 [P] [US2] 在 `src/test/suite/txtMOutputSharedPins.test.ts` 新增 M/O shared-pin positive tests，覆蓋 M1/O1、M1/O2、M2/O3、M4/O8
- [X] T025 [P] [US2] 在 `src/test/suite/txtMOutputSharedPins.test.ts` 新增 non-shared negative tests，覆蓋 M1/O3、M2/O1、M3/O7，以及 M-only/O-only workspaces
- [X] T026 [P] [US2] 在 `src/test/suite/txtMOutputPreflight.test.ts` 新增 preflight blocking contract tests，驗證上傳／執行流程與匯出／程式碼輸出入口的 validation summaries

### User Story 2 實作

- [X] T027 [US2] 在 `media/js/txtMOutputValidation.js` 實作 workspace extraction，收集 `txt_motor_speed`、`txt_motor_stop` 與 `txt_output` usage records
- [X] T028 [US2] 在 `media/js/txtMOutputValidation.js` 實作同一 M 埠不同 component 的 conflict detection
- [X] T029 [US2] 在 `media/js/txtMOutputValidation.js` 依 M1↔O1/O2、M2↔O3/O4、M3↔O5/O6、M4↔O7/O8 實作 true shared-pin M/O conflict detection
- [X] T030 [US2] 在 `media/js/txtMOutputValidation.js` 實作 validation result formatting，包含 `conflicts`、`canUpload`、`canExport`、block ids、message keys、相關 O ports，且 warning message 資料至少包含衝突 M 埠、涉及 components 或相關 O ports
- [X] T031 [US2] 在 `media/js/blocklyEdit.js` 於 workspace changes 時將 M output conflict warnings 套用到相關 Blockly blocks
- [X] T032 [US2] 在 `media/js/blocklyEdit.js` 合併 M output conflict warnings、orphan warnings 與 TXT virtual control warnings，確保任一訊息都不會被覆蓋
- [X] T033 [US2] 在 `media/js/blocklyEdit.js` 當 validation 回報 blocking conflicts 時，於送出 extension host 訊息前阻擋 TXT 上傳／執行
- [X] T034 [US2] 在 `media/js/blocklyEdit.js` 當 validation 回報 blocking conflicts 時，阻擋 TXT 匯出／程式碼輸出 actions
- [X] T035 [US2] 在 `src/webview/messageHandler.ts` 將 validation summary 納入 TXT upload messages，並拒絕標示 blocking conflicts 的訊息
- [X] T036 [US2] 在 `media/blockly/generators/txt/index.js` 保留 TXT generator multi-flow ordering，同時記錄 M 與 O usage metadata 供 generated-code diagnostics 使用

**檢查點**：US2 的 warnings 與上傳／執行流程、匯出／程式碼輸出 blocking 可獨立運作，且不會對不相關 O 埠產生 false positives。

---

## Phase 5：User Story 3 - 保持學生容易理解的命名與工具箱（Priority: P2）

**目標**：toolbox 顯示一個 M 設定積木與一個 M 停止積木，維持一致的「輸出 [M選單] [元件名稱] ...」與「停止輸出 [M]」作者語言；不出現燈泡專用重複積木。

**獨立測試**：開啟 TXT toolbox，確認 M 區段只有一個 component-aware setting block 與一個 generic stop-output block，且 O blocks 維持不變。

### User Story 3 測試 ⚠️

> **NOTE**：先撰寫這些測試，並確認它們在實作前失敗。

- [X] T037 [P] [US3] 在 `src/test/suite/txtToolbox.test.ts` 新增 toolbox uniqueness tests，拒絕 lamp-specific M block types
- [X] T038 [P] [US3] 在 `src/test/suite/txtMOutputI18n.test.ts` 新增 i18n key presence tests，覆蓋 component names、brightness、stop output 與 conflict warnings

### User Story 3 實作

- [X] T039 [US3] 在 `media/toolbox/categories/txt.json` 更新 TXT toolbox defaults，讓 `txt_motor_speed` 暴露 `COMPONENT` field，且不得出現 lamp-specific block
- [X] T040 [US3] 在 `media/blockly/blocks/txt.js` 更新 M setting 與 stop block 的 message key usage，涵蓋「輸出」、component names、brightness 與「停止輸出」
- [X] T041 [P] [US3] 在 `media/locales/en/messages.js` 與 `media/locales/zh-hant/messages.js` 新增英文與繁體中文 locale keys
- [X] T042 [P] [US3] 在 `media/locales/ja/messages.js` 與 `media/locales/ko/messages.js` 新增日文與韓文 locale keys
- [X] T043 [P] [US3] 在 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js` 與 `media/locales/tr/messages.js` 新增歐洲語系 locale keys
- [X] T044 [US3] 在 `media/toolbox/categories/txt.json` 與 `media/blockly/generators/txt/txt.js` 確認 O series block names、toolbox entries 與 generator behavior 維持不變
- [X] T045 [US3] 在 `src/mcp/block-dictionary.json` 重新產生受 TXT toolbox/message metadata 影響的 MCP block dictionary entries
- [X] T046 [US3] 在 `src/test/suite/txtWorkspaceFixtures.test.ts` 更新 fixture assertions，確認不存在獨立的 lamp setting 或 lamp stop block type

**檢查點**：US3 的 toolbox 與 localization 行為可獨立驗證，且不改變 O series 作者模型。

---

## Phase 6：User Story 4 - 未來新增 M 元件時不必重學基本句型（Priority: P3）

**目標**：component-aware M 模型具備足夠的 metadata-driven 設計，讓未來 M 元件可沿用相同句型，同時只顯示真正相關的欄位。

**獨立測試**：檢查 metadata 與測試，確認未來 component 可透過能力定義加入，不需要建立新的 public block type 或重寫 M/O conflict model。

### User Story 4 測試 ⚠️

> **NOTE**：先撰寫這些測試，並確認它們在實作前失敗。

- [X] T047 [P] [US4] 在 `src/test/suite/txtMOutputMetadata.test.ts` 新增 component metadata extensibility tests，覆蓋需要方向與不需要方向的未來 components
- [X] T048 [P] [US4] 在 `src/test/suite/txtMOutputValidation.test.ts` 新增 regression tests，驗證相同 M/O conflict rules 適用於任何 metadata-defined M component

### User Story 4 實作

- [X] T049 [US4] 在 `media/blockly/blocks/txt.js` 將 `txt_motor_speed` shape updates 重構為消費 `M_COMPONENTS` capability metadata，而不是 hard-coded LAMP-only checks
- [X] T050 [US4] 在 `media/blockly/generators/txt/txt.js` 將 `txt_motor_speed` generator branches 重構為消費 component `generatorMode` metadata，同時保留 MOTOR 與 LAMP outputs
- [X] T051 [US4] 在 `media/js/txtMOutputValidation.js` 記錄未來 M components 的 metadata extension points
- [X] T052 [US4] 在 `specs/056-txt-m-output-redesign/quickstart.md` 補充 future-component verification notes 到 manual validation matrix

**檢查點**：US4 extensibility 已文件化並有測試覆蓋，且不新增尚未支援的公開 component options。

---

## Phase 7：Polish & Cross-Cutting Concerns（收尾與跨故事驗證）

**目的**：端到端驗證功能、更新 generated artifacts，並清理跨故事 regression。

- [X] T053 [P] 執行 focused TXT M output tests，並將結果記錄於 `specs/056-txt-m-output-redesign/quickstart.md`
- [X] T054 執行 `npm run validate:i18n`，並修正 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js` 與 `media/locales/zh-hant/messages.js` 中的不一致
- [X] T055 執行 `npm run generate:dictionary`，並驗證 `src/mcp/block-dictionary.json` 中生成的 TXT metadata
- [X] T056 執行 `npm run compile`，並修正 `src/webview/webviewManager.ts` 與 `src/webview/messageHandler.ts` 中的 TypeScript/Webpack 問題
- [X] T057 執行 `npm run lint`，並修正 `src/webview/webviewManager.ts`、`src/webview/messageHandler.ts` 與 `src/test/suite/txtMOutputValidation.test.ts` 中的 lint 問題
- [X] T058 執行 `npm test`，並修正 `src/test/suite/txt-multi-flow-generation.test.ts`、`src/test/suite/txtWorkspaceFixtures.test.ts`、`src/test/suite/txtMOutputValidation.test.ts`、`src/test/suite/txtMOutputSharedPins.test.ts`、`src/test/suite/txtMOutputPreflight.test.ts`、`src/test/suite/txtToolbox.test.ts`、`src/test/suite/txtMOutputI18n.test.ts` 與 `src/test/suite/txtMOutputMetadata.test.ts` 中的 TXT regression failures
- [X] T059 [P] 執行 manual quickstart matrix，並更新 `specs/056-txt-m-output-redesign/quickstart.md` 中不準確的步驟
- [X] T060 [P] 對照 final behavior 檢查 contracts，且只更新 `specs/056-txt-m-output-redesign/contracts/m-series-block-ui-contract.md`、`specs/056-txt-m-output-redesign/contracts/txt-m-output-validation-contract.md` 與 `specs/056-txt-m-output-redesign/contracts/txt-generator-behavior-contract.md` 中已漂移的文字

---

## 相依性與執行順序

### Phase Dependencies

- **Setup（Phase 1）**：沒有前置依賴，可立即開始。
- **Foundational（Phase 2）**：依賴 Phase 1；會阻擋所有 user stories。
- **User Story 1（Phase 3, P1）**：依賴 Phase 2；建議作為 MVP。
- **User Story 2（Phase 4, P1）**：依賴 Phase 2；可在 foundation 完成後與 US1 平行推進，但最終上傳／執行流程與匯出／程式碼輸出入口行為應搭配 US1 block fields 重新驗證。
- **User Story 3（Phase 5, P2）**：依賴 Phase 2，並受益於 US1 的 naming/shape 決策。
- **User Story 4（Phase 6, P3）**：依賴 US1 與 US2，因為它會一般化 component metadata 與 conflict rules。
- **Polish（Phase 7）**：依賴所有欲交付的 user stories 完成。

### User Story Dependencies

- **US1（P1）**：MVP；foundation 完成後不依賴其他 stories。
- **US2（P1）**：安全關鍵；foundation 完成後不依賴 US3/US4，但應在 US1 block implementation 後重新檢查。
- **US3（P2）**：依賴 US1-visible field 與 label semantics；不要求 US2 完成。
- **US4（P3）**：依賴 US1 metadata-driven shape 與 US2 metadata-driven validation。

### 每個 User Story 內部順序

- 先撰寫 story tests，並確認它們在實作前失敗。
- 測試存在後，再實作 block/helper/generator behavior。
- 實作後更新 fixtures 與 assertions。
- 每個檢查點都應停下來獨立驗證該 story。

---

## 平行執行範例

### User Story 1

```text
任務：T010 在 src/test/suite/txtMOutputBlockUi.test.ts 新增 UI contract tests
任務：T011 在 src/test/suite/txt-multi-flow-generation.test.ts 新增 generator regression tests
任務：T012 在 src/test/fixtures/txt-m-output-legacy.json 與 src/test/fixtures/txt-m-output-motor-lamp.json 新增 legacy 與 MOTOR/LAMP fixtures
```

### User Story 2

```text
任務：T023 在 src/test/suite/txtMOutputValidation.test.ts 新增 same-port component conflict tests
任務：T024 在 src/test/suite/txtMOutputSharedPins.test.ts 新增 shared-pin positive tests
任務：T026 在 src/test/suite/txtMOutputPreflight.test.ts 新增上傳／執行流程與匯出／程式碼輸出 preflight tests
```

### User Story 3

```text
任務：T037 在 src/test/suite/txtToolbox.test.ts 新增 toolbox uniqueness tests
任務：T038 在 src/test/suite/txtMOutputI18n.test.ts 新增 i18n key presence tests
任務：T041 在 media/locales/en/messages.js 與 media/locales/zh-hant/messages.js 新增 en/zh-hant locale keys
任務：T042 在 media/locales/ja/messages.js 與 media/locales/ko/messages.js 新增 ja/ko locale keys
任務：T043 在 media/locales/bg/messages.js、media/locales/cs/messages.js、media/locales/de/messages.js、media/locales/es/messages.js、media/locales/fr/messages.js、media/locales/hu/messages.js、media/locales/it/messages.js、media/locales/pl/messages.js、media/locales/pt-br/messages.js、media/locales/ru/messages.js 與 media/locales/tr/messages.js 新增其餘 locale keys
```

### User Story 4

```text
任務：T047 在 src/test/suite/txtMOutputMetadata.test.ts 新增 metadata extensibility tests
任務：T048 在 src/test/suite/txtMOutputValidation.test.ts 新增 metadata-driven validation regression tests
任務：T052 在 specs/056-txt-m-output-redesign/quickstart.md 新增 future-component verification notes
```

---

## 實作策略

### MVP 優先（只做 US1）

1. 完成 Phase 1：Setup。
2. 完成 Phase 2：Foundational prerequisites。
3. 完成 Phase 3：US1 component-aware M output 與 generic stop output。
4. 停下來用 `txtMOutputBlockUi`、`txt-multi-flow-generation` 與 fixture tests 獨立驗證 US1。
5. Demo MVP：同一個 block 可控制 MOTOR 與 LAMP modes，且沒有 lamp-specific block types。

### 安全性增量（US2）

1. 新增 same-M 與 M/O shared-pin conflicts 的 validation tests。
2. 實作 warning 與 blocking behavior。
3. 驗證 M1/O1 與 M1/O2 會阻擋上傳／執行流程與匯出／程式碼輸出入口，而 M1/O3 仍允許。

### 增量交付

1. 先交付 US1 作為 MVP。
2. 立即接續或平行交付 US2 safety blocking。
3. 交付 US3 toolbox/i18n polish，降低課堂理解成本。
4. MOTOR/LAMP 與 conflict behavior 穩定後，再交付 US4 metadata extensibility。
5. Merge 前執行 Phase 7 validation。

### 平行團隊策略

1. 一位開發者處理 helper 與 validation tests。
2. 一位開發者處理 Blockly block shape 與 generator behavior。
3. 一位開發者處理 toolbox/i18n 與 dictionary regeneration。
4. 在每個 story 檢查點整合，而不是只在最後 polish 階段整合。

---

## 備註

- `[P]` tasks 修改不同檔案或獨立 locale/test files，可在 phase prerequisites 滿足後並行處理。
- WebView/browser code 必須留在 `media/`；`src/` 內的 Extension Host code 不得 import `media/` modules。
- `txtMOutputValidation.js` 應沿用既有 `media/js/txtVirtualControlsContrast.js` pattern，讓它可在 browser 載入，也可被 Node-based tests `require`。
- 保留 `txt_motor_speed` 與 `txt_motor_stop` block types 以維持相容性；不得新增 lamp-specific public block types。
- Shared-pin conflicts 必須使用精確 mapping：M1↔O1/O2、M2↔O3/O4、M3↔O5/O6、M4↔O7/O8。
- Warning 內容至少要能指出衝突 M 埠，且依衝突類型指出涉及 components 或相關 O ports。
- 使用 git workflow 時，請在每個 story 檢查點或 logical group 後 commit。