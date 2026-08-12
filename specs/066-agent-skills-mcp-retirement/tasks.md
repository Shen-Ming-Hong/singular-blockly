# 任務：Agent Skills 取代 MCP

**輸入**：`specs/066-agent-skills-mcp-retirement/` 下的 spec、plan、research、data model、contracts 與 quickstart

**測試要求**：本功能明確要求資料保護、相容性、效能、封裝、英文內容與安全驗收，因此各使用者故事均先建立會失敗的自動或契約測試，再進行實作。

## Phase 1：設定與現況基準

**目的**：固定 MCP 移除範圍、升級前工作區行為與可重現測試資料。

- [ ] T001 盤點所有 MCP、使用者端 Node.js 偵測、命令、設定、診斷、bundle、相依與文件入口，記錄可逐項核對的移除基準於 `specs/066-agent-skills-mcp-retirement/validation/removal-baseline.md` [FR-018] [SC-008]
- [ ] T002 [P] 建立 Arduino、CyberBrick、TXT、動態積木與三種程式輸出的有效工作區 fixtures 於 `src/test/fixtures/agent-skills/workspaces/` [FR-014] [FR-021] [SC-004] [SC-009]
- [ ] T003 [P] 建立截斷 JSON、未知積木、非法連線、錯誤欄位、缺少 extra state、板型不符、孤立、空白及大型工作區 fixtures 於 `src/test/fixtures/agent-skills/candidates/` [FR-009] [FR-011] [FR-013] [SC-005] [SC-011]
- [ ] T004 [P] 建立新裝、舊版、使用者修改、無 manifest 衝突、唯讀及 rollback 失敗的 Skill manifest/filesystem fixtures 於 `src/test/fixtures/agent-skills/installation/` [FR-015] [FR-016] [FR-017] [SC-007]

---

## Phase 2：共同基礎（阻擋所有使用者故事）

**目的**：建立受限檔案操作、共用資料型別、runtime 衍生積木契約與單一產品內契約讀取來源。

**⚠️ 關鍵**：本階段完成前不得開始任何使用者故事實作。

### 測試

- [ ] T005 [P] 先新增相對路徑 containment、符號連結逃逸拒絕、原子寫入／rename 及失敗清理測試於 `src/test/fileService.test.ts` [FR-017] [FR-024]
- [ ] T006 [P] 先新增工具箱 category／board membership 聯集、動態 flyout、不可用積木排除、connection `enabled`／unrestricted `check` 區分、穩定排序、英文內容與 minimal-state round-trip 契約測試於 `src/test/suite/projectSkillContract.test.ts` [FR-007] [FR-023] [SC-003] [SC-013]
- [ ] T007 [P] 先新增開發模式與封裝模式讀取相同契約雜湊、缺檔及 schema 錯誤測試於 `src/test/services/blockContractService.test.ts` [FR-006] [FR-007]

### 實作

- [ ] T008 [P] 定義 packaged/installed manifest、安裝計畫、AI 狀態與清理後 issue 型別於 `src/types/projectSkill.ts` [FR-015] [FR-024]
- [ ] T009 [P] 定義候選 generation、10 秒 deadline、驗證訊息、結果與穩定錯誤碼型別於 `src/types/workspaceValidation.ts` [FR-009] [FR-011] [FR-024]
- [ ] T010 擴充可注入 `FileSystem` 與 `FileService`，加入 workspace-root containment、固定相對路徑解析、原子寫入、rename 與安全列舉於 `src/services/fileService.ts` [FR-017] [FR-024]
- [ ] T011 實作載入英文 Blockly 訊息、產品 block definitions、各板型工具箱與公開動態 flyout type 的全量契約產生器於 `scripts/generate-skill-contract.js` [FR-006] [FR-007] [SC-003]
- [ ] T012 建立穩定排序的 tracked 英文 `block-contract.json` 與 `workspace.schema.json` 產物於 `resources/project-skills/singular-blockly/canonical/references/` [FR-007] [FR-023] [SC-003] [SC-013]
- [ ] T013 加入 `generate:skill-contract` 與唯讀 `check:skill-contract` scripts，移除 `generate:dictionary` 於 `package.json` [FR-007] [FR-018]
- [ ] T014 實作 schema／雜湊驗證與開發／封裝來源解析於 `src/services/blockContractService.ts`，並將 `ShadowSuggestionService` 及既有測試改讀相同契約於 `src/services/shadowSuggestionService.ts`、`src/test/services/shadowSuggestionService.test.ts`、`src/test/suite/shadowSuggestionService.test.ts` [FR-007]
- [ ] T015 將 TXT metadata 測試改用正式積木契約並刪除 MCP dictionary 相依於 `src/test/suite/txtMOutputMetadata.test.ts` [FR-007] [FR-018]

