````markdown
# Tasks: Arduino Serial Monitor 整合

**Input**: Design documents from `/specs/038-arduino-serial-monitor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 本功能包含單元測試任務（plan.md 明確要求）

**Organization**: 任務按 User Story 分組，支援獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案、無依賴）
- **[Story]**: 所屬 User Story（如 US1, US2, US3）
- 所有路徑為相對專案根目錄

---

## Phase 1: Setup (基礎設定)

**Purpose**: 專案結構確認與分支建立

- [ ] T001 確認功能分支 `038-arduino-serial-monitor` 已建立
- [ ] T002 確認 PlatformIO CLI 可用 (`pio --version`)

---

## Phase 2: Foundational (阻塞前置作業)

**Purpose**: 核心基礎設施，所有 User Story 都依賴此階段

**⚠️ CRITICAL**: 此階段完成前，無法開始任何 User Story

- [ ] T003 新增類型定義於 `src/types/arduino.ts`：
    - `ArduinoMonitorConfig` 介面
    - `MonitorStartResult` 介面
    - `MonitorError` 介面
    - `MonitorErrorCode` 類型
    - `MonitorStopReason` 類型
    - `ESP32_BOARDS` 常數陣列
    - `isEsp32Board()` 函式
- [ ] T004 [P] 建立 `ArduinoMonitorService` 骨架於 `src/services/arduinoMonitorService.ts`：
    - 實作 `IArduinoMonitorService` 介面
    - 加入類別成員：`terminal`, `isRunningFlag`, `currentPort`, `wasRunningBeforeUpload`, `onStoppedCallback`
    - 建構函式中註冊 `vscode.window.onDidCloseTerminal` 監聽
    - 實作 `dispose()` 方法
- [ ] T005 [P] 更新服務匯出於 `src/services/index.ts`：匯出 `ArduinoMonitorService`

**Checkpoint**: 基礎架構就緒，可開始 User Story 實作

---

## Phase 3: User Story 1+2 - 開啟/關閉 Serial Monitor (Priority: P1) 🎯 MVP

**Goal**: 用戶可透過 Monitor 按鈕開啟和關閉 Arduino Serial Monitor

**Independent Test**: 選擇 Arduino 開發板，點擊 Monitor 按鈕開啟終端機，再次點擊關閉

### Implementation for User Story 1+2

- [ ] T006 [US1] 實作 `start()` 方法於 `src/services/arduinoMonitorService.ts`：
    - 檢查 `isRunningFlag` 避免重複啟動
    - 建構 `pio device monitor` 命令
    - 使用 `vscode.window.createTerminal()` 建立終端機
    - 設定 `isRunningFlag = true`
    - 回傳 `MonitorStartResult`
- [ ] T007 [US2] 實作 `stop()` 方法於 `src/services/arduinoMonitorService.ts`：
    - 呼叫 `terminal.dispose()` 關閉終端機
    - 設定 `isRunningFlag = false`
    - 清空 `currentPort`
- [ ] T008 [US1] 實作 `handleTerminalClosed()` 方法於 `src/services/arduinoMonitorService.ts`：
    - 同步 `isRunningFlag` 狀態
    - 觸發 `onStoppedCallback` 回調
- [ ] T009 [US1] 實作 `isRunning()` 和 `getCurrentPort()` getter 於 `src/services/arduinoMonitorService.ts`
- [ ] T010 [US1] 實作 `onStopped()` 回調註冊於 `src/services/arduinoMonitorService.ts`
- [ ] T011 [US1] 更新 `messageHandler.ts` 加入 Arduino Monitor 路由：
    - 在 `WebViewMessageHandler` 類別加入 `arduinoMonitorService` 成員
    - 修改 `handleStartMonitor()` 依 `getBoardLanguage()` 路由
    - 修改 `handleStopMonitor()` 依板子語言路由
    - 發送 `monitorStarted` / `monitorStopped` / `monitorError` 訊息

**Checkpoint**: Monitor 可開啟/關閉，按鈕狀態同步正常

---

## Phase 4: User Story 3 - 上傳時自動管理 Monitor 狀態 (Priority: P1)

**Goal**: 上傳時自動關閉 Monitor，成功後自動恢復先前狀態

**Independent Test**: Monitor 開啟時點擊上傳，上傳成功後 Monitor 自動重啟

### Implementation for User Story 3

- [ ] T012 [US3] 實作 `stopForUpload()` 方法於 `src/services/arduinoMonitorService.ts`：
    - 記錄 `wasRunningBeforeUpload = isRunningFlag`
    - 若正在運行則呼叫 `stop()`
- [ ] T013 [US3] 實作 `restartAfterUpload()` 方法於 `src/services/arduinoMonitorService.ts`：
    - 檢查 `wasRunningBeforeUpload`
    - 若為 true 則呼叫 `start()`
    - 重置 `wasRunningBeforeUpload = false`
- [ ] T014 [US3] 修改 `ArduinoUploader.upload()` 於 `src/services/arduinoUploader.ts`：
    - 透過建構函式注入 `ArduinoMonitorService` 實例（與 SerialMonitorService 相同模式）
    - 上傳前呼叫 `arduinoMonitorService.stopForUpload()`
    - 上傳成功後呼叫 `arduinoMonitorService.restartAfterUpload(board, workspacePath)`
    - 上傳失敗時不重啟 Monitor

**Checkpoint**: 上傳流程與 Monitor 狀態整合完成

---

## Phase 5: User Story 4 - 自動偵測 Baud Rate (Priority: P2)

**Goal**: 從 platformio.ini 自動讀取 `monitor_speed` 設定

**Independent Test**: 設定 `monitor_speed = 9600`，開啟 Monitor 確認使用正確速率

### Implementation for User Story 4

- [ ] T015 [US4] 實作 `getBaudRate()` 私有方法於 `src/services/arduinoMonitorService.ts`：
    - 讀取 `platformio.ini` 檔案
    - 使用正則表達式解析 `monitor_speed = (\d+)`
    - 解析失敗時回傳預設值 115200
    - 加入 `log()` 記錄實際使用的 baud rate
- [ ] T016 [US4] 修改 `start()` 方法整合 `getBaudRate()`：
    - 呼叫 `getBaudRate(workspacePath)` 取得速率
    - 將 `--baud` 參數加入命令

**Checkpoint**: Baud Rate 自動偵測功能完成

---

## Phase 6: User Story 5 - ESP32 錯誤訊息自動解碼 (Priority: P2)

**Goal**: ESP32 系列開發板自動啟用 exception decoder

**Independent Test**: ESP32 程式崩潰時，Monitor 顯示可讀函式名稱

### Implementation for User Story 5

- [ ] T017 [US5] 修改 `start()` 方法加入 ESP32 判斷於 `src/services/arduinoMonitorService.ts`：
    - 使用 `isEsp32Board(board)` 判斷
    - 若為 ESP32 系列，加入 `--filter esp32_exception_decoder` 參數
    - 加入 `log()` 記錄是否啟用 decoder

**Checkpoint**: ESP32 exception decoder 功能完成

---

## Phase 7: User Story 6 - UI 與 MicroPython 終端機一致 (Priority: P2)

**Goal**: Monitor 按鈕對所有開發板顯示，外觀一致

**Independent Test**: 切換 Arduino/MicroPython 開發板，按鈕位置、圖示、樣式相同

### Implementation for User Story 6

- [ ] T018 [US6] 修改 `updateMonitorButtonVisibility()` 於 `media/js/blocklyEdit.js`：
    - 移除僅對 CyberBrick 顯示的限制
    - 對所有有效開發板顯示 Monitor 按鈕
    - 加入 `log.info()` 記錄按鈕可見性狀態
- [ ] T019 [P] [US6] 確認 Monitor 按鈕使用現有 i18n 鍵值：
    - 驗證 `MONITOR_OPEN` / `MONITOR_CLOSE` 等鍵值可複用
    - 執行 `npm run validate:i18n` 確認無缺失翻譯

**Checkpoint**: UI 一致性功能完成

---

## Phase 8: Testing & Polish

**Purpose**: 單元測試與最終驗證

- [ ] T020 [P] 建立測試檔案 `src/test/suite/arduinoMonitorService.test.ts`：
    - 測試 `start()` 方法建立終端機
    - 測試 `stop()` 方法關閉終端機並重置狀態
    - 測試 `stopForUpload()` 記錄先前狀態
    - 測試 `restartAfterUpload()` 條件性重啟
    - 測試 `getBaudRate()` 解析 platformio.ini
    - 測試 `isEsp32Board()` 判斷邏輯
- [ ] T021 [P] 測試 `messageHandler.ts` 路由邏輯：
    - 測試 Arduino 板子路由到 ArduinoMonitorService
    - 測試 MicroPython 板子路由到 SerialMonitorService
- [ ] T022 執行完整測試套件：`npm test`
- [ ] T023 執行 i18n 驗證：`npm run validate:i18n`
- [ ] T024 手動測試：依照 `quickstart.md` 驗證所有測試檢查項目
- [ ] T025 程式碼清理與重構（如有需要）

**Checkpoint**: 所有測試通過，功能驗證完成

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ──────────────────▶ BLOCKS ALL USER STORIES
    │
    ├─────────────────────────────────────────────────────┐
    ▼                                                     ▼
Phase 3 (US1+US2) ◄──────────────────────────────► Phase 7 (US6)
    │                                                     │
    ▼                                                     │
Phase 4 (US3)                                             │
    │                                                     │
    ├───────────────────────────┐                         │
    ▼                           ▼                         │
Phase 5 (US4)             Phase 6 (US5)                   │
    │                           │                         │
    └───────────────────────────┴─────────────────────────┘
                                │
                                ▼
                        Phase 8 (Testing)
```

