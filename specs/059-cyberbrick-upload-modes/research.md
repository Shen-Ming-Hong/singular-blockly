# 研究：CyberBrick 上傳模式設定

## 研究來源

- 既有規格：`specs/059-cyberbrick-upload-modes/spec.md`，包含 5 項 clarification 與 FR-001–FR-022。
- 既有 CyberBrick 架構：`src/services/micropythonUploader.ts`、`src/webview/messageHandler.ts`、`media/js/blocklyEdit.js`、`media/html/blocklyEdit.html`、`media/css/blocklyEdit.css`。
- 既有 TXT 設定經驗：`src/services/txtConnectionService.ts` 使用 workspace configuration + `context.secrets`；TXT modal 作為右上角設定入口與表單互動的 UI 參考。
- 既有 PlatformIO guided repair 經驗：`platformioRepairHistoryStore.ts` 提供 workspace-scoped state 與可注入 `Memento` 測試範例。
- 專案文件：`docs/specifications/03-hardware-support/cyberbrick-micropython.md` 確認 CyberBrick 為 ESP32-C3、目前 USB 上傳工具為 `mpremote`、程式入口為 `/app/rc_main.py`。
- VS Code 官方文件：確認 `ExtensionContext.workspaceState`、`ExtensionContext.globalState`、`ExtensionContext.secrets`、`WorkspaceConfiguration`、WebView `postMessage`、WebView persistence/security 的官方行為。
- MicroPython 官方文件：確認 `mpremote` 主要透過 serial 連線，`connect auto` 只自動偵測 USB serial；可用 `fs cp` 將檔案複製到遠端檔案系統；Wi‑Fi REPL/WebREPL 需要先透過有線連線啟用密碼，且不是 `mpremote auto` 的直接替代。
- repo memory：`platformio-resolution-and-upload-button.md`、`txt-connection-ux-decisions.md`，提醒上傳按鈕共享、避免 TXT class 污染、敏感資料不可進專案工作區設定、測試連線應使用表單目前值。

## 決策 1：OTA 是 CyberBrick 上傳模式，不新增 Blockly 積木

**Decision**: v1 將 OTA 做成 CyberBrick 專用上傳模式設定，入口放在 Blockly 編輯畫面右上工具列的設定齒輪；不新增學生可拖曳的「OTA 上傳」或「為上傳而連 Wi‑Fi」積木。

**Rationale**: OTA 屬於傳輸/部署行為，不是學生作品的教學邏輯。若把 Wi‑Fi 憑證或 OTA 設定行為放進積木，會污染生成的 MicroPython 程式，並讓小朋友以為作品本身必須負責上傳。CyberBrick 韌體會自動進入 `/app/rc_main.py`，因此 Extension Host 可以在寫入 `rc_main.py` 前加入不含秘密的 agent 啟動 bootstrap；既有架構已經把上傳集中在 WebView 上傳按鈕與 Extension Host uploader service，最適合在此新增 mode-aware routing。

**Alternatives considered**:
- 新增 `cyberbrick_ota_upload` 積木：被拒絕，因為會把部署動作放進學生程式，違反 FR-020。
- 在每次按上傳時彈窗詢問是否 OTA：被拒絕，會干擾連續上傳與兒童使用體驗，違反 FR-017/SC-004。
- 自動偵測 USB/OTA 並切換：被拒絕，v1 只支援明確 `USB` / `OTA` 模式，避免隱藏 fallback 與傳錯裝置。

## 決策 2：沿用現有上傳按鈕，新增 CyberBrick 專用設定齒輪與模式狀態

**Decision**: 保留既有 `uploadButton` 與 `requestUpload` 的 USB 行為；在 CyberBrick board 啟用時顯示 CyberBrick 上傳設定齒輪與 modal。`handleUploadClick()` 只讀取目前模式並送出對應 message；完整驗證、儲存與上傳執行留在 Extension Host。

**Rationale**: 上傳按鈕目前同時服務 Arduino、CyberBrick、TXT 等流程，貿然改動會造成回歸。TXT connection modal 已證明右上工具列設定入口可行，也提供避免重複 listener 的 JS pattern。WebView 應保持 UI/form role，安全與 persistence 不應放在 browser context。

**Alternatives considered**:
- 新增第二顆 OTA upload button：被拒絕，會讓「目前模式」不明確，也增加兒童誤點機率。
- 讓 WebView 直接保存設定或 token：被拒絕，WebView state 不是安全儲存，也不適合保存跨 session 專案資料。
- 把 CyberBrick 設定塞進 TXT modal：被拒絕，兩者硬體、通訊與語意不同，會污染 TXT UX 與樣式 class。

