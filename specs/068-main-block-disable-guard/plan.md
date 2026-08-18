# 實作計畫：主程式積木停用保護

**分支**：`codex/069-main-block-disable-guard` | **日期**：2026-08-18 | **規格**：[spec.md](./spec.md)

**輸入**：`/specs/068-main-block-disable-guard/spec.md` 的功能規格

## 摘要

在共用 Blockly runtime 建立必要主程式類型集合，包裝 Blockly 13.2.1 既有 `blockDisable` context-menu item，僅對 `arduino_setup_loop`、`micropython_main`、`txt_setup` 回傳 `hidden`；普通積木完整沿用原始選單行為。另提供工作區掃描能力，在停用事件、正式載入、板型切換與語言重建後，以事件抑制方式清除必要主程式目前持有的全部停用原因。

編輯器把現有 `updateMainBlockDeletable()` 擴充為統一狀態保護，先修復啟用狀態，再執行目前板型的刪除、重複警告及 TXT 完整性規則。首次正式載入透過新增的 `mainBlockStateRepaired?: boolean` 回報實際修復；Host 只有在來源位元仍一致時才交易性更新 `main.json`、`.bak` 與記憶體快照。外部候選仍沿用既有 validation → live load → normalized commit 流程，但 live load 回傳的是修復後文件。

## 技術背景

**語言／版本**：TypeScript 5.9.3、WebView JavaScript、Node.js 22.16.0+（貢獻者工具鏈）

**主要相依套件**：Blockly 13.2.1、VS Code Extension API `^1.109.0`、webpack 5

**儲存方式**：專案內 `blockly/main.json`、`blockly/main.json.bak` 與 Extension Host 記憶體中的最後有效文件快照

**測試工具**：Mocha、Sinon、`@vscode/test-electron`、Node `vm` WebView 契約測試、既有 Blockly 程式碼產生測試

**目標平台**：VS Code 1.109+ Extension Host 與 Blockly WebView；macOS、Windows、Linux

**專案類型**：單一 VS Code extension；Extension Host 與 WebView 為分離執行環境，只以 `postMessage` 通訊

**效能目標**：必要主程式掃描為單次工作區線性走訪；選單 precondition 為常數時間；正常載入未修復時不增加主檔寫入

**限制**：不得新增設定、Toast 或翻譯字串；不得改變普通積木與 `txt_process` 的停用能力；不得污染 undo 或形成 Blockly 事件迴圈；檔案 I/O 經 `FileService`；來源競態與部分寫入不得覆寫或遺失資料

**規模／範圍**：七種板型、三種必要主程式類型、兩個執行環境、一個首次載入訊息欄位、現有主檔／備份交易與候選工作區流程

## 憲法檢查

*閘門：Phase 0 研究前必須通過，Phase 1 設計後再次檢查。*

| 原則 | 研究前 | 設計後 | 符合方式 |
|------|--------|--------|----------|
| I. 簡潔與可維護性 | 通過 | 通過 | 共用類型集合、選單包裝與修復函式集中在既有 runtime；編輯器只負責呼叫時機及現有結構政策。 |
| II. 模組化與可擴充性 | 通過 | 通過 | WebView 狀態修復、訊息型別與 Host 檔案交易分層，沒有跨執行環境直接呼叫。 |
| III. 避免過度開發 | 通過 | 通過 | 不新增 UI、設定、通知、翻譯、背景服務或通用政策框架。 |
| IV. 彈性與適應性 | 通過 | 通過 | 以共用集合管理三種入口，並列舉 runtime 實際原因而非硬編停用原因白名單。 |
| V. 研究驅動開發 | 通過 | 通過 | 已查核專案鎖定的 Blockly 13.2.1 context menu、停用原因、序列化及 generator 實際程式碼。 |
| VI. 結構化日誌 | 通過 | 通過 | Host 診斷沿用 `log()`；WebView 不新增包含工作區內容的日誌。 |
| VII. 完整測試覆蓋 | 通過 | 通過 | 測試先行涵蓋 runtime、事件、generator、結構回歸、初載交易、失敗注入與外部候選。 |
| VIII. 純函式與模組化架構 | 通過 | 通過 | 類型判定與回傳值為可獨立測試的政策；事件與檔案副作用留在明確邊界並可注入。 |
| IX. 繁體中文文件標準 | 通過 | 通過 | 規格、計畫、研究、契約、任務與 quickstart 全部使用繁體中文。 |
| X. 專業發布管理 | 通過 | 通過 | 實作任務要求更新雙語 CHANGELOG 並完成既有建置／測試 gate；本階段不發布。 |
| XI. Agent Skills 架構 | 通過 | 通過 | 本功能不變更產品 Agent Skill 或其產生契約，不新增外部代理依賴。 |

