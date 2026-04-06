# Feature Specification: 範本名稱多國語言化

**Feature Branch**: `049-sample-name-i18n`  
**Created**: 2026-04-06  
**Status**: Draft  
**Input**: 使用者希望在載入 CyberBrick 範本工作區時，Blockly 編輯器中的函式名稱與變數名稱能自動翻譯為使用者目前的 UI 語系，讓不同語言的初學者能看到熟悉的母語識別字，並直接對應生成的 MicroPython 程式碼。

## Clarifications

### Session 2026-04-06

- Q: FR-003(c) 的 extraState XML 注入是否需要額外 XML encode？ → A: FR-005 識別字驗證規則（僅允許 Unicode 字母、數字、底線）本身排除所有 XML 不安全字元（`<`、`>`、`"`、`&`），該規則即為 extraState XML 注入的安全防線，不需額外 XML 編碼。
- Q: `auto` 語系解析結果落在無翻譯的語系時應如何回退？ → A: 使用英文（`en`）作為中間回退層——若目標語系無翻譯，先嘗試 `en` 翻譯；若 `en` 翻譯也不存在，才保留原始中文名稱。理由：非支援語系的使用者通常比較看得懂英文而非中文。- Q: FR-003 是否需要覆蓋函式參數名稱（`<arg name="...">`）的翻譯？ → A: 是。實際範本檔中已大量使用帶參數函式（如 `車燈(紅色, 綠色, 藍色)`、`馬達移動(左輪速度, 右輪速度)`），參數名稱同時出現於函式定義與函式呼叫的 extraState `<arg name="...">`中，必須一並翻譯。`nameTranslations.variables` 映射表同時涵蓋工作區變數與函式參數名稱。

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 英文使用者載入足球機器人範本（Priority: P1）

一位英語使用者將 VS Code UI 語言設定為英文（`en`），從範例瀏覽器載入「Soccer Robot」範本。  
他希望看到的積木與生成程式碼都使用英文識別字（例如 `controller`、`joystick_forward_back`），而不是看不懂的中文名稱。

**Why this priority**: 目前預設範本語言為中文，非中文使用者完全無法理解積木標籤，嚴重阻礙學習體驗。這是核心用例，一旦完成即構成 MVP。

**Independent Test**: 將 VS Code UI 語言設定為 `en`，開啟範例瀏覽器並載入 Soccer Robot 範本。檢查 Blockly 工作區中所有積木上的函式與變數名稱是否為英文，同時觀察右側程式碼面板是否輸出英文識別字的 MicroPython 程式碼。

**Acceptance Scenarios**:

1. **Given** VS Code UI 語言為 `en`，**When** 使用者從範例瀏覽器載入 Soccer Robot 範本，**Then** Blockly 工作區中所有變數名稱（例如 `joystick_forward_back`、`connection_number`）與函式名稱（例如 `controller`、`on_connection_done`）均以英文顯示。
2. **Given** VS Code UI 語言為 `en` 且已載入 Soccer Robot 範本，**When** 生成 MicroPython 程式碼，**Then** 輸出程式碼中的識別字為英文（例如 `def controller():` 而非 `def 遙控器():`）。
3. **Given** 範本 JSON 尚未包含某語系的翻譯，**When** 使用者的 UI 語言為該語系，**Then** 積木名稱保留原始中文名稱，系統不發生錯誤。

---

### User Story 2 — 日文使用者看到日文識別字（Priority: P2）

一位日文使用者（UI 語言 `ja`）載入相同的 Soccer Robot 範本，期望看到日文識別字（例如 `コントローラー`、`ジョイスティック前後`），以便對應自己在文件中看到的說明。

**Why this priority**: 多語系支援是此功能的主要設計目標；日文識別字驗證了整體翻譯管線的正確性，包含多位元組 Unicode 識別字的合法性。

**Independent Test**: 將 VS Code UI 語言設定為 `ja`，載入範本後確認積木名稱與生成程式碼均使用日文識別字。

**Acceptance Scenarios**:

