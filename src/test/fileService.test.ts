/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as fs from 'fs';
import * as os from 'os';
import * as sinon from 'sinon';
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { FileService } from '../services/fileService';
import { FSMock, createIsolatedFileService } from './helpers';

describe('File Service', () => {
	let fsMock: FSMock;
	let fileService: FileService;
	const workspacePath = '/mock/workspace';
	const testFilePath = 'test/file.txt';
	const testContent = 'Test file content';

	// 在每個測試之前設置環境 - 使用測試輔助函數簡化設置 (T022)
	beforeEach(() => {
		fsMock = new FSMock();
		fileService = createIsolatedFileService(fsMock, workspacePath);
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		sinon.restore();
		fsMock.reset();
	});

	it('should write file content', async () => {
		// 執行測試
		await fileService.writeFile(testFilePath, testContent);

		// 驗證檔案是否被寫入到 mock 中
		const expectedPath = path.join(workspacePath, testFilePath).replace(/\\/g, '/');
		assert.strictEqual(fsMock.files.has(expectedPath), true);
		assert.strictEqual(fsMock.files.get(expectedPath), testContent);
	});

	it('should read file content', async () => {
		// 準備測試檔案
		const fullPath = path.join(workspacePath, testFilePath);
		fsMock.addFile(fullPath, testContent);

		// 執行測試
		const content = await fileService.readFile(testFilePath);

		// 驗證內容是否正確
		assert.strictEqual(content, testContent);
	});

	it('should return default content for non-existent files', async () => {
		// 指定不存在的檔案
		const nonExistentPath = 'non/existent/file.txt';
		const defaultContent = 'default content';

		// 執行測試
		const content = await fileService.readFile(nonExistentPath, defaultContent);

		// 驗證是否返回預設內容
		assert.strictEqual(content, defaultContent);
	});

	it('should check if file exists', () => {
		// 準備測試檔案
		const fullPath = path.join(workspacePath, testFilePath);
		fsMock.addFile(fullPath, testContent);

		// 測試檔案存在
		assert.strictEqual(fileService.fileExists(testFilePath), true);

		// 測試檔案不存在
		assert.strictEqual(fileService.fileExists('non/existent/file.txt'), false);
	});

	it('should create directory', async () => {
		const dirPath = 'test/directory';

		// 執行測試
		await fileService.createDirectory(dirPath);

		// 驗證目錄是否被創建到 mock 中 (normalize for Windows)
		const expectedPath = path.join(workspacePath, dirPath).replace(/\\/g, '/');
		assert.strictEqual(fsMock.directories.has(expectedPath), true);
	});

	it('should copy files', async () => {
		// 準備來源檔案
		const sourcePath = 'source/file.txt';
		const destPath = 'dest/file.txt';
		const fullSourcePath = path.join(workspacePath, sourcePath);
		fsMock.addFile(fullSourcePath, testContent);

		// 執行測試
		await fileService.copyFile(sourcePath, destPath);

		// 驗證檔案是否被複製到目標位置 (normalize for Windows)
		const expectedDestPath = path.join(workspacePath, destPath).replace(/\\/g, '/');
		assert.strictEqual(fsMock.files.has(expectedDestPath), true);
		assert.strictEqual(fsMock.files.get(expectedDestPath), testContent);
	});

	it('should delete files', async () => {
		// 準備要刪除的檔案
		const fullPath = path.join(workspacePath, testFilePath);
		fsMock.addFile(fullPath, testContent);

		// 執行測試
		await fileService.deleteFile(testFilePath);

		// 驗證檔案是否被刪除
		assert.strictEqual(fsMock.files.has(fullPath), false);
	});

	it('should list files in directory', async () => {
		// 準備目錄和檔案
		const dirPath = 'test/dir';
		const fullDirPath = path.join(workspacePath, dirPath);

		// 添加一些檔案 (addFile automatically creates parent directories)
		fsMock.addFile(path.join(fullDirPath, 'file1.txt'), 'content1');
		fsMock.addFile(path.join(fullDirPath, 'file2.txt'), 'content2');

		// 執行測試
		const files = await fileService.listFiles(dirPath);

		// 驗證檔案列表 (sort to ensure consistent order)
		assert.deepStrictEqual(files.sort(), ['file1.txt', 'file2.txt']);
	});

	it('should return safe defaults for missing directories, JSON files, and stats', async () => {
		assert.deepStrictEqual(await fileService.listFiles('missing'), []);
		assert.deepStrictEqual(await fileService.readJsonFile('missing.json', { missing: true }), { missing: true });
		assert.strictEqual(await fileService.getFileStats('missing.txt'), null);
	});

	it('should read JSON files', async () => {
		// 準備 JSON 檔案
		const jsonPath = 'test/config.json';
		const jsonData = { key: 'value', number: 42 };
		const jsonContent = JSON.stringify(jsonData);
		const fullPath = path.join(workspacePath, jsonPath);
		fsMock.addFile(fullPath, jsonContent);

		// 執行測試
		const result = await fileService.readJsonFile(jsonPath, {});

		// 驗證解析出的 JSON 物件
		assert.deepStrictEqual(result, jsonData);
	});

	it('should write JSON files', async () => {
		// 準備 JSON 數據
		const jsonPath = 'test/config.json';
		const jsonData = { key: 'value', number: 42 };

		// 執行測試
		await fileService.writeJsonFile(jsonPath, jsonData, true);

		// 驗證寫入的內容 (normalize for Windows)
		const expectedPath = path.join(workspacePath, jsonPath).replace(/\\/g, '/');
		const expectedContent = JSON.stringify(jsonData, null, 2);
		assert.strictEqual(fsMock.files.get(expectedPath), expectedContent);
	});

	it('should reject absolute and traversal paths', async () => {
		assert.throws(() => fileService.resolveSafePath('../outside.txt'), /escapes workspace root/);
		assert.throws(() => fileService.resolveSafePath('/outside.txt'), /Unsafe project-relative path/);
		await assert.rejects(() => fileService.writeFile('../outside.txt', 'unsafe'), /escapes workspace root/);
	});

	it('should resolve empty paths and workspace roots with a trailing separator safely', () => {
		assert.strictEqual(fileService.resolveSafePath(''), workspacePath);
		assert.strictEqual(new FileService(path.parse(workspacePath).root).resolveSafePath('tmp'), path.resolve('/tmp'));
	});

	it('should decode Buffer reads and support compact JSON writes', async () => {
		const bufferFs: any = {
			existsSync: () => true,
			promises: { readFile: async () => Buffer.from('buffer content') },
		};
		assert.strictEqual(await new FileService(workspacePath, bufferFs).readFile(testFilePath), 'buffer content');
		await fileService.writeJsonFile('test/compact.json', { value: 1 }, false);
		assert.strictEqual(fsMock.files.get(`${workspacePath}/test/compact.json`), '{"value":1}');
	});

	it('should atomically replace a file without leaving a temporary sibling', async () => {
		await fileService.writeFileAtomic(testFilePath, 'atomic content');

		const expectedPath = path.join(workspacePath, testFilePath).replace(/\\/g, '/');
		assert.strictEqual(fsMock.files.get(expectedPath), 'atomic content');
		assert.strictEqual(
			Array.from(fsMock.files.keys()).some(file => file.includes('.tmp-')),
			false
		);
	});

	it('should reject atomic writes and renames when rename support is unavailable', async () => {
		const noRename: any = {
			existsSync: () => false,
			promises: { mkdir: async () => undefined, writeFile: async () => undefined },
		};
		const service = new FileService(workspacePath, noRename);
		await assert.rejects(service.writeFileAtomic('test.txt', 'content'), /Atomic rename is unavailable/);
		await assert.rejects(service.renameFile('source.txt', 'target.txt'), /Rename is unavailable/);
	});

	it('should clean a temporary sibling after atomic rename failure', async () => {
		let temporaryExists = false;
		let temporaryRemoved = false;
		const failedRename: any = {
			existsSync: (candidate: string) => candidate.includes('.tmp-') && temporaryExists,
			promises: {
				mkdir: async () => undefined,
				writeFile: async () => {temporaryExists = true;},
				rename: async () => {throw new Error('rename failed');},
				unlink: async () => {
					temporaryExists = false;
					temporaryRemoved = true;
				},
			},
		};
		await assert.rejects(new FileService(workspacePath, failedRename).writeFileAtomic('test.txt', 'content'), /rename failed/);
		assert.strictEqual(temporaryRemoved, true);
	});

	it('should preserve the original atomic failure when temporary cleanup also fails', async () => {
		const failedCleanup: any = {
			existsSync: (candidate: string) => candidate.includes('.tmp-'),
			promises: {
				mkdir: async () => undefined,
				writeFile: async () => undefined,
				rename: async () => {throw new Error('original rename failure');},
				unlink: async () => {throw new Error('cleanup failure');},
			},
		};
		await assert.rejects(
			new FileService(workspacePath, failedCleanup).writeFileAtomic('test.txt', 'content'),
			/original rename failure/
		);
	});

	it('should rename files within the workspace', async () => {
		fsMock.addFile(path.join(workspacePath, 'source.txt'), 'source');
		await fileService.renameFile('source.txt', 'target.txt');
		assert.strictEqual(fsMock.files.has(path.join(workspacePath, 'source.txt')), false);
		assert.strictEqual(fsMock.files.get(path.join(workspacePath, 'target.txt')), 'source');
	});

	it('should preserve exact UTF-8 bytes through buffer helpers', async () => {
		const bytes = Buffer.from('managed skill bytes\n', 'utf8');
		await fileService.writeBuffer(testFilePath, bytes);
		assert.deepStrictEqual(await fileService.readBuffer(testFilePath), bytes);
	});

	it('should reject writes through an existing symbolic-link segment', async () => {
		const symlinkStats = { isSymbolicLink: () => true } as any;
		const errorFs: any = {
			existsSync: (candidate: string) => candidate.endsWith('/linked'),
			promises: {
				lstat: async () => symlinkStats,
				writeFile: async () => undefined,
				mkdir: async () => undefined,
			},
		};
		const protectedService = new FileService(workspacePath, errorFs);

		await assert.rejects(() => protectedService.writeFile('linked/file.txt', 'unsafe'), /Symbolic-link path segment/);
	});

	it('should reject exact-byte reads through a symbolic-link leaf', async () => {
		const symlinkStats = { isSymbolicLink: () => true } as any;
		const errorFs: any = {
			existsSync: (candidate: string) => candidate.endsWith('/managed-link.txt'),
			promises: {
				lstat: async () => symlinkStats,
				readFile: async () => Buffer.from('outside secret'),
			},
		};
		const protectedService = new FileService(workspacePath, errorFs);

		await assert.rejects(() => protectedService.readBuffer('managed-link.txt'), /Symbolic-link path segment/);
	});

	it('should not read, mutate, list, or inspect files through workspace symbolic links', async () => {
		const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-file-service-symlink-'));
		const realWorkspace = path.join(temporaryRoot, 'workspace');
		const outside = path.join(temporaryRoot, 'outside');
		fs.mkdirSync(realWorkspace);
		fs.mkdirSync(outside);
		fs.writeFileSync(path.join(outside, 'secret.txt'), 'outside secret');
		fs.symlinkSync(outside, path.join(realWorkspace, 'linked'), 'dir');
		fs.symlinkSync(path.join(outside, 'secret.txt'), path.join(realWorkspace, 'secret-link.txt'));
		const protectedService = new FileService(realWorkspace);

		try {
			assert.strictEqual(await protectedService.readFile('linked/secret.txt', 'blocked'), 'blocked');
			assert.deepStrictEqual(await protectedService.listFiles('linked'), []);
			assert.strictEqual(await protectedService.getFileStats('linked/secret.txt'), null);
			await assert.rejects(() => protectedService.readBuffer('secret-link.txt'), /Symbolic-link path segment/);
			await assert.rejects(() => protectedService.copyFile('linked/secret.txt', 'copy.txt'), /Symbolic-link path segment/);
			await assert.rejects(() => protectedService.copyFile('secret-link.txt', 'copy.txt'), /Symbolic-link path segment/);
			await assert.rejects(() => protectedService.renameFile('linked/secret.txt', 'renamed.txt'), /Symbolic-link path segment/);
			await assert.rejects(() => protectedService.deleteFile('linked/secret.txt'), /Symbolic-link path segment/);
			await assert.rejects(() => protectedService.writeFile('secret-link.txt', 'changed'), /Symbolic-link path segment/);
			assert.strictEqual(fs.readFileSync(path.join(outside, 'secret.txt'), 'utf8'), 'outside secret');
		} finally {
			fs.rmSync(temporaryRoot, { recursive: true, force: true });
		}
	});

	describe('Error Handling', () => {
		it('should handle writeFile errors', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => false,
				promises: {
					mkdir: async () => {},
					writeFile: async () => {
						throw new Error('Write failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			await assert.rejects(async () => await errorFileService.writeFile(testFilePath, testContent), { message: 'Write failed' });
		});

		it('should return default content when readFile throws error', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => true,
				promises: {
					readFile: async () => {
						throw new Error('Read failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			const result = await errorFileService.readFile(testFilePath, 'default');
			assert.strictEqual(result, 'default');
		});

		it('should handle createDirectory errors', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => false,
				promises: {
					mkdir: async () => {
						throw new Error('Mkdir failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			await assert.rejects(async () => await errorFileService.createDirectory('test/dir'), { message: 'Mkdir failed' });
		});

		it('should handle copyFile errors', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => false,
				promises: {
					mkdir: async () => {},
					copyFile: async () => {
						throw new Error('Copy failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			await assert.rejects(async () => await errorFileService.copyFile('source.txt', 'dest.txt'), { message: 'Copy failed' });
		});

		it('should handle deleteFile errors', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => true,
				promises: {
					unlink: async () => {
						throw new Error('Delete failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			await assert.rejects(async () => await errorFileService.deleteFile(testFilePath), { message: 'Delete failed' });
		});

		it('should return empty array when listFiles throws error', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => true,
				promises: {
					readdir: async () => {
						throw new Error('Readdir failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			const result = await errorFileService.listFiles('test/dir');
			assert.deepStrictEqual(result, []);
		});

		it('should return default value when readJsonFile parsing fails', async () => {
			// 準備無效的 JSON 檔案
			const jsonPath = 'test/invalid.json';
			const invalidJson = '{ invalid json }';
			const fullPath = path.join(workspacePath, jsonPath);
			fsMock.addFile(fullPath, invalidJson);

			const defaultValue = { default: true };
			const result = await fileService.readJsonFile(jsonPath, defaultValue);
			assert.deepStrictEqual(result, defaultValue);
		});

		it('should handle writeJsonFile errors', async () => {
			// 創建自定義 FileSystem mock
			const errorFs: any = {
				existsSync: () => false,
				promises: {
					mkdir: async () => {},
					writeFile: async () => {
						throw new Error('Write JSON failed');
					},
				},
			};
			const errorFileService = new FileService(workspacePath, errorFs);

			await assert.rejects(async () => await errorFileService.writeJsonFile('test.json', { data: 'test' }), {
				message: 'Write JSON failed',
			});
		});

		it('should return null when file stats fail', async () => {
			const errorFs: any = {
				existsSync: () => true,
				promises: { stat: async () => {throw new Error('stat failed');} },
			};
			assert.strictEqual(await new FileService(workspacePath, errorFs).getFileStats(testFilePath), null);
		});
	});
});
