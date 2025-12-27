# Tasks: 修正 HuskyLens 積木 RX/TX 標籤顯示

**Input**: Design documents from `/specs/020-fix-huskylens-rxtx/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 本功能使用手動 WebView 測試 + i18n 驗證腳本，不需要額外的單元測試任務。

**Organization**: 任務按 User Story 分組，以便獨立實作和測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可並行執行（不同檔案、無依賴）
-   **[Story]**: 所屬 User Story（US1, US2, US3）
-   描述中包含確切檔案路徑

## Path Conventions

-   **積木定義**: `media/blockly/blocks/`
-   **語言檔案**: `media/locales/{lang}/messages.js`
-   **驗證腳本**: `scripts/i18n/`

---

## Phase 1: Setup (基礎準備)

**Purpose**: 確認現有程式碼結構和測試環境

-   [ ] T001 確認 HuskyLens UART 積木現有結構在 media/blockly/blocks/huskylens.js
-   [ ] T002 [P] 確認 window.currentBoard 和 window.getDigitalPinOptions() 可用性

---

## Phase 2: User Story 1 - 清晰的接線標籤指引 (Priority: P1) 🎯 MVP

**Goal**: 將 HuskyLens UART 積木的標籤從「RX 腳位」改為「連接 HuskyLens TX →」格式

**Independent Test**: 開啟 Blockly 編輯器，拖曳 HuskyLens UART 積木，觀察標籤文字是否清楚標示「連接 HuskyLens TX →」和「連接 HuskyLens RX →」

### 實作 User Story 1

-   [ ] T003 [P] [US1] 更新英語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/en/messages.js
-   [ ] T004 [P] [US1] 更新繁體中文訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/zh-hant/messages.js
-   [ ] T005 [P] [US1] 更新日語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/ja/messages.js
-   [ ] T006 [P] [US1] 更新韓語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/ko/messages.js
-   [ ] T007 [P] [US1] 更新德語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/de/messages.js
-   [ ] T008 [P] [US1] 更新法語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/fr/messages.js
-   [ ] T009 [P] [US1] 更新西班牙語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/es/messages.js
-   [ ] T010 [P] [US1] 更新巴西葡萄牙語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/pt-br/messages.js
-   [ ] T011 [P] [US1] 更新義大利語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/it/messages.js
-   [ ] T012 [P] [US1] 更新俄語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/ru/messages.js
-   [ ] T013 [P] [US1] 更新波蘭語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/pl/messages.js
-   [ ] T014 [P] [US1] 更新匈牙利語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/hu/messages.js
-   [ ] T015 [P] [US1] 更新土耳其語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/tr/messages.js
-   [ ] T016 [P] [US1] 更新保加利亞語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/bg/messages.js
-   [ ] T017 [P] [US1] 更新捷克語訊息 HUSKYLENS_RX_PIN 和 HUSKYLENS_TX_PIN 在 media/locales/cs/messages.js
-   [ ] T018 [US1] 執行 npm run validate:i18n 驗證所有語言檔案翻譯品質

**Checkpoint**: 此時所有 15 種語言的標籤應顯示新格式「連接 HuskyLens TX/RX →」

---

## Phase 3: User Story 2 - 智慧預設腳位選擇 (Priority: P2)

**Goal**: 根據當前開發板自動設定合適的預設腳位

**Independent Test**: 切換不同開發板後新增 HuskyLens UART 積木，檢查預設腳位是否對應該開發板的建議值

### 實作 User Story 2

-   [ ] T019 [US2] 在 media/blockly/blocks/huskylens.js 新增 HUSKYLENS_UART_DEFAULTS 預設腳位配置常數
-   [ ] T020 [US2] 在 media/blockly/blocks/huskylens.js 新增 getHuskyLensUARTDefaults() 輔助函式
-   [ ] T021 [US2] 修改 huskylens_init_uart 積木的 init() 在 media/blockly/blocks/huskylens.js 加入預設腳位設定邏輯
-   [ ] T022 [US2] 實作腳位驗證 fallback 邏輯（若預設腳位不在有效列表中，回退到第一個可用腳位）

**Checkpoint**: 此時 ESP32、Super Mini、AVR 開發板應自動設定正確的預設腳位

---

## Phase 4: User Story 3 - 向後相容舊工作區 (Priority: P1)

**Goal**: 確保舊版 main.json 中的 HuskyLens 積木腳位設定能正確還原

**Independent Test**: 載入含有舊版 HuskyLens UART 積木的 main.json 檔案，確認腳位值正確還原

### 實作 User Story 3

-   [ ] T023 [US3] 確認 RX_PIN 和 TX_PIN 欄位名稱在 media/blockly/blocks/huskylens.js 中保持不變
-   [ ] T024 [US3] 建立測試用舊版 main.json 檔案，含 HuskyLens UART 積木（RX_PIN: "10", TX_PIN: "11"）
-   [ ] T025 [US3] 驗證載入舊版 main.json 後，積木顯示新標籤但保留原本腳位設定

**Checkpoint**: 此時舊版工作區檔案應 100% 相容載入

---

## Phase 5: Polish & 跨領域關注

**Purpose**: 最終驗證和文件更新

-   [ ] T026 [P] 執行完整手動測試（參照 quickstart.md 測試指南）
-   [ ] T027 [P] 確認切換開發板後，已存在的積木腳位不會自動更改
-   [ ] T028 更新 CHANGELOG.md 記錄此修正

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **User Story 1 (Phase 2)**: 依賴 Setup 完成 - 可獨立完成
-   **User Story 2 (Phase 3)**: 依賴 Setup 完成 - 可獨立完成，與 US1 並行
-   **User Story 3 (Phase 4)**: 依賴 US2 完成（需要驗證欄位名稱和載入行為）
-   **Polish (Phase 5)**: 依賴所有 User Story 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 純 i18n 修改，與其他 Story 無程式碼依賴
-   **User Story 2 (P2)**: 需修改 huskylens.js，與 US1 無直接依賴
-   **User Story 3 (P1)**: 驗證性質，需要 US2 的預設腳位邏輯存在

### Parallel Opportunities

-   T001, T002 可並行（Phase 1）
-   T003-T017 全部可並行（15 個語言檔案修改，彼此獨立）
-   T026, T027 可並行（Phase 5）

---

## Parallel Example: User Story 1 (i18n 更新)

```powershell
# 所有語言檔案修改可同時進行：
Task: "更新英語訊息在 media/locales/en/messages.js"
Task: "更新繁體中文訊息在 media/locales/zh-hant/messages.js"
Task: "更新日語訊息在 media/locales/ja/messages.js"
# ... 其餘 12 種語言同時進行
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: User Story 1 (i18n 標籤更新)
3. **STOP and VALIDATE**: 測試標籤顯示是否正確
4. 若只需標籤修正，可先發布此階段

