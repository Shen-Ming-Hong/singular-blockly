/**
 * TXT Controller 連線設定
 */
export interface TxtConnectionConfig {
	host: string;
	username: string;
	remotePath: string;
	runtimePort: number;
}

/**
 * TXT 裝置狀態機
 * Idle → Testing (開啟測試面板)
 * Idle → Running (上傳執行)
 * Testing → Idle (關閉測試面板)
 * Running → Idle (程式執行完成，exit 0)
 * Running → Error (程式異常，exit ≠ 0)
 * Running/Testing → Stopping (使用者停止)
 * Stopping → Idle (停止完成)
 * Any → Disconnected (網路錯誤)
 * Disconnected/Error → Idle (使用者重試)
 */
export type TxtDeviceState = 'Idle' | 'Testing' | 'Running' | 'Stopping' | 'Disconnected' | 'Error';

/**
 * TXT 裝置 I/O 快照
 */
export interface TxtIoSnapshot {
	motors: [number, number, number, number];
	outputs: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
	inputs: [number, number, number, number, number, number, number, number];
	timestamp: number;
}

/**
 * TXT 上傳階段
 */
export type TxtUploadStage = 'connecting' | 'uploading' | 'executing' | 'stopping' | 'completed' | 'failed';

/**
 * TXT 上傳進度
 */
export interface TxtUploadProgress {
	stage: TxtUploadStage;
	progress: number; // connecting=10, uploading=40, executing=60, stopping=80, completed=100
	message: string;
	error?: string;
}

/**
 * TXT 上傳結果
 */
export interface TxtUploadResult {
	success: boolean;
	timestamp: string; // ISO 8601
	duration: number;
	exitCode?: number;
	error?: string;
}

/**
 * TXT 上傳請求
 */
export interface TxtUploadRequest {
	code: string;
	board: 'txt';
}
