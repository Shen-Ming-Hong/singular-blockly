# Feature Specification: Architecture Refactoring and Code Cleanup

**Feature Branch**: `001-refactor-architecture-cleanup`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: User description: "根據專案架構檢查結果，重構和清理以下問題：1) 刪除空的 src/modules 目錄；2) 將 webviewManager.ts 中的 fs 操作改用 FileService；3) 合併重複的語言載入方法；4) 改善臨時工具箱檔案處理；5) 動態載入 Arduino 模組；6) 提取 Magic Numbers 為常數"

## Clarifications

### Session 2025-10-17

-   Q: 對於工具箱配置處理，應該採用記憶體快取還是臨時檔案方法？ → A: 使用帶時間戳的唯一臨時檔案（例如 `temp_toolbox_1634567890123.json`）
-   Q: FileService 的 API 是同步還是非同步的？應該如何處理？ → A: 檢查 FileService 當前 API，如果是非同步則重構呼叫鏈為 async/await，如果是同步則直接替換

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Remove Unused Directory Structure (Priority: P1)

As a developer navigating the codebase, I want to see only actively used directories so that I can understand the project structure without confusion from empty placeholder folders.

**Why this priority**: This is the highest priority because it has zero risk, requires no logic changes, and immediately improves code clarity. It can be completed in minutes and sets the foundation for other refactoring work.

**Independent Test**: Can be fully tested by verifying the `src/modules/` directory no longer exists and all tests still pass. Delivers immediate value by reducing cognitive load when browsing the project.

**Acceptance Scenarios**:

1. **Given** the project has empty directories under `src/modules/`, **When** cleanup is performed, **Then** these directories (`core/`, `features/`, `services/`, `types/`, `utils/`) are completely removed
2. **Given** the directories are removed, **When** the extension is compiled and activated, **Then** all functionality works exactly as before
3. **Given** the directories are removed, **When** running the full test suite, **Then** all tests pass without modification

---

### User Story 2 - Enforce Architecture Principles in File Operations (Priority: P1)

As a developer maintaining the codebase, I want all file operations to go through the FileService abstraction so that file handling is consistent, testable, and follows the documented architecture patterns.

**Why this priority**: This is critical because it directly addresses a violation of the project's stated architecture principles. The current direct use of Node's `fs` module in `webviewManager.ts` bypasses the abstraction layer designed for consistency and testability.

**Independent Test**: Can be tested by verifying no direct `fs` module imports exist in `webviewManager.ts`, and all file reads use FileService methods. Delivers value by making the code more testable and maintainable.

**Acceptance Scenarios**:

1. **Given** `webviewManager.ts` currently uses `fs.readFileSync()`, **When** refactored, **Then** all file reads use `FileService.readFile()` or equivalent methods
2. **Given** HTML template files need to be loaded, **When** loading occurs, **Then** FileService handles the file I/O operations
3. **Given** toolbox configuration files need to be read, **When** reading occurs, **Then** FileService handles the operations
4. **Given** the refactoring is complete, **When** running tests, **Then** file operations can be easily mocked through FileService
5. **Given** the refactoring is complete, **When** all tests run, **Then** they all pass without changes to test expectations

---

### User Story 3 - Eliminate Code Duplication in Locale Loading (Priority: P2)

As a developer adding new language support or modifying locale handling, I want a single method for loading locale files so that changes only need to be made once and bugs are easier to fix.

**Why this priority**: This addresses maintainability by reducing code duplication (DRY principle violation). While not urgent, it prevents future maintenance issues when locale loading logic needs updates.

**Independent Test**: Can be tested by verifying both main editor and preview windows still load all supported languages correctly, and only one locale loading method exists in the codebase.

**Acceptance Scenarios**:

1. **Given** two nearly identical methods exist (`loadLocaleFiles()` and `loadLocaleFilesForPreview()`), **When** refactored, **Then** only one parameterized method remains
2. **Given** the unified method is called for the main editor, **When** webview is created, **Then** all 15 languages load correctly
3. **Given** the unified method is called for preview windows, **When** backup preview is opened, **Then** all 15 languages load correctly
4. **Given** a new language needs to be added in the future, **When** adding the language files, **Then** no code changes are needed (only file additions)

---

### User Story 4 - Improve Temporary File Management (Priority: P2)

As a user working with multiple workspace windows, I want the extension to avoid file conflicts and accumulation of temporary files so that the workspace remains clean and multiple instances don't interfere with each other.

**Why this priority**: This prevents potential bugs in multi-window scenarios and avoids workspace pollution. While the current system works in single-window usage, it's a ticking time bomb for edge cases.

**Independent Test**: Can be tested by opening multiple workspaces simultaneously with Blockly editors and verifying no file conflicts occur, plus checking that temp files are cleaned up when windows close.

**Acceptance Scenarios**:

1. **Given** toolbox configuration needs processing, **When** WebView is created, **Then** a uniquely-named temporary file is created using timestamp (e.g., `temp_toolbox_1634567890123.json`)
2. **Given** multiple Blockly editor windows are open, **When** both load toolbox configurations, **Then** no file conflicts occur due to unique timestamps
3. **Given** a WebView panel is closed, **When** disposal occurs, **Then** any associated temporary toolbox files are deleted
4. **Given** temporary files use timestamps, **When** system runs for extended periods, **Then** old unused temp files are eventually cleaned up (via disposal or periodic cleanup)
5. **Given** the extension is reloaded, **When** starting fresh, **Then** stale temp_toolbox.json files from previous sessions don't interfere

---

### User Story 5 - Enable Dynamic Arduino Module Discovery (Priority: P3)

As a developer adding new Arduino block categories, I want the system to automatically discover generator modules so that I don't need to manually update hardcoded lists in multiple places.

**Why this priority**: This is a nice-to-have improvement that reduces friction when extending the system. Not critical for current functionality but prevents future mistakes when adding new hardware support.

**Independent Test**: Can be tested by adding a new generator file to the arduino/ directory and verifying it's automatically loaded without code changes, then removing it and confirming it's no longer loaded.

**Acceptance Scenarios**:

1. **Given** Arduino generator modules exist in `media/blockly/generators/arduino/`, **When** WebView content is generated, **Then** the system automatically scans the directory and includes all `.js` files except `index.js`
2. **Given** a new generator file is added (e.g., `servos.js`), **When** the editor loads, **Then** the new module is automatically included without code changes
3. **Given** a generator file is removed, **When** the editor loads, **Then** the removed module is not included and no errors occur
4. **Given** the directory scan completes, **When** modules are loaded, **Then** they are loaded in a consistent order (e.g., alphabetically)
5. **Given** scanning occurs on each WebView creation, **When** performance is measured, **Then** the scan adds negligible overhead (< 10ms)

---

### User Story 6 - Improve Code Readability with Named Constants (Priority: P3)

As a developer reading or modifying timeout/delay logic, I want meaningful constant names instead of magic numbers so that I can understand the purpose and safely adjust timing values.

**Why this priority**: This is a code quality improvement that makes the codebase more maintainable. Lowest priority because magic numbers don't break functionality, but they harm long-term maintainability.

**Independent Test**: Can be tested by searching the codebase for numeric literals related to timing and verifying they've been replaced with descriptive constants, then confirming all timing-dependent functionality still works.

**Acceptance Scenarios**:

1. **Given** timeout values like `10000` exist in code, **When** refactored, **Then** they are replaced with named constants like `BOARD_CONFIG_REQUEST_TIMEOUT_MS`
2. **Given** delay values like `100` and `200` exist, **When** refactored, **Then** they are replaced with named constants like `UI_STABILIZATION_DELAY_MS` and `PANEL_REVEAL_DELAY_MS`
3. **Given** constants are defined, **When** reviewing code, **Then** constants are grouped logically (e.g., in a dedicated constants file or at the top of the module)
4. **Given** constants have clear names, **When** a developer needs to adjust timing, **Then** they can identify the correct constant without tracing through code
5. **Given** constants are used consistently, **When** searching for all timeout/delay values, **Then** no hardcoded numbers remain in timing-critical code

---

### Edge Cases

-   **What happens when FileService operations fail?** System should log errors and show user-friendly error messages (existing error handling should be preserved)
-   **What if directory scanning for Arduino modules encounters permission errors?** Should fall back to a default list and log a warning, ensuring the editor still loads
-   **What if temporary files can't be deleted during cleanup?** Should log the error but not block other operations (best-effort cleanup)
-   **What if multiple WebView instances are created rapidly?** Unique timestamps ensure each gets its own temp file without conflicts
-   **What if a developer adds an invalid .js file to the generators directory?** The browser will handle JavaScript errors; the scanning mechanism only discovers files, not validates them

## Requirements _(mandatory)_

### Functional Requirements

#### Phase 1: Structural Cleanup (P1)

-   **FR-001**: System MUST remove all empty directories under `src/modules/` including `core/`, `features/`, `services/`, `types/`, and `utils/`
-   **FR-002**: System MUST maintain all existing functionality after directory removal (verified by test suite)
-   **FR-003**: System MUST not break any import paths or references when directories are removed

#### Phase 2: FileService Integration (P1)

-   **FR-004**: `webviewManager.ts` MUST NOT import or use Node's `fs` module directly
-   **FR-005**: All file read operations in `webviewManager.ts` MUST use `FileService.readFile()` or equivalent methods
-   **FR-006**: HTML template loading MUST go through FileService abstraction
-   **FR-007**: Toolbox configuration file reading MUST go through FileService abstraction
-   **FR-008**: All existing error handling for file operations MUST be preserved during refactoring
-   **FR-009**: Implementation MUST first inspect FileService API (synchronous vs asynchronous), then refactor calling code appropriately: if async, convert methods to async/await; if sync, perform direct replacement

#### Phase 3: Code Deduplication (P2)