## 決策 3：非敏感設定使用專案工作區範圍；敏感資料只用 `context.secrets`

**Decision**: 專案工作區範圍（workspace folder scoped）的非敏感設定（目前模式、已配對裝置的 `deviceId`/`friendlyName`/最近 IP/狀態摘要、主要目標）使用 VS Code workspace configuration key `singular-blockly.cyberbrick.uploadSettings` 或等效的 workspace-folder scoped 設定；Extension 端持久化的 Wi‑Fi 密碼、OTA token、pairing secret 等敏感資料只存 `ExtensionContext.secrets`，並以 `deviceId` 與 workspace hash 組合出 secret key。首次 USB provisioning 可透過可信任 USB 通道把裝置連線所需的最小必要設定寫入 CyberBrick 裝置端，但不得寫入專案工作區設定、學生作品、WebView 回傳 payload 或日誌。

**Rationale**: 規格明確要求非敏感資料以專案工作區為範圍保存，重新開啟同一專案後不必重設；同時 Extension 端敏感憑證不得跟隨專案同步或匯出。VS Code 官方 API 指出 `SecretStorage` 是加密敏感資料儲存，且不跨機器同步；`WorkspaceConfiguration` 適合 workspace-folder scoped 非敏感設定。既有 TXT service 已使用 workspace configuration 保存 host/username/path，並用 `context.secrets` 保存密碼。

**Alternatives considered**:
- 全部存 `globalState`：被拒絕，會跨專案混淆教室裡不同作品與裝置。
- 全部寫入 `.vscode/settings.json`：被拒絕，Wi‑Fi 密碼/token 會污染可分享專案；只有非敏感 registry 與模式可放在專案工作區設定。
- 全部只存 `SecretStorage`：被拒絕，會讓非敏感模式與裝置清單不易跟專案脈絡同步，也不利於老師管理多台裝置。

## 決策 4：首次 OTA 配對與 Wi‑Fi provisioning 只能經 USB 完成

**Decision**: v1 要求使用者先以 USB 連接 CyberBrick，透過既有 `mpremote` 能力取得/建立 `deviceId`、部署或更新最小 OTA agent、執行裝置端 Wi‑Fi scan、把裝置連線所需的最小 Wi‑Fi/OTA 設定寫入 Singular Blockly 自有裝置端檔案，成功後才允許日常 OTA 上傳。Extension 端的敏感資料仍只持久化在 `SecretStorage`。

**Rationale**: MicroPython 官方文件指出 WebREPL 的初始密碼/啟用流程需透過 wired connection 以提高安全性；`mpremote connect auto` 也只自動偵測 USB serial。USB-first 能建立可信任通道，避免未配對裝置在同一 Wi‑Fi 中被任意上傳。這也符合 clarification：第一次 OTA 配對只能透過 USB 完成。

**Alternatives considered**:
- 第一次就透過 Wi‑Fi 配對：被拒絕，缺少可信任起點，且教室多台裝置時容易誤連。
- 要求學生先放 Wi‑Fi 積木讓作品連網：被拒絕，會污染教學程式邏輯且違反 FR-020。
- 使用 host 電腦掃描 SSID：被拒絕，電腦看到的 Wi‑Fi 不等於 CyberBrick 裝置能看到的 Wi‑Fi。

## 決策 5：SSID 建議由 CyberBrick 裝置本身掃描，且只在使用者要求時更新

**Decision**: OTA 設定 modal 的 SSID 建議清單由 USB 連線中的 CyberBrick 執行 MicroPython `network.WLAN(...).scan()` 類型流程後回傳；使用者開啟設定或按「重新掃描」時才刷新，沒有持續背景輪詢。若清單為空或目標網路隱藏，仍提供手動輸入。

**Rationale**: 裝置端掃描最接近實際連線能力。持續背景掃描會造成效能與 UI 干擾，也可能讓多台裝置/多個 WebView panel 的狀態互相打架。MicroPython `mpremote exec` 可透過 USB 執行短程式取得掃描資料；掃描結果應只作為建議，不可作為唯一入口。

**Alternatives considered**:
- 每隔數秒自動重新整理 SSID：被拒絕，違反 FR-019，且對小朋友畫面干擾太大。
- 只允許從建議清單選擇：被拒絕，隱藏網路與掃描不完整時會卡住使用者。
- 使用 macOS/Windows host Wi‑Fi API：被拒絕，跨平台複雜且與 CyberBrick 視角不同。

## 決策 6：多裝置身分以 `deviceId` 為主鍵，`friendlyName` 只做顯示

**Decision**: 所有已配對裝置 registry、secret key、主要目標選擇與 OTA upload request 都以 `deviceId` 為主鍵。UI 可顯示 `friendlyName`，但名稱可重複；重複或相似名稱時必須同時顯示足夠短的 `deviceId` 摘要、最近 IP、最後成功時間等辨識資訊。

