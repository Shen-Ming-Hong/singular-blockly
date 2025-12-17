# ESP32 PWM 設定規格

> 整合自 specs/011-esp32-pwm-setup

## 概述

**目標**：為 ESP32 開發板提供全域 PWM 頻率與解析度設定積木，支援高頻馬達驅動晶片（最高 75KHz）

**狀態**：📝 草稿

---

## 背景

### 為何需要高頻 PWM？

標準 Arduino `analogWrite()` 頻率約 490Hz 或 980Hz，但許多馬達驅動晶片需要更高頻率：

| 晶片     | 建議頻率   | 用途               |
| -------- | ---------- | ------------------ |
| TB6612   | 20-100 KHz | 直流馬達驅動       |
| DRV8833  | 20-75 KHz  | 雙 H 橋驅動        |
| AT8833CR | 20-75 KHz  | DRV8833 相容替代品 |

低頻 PWM 會導致馬達產生高頻噪音。

### ESP32 LEDC 系統

ESP32 使用 LEDC（LED Control）外設提供 PWM 功能：

-   時鐘源：APB_CLK 80MHz
-   限制公式：**頻率 × 2^解析度 ≤ 80,000,000**

---

## 積木規格

### `esp32_pwm_setup`

**用途**：設定 ESP32 全域 PWM 參數

**欄位**：
| 欄位 | 類型 | 範圍 | 預設值 |
|------|------|------|--------|
| FREQUENCY | 數字輸入 | 1-80,000 Hz | 75,000 |
| RESOLUTION | 下拉選單 | 8/10/12/13/14/15/16 bit | 8 |

**解析度對應輸出範圍**：
| 解析度 | 輸出範圍 |
|--------|----------|
| 8 bit | 0-255 |
| 10 bit | 0-1,023 |
| 12 bit | 0-4,095 |
| 16 bit | 0-65,535 |

### 工具箱位置

-   僅在 ESP32 系列板子（`esp32`, `esp32_supermini`）時顯示
-   位於 Arduino 類別，「上拉電阻設定」積木之後

---

## 程式碼生成

### 基本範例

```cpp
// ESP32 PWM 設定: 75000Hz @ 8bit
// 驗證: 75000 × 256 = 19,200,000 < 80,000,000 ✓
const int pwmFrequency = 75000;
const int pwmResolution = 8;

// 在 analogWrite 時使用
int pwmChannel = 0;
ledcSetup(pwmChannel, pwmFrequency, pwmResolution);
ledcAttachPin(25, pwmChannel);
ledcWrite(pwmChannel, 128);
```

### 自動驗證與調整

當使用者設定不相容參數時（如 75000Hz @ 12bit）：

```cpp
// ⚠️ 警告：原始設定 75000Hz @ 12bit 超出限制
// 75000 × 4096 = 307,200,000 > 80,000,000
// 已自動調整為 75000Hz @ 8bit
const int pwmFrequency = 75000;
const int pwmResolution = 8;
```

### 全域配置儲存

```javascript
// 透過 window 變數儲存（不寫入 main.json）
window.esp32PwmFrequency = 75000;
window.esp32PwmResolution = 8;
```

---

## 與其他功能的關係

### 伺服馬達共存

伺服馬達使用 ESP32Servo 庫（固定 50Hz），與 LEDC PWM 獨立運作：

```cpp
// 伺服馬達：ESP32Servo @ 50Hz
#include <ESP32Servo.h>
Servo myServo;
myServo.attach(18);  // GPIO18
myServo.write(90);

// 馬達驅動：LEDC @ 75000Hz
ledcSetup(0, 75000, 8);
ledcAttachPin(25, 0);  // GPIO25
ledcWrite(0, 128);
```

**注意**：不可共用同一腳位

### 類比輸出積木整合

`arduino_analog_write` 積木在 ESP32 環境下會參考全域 PWM 配置：

```javascript
// generators/arduino/arduino.js
arduinoGenerator.forBlock['arduino_analog_write'] = function (block) {
	if (window.currentBoard.includes('esp32')) {
		const freq = window.esp32PwmFrequency || 75000;
		const res = window.esp32PwmResolution || 8;
		// 生成 LEDC 程式碼
	} else {
		// 生成標準 analogWrite
	}
};
```

---

## 驗收標準

1. ✅ 使用者可在 5 分鐘內完成 PWM 設定
2. ✅ 支援 1-80,000 Hz 頻率範圍
3. ✅ 不相容參數 100% 自動調整
4. ✅ 馬達驅動晶片運轉無高頻噪音
5. ✅ 舊專案使用預設值 75000Hz / 8bit
6. ✅ 伺服馬達與高頻 PWM 可同時使用
7. ✅ 程式碼生成在 500ms 內完成

---

## 超出範圍

-   ESP32-S2/S3/C3 的特殊 PWM 配置
-   每腳位獨立頻率設定
-   自動偵測硬體並建議參數
-   WiFi 使用時 ADC2 通道限制

---

## 相關文件

-   積木定義：`media/blockly/blocks/arduino.js`
-   程式碼生成：`media/blockly/generators/arduino/arduino.js`
