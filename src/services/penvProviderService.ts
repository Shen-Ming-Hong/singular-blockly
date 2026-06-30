/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { log } from './logging';

// ─── T003: 型別定義 ────────────────────────────────────────────────────────────

/**
 * penv Provider 安裝狀態與 penv 就緒狀態的組合。
 * - 'not-installed'     provider extension 未安裝
 * - 'installed-ready'   provider 已安裝，penv 路徑存在且可執行
 * - 'installed-pending' provider 已安裝，但 penv 尚未完成初始化
 */
export type PenvProviderStatus = 'not-installed' | 'installed-ready' | 'installed-pending';

/**
 * PenvProviderService 的依賴注入介面，使所有 VS Code API 呼叫可在測試中替換。
 */
export interface PenvProviderServiceDeps {
	getExtension: (id: string) => { id: string } | undefined;
	executeCommand: (cmd: string, ...args: unknown[]) => Thenable<unknown>;
	showInformationMessage: (msg: string, ...items: string[]) => Thenable<string | undefined>;
	checkPenvExists: () => boolean;
	/** 可選：i18n 訊息查找函數，返回當前 UI 語言的翻譯字串 */
	getMsg?: (key: string, fallback: string) => Promise<string>;
}

/** 支援的 penv provider extension ID */
const PROVIDER_IDS = ['platformio.platformio-ide', 'pioarduino.pioarduino-ide'] as const;

/** 從 deps 取得翻譯字串，若無 i18n 函數則直接使用英文 fallback */
async function t(deps: PenvProviderServiceDeps, key: string, fallback: string): Promise<string> {
	return deps.getMsg ? deps.getMsg(key, fallback) : fallback;
}

// ─── T004: isProviderInstalled ─────────────────────────────────────────────────

/**
 * 偵測是否已安裝任一 penv provider extension。
 * 使用 getExtension() 判斷，不檢查 penv 路徑是否存在。
 */
export function isProviderInstalled(deps: Pick<PenvProviderServiceDeps, 'getExtension'>): boolean {
	return PROVIDER_IDS.some(id => deps.getExtension(id) !== undefined);
}

// ─── T005: checkPenvExists ─────────────────────────────────────────────────────

/**
 * 以 fs.existsSync 確認 ~/.platformio/penv/ 的 Python 執行檔是否存在。
 * Windows 使用 Scripts/python.exe；macOS/Linux 使用 bin/python。
 */
export function checkPenvExists(): boolean {
	const homeDir = os.homedir();
	const pythonPath =
		process.platform === 'win32'
			? path.join(homeDir, '.platformio', 'penv', 'Scripts', 'python.exe')
			: path.join(homeDir, '.platformio', 'penv', 'bin', 'python');
	return fs.existsSync(pythonPath);
}

// ─── T006: detectStatus ────────────────────────────────────────────────────────

/**
 * 結合 isProviderInstalled 與 checkPenvExists 回傳三態狀態值。
 */
export function detectStatus(deps: PenvProviderServiceDeps): PenvProviderStatus {
	if (!isProviderInstalled(deps)) {
		return 'not-installed';
	}
	return deps.checkPenvExists() ? 'installed-ready' : 'installed-pending';
}

// ─── T007: attemptInstall ──────────────────────────────────────────────────────

/**
 * 嘗試安裝 penv provider extension。
 * 安裝順序：platformio.platformio-ide → pioarduino.pioarduino-ide → 開啟 Extensions 面板。
 */
