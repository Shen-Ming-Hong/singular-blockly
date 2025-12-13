# Tasks: ESP32 WiFi/MQTT 積木與修復

**Input**: Design documents from `/specs/016-esp32-wifi-mqtt/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 未明確要求測試任務，採用手動測試（依據 Constitution 第 VII 條 UI 例外）

**Organization**: 任務依使用者故事（User Story）分組，支援獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無相依性）
-   **[Story]**: 所屬使用者故事（US1, US2, US3...）
-   描述中包含確切檔案路徑

## Path Conventions

-   **積木定義**: `media/blockly/blocks/`
-   **代碼生成器**: `media/blockly/generators/arduino/`
-   **工具箱**: `media/toolbox/categories/`
-   **i18n**: `media/locales/{lang}/messages.js`
-   **WebView 邏輯**: `media/js/blocklyEdit.js`

---

## Phase 1: Setup (基礎設定)

**Purpose**: 確認開發環境與分支準備

-   [ ] T001 確認開發環境設定（Node.js 22.16.0+, VS Code 1.105.0+）
-   [ ] T002 建立功能分支 `016-esp32-wifi-mqtt`（若尚未建立）
-   [ ] T003 執行 `npm install` 確保依賴正確安裝

---

## Phase 2: Foundational (共用基礎設施)

**Purpose**: 建立新積木類別與檔案結構，所有使用者故事都依賴此階段

**⚠️ CRITICAL**: 此階段完成前，無法開始任何使用者故事

-   [ ] T004 [P] 建立積木定義檔案 `media/blockly/blocks/esp32-wifi-mqtt.js`（空白結構）
-   [ ] T005 [P] 建立代碼生成器檔案 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`（空白結構）
-   [ ] T006 [P] 建立工具箱類別檔案 `media/toolbox/categories/communication.json`（基本結構）
-   [ ] T007 在 `media/toolbox/index.json` 中引入 `communication.json` 類別
-   [ ] T008 確認新積木檔案已被 `discoverArduinoModules()` 自動發現（無需手動修改 blocklyEdit.html）

**Checkpoint**: 基礎檔案結構就緒，可開始各使用者故事實作

---

## Phase 3: User Story 1 - 積木刪除時視角保持不變 (Priority: P1) 🎯 MVP

**Goal**: 修復積木刪除後視角自動跳轉的問題

**Independent Test**: 在工作區建立積木 → 滾動到特定位置 → 刪除積木 → 驗證視角保持原位

### Implementation for User Story 1

-   [ ] T009 [US1] 在 `media/js/blocklyEdit.js` 中新增視角狀態變數（viewportState, viewportRestoreTimer）
-   [ ] T010 [US1] 在 `media/js/blocklyEdit.js` 的 changeListener 中實作 BLOCK_DELETE 事件處理
-   [ ] T011 [US1] 實作 debounce 機制（50ms 延遲）用於批次刪除場景
-   [ ] T012 [US1] 使用 `workspace.scroll()` 恢復視角座標（scrollX, scrollY）
-   [ ] T013 [US1] 手動測試：單一積木刪除後視角保持
-   [ ] T014 [US1] 手動測試：批次選取多積木刪除後視角保持
-   [ ] T015 [US1] 手動測試：拖移積木到垃圾桶後視角保持

**Checkpoint**: User Story 1 完成，積木刪除視角問題已修復

---

## Phase 4: User Story 2 - text_join 正確串接不同型態 (Priority: P1)

**Goal**: 修復 text_join 生成 C++ 指標運算錯誤的問題

**Independent Test**: 建立 text_join 積木連接字串 "Count: " 與數字 42 → 驗證生成代碼為 `String("Count: ") + String(42)`

### Implementation for User Story 2

-   [ ] T016 [US2] 修改 `media/blockly/generators/arduino/text.js` 中的 `text_join` 生成器
-   [ ] T017 [US2] 確保每個輸入項目都包裝為 `String()`
-   [ ] T018 [US2] 處理空輸入項目情況，生成 `String("")`
-   [ ] T019 [US2] 處理零輸入項目情況，生成 `String("")`
-   [ ] T020 [US2] 更新 ORDER 優先級為 `ORDER_ADDITION`
-   [ ] T021 [US2] 手動測試：字串 + 數字生成正確代碼
-   [ ] T022 [US2] 手動測試：三種型態（字串、整數、浮點數）串接
-   [ ] T023 [US2] 手動測試：單一輸入項目生成正確代碼

