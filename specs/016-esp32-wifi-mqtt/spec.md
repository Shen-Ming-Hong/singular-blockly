# Feature Specification: ESP32 WiFi/MQTT 積木與修復

**Feature Branch**: `016-esp32-wifi-mqtt`  
**Created**: 2025-12-13  
**Status**: Clarified  
**Input**: 積木刪除視角重置修復、text_join 型態轉換修復、ESP32 WiFi/MQTT 積木、字串轉數字積木

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 積木刪除時視角保持不變 (Priority: P1)

使用者在 Blockly 工作區中刪除積木（拖移到垃圾桶或按 Delete 鍵）時，工作區的視角位置應保持不變，不應自動跳轉或重新置中。

**Why this priority**: 這是影響所有使用者日常操作的基礎體驗問題，每次刪除積木都會遇到，嚴重影響工作流程效率。

**Independent Test**: 可透過在工作區任意位置建立積木、滾動到特定視角、然後刪除積木來獨立測試，驗證視角是否保持原位。

**Acceptance Scenarios**:

1. **Given** 工作區有多個積木且視角已滾動到非中心位置, **When** 使用者刪除任一積木, **Then** 視角座標（scrollX, scrollY）保持刪除前的位置
2. **Given** 工作區有堆疊連接的積木群, **When** 使用者刪除其中一個積木導致其他積木位置調整, **Then** 視角座標仍保持不變
3. **Given** 使用者將積木拖移到垃圾桶, **When** 積木被刪除, **Then** 視角座標保持不變

---

### User Story 2 - text_join 正確串接不同型態 (Priority: P1)

使用者使用 `text_join` 積木串接字串與數字（或其他型態）時，生成的 Arduino 代碼應正確執行字串串接，而非產生 C++ 指標運算錯誤。

**Why this priority**: 這是現有功能的嚴重錯誤，會導致程式執行結果不正確或產生未定義行為，必須優先修復。

**Independent Test**: 可透過建立 text_join 積木連接字串 "Count: " 與數字 42，檢視生成的代碼是否為 `String("Count: ") + String(42)` 格式。

**Acceptance Scenarios**:

1. **Given** text_join 積木連接一個字串和一個數字, **When** 生成 Arduino 代碼, **Then** 每個項目都被包裝為 `String()` 並用 `+` 串接
2. **Given** text_join 積木連接三個不同型態（字串、整數、浮點數）, **When** 生成 Arduino 代碼, **Then** 輸出為 `String(item1) + String(item2) + String(item3)`
3. **Given** text_join 積木只有一個輸入項目, **When** 生成 Arduino 代碼, **Then** 輸出為 `String(item1)`

---

### User Story 3 - ESP32 WiFi 連線功能 (Priority: P2)

使用者選擇 ESP32 或 Super Mini 板子時，可在工具箱中找到 WiFi 相關積木，並透過視覺化積木完成 WiFi 掃描和連線設定。

**Why this priority**: WiFi 是 ESP32 最重要的特色功能之一，是 IoT 專案的基礎，但需要先確保基礎修復完成。

**Independent Test**: 可透過選擇 ESP32 板子、拖放 WiFi 連線積木、填入 SSID 和密碼、檢視生成的代碼來獨立測試。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 ESP32 板子, **When** 開啟工具箱, **Then** 可看到「通訊」類別包含 WiFi 相關積木
2. **Given** 使用者選擇 Arduino Uno 板子, **When** 開啟工具箱, **Then** 「通訊」類別中的 WiFi 積木不顯示或顯示為不支援
3. **Given** 使用者放置 `esp32_wifi_connect` 積木並填入 SSID 和密碼, **When** 生成代碼, **Then** 包含 `#include <WiFi.h>` 和正確的 `WiFi.begin()` 呼叫
4. **Given** 使用者放置 `esp32_wifi_scan` 積木, **When** 生成代碼, **Then** 包含掃描邏輯並可取得網路數量

---

### User Story 4 - ESP32 MQTT 通訊功能 (Priority: P2)

使用者可透過 MQTT 積木設定連線到 MQTT broker，發布和訂閱訊息，實現 IoT 雲端通訊。

**Why this priority**: MQTT 是 IoT 應用的標準通訊協定，與 WiFi 功能相輔相成，是完整 IoT 專案的必要功能。

**Independent Test**: 可透過放置 MQTT setup、connect、publish 積木，連接到公開測試 broker（如 broker.hivemq.com），驗證生成代碼的正確性。

**Acceptance Scenarios**:

1. **Given** 使用者放置 `esp32_mqtt_setup` 積木並設定伺服器位址, **When** 生成代碼, **Then** 包含 `#include <PubSubClient.h>` 和正確的初始化
2. **Given** 使用者放置 `esp32_mqtt_publish` 積木, **When** 生成代碼, **Then** 包含正確的 `mqttClient.publish()` 呼叫
3. **Given** 使用者放置 `esp32_mqtt_subscribe` 積木訂閱主題, **When** 生成代碼, **Then** 包含 `mqttClient.subscribe()` 和回調處理邏輯
4. **Given** 使用者使用 MQTT 積木, **When** 編譯專案, **Then** PlatformIO 自動安裝 `knolleary/PubSubClient` 依賴

