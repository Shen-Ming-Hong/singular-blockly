# 任務：受管理的 PlatformIO 雙 Core 環境

**輸入**：`specs/067-managed-platformio-environment/` 的 spec、plan、research、data-model、contracts 與 quickstart

**測試要求**：規格 FR-027 與 SC-010 要求安裝、路由、錯誤分類、rollback、診斷與發布 gate 可由決定性自動化測試獨立驗證，因此各故事採測試先行。

## Phase 1：設定與供應鏈資產

**目的**：建立受管理 runtime 的封裝位置、驗證命令與套件設定。

- [x] T001 建立 runtime 資產目錄與第三方授權說明於 `resources/managed-runtime/THIRD_PARTY_NOTICES.md`
- [x] T002 [P] 新增 runtime manifest 驗證與新鮮度腳本於 `scripts/managed-runtime/validate-manifest.js`
- [x] T003 [P] 新增 fake artifact 產生器於 `scripts/managed-runtime/create-fake-artifact.js`
- [x] T004 將 managed runtime 資源複製到 production bundle 並加入 npm 驗證命令於 `webpack.config.js` 與 `package.json`

---

## Phase 2：共用基礎

**目的**：建立所有故事共用且不直接依賴 VS Code UI 的型別、安全路徑與程序邊界。

**⚠️ 關鍵**：完成本階段前不得整合上傳器或啟動真實下載。

- [x] T005 [P] 定義 RuntimeManifest、RuntimeArtifact、InstallRecord 與狀態型別於 `src/types/managedRuntime.ts`
- [x] T006 [P] 定義 CoreEnvironment、CoreInvocation、WorkloadSelection 與 FailureClass 於 `src/types/coreEnvironment.ts`
- [x] T007 [P] 建立 manifest schema／平台選擇／allowlist 單元測試於 `src/test/services/managedRuntimeManifest.test.ts`
- [x] T008 實作 manifest 解析、SHA-256 與目前平台 artifact 選擇於 `src/services/managedRuntimeManifest.ts`
- [x] T009 [P] 建立 managed storage containment、UNC、symlink、root 與 workspace hash 測試於 `src/test/services/managedRuntimeStorage.test.ts`
- [x] T010 實作預設／machine-scoped 根目錄驗證、擁有權與隔離 workspace 路徑於 `src/services/managedRuntimeStorage.ts`
- [x] T011 [P] 擴充安全的 argument-array 子程序介面與取消語意測試於 `src/test/services/platformioProcess.test.ts`
- [x] T012 擴充 `shell: false`、env overlay、spawn-started 狀態與可取消程序於 `src/services/platformioProcess.ts`
- [x] T013 將預設 managed storage 與 manifest URI 注入 activation composition root 於 `src/extension.ts`

**Checkpoint**：純函式、路徑與程序 adapter 可在無 Python、無網路環境獨立測試。

---

## Phase 3：使用者故事 1－沒有 Python 也能開始使用（P1）🎯 MVP

**目標**：在沒有系統 Python／pip／pio 的電腦上，以交易方式建立並重用 Singular Core。

**獨立測試**：用 fake CPython artifact 安裝到暫存 managed root，驗證 checksum、健康 probes、atomic current、失敗 rollback 與離線重啟零下載。

