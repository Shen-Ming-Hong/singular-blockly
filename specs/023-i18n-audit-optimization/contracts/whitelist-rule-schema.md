# Whitelist Rule Schema Contract

## 概述

本文件定義白名單規則的 JSON Schema，用於驗證 `audit-whitelist.json` 檔案的正確性。

## JSON Schema

```json
{
	"$schema": "http://json-schema.org/draft-07/schema#",
	"$id": "https://singular-blockly/schemas/whitelist-rule.json",
	"title": "WhitelistRule",
	"description": "白名單規則定義",
	"type": "object",
	"required": ["ruleId", "description", "languages", "rationale"],
	"additionalProperties": false,
	"properties": {
		"ruleId": {
			"type": "string",
			"pattern": "^[a-z0-9-]+$",
			"description": "規則唯一識別碼，使用 kebab-case"
		},
		"description": {
			"type": "string",
			"minLength": 5,
			"description": "規則的簡短描述"
		},
		"languages": {
			"type": "array",
			"items": {
				"type": "string",
				"enum": ["en", "ja", "ko", "de", "zh-hant", "es", "fr", "it", "ru", "pl", "hu", "tr", "bg", "cs", "pt-br"]
			},
			"minItems": 1,
			"uniqueItems": true,
			"description": "適用的語言代碼陣列"
		},
		"keys": {
			"type": "array",
			"items": {
				"type": "string",
				"pattern": "^[A-Z][A-Z0-9_]*$"
			},
			"uniqueItems": true,
			"description": "精確匹配的 key 陣列"
		},
		"patterns": {
			"type": "array",
			"items": {
				"type": "string",
				"pattern": "^[A-Z0-9_*]+$"
			},
			"uniqueItems": true,
			"description": "glob 模式陣列，支援 * 萬用字元"
		},
		"rationale": {
			"type": "string",
			"minLength": 10,
			"description": "規則存在的理由說明"
		},
		"examples": {
			"type": "object",
			"additionalProperties": {
				"type": "array",
				"items": { "type": "string" }
			},
			"description": "各語言的範例"
		}
	},
	"anyOf": [{ "required": ["keys"] }, { "required": ["patterns"] }]
}
```

## 使用範例

### 有效的白名單規則

```json
{
	"ruleId": "cyberbrick-brand-terms",
	"description": "CyberBrick 品牌名稱保留英文",
	"languages": ["ja", "ko", "de", "zh-hant", "es"],
	"keys": ["BOARD_CYBERBRICK", "CATEGORY_CYBERBRICK_CORE", "CATEGORY_CYBERBRICK_LED"],
	"rationale": "CyberBrick 是品牌名稱，應在所有語言中保持英文以維持品牌識別度"
}
```

### 使用 pattern 的規則

```json
{
	"ruleId": "helpurl-exclusion",
	"description": "技術文件 URL 排除所有檢測",
	"languages": ["ja", "ko", "de", "zh-hant", "es"],
	"patterns": ["*_HELPURL"],
	"rationale": "HELPURL 指向英文技術文件，不需翻譯"
}
```

## 驗證錯誤訊息

| 錯誤碼                | 說明                    | 修正方式                 |
| --------------------- | ----------------------- | ------------------------ |
| `INVALID_RULE_ID`     | ruleId 格式錯誤         | 使用 kebab-case 格式     |
| `MISSING_LANGUAGES`   | 未指定語言              | 至少指定一個有效語言代碼 |
| `NO_KEYS_OR_PATTERNS` | 未指定 keys 或 patterns | 至少提供一項             |
| `DUPLICATE_RULE_ID`   | ruleId 重複             | 使用唯一的 ruleId        |
