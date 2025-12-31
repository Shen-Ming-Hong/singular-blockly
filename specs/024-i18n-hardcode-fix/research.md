# 研究文件：i18n 硬編碼字串修復

**功能**: 024-i18n-hardcode-fix  
**日期**: 2025-12-31  
**狀態**: 完成

## 研究目標

1. 分析 `LocaleService.getLocalizedMessage()` 為何在英文環境返回鍵名
2. 識別 Extension Host 端所有硬編碼中文字串
3. 確定最佳 i18n 回退策略

---

## 問題 1：英文環境下顯示 i18n 鍵名

### 發現

分析 `src/services/localeService.ts` 第 62-74 行：

```typescript
async getLocalizedMessage(key: string, ...args: any[]): Promise<string> {
    const messages = await this.loadUIMessages();
    let message = messages[key] || key; // ⚠️ 問題：找不到翻譯時返回 key 本身
    // ...
}
```

**根本原因**：當翻譯檔案載入失敗或缺少鍵值時，函數直接返回 key 字串而非英文翻譯。

### 決策

**採用方案**：強化回退鏈機制

```
回退順序：當前語言翻譯 → 英文翻譯 → fallback 參數 → 鍵名本身
```

**理由**：

-   符合國際化最佳實踐（英文作為通用 fallback）
-   向下相容現有程式碼
-   最小化修改範圍

**被拒絕的替代方案**：

-   在每個呼叫處硬編碼所有語言翻譯（過度複雜）
-   只使用 fallback 參數不嘗試英文翻譯（浪費已有的英文翻譯）

---

## 問題 2：MicroPython 上傳進度訊息硬編碼

### 發現

分析 `src/services/micropythonUploader.ts`，發現以下硬編碼中文字串：

| 行號 | 硬編碼字串                          | 用途         |
| ---- | ----------------------------------- | ------------ |
| 210  | `'正在安裝 mpremote...'`            | 安裝工具進度 |
| 318  | `'準備上傳...'`                     | 上傳準備階段 |
| 321  | `'僅支援 CyberBrick 主板'`          | 錯誤訊息     |
| 326  | `'程式碼不能為空'`                  | 驗證錯誤     |
| 332  | `'檢查 mpremote 工具...'`           | 檢查工具階段 |
| 341  | `'PlatformIO Python 環境不存在...'` | 錯誤訊息     |
| 349  | `'安裝 mpremote...'`                | 安裝階段     |
| 361  | `'偵測 CyberBrick...'`              | 連接階段     |
| 369  | `'找不到 CyberBrick 裝置...'`       | 錯誤訊息     |
| 376  | `'重置 CyberBrick...'`              | 重置階段     |
| 386  | `'上傳程式...'`                     | 上傳階段     |
| 396  | `'重啟 CyberBrick...'`              | 重啟階段     |
| 407  | `'上傳完成！'`                      | 完成訊息     |

### 決策

**採用方案**：將所有進度訊息改為英文字串作為基礎值

**理由**：

1. MicroPython 上傳訊息透過 `sendUploadProgress()` 發送到 WebView
2. WebView 端有完整的翻譯機制 (`window.languageManager.getMessage`)
3. Extension Host 只需提供英文 base message，WebView 負責本地化顯示

**實作策略**：

-   `micropythonUploader.ts` 使用英文訊息常數
-   WebView 端 `blocklyEdit.js` 根據 stage 顯示對應翻譯

---

## 問題 3：備份功能確認對話框硬編碼

### 發現

分析 `src/webview/messageHandler.ts`，發現以下硬編碼字串：

| 行號 | 硬編碼字串                               | 用途     |
| ---- | ---------------------------------------- | -------- |
| 156  | `'處理訊息時發生錯誤: '`                 | 錯誤處理 |
| 615  | `'無法找到 main.json 檔案'`              | 備份錯誤 |
| 645  | `'建立備份失敗: '`                       | 備份錯誤 |
| 725  | `'未指定備份名稱'`                       | 驗證錯誤 |
| 731  | `'確定要刪除備份檔案: {name}.json 嗎？'` | 刪除確認 |
| 732  | `'刪除'`                                 | 按鈕文字 |
| 733  | `'取消'`                                 | 按鈕文字 |
| 752  | `'備份 {name} 不存在'`                   | 錯誤訊息 |
| 767  | `'刪除備份失敗: '`                       | 錯誤訊息 |
| 793  | `'確定要還原備份「{name}」嗎？...'`      | 還原確認 |
| 794  | `'還原'`                                 | 按鈕文字 |
| 872  | `'還原備份失敗: '`                       | 錯誤訊息 |
| 958  | `'預覽備份失敗: '`                       | 錯誤訊息 |
| 986  | `'更新自動備份設定失敗'`                 | 錯誤訊息 |

### 決策

**採用方案**：全部改用 `LocaleService.getLocalizedMessage()` + 英文 fallback

**理由**：

-   `messageHandler.ts` 已經注入 `LocaleService` 實例
-   現有程式碼已有使用 `localeService.getLocalizedMessage()` 的模式
-   只需要擴展使用範圍

---

