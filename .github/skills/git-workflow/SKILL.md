---
name: git-workflow
description: Git 工作流程自動化技能。當使用者提到 commit、push、建立 PR、pull request、提交程式碼、推送分支時自動啟用。包含自動生成 Conventional Commits 格式訊息、一鍵建立 PR 等功能。靈感來源於 Anthropic 官方 commit-commands plugin。Automates Git workflow including commit message generation, branch push, and PR creation. Inspired by Anthropic's official commit-commands plugin.
metadata:
    author: singular-blockly
    version: '1.0.0'
    category: productivity
    inspired-by: anthropics/claude-code/plugins/commit-commands
license: Apache-2.0
---

# Git 工作流程技能 Git Workflow Skill

自動化開發過程中的 Git 操作，從 commit 到建立 PR 的完整流程。
Automates Git operations during development, from commit to PR creation.

## 核心原則 Core Principles

> **與 SDD 整合**：此技能處理「開發完成到 PR 建立」階段，PR 審查後的操作由 `pr-review-release` 技能處理。
> **SDD Integration**: This skill handles "development complete to PR creation" phase. Post-review operations are handled by `pr-review-release` skill.

## 適用情境 When to Use

-   完成功能開發，需要提交程式碼
-   準備建立 Pull Request
-   在 spec 分支（如 `016-esp32-wifi-mqtt`）工作時

## 與其他技能的分工 Skill Boundaries

| 階段             | 技能                      | 說明                                   |
| ---------------- | ------------------------- | -------------------------------------- |
| 開發中 → PR 建立 | **git-workflow** (本技能) | commit, push, 建立 PR                  |
| PR 審查後 → 發布 | `pr-review-release`       | 評估 review, merge, 清理分支, 版本發布 |

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
# Stage 變更
git add .
# 或選擇性 stage
git add -p

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

### Phase 2: 推送分支 Push Branch

```bash
# 推送到遠端（首次推送功能分支）
git push -u origin HEAD

# 後續推送
git push
```

**分支命名規範**（SDD 整合）：

-   Spec 分支：`{NNN}-feature-name`（如 `016-esp32-wifi-mqtt`）
-   修復分支：`fix/{issue-number}-description`
-   文件分支：`docs/{description}`

---

### Phase 3: 建立 Pull Request Create PR

#### 3.1 分析分支歷史

```bash
# 查看此分支相對於 master 的所有 commits
git log master..HEAD --oneline

# 查看變更的檔案清單
git diff master..HEAD --stat
```

#### 3.2 生成 PR 描述

**PR 描述模板**：

```markdown
## 變更摘要 Summary

{1-3 句描述主要變更}

## 相關 Spec Related Spec

-   Spec: `/specs/{NNN}-feature-name/spec.md`
-   Tasks: `/specs/{NNN}-feature-name/tasks.md`

## 變更類型 Type of Change

-   [ ] 🐛 Bug 修復 (non-breaking change which fixes an issue)
-   [ ] ✨ 新功能 (non-breaking change which adds functionality)
-   [ ] 💥 破壞性變更 (fix or feature that would cause existing functionality to change)
-   [ ] 📝 文件更新 (documentation only changes)

## 變更內容 Changes

-   {變更 1}
-   {變更 2}
-   {變更 3}

## 測試計劃 Test Plan

-   [ ] `npm run test` 通過
-   [ ] `npm run lint` 通過
-   [ ] `npm run compile` 成功
-   [ ] 手動測試：{測試項目}

## 螢幕截圖 Screenshots (if applicable)

{如有 UI 變更，附上截圖}
```

#### 3.3 建立 PR

```bash
# 使用 GitHub CLI 建立 PR
gh pr create --title "feat(scope): description" --body-file pr-description.md

# 或互動式建立
gh pr create

# 指定 reviewer（選用）
gh pr create --reviewer username1,username2
```

#### 3.4 檢查 PR 狀態

```bash
# 查看目前 PR
gh pr view

# 查看 CI 檢查狀態
gh pr checks
```

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

3. **開發完成**：使用本技能建立 PR

4. **Review 後**：使用 `pr-review-release` 技能處理 merge 和發布

### Commit Message 與 Task 關聯

```bash
# 關聯 tasks.md 中的任務編號
git commit -m "feat(generators): [T032] implement WiFi connect generator with 10s timeout"

# 多任務完成
git commit -m "feat(i18n): [T072-T086] add translations for all 15 languages"
```

---

## 快速指令 Quick Commands

### 一鍵 Commit + Push

```bash
# 分析變更並提交
git add .
git commit -m "$(git diff --cached --stat | head -1 | sed 's/^ //')"
git push
```

### 一鍵建立 PR

```bash
# 從目前分支建立 PR 到 master
gh pr create --fill --base master
```

---

## 檢查清單 Checklist

### Commit 前 Before Commit

-   [ ] 變更已通過 `npm run lint`
-   [ ] 變更已通過 `npm run test`
-   [ ] 變更已通過 `npm run compile`
-   [ ] Commit message 符合 Conventional Commits 格式
-   [ ] Scope 正確反映變更範圍

### 建立 PR 前 Before PR Creation

-   [ ] 分支已推送到遠端
-   [ ] PR 描述清楚說明變更內容
-   [ ] 已關聯相關 Spec（如適用）
-   [ ] 測試計劃已列出

### PR 建立後 After PR Creation

-   [ ] CI 檢查通過
-   [ ] 等待 Code Review
-   [ ] **→ Review 完成後使用 `pr-review-release` 技能**

---

## 相關資源 Related Resources

-   [Anthropic commit-commands plugin](https://github.com/anthropics/claude-code/tree/main/plugins/commit-commands) - 本技能靈感來源
-   [Conventional Commits 規範](https://www.conventionalcommits.org/zh-hant/)
-   [GitHub CLI 文件](https://cli.github.com/manual/)
-   [pr-review-release 技能](../pr-review-release/SKILL.md) - PR 審查後的下一步
