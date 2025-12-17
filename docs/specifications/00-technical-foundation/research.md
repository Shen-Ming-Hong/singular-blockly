# 技術架構研究 (research.md)

> 依據 Spec Kit 方法論，從專案原始碼分析技術架構、資料流、元件依賴關係。
> 最後更新：2025-12-17

---

## 一、研究方法

採用 Spec Kit Plan Agent 的 Phase 0 研究流程：

1. **識別 Technical Context 中的 NEEDS CLARIFICATION**
2. **對每個依賴項研究最佳實踐**
3. **對每個整合點研究模式**
4. **記錄決策、理由、替代方案**

---

## 二、技術堆疊詳細分析

### 2.1 核心依賴

| 依賴項                    | 版本     | 用途           | 備註                     |
| ------------------------- | -------- | -------------- | ------------------------ |
| Blockly                   | 12.3.1   | 視覺化程式編輯 | Google 官方積木程式庫    |
| @blockly/theme-modern     | 7.0.1    | 現代化 UI 主題 | 擴展主題套件             |
| TypeScript                | 5.9.3    | 型別安全開發   | Extension Host 程式碼    |
| Node.js                   | 22.16.0+ | 執行環境       | Extension Host 運行時    |
| VS Code API               | 1.105.0+ | 編輯器整合     | WebView、Commands、MCP   |
| Webpack                   | 5.102.1  | 打包工具       | 產出 `dist/extension.js` |
| @modelcontextprotocol/sdk | 1.24.3   | MCP Server SDK | AI 工具整合              |
| Zod                       | 4.1.13   | Schema 驗證    | MCP 工具輸入驗證         |

### 2.2 開發依賴

| 依賴項                | 版本   | 用途                      |
| --------------------- | ------ | ------------------------- |
| @vscode/test-cli      | 0.0.12 | VS Code 測試框架          |
| @vscode/test-electron | 2.5.2  | 測試 Electron 環境        |
| sinon                 | 21.0.0 | Mock/Stub 測試工具        |
| ESLint                | 9.38.0 | 程式碼品質檢查            |
| ts-loader             | 9.5.4  | TypeScript Webpack loader |

---

## 三、架構分層詳解

### 3.1 Extension Host (Node.js 環境)

```
src/
├── extension.ts              # 擴充功能入口點
│   ├── activate()            # 啟用函數
│   ├── registerCommands()    # 命令註冊
│   ├── setupStatusBar()      # 狀態列設定
│   └── registerMcpProvider() # MCP Provider 註冊
│
├── webview/
│   ├── webviewManager.ts     # WebView 面板管理 (~970 行)
│   │   ├── createAndShowWebView()    # 建立/顯示面板
│   │   ├── getWebviewContent()       # 生成 HTML 內容
│   │   ├── discoverArduinoModules()  # 動態模組發現
│   │   ├── resolveToolboxIncludes()  # 工具箱配置解析
│   │   ├── setupFileWatcher()        # FileWatcher 機制
│   │   └── previewBackup()           # 備份預覽功能
│   │
│   └── messageHandler.ts     # 訊息處理器 (~800 行)
│       ├── handleUpdateCode()        # 程式碼更新
│       ├── handleSaveWorkspace()     # 工作區儲存
│       ├── handleUpdateBoard()       # 開發板切換
│       ├── handleCreateBackup()      # 備份建立
│       └── handleRequestWorkspaceReload()  # MCP 重載
│
├── services/
│   ├── fileService.ts        # 檔案操作服務
│   │   ├── readFile() / writeFile()
│   │   ├── readJsonFile() / writeJsonFile()
│   │   ├── copyFile() / deleteFile()
│   │   └── listFiles() / getFileStats()
│   │
│   ├── settingsManager.ts    # 設定管理服務
│   │   ├── readSetting() / updateSetting()
│   │   ├── getTheme() / toggleTheme()
│   │   ├── syncPlatformIOSettings()
│   │   └── getAutoBackupInterval()
│   │
│   ├── localeService.ts      # 多語言服務
│   │   ├── getCurrentLanguage()
│   │   ├── getLocalizedMessage()
│   │   └── getSupportedLocales()
│   │
│   ├── workspaceValidator.ts # 工作區驗證
│   │   ├── validateWorkspace()
│   │   ├── showSafetyWarning()
│   │   └── detectProjectType()
│   │
│   └── logging.ts            # 統一日誌服務
│       ├── log.info() / log.error()
│       └── handleWebViewLog()
│
└── mcp/
    ├── mcpProvider.ts        # MCP Provider 註冊
    ├── mcpServer.ts          # STDIO Transport Server
    ├── blockDictionary.ts    # 積木元資料字典
    └── tools/
        ├── blockQuery.ts     # 積木查詢工具
        ├── platformConfig.ts # 平台配置工具
        └── workspaceOps.ts   # 工作區操作工具
```

