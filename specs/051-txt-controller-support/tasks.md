---
description: "fischertechnik TXT Controller 支援功能實作任務清單"
---

# Tasks: fischertechnik TXT Controller 支援

**Input**: `specs/051-txt-controller-support/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

## 格式說明

- **[P]**: 可與同 Phase 其他任務並行（不同檔案，無未完成的依賴）
- **[USx]**: 對應 spec.md 的 User Story 編號
- 所有任務含明確檔案路徑

---

## Phase 1: Setup（專案基礎建設）

**目的**：安裝新依賴、設定 webpack、建立 txt-runtime 目錄

- [X] T001 在 package.json `dependencies` 新增 `node-ssh` 並執行 `npm install`
- [X] T002 在 webpack.config.js 的 `externals` 加入 `'node-ssh': 'commonjs node-ssh'`（Extension Host 不打包 node_modules）
- [X] T003 [P] 建立 `txt-runtime/` 目錄（新增 `txt-runtime/.gitkeep` 佔位檔）

---

## Phase 2: Foundational（阻塞性前置條件）

**目的**：建立型別系統與積木框架，所有 User Story 均依賴此 Phase 完成

**⚠️ CRITICAL**：Phase 2 完成前，任何 User Story 均無法實作或測試

- [X] T004 在 `src/types/board.ts` 將 `'txt'` 加入 `BoardLanguage` union type，並將 `'ssh'` 加入 `UploadMethod` union type
- [X] T005 在 `src/types/arduino.ts` 更新 `getBoardLanguage()` 函式，使 TXT 板子回傳 `'txt'`；確認所有相關 switch 語句有 `'txt'` 的 case
- [X] T006 建立 `src/types/txt.ts`，定義以下型別（詳見 data-model.md）：`TxtConnectionConfig`、`TxtDeviceState`（union type）、`TxtIoSnapshot`、`TxtUploadStage`、`TxtUploadProgress`、`TxtUploadResult`、`TxtUploadRequest`
  - **M2**：`TxtDeviceState` 的唯一擁有者為 `TxtConnectionService`（singleton，由 extension.ts 建立後注入 `TxtUploader` 與 `TxtTestService` 建構函式）；任何狀態轉換均透過 `TxtConnectionService.setState()` 進行，避免兩個 Service 各自維護獨立狀態造成衝突
- [X] T007 [P] 建立 `media/blockly/blocks/txt.js`，定義現況 TXT 積木（HSV 200 色彩）：`txt_main`、`txt_init`、`txt_motor_speed`（含 MOTOR 下拉/SPEED 數字/DIRECTION 下拉）、`txt_motor_stop`、`txt_output`（含 STATE ON/OFF）、`txt_input_sensor`、`txt_input_read`（Value 輸出，向下相容）、`txt_wait`（MS 欄位）、`txt_stop_all`（詳見 contracts/txt-blocks-api.md）
- [X] T008 [P] 建立 `media/blockly/generators/txt/txt.js`，實作 TXT 積木的 Python generator（ftrobopy API；addImport() 去重；`txt_main` / `txt_init` 目前生成 `ftrobopy.ftrobopy('auto')`；DIRECTION BACKWARD → 負速度值；超音波輸入透過 `_read_ultrasonic()` helper；詳見 contracts/txt-blocks-api.md）
- [X] T009 [P] 建立 `media/toolbox/categories/txt.json`，定義「TXT 控制器」工具箱類別，包含現行 TXT 積木的 toolbox XML entry
- [X] T010 更新 `media/toolbox/index.json` 加入 txt 類別；在 `media/html/blocklyEdit.html` 加入 `<script>` 引用 `txt.js` blocks 與 `txt.js` / `python_common.js` generators（僅當 board=TXT 時載入）；同步在 blocklyEdit.html 的開發板下拉選單 `<select>` 中新增 `<option value="txt">TXT Controller</option>`（FR-001）

**Checkpoint**：型別系統與積木框架就緒，可開始 User Story 實作

---

## Phase 3: User Story 2 - 設定 TXT 連線參數（優先級：P1）

**目標**：讓使用者在 Blockly Editor 內填入 TXT IP、帳密並測試連線，密碼安全儲存

**Independent Test**：填入有效 TXT IP 和帳密，點擊「測試連線」，5 秒內顯示成功即通過

- [X] T011 建立 `src/services/txtConnectionService.ts`，實作 `TxtConnectionService` 類別：
  - `saveConfig(config: TxtConnectionConfig): Promise<void>`（workspace settings）
  - `loadConfig(): Promise<TxtConnectionConfig | undefined>`
  - `storePassword(password: string): Promise<void>`（`context.secrets`，key = `singular-blockly.txt.password`）
  - `getPassword(): Promise<string | undefined>`
  - `testConnection(): Promise<{success: boolean; error?: string}>`（node-ssh connect → 執行 `echo ok` → dispose，5 秒 timeout）
  - `setState(newState: TxtDeviceState): void`（唯一的狀態轉換入口，供 TxtUploader 與 TxtTestService 呼叫；呼叫方需注入此 service 實例）
  - 注意：任何 log 語句不得包含密碼欄位
- [X] T012 [P] 建立 `src/test/suite/txtConnectionService.test.ts`：mock `vscode.SecretStorage`、mock `node-ssh`（connect 成功/失敗）、測試 testConnection 成功路徑、連線失敗路徑（timeout、auth error）、saveConfig/loadConfig 往返
- [X] T013 更新 `src/webview/messageHandler.ts`，在 switch-case 新增：`txtSaveConfig`（呼叫 TxtConnectionService.saveConfig + storePassword）、`txtLoadConfig`（載入並回傳設定，不含密碼）、`txtTestConnection`（呼叫 testConnection，postMessage 回傳結果）
- [X] T014 [P] 在 `media/html/blocklyEdit.html` 新增 TXT 連線設定區塊（預設折疊；僅選 TXT 板時顯示；欄位：Host IP、Username、Password 輸入框、「儲存設定」按鈕、「測試連線」按鈕、狀態文字區）
- [X] T015 在 `media/js/blocklyEdit.js` 新增 TXT 連線設定 UI 邏輯：board 切換時顯示/隱藏連線設定區、點擊儲存→ `vscode.postMessage({command:'txtSaveConfig',...})`、點擊測試→ postMessage + 顯示 spinner + 接收成功/失敗回應；`txtLoadConfig` 回應到達時同步更新 UI 與模組狀態（目前 generator 主程式連線採 `ftrobopy.ftrobopy('auto')`，不再依賴 host 注入）
- [X] T016 [P] 在 `package.json` contributes.configuration 新增 4 個 TXT 設定鍵：`singular-blockly.txt.host`（預設值 `"192.168.7.2"`，對應 USB CDC-ECM 固定 IP）、`singular-blockly.txt.username`（預設值 `"ftc"`，ftCommunity 預設 SSH 帳號）、`singular-blockly.txt.remotePath`、`singular-blockly.txt.runtimePort`（預設值 `8080`，io_server.py 監聽埠）

**Checkpoint**：US2 完整可測試——填入設定並驗證連線，不需上傳程式

---

## Phase 4: User Story 1 - 積木生成 TXT Python 程式並部署執行（優先級：P1）

**目標**：完整的 Blockly → 生成 Python → SSH 上傳 → TXT 執行流程

**Independent Test**：拖入 `txt_main` 容器並放入 `txt_motor_speed` 積木，點擊上傳，馬達轉動即通過

**依賴**：US2（需連線設定）、Phase 2（需積木 generator）

- [X] T017 建立 `src/services/txtUploader.ts`，實作 `TxtUploader` 類別：
  - `upload(code: string): Promise<TxtUploadResult>`（stages：connecting→uploading→executing；`onProgress` callback 發出 TxtUploadProgress；`ssh.execCommand()` resolve = 執行結束）
  - **FR-007**：建立 VS Code OutputChannel（`vscode.window.createOutputChannel('TXT Controller')`），在 `execCommand` 的 `onStdout`/`onStderr` 回呼中即時串流輸出；exit code 非 0 → OutputChannel 顯示錯誤，狀態轉換至 Error
  - `stopExecution(): Promise<void>`（SSH kill python3 process；timeout watchdog 30 秒）
  - `TxtDeviceState` 狀態機（詳見 data-model.md 狀態轉換表）
  - 30 秒 timeout watchdog：觸發時 dispose SSH 連線並轉換到 Error 狀態
- [X] T018 [P] 建立 `src/test/suite/txtUploader.test.ts`：mock `node-ssh`（connect/putFile/execCommand）、測試每個 TxtUploadStage 的進度事件、exit code 非 0 → Error 狀態、stopExecution 發出 kill 指令、超時 watchdog 觸發
- [X] T019 更新 `src/webview/messageHandler.ts`，新增 `txtUpload` case（呼叫 TxtUploader.upload，串流 TxtUploadProgress 回 WebView）、`txtStopExecution` case（呼叫 stopExecution）
- [X] T020 在 `src/extension.ts` 註冊命令 `singular-blockly.txt.stopExecution`；在 `package.json` contributes.commands 新增該命令（含 i18n title）
- [X] T021 更新 `media/js/blocklyEdit.js`，處理 TXT 上傳流程：發送 `txtUpload` postMessage（含生成的 Python code）、接收 TxtUploadProgress 更新進度條（connecting / uploading / executing 三段）、接收完成/失敗回應、顯示 Stop 按鈕
- [X] T022 執行 `npm run compile` 確認 TypeScript 編譯無錯誤；執行 `npm run lint` 確認 ESLint 通過

**Checkpoint**：US1 完整可測試——積木生成 Python → SSH 部署 → TXT 執行，馬達轉動

---

## Phase 5: User Story 4 - 最小積木集完整覆蓋 TXT 基本控制（優先級：P2）

**目標**：7 個 TXT 積木在 15 語系有完整翻譯、孤立積木有警告保護

**Independent Test**：`npm run validate:i18n` 通過；孤立積木放主程式外 → 顯示警告文字

**依賴**：Phase 2（積木定義已建立）

- [X] T023 [P] 在全部 15 個 `media/locales/{lang}/messages.js` 新增 TXT 積木 i18n 鍵值：積木標籤（txt_init、txt_motor_speed 等）、下拉選項（FORWARD/BACKWARD、ON/OFF、M1-M4、O1-O8、I1-I8）、孤立積木警告訊息（`TXT_ORPHAN_WARNING`）
- [X] T024 在 `media/blockly/blocks/txt.js` 為全部 7 個積木加入孤立積木保護：`forBlock` 層呼叫 `isInAllowedContext()` + 孤立時回傳空字串；`onchange` 層呼叫 `setWarningText()`（詳見 wrapOnchange 模式，參考 loops.js）
- [X] T025 執行 `npm run validate:i18n`，確認 15 語系的 TXT 鍵值 100% 覆蓋；修正所有缺漏
- [X] T026 [P] 確認 `media/toolbox/index.json` 中 TXT 類別的 board 條件過濾邏輯正確（僅在 board=TXT 時顯示 txt 類別，不影響 Arduino/MicroPython 的工具箱）

**Checkpoint**：US4 完整可測試——15 語系翻譯、孤立警告、工具箱條件顯示

---

## Phase 6: User Story 3 - I/O 即時測試面板（優先級：P2）

**目標**：Test Panel 可即時控制 M1-M4、O1-O8，顯示 I1-I8 數位輸入，400ms 更新

**Independent Test**：開啟 Test Panel → 拖動 M1 滑桿至 100 → TXT M1 馬達轉動即通過

**依賴**：US2（需連線設定）、US1（共用 TxtDeviceState 避免衝突）

- [X] T027 建立 `txt-runtime/io_server.py`，實作 HTTP I/O Server（詳見 contracts/io-server-api.md）：
  - Python `http.server.BaseHTTPRequestHandler`，port 8080
  - `GET /io` → 回傳 `TxtIoSnapshot` JSON
  - `POST /motor` → `body: {motor: 1-4, speed: -512~512}` → `txt.motor(N).setSpeed(v)`
  - `POST /output` → `body: {output: 1-8, level: 0|512}` → `txt.output(N).setLevel(v)`
  - `POST /stop_all` → 迴圈停止所有馬達與輸出
  - CORS headers：`Access-Control-Allow-Origin: *`
- [X] T028 建立 `src/services/txtTestService.ts`，實作 `TxtTestService` 類別：
  - `installRuntime(): Promise<void>`（SSH SCP 上傳 `io_server.py` 到 TXT，設定執行權限）
  - `startServer(): Promise<void>` / `stopServer(): Promise<void>`（SSH execCommand）
  - `pollIo(): Promise<TxtIoSnapshot>`（HTTP GET `http://{host}:{runtimePort}/io`，port 從 `singular-blockly.txt.runtimePort` 設定讀取，預設 `8080`，< 400ms）
  - `setMotor(motor, speed)` / `setOutput(output, level)` / `stopAll()`（HTTP POST，同樣使用 `runtimePort`）
