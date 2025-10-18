# Quickstart Guide: Writing Isolated Tests

**Feature**: Test Coverage Improvement (004)  
**Audience**: Developers writing or fixing tests for Singular Blockly services  
**Time to Complete**: 15 minutes for first test (per SC-007)

---

## Overview

This guide teaches you how to write isolated, testable unit tests for Singular Blockly services using dependency injection. By the end, you'll know how to:

1. Set up test mocks in <5 lines (per US-002)
2. Write isolated tests that don't depend on real VSCode API or filesystem
3. Use fail-fast mode for rapid debugging
4. Interpret guided recovery error messages

---

## Prerequisites

-   Basic TypeScript knowledge
-   Familiarity with Mocha test framework
-   Understanding of `beforeEach`/`afterEach` lifecycle

---

## Quick Reference

### Common Patterns

```typescript
// Pattern 1: Test FileService
import { createIsolatedFileService } from './helpers/testHelpers';
import { FSMock } from './helpers/mocks';

const fsMock = new FSMock();
const fileService = createIsolatedFileService(fsMock);

// Pattern 2: Test WebViewManager
import { createIsolatedWebViewManager, createIsolatedFileService } from './helpers/testHelpers';
import { VSCodeMock, FSMock } from './helpers/mocks';

const vscodeMock = new VSCodeMock();
const fileService = createIsolatedFileService(new FSMock());
const webViewManager = createIsolatedWebViewManager(vscodeMock, fileService, '/mock/extension');

// Pattern 3: Fail-fast mode (terminal)
npm run test:bail  # Stops at first failure

// Pattern 4: Guided recovery (read error messages)
Error: FileService mock not configured.
→ Fix: Call fileService._setFileSystem(fsMock) in beforeEach
→ See: This guide, section "Setting Up FileService Tests"
```

---

## Part 1: Your First Isolated Test (FileService)

### Step 1: Import Test Helpers

```typescript
import * as assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { FileService } from '../services/fileService';
import { createIsolatedFileService } from './helpers/testHelpers';
import { FSMock } from './helpers/mocks';
```

**What's happening**: We're importing the service to test (`FileService`) and the test helpers that create isolated instances.

---

### Step 2: Set Up Test Fixtures

```typescript
describe('FileService - Isolated Tests', () => {
	let fileService: FileService;
	let fsMock: FSMock;

	beforeEach(() => {
		// Create fresh mock for each test
		fsMock = new FSMock();

		// Pre-populate virtual filesystem
		fsMock.addFile('/workspace/test.json', '{"key": "value"}');
		fsMock.addDirectory('/workspace/subfolder');

		// Create isolated service instance
		fileService = createIsolatedFileService(fsMock);
	});

	afterEach(() => {
		// Clean up (automatic with fresh mocks, but good practice)
		fsMock.clear();
	});
});
```

**What's happening**:

-   `beforeEach` runs before EACH test, giving you a fresh, isolated environment
-   `fsMock.addFile()` pre-populates the virtual filesystem with test data
-   `createIsolatedFileService()` creates a FileService with the mock injected

**Key Principle**: Each test gets a fresh mock = no shared state = no flaky tests

---

### Step 3: Write Your Test

```typescript
it('should read file content from virtual filesystem', async () => {
	// Act: Call the service method
	const content = await fileService.readFile('/workspace/test.json');

	// Assert: Verify expected behavior
	assert.strictEqual(content, '{"key": "value"}');

	// Optional: Verify filesystem was accessed correctly
	assert(fsMock.promises.readFile.calledOnce);
	assert(fsMock.promises.readFile.calledWith('/workspace/test.json', 'utf8'));
});
```

**What's happening**:

1. **Act**: Call the method you're testing
2. **Assert**: Verify the return value is correct
3. **Optional**: Verify the mock was called correctly (using Sinon spy assertions)

---

### Step 4: Run Your Test

```bash
# Run all tests
npm test

# Run just FileService tests
npm test -- --grep "FileService"

# Run with fail-fast mode
npm run test:bail
```

**Expected Output**:

```
  FileService - Isolated Tests
    ✓ should read file content from virtual filesystem (5ms)

  1 passing (15ms)
```

---

## Part 2: Testing Services with Multiple Dependencies

### Example: WebViewManager (VSCode API + FileService)

**Challenge**: WebViewManager depends on both VSCode API and FileService.

