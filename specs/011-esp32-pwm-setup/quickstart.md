# Quick Start: ESP32 PWM 設定功能開發指南

**Feature**: 011-esp32-pwm-setup  
**Date**: 2025-01-21  
**Target Audience**: 開發者與貢獻者

## 目標

本指南協助開發者快速設置開發環境並開始實作 ESP32 PWM 頻率與解析度設定功能。

---

## 先決條件

### 系統需求

-   **作業系統**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)
-   **Node.js**: 22.16.0+ (使用 `node --version` 檢查)
-   **npm**: 10.0.0+ (隨 Node.js 安裝)
-   **Git**: 2.30+ (用於版本控制)

### 開發工具

-   **VSCode**: 1.96.0+ (推薦使用專案開發的編輯器)
-   **VSCode Extensions**:
    -   ESLint (dbaeumer.vscode-eslint)
    -   Prettier (esbenp.prettier-vscode)
    -   TypeScript and JavaScript Language Features (內建)

### 硬體需求 (用於實體測試)

-   **ESP32 開發板**: 標準 ESP32 (非 S2/S3/C3 變體)
-   **馬達驅動模組**: AT8833CR (中科微電子,QFN16 封裝,可選用於驗證高頻 PWM)
-   **直流馬達**: 任何 3-12V 直流馬達 (用於測試,AT8833CR 支援 2.7-15V 供電)
-   **USB 線**: 連接 ESP32 與電腦

---

## 環境設置

### 1. 專案 Clone 與安裝

```powershell
# Clone 專案
git clone https://github.com/Shen-Ming-Hong/singular-blockly.git
cd singular-blockly

# 切換至功能分支
git checkout 011-esp32-pwm-setup

# 安裝依賴
npm install

# 驗證安裝
npm run compile
npm test
```

**預期輸出**:

-   `npm run compile`: 編譯成功,無錯誤
-   `npm test`: 所有現有測試通過 (PWM 功能測試尚未實作)

---

### 2. VSCode 設定

#### 開啟專案

```powershell
code .
```

#### 推薦的 VSCode 設定 (`.vscode/settings.json`)

```json
{
	"editor.formatOnSave": true,
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	},
	"typescript.tsdk": "node_modules/typescript/lib",
	"files.exclude": {
		"out": true,
		"node_modules": true
	}
}
```

---

### 3. 開發模式啟動

#### 方式 1: VSCode Tasks

1. 按 `Ctrl+Shift+B` (Windows/Linux) 或 `Cmd+Shift+B` (macOS)
2. 選擇 `npm: watch` (預設建置任務)
3. 監視模式啟動,程式碼變更時自動重新編譯

#### 方式 2: 終端機命令

```powershell
# Watch 模式 (自動重新編譯)
npm run watch

# 另開終端機,執行擴充功能開發主機
# 按 F5 或在 VSCode 中選擇 "Run > Start Debugging"
```

#### 驗證擴充功能載入

1. 新視窗開啟 (Extension Development Host)
2. 檢查 Output Channel: "Singular Blockly"
3. 無錯誤訊息即表示載入成功

---

## 專案結構導覽

### 關鍵檔案位置

```
singular-blockly/
├── media/
│   ├── blockly/
│   │   ├── blocks/
│   │   │   └── arduino.js          # 🔧 新增 esp32_pwm_setup 積木定義
│   │   └── generators/
│   │       └── arduino/
│   │           └── io.js            # 🔧 修改 arduino_analog_write 生成器
│   ├── toolbox/
│   │   └── categories/
│   │       └── arduino.json         # 🔧 新增積木到工具箱
│   ├── locales/
│   │   ├── zh-hant/
│   │   │   └── messages.js          # 🔧 繁體中文翻譯
│   │   └── en/
│   │       └── messages.js          # 🔧 英文翻譯
│   └── js/
│       └── blocklyEdit.js           # 🔧 工作區載入邏輯 (rebuildPwmConfig)
├── src/
│   ├── test/
│   │   └── suite/
│   │       ├── pwm-validation.test.ts    # ✨ 新增驗證邏輯測試
│   │       └── code-generation.test.ts   # 🔧 新增程式碼生成測試
│   └── extension.ts                # 不需修改
└── specs/
    └── 011-esp32-pwm-setup/
        ├── spec.md                  # 📖 功能規格
        ├── plan.md                  # 📋 實作計畫
        ├── research.md              # 🔬 研究文件
        ├── data-model.md            # 📊 資料模型
        ├── quickstart.md            # 📘 本文件
        └── contracts/
            └── esp32-pwm-api.md     # 📜 API 契約

🔧 = 需要修改的檔案
✨ = 需要新增的檔案
📖 = 參考文件
```

