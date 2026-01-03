````markdown
# 內部合約: 內部更新保護機制

**Version**: 1.0  
**Created**: 2026-01-03

## 概述

定義 Extension 端（`webviewManager.ts`）用於防止內部儲存操作觸發 FileWatcher 重載的保護機制。

---

## 問題背景

當 Extension 執行內部儲存操作（自動儲存、備份等）時，FileWatcher 會偵測到檔案變更並觸發 `loadWorkspace`。這會導致：

1. 不必要的工作區重載
2. Undo Stack 被清空
3. 與拖曳操作的競態條件

原有的布林旗標機制無法處理：

-   **連續快速儲存**：新儲存在舊保護過期前開始
-   **檔案系統延遲**：網路磁碟、防毒軟體等造成 FileWatcher 事件大幅延遲

---

## 狀態變數

### internalUpdateCount

```typescript
/**
 * 追蹤進行中的內部更新操作數量
 * 當 > 0 時，FileWatcher 應跳過重載
 */
private internalUpdateCount: number = 0;
```

### internalUpdateTimer

```typescript
/**
 * 用於延遲遞減計數器的計時器
 * 每次新操作開始時清除，確保保護視窗正確延長
 */
private internalUpdateTimer?: NodeJS.Timeout;
```

---

## 常數

### INTERNAL_UPDATE_PROTECTION_MS

```typescript
/**
 * 內部更新保護視窗持續時間
 * 設為 2000ms 以涵蓋：
 * - FileWatcher debounce: 500ms
 * - 一般檔案系統延遲: 100-500ms
 * - 網路磁碟/防毒軟體: 可能 1000ms+
 */
const INTERNAL_UPDATE_PROTECTION_MS = 2000;
```

---

## 方法規範

### markInternalUpdateStart()

```typescript
/**
 * 標記內部更新操作開始
 * 呼叫時機：儲存操作開始前
 *
 * @behavior
 * 1. 清除現有計時器（防止過期重置）
 * 2. 遞增計數器
 */
private markInternalUpdateStart(): void {
    if (this.internalUpdateTimer) {
        clearTimeout(this.internalUpdateTimer);
        this.internalUpdateTimer = undefined;
    }
    this.internalUpdateCount++;
}
```

### markInternalUpdateEnd()

```typescript
/**
 * 標記內部更新操作結束
 * 呼叫時機：儲存操作完成後
 *
 * @behavior
 * 1. 設定延遲計時器
 * 2. 計時器觸發後遞減計數器
 */
private markInternalUpdateEnd(): void {
    this.internalUpdateTimer = setTimeout(() => {
        if (this.internalUpdateCount > 0) {
            this.internalUpdateCount--;
        }
        this.internalUpdateTimer = undefined;
    }, INTERNAL_UPDATE_PROTECTION_MS);
}
```

### handleFileChange() 整合

```typescript
/**
 * FileWatcher 事件處理器中的保護檢查
 *
 * @behavior
 * 當 internalUpdateCount > 0 時，跳過重載
 */
private handleFileChange(): void {
    // ... debounce 邏輯 ...

    if (this.internalUpdateCount > 0) {
        log('內部更新計數: ' + this.internalUpdateCount + '，跳過 FileWatcher 重載', 'info');
        return;
    }

    // ... 執行 loadWorkspace ...
}
```

---

## 使用場景

### 正確用法

```typescript
// saveWorkspace 或其他儲存操作
async saveWorkspace(): Promise<void> {
    this.markInternalUpdateStart();
    try {
        await this.fileService.writeFile(filePath, content);
    } finally {
        this.markInternalUpdateEnd();
    }
}
```

### 訊息處理器整合

```typescript
// onDidReceiveMessage 中的儲存命令處理
case 'saveWorkspace':
    this.markInternalUpdateStart();
    await this.handleSaveWorkspace(message);
    this.markInternalUpdateEnd();
    break;
```

---

## 狀態轉換圖

