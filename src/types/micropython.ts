/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MicroPython 上傳相關類型定義
 */

/**
 * 上傳按鈕狀態
 */
export interface UploadButtonState {
	/** 按鈕是否可見（僅 CyberBrick 時 true） */
	visible: boolean;
	/** 按鈕是否禁用（上傳中為 true） */
	disabled: boolean;
	/** 是否顯示旋轉動畫（同重新整理按鈕） */
	spinning: boolean;
}

/**
 * 上傳階段
 */
export type UploadStage =
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

/**
 * 上傳進度
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

/**
 * 上傳階段結果
 */
export interface UploadStageResult {
	/** 階段名稱 */
	stage: UploadStage;
	/** 執行時間（毫秒） */
	duration: number;
	/** 是否成功 */
	success: boolean;
}

/**
 * 上傳錯誤
 */
export interface UploadError {
	/** 錯誤發生階段 */
	stage: UploadStage;
	/** 錯誤訊息 */
	message: string;
	/** 技術細節 */
	details?: string;
}

/**
 * 備份資訊（上傳時建立）
 */
export interface UploadBackupInfo {
	/** 是否建立備份 */
	created: boolean;
	/** 備份檔案路徑 */
	path?: string;
}

/**
 * 上傳結果
 */
export interface UploadResult {
	/** 是否成功 */
	success: boolean;
	/** 完成時間戳 */
	timestamp: string;
	/** 連接埠 */
	port: string;
	/** 各階段結果 */
	stages: UploadStageResult[];
	/** 錯誤資訊（如有） */
	error?: UploadError;
	/** 備份資訊 */
	backup?: UploadBackupInfo;
}

/**
 * 上傳選項
 */
export interface UploadOptions {
	/** MicroPython 程式碼 */
	code: string;
	/** 連接埠 */
	port: string;
	/** 裝置上的檔案路徑 */
	devicePath: string;
	/** 是否備份原程式 */
	createBackup?: boolean;
}

/**
 * 連接埠資訊
 */
export interface ComPortInfo {
	/** 連接埠路徑 (COM3, /dev/ttyACM0) */
	path: string;
	/** Vendor ID */
	vendorId: string;
	/** Product ID */
	productId: string;
	/** 製造商 */
	manufacturer?: string;
	/** 序號 */
	serialNumber?: string;
	/** 描述 */
	description?: string;
}

/**
 * 連接埠選擇狀態
 */
export interface PortSelectionState {
	/** 可用連接埠清單 */
	available: ComPortInfo[];
	/** 已選擇的連接埠 */
	selected?: string;
	/** 上次使用的連接埠 */
	lastUsed?: string;
	/** 自動偵測到的 CyberBrick 連接埠 */
	autoDetected?: ComPortInfo;
}

/**
 * 上傳錯誤碼
 */
export enum UploadErrorCode {
	/** mpremote 工具未找到 */
	MPREMOTE_NOT_FOUND = 'MPREMOTE_NOT_FOUND',
	/** mpremote 安裝失敗 */
	MPREMOTE_INSTALL_FAILED = 'MPREMOTE_INSTALL_FAILED',
	/** 連接埠未找到 */
	PORT_NOT_FOUND = 'PORT_NOT_FOUND',
	/** 連接埠存取被拒 */
	PORT_ACCESS_DENIED = 'PORT_ACCESS_DENIED',
	/** 裝置無回應 */
	DEVICE_NOT_RESPONDING = 'DEVICE_NOT_RESPONDING',
	/** 重置失敗 */
	RESET_FAILED = 'RESET_FAILED',
	/** 上傳失敗 */
	UPLOAD_FAILED = 'UPLOAD_FAILED',
	/** 語法錯誤 */
	SYNTAX_ERROR = 'SYNTAX_ERROR',
	/** 逾時 */
	TIMEOUT = 'TIMEOUT',
	/** 未知錯誤 */
	UNKNOWN = 'UNKNOWN',
}
