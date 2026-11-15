---
name: git-workflow
description: 使用者要求 commit、push 或建立 PR 時，處理本專案的精確 staging、繁體中文 Conventional Commit 與 Git 交接；PR 審查和發布依 pr-review-release。Use for project Git commits and pull requests.
metadata:
  author: singular-blockly
  version: '2.1.0'
  category: productivity
  inspired-by: anthropics/claude-code/plugins/commit-commands
license: Apache-2.0
---

# Git 工作流程

只處理使用者要求的 Git 範圍。提交前保留既有未相關變更；非發布 PR 的 push、PR 與合併依 [整合佇列與自主合併](../maintain-singular-blockly/references/merge-queue.md) 的常設授權進行，發布依 [pr-review-release](../pr-review-release/SKILL.md) 的審查及核准流程。

## 本地提交

1. 讀取 `git status --short`、`git diff`、`git diff --cached` 與相關 spec／測試，確認哪些差異屬於本次工作。不要使用 `git add .` 混入其他變更。
2. 若差異含 `media/locales/*/messages.js`、`package.nls*.json`、範例翻譯或使用者可見來源文字，先依 [i18n-maintenance](../i18n-maintenance/SKILL.md) 處理並執行 `npm run validate:i18n`；`NEEDS_USER_DECISION` 須取得選擇，`BLOCKED` 不得提交。
3. 依修改範圍完成測試和 lint，明確列出未執行的檢查與原因。程式碼變更進入 PR 審查時，依 `pr-review-release` 使用 [code-simplifier](../code-simplifier/SKILL.md)。
4. 用明確檔案清單或 `git add -p` stage，檢查 `git diff --cached`，再建立 Conventional Commit。格式為 `<type>(<scope>): <繁體中文描述>`；依實際變更選擇 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`ci`、`build` 或 `revert`。Scope 可用 `blocks`、`generators`、`i18n`、`webview`、`skills`、`services`、`toolbox`、`deps`。

```bash
git status --short
git add -p
git diff --cached
git commit -m "fix(webview): 修正工作區載入錯誤"
```

多個獨立變更可分開提交；任務編號若有助追蹤，可放在描述或 body，但描述仍使用繁體中文。

## 公開內容的隱私檢查

本 repo、PR、CHANGELOG 與 GitHub Release 都是公開的。push 或建立／更新 PR 前，檢查這次的 commit 訊息、PR 標題與描述，以及發布時的 CHANGELOG 與發布說明，不得含有：

- 本機絕對路徑（`/Users/…`、`/home/…`、`/root/…`、`C:\Users\…`）與專案共用資料夾 `/mnt/project-files/…`；證據改寫成相對路徑或說明，截圖用 PR 附件。
- Dropbox、Google Drive 等私人分享連結，Ray 其他私人 repo 的網址，內部主機名稱、token、密鑰或其片段。
- 個人 email；commit 的作者與提交者只用 noreply 信箱（`noreply@anthropic.com`、`…@users.noreply.github.com`）。

```bash
git log origin/master..HEAD --format='%an <%ae>%n%cn <%ce>%n%B' \
  | grep -nEi '/Users/|/home/|/root/|/mnt/|C:\\Users|dropbox|drive\.google|docs\.google|@gmail\.|token|secret' || echo clean
```

PR 描述與發布說明以同樣模式另外檢查一次。逐一看命中的內容（`token`、`secret` 也會命中一般說明文字），確認是私人資料就改掉再推送；已推送的內容不改寫歷史，回報 Ray。squash 合併後 `master` 上 commit 的作者 email 由合併者的 GitHub 帳號設定決定（目前是 Ray 的個人信箱），要改需 Ray 在 GitHub 的 email 設定開啟「Keep my email addresses private」；這是帳號設定，不由工作階段處理。依 session 規定附加的 `Claude-Session` 歸屬行與 Co-Authored-By 不在此限。技能或文件中刻意寫明的路徑（例如 Ray Mac 上的專案資料夾）不屬於這項檢查。

## Push、PR 與發布

- 先閱讀 [pr-review-release](../pr-review-release/SKILL.md)，完成其本地 review、必要修正與驗證，再進入遠端步驟。只有發布 PR 需要版本、雙語 CHANGELOG 版本區段與 Phase 3.5 發布核准；非發布 PR 依該技能的「非發布 PR 的自主合併」與整合佇列文件進行。單純本地 commit 不會自動觸發 push 或 PR。
- 分支命名依 [並行開發工作目錄](../maintain-singular-blockly/references/parallel-worktrees.md)：Codex 用 `codex/`，Claude Code 用 `claude/`，雲端工作階段沿用系統指定分支；若 Spec Kit 或使用者指定分支名稱，沿用該名稱。不得直接 push `master`。
- 建立 PR 時，從實際 diff、測試與相關 spec 撰寫描述，用 `gh pr create --body-file`（雲端工作階段用 GitHub MCP `create_pull_request`）。開 PR 前依並行開發文件檢查與其他開啟中 PR 的重疊。合併順序與條件依整合佇列文件；tag 與 Actions 發布條件以 `pr-review-release` 為準。
- PR 依 session 規定加 Ray 為 assignee 並請 Ray review。PR 是以 Ray 的帳號建立時，GitHub 不允許作者審自己的 PR，請求會失敗；設好 assignee 即可，不重試、也不用回報這個失敗。
- CI 或 review 出現新 finding 時，在本任務範圍內修正；超出範圍或需要產品決策時，依該技能的評估流程問使用者，不自行擴大修正。