**Checkpoint**: User Story 2 完成，text_join 型態轉換問題已修復

---

## Phase 5: User Story 3 - ESP32 WiFi 連線功能 (Priority: P2)

**Goal**: 提供 ESP32 WiFi 視覺化積木，支援連線、斷線、掃描等功能

**Independent Test**: 選擇 ESP32 板子 → 拖放 WiFi 連線積木 → 填入 SSID/密碼 → 驗證生成代碼包含 `#include <WiFi.h>` 與 `WiFi.begin()`

### Implementation for User Story 3

-   [ ] T024 [P] [US3] 新增 `isEsp32Board()` 輔助函數於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T025 [P] [US3] 實作 `esp32_wifi_connect` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T026 [P] [US3] 實作 `esp32_wifi_disconnect` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T027 [P] [US3] 實作 `esp32_wifi_status` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T028 [P] [US3] 實作 `esp32_wifi_get_ip` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T029 [P] [US3] 實作 `esp32_wifi_scan` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T030 [P] [US3] 實作 `esp32_wifi_get_ssid` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T031 [P] [US3] 實作 `esp32_wifi_get_rssi` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T032 [US3] 實作 `esp32_wifi_connect` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`（含 10 秒超時等待）
-   [ ] T033 [US3] 實作 `esp32_wifi_disconnect` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T034 [US3] 實作 `esp32_wifi_status` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T035 [US3] 實作 `esp32_wifi_get_ip` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T036 [US3] 實作 `esp32_wifi_scan` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T037 [US3] 實作 `esp32_wifi_get_ssid` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T038 [US3] 實作 `esp32_wifi_get_rssi` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T039 [US3] 在 `media/toolbox/categories/communication.json` 中新增 WiFi 積木（含 shadow blocks）
-   [ ] T040 [US3] 實作板子檢查邏輯：非 ESP32 板子生成警告註解
-   [ ] T041 [US3] 手動測試：ESP32 板子時工具箱顯示 WiFi 積木
-   [ ] T042 [US3] 手動測試：Arduino Uno 時 WiFi 積木不顯示或生成警告
-   [ ] T043 [US3] 手動測試：WiFi 連線積木生成正確代碼

**Checkpoint**: User Story 3 完成，ESP32 WiFi 功能可獨立運作

---

## Phase 6: User Story 4 - ESP32 MQTT 通訊功能 (Priority: P2)

**Goal**: 提供 MQTT 視覺化積木，支援連線、發布、訂閱功能

**Independent Test**: 放置 MQTT setup、connect、publish 積木 → 驗證生成代碼包含 `#include <PubSubClient.h>` 與正確的 MQTT API 呼叫

### Implementation for User Story 4

