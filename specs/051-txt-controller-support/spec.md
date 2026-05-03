# Feature Specification: fischertechnik TXT Controller 支援

**Feature Branch**: `051-txt-controller-support`  
**Created**: 2026-05-03  
**Status**: Draft  
**Input**: User description: "讓 Singular Blockly 透過視覺化積木產生可在舊版 fischertechnik TXT Controller 上執行的控制程式，並支援類似 ROBO Pro 的即時 I/O 測試功能"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 積木生成 TXT Python 程式並部署執行 (Priority: P1)

學生在 Blockly 工作區中排列 TXT 控制積木（馬達速度、輸出、輸入、等待、全部停止），切換開發板至「TXT Controller」後，點擊上傳按鈕，程式自動透過網路傳送到 TXT，並在 TXT 上執行，VS Code 輸出面板顯示執行結果。

**Why this priority**: 這是整個功能的核心價值。若不能讓積木生成並執行到 TXT，其他功能都沒有意義。Program Mode 是 Singular Blockly 的基本使用模式。

**Independent Test**: 在 Blockly 工作區拖入「TXT 初始化」和「馬達 M1 設速」積木，點擊上傳，馬達轉動即視為通過。生成的 `main.py` 包含正確的 `ftrobopy` API 呼叫也可作為靜態驗證。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 TXT Controller 開發板，**When** 在工作區排列「TXT 初始化 + 馬達 M1 正轉」積木，**Then** 生成的 Python 程式包含 `import ftrobopy` 及 `txt.motor(1).setSpeed(speed)` 呼叫
2. **Given** 連線設定已填入有效的 TXT IP，**When** 使用者點擊「上傳」，**Then** 進度條顯示連線→上傳→執行三個階段，完成後 Output Channel 顯示執行成功
3. **Given** TXT 無法連線（IP 錯誤），**When** 使用者點擊「上傳」，**Then** 顯示明確的連線失敗錯誤訊息，不發生靜默失敗
4. **Given** 程式執行中，**When** 使用者點擊「停止」，**Then** TXT 上的 Python 程序被終止，所有馬達停止

---

### User Story 2 - 設定 TXT 連線參數 (Priority: P1)

教師或學生在首次使用前，在 **Blockly Editor WebView 內的連線設定區**（側欄或頂部）填入 TXT Controller 的 IP 位址、使用者名稱，並輸入密碼（安全儲存）。提供「測試連線」按鈕驗證設定是否正確，連線成功後設定持久保存於工作區。此設定 UI 與積木編輯器整合，使用者不需切換視窗。

**Why this priority**: 連線設定是 Program Mode 與 Test Mode 的前提條件，P1 與 User Story 1 並列。

**Independent Test**: 填入有效 TXT IP 和帳密，點擊「測試連線」，成功回應即視為通過。不需要實際上傳程式。

**Acceptance Scenarios**:

1. **Given** 使用者開啟連線設定面板，**When** 填入 host, username 後點擊儲存，**Then** host 和 username 儲存至工作區設定，密碼安全儲存（不寫入任何文字檔案）
2. **Given** 連線設定已填入，**When** 點擊「測試連線」，**Then** 5 秒內回報連線成功或失敗原因
3. **Given** 曾設定連線資訊，**When** 重新開啟 VS Code，**Then** 自動載入上次的連線設定（密碼除外需重新輸入，或由安全儲存自動填入）
4. **Given** 密碼錯誤，**When** 點擊「測試連線」，**Then** 顯示「驗證失敗，請確認密碼」而非原始錯誤堆疊

---

### User Story 3 - I/O 即時測試面板（替代 ROBO Pro Test） (Priority: P2)

學生在接線後，開啟 TXT I/O Test Panel，看到 M1-M4 馬達滑桿、O1-O8 輸出開關、I1-I8 輸入狀態即時更新。可手動控制馬達轉速和輸出，驗證接線正確再進 Blockly 編程。面板上有顯眼的「全部停止」按鈕。

**Why this priority**: 教學場景中，接線驗證是學生在開始撰寫程式前的必要步驟。沒有 Test Panel，學生無法區分接線錯誤和程式錯誤，大幅增加困擾。

**Independent Test**: 開啟 Test Panel，拖動馬達 M1 滑桿至 100，TXT 的 M1 馬達開始轉動即視為通過。不需要任何 Blockly 程式碼。

