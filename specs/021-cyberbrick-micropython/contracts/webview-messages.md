# API Contracts: WebView ↔ Extension 訊息

**Feature Branch**: `021-cyberbrick-micropython`  
**Last Updated**: 2025-12-30

本文件定義 WebView 與 Extension 之間的訊息協議，用於 CyberBrick MicroPython 功能。

---

## 1. 訊息格式

### 1.1 基本結構

所有訊息遵循以下基本結構：

```typescript
interface WebViewMessage {
	command: string; // 命令名稱
	[key: string]: unknown; // 額外資料
}

interface ExtensionMessage {
	command: string; // 命令名稱
	[key: string]: unknown; // 額外資料
}
```

---

## 2. 現有訊息（需擴展）

### 2.1 updateBoard（擴展）

**方向**: WebView → Extension

**用途**: 通知 Extension 主板已變更

**現有格式**:

```typescript
{
	command: 'updateBoard';
	board: string; // 主板 key
	boardConfig: string; // PlatformIO 配置
}
```

**擴展格式**:

```typescript
{
  command: 'updateBoard';
  board: string;           // 主板 key
  language: 'arduino' | 'micropython';  // 新增
  boardConfig?: string;    // PlatformIO 配置（僅 Arduino）
  toolbox?: string;        // 工具箱檔案（僅 MicroPython）
}
```

### 2.2 updateCode（維持不變）

**方向**: WebView → Extension

**用途**: 通知程式碼已更新

```typescript
{
  command: 'updateCode';
  code: string;
  lib_deps?: string[];
  build_flags?: string[];
  lib_ldf_mode?: string;
}
```

---

## 3. 新增訊息 - platformio.ini 清理（2025-12-30 新增）

### 3.1 deletePlatformioIni

**方向**: WebView → Extension

**用途**: 請求刪除 platformio.ini 檔案（切換到 CyberBrick 時）

```typescript
{
	command: 'deletePlatformioIni';
}
```

**處理邏輯**:

-   Extension 收到後檢查 platformio.ini 是否存在
-   若存在則刪除，記錄日誌 `[blockly] 已刪除 platformio.ini`
-   若不存在則跳過，記錄 debug 日誌
-   不回傳結果（fire-and-forget）

---

## 4. 新增訊息 - 上傳功能

### 4.1 requestUpload

**方向**: WebView → Extension

**用途**: 請求上傳程式到 CyberBrick

```typescript
{
  command: 'requestUpload';
  code: string;            // MicroPython 程式碼
  board: string;           // 主板 key（必須是 'cyberbrick'）
  port?: string;           // 指定連接埠（可選，自動偵測）
}
```

**驗證**:

-   `board` 必須是支援 MicroPython 的主板
-   `code` 必須是非空字串

### 4.2 uploadProgress

**方向**: Extension → WebView

**用途**: 回報上傳進度

```typescript
{
  command: 'uploadProgress';
  stage: UploadStage;
  progress: number;        // 0-100
  message: string;         // 顯示訊息
  error?: string;          // 錯誤訊息
}

type UploadStage =
  | 'preparing'
  | 'checking_tool'
  | 'installing_tool'
  | 'connecting'
  | 'resetting'
  | 'backing_up'
  | 'uploading'
  | 'restarting'
  | 'completed'
  | 'failed';
```

### 4.3 uploadResult

**方向**: Extension → WebView

**用途**: 回報上傳結果（用於 Toast 通知，**重用現有 `toast.show()` 函數**）

```typescript
{
  command: 'uploadResult';
  success: boolean;
  timestamp: string;       // ISO 8601
  port: string;
  duration: number;        // 總時間（毫秒）
  error?: {
    stage: UploadStage;
    message: string;
    details?: string;
  };
  backup?: {
    created: boolean;
    path?: string;
  };
}
```

**WebView 處理**（使用現有 `toast` 物件）:

-   `success: true` → 呼叫 `toast.show('上傳成功！', 'success')`
-   `success: false` → 呼叫 `toast.show('上傳失敗：' + error.message, 'error')`
-   重置上傳按鈕狀態（移除 spinning，啟用按鈕）

---

## 5. 新增訊息 - 連接埠管理

### 5.1 requestPortList

**方向**: WebView → Extension

**用途**: 請求可用連接埠清單

```typescript
{
  command: 'requestPortList';
  filter?: 'all' | 'cyberbrick';  // 篩選類型
}
```

### 5.2 portListResponse

**方向**: Extension → WebView

**用途**: 回傳連接埠清單

```typescript
{
  command: 'portListResponse';
  ports: ComPortInfo[];
  autoDetected?: string;   // 自動偵測到的 CyberBrick 埠
  lastUsed?: string;       // 上次使用的埠
}

interface ComPortInfo {
  path: string;
  vendorId: string;
  productId: string;
  manufacturer?: string;
  description?: string;
}
```

### 5.3 selectPort

**方向**: WebView → Extension

**用途**: 選擇連接埠

```typescript
{
  command: 'selectPort';
  port: string;            // 連接埠路徑
  remember?: boolean;      // 是否記住選擇
}
```

---

## 6. 新增訊息 - 備份功能

### 6.1 requestBackupList

**方向**: WebView → Extension

**用途**: 請求備份清單

```typescript
{
  command: 'requestBackupList';
  type?: 'all' | 'workspace' | 'device';
}
```

### 6.2 backupListResponse

**方向**: Extension → WebView

**用途**: 回傳備份清單

