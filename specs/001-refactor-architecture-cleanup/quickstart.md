# Developer Quickstart: Refactored Architecture Guide

**Feature**: Architecture Refactoring and Code Cleanup  
**Branch**: `001-refactor-architecture-cleanup`  
**Date**: 2025-10-17

## Overview

This guide explains how to work with the refactored Singular Blockly codebase after architecture cleanup. Key changes:

1. ✅ All file operations use `FileService` (no direct `fs` usage)
2. ✅ Arduino modules discovered dynamically (no hardcoded lists)
3. ✅ Temp files use unique timestamps (multi-window safe)
4. ✅ Magic numbers replaced with named constants
5. ✅ Locale loading unified (no code duplication)

---

## FileService Integration

### Basic Usage Pattern

**Before (❌ Don't do this)**:

```typescript
import * as fs from 'fs';

function loadConfig(): string {
	const configPath = path.join(workspacePath, 'config.json');
	return fs.readFileSync(configPath, 'utf8'); // ❌ Direct fs usage
}
```

**After (✅ Do this)**:

```typescript
import { FileService } from '../services/fileService';

async function loadConfig(fileService: FileService): Promise<string> {
	return await fileService.readFile('config.json', '{}'); // ✅ FileService abstraction
}
```

### Converting Existing Code

**Step-by-step conversion**:

1. **Identify fs usage**:

    ```bash
    grep -r "fs\\.readFileSync\|fs\\.writeFileSync\|fs\\.existsSync" src/
    ```

2. **Convert method to async**:

    ```typescript
    // Before
    private getContent(): string { ... }

    // After
    private async getContent(): Promise<string> { ... }
    ```

3. **Replace fs call with FileService**:

    ```typescript
    // Before
    const content = fs.readFileSync(absolutePath, 'utf8');

    // After
    const relativePath = path.relative(workspaceRoot, absolutePath);
    const content = await this.fileService.readFile(relativePath, '');
    ```

4. **Update callers**:

    ```typescript
    // Before
    const result = this.getContent();

    // After
    const result = await this.getContent();
    ```

### FileService API Reference

```typescript
class FileService {
	// Read operations (return defaults on error)
	async readFile(relativePath: string, defaultContent?: string): Promise<string>;
	async readJsonFile<T>(relativePath: string, defaultValue: T): Promise<T>;
	async listFiles(relativePath: string): Promise<string[]>;
	async getFileStats(relativePath: string): Promise<fs.Stats | null>;

	// Write operations (throw on error)
	async writeFile(relativePath: string, content: string): Promise<void>;
	async writeJsonFile<T>(relativePath: string, data: T, pretty?: boolean): Promise<void>;

	// File management
	async createDirectory(relativePath: string): Promise<void>;
	async deleteFile(relativePath: string): Promise<void>;
	async copyFile(sourceRelativePath: string, destRelativePath: string): Promise<void>;

	// Synchronous check (exception for quick checks)
	fileExists(relativePath: string): boolean;
}
```

**Key Characteristics**:

-   ✅ All paths are **workspace-relative** (no absolute paths)
-   ✅ Read operations **never throw** (return defaults)
-   ✅ Write operations **create parent directories** automatically
-   ✅ All methods **log errors** via structured logging service

### Error Handling Patterns

**Reading files (graceful degradation)**:

```typescript
// FileService automatically returns default on error
const config = await fileService.readFile('config.json', '{}');
const parsed = JSON.parse(config); // Safe because default is valid JSON

// Or use readJsonFile for automatic parsing
const config = await fileService.readJsonFile('config.json', { theme: 'light' });
```

**Writing files (explicit error handling)**:

```typescript
try {
	await fileService.writeFile('output.txt', content);
	log('File saved successfully', 'info');
} catch (error) {
	log('Failed to save file', 'error', error);
	vscode.window.showErrorMessage('Could not save file');
}
```

**Checking existence (synchronous convenience)**:

```typescript
if (fileService.fileExists('cache.json')) {
	const cache = await fileService.readJsonFile('cache.json', {});
} else {
	log('Cache not found, using defaults', 'debug');
}
```

### Testing with FileService Mocks

```typescript
import { FileService } from '../services/fileService';
import * as sinon from 'sinon';

describe('MyComponent', () => {
	let fileService: sinon.SinonStubbedInstance<FileService>;

	beforeEach(() => {
		fileService = sinon.createStubInstance(FileService);

		// Mock file read
		fileService.readFile.resolves('test content');

		// Mock file existence check
		fileService.fileExists.returns(true);
	});

	it('should load content via FileService', async () => {
		const component = new MyComponent(fileService as unknown as FileService);
		const result = await component.loadContent();

		assert(fileService.readFile.calledOnce);
		assert.strictEqual(result, 'test content');
	});
});
```

---

## Adding New Arduino Modules

### Automatic Discovery (No Code Changes Needed!)

The extension now **automatically discovers** all generator modules in `media/blockly/generators/arduino/`.

**To add a new module**:

1. Create your generator file:

    ```bash
    touch media/blockly/generators/arduino/servos.js
    ```

2. Implement generator code:

    ```javascript
    // media/blockly/generators/arduino/servos.js

    import { Order } from 'blockly/javascript';

    arduinoGenerator.forBlock['servo_write'] = function (block, generator) {
    	const angle = generator.valueToCode(block, 'ANGLE', Order.ATOMIC);
    	return `servo.write(${angle});\n`;
    };
    ```

3. **That's it!** No registration needed - file is auto-discovered on next WebView load.

### Discovery Mechanism

**How it works**:

```typescript
// webviewManager.ts automatically scans directory
private async discoverArduinoModules(): Promise<string[]> {
    const generatorsPath = path.join(
        this.context.extensionPath,
        'media', 'blockly', 'generators', 'arduino'
    );

    const allFiles = await fs.promises.readdir(generatorsPath);
    return allFiles
        .filter(f => f.endsWith('.js') && f !== 'index.js')  // Exclude entry point
        .sort();  // Alphabetical order
}
```

**Rules**:

-   ✅ Only `.js` files included (TypeScript files must be compiled first)
-   ✅ `index.js` excluded (entry point, not a generator)
-   ✅ Loaded in **alphabetical order** (deterministic)
-   ✅ Fallback to known modules if scan fails (error resilience)

### Module Loading Order

**Modules load alphabetically**:

```
functions.js      (1st)
huskylens.js      (2nd)
io.js             (3rd)
lists.js          (4th)
logic.js          (5th)
loops.js          (6th)
motors.js         (7th)
pixetto.js        (8th)
sensors.js        (9th)
text.js           (10th)
variables.js      (11th)
```

**If load order matters** (e.g., dependencies), prefix filenames:

```
01-base.js        (loads first)
02-motors.js      (depends on base)
03-sensors.js     (depends on motors)
```

### Removing Modules

**To remove a module**:

1. Delete the file: `rm media/blockly/generators/arduino/old_module.js`
2. Restart extension (or reload WebView)
3. **No code changes needed** - module automatically excluded

---

## Temporary File Conventions

### Unique Naming Pattern

**All temporary toolbox files use timestamp-based names**:

```typescript
// Old (❌ conflicts in multi-window scenarios)
const tempFile = 'blockly/temp_toolbox.json';

// New (✅ unique per WebView instance)
const timestamp = Date.now(); // e.g., 1697500000123
const tempFile = `blockly/temp_toolbox_${timestamp}.json`;
```

**Example filenames**:

```
blockly/temp_toolbox_1697500000123.json  (Window 1)
blockly/temp_toolbox_1697500001456.json  (Window 2)
blockly/temp_toolbox_1697500002789.json  (Window 3)
```

### Multi-Window Safety

**Each WebView instance tracks its own temp file**:

```typescript
class WebViewManager {
	private currentTempToolboxFile: string | null = null;

	async createAndShowWebView(): Promise<void> {
		// Generate unique temp file
		const timestamp = Date.now();
		this.currentTempToolboxFile = `blockly/temp_toolbox_${timestamp}.json`;

		// Use temp file for processing
		await this.fileService.writeFile(this.currentTempToolboxFile, JSON.stringify(toolboxConfig));

		// Register cleanup
		this.panel.onDidDispose(() => {
			this.cleanupTempFile();
		});
	}

	private async cleanupTempFile(): Promise<void> {
		if (this.currentTempToolboxFile) {
			await this.fileService.deleteFile(this.currentTempToolboxFile);
			this.currentTempToolboxFile = null;
		}
	}
}
```

**Guarantees**:

-   ✅ No conflicts between windows (unique timestamps)
-   ✅ Automatic cleanup on window close
-   ✅ Non-blocking cleanup (errors logged but don't throw)
-   ✅ Stale file cleanup on extension activation

### Cleanup Lifecycle

```
WebView Created
    ↓
Generate temp_toolbox_{timestamp}.json
    ↓
Process toolbox configuration
    ↓
WebView Disposed
    ↓
Delete temp_toolbox_{timestamp}.json
```

**Stale File Cleanup** (runs on extension activation):

```typescript
async cleanupStaleTempFiles(): Promise<void> {
    const tempFiles = await this.fileService.listFiles('blockly/');
    for (const file of tempFiles.filter(f => f.startsWith('temp_toolbox_'))) {
        const stats = await this.fileService.getFileStats(`blockly/${file}`);
        const age = Date.now() - stats.mtimeMs;

        if (age > 3600000) {  // 1 hour old
            await this.fileService.deleteFile(`blockly/${file}`);
        }
    }
}
```

---

## Constant Usage Reference

### Finding Constants

**All timing constants located at module tops**:

```typescript
// src/webview/messageHandler.ts (lines 10-20)

// ============================================================
// TIMING CONSTANTS
// ============================================================

/** Maximum time to wait for board configuration response */
const BOARD_CONFIG_REQUEST_TIMEOUT_MS = 10000;

/** Delay for UI stabilization before interaction */
const UI_STABILIZATION_DELAY_MS = 100;

/** Delay before revealing WebView panel */
const PANEL_REVEAL_DELAY_MS = 200;
```

### Naming Conventions

**Pattern**: `{PURPOSE}_{UNIT}`

| Constant                          | Purpose              | Unit         | Usage                                              |
| --------------------------------- | -------------------- | ------------ | -------------------------------------------------- |
| `BOARD_CONFIG_REQUEST_TIMEOUT_MS` | Board config timeout | Milliseconds | `setTimeout(..., BOARD_CONFIG_REQUEST_TIMEOUT_MS)` |
| `UI_STABILIZATION_DELAY_MS`       | UI rendering wait    | Milliseconds | `await delay(UI_STABILIZATION_DELAY_MS)`           |
| `PANEL_REVEAL_DELAY_MS`           | Panel reveal wait    | Milliseconds | `setTimeout(panel.reveal, PANEL_REVEAL_DELAY_MS)`  |
| `MAX_RETRY_ATTEMPTS`              | Retry limit          | Count        | `for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++)`     |

**Naming rules**:

-   ✅ Use `SCREAMING_SNAKE_CASE` for module-level constants
-   ✅ Append unit suffix: `_MS` (milliseconds), `_SEC` (seconds), `_COUNT`, etc.
-   ✅ Descriptive names over short abbreviations (`BOARD_CONFIG_TIMEOUT_MS` not `BCT`)
-   ✅ Add JSDoc comment explaining rationale

### Adding New Constants

**When to extract a magic number**:

1. Number appears multiple times (DRY principle)
2. Number has business meaning (timeout, limit, threshold)
3. Number might need tuning (configuration value)
4. Number is not self-explanatory (100 vs BUFFER_SIZE)

**How to add**:

```typescript
// 1. Define at module top with JSDoc
/**
 * Maximum number of retries for network requests.
 *
 * Rationale: Three retries balance reliability and user experience.
 * More retries delay feedback; fewer reduce success rate.
 */
const MAX_NETWORK_RETRY_ATTEMPTS = 3;

// 2. Replace magic number in code
// Before
for (let i = 0; i < 3; i++) { ... }  // ❌ Magic number

// After
for (let i = 0; i < MAX_NETWORK_RETRY_ATTEMPTS; i++) { ... }  // ✅ Named constant
```

### Unit Suffixes

| Unit           | Suffix   | Example                     |
| -------------- | -------- | --------------------------- |
| Milliseconds   | `_MS`    | `TIMEOUT_MS = 5000`         |
| Seconds        | `_SEC`   | `CACHE_TTL_SEC = 300`       |
| Minutes        | `_MIN`   | `SESSION_DURATION_MIN = 60` |
| Count/Quantity | `_COUNT` | `MAX_ITEMS_COUNT = 100`     |
| Percentage     | `_PCT`   | `LOAD_THRESHOLD_PCT = 80`   |
| Bytes          | `_BYTES` | `BUFFER_SIZE_BYTES = 1024`  |

---

## Testing Refactored Code

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "WebViewManager"

# Run tests in watch mode
npm run watch-tests
```

### Test Coverage Expectations

**After refactoring**:

-   ✅ All tests pass without modification
-   ✅ FileService integration enables better mocking
-   ✅ Pure functions easier to unit test
-   ✅ Constants reduce test maintenance burden

### Mocking FileService in Tests

**Complete example**:

```typescript
import { WebViewManager } from './webviewManager';
import { FileService } from '../services/fileService';
import * as sinon from 'sinon';
import * as assert from 'assert';

describe('WebViewManager Refactored', () => {
	let fileService: sinon.SinonStubbedInstance<FileService>;
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		// Mock FileService
		fileService = sinon.createStubInstance(FileService);
		fileService.readFile.resolves('<html>test</html>');
		fileService.writeFile.resolves();
		fileService.deleteFile.resolves();
		fileService.listFiles.resolves(['io.js', 'motors.js']);

		// Mock VSCode context
		context = {
			extensionPath: '/fake/path',
			// ... other properties
		} as vscode.ExtensionContext;
	});

	it('should load HTML via FileService', async () => {
		const manager = new WebViewManager(context);
		await manager.createAndShowWebView();

		assert(fileService.readFile.calledWith('media/html/blocklyEdit.html'));
	});

	it('should discover Arduino modules dynamically', async () => {
		fileService.listFiles.resolves(['io.js', 'motors.js', 'sensors.js']);

		const manager = new WebViewManager(context);
		const modules = await manager['discoverArduinoModules'](); // Private method access

		assert.deepStrictEqual(modules, ['io.js', 'motors.js', 'sensors.js']);
	});

	it('should cleanup temp files on disposal', async () => {
		const manager = new WebViewManager(context);
		await manager.createAndShowWebView();

		// Simulate disposal
		manager['cleanupTempFile']();

		assert(fileService.deleteFile.calledOnce);
		assert(fileService.deleteFile.firstCall.args[0].startsWith('blockly/temp_toolbox_'));
	});
});
```

### Directory Scan Testing

```typescript
it('should handle directory scan failures gracefully', async () => {
	fileService.listFiles.rejects(new Error('EACCES: permission denied'));

	const manager = new WebViewManager(context);
	const modules = await manager['discoverArduinoModules']();

	// Should return fallback list, not throw
	assert(modules.length > 0);
	assert(modules.includes('io.js')); // Known module from fallback
});
```

### Temp File Cleanup Verification

```typescript
it('should create unique temp files for multiple windows', async () => {
	const manager1 = new WebViewManager(context);
	const manager2 = new WebViewManager(context);

	await manager1.createAndShowWebView();
	await manager2.createAndShowWebView();

	const calls = fileService.writeFile.getCalls();
	const tempFiles = calls.map(c => c.args[0]);

	// Both temp files should be different
	assert.notStrictEqual(tempFiles[0], tempFiles[1]);
	assert(tempFiles[0].match(/temp_toolbox_\d+\.json/));
	assert(tempFiles[1].match(/temp_toolbox_\d+\.json/));
});
```

---

## Migration Checklist

Use this checklist when adopting refactored patterns:

### FileService Integration

-   [ ] Remove all `import * as fs from 'fs'` statements
-   [ ] Convert methods with file I/O to `async`
-   [ ] Replace `fs.readFileSync()` with `await fileService.readFile()`
-   [ ] Replace `fs.writeFileSync()` with `await fileService.writeFile()`
-   [ ] Convert absolute paths to workspace-relative paths
-   [ ] Update all callers to use `await` or `.then()`
-   [ ] Run tests to verify async conversion

### Arduino Module Discovery

-   [ ] Remove hardcoded `arduinoModules` array
-   [ ] Replace with `discoverArduinoModules()` call
-   [ ] Update HTML template with `<!-- ARDUINO_MODULES -->` placeholder
-   [ ] Test with new module added (should auto-discover)
-   [ ] Test with module removed (should exclude automatically)

### Temp File Handling

-   [ ] Replace fixed `temp_toolbox.json` with timestamp-based naming
-   [ ] Add `currentTempToolboxFile` instance variable
-   [ ] Register cleanup in `onDidDispose()` handler
-   [ ] Test multi-window scenario (no conflicts)
-   [ ] Verify cleanup occurs on window close

### Constant Extraction

-   [ ] Identify all magic numbers in timing code
-   [ ] Define constants at module top with JSDoc
-   [ ] Use `SCREAMING_SNAKE_CASE` with unit suffix
-   [ ] Replace magic numbers with constant references
-   [ ] Run tests to ensure behavior unchanged

### Testing

-   [ ] All existing tests pass without modification
-   [ ] FileService mocking works in test suite
-   [ ] Directory scan failures handled gracefully
-   [ ] Temp file cleanup verified in tests
-   [ ] Constants used consistently in tests

---

## Troubleshooting

### Common Issues

**Problem**: `TypeError: this.fileService.readFile is not a function`

**Solution**: Ensure FileService is initialized before use:

```typescript
if (!this.fileService) {
	this.fileService = new FileService(workspaceRoot);
}
```

---

**Problem**: Temp files not cleaned up

**Solution**: Check disposal handler registration:

```typescript
this.panel.onDidDispose(() => {
	this.cleanupTempFile(); // ✅ Must be called
});
```

---

**Problem**: Arduino modules not discovered

**Solution**: Check directory path and permissions:

```typescript
const generatorsPath = path.join(
	this.context.extensionPath, // ✅ Extension path, not workspace path
	'media',
	'blockly',
	'generators',
	'arduino'
);
```

---

**Problem**: Tests fail after async conversion

**Solution**: Ensure all async methods are awaited:

```typescript
// Before (❌ missing await)
const result = someAsyncMethod();

// After (✅ awaited)
const result = await someAsyncMethod();
```

---

## Reference Links

-   **Architecture Guide**: [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md)
-   **Constitution**: [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md)
-   **Feature Spec**: [`spec.md`](./spec.md)
-   **Research Findings**: [`research.md`](./research.md)
-   **FileService API**: [`src/services/fileService.ts`](../../src/services/fileService.ts)
-   **Test Examples**: [`src/test/webviewManager.test.ts`](../../src/test/webviewManager.test.ts)

---

## Summary

**Key Takeaways**:

1. ✅ **Always use FileService** for file operations (no direct `fs` usage)
2. ✅ **Arduino modules auto-discovered** - just add `.js` files to `generators/arduino/`
3. ✅ **Temp files use timestamps** - multi-window safe, automatic cleanup
4. ✅ **Constants have clear names** - `SCREAMING_SNAKE_CASE` with unit suffixes
5. ✅ **All code is testable** - FileService mocking, pure functions, no side effects

**Questions?** Check [research.md](./research.md) for detailed technical decisions and rationale.
