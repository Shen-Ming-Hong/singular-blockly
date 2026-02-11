# Feature Specification: 防止孤立積木產生無效程式碼

**Feature Branch**: `044-prevent-orphan-blocks`  
**Created**: 2025-07-15  
**Status**: Draft  
**Input**: User description: "防止孤立（orphan）控制/流程類積木（例如 while/for/if）在非合法容器（setup/loop/functions）產生 C++ 或 MicroPython 代碼；在 generator 層新增 workspaceToCode 過濾、isInAllowedContext helper，並在 generator forBlock 中加 guard，另外在 WebView 顯示警告及更新 i18n。"

## Clarifications

### Session 2026-02-11

- Q1: 預設允許哪些頂層積木以產生程式碼？ → A: Option A（使用預設允許頂層積木清單：Arduino: `arduino_setup_loop`, `arduino_function`, `procedures_defnoreturn`, `procedures_defreturn`; MicroPython: `micropython_main` 及函式定義）。
- Q2: 要在輸出程式碼中如何標記被跳過的孤立積木？ → A: Option A（在輸出程式碼中加入註解，包含積木 type 與簡短定位說明）。


## User Scenarios & Testing *(mandatory)*

### User Story 1 - 孤立控制積木不產生程式碼（Priority: P1）

身為一位使用 Blockly 編輯器的學生，我將 `while`、`for` 或 `if` 等控制積木拖放到工作區空白處（未放入 `setup()`、`loop()` 或自訂函式中）。當我切換到程式碼檢視時，系統不應為這些孤立積木產生任何程式碼，以避免生成在函式外部的無效語法，導致編譯錯誤或執行異常。

**Why this priority**: 這是本功能的核心價值——直接消除孤立積木產生無效程式碼的根本問題。若不解決此問題，使用者（尤其是初學者）會遭遇難以理解的編譯錯誤，嚴重影響學習體驗。

**Independent Test**: 可透過將任意控制積木拖放到工作區空白處，然後檢視產生的程式碼來獨立驗證。預期結果為不包含該孤立積木的程式碼輸出。

**Acceptance Scenarios**:

1. **Given** 工作區中有一個 `arduino_setup_loop` 積木以及一個放在工作區空白處的 `while` 積木，**When** 使用者檢視產生的 Arduino C++ 程式碼，**Then** 程式碼中不包含 `while` 迴圈語法，僅包含 `setup()` 和 `loop()` 函式的正常內容
2. **Given** 工作區中有一個 `micropython_main` 積木以及一個放在空白處的 `if` 積木，**When** 使用者檢視產生的 MicroPython 程式碼，**Then** 程式碼中不包含 `if` 條件語法
3. **Given** 工作區中有一個放在空白處的 `for` 積木以及一個正確放在 `loop()` 區域內的 `while` 積木，**When** 使用者檢視程式碼，**Then** 僅有 `loop()` 內的 `while` 產生程式碼，孤立的 `for` 不產生任何程式碼

---

### User Story 2 - 孤立積木顯示視覺警告（Priority: P2）

身為一位使用 Blockly 編輯器的學生，當我將控制積木拖放到工作區空白處時，該積木上應顯示明顯的警告提示，告知我這個積木需要放在 `setup()`、`loop()` 或自訂函式內才能產生程式碼。當我將積木移入合法容器後，警告應自動消失。

**Why this priority**: 光是靜默地不產生程式碼，使用者可能不理解為何積木「沒反應」。視覺警告提供即時回饋，引導使用者正確操作，大幅提升教學場景下的使用體驗。

**Independent Test**: 可透過將控制積木拖到空白處，觀察是否出現警告圖示/文字；再將積木移入合法容器，觀察警告是否消失。

**Acceptance Scenarios**:

1. **Given** 使用者將一個 `while` 積木拖放到工作區空白處，**When** 積木放置完成，**Then** 該積木上顯示警告訊息，內容為提示使用者需將積木放入合法容器
2. **Given** 一個顯示警告的孤立 `if` 積木，**When** 使用者將其拖入 `setup()` 或 `loop()` 區域，**Then** 警告自動消失
3. **Given** 一個顯示警告的孤立積木，**When** 使用者將其拖入自訂函式積木內，**Then** 警告同樣自動消失

---

### User Story 3 - 多語系警告訊息支援（Priority: P3）

身為一位非英語母語的學生，當孤立積木顯示警告時，我應該看到以我使用的介面語言顯示的警告訊息，而非只有英文，以便我能理解問題所在。

**Why this priority**: 國際化支援對多語系使用者至關重要，但核心功能（P1 的程式碼過濾與 P2 的警告機制）優先於翻譯。即使暫時只有英文警告，系統仍然可用。

**Independent Test**: 可透過切換介面語言到不同語系（如繁體中文、日文等），然後將控制積木拖到空白處，驗證警告訊息是否以對應語言顯示。

**Acceptance Scenarios**:

1. **Given** 使用者介面語言設定為繁體中文，**When** 一個控制積木被拖放到空白處，**Then** 警告訊息以繁體中文顯示
2. **Given** 使用者介面語言設定為日文，**When** 一個控制積木被拖放到空白處，**Then** 警告訊息以日文顯示
3. **Given** 使用者介面語言設定為系統未支援的語言，**When** 一個控制積木被拖放到空白處，**Then** 警告訊息以英文（預設語言）顯示

---

### User Story 4 - 合法位置的積木不受影響（Priority: P1）

身為一位使用 Blockly 編輯器的學生，當我將控制積木正確放在 `setup()`、`loop()` 或自訂函式內時，程式碼生成應完全正常運作，與先前的行為一致。現有的工作區與專案不應因本功能而產生任何意外變化。

**Why this priority**: 等同 P1，因為回歸保護是任何修改的基本前提。若防護機制誤判正常積木，會破壞使用者現有的工作成果。

**Independent Test**: 可使用現有的工作區檔案開啟編輯器，確認所有在合法容器內的控制積木仍能正常產生對應程式碼。

**Acceptance Scenarios**:

1. **Given** 一個 `while` 積木正確嵌套在 `loop()` 區域內，**When** 使用者檢視程式碼，**Then** 產生正確的迴圈程式碼
2. **Given** 一個 `if` 積木嵌套在自訂函式內，**When** 使用者檢視程式碼，**Then** 產生正確的條件判斷程式碼
3. **Given** 多層嵌套結構（例如 `loop()` 內的 `if` 內的 `while`），**When** 使用者檢視程式碼，**Then** 所有層級的程式碼都正確生成
4. **Given** 已註冊為「始終生成」的特殊積木（如 `servo_setup`），**When** 這些積木放在工作區頂層，**Then** 它們仍然正常生成所需的設定程式碼，不受孤立積木過濾影響

---

### Edge Cases

