# 資料模型：i18n 硬編碼字串修復

**功能**: 024-i18n-hardcode-fix  
**日期**: 2025-12-31  
**狀態**: 完成

---

## 實體定義

### 1. I18nKeyCategory（i18n 鍵名分類）

統一管理所有 i18n 訊息鍵名的 TypeScript 常數結構。

```typescript
// src/types/i18nKeys.ts

/**
 * 安全警告相關訊息鍵名（現有）
 */
export const MESSAGE_KEYS = {
	SAFETY_WARNING_BODY_NO_TYPE: 'SAFETY_WARNING_BODY_NO_TYPE',
	SAFETY_WARNING_BODY_WITH_TYPE: 'SAFETY_WARNING_BODY_WITH_TYPE',
	BUTTON_CONTINUE: 'BUTTON_CONTINUE',
	BUTTON_CANCEL: 'BUTTON_CANCEL',
	BUTTON_SUPPRESS: 'BUTTON_SUPPRESS',
	SAFETY_GUARD_CANCELLED: 'SAFETY_GUARD_CANCELLED',
	SAFETY_GUARD_SUPPRESSED: 'SAFETY_GUARD_SUPPRESSED',
} as const;

/**
 * 上傳進度相關訊息鍵名（新增）
 */
export const UPLOAD_KEYS = {
	STAGE_PREPARING: 'UPLOAD_STAGE_PREPARING',
	STAGE_CHECKING: 'UPLOAD_STAGE_CHECKING',
	STAGE_INSTALLING: 'UPLOAD_STAGE_INSTALLING',
	STAGE_CONNECTING: 'UPLOAD_STAGE_CONNECTING',
	STAGE_RESETTING: 'UPLOAD_STAGE_RESETTING',
	STAGE_UPLOADING: 'UPLOAD_STAGE_UPLOADING',
	STAGE_RESTARTING: 'UPLOAD_STAGE_RESTARTING',
	STAGE_COMPLETED: 'UPLOAD_STAGE_COMPLETED',
} as const;

/**
 * 上傳錯誤相關訊息鍵名（新增）
 */
export const UPLOAD_ERROR_KEYS = {
	BOARD_UNSUPPORTED: 'ERROR_UPLOAD_BOARD_UNSUPPORTED',
	CODE_EMPTY: 'ERROR_UPLOAD_CODE_EMPTY',
	NO_PYTHON: 'ERROR_UPLOAD_NO_PYTHON',
	MPREMOTE_FAILED: 'ERROR_UPLOAD_MPREMOTE_FAILED',
	DEVICE_NOT_FOUND: 'ERROR_UPLOAD_DEVICE_NOT_FOUND',
	RESET_FAILED: 'ERROR_UPLOAD_RESET_FAILED',
	UPLOAD_FAILED: 'ERROR_UPLOAD_UPLOAD_FAILED',
	RESTART_FAILED: 'ERROR_UPLOAD_RESTART_FAILED',
} as const;

/**
 * 備份功能相關訊息鍵名（新增）
 */
export const BACKUP_KEYS = {
	CONFIRM_DELETE: 'BACKUP_CONFIRM_DELETE',
	CONFIRM_RESTORE: 'BACKUP_CONFIRM_RESTORE',
	ERROR_NOT_FOUND: 'BACKUP_ERROR_NOT_FOUND',
	ERROR_CREATE_FAILED: 'BACKUP_ERROR_CREATE_FAILED',
	ERROR_DELETE_FAILED: 'BACKUP_ERROR_DELETE_FAILED',
	ERROR_RESTORE_FAILED: 'BACKUP_ERROR_RESTORE_FAILED',
	ERROR_PREVIEW_FAILED: 'BACKUP_ERROR_PREVIEW_FAILED',
	ERROR_NO_NAME: 'BACKUP_ERROR_NO_NAME',
	ERROR_MAIN_NOT_FOUND: 'BACKUP_ERROR_MAIN_NOT_FOUND',
} as const;

/**
 * 按鈕文字相關訊息鍵名（新增/擴展）
 */
export const BUTTON_KEYS = {
	CONTINUE: 'BUTTON_CONTINUE',
	CANCEL: 'BUTTON_CANCEL',
	DELETE: 'BUTTON_DELETE',
	RESTORE: 'BUTTON_RESTORE',
	SUPPRESS: 'BUTTON_SUPPRESS',
	OK: 'VSCODE_OK',
} as const;

/**
 * 通用錯誤訊息鍵名（新增）
 */
export const ERROR_KEYS = {
	PROCESSING_MESSAGE: 'ERROR_PROCESSING_MESSAGE',
	SETTINGS_UPDATE_FAILED: 'ERROR_SETTINGS_UPDATE_FAILED',
} as const;

/**
 * 所有 i18n 鍵名的聯合型別
 */
export type I18nKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS] | (typeof UPLOAD_KEYS)[keyof typeof UPLOAD_KEYS] | (typeof UPLOAD_ERROR_KEYS)[keyof typeof UPLOAD_ERROR_KEYS] | (typeof BACKUP_KEYS)[keyof typeof BACKUP_KEYS] | (typeof BUTTON_KEYS)[keyof typeof BUTTON_KEYS] | (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];
```

---

### 2. LocaleService 回退鏈（強化）

