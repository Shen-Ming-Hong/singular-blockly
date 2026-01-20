# 研究記錄：CyberBrick 時間回傳值積木

## 決策與依據

### D1：時間取得與差值計算方式
- **Decision**：以 `time.ticks_ms()` 取得目前毫秒計時值，並以 `time.ticks_diff(now, start)` 計算時間差。
- **Rationale**：官方文件說明 `ticks_diff(ticks1, ticks2)` 的差值等同 `ticks1 - ticks2`，並可在計時循環（wrap-around）時維持正確差值計算。
- **Alternatives considered**：
  - 直接相減（不處理 wrap-around，風險高）
  - 使用 `time.time()`（解析度較低，不適合毫秒級教學）
- **Sources**：
  - https://docs.micropython.org/en/latest/library/time.html
  - https://docs.micropython.org/en/latest/library/time.html#time.ticks_diff

### D2：在地化詞彙驗證方式
- **Decision**：沿用既有語系風格，並在關鍵詞（毫秒／時間差／現在／開始）上以權威字典或官方語言資源核對用詞。
- **Rationale**：避免直譯或機器翻譯造成教學誤解，保持各語系的慣用詞彙一致性。
- **Alternatives considered**：
  - 全面機器翻譯（易產生不自然或不準確詞彙）
- **Sources**：
  - 英文/繁中參考：Cambridge Dictionary（millisecond）https://dictionary.cambridge.org/dictionary/english/millisecond
  - 西班牙文參考：RAE（milisegundo）https://dle.rae.es/milisegundo
  - 德文參考：Duden（Millisekunde）https://www.duden.de/rechtschreibung/Millisekunde
  - 義大利文參考：Treccani（millisecondo）https://www.treccani.it/vocabolario/millisecondo/
  - 法文參考：Larousse（milliseconde）https://www.larousse.fr/dictionnaires/francais/milliseconde

### D3：MCP 積木字典納入策略
- **Decision**：透過既有 `generate-block-dictionary` 流程更新字典，確保索引與分類一致。
- **Rationale**：避免手動編輯造成索引遺漏，維持 MCP 查詢一致性。
- **Alternatives considered**：
  - 直接手動修改 JSON（易錯且不易維護）

## 結論

研究結果確認官方計時 API 行為與差值計算順序，並確立在地化詞彙的驗證來源，可作為後續設計與實作依據。
