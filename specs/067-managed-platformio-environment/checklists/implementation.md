# 實作驗證紀錄：受管理的 PlatformIO 雙 Core 環境

**驗證日期**：2026-08-17

**驗證分支**：`codex/130-managed-runtime-hotfix`

**功能規格**：[spec.md](../spec.md)

**驗證方式**：[quickstart.md](../quickstart.md)

## 本機決定性驗證

- [x] `npm run ci:static`：project Skill、managed manifest／evidence、TypeScript、webpack、ESLint、15 語系與 release contracts 全部通過。
- [x] `npm run test:managed-runtime`：managed runtime、路由、rollback、cleanup、初始化 coordinator 與 uploader 共 117 項通過。
- [x] `npm run test:managed-runtime:paths`：macOS ARM64 的中文、空白、特殊字元、Emoji／正規化與長路徑 fake-install cases 通過。
- [x] 隔離 VS Code 1.109 執行 Phase 12 程式碼快照的完整 unit suite：1211 項通過、1 項需 Copilot 服務的 AI E2E pending、0 項失敗；後續最終安全重審修正另以 10 項 storage 與 8 項 MicroPython fallback 精準測試驗證。
- [x] `npm run test:integration`：9 項通過、3 項因隔離 profile 無可用 Copilot API 而 pending、0 項產品失敗。
- [x] `npm run package`：production bundle 成功，包含 managed manifest 與第三方授權檔。
- [x] 以 `vsce package` 產生 VSIX，並執行 `npm run test:managed-runtime:vsix`：VS Code 1.109 隔離 profile 實際安裝、列舉版本及封裝資產檢查通過；runtime 版本 `2026.08.1`。
- [x] `npm audit --audit-level=high`：0 個已知漏洞。

## 本地 Code Review 收斂驗證

- [x] 審查範圍以 `origin/master` merge-base `6b5db16001d1f6818846f67826f158492fb5909e` 為基準，納入已提交、暫存、未暫存與全部未追蹤檔案；沒有回復使用者既有變更。
- [x] 修正 managed root 在 ownership 驗證前寫入、redirect 中繼跳未驗證、取消後程序未 close、POSIX／Windows 子程序樹殘留、nested fallback 誤分類與 prepare phase 不一致。
- [x] 修正 managed-first MicroPython／monitor 路由、shell command 邊界、受管路徑 log／結果遮蔽、prompt 期間 workspace 被替換後仍安裝 Skill，以及共用 Core cache 重置。
- [x] 修正 install lock 續租／回收競態；主鎖只在租約逾期且 PID 不存在時回收，reclaim guard 也有短租約，程序崩潰後可自動復原且存活 owner 仍 fail-closed。
- [x] 修正診斷修復、清理、自動修復與 retest 的交錯操作，補 storage usage 與 sticky fallback reason；未知用量摘要不再輸出 `- bytes`。
- [x] `npm run lint -- --max-warnings=0`、`git diff --check`、`npm run test:managed-runtime:paths` 與 41 項最後專項回歸全部通過。
- [x] `npm audit --omit=dev --audit-level=high`：正式依賴 0 個已知漏洞。
- [x] 15 語系結構、placeholder 與決定性契約通過；Code Review 採唯讀語意 gate，未覆寫既有 full-audit state。
- [x] 最終重審修正 managed root symlink 在 ownership claim 前留下 marker 的零寫入缺口，並確認 symlink 外部目標保持空目錄；storage 精準測試 10 項通過。
- [x] 最終重審移除 MicroPython 在 manager 禁止 TLS／proxy／registry／取消 fallback 後再走 legacy provider 的旁路；permission 可 fallback 與 TLS 不可 fallback 精準測試共 8 項通過。
- [x] 最終工作樹再次執行 `npm run ci:static`、`npm run release:prepare`、15 語系 deterministic gate、secret-added diff scan 與 `git diff --check origin/master...HEAD`；全部通過。

## 0.87.0 本地發布準備

- [x] `package.json`、`package-lock.json` 與雙語 `CHANGELOG.md` 已同步為 `0.87.0`；`npm run release:prepare` 驗證 `v0.87.0` 契約通過。
- [x] 完成 92 批、18,257 個唯一語意單位的全量 i18n 審計；manifest `17cd6b52a9162eb567f3de9df17e2b47adf6014415122ede969e9c02542b8b55` 為 current，0 Blocker，既有 2,277 個 Major 保留為 backlog，結果 `PASS_WITH_ADVISORIES`。
- [x] 修正匈牙利文把 cleanup 誤譯為 delete 的 `SEM-002` 阻擋項，並收斂捷克文、德文、西班牙文、法文、波蘭文、葡萄牙文、土耳其文與繁體中文的意圖唯一語法／隱私描述；15 語系 deterministic validator 為 `PASS`。
- [x] `code-simplifier` 將本次新增的 OTA 進度、Core 診斷與 failure evidence 巢狀三元運算式改為等價明確分支；Phase 12 完整 unit suite 驗證為 1211 項通過、1 項 AI E2E pending、0 項失敗。
- [x] unit profile 使用專案內隔離的 extensions dir，不再載入使用者安裝的 Copilot Chat；release contract 靜態測試鎖定 unit／integration 的 extensions dir 邊界。
- [ ] macOS 26 的 `Documents` provenance 會讓下載至 workspace 的 VS Code 測試 app 在第一次完整執行後無法再次啟動；乾淨下載的完整 suite 已通過，PR 的乾淨 macOS runner 必須再次確認。此項不影響 Extension runtime，但保留為本機測試工具風險。

