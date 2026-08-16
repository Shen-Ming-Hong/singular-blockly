/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { log } from './logging';

function fileErrorDetails(error: unknown): { code: string } {
	return {
		code: typeof error === 'object' && error !== null && 'code' in error
			? String((error as NodeJS.ErrnoException).code ?? 'unknown')
			: 'unknown',
	};
}

/**
 * 檔案系統介面（用於依賴注入）
 */
export interface FileSystem {
	existsSync(path: string): boolean;
	promises: {
		mkdir(path: string, options?: any): Promise<string | void>;
		writeFile(path: string, content: string | Uint8Array): Promise<void>;
		readFile(path: string, encoding?: BufferEncoding): Promise<string | Buffer>;
		copyFile(src: string, dest: string): Promise<void>;
		unlink(path: string): Promise<void>;
		readdir(path: string): Promise<string[]>;
		stat(path: string): Promise<fs.Stats>;
		realpath?(path: string): Promise<string>;
		rename?(oldPath: string, newPath: string): Promise<void>;
		lstat?(path: string): Promise<fs.Stats>;
		rm?(path: string, options?: fs.RmOptions): Promise<void>;
		open?(path: string, flags: string): Promise<fs.promises.FileHandle>;
	};
}

/**
 * 檔案操作服務類別
 * 負責所有專案中的檔案讀寫操作
 */
export class FileService {
	private fs: FileSystem;
	private readonly workspaceRoot: string;

	/**
	 * 建立檔案服務實例
	 * @param workspacePath 工作區路徑
	 * @param fileSystem 檔案系統（可選，用於測試）
	 */
	constructor(private workspacePath: string, fileSystem?: FileSystem) {
		this.fs = fileSystem || fs;
		this.workspaceRoot = path.resolve(workspacePath);
	}

	/**
	 * Resolve a project-relative path while preventing absolute paths and traversal.
	 */
	resolveSafePath(relativePath: string): string {
		if (typeof relativePath !== 'string' || relativePath.includes('\0') || path.isAbsolute(relativePath)) {
			throw new Error(`Unsafe project-relative path: ${String(relativePath)}`);
		}

		const resolved = path.resolve(this.workspaceRoot, relativePath || '.');
		const prefix = this.workspaceRoot.endsWith(path.sep) ? this.workspaceRoot : `${this.workspaceRoot}${path.sep}`;
		if (resolved !== this.workspaceRoot && !resolved.startsWith(prefix)) {
			throw new Error(`Path escapes workspace root: ${relativePath}`);
		}
		return resolved;
	}

	/**
	 * Reject existing symbolic-link path segments before a managed write.
	 */
	private async assertNoSymlinkSegments(fullPath: string, includeLeaf = false): Promise<void> {
		if (!this.fs.promises.lstat) {
			return;
		}

		const relative = path.relative(this.workspaceRoot, fullPath);
		let current = this.workspaceRoot;
		const segments = relative.split(path.sep).filter(Boolean);
		for (const segment of includeLeaf ? segments : segments.slice(0, -1)) {
			current = path.join(current, segment);
			if (!this.fs.existsSync(current)) {
				continue;
			}
			const stats = await this.fs.promises.lstat(current);
			if (stats.isSymbolicLink()) {
				throw new Error(`Symbolic-link path segment is not allowed: ${path.relative(this.workspaceRoot, current)}`);
			}
		}
	}

	/** Validate the complete managed root chain and prove that it is writable. */
	async validateWritableRoot(): Promise<void> {
		if (this.fs.promises.lstat) {
			const root = path.parse(this.workspaceRoot).root;
			const segments = path.relative(root, this.workspaceRoot).split(path.sep).filter(Boolean);
			let current = root;
			for (const segment of segments) {
				current = path.join(current, segment);
				if (!this.fs.existsSync(current)) {continue;}
				const stats = await this.fs.promises.lstat(current);
				if (stats.isSymbolicLink()) {
					throw new Error('Managed storage cannot contain symbolic-link path segments');
				}
			}
		}
		await this.createDirectory('.');
		const probe = `.write-probe-${process.pid}-${randomUUID()}`;
		await this.writeFileAtomic(probe, 'managed-runtime-write-probe');
		const result = await this.readFile(probe);
		if (result !== 'managed-runtime-write-probe') {
			throw new Error('Managed storage write verification failed');
		}
		await this.deleteFile(probe);
	}

	/**
	 * 寫入檔案內容，如果目錄不存在會自動建立
	 * @param relativePath 相對於工作區的檔案路徑
	 * @param content 檔案內容
	 */
	async writeFile(relativePath: string, content: string): Promise<void> {
		try {
			const fullPath = this.resolveSafePath(relativePath);
			await this.assertNoSymlinkSegments(fullPath, true);
			const dirPath = path.dirname(fullPath);

			if (!this.fs.existsSync(dirPath)) {
				await this.fs.promises.mkdir(dirPath, { recursive: true });
			}

			await this.fs.promises.writeFile(fullPath, content);
			log(`File written successfully: ${relativePath}`, 'info');
		} catch (error) {
			log(`Failed to write file: ${relativePath}`, 'error', fileErrorDetails(error));
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
			const fullPath = this.resolveSafePath(relativePath);

			if (!this.fs.existsSync(fullPath)) {
				return defaultContent;
			}
			await this.assertNoSymlinkSegments(fullPath, true);

			const content = await this.fs.promises.readFile(fullPath, 'utf8');
			return typeof content === 'string' ? content : content.toString('utf8');
		} catch (error) {
			log(`Failed to read file: ${relativePath}`, 'error', fileErrorDetails(error));
			return defaultContent;
		}
	}

