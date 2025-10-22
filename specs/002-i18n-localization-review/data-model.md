# Data Model: Internationalization Localization Quality Review

**Feature**: 002-i18n-localization-review  
**Date**: 2025-10-17  
**Purpose**: Define data structures for translation quality assessment, audit reporting, and localization guidelines

## Overview

This document defines the core data entities used throughout the localization quality improvement workflow. These models support three primary use cases:

1. **Translation Quality Assessment**: Structured representation of translation issues discovered during audit
2. **Audit Reporting**: Aggregated analysis for prioritization and tracking
3. **Localization Guidelines**: Structured documentation for cultural and linguistic guidance

All entities are designed to be serializable to JSON for file-based storage (no database required).

---

## Entity Definitions

### 1. TranslationQualityIssue

**Purpose**: Represents a single translation quality problem discovered during audit or review.

**Properties**:

| Property         | Type             | Required | Description                                                                            |
| ---------------- | ---------------- | -------- | -------------------------------------------------------------------------------------- |
| `key`            | string           | Yes      | Translation message key (e.g., `CATEGORY_LOGIC`, `ARDUINO_DIGITAL_WRITE`)              |
| `language`       | string           | Yes      | ISO 639-1 language code with optional region (e.g., `ja`, `ko`, `de`, `zh-hant`, `es`) |
| `issueType`      | IssueType enum   | Yes      | Category of quality issue (see IssueType definition below)                             |
| `severity`       | Severity enum    | Yes      | Impact level: `high`, `medium`, or `low`                                               |
| `currentValue`   | string           | Yes      | Existing translation text that has the issue                                           |
| `suggestedValue` | string \| null   | No       | Proposed improved translation (null if needs native speaker input)                     |
| `rationale`      | string           | Yes      | Explanation of why current translation is problematic and how suggestion improves it   |
| `frequency`      | number           | Yes      | Estimated usage frequency (0-100 scale, where 100 = appears on every page load)        |
| `detectedBy`     | string           | No       | Detection method: `automated`, `native-speaker-review`, or `user-feedback`             |
| `detectedAt`     | string (ISO8601) | No       | Timestamp when issue was identified                                                    |

**IssueType Enum**:

```typescript
enum IssueType {
	directTranslation = 'directTranslation', // Word-for-word English translation without cultural adaptation
	missingTranslation = 'missingTranslation', // Translation key exists but value is empty or English fallback
	inconsistentTerminology = 'inconsistentTerminology', // Same concept translated differently across UI
	culturalMismatch = 'culturalMismatch', // Translation technically correct but culturally inappropriate
	lengthOverflow = 'lengthOverflow', // Translation too long for UI constraints
	grammarError = 'grammarError', // Grammatical mistake in target language
	toneInconsistency = 'toneInconsistency', // Formal/informal mismatch with guideline standards
}
```

**Severity Enum**:

```typescript
enum Severity {
	high = 'high', // Blocks comprehension or causes confusion (e.g., category labels, error messages)
	medium = 'medium', // Noticeable but doesn't prevent usage (e.g., tooltips, common blocks)
	low = 'low', // Minor polish issue (e.g., rarely-used advanced features)
}
```

**Example**:

```json
{
	"key": "CATEGORY_LOGIC",
	"language": "ja",
	"issueType": "directTranslation",
	"severity": "high",
	"currentValue": "ロジック",
	"suggestedValue": "制御",
	"rationale": "「ロジック」is a direct transliteration. 「制御」(control/logic flow) is the standard term in Japanese programming education (MEXT curriculum).",
	"frequency": 95,
	"detectedBy": "native-speaker-review",
	"detectedAt": "2025-10-17T10:30:00Z"
}
```

#### Frequency Estimation Algorithm Specification

The `frequency` property uses a heuristic-based algorithm to estimate UI visibility. This specification will be implemented in `scripts/i18n/lib/audit-utils.js` (task T007).

**Algorithm**:

