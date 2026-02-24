# Implementation Plan: Singular Block — 自訂積木 JSON 系統

**Branch**: `046-custom-block-json` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/046-custom-block-json/spec.md`

## Summary

使用者可透過 JSON 檔案定義自訂 Blockly 積木，放入 `blockly/custom-blocks/` 資料夾後即時載入到「Singular Block」工具箱分類。支援三種建立方式（手動 JSON + Schema IntelliSense、精靈 UI Modal、MCP 聊天工具），佔位積木保護與自動恢復機制，以及 Arduino/MicroPython 雙平台程式碼生成（含 `includes`/`lib_deps`/`imports`/`hardwareInit` 依賴管理）。

**技術方案**：Extension Host 負責 JSON 檔案監聽、驗證、管理；WebView 負責積木動態註冊（`Blockly.Blocks[type]`）、工具箱注入（`workspace.updateToolbox()`）、精靈 UI Modal、右鍵選單。兩端透過 `postMessage` 通訊。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension Host) + JavaScript ES2020 (WebView)
**Primary Dependencies**: Blockly 12.3.1, VS Code Extension API 1.105.0+, MCP SDK 1.26.0, Zod 4.1.13
**Storage**: `blockly/custom-blocks/*.json` 檔案（工作區內）
**Testing**: Mocha + Sinon + @vscode/test-electron（Extension Host 端），手動測試（WebView 端）
**Target Platform**: VS Code Desktop（Windows, macOS, Linux）
**Project Type**: VS Code Extension（兩層架構：Extension Host + WebView）
**Performance Goals**: JSON 載入到積木出現 < 2 秒，精靈預覽同步 < 500ms
**Constraints**: WebView 無法 import Extension Host 模組（只能 postMessage），Blockly `load()` 前必須註冊所有 block type
**Scale/Scope**: 單一工作區，預期 1-50 個自訂積木，15 種語系

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                 | 評估                                                                                 | 通過 |
| -------------------- | ------------------------------------------------------------------------------------ | ---- |
| I. 簡潔性與可維護性  | JSON 定義格式簡化、字串模板替換（非 eval）、既有模式複用                             | ✅   |
| II. 模組化與可擴展性 | 新增 `customBlockService.ts` 獨立服務、精靈 UI 獨立 Modal、MCP 工具獨立檔案          | ✅   |
| III. 避免過度開發    | 嚴格遵循 spec scope boundary，不做匯出/分享/市集/版本管理                            | ✅   |
| IV. 彈性與適應性     | JSON 格式支援選填欄位、雙平台模板、schema 驅動驗證                                   | ✅   |
| V. 研究驅動開發      | Phase 0 research 已完成，覆蓋所有 Blockly/PlatformIO/WebView API                     | ✅   |
| VI. 結構化日誌       | 使用 `log()` from `logging.ts`（Extension），`console.log`（WebView）                | ✅   |
| VII. 全面測試覆蓋    | Extension Host 服務 100% 覆蓋，WebView 精靈 UI 手動測試（符合 UI Testing Exception） | ✅   |
| VIII. 純函式與模組化 | JSON 驗證、模板替換為純函式，副作用（檔案 I/O）隔離在 service 層                     | ✅   |
| IX. 繁體中文文件     | 所有 spec/plan/research 文件皆繁體中文                                               | ✅   |
| X. 專業發布管理      | 不涉及此功能                                                                         | N/A  |
| XI. 技能架構         | 不涉及此功能                                                                         | N/A  |

**Pre-Phase 0 結果**：全部通過，無違規項。

## Project Structure

### Documentation (this feature)

```text
specs/046-custom-block-json/
├── plan.md              # 本檔案
├── spec.md              # 功能規格
├── research.md          # Phase 0 研究報告
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速上手
├── contracts/           # Phase 1 介面合約
│   └── messages.md      # Extension ↔ WebView 訊息協定 & MCP Schema
├── checklists/          # 需求檢查清單
│   └── requirements.md
└── tasks.md             # Phase 2 任務清單（由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
src/
├── services/
│   └── customBlockService.ts       # [新增] 自訂積木管理服務（驗證、監聽、載入/卸載）
├── mcp/
│   └── tools/
│       └── customBlock.ts          # [新增] MCP 工具（create/list/validate/delete）
├── webview/
│   ├── messageHandler.ts           # [修改] 新增 custom block 相關訊息處理
│   └── webviewManager.ts           # [修改] 初始化時載入自訂積木、設定 FileWatcher
├── types/
│   └── customBlock.ts              # [新增] CustomBlockDefinition 等型別定義
└── test/
    └── suite/
        ├── customBlockService.test.ts  # [新增] 服務單元測試
        └── customBlockMcp.test.ts      # [新增] MCP 工具單元測試

media/
├── blockly/
│   └── blocks/
│       └── customBlocks.js         # [新增] 動態積木註冊/取消、placeholder、generator
├── js/
│   └── blocklyEdit.js              # [修改] 精靈 UI Modal、右鍵選單、updateToolbox 注入
├── html/
│   └── blocklyEdit.html            # [修改] 精靈 UI Modal HTML
├── css/
│   └── blocklyEdit.css             # [修改] 精靈 UI Modal CSS
├── schemas/
│   └── custom-block.schema.json    # [新增] JSON Schema
└── locales/
    └── */messages.js               # [修改] 新增 i18n key（15 語系）
