# Feature Specification: CyberBrick Output Monitor

**Feature Branch**: `037-cyberbrick-output-monitor`  
**Created**: 2026-01-25  
**Status**: Draft  
**Input**: User description: "為 CyberBrick 新增可以看到 print 內容的方法"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 查看感測器輸出 (Priority: P1)

使用者在 CyberBrick 上傳程式後，想要即時看到 `print()` 輸出的感測器數值（如溫度、距離、光線等），以便驗證程式是否正確運作。

**Why this priority**: 這是 Monitor 功能的核心價值，沒有輸出顯示就無法進行任何除錯或驗證工作。

**Independent Test**: 可透過上傳一個簡單的 `print("Hello")` 程式，點擊 Monitor 按鈕後確認終端機顯示 "Hello" 來獨立測試。

**Acceptance Scenarios**:

1. **Given** 使用者已上傳 MicroPython 程式到 CyberBrick，程式包含 `print()` 語句, **When** 使用者點擊「Monitor」按鈕, **Then** VSCode 開啟一個 Terminal 視窗，即時顯示裝置的 stdout 輸出
2. **Given** Monitor 終端機已開啟並顯示輸出, **When** 裝置程式執行 `print("sensor: 123")`, **Then** 終端機在 1 秒內顯示 "sensor: 123"

---

### User Story 2 - 自動埠偵測 (Priority: P1)

使用者不需要手動選擇 COM 埠，系統應自動偵測已連接的 CyberBrick 裝置。

**Why this priority**: 自動偵測是使用者體驗的關鍵，手動選擇埠會增加使用門檻，尤其對初學者。

**Independent Test**: 插入 CyberBrick 後點擊 Monitor 按鈕，確認系統自動找到並連接正確的埠。

**Acceptance Scenarios**:

1. **Given** CyberBrick 已透過 USB 連接到電腦, **When** 使用者點擊「Monitor」按鈕, **Then** 系統自動偵測 CyberBrick (VID: 303A, PID: 1001) 並連接
2. **Given** 沒有 CyberBrick 連接到電腦, **When** 使用者點擊「Monitor」按鈕, **Then** 顯示友善的錯誤訊息「找不到 CyberBrick 裝置」

---

### User Story 3 - 上傳與監控的埠衝突處理 (Priority: P2)

當使用者正在監控輸出時想要上傳新程式，系統應自動處理 COM 埠衝突，避免上傳失敗。

**Why this priority**: 埠衝突是常見問題，若不處理會導致上傳失敗，嚴重影響使用體驗。

**Independent Test**: 在 Monitor 開啟狀態下點擊上傳，確認上傳成功且不需手動關閉 Monitor。

**Acceptance Scenarios**:

1. **Given** Monitor 終端機正在監控 CyberBrick 輸出, **When** 使用者點擊「上傳」按鈕, **Then** 系統自動關閉 Monitor 釋放 COM 埠，然後開始上傳
2. **Given** 上傳成功完成, **When** 上傳流程結束, **Then** 系統提示使用者可重新開啟 Monitor 查看輸出

---

### User Story 4 - 僅 CyberBrick 顯示 Monitor 按鈕 (Priority: P2)

Monitor 功能僅適用於 CyberBrick (MicroPython) 板，Arduino 板不應顯示此按鈕。

**Why this priority**: 避免使用者困惑，Arduino 使用 PlatformIO 有自己的 Serial Monitor。

**Independent Test**: 切換不同板子，確認按鈕顯示/隱藏行為正確。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 CyberBrick 板, **When** WebView 載入完成, **Then** 顯示「Monitor」按鈕
2. **Given** 使用者選擇 Arduino/ESP32 等 Arduino 板, **When** WebView 載入完成, **Then** 不顯示「Monitor」按鈕

---

### User Story 5 - 關閉 Monitor (Priority: P3)

使用者可以手動關閉 Monitor 終端機，釋放 COM 埠。

**Why this priority**: 基本功能，使用者需要能夠控制何時停止監控。

**Independent Test**: 開啟 Monitor 後關閉終端機視窗，確認程序正確清理。

**Acceptance Scenarios**:

1. **Given** Monitor 終端機正在運行, **When** 使用者關閉終端機視窗, **Then** mpremote 程序被終止，COM 埠被釋放

---

### Edge Cases

- 當 CyberBrick 在監控過程中被拔除時，終端機顯示「裝置已斷線」訊息並結束監控
- 當 mpremote 工具未安裝時，系統應提示「正在安裝必要工具」並自動完成安裝
- 當多個 CyberBrick 同時連接時，系統連接第一個偵測到的裝置

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST 提供專屬的 Monitor 終端機，顯示裝置的 stdout/stderr 輸出
- **FR-002**: System MUST 透過 mpremote 工具串流裝置輸出
- **FR-003**: System MUST 自動偵測 CyberBrick 裝置 (VID: 303A, PID: 1001)
- **FR-004**: System MUST 在上傳程式前自動關閉 Monitor 並釋放 COM 埠
- **FR-005**: System MUST 複用現有的 mpremote 安裝檢查邏輯
- **FR-006**: WebView MUST 根據目前板子類型 (CyberBrick vs Arduino) 顯示或隱藏 Monitor 按鈕
- **FR-007**: System MUST 支援 15 種語言的 UI 文字翻譯

### Key Entities

- **SerialMonitorService**: 管理 Monitor 生命週期，提供 `start()` / `stop()` API，處理埠偵測與 mpremote subprocess
- **Monitor Button**: WebView 中的 SVG 圖示按鈕，僅 CyberBrick 時可見

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者可在上傳程式後 3 秒內開始看到 `print()` 輸出
- **SC-002**: Monitor 終端機在裝置斷線時 2 秒內顯示斷線訊息
- **SC-003**: 從點擊 Monitor 按鈕到終端機開啟不超過 2 秒
- **SC-004**: 上傳過程中的埠衝突自動處理，使用者無需手動操作
- **SC-005**: 100% 的 i18n 鍵完成 15 語言翻譯

## Clarifications

### Session 2026-01-25

- Q: FR-006 提到區分 stdout/stderr 顏色，但 mpremote repl 合併所有輸出，如何處理? → A: 只顯示原始輸出，不區分顏色（移除 FR-006）

## Assumptions

- 使用者已安裝 PlatformIO 擴充套件（mpremote 透過 PlatformIO 的 Python 環境執行）
- CyberBrick 使用標準 USB CDC 介面，可被 mpremote 正確識別
- 目標為唯讀監控，不支援使用者輸入（REPL 模式為未來擴展）

## Out of Scope

- 使用者輸入功能（REPL 互動模式）
- 自動重連機制（裝置斷線後自動嘗試重連）
- 波特率切換選項（使用 mpremote 預設值）
- Arduino 板的 Serial Monitor（使用 PlatformIO 內建功能）
