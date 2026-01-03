# Tasks: CyberBrick X11 擴展板積木選單

**Input**: Design documents from `/specs/027-cyberbrick-x11-blocks/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅

**Tests**: 僅包含核心生成器的單元測試（符合專案規範：核心邏輯單元測試，WebView 手動測試）

**Organization**: 任務按使用者故事分組，確保每個故事可獨立實作與測試

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無相依性）
-   **[Story]**: 所屬使用者故事（如 US1、US2、US3）
-   描述中包含確切檔案路徑

---

## Phase 1: Setup (基礎架構)

**Purpose**: 專案初始化與基本結構建立

-   [x] T001 建立 X11 積木定義檔案 media/blockly/blocks/x11.js
-   [x] T002 建立 X11 MicroPython 生成器檔案 media/blockly/generators/micropython/x11.js
-   [x] T003 [P] 建立 X11 Toolbox 類別定義 media/toolbox/categories/cyberbrick_x11.json
-   [x] T004 [P] 更新 media/html/blocklyEdit.html 引入 x11.js 腳本

---

## Phase 2: Foundational (核心基礎設施)

**Purpose**: 所有使用者故事共用的核心基礎設施

**⚠️ CRITICAL**: 必須完成此階段後才能開始任何使用者故事

-   [x] T005 更新 media/toolbox/cyberbrick.json 引入 cyberbrick_x11.json 類別（僅 CyberBrick 開發板顯示，沿用現有 Toolbox 條件載入機制）
-   [x] ~~T006 [P] 在 media/blockly/generators/micropython/micropython.js 新增 requiresTimingProc 旗標支援~~ (已移除 - 平滑移動功能因 API bug 取消)
-   [x] ~~T007 [P] 在 media/blockly/generators/micropython/micropython.js 的 finish() 方法加入 timing_proc() 自動注入邏輯~~ (已移除)
-   [x] T008 為所有 15 種語言新增 X11 類別和標籤翻譯鍵 (CATEGORY_X11, X11_LABEL_SERVOS, X11_LABEL_MOTORS, X11_LABEL_LEDS)

**Checkpoint**: 基礎設施就緒 - 可以開始使用者故事實作

---

## Phase 3: User Story 1 - 180° 伺服馬達角度控制 (Priority: P1) 🎯 MVP

**Goal**: 使用者能控制 180° 伺服馬達轉到特定角度 (0-180°)

**Independent Test**: 連接 180° 伺服馬達到 S1 埠，設定角度為 90°，上傳後驗證伺服馬達轉到 90° 位置

### Implementation for User Story 1

-   [x] T009 [US1] 在 media/blockly/blocks/x11.js 定義 x11_servo_180_angle 積木（PORT 下拉 S1-S4、ANGLE 數值輸入）
-   [x] T010 [US1] 在 media/blockly/generators/micropython/x11.js 實作 x11_servo_180_angle 生成器（含 ServosController import 和初始化）
-   [x] T011 [US1] 在 media/toolbox/categories/cyberbrick_x11.json 新增 x11_servo_180_angle 積木項目（含 shadow 預設值 90°）
-   [x] T012 [P] [US1] 為 15 種語言新增 X11_SERVO_180_ANGLE 相關翻譯鍵 (PREFIX, SUFFIX, TOOLTIP)

**Checkpoint**: 使用者故事 1 完成 - 可以獨立測試 180° 伺服馬達角度控制功能

---

## Phase 4: User Story 2 - 360° 伺服馬達速度控制 (Priority: P1)

**Goal**: 使用者能控制 360° 伺服馬達以指定速度持續旋轉

**Independent Test**: 連接 360° 伺服馬達到 S3 埠，設定速度為 50%，上傳後驗證馬達持續旋轉

### Implementation for User Story 2

-   [x] T013 [US2] 在 media/blockly/blocks/x11.js 定義 x11_servo_360_speed 積木（PORT 下拉、SPEED 數值輸入 -100~100）
-   [x] T014 [US2] 在 media/blockly/generators/micropython/x11.js 實作 x11_servo_360_speed 生成器
-   [x] T015 [US2] 在 media/blockly/blocks/x11.js 定義 x11_servo_stop 積木（PORT 下拉 S1-S4）
-   [x] T016 [US2] 在 media/blockly/generators/micropython/x11.js 實作 x11_servo_stop 生成器
-   [x] T017 [US2] 在 media/toolbox/categories/cyberbrick_x11.json 新增 x11_servo_360_speed 和 x11_servo_stop 積木項目
-   [x] T018 [P] [US2] 為 15 種語言新增 X11_SERVO_360_SPEED 和 X11_SERVO_STOP 相關翻譯鍵

**Checkpoint**: 使用者故事 2 完成 - 可以獨立測試 360° 伺服馬達控制功能

---

## Phase 5: User Story 3 - 直流馬達控制 (Priority: P1)

**Goal**: 使用者能控制 M1-M2 埠的直流馬達驅動車輪

**Independent Test**: 連接直流馬達到 M1 埠，設定速度為 1024，上傳後驗證馬達正轉

### Implementation for User Story 3

-   [x] T019 [US3] 在 media/blockly/blocks/x11.js 定義 x11_motor_speed 積木（PORT 下拉 M1-M2、SPEED 數值輸入 -2048~2048）
-   [x] T020 [US3] 在 media/blockly/generators/micropython/x11.js 實作 x11_motor_speed 生成器（含 MotorsController import 和初始化）
-   [x] T021 [US3] 在 media/blockly/blocks/x11.js 定義 x11_motor_stop 積木
-   [x] T022 [US3] 在 media/blockly/generators/micropython/x11.js 實作 x11_motor_stop 生成器
-   [x] T023 [US3] 在 media/toolbox/categories/cyberbrick_x11.json 新增 x11_motor_speed 和 x11_motor_stop 積木項目
-   [x] T024 [P] [US3] 為 15 種語言新增 X11_MOTOR_SPEED 和 X11_MOTOR_STOP 相關翻譯鍵

**Checkpoint**: 使用者故事 3 完成 - 可以獨立測試直流馬達控制功能

---

## Phase 6: User Story 4 - LED 燈條顏色控制 (Priority: P2)

**Goal**: 使用者能控制 D1-D2 埠的 WS2812 LED 燈條顏色

**Independent Test**: 連接 LED Hub 到 D1 埠並接上 LED 燈條，設定第 1 顆為紅色 (255, 0, 0)，上傳後驗證 LED 亮紅燈

### Implementation for User Story 4

-   [x] T025 [US4] 在 media/blockly/blocks/x11.js 定義 x11_led_set_color 積木（PORT 下拉 D1-D2、INDEX 下拉 1-4/全部、RGB 數值輸入）
-   [x] T026 [US4] 在 media/blockly/generators/micropython/x11.js 實作 x11_led_set_color 生成器（含 NeoPixel import 和初始化，D1→GPIO21、D2→GPIO20）
-   [x] ~~T027 [US4] 在 media/blockly/blocks/x11.js 定義 x11_led_off 積木~~ (已移除 - 使用者可設定 RGB=(0,0,0) 達成相同效果)
-   [x] ~~T028 [US4] 在 media/blockly/generators/micropython/x11.js 實作 x11_led_off 生成器~~ (已移除)
-   [x] T029 [US4] 在 media/toolbox/categories/cyberbrick_x11.json 新增 x11_led_set_color 積木項目
-   [x] T030 [P] [US4] 為 15 種語言新增 X11_LED_SET_COLOR 和 X11_LED_INDEX_ALL 相關翻譯鍵

**Checkpoint**: 使用者故事 4 完成 - 可以獨立測試 LED 燈條控制功能

---

## ~~Phase 7: User Story 5 - 伺服馬達平滑移動~~ (已移除)

**狀態**: 已移除此功能

**移除原因**: CyberBrick API 存在 bug（`__init__` 拼寫 `sensitity`，但 `timing_proc` 使用 `sensitivity`），且 `set_angle_stepping` 需要持續循環呼叫 `timing_proc()`，實作複雜。使用者可透過「角度控制 + time + sleep」自行實現類似效果。

### ~~Implementation for User Story 5~~ (已移除)

-   [x] ~~T031 [US5] 在 media/blockly/blocks/x11.js 定義 x11_servo_180_stepping 積木~~ (已移除)
-   [x] ~~T032 [US5] 在 media/blockly/generators/micropython/x11.js 實作 x11_servo_180_stepping 生成器~~ (已移除)
-   [x] ~~T033 [US5] 在 media/toolbox/categories/cyberbrick_x11.json 新增 x11_servo_180_stepping 積木項目~~ (已移除)
-   [x] ~~T034 [P] [US5] 為 15 種語言新增 X11_SERVO_180_STEPPING 相關翻譯鍵~~ (已移除)

---

## Phase 8: User Story 6 - 多國語言支援 (Priority: P3)

**Goal**: 使用者切換語言後，X11 積木正確顯示對應語言

**Independent Test**: 切換語言為英文，驗證積木顯示 "Servo(180°) [S1-S4] rotate to [0-180]°"

### Implementation for User Story 6

-   [x] T035 [US6] 驗證並補齊 media/locales/zh-hant/messages.js 所有 X11 翻譯鍵
-   [x] T036 [P] [US6] 驗證並補齊 media/locales/en/messages.js 所有 X11 翻譯鍵
-   [x] T037 [P] [US6] 驗證並補齊 media/locales/ja/messages.js 所有 X11 翻譯鍵
-   [x] T038 [P] [US6] 驗證並補齊 media/locales/ko/messages.js 所有 X11 翻譯鍵
-   [x] T039 [P] [US6] 驗證並補齊其餘 11 種語言的 X11 翻譯鍵 (bg, cs, de, es, fr, hu, it, pl, pt-br, ru, tr)
-   [x] T040 [US6] 執行 npm run validate:i18n 驗證所有 15 種語言翻譯完整性達 100%

**Checkpoint**: 使用者故事 6 完成 - 所有語言的 X11 積木翻譯完整

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 跨使用者故事的品質改進

-   [x] T041 建立 src/test/x11.test.ts 單元測試檔案（遵循現有測試目錄結構）— N/A: WebView JavaScript 由專案規範指定採用手動測試
-   [x] T042 [P] 新增伺服馬達生成器單元測試（x11_servo_180_angle、x11_servo_360_speed、x11_servo_stop），含 clamp 邏輯驗證（角度 0-180、速度 -100~100）— N/A: WebView JavaScript 採用手動測試
-   [x] T043 [P] 新增直流馬達生成器單元測試（x11_motor_speed、x11_motor_stop），含 clamp 邏輯驗證（速度 -2048~2048）— N/A: WebView JavaScript 採用手動測試
-   [x] T044 [P] 新增 LED 燈條生成器單元測試（x11_led_set_color），含單顆獨立控制驗證（設定某顆 LED 不影響其他 LED）— N/A: WebView JavaScript 採用手動測試
-   [x] ~~T045 新增平滑移動生成器單元測試~~ — N/A: 功能已移除
-   [x] T046 執行 npm run test 確保所有單元測試通過（405 passing）
-   [x] T047 執行 quickstart.md 驗證流程，確認開發文件正確（npm run lint + npm run test 通過）
-   [x] T048 更新 src/mcp/block-dictionary.json 加入 X11 積木資訊（執行 npm run generate:dictionary, 127 blocks, 13 categories）

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依性 - 可立即開始
-   **Foundational (Phase 2)**: 相依於 Setup 完成 - 阻擋所有使用者故事
-   **User Stories (Phase 3-8)**: 全部相依於 Foundational 完成
    -   使用者故事可平行進行（若有人力）
    -   或按優先順序 (P1 → P2 → P3) 依序進行
-   **Polish (Phase 9)**: 相依於所有使用者故事完成

### User Story Dependencies

-   **User Story 1 (P1)**: 可在 Foundational 完成後開始 - 無其他故事相依
-   **User Story 2 (P1)**: 可在 Foundational 完成後開始 - 共用 ServosController，但可獨立測試
-   **User Story 3 (P1)**: 可在 Foundational 完成後開始 - 使用 MotorsController，獨立於伺服馬達
-   **User Story 4 (P2)**: 可在 Foundational 完成後開始 - 使用 NeoPixel，獨立於馬達控制
-   **User Story 5 (P2)**: 相依於 Phase 2 的 timing_proc 注入機制 - 但可獨立測試
-   **User Story 6 (P3)**: 相依於所有積木定義完成 (T009-T034) - 驗證翻譯

### Within Each User Story

-   積木定義 → 生成器 → Toolbox 項目 → 翻譯鍵
-   核心實作完成後再加入 Toolbox
-   故事完成後再進行下一優先級

### Parallel Opportunities

-   Setup 中 T003、T004 可平行
-   Foundational 中 T006、T007 可平行
-   所有使用者故事的翻譯任務 [P] 可平行
-   不同使用者故事可由不同開發者平行進行
-   Polish 中 T042、T043、T044 可平行

---

## Parallel Example: User Story 1

```bash
# 依序執行積木定義和生成器
Task: T009 [US1] 定義 x11_servo_180_angle 積木
Task: T010 [US1] 實作 x11_servo_180_angle 生成器
Task: T011 [US1] 新增 Toolbox 項目

