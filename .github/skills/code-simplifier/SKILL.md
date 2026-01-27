---
name: code-simplifier
description: 程式碼簡化與重構工作流程。當使用者提到簡化程式碼、清理 PR、重構、程式碼優化、code cleanup、refactor、simplify code、clean up complex code 時自動啟用。靈感來源於 Anthropic Claude Code 團隊內部使用的 code-simplifier agent。A code simplification and refactoring workflow. Inspired by the official code-simplifier agent used internally by the Claude Code team at Anthropic.
metadata:
    author: singular-blockly
    version: '1.1.0'
    category: code-quality
    type: blocking
    inspired-by: anthropics/claude-plugins-official/code-simplifier
---

# 程式碼簡化技能 Code Simplifier Skill

簡化與精煉程式碼以提升清晰度、一致性和可維護性，同時完整保留原有功能。
Simplifies and refines code for clarity, consistency, and maintainability while preserving all functionality.

> **⚠️ 阻塞型技能 BLOCKING SKILL**
>
> 此技能是 PR 發布流程中的**必須步驟**，非可選的建議型。
> 在 `pr-review-release` 流程中，必須完成此技能才能進入 Git 操作階段。
>
> This skill is a **REQUIRED step** in the PR release workflow, not an optional suggestion.
> In `pr-review-release` workflow, this skill must be completed before proceeding to Git operations.

## 核心原則 Core Principles

> **黃金法則**：永遠不改變程式碼的行為，只改變實現方式。
> **Golden Rule**: Never change what the code does - only how it does it.

## 適用情境 When to Use

- 完成一個長時間的 coding session 後，需要清理程式碼
- 在建立 Pull Request 之前，確保程式碼品質
- 複雜重構完成後，需要統一程式碼風格
- AI 生成的程式碼需要審查和優化
- 發現程式碼過於複雜或難以維護

## 工作流程 Workflow

### Phase 1: 識別範圍 Identify Scope

1. **確認要簡化的程式碼範圍**
    - 預設：只處理最近修改的檔案
    - 可指定：特定檔案、目錄或整個專案

2. **取得最近變更的檔案** (如需)
    ```bash
    git diff --name-only HEAD~5
    # 或查看未提交的變更
    git diff --name-only
    ```

### Phase 2: 分析程式碼 Analyze Code

1. **遵循專案標準** (Project Standards)
    - 閱讀專案的 `CLAUDE.md`、`copilot-instructions.md` 或 `.editorconfig`
    - 遵循已建立的 coding standards 和 patterns
    - 對於本專案，參考 `.github/copilot-instructions.md` 中的規範

2. **識別簡化機會**
    - 不必要的複雜度和巢狀結構
    - 冗餘的程式碼和抽象層
    - 命名不清晰的變數和函式
    - 過度聰明的解決方案
    - 可合併的相關邏輯

### Phase 3: 應用簡化 Apply Simplifications

套用以下五大簡化原則：

#### 1. 保留功能 Preserve Functionality

- 永遠不改變程式碼的行為
- 所有原始功能、輸出和副作用必須保持不變
- 如果函式返回特定值、處理特定邊界情況，這些都必須維持

#### 2. 遵循專案標準 Apply Project Standards

對於本專案 (singular-blockly)：

- 使用 ES modules 並正確排序 imports
- 頂層函式使用 `function` 關鍵字 (非 arrow functions)
- 為頂層函式加入明確的 return type annotations
- React 元件使用明確的 Props types
- 正確的錯誤處理模式 (盡量避免 try/catch)
- 一致的命名慣例

#### 3. 提升清晰度 Enhance Clarity

```typescript
// ❌ 避免：巢狀三元運算子
const result = a ? (b ? x : y) : c ? z : w;

// ✅ 改用：switch 或 if/else
if (a && b) {
	return x;
} else if (a) {
	return y;
} else if (c) {
	return z;
} else {
	return w;
}
```

- 減少不必要的複雜度和巢狀
- 消除冗餘程式碼和抽象
- 透過清晰的變數和函式名稱提升可讀性
- 合併相關邏輯
- 移除描述明顯程式碼的多餘註解

#### 4. 保持平衡 Maintain Balance

**避免過度簡化**：

- ❌ 不要降低程式碼清晰度或可維護性
- ❌ 不要創造過度聰明、難以理解的解決方案
- ❌ 不要將太多關注點合併到單一函式或元件
- ❌ 不要移除有助於程式碼組織的抽象層
- ❌ 不要為了「更少行數」犧牲可讀性
- ❌ 不要讓程式碼變得更難除錯或擴展

**選擇清晰而非簡潔**：