```javascript
/**
 * Frequency estimation algorithm for translation strings.
 * Scores represent estimated views per 30-minute user session.
 *
 * @param {string} key - Translation message key
 * @param {string} value - Translation message value (for context)
 * @returns {number} Frequency score (0-100)
 */
function estimateFrequency(key, value) {
	// Category 1: Always Visible (Score: 95)
	if (key.startsWith('CATEGORY_') || key.startsWith('TOOLBOX_') || key.startsWith('WORKSPACE_')) {
		return 95; // Core UI elements always displayed
	}

	// Category 2: High Usage Blocks (Score: 70)
	const commonBlocks = ['ARDUINO_DIGITAL_WRITE', 'ARDUINO_DIGITAL_READ', 'ARDUINO_ANALOG_WRITE', 'ARDUINO_ANALOG_READ', 'ARDUINO_DELAY', 'SERVO_WRITE', 'SERVO_READ', 'CONTROLS_IF', 'CONTROLS_REPEAT', 'MATH_NUMBER', 'LOGIC_COMPARE'];
	if (commonBlocks.includes(key)) {
		return 70; // Blocks used in >50% of beginner projects
	}

	// Category 3: Notifications (Score: 50)
	if (key.startsWith('ERROR_') || key.startsWith('WARNING_') || key.startsWith('SUCCESS_')) {
		return 50; // Important but conditional
	}

	// Category 4: Secondary Features (Score: 40)
	if (key.endsWith('_TOOLTIP') || key.endsWith('_HELPURL') || key.startsWith('SENSOR_') || key.startsWith('MOTOR_')) {
		return 40; // Hover/intermediate features
	}

	// Category 5: Advanced/Rare (Score: 20)
	if (key.startsWith('ADVANCED_') || key.includes('_MUTATOR_') || key.startsWith('LIST_') || key.startsWith('TEXT_') || key.startsWith('PROCEDURE_')) {
		return 20; // <10% of projects
	}

	// Default: Medium-low frequency
	return 30;
}
```

**Frequency Score Reference**:

| Score | Category       | Description                 | Examples                         |
| ----- | -------------- | --------------------------- | -------------------------------- |
| 95    | Always Visible | Constantly displayed UI     | Category labels, toolbox headers |
| 70    | High Usage     | >50% beginner projects      | digitalWrite, analogRead, servo  |
| 50    | Notifications  | Important but conditional   | Error messages                   |
| 40    | Secondary      | Hover/intermediate features | Tooltips, sensor blocks          |
| 30    | Default        | General purpose             | Miscellaneous blocks/UI          |
| 20    | Advanced/Rare  | <10% of projects            | Lists, procedures, mutators      |

**Validation**: Manual review of top 50 strings to confirm accuracy. Target distribution: ~15% score ≥70, ~30% score 40-69, ~55% score ≤39.

**Prioritization Usage**:

-   `frequency ≥ 70` + `severity = high` → P0 (top priority)
-   `frequency ≥ 50` + `severity = high` → P1 (second priority)
-   `frequency < 40` OR `severity = low` → P2 (deferred)

---

### 2. AuditReport

**Purpose**: Aggregated summary of translation quality audit results across all languages, used for prioritization and tracking progress.

**Properties**:

| Property               | Type                       | Required | Description                                                 |
| ---------------------- | -------------------------- | -------- | ----------------------------------------------------------- |
| `reportId`             | string                     | Yes      | Unique identifier (e.g., `audit-2025-10-17-baseline`)       |
| `generatedAt`          | string (ISO8601)           | Yes      | Report generation timestamp                                 |
| `auditScope`           | AuditScope                 | Yes      | What was audited (see AuditScope definition below)          |
| `totalIssues`          | number                     | Yes      | Total count of issues across all languages                  |
| `issuesBySeverity`     | SeveritySummary            | Yes      | Issue count breakdown by severity level                     |
| `issuesPerLanguage`    | Record<string, number>     | Yes      | Issue count per language code                               |
| `highFrequencyIssues`  | TranslationQualityIssue[]  | Yes      | Top 20 issues sorted by frequency (for prioritization)      |
| `recommendations`      | string[]                   | Yes      | Actionable next steps based on audit findings               |
| `coverageStats`        | CoverageStats              | Yes      | Audit coverage metrics (see CoverageStats definition below) |
| `comparisonToBaseline` | BaselineComparison \| null | No       | Change metrics if comparing to previous audit               |