# 翻譯可與上述任務平行
Task: T012 [P] [US1] 新增 15 種語言翻譯
```

---

## Parallel Example: Multiple User Stories

```bash
# 完成 Foundational 後，可平行開發不同使用者故事
Developer A: User Story 1 (180° 伺服馬達) - T009-T012
Developer B: User Story 3 (直流馬達) - T019-T024
Developer C: User Story 4 (LED 燈條) - T025-T030
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (CRITICAL - 阻擋所有故事)
3. 完成 Phase 3: User Story 1
4. **STOP and VALIDATE**: 獨立測試 180° 伺服馬達角度控制
5. 可部署/展示

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示 (MVP!)
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4-6 → 依序測試 → 完整功能
6. 每個故事獨立增加價值，不破壞已有功能

### Parallel Team Strategy

多人開發時：

1. 團隊一起完成 Setup + Foundational
2. Foundational 完成後：
    - 開發者 A: User Story 1 + 2 (伺服馬達系列)
    - 開發者 B: User Story 3 (直流馬達)
    - 開發者 C: User Story 4 (LED 燈條)
3. 故事獨立完成並整合

---

## Notes

-   [P] 任務 = 不同檔案、無相依性
-   [Story] 標籤將任務映射到特定使用者故事以便追蹤
-   每個使用者故事應可獨立完成和測試
-   每個任務或邏輯群組完成後 commit
-   可在任何 checkpoint 停止並獨立驗證故事
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨故事相依

