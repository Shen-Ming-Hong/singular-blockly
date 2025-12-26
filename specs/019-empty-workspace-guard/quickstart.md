# Quickstart: 空 Workspace 防護機制

**Feature Branch**: `019-empty-workspace-guard`  
**預計時間**: 2-3 小時

---

## 功能概述

修復方塊拖曳時意外消失的資料遺失問題，實作三層防護機制：

1. **WebView 層**：拖曳中不儲存 + 空狀態不送出
2. **Extension 層**：拒絕空狀態請求
3. **備份層**：覆寫前備份到 `.bak`

---

## 快速開始

### 1. 切換到功能分支

```powershell
git checkout -b 019-empty-workspace-guard
```

### 2. 了解修改範圍

本功能只需修改 **2 個檔案**：

| 檔案                            | 修改內容                          |
| ------------------------------- | --------------------------------- |
| `media/js/blocklyEdit.js`       | 修改 `saveWorkspaceState()` 函數  |
| `src/webview/messageHandler.ts` | 修改 `handleSaveWorkspace()` 方法 |

---

## 實作步驟

### Step 1：WebView 端 - 拖曳狀態檢查

修改 `media/js/blocklyEdit.js` 中的 `saveWorkspaceState()` 函數：

```javascript
// 位置：約第 1379 行
const saveWorkspaceState = () => {
	// 新增：如果正在拖曳方塊，跳過保存
	if (isDraggingBlock) {
		log.info('跳過保存：正在拖曳');
		return;
	}

	// 如果正在從 FileWatcher 載入，跳過保存以避免無限循環
	if (isLoadingFromFileWatcher) {
		log.info('跳過保存：正在從 FileWatcher 載入');
		return;
	}

	try {
		const state = Blockly.serialization.workspaces.save(workspace);

		// 新增：空狀態檢查
		if (!state || !state.blocks || !state.blocks.blocks || state.blocks.blocks.length === 0) {
			log.warn('跳過保存：工作區為空');
			return;
		}

		vscode.postMessage({
			command: 'saveWorkspace',
			state: state,
			board: boardSelect.value,
			theme: currentTheme,
		});
	} catch (error) {
		log.error('保存工作區狀態失敗:', error);
	}
};
```

### Step 2：Extension 端 - 空狀態驗證

修改 `src/webview/messageHandler.ts` 中的 `handleSaveWorkspace()` 方法：

```typescript
// 位置：約第 298 行
private async handleSaveWorkspace(message: any): Promise<void> {
    try {
        // 新增：空狀態驗證
        if (this.isEmptyWorkspaceState(message.state)) {
            log('Rejected empty workspace save request', 'warn');
            return;
        }

        const blocklyDir = 'blockly';
        const mainJsonPath = path.join(blocklyDir, 'main.json');

        // 新增：覆寫前備份
        await this.createBackupBeforeSave(mainJsonPath);

        // 建立 blockly 目錄
        await this.fileService.createDirectory(blocklyDir);

        // ... 其餘原有邏輯 ...
    } catch (error) {
        // ... 原有錯誤處理 ...
    }
}

// 新增方法：空狀態判斷
private isEmptyWorkspaceState(state: any): boolean {
    return !state ||
           !state.blocks ||
           !state.blocks.blocks ||
           state.blocks.blocks.length === 0;
}

// 新增方法：覆寫前備份
private async createBackupBeforeSave(mainJsonPath: string): Promise<void> {
    try {
        if (!this.fileService.fileExists(mainJsonPath)) {
            return; // 檔案不存在，跳過備份
        }

        const existingData = await this.fileService.readJsonFile<any>(mainJsonPath, null);
        if (!existingData || this.isEmptyWorkspaceState(existingData.workspace)) {
            return; // 現有檔案為空，跳過備份
        }

        const bakPath = mainJsonPath + '.bak';
        await this.fileService.copyFile(mainJsonPath, bakPath);
        log('Created backup: main.json.bak', 'debug');
    } catch (error) {
        log('Failed to create backup', 'warn', error);
        // 備份失敗不阻止儲存
    }
}
```

---

## 測試檢查清單

### 手動測試

-   [ ] **正常儲存**：新增方塊 → 關閉編輯器 → 重開 → 方塊存在
-   [ ] **拖曳中不儲存**：拖曳方塊時觀察 Output Channel 無儲存日誌
-   [ ] **空狀態不送出**：清空所有方塊 → 觀察 Output Channel 有警告訊息
-   [ ] **備份建立**：有方塊 → 再新增方塊觸發儲存 → 檢查 `main.json.bak` 存在
-   [ ] **新專案**：新資料夾開啟 → 新增方塊 → 確認無 `.bak` 檔案

### 單元測試（messageHandler.test.ts）

```typescript
describe('handleSaveWorkspace', () => {
	it('should reject empty workspace state', async () => {
		const message = { command: 'saveWorkspace', state: { blocks: { blocks: [] } } };
		await messageHandler.handleMessage(message);
		// 驗證 writeJsonFile 未被呼叫
	});

	it('should create backup before save', async () => {
		// 設置已存在的 main.json
		// 發送有效的 saveWorkspace 訊息
		// 驗證 copyFile 被呼叫
	});
});
```

---

## 常見問題

### Q: 為什麼不在 Extension 端檢查拖曳狀態？

A: 拖曳狀態是 WebView 的 UI 狀態，無法傳遞到 Extension 端。因此拖曳檢查必須在 WebView 層完成。

### Q: 使用者清空所有方塊時怎麼辦？

A: 根據 spec，「清除全部」操作不在本次修復範圍。未來可新增 `allowEmpty` flag 來區分合法的清空操作。

### Q: 備份失敗會影響儲存嗎？

A: 不會。備份失敗只會記錄警告日誌，主檔案儲存會繼續進行。

---

## 相關文件

-   [Feature Spec](spec.md)
-   [Research](research.md)
-   [Data Model](data-model.md)
-   [Message Contracts](contracts/message-contracts.md)