### 3.2 WebView (瀏覽器環境)

```
media/
├── html/
│   ├── blocklyEdit.html      # 主編輯器 HTML
│   └── blocklyPreview.html   # 備份預覽 HTML
│
├── js/
│   ├── blocklyEdit.js        # 主編輯器邏輯 (~2200 行)
│   │   ├── log 物件          # WebView 日誌系統
│   │   ├── backupManager     # 備份管理器
│   │   ├── functionSearchManager  # 積木搜尋
│   │   ├── languageManager   # 語言管理器
│   │   └── 訊息監聽器        # Extension 通訊
│   │
│   ├── blocklyPreview.js     # 預覽視窗邏輯
│   └── experimentalBlockMarker.js  # 實驗積木標記
│
├── blockly/
│   ├── blocks/               # 積木定義
│   │   ├── arduino.js        # Arduino 基礎積木
│   │   ├── motors.js         # 馬達積木 (servo, encoder)
│   │   ├── sensors.js        # 感測器積木
│   │   ├── huskylens.js      # HuskyLens 智慧鏡頭
│   │   ├── pixetto.js        # Pixetto 智慧鏡頭
│   │   ├── esp32-wifi-mqtt.js  # ESP32 WiFi/MQTT
│   │   ├── functions.js      # 自定義函數積木
│   │   ├── loops.js          # 迴圈積木
│   │   └── board_configs.js  # 開發板配置
│   │
│   ├── generators/arduino/   # Arduino 程式碼生成器
│   │   ├── index.js          # arduinoGenerator 主體
│   │   ├── motors.js         # 馬達程式碼生成
│   │   ├── sensors.js        # 感測器程式碼生成
│   │   ├── huskylens.js      # HuskyLens 程式碼生成
│   │   ├── pixetto.js        # Pixetto 程式碼生成
│   │   ├── esp32-wifi-mqtt.js  # WiFi/MQTT 程式碼生成
│   │   ├── logic.js          # 邏輯程式碼生成
│   │   ├── loops.js          # 迴圈程式碼生成
│   │   ├── math.js           # 數學程式碼生成
│   │   ├── text.js           # 文字程式碼生成
│   │   ├── lists.js          # 列表程式碼生成
│   │   ├── variables.js      # 變數程式碼生成
│   │   ├── functions.js      # 函數程式碼生成
│   │   └── io.js             # I/O 程式碼生成
│   │
│   └── themes/               # Blockly 主題
│       ├── singular.js       # 淺色主題
│       └── singularDark.js   # 深色主題
│
├── toolbox/                  # 工具箱配置
│   ├── index.json            # 主配置 (含 $include 引用)
│   └── categories/           # 分類定義
│       ├── arduino.json
│       ├── motors.json
│       ├── sensors.json
│       └── ...
│
├── locales/                  # 多語言訊息
│   ├── en/messages.js
│   ├── zh-hant/messages.js
│   ├── ja/messages.js
│   └── ... (15 種語言)
│
└── css/
    ├── blocklyEdit.css       # 主編輯器樣式
    └── experimentalBlocks.css  # 實驗積木樣式
```

