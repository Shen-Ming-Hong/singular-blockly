# Quickstart: ESP32 WiFi/MQTT 積木與修復

**Date**: 2025-12-13  
**Spec**: [spec.md](./spec.md)

## 開發者快速入門

本指南幫助開發者快速理解並開始實作本功能。

---

## 環境設定

### 必要條件

-   Node.js 22.16.0+
-   VS Code 1.105.0+
-   Git

### 初始化

```powershell
# 切換到功能分支
git checkout -b 016-esp32-wifi-mqtt

# 安裝依賴
npm install

# 啟動開發模式
npm run watch
```

### 測試 ESP32 硬體

-   ESP32 DevKit 或 ESP32-C3 Super Mini 開發板
-   PlatformIO 擴充功能已安裝
-   USB 連接線

---

## 功能概述

| 功能           | 優先級 | 類型        | 關鍵檔案                                                             |
| -------------- | ------ | ----------- | -------------------------------------------------------------------- |
| 視角保持       | P1     | Bug Fix     | `blocklyEdit.js`                                                     |
| text_join 修復 | P1     | Bug Fix     | `generators/arduino/text.js`                                         |
| ESP32 WiFi     | P2     | New Feature | `blocks/esp32-wifi-mqtt.js`, `generators/arduino/esp32-wifi-mqtt.js` |
| ESP32 MQTT     | P2     | New Feature | 同上                                                                 |
| 字串轉數字     | P2     | New Feature | `generators/arduino/text.js`                                         |

---

## 檔案位置速查

```
media/
├── blockly/
│   ├── blocks/
│   │   └── esp32-wifi-mqtt.js    ← 新增積木定義
│   └── generators/arduino/
│       ├── esp32-wifi-mqtt.js    ← 新增代碼生成
│       └── text.js               ← 修改 text_join
├── js/
│   └── blocklyEdit.js            ← 視角保持邏輯（約 L1220）
├── toolbox/
│   ├── index.json                ← 新增 communication 類別
│   └── categories/
│       └── communication.json    ← 新增檔案
└── locales/
    ├── en/messages.js            ← 英文翻譯
    └── zh-hant/messages.js       ← 繁體中文翻譯
```

---

## 實作指南

### 1. Bug Fix: 視角保持 (FR-001 ~ FR-003)

**檔案**: `media/js/blocklyEdit.js`

**位置**: 在 `workspace.addChangeListener()` 區塊內新增

```javascript
// 視角保持變數
let viewportState = null;
let viewportRestoreTimer = null;

// 在現有 changeListener 中新增
if (event.type === Blockly.Events.BLOCK_DELETE) {
	// 首次刪除時儲存視角
	if (!viewportRestoreTimer) {
		const metrics = workspace.getMetrics();
		viewportState = {
			scrollX: metrics.viewLeft,
			scrollY: metrics.viewTop,
			scale: workspace.getScale(),
		};
	}

	// Debounce 恢復
	clearTimeout(viewportRestoreTimer);
	viewportRestoreTimer = setTimeout(() => {
		if (viewportState) {
			workspace.scroll(viewportState.scrollX, viewportState.scrollY);
			// workspace.setScale(viewportState.scale); // 若需恢復縮放
			viewportState = null;
		}
		viewportRestoreTimer = null;
	}, 50);
}
```

---

### 2. Bug Fix: text_join 修復 (FR-004 ~ FR-006)

**檔案**: `media/blockly/generators/arduino/text.js`

**修改前**:

```javascript
const code = 'String(' + items.join(' + ') + ')';
```

**修改後**:

```javascript
window.arduinoGenerator.forBlock['text_join'] = function (block) {
	const items = [];
	for (let i = 0; i < block.itemCount_; i++) {
		const item = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '""';
		items.push(`String(${item})`);
	}

	if (items.length === 0) {
		return ['String("")', window.arduinoGenerator.ORDER_ATOMIC];
	}

	return [items.join(' + '), window.arduinoGenerator.ORDER_ADDITION];
};
```

---

### 3. 新增積木檔案

**建立檔案**: `media/blockly/blocks/esp32-wifi-mqtt.js`

```javascript
/**
 * ESP32 WiFi/MQTT 積木定義
 */

'use strict';

// WiFi 連線積木
Blockly.Blocks['esp32_wifi_connect'] = {
	init: function () {
		this.appendDummyInput().appendField(Blockly.Msg['ESP32_WIFI_CONNECT']);
		this.appendDummyInput().appendField(Blockly.Msg['ESP32_WIFI_CONNECT_SSID']).appendField(new Blockly.FieldTextInput('MyWiFi'), 'SSID');
		this.appendDummyInput().appendField(Blockly.Msg['ESP32_WIFI_CONNECT_PASSWORD']).appendField(new Blockly.FieldTextInput(''), 'PASSWORD');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(210);
		this.setTooltip(Blockly.Msg['ESP32_WIFI_CONNECT_TOOLTIP']);
	},
};

// ... 其他積木定義參照 data-model.md
```

---

### 4. 新增 Generator 檔案

**建立檔案**: `media/blockly/generators/arduino/esp32-wifi-mqtt.js`

