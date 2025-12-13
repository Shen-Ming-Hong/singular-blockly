# Research: ESP32 WiFi/MQTT 積木與修復

**Date**: 2025-12-13  
**Spec**: [spec.md](./spec.md)

## 研究總覽

本文件記錄 Phase 0 研究階段的所有發現，包含技術決策、API 調查結果與替代方案評估。

---

## 1. Blockly 視角保持機制

### 研究問題

如何在 BLOCK_DELETE 事件觸發時保持工作區視角位置不變？

### 調查發現

根據 Blockly 12.x 文檔（via MCP `get-library-docs`）：

1. **事件監聽機制**：

    ```javascript
    workspace.addChangeListener(event => {
    	if (event.type === Blockly.Events.BLOCK_DELETE) {
    		// 處理刪除事件
    	}
    });
    ```

2. **視角相關 API**：

    - `workspace.getMetrics()` - 取得工作區度量資訊，包含 `viewLeft`, `viewTop`
    - `workspace.scroll(x, y)` - 捲動工作區到指定座標
    - `workspace.getScale()` - 取得縮放比例
    - `workspace.setScale(scale)` - 設定縮放比例

3. **事件處理時機**：
    - `Blockly.Events.BLOCK_DELETE` 事件在積木從 DOM 移除「後」觸發
    - Blockly 預設行為可能會重新計算視角

### 技術決策

**Decision**: 使用 debounce 機制保存與恢復視角

**Rationale**:

-   在首次 BLOCK_DELETE 事件時儲存 `scrollX/scrollY/scale`
-   使用 50ms debounce，等待批次刪除完成
-   透過 `workspace.scroll()` 恢復視角位置

**Alternatives Considered**:

1. ❌ 直接在事件處理器中阻止視角重置 - Blockly 內部邏輯難以攔截
2. ❌ 使用 `Blockly.Events.disable()` - 會影響其他事件處理

### 實作範例

```javascript
// 視角保持邏輯
let viewportState = null;
let viewportRestoreTimer = null;

workspace.addChangeListener(event => {
	if (event.type === Blockly.Events.BLOCK_DELETE) {
		// 首次刪除事件時儲存視角
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
				workspace.setScale(viewportState.scale);
				viewportState = null;
			}
			viewportRestoreTimer = null;
		}, 50);
	}
});
```

---

## 2. text_join 類型轉換修復

### 研究問題

現有 text_join 實作為何會產生 C++ 指標運算錯誤？

### 調查發現

檢視現有程式碼 `media/blockly/generators/arduino/text.js`：

```javascript
window.arduinoGenerator.forBlock['text_join'] = function (block) {
	const items = new Array(block.itemCount_);
	for (let i = 0; i < block.itemCount_; i++) {
		items[i] = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '""';
	}
	const code = 'String(' + items.join(' + ') + ')';
	return [code, window.arduinoGenerator.ORDER_ATOMIC];
};
```

**問題分析**：

1. 當輸入為 `"Hello"` + `42` 時，生成：`String("Hello" + 42)`
2. 在 C++ 中，`"Hello"` 是 `const char*`，`"Hello" + 42` 是指標運算
3. 這會產生未定義行為或編譯錯誤

### 技術決策

**Decision**: 每個輸入項目都包裝為 `String()`

**Rationale**:

-   `String("Hello") + String(42)` 是正確的 Arduino 字串串接
-   Arduino String 類別支援 int、float、char\* 的建構子

**Alternatives Considered**:

1. ❌ 類型檢查後選擇性包裝 - 增加複雜度，難以可靠偵測類型
2. ❌ 使用 sprintf - 需要固定大小緩衝區，不適合動態長度

### 修正後程式碼

```javascript
window.arduinoGenerator.forBlock['text_join'] = function (block) {
	const items = new Array(block.itemCount_);
	for (let i = 0; i < block.itemCount_; i++) {
		const item = window.arduinoGenerator.valueToCode(block, 'ADD' + i, window.arduinoGenerator.ORDER_NONE) || '""';
		items[i] = `String(${item})`;
	}

	if (items.length === 0) {
		return ['String("")', window.arduinoGenerator.ORDER_ATOMIC];
	}

	const code = items.join(' + ');
	return [code, window.arduinoGenerator.ORDER_ADDITION];
};
```

