# Feature Specification: CyberBrick MicroPython 積木支援

**Feature Branch**: `021-cyberbrick-micropython`  
**Created**: 2025-12-29  
**Updated**: 2025-12-30  
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

當使用者從其他主板切換到 CyberBrick（或從 CyberBrick 切換到其他主板）時，系統使用現有的 Ctrl+S 備份機制自動儲存當前工作區，然後清空工作區並更新工具箱（參考 Arduino Uno 與 ESP32 切換時隱藏部分工具箱選單的方法），隱藏生成 C++ 的積木，保留生成 Python 的積木。

**Why this priority**: 防止使用者意外丟失積木程式，但可以在核心功能完成後再實作。

**Independent Test**: 切換主板時確認工作區被自動備份（使用 backup_YYYYMMDD_HHMMSS 格式），工作區清空後工具箱正確切換。

**Acceptance Scenarios**:

1. **Given** 使用者有未儲存的積木程式，**When** 切換到不同語言的主板，**Then** 系統使用現有 Ctrl+S 備份機制自動儲存 main.json（格式：backup_YYYYMMDD_HHMMSS），然後顯示切換確認對話框
2. **Given** 使用者在確認對話框中，**When** 點擊「繼續」，**Then** 當前工作區被清空，工具箱更新為目標主板的積木選單（CyberBrick 顯示 Python 積木，Arduino 顯示 C++ 積木）
3. **Given** 使用者在確認對話框中，**When** 點擊「取消」，**Then** 維持原主板選擇，工作區不變
4. **Given** 使用者從 Arduino 切換到 CyberBrick，**When** 切換完成後，**Then** 工具箱隱藏所有 Arduino/C++ 專用積木，只顯示 MicroPython 積木
5. **Given** 使用者從 CyberBrick 切換到 Arduino，**When** 切換完成後，**Then** 工具箱隱藏所有 MicroPython 專用積木，只顯示 Arduino/C++ 積木

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

### User Story 6 - CyberBrick 主板選擇時自動清理 PlatformIO 設定 (Priority: P1)

當使用者選擇 CyberBrick 開發板時，系統自動檢查並刪除工作區中的 `platformio.ini` 檔案，避免與 MicroPython 上傳流程衝突。

**Why this priority**: PlatformIO 設定檔可能導致使用者混淆或上傳流程異常，必須在主板選擇時立即處理。

**Independent Test**: 選擇 CyberBrick 主板後，確認 `platformio.ini` 檔案被刪除（若存在）。

**Acceptance Scenarios**:

1. **Given** 工作區中存在 `platformio.ini` 檔案，**When** 使用者選擇 CyberBrick 主板，**Then** 系統自動刪除 `platformio.ini` 並記錄日誌 `[blockly] 已刪除 platformio.ini`
2. **Given** 工作區中不存在 `platformio.ini` 檔案，**When** 使用者選擇 CyberBrick 主板，**Then** 系統不進行任何檔案操作，繼續正常流程
3. **Given** 使用者從 CyberBrick 切換回 Arduino 主板，**When** 使用者首次生成程式碼，**Then** 系統重新建立 `platformio.ini`（現有行為不變）

---

### Edge Cases

-   **無法連接 CyberBrick**：顯示連線失敗訊息，提示檢查 USB 連線和 COM Port
-   **上傳中斷電**：顯示錯誤訊息，建議重新上傳
-   **備份空間不足**：警告使用者清理舊備份
-   **WiFi 連線失敗**：程式中加入錯誤處理，避免無限等待
-   **切換主板時備份失敗**：顯示錯誤但仍允許使用者選擇是否繼續切換
-   **platformio.ini 刪除失敗**：記錄錯誤日誌但不阻擋切換流程

## Requirements _(mandatory)_

### Functional Requirements

#### 主板配置

-   **FR-001**: 系統 MUST 在主板選單中提供 "CyberBrick" 選項
-   **FR-002**: 選擇 CyberBrick 主板時，系統 MUST 自動設定語言為 MicroPython
-   **FR-003**: 選擇 CyberBrick 主板時，系統 MUST 隱藏所有 Arduino/C++ 積木並顯示 MicroPython 積木
-   **FR-003a**: 選擇 CyberBrick 主板時，系統 MUST 自動檢查並刪除工作區中的 `platformio.ini` 檔案（若存在）

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
-   **FR-021**: 備份檔案名稱 MUST 包含時間戳記和主板資訊（使用現有 `backup_YYYYMMDD_HHMMSS` 命名格式）
-   **FR-022**: 系統 MUST 提供從備份還原的功能

#### 主板切換保護

