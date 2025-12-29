# Research: CyberBrick MicroPython 積木支援

**Date**: 2025-12-29  
**Feature Branch**: `021-cyberbrick-micropython`

## 研究摘要

本文件記錄 CyberBrick MicroPython 功能開發所需的技術研究結果，涵蓋 mpremote 上傳工具、ESP32-C3 GPIO 配置、MicroPython API 以及程式碼生成架構。

---

## 1. mpremote 上傳工具研究

### 1.1 工具概述

**mpremote** 是 MicroPython 官方提供的命令列工具，用於透過串列埠與 MicroPython 裝置互動。

-   **安裝方式**: `pip install mpremote`
-   **最低版本**: 建議 1.20+
-   **官方文件**: https://docs.micropython.org/en/latest/reference/mpremote.html

### 1.2 核心命令

| 命令         | 功能     | 範例                                      |
| ------------ | -------- | ----------------------------------------- |
| `connect`    | 連接裝置 | `mpremote connect COM3`                   |
| `disconnect` | 斷開連接 | `mpremote disconnect`                     |
| `soft-reset` | 軟體重置 | `mpremote soft-reset`                     |
| `reset`      | 硬體重置 | `mpremote reset`                          |
| `fs cp`      | 複製檔案 | `mpremote fs cp main.py :/app/rc_main.py` |
| `run`        | 執行腳本 | `mpremote run test.py`                    |

### 1.3 上傳工作流程（CyberBrick）

**Decision**: 使用 `reset` + `soft-reset` 序列確保程式中斷

**Rationale**: 根據 mpremote 文件，`soft-reset` 會清除 Python heap 並重啟解譯器，而 `reset` 會執行硬體重置。組合使用可確保裝置處於乾淨狀態。

**工作流程**:

```bash
# 1. 連接裝置並中斷執行中程式
mpremote connect COM3 reset

# 2. 等待裝置重啟
mpremote connect COM3 soft-reset

# 3. 上傳程式到指定路徑
mpremote connect COM3 fs cp main.py :/app/rc_main.py

# 4. 重啟執行新程式
mpremote connect COM3 reset
```

**完整單行命令**:

```bash
mpremote connect COM3 reset + soft-reset + fs cp main.py :/app/rc_main.py + reset
```

### 1.4 自動偵測連接埠

**Decision**: 使用 mpremote 的 `connect list` 功能列出裝置

**Rationale**: mpremote 已內建 USB VID/PID 偵測功能，可自動識別 MicroPython 裝置。

```bash
mpremote connect list
```

輸出範例:

```
COM3 303a:1001 Microsoft None
COM4 0403:6001 FTDI FT232R USB UART
```

### 1.5 PlatformIO Python 環境整合

**Decision**: 使用 PlatformIO 的 Python 環境執行 mpremote

**Rationale**:

1. 避免要求使用者另外安裝 Python
2. PlatformIO 已包含可用的 pip 環境
3. 與現有 PlatformIO 整合一致

**Python 環境路徑**:

-   Windows: `%USERPROFILE%\.platformio\penv\Scripts\python.exe`
-   macOS/Linux: `~/.platformio/penv/bin/python`

**安裝 mpremote**:

```bash
# Windows
%USERPROFILE%\.platformio\penv\Scripts\pip.exe install mpremote

# macOS/Linux
~/.platformio/penv/bin/pip install mpremote
```

### 1.6 Alternatives Considered

| 方案            | 優點               | 缺點             | 結論      |
| --------------- | ------------------ | ---------------- | --------- |
| mpremote (選用) | 官方工具、功能完整 | 需額外安裝       | ✅ 採用   |
| pyboard.py      | 內建 MicroPython   | 功能較少、API 舊 | ❌ 不採用 |
| ampy            | 簡單易用           | 已停止維護       | ❌ 不採用 |
| 自製上傳器      | 完全控制           | 開發成本高       | ❌ 不採用 |