---

## 實作步驟

### Phase 1: 積木定義 (預估 1-2 小時)

#### 1.1 新增積木定義

**檔案**: `media/blockly/blocks/arduino.js`

**插入位置**: 在檔案末尾,其他積木定義之後

```javascript
// ESP32 PWM 設定積木
Blockly.Blocks['esp32_pwm_setup'] = {
	init: function () {
		this.appendDummyInput().appendField('⚙️ ESP32 PWM 設定');
		this.appendDummyInput().appendField('頻率').appendField(new Blockly.FieldNumber(75000, 1, 80000, 1), 'FREQUENCY').appendField('Hz');
		this.appendDummyInput()
			.appendField('解析度')
			.appendField(
				new Blockly.FieldDropdown([
					['8 bit (0-255)', '8'],
					['10 bit (0-1023)', '10'],
					['12 bit (0-4095)', '12'],
					['13 bit (0-8191)', '13'],
					['14 bit (0-16383)', '14'],
					['15 bit (0-32767)', '15'],
					['16 bit (0-65535)', '16'],
				]),
				'RESOLUTION'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230); // Arduino 積木顏色
		this.setTooltip('設定 ESP32 LEDC PWM 的頻率和解析度。限制: 頻率 × 2^解析度 ≤ 80,000,000');
		this.setHelpUrl('');
	},
};
```

**驗證**:

1. 儲存檔案
2. 重新載入 Extension Development Host (F5 重啟或 Reload Window)
3. 開啟 Blockly 編輯器
4. 切換至 ESP32 開發板
5. 在 Arduino 類別中應能看到新積木 (若工具箱尚未更新,暫時跳過此驗證)

---

#### 1.2 新增翻譯

**檔案 1**: `media/locales/zh-hant/messages.js`

在檔案末尾 `}` 之前新增:

```javascript
    // ESP32 PWM 設定
    'ESP32_PWM_SETUP': 'ESP32 PWM 設定',
    'ESP32_PWM_FREQUENCY': '頻率',
    'ESP32_PWM_RESOLUTION': '解析度',
    'ESP32_PWM_TOOLTIP': '設定 ESP32 LEDC PWM 的頻率和解析度。限制: 頻率 × 2^解析度 ≤ 80,000,000',
```

**檔案 2**: `media/locales/en/messages.js`

在檔案末尾 `}` 之前新增:

```javascript
    // ESP32 PWM Setup
    'ESP32_PWM_SETUP': 'ESP32 PWM Setup',
    'ESP32_PWM_FREQUENCY': 'Frequency',
    'ESP32_PWM_RESOLUTION': 'Resolution',
    'ESP32_PWM_TOOLTIP': 'Set ESP32 LEDC PWM frequency and resolution. Limit: frequency × 2^resolution ≤ 80,000,000',
```

**更新積木定義** (可選,若使用語言管理器):

```javascript
// 將硬編碼文字替換為語言管理器
.appendField(window.languageManager.getMessage('ESP32_PWM_SETUP'))
.appendField(window.languageManager.getMessage('ESP32_PWM_FREQUENCY'))
// ...依此類推
```

---

#### 1.3 新增至工具箱

**檔案**: `media/toolbox/categories/arduino.json`

在 `arduino_pullup` 積木之後新增:

```json
{
	"kind": "block",
	"type": "esp32_pwm_setup"
}
```

**完整上下文**:

```json
{
    "kind": "block",
    "type": "arduino_pullup"
},
{
    "kind": "block",
    "type": "esp32_pwm_setup"
},
{
    "kind": "block",
    "type": "threshold_function_setup"
}
```

**驗證**:

1. 重新載入 Extension Development Host
2. 切換至 ESP32 開發板
3. Arduino 類別中應顯示 "ESP32 PWM 設定" 積木
4. 切換至 Arduino Uno,該積木應隱藏 (需實作動態工具箱邏輯)

