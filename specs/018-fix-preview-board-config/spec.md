# Feature Specification: 修復預覽模式開發板配置顯示錯誤

**Feature Branch**: `018-fix-preview-board-config`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "修復 ESP32 備份檔案預覽模式顯示 Arduino 腳位而非 ESP32 腳位的問題"

## Clarifications

### Session 2025-12-25

-   Q: 不支援的開發板類型處理方式？ → A: 顯示警告通知並使用預設板子（arduino_uno），讓使用者知道有異常同時仍能預覽內容

## User Scenarios & Testing _(mandatory)_

### User Story 1 - ESP32 備份檔案預覽顯示正確腳位 (Priority: P1)

使用者開啟一個 ESP32 專案的備份檔案進行預覽時，所有積木中的腳位下拉選單應該顯示 ESP32 的 GPIO 腳位（如 `GPIO0`, `GPIO2`, `GPIO4` 等），而非 Arduino 的腳位（如 `D0`, `D1`, `A0` 等）。

**Why this priority**: 這是本次修復的核心問題。預覽模式的主要目的是讓使用者檢視備份內容，如果腳位資訊顯示錯誤，使用者將無法正確判斷備份檔案的內容。

**Independent Test**: 建立一個使用 ESP32 開發板的專案，新增數位輸出積木並選擇 GPIO 腳位，建立備份後開啟預覽，確認腳位顯示為 ESP32 格式。

**Acceptance Scenarios**:

1. **Given** 一個 ESP32 專案備份檔案（`backup_*.json`，其中 `board: "esp32"`），**When** 使用者透過預覽功能開啟此備份檔案，**Then** 所有積木的腳位下拉選單應顯示 ESP32 GPIO 腳位格式（如 `GPIO0`, `GPIO2`）
2. **Given** 一個 ESP32 備份檔案包含數位輸入/輸出積木，**When** 預覽模式載入完成，**Then** 積木上已選擇的腳位應保持原始設定值（例如原本選 `GPIO4` 仍顯示 `GPIO4`）
3. **Given** 一個 Arduino Uno 專案備份檔案（`board: "arduino_uno"`），**When** 使用者開啟預覽，**Then** 腳位應顯示 Arduino 格式（如 `D0`, `D1`, `A0`）

---

### User Story 2 - ESP32 WiFi/MQTT 積木正確顯示於預覽 (Priority: P1)

使用者開啟包含 ESP32 WiFi/MQTT 積木的備份檔案時，這些積木應該正確顯示，而非顯示為「未知積木」或「缺失積木」的警告區塊。

**Why this priority**: 如果 ESP32 專屬積木無法在預覽模式顯示，使用者將無法正確預覽包含這些積木的專案，直接影響預覽功能的實用性。

**Independent Test**: 建立一個包含 ESP32 WiFi 連線積木的專案，建立備份後開啟預覽，確認 WiFi 積木正確顯示其配置內容。

**Acceptance Scenarios**:

1. **Given** 一個包含 ESP32 WiFi 連線積木的備份檔案，**When** 使用者開啟預覽，**Then** WiFi 積木應正確顯示，包括 SSID 和密碼欄位內容
2. **Given** 一個包含 ESP32 MQTT 發布/訂閱積木的備份檔案，**When** 使用者開啟預覽，**Then** MQTT 積木應正確顯示其 topic 和 payload 設定

---

### User Story 3 - 不同開發板備份檔案預覽正確切換 (Priority: P2)

使用者連續開啟不同開發板類型的備份檔案時，預覽模式應該根據每個檔案的 `board` 設定正確切換腳位配置。

**Why this priority**: 確保預覽模式的一致性，使用者可能需要比較不同開發板版本的備份。

**Independent Test**: 依序開啟 ESP32 備份、Arduino Uno 備份、ESP32 Super Mini 備份，確認每次預覽的腳位都正確。

**Acceptance Scenarios**:

1. **Given** 使用者先開啟 ESP32 備份預覽，**When** 關閉後開啟 Arduino Uno 備份預覽，**Then** 腳位應切換為 Arduino 格式
2. **Given** 使用者開啟多個預覽視窗，**When** 每個視窗對應不同開發板類型，**Then** 各視窗應獨立顯示正確的腳位配置

---

### Edge Cases

-   備份檔案缺少 `board` 欄位時，應預設為 `arduino_uno` 以維持向後相容性
-   備份檔案的 `board` 值為不支援的類型時，系統應使用 `arduino_uno` 預設板子，並在預覽視窗頂部顯示警告訊息「無法識別的開發板類型，已使用預設配置」
-   備份檔案包含新版本才有的積木類型時，預覽模式應盡可能顯示，未知積木應有明確提示

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 預覽模式載入備份檔案時，系統 MUST 讀取並套用備份檔案中的 `board` 欄位設定
-   **FR-002**: 預覽模式的 WebView MUST 在載入積木狀態之前先設定正確的開發板類型
-   **FR-003**: 預覽模式 MUST 載入 ESP32 WiFi/MQTT 積木定義腳本，以正確顯示 ESP32 專屬積木
-   **FR-004**: 備份檔案缺少 `board` 欄位時，系統 MUST 預設使用 `arduino_uno` 作為開發板類型
-   **FR-005**: 預覽模式的腳位下拉選單 MUST 根據當前開發板類型顯示對應的腳位選項
-   **FR-006**: 當備份檔案的 `board` 值為不支援的類型時，系統 MUST 顯示警告訊息並使用 `arduino_uno` 作為降級配置

### Key Entities

-   **備份檔案 (Backup File)**: JSON 格式檔案，包含 `workspace`（積木狀態）、`board`（開發板類型）、`theme`（主題）三個主要屬性
-   **開發板配置 (Board Config)**: 定義各開發板的腳位映射、支援的功能、PlatformIO 設定，儲存於 `board_configs.js`
-   **預覽視窗 (Preview Panel)**: 唯讀模式的 WebView 面板，顯示備份檔案內容但不允許編輯

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: ESP32 備份檔案預覽時，100% 的腳位下拉選單顯示 ESP32 GPIO 格式腳位
-   **SC-002**: 包含 ESP32 WiFi/MQTT 積木的備份檔案，預覽時 100% 積木正確顯示（無「未知積木」警告）
-   **SC-003**: 預覽視窗載入時間不因新增積木腳本而明顯增加（< 500ms 差異）
-   **SC-004**: 所有支援的開發板類型（Arduino Uno/Nano/Mega、ESP32、ESP32 Super Mini）備份檔案均能正確預覽

## Assumptions

-   備份檔案格式遵循現有 `{ workspace, board, theme }` 結構
-   `setCurrentBoard` 函數已透過 `board_configs.js` 在預覽模式中可用
-   預覽模式為唯讀，不需要開發板切換 UI 控件