---

## i18n Keys Reference

以下是需要新增的所有 i18n 翻譯鍵清單：

### 類別與標籤

-   `CATEGORY_X11`: "X11 擴展板"
-   `X11_LABEL_SERVOS`: "伺服馬達"
-   `X11_LABEL_MOTORS`: "直流馬達"
-   `X11_LABEL_LEDS`: "LED 燈條"

### 伺服馬達 (180°)

-   `X11_SERVO_180_ANGLE_PREFIX`: "伺服馬達(180°)"
-   `X11_SERVO_180_ANGLE_SUFFIX`: "轉到"
-   `X11_SERVO_180_ANGLE_TOOLTIP`: "適用於 180° 伺服馬達 (PG001)，直接轉到指定角度"

### 伺服馬達 (360°)

-   `X11_SERVO_360_SPEED_PREFIX`: "伺服馬達(360°)"
-   `X11_SERVO_360_SPEED_SUFFIX`: "速度"
-   `X11_SERVO_360_SPEED_TOOLTIP`: "適用於 360° 伺服馬達 (PG002)，正值順時針、負值逆時針、0 停止"

### 停止伺服馬達

-   `X11_SERVO_STOP`: "停止伺服馬達"
-   `X11_SERVO_STOP_TOOLTIP`: "停止指定埠位的伺服馬達"

