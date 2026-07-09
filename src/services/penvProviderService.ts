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
	/** 可選：輪詢延遲函數（預設使用 setTimeout；測試時注入立即 resolve 版本）*/
	pollingDelayFn?: (ms: number) => Promise<void>;
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
 *
 * ⚠️ 注意：python 在 venv 建立初期就會出現（PlatformIO Core 安裝尚未完成）。
 * 若需確認 Core 是否完全就緒，應使用 checkPioReady()。
 */
export function checkPenvExists(): boolean {
	const homeDir = os.homedir();
	const pythonPath =
		process.platform === 'win32'
			? path.join(homeDir, '.platformio', 'penv', 'Scripts', 'python.exe')
			: path.join(homeDir, '.platformio', 'penv', 'bin', 'python');
	return fs.existsSync(pythonPath);
}

/**
 * 確認 PlatformIO CLI（pio）是否已安裝完成。
 * pio 只有在 `pip install platformio` 完成後才會出現，比 python 更晚，
 * 是判斷 PlatformIO Core 真正就緒的可靠指標。
 */
function checkPioReady(): boolean {
	const homeDir = os.homedir();
	const pioPath =
		process.platform === 'win32'
			? path.join(homeDir, '.platformio', 'penv', 'Scripts', 'pio.exe')
			: path.join(homeDir, '.platformio', 'penv', 'bin', 'pio');
	return fs.existsSync(pioPath);
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
 * 顯示「立即重新載入」按鈕并在使用者點擊後呼叫 reloadWindow。
 */
async function showReloadButton(
	deps: Pick<PenvProviderServiceDeps, 'executeCommand' | 'showInformationMessage' | 'getMsg'>
): Promise<void> {
	const reloadMsg = await t(
		deps as PenvProviderServiceDeps,
		'PENV_PROVIDER_RELOAD_REQUIRED',
		'PlatformIO environment is ready. Reload VS Code now to complete setup.'
	);
	const reloadBtn = await t(
		deps as PenvProviderServiceDeps,
		'PENV_PROVIDER_RELOAD_BUTTON',
		'Reload Now'
	);
	const choice = await deps.showInformationMessage(reloadMsg, reloadBtn);
	if (choice === reloadBtn) {
		await deps.executeCommand('workbench.action.reloadWindow');
	}
}

/**
 * 安裝完成後等待 PlatformIO Core 建立 penv，完成後顯示「立即重新載入」按鈕。
 * - penv 已存在（重新安裝情境）→ 立即顯示按鈕
 * - penv 尚不存在（首次安裝，Core 正在下載）→ 顯示等待訊息，輪詢到 penv 出現，
 *   再顯示按鈕（最多等待 20 分鐘）
 */
async function waitAndShowReload(deps: PenvProviderServiceDeps): Promise<void> {
	// 使用 checkPioReady()（檢查 pio 執行檔），而非 checkPenvExists()（檢查 python）
	// 原因：python 在 venv 建立初期就出現，pio 才是 pip install platformio 完成的標誌
	if (checkPioReady()) {
		await showReloadButton(deps);
		return;
	}
	// PlatformIO Core 正在下載，顯示等待訊息
	log('[PenvProviderService] PlatformIO Core downloading; polling for pio executable (up to 20 min)...', 'info');
	void deps.showInformationMessage(
		"PlatformIO IDE is downloading its core components (this may take a few minutes). A 'Reload Now' button will appear automatically when ready."
	);
	// 輪詢 pio 出現，使用 deps.pollingDelayFn 以利測試
	const pollingDelay =
		deps.pollingDelayFn ?? ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
	const ready = await waitForPenvReady(checkPioReady, 120, 10000, pollingDelay);
	if (ready) {
		log('[PenvProviderService] pio ready after Core install; showing reload button', 'info');
		await showReloadButton(deps);
	} else {
		log('[PenvProviderService] Timed out waiting for pio after Core install', 'warn');
		void deps.showInformationMessage(
			'PlatformIO Core setup is taking longer than expected. Please reload VS Code manually when the installation completes.'
		);
	}
}

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
		// 重新載入處理由 showInstallNotification 呼叫 waitAndShowReload 統一處理
	} catch {
		log('[PenvProviderService] platformio.platformio-ide not available, trying pioarduino.pioarduino-ide...', 'info');
		try {
			await deps.executeCommand('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide');
			log('[PenvProviderService] pioarduino.pioarduino-ide installed successfully', 'info');
			// 重新載入處理由 showInstallNotification 呼叫 waitAndShowReload 統一處理
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
		// 先檢查，就緒則立即回傳，不浪費等待時間
		if (checkPenvExistsFn()) {
			log('[PenvProviderService] penv is now ready', 'info');
			return true;
		}
		log(`[PenvProviderService] Waiting for penv (attempt ${attempt}/${maxRetries})...`, 'info');
		// 最後一次不再等待，避免多等一個周期
		if (attempt < maxRetries) {
			await delayFn(intervalMs);
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
	await attemptInstall(deps);	// 安裝完成後，輪詢等待 penv 建立，就緒後自動顯示「立即重新載入」按鈕
	await waitAndShowReload(deps);}

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
