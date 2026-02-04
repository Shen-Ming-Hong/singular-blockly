---
description: '修復 CyberBrick Print 積木換行控制 - 任務列表'
---

# Tasks: 修復 text_print 積木換行控制

**Feature Branch**: `039-fix-print-newline`  
**Input**: Design documents from `/specs/039-fix-print-newline/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 本功能採用文件化測試策略（符合憲章 Principle VII UI Testing Exception）。測試任務包含在實作階段中。

**Organization**: 任務按用戶故事組織，每個故事可獨立實作和驗證。

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **- [ ]**: Markdown checkbox（必須）
- **[ID]**: 任務編號（T001, T002...，按執行順序）
- **[P]**: 可並行執行（不同檔案，無依賴）
- **[Story]**: 用戶故事標籤（US1, US2, US3）
- **Description**: 清晰的動作描述，包含確切的檔案路徑

---

## Phase 1: Setup

**Purpose**: 專案初始化（本功能無需 Setup，專案已存在）

**Status**: ✅ 跳過（專案結構已完整）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心基礎設施（本功能無需 Foundational，所有依賴已就緒）

**Status**: ✅ 跳過（Blockly、MicroPython Generator 架構已完整）

---

## Phase 3: User Story 1 - 控制連續輸出是否換行 (Priority: P1) 🎯 MVP

**Goal**: 修復 MicroPython 版本的 `text_print` 積木 NEW_LINE checkbox 功能，使其能正確控制輸出是否換行。

**Independent Test**: 建立兩個 print 積木，第一個輸入 "Progress: "，取消勾選換行；第二個輸入 "100%"，勾選換行。產生程式碼並上傳到 CyberBrick，觀察終端機是否顯示 "Progress: 100%"（在同一行）。

### 文件化測試 (Documentation Tests)

> **NOTE**: 這些測試記錄預期的程式碼格式，實際驗證透過手動測試完成（符合專案測試策略）

- [ ] T001 [US1] 建立文件化測試檔案 `src/test/suite/text-print-generation.test.ts`
- [ ] T002 [P] [US1] 新增測試案例「NEW_LINE = TRUE: 應生成 print(msg)」使用正則表達式 `/^print\("Hello"\)$/` 記錄預期格式
- [ ] T003 [P] [US1] 新增測試案例「NEW_LINE = FALSE: 應生成 print(msg, end="")」使用正則表達式 `/^print\("World", end=""\)$/` 記錄預期格式
- [ ] T004 [P] [US1] 新增測試案例「空輸入: 應使用預設值 ""」記錄空輸入時的行為
- [ ] T005 [P] [US1] 新增測試案例「變數輸入: 不應加引號」使用正則表達式 `/^print\([a-zA-Z_][a-zA-Z0-9_]*\)$/` 驗證變數處理

### 核心實作

- [ ] T006 [US1] 修改 `media/blockly/generators/micropython/text.js` 檔案中的 `text_print` generator 函數
- [ ] T007 [US1] 在 generator 函數中新增欄位讀取邏輯：`const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';`
- [ ] T008 [US1] 修改 return 語句為條件式生成：``return `print(${msg}${newLine ? '' : ', end=""'})`;``

### 手動驗證

- [ ] T009 [US1] 重新載入 Extension Development Host（Ctrl+Shift+F5）確保修改生效
- [ ] T010 [US1] 建立測試專案：選擇 CyberBrick 板子，專案名稱 `test-print-newline`
- [ ] T011 [US1] 建立測試積木序列：text_print("A", NEW_LINE=☐) → text_print("B", NEW_LINE=☐) → text_print("C", NEW_LINE=☑)
- [ ] T012 [US1] 檢查生成的 `main.py` 是否包含正確的程式碼（`print("A", end="")`、`print("B", end="")`、`print("C")`）
- [ ] T013 [US1] 上傳到 CyberBrick 硬體，開啟終端機監控，驗證輸出為 "ABC"（在同一行）

**Checkpoint**: User Story 1 完成 - NEW_LINE checkbox 功能已修復並通過驗證

---