```

**Structure Decision**: 遵循專案既有的兩層架構（Extension Host + WebView），新增 `customBlockService.ts` 作為核心服務。WebView 端新增 `customBlocks.js` 處理動態積木註冊；精靈 UI 直接內嵌在 `blocklyEdit.html/js/css` 中，與既有 Modal 模式一致。

## Complexity Tracking

> 無違規項，此區為空。

## Phase 規劃

### Phase 1: 核心載入引擎（P1 — FR-001, FR-002, FR-003, FR-007, FR-016, FR-018, FR-019）

**目標**：實現自訂積木 JSON 的讀取、驗證、動態註冊、工具箱注入和程式碼生成。

**Extension Host 端**：

1. 建立 `src/types/customBlock.ts`：`CustomBlockDefinition`、`CustomBlockInput`、`ArduinoTemplate`、`MicroPythonTemplate` 型別
2. 建立 `src/services/customBlockService.ts`：
    - `loadAllCustomBlocks(folderPath)`: 掃描資料夾、讀取 JSON、驗證、去重
    - `validateCustomBlock(json)`: 純函式，驗證 JSON 格式
    - `isBuiltinBlockType(type)`: 檢查是否與內建積木衝突（維護硬編碼 `BUILTIN_BLOCK_TYPES` Set + WebView 提供的動態清單，因 `Blockly.Blocks` 僅存在 WebView 端）
    - 底線前綴檔案跳過邏輯
3. 修改 `src/webview/messageHandler.ts`：
    - 新增獨立的 `initCustomBlocks` 訊息，在 `init` 之前傳送（不合併到 `handleRequestInitialState()`）
4. 修改 `src/webview/webviewManager.ts`：
    - 初始化時呼叫 `customBlockService.loadAllCustomBlocks()`
    - 確保自訂積木資料在 `init` 訊息前就位

**WebView 端**：5. 建立 `media/blockly/blocks/customBlocks.js`：

- `registerCustomBlock(def)`: 用 `Blockly.Blocks[type] = { init() { this.jsonInit(...) } }` 註冊
- `registerCustomGenerator(def)`: 註冊 Arduino/MicroPython generator（字串模板替換）
- `unregisterCustomBlock(type)`: `delete Blockly.Blocks[type]` 取消註冊

6. 修改 `media/js/blocklyEdit.js`：
    - 接收 `initCustomBlocks` 訊息後，在 `load()` 之前註冊所有自訂積木
    - 在 `updateToolboxForBoard()` 中注入「Singular Block」分類

**測試**：7. `customBlockService.test.ts`：驗證載入、格式驗證、衝突檢查、去重 8. WebView 端手動測試：新增 JSON → 工具箱顯示 → 拖曳使用 → 生成程式碼

---

### Phase 2: FileWatcher 與即時更新（P1 — FR-001 即時性）

**目標**：監聽 `blockly/custom-blocks/` 資料夾變更，即時更新 WebView。

**Extension Host 端**：

1. 修改 `src/webview/webviewManager.ts`：
    - 新增 `setupCustomBlockWatcher()`：`vscode.workspace.createFileSystemWatcher('blockly/custom-blocks/**/*.json')`
    - `onDidCreate` / `onDidChange` / `onDidDelete` 事件處理（500ms debounce）
2. 修改 `src/webview/messageHandler.ts`：
    - 新增 `updateCustomBlocks` 訊息發送邏輯
    - 帶入 `customBlocks`（全量）和 `removed`（差異）

**WebView 端**：3. 修改 `media/js/blocklyEdit.js`：

- 接收 `updateCustomBlocks` 訊息
- 對 `removed` 中的 type 執行 `unregisterCustomBlock()`
- 對新增/修改的定義執行 `registerCustomBlock()` + `registerCustomGenerator()`
- 呼叫 `workspace.updateToolbox()` 刷新工具箱

---

### Phase 3: 佔位積木保護（P1 — FR-004, FR-005）

**目標**：JSON 刪除/損壞時，工作區中使用的積木替換為橘紅色警告積木。

**WebView 端**：

1. 在 `customBlocks.js` 中新增 `registerPlaceholderBlock(type, shape)`：
    - 根據 shape 決定 output/previousConnection/nextConnection
    - 橘紅色（hue 20）+ 顯示類型名稱
    - 註冊 generator：Arduino 輸出 `// [Missing block: {type}]`，MicroPython 輸出 `# [Missing block: {type}]`
