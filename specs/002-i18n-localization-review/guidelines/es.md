# Spanish Localization Guidelines (Guías de Localización al Español)

**Language**: Spanish (Español)  
**Version**: 1.0.0  
**Last Updated**: 2025-10-17  
**Target Audience**: Native Spanish speakers contributing translations  
**Educational Context**: Middle and high school students learning programming with Arduino

---

## Tabla de Contenidos (Table of Contents)

1. [Introduction](#introduction)
2. [Terminology Standards](#terminology-standards)
3. [Tone and Formality](#tone-and-formality)
4. [Regional Variants](#regional-variants)
5. [Common Mistakes](#common-mistakes)
6. [Review Checklist](#review-checklist)

---

## Introduction

### Purpose (Propósito)

This guideline ensures Spanish translations in Singular Blockly feel **natural and culturally appropriate** for Spanish-speaking students, not just word-for-word English translations.

Esta guía asegura que las traducciones al español en Singular Blockly sean **naturales y culturalmente apropiadas** para estudiantes hispanohablantes, no solo traducciones literales del inglés.

### Key Principles (Principios Clave)

1. **Dialect Neutrality**: Use terminology that works across Spain and Latin America when possible
2. **Educational Tone**: Use tuteo (tú) for student-facing instructions
3. **Technical Accuracy**: Maintain precision using Spanish CS education standards
4. **Consistency**: Follow [terminology glossary](../localization-glossary.json)

---

## Terminology Standards

### Reference

Check **[localization-glossary.json](../localization-glossary.json)** for approved Spanish terms.

### Spanish vs English Technical Terms

#### Translate to Spanish when:

-   **Common concepts**: función (function), variable, bucle (loop), sensor
-   **Hardware terms**: servomotor, pin digital, pin analógico

#### Keep English when:

-   **Arduino standards**: setup, loop (function names that appear in code)
-   **Widely used**: array (though arreglo/matriz are acceptable alternatives)

### Compound Terms

**Spanish word order** (adjective after noun):

-   ✅ pin digital (not digital pin)
-   ✅ sensor ultrasónico (not ultrasonic sensor)
-   ✅ función setup (not setup function)

**Single word compounds**:

-   ✅ servomotor (not servo motor)

---

## Tone and Formality

### Use Tuteo (Tú), Not Usted

**Educational software for students**:

-   ✅ "Arrastra el bloque" (tú - informal)
-   ❌ "Arrastre el bloque" (usted - formal)

**Rationale**: Spanish educational materials for middle/high school use tuteo to create approachable learning environment.

### Imperative Mood for Instructions

Use direct commands without subject pronoun:

-   ✅ "Configura el pin digital" (Configure the digital pin)
-   ✅ "Compila el programa" (Compile the program)

### Avoid Anglicisms in Sentence Structure

-   ❌ "El pin puede ser configurado" (passive - English-like)
-   ✅ "Puedes configurar el pin" (active - natural Spanish)

---

## Regional Variants

### Spain vs Latin America

**When terms differ, prefer neutral or Latin American usage** (larger user base):

| Spain     | Latin America | English  | Recommended                     |
| --------- | ------------- | -------- | ------------------------------- |
| ordenador | computadora   | computer | computadora                     |
| ratón     | mouse         | mouse    | ratón (both regions understand) |
| archivo   | archivo       | file     | archivo (same)                  |

**For programming terms, usually universal**:

-   función, variable, bucle, array - work in all regions

### Spelling and Accent Marks

**Critical for correctness**:

-   función (not funcion)
-   compilación (not compilacion)
-   analógico (not analogico)

---

## Common Mistakes

### Mistake 1: Using Usted (Formal)

❌ **Wrong**: "Compile el programa"  
✅ **Correct**: "Compila el programa"  
**Why**: Students expect tuteo in educational software.

### Mistake 2: English Word Order

❌ **Wrong**: "digital pin"  
✅ **Correct**: "pin digital"  
**Why**: Spanish adjectives typically follow nouns.

### Mistake 3: Missing Accent Marks

❌ **Wrong**: "funcion" or "analogico"  
✅ **Correct**: "función", "analógico"  
**Why**: Accent marks are mandatory in Spanish orthography.

### Mistake 4: Over-Anglicization

❌ **Wrong**: "Clickea el botón" (from English "click")  
✅ **Correct**: "Haz clic en el botón" or "Pulsa el botón"  
**Why**: Use proper Spanish verbs, not anglicized inventions.

---

## Review Checklist

### ✅ Natural Phrasing (Expresión Natural)

-   [ ] Sounds like native Spanish
-   [ ] Adjectives after nouns (Spanish word order)
-   [ ] No anglicized sentence structures
-   **Score**: 1-5

### ✅ Technical Accuracy (Precisión Técnica)

-   [ ] Correct technical terminology
-   [ ] Programming concepts accurately translated
-   **Score**: 1-5

### ✅ Cultural Appropriateness (Adecuación Cultural)

-   [ ] Tuteo tone (not usted)
-   [ ] Culturally appropriate examples
-   **Score**: 1-5

### ✅ Consistency (Consistencia)

-   [ ] Matches terminology glossary
-   [ ] Same term for same concept
-   **Score**: 1-5

---

## Resources

### Official References

-   [Real Academia Española (RAE)](https://www.rae.es/) - Spanish language authority
-   [Fundéu BBVA](https://www.fundeu.es/) - Spanish language foundation (technology terms)

### Internal Resources

-   [Terminology Glossary](../localization-glossary.json)
-   [Data Model](../data-model.md)

---

## Version History

| Version | Date       | Changes           | Reviewer         |
| ------- | ---------- | ----------------- | ---------------- |
| 1.0.0   | 2025-10-17 | Initial guideline | (Pending review) |
