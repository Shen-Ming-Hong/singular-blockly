"use strict";
/**
 * 專案安全防護機制 - TypeScript 合約定義
 *
 * Feature: 010-project-safety-guard
 * Purpose: 定義功能的 TypeScript 介面、類型別名與常數
 *
 * 使用方式:
 * 1. 開發階段參考此檔案定義介面結構
 * 2. 實作時複製介面到對應的 service 檔案
 * 3. 不需要在實際專案中 import 此檔案(僅供規格參考)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_KEYS = exports.BLOCKLY_FOLDER_NAME = exports.SETTING_KEY = exports.PROJECT_TYPE_RULES = void 0;
exports.isValidWorkspacePath = isValidWorkspacePath;
exports.validateProjectTypeRules = validateProjectTypeRules;
exports.isSafetyGuardDialogResult = isSafetyGuardDialogResult;
exports.isWorkspaceValidationResult = isWorkspaceValidationResult;
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
exports.PROJECT_TYPE_RULES = [
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
exports.SETTING_KEY = 'singularBlockly.safetyGuard.suppressWarning';
/**
 * Blockly 專案識別資料夾名稱
 */
exports.BLOCKLY_FOLDER_NAME = 'blockly';
// ============================================================================
// Message Keys (i18n)
// ============================================================================
/**
 * 國際化訊息鍵名清單
 *
 * 需在 media/locales/{lang}/messages.js 中定義對應訊息
 */
exports.MESSAGE_KEYS = {
    /** 警告對話框標題 */
    SAFETY_WARNING_TITLE: 'SAFETY_WARNING_TITLE',
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
};
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
function isValidWorkspacePath(workspacePath) {
    return (typeof workspacePath === 'string' &&
        workspacePath.length > 0 &&
        // 檢查是否為絕對路徑(Windows: C:/, Linux/macOS: /)
        (workspacePath.startsWith('/') || /^[a-zA-Z]:[/\\]/.test(workspacePath)));
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
function validateProjectTypeRules(rules) {
    if (!Array.isArray(rules) || rules.length === 0) {
        return '規則陣列不可為空';
    }
    const priorities = new Set();
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
function isSafetyGuardDialogResult(value) {
    return value === 'continue' || value === 'cancel' || value === 'suppress';
}
/**
 * 檢查是否為有效的 WorkspaceValidationResult
 */
function isWorkspaceValidationResult(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const obj = value;
    return (typeof obj.isBlocklyProject === 'boolean' &&
        (obj.projectType === undefined || typeof obj.projectType === 'string') &&
        typeof obj.shouldShowWarning === 'boolean' &&
        typeof obj.suppressWarning === 'boolean' &&
        typeof obj.workspacePath === 'string');
}
//# sourceMappingURL=projectSafetyGuard.js.map