-   **FR-023**: 切換到不同程式語言的主板時，系統 MUST 使用現有 Ctrl+S 備份機制自動儲存 main.json
-   **FR-023a**: 若工作區為空（無任何積木），系統 MUST 跳過確認對話框直接切換
-   **FR-024**: 使用者確認後，系統 MUST 清空工作區並更新工具箱（參考 `updateToolboxForBoard` 函數的實作模式）
-   **FR-025**: 工具箱切換 MUST 根據目標主板語言類型（arduino/micropython）隱藏不相容的積木分類

#### 工具箱與 i18n

-   **FR-026**: CyberBrick 專用工具箱分類 MUST 使用統一的翻譯鍵格式：`CATEGORY_CYBERBRICK_*`（例如：`CATEGORY_CYBERBRICK_LED`、`CATEGORY_CYBERBRICK_GPIO`）
-   **FR-026a**: MicroPython 通用積木分類（邏輯、迴圈、變數、數學、文字）MUST 共用 Arduino 的分類翻譯鍵
-   **FR-027**: 所有 CyberBrick 專用積木 MUST 使用 `CYBERBRICK_*` 前綴的翻譯鍵（例如：`CYBERBRICK_LED_SET_COLOR`）

#### 日誌記錄

-   **FR-028**: 所有 CyberBrick 相關的日誌訊息 MUST 使用 `[blockly]` 標籤前綴，方便除錯追蹤
-   **FR-029**: 日誌 MUST 記錄關鍵操作：主板切換、工具箱更新、platformio.ini 刪除、上傳開始/完成/失敗

#### UI/UX 設計

-   **FR-030**: 上傳按鈕 MUST 與積木編輯器右上方現有按鈕（主題切換、備份、重新整理）保持一致的視覺樣式
-   **FR-031**: 上傳按鈕 MUST 位於控制區域，與其他功能按鈕排列整齊
-   **FR-032**: 上傳按鈕 MUST 只在選擇 CyberBrick 主板時顯示，其他主板時隱藏
-   **FR-032a**: 上傳進行中時，上傳按鈕 MUST 禁用並顯示圖示旋轉動畫（同重新整理按鈕）
-   **FR-032b**: 上傳成功/失敗時 MUST 使用 Toast 通知顯示結果（同 Ctrl+S 備份通知樣式）

#### 實作流程（開發優先級）

-   **FR-033**: 實作順序 MUST 遵循：(1) UI/UX 互動正確性驗證（工具箱切換、上傳按鈕顯示/隱藏）→ (2) 程式碼生成功能 → (3) 上傳按鈕內部功能

### Key Entities

-   **Board Configuration**: 主板設定，包含名稱、語言類型(arduino/micropython)、上傳方式、GPIO 對應表、工具箱路徑
-   **Workspace Backup**: 工作區備份，包含 JSON 格式的積木狀態、時間戳記（`backup_YYYYMMDD_HHMMSS` 格式）、來源主板類型
-   **Device Backup**: 裝置備份，包含從 CyberBrick 讀取的原始程式檔案、時間戳記
-   **Upload Button**: 上傳按鈕元件，樣式與現有控制區按鈕一致，僅在 CyberBrick 主板時可見

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者可在 30 秒內完成從選擇主板到上傳第一個程式的流程
-   **SC-002**: 上傳程式到 CyberBrick 的整體時間（含中斷+傳輸+重啟）不超過 10 秒
-   **SC-003**: 100% 的核心積木（LED、GPIO、WiFi、時序）在拖拉後能正確生成可執行的 MicroPython 程式碼
-   **SC-004**: 首次上傳時 100% 成功建立裝置程式備份（若裝置有原程式）
-   **SC-005**: 主板切換時 100% 自動觸發備份（使用現有 Ctrl+S 機制），並在確認後正確切換工具箱
-   **SC-006**: 生成的 MicroPython 程式碼可直接在 CyberBrick REPL 中貼上執行，無需修改
-   **SC-007**: 所有 CyberBrick 相關日誌訊息 100% 包含 `[blockly]` 標籤
-   **SC-008**: 上傳按鈕與現有控制區按鈕（主題切換、備份、重新整理）視覺外觀一致（相同 CSS 類別、尺寸、hover 效果）
-   **SC-009**: 選擇 CyberBrick 主板時，100% 檢測並刪除 `platformio.ini`（若存在）

### Non-Functional Requirements

-   **NFR-001**: 程式碼生成 SHOULD 在 1 秒內完成（測量條件：≤100 個區塊的工作區，標準開發環境 i5 等級 CPU、8GB RAM）
-   **NFR-002**: 上傳服務單元測試覆蓋率 SHOULD ≥80%
-   **NFR-003**: mpremote 安裝失敗時，系統 MUST 顯示明確的錯誤訊息並提供手動安裝指引
-   **NFR-004**: 上傳失敗時，系統 MUST 顯示包含失敗階段和具體錯誤的診斷訊息

## Assumptions

