---
name: pr-review-release
description: PR Code Review 評估與完整發布流程。當使用者提到 code review、PR 審查、review 建議處理、merge PR、發布版本、release、squash merge、版本標籤時自動啟用。包含評估 Copilot/人工 review 建議、程式碼修正、Git 合併、語意化版本更新、CHANGELOG、打包發布的完整工作流程。PR review evaluation and release workflow for processing code review comments, merging PRs, semantic versioning, and publishing releases.
metadata:
    author: singular-blockly
    version: '1.4.0'
    category: release
license: Apache-2.0
---

# PR Code Review 評估與發布流程 PR Review & Release Workflow

以專案開發者角度評估 PR Code Review，並執行完整發布流程。
Evaluate PR code reviews from a project developer's perspective and execute the complete release workflow.

## 適用情境 When to Use

- 需要處理 PR 上的 code review 建議
- 評估 Copilot review 或人工審查意見
- 合併 PR 後需要發布新版本
- 執行完整的發布流程（版本號、CHANGELOG、標籤、Release）
- 需要 squash merge 並清理已合併的分支
- 定期清理已合併到 master 的舊本地分支

## 工作流程 Workflow

### Phase 0: 等待 Copilot Review（必須）Wait for Copilot Review (REQUIRED)

**⚠️ 阻塞型步驟：此步驟必須完成才能進入 Code Review 評估階段。**

1. **請求 Copilot Review（若尚未配置）**

    ```bash
    # 請求 Copilot 作為 reviewer（使用 gh CLI 避免 MCP 延遲）
    gh pr edit <PR_NUMBER> --add-reviewer copilot-pull-request-reviewer
    ```

2. **啟動輪詢監聽**

    ```powershell
    # 使用背景模式執行（Agent 可用 await_terminal 等待結果）
    .\.github\skills\pr-review-release\scripts\poll-review.ps1

    # 自訂參數
    .\.github\skills\pr-review-release\scripts\poll-review.ps1 -PrNumber 123 -TimeoutMinutes 60 -PollIntervalSeconds 30
    ```

3. **腳本行為說明**
    - 每 60 秒查詢一次 `copilot-pull-request-reviewer` 的 review 狀態
    - 狀態為 `APPROVED` 時：exit 0，輸出 review 詳情
    - 狀態為 `CHANGES_REQUESTED` 時：exit 1，輸出需修改的內容
    - 逾時（預設 30 分鐘）：exit 2

4. **Agent 整合用法（必須執行）**

    ```typescript
    // 步驟 1: 請求 Copilot Review（使用 gh CLI 避免 MCP 延遲）
    run_in_terminal({
    	command: 'gh pr edit <PR_NUMBER> --add-reviewer copilot-pull-request-reviewer',
    	isBackground: false,
    	goal: '請求 Copilot Code Review',
    });

    // 步驟 2: 背景執行輪詢腳本
    run_in_terminal({
    	command: '.\.github\skills\pr-review-release\scripts\poll-review.ps1',
    	isBackground: true,
    	goal: '等待 Copilot Code Review（必須完成）',
    });

    // 步驟 3: 等待結果（逾時 30 分鐘）
    await_terminal({ id: terminalId, timeout: 1800000 });
    // 必須根據 exit code 判斷後續流程
    ```

5. **手動查詢 Copilot Review 狀態**

    ```bash
    # 查詢最新 Copilot review
    gh pr view --json reviews --jq '.reviews | map(select(.author.login == "copilot-pull-request-reviewer")) | last'
    ```

---

### Phase 1: Code Review 評估 Review Evaluation

1. **讀取 PR Review 評論**

    ```bash
    # 取得目前分支的 PR 資訊
    gh pr view --json reviews,comments,number

    # 取得詳細的 review 評論
    gh pr view --json reviews --jq '.reviews[] | {author: .author.login, state: .state, body: .body}'
    ```

2. **評估每條建議**，以專業開發者角度判斷：

    | 判斷結果 | 標準                         | 範例                               |
    | -------- | ---------------------------- | ---------------------------------- |
    | ✅ 採納  | 真正有價值、能改善程式碼品質 | 修復潛在 bug、改善效能、增強可讀性 |
    | ❌ 忽略  | 基於錯誤理解或不符合專案架構 | 過度工程化、不了解上下文、風格偏好 |

3. **記錄評估結果**，清楚說明每條建議的採納/忽略理由

### Phase 2: 程式碼修正 Code Fixes

若有採納的建議：

1. **修正程式碼**
    - 根據採納的建議進行修改
    - 確保符合專案規範（參考 `copilot-instructions.md`）