---

## 2. ESP32-C3 GPIO 配置研究

### 2.1 CyberBrick 硬體規格

根據 CyberBrick 產品文件：

| 項目     | 規格               |
| -------- | ------------------ |
| MCU      | ESP32-C3 RISC-V    |
| Flash    | 4MB                |
| PSRAM    | 無                 |
| 板載 LED | GPIO 8, WS2812 x 1 |
| WiFi     | 802.11 b/g/n       |
| 藍牙     | 已禁用             |
| USB      | 原生 USB CDC       |

### 2.2 GPIO 可用性分析

**Decision**: 提供 GPIO 0-7, 9-10 給使用者，GPIO 8 保留給板載 LED

| GPIO       | 用途         | ADC      | PWM | 說明                       |
| ---------- | ------------ | -------- | --- | -------------------------- |
| GPIO 0     | 使用者 IO    | ADC1_CH0 | ✅  | 安全使用                   |
| GPIO 1     | 使用者 IO    | ADC1_CH1 | ✅  | 安全使用                   |
| GPIO 2     | 使用者 IO    | ADC1_CH2 | ✅  | ⚠️ Strapping Pin，建議避免 |
| GPIO 3     | 使用者 IO    | ADC1_CH3 | ✅  | 安全使用                   |
| GPIO 4     | 使用者 IO    | ADC1_CH4 | ✅  | 安全使用                   |
| GPIO 5     | 使用者 IO    | ADC2_CH0 | ✅  | ⚠️ WiFi 開啟時 ADC 不可用  |
| GPIO 6     | 使用者 IO    | ❌       | ✅  | 安全使用                   |
| GPIO 7     | 使用者 IO    | ❌       | ✅  | 安全使用                   |
| **GPIO 8** | **板載 LED** | ❌       | ✅  | ⚠️ 專用 WS2812             |
| GPIO 9     | 使用者 IO    | ❌       | ✅  | ⚠️ BOOT 按鈕，小心使用     |
| GPIO 10    | 使用者 IO    | ❌       | ✅  | 安全使用                   |

### 2.3 ADC 衰減設定

**Decision**: 預設使用 `ATTN_11DB`（0-2.45V 範圍）

**Rationale**: 涵蓋大部分感測器輸出範圍，且與 Arduino analogRead 行為類似。

| 衰減值        | 輸入範圍   | 用途                     |
| ------------- | ---------- | ------------------------ |
| ATTN_0DB      | 100-950mV  | 精確低壓測量             |
| ATTN_2_5DB    | 100-1250mV | 精確中壓測量             |
| ATTN_6DB      | 150-1750mV | 一般感測器               |
| **ATTN_11DB** | 150-2450mV | **預設，涵蓋 3.3V 分壓** |

---

## 3. MicroPython 程式碼生成研究

### 3.1 程式碼架構

**Decision**: 生成單一檔案程式，包含所有 import 和主迴圈

**Rationale**:

1. 簡化上傳流程（僅一個檔案）
2. 適合教育用途
3. 與現有 Arduino 生成行為一致

**程式碼範本**:

```python
# 自動生成的 import 區塊
from machine import Pin, ADC, PWM
from neopixel import NeoPixel
import time

# 硬體初始化區塊
onboard_led = NeoPixel(Pin(8), 1)

# 使用者定義函數區塊
def user_function():
    pass

# 主程式區塊
while True:
    # 使用者積木生成的程式碼
    pass
```

### 3.2 Import 管理策略

**Decision**: 使用 Set 收集需要的 import，程式碼生成時統一輸出

**Rationale**: 避免重複 import，確保程式碼可執行。

```javascript
// 生成器追蹤 imports
micropythonGenerator.imports_ = new Set();

// 使用 NeoPixel 積木時
micropythonGenerator.imports_.add('from neopixel import NeoPixel');
micropythonGenerator.imports_.add('from machine import Pin');

// 最終生成時合併
const importsCode = Array.from(micropythonGenerator.imports_).sort().join('\n');
```