- [x] T014 [P] [US1] 建立下載大小、redirect、checksum、逾時與取消契約測試於 `src/test/services/managedRuntimeDownloader.test.ts`
- [x] T015 [US1] 實作可注入且支援 HTTPS proxy 的限制式下載器於 `src/services/managedRuntimeDownloader.ts`
- [x] T016 [P] [US1] 建立 archive traversal、link、特殊 entry 與 Unicode 解壓測試於 `src/test/services/managedRuntimeArchive.test.ts`
- [x] T017 [US1] 實作 manifest 採用的 tar.gz entry 預檢與 containment 解壓於 `src/services/managedRuntimeArchive.ts`
- [x] T018 [P] [US1] 建立 staging、lock lease、probe、atomic commit、更新失敗與中斷復原測試於 `src/test/services/managedRuntimeInstaller.test.ts`
- [x] T019 [US1] 實作安裝 lock、staging、Python／PlatformIO／mpremote 安裝、健康檢查與 atomic record 於 `src/services/managedRuntimeInstaller.ts`
- [x] T020 [P] [US1] 建立 ensure／離線重用／repair 冪等服務測試於 `src/test/services/managedRuntimeService.test.ts`
- [x] T021 [US1] 實作 managed runtime ensure、health、repair 與 progress orchestration 於 `src/services/managedRuntimeService.ts`
- [x] T022 [US1] 建立固定版本與 checksum 的 `resources/managed-runtime/runtime-manifest.json`、固定 installer artifact 及授權紀錄於 `resources/managed-runtime/`
- [x] T023 [US1] 將 CyberBrick/mpremote availability 改由 managed runtime 優先提供於 `src/services/micropythonUploader.ts`
- [x] T024 [US1] 連接 extension context、設定與 progress UI 到共用 ManagedRuntimeService 於 `src/extension.ts` 與 `src/webview/messageHandler.ts`
- [x] T024A [P] [US1] 建立 activation／editor-open 初始化去重與 unsupported 測試於 `src/test/services/managedRuntimeInitializationCoordinator.test.ts`
- [x] T024B [US1] 在 `onStartupFinished` activation 背景初始化，並於每次開啟 Blockly 編輯器重查 Core 狀態於 `src/services/managedRuntimeInitializationCoordinator.ts` 與 `src/extension.ts`

**Checkpoint**：無 provider、無系統 Python時，US1 可由 fake artifact 端到端完成並在 restart 重用。

---

## Phase 4：使用者故事 2－雙 Core 自動選擇與安全備援（P1）

**目標**：Arduino provider 優先、Python managed 優先，且只有安全的 pre-start 本機故障可 fallback 一次。

**獨立測試**：注入兩個 fake Core 與每個 failure class，驗證選擇順序、sticky、一次 fallback 與 upload started 後零 fallback。

- [x] T025 [P] [US2] 建立 phase-aware failure classifier 全分類單元測試於 `src/test/services/coreFailureClassifier.test.ts`
- [x] T026 [US2] 實作 fail-closed 錯誤分類純函式於 `src/services/coreFailureClassifier.ts`
- [x] T027 [P] [US2] 建立 workload profile、health、sticky 與一次 fallback 測試於 `src/test/services/coreEnvironmentManager.test.ts`
- [x] T028 [US2] 實作 Provider／Managed Core 探測、路由、sticky 與重測重置於 `src/services/coreEnvironmentManager.ts`
- [x] T029 [P] [US2] 擴充 Arduino uploader 測試以涵蓋 `pkg install`、pre-start fallback 與 upload-started 禁止重試於 `src/test/services/arduinoUploader.test.ts`
- [x] T030 [US2] 將 Arduino package preparation／build／upload 改用 CoreEnvironmentManager 與隔離 env 於 `src/services/arduinoUploader.ts`
- [x] T031 [P] [US2] 擴充 MicroPython availability／upload 雙 Core 選擇測試於 `src/test/services/micropythonUploaderAvailability.test.ts`
- [x] T032 [US2] 完成 MicroPython managed→provider fallback、sticky 與禁止裝置錯誤 fallback 於 `src/services/micropythonUploader.ts`
- [x] T033 [US2] 將單一 CoreEnvironmentManager 注入所有 uploader 建立點於 `src/webview/messageHandler.ts` 與 `src/services/serialMonitorService.ts`

**Checkpoint**：兩種 workload 的選擇與 fallback 可在無真實 Core／裝置下完整驗證。

---

## Phase 5：使用者故事 3－不同路徑與權限下可靠安裝（P1）

**目標**：在支援 OS 的中文、空白、特殊字元、Emoji、正規化、長路徑與不同磁碟環境可靠運作，危險位置在執行前拒絕。

**獨立測試**：三 OS CI 對本機 fake artifact 執行 path matrix；拒絕不可寫、UNC／network、symlink 與 root。

- [x] T034 [P] [US3] 新增跨平台 path／permission／offline restart runner script於 `scripts/managed-runtime/test-installation.js`
- [x] T035 [P] [US3] 新增 VS Code 測試暫存根目錄的 Unicode／空白／特殊字元 cases 於 `src/test/suite/managedRuntimePathMatrix.test.ts`
- [x] T036 [US3] 修正 path matrix 揭露的 quoting、正規化、Windows drive 與長路徑處理於 `src/services/managedRuntimeStorage.ts` 與 `src/services/platformioProcess.ts`
- [x] T037 [US3] 將 deterministic managed runtime path matrix 加入所有 PR 的三 OS jobs 於 `.github/workflows/ci.yml`
- [x] T038 [US3] 新增 machine-scoped managed storage 設定、驗證與 package.nls 描述於 `package.json` 與 `package.nls*.json`

