# Feature Specification: CyberBrick MicroPython 積木支援

**Feature Branch**: `021-cyberbrick-micropython`  
**Created**: 2025-12-29  
**Status**: Draft  
**Input**: User description: "為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援，使用 MicroPython 語言與 mpremote 工具實現一鍵上傳，避免手動 Ctrl-C 中斷操作"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 選擇 CyberBrick 主板並使用積木編程 (Priority: P1)

使用者在 SingularBlockly 中選擇 CyberBrick 主板後，工具箱自動切換為 MicroPython 積木（隱藏 Arduino/C++ 積木），可以使用核心板功能（板載 LED、GPIO、WiFi、時序控制等）進行視覺化編程。

**Why this priority**: 這是整個功能的核心基礎，沒有主板選擇和積木切換，其他功能都無法運作。

**Independent Test**: 選擇 CyberBrick 主板後，確認工具箱顯示 MicroPython 積木，拖拉積木後能生成正確的 MicroPython 程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者開啟 SingularBlockly，**When** 從主板選單選擇 "CyberBrick"，**Then** 工具箱切換為 CyberBrick MicroPython 積木選單
2. **Given** 使用者已選擇 CyberBrick 主板，**When** 拖拉「設定板載 LED 顏色」積木並設定 RGB 值，**Then** 程式碼區域顯示對應的 MicroPython 程式碼
3. **Given** 使用者已選擇 CyberBrick 主板，**When** 查看工具箱，**Then** 看不到任何 Arduino/C++ 專用積木

---

### User Story 2 - 一鍵上傳程式到 CyberBrick (Priority: P1)

使用者完成積木編程後，點擊「上傳」按鈕即可將 MicroPython 程式上傳到 CyberBrick 硬體，無需手動中斷（Ctrl-C）裝置上正在執行的程式。

**Why this priority**: 上傳功能是硬體開發的必要流程，與主板選擇同等重要。

**Independent Test**: 連接 CyberBrick 硬體，編寫簡單程式後點擊上傳，確認程式成功寫入並執行。

**Acceptance Scenarios**:

1. **Given** 使用者已連接 CyberBrick 且編寫了積木程式，**When** 點擊「上傳」按鈕，**Then** 系統自動中斷裝置上執行中的程式並上傳新程式
2. **Given** 上傳過程中，**When** mpremote 執行 reset + soft-reset 序列，**Then** 使用者無需手動操作即可完成上傳
3. **Given** 上傳完成後，**When** CyberBrick 重啟，**Then** 新上傳的程式自動執行

---

### User Story 3 - 自動備份原有程式 (Priority: P2)

首次上傳前，系統自動讀取 CyberBrick 中現有的 `/app/rc_main.py` 並備份到工作區，避免使用者意外覆蓋原廠程式。

**Why this priority**: 保護使用者資料很重要，但可以在基本上傳功能完成後再實作。

**Independent Test**: 首次上傳時確認備份檔案被建立在工作區的 `blockly/backups/` 目錄。

**Acceptance Scenarios**:

1. **Given** CyberBrick 內有 `/app/rc_main.py` 檔案，**When** 使用者首次執行上傳，**Then** 系統先將該檔案備份到 `blockly/backups/{timestamp}_rc_main.py`
2. **Given** 備份已存在，**When** 使用者再次上傳，**Then** 不重複備份相同內容
3. **Given** 使用者想還原原廠程式，**When** 從備份選單選擇還原，**Then** 備份的 `rc_main.py` 被寫回 CyberBrick

---

### User Story 4 - 主板切換時的工作區保護 (Priority: P2)

當使用者從其他主板切換到 CyberBrick（或從 CyberBrick 切換到其他主板）時，系統提示工作區將被清空，並在使用者確認後自動備份當前工作區。

**Why this priority**: 防止使用者意外丟失積木程式，但可以在核心功能完成後再實作。

**Independent Test**: 切換主板時確認出現警告對話框，確認後備份被建立且工作區被清空。

**Acceptance Scenarios**:

1. **Given** 使用者有未儲存的積木程式，**When** 切換到不同語言的主板，**Then** 顯示警告對話框說明工作區將被清空
2. **Given** 使用者在警告對話框中，**When** 點擊「繼續」，**Then** 當前工作區被備份到 `blockly/backups/` 並記錄原主板資訊，然後清空工作區
3. **Given** 使用者在警告對話框中，**When** 點擊「取消」，**Then** 維持原主板選擇，工作區不變

---

### User Story 5 - WiFi 連線功能 (Priority: P3)

使用者可以使用 WiFi 積木讓 CyberBrick 連接無線網路，並確認連線狀態。

**Why this priority**: 網路功能是進階應用，核心 GPIO/LED 功能優先。

**Independent Test**: 使用 WiFi 連線積木連接網路後，確認連線狀態積木回傳成功。

**Acceptance Scenarios**:

1. **Given** 使用者拖拉「WiFi 連線」積木，**When** 設定 SSID 和密碼並上傳執行，**Then** CyberBrick 成功連接到指定 WiFi
2. **Given** CyberBrick 已連接 WiFi，**When** 使用「WiFi 已連線？」積木，**Then** 回傳 True
3. **Given** CyberBrick 已連接 WiFi，**When** 使用「取得 IP 位址」積木，**Then** 回傳有效的 IP 位址字串

---

### Edge Cases

-   **無法連接 CyberBrick**：顯示連線失敗訊息，提示檢查 USB 連線和 COM Port
-   **上傳中斷電**：顯示錯誤訊息，建議重新上傳
-   **備份空間不足**：警告使用者清理舊備份
-   **WiFi 連線失敗**：程式中加入錯誤處理，避免無限等待
-   **切換主板時備份失敗**：顯示錯誤但仍允許使用者選擇是否繼續切換

