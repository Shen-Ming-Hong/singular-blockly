# Implementation Plan: Test Coverage Improvement

**Branch**: `004-test-coverage-improvement` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-test-coverage-improvement/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

✅ **Phase 0-1 Complete**: Implementation plan created with research-driven design.

Achieve 100% test pass rate (67→68/68) and 90%+ code coverage (~52%→90%+) by implementing dependency injection pattern for 4 core services (FileService, SettingsManager, LocaleService, WebViewManager) based on existing logging.ts DI pattern (\_setVSCodeApi).

**Technical approach**:

1. Fix last failing WebView Manager test via complete mock structure enhancement (research.md Q2)
2. Add \_setFileSystem()/\_setVSCodeApi() injection points following logging.ts pattern (research.md Q1)
3. Create test helper factories for <5 line test setup (contracts/test-helpers.md)
4. Refactor all tests to use isolated mocks (quickstart.md examples)
5. Add fail-fast mode for rapid test execution (research.md Q4)
6. Implement guided recovery with actionable error messages (contracts/test-helpers.md validation helpers)

**Primary user stories**:

-   P1 (Fix failing test): 0→8/8 WebViewManager tests passing via asWebviewUri fix
-   P2 (Enable isolation): <5 lines per test setup via createIsolated\*() helpers
-   P3 (Achieve 90% coverage): Linear scaling <60s execution time with fail-fast support

**Phase 1 Deliverables**:

-   ✅ research.md: 5 key research questions answered with concrete decisions
-   ✅ data-model.md: 5 core entities (Component, Dependency, Test Case, Injection Point, Validation Helper)
-   ✅ contracts/: test-helpers.md + mock-apis.md API specifications
-   ✅ quickstart.md: 15-minute developer guide with reference implementations

## Technical Context

**Language/Version**: TypeScript 5.7.2 (target ES2022, module NodeNext)  
**Primary Dependencies**: VSCode Extension API 1.96.0+, Blockly 11.2.2, Mocha 10.0.10, Sinon 20.0.0, @vscode/test-electron 2.4.1  
**Storage**: Local filesystem (JSON workspace state, PlatformIO ini files)  
**Testing**: Mocha + Sinon (unit tests in src/test/, integration tests run in VSCode Extension Host via @vscode/test-electron)  
**Coverage Tool**: nyc (Istanbul) integrated with @vscode/test-electron - measures line coverage (primary metric, target 90%+) and branch coverage (secondary metric, target 85%+ for critical components)  
**Coverage Measurement**: Lines executed / Total lines × 100; excludes test files, only measures src/ production code  
**Target Platform**: VSCode Extension (Node.js 20.x, cross-platform: Windows/Linux/macOS)  
**Project Type**: Single project (VSCode extension with WebView frontend)  
**Performance Goals**: Test suite <30s current (67/68 passing), <60s hard limit (SC-005) measured as total wall time from Mocha reporter output, linear scaling allowed as test count increases  
**Constraints**: Must maintain backward compatibility, no test framework replacement (keep Mocha/Sinon), VSCode API mocking required for WebView testing, fail-fast mode must not break existing test workflows  
**Scale/Scope**: 68 total tests (28 passing after TEST-FRAMEWORK-FIX-PROGRESS.md fixes), target 90%+ coverage (~52% current), 4 services needing DI (FileService, SettingsManager, LocaleService, WebViewManager)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Review each core principle from `.specify/memory/constitution.md`:

-   [x] **Simplicity and Maintainability**: Reuses existing logging.ts DI pattern (\_setVSCodeApi) for all 4 services. No new testing frameworks or abstractions beyond minimal injection points. Fail-fast mode (Q1) is simpler than complex retry logic.
-   [x] **Modularity and Extensibility**: Each service gets independent DI without affecting others. Guided recovery (Q2) provides extension points for future error handling strategies without breaking existing tests.
-   [x] **Avoid Over-Development**: Using practical isolation (Q3) - only mocking I/O boundaries, not pure computation. No full sandboxing or elaborate test frameworks. Fail-fast mode stops at first failure instead of complex recovery orchestration.
-   [x] **Flexibility and Adaptability**: DI allows swapping real/test implementations at runtime. Performance tracking (Q4) uses existing log infrastructure, no new metrics system.
-   [x] **Research-Driven Development (MCP-Powered)**: ✅ COMPLETE - Research.md documents VSCode Extension DI patterns, WebView mocking strategies, Mocha/Sinon best practices via web search + VSCode API docs
-   [x] **Structured Logging**: Using existing log.info/error/debug pattern (no console.log). Performance metrics via log messages (Q4 clarification).
-   [x] **Comprehensive Test Coverage**: Target 90%+ coverage (SC-002), fix 1/68 failing test (SC-001). All new DI code must have tests. <60s execution time ensures no infinite loops (Q4).
-   [x] **Pure Functions and Modular Architecture**: DI helpers are pure (take dependencies → return instances). Test isolation focuses on I/O boundaries (Q3), keeping pure functions untouched.

