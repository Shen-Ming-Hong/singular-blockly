# Data Model: 統一 Arduino C++ 與 MicroPython 上傳 UI

**Feature**: 026-unified-upload-ui  
**Date**: 2026-01-03

---

## 1. 核心型別定義

### 1.1 上傳階段（Arduino 模式）

```typescript
/**
 * Arduino 上傳階段類型
 * 定義 Arduino C++ 編譯/上傳流程的各個階段
 */
export type ArduinoUploadStage =
	| 'syncing' // 同步 platformio.ini 設定
	| 'saving' // 儲存工作區（確保 main.cpp 與積木同步）
	| 'checking_pio' // 檢查 PlatformIO CLI 是否存在
	| 'detecting' // 偵測連接的 Arduino 板子
	| 'compiling' // 編譯中
	| 'uploading' // 上傳中（僅當偵測到板子時）
	| 'completed' // 完成
	| 'failed'; // 失敗
```

### 1.2 上傳階段（MicroPython 模式 - 現有）

```typescript
/**
 * MicroPython 上傳階段類型
 * 維持現有定義，無變更
 */
export type MicropythonUploadStage =
	| 'preparing' // 準備中
	| 'checking_tool' // 檢查 mpremote
	| 'installing_tool' // 安裝 mpremote
	| 'connecting' // 連接裝置
	| 'resetting' // 重置裝置
	| 'backing_up' // 備份原程式
	| 'uploading' // 上傳中
	| 'restarting' // 重啟裝置
	| 'completed' // 完成
	| 'failed'; // 失敗
```

### 1.3 統一上傳階段類型

```typescript
/**
 * 統一上傳階段類型
 * 合併 Arduino 與 MicroPython 的階段定義
 */
export type UploadStage = ArduinoUploadStage | MicropythonUploadStage;
```

---

## 2. 上傳請求與結果

### 2.1 上傳請求介面

```typescript
/**
 * 上傳請求介面
 * 包含執行上傳所需的所有資訊
 */
export interface UploadRequest {
	/** 要上傳的程式碼 */
	code: string;

	/** 目標開發板 ID (如 'uno', 'esp32', 'cyberbrick') */
	board: string;

	/** 指定連接埠（可選，未指定時自動偵測） */
	port?: string;

	/** 函式庫依賴列表（Arduino 模式專用） */
	lib_deps?: string[];

	/** 編譯標誌列表（Arduino 模式專用） */
	build_flags?: string[];

	/** 庫連結模式（Arduino 模式專用） */
	lib_ldf_mode?: string;
}
```

### 2.2 上傳進度介面

```typescript
/**
 * 上傳進度介面
 * 用於 WebView 與 Extension 間的進度通訊
 */
export interface UploadProgress {
	/** 當前階段 */
	stage: UploadStage;

	/** 進度百分比 (0-100) */
	progress: number;

	/** 顯示訊息 */
	message: string;

	/** 錯誤訊息（如有） */
	error?: string;
}
```

### 2.3 上傳結果介面

```typescript
/**
 * 上傳結果介面
 * 包含上傳操作的最終結果
 */
export interface UploadResult {
	/** 是否成功 */
	success: boolean;

	/** 完成時間戳 */
	timestamp: string;

	/** 使用的連接埠 */
	port: string;

	/** 執行時間（毫秒） */
	duration: number;

	/** 上傳模式（Arduino 專用） */
	mode?: 'compile-only' | 'upload';

	/** 錯誤資訊（如有） */
	error?: {
		stage: UploadStage;
		message: string;
		details?: string;
	};
}
```

---

## 3. 服務層介面

### 3.1 上傳器介面

```typescript
/**
 * 上傳器介面
 * 定義所有 Uploader 必須實作的方法
 */
export interface IUploader {
	/**
	 * 執行上傳操作
	 * @param request 上傳請求
	 * @param onProgress 進度回調
	 * @returns 上傳結果
	 */
	upload(request: UploadRequest, onProgress?: (progress: UploadProgress) => void): Promise<UploadResult>;
}
```

### 3.2 Arduino 上傳器配置

