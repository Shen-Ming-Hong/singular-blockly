# 功能規格：HuskyLens 動態腳位提示與工具箱間距修復

**功能分支**: `013-huskylens-tooltip-pins`  
**建立日期**: 2025-11-25  
**狀態**: 草稿  
**輸入描述**: 為 HuskyLens I2C/UART 初始化區塊新增動態腳位提示 tooltip，根據選擇的開發板（ESP32、Uno、Mega 等）顯示對應的接線建議，並修復 vision-sensors 工具箱的視覺間距不一致問題

## 背景與動機

### 問題描述

1. **腳位提示不足**：HuskyLens I2C 與 UART 初始化區塊的 tooltip 只顯示功能說明，未提供各開發板的對應腳位資訊。使用者需要額外查閱文件才能正確接線，降低開發效率。

2. **開發板差異未說明**：

    - ESP32 使用 HardwareSerial，建議特定 GPIO 腳位（GPIO16/17 或 GPIO26/27）
    - Arduino Uno/Nano 使用 SoftwareSerial，可使用任意數位腳位
    - Arduino Mega 有專用 I2C 腳位（D20/D21）
    - 不同開發板的 I2C 腳位也不同（Uno/Nano: A4/A5、Mega: D20/D21、ESP32: GPIO21/22）

3. **工具箱間距不一致**：vision-sensors 類別的區塊群組間距與其他類別不同，造成視覺不協調。經調查發現是該類別使用了 `sep` 分隔符，而其他類別均未使用。

### 目標

-   讓使用者在拖曳 HuskyLens 區塊時立即獲得接線提示
-   根據目前選擇的開發板動態顯示對應的腳位資訊
-   修復 vision-sensors 工具箱的間距問題，使其與其他類別一致

## 使用者情境與測試

### 使用者故事 1 - I2C 接線提示 (優先級: P1)

身為初學者，當我將 HuskyLens I2C 初始化區塊拖入工作區時，我希望滑鼠懸停時能看到「使用 I2C 腳位：A4(SDA)/A5(SCL)」這樣的提示，這樣我就能快速正確接線而不需查閱額外文件。

**優先級理由**: I2C 是 HuskyLens 最常用的通訊方式，此功能直接影響使用者的接線體驗。

**獨立測試**: 可在任何開發板模式下測試 I2C 區塊的 tooltip 顯示，不依賴其他功能。

**驗收情境**:

1. **Given** 使用者選擇 Arduino Uno 開發板，**When** 滑鼠懸停在 huskylens_init_i2c 區塊上，**Then** tooltip 顯示基本說明加上「接線提示：A4(SDA)/A5(SCL)」
2. **Given** 使用者選擇 Arduino Mega 開發板，**When** 滑鼠懸停在 huskylens_init_i2c 區塊上，**Then** tooltip 顯示基本說明加上「接線提示：D20(SDA)/D21(SCL)」
3. **Given** 使用者選擇 ESP32 開發板，**When** 滑鼠懸停在 huskylens_init_i2c 區塊上，**Then** tooltip 顯示基本說明加上「接線提示：GPIO21(SDA)/GPIO22(SCL)」

---

### 使用者故事 2 - UART 接線提示 (優先級: P1)

身為使用 UART 通訊的使用者，當我拖入 HuskyLens UART 初始化區塊時，我希望 tooltip 能根據開發板類型提供腳位建議，特別是 ESP32 需要知道建議使用的 HardwareSerial 腳位。

**優先級理由**: UART 是 HuskyLens 另一個重要通訊方式，ESP32 與 AVR 板的差異很大，需要明確提示。

**獨立測試**: 可單獨測試 UART 區塊的 tooltip，不需 I2C 功能完成。

**驗收情境**:

1. **Given** 使用者選擇 Arduino Uno/Nano 開發板，**When** 滑鼠懸停在 huskylens_init_uart 區塊上，**Then** tooltip 顯示基本說明加上「接線提示：可使用任意數位腳位」
2. **Given** 使用者選擇 ESP32 開發板，**When** 滑鼠懸停在 huskylens_init_uart 區塊上，**Then** tooltip 顯示基本說明加上「接線提示：建議使用 GPIO16(RX2)/GPIO17(TX2)」

---

### 使用者故事 3 - 多語言支援 (優先級: P2)

身為非英語系使用者，當我將介面語言設為繁體中文（或其他支援語言）時，tooltip 的腳位提示也應該以對應語言顯示。

