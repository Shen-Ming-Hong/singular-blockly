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

		// 初始化檔案服務，注入 fs mock
		fileService = new FileService(workspacePath, fsServiceMock as any);
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
		const expectedPath = path.join(workspacePath, testFilePath);
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

		// 驗證目錄是否被創建到 mock 中
		const expectedPath = path.join(workspacePath, dirPath);
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

		// 驗證檔案是否被複製到目標位置
		const expectedDestPath = path.join(workspacePath, destPath);
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
		fsMock.addDirectory(fullDirPath);

		// 添加一些檔案
		fsMock.addFile(path.join(fullDirPath, 'file1.txt'), 'content1');
		fsMock.addFile(path.join(fullDirPath, 'file2.txt'), 'content2');

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

		// 執行測試
		await fileService.writeJsonFile(jsonPath, jsonData, true);

		// 驗證寫入的內容
		const expectedPath = path.join(workspacePath, jsonPath);
		const expectedContent = JSON.stringify(jsonData, null, 2);
		assert.strictEqual(fsMock.files.get(expectedPath), expectedContent);
	});
});
