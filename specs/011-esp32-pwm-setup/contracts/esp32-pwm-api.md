# API Contract: ESP32 PWM 配置介面

**Version**: 1.0  
**Date**: 2025-01-21  
**Feature**: 011-esp32-pwm-setup

## 概述

本文件定義 ESP32 PWM 設定功能的 JavaScript API 介面,包括積木定義、全域變數、驗證函數和程式碼生成器的契約規格。

---

## 1. Blockly Block API

### esp32_pwm_setup Block

**Block Type**: `esp32_pwm_setup`  
**Category**: Arduino  
**Visibility**: 僅在 ESP32 開發板時顯示

#### 積木介面

```typescript
interface Esp32PwmSetupBlock {
	type: 'esp32_pwm_setup';

	// 欄位
	fields: {
		FREQUENCY: FieldNumber; // 頻率 (Hz)
		RESOLUTION: FieldDropdown; // 解析度 (bit)
	};

	// 連接點
	previousStatement: null | Block; // 可連接上一個積木
	nextStatement: null | Block; // 可連接下一個積木

	// 視覺屬性
	colour: 230; // Arduino 積木顏色
	tooltip: string;
	helpUrl: string;
}
```

#### 欄位規格

##### FREQUENCY (頻率)

```typescript
interface FrequencyField {
	type: 'field_number';
	name: 'FREQUENCY';
	value: number; // 預設值: 75000
	min: number; // 最小值: 1
	max: number; // 最大值: 80000
	precision: number; // 精度: 1 (整數)
}
```

**驗證規則**:

-   必須為正整數
-   範圍: [1, 80000] Hz
-   輸入超出範圍時自動限制至邊界值
-   推薦範圍: [20000, 100000] Hz (適用於 AT8833CR 馬達驅動晶片)

##### RESOLUTION (解析度)

```typescript
interface ResolutionField {
	type: 'field_dropdown';
	name: 'RESOLUTION';
	options: Array<[string, string]>; // [顯示文字, 值]
}
```

**選項定義**:

```javascript
[
	['8 bit (0-255)', '8'],
	['10 bit (0-1023)', '10'],
	['12 bit (0-4095)', '12'],
	['13 bit (0-8191)', '13'],
	['14 bit (0-16383)', '14'],
	['15 bit (0-32767)', '15'],
	['16 bit (0-65535)', '16'],
];
```

#### JSON 序列化格式

```json
{
    "type": "esp32_pwm_setup",
    "id": "unique_block_id",
    "fields": {
        "FREQUENCY": 75000,
        "RESOLUTION": "8"
    },
    "next": {
        "block": { ... }
    }
}
```

---

## 2. Global Variables API

### window.esp32PwmFrequency

**Type**: `number`  
**Default**: `75000`  
**Scope**: Global (WebView window object)

**用途**: 儲存當前 ESP32 PWM 頻率設定

**存取方式**:

```javascript
// 讀取
const frequency = window.esp32PwmFrequency || 75000; // 容錯預設值

// 寫入 (由 esp32_pwm_setup 積木或 rebuildPwmConfig 函數)
window.esp32PwmFrequency = 50000;
```

**生命週期**:

-   **初始化**: 工作區載入時 (預設值或從積木重建)
-   **更新**: 使用者修改 esp32_pwm_setup 積木欄位時
-   **銷毀**: 工作區關閉時

### window.esp32PwmResolution

**Type**: `number`  
**Default**: `8`  
**Scope**: Global (WebView window object)

**用途**: 儲存當前 ESP32 PWM 解析度設定

**存取方式**:

```javascript
// 讀取
const resolution = window.esp32PwmResolution || 8; // 容錯預設值

// 寫入
window.esp32PwmResolution = 10;
```

**生命週期**: 同 window.esp32PwmFrequency

---

## 3. Validation Function API

### validateAndAdjustPwmConfig()

**Function Signature**:

```typescript
function validateAndAdjustPwmConfig(frequency: number, resolution: number): PwmValidationResult;
```

**Input Parameters**:

```typescript
interface PwmValidationInput {
	frequency: number; // 目標頻率 (Hz), 範圍: [1, 80000]
	resolution: number; // 目標解析度 (bit), 範圍: [8, 16]
}
```

**Return Type**:

```typescript
interface PwmValidationResult {
	frequency: number; // 最終頻率 (與輸入相同)
	resolution: number; // 最終解析度 (可能已調整)
	adjusted: boolean; // 是否進行了自動調整
	warning?: string; // 警告訊息 (僅當 adjusted=true)
	info?: string; // 資訊訊息 (僅當 adjusted=false)
}
```

**行為規範**:

1. **驗證規則**:

    ```javascript
    const maxValue = frequency * Math.pow(2, resolution);
    const isValid = maxValue <= 80000000; // APB_CLK 限制
    ```

2. **調整策略** (當 isValid = false):

    ```javascript
    const maxResolution = Math.floor(Math.log2(80000000 / frequency));
    const adjustedResolution = Math.max(8, maxResolution); // 最低 8 bit
    ```

3. **訊息格式**:
    - **Warning** (adjusted=true):
        ```
        ⚠️ 警告：原始設定 {freq}Hz @ {res}bit 超出限制
        ({freq} × {2^res} = {maxValue} > 80000000)
        已自動調整為 {freq}Hz @ {adjustedRes}bit
        ```
    - **Info** (adjusted=false):
        ```
        ✓ 驗證: {freq} × {2^res} = {maxValue} < 80000000
        ```

**使用範例**:

```javascript
// 相容配置
const result1 = validateAndAdjustPwmConfig(75000, 8);
// result1 = { frequency: 75000, resolution: 8, adjusted: false,
//             info: "✓ 驗證: 75000 × 256 = 19200000 < 80000000" }

// 不相容配置
const result2 = validateAndAdjustPwmConfig(75000, 12);
// result2 = { frequency: 75000, resolution: 10, adjusted: true,
//             warning: "⚠️ 警告：原始設定 75000Hz @ 12bit 超出限制..." }
```

**錯誤處理**:

-   輸入 frequency < 1 或 > 80000: 應在 FieldNumber 層級阻止,函數不處理
-   輸入 resolution 不在 [8, 16]: 應在 FieldDropdown 層級阻止,函數不處理
-   函數內部錯誤: 返回預設安全配置 `{ frequency: 75000, resolution: 8, adjusted: true, warning: "發生錯誤,已重設為預設值" }`

---

## 4. Code Generator API

### arduino_analog_write Generator (ESP32 專用路徑)

**Generator Function**: `window.arduinoGenerator.forBlock['arduino_analog_write']`

**Input Context**:

```typescript
interface AnalogWriteContext {
	block: Block; // Blockly 積木實例
	currentBoard: string; // 當前開發板 (應為 'esp32')
	pin: string; // GPIO 腳位編號
	value: string; // 輸出值表達式 (可能是數字或變數)
	pwmFrequency: number; // window.esp32PwmFrequency
	pwmResolution: number; // window.esp32PwmResolution
}
```

**Output Contract**:

```typescript
interface GeneratedCode {
	includes: { [key: string]: string }; // #include 陳述式
	setupCode: string[]; // setup() 函數內的程式碼行
	loopCode: string; // loop() 函數內的程式碼
}
```

**生成規範**:

#### Includes

```cpp
#include <esp32-hal-ledc.h>
```

#### Setup Code

```cpp
// PWM 驗證註解 (來自 validateAndAdjustPwmConfig)
// ✓ 驗證: 75000 × 256 = 19200000 < 80000000
// 或
// ⚠️ 警告：原始設定 75000Hz @ 12bit 超出限制...

// LEDC 通道設定
ledcSetup({channel}, {frequency}, {resolution});  // 通道{channel}, {freq}Hz PWM, {res}位解析度
ledcAttachPin({pin}, {channel});  // 將通道{channel}附加到 GPIO{pin}
```

#### Loop Code

```cpp
ledcWrite({channel}, constrain({value}, 0, {maxDuty}));
```

