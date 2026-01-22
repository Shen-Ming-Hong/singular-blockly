# Tasks: MicroPython 全域變數提升

**Input**: Design documents from `/specs/034-micropython-global-vars/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: 本功能使用手動測試（符合 Constitution VII UI Testing Exception）

**Organization**: 任務按 User Story 分組，支援獨立實作與測試

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可平行執行（不同檔案、無依賴）
- **[Story]**: 對應的 User Story（US1, US2, US3, US4）
- 包含確切檔案路徑

## Path Conventions

- **Source**: `media/blockly/generators/micropython/`

---

## Phase 1: Setup（基礎設施）

**Purpose**: 新增追蹤結構到核心生成器

- [X] T001 在 `media/blockly/generators/micropython/index.js` 新增 `currentFunction_` 屬性宣告
- [X] T002 在 `media/blockly/generators/micropython/index.js` 新增 `functionGlobals_` 屬性宣告
- [X] T003 在 `media/blockly/generators/micropython/index.js` 的 `init()` 函式中初始化追蹤結構
- [X] T004 在 `media/blockly/generators/micropython/index.js` 的 `reset()` 函式中清理追蹤結構

**Checkpoint**: 追蹤結構已建立，可開始修改積木生成器

---

## Phase 2: Foundational（核心機制）

**Purpose**: 修改 `variables_set` 積木，啟用變數追蹤

**⚠️ CRITICAL**: 此階段完成後所有 User Story 才能運作

- [X] T005 修改 `media/blockly/generators/micropython/variables.js` 的 `variables_set`：呼叫 `addVariable(varName, 'None')`
- [X] T006 修改 `media/blockly/generators/micropython/variables.js` 的 `variables_set`：將變數加入 `functionGlobals_` 追蹤

**Checkpoint**: 變數賦值現在會自動註冊到全域區段並追蹤函式歸屬

---

## Phase 3: User Story 1 - 自訂函式修改變數 (Priority: P1) 🎯 MVP

**Goal**: 讓自訂函式可以修改 main 中設定的變數

**Independent Test**: 建立變數 + 自訂函式修改變數 → 生成程式碼包含 `global` 宣告

### Implementation for User Story 1

- [X] T007 [US1] 修改 `media/blockly/generators/micropython/functions.js` 的 `procedures_defnoreturn`：生成前設定 `currentFunction_`
- [X] T008 [US1] 修改 `media/blockly/generators/micropython/functions.js` 的 `procedures_defnoreturn`：生成後還原 `currentFunction_`
- [X] T009 [US1] 修改 `media/blockly/generators/micropython/functions.js` 的 `procedures_defnoreturn`：查詢 `functionGlobals_` 並插入 `global` 宣告
- [X] T010 [P] [US1] 修改 `media/blockly/generators/micropython/functions.js` 的 `procedures_defreturn`：同步套用 T007-T009 的修改
- [X] T011 [P] [US1] 修改 `media/blockly/generators/micropython/functions.js` 的 `arduino_function`：同步套用 T007-T009 的修改
- [X] T012 [US1] 修改 `media/blockly/generators/micropython/index.js` 的 `finish()`：在 `def main():` 後插入 `global` 宣告

**Checkpoint**: 自訂函式內修改變數可正確生成 `global` 宣告 ✅

---

## Phase 4: User Story 2 - 自訂函式只讀取變數 (Priority: P1)

**Goal**: 只讀取變數的函式不產生 `global` 宣告

**Independent Test**: 建立變數 + 自訂函式只印出變數 → 生成程式碼無 `global`

### Implementation for User Story 2

- [X] T013 [US2] 驗證 `media/blockly/generators/micropython/variables.js` 的 `variables_get` 未追蹤變數（現況正確，確認即可）
- [X] T014 [US2] 手動測試：建立只讀取變數的函式，確認無 `global` 宣告

**Checkpoint**: 只讀取變數的函式無不必要的 `global` ✅

---

## Phase 5: User Story 3 - 迴圈變數不提升 (Priority: P2)

**Goal**: 迴圈變數維持區域變數，不污染全域

**Independent Test**: 使用 `controls_for` 迴圈 → 迴圈變數不出現在 Global Variables 區段

### Implementation for User Story 3

- [X] T015 [US3] 確認 `media/blockly/generators/micropython/loops.js` 的 `controls_for` 未呼叫 `addVariable()`（現況正確）
- [X] T016 [US3] 確認 `media/blockly/generators/micropython/loops.js` 的 `controls_forEach` 未呼叫 `addVariable()`（現況正確）
- [X] T017 [US3] 手動測試：使用迴圈積木，確認迴圈變數不出現在 `[3] Global Variables`

**Checkpoint**: 迴圈變數不會被提升到全域 ✅

---

## Phase 6: User Story 4 - 多個函式共享變數 (Priority: P2)

**Goal**: 多個函式都能正確存取同一變數

**Independent Test**: 建立兩個函式都修改同一變數 → 兩個函式都有 `global` 宣告

### Implementation for User Story 4

- [X] T018 [US4] 手動測試：建立兩個函式 `add` 和 `subtract` 都修改變數 `total`
- [X] T019 [US4] 驗證兩個函式都有 `global total` 宣告
- [X] T020 [US4] 驗證變數值在多個函式順序執行後正確累積

**Checkpoint**: 多個函式可共享變數並正確修改 ✅

---

## Phase 7: Polish & 驗收

**Purpose**: 確認無回歸並完成驗收

- [X] T021 [P] 確認現有 MicroPython 積木生成無回歸（執行現有測試）
- [X] T022 [P] 執行 quickstart.md 的 3 個測試案例
- [X] T023 更新 console.log 訊息（若有新增）
- [X] T024 程式碼審查：確認符合 Constitution 原則

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 無依賴 - 可立即開始
- **Phase 2 (Foundational)**: 依賴 Phase 1 - **阻擋所有 User Story**
- **Phase 3-6 (User Stories)**: 依賴 Phase 2 完成
    - US1 和 US2 可平行進行
    - US3 和 US4 可平行進行
- **Phase 7 (Polish)**: 依賴所有 User Story 完成

### User Story Dependencies

- **US1 (P1)**: 核心功能 - 無依賴其他 Story
- **US2 (P1)**: 驗證行為 - 與 US1 平行
- **US3 (P2)**: 驗證行為 - 與 US4 平行
- **US4 (P2)**: 進階測試 - 與 US3 平行

### Parallel Opportunities

```bash
# Phase 1 可平行:
T001, T002 可同時進行（不同程式碼位置）

