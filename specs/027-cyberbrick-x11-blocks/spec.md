# Feature Specification: CyberBrick X11 擴展板積木選單

**Feature Branch**: `027-cyberbrick-x11-blocks`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "新增 CyberBrick X11 擴展板積木選單，支援 S1-S4 伺服馬達、M1-M2 直流馬達、D1-D2 LED 燈帶控制"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 使用 180° 伺服馬達控制機械臂角度 (Priority: P1)

使用者想要控制連接到 X11 擴展板 S1-S4 埠的 180° 伺服馬達（PG001），讓機械臂轉動到特定角度。使用者從 Toolbox 拖出「伺服馬達(180°) 轉到角度」積木，選擇埠位（S1-S4）並設定目標角度（0-180°），程式執行後伺服馬達轉到指定位置。

**Why this priority**: 伺服馬達是 CyberBrick 最常用的輸出元件，角度控制是基本功能，大多數專案都需要此功能。

**Independent Test**: 可透過連接一個 180° 伺服馬達到 S1 埠，拖出積木設定角度為 90°，上傳程式後驗證伺服馬達是否轉到 90° 位置。

**Acceptance Scenarios**:

1. **Given** 使用者已選擇 CyberBrick 開發板且 Toolbox 顯示 X11 擴展板類別, **When** 使用者展開 X11 擴展板類別, **Then** 顯示「伺服馬達(180°) [S1-S4] 轉到 [0-180]°」積木
2. **Given** 使用者拖出伺服馬達角度控制積木並設定 S2 埠、角度 45°, **When** 生成 MicroPython 程式碼, **Then** 產生 `servos.set_angle(2, 45)` 且自動引入 `from bbl.servos import ServosController` 及初始化程式碼
3. **Given** 使用者滑鼠懸停在伺服馬達(180°)積木上, **When** 顯示 Tooltip, **Then** 顯示「適用於 180° 伺服馬達 (PG001)，直接轉到指定角度」

---

### User Story 2 - 使用 360° 伺服馬達持續旋轉 (Priority: P1)

使用者想要控制連接到 X11 擴展板的 360° 伺服馬達（PG002），讓輪子持續旋轉。使用者從 Toolbox 拖出「伺服馬達(360°) 速度」積木，選擇埠位並設定速度（-100% 到 100%），程式執行後伺服馬達以指定速度持續旋轉。

**Why this priority**: 360° 伺服馬達用於驅動輪子等連續旋轉場景，與 180° 同為核心功能。

**Independent Test**: 可透過連接一個 360° 伺服馬達到 S3 埠，設定速度為 50%，上傳後驗證馬達是否持續旋轉。

**Acceptance Scenarios**:

1. **Given** 使用者拖出伺服馬達(360°)速度積木並設定 S1 埠、速度 -75%, **When** 生成 MicroPython 程式碼, **Then** 產生 `servos.set_speed(1, -75)`
2. **Given** 使用者滑鼠懸停在伺服馬達(360°)積木上, **When** 顯示 Tooltip, **Then** 顯示「適用於 360° 伺服馬達 (PG002)，正值順時針、負值逆時針、0 停止」

---

### User Story 3 - 控制直流馬達驅動車輪 (Priority: P1)

使用者想要控制連接到 M1-M2 埠的直流馬達來驅動遙控車的車輪。使用者拖出「直流馬達速度」積木，選擇埠位（M1 或 M2）並設定速度（-2048 到 2048），程式執行後馬達以指定速度和方向旋轉。

**Why this priority**: 直流馬達是驅動車輛底盤的核心元件，使用頻率高。

**Independent Test**: 連接直流馬達到 M1 埠，設定速度為 1024，上傳後驗證馬達正轉。

**Acceptance Scenarios**:

1. **Given** 使用者拖出直流馬達速度積木並設定 M2 埠、速度 -1500, **When** 生成 MicroPython 程式碼, **Then** 產生 `motors.set_speed(2, -1500)` 且自動引入 `from bbl.motors import MotorsController`
2. **Given** 使用者拖出停止直流馬達積木並選擇 M1, **When** 生成程式碼, **Then** 產生 `motors.stop(1)`

---

### User Story 4 - 控制 LED 燈條顏色 (Priority: P2)

使用者想要控制連接到 D1-D2 埠的 WS2812 LED 燈條，設定每顆 LED 的 RGB 顏色。使用者拖出「LED 燈條設定顏色」積木，選擇埠位（D1 或 D2）、輸出口（1-4 或全部）、以及 R/G/B 數值（0-255）。

