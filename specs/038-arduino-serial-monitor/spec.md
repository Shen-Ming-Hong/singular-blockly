# Feature Specification: Arduino Serial Monitor 整合

**Feature Branch**: `038-arduino-serial-monitor`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "為 Arduino/C++ 開發板添加 Serial Monitor，使用 PlatformIO CLI 的 pio device monitor 命令，與現有 CyberBrick MicroPython 終端機 UI 保持一致"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 開啟 Arduino Serial Monitor 查看輸出 (Priority: P1)

作為 Arduino 開發者，我想要在編輯器內直接開啟 Serial Monitor 來查看開發板的序列輸出，以便在不離開開發環境的情況下進行除錯和觀察程式行為。

**Why this priority**: 這是 Serial Monitor 的核心功能，沒有此功能用戶無法使用任何監控相關操作。

**Independent Test**: 使用者選擇 Arduino 開發板（如 ESP32、Arduino UNO），點擊 Monitor 按鈕，看到 VS Code 終端機顯示序列輸出。

**Acceptance Scenarios**:

1. **Given** 用戶已選擇 Arduino 系列開發板（arduino 語言），**When** 用戶點擊 Monitor 按鈕，**Then** 系統開啟終端機並顯示序列輸出
2. **Given** Monitor 已開啟，**When** 開發板發送 Serial.println() 資料，**Then** 終端機即時顯示輸出內容
3. **Given** Monitor 按鈕顯示中，**When** 用戶懸停按鈕，**Then** 顯示「開啟 Serial Monitor」或「關閉 Serial Monitor」的提示文字

---

### User Story 2 - 關閉 Serial Monitor 釋放連接埠 (Priority: P1)

作為 Arduino 開發者，我想要能夠關閉 Serial Monitor 來釋放 COM 連接埠，以便進行程式上傳或讓其他應用程式使用該連接埠。

**Why this priority**: Monitor 開啟時會佔用 COM 埠，若無法關閉將阻擋程式上傳，與核心上傳功能同等重要。

**Independent Test**: 使用者在 Monitor 運行時點擊 Monitor 按鈕，終端機關閉且 COM 埠被釋放。

**Acceptance Scenarios**:

1. **Given** Serial Monitor 正在運行，**When** 用戶點擊 Monitor 按鈕，**Then** 終端機關閉，Monitor 狀態指示器切換為「已停止」
2. **Given** Serial Monitor 正在運行，**When** 用戶手動關閉終端機視窗，**Then** WebView 的 Monitor 按鈕狀態自動同步為「已停止」

---

### User Story 3 - 上傳時自動管理 Monitor 狀態 (Priority: P1)

作為 Arduino 開發者，我想要在點擊上傳按鈕時系統自動處理 Serial Monitor 的開關，以避免因 COM 埠被佔用導致上傳失敗，並在上傳成功後自動恢復我原本的 Monitor 狀態。

**Why this priority**: 手動關閉再開啟 Monitor 是常見的用戶痛點，自動化此流程可大幅提升開發體驗。

**Independent Test**: 在 Monitor 開啟狀態下點擊上傳，觀察上傳成功後 Monitor 是否自動重新開啟。

**Acceptance Scenarios**:

1. **Given** Serial Monitor 正在運行，**When** 用戶點擊上傳按鈕，**Then** 系統自動關閉 Monitor、執行上傳，上傳成功後自動重新開啟 Monitor
2. **Given** Serial Monitor 未運行，**When** 用戶點擊上傳按鈕並上傳成功，**Then** 上傳完成後 Monitor 保持關閉狀態
3. **Given** Serial Monitor 正在運行，**When** 用戶點擊上傳按鈕但上傳失敗，**Then** Monitor 不會自動重新開啟（避免遮蓋錯誤訊息）

---

### User Story 4 - 自動偵測 Baud Rate (Priority: P2)

作為 Arduino 開發者，我想要系統自動從專案設定讀取正確的 Baud Rate，以避免因 Baud Rate 不符導致顯示亂碼。

**Why this priority**: 錯誤的 Baud Rate 會導致無法閱讀的亂碼輸出，影響除錯效率，但有合理的預設值作為備援。

**Independent Test**: 在 platformio.ini 設定 `monitor_speed = 9600`，開啟 Monitor 確認使用正確速率。

**Acceptance Scenarios**:

1. **Given** platformio.ini 包含 `monitor_speed = 115200`，**When** 用戶開啟 Serial Monitor，**Then** 終端機使用 115200 Baud Rate 連接
2. **Given** platformio.ini 未設定 monitor_speed，**When** 用戶開啟 Serial Monitor，**Then** 終端機使用預設 9600 Baud Rate 連接（與積木 Serial.begin(9600) 一致）

---

### User Story 5 - ESP32 錯誤訊息自動解碼 (Priority: P2)

作為 ESP32 開發者，我想要當程式崩潰時自動解碼錯誤訊息（Exception Stack Trace），以便更快定位問題。