1. **Given** VS Code UI 語言為 `ja`，**When** 載入 Soccer Robot 範本，**Then** Blockly 工作區顯示日文識別字，且 MicroPython 程式碼也使用相同日文識別字。
2. **Given** 日文翻譯包含無效識別字（含空格或特殊符號），**When** 套用翻譯，**Then** 系統略過該無效翻譯項目，保留原始名稱，並記錄警告日誌。

---

### User Story 3 — 範本作者透過 Agent 新增翻譯（Priority: P3）

一位要新增新 CyberBrick 範本的內容作者，在用 Copilot Chat 執行 `add-cyberbrick-sample` skill 時，Agent 自動請求並生成 `nameTranslations` 翻譯區塊，作者只需審閱結果，不需要手動逐一填寫 14 個語系。

**Why this priority**: 這是工作流程自動化，對終端使用者不直接可見，但大幅降低維護成本。

**Independent Test**: 跟隨更新後的 `add-cyberbrick-sample` SKILL.md 新增一個測試範本，確認 Agent 能在 Phase 2.5 步驟中自動產出 `nameTranslations` 區塊，且最終 JSON 通過格式驗證。

**Acceptance Scenarios**:

1. **Given** 範本作者提供包含中文變數與函式名稱的工作區 JSON，**When** 執行 `add-cyberbrick-sample` skill，**Then** Agent 在 Phase 2.5 步驟中輸出 `nameTranslations` 對應表，涵蓋所有 14 個非 `zh-hant` 語系。
2. **Given** Agent 生成翻譯，**When** 翻譯名稱含有非法識別字字元（空格、連字號等），**Then** Agent 自動改用底線替代，確保翻譯後的名稱符合規則。（此行為屬 Agent 端的翻譯**生成**規範，由 T009 實作；Extension Host 的 `applyNameTranslations()` 不自動替換——只做跳過並保留原始名稱，見 FR-004 與 Edge Cases。）

---

### Edge Cases

- **無翻譯對應**：使用者語系與範本提供的翻譯語系均無匹配時，保留原始中文名稱，不拋出錯誤。
- **翻譯名稱含非法識別字字元**（空格、連字號、以數字開頭）：套用翻譯前，系統跳過該名稱並保留原始名稱，同時輸出警告日誌。
- **函式呼叫與函式定義名稱不同步**：若翻譯後函式定義名稱已更新，所有對應的函式呼叫積木也必須同步更新，否則工作區會出現懸空參照。
- **使用者在載入後切換 UI 語言**：翻譯僅在載入時一次性套用，切換語言後不自動重新翻譯；這是預期行為。
- **`zh-hant` 使用者**：`zh-hant` 為範本基準語言，不需要翻譯表項目，直接使用原始名稱。

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 範本 JSON 必須支援選填的 `nameTranslations` 區塊，結構包含 `variables` 與 `functions` 兩個子物件，每個子物件的 key 為中文原始名稱，value 為各語系翻譯的對應表（`NameTranslationEntry`——新增型別，所有語系選填，不含 `zh-hant` 欄位；與現有 `LocalizedText` 不同，`en` 非必填）。
- **FR-002**: 系統在載入範本時，必須使用 `settingsManager.resolveLanguage()` 的解析結果作為目標語系，從 `nameTranslations` 中取得翻譯，並在工作區傳送到 WebView 前套用到 workspace 物件。
- **FR-003**: 翻譯套用必須覆蓋以下四處：(a) 工作區變數列表中的 `name` 欄位、(b) 函式定義積木上的函式名稱欄位、(c) 函式呼叫積木中嵌入的 XML `name` 屬性字串、(d) 函式定義與呼叫積木 `extraState` 中 `<arg name="...">` 參數名稱。
- **FR-004**: 翻譯名稱查找遵循三層回退策略：(1) 優先使用目標語系的翻譯；(2) 若目標語系無翻譯，嘗試使用 `en`（英文）翻譯；(3) 若 `en` 也無翻譯，保留原始中文名稱。若翻譯名稱包含非法識別字字元（空格、連字號、標點、數字開頭），跳過該翻譯並進入下一層回退，不中斷載入流程。
- **FR-005**: 翻譯名稱合法性規則：僅允許 Unicode 字母、數字、底線組成，且不得以數字開頭（與 Python 3 識別字規則一致）。此規則同時作為 FR-003(c) extraState XML 注入的安全防線——凡符合此規則的名稱必然不含 XML 特殊字元（`<`、`>`、`"`、`&`），因此無需額外 XML encode。
- **FR-006**: 不含 `nameTranslations` 區塊的舊版範本 JSON 必須完全向後相容，載入行為與目前相同。
- **FR-007**: `add-cyberbrick-sample` SKILL.md 必須加入「Phase 2.5: Generate Name Translations」步驟。該步驟必須包含：(a) 揃取策略——掃描 `workspace.variables[].name` 和所有 `arduino_function` 積木的 `fields.NAME` 的全量唯一值，不設排除規則；(b) 14 個非 `zh-hant` 語系清單及翻譯對應表格式；(c) 識別字合法性規則（無空格、無連字號、不以數字開頭）；(d) 驗證 checklist。
- **FR-008**: 現有的 `cyberbrick-soccer-robot.json` 範本必須更新，加入涵蓋所有 14 個非 `zh-hant` 語系的 `nameTranslations` 區塊。

