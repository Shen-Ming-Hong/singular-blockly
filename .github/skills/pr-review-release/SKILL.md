---
name: pr-review-release
description: 本地 Codex Code Review 評估、使用者核准與完整發布流程。當使用者提到 code review、PR 審查、review 建議處理、merge PR、發布版本、release、squash merge、版本標籤時自動啟用。包含本地差異審查、findings 採納評估、使用者審核 gate、程式碼修正、Git 合併、語意化版本更新、CHANGELOG、打包發布的完整工作流程。Local Codex review, user approval, and release workflow for reviewing branch diffs, evaluating findings, merging PRs, semantic versioning, and publishing releases.
metadata:
    author: singular-blockly
    version: '1.8.0'
    category: release
license: Apache-2.0
---

# PR Code Review 評估與發布流程 PR Review & Release Workflow

以專案開發者角度評估 PR Code Review，並執行完整發布流程。
Evaluate PR code reviews from a project developer's perspective and execute the complete release workflow.

## 適用情境 When to Use

- 需要處理 PR 上的 code review 建議
- 執行本地 Codex code review 或評估人工審查意見
- 合併 PR 後需要發布新版本
- 執行完整的發布流程（版本號、CHANGELOG、標籤、Release）
- 需要 squash merge 並清理已合併的分支
- 定期清理已合併到 master 的舊本地分支

## 工作流程 Workflow

### Phase 0: 本地 Codex Code Review（必須）Local Codex Review (REQUIRED)

**⚠️ 阻塞型步驟：此步驟必須完成才能進入 Code Review 評估階段。**

不發佈 PR、不等待遠端 reviewer，也不以遠端 review 是否完成作為流程條件。PR 已存在時仍審查本地 `HEAD`；PR 尚未建立時，先完成本地審查再進入推送或合併階段。

1. **確認審查基準與範圍**

    ```bash
    git status -sb
    git branch --show-current
    git merge-base origin/master HEAD
    git diff --stat origin/master...HEAD
    git diff --name-status origin/master...HEAD
    ```

    - 若 PR 明確指定其他 base，改用該 base。
    - 若功能分支包含已知的前置文件 commit，可將實作前 commit 指定為 review base，並在摘要中說明。
    - 納入尚未提交的工作區變更；不得因尚未建立 PR 而跳過 review。

2. **由 Codex 本地審查實際差異**

    - 對照需求、spec、contract 與架構規則檢查正確性。
    - 檢查錯誤、競態、狀態生命週期、邊界輸入、安全性、相容性及缺漏測試。
    - 閱讀完整相關函式與呼叫端，不只檢查 diff 片段或測試是否綠燈。
    - 執行與風險相稱的靜態檢查與聚焦測試；測試限制或既有失敗必須分開記錄。

3. **輸出本地 findings**

    - 依 `P0`、`P1`、`P2`、`P3` 嚴重度排序。
    - 每條 finding 必須包含可定位的檔案／行號、可重現情境、實際影響與判斷理由。
    - 沒有 finding 時明確寫「未發現阻擋問題」，並列出殘餘風險或未執行驗證。
    - Code Review 預設只讀；除非使用者同時要求修正，否則先回報 findings，不直接修改產品程式碼。

---

### Phase 1: Code Review 評估 Review Evaluation

1. **讀取 Phase 0 的本地 findings**；若已有人工 PR review，合併納入評估，但不得等待或要求遠端自動 review。

2. **評估每條 finding／建議**，以專業開發者角度判斷：

    | 判斷結果 | 標準                         | 範例                               |
    | -------- | ---------------------------- | ---------------------------------- |
    | ✅ 採納  | 真正有價值、能改善程式碼品質 | 修復潛在 bug、改善效能、增強可讀性 |
    | ❌ 忽略  | 基於錯誤理解或不符合專案架構 | 過度工程化、不了解上下文、風格偏好 |

3. **記錄評估結果**，清楚說明每條 finding／建議的採納或忽略理由。

### Phase 1.5: 使用者審核（必須）User Approval Gate (REQUIRED)

**⚠️ 阻塞型步驟：未取得使用者明確核准，不得修改產品程式碼或進入後續發布流程。**