---

### Phase 2: 程式碼生成器 (預估 2-3 小時)

#### 2.1 新增驗證函數

**檔案**: `media/blockly/generators/arduino/io.js`

在檔案開頭 (在其他生成器之前) 新增:

```javascript
/**
 * 驗證並調整 ESP32 PWM 配置
 * @param {number} frequency - 目標頻率 (Hz)
 * @param {number} resolution - 目標解析度 (bit)
 * @returns {Object} 驗證結果
 */
window.validateAndAdjustPwmConfig = function (frequency, resolution) {
	const APB_CLK = 80000000; // ESP32 APB_CLK 頻率
	const maxValue = frequency * Math.pow(2, resolution);

	if (maxValue > APB_CLK) {
		// 自動調整解析度
		const maxResolution = Math.floor(Math.log2(APB_CLK / frequency));
		const adjustedResolution = Math.max(8, maxResolution);

		return {
			frequency: frequency,
			resolution: adjustedResolution,
			adjusted: true,
			warning: `⚠️ 警告：原始設定 ${frequency}Hz @ ${resolution}bit 超出限制\n` + `   (${frequency} × ${Math.pow(2, resolution)} = ${maxValue} > ${APB_CLK})\n` + `   已自動調整為 ${frequency}Hz @ ${adjustedResolution}bit`,
		};
	}

	return {
		frequency: frequency,
		resolution: resolution,
		adjusted: false,
		info: `// ✓ 驗證: ${frequency} × ${Math.pow(2, resolution)} = ${maxValue} < ${APB_CLK}`,
	};
};
```

---

#### 2.2 修改 arduino_analog_write 生成器

**檔案**: `media/blockly/generators/arduino/io.js`

**定位**: 找到 `window.arduinoGenerator.forBlock['arduino_analog_write']` (約第 113 行)

**修改策略**: 在 ESP32 分支中整合 PWM 配置

**修改前**:

```javascript
// ESP32 需要特殊處理
if (currentBoard === 'esp32') {
	let channel = window.getPWMChannel(pin);
	if (channel === null) {
		channel = 8 + (parseInt(pin) % 8);
	}

	window.arduinoGenerator.setupCode_.push(`ledcSetup(${channel}, 5000, 12);  // 通道${channel}, 5KHz PWM, 12位分辨率`);
	window.arduinoGenerator.setupCode_.push(`ledcAttachPin(${pin}, ${channel});  // 將通道${channel}附加到指定的腳位`);
	// ...
}
```

**修改後**:

```javascript
// ESP32 需要特殊處理
if (currentBoard === 'esp32') {
	let channel = window.getPWMChannel(pin);
	if (channel === null) {
		channel = 8 + (parseInt(pin) % 8);
	}

	// 讀取全域 PWM 配置 (從 esp32_pwm_setup 積木或預設值)
	const pwmFreq = window.esp32PwmFrequency || 75000;
	const pwmRes = window.esp32PwmResolution || 8;

	// 驗證並調整配置
	const validated = window.validateAndAdjustPwmConfig(pwmFreq, pwmRes);
	const finalFreq = validated.frequency;
	const finalRes = validated.resolution;
	const maxDuty = Math.pow(2, finalRes) - 1;

	// 防重複設定同一腳位
	const setupKey = `ledc_pin_${pin}_${finalFreq}_${finalRes}`;
	if (!window.arduinoGenerator.setupCode_.includes(setupKey)) {
		// 插入驗證結果註解
		if (validated.adjusted) {
			window.arduinoGenerator.setupCode_.push(`// ${validated.warning.replace(/\n/g, '\n// ')}`);
		} else {
			window.arduinoGenerator.setupCode_.push(validated.info);
		}

		// 插入 LEDC 設定
		window.arduinoGenerator.setupCode_.push(`// ${setupKey}`);
		window.arduinoGenerator.setupCode_.push(`ledcSetup(${channel}, ${finalFreq}, ${finalRes});  // 通道${channel}, ${finalFreq}Hz PWM, ${finalRes}位解析度`);
		window.arduinoGenerator.setupCode_.push(`ledcAttachPin(${pin}, ${channel});  // 將通道${channel}附加到 GPIO${pin}`);
	}

	window.arduinoGenerator.includes_['esp32_ledc'] = '#include <esp32-hal-ledc.h>';

	// 動態調整 constrain 最大值
	value = `constrain(${value}, 0, ${maxDuty})`;

	return `ledcWrite(${channel}, ${value});\n`;
}
```

**驗證**:

1. 儲存檔案
2. 重新載入 Extension Development Host
3. 建立簡單測試:
    - 拖曳 esp32_pwm_setup 積木,設定 75000Hz / 8bit
    - 拖曳 arduino_analog_write 積木
    - 生成程式碼
4. 檢查生成的 Arduino 程式碼:
    - 包含 `ledcSetup(0, 75000, 8);`
    - 包含驗證註解 `// ✓ 驗證: 75000 × 256 = ...`