	/**
	 * 檢查檔案是否存在
	 * @param relativePath 相對於工作區的檔案路徑
	 * @returns 檔案是否存在
	 */
	fileExists(relativePath: string): boolean {
		const fullPath = this.resolveSafePath(relativePath);
		return this.fs.existsSync(fullPath);
	}

	/**
	 * 建立目錄
	 * @param relativePath 相對於工作區的目錄路徑
	 */
	async createDirectory(relativePath: string): Promise<void> {
		try {
			const fullPath = this.resolveSafePath(relativePath);
			await this.assertNoSymlinkSegments(path.join(fullPath, '.directory-placeholder'));

			if (!this.fs.existsSync(fullPath)) {
				await this.fs.promises.mkdir(fullPath, { recursive: true });
				log(`Directory created: ${relativePath}`, 'info');
			}
		} catch (error) {
			log(`Failed to create directory: ${relativePath}`, 'error', fileErrorDetails(error));
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
			const sourcePath = this.resolveSafePath(sourceRelativePath);
			const destPath = this.resolveSafePath(destRelativePath);
			await this.assertNoSymlinkSegments(sourcePath, true);
			await this.assertNoSymlinkSegments(destPath, true);
			const destDir = path.dirname(destPath);

			// 確保目標目錄存在
			if (!this.fs.existsSync(destDir)) {
				await this.fs.promises.mkdir(destDir, { recursive: true });
			}

			await this.fs.promises.copyFile(sourcePath, destPath);
			log(`File copied from ${sourceRelativePath} to ${destRelativePath}`, 'info');
		} catch (error) {
			log(`Failed to copy file from ${sourceRelativePath} to ${destRelativePath}`, 'error', fileErrorDetails(error));
			throw error;
		}
	}

	/**
	 * 刪除檔案
	 * @param relativePath 相對於工作區的檔案路徑
	 */
	async deleteFile(relativePath: string): Promise<void> {
		try {
			const fullPath = this.resolveSafePath(relativePath);

			if (this.fs.existsSync(fullPath)) {
				await this.assertNoSymlinkSegments(fullPath, true);
				await this.fs.promises.unlink(fullPath);
				log(`File deleted: ${relativePath}`, 'info');
			}
		} catch (error) {
			log(`Failed to delete file: ${relativePath}`, 'error', fileErrorDetails(error));
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
			const fullPath = this.resolveSafePath(relativePath);

			if (!this.fs.existsSync(fullPath)) {
				return [];
			}
			await this.assertNoSymlinkSegments(fullPath, true);

			return await this.fs.promises.readdir(fullPath);
		} catch (error) {
			log(`Failed to list files in directory: ${relativePath}`, 'error', fileErrorDetails(error));
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
			log(`Failed to parse JSON file: ${relativePath}`, 'error', fileErrorDetails(error));
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
			log(`Failed to write JSON file: ${relativePath}`, 'error', fileErrorDetails(error));
			throw error;
		}
	}

	/** Read exact bytes and throw on I/O failure. */
	async readBuffer(relativePath: string): Promise<Buffer> {
		const fullPath = this.resolveSafePath(relativePath);
		await this.assertNoSymlinkSegments(fullPath, true);
		const content = await this.fs.promises.readFile(fullPath);
		return Buffer.isBuffer(content) ? Buffer.from(content) : Buffer.from(content, 'utf8');
	}

	/** Resolve a file through symlinks only when its final target remains under this root. */
	async resolveContainedRealPath(relativePath: string): Promise<string> {
		const fullPath = this.resolveSafePath(relativePath);
		if (!this.fs.existsSync(fullPath)) {
			throw new Error(`Managed file does not exist: ${relativePath}`);
		}
		if (!this.fs.promises.realpath) {
			await this.assertNoSymlinkSegments(fullPath, true);
			return fullPath;
		}
		const realRoot = path.resolve(await this.fs.promises.realpath(this.workspaceRoot));
		const realPath = path.resolve(await this.fs.promises.realpath(fullPath));
		const prefix = realRoot.endsWith(path.sep) ? realRoot : `${realRoot}${path.sep}`;
		if (realPath !== realRoot && !realPath.startsWith(prefix)) {
			throw new Error(`Managed file resolves outside its root: ${relativePath}`);
		}
		return realPath;
	}

	/** Validate a contained real target while preserving the original path semantics (for Python venvs). */
	async resolveValidatedContainedPath(relativePath: string): Promise<string> {
		await this.resolveContainedRealPath(relativePath);
		return this.resolveSafePath(relativePath);
	}

