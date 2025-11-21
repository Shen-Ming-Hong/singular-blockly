# Data Model: ESP32 PWM 頻率與解析度設定

**Date**: 2025-01-21  
**Feature**: 011-esp32-pwm-setup  
**Phase**: Phase 1 Design

## 實體定義

### 1. ESP32 PWM 設定積木 (esp32_pwm_setup)

**實體類型**: Blockly Block Definition  
**定義位置**: `media/blockly/blocks/arduino.js`

#### 欄位 (Fields)

| 欄位名稱   | 類型          | 預設值 | 驗證規則                        | 描述             |
| ---------- | ------------- | ------ | ------------------------------- | ---------------- |
| FREQUENCY  | FieldNumber   | 75000  | min: 1, max: 80000, step: 1     | PWM 頻率 (Hz)    |
| RESOLUTION | FieldDropdown | '8'    | 選項: 8, 10, 12, 13, 14, 15, 16 | PWM 解析度 (bit) |

#### 積木結構

```javascript
{
    type: 'esp32_pwm_setup',
    message0: '%1 ESP32 PWM %2 頻率 %3 Hz %4 解析度 %5',
    args0: [
        { type: 'field_image', src: 'icon.svg', width: 15, height: 15 },
        { type: 'input_dummy' },
        { type: 'field_number', name: 'FREQUENCY', value: 75000, min: 1, max: 80000 },
        { type: 'input_dummy' },
        { type: 'field_dropdown', name: 'RESOLUTION', options: [
            ['8 bit (0-255)', '8'],
            ['10 bit (0-1023)', '10'],
            ['12 bit (0-4095)', '12'],
            ['13 bit (0-8191)', '13'],
            ['14 bit (0-16383)', '14'],
            ['15 bit (0-32767)', '15'],
            ['16 bit (0-65535)', '16']
        ]}
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: '設定 ESP32 LEDC PWM 的頻率和解析度。限制: 頻率 × 2^解析度 ≤ 80,000,000',
    helpUrl: ''
}
```

#### 狀態轉換

```
[初始化] → [使用者拖曳至工作區] → [使用者修改欄位值] → [儲存至工作區 JSON] → [工作區載入時重建全域變數]
```

#### 關聯關係

-   **更新**: window.esp32PwmFrequency, window.esp32PwmResolution (全域變數)
-   **消費者**: arduino_analog_write 積木的程式碼生成器

---

### 2. 全域 PWM 配置

**實體類型**: Runtime Global Variables  
**儲存位置**: WebView 瀏覽器 context 的 window 物件

#### 屬性

| 屬性名稱                  | 類型   | 預設值 | 生命週期         | 描述                   |
| ------------------------- | ------ | ------ | ---------------- | ---------------------- |
| window.esp32PwmFrequency  | number | 75000  | 工作區載入至關閉 | ESP32 PWM 頻率 (Hz)    |
| window.esp32PwmResolution | number | 8      | 工作區載入至關閉 | ESP32 PWM 解析度 (bit) |

#### 初始化時機

1. **工作區首次載入**: 設為預設值 75000 Hz / 8 bit
2. **載入包含 esp32_pwm_setup 積木的工作區**: 從積木欄位值重建
3. **使用者修改積木欄位**: 即時更新全域變數 (透過 change 事件)

#### 重建邏輯

```javascript
// 在 blocklyEdit.js 的 loadWorkspace 函數中
function rebuildPwmConfig(workspace) {
	const pwmBlocks = workspace.getAllBlocks().filter(block => block.type === 'esp32_pwm_setup');

	if (pwmBlocks.length > 0) {
		// 多個 PWM 設定積木時,以最後一個為準 (後蓋前原則)
		const lastBlock = pwmBlocks[pwmBlocks.length - 1];
		window.esp32PwmFrequency = parseInt(lastBlock.getFieldValue('FREQUENCY'));
		window.esp32PwmResolution = parseInt(lastBlock.getFieldValue('RESOLUTION'));
	} else {
		// 無 PWM 設定積木,使用預設值
		window.esp32PwmFrequency = 75000;
		window.esp32PwmResolution = 8;
	}
}
```

---

### 3. PWM 驗證規則

**實體類型**: Validation Logic  
**定義位置**: `media/blockly/generators/arduino/io.js` (arduino_analog_write 生成器內)

#### 驗證參數

| 參數名稱   | 類型     | 來源                      | 描述                 |
| ---------- | -------- | ------------------------- | -------------------- |
| frequency  | number   | window.esp32PwmFrequency  | 目標頻率             |
| resolution | number   | window.esp32PwmResolution | 目標解析度           |
| APB_CLK    | constant | 80000000                  | ESP32 時鐘源 (80MHz) |

