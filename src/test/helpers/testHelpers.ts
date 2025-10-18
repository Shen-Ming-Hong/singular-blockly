/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test Helper Functions for Isolated Component Testing
 *
 * This module provides helper functions to create isolated instances of services
 * with injected mocks for testing. Each helper follows the dependency injection
 * pattern to ensure test isolation and prevent side effects.
 *
 * Usage Example:
 * ```typescript
 * import { createIsolatedFileService, VSCodeMock, FSMock } from './helpers';
 *
 * let fsMock: FSMock;
 * let fileService: FileService;
 *
 * beforeEach(() => {
 *     fsMock = new FSMock();
 *     fsMock.addFile('/test/file.txt', 'content');
 *     fileService = createIsolatedFileService(fsMock);
 * });
 *
 * afterEach(() => {
 *     fsMock.reset();
 * });
 *
 * it('should read file', async () => {
 *     const content = await fileService.readFile('/test/file.txt');
 *     assert.strictEqual(content, 'content');
 * });
 * ```
 *
 * @see contracts/test-helpers.md for detailed API documentation
 * @see quickstart.md for testing patterns and examples
 */

import { VSCodeMock, FSMock } from './mocks';

/**
 * T013: Create isolated FileService with injected filesystem mock
 *
 * Creates a FileService instance with injected FSMock for testing.
 * The instance is isolated from the real filesystem.
 *
 * @param fsMock - FSMock instance with configured test data
 * @returns FileService instance using the provided mock
 *
 * @example
 * ```typescript
 * const fsMock = new FSMock();
 * fsMock.addFile('/workspace/test.json', '{"key": "value"}');
 * const fileService = createIsolatedFileService(fsMock);
 * const data = await fileService.readJsonFile('/workspace/test.json');
 * ```
 */
export function createIsolatedFileService(fsMock: FSMock): any {
	// TODO: Implement after T019 (FileService._setFileSystem)
	throw new Error('Not implemented - requires FileService._setFileSystem() injection point');
}

/**
 * T014: Create isolated SettingsManager with injected mocks
 *
 * Creates a SettingsManager instance with injected VSCode API and FileService mocks.
 *
 * @param vscodeMock - VSCodeMock instance with configured workspace
 * @param fileService - FileService instance (can be real or mocked)
 * @returns SettingsManager instance using the provided mocks
 *
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' } }];
 * const fileService = createIsolatedFileService(new FSMock());
 * const settingsManager = createIsolatedSettingsManager(vscodeMock, fileService);
 * ```
 */
export function createIsolatedSettingsManager(vscodeMock: VSCodeMock, fileService: any): any {
	// TODO: Implement after T020 (SettingsManager._setVSCodeApi and _setFileService)
	throw new Error('Not implemented - requires SettingsManager DI methods');
}

/**
 * T015: Create isolated LocaleService with injected mocks
 *
 * Creates a LocaleService instance with injected VSCode API and FileService mocks.
 *
 * @param vscodeMock - VSCodeMock instance with configured language
 * @param fileService - FileService instance with locale files
 * @returns LocaleService instance using the provided mocks
 *
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * vscodeMock.env.language = 'zh-hant';
 * const fsMock = new FSMock();
 * fsMock.addFile('/locales/zh-hant/messages.js', 'module.exports = {...}');
 * const fileService = createIsolatedFileService(fsMock);
 * const localeService = createIsolatedLocaleService(vscodeMock, fileService);
 * ```
 */
export function createIsolatedLocaleService(vscodeMock: VSCodeMock, fileService: any): any {
	// TODO: Implement after T021 (LocaleService._setVSCodeApi and _setFileService)
	throw new Error('Not implemented - requires LocaleService DI methods');
}

/**
 * T016: Create isolated WebViewManager with injected mocks
 *
 * Creates a WebViewManager instance with injected VSCode API, FileService, and extensionPath.
 * Automatically validates the WebView mock configuration before creating the instance.
 *
 * @param vscodeMock - VSCodeMock instance with configured webview panel
 * @param fileService - FileService instance with HTML template files
 * @param extensionPath - Extension root path for resource loading
 * @returns WebViewManager instance using the provided mocks
 *
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' } }];
 * const fsMock = new FSMock();
 * fsMock.addFile('/extension/media/html/blocklyEdit.html', '<html>...</html>');
 * const fileService = createIsolatedFileService(fsMock);
 * const manager = createIsolatedWebViewManager(vscodeMock, fileService, '/extension');
 * ```
 */
export function createIsolatedWebViewManager(vscodeMock: VSCodeMock, fileService: any, extensionPath: string): any {
	// Validate webview mock before creating instance
	validateWebViewMock(vscodeMock);

	// TODO: Implement after T009-T010 (WebViewManager._setVSCodeApi and _setFileService)
	throw new Error('Not implemented - requires WebViewManager DI methods');
}

