# 066 安全檢查

驗證日期：2026-08-12

本次依 `security-checker` 工作流程檢查新增的檔案處理、manifest、WebView protocol、日誌與診斷。

## 檢查結果

- **路徑 containment**：所有專案寫入都先拒絕絕對路徑、NUL 與 `..` 逃逸；manifest target 只能落在固定 workspace root。
- **符號連結**：read、exact-byte read、write、copy 的來源／目的、rename 的來源／目的、delete、list 與 stat 都拒絕既有 symlink segment／leaf，避免透過專案內連結讀取、列舉或異動外部資料；Claude wrapper 是一般檔案而非 symlink。
- **bundle 信任**：packaged manifest 驗證 schema、manager、manifest target、唯一 target、固定 SHA-256、source containment 與實際 bytes hash；manifest 不自我授權。
- **契約分片**：索引只接受 `block-contract/<safe-id>.json`，path 必須與 category 完全一致；loader、manifest generator 與 contract generator 均拒絕 traversal、重複 type、非法排序及濫用保留 `shared` category。
- **更新交易**：使用同目錄 temporary sibling 加 atomic rename；使用者修改先逐位元備份；manifest 最後提交；失敗逆序 rollback，新裝失敗移除本次建立檔。
- **工作區交易**：候選先經 disposable Blockly load/save/load，再以 requestId、generation 與共同 deadline 配對含最終 normalized document 的 live acknowledgment；隔離／恢復與一般 save 共用交易佇列，磁碟雙檔提交失敗會 rollback。
- **競態**：watcher event 會在 debounce 前立即遞增 observation revision；過時 generation／revision、錯誤 requestId、source bytes 已變更、late response 與預期內部 watcher 事件都不能 promotion 候選或建立 stale 初始備份。
- **生命週期**：dispose 會立即使 pending 驗證及後續提交失效；多根工作區只綁定 primary root，切換 root 時關閉舊面板並重建 service，避免跨專案檔案服務殘留。
- **runtime 完整性**：固定與動態 dropdown 分流驗證；candidate round-trip 必須保留既有序列化連線，函式引用等相容修復必須完成並重新序列化後才可 acknowledgment。
- **首次載入**：Extension Host 以 exact bytes 解析；Malformed／結構無效內容先隔離且不寫入空白主檔。只有正式 Blockly runtime 成功回覆、request ID 相符且 source bytes 未變時，才建立 normalized recovery baseline。
- **錯誤分類**：只有共同 deadline 實際到期才記為 `VALIDATION_TIMEOUT`；立即 validator channel rejection、channel disposal 與 live-load failure 保持可區分的 stable code。
- **WebView／XSS**：新 protocol 只傳 structured clone 資料，未新增 `innerHTML`、`eval`、`new Function` 或把候選文字插入 DOM 的路徑；既有 CSP 與本地 resource allowlist 維持。
- **日誌與診斷**：候選 payload 在 WebView message log 被替換為 request metadata；Extension Host 只記 stable issue code。AI status 僅含狀態、action code 與專案相對路徑，不含 secret、完整 workspace、使用者檔案內容或專案外絕對路徑。
- **通知失敗**：在地化 rejection callback 的 rejection 已捕捉，不會造成未處理 promise 或中斷資料復原。

## 測試證據

`FileService`、`ProjectSkillService`、`WorkspaceCandidateService` 與 `BlockContractService` 在完整 coverage 報告中的 statements、branches、functions、lines 四項皆為 100%。安全相關負向 fixtures、category 分片路由與 contract tests 全部通過。

## 結論

未發現本功能新增的 command injection、path traversal、symlink escape、XSS、未關聯 postMessage、secret／候選內容外洩或非原子更新問題。
