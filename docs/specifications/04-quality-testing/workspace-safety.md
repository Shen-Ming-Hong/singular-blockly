# Workspace 安全防護機制

> 整合自 specs/018-fix-preview-board-config、specs/019-empty-workspace-guard、specs/025-fix-drag-reload-crash

## 概述

**目標**：防止使用者資料遺失，包含空 Workspace 防護、拖曳期間競態條件修復、覆寫前備份

**狀態**：✅ 完成

---

## 問題背景

### 問題 1：方塊拖曳時意外消失

用戶在拖曳方塊過程中，有時會發生所有方塊突然消失的情況。滑鼠放開後畫面上的方塊沒有被釋放，整個程式碼都不見了。

**根本原因**：Blockly 序列化在拖曳期間返回空狀態，系統直接將空狀態寫入 `main.json`。

### 問題 2：FileWatcher 競態條件

FileWatcher 在拖曳期間觸發 `loadWorkspace` 導致積木消失與 UI 鎖定。

**根本原因**：外部檔案變更觸發重新載入，與使用者操作產生競態條件。

### 問題 3：預覽模式開發板配置錯誤

ESP32 備份檔案在預覽模式下顯示 Arduino 腳位資訊。

**根本原因**：預覽模式未正確讀取備份檔案中的 board 設定。

---

## 三層防護機制

### 第一層：WebView 端不存空 Workspace

**位置**：`media/js/blocklyEdit.js`

```javascript
function saveWorkspace() {
	// 檢查是否正在拖曳
	if (Blockly.getMainWorkspace().isDragging()) {
		log.debug('跳過保存：正在拖曳');
		return;
	}

	// 檢查 Workspace 是否為空
	const state = Blockly.serialization.workspaces.save(workspace);
	if (isEmptyWorkspaceState(state)) {
		log.warn('跳過保存：工作區為空');
		return;
	}

	vscode.postMessage({ command: 'saveWorkspace', state, board });
}
```

### 第二層：Extension 端拒絕空資料

**位置**：`src/webview/messageHandler.ts`

```typescript
case 'saveWorkspace':
  if (isEmptyWorkspaceState(message.state)) {
    log('Rejected empty workspace save request', 'warn');
    return;
  }
  await this.fileService.saveWorkspace(message.state);
  break;
```

**空狀態判斷**：`src/services/workspaceValidator.ts`

```typescript
export function isEmptyWorkspaceState(state: WorkspaceState): boolean {
	if (!state || !state.blocks) return true;
	if (!state.blocks.blocks || state.blocks.blocks.length === 0) return true;
	return false;
}
```

### 第三層：覆寫前備份到 .bak

**位置**：`src/services/fileService.ts`

```typescript
async saveWorkspace(state: WorkspaceState): Promise<void> {
  const mainJsonPath = this.getMainJsonPath();

  // 覆寫前建立 .bak 備份
  if (await this.fs.exists(mainJsonPath)) {
    const currentContent = await this.fs.readFile(mainJsonPath);
    if (currentContent.trim() && !isEmptyWorkspaceState(JSON.parse(currentContent))) {
      await this.fs.writeFile(mainJsonPath + '.bak', currentContent);
    }
  }

  // 寫入新狀態
  await this.fs.writeFile(mainJsonPath, JSON.stringify(state, null, 2));
}
```

---

## FileWatcher 競態條件修復

### 問題細節

1. 使用者開始拖曳積木
2. FileWatcher 偵測到檔案變更（可能來自備份或其他編輯器）
3. 觸發 `loadWorkspace` 重新載入
4. 拖曳中的積木被清除，UI 鎖定

### 解決方案

**位置**：`src/webview/webviewManager.ts`

```typescript
// 拖曳期間暫停 FileWatcher
workspace.addChangeListener(event => {
	if (event.type === Blockly.Events.BLOCK_DRAG) {
		if (event.isStart) {
			this.pauseFileWatcher();
		} else {
			this.resumeFileWatcher();
		}
	}
});
```

---

## 預覽模式開發板配置修復

### 問題細節

預覽備份檔案時，系統使用當前專案的 board 設定而非備份檔案中的設定。

### 解決方案

**位置**：`src/webview/messageHandler.ts`

```typescript
case 'previewBackup':
  const backupContent = await this.fs.readFile(message.filePath);
  const backupState = JSON.parse(backupContent);

  // 使用備份檔案中的 board 設定
  const board = backupState.board || 'uno';

  panel.webview.postMessage({
    command: 'loadWorkspace',
    state: backupState,
    board: board,  // 使用備份檔案的 board
    isPreview: true
  });
  break;
```

---

## 日誌追蹤

防護機制觸發時記錄日誌：

| 情況             | 日誌層級 | 訊息                              |
| ---------------- | -------- | --------------------------------- |
| 拖曳期間跳過儲存 | debug    | 「跳過保存：正在拖曳」            |
| 空 Workspace     | warn     | 「跳過保存：工作區為空」          |
| Extension 拒絕   | warn     | 「Rejected empty workspace save」 |
| 建立 .bak 備份   | info     | 「Created backup: main.json.bak」 |

---

## 相關文件

- [快速備份功能](../06-features/quick-backup.md) - Ctrl+S 備份
- [測試覆蓋率](test-coverage.md) - 相關測試案例
