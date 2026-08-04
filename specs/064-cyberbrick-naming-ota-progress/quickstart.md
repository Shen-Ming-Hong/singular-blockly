# Quickstart 驗證指南：CyberBrick 命名防呆與 OTA 設定進度

## 目的

依最短可重現流程驗證名稱防呆、舊工作區上傳 guard、OTA 六階段、重複要求保護、敏感資料與 15 語系。詳細規則見 [命名契約](contracts/naming-validation.md) 與 [OTA 訊息契約](contracts/ota-provisioning-messages.md)。

## 前置條件

- Node.js 22.16.0+
- 已安裝專案 dependencies
- 測試 OTA 實機流程時，準備一台 CyberBrick、USB 線及可用 Wi-Fi
- 目前分支為 `064-cyberbrick-naming-ota-progress`

## 1. 快速自動化驗證

```bash
npm run compile
npm run lint
npm run validate:i18n
npm test
```

預期：所有命令成功；現有 Arduino、TXT、CyberBrick 測試不退化。

### 實作前基準（2026-08-04）

- `npm run compile`：PASS。
- `npm run lint`：PASS。
- `npm run validate:i18n`：PASS，14 個非英文語系皆為 0 errors；既有長度 warnings 不阻擋。
- `npm test`：預設解析到本機 VS Code 1.131.0，但該既有測試安裝只有 `Contents/MacOS/Code`，測試 CLI 尋找 `Contents/MacOS/Electron` 而無法啟動。
- 改以既有且完整的 VS Code 1.130.0 執行 `npx vscode-test --label unit --code-version 1.130.0`：938 passing、1 pending、1 failing。唯一失敗為既有 `MicropythonUploader CyberBrick helper commands / wraps rc_main.py with a single OTA startup call without secrets`，斷言期待 OTA background thread ready 後仍保留短暫 head start；本功能尚未修改任何產品程式碼，故將此列為實作前已知基準，不把它歸因於本功能。

### 實作後結果（2026-08-04）

- `npm run compile`：PASS。
- `npm run lint`：PASS。
- `npm run validate:i18n`：PASS，14 個非英文語系皆為 0 errors；既有長度 warnings 不阻擋。
- 聚焦執行命名 helper、OTA reducer、WebView contract、i18n 與 orphan guard：81 passing。
- `npm test`：pretest 的 TypeScript 編譯、webpack 與 lint 皆 PASS；測試啟動仍因既有 VS Code 1.131.0 安裝缺少 `Contents/MacOS/Electron` 而停止，與實作前基準一致。
- 改以既有完整環境執行 `npx vscode-test --config .vscode-test.mjs --label unit --code-version 1.130.0`：979 passing、1 pending、1 failing。唯一失敗仍是實作前已存在的 `MicropythonUploader CyberBrick helper commands / wraps rc_main.py with a single OTA startup call without secrets`；所有本功能新增與受影響測試均通過。

開發期間可先執行聚焦測試（實際 glob 依 test runner 支援方式調整）：

```bash
npm run test:bail
```

## 2. CyberBrick 變數命名

1. 選擇 CyberBrick。
2. 開啟變數類別，新增變數。
3. 依序輸入 `1motor`、`motor speed`、`motor-speed`、`for`。
4. 確認每個值都立即顯示原因且無法確認。
5. 輸入 `  馬達速度2  `，確認建立後顯示 `馬達速度2`。
6. 輸入 `print`，確認顯示 warning 但可按 Enter 建立。

預期：error 阻擋；warning 放行；中文保持原樣。

## 3. 函式與參數命名

1. 建立函式並把名稱改成 `馬達控制`，確認成功。
2. 嘗試改成 `2control`、`while`、`motor-control`，確認欄位保留上一個有效值並顯示對應錯誤。
3. 建立第二個函式，嘗試改成 `馬達控制`，確認重複函式被阻擋。
4. 開啟 mutator，建立兩個同名參數，確認第二個被阻擋。
5. 把參數改成 `range`，確認 warning 但可保存。

## 4. 舊工作區與板子隔離

1. 載入測試 fixture：含數字開頭變數、keyword 函式及重複參數。
2. 分別以一般載入、FileWatcher 重載及切換介面語言造成的工作區重載走過 fixture，確認 hydration scope 都在反序列化期間旁路行內 validator。
3. 確認三條載入路徑的序列化名稱都沒有被修改，scope 結束後相關積木均顯示問題。
4. 確認程式碼預覽仍可更新。
5. 按上傳，確認未送出 `requestUpload`，並顯示第一個待修正項目。
6. 修正所有 error，只保留 `print` warning，再按上傳，確認流程可繼續。
7. 切換到 Arduino／TXT，確認不顯示 CyberBrick 命名 warning，既有命名行為不變。