### 3.3 Arduino vs MicroPython 對照

| 功能     | Arduino                   | MicroPython                  |
| -------- | ------------------------- | ---------------------------- |
| 數位輸出 | `digitalWrite(pin, HIGH)` | `Pin(pin, Pin.OUT).value(1)` |
| 數位輸入 | `digitalRead(pin)`        | `Pin(pin, Pin.IN).value()`   |
| 類比輸入 | `analogRead(pin)`         | `ADC(Pin(pin)).read()`       |
| PWM 輸出 | `analogWrite(pin, duty)`  | `PWM(Pin(pin), duty=duty)`   |
| 延時(ms) | `delay(ms)`               | `time.sleep_ms(ms)`          |
| 延時(s)  | `delay(ms*1000)`          | `time.sleep(s)`              |

---

## 4. USB VID/PID 偵測

### 4.1 ESP32-C3 識別碼

**Decision**: 支援 Espressif 官方 VID/PID 作為主要識別

| 項目             | 值                                  |
| ---------------- | ----------------------------------- |
| Vendor ID (VID)  | `0x303A` (Espressif)                |
| Product ID (PID) | `0x1001` (ESP32-C3 USB JTAG/Serial) |

### 4.2 連接埠偵測實作

**Decision**: 優先使用 mpremote list，備援使用 serialport 列舉

```typescript
interface ComPortInfo {
	path: string; // COM3, /dev/ttyACM0
	vendorId: string; // 303A
	productId: string; // 1001
}

// 偵測邏輯
async function detectCyberBrick(): Promise<ComPortInfo | null> {
	// 1. 嘗試 mpremote connect list
	const result = await exec('mpremote connect list');
	const ports = parseMpremoteOutput(result);

	// 2. 篩選 ESP32-C3
	return ports.find(p => p.vendorId === '303A' && p.productId === '1001');
}
```

---

## 5. 工具箱切換機制

### 5.1 現有架構分析

目前 `media/toolbox/index.json` 使用 `$include` 載入分類：

```json
{
  "kind": "categoryToolbox",
  "contents": [
    { "$include": "./categories/arduino.json" },
    { "$include": "./categories/motors.json" },
    ...
  ]
}
```

### 5.2 多語言工具箱方案

**Decision**: 為 CyberBrick 建立獨立工具箱檔案

**Rationale**:

1. MicroPython 積木與 Arduino 積木完全不同
2. 避免複雜的條件載入邏輯
3. 便於未來擴展其他 MicroPython 主板

**檔案結構**:

```
media/toolbox/
├── index.json           # Arduino 工具箱（預設）
└── cyberbrick.json      # CyberBrick MicroPython 工具箱
```

### 5.3 工具箱切換時機

切換發生於：

1. 主板選單變更時
2. 載入包含不同主板設定的工作區時

---

## 6. 備份機制研究

### 6.1 備份目錄結構

**Decision**: 使用 `blockly/backups/` 目錄，檔名包含時間戳記和來源資訊

```
{workspace}/
└── blockly/
    ├── main.json              # 當前工作區
    └── backups/
        ├── 2024-12-29T10-30-00_arduino_uno.json   # 工作區備份
        ├── 2024-12-29T10-30-01_cyberbrick_rc_main.py  # 裝置程式備份
        └── manifest.json      # 備份清單（可選）
```

### 6.2 備份檔案格式

**工作區備份** (JSON):

```json
{
	"timestamp": "2024-12-29T10:30:00.000Z",
	"sourceBoard": "arduino_uno",
	"targetBoard": "cyberbrick",
	"workspace": {
		/* Blockly 序列化資料 */
	}
}
```

**裝置程式備份** (原始 Python):

```python
# 直接儲存從裝置讀取的檔案內容
```

---

## 7. 研究結論

