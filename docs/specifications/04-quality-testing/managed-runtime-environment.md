# Managed Runtime 跨平台驗證與發布閘門

本文件定義 Singular 內建 Python／PlatformIO Core 的 PR、合併與發布驗證。目標不是在每次提交都重複下載完整 runtime，而是把低成本決定性測試與需要真實網路、時間較長的安裝矩陣分層。

## 執行時機

| 階段 | 觸發方式 | 驗證內容 | 是否阻擋合併／發布 |
|------|----------|----------|--------------------|
| 一般 PR | 每次開 PR、推送新 commit | Windows／macOS／Linux fake artifact、路徑、checksum、rollback、unit、lint、i18n | 是，作為一般 CI gate |
| Runtime PR | 維護者加上 `runtime-e2e-approved` | 三 OS x64 真實 Python、PlatformIO、mpremote 安裝與離線重啟 | Runtime 變更應設為 required check |
| 發布候選 PR | 維護者加上 `release-candidate` | x64 加上 manifest 宣告的 Linux／Windows／macOS ARM64 | 是，不完整不得合併成發布候選 |
| 正式 tag | `publish.yml` 呼叫 reusable runtime workflow | 重新執行完整 release matrix；CI 重新封裝並實際安裝 VSIX | 是，所有發布 job 都依賴 quality |

因此任何人提交 PR 都會自動觸發快速矩陣，但不會自動觸發真實下載矩陣。真實矩陣只在維護者加 label 或正式發布時執行；分支在合併前就能完成全部測試，新 commit 會讓舊 check 與 evidence 失效。

## 本機與分支驗證

不連網的日常驗證：

```bash
npm run check:managed-runtime
npm run test:managed-runtime:evidence
npm run test:managed-runtime:paths
npm run test:managed-runtime
```

真實安裝必須明確允許網路，沒有 flag 時腳本會 fail closed：

```bash
npm run test:managed-runtime:e2e -- --allow-network
```

ARM64 release-candidate artifact 另需 `--allow-release-candidate`。腳本將 runtime 放在自己建立的暫存子目錄；完成後只刪除該子目錄，不接受把 workspace、home 或磁碟根目錄當作清理目標。
正式 Extension factory 會啟用 manifest 已宣告的 ARM64 release-candidate artifact；這個產品政策的前提是發布 workflow 把對應 ARM64 矩陣設為必要門檻。底層 service 與本機腳本仍預設 fail closed，需明確 flag 才能選取候選 artifact。

真實 E2E 的 sandbox 上層名稱包含 Unicode、空白與合法特殊字元，managed root 再置於 `AppData/Roaming/Code/User/globalStorage/Singular-Ray.singular-blockly/runtime-v1` 等同形狀下；各 OS 都使用同一形狀，Windows 特別用來驗證正式預設路徑預算。PlatformIO installer scratch 必須落在系統暫存根下的短交易 leaf，不得回到 `versions/<uuid>/installer-tmp`；Windows path-budget preflight 要同時通過 immutable runtime 與 scratch 投影。evidence 的 path cases 必須包含 `default-global-storage-shape`，不可用較短 managed root 替代。

自訂 managed path 只能是空的本機目錄，或先前已有有效 Singular root ownership marker 的目錄；非空且未受管的位置會在建立任何 runtime 子目錄前拒絕。cleanup 與 install 共用 lock，因此安裝進行中的 staging 不會被同時清理。

## Evidence 契約

每個 runner 產生一份不含本機絕對路徑的 JSON，綁定：

- repository、PR number、事件來源、head SHA 與 Git tree SHA；
- 共用候選 VSIX SHA-256 與 runtime manifest SHA-256；
- OS、CPU、runner label、真實 E2E 回報的 artifact id／SHA-256、路徑案例與 offline restart 結果。