## Phase 4: User Story 2 - 與 Arduino 版本行為一致 (Priority: P2)

**Goal**: 確保 MicroPython 和 Arduino 版本的 print 積木在相同 checkbox 設定下，終端機輸出行為保持一致。

**Independent Test**: 建立包含 print 積木的 Blockly 工作區，分別切換到 Arduino Uno 和 CyberBrick 板子，檢查產生的程式碼邏輯是否對等。

### 跨平台一致性驗證

- [ ] T014 [US2] 開啟 `media/blockly/generators/arduino/text.js` 檔案作為參考，確認 Arduino 版本的實作模式
- [ ] T015 [US2] 建立對照測試專案：在同一個 workspace 中建立 print 積木（NEW_LINE 勾選和取消勾選各一）
- [ ] T016 [US2] 切換板子為 Arduino Uno，檢查生成的程式碼：勾選換行應產生 `Serial.println(msg)`，取消勾選應產生 `Serial.print(msg)`
- [ ] T017 [US2] 切換板子為 CyberBrick，檢查生成的程式碼：勾選換行應產生 `print(msg)`，取消勾選應產生 `print(msg, end="")`
- [ ] T018 [US2] 在文件化測試中新增跨平台等價性註解，記錄 Arduino 和 MicroPython 的邏輯映射關係

**Checkpoint**: User Story 2 完成 - 跨平台行為一致性已驗證

---

## Phase 5: User Story 3 - 單元測試與程式碼品質 (Priority: P3)

**Goal**: 確保修復後的程式碼有完整的測試覆蓋，維持專案程式碼品質標準。

**Independent Test**: 執行 `npm run test` 和 `npm run test:coverage`，檢查測試覆蓋率是否達標（90%+ 專案標準）。

### 測試品質驗證

- [ ] T019 [US3] 執行 `npm run test` 確認所有測試通過（包括新增的文件化測試）
- [ ] T020 [US3] 執行 `npm run test:coverage` 生成覆蓋率報告，檢查整體覆蓋率是否維持在 90% 以上
- [ ] T021 [US3] 檢查 `coverage/` 目錄中的報告，驗證 `text-print-generation.test.ts` 的測試案例完整性
- [ ] T022 [US3] 執行 ESLint 檢查：`npm run lint` 確保修改的程式碼符合程式碼風格規範

### 文件更新

- [ ] T023 [P] [US3] 在 `CHANGELOG.md` 中記錄變更：「修復 CyberBrick text_print 積木的 NEW_LINE checkbox 功能」
- [ ] T024 [P] [US3] 更新 `quickstart.md` 中的測試驗證步驟（如果有需要補充的細節）

**Checkpoint**: User Story 3 完成 - 測試覆蓋率和程式碼品質已達標

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 最終驗證和文件完善

- [ ] T025 [P] 執行完整的 quickstart.md 驗證流程，確認所有步驟都能正確執行
- [ ] T026 [P] 執行 `npm run validate:i18n` 確認多語言翻譯完整性（積木定義和 i18n 無需修改，但需驗證無破壞）
- [ ] T027 [P] 在 Extension Development Host 中測試所有支援的板子（Arduino Uno, ESP32, CyberBrick）確認無迴歸問題
- [ ] T028 Code review 自我檢查：使用 `.github/skills/code-simplifier/SKILL.md` 檢視修改的程式碼是否符合簡潔性原則

**Final Checkpoint**: 功能完整、測試通過、文件完善，準備建立 PR

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ 跳過（專案已存在）
- **Foundational (Phase 2)**: ✅ 跳過（無需基礎設施變更）
- **User Story 1 (Phase 3)**: 無依賴，可立即開始 - **這是 MVP 的唯一必要階段**
- **User Story 2 (Phase 4)**: 依賴 User Story 1 完成
- **User Story 3 (Phase 5)**: 依賴 User Story 1 完成
- **Polish (Phase 6)**: 依賴所有 User Stories 完成

### User Story Dependencies

- **User Story 1 (P1)**: 無依賴 - 獨立實作和測試 ✅
- **User Story 2 (P2)**: 依賴 US1 (需要 US1 修復完成才能驗證一致性)
- **User Story 3 (P3)**: 依賴 US1 (需要 US1 程式碼才能測試覆蓋率)