-   [ ] T044 [P] [US4] 實作 `esp32_mqtt_setup` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T045 [P] [US4] 實作 `esp32_mqtt_connect` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`（依賴 T044 mqtt_setup 提供 CLIENT_ID）
-   [ ] T046 [P] [US4] 實作 `esp32_mqtt_publish` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T047 [P] [US4] 實作 `esp32_mqtt_subscribe` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T048 [P] [US4] 實作 `esp32_mqtt_loop` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T049 [P] [US4] 實作 `esp32_mqtt_get_topic` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T050 [P] [US4] 實作 `esp32_mqtt_get_message` 積木定義於 `media/blockly/blocks/esp32-wifi-mqtt.js`
-   [ ] T051 [US4] 實作 `esp32_mqtt_setup` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`（含全域變數與 callback）
-   [ ] T052 [US4] 實作 `esp32_mqtt_connect` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`（支援可選帳密，使用 mqtt_setup 的 CLIENT_ID）
-   [ ] T053 [US4] 實作 `esp32_mqtt_publish` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T054 [US4] 實作 `esp32_mqtt_subscribe` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T055 [US4] 實作 `esp32_mqtt_loop` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T056 [US4] 實作 `esp32_mqtt_get_topic` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T057 [US4] 實作 `esp32_mqtt_get_message` 生成器於 `media/blockly/generators/arduino/esp32-wifi-mqtt.js`
-   [ ] T058 [US4] 確保 `knolleary/PubSubClient@^2.8` 自動加入 `lib_deps_`
-   [ ] T059 [US4] 在 `media/toolbox/categories/communication.json` 中新增 MQTT 積木
-   [ ] T060 [US4] 實作板子檢查邏輯：非 ESP32 板子生成警告註解
-   [ ] T061 [US4] 手動測試：MQTT setup 生成正確初始化代碼
-   [ ] T062 [US4] 手動測試：MQTT publish/subscribe 生成正確 API 呼叫
-   [ ] T063 [US4] 手動測試：PlatformIO 依賴自動加入

**Checkpoint**: User Story 4 完成，ESP32 MQTT 功能可獨立運作

---

## Phase 7: User Story 5 - 字串轉數字功能 (Priority: P2)

**Goal**: 提供字串轉整數/浮點數積木，支援 MQTT 訊息處理

**Independent Test**: 放置 `text_to_number` 積木 → 選擇整數/浮點數 → 驗證生成 `.toInt()` 或 `.toFloat()` 代碼

### Implementation for User Story 5

-   [ ] T064 [US5] 實作 `text_to_number` 積木定義於 `media/blockly/blocks/text.js`
-   [ ] T065 [US5] 實作 `text_to_number` 生成器於 `media/blockly/generators/arduino/text.js`
-   [ ] T066 [US5] 處理整數選項生成 `(text).toInt()` 代碼
-   [ ] T067 [US5] 處理浮點數選項生成 `(text).toFloat()` 代碼
-   [ ] T068 [US5] 在 Text 類別工具箱中新增 `text_to_number` 積木（含 shadow block）
-   [ ] T069 [US5] 手動測試：整數轉換生成正確代碼
-   [ ] T070 [US5] 手動測試：浮點數轉換生成正確代碼
-   [ ] T071 [US5] 手動測試：工具箱顯示預設 shadow block "123"

**Checkpoint**: User Story 5 完成，字串轉數字功能可獨立運作

---

## Phase 8: i18n 國際化 (跨使用者故事)

**Purpose**: 為所有新積木提供 15 語言翻譯支援

-   [ ] T072 [P] 新增英文翻譯鍵值於 `media/locales/en/messages.js`（約 40+ 鍵值）
-   [ ] T073 [P] 新增繁體中文翻譯鍵值於 `media/locales/zh-hant/messages.js`
-   [ ] T074 [P] 新增西班牙文翻譯鍵值於 `media/locales/es/messages.js`
-   [ ] T075 [P] 新增葡萄牙文翻譯鍵值於 `media/locales/pt-br/messages.js`
-   [ ] T076 [P] 新增法文翻譯鍵值於 `media/locales/fr/messages.js`
-   [ ] T077 [P] 新增德文翻譯鍵值於 `media/locales/de/messages.js`
-   [ ] T078 [P] 新增義大利文翻譯鍵值於 `media/locales/it/messages.js`
-   [ ] T079 [P] 新增俄文翻譯鍵值於 `media/locales/ru/messages.js`
-   [ ] T080 [P] 新增日文翻譯鍵值於 `media/locales/ja/messages.js`
-   [ ] T081 [P] 新增韓文翻譯鍵值於 `media/locales/ko/messages.js`
-   [ ] T082 [P] 新增波蘭文翻譯鍵值於 `media/locales/pl/messages.js`
-   [ ] T083 [P] 新增匈牙利文翻譯鍵值於 `media/locales/hu/messages.js`
-   [ ] T084 [P] 新增土耳其文翻譯鍵值於 `media/locales/tr/messages.js`
-   [ ] T085 [P] 新增保加利亞文翻譯鍵值於 `media/locales/bg/messages.js`
-   [ ] T086 [P] 新增捷克文翻譯鍵值於 `media/locales/cs/messages.js`
-   [ ] T087 執行 `npm run validate:i18n` 驗證翻譯完整性
-   [ ] T088 手動測試：繁體中文介面顯示正確
-   [ ] T089 手動測試：英文介面顯示正確

**Checkpoint**: 所有新積木具備完整 i18n 支援

---

## Phase 9: Polish & 跨功能整合

**Purpose**: 最終整合、文件更新與驗證

-   [ ] T090 [P] 更新 MCP 積木字典 `scripts/generate-block-dictionary.js`（若需）
-   [ ] T091 [P] 更新 CHANGELOG.md 記錄新功能與修復
-   [ ] T092 執行完整 Lint 檢查 `npm run lint`
-   [ ] T093 執行編譯 `npm run compile` 確認無錯誤
-   [ ] T094 執行既有測試套件 `npm test` 確認無回歸
-   [ ] T095 手動測試：Light/Dark 主題下積木顯示正確
-   [ ] T096 手動測試：Super Mini (ESP32-C3) 板子支援 WiFi/MQTT
-   [ ] T097 手動測試：Arduino Uno/Nano/Mega 不受新功能影響
-   [ ] T098 執行 quickstart.md 驗證流程

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依性 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有使用者故事**
-   **User Story 1-2 (Phase 3-4)**: P1 優先級，依賴 Foundational 完成
-   **User Story 3-5 (Phase 5-7)**: P2 優先級，依賴 Foundational 完成
-   **i18n (Phase 8)**: 依賴所有積木實作完成（Phase 3-7）
-   **Polish (Phase 9)**: 依賴所有功能與 i18n 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 獨立 - 僅修改 `blocklyEdit.js`
-   **User Story 2 (P1)**: 獨立 - 僅修改 `generators/arduino/text.js`
-   **User Story 3 (P2)**: 依賴 Foundational - 新增 WiFi 積木
-   **User Story 4 (P2)**: 依賴 Foundational - 新增 MQTT 積木，可與 US3 平行
-   **User Story 5 (P2)**: 獨立 - 修改 `text.js`，可與 US3/US4 平行

### Within Each User Story

-   積木定義（Block）before 代碼生成器（Generator）
-   生成器 before 工具箱配置
-   實作 before 手動測試

### Parallel Opportunities

-   **Phase 2**: T004, T005, T006 可平行
-   **Phase 5 (US3)**: T025-T031 積木定義可平行
-   **Phase 6 (US4)**: T044-T050 積木定義可平行
-   **Phase 8 (i18n)**: T072-T086 所有語言可平行
-   **Phase 9**: T090, T091 可平行

---

## Parallel Example: User Story 3 (WiFi)

```bash
# 平行執行所有 WiFi 積木定義：
Task: T025 esp32_wifi_connect 積木定義
Task: T026 esp32_wifi_disconnect 積木定義
Task: T027 esp32_wifi_status 積木定義
Task: T028 esp32_wifi_get_ip 積木定義
Task: T029 esp32_wifi_scan 積木定義
Task: T030 esp32_wifi_get_ssid 積木定義
Task: T031 esp32_wifi_get_rssi 積木定義

