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
	private _outputChannel: any = null;

	public window: any = {
		createOutputChannel: sinon.stub().callsFake((name: string, options?: any) => {
			// 如果已經創建過，返回同一個實例
			if (this._outputChannel) {
				return this._outputChannel;
			}

			// 創建 LogOutputChannel mock（有 log: true 選項時）
			this._outputChannel = {
				name,
				appendLine: sinon.stub(),
				append: sinon.stub(),
				clear: sinon.stub(),
				show: sinon.stub(),
				hide: sinon.stub(),
				dispose: sinon.stub(),
				// LogOutputChannel 特有的方法
				trace: sinon.stub(),
				debug: sinon.stub(),
				info: sinon.stub(),
				warn: sinon.stub(),
				error: sinon.stub(),
			};
			return this._outputChannel;
		}),
		showErrorMessage: sinon.stub().returns(Promise.resolve()),
		showInformationMessage: sinon.stub().returns(Promise.resolve()),
		showWarningMessage: sinon.stub().returns(Promise.resolve()),
		createWebviewPanel: sinon.stub().callsFake((viewType: string, title: string, showOptions: any, options: any) => {
			const panel = {
				webview: {
					html: '',
					options: options?.enableScripts ? { enableScripts: true } : {},
					onDidReceiveMessage: sinon.stub().returns({ dispose: sinon.stub() }),
					postMessage: sinon.stub().returns(Promise.resolve(true)),
					asWebviewUri: sinon.stub().callsFake((uri: any) => {
						// 模擬將本地路徑轉換為 webview URI
						if (uri.fsPath) {
							return {
								toString: () => `vscode-resource:${uri.fsPath}`,
								fsPath: uri.fsPath,
								scheme: 'vscode-resource',
							};
						}
						return uri;
					}),
					cspSource: 'vscode-webview:',
				},
				title,
				viewType,
				visible: true,
				active: true,
				onDidDispose: sinon.stub().callsFake((callback: any) => {
					panel._onDisposeCallback = callback;
					return { dispose: sinon.stub() };
				}),
				onDidChangeViewState: sinon.stub().returns({ dispose: sinon.stub() }),
				reveal: sinon.stub().callsFake(() => {
					panel.visible = true;
					panel.active = true;
				}),
				dispose: sinon.stub().callsFake(() => {
					panel.visible = false;
					if (panel._onDisposeCallback) {
						panel._onDisposeCallback();
					}
				}),
				_onDisposeCallback: null as any,
			};
			return panel;
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

	/**
	 * 獲取當前的 output channel mock（用於測試驗證）
	 */
	public getOutputChannel(): any {
		return this._outputChannel;
	}

	/**
	 * 重置 output channel（用於測試清理）
	 */
	public resetOutputChannel(): void {
		this._outputChannel = null;
	}

	/**
	 * 獲取 mock 狀態（用於測試斷言） - T007
	 */
	public getState() {
		return {
			outputChannelsCreated: this._outputChannel ? 1 : 0,
			webviewPanelsCreated: this.window.createWebviewPanel.callCount,
			messagesShown: [
				...this.window.showErrorMessage.getCalls().map((c: any) => ({ type: 'error', message: c.args[0] })),
				...this.window.showInformationMessage.getCalls().map((c: any) => ({ type: 'info', message: c.args[0] })),
				...this.window.showWarningMessage.getCalls().map((c: any) => ({ type: 'warning', message: c.args[0] })),
			],
		};
	}
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
	public readdirSync = sinon.stub().callsFake((dirPath: string) => {
		// 正規化路徑分隔符（Windows 使用 \，但我們統一處理為 /）
		const normalizedDirPath = dirPath.replace(/\\/g, '/');

		if (!this.directories.has(dirPath)) {
			throw new Error(`ENOENT: no such directory, readdir '${dirPath}'`);
		}

		const result: string[] = [];
		const pathPrefix = normalizedDirPath.endsWith('/') ? normalizedDirPath : normalizedDirPath + '/';

		// 找出以此路徑開頭的檔案
		this.files.forEach((_, filePath) => {
			const normalizedFilePath = filePath.replace(/\\/g, '/');
			if (normalizedFilePath.startsWith(pathPrefix)) {
				const relativePath = normalizedFilePath.slice(pathPrefix.length);
				const firstSegment = relativePath.split('/')[0];
				if (firstSegment && !result.includes(firstSegment)) {
					result.push(firstSegment);
				}
			}
		});

		// 找出直接子目錄
		this.directories.forEach(subDir => {
			const normalizedSubDir = subDir.replace(/\\/g, '/');
			if (normalizedSubDir.startsWith(pathPrefix) && normalizedSubDir !== normalizedDirPath) {
				const relativePath = normalizedSubDir.slice(pathPrefix.length);
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
			stat: async (path: string) => {
				if (this.files.has(path)) {
					return {
						isFile: () => true,
						isDirectory: () => false,
						size: this.files.get(path)!.length,
						mtime: new Date(),
						ctime: new Date(),
					};
				} else if (this.directories.has(path)) {
					return {
						isFile: () => false,
						isDirectory: () => true,
						size: 0,
						mtime: new Date(),
						ctime: new Date(),
					};
				}
				throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
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
	 * 獲取 mock 狀態（用於測試斷言）
	 */
	public getState() {
		return {
			filesRead: Array.from(this.files.keys()).filter(path => 
				this.readFileSync.getCalls().some(call => call.args[0] === path)
			),
			filesWritten: Array.from(this.files.keys()).filter(path =>
				this.writeFileSync.getCalls().some(call => call.args[0] === path)
			),
			directoriesCreated: Array.from(this.directories),
			callCount: {
				readFile: this.readFileSync.callCount,
				writeFile: this.writeFileSync.callCount,
				exists: this.existsSync.callCount,
				readdir: this.readdirSync.callCount,
			},
		};
	}

	/**
	 * 重置模擬狀態
	 */
	public reset(): void {
		this.files.clear();
		this.directories.clear();
		sinon.resetHistory();
	}
}