```
                    ┌─────────────────────┐
                    │   count = 0         │
                    │   (無保護)          │
                    └──────────┬──────────┘
                               │
                markInternalUpdateStart()
                               │
                               ▼
                    ┌─────────────────────┐
              ┌────▶│   count = N         │◀────┐
              │     │   (保護中)          │     │
              │     └──────────┬──────────┘     │
              │                │                │
    markInternalUpdateStart()  │    markInternalUpdateStart()
    (count++, 清除計時器)      │    (count++, 清除計時器)
              │                │                │
              │     markInternalUpdateEnd()     │
              │     (設定 2000ms 計時器)        │
              │                │                │
              │                ▼                │
              │     ┌─────────────────────┐     │
              │     │   等待 2000ms       │─────┘
              │     │   (繼續保護)        │
              │     └──────────┬──────────┘
              │                │
              │         計時器觸發
              │         (count--)
              │                │
              │       ┌────────┴────────┐
              │       │                 │
              │   count > 0?        count === 0?
              │       │                 │
              │       ▼                 ▼
              │   ┌─────────┐   ┌─────────────────┐
              └───│ 繼續保護 │   │   保護解除      │
                  └─────────┘   │   FileWatcher   │
                                │   正常處理      │
                                └─────────────────┘
```

---

## 時序範例

### 範例 1: 連續快速儲存

```
t=0ms:    儲存 A 開始
          markInternalUpdateStart()
          internalUpdateCount = 1

t=50ms:   儲存 A 完成
          markInternalUpdateEnd()
          設定 2000ms 計時器 (Timer-A)

t=100ms:  儲存 B 開始
          markInternalUpdateStart()
          清除 Timer-A
          internalUpdateCount = 2

t=150ms:  儲存 B 完成
          markInternalUpdateEnd()
          設定 2000ms 計時器 (Timer-B)

t=600ms:  FileWatcher 偵測到儲存 A 的變更
          internalUpdateCount = 2 > 0
          跳過重載 ✅

t=700ms:  FileWatcher 偵測到儲存 B 的變更
          internalUpdateCount = 2 > 0
          跳過重載 ✅

t=2150ms: Timer-B 觸發
          internalUpdateCount = 1

t=4150ms: Timer-B 觸發 (第二次遞減)
          internalUpdateCount = 0
          保護解除
```

### 範例 2: 檔案系統大延遲

```
t=0ms:    儲存開始
          markInternalUpdateStart()
          internalUpdateCount = 1

t=50ms:   儲存完成
          markInternalUpdateEnd()
          設定 2000ms 計時器

t=1500ms: FileWatcher 偵測到變更 (延遲 1450ms)
          internalUpdateCount = 1 > 0
          跳過重載 ✅

t=2050ms: 計時器觸發
          internalUpdateCount = 0
          保護解除
```

---

## 日誌記錄

實作應包含以下日誌：

```typescript
// markInternalUpdateStart
log(`內部更新開始，計數: ${this.internalUpdateCount}`, 'info');

// markInternalUpdateEnd
log(`內部更新結束，將在 ${INTERNAL_UPDATE_PROTECTION_MS}ms 後解除保護`, 'info');

// handleFileChange 跳過
log(`內部更新計數: ${this.internalUpdateCount}，跳過 FileWatcher 重載`, 'info');

// 計時器觸發
log(`內部更新保護延遲 ${INTERNAL_UPDATE_PROTECTION_MS}ms 後解除，計數: ${this.internalUpdateCount}`, 'info');
```

---

## 測試案例

| 測試案例     | 輸入                      | 預期結果                         |
| ------------ | ------------------------- | -------------------------------- |
| 單次儲存     | 儲存 → 等待 FileWatcher   | FileWatcher 跳過重載             |
| 連續快速儲存 | 快速儲存 5 次             | 所有 FileWatcher 事件都跳過重載  |
| 大延遲       | 儲存 → 1500ms 後 FW 觸發  | FileWatcher 跳過重載             |
| 保護過期後   | 儲存 → 等待 3000ms → FW   | FileWatcher 正常處理（外部變更） |
| 混合場景     | 儲存 A → 儲存 B → 兩個 FW | 兩個 FileWatcher 事件都跳過重載  |

---

## 向後相容性

-   此機制完全在 Extension 端內部運作
-   不影響 WebView 的任何介面
-   不影響現有的 `loadWorkspace` 訊息格式
````