### 關鍵決策摘要

| 決策項目    | 選擇            | 理由                                |
| ----------- | --------------- | ----------------------------------- |
| 上傳工具    | mpremote        | 官方工具、功能完整、支援 auto-reset |
| Python 環境 | PlatformIO penv | 避免額外安裝、與現有整合一致        |
| 程式碼結構  | 單一檔案        | 簡化上傳、適合教育                  |
| 工具箱      | 獨立檔案        | 清晰分離、易於維護                  |
| Import 管理 | Set 收集        | 避免重複、統一輸出                  |
| ADC 預設    | ATTN_11DB       | 涵蓋常用感測器範圍                  |

### 待確認事項

1. ✅ CyberBrick 的 `/app/rc_main.py` 路徑（已確認）
2. ✅ CyberBrick 實際 USB VID/PID（VID=0x303A, PID=0x1001，已從官方倉庫確認）
3. ✅ GPIO 腳位對應（從 CyberBrick_ESPNOW 專案確認）
4. ⏳ 板載 LED WS2812 的 RGB 順序（RGB or GRB，需實機測試）

### 風險評估

| 風險                   | 影響     | 緩解措施                                         |
| ---------------------- | -------- | ------------------------------------------------ |
| mpremote 安裝失敗      | 無法上傳 | 提供詳細錯誤訊息和手動安裝指南                   |
| USB 權限問題           | 無法連接 | 提示使用者檢查驅動程式/權限                      |
| 裝置無回應             | 上傳失敗 | 實作超時和重試機制                               |
| bbl_product 模組不可用 | 執行錯誤 | 不依賴官方 frozen 模組，使用標準 MicroPython API |
| 6 PWM 限制             | 功能受限 | 明確記錄馬達/伺服使用限制                        |

---

## 8. CyberBrick 官方儲存庫研究

### 8.1 CyberBrick_Controller_Core 分析

**來源**: https://github.com/CyberBrick-Official/CyberBrick_Controller_Core

#### 專案結構

```
CyberBrick_Controller_Core/
├── src/
│   ├── app_rc/              # RC 遙控應用程式
│   │   ├── boot.py          # 啟動腳本
│   │   └── app/
│   │       ├── rc_main.py   # 主程式 (~316 行)
│   │       ├── control.py   # 控制邏輯 (~1151 行)
│   │       ├── devices.py   # 裝置定義
│   │       └── parser.py    # 資料解析
│   └── app_timelapse/       # 延時攝影應用
├── tools/                   # 開發工具
└── docs/                    # 文件
```

#### 啟動流程 (boot.py)

```python
import bbl_product
import sys

_PRODUCT_NAME = "RC"
_PRODUCT_VERSION = "01.00.00.21"

bbl_product.set_app_name(_PRODUCT_NAME)
bbl_product.set_app_version(_PRODUCT_VERSION)

sys.path.append('/app')
import rc_main
rc_main.main()
```

**重要發現**:

1. `bbl_product` 是 CyberBrick **專有 frozen 模組**，不對外開放
2. 程式存放於 `/app/` 目錄
3. 入口點為 `rc_main.main()`

#### 裝置定義 (devices.py)

```python
class Devices:
    MOTOR_1 = 1
    MOTOR_2 = 2
    LED_1 = 3
    LED_2 = 4
    PWM_1 = 5
    PWM_2 = 6
    PWM_3 = 7
    PWM_4 = 8
    BUZZER_1 = 9
    BUZZER_2 = 10
    CODE_EXEC = 11
```

**CyberBrick 硬體能力**:

-   2 個有刷馬達通道 (MOTOR_1, MOTOR_2)
-   2 個 NeoPixel LED 通道 (LED_1, LED_2)
-   4 個 PWM/伺服通道 (PWM_1~PWM_4)
-   2 個蜂鳴器通道（已移除以節省記憶體）

#### 官方程式碼特性

