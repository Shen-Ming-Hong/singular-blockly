# Research: i18n 審計機制優化

## 研究議題總覽

| #   | 議題                          | 狀態      | 結論                                        |
| --- | ----------------------------- | --------- | ------------------------------------------- |
| 1   | 俄語變數名稱錯誤確認          | ✅ 已完成 | 確認 `ELСЕ` 使用西里爾字母，需修正為 `ELSE` |
| 2   | CJK 語言長度閾值最佳實踐      | ✅ 已完成 | 建議 ±40% 直接翻譯、30% 最小長度            |
| 3   | 白名單規則設計模式            | ✅ 已完成 | 使用 glob 模式 + 精確 key 匹配              |
| 4   | culturalMismatch 降級影響評估 | ✅ 已完成 | 僅用於警告，不阻擋 PR                       |

---

## 1. 俄語變數名稱錯誤確認

### 問題描述

俄語翻譯檔案中 `CONTROLS_IF_ELSE_TITLE_ELSE` 的 key 名稱使用了西里爾字母而非拉丁字母。

### 發現

```javascript
// 俄語檔案 (media/locales/ru/messages.js) 第 272 行
CONTROLS_IF_ELSE_TITLE_ELСЕ: 'иначе',  // 錯誤：ELСЕ 的 С 和 Е 是西里爾字母

// 其他語言 (如英文、繁中、保加利亞文等)
CONTROLS_IF_ELSE_TITLE_ELSE: 'else',    // 正確：ELSE 是拉丁字母
```

### 驗證方法

使用 grep 搜尋結果顯示：

-   俄語：`CONTROLS_IF_ELSE_TITLE_ELСЕ` (不同於其他語言)
-   其他 14 種語言：`CONTROLS_IF_ELSE_TITLE_ELSE` (一致)

### 決策

-   **修正方式**: 將俄語檔案的 key 名稱從 `CONTROLS_IF_ELSE_TITLE_ELСЕ` 改為 `CONTROLS_IF_ELSE_TITLE_ELSE`
-   **風險**: 無，僅修正 key 名稱，翻譯值 `иначе` 保持不變
-   **驗證**: 修正後俄語應有 453 個 key（目前為 452 個）

---

## 2. CJK 語言長度閾值最佳實踐

### 問題描述

現有檢測器對 CJK 語言使用與其他語言相同的閾值，導致大量誤報。

### 現有閾值 (檢查 direct-translation.js, length-overflow.js)

```javascript
// direct-translation.js - hasDirectWordCount()
// CJK: 字元比率 0.8~1.2 視為直接翻譯
const ratio = targetCount / sourceCount;
return ratio > 0.8 && ratio < 1.2;

// length-overflow.js - checkLengthRatio()
// 所有語言: >150% 過長, <50% 過短
if (ratio > 1.5) return 'too-long';
if (ratio < 0.5) return 'too-short';
```

### 研究：CJK 語言特性

1. **字元效率**: CJK 語言每個字元承載更多語義

    - 英文 "Variables" (9 chars) → 日文 "変数" (2 chars) = 22%
    - 英文 "Digital Write" (13 chars) → 繁中 "數位寫入" (4 chars) = 31%
    - 英文 "Ultrasonic Sensor" (17 chars) → 韓文 "초음파 센서" (7 chars) = 41%

2. **業界參考**:
    - Google Material Design: CJK 翻譯預期為英文 0.5x-0.8x
    - Apple Human Interface Guidelines: CJK 文字密度更高
    - Mozilla L10N: 建議 CJK 放寬至 ±50% 容許範圍

### 決策

| 檢測類型             | 原閾值 | 新閾值 (CJK) | 理由                   |
| -------------------- | ------ | ------------ | ---------------------- |
| directTranslation    | ±20%   | ±40%         | CJK 自然長度差異較大   |
| lengthOverflow (min) | 50%    | 30%          | CJK 字元效率高達 0.3x  |
| lengthOverflow (max) | 150%   | 150%         | 保持不變，過長仍需警告 |

### 替代方案考量

-   **方案 A**: 完全關閉 CJK 長度檢測 → 拒絕（會遺漏真正問題）
-   **方案 B**: 使用字詞數而非字元數 → 拒絕（CJK 分詞複雜）
-   **方案 C**: 調整閾值 → 採用（平衡精確度與誤報率）

---

## 3. 白名單規則設計模式

### 問題描述

需要新增 CyberBrick 品牌名稱和技術縮寫的白名單規則。

### 現有白名單結構分析

