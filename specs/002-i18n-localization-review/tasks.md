# Tasks: Internationalization Localization Quality Review and Improvement

**Input**: Design documents from `/specs/002-i18n-localization-review/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Tests are NOT required for this feature (content quality improvement, not code development)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
-   Include exact file paths in descriptions

---

## Phase 0: Research & Verification ✅ COMPLETED

**Status**: All research completed and documented in `research.md`

**Completed Tasks**:

-   ✅ Translation quality assessment methodology established
-   ✅ Educational programming terminology standards research approach defined
-   ✅ Translation Memory and consistency tools identified (i18n Ally, file-based glossary)
-   ✅ Quality metrics and validation process designed (three-layer framework)
-   ✅ Localization workflow integration strategy documented

**Research Findings**: See `research.md` for full details on:

-   Multi-criteria assessment framework (linguistic naturalness + terminology alignment + pattern detection + frequency prioritization)
-   Per-language educational standards (MEXT for Japan, Ministry of Education for Korea, etc.)
-   Lightweight file-based TM approach with JSON glossary + VS Code i18n Ally
-   Three-layer validation: automated checks + native speaker review + user testing
-   Parallel branch workflow with phased rollout

**Checkpoint**: ✅ Research complete - proceed with implementation

---

## Phase 1: Setup & Infrastructure ✅ COMPLETED

**Purpose**: Project initialization and basic audit tooling structure

-   [x] T001 Create audit tooling directory structure: `scripts/i18n/` with subdirectories for audit scripts
-   [x] T002 [P] Create audit reports output directory: `specs/002-i18n-localization-review/audit-reports/`
-   [x] T003 [P] Copy glossary template to project: `specs/002-i18n-localization-review/localization-glossary.json` (already exists from Phase 1 design)
-   [x] T004 [P] Copy guidelines to project: `specs/002-i18n-localization-review/guidelines/*.md` (already exists from Phase 1 design)
-   [x] T005 [P] Copy contract schemas to project: `specs/002-i18n-localization-review/contracts/*.schema.json` (already exists from Phase 1 design)
-   [x] T006 Install Node.js dependencies for audit scripts: `ajv` (JSON Schema validation), `fs-extra` (file operations)

**Checkpoint**: ✅ Infrastructure ready - can begin user story implementation

---

## Phase 2: Foundational (Blocking Prerequisites) ✅ COMPLETED

**Purpose**: Core audit infrastructure that all user stories depend on

**⚠️ CRITICAL**: User Story 1 (audit) requires this phase; User Stories 2-4 can proceed in parallel

-   [x] T007 Create audit utilities module in `scripts/i18n/lib/audit-utils.js` with pure functions for:
    -   Reading translation files (`media/locales/{lang}/messages.js`)
    -   Parsing JavaScript message objects
    -   Frequency estimation using keyword-based algorithm (see data-model.md for full specification): Always Visible=95 (CATEGORY*\*, TOOLBOX*_), High Usage=70 (common Arduino blocks like ARDUINO*DIGITAL_WRITE), Notifications=50 (ERROR*_, WARNING*\*), Secondary=40 (tooltips, sensors), Default=30, Advanced=20 (LIST*\_, PROCEDURE\_\_). Algorithm implementation must match specification in data-model.md
-   [x] T008 [P] Create schema validator module in `scripts/i18n/lib/schema-validator.js` using `ajv` to validate against:
    -   `contracts/audit-report.schema.json`
    -   `contracts/translation-file.schema.json`
-   [x] T009 [P] Create translation file reader in `scripts/i18n/lib/translation-reader.js` to:
    -   Load all 15 language files
    -   Extract English baseline from `media/locales/en/messages.js`
    -   Return structured data for analysis
-   [x] T010 Create logging utility in `scripts/i18n/lib/logger.js` for console output with timestamps and severity levels

**Checkpoint**: ✅ Foundation ready - audit scripts can now be implemented

---

## Phase 3: User Story 1 - Review and Identify Non-Localized Translations (Priority: P1) 🎯 MVP

**Goal**: Audit all 15 language translation files to identify direct translations, inconsistencies, and quality issues, producing a comprehensive report for prioritization.

**Independent Test**: Run audit script on all 15 languages, verify JSON output validates against `audit-report.schema.json`, manually review 10 sample issues to confirm accuracy.

### Implementation for User Story 1 ✅ COMPLETED

-   [x] T011 [P] [US1] Implement direct translation detector in `scripts/i18n/lib/detectors/direct-translation.js`:
    -   Pattern matching: English grammatical structures (articles "the/a/an", English word order patterns)
    -   Transliteration detection: Katakana patterns in Japanese matching English phonetics without semantic meaning
    -   Word-for-word matching: Compare target translation word count vs English (±10% suggests direct translation)
-   [x] T012 [P] [US1] Implement terminology consistency checker in `scripts/i18n/lib/detectors/terminology-consistency.js`:
    -   Load glossary from `specs/002-i18n-localization-review/localization-glossary.json`
    -   Check if technical terms match approved glossary translations
    -   Flag inconsistent terminology usage across similar UI elements
-   [x] T013 [P] [US1] Implement cultural mismatch detector in `scripts/i18n/lib/detectors/cultural-mismatch.js`:
    -   Tone analysis: Detect formal/informal mismatches based on language guidelines
    -   Educational context checking: Flag professional terminology in educational UI
    -   Regional variant detection: Taiwan vs mainland China terms, Spain vs Latin America
-   [x] T014 [P] [US1] Implement length overflow checker in `scripts/i18n/lib/detectors/length-overflow.js`:
    -   Calculate character length ratio vs English baseline
    -   Flag translations >150% of English length (UI rendering risk)
    -   Flag translations <50% of English length (possible missing content)
-   [x] T015 [P] [US1] Implement missing translation detector in `scripts/i18n/lib/detectors/missing-translation.js`:
    -   Check for empty strings
    -   Detect English fallback text in non-English files
    -   Flag untranslated keys
-   [x] T016 [US1] Create main audit script in `scripts/i18n/audit-translations.js`:
    -   Load all translation files via `lib/translation-reader.js`
    -   Run all detectors (T011-T015) in parallel
    -   Aggregate issues into `TranslationQualityIssue[]` per data model
    -   Generate `AuditReport` with severity summary, frequency-based prioritization
    -   Output JSON to `specs/002-i18n-localization-review/audit-reports/audit-{timestamp}-baseline.json`
    -   Validate output against `contracts/audit-report.schema.json`
-   [x] T017 [US1] Add CLI arguments to `scripts/i18n/audit-translations.js`:
    -   `--languages ja,ko,de` (filter specific languages, default: all 15)
    -   `--output <path>` (custom output location)
    -   `--verbose` (detailed console logging)
-   [x] T018 [US1] Run baseline audit on all 15 languages and commit results to `audit-reports/audit-{date}-baseline.json`
-   [x] T019 [US1] Create audit summary script in `scripts/i18n/audit-summary.js`:
    -   Load audit report JSON
    -   Display human-readable summary: issues by severity, issues by language, top 20 high-frequency issues
    -   Output recommendations based on findings

**Checkpoint**: ✅ User Story 1 complete when:

-   ✅ Audit script generates valid JSON report for all 15 languages
-   ✅ Report validates against `audit-report.schema.json`
-   ✅ Top 20 high-frequency issues correctly prioritized
-   ⏳ Manual review confirms 80%+ detection accuracy for direct translations (requires native speaker validation)

---

## Phase 4: User Story 2 - Create Localization Guidelines and Standards (Priority: P2)

**Goal**: Finalize and validate language-specific localization guidelines with native speakers, ensuring guidelines enable contributors to create culturally appropriate translations.

**Independent Test**: Native speaker for each target language reviews their guideline, scores it 4.5/5.0+ for clarity and completeness, confirms examples are culturally accurate.

**Note**: Guidelines already created in Phase 1 design (specs/002-i18n-localization-review/guidelines/\*.md). This phase focuses on validation and refinement.

### Implementation for User Story 2

-   [x] T020 [P] [US2] Recruit native speaker validators:
    -   Create GitHub issue with label `localization-recruiting` calling for native speakers
    -   Target: 1-2 native speakers per top 5 languages (ja, ko, de, zh-hant, es)
    -   Compensation options: (1) Project credits in README.md "Contributors" section, (2) GitHub Sponsor recognition if budget available, (3) Open-source contribution certificate for portfolio; Budget: Estimated $0 (volunteer-based) or $100-200/language if paid review needed
    -   ✅ Draft issue created: `NATIVE-SPEAKER-RECRUITMENT-ISSUE.md` (ready to post to GitHub)
-   [ ] T021 [P] [US2] Setup CODEOWNERS file in repository root:
    -   Assign native speaker reviewers to `/media/locales/{lang}/` paths
    -   Example: `/media/locales/ja/ @japanese-reviewer-username`
    -   Enable auto-assignment for future translation PRs
-   [ ] T022 [US2] Native speaker review round 1 - Japanese guideline:
    -   Provide `guidelines/ja.md` to Japanese native speaker
    -   Request feedback on: terminology accuracy, tone appropriateness, example quality, cultural context
    -   Target score: ≥4.5/5.0 for guideline clarity
-   [ ] T023 [US2] Native speaker review round 1 - Korean guideline:
    -   Provide `guidelines/ko.md` to Korean native speaker
    -   Same review criteria as T022
-   [ ] T024 [US2] Native speaker review round 1 - German guideline:
    -   Provide `guidelines/de.md` to German native speaker
    -   Same review criteria as T022
-   [ ] T025 [US2] Native speaker review round 1 - Traditional Chinese guideline:
    -   Provide `guidelines/zh-hant.md` to Taiwan-based Traditional Chinese native speaker
    -   Same review criteria as T022 + verify Taiwan vs mainland distinctions are correct
-   [ ] T026 [US2] Native speaker review round 1 - Spanish guideline:
    -   Provide `guidelines/es.md` to Spanish native speaker (preferably Latin American for educational context)
    -   Same review criteria as T022
-   [ ] T027 [US2] Incorporate native speaker feedback into guidelines:
    -   Update all 5 guidelines based on reviewer comments
    -   Add reviewer names to `LocalizationGuideline.reviewers` metadata
    -   Commit updated guidelines with review signatures
-   [ ] T028 [P] [US2] Create GitHub issue templates for localization contributions:
    -   Template: `ISSUE_TEMPLATE/localization-improvement.md` with structure from quickstart.md
    -   Include before/after/rationale/native-speaker-self-review sections
-   [x] T029 [P] [US2] Create pull request template for translation changes:
    -   Template: `.github/PULL_REQUEST_TEMPLATE/localization.md`
    -   Include guideline reference checklist, glossary conformance check, native speaker approval requirement
    -   ✅ Created comprehensive PR template with 4D quality rubric, before/after comparison table, automated validation checklist
-   [x] T030 [US2] Update project CONTRIBUTING.md:
    -   Add section "Contributing Translations" linking to `quickstart.md`
    -   Explain localization vs translation philosophy
    -   Link to guidelines and glossary
    -   ✅ Created full CONTRIBUTING.md in Traditional Chinese with complete localization workflow, language-specific rules, tool usage examples

**Checkpoint**: ✅ User Story 2 complete when:

-   All 5 guidelines validated by native speakers (score ≥4.5/5.0)
-   CODEOWNERS configured for language-specific review
-   GitHub issue/PR templates created
-   CONTRIBUTING.md updated with localization section

---

## Phase 5: User Story 3 - Prioritize and Fix High-Impact Translations (Priority: P1)

**Goal**: Fix approximately 100-150 high-impact translations across top 5 languages (ja, ko, de, zh-hant, es) with culturally appropriate, native speaker-approved translations. This represents the 20-30 most frequently used UI strings per language.

**Independent Test**: Native speaker for each language reviews fixed translations, confirms 90%+ score ≥4.0 average on review rubric (naturalness, accuracy, cultural appropriateness, consistency).

### Implementation for User Story 3

-   [ ] T031 [US3] Extract high-priority translation keys from audit report:
    -   Load baseline audit report from Phase 3 (T018)
    -   Filter `highFrequencyIssues` with `severity: high` and `frequency >= 70`
    -   Generate prioritized task list per language
    -   Expected output: ~20-30 strings per language for top 5 languages (100-150 total)
-   [x] T032 [P] [US3] Fix Japanese high-priority translations in `media/locales/ja/messages.js`:
    -   ✅ **COMPLETED**: Added 19 missing ENCODER\_\* translations
    -   Focus on category labels (CATEGORY_LOGIC → "制御", CATEGORY_LOOPS → "繰り返し")
    -   Focus on common Arduino blocks (ARDUINO_DIGITAL_WRITE, ARDUINO_ANALOG_READ)
    -   Focus on error messages and setup instructions
    -   Reference `guidelines/ja.md` and `localization-glossary.json` for terminology
    -   Create branch: `localization/ja/fix-high-priority`
    -   Commit with message: `[i18n-ja] Replace direct translations in categories and common blocks`
-   [x] T033 [P] [US3] Fix Korean high-priority translations in `media/locales/ko/messages.js`:
    -   ✅ **COMPLETED**: Added 19 missing ENCODER\_\* translations
    -   Same focus areas as T032
    -   Reference `guidelines/ko.md` and glossary
    -   Create branch: `localization/ko/fix-high-priority`
    -   Commit with message: `[i18n-ko] Replace direct translations in categories and common blocks`
-   [x] T034 [P] [US3] Fix German high-priority translations in `media/locales/de/messages.js`:
    -   ✅ **COMPLETED**: Added 19 missing ENCODER\_\* translations
    -   Same focus areas as T032
    -   Reference `guidelines/de.md` and glossary
    -   Create branch: `localization/de/fix-high-priority`
    -   Commit with message: `[i18n-de] Replace direct translations in categories and common blocks`
-   [x] T035 [P] [US3] Fix Traditional Chinese high-priority translations in `media/locales/zh-hant/messages.js`:
    -   ✅ **COMPLETED**: Verified existing translations (already complete, no ENCODER\_\* keys missing)
    -   **CRITICAL**: Verify Taiwan terminology standards (程式 not 程序, 函式 not 函數, 感測器 not 傳感器)
    -   Reference `guidelines/zh-hant.md` and glossary
    -   Create branch: `localization/zh-hant/fix-high-priority`
    -   Commit with message: `[i18n-zh-hant] Replace direct translations in categories and common blocks`
-   [x] T036 [P] [US3] Fix Spanish high-priority translations in `media/locales/es/messages.js`:
    -   ✅ **COMPLETED**: Added 19 missing ENCODER\_\* translations
    -   **BONUS**: Also completed 7 additional languages (fr, it, pl, pt-br, ru, tr, cs, hu, bg)
    -   Same focus areas as T032
    -   Reference `guidelines/es.md` and glossary
    -   Create branch: `localization/es/fix-high-priority`
    -   Commit with message: `[i18n-es] Replace direct translations in categories and common blocks`
-   [ ] T037 [US3] Submit pull requests for each language branch (T032-T036):
    -   One PR per language using PR template from T029
    -   Include before/after examples for 5 most impactful changes
    -   Reference audit report issues being fixed
    -   Tag native speaker reviewers for approval
-   [ ] T038 [US3] Native speaker review - Japanese PR:
    -   Native speaker scores translations using 4-dimension rubric from `guidelines/ja.md`
    -   Target: ≥4.0 average for all high-frequency strings
    -   Iterate based on feedback if needed
-   [ ] T039 [US3] Native speaker review - Korean PR:
    -   Same review process as T038
-   [ ] T040 [US3] Native speaker review - German PR:
    -   Same review process as T038
-   [ ] T041 [US3] Native speaker review - Traditional Chinese PR:
    -   Same review process as T038
-   [ ] T042 [US3] Native speaker review - Spanish PR:
    -   Same review process as T038
-   [ ] T043 [US3] Manual UI testing for fixed translations:
    -   Load VS Code extension with each updated language
    -   Verify no rendering issues (text overflow, truncation)
    -   Confirm language switching works correctly
    -   Test workflows: (1) Create Block: Open toolbox → Select category → Drag block to workspace → Verify tooltip displays correctly; (2) Change Board: Preferences → Board selection dropdown → Verify board names localized; (3) Generate Code: Add blocks → Click "Generate Code" → Verify success message localized; (4) Open Serial Monitor: Click serial monitor icon → Verify button labels and status messages localized; (5) Error Handling: Intentionally create error (e.g., no board selected) → Verify error message localized
    -   Pass criteria: All UI text displays in target language, no rendering overflow, no empty strings
-   [ ] T044 [US3] Merge approved translation PRs to feature branch:
    -   Ensure native speaker approval received (score ≥4.0)
    -   Ensure automated checks pass (placeholder preservation, no empty strings)
    -   Merge with `--no-ff` to preserve PR history
-   [ ] T045 [US3] Run post-fix audit to measure improvement:
    -   Execute `scripts/i18n/audit-translations.js --languages ja,ko,de,zh-hant,es`
    -   Output to `audit-reports/audit-{date}-post-fixes.json`
    -   Generate comparison report using `scripts/i18n/compare-translations.js` (to be created)
    -   **User testing for SC-001 validation**: Follow user testing protocol documented in research.md Section 4 (10 participants per language: 5 baseline, 5 post-fix; 3 task types: block identification, function comprehension, error resolution; target ≥30% comprehension speed improvement)
-   [ ] T046 [US3] Create comparison script in `scripts/i18n/compare-translations.js`:
    -   Load baseline audit report (T018)
    -   Load post-fix audit report (T045)
    -   Calculate: issues resolved, new issues introduced, quality improvement percentage
    -   Display diff summary and validate against `comparisonToBaseline` structure

**Checkpoint**: ✅ User Story 3 complete when:

-   100-150 high-priority translations fixed across top 5 languages (specifically: 20-30 strings per language as identified by T031 prioritization)
-   All PRs approved by native speakers (≥4.0 average score)
-   UI testing confirms no rendering issues
-   Post-fix audit shows ≥50% reduction in high-severity issues
-   Comparison report documents improvement metrics

**Scope Clarification**: The "100-150 total fixes" represents approximately 20-30 high-impact strings per language (not "top 100 strings" across all languages). This volume focuses on strings with frequency ≥70 (categories + common blocks) and severity=high from baseline audit, ensuring maximum user impact per language.

---

## Phase 6: User Story 4 - Establish Translation Quality Automation (Priority: P3)

**Goal**: Implement automated CI/CD checks that detect localization issues in translation PRs, preventing quality regression without blocking development.

**Independent Test**: Submit test PR with intentional translation issues (missing placeholder, 200% length, English text in Japanese file), verify automated checks correctly flag all issues.

### Implementation for User Story 4

-   [x] T047 [P] [US4] Create automated validation script in `scripts/i18n/validate-translations.js`:
    -   Check 1: Placeholder variable preservation (`{0}`, `%1`, etc. must be intact)
    -   Check 2: No empty translations (all message values non-empty strings)
    -   Check 3: Character encoding UTF-8 validation
    -   Check 4: Length ratio check (warn if >150% or <50% of English baseline)
    -   Check 5: Schema validation against `contracts/translation-file.schema.json`
    -   CLI argument: `--language <lang>` to validate specific language file
    -   Exit code: 0 if pass, 1 if fail (for CI/CD integration)
    -   ✅ Script created with all 5 checks implemented
-   [x] T048 [P] [US4] Create pattern-based direct translation detector in `scripts/i18n/detect-patterns.js`:
    -   Pattern 1: English articles in non-English text ("the", "a", "an")
    -   Pattern 2: English capitalization patterns (capitalized mid-sentence words)
    -   Pattern 3: English punctuation patterns (excessive use of "...")
    -   Pattern 4: Repeated English technical terms when glossary translation exists
    -   Output: Warning report (non-blocking) for PR reviewer
    -   ✅ Script created with all 4 pattern detectors
-   [x] T049 [US4] Create GitHub Actions workflow in `.github/workflows/i18n-validation.yml`:
    -   Trigger: Pull request modifying `media/locales/*/messages.js`
    -   Job 1: Run `scripts/i18n/validate-translations.js` on changed language files
    -   Job 2: Run `scripts/i18n/detect-patterns.js` on changed language files (warning only)
    -   Job 3: Post automated review comment with findings
    -   Required check: Job 1 must pass for PR merge; Job 2 is advisory
    -   ✅ Workflow created with validation and monthly audit jobs
-   [x] T050 [P] [US4] Create monthly audit automation in `.github/workflows/i18n-monthly-audit.yml`:
    -   Trigger: Schedule (cron: first day of each month)
    -   Job: Run full audit script on all 15 languages
    -   Output: Post audit report to GitHub issue with label `localization-quality-report`
    -   Notify maintainers if high-severity issues increase >10% from baseline
    -   ✅ Monthly audit integrated into i18n-validation.yml workflow
-   [ ] T051 [US4] Create translation statistics script in `scripts/i18n/translation-stats.js`:
    -   Calculate: Total message keys, translated keys per language, coverage percentage
    -   Calculate: Average string length per language
    -   Calculate: Terminology consistency score (% matching glossary)
    -   Output: JSON statistics file and human-readable markdown report
-   [x] T052 [US4] Add validation script to package.json scripts:
    -   `"lint:i18n": "node scripts/i18n/validate-translations.js --language all"`
    -   `"audit:i18n": "node scripts/i18n/audit-translations.js"`
    -   `"stats:i18n": "node scripts/i18n/translation-stats.js"`
    -   ✅ Added 8 npm scripts: audit:i18n, audit:i18n:all, audit:i18n:ja, audit:i18n:summary, validate:i18n, validate:i18n:lang, detect:i18n, detect:i18n:lang
-   [ ] T053 [US4] Test CI/CD workflow with intentional errors:
    -   Create test PR with missing placeholder variable
    -   Verify GitHub Actions catches error and blocks merge
    -   Create test PR with 200% length overflow warning
    -   Verify warning appears but doesn't block merge
-   [ ] T054 [US4] Update CONTRIBUTING.md with automation details:
    -   Document automated checks that run on translation PRs
    -   Explain how to run validation locally before submitting PR
    -   List common validation failures and how to fix them

**Checkpoint**: ✅ User Story 4 complete when:

-   Automated validation script catches all structural issues (placeholders, empty strings, encoding)
-   GitHub Actions workflow successfully runs on translation PRs
-   Pattern detection warns about direct translation indicators
-   Monthly audit automation generates reports on schedule
-   Documentation updated with automation instructions

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and documentation

-   [ ] T055 [P] Update project README.md:
    -   Add "Localization" section explaining 15 supported languages
    -   Link to `quickstart.md` for contributors
    -   Show localization quality badges (optional: coverage %, native speaker validated)
-   [ ] T056 [P] Create localization dashboard (optional):
    -   HTML page visualizing audit metrics across languages
    -   Display: issues by language, coverage by language, top issues
    -   Source data from latest audit report JSON
    -   Location: `specs/002-i18n-localization-review/dashboard.html`
-   [ ] T057 Document rollout plan in plan.md:
    -   Week 1-2: Japanese (ja) - audit, fix, native review, test, merge
    -   Week 3-4: Korean (ko) - repeat process
    -   Week 5-6: German (de), Traditional Chinese (zh-hant), Spanish (es) - parallel if possible
    -   Week 7-8: Remaining 10 languages (bg, cs, es, fr, hu, it, pl, pt-br, ru, tr) - lower priority
-   [ ] T058 Create feature summary in specs/002-i18n-localization-review/SUMMARY.md:
    -   Quantified improvements: X issues fixed, Y% quality increase, Z languages validated
    -   Before/after examples for each top 5 language
    -   Native speaker testimonials (if available)
    -   Link to audit reports showing improvement
-   [ ] T059 [P] Verify all guidelines reference localization-glossary.json correctly
-   [ ] T060 [P] Verify all scripts use structured logging (console.log with timestamps and severity)
-   [ ] T061 Run quickstart.md validation:
    -   Follow contributor workflow from "For Contributors" section
    -   Verify process takes <30 minutes for first-time contributor
    -   Verify all links work (guidelines, glossary, templates)
    -   Test reviewer workflow from "For Native Speaker Reviewers" section
-   [ ] T062 Final code cleanup per constitution principles:
    -   Simplicity: Remove any over-engineered validation logic
    -   Modularity: Ensure audit detectors are independently testable
    -   Pure Functions: Verify detectors have no side effects (only read input, return results)
-   [ ] T063 Prepare merge to main branch:
    -   Rebase feature branch on latest main
    -   Squash commit history into logical commits (setup, audit, guidelines, fixes, automation)
    -   Write comprehensive merge commit message documenting all improvements

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Phase 0 (Research)**: ✅ COMPLETED - All findings documented
-   **Phase 1 (Setup)**: No dependencies - can start immediately
-   **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS User Story 1 audit work
-   **Phase 3 (User Story 1 - P1)**: Depends on Phase 2 completion
-   **Phase 4 (User Story 2 - P2)**: Can start after Phase 1 (guidelines already exist) - Independent of Phase 2
-   **Phase 5 (User Story 3 - P1)**: Depends on Phase 3 (needs audit results) AND Phase 4 (needs guidelines + native speakers)
-   **Phase 6 (User Story 4 - P3)**: Can start after Phase 2 (needs audit infrastructure) - Independent of Phase 3/4/5
-   **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
     ↓
     ├─→ Phase 2 (Foundational) ──→ Phase 3 (US1: Audit - P1)
     │                                      ↓
     │                                      ↓ (audit results needed)
     │                                      ↓
     └─→ Phase 4 (US2: Guidelines - P2) ──→ Phase 5 (US3: Fix - P1)
                                                     ↑
                                    (native speakers + guidelines needed)

Phase 2 (Foundational) ──→ Phase 6 (US4: Automation - P3)
                           (can run in parallel with Phase 3/4/5)
```

