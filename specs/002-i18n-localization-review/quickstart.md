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

#### 5. Manage Audit Whitelist (Post-Clarifications 2025-10-22)

**View current whitelist rules**:

```bash
cat scripts/i18n/audit-whitelist.json
```

**Add new whitelist rule**:

```json
{
	"id": "WL-009",
	"name": "Hardware brand names",
	"pattern": "*Arduino*",
	"rationale": "Brand names should remain in English for trademark compliance",
	"addedBy": "your-github-username",
	"addedAt": "2025-10-22T10:30:00Z",
	"tags": ["trademark", "hardware"]
}
```

**Rule Design Guidelines**:

-   Use specific patterns (avoid overly broad wildcards like `*a*`)
-   Document clear rationale (explain WHY this is acceptable)
-   Add tags for categorization
-   Include your GitHub username for accountability

**Validate whitelist impact**:

```bash
node scripts/i18n/audit-translations.js --dry-run
```

Shows how many violations would be filtered without saving results.

#### 6. Monitor Rule Health (Clarifications Q5-B)

**Generate rule effectiveness report**:

```bash
node scripts/i18n/audit-translations.js --report-rule-health
```

**Output**: `specs/002-i18n-localization-review/audit-reports/rule-health-{date}.json`

**Key metrics**:

```json
{
	"totalRules": 8,
	"filteredCount": 149,
	"filterRate": 8.8,
	"staleRules": ["WL-008"],
	"recommendedAction": {
		"WL-001": "keep",
		"WL-008": "review"
	}
}
```

**Action on stale rules**:

-   `staleRules` = rules with <5 matches in last 3 months
-   Review quarterly during governance meetings
-   Remove rules that no longer match any violations
-   Update patterns if becoming too broad/narrow

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

#### 2. PR Review Workflow (Updated per Clarifications 2025-10-22)

**Checklist before merge**:

1. ✅ **CI/CD Automated checks** (Q1-B: Non-blocking):

    - Translation file schema validation
    - Placeholder variable preservation ({0}, %1)
    - Audit whitelist violations → **WARNING only** (does not block merge)
    - GitHub Actions posts warning comment if new violations detected

2. ✅ **Human code review REQUIRED** (Q2-Yes):

    - At least one maintainer/developer reviews PR
    - Verifies: (1) whitelist rule additions have valid rationale, (2) new violations follow documented patterns
    - **Does NOT require native speaker approval** (volunteer availability too limited)

3. ✅ **Guideline conformance**:

    - Translation references appropriate guideline section
    - Uses glossary-approved terminology

4. ✅ **Testing completed**:
    - Contributor or maintainer tested in actual VS Code extension
    - UI rendering correct (no text overflow)
    - Language switching works

**Note**: Native speaker approval is **nice-to-have** but NOT required for merge. See Clarifications Session 2025-10-22 for rationale (volunteer availability constraints).

#### 3. Merge Criteria

**Required for merge approval**:

-   [ ] Human code review: APPROVED (minimum 1 maintainer)
-   [ ] Automated checks: PASSED (schema validation, placeholders)
-   [ ] UI testing: VERIFIED (tested in VS Code extension)
-   [ ] Guideline conformance: CONFIRMED (uses approved terminology)
-   [ ] Whitelist violations: DOCUMENTED (if adding new rules, rationale provided)

**Optional but encouraged**:

-   [ ] Native speaker review: APPROVED (if volunteer available)

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
-   Whitelist effectiveness (filter rate, rule health)
-   User feedback (GitHub issues tagged `localization`)

**Regression prevention**:

-   Run audit tool on every translation PR
-   Flag new violations with warnings (non-blocking per Q1-B)
-   Maintain quality baseline via trend analysis

#### 6. Audit Report Retention Policy (Clarifications Q3-Yes)

**Retention Period**: 6 months

**Storage Location**: `specs/002-i18n-localization-review/audit-reports/`

**File Naming**:

```
audit-reports/
├── audit-2025-10-17-baseline.json
├── audit-2025-10-25-post-fixes.json
├── rule-health-2025-10-22.json
└── ...
```

**Automated Cleanup**:

-   Monthly cron job removes reports older than 6 months
-   Keeps baseline reports (tagged with `baseline` in filename)
-   Exports quarterly summaries for long-term trend tracking

**Purpose**:

-   Track violation trends over time
-   Inform rule governance decisions (identify stale rules)
-   Audit trail for whitelist changes

