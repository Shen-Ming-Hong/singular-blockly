/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Board 類型定義擴展
 */

/**
 * 程式語言類型
 */
export type BoardLanguage = 'arduino' | 'micropython';

/**
 * 上傳方式
 */
export type UploadMethod = 'platformio' | 'mpremote';

/**
 * USB 識別資訊
 */
export interface UsbIdentifier {
	/** Vendor ID (十六進位字串) */
	vid: string;
	/** Product ID (十六進位字串) */
	pid: string;
}

/**
 * 類比輸出範圍
 */
export interface AnalogOutputRange {
	/** 最小值 */
	min: number;
	/** 最大值 */
	max: number;
	/** 預設值 */
	defaultValue: number;
}

/**
 * 板載硬體配置
 */
export interface OnboardHardware {
	/** 板載 LED 配置 */
	onboardLed?: {
		/** GPIO 腳位 */
		pin: number;
		/** LED 數量 */
		count: number;
		/** LED 類型 */
		type: 'WS2812' | 'APA102' | 'standard';
	};
}

/**
 * 主板配置介面
 * 擴展現有 BOARD_CONFIGS 定義，新增 MicroPython 支援
 */
export interface BoardConfig {
	/** 顯示名稱 */
	name: string;

	/** 數位腳位 [顯示名, 值][] */
	digitalPins: [string, string][];

	/** 類比腳位 [顯示名, 值][] */
	analogPins: [string, string][];

	/** 中斷腳位（可選）[顯示名, 值][] */
	interruptPins?: [string, string][];

	/** 類比輸出範圍 */
	analogOutputRange: AnalogOutputRange;

	/** 支援上拉電阻的腳位 */
	pullupPins: Record<string, boolean>;

	/** PlatformIO 配置（Arduino 用） */
	platformConfig?: string;

	// === MicroPython 擴展欄位 ===

	/** 程式語言類型（預設 'arduino'） */
	language?: BoardLanguage;

	/** 自訂工具箱路徑 */
	toolbox?: string;

	/** 上傳方式 */
	uploadMethod?: UploadMethod;

	/** 裝置上的程式路徑 */
	devicePath?: string;

	/** USB 識別資訊（用於自動偵測） */
	usbIdentifier?: UsbIdentifier;

	/** 板載硬體配置 */
	hardware?: OnboardHardware;

	/** 最大 PWM 輸出數量（ESP32-C3 限制為 6） */
	maxPwmOutputs?: number;
}

/**
 * 主板配置字典類型
 */
export type BoardConfigDict = Record<string, BoardConfig>;

/**
 * 有效的主板 key
 */
export type BoardKey = 'uno' | 'nano' | 'mega' | 'esp32' | 'supermini' | 'cyberbrick';

/**
 * 檢查主板是否使用 MicroPython
 * @param boardConfig 主板配置
 * @returns 是否為 MicroPython 主板
 */
export function isMicroPythonBoard(boardConfig: BoardConfig | undefined): boolean {
	return boardConfig?.language === 'micropython';
}

/**
 * 取得主板的工具箱檔案名
 * @param boardConfig 主板配置
 * @returns 工具箱檔案名（預設為 'index.json'）
 */
export function getBoardToolbox(boardConfig: BoardConfig | undefined): string {
	return boardConfig?.toolbox || 'index.json';
}
