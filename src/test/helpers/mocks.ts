/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach } from 'mocha';

/**
 * 模擬 vscode API 的輔助函數
 */
export class VSCodeMock {
	public window: any = {
		createOutputChannel: sinon.stub().returns({
			info: sinon.stub(),
			debug: sinon.stub(),
			warn: sinon.stub(),
			error: sinon.stub(),
			show: sinon.stub(),
			dispose: sinon.stub(),
		}),
		showErrorMessage: sinon.stub().returns(Promise.resolve()),
		showInformationMessage: sinon.stub().returns(Promise.resolve()),
		showWarningMessage: sinon.stub().returns(Promise.resolve()),
		createWebviewPanel: sinon.stub().returns({
			webview: {
				html: '',
				onDidReceiveMessage: sinon.stub(),
				postMessage: sinon.stub().returns(Promise.resolve()),
			},
			onDidDispose: sinon.stub(),
			reveal: sinon.stub(),
		}),
		showInputBox: sinon.stub().returns(Promise.resolve('test')),
		createStatusBarItem: sinon.stub().returns({
			show: sinon.stub(),
			hide: sinon.stub(),
			dispose: sinon.stub(),
			text: '',
			tooltip: '',
			command: '',
		}),
		visibleTextEditors: [],
	};

	public workspace: any = {
		workspaceFolders: [{ uri: { fsPath: '/mock/workspace' } }],
	};

	public commands: any = {
		executeCommand: sinon.stub().returns(Promise.resolve()),
		registerCommand: sinon.stub().returns({ dispose: sinon.stub() }),
	};

	public env: any = {
		language: 'en',
	};

	public Uri: any = {
		file: (path: string) => ({ fsPath: path }),
		parse: sinon.stub(),
	};

	public StatusBarAlignment = {
		Left: 'left',
		Right: 'right',
	};

	public ViewColumn = {
		One: 1,
		Two: 2,
	};
}

/**
 * 模擬檔案系統的輔助函數
 */
export class FSMock {
	private _files: Map<string, string> = new Map();
	private _directories: Set<string> = new Set();

	/**
	 * 獲取檔案映射（用於測試）
	 */
	public get files(): Map<string, string> {
		return this._files;
	}

	/**
	 * 獲取目錄映射（用於測試）
	 */
	public get directories(): Set<string> {
		return this._directories;
	}
	/**
	 * 模擬讀取檔案內容
	 */
	public readFileSync = sinon.stub().callsFake((path: string, encoding?: string) => {
		if (this._files.has(path)) {
			return this._files.get(path);
		}
		throw new Error(`ENOENT: no such file or directory, open '${path}'`);
	});

	/**
	 * 模擬寫入檔案
	 */
	public writeFileSync = sinon.stub().callsFake((path: string, content: string) => {
		this.files.set(path, content);
		return true;
	});

	/**
	 * 模擬檢查檔案是否存在
	 */
	public existsSync = sinon.stub().callsFake((path: string) => {
		return this.files.has(path) || this.directories.has(path);
	});

	/**
	 * 模擬列出目錄內容
	 */
	public readdirSync = sinon.stub().callsFake((path: string) => {
		if (!this.directories.has(path)) {
			throw new Error(`ENOENT: no such directory, readdir '${path}'`);
		}

		const result: string[] = [];
		const pathPrefix = path.endsWith('/') ? path : path + '/';

		// 找出以此路徑開頭的檔案和目錄
		this.files.forEach((_, filePath) => {
			if (filePath.startsWith(pathPrefix)) {
				const relativePath = filePath.slice(pathPrefix.length);
				const firstSegment = relativePath.split('/')[0];
				if (firstSegment && !result.includes(firstSegment)) {
					result.push(firstSegment);
				}
			}
		});

		return result;
	});

	/**
	 * 添加模擬檔案
	 */
	public addFile(path: string, content: string): void {
		this.files.set(path, content);

		// 確保此檔案的所有父目錄都存在
		let dirPath = path;
		while ((dirPath = path.substring(0, dirPath.lastIndexOf('/'))) !== '') {
			this.directories.add(dirPath);
		}
	}

	/**
	 * 添加模擬目錄
	 */
	public addDirectory(path: string): void {
		this.directories.add(path);
	}

	/**
	 * 獲取 promises 模擬
	 */
	public get promises() {
		return {
			readFile: async (path: string, encoding?: BufferEncoding) => {
				if (this.files.has(path)) {
					return this.files.get(path);
				}
				throw new Error(`ENOENT: no such file or directory, open '${path}'`);
			},
			writeFile: async (path: string, content: string) => {
				this.files.set(path, content);
			},
			mkdir: async (path: string, options?: any) => {
				this.directories.add(path);
				return path;
			},
			readdir: async (path: string) => {
				return this.readdirSync(path);
			},
			unlink: async (path: string) => {
				if (this.files.has(path)) {
					this.files.delete(path);
					return true;
				}
				throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
			},
			copyFile: async (src: string, dest: string) => {
				if (this.files.has(src)) {
					this.files.set(dest, this.files.get(src)!);
					return true;
				}
				throw new Error(`ENOENT: no such file or directory, copyFile '${src}'`);
			},
		};
	}

	/**
	 * 模擬 statSync
	 */
	public statSync = sinon.stub().callsFake((path: string) => {
		if (this.files.has(path)) {
			return {
				isFile: () => true,
				isDirectory: () => false,
			};
		}

		if (this.directories.has(path)) {
			return {
				isFile: () => false,
				isDirectory: () => true,
			};
		}

		throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
	});

	/**
	 * 重置模擬狀態
	 */
	public reset(): void {
		this.files.clear();
		this.directories.clear();
		sinon.resetHistory();
	}
}