export async function attemptInstall(
	deps: Pick<PenvProviderServiceDeps, 'executeCommand' | 'showInformationMessage' | 'getMsg'>
): Promise<void> {
	log('[PenvProviderService] Attempting to install platformio.platformio-ide...', 'info');
	try {
		await deps.executeCommand('workbench.extensions.installExtension', 'platformio.platformio-ide');
		log('[PenvProviderService] platformio.platformio-ide installed successfully', 'info');
	} catch {
		log('[PenvProviderService] platformio.platformio-ide not available, trying pioarduino.pioarduino-ide...', 'info');
		try {
			await deps.executeCommand('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide');
			log('[PenvProviderService] pioarduino.pioarduino-ide installed successfully', 'info');
		} catch {
			log('[PenvProviderService] Both providers failed to install; opening Extensions search', 'warn');
			await deps.executeCommand('workbench.extensions.search', 'platformio');
			const failMsg = await t(
				deps as PenvProviderServiceDeps,
				'PENV_PROVIDER_INSTALL_FAILED',
				'Automatic installation failed. Please install "PlatformIO IDE" (VS Code Marketplace) or "pioarduino" (Open VSX for VSCodium) from the Extensions panel.'
			);
			await deps.showInformationMessage(failMsg);
		}
	}
}

// ─── T008: waitForPenvReady ────────────────────────────────────────────────────

/**
 * 等待 penv 就緒，最多重試 maxRetries 次，每次間隔 intervalMs 毫秒。
 * 每次重試前以 log('info') 記錄進度。
 * 注意：呼叫方在呼叫此函數前應顯示 PENDING 訊息以確保即時回饋（≤3 秒）。
 *
 * @param checkPenvExistsFn penv 存在性檢查函數（可注入以利測試）
 * @param maxRetries 最多重試次數，預設 3
 * @param intervalMs 每次間隔毫秒，預設 3000
 * @param delayFn 可選的延遲函數（預設使用 setTimeout；測試時可注入立即 resolve 版本）
 * @returns true 表示 penv 已就緒；false 表示重試耗盡
 */
export async function waitForPenvReady(
	checkPenvExistsFn: () => boolean,
	maxRetries = 3,
	intervalMs = 3000,
	delayFn: (ms: number) => Promise<void> = ms => new Promise<void>(resolve => setTimeout(resolve, ms))
): Promise<boolean> {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		log(`[PenvProviderService] Waiting for penv (attempt ${attempt}/${maxRetries})...`, 'info');
		await delayFn(intervalMs);
		if (checkPenvExistsFn()) {
			log('[PenvProviderService] penv is now ready', 'info');
			return true;
		}
	}
	log(`[PenvProviderService] penv not ready after ${maxRetries} retries`, 'warn');
	return false;
}

// ─── T009: showInstallNotification ────────────────────────────────────────────

/**
 * 自動安裝 penv provider extension，並以非阻擋式通知告知使用者進行中。
 * 不需要使用者點擊按鈕——直接在背景觸發安裝流程，讓初學者無需理解細節。
 * 安裝失敗時由 attemptInstall() 開啟 Extensions 面板供手動選擇。
 */
export async function showInstallNotification(deps: PenvProviderServiceDeps): Promise<void> {
	log('[PenvProviderService] Auto-installing penv provider — VS Code will show confirmation dialog', 'info');
	// VS Code 的 workbench.extensions.installExtension 會自己顯示確認對話框
	// 不需要在安裝前另外顯示我們自己的通知，避免混淆
	await attemptInstall(deps);
}

// ─── 生產環境預設 deps 工廠 ────────────────────────────────────────────────────

/** LocaleService 的最小介面，避免循環依賴 */
type LocaleServiceLike = {
	getLocalizedMessage: (key: string, fallback?: string) => Promise<string>;
};

/**
 * 建立使用真實 VS Code API 的預設 deps 物件。
 * @param localeService 可選，傳入後 notification 訊息使用當前 UI 語言顯示
 */
export function createDefaultDeps(localeService?: LocaleServiceLike): PenvProviderServiceDeps {
	return {
		getExtension: (id: string) => vscode.extensions.getExtension(id) as { id: string } | undefined,
		executeCommand: (cmd: string, ...args: unknown[]) => vscode.commands.executeCommand(cmd, ...args),
		showInformationMessage: (msg: string, ...items: string[]) =>
			vscode.window.showInformationMessage(msg, ...items),
		checkPenvExists: checkPenvExists,
		getMsg: localeService
			? (key: string, fallback: string) => localeService.getLocalizedMessage(key, fallback)
			: undefined,
	};
}