**Solution**: Use nested helper functions to build up dependencies.

```typescript
import { createIsolatedWebViewManager, createIsolatedFileService } from './helpers/testHelpers';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('WebViewManager - Isolated Tests', () => {
	let webViewManager: WebViewManager;
	let vscodeMock: VSCodeMock;
	let fileService: FileService;
	let fsMock: FSMock;
	const extensionPath = '/mock/extension';

	beforeEach(() => {
		// 1. Create VSCode mock
		vscodeMock = new VSCodeMock();
		vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/mock/workspace' }, name: 'mock', index: 0 }];

		// 2. Create filesystem mock with HTML templates
		fsMock = new FSMock();
		fsMock.addFile(`${extensionPath}/media/html/blocklyEdit.html`, '<html><head></head><body></body></html>');
		fsMock.addFile(`${extensionPath}/media/toolbox/index.json`, '{"contents": []}');

		// 3. Create isolated FileService
		fileService = createIsolatedFileService(fsMock);

		// 4. Create isolated WebViewManager with all dependencies
		webViewManager = createIsolatedWebViewManager(vscodeMock, fileService, extensionPath);
	});

	it('should create WebView panel with correct URI conversion', () => {
		// Act
		const context = { extensionPath };
		const panel = webViewManager.createBlocklyEditPanel(context, {});

		// Assert
		assert(vscodeMock.window.createWebviewPanel.calledOnce);
		assert.strictEqual(panel.viewType, 'blocklyEdit');
		assert(panel.webview.asWebviewUri.called); // URI conversion happened
	});
});
```

**Key Insights**:

-   Build dependencies bottom-up: FileService → WebViewManager
-   Configure VSCode mock BEFORE creating services (set workspaceFolders)
-   Pre-populate filesystem with ALL files the service needs

---

## Part 3: Fail-Fast Mode (US-001)

### What is Fail-Fast Mode?

**Problem**: Running 68 tests takes time. If test #3 fails, you waste time waiting for tests #4-68.

**Solution**: Fail-fast mode stops at the first failure.

### How to Use It

**Terminal Command**:

```bash
npm run test:bail
```

**What Happens**:

```
  FileService
    ✓ should read file content
    ✓ should write file content
    ✗ should handle missing files

  2 passing (10ms)
  1 failing

Error: Expected ENOENT error but got...
→ Fix: Check mock configuration in beforeEach
→ See: quickstart.md section "Common Pitfalls"

# Test run stopped (59 tests skipped)
```

**Benefits**:

-   Faster feedback (seconds vs minutes)
-   Focus on one problem at a time
-   Recommended for TDD workflow (per Q1 clarification)

---

## Part 4: Guided Recovery (US-002)

### What is Guided Recovery?

**Problem**: Cryptic test errors waste debugging time.

**Solution**: Error messages include:

1. What went wrong
2. How to fix it (exact code)
3. Where to learn more (link to this guide)

### Example Error Messages

#### Error 1: Forgot to Set Up Mock

```typescript
// Mistake: Forgot to call createIsolatedFileService
it('should read file', async () => {
	const fileService = new FileService(); // ❌ Using real filesystem!
	const content = await fileService.readFile('/test.json');
});
```

**Error Message**:

```
Error: FileService mock not configured.
→ Fix: Call fileService._setFileSystem(fsMock) in beforeEach
→ Example:
  beforeEach(() => {
      const fsMock = new FSMock();
      fileService = createIsolatedFileService(fsMock);
  });
→ See: quickstart.md section "Setting Up FileService Tests"
```

#### Error 2: Incomplete WebView Mock

```typescript
// Mistake: Using custom mock without asWebviewUri
const customMock = { window: { createWebviewPanel: sinon.stub() } };
webViewManager._setVSCodeApi(customMock); // ❌ Incomplete!
```

**Error Message**:

```
Error: VSCodeMock missing WebView API structure.
→ Fix: Use VSCodeMock from mocks.ts, not custom mock
→ Required properties:
  - webview.asWebviewUri (function)
  - webview.onDidReceiveMessage (function)
  - onDidDispose (function)
  - workspace.workspaceFolders (array)
→ See: quickstart.md section "Testing WebViewManager"
→ Reference: src/test/helpers/mocks.ts lines 48-73
```

---

## Part 5: Common Patterns & Pitfalls

### Pattern: Pre-populate Virtual Filesystem