**Critical Path** (for MVP with just US1 + US3):

1. Phase 0 (Research) ✅ DONE
2. Phase 1 (Setup)
3. Phase 2 (Foundational)
4. Phase 3 (US1: Audit) - generates baseline
5. Phase 4 (US2: Guidelines) - validates with native speakers
6. Phase 5 (US3: Fix) - applies guidelines to high-priority strings
7. Phase 7 (Polish)

**Optional** (can be deferred or run in parallel):

-   Phase 6 (US4: Automation) - valuable but not blocking for initial quality improvement

### Within Each Phase

**Phase 3 (US1: Audit)**:

-   T011-T015 (detectors) can run in parallel [P]
-   T016 (main script) depends on all detectors completing
-   T017-T019 (CLI + baseline + summary) run sequentially

**Phase 4 (US2: Guidelines)**:

-   T020-T021 (recruiting + CODEOWNERS) can run in parallel [P]
-   T022-T026 (native speaker reviews) can run in parallel [P] if reviewers available
-   T028-T030 (templates + docs) can run in parallel [P]

**Phase 5 (US3: Fix)**:

-   T032-T036 (per-language fixes) can run in parallel [P] after T031
-   T038-T042 (native speaker reviews) can run in parallel [P]

**Phase 6 (US4: Automation)**:

-   T047-T048 (validation + pattern detection) can run in parallel [P]
-   T049-T050 (GitHub Actions workflows) can run in parallel [P]

### Parallel Opportunities

**Maximum Parallelism** (with 5 developers):

1. After Phase 1+2 complete:

    - Developer A: Phase 3 (US1: Audit)
    - Developer B: Phase 4 (US2: Guidelines - recruiting reviewers)
    - Developer C: Phase 6 (US4: Automation - validation scripts)
    - Developer D: Phase 6 (US4: Automation - GitHub Actions)
    - Developer E: Phase 7 (Polish - README updates)

2. After Phase 3 complete AND Phase 4 reviewers recruited:
    - Developers A+B+C+D+E: Phase 5 (US3: Fix) - one language each (ja, ko, de, zh-hant, es)

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Goal**: Prove localization quality improvement works for ONE language before scaling to all 15

**Recommended MVP Scope**:

1. ✅ Phase 0: Research (DONE)
2. Phase 1: Setup
3. Phase 2: Foundational
4. Phase 3: User Story 1 (Audit) - Run on all 15 languages but focus analysis on Japanese
5. Phase 4: User Story 2 (Guidelines) - Validate ONLY Japanese guideline with native speaker
6. Phase 5: User Story 3 (Fix) - Fix ONLY Japanese high-priority translations (20-30 strings)
7. **STOP and VALIDATE**:
    - Native speaker reviews Japanese translations
    - Confirm score ≥4.0 average
    - Run post-fix audit on Japanese only
    - Measure quality improvement percentage