- [X] T029 [P] 建立 `src/test/suite/txtTestService.test.ts`：mock HTTP fetch（pollIo 成功/失敗）、mock node-ssh（installRuntime SCP）、測試 stopAll 發出正確 HTTP payload
- [X] T030 更新 `src/webview/messageHandler.ts`，新增 Test Panel routes：`txtTestInstallRuntime`、`txtOpenTestPanel`（呼叫 webviewManager）、`txtTestSetMotor`、`txtTestSetOutput`、`txtTestStopAll`、`txtTestPollIo`（回傳 TxtIoSnapshot 給 Test Panel）
- [X] T031 在 `src/extension.ts` 註冊命令 `singular-blockly.txt.installRuntime`、`singular-blockly.txt.openTestPanel`；在 `package.json` contributes.commands 加入（含 i18n title）
- [X] T032 建立 `media/html/txtTestPanel.html`，佈局：M1-M4 速度滑桿（range 0-512）+ 方向切換、O1-O8 開關按鈕、I1-I8 唯讀數字指示燈、「全部停止」顯眼按鈕、狀態列（Connected/Testing/Paused）
- [X] T033 建立 `media/js/txtTestPanel.js`：
  - 400ms polling 迴圈（`setInterval`，呼叫 `txtTestPollIo` postMessage，更新 I1-I8 顯示）
  - **M1**：追蹤連續 polling 失敗次數；連續失敗 ≥ 3 次 → 狀態列顯示「連線中斷」警告，顯示「重試」按鈕（點擊後重置失敗計數並立即重試一次 pollIo）
  - 滑桿 `mouseup` 事件保持速度值（不歸零）→ postMessage `txtTestSetMotor`
  - 開關點擊 → postMessage `txtTestSetOutput`
  - 「全部停止」按鈕 → postMessage `txtTestStopAll`
  - WebView `onbeforeunload` 觸發 stop_all（關閉自動停止）