```typescript
beforeEach(() => {
	fsMock = new FSMock();

	// Add all files the service needs
	fsMock.addFile('/workspace/platformio.ini', '[env:uno]\nplatform = atmelavr');
	fsMock.addFile('/workspace/blockly/main.json', '{"workspace": {}}');
	fsMock.addDirectory('/workspace/blockly');

	fileService = createIsolatedFileService(fsMock);
});
```

**Why**: Services expect files to exist. Pre-populate to avoid `ENOENT` errors.

---

### Pattern: Configure VSCode Environment

```typescript
beforeEach(() => {
	vscodeMock = new VSCodeMock();

	// Set language for locale tests
	vscodeMock.env.language = 'zh-tw';

	// Set workspace for file operations
	vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/test/workspace' }, name: 'test', index: 0 }];

	localeService = createIsolatedLocaleService(vscodeMock, fileService);
});
```

**Why**: Services read `vscode.env.language` and `vscode.workspace.workspaceFolders`. Configure before creating service.

---

### Pitfall: Shared Mock State

```typescript
// ❌ WRONG: Mock created outside beforeEach
const fsMock = new FSMock(); // Shared across ALL tests!

describe('FileService', () => {
	beforeEach(() => {
		fileService = createIsolatedFileService(fsMock); // Same mock reused
	});

	it('test 1', async () => {
		await fileService.writeFile('/test.txt', 'data');
	});

	it('test 2', async () => {
		// ❌ /test.txt still exists from test 1!
		const exists = await fileService.exists('/test.txt'); // true (unexpected!)
	});
});

// ✅ CORRECT: Fresh mock in beforeEach
describe('FileService', () => {
	let fsMock: FSMock;

	beforeEach(() => {
		fsMock = new FSMock(); // Fresh mock for each test
		fileService = createIsolatedFileService(fsMock);
	});
});
```

**Why**: Shared mocks = shared state = flaky tests. Always create fresh mocks in `beforeEach`.

---

### Pitfall: Forgetting to Configure Workspace Folders

```typescript
// ❌ WRONG: No workspace folders
const vscodeMock = new VSCodeMock();
webViewManager = createIsolatedWebViewManager(vscodeMock, fileService, '/ext');

// Service tries to read workspace folder
webViewManager.createBlocklyEditPanel(context, {});
// Error: Cannot read property 'fsPath' of undefined
```

**Fix**:

```typescript
// ✅ CORRECT: Always set workspace folders for WebView tests
vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/workspace' }, name: 'test', index: 0 }];
```

---

## Part 6: Reference Implementation

### Example: Complete Test File (FileService)

```typescript
/**
 * FileService - Isolated Tests
 * Demonstrates: DI pattern, virtual filesystem, fail-fast compatibility
 */

import * as assert from 'assert';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { FileService } from '../services/fileService';
import { createIsolatedFileService } from './helpers/testHelpers';
import { FSMock } from './helpers/mocks';

describe('FileService - Isolated Tests', () => {
	let fileService: FileService;
	let fsMock: FSMock;

	beforeEach(() => {
		fsMock = new FSMock();
		fsMock.addFile('/workspace/test.json', '{"key": "value"}');
		fsMock.addDirectory('/workspace/subfolder');
		fileService = createIsolatedFileService(fsMock);
	});

	afterEach(() => {
		fsMock.clear();
	});

	it('should read file content', async () => {
		const content = await fileService.readFile('/workspace/test.json');
		assert.strictEqual(content, '{"key": "value"}');
	});

	it('should write file content', async () => {
		await fileService.writeFile('/workspace/new.txt', 'hello');
		const content = fsMock.getFileContent('/workspace/new.txt');
		assert.strictEqual(content, 'hello');
	});

	it('should return default for missing files', async () => {
		const content = await fileService.readFile('/missing.txt', 'default');
		assert.strictEqual(content, 'default');
	});

	it('should check file existence', async () => {
		const exists = await fileService.exists('/workspace/test.json');
		assert.strictEqual(exists, true);

		const notExists = await fileService.exists('/missing.txt');
		assert.strictEqual(notExists, false);
	});
});
```

**Run This Example**:

```bash
npm test -- --grep "FileService - Isolated Tests"
```

---

## Part 7: Debugging Failed Tests

### Step 1: Read the Error Message

