/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { FileService } from '../services/fileService';
import { FSMock } from './helpers/mocks';

/** Test suite for FileService.getFileStats */
describe('File Service - getFileStats', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let fileService: FileService;
	const workspacePath = '/mock/workspace';
	const testFilePath = 'test/file.txt';

	beforeEach(() => {
		fsMock = new FSMock();
		fsServiceMock = {
			promises: {
				...fsMock.promises,
				stat: sinon.stub(),
			},
			existsSync: fsMock.existsSync,
			statSync: fsMock.statSync,
		};

		fileService = new FileService(workspacePath, fsServiceMock as any);
	});

	afterEach(() => {
		sinon.restore();
		fsMock.reset();
	});

	it('should return file stats for existing file', async () => {
		const fullPath = path.join(workspacePath, testFilePath);
		fsMock.addFile(fullPath, 'content');

		const fakeStats = {
			birthtime: new Date('2024-01-01T00:00:00Z'),
			mtime: new Date('2024-01-02T00:00:00Z'),
			size: 123,
		} as any;

		// 設置 stub 在被調用時返回 fakeStats
		(fsServiceMock.promises.stat as sinon.SinonStub).withArgs(fullPath).resolves(fakeStats);

		const stats = await fileService.getFileStats(testFilePath);

		assert(stats);
		assert(stats!.birthtime instanceof Date);
		assert.strictEqual(stats!.birthtime.toISOString(), fakeStats.birthtime.toISOString());
	});
	it('should return null for missing file', async () => {
		// 不添加檔案，使其不存在
		const stats = await fileService.getFileStats('missing.txt');

		// 驗證返回 null
		assert.strictEqual(stats, null);
	});
});
