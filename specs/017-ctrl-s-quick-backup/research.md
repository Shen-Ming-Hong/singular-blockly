# Research: Ctrl+S 快速備份快捷鍵

**Feature**: 017-ctrl-s-quick-backup  
**Date**: 2025-12-20  
**Status**: Completed

## 研究目標

1. WebView 鍵盤事件處理最佳實踐
2. 現有備份機制分析與複用策略
3. Toast 通知系統設計方案
4. 節流（Throttle）機制實作模式
5. 跨平台快捷鍵處理（Windows/macOS/Linux）

---

## 1. WebView 鍵盤事件處理

### 決策：使用 `document.addEventListener('keydown', ...)`

**選用理由**：

-   專案已有相同模式的實作（Ctrl+F 搜尋功能，位於 `blocklyEdit.js` 第 637 行）
-   標準 DOM API，無額外依賴
-   支援 `e.ctrlKey`（Windows/Linux）和 `e.metaKey`（macOS）判斷

**現有參考程式碼**：

```javascript
// blocklyEdit.js:637-642
document.addEventListener('keydown', e => {
	if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
		e.preventDefault(); // 阻止瀏覽器預設搜尋
		this.openModal();
	}
});
```

**替代方案考慮**：

-   Blockly 內建快捷鍵系統：過於複雜，僅適用於積木操作
-   VSCode keybinding：無法在 WebView 內運作

### 關鍵實作細節

1. **必須呼叫 `e.preventDefault()`**：阻止瀏覽器預設的「儲存網頁」對話框
2. **鍵值使用小寫 `'s'`**：`e.key` 返回小寫字母（除非 Shift 被按下）
3. **事件綁定位置**：在 `initBlocklyEditor()` 或獨立的 `quickBackup.init()` 中初始化

---

## 2. 現有備份機制分析

### 決策：完全複用現有 `createBackup` 訊息處理

**選用理由**：

-   現有機制穩定運作（手動備份、自動備份均使用）
-   符合 Constitution 原則 II（模組化與可擴展性）
-   無需修改 Extension Host 程式碼

**現有訊息格式**（`blocklyEdit.js:348-356`）：

```javascript
vscode.postMessage({
	command: 'createBackup',
	name: backupName,
	state: state,
	board: boardSelect.value,
	theme: currentTheme,
});
```

**Extension 處理邏輯**（`messageHandler.ts:490-527`）：

-   自動建立備份目錄 `blockly/backup/`
-   複製 `main.json` 到備份路徑
-   回傳 `backupCreated` 訊息

### 備份命名格式

**決策**：使用 `backup_YYYYMMDD_HHMMSS` 格式

**選用理由**：

-   與現有手動備份命名一致（`blocklyEdit.js:307-316`）
-   區別於自動備份的 `auto_YYYYMMDD_HHMMSS` 格式
-   使用者可從命名識別備份來源

---

## 3. Toast 通知系統設計

### 決策：在 WebView 內部實作輕量級 Toast 系統

**選用理由**：

-   即時回饋（無需等待 Extension Host 回應）
-   視覺效果可完全控制（成功綠色、警告橙色）
-   符合 Constitution 原則 III（避免過度開發）

**替代方案被拒絕**：

-   VSCode `vscode.window.showInformationMessage`：無法在 WebView 顯示，需 Extension 呼叫
-   使用 Extension 回傳訊息觸發：增加延遲和複雜度

### Toast 元件設計

```javascript
const toast = {
    // 顯示 Toast 通知
    show: function(message, type = 'success', duration = 2500) {
        // type: 'success' | 'warning' | 'error'
        // duration: 毫秒（預設 2500ms）
    },

    // 隱藏當前 Toast
    hide: function() { ... }
};
```

### CSS 樣式設計

```css
.toast {
	position: fixed;
	bottom: 20px;
	right: 20px;
	padding: 12px 24px;
	border-radius: 8px;
	z-index: 9999;
	opacity: 0;
	transition: opacity 0.3s ease-in-out;
}

.toast.visible {
	opacity: 1;
}
.toast.success {
	background-color: #4caf50;
	color: white;
}
.toast.warning {
	background-color: #ff9800;
	color: white;
}
```

