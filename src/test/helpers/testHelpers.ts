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
 * @param workspacePath - Optional workspace path (defaults to '/workspace')
 * @returns FileService instance using the provided mock
 *
 * @example
 * ```typescript
 * const fsMock = new FSMock();
 * fsMock.addFile('/workspace/test.json', '{"key": "value"}');
 * const fileService = createIsolatedFileService(fsMock);
 * const data = await fileService.readJsonFile('test.json', {});
 * ```
 */
export function createIsolatedFileService(fsMock: FSMock, workspacePath: string = '/workspace'): any {
	// Validate mock before creating instance
	if (!fsMock) {
		throw new Error(
			'FSMock is null or undefined.\n' +
				'Remediation: Create FSMock instance:\n' +
				'  const fsMock = new FSMock();\n' +
				'  fsMock.addFile("/workspace/file.txt", "content");\n' +
				'See quickstart.md for FSMock usage examples.'
		);
	}

	// Import FileService dynamically to avoid circular dependencies
	const { FileService } = require('../../services/fileService');

	// FileService already supports constructor-based DI
	return new FileService(workspacePath, fsMock);
}

/**
 * T014: Create isolated SettingsManager with injected mocks
 *
 * Creates a SettingsManager instance with injected VSCode API and FileService mocks.
 *
 * @param vscodeMock - VSCodeMock instance with configured workspace
 * @param fileService - FileService instance (can be real or mocked)
 * @param workspacePath - Optional workspace path (defaults to fileService's workspacePath)
 * @returns SettingsManager instance using the provided mocks
 *
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' } }];
 * const fsMock = new FSMock();
 * const fileService = createIsolatedFileService(fsMock, '/workspace');
 * const settingsManager = createIsolatedSettingsManager(vscodeMock, fileService);
 * ```
 */
export function createIsolatedSettingsManager(vscodeMock: VSCodeMock, fileService: any, workspacePath: string = '/workspace'): any {
	// Validate mocks before creating instance
	if (!vscodeMock) {
		throw new Error(
			'VSCodeMock is null or undefined.\n' +
				'Remediation: Create VSCodeMock instance:\n' +
				'  const vscodeMock = new VSCodeMock();\n' +
				'  vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: "/workspace" } }];\n' +
				'See quickstart.md for VSCodeMock usage examples.'
		);
	}

	validateFileServiceMock(fileService);

	// Import SettingsManager dynamically to avoid circular dependencies
	const { SettingsManager } = require('../../services/settingsManager');

	// SettingsManager constructor accepts workspacePath
	// It will internally create its own FileService
	// For testing, we need to inject the fileService after construction
	const manager = new SettingsManager(workspacePath);

	// Replace the internal fileService with our mock
	// @ts-ignore - Accessing private property for testing
	manager.fileService = fileService;

	return manager;
}

/**
 * T015: Create isolated LocaleService with injected mocks
 *
 * Creates a LocaleService instance with injected VSCode API and FileService mocks.
 *
 * @param vscodeMock - VSCodeMock instance with configured language
 * @param fsMock - FSMock instance with locale files
 * @param extensionPath - Extension root path (defaults to '/extension')
 * @returns LocaleService instance using the provided mocks
 *
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * vscodeMock.env.language = 'zh-hant';
 * const fsMock = new FSMock();
 * fsMock.addFile('/extension/media/locales/zh-hant/messages.js', 'module.exports = {...}');
 * const localeService = createIsolatedLocaleService(vscodeMock, fsMock);
 * ```
 */
export function createIsolatedLocaleService(vscodeMock: VSCodeMock, fsMock: FSMock, extensionPath: string = '/extension'): any {
	// Validate mocks before creating instance
	if (!vscodeMock) {
		throw new Error(
			'VSCodeMock is null or undefined.\n' +
				'Remediation: Create VSCodeMock instance:\n' +
				'  const vscodeMock = new VSCodeMock();\n' +
				'  vscodeMock.env.language = "en";\n' +
				'See quickstart.md for VSCodeMock usage examples.'
		);
	}

	if (!fsMock) {
		throw new Error(
			'FSMock is null or undefined.\n' +
				'Remediation: Create FSMock instance:\n' +
				'  const fsMock = new FSMock();\n' +
				'  fsMock.addFile("/extension/media/locales/en/messages.js", "module.exports = {...}");\n' +
				'See quickstart.md for FSMock usage examples.'
		);
	}

	// Import LocaleService dynamically to avoid circular dependencies
	const { LocaleService } = require('../../services/localeService');

	// LocaleService already supports constructor-based DI
	return new LocaleService(extensionPath, fsMock, vscodeMock);
}

/**
 * T016: Create isolated WebViewManager with injected mocks
 *
 * Creates a WebViewManager instance with injected VSCode API, FileService, and extensionPath.
 * Automatically validates the WebView mock configuration before creating the instance.
 *
 * @param vscodeMock - VSCodeMock instance with configured webview panel
 * @param localeService - LocaleService instance for i18n support
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
 * const fileService = createIsolatedFileService(fsMock, '/workspace');
 * const localeService = createIsolatedLocaleService(vscodeMock, fsMock, '/extension');
 * const manager = createIsolatedWebViewManager(vscodeMock, localeService, fileService, '/extension');
 * ```
 */
export function createIsolatedWebViewManager(vscodeMock: VSCodeMock, localeService: any, fileService: any, extensionPath: string): any {
	// Validate webview mock before creating instance
	validateWebViewMock(vscodeMock);
	validateFileServiceMock(fileService);

	if (!localeService) {
		throw new Error(
			'LocaleService is null or undefined.\n' +
				'Remediation: Create LocaleService instance:\n' +
				'  const localeService = createIsolatedLocaleService(vscodeMock, fsMock, extensionPath);\n' +
				'See quickstart.md for LocaleService usage examples.'
		);
	}

	// Import WebViewManager and related functions using named imports
	const webviewModule = require('../../webview/webviewManager');
	const { WebViewManager, _setVSCodeApi } = webviewModule;

	// Set the VSCode API before creating the manager
	_setVSCodeApi(vscodeMock);

	// Create mock ExtensionContext
	const mockContext: any = {
		extensionPath,
		subscriptions: [],
		workspaceState: {
			get: () => undefined,
			update: () => Promise.resolve(),
		},
		globalState: {
			get: () => undefined,
			update: () => Promise.resolve(),
		},
		extensionUri: { fsPath: extensionPath },
	};

	// WebViewManager already supports constructor-based DI for localeService and fileService
	return new WebViewManager(mockContext, localeService, fileService);
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
