# Implementation Plan: Architecture Refactoring and Code Cleanup

**Branch**: `001-refactor-architecture-cleanup` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-refactor-architecture-cleanup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This refactoring addresses six architectural issues found during code review: (1) Empty `src/modules/` directories causing confusion, (2) Direct `fs` module usage violating service layer abstraction, (3) Duplicate locale loading methods, (4) Temporary file conflicts with fixed filename, (5) Hardcoded Arduino module list, (6) Magic numbers reducing code readability.

**Technical Approach**: Incremental refactoring across three priority levels, preserving all functionality via existing test suite validation. FileService integration uses async/await pattern (API is Promise-based). Temp file handling adopts timestamp-based unique naming. Module loading becomes directory-scan based. Constants extracted to module-level declarations.

## Technical Context

**Language/Version**: TypeScript 5.7.2 targeting ES2022  
**Primary Dependencies**: VSCode API ^1.96.0, Blockly 11.2.2, @blockly/theme-modern 6.0.10  
**Storage**: File-based (workspace files via FileService abstraction, PlatformIO config sync)  
**Testing**: Mocha 10.0.10, Sinon 20.0.0, @vscode/test-electron 2.4.1  
**Target Platform**: VSCode Extension Host (Node.js environment)  
**Project Type**: Single TypeScript project with WebView (browser context) assets  
**Performance Goals**: <100ms WebView creation overhead, <10ms directory scan latency  
**Constraints**: Must maintain backward compatibility, zero test changes, no user-visible behavior changes  
**Scale/Scope**: ~800 LOC in webviewManager.ts, ~200 LOC in messageHandler.ts, 15 language files, 10+ Arduino generator modules

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Review each core principle from `.specify/memory/constitution.md`:

-   [x] **Simplicity and Maintainability**: Yes - removes complexity (empty dirs), eliminates duplication, replaces magic numbers with self-documenting constants
-   [x] **Modularity and Extensibility**: Yes - enforces FileService abstraction layer, makes Arduino module loading extensible via directory scanning
-   [x] **Avoid Over-Development**: Yes - addresses only real problems found in code review, no speculative features
-   [x] **Flexibility and Adaptability**: Yes - dynamic module loading removes hardcoded lists, temp file strategy prevents multi-window conflicts
-   [x] **Research-Driven Development (MCP-Powered)**: Completed - verified FileService API characteristics (async Promise-based), directory scanning patterns
-   [x] **Structured Logging**: Yes - preserves existing `log.*` usage, adds logs for new operations (scan, cleanup)
-   [x] **Comprehensive Test Coverage**: Yes - all refactoring validated by existing test suite (804 lines in webviewManager.ts fully covered)
-   [x] **Pure Functions and Modular Architecture**: Yes - FileService integration isolates I/O side effects, locale loading becomes pure transformation

**Research Actions Taken**:

-   [x] Verified FileService API: all methods return Promises (async), no synchronous variants exist
-   [x] Confirmed fs.promises pattern in FileService implementation (readFile, writeFile, mkdir, unlink, readdir, stat all async)
-   [x] Reviewed Node.js directory scanning best practices: fs.promises.readdir() + filter for .js extensions
-   [x] Validated timestamp uniqueness: Date.now() provides millisecond precision sufficient for sequential temp file creation
-   [x] Checked TypeScript constant conventions: module-level const declarations with SCREAMING_SNAKE_CASE naming

**Testability Assessment**:

-   [x] All business logic testable - FileService abstraction enables complete mocking
-   [x] No infinite loops - refactoring maintains existing control flow patterns
-   [x] Pure functions achieved - locale URI generation becomes pure transformation (input webview + paths → output HTML)
-   [x] Dependency injection preserved - FileService, LocaleService, SettingsManager already injected via constructor

**Violations Requiring Justification**: None - all refactoring aligns with constitution principles

## Project Structure

### Documentation (this feature)