---

## 四、核心資料流

### 4.1 Extension ↔ WebView 通訊

```
┌─────────────────────────┐     postMessage      ┌─────────────────────────┐
│    Extension Host       │ ◄─────────────────── │      WebView            │
│   (messageHandler.ts)   │                      │    (blocklyEdit.js)     │
│                         │ ──────────────────► │                         │
│                         │     postMessage      │                         │
└─────────────────────────┘                      └─────────────────────────┘

訊息類型（WebView → Extension）：
├── saveWorkspace       # 儲存工作區狀態
├── updateCode          # 更新 Arduino 程式碼
├── updateBoard         # 切換開發板
├── requestInitialState # 請求初始狀態
├── createBackup        # 建立備份
├── restoreBackup       # 還原備份
├── updateTheme         # 更新主題
└── log                 # 日誌傳遞

訊息類型（Extension → WebView）：
├── loadWorkspace       # 載入工作區狀態
├── updateTheme         # 主題變更通知
├── backupCreated       # 備份建立結果
├── backupListResponse  # 備份列表
├── createVariable      # 建立變數
└── deleteVariable      # 刪除變數
```

### 4.2 工作區狀態結構

```typescript
// blockly/main.json 結構
interface WorkspaceState {
	workspace: {
		blocks: {
			languageVersion: number; // Blockly 版本 (0)
			blocks: BlockDefinition[]; // 頂層積木陣列
		};
		variables?: VariableDefinition[];
	};
	board: string; // 'arduino_uno' | 'esp32' | 'none' | ...
	theme: string; // 'light' | 'dark'
}

interface BlockDefinition {
	type: string; // 積木類型
	id: string; // 唯一識別碼
	x?: number; // 位置 X (頂層積木)
	y?: number; // 位置 Y (頂層積木)
	fields?: Record<string, any>; // 欄位值
	inputs?: Record<string, InputDef>; // 輸入連接
	next?: { block: BlockDefinition }; // 下一個積木
	extraState?: Record<string, any>; // 額外狀態
}
```

### 4.3 Arduino 程式碼生成流程

```
┌──────────────────┐
│ Blockly Workspace│
└────────┬─────────┘
         │ Blockly.serialization.workspaces.save()
         ▼
┌──────────────────┐
│    main.json     │ ← 工作區持久化
└────────┬─────────┘
         │ arduinoGenerator.workspaceToCode()
         ▼
┌──────────────────┐
│arduinoGenerator  │
│   ├── init()     │ ← 初始化 includes_, variables_, setupCode_ 等
│   ├── forBlock[] │ ← 各積木類型的程式碼生成器
│   └── finish()   │ ← 組合最終程式碼
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   src/main.cpp   │ ← Arduino 原始碼
└────────┬─────────┘
         │ PlatformIO 編譯
         ▼
┌──────────────────┐
│   .pio/build/    │ ← 編譯輸出
└──────────────────┘
```

### 4.4 arduinoGenerator 內部結構

```javascript
// 初始化階段 (init)
arduinoGenerator.includes_ = {}; // #include 標頭檔
arduinoGenerator.variables_ = {}; // 全域變數宣告
arduinoGenerator.definitions_ = {}; // 其他定義
arduinoGenerator.functions_ = {}; // 自定義函數
arduinoGenerator.comments_ = {}; // 註釋
arduinoGenerator.setupCode_ = []; // setup() 內程式碼
arduinoGenerator.loopCodeOnce_ = {}; // loop() 開頭一次性程式碼
arduinoGenerator.lib_deps_ = []; // PlatformIO 函式庫依賴
arduinoGenerator.build_flags_ = []; // 編譯旗標
arduinoGenerator.lib_ldf_mode_ = null; // 函式庫連結模式
arduinoGenerator.alwaysGenerateBlocks_ = []; // 強制生成積木

// 生成階段 (forBlock)
window.arduinoGenerator.forBlock['servo_setup'] = function (block) {
	// 1. 收集欄位值
	const varName = block.getFieldValue('VAR');
	const pin = block.getFieldValue('PIN');

	// 2. 根據開發板選擇函式庫
	if (currentBoard === 'esp32') {
		arduinoGenerator.includes_['servo'] = '#include <ESP32Servo.h>';
		arduinoGenerator.lib_deps_.push('madhephaestus/ESP32Servo@^3.0.6');
	} else {
		arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		arduinoGenerator.lib_deps_.push('arduino-libraries/Servo@^1.2.2');
	}

	// 3. 宣告變數
	arduinoGenerator.variables_['servo_' + varName] = `Servo ${varName};`;

	// 4. setup 程式碼
	arduinoGenerator.setupCode_.push(`${varName}.attach(${pin});`);

	return ''; // 此積木不產生 loop 程式碼
};

// 完成階段 (finish)
// 組合順序: 警告 → 註釋 → includes → 變數 → 定義 → 函數 → setup/loop
```

