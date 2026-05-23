# 實作計畫：TXT M 系列輸出重設計

**分支**：`056-redesign-txt-m-outputs` | **日期**：2026-05-23 | **規格**：`specs/056-txt-m-output-redesign/spec.md`
**輸入**：來自 `specs/056-txt-m-output-redesign/spec.md` 的功能規格

**註記**：本文件由 `/speckit.plan` 產生，範圍止於 Phase 2 規劃；實作任務清單會由後續 `/speckit.tasks` 產生。

## 摘要

本功能將 TXT 控制器的 M 系列輸出從「馬達專用」作者模型重設計為「M 埠 + 元件類型」模型。首版保留既有 `txt_motor_speed` / `txt_motor_stop` block type 以降低相容成本，新增 `MOTOR` / `LAMP` 元件選擇；馬達模式顯示方向與 0~512 輸出值，燈泡模式只顯示 0~512 亮度且不顯示方向。停止積木固定為通用「停止輸出 [M]」斷電動作。系統需在同 M 埠不同元件、或 M 埠與實際共用腳位 O 埠衝突時顯示 warning，並阻擋 TXT 上傳／執行流程與匯出／程式碼輸出入口；不相關的 M/O 積木共存不得誤判。

技術方向是沿用現有 TXT block/generator/toolbox/i18n 架構：在 `media/blockly/blocks/txt.js` 中以 dropdown field 與 validator/onchange 動態調整 block shape，在 TXT generator 中追蹤 M/O usage 並維持多流程 ordering，在 WebView TXT 上傳／執行流程、匯出／程式碼輸出入口加入 blocking preflight，並同步補齊 15 語系、測試、fixtures 與契約文件。

## 技術背景

**語言/版本**：TypeScript 5.9.3（Extension Host 與測試）、JavaScript ES2020（WebView/Blockly blocks/generators）、HTML/CSS（VS Code WebView）  
**主要相依項目**：VS Code API 1.105.0+、Blockly 12.3.1、`@vscode/test-electron`、Mocha、Sinon、現有 TXT generator / ftrobopy runtime codegen、`LocaleService` / `media/locales/*/messages.js`  
**儲存**：Blockly JSON workspace state；`COMPONENT` 採 Blockly field 序列化為語言中立鍵，舊 `txt_motor_speed` 缺值時 load/init 預設為 `MOTOR`；不新增資料庫、不建立大型 workspace migration  
**測試**：Mocha + Sinon + `@vscode/test-electron` 的現有 unit tests；WebView/Blockly browser context 以 contract-style tests、fixtures 與 quickstart manual validation 補足  
**目標平台**：VS Code 1.105+（macOS / Windows / Linux）中的 WebView Blockly 編輯器；TXT Controller Python/ftrobopy 生成碼上傳流程  
**專案型態**：VS Code 擴充功能（Extension Host + WebView browser context + Blockly generator）  
**效能目標**：M/O usage 掃描為 $O(n)$（n = workspace 中相關 TXT blocks 數）；只在 workspace 變更、code generation、上傳／執行流程與匯出／程式碼輸出 preflight 時觸發，不新增輪詢或背景工作  
**限制**：Extension Host 與 WebView 不可互相 import，只能透過 `postMessage`；本功能中的「執行」指 TXT 上傳／執行流程，「匯出」包含可被使用者誤認為安全可執行程式的程式碼輸出入口；不改 O 系列公開作者模型；不新增燈泡專用積木；不做 runtime branch 互斥分析；TXT generator ordering 必須先收集流程內硬體使用再組裝 setup/pre-creations  
**範圍**：僅限 TXT M 系列輸出作者模型、M/O shared-pin 衝突 warning/blocking、legacy default、i18n、fixtures、測試與本 spec 設計契約；不新增硬體元件、不改 TXT runtime protocol、不重做 O 系列與 stop-all 公開語意

## 憲法檢查

*關卡：Phase 0 research 前必須通過；Phase 1 design 後重新檢查。*