```
specs/001-refactor-architecture-cleanup/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (FileService API analysis, best practices)
├── data-model.md        # Phase 1 output (N/A for refactoring - no data structures)
├── quickstart.md        # Phase 1 output (developer guide for refactored code)
├── contracts/           # Phase 1 output (N/A - no API changes)
├── checklists/
│   └── requirements.md  # Quality checklist (already completed)
└── spec.md              # Feature specification (input document)
```

### Source Code (repository root)

This is a **single TypeScript project** with VSCode Extension Host (Node.js) and WebView (browser) contexts:

```
src/
├── extension.ts                      # Entry point - command registration
├── webview/
│   ├── webviewManager.ts            # PRIMARY TARGET: FileService integration, deduplication
│   └── messageHandler.ts            # SECONDARY TARGET: constant extraction
├── services/
│   ├── fileService.ts               # REFERENCE: async Promise-based API (readFile, writeFile, listFiles)
│   ├── localeService.ts             # Used in refactored locale loading
│   ├── settingsManager.ts           # PlatformIO config sync
│   └── logging.ts                   # Structured logging (log.info/error/debug)
└── test/
    ├── webviewManager.test.ts       # Test suite validating refactoring
    ├── messageHandler.test.ts       # Test suite for constants
    └── fileService.test.ts          # FileService behavior reference

media/
├── blockly/
│   ├── blocks/                      # Block definitions
│   ├── generators/
│   │   └── arduino/                 # SCAN TARGET: dynamic module discovery
│   │       ├── index.js             # Excluded from scan (entry point)
│   │       ├── io.js                # Example module to be auto-discovered
│   │       ├── motors.js            # Example module
│   │       └── [10+ other modules]  # All .js files scanned
│   └── toolbox/
│       ├── index.json               # Main toolbox config
│       └── temp_toolbox_*.json      # CLEANUP TARGET: timestamped temp files
├── html/
│   └── blocklyEdit.html             # WebView template loaded via FileService
├── js/
│   └── blocklyEdit.js               # WebView logic
└── locales/
    ├── en/messages.js               # Example locale file
    └── [14 other languages]         # Loaded via unified method
```

**Structure Decision**: Selected **Option 1 (Single Project)** as this is a VSCode extension with unified TypeScript codebase. WebView assets reside in `media/` (browser context) while extension logic lives in `src/` (Node.js context). Refactoring targets are:

1. **Delete**: `src/modules/{core,features,services,types,utils}` (empty directories)
2. **Refactor**: `src/webview/webviewManager.ts` (FileService, deduplication, temp files, dynamic loading)
3. **Extract Constants**: `src/webview/messageHandler.ts` and `src/extension.ts` (magic numbers)
4. **Test Validation**: All changes verified via `src/test/webviewManager.test.ts` and `src/test/messageHandler.test.ts`

## Complexity Tracking

_No constitution violations detected - this section intentionally left empty._

All refactoring aligns with Singular Blockly constitution principles. No complexity justifications required.

---

## Phase 0: Research & Investigation

### Research Document

**Output**: [`research.md`](./research.md) - Technical investigation findings

### Research Questions

1. **FileService API Characteristics** (Priority: CRITICAL)

    - **Question**: Are FileService methods synchronous or asynchronous? What error handling patterns exist?
    - **Investigation**: Read `src/services/fileService.ts` source code, review all public methods
    - **Decision Needed**: Refactoring strategy for webviewManager.ts (direct replacement vs async/await conversion)

2. **Directory Scanning Best Practices** (Priority: HIGH)

    - **Question**: What's the recommended pattern for scanning directories in Node.js with TypeScript?
    - **Investigation**: Review Node.js fs.promises.readdir() documentation, check filtering patterns for .js files
    - **Decision Needed**: Implementation approach for dynamic Arduino module discovery

