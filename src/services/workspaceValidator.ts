/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { detectProjectType } from './projectTypeDetector';
import { SettingsManager } from './settingsManager';
import { LocaleService } from './localeService';
import { log } from './logging';
import {
	WorkspaceValidationResult,
	SafetyGuardDialogResult,
	IWorkspaceValidator,
	PROJECT_TYPE_RULES,
	SETTING_KEY,
	BLOCKLY_FOLDER_NAME,
	MESSAGE_KEYS,
	isValidWorkspacePath,
} from '../types/safetyGuard';

/**
 * VSCode 檔案系統介面（用於依賴注入）
 * 簡化 vscode.workspace.fs.stat 以便於測試
 */
export interface VSCodeFileSystemLike {
	/**
	 * 檢查資料夾是否存在
	 * @param uri 資料夾的 URI
	 * @returns Thenable (Promise-like) 若資料夾存在則 resolve,否則 reject
	 */
	stat(uri: vscode.Uri): Thenable<vscode.FileStat>;
}

/**
 * 工作區驗證器服務 - 協調層
 *
 * 職責:
 * 1. 驗證工作區是否為 Blockly 專案
 * 2. 顯示安全警告對話框(非 Blockly 專案)
 * 3. 管理使用者偏好設定(不再提醒)
 * 4. 協調 ProjectTypeDetector, SettingsManager, LocaleService
 *
 * 設計原則:
 * - 服務層協調器,負責業務邏輯編排
 * - 依賴注入,所有服務通過建構子注入
 * - 符合 SOLID 依賴反轉原則
 */
export class WorkspaceValidator implements IWorkspaceValidator {
	private settingsManager: SettingsManager;
	private localeService: LocaleService;
	private vscodeFs: VSCodeFileSystemLike;

	/**
	 * 建立工作區驗證器實例
	 *
	 * @param workspacePath 工作區的絕對路徑
	 * @param settingsManager 設定管理器(用於讀寫使用者偏好)
	 * @param localeService 多語言服務(用於 i18n 訊息)
	 * @param vscodeFs VSCode 檔案系統(用於測試時注入 mock)
	 */
	constructor(
		private workspacePath: string,
		settingsManager?: SettingsManager,
		localeService?: LocaleService,
		vscodeFs?: VSCodeFileSystemLike
	) {
		// 使用注入的服務或建立預設實例
		this.settingsManager = settingsManager || new SettingsManager(workspacePath);
		this.localeService = localeService || new LocaleService(this.getExtensionPath());
		this.vscodeFs = vscodeFs || vscode.workspace.fs;
	}

	/**
	 * 驗證工作區是否為 Blockly 專案
	 *
	 * 流程:
	 * 1. 檢查工作區路徑有效性
	 * 2. 檢查是否存在 blockly/ 資料夾
	 * 3. 若不存在,偵測專案類型(可能是其他類型專案)
	 * 4. 讀取使用者偏好設定(是否不再提醒)
	 * 5. 決定是否應顯示警告
	 *
	 * @returns WorkspaceValidationResult 驗證結果物件
	 *
	 * @example
	 * ```typescript
	 * const validator = new WorkspaceValidator('/path/to/workspace');
	 * const result = await validator.validateWorkspace();
	 * if (!result.isBlocklyProject && result.shouldShowWarning) {
	 *   const action = await validator.showSafetyWarning(result.projectType);
	 * }
	 * ```
	 */
	async validateWorkspace(): Promise<WorkspaceValidationResult> {
		log('Validating workspace', 'debug', { workspacePath: this.workspacePath });

		// 驗證工作區路徑
		if (!isValidWorkspacePath(this.workspacePath)) {
			log('Invalid workspace path', 'warn', { workspacePath: this.workspacePath });
			return {
				isBlocklyProject: false,
				projectType: undefined,
				shouldShowWarning: false,
				suppressWarning: false,
				workspacePath: this.workspacePath,
			};
		}

		// 檢查 blockly/ 資料夾是否存在
		const blocklyFolderPath = path.join(this.workspacePath, BLOCKLY_FOLDER_NAME);
		try {
			await this.vscodeFs.stat(vscode.Uri.file(blocklyFolderPath));
			// 若已是 Blockly 專案,直接返回
			log('Workspace is a Blockly project', 'info', { workspacePath: this.workspacePath });
			return {
				isBlocklyProject: true,
				projectType: undefined,
				shouldShowWarning: false,
				suppressWarning: false,
				workspacePath: this.workspacePath,
			};
		} catch {
			// blockly/ 資料夾不存在,繼續偵測專案類型
		}

		// 偵測專案類型
		const projectType = detectProjectType(this.workspacePath, PROJECT_TYPE_RULES);
		log('Project type detected', 'debug', { projectType });

		// 讀取使用者偏好設定
		const suppressWarning = await this.getUserPreference();
		log('User preference loaded', 'debug', { suppressWarning });

		// 決定是否應顯示警告(非 Blockly 專案 且 使用者未選擇不再提醒)
		const shouldShowWarning = !suppressWarning;

		return {
			isBlocklyProject: false,
			projectType,
			shouldShowWarning,
			suppressWarning,
			workspacePath: this.workspacePath,
		};
	}

