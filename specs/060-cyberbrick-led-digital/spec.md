# Feature Specification: CyberBrick LED Digital Control Blocks

**Feature Branch**: `060-cyberbrick-led-digital`  
**Created**: 2026-05-29  
**Status**: Draft  
**Input**: User description: "在 CyberBrick 中新增 LED RGB 數位控制積木，R ON=255/OFF=0、G ON=255/OFF=0、B ON=255/OFF=0，各通道獨立開關，用於教學類比與數位訊號的差異"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 板載 LED 數位開關控制 (Priority: P1)

教師使用 CyberBrick 板進行「數位訊號」概念教學。學生將一個 LED 數位積木拖入程式，分別設定 R、G、B 各通道為 ON 或 OFF，立即看到 LED 亮起對應顏色，體會數位訊號「只有 0 或 1，沒有中間值」的概念。

**Why this priority**: 這是功能核心，與現有類比積木（0–255 任意值）形成直接對比，教學價值最高。

**Independent Test**: 僅使用 `cyberbrick_led_digital` 積木、選擇不同 R/G/B 開關組合，確認生成的 MicroPython 程式碼輸出正確的 `(255/0, 255/0, 255/0)` 元組，即可完整驗證此故事。

**Acceptance Scenarios**:

1. **Given** 使用者在 CyberBrick 板的工具箱 LED 分類中，**When** 拖出 `cyberbrick_led_digital` 積木並設定 R=ON、G=OFF、B=OFF，**Then** 生成碼含 `onboard_led[0] = (255, 0, 0)` 及 `onboard_led.write()`
2. **Given** 同一積木已放置，**When** 將 R、G、B 全設為 ON，**Then** 生成碼含 `onboard_led[0] = (255, 255, 255)`（白光）
3. **Given** 同一積木已放置，**When** 將 R、G、B 全設為 OFF，**Then** 生成碼含 `onboard_led[0] = (0, 0, 0)`（熄滅）
4. **Given** 工具箱已開啟，**When** 切換至非 CyberBrick 板（如 Arduino），**Then** 該積木不出現在工具箱中

---

### User Story 2 - X11 燈條數位開關控制 (Priority: P2)

擴充同樣的數位控制概念至 X11 擴充板的 WS2812 燈條（D1/D2），讓學生可以對燈條上的單顆或全部燈珠進行數位開關控制。

**Why this priority**: 讓數位概念可應用於燈條，增加教學場景多樣性，但依賴 P1 的基礎設計。

**Independent Test**: 使用 `x11_led_digital` 積木、選擇 PORT=D1、INDEX=0、R=OFF/G=ON/B=OFF，確認生成碼含正確的單顆燈珠賦值語句。

**Acceptance Scenarios**:

1. **Given** 使用者拖出 `x11_led_digital` 積木並設定 PORT=D1、INDEX=0、R=OFF、G=ON、B=OFF，**When** 查看生成碼，**Then** 含 `np_d1[0] = (0, 255, 0)` 及 `np_d1.write()`
2. **Given** 同一積木設定 INDEX=All、R=ON、G=ON、B=ON，**When** 查看生成碼，**Then** 含 for loop 對 4 顆燈珠全部設為 `(255, 255, 255)`
3. **Given** 選擇 PORT=D2，**When** 查看生成碼，**Then** 使用 `np_d2` 變數（GPIO 20）

---

### User Story 3 - 教學對比體驗 (Priority: P3)

教師在同一個 Blockly 工作區中，同時放置「數位積木」與「類比積木」，向學生說明：數位積木的下拉選單只有開/關兩個選項，類比積木則可輸入 0 到 255 任意整數，兩者的生成碼輸出數值差異清楚可見。

**Why this priority**: 增強教學情境，但單獨使用任一積木也能達到教學目的，優先級最低。

**Independent Test**: 並排放置 `cyberbrick_led_digital`（R=ON, G=OFF, B=OFF）與 `cyberbrick_led_set_color`（R=128, G=0, B=0），確認兩者生成碼中的數值呈現明顯差異（255 vs 128）。

**Acceptance Scenarios**:

1. **Given** 同一工作區放置了數位積木與類比積木，**When** 查看生成碼，**Then** 數位積木只產生 0 或 255，類比積木產生使用者輸入的任意值
2. **Given** 學生嘗試在數位積木上輸入 128，**When** 觀察積木，**Then** 無法輸入（只有下拉選單，無數字輸入框）

---

### Edge Cases

