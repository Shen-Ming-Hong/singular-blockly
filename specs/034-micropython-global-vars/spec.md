# Feature Specification: MicroPython 全域變數提升

**Feature Branch**: `034-micropython-global-vars`  
**Created**: 2026-01-22  
**Status**: Draft  
**Input**: User description: "MicroPython 全域變數提升 - 將使用者變數從 main() 提升到全域區段，讓自訂函式可存取"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 自訂函式修改變數 (Priority: P1)

學生建立一個變數 `count`，在 main 中設定初始值，然後在自訂函式 `increment` 中將 count 加 1。目前這會產生 `UnboundLocalError`，修改後應該正常運作。

**Why this priority**: 這是最核心的使用情境，學生最常遇到的問題就是自訂函式無法存取 main 中設定的變數。

**Independent Test**: 建立變數積木、自訂函式積木、在函式內賦值，驗證生成的程式碼可正確執行。

**Acceptance Scenarios**:

1. **Given** 使用者建立變數 `count` 並在 main 中設定 `count = 0`，**When** 自訂函式 `increment` 內有 `count = count + 1`，**Then** 生成的程式碼包含 `global count` 宣告且執行正確
2. **Given** 使用者在 main 中設定變數後呼叫自訂函式，**When** 函式內修改該變數，**Then** main 中印出變數時反映修改後的值

---

### User Story 2 - 自訂函式只讀取變數 (Priority: P1)

學生建立變數 `score` 並在 main 中設定值，自訂函式 `show_score` 只印出 score（不賦值）。這應該正常運作且不需要 `global` 宣告。

**Why this priority**: 只讀取是常見情境，且不應產生不必要的 `global` 宣告。

**Independent Test**: 建立變數積木、自訂函式積木、在函式內只讀取變數，驗證生成的程式碼無 `global` 且可執行。

**Acceptance Scenarios**:

1. **Given** 使用者在 main 中設定 `score = 100`，**When** 自訂函式只有 `print(score)`（無賦值），**Then** 生成的程式碼該函式內無 `global` 宣告
2. **Given** 函式只讀取變數，**When** 執行程式，**Then** 正確印出變數值

---

### User Story 3 - 迴圈變數不提升 (Priority: P2)

學生使用 `for i in range(10)` 迴圈，迴圈變數 `i` 應維持區域變數，不應提升到全域區段。

**Why this priority**: 避免污染全域命名空間，符合 Python 慣例。

**Independent Test**: 使用計數迴圈積木，驗證 `i` 不出現在 Global Variables 區段。

**Acceptance Scenarios**:

1. **Given** 使用者使用 `controls_for` 積木建立迴圈，**When** 生成程式碼，**Then** 迴圈變數不出現在 `[3] Global Variables` 區段
2. **Given** 使用者同時有迴圈變數 `i` 和一般變數 `count`，**When** 生成程式碼，**Then** 只有 `count` 出現在全域區段

---

### User Story 4 - 多個函式共享變數 (Priority: P2)

學生建立多個自訂函式，都需要讀取或修改同一個變數。

**Why this priority**: 進階使用情境，驗證機制在多函式情況下正確運作。

**Independent Test**: 建立兩個以上函式都修改同一變數，驗證都有正確的 `global` 宣告。

**Acceptance Scenarios**:

1. **Given** 兩個函式 `add` 和 `subtract` 都修改變數 `total`，**When** 生成程式碼，**Then** 兩個函式內都有 `global total` 宣告
2. **Given** 變數在全域區段宣告，**When** 多個函式順序執行修改，**Then** 變數值正確累積

---

### Edge Cases

- 函式參數與全域變數同名時，參數優先（區域變數），不插入 `global`
- 函式內既讀取又賦值同一變數，只需一個 `global` 宣告
- 空的自訂函式（無任何積木），不產生任何 `global` 宣告
- `controls_forEach` 的迴圈變數也應排除，不提升到全域

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統 MUST 在 `variables_set` 積木生成時，自動呼叫 `addVariable(varName, 'None')` 將變數註冊到全域區段
- **FR-002**: 系統 MUST 追蹤目前正在生成哪個函式（`currentFunction_`），預設為 `'main'`
- **FR-003**: 系統 MUST 追蹤每個函式內有賦值的變數（`functionGlobals_`: Map&lt;funcName, Set&lt;varName&gt;&gt;）
- **FR-004**: 系統 MUST 在函式生成時，於函式開頭插入 `global x, y` 宣告（若有追蹤到該函式的變數）
- **FR-005**: 系統 MUST 在 `def main():` 開頭插入 `global` 宣告（若 main 內有變數賦值）
- **FR-006**: 系統 MUST 排除迴圈變數（`controls_for`、`controls_forEach` 的 VAR 欄位），不呼叫 `addVariable()`
- **FR-007**: 系統 MUST 在 `finish()` 時重置 `currentFunction_` 和 `functionGlobals_` 狀態
- **FR-008**: 系統 MUST 在 `init()` 時初始化追蹤結構

### Key Entities

- **currentFunction\_**: 字串，記錄目前正在生成的函式名稱，預設 `'main'`
- **functionGlobals\_**: Map，key 為函式名稱，value 為該函式內有賦值的變數名稱 Set
- **variables\_**: 既有 Map，儲存全域變數宣告（name → {name, initialValue}）

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 學生建立變數並在自訂函式內修改時，生成的程式碼可正確執行，無 `UnboundLocalError`
- **SC-002**: 只讀取變數的函式，生成的程式碼無不必要的 `global` 宣告
- **SC-003**: 迴圈變數不出現在 `[3] Global Variables` 區段
- **SC-004**: 100% 現有 MicroPython 測試案例維持通過（無回歸）
- **SC-005**: 新增至少 4 個測試案例涵蓋：全域宣告位置、global 插入條件、迴圈變數排除、多函式共享

## Assumptions

- 使用 `None` 作為變數初始值，符合 Python 慣例
- 不處理巢狀函式（Blockly 不支援）
- 函式參數與全域變數同名時，Python 自動優先使用參數（區域），不需特別處理