---

### Phase 3: 工作區邏輯 (預估 1 小時)

#### 3.1 實作 rebuildPwmConfig 函數

**檔案**: `media/js/blocklyEdit.js`

**插入位置**: 在檔案末尾,其他輔助函數之後

```javascript
/**
 * 從工作區重建 ESP32 PWM 配置
 * @param {Blockly.Workspace} workspace - Blockly 工作區實例
 */
function rebuildPwmConfig(workspace) {
	try {
		const pwmBlocks = workspace.getAllBlocks().filter(block => block.type === 'esp32_pwm_setup');

		if (pwmBlocks.length > 0) {
			// 多個 PWM 設定積木時,以最後一個為準
			const lastBlock = pwmBlocks[pwmBlocks.length - 1];
			window.esp32PwmFrequency = parseInt(lastBlock.getFieldValue('FREQUENCY')) || 75000;
			window.esp32PwmResolution = parseInt(lastBlock.getFieldValue('RESOLUTION')) || 8;
			console.log(`[PWM Config] 從積木重建: ${window.esp32PwmFrequency}Hz @ ${window.esp32PwmResolution}bit`);
		} else {
			// 無 PWM 設定積木,使用預設值
			window.esp32PwmFrequency = 75000;
			window.esp32PwmResolution = 8;
			console.log('[PWM Config] 使用預設值: 75000Hz @ 8bit');
		}
	} catch (error) {
		console.error('[PWM Config] 重建失敗:', error);
		// 容錯:設定預設值
		window.esp32PwmFrequency = 75000;
		window.esp32PwmResolution = 8;
	}
}
```

---

#### 3.2 整合至 loadWorkspace 函數

**檔案**: `media/js/blocklyEdit.js`

**定位**: 找到 `window.addEventListener('message', ...)` 中的 `case 'loadWorkspace':`

**修改**: 在載入工作區狀態後呼叫 `rebuildPwmConfig`

```javascript
case 'loadWorkspace':
    try {
        if (message.board) {
            boardSelect.value = message.board;
            window.setCurrentBoard(message.board);
            vscode.postMessage({
                command: 'updateBoard',
                board: message.board,
            });
        }

        if (message.theme) {
            currentTheme = message.theme;
            updateTheme(currentTheme);
        }

        if (message.state) {
            // 清空工作區
            workspace.clear();

            // 載入新狀態
            Blockly.serialization.workspaces.load(message.state.workspace, workspace);

            // 🔧 新增: 重建 PWM 配置
            rebuildPwmConfig(workspace);
        }

        // ...其他程式碼
    } catch (e) {
        // ...錯誤處理
    }
    break;
```

---

#### 3.3 新增積木變更監聽器

**插入位置**: 在 `rebuildPwmConfig` 函數之後

```javascript
/**
 * 監聽 esp32_pwm_setup 積木的欄位變更
 * 即時更新全域 PWM 配置
 */
workspace.addChangeListener(event => {
	if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId) {
		const block = workspace.getBlockById(event.blockId);
		if (block && block.type === 'esp32_pwm_setup') {
			window.esp32PwmFrequency = parseInt(block.getFieldValue('FREQUENCY')) || 75000;
			window.esp32PwmResolution = parseInt(block.getFieldValue('RESOLUTION')) || 8;
			console.log(`[PWM Config] 即時更新: ${window.esp32PwmFrequency}Hz @ ${window.esp32PwmResolution}bit`);
		}
	}
});
```