-   PlatformIO 已安裝且其 Python 環境可被存取（`~/.platformio/penv/`）
-   mpremote 套件若未安裝，系統將自動嘗試安裝
-   CyberBrick 使用標準 USB CDC 驅動程式，可被系統識別為 COM Port
-   CyberBrick 使用 ESP32-C3 預設 VID/PID (VID: 0x303A, PID: 0x1001)
-   CyberBrick 的 `/app/rc_main.py` 是開機自動執行的程式入口點
-   藍牙功能已被官方禁用，不提供相關積木
-   現有的 `quickSaveManager.performQuickSave()` 方法可被主板切換流程重用
-   現有的 `updateToolboxForBoard()` 函數可被擴展以支援 MicroPython 工具箱切換
-   現有的按鈕 CSS 樣式（`.controls-container button`）可直接套用到上傳按鈕
-   現有的 Toast 通知元件可被上傳功能重用

## Clarifications

### Session 2025-12-29

-   Q: mpremote 工具不存在時的處理策略？ → A: 自動嘗試安裝 mpremote（使用 PlatformIO 的 pip），成功後繼續上傳流程
-   Q: COM Port 選擇方式？ → A: 自動偵測 CyberBrick（VID/PID）+ 記住上次使用的 Port，多裝置時顯示選單
-   Q: 上傳失敗時的重試策略？ → A: 自動重試一次（含重新 reset 序列），若仍失敗則顯示錯誤並提供手動重試選項
-   Q: 備份檔案的保留策略？ → A: 不自動清理，讓使用者手動管理備份（僅在空間不足時提醒）
-   Q: MicroPython 積木的視覺區分？ → A: 無需特別區分，選擇 CyberBrick 後工具箱完全切換為 MicroPython 積木，不會與 Arduino 積木共存

### Session 2025-12-30 (更新)

-   Q: CyberBrick 的 USB VID/PID 值為何？ → A: 使用 ESP32-C3 預設 VID/PID (VID: 0x303A, PID: 0x1001)
-   Q: 主板切換時，若工作區為空是否顯示確認對話框？ → A: 跳過對話框，直接切換（流暢度優先，與 Ctrl+S 空工作區跳過備份一致）
-   Q: 上傳按鈕在上傳進行中時應如何顯示狀態？ → A: 按鈕禁用 + 圖示旋轉動畫（同重新整理按鈕），維持 UI 一致性
-   Q: MicroPython 通用積木是否共用 Arduino 的分類結構？ → A: 共用相同分類結構（邏輯、迴圈、變數等使用相同翻譯鍵），僅 CyberBrick 專用積木使用 `CATEGORY_CYBERBRICK_*` 前綴
-   Q: 上傳成功/失敗時的通知方式為何？ → A: Toast 通知（同 Ctrl+S 備份成功/失敗通知），維持 UI 風格統一
-   Q: 主板切換時如何備份？ → A: 使用現有 Ctrl+S 快速備份機制（`quickSaveManager.performQuickSave()`），命名格式為 `backup_YYYYMMDD_HHMMSS`
-   Q: 工具箱切換的參考實作？ → A: 參考 `updateToolboxForBoard()` 函數（在 `blocklyEdit.js` 約 2275 行），此函數已實作 Arduino Uno 與 ESP32 切換時隱藏部分工具箱選單的邏輯
-   Q: 日誌標籤格式？ → A: 所有相關日誌使用 `[blockly]` 前綴，例如：`console.log('[blockly] 已切換至 CyberBrick 主板')`
-   Q: CyberBrick 工具箱翻譯鍵格式？ → A: 統一使用 `CATEGORY_CYBERBRICK_*` 和 `CYBERBRICK_*` 前綴，確保與現有翻譯鍵命名規範一致
-   Q: 上傳按鈕樣式如何保持一致？ → A: 使用與現有控制區按鈕相同的 CSS 類別和結構，參考主題切換、備份、重新整理按鈕的實作
-   Q: 選擇 CyberBrick 時為何要刪除 platformio.ini？ → A: 避免使用者混淆，CyberBrick 使用 MicroPython 和 mpremote 上傳，與 PlatformIO 流程完全獨立
-   Q: 實作順序優先級？ → A: 先確保 UI/UX 互動正確（工具箱切換、上傳按鈕顯示/隱藏），再實作程式碼生成，最後實作上傳功能內部邏輯

## Out of Scope (Phase 2+)

-   X11 遙控接收板積木（Servo S1-S4、Motor M1-M2、LED D1-D2）
-   X12 遙控發射板積木（類比 L1-L3/R1-R3、按鈕 K1-K4）
-   RC 模組積木（`rc_slave_init/data`、`rc_master_init/data`）
-   HTTP GET/POST 積木
-   I2C/SPI 通訊積木
-   深度睡眠積木
