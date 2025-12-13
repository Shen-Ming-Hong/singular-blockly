# Data Model: ESP32 WiFi/MQTT 積木與修復

**Date**: 2025-12-13  
**Spec**: [spec.md](./spec.md)

## 概述

本文件定義所有新增積木的資料模型、欄位規格、狀態轉換與驗證規則。

---

## 1. 積木定義模型

### 1.1 WiFi 積木

#### esp32_wifi_connect

| 屬性         | 值                      |
| ------------ | ----------------------- |
| **類型**     | Statement               |
| **顏色**     | 210 (Communication Hue) |
| **板子限制** | esp32, supermini        |

| 欄位名稱 | 欄位類型       | 預設值   | 驗證規則             |
| -------- | -------------- | -------- | -------------------- |
| SSID     | FieldTextInput | "MyWiFi" | 非空字串             |
| PASSWORD | FieldTextInput | ""       | 允許空白（開放網路） |

**生成代碼結構**：

```cpp
// Includes
#include <WiFi.h>

// Setup 區塊
WiFi.mode(WIFI_STA);
WiFi.begin("${SSID}", "${PASSWORD}");
Serial.print("Connecting to WiFi");
unsigned long _wifiStartTime = millis();
while (WiFi.status() != WL_CONNECTED && millis() - _wifiStartTime < 10000) {
  delay(500);
  Serial.print(".");
}
if (WiFi.status() == WL_CONNECTED) {
  Serial.println("\nWiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
} else {
  Serial.println("\nWiFi Connection Failed!");
}
```

---

#### esp32_wifi_disconnect

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Statement        |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
WiFi.disconnect();
Serial.println("WiFi Disconnected");
```

---

#### esp32_wifi_status

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (Boolean) |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
(WiFi.status() == WL_CONNECTED)
```

---

#### esp32_wifi_get_ip

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (String)  |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
WiFi.localIP().toString()
```

---

#### esp32_wifi_scan

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (Number)  |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
WiFi.scanNetworks()
```

---

#### esp32_wifi_get_ssid

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (String)  |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |

| 欄位名稱 | 欄位類型            | 預設值          | 驗證規則 |
| -------- | ------------------- | --------------- | -------- |
| INDEX    | ValueInput (Number) | math_number (0) | 整數 ≥ 0 |

**生成代碼**：

```cpp
WiFi.SSID(${INDEX})
```

---

#### esp32_wifi_get_rssi

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (Number)  |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |

| 欄位名稱 | 欄位類型            | 預設值          | 驗證規則 |
| -------- | ------------------- | --------------- | -------- |
| INDEX    | ValueInput (Number) | math_number (0) | 整數 ≥ 0 |

**生成代碼**：

```cpp
WiFi.RSSI(${INDEX})
```

---

### 1.2 MQTT 積木

#### esp32_mqtt_setup

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Statement        |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |

| 欄位名稱  | 欄位類型       | 預設值              | 驗證規則 |
| --------- | -------------- | ------------------- | -------- |
| SERVER    | FieldTextInput | "broker.hivemq.com" | 非空字串 |
| PORT      | FieldNumber    | 1883                | 1-65535  |
| CLIENT_ID | FieldTextInput | "esp32client"       | 非空字串 |

**生成代碼結構**：

```cpp
// Includes
#include <WiFi.h>
#include <PubSubClient.h>

// 全域變數（在 setup 前）
WiFiClient _wifiClient;
PubSubClient mqttClient(_wifiClient);
String lastMqttTopic = "";
String lastMqttMessage = "";

void _mqttCallback(char* topic, byte* payload, unsigned int length) {
  lastMqttTopic = String(topic);
  lastMqttMessage = "";
  for (unsigned int i = 0; i < length; i++) {
    lastMqttMessage += (char)payload[i];
  }
}

// Setup 區塊
mqttClient.setServer("${SERVER}", ${PORT});
mqttClient.setCallback(_mqttCallback);
```

**lib_deps 依賴**：

```
knolleary/PubSubClient@^2.8
```

---

#### esp32_mqtt_connect

| 屬性         | 值                                 |
| ------------ | ---------------------------------- |
| **類型**     | Statement                          |
| **顏色**     | 210                                |
| **板子限制** | esp32, supermini                   |
| **前置依賴** | esp32_mqtt_setup（提供 CLIENT_ID） |

| 欄位名稱 | 欄位類型       | 預設值 | 驗證規則 |
| -------- | -------------- | ------ | -------- |
| USERNAME | FieldTextInput | ""     | 允許空白 |
| PASSWORD | FieldTextInput | ""     | 允許空白 |

**生成代碼**（無帳密）：

```cpp
if (mqttClient.connect("${CLIENT_ID}")) {
  Serial.println("MQTT Connected!");
} else {
  Serial.print("MQTT Failed, rc=");
  Serial.println(mqttClient.state());
}
```

**生成代碼**（有帳密）：

```cpp
if (mqttClient.connect("${CLIENT_ID}", "${USERNAME}", "${PASSWORD}")) {
  Serial.println("MQTT Connected!");
} else {
  Serial.print("MQTT Failed, rc=");
  Serial.println(mqttClient.state());
}
```

---

#### esp32_mqtt_publish

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Statement        |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |

| 欄位名稱 | 欄位類型            | 預設值              | 驗證規則 |
| -------- | ------------------- | ------------------- | -------- |
| TOPIC    | ValueInput (String) | text ("test/topic") | 非空字串 |
| MESSAGE  | ValueInput (String) | text ("Hello")      | 任意字串 |

**生成代碼**：

```cpp
mqttClient.publish(${TOPIC}, String(${MESSAGE}).c_str());
```

---

