# Quickstart: January 2026 Bugfix Batch

**Branch**: `031-bugfix-batch-jan`

本文件提供四個 bug 修復的快速實作指南。

---

## 環境準備

```powershell
# 切換到功能分支
git checkout 031-bugfix-batch-jan

# 安裝依賴
npm install

# 啟動開發模式
npm run watch
```

---

## Bug 1: 主程式積木刪除限制

### 修改檔案

1. **`media/js/blocklyEdit.js`** - Blockly.inject 選項

```javascript
// 在 Blockly.inject() 中添加 maxInstances
const workspace = Blockly.inject('blocklyDiv', {
	toolbox: toolboxConfig,
	theme: theme,
	// ... 現有選項
	maxInstances: {
		micropython_main: 1,
		arduino_setup_loop: 1,
	},
	// ... 其餘選項
});
```

2. **`media/js/blocklyEdit.js`** - 動態 deletable 控制

```javascript
// 在 loadWorkspace 處理後添加
function updateMainBlockDeletable(workspace) {
	const board = window.currentBoard || 'arduino_uno';
	const isCyberBrick = board === 'cyberbrick';
	const blockType = isCyberBrick ? 'micropython_main' : 'arduino_setup_loop';

	const blocks = workspace.getBlocksByType(blockType);
	const shouldBeDeletable = blocks.length > 1;

	blocks.forEach(block => {
		block.setDeletable(shouldBeDeletable);
	});

	// 顯示警告
	if (blocks.length > 1) {
		vscode.postMessage({
			command: 'showToast',
			type: 'warning',
			message: window.languageManager.getMessage('MAIN_BLOCK_DUPLICATE_WARNING', '偵測到多個主程式積木，請刪除多餘的積木'),
		});
	}
}
```

3. **`media/blockly/blocks/arduino.js`** - 添加 setDeletable

```javascript
Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		// ... 現有程式碼
		this.setDeletable(false); // 添加此行
	},
};
```

---

## Bug 2: 備份預覽視窗

### 修改檔案

**`src/webview/messageHandler.ts`** 第 1135 行

```typescript
// Before：直接開啟 JSON 檔案
await vscodeApi.commands.executeCommand('vscode.open', fullPath);

// After：改用預覽指令開啟 blocklyPreview.html
await vscodeApi.commands.executeCommand('singular-blockly.previewBackup', fullPath);
```

---

## Bug 3: 還原備份缺少自動備份

### 修改檔案

**`src/webview/messageHandler.ts`** 的 `handleRestoreBackup()` 方法

```typescript
// 在確認對話框後、copyFile 前添加
// 建立自動備份
if (this.fileService.fileExists(mainJsonPath)) {
	const now = new Date();
	const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/T/, '_').slice(0, 15);
	const autoRestorePath = path.join('blockly', 'backup', `auto_restore_${timestamp}.json`);

	await this.fileService.copyFile(mainJsonPath, autoRestorePath);
	log(`還原前自動備份已建立: ${autoRestorePath}`, 'info');
}

// 繼續原有的還原流程
await this.fileService.copyFile(backupPath, mainJsonPath);
```

---

## Bug 4: 翻譯鍵補充

### 建立掃描工具

**`scripts/i18n/scan-blockly-msg.js`**

```javascript
#!/usr/bin/env node
/**
 * 掃描 Blockly.Msg 翻譯鍵缺失
 */
const fs = require('fs');
const path = require('path');

// 從 Blockly 官方訊息檔案提取鍵
// 掃描專案積木定義
// 比對專案翻譯檔案
// 輸出缺失報告
```

### 補充翻譯鍵

在所有 15 個語言檔案中添加:

```javascript
// media/locales/{lang}/messages.js
CONTROLS_REPEAT_INPUT_DO: '{翻譯值}',
```

---

## 測試驗證

### 手動測試

1. **主程式積木限制**:
    - 建立含有 2 個 `micropython_main` 的 main.json
    - 開啟編輯器，驗證能刪除多餘積木
    - 刪除後驗證最後一個無法刪除

2. **備份預覽**:
    - 建立備份
    - 點擊預覽按鈕
    - 驗證 JSON 檔案正確開啟

3. **還原備份**:
    - 修改工作區
    - 還原舊備份
    - 驗證 `auto_restore_*` 檔案存在

4. **翻譯鍵**:
    - 切換到英文
    - 拖曳 while 迴圈積木
    - 驗證顯示 "do" 而非中文

### 單元測試

```powershell
npm test
```

---

## 參考連結

- [spec.md](spec.md) - 需求規格
- [research.md](research.md) - 技術研究
- [data-model.md](data-model.md) - 資料模型
- [contracts/](contracts/) - 介面合約