**AuditScope** (nested object):

```typescript
interface AuditScope {
	languages: string[]; // Languages included in audit (e.g., ["ja", "ko", "de"])
	messageKeys: string[] | 'all'; // Specific keys audited or "all"
	auditMethods: string[]; // e.g., ["automated-checks", "native-speaker-review"]
}
```

**SeveritySummary** (nested object):

```typescript
interface SeveritySummary {
	high: number; // Count of high-severity issues
	medium: number; // Count of medium-severity issues
	low: number; // Count of low-severity issues
}
```

**CoverageStats** (nested object):

```typescript
interface CoverageStats {
	totalMessageKeys: number; // Total translatable strings in system
	auditedMessageKeys: number; // Number of keys reviewed
	coveragePercentage: number; // (audited / total) * 100
	languagesFullyAudited: string[]; // Languages with 100% coverage
	languagesPartiallyAudited: string[]; // Languages with <100% coverage
}
```

**BaselineComparison** (nested object):

```typescript
interface BaselineComparison {
	baselineReportId: string;
	issuesResolved: number; // Issues from baseline that are now fixed
	newIssuesFound: number; // New issues not in baseline
	qualityImprovement: number; // Percentage improvement (-100 to +100)
}
```

**Example**:

```json
{
	"reportId": "audit-2025-10-17-baseline",
	"generatedAt": "2025-10-17T15:45:00Z",
	"auditScope": {
		"languages": ["ja", "ko", "de", "zh-hant", "es"],
		"messageKeys": "all",
		"auditMethods": ["automated-checks", "native-speaker-review"]
	},
	"totalIssues": 127,
	"issuesBySeverity": {
		"high": 23,
		"medium": 64,
		"low": 40
	},
	"issuesPerLanguage": {
		"ja": 31,
		"ko": 28,
		"de": 19,
		"zh-hant": 25,
		"es": 24
	},
	"highFrequencyIssues": [
		{
			"key": "CATEGORY_LOGIC",
			"language": "ja",
			"issueType": "directTranslation",
			"severity": "high",
			"frequency": 95,
			"currentValue": "ロジック",
			"suggestedValue": "制御",
			"rationale": "Direct transliteration vs standard educational term"
		}
	],
	"recommendations": ["Prioritize 23 high-severity issues affecting toolbox categories and error messages", "Focus on Japanese (31 issues) and Korean (28 issues) for initial fixes", "Recruit native speaker reviewers for 15 medium-severity tooltip translations"],
	"coverageStats": {
		"totalMessageKeys": 387,
		"auditedMessageKeys": 387,
		"coveragePercentage": 100,
		"languagesFullyAudited": ["ja", "ko", "de", "zh-hant", "es"],
		"languagesPartiallyAudited": []
	},
	"comparisonToBaseline": null
}
```

---

### 3. LocalizationGuideline

**Purpose**: Structured representation of language-specific localization guidelines for native speaker contributors and reviewers.

**Properties**:

| Property               | Type                | Required | Description                                                             |
| ---------------------- | ------------------- | -------- | ----------------------------------------------------------------------- |
| `language`             | string              | Yes      | ISO 639-1 language code (e.g., `ja`, `ko`)                              |
| `languageName`         | string              | Yes      | Human-readable language name (e.g., `Japanese`, `Korean`)               |
| `region`               | string \| null      | No       | Regional variant if applicable (e.g., `Taiwan` for zh-hant)             |
| `version`              | string              | Yes      | Guideline version (semantic versioning, e.g., `1.0.0`)                  |
| `lastUpdated`          | string (ISO8601)    | Yes      | Last modification timestamp                                             |
| `reviewers`            | Reviewer[]          | Yes      | Native speakers who validated this guideline                            |
| `sections`             | GuidelineSection[]  | Yes      | Structured content sections (see GuidelineSection below)                |
| `terminologyReference` | string              | Yes      | Path to terminology glossary (e.g., `../../localization-glossary.json`) |
| `externalReferences`   | ExternalReference[] | No       | Links to educational standards, style guides, etc.                      |

**Reviewer** (nested object):