---

### Phase 4: 測試 (預估 2 小時)

#### 4.1 建立單元測試檔案

**檔案**: `src/test/suite/pwm-validation.test.ts`

```typescript
import * as assert from 'assert';

suite('ESP32 PWM Validation Tests', () => {
	// 注意: 這些函數在 WebView 環境中,需要透過 Mock 或整合測試驗證

	test('相容配置: 75000Hz @ 8bit 不應調整', () => {
		const result = validatePwmConfig(75000, 8);
		assert.strictEqual(result.adjusted, false);
		assert.strictEqual(result.frequency, 75000);
		assert.strictEqual(result.resolution, 8);
	});

	test('不相容配置: 75000Hz @ 12bit 應自動調整', () => {
		const result = validatePwmConfig(75000, 12);
		assert.strictEqual(result.adjusted, true);
		assert.ok(result.resolution < 12);
		assert.ok(result.warning.includes('超出限制'));
	});

	test('邊界值: 計算正確性', () => {
		const freq = 75000;
		const res = 8;
		const maxValue = freq * Math.pow(2, res);
		assert.ok(maxValue <= 80000000, `${maxValue} 應小於 80000000`);
	});
});

// Mock 函數 (因原函數在 WebView 中)
function validatePwmConfig(frequency: number, resolution: number) {
	const APB_CLK = 80000000;
	const maxValue = frequency * Math.pow(2, resolution);

	if (maxValue > APB_CLK) {
		const maxResolution = Math.floor(Math.log2(APB_CLK / frequency));
		const adjustedResolution = Math.max(8, maxResolution);

		return {
			frequency,
			resolution: adjustedResolution,
			adjusted: true,
			warning: `超出限制: ${maxValue} > ${APB_CLK}`,
		};
	}

	return {
		frequency,
		resolution,
		adjusted: false,
		info: `驗證通過: ${maxValue} < ${APB_CLK}`,
	};
}
```

**執行測試**:

```powershell
npm test
```

---

#### 4.2 手動測試檢查清單

**測試環境**: Extension Development Host + ESP32 開發板

##### 測試案例 1: 基本功能

-   [ ] 切換至 ESP32 開發板
-   [ ] Arduino 工具箱中顯示 "ESP32 PWM 設定" 積木
-   [ ] 拖曳積木至工作區
-   [ ] 修改頻率為 50000Hz,解析度為 10bit
-   [ ] 新增 arduino_analog_write 積木 (GPIO25, 值 512)
-   [ ] 生成程式碼,檢查包含 `ledcSetup(5, 50000, 10)`

##### 測試案例 2: 自動調整

-   [ ] 設定 PWM 為 75000Hz @ 12bit (不相容)
-   [ ] 生成程式碼
-   [ ] 檢查註解包含 "⚠️ 警告：原始設定...已自動調整"
-   [ ] 檢查 ledcSetup 使用調整後的解析度 (應為 10bit 或更低)

##### 測試案例 3: 向後相容

-   [ ] 建立新專案,不拖曳 PWM 設定積木
-   [ ] 直接使用 arduino_analog_write 積木
-   [ ] 生成程式碼,檢查使用預設值 `ledcSetup(..., 75000, 8)`

##### 測試案例 4: 開發板切換

-   [ ] 切換至 Arduino Uno
-   [ ] 工具箱中不顯示 PWM 設定積木
-   [ ] 切回 ESP32
-   [ ] 工具箱中重新顯示 PWM 設定積木

##### 測試案例 5: 工作區載入

-   [ ] 建立包含 PWM 設定積木的專案並儲存
-   [ ] 關閉並重新開啟專案
-   [ ] 檢查 PWM 設定值正確載入 (檢查 Console 訊息)

---

## 常見問題排解

### 問題 1: 積木未顯示在工具箱

**症狀**: 切換至 ESP32 後,Arduino 類別中未顯示 PWM 設定積木

**可能原因**:

1. arduino.json 未正確新增積木
2. 快取問題

**解決方案**:

```powershell
# 1. 檢查 arduino.json 格式是否正確 (JSON 語法)
# 2. 重新載入 Extension Development Host
# 3. 清除瀏覽器快取 (Developer Tools > Application > Clear storage)
```

