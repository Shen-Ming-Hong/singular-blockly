<!--
SYNC IMPACT REPORT — 2026-09-24
==============================
Version Change: 1.7.0 → 1.8.0
Modified Principles:
  - VII. Comprehensive Test Coverage: clarify when tests are required
  - X. Professional Release Management: align with annotated-tag GitHub Actions release
Added Sections:
  - Development Standards / Spec-Driven Development: define the full SDD threshold
Removed Sections:
  - Obsolete local VSIX and gh release create checklist
Templates Status:
  - Spec Kit templates read the constitution at runtime; no template changes
Follow-up TODOs: None
-->

<!--
SYNC IMPACT REPORT
==================
Version Change: 1.6.0 → 1.7.0
Modified Principles:
  - Principle V: Research-Driven Development (MCP-Powered)
    → Research-Driven Development
    * 保留使用最新官方與第一手來源查核技術決策的強制要求
    * 將研究工具改為環境中可用的工具，MCP 為可選而非必要依賴
  - Principle XI: Agent Skills Architecture
    * 區分貢獻者工作流 Skills 與終端 Blockly 專案 Skills
    * 移除容易過時的固定技能數量與清單
    * 補充跨代理相容、漸進式揭露、使用者內容保護與安全要求
Added Sections: None
Removed Sections: None
Templates Status:
  ✅ plan-template.md - 執行階段讀取憲法，無須修改
  ✅ spec-template.md - 無須修改
  ✅ tasks-template.md - 無須修改
  ✅ checklist-template.md - 無須修改
Version Bump Rationale:
  - MINOR version bump (1.6.0 → 1.7.0)
  - 擴充 Principle XI 並放寬 Principle V 的工具限制，未移除核心原則
  - 原有以 MCP 查核官方來源的流程仍符合修訂後規範
Context:
  - Amendment date: 2026-08-12
  - 支援以專案內 Agent Skills 取代終端使用者 MCP 與系統 Node.js 依賴
Follow-up TODOs:
  - None
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

### V. Research-Driven Development

Developers MUST verify unstable or third-party facts against current, authoritative information before making implementation decisions. This means:

-   Prioritize official documentation, release notes, specifications, and upstream source code
-   Use the research capabilities available in the current environment, such as documentation search, web access, repository search, local source inspection, or MCP tools
-   Treat MCP as an optional research transport; neither the product nor the development workflow may require MCP solely to satisfy this principle
-   Verify compatibility with the project's current Blockly, VS Code API, PlatformIO, and other dependency versions
-   Cross-check breaking changes, deprecations, security constraints, and migration guidance before adopting third-party integrations
-   Record material findings and source references in specification research artifacts, plans, or concise code comments

**Rationale**: Blockly, the VS Code API, PlatformIO, and related tooling evolve rapidly. Requiring current first-party evidence prevents decisions based on stale assumptions, while tool-neutral research keeps the workflow usable across environments that expose different capabilities. MCP remains valid when available but is not a prerequisite for trustworthy research.

**Example Use Cases**:

-   Before adding a Blockly feature, verify the supported API and serialization behavior in official documentation or upstream source
-   Before changing the minimum VS Code version, confirm the capability and release status in official VS Code documentation
-   When integrating or removing a dependency, review its official compatibility, migration, and security guidance
-   When troubleshooting, compare local behavior with current upstream issues, source code, and release notes

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
-   Core business logic remains independently testable and follows the documented coverage target

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

正式版本 MUST 遵循語意化版本，並在同一個待合併 PR 中同步更新 `package.json`、
`package-lock.json` 與繁體中文／英文並列的 `CHANGELOG.md`。發布前 MUST 完成
本地審查、使用者發布核准、PR 的必要 CI／CodeQL 檢查及受保護分支合併。

合併後，正式發布 MUST 只以指向該合併提交的 annotated `vX.Y.Z` tag 觸發
`.github/workflows/publish.yml`。GitHub Actions MUST 建置並重用同一份 VSIX，
發布至 GitHub Releases、VS Code Marketplace 與 Open VSX；不得在本機建立
正式 VSIX 或執行 `gh release create`。完成後 MUST 驗證發布端版本一致、
GitHub Release 資產可下載且 SHA-256 正確，並確認發布說明的雙語內容。

**Rationale**: 由同一個 tag 與 CI 產物發布，可避免本機與市集產物不同，並保留
可追溯的驗證證據。GitHub Release 的 VSIX 同時提供離線安裝管道。

### XI. Agent Skills Architecture

The project MUST use Agent Skills as a structured, reusable capability layer while keeping development automation separate from end-user project guidance. This means:

-   **Contributor Workflow Skills**: Skills used to develop and maintain Singular Blockly MUST keep their source of truth under `.github/skills/` and be exposed to supported agents through the repository's integration layout, including `.agents/skills/`
-   **End-User Project Skills**: Skills generated inside Blockly projects MUST describe how an AI reads, validates, and edits that project's workspace without requiring the user to install a separate MCP server
-   **Canonical Contract**: A generated project MUST have one canonical Skill contract under `.agents/skills/`; agent-specific locations such as `.claude/skills/` MUST be compatibility entry points rather than divergent copies of the contract
-   **Skill Design Standards**: Skills MUST use valid `SKILL.md` frontmatter, clear activation descriptions, and progressive disclosure with detailed contracts in `references/` when appropriate
-   **Content Ownership**: Generated and extension-managed Skill files MUST be distinguishable from user-owned notes and custom files; automated updates MUST preserve user-owned content
-   **Cross-Agent Compatibility**: Product Skills MUST provide equivalent workspace guidance to every explicitly supported AI agent without assuming one vendor-specific tool protocol
-   **Security Requirements**: Third-party and generated Skills MUST be reviewable, MUST NOT silently execute untrusted project content, and MUST validate structured data before it affects a live workspace
-   **Workflow Integration**: Skills complement but do not override the constitution, product validation, release gates, or explicit user approval requirements

**Rationale**: Agent Skills provide reusable guidance without requiring each user to operate an external server or duplicate project knowledge across AI products. Separating contributor workflow Skills from generated end-user Skills keeps ownership clear, while one canonical contract and thin compatibility entry points prevent behavioral drift. Progressive disclosure, content ownership, and validation requirements protect both context efficiency and project integrity.

## Development Standards

### Spec-Driven Development

新增或改動跨 Extension Host／WebView 的契約、Blockly 積木與產生器契約、
工作區持久格式、板型上傳流程、受管理 Runtime、安全邊界或重大相容性時，
MUST 先檢查既有 `specs/`，並以完整 Spec Kit 流程定義可觀察的需求與驗收條件。
文件、翻譯及不改變契約的獨立錯誤修正 MAY 依對應維護技能處理；重大依賴升級
MUST 先依實際影響判定是否需要完整 SDD。

完整流程依序為 `specify`、`clarify`、`plan`、`tasks`、`analyze`、
`implement`、`converge`；需要品質檢查表時使用 `checklist`。開始新的完整 SDD
工作時 MUST 查核 Spec Kit CLI 與專案整合狀態，並對照官方穩定版；是否升級依
相容性與本次需求決定，不因每次接續對話而自動升級。

**Rationale**: 以契約變更界定完整 SDD，可讓跨執行環境的功能先建立共同驗收依據，
同時避免一般維護產生不必要的規格文件。

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
-   Non-trivial behavior changes MUST have focused automated tests; documentation-only changes need no new tests
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
-   Verify library compatibility and API changes with current authoritative sources using available research tools (Principle V)
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

**Version**: 1.8.0 | **Ratified**: 2025-10-17 | **Last Amended**: 2026-09-24
