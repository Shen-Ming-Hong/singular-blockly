# Test Helpers API Contract

**Feature**: Test Coverage Improvement (004)  
**Purpose**: Define the public API for test helper functions that enable dependency injection

---

## Overview

This document specifies the contract for test helper functions in `src/test/helpers/testHelpers.ts`. These helpers simplify test setup by providing pre-configured service instances with injected mocks.

---

## Core Principles

1. **Simplicity**: Each helper is <10 lines of code, wrapping existing DI methods
2. **Type Safety**: All helpers preserve TypeScript types from original services
3. **Isolation**: Each call returns a fresh instance with isolated mocks
4. **Guided Recovery**: Validation helpers throw descriptive errors with remediation steps

---

## Test Helper Functions

### createIsolatedFileService

**Purpose**: Create FileService with mocked filesystem

**Signature**:

```typescript
function createIsolatedFileService(fsMock: FSMock): FileService;
```

**Parameters**:

-   `fsMock: FSMock` - Mock filesystem from `mocks.ts`

**Returns**:

-   `FileService` instance with injected mock

**Behavior**:

1. Create new FileService instance
2. Call `fileService._setFileSystem(fsMock)`
3. Return configured instance

**Example**:

```typescript
import { createIsolatedFileService } from './helpers/testHelpers';
import { FSMock } from './helpers/mocks';

describe('FileService', () => {
	let fileService: FileService;
	let fsMock: FSMock;

	beforeEach(() => {
		fsMock = new FSMock();
		fileService = createIsolatedFileService(fsMock);
	});

	it('should read file content', async () => {
		fsMock.addFile('/test.json', '{"key": "value"}');
		const content = await fileService.readFile('/test.json');
		assert.strictEqual(content, '{"key": "value"}');
	});
});
```

**Constraints**:

-   Must not modify global state
-   Must not leak mocks between test cases
-   Must work with existing FSMock implementation

---

### createIsolatedSettingsManager

**Purpose**: Create SettingsManager with mocked VSCode API and filesystem

**Signature**:

```typescript
function createIsolatedSettingsManager(vscodeMock: VSCodeMock, fileServiceMock: FileService): SettingsManager;
```

**Parameters**:

-   `vscodeMock: VSCodeMock` - Mock VSCode API from `mocks.ts`
-   `fileServiceMock: FileService` - Mock or isolated FileService instance

**Returns**:

-   `SettingsManager` instance with injected mocks

**Behavior**:

1. Create new SettingsManager instance
2. Call `settingsManager._setVSCodeApi(vscodeMock)`
3. Call `settingsManager._setFileService(fileServiceMock)`
4. Return configured instance

**Example**:

```typescript
import { createIsolatedSettingsManager, createIsolatedFileService } from './helpers/testHelpers';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('SettingsManager', () => {
	let settingsManager: SettingsManager;
	let vscodeMock: VSCodeMock;
	let fileService: FileService;

	beforeEach(() => {
		vscodeMock = new VSCodeMock();
		fileService = createIsolatedFileService(new FSMock());
		settingsManager = createIsolatedSettingsManager(vscodeMock, fileService);
	});

	it('should sync PlatformIO settings', async () => {
		// Test implementation
	});
});
```

**Constraints**:

-   Must accept either real or mock FileService
-   Must handle missing workspace folders gracefully
-   Must not call VSCode API during construction

---

### createIsolatedLocaleService

**Purpose**: Create LocaleService with mocked filesystem and VSCode API

**Signature**:

```typescript
function createIsolatedLocaleService(vscodeMock: VSCodeMock, fileServiceMock: FileService): LocaleService;
```

**Parameters**:

-   `vscodeMock: VSCodeMock` - Mock VSCode API (for `vscode.env.language`)
-   `fileServiceMock: FileService` - Mock FileService for locale file loading

**Returns**:

-   `LocaleService` instance with injected mocks

**Behavior**:

1. Create new LocaleService instance
2. Call `localeService._setVSCodeApi(vscodeMock)`
3. Call `localeService._setFileService(fileServiceMock)`
4. Return configured instance

**Example**:

```typescript
import { createIsolatedLocaleService, createIsolatedFileService } from './helpers/testHelpers';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('LocaleService', () => {
	let localeService: LocaleService;
	let vscodeMock: VSCodeMock;
	let fsMock: FSMock;

	beforeEach(() => {
		vscodeMock = new VSCodeMock();
		vscodeMock.env.language = 'zh-tw';

		fsMock = new FSMock();
		fsMock.addFile('/media/locales/zh-hant/messages.js', 'Blockly.Msg.TEST = "測試";');

		const fileService = createIsolatedFileService(fsMock);
		localeService = createIsolatedLocaleService(vscodeMock, fileService);
	});

	it('should load Traditional Chinese messages', async () => {
		const message = await localeService.getMessage('TEST', 'fallback');
		assert.strictEqual(message, '測試');
	});
});
```

**Constraints**:

-   Must handle missing locale files gracefully (return fallback)
-   Must support all language codes (en, zh-hant, ja, etc.)
-   Must cache loaded messages per instance

---

### createIsolatedWebViewManager

**Purpose**: Create WebViewManager with complete mocked VSCode API and FileService

**Signature**:

```typescript
function createIsolatedWebViewManager(vscodeMock: VSCodeMock, fileServiceMock: FileService, extensionPath: string): WebViewManager;
```

**Parameters**:

-   `vscodeMock: VSCodeMock` - Mock VSCode API with complete WebView structure
-   `fileServiceMock: FileService` - Mock FileService for HTML/JS template loading
-   `extensionPath: string` - Mock extension path (e.g., '/mock/extension')

**Returns**:

-   `WebViewManager` instance with injected mocks

**Behavior**:

