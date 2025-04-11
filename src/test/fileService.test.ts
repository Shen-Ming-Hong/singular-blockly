/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { FileService } from '../services/fileService';
import { FSMock } from './helpers/mocks';

describe('File Service', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let fileService: FileService;
	const workspacePath = '/mock/workspace';
	const testFilePath = 'test/file.txt';
	const testContent = 'Test file content';

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 建立檔案系統模擬
		fsMock = new FSMock();
		// 替換原始的 fs 模組
		fsServiceMock = {
			promises: fsMock.promises,
			existsSync: fsMock.existsSync,
			statSync: fsMock.statSync,
		};

		// 直接將 fs 模組設為模擬物件
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule) {
			fsModule.exports = fsServiceMock;
		}

		// 初始化檔案服務
		fileService = new FileService(workspacePath);
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		sinon.restore();
		fsMock.reset();
	});

	it('should write file content', async () => {
		// 監視 writeFile 函數
		const writeFileSpy = sinon.spy(fsServiceMock.promises, 'writeFile');

		// 執行測試
		await fileService.writeFile(testFilePath, testContent);

		// 驗證寫入檔案方法被正確調用
		const expectedPath = path.join(workspacePath, testFilePath);
		assert(writeFileSpy.calledWith(expectedPath, testContent));
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
		// 監視 mkdir 函數
		const mkdirSpy = sinon.spy(fsServiceMock.promises, 'mkdir');
		const dirPath = 'test/directory';

		// 執行測試
		await fileService.createDirectory(dirPath);

		// 驗證目錄創建方法被正確調用
		const expectedPath = path.join(workspacePath, dirPath);
		assert(mkdirSpy.calledWith(expectedPath, { recursive: true }));
	});

	it('should copy files', async () => {
		// 準備來源檔案
		const sourcePath = 'source/file.txt';
		const destPath = 'dest/file.txt';
		const fullSourcePath = path.join(workspacePath, sourcePath);
		fsMock.addFile(fullSourcePath, testContent);

		// 監視 copyFile 函數
		const copyFileSpy = sinon.spy(fsServiceMock.promises, 'copyFile');

		// 執行測試
		await fileService.copyFile(sourcePath, destPath);

		// 驗證複製方法被正確調用
		const expectedSourcePath = path.join(workspacePath, sourcePath);
		const expectedDestPath = path.join(workspacePath, destPath);
		assert(copyFileSpy.calledWith(expectedSourcePath, expectedDestPath));
	});

	it('should delete files', async () => {
		// 準備要刪除的檔案
		const fullPath = path.join(workspacePath, testFilePath);
		fsMock.addFile(fullPath, testContent);

		// 監視 unlink 函數
		const unlinkSpy = sinon.spy(fsServiceMock.promises, 'unlink');

		// 執行測試
		await fileService.deleteFile(testFilePath);

		// 驗證刪除方法被正確調用
		assert(unlinkSpy.calledWith(fullPath));
	});

	it('should list files in directory', async () => {
		// 準備目錄和檔案
		const dirPath = 'test/dir';
		const fullDirPath = path.join(workspacePath, dirPath);
		fsMock.addDirectory(fullDirPath);

		// 添加一些檔案
		fsMock.addFile(path.join(fullDirPath, 'file1.txt'), 'content1');
		fsMock.addFile(path.join(fullDirPath, 'file2.txt'), 'content2');

		// 設置 readdir 的回傳值
		const readdirStub = sinon.stub(fsServiceMock.promises, 'readdir').resolves(['file1.txt', 'file2.txt']);

		// 執行測試
		const files = await fileService.listFiles(dirPath);

		// 驗證檔案列表
		assert.deepStrictEqual(files, ['file1.txt', 'file2.txt']);
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

		// 監視 writeFile 函數
		const writeFileSpy = sinon.spy(fsServiceMock.promises, 'writeFile');

		// 執行測試
		await fileService.writeJsonFile(jsonPath, jsonData, true);

		// 驗證寫入方法被正確調用，且內容為美化的 JSON
		const expectedPath = path.join(workspacePath, jsonPath);
		const expectedContent = JSON.stringify(jsonData, null, 2);
		assert(writeFileSpy.calledWith(expectedPath, expectedContent));
	});
});
