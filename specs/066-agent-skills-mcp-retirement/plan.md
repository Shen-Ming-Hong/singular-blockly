# 實作計畫：Agent Skills 取代 MCP

**分支**：`codex/066-agent-skills-mcp-retirement` | **日期**：2026-08-12 | **規格**：[spec.md](./spec.md)

**輸入**：`/specs/066-agent-skills-mcp-retirement/spec.md` 的功能規格

## 摘要

將 Singular Blockly 的使用者端 MCP、系統 Node.js 偵測與相關介面完整移除，改由擴充套件在每次辨識到 Singular Blockly 專案時，靜默且具交易性的方式安裝或更新專案內 Agent Skills。`.agents/skills/singular-blockly/` 是唯一正式契約，`.claude/skills/singular-blockly/SKILL.md` 僅是指向正式契約的精簡相容入口；所有由擴充套件建立或管理的 Skill 內容固定使用英文。

積木契約由目前實際載入的 Blockly 定義、各開發板工具箱及動態 flyout 積木清單產生，不再維護 MCP 專用字典。AI 或其他外部來源寫入的 `blockly/main.json` 必須先在 WebView 的一次性 Blockly workspace 中完成 load/save round-trip 驗證，通過後才更新正式視覺工作區；失敗或 10 秒逾時時隔離候選內容並由最後有效版本復原。

## 技術背景

**語言／版本**：TypeScript 5.9.3、JavaScript（WebView 與建置腳本）、Node.js 22.16.0+（僅貢獻者工具鏈）

**主要相依套件**：VS Code Extension API `^1.109.0`、Blockly 13.2.1、`@blockly/theme-modern` 13.2.0、webpack 5；移除 `@modelcontextprotocol/sdk` 與僅供 MCP 使用的 `zod`

**儲存方式**：專案內檔案；正式 Skill、相容入口、受管理 manifest、AI 可讀狀態、工作區主檔、最後有效備份與隔離歷史

**測試工具**：Mocha、Sinon、`@vscode/test-electron`、契約測試、`npm run test:coverage`、產生物新鮮度檢查、15 語系驗證

**目標平台**：VS Code 1.109+ Extension Host 與 Blockly WebView；macOS、Windows、Linux

**專案類型**：單一 VS Code extension，Extension Host 與 WebView 為分離執行環境

**效能目標**：專案啟動後 30 秒內完成 Skills 檢查／更新；候選工作區於 10 秒內完成驗證或進入保護流程；一般無更新啟動只進行固定清單的版本與雜湊比較

**限制**：一般使用者不需安裝系統 Node.js；Skills 流程無確認與一般通知；不得把候選資料載入正式 workspace 後才驗證；所有專案檔案 I/O 經 `FileService`；不得覆寫未受管理內容；狀態與診斷不得洩漏敏感資料、完整工作區、使用者檔案內容或專案外絕對路徑

**規模／範圍**：一個正式 Skill、一個 Claude 相容入口、三種現有程式產生流程、15 語系既有 UI、目前全部可建立積木類型，以及最近 5 份隔離歷史

## 憲法檢查

*閘門：Phase 0 研究前必須通過，Phase 1 設計後再次檢查。*

| 原則 | 研究前 | 設計後 | 符合方式 |
|------|--------|--------|----------|
| I. 簡潔與可維護性 | 通過 | 通過 | 以三個單一職責服務處理 Skills、積木契約與候選工作區；移除 MCP 雙軌與手寫字典。 |
| II. 模組化與可擴充性 | 通過 | 通過 | Extension Host 管理檔案與交易，WebView 只提供真實 Blockly runtime 驗證，雙方使用明確訊息契約。 |
| III. 避免過度開發 | 通過 | 通過 | 不新增 UI、雲端服務、通用 AI 介面、轉換器或過渡 server；只支援規格明列的兩類代理入口。 |
| IV. 彈性與適應性 | 通過 | 通過 | manifest 以版本與雜湊控制受管理檔案，積木契約由 runtime 來源重建，未知使用者檔案一律保留。 |
| V. 研究驅動開發 | 通過 | 通過 | 研究 VS Code、Claude Code 與 Blockly 官方文件；MCP 未被視為必要研究工具。 |
| VI. 結構化日誌 | 通過 | 通過 | 失敗經既有 `log()` 記錄穩定錯誤碼與相對路徑，不加入 `console.log`。 |
| VII. 完整測試覆蓋 | 通過 | 通過 | 規劃單元、契約、整合、封裝與回歸測試，含失敗注入、逾時、競態、隔離輪替及三種程式產生流程。 |
| VIII. 純函式與模組化架構 | 通過 | 通過 | manifest 差異、契約集合、隔離保留及狀態清理採純函式；檔案系統與時鐘可注入。 |
| IX. 繁體中文文件標準 | 通過 | 通過 | SDD 與專案文件使用繁體中文；產品生成的 Skill 內容依明確產品需求固定使用英文。 |
| X. 專業發布管理 | 通過 | 通過 | 實作階段同步最低 VS Code 版本、套件相依與雙語 CHANGELOG；本規劃階段不改套件版本。 |
| XI. Agent Skills 架構 | 通過 | 通過 | 保留貢獻者 SDD Skills，另建立給終端使用者 AI 的專案 Skill；採漸進式揭露、相對引用與安全審查。 |

