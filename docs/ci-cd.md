# CI/CD 操作手冊

Singular Blockly 以 PR 為唯一的 `master` 變更入口，並以 annotated `vX.Y.Z` tag 作為唯一正式發布輸入。版本、lockfile 與雙語 CHANGELOG 必須先進入同一 PR；tag 推送後，GitHub Actions 會把 CI 產生的同一份 VSIX 發布到 GitHub Releases、VS Code Marketplace 與 Open VSX。

## CI 契約

`.github/workflows/ci.yml` 會在所有 PR、`master` push 與正式發布 workflow call 執行：

- Node.js 固定為 22.16.0，VS Code 測試版固定為 1.109.0。
- `npm ci` 使用 lockfile 與 npm cache。
- 靜態檢查執行 TypeScript／webpack 編譯、`src` 與 i18n／release scripts ESLint、確定性翻譯驗證、i18n contract tests、release helper tests，以及高嚴重度 `npm audit`。
- Ubuntu、Windows、macOS 都執行 unit tests，並用 `--forbid-only` 阻擋 `.only`。
- Linux 透過 Xvfb 產生 coverage artifact；目前只提供報告，不設未知基準的 hard gate。
- VS Code 測試使用 `${{ runner.temp }}` 下的 workspace、user-data 與 extensions 目錄，並跳過 extension dependencies，不讀取開發者的 Copilot、PlatformIO 或已安裝擴充功能。
- 三平台測試與靜態檢查通過後才建立 `singular-blockly-X.Y.Z.vsix`、SHA-256、雙語 release notes 與 metadata。
- 固定必要檢查名稱為 `CI Gate`。

本機對應指令：

```bash
npm ci
npm run ci:static
npm run test:unit:ci
npm audit --audit-level=high
```

Linux coverage runner 使用：

```bash
xvfb-run -a npm run test:coverage:ci
```

## 翻譯驗證與語意稽核

GitHub CI 執行 `npm run validate:i18n` 與 `npm run test:i18n`。15 個 locale 與 `package.nls` 的缺少／多餘 key、空字串、placeholder 次數、schema、編碼、必要 ARIA 或 Blockly core locale 問題都會失敗。CI 不執行模型語意判斷、不產生長度比例警告，也不需要 PR／Issue 寫入權限。

語意品質由工作區 `i18n-maintenance` Skill 在本地 diff、Git workflow 與發布 review 中檢查。Skill 讀取 repo audit state；距上次完整審計已滿 30 天、政策版本改變、checkpoint 未完成或使用者要求 `audit-all` 時，使用固定 manifest 與每批 200 組的 helper 續跑。全量審計不自動改寫既有翻譯；既有 Blocker 阻擋發布，Major 形成待辦。

## 發布流程

1. 在功能分支完成 SemVer、`package.json`、`package-lock.json` 與雙語 `CHANGELOG.md`。
2. 執行 `npm run release:prepare`，確認四者契約完整。
3. 依 `git-workflow` 與 `pr-review-release` 完成本地 review、兩次使用者 gate、PR、CI 與 squash merge；發布擁有者的 Phase 3.5 明確核准即為 maintainer approval，不要求作者無法完成的自我 GitHub review。
4. 同步最新 `master`，建立 annotated tag：

    ```bash
    git tag -a vX.Y.Z -m "Release vX.Y.Z"
    git cat-file -t vX.Y.Z
    git push origin vX.Y.Z
    ```

    第二個指令必須輸出 `tag`。

5. `.github/workflows/publish.yml` 呼叫共用 CI；helper 會拒絕 lightweight tag、版本不一致或缺少 CHANGELOG 區段。
6. `quality` job 只產生一份 versioned artifact。GitHub Release、VS Code Marketplace 與 Open VSX jobs 各自下載同一 artifact，可單獨重跑失敗 job。
7. GitHub Release notes 直接來自對應 CHANGELOG 區段，並附 VSIX 與 `.sha256`。

若發布失敗，使用 Actions 的「Re-run failed jobs」或：

```bash
gh run rerun RUN_ID --failed
```

不得刪除／重建 tag，也不得重發已成功的市集。市集的第一次 publish 仍嚴格拒絕重複版本；只有 workflow 重跑時才使用 `--skip-duplicate`，用來復原「市集已接受、runner 卻回報失敗」的不明狀態。正式發布不在本機執行 `vsce package` 或 `gh release create`。

若 tag 觸發的 run 在三個發布 job 開始前，因 workflow 缺陷於 `quality` 階段失敗，先以新 PR 修正 workflow。合併後從 `master` 對同一個既有 annotated tag 執行復原，不刪除或重建 tag：

```bash
gh workflow run publish.yml --ref master -f release_tag=vX.Y.Z
```

復原 run 仍會 checkout 該 tag、重新取得遠端 annotated tag object，並驗證 tag、checkout commit、版本檔及雙語 CHANGELOG 完全一致後才建置與發布。