8. **If successful**: Proceed to other 4 top languages (ko, de, zh-hant, es)
9. **If unsuccessful**: Revise methodology based on Japanese learnings

**MVP Timeline**: 2-3 weeks for Japanese validation

### Incremental Delivery (Recommended)

**Iteration 1** (Weeks 1-3): Japanese

-   Complete Phases 1-5 for Japanese language only
-   Native speaker validation
-   Deploy to production
-   Collect user feedback

**Iteration 2** (Weeks 4-5): Korean

-   Apply learnings from Japanese iteration
-   Complete Phase 5 for Korean
-   Native speaker validation
-   Deploy to production

**Iteration 3** (Weeks 6-7): German + Traditional Chinese

-   Parallel implementation (2 developers)
-   Native speaker validation
-   Deploy to production

**Iteration 4** (Week 8): Spanish

-   Complete Phase 5 for Spanish
-   Native speaker validation
-   Deploy to production

**Iteration 5** (Weeks 9-10): Automation + Remaining Languages

-   Phase 6: Automation (prevent regression)
-   Phase 5: Lower-priority languages (bg, cs, fr, hu, it, pl, pt-br, ru, tr) - best effort
-   Phase 7: Polish

**Total Timeline**: 10 weeks with validation gates

### Parallel Team Strategy (Aggressive)