**Checkpoint**：每個 PR 都能在三 OS 無外部下載地證明路徑與 rollback 契約。

---

## Phase 6：使用者故事 5－既有 Provider 使用者維持相容（P1）

**目標**：保留 spec 063 的 provider 引導、固定優先順序與既有 Arduino 行為，不新增硬性 Extension 相依。

**獨立測試**：官方 provider、PIOArduino、兩者皆有及皆無四種組合全數通過，且任何板型開啟 Blockly 都會執行原引導。

- [x] T039 [P] [US5] 擴充 provider 四組合、優先順序與所有板型引導回歸測試於 `src/test/penvProviderService.test.ts` 與 `src/test/webviewManager.test.ts`
- [x] T040 [US5] 將 provider extension id 與 Core source 固定映射並保持官方優先於 `src/services/penvProviderService.ts` 與 `src/services/platformioInvocationResolver.ts`
- [x] T041 [US5] 驗證 WebView 開啟流程不因 managed runtime 移除 provider showHome／reload／Extensions search 於 `src/webview/webviewManager.ts`
- [x] T042 [US5] 鎖定新產生 Arduino 專案平台版本並對既有未鎖版設定只警告一次於 `media/blockly/blocks/board_configs.js` 與 `src/services/arduinoUploader.ts`
- [x] T043 [US5] 更新並驗證受平台 pin 影響的 project Skill 衍生契約於 `resources/project-skills/singular-blockly/` 與 `scripts/generate-skill-contract.js`

**Checkpoint**：只安裝 provider 的既有使用者與未安裝 provider 的新使用者都維持原引導，且 managed fallback 不接管 provider 資料。

---

## Phase 7：使用者故事 4－可診斷、修復與清理（P2）

**目標**：同一診斷頁辨識雙 Core、工作負載選擇與 fallback，並安全修復／清理 managed-owned 內容。

**獨立測試**：建立雙 Core 健康／損壞／未知組合，驗證 schema、隱私摘要、repair rollback 與 cleanup 不觸及 provider／project／未知檔。

- [x] T044 [P] [US4] 擴充雙 Core 診斷、unknown package、選擇與 fallback schema 測試於 `src/test/services/platformioDiagnosticService.test.ts`
- [x] T045 [US4] 擴充 diagnostic types 與 service 以呈現 provider／managed 區段及 selection 於 `src/types/platformioDiagnostic.ts` 與 `src/services/platformioDiagnosticService.ts`
- [x] T046 [P] [US4] 建立 managed repair／cleanup 擁有權與隱私測試於 `src/test/services/managedRuntimeCleanup.test.ts`
- [x] T047 [US4] 實作列舉後驗證、只刪 managed-owned 的 repair／cleanup 於 `src/services/managedRuntimeService.ts` 與 `src/services/managedRuntimeStorage.ts`
- [x] T048 [US4] 更新 PlatformIO diagnostic panel 的雙 Core 狀態、fallback 與由 Host 本機開啟 Singular Core 資料夾的隱私安全動作於 `src/webview/platformioDiagnosticPanel.ts`
- [x] T049 [US4] 新增診斷、安裝、修復、路徑與信任訊息到 15 語系於 `media/locales/*/messages.js` 與 `package.nls*.json`
- [x] T050 [US4] 以非 shell Pseudoterminal process 重構 Arduino monitor 並補程序生命週期測試於 `src/services/arduinoMonitorService.ts` 與 `src/test/suite/arduinoMonitorService.test.ts`

**Checkpoint**：診斷不連外、不虛構 package 狀態、不洩漏完整路徑；managed cleanup 邊界可測。

---

## Phase 8：使用者故事 6－合併與發布前證明支援矩陣（P2）

**目標**：Runtime PR 與發布候選在合併前取得綁定內容的真實安裝證據，tag VSIX smoke 後才發布。