---

## 3. ESP32 WiFi 積木實作

### 研究問題

如何使用 ESP32 WiFi.h 庫實現視覺化積木？

### 調查發現

根據 Arduino 官方文檔與 ESP32 Arduino Core：

1. **必要標頭檔**：

    ```cpp
    #include <WiFi.h>
    ```

2. **主要 API**：

    - `WiFi.mode(WIFI_STA)` - 設定為 Station 模式
    - `WiFi.begin(ssid, password)` - 連線到 WiFi
    - `WiFi.disconnect()` - 斷開連線
    - `WiFi.status()` - 取得連線狀態（回傳 wl_status_t）
    - `WiFi.localIP()` - 取得 IP 位址（回傳 IPAddress）
    - `WiFi.scanNetworks()` - 掃描網路（回傳網路數量）
    - `WiFi.SSID(index)` - 取得掃描到的 SSID
    - `WiFi.RSSI(index)` - 取得訊號強度

3. **連線狀態常數**：
    - `WL_CONNECTED` (3) - 已連線
    - `WL_DISCONNECTED` (6) - 已斷線
    - `WL_IDLE_STATUS` (0) - 閒置

### 技術決策

**Decision**: 提供帶超時的阻塞式連線積木

**Rationale**:

-   教育用途需要簡單直覺的操作
-   10 秒超時防止無限等待
-   Serial 輸出提供連線狀態回饋

### 積木設計

| 積木名稱              | 輸入欄位                       | 輸出類型  | 生成代碼                        |
| --------------------- | ------------------------------ | --------- | ------------------------------- |
| esp32_wifi_connect    | SSID(String), PASSWORD(String) | Statement | `WiFi.begin()` + 等待迴圈       |
| esp32_wifi_disconnect | -                              | Statement | `WiFi.disconnect()`             |
| esp32_wifi_status     | -                              | Boolean   | `WiFi.status() == WL_CONNECTED` |
| esp32_wifi_get_ip     | -                              | String    | `WiFi.localIP().toString()`     |
| esp32_wifi_scan       | -                              | Number    | `WiFi.scanNetworks()`           |
| esp32_wifi_get_ssid   | INDEX(Number)                  | String    | `WiFi.SSID(index)`              |
| esp32_wifi_get_rssi   | INDEX(Number)                  | Number    | `WiFi.RSSI(index)`              |

---

## 4. MQTT 積木實作

### 研究問題

如何使用 PubSubClient 庫實現 MQTT 功能？

### 調查發現

根據 PubSubClient 文檔（via MCP `get-library-docs`）：

1. **必要標頭檔**：

    ```cpp
    #include <WiFi.h>
    #include <PubSubClient.h>
    ```

2. **主要 API**：

    - `PubSubClient(WiFiClient&)` - 建構子
    - `setServer(host, port)` - 設定伺服器
    - `connect(clientId)` / `connect(clientId, user, pass)` - 連線
    - `connected()` - 檢查連線狀態
    - `publish(topic, payload)` - 發布訊息
    - `subscribe(topic)` - 訂閱主題
    - `setCallback(callback)` - 設定回調函數
    - `loop()` - 維持連線與處理訊息

3. **Callback 簽章**：

    ```cpp
    void callback(char* topic, byte* payload, unsigned int length)
    ```

4. **限制**：
    - 預設最大訊息大小 256 bytes
    - 僅支援 QoS 0 發布
    - 訂閱支援 QoS 0 或 1

### 技術決策

**Decision**: 使用全域變數儲存最新訊息

**Rationale**:

-   Blockly 積木模型不適合事件驅動回調
-   全域變數 `lastMqttTopic` 和 `lastMqttMessage` 簡化存取
-   用戶透過讀取變數積木取得訊息

**Library Dependency**:

```
knolleary/PubSubClient@^2.8
```

### 積木設計

