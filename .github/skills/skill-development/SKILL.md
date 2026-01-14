---
name: skill-development
description: 開發新 Agent Skills 的標準化工作流程。當使用者要求建立新技能、轉化工作流程為技能、或詢問 SKILL.md 格式時自動啟用。包含技能結構設計、YAML frontmatter 規範、觸發關鍵字最佳實踐、資源檔案組織。A meta-skill for creating new Agent Skills with standardized workflow, SKILL.md format specification, trigger keyword design, and resource organization best practices.
metadata:
    author: singular-blockly
    version: '1.0.0'
    category: meta
license: Apache-2.0
---

# Agent Skill 開發技能 Skill Development Meta-Skill

開發新 Agent Skills 的標準化工作流程與最佳實踐。
A standardized workflow and best practices for developing new Agent Skills.

## 適用情境 When to Use

-   需要將重複性工作流程轉化為技能
-   建立新的專案特定技能
-   詢問 SKILL.md 格式規範
-   設計技能的觸發關鍵字
-   組織技能的輔助資源

## 技能結構規範 Skill Structure Specification

### 目錄結構 Directory Structure

```
.github/skills/{skill-name}/
├── SKILL.md                 # 必要：主要技能指令
├── references/              # 選用：參考文件
│   └── REFERENCE.md
├── scripts/                 # 選用：可執行腳本
│   └── helper.sh
├── assets/                  # 選用：範本和靜態資源
│   └── template.md
└── examples/                # 選用：使用範例
    └── example-1.md
```

### 命名規則 Naming Rules

| 規則          | 說明                   | 範例              |
| ------------- | ---------------------- | ----------------- |
| 小寫字母      | 只能使用 a-z           | ✅ `code-review`  |
| 連字號分隔    | 用 `-` 連接單字        | ✅ `security-fix` |
| 不能開頭/結尾 | 連字號不能在首尾       | ❌ `-my-skill-`   |
| 無連續連字號  | 不能有 `--`            | ❌ `my--skill`    |
| 長度限制      | 最多 64 字元           |                   |
| 目錄名稱一致  | 必須與 `name` 欄位相同 |                   |

## SKILL.md 格式規範 SKILL.md Format

### YAML Frontmatter（必要）

```yaml
---
name: skill-name # 必要：技能識別名稱
description: | # 必要：觸發描述（最多 1024 字元）
    中文描述。English description.
    包含關鍵字幫助 AI 決定何時載入。
metadata: # 選用：額外元資料
    author: your-name
    version: '1.0.0'
    category: category-name
license: Apache-2.0 # 選用：授權條款
compatibility: VS Code 1.108+ # 選用：環境需求
allowed-tools: Bash(git:*) Read # 選用：預先授權工具（實驗性）
---
```

### 關鍵欄位說明 Key Fields

#### `name` 欄位

-   **必要**，最多 64 字元
-   只能包含小寫字母、數字、連字號
-   必須與技能目錄名稱完全相同

#### `description` 欄位

-   **必要**，最多 1024 字元
-   這是 AI 決定是否載入技能的關鍵
-   應包含：
    -   技能功能描述
    -   適用情境
    -   觸發關鍵字（中英文）

### 內容主體 Body Content

````markdown
# 技能名稱 Skill Name

簡短描述。Brief description.

## 適用情境 When to Use

-   情境 1
-   情境 2

## 工作流程 Workflow

### Phase 1: 步驟名稱

1. 步驟說明
    ```bash
    command example
    ```
````

## 檢查清單 Checklist

-   [ ] 項目 1
-   [ ] 項目 2

## 相關資源 Related Resources

參考 [完整範本](./assets/full-skill-template.md)

````

## 設計最佳實踐 Design Best Practices

### 1. 觸發關鍵字設計 Trigger Keyword Design

**有效的 description 範例**：
```yaml
description: 修復 npm 依賴安全漏洞的完整工作流程。當使用者提到安全警告、Dependabot alerts、CVE 漏洞、npm audit 問題時自動啟用。
````

**關鍵字策略**：

-   包含中英文關鍵字
-   涵蓋同義詞（安全漏洞、security vulnerability、CVE）
-   描述具體使用情境
-   避免過於通用的詞彙

### 2. 漸進式揭露 Progressive Disclosure

技能應該分層載入以節省 context：

| 層級    | 內容                   | Token 預算    |
| ------- | ---------------------- | ------------- |
| Level 1 | `name` + `description` | ~100 tokens   |
| Level 2 | SKILL.md 完整內容      | < 5000 tokens |
| Level 3 | 輔助資源檔案           | 按需載入      |

**建議**：

-   SKILL.md 主體保持在 500 行以內
-   將詳細參考資料移至 `references/` 目錄
-   使用相對路徑連結資源

### 3. 雙語支援 Bilingual Support

本專案要求雙語文件：

```markdown
## 工作流程 Workflow

