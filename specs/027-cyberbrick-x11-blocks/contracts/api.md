# API Contracts: CyberBrick X11 擴展板積木

**Branch**: `027-cyberbrick-x11-blocks` | **Date**: 2026-01-03

## MicroPython 生成器 API

### ServosController API (bbl.servos)

```python
from bbl.servos import ServosController

# 初始化
servos = ServosController()

# 180° 伺服馬達 - 直接角度控制
servos.set_angle(port: int, angle: int) -> None
# port: 1-4 (對應 S1-S4)
# angle: 0-180

# 180° 伺服馬達 - 平滑移動
servos.set_angle_stepping(port: int, angle: int, speed: int) -> None
# port: 1-4
# angle: 0-180
# speed: 0-100 (百分比)

# 360° 伺服馬達 - 速度控制
servos.set_speed(port: int, speed: int) -> None
# port: 1-4
# speed: -100 到 100 (正值順時針、負值逆時針)

# 停止伺服馬達
servos.stop(port: int) -> None
# port: 1-4

# 定時處理 (僅平滑移動需要)
servos.timing_proc() -> None
# 必須在主循環中呼叫以處理平滑移動
```

### MotorsController API (bbl.motors)

```python
from bbl.motors import MotorsController

# 初始化
motors = MotorsController()

# 設定直流馬達速度
motors.set_speed(port: int, speed: int) -> None
# port: 1-2 (對應 M1-M2)
# speed: -2048 到 2048 (正值正轉、負值反轉)

# 停止直流馬達
motors.stop(port: int) -> None
# port: 1-2
```

### NeoPixel API (內建)

```python
from machine import Pin
from neopixel import NeoPixel

# 初始化 (每個 D 埠一個實例，依據 bbl.leds 源碼: LED_CHANNEL1=21, LED_CHANNEL2=20)
np_d1 = NeoPixel(Pin(21), 4)  # D1 埠，4 顆 LED
np_d2 = NeoPixel(Pin(20), 4)  # D2 埠，4 顆 LED

# 設定單顆 LED 顏色
np_d1[index] = (red: int, green: int, blue: int)
# index: 0-3
# red, green, blue: 0-255

# 寫入更新
np_d1.write() -> None
```

---

## Blockly 積木 API

### Block Definition Interface

```typescript
interface BlockDefinition {
	type: string; // 積木唯一識別碼
	init(): void; // 初始化函式
	getFields(): FieldConfig[];
	getInputs(): InputConfig[];
	getConnections(): ConnectionConfig;
}

interface FieldConfig {
	name: string;
	type: 'dropdown' | 'number' | 'checkbox';
	options?: [string, string][]; // dropdown 選項 [display, value]
	min?: number; // number 最小值
	max?: number; // number 最大值
	precision?: number; // number 精度
}

interface InputConfig {
	name: string;
	type: 'value' | 'statement';
	check?: string | string[]; // 類型檢查
}

interface ConnectionConfig {
	previousStatement: boolean;
	nextStatement: boolean;
	output: string | null;
}
```

### Generator Interface

```typescript
interface MicroPythonBlockGenerator {
	(block: Blockly.Block): string | [string, number];

	// 工具方法
	addImport(statement: string): void;
	addHardwareInit(key: string, code: string): void;
	valueToCode(block: Blockly.Block, name: string, order: number): string;
	statementToCode(block: Blockly.Block, name: string): string;
}
```

---

## 程式碼生成範例

### 範例 1: 180° 伺服馬達角度控制

**積木配置**:

-   PORT: S2
-   ANGLE: 90

**生成的 MicroPython**:

```python
from bbl.servos import ServosController

servos = ServosController()

def main():
    servos.set_angle(2, max(0, min(180, 90)))

if __name__ == '__main__':
    main()
```

### 範例 2: 180° 伺服馬達平滑移動

**積木配置**:

-   PORT: S1
-   ANGLE: 180
-   SPEED: 50

**生成的 MicroPython**:

```python
from bbl.servos import ServosController

servos = ServosController()

def main():
    servos.set_angle_stepping(1, max(0, min(180, 180)), max(0, min(100, 50)))
    servos.timing_proc()  # 自動注入

if __name__ == '__main__':
    main()
```

### 範例 3: 直流馬達控制

**積木配置**:

-   PORT: M1
-   SPEED: 1500

**生成的 MicroPython**:

```python
from bbl.motors import MotorsController

motors = MotorsController()

def main():
    motors.set_speed(1, max(-2048, min(2048, 1500)))

if __name__ == '__main__':
    main()
```

### 範例 4: LED 燈條設定顏色

**積木配置**:

-   PORT: D1
-   INDEX: 2 (第二顆)
-   RED: 0, GREEN: 255, BLUE: 128

**生成的 MicroPython**:

```python
from machine import Pin
from neopixel import NeoPixel

np_d1 = NeoPixel(Pin(21), 4)  # D1 → GPIO 21

def main():
    np_d1[1] = (max(0, min(255, 0)), max(0, min(255, 255)), max(0, min(255, 128)))
    np_d1.write()

if __name__ == '__main__':
    main()
```

### 範例 5: LED 燈條設定全部

**積木配置**:

-   PORT: D2
-   INDEX: all (全部)
-   RED: 255, GREEN: 0, BLUE: 0

**生成的 MicroPython**:

```python
from machine import Pin
from neopixel import NeoPixel

np_d2 = NeoPixel(Pin(20), 4)  # D2 → GPIO 20

def main():
    for i in range(4):
        np_d2[i] = (max(0, min(255, 255)), max(0, min(255, 0)), max(0, min(255, 0)))
    np_d2.write()

if __name__ == '__main__':
    main()
```

---

## 錯誤處理

### 數值範圍越界

所有數值輸入在生成程式碼時自動 clamp 到有效範圍：

| 參數                   | 有效範圍      | clamp 表達式                   |
| ---------------------- | ------------- | ------------------------------ |
| 角度 (angle)           | 0-180         | `max(0, min(180, value))`      |
| 伺服速度 (servo_speed) | -100 到 100   | `max(-100, min(100, value))`   |
| 馬達速度 (motor_speed) | -2048 到 2048 | `max(-2048, min(2048, value))` |
| RGB 值                 | 0-255         | `max(0, min(255, value))`      |
