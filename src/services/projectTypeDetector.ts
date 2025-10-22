/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import * as fs from 'fs';
import { ProjectTypeRule } from '../types/safetyGuard';
import { log } from './logging';

/**
 * 檔案系統介面（用於依賴注入）
 * 與 FileService 保持一致的介面設計
 */
export interface FileSystemLike {
	existsSync(path: string): boolean;
}

/**
 * 專案類型偵測器 - 純函數模組
 * 職責:
 * 1. 根據規則偵測工作區的專案類型
 * 2. 使用優先級排序規則(priority 1-6)
 * 3. 檢查檔案存在性以判斷專案類型
 *
 * 設計原則:
 * - 純函數設計,所有依賴通過參數注入
 * - 無副作用,易於測試
 * - 符合 SOLID 單一職責原則
 */

/**
 * 偵測工作區的專案類型
 *
 * 演算法:
 * 1. 驗證工作區路徑有效性
 * 2. 按優先級排序規則(由小到大,1最高)
 * 3. 遍歷規則,檢查對應檔案是否存在
 * 4. 返回第一個匹配的專案類型或 undefined
 *
 * @param workspacePath 工作區的絕對路徑
 * @param rules 專案類型規則陣列(來自 PROJECT_TYPE_RULES)
 * @param fileSystem 檔案系統介面(可選,用於測試注入)
 * @returns 偵測到的專案類型字串,若無匹配則返回 undefined
 *
 * @example
 * ```typescript
 * const rules = PROJECT_TYPE_RULES;
 * const type = detectProjectType('/path/to/workspace', rules);
 * if (type === 'Node.js') {
 *   console.log('這是 Node.js 專案');
 * }
 * ```
 */
export function detectProjectType(
	workspacePath: string,
	rules: readonly ProjectTypeRule[],
	fileSystem: FileSystemLike = fs
): string | undefined {
	// 驗證輸入參數
	if (!workspacePath || typeof workspacePath !== 'string') {
		log('detectProjectType: Invalid workspacePath', 'warn', { workspacePath });
		return undefined;
	}

	if (!Array.isArray(rules) || rules.length === 0) {
		log('detectProjectType: Invalid or empty rules array', 'warn', { rulesCount: rules?.length });
		return undefined;
	}

	// 記錄偵測開始
	log('Detecting project type', 'debug', { workspacePath, rulesCount: rules.length });

	try {
		// 檢查工作區路徑是否存在
		if (!fileSystem.existsSync(workspacePath)) {
			log('detectProjectType: Workspace path does not exist', 'warn', { workspacePath });
			return undefined;
		}

		// 按優先級排序規則(priority 越小越優先)
		const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

		// 遍歷排序後的規則
		for (const rule of sortedRules) {
			// 檢查該規則的任一檔案是否存在 (OR 邏輯)
			const anyFileExists = rule.files.some((file: string) => {
				const fullPath = path.join(workspacePath, file);
				const exists = fileSystem.existsSync(fullPath);
				log('Checking file existence', 'debug', { file, exists, fullPath });
				return exists;
			});

			// 如果任一檔案存在,返回該專案類型
			if (anyFileExists) {
				log('Project type detected', 'info', { type: rule.type, priority: rule.priority, files: rule.files });
				return rule.type;
			}
		}

		// 無匹配專案類型
		log('No project type detected', 'debug', { workspacePath });
		return undefined;
	} catch (error) {
		log('Error detecting project type', 'error', { workspacePath, error });
		return undefined;
	}
}