-   **FR-010**: System MUST have only one method for loading locale files (eliminate `loadLocaleFiles()` and `loadLocaleFilesForPreview()` duplication)
-   **FR-011**: The unified locale loading method MUST accept a `Webview` parameter to generate appropriate URIs
-   **FR-012**: Main editor and preview windows MUST continue to load all 15 supported languages correctly
-   **FR-013**: The refactored method MUST maintain the same script tag output format as before

#### Phase 4: Temporary File Handling (P2)

-   **FR-014**: System MUST avoid reusing the same temp_toolbox.json filename across multiple instances
-   **FR-015**: Temporary toolbox files MUST use timestamp-based unique identifiers (format: `temp_toolbox_{timestamp}.json` where `{timestamp}` is `Date.now()` milliseconds, e.g., `temp_toolbox_1734451234567.json`) to prevent conflicts
-   **FR-016**: System MUST clean up temporary toolbox files when WebView panels are disposed
-   **FR-017**: Cleanup operations MUST NOT block or throw errors if files don't exist or can't be deleted
-   **FR-018**: System MUST use file-based approach (not in-memory caching) to maintain consistency with existing architecture patterns

#### Phase 5: Dynamic Module Loading (P3)

-   **FR-019**: System MUST automatically discover Arduino generator modules by scanning `media/blockly/generators/arduino/` directory
-   **FR-020**: Directory scan MUST exclude `index.js` from the module list (it's the main entry point, not a generator)
-   **FR-021**: System MUST generate script tags for all discovered `.js` files in the directory
-   **FR-022**: Module loading order MUST be deterministic (e.g., alphabetically sorted)
-   **FR-023**: If directory scanning fails, system MUST fall back to a hardcoded list of known Arduino generator modules (e.g., `io.js`, `motors.js`, `sensors.js`, etc.) with a warning log, ensuring the editor still loads successfully

#### Phase 6: Magic Number Elimination (P3)

-   **FR-024**: All timeout values (e.g., `10000` for board config requests) MUST be replaced with named constants
-   **FR-025**: All delay values (e.g., `100`, `200` for UI timing) MUST be replaced with named constants
-   **FR-026**: Constant names MUST clearly describe their purpose (e.g., `BOARD_CONFIG_REQUEST_TIMEOUT_MS`, `UI_STABILIZATION_DELAY_MS`)
-   **FR-027**: Constants MUST be defined in logical locations (e.g., at module top or in a constants file)
-   **FR-028**: All timing-related hardcoded numbers in `messageHandler.ts` and `extension.ts` MUST be replaced

### Assumptions

-   **FileService API completeness**: FileService provides all necessary file operations. Implementation will inspect the API first to determine if methods are synchronous or asynchronous, then adapt calling code accordingly (async/await if needed).
-   **Test coverage**: Assuming existing test suite adequately covers functionality, so passing tests after refactoring validates correctness.
-   **No concurrent file writes**: Temporary toolbox file conflicts are primarily a read-time concern; concurrent writes to different temp files are handled by unique naming.
-   **Node.js file system behavior**: Standard Node.js fs behavior applies for timestamp-based unique filenames (millisecond precision sufficient for most cases).
-   **Extension activation lifecycle**: WebView disposal reliably triggers cleanup handlers; if VS Code kills the process, orphaned temp files are acceptable (will be overwritten on next use).

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: All empty directories under `src/modules/` are removed, reducing project structure complexity by 5 directories
-   **SC-002**: Zero direct imports of Node's `fs` module exist in `webviewManager.ts` (measurable via code scan)
-   **SC-003**: Locale loading code duplication reduced by 50% (from 2 methods to 1 unified method)
-   **SC-004**: Temporary file conflicts eliminated in multi-window scenarios (tested by opening 3+ concurrent Blockly editors)
-   **SC-005**: Manual maintenance burden reduced by eliminating hardcoded Arduino module list (adding new modules requires zero code changes)
-   **SC-006**: Code readability improved with zero magic numbers in timing-critical code paths (measurable via linting rules)
-   **SC-007**: All existing tests pass without modification after each refactoring phase
-   **SC-008**: Extension activation time remains unchanged (within 5% margin) after all refactoring
-   **SC-009**: No new bugs introduced (measured by zero new bug reports related to file operations, locale loading, or module loading in first 2 weeks post-deployment)

## Constitution Alignment

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: Refactoring removes unnecessary complexity (empty dirs, code duplication, magic numbers) without adding new features
-   **Modularity**: FileService abstraction strengthens the modular architecture by enforcing consistent patterns
-   **Avoid Over-Development**: Each refactoring task addresses a real problem found in code review; no speculative improvements
-   **Flexibility**: Dynamic module loading makes it easier to extend Arduino block support without code changes
-   **Research-Driven**: Will use MCP tools to verify best practices for directory scanning, file cleanup patterns, and TypeScript constant conventions
-   **Structured Logging**: Refactoring preserves and respects existing logging service usage; adds logs for new operations (directory scan, cleanup)
-   **Comprehensive Test Coverage**: Existing test suite validates all refactoring; FileService integration improves testability by enabling better mocking
-   **Pure Functions and Modular Architecture**: FileService usage reinforces separation of concerns; file I/O side effects isolated in service layer
