# Data Model: January 2026 Bugfix Batch

**Branch**: `031-bugfix-batch-jan` | **Date**: 2026-01-20

本文件定義四個 bug 修復所涉及的資料實體與狀態轉換。

---

## 核心實體

### 1. Main Program Block (主程式積木)

代表程式入口點的 Blockly 積木，每種模式只能有一個實例。

| 屬性        | 類型      | 說明                  |
| ----------- | --------- | --------------------- |
| `type`      | `string`  | 積木類型識別碼        |
| `id`        | `string`  | Blockly 生成的唯一 ID |
| `deletable` | `boolean` | 是否可刪除            |
| `movable`   | `boolean` | 是否可移動            |

**積木類型對應表**:

| 模式                     | 積木類型             | maxInstances |
| ------------------------ | -------------------- | ------------ |
| CyberBrick (MicroPython) | `micropython_main`   | 1            |
| Arduino                  | `arduino_setup_loop` | 1            |

**狀態轉換**:

```
[單一積木狀態]
  deletable: false
  ↓
  (載入多個積木 / 貼上積木)
  ↓
[多積木狀態]
  deletable: true (所有同類型積木)
  ↓
  (刪除積木直到只剩一個)
  ↓
[單一積木狀態]
  deletable: false
```

---

### 2. Auto Restore Backup (自動還原備份)

還原備份操作前自動建立的備份檔案。

| 屬性        | 類型             | 說明                           |
| ----------- | ---------------- | ------------------------------ |
| `filename`  | `string`         | 檔案名稱 (不含副檔名)          |
| `path`      | `string`         | 相對於專案根目錄的路徑         |
| `timestamp` | `string`         | 建立時間戳記 `YYYYMMDD_HHMMSS` |
| `type`      | `'auto_restore'` | 備份類型識別                   |

**命名規則**:

- 格式: `auto_restore_{YYYYMMDD}_{HHMMSS}.json`
- 範例: `auto_restore_20260120_180409.json`
- 路徑: `blockly/backup/auto_restore_*.json`

**建立條件**:

- 使用者確認還原備份
- `blockly/main.json` 檔案存在 (非新專案)

---

### 3. Translation Key (翻譯鍵)

Blockly.Msg 中的多語言字串鍵值。

| 屬性             | 類型                    | 說明                            |
| ---------------- | ----------------------- | ------------------------------- |
| `key`            | `string`                | 翻譯鍵名稱 (大寫底線格式)       |
| `defaultValue`   | `string`                | 英文預設值                      |
| `source`         | `'blockly' \| 'custom'` | 來源：官方 Blockly 或專案自定義 |
| `affectedBlocks` | `string[]`              | 使用此鍵的積木類型列表          |

**已知需補充的迴圈相關翻譯鍵**:

| 鍵名                       | 英文值 | 積木類型                                     |
| -------------------------- | ------ | -------------------------------------------- |
| `CONTROLS_REPEAT_INPUT_DO` | `do`   | `controls_repeat_ext`, `controls_whileUntil` |

---

## 設定結構

### Blockly Inject Options 擴展

```typescript
interface BlocklyInjectOptions {
	// ... 現有選項
	maxInstances?: {
		[blockType: string]: number;
	};
}
```

**新增配置** (在 `blocklyEdit.js` 的 `Blockly.inject()`):

```javascript
maxInstances: {
  'micropython_main': 1,
  'arduino_setup_loop': 1
}
```

---

## 檔案路徑規範

| 檔案類型   | 相對路徑                                       | 說明             |
| ---------- | ---------------------------------------------- | ---------------- |
| 主程式狀態 | `blockly/main.json`                            | 工作區儲存檔     |
| 手動備份   | `blockly/backup/{name}.json`                   | 使用者建立的備份 |
| 自動備份   | `blockly/backup/auto_{timestamp}.json`         | 定時自動備份     |
| 還原備份   | `blockly/backup/auto_restore_{timestamp}.json` | 還原前自動備份   |

---

## 訊息協定

### WebView → Extension

**主程式積木重複警告**:

```typescript
{
  command: 'showToast',
  type: 'warning',
  message: string  // 多語言警告訊息
}
```

### Extension → WebView

**備份還原成功**:

```typescript
{
  command: 'backupRestored',
  name: string,
  success: true,
  autoBackupName?: string  // 自動備份檔名 (新增)
}
```

---

## 驗證規則

### 主程式積木數量驗證

```javascript
function validateMainBlockCount(workspace, blockType) {
	const blocks = workspace.getBlocksByType(blockType);
	return {
		count: blocks.length,
		isValid: blocks.length === 1,
		shouldWarn: blocks.length > 1,
		shouldProtect: blocks.length === 1,
	};
}
```

### 備份檔案名稱驗證

```javascript
const AUTO_RESTORE_PATTERN = /^auto_restore_\d{8}_\d{6}$/;

function isAutoRestoreBackup(filename) {
	return AUTO_RESTORE_PATTERN.test(filename);
}
```

---

## 翻譯檔案結構

現有格式 (`media/locales/{lang}/messages.js`):

```javascript
window.languageManager.loadMessages('{lang}', {
	// ... 現有翻譯

	// 需補充的 Blockly 內建積木翻譯
	CONTROLS_REPEAT_INPUT_DO: 'do', // 或對應語言翻譯
});
```

**15 個語言檔案位置**:

- `media/locales/bg/messages.js`
- `media/locales/cs/messages.js`
- `media/locales/de/messages.js`
- `media/locales/en/messages.js`
- `media/locales/es/messages.js`
- `media/locales/fr/messages.js`
- `media/locales/hu/messages.js`
- `media/locales/it/messages.js`
- `media/locales/ja/messages.js`
- `media/locales/ko/messages.js`
- `media/locales/pl/messages.js`
- `media/locales/pt-br/messages.js`
- `media/locales/ru/messages.js`
- `media/locales/tr/messages.js`
- `media/locales/zh-hant/messages.js`
