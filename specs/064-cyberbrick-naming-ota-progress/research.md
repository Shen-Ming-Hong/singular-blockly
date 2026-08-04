# Phase 0 研究：CyberBrick 命名防呆與 OTA 設定進度

**日期**：2026-08-04
**功能**：`064-cyberbrick-naming-ota-progress`

## 決策 1：維持既有中文 CJK 子集合

**決策**：合法名稱先 `trim()`；第一字元允許 ASCII 英文字母、底線、CJK Extension A（U+3400–U+4DBF）、CJK Unified Ideographs（U+4E00–U+9FFF）與 CJK Compatibility Ideographs（U+F900–U+FAFF），後續再允許 ASCII 數字。名稱不得為空或 Python hard keyword。

**理由**：Python 官方文法允許 Unicode 識別字，且數字不可作為第一字元；目前專案的 MicroPython 變數輸入已使用上述三段 CJK 範圍。沿用現有集合可保留中文教學體驗並避免擴張到未經裝置與字型驗證的全部 Unicode XID 字元。Python soft keywords 只有在特定語境保留；本功能依既定需求將 `type` 視為內建名稱警告，而非 hard error。

**替代方案**：

- 使用 JavaScript Unicode property escapes 接受所有 `ID_Start`／`ID_Continue`：更接近 Python，但超出「保留目前中文方法」範圍，且會擴大相容性測試矩陣，未採用。
- 將中文轉成拼音或 ASCII：會破壞積木顯示與學生理解，未採用。
- 只在產碼時修正：錯誤太晚且可能改變名稱參照，未採用。

