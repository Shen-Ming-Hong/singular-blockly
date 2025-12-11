# Feature Specification: Blockly 積木 JSON 序列化修復

**Feature Branch**: `014-block-serialization-fix`  
**Created**: 2025-12-11  
**Status**: Draft  
**Input**: User description: "修復 Blockly 積木 JSON 序列化問題，當 value blocks 如 encoder_read 連接到其他積木時，保存後變成獨立積木，導致程式碼生成到錯誤位置造成編譯失敗"  
**Scope**: 本次僅修復 encoder 系列積木（5 個），其他積木（servo、function、threshold）將在後續版本處理

## 問題背景

### 根本原因分析

Blockly 12.x 使用 **JSON 序列化系統** (`Blockly.serialization.workspaces.save/load`)，但專案中多個積木定義只實作了**舊式 XML 序列化 hooks** (`mutationToDom` / `domToMutation`)，導致：

1. **積木連接狀態丟失**：當 value block（如 `encoder_read`）連接到其他積木時，保存後變成獨立的頂層積木
2. **程式碼生成位置錯誤**：獨立的 value block 會被 `workspaceToCode` 處理，其表達式（如 `myEncoder.getCount()`）被輸出到 `loop()` 函數外面
3. **編譯失敗**：裸露的表達式在 C++ 中是無效的語法

### 受影響積木清單（本次修復範圍）

| 檔案        | 積木類型              | 問題                                                      |
| ----------- | --------------------- | --------------------------------------------------------- |
| `motors.js` | `encoder_setup`       | 只有 XML hooks，缺少 JSON hooks                           |
| `motors.js` | `encoder_read`        | 只有 XML hooks，缺少 JSON hooks（**用戶報告的主要問題**） |
| `motors.js` | `encoder_reset`       | 只有 XML hooks，缺少 JSON hooks                           |
| `motors.js` | `encoder_pid_setup`   | 只有 XML hooks，缺少 JSON hooks                           |
| `motors.js` | `encoder_pid_compute` | 只有 XML hooks，缺少 JSON hooks                           |

### 未來修復範圍（不在本次規格內）

| 檔案           | 積木類型                                    | 備註                       |
| -------------- | ------------------------------------------- | -------------------------- |
| `motors.js`    | `servo_move`, `servo_stop`                  | 伺服馬達系列，下一階段處理 |
| `functions.js` | `arduino_function`, `arduino_function_call` | 函數系列，下一階段處理     |
| `arduino.js`   | `threshold_function_read`                   | 閾值函數，下一階段處理     |

### 技術說明

Blockly 序列化系統的優先級：

-   **JSON 系統**（優先）：`saveExtraState` / `loadExtraState`
-   **XML 系統**（fallback）：`mutationToDom` / `domToMutation`

當積木只有 XML hooks 時，JSON 序列化無法正確處理 mutation 資料，導致積木狀態（包括連接關係）無法正確保存。

---

## User Scenarios & Testing

### User Story 1 - 編碼馬達積木序列化修復 (Priority: P1)

**用戶描述**：作為一名使用編碼馬達的開發者，我希望將「取得編碼馬達計數」積木連接到「顯示」或其他積木後，保存並重新開啟專案時，積木連接關係能正確保持，且生成的程式碼能正常編譯。

**Why this priority**: 這是用戶直接報告的問題，影響基本功能使用。編碼馬達是常用的硬體組件，此問題會阻礙用戶正常開發。

**Independent Test**: 建立 encoder_read 連接到 text_print 的積木組合 → 保存 → 重新載入 → 確認連接保持且程式碼生成正確。

**Acceptance Scenarios**:

1. **Given** 用戶將 `encoder_read` 積木連接到 `text_print` 積木的 TEXT 輸入，**When** 用戶保存專案並重新開啟，**Then** `encoder_read` 積木仍連接在 `text_print` 內部，而非變成獨立積木。

2. **Given** 用戶的工作區包含已連接的 `encoder_read` 積木，**When** 生成程式碼，**Then** `myEncoder.getCount()` 出現在正確的上下文中（如 `Serial.println(myEncoder.getCount());`），而非單獨一行。

3. **Given** 用戶載入包含 `encoder_read` 的舊版 `main.json` 檔案，**When** 專案開啟，**Then** 積木能正確載入（向後相容 XML 序列化）。

---

### User Story 2 - 裸露表達式防護機制 (Priority: P1)

**用戶描述**：即使積木序列化出現問題導致 value block 變成獨立積木，生成的程式碼也不應包含無效的裸露表達式。

**Why this priority**: 這是一個安全防護機制，確保即使序列化失敗，也不會造成編譯錯誤，提升系統穩健性。

**Independent Test**: 故意將 value block 獨立放置 → 生成程式碼 → 確認無裸露表達式。

**Acceptance Scenarios**:

1. **Given** 用戶（意外地）在工作區放置一個獨立的 `encoder_read` 積木，**When** 生成程式碼，**Then** 輸出中**不會**包含裸露的 `myEncoder.getCount()`，而是轉為註釋或完全忽略。

2. **Given** 工作區包含獨立的 `math_number` 積木，**When** 生成程式碼，**Then** 該數字不會作為裸露表達式出現在程式碼中。

---

### Edge Cases

