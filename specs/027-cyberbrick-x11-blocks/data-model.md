# Data Model: CyberBrick X11 擴展板積木選單

**Branch**: `027-cyberbrick-x11-blocks` | **Date**: 2026-01-03

## 實體定義

### 1. Blockly 積木類型

#### 1.1 伺服馬達積木 (Servo Blocks)

| 積木類型                 | 欄位                  | 連接點                       | 輸出類型  |
| ------------------------ | --------------------- | ---------------------------- | --------- |
| `x11_servo_180_angle`    | PORT (dropdown S1-S4) | ANGLE (value input, Number)  | Statement |
| `x11_servo_180_stepping` | PORT (dropdown S1-S4) | ANGLE (value), SPEED (value) | Statement |
| `x11_servo_360_speed`    | PORT (dropdown S1-S4) | SPEED (value input, Number)  | Statement |
| `x11_servo_stop`         | PORT (dropdown S1-S4) | -                            | Statement |

**欄位驗證規則**:

-   ANGLE: 0-180 (整數)
-   SPEED (stepping): 0-100 (整數, 百分比)
-   SPEED (360°): -100 到 100 (整數, 百分比)

#### 1.2 直流馬達積木 (DC Motor Blocks)

| 積木類型          | 欄位                  | 連接點                      | 輸出類型  |
| ----------------- | --------------------- | --------------------------- | --------- |
| `x11_motor_speed` | PORT (dropdown M1-M2) | SPEED (value input, Number) | Statement |
| `x11_motor_stop`  | PORT (dropdown M1-M2) | -                           | Statement |

**欄位驗證規則**:

-   SPEED: -2048 到 2048 (整數)

#### 1.3 LED 燈條積木 (LED Strip Blocks)

| 積木類型            | 欄位                                             | 連接點                          | 輸出類型  |
| ------------------- | ------------------------------------------------ | ------------------------------- | --------- |
| `x11_led_set_color` | PORT (dropdown D1-D2), INDEX (dropdown 1-4/全部) | RED, GREEN, BLUE (value inputs) | Statement |
| `x11_led_off`       | PORT (dropdown D1-D2), INDEX (dropdown 1-4/全部) | -                               | Statement |

**欄位驗證規則**:

-   RED, GREEN, BLUE: 0-255 (整數)
-   INDEX: 1, 2, 3, 4, 或 "all" (全部)

---

### 2. MicroPython 生成器狀態

```typescript
interface MicroPythonGeneratorState {
	// 現有欄位
	imports_: Set<string>; // import 語句集合
	hardwareInits_: Map<string, string>; // 硬體初始化映射

	// 新增欄位
	requiresTimingProc: boolean; // 是否需要注入 timing_proc()
}
```

---

### 3. 埠位映射表

```typescript
// 伺服馬達埠位
const SERVO_PORTS = {
	S1: 1,
	S2: 2,
	S3: 3,
	S4: 4,
};

// 直流馬達埠位
const MOTOR_PORTS = {
	M1: 1,
	M2: 2,
};

// LED 燈條 GPIO 映射
const LED_GPIO = {
	D1: 20,
	D2: 21,
};

// LED 索引映射
const LED_INDEX = {
	'1': 0,
	'2': 1,
	'3': 2,
	'4': 3,
	all: [0, 1, 2, 3],
};
```

---

### 4. Toolbox 類別結構

```json
{
	"kind": "category",
	"name": "%{CATEGORY_X11}",
	"colour": "180",
	"contents": [
		// 伺服馬達區段
		{ "kind": "label", "text": "%{X11_LABEL_SERVOS}" },
		{ "kind": "block", "type": "x11_servo_180_angle" },
		{ "kind": "block", "type": "x11_servo_180_stepping" },
		{ "kind": "block", "type": "x11_servo_360_speed" },
		{ "kind": "block", "type": "x11_servo_stop" },

		// 直流馬達區段
		{ "kind": "label", "text": "%{X11_LABEL_MOTORS}" },
		{ "kind": "block", "type": "x11_motor_speed" },
		{ "kind": "block", "type": "x11_motor_stop" },

		// LED 燈條區段
		{ "kind": "label", "text": "%{X11_LABEL_LEDS}" },
		{ "kind": "block", "type": "x11_led_set_color" },
		{ "kind": "block", "type": "x11_led_off" }
	]
}
```

