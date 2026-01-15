# Tasks: CyberBrick ESP-NOW RC 自定義配對積木

**Input**: Design documents from `/specs/029-espnow-rc-pairing/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/block-api.md ✅

**Tests**: 無需自動化測試（硬體功能需手動驗證，見 Constitution Check VII）

**Organization**: 任務按 User Story 分組，支援獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無相依）
-   **[Story]**: 所屬 User Story (US1-US5)
-   包含確切檔案路徑

## 技術棧

-   **Blockly 積木定義**: `media/blockly/blocks/rc-espnow.js`
-   **MicroPython 生成器**: `media/blockly/generators/micropython/rc-espnow.js`
-   **Toolbox 類別**: `media/toolbox/categories/cyberbrick_rc_espnow.json`
-   **i18n 翻譯**: `media/locales/{lang}/messages.js` (15 種語言)

---

## Phase 1: Setup (基礎建設)

**Purpose**: 建立新檔案結構，不修改現有 RC 積木

-   [ ] T001 建立積木定義檔案 `media/blockly/blocks/rc-espnow.js`，包含 IIFE 結構和 getMessage 引用
-   [ ] T002 建立 MicroPython 生成器檔案 `media/blockly/generators/micropython/rc-espnow.js`，包含 IIFE 結構
-   [ ] T003 [P] 建立 Toolbox 類別檔案 `media/toolbox/categories/cyberbrick_rc_espnow.json`

---

## Phase 2: Foundational (核心基礎設施)

**Purpose**: i18n 翻譯鍵 - 所有積木都依賴這些翻譯

**⚠️ CRITICAL**: 積木無法正確顯示直到翻譯鍵完成

### i18n 翻譯鍵 (依 data-model.md 定義)

-   [ ] T004 [P] 新增 zh-hant 翻譯鍵至 `media/locales/zh-hant/messages.js`：
    -   類別與標籤：CATEGORY_RC_ESPNOW, RC_ESPNOW_LABEL_MASTER/SLAVE/DATA/STATUS
    -   發射端：RC_ESPNOW_MASTER_INIT*, RC_ESPNOW_SEND*
    -   接收端：RC*ESPNOW_SLAVE_INIT\*, RC_ESPNOW_WAIT*_, RC_ESPNOW_IS_CONNECTED_
    -   資料讀取：RC_ESPNOW_GET_JOYSTICK*, RC_ESPNOW_IS_BUTTON_PRESSED*
-   [ ] T005 [P] 新增 en 翻譯鍵至 `media/locales/en/messages.js` (同上所有鍵)
-   [ ] T006 [P] 新增其他 13 種語言翻譯鍵至 `media/locales/{bg,cs,de,es,fr,hu,it,ja,ko,pl,pt-br,ru,tr}/messages.js`

### Toolbox 整合

-   [ ] T007 更新 `media/toolbox/cyberbrick.json`，新增 `cyberbrick_rc_espnow` 類別引用
-   [ ] T008 更新 `media/html/blocklyEdit.html`，引入 `rc-espnow.js` 積木定義和生成器

**Checkpoint**: 翻譯鍵完成，可執行 `npm run validate:i18n` 驗證

---

## Phase 3: User Story 1 - 基本遙控配對與操作 (Priority: P1) 🎯 MVP

**Goal**: 發射端與接收端可透過配對 ID 和頻道建立連線並傳輸 RC 資料

**Independent Test**: 兩台 CyberBrick Core 設定相同配對 ID 後，搖桿操作即時反映在接收端

### 發射端積木 (US1)

-   [ ] T009 [P] [US1] 實作 `rc_espnow_master_init` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   欄位：PAIR_ID (1-255), CHANNEL (1-11)
    -   參考 contracts/block-api.md 規格
-   [ ] T010 [P] [US1] 實作 `rc_espnow_send` 積木定義 in `media/blockly/blocks/rc-espnow.js`
-   [ ] T011 [US1] 實作 `rc_espnow_master_init` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   使用 generator.addImport() 新增 network, espnow, struct, time, rc_module
    -   使用 generator.addHardwareInit('espnow_master', ...) 初始化 ESP-NOW
    -   配對 ID 轉 MAC: `b'\x02\x00\x00\x00\x00\x{ID:02x}'`
-   [ ] T012 [US1] 實作 `rc_espnow_send` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   讀取 rc_master_data()、打包發送、sleep_ms(20)

### 接收端積木 (US1)

-   [ ] T013 [P] [US1] 實作 `rc_espnow_slave_init` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   欄位：PAIR_ID (1-255), CHANNEL (1-11)
-   [ ] T014 [US1] 實作 `rc_espnow_slave_init` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   使用 generator.addHardwareInit('espnow_slave', ...) 初始化 ESP-NOW
    -   註冊 `espnow.irq(_rc_recv_cb)` callback
    -   callback 使用 `irecv(0)` 迴圈讀取所有緩衝區訊息

### 資料讀取積木 (US1)

-   [ ] T015 [P] [US1] 實作 `rc_espnow_get_joystick` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   Dropdown 欄位：L1-L3, R1-R3
-   [ ] T016 [US1] 實作 `rc_espnow_get_joystick` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   回傳 `(_rc_data[{CHANNEL}] if _rc_connected else 2048)`

**Checkpoint**: User Story 1 完成 - 發射端/接收端可配對並傳輸搖桿資料

---

## Phase 4: User Story 2 - 等待配對視覺回饋 (Priority: P1)

**Goal**: 接收端等待配對時 LED 藍色閃爍，配對成功後停止

**Independent Test**: 接收端開機後 LED 閃爍，發射端開機發送後 LED 停止閃爍

-   [ ] T017 [P] [US2] 實作 `rc_espnow_wait_connection` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   欄位：TIMEOUT (1-60 秒，預設 30)
-   [ ] T018 [US2] 實作 `rc_espnow_wait_connection` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   迴圈等待 `_rc_connected=True`
    -   LED 藍色閃爍 (500ms 間隔)
    -   超時後結束等待，程式繼續執行

**Checkpoint**: User Story 2 完成 - 視覺回饋功能可獨立測試

---

## Phase 5: User Story 3 - 發射端手動發送控制 (Priority: P2)

**Goal**: 發送積木自動讀取 X12 資料並發送，使用者可在迴圈中自訂發送邏輯

**Independent Test**: 發射端在迴圈中每次執行發送積木時，接收端收到一筆更新

-   [ ] T019 [US3] 補完 `rc_espnow_send` 生成器的 None 處理 in `media/blockly/generators/micropython/rc-espnow.js`
    -   當 `rc_master_data()` 回傳 None 時發送安全預設值 `(2048,)*6 + (1,)*4`
-   [ ] T020 [P] [US3] 實作 `rc_espnow_get_joystick_mapped` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   輸入：CHANNEL (dropdown), MIN (number input), MAX (number input)
-   [ ] T021 [US3] 實作 `rc_espnow_get_joystick_mapped` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   映射 0-4095 → 使用者指定範圍

**Checkpoint**: User Story 3 完成 - 發送積木與映射功能可獨立測試

---

## Phase 6: User Story 4 - 斷線安全處理 (Priority: P2)

**Goal**: 斷線時資料讀取回傳安全預設值（搖桿 2048、按鈕 1）

**Independent Test**: 接收端連線後關閉發射端，500ms 內資料回傳預設值

### 連線狀態積木

-   [ ] T022 [P] [US4] 實作 `rc_espnow_is_connected` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   Output: Boolean
-   [ ] T023 [US4] 實作 `rc_espnow_is_connected` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   檢查 `time.ticks_diff(time.ticks_ms(), _rc_last_recv) < 500`

### 按鈕讀取積木

-   [ ] T024 [P] [US4] 實作 `rc_espnow_is_button_pressed` 積木定義 in `media/blockly/blocks/rc-espnow.js`
    -   Dropdown 欄位：K1-K4
    -   Output: Boolean
-   [ ] T025 [US4] 實作 `rc_espnow_is_button_pressed` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   回傳 `(_rc_data[{6+index}] == 0 if _rc_connected else False)`
-   [ ] T025a [P] [US4] 實作 `rc_espnow_get_button` 積木定義 in `media/blockly/blocks/rc-espnow.js` (FR-012)
    -   Dropdown 欄位：K1-K4
    -   Output: Number (原始狀態 0 或 1)
-   [ ] T025b [US4] 實作 `rc_espnow_get_button` MicroPython 生成器 in `media/blockly/generators/micropython/rc-espnow.js`
    -   回傳 `(_rc_data[{6+index}] if _rc_connected else 1)`

### 安全預設值處理

-   [ ] T026 [US4] 驗證所有資料讀取生成器在斷線時回傳安全預設值 in `media/blockly/generators/micropython/rc-espnow.js`
    -   搖桿：2048（中點）
    -   按鈕：1（放開）= is_pressed 回傳 False
    -   配對 ID 衝突場景：當多個發射端使用相同 ID 時，接收端應接受最後收到的資料（由 irq callback 自動處理）

**Checkpoint**: User Story 4 完成 - 斷線安全機制可獨立測試（含 FR-012 按鈕原始狀態積木）

---

## Phase 7: User Story 5 - 與現有 X12 積木相容 (Priority: P3)

**Goal**: 發射端可混用 X12 積木（本機感測器）和 RC 積木（發送資料）

**Independent Test**: 發射端程式同時使用 X12 和 RC 積木，兩者都正常運作

-   [ ] T027 [US5] 確保 `rc_espnow_master_init` 生成的 `rc_master_init()` 呼叫使用 addHardwareInit 避免重複 in `media/blockly/generators/micropython/rc-espnow.js`
-   [ ] T028 [US5] 驗證與 X12 積木混用時生成程式碼正確性 - 手動測試並記錄於 quickstart.md

**Checkpoint**: User Story 5 完成 - 相容性驗證通過

---

## Phase 8: Polish & 跨領域改善

**Purpose**: 文件更新、程式碼清理、驗證

-   [ ] T029 [P] 補完 Toolbox 類別內容 `media/toolbox/categories/cyberbrick_rc_espnow.json`
    -   新增所有積木的 shadow blocks (數值輸入預設值)
    -   參考 contracts/block-api.md 中的 Toolbox Category Contract
-   [ ] T030 [P] 執行 `npm run validate:i18n` 確認所有 15 種語言翻譯完整
-   [ ] T031 [P] 新增積木 tooltip 翻譯，說明各積木功能
-   [ ] T032 執行 `npm run generate:dictionary` 更新 MCP block-dictionary.json
-   [ ] T033 依照 quickstart.md 進行端對端硬體測試驗證
-   [ ] T034 程式碼清理：確保所有 IIFE 正確關閉、console.log 僅用於除錯

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依 - 可立即開始
-   **Foundational (Phase 2)**: 相依 Setup 完成 - **阻塞所有 User Story**
-   **User Stories (Phase 3-7)**: 全部相依 Foundational 完成
    -   US1 (P1) 與 US2 (P1)：可平行進行
    -   US3 (P2) 與 US4 (P2)：可平行進行（相依 US1 的積木定義）
    -   US5 (P3)：相依 US1-4 完成
-   **Polish (Phase 8)**: 相依所有 User Story 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 無其他 Story 相依 - MVP 核心
-   **User Story 2 (P1)**: 無其他 Story 相依 - 可與 US1 平行
-   **User Story 3 (P2)**: 輕度相依 US1（rc_espnow_send 擴充）
-   **User Story 4 (P2)**: 輕度相依 US1（共用 \_rc_connected 變數）
-   **User Story 5 (P3)**: 整合測試 - 相依 US1-4

### 各 User Story 內部順序

1. 積木定義 (blocks/\*.js) - 可標記 [P] 平行
2. 生成器 (generators/micropython/\*.js) - 相依積木定義
3. 整合測試 - 相依生成器完成

### Parallel Opportunities

```text
Phase 1 (Setup):
  T001, T002, T003 → 可全部平行