### Phase 1: 分析 Analysis

說明文字。
Description text.
```

### 4. 可操作性 Actionability

技能應該提供：

-   ✅ 具體的命令範例
-   ✅ 可複製的程式碼片段
-   ✅ 清晰的檢查清單
-   ✅ 範本檔案

### 5. 資源檔案組織 Resource Organization

| 目錄          | 用途           | 檔案類型                |
| ------------- | -------------- | ----------------------- |
| `references/` | 詳細技術文件   | `.md`                   |
| `scripts/`    | 可執行腳本     | `.sh`, `.py`, `.js`     |
| `assets/`     | 範本和靜態資源 | `.md`, `.json`, `.yaml` |
| `examples/`   | 使用範例       | `.md`                   |

## 開發工作流程 Development Workflow

### Step 1: 分析需求

1. 識別重複性工作流程
2. 列出所有步驟和決策點
3. 收集常用命令和範本

### Step 2: 設計結構

1. 決定技能名稱（遵循命名規則）
2. 撰寫觸發 description
3. 規劃目錄結構

### Step 3: 撰寫 SKILL.md

1. 建立 YAML frontmatter
2. 撰寫工作流程步驟
3. 加入命令範例和檢查清單

### Step 4: 建立輔助資源

1. 建立範本檔案
2. 撰寫參考文件
3. 新增腳本（如需要）

### Step 5: 驗證

```bash
# 驗證目錄結構
ls -la .github/skills/{skill-name}/

# 確認 SKILL.md 存在
cat .github/skills/{skill-name}/SKILL.md | head -20

# 驗證 YAML frontmatter（如有 skills-ref 工具）
skills-ref validate .github/skills/{skill-name}
```

### Step 6: 驗證連結 Link Verification

確保所有內部連結都指向有效的檔案：

1. **提取 SKILL.md 中的相對路徑連結**

    ```bash
    # 找出所有 Markdown 連結
    grep -oE '\[.+\]\(\./[^)]+\)' .github/skills/{skill-name}/SKILL.md
    ```

2. **驗證連結目標存在**

    ```bash
    # 檢查每個連結的目標檔案
    # 例如：./assets/template.md → 確認 assets/template.md 存在
    ls .github/skills/{skill-name}/assets/template.md
    ```

3. **常見連結問題**

    | 問題         | 說明                           | 解決方案                     |
    | ------------ | ------------------------------ | ---------------------------- |
    | 相對路徑錯誤 | `../../file.md` 層級計算錯誤   | 從 SKILL.md 位置重新計算路徑 |
    | 檔案不存在   | 連結指向未建立的檔案           | 建立檔案或移除連結           |
    | 大小寫不符   | `Template.md` vs `template.md` | 統一使用小寫檔名             |

4. **外部連結驗證**（選用）
    ```bash
    # 檢查外部連結是否可存取（需要網路）
    curl -s -o /dev/null -w "%{http_code}" https://example.com/page
    ```

## 範本 Templates

### 最小化技能範本 Minimal Skill Template

參考 [minimal-skill-template.md](./assets/minimal-skill-template.md)

### 完整技能範本 Full Skill Template

參考 [full-skill-template.md](./assets/full-skill-template.md)

## 檢查清單 Checklist

### 結構檢查

-   [ ] 技能目錄在 `.github/skills/` 下
-   [ ] 目錄名稱符合命名規則
-   [ ] SKILL.md 存在且格式正確

### Frontmatter 檢查

-   [ ] `name` 與目錄名稱一致
-   [ ] `description` 清楚且包含觸發關鍵字
-   [ ] `description` 不超過 1024 字元

### 內容檢查

-   [ ] 包含適用情境說明
-   [ ] 工作流程步驟清晰
-   [ ] 命令範例可執行
-   [ ] 雙語支援完整

### 資源檢查

-   [ ] 輔助檔案使用相對路徑連結
-   [ ] 範本檔案可直接使用
-   [ ] 無重複或冗餘內容

### 連結驗證 Link Verification

-   [ ] 所有內部相對路徑連結目標檔案存在
-   [ ] 連結路徑層級計算正確（`./`、`../`）
-   [ ] 外部連結 URL 格式正確
-   [ ] 無孤立連結（指向已刪除/移動的檔案）

## 相關連結 Related Links

-   [Agent Skills 官方文件](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
-   [Agent Skills 規範](https://agentskills.io/specification)
-   [Anthropic Skills 範例庫](https://github.com/anthropics/skills)
-   [Awesome Copilot Skills](https://github.com/github/awesome-copilot)
