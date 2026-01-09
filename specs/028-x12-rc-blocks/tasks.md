# Tasks: CyberBrick X12 與 RC 遙控積木

**Input**: Design documents from `/specs/028-x12-rc-blocks/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 無單元測試要求 (WebView 互動功能依 Constitution Principle VII 使用手動測試)

**Organization**: 任務按 User Story 分組，每個 Story 可獨立實作與測試

---

## ⚠️ 實作狀態

**X12 發射端積木 (User Story 2)**: ✅ **完成並測試**
**RC 遠端通訊積木 (User Story 1, 4)**: ⏸️ **延後至下次開發** (積木定義完成，但從 Toolbox 移除)

---

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行 (不同檔案，無相依性)
-   **[Story]**: 任務所屬的 User Story (例如 US1, US2, US3, US4)
-   描述中包含精確檔案路徑

## 路徑慣例

-   **積木定義**: `media/blockly/blocks/`
-   **程式碼生成器**: `media/blockly/generators/micropython/`
-   **Toolbox 配置**: `media/toolbox/categories/`
-   **i18n 翻譯**: `media/locales/{lang}/messages.js`
-   **HTML 載入**: `media/html/blocklyEdit.html`

---

## Phase 1: Setup (共用基礎建設)

**Purpose**: 建立新檔案結構與共用元件

-   [x] T001 [P] 建立 RC 積木定義檔案骨架 in media/blockly/blocks/rc.js
-   [x] T002 [P] 建立 X12 積木定義檔案骨架 in media/blockly/blocks/x12.js
-   [x] T003 [P] 建立 RC MicroPython 生成器檔案骨架 in media/blockly/generators/micropython/rc.js
-   [x] T004 [P] 建立 X12 MicroPython 生成器檔案骨架 in media/blockly/generators/micropython/x12.js
-   [x] T005 [P] 建立 RC 選單 Toolbox 配置 in media/toolbox/categories/cyberbrick_rc.json
-   [x] T006 [P] 建立 X12 選單 Toolbox 配置 in media/toolbox/categories/cyberbrick_x12.json

---

## Phase 2: Foundational (阻塞型前置作業)

**Purpose**: 必須完成才能實作任何 User Story 的核心基礎設施

**⚠️ 重要**: 此階段完成前，無法開始任何 User Story 實作

-   [x] T007 在 media/html/blocklyEdit.html 中引入 rc.js 和 x12.js 積木定義檔案
-   [x] T008 在 media/html/blocklyEdit.html 中引入 rc.js 和 x12.js MicroPython 生成器
-   [x] T009 修改 media/toolbox/cyberbrick.json 引入 cyberbrick_rc 和 cyberbrick_x12 選單
-   [x] T010 在 media/locales/en/messages.js 新增所有 RC 和 X12 i18n 鍵值 (英文為基準，共 34 個鍵值：8 選單/標籤 + 14 積木文字 + 12 tooltips，詳見 data-model.md)

**Checkpoint**: 基礎設施就緒 - User Story 實作現在可以開始

---

## Phase 3: User Story 1 - 接收端讀取遙控器指令 (Priority: P1) 🎯 MVP

**Goal**: 使用者在接收端可以初始化 Slave 模式，讀取來自發射端的搖桿和按鈕狀態

**Independent Test**: 載入包含 `rc_slave_init` 和 `rc_get_joystick` 積木的程式，配對後推動發射端搖桿，驗證接收端能正確讀取數值

### RC 初始化積木

-   [x] T011 [US1] 實作 rc_slave_init 積木定義 in media/blockly/blocks/rc.js
-   [x] T012 [US1] 實作 rc_slave_init MicroPython 生成器 in media/blockly/generators/micropython/rc.js

### RC 搖桿讀取積木

-   [x] T013 [US1] 實作 rc_get_joystick 積木定義 (含 CHANNEL 下拉選單) in media/blockly/blocks/rc.js
-   [x] T014 [US1] 實作 rc_get_joystick MicroPython 生成器 (含安全預設值 2048) in media/blockly/generators/micropython/rc.js
-   [x] T015 [US1] 實作 rc_get_joystick_mapped 積木定義 (含 MIN/MAX 輸入) in media/blockly/blocks/rc.js
-   [x] T016 [US1] 實作 rc_get_joystick_mapped MicroPython 生成器 (含線性映射公式) in media/blockly/generators/micropython/rc.js

### RC 按鈕讀取積木

-   [x] T017 [US1] 實作 rc_is_button_pressed 積木定義 (含 BUTTON 下拉選單) in media/blockly/blocks/rc.js
-   [x] T018 [US1] 實作 rc_is_button_pressed MicroPython 生成器 (0=按下轉 True) in media/blockly/generators/micropython/rc.js
-   [x] T019 [US1] 實作 rc_get_button 積木定義 in media/blockly/blocks/rc.js
-   [x] T020 [US1] 實作 rc_get_button MicroPython 生成器 in media/blockly/generators/micropython/rc.js

### Toolbox 配置

-   [x] T021 [US1] 在 cyberbrick_rc.json 新增初始化區塊 (RC_LABEL_INIT) 含 rc_master_init, rc_slave_init
-   [x] T022 [US1] 在 cyberbrick_rc.json 新增搖桿區塊 (RC_LABEL_JOYSTICK) 含 rc_get_joystick, rc_get_joystick_mapped
-   [x] T023 [US1] 在 cyberbrick_rc.json 新增按鈕區塊 (RC_LABEL_BUTTON) 含 rc_is_button_pressed, rc_get_button

**Checkpoint**: User Story 1 完成 - 接收端可以讀取遠端搖桿/按鈕資料

---

## Phase 4: User Story 2 - 發射端讀取本機搖桿/按鈕 (Priority: P2)

**Goal**: 使用者在發射端可以初始化 Master 模式，讀取本機搖桿和按鈕狀態

**Independent Test**: 載入包含 `rc_master_init` 和 `x12_get_joystick` 積木的程式，推動搖桿後透過序列埠確認能正確讀取本機數值

### RC Master 初始化積木

-   [x] T024 [US2] 實作 rc_master_init 積木定義 in media/blockly/blocks/rc.js
-   [x] T025 [US2] 實作 rc_master_init MicroPython 生成器 in media/blockly/generators/micropython/rc.js

### X12 搖桿讀取積木

-   [x] T026 [P] [US2] 實作 x12_get_joystick 積木定義 (含 CHANNEL 下拉選單) in media/blockly/blocks/x12.js
-   [x] T027 [P] [US2] 實作 x12_get_joystick MicroPython 生成器 (使用 rc_master_data) in media/blockly/generators/micropython/x12.js
-   [x] T028 [P] [US2] 實作 x12_get_joystick_mapped 積木定義 (含 MIN/MAX 輸入) in media/blockly/blocks/x12.js
-   [x] T029 [P] [US2] 實作 x12_get_joystick_mapped MicroPython 生成器 (含線性映射公式) in media/blockly/generators/micropython/x12.js

### X12 按鈕讀取積木

-   [x] T030 [P] [US2] 實作 x12_is_button_pressed 積木定義 (含 BUTTON 下拉選單) in media/blockly/blocks/x12.js
-   [x] T031 [P] [US2] 實作 x12_is_button_pressed MicroPython 生成器 in media/blockly/generators/micropython/x12.js
-   [x] T032 [P] [US2] 實作 x12_get_button 積木定義 in media/blockly/blocks/x12.js
-   [x] T033 [P] [US2] 實作 x12_get_button MicroPython 生成器 in media/blockly/generators/micropython/x12.js

### Toolbox 配置

-   [x] T034 [US2] 在 cyberbrick_x12.json 新增搖桿區塊 (X12_LABEL_JOYSTICK) 含 x12_get_joystick, x12_get_joystick_mapped
-   [x] T035 [US2] 在 cyberbrick_x12.json 新增按鈕區塊 (X12_LABEL_BUTTON) 含 x12_is_button_pressed, x12_get_button

**Checkpoint**: User Story 2 完成 - 發射端可以讀取本機搖桿/按鈕資料

---

## Phase 5: User Story 3 - 搖桿數值映射 (Priority: P2)

**Goal**: 使用者可以使用映射積木將搖桿 ADC 值轉換為自訂範圍

**Independent Test**: 輸入已知搖桿值和映射範圍，驗證輸出值符合線性映射預期

**Note**: 此 User Story 的核心功能 (rc_get_joystick_mapped, x12_get_joystick_mapped) 已在 US1 和 US2 實作

此 Phase 已包含在 Phase 3 和 Phase 4 中，無額外任務

**Checkpoint**: User Story 3 完成 - 映射功能可用

---

## Phase 6: User Story 4 - 查詢連線狀態 (Priority: P3)

**Goal**: 使用者可以查詢配對狀態和配對索引，處理斷線情況

**Independent Test**: 在已配對和未配對狀態下測試 `rc_is_connected` 和 `rc_get_rc_index` 的回傳值

### RC 狀態查詢積木

-   [x] T036 [US4] 實作 rc_is_connected 積木定義 in media/blockly/blocks/rc.js
-   [x] T037 [US4] 實作 rc_is_connected MicroPython 生成器 (rc_slave_data is not None) in media/blockly/generators/micropython/rc.js
-   [x] T038 [US4] 實作 rc_get_rc_index 積木定義 in media/blockly/blocks/rc.js
-   [x] T039 [US4] 實作 rc_get_rc_index MicroPython 生成器 (rc_module.rc_index()) in media/blockly/generators/micropython/rc.js

### Toolbox 配置

-   [x] T040 [US4] 在 cyberbrick_rc.json 新增狀態區塊 (RC_LABEL_STATUS) 含 rc_is_connected, rc_get_rc_index

**Note**: `rc_master_init` 已在 Phase 4 T024-T025 實作，並於 T021 初始化區塊中包含

**Checkpoint**: User Story 4 完成 - 使用者可以查詢連線狀態

---

## Phase 7: i18n 國際化 (跨 User Story)

**Purpose**: 為所有 15 種語言新增翻譯

-   [x] T042 [P] 新增 RC/X12 i18n 鍵值 in media/locales/zh-hant/messages.js (繁體中文)
-   [x] T043 [P] 新增 RC/X12 i18n 鍵值 in media/locales/ja/messages.js (日文)
-   [x] T044 [P] 新增 RC/X12 i18n 鍵值 in media/locales/ko/messages.js (韓文)
-   [x] T045 [P] 新增 RC/X12 i18n 鍵值 in media/locales/de/messages.js (德文)
-   [x] T046 [P] 新增 RC/X12 i18n 鍵值 in media/locales/fr/messages.js (法文)
-   [x] T047 [P] 新增 RC/X12 i18n 鍵值 in media/locales/es/messages.js (西班牙文)
-   [x] T048 [P] 新增 RC/X12 i18n 鍵值 in media/locales/pt-br/messages.js (巴西葡萄牙文)
-   [x] T049 [P] 新增 RC/X12 i18n 鍵值 in media/locales/it/messages.js (義大利文)
-   [x] T050 [P] 新增 RC/X12 i18n 鍵值 in media/locales/ru/messages.js (俄文)
-   [x] T051 [P] 新增 RC/X12 i18n 鍵值 in media/locales/pl/messages.js (波蘭文)
-   [x] T052 [P] 新增 RC/X12 i18n 鍵值 in media/locales/hu/messages.js (匈牙利文)
-   [x] T053 [P] 新增 RC/X12 i18n 鍵值 in media/locales/tr/messages.js (土耳其文)
-   [x] T054 [P] 新增 RC/X12 i18n 鍵值 in media/locales/bg/messages.js (保加利亞文)
-   [x] T055 [P] 新增 RC/X12 i18n 鍵值 in media/locales/cs/messages.js (捷克文)

**Checkpoint**: 所有 15 種語言翻譯完成 ✓

---

## Phase 8: Polish & 驗證

**Purpose**: 最終驗證與清理

-   [x] T056 執行 `npm run validate:i18n` 驗證所有翻譯完整性 (修復法文檔案解析問題)
-   [x] T057 執行 `npm run watch` 並在 WebView 中測試所有積木是否正確顯示
-   [x] T058 測試 X12 積木生成的 MicroPython 程式碼語法正確 (測試三段式搖桿，確認 ADC 值讀取)
-   [ ] ~~T059 依照 quickstart.md 測試情境 1: 基本遙控車功能~~ [延後至 RC 功能開發]
-   [ ] ~~T060 依照 quickstart.md 測試情境 2: 進階遙控器功能~~ [延後至 RC 功能開發]
-   [ ] ~~T061 依照 quickstart.md 測試情境 3: 斷線處理功能~~ [延後至 RC 功能開發]
-   [x] T062 執行 `npm run generate:dictionary` 更新 MCP block-dictionary.json

---

## Dependencies & Execution Order

### Phase 相依性

-   **Setup (Phase 1)**: 無相依性 - 可立即開始
-   **Foundational (Phase 2)**: 相依於 Setup 完成 - **阻塞所有 User Story**
-   **User Stories (Phase 3-6)**: 全部相依於 Foundational 完成
    -   User Story 1 (P1): 可以獨立進行
    -   User Story 2 (P2): 可以獨立進行，與 US1 平行
    -   User Story 4 (P3): 可以獨立進行，與 US1/US2 平行
-   **i18n (Phase 7)**: 相依於 Foundational 完成 (需要英文 key 作為基準)
-   **Polish (Phase 8)**: 相依於所有 User Story 和 i18n 完成

### User Story 相依性

-   **User Story 1 (P1)**: Foundational 完成後即可開始 - 無其他 Story 相依
-   **User Story 2 (P2)**: Foundational 完成後即可開始 - 可與 US1 平行
-   **User Story 3 (P2)**: 已包含在 US1 和 US2 中
-   **User Story 4 (P3)**: Foundational 完成後即可開始 - 可與 US1/US2 平行

### 各 User Story 內部順序

-   積木定義先於生成器
-   生成器先於 Toolbox 配置
-   核心功能先於輔助功能

### 平行機會

-   Phase 1 所有 [P] 任務可平行執行
-   Phase 2 必須依序完成 (修改共用檔案)
-   Phase 3-6 的不同 User Story 可平行執行
-   Phase 7 所有 i18n 任務可平行執行 (不同語言檔案)
-   Phase 8 必須依序執行 (驗證流程)

---

## Parallel Example: Phase 1 Setup

```bash
# 可同時執行所有骨架檔案建立:
Task T001: "建立 RC 積木定義檔案骨架 in media/blockly/blocks/rc.js"
Task T002: "建立 X12 積木定義檔案骨架 in media/blockly/blocks/x12.js"
Task T003: "建立 RC MicroPython 生成器檔案骨架 in media/blockly/generators/micropython/rc.js"
Task T004: "建立 X12 MicroPython 生成器檔案骨架 in media/blockly/generators/micropython/x12.js"
Task T005: "建立 RC 選單 Toolbox 配置 in media/toolbox/categories/cyberbrick_rc.json"
Task T006: "建立 X12 選單 Toolbox 配置 in media/toolbox/categories/cyberbrick_x12.json"
```

## Parallel Example: i18n Phase 7

```bash
# 可同時執行所有非英文語言翻譯:
Task T042-T055: 所有 14 種語言的 messages.js 更新可平行執行
```

---

## Implementation Strategy

### MVP First (僅 User Story 1)

1. 完成 Phase 1: Setup (6 tasks)
2. 完成 Phase 2: Foundational (4 tasks)
3. 完成 Phase 3: User Story 1 (13 tasks)
4. **停止並驗證**: 測試接收端讀取遠端搖桿/按鈕功能
5. 如已就緒可部署 Demo

### Incremental Delivery

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/Demo (MVP!)
3. 新增 User Story 2 → 獨立測試 → 部署/Demo
4. 新增 User Story 4 → 獨立測試 → 部署/Demo
5. 完成 i18n → 全語言支援
6. 每個 Story 都獨立增加價值，不影響先前功能

### 平行團隊策略

多開發者情況:

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後:
    - 開發者 A: User Story 1 (RC 積木)
    - 開發者 B: User Story 2 (X12 積木)
    - 開發者 C: User Story 4 (狀態查詢積木)
3. 各 Story 獨立完成並整合

---

## 積木清單對照表

| 積木類型                | User Story | 檔案                                         |
| ----------------------- | ---------- | -------------------------------------------- |
| rc_master_init          | US2, US4   | blocks/rc.js, generators/micropython/rc.js   |
| rc_slave_init           | US1        | blocks/rc.js, generators/micropython/rc.js   |
| rc_get_joystick         | US1        | blocks/rc.js, generators/micropython/rc.js   |
| rc_get_joystick_mapped  | US1, US3   | blocks/rc.js, generators/micropython/rc.js   |
| rc_is_button_pressed    | US1        | blocks/rc.js, generators/micropython/rc.js   |
| rc_get_button           | US1        | blocks/rc.js, generators/micropython/rc.js   |
| rc_is_connected         | US4        | blocks/rc.js, generators/micropython/rc.js   |
| rc_get_rc_index         | US4        | blocks/rc.js, generators/micropython/rc.js   |
| x12_get_joystick        | US2        | blocks/x12.js, generators/micropython/x12.js |
| x12_get_joystick_mapped | US2, US3   | blocks/x12.js, generators/micropython/x12.js |
| x12_is_button_pressed   | US2        | blocks/x12.js, generators/micropython/x12.js |
| x12_get_button          | US2        | blocks/x12.js, generators/micropython/x12.js |

---

## Notes

-   [P] 任務 = 不同檔案，無相依性
-   [Story] 標籤將任務對應到特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成與測試
-   每個任務或邏輯群組完成後提交 commit
-   在任何 checkpoint 可停止並獨立驗證 Story
-   避免: 模糊的任務描述、相同檔案衝突、破壞獨立性的跨 Story 相依
