# Feature Specification: 統一 Arduino C++ 與 MicroPython 上傳 UI

**Feature Branch**: `026-unified-upload-ui`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "統一 Arduino C++ 與 MicroPython 上傳 UI - 將 Arduino C++ 的編譯/上傳流程整合到現有的 MicroPython 上傳 UI 框架中。Arduino 模式透過 PlatformIO CLI 執行：有偵測到板子時完整上傳，無板子時僅編譯驗證語法。保持一致的上傳按鈕圖示，透過 Toast 文字區分編譯/上傳階段。"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Arduino 板子已連接完整上傳 (Priority: P1)

使用者選擇 Arduino 相容板子（如 Uno、ESP32、Mega），連接板子到電腦，拖拉積木完成程式設計後，點擊上傳按鈕。系統自動偵測到連接的板子，依序顯示「同步設定」→「編譯中」→「上傳中」等階段訊息，最終顯示「上傳成功」。

**Why this priority**: 這是 Arduino 使用者最核心的需求，讓他們無需離開 Singular Blockly 就能完成從設計到燒錄的完整流程。

**Independent Test**: 可透過連接任一 Arduino 板子，點擊上傳按鈕，觀察 Toast 訊息流程並確認程式成功燒錄到板子上。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 ESP32 板子且已透過 USB 連接, **When** 點擊上傳按鈕, **Then** 系統依序顯示「同步設定」→「編譯中」→「上傳中」→「上傳成功」Toast 訊息
2. **Given** 上傳過程中, **When** 編譯階段完成進入上傳階段, **Then** Toast 訊息更新為「上傳中...」且按鈕維持旋轉動畫狀態
3. **Given** 上傳成功後, **When** 查看板子, **Then** 板子執行剛上傳的程式

---

### User Story 2 - Arduino 無板子連接僅編譯驗證 (Priority: P1)

使用者選擇 Arduino 相容板子但未連接硬體，點擊上傳按鈕。系統偵測不到板子，自動切換為「僅編譯」模式，顯示「編譯中」階段訊息，最終顯示「編譯成功」（而非「上傳成功」），讓使用者知道程式碼語法正確。

**Why this priority**: 允許使用者在沒有硬體的情況下驗證程式碼正確性，這對教學場景和遠端開發至關重要。

**Independent Test**: 可透過不連接任何板子，選擇 Arduino Uno，點擊上傳按鈕，觀察 Toast 訊息最終顯示「編譯成功」。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 Arduino Uno 但未連接板子, **When** 點擊上傳按鈕, **Then** 系統顯示「編譯中」→「編譯成功」Toast 訊息（不顯示上傳階段）
2. **Given** 編譯成功後, **When** 查看 Toast 訊息, **Then** 訊息明確為「編譯成功」而非「上傳成功」，讓使用者理解程式碼已驗證但未燒錄

---

### User Story 3 - MicroPython CyberBrick 上傳維持原有行為 (Priority: P2)

使用者選擇 CyberBrick 板子，現有的 MicroPython 上傳流程維持不變。上傳按鈕外觀與 Arduino 模式一致，點擊後依序顯示「準備中」→「檢查工具」→「連接裝置」→「上傳中」→「上傳成功」。

**Why this priority**: 確保現有 MicroPython 使用者體驗不受影響，維持向後相容性。

**Independent Test**: 可透過連接 CyberBrick，切換到該板子，點擊上傳按鈕，確認上傳流程與先前版本完全一致。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 CyberBrick 板子, **When** 點擊上傳按鈕, **Then** 系統執行現有 MicroPython 上傳流程，Toast 訊息與先前版本一致
2. **Given** 從 Arduino 板子切換到 CyberBrick, **When** 查看上傳按鈕, **Then** 按鈕圖示維持相同，僅 Tooltip 文字更新

---

### User Story 4 - 上傳按鈕在所有板子顯示 (Priority: P2)

不論使用者選擇哪種板子（Arduino Uno、ESP32、Mega、CyberBrick 等），上傳按鈕都會顯示在工具列上。按鈕圖示統一，Tooltip 根據板子類型動態更新（Arduino: 「編譯並上傳」、MicroPython: 「上傳至 CyberBrick」）。

**Why this priority**: 提供一致的使用者介面，降低學習曲線。

**Independent Test**: 可透過依序切換不同板子，觀察上傳按鈕始終可見且 Tooltip 正確反映當前模式。

**Acceptance Scenarios**:

1. **Given** 使用者切換到 Arduino Uno, **When** 查看工具列, **Then** 上傳按鈕顯示，Tooltip 為「編譯並上傳」
2. **Given** 使用者切換到 ESP32, **When** 查看工具列, **Then** 上傳按鈕顯示，Tooltip 為「編譯並上傳」
3. **Given** 使用者切換到 CyberBrick, **When** 查看工具列, **Then** 上傳按鈕顯示，Tooltip 為「上傳至 CyberBrick」

---

### User Story 5 - 編譯/上傳錯誤友善提示 (Priority: P3)

當編譯失敗或上傳失敗時，系統顯示易懂的錯誤訊息，幫助使用者理解問題並採取行動。

**Why this priority**: 改善錯誤處理體驗，減少使用者困惑。

