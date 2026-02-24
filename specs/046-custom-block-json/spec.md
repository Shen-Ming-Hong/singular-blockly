# Feature Specification: Singular Block — 自訂積木 JSON 系統

**Feature Branch**: `046-custom-block-json`  
**Created**: 2026-02-24  
**Status**: Draft  
**Input**: 使用者可透過自訂 JSON 建立客製化積木，放入指定資料夾後即時載入到積木編輯器的「Singular Block」工具箱分類。支援三種建立方式：手動撰寫 JSON（有 Schema 輔助）、圖形化精靈介面建立/編輯、MCP 聊天工具自動生成。當 JSON 被刪除或損壞時，工作區中使用該積木的位置自動替換為警告佔位積木；重新建立同名 JSON 後自動恢復。支援 Arduino 與 MicroPython 雙平台程式碼模板。

## Clarifications

### Session 2026-02-24

- Q: 自訂積木 JSON 是否需要支援 Arduino 的 `includes` 和 `lib_deps` 欄位？ → A: 支援。JSON 增加選填的 `arduinoIncludes` 和 `arduinoLibDeps` 欄位。精靈 UI 的程式碼模板步驟增加「搜尋函式庫」按鈕，呼叫 PlatformIO CLI 搜尋並讓使用者從結果中選取。搜尋 UI 需有良好指引且支援多國語言。
- Q: MicroPython 程式碼模板是否需要支援獨立的 imports 和 hardwareInit 欄位？ → A: 支援。JSON 增加選填的 `micropythonImports` 和 `micropythonHardwareInit` 欄位。但 MicroPython 僅限標準函式庫（如 `machine`、`neopixel`、`time`），不支援第三方套件安裝。

## User Scenarios & Testing _(mandatory)_

### User Story 1 — 手動建立自訂積木 JSON（Priority: P1）

使用者在工作區的指定資料夾中放入一份 JSON 檔案，定義積木的外觀（名稱、顏色、形狀）、輸入欄位和程式碼模板。儲存後，積木編輯器的左側工具箱立即出現「Singular Block」分類，其中包含該自訂積木。使用者可將積木拖入工作區使用，生成對應的 Arduino 或 MicroPython 程式碼。

**Why this priority**: 這是整個功能的核心基礎。沒有載入機制，精靈 UI 和 MCP 工具都無法運作。

**Independent Test**: 建立一份符合格式的 JSON 檔案放入資料夾，驗證積木出現在工具箱中且可正常拖曳使用並生成程式碼。

**Acceptance Scenarios**:

1. **Given** 工作區已開啟且指定資料夾存在，**When** 使用者放入一份合法的 JSON 檔案，**Then** 工具箱即時出現「Singular Block」分類且包含該積木
2. **Given** 自訂積木已載入，**When** 使用者將積木拖入工作區並連接到主程式容器中，**Then** 系統依據板卡類型（Arduino/MicroPython）生成對應程式碼
3. **Given** 自訂積木已被使用者放入工作區，**When** 使用者儲存並重新開啟專案，**Then** 自訂積木被正確還原顯示（不會變成灰色未知積木）
4. **Given** 指定資料夾不存在，**When** 使用者首次開啟積木編輯器，**Then** 系統自動建立資料夾並放入一份語系化的範例檔案供參考

---

### User Story 2 — JSON 刪除/損壞時的佔位積木保護（Priority: P1）

使用者刪除了自訂積木的 JSON 檔案（或 JSON 格式錯誤），工作區中所有使用該積木的位置不會直接消失，而是替換為帶有橘紅色警告的佔位積木。佔位積木會顯示遺失的積木類型名稱，提醒使用者修復。程式碼生成時，佔位積木輸出注解行而非錯誤。

**Why this priority**: 資料保護與錯誤容忍是核心功能的必要保障，防止使用者誤刪 JSON 導致工作區程式結構遭破壞。

**Independent Test**: 先建立並使用自訂積木，再刪除 JSON 檔案，驗證工作區中積木被安全替換為佔位積木。

**Acceptance Scenarios**:

1. **Given** 工作區有使用自訂積木 A，**When** 使用者刪除 A 的 JSON 檔案，**Then** 工作區中所有 A 積木即時被橘紅色佔位積木取代，顯示 A 的類型名稱
2. **Given** 自訂積木 A 的 JSON 檔案格式錯誤（非合法 JSON），**When** 系統在載入時偵測到格式錯誤，**Then** 該積木被視為無效，工作區中的 A 積木替換為佔位積木
3. **Given** 佔位積木存在於工作區中，**When** 程式碼生成時，**Then** 佔位積木輸出注解（Arduino: `// [Missing block: A]`，MicroPython: `# [Missing block: A]`），不會產生編譯錯誤
4. **Given** 佔位積木的形狀必須與原始積木一致，**When** 原始積木為「值」型（嵌入式），**Then** 佔位積木也是「值」型，不會破壞父積木的連接結構

---

### User Story 3 — 佔位積木自動恢復（Priority: P2）

使用者重新建立與之前相同 `type` 名稱的 JSON 檔案後，工作區中對應的佔位積木自動恢復為正常的自訂積木，無需手動操作。

**Why this priority**: 配合 User Story 2 構成完整的錯誤恢復迴路，提供使用者信心感。

**Independent Test**: 先觸發佔位積木（刪除 JSON），再重新建立同名 JSON，驗證佔位積木自動恢復。

**Acceptance Scenarios**:

1. **Given** 工作區中有多個 A 類型的佔位積木，**When** 使用者放入正確的 A 類型 JSON 檔案，**Then** 所有 A 佔位積木自動轉換回正常積木，保留在原本位置與連接關係
2. **Given** 恢復的積木定義與原始定義有所不同（例如新增了輸入欄位），**When** 恢復完成，**Then** 積木依照新定義顯示，移除舊佔位外觀

---

### User Story 4 — 圖形化精靈介面建立積木（Priority: P2）

使用者點擊工具箱「Singular Block」分類中的「＋ 建立新積木」按鈕，開啟一個置中 Modal 精靈介面。精靈分為步驟式引導（基本設定 → 輸入欄位 → 程式碼模板 → 完成），左側為設定表單，右側即時預覽積木外觀和程式碼輸出。使用者可在任意步驟間來回調整。完成後系統自動產生 JSON 並儲存。

**Why this priority**: 大幅降低建立積木的門檻，不需要了解 JSON 格式就能使用。

**Independent Test**: 點擊「＋ 建立新積木」按鈕，經過精靈四個步驟完成積木建立，驗證新積木出現在工具箱中。

**Acceptance Scenarios**:

1. **Given** 使用者開啟積木編輯器，**When** 點擊工具箱中「＋ 建立新積木」按鈕，**Then** 出現置中 Modal 精靈介面，顯示步驟一（基本設定）
2. **Given** 精靈在任意步驟，**When** 使用者修改左側表單中的顏色設定，**Then** 右側積木預覽即時更新顏色
3. **Given** 精靈在步驟三（程式碼模板），**When** 使用者輸入含有 `${NAME}` 佔位符的程式碼，**Then** 右側下方的程式碼預覽即時顯示展開後的結果
4. **Given** 精靈在步驟二，**When** 使用者點擊步驟一的進度指示，**Then** 回到步驟一且所有已輸入的資料保留不變
5. **Given** 精靈所有步驟完成，**When** 使用者點擊「完成」按鈕，**Then** JSON 檔案被寫入並即時出現在工具箱中
6. **Given** 精靈在步驟三（程式碼模板）的 Arduino 區域，**When** 使用者點擊「搜尋函式庫」按鈕並輸入關鍵字，**Then** 系統透過 PlatformIO CLI 搜尋並顯示函式庫列表，使用者可選取後自動填入 `arduinoIncludes` 和 `arduinoLibDeps` 欄位

---

### User Story 5 — 精靈介面編輯現有積木（Priority: P2）

使用者對工作區中的自訂積木按右鍵，選擇「編輯積木定義」，開啟預填現有定義的精靈介面進行修改。修改後工作區中所有該類型積木即時更新外觀。

**Why this priority**: 與建立精靈共用同一套 UI，邊際開發成本低，但使用者體驗價值高。

**Independent Test**: 右鍵自訂積木選擇「編輯積木定義」，修改顏色後完成，驗證工作區中所有同類型積木即時更新。

