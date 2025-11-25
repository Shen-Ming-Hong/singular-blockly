# Feature Specification: ESP32 Pixetto 程式碼生成修正

**Feature Branch**: `012-esp32-pixetto-fix`  
**Created**: 2025-11-25  
**Status**: Draft  
**Input**: 修正 ESP32 使用 Pixetto 智慧鏡頭的程式碼生成邏輯，移除不必要的 SoftwareSerial 引用和 AVR 專用 build_flags

## 背景與動機

目前 Singular Blockly 中的 Pixetto 初始化積木 (`pixetto_init`) 在生成 Arduino 程式碼時，**未針對 ESP32 開發板進行條件判斷**。這導致：

1. **錯誤引用 SoftwareSerial**：ESP32 使用硬體 Serial2，不需要也不支援 SoftwareSerial
2. **無效的 build_flags**：AVR 專用路徑 `framework-arduino-avr/libraries/SoftwareSerial/src` 在 ESP32 平台不存在
3. **編譯警告或失敗**：雖然 Pixetto 庫內部已處理 (`#if !ESP32`)，但生成的程式碼仍會嘗試引入不必要的標頭檔

### 官方庫支援確認

經查證 [pixetto/Pixetto](https://github.com/pixetto/Pixetto) 官方原始碼：

-   **v1.5.3 (2021-08-31)**：加入 ESP32 支援 (HardwareSerial only)
-   **v1.6.3 (2022-03-09)**：修復 ESP32 編譯問題
-   **v1.6.6 (2022-06-16)**：修復 ESP32 Serial 問題

Pixetto 庫原始碼中已有條件編譯：

```cpp
#if !ESP32
#include <SoftwareSerial.h>
#endif
```

ESP32 Serial2 腳位支援 (GPIO16=RX, GPIO17=TX)：

```cpp
if ((rx == 16 && tx == 17) || (rx == 19 && tx == 20)) {
    Serial2.begin(speed);
    m_serial = &Serial2;
}
```

## User Scenarios & Testing

### User Story 1 - ESP32 開發板使用 Pixetto (Priority: P1)

使用者選擇 ESP32 開發板並使用 Pixetto 智慧鏡頭積木，系統應生成正確的 ESP32 程式碼，不包含 SoftwareSerial 相關內容。

**Why this priority**: 這是修正的核心目標，直接影響 ESP32 用戶能否成功編譯和使用 Pixetto

**Independent Test**: 選擇 ESP32 開發板 → 拖曳 Pixetto 初始化積木 → 檢查生成的程式碼是否不包含 `#include <SoftwareSerial.h>` 和 AVR build_flags

**Acceptance Scenarios**:

1. **Given** 使用者選擇 ESP32 開發板, **When** 使用 Pixetto 初始化積木並設定 RX=16, TX=17, **Then** 生成的程式碼不包含 `#include <SoftwareSerial.h>`
2. **Given** 使用者選擇 ESP32 開發板, **When** 使用 Pixetto 初始化積木, **Then** platformio.ini 不包含 AVR SoftwareSerial 的 build_flags
3. **Given** 使用者選擇 ESP32 開發板, **When** 使用 Pixetto 初始化積木, **Then** 程式碼能成功編譯且無警告

---

### User Story 2 - Arduino AVR 開發板使用 Pixetto (Priority: P1)

使用者選擇 Arduino UNO/Nano/Mega 等 AVR 開發板使用 Pixetto，系統應維持現有行為，包含 SoftwareSerial 和對應的 build_flags。

**Why this priority**: 確保修改不會破壞現有 AVR 使用者的功能

**Independent Test**: 選擇 Arduino UNO → 拖曳 Pixetto 初始化積木 → 檢查生成的程式碼包含完整的 SoftwareSerial 設定

**Acceptance Scenarios**:

1. **Given** 使用者選擇 Arduino UNO 開發板, **When** 使用 Pixetto 初始化積木, **Then** 生成的程式碼包含 `#include <SoftwareSerial.h>`
2. **Given** 使用者選擇 Arduino UNO 開發板, **When** 使用 Pixetto 初始化積木, **Then** platformio.ini 包含正確的 AVR SoftwareSerial build_flags
3. **Given** 使用者選擇 Arduino Mega 開發板, **When** 使用 Pixetto 初始化積木, **Then** 現有行為維持不變

---

### User Story 3 - ESP32 Super Mini 開發板使用 Pixetto (Priority: P2)

使用者選擇 ESP32 Super Mini 開發板使用 Pixetto，系統應識別為 ESP32 變體並套用相同的 ESP32 邏輯。

**Why this priority**: 擴展支援到 ESP32 變體，但核心邏輯與 P1 相同

**Independent Test**: 選擇 ESP32 Super Mini → 使用 Pixetto 積木 → 確認與標準 ESP32 相同的程式碼生成行為

**Acceptance Scenarios**:

1. **Given** 使用者選擇 ESP32 Super Mini 開發板, **When** 使用 Pixetto 初始化積木, **Then** 系統識別為 ESP32 並套用相應邏輯

---

### Edge Cases

-   **切換開發板**：使用者在 ESP32 和 Arduino 之間切換時，程式碼生成應即時更新
-   **自訂腳位**：使用者設定非標準 Serial2 腳位（如 GPIO19/20）時，ESP32 仍應使用硬體串列
-   **函式庫版本**：確保 `pixetto/Pixetto@^1.6.6` 版本指定正確，支援 ESP32

## Requirements

### Functional Requirements

-   **FR-001**: 系統 MUST 在程式碼生成時檢測當前開發板類型
-   **FR-002**: 當開發板為 ESP32 系列時，系統 MUST NOT 生成 `#include <SoftwareSerial.h>`
-   **FR-003**: 當開發板為 ESP32 系列時，系統 MUST NOT 添加 AVR 專用的 SoftwareSerial build_flags
-   **FR-004**: 當開發板為 Arduino AVR 系列時，系統 MUST 維持現有行為（包含 SoftwareSerial）
-   **FR-005**: 系統 MUST 使用 `window.currentBoard.includes('esp32')` 進行開發板類型判斷（與 HuskyLens 實作一致）
-   **FR-006**: 系統 MUST 在生成的程式碼註解中標明開發板類型，便於使用者理解
-   **FR-007**: 系統 MUST 維持 `pixetto/Pixetto@^1.6.6` 作為函式庫依賴

### Key Entities

-   **arduinoGenerator.includes\_**: 儲存 #include 指令的物件，需條件性添加 SoftwareSerial
-   **arduinoGenerator.build*flags***: 儲存編譯標誌的陣列，ESP32 時不添加 AVR 路徑
-   **window.currentBoard**: 當前選擇的開發板識別碼（如 'esp32', 'arduino_uno'）

## Success Criteria

### Measurable Outcomes

-   **SC-001**: ESP32 開發板生成的程式碼不包含 SoftwareSerial 相關內容
-   **SC-002**: Arduino AVR 開發板生成的程式碼維持現有行為，包含 SoftwareSerial
-   **SC-003**: 修改後的程式碼能在 ESP32 平台成功編譯且無警告
-   **SC-004**: 修改後的程式碼能在 Arduino UNO 平台成功編譯且維持功能

## Assumptions

-   Pixetto 官方庫 v1.6.6 已完整支援 ESP32 HardwareSerial
-   `window.currentBoard` 變數在程式碼生成時已正確設定
-   ESP32 開發板識別碼包含 'esp32' 字串（如 'esp32', 'esp32_super_mini'）
-   現有 HuskyLens 的開發板判斷模式可作為參考範本

## Clarifications

### Session 2025-11-25

-   Q: ESP32 Pixetto 積木的預設 RX/TX 腳位應如何設定？ → A: 預設使用 GPIO16 (RX) / GPIO17 (TX)，這是 ESP32 Serial2 標準腳位

## References

-   [Pixetto 官方 GitHub](https://github.com/pixetto/Pixetto)
-   [Pixetto release_note.txt](https://github.com/pixetto/Pixetto/blob/main/release_note.txt) - ESP32 支援歷史
-   [HuskyLens generator 範本](media/blockly/generators/arduino/huskylens.js) - 開發板判斷邏輯參考