**Rationale**: 教室裡多台 CyberBrick 很容易使用相同名稱，例如「車子」或「CyberBrick」。若以名稱當主鍵，會導致傳錯裝置。`deviceId` 由 USB pairing 建立或讀取，能在 IP 改變時仍維持同一台裝置身分。

**Alternatives considered**:
- 以 IP 位址當主鍵：被拒絕，DHCP/IP 變動時會失效。
- 以 friendlyName 當主鍵：被拒絕，名稱可重複且使用者可能修改。
- 上傳時自動選最近發現裝置：被拒絕，會違反 FR-017 與「指定主要目標」的安全性。

## 決策 7：OTA 失敗不自動 fallback 到 USB，只提供明確下一步

**Decision**: 在 `OTA` 模式下，若 readiness validation 失敗、目標不可連線、token 驗證失敗或上傳失敗，系統顯示具體原因與下一步（重新掃描/重新配對/改選裝置/手動切回 USB），但不自動改走 USB，也不自動切換模式。

**Rationale**: 自動 fallback 看似貼心，但在多台裝置與教室情境中會讓使用者不清楚程式到底傳到哪裡。規格 clarification 已明確要求不 fallback；SC-006 要求在真正傳送前提供可行動修正指引。

**Alternatives considered**:
- OTA 連不上就自動用 USB：被拒絕，可能上傳到插著 USB 的另一台裝置，造成更高風險。
- OTA 設定完成後自動切成 OTA：被拒絕，違反 FR-004/FR-013。
- 每次上傳前重新詢問使用者：被拒絕，破壞連續上傳體驗。

## 決策 8：OTA transport 封裝在 `CyberBrickOtaUploader`，v1 只支援單檔 `/app/rc_main.py`

**Decision**: v1 建立獨立 `CyberBrickOtaUploader` service，對外只暴露 readiness check、upload progress/result 與錯誤分類；內部使用 USB provisioning 部署的最小 CyberBrick OTA agent 或 firmware-supported endpoint，透過 HTTP/WebSocket 等 authenticated LAN transport 接收單一 generated MicroPython 檔案並寫入 `/app/rc_main.py`。若後續 firmware 提供更正式協定，只需替換 service 內部 adapter。

**Rationale**: 既有 USB uploader 已固定上傳 `/app/rc_main.py`，v1 應保持相同執行模型，避免同時解決 package sync、library deployment、遠端 shell 等問題。MicroPython `mpremote` 不提供通用 Wi‑Fi auto upload；WebREPL 可作為概念參考但不應把協定細節散落在 WebView。獨立 service 可讓 hidden tests 驗證 URL/token/timeout/error handling，而不需要真硬體。

**Alternatives considered**:
- 直接把 `mpremote` 當 OTA transport：被拒絕，官方 `connect auto` 只支援 USB serial，自動 Wi‑Fi 目標選擇不成立。
- 一開始支援整個檔案樹同步：被拒絕，超出 v1 需求；目前生成程式入口是單檔 `/app/rc_main.py`。
- 在 WebView JS 裡直接呼叫 HTTP endpoint：被拒絕，會暴露 token/同源限制與錯誤處理，且不利於測試與 logging。

## 決策 9：WebView state 只保存暫時 UI；跨 session 狀態由 Extension Host 提供

**Decision**: CyberBrick upload modal 可以用 WebView local state 保存尚未提交的表單暫態；已保存模式、裝置 registry、readiness 與 secret presence 都由 Extension Host 在 modal 開啟時重新載入並回傳。不要使用 `retainContextWhenHidden` 作為資料保存策略。

**Rationale**: VS Code WebView 官方文件建議以 message passing 與 `getState/setState` 處理輕量 UI 狀態；`retainContextWhenHidden` 會增加記憶體成本。跨 session / workspace 的真實設定需要在 Extension Host 管理，才能套用 SecretStorage、workspace scope 與測試替身。

**Alternatives considered**:
- 開啟 `retainContextWhenHidden` 保住 modal：被拒絕，資源成本高，也不能解決重啟 VS Code 後的保存。
- WebView 用 `localStorage` 保存設定：被拒絕，scope/安全/清除語意不清楚。
- 每次重新開 modal 都從空白開始：被拒絕，違反 FR-005 與首次設定後回來可看到狀態的需求。

## 決策 10：裝置端變更只新增自有檔案並修改 `/app/rc_main.py`

