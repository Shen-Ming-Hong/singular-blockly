# 契約：主程式修復的初次載入與持久化

## WebView → Extension Host 訊息

```ts
interface WorkspaceInitialLoadResultMessage {
  command: 'workspaceInitialLoadResult';
  requestId: string;
  success: boolean;
  normalizedDocument?: WorkspaceDocument;
  mainBlockStateRepaired?: boolean;
  issue?: WorkspaceValidationIssue;
}
```

### 欄位規則

- `mainBlockStateRepaired` 為 optional，確保舊 WebView／Host 契約可相容；省略等同 `false`。
- 只有正式 workspace 實際清除至少一個必要主程式停用原因時可傳 `true`。
- `success: true` 必須附有效 `normalizedDocument`，而且序列化發生在狀態修復之後。
- `success: false` 不得以修復旗標要求提交；Host 走既有 quarantine／recovery。
- Host 只把嚴格布林 `true` 視為修復；其他 runtime 值不得擴大寫入權限。

## 初次正常載入（沒有修復）

前置條件：request ID 相符、success 為 true、document 有效、目前 `main.json` bytes 等於初讀來源。

1. 將 normalized document 序列化為既有 canonical bytes。
2. 原子寫入 `blockly/main.json.bak`。
3. 更新 last-valid memory。
4. 不寫入 `blockly/main.json`；原始 bytes 必須逐位元保持。
5. 備份寫入失敗時不得更新 memory。

此路徑保留既有「只建立有效 recovery 狀態」政策，包含舊板型 ID 或一般 runtime 正規化。

## 初次修復提交（旗標為 true）

所有步驟在 `WorkspaceCandidateService` 的 workspace transaction queue 內執行：

1. 重新讀取主檔；不存在、讀取失敗或 bytes 不等於初讀來源時回傳 `false`，不寫任何資料。
2. 保存 `previousMain`、`previousBackup` 與 `previousMemory`；備份不存在以 `undefined` 記錄。
3. 從修復後 `normalizedDocument` 產生單一 `normalizedBytes`。
4. 以 `FileService.writeFileAtomic` 寫主檔。
5. 以相同 bytes 原子寫備份。
6. 只有兩個寫入皆成功後才更新 last-valid memory 並回傳 `true`。
7. 任一失敗時回復 memory、主檔與備份；原本不存在的檔案回復為不存在，再向呼叫者傳播失敗。

### 交易不變條件

- 成功後主檔、備份與 memory 表示同一 normalized document。
- 失敗後三者表示交易前狀態。
- `expectedMainBytes` 比對與寫入不得分開到兩個 service transaction。
- watcher 內部寫入抑制沿用既有 hash 機制，不形成候選迴圈。
- log 只記錄穩定階段與相對檔名，不包含 workspace 文件。

## 外部候選契約

外部候選不需要新增 repair flag：

```text
candidate bytes
→ disposable validation（保留 disabled reasons）
→ formal live load
→ repair all required-main reasons
→ live normalizedDocument
→ existing WorkspaceLiveLoadResultMessage
→ existing generation/revision/source-byte guarded paired commit
```

- 停用必要主程式是可正規化狀態，不是 validation issue。
- Host 只提交正式 live load 回傳的文件，不提交較早的 disposable normalized document。
- live load 後來源被修改或 generation 被取代時，放棄舊 commit 並沿用既有 live workspace restore。
- commit 的主檔、備份與 memory rollback 契約與既有 candidate transaction 相同。

## 失敗矩陣

| 情境 | 主檔 | 備份 | Memory | 後續 |
|------|------|------|--------|------|
| 無修復且 seed 成功 | 原 bytes | normalized | normalized | 正常完成 |
| 修復且交易成功 | normalized | normalized | normalized | 正常完成 |
| source bytes 已改變 | 較新 bytes | 不變 | 不變 | 舊結果丟棄，交由 watcher |
| 主檔寫入失敗 | previous | previous | previous | 回報／記錄失敗 |
| 備份寫入失敗 | previous | previous | previous | 回報／記錄失敗 |
| rollback 寫入或驗證失敗 | 不得標記有效；保留 `previousMain` 作為唯一可恢復 bytes | 不得標記有效；保留 `previousBackup` 作為唯一可恢復 bytes | previous | 傳播複合失敗並停止交易；測試必須驗證 recovery bytes 未被新內容取代，後續流程不得宣稱完整回復或成功 |
| live load 被新候選取代 | 新候選 bytes | previous valid | previous valid | restore live workspace，處理新 generation |

## 相容性

- 沒有 `mainBlockStateRepaired` 的舊成功訊息維持只 seed recovery。
- 此變更不修改 `WorkspaceLiveLoadResultMessage` 或 candidate validation result shape。
- 不新增使用者設定、Toast、錯誤碼或翻譯字串。
