# US3：無效候選隔離與復原驗收

驗證日期：2026-08-12

## 已驗證案例

- JSON 截斷、空白／空積木、主檔刪除、未知積木、非法 field、非法 connection、缺少 extra state、板型不符、新增孤立積木及第二次 round-trip 失敗。
- 相同 ID/type 的既有 legacy orphan 不會阻擋無關的合法 field 變更；新增 orphan 或以既有 ID 替換成不同 type 仍會被隔離。
- WebView channel 不可用、validator promise 立即拒絕、10 秒共同 deadline、live load 立即拒絕／失敗、正式載入後磁碟提交失敗與 live rollback acknowledgment 失敗；只有真正 deadline 到期分類為 `VALIDATION_TIMEOUT`。
- 500ms debounce 期間多次變更、watcher event 立即 revision supersede、generation supersede、晚到回覆、拖曳期間延遲正式載入、內部寫入 hash 抑制及內部刪除 watcher 抑制。
- `main.invalid.json` 永遠保存最新候選；UTC generation 歷史只保留最新 5 份，非完整命名 pattern 的使用者檔案不會被刪除。
- 優先以 `main.json.bak`、再以記憶體快照復原；沒有有效來源時移除無效正式主檔但保留隔離資料。
- 主檔與備份採雙檔交易；第二個寫入失敗會復原兩者，正式 live load 後提交失敗也會嘗試復原畫面與磁碟。
- 既有有效主檔第一次由正式 Blockly runtime 載入成功後建立 normalized `.bak`／記憶體基線，但不改寫原主檔；request ID 不符或 source bytes 已變更時不建立 stale 基線。
- 初始 malformed／結構無效主檔保存原始 bytes 至隔離檔；無復原來源時移除無效主檔，不以空白 JSON 覆蓋。
- 在地化警告只包含 stable issue code、專案相對隔離路徑與 Output 動作，不包含候選內容、secret 或絕對 workspace 路徑；警告 callback 失敗不會逃出復原狀態機。

## 結論

SC-005、SC-006、SC-011 與 SC-013 的自動與契約驗收全部通過。