`verify-evidence.js` 會把 PR／event、artifact id／SHA-256 與 packaged manifest 逐項對回，並對未知 schema、重複或缺少矩陣、必要路徑案例不足、失敗結果、新 commit、tree／VSIX 不同、未完成離線重啟或疑似 home／proxy／credential 內容全部拒絕。Squash merge 可改變 commit SHA；如果採用先前 PR evidence，必須另外以 tree 模式證明合併後內容完全相同。本次 release workflow 選擇更保守的作法：在 tag 所指內容重新執行完整矩陣。

## 成本評估

此 repository 為公開專案，GitHub 官方目前說明標準 GitHub-hosted runner 對 public repository 免費；larger runner 仍會計費。這個設計只使用標準 runner，包括 `ubuntu-24.04-arm`、`windows-11-arm`、`macos-15` 與 `macos-15-intel`。[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)、[GitHub-hosted runners reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)

實際資源量級：

- fake path matrix：每 OS 通常數分鐘，不下載 runtime；
- x64 真實矩陣：3 個 runner，各下載約 26–47 MiB Python artifact，再安裝 PlatformIO／mpremote，預估每 runner 10–20 分鐘；
- release ARM64：再增加 3 個 runner，資源量級相同；
- artifact 保存 14 天，evidence 很小，共用候選 VSIX 只上傳一次。

若 repository 改為 private，標準 runner 會消耗方案內 minutes，超額成本由 repository owner 承擔；應在 GitHub Billing 設定 budget／stop-usage，並只保留 label-gated 真實矩陣。公開 repository 仍要注意 artifact storage 與意外改用 larger runner 的費用。

## 外部 PR 與 Runner 安全

- workflow 只使用 `pull_request`、`workflow_dispatch` 與 `workflow_call`，禁止 `pull_request_target` 執行 PR code；
- 權限固定為 `contents: read`，真實安裝不需要 secrets；
- 外部 PR 在維護者加 label 前不執行真實下載；核准後只在一次性 GitHub-hosted VM 執行；
- 不讓未信任 PR code 接觸永久 self-hosted runner、發布 token 或 release environment；
- actions 以完整 commit SHA pin；candidate VSIX 只建置一次並讓全部矩陣以 SHA-256 綁定同一檔案。

## Branch protection 建議

`master` 至少要求 `CI Gate`、maintainer review、無衝突與最新分支。修改下列敏感範圍的 PR，維護者應加 `runtime-e2e-approved` 並要求 `Managed runtime evidence gate`：

- `resources/managed-runtime/**`；
- `src/services/managedRuntime*`、`coreEnvironment*`、`platformioProcess*`；
- `scripts/managed-runtime/**`；
- `.github/workflows/runtime-installation.yml`、`ci.yml`、`publish.yml`；
- runtime 下載、archive、路徑、proxy、安裝鎖或 release evidence 相關相依套件。

## 發布前人工硬體清單

Cloud runner 不接實體裝置。正式發布前仍需人工確認：

- Arduino Uno／ESP32 各一次 provider-primary 編譯、上傳與 monitor；
- 模擬 provider 本機 executable 故障，確認 upload spawn 前只 fallback 一次；
- CyberBrick 在無系統 Python 的乾淨帳號完成 USB 上傳；
- 上傳程序開始後的裝置／serial 失敗不會改用另一 Core 重傳；
- 不受信任 workspace 不啟動 pkg install、build、upload 或 monitor；
- Extension 啟用後不按上傳即開始 managed Core 背景初始化，活動列開啟編輯器會重查但不阻塞 UI。
- 乾淨 Windows 在 `LongPathsEnabled=0` 與預設 global storage 形狀完成首次初始化；右下角 Notification 可取消、stage 單調前進，完成後 reload 不重複顯示。
- 兩個視窗同時初始化時只安裝一次，等候視窗採用相同 current record；取消及失敗後不留下本次 installer scratch 或 ready 半成品。
- 人為設定過長 managed path 時，在 artifact 執行前得到 `path-too-long` 與三個安全復原動作；診斷／AI packet 不含完整敏感路徑，provider Core 維持不變。
