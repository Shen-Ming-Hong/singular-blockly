/**
 * 專案安全防護機制 - TypeScript 型別定義
 *
 * Feature: 010-project-safety-guard
 * Purpose: 定義功能的 TypeScript 介面、類型別名與常數
 */

// ============================================================================
// Core Data Types
// ============================================================================

/**
 * 工作區驗證結果
 */
export interface WorkspaceValidationResult {
	/** 是否為 Blockly 專案(有 blockly/ 資料夾) */
	isBlocklyProject: boolean;

	/** 偵測到的專案類型(僅在非 Blockly 專案時有值) */
	projectType?: string;

	/** 是否應顯示警告對話框 */
	shouldShowWarning: boolean;

	/** 使用者是否已設定不再顯示警告 */
	suppressWarning: boolean;

	/** 工作區根路徑(絕對路徑) */
	workspacePath: string;
}

/**
 * 專案類型識別規則
 */
export interface ProjectTypeRule {
	/** 專案類型名稱(顯示用,如 'Node.js', 'Python') */
	type: string;

	/** 識別檔案名稱陣列(OR 邏輯,任一檔案存在即符合) */
	files: string[];

	/** 優先級(數字越小優先級越高,用於排序) */
	priority: number;
}

/**
 * 使用者對安全警告對話框的回應
 */
export type SafetyGuardDialogResult =
	| 'continue' // 使用者點擊「繼續」
	| 'cancel' // 使用者點擊「取消」或關閉對話框
	| 'suppress'; // 使用者點擊「不再提醒」

// ============================================================================
// Service Contracts
// ============================================================================

/**
 * 工作區驗證器服務
 *
 * 職責: 檢查工作區狀態、讀取使用者偏好設定、協調驗證流程
 */
export interface IWorkspaceValidator {
	/**
	 * 驗證工作區是否為 Blockly 專案
	 *
	 * @param workspacePath - 工作區根路徑(絕對路徑)
	 * @returns 驗證結果物件
	 *
	 * @throws Error - 當工作區路徑無效或無法存取時
	 *
	 * @example
	 * const result = await validator.validateWorkspace('E:/my-project');
	 * if (result.shouldShowWarning) {
	 *   // 顯示警告對話框
	 * }
	 */
	validateWorkspace(workspacePath: string): Promise<WorkspaceValidationResult>;

	/**
	 * 顯示安全警告對話框
	 *
	 * @param projectType - 偵測到的專案類型名稱
	 * @returns 使用者選擇結果
	 *
	 * @example
	 * const choice = await validator.showSafetyWarning('Node.js');
	 * if (choice === 'suppress') {
	 *   await validator.saveUserPreference(workspacePath, true);
	 * }
	 */
	showSafetyWarning(projectType?: string): Promise<SafetyGuardDialogResult>;

	/**
	 * 儲存使用者偏好設定
	 *
	 * @param suppress - 是否抑制警告
	 * @returns Promise<void>
	 *
	 * @remarks
	 * workspacePath 已在建構子注入,不需再傳入
	 */
	saveUserPreference(suppress: boolean): Promise<void>;

	/**
	 * 讀取使用者偏好設定
	 *
	 * @returns 是否抑制警告(讀取失敗時返回 false)
	 *
	 * @remarks
	 * workspacePath 已在建構子注入,不需再傳入
	 */
	getUserPreference(): Promise<boolean>;
}

/**
 * 專案類型偵測器(純函數介面)
 *
 * 職責: 根據檔案存在性判斷專案類型
 */
