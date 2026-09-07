# VS Code／VSCodium 同步 Node 24 基線實作計畫

日期：2026-09-07。基準 commit：86df436（PR #162）。分支：codex/deps-editors-node24。
狀態：使用者已同意兩套編輯器同步升級；本地實作與兩套最低編輯器驗證完成；三平台 CI 與遠端宿主驗證待完成。

## 核准方向與 SDD gate

最低支援的 VS Code 與 VSCodium 一起提高到 Node 24 宿主，繼續提供兩套編輯器的完整產品支援。這取代前一份計畫尚待決定的支援政策；不用再就相同方向詢問核准。

SDD：Lightweight plan。使用者已決定支援政策，預計只有版本、測試啟動設定、相容性修正與文件，沒有新的 runtime API、資料格式、安全模型或架構設計。如果實際編譯／宿主驗證需要多層產品行為修改，先列出影響並重新做 Full SDD gate。

specs/063 的 VSCodium 1.121 SC-006 與 specs/066 的 VS Code 1.109 基線保留為歷史；新版本起以下列共同基線取代。舊編輯器使用者須升級編輯器才能安裝後續 extension 新版本；既有已安裝 extension 不會被本次設定停用。

## 已選版本與證據

| 元件 | 實作目標 | 查核 |
| --- | --- | --- |
| 最低 VS Code | 1.126.0；engines.vscode ^1.126.0 | 官方 Node／remote pin 24.15.0；既有官方測試 app 實測 Node 24.15.0、Electron 42.2.0 |
| 最低驗收 VSCodium | 1.126.04524 | 官方 upstream/stable.json 對應 VS Code 1.126.0、commit 7e7950df89d055b5a378379db9ee14290772148a |
| VSCodium 實測 | Node 24.15.0、Electron 42.2.0、Undici 7.24.4 | 官方 macOS ARM64 zip SHA-256 通過，app package.version 為 1.126.04524 |
| @types/node | 24.13.3；建議 ~24.13.3 | #140 指定版本，固定 minor 範圍避免擴大至高於最低宿主 API 的新 minor |
| undici-types | 隨 @types/node 所需 ~7.18.0，現有 bot lock 7.18.2 | 實作時檢查限定 lockfile 差異 |
| @types/vscode | 保留 1.125.0；宣告改 ~1.125.0 | 該版本確實存在且低於最低編輯器 API 基線；避免目前 ^1.109.0 自動漂移至較新 API |
| 建置 Node | 保留 24.20.0／隨附 npm 11.19.0 | PR #162 已完成三平台 CI |
| 最低開發 Node | 保留 >=22.16.0 與既有相容性 job | 此處只負責建置工具，Extension Host 另由新最低編輯器提供 Node 24 |

官方 VSCodium 發行清單未提供 1.123 系列；因此採實際可用的共同 1.126 基線，不再使用先前的 VS Code 1.123.2 候選。

版本查詢不等同完整啟動、三平台與上傳驗證。既有 VS Code app 與官方 tag 的 Electron patch 設定可能不同；正式驗收需固定下載來源、記錄實際版本與雜湊，不能由來源 .nvmrc 取代 runtime 證據。VSCodium 是四段發行號，應以其上游 API 版本判斷 engine 相容性，不能直接拿四段字串當標準 semver。

## 實作步驟

