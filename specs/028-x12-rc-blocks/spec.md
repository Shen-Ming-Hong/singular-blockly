# Feature Specification: CyberBrick X12 與 RC 遙控積木

**Feature Branch**: `028-x12-rc-blocks`  
**Created**: 2026-01-04  
**Status**: Draft  
**Input**: User description: "新增 CyberBrick X12 Remote Control Transmitter Shield 積木選單與獨立 RC 遙控通訊選單"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 接收端讀取遙控器指令 (Priority: P1)

使用者在接收端（如遙控車）上使用 RC 積木，初始化 Slave 模式後，可以讀取來自遠端發射端的搖桿和按鈕狀態，用於控制馬達、伺服等輸出裝置。

**Why this priority**: 這是遙控應用最核心的功能，沒有這個功能就無法實現遠端控制。大多數使用者購買 CyberBrick 是為了製作遙控車/機器人，這是最常見的使用情境。

**Independent Test**: 可以透過在接收端載入包含 `rc_slave_init` 和 `rc_get_joystick` 積木的程式，配對後推動發射端搖桿，驗證接收端能正確讀取數值並控制馬達轉動。

**Acceptance Scenarios**:

1. **Given** 接收端程式包含 `rc_slave_init` 積木, **When** 程式執行後與發射端配對成功, **Then** `rc_is_connected` 回傳 True
2. **Given** 發射端搖桿 L1 推到最大值, **When** 接收端呼叫 `rc_get_joystick(L1)`, **Then** 回傳值接近 4095
3. **Given** 發射端按下 K1 按鈕, **When** 接收端呼叫 `rc_is_button_pressed(K1)`, **Then** 回傳 True
4. **Given** 發射端與接收端未配對, **When** 接收端呼叫 `rc_get_joystick`, **Then** 回傳預設值 2048（中點）而非程式崩潰

---

### User Story 2 - 發射端讀取本機搖桿/按鈕 (Priority: P2)

使用者在發射端（遙控器 + X12 擴展板）上使用 X12 積木，初始化 Master 模式後，可以讀取本機搖桿和按鈕的狀態，用於在發射端做自訂邏輯（如死區處理、數值映射、狀態顯示）。

**Why this priority**: 進階使用者可能需要在發射端做額外處理，例如顯示目前搖桿位置、設定搖桿死區、或實現自訂的數值映射曲線。這比單純的遙控功能更進階。

**Independent Test**: 可以透過在發射端載入包含 `rc_master_init` 和 `x12_get_joystick` 積木的程式，推動搖桿後透過序列埠輸出確認能正確讀取本機數值。

**Acceptance Scenarios**:

1. **Given** 發射端程式包含 `rc_master_init` 積木, **When** 程式執行後, **Then** 可以使用 X12 積木讀取本機搖桿/按鈕
2. **Given** 搖桿 L1 推到最大值, **When** 呼叫 `x12_get_joystick(L1)`, **Then** 回傳值接近 4095
3. **Given** 搖桿 L1 推到最大值且映射範圍為 -100 到 100, **When** 呼叫 `x12_get_joystick_mapped(L1, -100, 100)`, **Then** 回傳值接近 100

---

### User Story 3 - 搖桿數值映射 (Priority: P2)

使用者可以使用映射積木將搖桿原始 ADC 值（0-4095）轉換為自訂範圍（如 -100 到 100），簡化馬達控制的程式邏輯。

**Why this priority**: 與 User Story 1/2 同等重要但屬於輔助功能，可以簡化程式但不是必要的。使用者也可以自己用數學積木計算。

**Independent Test**: 可以獨立測試映射積木，輸入已知的搖桿值和映射範圍，驗證輸出值符合預期。

**Acceptance Scenarios**:

1. **Given** 搖桿原始值為 0, **When** 映射到 -100~100, **Then** 回傳 -100
2. **Given** 搖桿原始值為 2048, **When** 映射到 -100~100, **Then** 回傳約 0
3. **Given** 搖桿原始值為 4095, **When** 映射到 -100~100, **Then** 回傳約 100
4. **Given** 搖桿原始值為 2048, **When** 映射到 0~180, **Then** 回傳約 90

---

### User Story 4 - 查詢連線狀態 (Priority: P3)

使用者可以查詢目前的配對狀態和配對索引，用於在程式中處理斷線情況或識別連線到哪個從機。

**Why this priority**: 這是進階功能，大多數簡單應用不需要檢查連線狀態。但對於需要處理斷線重連的複雜應用很有用。

**Independent Test**: 可以在已配對和未配對的狀態下分別測試 `rc_is_connected` 和 `rc_get_rc_index` 的回傳值。

**Acceptance Scenarios**:

1. **Given** 發射端與接收端未配對, **When** 呼叫 `rc_is_connected`, **Then** 回傳 False
2. **Given** 發射端與接收端已配對為 Slave 1, **When** 呼叫 `rc_get_rc_index`, **Then** 回傳 1
3. **Given** 發射端與接收端已配對為 Slave 2, **When** 呼叫 `rc_get_rc_index`, **Then** 回傳 2