設計後沒有需要豁免的憲法違規。

## 專案結構

### 本功能文件

```text
specs/068-main-block-disable-guard/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── main-block-policy.md
│   └── workspace-initial-load.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 預計產品程式與測試

```text
media/js/
├── blocklyRuntime.js
└── blocklyEdit.js

src/
├── services/
│   └── workspaceCandidateService.ts
├── types/
│   └── workspaceValidation.ts
├── webview/
│   └── messageHandler.ts
└── test/
    ├── initialWorkspaceGate.test.ts
    ├── services/
    │   └── workspaceCandidateService.test.ts
    └── suite/
        ├── code-generation.test.ts
        ├── mainBlockDisableGuard.contract.test.ts
        ├── txt-multi-flow-generation.test.ts
        └── workspaceValidation.contract.test.ts

CHANGELOG.md
```

**結構決策**：維持現有單一 extension 專案。`blocklyRuntime.js` 擁有與板型無關的必要主程式政策；`blocklyEdit.js` 整合工作區生命週期與既有 deletable／TXT 驗證；`workspaceValidation.ts` 定義跨環境訊息；`WorkspaceCandidateService` 擁有來源比對、磁碟與記憶體交易；`messageHandler.ts` 只協調首次載入結果。WebView JavaScript 以 VM 契約測試，不新增瀏覽器自動化基礎設施。

## 設計決策

### 1. 共用 runtime 政策

- `blocklyRuntime.js` 暴露唯讀必要主程式類型集合，內容固定為 `arduino_setup_loop`、`micropython_main`、`txt_setup`；目前板型只影響 deletable 計算，不影響三種類型的啟用保護。
- 安裝函式從 `Blockly.ContextMenuRegistry.registry.getItem('blockDisable')` 取得 Blockly 原始 item，保留其 `id`、`weight`、scope、顯示文字及 callback。包裝後的 `preconditionFn` 對必要主程式直接回傳 `hidden`，對其他 scope 完整委派原始函式及參數。
- 包裝 item 帶有 runtime 私有識別；若已包裝則不重複 unregister/register。若 registry 曾被重設而出現新的原始 item，下一次 workspace 建立或語言重建會重新包裝。
- 若 registry 暫時沒有 `blockDisable`，安裝函式回傳 `false` 且不修改 registry、不阻斷 workspace；後續 workspace 建立可再次嘗試，測試必須鎖定此 fail-safe 行為。
- 修復函式掃描工作區全部積木，對三種必要主程式逐一複製 `getDisabledReasons()` 的目前集合，再以 `setDisabledReason(false, reason)` 清除每一項。它只在至少移除一項時回傳 `true`。
- 清除期間保存 Blockly events 原始啟用狀態，僅在原本啟用時暫時停用並於 `finally` 恢復；因此不新增 change event、undo 項目或遞迴 listener。觸發修復的原始 `BLOCK_CHANGE disabled` 事件仍繼續走既有保存流程。

### 2. 統一編輯器狀態保護

- 將 `updateMainBlockDeletable()` 重命名或擴充成統一狀態保護，固定順序為：安裝選單政策 → 修復三種必要主程式 → 依目前板型取得主程式 → 更新 deletable／重複警告 → 執行 TXT setup/process 完整性驗證。
- 呼叫點包含 `BLOCK_CREATE`、`BLOCK_DELETE`、`BLOCK_CHANGE` 且 `element === 'disabled'`、初次正式載入、候選／FileWatcher 正式載入、備份及其他既有 `loadWorkspace` 路徑、板型切換，以及語言切換後的新 workspace。
- 單一主程式仍設為不可刪除；重複主程式全部可刪除並只在數量簽章改變時沿用既有警告；工具箱 `maxInstances: 1` 不修改。TXT 的 `txt_process` 仍只參與完整性驗證與 generator，不加入受保護集合。
- 正式載入呼叫者累積本次保護函式的布林回傳值，序列化必須發生在修復之後。暫時性的候選 preflight workspace 不提前改寫停用狀態，確保真正提交的權威文件來自 live workspace。

### 3. 首次載入訊息與交易

- `WorkspaceInitialLoadResultMessage` 新增 optional `mainBlockStateRepaired?: boolean`；缺省或 `false` 表示既有相容行為，只有正式 workspace 確實移除原因時才傳 `true`。
- `messageHandler.ts` 仍以 `requestId` 配對目前 pending 初載，並把最初讀取的 exact bytes 傳給 `WorkspaceCandidateService`。成功訊息必須帶有效 `normalizedDocument`；未知或錯誤型別的修復旗標不得升級成修復提交。
- 未修復時只把 normalized document 寫到 `.bak` 並更新最後有效記憶體，不改寫 `main.json`；這保留舊板型 ID 或其他正常 runtime 正規化不會製造工作樹噪音的既有政策。
- 修復時在單一 workspace transaction queue 內重新讀取 `main.json` 並逐位元比較來源；一致才保留交易前主檔、備份及記憶體，原子寫入同一份 normalized bytes 至主檔與備份，最後更新記憶體。任何步驟失敗都以保留 bytes 完整復原並回報失敗，不把修復結果當成有效快照。
- 外部修改若發生在初讀與提交之間，exact-byte mismatch 直接放棄舊修復，既不隔離也不覆寫新資料；較新的 watcher generation 自行處理新內容。

### 4. 外部候選與其他載入路徑

- disposable workspace 的 validation 保持 load/save/load 與連線完整性判定，不把停用必要主程式當成無效候選；這是可安全正規化的相容狀態。
- 候選進入正式 live workspace 後執行統一狀態保護，再序列化 `normalizedDocument` 回覆 Host；既有 `processValidatedCandidate()` 的 generation、observation revision、deadline 與 source-byte precondition 隨後提交修復後文件至主檔、備份與記憶體。
- 若 candidate 在 live load 或提交期間被取代，沿用既有 restore live workspace 與 stale-result 丟棄路徑；不得以較早的 preflight document 覆蓋正式 runtime 修復結果。
- 備份復原及無 request ID 的現有載入入口至少在 live workspace 立即恢復啟用；由其既有儲存／watcher 流程持久化時，也必須使用修復後序列化文件與同一成對交易，不另建旁路寫檔。

### 5. 測試與交付

- runtime 契約測試直接以可控 registry、block、workspace 與 Events stub 驗證選單委派、所有原因清除、冪等註冊、事件狀態恢復與回傳值。
- editor 契約測試驗證所有規定事件／載入／切換入口皆呼叫統一保護，並以單一及重複主程式確認 deletable、警告與 TXT 驗證順序不退步。
- generator 測試以修復前 fixture 載入、執行保護、再產生程式，確認 Arduino setup/loop、CyberBrick 原內容、TXT 初始化及 process 啟動；普通、函式與 `txt_process` 的停用狀態保持不變。
- Host 測試先寫：無旗標不改主檔、旗標 true 成對提交、來源改變放棄、備份寫入失敗與交易中斷完整 rollback、外部候選提交修復後文件。
- 實作完成後更新雙語 `CHANGELOG.md`，執行精準測試、compile、lint、完整測試與 package；不新增 i18n 字串，但仍執行 i18n 驗證防止意外差異。

## 複雜度追蹤

無需憲法豁免。功能沿用既有 runtime、工作區 listener、初載握手、candidate transaction queue 與 `FileService` 原子寫入，只新增一個布林契約及集中式政策。
