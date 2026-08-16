# 實作驗證紀錄：受管理的 PlatformIO 雙 Core 環境

**驗證日期**：2026-08-17

**驗證分支**：`codex/067-managed-platformio-environment`

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
- [ ] 依 [quickstart.md](../quickstart.md) 步驟 9－12 完成實際 F5 視覺檢查（亮／暗／高對比／reduced-motion）與任意資料夾操作前後檔案樹比對。

## 合併與發布前尚待完成

- [ ] 在 GitHub PR 執行三 OS x64 真實安裝矩陣，蒐集與 PR head／tree／VSIX／manifest 綁定的 evidence。
- [ ] 對 release candidate 執行 Linux、Windows、macOS ARM64 矩陣；本機 macOS ARM64 結果只提供先期證據，不取代正式 workflow。
- [ ] 在乾淨 Windows 與 Linux 帳號手動確認 Extension 啟用、活動列 editor-open 重查、權限錯誤訊息與離線重啟 UX。
- [ ] 發布候選以實體 Arduino 與 CyberBrick 各完成一次 build／upload／monitor smoke；cloud runner 不連接硬體。

## 結論

本機可完成的程式、封裝、真實 macOS ARM64 runtime、安全、本地 Code Review 與 `0.87.0` 發布契約均已通過。T061 保持未完成，直到 F5 視覺驗收、PR 遠端矩陣、乾淨 macOS runner 與發布前實機 smoke 取得證據；這些是既定 release gates，不是尚未實作的產品程式碼。
