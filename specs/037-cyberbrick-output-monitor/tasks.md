```markdown
# Tasks: CyberBrick Output Monitor

**Input**: Design documents from `/specs/037-cyberbrick-output-monitor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/webview-messages.md ✅, quickstart.md ✅

**Tests**: 包含測試任務（基於 plan.md 的 Constitution Check 強調全面測試覆蓋）

**Organization**: 任務依 User Story 分組，支援獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案，無依賴）
- **[Story]**: 所屬 User Story (US1-US5)
- 描述包含確切檔案路徑

---

## Phase 1: Setup (共用基礎架構)

**Purpose**: 專案初始化與基本結構

- [x] T001 建立 SerialMonitorService 骨架檔案 src/services/serialMonitorService.ts
- [x] T002 [P] 在 src/types/arduino.ts 新增 Monitor 相關型別定義 (MonitorError, MonitorErrorCode, MonitorStartResult, SerialMonitorState)
- [x] T003 [P] 在 media/locales/zh-hant/messages.js 新增 8 個 Monitor i18n 鍵

---

## Phase 2: Foundational (阻塞前置條件)

**Purpose**: 所有 User Story 共用的核心基礎設施

**⚠️ 重要**: 此階段完成前無法開始任何 User Story

- [x] T004 在 src/services/serialMonitorService.ts 實作 SerialMonitorService 類別骨架 (constructor, dispose)
- [x] T005 [P] 在 src/webview/messageHandler.ts 新增 serialMonitorService 成員變數與初始化
- [x] T006 [P] 在 src/webview/messageHandler.ts 的 switch-case 新增 startMonitor/stopMonitor 處理分支
- [x] T007 在 media/js/blocklyEdit.js 新增 monitorBtn 變數與基本訊息監聽架構

**Checkpoint**: 基礎架構就緒，可開始 User Story 實作

---

## Phase 3: User Story 1 - 查看感測器輸出 (Priority: P1) 🎯 MVP

**Goal**: 使用者可透過 Monitor 即時查看 CyberBrick 的 `print()` 輸出

**Independent Test**: 上傳 `print("Hello")` 程式後，點擊 Monitor 按鈕，確認終端機顯示 "Hello"

### Tests for User Story 1

- [ ] T008 [P] [US1] 建立 SerialMonitorService 單元測試骨架 src/test/suite/serialMonitorService.test.ts
- [ ] T009 [P] [US1] 測試 start() 方法成功啟動並回傳正確 port

### Implementation for User Story 1

- [x] T010 [US1] 在 SerialMonitorService 實作 start() 方法核心邏輯 src/services/serialMonitorService.ts
- [x] T011 [US1] 在 start() 中整合 VSCode Terminal API 建立終端機並執行 mpremote 命令
- [x] T012 [US1] 在 messageHandler.ts 實作 handleStartMonitor() 處理 WebView 訊息
- [x] T013 [US1] 在 media/js/blocklyEdit.js 實作 toggleMonitor() 發送 startMonitor 訊息
- [x] T014 [US1] 在 media/js/blocklyEdit.js 處理 monitorStarted 訊息更新 UI 狀態
- [x] T015 [US1] 在 media/js/blocklyEdit.js 處理 monitorError 訊息顯示錯誤 Toast

**Checkpoint**: User Story 1 完成，可獨立測試 Monitor 基本功能

---

## Phase 4: User Story 2 - 自動埠偵測 (Priority: P1)

**Goal**: 系統自動偵測已連接的 CyberBrick 裝置，使用者無需手動選擇 COM 埠

**Independent Test**: 插入 CyberBrick 後點擊 Monitor，確認自動連接正確埠

### Tests for User Story 2

- [ ] T016 [P] [US2] 測試 start() 在偵測到裝置時回傳正確 port 資訊
- [ ] T017 [P] [US2] 測試 start() 在無裝置時回傳 DEVICE_NOT_FOUND 錯誤

### Implementation for User Story 2

