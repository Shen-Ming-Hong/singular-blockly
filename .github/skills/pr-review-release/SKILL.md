---
name: pr-review-release
description: PR Code Review 評估與完整發布流程。當使用者提到 code review、PR 審查、review 建議處理、merge PR、發布版本、release、squash merge、版本標籤時自動啟用。包含評估 Copilot/人工 review 建議、程式碼修正、Git 合併、語意化版本更新、CHANGELOG、打包發布的完整工作流程。PR review evaluation and release workflow for processing code review comments, merging PRs, semantic versioning, and publishing releases.
metadata:
    author: singular-blockly
    version: '1.0.0'
    category: release
license: Apache-2.0
---

# PR Code Review 評估與發布流程 PR Review & Release Workflow

以專案開發者角度評估 PR Code Review，並執行完整發布流程。
Evaluate PR code reviews from a project developer's perspective and execute the complete release workflow.

## 適用情境 When to Use

-   需要處理 PR 上的 code review 建議
-   評估 Copilot review 或人工審查意見
-   合併 PR 後需要發布新版本
-   執行完整的發布流程（版本號、CHANGELOG、標籤、Release）
-   需要 squash merge 並清理分支

## 工作流程 Workflow

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

### Phase 3: Git 操作 Git Operations

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
    ```

4. **清理分支**
    ```bash
    # 刪除本地功能分支（若尚未刪除）
    git branch -d feature-branch-name
    ```

### Phase 4: 發布流程 Release Process

按照專案憲法（constitution.md）或發布規範執行：

#### 4.1 版本管理 Version Management

1. **決定版本號**（遵循語意化版本）

    - `patch`: Bug 修復、小改進 (0.0.X)
    - `minor`: 新功能、向後相容 (0.X.0)
    - `major`: 破壞性變更 (X.0.0)

2. **更新 package.json**

    ```bash
    npm version patch  # 或 minor / major
    ```

3. **更新 CHANGELOG.md**
    - 新增雙語條目（中英文）
    - 格式遵循 Keep a Changelog

#### 4.2 品質驗證 Quality Verification

```bash
# 完整測試
npm test

# Lint 檢查
npm run lint

# 建置驗證
npm run compile
```

#### 4.3 建置與打包 Build & Package

```bash
# 生產建置
npm run package

# 打包 VSIX（若為 VS Code 擴充功能）
npx @vscode/vsce package
```

#### 4.4 Git 標籤 Git Tagging

```bash
# 建立版本標籤
git tag -a v{VERSION} -m "Release v{VERSION}"

# 推送標籤
git push origin v{VERSION}
```

#### 4.5 GitHub Release

```bash
# 建立 Release（含雙語說明）
gh release create v{VERSION} \
  --title "v{VERSION}" \
  --notes-file RELEASE_NOTES.md \
  *.vsix
```

#### 4.6 清理 Cleanup

```bash
# 刪除臨時檔案
rm -f RELEASE_NOTES.md

# 驗證發布連結
gh release view v{VERSION} --web
```

## 檢查清單 Checklist

### Code Review 階段

-   [ ] 讀取所有 PR review 評論
-   [ ] 評估每條建議並記錄理由
-   [ ] 完成採納建議的程式碼修正
-   [ ] 測試通過

### Git 操作階段

-   [ ] 變更已提交並推送
-   [ ] PR 已 squash merge
-   [ ] 功能分支已刪除
-   [ ] 主分支已同步

### 發布階段

-   [ ] 版本號已更新
-   [ ] CHANGELOG.md 已更新
-   [ ] 所有測試通過
-   [ ] 成功建置打包
-   [ ] Git 標籤已建立並推送
-   [ ] GitHub Release 已發布
-   [ ] 發布連結可存取

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

-   `package.json`
-   `CHANGELOG.md`
-   ...

### 發布連結 Release Link

https://github.com/{owner}/{repo}/releases/tag/v{VERSION}
```

## 相關資源 Related Resources

-   [專案憲法](../../../.specify/memory/constitution.md)（若存在）
-   [語意化版本規範](https://semver.org/lang/zh-TW/)
-   [Keep a Changelog](https://keepachangelog.com/zh-TW/)
