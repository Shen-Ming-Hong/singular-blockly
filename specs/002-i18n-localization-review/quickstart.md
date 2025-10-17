# Quickstart Guide: Contributing to Singular Blockly Localization

**Last Updated**: 2025-10-17  
**Purpose**: Quick onboarding for contributors, reviewers, developers, and maintainers

---

## Table of Contents

1. [For Contributors](#for-contributors) - How to propose better translations
2. [For Native Speaker Reviewers](#for-native-speaker-reviewers) - How to validate translation quality
3. [For Developers](#for-developers) - How to run audit tools
4. [For Maintainers](#for-maintainers) - How to manage localization workflow

---

## For Contributors

### Prerequisites

-   **Native speaker fluency** in target language
-   Understanding of **educational context** (middle/high school students)
-   Basic familiarity with **programming concepts** (variables, loops, functions)
-   GitHub account for submitting pull requests

### Step-by-Step Workflow

#### 1. Find Translation Issues

**Option A: Browse existing issues**

-   Visit [GitHub Issues](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
-   Filter by label: `localization` + your language (e.g., `localization-ja`)
-   Look for issues tagged `good-first-issue` or `help-wanted`

**Option B: Self-identify issues**

-   Open Singular Blockly extension in VS Code
-   Switch to your language in VS Code settings
-   Use the extension and note any translations that feel:
    -   Unnatural or awkward
    -   Too formal or too casual
    -   Technically incorrect
    -   Inconsistent with similar UI elements

#### 2. Read the Localization Guideline

**Mandatory reading** before proposing translations:

-   [Japanese (日本語)](./guidelines/ja.md)
-   [Korean (한국어)](./guidelines/ko.md)
-   [German (Deutsch)](./guidelines/de.md)
-   [Traditional Chinese (繁體中文)](./guidelines/zh-hant.md)
-   [Spanish (Español)](./guidelines/es.md)

**Key sections to review**:

-   Terminology Standards (check approved terms)
-   Tone and Formality (match expected style)
-   Common Mistakes (avoid known pitfalls)

#### 3. Check the Terminology Glossary

Before proposing translations, **always check** [localization-glossary.json](./localization-glossary.json):

```json
{
	"englishTerm": "servo motor",
	"translations": {
		"ja": {
			"term": "サーボモーター",
			"usage": "カタカナ表記を使用",
			"alternatives": ["サーボ"]
		}
	}
}
```

**Use approved terms** for consistency. If term is missing, suggest adding it in your PR.

#### 4. Prepare Your Translation

**Format** (use this template):

```markdown
### Translation Proposal

**Message Key**: `CATEGORY_LOGIC`
**Language**: Japanese (ja)

**Current Translation**:
```

ロジック

```

**Proposed Translation**:
```

制御

```

**Rationale**:
「ロジック」is a direct transliteration that feels unnatural to Japanese students.
「制御」is the MEXT (Ministry of Education) standard term for control flow/logic
structures in programming education. This appears in official curriculum documents
and is widely used in Japanese CS textbooks.

**Guideline Reference**:
- Terminology Standards section: Use Kanji for established programming concepts
- Example 1: "ロジック → 制御" listed as correct localization

**Native Speaker Self-Review**:
- [x] Natural phrasing: 5/5 (standard educational term)
- [x] Technical accuracy: 5/5 (matches MEXT curriculum)
- [x] Cultural appropriateness: 5/5 (established in Japanese CS education)
- [x] Consistency: 5/5 (aligned with glossary)
```

#### 5. Submit Pull Request

**PR Requirements**:

1. **Branch naming**: `localization/{language}/{brief-description}`

    - Example: `localization/ja/fix-category-terminology`

2. **Files changed**: Only `media/locales/{lang}/messages.js`

    - Do not modify other language files in same PR
    - One language per PR (for cleaner review)

3. **PR title format**: `[i18n-{lang}] Brief description`

    - Example: `[i18n-ja] Fix direct translations in toolbox categories`

4. **PR description**: Use template above with before/after/rationale

5. **Self-review checklist**: Include 4-dimension scoring (1-5 scale)

**Submit via GitHub**:

```bash
git checkout -b localization/ja/fix-category-terminology
# Edit media/locales/ja/messages.js
git add media/locales/ja/messages.js
git commit -m "[i18n-ja] Replace ロジック with 制御 for CATEGORY_LOGIC"
git push origin localization/ja/fix-category-terminology
# Open PR on GitHub
```

#### 6. Respond to Review Feedback

-   Native speaker reviewer will evaluate using [Review Checklist](#review-checklist)
-   Address feedback by updating translation or providing additional rationale
-   PR must score ≥4.0 average across 4 dimensions for high-frequency strings

---

## For Native Speaker Reviewers

### Prerequisites

-   **Native speaker fluency** in target language
-   Experience with **educational software** or **CS education**
-   Understanding of **local educational terminology standards**
-   Willingness to provide **constructive feedback**

### Review Process

#### 1. Assignment via CODEOWNERS

When translation PRs are submitted, GitHub will auto-assign reviewers based on `CODEOWNERS`:

```
/media/locales/ja/    @japanese-reviewer-username
/media/locales/ko/    @korean-reviewer-username
/media/locales/de/    @german-reviewer-username
```

_(CODEOWNERS file to be set up by maintainers)_

#### 2. Use the Review Rubric

Evaluate each translation on **4 dimensions** (1-5 scale):

##### ✅ Natural Phrasing (自然な表現 / 자연스러운 표현 / Natürliche Formulierung / 自然表達 / Expresión Natural)

**Score 5**: Perfect native speaker quality

-   Sounds exactly like a native speaker wrote it
-   No awkward or foreign-sounding constructions
-   Grammar and syntax flawless

**Score 4**: Good, minor polish possible

-   Generally natural, maybe one small awkwardness
-   Native speaker would understand immediately

**Score 3**: Acceptable but noticeable issues

-   Understandable but feels slightly "off"
-   Minor grammar or word choice issues

**Score 2**: Awkward, needs revision

-   Multiple unnatural constructions
-   Feels like translation, not original text

**Score 1**: Very poor, major rewrite needed

-   Word-for-word translation
-   Grammatically incorrect or confusing

---

##### ✅ Technical Accuracy (技術的正確性 / 기술적 정확성 / Technische Genauigkeit / 技術準確性 / Precisión Técnica)

**Score 5**: Perfect technical precision

-   Terms match official educational standards
-   Programming concepts correctly translated
-   Glossary terms used correctly

**Score 4**: Accurate with minor term variation

-   Mostly correct, one alternative term used
-   Still technically sound

**Score 3**: Acceptable but improvable

-   Correct meaning but not standard terminology
-   May confuse students learning standard terms

**Score 2**: Technical errors present

-   Incorrect term or concept translation
-   Could mislead students

**Score 1**: Seriously incorrect

-   Wrong concept or misleading terminology
-   Technical accuracy failure

---

##### ✅ Cultural Appropriateness (文化的適切性 / 문화적 적절성 / Kulturelle Angemessenheit / 文化適切性 / Adecuación Cultural)

**Score 5**: Perfectly culturally adapted

-   Tone matches target audience expectations
-   Examples/metaphors culturally relevant
-   Formality level appropriate

**Score 4**: Good cultural fit

-   Minor tone mismatch possible
-   Generally appropriate

**Score 3**: Acceptable but noticeable

-   Tone slightly off (too formal/casual)
-   Cultural context not quite right

**Score 2**: Cultural mismatch

-   Tone inappropriate for educational context
-   Examples don't resonate with target culture

**Score 1**: Culturally inappropriate

-   Offensive or confusing cultural references
-   Completely wrong tone/formality

---

##### ✅ Consistency (一貫性 / 일관성 / Konsistenz / 一致性 / Consistencia)

**Score 5**: Perfect consistency

-   Matches glossary exactly
-   Same term used for same concept throughout
-   No contradictions with other translations

**Score 4**: Mostly consistent

-   Minor variation from glossary (acceptable alternative)
-   Generally aligned

**Score 3**: Some inconsistencies

-   Uses different term than glossary without justification
-   May confuse with other UI elements

**Score 2**: Multiple inconsistencies

-   Several terms differ from established usage
-   Contradicts other translations

**Score 1**: Completely inconsistent

-   Ignores glossary entirely
-   Random terminology choices

---

#### 3. Provide Structured Feedback

**Use this template** in PR comments:

```markdown
### Native Speaker Review: `CATEGORY_LOGIC`

**Scores**:

-   Natural Phrasing: 4/5
-   Technical Accuracy: 5/5
-   Cultural Appropriateness: 5/5
-   Consistency: 5/5
-   **Average**: 4.75/5 ✅ APPROVED

**Feedback**:
This is an excellent improvement. 「制御」is indeed the MEXT standard term
and will be immediately recognized by Japanese students. The only minor note:
in some contexts, 「制御構造」(control structure) might be even clearer, but
for a category label, 「制御」is perfect due to space constraints.

**Recommendation**: ✅ APPROVE (merge after maintainer confirmation)
```

**If requesting changes**:

```markdown
### Native Speaker Review: `ARDUINO_SETUP`

**Scores**:

-   Natural Phrasing: 3/5
-   Technical Accuracy: 4/5
-   Cultural Appropriateness: 2/5 (tone issue)
-   Consistency: 5/5
-   **Average**: 3.5/5 ❌ CHANGES REQUESTED

**Issues**:

1. **Tone too formal**: "設定してください" uses formal polite form. Per Korean
   guideline, educational software should use informal polite (해요체).
2. **Suggested revision**: "設定하세요" (informal polite) is more appropriate
   for student-facing UI.

**Recommendation**: ❌ REQUEST CHANGES
```

#### 4. Approval Criteria

**Required scores** for approval:

-   **High-frequency strings** (categories, common blocks, errors): ≥4.5 average
-   **Medium-frequency strings** (tooltips, messages): ≥4.0 average
-   **Low-frequency strings** (advanced features): ≥3.5 average

If below threshold, request changes with specific suggestions.

---

## For Developers

### Prerequisites

-   Node.js 18+ installed
-   Repository cloned locally
-   Basic command line familiarity

### Running Audit Tools

#### 1. Install Dependencies

```bash
cd singular-blockly
npm install
```

#### 2. Run Translation Audit

_(Audit scripts to be implemented in Phase 2 - this is the planned interface)_

```bash
node scripts/i18n/audit-translations.js --languages ja,ko,de,zh-hant,es
```

**Output**: `specs/002-i18n-localization-review/audit-reports/audit-{date}.json`

**Example output**:

```json
{
	"reportId": "audit-2025-10-17-baseline",
	"totalIssues": 127,
	"issuesBySeverity": {
		"high": 23,
		"medium": 64,
		"low": 40
	},
	"highFrequencyIssues": [
		{
			"key": "CATEGORY_LOGIC",
			"language": "ja",
			"issueType": "directTranslation",
			"severity": "high",
			"frequency": 95,
			"currentValue": "ロジック",
			"suggestedValue": "制御"
		}
	]
}
```

#### 3. Validate Translation Files

Check if translation files conform to schema:

```bash
node scripts/i18n/validate-translations.js --language ja
```

**Validates**:

-   File structure matches `translation-file.schema.json`
-   All required message keys present
-   No empty translations
-   Proper character encoding (UTF-8)

#### 4. Compare Before/After

Generate diff report after fixes:

```bash
node scripts/i18n/compare-translations.js \
  --baseline audit-2025-10-17-baseline.json \
  --current audit-2025-10-25-post-fixes.json
```

**Output**: Shows improvement metrics (issues resolved, new issues, quality %)

---

## For Maintainers

### Workflow Management

#### 1. Branch Strategy

**Per-language feature branches**:

```
002-i18n-localization-review/           # Main feature branch
├── ja/                                 # Japanese sub-branch
├── ko/                                 # Korean sub-branch
├── de/                                 # German sub-branch
├── zh-hant/                            # Traditional Chinese sub-branch
└── es/                                 # Spanish sub-branch
```

**Allows parallel work** without conflicts.

#### 2. PR Review Workflow

**Checklist before merge**:

1. ✅ **Automated checks pass**:

    - Translation file schema validation
    - Placeholder variable preservation ({0}, %1)
    - No empty translations

2. ✅ **Native speaker approval**:

    - Assigned native speaker reviewer approved PR
    - Average score meets threshold (≥4.0 for medium-frequency)

3. ✅ **Guideline conformance**:

    - Translation references appropriate guideline section
    - Uses glossary-approved terminology

4. ✅ **Testing completed**:
    - Contributor or maintainer tested in actual VS Code extension
    - UI rendering correct (no text overflow)
    - Language switching works

#### 3. Merge Criteria

**Required for merge approval**:

-   [ ] Native speaker review: APPROVED
-   [ ] Automated checks: PASSED
-   [ ] UI testing: VERIFIED
-   [ ] Guideline conformance: CONFIRMED

**Merge command**:

```bash
git checkout 002-i18n-localization-review
git merge --no-ff localization/ja/fix-category-terminology
git push origin 002-i18n-localization-review
```

Use `--no-ff` to preserve PR history.

#### 4. Rollout Strategy

**Phased rollout by language**:

**Week 1-2**: Japanese (ja)

-   Audit → Native speaker review → Fixes → Testing → Merge

**Week 3-4**: Korean (ko)

-   Repeat process

**Week 5-6**: German (de), Traditional Chinese (zh-hant), Spanish (es)

-   Parallel review if native speakers available

**Final**: Merge to main and release

#### 5. Monitoring Translation Quality

**Metrics to track**:

-   Issues per language (from audit reports)
-   Average native speaker scores
-   User feedback (GitHub issues tagged `localization`)

**Regression prevention**:

-   Run audit tool on every translation PR
-   Flag new issues introduced
-   Maintain quality baseline

---

## FAQ

### Q: I'm not a programmer. Can I still contribute translations?

**A**: Yes! You don't need to code. Just:

1. Understand the educational context (programming concepts)
2. Follow the guideline for your language
3. Submit translations via GitHub PR (we can help with Git if needed)

### Q: What if I disagree with the guideline?

**A**: Open a GitHub issue tagged `localization-guideline` with:

-   Language affected
-   Guideline section in question
-   Your rationale for change
-   Alternative proposal

Guidelines can be updated based on community feedback.

### Q: How long does native speaker review take?

**A**: Target SLA:

-   High-priority strings: 1 week
-   Medium-priority: 2 weeks
-   Low-priority: Best effort

### Q: Can I translate multiple languages in one PR?

**A**: No, please submit separate PRs per language for cleaner review and rollback.

### Q: What if a term isn't in the glossary?

**A**: Suggest adding it in your PR:

```markdown
**New Glossary Entry Needed**:

-   English term: "breadboard"
-   Proposed Japanese: "ブレッドボード"
-   Rationale: Common hardware term, currently inconsistently translated
```

Maintainers will add approved terms to glossary.

---

## Resources

-   [Terminology Glossary](./localization-glossary.json)
-   [Data Model](./data-model.md)
-   [Language Guidelines](./guidelines/)
-   [GitHub Issues: Localization](https://github.com/Shen-Ming-Hong/singular-blockly/issues?q=label%3Alocalization)

---

## Support

**Questions?**

-   Open an issue with label `localization-question`
-   Tag maintainers: @Shen-Ming-Hong

**Native Speaker Reviewers Needed?**

-   Open an issue with label `help-wanted` + `localization-{lang}`

---

**Thank you for helping make Singular Blockly accessible to students worldwide!** 🌍