**Independent Test**: 可透過故意製造編譯錯誤（如使用不支援的積木組合），觀察錯誤訊息是否清晰。

**Acceptance Scenarios**:

1. **Given** 程式碼有語法錯誤, **When** 點擊上傳按鈕, **Then** 系統顯示「編譯失敗」Toast 並提供錯誤摘要
2. **Given** 未安裝編譯工具, **When** 點擊上傳按鈕, **Then** 系統顯示「找不到編譯工具」Toast 並提供安裝指引
3. **Given** 上傳過程中板子斷線, **When** 上傳中斷, **Then** 系統顯示「上傳失敗：裝置連線中斷」Toast

---

### Edge Cases

-   當使用者在上傳過程中拔除 USB 連接？系統應偵測中斷並顯示「上傳失敗：裝置連線中斷」
-   當工作區是空的（無積木）時點擊上傳？系統應顯示「工作區是空的，請先新增積木」
-   當多次快速點擊上傳按鈕？系統應忽略重複點擊，按鈕在上傳中狀態時禁用
-   當編譯工具（PlatformIO CLI）未安裝？系統應顯示友善提示並指引使用者安裝
-   當板子選擇與實際連接板子不符？依賴 PlatformIO 的自動偵測，可能導致上傳失敗並顯示錯誤訊息
-   當板子選擇為「none」（無板子選擇）？系統應顯示 Toast 提示「請先選擇開發板」，不執行任何編譯或上傳操作

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統 MUST 在所有板子類型都顯示上傳按鈕（不限於 CyberBrick）
-   **FR-002**: 系統 MUST 根據當前板子語言類型（arduino/micropython）選擇對應的上傳服務
-   **FR-003**: Arduino 模式 MUST 在上傳前自動同步 platformio.ini 設定（lib_deps、build_flags）
-   **FR-004**: Arduino 模式 MUST 在上傳前自動儲存工作區以確保 main.cpp 與積木同步
-   **FR-005**: Arduino 模式 MUST 使用 PlatformIO CLI 絕對路徑執行編譯/上傳（無需虛擬環境）
-   **FR-006**: Arduino 模式 MUST 使用 PlatformIO 自動偵測功能識別連接的板子埠
-   **FR-007**: 當未偵測到 Arduino 板子時，系統 MUST 僅執行編譯驗證（不執行上傳）
-   **FR-008**: 系統 MUST 透過 Toast 訊息即時顯示當前階段（同步設定/編譯中/上傳中/完成）
-   **FR-009**: 系統 MUST 區分「編譯成功」與「上傳成功」的結果訊息
-   **FR-010**: 上傳按鈕的 Tooltip MUST 根據板子類型動態更新
-   **FR-011**: MicroPython（CyberBrick）上傳流程 MUST 維持現有行為不變
-   **FR-012**: 系統 MUST 支援 15 種語系的上傳相關訊息翻譯
-   **FR-013**: 當板子選擇為「none」時，點擊上傳按鈕 MUST 顯示 Toast 提示使用者先選擇開發板，不執行任何編譯或上傳操作

### Key Entities

-   **UploadStage（上傳階段）**: 定義上傳流程的各階段狀態，Arduino 與 MicroPython 各有專屬階段定義
-   **UploadProgress（上傳進度）**: 包含當前階段、進度百分比、訊息文字，用於 WebView 與 Extension 間通訊
-   **UploadResult（上傳結果）**: 包含成功/失敗狀態、時間戳記、錯誤訊息（如有），用於最終結果通知

## Success Criteria _(mandatory)_

### Measurable Outcomes

> **測試環境基準**: 以下時間指標基於中階開發環境（Intel i5 第 10 代或 Apple M1 或同等效能 CPU、8GB RAM、SSD 儲存裝置）測量。實際時間可能因硬體效能、專案複雜度、網路狀況（首次下載依賴時）有所差異。

-   **SC-001**: 使用者可在 30 秒內完成從點擊上傳按鈕到看到「編譯成功」訊息（無連接板子情境，簡單程式約 100 行 Arduino C++）
-   **SC-002**: 使用者可在 90 秒內完成從點擊上傳按鈕到看到「上傳成功」訊息（已連接板子情境，視程式複雜度而定）
-   **SC-003**: 100% 的 Arduino 相容板子（Uno、ESP32、Mega 等）都顯示上傳按鈕
-   **SC-004**: 切換板子時，上傳按鈕 Tooltip 在 500ms 內更新為正確文字
-   **SC-005**: 編譯/上傳錯誤時，使用者可從 Toast 訊息理解問題原因（不需查看終端機輸出）
-   **SC-006**: 現有 MicroPython（CyberBrick）使用者的上傳流程體驗不受影響

## Assumptions

-   使用者已安裝 PlatformIO IDE 擴充功能（或 PlatformIO Core CLI）
-   PlatformIO CLI 位於預設安裝位置（Windows: `%USERPROFILE%\.platformio\penv\Scripts\pio.exe`，macOS/Linux: `~/.platformio/penv/bin/pio`）
-   Arduino 板子的 USB 驅動程式已正確安裝
-   編譯/上傳時間會因程式複雜度和電腦效能而異
