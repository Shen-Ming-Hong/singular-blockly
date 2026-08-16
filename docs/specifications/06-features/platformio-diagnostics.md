# PlatformIO 診斷與引導式修復

## 狀態診斷面板

> 來源：`specs/052-platformio-diagnostic-ui`（2026-05）

命令 `singular-blockly.checkPlatformioStatus` 開啟獨立、單例的 WebView 面板，不需先執行上傳。診斷必須重用既有 executable resolver 與 uploader 的解析語意，不另建互相矛盾的路徑偵測器。

面板依固定順序檢查 provider 的 `pio`、`penvRoot`、Python、pip、mpremote，並另顯示 Provider Core 與 Singular managed Core 兩個環境區段。每個 Core 包含 healthy／degraded／unavailable、版本、package 狀態、原因與隱私化 storage 摘要；Arduino／Python 路由另外顯示 primary、fallback、目前選擇及是否已 fallback。工具單項仍包含 `ok`／`warning`／`error`、解析路徑與來源、原因、建議步驟及版本資訊。

UI 狀態為 loading、ready、error，固定提供摘要、雙 Core、工具狀態與檢查範圍說明。診斷只呼叫本機 `getStatus()` 與版本 probe，不啟動 managed runtime 安裝、不做 package 網路探測；尚未真實準備的 package 狀態保持 `unknown`。它也不保證 USB、裝置權限或硬體連線正常。

面板提供重新檢查、複製結果、修復 managed runtime、清理受管檔案，以及 managed Core 卡片中的「開啟 Singular Core 資料夾」。修復是使用者明確觸發的新安裝交易；清理先驗證 managed root ownership marker，再與安裝共用同一把 lock，只列舉後刪除具版本 marker 的舊版本、manifest 已知下載與具有效 transaction marker 的 staging，不觸碰目前版本、provider、專案或未知檔案。顯示與剪貼簿只使用 `<managed-storage:hash>`，不輸出完整 managed root；開啟資料夾時 WebView 只送固定 command，實際路徑由 Extension Host 直接交給作業系統檔案管理員，不進入 WebView state、日誌或剪貼簿。

診斷唯讀不代表 Extension 不會在其他生命週期預先安裝：`onStartupFinished` activation 與每次開啟 Blockly 編輯器會由獨立 coordinator 背景檢查 managed Core。面板本身不啟動該流程，避免「只想看狀態」意外產生網路副作用。

## 引導式修復

> 來源：`specs/058-platformio-guided-repair`（2026-05）

引導式修復擴充同一命令與面板，不新增另一個頂層入口。診斷本身保持唯讀；只有使用者確認修復方案後，修復 executor 才能執行允許的步驟。

每個主要修復流程以 2–3 個明確步驟為上限，只允許使用者空間操作。命令透過 `execFile` 與參數陣列執行，不使用 shell，並限制逾時與輸出大小；禁止 sudo、系統套件管理、修改 shell profile／registry、覆寫系統 Python。VS Code PlatformIO 設定應依官方公開欄位判斷，包括 custom PATH、內建 PIO Core／Python、development core、PyPI index、HTTP proxy 與 strict SSL，不依賴私有 extension internals。

執行在第一個阻斷失敗時停止。命令 exit code 為 0 不等於修復成功；完成後必須重新診斷，並以新證據確認問題已解除。

## 歷史、隱私與 AI 協助

修復歷史保存在 workspace state，最多 20 筆，並以環境 fingerprint 判定 current、stale 或 unknown。歷史與 fingerprint 只保存必要摘要及雜湊，不保存密碼、token 或原始敏感值。

提供 AI 協助時，只建立經隱私清理的結構化 packet，包含 findings、修復歷史及任務描述，不直接附上未處理的 raw logs。Issue draft 也只能在去重與隱私檢查後產生，必須由使用者審閱並主動發布，絕不自動送出。

WebView 只接收可序列化的安全狀態；所有訊息仍由 Extension Host 驗證。核心資料模型包含 DiagnosticFinding、RepairFlow、RepairStep、AutoRepairRun、RepairStepResult、EnvironmentFingerprint、RepairHistorySnapshot、AIRepairPacket、IssueDraftProposal 與 PanelRepairState。
