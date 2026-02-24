# 研究報告：Singular Block — 自訂積木 JSON 系統

**Branch**: `046-custom-block-json` | **Date**: 2026-02-24

## 1. 積木動態註冊機制

### 決策：使用 `Blockly.Blocks[type] = { init() { this.jsonInit(def) } }` 混合模式

**理由**：

- 專案中所有既有積木皆使用 `Blockly.Blocks[type] = { init }` 手動模式
- JSON 定義可透過 `this.jsonInit()` 轉換為等效的手動初始化
- 自訂積木使用 `jsonInit()` 可降低從 JSON 檔案到積木定義的映射複雜度
- 額外欄位（如 `customContextMenu`）可在 `init()` 中手動附加

**替代方案**：

- `Blockly.common.defineBlocksWithJsonArray()` — 專案中未使用，且不支援附加 `customContextMenu` 等方法，已排除
- 純手動 `init()` — 需要複雜的 JSON→JavaScript 轉譯器，增加維護成本

### 關鍵發現（含跨 Context 注意事項）

**`isBuiltinBlockType()` 跨 Context 議題**：`Blockly.Blocks` 全域物件僅存在 WebView 端，Extension Host 無法直接存取。解決方案：Extension Host 維護硬編碼的 `BUILTIN_BLOCK_TYPES` Set（從 `media/blockly/blocks/*.js` 收集所有已定義的 block type），並在 WebView 初始化時由 WebView 回傳實際的 `Blockly.Blocks` 完整清單作為補充校驗。

### 關鍵發現

- `Blockly.Blocks[type]` 可在任意時間點動態設定，Blockly 不需要預先宣告
- **必須在 `Blockly.serialization.workspaces.load()` 之前註冊**，否則會拋出錯誤
- 取消註冊使用 `delete Blockly.Blocks[type]`

---

## 2. Generator 動態註冊

### 決策：使用模板字串 + `new Function()` 替代方案 → 選擇字串模板替換

**理由**：

- 自訂積木的 Arduino/MicroPython 程式碼模板是字串，包含 `${INPUT_NAME}` 佔位符
- 不需要 `new Function()` 或 `eval()`（安全風險）
- 使用簡單的字串替換：遍歷所有 input 名稱，將 `${NAME}` 替換為 `generator.valueToCode(block, 'NAME', ORDER)`
- `arduinoGenerator.includes_`、`lib_deps_`、`micropythonGenerator.addImport()`、`addHardwareInit()` 可根據 JSON 定義的欄位直接呼叫

**替代方案**：

- `eval()` / `new Function()` — 安全風險，已排除
- 使用者撰寫完整 JavaScript generator 函數 — 對非開發者使用者門檻太高，已排除

---

## 3. 工具箱動態注入

### 決策：在 WebView 端的 `workspace.updateToolbox()` 流程中注入「Singular Block」分類

**理由**：

- 工具箱 JSON 每次開啟面板時由 Extension Host 寫入臨時檔案
- WebView 端的 `updateToolboxForBoard()` 會 fetch 並解析工具箱
- 在 fetch 完成後、呼叫 `workspace.updateToolbox()` 前，動態插入新分類即可
- 不需要修改 `index.json` 或建立新的 category JSON 檔案

**替代方案**：

- 修改 `index.json` 加入 `$include` — 需要管理分類的動態生成與清除，過於複雜
- Extension Host 在臨時檔案中注入 — 增加 Extension 與 WebView 的耦合度

---

## 4. 佔位積木實作策略

### 決策：預掃描 workspace JSON → 註冊 placeholder block type → 正常 load

**理由**：

- Blockly `load()` 遇到未知 type 會拋出錯誤，無法跳過
- 在 `load()` 之前預掃描 workspace state JSON，找出所有被引用的 block type
- 對未知 type 註冊臨時的 placeholder block（橘紅色、顯示類型名稱）
- `load()` 完成後，placeholder block 已正確就位
- 當 JSON 恢復時，移除 placeholder 定義並重新註冊正常定義，然後觸發工作區重載

**替代方案**：

- `Blockly.serialization.blocks.append()` 逐個載入 + try-catch — 失去區塊間的連接關係，已排除
- 自訂 deserializer plugin — Blockly 12.x 中 serialization 不夠靈活，不適合

### Placeholder Block 形狀保存