```typescript
// ❌ 過於緊湊
const process = d => d.filter(x => x.v > 0).map(x => x.v * 2);

// ✅ 明確易讀
function processPositiveValues(data: DataItem[]): number[] {
	const positiveItems = data.filter(item => item.value > 0);
	return positiveItems.map(item => item.value * 2);
}
```

#### 5. 專注範圍 Focus Scope

- 預設只精煉最近修改或本次 session 中處理過的程式碼
- 除非明確指示，否則不主動審查更廣的範圍

### Phase 4: 驗證變更 Verify Changes

1. **執行測試確保功能不變**

    ```bash
    npm run test
    ```

2. **執行 linting 確保風格一致**

    ```bash
    npm run lint
    # 或
    npx eslint . --fix
    ```

3. **執行 build 確保沒有編譯錯誤**

    ```bash
    npm run compile
    # 或
    npm run package
    ```

4. **審查變更**
    ```bash
    git diff
    ```

### Phase 5: 提交變更 Commit Changes

1. **分階段提交** (如有多個簡化類型)

    ```bash
    git add -p  # 互動式選擇要提交的變更
    ```

2. **使用 Conventional Commits 格式**
    ```bash
    git commit -m "refactor: simplify {component/module} for better readability"
    git commit -m "style: apply consistent naming conventions"
    git commit -m "refactor: reduce nesting in {function}"
    ```

## 簡化模式參考 Simplification Patterns

### 減少巢狀 Reduce Nesting

```typescript
// ❌ 深層巢狀
function process(data) {
	if (data) {
		if (data.items) {
			if (data.items.length > 0) {
				return data.items.map(i => i.value);
			}
		}
	}
	return [];
}

// ✅ 早期返回 (Guard Clauses)
function process(data) {
	if (!data?.items?.length) {
		return [];
	}
	return data.items.map(item => item.value);
}
```

### 提取有意義的變數 Extract Meaningful Variables

```typescript
// ❌ 難以理解
if (user.age >= 18 && user.country === 'TW' && user.verified && !user.banned) {
	allowAccess();
}

// ✅ 自文件化
const isAdult = user.age >= 18;
const isFromTaiwan = user.country === 'TW';
const isVerifiedUser = user.verified && !user.banned;

if (isAdult && isFromTaiwan && isVerifiedUser) {
	allowAccess();
}
```

### 簡化條件邏輯 Simplify Conditionals

```typescript
// ❌ 重複的條件
if (type === 'A') {
	return handleA();
} else if (type === 'B') {
	return handleB();
} else if (type === 'C') {
	return handleC();
} else {
	return handleDefault();
}

// ✅ 使用物件映射
const handlers = {
	A: handleA,
	B: handleB,
	C: handleC,
};
return (handlers[type] || handleDefault)();
```

### 移除不必要的註解 Remove Unnecessary Comments

```typescript
// ❌ 描述顯而易見的事情
// Increment counter by 1
counter++;

// ✅ 只在需要時註解（解釋為什麼，而非什麼）
// Rate limit: max 100 requests per minute per user
counter++;
```

## 檢查清單 Checklist

### 開始前 Before Starting

- [ ] 確認要簡化的程式碼範圍
- [ ] 閱讀專案的 coding standards (copilot-instructions.md)
- [ ] 確保 git 工作目錄乾淨或已提交重要變更

### 簡化過程 During Simplification

- [ ] 保留所有原有功能（黃金法則）
- [ ] 遵循專案既有的 coding patterns
- [ ] 選擇清晰而非簡潔
- [ ] 避免巢狀三元運算子
- [ ] 使用有意義的變數和函式名稱
- [ ] 移除冗餘的程式碼和抽象
- [ ] 移除描述顯而易見程式碼的註解

### 完成後 After Completion

- [ ] 所有測試通過
- [ ] Linting 無錯誤
- [ ] Build 成功
- [ ] 審查 git diff 確認變更合理
- [ ] 使用 Conventional Commits 格式提交

## Token 效益 Token Efficiency Benefit

簡化程式碼的額外好處：**減少未來 session 的 token 消耗**。

- 簡潔的程式碼在 context window 中佔用更少空間
- Claude 可以在相同 token 預算內閱讀更多程式碼
- 後續的 AI 輔助開發成本更低

> 有開發者報告使用 code-simplifier 後，token 消耗減少 20-30%。

## 相關資源 Related Resources

- [Anthropic Claude Plugins - code-simplifier](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier) - 原始靈感來源
- [Building Effective AI Agents](https://www.anthropic.com/research/building-effective-agents) - Anthropic 的 agent 建構指南
- [ESLint Rules](https://eslint.org/docs/rules/) - JavaScript/TypeScript linting 規則參考