### Within Each User Story

**User Story 1**:

1. 文件化測試 (T001-T005) → 所有測試任務可並行
2. 核心實作 (T006-T008) → 必須按順序（修改同一個函數）
3. 手動驗證 (T009-T013) → 必須在實作完成後按順序執行

**User Story 2**:

1. 所有驗證任務 (T014-T018) → 必須按順序（需要切換板子和檢查輸出）

**User Story 3**:

1. 測試品質驗證 (T019-T022) → 可並行執行（不同指令）
2. 文件更新 (T023-T024) → 可並行執行（不同檔案）

### Parallel Opportunities

#### Setup Phase（無並行機會，已跳過）

#### Foundational Phase（無並行機會，已跳過）

#### User Story 1 - Phase 3

```bash
# 並行機會 1: 所有文件化測試可同時建立（不同測試案例）
並行執行:
  T002: 新增測試案例「NEW_LINE = TRUE: 應生成 print(msg)」
  T003: 新增測試案例「NEW_LINE = FALSE: 應生成 print(msg, end="")」
  T004: 新增測試案例「空輸入: 應使用預設值 ""」
  T005: 新增測試案例「變數輸入: 不應加引號」
```

**注意**: 核心實作 (T006-T008) 和手動驗證 (T009-T013) **無法並行**，因為它們修改同一個函數且需要按順序驗證。

#### User Story 2 - Phase 4

**無並行機會** - 所有驗證任務需要按順序執行（切換板子 → 檢查程式碼 → 記錄結果）

#### User Story 3 - Phase 5

```bash
# 並行機會 2: 測試品質驗證（不同的 npm 指令）
並行執行:
  T019: npm run test
  T020: npm run test:coverage
  T022: npm run lint

# 並行機會 3: 文件更新（不同檔案）
並行執行:
  T023: 更新 CHANGELOG.md
  T024: 更新 quickstart.md
```

#### Polish Phase - Phase 6

```bash
# 並行機會 4: 最終驗證（獨立任務）
並行執行:
  T025: 執行 quickstart.md 驗證
  T026: npm run validate:i18n
  T027: 測試所有支援板子
  T028: Code review 自我檢查
```

---

## Parallel Example: User Story 1

### Parallel Batch 1: 文件化測試（4 個任務可同時進行）

```bash
# T002, T003, T004, T005 可並行執行，因為它們是不同的測試案例
Task T002: 新增測試案例「NEW_LINE = TRUE: 應生成 print(msg)」使用正則表達式
Task T003: 新增測試案例「NEW_LINE = FALSE: 應生成 print(msg, end="")」使用正則表達式
Task T004: 新增測試案例「空輸入: 應使用預設值 ""」記錄預期行為
Task T005: 新增測試案例「變數輸入: 不應加引號」使用正則表達式
```

### Sequential: 核心實作（必須按順序）

```bash
# T006 → T007 → T008 必須按順序執行（修改同一個函數）
T006: 修改 media/blockly/generators/micropython/text.js
T007: 新增欄位讀取邏輯
T008: 修改 return 語句為條件式生成
```

### Sequential: 手動驗證（必須按順序）

```bash
# T009 → T010 → T011 → T012 → T013 必須按順序執行（驗證流程）
T009: 重新載入 Extension Development Host
T010: 建立測試專案
T011: 建立測試積木序列
T012: 檢查生成的程式碼
T013: 上傳到硬體並驗證終端機輸出
```

---

## Implementation Strategy

### MVP First (僅 User Story 1)

**最小可行產品 (MVP) 範圍**: 僅實作 Phase 3: User Story 1

```bash
1. 建立文件化測試檔案 (T001)
2. 並行新增所有測試案例 (T002-T005)
3. 修改 MicroPython Generator (T006-T008)
4. 手動驗證功能 (T009-T013)
```

**MVP 驗證**: 建立 print 積木，取消勾選 NEW_LINE，檢查是否產生 `print(msg, end="")`