---

### Edge Cases

-   當發射端與接收端未配對時，讀取積木應回傳安全預設值而非錯誤
-   當搖桿中點漂移時，映射積木仍能正確計算（依賴硬體校準）
-   當映射範圍 MIN > MAX 時，積木應能正確處理反向映射
-   當同時呼叫多個讀取積木時，應使用同一次的資料快取避免不一致

## Requirements _(mandatory)_

### Functional Requirements

#### RC 選單（無線通訊控制）

-   **FR-001**: 系統必須提供 `rc_master_init` 積木，呼叫 `rc_module.rc_master_init()` 初始化發射端
-   **FR-002**: 系統必須提供 `rc_slave_init` 積木，呼叫 `rc_module.rc_slave_init()` 初始化接收端
-   **FR-003**: 系統必須提供 `rc_get_joystick` 積木，透過下拉選單選擇通道（L1、L2、L3、R1、R2、R3），回傳 0-4095 的數值
-   **FR-004**: 系統必須提供 `rc_get_joystick_mapped` 積木，包含通道選擇和 MIN/MAX 數值輸入，回傳映射後的數值
-   **FR-005**: 系統必須提供 `rc_is_button_pressed` 積木，透過下拉選單選擇按鈕（K1、K2、K3、K4），回傳布林值
-   **FR-006**: 系統必須提供 `rc_get_button` 積木，回傳按鈕狀態數值（0 = 按下，1 = 放開）
-   **FR-007**: 系統必須提供 `rc_is_connected` 積木，回傳是否已與遠端配對的布林值
-   **FR-008**: 系統必須提供 `rc_get_rc_index` 積木，回傳配對索引（0 = 未配對，1 = Slave 1，2 = Slave 2）

#### X12 選單（發射端本機讀取）

-   **FR-009**: 系統必須提供 `x12_get_joystick` 積木，讀取發射端本機搖桿值（需先呼叫 `rc_master_init`）
-   **FR-010**: 系統必須提供 `x12_get_joystick_mapped` 積木，讀取並映射發射端本機搖桿值
-   **FR-011**: 系統必須提供 `x12_is_button_pressed` 積木，檢查發射端本機按鈕是否按下
-   **FR-012**: 系統必須提供 `x12_get_button` 積木，取得發射端本機按鈕狀態數值

#### 通用要求

-   **FR-013**: X12 選單必須使用 HSV 150（綠色）作為積木顏色
-   **FR-014**: RC 選單必須使用 HSV 160（藍綠色）作為積木顏色
-   **FR-015**: 所有積木必須支援 15 種語言的 i18n 翻譯
-   **FR-016**: 當無線資料不可用時，讀取積木必須回傳安全預設值（搖桿：2048 中點值，按鈕：1 對應未按下/False 狀態）
-   **FR-017**: 搖桿通道名稱必須使用實體標籤（L1、L2、L3、R1、R2、R3）配合 Tooltip 說明對應位置
-   **FR-018**: Toolbox 必須使用 Label 分組積木（RC：初始化、搖桿、按鈕、狀態；X12：搖桿、按鈕）

### Key Entities

-   **RC 資料 Tuple**: `[L1, L2, L3, R1, R2, R3, K1, K2, K3, K4]` — 前 6 個元素為搖桿 ADC 值 (0-4095)，後 4 個元素為按鈕狀態 (0=按下, 1=放開)
-   **搖桿通道**: L1-L3 對應左搖桿三軸，R1-R3 對應右搖桿三軸，索引 0-5
-   **按鈕通道**: K1-K4 對應四個按鈕，索引 6-9
-   **配對索引**: 0=未配對, 1=Slave 1, 2=Slave 2

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者可以在 5 分鐘內完成一個基本遙控車程式（使用 RC 積木讀取搖桿值並控制馬達）
-   **SC-002**: 所有 12 個新積木都能成功生成語法正確的 MicroPython 程式碼
-   **SC-003**: 積木在 Toolbox 中正確分組顯示，RC 選單和 X12 選單各自獨立
-   **SC-004**: 所有 15 種語言的翻譯都完整且無遺漏
-   **SC-005**: 當發射端與接收端配對後，搖桿操作延遲低於 100ms（人類可接受的反應時間）。測量基準：從發射端搖桿物理移動到接收端程式讀取到新數值的端到端延遲，此為硬體層面指標，積木層面無需額外處理
-   **SC-006**: 當無線連線中斷時，程式不會崩潰，而是使用安全預設值繼續運行

## Assumptions

-   使用者已有 CyberBrick X12 Transmitter Shield 和 X11 Receiver Shield 硬體
-   硬體已透過 CyberBrick App 完成配對設定
-   搖桿校準由硬體/App 層面處理，積木層面不需處理校準
-   `rc_module` API 在所有 CyberBrick 韌體版本中可用且行為一致