---

## 五、MCP Server 整合架構

### 5.1 MCP Server 元件

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode MCP Host                          │
│  ┌──────────────────┐     ┌─────────────────────────────┐  │
│  │   mcpProvider.ts │────►│ registerMcpProvider()       │  │
│  │                  │     │ ├── McpServerDefinitionProvider │
│  │                  │     │ └── resolveServerDefinition() │
│  └──────────────────┘     └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ STDIO Transport
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server Process                        │
│  ┌──────────────────┐                                       │
│  │   mcpServer.ts   │ ← 獨立 Node.js 進程                    │
│  │   ├── main()     │                                       │
│  │   ├── McpServer  │                                       │
│  │   └── StdioServerTransport                               │
│  └────────┬─────────┘                                       │
│           │ 註冊工具                                         │
│           ▼                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    MCP Tools                          │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │ blockQuery   │ │platformConfig│ │workspaceOps  │  │  │
│  │  │ ├── get_block│ │ ├── get_board│ │ ├── get_     │  │  │
│  │  │ │   _usage   │ │ │   _config  │ │ │   workspace│  │  │
│  │  │ ├── search_  │ │ └── list_    │ │ │   _state   │  │  │
│  │  │ │   blocks   │ │     boards   │ │ ├── refresh_ │  │  │
│  │  │ └── list_    │ └──────────────┘ │ │   editor   │  │  │
│  │  │     blocks_  │                  │ └── get_     │  │  │
│  │  │     by_cat   │                  │     generated│  │  │
│  │  └──────────────┘                  │     _code    │  │  │
│  │                                    └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 MCP 工具輸入驗證 (Zod Schema)

```typescript
// blockQuery.ts - get_block_usage 範例
server.tool(
  'get_block_usage',
  '查詢積木用法並生成 JSON 模板',
  {
    blockType: z.string().describe('積木類型識別碼'),
    language: z.enum(['en', 'zh-hant', 'ja', ...]).default('zh-hant'),
    context: z.object({
      functionName: z.string().optional(),
      arguments: z.array(z.object({...})).optional(),
      // ... 更多欄位
    }).passthrough().optional()
  },
  async ({ blockType, language, context }) => {
    // 工具實作
  }
);
```

### 5.3 FileWatcher 整合機制

```
┌─────────────────┐    修改    ┌─────────────────┐
│   MCP Client    │ ─────────► │ blockly/main.json│
│ (AI Assistant)  │            └────────┬────────┘
└─────────────────┘                     │
                                        │ FileWatcher 偵測
                                        ▼
                              ┌─────────────────────┐
                              │ webviewManager.ts   │
                              │ handleFileChange()  │
                              │ ├── debounce 500ms  │
                              │ └── triggerWorkspace│
                              │     Reload()        │
                              └──────────┬──────────┘
                                         │ postMessage
                                         ▼
                              ┌─────────────────────┐
                              │     WebView         │
                              │ loadWorkspace()     │
                              │ ├── 載入新狀態      │
                              │ └── 重新生成程式碼   │
                              └─────────────────────┘
```

