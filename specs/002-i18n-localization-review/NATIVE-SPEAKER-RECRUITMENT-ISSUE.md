# 🌍 Call for Native Speaker Validators - Localization Quality Review

**Status**: 🟢 Open for Applications  
**Issue Type**: Community Contribution Opportunity  
**Labels**: `localization-recruiting`, `help-wanted`, `good-first-issue`

---

## 📋 Overview

We're improving the translation quality of **Singular Blockly** (a visual programming extension for Arduino) and need native speakers to validate our localization guidelines and review high-priority translations.

Our automated audit detected **1,673 translation quality issues** across 5 languages. We need your expertise to ensure translations are culturally appropriate, educationally suitable, and technically accurate.

---

## 🎯 Languages Needed

We're seeking **1-2 validators per language**:

| Language                          | Flag | Validators Needed | Current Status |
| --------------------------------- | ---- | ----------------- | -------------- |
| **Japanese (ja)**                 | 🇯🇵   | 1-2               | 🔍 Recruiting  |
| **Korean (ko)**                   | 🇰🇷   | 1-2               | 🔍 Recruiting  |
| **German (de)**                   | 🇩🇪   | 1-2               | 🔍 Recruiting  |
| **Traditional Chinese (zh-hant)** | 🇹🇼   | 1-2               | 🔍 Recruiting  |
| **Spanish (es)**                  | 🇪🇸   | 1-2               | 🔍 Recruiting  |

---

## 🔍 What We Need From You

### Phase 1: Guideline Review (Required)

**Time Commitment**: 30-60 minutes

1. **Read** your language-specific guideline document (`specs/002-i18n-localization-review/guidelines/{lang}.md`)
2. **Score** the guideline using this 5-point scale:
    - ⭐⭐⭐⭐⭐ (5) - Excellent: Clear, comprehensive, culturally accurate
    - ⭐⭐⭐⭐ (4) - Good: Minor improvements needed
    - ⭐⭐⭐ (3) - Adequate: Needs significant revision
    - ⭐⭐ (2) - Poor: Major issues present
    - ⭐ (1) - Unusable: Fundamental problems
3. **Validate** translation examples are culturally appropriate
4. **Provide feedback** on:
    - Clarity of terminology guidelines
    - Accuracy of cultural context rules
    - Completeness of examples
    - Any missing best practices

**Target**: We're aiming for ≥4.5 average score across validators

### Phase 2: Translation Review (Optional)

**Time Commitment**: 1-2 hours

1. **Review** 20-30 high-priority translation fixes (toolbox categories + common blocks)
2. **Score** each translation using our 4-dimension rubric:
    - **Cultural Appropriateness** (1-5): Does it fit the target culture?
    - **Tone Match** (1-5): Educational/friendly tone suitable for students?
    - **Terminology Accuracy** (1-5): Correct technical terms used?
    - **Clarity** (1-5): Easy to understand without confusion?
3. **Provide feedback** on any problematic translations
4. **Suggest improvements** if needed

**Target**: ≥4.0 average score for all reviewed strings

---

## 🎁 Recognition & Benefits

We deeply appreciate your contribution! Here's what you'll receive:

### 🏆 Project Credit

-   Your name and GitHub profile listed in **README.md** Contributors section
-   Credit in **CHANGELOG.md** for the localization improvement release
-   GitHub Sponsor recognition (if you have Sponsors enabled)

### 📜 Contribution Certificate

-   Official contribution certificate for your portfolio/resume
-   Document includes your language, review scope, and contribution date
-   Shareable on LinkedIn and professional profiles

### 🌟 Community Impact

-   Help **thousands of students** learn programming in their native language
-   Improve **educational accessibility** globally
-   Gain **open-source contribution experience** for your portfolio

### 💰 Compensation (Optional)

-   This is a **volunteer opportunity** by default
-   **Paid review option**: If budget becomes available, we offer $100-200 per language for comprehensive review (20-30 translations + guideline validation)
-   We'll update this issue if paid positions open up

---

## 📊 Current Audit Results

Our automated audit found these issues in your language:

| Language               | Total Issues | High Severity | Medium | Low |
| ---------------------- | ------------ | ------------- | ------ | --- |
| 🇪🇸 Spanish             | 400          | -             | -      | -   |
| 🇩🇪 German              | 385          | -             | -      | -   |
| 🇹🇼 Traditional Chinese | 356          | -             | -      | -   |
| 🇯🇵 Japanese            | 272          | -             | -      | -   |
| 🇰🇷 Korean              | 260          | -             | -      | -   |

**Example issues detected**:

-   **Direct translations**: Word-for-word translations lacking cultural adaptation (e.g., excessive Katakana in Japanese)
-   **Length overflow**: Translations 2-3x longer than English (may break UI)
-   **Missing translations**: English fallback text in non-English files
-   **Tone mismatch**: Formal language when informal/educational tone expected

Your validation will help us confirm these automated detections are accurate!

---

## 🛠️ How to Apply

### Step 1: Comment on This Issue

Post a comment with:

```markdown
## Native Speaker Application

-   **Language**: [Japanese/Korean/German/Traditional Chinese/Spanish]
-   **Native Proficiency**: [Yes/Heritage Speaker/Near-Native]
-   **Background**: [Brief description - e.g., "Native Japanese speaker, software engineer"]
-   **Availability**: [Phase 1 only / Phase 1 + Phase 2]
-   **GitHub Handle**: @your-username
-   **Preferred Contact**: [GitHub/Email]
```

### Step 2: We'll Send You Materials

Within 2-3 business days, we'll reply with:

-   Link to your language's guideline document
-   Review instructions and scoring rubric
-   Timeline expectations (flexible, typically 1 week for review)

### Step 3: Complete Review

-   Submit your scores and feedback via GitHub issue comment or email
-   We'll iterate on the guideline based on your feedback
-   If you opt into Phase 2, we'll send translation PRs for review

### Step 4: Get Recognized

-   Your contribution will be credited in the next release
-   Certificate issued upon completion
-   Added to CODEOWNERS for future localization PRs

---

## 📚 Resources

Before applying, you may want to review:

1. **Sample Guideline** (English): [`guidelines/en.md`](specs/002-i18n-localization-review/guidelines/en.md)
2. **Localization Glossary**: [`localization-glossary.json`](specs/002-i18n-localization-review/localization-glossary.json)
3. **Baseline Audit Report**: [`audit-reports/audit-2025-10-17-baseline.json`](specs/002-i18n-localization-review/audit-reports/audit-2025-10-17-baseline.json)
4. **Project README**: [`README.md`](README.md)

---

## ❓ FAQ

### Q: I'm a heritage speaker, not native. Can I still apply?

**A**: Yes! If you have strong reading/writing proficiency and cultural familiarity, we'd love your input.

### Q: I don't have GitHub experience. Can I participate?

**A**: Absolutely. You can review documents and provide feedback via email. We'll handle the GitHub integration.

### Q: How flexible is the timeline?

**A**: Very flexible. This is a volunteer opportunity with no strict deadlines. Typical review takes 1 week, but we accommodate busy schedules.

### Q: What if I disagree with the guideline?

**A**: Perfect! Your critical feedback is exactly what we need. Score lower and explain why - we'll revise accordingly.

### Q: Can I apply for multiple languages?

**A**: If you're native/near-native in multiple languages, yes! Let us know your preference order.

### Q: What technical background is required?

**A**: None. If you can read the guideline and translation examples, you're qualified. Technical terms are explained in the glossary.

---

## 📞 Contact

-   **Primary Contact**: Comment on this issue
-   **Email**: [Your maintainer email]
-   **Project Maintainer**: @[Your GitHub username]

---

## 🚀 Join Us!

This is a fantastic opportunity to:

-   ✅ Contribute to **open-source education tools**
-   ✅ Help **students worldwide** learn programming
-   ✅ Gain **recognized portfolio contribution**
-   ✅ Join a **welcoming community**

**We can't do this without native speakers like you.** Thank you for considering this contribution!

---

**Issue Created**: October 17, 2025  
**Target Response Time**: 2-3 business days  
**Related Spec**: [`specs/002-i18n-localization-review/plan.md`](specs/002-i18n-localization-review/plan.md)  
**Parent Feature**: User Story 2 - "Create Localization Guidelines and Standards"