#### 驗證函數簽名

```javascript
function validateAndAdjustPwmConfig(frequency, resolution) {
    return {
        frequency: number,      // 最終頻率
        resolution: number,     // 最終解析度 (可能已調整)
        adjusted: boolean,      // 是否進行了自動調整
        warning?: string,       // 警告訊息 (如有調整)
        info?: string          // 驗證通過訊息
    };
}
```

#### 驗證規則

```javascript
const maxValue = frequency * Math.pow(2, resolution);
const isValid = maxValue <= 80000000;

if (!isValid) {
	// 自動調整解析度至最大可用值
	const maxResolution = Math.floor(Math.log2(80000000 / frequency));
	resolution = Math.max(8, maxResolution); // 最低 8 bit
}
```

#### 輸出範例

```javascript
// 案例 1: 相容配置
validateAndAdjustPwmConfig(75000, 8);
// 返回: {
//   frequency: 75000,
//   resolution: 8,
//   adjusted: false,
//   info: "✓ 驗證: 75000 × 256 = 19200000 < 80000000"
// }

// 案例 2: 不相容配置
validateAndAdjustPwmConfig(75000, 12);
// 返回: {
//   frequency: 75000,
//   resolution: 10,
//   adjusted: true,
//   warning: "⚠️ 警告：原始設定 75000Hz @ 12bit 超出限制..."
// }
```

---

### 4. Arduino 程式碼生成實體

**實體類型**: Generated Arduino C++ Code  
**生成位置**: arduino_analog_write 程式碼生成器

#### Setup Code 結構

```cpp
// ESP32 PWM 配置註解 (由驗證函數生成)
// ✓ 驗證: 75000 × 256 = 19200000 < 80000000

// LEDC 通道設定 (每個使用 analogWrite 的腳位)
ledcSetup(0, 75000, 8);        // 通道0, 75KHz PWM, 8位解析度
ledcAttachPin(25, 0);          // 將通道0附加到 GPIO25
```

#### Loop Code 結構

```cpp
// 類比輸出 (使用全域 PWM 配置)
ledcWrite(0, constrain(128, 0, 255));  // 寫入通道0, 值限制在 0-255
```

#### 生成規則

1. **通道分配**: 使用現有 `getPWMChannel(pin)` 函數
2. **值限制**: 根據解析度動態計算最大值 `2^resolution - 1`
3. **註解插入**: 驗證結果註解插入在 ledcSetup 之前

---

### 5. 工具箱顯示邏輯

**實體類型**: Toolbox Configuration  
**定義位置**: `media/toolbox/categories/arduino.json`

#### 條件顯示規則

```javascript
// 在 blocklyEdit.js 的工具箱更新函數中
function shouldShowPwmBlock() {
	return window.currentBoard === 'esp32' || window.currentBoard === 'esp32_super_mini';
}

// 動態過濾工具箱積木
function updateToolbox(board) {
	const toolboxConfig = loadToolboxConfig();

	if (!shouldShowPwmBlock()) {
		// 從 Arduino 類別中移除 esp32_pwm_setup 積木
		toolboxConfig.contents = toolboxConfig.contents.filter(item => item.type !== 'esp32_pwm_setup');
	}

	workspace.updateToolbox(toolboxConfig);
}
```

#### 開發板切換行為

```
[使用者切換至 ESP32] → [工具箱顯示 PWM 設定積木]
[使用者切換至 Arduino Uno] → [工具箱隱藏 PWM 設定積木] → [全域變數保持不變,但不影響程式碼生成]
[使用者切回 ESP32] → [工具箱重新顯示 PWM 設定積木] → [全域變數從工作區中的積木重建]
```

---

## 實體關聯圖

```
┌─────────────────────────┐
│ esp32_pwm_setup Block   │
│ (使用者設定)             │
│ - FREQUENCY: 75000      │
│ - RESOLUTION: 8         │
└───────────┬─────────────┘
            │ 更新 (onChange event)
            ▼
┌─────────────────────────┐
│ Global Config Variables │
│ (記憶體狀態)             │
│ - esp32PwmFrequency     │
│ - esp32PwmResolution    │
└───────────┬─────────────┘
            │ 讀取 (during code generation)
            ▼
┌─────────────────────────┐
│ Validation Logic        │
│ (validateAndAdjustPwm)  │
│ - 檢查硬體限制           │
│ - 自動調整解析度         │
└───────────┬─────────────┘
            │ 返回驗證結果
            ▼
┌─────────────────────────┐
│ arduino_analog_write    │
│ Code Generator          │
│ - 生成 ledcSetup()      │
│ - 生成 ledcWrite()      │
│ - 插入驗證註解           │
└───────────┬─────────────┘
            │ 輸出
            ▼
┌─────────────────────────┐
│ Arduino C++ Code        │
│ (main.ino)              │
│ - setupCode_            │
│ - loopCode_             │
└─────────────────────────┘
```

