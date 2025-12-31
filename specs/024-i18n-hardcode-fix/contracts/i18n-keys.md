# i18n 鍵名常數合約

**功能**: 024-i18n-hardcode-fix  
**日期**: 2025-12-31

---

## 概述

定義所有 i18n 訊息鍵名的 TypeScript 常數，提供類型安全和 IntelliSense 支援。

---

## 檔案位置

```
src/types/i18nKeys.ts
```

---

## 鍵名分類

### MESSAGE_KEYS（安全警告）

| 鍵名                            | 用途               | 範例值                                             |
| ------------------------------- | ------------------ | -------------------------------------------------- |
| `SAFETY_WARNING_BODY_NO_TYPE`   | 無專案類型警告內容 | "This project does not have Blockly blocks yet..." |
| `SAFETY_WARNING_BODY_WITH_TYPE` | 有專案類型警告內容 | "Detected {0} project..."                          |
| `BUTTON_CONTINUE`               | 繼續按鈕           | "Continue"                                         |
| `BUTTON_CANCEL`                 | 取消按鈕           | "Cancel"                                           |
| `BUTTON_SUPPRESS`               | 不再提醒按鈕       | "Do Not Remind"                                    |
| `SAFETY_GUARD_CANCELLED`        | 取消訊息           | "Cancelled opening Blockly editor"                 |
| `SAFETY_GUARD_SUPPRESSED`       | 已記住偏好訊息     | "Preference saved..."                              |

### UPLOAD_KEYS（上傳進度）

| 鍵名                      | 用途     | 範例值                 |
| ------------------------- | -------- | ---------------------- |
| `UPLOAD_STAGE_PREPARING`  | 準備階段 | "Preparing..."         |
| `UPLOAD_STAGE_CHECKING`   | 檢查工具 | "Checking tools..."    |
| `UPLOAD_STAGE_INSTALLING` | 安裝工具 | "Installing tools..."  |
| `UPLOAD_STAGE_CONNECTING` | 偵測裝置 | "Detecting device..."  |
| `UPLOAD_STAGE_RESETTING`  | 重置裝置 | "Resetting device..."  |
| `UPLOAD_STAGE_UPLOADING`  | 上傳中   | "Uploading..."         |
| `UPLOAD_STAGE_RESTARTING` | 重啟裝置 | "Restarting device..." |
| `UPLOAD_STAGE_COMPLETED`  | 上傳完成 | "Upload complete!"     |

### UPLOAD_ERROR_KEYS（上傳錯誤）

| 鍵名                             | 用途              | 範例值                                       |
| -------------------------------- | ----------------- | -------------------------------------------- |
| `ERROR_UPLOAD_BOARD_UNSUPPORTED` | 不支援的板子      | "Only CyberBrick board is supported"         |
| `ERROR_UPLOAD_CODE_EMPTY`        | 程式碼為空        | "Code cannot be empty"                       |
| `ERROR_UPLOAD_NO_PYTHON`         | 缺少 Python       | "PlatformIO Python environment not found..." |
| `ERROR_UPLOAD_MPREMOTE_FAILED`   | mpremote 安裝失敗 | "mpremote installation failed"               |
| `ERROR_UPLOAD_DEVICE_NOT_FOUND`  | 找不到裝置        | "CyberBrick device not found..."             |
| `ERROR_UPLOAD_RESET_FAILED`      | 重置失敗          | "Failed to reset device"                     |
| `ERROR_UPLOAD_UPLOAD_FAILED`     | 上傳失敗          | "Failed to upload program"                   |
| `ERROR_UPLOAD_RESTART_FAILED`    | 重啟失敗          | "Failed to restart device"                   |

### BACKUP_KEYS（備份功能）

| 鍵名                          | 用途         | 範例值                                                |
| ----------------------------- | ------------ | ----------------------------------------------------- |
| `BACKUP_CONFIRM_DELETE`       | 刪除確認     | "Are you sure you want to delete backup \"{0}\"?"     |
| `BACKUP_CONFIRM_RESTORE`      | 還原確認     | "Are you sure you want to restore backup \"{0}\"?..." |
| `BACKUP_ERROR_NOT_FOUND`      | 備份不存在   | "Backup \"{0}\" not found"                            |
| `BACKUP_ERROR_CREATE_FAILED`  | 建立失敗     | "Failed to create backup: {0}"                        |
| `BACKUP_ERROR_DELETE_FAILED`  | 刪除失敗     | "Failed to delete backup: {0}"                        |
| `BACKUP_ERROR_RESTORE_FAILED` | 還原失敗     | "Failed to restore backup: {0}"                       |
| `BACKUP_ERROR_PREVIEW_FAILED` | 預覽失敗     | "Failed to preview backup: {0}"                       |
| `BACKUP_ERROR_NO_NAME`        | 未指定名稱   | "Backup name not specified"                           |
| `BACKUP_ERROR_MAIN_NOT_FOUND` | 找不到主檔案 | "Cannot find main.json file"                          |

### BUTTON_KEYS（按鈕文字）

| 鍵名              | 用途     | 範例值          |
| ----------------- | -------- | --------------- |
| `BUTTON_CONTINUE` | 繼續     | "Continue"      |
| `BUTTON_CANCEL`   | 取消     | "Cancel"        |
| `BUTTON_DELETE`   | 刪除     | "Delete"        |
| `BUTTON_RESTORE`  | 還原     | "Restore"       |
| `BUTTON_SUPPRESS` | 不再提醒 | "Do Not Remind" |
| `VSCODE_OK`       | 確定     | "OK"            |

### ERROR_KEYS（通用錯誤）

| 鍵名                           | 用途         | 範例值                                  |
| ------------------------------ | ------------ | --------------------------------------- |
| `ERROR_PROCESSING_MESSAGE`     | 訊息處理錯誤 | "Error processing message: {0}"         |
| `ERROR_SETTINGS_UPDATE_FAILED` | 設定更新失敗 | "Failed to update auto backup settings" |

---

## 使用方式

```typescript
import { BACKUP_KEYS, BUTTON_KEYS } from '../types/i18nKeys';

// 在 messageHandler.ts 中
const confirmMsg = await this.localeService.getLocalizedMessage(BACKUP_KEYS.CONFIRM_DELETE, 'Are you sure you want to delete backup "{0}"?', backupName);

const deleteBtn = await this.localeService.getLocalizedMessage(BUTTON_KEYS.DELETE, 'Delete');
```

---

## 驗證規則

1. **鍵名唯一性**：所有鍵名在所有分類中必須唯一
2. **命名規範**：`CATEGORY_ACTION_DETAIL`（全大寫底線分隔）
3. **翻譯完整性**：每個鍵名在 15 種語言中都必須有翻譯