3. **Timestamp-Based Temp File Strategy** (Priority: HIGH)

    - **Question**: What's the best pattern for unique temp file naming and cleanup?
    - **Investigation**: Research Date.now() precision, disposal lifecycle in VSCode WebView panels
    - **Decision Needed**: Naming convention and cleanup trigger points

4. **TypeScript Constant Conventions** (Priority: MEDIUM)

    - **Question**: Where should magic number constants be defined? What naming conventions apply?
    - **Investigation**: Review TypeScript style guides, check existing constant patterns in codebase
    - **Decision Needed**: Constant location (module-level vs dedicated constants file) and naming

5. **Multi-Window Temp File Conflicts** (Priority: MEDIUM)
    - **Question**: How does VSCode handle multiple WebView instances? Can file conflicts occur?
    - **Investigation**: Review VSCode WebView lifecycle documentation, test multi-window scenarios
    - **Decision Needed**: Whether timestamp precision is sufficient or process ID needed

### Expected Research Outputs

-   **FileService API Specification**: Detailed list of methods, return types (Promise vs synchronous), error handling patterns
-   **Refactoring Strategy Matrix**: For each fs usage in webviewManager.ts, map to FileService equivalent with code transformation pattern
-   **Directory Scan Implementation**: Concrete code example for scanning `media/blockly/generators/arduino/` with .js filtering
-   **Temp File Lifecycle Diagram**: Visual flow showing creation (on WebView init) → usage (toolbox processing) → cleanup (on disposal)
-   **Constant Naming Reference**: Table mapping magic numbers to descriptive constant names with rationale

### Research Success Criteria

-   [ ] All 5 research questions answered with documented decisions
-   [ ] FileService API fully mapped (method signatures, async patterns, error handling)
-   [ ] Concrete code examples provided for directory scanning and temp file management
-   [ ] Constant naming conventions established with 10+ examples from codebase
-   [ ] Multi-window conflict scenarios tested and documented

---

## Phase 1: Design & Contracts

### Data Model Document

**Output**: Not applicable for this refactoring - no new data structures introduced

**Rationale**: This is a pure code refactoring effort. All data structures (WebView state, toolbox JSON, locale files) remain unchanged. The refactoring only modifies how data is accessed (FileService) and organized (constants), not the data itself.

### API Contracts

**Output**: Not applicable - no public API changes

**Rationale**: This refactoring is internal-only. No exposed APIs, extension commands, or VSCode interfaces are modified. WebView message protocol remains identical. PlatformIO configuration format unchanged. All changes are implementation details hidden behind existing interfaces.

### Developer Quickstart

**Output**: [`quickstart.md`](./quickstart.md) - Developer guide for refactored codebase

**Contents**:

1. **FileService Integration Guide**

    - How to read files via FileService instead of direct fs
    - Async/await patterns for file operations
    - Error handling best practices

2. **Adding New Arduino Modules**

    - Simply drop `.js` files in `media/blockly/generators/arduino/`
    - No code changes needed (automatic discovery)
    - Module loading order (alphabetical)

3. **Temporary File Conventions**

    - Naming pattern: `temp_toolbox_{timestamp}.json`
    - Cleanup via WebView disposal hooks
    - Multi-window safety guarantees

4. **Constant Usage Reference**

    - Where to find timing constants (BOARD_CONFIG_REQUEST_TIMEOUT_MS, etc.)
    - How to add new constants
    - Naming conventions (SCREAMING_SNAKE_CASE with \_MS suffix for milliseconds)

5. **Testing Refactored Code**
    - How to mock FileService in tests
    - Directory scan testing strategies
    - Temp file cleanup verification

### Design Success Criteria

-   [ ] Quickstart document provides clear migration path for developers
-   [ ] All refactored patterns documented with before/after examples
-   [ ] Testing strategies cover FileService mocking and async behavior
-   [ ] No ambiguities remain about constant locations or naming conventions
-   [ ] Multi-window scenarios explicitly documented with safety guarantees