2. 在 `updateCustomBlocks` 處理中，對 `removed` 的 type：
    - 先記錄工作區中現有的 block instance 位置
    - 註冊 placeholder
    - 觸發重建受影響的 block（保留連接關係）

**Extension Host 端**：3. `customBlockService.ts` 追蹤 `PlaceholderBlockMeta[]`（記憶體內）4. 在 `updateCustomBlocks` 訊息中附帶 placeholder 資訊

**載入時保護**：5. 修改 `blocklyEdit.js` 的 `handleWorkspaceLoadMessage()`：

- 在 `load()` 之前預掃描 workspace state JSON
- 找出引用了但未註冊的 block type
- 推斷形狀（`output` → value, `previousConnection` → statement）
- 預先註冊 placeholder → 正常 `load()`

---

### Phase 4: 佔位積木自動恢復（P2 — FR-006）

**目標**：重建同名 JSON 後，placeholder 自動轉回正常積木。

**WebView 端**：

1. 在 `updateCustomBlocks` 處理中，當新增的 type 與現有 placeholder 重疊：
    - `unregisterCustomBlock(type)`（移除 placeholder 定義）
    - `registerCustomBlock(newDef)`（註冊正常定義）
    - 保存當前 workspace state → 重新 `load()` → 恢復
2. 確保恢復後積木位置和連接關係完整保留

---

### Phase 5: 精靈 UI（P2 — FR-008, FR-009, FR-010, FR-020）

**目標**：置中 Modal，步驟式引導建立自訂積木。

**HTML/CSS**：

1. 修改 `blocklyEdit.html`：新增 `#customBlockWizardModal` 容器
    - 步驟一：基本設定（type, message, colour, shape, tooltip）
    - 步驟二：輸入欄位管理（新增/刪除/排序欄位）
    - 步驟三：程式碼模板（Arduino + MicroPython，含 PIO 搜尋按鈕）
    - 步驟四：確認預覽 + 儲存按鈕
    - 右側預覽區域（Blockly SVG + 程式碼 tabs）
    - 頂部進度條（可點擊切步驟）
2. 修改 `blocklyEdit.css`：精靈 UI 樣式，支援 light/dark 主題

**JavaScript**：3. 修改 `blocklyEdit.js`：

- `WizardState` 物件管理表單資料
- 步驟切換邏輯：show/hide step panels
- 即時預覽：從表單資料產生臨時 `Blockly.Blocks[type]` → 渲染到 mini workspace
- 程式碼預覽：從表單資料執行模板替換 → 顯示結果
- 「完成」按鈕觸發 `saveCustomBlock` message 到 Extension

4. 工具箱中「Singular Block」分類加入 `<button>` 元素作為「＋ 建立新積木」入口

**i18n**：5. 15 語系 `messages.js` 新增所有精靈 UI 相關 key

---

### Phase 6: 精靈編輯模式 + 右鍵選單（P2 — FR-011）

**目標**：右鍵自訂積木 → 編輯積木定義。

**WebView 端**：

