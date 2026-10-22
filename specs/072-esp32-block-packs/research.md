# 研究：ESP32 積木包

## 1. 定義存放位置

- **決定**：存成 Blockly 自訂 serializer `customBlocks` 的狀態，位於 `blockly/main.json` 的 `workspace.customBlocks`。
- **理由**：`handleSaveWorkspace` 只寫 `workspace`、`board`、`txtVirtualControls`，外層新欄位會在下次儲存時遺失；serializer 狀態則隨 `workspaces.save/load` 自動經過儲存、備份、外部候選驗證與預覽。以 Node 版 Blockly 13.4.0 實測：priority 200 的 serializer 先於 `blocks`（50）載入，載入時註冊的型別可立即被反序列化，`save` 也會輸出該區段。
- **替代方案**：046 的 `blockly/custom-blocks/` 資料夾（分享專案時容易遺失，需要 FileWatcher）；外層 `customBlocks` 欄位（需改 save、candidate service 與多處文件合併邏輯）。

## 2. 動態積木與產生器

- **決定**：`Blockly.Blocks[type] = { init() { this.jsonInit(def) } }` 搭配共用的 `arduinoGenerator.forBlock[type]`，模板只做 `{{NAME}}` 字串替換。
- **理由**：WebView CSP 只允許 nonce 腳本，不能 eval；字串替換足以表達感測器讀值、動作與內層語句。值輸入加括號避免運算子優先序錯誤；文字欄位以 C++ 字串跳脫（反斜線、雙引號、換行）。
- **替代方案**：作者撰寫 JavaScript generator（CSP 與安全性不允許）。

## 3. 佔位積木

- **決定**：載入前掃描工作區狀態，把沒有定義的 `pack_` 型別換成 `block_pack_placeholder_statement` 或 `block_pack_placeholder_value`（依 `previousConnection`／`output` 推斷；看父輸入型別），完整原始狀態存入 `extraState.original`；積木包回來時反向還原。
- **理由**：Blockly 遇到未知型別會整個載入失敗；把原始狀態留在 `extraState` 才能無損還原，修正 046 只記型別名稱的缺點。佔位積木不產生程式碼並顯示警告。
- **替代方案**：逐塊 append 加 try/catch（失去連接關係）。

## 4. 板子範圍與腳位

- **決定**：第一版只接受 `targets.esp32`；腳位下拉取自 `BOARD_CONFIGS.esp32`，輸出用途排除 GPIO34–39，類比只用 `analogPins`（全為 ADC1）。
- **理由**：Ray 於 2026-10-22 決定先支援 ESP32。`BOARD_CONFIGS.esp32.digitalPins` 已排除接 Flash 的 GPIO6–11；ADC2 與 Wi-Fi 衝突，`analogPins` 只列 ADC1。`targets` 以板子 id 為鍵，日後加 Super Mini、Uno 不必改格式。

## 5. 函式庫依賴與信任

- **決定**：`libDeps` 只接受 `owner/name@版本範圍` 形式的 PlatformIO registry 名稱；匯入含依賴的積木包需 `vscode.workspace.isTrusted` 並經 modal 確認；產生程式時推入既有 `lib_deps_`，由現有 `syncLibDeps` 寫入 `platformio.ini`。
- **理由**：PlatformIO 函式庫可攜帶在電腦上執行的 build script；建置與上傳已受工作區信任保護，匯入時再讓使用者看清楚要下載什麼。拒絕任意 URL 以降低供應鏈風險。

## 6. 驗證器位置

- **決定**：驗證器以 TypeScript 純函式放在 Extension Host；WebView 只接受 Extension Host 驗證過的快照，外部候選驗證時由 Extension Host 先驗 `customBlocks` 再交給 WebView。另提供 JSON Schema 供作者編輯時提示。
- **理由**：WebView 程式無法被 Node 測試直接匯入；集中在 TS 可完整單元測試。Schema 與驗證器以共用 fixture 比對，避免兩者漂移。不新增 ajv 執行期依賴（目前只是開發依賴）。

## 7. 預覽

- **決定**：預覽併入匯入對話框：驗證通過後先顯示每個積木外觀（獨立的唯讀 mini workspace）與以預設值產生的 C++，使用者確認後才寫入專案。
- **理由**：同時滿足 FR-013 與「看過再匯入」，不另做指令與面板。

## 8. 不做的事

- 不做「我的積木」：既有函式積木已能用內建積木組新積木（Ray，2026-10-22）。
- 不做 MCP 工具：MCP 已移除，改由產品 Skill 說明格式。
- 不做 PlatformIO 函式庫搜尋與圖形化編輯器：第一版以 Schema、預覽與 Skill 支援作者。
