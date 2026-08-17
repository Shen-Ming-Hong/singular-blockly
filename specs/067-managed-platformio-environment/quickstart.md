# 快速開始：實作與驗證受管理 PlatformIO 環境

## 本機決定性驗證

```bash
npm ci
npm run compile-tests
npm run compile
npm run lint
npm run test:managed-runtime
```

`test:managed-runtime` 不需系統 Python或網路，使用 fake artifact 覆蓋中文與空白、特殊字元與 Emoji、NFC／NFD、長路徑、checksum、不寫入、root ownership、cleanup／install lock、archive escape、symlink、中斷 rollback、PlatformIO 版本範圍及離線重啟不重下載。

F5 回饋的同意邊界與 OTA 共用進度可用隔離 VS Code 測試執行：

```bash
npm run compile-tests
VSCODE_TEST_TEMP_DIR=/tmp/singular-blockly-consent-progress npx vscode-test \
  --label unit --forbid-only --fail-zero --skip-extension-dependencies \
  --run out/test/extension.activate.test.js \
        out/test/settingsManager.test.js \
        out/test/webview/cyberbrickUploadSettings.contract.test.js \
        out/test/webviewManager.test.js
```

上例是 macOS／Linux shell；Windows PowerShell 先執行 `$env:VSCODE_TEST_TEMP_DIR = "$env:TEMP\singular-blockly-consent-progress"`，再執行相同的 `npx vscode-test ...` 參數。

## 手動 Extension 驗證

1. 在沒有可用 `python`／`pio` 的測試帳號啟動 Extension Development Host；不按上傳，確認 `onStartupFinished` 已開始背景準備 managed runtime。
2. 在背景安裝期間從活動列開啟中文與空白路徑 workspace 的 Blockly 編輯器，確認狀態重查但 editor 不被阻擋，且 installer 不重複啟動。
3. 背景初始化完成後才執行 CyberBrick USB，確認上傳直接重用 managed runtime；上傳端 `ensureReady()` 仍能在背景失敗時續裝。
4. 重新載入並離線，確認重用 current install record。
5. 開啟診斷，確認兩套 Core 分區且複製摘要無完整 home／workspace。另以受控 installer failure 模擬 `installing-platformio` 失敗，確認 managed 區段、AI packet 與 issue draft 都顯示相同 attempt／stage／code，但不含完整 managed root 或 raw credentials。
6. 安裝官方 provider，確認 Arduino 選 provider；在 project process 前模擬本機 executable 故障，確認只 fallback 一次。
7. 模擬編譯、DNS、serial 與 upload-started 後失敗，確認不 fallback。
8. 把 workspace 設為不信任，確認 runtime 背景準備仍可做不載入專案的工具安裝，但 pkg install、build、upload 與 monitor 均不啟動。
9. 建立一個不含 `blockly/`、`.agents/` 與 `.vscode/` 的一般資料夾，記錄檔案樹後從活動列開啟 Blockly；在安全詢問按取消或 Escape，確認編輯器未開啟且檔案樹完全不變。再選擇繼續，確認同意後才建立專案設定與 Project Skill。
10. 連接 CyberBrick 並開啟設定 modal。開始 OTA 設定後，確認上方共用進度卡立即顯示、隨真實步驟前進且沒有可見百分比；完成後保持成功狀態。
11. 在進階設定確認清除 OTA，確認使用同一張進度卡、執行中具有持續可見但不虛構百分比的 sweep，成功／失敗後顯示 terminal 狀態並解除控制項。
12. 對步驟 10－11 分別切換亮色、暗色、高對比與作業系統 reduced-motion，確認進度填色、邊框與文字都可辨識；reduced-motion 下不動但仍有靜態 running 提示。
13. 在乾淨 Windows 測試帳號確認 `LongPathsEnabled=0`，保持預設 `globalStorage` 路徑並移除既有 managed runtime；重新載入 Extension Development Host，確認右下角立即出現可取消的 Singular Core 準備通知，且不需先按上傳。
14. 觀察通知依序呈現等待跨視窗、下載 Python、解壓、安裝 PlatformIO、安裝 CyberBrick helper、驗證與提交；等待跨視窗時不顯示虛構百分比，其餘進度單調前進且成功後自動關閉，不另外顯示成功 toast。
15. 在下載或安裝期間按取消，確認子程序停止、候選 runtime 與本次 installer scratch 被清理、上一個 `current.json` 維持不變，且不跳出一般失敗提示。
16. 重新觸發初始化並完成安裝；診斷中的 Singular Core 路徑必須屬於 Extension managed storage，PlatformIO provider 的 Core 路徑不變。再次 reload 或開啟編輯器時，ready 狀態不得重複顯示安裝通知。
17. 開啟兩個指向同一使用者資料的 VS Code 視窗同時觸發首次安裝；第二個視窗顯示等待訊息，第一個完成後第二個採用相同 current record，不再下載或建立另一套 Core。
18. 以過長的 machine-scoped managed path 重試，確認 artifact 執行前即顯示可行動的短路徑錯誤，並提供「開啟診斷」、「選擇較短資料夾」與「複製 AI 修復摘要」；摘要不得包含完整 home、workspace、managed root、credentials 或 token。

## 真實 runtime 與發布驗證

維護者在 Runtime PR 加 `runtime-e2e-approved` 執行三 OS x64；正式候選加 `release-candidate`，加入宣告支援 ARM64。本機顯式執行需：

```bash
npm run test:managed-runtime:e2e -- --allow-network
```

沒有 `--allow-network` 必須拒絕連外。完成前另執行 `npm run ci:static`、unit、integration 與 package；tag 重建 VSIX smoke 成功後才能發布。

真實 E2E evidence 的 `pathCases` 必須包含 `default-global-storage-shape`；在 Windows 檢查其 sandbox root 具有 `AppData/Roaming/Code/User/globalStorage/Singular-Ray.singular-blockly/runtime-v1` 層級及 Unicode／空白／特殊字元上層。還要驗證 PlatformIO installer 使用系統暫存根下的固定短交易 leaf，而非 `versions/<uuid>/installer-tmp`，且預設形狀通過 runtime／scratch path-budget preflight。若只在較短 managed root 成功，不得視為 issue #130／#132 的路徑驗證通過。
