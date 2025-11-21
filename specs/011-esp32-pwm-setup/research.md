# Research: ESP32 PWM 頻率與解析度設定

**Date**: 2025-01-21  
**Feature**: 011-esp32-pwm-setup  
**Research Phase**: Phase 0

## 研究目標

本研究旨在解決 Technical Context 中標註的所有 NEEDS CLARIFICATION 項目,確保實作基於權威文件和最佳實踐。

## 研究發現

### 1. ESP32 LEDC API 驗證

#### 決策: 使用 ledcSetup + ledcAttachPin + ledcWrite 三步驟

**來源**:

-   ESP32 Arduino Core 官方文件 (espressif/arduino-esp32)
-   ESP-IDF LEDC API 文件

**API 簽名**:

```cpp
// 設定 LEDC 通道
void ledcSetup(uint8_t channel, uint32_t freq, uint8_t resolution_bits);

// 將通道連接到 GPIO 腳位
void ledcAttachPin(uint8_t pin, uint8_t channel);

// 寫入 PWM 佔空比值
void ledcWrite(uint8_t channel, uint32_t duty);
```

**為何選擇此 API**:

-   Arduino-ESP32 3.x 引入新 API `ledcAttach()`,但為保持與專案現有程式碼一致(io.js 第 137-141 行已使用 ledcSetup/ledcAttachPin/ledcWrite),選擇繼續使用舊 API
-   ledcSetup/ledcAttachPin/ledcWrite 在所有 Arduino-ESP32 版本中穩定可用
-   現有專案已驗證此 API 組合的正確性

**考慮的替代方案**:

-   `ledcAttach(pin, freq, resolution)`: Arduino-ESP32 3.x 新 API,簡化設定但需驗證專案當前版本相容性
-   **拒絕原因**: 專案使用 Arduino-ESP32 2.x (根據 platformio.ini 配置),ledcAttach 可能不可用

---

### 2. ESP32 硬體限制驗證

#### 決策: 頻率 × 2^解析度 ≤ 80,000,000 (APB_CLK 限制)

**來源**:

-   ESP32 論壇官方回覆 (esp32.com/viewtopic.php?t=6701)
-   ESP-IDF LEDC 文件 (docs.espressif.com)
-   GitHub Gist: ESP32 LEDC Maximum frequency by resolution (benpeoples/3aa57bffc0f26ede6623ca520f26628c)

**公式驗證**:

```
Max Resolution (bits) = floor(log2(80,000,000 / frequency))

範例:
- 5000 Hz: floor(log2(80000000/5000)) = floor(log2(16000)) = 13 bits ✓
- 75000 Hz: floor(log2(80000000/75000)) = floor(log2(1066.67)) = 10 bits
- 但實務上 75000Hz @ 8bit 更穩定: 75000 × 256 = 19,200,000 < 80,000,000 ✓
```

**最大頻率與解析度對應表** (來自 ESP32 社群):
| 解析度 | 最大頻率 | 計算式 |
|--------|----------|--------|
| 8 bit | 312.5 KHz | 80,000,000 / 256 |
| 10 bit | 78.125 KHz | 80,000,000 / 1024 |
| 12 bit | 19.531 KHz | 80,000,000 / 4096 |
| 13 bit | 9.765 KHz | 80,000,000 / 8192 |
| 14 bit | 4.882 KHz | 80,000,000 / 16384 |
| 15 bit | 2.441 KHz | 80,000,000 / 32768 |
| 16 bit | 1.220 KHz | 80,000,000 / 65536 |

**預設值選擇理由**:

-   **75000 Hz @ 8 bit** 選為預設值
-   理由:
    1. 滿足馬達驅動晶片需求 (20-100KHz 範圍)
    2. 硬體限制檢查: 75000 × 256 = 19,200,000 < 80,000,000 ✓
    3. 8 bit (0-255) 與 Arduino 標準 analogWrite 相容
    4. 避免高解析度導致的複雜性

**考慮的替代方案**:

-   5000 Hz @ 12 bit (現有 io.js 預設值)
    -   **拒絕原因**: 頻率太低,無法滿足馬達驅動晶片需求
-   100000 Hz @ 8 bit
    -   **拒絕原因**: 超出部分馬達驅動晶片規格,且接近硬體極限

---

### 3. 馬達驅動晶片 PWM 頻率需求

#### 決策: 支援 20-100KHz 範圍,預設 75KHz

**來源**:

-   AT8833CR 資料表 (中科微電子 Zhongke Microelectronics)
-   DRV8833 資料表 (Texas Instruments, AT8833CR 的參考設計)

**AT8833CR 規格**:

-   **製造商**: 中科微電子 (Zhongke Microelectronics)
-   **PWM 頻率**: 支援 PWM 控制介面,實務範圍 20-100 KHz
-   **驅動電流**: 1.2A 輸出 (每通道)
-   **電源電壓**: 2.7-15V (寬電壓供電)
-   **邏輯電壓**: 與 ESP32 3.3V 邏輯相容
-   **導通電阻**: 800mΩ (HS+LS) 低導通電阻
-   **封裝**: QFN16 (3x3mm) - AT8833CR 型號
-   **兼容性**: Pin-to-Pin 替代 TI DRV8833
-   **保護功能**: 過流保護、短路保護、欠壓鎖定、過溫關斷
-   **用途**: 雙通道 H 橋電機驅動,可驅動兩個直流有刷馬達或一個步進馬達

**為何選擇 75KHz 作為預設**:

1. 位於 AT8833CR 推薦的安全範圍 (20-100KHz)
2. 避免馬達產生可聽見的高頻噪音 (低於 20KHz 會有噪音)
3. 留有餘裕 (未達 100KHz 上限)
4. 與 8 bit 解析度相容 (75000 × 256 = 19.2M < 80M)
5. AT8833CR 寬電壓供電 (2.7-15V) 適合多種專案場景

**考慮的替代方案**:

-   100 KHz: 接近 AT8833CR 實測最大值
    -   **拒絕原因**: 接近極限,安全餘裕不足
-   50 KHz: 更保守的選擇
    -   **拒絕原因**: 與伺服馬達的 50Hz 數值相近可能造成混淆

---

### 4. Blockly 12.3.1 欄位 API

#### 決策: 使用 FieldNumber 和 FieldDropdown

**來源**:

-   Blockly 官方文件 (google/blockly)
-   專案現有積木定義 (media/blockly/blocks/arduino.js)

**FieldNumber API**:

```javascript
// 參考 arduino_analog_write 積木 (arduino.js 第 545-566 行)
this.appendValueInput('VALUE').setCheck('Number').appendField(window.languageManager.getMessage('ARDUINO_ANALOG_WRITE')).appendField(
	new Blockly.FieldNumber(
		range.defaultValue, // 預設值
		range.min, // 最小值
		range.max, // 最大值
		1 // 步進值
	),
	'FIELD_NAME'
);
```

**FieldDropdown API**:

```javascript
// 參考 arduino_digital_write 積木 (arduino.js 第 449-454 行)
this.appendDummyInput()
	.appendField(window.languageManager.getMessage('LABEL'))
	.appendField(
		new Blockly.FieldDropdown([
			['8 bit', '8'],
			['10 bit', '10'],
			['12 bit', '12'],
		]),
		'RESOLUTION'
	);
```

**實作策略**:

-   頻率: 使用 FieldNumber(75000, 1, 80000, 1)
-   解析度: 使用 FieldDropdown 提供固定選項 [8, 10, 12, 13, 14, 15, 16]
-   不使用動態下拉選單 (不需要根據頻率即時更新選項,驗證在程式碼生成階段處理)

**考慮的替代方案**:

-   動態下拉選單 (根據頻率動態更新解析度選項)
    -   **拒絕原因**: 增加複雜度,使用者體驗不佳 (選項頻繁變動)
-   兩個 FieldNumber (頻率和解析度都用數字輸入)
    -   **拒絕原因**: 解析度為離散值 (8, 10, 12...),下拉選單更直觀

---

### 5. 工作區狀態管理策略

#### 決策: 僅在記憶體中保存,透過積木存在重建

**來源**:

-   專案現有模式 (參考 pinModeTracker 實作)
-   Blockly 最佳實踐 (避免持久化非積木資料)

**實作方式**:

```javascript
// 全域變數 (記憶體中)
window.esp32PwmFrequency = 75000; // 預設值
window.esp32PwmResolution = 8; // 預設值

// 工作區載入時重建 (in blocklyEdit.js)
function rebuildPwmConfig(workspace) {
	// 掃描工作區中的 esp32_pwm_setup 積木
	const pwmBlock = workspace.getAllBlocks().find(block => block.type === 'esp32_pwm_setup');

	if (pwmBlock) {
		// 從積木讀取設定值並重建全域變數
		window.esp32PwmFrequency = pwmBlock.getFieldValue('FREQUENCY');
		window.esp32PwmResolution = pwmBlock.getFieldValue('RESOLUTION');
	} else {
		// 無 PWM 設定積木,使用預設值
		window.esp32PwmFrequency = 75000;
		window.esp32PwmResolution = 8;
	}
}
```

**為何不寫入 main.json**:

1. PWM 配置是「程式碼生成參數」而非「工作區視覺狀態」
2. 積木本身已儲存配置 (積木的欄位值會自動序列化)
3. 避免 main.json 檔案格式變更 (向後相容)
4. 與專案現有模式一致 (pinModeTracker 也不持久化)