1. 以表格向使用者提交每條 finding 的嚴重度、採納／忽略判斷、理由、預計修改範圍及驗證方式。
2. 明確標示建議核准的方案及仍待決定的項目；不得把沉默、一般性的「繼續」或先前的發布要求推定為本次核准。
3. 等待使用者明確核准全部方案，或指定核准／拒絕的 finding ID。
4. 只處理已核准項目；拒絕或未決項目保持不變並記錄理由。

> ❌ **禁止跳過**：取得核准前，不得進入 Phase 2、push、建立／更新 PR、merge、更新版本、建立 tag 或發布 Release。

### Phase 2: 程式碼修正 Code Fixes

若有使用者核准採納的建議：

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

### Phase 3.5: 發布前核准（必須）Pre-Publish Approval (REQUIRED)

修正與測試完成後，先向使用者提交變更摘要、測試結果、殘餘風險與本地 re-review 結果。只有使用者明確核准發布，才能 push、建立／更新 PR、merge 或進入 release；修正核准不自動等同發布核准。

### Phase 4: Git 操作 Git Operations

**前置條件：Phase 3.5 的發布核准已明確取得。**

1. **提交變更**（若有修正）

    ```bash
    git add .
    git commit -m "fix: address code review feedback"
    ```

2. **推送並合併**

    ```bash
    # 推送到功能分支
    git push origin HEAD

    # Squash merge PR（--delete-branch 會自動刪除遠端分支）
    gh pr merge --squash --delete-branch
    ```

    **Agent 使用 MCP 工具合併時**：`mcp_github_merge_pull_request` 不會自動刪除遠端分支，必須在步驟 4 手動刪除。

3. **同步主分支**

    ```bash
    git checkout master
    git pull origin master
    git status -sb
    ```

    確認主分支已同步且工作目錄乾淨，再進入發布流程。

4. **清理已合併分支 Branch Cleanup**

    ```bash
    # 刪除遠端功能分支（若未被 --delete-branch 自動刪除）
    git push origin --delete feature-branch-name

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

```powershell
# 移除 VSIX 安裝包（必須執行！）
Remove-Item -Force singular-blockly-{VERSION}.vsix

# 移除暫時發布說明檔（若未在 5.5 步驟中移除）
Remove-Item -Force release-notes.md -ErrorAction SilentlyContinue

# 驗證發布連結可存取
gh release view v{VERSION} --web
```

> ⚠️ **必須移除 VSIX**：VSIX 是建置產物，不應留在工作目錄中。GitHub Release 已附加此檔案，本地保留無意義且會造成混亂。

## 檢查清單 Checklist

### 本地 Codex Review 階段（阻塞型）

- [ ] 已確認 review base、HEAD、工作區狀態與完整差異範圍
- [ ] 已對照 spec／contract／架構檢查所有變更的執行路徑
- [ ] 已完成正確性、回歸、邊界、安全與測試覆蓋審查
- [ ] findings 已依 P0–P3 排序並附檔案／行號；若無 finding，已記錄殘餘風險

> ❌ **禁止跳過**：未完成本地 Codex review 不得進入 Phase 1；不需要等待 Copilot 或其他遠端 reviewer。

### Code Review 階段

- [ ] 讀取所有本地 findings 與現有人工 review 評論
- [ ] 評估每條 finding／建議並記錄理由
- [ ] 已向使用者提交採納判斷、修改範圍與驗證方式
- [ ] 使用者已明確核准要處理的 finding ID
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

### 發布前核准階段（阻塞型）

- [ ] 已提交修正摘要、測試結果、殘餘風險與本地 re-review 結果
- [ ] 使用者已明確核准 push、PR、merge 與 release 的後續範圍

### Git 操作階段

- [ ] 變更已提交並推送
- [ ] PR 已 squash merge
- [ ] 主分支已同步
- [ ] **遠端功能分支已刪除**（`git push origin --delete` 或 `--delete-branch`）
- [ ] 本地功能分支已刪除（`git branch -d`）
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
- [ ] **本地 VSIX 已移除**（`Remove-Item singular-blockly-{VERSION}.vsix`）
- [ ] **release-notes.md 已移除**（若有使用）

## 輸出格式 Output Format

完成後提供執行摘要：

```markdown
## 執行摘要 Execution Summary

| 項目             | 狀態                            |
| ---------------- | ------------------------------- |
| Code Review 評估 | ✅ 完成（採納 X 條，忽略 Y 條） |
| 使用者審核       | ✅ 已核准 findings：...          |
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