---

### User Story 5 - 字串轉數字功能 (Priority: P2)

使用者可將字串（例如 MQTT 收到的訊息）轉換為數字，以便進行數學運算或控制硬體。

**Why this priority**: 這是 MQTT 功能的必要補充，因為 MQTT 訊息都是字串格式，需要轉換才能用於控制。

**Independent Test**: 可透過放置 `text_to_number` 積木、連接字串輸入、選擇整數或浮點數類型，檢視生成代碼是否正確呼叫 `.toInt()` 或 `.toFloat()`。

**Acceptance Scenarios**:

1. **Given** 使用者放置 `text_to_number` 積木並選擇「整數」, **When** 生成代碼, **Then** 輸出為 `(text).toInt()`
2. **Given** 使用者放置 `text_to_number` 積木並選擇「浮點數」, **When** 生成代碼, **Then** 輸出為 `(text).toFloat()`
3. **Given** `text_to_number` 積木在工具箱中, **When** 使用者拖放積木, **Then** 有預設的 shadow block 顯示範例值 "123"

---

### Edge Cases

-   批次刪除多個積木時，視角恢復邏輯是否正確執行？（應只在最終狀態恢復一次）
-   text_join 無輸入項目時，生成代碼是否正確處理空字串？
-   WiFi 連線失敗時，生成的代碼是否有適當的錯誤處理或等待邏輯？
-   MQTT broker 連線中斷時，生成的代碼是否包含重連邏輯？
-   字串轉數字時輸入無效字串（如 "abc"），Arduino 返回 0 的行為是否在 tooltip 中說明？
-   Super Mini (ESP32-C3) 板子是否正確識別為支援 WiFi 的板子？

## Requirements _(mandatory)_

### Functional Requirements

**視角保持（Bug Fix）**

-   **FR-001**: 系統 MUST 在積木刪除事件觸發時保存當前視角座標（scrollX, scrollY）
-   **FR-002**: 系統 MUST 使用 debounce 機制（預設 50ms），在無新刪除事件後才恢復視角座標
-   **FR-003**: 縮放比例（scale）SHOULD 同時保持不變

**text_join 修復（Bug Fix）**

-   **FR-004**: `text_join` 生成器 MUST 將每個輸入項目包裝為 `String()` 函數
-   **FR-005**: `text_join` 生成的代碼 MUST 使用 `+` 運算子串接多個 `String()` 物件
-   **FR-006**: 空輸入項目 MUST 生成 `String("")` 而非裸露的空字串

**WiFi 積木（New Feature - ESP32 Only）**

-   **FR-007**: 系統 MUST 提供 `esp32_wifi_connect` 積木，接受 SSID 和密碼輸入，帶 10 秒超時等待並輸出 Serial 狀態
-   **FR-007a**: 系統 MUST 提供 `esp32_wifi_disconnect` 積木，用於主動斷開 WiFi 連線
-   **FR-008**: 系統 MUST 提供 `esp32_wifi_scan` 積木，返回掃描到的網路數量
-   **FR-009**: 系統 MUST 提供 `esp32_wifi_status` 積木，返回連線狀態布林值
-   **FR-010**: 系統 MUST 提供 `esp32_wifi_get_ip` 積木，返回目前 IP 位址字串
-   **FR-011**: 系統 SHOULD 提供 `esp32_wifi_get_ssid` 積木，根據索引返回掃描到的 SSID
-   **FR-012**: 系統 SHOULD 提供 `esp32_wifi_get_rssi` 積木，根據索引返回訊號強度
-   **FR-013**: WiFi 積木 MUST 僅在 ESP32 系列板子（esp32, esp32_supermini）時顯示於工具箱
-   **FR-013a**: 非 ESP32 板子時，已放置的 WiFi 積木 MUST 保留在工作區但生成警告註解而非實際代碼

**MQTT 積木（New Feature - ESP32 Only）**