**Acceptance Scenarios**:

1. **Given** TXT 連線已設定，**When** 執行「開啟 TXT Test Panel」命令，**Then** 獨立視窗顯示 M1-M4 馬達控制、O1-O8 輸出開關、I1-I8 輸入讀值
2. **Given** Test Panel 已開啟，**When** 感測器 I1 有物體通過，**Then** I1 的讀值在 500ms 內更新顯示
3. **Given** 馬達正在運轉，**When** 點擊「全部停止」，**Then** 所有馬達立即停止，所有輸出關閉
4. **Given** Test Panel 開啟中，**When** 程式上傳並執行，**Then** Test Panel 自動進入「程式執行中」暫停模式，避免衝突；程式結束後恢復 Test 模式
5. **Given** Test Panel 與程式執行發生衝突，**When** 任一情況發生，**Then** 系統顯示明確的狀態提示，不允許同時從兩個來源控制硬體

---

### User Story 4 - 最小積木集完整覆蓋 TXT 基本控制 (Priority: P2)

學生在工作區可找到完整的 TXT 積木類別，包含：TXT 初始化、設定馬達速度（M1-M4）、停止馬達、設定輸出狀態（O1-O8）、讀取輸入（I1-I8）、等待指定毫秒、全部停止。所有積木在 15 種語言介面下均有正確翻譯。

**Why this priority**: 積木集必須足以讓學生完成有意義的控制程式（如：偵測感測器後控制馬達）。

**Independent Test**: 用 TXT 積木寫「按下 I1 後啟動 M1 轉動 3 秒再停止」的程式，生成的 Python 程式碼邏輯正確即視為通過。

**Acceptance Scenarios**:

1. **Given** 選擇 TXT Controller 開發板，**When** 開啟工具箱，**Then** 看到「TXT 控制器」積木類別，包含初始化、馬達、輸出、輸入、時間控制、安全停止積木
2. **Given** 使用繁體中文介面，**When** 查看 TXT 積木，**Then** 積木標籤正確顯示中文；切換其他語言亦同
3. **Given** TXT 積木放置於主程式區塊外，**When** 生成程式碼，**Then** 孤立積木被跳過並顯示警告，不影響其他正常積木

---

### Edge Cases

- 若 TXT 執行程式時掉線，上傳服務應偵測到連線中斷並回報錯誤，不無限等待
- Test Panel 的 HTTP polling 失敗超過 3 次連續時，應顯示連線中斷提示，並提供「重試」選項
- 若使用者在 Test Panel 開啟時直接關閉視窗，應自動發送全部停止命令後再關閉
- 生成的 Python 程式若語法正確但 ftrobopy 呼叫失敗（如埠號不符），stdout/stderr 應完整顯示在 VS Code Output Channel
- 積木工作區為空（僅有初始化積木）時，應能正常生成最小可執行程式，不崩潰

## Requirements *(mandatory)*

### Functional Requirements

**Program Mode**

- **FR-001**: 系統 MUST 提供「TXT Controller」作為可選開發板，在積木編輯器的開發板下拉選單中顯示
- **FR-002**: 選擇 TXT Controller 後，工具箱 MUST 切換顯示 TXT 專屬積木類別（隱藏 Arduino/CyberBrick 專屬積木）
- **FR-003**: Blockly 工作區的積木 MUST 能生成語法正確、可在 ftrobopy 環境下執行的 Python 程式
- **FR-004**: 生成的 Python 程式 MUST 使用 ftrobopy 的標準 API：`ftrobopy.ftrobopy(host, port)` 建立連線，`motor(N).setSpeed(v)` 其中 v 為 -512~512（正數為正轉、負數為反轉、0 為停止），`input(N).state()` 回傳 0/1 數位狀態；Blockly 積木使用 0~512 速度 + 正/反轉選項，generator 將反轉轉成負數傳入
- **FR-005**: 系統 MUST 透過 SSH/SCP 將生成的 `main.py` 上傳至 TXT 的指定遠端路徑
- **FR-006**: 上傳成功後，系統 MUST 透過 SSH 在 TXT 上執行 `python3 main.py`
- **FR-007**: 執行期間的 stdout/stderr MUST 即時顯示在 VS Code Output Channel
- **FR-008**: 使用者 MUST 能中途停止執行中的遠端程式
- **FR-009**: 上傳與執行流程 MUST 顯示進度（連線中→上傳中→執行中→完成/失敗）

