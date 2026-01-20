# Feature Specification: CyberBrick 時間回傳值積木

**Feature Branch**: `032-cyberbrick-time-blocks`  
**Created**: 2026-01-20  
**Status**: Draft  
**Input**: User description: "根據剛剛討論的內容建立規格"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 非阻塞計時流程 (Priority: P1)

學生在 CyberBrick 的積木介面中，需要取得目前時間並計算時間差，來完成非阻塞的閃爍或輸入處理流程。

**Why this priority**: 這是核心學習情境，直接影響學生是否能用積木完成「同時做多件事」的時間控制。

**Independent Test**: 能以兩個時間積木與變數積木組合出「計算時間差 > N」的邏輯，並在程式碼預覽中看到時間差計算表達式。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 CyberBrick 板子並開啟 Blockly，**When** 拖曳「取得目前毫秒數」與「計算時間差」並接上比較積木，**Then** 可形成完整的時間差判斷流程且不依賴延時積木。
2. **Given** 使用者先用變數保存起始時間，**When** 以「計算時間差」組合變數與當前時間，**Then** 可得到可比較的數值結果。
3. **Given** 使用者從時間分類加入「計算時間差」積木，**When** 查看預設輸入，**Then** 可看到「現在」預設為時間取得積木且「開始」預設為變數輸入。
4. **Given** 使用者切換到非 CyberBrick 板子，**When** 打開時間分類或搜尋積木，**Then** 不會看到這兩個時間回傳值積木。

---

### User Story 2 - 在地化教學與介面理解 (Priority: P2)

老師與學生切換介面語言時，新的時間積木仍然以當地常用詞彙呈現，避免誤解與教學混亂。

**Why this priority**: 多語系是產品核心，錯誤翻譯會直接影響教學效果與使用信心。

**Independent Test**: 切換任一支援語言後，時間積木名稱、欄位與提示皆以當地慣用詞呈現且可理解。

**Acceptance Scenarios**:

1. **Given** 使用者切換到任一支援語言，**When** 查看時間分類積木，**Then** 新增積木的名稱與欄位顯示為在地化詞彙。

---

### User Story 3 - AI/MCP 積木查詢支援 (Priority: P3)

使用者透過 MCP/AI 查詢積木時，能找到新的時間積木並取得正確的使用資訊。

**Why this priority**: MCP 查詢是產品差異化功能，需與實際積木保持一致。

**Independent Test**: MCP 積木字典中可檢索到新積木，且名稱與分類資訊正確。

**Acceptance Scenarios**:

1. **Given** MCP 工具執行積木搜尋，**When** 以「時間 / milliseconds / ticks」等關鍵字查詢，**Then** 能回傳新增的時間積木資訊。

---

### User Story 4 - 文件與教學參考更新 (Priority: P4)

老師或學生需要查閱功能說明時，能在產品文件中找到新積木的用途與範例流程。

**Why this priority**: 文件是教學與自學的重要入口，缺漏會降低可學性。

**Independent Test**: 檢視指定文件頁面即可確認是否包含新積木與範例流程。

**Acceptance Scenarios**:

1. **Given** 使用者開啟 CyberBrick 相關說明文件，**When** 檢視時間積木區段，**Then** 可看到新增積木與非阻塞計時範例。

---
### Edge Cases

- 計時值循環（wrap-around）後，時間差依然可被正確理解與比較。
- 使用者將「現在」與「開始」輸入順序顛倒時，結果為負值或不合預期時應可被察覺（例如透過教學文案或提示）。
- 若使用者未先建立變數即放入時間差計算，仍可使用預設輸入完成流程。
- 非 CyberBrick 板子時，這些積木不應出現在可用清單中（避免混淆）。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 提供兩個新的 CyberBrick 時間回傳值積木，分別用於「取得目前毫秒數」與「計算時間差」。
- **FR-002**: 「計算時間差」積木 MUST 提供兩個數值輸入欄位（現在、開始），並支援連接變數或其他數值積木。
- **FR-003**: 系統 MUST 提供對新積木的預設教學路徑，使初學者可先保存起始時間再進行差值計算。
- **FR-004**: 產生的程式碼 MUST 使用官方支援的 CyberBrick 計時與差值計算方式，並能在計時循環後仍得到正確差值。
- **FR-005**: 新積木 MUST 只在 CyberBrick 模式下顯示，避免其他板子出現不相容項目。
- **FR-006**: 所有支援語言 MUST 提供在地化積木名稱、欄位文字與提示說明，且詞彙符合當地使用習慣。
- **FR-007**: MCP block dictionary MUST 收錄新積木，並可被搜尋與查詢。
- **FR-008**: 產品文件 MUST 更新，包含新積木的用途與範例流程說明。

### Key Entities *(include if feature involves data)*

- **Time Block Definition**: 代表 CyberBrick 的時間回傳值積木（名稱、輸入欄位、輸出型別、分類）。
- **Localization Strings**: 各語系對應的新積木名稱、欄位與提示文本。
- **MCP Block Dictionary Entry**: MCP 查詢使用的積木描述與分類資訊。

## Assumptions & Dependencies

- CyberBrick 目標環境已支援官方的計時與時間差計算能力。
- 既有的多語系流程與審核機制可用於新增文字。
- MCP 積木字典更新流程可被沿用，並能發布到使用者端。
- 本需求不包含韌體更新或非 CyberBrick 板卡行為調整。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% 支援語言的介面中，新積木名稱與提示可正確顯示且無缺漏。
- **SC-002**: 使用者可在 2 分鐘內完成「保存起始時間 → 計算時間差 → 比較判斷」的積木流程（以使用者測試或教學演示驗證）。
- **SC-003**: MCP 搜尋新積木的查詢成功率達 100%（可透過測試案例驗證）。
- **SC-004**: 產碼在計時循環後仍能正確計算時間差（以測試案例驗證）。
