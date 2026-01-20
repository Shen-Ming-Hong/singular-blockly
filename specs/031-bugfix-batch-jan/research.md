# Research: January 2026 Bugfix Batch

**Branch**: `031-bugfix-batch-jan` | **Date**: 2026-01-20

本文件記錄了四個 bug 修復的技術研究結果。

---

## 研究課題

### R-001: Blockly maxInstances 機制限制主程式積木

**問題**: 如何限制 `micropython_main` 和 `arduino_setup_loop` 積木各只能有一個實例？

**研究結果**:

**Decision**: 使用 Blockly 原生的 `maxInstances` 選項，在 `Blockly.inject()` 時配置。

**Rationale**:

- Blockly 官方 API 提供 `maxInstances` 選項，可在 workspace 初始化時限制特定積木類型的最大實例數
- 格式為 `maxInstances: { 'block_type': 數量 }`
- 當達到上限時，工具箱中的積木會自動變灰且無法拖曳
- 這是 Blockly 內建功能，無需額外開發

**實作範例** (來自 Blockly 官方測試):

```javascript
const workspace = Blockly.inject('blocklyDiv', {
	toolbox: toolbox,
	maxInstances: {
		micropython_main: 1,
		arduino_setup_loop: 1,
	},
	// ... 其他選項
});
```

**Alternatives considered**:

1. 使用 workspace 事件監聽攔截積木建立 → 較複雜，需手動處理邊緣情況
2. 在積木定義中設置檢查 → 無法在工具箱層級阻止

**注意事項**:

- `maxInstances` 在切換開發板時需要考慮，目前 `initializeBlocklyWorkspace()` 只會執行一次
- 已存在的積木（從舊專案載入）不受 `maxInstances` 影響，需要另行處理刪除邏輯

---

### R-002: 已存在多個主程式積木時的刪除處理

**問題**: 當載入含有多個主程式積木的舊專案時，`maxInstances` 無法自動刪除，如何讓使用者刪除多餘積木？

**研究結果**:

**Decision**: 動態控制積木的 `deletable` 屬性，當存在多於一個主程式積木時解除刪除保護。

**Rationale**:

- 目前 `micropython_main` 在 `init()` 中設置 `this.setDeletable(false)`
- `arduino_setup_loop` 沒有設置 `setDeletable(false)`，預設可刪除
- 需要統一行為：單一時不可刪除，多個時可刪除

**實作策略**:

1. 在 workspace 載入後，使用 `workspace.getBlocksByType()` 計算主程式積木數量
2. 如果數量 > 1，將所有該類型積木設為 `setDeletable(true)`
3. 如果數量 = 1，設為 `setDeletable(false)`（保護最後一個）
4. 監聽 `BLOCK_DELETE` 事件，當刪除後重新檢查數量並更新 deletable 狀態
5. 偵測到多個積木時顯示 Toast 警告

**程式碼位置**:

- `media/js/blocklyEdit.js` - 在 `handleMessage` 的 `loadWorkspace` case 後添加檢查
- 使用 workspace change listener 監聽刪除事件

---

### R-003: 備份預覽應開啟 WebView 預覽視窗

**問題**: `handlePreviewBackup()` 直接使用 `vscode.open` 開啟 JSON 備份，無法符合「預覽視窗 (blocklyPreview.html)」需求，也無法顯示積木。

**研究結果**:

**Decision**: 改為呼叫 `singular-blockly.previewBackup` 指令，由 `WebViewManager` 開啟預覽視窗並載入備份。

**Rationale**:

- 規格要求使用預覽視窗而非直接開啟 JSON 檔案
- 預覽視窗可正確載入 Blockly workspace 與 UI，提供一致的閱讀體驗
- 封裝在指令中，避免重複處理 WebView 建立與載入邏輯

**實作範例**:

```typescript
await vscodeApi.commands.executeCommand('singular-blockly.previewBackup', fullPath);
```

**Alternatives considered**:

1. 使用 `vscode.open` / `openTextDocument()` 開啟 JSON → 只能看到原始檔案內容，不符合預覽需求
2. 直接在 messageHandler 建立 WebView → 重複邏輯，違反現有架構分層