#### esp32_mqtt_subscribe

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Statement        |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |

| 欄位名稱 | 欄位類型            | 預設值              | 驗證規則 |
| -------- | ------------------- | ------------------- | -------- |
| TOPIC    | ValueInput (String) | text ("test/topic") | 非空字串 |

**生成代碼**：

```cpp
mqttClient.subscribe(${TOPIC});
```

---

#### esp32_mqtt_loop

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Statement        |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
mqttClient.loop();
```

---

#### esp32_mqtt_get_topic

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (String)  |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
lastMqttTopic
```

---

#### esp32_mqtt_get_message

| 屬性         | 值               |
| ------------ | ---------------- |
| **類型**     | Output (String)  |
| **顏色**     | 210              |
| **板子限制** | esp32, supermini |
| **欄位**     | 無               |

**生成代碼**：

```cpp
lastMqttMessage
```

---

### 1.3 字串轉數字積木

#### text_to_number

| 屬性         | 值              |
| ------------ | --------------- |
| **類型**     | Output (Number) |
| **顏色**     | 160 (Text Hue)  |
| **板子限制** | 無（全板支援）  |

| 欄位名稱 | 欄位類型            | 預設值       | 驗證規則         |
| -------- | ------------------- | ------------ | ---------------- |
| TEXT     | ValueInput (String) | text ("123") | 任意字串         |
| TYPE     | FieldDropdown       | "INT"        | ["INT", "FLOAT"] |

**生成代碼**：

-   TYPE = INT: `(${TEXT}).toInt()`
-   TYPE = FLOAT: `(${TEXT}).toFloat()`

---

## 2. 全域變數規格

### 2.1 WebView 狀態

| 變數名稱               | 類型   | 用途                                     |
| ---------------------- | ------ | ---------------------------------------- |
| `window.currentBoard`  | String | 當前選擇的板子類型                       |
| `viewportState`        | Object | 視角保持暫存 { scrollX, scrollY, scale } |
| `viewportRestoreTimer` | Number | Debounce 計時器 ID                       |

### 2.2 Arduino 生成代碼

| 變數名稱          | 類型          | 用途                     |
| ----------------- | ------------- | ------------------------ |
| `_wifiClient`     | WiFiClient    | WiFi 客戶端實例          |
| `mqttClient`      | PubSubClient  | MQTT 客戶端實例          |
| `lastMqttTopic`   | String        | 最新收到的 MQTT 主題     |
| `lastMqttMessage` | String        | 最新收到的 MQTT 訊息內容 |
| `_wifiStartTime`  | unsigned long | WiFi 連線超時計時        |

---

## 3. 工具箱類別結構

### 3.1 新增類別：Communication

```json
{
	"kind": "category",
	"name": "%{CATEGORY_COMMUNICATION}",
	"categorystyle": "communication_category",
	"contents": [
		{
			"kind": "label",
			"text": "WiFi"
		},
		{
			"kind": "block",
			"type": "esp32_wifi_connect"
		},
		{
			"kind": "block",
			"type": "esp32_wifi_disconnect"
		},
		{
			"kind": "block",
			"type": "esp32_wifi_status"
		},
		{
			"kind": "block",
			"type": "esp32_wifi_get_ip"
		},
		{
			"kind": "block",
			"type": "esp32_wifi_scan"
		},
		{
			"kind": "block",
			"type": "esp32_wifi_get_ssid",
			"inputs": {
				"INDEX": {
					"shadow": { "type": "math_number", "fields": { "NUM": 0 } }
				}
			}
		},
		{
			"kind": "block",
			"type": "esp32_wifi_get_rssi",
			"inputs": {
				"INDEX": {
					"shadow": { "type": "math_number", "fields": { "NUM": 0 } }
				}
			}
		},
		{
			"kind": "sep"
		},
		{
			"kind": "label",
			"text": "MQTT"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_setup"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_connect"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_publish"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_subscribe"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_loop"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_get_topic"
		},
		{
			"kind": "block",
			"type": "esp32_mqtt_get_message"
		}
	]
}
```

### 3.2 修改類別：Text

新增 `text_to_number` 積木：

```json
{
	"kind": "block",
	"type": "text_to_number",
	"inputs": {
		"TEXT": {
			"shadow": { "type": "text", "fields": { "TEXT": "123" } }
		}
	}
}
```

---

## 4. 狀態轉換

### 4.1 視角保持狀態機

```
[Normal] --BLOCK_DELETE--> [Saving]
[Saving] --50ms timeout--> [Restoring]
[Restoring] --complete--> [Normal]
[Saving] --BLOCK_DELETE--> [Saving] (reset timer)
```

### 4.2 WiFi 連線狀態

```
[Disconnected] --begin()--> [Connecting]
[Connecting] --WL_CONNECTED--> [Connected]
[Connecting] --10s timeout--> [Failed]
[Connected] --disconnect()--> [Disconnected]
```

### 4.3 MQTT 連線狀態

```
[Not Connected] --connect()--> [Connecting]
[Connecting] --success--> [Connected]
[Connecting] --failed--> [Not Connected]
[Connected] --broker timeout--> [Not Connected]
```

---

## 5. 驗證規則摘要

| 項目           | 規則                      |
| -------------- | ------------------------- |
| SSID           | 非空字串，無長度限制      |
| WiFi Password  | 允許空白（開放網路）      |
| MQTT Server    | 非空字串（IP 或域名）     |
| MQTT Port      | 1-65535 整數              |
| MQTT Client ID | 非空字串，建議唯一        |
| MQTT Topic     | 非空字串，支援 `/` 分隔符 |
| Index          | 非負整數                  |
| TYPE dropdown  | 僅限 "INT" 或 "FLOAT"     |