**參數計算**:

-   `{channel}`: 由 `window.getPWMChannel(pin)` 取得,若為 null 則使用 `8 + (parseInt(pin) % 8)`
-   `{frequency}`: `window.esp32PwmFrequency` (經驗證後的值)
-   `{resolution}`: `window.esp32PwmResolution` (經驗證後的值)
-   `{maxDuty}`: `Math.pow(2, resolution) - 1` (例如 8 bit → 255)
-   `{value}`: 從積木取得的表達式,已透過 constrain 限制範圍

**防重複機制**:

```javascript
// 同一腳位多次呼叫 analogWrite 時,只在配置變更時重新生成 ledcSetup/ledcAttachPin
// setupKey 包含頻率和解析度,確保配置變更時會重新生成程式碼
const setupKey = `ledc_pin_${pin}_${finalFreq}_${finalRes}`;
if (!window.arduinoGenerator.setupCode_.some(line => line.includes(setupKey))) {
	window.arduinoGenerator.setupCode_.push(`// ${setupKey}`);
	window.arduinoGenerator.setupCode_.push(`ledcSetup(${channel}, ${finalFreq}, ${finalRes});  // 通道${channel}, ${finalFreq}Hz PWM, ${finalRes}位解析度`);
	window.arduinoGenerator.setupCode_.push(`ledcAttachPin(${pin}, ${channel});  // 將通道${channel}附加到 GPIO${pin}`);
}
```

---

## 5. Workspace Rebuild API

### rebuildPwmConfig()

**Function Signature**:

```typescript
function rebuildPwmConfig(workspace: Blockly.Workspace): void;
```

**Input**: Blockly 工作區實例

**Behavior**:

1. 掃描工作區中所有 `esp32_pwm_setup` 類型的積木
2. 若存在至少一個 PWM 設定積木:
    - 取最後一個積木 (陣列最後一項)
    - 讀取其 FREQUENCY 和 RESOLUTION 欄位值
    - 更新 window.esp32PwmFrequency 和 window.esp32PwmResolution
3. 若不存在 PWM 設定積木:
    - 設定 window.esp32PwmFrequency = 75000
    - 設定 window.esp32PwmResolution = 8

**呼叫時機**:

-   `loadWorkspace()` 函數完成工作區載入後
-   開發板切換至 ESP32 後 (可選,確保狀態一致)

**實作範例**:

```javascript
function rebuildPwmConfig(workspace) {
	const pwmBlocks = workspace.getAllBlocks().filter(block => block.type === 'esp32_pwm_setup');

	if (pwmBlocks.length > 0) {
		const lastBlock = pwmBlocks[pwmBlocks.length - 1];
		window.esp32PwmFrequency = parseInt(lastBlock.getFieldValue('FREQUENCY')) || 75000;
		window.esp32PwmResolution = parseInt(lastBlock.getFieldValue('RESOLUTION')) || 8;
		console.log(`PWM 配置重建: ${window.esp32PwmFrequency}Hz @ ${window.esp32PwmResolution}bit`);
	} else {
		window.esp32PwmFrequency = 75000;
		window.esp32PwmResolution = 8;
		console.log('PWM 配置使用預設值: 75000Hz @ 8bit');
	}
}
```

---

## 6. Toolbox Update API

### updateToolboxForBoard()

**Function Signature**:

```typescript
function updateToolboxForBoard(board: string): void;
```

**Input**: 開發板識別碼 (例如 'esp32', 'arduino_uno')

**Behavior**:

1. 檢查開發板是否為 ESP32 (`board === 'esp32' || board === 'esp32_super_mini'`)
2. 若是 ESP32:
    - 確保 arduino.json 工具箱配置包含 `esp32_pwm_setup` 積木
3. 若非 ESP32:
    - 從工具箱配置中移除 `esp32_pwm_setup` 積木

**實作位置**: `media/js/blocklyEdit.js`

**實作範例**:

```javascript
function updateToolboxForBoard(board) {
	const isESP32 = board === 'esp32' || board === 'esp32_super_mini';

	// 載入原始工具箱配置
	const arduinoCategory = loadToolboxCategory('arduino');

	// 過濾 ESP32 專用積木
	arduinoCategory.contents = arduinoCategory.contents.filter(item => {
		if (item.type === 'esp32_pwm_setup') {
			return isESP32; // 僅在 ESP32 時保留
		}
		return true; // 其他積木始終保留
	});

	// 更新工具箱
	workspace.updateToolbox(generateFullToolbox(arduinoCategory));
}
```

---

## 7. Event Handling Contract

### Block Change Event

**Event Type**: `Blockly.Events.BLOCK_CHANGE`

**Handler Contract**:

```typescript
interface BlockChangeHandler {
    listenTo: 'esp32_pwm_setup';
    trigger: 'FREQUENCY' | 'RESOLUTION' field change;
    action: () => {
        // 即時更新全域變數
        window.esp32PwmFrequency = block.getFieldValue('FREQUENCY');
        window.esp32PwmResolution = block.getFieldValue('RESOLUTION');
    };
}
```

**實作範例**:

```javascript
workspace.addChangeListener(event => {
	if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId) {
		const block = workspace.getBlockById(event.blockId);
		if (block && block.type === 'esp32_pwm_setup') {
			window.esp32PwmFrequency = parseInt(block.getFieldValue('FREQUENCY')) || 75000;
			window.esp32PwmResolution = parseInt(block.getFieldValue('RESOLUTION')) || 8;
		}
	}
});
```

---

## 8. Testing Contract

### Unit Test Requirements

#### 驗證函數測試

```typescript
describe('validateAndAdjustPwmConfig', () => {
	test('相容配置: 75000Hz @ 8bit', () => {
		const result = validateAndAdjustPwmConfig(75000, 8);
		expect(result.adjusted).toBe(false);
		expect(result.frequency).toBe(75000);
		expect(result.resolution).toBe(8);
		expect(result.info).toContain('19200000 < 80000000');
	});

	test('不相容配置: 75000Hz @ 12bit → 自動調整為 10bit', () => {
		const result = validateAndAdjustPwmConfig(75000, 12);
		expect(result.adjusted).toBe(true);
		expect(result.resolution).toBeLessThanOrEqual(10);
		expect(result.warning).toContain('超出限制');
	});

	test('邊界值: 80000Hz @ 8bit', () => {
		const result = validateAndAdjustPwmConfig(80000, 8);
		const maxValue = 80000 * 256;
		expect(maxValue).toBeLessThanOrEqual(80000000);
	});
});
```

#### 程式碼生成測試

```typescript
describe('arduino_analog_write (ESP32)', () => {
	beforeEach(() => {
		window.currentBoard = 'esp32';
		window.esp32PwmFrequency = 75000;
		window.esp32PwmResolution = 8;
	});

	test('生成正確的 LEDC 設定', () => {
		const code = generateCode(mockAnalogWriteBlock);
		expect(code.setupCode).toContain('ledcSetup(');
		expect(code.setupCode).toContain('75000');
		expect(code.setupCode).toContain('8');
	});

	test('生成驗證註解', () => {
		const code = generateCode(mockAnalogWriteBlock);
		expect(code.setupCode).toContain('✓ 驗證');
	});
});
```

---

## 9. Versioning & Compatibility

**API Version**: 1.0  
**Blockly Version**: 12.3.1+  
**Arduino-ESP32 Version**: 2.x (使用 ledcSetup/ledcAttachPin/ledcWrite)

**Breaking Changes Policy**:

-   新增欄位: MINOR 版本遞增
-   修改驗證規則: MINOR 版本遞增
-   移除欄位或 API: MAJOR 版本遞增

**向後相容承諾**:

-   現有工作區 (main.json) 無需修改即可載入
-   無 PWM 設定積木的專案使用預設值,不破壞功能
-   API 簽名在同一 MAJOR 版本內保持穩定

---

**Contract Version**: 1.0  
**Last Updated**: 2025-01-21  
**Next Review**: Phase 2 Implementation
