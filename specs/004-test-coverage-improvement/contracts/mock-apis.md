# Mock APIs Contract

**Feature**: Test Coverage Improvement (004)  
**Purpose**: Define the interface contracts for VSCodeMock and FSMock used in dependency injection

---

## Overview

This document specifies the complete API structure for mock objects in `src/test/helpers/mocks.ts`. These mocks replace real VSCode API and filesystem dependencies during testing.

---

## FSMock Interface

**Purpose**: Mock Node.js filesystem (`fs` module) with in-memory virtual filesystem

### Core Interface

```typescript
class FSMock {
	// Virtual filesystem storage
	private files: Map<string, string>;
	private directories: Set<string>;

	// Public API matching fs module
	promises: {
		readFile(path: string, encoding?: string): Promise<string>;
		writeFile(path: string, content: string, encoding?: string): Promise<void>;
		mkdir(path: string, options?: any): Promise<void>;
		readdir(path: string): Promise<string[]>;
		stat(path: string): Promise<fs.Stats>;
		copyFile(src: string, dest: string): Promise<void>;
		unlink(path: string): Promise<void>;
	};

	existsSync(path: string): boolean;
	statSync(path: string): fs.Stats;
	readFileSync(path: string, encoding?: string): string;
	writeFileSync(path: string, content: string, encoding?: string): void;

	// Test helper methods
	addFile(path: string, content: string): void;
	addDirectory(path: string): void;
	clear(): void;
	getFileContent(path: string): string | undefined;
	getAllFiles(): string[];
}
```

### Required Behavior

**readFile / readFileSync**:

-   Resolve with file content if file exists in virtual filesystem
-   Reject with `ENOENT` error if file doesn't exist
-   Support UTF-8 encoding (default)

**writeFile / writeFileSync**:

-   Create file in virtual filesystem
-   Auto-create parent directories if they don't exist
-   Overwrite existing files

**existsSync**:

-   Return `true` if path exists in virtual filesystem
-   Return `false` otherwise
-   Must work for both files and directories

**stat / statSync**:

-   Return mock `Stats` object with `isFile()`, `isDirectory()` methods
-   Throw `ENOENT` if path doesn't exist

**Test Helper Methods**:

-   `addFile(path, content)`: Pre-populate virtual filesystem
-   `addDirectory(path)`: Create virtual directory
-   `clear()`: Reset all virtual files/directories
-   `getFileContent(path)`: Read virtual file (for test assertions)

### Example Usage

```typescript
const fsMock = new FSMock();

// Pre-populate filesystem
fsMock.addFile('/workspace/test.json', '{"key": "value"}');
fsMock.addDirectory('/workspace/subfolder');

// Use in service
fileService._setFileSystem(fsMock);
const content = await fileService.readFile('/workspace/test.json');

// Verify in test
assert.strictEqual(fsMock.getFileContent('/workspace/test.json'), '{"key": "value"}');
```

---

## VSCodeMock Interface

**Purpose**: Mock VSCode Extension API (`vscode` module)

### Core Interface

```typescript
class VSCodeMock {
	// Window API
	window: {
		createOutputChannel(name: string, options?: { log: boolean }): LogOutputChannel;
		createWebviewPanel(viewType: string, title: string, showOptions: any, options: WebviewOptions): WebviewPanel;
		showErrorMessage(message: string, ...items: string[]): Thenable<string>;
		showInformationMessage(message: string, ...items: string[]): Thenable<string>;
		showWarningMessage(message: string, ...items: string[]): Thenable<string>;
		showInputBox(options?: InputBoxOptions): Thenable<string>;
		createStatusBarItem(alignment?: any, priority?: number): StatusBarItem;
		visibleTextEditors: TextEditor[];
	};

	// Workspace API
	workspace: {
		workspaceFolders?: WorkspaceFolder[];
		getConfiguration(section?: string): WorkspaceConfiguration;
		onDidChangeConfiguration: Event<ConfigurationChangeEvent>;
		fs: FileSystemProvider;
	};

	// Environment API
	env: {
		language: string;
		uiKind: UIKind;
	};

	// Uri utility
	Uri: {
		file(path: string): Uri;
		parse(value: string): Uri;
	};

	// ViewColumn enum
	ViewColumn: typeof vscode.ViewColumn;
}
```

### WebView API Structure (Critical for WebViewManager tests)

**WebviewPanel Interface**:

```typescript
interface WebviewPanel {
	webview: {
		html: string;
		options: WebviewOptions;
		onDidReceiveMessage: (listener: (message: any) => any) => Disposable;
		postMessage: (message: any) => Thenable<boolean>;
		asWebviewUri: (localUri: Uri) => Uri; // ⚠️ MUST BE IMPLEMENTED
		cspSource: string;
	};
	title: string;
	viewType: string;
	visible: boolean;
	active: boolean;
	onDidDispose: (listener: () => any) => Disposable;
	onDidChangeViewState: (listener: (e: any) => any) => Disposable;
	reveal: (viewColumn?: ViewColumn, preserveFocus?: boolean) => void;
	dispose: () => void;
}
```

**Critical Implementation Details**:

1. **asWebviewUri** (fixes 8/8 failing WebViewManager tests):

    ```typescript
    asWebviewUri: sinon.stub().callsFake((uri: any) => {
    	// Convert file:// to vscode-resource://
    	if (uri.fsPath) {
    		return {
    			toString: () => `vscode-resource:${uri.fsPath}`,
    			fsPath: uri.fsPath,
    			scheme: 'vscode-resource',
    		};
    	}
    	return uri;
    });
    ```

2. **onDidDispose** (must call callback on dispose):

    ```typescript
    const panel = {
    	_onDisposeCallback: null as any,
    	onDidDispose: sinon.stub().callsFake((callback: any) => {
    		panel._onDisposeCallback = callback;
    		return { dispose: sinon.stub() };
    	}),
    	dispose: sinon.stub().callsFake(() => {
    		panel.visible = false;
    		if (panel._onDisposeCallback) {
    			panel._onDisposeCallback();
    		}
    	}),
    };
    ```

3. **Workspace Folders** (required for WebView tests):
    ```typescript
    workspace: {
    	workspaceFolders: [
    		{
    			uri: { fsPath: '/mock/workspace' },
    			name: 'mock-workspace',
    			index: 0,
    		},
    	];
    }
    ```

### LogOutputChannel Interface

```typescript
interface LogOutputChannel {
	name: string;
	appendLine: SinonStub;
	append: SinonStub;
	clear: SinonStub;
	show: SinonStub;
	hide: SinonStub;
	dispose: SinonStub;
	// LogOutputChannel specific methods
	trace: SinonStub;
	debug: SinonStub;
	info: SinonStub;
	warn: SinonStub;
	error: SinonStub;
}
```

### Example Usage

```typescript
const vscodeMock = new VSCodeMock();

// Configure workspace
vscodeMock.workspace.workspaceFolders = [{ uri: { fsPath: '/test/workspace' }, name: 'test', index: 0 }];

// Configure environment
vscodeMock.env.language = 'zh-tw';

// Use in service
webViewManager._setVSCodeApi(vscodeMock);
const panel = webViewManager.createBlocklyEditPanel(context, {});

// Verify WebView creation
assert(vscodeMock.window.createWebviewPanel.calledOnce);
assert.strictEqual(panel.viewType, 'blocklyEdit');
assert(panel.webview.asWebviewUri.called);
```

---

## Enhanced Mock Features (Phase 2+)

### State Tracking

**FSMock State**:

```typescript
class FSMock {
	getState(): {
		filesRead: string[]; // Paths accessed via readFile
		filesWritten: string[]; // Paths modified via writeFile
		directoriesCreated: string[]; // Paths created via mkdir
		callCount: {
			readFile: number;
			writeFile: number;
			existsSync: number;
		};
	};
}
```

**VSCodeMock State**:

```typescript
class VSCodeMock {
	getState(): {
		outputChannelsCreated: number;
		webviewPanelsCreated: number;
		messagesShown: Array<{ level: 'error' | 'info' | 'warn'; message: string }>;
		workspaceConfigAccessed: string[];
	};
}
```

### Reset Methods

```typescript
// FSMock
fsMock.reset(): void  // Clear all files, directories, and state

// VSCodeMock
vscodeMock.reset(): void  // Reset all stubs and state
```

---

## Validation Requirements

### Complete WebView Mock Validation

```typescript
function validateWebViewMock(vscodeMock: VSCodeMock): void {
	const panel = vscodeMock.window.createWebviewPanel('test', 'Test', 1, {});

	// Required properties
	assert(panel.webview, 'WebView missing webview property');
	assert(panel.webview.asWebviewUri, 'WebView missing asWebviewUri method');
	assert(panel.webview.onDidReceiveMessage, 'WebView missing onDidReceiveMessage');
	assert(panel.onDidDispose, 'WebView missing onDidDispose');

	// Required workspace properties
	assert(vscodeMock.workspace.workspaceFolders, 'VSCodeMock missing workspaceFolders');
	assert(vscodeMock.workspace.workspaceFolders.length > 0, 'workspaceFolders is empty');
}
```

---

## Migration from Current Implementation

**Current State** (TEST-FRAMEWORK-FIX-PROGRESS.md):

-   ✅ VSCodeMock has basic structure
-   ✅ FSMock has basic promises API
-   ❌ WebView asWebviewUri incomplete (causes 8/8 failures)
-   ❌ Missing state tracking for assertions
-   ❌ No validation helpers

**Required Changes**:

1. Fix `asWebviewUri` implementation (lines 58-63 in mocks.ts)
2. Add complete WebView options structure
3. Ensure `onDidDispose` callback is called on `dispose()`
4. Add state tracking methods (`getState()`, `reset()`)
5. Add validation helpers (`validateWebViewMock`, `validateFSMock`)

---

## Implementation Checklist

-   [ ] Fix `asWebviewUri` to return proper vscode-resource URI
-   [ ] Add complete WebView `onDidDispose` callback handling
-   [ ] Verify workspace folders are set in tests
-   [ ] Add state tracking to FSMock
-   [ ] Add state tracking to VSCodeMock
-   [ ] Add `reset()` methods to both mocks
-   [ ] Create validation helper functions
-   [ ] Update existing tests to use enhanced mocks
-   [ ] Add unit tests for mock implementations (meta-testing)

---

**Next Steps**: Create quickstart.md with examples using these enhanced mocks.