-   **混合序列化**：載入同時包含 JSON 和 XML extraState 的舊版檔案時，系統能否正確處理？
-   **積木複製貼上**：複製含 mutation 的 encoder 積木後，新積木的序列化是否正確？
-   **Undo/Redo**：撤銷/重做操作後，encoder 積木的序列化狀態是否一致？
-   **跨版本相容**：舊版 main.json（只有 XML extraState）載入新版系統時，能否正確還原？
-   **空值處理**：當 encoder dropdown 欄位值為 null 或 undefined 時，序列化是否能正確處理？
-   **多個編碼馬達**：工作區中有多個不同名稱的編碼馬達時，各自的序列化是否獨立正確？

---

## Requirements

### Functional Requirements

-   **FR-001**: 系統必須為 `motors.js` 中的 5 個 encoder 積木（`encoder_setup`, `encoder_read`, `encoder_reset`, `encoder_pid_setup`, `encoder_pid_compute`）添加 `saveExtraState` 和 `loadExtraState` 方法。

-   **FR-002**: 系統必須保留現有的 `mutationToDom` 和 `domToMutation` 方法，以確保向後相容舊版 `main.json` 檔案。

-   **FR-003**: 系統必須在 `arduinoGenerator` 中實作 `scrubNakedValue` 方法，將獨立 value block 的輸出轉為註釋（`// 未連接的表達式: ...`）而非裸露表達式。

-   **FR-004**: JSON 序列化的資料結構應與 XML 序列化的屬性名稱保持一致，以降低維護成本。

### Key Entities

-   **ExtraState**: 積木的額外狀態資料，用於序列化/反序列化。包含 dropdown 值、checkbox 狀態、參數列表等。

    -   JSON 格式範例：`{ encoder: "myEncoder" }` 或 `{ arguments: ["x", "y"], argumentTypes: ["int", "float"] }`
    -   需與現有 XML 屬性對應

-   **Mutation Hooks**: Blockly 提供的序列化介面
    -   XML: `mutationToDom()`, `domToMutation(xmlElement)`
    -   JSON: `saveExtraState()`, `loadExtraState(state)`

---

## Success Criteria

### Measurable Outcomes

-   **SC-001**: 用戶將 `encoder_read` 連接到其他積木後保存，重新載入時連接關係 100% 正確保持。

-   **SC-002**: 5 個 encoder 積木全部實作 JSON 序列化 hooks，測試通過率 100%。

-   **SC-003**: 載入舊版 `main.json` 檔案（只有 XML extraState）時，encoder 積木狀態正確還原率 100%（向後相容）。

-   **SC-004**: 工作區中有獨立 encoder value block 時，生成的程式碼不包含任何裸露表達式（`scrubNakedValue` 機制生效）。

-   **SC-005**: 所有修改後的 encoder 積木在 Blockly 工作區中的 Undo/Redo 操作正常運作。

---

## Assumptions

-   Blockly 12.x 的 JSON 序列化會優先使用 `saveExtraState`/`loadExtraState`，只有在沒有這些方法時才回退到 XML hooks。
-   現有的 `main.json` 檔案結構中，extraState 以 XML 字串形式儲存（如 `"<mutation encoder=\"myEncoder\"></mutation>"`）。
-   專案使用 `Blockly.serialization.workspaces.save()` 和 `load()` 進行工作區的序列化/反序列化。

---

## Technical Verification (Web Research)

### ✅ 官方文件驗證

以下技術假設已透過 [Blockly 官方文件](https://developers.google.com/blockly) 驗證：

#### 1. JSON 序列化 Hooks (`saveExtraState` / `loadExtraState`)

**來源**: [Mutators - Serialization Hooks](https://developers.google.com/blockly/guides/create-custom-blocks/mutators#extra_state_serialization)

> `saveExtraState` 和 `loadExtraState` 是序列化掛鉤，可搭配新的 JSON 序列化系統使用。`saveExtraState` 會傳回可序列化為 JSON 的值，代表區塊的額外狀態，而 `loadExtraState` 則會接受該可序列化為 JSON 的值，並套用至區塊。

**程式碼範例** (來自官方文件):

```javascript
saveExtraState: function() {
  return {
    'itemCount': this.itemCount_,
  };
},

loadExtraState: function(state) {
  this.itemCount_ = state['itemCount'];
  this.updateShape_();
},
```

**產生的 JSON 格式**:

```json
{
	"type": "lists_create_with",
	"extraState": {
		"itemCount": 3
	}
}
```

#### 2. XML 序列化 Hooks (`mutationToDom` / `domToMutation`) - 舊版

**來源**: [Mutators - mutationToDom and domToMutation](https://developers.google.com/blockly/guides/create-custom-blocks/mutators#mutationtodom_and_domtomutation)

> `mutationToDom` 和 `domToMutation` 是序列化掛鉤，可搭配**舊版 XML 序列化系統**使用。**只有在必要時** (例如您正在處理尚未遷移的舊程式碼)，**才使用這些 Hook，否則請使用 `saveExtraState` 和 `loadExtraState`**。

✅ **結論**: 我們的修復策略正確 - 添加 JSON hooks 同時保留 XML hooks 以確保向後相容。

#### 3. `scrubNakedValue` 方法

**來源**: [CodeGenerator.scrubNakedValue()](https://developers.google.com/blockly/reference/js/blockly.codegenerator_class.scrubnakedvalue_1_method)

> **Naked 值是頂層區塊，其輸出內容並未插入任何內容。子類別可能會覆寫這項設定。**

**方法簽名**:

```typescript
scrubNakedValue(line: string): string;
```

✅ **結論**: `scrubNakedValue` 是處理獨立 value blocks 的正確機制。我們應在 `arduinoGenerator` 中覆寫此方法，將裸露表達式轉為註釋。

### 驗證日期

-   2025-12-11（使用 Blockly 官方開發者文件）
