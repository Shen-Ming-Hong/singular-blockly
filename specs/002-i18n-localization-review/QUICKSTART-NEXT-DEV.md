# Quick Start Guide - Continue Implementation

**Last Updated**: October 17, 2025  
**Current Phase**: Phase 4 (User Story 2) - 10% complete  
**Branch**: `002-i18n-localization-review`

---

## 🚀 TL;DR - What's Done, What's Next

### ✅ Completed (Phases 1-3)

-   Automated audit system detecting 1,673 translation issues
-   5 detector modules (direct translation, terminology, cultural, length, missing)
-   Baseline audit report for ja, ko, de, zh-hant, es
-   Human-readable summary script

### 🎯 Immediate Next Actions

1. **Post recruitment issue to GitHub** (T020) - Use `NATIVE-SPEAKER-RECRUITMENT-ISSUE.md`
2. **Create PR template** (T029) - See template below
3. **Update CONTRIBUTING.md** (T030) - Add localization section
4. **Setup CODEOWNERS** (T021) - After validators recruited

---

## 📁 Key Files to Know

### Audit Scripts (You'll Use These)

```bash
# Run audit on specific languages
node scripts/i18n/audit-translations.js --languages=ja,ko

# View human-readable summary
node scripts/i18n/audit-summary.js specs/002-i18n-localization-review/audit-reports/audit-2025-10-17-baseline.json

# Validate translation file
node scripts/i18n/lib/translation-reader.js ja  # Test parser
```

### Documentation (Read These First)

1. **`tasks.md`** - Task breakdown with checkpoints (T001-T063)
2. **`PHASE-1-2-3-COMPLETION.md`** - Detailed implementation report
3. **`SESSION-SUMMARY.md`** - High-level session overview
4. **`plan.md`** - Original feature plan and requirements

### Data Files

-   **Baseline audit**: `audit-reports/audit-2025-10-17-baseline.json`
-   **Glossary**: `localization-glossary.json` (117 entries)
-   **Guidelines**: `guidelines/{lang}.md` (ja, ko, de, zh-hant, es)

---

## 🔧 Common Commands

### Audit Workflows

```bash
# Full audit (all 5 languages)
node scripts/i18n/audit-translations.js --languages=ja,ko,de,zh-hant,es

# Single language with verbose logging
node scripts/i18n/audit-translations.js --languages=ja --verbose

# Custom output path
node scripts/i18n/audit-translations.js --output=my-report.json

# View summary
node scripts/i18n/audit-summary.js <path-to-report.json>
```

### Testing

```bash
# Validate translation file parsing
node -e "const reader = require('./scripts/i18n/lib/translation-reader.js'); console.log(Object.keys(reader.loadMessagesFile('ja')).length);"

# Check specific language keys
node -e "const r = require('./scripts/i18n/lib/translation-reader.js'); const msgs = r.loadMessagesFile('ja'); console.log(msgs['CATEGORY_LOGIC']);"
```

### Schema Validation

```bash
# Validate audit report structure
node -e "const v = require('./scripts/i18n/lib/schema-validator.js'); v.validateAuditReport(require('./specs/002-i18n-localization-review/audit-reports/audit-2025-10-17-baseline.json'));"
```

---

## 📋 Next Task Templates

### T021: CODEOWNERS File

**File**: `.github/CODEOWNERS`

```
# Localization - Native Speaker Reviewers
# Assign this once you have validator GitHub usernames from T020

# Japanese translations
/media/locales/ja/ @japanese-validator-username

# Korean translations
/media/locales/ko/ @korean-validator-username

# German translations
/media/locales/de/ @german-validator-username

# Traditional Chinese translations
/media/locales/zh-hant/ @taiwanese-validator-username

# Spanish translations
/media/locales/es/ @spanish-validator-username

# Localization infrastructure
/specs/002-i18n-localization-review/guidelines/ @maintainer-username
/specs/002-i18n-localization-review/localization-glossary.json @maintainer-username
```

---

### T029: PR Template for Localization

**File**: `.github/PULL_REQUEST_TEMPLATE/localization.md`

