# Data Model: 非 Blockly 專案警告的 i18n 完善與孩子友善文案改進

**Feature Branch**: `047-warning-i18n-kid-friendly`  
**Date**: 2025-07-15

---

## 實體定義

### Entity 1: SafetyGuardMessage（安全守衛訊息）

描述安全守衛對話框中顯示給使用者的完整訊息集合。

| 欄位 | 型別 | 說明 | 驗證規則 |
|------|------|------|----------|
| `SAFETY_WARNING_BODY_NO_TYPE` | `string` | 無偵測到專案類型時的警告本文 | ≤ 200 字元；不含 `{0}` 占位符 |
| `SAFETY_WARNING_BODY_WITH_TYPE` | `string` | 偵測到專案類型時的警告本文 | ≤ 200 字元；必須包含恰好一個 `{0}` 占位符 |
| `BUTTON_CONTINUE` | `string` | 「繼續」按鈕顯示文字 | ≤ 15 字元 |
| `BUTTON_CANCEL` | `string` | 「取消」按鈕文字（語系檔一致性用，對話框不額外渲染） | ≤ 15 字元 |
| `BUTTON_SUPPRESS` | `string` | 「不再提醒」按鈕顯示文字 | ≤ 15 字元 |
| `SAFETY_GUARD_CANCELLED` | `string` | 使用者取消後的回饋訊息 | ≤ 100 字元 |
| `SAFETY_GUARD_SUPPRESSED` | `string` | 使用者選擇不再提醒後的回饋訊息 | ≤ 100 字元 |

**主鍵**: 語系代碼（locale code, e.g., `en`, `zh-hant`）  
**儲存位置**: `media/locales/{locale}/messages.js`

---

### Entity 2: LocaleMessageFile（語系訊息檔）

描述每個語系的訊息資源檔。

| 欄位 | 型別 | 說明 |
|------|------|------|
| locale | `string` | 語系代碼 (ISO 639-1 / BCP 47) |
| filePath | `string` | 檔案路徑 `media/locales/{locale}/messages.js` |
| messageKeys | `Record<string, string>` | 全部訊息鍵值對（包含安全守衛以外的其他鍵值） |

**支援語系清單** (15 個):

| 語系代碼 | 語言名稱 | 語系特性備註 |
|----------|---------|-------------|
| `en` | English | 基準語系，fallback 來源 |
| `bg` | Български (保加利亞文) | 西里爾字母 |
| `cs` | Čeština (捷克文) | 拉丁字母，含變音符號 |
| `de` | Deutsch (德文) | 拉丁字母，單詞偏長 |
| `es` | Español (西班牙文) | 拉丁字母 |
| `fr` | Français (法文) | 拉丁字母，含重音符號 |
| `hu` | Magyar (匈牙利文) | 拉丁字母，含變音符號 |
| `it` | Italiano (義大利文) | 拉丁字母 |
| `ja` | 日本語 (日文) | CJK，字元寬度 ≈ 2x 拉丁 |
| `ko` | 한국어 (韓文) | CJK，字元寬度 ≈ 2x 拉丁 |
| `pl` | Polski (波蘭文) | 拉丁字母，含變音符號 |
| `pt-br` | Português (巴西葡萄牙文) | 拉丁字母 |
| `ru` | Русский (俄文) | 西里爾字母 |
| `tr` | Türkçe (土耳其文) | 拉丁字母 |
| `zh-hant` | 繁體中文 | CJK，字元寬度 ≈ 2x 拉丁 |

---

### Entity 3: FallbackMessage（後備訊息）

描述 TypeScript 原始碼中的硬編碼後備文案，用於 i18n 服務失敗時。

| 檔案 | 位置 | 欄位 | 修改內容 |
|------|------|------|----------|
| `src/services/workspaceValidator.ts` | catch block (~L206-227) | fallbackMessage (no type) | 改為孩子友善英文，與 `en/messages.js` 一致 |
| `src/services/workspaceValidator.ts` | catch block (~L206-227) | fallbackMessage (with type) | 改為孩子友善英文，與 `en/messages.js` 一致 |
| `src/services/workspaceValidator.ts` | catch block (~L216) | 按鈕文字 'Continue' | 改為與 `en/messages.js` BUTTON_CONTINUE 一致 |
| `src/services/workspaceValidator.ts` | catch block (~L216) | 按鈕文字 'Do Not Remind' | 改為與 `en/messages.js` BUTTON_SUPPRESS 一致 |
| `src/services/workspaceValidator.ts` | catch block (~L219, L221) | selection 比對字串 | 需與上方按鈕文字同步更新 |
| `src/webview/webviewManager.ts` | ~L187 | SAFETY_GUARD_CANCELLED fallback | 從中文改為孩子友善英文 |
| `src/webview/webviewManager.ts` | ~L194-196 | SAFETY_GUARD_SUPPRESSED fallback | 從中文改為孩子友善英文 |

