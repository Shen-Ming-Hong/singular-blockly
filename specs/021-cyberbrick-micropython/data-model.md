# Data Model: CyberBrick MicroPython 積木支援

**Feature Branch**: `021-cyberbrick-micropython`  
**Last Updated**: 2025-12-29

---

## 1. Board Configuration（主板配置）

### 1.1 BoardConfig 擴展

擴展現有 `BOARD_CONFIGS` 物件，新增語言類型支援：

```typescript
interface BoardConfig {
	// 現有欄位
	name: string; // 顯示名稱
	digitalPins: [string, string][]; // 數位腳位 [顯示名, 值]
	analogPins: [string, string][]; // 類比腳位
	interruptPins?: [string, string][]; // 中斷腳位
	analogOutputRange: {
		min: number;
		max: number;
		defaultValue: number;
	};
	pullupPins: Record<string, boolean>;
	platformConfig?: string; // PlatformIO 配置（Arduino 用）

	// 新增欄位
	language: 'arduino' | 'micropython'; // 程式語言類型
	toolbox?: string; // 自訂工具箱路徑
	uploadMethod?: 'platformio' | 'mpremote'; // 上傳方式
	devicePath?: string; // 裝置上的程式路徑
	usbIdentifier?: {
		// USB 識別
		vid: string;
		pid: string;
	};
}
```

### 1.2 CyberBrick 配置實例

> **注意**：此配置為 **核心板 (XA003) 獨立使用模式**，適用於 Phase 1 實作。
> 搭配擴展板 (XA004) 的 GPIO 配置請參見 §1.4（Phase 2+ 範圍）。

```javascript
window.BOARD_CONFIGS.cyberbrick = {
	name: 'CyberBrick',
	language: 'micropython',
	toolbox: 'cyberbrick.json',
	uploadMethod: 'mpremote',
	devicePath: '/app/rc_main.py',
	usbIdentifier: {
		vid: '303A',
		pid: '1001',
	},

	// === GPIO 腳位定義 ===
	// 來源：Bambu Lab Wiki - CyberBrick 核心板 (XA003) 官方規格
	// https://wiki.bambulab.com/en/x1/manual/x1-cyberbrick-main-board
	digitalPins: [
		['GPIO 0', '0'],
		['GPIO 1', '1'],
		['GPIO 2', '2'],
		['GPIO 3', '3'],
		['GPIO 4', '4'],
		['GPIO 5', '5'],
		['GPIO 6', '6'],
		['GPIO 7', '7'],
		['GPIO 8 (板載 LED)', '8'], // 系統狀態 LED，1 顆 WS2812
		['GPIO 9', '9'],
		['GPIO 10', '10'],
	],

	analogPins: [
		['GPIO 0 (ADC)', '0'],
		['GPIO 1 (ADC)', '1'],
		['GPIO 2 (ADC)', '2'],
		['GPIO 3 (ADC)', '3'],
		['GPIO 4 (ADC)', '4'],
	],

	interruptPins: [
		// ESP32-C3 所有 GPIO 都支援中斷
		['GPIO 0', '0'],
		['GPIO 1', '1'],
		['GPIO 3', '3'],
		['GPIO 4', '4'],
		['GPIO 5', '5'],
		['GPIO 6', '6'],
		['GPIO 7', '7'],
		['GPIO 9', '9'],
		['GPIO 10', '10'],
	],

	analogOutputRange: {
		min: 0,
		max: 65535, // MicroPython PWM 16-bit duty_u16
		defaultValue: 0,
	},

	pullupPins: {
		0: true,
		1: true,
		2: true,
		3: true,
		4: true,
		5: true,
		6: true,
		7: true,
		9: true,
		10: true,
	},

	// === CyberBrick 核心板專屬硬體配置 ===
	// 來源：Bambu Lab Wiki 官方規格
	// Phase 1: 核心板獨立使用模式
	hardware: {
		// 板載 RGB LED（系統狀態指示）
		onboardLed: { pin: 8, count: 1, type: 'WS2812' },
	},

	// PWM 輸出限制警告
	maxPwmOutputs: 6, // ESP32-C3 硬體限制
};
```