```markdown
## 🌍 Localization Changes

**Language**: [ja / ko / de / zh-hant / es]  
**Fixes Issue**: #[issue-number]  
**Audit Report**: [Link to baseline audit section]

---

### Changes Summary

**Total Translations Modified**: [number]  
**High-Frequency Strings Fixed**: [number] (frequency ≥70)  
**Issue Types Addressed**:

-   [ ] Direct translations replaced
-   [ ] Cultural tone adjusted
-   [ ] Length overflow fixed
-   [ ] Missing translations added
-   [ ] Terminology aligned with glossary

---

### Before/After Examples

| Key              | Before            | After                      | Frequency | Impact                           |
| ---------------- | ----------------- | -------------------------- | --------- | -------------------------------- |
| `CATEGORY_LOGIC` | 論理              | 論理ブロック               | 95        | High - Always visible in toolbox |
| `CATEGORY_TEXT`  | テキスト          | 文字列                     | 95        | High - Common block category     |
| `ERROR_NO_BOARD` | No board selected | ボードが選択されていません | 50        | Medium - Error message           |

---

### Native Speaker Review Checklist

Please score each translation using this rubric (1-5 scale):

#### Dimension 1: Cultural Appropriateness

-   [ ] **5** - Perfect cultural fit, natural phrasing
-   [ ] **4** - Good fit, minor awkwardness
-   [ ] **3** - Adequate, some cultural mismatch
-   [ ] **2** - Poor fit, noticeable issues
-   [ ] **1** - Inappropriate, does not match culture

#### Dimension 2: Tone Match (Educational/Friendly)

-   [ ] **5** - Perfect tone for student audience
-   [ ] **4** - Good tone, minor formality issues
-   [ ] **3** - Adequate, tone somewhat off
-   [ ] **2** - Poor tone (too formal/informal)
-   [ ] **1** - Inappropriate tone

#### Dimension 3: Terminology Accuracy

-   [ ] **5** - All technical terms correct and consistent
-   [ ] **4** - Mostly correct, minor inconsistencies
-   [ ] **3** - Adequate, some incorrect terms
-   [ ] **2** - Poor terminology usage
-   [ ] **1** - Incorrect or confusing terms

#### Dimension 4: Clarity

-   [ ] **5** - Perfectly clear, no ambiguity
-   [ ] **4** - Clear, minor confusion possible
-   [ ] **3** - Adequate clarity, some ambiguity
-   [ ] **2** - Unclear in places
-   [ ] **1** - Confusing or misleading

**Average Score**: [Calculate average across 4 dimensions]  
**Target**: ≥4.0 for approval

---

### Reviewer Comments

[Native speaker feedback goes here]

---

### UI Testing Results

Tested workflows:

-   [ ] **Create Block**: Open toolbox → Select category → Drag block → Verify tooltip
-   [ ] **Change Board**: Preferences → Board dropdown → Verify localized names
-   [ ] **Generate Code**: Add blocks → Generate → Verify success message
-   [ ] **Error Handling**: No board selected → Verify error message

**Rendering Issues**:

-   [ ] No text overflow
-   [ ] No truncation
-   [ ] No empty strings
-   [ ] Language switching works

---

### Reference Documents

-   Guideline: `specs/002-i18n-localization-review/guidelines/[lang].md`
-   Glossary: `specs/002-i18n-localization-review/localization-glossary.json`
-   Baseline Audit: `specs/002-i18n-localization-review/audit-reports/audit-2025-10-17-baseline.json`

---

### Merge Checklist

-   [ ] Native speaker approval (≥4.0 average score)
-   [ ] UI testing passed (no rendering issues)
-   [ ] ESLint passed (`npm run lint`)
-   [ ] No merge conflicts with main branch
-   [ ] Changelog updated (if applicable)
```

---

### T030: CONTRIBUTING.md Section

**File**: `CONTRIBUTING.md` (add this section)

````markdown
## 🌍 Contributing Translations

We welcome localization contributions! Singular Blockly supports 15 languages, and we're always looking to improve translation quality.

### Before You Start

1. **Read the Guidelines**: Check `specs/002-i18n-localization-review/guidelines/{lang}.md` for your language
2. **Check the Glossary**: See `specs/002-i18n-localization-review/localization-glossary.json` for approved terminology
3. **Run the Audit**: `node scripts/i18n/audit-translations.js --languages={lang}` to see current issues

### Translation Workflow

#### Step 1: Identify Issues