設計後沒有需要豁免的憲法違規。

## 專案結構

### 本功能文件

```text
specs/066-agent-skills-mcp-retirement/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── block-contract.md
│   ├── project-skill-layout.md
│   └── workspace-validation.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 預計產品程式與資產

```text
src/
├── extension.ts
├── services/
│   ├── blockContractService.ts
│   ├── fileService.ts
│   ├── projectSkillService.ts
│   ├── shadowSuggestionService.ts
│   └── workspaceCandidateService.ts
├── types/
│   ├── projectSkill.ts
│   └── workspaceValidation.ts
├── webview/
│   ├── messageHandler.ts
│   └── webviewManager.ts
└── test/
    ├── services/
    │   ├── blockContractService.test.ts
    │   ├── projectSkillService.test.ts
    │   └── workspaceCandidateService.test.ts
    └── suite/
        ├── projectSkillContract.test.ts
        └── workspaceValidation.contract.test.ts

media/
└── js/
    └── blocklyEdit.js

resources/
└── project-skills/
    └── singular-blockly/
        ├── canonical/
        │   ├── SKILL.md
        │   ├── project-notes.md
		│   └── references/
		│       ├── block-contract.json
		│       ├── block-contract/*.json
        │       ├── workspace-format.md
        │       └── workspace.schema.json
        ├── compatibility/
        │   └── claude-SKILL.md
        └── managed-manifest.json

scripts/
└── generate-skill-contract.js
```

同一版本會刪除 `src/mcp/`、MCP／Node 偵測專用服務與型別、相關測試、webpack MCP bundle、命令、設定、在地化字串、依賴及文件。產生後的英文積木契約以 `block-contract.json` 小型索引與 `block-contract/*.json` category 分片保留在 `resources/project-skills/singular-blockly/canonical/references/`，封裝時複製到 `dist/project-skills/`；`ShadowSuggestionService` 透過 `BlockContractService` 組合相同來源，避免再次產生平行字典。

**結構決策**：維持現有單一 extension 專案。`ProjectSkillService` 管理固定目標檔案的安裝交易，`BlockContractService` 讀取產生契約，activation 層建立的 `WorkspaceCandidateService` 依 workspace folder 管理 watcher、最後有效版本、隔離及恢復；`WebViewManager` 只在面板存在時向該服務附加真實 Blockly validator channel。這些服務透過既有 `FileService` 與可注入介面測試，不新增另一個套件或執行程序。

## 設計決策

### 1. 專案辨識與靜默安裝時機

- 擴充套件於既有 `onStartupFinished` 啟動流程中檢查每個 workspace folder；已有 `blockly/` 的資料夾視為既有 Singular Blockly 專案。對尚未建立 `blockly/` 的新 workspace，首次執行 `singular-blockly.openBlocklyEdit` 即成為目前 WebView 實際使用之第一個 workspace folder 的專案建立訊號，並在開啟流程開始時呼叫同一個冪等檢查。執行中新增的 workspace folder 也使用相同規則檢查。
- 檢查不依賴 Blockly 面板已完成載入；既有專案在 extension activation、新專案在首次開啟編輯器時都能取得 Skills，重複觸發只比較 manifest 與雜湊。
- 成功、無更新與一般失敗都不顯示通知或確認；失敗以結構化日誌及可安全寫入時的英文 AI 狀態表示，不能阻擋編輯器啟動。若現有 `ready` 狀態的 Skill 版本與 manifest 雜湊都未改變，不重寫 status 或任何專案檔案，避免每次啟動造成版本控制噪音。

### 2. 受管理檔案交易

- 封裝 manifest 列出每個固定 payload 的來源、專案相對目標、內容 SHA-256、擁有權政策及 Skill 版本。安裝至 `.agents/skills/singular-blockly/managed-manifest.json` 的 manifest 是整次交易的最後提交記錄，不得列入自己的 `managedFiles` 或計算自己的雜湊；其餘只有新 manifest 明列、且舊 manifest 對同一 allowlisted target 提供既有雜湊的檔案可覆寫。舊 manifest 額外宣告的路徑一律忽略並保留，不能藉此擴張寫入範圍。
- `.agents/skills/singular-blockly/project-notes.md` 只在不存在時以英文範本建立，之後永久視為使用者擁有；不列入可覆寫雜湊。
- 未知檔案、使用者自訂 Skill 與未受管理內容逐位元保留。同名目錄存在但沒有可信 manifest 時視為衝突，不接管內容。
- 已知受管理檔案若實際雜湊不同，先把原始位元組依原專案相對路徑保存至 `blockly/.singular-blockly/skill-backups/<UTC timestamp>/`；任一備份失敗即取消更新。
- 更新先在同一 workspace folder 內建立暫存檔，逐檔以原子 rename 取代；每個原始檔都有 rollback 資料，新建的 project notes 也只有在整體成功後才保留。所有正式檔與 Claude 入口完成後才以最後一步替換不自我雜湊的 installed manifest 並寫入 `ready` 狀態。任一步驟失敗便逆序還原或移除本次新建檔，不把新舊混合組合標示為成功；若程序在 manifest 提交前中斷，下次冪等檢查依舊／新官方雜湊完成或復原交易。
- `FileService` 擴充固定根目錄的 containment 檢查、原子寫入與 rename 能力；拒絕 `..`、絕對目標、符號連結逃逸及 manifest 外路徑。

### 3. 英文 Skill 與漸進式揭露

- 正式 `SKILL.md` frontmatter 只使用 `name` 與 `description`，名稱為 `singular-blockly`，目錄名稱與之相同；內文以命令式英文說明何時讀取工作區、如何修改及何時停止。
- `SKILL.md` 保留短小，把完整 workspace 結構、板型限制與積木清單分別放入英文 references；所有 reference 都從 `SKILL.md` 直接以相對路徑連結。
- `.claude/skills/singular-blockly/SKILL.md` 只包含相容 frontmatter、正式契約相對路徑及「先讀正式契約」指示，不複製積木規則。VS Code 1.109 透過 `.claude/skills` 找到入口；支援 `.agents/skills` 的新版代理可直接讀正式來源。相容性測試要求兩條入口解析到同一正式契約。
- Skill 不攜帶或執行 Node.js 腳本，不指示 AI 啟動 server，也不要求使用者管理設定。

### 4. Runtime 衍生積木契約

- `generate-skill-contract.js` 在貢獻者建置環境載入英文 Blockly 訊息、目前專案 block definitions、所有開發板工具箱與已知動態 flyout 入口。
- 可建立積木集合為「所有板型已解析工具箱出現的類型」加上「由變數／程序等動態 flyout 建立的公開類型」。動態來源只列類型識別，不手寫欄位或連線 metadata；內部 mutator、已移除或不可從 UI 建立的類型排除。
- 對每個類型與每個支援板型建立 headless block，切換至該板型的實際 runtime context 後序列化，擷取工具箱 category membership、板型可用性，以及各板型 variant 的輸出／前後連線、inputs、fields、預設 extra state 與最小可載入範例。產生器再於相同板型 context 的 disposable workspace 對每個範例執行 load/save round-trip。
- 產生結果為穩定排序的英文 `block-contract.json` 索引、category 分片與 `workspace.schema.json`。每個積木只存在於一個分片；多 category 積木放入 `shared`。`--check` 模式在 CI 比對全部 tracked 產物並拒絕過時分片。
- Agent 先用索引的 `shards[].blockTypes` 定位分片，只讀本次需要的 metadata；`ShadowSuggestionService` 與 TXT metadata 契約測試則透過 `BlockContractService` 組合相同契約。移除舊 `src/mcp/block-dictionary.json` 與 `generate:dictionary`。

### 5. 候選工作區驗證與復原

- activation 層的 `WorkspaceCandidateService` 對每個已辨識專案監看 `blockly/main.json` 的建立、變更與刪除，不依賴面板生命週期；保留既有 500ms debounce、空狀態保護及內部寫入抑制。每次外部事件分配單調遞增 generation，較舊結果不得覆寫較新候選。WebView 面板存在時由 `WebViewManager` 附加 validator channel；面板關閉、disposed 或通道中斷時，要求在 10 秒 deadline 內失敗並走相同隔離／恢復流程。
- 啟動時已存在的 `main.json` 是使用者既有專案，不視為新的外部候選；首次開啟沿用正式編輯器既有的遷移與 Blockly runtime 載入流程，不得顯示候選隔離警告或要求額外操作。只有 activation 後由 watcher 實際觀察到的建立、變更或刪除事件才進入候選驗證。正式編輯器每次成功儲存則以同一 save document 更新記憶體快照及 `.bak`。
- JSON 解析成功後，Extension Host 以 `requestId` 將完整候選文件送至 WebView。WebView 在不影響正式畫面的 disposable `Blockly.Workspace` 中，使用目前已註冊的相同 block definitions 執行 `Blockly.serialization.workspaces.load`，再執行 save round-trip 與文件層板型／控制資料檢查。
- 只有成功回應且 `requestId` 仍為最新 generation 時，才把正規化結果送進正式 workspace。Extension Host 先保留提交前的記憶體快照與 `.bak` bytes，收到正式 workspace 載入成功 acknowledgement 後，才以暫存檔與 rename 提交 normalized `main.json` 及 `.bak`。任一磁碟提交或正式載入失敗都以保留 bytes／快照還原畫面、主檔與備份，不能先覆寫唯一恢復來源。
- 每個要求建立 10 秒計時器。解析錯誤、runtime 驗證錯誤、WebView 關閉、刪除、通道中斷或逾時都進入相同保護流程：先保存原始候選為 `blockly/main.invalid.json` 與一份 UTC 檔名歷史，再以既有 `blockly/main.json.bak` 恢復主檔。若首次事件尚無磁碟備份，使用目前正式 workspace 最近一次成功序列化的記憶體快照；兩者都不存在時拒絕清空且只記錄失敗。
- 歷史命名固定為 `blockly/main.invalid.<YYYYMMDDTHHmmssSSSZ>.json`；保留最新 5 份時間歷史，新增後只刪除排序最舊的同格式檔案。固定檔名、正規表示式與目錄 containment 共同避免誤刪其他檔案。
- 隔離與恢復寫入都標示為內部操作；監看器忽略對應事件，避免循環。診斷只含錯誤碼、積木 type／欄位等可定位摘要與專案相對路徑，不含完整候選內容。每次無效候選另顯示在地化警告，明確指出候選未套用、`blockly/main.invalid.json` 相對位置，並提供開啟 Singular Blockly Output 詳情的動作；Skills 正常或失敗安裝仍維持零通知。

### 6. 完整移除與版本基準

- 移除 MCP provider/server/tools/resources、MCP dictionary、NodeDetection、MCP diagnostics、命令、設定、啟動警告、webpack bundle、SDK/Zod 相依與全部在地化鍵值。
- 更新 `package.json` 的 `engines.vscode` 與 `@types/vscode` 至 `^1.109.0`；保留 Node engine、npm scripts 與其他貢獻者工具鏈。
- README、AGENTS.md、`docs/specifications/` 中的現行架構／基礎／相依／功能索引、詞彙與演進文件，以及雙語 CHANGELOG 改為 Skills 流程；刪除或以 Agent Skills 文件取代現行 MCP integration 文件，不再提供使用者端 MCP 或 Node 安裝說明。既有已完成 feature specs 保留為歷史紀錄，不回寫其當時狀態。

## 複雜度追蹤

無需憲法豁免；本功能刪除既有平行整合並沿用現有 extension、WebView、FileService 與檔案監看邊界。
