# Phase 0 研究：主程式積木停用保護

## R-001：包裝 Blockly 內建 `blockDisable`，不建立平行選單

**決策**：以 `ContextMenuRegistry.registry.getItem('blockDisable')` 取得 Blockly 13.2.1 已註冊項目，解除註冊後以相同 ID 註冊包裝版本。包裝只覆寫 `preconditionFn`：必要主程式回傳 `hidden`，其他積木原樣委派；原始 `displayText`、`callback`、`weight`、scope 與快捷鍵 metadata 全部保留。

**理由**：Blockly 的 registry 會拒絕重複 ID，並公開 `getItem`、`unregister`、`register`。內建 `blockDisable` 的文字會依 `MANUALLY_DISABLED` 切換「停用／啟用」，precondition 也會處理 flyout、editable、workspace disable option、繼承停用及其他停用原因。自行重寫這些規則容易讓普通積木退步；包裝 precondition 是最小且可驗證的差異。

**替代方案**：

- 在每個主程式 block definition 自訂 context menu：無法移除核心 registry item，且三種積木會複製政策。
- 全域停用 workspace 的 disable option：普通積木也失去停用能力。
- 另註冊同功能選單：會出現重複或互相衝突項目。

**來源**：`node_modules/blockly/core/contextmenu_registry.d.ts`、`node_modules/blockly/core/contextmenu_items.d.ts`、`node_modules/blockly/blockly.min.js` 中 Blockly 13.2.1 的 `blockDisable` 實作。

## R-002：清除 runtime 回報的全部停用原因

**決策**：對每個必要主程式取得 `Array.from(block.getDisabledReasons())` 快照，再對每個原因呼叫 `setDisabledReason(false, reason)`；不只處理 `MANUALLY_DISABLED`。修改期間以 `Blockly.Events.disable()`／`enable()` 保存並恢復原事件狀態。

**理由**：Blockly 13.2.1 的 block 可同時持有多個獨立停用原因，`getDisabledReasons()` 回傳唯讀集合，`setDisabledReason()` 每次只更新指定原因並發出 `BLOCK_CHANGE`。原因名稱是語言中立識別，除手動原因外核心也使用 orphan、程序定義與容量等原因。列舉實際集合可涵蓋未知及未來原因；先複製集合則避免邊迭代邊刪除的耦合。

**替代方案**：

- 只移除 `MANUALLY_DISABLED`：舊專案的其他原因仍讓主程式失效。
- 直接修改內部 `disabledReasons` Set：依賴私有欄位且不會執行 Blockly 的狀態更新。
- 只用 `setRecordUndo(false)`：事件仍會送到 listener，可能形成保存迴圈；規格要求抑制額外事件。

**來源**：`node_modules/blockly/core/block.d.ts`、`node_modules/blockly/blockly.min.js` 的 `setDisabledReason` 與 Events 實作。

## R-003：序列化會保存所有停用原因

**決策**：修復必須在正式 workspace 載入後、產生 normalized document 前完成；驗收直接檢查必要主程式序列化狀態不含 `disabledReasons`，並接受 Blockly 對完全啟用積木省略此欄位。

**理由**：Blockly 13.2.1 `serialization.blocks.State` 定義 `disabledReasons?: string[]`；save 在積木非啟用時寫入目前集合，load 會逐項呼叫 `setDisabledReason(true, reason)`。因此只改視覺狀態或只隱藏選單都無法修復磁碟資料，必須在 save 前清除 runtime 集合。

**替代方案**：

- 直接遞迴刪除 JSON 欄位：繞過真實 runtime，難以證明積木狀態與序列化一致。
- 載入前只移除 `enabled: false`：Blockly 同時支援 legacy `enabled` 與 `disabledReasons`，仍可能留下其他原因。

**來源**：`node_modules/blockly/core/serialization/blocks.d.ts`、`node_modules/blockly/blockly.min.js` 的 blocks save/load 實作。

## R-004：停用必要主程式會讓三套 generator 跳過入口

**決策**：必要主程式一律強制啟用，且 generator 行為不修改；修復後沿用現有 generator 產生完整骨架。

**理由**：Arduino、MicroPython 與 TXT 的自訂 `workspaceToCode` 都在處理頂層積木前檢查 `!block.isEnabled() || block.getInheritedDisabled()` 並 `continue`。因此停用 `arduino_setup_loop` 會失去 setup/loop 主體，停用 `micropython_main` 會失去使用者主程式內容，停用 `txt_setup` 會失去初始化且 process 無法啟動。generator 的跳過政策對普通積木仍有價值，不應以 generator 特例繞過。