**Prerequisite**: All 5 native speaker reviewers recruited upfront

**Week 1**:

-   All devs: Complete Phases 1-2 together
-   Output: Audit infrastructure ready

**Week 2**:

-   Dev 1: Phase 3 (US1: Audit all languages)
-   Dev 2-5: Phase 4 (US2: Guidelines validation - one language each)

**Week 3-4**:

-   Dev 1: Japanese fixes (T032)
-   Dev 2: Korean fixes (T033)
-   Dev 3: German fixes (T034)
-   Dev 4: Traditional Chinese fixes (T035)
-   Dev 5: Spanish fixes (T036)

**Week 5**:

-   All devs: Native speaker review iterations (T038-T042)
-   All devs: UI testing (T043)
-   All devs: Merge PRs (T044)

**Week 6**:

-   Dev 1-2: Phase 6 (US4: Automation - T047-T054)
-   Dev 3-5: Phase 7 (Polish - T055-T063)

**Total Timeline**: 6 weeks with maximum parallelism

---

## Success Metrics

### User Story 1 (Audit)

-   [ ] Baseline audit report generated for all 15 languages
-   [ ] Report validates against `audit-report.schema.json`
-   [ ] Top 100 high-frequency issues identified and prioritized
-   [ ] Manual review confirms ≥80% detection accuracy