-   使用 `uasyncio` 非同步框架
-   使用 `ulogger` 日誌模組
-   使用 `ujson` JSON 解析
-   使用 `machine.Timer` 計時器
-   載入配置檔：`/config/rc_conf.json`

### 8.2 CyberBrick_ESPNOW 分析

**來源**: https://github.com/rotorman/CyberBrick_ESPNOW

#### 專案概述

-   **用途**: 使用 ESP-NOW 協議取代官方 App 控制
-   **授權**: GPL-3.0
-   **優勢**: 完全開源，無 frozen 模組依賴

#### GPIO 腳位對應（已確認）

從 `genericRGB.py` 和 `truck.py` 提取的實際腳位：

| 功能           | GPIO | MicroPython 程式碼        | 說明                        |
| -------------- | ---- | ------------------------- | --------------------------- |
| **使用者按鈕** | 9    | `button = Pin(9, Pin.IN)` | 板載按鈕                    |
| **伺服 1**     | 3    | `PWM(Pin(3), freq=50)`    | 伺服馬達通道 1              |
| **伺服 2**     | 2    | `PWM(Pin(2), freq=50)`    | 伺服馬達通道 2              |
| **伺服 3**     | 1    | `PWM(Pin(1), freq=50)`    | 伺服馬達通道 3              |
| **伺服 4**     | 0    | `PWM(Pin(0), freq=50)`    | 伺服馬達通道 4              |
| **馬達 1A**    | 4    | `PWM(Pin(4), freq=500)`   | 有刷馬達 1 正轉             |
| **馬達 1B**    | 5    | `PWM(Pin(5), freq=500)`   | 有刷馬達 1 反轉             |
| **馬達 2A**    | 6    | `PWM(Pin(6), freq=500)`   | 有刷馬達 2 正轉             |
| **馬達 2B**    | 7    | `PWM(Pin(7), freq=500)`   | 有刷馬達 2 反轉             |
| **LED 通道 1** | 10   | `NeoPixel(Pin(10), 4)`    | NeoPixel 字串 1（4 顆 LED） |
| **LED 通道 2** | 8    | `NeoPixel(Pin(8), 4)`     | NeoPixel 字串 2（4 顆 LED） |

#### PWM 頻率設定

| 裝置類型 | 頻率   | 說明                           |
| -------- | ------ | ------------------------------ |
| 伺服馬達 | 50 Hz  | 標準伺服 PWM 頻率（20ms 週期） |
| 有刷馬達 | 500 Hz | 比原廠 50Hz 更平滑的馬達控制   |

#### 伺服馬達脈寬範圍

```python
# 伺服中點: 1.5ms = 65535/20 * 1.5 = 4915 duty_u16
# 最小: 0.5ms (SERVOPULSE_0_5MS_TICKS)
# 最大: 2.5ms (SERVOPULSE_2_5MS_TICKS)
```

#### 6 PWM 輸出限制

**重要發現**: ESP32-C3 硬體限制同時最多 6 個 PWM 輸出

-   每個伺服需要 1 個 PWM
-   每個有刷馬達需要 2 個 PWM
-   組合範例：2 馬達 + 2 伺服 ✅ (2×2 + 2×1 = 6)
-   不可能：2 馬達 + 4 伺服 ❌ (2×2 + 4×1 = 8)

#### WiFi 配置

```python
wifi_channel = 1  # WiFi 通道 (1-11)
sta = network.WLAN(network.STA_IF)
sta.active(True)
mac = sta.config('mac')
```

### 8.3 CyberBrick vs 開源方案比較

| 特性            | 官方 CyberBrick | CyberBrick_ESPNOW     |
| --------------- | --------------- | --------------------- |
| 授權            | 專有            | GPL-3.0               |
| frozen 模組依賴 | ✅ 需要 bbl\_\* | ❌ 純標準 MicroPython |
| 馬達控制精度    | ~41 級          | 4096 級 (12-bit)      |
| 伺服角度精度    | ~102 級         | 4096 級               |
| 馬達 PWM 頻率   | 50 Hz           | 500 Hz                |
| NeoPixel 控制   | 透過配置檔      | 直接程式碼控制        |
| 配置方式        | App / JSON      | 程式碼內直接定義      |

