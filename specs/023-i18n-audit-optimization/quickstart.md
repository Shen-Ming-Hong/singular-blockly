# Quickstart: i18n 審計機制優化

## 概述

本功能解決 Issue #29 中報告的翻譯審計誤報問題，透過以下方式減少誤報：

1. 擴展白名單涵蓋 CyberBrick 品牌名稱和國際技術縮寫
2. 為 CJK 語言放寬檢測閾值
3. 降級文化適切性檢測的嚴重性
4. 修復俄語翻譯中的變數名稱錯誤

## 快速驗證

```bash
# 執行翻譯審計（修改前）
npm run validate:i18n

# 檢查高嚴重度問題數量 (目標: 從 31 降至 5 以下)
```

## 修改檔案清單

| 檔案                                               | 修改類型      | 說明                               |
| -------------------------------------------------- | ------------- | ---------------------------------- |
| `scripts/i18n/audit-whitelist.json`                | 新增規則      | CyberBrick 品牌、技術縮寫、HELPURL |
| `scripts/i18n/lib/detectors/direct-translation.js` | 調整閾值      | CJK ±40%                           |
| `scripts/i18n/lib/detectors/length-overflow.js`    | 調整閾值      | CJK 30% 下限                       |
| `scripts/i18n/lib/detectors/cultural-mismatch.js`  | 修改嚴重性    | 強制 low                           |
| `media/locales/ru/messages.js`                     | 修復 key 名稱 | 西里爾字母 → 拉丁字母              |
| `.github/workflows/i18n-validation.yml`            | 修改判斷條件  | 排除 culturalMismatch              |

## 實作步驟

### 步驟 1: 修復俄語變數名稱 (優先)

```javascript
// media/locales/ru/messages.js 第 272 行
// 修改前 (錯誤 - 使用西里爾字母 С 和 Е)
CONTROLS_IF_ELSE_TITLE_ELСЕ: 'иначе',

// 修改後 (正確 - 使用拉丁字母)
CONTROLS_IF_ELSE_TITLE_ELSE: 'иначе',
```

### 步驟 2: 更新白名單

在 `audit-whitelist.json` 的 `missingTranslation.rules` 陣列中新增：

```json
{
  "ruleId": "cyberbrick-brand-terms",
  "description": "CyberBrick 品牌名稱保留英文",
  "languages": ["ja", "ko", "de", "zh-hant", "es", "fr", "it", "ru", "pl", "hu", "tr", "bg", "cs", "pt-br"],
  "keys": [
    "BOARD_CYBERBRICK",
    "CATEGORY_CYBERBRICK_CORE",
    "CATEGORY_CYBERBRICK_LED",
    "CATEGORY_CYBERBRICK_GPIO",
    "CATEGORY_CYBERBRICK_TIME",
    "CATEGORY_CYBERBRICK_WIFI"
  ],
  "rationale": "CyberBrick 是品牌名稱，應在所有語言中保持英文"
},
{
  "ruleId": "technical-acronyms-global",
  "description": "國際通用技術縮寫保留英文",
  "languages": ["ja", "ko", "de", "zh-hant", "es", "fr", "it", "ru", "pl", "hu", "tr", "bg", "cs", "pt-br"],
  "patterns": ["*LED*", "*GPIO*", "*PWM*", "*I2C*", "*UART*", "*WIFI*"],
  "rationale": "LED、GPIO、PWM、I2C、UART、WiFi 是國際認可的技術縮寫"
}
```

### 步驟 3: 調整 CJK 閾值

```javascript
// direct-translation.js - hasDirectWordCount()
function hasDirectWordCount(sourceText, translatedText, language) {
	const isCJK = ['ja', 'ko', 'zh', 'zh-hant', 'zh-hans'].includes(language);

	// ... 計算 ratio ...

	if (isCJK) {
		// 修改: 從 0.8~1.2 改為 0.6~1.4 (±40%)
		return ratio > 0.6 && ratio < 1.4;
	}
	// 一般語言維持 0.9~1.1 (±10%)
	return ratio > 0.9 && ratio < 1.1;
}
```

```javascript
// length-overflow.js - checkLengthRatio()
function checkLengthRatio(ratio, language) {
	const isCJK = ['ja', 'ko', 'zh', 'zh-hant', 'zh-hans'].includes(language);

	if (ratio > 1.5) return 'too-long';

	// 修改: CJK 使用 30% 下限
	const minRatio = isCJK ? 0.3 : 0.5;
	if (ratio < minRatio) return 'too-short';

	return null;
}
```

### 步驟 4: 降級 culturalMismatch

```javascript
// cultural-mismatch.js - determineSeverity()
function determineSeverity(key) {
	// 強制所有 culturalMismatch 問題為 low
	return 'low';
}
```

### 步驟 5: 更新白名單版本

```json
{
	"version": "1.2.0",
	"lastUpdated": "2025-12-31T00:00:00Z"
}
```

## 驗證方法

### 驗收測試

```bash
# 1. 執行審計
npm run validate:i18n

# 2. 檢查結果
# - 高嚴重度問題 < 5
# - CyberBrick 相關 key 無報告
# - *_HELPURL 無報告
# - 俄語 key 數量 = 453
```

### 手動驗證

1. **俄語 if-else 顯示**: 開啟俄語介面，確認 if-else 積木顯示「иначе」
2. **CJK 誤報減少**: 對比修改前後報告，確認 ja/ko/zh-hant 問題減少 50%+

## 相關文件

-   [spec.md](spec.md) - 功能規格
-   [research.md](research.md) - 研究發現
-   [data-model.md](data-model.md) - 資料模型
-   [contracts/](contracts/) - API 契約
