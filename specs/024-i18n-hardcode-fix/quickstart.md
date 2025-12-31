# 快速開始指南：i18n 硬編碼字串修復

**功能**: 024-i18n-hardcode-fix  
**日期**: 2025-12-31

---

## 概覽

本功能修復 Extension Host 端的國際化問題，確保所有使用者可見訊息都能根據 VSCode 語言設定正確顯示對應翻譯。

---

## 開發前置需求

```bash
# 確保已安裝依賴
npm install

# 開啟監視模式
npm run watch
```

---

## 核心概念

### 1. LocaleService 回退鏈

```typescript
// 優先級從高到低：
// 1. 當前語言翻譯
// 2. 英文翻譯
// 3. fallback 參數
// 4. 鍵名本身

const msg = await localeService.getLocalizedMessage(
	'KEY', // i18n 鍵名
	'English text', // fallback（建議總是提供）
	arg1,
	arg2 // 替換參數
);
```

### 2. i18n 鍵名常數

```typescript
import { BACKUP_KEYS, BUTTON_KEYS } from '../types/i18nKeys';

// 使用常數而非字串，獲得類型安全
const msg = await localeService.getLocalizedMessage(
	BACKUP_KEYS.CONFIRM_DELETE, // TypeScript 會檢查鍵名是否存在
	'Are you sure?',
	backupName
);
```

### 3. 翻譯檔案位置

```
media/locales/
├── en/messages.js      # 英文（必須完整）
├── zh-hant/messages.js # 繁體中文
├── ja/messages.js      # 日文
└── ... (共 15 種語言)
```

---

## 常見任務

### 新增 i18n 訊息

1. **定義鍵名常數** (`src/types/i18nKeys.ts`)

```typescript
export const MY_KEYS = {
	NEW_MESSAGE: 'MY_NEW_MESSAGE',
} as const;
```

2. **新增翻譯** (所有 15 種語言的 `messages.js`)

```javascript
// en/messages.js
MY_NEW_MESSAGE: 'This is my new message',

// zh-hant/messages.js
MY_NEW_MESSAGE: '這是我的新訊息',
```

3. **使用訊息**

```typescript
import { MY_KEYS } from '../types/i18nKeys';

const msg = await this.localeService.getLocalizedMessage(
	MY_KEYS.NEW_MESSAGE,
	'This is my new message' // fallback
);
```

### 修改硬編碼字串

**Before (硬編碼中文)**:

```typescript
this.showErrorMessage('建立備份失敗');
```

**After (i18n)**:

```typescript
const errorMsg = await this.localeService.getLocalizedMessage(BACKUP_KEYS.ERROR_CREATE_FAILED, 'Failed to create backup: {0}', error.message);
this.showErrorMessage(errorMsg);
```

---

## 測試驗證

### 單元測試

```typescript
describe('LocaleService fallback chain', () => {
	it('should fallback to English when translation missing', async () => {
		// 設定非英文語言但缺少翻譯
		const service = new LocaleService(extensionPath, fsMock, {
			env: { language: 'fr' },
		});

		const msg = await service.getLocalizedMessage('NONEXISTENT_KEY', 'English Fallback');

		expect(msg).to.equal('English Fallback');
	});
});
```

### 手動測試

1. 將 VSCode 語言切換為英文 (`Ctrl+Shift+P` → "Configure Display Language")
2. 開啟 Blockly 編輯器
3. 觸發各種訊息（警告、上傳、備份）
4. 確認顯示英文而非 i18n 鍵名

---

## 驗證 i18n 完整性

```bash
# 執行翻譯驗證腳本
npm run validate:i18n
```

此命令會檢查：

-   所有 15 種語言都有對應翻譯
-   沒有遺漏的鍵值
-   沒有未使用的翻譯

---

## 注意事項

1. **總是提供英文 fallback**：即使英文翻譯檔案存在，仍建議提供 fallback 以防載入失敗

2. **MCP 工具訊息不需 i18n**：MCP 工具主要供 AI 使用，保持英文即可

3. **WebView vs Extension Host**：

    - Extension Host：使用 `LocaleService.getLocalizedMessage()`
    - WebView：使用 `window.languageManager.getMessage()`

4. **參數替換順序**：`{0}`, `{1}` 等會按 args 陣列順序替換

---

## 相關檔案

| 檔案                                                                 | 用途                    |
| -------------------------------------------------------------------- | ----------------------- |
| [src/services/localeService.ts](../../src/services/localeService.ts) | 多語言服務              |
| [src/types/i18nKeys.ts](../../src/types/i18nKeys.ts)                 | i18n 常數定義（待建立） |
| [media/locales/en/messages.js](../../media/locales/en/messages.js)   | 英文翻譯                |
| [spec.md](./spec.md)                                                 | 功能規格                |
| [research.md](./research.md)                                         | 研究文件                |
| [data-model.md](./data-model.md)                                     | 資料模型                |