export interface IProjectTypeDetector {
	/**
	 * 偵測專案類型
	 *
	 * @param workspacePath - 工作區根路徑
	 * @param rules - 專案類型識別規則陣列
	 * @returns 偵測到的專案類型名稱,未偵測到時返回 undefined
	 *
	 * @remarks
	 * - 按 priority 由小到大排序檢查
	 * - 找到第一個符合規則即返回,不繼續檢查後續規則
	 * - 支援萬用字元檔名(如 *.csproj)
	 *
	 * @example
	 * const projectType = detectProjectType('E:/my-app', PROJECT_TYPE_RULES);
	 * if (projectType) {
	 *   console.log(`偵測到 ${projectType} 專案`);
	 * }
	 */
	detectProjectType(workspacePath: string, rules: readonly ProjectTypeRule[]): string | undefined;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 專案類型識別規則清單
 *
 * 規則說明:
 * - 按 priority 由小到大排序檢查
 * - files 陣列為 OR 邏輯(任一檔案存在即符合)
 * - 支援萬用字元(如 *.csproj)
 */
export const PROJECT_TYPE_RULES: readonly ProjectTypeRule[] = [
	{
		type: 'Node.js',
		files: ['package.json'],
		priority: 1,
	},
	{
		type: 'Python',
		files: ['requirements.txt', 'setup.py', 'pyproject.toml'],
		priority: 2,
	},
	{
		type: 'Java Maven',
		files: ['pom.xml'],
		priority: 3,
	},
	{
		type: 'Java Gradle',
		files: ['build.gradle', 'build.gradle.kts'],
		priority: 4,
	},
	{
		type: '.NET',
		files: ['*.csproj', '*.sln'],
		priority: 5,
	},
	{
		type: 'Go',
		files: ['go.mod'],
		priority: 6,
	},
];

/**
 * VSCode 設定鍵名
 */
export const SETTING_KEY = 'singularBlockly.safetyGuard.suppressWarning';

/**
 * Blockly 專案識別資料夾名稱
 */
export const BLOCKLY_FOLDER_NAME = 'blockly';

// ============================================================================
// Message Keys (i18n)
// ============================================================================

/**
 * 國際化訊息鍵名清單
 *
 * 需在 media/locales/{lang}/messages.js 中定義對應訊息
 */
export const MESSAGE_KEYS = {
	/** 警告對話框內容(無專案類型) */
	SAFETY_WARNING_BODY_NO_TYPE: 'SAFETY_WARNING_BODY_NO_TYPE',

	/** 警告對話框內容(有專案類型) */
	SAFETY_WARNING_BODY_WITH_TYPE: 'SAFETY_WARNING_BODY_WITH_TYPE',

	/** 「繼續」按鈕文字 */
	BUTTON_CONTINUE: 'BUTTON_CONTINUE',

	/** 「取消」按鈕文字 */
	BUTTON_CANCEL: 'BUTTON_CANCEL',

	/** 「不再提醒」按鈕文字 */
	BUTTON_SUPPRESS: 'BUTTON_SUPPRESS',
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * 驗證工作區路徑是否有效
 *
 * @param workspacePath - 待驗證的路徑
 * @returns 有效返回 true,無效返回 false
 *
 * @example
 * if (!isValidWorkspacePath(path)) {
 *   throw new Error('工作區路徑無效');
 * }
 */
export function isValidWorkspacePath(workspacePath: string): boolean {
	return (
		typeof workspacePath === 'string' &&
		workspacePath.length > 0 &&
		// 檢查是否為絕對路徑(Windows: C:/, Linux/macOS: /)
		(workspacePath.startsWith('/') || /^[a-zA-Z]:[/\\]/.test(workspacePath))
	);
}

/**
 * 驗證專案類型規則陣列的有效性
 *
 * @param rules - 規則陣列
 * @returns 有效返回 true,無效返回錯誤訊息
 *
 * @example
 * const validation = validateProjectTypeRules(rules);
 * if (validation !== true) {
 *   console.error(validation); // 錯誤訊息
 * }
 */
export function validateProjectTypeRules(rules: readonly ProjectTypeRule[]): true | string {
	if (!Array.isArray(rules) || rules.length === 0) {
		return '規則陣列不可為空';
	}

	const priorities = new Set<number>();

	for (const rule of rules) {
		// 檢查必要欄位
		if (!rule.type || typeof rule.type !== 'string') {
			return `規則缺少有效的 type 欄位: ${JSON.stringify(rule)}`;
		}

		if (!Array.isArray(rule.files) || rule.files.length === 0) {
			return `規則 ${rule.type} 缺少有效的 files 陣列`;
		}

		if (typeof rule.priority !== 'number' || rule.priority < 1) {
			return `規則 ${rule.type} 的 priority 必須為正整數`;
		}

		// 檢查 priority 唯一性
		if (priorities.has(rule.priority)) {
			return `規則 ${rule.type} 的 priority ${rule.priority} 重複`;
		}
		priorities.add(rule.priority);
	}

	return true;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * 檢查是否為有效的 SafetyGuardDialogResult
 */
export function isSafetyGuardDialogResult(value: unknown): value is SafetyGuardDialogResult {
	return value === 'continue' || value === 'cancel' || value === 'suppress';
}

/**
 * 檢查是否為有效的 WorkspaceValidationResult
 */
export function isWorkspaceValidationResult(value: unknown): value is WorkspaceValidationResult {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const obj = value as Record<string, unknown>;

	return (
		typeof obj.isBlocklyProject === 'boolean' &&
		(obj.projectType === undefined || typeof obj.projectType === 'string') &&
		typeof obj.shouldShowWarning === 'boolean' &&
		typeof obj.suppressWarning === 'boolean' &&
		typeof obj.workspacePath === 'string'
	);
}
