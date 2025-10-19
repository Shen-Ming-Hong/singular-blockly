/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { VSCodeMock, FSMock } from './mocks';
import {
	createIsolatedFileService,
	createIsolatedSettingsManager,
	createIsolatedLocaleService,
	createIsolatedWebViewManager,
	validateFileServiceMock,
	validateWebViewMock,
} from './testHelpers';

suite('Test Helpers', () => {
	suite('T013: createIsolatedFileService', () => {
		test('should create FileService with injected FSMock', () => {
			const fsMock = new FSMock();
			fsMock.addFile('/workspace/test.txt', 'test content');

			const fileService = createIsolatedFileService(fsMock, '/workspace');

			assert.ok(fileService, 'FileService should be created');
			assert.strictEqual(typeof fileService.readFile, 'function', 'Should have readFile method');
			assert.strictEqual(typeof fileService.writeFile, 'function', 'Should have writeFile method');
		});

		test('should throw error if FSMock is null', () => {
			assert.throws(() => createIsolatedFileService(null as any), /FSMock is null or undefined/, 'Should throw descriptive error');
		});

		test('should use injected FSMock for file operations', async () => {
			const fsMock = new FSMock();
			// FileService uses path.join(workspacePath, relativePath)
			// So we need to add file at the full path
			fsMock.addFile('/workspace/test.json', '{"key": "value"}');

			const fileService = createIsolatedFileService(fsMock, '/workspace');
			// FileService.readFile accepts relative path and joins it with workspacePath
			const content = await fileService.readFile('test.json');

			assert.strictEqual(content, '{"key": "value"}', 'Should read from FSMock');
		});
	});

	suite('T014: createIsolatedSettingsManager', () => {
		test('should create SettingsManager with injected mocks', () => {
			const vscodeMock = new VSCodeMock();
			const fsMock = new FSMock();
			const fileService = createIsolatedFileService(fsMock, '/workspace');

			const settingsManager = createIsolatedSettingsManager(vscodeMock, fileService, '/workspace');

			assert.ok(settingsManager, 'SettingsManager should be created');
			assert.strictEqual(typeof settingsManager.readSetting, 'function', 'Should have readSetting method');
			assert.strictEqual(typeof settingsManager.updateSetting, 'function', 'Should have updateSetting method');
		});

		test('should throw error if VSCodeMock is null', () => {
			const fsMock = new FSMock();
			const fileService = createIsolatedFileService(fsMock);

			assert.throws(
				() => createIsolatedSettingsManager(null as any, fileService),
				/VSCodeMock is null or undefined/,
				'Should throw descriptive error'
			);
		});

		test('should throw error if FileService is invalid', () => {
			const vscodeMock = new VSCodeMock();

			assert.throws(
				() => createIsolatedSettingsManager(vscodeMock, null as any),
				/FileService mock is null or undefined/,
				'Should throw descriptive error'
			);
		});
	});

	suite('T015: createIsolatedLocaleService', () => {
		test('should create LocaleService with injected mocks', () => {
			const vscodeMock = new VSCodeMock();
			vscodeMock.env.language = 'en';
			const fsMock = new FSMock();

			const localeService = createIsolatedLocaleService(vscodeMock, fsMock, '/extension');

			assert.ok(localeService, 'LocaleService should be created');
			assert.strictEqual(typeof localeService.getLocalizedMessage, 'function', 'Should have getLocalizedMessage method');
		});

		test('should throw error if VSCodeMock is null', () => {
			const fsMock = new FSMock();

			assert.throws(
				() => createIsolatedLocaleService(null as any, fsMock),
				/VSCodeMock is null or undefined/,
				'Should throw descriptive error'
			);
		});

		test('should throw error if FSMock is null', () => {
			const vscodeMock = new VSCodeMock();

			assert.throws(
				() => createIsolatedLocaleService(vscodeMock, null as any),
				/FSMock is null or undefined/,
				'Should throw descriptive error'
			);
		});
	});

	suite('T016: createIsolatedWebViewManager', () => {
		test('should create WebViewManager with injected mocks', () => {
			const vscodeMock = new VSCodeMock();
			vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' }, name: 'test', index: 0 }];

			const fsMock = new FSMock();
			fsMock.addFile('/extension/media/html/blocklyEdit.html', '<html></html>');

			const fileService = createIsolatedFileService(fsMock, '/workspace');
			const localeService = createIsolatedLocaleService(vscodeMock, fsMock, '/extension');

			const manager = createIsolatedWebViewManager(vscodeMock, localeService, fileService, '/extension');

			assert.ok(manager, 'WebViewManager should be created');
			assert.strictEqual(typeof manager.createAndShowWebView, 'function', 'Should have createAndShowWebView method');
		});

		test('should validate WebView mock before creation', () => {
			const vscodeMock = new VSCodeMock();
			// Intentionally not setting workspaceFolders - set to empty array
			vscodeMock.workspace.workspaceFolders = [];

			const fsMock = new FSMock();
			const fileService = createIsolatedFileService(fsMock);
			const localeService = createIsolatedLocaleService(vscodeMock, fsMock);

			try {
				createIsolatedWebViewManager(vscodeMock, localeService, fileService, '/extension');
				assert.fail('Should have thrown validation error');
			} catch (error: any) {
				assert.ok(error.message.includes('workspaceFolders is empty'), 'Should throw validation error about workspaceFolders');
			}
		});

		test('should throw error if LocaleService is null', () => {
			const vscodeMock = new VSCodeMock();
			vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' }, name: 'test', index: 0 }];

			const fsMock = new FSMock();
			const fileService = createIsolatedFileService(fsMock);

			assert.throws(
				() => createIsolatedWebViewManager(vscodeMock, null as any, fileService, '/extension'),
				/LocaleService is null or undefined/,
				'Should throw descriptive error'
			);
		});
	});

	suite('T017: validateFileServiceMock', () => {
		test('should pass validation for valid FileService', () => {
			const fsMock = new FSMock();
			const fileService = createIsolatedFileService(fsMock);

			assert.doesNotThrow(() => validateFileServiceMock(fileService), 'Should not throw for valid mock');
		});

		test('should throw error if FileService is null', () => {
			assert.throws(
				() => validateFileServiceMock(null as any),
				/FileService mock is null or undefined/,
				'Should throw descriptive error'
			);
		});

		test('should throw error if FileService is missing required methods', () => {
			const incompleteMock = {
				readFile: () => {},
				// Missing writeFile and fileExists
			};

			assert.throws(
				() => validateFileServiceMock(incompleteMock),
				/missing required methods/,
				'Should throw error about missing methods'
			);
		});

		test('error message should include remediation steps', () => {
			try {
				validateFileServiceMock(null as any);
				assert.fail('Should have thrown error');
			} catch (error: any) {
				assert.ok(error.message.includes('Remediation:'), 'Error should include remediation section');
				assert.ok(error.message.includes('createIsolatedFileService'), 'Should reference helper function');
			}
		});
	});

	suite('T018: validateWebViewMock', () => {
		test('should pass validation for valid VSCodeMock', () => {
			const vscodeMock = new VSCodeMock();
			vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' }, name: 'test', index: 0 }];

			assert.doesNotThrow(() => validateWebViewMock(vscodeMock), 'Should not throw for valid mock');
		});

		test('should throw error if VSCodeMock is null', () => {
			assert.throws(() => validateWebViewMock(null as any), /VSCodeMock is null or undefined/, 'Should throw descriptive error');
		});

		test('should throw error if workspaceFolders is empty', () => {
			const vscodeMock = new VSCodeMock();
			vscodeMock.workspace.workspaceFolders = [];

			assert.throws(() => validateWebViewMock(vscodeMock), /workspaceFolders is empty/, 'Should throw descriptive error');
		});

		test('should throw error if createWebviewPanel is missing', () => {
			const vscodeMock = new VSCodeMock();
			vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' }, name: 'test', index: 0 }];
			vscodeMock.window.createWebviewPanel = undefined as any;

			assert.throws(() => validateWebViewMock(vscodeMock), /createWebviewPanel is not a function/, 'Should throw descriptive error');
		});

		test('error message should include remediation steps', () => {
			try {
				validateWebViewMock(null as any);
				assert.fail('Should have thrown error');
			} catch (error: any) {
				assert.ok(error.message.includes('Remediation:'), 'Error should include remediation section');
				assert.ok(error.message.includes('VSCodeMock'), 'Should reference VSCodeMock');
			}
		});
	});
});
