# Feature Specification: HuskyLens 積木動態編號輸入

**Feature Branch**: `035-huskylens-dynamic-index`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "哈士奇鏡頭的「取得方塊[編號][參數]」積木，編號欄位改為可填入數字方塊或變數方塊，以便在迴圈中掃描所有方塊狀態"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 使用迴圈掃描所有偵測到的方塊 (Priority: P1)

使用者希望在迴圈中動態讀取 HuskyLens 偵測到的所有方塊資訊。目前「取得方塊[編號][參數]」積木的編號欄位只能輸入固定數字，無法使用變數或計數器，導致無法配合 for 迴圈逐一讀取多個偵測結果。

**Why this priority**: 這是本次功能的核心需求，解決使用者無法在迴圈中動態存取方塊資料的痛點。

**Independent Test**: 將變數積木連接到編號欄位，在迴圈中遞增變數值，確認能正確產生對應的 Arduino 程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者開啟 Blockly 編輯器並拖曳「取得方塊」積木，**When** 將數字積木拖曳到編號欄位，**Then** 數字積木成功連接，積木保持單行外觀
2. **Given** 使用者開啟 Blockly 編輯器並拖曳「取得方塊」積木，**When** 將變數積木拖曳到編號欄位，**Then** 變數積木成功連接
3. **Given** 使用者建立包含「取得方塊」積木的 for 迴圈，迴圈變數 `i` 連接到編號欄位，**When** 產生 Arduino 程式碼，**Then** 程式碼正確使用變數 `i` 作為索引，例如 `huskylens.getBlock(i).xCenter`

---

### User Story 2 - 使用迴圈掃描所有偵測到的箭頭 (Priority: P1)

使用者希望以相同方式動態讀取 HuskyLens 偵測到的箭頭資訊。「取得箭頭[編號][參數]」積木與「取得方塊」積木有相同的限制，需一併修改。

**Why this priority**: 箭頭積木與方塊積木功能對稱，使用者預期兩者行為一致。

**Independent Test**: 將變數積木連接到箭頭積木的編號欄位，確認能正確產生 Arduino 程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者拖曳「取得箭頭」積木，**When** 將數字積木或變數積木拖曳到編號欄位，**Then** 積木成功連接，維持單行外觀
2. **Given** 使用者建立包含「取得箭頭」積木的 for 迴圈，**When** 產生 Arduino 程式碼，**Then** 程式碼正確使用迴圈變數作為索引

---

### User Story 3 - 預設數字值維持使用體驗 (Priority: P2)

使用者直接從工具箱拖曳積木時，編號欄位應有預設值 0，無需額外操作即可使用。

**Why this priority**: 確保修改後的積木對新手使用者仍然友善，不會因為需要額外連接數字積木而增加使用門檻。

**Independent Test**: 從工具箱拖曳積木到工作區，確認已有預設數字 0。

**Acceptance Scenarios**:

1. **Given** 工具箱中的「取得方塊」積木，**When** 使用者將積木拖曳到工作區，**Then** 編號欄位自動填入預設數字 0（shadow block）
2. **Given** 工具箱中的「取得箭頭」積木，**When** 使用者將積木拖曳到工作區，**Then** 編號欄位自動填入預設數字 0（shadow block）

---

### Edge Cases

- 當編號欄位未連接任何積木時：產生的程式碼應使用預設值 0
- 當使用者連接非數字類型的積木時：Blockly 的 setCheck('Number') 應阻止連接
- 當使用者使用數學運算積木（如 `i + 1`）時：產生的程式碼應正確包含運算式

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 「取得方塊」積木（`huskylens_get_block_info`）的編號欄位 MUST 接受 Number 類型的積木連接
- **FR-002**: 「取得箭頭」積木（`huskylens_get_arrow_info`）的編號欄位 MUST 接受 Number 類型的積木連接
- **FR-003**: 兩個積木的外觀 MUST 維持單行排列（inline 模式）
- **FR-004**: 工具箱中的積木 MUST 預設包含數字 0 的 shadow block
- **FR-005**: Arduino 程式碼產生器 MUST 正確處理動態連接的積木值
- **FR-006**: 當編號欄位未連接積木時，產生器 MUST 使用預設值 0

### Key Entities

- **huskylens_get_block_info**: 取得 HuskyLens 偵測到的方塊資訊積木，包含編號（INDEX）和參數類型（INFO_TYPE）兩個欄位
- **huskylens_get_arrow_info**: 取得 HuskyLens 偵測到的箭頭資訊積木，結構與方塊積木相同

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者能在 3 秒內將變數積木連接到編號欄位
- **SC-002**: 積木修改後維持單行外觀，視覺上與原設計無明顯差異
- **SC-003**: 在 for 迴圈中使用動態編號時，產生的 Arduino 程式碼能正確編譯
- **SC-004**: 100% 的既有使用情境（固定數字編號）不受影響，維持向後相容
