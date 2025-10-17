# Korean Localization Guidelines (한국어 현지화 가이드라인)

**Language**: Korean (한국어)  
**Version**: 1.0.0  
**Last Updated**: 2025-10-17  
**Target Audience**: Native Korean speakers contributing translations  
**Educational Context**: Middle and high school students (중학교·고등학교) learning programming with Arduino

---

## 목차 (Table of Contents)

1. [Introduction](#introduction)
2. [Terminology Standards](#terminology-standards)
3. [Tone and Formality](#tone-and-formality)
4. [Cultural Context](#cultural-context)
5. [Technical Constraints](#technical-constraints)
6. [Common Mistakes](#common-mistakes)
7. [Review Checklist](#review-checklist)

---

## Introduction

### Purpose (목적)

This guideline ensures Korean translations in Singular Blockly feel **natural and culturally appropriate** for Korean students learning programming, not just word-for-word English translations.

이 가이드라인은 Singular Blockly의 한국어 번역이 단순한 영어 직역이 아닌, 프로그래밍을 배우는 한국 학생들에게 **자연스럽고 문화적으로 적절한** 표현이 되도록 보장합니다.

### Key Principles (기본 원칙)

1. **Follow Ministry of Education Standards**: Use terminology consistent with Korean CS education curriculum (정보 교과과정)
2. **Educational Tone**: Use 해요체 (informal polite) appropriate for student-facing educational software
3. **Technical Accuracy**: Maintain precision while using Korean educational standards
4. **Consistency**: Follow the centralized [terminology glossary](../localization-glossary.json)

---

## Terminology Standards

### Reference

All technical terms should first check the **[localization-glossary.json](../localization-glossary.json)** for approved translations.

### Hangul vs English Loanwords

#### Use Hangul (한글) for:

-   **Established Korean terms**: 함수 (function), 변수 (variable), 배열 (array), 조건문 (conditional statement)
-   **Common educational terms**: 반복문 (loop), 순차 (sequence), 선택 (selection)
-   **Naturalizable concepts**: 작업 공간 (workspace), 도구 상자 (toolbox)

#### Use English Loanwords (외래어) when:

-   **Widely recognized in CS**: 블록 (block), 디지털 (digital), 아날로그 (analog)
-   **Hardware terms**: 서보 모터 (servo motor), 센서 (sensor), 핀 (pin)
-   **No clear Korean equivalent**: 업로드 (upload), 컴파일 (compile)

#### Follow 외래어 표기법 (Foreign Word Notation Rules):

-   Use standard Korean spelling: 컴퓨터 (not 컴푸터), 프로그램 (not 프로그람)
-   Space compound terms correctly: 서보 모터 (not 서보모터)

### Examples

| ❌ Direct Translation | ✅ Localized (Natural Korean) | Rationale                                                                  |
| --------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| 로직                  | 제어 or 논리                  | 「로직」is transliteration. Use Korean term 제어 (control) or 논리 (logic) |
| 셋업 펑션             | setup 함수                    | Keep 'setup' in English, use Korean 함수 (function)                        |
| 디지탈 핀             | 디지털 핀                     | Correct spelling per 외래어 표기법                                         |
| if 스테이트먼트       | if 문                         | Use Korean 문 (statement), keep 'if' in English                            |

### Programming Keywords

**Keep these in English** (per Arduino/C++ standards):

-   `setup`, `loop`, `if`, `else`, `for`, `while`

**Example UI strings**:

-   ❌ "셋업 함수를 정의하세요"
-   ✅ "setup 함수를 정의하세요"

---

## Tone and Formality

### Register Selection: 해요체 (Informal Polite)

**Use 해요체** for all educational UI:

-   Instructions: "블록을 드래그하세요" (not 드래그하십시오)
-   Explanations: "이 블록은 LED를 제어해요" (or 제어합니다)
-   Error messages: "파일을 찾을 수 없어요"

**Avoid**:

-   ❌ 하십시오체 (formal polite): Too formal, creates distance with students
-   ❌ 반말 (casual speech): Too informal, inappropriate for educational software

**Rationale**: Korean educational software for middle/high school uses 해요체 to be friendly yet respectful.

### Spacing Rules (띄어쓰기)

**Critical for readability**:

-   Space between words: "서보 모터" (not "서보모터")
-   Space between nouns and particles: Generally no space, but follow standard Korean grammar
-   Space compound technical terms: "디지털 핀" (not "디지털핀")

### Examples

| ❌ Wrong Tone  | ✅ Correct (해요체) | Context                                  |
| -------------- | ------------------- | ---------------------------------------- |
| LED를 켜십시오 | LED를 켜세요        | Instruction (use 해요체, not 하십시오체) |
| 블록 드래그해  | 블록을 드래그하세요 | Too casual (use polite ending)           |
| 핀에출력합니다 | 핀에 출력합니다     | Need proper spacing                      |

---

## Cultural Context

### Educational Philosophy

Korean CS education emphasizes:

1. **Clear instruction**: Step-by-step, unambiguous directions
2. **Achievement-oriented**: Progress tracking and goal-setting
3. **Formality balance**: Respectful but approachable tone

**Translation implications**:

-   Use directive but polite language
-   Provide clear, measurable instructions
-   Balance respect with accessibility (해요체 achieves this)

### Examples and Metaphors

**Adapt culturally**:

-   Use familiar Korean contexts (e.g., "과학 실험처럼" - like a science experiment)
-   Avoid Western-specific references (use 축구 not baseball)
-   Reference Korean educational experiences when explaining concepts

### Ministry of Education Alignment

Reference terminology from Korean national curriculum (정보 교과과정):

-   **컴퓨팅 사고력** (computational thinking)
-   **순차, 선택, 반복** (sequence, selection, iteration)
-   **문제 해결** (problem-solving)

---

## Technical Constraints

### Character Length

Korean translations are typically **20-30% longer** than English due to:

-   Particles (은/는, 이/가, 을/를, 에, 에서)
-   Verb endings (세요, 합니다)
-   Spacing between words

**UI Rendering Limits**:

-   **Toolbox categories**: Max 8 characters
-   **Block labels**: Max 15 characters
-   **Tooltips**: Max 80 characters
-   **Error messages**: Max 120 characters

### Placeholder Variables

**Preserve exactly**:

-   `{0}`, `{1}`, `%1`, `%2` must remain unchanged
-   Ensure correct particle usage based on placeholder context

**Example**:

-   English: "Set pin {0} to {1}"
-   ✅ "핀 {0}을 {1}(으)로 설정하세요"

---

## Common Mistakes

### Mistake 1: Using Formal Polite (하십시오체)

❌ **Wrong**: "디지털 핀에 출력하십시오"  
✅ **Correct**: "디지털 핀에 출력하세요"

**Why**: 하십시오체 is too formal for student-facing educational software.

---

### Mistake 2: Incorrect Spacing (띄어쓰기)

❌ **Wrong**: "서보모터를제어합니다"  
✅ **Correct**: "서보 모터를 제어합니다"

**Why**: Proper spacing improves readability and follows Korean grammar rules.

---

### Mistake 3: Over-Transliteration

❌ **Wrong**: "로직 카테고리"  
✅ **Correct**: "제어" or "논리"

**Why**: Use established Korean terms instead of English transliterations when possible.

---

### Mistake 4: Inconsistent Terminology

❌ **Wrong**: Using both "함수" and "펑션" for "function"  
✅ **Correct**: Always use "함수"

**Why**: Consistency aids learning.

---

## Review Checklist

### ✅ Natural Phrasing (자연스러운 표현)

-   [ ] Sounds like native Korean
-   [ ] Proper spacing (띄어쓰기)
-   [ ] Correct particle usage (은/는, 이/가, 을/를)
-   **Score**: 1-5

### ✅ Technical Accuracy (기술적 정확성)

-   [ ] Terms match Korean CS education standards
-   [ ] Programming concepts correctly translated
-   **Score**: 1-5

### ✅ Cultural Appropriateness (문화적 적절성)

-   [ ] Tone is 해요체 (informal polite)
-   [ ] Examples culturally relevant
-   **Score**: 1-5

### ✅ Consistency (일관성)

-   [ ] Matches terminology glossary
-   [ ] Same term for same concept
-   **Score**: 1-5

---

## Resources

### Official References

-   [Korean Ministry of Education CS Curriculum](https://www.moe.go.kr/) - Official terminology
-   [Korean Language Society 외래어 표기법](https://kornorms.korean.go.kr/) - Foreign word notation rules
-   [National Institute of Korean Language](https://www.korean.go.kr/) - Standard Korean usage

### Internal Resources

-   [Terminology Glossary](../localization-glossary.json)
-   [Data Model](../data-model.md)
-   [Quickstart Guide](../quickstart.md)

---

## Version History

| Version | Date       | Changes                    | Reviewer                        |
| ------- | ---------- | -------------------------- | ------------------------------- |
| 1.0.0   | 2025-10-17 | Initial guideline creation | (Pending native speaker review) |