```typescript
/**
 * Arduino 上傳器配置
 */
export interface ArduinoUploaderConfig {
	/** 工作區路徑 */
	workspacePath: string;

	/** PlatformIO CLI 路徑（可選，未指定時使用預設路徑） */
	pioPath?: string;

	/** 編譯逾時時間（毫秒，預設 120000） */
	compileTimeout?: number;

	/** 上傳逾時時間（毫秒，預設 60000） */
	uploadTimeout?: number;
}
```

### 3.3 連接埠資訊

```typescript
/**
 * 連接埠資訊介面
 * 表示偵測到的 Arduino 裝置連接埠
 */
export interface ArduinoPortInfo {
	/** 連接埠路徑（如 COM3, /dev/ttyUSB0） */
	path: string;

	/** 裝置描述 */
	description?: string;

	/** 硬體 ID */
	hwid?: string;
}
```

---

## 4. WebView 訊息格式

### 4.1 上傳請求訊息

```typescript
/**
 * WebView → Extension: 上傳請求訊息
 */
interface RequestUploadMessage {
	command: 'requestUpload';
	code: string;
	board: string;
	port?: string;
	lib_deps?: string[];
	build_flags?: string[];
	lib_ldf_mode?: string;
}
```

### 4.2 上傳進度訊息

```typescript
/**
 * Extension → WebView: 上傳進度訊息
 */
interface UploadProgressMessage {
	command: 'uploadProgress';
	stage: UploadStage;
	progress: number;
	message: string;
	error?: string;
}
```

### 4.3 上傳結果訊息

```typescript
/**
 * Extension → WebView: 上傳結果訊息
 */
interface UploadResultMessage {
	command: 'uploadResult';
	success: boolean;
	timestamp: string;
	port: string;
	duration: number;
	mode?: 'compile-only' | 'upload';
	error?: {
		stage: UploadStage;
		message: string;
		details?: string;
	};
}
```

---

## 5. 板子與語言類型映射

### 5.1 板子語言類型

```typescript
/**
 * 板子語言類型
 * 決定使用哪個上傳服務
 */
export type BoardLanguage = 'arduino' | 'micropython';

/**
 * 板子語言映射表
 * 用於判斷板子應使用哪種上傳流程
 */
export const BOARD_LANGUAGE_MAP: Record<string, BoardLanguage> = {
	// Arduino 類型
	uno: 'arduino',
	nano: 'arduino',
	mega: 'arduino',
	esp32: 'arduino',
	esp8266: 'arduino',
	leonardo: 'arduino',
	micro: 'arduino',

	// MicroPython 類型
	cyberbrick: 'micropython',

	// 無板子選擇
	none: 'arduino', // 預設使用 Arduino 編譯驗證
};
```

### 5.2 取得板子語言類型

```typescript
/**
 * 取得板子的程式語言類型
 * @param board 板子 ID
 * @returns 語言類型
 */
export function getBoardLanguage(board: string): BoardLanguage {
	return BOARD_LANGUAGE_MAP[board] || 'arduino';
}
```

---

## 6. i18n 鍵名定義

### 6.1 Arduino 上傳相關鍵名

