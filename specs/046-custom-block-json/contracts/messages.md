# 介面合約：Extension ↔ WebView 訊息協定

**Branch**: `046-custom-block-json` | **Date**: 2026-02-24

此文件定義 Extension Host 與 WebView 之間新增的 `postMessage` 命令合約。

## Extension → WebView 訊息

### `updateCustomBlocks`

當自訂積木 JSON 變更時（新增、修改、刪除），Extension 傳送更新的完整自訂積木定義清單。

```typescript
{
  command: 'updateCustomBlocks';
  customBlocks: CustomBlockDefinition[];   // 目前所有有效的自訂積木
  removed: string[];                        // 被移除的積木 type 清單（用於觸發 placeholder）
}
```

### `initCustomBlocks`

初始化時（`init` 訊息之前或合併），傳送所有自訂積木定義，WebView 在 `load()` 之前註冊。

```typescript
{
  command: 'initCustomBlocks';
  customBlocks: CustomBlockDefinition[];   // 所有有效的自訂積木
  placeholders: PlaceholderBlockMeta[];    // 需要註冊 placeholder 的積木資訊
}
```

### `pioLibraryResults`

PlatformIO 函式庫搜尋結果回傳。

```typescript
{
  command: 'pioLibraryResults';
  results: PioLibraryInfo[];   // 搜尋到的函式庫列表
  error?: string;              // 搜尋失敗時的錯誤訊息
}
```

```typescript
interface PioLibraryInfo {
	name: string; // 函式庫名稱
	version: string; // 最新版本
	description: string; // 函式庫描述
	authors: string[]; // 作者
	headers: string[]; // 標頭檔列表
	libDep: string; // lib_deps 格式字串（如 "arduino-libraries/Servo@^1.2.2"）
}
```

## WebView → Extension 訊息

### `saveCustomBlock`

精靈 UI 完成後儲存自訂積木定義。

⚠️ **安全注意**：Extension Host 端必須驗證 `filePath` 解析後在 `blockly/custom-blocks/` 目錄內（防止路徑穿越攻擊）。新建模式建議由 Extension Host 從 `type` 欄位推導檔名。

```typescript
{
  command: 'saveCustomBlock';
  definition: CustomBlockDefinition;
  filePath?: string;        // 編輯模式下的原始檔案路徑，新建時為 undefined
}
```

### `deleteCustomBlock`

刪除自訂積木（未來可能由精靈 UI 或 MCP 觸發）。

```typescript
{
	command: 'deleteCustomBlock';
	type: string; // 要刪除的積木 type
}
```

### `searchPioLibrary`

精靈 UI 中觸發 PlatformIO 函式庫搜尋。

```typescript
{
	command: 'searchPioLibrary';
	query: string; // 搜尋關鍵字
}
```

### `openCustomBlockWizard`

**Extension Host → WebView**：由 Extension 端主動觸發精靈開啟（如 MCP 工具觸發）。注意：WebView 端的右鍵選單和工具箱按鈕應直接呼叫 `openWizard()` 函式，不需要經由 postMessage 中轉。

```typescript
{
  command: 'openCustomBlockWizard';
  mode: 'create' | 'edit';
  definition?: CustomBlockDefinition;   // 編輯模式下傳入現有定義
}
```

---

# 介面合約：MCP 工具 Schema

## `create_custom_block`

```typescript
{
  name: 'create_custom_block',
  description: '建立新的自訂積木 JSON 檔案',
  inputSchema: {
    type: z.string().describe('積木類型識別碼'),
    message: z.string().describe('積木顯示文字'),
    colour: z.number().min(0).max(360).describe('積木顏色 HSV hue'),
    shape: z.enum(['statement', 'value', 'hat']).describe('積木形狀'),
    tooltip: z.string().optional().describe('提示文字'),
    inputs: z.array(CustomBlockInputSchema).optional().describe('輸入欄位'),
    arduino: ArduinoTemplateSchema.optional().describe('Arduino 程式碼模板'),
    micropython: MicroPythonTemplateSchema.optional().describe('MicroPython 模板'),
  }
}
```

## `list_custom_blocks`

```typescript
{
  name: 'list_custom_blocks',
  description: '列出所有已載入的自訂積木',
  inputSchema: {} // 無參數
}
```

## `validate_custom_block`

```typescript
{
  name: 'validate_custom_block',
  description: '驗證自訂積木 JSON 定義的格式正確性',
  inputSchema: {
    definition: z.string().describe('JSON 字串格式的積木定義'),
  }
}
```

## `delete_custom_block`

```typescript
{
  name: 'delete_custom_block',
  description: '刪除指定的自訂積木 JSON 檔案',
  inputSchema: {
    type: z.string().describe('要刪除的積木類型識別碼'),
  }
}
```

---

# 介面合約：JSON Schema（自訂積木檔案格式）

Schema 檔案位置：`media/schemas/custom-block.schema.json`

使用者在 JSON 中加入 `"$schema": "./custom-block.schema.json"` 即可啟用 IntelliSense。Extension 透過 `package.json` 的 `json.schemas` 設定自動關聯 `blockly/custom-blocks/*.json`。