**Checkpoint**：所有後續功能都能使用受限檔案 API、共用型別與單一 runtime 衍生積木契約，不再依賴 MCP dictionary。

---

## Phase 3：使用者故事 1－不安裝額外執行環境即可啟用 AI 專案指引（優先級：P1）🎯 MVP

**目標**：Singular Blockly 專案啟動時靜默建立正式 Skill 與 Claude 入口，不需要系統 Node.js、MCP、確認或通知；失敗不阻擋一般 Blockly。

**獨立測試**：在沒有系統 Node.js 與 MCP 設定的新專案中啟動 extension，確認 30 秒內產生完整英文 Skills 與 `ready` 狀態、通知與確認皆為零，且 Blockly 編輯／儲存／產生程式仍正常。

### 測試

- [ ] T016 [P] [US1] 先新增新專案安裝、已是最新版且不重寫 status／working tree、唯讀、來源缺檔及寫入失敗且不呼叫通知 API 的服務測試於 `src/test/services/projectSkillService.test.ts` [FR-001] [FR-002] [FR-003] [SC-001] [SC-012]
- [ ] T017 [P] [US1] 先新增既有 `blockly/`、首次開啟編輯器、執行中新增 folder、多根 workspace、無 workspace folder 與一般專案不得安裝的啟動契約測試於 `src/test/extension.test.ts`、`src/test/extension.activate.test.ts` [FR-002] [FR-021]
- [ ] T018 [P] [US1] 先新增正式 `SKILL.md` frontmatter、直接 references、Claude 相對入口、無 symlink、manifest 不自我雜湊／不能擴張舊路徑、英文限定及無 Node/MCP 指示的契約測試於 `src/test/suite/projectSkillLayout.contract.test.ts` [FR-004] [FR-005] [FR-008] [FR-015] [FR-023] [SC-002] [SC-013]
- [ ] T019 [P] [US1] 先新增 package contributions、activation 與依賴中不得出現 MCP／Node 使用者介面的回歸測試於 `src/test/suite/mcpRetirement.contract.test.ts` [FR-018] [FR-019] [FR-020] [FR-022] [SC-008]

### 實作