- 需要在工作區 JSON 的 block entry 中記錄 `outputConnection` / `previousConnection` / `nextConnection` 資訊
- 讀取 workspace state 時，可從 block 的 serialized data 中推斷形狀：
    - 有 `"output"` 欄位 → Value 形狀
    - 有 `"previousConnection"` → Statement 形狀
    - 兩者皆無 → Hat 形狀（頂層積木）

---

## 5. PlatformIO 函式庫搜尋

### 決策：透過 `pio pkg search` CLI 指令搜尋

**理由**：

- 專案已有 `CommandExecutor` 介面（`arduinoUploader.ts`），用 `child_process.exec` 執行 PIO CLI
- `pio pkg search --type library "servo"` 回傳庫名、版本、描述
- 可加 `--json-output` 取得結構化結果
- Extension Host 端執行搜尋，結果透過 `postMessage` 傳回 WebView

**替代方案**：

- PlatformIO Registry REST API — 需要外部網路請求，不如 CLI 穩定且受 PIO 代理設定影響
- 內建常用 header→lib 對應表 — 覆蓋率有限，難以維護

### 搜尋流程

1. WebView 發 `{ command: 'searchPioLibrary', query: 'servo' }` 訊息
2. Extension Host 執行 `pio pkg search --type library --json-output "servo"`
3. 解析 JSON 結果，提取 `name`、`version`、`description`、`authors`、`headers`
4. 回傳 `{ command: 'pioLibraryResults', results: [...] }` 給 WebView
5. 使用者在清單中選取 → 自動填入 `arduinoIncludes` 和 `arduinoLibDeps`

---

## 6. 右鍵選單整合

### 決策：使用 `Blockly.ContextMenuRegistry.registry.register()` 全域註冊

**理由**：

- 專案目前無任何右鍵選單自訂，從零建立
- 全域註冊比積木級別 `customContextMenu` 更適合批次管理
- `preconditionFn` 可檢查 block.type 是否為自訂積木，決定是否顯示選項
- 無需修改每個積木的定義

**替代方案**：

- 在 `Blockly.Blocks[type]` 的 `init()` 中加 `customContextMenu` — 需要在每個自訂積木註冊時注入，耦合度高

---

## 7. MicroPython 標準函式庫限制

### 決策：`micropythonImports` 僅做格式驗證，不做函式庫白名單檢查

**理由**：

- MicroPython 標準函式庫在不同硬體板上有差異（CyberBrick 有特殊模組）
- 嚴格的白名單容易造成誤判，反而限制使用者
- 在精靈 UI 中提供常用標準庫的快速選擇下拉即可（machine、time、neopixel、uos 等）
- JSON Schema 可列出常用選項作為 enum 建議（非強制）

---

## 8. 精靈 UI 技術方案

### 決策：擴展現有 Modal 模式（`.modal` CSS class），WebView HTML 內嵌

**理由**：

- 已有兩個 Modal 實作（備份管理、積木搜尋），CSS 和 HTML 模式成熟
- 精靈 UI 需要即時預覽 Blockly SVG，只能在 WebView 端實現（需要 Blockly 庫）
- 使用 `display: none/block` 控制四個步驟面板的切換
- Blockly SVG 預覽可用 `Blockly.serialization.workspaces.load()` 到隱藏的 mini workspace

**替代方案**：

- VS Code WebView Panel（獨立面板） — 無法共用 Blockly 庫實例，已排除
- VS Code Quick Pick / Input Box — 功能太受限，無法做即時預覽

---

## 9. 檔案監聽策略

### 決策：新增獨立的 `FileSystemWatcher` 監聽 `blockly/custom-blocks/**/*.json`

**理由**：

- 既有的 watcher 僅監聽 `blockly/main.json`，模式不同
- 新 watcher 需要額外的 debounce（500ms）和事件分類（create/change/delete）
- 使用 `vscode.RelativePattern` + glob pattern 即可

### 事件處理流程

| 事件          | 處理                                                      |
| ------------- | --------------------------------------------------------- |
| `onDidCreate` | 讀取 JSON、驗證、註冊積木、更新工具箱                     |
| `onDidChange` | 讀取 JSON、驗證、更新積木定義、刷新工作區中所有同類型積木 |
| `onDidDelete` | 將工作區中的積木替換為 placeholder、更新工具箱            |
