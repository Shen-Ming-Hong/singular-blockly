/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { log } from './logging';

/**
 * PenvProviderService 的依賴注入介面，使所有 VS Code API 呼叫可在測試中替換。
 */
export interface PenvProviderServiceDeps {
	getExtension: (id: string) => { id: string } | undefined;
	executeCommand: (cmd: string, ...args: unknown[]) => Thenable<unknown>;
	showInformationMessage: (msg: string, ...items: string[]) => Thenable<string | undefined>;
	/** 可選：i18n 訊息查找函數，返回當前 UI 語言的翻譯字串 */
	getMsg?: (key: string, fallback: string) => Promise<string>;
}

/** 支援的 penv provider extension ID */
const PROVIDER_IDS = ['platformio.platformio-ide', 'pioarduino.pioarduino-ide'] as const;

export type ProviderInstallResult =
	| { status: 'installed'; providerId: (typeof PROVIDER_IDS)[number] }
	| { status: 'manual-required' };

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
		'PlatformIO provider was installed. Reload VS Code to initialize the environment.'
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
 * 嘗試安裝 penv provider extension。
 * 安裝順序：platformio.platformio-ide → pioarduino.pioarduino-ide → 開啟 Extensions 面板。
 */
export async function attemptInstall(
	deps: Pick<PenvProviderServiceDeps, 'executeCommand' | 'showInformationMessage' | 'getMsg'>
): Promise<ProviderInstallResult> {
	log('[PenvProviderService] Attempting to install platformio.platformio-ide...', 'info');
	try {
		await deps.executeCommand('workbench.extensions.installExtension', 'platformio.platformio-ide');
		log('[PenvProviderService] platformio.platformio-ide installed successfully', 'info');
		return { status: 'installed', providerId: 'platformio.platformio-ide' };
	} catch {
		log('[PenvProviderService] platformio.platformio-ide not available, trying pioarduino.pioarduino-ide...', 'info');
		try {
			await deps.executeCommand('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide');
			log('[PenvProviderService] pioarduino.pioarduino-ide installed successfully', 'info');
			return { status: 'installed', providerId: 'pioarduino.pioarduino-ide' };
		} catch {
			log('[PenvProviderService] Both providers failed to install; opening Extensions search', 'warn');
			await deps.executeCommand('workbench.extensions.search', 'platformio');
			const failMsg = await t(
				deps as PenvProviderServiceDeps,
				'PENV_PROVIDER_INSTALL_FAILED',
				'Automatic installation failed. Please install "PlatformIO IDE" (VS Code Marketplace) or "pioarduino" (Open VSX for VSCodium) from the Extensions panel.'
			);
			await deps.showInformationMessage(failMsg);
			return { status: 'manual-required' };
		}
	}
}

// ─── T009: showInstallNotification ────────────────────────────────────────────

/**
 * 自動安裝 penv provider extension；安裝前不顯示自訂確認通知。
 * 不需要使用者點擊按鈕——直接在背景觸發安裝流程，讓初學者無需理解細節。
 * 安裝失敗時由 attemptInstall() 開啟 Extensions 面板供手動選擇。
 */
export async function showInstallNotification(deps: PenvProviderServiceDeps): Promise<void> {
	log('[PenvProviderService] Auto-installing penv provider', 'info');
	const result = await attemptInstall(deps);
	if (result.status === 'installed') {
		try {
			log(`[PenvProviderService] Opening PlatformIO Home for ${result.providerId}`, 'info');
			await deps.executeCommand('platformio-ide.showHome');
		} catch {
			log(
				`[PenvProviderService] Failed to open PlatformIO Home for ${result.providerId}; continuing with reload prompt`,
				'warn'
			);
		}
		await showReloadButton(deps);
	}
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
			getMsg: localeService
			? (key: string, fallback: string) => localeService.getLocalizedMessage(key, fallback)
			: undefined,
	};
}