- [X] T034 在 `src/webview/webviewManager.ts` 新增 `createTxtTestPanel()` 方法（建立新 WebviewPanel、載入 `txtTestPanel.html` 與 `txtTestPanel.js`、設定 message routing、dispose 時通知 TxtTestService）
- [X] T035 在 `TxtUploader` 和 `TxtTestService` 加入衝突防護：上傳前檢查 Test Panel 是否開啟（TxtDeviceState 為 Testing），若是則 Test Panel 進入 Paused 模式；程式執行結束後 Test Panel 恢復 Testing 模式
- [ ] T036 [P] 手動測試清單驗收（需 TXT 硬體）：Test Panel M1 滑桿拖動馬達轉動、I1 讀值 500ms 內更新、滑桿鬆手速度保持、關閉 Test Panel 馬達自動停止、Test Panel 開啟中點擊上傳進入暫停模式

**Checkpoint**：US3 完整可測試——Test Panel 即時 I/O 控制、衝突防護

---

## Phase 7: 收尾與品質確認

**目標**：確認所有 User Story 整合無衝突，現有功能不受影響（SC-007）

- [X] T037 執行完整測試套件 `npm test`，確認新增的 Unit Tests 全部通過，現有測試無回歸
- [X] T038 執行 `npm run validate:i18n`，最終確認 15 語系 TXT 鍵值 100% 覆蓋（SC-006）
- [X] T039 [P] 執行 `npm run compile && npm run lint`，確認 TypeScript 零錯誤、ESLint 零警告（SC-007）