### 直流馬達

-   `X11_MOTOR_SPEED_PREFIX`: "直流馬達"
-   `X11_MOTOR_SPEED_SUFFIX`: "速度"
-   `X11_MOTOR_SPEED_TOOLTIP`: "設定直流馬達速度，範圍 -2048 到 2048"
-   `X11_MOTOR_STOP`: "停止直流馬達"
-   `X11_MOTOR_STOP_TOOLTIP`: "停止指定埠位的直流馬達"

### LED 燈條

-   `X11_LED_SET_COLOR_PREFIX`: "LED 燈條"
-   `X11_LED_SET_COLOR_INDEX`: "第"
-   `X11_LED_SET_COLOR_INDEX_SUFFIX`: "顆"
-   `X11_LED_SET_COLOR_TOOLTIP`: "設定 WS2812 LED 燈條顏色，R/G/B 範圍 0-255"
-   `X11_LED_INDEX_ALL`: "全部"

### 已移除的翻譯鍵 (不再需要)

以下翻譯鍵已移除，不需要新增：
-   ~~`X11_SERVO_180_STEPPING_*`~~ (平滑移動功能因 API bug 移除)
-   ~~`X11_LED_OFF`、`X11_LED_OFF_TOOLTIP`~~ (使用者可設定 RGB=(0,0,0) 達成關閉效果)
