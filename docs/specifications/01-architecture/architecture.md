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
│   └── 命令、Skill 與 watcher 生命週期 │   └── DOM 結構、Script 載入
├── webview/                       ├── blocklyEdit.js (~1930 行)
│   ├── webviewManager.ts (~970)  │   └── Blockly 初始化、事件處理
│   └── messageHandler.ts (~800)  └── blockly/
│       └── 訊息處理、FileService      ├── blocks/*.js (積木定義)
└── services/
    ├── projectSkillService.ts # 專案 Skill 安裝／更新交易
    ├── blockContractService.ts # 正式積木契約讀取
    ├── workspaceCandidateService.ts # 外部候選隔離／復原
    ├── managedRuntimeInitializationCoordinator.ts # activation／editor-open 預熱去重
    ├── managedRuntimeService.ts # 自有 Python／PlatformIO／mpremote ensure、診斷與修復
    ├── managedRuntimeInstaller.ts # checksum、staging、lock、健康檢查與原子提交
    ├── coreEnvironmentManager.ts # Provider／Managed 雙 Core 路由與安全 fallback
    ├── fileService.ts        # 檔案 I/O
    ├── settingsManager.ts    # VSCode/PlatformIO 設定
    ├── localeService.ts      # i18n 訊息載入
    ├── workspaceValidator.ts # 專案類型偵測
    └── logging.ts            # 統一日誌
```

## 受管理 Runtime 與雙 Core

Extension 的 `onStartupFinished` activation 完成後，`ManagedRuntimeInitializationCoordinator` 先讀取本機 `current.json`；缺失或損壞時在背景呼叫冪等 `ensureReady()`，不等待第一次上傳。使用者每次從活動列或命令開啟 Blockly 編輯器都會再次檢查；同視窗共用單一 in-flight Promise，跨視窗由 install lock 序列化。背景網路失敗不阻止編輯器開啟，上傳器仍自行 `ensureReady()` 作最後防線。

受管理環境位於 Extension `globalStorageUri` 或經驗證的 machine-scoped 本機路徑。根目錄必須為空目錄或已有有效 Singular ownership marker；安裝、修復與 cleanup 共用同一把跨視窗 lock。系統使用固定 SHA-256 manifest 下載 CPython 與 PlatformIO installer，以 pip constraint 限制 PlatformIO 受測版本範圍，完成 staging transaction、工具 probe 與原子 `current.json` 後才視為 ready。它不使用系統 Python，也不修改 provider penv。

工作負載路由固定如下：

| 工作負載 | Primary | Fallback |
|----------|---------|----------|
| Arduino build／upload／monitor | PlatformIO／PIOArduino Provider Core | Singular managed Core |
| CyberBrick USB／Python／mpremote | Singular managed Core | Provider Core |

只有找不到 executable、spawn、Python import、權限或本機 store 損壞等「專案程序啟動前」錯誤可 fallback 一次。編譯、project config、DNS、proxy、TLS、registry、裝置、serial、取消或 upload spawn 後錯誤都不換 Core。

## 編輯器開啟與 Workspace 寫入授權

`WebViewManager.createAndShowWebView()` 以 `opened`、`cancelled`、`no-workspace` 回報開啟結果。對一般資料夾，`WorkspaceValidator` 的專案辨識與偏好查詢發生在任何 workspace-local 寫入之前；`SettingsManager.readSetting()` 不得為缺少的設定檔建立 `.vscode/`。只有 `opened` 代表既有 Blockly 專案或使用者已明確繼續，呼叫端才可初始化設定與強制安裝 Project Skill。

因此 managed Core 的 extension-owned 背景初始化可以在 activation 進行，但不代表一般資料夾已同意成為專案。`cancelled` 與 `no-workspace` 都不得建立 `.agents/`、`.claude/`、`blockly/` 或 `.vscode/`；activation 與 workspace-folder change 不具有 Skill 安裝入口。已有 `blockly/` marker 的專案開啟 editor 時不重複詢問，並在 `opened` 後靜默維護 Skill。

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