**優先級理由**: 專案支援 15 種語言，國際化是核心價值，但可在基本功能完成後添加。

**獨立測試**: 可在切換語言後測試 tooltip 語言是否正確。

**驗收情境**:

1. **Given** 使用者介面語言設為繁體中文，**When** 滑鼠懸停在 HuskyLens 區塊上，**Then** tooltip 腳位提示以中文顯示
2. **Given** 使用者介面語言設為英文，**When** 滑鼠懸停在 HuskyLens 區塊上，**Then** tooltip 腳位提示以英文顯示

---

### 使用者故事 4 - 工具箱間距一致性 (優先級: P2)

身為使用者，當我瀏覽 vision-sensors 工具箱類別時，區塊群組之間的間距應與其他類別（如 Arduino、感測器、馬達）保持一致。

**優先級理由**: 視覺一致性影響整體使用體驗，但不影響功能正確性。

**獨立測試**: 可單獨驗證工具箱間距，不依賴 tooltip 功能。

**驗收情境**:

1. **Given** 使用者開啟 vision-sensors 工具箱類別，**When** 與其他類別（如 Arduino、感測器）比較，**Then** 區塊群組間距在視覺上一致
2. **Given** 工具箱已載入，**When** 檢查 vision-sensors 類別，**Then** 只保留 Pixetto 與 HuskyLens 群組之間的分隔（gap: 24），其他無額外間距

---

### 邊界情況

-   **開發板未設定**：若 `window.currentBoard` 未定義，應使用預設值（Uno）並顯示對應腳位
-   **語言鍵值缺失**：若 i18n 訊息鍵不存在，應顯示硬編碼的英文 fallback 文字
-   **開發板切換後**：tooltip 應在下次懸停時自動更新為新開發板的腳位資訊

## 需求

### 功能需求

-   **FR-001**: HuskyLens I2C 初始化區塊必須在 tooltip 中顯示對應開發板的 I2C 腳位資訊
-   **FR-002**: HuskyLens UART 初始化區塊必須在 tooltip 中顯示對應開發板的 UART 腳位建議
-   **FR-003**: tooltip 內容必須根據目前選擇的開發板動態生成（每次懸停時評估）
-   **FR-004**: 腳位提示文字必須支援 15 種現有語言的國際化
-   **FR-005**: tooltip 內容必須包含換行符以區分基本說明與腳位提示
-   **FR-006**: vision-sensors 工具箱類別必須移除多餘的 `sep` 分隔符，僅保留 Pixetto 與 HuskyLens 群組之間的一個

### 各開發板腳位對應表

| 開發板              | I2C 腳位                | UART 建議               |
| ------------------- | ----------------------- | ----------------------- |
| Arduino Uno         | A4(SDA)/A5(SCL)         | 任意數位腳位            |
| Arduino Nano        | A4(SDA)/A5(SCL)         | 任意數位腳位            |
| Arduino Mega        | D20(SDA)/D21(SCL)       | 任意數位腳位            |
| ESP32               | GPIO21(SDA)/GPIO22(SCL) | GPIO16(RX2)/GPIO17(TX2) |
| ESP32-C3 Super Mini | GPIO8(SDA)/GPIO9(SCL)   | GPIO20(RX)/GPIO21(TX)   |

### 假設

-   Blockly 12.3.1 的 `setTooltip()` 方法支援函數參數（每次懸停時執行）- 已透過文件確認
-   `window.currentBoard` 變數在 WebView 環境中可用且包含當前開發板識別碼，可能的值為：
    - `'uno'` - Arduino Uno
    - `'nano'` - Arduino Nano
    - `'mega'` - Arduino Mega
    - `'esp32'` - ESP32 DevKit
    - `'supermini'` - ESP32-C3 Super Mini
-   現有的 `window.languageManager.getMessage()` 機制可用於取得國際化訊息

## 成功標準

### 可衡量成果

-   **SC-001**: 使用者無需查閱外部文件即可從 tooltip 獲得正確的接線資訊
-   **SC-002**: 切換開發板後，tooltip 顯示對應開發板的腳位資訊（正確率 100%）
-   **SC-003**: 15 種支援語言均有對應的腳位提示翻譯
-   **SC-004**: vision-sensors 工具箱的視覺間距與其他類別一致（經視覺比對確認）
-   **SC-005**: 此功能不增加編輯器載入時間超過 50ms