若同一 run 的 Marketplace 與 Open VSX 已成功，但 GitHub Release 因 workflow 缺陷失敗，先用 PR 修正 workflow，再從原失敗 run 的 artifact 只補 GitHub Release：

```bash
gh workflow run recover-github-release.yml --ref master \
  -f release_tag=vX.Y.Z \
  -f source_run_id=FAILED_RUN_ID
```

復原 workflow 只接受失敗的 `Publish VS Code Extension` run，會重新驗證 annotated tag、release metadata、VSIX archive 與 SHA-256，且不含 VS Code Marketplace 或 Open VSX 發布步驟。

## GitHub 管理設定

下列設定是 repository 管理狀態，無法只靠提交檔案完成。人工發布核准固定由發布擁有者在 `pr-review-release` Phase 3.5 明確給予。

首次啟用後，確認第一個 PR 實際產生 `CI Gate` 與 CodeQL 的 `Analyze (javascript-typescript)`；若 job 名稱日後變更，required status checks 必須同步更新。

### Release environment

- 建立名為 `release` 的 environment。
- VS Code Marketplace 使用 Microsoft Entra workload identity federation，不保存 `VSCE_PAT`。在 environment variables 設定 `AZURE_CLIENT_ID` 與 `AZURE_TENANT_ID`；這兩項是識別碼，不是秘密。
- Open VSX 仍使用 `OVSX_PAT` environment secret；GitHub 不提供既有 secret 值的讀回或複製功能。
- Deployment branches and tags 限制為 `v*` tags 與受保護的 `master` branch；`master` 僅供不可變 tag 與原 run artifact 的復原 workflow 使用。
- 不新增 environment reviewer；人工發布核准由 `pr-review-release` Phase 3.5 負責。

### VS Code Marketplace Entra 身分

- Azure 資源群組為 `rg-singular-blockly-release`，user-assigned managed identity 為 `singular-blockly-marketplace-publisher`。
- Federated credential 的 issuer 為 GitHub Actions，audience 為 `api://AzureADTokenExchange`，subject 只允許 `Shen-Ming-Hong/singular-blockly` 的 `release` environment；Azure 入口網站產生的 subject 同時固定 GitHub owner 與 repository 的 immutable numeric ID，避免名稱刪除後被冒用。
- 該身分不需要 Azure subscription 或 resource group RBAC；`azure/login` 使用 `allow-no-subscriptions: true`，權限只來自 Marketplace publisher 的 Contributor 成員資格。
- `.github/workflows/verify-marketplace-identity.yml` 只在人工觸發時登入該身分並解析 Marketplace User ID，不會封裝或發布 extension。第一次以 `verify_membership=false` 取得 User ID，將其加入 Marketplace publisher `Singular-Ray` 並設為 Contributor；第二次以 `verify_membership=true` 執行唯讀的 `vsce verify-pat`。
- `.github/workflows/publish.yml` 只在 `publish-marketplace` job 授予 `id-token: write`，使用固定 commit SHA 的 `azure/login`，先執行 `vsce verify-pat Singular-Ray --azure-credential`，再以同一短效身分發布。
- 身分驗證與一次不發布的檢查成功後，應撤銷／刪除舊 `VSCE_PAT`；不要把 Entra access token、Azure CLI cache 或 Marketplace 短效憑證存進 secret、artifact 或 log。

### `master` ruleset

- 只允許 Pull Request，required approvals 設為 0，讓發布擁有者在 Phase 3.5 明確核准後可自行發布。
- Require conversation resolution。
- 必要檢查選擇 `CI Gate` 與 CodeQL 的 `Analyze (javascript-typescript)`。
- 禁止 force push 與 branch deletion。

### `v*` tag rulesets

- `release tag creation` 只限制建立，僅 Repository admin 可 bypass。
- `release tag immutability` 禁止更新與刪除，且不設 bypass。
- GitHub ruleset 的 bypass 會略過整組規則，因此必須拆成兩條才能同時允許 maintainer 建立並禁止任何人更新／刪除。
- workflow 仍會以 Git object type 再驗證 annotated tag。

### Repository merge settings

- 只啟用 squash merge。
- 啟用 Automatically delete head branches。

## Secrets 與權限

- 長期發布 secret 只保留 Open VSX 的 `OVSX_PAT`，不得寫入 log、artifact 或 repository；VS Code Marketplace 改用 GitHub OIDC 取得 Entra 短效權杖。
- Workflow 預設只有 `contents: read`。
- 只有 GitHub Release job 使用 `contents: write`；只有 Marketplace 身分驗證／發布 job 使用 `id-token: write`；翻譯驗證不使用寫入權限。
- 所有第三方 Actions 固定完整 commit SHA，Dependabot 每週追蹤 npm 與 GitHub Actions 更新。
- 帳號、Copilot 與硬體 integration tests 保留在發布技能的人工驗收，不放入無憑證 CI。