**Acceptance Scenarios**:

1. **Given** 工作區中有自訂積木 A，**When** 使用者右鍵點擊 A 選擇「編輯積木定義」，**Then** 精靈以編輯模式開啟，所有欄位預填 A 的現有定義
2. **Given** 精靈在編輯模式，**When** 類型名稱（type）欄位，**Then** 該欄位為唯讀鎖定狀態，防止意外改名
3. **Given** 精靈在編輯模式完成修改，**When** 使用者點擊「完成」，**Then** 對應的 JSON 檔案被覆寫，工作區中所有 A 積木即時更新外觀與行為
4. **Given** 右鍵選單出現在非自訂積木上，**When** 使用者查看選單，**Then** 不顯示「編輯積木定義」選項

---

### User Story 6 — MCP 聊天工具建立積木（Priority: P3）

使用者在 VS Code Copilot 聊天介面中以自然語言描述想要的積木功能，MCP 工具依描述自動生成對應的 JSON 檔案並存入指定資料夾，積木立即出現在工具箱中。

**Why this priority**: 為進階使用情境提供最快速的建立方式，但需要 P1 的載入機制先就位。

**Independent Test**: 在聊天介面中使用 `create_custom_block` 工具描述一個積木，驗證 JSON 被正確寫入且積木出現在工具箱。

**Acceptance Scenarios**:

1. **Given** 使用者在 Copilot 聊天中，**When** 呼叫 `create_custom_block` 工具並提供積木參數，**Then** 系統生成合法 JSON 並寫入指定資料夾
2. **Given** 指定資料夾中已有同名 JSON，**When** MCP 工具嘗試建立同名積木，**Then** 系統自動附加數字後綴避免覆蓋（如 `my_block_2.json`）
3. **Given** 使用者想列出現有自訂積木，**When** 呼叫 `list_custom_blocks` 工具，**Then** 回傳目前所有已載入的自訂積木清單
4. **Given** 使用者想驗證 JSON 格式，**When** 呼叫 `validate_custom_block` 工具並傳入 JSON 內容，**Then** 回傳驗證結果（成功或具體錯誤訊息）

---

### User Story 7 — JSON Schema IntelliSense（Priority: P3）

使用者手動撰寫 JSON 時，VS Code 編輯器提供自動補全、錯誤高亮和欄位說明，降低格式錯誤機率。

**Why this priority**: 提升手動建立的使用者體驗，但即使沒有此功能，P1 的驗證機制已能發現格式錯誤。

**Independent Test**: 開啟一份自訂積木 JSON 檔案，開始輸入新欄位，驗證 VS Code 提供正確的補全建議。

**Acceptance Scenarios**:

1. **Given** 使用者在 JSON 檔案中加入了 `$schema` 參照，**When** 編輯檔案時，**Then** VS Code 提供所有合法 key 的自動補全建議
2. **Given** 使用者輸入不合法的 `shape` 值，**When** 檔案儲存後，**Then** VS Code 顯示紅色底線錯誤標示
3. **Given** 使用者將游標停留在欄位名稱上，**When** VS Code 顯示 hover，**Then** 顯示該欄位的說明文字（中英文）

---

### User Story 8 — 範例檔案隨語系更新（Priority: P3）

指定資料夾中的範例檔案（`_example.json`）內容語言會隨使用者在積木編輯器中切換語系而自動更新。範例檔案以底線前綴命名，載入時自動跳過，不會被當成自訂積木。範例檔內顯示警告，提醒使用者應複製使用而非直接編輯。

**Why this priority**: 輔助功能，提升初次使用體驗。

**Independent Test**: 切換積木編輯器語言，驗證 `_example.json` 的內容隨之更新。

**Acceptance Scenarios**:

1. **Given** 使用者的積木編輯器語系為繁體中文，**When** 系統建立 `_example.json`，**Then** 範例中的說明文字為繁體中文
2. **Given** 範例檔內含警告提示，**When** 使用者開啟 `_example.json`，**Then** 檔案開頭清楚標示「此檔案僅供參考，請複製後使用，直接編輯會被語系更新覆蓋」
3. **Given** 使用者切換語系至日文，**When** 語系切換完成，**Then** `_example.json` 自動更新為日文內容
4. **Given** 資料夾中有 `_example.json` 和 `my_block.json`，**When** 系統載入自訂積木，**Then** 僅載入 `my_block.json`，底線前綴的 `_example.json` 被跳過