**MVP 部署**: 可立即合併到 master，User Story 2 和 3 可作為後續改進

### Incremental Delivery（漸進式交付）

```bash
# Sprint 1: MVP (最高優先級)
Phase 3: User Story 1
→ 測試獨立性: ✅ 建立 print 積木並驗證程式碼格式
→ 部署/Demo: ✅ 可展示 NEW_LINE checkbox 功能正常

# Sprint 2: 跨平台一致性
Phase 4: User Story 2
→ 測試獨立性: ✅ 切換不同板子並驗證行為對等
→ 部署/Demo: ✅ 可展示 Arduino 和 MicroPython 的行為一致

# Sprint 3: 品質提升
Phase 5: User Story 3
→ 測試獨立性: ✅ 執行測試覆蓋率檢查
→ 部署/Demo: ✅ 可展示測試覆蓋率達標（90%+）

# Final Sprint: 完善與發布
Phase 6: Polish
→ 最終驗證: ✅ 執行完整 quickstart 驗證
→ 準備發布: ✅ 更新 CHANGELOG 並建立 PR
```

### Parallel Team Strategy（多人並行策略）

**適用情境**: 如果有多位開發者，可在 Foundational 階段完成後並行工作

```bash
# 注意: 本功能較小，不建議多人並行（易產生合併衝突）

# 如果必須並行（例如學習目的）:
Developer A: Phase 3 (User Story 1) - 核心功能修復
Developer B: Phase 5 (User Story 3) - 準備測試基礎架構（不執行，等待 A 完成）
Developer C: Phase 4 (User Story 2) - 研究 Arduino 實作（不修改，等待 A 完成）

# 推薦策略: 單一開發者循序執行（預估總時間: 30 分鐘）
```

---

## Task Summary

| Phase                       | 任務數量 | 可並行數量 | 預估時間    |
| --------------------------- | -------- | ---------- | ----------- |
| Phase 1: Setup              | 0        | 0          | 0 分鐘      |
| Phase 2: Foundational       | 0        | 0          | 0 分鐘      |
| Phase 3: User Story 1 (MVP) | 13       | 4 (測試)   | 20 分鐘     |
| Phase 4: User Story 2       | 5        | 0          | 10 分鐘     |
| Phase 5: User Story 3       | 6        | 5 (驗證)   | 10 分鐘     |
| Phase 6: Polish             | 4        | 4 (全部)   | 10 分鐘     |
| **Total**                   | **28**   | **13**     | **50 分鐘** |

**MVP 範圍**: 13 個任務（僅 Phase 3）- 預估 20 分鐘  
**完整功能**: 28 個任務（所有 Phase）- 預估 50 分鐘

**並行加速潛力**:

- 若 4 個文件化測試並行: 節省約 8 分鐘
- 若 Phase 3 測試驗證並行: 節省約 5 分鐘
- 若 Polish 階段並行: 節省約 6 分鐘
- **最佳情境總時間**: 約 30 分鐘（單一開發者，充分利用並行）

---

## Notes

- **[P] 標記**: 表示任務操作不同檔案或為獨立驗證步驟，可並行執行
- **[Story] 標籤**: 追蹤任務所屬用戶故事（US1, US2, US3）
- **獨立可測試**: 每個用戶故事完成後都可獨立驗證功能
- **測試策略**: 先寫文件化測試（記錄預期格式），再實作（確保理解正確）
- **Commit 建議**: 每完成一個用戶故事後 commit（T013 後, T018 後, T024 後）
- **Checkpoint 驗證**: 在每個 Checkpoint 處暫停並執行獨立測試，確保用戶故事完整
- **避免陷阱**:
    - ❌ 不要跳過測試步驟（文件化測試也是規格文件）
    - ❌ 不要同時修改多個 generator 檔案（易產生衝突）
    - ❌ 不要跳過手動驗證（硬體行為是最終標準）

---

**Tasks Version**: 1.0  
**Generated**: 2026年2月4日  
**Status**: ✅ Ready for Implementation  
**Next Step**: 執行 Phase 3: User Story 1（MVP）開始實作