### User Story Dependencies

| User Story | 依賴         | 可並行            |
| ---------- | ------------ | ----------------- |
| US1+US2    | Foundational | 可與 US6 並行     |
| US3        | US1+US2      | -                 |
| US4        | US1+US2      | 可與 US5 並行     |
| US5        | US1+US2      | 可與 US4 並行     |
| US6        | Foundational | 可與 US1+US2 並行 |

### Within Each Phase

- 類型定義優先於服務實作
- 服務實作優先於訊息處理器整合
- 核心功能優先於 WebView 修改
- 所有實作完成後再進行測試

### Parallel Opportunities

```bash
# Phase 2 可並行任務：
Task: T004 "建立 ArduinoMonitorService 骨架"
Task: T005 "更新服務匯出"

# Phase 7 可與 Phase 3 並行：
Task: T018 "修改 updateMonitorButtonVisibility()"
Task: T019 "確認 Monitor 按鈕使用現有 i18n 鍵值"

# Phase 8 可並行任務：
Task: T020 "建立 arduinoMonitorService.test.ts"
Task: T021 "測試 messageHandler.ts 路由邏輯"
```

---

## Implementation Strategy

### MVP First (User Story 1+2 Only)

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL)
3. ✅ Complete Phase 3: User Story 1+2 (開啟/關閉 Monitor)
4. **STOP and VALIDATE**: 手動測試開啟/關閉功能
5. Deploy/demo if ready - 用戶已可使用基本 Monitor 功能