- [x] T018 [US2] 在 SerialMonitorService 複用 MicropythonUploader.listPorts() 偵測 CyberBrick
- [x] T019 [US2] 在 start() 中加入 mpremote 安裝檢查（複用 checkMpremoteInstalled）
- [x] T020 [US2] 若 mpremote 未安裝，自動呼叫 installMpremote() 安裝
- [x] T021 [US2] 在 media/js/blocklyEdit.js 處理 DEVICE_NOT_FOUND 錯誤，顯示友善訊息

**Checkpoint**: User Story 2 完成，自動埠偵測功能可獨立驗證

---

## Phase 5: User Story 3 - 上傳與監控的埠衝突處理 (Priority: P2)

**Goal**: 上傳程式前自動關閉 Monitor 釋放 COM 埠，避免衝突

**Independent Test**: 在 Monitor 開啟狀態下點擊上傳，確認上傳成功且不需手動關閉

### Tests for User Story 3

- [ ] T022 [P] [US3] 測試 stopForUpload() 正確關閉終端機並等待 500ms
- [ ] T023 [P] [US3] 測試 isRunning() 在 stopForUpload() 後回傳 false

### Implementation for User Story 3

- [x] T024 [US3] 在 SerialMonitorService 實作 stopForUpload() 方法 src/services/serialMonitorService.ts
- [x] T025 [US3] 在 handleRequestUpload() 中呼叫 stopForUpload() 釋放埠
- [x] T026 [US3] 在 media/js/blocklyEdit.js 處理 monitorStopped with reason='upload_started'，顯示提示訊息
- [x] T027 [US3] 上傳完成後傳送 uploadComplete 訊息通知可重新開啟 Monitor

**Checkpoint**: User Story 3 完成，埠衝突處理可獨立驗證

---

## Phase 6: User Story 4 - 僅 CyberBrick 顯示 Monitor 按鈕 (Priority: P2)

**Goal**: Monitor 按鈕僅在選擇 CyberBrick 板時顯示，Arduino 板不顯示

**Independent Test**: 切換不同板子，確認按鈕顯示/隱藏行為正確

### Tests for User Story 4

- [ ] T028 [US4] 手動測試案例：選擇 CyberBrick 確認按鈕顯示，選擇 Arduino 確認隱藏

### Implementation for User Story 4

- [x] T029 [P] [US4] 在 media/html/blocklyEdit.html 新增 Monitor 按鈕 HTML 結構
- [x] T030 [P] [US4] 在 media/css/blocklyEdit.css 新增 Monitor 按鈕樣式（含 active 狀態）
- [x] T031 [US4] 在 media/js/blocklyEdit.js 實作 updateMonitorButtonVisibility()
- [x] T032 [US4] 在板子切換事件中呼叫 updateMonitorButtonVisibility()

**Checkpoint**: User Story 4 完成，條件顯示功能可獨立驗證

---

## Phase 7: User Story 5 - 關閉 Monitor (Priority: P3)

**Goal**: 使用者可手動關閉 Monitor 終端機，釋放 COM 埠

**Independent Test**: 開啟 Monitor 後關閉終端機視窗，確認程序正確清理

### Tests for User Story 5

- [ ] T033 [P] [US5] 測試 stop() 正確執行 terminal.dispose() 並清理狀態
- [ ] T034 [P] [US5] 測試 onDidCloseTerminal 事件觸發 onStopped callback

### Implementation for User Story 5

- [x] T035 [US5] 在 SerialMonitorService 實作 stop() 方法
- [x] T036 [US5] 在 constructor 中註冊 onDidCloseTerminal 事件監聽
- [x] T037 [US5] 實作 handleTerminalClosed() 處理使用者手動關閉
- [x] T038 [US5] 在 messageHandler.ts 實作 handleStopMonitor() 處理 WebView 訊息
- [x] T039 [US5] 在 media/js/blocklyEdit.js 處理 monitorStopped 訊息還原按鈕狀態

