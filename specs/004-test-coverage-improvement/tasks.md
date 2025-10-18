# Implementation Tasks: Test Coverage Improvement

**Feature**: Test Coverage Improvement  
**Branch**: `004-test-coverage-improvement`  
**Generated**: 2025-10-18  
**Input**: User stories from spec.md with priorities (P1/P2/P3)

**Time Estimation Note**: All "Estimated Time" values include implementation, testing, and verification. Times assume familiarity with the codebase and represent focused work time (excluding interruptions).

---

## Task Organization Strategy

Tasks are organized by **user story priority** (not technical layers) to enable independent testing and incremental delivery:

-   **Phase 1: Setup** - Project infrastructure (npm scripts, validation)
-   **Phase 2: Foundational** - Mock enhancements (blocks all user stories)
-   **Phase 3: US-001 (P1)** - Fix failing WebViewManager test (stable baseline)
-   **Phase 4: US-002 (P2)** - Enable isolation with test helpers
-   **Phase 5: US-003 (P3)** - Achieve 90% coverage
-   **Final Phase: Polish** - Documentation and validation

**[P] marker** = Can be executed in parallel  
**[US#] label** = Maps to user story (US-001, US-002, US-003)

---

## MVP Scope Recommendation

**Minimum Viable Product**: Complete Phase 1-3 only (US-001 P1)

-   **Goal**: Fix 1 failing test → 68/68 passing (stable baseline)
-   **Value**: Restores confidence in test suite
-   **Time**: ~2-3 hours
-   **Test Criteria**: `npm test` shows 68/68 passing

---

## Dependency Graph

```
Phase 1: Setup (no dependencies)
    ↓
Phase 2: Foundational (blocks Phase 3-5)
    ↓
Phase 3: US-001 (P1) ← depends on Phase 2
    ↓
Phase 4: US-002 (P2) ← depends on Phase 3 (stable baseline needed)
    ↓
Phase 5: US-003 (P3) ← depends on Phase 4 (isolation needed first)
    ↓
Final Phase: Polish (depends on Phase 5)
```

---

## Independent Test Criteria per User Story

| User Story  | Test Command            | Success Criteria     | Current       | Target       |
| ----------- | ----------------------- | -------------------- | ------------- | ------------ |
| US-001 (P1) | `npm test`              | All tests passing    | 67/68 (98.5%) | 68/68 (100%) |
| US-002 (P2) | Review test code        | Setup lines per test | Unknown       | <5 lines     |
| US-003 (P3) | `npm run test:coverage` | Code coverage %      | ~52%          | 90%+         |

---

## Phase 1: Setup and Infrastructure

### T001: Create fail-fast npm script ✅

-   [x] Add `"test:bail": "vscode-test --bail"` to `package.json` scripts
-   [x] Add `"test:coverage": "vscode-test --coverage"` for coverage report
-   [x] Verify compatibility with vscode-test runner
-   **File**: `package.json`
-   **Estimated Time**: 10 minutes
-   **Dependencies**: None
-   **Test**: Run `npm run test:bail` with failing test, verify stops at first failure
-   **Completed**: 2025-10-18

### T002: Document fail-fast mode usage ✅

-   [x] Add "Fail-Fast Mode" section to `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   [x] Include usage examples: `npm run test:bail`, `npm test`, `npm test -- --grep`
-   [x] Document expected behavior (stops at first failure, backward compatible)
-   [x] Document combination with --grep for selective testing
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 15 minutes
-   **Dependencies**: T001
-   **Test**: Review documentation for clarity
-   **Completed**: 2025-10-18

### T003: Validate Mocha configuration ✅

-   [x] Verify `vscode-test` runner supports `--bail` flag
-   [x] Confirm no conflicting test runner options
-   [x] Verify backward compatibility with standard `npm test`
-   **File**: `package.json`
-   **Estimated Time**: 10 minutes
-   **Dependencies**: T001
-   **Test**: Run `npm test` (default) and `npm run test:bail` both work correctly
-   **Completed**: 2025-10-18 (using vscode-test runner)

### T003.1: Verify selective test re-execution support ✅

-   [x] Document `--grep` flag for running specific test suites
-   [x] Document pattern for re-running failed tests after fix
-   [x] Add to TEST-FRAMEWORK-FIX-PROGRESS.md with usage examples
-   [x] Verify combination with fail-fast: `npm run test:bail -- --grep "FailedTest"`
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 15 minutes
-   **Dependencies**: T001
-   **Maps to**: FR-019 (selective re-execution of failed validation checks)
-   **Test**: Successfully re-run a subset of tests using --grep flag
-   **Completed**: 2025-10-18

---

## Phase 2: Foundational - Mock Enhancements ✅

**⚠️ BLOCKING PHASE**: All user stories depend on these mock fixes

### T004: [P] Fix VSCodeMock.asWebviewUri implementation ✅

-   [x] Open `src/test/helpers/mocks.ts` (lines 58-63)
-   [x] Replace stub implementation with proper URI conversion (fsPath, scheme properties)
-   [x] Verify URI conversion includes all required properties
-   **File**: `src/test/helpers/mocks.ts`
-   **Reference**: `research.md` Q2, `contracts/mock-apis.md`
-   **Estimated Time**: 20 minutes
-   **Dependencies**: None (foundational)
-   **Test**: Unit test verifies file:// → vscode-resource:// conversion
-   **Completed**: 2025-10-18

### T005: [P] Add complete WebView onDidDispose callback handling ✅

-   [x] Verify `src/test/helpers/mocks.ts` (lines 67-70) already has correct implementation
-   [x] Store dispose callback in panel object: `_onDisposeCallback`
-   [x] Call callback in `dispose()` method when panel is disposed
-   **File**: `src/test/helpers/mocks.ts`
-   **Reference**: `research.md` Q2, `contracts/mock-apis.md`
-   **Estimated Time**: 20 minutes
-   **Dependencies**: None (foundational)
-   **Test**: Verify onDidDispose callback is called when panel.dispose() is invoked
-   **Completed**: 2025-10-18 (already implemented correctly)

### T006: [P] Add FSMock.getState() for assertions ✅

-   [x] Add `getState()` method to FSMock class
-   [x] Track: filesRead[], filesWritten[], directoriesCreated[], callCount
-   [x] Return state object with call history for test assertions
-   **File**: `src/test/helpers/mocks.ts`
-   **Reference**: `contracts/mock-apis.md` (Enhanced Mock Features)
-   **Estimated Time**: 25 minutes
-   **Dependencies**: None (foundational)
-   **Test**: Verify getState() returns accurate call history after operations
-   **Completed**: 2025-10-18

### T007: [P] Add VSCodeMock.getState() for assertions ✅

-   [x] Add `getState()` method to VSCodeMock class
-   [x] Track: outputChannelsCreated, webviewPanelsCreated, messagesShown[]
-   [x] Update relevant stubs to record state
-   **File**: `src/test/helpers/mocks.ts`
-   **Reference**: `contracts/mock-apis.md` (Enhanced Mock Features)
-   **Estimated Time**: 25 minutes
-   **Dependencies**: None (foundational)
-   **Test**: Verify getState() returns accurate API call history
-   **Completed**: 2025-10-18

### T008: [P] Create src/test/helpers/testHelpers.ts file ✅

-   [x] Create new file `src/test/helpers/testHelpers.ts`
-   [x] Add TypeScript imports for services and mocks
-   [x] Add 8 helper function signatures with comprehensive JSDoc
-   [x] Add file header documentation with usage examples
-   [x] Implement validation helpers (T017, T018)
-   **File**: `src/test/helpers/testHelpers.ts` (NEW)
-   **Reference**: `contracts/test-helpers.md`
-   **Estimated Time**: 15 minutes
-   **Dependencies**: None (foundational)
-   **Test**: File compiles without errors
-   **Completed**: 2025-10-18

---

## Phase 3: US-001 (P1) - Fix Failing WebViewManager Test

**Goal**: Achieve 68/68 passing tests (100% pass rate)  
**Test Command**: `npm test`  
**Success Criteria**: All tests pass (SC-001)

### T009: [US1] Add \_setVSCodeApi() to webviewManager.ts ✅

-   [x] Open `src/webview/webviewManager.ts`
-   [x] Add module-level variable: `let vscodeApi: typeof vscode = vscode;`
-   [x] Replace all 12 `vscode.workspace`, `vscode.window`, `vscode.commands` calls with `vscodeApi.*`
-   [x] Add injection method `_setVSCodeApi(api: typeof vscode)`
-   [x] Add `_reset()` method to restore production defaults
-   [x] Compile successfully with webpack
-   **File**: `src/webview/webviewManager.ts`
-   **Reference**: `src/services/logging.ts` (lines 10-15, reference implementation)
-   **Estimated Time**: 30 minutes
-   **Dependencies**: T004, T005 (needs fixed WebView mock)
-   **Test**: WebViewManager can be instantiated with mock VSCode API
-   **Completed**: 2025-10-18

### T010: [US1] Add \_setFileService() to webviewManager.ts ⏭️

-   [ ] **DEFERRED**: WebViewManager uses FileService through dependency injection in constructor
-   [ ] Current pattern: `constructor(context, localeService?, extensionFileService?)`
-   [ ] FileService instances are created per workspace folder dynamically
-   [ ] No need for module-level FileService injection - constructor pattern is sufficient
-   **File**: `src/webview/webviewManager.ts`
-   **Reference**: `data-model.md` (Core Component entity, injection points)
-   **Estimated Time**: 0 minutes (not needed)
-   **Dependencies**: T009
-   **Test**: WebViewManager already supports injected FileService via constructor
-   **Status**: DEFERRED - Existing pattern is adequate for testing

### T011: [US1] Refactor failing WebViewManager tests

-   [ ] Open `src/test/webviewManager.test.ts`
-   [ ] Replace manual mock setup with enhanced VSCodeMock (has asWebviewUri fix)
-   [ ] Add `beforeEach`: Create VSCodeMock, set workspaceFolders, inject via \_setVSCodeApi()
-   [ ] Add `beforeEach`: Create FSMock with HTML templates, inject via \_setFileService()
-   [ ] Update test assertions to use enhanced mock structure
-   [ ] Add `afterEach`: Call \_reset() to restore defaults
-   **File**: `src/test/webviewManager.test.ts`
-   **Reference**: `quickstart.md` Part 2 (testing multiple dependencies)
-   **Estimated Time**: 45 minutes
-   **Dependencies**: T009, T010
-   **Test**: Run `npm test -- --grep "WebViewManager"`, verify 8/8 passing

### T012: [US1] Verify 68/68 tests passing

-   [ ] Run full test suite: `npm test`
-   [ ] Verify output shows "68 passing"
-   [ ] Document result in TEST-FRAMEWORK-FIX-PROGRESS.md
-   [ ] Take snapshot of test output for PR evidence
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 10 minutes
-   **Dependencies**: T011
-   **Test**: `npm test` output shows "68 passing (X ms)"

**US-001 Completion Criteria**: `npm test` shows 68/68 passing (100% pass rate)

---

## Phase 4: US-002 (P2) - Enable Test Isolation

**Goal**: Setup takes <5 lines per test  
**Test Command**: Code review of test files  
**Success Criteria**: Each test uses <5 lines setup (SC-003)

### T013: [P] [US2] Implement createIsolatedFileService helper

-   [ ] Open `src/test/helpers/testHelpers.ts`
-   [ ] Implement function per contracts/test-helpers.md specification
-   [ ] Add JSDoc with example usage
-   [ ] Add unit test verifying helper creates isolated instance
-   **File**: `src/test/helpers/testHelpers.ts`
-   **Reference**: `contracts/test-helpers.md` (createIsolatedFileService section)
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T008
-   **Test**: Unit test creates FileService with injected FSMock

### T014: [P] [US2] Implement createIsolatedSettingsManager helper

-   [ ] Implement function accepting VSCodeMock and FileService
-   [ ] Add JSDoc with example usage
-   [ ] Add unit test verifying helper creates isolated instance
-   **File**: `src/test/helpers/testHelpers.ts`
-   **Reference**: `contracts/test-helpers.md` (createIsolatedSettingsManager section)
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T008
-   **Test**: Unit test creates SettingsManager with injected mocks

### T015: [P] [US2] Implement createIsolatedLocaleService helper

-   [ ] Implement function accepting VSCodeMock and FileService
-   [ ] Add JSDoc with example usage
-   [ ] Add unit test verifying helper creates isolated instance
-   **File**: `src/test/helpers/testHelpers.ts`
-   **Reference**: `contracts/test-helpers.md` (createIsolatedLocaleService section)
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T008
-   **Test**: Unit test creates LocaleService with injected mocks

### T016: [P] [US2] Implement createIsolatedWebViewManager helper

-   [ ] Implement function accepting VSCodeMock, FileService, extensionPath
-   [ ] Call validateWebViewMock() before creating instance (guided recovery)
-   [ ] Add JSDoc with example usage
-   [ ] Add unit test verifying helper creates isolated instance
-   **File**: `src/test/helpers/testHelpers.ts`
-   **Reference**: `contracts/test-helpers.md` (createIsolatedWebViewManager section)
-   **Estimated Time**: 25 minutes
-   **Dependencies**: T008, T018 (needs validateWebViewMock)
-   **Test**: Unit test creates WebViewManager with validated mocks

### T017: [P] [US2] Implement validateFileServiceMock helper

-   [ ] Implement validation function per contracts/test-helpers.md
-   [ ] Throw error with remediation message if mock not configured
-   [ ] Link to quickstart.md in error message
-   [ ] Add test verifying error message format
-   **File**: `src/test/helpers/testHelpers.ts`
-   **Reference**: `contracts/test-helpers.md` (validateFileServiceMock section)
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T008
-   **Test**: Unit test verifies throws with actionable error message

### T018: [P] [US2] Implement validateWebViewMock helper

-   [ ] Implement validation function checking WebView API structure
-   [ ] Verify: asWebviewUri, onDidReceiveMessage, onDidDispose, workspaceFolders
-   [ ] Throw error with remediation message if incomplete
-   [ ] Add test verifying validation catches missing properties
-   **File**: `src/test/helpers/testHelpers.ts`
-   **Reference**: `contracts/test-helpers.md` (validateWebViewMock section)
-   **Estimated Time**: 25 minutes
-   **Dependencies**: T008
-   **Test**: Unit test verifies validation detects incomplete mocks

### T019: [US2] Add \_setFileSystem() to fileService.ts

-   [ ] Open `src/services/fileService.ts`
-   [ ] Verify FileSystem interface exists (should already exist)
-   [ ] Add module-level variable: `let filesystem: FileSystem = fs;`
-   [ ] Replace all `fs.*` calls with `filesystem.*`
-   [ ] Add injection method:
    ```typescript
    export function _setFileSystem(fs: FileSystem): void {
    	filesystem = fs;
    }
    ```
-   [ ] Add `_reset()` method to restore default `fs`
-   **File**: `src/services/fileService.ts`
-   **Reference**: `src/services/logging.ts` (reference DI pattern)
-   **Estimated Time**: 25 minutes
-   **Dependencies**: T013 (helper needs this method)
-   **Test**: FileService can use injected filesystem

### T020: [US2] Add DI methods to settingsManager.ts

-   [ ] Add module-level variables: `vscodeApi`, `fileService`
-   [ ] Replace direct vscode/FileService calls with variables
-   [ ] Add `_setVSCodeApi()` injection method
-   [ ] Add `_setFileService()` injection method
-   [ ] Add `_reset()` method to restore defaults
-   **File**: `src/services/settingsManager.ts`
-   **Reference**: `src/services/logging.ts` (reference DI pattern)
-   **Estimated Time**: 30 minutes
-   **Dependencies**: T014 (helper needs these methods)
-   **Test**: SettingsManager can use injected dependencies

### T021: [US2] Add DI methods to localeService.ts

-   [ ] Add module-level variables: `vscodeApi`, `fileService`
-   [ ] Replace direct vscode/FileService calls with variables
-   [ ] Add `_setVSCodeApi()` injection method
-   [ ] Add `_setFileService()` injection method
-   [ ] Add `_reset()` method to restore defaults
-   **File**: `src/services/localeService.ts`
-   **Reference**: `src/services/logging.ts` (reference DI pattern)
-   **Estimated Time**: 30 minutes
-   **Dependencies**: T015 (helper needs these methods)
-   **Test**: LocaleService can use injected dependencies

### T022: [US2] Refactor fileService tests to use helpers

-   [ ] Open `src/test/fileService.test.ts`
-   [ ] Replace manual mock setup with `createIsolatedFileService(fsMock)`
-   [ ] Verify setup takes <5 lines in beforeEach
-   [ ] Run tests: `npm test -- --grep "FileService"`
-   [ ] Verify 10/10 passing (currently 6/10)
-   **File**: `src/test/fileService.test.ts`
-   **Reference**: `quickstart.md` Part 1 (FileService example)
-   **Estimated Time**: 40 minutes
-   **Dependencies**: T013, T019
-   **Test**: All FileService tests pass with <5 line setup

### T023: [US2] Refactor settingsManager tests to use helpers

-   [ ] Open `src/test/settingsManager.test.ts`
-   [ ] Replace manual mock setup with `createIsolatedSettingsManager(vscodeMock, fileService)`
-   [ ] Verify setup takes <5 lines in beforeEach
-   [ ] Run tests: `npm test -- --grep "SettingsManager"`
-   [ ] Document pass rate improvement
-   **File**: `src/test/settingsManager.test.ts`
-   **Reference**: `quickstart.md` Part 2 (multiple dependencies example)
-   **Estimated Time**: 45 minutes
-   **Dependencies**: T014, T020
-   **Test**: All SettingsManager tests pass with <5 line setup

### T024: [US2] Refactor localeService tests to use helpers

-   [ ] Open `src/test/localeService.test.ts`
-   [ ] Replace manual mock setup with `createIsolatedLocaleService(vscodeMock, fileService)`
-   [ ] Verify setup takes <5 lines in beforeEach
-   [ ] Run tests: `npm test -- --grep "LocaleService"`
-   [ ] Verify 9/9 passing (currently 3/9)
-   **File**: `src/test/localeService.test.ts`
-   **Reference**: `quickstart.md` Part 2 (multiple dependencies example)
-   **Estimated Time**: 45 minutes
-   **Dependencies**: T015, T021
-   **Test**: All LocaleService tests pass with <5 line setup

### T025: [US2] Verify <5 lines setup per test

-   [ ] Review all refactored test files (fileService, settingsManager, localeService, webviewManager)
-   [ ] Count setup lines in beforeEach for each test suite
-   [ ] Document setup line count in TEST-FRAMEWORK-FIX-PROGRESS.md
-   [ ] Verify all are <5 lines (SC-003)
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T022, T023, T024
-   **Test**: Code review confirms <5 lines setup for all tests

**US-002 Completion Criteria**: Code review shows <5 lines setup in all test files

---

## Phase 5: US-003 (P3) - Achieve 90% Coverage

**Goal**: 90%+ code coverage with <60s execution time  
**Test Command**: `npm run test:coverage`  
**Success Criteria**: 90%+ coverage, <60s execution (SC-002, SC-005)

### T026: [P] [US3] Complete FileService test coverage to 90%

-   [ ] Run coverage: `npm run test:coverage`
-   [ ] Identify uncovered FileService code paths and fix any remaining failing tests (currently 6/10 passing)
-   [ ] Write new tests for uncovered paths:
    -   Error handling (ENOENT, EACCES)
    -   Edge cases (empty files, invalid paths)
    -   Async operations (concurrent reads/writes)
-   [ ] Ensure all 10/10 tests passing with isolated mocks
-   [ ] Verify FileService coverage >90%
-   **File**: `src/test/fileService.test.ts`
-   **Reference**: `quickstart.md` Part 7 (debugging guide)
-   **Estimated Time**: 60 minutes
-   **Dependencies**: T022
-   **Test**: Coverage report shows FileService >90% with all tests passing

### T027: [P] [US3] Complete SettingsManager test coverage to 90%

-   [ ] Run coverage: `npm run test:coverage`
-   [ ] Identify uncovered SettingsManager code paths and fix any failing tests
-   [ ] Write new tests for uncovered paths:
    -   PlatformIO config sync
    -   Missing workspace folders
    -   Invalid configuration values
-   [ ] Ensure all tests passing with isolated mocks
-   [ ] Verify SettingsManager coverage >90%
-   **File**: `src/test/settingsManager.test.ts`
-   **Reference**: `quickstart.md` Part 5 (common patterns)
-   **Estimated Time**: 60 minutes
-   **Dependencies**: T023
-   **Test**: Coverage report shows SettingsManager >90% with all tests passing

### T028: [P] [US3] Complete LocaleService test coverage to 90%

-   [ ] Run coverage: `npm run test:coverage`
-   [ ] Identify uncovered LocaleService code paths and fix any remaining failing tests (currently 3/9 passing)
-   [ ] Write new tests for uncovered paths:
    -   All supported languages (en, zh-hant, ja, etc.)
    -   Missing locale files (fallback behavior)
    -   Invalid message keys
-   [ ] Ensure all 9/9 tests passing with isolated mocks
-   [ ] Verify LocaleService coverage >90%
-   **File**: `src/test/localeService.test.ts`
-   **Reference**: `quickstart.md` Part 5 (common patterns)
-   **Estimated Time**: 60 minutes
-   **Dependencies**: T024
-   **Test**: Coverage report shows LocaleService >90% with all tests passing

### T029: [P] [US3] Complete WebViewManager test coverage to 90%

-   [ ] Run coverage: `npm run test:coverage`
-   [ ] Identify uncovered WebViewManager code paths (all 8 tests should already pass from Phase 3)
-   [ ] Write new tests for uncovered paths:
    -   WebView lifecycle (create, dispose, reveal)
    -   Message passing (postMessage, onDidReceiveMessage)
    -   Resource URI conversion (asWebviewUri)
    -   State management (workspace state persistence)
-   [ ] Verify WebViewManager coverage >90%
-   **File**: `src/test/webviewManager.test.ts`
-   **Reference**: `quickstart.md` Part 2 (WebView testing)
-   **Estimated Time**: 75 minutes
-   **Dependencies**: T011
-   **Test**: Coverage report shows WebViewManager >90% with all tests passing

### T030: [US3] Run coverage report and verify 90%+

-   [ ] Run: `npm run test:coverage`
-   [ ] Verify overall coverage >90%
-   [ ] Verify critical services (FileService, SettingsManager, LocaleService, WebViewManager) each >95%
-   [ ] Document coverage results in TEST-FRAMEWORK-FIX-PROGRESS.md
-   [ ] Take screenshot of coverage report for PR
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 15 minutes
-   **Dependencies**: T026, T027, T028, T029
-   **Test**: Coverage report HTML shows >90% total coverage

### T031: [US3] Verify <60s execution time

-   [ ] Run full test suite: `npm test`
-   [ ] Record execution time from Mocha output
-   [ ] If >60s, identify slowest tests and optimize
-   [ ] Document execution time in TEST-FRAMEWORK-FIX-PROGRESS.md
-   [ ] Verify linear scaling as tests increase (per Q4 clarification)
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T030
-   **Test**: `npm test` completes in <60 seconds

**US-003 Completion Criteria**: Coverage report shows >90%, execution time <60s

---

## Final Phase: Polish and Documentation

### T032: [P] Update TEST-FRAMEWORK-FIX-PROGRESS.md with results

-   [ ] Document final test pass rate: 68/68 (100%)
-   [ ] Document final coverage: XX% (>90%)
-   [ ] Document execution time: XX seconds (<60s)
-   [ ] Document setup line count: <5 lines per test
-   [ ] Add "Migration Complete" section summarizing improvements
-   **File**: `TEST-FRAMEWORK-FIX-PROGRESS.md`
-   **Estimated Time**: 30 minutes
-   **Dependencies**: T031
-   **Test**: Review documentation for completeness

### T033: [P] Update README.md with new test patterns

-   [ ] Add "Testing Guide" section linking to quickstart.md
-   [ ] Document test commands:
    -   `npm test` (all tests)
    -   `npm run test:bail` (fail-fast mode)
    -   `npm run test:coverage` (coverage report)
-   [ ] Add "For Contributors" section with test best practices
-   [ ] Link to contracts/test-helpers.md for API reference
-   **File**: `README.md`
-   **Estimated Time**: 25 minutes
-   **Dependencies**: T032
-   **Test**: Review README for clarity and completeness

### T034: [P] Verify learning curve <15 min

-   [ ] Have a team member (not the implementer) read quickstart.md
-   [ ] Time how long it takes them to write their first isolated test
-   [ ] Verify <15 minutes (SC-007)
-   [ ] Collect feedback and update quickstart.md if needed
-   **File**: `quickstart.md`
-   **Estimated Time**: 30 minutes (includes team member time)
-   **Dependencies**: T033
-   **Test**: Team member writes isolated test in <15 minutes

### T035: Verify debug time <5 min

-   [ ] Introduce intentional test failure (e.g., wrong mock setup)
-   [ ] Time how long it takes to identify and fix using error messages
-   [ ] Verify <5 minutes (SC-006)
-   [ ] If >5 min, improve error messages in validation helpers
-   **File**: `src/test/helpers/testHelpers.ts` (if improvements needed)
-   **Estimated Time**: 20 minutes
-   **Dependencies**: T032
-   **Test**: Intentional failure fixed in <5 minutes using error messages

---

## Summary Statistics

| Phase        | Task Count | Parallelizable | Estimated Time   | Dependencies      |
| ------------ | ---------- | -------------- | ---------------- | ----------------- |
| Setup        | 4          | 0              | 50 min           | None              |
| Foundational | 5          | 5              | 125 min          | None              |
| US-001 (P1)  | 4          | 0              | 105 min          | Phase 2           |
| US-002 (P2)  | 13         | 6              | 420 min          | Phase 3           |
| US-003 (P3)  | 6          | 4              | 290 min          | Phase 4           |
| Polish       | 4          | 3              | 105 min          | Phase 5           |
| **TOTAL**    | **36**     | **18**         | **~18.25 hours** | Sequential phases |

---

## Parallel Execution Opportunities

**Phase 2 (Foundational)**: All 5 tasks can run in parallel (T004-T008)  
**Phase 4 (US-002)**: 6 tasks can run in parallel (T013-T018)  
**Phase 5 (US-003)**: 4 tasks can run in parallel (T026-T029)  
**Polish**: 3 tasks can run in parallel (T032-T034)

**Total Parallel Savings**: With 2 developers, can reduce from ~17 hours to ~12 hours

---

## Recommended Execution Order

### Sprint 1: MVP (Stable Baseline)

1. Phase 1: Setup (50 min) - Enable fail-fast mode and selective re-execution
2. Phase 2: Foundational (125 min) - Fix mocks (parallel execution)
3. Phase 3: US-001 (105 min) - Fix failing test
4. **Milestone**: 68/68 tests passing

### Sprint 2: Isolation Infrastructure

5. Phase 4: US-002 Part 1 (T013-T018, 130 min) - Implement helpers (parallel)
6. Phase 4: US-002 Part 2 (T019-T021, 85 min) - Add DI to services
7. Phase 4: US-002 Part 3 (T022-T025, 150 min) - Refactor tests
8. **Milestone**: <5 lines setup per test

### Sprint 3: Coverage & Polish

9. Phase 5: US-003 (290 min) - Write missing tests (parallel execution)
10. Final Phase: Polish (105 min) - Documentation (parallel execution)
11. **Milestone**: 90%+ coverage, <60s execution, complete documentation

---

## Validation Commands

```bash
# After Phase 1
npm run test:bail  # Should stop at first failure

# After Phase 3 (US-001)
npm test  # Should show "68 passing"

# After Phase 4 (US-002)
# Code review: Verify <5 lines setup in test files

# After Phase 5 (US-003)
npm run test:coverage  # Should show >90% coverage
npm test  # Should complete in <60 seconds

# Final validation
npm test  # 68 passing
npm run test:coverage  # >90% coverage
npm run test:bail  # Fail-fast works
```

---

## Risk Mitigation

| Risk                            | Mitigation Strategy                                     | Contingency                                     |
| ------------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| Mock fixes break existing tests | Test after each mock enhancement (T004-T007)            | Revert specific commit, fix incrementally       |
| <5 lines setup not achievable   | Review helper function complexity, simplify             | Accept 5-7 lines if guided by error messages    |
| 90% coverage too ambitious      | Prioritize critical paths (FileService, WebViewManager) | Accept 85% if linear scaling maintained         |
| Execution time exceeds 60s      | Profile slowest tests, optimize I/O operations          | Use `--grep` to run subsets, document in README |

---

## Notes

-   **All tasks follow checklist format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`
-   **Independent testing**: Each user story has clear test command and success criteria
-   **Parallel execution**: 18/35 tasks (51%) can run in parallel with proper coordination
-   **MVP focus**: Phase 1-3 delivers immediate value (stable baseline) in ~4 hours
-   **Guided recovery**: Validation helpers (T017-T018) provide actionable error messages per Q2 clarification
-   **Fail-fast support**: T001-T003 enable rapid feedback per Q1 clarification
-   **Practical isolation**: Only I/O boundaries mocked per Q3 clarification
-   **Linear scaling**: Performance tracking in T031 verifies <60s cap per Q4 clarification

---

**Generated by**: `/speckit.tasks` workflow  
**Next Step**: Begin execution with Phase 1 (Setup) tasks  
**Estimated Completion**: 3 sprints (~2 weeks with 1 developer, ~1 week with 2 developers)