---

## 4. 節流（Throttle）機制

### 決策：使用時間戳比較實作 3 秒節流

**選用理由**：

-   簡單純函數，易於測試
-   無需額外 debounce/throttle 函式庫
-   符合 Constitution 原則 VIII（純函數與模組化）

**實作設計**：

```javascript
const quickBackup = {
	lastSaveTime: 0,
	COOLDOWN_MS: 3000, // 3 秒冷卻時間

	canSave: function () {
		const now = Date.now();
		return now - this.lastSaveTime >= this.COOLDOWN_MS;
	},

	recordSave: function () {
		this.lastSaveTime = Date.now();
	},
};
```

**替代方案考慮**：

-   Lodash `_.throttle`：引入不必要的依賴
-   `setTimeout` 鎖定機制：狀態管理較複雜

### 節流邏輯流程

```
按下 Ctrl+S
    ↓
檢查 canSave()
    ├── true → 執行備份 → recordSave() → 顯示成功 Toast
    └── false → 顯示「請稍候」警告 Toast
```

---

## 5. 跨平台快捷鍵處理

### 決策：同時監聽 `ctrlKey` 和 `metaKey`

**選用理由**：

-   Windows/Linux 使用 Ctrl+S
-   macOS 使用 Cmd+S（`metaKey`）
-   現有專案模式（Ctrl+F）已驗證可行

**實作程式碼**：

```javascript
document.addEventListener('keydown', e => {
	if ((e.ctrlKey || e.metaKey) && e.key === 's') {
		e.preventDefault();
		quickBackup.performQuickSave();
	}
});
```

---

## 6. 空工作區檢測

### 決策：檢查 `state.blocks.blocks.length`

**選用理由**：

-   現有自動備份已有相同檢查邏輯（`blocklyEdit.js:568-571`）
-   Blockly 序列化 API 標準用法

**現有參考程式碼**：

```javascript
const state = Blockly.serialization.workspaces.save(workspace);
if (!state || !state.blocks || state.blocks.blocks.length === 0) {
	log.info('工作區為空，不建立自動備份');
	return;
}
```

---

## 7. i18n 訊息鍵設計

### 決策：新增 3 個專用訊息鍵

| 鍵名                         | 英文                                   | 繁體中文                 | 用途         |
| ---------------------------- | -------------------------------------- | ------------------------ | ------------ |
| `BACKUP_QUICK_SAVE_SUCCESS`  | `Backup saved: {0}`                    | `備份已儲存：{0}`        | 成功訊息     |
| `BACKUP_QUICK_SAVE_EMPTY`    | `Workspace is empty, no backup needed` | `工作區為空，不需要備份` | 空工作區警告 |
| `BACKUP_QUICK_SAVE_COOLDOWN` | `Please wait, backup just completed`   | `請稍候，上次備份剛完成` | 節流警告     |

**選用理由**：

-   使用 `BACKUP_` 前綴，與現有備份相關訊息一致
-   支援佔位符 `{0}` 顯示動態備份名稱

---

## 8. 效能考量

### Toast 顯示時機

**決策**：備份請求發送後立即顯示成功 Toast

**選用理由**：

-   使用者感知回應時間 < 100ms
-   備份操作本身是非同步的，實際儲存在背景完成
-   若需確認儲存成功，可監聽 `backupCreated` 回傳訊息（目前不需要）

### 記憶體管理

**決策**：Toast 元素動態建立與移除

-   每次顯示時建立 DOM 元素
-   `setTimeout` 結束後移除元素
-   避免多個 Toast 堆疊（新 Toast 取代舊 Toast）

---

## 結論

所有技術問題已釐清，無「NEEDS CLARIFICATION」項目。實作方案：

1. **鍵盤事件**：複用現有 `document.addEventListener('keydown', ...)` 模式
2. **備份機制**：完全複用現有 `createBackup` 訊息處理
3. **Toast 通知**：WebView 內部輕量級實作
4. **節流機制**：時間戳比較純函數
5. **跨平台**：`ctrlKey || metaKey` 判斷
6. **i18n**：3 個新訊息鍵，支援 15 種語言
