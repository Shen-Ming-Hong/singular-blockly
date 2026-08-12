# 依賴升級規格

> 整合自 specs/005-009（安全依賴更新系列）

## 概述

**目標**：透過五階段漸進式升級策略，將專案依賴現代化

**狀態**：✅ 完成

---

## 2026 Blockly 13 現代化升級（065）

| 套件 | 之前 | 之後 | 說明 |
|---|---:|---:|---|
| `blockly` | 12.3.1 | 13.2.1 | Thrasos、預設鍵盤／螢幕閱讀器支援、公開 dialog／ShortcutRegistry、ARIA API |
| `@blockly/theme-modern` | 7.0.1 | 13.2.0 | 與 Blockly 13 renderer/theme API 對齊 |
| Node.js engine | 未明確宣告 | >=22.16.0 | 與專案建置及 VS Code runtime 基準一致 |

主要相容性處理：

- `getVars()` 改用 `getVarModels()`；變數操作改走 `VariableMap`。
- 舊事件別名改用 `BLOCK_CREATE`、`BLOCK_CHANGE`、`BLOCK_MOVE`、`BLOCK_DELETE`。
- dynamic flyout、runtime shadow 與動態積木狀態以 JSON 表達；舊 XML 僅保留匯入 hooks。
- 移除 `WorkspaceSvg`、`FieldVariable`、`FieldInput`、flyout 與 renderer DOM 的 prototype/private 整合。
- editor／preview 明確使用 Thrasos、套件內 `media/` 與 15 個官方 core locale；切換語言時保存 JSON、重建 workspace 並支援失敗回滾。

驗證結果：v12 fixtures 4/4 通過，500-block load/save 中位數均優於 v12 基線，`npm audit` 為 0 vulnerabilities。完整設計與驗收紀錄位於 `specs/065-blockly-v13-modernization/`。

---

## 升級策略

採用五階段漸進式升級，依風險等級排序：

| 階段 | 規格 | 風險 | 描述                                 |
| ---- | ---- | ---- | ------------------------------------ |
| 1    | 005  | 低   | 安全依賴更新（TypeScript、測試框架） |
| 2    | 006  | 低   | 次要依賴更新（theme、types）         |
| 3    | 007  | 中   | 型別定義升級（VSCode、Node.js）      |
| 4    | 008  | 高   | 核心依賴升級（Blockly 12）           |
| 5    | 009  | 中   | 開發工具升級（ESLint、webpack-cli）  |

---

## Phase 1：安全依賴更新（005）

### 升級內容

| 套件                  | 之前   | 之後    | 風險 |
| --------------------- | ------ | ------- | ---- |
| typescript            | 5.7.2  | 5.9.3   | 低   |
| @typescript-eslint/\* | 8.19.1 | 8.46.1  | 低   |
| sinon                 | 20     | 21      | 低   |
| webpack               | 5.97.1 | 5.102.1 | 低   |
| @vscode/test-electron | 2.4.1  | 2.5.2   | 低   |

### 成功標準

-   ✅ 190 測試全部通過
-   ✅ 覆蓋率維持 87.21%+
-   ✅ 編譯時間 ≤ 5s

---

## Phase 2：次要依賴更新（006）

### 升級內容

| 套件                  | 之前     | 之後     | 說明             |
| --------------------- | -------- | -------- | ---------------- |
| @blockly/theme-modern | 6.0.10   | 6.0.12   | 主題 bug 修復    |
| @types/node           | 20.17.12 | 20.19.22 | Node.js 型別修正 |

### 驗證重點

-   主題視覺外觀
-   Node.js API 型別準確性

---

## Phase 3：型別定義升級（007）

### 升級內容

| 套件            | 之前   | 之後    | 影響                   |
| --------------- | ------ | ------- | ---------------------- |
| @types/vscode   | 1.96.0 | 1.109.0 | **關鍵：Project Skills 支援基準** |
| @types/node     | 20.x   | 22.x    | ES2023 特性            |
| tsconfig target | ES2022 | ES2023  | 新語法支援             |

### 關鍵變更

`@types/vscode` 1.109.0 是目前 extension 與專案 Agent Skills 的最低支援基準。舊版外部 server API 與其 SDK 不再屬於產品相依；Node.js 仍只用於貢獻者建置、測試與封裝。