| 原則 | 檢查結果 | 說明 |
|---|---|---|
| I. Simplicity and Maintainability | 通過 | 沿用既有 block type 與 TXT 架構，以欄位預設與輕量 metadata 避免大型 migration 或新框架。 |
| II. Modularity and Extensibility | 通過 | M component metadata、usage scan、generator 行為與上傳／執行、匯出／程式碼輸出 preflight 分層設計；未來 M 元件可延伸同句型。 |
| III. Avoid Over-Development | 通過 | 首版只做 `MOTOR` / `LAMP`、真實 shared-pin 衝突與停止輸出；不做 branch flow analysis、不新增燈泡專用 block。 |
| IV. Flexibility and Adaptability | 通過 | 使用語言中立 component key 與 i18n 顯示文字；欄位與 generator 透過 metadata 適配元件能力。 |
| V. Research-Driven Development | 通過 | 已查閱 Blockly Dropdown、Serialization、Validators 官方文件，並比對現有 TXT generator ordering 與 repo warning/preflight pattern。 |
| VI. Structured Logging | 通過 | 本階段不新增 Extension Host logging；後續若在 `messageHandler.ts` 增加診斷，必須使用既有 `log()` service。WebView 既有 console 使用不在本計畫新增。 |
| VII. Comprehensive Test Coverage | 通過（含 WebView 例外） | 純掃描/validation/generator 邏輯需自動化測試；Blockly visual shape 與手動上傳／執行、匯出／程式碼輸出 flow 依既有 WebView 例外，以 quickstart 驗證矩陣補足。 |
| VIII. Pure Functions and Modular Architecture | 通過 | M/O mapping、usage scan 與 conflict detection 應抽成可測純函式；DOM/block warning 僅消費結果。 |
| IX. Traditional Chinese Documentation Standard | 通過 | 本 plan、research、data model、contracts、quickstart 均以繁體中文撰寫。 |
| X. Professional Release Management | 不適用 | 本階段不發布版本；若後續 release，需遵循正式 release workflow。 |
| XI. Agent Skills Architecture | 通過 | 依 SpecKit plan workflow 產生 artifacts；後續 commit/release 可使用對應 skill。 |

**設計後重新檢查**：通過。Phase 1 設計維持同一範圍：無大型 migration、無新硬體元件、無跨 context import、無 O 系列公開模型改寫；新增 contract 與 quickstart 足以支撐後續 `/speckit.tasks`。

## 專案結構

### 文件（本功能）

```text
specs/056-txt-m-output-redesign/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── m-series-block-ui-contract.md
│   ├── txt-generator-behavior-contract.md
│   └── txt-m-output-validation-contract.md
└── tasks.md              # 後續 /speckit.tasks 產生，本階段不建立
```

### 原始碼（儲存庫根目錄）

```text
media/
├── blockly/
│   ├── blocks/
│   │   └── txt.js                         # M 設定/停止積木欄位、動態 shape、warning 合併
│   └── generators/
│       └── txt/
│           ├── index.js                   # TXT workspaceToCode ordering、usage tracking、pre-scan/validation hook
│           ├── txt.js                     # txt_motor_speed / txt_motor_stop / txt_output / txt_stop_all codegen
│           └── python_common.js           # 若抽出共用 allowed-context 或 helper，需維持 WebView generator context
├── js/
│   └── blocklyEdit.js                     # TXT workspace warning、上傳／執行流程與匯出／程式碼輸出前 preflight、toast/blocking UI
├── locales/
│   └── */messages.js                      # 15 語系 M component、亮度、停止輸出、conflict warning 文案
└── toolbox/
    └── categories/
        └── txt.json                       # Toolbox 預設欄位與可見積木清單（不新增燈泡專用積木）

src/
├── webview/
│   └── messageHandler.ts                  # TXT 上傳／執行流程、匯出／程式碼輸出 blocking 若需 host-side preflight/result 回報
├── services/
│   └── txtUploader.ts                     # 不改核心上傳流程；被 preflight 擋住時不得進入 upload
└── test/
    ├── suite/
    │   ├── txt-multi-flow-generation.test.ts
    │   └── txtWorkspaceFixtures.test.ts
    └── fixtures/
        ├── txt-workspace-main.json
        └── txt-workspace-main.bak.json

scripts/
└── generate-block-dictionary.js           # 若 TXT block metadata 對 MCP dictionary 有影響，需同步更新/再生成
```

**結構決策**：採既有 VS Code Extension + WebView Blockly 結構，不新增 package 或服務層專案。Blockly block UI 與 generator 必須留在 `media/` browser context；Extension Host 只處理上傳／執行流程、匯出／程式碼輸出 preflight 結果與使用者通知，不 import `media/` 程式碼。M/O conflict detection 若需要同時被 WebView 與測試使用，優先以小型純 helper 放在 WebView 可載入的 TXT 模組附近，並以 contract/fixture 測試鎖定行為。

## 複雜度追蹤