**獨立測試**：用 fixture evidence 驗證缺矩陣、SHA 不符、新 commit、tree 不同與外部 PR 危險 runner 全部 fail closed；workflow lint 確認無 `pull_request_target`。

- [x] T051 [P] [US6] 建立 evidence 收集／驗證 fixtures 與 fail-closed 測試於 `scripts/managed-runtime/evidence.test.js`
- [x] T052 [US6] 實作 PR／commit／tree／VSIX／manifest／matrix evidence 工具於 `scripts/managed-runtime/collect-evidence.js` 與 `scripts/managed-runtime/verify-evidence.js`
- [x] T053 [P] [US6] 建立真實 runtime 安裝與離線重啟 E2E script 於 `scripts/managed-runtime/test-real-installation.js`
- [x] T054 [US6] 新增 label-gated x64／release ARM64 真實矩陣 workflow 於 `.github/workflows/runtime-installation.yml`
- [x] T055 [P] [US6] 建立 tag VSIX 封裝資源與 fake-runtime smoke script 於 `scripts/managed-runtime/smoke-vsix.js`
- [x] T056 [US6] 將 tree evidence 驗證與 tag VSIX smoke 接到 release gate，並讓 publish jobs 只依賴通過的 quality artifact 於 `.github/workflows/ci.yml` 與 `.github/workflows/publish.yml`
- [x] T057 [US6] 文件化 label、成本、安全、branch protection 與人工硬體 checklist 於 `docs/specifications/04-quality-testing/managed-runtime-environment.md`

**Checkpoint**：一般 PR、核准 Runtime PR、release candidate 與 tag publish 四條路徑都有明確且可自動拒絕的 gate。

---

## Phase 9：收斂與跨故事品質

**目的**：完成全部驗證、文件與封裝新鮮度，清除故事間回歸。

- [x] T058 [P] 更新 PlatformIO／MicroPython 架構與使用者操作文件於 `docs/specifications/01-architecture/architecture.md`、`docs/specifications/06-features/platformio-diagnostics.md` 與 `docs/specifications/03-hardware-support/cyberbrick-micropython.md`
- [x] T059 [P] 更新測試覆蓋說明與雙語 CHANGELOG 未發布段落於 `docs/specifications/04-quality-testing/test-coverage.md` 與 `CHANGELOG*.md`
- [x] T060 執行 `npm run validate:i18n`、`npm run check:project-skills`、compile、lint、unit、integration、package 與 VSIX 資源檢查並修正所有失敗
- [x] T061 依 `specs/067-managed-platformio-environment/quickstart.md` 完成決定性、手動與可用平台驗證並記錄結果於 `specs/067-managed-platformio-environment/checklists/implementation.md`
- [x] T062 執行安全審查，確認下載、archive、路徑、子程序、log、cleanup 與 workflow trust boundary 於 `specs/067-managed-platformio-environment/checklists/security.md`

---

## Phase 10：F5 驗收回饋－同意邊界與 OTA 進度

**目的**：修正人工測試揭露的未授權 workspace 寫入與不可見 OTA 進度，並把行為收回可測的 SDD 契約。

- [x] T063 [P] [US7] 建立 activation／workspace-folder change 零 Skill 安裝、並行開啟共用取消結果、一般資料夾取消時 Skill／settings 零呼叫與 panel 不建立，以及缺少設定檔時唯讀不建 `.vscode/` 的回歸測試於 `src/test/extension.activate.test.ts`、`src/test/webviewManager.test.ts` 與 `src/test/settingsManager.test.ts`
- [x] T064 [US7] 讓 WebView 開啟流程回傳明確結果、以單一 in-flight Promise 合併並行開啟、移除 activation／workspace-folder change 的 Skill 安裝入口，並將 workspace settings 與 Project Skill 安裝收斂到安全詢問接受後於 `src/webview/webviewManager.ts`、`src/extension.ts` 與 `src/services/settingsManager.ts`
- [x] T065 [P] [US8] 擴充 WebView 契約測試，涵蓋單一共用進度卡、request 前顯示、determinate／indeterminate ARIA、theme token、forced-colors 與 reduced-motion 於 `src/test/webview/cyberbrickUploadSettings.contract.test.ts`
- [x] T066 [US8] 將 OTA 設定與清除進度整合為 accordion 外的單一 DOM，並以專案 theme token 實作可見填色、sweep 與 terminal 樣式於 `media/html/blocklyEdit.html` 與 `media/css/blocklyEdit.css`
- [x] T067 [US8] 以 active operation 與 request correlation 統一 OTA 設定／清除狀態及控制鎖，設定依真實里程碑前進、清除採 indeterminate，並維持 `textContent` 安全渲染於 `media/js/blocklyEdit.js`
- [x] T068 [P] 更新 Agent Skill 安裝、CyberBrick OTA、架構、測試覆蓋與雙語變更紀錄於 `docs/specifications/`、`docs/specifications/06-features/agent-skills.md` 與 `CHANGELOG.md`
- [x] T069 執行 TypeScript／webpack／ESLint／i18n 與隔離 VS Code 相關測試，將結果記錄於 `specs/067-managed-platformio-environment/checklists/implementation.md`
- [x] T070 更新 spec、plan、tasks、quickstart 與 requirements／UX／security checklists，確認 F5 回饋具有完整需求、驗收與安全追溯於 `specs/067-managed-platformio-environment/`