**Manual Cleanup Command**:

```bash
find specs/002-i18n-localization-review/audit-reports/ \
  -type f -name "*.json" \
  -mtime +180 ! -name "*baseline*" \
  -delete
```

(Deletes files older than 180 days, preserving baseline reports)

#### 7. Handling Remaining Issues (Clarifications Q4-B)

After whitelist refinement, some violations may remain unfixable due to technical constraints.

**Documentation Process**:

1. **Create/Update `KNOWN-ISSUES.md`** in spec directory
2. **List each remaining pattern** with:
    - Example message keys affected
    - Root cause (e.g., "Blockly API requires English term")
    - Acceptance rationale (e.g., "Low frequency, minimal impact")
3. **Set acceptance threshold**: Remaining violations must affect <2% of strings
4. **Mark issues as `help wanted`** in GitHub for future volunteers
5. **Reference in PR description** when closing feature

**Example Entry**:

```markdown
### Issue: English "workspace" term in API messages

**Affected Keys**: `WORKSPACE_DELETE`, `WORKSPACE_CLEAR` (5 strings)
**Root Cause**: Blockly core API uses "workspace" as technical term
**Impact**: 0.1% of total strings, developer-facing only
**Status**: Accepted until Blockly v13 API refactor
```

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

## For Whitelist Rule Contributors

### How to Add or Modify Whitelist Rules

**Context**: The whitelist system filters false positives from translation quality audits. Rules are defined in `scripts/i18n/audit-whitelist.json` and can be maintained by non-developers (linguists, translators) with basic JSON knowledge.

#### Prerequisites

-   Understanding of the specific language's linguistic features
-   Familiarity with JSON format (basic key-value structure)
-   Evidence that current audit is incorrectly flagging legitimate translations

#### Step-by-Step Process

##### 1. Identify the False Positive Pattern

Run the audit to see current issues:

```powershell
npm run audit:translations -- --languages ja,ko,de,zh-hant,es
```

Example output showing a false positive:

```json
{
	"key": "CATEGORY_MATH",
	"language": "de",
	"issueType": "lengthOverflow",
	"severity": "high",
	"currentValue": "Mathematik",
	"rationale": "Translation is 120% of English length"
}
```

**Analysis**: German "Mathematik" is a legitimate translation of "Math", not an error. German creates compound words that are naturally longer.

##### 2. Understand Rule Structure

Whitelist rules are organized by `issueType`:

```json
{
	"exemptions": {
		"lengthOverflow": {
			"rules": [...]
		},
		"directTranslation": {
			"rules": [...]
		},
		"missingTranslation": {
			"rules": [...]
		}
	}
}
```

Each rule has:

-   `ruleId`: Unique identifier (e.g., `"cjk-concise-terms"`)
-   `description`: Human-readable explanation
-   `languages`: Array of language codes (e.g., `["ja", "ko", "zh-hant"]`)
-   `keys` or `patterns`: Specific message keys or wildcard patterns
-   `rationale`: Why this is a false positive
-   `examples` (optional): Illustrative cases

##### 3. Determine Rule Scope

**Option A: Specific Keys** (precise, recommended)

```json
{
	"ruleId": "german-compound-words",
	"description": "German creates compound words that are legitimately longer",
	"languages": ["de"],
	"keys": ["CATEGORY_MATH", "CATEGORY_LOOPS"],
	"rationale": "German compound words like 'Mathematik' and 'Schleifen' are standard translations."
}
```

**Option B: Pattern Matching** (broader scope)

```json
{
	"ruleId": "cjk-concise-terms",
	"description": "CJK languages use more concise characters",
	"languages": ["ja", "ko", "zh-hant"],
	"patterns": ["CATEGORY_.*", ".*_TOOLTIP"],
	"rationale": "CJK naturally use fewer characters for technical terms."
}
```

**Pattern syntax**:

-   `CATEGORY_.*` matches any key starting with `CATEGORY_`
-   `.*_TOOLTIP` matches any key ending with `_TOOLTIP`
-   `.*` wildcard matches any characters

##### 4. Add the New Rule

Edit `scripts/i18n/audit-whitelist.json`:

```json
{
	"exemptions": {
		"lengthOverflow": {
			"rules": [
				// ... existing rules ...
				{
					"ruleId": "your-new-rule-id",
					"description": "Brief explanation",
					"languages": ["de"],
					"keys": ["SPECIFIC_KEY_1", "SPECIFIC_KEY_2"],
					"rationale": "Detailed linguistic justification"
				}
			]
		}
	}
}
```