- 切換板卡類型（CyberBrick → Arduino）時，已放置的數位積木不應造成工具箱錯誤
- R_STATE、G_STATE、B_STATE 的預設值應為 ON（白光），避免學生首次使用看不到效果
- X11 積木的 INDEX=All 產生 for loop，單顆 INDEX 產生直接賦值，兩者邏輯需一致

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統必須提供 `cyberbrick_led_digital` 積木，包含 R、G、B 各通道的獨立 ON/OFF 下拉選單，全部欄位在同一行（`setInputsInline(true)`）
- **FR-002**: 積木的 ON 值對應 255，OFF 值對應 0，無法由使用者輸入中間值
- **FR-003**: `cyberbrick_led_digital` 積木必須生成正確的 NeoPixel MicroPython 程式碼，包含必要的 import 語句與硬體初始化
- **FR-004**: 系統必須提供 `x11_led_digital` 積木，包含 PORT（D1/D2）、INDEX（0–3 或 All）及 R/G/B 各通道 ON/OFF 下拉選單
- **FR-005**: `x11_led_digital` 積木的 INDEX=All 時必須生成 for loop 設定全部 4 顆燈珠；INDEX=單顆時生成直接賦值語句
- **FR-006**: 兩個新積木必須出現在各自的工具箱 LED 分類中（板載：`cyberbrick_core`；X11：`cyberbrick_x11`），預設狀態為 R=ON、G=ON、B=ON
- **FR-007**: 新積木的所有文字標籤必須支援全部 15 個語系的國際化（i18n），不得有缺漏 key；`x11_led_digital` 的燈條前綴、序號與計數單位標籤重用現有 `X11_LED_SET_COLOR_*` key，無需新增
- **FR-008**: 兩個新積木必須具備 statement 連接器（可串接在其他積木之間）

### Key Entities

- **cyberbrick_led_digital 積木**：板載 LED 數位控制，欄位為 R_STATE / G_STATE / B_STATE（各為 'ON' 或 'OFF'），對應硬體 GPIO 8、NeoPixel 1 顆
- **x11_led_digital 積木**：X11 燈條數位控制，欄位為 PORT（'D1'/'D2'）、INDEX（'0'–'3'/'all'）、R_STATE / G_STATE / B_STATE，D1 對應 GPIO 21、D2 對應 GPIO 20，各 4 顆 NeoPixel
- **i18n key 組**：共 5 個新 key（`CYBERBRICK_LED_DIGITAL_PREFIX`、`CYBERBRICK_LED_DIGITAL_TOOLTIP`、`CYBERBRICK_LED_DIGITAL_ON`、`CYBERBRICK_LED_DIGITAL_OFF`、`X11_LED_DIGITAL_TOOLTIP`）；`x11_led_digital` 的介面標籤重用現有 key（`X11_LED_SET_COLOR_PREFIX`、`X11_LED_SET_COLOR_INDEX`、`X11_LED_SET_COLOR_INDEX_SUFFIX`），不新增對應標籤 key

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 拖入 `cyberbrick_led_digital` 積木並切換任意 R/G/B 組合，每次生成的 MicroPython 程式碼中每個通道值只能是 0 或 255（共 8 種合法組合，全部可驗證）
- **SC-002**: `npm run validate:i18n` 執行通過，無缺漏 key，15 個語系全部覆蓋
- **SC-003**: 工具箱在 CyberBrick 板下，LED 分類可見新積木；切換至非 CyberBrick 板時新積木不可見
- **SC-004**: 學生在 5 分鐘內可理解並正確使用數位積木產生亮紅/綠/藍/白/黑 5 種效果（教學實用性）
- **SC-005**: 新積木與現有積木並排使用時，工作區不產生任何警告或錯誤訊息

## Clarifications

### Session 2026-05-29

- Q: `cyberbrick_led_digital` 積木的 R/G/B 下拉選單應如何排列？ → A: 單行 inline 排列（一個 `appendDummyInput` 含全部欄位，呼叫 `setInputsInline(true)`）
- Q: `x11_led_digital` 積木的介面標籤（燈條前綴、「第」、「顆」）應建立獨立 i18n key 還是重用現有 key？ → A: 重用 `X11_LED_SET_COLOR_PREFIX`、`X11_LED_SET_COLOR_INDEX`、`X11_LED_SET_COLOR_INDEX_SUFFIX`；僅新增 `X11_LED_DIGITAL_TOOLTIP` 一個 key

## Assumptions

- CyberBrick 板僅使用 MicroPython，不需要 Arduino 生成器
- X11 燈條固定為每端 4 顆 NeoPixel（D1: GPIO 21、D2: GPIO 20），與現有 `x11_led_set_color` 積木相同
- FieldDropdown 的 ON/OFF 標籤使用 i18n 機制，但 dropdown 的 `value`（'ON'/'OFF'）保持英文，生成器以 value 判斷
- 不需要新增對應的 Arduino 生成器（CyberBrick 專屬功能）
- 積木顏色沿用現有慣例：板載 LED 積木 `setColour(160)`，X11 積木 `setColour(180)`
- `x11_led_digital` 重用 `X11_LED_SET_COLOR_PREFIX`（"LED 燈條"）、`X11_LED_SET_COLOR_INDEX`（"第"）、`X11_LED_SET_COLOR_INDEX_SUFFIX`（"顆"）等現有 i18n key，以減少翻譯維護量
- 教學對比範例工作區（`add-cyberbrick-sample`）屬後續任務，不在本次範圍內