- 當控制積木嵌套在另一個孤立的控制積木內時（例如孤立的 `if` 內包含 `while`），兩者都不應產生程式碼
- 當使用者在產生程式碼的過程中即時移動積木（拖動中），系統應在積木放置完成後才重新評估其狀態
- 當工作區同時包含 Arduino 和 MicroPython generator 的情境切換時，兩種模式都應正確過濾孤立積木
- 當積木透過複製貼上被放置到工作區空白處時，應同樣觸發孤立判定與警告
- 當使用者透過 Undo/Redo 操作還原積木位置時，警告狀態應即時更新
- 當 `break`/`continue` 流程控制積木不在任何迴圈或合法容器內時，同樣不應產生程式碼

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 在程式碼生成時過濾掉所有不在合法頂層容器內的頂層積木，僅為允許的頂層積木類型生成程式碼（Clarification: 預設允許頂層積木清單 - Arduino: `arduino_setup_loop`, `arduino_function`, `procedures_defnoreturn`, `procedures_defreturn`; MicroPython: `micropython_main` 及函式定義）。
- **FR-002**: 系統 MUST 提供一個共用的上下文檢查機制，用以判斷任意積木是否位於合法容器（`setup()`、`loop()` 或自訂函式）之內
- **FR-003**: 系統 MUST 在各控制流程類積木（迴圈、條件判斷、流程控制語句）的程式碼生成邏輯中，加入合法容器檢查作為深層防護，若不在合法容器內則不生成程式碼
- **FR-004**: 系統 MUST 對 Arduino C++ generator 與 MicroPython generator 同時實施上述過濾與防護
- **FR-005**: 系統 MUST 在孤立的控制積木上顯示視覺化警告訊息，告知使用者需將積木放入合法容器
- **FR-006**: 系統 MUST 在積木被移入合法容器後自動清除該警告
- **FR-007**: 系統 MUST 保留現有的「始終生成」積木機制（如 `servo_setup`、`encoder_setup` 等已註冊的 setup 類積木），確保這些積木即使放在頂層仍能正常生成程式碼
- **FR-008**: 系統 MUST 為警告訊息提供多語系支援，涵蓋專案現有的所有語系檔案
- **FR-009**: 系統 MUST 確保正確嵌套在合法容器內的控制積木不受任何影響，程式碼生成行為與修改前完全一致
- **FR-010**: 系統 MUST 在工作區變更事件（包含拖放、複製貼上、Undo/Redo）後重新評估積木的孤立狀態

### Key Entities

- **合法頂層積木（Allowed Top-Level Blocks）**: 允許作為工作區頂層積木並直接生成程式碼的積木類型。Arduino 模式下包含 `arduino_setup_loop`、`arduino_function`、`procedures_defnoreturn`、`procedures_defreturn`；MicroPython 模式下包含 `micropython_main` 及對應的函式定義積木
- **孤立積木（Orphan Blocks）**: 被放置在工作區空白處、不在任何合法頂層容器內的控制/流程類積木。這些積木不應產生程式碼，且應顯示視覺警告
- **合法容器（Allowed Context）**: 積木可合法嵌套於其中並產生程式碼的父層結構，包含 `setup()` 區域、`loop()` 區域、自訂函式積木
- **始終生成積木（Always-Generate Blocks）**: 透過特殊機制註冊的積木（如 `servo_setup`），即使不在標準容器內也需要在程式碼生成流程中被掃描處理

## Assumptions

- Blockly 12.x 版本的 `getSurroundParent()` 方法能正確回傳積木的最近父層容器，且在多層嵌套中可透過遞迴呼叫找到最外層容器
- MicroPython generator 已有自訂的 `workspaceToCode()` 過濾機制，本功能在其基礎上增加個別 generator 的深層防護
- 工作區變更事件機制已存在且可用於觸發積木狀態重新評估
- 專案現有的 15 個語系檔案結構一致，可統一新增翻譯鍵值
- 「始終生成」積木機制（`alwaysGenerateBlocks_`）僅在 Arduino generator 中使用，且透過 `arduino_setup_loop` 的 forBlock 內部掃描實現

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 所有控制/流程類積木（`while`、`for`、`if`、`break`、`continue` 等）在孤立狀態下，生成的程式碼輸出中不包含任何該積木對應的語法片段，通過率達 100%
- **SC-002**: 所有在合法容器內的控制積木，程式碼生成結果與功能修改前完全一致，回歸測試通過率 100%
- **SC-003**: 使用者將控制積木拖放到空白處後 1 秒內看到警告提示；將積木移入合法容器後 1 秒內警告消失
- **SC-004**: 警告訊息在專案支援的所有語系中均有對應翻譯，多語系覆蓋率 100%
- **SC-005**: 已註冊的「始終生成」積木（如 `servo_setup`）在頂層放置時仍能正常運作，不受過濾機制影響
- **SC-006**: Arduino 與 MicroPython 兩種 generator 模式均具備完整的孤立積木防護，雙模式覆蓋率 100%