```typescript
interface Reviewer {
	name: string; // Reviewer's name (optional: can be GitHub username)
	nativeLanguage: string; // Primary native language
	expertise: string[]; // e.g., ["programming-education", "technical-translation"]
	reviewedAt: string; // ISO8601 timestamp
}
```

**GuidelineSection** (nested object):

```typescript
interface GuidelineSection {
	title: string; // Section heading (e.g., "Terminology Standards")
	order: number; // Display order (1-based)
	content: string; // Markdown-formatted guideline content
	examples: Example[]; // Concrete before/after examples
}
```

**Example** (nested within GuidelineSection):

```typescript
interface Example {
	before: string; // Problematic translation
	after: string; // Improved translation
	explanation: string; // Why the change improves quality
	category: string; // e.g., "hardware-terminology", "ui-instructions"
}
```

**ExternalReference** (nested object):

```typescript
interface ExternalReference {
	title: string; // Reference name
	url: string; // Link to resource
	description: string; // Why this reference is relevant
}
```

**Example**:

```json
{
	"language": "ja",
	"languageName": "Japanese",
	"region": null,
	"version": "1.0.0",
	"lastUpdated": "2025-10-17T16:00:00Z",
	"reviewers": [
		{
			"name": "Tanaka Hiroshi",
			"nativeLanguage": "ja",
			"expertise": ["programming-education", "STEM-curriculum"],
			"reviewedAt": "2025-10-17T16:00:00Z"
		}
	],
	"sections": [
		{
			"title": "Terminology Standards",
			"order": 1,
			"content": "# Terminology Standards\n\nFollow MEXT (Ministry of Education) programming curriculum terminology. Use Kanji for established technical terms, Katakana only for widely-recognized foreign borrowings.",
			"examples": [
				{
					"before": "ロジック",
					"after": "制御",
					"explanation": "「制御」is the standard term in Japanese CS education for control flow/logic structures.",
					"category": "programming-concepts"
				},
				{
					"before": "アナログピン",
					"after": "アナログピン",
					"explanation": "Keep 「アナログピン」 (analog pin) - no established Kanji equivalent for this hardware term.",
					"category": "hardware-terminology"
				}
			]
		},
		{
			"title": "Tone and Formality",
			"order": 2,
			"content": "# Tone and Formality\n\nUse polite form (です・ます体) for instructions and explanations. Plain form (だ・である体) acceptable for tooltips and short labels where space is limited.",
			"examples": [
				{
					"before": "LEDを点灯する",
					"after": "LEDを点灯します",
					"explanation": "Instructions should use polite form 「ます」 for educational context.",
					"category": "ui-instructions"
				}
			]
		}
	],
	"terminologyReference": "../../localization-glossary.json",
	"externalReferences": [
		{
			"title": "MEXT Programming Education Guidelines",
			"url": "https://www.mext.go.jp/a_menu/shotou/zyouhou/detail/1416746.htm",
			"description": "Official Japanese Ministry of Education programming curriculum terminology standards"
		}
	]
}
```

---

### 4. TerminologyEntry

**Purpose**: Single entry in the centralized terminology glossary (`localization-glossary.json`) for ensuring consistency across languages.

**Properties**:

| Property       | Type                        | Required | Description                                                   |
| -------------- | --------------------------- | -------- | ------------------------------------------------------------- |
| `englishTerm`  | string                      | Yes      | Canonical English term (lowercase, words separated by spaces) |
| `category`     | TermCategory enum           | Yes      | Term classification (see TermCategory below)                  |
| `translations` | Record<string, Translation> | Yes      | Translation for each language (key = language code)           |
| `notes`        | string                      | No       | Additional context about term usage or importance             |
| `aliases`      | string[]                    | No       | Alternative English phrasings (for search/matching)           |

**TermCategory Enum**:

```typescript
enum TermCategory {
	hardware = 'hardware', // Physical components (servo, sensor, board)
	software = 'software', // Programming concepts (function, variable, loop)
	ui = 'ui', // Interface elements (toolbox, workspace, menu)
	educational = 'educational', // Pedagogical terms (tutorial, example, lesson)
	blockly = 'blockly', // Blockly-specific terms (block, category, workspace)
}
```

