# 合約：Extension Host ↔ WebView 訊息

| 方向 | command | 內容 | 說明 |
| --- | --- | --- | --- |
| WebView → Host | `importBlockPack` | `{ requestId, installed: [{ id, version, blocks: string[] }] }` | 開啟檔案選擇並驗證 |
| Host → WebView | `blockPackReady` | `{ requestId, pack, sourceName, change: "new" \| "update" \| "same", previousVersion?, removedBlocks: string[] }` | 已驗證、已確認依賴，等待 WebView 預覽確認 |
| Host → WebView | `blockPackRejected` | `{ requestId, sourceName?, errors: [{ code, path }] }` 或 `{ requestId, cancelled: true }` | 驗證失敗或使用者取消 |
| WebView → Host | `confirmBlockPackChange` | `{ requestId, kind: "remove" \| "update", packName, affectedBlocks: number }` | 會產生佔位積木時請 Host 顯示 modal 確認 |
| Host → WebView | `blockPackChangeConfirmed` | `{ requestId, confirmed: boolean }` | |

外部候選驗證沿用 `validateWorkspaceCandidate`，新增欄位 `blockPackValidation: { ok: true } \| { ok: false, errors }`，由 Host 在送出前對 `document.workspace.customBlocks` 執行驗證器；`ok: false` 時 WebView 以 `INVALID_BLOCK_PACK` 拒絕候選。

快照實際寫入 `main.json` 仍經既有 `saveWorkspace`（Blockly serializer 輸出），不另設寫檔訊息。
