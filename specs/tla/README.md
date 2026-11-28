# TLA+ 模型：程式裡沒寫明的狀態機

這裡放的是 Singular Blockly 裡「沒有明寫、散在欄位與時間順序裡」的狀態流轉，用 TLA+ 寫成模型，再用 TLC 窮舉所有操作順序，找出畫面與實際結果不一致的情況。

模型**只描述現況**：不改產品行為。發現的反例先回報、決定要修哪幾條，再在另外的 PR 修，並把該條的預期結果從 `violated` 改成 `holds`。

## 怎麼跑

需要 Java 11 以上。腳本會下載固定版本的 TLC（`tla2tools.jar` v1.7.4，核對 SHA-256）到 `specs/tla/.tools/`。

```bash
bash specs/tla/run-tlc.sh                       # 全部模型
bash specs/tla/run-tlc.sh upload-build-cache    # 只跑一個
```

每個性質各跑一次，讓每個反例都是最短的。每個模型的 `expected.txt` 寫著每個性質目前的預期（`holds` 成立、`violated` 有反例）；結果都符合預期時結束碼是 0。完整的 TLC 輸出和反例在 `specs/tla/<模型>/out/<性質>.txt`（不進版控）。

## 模型

| 資料夾 | 建模的功能 | 現況 |
| --- | --- | --- |
| [upload-build-cache](upload-build-cache/README.md) | Arduino 快速重新上傳的建置快取（spec 077），和編輯器上傳中仍會自動存檔的互動 | spec 078 修正後 3 條性質都成立 |
| [cyberbrick-ota-upload](cyberbrick-ota-upload/README.md) | CyberBrick 透過 Wi-Fi 上傳 `rc_main.py`：兩次嘗試、逾時後的「回復」判斷、板子端的寫檔 | 6 條裡 5 條有反例，「上傳一定會結束」成立 |

## 第 1 步盤點：程式裡的隱藏狀態機

依「最可能有競態 × 最影響使用者」排序。前兩項已建模。

| 候選 | 狀態 | 轉換的操作 | 誰會同時動它 | 出錯的後果 |
| --- | --- | --- | --- | --- |
| **快速重新上傳的建置快取**（`arduinoBuildCache.ts`、`arduinoUploader.ts`） | 快取紀錄（buildKey、韌體檔的大小與時間、上次燒錄的板子）× `src/main.cpp` × `.pio/build` 裡的韌體 | 上傳：算指紋 → 決定沿用或重建 → 作廢紀錄 → 編譯 → 燒錄 → 記錄 | 編輯器在上傳中照常自動存檔（`updateCode` 防抖 300 ms 後寫 `src/main.cpp`，和上傳流程沒有互斥） | 板子跑的程式和畫面上的積木不一樣，而且之後每次按上傳都「沿用上次的韌體」，一直錯下去 |
| **CyberBrick Wi-Fi 上傳**（`cyberbrickOtaUploader.ts`、`cyberbrickOtaAgentSource.ts`） | 擴充端：直接嘗試 → 重開視窗 → 第二次嘗試 → 回復判斷；板子端：`/app/rc_main.py` 的內容、正在跑的程式、待重開機旗標 | 逾時（不會中止 fetch）、Wi-Fi 斷線、板子重開、學生關電源 | 擴充端的兩個請求、板子端單執行緒的代理程式、不穩的 Wi-Fi | 畫面說「上傳完成」但板子還是舊程式；或 `rc_main.py` 只寫了一半，下次開機什麼都不跑，連 Wi-Fi 上傳都沒了，只能接 USB |
| 外部修改 `blockly/main.json` 的驗證（`workspaceCandidateService.ts`） | generation、observationRevision、最後一份有效文件、待驗證的候選、`.bak` | 檔案監看 → 防抖 → WebView 載入驗證 → 提交或隔離 | AI 代理寫檔、編輯器自動存檔、還原備份 | 外部改動被自動存檔蓋掉，或載入一半的工作區被存回去。程式已有 generation 與交易序列化，風險較低，之後可再建模 |
| 受管理執行環境的下載與安裝（`managedRuntime*`、`coreEnvironmentManager.ts`） | 未安裝 → 下載中 → 解壓 → 已就緒／失敗，加上暫存與正式目錄 | 第一次上傳、診斷面板的修復、啟動時初始化 | 多個視窗或多次上傳同時要求安裝 | 半套環境被當成可用；已有 `managedRuntimeInitializationCoordinator` 協調，風險中等 |
| 意見回饋服務的 GitHub 同步（`workers/feedback`，每分鐘排程） | D1 裡每筆回饋的同步狀態、重試次數、GitHub issue 編號 | 每分鐘排程、管理者操作、GitHub API 回應 | 排程重疊執行、手動重送 | 重複開 issue 或狀態卡住；屬後台，學生看不到，優先度較低 |
| 上傳按鈕與進度提示（`media/js/blocklyEdit.js` 的 `uploadState`） | ready → uploading → success／error，TXT 另有 running 與 stopping | 按鈕、進度訊息、結果訊息、TXT 停止 | 晚到的進度或結果訊息 | 按鈕卡在上傳中；TXT 已用 operationId 擋掉過期訊息，Arduino／CyberBrick 一次只會有一個上傳，風險低 |

## 改到已建模的功能時

改到上表已建模那兩列的檔案時，同一個 PR 要一起更新模型與 `expected.txt`，並重跑 `bash specs/tla/run-tlc.sh`。每個模型的 README 開頭列出它對應的程式位置。