**Translation** (nested object):

```typescript
interface Translation {
	term: string; // Translated term in target language
	usage: string; // Usage guideline (e.g., "Always capitalize", "Use katakana")
	alternatives: string[]; // Acceptable alternative translations (if any)
	contextNote?: string; // When to use this vs alternatives
}
```

**Example**:

```json
{
	"englishTerm": "servo motor",
	"category": "hardware",
	"translations": {
		"ja": {
			"term": "サーボモーター",
			"usage": "カタカナ表記を使用。「サーボ」のみも可だが文脈で明確な場合のみ。",
			"alternatives": ["サーボ"],
			"contextNote": "Full term 「サーボモーター」 preferred for clarity in educational context"
		},
		"ko": {
			"term": "서보 모터",
			"usage": "외래어 표기법 준수. 띄어쓰기 필수.",
			"alternatives": [],
			"contextNote": "No abbreviation - always spell out full term"
		},
		"de": {
			"term": "Servomotor",
			"usage": "Ein Wort ohne Bindestrich. Kapitalisierung als Substantiv.",
			"alternatives": ["Servo-Motor"],
			"contextNote": "Prefer single word compound (Servomotor) per standard German technical writing"
		},
		"zh-hant": {
			"term": "伺服馬達",
			"usage": "台灣常用術語。避免使用「伺服電機」（大陸用語）。",
			"alternatives": ["伺服機"],
			"contextNote": "「伺服馬達」 is Taiwan standard; 「伺服電機」 is mainland China variant"
		},
		"es": {
			"term": "servomotor",
			"usage": "Una palabra, sin guion. Minúscula excepto al inicio de oración.",
			"alternatives": ["servo motor", "servo"],
			"contextNote": "Single word preferred in technical Spanish"
		}
	},
	"notes": "Common hardware component in Arduino projects. High frequency in UI (appears in toolbox, examples, tutorials).",
	"aliases": ["servo", "rc servo", "hobby servo"]
}
```

---

## Glossary Structure

The complete terminology glossary file (`localization-glossary.json`) has this top-level structure:

```json
{
	"version": "1.0.0",
	"lastUpdated": "2025-10-17T16:30:00Z",
	"languages": ["ja", "ko", "de", "zh-hant", "es"],
	"termCount": 87,
	"terms": [
		{
			"englishTerm": "servo motor",
			"category": "hardware",
			"translations": {
				/* ... */
			}
		},
		{
			"englishTerm": "digital pin",
			"category": "hardware",
			"translations": {
				/* ... */
			}
		}
		// ... 85 more terms
	]
}
```

---

### 5. WhitelistRule

**Purpose**: Single rule in audit whitelist configuration (`audit-whitelist.json`) for filtering known false positives during automated translation checks.

**Properties**:

| Property       | Type         | Required | Description                                                            |
| -------------- | ------------ | -------- | ---------------------------------------------------------------------- |
| `id`           | string       | Yes      | Unique rule identifier (e.g., `WL-001`, `WL-002`)                      |
| `name`         | string       | Yes      | Human-readable rule name (e.g., "Blockly API Required English Terms")  |
| `pattern`      | string       | Yes      | String or glob pattern to match against violation text                 |
| `rationale`    | string       | Yes      | Explanation of why this pattern is whitelisted                         |
| `addedBy`      | string       | Yes      | GitHub username of person who added rule                               |
| `addedAt`      | string (ISO) | Yes      | Timestamp when rule was added                                          |
| `lastReviewed` | string (ISO) | No       | Timestamp of last governance review (Q5 health check)                  |
| `matchCount`   | number       | No       | Number of violations matched in last audit run (updated automatically) |
| `tags`         | string[]     | No       | Tags for categorization (e.g., `["api-constraint", "hardware-term"]`)  |

**Example**:

```json
{
	"id": "WL-001",
	"name": "Blockly Workspace API Terms",
	"pattern": "*workspace*",
	"rationale": "Blockly core API requires 'workspace' term in English for technical accuracy",
	"addedBy": "maintainer-username",
	"addedAt": "2025-10-22T10:30:00Z",
	"lastReviewed": "2025-10-22T10:30:00Z",
	"matchCount": 12,
	"tags": ["api-constraint", "blockly-core"]
}
```

