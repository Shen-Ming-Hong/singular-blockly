# Research: 空 Workspace 防護機制

**Feature Branch**: `019-empty-workspace-guard`  
**Date**: 2025-12-25

## 研究目標

解析本功能所需的技術決策，包括：

1. WebView 端的拖曳狀態偵測機制
2. Blockly 序列化狀態的空值判斷方法
3. Extension 端的空狀態驗證邏輯
4. 覆寫前備份策略

---

## 1. WebView 端拖曳狀態追蹤

### 現有實作分析

位置：[blocklyEdit.js](../../media/js/blocklyEdit.js#L1409-L1510)

```javascript
// 拖動狀態追蹤：避免在拖動過程中執行昂貴的操作
let isDraggingBlock = false;

// 處理 BLOCK_DRAG 事件來追蹤拖動狀態
if (event.type === Blockly.Events.BLOCK_DRAG) {
	isDraggingBlock = event.isStart;
	// ...
}
```

### 決策

**採用現有的 `isDraggingBlock` 變數進行儲存攔截**

-   **理由**：現有程式碼已正確追蹤 `Blockly.Events.BLOCK_DRAG` 事件
-   **替代方案考慮**：新增獨立的狀態變數 → 拒絕，會造成狀態重複且維護困難
-   **實作位置**：修改 `saveWorkspaceState()` 函數開頭加入檢查

---

## 2. Blockly 序列化空狀態判斷

### Blockly 序列化格式分析

Blockly 12.x `Blockly.serialization.workspaces.save(workspace)` 的回傳格式：

```javascript
// 有方塊時
{
    blocks: {
        languageVersion: 0,
        blocks: [
            { type: "controls_if", id: "xxx", x: 100, y: 50, ... },
            { type: "math_number", id: "yyy", ... }
        ]
    },
    variables: [...],
    procedures: {...}
}

// 空工作區
{
    blocks: {
        languageVersion: 0,
        blocks: []
    }
}
```

### 現有空值檢查（spec 017）

位置：[blocklyEdit.js](../../media/js/blocklyEdit.js#L236-L246)

```javascript
const state = Blockly.serialization.workspaces.save(workspace);
if (!state || !state.blocks || !state.blocks.blocks || state.blocks.blocks.length === 0) {
	// 空工作區處理
}
```

### 決策

**複用 spec 017 的空值檢查邏輯**

-   **理由**：經過驗證的穩定方法，覆蓋多種邊界情況
-   **替代方案考慮**：使用 `workspace.getAllBlocks().length` → 部分拒絕
    -   `getAllBlocks()` 需要額外 API 呼叫，且結果可能與序列化不同步
    -   但作為雙重檢查可考慮保留

### 空值判斷函數提案

```javascript
/**
 * 判斷 Blockly 序列化狀態是否為空
 * @param {Object} state Blockly.serialization.workspaces.save() 的回傳值
 * @returns {boolean} true 表示狀態為空
 */
function isWorkspaceStateEmpty(state) {
	return !state || !state.blocks || !state.blocks.blocks || state.blocks.blocks.length === 0;
}
```

---

## 3. Extension 端空狀態驗證

### 現有實作分析

位置：[messageHandler.ts](../../src/webview/messageHandler.ts#L298-L325)

```typescript
private async handleSaveWorkspace(message: any): Promise<void> {
    try {
        // ...（目前沒有空狀態檢查）
        const cleanState = message.state ? JSON.parse(JSON.stringify(message.state)) : {};
        // 直接寫入檔案
        await this.fileService.writeJsonFile(mainJsonPath, saveData);
    }
}
```

### 決策

**在 `handleSaveWorkspace` 開頭新增空狀態驗證**

-   **理由**：作為第二層防護，即使 WebView 端失效仍能阻擋
-   **實作方式**：檢查 `message.state.blocks.blocks` 是否存在且非空
-   **替代方案考慮**：新增專用 middleware → 拒絕，增加複雜度且此功能範圍小

### 驗證邏輯提案

```typescript
private isEmptyWorkspaceState(state: any): boolean {
    return !state ||
           !state.blocks ||
           !state.blocks.blocks ||
           state.blocks.blocks.length === 0;
}

// 在 handleSaveWorkspace 開頭
if (this.isEmptyWorkspaceState(message.state)) {
    log('Rejected empty workspace save request', 'warn');
    return; // 靜默拒絕，不發送錯誤訊息給使用者
}
```

---

## 4. 覆寫前備份機制

### 現有備份機制分析

專案已有兩種備份機制：

1. **手動備份**：`blockly/backup/{name}.json`
2. **還原前自動備份**：`blockly/backup/auto_restore_YYYYMMDD_HHMMSS.json`

位置：[messageHandler.ts](../../src/webview/messageHandler.ts#L698-L708)

### FileService 可用方法

位置：[fileService.ts](../../src/services/fileService.ts)

-   `copyFile(src, dest)` - 可用於建立備份
-   `fileExists(path)` - 檢查檔案是否存在
-   `readFile(path)` - 讀取檔案內容（用於驗證非空）

### 決策

**使用 `.bak` 單檔備份而非多版本備份**

-   **理由**：
    -   符合 spec 需求「只保留一份」
    -   減少磁碟空間消耗
    -   簡化實作邏輯
-   **替代方案考慮**：
    -   多版本備份 (`main.json.bak.1`, `.bak.2`) → 拒絕，超出需求範圍
    -   備份到 `backup/` 目錄 → 拒絕，與現有手動備份混淆

### 備份邏輯提案

```typescript
// 在寫入 main.json 之前
const bakPath = path.join(blocklyDir, 'main.json.bak');
if (this.fileService.fileExists(mainJsonPath)) {
	// 檢查現有檔案是否有內容（非空）
	try {
		const existingContent = await this.fileService.readFile(mainJsonPath);
		const existingData = JSON.parse(existingContent);
		if (!this.isEmptyWorkspaceState(existingData.workspace)) {
			await this.fileService.copyFile(mainJsonPath, bakPath);
			log('Created backup: main.json.bak', 'debug');
		}
	} catch (e) {
		// 備份失敗不阻止儲存
		log('Failed to create backup', 'warn', e);
	}
}
```

---

## 5. 日誌層級規範

### 決策

| 場景                 | 層級    | 訊息範例                                  |
| -------------------- | ------- | ----------------------------------------- |
| 拖曳期間跳過儲存     | `info`  | 「跳過保存：正在拖曳」                    |
| 序列化返回空狀態     | `warn`  | 「跳過保存：工作區為空」                  |
| Extension 拒絕空狀態 | `warn`  | 「Rejected empty workspace save request」 |
| 成功建立 `.bak`      | `debug` | 「Created backup: main.json.bak」         |
| 備份失敗但繼續儲存   | `warn`  | 「Failed to create backup: {error}」      |

---

## 6. 邊界情況處理

### 新專案首次儲存

-   **行為**：`main.json` 不存在時，跳過備份直接建立新檔案
-   **實作**：在備份邏輯中使用 `fileExists()` 檢查

### 「清除全部」操作

-   **行為**：此情況不在本次修復範圍（spec 明確排除）
-   **未來考慮**：可新增 `allowEmpty` flag 標記合法的清空操作

### 磁碟空間不足

-   **行為**：備份失敗不阻止主檔案儲存
-   **實作**：try-catch 包裹備份邏輯，失敗時記錄 `warn` 並繼續

### `.bak` 檔案被手動刪除

-   **行為**：下次儲存時會重新建立
-   **實作**：每次儲存前都執行完整的備份流程，不依賴 `.bak` 存在

---

## 實作順序建議

1. **WebView 端**：修改 `saveWorkspaceState()` 加入拖曳檢查 + 空狀態檢查
2. **Extension 端**：修改 `handleSaveWorkspace()` 加入空狀態驗證
3. **備份機制**：在 `handleSaveWorkspace()` 寫入前加入備份邏輯

### 程式碼變更估計

| 檔案                            | 變更類型        | 預估行數 |
| ------------------------------- | --------------- | -------- |
| `media/js/blocklyEdit.js`       | 新增檢查邏輯    | ~15 行   |
| `src/webview/messageHandler.ts` | 新增驗證 + 備份 | ~35 行   |
| 測試檔案                        | 新增測試案例    | ~80 行   |

---

## 參考資料

-   [Blockly Serialization API](https://developers.google.com/blockly/guides/configure/web/serialization)
-   [spec 017 快速備份實作](../017-ctrl-s-quick-backup/)
-   [現有備份機制](../../src/webview/messageHandler.ts#L640-L740)