---

## Bug 修復記錄（實作後審查）

以下三個問題在 Code Review 中發現，已於實作後修復：

- [X] T040 修復 `controls_whileUntil` 自動 delay 偵測 bug  
  **問題**：`hasTxtWaitBlock` 只掃描 DO 直接子積木（`getNextBlock` 頂層），漏掉放在 `if`/`for`/`while` 等巢狀結構內的 `txt_wait`；且完全未偵測 `controls_duration`（生成 `time.time()` 而非 `time.sleep`），導致使用者在 while 內有自訂 delay 時仍被插入額外 50ms  
  **修復**：以遞迴 `checkDelayInTree()` 取代頂層掃描，同時偵測 `txt_wait` 與 `controls_duration`；判斷條件補充 `!branch.includes('time.time()')`  
  **檔案**：`media/blockly/generators/txt/python_common.js`

- [X] T041 修復積木 i18n 鍵名不匹配問題  
  **問題**：`media/blockly/blocks/txt.js` 中使用了 `TXT_MOTOR_SPEED_PREFIX`、`TXT_MOTOR_FORWARD`、`TXT_MOTOR_BACKWARD`、`TXT_OUTPUT_ON`、`TXT_OUTPUT_OFF`、`TXT_INPUT_READ_PREFIX`、`TXT_WAIT_PREFIX`、`TXT_WAIT_SUFFIX`、`TXT_MOTOR_STOP_PREFIX` 等 key，但這些 key 不存在於任何語系的 `messages.js` 中，造成非 zh-hant 語系下（如英文）顯示中文 fallback 而非翻譯後的文字  
  **修復**：對應改為 messages 中實際存在的 key：`TXT_MOTOR_SPEED`、`TXT_MOTOR_SPEED_SET`、`TXT_DIRECTION_FORWARD`、`TXT_DIRECTION_BACKWARD`、`TXT_STATE_ON`、`TXT_STATE_OFF`、`TXT_OUTPUT`、`TXT_OUTPUT_SET`、`TXT_INPUT_READ`、`TXT_WAIT`、`TXT_WAIT_UNIT`、`TXT_MOTOR_STOP`；同步調整積木顯示佈局  
  **檔案**：`media/blockly/blocks/txt.js`

