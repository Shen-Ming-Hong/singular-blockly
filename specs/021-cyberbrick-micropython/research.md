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
2. ⏳ CyberBrick 實際 USB VID/PID（需實機測試）
3. ⏳ 板載 LED WS2812 的 RGB 順序（RGB or GRB）

### 風險評估

| 風險              | 影響     | 緩解措施                       |
| ----------------- | -------- | ------------------------------ |
| mpremote 安裝失敗 | 無法上傳 | 提供詳細錯誤訊息和手動安裝指南 |
| USB 權限問題      | 無法連接 | 提示使用者檢查驅動程式/權限    |
| 裝置無回應        | 上傳失敗 | 實作超時和重試機制             |
