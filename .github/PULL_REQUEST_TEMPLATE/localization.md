## 🌍 Localization Changes

**Language**: [ja / ko / de / zh-hant / es / fr / it / pl / pt-br / ru / tr / cs / hu / bg]  
**Fixes Issue**: #[issue-number]  
**Audit Report Reference**: [link to baseline audit or specific issue]

---

## Changes Summary

**Total Translations Modified**: [number]  
**High-Frequency Strings Fixed**: [number] (frequency ≥70)

**Issue Types Addressed**:

-   [ ] Direct translations replaced with culturally appropriate terms
-   [ ] Cultural tone adjusted for target audience
-   [ ] Length overflow/underflow fixed
-   [ ] Missing translations added
-   [ ] Terminology aligned with glossary

---

## Before/After Examples

Please provide at least 3-5 examples of significant changes:

| Key              | Before            | After                      | Frequency | Impact                           |
| ---------------- | ----------------- | -------------------------- | --------- | -------------------------------- |
| `CATEGORY_LOGIC` | 論理              | 論理ブロック               | 95        | High - Always visible in toolbox |
| `CATEGORY_TEXT`  | テキスト          | 文字列                     | 95        | High - Common block category     |
| `ERROR_NO_BOARD` | No board selected | ボードが選択されていません | 50        | Medium - Error message           |
|                  |                   |                            |           |                                  |
|                  |                   |                            |           |                                  |

---

## Validation Checklist

### Automated Checks

-   [ ] Ran `node scripts/i18n/validate-translations.js --language=[lang]` - All checks passed
-   [ ] Ran `node scripts/i18n/detect-patterns.js --language=[lang]` - Reviewed warnings
-   [ ] No ESLint errors (`npm run lint`)
-   [ ] Translation file loads correctly (no syntax errors)

### Manual Testing

-   [ ] **Create Block**: Opened toolbox → Selected category → Dragged block → Verified tooltip displays correctly
-   [ ] **Change Board**: Preferences → Board dropdown → Verified board names localized
-   [ ] **Generate Code**: Added blocks → Clicked "Generate Code" → Verified success message localized
-   [ ] **Error Handling**: Intentionally created error → Verified error message localized

### UI Rendering

-   [ ] No text overflow in any UI element
-   [ ] No text truncation (all content visible)
-   [ ] No empty strings
-   [ ] Language switching works correctly
-   [ ] Tested on both light and dark themes

---

## Translation Quality Self-Assessment

Please rate your translations on these dimensions (1-5 scale):

### Cultural Appropriateness

-   [ ] **5** - Perfect cultural fit, natural phrasing
-   [ ] **4** - Good fit, minor awkwardness
-   [ ] **3** - Adequate, some cultural mismatch
-   [ ] **2** - Poor fit, noticeable issues
-   [ ] **1** - Inappropriate, does not match culture

**Comments**: [Explain your rating]

### Tone Match (Educational/Friendly)

-   [ ] **5** - Perfect tone for student audience
-   [ ] **4** - Good tone, minor formality issues
-   [ ] **3** - Adequate, tone somewhat off
-   [ ] **2** - Poor tone (too formal/informal)
-   [ ] **1** - Inappropriate tone

**Comments**: [Explain your rating]

### Terminology Accuracy

-   [ ] **5** - All technical terms correct and consistent with glossary
-   [ ] **4** - Mostly correct, minor inconsistencies
-   [ ] **3** - Adequate, some incorrect terms
-   [ ] **2** - Poor terminology usage
-   [ ] **1** - Incorrect or confusing terms

**Comments**: [Explain your rating]

### Clarity

-   [ ] **5** - Perfectly clear, no ambiguity
-   [ ] **4** - Clear, minor confusion possible
-   [ ] **3** - Adequate clarity, some ambiguity
-   [ ] **2** - Unclear in places
-   [ ] **1** - Confusing or misleading

**Comments**: [Explain your rating]

**Average Self-Assessment Score**: [Calculate average] / 5.0

---

## Reference Documents Used

Please check which documents you referenced:

-   [ ] Language-specific guideline: `specs/002-i18n-localization-review/guidelines/[lang].md`
-   [ ] Localization glossary: `specs/002-i18n-localization-review/localization-glossary.json`
-   [ ] Baseline audit report: `specs/002-i18n-localization-review/audit-reports/audit-2025-10-17-baseline.json`
-   [ ] Other (specify): ******\_\_\_\_******

---

## Additional Context

[Add any additional information that reviewers should know about these translations. For example:

-   Rationale for specific translation choices
-   Known limitations or compromises
-   Areas where you're uncertain and want reviewer feedback
-   Related cultural considerations
    ]

---

## Screenshots (Optional)

If your changes affect visible UI elements, please include before/after screenshots:

**Before**:
[Screenshot]

**After**:
[Screenshot]

---

## Reviewer Notes

For reviewers: Please focus on:

1. Cultural appropriateness for target audience
2. Terminology consistency with glossary
3. UI rendering (no overflow/truncation)
4. Tone matches educational context

---

**Checklist for Maintainers**:

-   [ ] Translation quality score ≥4.0 average (if native speaker review conducted)
-   [ ] All automated checks passed (validation + patterns)
-   [ ] UI testing confirmed (no rendering issues)
-   [ ] High-frequency strings (≥70) prioritized
-   [ ] CHANGELOG.md updated (if applicable)