---

## 資料流動

### 使用者設定流程

```
1. 使用者拖曳 esp32_pwm_setup 積木
2. 使用者修改頻率和解析度欄位
3. Blockly onChange 事件觸發
4. 更新 window.esp32PwmFrequency 和 window.esp32PwmResolution
5. 工作區自動儲存 (積木欄位值序列化至 main.json)
```

### 程式碼生成流程

```
1. 使用者點擊「生成程式碼」或「上傳」
2. arduino_analog_write 生成器讀取 window.esp32PwmFrequency/Resolution
3. 呼叫 validateAndAdjustPwmConfig(frequency, resolution)
4. 根據驗證結果生成 ledcSetup/ledcAttachPin/ledcWrite
5. 插入驗證註解至 setupCode_
6. 返回生成的 Arduino C++ 程式碼
```

### 工作區載入流程

```
1. 使用者開啟專案 (載入 main.json)
2. Blockly 反序列化積木 (包含 esp32_pwm_setup)
3. rebuildPwmConfig() 掃描工作區
4. 從 esp32_pwm_setup 積木讀取欄位值
5. 重建 window.esp32PwmFrequency/Resolution
6. 若無 PWM 設定積木,使用預設值 75000/8
```

---

## 邊界條件處理

### 1. 多個 PWM 設定積木

**行為**: 後蓋前 (最後一個積木的設定生效)  
**原因**: 簡化邏輯,避免衝突  
**實作**: `rebuildPwmConfig()` 使用 `pwmBlocks[pwmBlocks.length - 1]`

### 2. 無 PWM 設定積木

**行為**: 使用預設值 75000 Hz / 8 bit  
**原因**: 向後相容,確保舊專案正常運作  
**實作**: rebuildPwmConfig() 的 else 分支

### 3. 超出頻率範圍

**行為**: FieldNumber 自動限制在 1-80000  
**原因**: 防止無效輸入  
**實作**: FieldNumber 的 min/max 參數

### 4. 不相容的頻率/解析度組合

**行為**: 自動降低解析度,生成警告註解  
**原因**: 教育場景優先可用性而非硬性錯誤  
**實作**: validateAndAdjustPwmConfig() 函數

### 5. 非 ESP32 開發板使用 PWM 設定積木

**行為**: 積木存在但不影響程式碼生成 (arduino_analog_write 檢查 currentBoard)  
**預防**: 工具箱僅在 ESP32 時顯示該積木

---

## 測試資料模型

### 單元測試案例

#### 驗證邏輯測試

```javascript
describe('validateAndAdjustPwmConfig', () => {
	test('相容配置不調整', () => {
		const result = validateAndAdjustPwmConfig(75000, 8);
		expect(result.adjusted).toBe(false);
		expect(result.frequency).toBe(75000);
		expect(result.resolution).toBe(8);
	});

	test('不相容配置自動調整', () => {
		const result = validateAndAdjustPwmConfig(75000, 12);
		expect(result.adjusted).toBe(true);
		expect(result.resolution).toBeLessThan(12);
	});

	test('極限頻率', () => {
		const result = validateAndAdjustPwmConfig(80000, 8);
		expect(result.adjusted).toBe(false);
	});
});
```

#### 全域變數重建測試

```javascript
describe('rebuildPwmConfig', () => {
	test('從積木重建', () => {
		const workspace = createMockWorkspace([{ type: 'esp32_pwm_setup', FREQUENCY: 50000, RESOLUTION: 10 }]);
		rebuildPwmConfig(workspace);
		expect(window.esp32PwmFrequency).toBe(50000);
		expect(window.esp32PwmResolution).toBe(10);
	});

	test('無積木使用預設值', () => {
		const workspace = createMockWorkspace([]);
		rebuildPwmConfig(workspace);
		expect(window.esp32PwmFrequency).toBe(75000);
		expect(window.esp32PwmResolution).toBe(8);
	});
});
```

---

**Data Model 版本**: 1.0  
**下一步**: 生成 contracts/esp32-pwm-api.md 和 quickstart.md
