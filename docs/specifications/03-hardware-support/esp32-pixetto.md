# ESP32 Pixetto 修正規格

> 整合自 specs/012-esp32-pixetto-fix

## 概述

**目標**：修正 ESP32 使用 Pixetto 智慧鏡頭時生成不必要的 SoftwareSerial 相關程式碼

**狀態**：✅ 完成

---

## 問題描述

### 原始問題

Pixetto 初始化積木 (`pixetto_init`) 在生成 Arduino 程式碼時，未針對 ESP32 開發板進行條件判斷，導致：

1. **錯誤引用**：ESP32 使用硬體 Serial2，不需要 SoftwareSerial
2. **無效 build_flags**：AVR 專用路徑在 ESP32 平台不存在
3. **編譯警告**：雖然 Pixetto 庫內部已處理，但仍會嘗試引入不必要標頭檔

### Pixetto 官方庫支援

經查證 [pixetto/Pixetto](https://github.com/pixetto/Pixetto)：

-   v1.5.3 (2021-08-31)：加入 ESP32 支援
-   v1.6.3 (2022-03-09)：修復 ESP32 編譯問題
-   v1.6.6 (2022-06-16)：修復 ESP32 Serial 問題

官方原始碼已有條件編譯：

```cpp
#if !ESP32
#include <SoftwareSerial.h>
#endif
```

---

## 修正方案

### 開發板判斷邏輯

```javascript
// generators/arduino/pixetto.js
arduinoGenerator.forBlock['pixetto_init'] = function (block) {
	const rxPin = block.getFieldValue('RX_PIN');
	const txPin = block.getFieldValue('TX_PIN');

	if (window.currentBoard.includes('esp32')) {
		// ESP32: 使用 HardwareSerial
		arduinoGenerator.includes_['pixetto'] = '#include <Pixetto.h>';
		arduinoGenerator.definitions_['pixetto'] = 'Pixetto ss(Serial2);';
		arduinoGenerator.setups_['pixetto'] = `Serial2.begin(38400, SERIAL_8N1, ${rxPin}, ${txPin});\n` + 'ss.begin();';
		// 不添加 SoftwareSerial build_flags
	} else {
		// AVR: 使用 SoftwareSerial
		arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';
		arduinoGenerator.includes_['pixetto'] = '#include <Pixetto.h>';
		arduinoGenerator.definitions_['pixetto'] = `SoftwareSerial sSerial(${rxPin}, ${txPin});\n` + 'Pixetto ss(sSerial);';
		arduinoGenerator.setups_['pixetto'] = 'sSerial.begin(38400);\n' + 'ss.begin();';
		// 添加 AVR SoftwareSerial build_flags
		arduinoGenerator.build_flags_.push('-I ${platformio.packages_dir}/framework-arduino-avr/libraries/SoftwareSerial/src');
	}

	arduinoGenerator.lib_deps_.push('pixetto/Pixetto@^1.6.6');
	return '';
};
```

---

## 程式碼生成對比

### ESP32 生成

```cpp
// ESP32 Pixetto 初始化（使用硬體 Serial2）
#include <Pixetto.h>

Pixetto ss(Serial2);

void setup() {
  Serial2.begin(38400, SERIAL_8N1, 16, 17);  // RX=GPIO16, TX=GPIO17
  ss.begin();
}
```

### Arduino AVR 生成

```cpp
// Arduino Pixetto 初始化（使用 SoftwareSerial）
#include <SoftwareSerial.h>
#include <Pixetto.h>

SoftwareSerial sSerial(10, 11);  // RX, TX
Pixetto ss(sSerial);

void setup() {
  sSerial.begin(38400);
  ss.begin();
}
```

### PlatformIO 設定

```ini
; ESP32 (無 SoftwareSerial 相關設定)
[env:esp32]
platform = espressif32
board = esp32dev
lib_deps =
  pixetto/Pixetto@^1.6.6

; Arduino UNO (需要 SoftwareSerial)
[env:uno]
platform = atmelavr
board = uno
lib_deps =
  pixetto/Pixetto@^1.6.6
build_flags =
  -I ${platformio.packages_dir}/framework-arduino-avr/libraries/SoftwareSerial/src
```

---

## 預設腳位

### ESP32

-   RX: GPIO16
-   TX: GPIO17

這是 ESP32 Serial2 的標準腳位，Pixetto 庫內部支援：

```cpp
if ((rx == 16 && tx == 17) || (rx == 19 && tx == 20)) {
    Serial2.begin(speed);
    m_serial = &Serial2;
}
```

### Arduino UNO/Nano

-   RX: 10 (任意數位腳)
-   TX: 11 (任意數位腳)

---

## 驗收標準

1. ✅ ESP32 生成的程式碼不包含 `#include <SoftwareSerial.h>`
2. ✅ ESP32 的 platformio.ini 不包含 AVR build_flags
3. ✅ Arduino AVR 維持現有行為
4. ✅ 程式碼在兩種平台都能成功編譯

---

## 相關文件

-   Pixetto 官方庫：https://github.com/pixetto/Pixetto
-   積木定義：`media/blockly/blocks/vision_sensors.js`
-   程式碼生成：`media/blockly/generators/arduino/pixetto.js`
