<!--
SYNC IMPACT REPORT
==================
Version Change: 1.4.0 → 1.5.0
Modified Principles: None
Modified Sections: None
Added Principles:
  - Principle X: Professional Release Management (完整發布管理標準)
    * 定義語意化版本、版本同步、VSIX 打包、雙語文件、GitHub Release 發布、資產管理、驗證步驟
    * 提供 6 階段發布工作流檢查清單（預發布驗證、版本管理、建置打包、Git 標籤、GitHub Release 創建、發布後續）
    * 強制雙語發布說明（繁體中文 + English），包含功能、測試指標、安裝方法、文件連結
    * 使用 gh CLI 自動化發布流程，VSIX 託管於 GitHub Releases
    * 涵蓋線上/離線安裝場景，支援企業內網與教育環境
Added Sections: None
Removed Sections: None
Templates Status:
  ✅ plan-template.md - No updates needed (release process not part of feature planning)
  ✅ spec-template.md - No updates needed (specification format unaffected)
  ✅ tasks-template.md - No updates needed (task structure unaffected)
  ✅ agent-file-template.md - No updates needed (internal template)
  ✅ checklist-template.md - No updates needed (internal checklist)
  ⚠️  .github/copilot-instructions.md - Potential enhancement recommended
      * Consider adding "Release Management" section referencing Principle X
      * Current "Common Pitfalls" could link to release workflow checklist
      * No breaking changes, enhancement optional for consistency
Command Files Review:
  ✅ .github/prompts/speckit.constitution.prompt.md - Reviewed (no updates needed)
  ℹ️  No other command files found
Change Summary (v1.5.0):
  - Added Principle X: Professional Release Management with comprehensive workflow
  - Defined mandatory components:
    * Semantic versioning compliance (MAJOR.MINOR.PATCH)
    * Version synchronization (package.json, CHANGELOG.md, git tags)
    * VSIX packaging for offline installation
    * Bilingual release notes (繁體中文 + English)
    * GitHub Release publication via gh CLI
    * Asset management (VSIX on GitHub Releases, excluded from repo)
    * Verification steps (URL, asset, rendering checks)
  - Provided 6-phase release workflow checklist:
    1. Pre-Release Validation (PR merge, branch cleanup, test validation)
    2. Version Management (package.json, CHANGELOG.md, commit)
    3. Build and Package (npm run package, npx vsce package)
    4. Git Tagging (annotated tags, push with --follow-tags)
    5. GitHub Release Creation (gh release create, asset upload)
    6. Post-Release (announcements, monitoring, documentation updates)
  - Established bilingual documentation requirements:
    * Major features with technical details
    * Test metrics breakdown (unit/integration/manual/hardware)
    * Internationalization status
    * Multiple installation methods with step-by-step guides
    * Related documentation links
  - Enforced asset management best practices:
    * VSIX hosted on GitHub Releases (not in repository)
    * SHA256 verification for integrity
    * .gitignore: *.vsix exclusion rule
  - Benefits documented:
    * User accessibility (offline installation for restricted networks)
    * International reach (bilingual documentation)
    * Distribution reliability (GitHub Releases)
    * Quality assurance (structured checklist)
    * Automation readiness (gh CLI workflow)
    * Professional image (comprehensive release notes)
Version Bump Rationale:
  - MINOR version bump (1.4.0 → 1.5.0)
  - New principle addition: Professional Release Management (Principle X)
  - Materially expanded governance with release workflow standards
  - Backward compatible (existing practices formalized, no breaking changes)
  - Establishes repeatable, automated release process for future versions
  - Aligns with project's educational mission and international accessibility goals
Context:
  - Based on v0.43.0 release experience (2025-01-22)
  - Addresses offline installation requirements for enterprise/education environments
  - Complements Principle IX (Traditional Chinese Documentation Standard) with bilingual release notes
  - Formalizes ad-hoc tagging process into professional workflow
  - Enables future CI/CD automation via gh CLI patterns