### Edge Cases

- 若使用者在同一資料夾放入兩份 JSON 定義了相同的 `type` 名稱，系統僅載入第一份（依字母排序），忽略第二份並在日誌中記錄警告
- 若 JSON 檔案在編輯器開啟前就已存在於資料夾中，系統在初始化載入時一併處理（而非僅依賴即時監聽）
- 若使用者在積木拖曳到工作區的過程中，同時刪除了該積木的 JSON 檔案，系統延遲處理刪除事件直到拖曳完成
- 若自訂積木的 `type` 名稱與內建積木衝突，系統拒絕載入並顯示錯誤訊息
- 若使用者在精靈 UI 編輯過程中關閉了 Modal（按 Escape 或點背景），所有未儲存的修改丟失，不影響原有 JSON
- 若指定資料夾被使用者整個刪除，工作區中所有自訂積木全部替換為佔位積木
- 若 JSON 中的程式碼模板引用了不存在的輸入欄位名稱（如 `${FOO}` 但無名為 `FOO` 的 input），生成的程式碼原樣輸出 `${FOO}` 佔位符，不造成崩潰

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統 MUST 在使用者將合法 JSON 檔案放入指定資料夾後，即時將自訂積木載入到工具箱的「Singular Block」分類中
- **FR-002**: 系統 MUST 在初始化載入工作區時，先讀取並註冊所有自訂積木定義，再載入工作區狀態（確保自訂積木在反序列化前已存在）
- **FR-003**: 系統 MUST 驗證每份 JSON 檔案的格式正確性，拒絕載入不合法的定義並在日誌中記錄原因
- **FR-004**: 系統 MUST 在自訂 JSON 被刪除或損壞時，將工作區中所有使用該積木的位置替換為帶有積木類型名稱的橘紅色警告佔位積木
- **FR-005**: 佔位積木 MUST 保持與原始積木相同的連接形狀（Statement 或 Value），不破壞既有積木結構
- **FR-006**: 系統 MUST 在使用者重新建立相同 `type` 的合法 JSON 後，自動將佔位積木恢復為正常互動積木
- **FR-007**: 系統 MUST 支援 Arduino 和 MicroPython 雙平台程式碼模板，並依據目前選擇的板卡類型生成對應程式碼。Arduino 模板額外支援選填的 `arduinoIncludes`（標頭檔列表）和 `arduinoLibDeps`（PlatformIO 函式庫依賴列表）欄位，生成時自動加入對應的 `#include` 指令和 `lib_deps` 設定。MicroPython 模板額外支援選填的 `micropythonImports`（import 語句列表，僅限標準 MicroPython 函式庫）和 `micropythonHardwareInit`（硬體初始化鍵值對）欄位，生成時自動加入對應的 `addImport()` 和 `addHardwareInit()` 呼叫
- **FR-008**: 系統 MUST 提供置中 Modal 精靈介面，以步驟式引導使用者建立自訂積木（基本設定 → 輸入欄位 → 程式碼模板 → 完成）
- **FR-009**: 精靈介面 MUST 在右側固定區域即時渲染積木外觀預覽和程式碼輸出預覽
- **FR-010**: 精靈介面 MUST 允許使用者在任意步驟間自由來回切換，且已輸入的資料不遺失
- **FR-011**: 使用者 MUST 可透過右鍵選單對已存在的自訂積木開啟精靈編輯模式，type 欄位在編輯模式下為唯讀
- **FR-012**: 系統 MUST 提供 MCP 工具（`create_custom_block`、`list_custom_blocks`、`validate_custom_block`、`delete_custom_block`）供聊天介面使用
- **FR-013**: MCP 工具建立積木時 MUST 確保不與既有檔案重名，衝突時自動附加數字後綴
- **FR-014**: 系統 MUST 提供 JSON Schema 檔案，使 VS Code 編輯器在手動撰寫 JSON 時提供自動補全和錯誤提示
- **FR-015**: 指定資料夾首次建立時 MUST 自動產生語系化的 `_example.json` 範例檔案，並在檔案中警告使用者應複製使用
- **FR-016**: 底線前綴的檔案（`_*.json`）MUST 在積木載入時自動跳過，不被當作自訂積木定義
- **FR-017**: `_example.json` MUST 在使用者切換積木編輯器語系時自動更新為對應語言內容
- **FR-018**: 系統 MUST 拒絕載入 `type` 名稱與內建積木衝突的自訂 JSON
- **FR-019**: 同一 `type` 若在多個 JSON 檔案中重複定義，系統 MUST 僅載入第一份（依字母排序），並記錄警告日誌
- **FR-020**: 精靈介面的視覺風格 MUST 跟隨積木編輯器現有的 light/dark 主題設計
- **FR-021**: 精靈介面的程式碼模板步驟 MUST 提供「搜尋函式庫」功能，透過 PlatformIO CLI 搜尋函式庫，讓使用者從搜尋結果中選取以自動填入 `arduinoIncludes` 和 `arduinoLibDeps`，搜尋 UI 需有清楚的引導說明且支援 15 種語系