	/**
	 * 顯示安全警告對話框
	 *
	 * 設計:
	 * - 三按鈕設計: "繼續" / "取消" / "不再提醒"
	 * - 根據專案類型動態產生訊息(有類型 vs 無類型)
	 * - 模態對話框,確保使用者明確選擇
	 *
	 * @param projectType 偵測到的專案類型(可選)
	 * @returns SafetyGuardDialogResult 使用者的選擇
	 *
	 * @example
	 * ```typescript
	 * const action = await validator.showSafetyWarning('Node.js');
	 * if (action === 'cancel') {
	 *   // 使用者取消操作
	 * } else if (action === 'suppress') {
	 *   // 使用者選擇不再提醒
	 *   await validator.saveUserPreference(true);
	 * }
	 * ```
	 */
	async showSafetyWarning(projectType?: string): Promise<SafetyGuardDialogResult> {
		log('Showing safety warning dialog', 'debug', { projectType });

		try {
			// 根據是否有專案類型選擇訊息模板
			const messageKey = projectType ? MESSAGE_KEYS.SAFETY_WARNING_BODY_WITH_TYPE : MESSAGE_KEYS.SAFETY_WARNING_BODY_NO_TYPE;

			// 取得訊息內容 (await 非同步呼叫，帶英文 fallback)
			let message = await this.localeService.getLocalizedMessage(messageKey, this.getFallbackMessage(messageKey));

			// 如果有專案類型,替換占位符 {0}
			if (projectType) {
				message = message.replace('{0}', projectType);
			}

			// 按鈕文字 (await 非同步呼叫，帶英文 fallback)
			// 注意: modal 對話框會自動提供預設的取消按鈕,不需要額外添加
			const continueButton = await this.localeService.getLocalizedMessage(MESSAGE_KEYS.BUTTON_CONTINUE, 'Continue');
			const suppressButton = await this.localeService.getLocalizedMessage(MESSAGE_KEYS.BUTTON_SUPPRESS, 'Do Not Remind');

			// 顯示模態對話框 (使用者按 ESC 或關閉視窗會返回 undefined,視為取消)
			const selection = await vscode.window.showWarningMessage(message, { modal: true }, continueButton, suppressButton);

			// 解析使用者選擇
			if (selection === continueButton) {
				log('User chose to continue', 'info', { projectType });
				return 'continue';
			} else if (selection === suppressButton) {
				log('User chose to suppress warnings', 'info', { projectType });
				return 'suppress';
			} else {
				// 包含按 ESC 或點擊 X 關閉
				log('User chose to cancel', 'info', { projectType });
				return 'cancel';
			}
		} catch (error) {
			// LocaleService 失敗時使用硬編碼的後備訊息（英文）
			log('Error loading localized messages, using fallback', 'warn', { error });

			// 後備訊息（英文）
			const fallbackMessage = projectType
				? `Detected ${projectType} project. Opening the editor in a non-Blockly project may cause file loss. Do you want to continue?`
				: 'This may not be a Blockly project. Opening the editor in a non-Blockly project may cause file loss. Do you want to continue?';

			// 注意: modal 對話框會自動提供預設的取消按鈕,不需要額外添加
			const selection = await vscode.window.showWarningMessage(fallbackMessage, { modal: true }, 'Continue', 'Do Not Remind');

			// 解析使用者選擇 (硬編碼比對)
			if (selection === 'Continue') {
				return 'continue';
			} else if (selection === 'Do Not Remind') {
				return 'suppress';
			} else {
				// undefined: 使用者點擊預設取消按鈕或按 ESC
				return 'cancel';
			}
		}
	}

	/**
	 * 讀取使用者偏好設定(是否不再提醒)
	 *
	 * @returns true 表示不再提醒, false 表示仍需提醒
	 */
	async getUserPreference(): Promise<boolean> {
		try {
			const suppressWarning = await this.settingsManager.readSetting<boolean>(SETTING_KEY, false);
			log('User preference retrieved', 'debug', { suppressWarning });
			return suppressWarning;
		} catch (error) {
			log('Error reading user preference', 'error', { error });
			// 錯誤時預設為 false(需要提醒)
			return false;
		}
	}

	/**
	 * 儲存使用者偏好設定(是否不再提醒)
	 *
	 * @param suppress true 表示不再提醒, false 表示仍需提醒
	 */
	async saveUserPreference(suppress: boolean): Promise<void> {
		try {
			await this.settingsManager.updateSetting(SETTING_KEY, suppress);
			log('User preference saved', 'info', { suppress });
		} catch (error) {
			log('Error saving user preference', 'error', { error });
			throw error;
		}
	}

	/**
	 * 取得擴充功能路徑(用於 LocaleService)
	 *
	 * @returns 擴充功能的絕對路徑
	 */
	private getExtensionPath(): string {
		// 在測試環境中可能無法取得擴充功能實例,返回預設路徑
		const extension = vscode.extensions.getExtension('singularBlockly.singular-blockly');
		return extension?.extensionPath || process.cwd();
	}

	/**
	 * 取得訊息的後備文字（當 i18n 失敗時使用）
	 *
	 * @param key 訊息鍵名
	 * @returns 英文後備訊息
	 */
	private getFallbackMessage(key: string): string {
		// 使用英文作為後備語言，符合 i18n 最佳實踐
		const fallbackMessages: Record<string, string> = {
			[MESSAGE_KEYS.SAFETY_WARNING_BODY_NO_TYPE]:
				'This project does not have Blockly blocks yet. If you continue, blockly folder and files will be created here. Do you want to continue?',
			[MESSAGE_KEYS.SAFETY_WARNING_BODY_WITH_TYPE]:
				'Detected {0} project. This project does not have Blockly blocks yet. If you continue, blockly folder and files will be created here. Do you want to continue?',
			[MESSAGE_KEYS.BUTTON_CONTINUE]: 'Continue',
			[MESSAGE_KEYS.BUTTON_CANCEL]: 'Cancel',
			[MESSAGE_KEYS.BUTTON_SUPPRESS]: 'Do Not Remind',
		};
		return fallbackMessages[key] || key;
	}
}
