# Tasks: 統一 Arduino C++ 與 MicroPython 上傳 UI

**Input**: Design documents from `/specs/026-unified-upload-ui/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/webview-message-protocol.md ✓

**Tests**: 本功能使用手動測試（WebView 互動），單元測試限於 ArduinoUploader 服務。

**Organization**: 任務依 User Story 分組，每個 Story 可獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無依賴）
-   **[Story]**: 所屬 User Story (e.g., US1, US2, US3)
-   描述包含精確檔案路徑

## Path Conventions

-   **Extension Host**: `src/` at repository root
-   **WebView**: `media/` at repository root
-   **i18n**: `media/locales/*/messages.js`
-   **Tests**: `src/test/`

---

## Phase 1: Setup (共享基礎架構)

**Purpose**: 專案準備與類型定義

-   [ ] T001 新增 Arduino 上傳類型定義於 src/types/arduino.ts（包含 ArduinoUploadStage、UploadProgress、UploadResult、UploadRequest 介面）
-   [ ] T002 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/en/messages.js（英文為主語言）

---

## Phase 2: Foundational (阻塞性前置任務)

**Purpose**: 所有 User Story 共用的核心服務

**⚠️ CRITICAL**: 在此階段完成前，不可開始任何 User Story

-   [ ] T003 實作 ArduinoUploader 服務骨架於 src/services/arduinoUploader.ts（含建構子、getPioPath、checkPioInstalled 方法）
-   [ ] T004 [P] 實作 PlatformIO CLI 裝置偵測功能於 src/services/arduinoUploader.ts 的 detectDevices 方法
-   [ ] T005 實作 ArduinoUploader.upload() 主流程於 src/services/arduinoUploader.ts（整合所有階段）
-   [ ] T006 [P] 單元測試 ArduinoUploader 基礎功能於 src/test/services/arduinoUploader.test.ts

**Checkpoint**: ArduinoUploader 核心服務就緒 - 可開始 User Story 實作

---

## Phase 3: User Story 1 - Arduino 板子已連接完整上傳 (Priority: P1) 🎯 MVP

**Goal**: 使用者可透過上傳按鈕將 Arduino 程式碼編譯並上傳到已連接的板子

**Independent Test**: 連接 ESP32/Arduino 板子，選擇該板子，點擊上傳按鈕，觀察 Toast 訊息流程並確認程式成功燒錄

### Implementation for User Story 1

-   [ ] T007 [US1] 擴展 messageHandler.ts 的 handleRequestUpload 方法以支援 Arduino 板子路由邏輯於 src/webview/messageHandler.ts
-   [ ] T008 [US1] 實作 Arduino 上傳流程中的 syncSettings 整合於 src/services/arduinoUploader.ts（呼叫 settingsManager.syncPlatformIOSettings）
-   [ ] T009 [US1] 實作 Arduino 上傳流程中的 compile 與 uploadToDevice 方法於 src/services/arduinoUploader.ts
-   [ ] T010 [US1] 實作進度回報機制，透過 panel.webview.postMessage 發送 uploadProgress 訊息於 src/webview/messageHandler.ts
-   [ ] T011 [US1] 實作結果回報機制，透過 panel.webview.postMessage 發送 uploadResult 訊息於 src/webview/messageHandler.ts

**Checkpoint**: Arduino 完整上傳流程（有板子）應可獨立運作

---

## Phase 4: User Story 2 - Arduino 無板子連接僅編譯驗證 (Priority: P1)

**Goal**: 使用者未連接硬體時，點擊上傳按鈕系統自動切換為「僅編譯」模式

**Independent Test**: 不連接任何板子，選擇 Arduino Uno，點擊上傳按鈕，觀察 Toast 最終顯示「編譯成功」

### Implementation for User Story 2

-   [ ] T012 [US2] 修改 ArduinoUploader.upload() 根據 detectDevices 結果分支為「編譯+上傳」或「僅編譯」模式於 src/services/arduinoUploader.ts
-   [ ] T013 [US2] 確保 uploadResult 訊息包含 mode: 'compile-only' 欄位於 src/services/arduinoUploader.ts

**Checkpoint**: Arduino 僅編譯模式應可獨立運作

---

## Phase 5: User Story 3 - MicroPython CyberBrick 上傳維持原有行為 (Priority: P2)

**Goal**: CyberBrick 板子的上傳流程維持現有行為不變

**Independent Test**: 連接 CyberBrick，切換到該板子，點擊上傳按鈕，確認上傳流程與先前版本一致

### Implementation for User Story 3

-   [ ] T014 [US3] 在 messageHandler.ts 確保 board === 'cyberbrick' 時仍使用現有 MicropythonUploader 於 src/webview/messageHandler.ts
-   [ ] T015 [US3] 驗證 MicroPython 上傳進度訊息格式向後相容於 src/webview/messageHandler.ts

**Checkpoint**: CyberBrick 上傳流程應維持原有行為

---

## Phase 6: User Story 4 - 上傳按鈕在所有板子顯示 (Priority: P2)

**Goal**: 所有板子類型都顯示上傳按鈕，Tooltip 根據板子類型動態更新

**Independent Test**: 依序切換不同板子，觀察上傳按鈕始終可見且 Tooltip 正確反映當前模式

### Implementation for User Story 4

-   [ ] T016 [US4] 修改 updateUIForBoard 函式移除 uploadContainer 隱藏條件於 media/js/blocklyEdit.js
-   [ ] T017 [US4] 新增動態 Tooltip 更新邏輯：Arduino→「編譯並上傳」、CyberBrick→「上傳至 CyberBrick」於 media/js/blocklyEdit.js
-   [ ] T018 [US4] 修改 handleUploadClick 函式支援 Arduino 板子的上傳請求格式（含 lib_deps, build_flags）於 media/js/blocklyEdit.js
-   [ ] T019 [P] [US4] 新增 window.currentProgrammingLanguage 變數追蹤當前程式語言類型於 media/js/blocklyEdit.js

**Checkpoint**: 上傳按鈕應在所有板子顯示且 Tooltip 正確

---

## Phase 7: User Story 5 - 編譯/上傳錯誤友善提示 (Priority: P3)

**Goal**: 編譯或上傳失敗時顯示易懂的錯誤訊息

**Independent Test**: 故意製造編譯錯誤，觀察錯誤訊息是否清晰

### Implementation for User Story 5

-   [ ] T020 [US5] 實作 parseCompileError 函式解析 PlatformIO CLI 錯誤輸出於 src/services/arduinoUploader.ts
-   [ ] T021 [US5] 實作錯誤分類與對應 i18n 鍵名映射（PIO_NOT_FOUND、COMPILE_ERROR、UPLOAD_ERROR 等）於 src/services/arduinoUploader.ts
-   [ ] T022 [US5] 修改 handleUploadResult 函式根據 error.stage 顯示對應本地化錯誤訊息於 media/js/blocklyEdit.js
-   [ ] T023 [P] [US5] 新增 getLocalizedUploadError 輔助函式於 media/js/blocklyEdit.js

**Checkpoint**: 錯誤訊息應清晰易懂

---

## Phase 8: i18n 國際化支援

**Purpose**: 15 種語系的上傳訊息翻譯

-   [ ] T024 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/zh-hant/messages.js
-   [ ] T025 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/ja/messages.js
-   [ ] T026 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/ko/messages.js
-   [ ] T027 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/de/messages.js
-   [ ] T028 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/fr/messages.js
-   [ ] T029 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/es/messages.js
-   [ ] T030 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/it/messages.js
-   [ ] T031 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/pt-br/messages.js
-   [ ] T032 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/ru/messages.js
-   [ ] T033 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/pl/messages.js
-   [ ] T034 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/hu/messages.js
-   [ ] T035 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/tr/messages.js
-   [ ] T036 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/bg/messages.js
-   [ ] T037 [P] 新增 Arduino 上傳 i18n 鍵名於 media/locales/cs/messages.js
-   [ ] T038 執行 npm run validate:i18n 驗證所有語系翻譯完整性

---

## Phase 9: WebView 訊息處理

**Purpose**: WebView 端的進度與結果訊息處理

-   [ ] T039 修改 handleUploadProgress 函式支援 Arduino 階段訊息對應於 media/js/blocklyEdit.js
-   [ ] T040 修改 handleUploadResult 函式區分「編譯成功」與「上傳成功」訊息於 media/js/blocklyEdit.js
-   [ ] T041 新增 Arduino 階段訊息的 i18n 鍵名查詢映射表於 media/js/blocklyEdit.js

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: 最終驗證與文件

-   [ ] T042 執行 quickstart.md 驗證清單，確認所有功能性測試通過
-   [ ] T043 [P] 更新 CHANGELOG.md 記錄新增功能
-   [ ] T044 [P] 程式碼清理：移除 console.log，確保使用 log() 服務
-   [ ] T045 執行完整 i18n 審核 npm run audit:i18n:all

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Phase 1 - **阻塞所有 User Story**
-   **User Stories (Phase 3-7)**: 依賴 Phase 2 完成
    -   US1 (P1) 與 US2 (P1) 優先實作
    -   US3-US5 可依優先順序或平行進行
-   **i18n (Phase 8)**: 可與 User Story 平行進行（僅依賴 Phase 1 T002）
-   **WebView 訊息處理 (Phase 9)**: 依賴 Phase 6 (US4) 完成
-   **Polish (Phase 10)**: 依賴所有前置階段

### User Story Dependencies

| User Story             | 依賴    | 說明                        |
| ---------------------- | ------- | --------------------------- |
| US1 (Arduino 完整上傳) | Phase 2 | 核心功能，最高優先          |
| US2 (Arduino 僅編譯)   | US1     | 建立在 US1 基礎上的分支邏輯 |
| US3 (CyberBrick 維持)  | Phase 2 | 獨立驗證，無需其他 Story    |
| US4 (按鈕顯示)         | Phase 2 | 獨立 UI 任務                |
| US5 (錯誤提示)         | US1     | 建立在上傳流程基礎上        |

### Parallel Opportunities

-   Phase 1 所有任務 T001-T002 可平行
-   Phase 2 中 T003 完成後，T004, T006 可平行
-   Phase 8 所有 i18n 任務 T024-T037 可平行
-   US4 中 T016-T019 可依序但與其他 Story 平行

---

## Parallel Example: i18n Tasks

```bash
# 可同時啟動所有 i18n 翻譯任務：
Task: T024 "新增 Arduino 上傳 i18n 鍵名於 media/locales/zh-hant/messages.js"
Task: T025 "新增 Arduino 上傳 i18n 鍵名於 media/locales/ja/messages.js"
Task: T026 "新增 Arduino 上傳 i18n 鍵名於 media/locales/ko/messages.js"
# ... 其餘 11 個語系
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (**CRITICAL**)
3. 完成 Phase 3: User Story 1 (Arduino 完整上傳)
4. 完成 Phase 4: User Story 2 (Arduino 僅編譯)
5. **STOP and VALIDATE**: 測試 Arduino 上傳功能
6. 可部署/展示 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎服務就緒
2. US1 + US2 → Arduino 上傳功能可用 (MVP!)
3. US3 → 確保 CyberBrick 不受影響
4. US4 → UI 統一體驗
5. US5 → 錯誤處理優化
6. i18n → 國際化支援
7. Polish → 最終驗證

---

## Notes

-   [P] 任務 = 不同檔案、無依賴
-   [Story] 標籤將任務映射到特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成與測試
-   每完成一個任務或邏輯群組後 commit
-   在任何 Checkpoint 停下來驗證 Story 獨立功能
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 依賴

---

## i18n Keys Reference

需新增到所有 15 個語系的 i18n 鍵名：

```javascript
// 按鈕
UPLOAD_BUTTON_TITLE_ARDUINO: '編譯並上傳',

// 階段訊息
ARDUINO_STAGE_SYNCING: '同步設定',
ARDUINO_STAGE_SAVING: '儲存工作區',
ARDUINO_STAGE_CHECKING: '檢查編譯工具',
ARDUINO_STAGE_DETECTING: '偵測開發板',
ARDUINO_STAGE_COMPILING: '編譯中',
ARDUINO_STAGE_UPLOADING: '上傳中',

// 結果訊息
ARDUINO_COMPILE_SUCCESS: '編譯成功',
ARDUINO_UPLOAD_SUCCESS: '上傳成功',

// 錯誤訊息
ERROR_ARDUINO_PIO_NOT_FOUND: '找不到 PlatformIO CLI，請先安裝 PlatformIO',
ERROR_ARDUINO_COMPILE_FAILED: '編譯失敗',
ERROR_ARDUINO_UPLOAD_FAILED: '上傳失敗',
ERROR_ARDUINO_NO_WORKSPACE: '請先開啟專案資料夾',
ERROR_ARDUINO_TIMEOUT: '操作逾時',
```

---

## File Summary

| 檔案                                      | 操作 | 相關任務                                   |
| ----------------------------------------- | ---- | ------------------------------------------ |
| src/types/arduino.ts                      | 新增 | T001                                       |
| src/services/arduinoUploader.ts           | 新增 | T003-T005, T008-T009, T012-T013, T020-T021 |
| src/webview/messageHandler.ts             | 修改 | T007, T010-T011, T014-T015                 |
| src/test/services/arduinoUploader.test.ts | 新增 | T006                                       |
| media/js/blocklyEdit.js                   | 修改 | T016-T019, T022-T023, T039-T041            |
| media/locales/en/messages.js              | 修改 | T002                                       |
| media/locales/zh-hant/messages.js         | 修改 | T024                                       |
| media/locales/{其他 13 語系}/messages.js  | 修改 | T025-T037                                  |