- [X] T042 修復 `txt_stop_all` FT Python API 最佳實踐  
  **問題**：生成器以 `for i in range(1, 5): txt.motor(i).setSpeed(0)` 的迴圈呼叫，每次呼叫 `txt.motor(i)` 都會建立新的 motor config 物件並累加 config_id，可能引發 CONFIG_IO 風暴，與其他馬達積木已使用預建 `_mN` 物件的慣例不一致  
  **修復**：改為呼叫 `addMotorPort(1-4)` 讓 `txt_main` 預建 `_m1~_m4`，然後直接用 `_m1.setSpeed(0)` ... `_m4.setSpeed(0)` 停止  
  **檔案**：`media/blockly/generators/txt/txt.js`

- [X] T043 修復 TXT generator 連續 statement 積木程式碼遺失問題（`scrub_` 缺失）  
  **問題**：Blockly 12 的 base `Generator.prototype.scrub_()` 實作只有 `return b`，**不追蹤 nextConnection**。Arduino 與 MicroPython generator 都有覆寫 `scrub_`，但 TXT generator 完全沒有，導致在一個 statement block 後面連接的所有 block（如 `txt_wait`、`txt_motor_stop` 等）產生的程式碼全部被靜默丟棄  
  **影響範圍**：任何需要兩個以上連續 statement 積木的工作區；例如 `txt_motor_speed` 後接 `txt_wait`，生成的 Python 只有 `_m1.setSpeed(...)` 而沒有 `time.sleep(...)`  
  **修復**：在 `media/blockly/generators/txt/index.js` 中加入 `scrub_()` 方法，遵循與 Arduino/MicroPython generator 相同的模式，追蹤 `block.nextConnection.targetBlock()` 並遞迴呼叫 `this.blockToCode(nextBlock)`  
  **檔案**：`media/blockly/generators/txt/index.js`