```typescript
{
  command: 'backupListResponse';
  backups: BackupInfo[];
}

interface BackupInfo {
  id: string;
  filename: string;
  type: 'workspace' | 'device';
  timestamp: string;
  sourceBoard: string;
  targetBoard?: string;
  reason?: string;
}
```

### 6.3 restoreBackup

**方向**: WebView → Extension

**用途**: 還原備份

```typescript
{
	command: 'restoreBackup';
	id: string; // 備份 ID
	target: 'workspace' | 'device';
}
```

### 6.4 restoreResult

**方向**: Extension → WebView

**用途**: 回報還原結果

```typescript
{
  command: 'restoreResult';
  success: boolean;
  id: string;
  target: 'workspace' | 'device';
  error?: string;
}
```

### 6.5 createBackup

**方向**: WebView → Extension

**用途**: 手動建立備份

```typescript
{
  command: 'createBackup';
  type: 'workspace' | 'device';
  reason?: string;
}
```

### 6.6 backupCreated

**方向**: Extension → WebView

**用途**: 通知備份已建立

```typescript
{
  command: 'backupCreated';
  success: boolean;
  backup?: BackupInfo;
  error?: string;
}
```

---

## 7. 新增訊息 - 主板切換

### 7.1 boardSwitchWarning

**方向**: Extension → WebView

**用途**: 顯示主板切換警告

```typescript
{
	command: 'boardSwitchWarning';
	fromBoard: string;
	toBoard: string;
	fromLanguage: 'arduino' | 'micropython';
	toLanguage: 'arduino' | 'micropython';
	hasUnsavedWork: boolean;
}
```

### 7.2 boardSwitchConfirm

**方向**: WebView → Extension

**用途**: 確認主板切換

```typescript
{
	command: 'boardSwitchConfirm';
	confirmed: boolean;
	createBackup: boolean; // 是否建立備份（使用現有 Ctrl+S 機制）
	toBoard: string; // 目標主板
}
```

### 7.3 boardSwitchComplete

**方向**: Extension → WebView

**用途**: 通知主板切換完成

```typescript
{
  command: 'boardSwitchComplete';
  success: boolean;
  board: string;
  toolbox?: string;        // 新的工具箱（如需載入）
  backup?: BackupInfo;     // 建立的備份
  error?: string;
}
```

---

## 8. 新增訊息 - 工具箱

### 8.1 loadToolbox

**方向**: Extension → WebView

**用途**: 指示載入特定工具箱

```typescript
{
	command: 'loadToolbox';
	toolbox: string; // 工具箱檔案名
	board: string; // 主板 key
}
```

### 8.2 toolboxLoaded

**方向**: WebView → Extension

**用途**: 通知工具箱已載入

```typescript
{
  command: 'toolboxLoaded';
  toolbox: string;
  success: boolean;
  error?: string;
}
```

---

## 9. 錯誤處理

### 9.1 錯誤碼定義

```typescript
enum UploadErrorCode {
	MPREMOTE_NOT_FOUND = 'MPREMOTE_NOT_FOUND',
	MPREMOTE_INSTALL_FAILED = 'MPREMOTE_INSTALL_FAILED',
	PORT_NOT_FOUND = 'PORT_NOT_FOUND',
	PORT_ACCESS_DENIED = 'PORT_ACCESS_DENIED',
	DEVICE_NOT_RESPONDING = 'DEVICE_NOT_RESPONDING',
	RESET_FAILED = 'RESET_FAILED',
	UPLOAD_FAILED = 'UPLOAD_FAILED',
	SYNTAX_ERROR = 'SYNTAX_ERROR',
	TIMEOUT = 'TIMEOUT',
	UNKNOWN = 'UNKNOWN',
}
```

### 9.2 錯誤訊息格式

```typescript
interface UploadError {
	code: UploadErrorCode;
	message: string; // 使用者友善訊息（用於 Toast 顯示）
	details?: string; // 技術細節
	suggestion?: string; // 建議解決方案
}
```

---

## 10. 訊息流程範例

### 10.1 上傳流程（含 Toast 通知，重用現有 toast 物件）

```
WebView                     Extension
   │                            │
   │── requestUpload ──────────▶│
   │                            │
   │◀── uploadProgress ─────────│ (preparing)
   │◀── uploadProgress ─────────│ (checking_tool)
   │◀── uploadProgress ─────────│ (connecting)
   │◀── uploadProgress ─────────│ (resetting)
   │◀── uploadProgress ─────────│ (backing_up)
   │◀── uploadProgress ─────────│ (uploading)
   │◀── uploadProgress ─────────│ (restarting)
   │◀── uploadProgress ─────────│ (completed)
   │                            │
   │◀── uploadResult ───────────│
   │                            │
```

### 10.2 主板切換流程（含 platformio.ini 清理）

```
WebView                     Extension
   │                            │
   │── updateBoard ────────────▶│ (language change detected)
   │                            │
   │◀── boardSwitchWarning ─────│ (若工作區非空)
   │                            │
   │── boardSwitchConfirm ─────▶│ (confirmed: true)
   │                            │
   │── deletePlatformioIni ────▶│ (若切換到 MicroPython)
   │                            │
   │◀── loadToolbox ────────────│
   │                            │
   │── toolboxLoaded ──────────▶│
   │                            │
   │◀── boardSwitchComplete ────│
   │                            │
```

---

## 11. 版本相容性

### 11.1 訊息版本

建議在訊息中加入版本號以支援未來擴展：

```typescript
interface VersionedMessage {
	version?: '1.0';
	command: string;
	// ...
}
```

### 11.2 向後相容

-   新增欄位使用可選屬性（`?`）
-   不移除現有欄位
-   枚舉類型使用字串而非數字