## Requirements _(mandatory)_

### Functional Requirements

#### 主板配置

-   **FR-001**: 系統 MUST 在主板選單中提供 "CyberBrick" 選項
-   **FR-002**: 選擇 CyberBrick 主板時，系統 MUST 自動設定語言為 MicroPython
-   **FR-003**: 選擇 CyberBrick 主板時，系統 MUST 隱藏所有 Arduino/C++ 積木並顯示 MicroPython 積木

#### MicroPython 程式碼生成

-   **FR-004**: 系統 MUST 提供 MicroPython 程式碼生成器
-   **FR-005**: 生成的程式碼 MUST 包含必要的 import 語句
-   **FR-006**: 生成的程式碼 MUST 可直接在 CyberBrick 上執行

#### 核心積木功能

-   **FR-007**: 系統 MUST 提供板載 RGB LED 控制積木（GPIO 8, 1 顆 WS2812）
-   **FR-008**: 系統 MUST 提供 GPIO 數位讀取/寫入積木（GPIO 0-7, 9-10）
-   **FR-009**: 系統 MUST 提供 PWM 輸出積木
-   **FR-010**: 系統 MUST 提供類比讀取積木（ADC）
-   **FR-011**: 系統 MUST 提供時序控制積木（延時毫秒/秒）
-   **FR-012**: 系統 MUST 提供 WiFi 連線/斷線/狀態檢查/取得 IP 積木
-   **FR-013**: 系統 MUST 提供 UART 讀寫積木（R0/T0）
-   **FR-014**: 系統 MUST 提供標準邏輯/迴圈/變數/數學/文字積木的 MicroPython 版本

#### 上傳功能

-   **FR-015**: 系統 MUST 使用 mpremote 工具上傳程式
-   **FR-016**: 上傳前系統 MUST 執行 reset + soft-reset 序列以中斷執行中的程式
-   **FR-017**: 程式 MUST 被上傳到 `/app/rc_main.py` 路徑
-   **FR-018**: 上傳完成後系統 MUST 執行 reset 讓新程式開始執行

#### 備份功能

-   **FR-019**: 首次上傳前，系統 MUST 嘗試讀取並備份現有的 `/app/rc_main.py`
-   **FR-020**: 備份 MUST 儲存到工作區 `blockly/backups/` 目錄
-   **FR-021**: 備份檔案名稱 MUST 包含時間戳記和主板資訊
-   **FR-022**: 系統 MUST 提供從備份還原的功能

#### 主板切換保護

-   **FR-023**: 切換到不同程式語言的主板時，系統 MUST 顯示警告對話框
-   **FR-024**: 使用者確認後，系統 MUST 備份當前工作區再清空
-   **FR-025**: 備份 MUST 記錄原本的主板類型以便識別

### Key Entities

-   **Board Configuration**: 主板設定，包含名稱、語言類型(arduino/micropython)、上傳方式、GPIO 對應表
-   **Workspace Backup**: 工作區備份，包含 JSON 格式的積木狀態、時間戳記、來源主板類型
-   **Device Backup**: 裝置備份，包含從 CyberBrick 讀取的原始程式檔案、時間戳記

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者可在 30 秒內完成從選擇主板到上傳第一個程式的流程
-   **SC-002**: 上傳程式到 CyberBrick 的整體時間（含中斷+傳輸+重啟）不超過 10 秒
-   **SC-003**: 100% 的核心積木（LED、GPIO、WiFi、時序）在拖拉後能正確生成可執行的 MicroPython 程式碼
-   **SC-004**: 首次上傳時 100% 成功建立裝置程式備份（若裝置有原程式）
-   **SC-005**: 主板切換時 100% 顯示警告對話框並在確認後建立工作區備份
-   **SC-006**: 生成的 MicroPython 程式碼可直接在 CyberBrick REPL 中貼上執行，無需修改

## Assumptions

-   PlatformIO 已安裝且其 Python 環境可被存取（`~/.platformio/penv/`）
-   mpremote 套件若未安裝，系統將自動嘗試安裝
-   CyberBrick 使用標準 USB CDC 驅動程式，可被系統識別為 COM Port
-   CyberBrick 的 `/app/rc_main.py` 是開機自動執行的程式入口點
-   藍牙功能已被官方禁用，不提供相關積木

## Clarifications

### Session 2025-12-29

-   Q: mpremote 工具不存在時的處理策略？ → A: 自動嘗試安裝 mpremote（使用 PlatformIO 的 pip），成功後繼續上傳流程
-   Q: COM Port 選擇方式？ → A: 自動偵測 CyberBrick（VID/PID）+ 記住上次使用的 Port，多裝置時顯示選單
-   Q: 上傳失敗時的重試策略？ → A: 自動重試一次（含重新 reset 序列），若仍失敗則顯示錯誤並提供手動重試選項
-   Q: 備份檔案的保留策略？ → A: 不自動清理，讓使用者手動管理備份（僅在空間不足時提醒）
-   Q: MicroPython 積木的視覺區分？ → A: 無需特別區分，選擇 CyberBrick 後工具箱完全切換為 MicroPython 積木，不會與 Arduino 積木共存

## Out of Scope (Phase 2+)

-   X11 遙控接收板積木（Servo S1-S4、Motor M1-M2、LED D1-D2）
-   X12 遙控發射板積木（類比 L1-L3/R1-R3、按鈕 K1-K4）
-   RC 模組積木（`rc_slave_init/data`、`rc_master_init/data`）
-   HTTP GET/POST 積木
-   I2C/SPI 通訊積木
-   深度睡眠積木