**來源**：[Python 3 lexical analysis：Names、keywords 與 Unicode identifiers](https://docs.python.org/3/reference/lexical_analysis.html)

## 決策 2：錯誤與警告使用原生輸入驗證能力

**決策**：VS Code 變數輸入的驗證回傳 `InputBoxValidationMessage`：阻擋規則使用 Error，系統／內建名稱使用 Warning。Blockly 函式與參數使用 `FieldTextInput` local validator；合法值回傳整理後名稱，阻擋值回傳 `null`，並在來源積木顯示在地化警告。

**理由**：VS Code 官方 API 明確保證 Error 會阻止接受，Warning 仍可接受；Blockly 官方 validator 契約支援回傳修改後值以清除前後空白，或回傳 `null` 忽略無效輸入，且可透過 `getSourceBlock()` 找到積木。這兩個原生機制直接符合使用者互動需求。

**替代方案**：

- 接受後再由 onchange 回復：會產生短暫非法狀態與複雜事件遞迴，僅保留既有 duplicate/copy 相容邏輯，不作為主要驗證入口。
- 自製 WebView modal 取代 VS Code InputBox：會改變目前好用的變數命名體驗，未採用。
- 把 warning 也當 error：與已確認的教學需求衝突，未採用。

**來源**：[VS Code API：InputBoxOptions.validateInput 與嚴重度](https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions)、[Blockly 官方 Validators 指南](https://developers.google.com/blockly/guides/create-custom-blocks/fields/validators)

## 決策 3：兩個執行環境使用相同測試向量維持一致

**決策**：Extension Host 與 WebView 各有一個純驗證入口，使用相同的 error codes、keyword／warning 集合與完整測試向量；WebView helper 採專案現有的 UMD 模式，使同一份純 JavaScript 可在瀏覽器與 Node 測試執行。

**理由**：專案架構明確隔離 Extension Host 與 WebView，兩者只透過 `postMessage` 溝通。變數的 VS Code InputBox 必須在 Host 驗證，Blockly 行內欄位必須在 WebView 同步驗證；在兩邊同步執行比每次輸入跨程序往返可靠。完整向量測試會列舉所有 hard keywords、warning names、CJK 邊界與非法符號，降低漂移風險。

**替代方案**：

- 每次 Blockly 輸入透過 `postMessage` 請 Host 驗證：行內 validator 需要同步回傳，非同步往返容易產生競態與延遲，未採用。
- 在 HTML 注入可執行規則：增加 CSP／字串逸出風險，未採用。
- 導入新共享套件或建置步驟：對小型規則集合過度設計，未採用。

## 決策 4：舊工作區採標示與上傳 preflight，不做 migration

**決策**：所有 `Blockly.serialization.workspaces.load()` 入口都透過共用的 hydration scope 暫時旁路行內 validator；`finally` 必須結束旁路。載入完成後再以純 issue collector 掃描變數模型、函式與參數，將 error／warning 以獨立 warning ID 套到相關積木。每次 CyberBrick 上傳前重新掃描，error 阻擋，warning 放行；不修改 serialized data。

**理由**：這能同時滿足不自動改名、不遺失積木與避免已知非法程式上傳。上傳前重新掃描是最後一道可靠防線，也不需要變更工作區 schema。

**替代方案**：

- 載入時自動修復：可能破壞變數／呼叫參照，未採用。
- 只顯示積木 warning、不做上傳 guard：學生仍可送出無法執行的程式，未採用。
- 禁止程式碼預覽：預覽有助於診斷，且需求只要求阻擋上傳，未採用。
- 只依賴 Blockly Events disabled 判斷反序列化：語言切換、檔案監看與一般載入入口的事件狀態不完全一致，容易漏掉載入路徑，未採用。

## 決策 5：OTA 進度採 request-scoped reducer

**決策**：WebView UMD 純 helper 提供 allowlist parser 與 reducer；parser 驗證 Host→WebView progress／result 的物件、request ID、step、success 與安全欄位，通過後 reducer 才維護 `idle | running | succeeded | failed`、`activeRequestId`、完成步驟集合、各步驟最新狀態與失敗步驟。六步驟順序固定；`scan-wifi` 不進 reducer；收到重複步驟只更新文字。關閉 modal 不清 state。

**理由**：現況僅把每則 progress push 進陣列，重複的 `read-device-id` 會顯示兩次且沒有執行中狀態。集合可天然去重，request ID 可忽略舊回應，純 reducer 可直接用 Node 測試，不依賴 DOM。

**替代方案**：

- 以 progress 訊息數量當完成數：會把重複裝置身分訊息算兩次，未採用。
- 只禁用按鈕、不追 request ID：無法處理上一請求延遲回報，未採用。
- 把 Wi-Fi scan 列為第 1 步：與已確認的六階段定義衝突，未採用。

## 決策 6：Extension Host 服務邊界強制單一執行

**決策**：OTA provisioning service 在任何裝置 I/O 前取得 in-flight lock；已鎖定時立即回覆 `provisioning-in-progress`，不呼叫 uploader。成功、預期失敗與例外都在 `finally` 釋放。訊息處理器驗證 request ID 與 payload 形狀，回應沿用原 request ID。`store-secrets` 成功進度必須延後到秘密寫入、配對裝置設定寫入及 panel state 建立全部成功後才發出，且其後不得再有可能失敗的 awaited persistence 操作。

**理由**：前端 disabled 只能改善一般操作，不能防止重複訊息、測試注入或其他入口。服務層鎖可把「只操作一次裝置」變成可驗證的不變條件；既有 response helper 已會回傳 request ID，僅需嚴格套用。

**替代方案**：

- 只在 WebView 設布林值：無法保護 Extension Host，未採用。
- 以全域 queue 排隊：學生的誤按會在第一輪結束後再執行一次，反而危險，未採用。
- 自動取消第一個請求：裝置寫入中途取消可能留下不完整狀態，未採用。

## 決策 7：使用兒童可理解且可存取的 determinate progressbar

**決策**：六階段是已知上限，因此內部使用 0–6 驅動 `role="progressbar"` 與 `aria-valuenow`，但學生可見畫面完全不顯示幾分之幾或百分比。畫面使用大型水平進度條、執行中圖示、簡單的目前階段文字與避免重複操作／拔除 USB 的提示；`aria-valuetext` 也使用在地化階段文字。成功顯示完整進度條與勾勾，失敗停在目前位置並顯示失敗圖示與重試提示，CSS 顏色只作輔助。

**理由**：WAI-ARIA 要求已知進度使用 `aria-valuenow` 且不得超出 min/max；progressbar 需要可存取名稱。六個值適合作為內部可靠計算，但小朋友不需要理解步驟分數或百分比；視覺填滿程度與簡單階段文字能更直接傳達「正在設定，請稍候」。

**替代方案**：

- 只用彩色文字清單：色盲與螢幕閱讀器無法可靠理解整體進度，未採用。
- 使用 `meter`：W3C 明確指出 meter 不應表示任務進度，未採用。
- 無上限 spinner：本流程已有固定六階段，資訊不足，未採用。
- 在進度條旁顯示 `n/6` 或百分比：增加兒童理解負擔，與本次 UX 澄清衝突，未採用。

**來源**：[WAI-ARIA 1.2：progressbar 與 range properties](https://www.w3.org/TR/wai-aria/)、[WAI-ARIA APG：range related properties](https://www.w3.org/WAI/ARIA/apg/practices/range-related-properties/)

## 決策 8：敏感資料只在既有秘密寫入路徑流動

**決策**：progress／result 只包含步驟代碼、成功狀態、裝置 ID、IP 與已分類錯誤；不得回傳 request payload。Host log 只記錄錯誤碼與非敏感 metadata。成功才清除畫面密碼，失敗保留於 DOM 供人工重試，但不得寫入新增持久化位置。

**理由**：現有服務已把秘密寫入 SecretStorage 且測試保證結果不回傳密碼。新進度狀態不需要任何秘密，維持最小揭露即可完成需求。

**替代方案**：

- 把 SSID／密碼放入進度訊息方便除錯：會擴大外洩面，未採用。
- 失敗即清密碼：不符合已確認的重試體驗，未採用。
- 將密碼存入 WebView state 或工作區：違反不變更 schema 與秘密儲存邊界，未採用。