---

## 六、Blockly 積木定義模式

### 6.1 雙檔案模式

每個積木類型需要兩個檔案：

1. **積木定義** (`media/blockly/blocks/{category}.js`)
2. **程式碼生成器** (`media/blockly/generators/arduino/{category}.js`)

### 6.2 積木定義範例

```javascript
// blocks/motors.js
Blockly.Blocks['servo_setup'] = {
	init: function () {
		// 1. 輸入欄位配置
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SERVO_SETUP'))
			.appendField(new Blockly.FieldTextInput('myServo'), 'VAR')
			.appendField(window.languageManager.getMessage('SERVO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getPWMPinOptions();
				}),
				'PIN'
			);

		// 2. 連接點設定
		this.setPreviousStatement(true, null); // 可連接上方
		this.setNextStatement(true, null); // 可連接下方

		// 3. 樣式設定
		this.setStyle('motors_blocks');

		// 4. 工具提示
		this.setTooltip(window.languageManager.getMessage('SERVO_SETUP_TOOLTIP'));
	},

	// 5. 變異記錄 (可選)
	mutationToDom: function () {
		/* 序列化額外狀態 */
	},
	domToMutation: function (xml) {
		/* 反序列化額外狀態 */
	},
};
```

### 6.3 程式碼生成器範例

```javascript
// generators/arduino/motors.js

// 模組載入時自動註冊需要強制掃描的積木類型
(function () {
	if (window.arduinoGenerator?.registerAlwaysGenerateBlock) {
		window.arduinoGenerator.registerAlwaysGenerateBlock('servo_setup');
	}
})();

window.arduinoGenerator.forBlock['servo_setup'] = function (block) {
	const varName = block.getFieldValue('VAR');
	const pin = block.getFieldValue('PIN');
	const currentBoard = window.getCurrentBoard();

	// 根據開發板選擇函式庫
	if (currentBoard === 'esp32') {
		arduinoGenerator.includes_['servo'] = '#include <ESP32Servo.h>';
		arduinoGenerator.lib_deps_.push('madhephaestus/ESP32Servo@^3.0.6');
	} else {
		arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		arduinoGenerator.lib_deps_.push('arduino-libraries/Servo@^1.2.2');
	}

	// 變數宣告
	arduinoGenerator.variables_['servo_' + varName] = `Servo ${varName};`;

	// setup 程式碼
	arduinoGenerator.setupCode_.push(`${varName}.attach(${pin});`);

	return ''; // 此積木不產生 loop 程式碼
};
```

### 6.4 積木類型列表

| 類別         | 積木類型                                            | 說明              |
| ------------ | --------------------------------------------------- | ----------------- |
| Arduino 基礎 | `arduino_setup_loop`                                | Setup/Loop 主結構 |
| 馬達         | `servo_setup`, `servo_move`, `servo_stop`           | 伺服馬達          |
| 馬達         | `encoder_setup`, `encoder_read`, `encoder_reset`    | 編碼馬達          |
| 馬達         | `encoder_pid_setup`, `encoder_pid_compute`          | PID 控制          |
| 感測器       | `sensor_ultrasonic`, `sensor_dht`, `sensor_button`  | 基礎感測器        |
| 視覺         | `huskylens_init_*`, `huskylens_request_*`           | HuskyLens AI 鏡頭 |
| 視覺         | `pixetto_init`, `pixetto_detect_*`                  | Pixetto 智慧鏡頭  |
| ESP32        | `wifi_connect`, `mqtt_*`                            | WiFi/MQTT 連線    |
| 邏輯         | `controls_if`, `logic_compare`                      | 條件判斷          |
| 迴圈         | `controls_repeat`, `controls_whileUntil`            | 迴圈結構          |
| 數學         | `math_number`, `math_arithmetic`                    | 數學運算          |
| 文字         | `text`, `text_print`, `text_join`                   | 文字處理          |
| 變數         | `variables_get`, `variables_set`                    | 變數操作          |
| 函數         | `procedures_defnoreturn`, `procedures_callnoreturn` | 自定義函數        |

