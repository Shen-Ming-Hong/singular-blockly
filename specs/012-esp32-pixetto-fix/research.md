# Research: ESP32 Pixetto 程式碼生成修正

**Date**: 2025-11-25  
**Status**: ✅ 完成

## 研究目標

1. 確認 Pixetto 官方庫對 ESP32 的支援狀況
2. 驗證專案中現有的開發板判斷模式
3. 確定修改策略

## 研究發現

### 1. Pixetto 官方庫 ESP32 支援

**來源**: [pixetto/Pixetto GitHub](https://github.com/pixetto/Pixetto)

#### 版本歷史（release_note.txt）

| 版本   | 日期       | ESP32 相關變更                              |
| ------ | ---------- | ------------------------------------------- |
| v1.5.3 | 2021-08-31 | 新增 ESP32 開發板支援 (HardwareSerial only) |
| v1.6.3 | 2022-03-09 | 修復 ESP32 編譯問題                         |
| v1.6.6 | 2022-06-16 | 修復 ESP32 Serial 問題                      |

#### 原始碼分析（src/Pixetto.cpp）

**條件編譯**（第 15-17 行）：

```cpp
#if !ESP32
#include <SoftwareSerial.h>
#endif
```

**ESP32 Serial2 支援**（第 48-51 行）：

```cpp
if ((rx == 16 && tx == 17) || (rx == 19 && tx == 20)) {
    Serial2.begin(speed);
    m_serial = &Serial2;
    return;
}
```

**結論**：Pixetto 庫 v1.6.6 已完整支援 ESP32，使用 HardwareSerial，無需 SoftwareSerial。

### 2. 專案現有開發板判斷模式

**來源**: `media/blockly/generators/arduino/huskylens.js`（第 183-216 行）

HuskyLens UART 初始化已正確實作開發板判斷：

```javascript
// 檢測開發板類型以使用正確的串列埠實作
const currentBoard = window.currentBoard || 'uno';
const isESP32 = currentBoard.includes('esp32');

if (isESP32) {
	// ESP32 使用 HardwareSerial (不支援 SoftwareSerial)
	window.arduinoGenerator.variables_['huskylens_serial'] = 'HardwareSerial huskySerial(1);';
	// 不添加 SoftwareSerial include
} else {
	// Arduino AVR 使用 SoftwareSerial
	window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';
	window.arduinoGenerator.variables_['huskylens_serial'] = `SoftwareSerial huskySerial(${rxPin}, ${txPin});`;
}
```

**結論**：專案已有成熟的開發板判斷模式，Pixetto 應採用相同方式。

### 3. 目前 Pixetto 實作問題

**來源**: `media/blockly/generators/arduino/pixetto.js`（第 55-72 行）

```javascript
// 問題：無條件添加 SoftwareSerial
window.arduinoGenerator.includes_['pixetto'] = '#include <Pixetto.h>';
window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>'; // ❌ 問題

// 問題：無條件添加 AVR 專用 build_flags
const pixettoBuildFlag = '-I"$PROJECT_PACKAGES_DIR/framework-arduino-avr/libraries/SoftwareSerial/src"'; // ❌ 問題
window.arduinoGenerator.build_flags_.push(pixettoBuildFlag);
```

**問題**：

1. ESP32 不需要 `#include <SoftwareSerial.h>`
2. AVR 專用路徑 `framework-arduino-avr` 在 ESP32 不存在

### 4. 函式庫版本確認

**目前使用**: `pixetto/Pixetto@^1.6.6`

**驗證**: PlatformIO Registry 格式正確，^1.6.6 允許小版本更新同時鎖定主版本。

## 決策

| 決策           | 選擇                                    | 理由                                   |
| -------------- | --------------------------------------- | -------------------------------------- |
| 開發板判斷方式 | `window.currentBoard.includes('esp32')` | 與 HuskyLens 一致，支援所有 ESP32 變體 |
| ESP32 程式碼   | 只添加 `#include <Pixetto.h>`           | Pixetto 庫內部已處理 HardwareSerial    |
| AVR 程式碼     | 維持現有邏輯                            | 向後相容，不破壞現有使用者             |
| 函式庫版本     | 維持 `pixetto/Pixetto@^1.6.6`           | 穩定版本，包含所有 ESP32 修復          |

## 風險評估

| 風險                     | 機率 | 影響 | 緩解措施                              |
| ------------------------ | ---- | ---- | ------------------------------------- |
| 破壞 AVR 功能            | 低   | 高   | 保持 else 分支與原始邏輯一致          |
| ESP32 變體未識別         | 低   | 中   | 使用 `includes('esp32')` 而非精確匹配 |
| Pixetto 庫更新破壞相容性 | 低   | 中   | 使用 ^1.6.6 語法固定主版本            |

## 參考資料

-   [Pixetto GitHub Repository](https://github.com/pixetto/Pixetto)
-   [Pixetto Release Notes](https://github.com/pixetto/Pixetto/blob/main/release_note.txt)
-   [ESP32 HardwareSerial 文件](https://github.com/espressif/arduino-esp32/blob/master/cores/esp32/HardwareSerial.cpp)
-   [HuskyLens Generator 範本](../../media/blockly/generators/arduino/huskylens.js)