### Key Entities

- **`NameTranslations`**：存放於範本 JSON 頂層，包含 `variables` 與 `functions` 兩個子映射。`variables` 映射以中文基準名稱為 key，涵蓋工作區變數與函式參數名稱兩類識別字。`functions` 映射以中文函式名稱為 key。
- **`SampleWorkspace`**：現有資料結構，加入選填的 `nameTranslations` 欄位。
- **翻譯後工作區**：`applyNameTranslations()` 函式的輸出，為深層複製的 workspace 物件，其中所有被覆蓋的識別字已替換為目標語系名稱。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `applyNameTranslations()` 以 `en` 語系處理 Soccer Robot workspace JSON 後，輸出物件的 `variables[].name`、所有 `arduino_function` 積木的 `fields.NAME`、所有 `extraState` XML 中的 `name=` 與 `<arg name=` 屬性值，均不含任何原始中文字元（以單元測試比對 JSON 物件驗證，覆蓋率 100%）。
- **SC-002**: `applyNameTranslations()` 輸出的 workspace JSON 中，每個 `arduino_function_call` 的 `extraState` XML `name=` 值，必須與同一 workspace 中對應 `arduino_function` 的 `fields.NAME` 完全一致（以單元測試掃描全部呼叫積木驗證，無懸空參照、無 XML 語法錯誤）。
- **SC-003**: 不含 `nameTranslations` 的舊版範本 JSON 的載入成功率維持 100%（零回歸）。
- **SC-004**: `applyNameTranslations()` 單元測試覆蓋率：變數替換、函式定義替換、函式呼叫 XML 替換、深層巢狀積木、無效翻譯回退、語系回退共 6 個情境均有測試。
- **SC-005**: 使用者跟隨更新後的 `add-cyberbrick-sample` SKILL.md 新增一個新範本並加入 `nameTranslations`，整個流程在一次 Copilot Chat 對話中完成，不需要手動計算翻譯格式。

## Assumptions

- 範本基準語言固定為 `zh-hant`（繁體中文）；`nameTranslations` 僅需提供其他 14 個語系，`zh-hant` 直接使用原始名稱。
- 翻譯僅在「從範例瀏覽器載入範本」時套用；使用者自行編輯的工作區不受影響。
- 此功能僅適用於 `board === 'cyberbrick'` 的 MicroPython 範本，Arduino 範本不在此功能範圍內。
- 翻譯後的名稱語意正確性由 Agent（Copilot Chat）生成時負責；系統端僅驗證格式合法性（識別字規則），不驗證語意。
- 使用者在載入範本後切換 UI 語言，工作區不會自動重新翻譯；若需要其他語系版本，需重新載入範本。
