# PlatformIO 診斷與引導式修復

## 狀態診斷面板

> 來源：`specs/052-platformio-diagnostic-ui`（2026-05）

命令 `singular-blockly.checkPlatformioStatus` 開啟獨立、單例的 WebView 面板，不需先執行上傳。診斷必須重用既有 executable resolver 與 uploader 的解析語意，不另建互相矛盾的路徑偵測器。

面板依固定順序檢查 `pio`、`penvRoot`、Python、pip、mpremote。每項結果包含 `ok`／`warning`／`error`、解析路徑與來源、原因、建議步驟、可取得的版本資訊，以及是否來自已偵測的 penv。整體狀態分為 operational、degraded、unavailable；單項失敗仍要顯示其他成功結果，而不是讓整個面板只剩錯誤頁。

UI 狀態為 loading、ready、error，固定提供摘要、工具狀態與檢查範圍說明。診斷只代表本機工具鏈狀態，不保證 USB、裝置權限或硬體連線正常。面板至少提供重新檢查與複製結果，命令標題及說明使用 extension 的在地化服務。

## 引導式修復

> 來源：`specs/058-platformio-guided-repair`（2026-05）

引導式修復擴充同一命令與面板，不新增另一個頂層入口。診斷本身保持唯讀；只有使用者確認修復方案後，修復 executor 才能執行允許的步驟。

每個主要修復流程以 2–3 個明確步驟為上限，只允許使用者空間操作。命令透過 `execFile` 與參數陣列執行，不使用 shell，並限制逾時與輸出大小；禁止 sudo、系統套件管理、修改 shell profile／registry、覆寫系統 Python。VS Code PlatformIO 設定應依官方公開欄位判斷，包括 custom PATH、內建 PIO Core／Python、development core、PyPI index、HTTP proxy 與 strict SSL，不依賴私有 extension internals。

執行在第一個阻斷失敗時停止。命令 exit code 為 0 不等於修復成功；完成後必須重新診斷，並以新證據確認問題已解除。

## 歷史、隱私與 AI 協助

修復歷史保存在 workspace state，最多 20 筆，並以環境 fingerprint 判定 current、stale 或 unknown。歷史與 fingerprint 只保存必要摘要及雜湊，不保存密碼、token 或原始敏感值。

提供 AI 協助時，只建立經隱私清理的結構化 packet，包含 findings、修復歷史及任務描述，不直接附上未處理的 raw logs。Issue draft 也只能在去重與隱私檢查後產生，必須由使用者審閱並主動發布，絕不自動送出。

WebView 只接收可序列化的安全狀態；所有訊息仍由 Extension Host 驗證。核心資料模型包含 DiagnosticFinding、RepairFlow、RepairStep、AutoRepairRun、RepairStepResult、EnvironmentFingerprint、RepairHistorySnapshot、AIRepairPacket、IssueDraftProposal 與 PanelRepairState。
