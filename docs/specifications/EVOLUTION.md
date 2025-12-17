# Singular Blockly 開發歷程與功能演進

> 本文件記錄專案從 specs/001 到 specs/016 的開發軌跡，包含功能新增、架構變更、已移除功能的前因後果。

## 時間軸總覽

```
2024-12 ─┬─ 001 架構重構（清理、模組化）
         │
2025-01 ─┼─ 002 i18n 品質審查
         ├─ 003 HuskyLens 積木驗證
         ├─ 004 測試覆蓋率提升
         │
2025-02 ─┼─ 005 安全依賴更新（Phase 1）
         ├─ 006 次要依賴更新（Phase 2）
         ├─ 007 型別定義升級
         │
2025-03 ─┼─ 008 核心依賴升級（Blockly 12）
         ├─ 009 開發工具升級
         │
2025-10 ─┼─ 010 專案安全防護機制
         │
2025-11 ─┼─ 011 ESP32 PWM 設定
         ├─ 012 ESP32 Pixetto 修正
         ├─ 013 HuskyLens tooltip 腳位提示
         │
2025-12 ─┼─ 014 Blockly 序列化修復
         ├─ 015 MCP Server 整合
         └─ 016 ESP32 WiFi/MQTT + Bug Fixes
```

---

## 第一階段：基礎架構重構（001-004）

### 001 - 架構清理與模組化

**時間**：2024-12  
**目標**：清理技術債務，建立可維護的架構基礎

**主要變更**：

1. ✅ 移除空的 `src/modules/` 目錄
2. ✅ 整合 `FileService` 到 `webviewManager.ts`（取代散落的 fs 呼叫）
3. ✅ 消除 `localeService.ts` 與 `blocklyEdit.js` 的重複載入邏輯
4. ✅ 採用時間戳命名暫存檔案（解決同名覆蓋問題）
5. ✅ 動態發現 Arduino Generator 模組（取代硬編碼陣列）
6. ✅ 抽取魔術數字為常數

**架構決策**：

-   選擇 FileService 而非直接 fs 呼叫，便於測試 mock
-   採用 `discoverArduinoModules()` 動態載入，新增 generator 無需修改陣列

### 002 - i18n 翻譯品質系統

**時間**：2025-01  
**目標**：建立自動化翻譯品質驗證系統

**主要變更**：

1. ✅ 實作白名單機制過濾誤報（68.9% 高嚴重性誤報消除）
2. ✅ 建立 16 條驗證規則
3. ✅ 建立 CI/CD 整合（月度自動審計）
4. 📌 GitHub Issue #16 關閉

**白名單規則類型**：

-   `KEYWORD_*`：技術術語保留（如 PWM、I2C、WiFi）
-   `MEASUREMENT_PATTERN`：測量單位保留
-   `CONSISTENT_TRANSLATION`：跨語言一致性

### 003 - HuskyLens 積木驗證

**時間**：2025-01  
**目標**：驗證並完善 HuskyLens AI 視覺鏡頭積木

**涵蓋積木類型**（11 種）：

-   初始化：`huskylens_init_i2c`、`huskylens_init_uart`
-   演算法：`huskylens_set_algorithm`（7 種模式）
-   物件偵測：`huskylens_request`、`huskylens_get_count`
-   資料讀取：`huskylens_get_id`、`huskylens_get_center`、`huskylens_get_size`
-   學習控制：`huskylens_learn_once`、`huskylens_forget`、`huskylens_is_learned`

**i18n 支援**：12 種語言、44 個訊息鍵

### 004 - 測試覆蓋率提升

**時間**：2025-01  
**目標**：達到 90%+ 測試覆蓋率

**當時基線**：87.21%

**策略**：

-   依賴注入模式（所有 Service 類別）
-   獨立元件測試（分離 WebView、Extension Host）
-   Fail-fast 錯誤處理

---

## 第二階段：依賴現代化（005-009）

### 依賴升級策略

採用五階段漸進式升級，確保穩定性：