# 完成後依序執行生成器（有相依性）：
Task: T032-T038 依序或分批執行
```

---

## Parallel Example: i18n Phase

```bash
# 所有語言可平行更新：
Task: T072 英文
Task: T073 繁體中文
Task: T074 西班牙文
...
Task: T086 捷克文

# 完成後執行驗證：
Task: T087 npm run validate:i18n
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational
3. 完成 Phase 3: User Story 1（視角保持修復）
4. 完成 Phase 4: User Story 2（text_join 修復）
5. **STOP and VALIDATE**: 兩個 P1 Bug 修復完成
6. 可選擇先部署 P1 修復

### Full Feature Delivery

1. MVP (Phase 1-4) 完成後
2. 完成 Phase 5: User Story 3（WiFi）
3. 完成 Phase 6: User Story 4（MQTT）
4. 完成 Phase 7: User Story 5（字串轉數字）
5. 完成 Phase 8: i18n
6. 完成 Phase 9: Polish
7. 部署完整功能

### Parallel Team Strategy

多人開發時：

1. 團隊共同完成 Phase 1-2
2. Foundational 完成後：
    - Developer A: User Story 1 + 2（P1 修復）
    - Developer B: User Story 3（WiFi）
    - Developer C: User Story 4（MQTT）+ User Story 5
3. 所有功能完成後共同進行 i18n 與 Polish

---

## Notes

-   [P] 任務 = 不同檔案、無相依性，可平行執行
-   [Story] 標籤將任務對應到特定使用者故事
-   每個使用者故事應可獨立完成與測試
-   每個任務或邏輯群組完成後 commit
-   可在任何 Checkpoint 停止驗證故事獨立性
-   避免：模糊任務、同一檔案衝突、破壞獨立性的跨故事相依