- [ ] T020 [P] [US1] 撰寫精簡英文正式 Skill、workspace format、project notes 初始範本與 Claude wrapper，並產生不自我雜湊的 packaged manifest 於 `resources/project-skills/singular-blockly/canonical/SKILL.md`、`resources/project-skills/singular-blockly/canonical/references/workspace-format.md`、`resources/project-skills/singular-blockly/canonical/project-notes.md`、`resources/project-skills/singular-blockly/compatibility/claude-SKILL.md`、`resources/project-skills/singular-blockly/managed-manifest.json` [FR-004] [FR-005] [FR-006] [FR-015] [FR-023]
- [ ] T021 [US1] 實作可信 manifest 驗證、新專案全量暫存、原子安裝至 `.agents/skills/singular-blockly/` 與 `.claude/skills/singular-blockly/SKILL.md`、`create-if-missing` project notes、靜默失敗與英文安全狀態於 `src/services/projectSkillService.ts` [FR-002] [FR-003] [FR-004] [FR-005] [FR-017] [FR-023] [FR-024]
- [ ] T022 [US1] 將冪等 `ProjectSkillService` 接入既有 workspace activation、`singular-blockly.openBlocklyEdit` 的新專案訊號及 workspace-folder 新增事件，且保持 Blockly 啟動非阻斷於 `src/extension.ts` [FR-001] [FR-002] [FR-003] [SC-001] [SC-012]
- [ ] T023 [US1] 將最低 VS Code 與 types 基準升至 1.109，移除 MCP SDK、Zod、MCP contributions、命令及 Node 偵測設定但保留貢獻者 Node engine 於 `package.json`、`package-lock.json` [FR-001] [FR-018] [FR-019] [FR-020] [FR-022]
- [ ] T024 [US1] 移除 MCP provider/server/tools/resources/dictionary、舊 dictionary 產生器、Node 偵測、MCP diagnostic 及其專用型別與測試於 `src/mcp/`、`scripts/generate-block-dictionary.js`、`src/services/nodeDetectionService.ts`、`src/services/diagnosticService.ts`、`src/types/nodeDetection.ts`、`src/test/mcp/`、`src/test/nodeDetectionService.test.ts`、`src/test/diagnosticService.test.ts` [FR-018] [FR-022]
- [ ] T025 [US1] 移除第二個 MCP webpack bundle 與 dictionary copy，封裝正式 project-skill assets 於 `webpack.config.js` [FR-004] [FR-018] [SC-008]
- [ ] T026 [US1] 執行 US1 服務、啟動、layout 與 MCP retirement 測試並記錄無 Node/MCP／零通知結果於 `specs/066-agent-skills-mcp-retirement/validation/us1-installation.md` [SC-001] [SC-008] [SC-012] [SC-013]

**Checkpoint**：不使用系統 Node.js 或 MCP 的專案會在啟動後自動取得完整 Skills；這是可獨立驗收的 MVP。

---

## Phase 4：使用者故事 2－AI 能理解並產生合法積木工作區（優先級：P1）

**目標**：VS Code/Codex 與 Claude Code 能讀到同一正式契約，理解既有工作區並產生可由真實 Blockly runtime load/save 的合法修改及三種程式輸出。

**獨立測試**：兩類代理各自從支援入口讀取三種板型 fixture，完成說明、新增、修改與刪除積木；所有結果通過 load/save/load 並產生既有輸出位置。

### 測試

- [ ] T027 [P] [US2] 先新增兩個代理入口解析至同一正式契約與相同 reference 雜湊的契約測試於 `src/test/suite/agentSkillDiscovery.contract.test.ts` [FR-005] [FR-008] [SC-002]
- [ ] T028 [P] [US2] 先新增三種板型文件層 schema、板型可用性、合法 field/connection/extra state 與 load/save/load 正向契約測試於 `src/test/suite/workspaceValidation.contract.test.ts` [FR-006] [FR-009] [FR-010] [SC-004]
- [ ] T029 [P] [US2] 先新增初次既有 `main.json` 必須先經 disposable gate、正常編輯器儲存與有效外部候選的記憶體快照／`main.json.bak` 更新、載入 acknowledgement、雙檔提交 rollback 及重新開啟整合測試於 `src/test/webviewManager.test.ts`、`src/test/messageHandler.test.ts` [FR-009] [FR-010] [FR-021] [SC-004] [SC-009]
- [ ] T030 [P] [US2] 先新增 Arduino、CyberBrick、TXT 有效 fixture 的 generator golden output 回歸測試於 `src/test/suite/agentSkillGeneratorCompatibility.test.ts` [FR-014] [FR-021] [SC-004] [SC-009]

### 實作