---

### Entity 4: MESSAGE_KEYS（訊息鍵值常量）

定義於 `src/types/safetyGuard.ts`，為安全守衛訊息的型別安全常量。

```typescript
export const MESSAGE_KEYS = {
  SAFETY_WARNING_BODY_NO_TYPE: 'SAFETY_WARNING_BODY_NO_TYPE',
  SAFETY_WARNING_BODY_WITH_TYPE: 'SAFETY_WARNING_BODY_WITH_TYPE',
  BUTTON_CONTINUE: 'BUTTON_CONTINUE',
  BUTTON_CANCEL: 'BUTTON_CANCEL',
  BUTTON_SUPPRESS: 'BUTTON_SUPPRESS',
} as const;
```

> **注意**: `SAFETY_GUARD_CANCELLED` 與 `SAFETY_GUARD_SUPPRESSED` 未定義在 `MESSAGE_KEYS` 中，而是在 `webviewManager.ts` 中以字串直接引用。本功能不改變此結構。

---

## 關係圖

```text
┌─────────────────────┐     ┌──────────────────────────────┐
│   MESSAGE_KEYS      │     │    LocaleMessageFile         │
│   (safetyGuard.ts)  │────▶│    (messages.js × 15 語系)   │
│   定義 5 個鍵值      │     │    儲存 7 個鍵值的翻譯文案   │
└─────────────────────┘     └──────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────┐     ┌──────────────────────────────┐
│  FallbackMessage    │     │    SafetyGuardMessage        │
│  (TS 硬編碼後備)    │────▶│    (使用者最終看到的訊息)    │
│  workspaceValidator │     │    透過 VS Code 模態對話框   │
│  webviewManager     │     │    或資訊訊息呈現            │
└─────────────────────┘     └──────────────────────────────┘
```

---

## 狀態轉換

安全守衛對話框的使用者互動狀態：

```text
                    ┌──────────────────────┐
                    │  安全守衛觸發         │
                    │  (顯示警告對話框)     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │ BUTTON_     │  │ BUTTON_      │  │ 模態取消     │
    │ CONTINUE    │  │ SUPPRESS     │  │ (ESC/關閉)   │
    │ 「好，幫我  │  │ 「我知道了， │  │              │
    │  準備好！」 │  │  以後不用再  │  │              │
    │             │  │  問」        │  │              │
    └──────┬──────┘  └──────┬──────┘  └──────┬───────┘
           │                │                 │
           ▼                ▼                 ▼
    return 'continue'  return 'suppress'  return 'cancel'
           │                │                 │
           ▼                ▼                 ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ 建立積木     │ │ 儲存偏好     │ │ 顯示         │
    │ 專案結構     │ │ + 建立積木   │ │ CANCELLED    │
    │              │ │ 專案結構     │ │ 回饋訊息     │
    │              │ │ + 顯示       │ │              │
    │              │ │ SUPPRESSED   │ │              │
    │              │ │ 回饋訊息     │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 驗證規則摘要

| 規則 | 適用鍵值 | 檢查方式 |
|------|---------|----------|
| 字元長度 ≤ 200 | BODY_NO_TYPE, BODY_WITH_TYPE | 自動化測試 |
| 字元長度 ≤ 15 | BUTTON_CONTINUE, BUTTON_CANCEL, BUTTON_SUPPRESS | 自動化測試 |
| 字元長度 ≤ 100 | GUARD_CANCELLED, GUARD_SUPPRESSED | 自動化測試 |
| 包含恰好一個 `{0}` | BODY_WITH_TYPE | 自動化測試 |
| 不包含 `{0}` | BODY_NO_TYPE | 自動化測試 |
| 所有 15 語系都有此鍵值 | 全部 7 個鍵值 | 自動化測試 |
| 不含技術術語 | BODY_*, BUTTON_*, GUARD_* | 人工審閱（品質清單） |
| Fallback 與 en 版本一致 | workspaceValidator, webviewManager | 自動化測試 |