1. 在目前隔離分支執行精確依賴更新：package.json 的 engines.vscode、@types/node、@types/vscode 範圍及 package-lock.json。使用 Node 24.20.0 的 npm，先檢查 diff；不混入 Vitest、Wrangler、TypeScript 或無關依賴升級。
2. 把 .vscode-test.mjs 的最低版與 scripts/managed-runtime/smoke-vsix.js 改到 1.126.0。透過現有 @vscode/test-electron runner 的 executable path 支援，提供 VSCodium 測試入口；自訂執行檔只用隔離 profile，不能覆寫使用者編輯器或擴充套件目錄。
3. 將下載的官方 VSCodium 完整 app 用於測試，不以 standalone CLI 代替 Extension Host。所有安裝、單元測試與 smoke 均使用臨時 user-data/extensions/workspace。
4. 更新 mcpRetirement.contract.test.ts 的 engines.vscode 契約，保留 MCP 移除、不需使用者安裝 Node 等其餘斷言。增加真正有意義的版本／宿主檢查，確保 CI 不會誤跑 Node 22 宿主；不要只改數字讓測試變綠。
5. 檢查 Node／Undici 型別造成的 fetch、Request／Response、stream、proxy、TLS、SSH 與子程序差異，只做必要相容性修正。不改 compiler target，不放寬 TLS，不使用 legacy-peer-deps 或 audit fix --force。
6. README、AGENTS.md（Copilot 為其連結）、docs/ci-cd.md、現行 quickstart／dependency 說明同步兩個最低版本及使用者升級指引。過去版本的 CHANGELOG 與 specs 不覆寫；本計畫記錄取代的支援契約。
7. 完成下列矩陣、本地 review、必要修正與 re-review 後提交本地 commit。使用者核准方向允許本地實作；push／PR／merge 依既有流程在可審查結果完成後取得核准。合併人工替代 PR 後才處理 #140。

## 合併前驗收矩陣

| 範圍 | 必要驗證 | 通過條件 |
| --- | --- | --- |
| 依賴／編譯 | npm ci、audit、npm ls、ci:static | 無 invalid peer、新增漏洞或非預期 lockfile 更新；Worker／i18n／release 契約通過 |
| VS Code 1.126.0 | macOS、Windows、Linux unit；production VSIX 安裝與啟動 | 確認 editor 版本與 Node 24 宿主，三平台 CI 通過 |
| VSCodium 1.126.04524 | 三平台完整 app：安裝、啟動、unit 及核心 smoke | 不能僅以 VS Code 通過替代；下載檔與 SHA-256 固定 |
| 核心功能 | Blockly 開啟、儲存／重載、Arduino／MicroPython 產碼、runtime 可用性、下載與 proxy／TLS 定向測試 | workspace 往返保留資料、產碼一致、無新增上傳流程回歸 |
| 最低邊界 | 舊版 VS Code／VSCodium 嘗試安裝新 VSIX | 由 engine 檢查清楚拒絕，不能安裝後才崩潰 |
| 目前穩定 VS Code | 實作時記錄確切版本，執行安裝／啟動 smoke | 同一份 VSIX 可啟動，不將浮動 stable 當最低版驗證 |
| 遠端宿主 | 官方 VS Code／VSCodium server build 的 Node 基線，實際 remote Extension Host smoke | 記錄本機／remote 的 process.versions；未實測則列為未完成，不能宣稱全面支援 |
| Node 22 開發工具 | 保留 PR #162 的最小相容性 job | 建置與 release 契約通過；不把該 job 的 Node 當成產品宿主 |

硬體與互動式 Copilot AI 需要對應設備／登入，不以既有 pending 充當通過。先執行可自動化的核心契約與 uploader 定向測試；缺少真實設備或遠端環境時明確回報證據缺口。若 CI 平台取得 VSCodium 產物失敗，先修正精確下載／checksum／解壓流程，不靜默跳過該平台。

每個實作差異最多一次完整本地驗證；後續只針對修改重跑。三平台外部 CI 的必要驗證另外執行，不啟動外部 AI reviewer。

## 完成定義與回復

- 兩個新最低編輯器的必要驗收通過；版本範圍與實際型別符合最低 API 基線。
- CI Gate、CodeQL、無衝突、本地 review CLEAR，沒有待決支援政策。
- 安全模型、專案資料格式及使用者不需安裝系統 Node 的契約保持成立。
- 本次不自動 bump extension 或發布 tag；正式發布時需明確列出最低編輯器升級要求，依發布流程準備版本與雙語 CHANGELOG。
- 未合併時修正或撤回隔離分支；合併後如有回歸，用 revert PR 一併回復 engines、型別／lockfile、測試與文件，保留第一階段已驗證的 Node 24 建置工具鏈。不 force push master。

## 已完成準備

- [x] 使用者同意 VS Code 與 VSCodium 一起升級。
- [x] 建立隔離分支 codex/deps-editors-node24，基於 86df436。
- [x] 核對共同上游版本與官方 Node／remote pin。
- [x] 下載 VSCodium 1.126.04524、驗證 SHA-256、查詢 runtime。
- [x] 核對兩套 API 型別的實際 registry 版本。
- [x] 精確更新 manifest／lockfile、測試入口、契約與文件。
- [ ] 完成兩套編輯器驗收、review 與本地提交。
- [ ] 遠端核准、CI、合併與 #140 收尾。