1. 在 `customBlocks.js` 中用 `Blockly.ContextMenuRegistry.registry.register()` 註冊：
    - `id: 'edit_custom_block_definition'`
    - `scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK`
    - `preconditionFn`: 檢查 block.type 是否為自訂積木，是才 `enabled`
    - `callback`: 直接呼叫 WebView 端 `openWizard('edit', definition)`，無需 postMessage 中轉（右鍵選單和精靈皆在 WebView 端）
2. 精靈以編輯模式開啟：
    - 預填所有欄位
    - `type` 欄位設為 readonly
    - 「完成」時覆寫原始 JSON 檔案

---

### Phase 7: PlatformIO 函式庫搜尋（P2 — FR-021）

**目標**：精靈步驟三的「搜尋函式庫」按鈕。

**Extension Host 端**：

1. 修改 `messageHandler.ts`：處理 `searchPioLibrary` 訊息
2. 使用 `CommandExecutor` 執行 `pio pkg search --type library --json-output "{query}"`
3. 解析結果，回傳 `pioLibraryResults` 訊息

**WebView 端**：4. 精靈步驟三新增搜尋 UI（輸入框 + 結果列表）5. 使用者選取後自動填入 `includes` 和 `libDeps` 欄位 6. 搜尋 UI 文字全部 i18n 化

---

### Phase 8: MCP 工具（P3 — FR-012, FR-013）

**目標**：4 個 MCP 工具供 Copilot 聊天使用。

1. 建立 `src/mcp/tools/customBlock.ts`：
    - `create_custom_block`: 驗證 + 寫入 JSON + 防重名
    - `list_custom_blocks`: 回傳所有已載入的自訂積木
    - `validate_custom_block`: 格式驗證
    - `delete_custom_block`: 刪除 JSON 檔案
2. 在 `mcpServer.ts` 中註冊工具
3. 在 `src/mcp/tools/index.ts` 中匯出
4. 執行 `npm run generate:dictionary` 更新 block-dictionary.json

---

### Phase 9: JSON Schema + IntelliSense（P3 — FR-014）

**目標**：VS Code 自動補全和錯誤高亮。

1. 建立 `media/schemas/custom-block.schema.json`：完整 JSON Schema
2. 修改 `package.json`：加入 `json.schemas` 設定，自動關聯 `blockly/custom-blocks/*.json`
3. Schema 中的 `description` 欄位使用中英文說明

---

### Phase 10: 範例檔案與語系（P3 — FR-015, FR-016, FR-017）

**目標**：`_example.json` 建立與語系同步。

**Extension Host 端**：

1. `customBlockService.ts` 中新增 `ensureExampleFile(folderPath, locale)` 和 `updateExampleLocale(folderPath, locale)`
2. 15 語系的範例模板（字典形式），首次建立時寫入
3. 語系切換事件觸發 `_example.json` 更新

**測試**：4. `customBlockService.test.ts`：範例建立、語系切換、底線前綴跳過 5. 15 語系 `messages.js` 新增範例相關 key

---

### Phase 11: i18n 驗證與最終整合

**目標**：確保所有 15 語系完整、所有功能串接正確。

1. `npm run validate:i18n` 驗證所有新增 key
2. 端到端手動測試全流程
3. 更新 `block-dictionary.json`
4. 更新 spec status 為 Implemented

## Post-Phase 1 Constitution Re-check

| 原則         | 評估                                                                       | 通過 |
| ------------ | -------------------------------------------------------------------------- | ---- |
| I. 簡潔性    | 字串模板替換、既有 Modal/watcher 模式複用、無 eval                         | ✅   |
| II. 模組化   | `customBlockService.ts` 獨立服務、MCP 工具獨立檔案                         | ✅   |
| III. YAGNI   | 嚴格按 spec scope boundary，不做匯出/分享/版本管理                         | ✅   |
| IV. 彈性     | JSON 格式選填欄位、schema 驅動、雙平台模板                                 | ✅   |
| VII. 測試    | Extension 服務 100% 覆蓋、WebView UI 手動測試（符合 UI Testing Exception） | ✅   |
| VIII. 純函式 | `validateCustomBlock()`、模板替換皆為純函式                                | ✅   |
| IX. 繁體中文 | 所有文件繁體中文                                                           | ✅   |

**Post-Phase 1 結果**：全部通過，無違規項。