- [ ] T031 [US2] 完成正式英文 Skill 的工作區讀取、契約查詢、完整文件修改、runtime 結果與三種輸出指引於 `resources/project-skills/singular-blockly/canonical/SKILL.md`、`resources/project-skills/singular-blockly/canonical/references/workspace-format.md` [FR-006] [FR-014] [FR-023]
- [ ] T032 [US2] 使產生器記錄每個公開積木的 category／board membership、connections、inputs、fields、extra state 與可 round-trip minimal state，並重建英文契約於 `scripts/generate-skill-contract.js`、`resources/project-skills/singular-blockly/canonical/references/block-contract.json` [FR-007] [SC-003] [SC-013]
- [ ] T033 [US2] 在 WebView 實作 disposable workspace 的 load/save/load 正向驗證與 normalized document 回應於 `media/js/blocklyEdit.js` [FR-009] [FR-010]
- [ ] T034 [US2] 在 Extension Host 實作有 requestId/generation/deadline 的初次載入 gate、正常儲存快照、正式載入 acknowledgement 後的主檔／備份交易及 rollback 於 `src/webview/webviewManager.ts`、`src/webview/messageHandler.ts` [FR-009] [FR-010] [SC-011]
- [ ] T035 [US2] 維持三種既有 generator 與輸出路徑相容，修正契約測試發現的任何退化於 `media/blockly/generators/arduino/`、`media/blockly/generators/micropython/`、`media/blockly/generators/txt/` [FR-014] [FR-021]
- [ ] T036 [US2] 以 VS Code/Codex 與 Claude Code 執行代表性理解／修改驗收並記錄入口、契約雜湊、round-trip 與三種輸出於 `specs/066-agent-skills-mcp-retirement/validation/us2-agents.md` [SC-002] [SC-004]

**Checkpoint**：兩類支援代理能從等價入口使用同一份英文契約，且有效修改可安全載入、再儲存與產生程式。

---

## Phase 5：使用者故事 3－無效 AI 修改不會破壞專案（優先級：P2）

**目標**：所有語法、runtime、通道、逾時、刪除與競態失敗都隔離候選並恢復最後有效版本，不污染正式 workspace 或洩漏候選內容。

**獨立測試**：依序寫入全部無效 fixtures、觸發 10 秒逾時與快速競態，確認資料保護率 100%、固定最新隔離檔加最近 5 份歷史、診斷可定位且沒有敏感內容。

### 測試

- [ ] T037 [P] [US3] 先新增候選狀態轉換、generation supersede、10 秒 deadline、WebView channel unavailable、磁碟／記憶體最後有效來源與無來源停止測試於 `src/test/services/workspaceCandidateService.test.ts` [FR-010] [FR-011] [FR-013] [SC-005] [SC-011]
- [ ] T038 [P] [US3] 先新增最新隔離檔、UTC 歷史命名、最近 5 份輪替及只刪完整 pattern 的檔案安全測試於 `src/test/services/workspaceCandidateService.test.ts` [FR-011] [SC-006]
- [ ] T039 [P] [US3] 先新增未知 type、非法 field/connection、extra state、板型、孤立 guard 與第二次 round-trip 失敗的 WebView 契約測試於 `src/test/suite/workspaceValidation.contract.test.ts` [FR-009] [FR-011] [SC-005]
- [ ] T040 [P] [US3] 先新增截斷、空白、刪除、初次無效檔、面板未開啟／disposed、晚到成功回覆、拖曳期間新候選與 watcher loop 測試於 `src/test/webviewManager.test.ts`、`src/test/services/workspaceCandidateService.test.ts` [FR-011] [FR-013] [SC-005] [SC-011]
- [ ] T041 [P] [US3] 先新增在地化無效候選警告、顯示 Output 詳情動作，以及警告／diagnostics 不得包含 workspace、使用者內容、憑證或外部絕對路徑的安全測試於 `src/test/services/workspaceCandidateService.test.ts`、`src/test/webviewManager.test.ts` [FR-012] [FR-024] [SC-013]

### 實作