**Decision**: v1 的裝置端檔案變更採白名單：可新增或更新 `/cyberbrick_ota_agent.py` 與 `/cyberbrick_ota_config.py`，並可在 `/app/rc_main.py` 加入或更新不含秘密的 OTA bootstrap。不得修改 `/boot.py`、WebREPL 設定、韌體/出廠設定、官方 runtime 檔案，也不得刪除或重新命名裝置上既有非 Singular Blockly 管理的檔案。

**Rationale**: CyberBrick 會自動進入 `/app/rc_main.py`，因此 OTA 啟動點放在 `rc_main.py` 最符合實際執行模型。只新增自有檔案並修改應用入口可最大化與官方出廠狀態的相容性，降低日後韌體更新、出廠還原、WebREPL 或其他官方功能互相干擾的風險。

**Alternatives considered**:
- 修改 `/boot.py`：被拒絕，CyberBrick 啟動模型以 `/app/rc_main.py` 為入口，且改動 boot 檔會增加與官方韌體/出廠流程衝突的風險。
- 寫入 WebREPL 或系統網路設定：被拒絕，這會改變官方出廠狀態並可能影響其他工具。
- 同步整個檔案樹或清理既有檔案：被拒絕，超出 v1 需求且破壞相容性。

## 決策 11：RC/ESP‑NOW generated code 必須保留已配對 OTA 的 Wi‑Fi STA 連線

**Decision**: CyberBrick RC/ESP‑NOW MicroPython 生成碼在偵測到裝置端 `cyberbrick_ota_config` 具備 SSID 與 OTA token 時，不得無條件呼叫 `_wlan.disconnect()` 或 `_wlan.config(reconnects=0)`；只有未配對 OTA 的純 ESP‑NOW 情境才維持原本 disconnect + 固定 channel 初始化。

**Rationale**: 實機診斷顯示 OTA bootstrap 與 agent/config 都存在時，RC/ESP‑NOW 初始化若立刻斷開 STA Wi‑Fi，Extension Host 的 `/api/v1/health` readiness check 會在 5 秒後 timeout。保留 STA Wi‑Fi 可讓 OTA agent 持續可達；若使用者未設定 OTA，原本的 ESP‑NOW 頻道控制行為不受影響。

**Alternatives considered**:
- 讓 OTA upload 失敗時要求使用者每次改回 USB：被拒絕，這會讓 OTA 對常見 RC/ESP‑NOW 範例失去可用性。
- 在 device agent 內強制背景重連但允許學生程式繼續 disconnect：被拒絕，會造成 agent 與 generated code 互相拉扯 Wi‑Fi 狀態，timeout 仍可能不穩定。

---

## 未來功能討論：無線 Log 串流（v1 不實作）

> 以下為設計討論紀錄，供未來 AI 或貢獻者回頭參考。v1 不實作，不屬於本 spec 交付範圍。

### 背景

v1 的 `SerialMonitorService` 使用 `mpremote connect <port> repl` 連接 CyberBrick，只能透過 USB 讀取 `print()` 輸出。使用者期望：OTA 部署後不接 USB 也能查看程式 log。

### 目前可行嗎？

**否，v1 不可行。** 有兩條路被封鎖：

1. **WebREPL**：MicroPython 官方無線 REPL，但本 spec FR-023 明確禁止修改 `/boot.py`（CyberBrick 出廠韌體不啟用 WebREPL），因此這條路在白名單規則下無法採用。
2. **`mpremote` 無線模式**：`mpremote` 底層無線連線最終也需要 WebREPL，排除同上。

### 未來可行路徑

**OTA agent 新增 `GET /api/v1/logs` endpoint（不需修改 `/boot.py`）**

架構要點：
- 在裝置端 `cyberbrick_ota_agent.py` 新增一個 log streaming endpoint，例如 `GET /api/v1/logs`
- 使用 HTTP chunked transfer encoding（`Transfer-Encoding: chunked`）將 `sys.stdout` 的輸出串流回 Extension Host
- Extension Host 的 `SerialMonitorService` 新增無線模式，當裝置已 OTA 配對時切換為 HTTP polling 或 streaming
- 完全不碰 `/boot.py`、WebREPL 或出廠設定，符合 FR-023 白名單原則

教學建議（若未來實作）：
- **迭代開發流程**：USB 連接開發與測試 → OTA 部署 → 無線 log 監控驗證 → 循環
- 確保 log endpoint 也受 OTA token 保護，避免同一網路內的非授權讀取

### 為何 v1 不先做

- 本 spec 核心交付是 OTA 上傳功能本身；無線 log 屬於進一步的教學體驗改善
- log streaming 需要 OTA agent 升版（新增 endpoint、chunked transfer、stdout 重導向），複雜度與測試量足以構成獨立 spec
- 優先確保 upload 流程穩定，再在後續版本擴充 agent capability