2. **驗證修正**

    ```bash
    # 執行測試
    npm test

    # 執行 lint
    npm run lint
    ```

### Phase 3: 程式碼簡化（必須）Code Simplification (REQUIRED)

**⚠️ 阻塞型步驟：此步驟必須完成才能進入 Git 操作階段。**

修正 Code Review 建議後，**必須**使用 `code-simplifier` 技能進行程式碼簡化：

1. **執行程式碼簡化檢查**

    ```bash
    # 取得本次變更的檔案
    git diff --name-only origin/master | grep -E '\.(ts|js)$'
    ```

2. **強制簡化流程**
    - 閱讀 `code-simplifier` 技能文件
    - 對所有變更的 TypeScript/JavaScript 檔案執行簡化
    - 確保遵循專案的 coding standards

3. **簡化完成標準**
    - [ ] 減少不必要的巢狀結構
    - [ ] 移除冗餘程式碼和抽象
    - [ ] 變數和函式命名清晰
    - [ ] 無描述顯而易見程式碼的註解
    - [ ] 測試通過且功能不變

4. **提交簡化變更**

    ```bash
    git add .
    git commit -m "refactor: simplify code before release"
    ```

> 💡 **Agent 整合**：輸入「簡化程式碼」、「refactor」或 `@code-simplifier` 觸發技能。

> ❌ **禁止跳過**：未完成程式碼簡化不得進入 Phase 4。

### Phase 4: Git 操作 Git Operations

1. **提交變更**（若有修正）

    ```bash
    git add .
    git commit -m "fix: address code review feedback"
    ```

2. **推送並合併**

    ```bash
    # 推送到功能分支
    git push origin HEAD

    # Squash merge PR
    gh pr merge --squash --delete-branch
    ```

3. **同步主分支**

    ```bash
    git checkout master
    git pull origin master
    git status -sb
    ```

    確認主分支已同步且工作目錄乾淨，再進入發布流程。

4. **清理已合併分支 Branch Cleanup**

    ```bash
    # 更新遠端分支資訊，移除已刪除的遠端分支
    git fetch --prune

    # 刪除本地功能分支（若尚未刪除）
    git branch -d feature-branch-name

    # 批次刪除所有已合併到 master 的本地分支
    git branch --merged master | grep -v "master" | xargs -r git branch -d

    # 列出並清理標記為 [gone] 的分支（遠端已刪除）
    git branch -vv | grep ': gone]' | awk '{print $1}' | xargs -r git branch -d
    ```

5. **清理 Worktrees（如有使用）**

    ```bash
    # 列出所有 worktrees
    git worktree list

    # 移除關聯已刪除分支的 worktree
    git worktree remove path/to/worktree
    ```

### Phase 5: 發布流程 Release Process

按照專案憲法（constitution.md）或發布規範執行：

#### 5.1 版本管理 Version Management

1. **決定版本號**（遵循語意化版本）
    - `patch`: Bug 修復、小改進 (0.0.X)
    - `minor`: 新功能、向後相容 (0.X.0)
    - `major`: 破壞性變更 (X.0.0)

2. **更新版本號（避免自動建立輕量 tag）**

    ```bash
    npm version patch --no-git-tag-version  # 或 minor / major
    ```

3. **更新 CHANGELOG.md**
    - 新增雙語條目（中英文）
    - 格式遵循 Keep a Changelog

4. **提交版本更新**

    ```bash
    git add package.json package-lock.json CHANGELOG.md
    git commit -m "chore(release): 發布版本 {VERSION}"
    ```

#### 5.2 品質驗證 Quality Verification

```bash
# 完整測試
npm test

# Lint 檢查
npm run lint

# 建置驗證
npm run compile
```

#### 5.3 建置與打包 Build & Package

```bash
# 生產建置
npm run package

# 打包 VSIX（若為 VS Code 擴充功能）
npx @vscode/vsce package
```

#### 5.4 Git 標籤 Git Tagging

**⚠️ 重要：所有版本標籤必須使用 Annotated Tags（`-a` 參數）**

Annotated tags 包含建立者、日期、訊息等元資料，是正式發布的標準做法。

```bash
# 建立 Annotated Tag（必須使用 -a 參數）
git tag -a v{VERSION} -m "Release v{VERSION}"

# 推送標籤到遠端
git push origin v{VERSION}

# 驗證標籤類型（應顯示 tag 而非 commit）
git cat-file -t v{VERSION}
```

**❌ 禁止使用 Lightweight Tags：**

