# Quickstart: Ctrl+S 快速備份快捷鍵

**Feature**: 017-ctrl-s-quick-backup  
**Date**: 2025-12-20

## 概述

本功能在 Blockly 編輯區實作 Ctrl+S（macOS 為 Cmd+S）快捷鍵觸發快速備份。包含 Toast 通知系統和 3 秒節流機制。

---

## 快速開始

### 1. 開發環境設定

```powershell
# 安裝依賴
npm install

# 啟動 watch 模式
npm run watch
```

### 2. 測試功能

1. 按 F5 啟動 Extension Development Host
2. 開啟 Blockly 編輯器（`singularBlockly.open` 命令）
3. 在工作區放置任意積木
4. 按下 Ctrl+S（Windows/Linux）或 Cmd+S（macOS）
5. 應看到綠色 Toast 通知：「備份已儲存：backup_YYYYMMDD_HHMMSS」

---

## 檔案變更清單

### 需修改的檔案

| 檔案                          | 變更內容                               |
| ----------------------------- | -------------------------------------- |
| `media/js/blocklyEdit.js`     | 新增 `quickBackup` 物件和 `toast` 物件 |
| `media/css/blocklyEdit.css`   | 新增 Toast 通知樣式                    |
| `media/locales/*/messages.js` | 新增 3 個 i18n 鍵（15 種語言）         |

### 不需修改的檔案

| 檔案                            | 原因                                   |
| ------------------------------- | -------------------------------------- |
| `src/webview/messageHandler.ts` | 完全複用現有 `handleCreateBackup` 邏輯 |
| `media/html/blocklyEdit.html`   | 無需新增 DOM 元素（Toast 動態建立）    |

---

## 核心程式碼模式

### 1. 快速備份物件

```javascript
// 位於 blocklyEdit.js
const quickBackup = {
	// 節流狀態
	lastSaveTime: 0,
	COOLDOWN_MS: 3000,

	// 初始化：綁定鍵盤事件
	init: function () {
		document.addEventListener('keydown', e => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault();
				this.performQuickSave();
			}
		});
	},

	// 節流檢查
	canSave: function () {
		return Date.now() - this.lastSaveTime >= this.COOLDOWN_MS;
	},

	// 執行快速備份
	performQuickSave: function () {
		// 1. 節流檢查
		if (!this.canSave()) {
			toast.show(getMessage('BACKUP_QUICK_SAVE_COOLDOWN'), 'warning');
			return;
		}

		// 2. 空工作區檢查
		const workspace = Blockly.getMainWorkspace();
		const state = Blockly.serialization.workspaces.save(workspace);
		if (!state?.blocks?.blocks?.length) {
			toast.show(getMessage('BACKUP_QUICK_SAVE_EMPTY'), 'warning');
			return;
		}

		// 3. 生成備份名稱
		const backupName = this.generateBackupName();

		// 4. 發送備份請求
		vscode.postMessage({
			command: 'createBackup',
			name: backupName,
			state: state,
			board: document.getElementById('boardSelect').value,
			theme: currentTheme,
			isQuickBackup: true,
		});

		// 5. 更新節流狀態
		this.lastSaveTime = Date.now();

		// 6. 顯示成功 Toast
		const message = getMessage('BACKUP_QUICK_SAVE_SUCCESS').replace('{0}', backupName);
		toast.show(message, 'success');

		log.info(`快速備份: ${backupName}`);
	},

	// 生成備份名稱
	generateBackupName: function () {
		const now = new Date();
		const pad = n => String(n).padStart(2, '0');
		return `backup_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
	},
};
```

### 2. Toast 通知物件

```javascript
// 位於 blocklyEdit.js
const toast = {
	currentToast: null,

	show: function (message, type = 'success', duration = 2500) {
		// 移除現有 Toast
		this.hide();

		// 建立 Toast 元素（含 ARIA 無障礙屬性）
		const toastEl = document.createElement('div');
		toastEl.className = `toast ${type}`;
		toastEl.textContent = message;
		toastEl.setAttribute('role', 'status');
		toastEl.setAttribute('aria-live', 'polite');
		document.body.appendChild(toastEl);

		// 觸發動畫
		requestAnimationFrame(() => {
			toastEl.classList.add('visible');
		});

		// 自動隱藏
		this.currentToast = setTimeout(() => {
			toastEl.classList.remove('visible');
			setTimeout(() => toastEl.remove(), 300);
		}, duration);
	},

	hide: function () {
		if (this.currentToast) {
			clearTimeout(this.currentToast);
			this.currentToast = null;
		}
		document.querySelectorAll('.toast').forEach(el => el.remove());
	},
};
```

### 3. Toast CSS 樣式

```css
/* 位於 blocklyEdit.css */
.toast {
	position: fixed;
	bottom: 20px;
	right: 20px;
	padding: 12px 24px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	z-index: 9999;
	opacity: 0;
	transform: translateY(10px);
	transition: opacity 0.3s ease, transform 0.3s ease;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.visible {
	opacity: 1;
	transform: translateY(0);
}

.toast.success {
	background-color: #4caf50;
	color: white;
}

.toast.warning {
	background-color: #ff9800;
	color: white;
}

.toast.error {
	background-color: #f44336;
	color: white;
}

/* 深色主題支援 */
body.theme-dark .toast {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

---

## i18n 訊息鍵

在每個語言的 `messages.js` 中新增：

```javascript
// Quick Backup Toast Messages
BACKUP_QUICK_SAVE_SUCCESS: '備份已儲存：{0}',
BACKUP_QUICK_SAVE_EMPTY: '工作區為空，不需要備份',
BACKUP_QUICK_SAVE_COOLDOWN: '請稍候，上次備份剛完成',
```

---

## 測試檢查清單

### 功能測試

-   [ ] 按 Ctrl+S 成功建立備份
-   [ ] 按 Cmd+S (macOS) 成功建立備份
-   [ ] Toast 通知正確顯示（成功/警告）
-   [ ] Toast 2.5 秒後自動消失
-   [ ] 空工作區時顯示警告 Toast
-   [ ] 3 秒內重複按下顯示冷卻警告
-   [ ] 備份檔案正確儲存到 `blockly/backup/` 目錄

### 視覺測試

-   [ ] 淺色主題 Toast 樣式正確
-   [ ] 深色主題 Toast 樣式正確
-   [ ] Toast 動畫流暢（淡入淡出）

### i18n 測試

-   [ ] 英文訊息顯示正確
-   [ ] 繁體中文訊息顯示正確
-   [ ] 佔位符 `{0}` 正確替換為備份名稱

---

## 常見問題

### Q: Ctrl+S 沒有反應？

**A**: 確認：

1. 焦點在 Blockly 編輯區內
2. 瀏覽器開發者工具的 Console 沒有錯誤
3. `quickBackup.init()` 在 `initBlocklyEditor()` 中被呼叫

### Q: Toast 通知沒有出現？

**A**: 確認：

1. CSS 檔案正確載入
2. `.toast` 樣式的 `z-index` 夠高（9999）
3. 沒有其他元素遮擋

### Q: 備份沒有儲存到檔案？

**A**: 確認：

1. 工作區有開啟的資料夾（`vscode.workspace.workspaceFolders`）
2. `blockly/backup/` 目錄有寫入權限
3. Extension Host 的 Output 視窗沒有錯誤
