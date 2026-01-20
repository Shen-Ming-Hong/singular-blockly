# WebView 訊息合約

本文件定義 Extension Host 與 WebView 之間的訊息協定。

---

## 新增/修改的訊息

### 1. 備份還原成功回應 (修改)

**方向**: Extension → WebView

```typescript
interface BackupRestoredMessage {
	command: 'backupRestored';
	name: string;
	success: true;
	autoBackupName?: string; // 新增：自動備份的檔名（不含副檔名）
}
```

**範例**:

```json
{
	"command": "backupRestored",
	"name": "my_backup",
	"success": true,
	"autoBackupName": "auto_restore_20260120_180409"
}
```

---

### 2. 主程式積木警告 (新增)

**方向**: WebView → Extension

```typescript
interface MainBlockWarningMessage {
	command: 'showToast';
	type: 'warning';
	message: string;
	duration?: number; // 毫秒，預設 5000
}
```

**範例**:

```json
{
	"command": "showToast",
	"type": "warning",
	"message": "偵測到多個主程式積木，請刪除多餘的積木",
	"duration": 5000
}
```

---

## 現有訊息 (不變)

### previewBackup

**方向**: WebView → Extension

```typescript
interface PreviewBackupMessage {
	command: 'previewBackup';
	name: string; // 備份名稱（不含副檔名）
}
```

### restoreBackup

**方向**: WebView → Extension

```typescript
interface RestoreBackupMessage {
	command: 'restoreBackup';
	name: string; // 備份名稱（不含副檔名）
}
```