Follow-up TODOs:
  - Consider adding "Release Management" section to .github/copilot-instructions.md (optional enhancement)
  - No blocking issues, all templates validated
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
-   **When `webSearch` is unavailable**: Use alternative tool combinations to complete research tasks:
    -   `fetch_webpage` - Extract content from specific documentation URLs
    -   `github_repo` - Search code patterns and implementations in GitHub repositories
    -   `search_code` (mcp_github_github_search_code) - Fast code search across GitHub using native search engine
    -   `search_repositories` (mcp_github_github_search_repositories) - Find relevant projects and examples on GitHub
-   Verify compatibility with current library versions (Blockly, VSCode API, PlatformIO)
-   Check official documentation before implementing third-party integrations
-   Document research findings in code comments or specification files

**Rationale**: Web development libraries (Blockly, VSCode API, PlatformIO) evolve rapidly with breaking changes and deprecated APIs. MCP tools provide real-time access to authoritative docs, preventing bugs from outdated assumptions. This principle ensures decisions are grounded in current reality, not stale knowledge. When primary search tools are unavailable, the alternative tool combination provides equivalent research capabilities through direct documentation access and code repository searches.

**Example Use Cases**:

-   Before adding a Blockly feature: fetch Blockly docs to verify API signatures
-   When integrating a new library: use MCP to check compatibility and best practices
-   For VSCode API updates: search for migration guides and changelog information
-   When troubleshooting: query latest issues and solutions from official sources
-   **Fallback research workflow**: Use `search_repositories` to find relevant projects → `search_code` to locate specific implementations → `fetch_webpage` to read official documentation → `github_repo` to examine complete repository context

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

**UI Testing Exception**: WebView interactive features (Blockly editor) are permitted to use manual testing as specified in feature specifications, provided that:

-   Manual test scenarios are explicitly documented in the feature specification
-   Manual tests are executed and results recorded after each significant change
-   The complexity and ROI of automating WebView tests (requiring Playwright/WebdriverIO setup) outweigh the benefits for the specific feature
-   Core business logic remains independently testable with 100% coverage

**Rationale for Exception**: VSCode Extension WebView automation requires significant infrastructure (headless browser, extension host simulation) with limited reusability. For educational tools like Blockly visual programming, manual testing of drag-and-drop interactions provides sufficient quality assurance while maintaining development velocity.

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

### IX. Traditional Chinese Documentation Standard

All specifications, implementation plans, and user-facing documentation MUST be written in Traditional Chinese (繁體中文, zh-TW). This means:

-   Feature specifications (spec.md) written in Traditional Chinese
-   Implementation plans (plan.md) written in Traditional Chinese
-   User-facing documentation (README.md, user guides) written in Traditional Chinese
-   Task lists (tasks.md) written in Traditional Chinese
-   Research documents (research.md) written in Traditional Chinese
-   All specification artifacts in `/specs/` directory written in Traditional Chinese
-   Technical documentation and inline code comments MAY remain in English for international developer collaboration
-   Commit messages MUST use Traditional Chinese for descriptions (as per existing Git Commit Messages standard)

**Rationale**: The primary user base and development team for Singular Blockly are Traditional Chinese speakers in Taiwan. Standardizing documentation in Traditional Chinese ensures maximum clarity and accessibility for the target audience, reduces miscommunication, and aligns with the project's educational mission. This standard complements the existing language convention in `.github/copilot-instructions.md` and extends it to all specification and planning documents.

**Scope Clarification**:

-   **MUST be Traditional Chinese**: User stories, acceptance criteria, requirements, success metrics, implementation plans, research findings, user guides, README files
-   **MAY be English**: Code comments, API documentation for developers, technical architecture diagrams with English labels, library integration notes
-   **Already standardized in Traditional Chinese**: Git commit message descriptions (per existing standard)