## 真實 runtime 驗證

- [x] macOS ARM64 執行 `npm run test:managed-runtime:e2e -- --allow-network`，在無系統 Python 依賴的受管理目錄完成 CPython、PlatformIO 與 mpremote 安裝及健康探測。
- [x] 真實 artifact：`cpython-3.11.16-20260814-darwin-arm64`；SHA-256 `fcba9f3f676c83e07225e38116649f0c6eb94cb4fcc166632cf92769462b6e39`。
- [x] 真實 E2E 覆蓋 Unicode、空白、特殊字元與 offline restart；重新啟動重用同一 install record，沒有再次下載。
- [x] 啟用與 editor-open 的單元／整合契約證明背景初始化不阻擋 Blockly editor、同視窗請求去重，upload 仍保有最後一道 `ensureReady()`。

## F5 回饋修正驗證

- [x] `npm run compile-tests`：新增的 editor-open result、取消時零寫入與共用 OTA progress contract 通過 TypeScript strict 編譯。
- [x] `npm run compile`：Extension 與 WebView production bundle 編譯成功，managed runtime 封裝資產仍完整。
- [x] `npm run lint`：`src/` ESLint 0 項錯誤。
- [x] `npm run test:i18n`：21 項 deterministic i18n contract 通過；`npm run validate:i18n` 驗證 15 語系 0 項錯誤。
- [x] 隔離 VS Code 1.109 profile 執行 `extension.activate`、`settingsManager`、CyberBrick upload settings WebView contract 與 `webviewManager`：108 項通過、0 項失敗。
- [x] 一般資料夾取消路徑證明 `ProjectSkillService.ensureInstalled()` 與 `SettingsManager.configurePlatformIOSettings()` 呼叫次數皆為 0；缺少設定檔的唯讀查詢不建立 `.vscode/`。
- [x] 依 F5 再現結果移除 activation 與 workspace-folder change 的背景 Skill 安裝入口，並合併並行 editor-open；隔離 VS Code 1.109 重新執行 activation、settings 與 WebView manager 共 99 項通過，包含既有 Blockly folder 在 activation 時也不安裝、取消前不建立 panel／settings／Skill，以及兩個並行開啟只呼叫一次 safety flow。
- [x] OTA 契約證明設定與清除共用單一進度 DOM，兩者都在 Host request 前顯示；設定採實際里程碑、清除 running 省略 `aria-valuenow`，CSS 不再引用未定義的 `--button-primary-bg`。
- [x] 依 [quickstart.md](../quickstart.md) 步驟 9－12 完成實際 F5 視覺檢查（亮／暗／高對比／reduced-motion）與任意資料夾操作前後檔案樹比對。

## PR #126 合併與發布閘門結果

- [x] PR #126 首輪 CI 的三 OS unit、static/security、VSIX smoke 與 CodeQL 三語言分析通過；x64 三 OS 與 ARM64 三 OS 的真實安裝／離線重啟也全部通過，其中 Windows ARM64 為 9 分 20 秒。
- [x] PR #126 首輪總體 CodeQL 以 5 個同源 high annotations 阻擋跨 job output SHA 驅動的 checkout；下游 executable checkout 已改為 GitHub event immutable SHA，prepare output SHA 僅保留作 evidence 身分驗證。
- [x] 首輪 managed runtime 最終 gate 揭露複數 `--evidence` 參數集合未初始化；parser 回歸測試已加入，並下載該 run 的六份真實 evidence 在本機重播 release verifier，六個 OS／arch 身分全部通過。
- [x] Phase 14 修正後的 `npm run ci:static`、`npm run release:prepare`、`git diff --check`、workflow trust-boundary 安全掃描與完整有效差異 Code Review 均通過；本輪結論為 `CLEAR`。
- [x] PR #126 新 HEAD 重新通過總體 CodeQL、CI 與完整 x64／ARM64 runtime evidence gate；首輪結果未替代修正後 commit 的正式證據。
- [x] 在 GitHub PR 執行三 OS x64 真實安裝矩陣，蒐集與 PR head／tree／VSIX／manifest 綁定的 evidence。
- [x] 對 release candidate 執行 Linux、Windows、macOS ARM64 矩陣；正式 workflow 證據已取代本機 macOS ARM64 先期證據。
- [x] 在乾淨 Windows 與 Linux 帳號手動確認 Extension 啟用、活動列 editor-open 重查、權限錯誤訊息與離線重啟 UX。
- [x] 發布候選以實體 Arduino 與 CyberBrick 各完成一次 build／upload／monitor smoke；cloud runner 不連接硬體。