---

## Phase 11：本地 Code Review 收斂

**目的**：依完整工作樹重新審查供應鏈、鎖、程序、fallback、診斷與 workspace 同意邊界，修正人工流程未覆蓋的競態與隱私缺口。

- [x] T071 [P] 加固 ownership-before-write、每一跳 redirect allowlist、程序樹終止與 close-before-reject，並補負面測試於 `src/services/managedRuntimeStorage.ts`、`src/services/managedRuntimeDownloader.ts` 與 `src/services/platformioProcess.ts`
- [x] T072 [P] 讓 install／cleanup renewal 在釋放前收斂，使用 PID 保護過期主鎖，並讓崩潰後遺留的 reclaim guard 以短租約安全復原於 `src/services/managedRuntimeInstaller.ts`、`src/services/managedRuntimeService.ts` 與相關測試
- [x] T073 修正 nested failure 分類、prepare fallback、managed-first Python monitor、workspace prompt 後 authority 重查、受管路徑遮蔽，以及診斷修復／清理／retest 互斥與未知用量摘要於 `src/services/`、`src/extension.ts`、`src/webview/platformioDiagnosticPanel.ts` 與相關測試
- [x] T074 執行完整本地 Code Review 收斂、靜態／安全／i18n gate、特殊路徑矩陣、隔離 VS Code unit／integration 與回歸測試，並記錄結果於 `specs/067-managed-platformio-environment/checklists/implementation.md`

---

## Phase 12：0.87.0 本地發布準備

**目的**：完成版本契約、全量語意審計、阻塞型簡化與發布前本地驗證，同時保留遠端矩陣及實機閘門。

- [x] T075 執行 92 批全量 i18n 語意審計、修正本次新增的確定性阻擋／Major finding，並更新 `docs/specifications/02-internationalization/audit-state.json`
- [x] T076 將 `package.json`、`package-lock.json` 與雙語 `CHANGELOG.md` 同步為 `0.87.0`，以 `npm run release:prepare` 驗證版本契約
- [x] T077 執行 `code-simplifier`、安全掃描與完整 unit regression，並隔離 unit profile 的 extensions dir，避免載入使用者安裝的 Extension
- [x] T078 更新發布準備證據與 macOS 26 本機測試 app provenance 殘餘風險於 `specs/067-managed-platformio-environment/checklists/implementation.md`

---

## Phase 13：發布前最終安全重審

**目的**：在建立本地提交後重新檢查完整 `origin/master...HEAD`，修正會繞過零寫入與 fallback authority 的最後缺口，並讓證據文件精確反映已執行測試。

- [x] T079 [P] 在 ownership marker 寫入前唯讀驗證 managed root 的完整 symlink path chain，並新增外部 symlink target 零寫入回歸測試於 `src/services/fileService.ts`、`src/services/managedRuntimeStorage.ts` 與 `src/test/services/managedRuntimeStorage.test.ts`
- [x] T080 [P] 讓 `CoreEnvironmentManager` 成為 MicroPython 雙 Core 的唯一 fallback authority，禁止 TLS 等 fail-closed 錯誤再進入 legacy provider 探測，並新增 permission 可 fallback／TLS 不可 fallback 測試於 `src/services/micropythonUploader.ts` 與 `src/test/services/micropythonUploaderAvailability.test.ts`
- [x] T081 重跑精準回歸、`npm run ci:static`、release／i18n／安全 gate，並校正 `implementation.md` 與 `security.md` 的依賴及最終工作樹證據敘述