## 5. OTA 六階段畫面

1. 開啟 CyberBrick upload settings，選 USB 與 Wi-Fi，輸入密碼。
2. 按「設定無線上傳」。
3. 立即確認畫面顯示空的大型水平進度條、執行中圖示、「正在設定無線上傳」及「請勿重複按下或拔除 USB」提示；學生可見區域不出現分數或百分比。
4. 確認 USB、名稱、Wi-Fi、密碼、重新掃描、重新整理、設定、清理及配對 actions 均不可操作。
5. 關閉 modal 再開啟，確認進度與禁用狀態保留。
6. 依序觀察六階段，裝置身分「正在建立」與「建立完成」只占一格。
7. 成功後確認進度條完整填滿、顯示勾勾與成功文字、控制項恢復、密碼欄清空。

## 6. OTA 失敗與重試

1. 以測試 stub 在 `configure-wifi` 或 `verify-agent` 階段回報失敗。
2. 確認進度條停在失敗前已到達的位置，畫面以圖示與文字指出失敗階段、提供重試提示、控制項恢復且密碼仍在。
3. 修正條件後重試；注入上一 request ID 的延遲 progress。
4. 確認舊 progress 被忽略，新流程由空進度條開始。
5. 成功後確認密碼才被清除。
6. 讓秘密寫入成功但 paired-device 設定或 panel state 建立失敗，確認 `store-secrets` 不會先回報成功、進度條不會先填滿，畫面進入可重試的失敗狀態。

## 7. 並行與秘密安全

1. 在第一個 provisioning promise 尚未完成時，直接向 message handler 送出第二個不同 request ID。
2. 確認 uploader 方法只由第一個流程呼叫一次，第二個結果為 `provisioning-in-progress`。
3. 讓第一個流程 throw，再送第三個請求，確認第三個可執行。
4. 搜尋測試捕捉的 progress、result 與 log，確認不含測試密碼、OTA token、pairing secret 或完整 payload。
5. 依序注入 null、array、缺 requestId、未知 step／status、非布林 success 及錯型 error 的 Host→WebView progress／result，確認 reducer、DOM、密碼與控制項狀態完全不變。

## 8. 無障礙與語系

- 使用 DOM contract 測試確認 progressbar 內部有 0、6、目前值、可存取名稱與在地化階段 value text，同時確認學生可見區域沒有分數或百分比。
- 以鍵盤開啟／關閉 modal，確認禁用控制項不會誤觸設定，關閉按鈕仍可用。
- 在至少繁中與英文介面實際走一次 error、warning、running、success、failed。
- 執行 `npm run validate:i18n`，確認 15 語系 key 完整。

### 本次驗收方式

- 繁中／英文與其他 13 語系：由 feature i18n key contract 及 `validate:i18n` 驗證，PASS。
- 鍵盤／ARIA：由 WebView contract 驗證 determinate `progressbar`、0–6 數值、可存取名稱、階段 value text、進行中控制項鎖定與 modal 關閉按鈕不被鎖定，PASS。
- 舊工作區：由命名 WebView contract 驗證一般載入、FileWatcher 與語言切換三條反序列化路徑均使用 `try/finally` hydration scope，且序列化名稱不會被改寫，PASS。
- CyberBrick OTA：本次未連接實體 CyberBrick；依任務允許採等效 stub，以 reducer、message handler 與 provisioning service 測試驗證六階段、失敗階段、重試、request correlation、單一執行鎖、最後里程碑時序及秘密消毒，PASS。

## 完成條件

- [x] 命名契約的全部測試向量通過。
- [x] 舊工作區不被自動修改且 error 阻擋上傳。
- [x] 一般載入、FileWatcher 與語言切換重載都安全結束 hydration scope，載入失敗時也不殘留旁路狀態。
- [x] OTA 六步驟精確計數、控制項鎖定、modal 重開保留狀態。
- [x] 最後里程碑不會在 paired-device 或 panel state 失敗前提早完成。
- [x] success／failure 的密碼行為正確。
- [x] request correlation 與 Host 單一執行鎖通過。
- [x] Host→WebView 格式錯誤的 progress／result 不改變任何目前狀態。
- [x] 無敏感值出現在訊息或 log。
- [x] compile、lint、i18n 與全部功能相關測試通過；完整測試僅保留上述實作前既有單一失敗。