### Incremental Delivery

1. 完成 US1 → 標籤修正上線（最核心問題解決）
2. 加入 US2 → 智慧預設腳位（提升使用者體驗）
3. 加入 US3 驗證 → 確保相容性
4. 每個 Story 獨立增加價值

### 翻譯對照表（供 T003-T017 使用）

| 語言    | HUSKYLENS_RX_PIN                   | HUSKYLENS_TX_PIN                   |
| ------- | ---------------------------------- | ---------------------------------- |
| en      | `'Connect to HuskyLens TX →'`      | `'Connect to HuskyLens RX →'`      |
| zh-hant | `'連接 HuskyLens TX →'`            | `'連接 HuskyLens RX →'`            |
| ja      | `'HuskyLens TX に接続 →'`          | `'HuskyLens RX に接続 →'`          |
| ko      | `'HuskyLens TX에 연결 →'`          | `'HuskyLens RX에 연결 →'`          |
| de      | `'Mit HuskyLens TX verbinden →'`   | `'Mit HuskyLens RX verbinden →'`   |
| fr      | `'Connecter à HuskyLens TX →'`     | `'Connecter à HuskyLens RX →'`     |
| es      | `'Conectar a HuskyLens TX →'`      | `'Conectar a HuskyLens RX →'`      |
| pt-br   | `'Conectar ao HuskyLens TX →'`     | `'Conectar ao HuskyLens RX →'`     |
| it      | `'Connetti a HuskyLens TX →'`      | `'Connetti a HuskyLens RX →'`      |
| ru      | `'Подключить к HuskyLens TX →'`    | `'Подключить к HuskyLens RX →'`    |
| pl      | `'Połącz z HuskyLens TX →'`        | `'Połącz z HuskyLens RX →'`        |
| hu      | `'Csatlakozás HuskyLens TX-hez →'` | `'Csatlakozás HuskyLens RX-hez →'` |
| tr      | `'HuskyLens TX\'e bağlan →'`       | `'HuskyLens RX\'e bağlan →'`       |
| bg      | `'Свържи с HuskyLens TX →'`        | `'Свържи с HuskyLens RX →'`        |
| cs      | `'Připojit k HuskyLens TX →'`      | `'Připojit k HuskyLens RX →'`      |

### 預設腳位配置（供 T019 使用）

```javascript
const HUSKYLENS_UART_DEFAULTS = {
	esp32: { rx: '16', tx: '17' },
	supermini: { rx: '20', tx: '21' },
	uno: { rx: '2', tx: '3' },
	nano: { rx: '2', tx: '3' },
	mega: { rx: '2', tx: '3' },
};
```

---

## Notes

-   [P] 任務 = 不同檔案、無依賴，可並行執行
-   [Story] 標籤對應特定 User Story 以便追蹤
-   土耳其語翻譯中的單引號需跳脫為 `\'`
-   欄位名稱 `RX_PIN`/`TX_PIN` 絕對不可更改（向後相容性）
-   每個任務完成後提交
-   任何檢查點都可暫停驗證