**Checkpoint**: User Story 5 完成，關閉功能可獨立驗證

---

## Phase 7.5: Edge Case - 裝置斷線處理 (Priority: P2)

**Goal**: 當 CyberBrick 在監控過程中被拔除時，終端機顯示「裝置已斷線」訊息並結束監控

**Independent Test**: 在 Monitor 運行時拔除 USB 線，確認 2 秒內顯示斷線訊息

### Tests for Edge Case

- [ ] T039.1 [P] [EC] 測試 mpremote 程序結束時觸發 onDidCloseTerminal 事件
- [ ] T039.2 [P] [EC] 測試 monitorStopped with reason='device_disconnected' 正確傳送

### Implementation for Edge Case

- [x] T039.3 [EC] 在 handleTerminalClosed() 中偵測非預期關閉（裝置斷線情境）
- [x] T039.4 [EC] 傳送 monitorStopped with reason='device_disconnected' 給 WebView
- [x] T039.5 [EC] 在 media/js/blocklyEdit.js 處理 reason='device_disconnected' 顯示斷線訊息
- [x] T039.6 [EC] 在 media/locales/zh-hant/messages.js 新增 MONITOR_DEVICE_DISCONNECTED 翻譯鍵

**Checkpoint**: Edge Case 完成，裝置斷線處理可獨立驗證

---

## Phase 8: i18n 15 語言翻譯

**Purpose**: 完成所有 15 種語言的 Monitor UI 文字翻譯

- [x] T040 [P] 在 media/locales/en/messages.js 新增 Monitor i18n 鍵 (英文)
- [x] T041 [P] 在 media/locales/ja/messages.js 新增 Monitor i18n 鍵 (日文)
- [x] T042 [P] 在 media/locales/ko/messages.js 新增 Monitor i18n 鍵 (韓文)
- [x] T043 [P] 在 media/locales/de/messages.js 新增 Monitor i18n 鍵 (德文)
- [x] T044 [P] 在 media/locales/fr/messages.js 新增 Monitor i18n 鍵 (法文)
- [x] T045 [P] 在 media/locales/es/messages.js 新增 Monitor i18n 鍵 (西班牙文)
- [x] T046 [P] 在 media/locales/pt-br/messages.js 新增 Monitor i18n 鍵 (巴西葡萄牙文)
- [x] T047 [P] 在 media/locales/it/messages.js 新增 Monitor i18n 鍵 (義大利文)
- [x] T048 [P] 在 media/locales/ru/messages.js 新增 Monitor i18n 鍵 (俄文)
- [x] T049 [P] 在 media/locales/pl/messages.js 新增 Monitor i18n 鍵 (波蘭文)
- [x] T050 [P] 在 media/locales/hu/messages.js 新增 Monitor i18n 鍵 (匈牙利文)
- [x] T051 [P] 在 media/locales/tr/messages.js 新增 Monitor i18n 鍵 (土耳其文)
- [x] T052 [P] 在 media/locales/bg/messages.js 新增 Monitor i18n 鍵 (保加利亞文)
- [x] T053 [P] 在 media/locales/cs/messages.js 新增 Monitor i18n 鍵 (捷克文)

**Checkpoint**: 執行 `npm run validate:i18n` 確認所有翻譯通過驗證

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 跨 User Story 的改進與整合驗證

- [ ] T054 建立整合測試 src/test/integration/serialMonitor.test.ts (延後)
- [x] T055 [P] 在 SerialMonitorService 新增完整 JSDoc 文件註解
- [x] T056 [P] 在 messageHandler.ts 新增 Monitor 相關方法的 JSDoc 文件
- [x] T057 執行 quickstart.md 驗證步驟（5 項）確認完整功能
- [x] T058 更新 CHANGELOG.md 記錄新功能
- [x] T059 執行 npm run lint 確認程式碼品質
- [x] T060 執行 npm run test 確認所有測試通過 (418 passing)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴，可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成，**阻塞所有 User Stories**
- **User Stories (Phase 3-7)**: 全部依賴 Foundational 完成
    - US1 與 US2 可平行進行（皆為 P1 優先級）
    - US3 與 US4 可平行進行（皆為 P2 優先級）
    - US5 可獨立進行（P3 優先級）