```bash
# 錯誤示範 - 不要這樣做！
git tag v{VERSION}  # 缺少 -a 參數，會建立 lightweight tag
```

#### 5.5 GitHub Release（必要步驟 REQUIRED）

**⚠️ 重要：此步驟不可省略！Git tag 不等於 GitHub Release。**

> 注意：Release 公告容易因 CLI 字串轉義導致跑版，建議使用臨時檔（`release-notes.md`）輸入。

```powershell
@'
## ✨ New Features | 新功能

### Feature Name | 功能名稱
- English description | 中文說明

## 🐛 Bug Fixes | 修復
- Fixed issue | 修正問題

## 📦 Download | 下載
- **VSIX**: singular-blockly-{VERSION}.vsix

---
**Full Changelog | 完整變更日誌**: https://github.com/{owner}/{repo}/blob/master/CHANGELOG.md
'@ | Set-Content -Path "release-notes.md" -Encoding UTF8

gh release create v{VERSION} -t "v{VERSION}" -F release-notes.md ./singular-blockly-{VERSION}.vsix

Remove-Item -Force release-notes.md
```

**Release 版面檢核與修正：**

```bash
gh release view v{VERSION} --json body
gh release view v{VERSION} --web
```

若格式跑掉，修正 `release-notes.md` 後重新更新：

```bash
gh release edit v{VERSION} -F release-notes.md
```

#### 5.6 清理 Cleanup

```bash
# 驗證發布連結可存取
gh release view v{VERSION} --web
```

## 檢查清單 Checklist

### 等待 Review 階段（阻塞型）

- [ ] 若尚未配置，使用 `gh pr edit --add-reviewer copilot-pull-request-reviewer` 請求 Copilot Review
- [ ] 執行輪詢腳本等待 review 完成（不可跳過）
- [ ] Review 狀態已確認（APPROVED / CHANGES_REQUESTED）

> ❌ **禁止跳過**：未取得 Copilot Review 結果不得進入 Phase 1。

### Code Review 階段

- [ ] 讀取所有 PR review 評論
- [ ] 評估每條建議並記錄理由
- [ ] 完成採納建議的程式碼修正
- [ ] 測試通過

### 程式碼簡化階段（阻塞型）

- [ ] 已識別所有變更的 TS/JS 檔案
- [ ] 已執行 code-simplifier 技能
- [ ] 無不必要的巢狀結構
- [ ] 無冗餘程式碼和抽象
- [ ] 變數和函式命名清晰
- [ ] 無描述顯而易見程式碼的註解
- [ ] 測試通過且功能不變
- [ ] 簡化變更已提交

### Git 操作階段

- [ ] 變更已提交並推送
- [ ] PR 已 squash merge
- [ ] 主分支已同步
- [ ] 功能分支已刪除（本地 + 遠端）
- [ ] 已清理其他舊的已合併分支

### 發布階段

- [ ] 版本號已更新
- [ ] CHANGELOG.md 已更新（雙語）
- [ ] 所有測試通過
- [ ] 成功建置打包 VSIX
- [ ] Git Annotated Tag 已建立並推送（使用 `git tag -a`）
- [ ] **GitHub Release 已建立**（使用 `gh release create`）
- [ ] **Release 含雙語說明與 VSIX 附件**
- [ ] **Release 版面檢核完成（必要時已修正）**
- [ ] 發布連結可存取（使用 `gh release view` 驗證）

## 輸出格式 Output Format

完成後提供執行摘要：

```markdown
## 執行摘要 Execution Summary

| 項目             | 狀態                            |
| ---------------- | ------------------------------- |
| Code Review 評估 | ✅ 完成（採納 X 條，忽略 Y 條） |
| 程式碼修正       | ✅/⏭️ 完成/無需修正             |
| PR 合併          | ✅ Squash merged                |
| 版本更新         | ✅ vX.Y.Z                       |
| 發布             | ✅ 完成                         |

### 變更檔案 Changed Files

- `package.json`
- `CHANGELOG.md`
- ...

### 發布連結 Release Link

https://github.com/{owner}/{repo}/releases/tag/v{VERSION}
```

## 相關資源 Related Resources

- [語意化版本規範](https://semver.org/lang/zh-TW/)
- [Keep a Changelog](https://keepachangelog.com/zh-TW/)
- [git-workflow 技能](../git-workflow/SKILL.md) - 從 commit 到 PR 建立（自動觸發本技能）
- [code-simplifier 技能](../code-simplifier/SKILL.md) - 程式碼簡化與重構（阻塞型）
