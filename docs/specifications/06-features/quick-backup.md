# 快速備份功能 (Ctrl+S)

> 整合自 specs/017-ctrl-s-quick-backup

## 概述

**目標**：讓使用者在積木編輯區按下 Ctrl+S 時觸發手動備份

**狀態**：✅ 完成

---

## 功能規格

### 觸發方式

| 系統    | 快捷鍵 |
| ------- | ------ |
| Windows | Ctrl+S |
| macOS   | Cmd+S  |
| Linux   | Ctrl+S |

### 備份命名格式

```
backup_YYYYMMDD_HHMMSS.json
```

範例：`backup_20260120_143052.json`

### 儲存位置

```
{workspace}/blockly/backups/backup_YYYYMMDD_HHMMSS.json
```

---

## 核心功能

### 1. 鍵盤事件監聽

**位置**：`media/js/blocklyEdit.js`

```javascript
document.addEventListener('keydown', e => {
	if ((e.ctrlKey || e.metaKey) && e.key === 's') {
		e.preventDefault(); // 攔截瀏覽器預設行為
		handleQuickSave();
	}
});
```

### 2. 空工作區保護

工作區為空時跳過備份：

```javascript
function handleQuickSave() {
	const state = Blockly.serialization.workspaces.save(workspace);
	if (isEmptyWorkspaceState(state)) {
		showToast(Blockly.Msg['BACKUP_QUICK_SAVE_EMPTY'], 'warning');
		return;
	}
	// 繼續備份...
}
```

### 3. 節流機制（3 秒）

防止短時間內建立過多備份：

```javascript
let lastQuickSaveTime = 0;
const QUICK_SAVE_COOLDOWN = 3000; // 3 秒

function handleQuickSave() {
	const now = Date.now();
	if (now - lastQuickSaveTime < QUICK_SAVE_COOLDOWN) {
		showToast(Blockly.Msg['BACKUP_QUICK_SAVE_COOLDOWN'], 'warning');
		return;
	}
	lastQuickSaveTime = now;
	// 繼續備份...
}
```

---

## Toast 通知

### 通知類型

| 狀態     | 顏色 | 訊息鍵                       | 範例                               |
| -------- | ---- | ---------------------------- | ---------------------------------- |
| 成功     | 綠色 | `BACKUP_QUICK_SAVE_SUCCESS`  | 備份已儲存：backup_20260120_143052 |
| 空工作區 | 橙色 | `BACKUP_QUICK_SAVE_EMPTY`    | 工作區為空，不需要備份             |
| 冷卻中   | 橙色 | `BACKUP_QUICK_SAVE_COOLDOWN` | 請稍候，上次備份剛完成             |

### Toast 規格

- 顯示時間：2.5 秒後自動消失
- 位置：畫面右下角
- 動畫：淡入淡出

---

## i18n 支援

15 種語言翻譯：

```javascript
// media/locales/zh-hant/messages.js
Blockly.Msg['BACKUP_QUICK_SAVE_SUCCESS'] = '備份已儲存：{0}';
Blockly.Msg['BACKUP_QUICK_SAVE_EMPTY'] = '工作區為空，不需要備份';
Blockly.Msg['BACKUP_QUICK_SAVE_COOLDOWN'] = '請稍候，上次備份剛完成';

// media/locales/en/messages.js
Blockly.Msg['BACKUP_QUICK_SAVE_SUCCESS'] = 'Backup saved: {0}';
Blockly.Msg['BACKUP_QUICK_SAVE_EMPTY'] = 'Workspace is empty, no backup needed';
Blockly.Msg['BACKUP_QUICK_SAVE_COOLDOWN'] = 'Please wait, last backup just completed';
```

---

## 相關文件

- [Workspace 安全防護](../04-quality-testing/workspace-safety.md) - 空 Workspace 判斷邏輯
- [統一上傳 UI](unified-upload-ui.md) - Toast 通知元件共用
