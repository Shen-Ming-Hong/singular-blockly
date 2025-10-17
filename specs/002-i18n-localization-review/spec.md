# Feature Specification: Internationalization Localization Quality Review and Improvement

**Feature Branch**: `002-i18n-localization-review`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: User description: "規劃一下多國語言翻譯檢查並修正，著重於當地在地化的描述方式，而不是直接用英文直譯"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Review and Identify Non-Localized Translations (Priority: P1)

Education developers and international users who speak different native languages need to use Singular Blockly with natural-sounding, culturally appropriate interface text that matches how they would naturally describe programming concepts in their language, not awkward direct translations from English.

**Why this priority**: This is the foundation for all localization improvements. Without identifying which translations are direct translations versus culturally localized ones, we cannot improve the user experience. This directly impacts user comprehension and adoption in non-English markets.

**Independent Test**: Can be fully tested by reviewing translation files against a checklist of localization principles (natural phrasing, cultural context, educational terminology consistency) and produces a comprehensive audit report of translation quality issues.

**Acceptance Scenarios**:

1. **Given** translation files exist for 15 languages, **When** a developer runs the localization audit, **Then** the system identifies translations that appear to be direct English translations rather than culturally appropriate phrases
2. **Given** a specific language translation file, **When** reviewing technical terminology, **Then** the system flags terms that don't match common educational or technical usage in that culture
3. **Given** translation audit results, **When** examining block labels and tooltips, **Then** the system highlights phrases that are grammatically awkward or unnatural in the target language

---

### User Story 2 - Create Localization Guidelines and Standards (Priority: P2)

Translation contributors and maintainers need clear, language-specific guidelines that explain how to localize (not just translate) Blockly interface elements, so they can create culturally appropriate translations that feel natural to native speakers.

**Why this priority**: Without guidelines, contributors will continue creating direct translations. This prevents future translation quality issues and ensures consistency across contributors.

**Independent Test**: Can be fully tested by creating guidelines for one sample language and having native speakers review whether the guidelines adequately explain localization principles versus translation.

**Acceptance Scenarios**:

1. **Given** a contributor wants to translate Arduino programming terms, **When** they consult the localization guidelines, **Then** they find language-specific examples of how to handle technical terminology in culturally appropriate ways
2. **Given** a translator is working on UI button labels, **When** they reference the guidelines, **Then** they understand whether to use formal or informal tone based on target culture's educational context
3. **Given** new contributors join the project, **When** they review localization documentation, **Then** they can distinguish between word-for-word translation and cultural localization with concrete examples

---

### User Story 3 - Prioritize and Fix High-Impact Translations (Priority: P1)

International users of major language markets (Japanese, Korean, German, Traditional Chinese) need their most frequently used interface elements (block categories, common blocks, error messages) to use natural, culturally appropriate phrasing, so they can work efficiently without mental translation overhead.

**Why this priority**: Fixing high-frequency UI elements has the biggest impact on user experience. These are the strings users see constantly, so poor localization here causes continuous friction.

**Independent Test**: Can be fully tested by selecting top 20 most frequently used strings per language, revising them with native speaker input, and conducting user testing to measure comprehension speed and satisfaction improvement.

**Acceptance Scenarios**:

1. **Given** a Japanese user opens Singular Blockly for the first time, **When** they view the block categories, **Then** category names use natural Japanese educational terminology (e.g., "制御" for control flow, not a direct translation)
2. **Given** a Korean educator is teaching Arduino programming, **When** students read block tooltips, **Then** explanations use culturally familiar examples and phrasing that matches Korean computer science education standards
3. **Given** a German user encounters an error message, **When** the message displays, **Then** the error description uses standard German software localization conventions (formal tone, grammatically correct compound words)
4. **Given** Traditional Chinese users in Taiwan, **When** they read sensor block descriptions, **Then** terminology matches what's used in Taiwan's maker education curriculum (e.g., "感測器" phrasing style)

---

### User Story 4 - Establish Translation Quality Automation (Priority: P3)

Maintainers need automated checks that detect common localization issues during pull request reviews, so translation quality doesn't degrade over time as new contributors add or modify translations.

**Why this priority**: This ensures long-term sustainability but isn't critical for immediate user impact. Can be implemented after core translations are fixed.

**Independent Test**: Can be fully tested by implementing basic checks (character length consistency, placeholder variable preservation, basic pattern matching for direct translations) and running against existing translation files to generate quality reports.

**Acceptance Scenarios**:

1. **Given** a contributor submits a pull request with new translations, **When** CI/CD pipeline runs, **Then** automated checks flag potential issues like missing placeholders, suspiciously short/long translations, or repeated English words in non-English files
2. **Given** a translation file is modified, **When** quality checks run, **Then** warnings appear if new strings don't match the grammatical patterns of existing high-quality translations in that language
3. **Given** monthly translation quality reports are generated, **When** maintainers review them, **Then** they can see trends in translation quality across languages and identify areas needing native speaker review

---

### Edge Cases

