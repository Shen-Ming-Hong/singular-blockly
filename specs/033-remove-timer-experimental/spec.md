# Feature Specification: 移除 CyberBrick Timer 實驗標記

**Feature Branch**: `033-remove-timer-experimental`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: User description: "移除 CyberBrick timer 積木（cyberbrick_ticks_ms/cyberbrick_ticks_diff）的實驗標記，完成後不再顯示實驗提示；文件更新延後到 PR 發布。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 使用 Timer 積木時不顯示實驗提示 (Priority: P1)

使用者在 CyberBrick 工具箱或工作區使用 Timer 積木時，不會看到任何「實驗性」視覺標記或提示，確保這些積木被視為穩定功能。

**Why this priority**: 這是使用者最直接的體驗影響，若仍顯示實驗提示會造成誤解與信任下降。

**Independent Test**: 在乾淨工作區只加入 Timer 積木即可驗證是否出現實驗提示與標記。

**Acceptance Scenarios**:

1. **Given** 工具箱包含 CyberBrick 的 Timer 積木，**When** 使用者打開該分類並查看積木外觀，**Then** Timer 積木不呈現實驗性視覺標記（例如黃色虛線）。
2. **Given** 工作區僅包含 Timer 積木，**When** 使用者載入或刷新工作區，**Then** 不會顯示任何實驗性提示或指示器。

---

### User Story 2 - 舊專案相容且其他實驗積木不受影響 (Priority: P2)

使用者開啟既有專案時，Timer 積木不會被標記為實驗性；若專案中包含其他實驗積木，提示仍正常顯示。

**Why this priority**: 需確保升級後的相容性與避免影響既有專案，同時維持其他實驗積木的提醒機制。

**Independent Test**: 以一個包含 Timer 積木的既有專案載入，並以另一個包含其他實驗積木的專案驗證提示仍存在。

**Acceptance Scenarios**:

1. **Given** 既有專案僅包含 Timer 積木，**When** 使用者載入該專案，**Then** 不會出現實驗性提示或指示器。
2. **Given** 既有專案包含 Timer 積木與其他實驗積木，**When** 使用者載入該專案，**Then** 實驗性提示仍會出現，且 Timer 積木不被視為造成提示的來源。

---

### Edge Cases

- 工作區沒有任何積木時，不應顯示實驗性提示或指示器。
- 工作區包含其他實驗積木時，提示仍需顯示，但 Timer 積木不應帶有實驗性標記。
- 同一工作區同時包含多個 Timer 積木時，仍不應觸發實驗性提示。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 將 CyberBrick Timer 積木（`cyberbrick_ticks_ms`、`cyberbrick_ticks_diff`）視為非實驗性積木。
- **FR-002**: 當工作區僅包含 Timer 積木時，系統 MUST 不顯示任何實驗性提示或指示器。
- **FR-003**: 當工作區包含其他實驗積木時，系統 MUST 仍顯示實驗性提示或指示器。
- **FR-004**: 既有專案載入後，Timer 積木 MUST 不呈現實驗性視覺標記。
- **FR-005**: 此變更 MUST 不影響其他已標記為實驗性的積木行為與提示機制。

### Key Entities *(include if feature involves data)*

- **Timer 積木類型**: 代表 `cyberbrick_ticks_ms` 與 `cyberbrick_ticks_diff`，包含類型識別與顯示名稱。
- **實驗性積木清單**: 代表被判定為實驗性的積木類型集合。
- **工作區積木使用情境**: 代表目前工作區中實際出現的積木類型集合。

### Assumptions & Dependencies

- 文件與變更紀錄的更新將在 PR 發布階段處理，不在本次規格範圍內。
- 本次範圍僅限 CyberBrick 的兩個 Timer 積木類型。
- 其他實驗性積木的判定規則維持現況。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 在僅包含 Timer 積木的工作區中，實驗性提示或指示器出現率為 0%。
- **SC-002**: 在包含其他實驗積木的工作區中，實驗性提示仍可被觀察到（成功率 100%）。
- **SC-003**: Timer 積木在工具箱與工作區中均不呈現任何實驗性視覺標記（出現率 0%）。
- **SC-004**: 既有含 Timer 積木的專案載入後，未出現因 Timer 積木造成的實驗性提示（出現率 0%）。
