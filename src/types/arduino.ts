/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

/**
 * 上傳進度介面
 * 用於 WebView 與 Extension 間的進度通訊
 */
export interface ArduinoUploadProgress {
	/** 當前階段 */
	stage: ArduinoUploadStage;

	/** 總進度百分比 (0-100) */
	progress: number;

	/** 顯示訊息 */
	message: string;

	/** 錯誤訊息（如有） */
	error?: string;

	/** 子進度百分比 (0-100)，用於編譯/上傳階段的詳細進度 */
	subProgress?: number;

	/** 已耗時（毫秒） */
	elapsed?: number;

	/** 預估總時間（毫秒，可選） */
	estimatedTotal?: number;
}

/**
 * 上傳結果介面
 * 包含上傳操作的最終結果
 */
export interface ArduinoUploadResult {
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
		stage: ArduinoUploadStage;
		message: string;
		details?: string;
	};
}

/**
 * 上傳請求介面
 * 包含執行上傳所需的所有資訊
 */
export interface ArduinoUploadRequest {
	/** 要上傳的程式碼 */
	code: string;

	/** 目標開發板 ID (如 'uno', 'esp32', 'mega') */
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

/**
 * 連接埠資訊介面
 * 表示偵測到的 Arduino 裝置連接埠
 */
export interface ArduinoPortInfo {
	/** 連接埠路徑（如 COM3, /dev/ttyUSB0） */
	port: string;

	/** 裝置描述 */
	description?: string;

	/** 硬體 ID */
	hwid?: string;
}

/**
 * 進度回調類型
 */
export type ArduinoProgressCallback = (progress: ArduinoUploadProgress) => void;

/**
 * 板子語言類型
 * 決定使用哪個上傳服務
 */
export type BoardLanguage = 'arduino' | 'micropython';

/**
 * 板子語言映射表
 * 用於判斷板子應使用哪種上傳流程
 * 注意：'none' 不在此映射中，需在上傳前檢查並提示使用者選擇開發板
 */
export const BOARD_LANGUAGE_MAP: Record<string, BoardLanguage> = {
	// Arduino 類型
	uno: 'arduino',
	nano: 'arduino',
	mega: 'arduino',
	esp32: 'arduino',
	supermini: 'arduino',

	// MicroPython 類型
	cyberbrick: 'micropython',
};

/**
 * 取得板子的程式語言類型
 * @param board 板子 ID
 * @returns 語言類型，當 board 為 'none' 或未知時返回 undefined
 */
export function getBoardLanguage(board: string): BoardLanguage | undefined {
	if (board === 'none' || !BOARD_LANGUAGE_MAP[board]) {
		return undefined; // 需要提示使用者選擇開發板
	}
	return BOARD_LANGUAGE_MAP[board];
}

// ===== Serial Monitor Types =====

/**
 * Monitor 錯誤代碼
 */
export type MonitorErrorCode =
	| 'DEVICE_NOT_FOUND' // 找不到 CyberBrick 裝置
	| 'MPREMOTE_NOT_INSTALLED' // mpremote 工具未安裝
	| 'PORT_IN_USE' // COM 埠被佔用
	| 'CONNECTION_FAILED'; // 連接失敗

/**
 * Monitor 錯誤介面
 */
export interface MonitorError {
	/** 錯誤代碼 */
	code: MonitorErrorCode;
	/** 錯誤訊息 */
	message: string;
}

/**
 * Monitor 啟動結果
 */
export interface MonitorStartResult {
	/** 是否成功啟動 */
	success: boolean;
	/** 連接的 COM 埠 */
	port: string;
	/** 錯誤資訊（如有） */
	error?: MonitorError;
}

/**
 * Serial Monitor 狀態
 */
export interface SerialMonitorState {
	/** Monitor 是否正在運行 */
	isRunning: boolean;
	/** 當前連接的 COM 埠 */
	port: string | null;
}