## v0.87.0 immutable tag 發布復原

- [x] PR #126 已在 18 項遠端 checks、F5、乾淨 Windows／Linux 與 Arduino／CyberBrick 實機閘門通過後 squash merge；annotated `v0.87.0` 精確指向 merge commit `43948d49fce58fcfb9f4c34b703ce2b686c7cd99`，且 squash tree 與已測 PR tree 相同。
- [x] 首次 tag push run `31981704124` 在所有發布 job 開始前失敗；GitHub Release、VS Code Marketplace 與 Open VSX 均為 skipped，tag 不得刪除、移動或重建。
- [x] 根因為 reusable runtime workflow 的 `github.event_name` 沿用 tag caller 的 `push`，不會變成 `workflow_call`；原 prepare 條件因此錯誤跳過。Recovery 另須把同一 release tag 綁定至 runtime checkout，避免驗證修復後 master 而非發布內容。
- [x] Recovery 本地 `npm run ci:static`、23 項 release contract、`release:prepare`、YAML parse、`git diff --check` 與連線 `npm audit`（0 vulnerabilities）通過；`code-simplifier` 與完整差異 review 在移除動態 ref 的 npm cache 後為 `CLEAR`。
- [x] 本機 VS Code 1.109 unit launcher 在 macOS 26 仍於測試案例前以既知 `SIGABRT` 結束；未把它誤記為案例通過，正式 unit 證據由 recovery PR 的乾淨 runner 提供。
- [x] Recovery PR #127 已通過必要 checks 並 squash merge 為 `225b950`；後續只從 `master` dispatch 同一 immutable `v0.87.0`。
- [x] Recovery publish run `31983230776` 重新驗證 annotated tag、六平台 runtime、release tree、唯一 VSIX 與 checksum；GitHub Release、VS Code Marketplace、Open VSX 及最終三端 gate 全部成功。

## issue #130／v0.87.1 hotfix 驗證

- [x] 路徑預算分析確認預設 Windows `AppData/Roaming/Code/User/globalStorage/Singular-Ray.singular-blockly/runtime-v1` 加上原複合版本目錄後，PlatformIO 深層檔案路徑可逼近傳統 Win32 260 字元邊界；這是 issue #130 的風險因子而非已證實的唯一 installer 根因，先前真實 E2E 暫存根較短，未覆蓋正式路徑形狀。
- [x] 新版本目錄改用固定長度 transaction UUID；install／transaction record 仍保留完整 runtime version、artifact id 與 manifest SHA，既有 `current.json` 相對目錄讀取契約不變。
- [x] storage initialize 與 installer failure 都進入 provisioning 狀態；installer 新增 `managed-provisioning`、stage、code、started 與遮蔽／有界 stdout／stderr，service 保留 activation／editor-open／repair／workload 的 attempt 與 running／failed snapshot。
- [x] 診斷 Core 卡片、複製摘要、AI repair packet 與 issue draft 納入 provisioning blocker 與有界 evidence；provider operational 不再掩蓋 managed 失敗，且 cancellation／project-process 仍 fail closed。
- [x] `npm run test:managed-runtime` 139 項、`npm run test:managed-runtime:paths` 5 組、正式 `test:unit:ci` 1,225 項通過（1 項既有 Copilot AI E2E pending）；`npm run ci:static`、15 語系、production package、`npm run release:prepare` 與 `git diff --check` 全數通過。
- [x] macOS ARM64 以 `--allow-release-candidate` 在 Unicode／空白／特殊字元上層與預設 global-storage 深度完成第二次真實 CPython／PlatformIO／mpremote 安裝、健康 probe 與離線重啟；省略候選旗標時依政策 fail closed。
- [x] `npm audit --omit=dev --audit-level=high` 回報正式依賴 0 個已知漏洞；WebView provisioning evidence 使用既有 `escapeHtml` detail renderer，raw／URI-encoded managed root 與 token regression 通過。
- [ ] Runtime-sensitive PR 的 Windows／macOS／Linux x64 與 release-candidate ARM64 真實 E2E evidence 都包含 `default-global-storage-shape` 並通過；乾淨 Windows F5 診斷可看到 attempt／stage 與遮蔽 installer evidence。
- [ ] Arduino／CyberBrick 實機 smoke 確認 provider-primary 與 managed-primary 路由未回歸後，才允許 squash merge、annotated `v0.87.1` tag 與三端發布。

## 結論

`v0.87.0` recovery 與三端發布已由 run `31983230776` 完成。`v0.87.1` hotfix 的程式、SDD、本地全量 gate、code-simplifier、安全審查與本地 Code Review 已完成；仍需 Phase 3.5 核准後的六平台 runtime evidence、乾淨 Windows F5 與 Arduino／CyberBrick 實機 smoke，才能 squash merge、建立 annotated tag 並發布。
