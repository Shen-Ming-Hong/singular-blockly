# Traditional Chinese Localization Guidelines (繁體中文在地化指南)

**Language**: Traditional Chinese (繁體中文 - 台灣)  
**Version**: 1.0.0  
**Last Updated**: 2025-10-17  
**Target Audience**: Native Traditional Chinese speakers (Taiwan) contributing translations  
**Educational Context**: Middle and high school students (國中、高中) learning programming with Arduino

---

## 目錄 (Table of Contents)

1. [Introduction](#introduction)
2. [Terminology Standards](#terminology-standards)
3. [Tone and Formality](#tone-and-formality)
4. [Taiwan vs Other Regions](#taiwan-vs-other-regions)
5. [Common Mistakes](#common-mistakes)
6. [Review Checklist](#review-checklist)

---

## Introduction

### Purpose (目的)

This guideline ensures Traditional Chinese translations in Singular Blockly feel **natural and culturally appropriate** for Taiwanese students, not just direct translations from English or Simplified Chinese.

本指南確保 Singular Blockly 的繁體中文翻譯對台灣學生而言是**自然且文化上適切**的，而非僅是英文或簡體中文的直譯。

### Key Principles (基本原則)

1. **Follow Taiwan Education Standards**: Use terminology from Taiwan's 12-Year Basic Education curriculum (十二年國教課綱)
2. **Taiwan-Specific Terms**: Use Taiwan standard terms, not mainland China variants
3. **Educational Tone**: Clear, formal but accessible language
4. **Consistency**: Follow [terminology glossary](../localization-glossary.json)

---

## Terminology Standards

### Reference

Check **[localization-glossary.json](../localization-glossary.json)** for Taiwan-approved terms.

### Taiwan vs Mainland China Terminology

**Always use Taiwan standards**:

| ❌ Mainland China | ✅ Taiwan | English     |
| ----------------- | --------- | ----------- |
| 程序              | 程式      | program     |
| 文件夾            | 資料夾    | folder      |
| 傳感器            | 感測器    | sensor      |
| 伺服電機          | 伺服馬達  | servo motor |
| 鼠標              | 滑鼠      | mouse       |
| 內存              | 記憶體    | memory      |
| 函數              | 函式      | function    |

**Rationale**: Taiwan has distinct terminology standards established by Ministry of Education. Using mainland terms confuses Taiwanese students.

### Hardware Terminology

**台灣常用表達**:

-   數位腳位 (not 數字引腳) - digital pin
-   類比腳位 (not 模擬引腳) - analog pin
-   伺服馬達 (not 伺服電機) - servo motor
-   感測器 (not 傳感器) - sensor

---

## Tone and Formality

### Formal But Accessible

**Use standard formal Chinese**:

-   Clear instructions without excessive politeness particles
-   Avoid overly casual or colloquial expressions
-   Use standard grammar (避免口語化)

**Examples**:

-   ✅ "請設定數位腳位" (Clear, formal)
-   ❌ "麻煩設定一下數位腳位喔" (Too casual with 喔)

### Sentence Structure

-   Use clear, concise sentences
-   Prefer active constructions
-   Place modifiers before nouns (standard Chinese word order)

---

## Taiwan vs Other Regions

### Character Variants

**Use Taiwan standard characters**:

-   台灣 (not 臺灣 for UI - though both acceptable)
-   程式 (Taiwan) vs 程序 (mainland)
-   滑鼠 (Taiwan) vs 鼠標 (mainland)

### Punctuation

**Use proper full-width punctuation**:

-   Full-width comma: ，(not ,)
-   Full-width period: 。(not .)
-   Quotation marks: 「」(not "" or 『』for primary quotes)

**Half-width for technical contexts**:

-   English text: `setup`, `loop`
-   Numbers in code: `A0`, `13`
-   Mathematical operators: `+`, `-`, `*`, `/`

---

## Common Mistakes

### Mistake 1: Using Simplified Chinese Terms

❌ **Wrong**: "传感器" (simplified character)  
✅ **Correct**: "感測器" (traditional + Taiwan term)  
**Why**: Must use traditional characters and Taiwan-specific terminology.

### Mistake 2: Mainland China Terminology

❌ **Wrong**: "函数" or "函數" (mainland term)  
✅ **Correct**: "函式" (Taiwan term)  
**Why**: Taiwan education uses 函式, not 函數.

### Mistake 3: Incorrect Punctuation

❌ **Wrong**: "設定數位腳位。"(half-width period after Chinese)  
✅ **Correct**: "設定數位腳位。"(full-width period)  
**Why**: Chinese text uses full-width punctuation.

### Mistake 4: Over-Casualization

❌ **Wrong**: "把這個積木拖曳過來喔" (too casual with 喔)  
✅ **Correct**: "將此積木拖曳至此處" (formal, educational)  
**Why**: Educational software should maintain formal tone.

---

## Review Checklist

### ✅ Natural Phrasing (自然表達)

-   [ ] Sounds like native Taiwan Chinese
-   [ ] Proper sentence structure
-   [ ] No direct English translation patterns
-   **Score**: 1-5

### ✅ Technical Accuracy (技術準確性)

-   [ ] Terms match Taiwan education standards
-   [ ] Uses Taiwan-specific terminology (not mainland)
-   **Score**: 1-5

### ✅ Cultural Appropriateness (文化適切性)

-   [ ] Formal educational tone
-   [ ] Taiwan cultural context
-   **Score**: 1-5

### ✅ Consistency (一致性)

-   [ ] Matches terminology glossary
-   [ ] Consistent use of Taiwan terms
-   **Score**: 1-5

---

## Resources

### Official References

-   [Taiwan Ministry of Education Dictionary](https://dict.revised.moe.edu.tw/) - Standard terminology
-   [12-Year Basic Education Curriculum](https://www.naer.edu.tw/) - Education standards
-   [National Academy for Educational Research](https://www.naer.edu.tw/) - Curriculum terminology

### Internal Resources

-   [Terminology Glossary](../localization-glossary.json)
-   [Data Model](../data-model.md)

---

## Version History

| Version | Date       | Changes           | Reviewer         |
| ------- | ---------- | ----------------- | ---------------- |
| 1.0.0   | 2025-10-17 | Initial guideline | (Pending review) |