- [X] T044 修復超音波迴圈無節流問題（`checkDelayInTree` 過度遞迴）  
  **問題**：`controls_whileUntil` 的 `checkDelayInTree()` 深度遞迴進入 `if/else` 子分支，只要樹中**任何位置**有 `txt_wait` 就認為「已有 delay」，不補自動 50ms。但 `else` 分支的 delay 只在條件不成立時執行；`if` 分支（含超音波讀取）照樣無節流，CPU 全速運轉，可能搶佔 ftrobopy exchange thread（100 Hz）排程，造成感測器數值更新停滯  
  **修復**：將 `checkDelayInTree` 改為 `checkDelayInTopLevel`，只沿 `getNextBlock()` 掃描 while DO 的頂層連續積木序列，不進入 `if/else/for` 子分支。只有確實在頂層的 delay 才保證每次迴圈都執行到  
  **檔案**：`media/blockly/generators/txt/python_common.js`

- [X] T045 修復網路中斷後重連無法控制硬體問題（殘留 `main.py` 未清除）  
  **問題**：`upload()` 的前置清理只 `pkill -f io_server.py`（Test Panel 遺留），但沒有清理 `main.py`。當網路中斷時，TXT 的 SSH daemon 不一定會向 `main.py` 發送 SIGHUP（取決於 `sshd_config` 中 `ClientAliveInterval` 設定），殘留的 `main.py` 持續佔用 ftrobopy 序列埠。網路恢復後重新上傳，新的 `ftrobopy.ftrobopy('auto')` 因序列埠被佔用而連線失敗  
  **修復**：在上傳前的清理步驟改為 `if pkill -f main.py; then sleep 1; fi; if pkill -f io_server.py; then sleep 1; fi`，確保兩種殘留程序都被清除，並各等待 1s 讓序列埠完整釋放後再建立新連線  
  **檔案**：`src/services/txtUploader.ts`

- [X] T046 修復 `while True` 全域 `inputConfigs_` 污染造成內層迴圈誤插 `txt.updateWait()`，並改用官方推薦 API  
  **問題**：`controls_whileUntil` generator 原本用 `[...g.inputConfigs_.values()].some(cfg => cfg.type === 'ULTRASONIC')` 判斷是否含超音波。`inputConfigs_` 是整個工作區共用的 `Map`，在外層 `while True` 的 DO subtree 進行 `statementToCode` 時，`txt_input_sensor(ULTRASONIC)` generator 會向 `inputConfigs_` 登記 ULTRASONIC 項目。接著處理 `controls_if` 的 ELSE 分支時，內層 `while True` 的 generator 查詢全域 `inputConfigs_`，發現 ULTRASONIC 已存在（由外層 IF 分支留下），誤判「內層 while 也使用超音波」→ 錯誤插入 `txt.updateWait()`  
  **修復**：將全域查詢 `g.inputConfigs_.values()` 改為在 generator 內部定義 `hasUltrasonicInSubtree(b)` 函式，只遞迴掃描 `block.getInputTargetBlock('DO')` 的子積木樹（遍歷 inputList connections 與 nextConnection 鏈），完全不依賴全域狀態，每個 while 只看自己的 DO 子樹。同時將自動插入的語句由 `time.sleep(0.05)` 改為 `txt.updateWait()`（ftrobopy 官方推薦 API，精確對齊交換執行緒週期，CPU 使用率更低，且毋需額外 `import time`）  
  **檔案**：`media/blockly/generators/txt/python_common.js`