**連線設定**

- **FR-010**: 使用者 MUST 能在 **Blockly Editor WebView 內的連線設定區**設定 TXT 的 IP/hostname、SSH 使用者名稱（不需開啟獨立視窗）
- **FR-011**: 密碼 MUST 使用 VS Code 安全儲存機制（SecretStorage），不得寫入任何文字檔案或 settings.json
- **FR-012**: 系統 MUST 提供「測試連線」功能，在 5 秒內回報 SSH 連線成功或失敗原因
- **FR-013**: 連線設定（IP、使用者名稱）MUST 持久保存至工作區設定，跨 VS Code 重啟後仍有效；`singular-blockly.txt.host` 的預設值 MUST 為 `192.168.7.2`（對應 USB 網路介面固定 IP，使用者可覆寫）

**Test Mode**

- **FR-014**: 系統 MUST 提供獨立的 TXT I/O Test Panel（透過命令或按鈕開啟）
- **FR-015**: Test Panel MUST 顯示 M1-M4 馬達速度控制滑桿（範圍 0~512，ftrobopy 原始值，含正/反轉選擇；generator 將反轉轉成負數傳入 `setSpeed(-v)`）；**滑桿鬆手後保持最後速度**（對齊 ROBO Pro Test 行為），需手動歸零或按「全部停止」
- **FR-016**: Test Panel MUST 顯示 O1-O8 輸出狀態開關（開/關）
- **FR-017**: Test Panel MUST 顯示 I1-I8 輸入即時讀值，更新頻率不低於每 500ms 一次
- **FR-018**: Test Panel MUST 提供顯眼的「全部停止」按鈕，點擊後立即停止所有馬達和輸出
- **FR-019**: Test Panel MUST 在程式執行期間自動進入暫停模式，結束後恢復
- **FR-020**: Test Panel 關閉時 MUST 自動發送全部停止命令
- **FR-023**: 系統 MUST 提供「安裝 TXT Runtime」VS Code 命令，一次性將 `txt-runtime/io_server.py` 以 SCP 上傳至 TXT 並透過 SSH 在背景啟動，執行結果顯示於 Output Channel

**安全性**

- **FR-021**: Program Mode 與 Test Mode MUST NOT 同時對 TXT 發出控制命令，系統需明確管理裝置狀態（Idle / Testing / Running / Stopping）
- **FR-024**: `TxtDeviceState` 的 Running → Idle 轉換 MUST 由 `ssh.execCommand('python3 main.py')` Promise resolve 觸發（不使用 polling 或 timeout），exit code 非 0 時轉換至 Error 狀態

**i18n**

- **FR-022**: 所有 TXT 積木的標籤和說明 MUST 在 15 種語言（bg, cs, de, en, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant）中完整翻譯

### Key Entities *(include if feature involves data)*

- **TxtConnectionConfig**: TXT 裝置的連線參數（host/IP、username、remotePath、runtimePort）；IP 與 username 存於工作區設定，密碼存於 SecretStorage
- **TxtDeviceState**: TXT 裝置的目前狀態枚舉（Idle、Testing、Running、Stopping、Disconnected、Error）；防止 Program Mode 與 Test Mode 衝突
- **TxtIoSnapshot**: 某一時刻 TXT 的完整 I/O 狀態（M1-M4 速度、O1-O8 輸出、I1-I8 輸入）；由 Test Panel polling 取得
- **TxtUploadRequest**: 程式上傳請求（Python 程式碼、目標開發板、連線設定引用）
- **TxtBlock（最小積木集）**: `txt_init`、`txt_motor_speed`、`txt_motor_stop`、`txt_output`、`txt_input_read`、`txt_wait`、`txt_stop_all`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 從 Blockly 積木生成到 TXT 開始執行，全程不超過 30 秒（良好網路環境下）
- **SC-002**: 學生能在 5 分鐘內完成「接線驗證 → 確認硬體正常 → 編寫第一個積木程式 → 上傳執行」的完整流程，無需教師介入
- **SC-003**: Test Panel 的 I/O 讀值更新延遲不超過 500ms（HTTP polling 模式）
- **SC-004**: 連線失敗時，錯誤訊息明確到讓使用者知道是「IP 錯誤」、「密碼錯誤」還是「TXT 無回應」，不顯示技術性原始錯誤堆疊
- **SC-005**: 「全部停止」按鈕從點擊到 TXT 實際停止的時間不超過 1 秒
- **SC-006**: 所有 TXT 積木在 15 種語言下均有完整翻譯（`npm run validate:i18n` 通過，覆蓋率 100%）
- **SC-007**: 新增功能不影響現有 Arduino 和 CyberBrick 開發板的任何現有功能（現有測試套件全數通過）