### Incremental Delivery

1. Setup + Foundational → 基礎架構就緒
2. Add US1+US2 → 測試 → **MVP 可交付！**
3. Add US3 (上傳整合) → 測試 → 完整上傳體驗
4. Add US4+US5 (Baud Rate + ESP32) → 測試 → 進階功能
5. Add US6 (UI 一致性) → 測試 → 完美體驗
6. Testing & Polish → 品質驗證

### Parallel Execution Example

With single developer:

```
Day 1: T001-T005 (Setup + Foundational)
Day 2: T006-T011 (US1+US2) + T018-T019 (US6, 並行)
Day 3: T012-T014 (US3)
Day 4: T015-T017 (US4+US5, 並行)
Day 5: T020-T025 (Testing)
```

---

## Summary

| 項目         | 數量 |
| ------------ | ---- |
| 總任務數     | 25   |
| Phase 1 任務 | 2    |
| Phase 2 任務 | 3    |
| US1+US2 任務 | 6    |
| US3 任務     | 3    |
| US4 任務     | 2    |
| US5 任務     | 1    |
| US6 任務     | 2    |
| Testing 任務 | 6    |
| 可並行任務   | 9    |

---

## Notes

- [P] 標記 = 可與同 Phase 其他 [P] 任務並行
- [Story] 標記 = 對應 spec.md 中的 User Story
- 每完成一個 Phase 應進行驗證
- US1 與 US2 合併處理（開啟/關閉為不可分割的功能對）
- 所有修改完成後執行 `npm run lint` 確認程式碼品質
- 參考 `quickstart.md` 進行手動測試驗證
````