**注意事項**:

- `singular-blockly.previewBackup` 需已註冊並可取得完整備份路徑
- 指令內會處理 `blocklyPreview.html` 與 workspace 載入流程

---

### R-004: 還原備份前建立自動備份

**問題**: `handleRestoreBackup()` 缺少還原前的自動備份步驟。

**研究結果**:

**Decision**: 在 `copyFile()` 之前，先檢查 `main.json` 是否存在，若存在則建立 `auto_restore_YYYYMMDD_HHMMSS.json` 備份。

**Rationale**:

- 現有程式碼直接執行 `await this.fileService.copyFile(backupPath, mainJsonPath)`
- 缺少保護現有工作的步驟
- 應在確認對話框通過後、覆蓋 `main.json` 前，執行備份

**實作策略**:

1. 檢查 `main.json` 是否存在
2. 若存在，生成時間戳記格式的備份檔名 `auto_restore_YYYYMMDD_HHMMSS.json`
3. 複製 `main.json` 到 `blockly/backup/auto_restore_*.json`
4. 繼續原有的還原流程

**時間戳記格式**:

```typescript
const now = new Date();
const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/T/, '_').slice(0, 15);
// 結果: "20260120_180409"
const autoRestoreName = `auto_restore_${timestamp}`;
```

---

### R-005: Blockly.Msg 翻譯鍵缺失問題

**問題**: `CONTROLS_REPEAT_INPUT_DO` 等 Blockly 內建積木翻譯鍵缺失，需建立掃描工具全盤檢查。

**研究結果**:

**Decision**: 建立 `scripts/i18n/scan-blockly-msg.js` 掃描工具，識別所有專案中使用但未定義的 Blockly.Msg 鍵。

**Rationale**:

- Blockly 內建積木會查找 `Blockly.Msg['KEY']` 來顯示翻譯文字
- 專案翻譯檔案 (`media/locales/*/messages.js`) 需要包含這些鍵
- 目前已知缺失 `CONTROLS_REPEAT_INPUT_DO`，但可能還有其他缺失

**掃描策略**:

1. 從 Blockly 官方翻譯檔案 (`node_modules/blockly/msg/*.js`) 提取所有可能的 Msg 鍵
2. 掃描專案中的積木定義檔案 (`media/blockly/blocks/*.js`)，找出實際使用的 Msg 鍵
3. 比對專案翻譯檔案，識別缺失的鍵
4. 輸出報告：鍵名、英文預設值、受影響積木類型

**已知需補充的翻譯鍵** (來自 Blockly 迴圈積木):

- `CONTROLS_REPEAT_INPUT_DO` - "do" (迴圈執行區塊標籤)
- 可能還有其他 `CONTROLS_*`、`LOGIC_*`、`MATH_*` 等系列鍵

**Blockly 官方翻譯檔案位置**:

- `node_modules/blockly/msg/en.js` (英文)
- `node_modules/blockly/msg/zh-hant.js` (繁體中文)

---

## 技術發現總結

| 課題  | 解決方案                         | 複雜度 | 風險 |
| ----- | -------------------------------- | ------ | ---- |
| R-001 | Blockly `maxInstances` 選項      | 低     | 低   |
| R-002 | 動態 `setDeletable()` + 事件監聽 | 中     | 中   |
| R-003 | 預覽指令開啟 blocklyPreview.html | 低     | 低   |
| R-004 | 還原前複製到 `auto_restore_*`    | 低     | 低   |
| R-005 | 建立掃描工具 + 補充 15 語言翻譯  | 中     | 低   |

---

## 參考資源

- [Blockly inject 選項文件](https://developers.google.com/blockly/guides/configure/web/configuration-options)
- [VSCode vscode.open 命令](https://code.visualstudio.com/api/references/commands)
- 現有專案檔案:
    - `media/js/blocklyEdit.js` 第 1807 行 - Blockly.inject
    - `media/blockly/blocks/cyberbrick.js` 第 18 行 - setDeletable(false)
    - `src/webview/messageHandler.ts` 第 1014-1143 行 - 備份還原邏輯
