# Data Model: i18n 審計機制優化

## 實體定義

### 1. WhitelistRule (白名單規則)

白名單規則定義哪些翻譯 key 應被排除在特定檢測類型之外。

```typescript
interface WhitelistRule {
	/** 規則唯一識別碼，使用 kebab-case */
	ruleId: string;

	/** 規則的簡短描述 */
	description: string;

	/** 適用的語言代碼陣列 */
	languages: LanguageCode[];

	/** 精確匹配的 key 陣列 (可選) */
	keys?: string[];

	/** glob 模式陣列，支援 * 萬用字元 (可選) */
	patterns?: string[];

	/** 規則存在的理由說明 */
	rationale: string;

	/** 範例 (可選) */
	examples?: Record<LanguageCode, string[]>;
}

type LanguageCode = 'en' | 'ja' | 'ko' | 'de' | 'zh-hant' | 'es' | 'fr' | 'it' | 'ru' | 'pl' | 'hu' | 'tr' | 'bg' | 'cs' | 'pt-br';
```

**驗證規則**:

-   `ruleId` 必須唯一且符合 `[a-z0-9-]+` 格式
-   `languages` 至少包含一個有效語言代碼
-   `keys` 或 `patterns` 至少需提供一項

### 2. WhitelistConfig (白名單設定)

完整的白名單設定檔結構。

```typescript
interface WhitelistConfig {
	/** 白名單版本號，遵循 semver */
	version: string;

	/** 白名單用途說明 */
	description: string;

	/** 最後更新時間 (ISO 8601) */
	lastUpdated: string;

	/** 依問題類型分組的排除規則 */
	exemptions: {
		lengthOverflow?: { description: string; rules: WhitelistRule[] };
		directTranslation?: { description: string; rules: WhitelistRule[] };
		missingTranslation?: { description: string; rules: WhitelistRule[] };
		culturalMismatch?: { description: string; rules: WhitelistRule[] };
		terminologyInconsistency?: { description: string; rules: WhitelistRule[] };
	};

	/** 使用說明 */
	usage: {
		description: string;
		implementation: string;
		priority: string;
	};

	/** 統計資訊 */
	statistics: {
		totalRules: number;
		affectedLanguages: LanguageCode[];
		estimatedFalsePositiveReduction: string;
	};

	/** 維護資訊 */
	maintenance: {
		reviewCycle: string;
		addNewRules: string;
		removeRules: string;
	};
}
```

### 3. AuditIssue (審計問題)

檢測器輸出的問題物件結構。

```typescript
interface AuditIssue {
	/** 翻譯 key */
	key: string;

	/** 目標語言 */
	language: LanguageCode;

	/** 問題類型 */
	issueType: IssueType;

	/** 嚴重性等級 */
	severity: SeverityLevel;

	/** 當前翻譯值 */
	currentValue: string;

	/** 建議值 (可選) */
	suggestedValue: string | null;

	/** 問題理由說明 */
	rationale: string;

	/** 使用頻率估計 (0-100) */
	frequency: number;

	/** 檢測方式 */
	detectedBy: 'automated' | 'manual';

	/** 檢測時間 */
	detectedAt: string;

	/** 額外元資料 (可選) */
	metadata?: {
		lengthRatio?: number;
		sourceLength?: number;
		targetLength?: number;
	};
}

type IssueType = 'missingTranslation' | 'directTranslation' | 'culturalMismatch' | 'lengthOverflow' | 'terminologyInconsistency';

type SeverityLevel = 'high' | 'medium' | 'low';
```

### 4. DetectorConfig (檢測器設定)

檢測器的可調整參數。

```typescript
interface DetectorConfig {
	/** 直接翻譯檢測設定 */
	directTranslation: {
		/** 一般語言的長度比對閾值 */
		defaultLengthTolerance: number; // 預設: 0.2 (±20%)

		/** CJK 語言的長度比對閾值 */
		cjkLengthTolerance: number; // 新增: 0.4 (±40%)
	};

	/** 長度溢出檢測設定 */
	lengthOverflow: {
		/** 一般語言的最小長度比例 */
		defaultMinRatio: number; // 預設: 0.5 (50%)

		/** CJK 語言的最小長度比例 */
		cjkMinRatio: number; // 新增: 0.3 (30%)

		/** 所有語言的最大長度比例 */
		maxRatio: number; // 保持: 1.5 (150%)
	};

	/** 文化不匹配檢測設定 */
	culturalMismatch: {
		/** 強制所有問題為此嚴重性 */
		forcedSeverity: SeverityLevel; // 新增: 'low'
	};
}
```

---

## 關係圖

```
┌─────────────────────────────────────────────────────────────┐
│                     WhitelistConfig                          │
│  version: "1.2.0"                                            │
│  lastUpdated: "2025-12-31T00:00:00Z"                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ contains
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       exemptions                             │
├─────────────────────────────────────────────────────────────┤
│  lengthOverflow:      { rules: WhitelistRule[] }            │
│  directTranslation:   { rules: WhitelistRule[] }            │
│  missingTranslation:  { rules: WhitelistRule[] }  ◄─── NEW  │
│  culturalMismatch:    { rules: WhitelistRule[] }            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ applies to
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       AuditIssue                             │
│  key: "CATEGORY_CYBERBRICK_LED"                             │
│  language: "ja"                                              │
│  issueType: "missingTranslation"                            │
│  severity: "low" (after culturalMismatch change)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ filtered by
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   whitelist-checker.js                       │
│  checkWhitelist(issue) → WhitelistMatch | null              │
│  filterIssues(issues) → FilterResult                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 新增白名單規則清單

### missingTranslation 類別

| ruleId                      | 說明                | 匹配 key/pattern                            |
| --------------------------- | ------------------- | ------------------------------------------- |
| `cyberbrick-brand-terms`    | CyberBrick 品牌名稱 | `BOARD_CYBERBRICK`, `CATEGORY_CYBERBRICK_*` |
| `technical-acronyms-global` | 國際技術縮寫        | `*_LED`, `*_GPIO`, `*_PWM`, etc.            |

### 所有類別 (helpurl-exclusion)

| ruleId              | 說明         | 匹配 pattern |
| ------------------- | ------------ | ------------ |
| `helpurl-exclusion` | 技術文件 URL | `*_HELPURL`  |

---

## 狀態轉換

### 問題嚴重性計算流程

```
[檢測器產出問題]
        │
        ▼
┌───────────────────┐
│ estimateFrequency │ → frequency (0-100)
└───────────────────┘
        │
        ▼
┌───────────────────────────────────────────────┐
│               determineSeverity                │
│  ┌─────────────────────────────────────────┐  │
│  │ if (issueType === 'culturalMismatch')   │  │
│  │   return 'low';  // ← NEW forced low    │  │
│  │ if (freq >= 70) return 'high';          │  │
│  │ if (freq >= 40) return 'medium';        │  │
│  │ return 'low';                           │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
        │
        ▼
┌───────────────────┐
│ checkWhitelist    │ → whitelisted? skip : keep
└───────────────────┘
        │
        ▼
[最終報告]
```

---

## 驗證規則摘要

1. **白名單版本**: 必須更新為 `1.2.0`
2. **lastUpdated**: 必須更新為 `2025-12-31T00:00:00Z`
3. **CJK 語言**: `ja`, `ko`, `zh-hant` 使用放寬閾值
4. **俄語 key**: `CONTROLS_IF_ELSE_TITLE_ELSE` 使用拉丁字母
5. **culturalMismatch**: 所有問題強制為 `low` 嚴重性
