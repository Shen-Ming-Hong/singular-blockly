# CI/CD 操作手冊

Singular Blockly 以 PR 為唯一的 `master` 變更入口，並以 annotated `vX.Y.Z` tag 作為唯一正式發布輸入。版本、lockfile 與雙語 CHANGELOG 必須先進入同一 PR；tag 推送後，GitHub Actions 會把 CI 產生的同一份 VSIX 發布到 GitHub Releases、VS Code Marketplace 與 Open VSX。

## CI 契約

`.github/workflows/ci.yml` 會在所有 PR、`master` push 與正式發布 workflow call 執行：

- Node.js 固定為 22.16.0，VS Code 測試版固定為 1.105.0。
- `npm ci` 使用 lockfile 與 npm cache。
- 靜態檢查執行 TypeScript／webpack 編譯、`src` 與 i18n／release scripts ESLint、確定性翻譯驗證、whitelist tests、release helper tests，以及高嚴重度 `npm audit`。
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

## 翻譯驗證與月度稽核

PR 只執行 `npm run validate:i18n`。缺鍵、空字串、placeholder、schema 或編碼問題會失敗；長度比例只計數，使用 `npm run validate:i18n:verbose` 才展開警告。PR workflow 不再執行 pattern detector、留言或取得 PR 寫入權限。

`.github/workflows/i18n-audit.yml` 每月一日 02:00 UTC 及手動執行時稽核全部 14 個非英文語系。它會上傳 JSON、文字摘要與 pattern report，並寫入 Actions summary。高嚴重度問題超過 10 時，建立或更新唯一的 `[i18n] Translation Quality Audit` issue；回到門檻內會自動關閉。

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

## GitHub 管理設定

下列設定是 repository 管理狀態，無法只靠提交檔案完成。人工發布核准固定由發布擁有者在 `pr-review-release` Phase 3.5 明確給予。

首次啟用後，確認第一個 PR 實際產生 `CI Gate` 與 CodeQL 的 `Analyze (javascript-typescript)`；若 job 名稱日後變更，required status checks 必須同步更新。

### Release environment

- 建立名為 `release` 的 environment。
- 既有 repository secrets `VSCE_PAT`、`OVSX_PAT` 可直接沿用；GitHub 不提供既有 secret 值的讀回或複製功能。
- 日後輪替 PAT 時，可改存為同名 environment secrets；environment secrets 會覆蓋同名 repository secrets。
- Deployment branches and tags 限制為 `v*` tags。
- 不新增 environment reviewer；人工發布核准由 `pr-review-release` Phase 3.5 負責。

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

- Secrets 名稱維持 `VSCE_PAT`、`OVSX_PAT`，不得寫入 log、artifact 或 repository。
- Workflow 預設只有 `contents: read`。
- 只有 GitHub Release job 使用 `contents: write`；只有月度翻譯稽核使用 `issues: write`。
- 所有第三方 Actions 固定完整 commit SHA，Dependabot 每週追蹤 npm 與 GitHub Actions 更新。
- 帳號、Copilot 與硬體 integration tests 保留在發布技能的人工驗收，不放入無憑證 CI。
