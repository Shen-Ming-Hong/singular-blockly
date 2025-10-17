<!--
SYNC IMPACT REPORT
==================
Version Change: 1.1.5 → 1.2.0
Modified Principles: None (existing principles unchanged)
Added Principles: None
Added Sections: "Git Commit Messages" subsection under Development Standards
Removed Sections: None
Templates Status:
  ✅ plan-template.md - Verified alignment with all principles (no updates needed)
  ✅ spec-template.md - Verified alignment with all principles (no updates needed)
  ✅ tasks-template.md - Verified alignment with all principles (no updates needed)
  ✅ agent-file-template.md - Verified (no constitution-specific updates needed)
  ✅ checklist-template.md - Verified (no constitution-specific updates needed)
Procedural Files Analysis:
  ℹ️ .github/prompts/update.prompt.md - Analyzed for potential principles
     - Contains changelog maintenance workflow (categorize changes, format entries, git commands)
     - Version management already covered in "Version Management" section
     - Documentation standards already covered in "Documentation" section
     - No new principles identified - purely procedural workflow for changelog updates
     - Recommendation: DELETE - Content is operational (how to update changelog), not constitutional
     - Alternative locations: CONTRIBUTING.md, CI/CD scripts, or git hooks
  ℹ️ .github/prompts/check.prompt.md - Previously analyzed (v1.1.4)
     - Contains validation workflow (read constitution → check changes → verify library usage)
     - Recommendation: Keep as operational guide for CI/CD or pre-commit checks
Consolidation Notes:
  - update.prompt.md prescribes changelog update procedures, not governance principles
  - All substantive requirements already in constitution:
    * Version management (Version Management section - semantic versioning)
    * Documentation standards (Documentation section - CHANGELOG.md updates)
  - File provides no constitutional value - purely operational workflow
  - No information loss - CHANGELOG.md itself documents the format and categories
  - Procedural knowledge better suited for developer guides or automation scripts
Change Summary (v1.2.0):
  - Added "Git Commit Messages" subsection under Development Standards
  - Mandates Traditional Chinese for commit description portions
  - Requires Conventional Commits format with English type/scope
  - Provides examples and rationale for the convention
Version Bump Rationale:
  - MINOR version bump (1.1.5 → 1.2.0)
  - New guidance section added (Git Commit Messages)
  - Materially expands Development Standards requirements
  - Backward compatible - does not invalidate existing commits
Follow-up TODOs:
  ⚠️ DELETE .github/prompts/update.prompt.md (no constitutional content; purely procedural)
  ℹ️ Consider moving changelog workflow to CONTRIBUTING.md or CI/CD documentation
  ℹ️ Consider adding git commit message linting to CI/CD pipeline
  ℹ️ Update CONTRIBUTING.md to reference commit message standards
-->

# Singular Blockly Constitution

## Core Principles

### I. Simplicity and Maintainability

Code MUST prioritize clarity and ease of maintenance over clever implementations. This means:

-   Write self-documenting code with clear naming conventions
-   Avoid unnecessary complexity or over-engineering
-   Prefer straightforward solutions that future developers can understand
-   Keep functions focused on single responsibilities
-   Document non-obvious decisions with inline comments

**Rationale**: As an educational VSCode extension for Arduino programming, the codebase must be accessible to contributors of varying skill levels. Simple, maintainable code reduces bugs and accelerates feature development.

### II. Modularity and Extensibility

The architecture MUST support easy extension without requiring major refactoring. This means:

-   Design loosely coupled, modular components
-   Use clear interfaces and abstractions
-   Separate concerns (e.g., UI, business logic, file operations)
-   Make it easy to add new boards, blocks, or features
-   Allow configuration-driven behavior where appropriate

**Rationale**: The extension needs to evolve with new Arduino boards, Blockly blocks, and features. A modular design enables adding functionality (like new sensor blocks or board types) without touching core logic.

### III. Avoid Over-Development

Development MUST focus on delivering core value without unnecessary features. This means:

-   Implement only what users need now
-   Follow "You Aren't Gonna Need It" (YAGNI) principles
-   Defer speculative features until proven necessary
-   Keep the scope minimal and functional
-   Validate feature requests before implementation

**Rationale**: Over-development increases maintenance burden and complexity. The extension should remain lightweight and focused on visual Arduino programming, not become a bloated IDE replacement.

### IV. Flexibility and Adaptability

Code MUST accommodate changing requirements and diverse use cases. This means:

-   Write generic, configurable code over hardcoded solutions
-   Support multiple boards, languages, and configurations
-   Design for unknown future requirements
-   Use data-driven approaches (e.g., JSON configs for toolbox)
-   Enable user customization where reasonable

**Rationale**: Arduino development spans multiple boards, languages, and educational contexts. The extension must adapt to different user needs without requiring code changes for each scenario.

### V. Research-Driven Development (MCP-Powered)

Developers MUST leverage Model Context Protocol (MCP) tools to access current, authoritative information before making implementation decisions. This means:

-   Use `resolve-library-id` and `get-library-docs` tools to fetch up-to-date library documentation
-   Search web resources (`webSearch`) for latest API changes, best practices, and breaking changes
-   Verify compatibility with current library versions (Blockly, VSCode API, PlatformIO)
-   Check official documentation before implementing third-party integrations
-   Document research findings in code comments or specification files

**Rationale**: Web development libraries (Blockly, VSCode API, PlatformIO) evolve rapidly with breaking changes and deprecated APIs. MCP tools provide real-time access to authoritative docs, preventing bugs from outdated assumptions. This principle ensures decisions are grounded in current reality, not stale knowledge.

**Example Use Cases**:

-   Before adding a Blockly feature: fetch Blockly docs to verify API signatures
-   When integrating a new library: use MCP to check compatibility and best practices
-   For VSCode API updates: search for migration guides and changelog information
-   When troubleshooting: query latest issues and solutions from official sources

### VI. Structured Logging

All diagnostic output MUST use the standardized logging service. This means:

-   Use `log.info`, `log.error`, `log.debug`, `log.warn` in extension code
-   Use `console.log` only in webview HTML contexts (browser environment)
-   Never use ad-hoc `window.log` or direct console calls in extension code
-   Include contextual information in log messages
-   Use appropriate log levels for different severity

**Rationale**: Consistent logging enables easier debugging, monitoring, and troubleshooting. The centralized logging service allows filtering, formatting, and future enhancements (like log file output) without code changes.

### VII. Comprehensive Test Coverage

Code MUST strive for 100% test coverage with safe, maintainable test design. This means:

-   Target 100% code coverage for all business logic and services
-   Write tests that avoid untestable code paths (e.g., infinite loops, blocking operations)
-   Design code to be testable from the start (avoid hard dependencies on external systems)
-   Use timeouts and mocks to prevent tests from hanging or entering infinite loops
-   Refactor untestable code into testable components with clear boundaries
-   Isolate side effects and I/O operations to make core logic testable
-   Validate both happy paths and error scenarios comprehensively

**Rationale**: High test coverage ensures code reliability and catches regressions early. Avoiding untestable patterns (like infinite event listeners without escape conditions) prevents test suite failures and makes the codebase more maintainable. Well-designed tests serve as living documentation and enable confident refactoring.

**Anti-Patterns to Avoid**:

-   Infinite loops without exit conditions or timeout mechanisms
-   Direct calls to blocking APIs (file I/O, network) in business logic
-   Hard-coded dependencies that cannot be mocked
-   Tests that rely on timing or external state
-   Code that couples multiple concerns making isolation impossible

### VIII. Pure Functions and Modular Architecture

Functions MUST be pure and architecture MUST maximize modularity for long-term maintainability. This means:

-   Prefer pure functions (no side effects, deterministic output for given input)
-   Separate pure business logic from side effects (I/O, state mutations)
-   Keep modules focused on single concerns with clear responsibilities
-   Design interfaces that allow easy testing and swapping of implementations
-   Avoid global state and shared mutable state across modules
-   Use dependency injection to make dependencies explicit and testable
-   Structure code so features can be added/removed without cascading changes

**Rationale**: Pure functions are inherently testable, predictable, and safe to refactor. A modular architecture with isolated concerns makes the codebase easier to understand, maintain, and extend. This approach ensures the project remains maintainable as it grows, enabling new contributors to work on features independently without risking unintended side effects.

**Benefits**:

-   Simplified testing (pure functions don't need complex setup)
-   Easier debugging (deterministic behavior)
-   Better code reuse (functions can be used in different contexts)
-   Reduced coupling (modules depend on interfaces, not implementations)
-   Improved scalability (features can be developed in parallel)

## Development Standards

### Code Quality

-   Follow TypeScript best practices and enable strict type checking
-   Use ESLint configuration provided in the project
-   Maintain consistent formatting via project configuration
-   Write self-explanatory code; add comments only for non-obvious logic
-   Keep functions small and focused (prefer <50 lines)

### File Organization

-   Extension logic resides in `src/` directory
-   Webview assets (HTML/CSS/JS) reside in `media/` directory
-   Blockly customizations (blocks, generators, themes) under `media/blockly/`
-   Configuration files (toolbox, board configs) use JSON format
-   Tests mirror source structure under `src/test/`

### Documentation

-   Update README.md when adding user-facing features
-   Document breaking changes in CHANGELOG.md
-   Include inline JSDoc comments for public APIs
-   Maintain instruction files in `.github/instructions/` for development guidance
-   Keep specification documents in `.specify/` for architectural decisions

### Testing Strategy

-   Target 100% test coverage for all business logic and services (Principle VII)
-   Write safe tests that avoid infinite loops, blocking operations, and timing dependencies
-   Design testable code with pure functions and clear module boundaries (Principle VIII)
-   Focus on integration tests for file operations and webview communication
-   Use mocks and dependency injection for VSCode API and external dependencies
-   Tests are OPTIONAL unless explicitly required by feature specification
-   Validate both happy paths and error scenarios comprehensively
-   Use timeouts and exit conditions to prevent test suite hangs

### Refactoring Standards

When refactoring code, follow these priorities and guidelines:

**Refactoring Priority Order**:

1. Fix known bugs and stability issues (highest priority)
2. Improve readability and maintainability of core features
3. Optimize critical user experience paths
4. Enhance extensibility for future features

**Refactoring Checklist** (must complete before starting):

-   Understand the code's purpose and functionality completely
-   Read critical entry points: `src/extension.ts`, `media/js/blocklyEdit.js`, `media/html/blocklyEdit.html`
-   Use MCP tools to verify library compatibility and API changes (Principle V)
-   Ensure refactoring won't break existing functionality
-   Maintain or improve test coverage to 100% target (Principle VII)
-   Refactor business logic into pure functions where possible (Principle VIII)
-   Eliminate untestable patterns (infinite loops, blocking operations)
-   Replace any `console.log` with structured logging (`log.*` methods)

**Commit Standards**:

-   Describe refactoring purpose and scope clearly
-   Break large refactorings into small, atomic commits
-   Ensure code works after each commit
-   Provide test evidence that refactoring preserves functionality

### Git Commit Messages

All git commit messages MUST follow these conventions:

-   **Format**: Follow Conventional Commits format: `<type>(<scope>): <description>`
-   **Description Language**: Write the description portion in **Traditional Chinese (繁體中文)**
-   **Type and Scope**: Keep type and scope in English (e.g., `feat`, `fix`, `docs`, `refactor`, `test`)
-   **Examples**:
    -   `feat(blocks): 新增溫度感測器積木`
    -   `fix(webview): 修正主題切換時的顯示問題`
    -   `docs(readme): 更新安裝說明`
    -   `refactor(services): 重構檔案服務以提升可測試性`
    -   `test(fileService): 增加錯誤處理的測試案例`

**Rationale**: The project is primarily developed for Traditional Chinese-speaking users (Taiwan). Using Traditional Chinese in commit descriptions improves clarity for the core development team and maintainers, while keeping standardized English keywords (type/scope) maintains compatibility with automated tooling and international collaboration.

## Version Management

The project follows semantic versioning (MAJOR.MINOR.PATCH):

-   **MAJOR**: Breaking changes, removed features, architecture overhauls
-   **MINOR**: New features, new blocks/boards, backward-compatible additions
-   **PATCH**: Bug fixes, documentation updates, minor improvements

Version updates MUST be documented in `package.json` and `CHANGELOG.md`.

## Governance

This constitution supersedes all other development practices. All code changes, pull requests, and architectural decisions MUST comply with these principles.

### Amendment Procedure

1. Propose amendment with clear rationale in specification document
2. Document impact on existing code and templates
3. Update constitution version following semantic versioning
4. Propagate changes to dependent templates and guidance files
5. Update `LAST_AMENDED_DATE` to current date

### Compliance Review

-   All pull requests MUST verify compliance with core principles
-   Complexity violations MUST be justified in plan documents
-   Use `.github/copilot-instructions.md` for runtime development guidance and architectural patterns
-   Constitution check required before Phase 0 research in implementation plans

### Versioning Policy

-   Constitution version increments independently from project version
-   MAJOR: Principle removal, backward-incompatible governance changes
-   MINOR: New principle addition, expanded guidance
-   PATCH: Clarifications, wording improvements, typo fixes

**Version**: 1.2.0 | **Ratified**: 2025-10-17 | **Last Amended**: 2025-10-17

```

```