**替代方案**：

- 讓 generator 即使停用也產生必要主程式：畫面狀態與輸出語意不一致，且磁碟仍保存不可恢復狀態。
- 只替 CyberBrick 特判：Arduino 與 TXT 有相同入口風險，無法符合跨板型一致性。

**來源**：`media/blockly/generators/arduino/index.js`、`media/blockly/generators/micropython/index.js`、`media/blockly/generators/txt/index.js`。

## R-005：統一保護應擴充既有主程式狀態更新點

**決策**：把 `blocklyEdit.js` 現有的 `updateMainBlockDeletable()` 擴充為固定先修復啟用、再計算刪除／重複及 TXT 驗證的統一函式，並補上 disabled change 與所有正式載入入口。

**理由**：現有函式已集中目前板型的主程式映射、單一不可刪除、重複可刪除與警告，以及 TXT setup/process 驗證，且已在 create/delete、語言重建、板型切換與正式 load 後呼叫。沿用此 lifecycle 能維持既有行為；把與板型無關的停用清除放在計數前，可確保重複的三種主程式也都啟用。

**替代方案**：

- 在每個 load call 個別寫修復：容易遺漏備份、FileWatcher 或日後新增入口。
- 在 generator 前才修復：右鍵與磁碟狀態仍錯誤，也無法立即回復使用者操作。
- 把 `txt_process` 當必要主程式：違反既有多 process 與除錯停用需求。

**來源**：`media/js/blocklyEdit.js` 的 `getMainBlockType`、`updateMainBlockDeletable`、workspace listener、語言重建、板型切換與 `loadWorkspace` 路徑。

## R-006：首次載入需要兩種不同提交政策

**決策**：保留既有無修復初載政策，只建立 `.bak` 與記憶體 recovery；只有 `mainBlockStateRepaired === true` 才在 exact-byte match 下成對更新主檔與備份。兩種路徑都在 `WorkspaceCandidateService` 的 transaction queue 內執行。

**理由**：目前 `handleRequestInitialState()` 已保留來源 bytes，`seedInitialValidDocument()` 也會在 bytes 相等時只寫 `.bak`，刻意避免正常 runtime 正規化改寫原始主檔。既有 `commitValidDocument()` 已示範保存主檔、備份與記憶體後成對原子寫入及 rollback。新增旗標可只在使用者要求的修復情況提升為完整提交，不破壞原政策。

**替代方案**：

- 所有初載都覆寫主檔：舊板型 ID、格式或排序正規化會造成不必要 diff。
- WebView 直接寫檔：違反 Extension Host／WebView 邊界與 `FileService` 規則。
- 只寫主檔再等正常 save 更新備份：任一步驟中斷會讓唯一 recovery 與畫面不一致。

**來源**：`src/webview/messageHandler.ts` 的初載握手、`src/services/workspaceCandidateService.ts` 的 `seedInitialValidDocument`、`commitValidDocument` 與 transaction queue、`src/test/initialWorkspaceGate.test.ts`。

## R-007：外部候選的權威正規化點是 live load

**決策**：preflight validation 接受帶停用必要主程式的合法文件；正式 live workspace 載入後才執行修復，並把修復後 `normalizedDocument` 回給既有 candidate commit。

**理由**：現有候選流程先在兩個 disposable workspace 做 load/save/load，再在正式 workspace 載入，最後只提交 live acknowledgement 的文件。Host 在提交前再次比對 generation、observation revision、deadline 及 candidate bytes，並在失敗時 restore live workspace、主檔、備份與記憶體。沿用此邊界可證明畫面與磁碟使用同一份修復後狀態。

**替代方案**：

- preflight 直接刪 JSON 欄位：正式 workspace 可能再產生不同狀態，且不是 live runtime 最終結果。
- 把停用主程式視為 invalid 並隔離：舊專案可安全自動修復，隔離會造成不必要中斷。
- 增加另一套候選提交 API：重複既有競態、rollback 與 watcher 抑制邏輯。

**來源**：`src/services/workspaceCandidateService.ts` 的 `processCandidate`／`processValidatedCandidate`、`media/js/blocklyEdit.js` 的候選驗證與正式 load handler、`src/test/services/workspaceCandidateService.test.ts`。
