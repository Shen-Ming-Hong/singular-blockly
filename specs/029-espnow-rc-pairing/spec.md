# Feature Specification: CyberBrick ESP-NOW RC 自定義配對積木

**Feature Branch**: `029-espnow-rc-pairing`  
**Created**: 2026-01-15  
**Status**: Draft  
**Input**: User description: "CyberBrick ESP-NOW RC blocks with custom pairing mechanism using pair ID (1-255) and WiFi channel (1-11) to isolate different groups, replacing official broadcast mode to solve classroom multi-group interference issues"

## 背景與動機

CyberBrick 官方 `rc_module` 使用 ESP-NOW 廣播模式進行無線通訊，導致在教室等多組同時使用的環境中會產生訊號干擾。本功能透過自定義 ESP-NOW 配對機制，使用「配對 ID」(1-255) 搭配「WiFi 頻道」(1-11) 來隔離不同組別，讓每組遙控器與接收端可以獨立運作。

### 技術基礎

-   **發射端**：使用 `rc_module.rc_master_data()` 讀取 X12 擴展板感測器，透過自定義 ESP-NOW 發送
-   **接收端**：透過自定義 ESP-NOW 接收資料，存入全域變數供現有 `rc_get_joystick` 等積木讀取
-   **配對機制**：配對 ID 轉換為 MAC 地址格式 `b'\x02\x00\x00\x00\x00\x{ID}'`，搭配 WiFi 頻道隔離

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 基本遙控配對與操作 (Priority: P1)

學生在教室中使用 CyberBrick X12 遙控器控制遙控車。老師指定每組使用不同的配對 ID（如第一組用 1、第二組用 2），學生只需在發射端和接收端設定相同的配對 ID 即可完成配對，無需理解 MAC 地址等技術細節。

**Why this priority**: 這是最核心的使用情境，沒有此功能整個 RC 系統無法在多組環境使用。

**Independent Test**: 可透過兩台 CyberBrick Core 獨立測試 - 設定相同配對 ID 後，發射端搖桿操作應即時反映在接收端馬達控制。

**Acceptance Scenarios**:

1. **Given** 發射端已初始化配對 ID 為 42、頻道為 3，**When** 接收端以相同配對 ID 和頻道初始化，**Then** 兩端可建立連線並傳輸資料
2. **Given** 發射端配對 ID 為 42，**When** 接收端配對 ID 為 99，**Then** 兩端無法通訊，接收端維持安全預設值（搖桿中點、按鈕放開）
3. **Given** 發射端持續發送資料，**When** 使用者移動 X12 搖桿 L2，**Then** 接收端 `rc_get_joystick(L2)` 回傳值在 100ms 內反映變化

---

### User Story 2 - 等待配對視覺回饋 (Priority: P1)

接收端程式啟動後，在等待發射端連線時，板載 LED 會以藍色閃爍表示「等待配對中」。當成功接收到第一筆資料後，LED 停止閃爍（或變為穩定綠色），讓學生知道配對成功。

**Why this priority**: 視覺回饋對教學環境至關重要，學生需要即時知道設備狀態，與 P1 功能緊密相關。

**Independent Test**: 可獨立測試 - 接收端開機後 LED 開始閃爍，發射端開機並發送資料後 LED 狀態改變。

**Acceptance Scenarios**:

1. **Given** 接收端執行「等待配對」積木，**When** 尚未收到發射端資料，**Then** 板載 LED 以 500ms 間隔藍色閃爍
2. **Given** LED 正在閃爍等待中，**When** 成功接收到發射端資料，**Then** LED 停止閃爍並維持熄滅（或由使用者程式控制）
3. **Given** 設定等待超時為 30 秒，**When** 超過 30 秒仍未連線，**Then** 等待積木結束執行，程式繼續往下執行

---

### User Story 3 - 發射端手動發送控制 (Priority: P2)

發射端程式中，使用者將「發送資料」積木放在永遠執行迴圈內，自行控制發送頻率。這符合 Blockly 教學邏輯，讓學生理解程式流程，同時可在發送前加入自訂邏輯（如按鈕判斷、LED 顯示）。

**Why this priority**: 重要但非必須 - 即使只有基本配對功能，系統也能運作。此功能提供更好的教學體驗。

**Independent Test**: 可獨立測試 - 發射端在迴圈中每次執行「發送資料」時接收端應收到一筆更新。

