# #140：Node 24 工具鏈與型別升級輕量計畫

日期：2026-09-07。狀態：A 階段本地實作與 macOS 驗證完成；待 PR 三平台 CI。B 階段尚未實作。

基準：`origin/master` 的 `01b8ef0b709191d4bfaf4384ede34ea6c57eaf4b`（0.88.1）。
追蹤：[Dependabot #140](https://github.com/Shen-Ming-Hong/singular-blockly/pull/140)。

## 目標與判定

開始驗證 Node 24 建置工具鏈，並為 #140 的型別升級建立可驗收的相容性條件。第一階段維持使用者最低 VS Code 1.109.0 支援。

SDD gate：**Lightweight plan**。目前涉及工具鏈、型別與 CI 設定，沒有產品 API 或資料格式改動。若後續方案要求取消舊 VS Code／遠端主機支援，先重新評估支援政策與 Full SDD gate，再實作。

既有 specs/066 的 MCP 移除規格要求使用者不需自行安裝 Node；specs/067 管理 Python／PlatformIO runtime。兩者不是 Node 24 遷移規格，不能以本次升級恢復使用者 Node 安裝需求。

## 已查證的現況

| 項目 | 現況 | 影響 |
| --- | --- | --- |
| #140 | @types/node 22.18.12 → 24.13.3；manifest ^22.0.0 → ^24.13.3 | 只更新型別，不會更新執行環境 |
| 傳遞型別 | undici-types 6.21.0 → 7.18.2 | 需要檢查 fetch、Request、Response、stream 型別交界 |
| 開發基線 | .nvmrc 與 CI 固定 22.16.0；engines.node >=22.16.0 | 系統 Node 24 原本已落在宣告範圍，但未成為固定驗證基線 |
| Extension Host | VS Code 1.109.0 所附 Electron 39.3.0／Node 22.21.1 | 升級 setup-node 不會升級 Extension Host |
| TS | TypeScript 6.0.3；Node16 module、ES2023 target/lib、skipLibCheck=true | 本次無理由順便改 compiler target；型別檢查不能替代執行測試 |
| #140 CI | 目前 Static、三平台 unit、VSIX 與 CI Gate 通過 | 是原 Node 22 工具鏈的既有證據，不能視為 Node 24 遷移驗收 |

Node 22.21.1 由本機測試用 VS Code 1.109.0 的 Electron 以 ELECTRON_RUN_AS_NODE 查詢 process.versions，並與官方該 tag 的 .nvmrc 交叉確認。這是內建執行檔證據；實作時仍須從測試 Extension Host 記錄實際版本。首次查詢附帶 macOS 簽章診斷，程式正常退出且取得版本，不能據此宣稱完整啟動驗證完成。

官方時程：Node 22 支援至 2027-04-30，Node 24 支援至 2028-04-30。可立即開始規劃，無須為清理 PR 強制提高使用者最低版本。

## 建議執行順序

### A：Node 24 工具鏈相容性驗證（第一個實作項目）

1. 從最新 master 建立 human-owned 分支；保留 @types/node 22 與 VS Code 1.109.0。
2. 選定實作當日的 Node 24 最新 LTS patch，固定確切 Node/npm 版本並記錄。規劃查詢時官方頁顯示 24.20.0，實作前需重查，不使用模糊 latest 作正式 CI pin。
3. 先跑一次 Node 24 的乾淨 npm ci、audit、npm ls、ci:static、test:unit:ci、test:release 與 release:prepare，檢查 npm 11 是否意外重寫 lockfile。
4. 在 CI 加入 Node 24 的三平台驗證；保留 Node 22.16.0 的最小支援工具鏈檢查。用明確矩陣／條件避免同一版本重複完整測試。
5. 通過後更新 .nvmrc、主要建置與封裝 Node pin，保留 engines.node >=22.16.0；若要停止 Node 22 開發支援，另作明確決策。
6. 同步目前的開發與 CI 說明，完成獨立 PR。此階段不宣稱 #140 已完成。

可能受影響：.nvmrc、.github/workflows/{ci,publish,runtime-installation,verify-marketplace-identity,recover-github-release}.yml、README.md、docs/ci-cd.md、AGENTS.md、.github/copilot-instructions.md、docs/specifications/00-technical-foundation/{research,quickstart}.md。保留歷史 specs 與 CHANGELOG 的歷史數值；dependency-upgrades.md 若新增紀錄，明確區分 contributor Node 與 Extension Host Node。

### B：決定 #140 的型別邊界

預設方案：Extension Host 共用型別維持 Node 22，直到最低支援宿主也具備 Node 24 API。不要僅因 A 通過就合併 #140。

可評估的替代方案：

- 若有具體 Node 24 工具腳本需要，為該獨立編譯範圍配置 Node 24 型別；先確認有實際需求，避免為合併 bot PR 引入多套型別與複雜建置。
- 若要把共用型別升至 24，必須選定並實測內建 Node 24 的最低 VS Code 版本、遠端宿主及 VSCodium 支援範圍；取得提高最低支援版本的決策後再修改 engines.vscode、測試版本與契約。不能猜測某個新版 VS Code 的 Node 版本。
- 若保留舊宿主又改用 Node 24 共用型別，需提出可持續的 Node 22 API 相容性檢查；單次 API 搜尋與 CI 綠燈不足以防止未來誤用。成本若高於收益，採預設方案。

第二階段選定方案後，從最新 master 重建人工 PR，限定 @types/node／undici-types 與必要相容性修正，不直接推送 bot branch。替代 PR 合併後才處理 #140 的關閉。

## 遷移檢查重點

依 Node 24 官方重大變更，檢查 npm 11 安裝行為、Undici 7 的 HTTP/fetch/stream 邊界、AsyncLocalStorage 行為、已移除或棄用的 TLS／Buffer／URL API，以及 shell 模式的 child_process 參數。這些是待驗證項目，不是已確認本專案缺陷。

特別檢查 managedRuntimeProxy 的 proxy／NO_PROXY／TLS 憑證、下載與中止處理、SSH/SCP 外部依賴、PlatformIO/mpremote 子程序生命週期。Worker 在 workerd 上執行，不能把系統 Node 24 測試解讀為 Worker runtime 已升級。不能以關閉 TLS 驗證、--legacy-peer-deps 或 audit fix --force 通過檢查。

## 驗證矩陣與完成條件

| 環境 | 驗證 | 通過條件 |
| --- | --- | --- |
| Node 22.16.0 + VS Code 1.109.0 | 最低支援工具鏈 smoke／既有基線證據；有相關差異時跑對應測試 | 既有支援不回歸 |
| 固定 Node 24 LTS + Ubuntu/macOS/Windows | npm ci、unit；記錄系統與宿主 process.versions | 三平台通過，確認測試真的執行於預期宿主 |
| Node 24 + Ubuntu | audit、npm ls、ci:static（含 Worker）、test:release、release:prepare | 無新增漏洞／invalid peer，編譯、契約與封裝通過 |
| VS Code 1.109.0 + Node 24 建置的 VSIX | 安裝、啟用、工作區讀寫、下載/proxy 相關定向測試 | 最低宿主可使用同一產物 |
| 若採提高宿主版本方案 | 新最低 VS Code、目前穩定版、受支援遠端/VSCodium | 實測宿主版本、API 與安裝契約；政策核准 |

硬體與互動式 AI 測試須分別報告是否執行，不以既有 pending 當作通過。只改工具鏈不自動觸發真實部署、硬體上傳或 Marketplace 發布。

每個獨立差異執行一次完整驗證；失敗後只先跑相關定向檢查。正式 PR 仍需 CI Gate、CodeQL、無衝突與本地審查通過。

## 回復與停止條件

- A 安裝／建置出現無法界定的跨平台回歸：保留 Node 22 pin，記錄最小重現，不合併失敗設定。
- B 若必須提高最低 VS Code 或改變產品支援政策：停止依賴實作，提交相容性方案與 SDD gate。
- 未合併時撤回該隔離分支的變更；合併後以 revert PR 回復相應 Node pin、型別、lockfile 和文件，重跑受影響 CI。避免 reset／force push 主分支。
- 不新增忽略規則，不 bump extension 版本、不建立 release tag；遠端 push／PR／merge 依既有核准流程處理。

## 下一步交接

「依 docs/plans/node24-types-140.md 執行 A：選定 Node 24 LTS patch，在隔離環境驗證建置、三平台 CI 與最低 VS Code 1.109.0 相容性。維持 Node 22 共用型別及現有使用者支援；完成可審查差異與驗證後回報。#140 的型別升級需等 B 決策。」

## 一手來源

- [PR #140 實際差異](https://github.com/Shen-Ming-Hong/singular-blockly/pull/140/files)
- [VS Code 1.109.0 官方 Node pin](https://github.com/microsoft/vscode/blob/1.109.0/.nvmrc)
- [VS Code Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host)
- [Node 24 重大變更](https://nodejs.org/en/blog/release/v24.0.0)
- [Node 官方支援時程](https://github.com/nodejs/Release/blob/main/schedule.json)
- [Node 發行狀態](https://nodejs.org/en/about/previous-releases)
- [DefinitelyTyped 型別版本規則](https://github.com/DefinitelyTyped/DefinitelyTyped#version-numbers)

## A 階段本地實作與驗證紀錄（2026-09-07）

- 固定 Node 24.20.0；官方 darwin-arm64 發行檔 SHA-256 通過，隨附 npm 11.19.0。CI 使用該 Node 發行檔所附 npm。
- 五份 workflow 的主要 Node pin 與 .nvmrc 更新至 24.20.0；ci.yml 保留三平台 unit，新增 Ubuntu Node 22.16.0 的安裝、編譯與 release 契約檢查，並將該 job 納入 package 與 CI Gate。
- 測試 setup 輸出 node／electron／platform／arch；實際 VS Code 1.109.0 宿主為 Node 22.21.1、Electron 39.3.0、darwin/arm64。
- 新增 job 後，既有指定 release tag checkout 契約由 3 個更新為 4 個。
- package.json、package-lock.json、@types/node 22.18.12、最低 engines、VS Code 測試版本及 extension 0.88.1 均未變更。

| 驗證 | 本地結果 |
| --- | --- |
| Node 24 npm ci／npm audit／npm ls | 通過；0 vulnerabilities，@types/node 22.18.12，manifest/lockfile 無改動 |
| Node 24 ci:static | 通過；包含 Worker 152 項、i18n 21 項、release 25 項及 lint/編譯/契約 |
| Node 24 啟動 VS Code 1.109.0 的 unit | 1363 passing、1 既有互動式 Copilot 測試 pending，退出碼 0 |
| managed runtime 路徑矩陣 | darwin/arm64 5 路徑通過 |
| Node 24 production VSIX | 打包通過，privacy verification 1084 entries 通過 |
| VSIX 最低版本 smoke | VS Code 1.109.0 隔離安裝及版本列舉通過；不等同實機上傳驗證 |
| Node 22.16.0 定向相容性 | tsc --noEmit、release 25 項、release:prepare 通過；本輪沿用安裝依賴，乾淨 Node 22 npm ci 由新增 CI job 再驗證 |
| workflow 與合併門檻 | YAML 全部可解析；Node 22 success 才允許 gate 通過，failure/skipped/cancelled 均拒絕 |

npm 11.19.0 顯示 8 個安裝腳本尚未設定 allowScripts 的提醒；查核該版本 npm 的 rebuild 邏輯只有明確 deny 才跳過腳本，本次沒有新增允許政策或 bypass。安裝、Worker runtime 與 VSIX 打包皆通過。

本地審查 base 為 01b8ef0，完整有效差異與新增規劃文件已檢查；code-simplifier 檢查的 TS/JS 僅測試輸出與既有契約計數，無額外重構需要。security-checker 未發現新增安全問題，結果 CLEAR；外部 reviewer 0 輪。本輪完整 Node 24 驗證執行一次，Node 22 僅執行相關定向檢查。

未完成的驗證：Windows／Linux 實際 Node 24 CI、Node 22 乾淨安裝 job、真實硬體與互動式 AI。此階段未觸發正式發布、Marketplace 或真實 runtime 安裝 workflow。#140 的型別更新仍屬 B 階段。