**Why this priority**: LED 燈帶是常見的視覺效果元件，但相比馬達控制屬於次要功能。

**Independent Test**: 連接 LED Hub 到 D1 埠並接上 LED 燈條，設定第 1 顆為紅色 (255, 0, 0)，上傳後驗證 LED 亮紅燈。

**Acceptance Scenarios**:

1. **Given** 使用者拖出 LED 燈條設定顏色積木並設定 D1 埠、第 2 顆、R=0 G=255 B=128, **When** 生成 MicroPython 程式碼, **Then** 產生 `np_d1[1] = (0, 255, 128)` 和 `np_d1.write()` 且自動引入 `from machine import Pin` 和 `from neopixel import NeoPixel`
2. **Given** 使用者選擇輸出口為「全部」, **When** 生成程式碼, **Then** 產生設定所有 4 顆 LED 的程式碼（`np_d1[0]` 到 `np_d1[3]`）
3. **Given** 使用者滑鼠懸停在 LED 燈條積木上, **When** 顯示 Tooltip, **Then** 顯示「設定 WS2812 LED 燈條顏色，R/G/B 範圍 0-255」

---

### User Story 5 - 使用平滑移動功能讓伺服馬達緩慢轉動 (Priority: P2)

使用者想要讓 180° 伺服馬達平滑地從當前位置移動到目標角度，而不是瞬間跳轉。使用者只需拖出「伺服馬達(180°) 平滑轉到角度」積木，系統會自動在主程式結尾注入必要的 `timing_proc()` 呼叫。

**Why this priority**: 平滑移動是進階功能，但透過自動注入機制降低了使用門檻。

**Independent Test**: 設定平滑移動到 180° 速度 30%，上傳後觀察伺服馬達是否緩慢移動（無需手動加入任何額外積木）。

**Acceptance Scenarios**:

1. **Given** 使用者拖出平滑轉到角度積木並設定 S1、角度 180°、速度 50%, **When** 生成程式碼, **Then** 產生 `servos.set_angle_stepping(1, 180, 50)` 且主程式結尾自動加入 `servos.timing_proc()`
2. **Given** 使用者僅使用 LED 燈條積木（無平滑移動）, **When** 生成程式碼, **Then** 不注入任何 timing_proc()（LED 設定立即生效）
3. **Given** 使用者滑鼠懸停在平滑轉到角度積木上, **When** 顯示 Tooltip, **Then** 顯示「適用於 180° 伺服馬達 (PG001)，以指定速度漸進移動到目標角度」

---

### User Story 6 - 支援多國語言顯示 (Priority: P3)

使用者切換 VS Code 語言設定後，X11 擴展板積木的名稱、下拉選單、Tooltip 都應顯示對應語言。

**Why this priority**: 國際化支援是品質要求，但不影響核心功能。

**Independent Test**: 切換語言為英文，驗證積木顯示 "Servo(180°) [S1-S4] rotate to [0-180]°"。

**Acceptance Scenarios**:

1. **Given** 使用者語言設定為英文, **When** 檢視 X11 積木, **Then** 所有積木名稱和 Tooltip 顯示英文
2. **Given** 使用者語言設定為日文, **When** 檢視 X11 積木, **Then** 所有積木名稱和 Tooltip 顯示日文

---

### Edge Cases

