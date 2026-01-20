# CyberBrick 擴展板積木規格

> 整合自 specs/027-cyberbrick-x11-blocks 與 specs/028-x12-rc-blocks

## 概述

**目標**：支援 CyberBrick X11（輸出擴展板）與 X12（遙控發射端）的 MicroPython 積木

**狀態**：

- X11 擴展板：✅ 完成
- X12 發射端本機積木：✅ 完成
- RC 遠端通訊積木：⏸️ 延後

---

## X11 擴展板 (cyberbrick_x11)

X11 支援伺服馬達、直流馬達、LED 燈帶控制。

### 伺服馬達積木

| 積木                  | 埠位  | 用途                          | 生成程式碼                      |
| --------------------- | ----- | ----------------------------- | ------------------------------- |
| `x11_servo_180_angle` | S1-S4 | 180° 伺服馬達轉到角度 (0-180) | `servos.set_angle(port, angle)` |
| `x11_servo_360_speed` | S1-S4 | 360° 伺服馬達速度 (-100~100)  | `servos.set_speed(port, speed)` |

**硬體引入**：

```python
from bbl.servos import ServosController
servos = ServosController()
```

### 直流馬達積木

| 積木              | 埠位  | 用途                  | 生成程式碼                      |
| ----------------- | ----- | --------------------- | ------------------------------- |
| `x11_motor_speed` | M1-M2 | 設定速度 (-2048~2048) | `motors.set_speed(port, speed)` |
| `x11_motor_stop`  | M1-M2 | 停止馬達              | `motors.stop(port)`             |

**硬體引入**：

```python
from bbl.motors import MotorsController
motors = MotorsController()
```

### LED 燈帶積木

| 積木                | 埠位  | 用途                | 備註           |
| ------------------- | ----- | ------------------- | -------------- |
| `x11_led_set_color` | D1-D2 | 設定 LED 顏色 (RGB) | 支援單顆或全部 |
| `x11_led_off`       | D1-D2 | 關閉 LED            | 設定為 (0,0,0) |

**硬體引入**：

```python
from machine import Pin
from neopixel import NeoPixel
np_d1 = NeoPixel(Pin(d1_pin), 4)
```

---

## X12 遙控發射端 (cyberbrick_x12)

X12 積木用於讀取發射端搖桿與按鈕的本機狀態。

### 搖桿積木

| 積木                      | 用途             | 回傳值   |
| ------------------------- | ---------------- | -------- |
| `x12_get_joystick`        | 讀取搖桿原始值   | 0-4095   |
| `x12_get_joystick_mapped` | 讀取並映射搖桿值 | 自訂範圍 |

**搖桿軸對應**：

- `L1` - 左搖桿 X 軸
- `L2` - 左搖桿 Y 軸
- `R1` - 右搖桿 X 軸
- `R2` - 右搖桿 Y 軸

### 按鈕積木

| 積木                    | 用途             | 回傳值  |
| ----------------------- | ---------------- | ------- |
| `x12_is_button_pressed` | 檢查按鈕是否按下 | Boolean |

**按鈕對應**：K1, K2, K3, K4

---

## RC 遠端通訊積木 (cyberbrick_rc) ⏸️

> **狀態**：延後實作，需要雙機測試環境

### 已定義但暫不顯示的積木

| 積木                   | 用途         | 模式   |
| ---------------------- | ------------ | ------ |
| `rc_master_init`       | 初始化發射端 | Master |
| `rc_slave_init`        | 初始化接收端 | Slave  |
| `rc_is_connected`      | 查詢配對狀態 | Both   |
| `rc_get_joystick`      | 讀取遠端搖桿 | Slave  |
| `rc_is_button_pressed` | 讀取遠端按鈕 | Slave  |

**相關檔案（保留但隱藏）**：

- `media/blockly/blocks/rc.js`
- `media/blockly/generators/micropython/rc.js`
- `media/toolbox/categories/cyberbrick_rc.json`

---

## 程式碼生成模式

所有 X11/X12 積木使用統一的 generator 模式：

```javascript
generator.forBlock['x11_servo_180_angle'] = function (block) {
	// 1. 引入模組
	generator.addImport('from bbl.servos import ServosController');

	// 2. 硬體初始化（只執行一次）
	generator.addHardwareInit('servos', 'servos = ServosController()');

	// 3. 取得積木參數
	const port = block.getFieldValue('PORT');
	const angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_NONE) || '0';

	// 4. 生成程式碼（含安全限制）
	return `servos.set_angle(${port}, max(0, min(180, ${angle})))\n`;
};
```

---

## 相關文件

- [CyberBrick MicroPython](cyberbrick-micropython.md) - 主板核心功能
- [RC 範例程式](../../../RC_example/) - 遙控器範例專案