### Key Entities

- **CustomBlockDefinition**: 一份自訂積木的完整定義，包含積木類型識別碼、顯示文字、顏色、形狀、輸入欄位列表、Arduino 程式碼模板（含選填的 `arduinoIncludes` 標頭檔列表和 `arduinoLibDeps` 函式庫依賴列表）、MicroPython 程式碼模板（含選填的 `micropythonImports` 標準函式庫 import 列表和 `micropythonHardwareInit` 硬體初始化鍵值對）、提示文字
- **CustomBlockInput**: 積木的一個輸入欄位，包含名稱、模式（值輸入/文字欄位/數字欄位/下拉選單）、標籤、預設值、檢查型別、下拉選項
- **PlaceholderBlock**: JSON 遺失或損壞時的替代積木，記錄原始積木類型名稱與形狀（Statement 或 Value），用於保護工作區結構
- **BlockCreationWizard**: 精靈介面的狀態物件，追蹤目前步驟、模式（新增/編輯）、所有表單欄位

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者從放入 JSON 到積木出現在工具箱中，反應時間不超過 2 秒
- **SC-002**: 使用者透過精靈介面完成一個新積木的建立流程，從開啟到完成不超過 3 分鐘
- **SC-003**: 佔位積木替換發生時，不造成工作區其餘積木的位置或連接關係任何變動
- **SC-004**: 重新建立同名 JSON 後，佔位積木恢復為正常積木的成功率達 100%（位置和連接保留）
- **SC-005**: 所有自訂積木功能的使用者介面文字支援 15 種語系
- **SC-006**: JSON Schema 提供的自動補全涵蓋所有合法欄位與值域
- **SC-007**: MCP 聊天工具生成的 JSON 通過驗證的成功率達 95% 以上
- **SC-008**: 即時預覽與左側表單的同步延遲不超過 500 毫秒

## Assumptions

- 使用者工作區已開啟且包含 `blockly/` 目錄結構
- 自訂積木的程式碼模板由使用者自行負責正確性，系統僅做格式驗證不做語義驗證
- MicroPython 的 `micropythonImports` 僅支援標準 MicroPython 函式庫，不支援第三方套件安裝（無套件管理機制）
- 精靈 UI 中的 Blockly SVG 預覽使用獨立的 Blockly workspace 實例，與主工作區隔離
- 積木顏色使用 HSV hue 值（0-360），與 Blockly 現有色彩系統一致
- `_example.json` 在語系切換時被完整覆寫，使用者不應直接編輯此檔案

## Scope Boundaries

### 包含（In Scope）

- 自訂積木的定義、載入、即時更新、刪除保護、恢復機制
- 三種建立方式：手動 JSON、精靈 UI、MCP 工具
- JSON Schema IntelliSense 輔助
- 語系化範例檔案
- Arduino 和 MicroPython 雙平台程式碼模板

### 排除（Out of Scope）

- 自訂積木之間的互相引用或巢套關係
- 自訂積木的匯出/匯入/分享機制
- 自訂積木市集或線上倉庫
- 程式碼模板的語義驗證（如是否能編譯）
- 自訂積木的版本管理或變更歷程