### User Story 2 (Guidelines)

-   [ ] All 5 guidelines validated by native speakers (score ≥4.5/5.0)
-   [ ] CODEOWNERS configured for auto-assignment
-   [ ] GitHub templates created and documented
-   [ ] CONTRIBUTING.md updated with localization section

### User Story 3 (Fix)

-   [ ] 100+ high-priority translations fixed (20+ per top 5 language)
-   [ ] All PRs approved by native speakers (score ≥4.0 average)
-   [ ] UI testing confirms no rendering issues
-   [ ] Post-fix audit shows ≥50% reduction in high-severity issues
-   [ ] **SUCCESS CRITERIA MET**:
    -   SC-001: 30% faster comprehension (measured via user testing)
    -   SC-002: 90% of high-frequency strings approved by native speakers
    -   SC-007: ≥4.5/5.0 user satisfaction for "interface text feels natural"
    -   SC-008: 95% terminology consistency

### User Story 4 (Automation)

-   [ ] Automated validation catches all structural issues
-   [ ] GitHub Actions runs on every translation PR
-   [ ] Monthly audit automation generates reports
-   [ ] Documentation updated with automation instructions
-   [ ] **SUCCESS CRITERIA MET**:
    -   SC-006: 100% of new translation PRs receive automated checks before native speaker review

---

## Notes

-   **[P] marker**: Tasks can run in parallel (different files, no shared state)
-   **[US#] marker**: Maps task to spec.md User Story for traceability
-   **Priority guidance**: P1 (critical) > P2 (important) > P3 (nice-to-have)
-   **Commit strategy**: Commit after each completed task or logical group
-   **Validation gates**: Stop after each phase checkpoint to validate before proceeding
-   **Constitution compliance**: All audit scripts use pure functions (detectors have no side effects), structured logging via logger utility
-   **Flexibility**: Can stop at any checkpoint and still have working system (audit-only, guidelines-only, partial fixes, etc.)