**Acceptance Scenarios**:

1. **Given** 發射端已初始化，**When** 執行「發送資料」積木，**Then** 自動讀取 `rc_master_data()` 並透過 ESP-NOW 發送
2. **Given** 發射端在迴圈中，**When** 加入其他邏輯（如 X12 按鈕判斷），**Then** 不影響發送功能正常運作
3. **Given** X12 感測器資料為 `[1885, 1960, 1992, 2106, 1945, 2009, 1, 1, 0, 1]`，**When** 發送資料，**Then** 接收端收到相同的 10 元素資料

---

### User Story 4 - 斷線安全處理 (Priority: P2)

當發射端關閉或超出通訊範圍時，接收端的資料讀取積木應回傳安全預設值：搖桿值為 2048（中點，馬達停止）、按鈕值為 1（放開狀態）。這確保遙控車不會在失去訊號時失控。

**Why this priority**: 安全性功能，對實際使用很重要，但可在 P1 實現後再完善。

**Independent Test**: 可獨立測試 - 接收端連線後關閉發射端，驗證資料讀取回傳預設值。

**Acceptance Scenarios**:

1. **Given** 接收端已連線並接收資料，**When** 發射端關閉超過 500ms，**Then** `rc_get_joystick()` 回傳 2048，`rc_get_button()` 回傳 1
2. **Given** 斷線後使用映射積木，**When** 映射範圍為 -100 到 100，**Then** 回傳 0（中點）
3. **Given** 使用「是否連線」積木，**When** 斷線超過 500ms，**Then** 回傳 `False`

---

### User Story 5 - 與現有 X12 積木相容 (Priority: P3)

發射端程式可混用 X12 積木（讀取本機感測器）和 RC 積木（發送資料）。例如，發射端可用 X12 積木判斷本機按鈕狀態來控制本機 LED，同時用 RC 積木將資料發送給接收端。

**Why this priority**: 進階使用情境，基本功能不依賴此項，但對進階使用者有價值。

**Independent Test**: 可獨立測試 - 發射端程式同時使用 X12 和 RC 積木，兩者都正常運作。

**Acceptance Scenarios**:

1. **Given** 發射端已執行 RC 初始化，**When** 使用 `x12_get_joystick(L1)` 積木，**Then** 正確回傳本機搖桿值
2. **Given** 發射端使用 `x12_is_button_pressed(K1)`，**When** 按下 X12 的 K1 按鈕，**Then** 回傳 True 且不影響 RC 發送
3. **Given** 發射端同時有 X12 讀取和 RC 發送，**When** 編譯產生程式碼，**Then** 只有一次 `rc_master_init()` 呼叫（不重複初始化）

---

### Edge Cases

-   當配對 ID 超出範圍（<1 或 >255）時，系統應限制為有效範圍
-   當 WiFi 頻道超出範圍（<1 或 >11）時，系統應限制為有效範圍
-   當接收端同時收到多個發射端訊號（配對 ID 衝突）時，應接受最後收到的資料
-   當發射端 `rc_master_data()` 回傳 `None`（X12 未接好）時，應發送安全預設值而非報錯

## Requirements _(mandatory)_

### Functional Requirements

**初始化與配對**

-   **FR-001**: 系統 MUST 提供發射端初始化積木，接受配對 ID (1-255) 和 WiFi 頻道 (1-11) 參數
-   **FR-002**: 系統 MUST 提供接收端初始化積木，接受配對 ID (1-255) 和 WiFi 頻道 (1-11) 參數
-   **FR-003**: 配對 ID MUST 轉換為 MAC 地址格式 `b'\x02\x00\x00\x00\x00\x{ID}'`，符合 ESP32 本地管理位元規範
-   **FR-004**: 發射端和接收端 MUST 使用相同 WiFi 頻道才能通訊

**資料傳輸**

-   **FR-005**: 發射端 MUST 提供手動發送積木，每次執行發送一筆資料
-   **FR-006**: 發送積木 MUST 自動呼叫 `rc_module.rc_master_data()` 讀取 X12 感測器
-   **FR-007**: 資料格式 MUST 沿用官方 10 元素 tuple：`[L1, L2, L3, R1, R2, R3, K1, K2, K3, K4]`
-   **FR-024**: 發送積木 MUST 自動附加 `time.sleep_ms(20)` 確保發送頻率 ≤50Hz
-   **FR-008**: 接收端 MUST 透過 `espnow.irq(callback)` 非同步接收資料，自動更新全域變數 `_rc_data`
-   **FR-023**: 接收端 callback MUST 使用 `irecv(0)` 迴圈讀取所有緩衝區訊息，避免遺漏封包

