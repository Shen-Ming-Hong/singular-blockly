# Feature Specification: 修正 HuskyLens 積木 RX/TX 標籤顯示

**Feature Branch**: `020-fix-huskylens-rxtx`  
**Created**: 2025-12-28  
**Status**: Draft  
**Input**: User description: "修正 HuskyLens 積木的 RX/TX 標籤顯示錯誤問題，將標籤從 RX/TX 腳位改為連接 HuskyLens TX/RX 格式，並根據各開發板設定智慧預設腳位"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 清晰的接線標籤指引 (Priority: P1)

使用者在 Blockly 編輯器中使用 HuskyLens UART 初始化積木時，能清楚看到「連接 HuskyLens TX →」和「連接 HuskyLens RX →」的標籤，直觀知道 Arduino 腳位應該接到 HuskyLens 的哪個腳位。

**Why this priority**: 這是核心問題修正。原本的「RX 腳位」「TX 腳位」標籤容易讓使用者誤解接線方向，導致接線錯誤。明確標示「連接 HuskyLens TX →」可消除歧義。

**Independent Test**: 開啟 Blockly 編輯器，拖曳 HuskyLens UART 初始化積木到工作區，觀察標籤文字是否清楚標示「連接 HuskyLens TX →」和「連接 HuskyLens RX →」。

**Acceptance Scenarios**:

1. **Given** 使用者開啟 Blockly 編輯器並選擇任意開發板, **When** 使用者從工具箱拖曳 HuskyLens UART 初始化積木, **Then** 積木顯示「連接 HuskyLens TX →」和「連接 HuskyLens RX →」標籤（依使用者設定的語言顯示對應翻譯）
2. **Given** 使用者介面語言為英文, **When** 使用者查看 HuskyLens UART 積木, **Then** 標籤顯示「Connect to HuskyLens TX →」和「Connect to HuskyLens RX →」
3. **Given** 使用者介面語言為日文, **When** 使用者查看 HuskyLens UART 積木, **Then** 標籤顯示「HuskyLens TX に接続 →」和「HuskyLens RX に接続 →」

---

### User Story 2 - 智慧預設腳位選擇 (Priority: P2)

使用者新增 HuskyLens UART 初始化積木時，系統根據當前選擇的開發板自動設定合適的預設腳位，減少手動調整的需要。

**Why this priority**: 提升使用者體驗。ESP32 和 Super Mini 有特定的建議 UART 腳位，自動設定預設值可減少使用者查閱文件的需求。

**Independent Test**: 切換不同開發板後新增 HuskyLens UART 積木，檢查預設腳位是否對應該開發板的建議值。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 ESP32 開發板, **When** 使用者新增 HuskyLens UART 初始化積木, **Then** RX 腳位預設為 GPIO16，TX 腳位預設為 GPIO17
2. **Given** 使用者選擇 Super Mini 開發板, **When** 使用者新增 HuskyLens UART 初始化積木, **Then** RX 腳位預設為 GPIO20，TX 腳位預設為 GPIO21
3. **Given** 使用者選擇 Arduino Uno/Nano/Mega 開發板, **When** 使用者新增 HuskyLens UART 初始化積木, **Then** RX 腳位預設為 D2，TX 腳位預設為 D3

---

### User Story 3 - 向後相容舊工作區 (Priority: P1)

使用者載入先前儲存的 Blockly 工作區檔案（main.json），即使該工作區是用舊版標籤建立的，所有 HuskyLens 積木的腳位設定都能正確還原。

**Why this priority**: 資料完整性至關重要。使用者不應因為更新而遺失先前的設定。

**Independent Test**: 載入含有舊版 HuskyLens UART 積木的 main.json 檔案，確認腳位值正確還原。

**Acceptance Scenarios**:

1. **Given** 使用者有一個舊版 main.json 檔案，其中 HuskyLens UART 積木的 RX_PIN 設為 "10"、TX_PIN 設為 "11", **When** 使用者載入此工作區, **Then** 積木顯示新標籤但保留原本的腳位設定（RX 腳位選擇 10，TX 腳位選擇 11）
2. **Given** 使用者有一個舊版 main.json 檔案, **When** 使用者載入工作區後儲存, **Then** 儲存的 JSON 結構與原檔案的欄位名稱相容（RX_PIN、TX_PIN 欄位名稱不變）

---

### Edge Cases

-   當使用者切換開發板後，已存在於工作區的 HuskyLens 積木不應自動更改腳位值（僅新增的積木套用新預設值）
-   當選擇的預設腳位在該開發板的腳位清單中不存在時，應 fallback 到第一個可用的數位腳位
-   所有 15 種語言的標籤都必須更新，缺少翻譯時應顯示英文 fallback

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統必須將 HuskyLens UART 積木的 RX 腳位標籤從「RX 腳位」更改為「連接 HuskyLens TX →」格式
-   **FR-002**: 系統必須將 HuskyLens UART 積木的 TX 腳位標籤從「TX 腳位」更改為「連接 HuskyLens RX →」格式
-   **FR-003**: 系統必須為 ESP32 開發板設定 HuskyLens UART 預設腳位為 GPIO16 (RX) 和 GPIO17 (TX)
-   **FR-004**: 系統必須為 Super Mini 開發板設定 HuskyLens UART 預設腳位為 GPIO20 (RX) 和 GPIO21 (TX)
-   **FR-005**: 系統必須為 AVR 開發板（Uno、Nano、Mega）設定 HuskyLens UART 預設腳位為 D2 (RX) 和 D3 (TX)
-   **FR-006**: 系統必須保持積木欄位名稱 `RX_PIN` 和 `TX_PIN` 不變，確保向後相容性
-   **FR-007**: 系統必須更新所有 15 種語言的 i18n 訊息檔案
-   **FR-008**: 系統必須確保程式碼生成邏輯維持正確（Arduino RX 接 HuskyLens TX）

### Key Entities

-   **HuskyLens UART 積木 (huskylens_init_uart)**: 用於初始化 HuskyLens 智慧鏡頭的 UART 通訊，包含 RX_PIN 和 TX_PIN 兩個下拉選單欄位
-   **i18n 訊息**: HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 訊息鍵，存在於 15 個語言檔案中
-   **開發板配置 (HUSKYLENS_UART_DEFAULTS)**: 定義各開發板的建議 UART 腳位

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 積木標籤明確顯示目標裝置腳位名稱（「連接 HuskyLens TX →」），使用者無需查閱外部文件即可理解接線方向
-   **SC-002**: 100% 的舊版 main.json 工作區檔案能正確載入，腳位設定不遺失
-   **SC-003**: 15 種語言的標籤翻譯 100% 完成，通過 i18n 驗證腳本檢查
-   **SC-004**: ESP32、Super Mini、AVR 三類開發板的預設腳位設定 100% 符合建議值

## Assumptions

-   標籤採用「連接 HuskyLens TX →」格式（含箭頭），使用者已確認此格式
-   AVR 開發板預設使用 D2/D3（常見 SoftwareSerial 接線）
-   積木類型名稱 `huskylens_init_uart` 不變，確保積木序列化/反序列化相容
