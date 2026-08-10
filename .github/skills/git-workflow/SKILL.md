---
name: git-workflow
description: Git 工作流程自動化技能，涵蓋從 commit、本地 Codex Code Review、使用者發布核准到 PR 與發布的完整流程。當使用者提到 commit、push、建立 PR、pull request、提交程式碼、推送分支時自動啟用。Automates Git workflow from commit through local Codex review and explicit publish approval to PR and release. Inspired by Anthropic's official commit-commands plugin.
metadata:
    author: singular-blockly
    version: '2.0.0'
    category: productivity
    inspired-by: anthropics/claude-code/plugins/commit-commands
license: Apache-2.0
---

# Git 工作流程技能 Git Workflow Skill

自動化開發過程中的 Git 操作，從 commit 到建立 PR 的完整流程。
Automates Git operations during development, from commit to PR creation.

## 核心原則 Core Principles

> **端到端整合**：推送前先執行 `pr-review-release` 的本地 review、版本／雙語 CHANGELOG 準備、修正核准與發布核准。版本檔必須進入同一 PR；合併後只推送 annotated tag，由 Actions 發布唯一 VSIX。

## 適用情境 When to Use

- 完成功能開發，需要提交程式碼
- 準備建立 Pull Request
- 在 spec 分支（如 `016-esp32-wifi-mqtt`）工作時

## 與其他技能的分工 Skill Boundaries

| 階段                   | 技能                                   | 說明                                     |
| ---------------------- | -------------------------------------- | ---------------------------------------- |
| 開發完成 → 本地提交    | **git-workflow**（本技能）             | commit 與變更範圍確認                    |
| 本地審查 → 發布前核准  | `pr-review-release`                    | findings、修正、re-review 與兩次使用者 gate |
| 發布核准 → PR／Release | **git-workflow** + `pr-review-release` | push、建立 PR、合併與發布                |
| 程式碼簡化             | `code-simplifier`                      | push 前必須執行（阻塞型）                |

---

## 工作流程 Workflow

### Phase 1: 自動 Commit Auto Commit

根據變更內容自動生成符合 Conventional Commits 格式的 commit message。

#### 1.1 分析變更

```bash
# 查看所有變更（staged + unstaged）
git status

# 查看詳細差異
git diff
git diff --cached  # 已 staged 的變更
```

#### 1.2 生成 Commit Message

**Conventional Commits 格式**：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Type 類型**：

| Type       | 說明                           | 範例                                            |
| ---------- | ------------------------------ | ----------------------------------------------- |
| `feat`     | 新功能                         | `feat(wifi): add ESP32 WiFi connection blocks`  |
| `fix`      | Bug 修復                       | `fix(text): correct text_join type conversion`  |
| `docs`     | 文件更新                       | `docs(i18n): update Chinese translations`       |
| `style`    | 格式調整（不影響程式碼邏輯）   | `style: format with prettier`                   |
| `refactor` | 重構（不新增功能也不修復 bug） | `refactor(generator): simplify code generation` |
| `test`     | 測試相關                       | `test(fileService): add unit tests`             |
| `chore`    | 建置/工具/依賴更新             | `chore(deps): upgrade blockly to 12.3.1`        |

**Scope 範圍**（專案特定）：

| Scope        | 說明                                       |
| ------------ | ------------------------------------------ |
| `blocks`     | 積木定義 (`media/blockly/blocks/`)         |
| `generators` | 程式碼生成器 (`media/blockly/generators/`) |
| `i18n`       | 國際化 (`media/locales/`)                  |
| `webview`    | WebView 相關 (`media/js/`, `src/webview/`) |
| `mcp`        | MCP Server (`src/mcp/`)                    |
| `services`   | 服務層 (`src/services/`)                   |
| `toolbox`    | 工具箱 (`media/toolbox/`)                  |
| `deps`       | 依賴管理                                   |

#### 1.3 執行 Commit

```bash
# 先檢查範圍，再互動式或以明確檔案清單 stage
git status --short
git add -p
# git add path/to/file1 path/to/file2

# Commit
git commit -m "feat(scope): description"
```

#### 1.4 多次 Commit 策略

對於大型功能，建議分多次 commit：

```bash
# 範例：ESP32 WiFi/MQTT 功能
git commit -m "feat(blocks): add WiFi block definitions"
git commit -m "feat(generators): implement WiFi code generators"
git commit -m "feat(i18n): add WiFi block translations (15 languages)"
git commit -m "docs(toolbox): add WiFi blocks to communication category"
```

---

### Phase 2: 保持本地分支 Local Branch Only

此階段不得推送。先完成程式碼簡化、本地 Codex review、核准修正、驗證、re-review 與發布前核准；推送統一在 Phase 4 執行。

**分支命名規範**（SDD 整合）：

