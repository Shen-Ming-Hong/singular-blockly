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

## Push、PR 與發布

- 先閱讀 [pr-review-release](../pr-review-release/SKILL.md)，完成其本地 review、必要修正與驗證，再進入遠端步驟。只有發布 PR 需要版本、雙語 CHANGELOG 版本區段與 Phase 3.5 發布核准；非發布 PR 依該技能的「非發布 PR 的自主合併」與整合佇列文件進行。單純本地 commit 不會自動觸發 push 或 PR。
- 分支命名依 [並行開發工作目錄](../maintain-singular-blockly/references/parallel-worktrees.md)：Codex 用 `codex/`，Claude Code 用 `claude/`，雲端工作階段沿用系統指定分支；若 Spec Kit 或使用者指定分支名稱，沿用該名稱。不得直接 push `master`。
- 建立 PR 時，從實際 diff、測試與相關 spec 撰寫描述，用 `gh pr create --body-file`（雲端工作階段用 GitHub MCP `create_pull_request`）。開 PR 前依並行開發文件檢查與其他開啟中 PR 的重疊。合併順序與條件依整合佇列文件；tag 與 Actions 發布條件以 `pr-review-release` 為準。
- CI 或 review 出現新 finding 時，在本任務範圍內修正；超出範圍或需要產品決策時，依該技能的評估流程問使用者，不自行擴大修正。