---

### 問題 2: 生成的程式碼不包含 PWM 配置

**症狀**: 使用 analogWrite 但生成的程式碼仍使用 5000Hz / 12bit

**可能原因**:

1. 全域變數未正確更新
2. io.js 中的修改未生效

**解決方案**:

```javascript
// 在 blocklyEdit.js 中新增除錯訊息
console.log('[PWM Config Debug]', {
	frequency: window.esp32PwmFrequency,
	resolution: window.esp32PwmResolution,
	board: window.currentBoard,
});

// 檢查 Console 輸出,確認變數值正確
```

---

### 問題 3: 驗證函數未執行

**症狀**: 設定不相容配置但未顯示警告註解

**可能原因**:

1. validateAndAdjustPwmConfig 函數未正確定義
2. 生成器中未呼叫驗證函數

**解決方案**:

```javascript
// 在 io.js 中新增除錯訊息
const validated = window.validateAndAdjustPwmConfig(pwmFreq, pwmRes);
console.log('[Validation]', validated);

// 確認 validated 物件結構正確
```

---

### 問題 4: 測試失敗

**症狀**: `npm test` 執行失敗

**可能原因**:

1. TypeScript 編譯錯誤
2. 測試環境設定問題

**解決方案**:

```powershell
# 1. 清除編譯快取
Remove-Item -Recurse -Force out/

# 2. 重新編譯
npm run compile

# 3. 執行單一測試檔案
npm test -- --grep "ESP32 PWM"
```

---

## 下一步

### Phase 2 實作 (tasks.md)

完成 Quick Start 後,執行以下命令生成詳細任務清單:

```powershell
# 注意: 此命令由 speckit.tasks 提供 (尚未實作)
# 手動參考 spec.md 中的需求建立任務清單
```

### 實體硬體測試

1. 上傳程式到 ESP32
2. 連接 AT8833CR 馬達驅動模組 (QFN16 封裝,Pin-to-Pin 替代 DRV8833)
3. 驗證馬達運轉平順,無異常噪音
4. 測試 AT8833CR 特性:
    - 寬電壓供電 (2.7-15V)
    - 低導通電阻 (800mΩ)
    - 過流/過溫保護功能
5. 使用示波器檢查 PWM 頻率正確 (可選)

**⚠️ 重要警告：GPIO 腳位使用限制**

當在同一個 ESP32 專案中同時使用伺服馬達和類比輸出（高頻 PWM）功能時，請務必注意以下限制：

-   **不可在同一腳位上同時使用伺服馬達和類比輸出積木**
-   原因：伺服馬達使用 ESP32Servo 庫的固定 50Hz PWM，類比輸出使用 LEDC 的可調頻率 PWM（預設 75KHz）
-   後果：如果在同一腳位上使用兩種積木，會導致硬體配置衝突，後設定的積木會覆蓋前者的設定，造成功能異常
-   **正確做法**：
    -   伺服馬達使用 GPIO18（範例）
    -   類比輸出使用 GPIO25（範例）
    -   確保兩者使用不同的 GPIO 腳位

範例配置：

```
✓ 正確：伺服馬達 (GPIO18) + 類比輸出 (GPIO25)
✗ 錯誤：伺服馬達 (GPIO18) + 類比輸出 (GPIO18)
```

### 多語言翻譯擴展

1. 參考 `media/locales/` 中的其他語言檔案
2. 新增 ESP32*PWM*\* 翻譯至其他語言 (如 es, fr, de 等)

---

## 資源連結

-   **功能規格**: [spec.md](./spec.md)
-   **實作計畫**: [plan.md](./plan.md)
-   **研究文件**: [research.md](./research.md)
-   **資料模型**: [data-model.md](./data-model.md)
-   **API 契約**: [contracts/esp32-pwm-api.md](./contracts/esp32-pwm-api.md)
-   **Blockly 官方文件**: https://developers.google.com/blockly
-   **ESP32 Arduino Core 文件**: https://docs.espressif.com/projects/arduino-esp32

---

**Quick Start 版本**: 1.0  
**最後更新**: 2025-01-21  
**問題回報**: 請在 GitHub 上開啟 Issue