	/** Stat a managed file while allowing only root-contained symlink targets. */
	async getContainedFileStats(relativePath: string): Promise<fs.Stats | null> {
		try {
			const realPath = await this.resolveContainedRealPath(relativePath);
			return await this.fs.promises.stat(realPath);
		} catch (error) {
			log(`Failed to inspect contained managed file: ${relativePath}`, 'error', fileErrorDetails(error));
			return null;
		}
	}

	/** Write exact bytes through the normal workspace containment checks. */
	async writeBuffer(relativePath: string, content: Uint8Array): Promise<void> {
		const fullPath = this.resolveSafePath(relativePath);
		await this.assertNoSymlinkSegments(fullPath, true);
		const dirPath = path.dirname(fullPath);
		if (!this.fs.existsSync(dirPath)) {
			await this.fs.promises.mkdir(dirPath, { recursive: true });
		}
		await this.fs.promises.writeFile(fullPath, content);
	}

	/**
	 * Write a complete file using a temporary sibling and atomic rename.
	 */
	async writeFileAtomic(relativePath: string, content: string | Uint8Array): Promise<void> {
		if (!this.fs.promises.rename) {
			throw new Error('Atomic rename is unavailable in the configured file system');
		}
		const fullPath = this.resolveSafePath(relativePath);
		await this.assertNoSymlinkSegments(fullPath, true);
		const dirPath = path.dirname(fullPath);
		if (!this.fs.existsSync(dirPath)) {
			await this.fs.promises.mkdir(dirPath, { recursive: true });
		}
		const tempPath = `${fullPath}.tmp-${process.pid}-${randomUUID()}`;
		try {
			await this.fs.promises.writeFile(tempPath, content);
			await this.fs.promises.rename(tempPath, fullPath);
		} catch (error) {
			if (this.fs.existsSync(tempPath)) {
				try {
					await this.fs.promises.unlink(tempPath);
				} catch {
					// Preserve the original failure; stale temp files are safe and recognizable.
				}
			}
			throw error;
		}
	}

	/** Rename a file within the same workspace after validating both paths. */
	async renameFile(sourceRelativePath: string, destinationRelativePath: string): Promise<void> {
		if (!this.fs.promises.rename) {
			throw new Error('Rename is unavailable in the configured file system');
		}
		const source = this.resolveSafePath(sourceRelativePath);
		const destination = this.resolveSafePath(destinationRelativePath);
		await this.assertNoSymlinkSegments(source, true);
		await this.assertNoSymlinkSegments(destination, true);
		await this.fs.promises.rename(source, destination);
	}

	/** Create a file only when it does not already exist. */
	async createExclusiveFile(relativePath: string, content: string): Promise<boolean> {
		if (!this.fs.promises.open) {
			throw new Error('Exclusive file creation is unavailable in the configured file system');
		}
		const fullPath = this.resolveSafePath(relativePath);
		await this.assertNoSymlinkSegments(fullPath, true);
		await this.createDirectory(path.relative(this.workspaceRoot, path.dirname(fullPath)) || '.');
		let handle: fs.promises.FileHandle | undefined;
		try {
			handle = await this.fs.promises.open(fullPath, 'wx');
			await handle.writeFile(content, 'utf8');
			await handle.sync();
			return true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'EEXIST') {return false;}
			throw error;
		} finally {
			await handle?.close();
		}
	}

	/** Remove one managed directory without allowing root deletion or symlink traversal. */
	async deleteDirectory(relativePath: string): Promise<void> {
		if (!this.fs.promises.rm) {
			throw new Error('Recursive directory removal is unavailable in the configured file system');
		}
		const fullPath = this.resolveSafePath(relativePath);
		if (fullPath === this.workspaceRoot) {
			throw new Error('Refusing to remove the FileService root');
		}
		if (!this.fs.existsSync(fullPath)) {return;}
		await this.assertNoSymlinkSegments(fullPath, true);
		await this.fs.promises.rm(fullPath, { recursive: true, force: false });
	}

	/** Calculate storage use without following symbolic links. */
	async calculateStorageUsage(relativePath = '.'): Promise<number> {
		const stats = await this.getFileStats(relativePath);
		if (!stats) {return 0;}
		if (stats.isFile()) {return stats.size;}
		if (!stats.isDirectory()) {return 0;}
		let total = 0;
		for (const name of await this.listFiles(relativePath)) {
			total += await this.calculateStorageUsage(path.join(relativePath, name));
		}
		return total;
	}

	/**
	 * 獲取檔案的時間戳信息
	 * @param relativePath 相對於工作區的檔案路徑
	 * @returns 包含創建時間、最後修改時間等的物件，若檔案不存在則返回 null
	 */
	async getFileStats(relativePath: string): Promise<fs.Stats | null> {
		try {
			const fullPath = this.resolveSafePath(relativePath);

			if (!this.fs.existsSync(fullPath)) {
				return null;
			}
			await this.assertNoSymlinkSegments(fullPath, true);

			return await this.fs.promises.stat(fullPath);
		} catch (error) {
			log(`Failed to get file stats: ${relativePath}`, 'error', fileErrorDetails(error));
			return null;
		}
	}
}