```json
{
  "exemptions": {
    "issueType": {
      "rules": [{
        "ruleId": "unique-identifier",
        "description": "規則說明",
        "languages": ["ja", "ko", ...],
        "keys": ["EXACT_KEY_1", "EXACT_KEY_2"],
        "patterns": ["*_HELPURL", "CATEGORY_*"],
        "rationale": "為何排除的理由"
      }]
    }
  }
}
```

### 決策：新增規則設計

#### 規則 1: cyberbrick-brand-terms (missingTranslation)

```json
{
	"ruleId": "cyberbrick-brand-terms",
	"description": "CyberBrick 品牌名稱保留英文",
	"languages": ["ja", "ko", "de", "zh-hant", "es", "fr", "it", "ru", "pl", "hu", "tr", "bg", "cs", "pt-br"],
	"keys": ["BOARD_CYBERBRICK", "CATEGORY_CYBERBRICK_CORE", "CATEGORY_CYBERBRICK_LED", "CATEGORY_CYBERBRICK_GPIO", "CATEGORY_CYBERBRICK_TIME", "CATEGORY_CYBERBRICK_WIFI"],
	"rationale": "CyberBrick 是品牌名稱，應在所有語言中保持英文以維持品牌識別度"
}
```

#### 規則 2: technical-acronyms-global (missingTranslation)

```json
{
	"ruleId": "technical-acronyms-global",
	"description": "國際通用技術縮寫保留英文",
	"languages": ["ja", "ko", "de", "zh-hant", "es", "fr", "it", "ru", "pl", "hu", "tr", "bg", "cs", "pt-br"],
	"patterns": ["*_LED", "*_GPIO", "*_PWM", "*_I2C", "*_LCD", "*_UART", "*_WIFI"],
	"rationale": "LED、GPIO、PWM、I2C、LCD、UART、WiFi 是國際認可的技術縮寫，不應翻譯"
}
```

#### 規則 3: helpurl-exclusion (所有問題類型)

```json
{
	"ruleId": "helpurl-exclusion",
	"description": "技術文件 URL 排除所有檢測",
	"languages": ["ja", "ko", "de", "zh-hant", "es", "fr", "it", "ru", "pl", "hu", "tr", "bg", "cs", "pt-br"],
	"patterns": ["*_HELPURL"],
	"rationale": "HELPURL 指向英文技術文件，不需翻譯"
}
```

---

## 4. culturalMismatch 降級影響評估

### 問題描述

`culturalMismatch` 檢測需要母語者確認，在 AI 翻譯工作流程中產生阻擋性錯誤不合理。

### 現有行為分析

```javascript
// cultural-mismatch.js - determineSeverity()
function determineSeverity(key) {
	const freq = estimateFrequency(key);
	if (freq >= 70) return 'high';
	if (freq >= 40) return 'medium';
	return 'low';
}
```

### 檢測類型分析

1. **韓文敬體檢測**: 檢測 `습니다` (하십시오체) 而非 `해요체`

    - 問題：敬體選擇是文化偏好，非絕對錯誤
    - AI 無法判斷哪種更適合台灣學生

2. **德文 Sie 形式檢測**: 檢測正式 "Sie" 而非 "du"

    - 問題：取決於目標受眾年齡和教育機構偏好

3. **西班牙文 usted 檢測**: 檢測正式 "usted" 而非 "tú"
    - 問題：拉丁美洲各國用法差異大

### 決策

-   **修改 `determineSeverity()`**: 對所有 `culturalMismatch` 問題強制返回 `low`
-   **修改 GitHub Actions**: 在 PR 失敗判斷中排除 `culturalMismatch` 類型
-   **理由**: 文化適切性需人工審核，自動化工具僅提供參考

### 替代方案考量

-   **方案 A**: 完全移除 culturalMismatch 檢測 → 拒絕（仍有警告價值）
-   **方案 B**: 降級為 low severity → 採用（保留警告但不阻擋）
-   **方案 C**: 新增母語者確認機制 → 延後（超出本功能範圍）

---

## 實作優先順序

1. **P0 - 立即修復**: 俄語變數名稱錯誤
2. **P1 - 高優先**: 白名單規則新增 (CyberBrick、技術縮寫、HELPURL)
3. **P2 - 中優先**: CJK 閾值調整
4. **P3 - 低優先**: culturalMismatch 降級

## 參考資料

-   Issue #29: Translation audit false positives
-   Google Material Design Localization Guidelines
-   Mozilla L10N Style Guide
-   現有白名單: `scripts/i18n/audit-whitelist.json` v1.1.0