**Best practices**:

-   Use descriptive `ruleId` (kebab-case)
-   Be specific in `rationale` (cite linguistic principles)
-   Prefer `keys` over `patterns` when possible (avoid over-filtering)
-   Include `examples` object if rule is complex

##### 5. Test the Rule

Re-run audit to verify the rule filters correctly:

```powershell
npm run audit:translations -- --languages de
```

Check output:

-   Issue should no longer appear in main report
-   Verify `whitelistStats` section shows rule matched

##### 6. Submit Pull Request

**PR Title**: `[i18n] Add whitelist rule: {rule-id}`

**PR Description Template**:

```markdown
## Summary

Adds whitelist rule to filter false positive: [issue description]

## Rule Details

-   **Rule ID**: `your-new-rule-id`
-   **Issue Type**: lengthOverflow / directTranslation / missingTranslation
-   **Languages**: de, es (list all)
-   **Scope**: 5 specific keys / `CATEGORY_.*` pattern

## Linguistic Justification

[Explain why flagged translations are legitimate]

Example: German compound words naturally expand English roots by 20-40% due to morphological concatenation (e.g., "Mathematik" = "mathematic" + suffix, standard educational term).

## Testing Evidence

Before: 15 false positives flagged
After: 0 false positives, rule filtered correctly

## Checklist

-   [ ] Rule pattern is specific (avoids over-broad filtering)
-   [ ] Rationale includes linguistic/cultural explanation
-   [ ] Tested against current translation files
-   [ ] No conflicts with existing rules
-   [ ] Updated `statistics.totalRules` count
```

##### 7. Rule Governance

**Approval process**: All whitelist changes require maintainer review (PR + approval)

**Review criteria**:

-   ✅ Rule specificity (not too broad)
-   ✅ Linguistic justification (cite language features)
-   ✅ No over-filtering (genuine issues still detected)
-   ✅ Test evidence (before/after metrics)

#### Common Rule Patterns

**Pattern 1: Language-Specific Brevity** (CJK)

```json
{
	"ruleId": "cjk-concise-terms",
	"issueType": "lengthOverflow",
	"languages": ["ja", "ko", "zh-hant"],
	"patterns": ["CATEGORY_.*"],
	"rationale": "CJK use 2-4 characters vs 8-12 English letters for technical terms"
}
```

**Pattern 2: Brand Names** (All languages)

```json
{
	"ruleId": "brand-names-unchanged",
	"issueType": "missingTranslation",
	"languages": ["ja", "ko", "de", "zh-hant", "es"],
	"keys": ["BOARD_UNO", "BOARD_NANO"],
	"rationale": "Product names remain in English globally"
}
```

**Pattern 3: Technical Cognates** (Germanic/Romance)

```json
{
	"ruleId": "cognates-and-loanwords",
	"issueType": "directTranslation",
	"languages": ["de", "es"],
	"patterns": ["CATEGORY_.*"],
	"rationale": "Shared Latin/Greek roots produce similar word forms"
}
```

**Pattern 4: API Function Names**

```json
{
	"ruleId": "arduino-api-terms",
	"issueType": "directTranslation",
	"languages": ["de", "es"],
	"patterns": ["ARDUINO_DIGITAL_.*", "ARDUINO_ANALOG_.*"],
	"rationale": "Arduino API has established educational translations"
}
```

#### Troubleshooting

**Q: My rule doesn't match any issues**

-   Check `patterns` use correct wildcard syntax (`.*` not `*`)
-   Verify `languages` array includes target language
-   Ensure `issueType` matches report (e.g., `lengthOverflow` not `length_overflow`)

**Q: Rule filters too many issues**

-   Switch from `patterns` to specific `keys` list
-   Add more specific pattern (e.g., `CATEGORY_LOGIC` instead of `CATEGORY_.*`)

**Q: How do I remove an obsolete rule?**

-   Submit PR deleting the rule from JSON
-   Explain why rule is no longer needed (e.g., translations were fixed, rule was too broad)

---

## Resources

-   [Terminology Glossary](./localization-glossary.json)
-   [Data Model](./data-model.md)
-   [Language Guidelines](./guidelines/)
-   [Whitelist Rules](../../scripts/i18n/audit-whitelist.json)
-   [Known Issues](./KNOWN-ISSUES.md)
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