### 1.3 CyberBrick 核心板硬體對應表

基於 [Bambu Lab Wiki 官方規格](https://wiki.bambulab.com/en/x1/manual/x1-cyberbrick-main-board) 確認（核心板 XA003）：

| 功能      | GPIO | 說明                          |
| --------- | ---- | ----------------------------- |
| 板載 LED  | 8    | WS2812 x 1，系統狀態指示      |
| 通用 GPIO | 0-7  | 數位 I/O、PWM、ADC（部分）    |
| 通用 GPIO | 9-10 | 數位 I/O                      |
| USB CDC   | N/A  | 原生 USB，用於程式上傳與 REPL |

**重要限制**：ESP32-C3 硬體同時最多支援 6 個 PWM 輸出

---

### 1.4 擴展板配置（Phase 2+ 範圍）

> **Out of Scope for Phase 1**: 以下配置適用於搭配遙控接收底板 (XA004) 使用，
> 將於 Phase 2 實作。此處僅作為未來參考。

基於 CyberBrick_Controller_Core 和 CyberBrick_ESPNOW 專案：

| 功能     | GPIO | 頻率   | 說明                        |
| -------- | ---- | ------ | --------------------------- |
| 伺服 S1  | 3    | 50 Hz  | 標準伺服馬達                |
| 伺服 S2  | 2    | 50 Hz  | 標準伺服馬達                |
| 伺服 S3  | 1    | 50 Hz  | 標準伺服馬達                |
| 伺服 S4  | 0    | 50 Hz  | 標準伺服馬達                |
| 馬達 M1A | 4    | 500 Hz | 有刷馬達正轉 (HTD8811 驅動) |
| 馬達 M1B | 5    | 500 Hz | 有刷馬達反轉                |
| 馬達 M2A | 6    | 500 Hz | 有刷馬達正轉                |
| 馬達 M2B | 7    | 500 Hz | 有刷馬達反轉                |
| LED D1   | 10   | N/A    | NeoPixel WS2812 x 4         |
| LED D2   | 8    | N/A    | NeoPixel WS2812 x 4         |
| 按鈕     | 9    | N/A    | 內建上拉，按下為 LOW        |

````

---

## 2. Workspace State（工作區狀態）

### 2.1 擴展 WorkspaceState

```typescript
interface WorkspaceState {
	// 現有欄位
	workspace: object; // Blockly 序列化資料
	board: string; // 主板類型 key
	theme: 'light' | 'dark'; // 主題

	// 新增欄位
	language?: 'arduino' | 'micropython'; // 程式語言（自動從 board 推導）
	generatedCode?: string; // 最後生成的程式碼
	lastUpload?: {
		// 上次上傳資訊
		timestamp: string;
		port: string;
		success: boolean;
	};
}
````

### 2.2 存儲格式

儲存於 `{workspace}/blockly/main.json`：

```json
{
	"workspace": {
		"blocks": {
			/* Blockly 區塊資料 */
		},
		"variables": [
			/* 變數清單 */
		]
	},
	"board": "cyberbrick",
	"theme": "light",
	"language": "micropython",
	"lastUpload": {
		"timestamp": "2024-12-29T10:30:00.000Z",
		"port": "COM3",
		"success": true
	}
}
```

---

## 3. Backup（備份）

### 3.1 WorkspaceBackup（工作區備份）

```typescript
interface WorkspaceBackup {
	id: string; // UUID
	timestamp: string; // ISO 8601
	type: 'workspace'; // 備份類型
	sourceBoard: string; // 原本的主板類型
	targetBoard?: string; // 切換到的主板（如適用）
	reason: BackupReason; // 備份原因
	workspace: object; // Blockly 序列化資料
	checksum?: string; // SHA256 雜湊（可選）
}

type BackupReason =
	| 'board_switch' // 主板切換
	| 'manual' // 手動備份
	| 'auto_save' // 自動儲存
	| 'pre_upload'; // 上傳前備份
```

### 3.2 DeviceBackup（裝置程式備份）

```typescript
interface DeviceBackup {
	id: string; // UUID
	timestamp: string; // ISO 8601
	type: 'device'; // 備份類型
	board: string; // 主板類型
	devicePath: string; // 裝置上的原始路徑
	content: string; // 程式內容
	port?: string; // 連接埠（記錄用）
}
```

### 3.3 備份清單（Manifest）

儲存於 `{workspace}/blockly/backups/manifest.json`：

```json
{
	"version": "1.0",
	"backups": [
		{
			"id": "uuid-1",
			"filename": "2024-12-29T10-30-00_arduino_uno.json",
			"type": "workspace",
			"sourceBoard": "arduino_uno",
			"targetBoard": "cyberbrick",
			"reason": "board_switch",
			"timestamp": "2024-12-29T10:30:00.000Z"
		},
		{
			"id": "uuid-2",
			"filename": "2024-12-29T10-30-01_cyberbrick_rc_main.py",
			"type": "device",
			"board": "cyberbrick",
			"devicePath": "/app/rc_main.py",
			"timestamp": "2024-12-29T10:30:01.000Z"
		}
	]
}
```

---

## 4. Upload State（上傳狀態）

### 4.1 UploadProgress

```typescript
interface UploadProgress {
	stage: UploadStage;
	progress: number; // 0-100
	message: string; // 顯示訊息
	error?: string; // 錯誤訊息（如有）
}

type UploadStage =
	| 'preparing' // 準備中
	| 'checking_tool' // 檢查 mpremote
	| 'installing_tool' // 安裝 mpremote
	| 'connecting' // 連接裝置
	| 'resetting' // 重置裝置
	| 'backing_up' // 備份原程式
	| 'uploading' // 上傳中
	| 'restarting' // 重啟裝置
	| 'completed' // 完成
	| 'failed'; // 失敗
```

### 4.2 UploadResult

```typescript
interface UploadResult {
	success: boolean;
	timestamp: string;
	port: string;
	stages: {
		stage: UploadStage;
		duration: number; // 毫秒
		success: boolean;
	}[];
	error?: {
		stage: UploadStage;
		message: string;
		details?: string;
	};
	backup?: {
		created: boolean;
		path?: string;
	};
}
```

---

## 5. MicroPython Generator State（生成器狀態）

### 5.1 GeneratorContext

```typescript
interface GeneratorContext {
	// Import 追蹤
	imports: Set<string>;

	// 變數追蹤
	globalVariables: Map<
		string,
		{
			name: string;
			type: 'int' | 'float' | 'str' | 'bool' | 'list' | 'object';
			initialValue?: string;
		}
	>;

	// 硬體初始化追蹤
	hardwareInit: Map<
		string,
		{
			type: 'pin' | 'adc' | 'pwm' | 'neopixel' | 'uart';
			config: object;
		}
	>;

	// 函數定義
	functions: Map<
		string,
		{
			name: string;
			params: string[];
			body: string;
		}
	>;
}
```

### 5.2 生成的程式碼結構

```python
# === 自動生成 - 請勿手動編輯 ===
# Board: CyberBrick
# Generated: 2024-12-29T10:30:00.000Z

# [1] Imports
from machine import Pin, ADC, PWM
from neopixel import NeoPixel
import time
import network

# [2] Hardware Initialization
# 核心板板載 LED（GPIO 8, 1 顆 WS2812）
onboard_led = NeoPixel(Pin(8), 1)
# 通用 GPIO 配置
pin_0 = Pin(0, Pin.OUT)
adc_1 = ADC(Pin(1))

# [3] Global Variables
my_variable = 0

# [4] User Functions
def my_function():
    pass

# [5] Main Program
while True:
    # User blocks code here
    pass
```

---

## 6. COM Port Info（連接埠資訊）

### 6.1 ComPortInfo

```typescript
interface ComPortInfo {
	path: string; // COM3, /dev/ttyACM0
	vendorId: string; // 303A
	productId: string; // 1001
	manufacturer?: string; // Espressif
	serialNumber?: string; // 裝置序號
	description?: string; // USB 描述
}
```

### 6.2 連接埠選擇狀態

```typescript
interface PortSelectionState {
	available: ComPortInfo[]; // 可用埠清單
	selected?: string; // 已選擇的埠
	lastUsed?: string; // 上次使用的埠
	autoDetected?: ComPortInfo; // 自動偵測到的 CyberBrick
}
```

---

## 7. Entity Relationships（實體關係）

```
┌──────────────────┐
│  BoardConfig     │
│ (board_configs)  │
└────────┬─────────┘
         │ 1:1
         ▼
┌──────────────────┐       ┌──────────────────┐
│  WorkspaceState  │──────▶│  WorkspaceBackup │
│  (main.json)     │  1:N  │  (backups/*.json)│
└────────┬─────────┘       └──────────────────┘
         │
         │ 1:1 (when micropython)
         ▼
┌──────────────────┐       ┌──────────────────┐
│ GeneratorContext │──────▶│   DeviceBackup   │
│ (runtime)        │       │  (backups/*.py)  │
└────────┬─────────┘       └──────────────────┘
         │
         │ triggers
         ▼
┌──────────────────┐       ┌──────────────────┐
│  UploadProgress  │──────▶│   UploadResult   │
│  (UI state)      │       │   (log)          │
└──────────────────┘       └──────────────────┘
```

---

## 8. Validation Rules（驗證規則）

### 8.1 BoardConfig 驗證

| 欄位         | 規則                                         |
| ------------ | -------------------------------------------- |
| name         | 非空字串                                     |
| language     | 必須為 'arduino' 或 'micropython'            |
| toolbox      | 若 language='micropython'，必須指定          |
| uploadMethod | 若 language='micropython'，必須為 'mpremote' |
| devicePath   | 若 language='micropython'，必須指定          |

### 8.2 Backup 驗證

| 欄位        | 規則                            |
| ----------- | ------------------------------- |
| timestamp   | 有效的 ISO 8601 日期            |
| sourceBoard | 必須是有效的 board key          |
| workspace   | 必須是有效的 Blockly 序列化資料 |

### 8.3 Upload 驗證

| 條件     | 驗證                     |
| -------- | ------------------------ |
| 連接埠   | 必須存在且可存取         |
| mpremote | 必須已安裝或可安裝       |
| 程式碼   | 必須是有效的 Python 語法 |

---

## 9. State Transitions（狀態轉換）

### 9.1 主板切換狀態機

```
[Any Board] ──(select different language board)──▶ [Show Warning Dialog]
                                                           │
                    ┌──────────────────────────────────────┤
                    │                                      │
                    ▼                                      ▼
            [User Cancels]                        [User Confirms]
                    │                                      │
                    ▼                                      ▼
            [Keep Current]                        [Backup Workspace]
                                                          │
                                                          ▼
                                                  [Clear Workspace]
                                                          │
                                                          ▼
                                                  [Switch Board]
                                                          │
                                                          ▼
                                                  [Load New Toolbox]
```

### 9.2 上傳狀態機

```
[Idle] ──(click upload)──▶ [Preparing]
                               │
                               ▼
                     [Checking mpremote]
                        │         │
              (found)   │         │ (not found)
                        │         ▼
                        │   [Installing]
                        │         │
                        ▼         ▼
                     [Connecting]
                        │         │
              (success) │         │ (fail)
                        │         ▼
                        │   [Failed] ──▶ [Idle]
                        ▼
                    [Resetting]
                        │
                        ▼
                   [Backing Up]
                        │
                        ▼
                   [Uploading]
                        │
                        ▼
                  [Restarting]
                        │
                        ▼
                   [Completed] ──▶ [Idle]
```