---

## 七、開發板支援架構

### 7.1 支援的開發板

| 開發板              | 識別碼            | PlatformIO 平台 | 框架    |
| ------------------- | ----------------- | --------------- | ------- |
| Arduino UNO         | `arduino_uno`     | atmelavr        | arduino |
| Arduino Nano        | `arduino_nano`    | atmelavr        | arduino |
| Arduino Mega        | `arduino_mega`    | atmelavr        | arduino |
| ESP32 DevKit        | `esp32`           | espressif32     | arduino |
| ESP32-C3 Super Mini | `esp32_supermini` | espressif32     | arduino |

### 7.2 開發板配置結構

```javascript
// board_configs.js
window.BOARD_CONFIGS = {
	arduino_uno: {
		name: 'Arduino UNO',
		platform: 'atmelavr',
		board: 'uno',
		framework: 'arduino',
		pins: {
			digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
			analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
			pwm: [3, 5, 6, 9, 10, 11],
			interrupt: [2, 3],
		},
	},
	esp32: {
		name: 'ESP32 DevKit',
		platform: 'espressif32',
		board: 'esp32dev',
		framework: 'arduino',
		pins: {
			digital: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
			analog: [32, 33, 34, 35, 36, 39],
			pwm: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
			interrupt: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
		},
	},
	// ...
};
```

### 7.3 函式庫依賴對應

| 功能      | Arduino                            | ESP32                                |
| --------- | ---------------------------------- | ------------------------------------ |
| 伺服馬達  | `arduino-libraries/Servo@^1.2.2`   | `madhephaestus/ESP32Servo@^3.0.6`    |
| 編碼馬達  | `paulstoffregen/Encoder@^1.4.4`    | `madhephaestus/ESP32Encoder@^0.11.7` |
| HuskyLens | `DFRobot/DFRobot_HuskyLens@^1.0.7` | `DFRobot/DFRobot_HuskyLens@^1.0.7`   |
| Pixetto   | `VIA-AI/Pixetto@^1.0.3`            | - (不支援)                           |
| WiFi/MQTT | -                                  | `knolleary/PubSubClient@^2.8`        |

---

## 八、多語言 (i18n) 架構

### 8.1 支援語言

| 語言代碼 | 語言名稱           | 涵蓋率 |
| -------- | ------------------ | ------ |
| en       | English            | 100%   |
| zh-hant  | 繁體中文           | 100%   |
| ja       | 日本語             | ~99%   |
| ko       | 한국어             | ~99%   |
| es       | Español            | ~98%   |
| de       | Deutsch            | ~98%   |
| fr       | Français           | ~98%   |
| it       | Italiano           | ~98%   |
| pt-br    | Português (Brasil) | ~98%   |
| ru       | Русский            | ~98%   |
| pl       | Polski             | ~97%   |
| hu       | Magyar             | ~97%   |
| tr       | Türkçe             | ~97%   |
| bg       | Български          | ~97%   |
| cs       | Čeština            | ~97%   |

### 8.2 訊息檔案結構

```javascript
// media/locales/zh-hant/messages.js
window.singularBlocklyMessages = {
	// Arduino 基礎
	ARDUINO_SETUP: '初始設定',
	ARDUINO_LOOP: '主迴圈',

	// 馬達
	SERVO_SETUP: '設定伺服馬達',
	SERVO_PIN: '腳位',
	SERVO_SETUP_TOOLTIP: '初始化伺服馬達，需要 PWM 腳位',

	// UI 元素
	THEME_TOGGLE: '切換主題',
	BOARD_SELECT_LABEL: '選擇開發板：',

	// 備份
	BACKUP_MANAGER_TITLE: '備份管理',
	BACKUP_CREATE_NEW: '建立新備份',
};
```

### 8.3 語言載入流程