---

## Phase 14：PR 遠端安全與證據閘門收斂

**目的**：修正 PR #126 首輪 CodeQL 與完整六平台矩陣揭露的 workflow trust-boundary 及 evidence CLI 缺口，不放寬既有候選身分驗證。

- [x] T082 [P] 將 x64、ARM64 與 evidence gate 的可執行 checkout 綁定至 GitHub event immutable SHA，禁止以前一 job 的輸出 SHA 決定執行內容，同時保留輸出 SHA 作 evidence 身分比對於 `.github/workflows/runtime-installation.yml`
- [x] T083 [P] 修正複數 `--evidence` CLI 參數的集合初始化，新增 parser 回歸測試，並以 PR #126 六平台真實 artifacts 重播 release verifier 於 `scripts/managed-runtime/collect-evidence.js` 與 `scripts/managed-runtime/evidence.test.js`
- [x] T084 重跑本地靜態／release／evidence 測試與 Code Review，更新 PR 說明及驗證紀錄後提交推送，重新觸發 CI、CodeQL 與完整 runtime matrix

---

## Phase 15：v0.87.0 immutable tag 發布復原

**目的**：修正首次 tag push 在所有發布端開始前揭露的 reusable caller-event 語意與 recovery tag 綁定缺口，保留既有 annotated tag 與 release commit 不變。

- [x] T085 [P] 以 `inputs.release_candidate` 啟動 reusable prepare，新增 caller 提供的 `candidate_ref`，讓 prepare、x64、ARM64 與 evidence gate 都 checkout 同一 release tag，並移除動態 ref 矩陣的 npm dependency cache 於 `.github/workflows/runtime-installation.yml` 與 `.github/workflows/publish.yml`
- [x] T086 [P] 新增 caller event 不得假設為 `workflow_call`、publish／runtime 必須共用 release tag、四個 executable checkout ref 及 runtime 不得寫入 npm cache 的回歸契約於 `scripts/release/prepare-release.test.js`
- [x] T087 重跑 release／靜態／安全測試、code-simplifier 與完整本地 Code Review，更新 recovery SDD 證據於 `specs/067-managed-platformio-environment/checklists/implementation.md`
- [x] T088 建立 recovery 修正 PR，通過乾淨 runner unit、CI、CodeQL 與必要 runtime matrix後 squash merge
- [x] T089 從 `master` dispatch 同一 annotated `v0.87.0`，驗證 runtime、唯一 VSIX、checksum 與三個發布端，不刪除或重建 tag

---

## Phase 16：issue #130 managed runtime hotfix 與 v0.87.1

**目的**：修正 Windows 預設 global storage 路徑預算造成的 PlatformIO 安裝失敗，讓背景 provisioning 失敗可診斷並維持 fail-closed fallback，準備 `v0.87.1`。

- [x] T090 [P] 以 Windows 預設 global storage 層級計算 issue #130 的最深 PlatformIO 路徑，確認原本 runtime／artifact／UUID 複合版本目錄會逼近傳統 Win32 路徑邊界
- [x] T091 將新版本目錄縮短為固定長度 transaction UUID，保留 install record 的完整 runtime／artifact 身分與既有 record 向後相容於 `src/services/managedRuntimeInstaller.ts` 及相關測試
- [x] T092 [P] 建立涵蓋 storage initialize 與 installer 的 attempt／trigger／stage／percent／recent failure provisioning state，保存遮蔽且有界的 message／stdout／stderr於 `src/types/managedRuntime.ts`、`src/services/managedRuntimeService.ts` 與 `src/services/managedRuntimeInstaller.ts`
- [x] T093 將 `managed-provisioning` 納入 probe／prepare fallback、雙 Core 診斷卡片、AI repair packet 與人工 issue draft，補 cancellation／project-process fail-closed、WebView escaping 及 privacy regression 於 `src/services/`、`media/js/platformioDiagnostic.js` 與 `src/test/`
- [x] T094 將真實 E2E root 改為預設 global storage 形狀，執行 managed runtime、特殊路徑、完整 unit／static／package／release gates，並更新 `specs/067-managed-platformio-environment/checklists/implementation.md`
- [ ] T095 執行 security-checker、code-simplifier 與 local Code Review 收斂；同步 `0.87.1` 版本／雙語 CHANGELOG，取得 Phase 3.5 後才 push、建立 PR、執行完整 runtime matrix 與發布