-   What happens when a technical term has no culturally appropriate equivalent in the target language (e.g., specific hardware sensor names)?
-   How does the system handle languages with multiple regional variants (Portuguese pt-BR, Chinese zh-hant vs zh-hans) to ensure localization reflects the specific region's context?
-   What if a translation needs to be longer than the English version due to language structure, causing UI layout issues?
-   How are pluralization rules handled for languages with different plural forms (e.g., Slavic languages with multiple plural categories)?
-   What happens when educational terminology standards change in a specific country/region?
-   How do we maintain consistency when multiple contributors work on the same language file?

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: System MUST provide a comprehensive audit of all 15 language translation files identifying potential direct translations versus culturally localized content
-   **FR-002**: System MUST establish localization guidelines documenting language-specific principles for at least the top 5 user languages (Japanese, Korean, German, Traditional Chinese, Spanish)
-   **FR-003**: Contributors MUST be able to reference localization examples showing natural phrasing versus direct translation for common UI patterns
-   **FR-004**: System MUST prioritize translation review based on UI element frequency (block categories > common blocks > tooltips > less-used features)
-   **FR-005**: System MUST preserve technical terminology consistency while allowing cultural adaptation of explanatory text
-   **FR-006**: Maintainers MUST be able to validate translation quality through native speaker review process for each target language
-   **FR-007**: System MUST document cultural context for ambiguous terms (e.g., formal vs informal tone, educational terminology preferences)
-   **FR-008**: Translation files MUST maintain structural consistency (message keys, placeholder formats, special characters) while allowing culturally appropriate content
-   **FR-009**: System MUST provide before/after comparison for proposed localization improvements to facilitate review
-   **FR-010**: Contributors MUST be able to submit localization improvements through standard pull request workflow with language-specific reviewers assigned

### Key Entities _(include if feature involves data)_

-   **Translation String**: A key-value pair representing UI text, including message key, English source text, localized target text, context/usage location, frequency of use, last modified date, and localization quality rating
-   **Localization Guideline**: Language-specific documentation including target language code, cultural context notes, tone preferences (formal/informal), technical terminology standards, example transformations (direct translation vs localized), and common pitfalls to avoid
-   **Language Profile**: Metadata for each supported language including language code, regional variant (if applicable), native speaker reviewers, localization maturity level, last audit date, and priority ranking
-   **Translation Quality Issue**: A detected or reported problem with a translation including severity (critical/major/minor), issue type (direct translation, cultural inappropriateness, technical inaccuracy), affected string key, suggested fix, and resolution status

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: Native speakers of target languages can identify and understand block functions 30% faster compared to baseline direct translations (measured through user testing)
-   **SC-002**: 90% of high-frequency UI strings (top 100 most-used strings per language) are reviewed and approved by native speakers as culturally appropriate within the implementation phase
-   **SC-003**: Translation quality audit identifies at least 70% of existing direct translations versus localized content across all 15 languages
-   **SC-004**: Localization guidelines are created and validated by native speakers for the top 5 user languages (Japanese, Korean, German, Traditional Chinese, Spanish)
-   **SC-005**: Support requests or GitHub issues related to confusing or awkward interface translations decrease by 40% in non-English languages within 3 months of deployment (Baseline: Count GitHub issues tagged with `localization` or `translation` from past 6 months before implementation; Expected baseline: ~10-15 issues/month; Target: Reduce to ≤6 issues/month)
-   **SC-006**: 100% of new translation contributions in pull requests receive review by assigned native speaker reviewers before merging
-   **SC-007**: User satisfaction surveys show average rating improvement from current baseline to 4.5/5.0 or higher for "interface text feels natural in my language" within target languages
-   **SC-008**: Translation consistency across similar UI patterns (e.g., all sensor blocks using consistent terminology) reaches 95% within each language

## Assumptions

-   The project has access to native speakers willing to review and contribute localized translations
-   Educational terminology standards are relatively stable in target language regions
-   Current translation files maintain consistent structure and can be programmatically analyzed
-   UI layout can accommodate reasonable text length variations across languages (up to 150% of English length)
-   Contributors are willing to follow localization guidelines versus simpler direct translation
-   The 15 existing languages represent the primary user base requiring localization attention
-   Translation quality issues are primarily in explanatory text (tooltips, messages) rather than simple labels
-   Block categories and common programming concepts have established educational terminology in target languages

## Dependencies

-   Access to native speaker reviewers for each target language, particularly for validation and approval
-   Existing translation file structure and tooling (languageManager system)
-   Ability to conduct user testing with native speakers in target language regions (could be online/remote)
-   Cultural context research resources for understanding educational terminology in different regions
-   Clear process for coordinating translation review across multiple language contributors

## Constitution Alignment

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: Focuses on improving existing translation content rather than building complex new infrastructure; uses straightforward review and documentation approach
-   **Modularity**: Localization improvements can be made incrementally per language and per UI section without requiring system-wide changes
-   **Avoid Over-Development**: Prioritizes high-impact translations (frequent UI elements) over comprehensive perfection; automation (P3) is deferred until manual processes are proven
-   **Flexibility**: Localization guidelines accommodate different cultural contexts and language structures rather than enforcing one-size-fits-all rules
-   **Research-Driven**: Emphasizes understanding cultural context and educational terminology through native speaker consultation rather than assuming English concepts transfer directly
-   **Structured Logging**: Translation quality issues and reviews will be documented systematically for tracking and future reference
-   **Comprehensive Test Coverage**: Localization improvements can be validated through user testing and native speaker review; automated quality checks ensure regression prevention
-   **Pure Functions and Modular Architecture**: Translation content is separate from code logic; quality analysis tools can be built as pure functions analyzing message data structures