- **Edge Case (Phase 7.5)**: 依賴 US5 完成（複用 handleTerminalClosed）
- **i18n (Phase 8)**: 依賴 US4 的 UI 元素定義完成
- **Polish (Phase 9)**: 依賴所有 User Stories 和 Edge Case 完成

### User Story Dependencies

| Story | 優先級 | 前置條件             | 可與以下平行進行 |
| ----- | ------ | -------------------- | ---------------- |
| US1   | P1     | Phase 2 完成         | US2              |
| US2   | P1     | Phase 2 完成         | US1              |
| US3   | P2     | US1 完成（需 start） | US4              |
| US4   | P2     | Phase 2 完成         | US3              |
| US5   | P3     | US1 完成（需 start） | 無               |
| EC    | P2     | US5 完成             | 無               |

### Within Each User Story

1. Tests 應先撰寫並驗證失敗
2. Implementation 依檔案依賴順序
3. 標示 [P] 的任務可平行執行

### Parallel Opportunities
```

Phase 1 (Setup):
T001 → T002, T003 可平行

Phase 2 (Foundational):
T004 → T005, T006 可平行 → T007

Phase 3-4 (US1 + US2) 可同時進行:
US1: T008, T009 → T010 → T011 → T012 → T013 → T014 → T015
US2: T016, T017 → T018 → T019 → T020 → T021

Phase 5-6 (US3 + US4) 可同時進行:
US3: T022, T023 → T024 → T025 → T026 → T027
US4: T028 → T029, T030 → T031 → T032

Phase 7 (US5):
T033, T034 → T035 → T036 → T037 → T038 → T039

Phase 7.5 (Edge Case):
T039.1, T039.2 可平行 → T039.3 → T039.4 → T039.5 → T039.6

Phase 8 (i18n):
T040-T053 全部可平行

Phase 9 (Polish):
T054, T055, T056 可平行 → T057 → T058 → T059 → T060

````

---

## Parallel Example: Phase 8 i18n

```bash
# 所有 i18n 翻譯任務可同時進行：
T040: media/locales/en/messages.js
T041: media/locales/ja/messages.js
T042: media/locales/ko/messages.js
T043: media/locales/de/messages.js
T044: media/locales/fr/messages.js
T045: media/locales/es/messages.js
T046: media/locales/pt-br/messages.js
T047: media/locales/it/messages.js
T048: media/locales/ru/messages.js
T049: media/locales/pl/messages.js
T050: media/locales/hu/messages.js
T051: media/locales/tr/messages.js
T052: media/locales/bg/messages.js
T053: media/locales/cs/messages.js
````

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（關鍵阻塞點）
3. 完成 Phase 3: User Story 1
4. **暫停驗證**: 執行獨立測試確認 Monitor 基本功能
5. 可發布 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎架構就緒
2. 新增 US1 + US2 → 核心功能可用 → **MVP 發布點**
3. 新增 US3 + US4 → 使用體驗優化
4. 新增 US5 → 完整功能
5. 完成 i18n + Polish → 正式發布

### Suggested MVP Scope

- **最小可用產品**: Phase 1 + Phase 2 + Phase 3 (US1)
    - 使用者可開啟 Monitor 查看輸出
    - 15 個任務 (T001-T015)
    - 預估工時：約 3-4 小時

---

## Notes

- 複用現有 `MicropythonUploader` 邏輯，避免重複實作
- WebView 訊息遵循 `contracts/webview-messages.md` 規格
- 測試需 mock VSCode Terminal API（參考 src/test/helpers/mocks.ts）
- 所有 i18n 鍵需 15 語言完整翻譯（參考 data-model.md 定義）
- 驗收：執行 quickstart.md 的 5 項驗證步驟

```

```