-   當使用者設定角度超出 0-180° 範圍時，積木應接受輸入但 Tooltip 提示有效範圍
-   當使用者同時使用多個相同埠位的積木時，程式碼應正常執行（後設定覆蓋前設定）
-   當使用者只使用不需要 timing_proc() 的積木（如 set_angle、set_speed）時，不應注入 timing_proc()
-   當開發板不是 CyberBrick 時，X11 擴展板類別不應顯示在 Toolbox 中

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統必須在 CyberBrick Toolbox 中新增「X11 擴展板」類別，使用 HSV 180 顏色
-   **FR-002**: Toolbox 類別內積木必須按元件類型分組（伺服馬達、直流馬達、LED 燈條），使用 Label 分隔
-   **FR-003**: 系統必須提供伺服馬達(180°)角度控制積木，支援 S1-S4 埠位選擇和 0-180° 角度輸入
-   **FR-004**: 系統必須提供伺服馬達(180°)平滑移動積木，支援目標角度和移動速度設定
-   **FR-005**: 系統必須提供伺服馬達(360°)速度控制積木，支援 -100% 到 100% 速度設定
-   **FR-006**: 系統必須提供停止伺服馬達積木，支援 S1-S4 埠位選擇
-   **FR-007**: 系統必須提供直流馬達速度控制積木，支援 M1-M2 埠位選擇和 -2048 到 2048 速度設定
-   **FR-008**: 系統必須提供停止直流馬達積木，支援 M1-M2 埠位選擇
-   **FR-009**: 系統必須提供 LED 燈條顏色設定積木，支援 D1-D2 埠位、輸出口(1-4/全部)、R/G/B(0-255) 設定
-   **FR-010**: 系統必須提供關閉 LED 燈條積木，支援 D1-D2 埠位和輸出口選擇
-   **FR-011**: 當使用伺服馬達平滑移動積木時，系統必須自動在主程式結尾注入 `servos.timing_proc()` 呼叫；LED 燈條設定立即生效，不需要 timing_proc()
-   **FR-012**: 所有積木必須提供 Tooltip 說明，包含適用硬體型號和使用提示
-   **FR-013**: 系統必須為所有 15 種支援語言提供 i18n 翻譯
-   **FR-014**: MicroPython 生成器必須自動引入所需的 import 語句（馬達：`from bbl.xxx import XxxController`；LED：`from machine import Pin` 和 `from neopixel import NeoPixel`）
-   **FR-015**: MicroPython 生成器必須自動初始化硬體（使用 addHardwareInit 確保只初始化一次）
-   **FR-016**: LED 燈條積木必須將 D1/D2 埠位轉換為對應的 GPIO 腳位（D1→20, D2→21）
-   **FR-017**: LED 燈條積木必須支援單顆 LED 獨立控制，設定某顆 LED 不影響其他 LED 的狀態
-   **FR-018**: 生成器必須對超出範圍的數值自動 clamp（角度 0-180°、速度 -100%~100%、馬達 -2048~2048）

### Key Entities

-   **ServosController**: 伺服馬達控制器單例，管理 S1-S4 四個伺服馬達埠，支援角度控制、平滑移動、速度控制
-   **MotorsController**: 直流馬達控制器單例，管理 M1-M2 兩個直流馬達埠，支援速度控制（-2048 到 2048）
-   **NeoPixel**: 原生 MicroPython NeoPixel 物件，每個 D 埠對應一個實例（np_d1/np_d2），每個實例管理 4 顆 LED，支援單顆獨立控制

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者能在 30 秒內找到並拖出 X11 擴展板積木完成基本馬達控制
-   **SC-002**: 生成的 MicroPython 程式碼可直接上傳到 CyberBrick 並正確執行，無需手動修改
-   **SC-003**: 所有 8 種積木的 Tooltip 皆能正確顯示，幫助使用者理解適用硬體和使用方式
-   **SC-004**: 15 種語言的 i18n 翻譯完整度達到 100%（使用 npm run validate:i18n 驗證）
-   **SC-005**: 積木名稱清楚區分 180° 和 360° 伺服馬達，減少使用者選錯積木的情況

## Clarifications

### Session 2026-01-03

-   Q: timing_proc() 自動注入的位置？ → A: 在生成的主程式最後一行（集中式，執行一次）
-   Q: X11 擴展板積木的專屬顏色？ → A: HSV 180（青色），與核心板 HSV 160 區分
-   Q: 角度/速度超出範圍時的處理方式？ → A: 在生成的程式碼中自動 clamp 到有效範圍
-   Q: LED 是否需要 timing_proc()？ → A: 不需要，純色設定立即生效；使用者可自行用迴圈實現特效
-   Q: D1-D2 埠控制的 LED 元件名稱？ → A: LED 燈條（台灣主流用詞）
-   Q: Toolbox 中的積木分組方式？ → A: 按元件類型分組（伺服馬達/直流馬達/LED 燈條），使用 Label 分隔
-   Q: LED 燈條使用何種 API？ → A: 使用原生 NeoPixel API（非 LEDController.set_led_effect），支援單顆獨立控制

## Assumptions

-   使用者已具備基本的 CyberBrick 硬體連接知識
-   X11 擴展板（Remote Control Receiver Shield-XA004）已正確連接到 Multi-Function Core Board
-   目標硬體上已預裝 CyberBrick MicroPython 韌體，包含 `bbl.servos`、`bbl.motors` 模組及原生 `neopixel` 模組
-   LED 燈條使用 WS2812 協議，透過 LED Hub (XA006) 連接到 D1/D2 埠（GPIO 20/21）
