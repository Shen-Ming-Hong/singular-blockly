# Settings Manager Contract

**Feature**: Blockly Language Selector  
**Version**: 1.0.0

## 新增 API

### `SettingsManager` 類別擴展

---

### `getLanguage(): Promise<string>`

取得使用者的語言偏好設定。

**回傳值**：`"auto"` 或有效的語言代碼

**範例**：

```typescript
const settingsManager = new SettingsManager(workspacePath);
const language = await settingsManager.getLanguage();
// Returns: "auto" | "en" | "zh-hant" | ...
```

**實作**：

```typescript
async getLanguage(): Promise<string> {
  return await this.readSetting<string>('singular-blockly.language', 'auto');
}
```

---

### `updateLanguage(language: string): Promise<void>`

更新使用者的語言偏好設定。

**參數**：

- `language`: `"auto"` 或有效的語言代碼

**驗證**：

- 如果語言代碼無效，拋出錯誤

**範例**：

```typescript
await settingsManager.updateLanguage('ja');
```

**實作**：

```typescript
async updateLanguage(language: string): Promise<void> {
  const validLanguages = [
    'auto', 'en', 'zh-hant', 'ja', 'ko', 'es', 'fr',
    'de', 'it', 'pt-br', 'ru', 'pl', 'hu', 'cs', 'bg', 'tr'
  ];

  if (!validLanguages.includes(language)) {
    throw new Error(`Invalid language code: ${language}`);
  }

  await this.updateSetting('singular-blockly.language', language);
  log(`Language updated to: ${language}`, 'info');
}
```

---

### `resolveLanguage(languagePreference: string): string`

將語言偏好解析為實際的語言代碼。

**參數**：

- `languagePreference`: 使用者設定的語言偏好

**回傳值**：實際要使用的語言代碼

**範例**：

```typescript
// 如果 VS Code 語言是 zh-tw
const resolved = settingsManager.resolveLanguage('auto');
// Returns: "zh-hant"

const resolved2 = settingsManager.resolveLanguage('ja');
// Returns: "ja"
```

**注意**：此方法需要 `LocaleService` 來執行 VS Code 語言對應，可能需要調整設計。

---

## 設定鍵名

| 鍵名                                  | 類型   | 預設值    | 說明                   |
| ------------------------------------- | ------ | --------- | ---------------------- |
| `singular-blockly.theme`              | string | `"light"` | 主題設定（已存在）     |
| `singular-blockly.language`           | string | `"auto"`  | 語言偏好設定（新增）   |
| `singular-blockly.autoBackupInterval` | number | `30`      | 自動備份間隔（已存在） |