/**
 * T017: Validate FileService mock configuration
 *
 * Throws descriptive error if the FileService mock is not properly configured.
 * Helps developers quickly identify and fix mock setup issues.
 *
 * @param fileService - FileService instance or mock to validate
 * @throws Error with remediation steps if validation fails
 *
 * @example
 * ```typescript
 * try {
 *     validateFileServiceMock(fileService);
 * } catch (error) {
 *     console.error('Mock setup issue:', error.message);
 *     // Error message includes link to quickstart.md
 * }
 * ```
 */
export function validateFileServiceMock(fileService: any): void {
	if (!fileService) {
		throw new Error(
			'FileService mock is null or undefined.\n' +
				'Remediation: Create FileService with FSMock:\n' +
				'  const fsMock = new FSMock();\n' +
				'  fsMock.addFile("/path/to/file.txt", "content");\n' +
				'  const fileService = createIsolatedFileService(fsMock);\n' +
				'See quickstart.md for more details.'
		);
	}

	// Check for essential FileService methods
	const requiredMethods = ['readFile', 'writeFile', 'fileExists'];
	const missingMethods = requiredMethods.filter(method => typeof fileService[method] !== 'function');

	if (missingMethods.length > 0) {
		throw new Error(
			`FileService mock is missing required methods: ${missingMethods.join(', ')}.\n` +
				'Remediation: Ensure FileService is created with createIsolatedFileService().\n' +
				'See contracts/test-helpers.md for FileService API requirements.'
		);
	}
}

/**
 * T018: Validate WebView mock configuration
 *
 * Throws descriptive error if the VSCodeMock webview is not properly configured.
 * Checks for: asWebviewUri, onDidReceiveMessage, onDidDispose, workspaceFolders.
 *
 * @param vscodeMock - VSCodeMock instance to validate
 * @throws Error with remediation steps if validation fails
 *
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' } }];
 * validateWebViewMock(vscodeMock); // Throws if incomplete
 * ```
 */
export function validateWebViewMock(vscodeMock: VSCodeMock): void {
	if (!vscodeMock) {
		throw new Error(
			'VSCodeMock is null or undefined.\n' +
				'Remediation: Create VSCodeMock instance:\n' +
				'  const vscodeMock = new VSCodeMock();\n' +
				'  vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: "/workspace" } }];\n' +
				'See quickstart.md Part 2 for WebView testing examples.'
		);
	}

	// Validate workspace folders
	if (!vscodeMock.workspace.workspaceFolders || vscodeMock.workspace.workspaceFolders.length === 0) {
		throw new Error(
			'VSCodeMock.workspace.workspaceFolders is empty.\n' +
				'Remediation: Set workspace folders before creating WebViewManager:\n' +
				'  vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: "/workspace" } }];\n' +
				'See contracts/mock-apis.md for VSCodeMock API structure.'
		);
	}

	// Validate window.createWebviewPanel
	if (!vscodeMock.window.createWebviewPanel || typeof vscodeMock.window.createWebviewPanel !== 'function') {
		throw new Error(
			'VSCodeMock.window.createWebviewPanel is not a function.\n' +
				'Remediation: Ensure you are using the enhanced VSCodeMock from mocks.ts.\n' +
				'See contracts/mock-apis.md for required WebView API structure.'
		);
	}

	// Create a test webview panel to validate structure
	try {
		const testPanel = vscodeMock.window.createWebviewPanel('test', 'Test', 1, {});

		// Validate essential webview properties
		if (!testPanel.webview) {
			throw new Error('WebView panel missing "webview" property');
		}

		const requiredMethods = ['asWebviewUri', 'onDidReceiveMessage', 'postMessage'];
		const missingMethods = requiredMethods.filter(method => typeof testPanel.webview[method] !== 'function');

		if (missingMethods.length > 0) {
			throw new Error(
				`WebView mock is missing required methods: ${missingMethods.join(', ')}.\n` +
					'Remediation: Use the enhanced VSCodeMock from src/test/helpers/mocks.ts.\n' +
					'The mock should include fixes from T004 (asWebviewUri) and T005 (onDidDispose).\n' +
					'See contracts/mock-apis.md for complete WebView API requirements.'
			);
		}

		// Validate onDidDispose
		if (typeof testPanel.onDidDispose !== 'function') {
			throw new Error(
				'WebView panel missing "onDidDispose" method.\n' +
					'Remediation: Ensure VSCodeMock includes T005 fix for onDidDispose callback handling.\n' +
					'See contracts/mock-apis.md for required panel lifecycle methods.'
			);
		}
	} catch (error: any) {
		throw new Error(
			`WebView mock validation failed: ${error.message}\n` +
				'Remediation: Use the enhanced VSCodeMock from src/test/helpers/mocks.ts.\n' +
				'See quickstart.md Part 2 for WebView testing setup examples.'
		);
	}
}
