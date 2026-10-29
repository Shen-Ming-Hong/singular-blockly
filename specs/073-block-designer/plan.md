# 實作計畫：圖形化積木設計器

**分支**：`claude/project-thread-zeku61` | **日期**：2026-10-29 | **規格**：[spec.md](./spec.md)

## 摘要

在 072 積木包之上加一個設計器：老師用「設計積木」（meta-block）在 Blockly 畫布上拼出積木外觀，設計器即時推導 072 格式的積木定義、C++ 函式框架與呼叫模板，老師只填函式本體。結果仍是一個積木包，存進 `workspace.customBlocks`，所以載入、產生器、佔位積木、外部候選驗證全部沿用 072。設計資訊另存在積木包的 `designer` 區段，供重新開啟時還原。

## 技術背景

**語言／版本**：TypeScript 6.0.3（Extension Host）、WebView JavaScript；Blockly 13（thrasos 渲染器）。\
**相依**：不新增執行期依賴。函式庫搜尋只呼叫 PlatformIO Registry 公開 API（`api.registry.platformio.org/v3`），沿用 `sampleBrowserService` 的逾時 fetch。\
**儲存**：`workspace.customBlocks.packs[]`；積木包新增選用的 `designer` 區段；`category.colour` 增加 `#rrggbb`。\
**驗證**：Mocha 單元與契約測試（Node 版 Blockly 執行設計器純邏輯）、i18n 驗證、project Skill 產物檢查、雲端本地 WebView 截圖與互動。\
**限制**：只支援 ESP32 DevKit；功能在 `singular-blockly.experimental.blockPacks` 後、預設關閉；WebView 與 Host 只透過 `postMessage`；檔案 I/O 經 `FileService`。

## 憲法檢查

符合。沿用 072 的序列化、產生器、佔位與驗證，不新增依賴。Host 端新邏輯（函式庫搜尋、匯出）為可注入相依的純函式並有單元測試。網路請求只在實驗設定開啟且使用者按搜尋時發出，結果經格式過濾後才交給 WebView。產品 Skill 內容維持英文並重新產生。沒有豁免。

## 設計

1. **設計積木（WebView，`media/js/blockDesigner.js`）**：根積木 `bd_block`（函式名稱、隱藏的形狀欄位、零件語句輸入）與零件 `bd_text`、`bd_pin`、`bd_number`、`bd_textfield`、`bd_dropdown`、`bd_value`（型別與隨型別切換的預設值欄位）、`bd_statement`。名稱欄位只接受 C++ 識別字。
2. **推導（純函式 `compileDesign`）**：零件依序成為標籤 `{INPUT}` 與輸入；回傳型別依形狀（void／float／bool／String，有內層積木時 bool）；參數型別依零件；模板為 `fn(args)`、`fn(args);` 或 `if (fn(args)) {\n{{DO}}}`。函式定義由 `functionSource` 組成並放進 `targets.esp32.globals`。
3. **檢查**：`returnProblems` 去掉註解與字串後檢查 return；`collect` 檢查函式重名（同分類、其他積木包）與 `libDeps` 格式。有問題不能儲存或匯出。
4. **介面**：形狀選擇用 thrasos 實際渲染出的路徑畫成圖示按鈕；顏色用 `<input type="color">`；設計畫布的滾輪縮放；即時預覽用與工具箱相同的序列化狀態（含預設積木）；積木清單以參數名稱小標籤顯示輸入。
5. **儲存與既有實例**：儲存時版本號遞增，經 `blockPackManager.confirmThen` 與 `applyPacks` 套用；`blockPacks.prepareState` 在載入前把接在已刪除或改變種類的輸入上的積木移到頂層，避免 Blockly 載入失敗。
6. **匯出（Host）**：`exportBlockPack` 訊息 → `blockPackService.exportBlockPack` 先用匯入同一個驗證器檢查，再以 `showSaveDialog` 選位置，經 `FileService` 寫檔，回傳 `blockPackExported`。
7. **函式庫搜尋（Host）**：`searchBlockPackLibraries`／`getBlockPackLibraryHeaders` 訊息 → `blockPackLibrarySearch.ts`；固定加上 `type:library platform:espressif32 framework:arduino`，結果限 10 筆並驗證 owner／name／version 格式與標頭檔名稱。
8. **格式**：`BlockPackDesign` 型別、驗證器 `collectDesigner`（狀態大小上限 100,000 字元）、JSON Schema 同步。
9. **語系與文件**：設計器文字加入 15 語系；更新 `docs/specifications/06-features/block-packs.md`、CHANGELOG 與產品 Skill 的 `block-packs.md`。

## 專案位置

- 規格：`specs/073-block-designer/`
- WebView：`media/js/blockDesigner.js`、`media/js/blocklyEdit.js`、`media/blockly/blockPacks.js`、`media/html/blocklyEdit.html`、`media/css/blocklyEdit.css`
- Extension Host：`src/services/blockPackService.ts`、`src/services/blockPackLibrarySearch.ts`、`src/services/blockPackValidator.ts`、`src/types/blockPack.ts`、`src/webview/messageHandler.ts`、`src/webview/webviewManager.ts`
- Schema：`media/schemas/block-pack.schema.json`
- 測試：`src/test/suite/blockDesigner.contract.test.ts`、`blockPackLibrarySearch.test.ts`、`blockPackService.test.ts`、`blockPackValidator.test.ts`、`messageHandler.test.ts`

## 驗證策略

契約測試以 Node 版 Blockly 載入設計器，驗證推導、預設值、回傳檢查、驗證器相容與刪除輸入後的載入。Host 端以注入的 fetch／存檔對話框測試搜尋與匯出，訊息處理器測試設定關閉時不開對話框、不連網。完成後跑 lint、`npm test`、`validate:i18n`、`test:i18n`、`check:project-skills`，並以 `cloud-local-verification` 在容器內開啟真實編輯器 WebView 截圖與操作設計器。實體 ESP32 測試由 Ray 進行，通過前功能維持預設關閉。
