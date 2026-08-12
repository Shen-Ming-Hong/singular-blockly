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
- `generation` 在單一 activation-lifetime candidate service 中單調遞增。
- `document` 是已通過 JSON parse 與文件層基本檢查的完整 `main.json`；已知舊版板卡 ID 會先正規化為目前 canonical ID，再交給 runtime 驗證。
- Extension Host 送出後立即開始 10 秒 deadline；新 generation 可使舊要求成為 superseded，但不得延長新要求 deadline。
- 此訊息只用於 watcher 觀察到的外部候選。既有專案的首次載入使用下述獨立握手，避免以較嚴格的新候選規則拒絕仍可由正式 runtime 相容載入的舊版動態狀態。

## 既有專案首次載入握手

Extension Host 以 exact-byte read 解析既有 `main.json`，保留完整頂層文件，並透過一般 `init` 路徑附帶 opaque `initialLoadRequestId`。WebView 以正式 Blockly workspace 載入；成功後回傳 runtime 序列化的文件：

```ts
interface WorkspaceInitialLoadResultMessage {
  command: 'workspaceInitialLoadResult';
  requestId: string;
  success: boolean;
  normalizedDocument?: WorkspaceDocument;
  issue?: WorkspaceValidationIssue;
}
```

Extension Host 只接受目前 pending ID，並確認磁碟上的 `main.json` bytes 仍等於啟動時讀取的 bytes。兩者都成立才以 normalized document 初始化記憶體快照與 `main.json.bak`；首次載入不得重寫 `main.json`。若 bytes 已變更，結果視為 stale 並忽略。

若初始主檔無法解析、文件結構無效，或可解析文件無法由正式 Blockly runtime 載入，必須先把原始 bytes 與穩定 issue code 交給相同的隔離／復原流程。若恢復來源也無法由 runtime 載入，只可再隔離一次並停止恢復，避免循環；沒有最後有效來源時只向 WebView 提供記憶體中的空白顯示狀態，不得把空白狀態寫回正式主檔。

## WebView 驗證演算法

1. 建立不注入畫面的 disposable `Blockly.Workspace`。
2. 驗證 document 的板型與既有附加資料，再將 `document.workspace` 交給與正式編輯器相同的 `Blockly.serialization.workspaces.load`。
3. 確認所有 block 已建立、必要 dynamic state 可還原，且板型限制、孤立積木與產品現有 guard 均通過。孤立積木 guard 只拒絕相較於目前 live workspace 新增的孤立 statement；相同 ID 與 type 的既有 legacy orphan 不得阻擋無關欄位變更。
4. 固定 dropdown 依契約 `static` options 驗證；`dynamic` dropdown 必須向已載入的實際 runtime field 取得當下 options，不能以契約產生時的快照拒絕合法函式或變數值。
5. 呼叫 `Blockly.serialization.workspaces.save` 取得 normalized workspace，組回完整文件；候選原有的 next、input 與 shadow 連線必須仍存在，不得把 runtime 靜默捨棄的連線視為正規化成功。
6. 再以第二個 disposable workspace 載入 normalized workspace，避免只通過單向載入。若 runtime 修復舊版函式引用或其他相容狀態，必須在回覆前完成修復並再次序列化。
7. 在 `finally` dispose 所有暫存 workspace；不得觸發正式 workspace listener、程式產生或檔案儲存。

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

正式 live workspace 載入成功的 acknowledgement 必須包含該正式 runtime 最終序列化的 `normalizedDocument`。Extension Host 只能提交這份文件，不能改用 preflight disposable workspace 較早產生的版本。

## Extension Host 提交規則

只有以下條件全部成立才能提交：

- 回應 `requestId` 對應仍在等待的要求。
- generation 等於目前最新外部候選。
- deadline 尚未觸發。
- `valid` 為 true 且 normalized document 仍通過文件層不變條件。
- watcher 自候選讀取後未觀察到較新的 filesystem revision，且提交前磁碟 bytes 仍等於受驗證候選。

提交順序：

1. 讀取並保留提交前的 `.bak` bytes 與最近正式 workspace 記憶體快照。
2. 以既有 `loadWorkspace` 路徑載入正式 workspace，完成所有相容修復後等待含最終 normalized document 的明確 success acknowledgement；尚未收到成功前不得覆寫 `.bak`。
3. 收到成功後，以 acknowledgement 的 normalized document 建立同一 volume 暫存檔並 rename 提交 `main.json`，再以相同內容提交 `main.json.bak`，並更新記憶體快照。
4. 標記相關 watcher event 為內部寫入，清除 rollback bytes 與暫存檔。

