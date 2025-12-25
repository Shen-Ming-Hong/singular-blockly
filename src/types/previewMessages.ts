/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 開發板配置鍵值 - 對應 BOARD_CONFIGS 物件的 key
 */
export type BoardConfigKey = 'uno' | 'nano' | 'mega' | 'esp32' | 'supermini';

/**
 * 開發板類型 - 備份檔案中儲存的格式
 */
export type BoardType = 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32' | 'esp32_super_mini';

/**
 * 設定開發板訊息
 * Extension 端發送給 WebView 端，用於設定預覽模式的開發板類型
 * 必須在 loadWorkspaceState 之前發送
 */
export interface SetBoardMessage {
	command: 'setBoard';
	/** BOARD_CONFIGS 的 key: 'uno' | 'nano' | 'mega' | 'esp32' | 'supermini' */
	board: BoardConfigKey;
	/** 原始備份中的 board 值 (用於除錯) */
	originalBoard?: string;
	/** 是否為預設值 (用於警告顯示) */
	isDefault?: boolean;
	/** 警告訊息 (當 board 無效時，由 Extension 端透過 localeService 產生已翻譯文字) */
	warning?: string;
}

/**
 * 載入工作區狀態訊息 (現有)
 */
export interface LoadWorkspaceStateMessage {
	command: 'loadWorkspaceState';
	/** Blockly.serialization.workspaces.save() 輸出 */
	workspaceState: object;
}

/**
 * 更新主題訊息 (現有)
 */
export interface UpdateThemeMessage {
	command: 'updateTheme';
	theme: 'light' | 'dark';
}

/**
 * 載入錯誤訊息 (現有)
 */
export interface LoadErrorMessage {
	command: 'loadError';
	error: string;
}

/**
 * 預覽訊息聯合類型
 */
export type PreviewMessage = SetBoardMessage | LoadWorkspaceStateMessage | UpdateThemeMessage | LoadErrorMessage;
