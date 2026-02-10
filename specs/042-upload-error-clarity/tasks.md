# Tasks: 上傳錯誤分類與明確提示

**Input**: Design documents from `/specs/042-upload-error-clarity/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: spec.md 中提到測試覆蓋（Constitution Check VII），因此包含測試任務。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 確認現有程式碼結構，無需新增專案或模組

- [ ] T001 確認現有上傳流程並標記修改點，閱讀 src/services/arduinoUploader.ts 中 upload() 方法和 detectDevices() 方法。**Deliverable**: 註解標記 upload() 中插入 detecting 階段的行號範圍
- [ ] T002 [P] 確認現有 WebView 錯誤處理邏輯，閱讀 media/js/blocklyEdit.js 中 getLocalizedUploadError() 和 handleUploadResult()。**Deliverable**: 確認現有 errorKeyMap 中 detecting/uploading 階段的映射現況
- [ ] T003 [P] 確認現有 i18n key 結構，閱讀 media/locales/en/messages.js 中 ERROR*ARDUINO*\* 相關 key。**Deliverable**: 列出已存在的相關 key 和需新增的 key

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 共用型別定義和錯誤分類函式，所有 User Story 皆依賴此階段

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 修改 src/services/arduinoUploader.ts 中 detectDevices() 方法，使其能區分「偵測成功但無裝置」與「偵測指令本身失敗」：在 catch 區塊中設定回傳值新增 `commandFailed: true` 旗標（例如回傳 `{ hasDevice: false, devices: [], commandFailed: true }`），正常無裝置時 `commandFailed` 為 `false`。同步更新方法的回傳型別
- [ ] T005 在 src/services/arduinoUploader.ts 中新增 classifyUploadError(stderr: string): string 方法，依據 contracts/upload-error-flow.md 的輸入→輸出映射表實作 pattern matching（port busy / device disconnected / timed out / connection failed / upload failed）。ℹ️ 職責分界：`classifyUploadError()` 回傳語義化分類碼（用於 WebView i18n 映射），`parseUploadError()` 回傳技術細節摘要（填入 `error.details`），兩者互補
- [ ] T006 [P] 在 media/locales/en/messages.js 中新增 5 個 i18n key：ERROR_ARDUINO_NO_DEVICE, ERROR_ARDUINO_PORT_BUSY, ERROR_ARDUINO_DEVICE_DISCONNECT（更新現有值）, ERROR_ARDUINO_UPLOAD_TIMEOUT, ERROR_ARDUINO_UPLOAD_CONNECTION
- [ ] T007 [P] 在 media/locales/zh-hant/messages.js 中新增對應的 5 個繁體中文 i18n key，翻譯內容依照 data-model.md 的 i18n Key 清單
- [ ] T008 在其餘 13 種語言的 media/locales/{bg,cs,de,es,fr,hu,it,ja,ko,pl,pt-br,ru,tr}/messages.js 中新增相同的 5 個 i18n key，先以英文值填充
- [ ] T009 執行 npm run validate:i18n 確認所有 15 種語言的新 key 無缺漏，同時確認既有的 `ARDUINO_STAGE_DETECTING` key 在所有語言中完整（FR-005 偵測進度提示）

**Checkpoint**: 基礎型別、錯誤分類函式和 i18n key 就緒，可開始 User Story 實作

---

## Phase 3: User Story 1 — 未連接硬體時上傳提示無硬體 (Priority: P1) 🎯 MVP

**Goal**: 使用者點擊上傳按鈕時，若沒有連接 Arduino 開發板，在 3 秒內顯示「未偵測到硬體裝置」，不進入編譯階段

**Independent Test**: 不連接任何 Arduino 板子，直接點擊上傳按鈕。應在 3 秒內看到明確的「未偵測到硬體裝置」提示，且不應進入編譯階段。

### Tests for User Story 1

- [ ] T010 [P] [US1] 在 src/test/suite/arduinoUploader.test.ts 中新增測試案例：detectDevices() 回傳 hasDevice:false 且 commandFailed:false 時，upload() 立即回傳 detecting 階段失敗，不進入 compiling 階段
- [ ] T011 [P] [US1] 在 src/test/suite/arduinoUploader.test.ts 中新增測試案例：detectDevices() 回傳 commandFailed:true 時（如 pio 指令異常），upload() fallback 繼續上傳流程，使用 auto 連接埠

### Implementation for User Story 1

- [ ] T012 [US1] 修改 src/services/arduinoUploader.ts 的 upload() 方法，在 checking_pio 成功後（進度 15%）插入 detecting 階段（進度 18%）：呼叫 this.detectDevices()，若 hasDevice 為 false 且 commandFailed 為 false→立即回傳 createFailureResult(stage:'detecting', message:'No device detected')，若 commandFailed 為 true→log warning 並 fallback 繼續。為 detectDevices() 呼叫設定 5 秒 timeout，超時時視為指令失敗並 fallback 繼續
- [ ] T013 [US1] 修改 media/js/blocklyEdit.js 中 getLocalizedUploadError() 的 errorKeyMap，將 detecting 階段的 default 從 ERROR_ARDUINO_TIMEOUT 改為 ERROR_ARDUINO_NO_DEVICE，並新增 'No device detected' 的精確映射
- [ ] T013b [P] [US1] 新增 WebView 測試：對 getLocalizedUploadError() 的新增映射邏輯撇寫單元測試（此為純函式，不需 WebView 環境），確認 detecting 階段回傳 ERROR_ARDUINO_NO_DEVICE、uploading 階段的各0 子分類映射正確、且未覆蓋 MicroPython 的 default 行為

**Checkpoint**: 未連接硬體時上傳應立即顯示明確的「未偵測到硬體裝置」本地化訊息

---

## Phase 4: User Story 2 — 編譯失敗時顯示編譯錯誤 (Priority: P1)

**Goal**: 編譯失敗時明確告知「編譯失敗」並附帶具體的編譯錯誤摘要

**Independent Test**: 連接開發板但使用包含錯誤的積木組合，點擊上傳。應看到「編譯失敗」並附帶編譯器的錯誤摘要。

### Implementation for User Story 2

- [ ] T014 [US2] 修改 src/services/arduinoUploader.ts 中 compileAndUploadWithProgress() 的編譯失敗分支，確保 error.details 填入 parseCompileError() 的結果，並截斷至 200 字元
- [ ] T015 [US2] 修改 media/js/blocklyEdit.js 中 handleUploadResult()，當 message.error.details 存在且非空時，在本地化錯誤描述後附加 ` (${details.slice(0, 200)})`

**Checkpoint**: 編譯失敗時應看到「編譯失敗 (具體的編譯器錯誤摘要)」

---

## Phase 5: User Story 3 — 上傳過程中硬體斷線或連接埠問題 (Priority: P2)

**Goal**: 上傳階段失敗時，區分連接埠佔用、裝置斷線、逾時、連線問題等子分類

**Independent Test**: 連接開發板並開始上傳，模擬 USB 拔線或 COM 埠被佔用。應看到「裝置連接問題」相關的明確訊息。

### Tests for User Story 3

- [ ] T016 [P] [US3] 在 src/test/suite/arduinoUploader.test.ts 中新增測試案例：classifyUploadError() 對各種 stderr pattern（port busy / disconnected / timed out / connection failed）回傳正確分類字串
- [ ] T017 [P] [US3] 在 src/test/suite/arduinoUploader.test.ts 中新增測試案例：classifyUploadError() 對無法辨識的錯誤回傳 'Upload failed'

### Implementation for User Story 3

- [ ] T018 [US3] 修改 src/services/arduinoUploader.ts 中 compileAndUploadWithProgress() 的上傳失敗分支，使用 classifyUploadError(stderr) 設定 error.message（取代原有的固定字串），並將 parseUploadError() 結果作為 error.details
- [ ] T019 [US3] 修改 media/js/blocklyEdit.js 中 getLocalizedUploadError() 的 errorKeyMap，新增 uploading 階段的 Arduino 子分類映射：'Port is busy'→ERROR_ARDUINO_PORT_BUSY, 'Device disconnected'→ERROR_ARDUINO_DEVICE_DISCONNECT, 'Upload timed out'→ERROR_ARDUINO_UPLOAD_TIMEOUT, 'Connection failed'→ERROR_ARDUINO_UPLOAD_CONNECTION, default→ERROR_ARDUINO_UPLOAD_FAILED。ℹ️ 注意：現有 `uploading` 階段已被 MicroPython 使用（`default: 'ERROR_UPLOAD_UPLOAD_FAILED'`），Arduino 子分類透過 `fallbackMessage` 精確匹配實現，不覆蓋 MicroPython 的 default 行為

**Checkpoint**: 上傳階段失敗時應根據具體原因顯示不同的本地化錯誤訊息

---

## Phase 6: User Story 4 — CyberBrick 上傳錯誤不受影響 (Priority: P2)

**Goal**: 確認 CyberBrick (MicroPython) 上傳流程未受改動影響

**Independent Test**: 使用 CyberBrick 板子進行上傳（無裝置、有裝置），確認所有現有錯誤訊息不變。

### Verification for User Story 4

- [ ] T020 [US4] 檢查 src/webview/messageHandler.ts 中 handleRequestUpload() 的 Arduino/MicroPython 路由邏輯，確認改動未觸及 MicroPython 分支
- [ ] T021 [US4] 檢查 media/js/blocklyEdit.js 中 getLocalizedUploadError() 的 MicroPython 相關映射（preparing, connecting, uploading 等），確認 Arduino 子分類映射未覆蓋 MicroPython 的 default 行為（特別是 `uploading` 階段的 `ERROR_UPLOAD_UPLOAD_FAILED` 保留為 MicroPython default）
- [ ] T022 [US4] 確認 src/services/arduinoUploader.ts 中 compile() 方法（僅編譯模式）未呼叫 detectDevices()，確保「僅編譯」模式不受偵測階段影響（FR-001 驗證）

**Checkpoint**: CyberBrick 上傳流程行為與改動前完全一致；僅編譯模式正常運作

---

## Phase 7: User Story 5 — 錯誤訊息包含技術細節輔助除錯 (Priority: P3)

**Goal**: 進階使用者能從錯誤訊息中獲得 PlatformIO 原始錯誤摘要

**Independent Test**: 觸發任一種上傳錯誤，確認 toast 訊息中包含本地化描述加上原始技術細節。

### Tests for User Story 5

- [ ] T023 [US5] 在 src/test/suite/arduinoUploader.test.ts 中新增測試案例：error.details 超過 200 字元時被正確截斷
- [ ] T024 [P] [US5] 在 src/test/suite/arduinoUploader.test.ts 中新增測試案例：底層工具未回傳技術細節時，error.details 為 undefined，不出現空括號

### Implementation for User Story 5

- [ ] T025 [US5] 確認 src/services/arduinoUploader.ts 中所有錯誤路徑（detecting / compiling / uploading）的 error.details 填充邏輯正確：detecting 階段無 details；compiling 使用 parseCompileError()；uploading 使用 parseUploadError()，皆截斷至 200 字元
- [ ] T026 [US5] 驗證 media/js/blocklyEdit.js 中 handleUploadResult() 的 details 顯示 edge case：details 為空字串、僅含空白、或 undefined 時不追加任何文字（不出現空括號或尾隨空格）。這些 edge case 可納入 T013b 的測試中一併驗證

**Checkpoint**: 所有上傳錯誤訊息格式為「本地化描述」或「本地化描述 (技術細節)」

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 驗證、清理、確保整體品質

- [ ] T027 執行 npm run validate:i18n 最終確認全部 15 種語言翻譯無缺漏
- [ ] T028 [P] 執行 npm run test 確認所有既有測試 + 新增測試通過
- [ ] T029 [P] 驗證 quickstart.md 的 5 個測試要點（無硬體上傳、編譯錯誤、上傳中拔線、CyberBrick 不受影響、偵測指令失敗 fallback）
- [ ] T030 檢查所有修改過的檔案中 log() 呼叫是否正確（使用 logging.ts，非 console.log）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴，立即開始（僅閱讀程式碼）
- **Foundational (Phase 2)**: 依賴 Setup 完成 — **阻擋所有 User Story**
- **US1 (Phase 3)**: 依賴 Phase 2 完成（需要 i18n key + classifyUploadError + detectDevices 修改）
- **US2 (Phase 4)**: 依賴 Phase 2 完成；與 US1 有部分共享修改（handleUploadResult 的 details 顯示）
- **US3 (Phase 5)**: 依賴 Phase 2 完成（需要 classifyUploadError + i18n key）
- **US4 (Phase 6)**: 依賴 US1/US2/US3 完成（驗證回歸，含 compile-only 模式驗證）
- **US5 (Phase 7)**: 依賴 US2 完成（details 顯示邏輯在 US2 中實作）
- **Polish (Phase 8)**: 依賴所有 User Story 完成

### User Story Dependencies

- **US1 (P1)**: Phase 2 完成後可開始 — 無其他 Story 依賴
- **US2 (P1)**: Phase 2 完成後可開始 — 與 US1 修改不同區域，但 T015（details 顯示）被 US5 依賴
- **US3 (P2)**: Phase 2 完成後可開始 — 無其他 Story 依賴
- **US4 (P2)**: US1/US2/US3 完成後驗證 — 純驗證任務（含 compile-only 模式驗證）
- **US5 (P3)**: US2 的 T015 完成後可開始 — 依賴 handleUploadResult 的 details 邏輯

### Within Each User Story

- 測試先於實作（確認測試失敗）
- 後端（ArduinoUploader）先於前端（blocklyEdit.js）
- 核心邏輯先於 i18n 映射

### Parallel Opportunities

- T001, T002, T003 可平行執行（純閱讀）
- T006, T007 可平行執行（不同語言檔案）
- T010, T011 可平行執行（同檔案不同測試，獨立 describe block）
- T013b 可與 T013 平行執行（測試與實作不同檔案）
- T016, T017 可平行執行（同上）
- US1, US2, US3 可在 Phase 2 完成後平行開始（修改不同函式區域）
- T027, T028, T029 可平行執行（獨立驗證指令）

---

## Parallel Example: Phase 2 (Foundational)

```bash
# 可平行的任務（不同檔案）：
T006: 新增 en/messages.js 的 i18n key
T007: 新增 zh-hant/messages.js 的 i18n key

