# Feature Specification: 非 Blockly 專案警告的 i18n 完善與孩子友善文案改進

**Feature Branch**: `047-warning-i18n-kid-friendly`  
**Created**: 2025-07-15  
**Status**: Draft  
**Input**: User description: "使用者在空白資料夾或只含 .vscode 的資料夾開啟積木編輯器時，會收到「這不是 Blockly 專案」警告。該警告尚未完善支援多國語言，且內容對孩子不夠友善，容易造成理解困難。目標：規劃修正此警告的 i18n 支援與孩子友善文案策略。"

## Background & Problem Statement

Singular Blockly 的「安全守衛」（Safety Guard）機制會在使用者於非 Blockly 專案資料夾開啟積木編輯器時顯示警告對話框。此機制在以下情境觸發：

- **空白資料夾**：資料夾內沒有任何檔案
- **僅含 `.vscode` 的資料夾**：資料夾內只有 VS Code 設定檔
- **其他非 Blockly 專案**：已偵測為 Node.js、Python、Java 等專案類型

**目前問題**：

1. **i18n 品質不一致**：雖然 15 個語系（bg、cs、de、en、es、fr、hu、it、ja、ko、pl、pt-br、ru、tr、zh-hant）皆已建立安全守衛訊息鍵值，但部分翻譯品質參差不齊，且文案風格未考慮目標使用者（孩子）的理解能力。
2. **文案對孩子不友善**：現有訊息使用技術性語彙（如「project」、「Blockly blocks」、「blockly folder and files will be created」），對於主要使用者——兒童與程式初學者——造成理解困難。
3. **按鈕文字不直覺**：「Continue」、「Do Not Remind」等按鈕用語對孩子而言語意不夠明確，不容易理解點下按鈕後會發生什麼事。

## Assumptions

- 主要使用者為兒童（約 8-14 歲）和程式初學者，包含教師指導下的課堂使用情境。
- 警告對話框仍維持目前的兩個明確按鈕（繼續、不再提醒）加上模態對話框內建的取消功能（ESC／關閉按鈕）形式，透過 VS Code 原生 `showWarningMessage({ modal: true })` API 顯示。
- 現有 15 個語系皆需更新文案；不新增額外語系。
- 「不再提醒」的使用者偏好儲存機制維持不變。
- 專案類型偵測邏輯（Node.js、Python、Java 等）維持不變，僅修改顯示給使用者的文案。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 孩子在空白資料夾看到友善提示 (Priority: P1)

一個 10 歲的孩子在課堂上打開了一個空白資料夾，嘗試開啟積木編輯器。系統顯示一個用語簡單、語氣親切的提示訊息，讓孩子能理解目前的狀況並知道如何繼續操作。訊息以孩子所使用的語言顯示。

**Why this priority**: 這是最核心的使用情境——空白資料夾是孩子最常遇到的觸發條件。如果孩子無法理解警告內容，可能會感到困惑而放棄使用，直接影響學習體驗。

**Independent Test**: 可透過在任意空白資料夾開啟積木編輯器來測試。驗證訊息是否以簡單易懂的語言顯示，且按鈕選項的文字是否讓孩子能理解每個選擇的結果。

**Acceptance Scenarios**:

1. **Given** 使用者在一個空白資料夾中開啟積木編輯器，且語系設定為繁體中文, **When** 安全守衛觸發, **Then** 警告訊息以繁體中文顯示，使用孩子能理解的簡單詞彙，不包含技術術語（如「project」、「folder」等原文）
2. **Given** 使用者在一個空白資料夾中開啟積木編輯器，且語系設定為英文, **When** 安全守衛觸發, **Then** 警告訊息以簡單英文顯示，語氣親切，避免使用「Blockly blocks」、「blockly folder and files will be created」等技術描述
3. **Given** 使用者看到友善警告訊息, **When** 使用者閱讀按鈕選項, **Then** 每個按鈕的文字清楚表達按下後會發生什麼事（例如：「好，幫我準備好！」而非「Continue」）

---

### User Story 2 - 所有支援語系顯示一致的友善文案 (Priority: P1)

一位日文環境的孩子和一位波蘭文環境的孩子分別遇到同樣的警告情境。兩人看到的訊息雖然語言不同，但傳達的資訊一致、語氣同樣親切，且都使用該語言中孩子能理解的日常用語。

**Why this priority**: 此擴充套件支援 15 種語言，跨語系的品質一致性是國際化產品的基本要求。任何語系的翻譯品質不佳都會直接影響該語系使用者的體驗。

**Independent Test**: 可透過逐一切換 VS Code 語系設定，在空白資料夾觸發安全守衛，驗證每個語系的訊息內容是否符合孩子友善標準。

**Acceptance Scenarios**:

1. **Given** 系統支援的 15 個語系, **When** 在任一語系中觸發安全守衛, **Then** 警告訊息皆以該語系的孩子友善用語顯示，不出現未翻譯的英文殘留
2. **Given** 警告訊息中包含專案類型名稱（如偵測到 Node.js 專案）, **When** 以非英文語系觸發, **Then** 專案類型名稱以原始技術名稱呈現（如 "Node.js"），但周圍的說明文字使用孩子友善的當地語言
3. **Given** 所有語系的按鈕文字, **When** 比較各語系版本, **Then** 按鈕傳達的語意一致，且皆符合孩子友善的用語標準

---

### User Story 3 - 僅含 .vscode 資料夾情境的友善處理 (Priority: P2)

一個孩子打開了一個只含 `.vscode` 設定資料夾的目錄（可能是之前設定過但尚未建立積木專案的資料夾），嘗試開啟積木編輯器。系統以親切的語氣告知孩子這個資料夾還沒有積木內容，並引導孩子做出選擇。

**Why this priority**: 這是第二常見的觸發場景，尤其在教室環境中，老師可能預先設定好 VS Code 環境但尚未建立 Blockly 專案。

**Independent Test**: 可透過在僅含 `.vscode` 子目錄的資料夾開啟積木編輯器來測試，驗證訊息是否與空白資料夾情境同樣友善。

**Acceptance Scenarios**:

1. **Given** 使用者在一個僅含 `.vscode` 資料夾的目錄中開啟積木編輯器, **When** 安全守衛觸發, **Then** 顯示的訊息與空白資料夾情境使用相同的友善文案（不出現「.vscode」等技術用語）
2. **Given** 使用者選擇繼續, **When** 系統建立積木專案結構, **Then** 後續的確認訊息同樣以孩子友善的語氣呈現

---

### User Story 4 - 偵測到其他專案類型的友善提示 (Priority: P2)

一個孩子誤開了一個 Python 或 Node.js 專案的資料夾，嘗試開啟積木編輯器。系統以容易理解的方式告知孩子「這個資料夾已經有其他程式內容了」，並引導孩子決定是否要在這裡也加入積木功能。

**Why this priority**: 偵測到其他專案類型的情境雖然較少見，但訊息中包含技術性的專案類型名稱，更需要友善的上下文說明來幫助孩子理解。

**Independent Test**: 可透過在含有 `package.json`（Node.js）或 `requirements.txt`（Python）的資料夾觸發安全守衛來測試。

**Acceptance Scenarios**:

1. **Given** 使用者在一個 Node.js 專案資料夾中開啟積木編輯器, **When** 安全守衛觸發, **Then** 訊息以孩子能理解的方式說明「這個資料夾裡已經有其他程式內容」，並提到偵測到的專案類型
2. **Given** 使用者在一個 Python 專案資料夾中開啟積木編輯器且語系為韓文, **When** 安全守衛觸發, **Then** 訊息以韓文孩子友善用語顯示，專案類型 "Python" 保持原文

---

### Edge Cases

- 若使用者的 VS Code 語系設定不在支援的 15 種語言中，系統應以英文顯示孩子友善版本的訊息作為後備語言（fallback）
- 若訊息翻譯文字過長導致 VS Code 對話框排版異常，各語系的文案長度應控制在合理範圍內
- 若使用者先前已勾選「不再提醒」，更新文案後不應重新顯示警告（尊重既有使用者偏好）
- 專案類型名稱（Node.js、Python、Java Maven 等）在所有語系中應保持原始英文技術名稱，不進行翻譯
- 當 i18n 服務載入失敗時，程式碼中的硬編碼英文後備訊息（`workspaceValidator.ts` catch block）也應使用孩子友善的語氣，且措辭需與語系檔英文版本保持一致（目前後備訊息含有「may cause file loss」等警示性用語，與語系檔版本不同）
- 回饋訊息（`SAFETY_GUARD_CANCELLED`、`SAFETY_GUARD_SUPPRESSED`）在 `webviewManager.ts` 中的 fallback 參數目前使用中文硬編碼，應統一改為英文以符合 i18n 後備語言慣例

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 將安全守衛警告的所有使用者可見文字（訊息本文、按鈕文字、確認回饋訊息）更新為孩子友善的用語，適合 8-14 歲使用者閱讀理解
- **FR-002**: 系統 MUST 在全部 15 個支援語系中提供品質一致的孩子友善翻譯，不留任何未翻譯的英文殘留（專案類型技術名稱除外）
- **FR-003**: 系統 MUST 在警告訊息中避免使用以下技術術語或以孩子能懂的日常用語替代：「project」、「Blockly blocks」、「blockly folder and files」、「workspace」
- **FR-004**: 系統 MUST 確保按鈕文字能讓孩子理解每個選擇的後果（例如：點了會發生什麼、不點會怎樣）
- **FR-005**: 系統 MUST 保持安全守衛的三個操作選項功能不變（繼續、取消、不再提醒），僅更新顯示文字
- **FR-006**: 系統 MUST 在偵測到專案類型時，保留專案類型的原始技術名稱（如 "Node.js"、"Python"），但周圍說明文字使用孩子友善用語
- **FR-007**: 系統 MUST 確保安全守衛觸發後的確認與取消回饋訊息也同步更新為孩子友善版本
- **FR-008**: 系統 MUST 尊重使用者先前儲存的「不再提醒」偏好設定，不因文案更新而重設此偏好
- **FR-009**: 系統 MUST 將 `workspaceValidator.ts` catch block 中的硬編碼英文後備訊息同步更新為孩子友善版本，措辭與語系檔英文版本一致，移除「may cause file loss」等警示性用語
- **FR-010**: 系統 MUST 將 `webviewManager.ts` 中回饋訊息的 fallback 參數從中文硬編碼改為英文，以符合 i18n 後備語言最佳實踐