**Research Actions Taken**:

-   [x] **MCP Research Completed** (fallback to web search + VSCode API documentation):
    -   VSCode Extension testing best practices verified via VSCode API docs
    -   Mocha/Sinon DI patterns researched via web search (blog.appsignal.com, dev.to)
    -   WebView mocking strategies documented from VSCode Webview API Guide
-   [x] **Web Search Completed**:
    -   @vscode/test-electron 2.4.1 compatibility confirmed
    -   Mocha 10.x + TypeScript best practices documented
    -   Sinon 20.x stubbing patterns verified
-   [x] **Research findings documented**: [research.md](./research.md) - 5 key decisions with concrete implementation strategies

**Testability Assessment**:

-   [x] All business logic can be tested without external dependencies (DI allows mock injection)
-   [x] No infinite loops or blocking operations (<60s hard limit enforced, Q4)
-   [x] Pure functions identified (file I/O separated from logic via FileService, SettingsManager)
-   [x] Dependency injection used for testable module boundaries (4 services getting \_setVSCodeApi/\_setFileSystem methods)

**Violations Requiring Justification**: None

## Project Structure

### Documentation (this feature)

```
specs/004-test-coverage-improvement/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - VSCode Extension DI patterns, WebView mocking strategies
├── data-model.md        # Phase 1 output - Core entities: Core Component, Isolated Dependency, Validation Helper
├── quickstart.md        # Phase 1 output - Developer guide for writing isolated tests with <5 lines
├── contracts/           # Phase 1 output - Test helper APIs (createIsolatedFileService, createIsolatedWebViewManager)
│   ├── test-helpers.md  # DI helper function contracts
│   └── mock-apis.md     # VSCodeMock and FSMock interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Single project structure (VSCode Extension)
src/
├── services/           # Core services needing DI
│   ├── fileService.ts       # ✅ Has FileSystem interface, needs _setFileSystem()
│   ├── settingsManager.ts   # ❌ Needs _setVSCodeApi() + _setFileSystem()
│   ├── localeService.ts     # ✅ Has interfaces, needs _setFileSystem() + _setVSCodeApi()
│   └── logging.ts           # ✅ REFERENCE IMPLEMENTATION (_setVSCodeApi already exists)
├── webview/            # WebView management
│   ├── webviewManager.ts    # ❌ Needs _setVSCodeApi() + _setFileSystem() (1 failing test)
│   └── messageHandler.ts    # Uses WebViewManager (indirect benefit)
└── extension.ts        # Main entry point (uses all services)

src/test/
├── helpers/
│   ├── mocks.ts        # ✅ Has VSCodeMock, FSMock - needs enhancement for complete WebView structure
│   └── testHelpers.ts  # NEW: Guided recovery helpers, fail-fast mode toggle
├── fileService.test.ts       # ⚠️ 6/10 passing - needs DI refactor
├── settingsManager.test.ts   # ⚠️ Needs full rewrite with DI
├── localeService.test.ts     # ⚠️ 3/9 passing - needs DI refactor
├── webviewManager.test.ts    # ❌ 0/8 passing - needs complete mock structure + DI
└── logging.test.ts           # ✅ 6/6 passing - REFERENCE IMPLEMENTATION
```

**Structure Decision**: Using default single project structure. Singular-blockly is a VSCode extension with backend (Node.js TypeScript) and frontend (WebView HTML/JS), but follows monolithic structure under `src/` rather than separate backend/frontend folders. Test files mirror source structure in `src/test/`. All 4 services requiring DI are under `src/services/`, making refactor scope well-contained.

## Complexity Tracking

_No violations - all Constitution principles satisfied._

**Simplicity Verification**: Reusing existing pattern (logging.ts \_setVSCodeApi) avoids introducing new abstraction layers. Fail-fast mode is a simple boolean flag, not a complex orchestration system.

**Research Justification**: MCP research is REQUIRED by Constitution principle #5 (Research-Driven Development) to verify VSCode Extension testing best practices before implementation.