```javascript
/**
 * ESP32 WiFi/MQTT 代碼生成器
 */

'use strict';

// 板子檢查輔助函數
function isEsp32Board() {
	return window.currentBoard === 'esp32' || window.currentBoard === 'supermini';
}

// WiFi 連線生成器
window.arduinoGenerator.forBlock['esp32_wifi_connect'] = function (block) {
	if (!isEsp32Board()) {
		return '// WiFi 功能僅支援 ESP32 系列板子\n';
	}

	const ssid = block.getFieldValue('SSID');
	const password = block.getFieldValue('PASSWORD');

	// 加入 WiFi 標頭檔
	window.arduinoGenerator.includes_['wifi'] = '#include <WiFi.h>';

	// 生成連線代碼
	let code = `WiFi.mode(WIFI_STA);\n`;
	code += `WiFi.begin("${ssid}", "${password}");\n`;
	code += `Serial.print("Connecting to WiFi");\n`;
	code += `unsigned long _wifiStartTime = millis();\n`;
	code += `while (WiFi.status() != WL_CONNECTED && millis() - _wifiStartTime < 10000) {\n`;
	code += `  delay(500);\n`;
	code += `  Serial.print(".");\n`;
	code += `}\n`;
	code += `if (WiFi.status() == WL_CONNECTED) {\n`;
	code += `  Serial.println("\\nWiFi Connected!");\n`;
	code += `  Serial.print("IP: ");\n`;
	code += `  Serial.println(WiFi.localIP());\n`;
	code += `} else {\n`;
	code += `  Serial.println("\\nWiFi Connection Failed!");\n`;
	code += `}\n`;

	return code;
};

// ... 其他生成器參照 data-model.md
```

---

### 5. 工具箱配置

**建立檔案**: `media/toolbox/categories/communication.json`

```json
{
	"kind": "category",
	"name": "%{CATEGORY_COMMUNICATION}",
	"categorystyle": "communication_category",
	"contents": [
		{ "kind": "label", "text": "WiFi" },
		{ "kind": "block", "type": "esp32_wifi_connect" },
		{ "kind": "block", "type": "esp32_wifi_disconnect" },
		{ "kind": "block", "type": "esp32_wifi_status" },
		{ "kind": "block", "type": "esp32_wifi_get_ip" },
		{ "kind": "block", "type": "esp32_wifi_scan" },
		{
			"kind": "block",
			"type": "esp32_wifi_get_ssid",
			"inputs": {
				"INDEX": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
			}
		},
		{
			"kind": "block",
			"type": "esp32_wifi_get_rssi",
			"inputs": {
				"INDEX": { "shadow": { "type": "math_number", "fields": { "NUM": 0 } } }
			}
		},
		{ "kind": "sep" },
		{ "kind": "label", "text": "MQTT" },
		{ "kind": "block", "type": "esp32_mqtt_setup" },
		{ "kind": "block", "type": "esp32_mqtt_connect" },
		{ "kind": "block", "type": "esp32_mqtt_publish" },
		{ "kind": "block", "type": "esp32_mqtt_subscribe" },
		{ "kind": "block", "type": "esp32_mqtt_loop" },
		{ "kind": "block", "type": "esp32_mqtt_get_topic" },
		{ "kind": "block", "type": "esp32_mqtt_get_message" }
	]
}
```

**修改檔案**: `media/toolbox/index.json`

在 `sensors.json` 之後新增：

```json
{
	"$include": "./categories/communication.json"
}
```

---

### 6. i18n 翻譯

**必須更新的 15 個語言檔案**:

```
media/locales/
├── en/messages.js
├── es/messages.js
├── pt-br/messages.js
├── fr/messages.js
├── de/messages.js
├── it/messages.js
├── ru/messages.js
├── ja/messages.js
├── ko/messages.js
├── zh-hant/messages.js
├── pl/messages.js
├── hu/messages.js
├── tr/messages.js
├── bg/messages.js
└── cs/messages.js
```

**繁體中文範例** (`zh-hant/messages.js`):

```javascript
// 類別
CATEGORY_COMMUNICATION: '通訊',

// WiFi
ESP32_WIFI_CONNECT: 'WiFi 連線',
ESP32_WIFI_CONNECT_SSID: 'SSID',
ESP32_WIFI_CONNECT_PASSWORD: '密碼',
ESP32_WIFI_CONNECT_TOOLTIP: '連線到 WiFi 網路（超時 10 秒）',
// ... 其他參照 research.md
```

---

## 測試清單

### 手動測試

-   [ ] 視角保持：刪除積木後視角不變
-   [ ] 批次刪除：選擇多個積木一起刪除
-   [ ] text_join：字串 + 數字生成正確代碼
-   [ ] WiFi 積木：僅在 ESP32/Super Mini 時顯示
-   [ ] MQTT 積木：生成代碼包含 PubSubClient
-   [ ] 字串轉數字：整數/浮點數選項正確
-   [ ] i18n：繁體中文和英文顯示正確

### 硬體測試

-   [ ] ESP32 WiFi 連線成功
-   [ ] ESP32 WiFi 超時處理
-   [ ] MQTT 發布訊息
-   [ ] MQTT 接收訊息

---

## 常見問題

### Q: 積木沒有顯示在工具箱？

A: 確認以下項目：

1. `index.json` 有引入 `communication.json`
2. `blocklyEdit.html` 有載入積木檔案
3. 當前板子是 ESP32 或 Super Mini

### Q: 代碼生成錯誤？

A: 使用 F12 開發者工具檢查 console 錯誤，確認：

1. Generator 函數名稱與積木 type 完全相同
2. `window.arduinoGenerator` 已正確初始化

### Q: 翻譯沒有生效？

A: 確認：

1. 翻譯鍵值與積木中使用的完全相同
2. 重新載入 WebView（右鍵 → Reload Webview）

---

## 相關文件

-   [規格書](./spec.md)
-   [研究發現](./research.md)
-   [資料模型](./data-model.md)
-   [專案說明](.github/copilot-instructions.md)