```typescript
// src/services/localeService.ts (修改)

/**
 * 獲取本地化訊息（強化版）
 *
 * 回退順序：
 * 1. 當前語言翻譯
 * 2. 英文翻譯
 * 3. fallback 參數
 * 4. 鍵名本身（最後手段）
 *
 * @param key 訊息鍵名
 * @param fallback 當所有翻譯都找不到時的預設值
 * @param args 格式化參數
 * @returns 翻譯後的訊息
 */
async getLocalizedMessage(key: string, fallback?: string, ...args: any[]): Promise<string> {
    // 1. 嘗試當前語言
    const messages = await this.loadUIMessages();
    let message = messages[key];

    // 2. 回退到英文
    if (!message && this.currentLanguage !== 'en') {
        const enMessages = await this.loadEnglishMessages();
        message = enMessages[key];
    }

    // 3. 使用 fallback 參數
    if (!message) {
        message = fallback || key;
    }

    // 4. 替換參數 {0}, {1}, 等
    args.forEach((arg, index) => {
        message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
    });

    return message;
}

/**
 * 載入英文翻譯（用於回退）
 */
private async loadEnglishMessages(): Promise<UIMessages> {
    if (this.cachedMessages.has('en')) {
        return this.cachedMessages.get('en') || {};
    }

    const enFilePath = path.join(this.extensionPath, 'media/locales/en/messages.js');
    if (!this.fs.existsSync(enFilePath)) {
        return {};
    }

    const content = (await this.fs.promises.readFile(enFilePath, 'utf8')) as string;
    const messages = this.extractMessagesFromJs(content);
    this.cachedMessages.set('en', messages);
    return messages;
}
```

---

### 3. 翻譯檔案結構（messages.js）

每種語言的翻譯檔案需要新增以下鍵值：

```javascript
// media/locales/en/messages.js (新增項目)

// Upload Stage Messages
UPLOAD_STAGE_PREPARING: 'Preparing...',
UPLOAD_STAGE_CHECKING: 'Checking tools...',
UPLOAD_STAGE_INSTALLING: 'Installing tools...',
UPLOAD_STAGE_CONNECTING: 'Detecting device...',
UPLOAD_STAGE_RESETTING: 'Resetting device...',
UPLOAD_STAGE_UPLOADING: 'Uploading...',
UPLOAD_STAGE_RESTARTING: 'Restarting device...',
UPLOAD_STAGE_COMPLETED: 'Upload complete!',

// Upload Error Messages
ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Only CyberBrick board is supported',
ERROR_UPLOAD_CODE_EMPTY: 'Code cannot be empty',
ERROR_UPLOAD_NO_PYTHON: 'PlatformIO Python environment not found. Please install PlatformIO first.',
ERROR_UPLOAD_MPREMOTE_FAILED: 'mpremote installation failed',
ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrick device not found. Please ensure it is connected.',
ERROR_UPLOAD_RESET_FAILED: 'Failed to reset device',
ERROR_UPLOAD_UPLOAD_FAILED: 'Failed to upload program',
ERROR_UPLOAD_RESTART_FAILED: 'Failed to restart device',

// Backup Messages
BACKUP_CONFIRM_DELETE: 'Are you sure you want to delete backup "{0}"?',
BACKUP_CONFIRM_RESTORE: 'Are you sure you want to restore backup "{0}"? This will overwrite the current workspace.',
BACKUP_ERROR_NOT_FOUND: 'Backup "{0}" not found',
BACKUP_ERROR_CREATE_FAILED: 'Failed to create backup: {0}',
BACKUP_ERROR_DELETE_FAILED: 'Failed to delete backup: {0}',
BACKUP_ERROR_RESTORE_FAILED: 'Failed to restore backup: {0}',
BACKUP_ERROR_PREVIEW_FAILED: 'Failed to preview backup: {0}',
BACKUP_ERROR_NO_NAME: 'Backup name not specified',
BACKUP_ERROR_MAIN_NOT_FOUND: 'Cannot find main.json file',

// Button Labels
BUTTON_DELETE: 'Delete',
BUTTON_RESTORE: 'Restore',

// Error Messages
ERROR_PROCESSING_MESSAGE: 'Error processing message: {0}',
ERROR_SETTINGS_UPDATE_FAILED: 'Failed to update auto backup settings',
```

---

## 驗證規則

### 1. i18n 鍵名唯一性

-   每個鍵名在所有分類中必須唯一
-   鍵名格式：`CATEGORY_ACTION_DETAIL` (全大寫底線分隔)

### 2. 翻譯完整性

-   15 種語言必須都有對應翻譯
-   可透過 `npm run validate:i18n` 驗證

### 3. 回退鏈順序

```
getLocalizedMessage('KEY', 'English Fallback')
→ 嘗試 zh-hant/messages.js['KEY']
→ 失敗則嘗試 en/messages.js['KEY']
→ 失敗則使用 'English Fallback'
→ 失敗則返回 'KEY'
```

---

## 狀態轉換（無）

本功能不涉及實體狀態轉換，僅為靜態配置和訊息查詢。

---

## 關聯關係

```
┌─────────────────┐
│   i18nKeys.ts   │  ← 統一鍵名定義
└────────┬────────┘
         │ imports
         ▼
┌─────────────────┐      ┌──────────────────┐
│ LocaleService   │ ───► │ messages.js      │
│ (回退鏈機制)     │      │ (15 種語言)      │
└────────┬────────┘      └──────────────────┘
         │ used by
         ▼
┌─────────────────────────────────────────────┐
│ Extension Host Services                      │
│ ├── workspaceValidator.ts                   │
│ ├── micropythonUploader.ts                  │
│ └── messageHandler.ts                       │
└─────────────────────────────────────────────┘
```
