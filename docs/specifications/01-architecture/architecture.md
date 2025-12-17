# 架構與核心系統規格

> 整合自 specs/001-refactor-architecture-cleanup

## 概述

**目標**：清理技術債務，建立可維護的模組化架構基礎

**狀態**：✅ 完成

---

## 架構清理任務

### 1. 移除空目錄

**問題**：`src/modules/` 目錄為空，造成混淆

**解決**：直接移除空目錄

### 2. FileService 整合

**問題**：`webviewManager.ts` 直接使用 `fs` 模組，難以測試

**解決**：整合 `FileService` 進行所有檔案操作

```typescript
// Before
import * as fs from 'fs';
const content = fs.readFileSync(path, 'utf-8');

// After
import { fileService } from '../services/fileService';
const content = await fileService.readFile(path);
```

**優點**：

-   可透過 mock 進行單元測試
-   統一錯誤處理
-   支援 workspace 與 extension 兩種上下文

### 3. Locale 載入去重

**問題**：`localeService.ts` 與 `blocklyEdit.js` 存在重複的語言載入邏輯

**解決**：

-   Extension Host 使用 `localeService.ts`
-   WebView 使用 `blocklyEdit.js` 中的 `languageManager`
-   避免邏輯重複，各司其職

### 4. 暫存檔案命名

**問題**：暫存檔案使用固定名稱可能造成覆蓋

**解決**：採用時間戳命名

```javascript
const tempFile = `temp_toolbox_${Date.now()}.json`;
```

### 5. 動態模組發現

**問題**：Arduino generator 模組使用硬編碼陣列

**解決**：實作 `discoverArduinoModules()` 動態發現

```typescript
// 自動掃描 media/blockly/generators/arduino/ 目錄
function discoverArduinoModules(): string[] {
	const generatorPath = path.join(extensionPath, 'media/blockly/generators/arduino');
	return fs
		.readdirSync(generatorPath)
		.filter(file => file.endsWith('.js'))
		.map(file => file.replace('.js', ''));
}
```

**優點**：新增 generator 檔案無需修改程式碼

### 6. 魔術數字抽取

**問題**：程式碼中散落數字常數

**解決**：抽取為具名常數

```typescript
// constants.ts
export const WEBVIEW_DEBOUNCE_MS = 100;
export const FILE_WATCH_DEBOUNCE_MS = 300;
export const MAX_RETRY_COUNT = 3;
```

---

## 架構圖

```
Extension Host (Node.js)           WebView (Browser Context)
├── extension.ts                   ├── blocklyEdit.html
│   └── 命令註冊、MCP Provider     │   └── DOM 結構、Script 載入
├── webview/                       ├── blocklyEdit.js (~1930 行)
│   ├── webviewManager.ts (~970)  │   └── Blockly 初始化、事件處理
│   └── messageHandler.ts (~800)  └── blockly/
│       └── 訊息處理、FileService      ├── blocks/*.js (積木定義)
├── mcp/                              └── generators/arduino/*.js (程式碼生成)
│   ├── mcpProvider.ts
│   ├── mcpServer.ts
│   └── tools/*.ts
└── services/
    ├── fileService.ts        # 檔案 I/O
    ├── settingsManager.ts    # VSCode/PlatformIO 設定
    ├── localeService.ts      # i18n 訊息載入
    ├── workspaceValidator.ts # 專案類型偵測
    └── logging.ts            # 統一日誌
```

---

## 通訊模式

### Extension ↔ WebView 訊息傳遞

```typescript
// Extension → WebView (webviewManager.ts)
panel.webview.postMessage({
	command: 'loadWorkspace',
	state: workspaceData,
});

// WebView → Extension (blocklyEdit.js)
vscode.postMessage({
	command: 'saveWorkspace',
	state: Blockly.serialization.workspaces.save(workspace),
});

// Handler 註冊 (messageHandler.ts)
switch (message.command) {
	case 'saveWorkspace':
		await this.handleSaveWorkspace(message);
		break;
	case 'newCommand':
		await this.handleNewCommand(message);
		break;
}
```

---

## 關鍵模式與慣例

### 日誌記錄

```typescript
// ✅ 正確：使用 logging service
import { log } from '../services/logging';
log.info('載入工作區', { board: 'esp32', file: 'main.json' });
log.error('儲存失敗', error);

// ❌ 錯誤：直接使用 console
console.log('something'); // 僅允許在 WebView 中使用
```

### 檔案操作

```typescript
// ✅ 正確：使用 FileService
const content = await fileService.readFile(filePath);
await fileService.writeFile(filePath, content);

// ❌ 錯誤：直接使用 fs
fs.readFileSync(filePath);
```

### 非同步模式

```typescript
// FileService 採用 async/await 模式
async readFile(path: string): Promise<string>
async writeFile(path: string, content: string): Promise<void>
async exists(path: string): Promise<boolean>
```

---

## 效能目標

| 指標            | 目標值           |
| --------------- | ---------------- |
| 編譯時間        | ≤ 5 秒           |
| Bundle 大小     | ≤ 137KB          |
| 測試執行        | ≤ 3 秒           |
| Blockly 11 相容 | main.json 可載入 |

---

## 相關文件

-   FileService 實作：`src/services/fileService.ts`
-   WebView 管理：`src/webview/webviewManager.ts`
-   訊息處理：`src/webview/messageHandler.ts`