---

### 5. i18n 鍵結構

```typescript
interface X11I18nKeys {
	// 類別與標籤
	CATEGORY_X11: string;
	X11_LABEL_SERVOS: string;
	X11_LABEL_MOTORS: string;
	X11_LABEL_LEDS: string;

	// 伺服馬達 (180°)
	X11_SERVO_180_ANGLE: string; // "伺服馬達(180°) {PORT} 轉到 {ANGLE}°"
	X11_SERVO_180_ANGLE_TOOLTIP: string;
	X11_SERVO_180_STEPPING: string; // "伺服馬達(180°) {PORT} 平滑轉到 {ANGLE}° 速度 {SPEED}%"
	X11_SERVO_180_STEPPING_TOOLTIP: string;

	// 伺服馬達 (360°)
	X11_SERVO_360_SPEED: string; // "伺服馬達(360°) {PORT} 速度 {SPEED}%"
	X11_SERVO_360_SPEED_TOOLTIP: string;

	// 停止伺服馬達
	X11_SERVO_STOP: string; // "停止伺服馬達 {PORT}"
	X11_SERVO_STOP_TOOLTIP: string;

	// 直流馬達
	X11_MOTOR_SPEED: string; // "直流馬達 {PORT} 速度 {SPEED}"
	X11_MOTOR_SPEED_TOOLTIP: string;
	X11_MOTOR_STOP: string; // "停止直流馬達 {PORT}"
	X11_MOTOR_STOP_TOOLTIP: string;

	// LED 燈條
	X11_LED_SET_COLOR: string; // "LED 燈條 {PORT} 第 {INDEX} 顆 R {RED} G {GREEN} B {BLUE}"
	X11_LED_SET_COLOR_TOOLTIP: string;
	X11_LED_OFF: string; // "關閉 LED 燈條 {PORT} 第 {INDEX} 顆"
	X11_LED_OFF_TOOLTIP: string;

	// 下拉選單
	X11_LED_INDEX_ALL: string; // "全部"
}
```

---

## 狀態轉換

### timing_proc 注入狀態機

```
┌─────────────────────────────────────────────────────────────┐
│                    程式碼生成流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐     使用平滑移動積木     ┌─────────────────┐   │
│  │ 初始化  │ ────────────────────────→ │ requiresTimingProc │
│  │ false   │                          │      = true        │
│  └─────────┘                          └─────────────────┘   │
│       │                                       │             │
│       │ 不使用平滑移動積木                    │             │
│       ↓                                       ↓             │
│  ┌─────────────────────┐            ┌─────────────────────┐ │
│  │  finish() 不注入    │            │ finish() 注入       │ │
│  │  timing_proc()      │            │ servos.timing_proc()│ │
│  └─────────────────────┘            └─────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 關係圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        CyberBrick X11 積木架構                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────────────────┐ │
│  │  Blockly Blocks  │      │     MicroPython Generators       │ │
│  │  (blocks/x11.js) │──────│  (generators/micropython/x11.js) │ │
│  └──────────────────┘      └──────────────────────────────────┘ │
│          │                              │                       │
│          │                              │                       │
│          ↓                              ↓                       │
│  ┌──────────────────┐      ┌──────────────────────────────────┐ │
│  │ Toolbox Category │      │      Hardware Libraries          │ │
│  │ (cyberbrick_x11) │      │  ┌────────────┐ ┌─────────────┐  │ │
│  └──────────────────┘      │  │bbl.servos  │ │ bbl.motors  │  │ │
│          │                 │  └────────────┘ └─────────────┘  │ │
│          │                 │  ┌─────────────────────────────┐ │ │
│          ↓                 │  │  neopixel (built-in)        │ │ │
│  ┌──────────────────┐      │  └─────────────────────────────┘ │ │
│  │     i18n         │      └──────────────────────────────────┘ │
│  │ (15 languages)   │                                           │
│  └──────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