Phase 2 (Foundational):
  T004, T005, T006 → 可全部平行 (不同語言檔案)
  T007, T008 → 依序 (同檔案或相依)

Phase 3 (US1) + Phase 4 (US2):
  T009, T010, T013, T015 (積木定義) → 可全部平行
  T017 (US2 積木定義) → 可與上述平行

Phase 5 (US3) + Phase 6 (US4):
  T020, T022, T024 (積木定義) → 可全部平行
```

---

## Parallel Example: User Story 1 + 2

```bash
# 平行啟動所有積木定義任務：
Task T009: rc_espnow_master_init 積木定義
Task T010: rc_espnow_send 積木定義
Task T013: rc_espnow_slave_init 積木定義
Task T015: rc_espnow_get_joystick 積木定義
Task T017: rc_espnow_wait_connection 積木定義

# 積木定義完成後，平行啟動生成器：
Task T011: rc_espnow_master_init 生成器
Task T012: rc_espnow_send 生成器
Task T014: rc_espnow_slave_init 生成器
Task T016: rc_espnow_get_joystick 生成器
Task T018: rc_espnow_wait_connection 生成器
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (i18n 翻譯鍵)
3. 完成 Phase 3: User Story 1 (基本配對)
4. 完成 Phase 4: User Story 2 (等待視覺回饋)
5. **STOP and VALIDATE**: 用兩台 CyberBrick 硬體測試
6. 如驗證通過，可先 merge MVP

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. User Story 1 + 2 → **MVP 可用！** 基本遙控功能
3. User Story 3 + 4 → 完整功能：映射、斷線處理
4. User Story 5 → 相容性驗證
5. Polish → 文件、清理、發布準備

---

## Notes

-   [P] 任務 = 不同檔案、無相依
-   [Story] 標籤對應 spec.md 中的 User Story
-   每個 User Story 應可獨立完成和測試
-   硬體測試需實際 CyberBrick Core 設備
-   提交頻率：每個任務或邏輯群組完成後
-   在任何 Checkpoint 可暫停驗證功能
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 相依