- [ ] T042 [US3] 實作 parse、空狀態 guard、generation 狀態機、10 秒 timer、可 attach/detach validator channel、隔離、最近 5 份清理與磁碟／記憶體恢復於 `src/services/workspaceCandidateService.ts` [FR-011] [FR-013] [SC-005] [SC-006] [SC-011]
- [ ] T043 [US3] 完成 WebView 的負向 runtime 驗證、stable issue code、第二次 round-trip 與 `finally` dispose 於 `media/js/blocklyEdit.js` [FR-009] [FR-011] [FR-024]
- [ ] T044 [US3] 將 activation 層建立／變更／刪除 watcher、500ms debounce 與服務生命週期接入 `src/extension.ts`、`src/services/workspaceCandidateService.ts`，並將 WebView validator attach/detach、request correlation、拖曳延後與內部寫入抑制接入 `src/webview/webviewManager.ts` [FR-010] [FR-011] [FR-013] [SC-011]
- [ ] T045 [US3] 將正式載入失敗、可清理問題摘要、在地化無效候選警告與「顯示 Output 詳情」動作接入現有訊息處理、15 語系及 `log()` 診斷於 `src/webview/messageHandler.ts`、`src/services/workspaceCandidateService.ts`、`media/locales/*/messages.js` [FR-010] [FR-012] [FR-024]
- [ ] T046 [US3] 執行全部無效、連續 6 次隔離、10 秒逾時、快速競態與 watcher loop 驗收並記錄於 `specs/066-agent-skills-mcp-retirement/validation/us3-recovery.md` [SC-005] [SC-006] [SC-011] [SC-013]

**Checkpoint**：任何無效或過時候選都不能成為正式狀態，且最新無效資料、5 份歷史與最後有效版本都有可重現保護。

---

## Phase 6：使用者故事 4－Skills 可更新且不覆蓋使用者內容（優先級：P3）

**目標**：新版 extension 自動更新所有已知受管理檔案，逐位元備份使用者修改，永久保留 project notes、自訂檔與未知內容，並在任一步驟失敗時維持整組一致。

**獨立測試**：以舊 manifest、被修改受管理檔、project notes、自訂檔與 Claude 寫入失敗 fixture 升級，確認備份逐位元相同、使用者內容零變更、rollback 完整、通知為零且英文 AI 狀態可採取行動。

### 測試

- [ ] T047 [P] [US4] 先新增舊 manifest direct replace、使用者修改 backup-then-replace、project notes create-once、自訂檔保留與未知同名衝突測試於 `src/test/services/projectSkillService.test.ts` [FR-015] [FR-016] [SC-007]
- [ ] T048 [P] [US4] 先新增 backup 失敗、canonical 成功但 Claude 失敗、manifest 最後提交、逆序 rollback 與 rollback 失敗狀態測試於 `src/test/services/projectSkillService.test.ts` [FR-003] [FR-017] [SC-007] [SC-012]
- [ ] T049 [P] [US4] 先新增 status schema、英文限定、相對 backup path、內容清理與唯讀時只寫 diagnostics 的測試於 `src/test/services/projectSkillService.test.ts` [FR-003] [FR-023] [FR-024] [SC-012] [SC-013]
- [ ] T050 [P] [US4] 先新增版本控制回復舊 Skill 後再次更新且仍遵守備份政策的整合測試於 `src/test/extension.test.ts` [FR-002] [FR-015] [FR-016]

### 實作

- [ ] T051 [US4] 實作已安裝 manifest 比對、內容雜湊分類、未知衝突與固定 target 安裝計畫於 `src/services/projectSkillService.ts` [FR-015] [FR-016]
- [ ] T052 [US4] 實作 `blockly/.singular-blockly/skill-backups/<timestamp>/` 逐位元備份、同 volume staging、原子 replace、manifest 最後提交及逆序 rollback 於 `src/services/projectSkillService.ts` [FR-015] [FR-017] [SC-007]
- [ ] T053 [US4] 實作英文 `ready/conflict/failed` AI 狀態、穩定 action code、相對路徑清理與唯讀降級日誌於 `src/services/projectSkillService.ts` [FR-003] [FR-023] [FR-024] [SC-012] [SC-013]
- [ ] T054 [US4] 執行更新、衝突、備份、rollback、唯讀與版本控制回復驗收，記錄逐位元比較及零通知結果於 `specs/066-agent-skills-mcp-retirement/validation/us4-updates.md` [SC-007] [SC-012] [SC-013]

