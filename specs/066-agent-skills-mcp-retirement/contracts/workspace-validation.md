# 契約：候選工作區 Runtime 驗證

## Extension Host → WebView

```ts
interface ValidateWorkspaceCandidateMessage {
  command: 'validateWorkspaceCandidate';
  requestId: string;
  generation: number;
  document: unknown;
}
```

- `requestId` 為不含檔案內容或路徑的 opaque ID。
- `generation` 在單一 `WebViewManager` 生命週期中單調遞增。
- `document` 是已通過 JSON parse 與文件層基本檢查的完整 `main.json`。
- Extension Host 送出後立即開始 10 秒 deadline；新 generation 可使舊要求成為 superseded，但不得延長新要求 deadline。
- 初次開啟既有 `main.json` 使用相同訊息與 deadline；在成功結果及 live-load acknowledgement 前不得直接載入正式 workspace。

## WebView 驗證演算法

1. 建立不注入畫面的 disposable `Blockly.Workspace`。
2. 驗證 document 的板型與既有附加資料，再將 `document.workspace` 交給與正式編輯器相同的 `Blockly.serialization.workspaces.load`。
3. 確認所有 block 已建立、必要 dynamic state 可還原，且板型限制、孤立積木與產品現有 guard 均通過。
4. 呼叫 `Blockly.serialization.workspaces.save` 取得 normalized workspace，組回完整文件。
5. 再以第二個 disposable workspace 載入 normalized workspace，避免只通過單向載入。
6. 在 `finally` dispose 所有暫存 workspace；不得觸發正式 workspace listener、程式產生或檔案儲存。

## WebView → Extension Host

成功：

```ts
interface WorkspaceCandidateValidMessage {
  command: 'workspaceCandidateValidationResult';
  requestId: string;
  generation: number;
  valid: true;
  normalizedDocument: WorkspaceDocument;
}
```

失敗：

```ts
interface WorkspaceCandidateInvalidMessage {
  command: 'workspaceCandidateValidationResult';
  requestId: string;
  generation: number;
  valid: false;
  issue: {
    code: WorkspaceValidationIssueCode;
    blockType?: string;
    field?: string;
  };
}
```

`WorkspaceValidationIssueCode` 是穩定 enum，例如 `UNKNOWN_BLOCK_TYPE`、`INVALID_FIELD`、`INVALID_CONNECTION`、`INVALID_EXTRA_STATE`、`BOARD_MISMATCH`、`ROUND_TRIP_FAILED`。回應不得包含 stack、HTML、完整工作區或絕對路徑。

## Extension Host 提交規則

只有以下條件全部成立才能提交：

- 回應 `requestId` 對應仍在等待的要求。
- generation 等於目前最新外部候選。
- deadline 尚未觸發。
- `valid` 為 true 且 normalized document 仍通過文件層不變條件。

提交順序：

1. 讀取並保留提交前的 `.bak` bytes 與最近正式 workspace 記憶體快照，將 normalized document 寫入同一 volume 暫存檔。
2. 以既有 `loadWorkspace` 路徑載入正式 workspace，等待明確 success acknowledgement；尚未收到成功前不得覆寫 `.bak`。
3. 收到成功後，以暫存檔與 rename 提交 normalized `main.json`，再以相同內容提交 `main.json.bak`，並更新記憶體快照。
4. 標記相關 watcher event 為內部寫入，清除 rollback bytes 與暫存檔。

若正式載入、主檔提交或備份提交任一步驟失敗，必須以步驟 1 的 bytes／快照還原正式 workspace、主檔與 `.bak`，再走隔離流程，不得保留已標示有效但畫面或磁碟無法一致載入的版本。

既有 `main.json` 首次由正式 WebView 載入成功時，以 normalized document 初始化記憶體快照與 `.bak`。來自正式編輯器的正常 save document 已經由 live runtime 產生；主檔寫入成功後更新相同快照及 `.bak`，備份寫入失敗時保留舊 `.bak`、保留最新記憶體快照並記錄錯誤，不把空白或未序列化內容視為有效。

## 失敗、逾時與刪除

下列事件使用同一 `quarantineAndRecover` 流程：JSON parse 失敗、空／刪除、WebView 回覆 invalid、WebView 未開啟／disposed、訊息傳送失敗、10 秒逾時、正式載入失敗。watcher 由 activation 層服務持有，不隨 WebView 面板關閉而停止；面板不存在時不得把候選延後成未受追蹤的正式資料。

1. 若有候選 bytes，寫入 `blockly/main.invalid.json` 及新的時間歷史；刪除事件則寫入不含 workspace 的英文 `MAIN_FILE_DELETED` metadata。
2. 將歷史清理至最近 5 份，只能刪除符合完整 pattern 的檔案。
3. 從 `main.json.bak` 恢復；沒有磁碟備份時使用最近的正式記憶體快照。
4. 所有恢復寫入標記為內部事件。
5. 以既有 Output 診斷表面提供問題摘要，另顯示不含候選內容的在地化警告，指出 `blockly/main.invalid.json` 與「顯示詳情」動作；不得在警告、diagnostics 或 status 中複製候選內容。

如果沒有任何最後有效來源，保留隔離內容並停止，不能用空 workspace 建立新的正式狀態。

## 競態與拖曳

- 500ms debounce 期間只處理最新 filesystem event。
- 新 generation 到達後，舊回應即使成功也只能被忽略。
- 使用者正在拖曳積木時，可在驗證成功後延後正式載入，但不可延後 10 秒驗證 deadline；延後期間若又有新候選，舊結果失效。
- Skill 安裝所寫檔案不在 `blockly/main.json` watcher 範圍內，不得觸發候選流程。
- WebView 面板 attach/detach 只改變 validator channel，不得 dispose activation 層 watcher 或清除尚未完成的 generation。

## 驗收案例

- 有效 Arduino、CyberBrick 與 TXT 文件各完成 load/save/load 並產生既有輸出。
- 截斷 JSON、未知 type、錯誤 field、非法 connection、缺少 extra state、板型不符、孤立積木、空文件與刪除全部隔離。
- WebView 無回應在 10 秒進入恢復；第 10 秒後到達的成功回應不得提交。
- 初次開啟既有無效 `main.json` 不得先污染 live workspace；面板關閉時外部改檔仍會隔離並以既有最後有效來源恢復。
- 連續快速寫入只提交最後 generation。
- 連續 6 個 invalid 候選後，固定最新檔存在且時間歷史恰為最近 5 份。
- 內部恢復與正常儲存不形成 watcher loop。