```bash
# Run audit for your language
node scripts/i18n/audit-translations.js --languages=ja --verbose

# View summary
node scripts/i18n/audit-summary.js specs/002-i18n-localization-review/audit-reports/audit-{date}-baseline.json
```
````

#### Step 2: Create Feature Branch

```bash
git checkout -b localization/{lang}/fix-high-priority
```

#### Step 3: Edit Translation File

File location: `media/locales/{lang}/messages.js`

```javascript
// Before
window.languageManager.loadMessages({
	CATEGORY_LOGIC: 'Logic', // English fallback
});

// After
window.languageManager.loadMessages({
	CATEGORY_LOGIC: '論理ブロック', // Culturally appropriate Japanese
});
```

#### Step 4: Validate Changes

```bash
# Run audit again to confirm fixes
node scripts/i18n/audit-translations.js --languages={lang}

# Verify parsing works
node -e "require('./scripts/i18n/lib/translation-reader.js').loadMessagesFile('{lang}')"
```

#### Step 5: Submit Pull Request

Use the localization PR template (`.github/PULL_REQUEST_TEMPLATE/localization.md`)

Include:

-   Before/After examples for top 5 changes
-   Reference to audit issues being fixed
-   Screenshots showing UI rendering (if applicable)

#### Step 6: Native Speaker Review

Tag language-specific reviewers (see CODEOWNERS)

Target approval score: ≥4.0 average across 4 dimensions (cultural, tone, terminology, clarity)

### Translation Guidelines

#### High-Priority Keys (frequency ≥70)

Focus on these first - they're always visible to users:

-   `CATEGORY_*` - Toolbox categories
-   `BLOCKS_TAB`, `CODE_TAB` - Main tabs
-   `BOARD_SELECT_*` - Board selection UI
-   Common block labels

#### Quality Criteria

-   **Cultural Appropriateness**: Match local educational norms
-   **Tone**: Friendly, encouraging, suitable for students
-   **Terminology**: Use approved glossary terms
-   **Length**: Avoid translations >150% of English length (UI overflow risk)
-   **Completeness**: No empty strings or English fallbacks

#### Language-Specific Rules

**Japanese (ja)**:

-   Use polite form (です・ます) for educational context
-   Avoid excessive Katakana transliteration
-   Use kanji with furigana for complex terms

**Korean (ko)**:

-   Use polite informal (해요체), not formal (하십시오체)
-   Avoid English loan words when Korean equivalent exists

**German (de)**:

-   Use informal "du", not formal "Sie" (target: students)
-   Keep translations concise (German tends to be 20-30% longer)

**Traditional Chinese (zh-hant)**:

-   Use Taiwan terminology, not mainland Chinese
-   Example: "軟體" (Taiwan) not "软件" (mainland)

**Spanish (es)**:

-   Use informal "tú", not formal "usted"
-   Use neutral Spanish (avoid regional dialects)

### Native Speaker Validators

If you're interested in becoming a native speaker validator for your language:

-   See open issues with label `localization-recruiting`
-   Contact project maintainers
-   Recognition: Project credits, GitHub Sponsor recognition, contribution certificate

### Questions?

-   Open an issue with label `localization`
-   Contact: [maintainer email]
-   See: `specs/002-i18n-localization-review/plan.md` for feature details

````

---

## 🐛 Common Issues & Solutions

### Issue 1: Translation File Won't Parse

**Symptom**: `loadMessagesFile()` returns `{}`

**Cause**: Syntax error in translation file (unmatched braces, quotes)

**Solution**:
```bash
# Test parser directly
node -e "console.log(require('./scripts/i18n/lib/translation-reader.js').loadMessagesFile('ja'))"

# Check for syntax errors
node --check media/locales/ja/messages.js
````

### Issue 2: Detector Not Finding Issues

**Symptom**: Audit runs but finds 0 issues (expected some)

**Cause**: Detector logic too strict or translation already correct

**Solution**:

```bash
# Run with verbose logging
node scripts/i18n/audit-translations.js --languages=ja --verbose

