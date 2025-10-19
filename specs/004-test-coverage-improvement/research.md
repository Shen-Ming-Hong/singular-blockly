# Research: Test Coverage Improvement

**Date**: 2025-10-18  
**Feature**: Test Coverage Improvement (004)  
**Purpose**: Document dependency injection patterns, test isolation strategies, and WebView mocking best practices for VSCode extensions

---

## Research Questions

### Q1: What are the best dependency injection patterns for VSCode extensions with TypeScript?

**Research Method**: Web search + existing codebase analysis

**Findings**:

1. **Manual DI via Function Parameters (Recommended for our case)**

    - Source: [Dependency Injection in JavaScript](https://blog.appsignal.com/2022/02/16/dependency-injection-in-javascript-write-testable-code-easily.html)
    - Pattern: Inject dependencies as optional parameters with defaults for production
    - Benefits: Simple, no framework needed, type-safe with TypeScript
    - Example from our codebase (`logging.ts`):
        ```typescript
        export function _setVSCodeApi(api: typeof vscode): void {
        	vscodeApi = api;
        	outputChannel = undefined; // Reset output channel
        }
        ```
    - **Key Insight**: We already have this pattern implemented in `logging.ts` - just need to replicate it for other services

2. **Constructor Injection (Not suitable for our services)**

    - Common in frameworks like NestJS, but our services are stateless/singleton
    - Would require major refactor of service instantiation
    - Rejected per Constitution principle #3 (Avoid Over-Development)

3. **TypeScript-Specific Advantages**:
    - Source: [Comparing jest.mock and Dependency Injection in TypeScript](https://dev.to/keithbro/comparing-jest-mock-and-dependency-injection-in-typescript-khj)
    - Type-safe mocks via `jest.Mocked<T>` or manual interface implementation
    - Avoid `jest.mock()` shared state issues (critical for Mocha tests)
    - **Recommendation**: Use Sinon stubs + interface-based mocks (already doing this in `mocks.ts`)

**Decision**: Use function-based DI pattern from `logging.ts` as reference implementation. Each service gets:

-   `_setVSCodeApi(api: typeof vscode)` for VSCode API dependencies
-   `_setFileSystem(fs: FileSystem)` for filesystem dependencies
-   `_reset()` helper to restore production defaults (for test cleanup)

---

### Q2: How should we mock VSCode WebView APIs for testing?

**Research Method**: VSCode API documentation + existing test failures analysis

**Findings**:

1. **WebView Panel Structure Requirements** (from [VSCode Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)):

    ```typescript
    interface WebviewPanel {
    	webview: {
    		html: string;
    		options: WebviewOptions;
    		onDidReceiveMessage: (listener) => Disposable;
    		postMessage: (message: any) => Thenable<boolean>;
    		asWebviewUri: (uri: Uri) => Uri; // ❌ MISSING in our mock
    		cspSource: string;
    	};
    	title: string;
    	visible: boolean;
    	active: boolean;
    	onDidDispose: (listener) => Disposable;
    	reveal: (viewColumn?, preserveFocus?) => void;
    	dispose: () => void;
    }
    ```

2. **Current Test Failure Root Cause** (from `webviewManager.test.ts` analysis):

    - Our `VSCodeMock.window.createWebviewPanel` returns incomplete structure
    - Missing: Proper lifecycle event handling, URI conversion, workspace folder setup
    - Issue: Tests fail because WebViewManager expects complete WebView API surface

3. **Key Mock Requirements**:

    - `webview.asWebviewUri()`: Convert file:// URIs to vscode-resource:// URIs
    - `onDidDispose`: Must actually call callback on `dispose()`
    - `onDidReceiveMessage`: Return proper Disposable with `dispose()` method
    - Workspace folders: Must be set in `vscode.workspace.workspaceFolders`

4. **Existing Mock Status** (from `src/test/helpers/mocks.ts:48-73`):
    - ✅ Has `asWebviewUri` stub (lines 58-63)
    - ✅ Has `onDidDispose` with callback tracking (lines 67-70)
    - ❌ Missing: Complete WebView options structure
    - ❌ Missing: Proper `retainContextWhenHidden` handling

**Decision**: Enhance `VSCodeMock.window.createWebviewPanel` in `mocks.ts` to return complete WebView structure matching VSCode API. Add test helper to validate mock completeness.

---

### Q3: What test isolation strategies should we use (practical vs full sandboxing)?

**Research Method**: Constitution clarifications (Q3) + web search

**Findings**:

1. **Clarification Q3 Guidance**: "Practical isolation - only mocking I/O boundaries, not pure computation"

    - Mock: VSCode API calls (`vscode.window.*`, `vscode.workspace.*`)
    - Mock: Filesystem operations (`fs.promises.*`, `fs.existsSync`)
    - Do NOT mock: Pure functions (JSON.parse, string manipulation, path.join)

2. **Mocha + Sinon Best Practices**:

    - Source: [The Ultimate Unit Testing Cheat-sheet](https://gist.github.com/yoavniran/1e3b0162e1545055429e)
    - Use `beforeEach` to reset mocks (avoid shared state)
    - Use `afterEach` to restore stubs with `sinon.restore()`
    - **Anti-pattern**: Module-level `jest.mock()` (causes flaky tests)

3. **Isolation Scope for Our Services**:
    - **FileService**: Mock `fs.promises` only, not `path` operations
    - **SettingsManager**: Mock VSCode workspace API + FileService, not JSON parsing
    - **LocaleService**: Mock FileService for locale file loading, not message lookup logic
    - **WebViewManager**: Mock VSCode window API + FileService, not HTML template rendering

**Decision**: Implement practical I/O-only isolation. Create test helpers that instantiate services with isolated mocks, following pattern:

```typescript
function createIsolatedFileService(fsMock: FSMock): FileService {
	const service = new FileService();
	service._setFileSystem(fsMock);
	return service;
}
```

---

### Q4: How do we implement fail-fast mode without breaking existing test workflows?

**Research Method**: Mocha documentation + Constitution clarification (Q1)

**Findings**:

1. **Mocha Bail Flag**:

    - Built-in `--bail` flag stops test run on first failure
    - Can be toggled via command line: `mocha --bail` or `mocha --no-bail`
    - Does NOT require code changes in test files

2. **VSCode Test Runner Integration** (from [Testing Extensions Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension)):

    - `@vscode/test-electron` runs Mocha internally
    - Can pass Mocha options via `runTests()` configuration
    - Example: `mochaOptions: { bail: true }`

3. **Implementation Strategy**:
    - Add `--bail` flag to npm test script: `"test:bail": "npm test -- --bail"`
    - Keep default `npm test` without bail (backward compatible)
    - Document in quickstart.md

**Decision**: Add optional `test:bail` npm script, keep default behavior unchanged. No code changes needed in test files.

---

### Q5: What guided recovery patterns should we use for test failures?

**Research Method**: Constitution clarification (Q2) + existing test analysis

**Findings**:

1. **Clarification Q2 Guidance**: "Guided recovery with error messages (tell user what to fix)"

    - Don't auto-fix broken tests
    - Provide actionable error messages with specific remediation steps
    - Example: "Mock VSCode API missing. Call setupVSCodeMock() in beforeEach"

2. **Assertion Message Best Practices**:

    - Source: Mocha/Chai documentation
    - Include expected vs actual values
    - Include context (which service, which method)
    - Include remediation hint

3. **Helper Function Pattern**:

    ```typescript
    function assertMockIsSetup(service: any, mockName: string): void {
    	if (!service._getMock || !service._getMock()) {
    		throw new Error(`${mockName} not configured. Call service._set${mockName}() in beforeEach. ` + `See quickstart.md section "Setting Up Service Mocks" for details.`);
    	}
    }
    ```

4. **Test Setup Validation**:
    - Add optional validation helpers in `testHelpers.ts`
    - Not enforced (per Q2: "optional"), but available for complex tests
    - Example: `validateFileServiceMock()`, `validateWebViewMock()`

**Decision**: Create guided recovery helpers in `src/test/helpers/testHelpers.ts`:

-   Error message templates with remediation steps
-   Optional mock validation functions
-   Link to quickstart.md for detailed setup guide

---

## Summary of Key Decisions

| Question        | Decision                                                     | Rationale                                            |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| DI Pattern      | Function-based injection (`_setVSCodeApi`, `_setFileSystem`) | Already proven in logging.ts, simple, type-safe      |
| WebView Mocking | Enhance VSCodeMock with complete WebView API structure       | Fixes 8/8 failing WebViewManager tests               |
| Isolation Scope | I/O boundaries only (VSCode API + filesystem)                | Per Q3 clarification: practical, not full sandboxing |
| Fail-Fast Mode  | Add `test:bail` npm script, keep default unchanged           | Backward compatible, no code changes needed          |
| Guided Recovery | Error templates in testHelpers.ts with remediation steps     | Per Q2 clarification: guide users, don't auto-fix    |

---

## Open Questions / Risks

**None identified** - All research questions answered with concrete decisions. Constitution compliance verified (see plan.md Constitution Check section).

---

## References

1. [VSCode Extension Testing Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
2. [VSCode Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
3. [Dependency Injection in JavaScript/TypeScript](https://blog.appsignal.com/2022/02/16/dependency-injection-in-javascript-write-testable-code-easily.html)
4. [Comparing jest.mock and DI in TypeScript](https://dev.to/keithbro/comparing-jest-mock-and-dependency-injection-in-typescript-khj)
5. Existing codebase: `src/services/logging.ts` (reference DI implementation)
6. Existing codebase: `src/test/helpers/mocks.ts` (VSCodeMock implementation)
7. Existing codebase: `TEST-FRAMEWORK-FIX-PROGRESS.md` (test failure analysis)

---

**Next Steps**: Proceed to Phase 1 (Design) - Create data-model.md, contracts/, and quickstart.md based on these research findings.