1. Validate VSCodeMock has complete WebView API (via `validateWebViewMock`)
2. Create new WebViewManager instance
3. Call `webViewManager._setVSCodeApi(vscodeMock)`
4. Call `webViewManager._setFileService(fileServiceMock)`
5. Return configured instance

**Example**:

```typescript
import { createIsolatedWebViewManager, createIsolatedFileService } from './helpers/testHelpers';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('WebViewManager', () => {
	let webViewManager: WebViewManager;
	let vscodeMock: VSCodeMock;
	let fsMock: FSMock;

	beforeEach(() => {
		vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' } }];

		fsMock = new FSMock();
		fsMock.addFile('/media/html/blocklyEdit.html', '<html>...</html>');

		const fileService = createIsolatedFileService(fsMock);
		webViewManager = createIsolatedWebViewManager(vscodeMock, fileService, '/mock/extension');
	});

	it('should create WebView panel with correct URI conversion', () => {
		const panel = webViewManager.createBlocklyEditPanel(context, {});
		assert(vscodeMock.window.createWebviewPanel.calledOnce);
		assert(panel.webview.asWebviewUri.called);
	});
});
```

**Constraints**:

-   Must validate VSCodeMock has `asWebviewUri`, `createWebviewPanel`, `workspaceFolders`
-   Must throw descriptive error if mock is incomplete (guided recovery)
-   Must dispose WebView panels properly in teardown

---

## Validation Helper Functions

### validateFileServiceMock

**Purpose**: Validate FileService mock is properly configured

**Signature**:

```typescript
function validateFileServiceMock(fileService: FileService): void;
```

**Parameters**:

-   `fileService: FileService` - Service instance to validate

**Throws**:

-   `Error` with remediation message if mock not configured

**Behavior**:

1. Check if `fileService._getFileSystem()` returns non-null
2. Verify filesystem has required methods (`promises`, `existsSync`)
3. Throw with guided recovery message if validation fails

**Error Message Template**:

```
FileService mock not configured.
→ Fix: Call fileService._setFileSystem(fsMock) in beforeEach
→ Example:
  beforeEach(() => {
      const fsMock = new FSMock();
      fileService._setFileSystem(fsMock);
  });
→ See: quickstart.md section "Setting Up FileService Tests"
```

**Example**:

```typescript
it('should validate mock setup', () => {
	const fileService = new FileService();
	// Forget to call _setFileSystem

	assert.throws(() => {
		validateFileServiceMock(fileService);
	}, /FileService mock not configured/);
});
```

---

### validateWebViewMock

**Purpose**: Validate VSCodeMock has complete WebView API structure

**Signature**:

```typescript
function validateWebViewMock(vscodeMock: VSCodeMock): void;
```

**Parameters**:

-   `vscodeMock: VSCodeMock` - Mock to validate

**Throws**:

-   `Error` with remediation message if WebView structure incomplete

**Behavior**:

1. Check `vscodeMock.window.createWebviewPanel` exists and is a stub
2. Verify returned panel has `webview.asWebviewUri` method
3. Verify `vscodeMock.workspace.workspaceFolders` is set
4. Throw with guided recovery message if validation fails

**Error Message Template**:

```
VSCodeMock missing WebView API structure.
→ Fix: Ensure createWebviewPanel returns complete WebView object
→ Required properties:
  - webview.asWebviewUri (function)
  - webview.onDidReceiveMessage (function)
  - onDidDispose (function)
  - workspace.workspaceFolders (array)
→ See: quickstart.md section "Setting Up WebView Tests"
→ Reference: src/test/helpers/mocks.ts lines 48-73
```

**Example**:

```typescript
it('should validate WebView mock structure', () => {
	const vscodeMock = new VSCodeMock();
	// Mock is already complete in our implementation

	assert.doesNotThrow(() => {
		validateWebViewMock(vscodeMock);
	});
});
```

---

## Fail-Fast Helpers

### enableFailFast

**Purpose**: Enable fail-fast mode for current test run (informational only)

**Signature**:

```typescript
function enableFailFast(): void;
```

**Behavior**:

-   Logs informational message: "Fail-fast mode enabled via --bail flag"
-   Does NOT modify Mocha behavior (use `npm run test:bail` instead)

**Notes**:

-   This is a documentation helper, not an implementation
-   Actual fail-fast is controlled by Mocha `--bail` flag
-   Included for discoverability in test helper API

---

### getRecommendedTestOrder

**Purpose**: Return recommended test order for fail-fast mode

**Signature**:

```typescript
function getRecommendedTestOrder(): string[];
```

**Returns**:

-   Array of test file names in recommended execution order

**Behavior**:

```typescript
return [
	'logging.test.ts', // ✅ Already passing (reference)
	'fileService.test.ts', // ⚠️ 6/10 passing (quick wins)
	'localeService.test.ts', // ⚠️ 3/9 passing
	'settingsManager.test.ts', // ❌ Needs full rewrite
	'webviewManager.test.ts', // ❌ 0/8 passing (most complex)
];
```

**Example**:

```typescript
// In package.json test script (informational)
// "test:bail": "mocha --bail src/test/{logging,fileService,localeService,settingsManager,webviewManager}.test.ts"
```

---

## Implementation Checklist

-   [ ] Create `src/test/helpers/testHelpers.ts`
-   [ ] Implement 4 `createIsolated*` factory functions
-   [ ] Implement 2 `validate*` validation functions
-   [ ] Add 2 fail-fast informational helpers
-   [ ] Add JSDoc comments with examples
-   [ ] Add unit tests for helpers (meta-testing)
-   [ ] Update existing tests to use helpers (incremental migration)

---

**Next Steps**: Create quickstart.md with step-by-step guide for using these test helpers.