## Clarifications

### Session 2026-05-03

- Q: 連線設定（IP、使用者名稱、密碼）的 UI 入口形式？ → A: 整合在 Blockly Editor WebView 內（側欄或頂部設定區）
- Q: I/O Test Server（`io_server.py`）的安裝與啟動方式？ → A: Extension 提供「安裝 TXT Runtime」命令，一次性上傳 server 腳本並遠端啟動（Option A）
- Q: Test Panel 馬達滑桿鬆手後行為？ → A: 保持最後速度，需手動歸零或按「全部停止」（Option B，對齊 ROBO Pro Test 行為）；速度範圍保持 ftrobopy 原始值 0~512，方向另設選項
- Q: TxtDeviceState 從 Running 切回 Idle 的觸發條件？ → A: `ssh.execCommand('python3 main.py')` Promise resolve 後即代表程式結束，exit code 作為成功/失敗判斷（Option A）

## Assumptions

- **目標硬體**：舊版 fischertechnik TXT Controller（非 TXT 4.0），運行 ftCommunity 社群韌體，SD 卡開機，不覆蓋原廠韌體
- **TXT 端環境**：ftCommunity firmware 已安裝；Python 3 可執行；ftrobopy 已安裝（`pip install ftrobopy`）；SSH 服務已啟用（ftCommunity 預設開啟）；**預設 SSH 帳號為 `ftc`**（ftCommunity 固定帳號，`singular-blockly.txt.username` 預設值應填入此值）
- **連線方式**：底層統一視為 IP + SSH 連線。**預設採用 USB 網路介面**（ftCommunity 韌體透過 USB CDC-ECM 在傳輸線上模擬乙太網路，TXT 端固定 IP `192.168.7.2`，Host 端為 `192.168.7.1`）；學生只需接上 USB 傳輸線即可連線，無需輸入任何設定。Wi-Fi 或有線 LAN 亦支援（使用者修改 host IP 設定即可）。USB 連線在 macOS/Linux 免驅動；Windows 10 1903+ 內建 CDC-ECM 驅動，一般教學環境免手動安裝。USB 自動掃描（mDNS/Bonjour 探索）屬後續版本範圍
- **TXT 4.0 不在範圍內**：TXT 4.0 使用完全不同的 API（ROBO Pro Coding），若未來支援需作為獨立 board 類型
- **I/O Test Server**：Test Panel 需要 TXT 端執行一個 Python HTTP server（`txt-runtime/io_server.py`）；Extension 提供「安裝 TXT Runtime」命令（VS Code Command Palette），一次性透過 SCP 上傳 server 腳本並以 SSH 在背景啟動，使用者首次使用前執行一次即可
- **BoardLanguage 擴展**：新增 `'txt'` 作為第三個 BoardLanguage，獨立於 `'arduino'` 和 `'micropython'`，因 ftrobopy API 與 MicroPython machine API 語意完全不同
- **SSH 函式庫**：使用 `node-ssh` npm 套件提供 SSH/SCP 功能；此為 extension 的新 npm dependency
- **積木集範圍**：第一版僅支援 M1-M4 馬達（速度 0~512，正/反轉）、O1-O8 輸出、I1-I8 **數位**輸入（state() 回傳 0 或 1）、等待、全部停止；encoder、類比感測器、counter、servo 馬達為後續版本
- **速度範圍**：ftrobopy `motor(N).setSpeed(v)` 已查證：v 為 -512~512（正數正轉、負數反轉、0 停止）；**無** `Motor.left`/`Motor.right` 常數參數。Blockly UI 採 0~512 + 方向選項，generator 將反轉時轉成 `-v` 傳入 `setSpeed()`
- **程式執行模式**：產生單一 `main.py`，透過 SSH 執行；不支援多檔案或模組化程式結構
