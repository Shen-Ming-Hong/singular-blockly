# Data Model: Blockly Language Selector

**Feature Branch**: `030-language-selector`  
**Design Date**: 2026-01-19  
**Status**: Complete

## 實體定義

### 1. Language Preference (語言偏好)

儲存於 `.vscode/settings.json`

| 欄位                        | 類型   | 必填 | 預設值    | 說明               |
| --------------------------- | ------ | ---- | --------- | ------------------ |
| `singular-blockly.language` | string | 否   | `"auto"`  | 語言偏好設定       |
| `singular-blockly.theme`    | string | 否   | `"light"` | 主題設定（已存在） |

**有效的 language 值**：

- `"auto"` — 跟隨 VS Code 語言設定
- `"en"`, `"zh-hant"`, `"ja"`, `"ko"`, `"es"`, `"fr"`, `"de"`, `"it"`, `"pt-br"`, `"ru"`, `"pl"`, `"hu"`, `"cs"`, `"bg"`, `"tr"`

**範例**：

```json
{
	"singular-blockly.language": "ja",
	"singular-blockly.theme": "dark"
}
```

---

### 2. Workspace State (工作區狀態)

儲存於 `blockly/main.json`

| 欄位        | 類型       | 必填   | 說明               |
| ----------- | ---------- | ------ | ------------------ |
| `workspace` | object     | 是     | Blockly 序列化狀態 |
| `board`     | string     | 是     | 開發板類型         |
| ~~`theme`~~ | ~~string~~ | ~~否~~ | ~~移除此欄位~~     |

**範例（清理後）**：

```json
{
  "workspace": {
    "blocks": { ... }
  },
  "board": "esp32"
}
```

---

### 3. Supported Language (支援的語言)

靜態定義於程式碼中，用於 UI 顯示

| 欄位         | 類型    | 說明                        |
| ------------ | ------- | --------------------------- |
| `code`       | string  | 語言代碼（如 `"zh-hant"`）  |
| `nativeName` | string  | 原生名稱（如 `"繁體中文"`） |
| `isAuto`     | boolean | 是否為 Auto 選項            |

**TypeScript 介面定義**：

```typescript
interface SupportedLanguage {
	code: string;
	nativeName: string;
	isAuto?: boolean;
}
```

---

## 狀態轉換

### Language Preference 狀態

```
┌─────────────────────────────────────────────────────────┐
│                    settings.json                        │
│  singular-blockly.language: "auto" | <language_code>    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 Language Resolution                      │
│  if (language === "auto") {                             │
│    resolvedLanguage = mapVSCodeLangToBlockly(vscode.env.language)  │
│  } else {                                               │
│    resolvedLanguage = language                          │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 WebView Initialization                   │
│  window.languageManager.currentLanguage = resolvedLanguage  │
└─────────────────────────────────────────────────────────┘
```

---

## 驗證規則

### Language 欄位驗證

1. **有效值檢查**：必須是 `"auto"` 或 15 種支援的語言代碼之一
2. **無效值處理**：回退到 `"auto"`
3. **缺少欄位**：使用預設值 `"auto"`

**驗證函數**：

```typescript
function isValidLanguage(lang: string): boolean {
	const validLanguages = ['auto', 'en', 'zh-hant', 'ja', 'ko', 'es', 'fr', 'de', 'it', 'pt-br', 'ru', 'pl', 'hu', 'cs', 'bg', 'tr'];
	return validLanguages.includes(lang);
}
```

---

## 資料遷移

### 從 main.json 遷移 theme 到 settings.json

**遷移條件**：首次開啟包含 `theme` 欄位的舊版 `main.json`

**遷移步驟**：

1. 讀取 `main.json`，檢查是否有 `theme` 欄位
2. 如果有，讀取 `settings.json` 的 `singular-blockly.theme`
3. 如果 `settings.json` 中沒有 theme，則從 `main.json` 複製
4. 儲存 `main.json` 時不包含 `theme` 欄位

**遷移程式碼位置**：`src/webview/messageHandler.ts`

---

## 相關檔案

| 檔案                              | 用途                       |
| --------------------------------- | -------------------------- |
| `.vscode/settings.json`           | 儲存語言和主題偏好         |
| `blockly/main.json`               | 儲存工作區狀態和開發板選擇 |
| `src/services/settingsManager.ts` | 讀寫 settings.json         |
| `src/services/localeService.ts`   | 語言對應和翻譯載入         |