**Checkpoint**：受管理內容可自動演進，使用者檔案與修改備份均受到保護，且沒有部分成功或一般通知。

---

## Phase 7：收尾、移除驗證與跨領域品質

**目的**：同步所有文件／語系／發布資料，完成安全、效能、封裝、相容性與使用者成功標準。

- [ ] T055 [P] 移除 15 個 `package.nls*.json` 與 `media/locales/*/messages.js` 的 MCP／Node 使用者字串並更新驗證於 `package.nls.json`、`package.nls.*.json`、`media/locales/`、`scripts/validate-i18n.js` [FR-018] [FR-022] [SC-008]
- [ ] T056 [P] 更新使用者／開發者與現行規格化文件為靜默英文 Project Skills、runtime 契約產生及無使用者 Node/MCP 流程，並以 Agent Skills 文件取代 MCP integration 文件於 `README.md`、`AGENTS.md`、`docs/specifications/00-technical-foundation/data-model.md`、`docs/specifications/00-technical-foundation/quickstart.md`、`docs/specifications/00-technical-foundation/research.md`、`docs/specifications/01-architecture/architecture.md`、`docs/specifications/05-dependencies/dependency-upgrades.md`、`docs/specifications/06-features/mcp-integration.md`、`docs/specifications/06-features/agent-skills.md`、`docs/specifications/EVOLUTION.md`、`docs/specifications/README.md`、`docs/specifications/appendix/glossary.md` [FR-018] [FR-019] [FR-022] [FR-023] [SC-008]
- [ ] T057 [P] 更新未發布版本的英文／繁中 CHANGELOG，明列 MCP 移除、最低 VS Code 1.109、透明 Skills 與資料復原行為於 `CHANGELOG.md` [FR-018] [FR-020] [FR-021]
- [ ] T058 執行完整 MCP 移除掃描（既有已完成 feature specs 僅視為歷史紀錄），並把 T001 每一項產品程式、封裝與現行文件標示已移除或合理保留於 `specs/066-agent-skills-mcp-retirement/validation/removal-final.md` [FR-018] [FR-019] [FR-022] [SC-008]
- [ ] T059 執行 security-checker，檢查 manifest 路徑、符號連結／traversal、原子交易、postMessage correlation、XSS、候選內容與日誌清理，記錄於 `specs/066-agent-skills-mcp-retirement/validation/security.md` [FR-017] [FR-024] [SC-013]
- [ ] T060 執行 `npm run check:skill-contract`、`npm run compile-tests`、`npm run lint`、`npm run validate:i18n`、`npm test`、`npm run test:integration`、`npm run test:coverage` 與 `npm run package`，確認新增 business logic 100% 覆蓋並記錄結果於 `specs/066-agent-skills-mcp-retirement/validation/automated.md` [SC-003] [SC-004] [SC-005] [SC-009]
- [ ] T061 檢查 VSIX 的 Skills 資產、無 MCP bundle／SDK、離線無系統 Node.js 啟動、30 秒安裝及 10 秒驗證 deadline，記錄於 `specs/066-agent-skills-mcp-retirement/validation/package.md` [SC-001] [SC-008] [SC-011] [SC-012]
- [ ] T062 依 `specs/066-agent-skills-mcp-retirement/quickstart.md` 執行 SC-001～SC-013 完整驗收並記錄每項證據於 `specs/066-agent-skills-mcp-retirement/validation/final.md` [SC-001] [SC-002] [SC-003] [SC-004] [SC-005] [SC-006] [SC-007] [SC-008] [SC-009] [SC-011] [SC-012] [SC-013]
- [ ] T063 以至少 10 位首次使用者完成一次不查看或操作 Skills 設定檔的 AI 工作區修改測試，記錄成功率、外部安裝協助與人工排錯需求於 `specs/066-agent-skills-mcp-retirement/validation/usability.md` [SC-010]