```
┌─────────────────────┐
│ VS Code 語言設定    │
│ vscode.env.language │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  localeService.ts   │
│ getCurrentLanguage()│
│ 'zh-tw' → 'zh-hant' │ ← 語言映射
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│           webviewManager.ts             │
│ loadLocaleScripts()                     │
│ ├── media/locales/{lang}/messages.js   │ ← 自訂訊息
│ └── node_modules/blockly/msg/{lang}.js │ ← Blockly 核心訊息
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│     WebView         │
│ languageManager     │
│ getMessage('KEY')   │
└─────────────────────┘
```

---

## 九、測試架構

### 9.1 測試框架

-   **VS Code Test CLI**: `@vscode/test-cli@0.0.12`
-   **VS Code Test Electron**: `@vscode/test-electron@2.5.2`
-   **Sinon**: `sinon@21.0.0` (Mocking/Stubbing)

### 9.2 測試結構

```
src/test/
├── helpers/
│   ├── mockVscode.ts      # VS Code API Mock
│   └── testUtils.ts       # 測試工具函數
│
├── services/
│   ├── fileService.test.ts
│   ├── settingsManager.test.ts
│   ├── localeService.test.ts
│   └── workspaceValidator.test.ts
│
├── webview/
│   ├── webviewManager.test.ts
│   └── messageHandler.test.ts
│
└── integration/
    └── extension.test.ts
```

### 9.3 依賴注入模式

```typescript
// 生產程式碼
export class FileService {
	constructor(
		private workspacePath: string,
		fileSystem?: FileSystem // 可選依賴注入
	) {
		this.fs = fileSystem || fs; // 預設使用真實 fs
	}
}

// 測試程式碼
const mockFs = {
	existsSync: sinon.stub().returns(true),
	promises: {
		readFile: sinon.stub().resolves('mock content'),
	},
};
const service = new FileService('/test', mockFs);
```

---

## 十、效能指標

| 指標                              | 目標             | 當前值  |
| --------------------------------- | ---------------- | ------- |
| 編譯時間 (`npm run compile`)      | ≤ 5 秒           | ~3 秒   |
| Bundle 大小 (`dist/extension.js`) | ≤ 137 KB         | ~130 KB |
| 測試執行時間 (`npm test`)         | ≤ 3 秒           | ~2 秒   |
| WebView 載入時間                  | ≤ 2 秒           | ~1.5 秒 |
| Blockly 11 相容性                 | main.json 可載入 | ✅      |

---

## 十一、決策記錄

### 11.1 選擇 MCP over Language Server Protocol

**決策**: 使用 Model Context Protocol (MCP) 而非 Language Server Protocol (LSP)

**理由**:

-   MCP 專為 AI 助手工具整合設計
-   VS Code 1.105.0+ 原生支援 MCP
-   更簡單的工具定義方式 (Zod Schema)
-   與 Blockly 視覺編輯器整合更自然

**替代方案考慮**:

-   LSP: 過於複雜，主要用於文字編輯
-   REST API: 需要額外的伺服器管理

### 11.2 選擇 FileWatcher 而非輪詢

**決策**: 使用 VS Code FileSystemWatcher 監控 main.json 變更

**理由**:

-   更即時的響應
-   更低的資源消耗
-   原生整合 VS Code API

**實作細節**:

-   500ms debounce 避免頻繁觸發
-   內部更新標記 (`isInternalUpdate`) 避免循環

### 11.3 選擇 Zod 進行 Schema 驗證

**決策**: 使用 Zod 而非 JSON Schema

**理由**:

-   TypeScript 友好
-   執行時驗證
-   更好的錯誤訊息

---

## 十二、待補充項目

以下項目在後續開發中需要補充文件：

1. **錯誤處理策略** - 統一的錯誤處理與回復機制
2. **快取策略** - WebView 資源快取機制
3. **安全性考量** - CSP 策略、輸入驗證
4. **無障礙設計** - 螢幕閱讀器支援
5. **效能監控** - 載入時間追蹤機制

---

_此文件由 Spec Kit research 方法論產生，作為技術架構的權威參考。_