| 積木名稱               | 輸入欄位                                        | 輸出類型  | 生成代碼                 |
| ---------------------- | ----------------------------------------------- | --------- | ------------------------ |
| esp32_mqtt_setup       | SERVER(String), PORT(Number), CLIENT_ID(String) | Statement | 全域初始化 + setServer   |
| esp32_mqtt_connect     | USERNAME?(String), PASSWORD?(String)            | Statement | `mqttClient.connect()`   |
| esp32_mqtt_publish     | TOPIC(String), MESSAGE(String)                  | Statement | `mqttClient.publish()`   |
| esp32_mqtt_subscribe   | TOPIC(String)                                   | Statement | `mqttClient.subscribe()` |
| esp32_mqtt_loop        | -                                               | Statement | `mqttClient.loop()`      |
| esp32_mqtt_get_topic   | -                                               | String    | `lastMqttTopic`          |
| esp32_mqtt_get_message | -                                               | String    | `lastMqttMessage`        |

### MQTT Callback 生成代碼

```cpp
String lastMqttTopic = "";
String lastMqttMessage = "";

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  lastMqttTopic = String(topic);
  lastMqttMessage = "";
  for (unsigned int i = 0; i < length; i++) {
    lastMqttMessage += (char)payload[i];
  }
}
```

---

## 5. 板子相依性機制

### 研究問題

如何實現 WiFi/MQTT 積木僅在 ESP32 板子時顯示？

### 調查發現

檢視現有機制（`board_configs.js`, `blocklyEdit.js`）：

1. 全域變數 `window.currentBoard` 儲存當前板子
2. 工具箱動態載入時可過濾積木
3. Generator 可檢查 `window.currentBoard` 產生警告

### 技術決策

**Decision**: 雙層過濾機制

1. **工具箱層**：動態隱藏不支援的積木
2. **Generator 層**：已放置積木產生警告註解

**Rationale**:

-   使用者切換板子時不會遺失已放置積木
-   警告註解提供清楚回饋

### 實作方式

```javascript
// Generator 中的板子檢查
window.arduinoGenerator.forBlock['esp32_wifi_connect'] = function (block) {
	if (window.currentBoard !== 'esp32' && window.currentBoard !== 'supermini') {
		return '// WiFi 功能僅支援 ESP32 系列板子\n';
	}
	// 正常生成代碼...
};
```

---

## 6. 字串轉數字積木

### 研究問題

Arduino String 類別的 toInt() 和 toFloat() 行為為何？

### 調查發現

根據 Arduino 官方文檔：

1. **API**：

    - `String.toInt()` - 轉換為 long
    - `String.toFloat()` - 轉換為 float

2. **行為**：
    - 從字串開頭解析到第一個非數字字元
    - 無法轉換時回傳 0
    - `"123abc".toInt()` → 123
    - `"abc".toInt()` → 0
    - `"3.14".toFloat()` → 3.14

### 技術決策

**Decision**: 提供下拉選單選擇整數/浮點數

**Rationale**:

-   簡單直覺的操作
-   Tooltip 說明無效輸入回傳 0 的行為

### 積木設計

```javascript
Blockly.Blocks['text_to_number'] = {
	init: function () {
		this.appendValueInput('TEXT').setCheck('String').appendField(Blockly.Msg['TEXT_TO_NUMBER']);
		this.appendDummyInput().appendField(
			new Blockly.FieldDropdown([
				[Blockly.Msg['TEXT_TO_NUMBER_INT'], 'INT'],
				[Blockly.Msg['TEXT_TO_NUMBER_FLOAT'], 'FLOAT'],
			]),
			'TYPE'
		);
		this.setOutput(true, 'Number');
		this.setColour(160);
	},
};
```

---

## 7. i18n 翻譯鍵值

### 研究問題

需要新增哪些翻譯鍵值？

### 調查發現

基於所有新積木，需要以下翻譯鍵值：

