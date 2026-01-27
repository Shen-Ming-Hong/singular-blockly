# Arduino Monitor Service 介面合約

**功能分支**: `038-arduino-serial-monitor`  
**建立日期**: 2026-01-27

## 服務介面

### ArduinoMonitorService

```typescript
/**
 * Arduino Serial Monitor 服務
 * 使用 PlatformIO CLI 的 pio device monitor 命令
 */
export interface IArduinoMonitorService {
	/**
	 * 啟動 Serial Monitor
	 * @param board - 開發板類型 (如 'esp32', 'uno')
	 * @param workspacePath - 專案目錄路徑
	 * @param config - 可選的配置選項
	 * @returns 啟動結果
	 */
	start(board: string, workspacePath: string, config?: Partial<ArduinoMonitorConfig>): Promise<MonitorStartResult>;

	/**
	 * 停止 Serial Monitor
	 */
	stop(): Promise<void>;

	/**
	 * 為上傳準備：停止 Monitor 並記錄狀態
	 */
	stopForUpload(): Promise<void>;

	/**
	 * 上傳成功後：根據先前狀態條件性重啟
	 * @param board - 開發板類型
	 * @param workspacePath - 專案目錄路徑
	 */
	restartAfterUpload(board: string, workspacePath: string): Promise<void>;

	/**
	 * 檢查 Monitor 是否正在運行
	 */
	isRunning(): boolean;

	/**
	 * 取得目前使用的連接埠
	 */
	getCurrentPort(): string | null;

	/**
	 * 註冊停止回調
	 * @param callback - 回調函式，參數為停止原因
	 */
	onStopped(callback: (reason: MonitorStopReason) => void): void;

	/**
	 * 清理資源
	 */
	dispose(): void;
}
```

---

## 類型定義

### ArduinoMonitorConfig

```typescript
/**
 * Arduino Monitor 配置
 */
export interface ArduinoMonitorConfig {
	/** 通訊速率 (預設: 115200) */
	baudRate: number;

	/** 指定連接埠 (預設: 自動偵測) */
	port?: string;

	/** 是否使用 ESP32 崩潰解碼器 (ESP32 系列自動啟用) */
	useExceptionDecoder?: boolean;
}
```

### MonitorStartResult

```typescript
/**
 * Monitor 啟動結果
 */
export interface MonitorStartResult {
	/** 是否成功啟動 */
	success: boolean;

	/** 使用的連接埠 */
	port: string;

	/** 錯誤資訊（如有） */
	error?: MonitorError;
}
```

### MonitorError

```typescript
/**
 * Monitor 錯誤類型
 */
export interface MonitorError {
	/** 錯誤代碼 */
	code: MonitorErrorCode;

	/** 錯誤訊息 */
	message: string;
}

export type MonitorErrorCode =
	| 'PORT_NOT_FOUND' // 找不到裝置
	| 'PORT_IN_USE' // 連接埠被佔用
	| 'PIO_NOT_FOUND' // PlatformIO CLI 未安裝
	| 'UPLOAD_IN_PROGRESS' // 正在上傳中
	| 'UNKNOWN'; // 未知錯誤
```

### MonitorStopReason

```typescript
/**
 * Monitor 停止原因
 */
export type MonitorStopReason =
	| 'user_closed' // 用戶手動關閉終端機
	| 'upload_started' // 因程式上傳而關閉
	| 'device_disconnected' // 裝置連線中斷
	| 'manual_stop'; // 用戶點擊 Monitor 按鈕關閉
```

---

## WebView 訊息合約

### Extension → WebView

```typescript
// Monitor 啟動成功
{
	command: 'monitorStarted';
	port: string;
}

// Monitor 已停止
{
	command: 'monitorStopped';
	reason: MonitorStopReason;
}

// Monitor 錯誤
{
	command: 'monitorError';
	error: MonitorError;
}

// 狀態更新（上傳中禁用按鈕）
{
	command: 'monitorStateUpdate';
	uploading: boolean;
}
```

### WebView → Extension

```typescript
// 啟動 Monitor
{
	command: 'startMonitor';
	board: string;
}

// 停止 Monitor
{
	command: 'stopMonitor';
}
```

---

## 輔助函式合約

### parsePlatformioIni

```typescript
/**
 * 解析 platformio.ini 取得 monitor 設定
 * @param workspacePath - 專案目錄路徑
 * @returns Monitor 設定（若解析失敗返回預設值）
 */
export function parsePlatformioIni(workspacePath: string): Partial<ArduinoMonitorConfig>;
```

### isEsp32Board

```typescript
/**
 * 判斷是否為 ESP32 系列開發板
 * @param board - 開發板類型
 * @returns 是否為 ESP32 系列
 */
export function isEsp32Board(board: string): boolean;
```

### detectSerialPort

```typescript
/**
 * 偵測可用的序列埠
 * @param workspacePath - 專案目錄路徑
 * @returns 偵測到的連接埠，若無則返回 null
 */
export function detectSerialPort(workspacePath: string): Promise<string | null>;
```