### 8.4 對 Singular Blockly 的設計啟示

#### 採用開源方案設計

**Decision**: 基於 CyberBrick_ESPNOW 的開源實作設計積木

**Rationale**:

1. 不依賴專有 frozen 模組
2. 提供完整的硬體控制
3. 程式碼透明可學習
4. 更好的控制精度

#### 預定義腳位常數

```python
# CyberBrick 硬體常數（建議加入生成程式碼）
CYBERBRICK_BUTTON = 9
CYBERBRICK_SERVO1 = 3
CYBERBRICK_SERVO2 = 2
CYBERBRICK_SERVO3 = 1
CYBERBRICK_SERVO4 = 0
CYBERBRICK_MOTOR1A = 4
CYBERBRICK_MOTOR1B = 5
CYBERBRICK_MOTOR2A = 6
CYBERBRICK_MOTOR2B = 7
CYBERBRICK_LED1 = 10
CYBERBRICK_LED2 = 8
```

#### 積木設計建議

1. **伺服馬達積木**: 使用 0.5-2.5ms 脈寬範圍
2. **有刷馬達積木**: 支援 -100 ~ +100 速度值，映射到雙 PWM
3. **NeoPixel 積木**: 預設 4 顆 LED，支援 RGB 色彩
4. **PWM 限制提示**: 當超過 6 個 PWM 時顯示警告

### 8.5 程式碼範例（基於開源實作）

#### 馬達控制

```python
from machine import Pin, PWM

# 初始化馬達 1
M1A = PWM(Pin(4), freq=500, duty_u16=0)
M1B = PWM(Pin(5), freq=500, duty_u16=0)

def set_motor(speed):
    """設定馬達速度 (-100 ~ +100)"""
    if -5 < speed < 5:  # 死區
        M1A.duty_u16(0)
        M1B.duty_u16(0)
    elif speed > 0:
        M1A.duty_u16(0)
        M1B.duty_u16(int(speed * 655.35))
    else:
        M1A.duty_u16(int(-speed * 655.35))
        M1B.duty_u16(0)
```

#### 伺服馬達控制

```python
from machine import Pin, PWM

# 伺服中點 duty = 65535/20 * 1.5 = 4915
SERVO_CENTER = 4915
SERVO_MIN = 1638   # 0.5ms
SERVO_MAX = 8192   # 2.5ms

S1 = PWM(Pin(3), freq=50, duty_u16=SERVO_CENTER)

def set_servo_angle(angle):
    """設定伺服角度 (0-180 度)"""
    duty = int(SERVO_MIN + (SERVO_MAX - SERVO_MIN) * angle / 180)
    S1.duty_u16(duty)
```

#### NeoPixel LED 控制

```python
from machine import Pin
from neopixel import NeoPixel

# LED 通道 1 (4 顆 LED)
led1 = NeoPixel(Pin(10), 4)

# 設定所有 LED 為紅色
for i in range(4):
    led1[i] = (255, 0, 0)
led1.write()

# 設定單顆 LED
led1[0] = (0, 255, 0)  # 綠色
led1.write()
```

### 8.6 參考資源

-   [CyberBrick 官方文件](https://makerworld.com/en/cyberbrick/api-doc/)
-   [CyberBrick_Controller_Core](https://github.com/CyberBrick-Official/CyberBrick_Controller_Core)
-   [CyberBrick_ESPNOW](https://github.com/rotorman/CyberBrick_ESPNOW)
-   [CyberBrick MicroPython ESP-NOW API](https://makerworld.com/en/cyberbrick/api-doc/library/espnow.html)
