# 合約：Extension Host ↔ WebView 訊息

| 方向 | command | 內容 | 說明 |
| --- | --- | --- | --- |
| WebView → Host | `importBlockPack` | `{ requestId, installed: [{ id, version, blocks: string[] }] }` | 開啟檔案選擇並驗證 |
| Host → WebView | `blockPackReady` | `{ requestId, pack, sourceName, change: "new" \| "update" \| "same", previousVersion?, removedBlocks: string[] }` | 已驗證、已確認依賴，等待 WebView 預覽確認 |
| Host → WebView | `blockPackRejected` | `{ requestId, sourceName?, errors: [{ code, path }] }` 或 `{ requestId, cancelled: true }` | 驗證失敗或使用者取消 |
| WebView → Host | `confirmBlockPackChange` | `{ requestId, kind: "remove" \| "update", packName, affectedBlocks: number }` | 會產生佔位積木時請 Host 顯示 modal 確認 |
| Host → WebView | `blockPackChangeConfirmed` | `{ requestId, confirmed: boolean }` | |

外部候選驗證沿用既有 `validateWorkspaceCandidate` 流程：Host 在送出候選前對 `document.workspace.customBlocks` 執行驗證器，失敗時直接以 `INVALID_BLOCK_PACK`（`field` 為錯誤路徑）拒絕，不送到 WebView。驗證通過的候選在 WebView 內暫時啟用其積木包，經 Blockly load/save/load 檢查後恢復原登錄表。

快照實際寫入 `main.json` 仍經既有 `saveWorkspace`（Blockly serializer 輸出），不另設寫檔訊息。