## 來源

- [VSCodium 發行版](https://github.com/VSCodium/vscodium/releases/tag/1.126.04524)
- [VSCodium 上游版本記錄](https://github.com/VSCodium/vscodium/blob/1.126.04524/upstream/stable.json)
- [VS Code 1.126.0 Node pin](https://github.com/microsoft/vscode/blob/1.126.0/.nvmrc)
- [VS Code 1.126.0 遠端 Node 目標](https://github.com/microsoft/vscode/blob/1.126.0/remote/.npmrc)
- [PR #140](https://github.com/Shen-Ming-Hong/singular-blockly/pull/140)
- [第一階段 PR #162](https://github.com/Shen-Ming-Hong/singular-blockly/pull/162)

## 本地實作紀錄

- manifest 改為 engines.vscode ^1.126.0、@types/node ~24.13.3、@types/vscode ~1.125.0。實際 lockfile 套件版本僅 @types/node 22.18.12 → 24.13.3、undici-types 6.21.0 → 7.18.2；extension 版本仍為 0.88.1。
- .vscode-test.mjs 使用既有 test-cli 的 useInstallation.fromPath 支援 VSCODE_EXECUTABLE_PATH；既有 unit/integration profile 隔離方式保持不變。
- scripts/editors/download-vscodium.js 固定官方版本，下載 checksum 並先核對 SHA-256，再以原生解壓工具展開完整 app，CI 透過 GITHUB_ENV 傳遞執行檔路徑。
- CI unit 矩陣為 vscode/vscodium × Ubuntu/Windows/macOS；Linux coverage 僅由 vscode job 上傳，避免同名 artifact 衝突。VSCodium 各平台另驗證 production VSIX 安裝。
- smoke-vsix.js 支援指定編輯器；以 executable 加內建 cli.js 與參數陣列呼叫，不透過 shell 拼接指令。
- 測試 setup 檢查 Node 24 與 API 1.126，並輸出實際編輯器名稱／版本；MCP 移除契約只更新核准的 engine 基線。

已通過：npm ci、audit 0 漏洞、npm ls、ci:static（含 Worker 152、i18n 21、release 25）、Node 22 tsc --noEmit 與 release 25、workflow YAML／六組矩陣檢查、新增腳本 lint、git diff --check。

本機 macOS ARM64：VS Code 1.126.0 與 VSCodium 1.126.04524 分別完成 1363 passing／1 既有互動式 pending，均退出 0；實際宿主 Node 24.15.0／Electron 42.2.0。VSCodium 在 API 的 vscode.version 回報 1.126.0，app package.json 為 1.126.04524。

同一份 production VSIX 通過隱私檢查，以及兩套最低編輯器的隔離安裝／版本列舉。新增 VSCodium 下載程式在本機成功下載、驗證 SHA-256 並解壓；下載來源未修改使用者已安裝的編輯器。

限制：Windows/Linux 實際結果需由本 PR 的六組 CI 驗證；遠端 Extension Host 與真實硬體／互動式 AI 本輪未實測。遠端目前僅有官方 Node 24.15.0 構建設定證據，不宣稱已通過遠端驗收。

補充邊界與新版驗證：VS Code 1.122.1、VSCodium 1.121.03429 都在隔離 profile 安裝時明確回報版本不相容並拒絕新 VSIX。目前穩定 VS Code 1.136.1 安裝通過，並啟動宿主完成 2 項定向契約測試；宿主 Node 24.18.1／Electron 42.10.0，退出 0。

本地 review base：86df436；完整差異包含新增 downloader 與本計畫。code-simplifier 檢查保留既有 test-cli executable 入口與單一下載腳本，未引入額外框架；security-checker 檢查固定 HTTPS 來源、SHA-256、參數陣列執行與 profile 隔離，無新增可執行 finding。結果 CLEAR；外部 reviewer 0 輪。兩套最低編輯器各執行一次完整 unit；目前穩定版只做定向 smoke，未重複完整套件。PR 尚未建立，六組 CI 與遠端／硬體限制仍如上所述。