**Benefits**:

-   Improved clarity for primary stakeholders (educators, students in Taiwan)
-   Reduced translation overhead and miscommunication
-   Consistent documentation experience across all project artifacts
-   Better alignment with educational goals and user needs
-   Easier onboarding for Traditional Chinese-speaking contributors

### X. Professional Release Management

All version releases MUST follow a standardized, automated workflow with comprehensive bilingual documentation to ensure quality distribution and user accessibility. This means:

-   **Semantic Versioning Compliance**: Follow MAJOR.MINOR.PATCH strictly (breaking/new feature/bugfix)
-   **Version Synchronization**: Update `package.json` version and create CHANGELOG entry before tagging
-   **VSIX Packaging**: Build production bundle (`npm run package`) and generate VSIX (`npx @vscode/vsce package`) for offline installation
-   **Bilingual Release Notes**: Create comprehensive documentation in both Traditional Chinese and English covering:
    -   Major features and changes (with technical details)
    -   Test metrics breakdown (unit/integration/manual/hardware)
    -   Internationalization status (supported languages)
    -   Installation methods (multiple approaches with step-by-step guides)
    -   Related documentation links (specs, changelog, project home)
-   **GitHub Release Publication**: Use `gh release create` CLI to publish releases with:
    -   Descriptive title format: `[Project Name] vX.Y.Z - [Feature Highlight]`
    -   VSIX file as downloadable asset (with SHA256 for verification)
    -   Markdown-formatted release notes with emoji markers for readability
-   **Asset Management**: Host VSIX on GitHub Releases (not in repository), exclude via `.gitignore: *.vsix`
-   **Verification Steps**: Confirm release URL accessibility, asset download functionality, and release notes rendering

**Rationale**: Professional release management establishes credibility, enables offline installation for restricted environments (企業內網, 教育環境), and serves both Chinese and international users. Automating the workflow via gh CLI reduces human error and ensures consistency. Bilingual documentation maximizes accessibility while maintaining the project's Traditional Chinese focus (Principle IX). VSIX distribution provides an alternative to VS Code Marketplace for users with network restrictions.

**Release Workflow Checklist**:

1. **Pre-Release Validation**:

    - All feature PRs merged to master branch
    - Feature branches deleted (local + remote)
    - Repository cleaned of redundant/temporary files
    - All tests passing (unit, integration, manual, hardware)
    - `.gitignore` updated to prevent development artifacts

2. **Version Management**:

    - Update `package.json` version following semantic versioning
    - Move CHANGELOG "未發布" section to new dated version section
    - Add comprehensive bilingual entries (新增 Added, 變更 Changed, 測試 Tests, 維護 Maintenance)
    - Commit: `git commit -m "chore(release): 發布版本 X.Y.Z"`

3. **Build and Package**:

    - Run production build: `npm run package` (webpack production mode)
    - Generate VSIX: `npx @vscode/vsce package`
    - Verify output: Check file size, file count, no critical warnings

4. **Git Tagging**:

    - Create annotated tag: `git tag -a vX.Y.Z -m "Release version X.Y.Z\n\n[detailed message]"`
    - Push commit and tag: `git push origin master --follow-tags`

5. **GitHub Release Creation**:

    - Create bilingual release notes file (temporary, will be deleted)
    - Execute: `gh release create vX.Y.Z --title "..." --notes-file "release-notes.md" "*.vsix#Singular Blockly Extension Package"`
    - Verify: Check release URL, asset availability, notes rendering
    - Cleanup: Remove temporary release notes file

6. **Post-Release**:
    - Announce release in project channels (if applicable)
    - Monitor for user feedback and issues
    - Update documentation if installation methods changed

**Benefits**:

-   **User Accessibility**: Offline installation support for restricted networks
-   **International Reach**: Bilingual documentation serves global audience
-   **Distribution Reliability**: GitHub Releases provides versioned, persistent download links
-   **Quality Assurance**: Structured checklist prevents incomplete releases
-   **Automation Ready**: gh CLI workflow enables future CI/CD integration
-   **Professional Image**: Comprehensive release notes establish project credibility

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
-   All specifications, plans, and user-facing documentation MUST be written in Traditional Chinese (zh-TW) per Principle IX
-   Technical documentation and code comments MAY remain in English for international collaboration

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

### Git Commit Messages

All git commit messages MUST follow the Conventional Commits 1.0.0 specification with Traditional Chinese descriptions to maintain clear version history and enable automated changelog generation.

**Requirements**:

-   **Format**: Commit message structure MUST be: `<type>(<scope>): <description>`
-   **Type**: MUST be one of the defined types (see Commit Type Definitions below)
-   **Scope**: Optional but recommended for larger changes (e.g., `blocks`, `webview`, `services`, `tests`)
-   **Description Language**: MUST be written in **Traditional Chinese (繁體中文)**
-   **Breaking Changes**: MUST include `!` after type/scope for backward-incompatible changes: `feat(api)!: 重構認證系統`
-   **Commit Body**: Optional but recommended for complex changes requiring additional context
-   **Commit Footer**: Optional, used for issue references and breaking change details

**Commit Type Definitions**:

-   `feat`: 新增功能 (new feature for the user)
-   `fix`: 修復錯誤 (bug fix for the user)
-   `docs`: 文件更新 (documentation only changes)
-   `style`: 程式碼格式調整 (formatting, missing semicolons, etc.; no code logic change)
-   `refactor`: 重構程式碼 (refactoring production code without changing external behavior)
-   `perf`: 效能優化 (code change that improves performance)
-   `test`: 測試相關 (adding or refactoring tests; no production code change)
-   `chore`: 雜項工作 (updating build tasks, package manager configs, etc.; no production code change)
-   `ci`: CI/CD 設定 (changes to CI configuration files and scripts)
-   `build`: 建置系統 (changes to build system or external dependencies)
-   `revert`: 回復提交 (reverts a previous commit)

**Examples**:

```
feat(blocks): 新增溫度感測器積木
fix(webview): 修正主題切換時的顯示問題
docs(readme): 更新安裝說明
docs(constitution): 更新憲法新增提交規範與類型定義
refactor(services): 重構檔案服務以提升可測試性
test(fileService): 增加錯誤處理的測試案例
chore(deps): 更新 Blockly 至 12.3.1 版本
style(css): 調整深色主題的配色方案
perf(generator): 優化程式碼生成效能
ci(github): 新增自動化測試工作流程
build(webpack): 更新 webpack 設定以支援 ES2022
revert: 回復 feat(blocks): 新增溫度感測器積木
```

**Rationale**: Conventional Commits 1.0.0 provides a standardized commit message structure that enables automated tooling (changelog generation, semantic versioning), improves code review efficiency, and maintains clear project history. Traditional Chinese descriptions ensure accessibility for the primary development team and align with Principle IX (Traditional Chinese Documentation Standard). The structured format supports automated release workflows and makes project history more navigable.

**⚠️ CRITICAL: Git Tag Usage Warning**

-   **DO NOT create git tags casually** before an official release
-   Git tags automatically trigger the CI/CD release pipeline
-   Tags should only be created as part of the formal release process
-   Accidental tags can cause unintended package publications to VS Code Marketplace
-   If you need to mark a commit for reference, use branch names or commit messages instead
-   **Release Process**: Tags are created by release managers after all pre-release validations pass

**Rationale**: The project uses automated CI/CD workflows that publish to VS Code Marketplace when tags are pushed. Casual tag creation can trigger unwanted releases, potentially publishing incomplete or untested versions to users. This safeguard ensures release integrity and prevents accidental marketplace publications.

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

**Version**: 1.5.0 | **Ratified**: 2025-10-17 | **Last Amended**: 2025-01-22