---

## 相依與執行順序

### 階段相依

- Phase 1 → Phase 2：manifest／fake artifact 入口先建立。
- Phase 2 → 所有故事：型別、路徑與程序安全邊界是共同阻擋項。
- US1 → US2：CoreEnvironmentManager 需要可用的 managed provider。
- US2 → US5／US4：provider 相容與診斷需要完成雙 Core 路由。
- US3 可在 US1 完成後與 US2 並行；US6 可在 Phase 2 後先做 evidence 工具，但 workflow 完整驗證依 US1／US3。
- Phase 9 依所有納入發布的故事完成；Phase 10 是 F5 驗收回饋的收斂增量；Phase 11 重新審查完整有效差異；Phase 12 完成本地發布契約；Phase 13 再驗證已提交分支的零寫入與 fallback authority；Phase 14 收斂 PR 首輪遠端安全與證據閘門 finding；Phase 15 只修復既有 immutable tag 的 workflow recovery，不改變 `v0.87.0` release tree；Phase 16 以 issue #130 的 Windows 正式路徑形狀為 hotfix gate，完成後才進入 `v0.87.1` 發布。
- US7 的同意 gate 先於任何 workspace-local Skill／設定寫入；US8 與 managed runtime 安裝彼此獨立，可在 US7 測試完成後平行驗證。

### 平行機會

- 型別、manifest 測試、storage 測試與 process 測試可分檔平行。
- 每個故事中標記 `[P]` 的測試／腳本可先撰寫並確認失敗。
- US3 path matrix、US5 provider regression、US6 evidence 工具在其相依服務完成後可彼此平行。
- US7 的 Extension Host 測試與 US8 的 WebView contract／樣式可平行，最後再合併 SDD 與手動 F5 驗收步驟。
- Phase 11 的靜態審查、翻譯 gate 與無 GUI 腳本可平行；會啟動 Electron 的 VS Code 測試必須使用隔離 profile 並避免共用測試輸出目錄。
- 文件與 CHANGELOG 可在產品邏輯穩定後平行更新。

## 實作策略

### MVP

1. 完成 Phase 1、2。
2. 完成 US1，先以 fake artifact 證明無系統 Python、atomic install 與 offline reuse。
3. 只在供應鏈 manifest 與安全測試通過後啟動真實下載。

### 增量交付

1. US1：獨立 Singular Core。
2. US2：雙 Core 安全路由。
3. US3：正式跨平台路徑契約。
4. US5：provider 相容與平台 pin。
5. US4：診斷／修復／monitor。
6. US6：合併與發布 gate。
7. Phase 9：全域驗證與文件。
8. Phase 10：依 F5 回饋加固使用者同意邊界與 OTA 共用進度。
9. Phase 11：以完整工作樹反覆 review／fix／verify，直到沒有可採納 finding。
10. Phase 12－15：完成 `0.87.0` 本地發布契約，對已提交完整差異執行安全重審，收斂 PR 遠端 CodeQL／evidence finding，並以新 PR 修復不可變 tag 的發布 workflow。
11. Phase 16：縮短 Windows managed runtime 內部路徑、補齊背景安裝失敗證據與 fallback 契約，通過完整 release-candidate 矩陣後發布 `0.87.1`。

## 任務格式驗證

全部 97 個任務（含 T024A／T024B）皆使用 `- [ ] Txxx [P?] [US?] 描述＋明確檔案路徑`；Setup、Foundational 與收斂任務不含故事標籤，故事階段皆含對應 `[USn]`。T061 已由遠端矩陣、F5、乾淨 OS 與實機 smoke 正式證據完成；T088／T089 已由 PR #127 與成功的 recovery publish run `31983230776` 證實完成；T095 在 v0.87.1 Phase 3.5、遠端矩陣與發布完成前保持未完成。
