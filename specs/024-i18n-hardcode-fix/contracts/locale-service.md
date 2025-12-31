# LocaleService API 合約

**功能**: 024-i18n-hardcode-fix  
**日期**: 2025-12-31

---

## 概述

`LocaleService` 是多語言服務類別，負責處理所有與國際化相關的功能。本合約定義強化後的回退鏈機制。

---

## 介面定義

### getLocalizedMessage

```typescript
/**
 * 獲取本地化訊息
 *
 * @param key - 訊息鍵名（如 'SAFETY_WARNING_BODY_NO_TYPE'）
 * @param fallback - 可選，當所有翻譯都找不到時的預設值
 * @param args - 可選，用於替換訊息中 {0}, {1} 等佔位符的參數
 * @returns Promise<string> - 翻譯後的訊息
 *
 * @remarks
 * 回退順序：
 * 1. 當前語言翻譯 (如 zh-hant/messages.js)
 * 2. 英文翻譯 (en/messages.js)
 * 3. fallback 參數
 * 4. key 本身（最後手段）
 *
 * @example
 * // 基本用法
 * const msg = await localeService.getLocalizedMessage('BUTTON_CONTINUE');
 *
 * // 帶 fallback
 * const msg = await localeService.getLocalizedMessage(
 *   'BUTTON_CONTINUE',
 *   'Continue'
 * );
 *
 * // 帶參數
 * const msg = await localeService.getLocalizedMessage(
 *   'BACKUP_CONFIRM_DELETE',
 *   'Are you sure you want to delete "{0}"?',
 *   backupName
 * );
 */
async getLocalizedMessage(
    key: string,
    fallback?: string,
    ...args: any[]
): Promise<string>;
```

---

## 行為規範

### 成功情境

| 情境                   | 輸入                                    | 預期輸出    |
| ---------------------- | --------------------------------------- | ----------- |
| 當前語言有翻譯         | `key='BUTTON_CONTINUE'`, lang=`zh-hant` | `'繼續'`    |
| 當前語言無翻譯，英文有 | `key='NEW_KEY'`, lang=`zh-hant`         | 英文翻譯值  |
| 都無翻譯，有 fallback  | `key='UNKNOWN'`, `fallback='Default'`   | `'Default'` |
| 都無翻譯，無 fallback  | `key='UNKNOWN'`                         | `'UNKNOWN'` |

### 參數替換

| 情境         | 輸入                                    | 預期輸出            |
| ------------ | --------------------------------------- | ------------------- |
| 單一參數     | `key='DELETE {0}'`, `args=['file.txt']` | `'DELETE file.txt'` |
| 多參數       | `key='{0} to {1}'`, `args=['A', 'B']`   | `'A to B'`          |
| 無參數需替換 | `key='Simple text'`, `args=['ignored']` | `'Simple text'`     |

### 錯誤處理

| 情境                  | 行為                               |
| --------------------- | ---------------------------------- |
| 翻譯檔案載入失敗      | 返回 fallback 或 key，記錄錯誤日誌 |
| 翻譯檔案格式錯誤      | 返回空物件，使用回退機制           |
| key 為空字串          | 返回空字串                         |
| key 為 null/undefined | 拋出 TypeError                     |

---

## 快取行為

-   翻譯檔案在首次載入後會被快取
-   每種語言獨立快取
-   快取儲存在 `this.cachedMessages: Map<string, UIMessages>`
-   無主動失效機制（擴充功能生命週期內有效）

---

## 相容性

### 向後相容

舊的呼叫方式仍然有效：

```typescript
// 舊方式（仍支援）
await localeService.getLocalizedMessage('KEY');
await localeService.getLocalizedMessage('KEY', arg1, arg2);

// 新方式（推薦）
await localeService.getLocalizedMessage('KEY', 'Fallback', arg1, arg2);
```

### 簽章變更

```typescript
// 舊簽章
getLocalizedMessage(key: string, ...args: any[]): Promise<string>

// 新簽章
getLocalizedMessage(key: string, fallback?: string, ...args: any[]): Promise<string>
```

### 相容性處理策略

為確保向後相容，實作需採用以下策略：

1. **型別偵測**：檢查第二參數是否為字串

    - 若為字串：視為 `fallback` 參數
    - 若為非字串（數字、物件等）：視為 `args[0]`，fallback 使用 `undefined`

2. **實作範例**：

```typescript
async getLocalizedMessage(key: string, fallbackOrArg?: string | any, ...args: any[]): Promise<string> {
    let fallback: string | undefined;
    let actualArgs: any[];

    // 偵測第二參數型別
    if (typeof fallbackOrArg === 'string') {
        // 新方式：第二參數是 fallback 字串
        fallback = fallbackOrArg;
        actualArgs = args;
    } else if (fallbackOrArg !== undefined) {
        // 舊方式：第二參數是 args[0]
        fallback = undefined;
        actualArgs = [fallbackOrArg, ...args];
    } else {
        fallback = undefined;
        actualArgs = args;
    }
    // ... 後續處理
}
```

3. **遷移建議**：
    - 現有呼叫點無需立即修改
    - 新程式碼建議使用明確的 fallback 參數
    - 若舊程式碼的第一個參數恰好是字串且代表 args[0]，需檢查並調整

**⚠️ 已知相容性風險**：若現有程式碼呼叫如 `getLocalizedMessage('KEY', 'someValue')` 且 `'someValue'` 原本是 args[0]（非 fallback），行為會改變。經程式碼審查，目前 Extension Host 端無此用法，安全。
