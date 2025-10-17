# German Localization Guidelines (Deutsche Lokalisierungsrichtlinien)

**Language**: German (Deutsch)  
**Version**: 1.0.0  
**Last Updated**: 2025-10-17  
**Target Audience**: Native German speakers contributing translations  
**Educational Context**: Middle and high school students (Mittelstufe/Oberstufe) learning programming with Arduino

---

## Table of Contents

1. [Introduction](#introduction)
2. [Terminology Standards](#terminology-standards)
3. [Tone and Formality](#tone-and-formality)
4. [Common Mistakes](#common-mistakes)
5. [Review Checklist](#review-checklist)

---

## Introduction

### Purpose

This guideline ensures German translations in Singular Blockly feel **natural and culturally appropriate** for German-speaking students, not just word-for-word English translations.

Diese Richtlinie stellt sicher, dass deutsche Übersetzungen in Singular Blockly für deutschsprachige Schüler **natürlich und kulturell angemessen** wirken, nicht nur Wort-für-Wort-Übersetzungen aus dem Englischen.

### Key Principles

1. **Follow German CS Education Standards**: Use terminology consistent with Informatikunterricht curriculum
2. **Educational Tone**: Use informal imperative (suitable for instructional software)
3. **Compound Words**: Follow German compound word formation rules
4. **Consistency**: Follow the centralized [terminology glossary](../localization-glossary.json)

---

## Terminology Standards

### Reference

Check **[localization-glossary.json](../localization-glossary.json)** for approved German terms.

### German vs English Terms

#### Use German Compound Words for:

-   **Common concepts**: Servomotor, Ultraschallsensor, Arbeitsbereich (workspace)
-   **Established terms**: Funktion, Variable, Schleife (loop)

#### Keep English Terms when:

-   **Widely recognized**: Block, Array, Setup, Loop (Arduino standard)
-   **Technical jargon**: Pin, PWM, Serial Monitor

### Compound Word Formation Rules

-   **Single word without hyphen**: Servomotor (not Servo-Motor)
-   **Capitalization**: All nouns capitalized (Digitalpin, Analogpin, Lichtsensor)
-   **Clarity over brevity**: Use full compounds (Ultraschallsensor, not US-Sensor)

### Examples

| ❌ Direct Translation | ✅ German Localization | Rationale                        |
| --------------------- | ---------------------- | -------------------------------- |
| Servo Motor           | Servomotor             | Single German compound word      |
| Digital Pin           | Digitalpin             | Compound without hyphen          |
| If Statement          | if-Anweisung           | Keep 'if' in English with hyphen |
| Toolbox               | Werkzeugkasten         | German compound, not loanword    |

---

## Tone and Formality

### Avoid Formal "Sie" Address

**Use informal imperative** for instructions:

-   ✅ "Ziehe den Block in den Arbeitsbereich" (informal)
-   ❌ "Ziehen Sie den Block..." (too formal for students)

**Rationale**: German educational software for younger audiences uses informal direct address (Du-Form) or imperative without pronoun.

### Sentence Structure

-   Use clear, direct sentences
-   Avoid overly complex subordinate clauses
-   Prefer active voice over passive

---

## Common Mistakes

### Mistake 1: Incorrect Capitalization

❌ **Wrong**: "digital pin"  
✅ **Correct**: "Digitalpin"  
**Why**: All German nouns must be capitalized.

### Mistake 2: Over-Hyphenation

❌ **Wrong**: "Servo-Motor"  
✅ **Correct**: "Servomotor"  
**Why**: German prefers single compound words without hyphens.

### Mistake 3: Formal Address

❌ **Wrong**: "Laden Sie das Programm hoch"  
✅ **Correct**: "Lade das Programm hoch"  
**Why**: Informal tone appropriate for student audience.

---

## Review Checklist

### ✅ Natural Phrasing

-   [ ] Sounds like native German
-   [ ] Proper compound word formation
-   [ ] Correct capitalization
-   **Score**: 1-5

### ✅ Technical Accuracy

-   [ ] Terms match German CS education standards
-   [ ] Programming concepts correctly translated
-   **Score**: 1-5

### ✅ Cultural Appropriateness

-   [ ] Tone is informal/educational
-   [ ] No overly formal "Sie" address
-   **Score**: 1-5

### ✅ Consistency

-   [ ] Matches terminology glossary
-   **Score**: 1-5

---

## Resources

### Official References

-   [German Informatikunterricht Standards](https://www.kmk.org/) - CS education curriculum
-   [Duden](https://www.duden.de/) - German language authority

### Internal Resources

-   [Terminology Glossary](../localization-glossary.json)
-   [Data Model](../data-model.md)

---

## Version History

| Version | Date       | Changes           | Reviewer         |
| ------- | ---------- | ----------------- | ---------------- |
| 1.0.0   | 2025-10-17 | Initial guideline | (Pending review) |