# Check detector directly
node -e "const d = require('./scripts/i18n/lib/detectors/direct-translation.js'); console.log(d.detectDirectTranslation('ja', 'CATEGORY_LOGIC', 'Logic', 'ロジック', 95));"
```

### Issue 3: Schema Validation Fails

**Symptom**: `validateAuditReport()` throws error

**Cause**: Report structure doesn't match `contracts/audit-report.schema.json`

**Solution**:

```bash
# Check what's failing
node -e "const v = require('./scripts/i18n/lib/schema-validator.js'); try { v.validateAuditReport(require('./path/to/report.json')); console.log('PASS'); } catch(e) { console.error(e.message); }"
```

---

## 📊 Baseline Audit Quick Reference

**Top 3 Languages by Issue Count**:

1. Spanish: 400 issues (24%)
2. German: 385 issues (23%)
3. Traditional Chinese: 356 issues (21%)

**Top 3 Issue Types**:

1. Direct Translation: 758 issues (45%)
2. Length Overflow: 702 issues (42%)
3. Missing Translation: 193 issues (12%)

**High-Severity Issues**: 81 (5%)

-   Focus on these first - they affect always-visible UI elements
-   Most are `CATEGORY_*` keys (toolbox categories)

**Report Location**: `specs/002-i18n-localization-review/audit-reports/audit-2025-10-17-baseline.json`

---

## 🎯 Success Metrics (Current vs Target)

| Metric                     | Current | Target                 | Status                |
| -------------------------- | ------- | ---------------------- | --------------------- |
| High-severity issues       | 81      | <20                    | 🔴 Phase 5 needed     |
| Validator recruitment      | 0/10    | 10/10 (2 per language) | 🔴 T020 action needed |
| Guideline validation score | N/A     | ≥4.5/5.0               | ⏳ Pending T022-T026  |
| Translation fix coverage   | 0/100   | 100-150 strings        | ⏳ Phase 5            |
| Automation (CI/CD)         | 0%      | 100%                   | ⏳ Phase 6            |

---

## 📚 Additional Resources

### Related Documentation

-   **Feature Spec**: `specs/002-i18n-localization-review/spec.md`
-   **Research**: `specs/002-i18n-localization-review/research.md`
-   **Data Model**: `specs/002-i18n-localization-review/data-model.md`
-   **Original Plan**: `specs/002-i18n-localization-review/plan.md`

### External References

-   VSCode i18n Guide: https://code.visualstudio.com/api/language-extensions/language-configuration-guide
-   Blockly Localization: https://developers.google.com/blockly/guides/configure/web/translations
-   ICU Message Format: https://unicode-org.github.io/icu/userguide/format_parse/messages/

### Tools Used

-   **ajv**: JSON Schema validation (https://ajv.js.org/)
-   **fs-extra**: Enhanced file operations (https://github.com/jprichardson/node-fs-extra)

---

## 🚦 Phase Status at a Glance

| Phase             | Status         | Completion | Blocker                           |
| ----------------- | -------------- | ---------- | --------------------------------- |
| 0: Research       | ✅ Complete    | 100%       | None                              |
| 1: Infrastructure | ✅ Complete    | 100%       | None                              |
| 2: Utilities      | ✅ Complete    | 100%       | None                              |
| 3: User Story 1   | ✅ Complete    | 100%       | Native speaker validation pending |
| 4: User Story 2   | 🟡 In Progress | 10%        | T020 (post recruitment issue)     |
| 5: User Story 3   | ⏳ Not Started | 0%         | Phase 4 completion                |
| 6: User Story 4   | ⏳ Not Started | 0%         | None (can start now)              |
| 7: Polish         | ⏳ Not Started | 0%         | None (can start now)              |

---

## 💡 Pro Tips

1. **Start with T029-T030**: Create PR template and update CONTRIBUTING.md first (no blockers)
2. **Run audit frequently**: After any translation changes, re-run audit to validate fixes
3. **Focus on frequency ≥70**: High-frequency strings have maximum user impact
4. **Test UI rendering**: Long German translations (>150% length) often cause overflow
5. **Use verbose flag**: `--verbose` helps debug detector logic issues

---

**Last Updated**: October 17, 2025  
**Maintainer**: See tasks.md for current assignees  
**Questions**: Open issue with label `localization` or `question`

---

**Quick Navigation**:

-   [Tasks Breakdown](tasks.md)
-   [Phase Completion Report](PHASE-1-2-3-COMPLETION.md)
-   [Session Summary](SESSION-SUMMARY.md)
-   [Baseline Audit](audit-reports/audit-2025-10-17-baseline.json)