**考慮的替代方案**:

-   寫入 main.json 的自訂欄位
    -   **拒絕原因**: 增加序列化/反序列化邏輯,且破壞 main.json 簡潔性
-   使用 localStorage
    -   **拒絕原因**: 跨工作區共享狀態會造成混亂

---

### 6. 驗證與自動調整邏輯

#### 決策: 生成時驗證,自動降低解析度至可用值

**驗證函數設計**:

```javascript
function validateAndAdjustPwmConfig(frequency, resolution) {
	const maxValue = frequency * Math.pow(2, resolution);
	const limit = 80000000; // APB_CLK 80MHz

	if (maxValue > limit) {
		// 自動調整解析度
		const maxResolution = Math.floor(Math.log2(limit / frequency));
		const adjustedResolution = Math.max(8, maxResolution); // 最低 8 bit

		return {
			frequency: frequency,
			resolution: adjustedResolution,
			adjusted: true,
			warning: `⚠️ 警告：原始設定 ${frequency}Hz @ ${resolution}bit 超出限制
                     (${maxValue} > ${limit})，已自動調整為 ${frequency}Hz @ ${adjustedResolution}bit`,
		};
	}

	return {
		frequency: frequency,
		resolution: resolution,
		adjusted: false,
		info: `✓ 驗證: ${frequency} × ${Math.pow(2, resolution)} = ${maxValue} < ${limit}`,
	};
}
```

**註解生成策略**:

-   驗證通過: 加入簡短註解說明配置已驗證
-   自動調整: 加入警告註解說明調整原因和結果
-   位置: 放在 setupCode\_ 的 ledcSetup 行之前

**考慮的替代方案**:

-   自動調整頻率而非解析度
    -   **拒絕原因**: 使用者明確指定的頻率通常與硬體需求相關,不應任意修改
-   拒絕生成程式碼,僅顯示錯誤
    -   **拒絕原因**: 教育場景中,自動修正優於硬性錯誤,可減少挫折感

---

## 最佳實踐總結

### 程式碼生成模式

1. **全域配置優先**: arduino_analog_write 生成器讀取 window.esp32PwmFrequency/Resolution
2. **預設值容錯**: 未設定時使用 75000Hz / 8bit
3. **通道管理**: 複用現有 getPWMChannel() 函數
4. **驗證註解**: 在生成的 Arduino 程式碼中加入清晰的驗證結果註解

### 使用者體驗

1. **工具箱動態顯示**: PWM 設定積木僅在 ESP32 開發板時顯示
2. **即時回饋**: 積木 tooltip 說明頻率與解析度的限制關係
3. **錯誤容忍**: 自動調整不相容設定,避免生成無法運作的程式碼

### 測試策略

1. **單元測試**: 驗證函數、自動調整邏輯
2. **整合測試**: 工作區載入時重建全域變數
3. **手動測試**: 積木拖曳、實體硬體驗證

---

## 未解決問題與風險

### 低風險項目

1. **ESP32 變體差異**: 假設使用標準 ESP32 (80MHz APB_CLK)
    - **緩解**: 文件中明確標註不支援 ESP32-S2/S3/C3
2. **與 ESP32Servo 的潛在衝突**: 伺服馬達使用 50Hz,PWM 使用 75KHz
    - **緩解**: 文件中警告不可在同一腳位使用,硬體上兩者使用不同通道

### 需要後續驗證的項目

1. **實際硬體測試**: 75KHz @ 8bit 在實體 ESP32 + AT8833CR 組合的穩定性
    - **計畫**: Phase 2 實作完成後,使用實體硬體驗證
    - **測試重點**: 驗證 AT8833CR 在 75KHz PWM 下的馬達運轉平順性

---

## 參考文獻

1. **ESP32 Arduino Core LEDC API**

    - https://github.com/espressif/arduino-esp32
    - https://espressif-docs.readthedocs-hosted.com/projects/arduino-esp32/en/latest/api/ledc.html

2. **ESP32 LEDC 硬體限制**

    - https://esp32.com/viewtopic.php?t=6701
    - https://docs.espressif.com/projects/esp-idf/en/v5.1-rc1/esp32/api-reference/peripherals/ledc.html

3. **馬達驅動晶片規格**

    - AT8833CR: 中科微電子產品頁面 (https://www.sekorm.com)
    - AT8833 系列應用方案: 世強硬創電商平台
    - DRV8833 參考設計: Texas Instruments datasheet (SLVSAR1E) - AT8833CR Pin-to-Pin 替代品

4. **Blockly API**
    - https://github.com/google/blockly
    - 專案現有積木實作 (media/blockly/blocks/arduino.js)

---

**研究完成日期**: 2025-01-21  
**下一步**: Phase 1 設計 (data-model.md, contracts/, quickstart.md)