- [X] T047 依 ftrobopy 官方/社群最佳實踐修正 `updateWait` 放置邏輯  
  **問題**：官方原始碼顯示 `updateWait()` 是等待下一個 exchange cycle 的同步 API，並非超音波專用；官方範例在感測器/控制 loop 常使用 `time.sleep(0.02)` 節流，社群 issue #26 中作者則建議在高速控制 loop 內插入 `txt.updateWait(0.01)`。原本只偵測超音波會漏掉按鈕、搖桿、一般輸入、馬達/輸出控制等 TXT 硬體輪詢 loop，也無法處理硬體讀取出現在 while 條件式中的情況  
  **修復**：將自動插入條件改為偵測「目前 while 的條件式或本層 DO 子樹是否含 TXT 硬體積木」，而不是只看超音波。掃描時會跨 `if/else` 分支，但不穿透巢狀 loop 邊界（巢狀 loop 由其自身規則決定是否插入 pacing）；若該 while 沒有使用者自行放置的頂層 `txt_wait` / `controls_duration`，則在 loop 尾端自動插入 `txt.updateWait(0.01)`，對齊社群建議的 10ms 節奏  
  **檔案**：`media/blockly/generators/txt/python_common.js`

- [X] T048 升級 `updateWait` 為路徑敏感（path-sensitive）尾端插入規則  
  **問題**：T047 雖已從「超音波特例」升級為「TXT 硬體輪詢 loop」，但仍以整體存在性判斷是否插入尾端 `txt.updateWait(0.01)`。遇到 `if/else` 其中一條分支已有 `txt_wait`，另一條分支進入不會返回的內層 `while True` 時，外層 while 其實不存在「未節流且會走到 loop 尾端」的路徑，卻仍會多插一個外層 `updateWait`，生成碼可讀性不佳  
  **修復**：改以靜態路徑分析收集「未節流且可抵達目前 while 尾端」的狀態集合：會把 while 條件式的硬體讀取、`if/else` 各分支的條件與內容、頂層 delay、`break`/`continue`、以及「明確不返回」的內層 `while True`（無 `break`）一起納入分析。只有當存在至少一條 TXT 硬體存取路徑會真的落到 loop 尾端且此前沒有任何 pacing 時，才在尾端補 `txt.updateWait(0.01)`  
  **檔案**：`media/blockly/generators/txt/python_common.js`

---

## 依賴圖（User Story 完成順序）

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational：型別 + 積木)
    ├──→ Phase 3 (US2：連線設定)
    │         ↓
    │    Phase 4 (US1：上傳部署) ← 依賴 US2 連線設定
    │
    ├──→ Phase 5 (US4：積木 i18n + 孤立保護)  ← 可與 Phase 3/4 並行
    │
    └──→ Phase 6 (US3：Test Panel)             ← 依賴 US2 連線設定
              ↓
         Phase 7 (Polish)
```

**並行機會**：
- Phase 2：T007、T008、T009 可並行（不同檔案）
- Phase 3：T012（測試）、T014（HTML）可與 T011（Service）並行
- Phase 4：T018（測試）可與 T017（Service）並行
- Phase 5：T023（i18n）、T026（toolbox）可並行
- Phase 6：T029（測試）可與 T028 並行；T032（HTML）、T033（JS）可並行

---

## 實作策略

**MVP 範圍（建議先交付）**：Phase 1 + Phase 2 + Phase 3 (US2) + Phase 4 (US1) = T001-T022（22 個任務）

這讓學生可以：
1. 在工作區排列 TXT 積木
2. 設定 SSH 連線參數
3. 上傳程式並在 TXT 上執行

**後續交付**：Phase 5 (US4) + Phase 6 (US3) = T023-T036（補齊 i18n 和 Test Panel）

---

## 任務統計

| | |
|--|--|
| 總任務數 | 39 |
| Phase 1 Setup | 3 |
| Phase 2 Foundational | 7 |
| Phase 3 US2 | 6 |
| Phase 4 US1 | 6 |
| Phase 5 US4 | 4 |
| Phase 6 US3 | 10 |
| Phase 7 Polish | 3 |
| 可並行任務 | 17 |
| MVP 範圍（T001-T022） | 22 |
