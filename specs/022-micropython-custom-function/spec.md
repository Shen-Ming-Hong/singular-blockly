# Feature Specification: MicroPython Custom Function Generator

**Feature Branch**: `022-micropython-custom-function`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "Fix CyberBrick Python mode custom function code generation - arduino_function and arduino_function_call blocks need MicroPython generators"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 自訂函數生成 Python 代碼 (Priority: P1)

作為一個使用 CyberBrick Python 模式的學生，我希望能建立自訂函數並在程式中呼叫它們，這樣我可以將重複的邏輯封裝成可重用的函數區塊。

**Why this priority**: 這是核心功能，沒有它使用者無法在 CyberBrick Python 模式下使用自訂函數，會直接導致錯誤。

**Independent Test**: 在 CyberBrick Python 模式建立一個自訂函數並呼叫，確認生成的 Python 代碼語法正確且可執行。

**Acceptance Scenarios**:

1. **Given** 使用者在 CyberBrick Python 模式下，**When** 建立一個無參數的自訂函數 `myFunction` 並在主程式中呼叫，**Then** 系統生成正確的 Python `def myFunction():` 函數定義與 `myFunction()` 呼叫語句
2. **Given** 使用者已建立自訂函數，**When** 點擊「上傳」或「生成代碼」按鈕，**Then** 不會出現 "MicroPython generator does not know how to generate code" 錯誤

---

### User Story 2 - 帶參數的自訂函數 (Priority: P1)

作為一個使用 CyberBrick 的學生，我希望能為自訂函數定義參數，這樣我可以建立更靈活、可重用的函數。

**Why this priority**: 參數是自訂函數的核心能力，沒有參數支援會大幅限制函數的實用性。

**Independent Test**: 建立一個帶有 2 個參數的自訂函數，在呼叫時傳入不同的值，確認生成代碼正確處理參數。

**Acceptance Scenarios**:

1. **Given** 使用者建立了帶參數 `speed` 和 `direction` 的自訂函數 `moveMotor`，**When** 生成代碼，**Then** 系統產生 `def moveMotor(speed, direction):` 格式的函數定義
2. **Given** 使用者在主程式中呼叫 `moveMotor` 並傳入數值積木 `100` 和 `1`，**When** 生成代碼，**Then** 系統產生 `moveMotor(100, 1)` 的呼叫語句

---

### User Story 3 - 函數定義位置正確 (Priority: P2)

作為一個使用 CyberBrick Python 模式的學生，我希望函數定義出現在程式的正確位置（頂層），而不是被包裹在其他程式碼區塊內。

**Why this priority**: Python 函數定義必須在頂層才能被正確呼叫，若被包在 `micropython_main` 內會導致作用域錯誤。

**Independent Test**: 建立函數並在主程式呼叫，檢查生成代碼的結構是否符合 Python 語法規範。

**Acceptance Scenarios**:

1. **Given** 使用者建立了自訂函數 `blink` 和主程式區塊，**When** 生成代碼，**Then** `def blink():` 出現在 `# [4] User Functions` 區塊，位於 `# [5] Main Program` 之前
2. **Given** 工作區同時有多個自訂函數，**When** 生成代碼，**Then** 所有函數定義都在 `# [4] User Functions` 區塊，不會被嵌套在其他函數或區塊內

---

### Edge Cases

-   自訂函數名稱包含中文字元時：保留原始中文名稱，Python 3 支援 Unicode 識別符
-   自訂函數內沒有任何語句時，應生成 `pass` 以避免 Python 語法錯誤
-   函數參數數量為 0 時，應正確生成空括號 `def funcName():`
-   函數呼叫時參數未連接值積木時，MUST 使用 `None` 作為預設值（如 `funcName(100, None)`）
-   多個函數的生成順序：按工作區積木順序（由上到下、由左到右）
-   函數定義 MUST 輸出至程式碼的 `# [4] User Functions` 區塊（即主程式 `# [5] Main Program` 之前）

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統 MUST 為 `arduino_function` 積木提供 MicroPython 代碼生成器
-   **FR-002**: 系統 MUST 為 `arduino_function_call` 積木提供 MicroPython 代碼生成器
-   **FR-003**: 生成器 MUST 正確讀取 `block.arguments_` 陣列以取得參數名稱
-   **FR-004**: 函數定義 MUST 生成為 Python `def funcName(arg1, arg2):` 格式（忽略型別）
-   **FR-005**: 空函數體 MUST 生成 `pass` 語句以符合 Python 語法
-   **FR-006**: `arduino_function` MUST 被加入 `allowedTopLevelBlocks_` 清單，確保函數定義在頂層
-   **FR-007**: 函數呼叫 MUST 生成為 `funcName(value1, value2)\n` 格式
-   **FR-008**: 參數值 MUST 透過 `generator.valueToCode()` 正確取得

### Key Entities

-   **arduino_function**: 函數定義積木，包含 `NAME`（函數名稱）、`arguments_`（參數名稱陣列）、`STACK`（函數體語句）
-   **arduino_function_call**: 函數呼叫積木，包含 `NAME`（函數名稱）、`ARG0`, `ARG1`... 等參數輸入
-   **micropythonGenerator**: MicroPython 代碼生成器物件，使用 `addFunction()` 註冊函數定義

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者在 CyberBrick Python 模式下使用自訂函數時，不再出現 "MicroPython generator does not know how to generate code" 錯誤
-   **SC-002**: 生成的 Python 代碼能夠通過 Python 語法檢查（無 SyntaxError）
-   **SC-003**: 帶參數的函數呼叫能正確傳遞參數值
-   **SC-004**: 函數定義位於生成代碼的頂層，在主程式區塊之前

## Assumptions

-   不需要支援帶回傳值的自訂函數（`arduino_function` 設計為 void 函數）
-   不加入 Python type hints，保持生成代碼簡潔
-   沿用現有 `arduino_function` 積木，不建立新的 `micropython_function` 積木
-   中文函數名稱保留原始名稱（Python 3 支援 Unicode 識別符，PEP 3131）

## Clarifications

### Session 2025-12-31

-   Q: 中文函數名稱處理策略是什麼？ → A: 保留原始中文名稱（Python 3 支援 Unicode 識別符）
-   Q: 多個函數的生成順序如何決定？ → A: 按工作區積木順序（由上到下、由左到右）