---

## Phase 4：核心依賴升級（008）🔴 高風險

### 升級內容

| 套件                  | 之前   | 之後   | 破壞性變更 |
| --------------------- | ------ | ------ | ---------- |
| blockly               | 11.2.2 | 12.3.1 | **是**     |
| @blockly/theme-modern | 6.0.12 | 7.0.1  | 是         |

### Blockly 12 破壞性變更

#### 1. 序列化系統

**變更**：JSON 序列化優先於 XML

**影響**：

-   有 mutation 的積木需新增 `saveExtraState` / `loadExtraState`
-   觸發 014 序列化修復

**解決方案**：

```javascript
// 同時實作兩種 hooks
Blockly.Blocks['encoder_setup'] = {
	// JSON 序列化（Blockly 12 優先使用）
	saveExtraState: function () {
		return { encoder: this.getFieldValue('ENCODER') };
	},
	loadExtraState: function (state) {
		this.setFieldValue(state.encoder, 'ENCODER');
	},

	// XML 序列化（向後相容）
	mutationToDom: function () {
		/* ... */
	},
	domToMutation: function (xml) {
		/* ... */
	},
};
```

#### 2. 主題系統

**變更**：@blockly/theme-modern 7.0.1 配合 Blockly 12

**驗證**：

-   Light/Dark 主題切換
-   積木顏色一致性
-   文字可讀性

#### 3. 工作區相容性

**需求**：Blockly 11 的 `main.json` 必須能載入

**測試**：

```typescript
test('應載入 Blockly 11 格式的 main.json', async () => {
	const oldFormat = loadFixture('blockly-11-workspace.json');
	const workspace = Blockly.serialization.workspaces.load(oldFormat);
	assert.ok(workspace);
});
```

---

## Phase 5：開發工具升級（009）

### 升級內容

| 套件                             | 之前   | 之後   | 說明           |
| -------------------------------- | ------ | ------ | -------------- |
| @typescript-eslint/eslint-plugin | 8.46.1 | 8.46.2 | Patch 修復     |
| ESLint ecmaVersion               | 2022   | 2023   | 配合 tsconfig  |
| webpack-cli                      | 5.1.4  | 6.0.1  | **Major 版本** |

### webpack-cli 6.x 注意事項

-   確認命令列參數相容
-   驗證 `npm run compile` 正常執行

---

## 升級流程 SOP

### 每次升級前

1. 建立功能分支
2. 備份 `package-lock.json`
3. 記錄當前測試狀態

### 升級步驟

```powershell
# 1. 更新套件
npm update <package-name>

# 2. 編譯驗證
npm run compile

# 3. 執行測試
npm test

# 4. 手動驗證
# - 開啟編輯器
# - 拖曳積木
# - 檢查程式碼生成
```

### 升級後

1. 更新 CHANGELOG
2. 提交 PR
3. 等待 CI 通過

---

## 版本對照表

### 升級前（v1.x）

```json
{
	"devDependencies": {
		"typescript": "5.7.2",
		"@types/vscode": "1.96.0",
		"@types/node": "20.17.12",
		"blockly": "11.2.2",
		"@blockly/theme-modern": "6.0.10",
		"webpack": "5.97.1",
		"webpack-cli": "5.1.4"
	}
}
```

### 升級後（v2.0）

```json
{
	"devDependencies": {
		"typescript": "5.9.3",
		"@types/vscode": "1.109.0",
		"@types/node": "22.x",
		"blockly": "12.3.1",
		"@blockly/theme-modern": "7.0.1",
		"webpack": "5.102.1",
		"webpack-cli": "6.0.1"
	}
}
```

---

## 經驗教訓

### 成功實踐

1. **漸進式升級**：避免一次性大量變更
2. **風險排序**：先低風險，後高風險
3. **持續測試**：每階段都執行完整測試

### 踩坑記錄

1. **Blockly 序列化**：升級 12.x 後才發現 mutation 積木問題
    - 教訓：主要版本升級前應詳讀 changelog
2. **型別不相容**：@types/node 22.x 與某些舊 API
    - 教訓：型別升級需同步更新使用方式

---

## 相關文件

-   package.json：`package.json`
-   TypeScript 配置：`tsconfig.json`