**Why this priority**: ESP32 的原始崩潰訊息是記憶體位址，人工難以閱讀，自動解碼可大幅縮短除錯時間。

**Independent Test**: 讓 ESP32 程式故意崩潰，觀察 Monitor 是否顯示可讀的函式名稱和行號。

**Acceptance Scenarios**:

1. **Given** 用戶使用 ESP32 系列開發板，**When** 用戶開啟 Serial Monitor，**Then** 系統自動啟用 exception decoder filter
2. **Given** ESP32 程式崩潰產生 backtrace，**When** Monitor 接收到崩潰訊息，**Then** 顯示解碼後的函式名稱和行號（而非原始記憶體位址）

---

### User Story 6 - UI 與 MicroPython 終端機一致 (Priority: P2)

作為在 Arduino 與 MicroPython 之間切換的開發者，我想要看到一致的 Monitor 按鈕和操作體驗，以減少學習成本。

**Why this priority**: UI 一致性提升用戶體驗，降低混淆，但非功能必要。

**Independent Test**: 切換不同開發板，確認 Monitor 按鈕外觀和狀態指示保持一致。

**Acceptance Scenarios**:

1. **Given** 用戶選擇 Arduino 或 MicroPython 開發板，**When** 進入編輯器，**Then** Monitor 按鈕位置、圖示、樣式完全相同
2. **Given** Monitor 按鈕已顯示，**When** 切換開發板語言類型，**Then** Monitor 按鈕保持可見（不因語言類型隱藏或顯示）

---

### Edge Cases

- **連接埠被其他應用程式佔用**：系統顯示錯誤訊息，提示用戶關閉佔用連接埠的應用程式或檢查連線
- **開發板未連接或無法偵測**：顯示「找不到裝置」錯誤訊息，建議用戶檢查 USB 連線和驅動程式
- **上傳過程中用戶嘗試開啟 Monitor**：阻擋操作並顯示「正在上傳中，請稍候」訊息
- **終端機意外關閉**：WebView 狀態自動同步，按鈕回到「開啟」狀態
- **platformio.ini 格式錯誤導致無法解析 monitor_speed**：忽略錯誤並使用預設 115200

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統 MUST 為所有 Arduino 語言開發板顯示 Monitor 按鈕
- **FR-002**: 系統 MUST 使用 PlatformIO CLI (`pio device monitor`) 作為底層 Serial Monitor 工具
- **FR-003**: 系統 MUST 自動從 platformio.ini 讀取 `monitor_speed` 設定，若不存在則使用預設值 115200
- **FR-004**: 系統 MUST 為 ESP32 系列開發板自動啟用 `esp32_exception_decoder` filter
- **FR-005**: 用戶 MUST 能夠通過點擊 Monitor 按鈕開啟和關閉 Serial Monitor
- **FR-006**: 系統 MUST 在程式上傳前自動關閉 Serial Monitor 並記錄其開啟狀態
- **FR-007**: 系統 MUST 在程式上傳成功後，根據上傳前的 Monitor 狀態決定是否自動重新開啟
- **FR-008**: 系統 MUST 在程式上傳失敗時保持 Monitor 關閉狀態
- **FR-009**: 系統 MUST 在終端機被手動關閉時同步更新 WebView 的 Monitor 按鈕狀態
- **FR-010**: 系統 MUST 與現有 MicroPython 終端機使用相同的按鈕圖示、位置和樣式
- **FR-011**: 系統 MUST 支援現有的 15 種語言 i18n 顯示

### Key Entities

- **ArduinoMonitorService**: 管理 Arduino Serial Monitor 生命週期的服務，包含開啟、關閉、狀態追蹤
- **Monitor 狀態**: 記錄 Monitor 是否正在運行、使用的連接埠、上傳前是否開啟
- **platformio.ini 設定**: 包含 monitor_speed 等監控相關設定的專案檔案

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者可在 3 秒內成功開啟或關閉 Serial Monitor
- **SC-002**: 上傳流程中的 Monitor 自動關閉與重啟總耗時增加不超過 1 秒
- **SC-003**: 所有 Arduino 語言開發板都能看到並使用 Monitor 按鈕
- **SC-004**: ESP32 開發板崩潰時，Monitor 輸出包含函式名稱和原始碼行號（驗證方式：觸發測試崩潰，確認輸出含 `at <function_name> (<file>:<line>)` 格式）
- **SC-005**: Monitor 按鈕與 MicroPython 版本在視覺上無法區分（相同圖示、位置、樣式）
- **SC-006**: 15 種語言的 Monitor 相關訊息都有正確翻譯

## Assumptions

- PlatformIO Core CLI 已正確安裝且可透過命令列執行 `pio device monitor`
- 用戶的專案目錄包含有效的 platformio.ini 檔案
- ESP32 exception decoder 需要專案已編譯（.elf 檔案存在）才能正常運作
- 現有的 Monitor 按鈕 i18n 鍵值可複用於 Arduino，無需新增專用鍵值