-   **FR-014**: 系統 MUST 提供 `esp32_mqtt_setup` 積木，設定 broker 位址、端口、Client ID
-   **FR-015**: 系統 MUST 提供 `esp32_mqtt_connect` 積木，可選填用戶名和密碼（連線時使用 `esp32_mqtt_setup` 中設定的 CLIENT_ID）
-   **FR-016**: 系統 MUST 提供 `esp32_mqtt_publish` 積木，接受主題和訊息輸入
-   **FR-017**: 系統 MUST 提供 `esp32_mqtt_subscribe` 積木，接受主題輸入
-   **FR-018**: 系統 MUST 提供 `esp32_mqtt_loop` 積木，用於 loop 函數中維持連線和處理訊息（不含自動重連，tooltip 說明手動重連方式）
-   **FR-019**: 系統 MUST 在收到 MQTT 訊息時自動將主題和內容存入全域變數（`lastMqttTopic`、`lastMqttMessage`）
-   **FR-019a**: 系統 MUST 提供 `esp32_mqtt_get_topic` 積木讀取最新收到的主題
-   **FR-019b**: 系統 MUST 提供 `esp32_mqtt_get_message` 積木讀取最新收到的訊息內容
-   **FR-020**: MQTT 積木 MUST 自動將 `knolleary/PubSubClient` 加入 `lib_deps_`
-   **FR-021**: MQTT 積木 MUST 僅在 ESP32 系列板子時顯示於工具箱
-   **FR-021a**: 非 ESP32 板子時，已放置的 MQTT 積木 MUST 保留在工作區但生成警告註解而非實際代碼

**字串轉數字積木（New Feature）**

-   **FR-022**: 系統 MUST 提供 `text_to_number` 積木，接受字串輸入
-   **FR-023**: `text_to_number` 積木 MUST 提供下拉選單選擇「整數」或「浮點數」
-   **FR-024**: 選擇「整數」時 MUST 生成 `(text).toInt()` 代碼
-   **FR-025**: 選擇「浮點數」時 MUST 生成 `(text).toFloat()` 代碼
-   **FR-026**: `text_to_number` 積木 MUST 輸出 `Number` 類型
-   **FR-027**: 工具箱中 MUST 為 `text_to_number` 提供預設 shadow block

**i18n 支援**

-   **FR-028**: 所有新積木 MUST 在 15 個語言檔案中提供翻譯
-   **FR-029**: 所有積木 MUST 使用 `languageManager.getMessage()` 取得本地化文字

### Key Entities

-   **WiFi 連線狀態**: 表示 ESP32 的 WiFi 連線狀態，包含 SSID、IP 位址、訊號強度等屬性
-   **MQTT 連線**: 表示與 MQTT broker 的連線，包含伺服器位址、端口、Client ID、連線狀態
-   **MQTT 訊息**: 表示發布或訂閱的訊息，包含主題（topic）和內容（payload）

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者刪除積木後，視角座標變化量為 0（scrollX 和 scrollY 與刪除前完全一致）
-   **SC-002**: text_join 串接字串與數字時，生成的代碼可在 Arduino IDE 編譯通過且執行結果正確
-   **SC-003**: 使用者可在 3 分鐘內完成 ESP32 WiFi 連線積木設定並生成可編譯的代碼
-   **SC-004**: 使用者可在 5 分鐘內完成基本 MQTT 發布/訂閱流程的積木配置
-   **SC-005**: `text_to_number` 積木生成的代碼可正確將字串 "123" 轉為整數 123、字串 "3.14" 轉為浮點數 3.14
-   **SC-006**: 所有新功能在 ESP32 和 Super Mini 板子上測試通過
-   **SC-007**: 所有新積木在繁體中文和英文介面下顯示正確的本地化文字

## Assumptions

-   Arduino String 類的 `.toInt()` 和 `.toFloat()` 方法在無法轉換時返回 0，此行為將在 tooltip 中說明
-   WiFi 和 MQTT 功能僅支援 ESP32 系列板子，Arduino Uno/Nano/Mega 不支援
-   使用 `knolleary/PubSubClient` 作為 MQTT 庫，版本 ^2.8
-   WiFi 使用 ESP32 內建的 `WiFi.h` 庫，無需額外依賴
-   MQTT 訊息內容以字串形式傳遞，用戶需使用 `text_to_number` 轉換為數字

## Clarifications

### Session 2025-12-13

-   Q: MQTT 訊息回調機制如何實作？ → A: 使用全域變數方式，當收到訊息時自動存入 `lastMqttTopic` 和 `lastMqttMessage` 變數，用戶透過讀取變數積木取得訊息內容
-   Q: WiFi 連線等待行為如何處理？ → A: 帶超時的等待迴圈（預設 10 秒），超時後繼續執行程式，Serial 輸出連線狀態；另需提供 `wifi_disconnect` 積木用於關閉連線
-   Q: MQTT 連線中斷時是否自動重連？ → A: 不自動重連，`mqtt_loop` 僅維持連線和處理訊息，用戶可搭配 `mqtt_connect` 和條件判斷自行實作重連邏輯（tooltip 說明）
-   Q: 非 ESP32 板子使用 WiFi/MQTT 積木時如何處理？ → A: 工具箱中隱藏積木，但已放置的積木保留在工作區；生成代碼時輸出警告註解（如 `// WiFi 功能僅支援 ESP32`）而非實際代碼
-   Q: 批次刪除多個積木時視角如何恢復？ → A: 使用 debounce 機制，第一次 `BLOCK_DELETE` 事件儲存視角，等待 50ms 無新事件後才恢復一次，避免視角跳動