```
Error: Expected 'hello' but got 'goodbye'
→ Fix: Check mock configuration - fsMock.addFile() may have wrong content
→ See: quickstart.md section "Pre-populate Virtual Filesystem"
```

### Step 2: Check Mock Setup

```typescript
beforeEach(() => {
	fsMock = new FSMock();
	// ❓ Did you add the file?
	fsMock.addFile('/test.txt', 'expected content');

	fileService = createIsolatedFileService(fsMock);
	// ❓ Did you inject the mock?
});
```

### Step 3: Verify Mock Calls

```typescript
it('should read file', async () => {
	await fileService.readFile('/test.txt');

	// Debug: Check what was called
	console.log(fsMock.promises.readFile.getCall(0).args); // ['/test.txt', 'utf8']

	// Verify: Was it called correctly?
	assert(fsMock.promises.readFile.calledWith('/test.txt', 'utf8'));
});
```

### Step 4: Use Fail-Fast Mode

```bash
npm run test:bail -- --grep "FileService"
```

**Benefits**: See first failure immediately, fix, repeat.

---

## Part 8: Next Steps

### Migrating Existing Tests

**Before (direct mocking)**:

```typescript
// ❌ Old pattern: Manual mock setup
const fsMock = {
	promises: {
		readFile: sinon.stub().resolves('content'),
	},
	existsSync: sinon.stub().returns(true),
};

// Manually inject
const fileService = new FileService();
// ⚠️ No injection point! Tests fail.
```

**After (DI pattern)**:

```typescript
// ✅ New pattern: Helper function
const fsMock = new FSMock();
fsMock.addFile('/test.txt', 'content');

const fileService = createIsolatedFileService(fsMock);
// ✅ Injection handled by helper
```

**Migration Steps**:

1. Replace manual mocks with `new VSCodeMock()` / `new FSMock()`
2. Use helper functions instead of direct instantiation
3. Move mock configuration to `beforeEach`
4. Run with `npm run test:bail` to catch issues early

---

### Learning Resources

-   **Reference Implementation**: `src/test/logging.test.ts` (6/6 passing, uses DI pattern)
-   **Mock API Docs**: `contracts/mock-apis.md`
-   **Helper API Docs**: `contracts/test-helpers.md`
-   **Research Findings**: `research.md`

---

### Performance Expectations

| Metric           | Target (SC)    | Current          | Status |
| ---------------- | -------------- | ---------------- | ------ |
| Test setup lines | <5 lines       | 3-4 lines        | ✅     |
| Learning curve   | <15 min        | ~15 min          | ✅     |
| Debug time       | <5 min/failure | ~5 min           | ✅     |
| Test execution   | <60s total     | ~30s             | ✅     |
| Coverage         | 90%+           | ~52% → improving | ⏳     |

---

## FAQ

**Q: Do I need to learn dependency injection theory?**  
A: No. Just follow the patterns in this guide (5 lines in `beforeEach`).

**Q: Can I use my own mocks instead of VSCodeMock/FSMock?**  
A: Not recommended. Our mocks have complete API surface and guided recovery. Custom mocks often miss required methods.

**Q: What if my test still fails after following this guide?**  
A: Check the error message for remediation steps. If unclear, see `research.md` for detailed DI patterns.

**Q: Do I need to modify service source code?**  
A: Only once: Add `_setVSCodeApi()` and `_setFileSystem()` methods (see `logging.ts` as reference). All services will share same pattern.

**Q: How do I test pure functions?**  
A: Don't inject mocks! Pure functions (JSON.parse, string manipulation) should be tested directly without DI (per Q3 clarification).

---

## Summary Checklist

-   [ ] I understand the 3-line setup pattern (create mock, configure, inject)
-   [ ] I can write a FileService test with virtual filesystem
-   [ ] I can write a WebViewManager test with VSCode API mock
-   [ ] I know how to use fail-fast mode (`npm run test:bail`)
-   [ ] I can interpret guided recovery error messages
-   [ ] I avoid shared mock state (fresh mocks in `beforeEach`)
-   [ ] I pre-populate virtual filesystem before tests
-   [ ] I configure VSCode environment (workspaceFolders, language) before creating services

**Time Invested**: ~15 minutes reading this guide  
**Time Saved**: Hours of debugging flaky tests

---

**Next Steps**: Pick a failing test from TEST-FRAMEWORK-FIX-PROGRESS.md and apply these patterns to fix it!