> 本功能沒有憲法違規，因此不需要複雜度例外。

| 違規項目 | 為何需要 | 為何不採用更簡單替代方案 |
|---|---|---|
| 不適用 | 不適用 | 不適用 |

## Phase 0 研究輸出

- `research.md` 記錄：沿用既有 block type、`COMPONENT` field 序列化、dropdown validator 動態 shape、通用「停止輸出」、真實 shared-pin conflict 判定、輕量 component metadata、TXT generator ordering 風險與測試/i18n/contract 同步策略。
- 已查閱 Blockly 官方 Dropdown / Serialization / Validators 文件，確認語言中立 field key、JSON field 序列化與 validator 觸發 shape update 的可行性。
- 已解決 Technical Context 中的未知項；沒有保留 `NEEDS CLARIFICATION`。

## Phase 1 設計與契約輸出

- `data-model.md` 定義 `MSeriesComponentType`、`MOutputBlockState`、`MStopBlockState`、`MPortUsageRecord`、`SharedPinUsageRecord`、`TxtMOutputConflict`、`TxtMOutputValidationResult` 與 legacy fallback 規則。
- `contracts/m-series-block-ui-contract.md` 定義 M 設定積木、停止積木、動態 shape、序列化與 warning 合併契約。
- `contracts/txt-m-output-validation-contract.md` 定義同 M 埠不同元件與 M/O shared-pin blocking conflict 的正負例、warning 與上傳／執行、匯出／程式碼輸出阻擋契約。
- `contracts/txt-generator-behavior-contract.md` 定義 MOTOR/LAMP generator、`txt_motor_stop`、`txt_output`、`txt_stop_all` 與 legacy fallback 行為。
- `quickstart.md` 提供後續 implementation 後的自動化命令與手動驗證流程。
- Agent context 已更新為指向本 plan；官方 PowerShell 腳本因本機缺少 `pwsh` 無法執行，因此採等效 marker 更新。

## Phase 2 任務實作大綱

1. 在 `media/blockly/blocks/txt.js` 延伸 `txt_motor_speed`：新增 `COMPONENT` dropdown、MOTOR/LAMP metadata、動態隱藏方向欄位、legacy default、warning 合併。
2. 在 `txt_motor_stop` 更新固定文案為「停止輸出」，維持只選 M 埠，不新增 component 欄位。
3. 在 TXT generator 中新增 M/O usage tracking 與 conflict data collection；`txt_motor_speed` 依 `COMPONENT` 分支生成 MOTOR/LAMP 語意，`txt_motor_stop` 維持歸零。
4. 在 WebView workspace validation、TXT 上傳／執行流程與匯出／程式碼輸出 preflight 中加入 blocking conflict 檢查；真實 shared-pin 或同埠不同元件時阻擋，不相關 O 埠不得誤判。
5. 補齊 `media/toolbox/categories/txt.json`（如需預設 fields）、15 語系 `messages.js`、block dictionary metadata（如受影響）。
6. 擴充測試與 fixtures：MOTOR/LAMP codegen、legacy default、M/O 正負例、stop output 文案/行為、toolbox 不含燈泡專用 block、i18n validation。
7. 依 `quickstart.md` 執行手動驗證，特別確認上傳／執行、匯出／程式碼輸出 blocking 與未共腳位不誤判。

## 風險與驗證說明

- **主要風險：shared-pin false positive**。必須依映射表判斷 M/O 真實共腳位，禁止「workspace 同時有 M 與 O 就警告」。測試需包含 M1+O1/O2 正例與 M1+O3 負例。
- **主要風險：TXT generator ordering**。M usage 必須在多流程內容掃描後、setup/pre-creation 組裝前可用，避免漏掉流程內硬體使用。
- **主要風險：動態 block shape 與序列化順序**。`COMPONENT` 應以 field 儲存；切換 shape 時需保留 M 埠與數值，legacy 缺欄位需安全預設 MOTOR。
- **主要風險：上傳／執行流程、匯出／程式碼輸出 blocking 分層**。編輯時 warning 與真正執行或輸出前 blocking 都要存在；若只靠 warning，會違反規格安全要求。
- **主要風險：i18n 與文案一致性**。「停止輸出」是 canonical 文案，MOTOR/LAMP 與 conflict warning 必須補齊 15 語系並通過 `npm run validate:i18n`。
- **驗證標準**：`npm run compile`、`npm run lint`、`npm run validate:i18n`、相關 TXT Mocha tests、`quickstart.md` 的手動矩陣。
