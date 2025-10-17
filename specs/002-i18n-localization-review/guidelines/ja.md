# Japanese Localization Guidelines (日本語ローカライゼーションガイドライン)

**Language**: Japanese (日本語)  
**Version**: 1.0.0  
**Last Updated**: 2025-10-17  
**Target Audience**: Native Japanese speakers contributing translations  
**Educational Context**: Middle and high school students (中学校・高等学校) learning programming with Arduino

---

## 目次 (Table of Contents)

1. [Introduction](#introduction)
2. [Terminology Standards](#terminology-standards)
3. [Tone and Formality](#tone-and-formality)
4. [Cultural Context](#cultural-context)
5. [Technical Constraints](#technical-constraints)
6. [Common Mistakes](#common-mistakes)
7. [Review Checklist](#review-checklist)

---

## Introduction

### Purpose (目的)

This guideline ensures Japanese translations in Singular Blockly feel **natural and culturally appropriate** for Japanese students learning programming, not just word-for-word English translations.

このガイドラインは、Singular Blockly の日本語翻訳が、単なる英語の直訳ではなく、プログラミングを学ぶ日本の生徒にとって**自然で文化的に適切**であることを保証します。

### Key Principles (基本原則)

1. **Follow MEXT Standards**: Use terminology consistent with Japan's Ministry of Education (文部科学省) programming curriculum
2. **Educational Tone**: Polite but accessible language appropriate for middle/high school students
3. **Technical Accuracy**: Maintain precision while using Japanese educational standards
4. **Consistency**: Follow the centralized [terminology glossary](../localization-glossary.json)

---

## Terminology Standards

### Reference

All technical terms should first check the **[localization-glossary.json](../localization-glossary.json)** for approved translations.

### Kanji vs Katakana Guidelines

#### Use Kanji (漢字) for:

-   **Established programming concepts**: 関数 (function), 変数 (variable), 配列 (array), 制御 (control/logic)
-   **Mathematical terms**: 演算 (operation), 計算 (calculation)
-   **Common educational terms**: 設定 (setup), 繰り返し (loop/repeat)

#### Use Katakana (カタカナ) for:

-   **Foreign hardware terms**: サーボモーター (servo motor), センサー (sensor), ピン (pin)
-   **Software terms without Kanji equivalents**: ブロック (block), ワークスペース (workspace)
-   **Widely-recognized loanwords**: デジタル (digital), アナログ (analog), プログラム (program)

#### ⚠️ Avoid:

-   **Old-style katakana**: ディジタル → use デジタル
-   **Over-transliteration**: コンピュータープログラミングロジックフロー → too long, use 制御フロー

### Examples

| ❌ Direct Translation              | ✅ Localized (Natural Japanese) | Rationale                                                                   |
| ---------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| ロジック                           | 制御                            | 「制御」is the MEXT standard term for control flow/logic structures         |
| セットアップファンクション         | セットアップ関数                | Mix katakana + kanji for clarity. 「関数」is standard term                  |
| デジタルインプットアウトプットピン | デジタルピン                    | Avoid excessive transliteration. Context makes "pin" clear                  |
| コンディショナルステートメント     | if 文                           | Keep 'if' in English + 「文」(statement). Standard in Japanese CS education |

### Programming Keywords

**Keep these in English** (per Arduino/C++ standards):

-   `setup`, `loop`, `if`, `else`, `for`, `while`
-   These appear in code, so translations should reference the English keyword with Japanese explanation

**Example UI strings**:

-   ❌ "setup ファンクションを定義する"
-   ✅ "setup 関数を定義する"

---

## Tone and Formality

### Register Selection

**Use Polite Form (です・ます体)** for:

-   Instructions and explanations
-   Error messages
-   Descriptive text in dialogs

**Example**:

-   ❌ "LED を点灯する" (Plain form - too casual)
-   ✅ "LED を点灯します" (Polite form - appropriate for educational context)

**Plain Form (だ・である体) is acceptable** for:

-   Very short tooltips (space-constrained)
-   Block labels (where brevity is critical)
-   Technical documentation (if consistently applied)

**Example**:

-   Block label: "デジタルピンに出力" (short, plain form OK)
-   Tooltip: "指定したデジタルピンに HIGH または LOW を出力します" (polite form)

### Pronoun Usage

**Avoid pronouns when possible** (Japanese preference for omitting subjects):

-   ❌ "あなたはこのブロックを使って LED を制御することができます"
-   ✅ "このブロックで LED を制御できます"

**If pronouns needed**, use context-appropriate forms:

-   For students: Generally avoid "あなた" (too direct). Use implied subject or "みなさん" (everyone)
-   For system messages: Use 「プログラム」(the program) as subject, not "I" or "we"

### Particle Precision

Use particles correctly for clarity:

-   **を** for direct objects: "センサーを読み取る"
-   **に** for targets/directions: "ピンに出力する"
-   **で** for instruments/locations: "このブロックで制御する"

---

## Cultural Context

### Educational Philosophy

Japanese programming education emphasizes:

1. **Structured learning**: Step-by-step progression
2. **Group collaboration**: "みんなで" (together) mindset
3. **Precision**: Detailed explanations preferred over brevity

**Translation implications**:

-   Provide complete explanations rather than terse commands
-   Use inclusive language ("一緒に作りましょう" rather than "作れ")
-   Respect formal educational tone (avoid overly casual slang)

### Examples and Metaphors

**Adapt culturally**:

-   ❌ "Hit the compile button" → Violent imagery inappropriate
-   ✅ "コンパイルボタンを押してください" (Press the compile button)

**Use familiar contexts**:

-   When explaining concepts, reference Japanese educational contexts (e.g., "理科の実験のように" - like a science experiment)
-   Avoid Western-specific cultural references (baseball → サッカー or 運動会)

### MEXT Curriculum Alignment

Reference terminology from official Japanese programming education standards:

-   **プログラミング的思考** (computational thinking)
-   **制御構造** (control structures)
-   **順次処理、条件分岐、繰り返し** (sequence, selection, iteration)

**Source**: [MEXT Programming Education Guidelines](https://www.mext.go.jp/a_menu/shotou/zyouhou/detail/1416746.htm)

---

## Technical Constraints

### Character Length

Japanese translations are typically **40-60% longer** than English due to:

-   Full-width characters (全角)
-   Grammatical particles (は、を、に、で、が)
-   Politeness markers (です、ます)

**UI Rendering Limits**:

-   **Toolbox categories**: Max 10 characters
-   **Block labels**: Max 20 characters
-   **Tooltips**: Max 100 characters
-   **Error messages**: Max 150 characters

**Strategy**:

-   Prioritize clarity over brevity
-   Use abbreviations only when widely understood
-   Test rendering in actual UI before finalizing

### Special Characters

**Full-width vs Half-width**:

-   Use **half-width** (半角) for:
    -   English letters/numbers in code: `A0`, `digitalWrite()`
    -   Punctuation in technical contexts: `:`, `;`, `(`, `)`
-   Use **full-width** (全角) for:
    -   Japanese punctuation: 、。「」
    -   Numbers in prose: 1 つ、2 個

**Quotation Marks**:

-   Use Japanese quotation marks: 「」 (not "" or '')
-   Example: 「setup」関数 (not "setup"関数)

### Placeholder Variables

**Preserve exactly** as in English:

-   `{0}`, `{1}`, `%1`, `%2` must remain unchanged
-   Ensure placeholders are in correct sentence position per Japanese grammar

**Example**:

-   English: "Set pin {0} to {1}"
-   ❌ "ピン{0}を{1}に設定する" (grammatically wrong)
-   ✅ "ピン{0}に{1}を出力する" (correct particle usage)

---

## Common Mistakes

### Mistake 1: Direct Transliteration Without Meaning

❌ **Wrong**: "ロジックカテゴリー" (Logic Category - pure katakana)  
✅ **Correct**: "制御" (Control/Logic - meaningful kanji)

**Why**: "ロジック" is a direct transliteration that feels unnatural to Japanese students. "制御" is the established term in Japanese CS education.

---

### Mistake 2: Incorrect Politeness Level

❌ **Wrong**: "デジタルピンに書き込む" (Plain form - too casual for instructions)  
✅ **Correct**: "デジタルピンに書き込みます" (Polite form - appropriate for educational UI)

**Why**: Instructions should use です・ます form to maintain respectful educational tone.

---

### Mistake 3: Over-Explanation in Block Labels

❌ **Wrong**: "アナログピンから読み取った値を取得する" (24 characters - too long for block)  
✅ **Correct**: "アナログピンを読み取る" (11 characters - concise)

**Why**: Block labels must be brief. Detailed explanation belongs in tooltip, not label.

---

### Mistake 4: Inconsistent Terminology

❌ **Wrong**: Using both "関数" and "ファンクション" for "function"  
✅ **Correct**: Always use "関数" (function)

**Why**: Consistency aids learning. Students should see the same term for the same concept throughout the UI.

---

### Mistake 5: English Word Order in Japanese

❌ **Wrong**: "サーボモーターを 90 度に設定" (English-like structure)  
✅ **Correct**: "サーボモーターを 90 度に設定します" (proper verb ending)

**Why**: Japanese sentences require proper verb endings and particles. Plain verb stems feel incomplete.

---

### Mistake 6: Ignoring Context-Specific Meanings

❌ **Wrong**: "ピンを読む" (literal "read pin" - sounds odd)  
✅ **Correct**: "ピンの値を読み取る" (read the value from pin - natural)

**Why**: Japanese requires explicit object ("値" - value) for clarity.

---

## Review Checklist

Use this checklist when reviewing Japanese translations (native speakers):

### ✅ Natural Phrasing (自然な表現)

-   [ ] Translation sounds like it was written by a native Japanese speaker
-   [ ] Sentence structure follows Japanese grammar (SOV order, particles correct)
-   [ ] No awkward word-for-word English translations
-   **Score**: 1 (unnatural) to 5 (perfectly natural)

### ✅ Technical Accuracy (技術的正確性)

-   [ ] Technical terms match MEXT curriculum standards
-   [ ] Programming concepts are correctly translated
-   [ ] Hardware terminology uses glossary-approved terms
-   **Score**: 1 (incorrect) to 5 (perfectly accurate)

### ✅ Cultural Appropriateness (文化的適切性)

-   [ ] Tone is appropriate for Japanese middle/high school students
-   [ ] Politeness level matches educational context (です・ます体 for instructions)
-   [ ] Examples and metaphors are culturally relevant
-   **Score**: 1 (inappropriate) to 5 (culturally perfect)

### ✅ Consistency (一貫性)

-   [ ] Terminology matches localization-glossary.json
-   [ ] Same concept uses same translation throughout
-   [ ] Politeness level is consistent across similar UI elements
-   **Score**: 1 (inconsistent) to 5 (perfectly consistent)

### 📏 Technical Requirements (技術要件)

-   [ ] Character length within UI rendering limits
-   [ ] Placeholder variables ({0}, %1) preserved correctly
-   [ ] Full-width/half-width characters used appropriately
-   [ ] Japanese punctuation used correctly (、。「」)

### 🎯 Target Score

-   **High-frequency strings** (categories, common blocks): ≥4.5 average across 4 dimensions
-   **Medium-frequency strings** (tooltips, messages): ≥4.0 average
-   **Low-frequency strings** (advanced features): ≥3.5 average

---

## Feedback Template

When reviewing translations, provide structured feedback:

```markdown
**Translation Key**: CATEGORY_LOGIC  
**Current Value**: ロジック  
**Issue Type**: Direct Translation  
**Severity**: High

**Scores**:

-   Natural Phrasing: 2/5 (feels like transliteration)
-   Technical Accuracy: 3/5 (not incorrect, but not standard term)
-   Cultural Appropriateness: 3/5 (acceptable but not optimal)
-   Consistency: 4/5 (consistent katakana usage, but should use kanji)

**Suggested Value**: 制御

**Rationale**:
「制御」is the MEXT standard term for control flow/logic structures in programming education. This term appears in official Japanese CS curriculum documents and feels natural to Japanese students. Using 「ロジック」 (katakana transliteration) sounds foreign and less precise.

**Reference**: MEXT Programming Education Guidelines, page 23 (制御構造の理解)
```

---

## Resources

### Official References

-   [MEXT Programming Education Guidelines](https://www.mext.go.jp/a_menu/shotou/zyouhou/detail/1416746.htm) - Official curriculum terminology
-   [情報処理学会 用語辞典](https://www.ipsj.or.jp/) - Japan Information Processing Society terminology dictionary
-   [Blockly Official Japanese Translation](https://github.com/google/blockly/tree/master/msg/json/ja.json) - Reference (but adapt for educational context)

### Internal Resources

-   [Terminology Glossary](../localization-glossary.json) - Centralized term database
-   [Data Model](../data-model.md) - Translation quality issue structure
-   [Quickstart Guide](../quickstart.md) - How to contribute translations

---

## Version History

| Version | Date       | Changes                    | Reviewer                        |
| ------- | ---------- | -------------------------- | ------------------------------- |
| 1.0.0   | 2025-10-17 | Initial guideline creation | (Pending native speaker review) |

---

**Next Steps**:

1. **Native speaker review**: Recruit Japanese CS educator to validate this guideline
2. **Apply to existing translations**: Audit current `media/locales/ja/messages.js` using this guideline
3. **Iterate**: Update guideline based on review feedback and edge cases discovered

**Questions?** Open an issue with label `localization-ja` or contact the maintainers.