| 階段 | 規格 | 風險等級 | 套件數 |
| ---- | ---- | -------- | ------ |
| 1    | 005  | 低       | 5      |
| 2    | 006  | 低       | 2      |
| 3    | 007  | 中       | 3      |
| 4    | 008  | 高       | 2      |
| 5    | 009  | 中       | 3      |

### 005 - 安全依賴更新

**升級內容**：

-   TypeScript 5.7.2 → 5.9.3
-   @typescript-eslint 8.19.1 → 8.46.1
-   sinon 20 → 21
-   webpack 5.97.1 → 5.102.1
-   @vscode/test-electron 2.4.1 → 2.5.2

### 006 - 次要依賴更新

**升級內容**：

-   @blockly/theme-modern 6.0.10 → 6.0.12
-   @types/node 20.17.12 → 20.19.22

### 007 - 型別定義升級

**升級內容**：

-   @types/vscode 1.96.0 → 1.105.0（關鍵：MCP API 支援）
-   @types/node 20.x → 22.x
-   tsconfig target ES2022 → ES2023

### 008 - 核心依賴升級（重大）

**升級內容**：

-   **Blockly 11.2.2 → 12.3.1**
-   @blockly/theme-modern 6.0.12 → 7.0.1

**破壞性變更處理**：

-   JSON 序列化系統變更（觸發 014 修復）
-   主題系統 API 更新
-   工作區相容性維護（舊 main.json 仍可載入）

### 009 - 開發工具升級

**升級內容**：

-   @typescript-eslint/eslint-plugin 8.46.1 → 8.46.2
-   ESLint ecmaVersion 2022 → 2023
-   webpack-cli 5.1.4 → 6.0.1

---

## 第三階段：安全與品質（010）

### 010 - 專案安全防護機制

**時間**：2025-10  
**目標**：防止在非 Blockly 專案中誤觸造成檔案結構破壞

**三層防護**：

1. **P1 - 偵測與警告**

    - 檢查 `blockly/` 資料夾是否存在
    - 警告訊息：「這個專案還沒有 Blockly 積木。如果繼續，會在這裡建立 blockly 資料夾和檔案。要繼續嗎？」

2. **P2 - 智慧專案識別**

    - Node.js（`package.json`）
    - Python（`requirements.txt`）
    - Java Maven（`pom.xml`）
    - .NET、Go 專案

3. **P3 - 使用者偏好記憶**
    - 工作區級別「不再提醒」設定
    - 儲存於 `.vscode/settings.json`

**實作位置**：`src/services/workspaceValidator.ts`

---

## 第四階段：ESP32 硬體支援（011-013）

### 011 - ESP32 PWM 設定

**目標**：支援高頻 PWM（最高 75KHz）用於馬達驅動晶片

**積木**：`esp32_pwm_setup`

-   頻率：1-80,000 Hz
-   解析度：8, 10, 12, 13, 14, 15, 16 bit

**自動驗證**：

-   硬體限制：頻率 × 2^解析度 ≤ 80,000,000
-   不相容時自動調整並加註解說明

### 012 - ESP32 Pixetto 修正

**問題**：ESP32 生成了不必要的 `#include <SoftwareSerial.h>` 和 AVR build_flags

**修正**：

```javascript
if (window.currentBoard.includes('esp32')) {
	// 不產生 SoftwareSerial 相關程式碼
} else {
	// AVR 板保持原有行為
}
```

### 013 - HuskyLens 動態腳位提示

**需求**：tooltip 根據開發板顯示對應接線資訊

| 開發板   | I2C       | UART       |
| -------- | --------- | ---------- |
| Uno/Nano | A4/A5     | 任意數位腳 |
| Mega     | D20/D21   | 任意數位腳 |
| ESP32    | GPIO21/22 | GPIO16/17  |
| ESP32-C3 | GPIO8/9   | GPIO20/21  |

**實作**：`setTooltip()` 傳入函數，每次懸停時動態計算

---

## 第五階段：進階功能（014-016）

### 014 - Blockly 序列化修復

**問題根因**：Blockly 12.x 使用 JSON 序列化，但積木只有 XML hooks

**症狀**：

-   連接的 value block 保存後變獨立積木
-   程式碼生成到 loop() 外面導致編譯失敗

**修復範圍**（本次）：

