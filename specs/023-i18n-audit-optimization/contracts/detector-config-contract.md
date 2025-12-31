# Detector Configuration Contract

## 概述

本文件定義各檢測器的可調整參數介面，用於 CJK 語言閾值調整和 culturalMismatch 降級。

## 介面定義

### 直接翻譯檢測 (direct-translation.js)

```typescript
/**
 * 檢查翻譯長度是否與原文過於接近（暗示直接翻譯）
 *
 * @param sourceText - 英文原文
 * @param translatedText - 翻譯文字
 * @param language - 目標語言代碼
 * @returns 是否為直接翻譯
 */
function hasDirectWordCount(sourceText: string, translatedText: string, language: string): boolean;
```

**參數調整**:

| 語言類型 | 原閾值         | 新閾值         | 說明                   |
| -------- | -------------- | -------------- | ---------------------- |
| 一般語言 | ±20% (0.8~1.2) | ±20% (不變)    | 保持現有行為           |
| CJK 語言 | ±20% (0.8~1.2) | ±40% (0.6~1.4) | 放寬以適應字元效率差異 |

**CJK 語言定義**: `['ja', 'ko', 'zh', 'zh-hant', 'zh-hans']`

### 長度溢出檢測 (length-overflow.js)

```typescript
/**
 * 檢查翻譯長度是否在可接受範圍內
 *
 * @param ratio - 翻譯長度 / 原文長度
 * @param language - 目標語言代碼 (新增參數)
 * @returns 問題類型或 null
 */
function checkLengthRatio(
	ratio: number,
	language?: string // 新增可選參數
): 'too-long' | 'too-short' | null;
```

**參數調整**:

| 檢測類型  | 語言類型 | 原閾值 | 新閾值       |
| --------- | -------- | ------ | ------------ |
| too-long  | 所有語言 | >150%  | >150% (不變) |
| too-short | 一般語言 | <50%   | <50% (不變)  |
| too-short | CJK 語言 | <50%   | <30% (放寬)  |

### 文化不匹配檢測 (cultural-mismatch.js)

```typescript
/**
 * 決定問題嚴重性
 *
 * @param key - 翻譯 key
 * @param issueType - 問題類型 (新增參數，用於判斷是否強制 low)
 * @returns 嚴重性等級
 */
function determineSeverity(
	key: string,
	issueType?: string // 新增可選參數
): 'high' | 'medium' | 'low';
```

**行為變更**:

```javascript
// 修改前
function determineSeverity(key) {
	const freq = estimateFrequency(key);
	if (freq >= 70) return 'high';
	if (freq >= 40) return 'medium';
	return 'low';
}

// 修改後 (cultural-mismatch.js 專用)
function determineSeverity(key) {
	// culturalMismatch 強制返回 low
	return 'low';
}
```

## GitHub Actions 失敗條件

### 修改前

```yaml
# 所有高嚴重度問題都會導致失敗
if (highSeverityCount > 10) {
// 建立 issue
}
```

### 修改後

```yaml
# 排除 culturalMismatch 類型後計算高嚴重度問題
const nonCulturalHighSeverity = issues.filter(
i => i.severity === 'high' && i.issueType !== 'culturalMismatch'
).length;

if (nonCulturalHighSeverity > 10) {
// 建立 issue
}
```

## 測試案例

### 直接翻譯檢測

| 案例     | 原文            | 翻譯           | 語言 | 比率 | 預期結果                       |
| -------- | --------------- | -------------- | ---- | ---- | ------------------------------ |
| TC-DT-01 | "Variables" (9) | "変数" (2)     | ja   | 22%  | ❌ 不報告 (CJK 閾值 60%~140%)  |
| TC-DT-02 | "Text" (4)      | "Text" (4)     | de   | 100% | ✅ 報告 (一般閾值 80%~120% 內) |
| TC-DT-03 | "Logic" (5)     | "ロジック" (5) | ja   | 100% | ✅ 報告 (過度音譯)             |

### 長度溢出檢測

| 案例     | 原文                 | 翻譯           | 語言    | 比率 | 預期結果                 |
| -------- | -------------------- | -------------- | ------- | ---- | ------------------------ |
| TC-LO-01 | "Digital Write" (13) | "數位寫入" (4) | zh-hant | 31%  | ❌ 不報告 (CJK 下限 30%) |
| TC-LO-02 | "Hello World" (11)   | "Hi" (2)       | de      | 18%  | ✅ 報告 too-short        |
| TC-LO-03 | "OK" (2)             | "確定" (2)     | zh-hant | 100% | ❌ 不報告                |

### 文化不匹配檢測

| 案例     | 翻譯                  | 語言 | 檢測類型   | 預期嚴重性 |
| -------- | --------------------- | ---- | ---------- | ---------- |
| TC-CM-01 | "함수를 실행하십시오" | ko   | 敬體過度   | `low`      |
| TC-CM-02 | "Bitte drücken Sie"   | de   | 使用 Sie   | `low`      |
| TC-CM-03 | "Por favor, usted..." | es   | 使用 usted | `low`      |
