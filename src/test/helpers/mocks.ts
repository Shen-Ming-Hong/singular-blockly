/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
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
	private _configurationStore = new Map<string, Map<string, any>>();
	private _workspaceFoldersChanged: Array<(event: any) => void> = [];

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
					onDidReceiveMessage: sinon.stub().callsFake((callback: any) => {
						panel.webview._onDidReceiveMessage = callback;
						return { dispose: sinon.stub() };
					}),
					postMessage: sinon.stub().returns(Promise.resolve(true)),
					asWebviewUri: sinon.stub().callsFake((uri: any) => {
						// 模擬將本地路徑轉換為 webview URI
						if (uri.fsPath) {
							const normalizedFsPath = uri.fsPath.replace(/\\/g, '/');
							return {
								toString: () => `vscode-resource:${normalizedFsPath}`,
								fsPath: uri.fsPath,
								scheme: 'vscode-resource',
							};
						}
						return uri;
					}),
					cspSource: 'vscode-webview:',
					_onDidReceiveMessage: null as any,
					dispatchMessage: async (message: any) => {
						if (panel.webview._onDidReceiveMessage) {
							await panel.webview._onDidReceiveMessage(message);
						}
					},
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
		getConfiguration: sinon.stub().callsFake((section?: string) => {
			const sectionKey = section || '';
			if (!this._configurationStore.has(sectionKey)) {
				this._configurationStore.set(sectionKey, new Map());
			}
			const sectionStore = this._configurationStore.get(sectionKey)!;
			return {
				get: sinon.stub().callsFake((key: string, defaultValue?: any) => {
					return sectionStore.has(key) ? sectionStore.get(key) : defaultValue;
				}),
				update: sinon.stub().callsFake((key: string, value: any) => {
					sectionStore.set(key, value);
					return Promise.resolve();
				}),
			};
		}),
		createFileSystemWatcher: sinon.stub().callsFake(() => {
			return {
				onDidChange: sinon.stub().returns({ dispose: sinon.stub() }),
				onDidCreate: sinon.stub().returns({ dispose: sinon.stub() }),
				onDidDelete: sinon.stub().returns({ dispose: sinon.stub() }),
				dispose: sinon.stub(),
			};
		}),
		onDidChangeWorkspaceFolders: sinon.stub().callsFake((callback: (event: any) => void) => {
			this._workspaceFoldersChanged.push(callback);
			return {
				dispose: sinon.stub().callsFake(() => {
					this._workspaceFoldersChanged = this._workspaceFoldersChanged.filter(candidate => candidate !== callback);
				}),
			};
		}),
		onDidChangeConfiguration: sinon.stub().returns({ dispose: sinon.stub() }),
	};

	public fireWorkspaceFoldersChanged(added: any[], removed: any[] = []): void {
		const removedPaths = new Set(removed.map(folder => folder.uri.fsPath));
		const current = (this.workspace.workspaceFolders || []).filter((folder: any) => !removedPaths.has(folder.uri.fsPath));
		this.workspace.workspaceFolders = [...current, ...added];
		for (const callback of [...this._workspaceFoldersChanged]) {callback({ added, removed });}
	}

	public commands: any = {
		executeCommand: sinon.stub().returns(Promise.resolve()),
		registerCommand: sinon.stub().returns({ dispose: sinon.stub() }),
	};

	public env: any = {
		language: 'en',
		clipboard: {
			writeText: sinon.stub().resolves(),
			readText: sinon.stub().resolves(''),
		},
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
	private _fileMetadata: Map<string, { mtime: Date; ctime: Date }> = new Map();
	private _directories: Set<string> = new Set();

	/**
	 * Keep virtual test paths stable when path.resolve() adds a Windows drive.
	 */
	private normalizePath(candidatePath: string): string {
		return candidatePath.replace(/\\/g, '/').replace(/^[A-Za-z]:(?=\/)/, '');
	}

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
		const normalizedPath = this.normalizePath(path);
		if (this.files.has(normalizedPath)) {
			return this.files.get(normalizedPath);
		}
		throw new Error(`ENOENT: no such file or directory, open '${path}'`);
	});

	/**
	 * 模擬寫入檔案
	 */
	public writeFileSync = sinon.stub().callsFake((path: string, content: string) => {
		this.files.set(this.normalizePath(path), content);
		return true;
	});

	/**
	 * 模擬檢查檔案是否存在
	 */
	public existsSync = sinon.stub().callsFake((path: string) => {
		const normalizedPath = this.normalizePath(path);
		return this.files.has(normalizedPath) || this.directories.has(normalizedPath);
	});

	/**
	 * 模擬列出目錄內容
	 */
	public readdirSync = sinon.stub().callsFake((dirPath: string) => {
		const normalizedDirPath = this.normalizePath(dirPath);

		if (!this.directories.has(normalizedDirPath)) {
			throw new Error(`ENOENT: no such directory, readdir '${dirPath}'`);
		}

		const result: string[] = [];
		const pathPrefix = normalizedDirPath.endsWith('/') ? normalizedDirPath : normalizedDirPath + '/';

		// 找出以此路徑開頭的檔案
		this.files.forEach((_, filePath) => {
			const normalizedFilePath = this.normalizePath(filePath);
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
			const normalizedSubDir = this.normalizePath(subDir);
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
	public addFile(path: string, content: string, mtime?: Date): void {
		const normalizedPath = this.normalizePath(path);
		this.files.set(normalizedPath, content);

		// Store file metadata (creation and modification time)
		const now = mtime || new Date();
		this._fileMetadata.set(normalizedPath, {
			mtime: now,
			ctime: now,
		});

		// 確保此檔案的所有父目錄都存在
		let dirPath = normalizedPath;
		while ((dirPath = normalizedPath.substring(0, dirPath.lastIndexOf('/'))) !== '') {
			this.directories.add(dirPath);
		}
	}

	/**
	 * 添加模擬目錄
	 */
	public addDirectory(path: string): void {
		const normalizedPath = this.normalizePath(path);
		this.directories.add(normalizedPath);
	}

	/**
	 * 獲取 promises 模擬
	 */
	public get promises() {
		return {
			readFile: async (path: string, encoding?: BufferEncoding) => {
				const normalizedPath = this.normalizePath(path);
				if (this.files.has(normalizedPath)) {
					return this.files.get(normalizedPath);
				}
				throw new Error(`ENOENT: no such file or directory, open '${path}'`);
			},
			writeFile: async (path: string, content: string | Uint8Array) => {
				const normalizedPath = this.normalizePath(path);
				this.files.set(normalizedPath, typeof content === 'string' ? content : Buffer.from(content).toString('utf8'));
			},
			mkdir: async (path: string, options?: any) => {
				const normalizedPath = this.normalizePath(path);
				this.directories.add(normalizedPath);
				return normalizedPath;
			},
			readdir: async (path: string) => {
				return this.readdirSync(path);
			},
			unlink: async (path: string) => {
				const normalizedPath = this.normalizePath(path);
				if (this.files.has(normalizedPath)) {
					this.files.delete(normalizedPath);
					this._fileMetadata.delete(normalizedPath);
					return true;
				}
				throw new Error(`ENOENT: no such file or directory, unlink '${path}'`);
			},
			copyFile: async (src: string, dest: string) => {
				const normalizedSrc = this.normalizePath(src);
				const normalizedDest = this.normalizePath(dest);
				if (this.files.has(normalizedSrc)) {
					this.files.set(normalizedDest, this.files.get(normalizedSrc)!);
					return true;
				}
				throw new Error(`ENOENT: no such file or directory, copyFile '${src}'`);
			},
			rename: async (src: string, dest: string) => {
				const normalizedSrc = this.normalizePath(src);
				const normalizedDest = this.normalizePath(dest);
				if (!this.files.has(normalizedSrc)) {
					throw new Error(`ENOENT: no such file or directory, rename '${src}'`);
				}
				this.files.set(normalizedDest, this.files.get(normalizedSrc)!);
				this.files.delete(normalizedSrc);
				this._fileMetadata.delete(normalizedSrc);
			},
			lstat: async (path: string) => {
				return {
					...this.statSync(path),
					isSymbolicLink: () => false,
				};
			},
			stat: async (path: string) => {
				const normalizedPath = this.normalizePath(path);
				if (this.files.has(normalizedPath)) {
					const metadata = this._fileMetadata.get(normalizedPath) || {
						mtime: new Date(),
						ctime: new Date(),
					};
					return {
						isFile: () => true,
						isDirectory: () => false,
						isSymbolicLink: () => false,
						size: this.files.get(normalizedPath)!.length,
						mtime: metadata.mtime,
						ctime: metadata.ctime,
					};
				} else if (this.directories.has(normalizedPath)) {
					return {
						isFile: () => false,
						isDirectory: () => true,
						isSymbolicLink: () => false,
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
		const normalizedPath = this.normalizePath(path);

		if (this.files.has(normalizedPath)) {
			const metadata = this._fileMetadata.get(normalizedPath) || {
				mtime: new Date(),
				ctime: new Date(),
			};
			return {
				isFile: () => true,
				isDirectory: () => false,
				isSymbolicLink: () => false,
				size: this.files.get(normalizedPath)!.length,
				mtime: metadata.mtime,
				ctime: metadata.ctime,
			};
		}

		if (this.directories.has(normalizedPath)) {
			return {
				isFile: () => false,
				isDirectory: () => true,
				isSymbolicLink: () => false,
				size: 0,
				mtime: new Date(),
				ctime: new Date(),
			};
		}

		throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
	});

	/**
	 * 清空所有模擬檔案和目錄
	 */
	public reset(): void {
		this.files.clear();
		this._fileMetadata.clear();
		this.directories.clear();
	}

	/**
	 * 獲取 mock 狀態（用於測試斷言）
	 */
	public getState() {
		return {
			filesRead: Array.from(this.files.keys()).filter(path => this.readFileSync.getCalls().some(call => call.args[0] === path)),
			filesWritten: Array.from(this.files.keys()).filter(path => this.writeFileSync.getCalls().some(call => call.args[0] === path)),
			directoriesCreated: Array.from(this.directories),
			callCount: {
				readFile: this.readFileSync.callCount,
				writeFile: this.writeFileSync.callCount,
				exists: this.existsSync.callCount,
				readdir: this.readdirSync.callCount,
			},
		};
	}
}