# Phase 3 可平行:
T010, T011 可同時進行（不同函式定義積木）

# Phase 7 可平行:
T021, T022 可同時進行（不同測試類型）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup（T001-T004）
2. 完成 Phase 2: Foundational（T005-T006）
3. 完成 Phase 3: User Story 1（T007-T012）
4. **驗證**: 自訂函式內修改變數可正確執行
5. 若 MVP 足夠，可先發布

### Incremental Delivery

1. Setup + Foundational → 基礎完成
2. 加入 US1 → 測試 → **MVP 可發布**
3. 加入 US2 → 驗證只讀行為
4. 加入 US3 → 驗證迴圈變數排除
5. 加入 US4 → 驗證多函式共享
6. Polish → 完整發布

---

## Summary

| 類別                   | 任務數 |
| ---------------------- | ------ |
| Setup (Phase 1)        | 4      |
| Foundational (Phase 2) | 2      |
| User Story 1 (P1)      | 6      |
| User Story 2 (P1)      | 2      |
| User Story 3 (P2)      | 3      |
| User Story 4 (P2)      | 3      |
| Polish (Phase 7)       | 4      |
| **總計**               | **24** |

**平行機會**: T001-T002, T010-T011, T021-T022  
**MVP 範圍**: T001-T012（12 個任務）  
**每個 User Story 可獨立測試驗證** ✅