-   `encoder_setup`
-   `encoder_read`
-   `encoder_reset`
-   `encoder_pid_setup`
-   `encoder_pid_compute`

**修復策略**：

1. 新增 `saveExtraState()` / `loadExtraState()` hooks
2. 保留 XML hooks 確保向後相容
3. 實作 `scrubNakedValue()` 將獨立 value block 轉為註解

### 015 - MCP Server 整合

**目標**：讓 AI 工具（Copilot、Claude）能操作 Blockly 專案

**架構**：

-   VSCode 1.105.0+ MCP API
-   STDIO 傳輸層
-   獨立 bundle（`dist/mcp-server.js`）

**MCP 工具**：

| 工具                      | 用途                         |
| ------------------------- | ---------------------------- |
| `get_block_usage`         | 查詢積木用法，生成 JSON 範本 |
| `search_blocks`           | 關鍵字搜尋（中英文）         |
| `list_blocks_by_category` | 按分類列出積木               |
| `get_workspace_state`     | 讀取 main.json               |
| `get_generated_code`      | 讀取 main.cpp                |
| `refresh_editor`          | 通知 WebView 重載            |

**積木字典**：55 個自訂積木，繁體中文說明

### 016 - ESP32 WiFi/MQTT + Bug Fixes

**Bug 修復（P1）**：

1. **視角重置問題**

    - 問題：刪除積木時工作區視角跳轉
    - 修復：debounce 50ms + 儲存/恢復 scrollX, scrollY

2. **text_join 型態問題**
    - 問題：字串與數字串接產生指標運算
    - 修復：每項包裝為 `String()`

**新功能（P2）**：

**WiFi 積木**：

-   `esp32_wifi_connect` - 連線（含 10 秒超時）
-   `esp32_wifi_disconnect` - 斷線
-   `esp32_wifi_scan` - 掃描網路
-   `esp32_wifi_status` - 連線狀態
-   `esp32_wifi_get_ip` - 取得 IP
-   `esp32_wifi_get_ssid` - 取得 SSID
-   `esp32_wifi_get_rssi` - 訊號強度

**MQTT 積木**：

-   `esp32_mqtt_setup` - 設定 broker
-   `esp32_mqtt_connect` - 連線
-   `esp32_mqtt_publish` - 發布
-   `esp32_mqtt_subscribe` - 訂閱
-   `esp32_mqtt_loop` - 維持連線
-   `esp32_mqtt_get_topic` / `esp32_mqtt_get_message` - 讀取訊息

**字串轉數字**：

-   `text_to_number` - 整數 `.toInt()` / 浮點數 `.toFloat()`

---

## 已移除或演進的功能

### 從架構中移除

| 項目                  | 原因                  | 替代方案                   |
| --------------------- | --------------------- | -------------------------- |
| `src/modules/` 空目錄 | 未使用                | 移除                       |
| 硬編碼 generator 陣列 | 難維護                | `discoverArduinoModules()` |
| 直接 fs 呼叫          | 難測試                | FileService                |
| XML 序列化（單獨）    | Blockly 12 不完整支援 | JSON + XML 雙 hooks        |

### API 演進

| 原 API                   | 新 API          | 原因     |
| ------------------------ | --------------- | -------- |
| Blockly 11 serialization | Blockly 12 JSON | 版本升級 |
| `window.languageManager` | 保持相容        | 無變更   |
| `window.currentBoard`    | 保持相容        | 無變更   |

---

## 經驗教訓

### 成功實踐

1. **漸進式依賴升級**：五階段策略避免大爆炸式升級風險
2. **雙序列化 hooks**：保持 XML 向後相容同時支援新 JSON 系統
3. **白名單機制**：i18n 誤報從 61 件降至 0 件
4. **MCP 整合架構**：STDIO 傳輸、FileWatcher 模式、原子寫入備份

### 改進空間

1. **序列化問題**：Blockly 12 升級時應同步審查所有 mutation 積木
2. **測試覆蓋**：87.21% 仍未達 90% 目標
3. **ESP32 變體**：ESP32-S2/S3/C3 的特殊配置尚未完整覆蓋

---

_最後更新：2025-12-14_