## 問題 4：workspaceValidator.ts 回退訊息

### 發現

分析 `src/services/workspaceValidator.ts` 第 263-273 行的 `getFallbackMessage()`：

```typescript
private getFallbackMessage(key: string): string {
    // 使用繁體中文作為後備語言(目標使用者為台灣國小學童)
    const fallbackMessages: Record<string, string> = {
        [MESSAGE_KEYS.SAFETY_WARNING_BODY_NO_TYPE]:
            '這個專案還沒有 Blockly 積木...', // ⚠️ 應使用英文
        // ...
    };
}
```

### 決策

**採用方案**：將 fallback 訊息改為英文

**理由**：

-   符合 i18n 最佳實踐（英文作為通用 fallback）
-   英文翻譯已存在於 `en/messages.js`
-   系統應透過翻譯機制取得中文，而非硬編碼

---

## 需要新增的 i18n 鍵名

### 上傳進度相關（Extension Host → WebView）

| 鍵名                      | 英文值               | 用途     |
| ------------------------- | -------------------- | -------- |
| `UPLOAD_STAGE_PREPARING`  | Preparing...         | 準備階段 |
| `UPLOAD_STAGE_CHECKING`   | Checking tools...    | 檢查工具 |
| `UPLOAD_STAGE_INSTALLING` | Installing tools...  | 安裝工具 |
| `UPLOAD_STAGE_CONNECTING` | Detecting device...  | 偵測裝置 |
| `UPLOAD_STAGE_RESETTING`  | Resetting device...  | 重置裝置 |
| `UPLOAD_STAGE_UPLOADING`  | Uploading...         | 上傳中   |
| `UPLOAD_STAGE_RESTARTING` | Restarting device... | 重啟裝置 |
| `UPLOAD_STAGE_COMPLETED`  | Upload complete!     | 上傳完成 |

### 備份功能相關（已存在部分需補齊）

| 鍵名                          | 英文值                                                                                    | 用途         |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| `BACKUP_CONFIRM_DELETE`       | Are you sure you want to delete backup "{0}"?                                             | 刪除確認     |
| `BACKUP_CONFIRM_RESTORE`      | Are you sure you want to restore backup "{0}"? This will overwrite the current workspace. | 還原確認     |
| `BACKUP_ERROR_NOT_FOUND`      | Backup "{0}" not found                                                                    | 備份不存在   |
| `BACKUP_ERROR_CREATE_FAILED`  | Failed to create backup: {0}                                                              | 建立失敗     |
| `BACKUP_ERROR_DELETE_FAILED`  | Failed to delete backup: {0}                                                              | 刪除失敗     |
| `BACKUP_ERROR_RESTORE_FAILED` | Failed to restore backup: {0}                                                             | 還原失敗     |
| `BACKUP_ERROR_PREVIEW_FAILED` | Failed to preview backup: {0}                                                             | 預覽失敗     |
| `BACKUP_ERROR_NO_NAME`        | Backup name not specified                                                                 | 未指定名稱   |
| `BACKUP_ERROR_MAIN_NOT_FOUND` | Cannot find main.json file                                                                | 找不到主檔案 |
| `BUTTON_DELETE`               | Delete                                                                                    | 刪除按鈕     |
| `BUTTON_RESTORE`              | Restore                                                                                   | 還原按鈕     |

### 錯誤訊息相關

| 鍵名                             | 英文值                                                                    | 用途              |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------- |
| `ERROR_PROCESSING_MESSAGE`       | Error processing message: {0}                                             | 訊息處理錯誤      |
| `ERROR_UPLOAD_BOARD_UNSUPPORTED` | Only CyberBrick board is supported                                        | 不支援的板子      |
| `ERROR_UPLOAD_CODE_EMPTY`        | Code cannot be empty                                                      | 程式碼為空        |
| `ERROR_UPLOAD_NO_PYTHON`         | PlatformIO Python environment not found. Please install PlatformIO first. | 缺少 Python 環境  |
| `ERROR_UPLOAD_MPREMOTE_FAILED`   | mpremote installation failed                                              | mpremote 安裝失敗 |
| `ERROR_UPLOAD_DEVICE_NOT_FOUND`  | CyberBrick device not found. Please ensure it is connected.               | 找不到裝置        |
| `ERROR_SETTINGS_UPDATE_FAILED`   | Failed to update auto backup settings                                     | 設定更新失敗      |

---

## 實作順序建議

1. **LocaleService 回退鏈強化** - 優先修改，解決核心問題
2. **新增 i18n 常數檔案** - 建立統一鍵名管理
3. **更新翻譯檔案** - 15 種語言都需新增鍵值
4. **修改 workspaceValidator.ts** - fallback 改英文
5. **修改 micropythonUploader.ts** - 訊息改英文
6. **修改 messageHandler.ts** - 備份功能 i18n 化
7. **新增測試** - LocaleService 回退鏈測試

---

## 參考資源

-   [VSCode Extension i18n](https://code.visualstudio.com/api/references/vscode-api#env.language)
-   [現有 LocaleService 實作](../../src/services/localeService.ts)
-   [現有翻譯檔案結構](../../media/locales/)
