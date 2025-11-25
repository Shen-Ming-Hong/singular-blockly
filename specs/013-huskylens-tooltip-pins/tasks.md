# Tasks: HuskyLens 動態腳位提示與工具箱間距修復

**Input**: Design documents from `/specs/013-huskylens-tooltip-pins/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Tests**: 此功能採用手動測試（WebView UI 測試例外依 Constitution Principle VII），無自動化測試任務。

**Organization**: 任務按使用者故事分組，每個故事可獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無相依性）
-   **[Story]**: 所屬使用者故事（US1=I2C 提示, US2=UART 提示, US3=多語言, US4=工具箱間距）
-   描述中包含確切檔案路徑

---

## Phase 1: Setup (共用基礎建設)

**Purpose**: 專案結構確認與基礎設定

-   [x] T001 確認功能分支 `013-huskylens-tooltip-pins` 已建立並切換
-   [x] T002 [P] 執行 `npm run watch` 確認開發環境正常

---

## Phase 2: Foundational (阻塞前置條件)

**Purpose**: 所有使用者故事都需要的核心基礎設施

**⚠️ 關鍵**: 此階段完成前不可開始任何使用者故事

-   [x] T003 在 `media/blockly/blocks/huskylens.js` 頂部（版權聲明後）新增 `HUSKYLENS_PIN_INFO` 腳位對應表常數
-   [x] T004 在 `media/blockly/blocks/huskylens.js` 新增 `getHuskyLensI2CPinInfo()` 輔助函數
-   [x] T005 在 `media/blockly/blocks/huskylens.js` 新增 `getHuskyLensUARTPinInfo()` 輔助函數

**Checkpoint**: 基礎函數就緒 - 可開始使用者故事實作

---

## Phase 3: User Story 1 - I2C 接線提示 (Priority: P1) 🎯 MVP

**Goal**: 使用者滑鼠懸停 I2C 初始化區塊時，看到對應開發板的腳位資訊

**Independent Test**: 開啟 Blockly 編輯器 → 切換開發板 → 懸停 I2C 區塊 → 確認腳位正確

### Implementation for User Story 1

-   [x] T006 [US1] 修改 `media/blockly/blocks/huskylens.js` 中 `huskylens_init_i2c` 區塊的 `setTooltip()` 從靜態字串改為動態函數

**Checkpoint**: I2C 區塊 tooltip 應顯示動態腳位資訊（使用英文 fallback）

---

## Phase 4: User Story 2 - UART 接線提示 (Priority: P1)

**Goal**: 使用者滑鼠懸停 UART 初始化區塊時，看到對應開發板的腳位建議

**Independent Test**: 開啟 Blockly 編輯器 → 切換 ESP32 與 Uno → 懸停 UART 區塊 → 確認腳位正確

### Implementation for User Story 2

-   [x] T007 [US2] 修改 `media/blockly/blocks/huskylens.js` 中 `huskylens_init_uart` 區塊的 `setTooltip()` 從靜態字串改為動態函數

**Checkpoint**: UART 區塊 tooltip 應顯示動態腳位建議（ESP32 顯示特定腳位，AVR 顯示「Any digital pin」）

---

## Phase 5: User Story 3 - 多語言支援 (Priority: P2)

**Goal**: tooltip 腳位提示支援 15 種語言的國際化顯示

**Independent Test**: 切換 VSCode 語言 → 重新開啟編輯器 → 確認 tooltip 語言正確

### Implementation for User Story 3

-   [x] T008 [P] [US3] 在 `media/locales/en/messages.js` 新增 `HUSKYLENS_I2C_PIN_HINT`、`HUSKYLENS_UART_PIN_HINT`、`HUSKYLENS_UART_ANY_DIGITAL` 鍵值
-   [x] T009 [P] [US3] 在 `media/locales/zh-hant/messages.js` 新增對應的繁體中文翻譯
-   [x] T010 [P] [US3] 在 `media/locales/ja/messages.js` 新增對應的日文翻譯
-   [x] T011 [P] [US3] 在 `media/locales/ko/messages.js` 新增對應的韓文翻譯
-   [x] T012 [P] [US3] 在 `media/locales/de/messages.js` 新增對應的德文翻譯
-   [x] T013 [P] [US3] 在 `media/locales/fr/messages.js` 新增對應的法文翻譯
-   [x] T014 [P] [US3] 在 `media/locales/es/messages.js` 新增對應的西班牙文翻譯
-   [x] T015 [P] [US3] 在 `media/locales/it/messages.js` 新增對應的義大利文翻譯
-   [x] T016 [P] [US3] 在 `media/locales/pt-br/messages.js` 新增對應的巴西葡萄牙文翻譯
-   [x] T017 [P] [US3] 在 `media/locales/ru/messages.js` 新增對應的俄文翻譯
-   [x] T018 [P] [US3] 在 `media/locales/pl/messages.js` 新增對應的波蘭文翻譯
-   [x] T019 [P] [US3] 在 `media/locales/tr/messages.js` 新增對應的土耳其文翻譯
-   [x] T020 [P] [US3] 在 `media/locales/hu/messages.js` 新增對應的匈牙利文翻譯
-   [x] T021 [P] [US3] 在 `media/locales/bg/messages.js` 新增對應的保加利亞文翻譯
-   [x] T022 [P] [US3] 在 `media/locales/cs/messages.js` 新增對應的捷克文翻譯
-   [x] T023 [US3] 執行 `npm run validate:i18n` 確認所有翻譯鍵值一致

**Checkpoint**: 所有語言的 tooltip 應顯示對應語言的腳位提示

---

## Phase 6: User Story 4 - 工具箱間距一致性 (Priority: P2)

**Goal**: vision-sensors 工具箱類別的間距與其他類別一致

**Independent Test**: 開啟 Blockly 編輯器 → 比較 vision-sensors 與 sensors 類別的區塊間距

### Implementation for User Story 4

-   [x] T024 [US4] 移除 `media/toolbox/categories/vision-sensors.json` 第 19 行附近的 sep（pixetto_set_mode 後）
-   [x] T025 [US4] 移除 `media/toolbox/categories/vision-sensors.json` 第 115 行附近的 sep（huskylens_set_algorithm 後）
-   [x] T026 [US4] 移除 `media/toolbox/categories/vision-sensors.json` 第 142 行附近的 sep（huskylens_get_arrow_info 後）
-   [x] T027 [US4] 確認保留第 96 行附近的 sep（Pixetto 與 HuskyLens 群組分隔）

**Checkpoint**: vision-sensors 工具箱間距應與其他類別一致

---

## Phase 7: Polish & 驗收

**Purpose**: 最終驗收與清理

-   [x] T028 執行 quickstart.md 驗收檢查清單完整測試
-   [x] T029 [P] 確認 `npm run lint` 無錯誤
-   [x] T030 [P] 確認 `npm run compile` 成功
-   [x] T031 更新 spec.md 狀態從「草稿」改為「已完成」

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有使用者故事**
-   **User Stories (Phase 3-6)**: 全部依賴 Foundational 完成
    -   US1 與 US2 (P1) 可依序或平行進行
    -   US3 與 US4 (P2) 可依序或平行進行
-   **Polish (Phase 7)**: 依賴所有使用者故事完成

### User Story Dependencies

| 故事             | 優先級 | 前置相依                 | 可獨立測試 |
| ---------------- | ------ | ------------------------ | ---------- |
| US1 (I2C 提示)   | P1     | Foundational             | ✅         |
| US2 (UART 提示)  | P1     | Foundational             | ✅         |
| US3 (多語言)     | P2     | US1 + US2 完成後才有意義 | ✅         |
| US4 (工具箱間距) | P2     | 無                       | ✅         |

### Parallel Opportunities

**Phase 2 Foundational 內平行執行**:

```
T003 → T004 + T005 (T004 與 T005 可平行，但都依賴 T003)
```

**Phase 5 i18n 任務全部可平行執行**:

```
T008 ~ T022 所有語言檔案可同時編輯（不同檔案）
```

**Phase 3/4/6 可與 Phase 5 交錯進行**:

```
US1 完成 → 開始 US3 英文翻譯
US2 完成 → 繼續 US3 其他語言
US4 可與 US1/US2/US3 完全平行
```

---

## Parallel Example: Phase 5 i18n

```bash
# 所有 i18n 任務可同時啟動（不同檔案，無相依性）:
T008: media/locales/en/messages.js
T009: media/locales/zh-hant/messages.js
T010: media/locales/ja/messages.js
T011: media/locales/ko/messages.js
T012: media/locales/de/messages.js
T013: media/locales/fr/messages.js
T014: media/locales/es/messages.js
T015: media/locales/it/messages.js
T016: media/locales/pt-br/messages.js
T017: media/locales/ru/messages.js
T018: media/locales/pl/messages.js
T019: media/locales/tr/messages.js
T020: media/locales/hu/messages.js
T021: media/locales/bg/messages.js
T022: media/locales/cs/messages.js
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（關鍵 - 阻塞所有故事）
3. 完成 Phase 3: User Story 1 (I2C)
4. 完成 Phase 4: User Story 2 (UART)
5. **停止並驗證**: 獨立測試 I2C 與 UART tooltip（使用英文 fallback）
6. 可交付 MVP

### 完整交付

1. MVP 完成後繼續
2. 完成 Phase 5: User Story 3 (i18n) - 15 種語言翻譯
3. 完成 Phase 6: User Story 4 (工具箱間距)
4. 完成 Phase 7: 驗收與清理
5. 準備 PR

---

## i18n 翻譯參考

| 鍵名                         | English              | 繁體中文       |
| ---------------------------- | -------------------- | -------------- |
| `HUSKYLENS_I2C_PIN_HINT`     | `Wiring: `           | `接線：`       |
| `HUSKYLENS_UART_PIN_HINT`    | `Recommended pins: ` | `建議腳位：`   |
| `HUSKYLENS_UART_ANY_DIGITAL` | `Any digital pin`    | `任意數位腳位` |

---

## Notes

-   [P] 任務 = 不同檔案，無相依性
-   [Story] 標籤對應 spec.md 中的使用者故事
-   每個使用者故事可獨立完成與測試
-   每完成一個任務或邏輯群組後提交
-   可在任何 Checkpoint 停止驗證故事
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨故事相依