```typescript
/**
 * Arduino 上傳功能的 i18n 鍵名
 */
const ARDUINO_UPLOAD_I18N_KEYS = {
	// 按鈕
	UPLOAD_BUTTON_TITLE_ARDUINO: 'UPLOAD_BUTTON_TITLE_ARDUINO',

	// 階段訊息
	ARDUINO_STAGE_SYNCING: 'ARDUINO_STAGE_SYNCING',
	ARDUINO_STAGE_SAVING: 'ARDUINO_STAGE_SAVING',
	ARDUINO_STAGE_CHECKING: 'ARDUINO_STAGE_CHECKING',
	ARDUINO_STAGE_DETECTING: 'ARDUINO_STAGE_DETECTING',
	ARDUINO_STAGE_COMPILING: 'ARDUINO_STAGE_COMPILING',
	ARDUINO_STAGE_UPLOADING: 'ARDUINO_STAGE_UPLOADING',

	// 結果訊息
	ARDUINO_COMPILE_SUCCESS: 'ARDUINO_COMPILE_SUCCESS',
	ARDUINO_UPLOAD_SUCCESS: 'ARDUINO_UPLOAD_SUCCESS',

	// 錯誤訊息
	ERROR_ARDUINO_PIO_NOT_FOUND: 'ERROR_ARDUINO_PIO_NOT_FOUND',
	ERROR_ARDUINO_COMPILE_FAILED: 'ERROR_ARDUINO_COMPILE_FAILED',
	ERROR_ARDUINO_UPLOAD_FAILED: 'ERROR_ARDUINO_UPLOAD_FAILED',
	ERROR_ARDUINO_NO_WORKSPACE: 'ERROR_ARDUINO_NO_WORKSPACE',
	ERROR_ARDUINO_TIMEOUT: 'ERROR_ARDUINO_TIMEOUT',
} as const;
```

---

## 7. 狀態機定義

### 7.1 Arduino 上傳狀態轉換

```
[開始]
   │
   ▼
┌──────────┐
│ syncing  │ ─────► [失敗] → [failed]
└──────────┘
   │
   ▼
┌──────────┐
│  saving  │ ─────► [失敗] → [failed]
└──────────┘
   │
   ▼
┌────────────┐
│checking_pio│ ────► [PlatformIO 未安裝] → [failed]
└────────────┘
   │
   ▼
┌──────────┐
│detecting │
└──────────┘
   │
   ├─── [偵測到板子] ───┐
   │                    ▼
   │              ┌──────────┐
   │              │compiling │ ──► [編譯失敗] → [failed]
   │              └──────────┘
   │                    │
   │                    ▼
   │              ┌──────────┐
   │              │uploading │ ──► [上傳失敗] → [failed]
   │              └──────────┘
   │                    │
   │                    ▼
   │              [completed: upload]
   │
   └─── [未偵測到板子] ──┐
                        ▼
                  ┌──────────┐
                  │compiling │ ──► [編譯失敗] → [failed]
                  └──────────┘
                        │
                        ▼
                  [completed: compile-only]
```

---

## 8. 驗證規則

### 8.1 上傳請求驗證

| 欄位        | 必填 | 驗證規則                  |
| ----------- | ---- | ------------------------- |
| code        | ✓    | 非空字串                  |
| board       | ✓    | 存在於 BOARD_LANGUAGE_MAP |
| port        | ✗    | 有效的系統路徑格式        |
| lib_deps    | ✗    | 字串陣列                  |
| build_flags | ✗    | 字串陣列                  |

### 8.2 狀態轉換驗證

-   `syncing` 只能轉換至 `saving` 或 `failed`
-   `compiling` 只能轉換至 `uploading`、`completed` 或 `failed`
-   `completed` 和 `failed` 為終止狀態，不可再轉換

---

## 9. 關聯圖

```
┌─────────────────────────────────────────────────────────────┐
│                        WebView                               │
│  ┌───────────────┐    ┌───────────────┐                     │
│  │ uploadButton  │───►│ handleUpload  │                     │
│  └───────────────┘    │    Click()    │                     │
│                       └───────┬───────┘                     │
│                               │ postMessage                  │
└───────────────────────────────┼─────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Extension Host                            │
│  ┌─────────────────┐                                        │
│  │messageHandler.ts│                                        │
│  │handleRequestUp- │                                        │
│  │load()           │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐    ┌────────────────────┐             │
│  │UploadService    │───►│getBoardLanguage()  │             │
│  └────────┬────────┘    └────────────────────┘             │
│           │                                                  │
│      ┌────┴────┐                                            │
│      │         │                                            │
│      ▼         ▼                                            │
│  ┌────────┐ ┌──────────────┐                                │
│  │Arduino │ │MicroPython   │                                │
│  │Uploader│ │Uploader      │                                │
│  └────┬───┘ └──────────────┘                                │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────────┐                                       │
│  │PlatformIO CLI    │                                       │
│  │pio run [--target │                                       │
│  │upload]           │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```