- Spec 分支：`{NNN}-feature-name`（如 `016-esp32-wifi-mqtt`）
- 修復分支：`fix/{issue-number}-description`
- 文件分支：`docs/{description}`

---

### Phase 2.5: 程式碼簡化（必須）Code Simplification (REQUIRED)

**⚠️ 阻塞型步驟：此步驟必須完成才能建立 PR。**

在建立 PR 前，**必須**使用 `code-simplifier` 技能檢查並簡化程式碼。
Before creating a PR, you **must** use the `code-simplifier` skill to check and simplify code.

**為何重要 Why Important**：

- 減少 Code Review 階段的修改建議
- 提升程式碼可讀性和維護性
- 確保符合專案程式碼風格
- 降低後續 token 消耗

**執行步驟 Execution Steps**：

1. **識別變更檔案**

    ```bash
    # 檢視此分支的所有變更檔案
    git diff master..HEAD --name-only | grep -E '\.(ts|js)$'
    ```

2. **執行程式碼簡化技能**
    - 閱讀 `code-simplifier` 技能文件
    - 對變更的 TS/JS 檔案執行簡化
    - 確保遵循專案 coding standards

3. **簡化完成標準**
    - [ ] 無不必要的巢狀結構
    - [ ] 無冗餘程式碼和抽象
    - [ ] 變數和函式命名清晰
    - [ ] 無描述顯而易見程式碼的註解
    - [ ] 測試通過且功能不變

4. **提交簡化變更（保持本地）**
    ```bash
    git status --short
    git add -p
    git commit -m "refactor: simplify code for PR readiness"
    ```

> 💡 **Agent 整合**：輸入「簡化程式碼」、「refactor」或 `@code-simplifier` 觸發技能。

> ❌ **禁止跳過**：未完成程式碼簡化不得進入 Phase 3 本地審查。

---

### Phase 3: 本地 Code Review 與核准 Local Review and Approval

**⚠️ 阻塞型步驟：必須完整執行 `pr-review-release` 的 Phase 0–3.5。**

1. 以 base branch 為基準，本地審查已提交與未提交差異。
2. 評估 findings，先取得使用者對修正方案的明確核准。
3. 只修正已核准項目，完成測試、`code-simplifier` 與本地 re-review。
4. 提交修正摘要、測試結果、殘餘風險與 re-review 結果。
5. 若要正式發布，先在分支完成核准的 SemVer、lockfile 與雙語 CHANGELOG，再通過本地 release 契約測試。
6. 取得使用者對 push、PR、merge、annotated tag 與 Actions CD 的另一次明確發布核准。

> ❌ 修正核准不等同發布核准；Phase 3.5 核准前不得 push 或建立 PR。

### Phase 4: 推送並建立 Pull Request Push and Create PR

**前置條件：`pr-review-release` Phase 3.5 的發布核准已明確取得。**

#### 4.1 推送分支

```bash
git push -u origin HEAD
```

#### 4.2 分析分支歷史並生成 PR 描述

```bash
git log master..HEAD --oneline
git diff master..HEAD --stat
```

**PR 描述模板**：

```markdown
## 變更摘要 Summary

{1-3 句描述主要變更}

## 相關 Spec Related Spec

- Spec: `/specs/{NNN}-feature-name/spec.md`
- Tasks: `/specs/{NNN}-feature-name/tasks.md`

## 變更類型 Type of Change

- [ ] 🐛 Bug 修復 (non-breaking change which fixes an issue)
- [ ] ✨ 新功能 (non-breaking change which adds functionality)
- [ ] 💥 破壞性變更 (fix or feature that would cause existing functionality to change)
- [ ] 📝 文件更新 (documentation only changes)

## 變更內容 Changes

- {變更 1}
- {變更 2}
- {變更 3}

## 測試計劃 Test Plan

- [ ] `npm run ci:static` 通過
- [ ] `npm run test:unit:ci` 通過
- [ ] 手動測試：{測試項目}

## 發布資訊 Release Metadata

- Version: `v{VERSION}`
- [ ] `package.json`、`package-lock.json` 與雙語 CHANGELOG 已包含在本 PR

## 螢幕截圖 Screenshots (if applicable)

{如有 UI 變更，附上截圖}
```

#### 4.3 建立 PR

```bash
# 使用 GitHub CLI 建立 PR
gh pr create --title "feat(scope): description" --body-file pr-description.md

# 或互動式建立
gh pr create

# 指定 reviewer（選用）
gh pr create --reviewer username1,username2
```

#### 4.4 檢查 PR 狀態

```bash
# 查看目前 PR
gh pr view

# 查看 CI 檢查狀態
gh pr checks
```

### Phase 5: 合併與發布 Merge and Release