---

## 相依關係與執行順序

### Phase 相依

- **Phase 1**：無前置條件；先固定移除範圍與 fixtures。
- **Phase 2**：依賴 Phase 1；阻擋全部使用者故事。
- **US1（Phase 3）**：依賴 Phase 2；提供靜默安裝且完整移除 MCP 的 MVP。
- **US2（Phase 4）**：依賴 US1 已能安裝正式 Skill，並使用 Phase 2 的契約來源。
- **US3（Phase 5）**：依賴 US2 的正向 runtime 驗證 protocol，再補齊全部失敗、隔離與恢復路徑。
- **US4（Phase 6）**：依賴 US1 的初次安裝服務；可在 Phase 2 後與 US2／US3 的大部分工作平行，但最終驗收需使用完整正式契約。
- **Phase 7**：依賴 US1～US4 全部完成。

### 使用者故事圖

```text
Setup → Foundation → US1 (MVP) → US2 → US3 ─┐
                              └────→ US4 ───┴→ Polish
```

### 使用者故事獨立性

- **US1**：可單獨證明不需系統 Node.js／MCP即可靜默取得 Skills；不依賴候選工作區功能。
- **US2**：以有效 fixture 單獨證明契約理解、正向 runtime round-trip 與三種輸出；不需先完成負向隔離案例。
- **US3**：使用固定有效備份與無效 fixture 單獨證明隔離及恢復；不依賴 Skill 更新功能。
- **US4**：使用 packaged／installed manifest fixture 單獨證明更新、備份、保留與 rollback；不依賴 AI 實際修改工作區。

## 平行執行範例

### 共同基礎

```text
T005 FileService 安全測試
T006 runtime 積木契約測試
T007 BlockContractService 讀取測試
T008 Project Skill 型別
T009 Workspace 驗證型別
```

### 使用者故事 1

```text
T016 ProjectSkillService 初裝測試
T017 extension 啟動測試
T018 Skill layout 契約測試
T019 MCP retirement 契約測試
```

### 使用者故事 2

```text
T027 代理入口一致性測試
T028 runtime 正向契約測試
T029 有效候選整合測試
T030 三種 generator 回歸測試
```

### 使用者故事 3／4

```text
US3 T037-T041 候選、隔離、WebView 與安全測試
US4 T047-T050 更新、rollback、狀態與版本回復測試
```

## 實作策略

### MVP 優先

1. 完成 Phase 1 的基準與 fixtures。
2. 完成 Phase 2 的安全檔案、型別與 runtime 契約基礎。
3. 完成 US1，證明新／既有專案不需系統 Node.js 或 MCP 即可靜默取得英文 Skills。
4. 在 US1 測試及 MCP 移除掃描通過後，才把分支視為可展示的 MVP。

### 增量交付

1. **啟動增量**：US1 靜默安裝、最低 VS Code 與 MCP 完整移除。
2. **合法輸出增量**：US2 同一契約、有效 runtime round-trip 與三種程式輸出。
3. **資料保護增量**：US3 無效候選隔離、最後有效恢復、逾時與競態。
4. **更新安全增量**：US4 使用者修改備份、未知內容保留與交易 rollback。
5. **發布前增量**：Phase 7 語系、文件、安全、封裝及 SC-001～SC-013 證據。

## 格式與覆蓋驗證

- 任務總數：63
- Setup：4
- Foundational：11
- US1：11
- US2：10
- US3：10
- US4：8
- Polish：9
- 所有任務均使用 checkbox、連續 ID、使用者故事階段必要的 `[USx]` 標籤與明確檔案路徑。
- FR-001～FR-024 與 SC-001～SC-013 均至少由一項實作、測試或驗收任務明確對應。