# 需循序的任務：
T004: detectDevices() 修改 → T005: classifyUploadError() → T008: 其他 13 種語言 → T009: validate:i18n
```

## Parallel Example: User Story 1

```bash
# 可平行的測試任務：
T010: 測試 detectDevices() => hasDevice:false 且 commandFailed:false 立即失敗
T011: 測試 detectDevices() => commandFailed:true fallback

# 循序的實作任務：
T012: ArduinoUploader detecting 階段（含 5 秒 timeout） → T013: WebView errorKeyMap 映射
T013b: WebView 映射測試（可與 T013 平行）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup（閱讀現有程式碼）
2. Complete Phase 2: Foundational（detectDevices 修改 + classifyUploadError + i18n key）
3. Complete Phase 3: User Story 1（偵測前置階段 + 錯誤映射）
4. **STOP and VALIDATE**: 不接硬體點上傳，確認 3 秒內顯示「未偵測到硬體」
5. 此為最小可用改進，可單獨發布

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. US1（無硬體偵測）→ 獨立測試 → 可部署（MVP!）
3. US2（編譯失敗 + 技術細節）→ 獨立測試 → 可部署
4. US3（上傳子分類）→ 獨立測試 → 可部署
5. US4（CyberBrick 回歸驗證）→ 確認無回歸
6. US5（技術細節完善）→ 獨立測試 → 可部署
7. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = 不同檔案、無依賴，可平行執行
- [Story] label 對應 spec.md 中的 User Story 編號
- 所有修改均限於現有檔案擴充，不新增模組（遵循 Principle I 簡單性）
- 使用 `log()` 記錄偵測結果，不使用 `console.log`
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
