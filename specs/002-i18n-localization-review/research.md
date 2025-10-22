# Research: Internationalization Localization Quality Review

**Feature**: 002-i18n-localization-review  
**Date**: 2025-10-17  
**Purpose**: Resolve technical unknowns and establish best practices for localization quality improvement

## Research Questions & Decisions

### 1. Translation Quality Assessment Methodology

**Question**: What are industry-standard methods for identifying direct translations versus culturally localized content?

**Decision**: Use multi-criteria assessment framework combining:

-   Linguistic naturalness scoring (native speaker panel review)
-   Educational terminology alignment (comparison with local curriculum standards)
-   Pattern detection (identifying English grammatical structures in non-English text)
-   Frequency-based prioritization (focus on high-impact UI elements first)

**Rationale**:

-   Web research shows that cultural adaptation goes beyond translation, requiring holistic UX modification
-   Software localization best practices emphasize user-centric validation over automated translation alone
-   Educational context requires domain-specific terminology validation by subject matter experts

**Alternatives Considered**:

-   Automated machine translation scoring (rejected: cannot assess cultural appropriateness)
-   Professional translator-only review (rejected: lacks end-user perspective on educational context)
-   Comprehensive review of all strings (rejected: resource-intensive, violates "Avoid Over-Development" principle)

**Implementation Approach**:

1. Create standardized rubric for each target language based on:
    - Common direct translation patterns (e.g., English word order preserved)
    - Technical term handling (borrowed vs localized)
    - Educational terminology standards (research local curriculum documents)
    - Tone appropriateness (formal vs informal based on culture)
2. Recruit native speaker validators for top 5 languages (Japanese, Korean, German, Traditional Chinese, Spanish)
3. Prioritize by UI element frequency (toolbox categories > common blocks > tooltips > advanced features)

**Reference Resources**:

-   Software Localization Best Practices (resolution.de): Cultural adaptation requires in-market user research and local expert partnerships
-   VS Code i18n ecosystem: Multiple extensions (i18n Ally, localise.i18n) provide translation management workflows we can adapt

---

### 2. Educational Programming Terminology Standards

**Question**: How do different language regions standardize programming and hardware terminology in educational contexts?

**Decision**: Research and document regional educational standards for top 5 target languages, establishing terminology baselines per region.

**Rationale**:

-   Programming education terminology varies significantly by region (e.g., Japanese "制御" for control flow vs direct translation "コントロールフロー")
-   Educational context differs from professional software development terminology
-   Taiwan's maker education curriculum uses specific phrasing styles that differ from mainland China
-   Korean computer science education has standardized terminology that should be followed for consistency

**Alternatives Considered**:

-   Use professional software localization standards (rejected: doesn't match educational context)
-   Allow translators to choose terminology freely (rejected: creates inconsistency across similar projects)
-   Adopt Google Blockly's official translations as-is (rejected: may not be culturally optimized for education)

**Implementation Approach**:

1. **Japan**: Research MEXT (Ministry of Education) programming curriculum terminology
    - Expected findings: Established Katakana vs Kanji conventions for technical terms
    - Educational vs professional terminology differences
2. **Korea**: Review Ministry of Education computer science standards
    - Expected findings: Hangeul-based terminology vs English loanwords patterns
3. **Germany**: Review state-level informatics curriculum terminology
    - Expected findings: German compound word conventions for technical concepts
4. **Traditional Chinese (Taiwan)**: Review 12-year Basic Education curriculum
    - Expected findings: Simplified vs traditional character preferences, Taiwan-specific phrasing
5. **Spanish**: Review terminology from major education markets (Spain, Mexico, Latin America)
    - Expected findings: Regional variations (Spain vs Latin America), formal education conventions

**Documentation Output**: Create language-specific terminology reference guides under `/docs/localization/` directory

---

### 3. Translation Memory and Consistency Tools

**Question**: What tools and workflows should be used to maintain translation consistency across 15 languages without complex infrastructure?

**Decision**: Use lightweight, file-based Translation Memory approach compatible with Git workflow, avoiding heavy TMS (Translation Management System) infrastructure.

**Rationale**:

-   Singular Blockly follows "Simplicity" and "Avoid Over-Development" principles
-   Current structure uses JavaScript message files (`window.languageManager.loadMessages()`) which are Git-trackable
-   VS Code extension ecosystem provides sufficient tooling (i18n Ally) for simple TM management
-   Manual native speaker review is more valuable than automated TM for quality in this context

**Alternatives Considered**:

-   Full TMS solution (Crowdin, Lokalise) (rejected: over-engineering for project scale, vendor lock-in)
-   Automated Translation Memory database (rejected: adds complexity, requires separate infrastructure)
-   No consistency tracking (rejected: fails to meet FR-005 "preserve technical terminology consistency")

**Implementation Approach**:

1. **Terminology Glossary**: Create `localization-glossary.json` with key technical terms and approved translations per language
    ```json
    {
    	"servo_motor": {
    		"en": "Servo Motor",
    		"ja": "サーボモーター",
    		"ko": "서보 모터",
    		"de": "Servomotor",
    		"zh-hant": "伺服馬達",
    		"es": "Servomotor"
    	}
    }
    ```
2. **Style Guides**: Create language-specific markdown docs documenting:
    - Formal vs informal tone decisions
    - Technical term handling rules (borrow vs translate)
    - Common pitfalls and anti-patterns
3. **Manual Review Process**:
    - Use GitHub PR reviews with language-tagged reviewers
    - Reference glossary in PR template
    - Compare new translations against existing patterns manually

**Tools**:

-   VS Code extension: `i18n Ally` for in-editor translation management
-   Git diffs for change tracking
-   GitHub CODEOWNERS for language-specific reviewer assignment

---

### 4. Quality Metrics and Validation Process

**Question**: How should translation quality be measured objectively to track improvement toward success criteria?

**Decision**: Implement multi-layered validation combining automated checks, native speaker scoring, and user testing metrics.

**Rationale**:

-   Success criteria SC-001 requires "30% faster comprehension" - needs actual user testing
-   SC-002 requires "90% approved by native speakers" - needs scoring rubric
-   SC-008 requires "95% terminology consistency" - can be partially automated
-   Web research emphasizes both linguistic testing AND end-user UAT (User Acceptance Testing)

**Measurement Framework**:

**Layer 1: Automated Checks (Structural Quality)**

-   Placeholder preservation: Verify `{0}`, `%1` variables intact
-   String length comparison: Flag translations >150% or <50% of English length
-   Character encoding: Verify UTF-8 special characters render correctly
-   Duplicate key detection: Ensure no missing translations

**Layer 2: Native Speaker Review (Linguistic Quality)**

-   Scoring rubric (1-5 scale) per string:
    -   Natural phrasing (feels like native language, not translation)
    -   Technical accuracy (terms match educational standards)
    -   Cultural appropriateness (tone, examples, metaphors suitable)
    -   Consistency (matches glossary and similar UI patterns)
-   Aggregate score per language/category
-   Target: ≥4.0 average for high-frequency strings

**Layer 3: User Testing (Usability Quality)**

-   Task completion time (compare localized vs English-speaking users on same tasks)
-   Comprehension tests (identify block function from description alone)
-   User satisfaction survey (5-point Likert scale: "interface text feels natural in my language")
-   Target: Meet SC-001 (30% faster) and SC-007 (≥4.5/5.0 satisfaction)

**Implementation Approach**:

1. Create automated check scripts (Node.js) that run on PR submission
2. Develop native speaker review template with rubric
3. Design user testing protocol (remote testing via video calls or online tools)
4. Track metrics in spreadsheet or simple database

**Reference**: Software localization best practices emphasize standardized testing checklists covering linguistic accuracy, UI/UX consistency, functional requirements, and cultural appropriateness.

---

### 5. Localization Workflow Integration

**Question**: How should localization review and updates integrate with existing development workflow without blocking feature development?

**Decision**: Use parallel workflow with language-specific feature branches and phased rollout approach.

**Rationale**:

-   Avoid blocking feature development on translation completion
-   Allow incremental improvement per language (modularity principle)
-   Enable independent testing and validation per locale
-   Support priority-based rollout (P1 languages first)

**Workflow Design**:

**Phase Approach** (aligned with User Stories priorities):

1. **Phase 1 (P1)**: Audit all 15 languages, fix top 5 priority languages' high-frequency strings
2. **Phase 2 (P2)**: Create guidelines, apply to remaining 10 languages
3. **Phase 3 (P3)**: Implement automated quality checks for ongoing maintenance

**Branch Strategy**:

-   Main localization work in feature branch `002-i18n-localization-review`
-   Per-language sub-branches for parallel work: `002-i18n-localization-review/ja`, `/ko`, `/de`, etc.
-   Merge to main branch only after native speaker approval

**CI/CD Integration** (Updated per Clarifications Session 2025-10-22):

-   **Automated Audit Checks**: Run `audit-translations.js` on all translation file changes
-   **Failure Handling (Q1-B)**: Whitelist violations trigger CI warning but allow merge (non-blocking)
    -   Rationale: Balance code quality with development velocity; prevents false positives from blocking urgent fixes
    -   Action: Add GitHub Actions step that posts warning comment to PR but returns exit code 0
-   **PR Review Requirements (Q2-Yes)**: All translation PRs require human code review approval
    -   Reviewers verify: (1) whitelist additions have valid rationale, (2) new violations follow documented patterns
    -   Does NOT require native speaker review (too resource-intensive for volunteers)
-   **Audit Report Retention (Q3-Yes)**: Store audit reports in Git for 6-month retention period
    -   Location: `specs/002-i18n-localization-review/audit-reports/YYYY-MM-DD.json`
    -   Purpose: Track violation trends, inform rule governance decisions
    -   Cleanup: Automated job removes reports older than 6 months
-   **Rule Health Monitoring (Q5-B)**: Track whitelist effectiveness via audit statistics
    -   Monitor: Total violations, per-rule match count, false positive rate
    -   Action: Flag rules with <5 matches in 3 months for governance review
-   Feature flags control which languages show new translations (unchanged)

**Translation SLA**:

-   High-priority fixes (categories, common blocks): 2-week review cycle
-   Medium-priority (tooltips, messages): 4-week review cycle
-   Low-priority (advanced features): Best-effort basis

**Reference**: Web research shows agile-compatible localization workflows require collaborative teams, feature flags for untranslated content, and automated notifications to translation teams.

---

## Research Decision 4 Addendum: User Testing Protocol Specification

**Context**: Success Criteria SC-001 requires "30% faster comprehension" measured through user testing. This addendum provides the complete testing methodology.

### User Testing Protocol (for SC-001 Validation)

**Sample Size**: Minimum 10 native speakers per language (5 baseline group, 5 post-fix group)

**Participant Requirements**:

-   Native speaker fluency in target language
-   Basic Arduino/programming familiarity (beginner to intermediate level)
-   Age: 12-18 years (educational target demographic) OR educators teaching this age group
-   No prior exposure to Singular Blockly (to ensure unbiased first impressions)

**Test Environment**:

-   Remote testing via video call (Zoom/Meet) with screen recording
-   Test conductor speaks participant's native language or uses interpreter
-   VSCode extension pre-installed with assigned language setting
-   Standard test Arduino project provided (3-5 blocks, typical beginner workflow)

**Task Types** (3 comprehension dimensions):

1. **Block Identification Task** (Speed metric):

    - Instruction: "Find the block that controls a servo motor"
    - Measure: Time from instruction to correct block selection
    - Baseline vs Post-Fix comparison target: ≥30% time reduction

2. **Function Comprehension Task** (Accuracy metric):

    - Instruction: "Explain in your own words what this block does" (point to specific block)
    - Scoring: 0-5 scale (0=incorrect, 5=complete accurate explanation)
    - Baseline vs Post-Fix comparison target: ≥1.0 point improvement

3. **Error Resolution Task** (Speed + Accuracy metric):
    - Scenario: Intentional error in project (e.g., missing pin configuration)
    - Instruction: "Fix the error based on the error message"
    - Measure: Time to correct fix + correctness (binary: correct/incorrect)
    - Baseline vs Post-Fix comparison target: ≥30% time reduction + ≥20% accuracy improvement

**Baseline Measurement Protocol**:

-   Test 5 participants using CURRENT direct translations (before fixes)
-   Calculate average times and scores across 3 task types
-   Document baseline metrics per language

**Post-Fix Measurement Protocol**:

-   Test 5 NEW participants (not from baseline group) using IMPROVED localized translations
-   Calculate average times and scores across same 3 task types
-   Compare to baseline metrics

**Success Calculation**:

```
Comprehension Speed Improvement =
  (Baseline Avg Time - Post-Fix Avg Time) / Baseline Avg Time × 100%

Target: ≥30% improvement across all 3 tasks
```

**Data Collection**:

-   Screen recordings analyzed for task completion timestamps
-   Participant verbal explanations transcribed and scored by native speaker evaluator
-   Post-test survey: "How natural did the interface text feel?" (1-5 scale)

**Statistical Validation**:

-   Minimum 10 participants per language ensures reasonable sample size
-   T-test comparison between baseline and post-fix groups
-   Document confidence intervals and p-values in final report

**Cost Estimate**:

-   Per-language testing: ~$200-400 (participant compensation) or volunteer-based
-   Total for 5 languages: ~$1,000-2,000 or volunteer recruitment effort
-   Alternative: Partner with educational institutions for volunteer participants

**Implementation Reference**: Follow this protocol when executing task T045 (post-fix audit and user testing validation)

---

## Technology Stack Decisions

### Validation Tools

-   **Automated Checks**: Node.js scripts (leverage existing project stack)
-   **Manual Review**: GitHub PR workflow with language-specific CODEOWNERS
-   **User Testing**: Remote video call tools (Zoom, Google Meet) or survey platforms (Google Forms, Typeform)

### Documentation Format

-   **Terminology Glossaries**: JSON format (machine-readable, Git-trackable)
-   **Style Guides**: Markdown format (human-readable, easy to maintain)
-   **Review Rubrics**: Google Sheets or Excel (collaborative scoring)

### Monitoring & Metrics

-   **Quality Tracking**: Spreadsheet with per-language scores
-   **User Satisfaction**: Google Forms surveys embedded in application
-   **Issue Tracking**: GitHub Issues with language-specific labels

---

## Risk Mitigation

### Risk 1: Insufficient Native Speaker Availability

**Mitigation**:

-   Prioritize top 5 languages initially (phased approach)
-   Recruit from open-source community (GitHub contributors)
-   Partner with educational institutions in target regions

### Risk 2: Terminology Standards Not Well-Documented

**Mitigation**:

-   Research local curriculum documents and official educational standards
-   Consult with educators in target regions via online forums
-   Document decisions and rationale for future reference

### Risk 3: User Testing Participant Recruitment

**Mitigation**:

-   Leverage existing user base (if available)
-   Partner with educational maker spaces or coding clubs
-   Use remote testing to reduce geographic barriers

### Risk 4: Translation Quality Degradation Over Time

**Mitigation**:

-   Implement automated checks in CI/CD (P3 priority)
-   Establish CODEOWNERS for language-specific reviewers
-   Create clear contribution guidelines in localization docs

### Risk 5: Remaining Issues After Whitelist Exhaustion (Q4-B)

**Context**: Clarifications Session 2025-10-22 decision on handling violations that cannot be filtered

**Mitigation Strategy - Document and Accept**:

-   **Decision**: Accept remaining violations as known limitations after whitelist refinement
-   **Documentation Approach**:
    -   Create `specs/002-i18n-localization-review/KNOWN-ISSUES.md` listing:
        1. Each remaining violation pattern with example message keys
        2. Root cause analysis (e.g., "English word order required by Blockly API")
        3. Rationale for acceptance (e.g., "Low frequency string, minimal user impact")
    -   Include acceptance criteria: "Remaining violations affect <2% of strings (85/4262)"
-   **Communication Plan**:
    -   Update README localization section with link to KNOWN-ISSUES.md
    -   Add comment in audit-whitelist.json referencing documentation
    -   Include summary in Phase completion PR description
-   **Future Improvement Path**:
    -   Mark documented issues with "help wanted" label for volunteer contributions
    -   Track in GitHub Issues for visibility to community translators
    -   Revisit during major Blockly API upgrades (may unlock new solutions)

**Rationale**: Pragmatic approach balancing perfectionism vs delivery (Principle IV: Avoid Over-Development)

---

## Next Steps

1. ✅ **Research completed**: All technical unknowns resolved
2. **Proceed to Phase 1**: Generate data model and contracts
3. **Create localization documentation structure**:
    - `/docs/localization/` directory
    - Per-language terminology glossaries
    - Per-language style guides
4. **Recruit native speaker reviewers**: Open GitHub issue calling for volunteers
5. **Begin audit of existing translations**: Start with top 5 priority languages

---

## References

-   [Software Localization Best Practices](https://www.resolution.de/post/software-localization-best-practices/) - Cultural adaptation, quality assurance, terminology management
-   VS Code Extension Marketplace: i18n Ally, Crowdin, translation tools ecosystem
-   Industry standard: Translation Memory (TM) and terminology management systems
-   Agile localization workflows: Feature flags, automated notifications, CI/CD integration