---

### 6. RuleHealthMetrics

**Purpose**: Aggregated statistics for whitelist rule effectiveness monitoring (per Clarifications Q5-B). Generated during each audit run to track rule usage and identify stale rules.

**Properties**:

| Property            | Type                   | Required | Description                                                    |
| ------------------- | ---------------------- | -------- | -------------------------------------------------------------- |
| `generatedAt`       | string (ISO)           | Yes      | Metrics generation timestamp                                   |
| `totalRules`        | number                 | Yes      | Total whitelist rules in configuration                         |
| `totalViolations`   | number                 | Yes      | Total violations before filtering                              |
| `filteredCount`     | number                 | Yes      | Total violations filtered by whitelist                         |
| `filterRate`        | number                 | Yes      | Percentage filtered: `(filteredCount / totalViolations) * 100` |
| `perRuleStats`      | RuleStatistic[]        | Yes      | Per-rule match statistics (see RuleStatistic below)            |
| `staleRules`        | string[]               | Yes      | Rule IDs with <5 matches in last 3 months (flagged for review) |
| `topRules`          | string[]               | Yes      | Top 5 rule IDs by match count (most effective filters)         |
| `recommendedAction` | Record<string, string> | Yes      | Per-rule recommendation: `"keep"`, `"review"`, or `"remove"`   |
| `auditReportId`     | string                 | Yes      | Reference to associated AuditReport for traceability           |

**RuleStatistic** (nested object):

```typescript
interface RuleStatistic {
	ruleId: string; // Whitelist rule ID (e.g., "WL-001")
	matchCount: number; // Violations matched in this audit run
	lastMatched: string | null; // ISO timestamp of last match (null if no matches)
	trend: 'increasing' | 'stable' | 'decreasing'; // Match count trend over last 3 audits
}
```

**Example**:

```json
{
	"generatedAt": "2025-10-22T15:00:00Z",
	"totalRules": 8,
	"totalViolations": 1692,
	"filteredCount": 149,
	"filterRate": 8.8,
	"perRuleStats": [
		{
			"ruleId": "WL-001",
			"matchCount": 45,
			"lastMatched": "2025-10-22T15:00:00Z",
			"trend": "stable"
		},
		{
			"ruleId": "WL-008",
			"matchCount": 3,
			"lastMatched": "2025-09-15T10:30:00Z",
			"trend": "decreasing"
		}
	],
	"staleRules": ["WL-008"],
	"topRules": ["WL-001", "WL-002", "WL-003", "WL-004", "WL-005"],
	"recommendedAction": {
		"WL-001": "keep",
		"WL-008": "review"
	},
	"auditReportId": "audit-2025-10-22-post-whitelist"
}
```

---

## Relationships

```
AuditReport
  └── contains multiple TranslationQualityIssue[]
      └── each references a message key that should be translated per LocalizationGuideline
          └── which references TerminologyEntry[] in glossary
  └── associated with RuleHealthMetrics (via auditReportId)

RuleHealthMetrics
  └── contains RuleStatistic[] for each WhitelistRule
      └── references WhitelistRule by ruleId

WhitelistRule
  └── used by audit scripts to filter TranslationQualityIssue[]
  └── tracked by RuleHealthMetrics for governance
```

LocalizationGuideline
└── terminologyReference points to glossary
└── examples demonstrate application of TerminologyEntry translations

````

---

## Validation Rules

### TranslationQualityIssue Validation

-   `frequency` must be 0-100 (inclusive)
-   `language` must match ISO 639-1 pattern (`^[a-z]{2}(-[a-z]{4})?$`)
-   If `issueType` is `directTranslation`, `suggestedValue` should be provided
-   If `severity` is `high`, `frequency` should typically be ≥50 (user-facing elements)

### AuditReport Validation

-   `totalIssues` must equal sum of `issuesBySeverity.high + medium + low`
-   `issuesPerLanguage` sum must equal `totalIssues`
-   `coveragePercentage` must be `(auditedMessageKeys / totalMessageKeys) * 100`
-   `highFrequencyIssues` array should be sorted by `frequency` descending