### Key Entities

- **安全守衛訊息（Safety Guard Message）**: 使用者在非 Blockly 專案資料夾開啟積木編輯器時看到的警告訊息。包含訊息本文（含與不含專案類型兩種變體）、兩個對話框按鈕文字（繼續、不再提醒）加上取消操作（模態內建）、操作後的回饋訊息。
- **語系訊息檔（Locale Message File）**: 各語系的本地化文字資源（`media/locales/{lang}/messages.js`），包含安全守衛相關的 7 個訊息鍵值：
  - `SAFETY_WARNING_BODY_NO_TYPE` — 無專案類型時的警告本文
  - `SAFETY_WARNING_BODY_WITH_TYPE` — 含專案類型（`{0}` 占位符）的警告本文
  - `BUTTON_CONTINUE` — 「繼續」按鈕文字（對話框中顯示）
  - `BUTTON_CANCEL` — 「取消」按鈕文字（定義於語系檔中供一致性使用，Safety Guard 對話框本身透過模態內建取消機制處理，不額外渲染此按鈕）
  - `BUTTON_SUPPRESS` — 「不再提醒」按鈕文字（對話框中顯示）
  - `SAFETY_GUARD_CANCELLED` — 使用者取消後的回饋訊息
  - `SAFETY_GUARD_SUPPRESSED` — 使用者選擇不再提醒後的回饋訊息

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 所有 15 個支援語系的安全守衛訊息皆使用目標年齡層（8-14 歲）能理解的日常用語，不包含未經解釋的技術術語
- **SC-002**: 所有語系的翻譯文案經至少一位母語或流利使用者依孩子友善標準審閱通過，確認用語適合 8-14 歲使用者，且按鈕文字語意無歧義
- **SC-003**: 所有語系的按鈕文字皆明確傳達按下後的結果，使用者不需猜測按鈕的功能
- **SC-004**: 文案更新後，各語系訊息的顯示長度符合以下上限指引：警告本文 ≤ 200 字元、按鈕文字 ≤ 15 字元、回饋訊息 ≤ 100 字元（各以該語系字元計算），不造成 VS Code 原生模態對話框的排版問題
- **SC-005**: 既有使用者的「不再提醒」偏好設定在更新後完全保留，不受文案變更影響
- **SC-006**: 所有 15 個語系的翻譯品質經過審閱，確認語意一致、語氣親切、用語適齡

## Clarifications

### Session 2026-03-04

- Q: 對話框實際按鈕數量為何？ → A: 2 個明確按鈕（Continue、Do Not Remind）＋模態內建取消（ESC／關閉），非 spec 原述之「三按鈕」。已修正 Assumptions 描述。
- Q: 安全守衛相關訊息鍵值共幾個？ → A: 7 個（含 BUTTON_CANCEL，雖未在 Safety Guard 對話框渲染，但存於所有語系檔中供一致性使用）。已修正 Key Entities 列表。
- Q: 硬編碼英文後備訊息（catch block）是否也應更新？ → A: 是。workspaceValidator.ts catch block 中的 fallback 使用「may cause file loss」等警示性用語，與語系檔版本不一致且不適合兒童。新增 FR-009。
- Q: webviewManager.ts 回饋訊息的 fallback 參數為何使用中文？ → A: 屬歷史遺留問題，應統一改為英文以符合 i18n 後備語言慣例。新增 FR-010。
- Q: SC-002「90% 目標使用者」如何驗證？ → A: 原指標需實際使用者測試，不切實際。改為「經至少一位母語或流利使用者依孩子友善標準審閱通過」，更具可操作性。
- Q: SC-004「合理範圍」如何量化？ → A: 設定具體上限指引：警告本文 ≤ 200 字元、按鈕 ≤ 15 字元、回饋訊息 ≤ 100 字元。
