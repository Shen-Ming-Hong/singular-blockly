# Data Model: Test Coverage Improvement

**Feature**: Test Coverage Improvement (004)  
**Purpose**: Define core entities and their relationships for dependency injection test architecture

---

## Core Entities

### 1. Core Component (Service Under Test)

**Purpose**: Represents services that need dependency injection for testability

**Attributes**:

-   `serviceName`: string - Name of the service (e.g., "FileService", "WebViewManager")
-   `dependencies`: Dependency[] - List of external dependencies this service requires
-   `publicAPI`: Method[] - Public methods that should be tested
-   `injectionPoints`: InjectionPoint[] - DI methods for swapping dependencies

**States**:

-   `ProductionMode`: Using real VSCode API and filesystem
-   `TestMode`: Using injected mocks

**Examples**:

```typescript
// FileService
{
    serviceName: "FileService",
    dependencies: [
        { type: "FileSystem", interface: "fs.promises" },
    ],
    publicAPI: [
        { name: "readFile", params: ["filePath"], returns: "Promise<string>" },
        { name: "writeFile", params: ["filePath", "content"], returns: "Promise<void>" },
    ],
    injectionPoints: [
        { method: "_setFileSystem", param: "FileSystem" },
        { method: "_reset", param: "void" },
    ]
}

// WebViewManager
{
    serviceName: "WebViewManager",
    dependencies: [
        { type: "VSCodeAPI", interface: "typeof vscode" },
        { type: "FileSystem", interface: "FileService" },
    ],
    publicAPI: [
        { name: "createBlocklyEditPanel", params: ["context", "state"], returns: "WebviewPanel" },
    ],
    injectionPoints: [
        { method: "_setVSCodeApi", param: "typeof vscode" },
        { method: "_setFileService", param: "FileService" },
        { method: "_reset", param: "void" },
    ]
}
```

**Relationships**:

-   Has 1+ `Isolated Dependency` instances
-   Tested by 1+ `Test Case` instances
-   Configured by 1+ `Injection Point`

---

### 2. Isolated Dependency (Mock/Stub)

**Purpose**: Represents a mocked dependency that can be injected into Core Components during testing

**Attributes**:

-   `mockType`: "VSCodeAPI" | "FileSystem" | "Custom"
-   `interface`: string - TypeScript interface name (e.g., "typeof vscode", "FileSystem")
-   `methods`: MockMethod[] - Stubbed methods with configurable behavior
-   `state`: object - Internal state tracking for assertions (e.g., files written, messages shown)

**Behavior**:

-   `reset()`: Clear all state and call counters
-   `configureBehavior(method, behavior)`: Set return values or throw errors
-   `getCallHistory(method)`: Return all calls made to a specific method

**Examples**:

```typescript
// VSCodeMock
{
    mockType: "VSCodeAPI",
    interface: "typeof vscode",
    methods: [
        { name: "window.createOutputChannel", stub: sinon.stub(), returns: LogOutputChannel },
        { name: "window.createWebviewPanel", stub: sinon.stub(), returns: WebviewPanel },
        { name: "workspace.workspaceFolders", value: [{ uri: { fsPath: "/mock/workspace" } }] },
    ],
    state: {
        outputChannelsCreated: 1,
        webviewPanelsCreated: 0,
        messagesShown: [],
    }
}

// FSMock
{
    mockType: "FileSystem",
    interface: "FileSystem (fs.promises)",
    methods: [
        { name: "readFile", stub: sinon.stub(), resolves: "file content" },
        { name: "writeFile", stub: sinon.stub(), resolves: undefined },
        { name: "existsSync", stub: sinon.stub(), returns: true },
    ],
    state: {
        filesRead: ["/path/to/file.json"],
        filesWritten: [],
        virtualFilesystem: {
            "/path/to/file.json": "{ \"key\": \"value\" }",
        },
    }
}
```

**Relationships**:

-   Injected into 1+ `Core Component` instances
-   Created by `Test Helper` factory functions
-   Validated by `Validation Helper` assertions

---

### 3. Test Case

**Purpose**: A single test scenario that validates behavior of a Core Component with Isolated Dependencies

**Attributes**:

-   `testName`: string - Descriptive test name (e.g., "should read file content")
-   `targetService`: CoreComponent - Service being tested
-   `mocks`: IsolatedDependency[] - Dependencies injected for this test
-   `setup`: SetupStep[] - Initialization steps (create service, configure mocks)
-   `assertions`: Assertion[] - Expected behaviors to verify
-   `teardown`: TeardownStep[] - Cleanup steps (reset mocks, restore defaults)

**Lifecycle**:

1. **Setup Phase**: Create isolated service instance with mocks
2. **Execution Phase**: Call service method under test
3. **Assertion Phase**: Verify expected behavior (return values, side effects)
4. **Teardown Phase**: Reset mocks, dispose resources

**Example**:

```typescript
{
    testName: "should create WebView panel with correct URI conversion",
    targetService: WebViewManager,
    mocks: [
        { type: "VSCodeAPI", configured: { createWebviewPanel: stub() } },
        { type: "FileSystem", configured: { readFile: stub().resolves("<html>") } },
    ],
    setup: [
        "Create VSCodeMock with complete WebView API structure",
        "Create FSMock with HTML template file",
        "Inject mocks via _setVSCodeApi() and _setFileService()",
    ],
    assertions: [
        "WebView panel created with correct viewType",
        "asWebviewUri() called for all resource URIs",
        "HTML template loaded from filesystem",
    ],
    teardown: [
        "Call webViewManager._reset()",
        "Restore sinon stubs",
    ]
}
```

**Relationships**:

-   Tests 1 `Core Component`
-   Uses 1+ `Isolated Dependency` instances
-   Created by test developer following `Quickstart Guide`

---

### 4. Injection Point

**Purpose**: A method on a Core Component that allows swapping dependencies (production ↔ test)

**Attributes**:

-   `methodName`: string - Name of injection method (e.g., "\_setVSCodeApi")
-   `parameterType`: string - TypeScript type of injected dependency
-   `scope`: "global" | "instance" - Whether it affects all instances or just one
-   `resetBehavior`: string - How to restore production defaults

**Contract**:

-   Must start with `_` prefix (indicates test-only API)
-   Must be type-safe (accept only correct interface)
-   Must reset internal state when dependency changes
-   Must be documented in code comments with usage example

**Example**:

````typescript
/**
 * Set the VSCode API instance (TEST USE ONLY)
 * @param api - VSCode API object (use VSCodeMock in tests)
 * @example
 * ```typescript
 * const vscodeMock = new VSCodeMock();
 * webViewManager._setVSCodeApi(vscodeMock);
 * ```
 */
export function _setVSCodeApi(api: typeof vscode): void {
	vscodeApi = api;
	// Reset any cached state that depends on VSCode API
	currentPanel = undefined;
}
````

**Relationships**:

-   Belongs to 1 `Core Component`
-   Accepts 1 `Isolated Dependency` type
-   Used by `Test Case` setup phase

---

### 5. Validation Helper

**Purpose**: Optional utility function that validates mock setup to provide guided recovery on errors

**Attributes**:

-   `helperName`: string - Name of validation function (e.g., "validateFileServiceMock")
-   `targetMock`: IsolatedDependency - Which mock to validate
-   `checks`: ValidationCheck[] - List of requirements to verify
-   `errorMessage`: string - Actionable message if validation fails

**Behavior**:

-   Throws descriptive error if mock is not properly configured
-   Provides remediation steps in error message
-   Links to quickstart.md for detailed guidance

**Example**:

```typescript
/**
 * Validate that FileService mock is properly configured
 * @param fileService - FileService instance to validate
 * @throws Error with remediation steps if mock not configured
 */
export function validateFileServiceMock(fileService: FileService): void {
	if (!fileService._getFileSystem()) {
		throw new Error('FileService mock not configured. ' + 'Call fileService._setFileSystem(fsMock) in beforeEach. ' + 'See quickstart.md section "Setting Up FileService Tests" for details.');
	}

	const fs = fileService._getFileSystem();
	if (!fs.promises || !fs.existsSync) {
		throw new Error('FileSystem mock missing required methods. ' + 'Use FSMock from src/test/helpers/mocks.ts. ' + 'Example: const fsMock = new FSMock();');
	}
}
```

**Relationships**:

-   Validates 1 `Isolated Dependency` configuration
-   Used by `Test Case` setup phase (optional)
-   Provides guided recovery per Constitution clarification Q2

---

## Entity Relationships Diagram

```
┌─────────────────────┐
│   Test Developer    │ (writes tests following Quickstart Guide)
└──────────┬──────────┘
           │ creates
           ▼
┌─────────────────────┐
│     Test Case       │
│ - testName          │
│ - setup             │
│ - assertions        │
│ - teardown          │
└──────────┬──────────┘
           │ tests
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│  Core Component     │◄─────┤  Injection Point    │
│  (Service)          │      │ - _setVSCodeApi()   │
│ - FileService       │      │ - _setFileSystem()  │
│ - WebViewManager    │      │ - _reset()          │
│ - SettingsManager   │      └─────────────────────┘
│ - LocaleService     │
└──────────┬──────────┘
           │ depends on
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│ Isolated Dependency │◄─────┤  Validation Helper  │
│  (Mock/Stub)        │      │ - validate setup    │
│ - VSCodeMock        │      │ - throw with hints  │
│ - FSMock            │      └─────────────────────┘
└─────────────────────┘
```

---

## Data Flow Example

**Scenario**: Testing FileService.readFile() with fail-fast and guided recovery

```
1. Test Developer writes test case:
   ├─ beforeEach: Create FSMock, inject via fileService._setFileSystem(fsMock)
   ├─ test: Call fileService.readFile('/path/to/file.json')
   └─ assertion: Verify fs.promises.readFile called with correct path

2. Test Case executes:
   ├─ Setup Phase:
   │  ├─ Create Isolated Dependency (FSMock)
   │  ├─ Configure behavior: fsMock.promises.readFile.resolves('{"key": "value"}')
   │  ├─ Inject via Injection Point: fileService._setFileSystem(fsMock)
   │  └─ Optional: Run Validation Helper (validateFileServiceMock)
   │
   ├─ Execution Phase:
   │  ├─ Call Core Component method: fileService.readFile('/path/to/file.json')
   │  └─ Core Component uses Isolated Dependency (fsMock.promises.readFile)
   │
   ├─ Assertion Phase:
   │  ├─ Verify return value: assert.strictEqual(result, '{"key": "value"}')
   │  └─ Verify call history: assert(fsMock.promises.readFile.calledOnce)
   │
   └─ Teardown Phase:
      ├─ Reset Injection Point: fileService._reset()
      └─ Clear Isolated Dependency: sinon.restore()

3. If mock not configured:
   ├─ Validation Helper throws error:
   │  "FileService mock not configured. Call fileService._setFileSystem(fsMock)
   │   in beforeEach. See quickstart.md section 'Setting Up FileService Tests'"
   │
   └─ Fail-Fast Mode (if enabled):
      └─ Mocha --bail flag stops test run immediately
```

---

## Implementation Notes

1. **Simplicity**: All entities reuse existing patterns (logging.ts DI, mocks.ts structure)
2. **Modularity**: Each Core Component gets independent injection points
3. **Testability**: All entities are pure data structures (no hidden state)
4. **Guided Recovery**: Validation Helpers provide actionable error messages

---

**Next Steps**: Create contracts/ directory with detailed API specifications for Test Helpers and Mock structures.