PR 建立後沿用已核准範圍，執行 `pr-review-release` Phase 4–5：確認 `CI Gate`、CodeQL、發布擁有者在 Phase 3.5 的明確核准與對話已解決，squash merge 後推送 annotated tag，等待 Actions 發布並驗證 GitHub Release、VS Code Marketplace、Open VSX 與 SHA-256。

不得在合併後直接修改 `master` 的版本或 CHANGELOG；不得本機建立正式 VSIX 或執行 `gh release create`。

若 PR 或 CI 出現新的實質 findings，回到 `pr-review-release` 的評估與使用者核准 gate，不得自行擴大修正範圍。

---

## SDD 整合指南 SDD Integration Guide

### 在 Spec 分支工作時

1. **開發前**：確認 spec 文件齊全

    ```bash
    ls specs/{NNN}-feature-name/
    # 應有：spec.md, plan.md, tasks.md, research.md, data-model.md
    ```

2. **開發中**：按 tasks.md 的 Phase 順序 commit

    ```bash
    git commit -m "feat(blocks): [T025] implement esp32_wifi_connect block"
    ```

3. **開發完成**：使用本技能執行本地 Codex review、修正與 re-review

4. **發布核准**：版本與雙語 CHANGELOG 已在分支後，使用者明確核准才 push、建立 PR、merge、建立 tag 和觸發 CD

### Commit Message 與 Task 關聯

```bash
# 關聯 tasks.md 中的任務編號
git commit -m "feat(generators): [T032] implement WiFi connect generator with 10s timeout"

# 多任務完成
git commit -m "feat(i18n): [T072-T086] add translations for all 15 languages"
```

---

## 快速指令 Quick Commands

### 本地 Commit

```bash
git status --short
git add -p
git commit -m "feat(scope): 繁體中文變更摘要"
```

### 發布核准後推送並建立 PR

```bash
git push -u origin HEAD
gh pr create --fill --base master
```

---

## 檢查清單 Checklist

### Commit 前 Before Commit

- [ ] 變更已通過 `npm run lint`
- [ ] 變更已通過 `npm run test`
- [ ] 變更已通過 `npm run compile`
- [ ] Commit message 符合 Conventional Commits 格式
- [ ] Scope 正確反映變更範圍

### 程式碼簡化階段（阻塞型）Before Code Simplification

- [ ] 已識別所有變更的 TS/JS 檔案
- [ ] 已執行 code-simplifier 技能
- [ ] 無不必要的巢狀結構
- [ ] 無冗餘程式碼和抽象
- [ ] 變數和函式命名清晰
- [ ] 無描述顯而易見程式碼的註解
- [ ] 測試通過且功能不變
- [ ] 簡化變更已提交於本地

### 建立 PR 前 Before PR Creation

- [ ] **程式碼簡化已完成（必須）**
- [ ] 本地 Codex review、修正核准與 re-review 已完成
- [ ] 版本、lockfile 與雙語 CHANGELOG 已在分支內（若發布）
- [ ] `npm run release:prepare` 已通過（若發布）
- [ ] 使用者已明確核准 push、PR、merge、annotated tag 與 Actions CD
- [ ] 分支已在發布核准後推送到遠端
- [ ] PR 描述清楚說明變更內容
- [ ] 已關聯相關 Spec（如適用）
- [ ] 測試計劃已列出

### PR 建立後 After PR Creation

- [ ] `CI Gate` 與 CodeQL 通過
- [ ] 發布擁有者已在 Phase 3.5 明確核准且 review 對話已解決
- [ ] PR 差異與本地核准範圍一致
- [ ] 若 CI／人工 review 出現新 findings，已回到使用者核准 gate
- [ ] 已執行 `pr-review-release` Phase 4–5

### 發布階段 Release Phase

- [ ] 本地 findings 已評估、核准並處理
- [ ] 程式碼修正已完成（如需）
- [ ] 程式碼簡化已完成（阻塞型）
- [ ] 版本號與雙語 CHANGELOG 已在 PR 合併前更新
- [ ] PR 已 Squash Merge，未直接提交 `master`
- [ ] Annotated Git Tag 已建立並驗證為 `tag`
- [ ] GitHub Actions 發布 workflow 已成功
- [ ] GitHub Release、Marketplace 與 Open VSX 版本一致
- [ ] Release VSIX 的 SHA-256 已驗證

---

## 相關資源 Related Resources

- [Anthropic commit-commands plugin](https://github.com/anthropics/claude-code/tree/main/plugins/commit-commands) - 本技能靈感來源
- [Conventional Commits 規範](https://www.conventionalcommits.org/zh-hant/)
- [GitHub CLI 文件](https://cli.github.com/manual/)
- [pr-review-release 技能](../pr-review-release/SKILL.md) - 本地審查、使用者核准與發布流程
- [code-simplifier 技能](../code-simplifier/SKILL.md) - PR 前程式碼簡化（必須）
