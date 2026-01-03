# Research: CyberBrick X11 擴展板積木選單

**Branch**: `027-cyberbrick-x11-blocks` | **Date**: 2026-01-03

## 研究項目

### 1. CyberBrick bbl.servos 和 bbl.motors 模組 API

**決策**: 使用 CyberBrick MicroPython 韌體內建的 `bbl.servos` 和 `bbl.motors` 模組

**調查結果**:

-   `ServosController` (from bbl.servos import ServosController):

    -   `set_angle(port, angle)` - 設定 180° 伺服馬達角度 (port: 1-4, angle: 0-180)
    -   `set_angle_stepping(port, angle, speed)` - 平滑移動到目標角度 (speed: 0-100)
    -   `set_speed(port, speed)` - 設定 360° 伺服馬達速度 (speed: -100 到 100)
    -   `stop(port)` - 停止伺服馬達
    -   `timing_proc()` - 處理平滑移動的定時回調（需要在主循環中呼叫）

-   `MotorsController` (from bbl.motors import MotorsController):
    -   `set_speed(port, speed)` - 設定直流馬達速度 (port: 1-2, speed: -2048 到 2048)
    -   `stop(port)` - 停止直流馬達

**理由**: 這些是 CyberBrick 官方韌體提供的 API，已在目標硬體上預裝

**替代方案考量**:

-   直接使用 PWM 控制 - 拒絕，因為需要更複雜的初始化且不支援 X11 擴展板專用功能
-   使用第三方伺服馬達庫 - 拒絕，因為 CyberBrick 韌體已提供優化版本

---

### 2. LED 燈條控制方案

**決策**: 使用原生 MicroPython `neopixel` 模組配合 `machine.Pin`

**調查結果**:

-   D1 埠對應 GPIO 20
-   D2 埠對應 GPIO 21
-   每個 LED Hub (XA006) 支援 4 顆 WS2812 LED
-   NeoPixel API:
    ```python
    from machine import Pin
    from neopixel import NeoPixel
    np = NeoPixel(Pin(20), 4)  # D1 埠，4 顆 LED
    np[0] = (255, 0, 0)  # 第 1 顆設為紅色
    np.write()  # 立即生效
    ```

**理由**: 原生 NeoPixel API 簡單直觀，支援單顆獨立控制，無需 timing_proc()

**替代方案考量**:

-   使用 `bbl.leds.LEDController.set_led_effect()` - 拒絕，因為這是 LED 效果 API，不適合單顆獨立控制
-   使用原生 NeoPixel 需要用戶理解 GPIO 映射 - 接受，透過下拉選單隱藏底層細節

---

### 3. timing_proc() 自動注入機制

**決策**: 在 MicroPython 生成器的 `finish()` 方法中檢測是否使用了平滑移動積木，若有則在主程式結尾注入 `servos.timing_proc()`

**調查結果**:

-   現有 `finish()` 方法已處理 import 和硬體初始化的注入
-   可透過新增 `generator.requiresTimingProc` 旗標追蹤是否需要注入
-   只有 `set_angle_stepping` 需要 timing_proc()
-   `set_angle`、`set_speed`、`stop` 都是立即生效，不需要 timing_proc()

**理由**: 自動注入降低使用者學習門檻，避免忘記呼叫 timing_proc() 導致平滑移動失效

**實作方式**:

1. 在 `servos_stepping` 生成器中設置 `generator.requiresTimingProc = true`
2. 在 `finish()` 中檢查此旗標，若為 true 則在 main() 結尾加入 `servos.timing_proc()`

---

### 4. Toolbox 結構與分組

**決策**: 在 cyberbrick.json 中新增 X11 擴展板類別，使用 Label 分隔不同元件類型

**調查結果**:

-   現有 Toolbox 結構使用 `$include` 引入分類 JSON 檔案
-   Label 使用 i18n key 格式: `%{LABEL_KEY_NAME}`
-   類別顏色使用 `categorystyle` 或直接指定 `colour`
-   X11 擴展板顏色: HSV 180 (青色)

**檔案結構**:

```
media/toolbox/categories/
├── cyberbrick_x11.json  # 新增
```

**分組**:

1. 伺服馬達 (Servos)
    - 伺服馬達(180°) 轉到角度
    - 伺服馬達(180°) 平滑轉到角度
    - 伺服馬達(360°) 速度
    - 停止伺服馬達
2. 直流馬達 (DC Motors)
    - 直流馬達速度
    - 停止直流馬達
3. LED 燈條 (LED Strip)
    - LED 燈條設定顏色
    - 關閉 LED 燈條

---

### 5. 國際化 (i18n) 策略

**決策**: 為所有 15 種支援語言新增翻譯鍵

**調查結果**:

-   支援語言: bg, cs, de, en, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant
-   翻譯鍵命名慣例: `X11_` 前綴用於 X11 擴展板相關
-   使用 `npm run validate:i18n` 驗證翻譯完整性

**需要新增的鍵**:

-   類別: CATEGORY_X11
-   標籤: X11_LABEL_SERVOS, X11_LABEL_MOTORS, X11_LABEL_LEDS
-   積木: X11*SERVO_180*_, X11*SERVO_360*_, X11*MOTOR*_, X11*LED*_
-   Tooltips: 每個積木對應的 \_TOOLTIP 鍵

---

### 6. 數值範圍約束處理

**決策**: 在生成的程式碼中使用 Python 內建 `max(min(...))` 進行 clamp

**調查結果**:

-   Blockly 的 `FieldNumber` 支援 min/max 約束，但用戶可透過變數繞過
-   在生成器中進行 clamp 確保運行時安全:

    ```python
    # 角度 clamp
    servos.set_angle(1, max(0, min(180, angle)))

    # 速度 clamp
    servos.set_speed(1, max(-100, min(100, speed)))

    # 馬達速度 clamp
    motors.set_speed(1, max(-2048, min(2048, speed)))
    ```

**理由**: 防止超出範圍的值損壞硬體或導致不可預期行為

---

### 7. 埠位映射

**決策**: 使用下拉選單隱藏底層 GPIO/埠位編號

**調查結果**:

-   伺服馬達: S1-S4 → port 1-4
-   直流馬達: M1-M2 → port 1-2
-   LED 燈條: D1-D2 → GPIO 20-21

**實作方式**:

```javascript
// 伺服馬達埠位選項
[
	['S1', '1'],
	['S2', '2'],
	['S3', '3'],
	['S4', '4'],
][
	// 直流馬達埠位選項
	(['M1', '1'], ['M2', '2'])
][
	// LED 埠位選項
	(['D1', '20'], ['D2', '21'])
];
```

---

## 技術決策摘要

| 項目             | 決策                     | 理由                       |
| ---------------- | ------------------------ | -------------------------- |
| 伺服馬達 API     | bbl.servos               | CyberBrick 官方韌體 API    |
| 直流馬達 API     | bbl.motors               | CyberBrick 官方韌體 API    |
| LED 控制         | 原生 NeoPixel            | 支援單顆獨立控制，簡單直觀 |
| timing_proc 注入 | 自動在 finish() 中注入   | 降低使用門檻               |
| 數值約束         | 程式碼中 clamp           | 運行時安全保護             |
| Toolbox 結構     | 新增 cyberbrick_x11.json | 符合現有模組化結構         |
| i18n             | 15 語言完整翻譯          | 符合專案國際化標準         |