若正式載入、主檔提交或備份提交任一步驟失敗，必須以步驟 1 的 bytes／快照還原正式 workspace、主檔與 `.bak`，再走隔離流程，不得保留已標示有效但畫面或磁碟無法一致載入的版本。

既有 `main.json` 首次由正式 WebView 載入成功時，依首次載入握手初始化記憶體快照與 `.bak`，但保持原始主檔 bytes 不變。來自正式編輯器的正常 save document 已經由 live runtime 產生；主檔與 `.bak` 必須成對提交，任一寫入失敗時復原兩者及先前記憶體快照，不把空白或未序列化內容視為有效。

## 失敗、逾時與刪除

下列事件使用同一 `quarantineAndRecover` 流程：JSON parse 失敗、空／刪除、WebView 回覆 invalid、WebView 未開啟／disposed、訊息傳送失敗、10 秒逾時、正式載入失敗。watcher 由 activation 層服務持有，不隨 WebView 面板關閉而停止；面板不存在時不得把候選延後成未受追蹤的正式資料。

1. 若有候選 bytes，寫入 `blockly/main.invalid.json` 及新的時間歷史；刪除事件則寫入不含 workspace 的英文 `MAIN_FILE_DELETED` metadata。
2. 將歷史清理至最近 5 份，只能刪除符合完整 pattern 的檔案。
3. 從 `main.json.bak` 恢復；沒有磁碟備份時使用最近的正式記憶體快照。
4. 所有恢復寫入標記為內部事件。
5. 以既有 Output 診斷表面提供問題摘要，另顯示不含候選內容的在地化警告，指出 `blockly/main.invalid.json` 與「顯示詳情」動作。只有實際寫回最後有效版本時可宣稱「已還原」；無恢復來源時必須明確表示「僅隔離」。不得在警告、diagnostics 或 status 中複製候選內容。

如果沒有任何最後有效來源，保留隔離內容並停止，不能用空 workspace 建立新的正式狀態。

## 競態與拖曳

- watcher callback 一收到 filesystem event 就遞增 observation revision，使正在驗證的舊候選立即失效；500ms debounce 期間只啟動最新 event 的處理。
- 新 generation 到達後，舊回應即使成功也只能被忽略。
- 使用者正在拖曳積木時，可在驗證成功後延後正式載入，但不可延後 10 秒驗證 deadline；延後期間若又有新候選，舊結果失效。
- Skill 安裝所寫檔案不在 `blockly/main.json` watcher 範圍內，不得觸發候選流程。
- WebView 面板 attach/detach 只改變 validator channel，不得 dispose activation 層 watcher 或清除尚未完成的 generation。
- 外部候選的隔離／恢復與正式編輯器 save 共用同一個 workspace transaction queue，不能互相覆寫較新的有效資料；service dispose 後所有 pending 或新提交都必須失效。
- 多根工作區只監看目前 primary workspace folder；primary root 改變時必須 dispose 舊 service、關閉舊專案面板並為新 root 建立對應 service，不能沿用舊 root 的檔案服務。

## 驗收案例

- 有效 Arduino、CyberBrick 與 TXT 文件各完成 load/save/load 並產生既有輸出。
- 沒有 Blockly 積木但至少含一個有效 TXT 虛擬控制的既有合法文件可通過，且 companion document 會以 editing mode 正規化。
- 截斷 JSON、未知 type、錯誤 field、非法 connection、缺少 extra state、板型不符、新增孤立積木、空文件與刪除全部隔離；既有 legacy orphan 維持不變時可通過驗證。
- WebView 無回應在 10 秒進入恢復；第 10 秒後到達的成功回應不得提交。
- 初次開啟既有有效 `main.json` 只在正式 runtime 成功載入且 source bytes 未變時建立 `.bak`，不得改寫主檔；可解析但 runtime-invalid 或語法無效的既有主檔都必須先隔離，不能被空白主檔覆寫。
- 連續快速寫入只提交最後 generation。
- 連續 6 個 invalid 候選後，固定最新檔存在且時間歷史恰為最近 5 份。
- 內部恢復與正常儲存不形成 watcher loop。
- 舊版 `arduino_uno`、`arduino_nano`、`arduino_mega` 與 `esp32_super_mini` 板卡 ID 可載入並正規化；動態 dropdown、函式引用及既有合法序列化連線在驗證提交後保持可用。
