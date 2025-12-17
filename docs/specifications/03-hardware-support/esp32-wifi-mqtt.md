# ESP32 WiFi/MQTT 積木規格

> 整合自 specs/016-esp32-wifi-mqtt

## 概述

**目標**：為 ESP32 開發板提供 WiFi 連線與 MQTT 通訊積木，實現 IoT 雲端通訊功能

**狀態**：📝 草稿

---

## WiFi 積木

### 連線管理

| 積木                    | 用途         | 輸入       | 輸出    |
| ----------------------- | ------------ | ---------- | ------- |
| `esp32_wifi_connect`    | 連線到 WiFi  | SSID, 密碼 | void    |
| `esp32_wifi_disconnect` | 斷開連線     | 無         | void    |
| `esp32_wifi_status`     | 連線狀態     | 無         | Boolean |
| `esp32_wifi_get_ip`     | 取得 IP 位址 | 無         | String  |

### 網路掃描

| 積木                  | 用途         | 輸入 | 輸出          |
| --------------------- | ------------ | ---- | ------------- |
| `esp32_wifi_scan`     | 掃描網路     | 無   | Number (數量) |
| `esp32_wifi_get_ssid` | 取得 SSID    | 索引 | String        |
| `esp32_wifi_get_rssi` | 取得訊號強度 | 索引 | Number (dBm)  |

### 程式碼生成

#### 連線

```cpp
#include <WiFi.h>

const char* ssid = "MyNetwork";
const char* password = "MyPassword";

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("連線中...");

  // 等待連線（最多 10 秒）
  int timeout = 10000;
  while (WiFi.status() != WL_CONNECTED && timeout > 0) {
    delay(500);
    Serial.print(".");
    timeout -= 500;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n已連線！");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n連線失敗");
  }
}
```

#### 掃描

```cpp
void scanNetworks() {
  int n = WiFi.scanNetworks();
  Serial.printf("找到 %d 個網路\n", n);

  for (int i = 0; i < n; i++) {
    Serial.printf("%d: %s (%d dBm)\n",
      i + 1,
      WiFi.SSID(i).c_str(),
      WiFi.RSSI(i));
  }
}
```

---

## MQTT 積木

### 連線設定

| 積木                 | 用途        | 輸入                    |
| -------------------- | ----------- | ----------------------- |
| `esp32_mqtt_setup`   | 設定 broker | 伺服器, 端口, Client ID |
| `esp32_mqtt_connect` | 連線        | 用戶名(選), 密碼(選)    |

### 發布/訂閱

| 積木                   | 用途     | 輸入       |
| ---------------------- | -------- | ---------- |
| `esp32_mqtt_publish`   | 發布訊息 | 主題, 訊息 |
| `esp32_mqtt_subscribe` | 訂閱主題 | 主題       |
| `esp32_mqtt_loop`      | 維持連線 | 無         |

### 訊息讀取

| 積木                     | 用途           | 輸出   |
| ------------------------ | -------------- | ------ |
| `esp32_mqtt_get_topic`   | 最新收到的主題 | String |
| `esp32_mqtt_get_message` | 最新收到的訊息 | String |

### 程式碼生成

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// MQTT 設定
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 1883;
const char* mqttClientId = "ESP32Client";

// 訊息緩衝
String lastMqttTopic = "";
String lastMqttMessage = "";

// 訊息回調
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  lastMqttTopic = String(topic);
  lastMqttMessage = "";
  for (unsigned int i = 0; i < length; i++) {
    lastMqttMessage += (char)payload[i];
  }
  Serial.printf("收到 [%s]: %s\n", topic, lastMqttMessage.c_str());
}

void setup() {
  // WiFi 連線...

  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(mqttCallback);

  // 連線 MQTT
  if (mqttClient.connect(mqttClientId)) {
    Serial.println("MQTT 已連線");
    mqttClient.subscribe("test/topic");
  }
}

void loop() {
  mqttClient.loop();  // 必須在 loop 中呼叫

  // 發布訊息
  mqttClient.publish("test/publish", "Hello MQTT!");
}
```

### PlatformIO 依賴

```ini
lib_deps =
  knolleary/PubSubClient@^2.8
```

---

## 字串轉數字積木

### `text_to_number`

**用途**：將字串（如 MQTT 訊息）轉換為數字

**欄位**：
| 欄位 | 類型 | 選項 |
|------|------|------|
| TEXT | 輸入 | String |
| TYPE | 下拉選單 | 整數 / 浮點數 |

**程式碼生成**：

```cpp
// 整數
int value = (text).toInt();

// 浮點數
float value = (text).toFloat();
```

**注意**：無效字串（如 "abc"）會返回 0，此行為在 tooltip 中說明。

---

## 板子支援

### 支援的板子

-   ESP32 DevKit (`esp32`)
-   ESP32-C3 Super Mini (`esp32_supermini`)

### 不支援的板子

-   Arduino Uno
-   Arduino Nano
-   Arduino Mega

**行為**：

-   工具箱中隱藏 WiFi/MQTT 積木
-   已放置的積木生成警告註解：
    ```cpp
    // ⚠️ WiFi 功能僅支援 ESP32 系列開發板
    ```

---

## 驗收標準

1. ✅ 使用者可在 3 分鐘內完成 WiFi 連線設定
2. ✅ 使用者可在 5 分鐘內完成 MQTT 發布/訂閱流程
3. ✅ `text_to_number` 正確轉換字串
4. ✅ ESP32 和 Super Mini 測試通過
5. ✅ 15 種語言翻譯完成

---

## 相關文件

-   積木定義：`media/blockly/blocks/communication.js`
-   程式碼生成：`media/blockly/generators/arduino/wifi.js`, `mqtt.js`
