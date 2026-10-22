# 實作計畫：ESP32 積木包

**分支**：`claude/project-thread-zeku61` | **日期**：2026-10-22 | **規格**：[spec.md](./spec.md)

## 摘要

老師以 `.sbpack.json` 描述一組積木與 ESP32 DevKit 的 C++ 模板。匯入時由 Extension Host 驗證、確認函式庫依賴，再交給 WebView。WebView 把積木包快照存進 Blockly 工作區序列化狀態的 `customBlocks` 區段（以 Blockly serializer 註冊，優先序高於積木），所以載入、儲存、備份、外部候選驗證與預覽都沿用既有路徑，專案一個檔就完整。積木與產生器由快照動態註冊，只做字串替換，不執行作者程式。

## 技術背景

**語言／版本**：TypeScript 6.0.3（Extension Host）、WebView JavaScript。\
**相依**：Blockly 13.2.1 以上（實測 13.4.0 的 `serialization.registry` 與 priorities）、PlatformIO `espressif32@7.0.1`；不新增執行期依賴。\
**儲存**：`blockly/main.json` 的 `workspace.customBlocks`（Blockly 自訂 serializer 狀態）；外層文件格式不變。\
**驗證**：Mocha 單元與契約測試、i18n 驗證、project Skill 產物檢查、雲端本地 WebView 截圖與拖曳互動、範例積木包的 ESP32 編譯。\
**平台**：VS Code Extension 編輯 WebView 與備份預覽 WebView。\
**限制**：第一版只接受 `esp32` 模板；WebView CSP 禁止 eval；Extension Host 與 WebView 只能以 `postMessage` 溝通；檔案 I/O 經 `FileService`。

## 憲法檢查

研究前與設計後均符合 I–XI。沿用既有序列化、工具箱過濾、板型警告、孤立積木守衛與 `lib_deps_` 機制，不新增依賴（I、II、III）。驗證器為純函式並有單元測試（VII、VIII）。函式庫依賴需工作區信任與確認，模板不執行（安全）。產品 Skill 內容維持英文並重新產生（XI）。沒有豁免。

## 設計

1. **格式與驗證（Extension Host）**：新增 `src/types/blockPack.ts` 與純函式驗證器 `src/services/blockPackValidator.ts`，涵蓋 [contracts/block-pack-format.md](./contracts/block-pack-format.md) 的全部規則，錯誤以穩定代碼加積木／欄位路徑回傳。`media/schemas/block-pack.schema.json` 透過 `package.json` 的 `jsonValidation` 套用到 `*.sbpack.json`；測試以同一組 fixture 確認 Schema 與驗證器結論一致。
2. **匯入、更新、移除（Extension Host）**：新增 `src/services/blockPackService.ts`。`importBlockPack` 訊息觸發 `showOpenDialog`，經 `FileService` 讀檔、驗證、比對已匯入版本；含 `libDeps` 時要求 `vscode.workspace.isTrusted` 並以 modal 列出依賴取得確認。通過後回傳 `blockPackReady`（含積木包與差異摘要），由 WebView 套用。訊息定義見 [contracts/messages.md](./contracts/messages.md)。
3. **快照與載入（WebView）**：新增 `media/blockly/blockPacks.js`（編輯與預覽 WebView 都載入）。以 `Blockly.serialization.registry.register('customBlocks', …)` 註冊 priority 200 的 serializer：`load` 依快照註冊 `Blockly.Blocks` 與 `arduinoGenerator.forBlock`，狀態存在各 workspace 物件上，`save` 無積木包時回傳 null，避免改動既有專案檔。`blocklyRuntime.loadWorkspaceState` 在呼叫 Blockly 前把找不到定義的 `pack_` 型別換成佔位積木，原始狀態放進 `extraState`。
4. **積木與產生器（WebView）**：依 [data-model.md](./data-model.md) 把輸入對應到 Blockly 欄位或輸入；腳位下拉取自 `BOARD_CONFIGS.esp32`，`direction: "output"` 排除 GPIO34–39，`analog` 只用 `analogPins`（ADC1）。產生器替換 `{{NAME}}`：值輸入以 `valueToCode`（ORDER_ATOMIC 並加括號）、文字以 C++ 字串跳脫、語句以 `statementToCode`；`includes`、`globals`、`setup`、`libDeps` 以積木包 id 為鍵寫入 `includes_`、`definitions_`、`setups_`、`lib_deps_`。所有積木包語句積木走 `isInAllowedContext` 守衛與 `onchange` 孤立警告；非 `esp32` 板子產生 `// [block pack] … not supported on this board` 註解。
5. **工具箱與板型**：`updateToolboxForBoard()` 在 `boardId === 'esp32'` 時於「函式」分類前插入每個積木包分類；`updateEsp32BlockWarnings()` 擴充為同時處理積木包積木的板型警告與獨占腳位衝突。WebView 新增「積木包」管理對話框（列出、匯入、更新、移除、預覽），沿用既有 modal 樣式並支援明暗主題；移除或更新會產生佔位積木時先顯示影響數量。
6. **外部候選驗證與產品 Skill**：`validateWorkspaceCandidateDocument` 先在候選文件的 `customBlocks` 上執行與匯入相同的驗證（由 Extension Host 驗證後附上結果，WebView 只信任已驗證快照），再把積木包推導出的 contract 條目合併進 `contractByType`；驗證期間的動態註冊在結束時還原。產品 Skill 的 `workspace-format.md`、`workspace.schema.json` 說明與新的 `block-packs.md` 參考檔描述快照格式與型別、輸入對應規則（英文），並執行 `generate:project-skills`。
7. **語系**：新增管理介面、錯誤代碼、警告與佔位積木文字到 15 語系 `messages.js`，以 `i18n-maintenance` 流程審查。

## 專案位置

- 規格與證據：`specs/072-esp32-block-packs/`。
- Extension Host：`src/types/blockPack.ts`、`src/services/blockPackValidator.ts`、`src/services/blockPackService.ts`、`src/webview/messageHandler.ts`、`src/webview/webviewManager.ts`。
- WebView：`media/blockly/blockPacks.js`、`media/js/blocklyEdit.js`、`media/js/blocklyRuntime.js`、`media/html/blocklyEdit.html`、`media/css/blocklyEdit.css`。
- Schema 與範例：`media/schemas/block-pack.schema.json`、`resources/block-pack-examples/`。
- 產品 Skill：`resources/project-skills/singular-blockly/`。
- 語系與測試：`media/locales/*/messages.js`、`src/test/`。

## 驗證策略

先寫驗證器與模板替換的單元測試（合法、每種錯誤代碼、跳脫、重複宣告去重），再寫序列化 round trip 與佔位還原的契約測試（以 Node 版 Blockly 執行 `blockPacks.js` 的純邏輯部分）。完成後執行 lint、`npm test`、`validate:i18n`、`test:i18n`、`generate:project-skills` 與 `check:project-skills`。以 `cloud-local-verification` 在容器內開啟編輯器，截圖匯入、拖曳、切換板子與佔位積木，並用範例積木包產生的 `src/main.cpp` 跑 ESP32 編譯；沒有實體 ESP32 時只回報編譯通過。
