# WebView Messages Contract

**Feature**: Blockly Language Selector  
**Version**: 1.0.0

## 訊息格式

所有訊息遵循現有的 Extension ↔ WebView 通訊協定。

---

## Extension → WebView 訊息

### `init` (修改現有)

初始化 WebView 時傳送語言設定。

```typescript
interface InitMessage {
	command: 'init';
	theme: 'light' | 'dark';
	board: string;
	workspace: object;
	// 新增欄位
	languagePreference: 'auto' | SupportedLanguageCode;
	resolvedLanguage: SupportedLanguageCode;
}
```

**範例**：

```json
{
  "command": "init",
  "theme": "dark",
  "board": "esp32",
  "workspace": { ... },
  "languagePreference": "auto",
  "resolvedLanguage": "zh-hant"
}
```

---

### `languageUpdated` (新增)

語言設定更新確認。

```typescript
interface LanguageUpdatedMessage {
	command: 'languageUpdated';
	languagePreference: 'auto' | SupportedLanguageCode;
	resolvedLanguage: SupportedLanguageCode;
}
```

**範例**：

```json
{
	"command": "languageUpdated",
	"languagePreference": "ja",
	"resolvedLanguage": "ja"
}
```

---

## WebView → Extension 訊息

### `updateLanguage` (新增)

使用者選擇新語言時發送。

```typescript
interface UpdateLanguageMessage {
	command: 'updateLanguage';
	language: 'auto' | SupportedLanguageCode;
}
```

**範例**：

```json
{
	"command": "updateLanguage",
	"language": "ja"
}
```

---

### `saveWorkspace` (修改現有)

儲存工作區時移除 `theme` 欄位。

```typescript
interface SaveWorkspaceMessage {
	command: 'saveWorkspace';
	state: BlocklyWorkspaceState;
	board: string;
	// 移除: theme: 'light' | 'dark';
}
```

---

## 類型定義

```typescript
type SupportedLanguageCode = 'en' | 'zh-hant' | 'ja' | 'ko' | 'es' | 'fr' | 'de' | 'it' | 'pt-br' | 'ru' | 'pl' | 'hu' | 'cs' | 'bg' | 'tr';

interface BlocklyWorkspaceState {
	blocks: {
		blocks: Block[];
		languageVersion: number;
	};
	variables?: Variable[];
}
```

---

## 錯誤處理

### 無效語言代碼

如果 `updateLanguage` 收到無效的語言代碼：

1. Extension 記錄警告日誌
2. 回退到 `"auto"`
3. 回傳 `languageUpdated` 訊息，包含實際使用的語言

```json
{
	"command": "languageUpdated",
	"languagePreference": "auto",
	"resolvedLanguage": "en"
}
```
