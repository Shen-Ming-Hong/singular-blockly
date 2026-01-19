# Tasks: Blockly Language Selector

**Input**: Design documents from `/specs/030-language-selector/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 本功能規格未明確要求 TDD，僅包含必要的單元測試任務（Extension Host 邏輯 100% 覆蓋）。WebView UI 使用手動測試。

**Organization**: 任務按使用者故事組織，每個故事可獨立實作和測試。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可並行執行（不同檔案、無相依性）
- **[Story]**: 任務所屬的使用者故事（US1, US2, US3）
- 描述中包含確切檔案路徑

## Path Conventions

- **Extension Host**: `src/` (TypeScript)
- **WebView**: `media/` (HTML, CSS, JavaScript)
- **i18n**: `media/locales/*/messages.js`
- **Test**: `src/test/`

---

## Phase 1: Setup (共用基礎設施)

**Purpose**: 專案初始化和基本結構

- [ ] T001 [P] 在 src/types/language.ts 新增語言相關類型定義（SupportedLanguageCode, LanguageOption）
- [ ] T002 [P] 在 src/services/settingsManager.ts 新增語言設定常數 VALID_LANGUAGES 陣列

---

## Phase 2: Foundational (阻塞性前置條件)

**Purpose**: 所有使用者故事都依賴的核心基礎設施

**⚠️ CRITICAL**: 必須先完成此階段，才能開始任何使用者故事

- [ ] T003 在 src/services/settingsManager.ts 實作 getLanguage() 方法
- [ ] T004 在 src/services/settingsManager.ts 實作 updateLanguage() 方法
- [ ] T005 在 src/services/settingsManager.ts 實作 resolveLanguage() 方法（處理 "auto" 對應）
- [ ] T006 [P] 在 src/test/services/settingsManager.test.ts 新增語言設定相關單元測試

**Checkpoint**: 基礎設施完成 — 可以開始使用者故事實作

---

## Phase 3: User Story 1 — 為孩子選擇不同語言 (Priority: P1) 🎯 MVP

**Goal**: 使用者可以從下拉選單選擇語言，Blockly UI 即時切換，設定在重開後保持

**Independent Test**: 開啟 Blockly → 點擊語言按鈕 → 選擇語言 → 確認 UI 即時切換 → 關閉重開 → 確認語言設定保持

### Implementation for User Story 1

#### Extension Host 部分

- [ ] T007 [US1] 在 src/webview/messageHandler.ts 新增 handleUpdateLanguage() 處理 WebView 語言更新請求
- [ ] T008 [US1] 在 src/webview/messageHandler.ts 的 switch-case 中註冊 'updateLanguage' 訊息處理
- [ ] T009 [US1] 在 src/webview/webviewManager.ts 修改 init 訊息，加入 languagePreference 和 resolvedLanguage 欄位

#### WebView UI 部分

- [ ] T010 [P] [US1] 在 media/html/blocklyEdit.html 控制列新增語言按鈕 HTML 結構（位於開發板選單之後、主題按鈕之前）
- [ ] T011 [P] [US1] 在 media/css/blocklyEdit.css 新增語言按鈕和下拉選單樣式（32x32px 圓形按鈕、深淺色主題支援）
- [ ] T012 [US1] 在 media/js/blocklyEdit.js 新增語言選擇器互動邏輯（點擊展開/收合選單）
- [ ] T013 [US1] 在 media/js/blocklyEdit.js 實作 populateLanguageDropdown() 函數（生成 16 個語言選項）
- [ ] T014 [US1] 在 media/js/blocklyEdit.js 實作語言切換邏輯（呼叫 window.languageManager.setLanguage() 並發送 updateLanguage 訊息）
- [ ] T015 [US1] 在 media/js/blocklyEdit.js 處理 languageUpdated 訊息，更新 UI 當前選擇標記

#### i18n 部分

- [ ] T016 [P] [US1] 在 media/locales/en/messages.js 新增 LANGUAGE_SELECT_TOOLTIP 和 LANGUAGE_AUTO 鍵
- [ ] T017 [P] [US1] 在 media/locales/zh-hant/messages.js 新增語言選擇器 i18n 翻譯
- [ ] T018a [P] [US1] 在東亞語言 messages.js 新增語言選擇器翻譯（ja, ko）
- [ ] T018b [P] [US1] 在歐洲語言 messages.js 新增語言選擇器翻譯（es, fr, de, it, pt-br）
- [ ] T018c [P] [US1] 在其他語言 messages.js 新增語言選擇器翻譯（ru, pl, hu, cs, bg, tr）

**Checkpoint**: User Story 1 完成 — 語言切換功能可獨立測試

---

## Phase 4: User Story 2 — 設定儲存位置統一 (Priority: P2)

**Goal**: 清理 main.json 中的冗餘 theme 欄位，統一設定儲存到 settings.json

**Independent Test**: 檢查 main.json 不包含 theme 欄位 → 切換主題 → 檢查 settings.json 包含 singular-blockly.theme → 開啟舊專案 → 確認 theme 欄位被遷移

### Implementation for User Story 2

- [ ] T019 [US2] 在 src/webview/messageHandler.ts 修改 handleSaveWorkspace()，儲存時移除 theme 欄位
- [ ] T020 [US2] 在 src/webview/messageHandler.ts 新增 migrateThemeFromMainJson() 函數（一次性遷移舊資料）
- [ ] T021 [US2] 在 src/webview/messageHandler.ts 的載入邏輯中加入 theme 遷移檢查
- [ ] T022 [US2] 在 media/js/blocklyEdit.js 修改 saveWorkspace() 函數，移除 theme 欄位

**Checkpoint**: User Story 2 完成 — 設定儲存位置統一可獨立驗證

---

## Phase 5: User Story 3 — 語言選單 UI 體驗 (Priority: P3)

**Goal**: 語言選單直觀易用，與現有控制列風格一致

**Independent Test**: 視覺檢查控制列按鈕順序 → 深色/淺色主題下檢查樣式 → 懸停效果 → 當前選擇的 ✓ 標記顯示正確

### Implementation for User Story 3

- [ ] T023 [US3] 在 media/css/blocklyEdit.css 優化下拉選單動畫效果（展開/收合過渡）
- [ ] T024 [US3] 在 media/js/blocklyEdit.js 新增點擊選單外收合功能（document click 事件監聽）
- [ ] T025 [US3] 在 media/js/blocklyEdit.js 優化鍵盤可及性（Escape 鍵收合選單）

**Checkpoint**: User Story 3 完成 — UI 體驗優化可獨立驗證

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 影響多個使用者故事的改進

- [ ] T026 [P] 執行 npm run validate:i18n 確認所有 15 種語言翻譯完整
- [ ] T027 [P] 更新 docs/specifications/06-features/ 相關文件（如有需要）
- [ ] T028 執行 quickstart.md 驗證清單，確認所有功能正常運作
- [ ] T029 [P] 程式碼清理和 ESLint 修正

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ─────────────────────────────────────────────┐
         │                                                   │
         ▼                                                   │
Phase 2: Foundational ─────────────────────────────────────┐│
         │ (BLOCKS all user stories)                        ││
         ▼                                                  ││
Phase 3: User Story 1 (P1) 🎯 MVP ◄────────────────────────┘│
         │                                                   │
         ▼                                                   │
Phase 4: User Story 2 (P2)                                   │
         │                                                   │
         ▼                                                   │
Phase 5: User Story 3 (P3)                                   │
         │                                                   │
         ▼                                                   │
Phase 6: Polish ◄────────────────────────────────────────────┘
```

### User Story Dependencies

- **User Story 1 (P1)**: 依賴 Phase 2 完成 — 獨立於其他故事
- **User Story 2 (P2)**: 依賴 Phase 2 完成 — 可與 US1 並行
- **User Story 3 (P3)**: 依賴 US1 UI 結構（T010-T012）— 需在 US1 之後

### Within Each User Story

- Extension Host 邏輯優先於 WebView 實作
- 核心功能優先於優化
- i18n 可與實作並行

### Parallel Opportunities

**Phase 1 (全部可並行)**:

```bash
Task: T001 新增語言類型定義
Task: T002 新增語言設定常數
```

**Phase 2 (T006 可並行)**:

```bash
Task: T006 語言設定單元測試（與 T003-T005 並行開發）
```

**Phase 3 (部分可並行)**:

```bash
# Extension Host 部分（依序）
Task: T007 → T008 → T009

# WebView UI 部分（T010, T011 可並行）
Task: T010 HTML 結構
Task: T011 CSS 樣式
# 然後依序
Task: T012 → T013 → T014 → T015

# i18n 部分（全部可並行，且可與上述並行）
Task: T016 英文翻譯
Task: T017 繁體中文翻譯
Task: T018a 東亞語言翻譯 (ja, ko)
Task: T018b 歐洲語言翻譯 (es, fr, de, it, pt-br)
Task: T018c 其他語言翻譯 (ru, pl, hu, cs, bg, tr)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (CRITICAL — 阻塞所有故事)
3. 完成 Phase 3: User Story 1
4. **STOP and VALIDATE**: 獨立測試 User Story 1
5. 可發布 MVP 版本

### Incremental Delivery

1. Setup + Foundational → 基礎設施完成
2. User Story 1 → 獨立測試 → 發布/展示 (MVP!)
3. User Story 2 → 獨立測試 → 發布
4. User Story 3 → 獨立測試 → 發布
5. 每個故事都增加價值，不破壞先前功能

### Suggested MVP Scope

- **最小可行產品**: Phase 1 + Phase 2 + Phase 3 (共 20 個任務)
- **預估時間**: 4-6 小時（依 quickstart.md）
- **可交付成果**: 完整的語言切換功能，但不含設定遷移和 UI 優化

---

## Notes

- [P] 任務 = 不同檔案，無相依性
- [Story] 標籤將任務對應到特定使用者故事，便於追蹤
- 每個使用者故事應可獨立完成和測試
- 每個任務或邏輯群組完成後提交
- 在任何 Checkpoint 停下來獨立驗證故事
- 避免：模糊的任務、同檔案衝突、破壞獨立性的跨故事相依