**資料讀取**

-   **FR-009**: 系統 MUST 提供讀取遠端搖桿值積木，支援 L1-L3、R1-R3 六個通道
-   **FR-010**: 系統 MUST 提供讀取遠端搖桿映射值積木，可自訂最小/最大範圍
-   **FR-011**: 系統 MUST 提供檢查遠端按鈕是否按下的積木，支援 K1-K4 四個按鈕
-   **FR-012**: 系統 MUST 提供讀取遠端按鈕原始狀態的積木

**連線狀態**

-   **FR-013**: 系統 MUST 提供「等待配對」積木，執行時阻塞直到收到第一筆資料或超時
-   **FR-014**: 等待配對期間 MUST 以 500ms 間隔閃爍板載 LED（藍色）
-   **FR-015**: 系統 MUST 提供「是否已連線」積木，回傳布林值
-   **FR-016**: 當超過 500ms 未收到資料時，連線狀態 MUST 變為 False
-   **FR-022**: 等待配對超時後 MUST 結束阻塞並讓程式繼續往下執行，不自動重試或拋出錯誤

**安全預設值**

-   **FR-017**: 當未連線或斷線時，搖桿讀取 MUST 回傳 2048（中點）
-   **FR-018**: 當未連線或斷線時，按鈕讀取 MUST 回傳 1（放開狀態）
-   **FR-019**: 當 `rc_master_data()` 回傳 `None` 時，發送積木 MUST 發送安全預設值

**相容性**

-   **FR-020**: RC 積木 MUST 與現有 X12 積木相容，可在同一程式中混用
-   **FR-021**: 發射端程式 MUST 只呼叫一次 `rc_module.rc_master_init()`（由 `addHardwareInit` 確保）

### Key Entities

-   **配對 ID (Pair ID)**: 1-255 的整數，用於區隔不同組別的通訊對。相同配對 ID 的發射端和接收端才能通訊。
-   **WiFi 頻道 (Channel)**: 1-11 的整數，提供額外的隔離層。建議在配對 ID 不足時使用不同頻道。
-   **RC 資料 (RC Data)**: 10 元素 tuple，索引 0-5 為搖桿 ADC 值 (0-4095)，索引 6-9 為按鈕狀態 (0=按下, 1=放開)。
-   **連線狀態 (\_rc_connected)**: 布林值，表示接收端是否在 500ms 內收到過資料。

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者可在 5 分鐘內完成發射端和接收端的配對設定，無需理解 MAC 地址或 ESP-NOW 協定
-   **SC-002**: 在教室環境中，10 組以上的遙控器/接收端可同時運作且互不干擾（使用不同配對 ID）
-   **SC-003**: 發射端搖桿操作到接收端馬達反應的延遲低於 100ms
-   **SC-004**: 斷線後 500ms 內，接收端馬達自動停止（搖桿值回歸中點）
-   **SC-005**: 等待配對時 LED 閃爍清晰可見，學生可明確辨識「等待中」和「已連線」狀態
-   **SC-006**: 所有 RC 積木支援 15 種語言的 i18n，通過 `npm run validate:i18n` 驗證

## Assumptions

-   CyberBrick Core 的 MicroPython 環境支援 `network.WLAN.config(mac=...)` 設定自訂 MAC 地址
-   CyberBrick Core 的 MicroPython 環境內建 `espnow` 模組
-   教室環境中 WiFi 干擾在可接受範圍內，不會嚴重影響 ESP-NOW 通訊
-   使用者會在 forever 迴圈中放置「發送資料」積木，確保持續傳輸

## Clarifications

### Session 2026-01-15

-   Q: 等待配對超時後的行為？ → A: 超時後結束等待，程式繼續往下執行（由使用者程式決定後續行為如重試或進入離線模式）
-   Q: 接收端資料接收架構選擇？ → A: 採用非同步接收 (espnow.irq callback)，自動更新 `_rc_data`，無需手動接收積木
-   Q: 發送頻率控制機制？ → A: 發送積木自動附加 `time.sleep_ms(20)`，確保 ≤50Hz 避免過度發送