```javascript
// 類別
CATEGORY_COMMUNICATION: '通訊',

// WiFi 積木
ESP32_WIFI_CONNECT: 'WiFi 連線',
ESP32_WIFI_CONNECT_SSID: 'SSID',
ESP32_WIFI_CONNECT_PASSWORD: '密碼',
ESP32_WIFI_CONNECT_TOOLTIP: '連線到 WiFi 網路（超時 10 秒）',
ESP32_WIFI_DISCONNECT: 'WiFi 斷線',
ESP32_WIFI_DISCONNECT_TOOLTIP: '斷開 WiFi 連線',
ESP32_WIFI_STATUS: 'WiFi 已連線?',
ESP32_WIFI_STATUS_TOOLTIP: '回傳 WiFi 連線狀態',
ESP32_WIFI_GET_IP: 'WiFi IP 位址',
ESP32_WIFI_GET_IP_TOOLTIP: '取得目前 IP 位址',
ESP32_WIFI_SCAN: '掃描 WiFi 網路',
ESP32_WIFI_SCAN_TOOLTIP: '掃描並回傳附近 WiFi 網路數量',
ESP32_WIFI_GET_SSID: '取得 WiFi SSID',
ESP32_WIFI_GET_SSID_INDEX: '索引',
ESP32_WIFI_GET_SSID_TOOLTIP: '取得指定索引的 WiFi 名稱',
ESP32_WIFI_GET_RSSI: '取得 WiFi 訊號強度',
ESP32_WIFI_GET_RSSI_INDEX: '索引',
ESP32_WIFI_GET_RSSI_TOOLTIP: '取得指定索引的訊號強度 (dBm)',

// MQTT 積木
ESP32_MQTT_SETUP: 'MQTT 設定',
ESP32_MQTT_SETUP_SERVER: '伺服器',
ESP32_MQTT_SETUP_PORT: '埠號',
ESP32_MQTT_SETUP_CLIENT_ID: '客戶端 ID',
ESP32_MQTT_SETUP_TOOLTIP: '設定 MQTT 伺服器連線參數',
ESP32_MQTT_CONNECT: 'MQTT 連線',
ESP32_MQTT_CONNECT_USERNAME: '帳號',
ESP32_MQTT_CONNECT_PASSWORD: '密碼',
ESP32_MQTT_CONNECT_TOOLTIP: '連線到 MQTT 伺服器',
ESP32_MQTT_PUBLISH: 'MQTT 發布訊息',
ESP32_MQTT_PUBLISH_TOPIC: '主題',
ESP32_MQTT_PUBLISH_MESSAGE: '訊息',
ESP32_MQTT_PUBLISH_TOOLTIP: '發布訊息到指定主題',
ESP32_MQTT_SUBSCRIBE: 'MQTT 訂閱',
ESP32_MQTT_SUBSCRIBE_TOPIC: '主題',
ESP32_MQTT_SUBSCRIBE_TOOLTIP: '訂閱指定主題的訊息',
ESP32_MQTT_LOOP: 'MQTT 處理訊息',
ESP32_MQTT_LOOP_TOOLTIP: '維持連線並處理收到的訊息（放在 loop 中）',
ESP32_MQTT_GET_TOPIC: 'MQTT 最新主題',
ESP32_MQTT_GET_TOPIC_TOOLTIP: '取得最近收到訊息的主題',
ESP32_MQTT_GET_MESSAGE: 'MQTT 最新訊息',
ESP32_MQTT_GET_MESSAGE_TOOLTIP: '取得最近收到的訊息內容',

// 字串轉數字
TEXT_TO_NUMBER: '字串轉數字',
TEXT_TO_NUMBER_INT: '整數',
TEXT_TO_NUMBER_FLOAT: '浮點數',
TEXT_TO_NUMBER_TOOLTIP: '將字串轉換為數字（無效輸入回傳 0）',
```

---

## 研究結論

所有技術問題已解決，無待澄清項目。可進入 Phase 1 設計階段。

| 研究項目   | 狀態    | 決策                     |
| ---------- | ------- | ------------------------ |
| 視角保持   | ✅ 完成 | Debounce + scroll 恢復   |
| text_join  | ✅ 完成 | 每項 String() 包裝       |
| WiFi 積木  | ✅ 完成 | ESP32 WiFi.h API         |
| MQTT 積木  | ✅ 完成 | PubSubClient + 全域變數  |
| 板子相依   | ✅ 完成 | 雙層過濾機制             |
| 字串轉數字 | ✅ 完成 | 下拉選單 + toInt/toFloat |
| i18n       | ✅ 完成 | 60+ 翻譯鍵值             |