### TerminologyEntry Validation

-   All languages in `translations` keys must match `LocalizationGuideline` language set
-   `englishTerm` must be unique across all entries
-   Each `Translation.term` must be non-empty
-   `category` must be one of defined TermCategory values

---

## Usage Examples

### Creating an Audit Issue Programmatically

```typescript
const issue: TranslationQualityIssue = {
	key: 'ARDUINO_SETUP',
	language: 'ko',
	issueType: 'toneInconsistency',
	severity: 'medium',
	currentValue: '아두이노를 설정하십시오',
	suggestedValue: '아두이노를 설정하세요',
	rationale: 'Korean guideline specifies 해요체 (informal polite) for educational context. Current translation uses 하십시오체 (formal polite).',
	frequency: 75,
	detectedBy: 'native-speaker-review',
	detectedAt: new Date().toISOString(),
};
````

### Querying High-Priority Issues from Audit Report

```typescript
const highPriorityIssues = auditReport.highFrequencyIssues.filter(issue => issue.severity === 'high' && issue.frequency > 80).slice(0, 10); // Top 10 highest-impact issues
```

### Looking Up Terminology for Translation

```typescript
const glossary = JSON.parse(fs.readFileSync('localization-glossary.json', 'utf-8'));
const servoTerm = glossary.terms.find(t => t.englishTerm === 'servo motor');
const japaneseTerm = servoTerm.translations.ja.term; // "サーボモーター"
```

---

## File Locations

| Entity                  | Storage Location                                                               | Format          |
| ----------------------- | ------------------------------------------------------------------------------ | --------------- |
| TranslationQualityIssue | `audit-reports/{reportId}.json` → `issues` array                               | JSON            |
| AuditReport             | `audit-reports/{reportId}.json`                                                | JSON            |
| LocalizationGuideline   | `guidelines/{language}.json` (metadata) + `guidelines/{language}.md` (content) | JSON + Markdown |
| TerminologyEntry        | `localization-glossary.json` → `terms` array                                   | JSON            |
| WhitelistRule           | `scripts/i18n/audit-whitelist.json` → `rules` array                            | JSON            |
| RuleHealthMetrics       | `audit-reports/rule-health-{date}.json`                                        | JSON            |

**Directory Structure**:

```
specs/002-i18n-localization-review/
├── localization-glossary.json          # Centralized terminology
├── audit-reports/                      # Audit outputs (timestamped)
│   ├── audit-2025-10-17-baseline.json
│   ├── audit-2025-10-25-post-fixes.json
│   └── rule-health-2025-10-22.json    # Rule effectiveness metrics (Q5)
├── guidelines/                         # Per-language guidelines
│   ├── ja.json + ja.md
│   ├── ko.json + ko.md
│   ├── de.json + de.md
│   ├── zh-hant.json + zh-hant.md
│   └── es.json + es.md
└── KNOWN-ISSUES.md                     # Documented remaining violations (Q4)

scripts/i18n/
├── audit-whitelist.json                # Whitelist rules configuration
├── audit-translations.js               # Main audit script
└── lib/
    └── whitelist-checker.js            # Rule matching engine
```

---

## Extension Points

### Future Entity Additions (Out of Scope for P1/P2)

-   **UserFeedback**: Capture user-reported translation issues from in-app feedback mechanism
-   **TranslationHistory**: Track change history for each message key (who changed, when, why)
-   **ReviewSession**: Structure for tracking native speaker review sessions with multiple reviewers
-   **AutomatedTestResult**: Results from CI/CD translation validation checks

These extensions can be added in P3 (automation phase) without breaking existing data structures.

---

## Summary

This data model provides:

✅ **Structured issue tracking** via TranslationQualityIssue  
✅ **Prioritization support** via AuditReport with frequency and severity  
✅ **Guideline enforcement** via LocalizationGuideline with examples  
✅ **Terminology consistency** via TerminologyEntry with usage rules  
✅ **Validation rules** ensuring data quality  
✅ **Extensibility** for future automation features

All entities are JSON-serializable and file-based (no database infrastructure required), aligning with the project's Simplicity principle.
