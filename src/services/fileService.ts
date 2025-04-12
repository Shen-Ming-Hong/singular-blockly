/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { log } from './logging';

/**
 * 檔案操作服務類別
 * 負責所有專案中的檔案讀寫操作
 */
export class FileService {
	/**
	 * 建立檔案服務實例
	 * @param workspacePath 工作區路徑
	 */
	constructor(private workspacePath: string) {}

	/**
	 * 寫入檔案內容，如果目錄不存在會自動建立
	 * @param relativePath 相對於工作區的檔案路徑
	 * @param content 檔案內容
	 */
	async writeFile(relativePath: string, content: string): Promise<void> {
		try {
			const fullPath = path.join(this.workspacePath, relativePath);
			const dirPath = path.dirname(fullPath);

			if (!fs.existsSync(dirPath)) {
				await fs.promises.mkdir(dirPath, { recursive: true });
			}

			await fs.promises.writeFile(fullPath, content);
			log(`File written successfully: ${relativePath}`, 'info');
		} catch (error) {
			log(`Failed to write file: ${relativePath}`, 'error', error);
			throw error;
		}
	}

	/**
	 * 讀取檔案內容
	 * @param relativePath 相對於工作區的檔案路徑
	 * @param defaultContent 若檔案不存在時的預設內容
	 * @returns 檔案內容或預設內容
	 */
	async readFile(relativePath: string, defaultContent: string = ''): Promise<string> {
		try {
			const fullPath = path.join(this.workspacePath, relativePath);

			if (!fs.existsSync(fullPath)) {
				return defaultContent;
			}

			return await fs.promises.readFile(fullPath, 'utf8');
		} catch (error) {
			log(`Failed to read file: ${relativePath}`, 'error', error);
			return defaultContent;
		}
	}

	/**
	 * 檢查檔案是否存在
	 * @param relativePath 相對於工作區的檔案路徑
	 * @returns 檔案是否存在
	 */
	fileExists(relativePath: string): boolean {
		const fullPath = path.join(this.workspacePath, relativePath);
		return fs.existsSync(fullPath);
	}

	/**
	 * 建立目錄
	 * @param relativePath 相對於工作區的目錄路徑
	 */
	async createDirectory(relativePath: string): Promise<void> {
		try {
			const fullPath = path.join(this.workspacePath, relativePath);

			if (!fs.existsSync(fullPath)) {
				await fs.promises.mkdir(fullPath, { recursive: true });
				log(`Directory created: ${relativePath}`, 'info');
			}
		} catch (error) {
			log(`Failed to create directory: ${relativePath}`, 'error', error);
			throw error;
		}
	}

	/**
	 * 複製檔案
	 * @param sourceRelativePath 來源檔案的相對路徑
	 * @param destRelativePath 目標檔案的相對路徑
	 */
	async copyFile(sourceRelativePath: string, destRelativePath: string): Promise<void> {
		try {
			const sourcePath = path.join(this.workspacePath, sourceRelativePath);
			const destPath = path.join(this.workspacePath, destRelativePath);
			const destDir = path.dirname(destPath);

			// 確保目標目錄存在
			if (!fs.existsSync(destDir)) {
				await fs.promises.mkdir(destDir, { recursive: true });
			}

			await fs.promises.copyFile(sourcePath, destPath);
			log(`File copied from ${sourceRelativePath} to ${destRelativePath}`, 'info');
		} catch (error) {
			log(`Failed to copy file from ${sourceRelativePath} to ${destRelativePath}`, 'error', error);
			throw error;
		}
	}

	/**
	 * 刪除檔案
	 * @param relativePath 相對於工作區的檔案路徑
	 */
	async deleteFile(relativePath: string): Promise<void> {
		try {
			const fullPath = path.join(this.workspacePath, relativePath);

			if (fs.existsSync(fullPath)) {
				await fs.promises.unlink(fullPath);
				log(`File deleted: ${relativePath}`, 'info');
			}
		} catch (error) {
			log(`Failed to delete file: ${relativePath}`, 'error', error);
			throw error;
		}
	}

	/**
	 * 列出目錄中的檔案
	 * @param relativePath 相對於工作區的目錄路徑
	 * @returns 檔案名稱列表
	 */
	async listFiles(relativePath: string): Promise<string[]> {
		try {
			const fullPath = path.join(this.workspacePath, relativePath);

			if (!fs.existsSync(fullPath)) {
				return [];
			}

			return await fs.promises.readdir(fullPath);
		} catch (error) {
			log(`Failed to list files in directory: ${relativePath}`, 'error', error);
			return [];
		}
	}

	/**
	 * 讀取 JSON 檔案並解析
	 * @param relativePath 相對於工作區的 JSON 檔案路徑
	 * @param defaultValue 若檔案不存在或解析失敗時的預設值
	 * @returns 解析後的 JSON 物件
	 */
	async readJsonFile<T>(relativePath: string, defaultValue: T): Promise<T> {
		try {
			const content = await this.readFile(relativePath);

			if (!content) {
				return defaultValue;
			}

			return JSON.parse(content) as T;
		} catch (error) {
			log(`Failed to parse JSON file: ${relativePath}`, 'error', error);
			return defaultValue;
		}
	}

	/**
	 * 寫入 JSON 檔案
	 * @param relativePath 相對於工作區的檔案路徑
	 * @param data 要儲存的 JSON 資料
	 * @param pretty 是否美化 JSON (預設為 true)
	 */
	async writeJsonFile<T>(relativePath: string, data: T, pretty: boolean = true): Promise<void> {
		try {
			const jsonString = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

			await this.writeFile(relativePath, jsonString);
		} catch (error) {
			log(`Failed to write JSON file: ${relativePath}`, 'error', error);
			throw error;
		}
	}

	/**
	 * 獲取檔案的時間戳信息
	 * @param relativePath 相對於工作區的檔案路徑
	 * @returns 包含創建時間、最後修改時間等的物件，若檔案不存在則返回 null
	 */
	async getFileStats(relativePath: string): Promise<fs.Stats | null> {
		try {
			const fullPath = path.join(this.workspacePath, relativePath);

			if (!fs.existsSync(fullPath)) {
				return null;
			}

			return await fs.promises.stat(fullPath);
		} catch (error) {
			log(`Failed to get file stats: ${relativePath}`, 'error', error);
			return null;
		}
	}
}
