# Feature Specification: fischertechnik TXT Controller 支援（多流程擴充）

**Feature Branch**: `051-txt-controller-support`  
**Created**: 2026-05-03  
**Updated**: 2026-05-09  
**Status**: Draft  
**Input**: User description: 「在既有 TXT Controller 支援上，改為一個初始化容器搭配多個流程，模擬 ROBO Pro 小綠人式的並行流程效果；不限制 4 個流程、流程名稱可選，並直接重做尚未發布的單主程式模型。」

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 以一個 TXT 初始化與多個 TXT 流程建立並行控制 (Priority: P1)

學生在 Blockly 工作區中放置一個「TXT 初始化」頂層容器，並加入多個「TXT 流程」頂層容器。每個流程可以有自己的步驟、等待、條件判斷或迴圈。點擊上傳後，系統產生單一 `main.py`，在同一個 TXT Controller 上讓多個流程同時進行，而不是要求學生把所有邏輯硬塞進單一主流程。

**Why this priority**: 這是本次規格擴充的核心價值。若沒有多流程模型，就無法對應使用者希望模擬 ROBO Pro 多個小綠人流程的教學體驗。

**Independent Test**: 建立一個工作區：流程 A 讓 M1 運轉後等待 1000ms 再停止；流程 B 每 200ms 切換 O1 狀態。上傳後，當流程 A 正在等待時，流程 B 仍持續切換 O1，即視為通過。

**Acceptance Scenarios**:

1. **Given** 使用者選擇 TXT Controller 開發板，**When** 工作區包含一個「TXT 初始化」與兩個「TXT 流程」頂層積木，**Then** 生成結果為單一 `main.py`，且只建立一個共享的 `ftrobopy.ftrobopy('auto')` 連線
2. **Given** 流程 A 正在等待 1000ms，**When** 流程 B 持續控制輸出或輪詢輸入，**Then** 流程 B 不會因流程 A 的等待而停止
3. **Given** 一個有限流程與一個長時間執行流程同時存在，**When** 有限流程結束，**Then** 其他流程繼續執行，不會被一併中止
4. **Given** 使用者沒有為流程填入名稱，**When** 仍正常生成與執行，**Then** 系統以內部穩定識別碼追蹤流程，而不要求使用者手動編號

---

### User Story 2 - 設定 TXT 連線參數 (Priority: P1)

教師或學生在首次使用前，點擊 Blockly Editor 工具列上的 **TXT 連線設定** 按鈕，於同一個 WebView 內開啟連線設定對話框，填入 TXT Controller 的 IP 位址、使用者名稱，並輸入密碼（安全儲存）。提供「測試連線」按鈕以 **目前表單值** 驗證設定是否正確，連線成功後設定持久保存於工作區。此設定 UI 與積木編輯器整合，使用者不需切換視窗。

**Why this priority**: 連線設定是 Program Mode 與 Test Mode 的前提條件，P1 與 User Story 1 並列。

**Independent Test**: 填入有效 TXT IP 和帳密，點擊「測試連線」，成功回應即視為通過。不需要實際上傳程式。

**Acceptance Scenarios**:

1. **Given** 使用者開啟連線設定面板，**When** 填入 host、username 後點擊儲存，**Then** host 和 username 儲存至工作區設定，密碼安全儲存（不寫入任何文字檔案）
2. **Given** 使用者已在表單中填入或修改連線資訊，**When** 不先儲存而直接點擊「測試連線」，**Then** 系統以目前表單值在 5 秒內回報連線成功或失敗原因
3. **Given** 曾設定連線資訊，**When** 重新開啟 VS Code，**Then** 自動載入上次的連線設定；若曾儲存自訂密碼，則可由安全儲存自動沿用
4. **Given** 密碼錯誤，**When** 點擊「測試連線」，**Then** 顯示「驗證失敗，請確認密碼」而非原始錯誤堆疊

---

### User Story 3 - I/O 即時測試面板（替代 ROBO Pro Test） (Priority: P2)

學生在接線後，點擊 Blockly Editor 工具列上的 TXT I/O Test Panel 按鈕，在同一個 WebView 內開啟測試對話框，看到 M1-M4 馬達滑桿、O1-O8 輸出開關、I1-I8 輸入狀態即時更新。可手動控制馬達轉速和輸出，驗證接線正確再進 Blockly 編程。面板上有顯眼的「全部停止」按鈕。

**Why this priority**: 教學場景中，接線驗證是學生在開始撰寫程式前的必要步驟。沒有 Test Panel，學生無法區分接線錯誤和程式錯誤，大幅增加困擾。

**Independent Test**: 開啟 Test Panel，拖動馬達 M1 滑桿至 100，TXT 的 M1 馬達開始轉動即視為通過。不需要任何 Blockly 程式碼。

**Acceptance Scenarios**:

1. **Given** TXT 連線已設定，**When** 點擊 Blockly Editor 工具列上的「TXT I/O Test Panel」按鈕，**Then** 在同一個 WebView 內的對話框顯示 M1-M4 馬達控制、O1-O8 輸出開關、I1-I8 輸入讀值
2. **Given** Test Panel 已開啟，**When** 感測器 I1 有物體通過，**Then** I1 的讀值在 500ms 內更新顯示
3. **Given** 馬達正在運轉，**When** 點擊「全部停止」，**Then** 所有馬達立即停止，所有輸出關閉
4. **Given** Test Panel 開啟中，**When** 程式上傳並執行，**Then** Test Panel 自動進入「程式執行中」暫停模式，避免衝突；程式結束後恢復 Test 模式

---

### User Story 4 - TXT 工具箱與流程命名對學生友善 (Priority: P2)

學生在工具箱中看到清楚的「TXT 初始化」、「TXT 流程」與既有 TXT 基本控制積木。流程積木提供可選名稱欄位，例如「TXT 流程：避障」；若不填名稱也能正常使用。系統不把「4 個流程」當成 UI 上的限制，也不要求流程一定要手動編號。所有可見積木與警告文案在 15 種語言中都能正確顯示。

**Why this priority**: 這直接影響教學與認知負擔。學生理解的是「不同流程在做不同事」，而不是「我必須學會某種隱藏的編號規則」。

**Independent Test**: 使用繁體中文介面時，學生能從工具箱找到「TXT 初始化」與「TXT 流程」，建立兩個未命名流程並正常生成程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者開啟 TXT 工具箱，**When** 為新工作區選取積木，**Then** 看到「TXT 初始化」與「TXT 流程」，而不是舊版 `txt_main`
2. **Given** 流程名稱留白，**When** 生成程式，**Then** 系統仍正常執行，不報必填錯誤
3. **Given** 兩個流程使用相同顯示名稱，**When** 儲存與重新載入，**Then** 系統仍能透過內部穩定 ID 正確識別兩個不同流程
4. **Given** 使用者開啟「迴圈」類別，**When** 想建立持續運作流程，**Then** 仍能找到兒童友善的無限循環積木，而不需自己手刻布林常數

---

### User Story 5 - 首次發布即提供一致的 TXT 多流程模型 (Priority: P1)

教師或學生在第一次接觸正式發布的 TXT 功能時，只會看到「TXT 初始化 + TXT 流程」模型，不需要理解任何未公開過的單主程式積木或相容模式。從空白工作區建立、儲存、重新開啟都維持同一套頂層模型與工具箱體驗。

**Why this priority**: 既然 `txt_main` 從未對外發布，直接重做能讓首發 UX 更乾淨，也避免把尚未公開的過渡設計變成長期包袱。

**Independent Test**: 從空白 TXT 工作區建立一個初始化與兩個流程，儲存後重新開啟，工作區與工具箱仍只顯示新模型。

**Acceptance Scenarios**:

1. **Given** 使用者第一次建立 TXT 工作區，**When** 開啟工具箱與工作區，**Then** 只看到「TXT 初始化」與「TXT 流程」相關作者模型
2. **Given** 使用者儲存並重新開啟同一專案，**When** Blockly 編輯器重新載入，**Then** 不出現 `txt_main` 或任何 legacy 遷移提示
3. **Given** 開發者依 quickstart 與測試流程驗證功能，**When** 檢查文件、範例與 regression 測試，**Then** 全部以新模型為唯一正式 TXT 作者體驗

---

### Edge Cases

- 若工作區沒有任何「TXT 初始化」容器，系統應給出明確警告，不應默默生成不完整程式
- 若工作區出現多個「TXT 初始化」容器，系統應阻止或警告重複初始化
- 若工作區沒有任何「TXT 流程」，但有初始化與函式定義，應能明確告知「沒有可執行流程」
- 若一個流程為有限流程而其他流程為長時間流程，有限流程結束後不應影響其他流程繼續執行
- 若兩個流程同時控制同一個馬達或輸出，系統需在文件與 UX 上清楚提示這屬於不建議的競爭控制情境
- 若開發過程仍殘留 `txt_main`、`txt_init` 或 `txt_input_read` 的公開入口，正式工具箱、預設工作區與文件不得暴露它們
- 對於持續輪詢或控制 TXT 硬體的 `while` 迴圈，若某條可抵達迴圈尾端的路徑沒有明確 pacing，generator 應自動補上節流；反之若已節流或進入不返回的內層迴圈，則不得重複插入多餘 pacing

## Requirements *(mandatory)*

### Functional Requirements

**多流程程式模型**

- **FR-001**: 系統 MUST 提供「TXT Controller」作為可選開發板，在積木編輯器的開發板下拉選單中顯示
- **FR-002**: 選擇 TXT Controller 後，工具箱 MUST 切換顯示 TXT 專屬積木類別，且新工作區 MUST 顯示「TXT 初始化」與「TXT 流程」而非舊版 `txt_main`
- **FR-003**: 系統 MUST 提供一個可見的頂層「TXT 初始化」容器，以及可重複使用的頂層「TXT 流程」容器
- **FR-004**: 「TXT 流程」 MUST 提供可選名稱欄位；流程名稱 MUST NOT 被要求唯一、MUST NOT 強制使用者手動編號
- **FR-005**: 系統 MUST NOT 對「TXT 流程」數量施加人工硬上限；不得把「4 個流程」作為產品限制
- **FR-006**: 系統 MUST 產生單一 `main.py`，並在其中使用單一共享的 `ftrobopy.ftrobopy('auto')` 連線；MUST NOT 為每個流程建立獨立 `ftrobopy` 擁有者
- **FR-007**: 一個流程中的等待或延遲 MUST NOT 阻塞其他流程；使用者應能觀察到其他流程持續運作
- **FR-008**: 有限流程結束時 MUST 只終止自身，不得連帶停止其他仍在運行的流程
- **FR-009**: 系統 MUST 對缺少初始化容器、重複初始化容器或沒有任何流程容器的工作區提供明確警告或驗證回饋
- **FR-010**: 系統 MUST 以 `txt_setup` + `txt_process` 作為唯一正式支援的 TXT 頂層作者模型；未發布的 `txt_main` 不列入使用者相容需求
- **FR-011**: 所有新建、儲存、重新載入後的 TXT 工作區，以及正式工具箱、文件與範例 MUST 持續使用新頂層模型，且 MUST NOT 暴露 `txt_main`、`txt_init` 或 `txt_input_read`
- **FR-012**: Blockly 工作區的積木 MUST 能生成語法正確、可在 ftrobopy 環境下執行的 Python 程式；對於持續輪詢或控制 TXT 硬體的 `while` 迴圈，若可抵達迴圈尾端的路徑未包含明確 pacing，generator MUST 自動補上符合 ftrobopy exchange cycle 的節流語句；`txt_wait` 類延遲積木 MUST 保持只暫停當前流程，並 SHOULD 以 wall-clock delay 實作，而非重用 ftrobopy 的 exchange-cycle wait API
- **FR-013**: 生成的 Python 程式 MUST 使用 ftrobopy 的標準 API：主程式以 `ftrobopy.ftrobopy('auto')` 建立連線，馬達控制使用 `motor(N).setSpeed(v)`（v 為 -512~512，正數為正轉、負數為反轉、0 為停止），一般數位輸入可用 `input(N).state()` 讀取；Blockly 積木使用 0~512 速度 + 正/反轉選項，generator 將反轉轉成負數傳入

**Program Mode**

- **FR-014**: 系統 MUST 透過 SSH/SCP 將生成的 `main.py` 上傳至 TXT 的指定遠端路徑
- **FR-015**: 上傳成功後，系統 MUST 透過 SSH 在 TXT 上執行 `python3 main.py`
- **FR-016**: 執行期間的 stdout/stderr MUST 即時顯示在 VS Code Output Channel
- **FR-017**: 使用者 MUST 能中途停止執行中的遠端程式
- **FR-018**: 上傳與執行流程 MUST 顯示進度（連線中→上傳中→執行中→完成/失敗）

**連線設定**

- **FR-019**: 使用者 MUST 能透過 Blockly Editor 工具列按鈕，在同一個 WebView 內開啟 TXT 連線設定對話框，設定 TXT 的 IP/hostname、SSH 使用者名稱（不需開啟獨立視窗）
- **FR-020**: 密碼 MUST 使用 VS Code 安全儲存機制（SecretStorage），不得寫入任何文字檔案或 settings.json
- **FR-021**: 系統 MUST 提供「測試連線」功能，並以目前表單值進行測試，在 5 秒內回報 SSH 連線成功或失敗原因
- **FR-022**: 連線設定（IP、使用者名稱）MUST 持久保存至工作區設定，跨 VS Code 重啟後仍有效；`singular-blockly.txt.host` 的預設值 MUST 為 `192.168.7.2`

**Test Mode**

- **FR-023**: 系統 MUST 提供整合於 Blockly Editor WebView 內的 TXT I/O Test Panel 對話框（透過工具列按鈕開啟）
- **FR-024**: Test Panel MUST 顯示 M1-M4 馬達速度控制滑桿（範圍 0~512，含正/反轉選擇），且滑桿鬆手後保持最後速度
- **FR-025**: Test Panel MUST 顯示 O1-O8 輸出狀態開關（開/關）
- **FR-026**: Test Panel MUST 顯示 I1-I8 輸入即時讀值，更新頻率不低於每 500ms 一次
- **FR-027**: Test Panel MUST 提供顯眼的「全部停止」按鈕，點擊後立即停止所有馬達和輸出
- **FR-028**: Test Panel MUST 在程式執行期間自動進入暫停模式，結束後恢復
- **FR-029**: Test Panel 關閉時 MUST 自動發送全部停止命令

**安全性與國際化**

- **FR-030**: Program Mode 與 Test Mode MUST NOT 同時對 TXT 發出控制命令，系統需明確管理裝置狀態（Idle / Testing / Running / Stopping）
- **FR-031**: `TxtDeviceState` 的 Running → Idle 轉換 MUST 由 `ssh.execCommand('python3 main.py')` Promise resolve 觸發，exit code 非 0 時轉換至 Error 狀態
- **FR-032**: 所有可見 TXT 積木、workspace 驗證警告與多流程相關文案 MUST 在 15 種語言（bg, cs, de, en, es, fr, hu, it, ja, ko, pl, pt-br, ru, tr, zh-hant）中完整翻譯
- **FR-033**: 系統 MUST 繼續在「迴圈」工具箱類別提供兒童友善的無限循環積木，讓使用者不需自行組合布林常數即可建立持續流程
- **FR-034**: 系統 MUST 能在開啟 TXT I/O Test Panel 時，自動準備並啟動所需的 TXT runtime（如 `txt-runtime/io_server.py`），避免要求學生先手動登入裝置安裝服務

### Key Entities *(include if feature involves data)*

- **TxtConnectionConfig**: TXT 裝置的連線參數（host/IP、username、remotePath、runtimePort）；IP 與 username 存於工作區設定，密碼存於 SecretStorage
- **TxtDeviceState**: TXT 裝置的目前狀態枚舉（Idle、Testing、Running、Stopping、Disconnected、Error）；防止 Program Mode 與 Test Mode 衝突
- **TxtIoSnapshot**: 某一時刻 TXT 的完整 I/O 狀態（M1-M4 速度、O1-O8 輸出、I1-I8 輸入）
- **TxtFlowDescriptor**: 單一「TXT 流程」的內部描述（穩定 ID、可選顯示名稱、啟動順序）
- **TxtWorkspaceTopology**: 目前工作區的頂層 TXT 模型摘要（初始化容器數量、流程數量、可執行流程狀態），供 workspace 驗證與診斷使用
- **TxtBlock（核心積木集）**: 新模型以 `txt_setup`（UI 顯示「TXT 初始化」）、`txt_process`（UI 顯示「TXT 流程」）、`txt_motor_speed`、`txt_motor_stop`、`txt_output`、`txt_input_sensor`、`txt_wait`、`txt_stop_all` 為主

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 從 Blockly 積木生成到 TXT 開始執行，全程不超過 30 秒（良好網路環境下）
- **SC-002**: 學生能在 5 分鐘內完成「接線驗證 → 建立一個初始化與兩個流程 → 上傳執行」的完整流程，無需教師介入
- **SC-003**: 當某一流程進入等待時，其他活躍流程仍能在 500ms 內持續對硬體產生可觀察變化
- **SC-004**: 從空白 TXT 工作區建立、儲存並重新開啟後，工作區全程只呈現 `txt_setup` + `txt_process` 新模型，不需理解 `txt_main`
- **SC-005**: 產品與 UI 不以「最多 4 個流程」作為限制；流程數量不設人工硬上限
- **SC-006**: Test Panel 的 I/O 讀值更新延遲不超過 500ms（HTTP polling 模式）
- **SC-007**: 所有 TXT 積木在 15 種語言下均有完整翻譯（`npm run validate:i18n` 通過，覆蓋率 100%）
- **SC-008**: 新增多流程功能不影響現有 Arduino 和 CyberBrick 開發板的任何既有功能（現有測試套件全數通過）

## Clarifications

### Session 2026-05-03

- Q: 連線設定（IP、使用者名稱、密碼）的 UI 入口形式？ → A: 整合在 Blockly Editor WebView 內；現行採工具列按鈕開啟對話框，不再使用側欄或頂部設定區
- Q: I/O Test Server（`io_server.py`）的安裝與啟動方式？ → A: 以開啟 Test Panel 時自動上傳並啟動為主，手動命令僅保留作維護用途
- Q: Test Panel 馬達滑桿鬆手後行為？ → A: 保持最後速度，需手動歸零或按「全部停止」
- Q: TxtDeviceState 從 Running 切回 Idle 的觸發條件？ → A: `ssh.execCommand('python3 main.py')` Promise resolve 後即代表程式結束，exit code 作為成功/失敗判斷

### Session 2026-05-08

- Q: TXT 連線設定 UI 的主要入口是側欄/頂部設定區，還是工具列按鈕開啟對話框？ → A: 以 Blockly Editor 工具列按鈕開啟同一個 WebView 內的對話框為準
- Q: 「測試連線」應使用已儲存設定，還是目前表單值？ → A: 使用目前表單值，允許先測試再儲存
- Q: TXT Test Panel 是獨立 WebView，還是整合在 Blockly Editor？ → A: 整合在 Blockly Editor 內，以 `<dialog>` 對話框呈現
- Q: TXT 連線設定應存在哪個範圍？ → A: 存於工作區設定（project/workspace scoped），不得使用 global scope

### Session 2026-05-09

- Q: 新的頂層模型是否保留「1 個初始化 + 多個流程」？ → A: 是，學生看到的是一個「TXT 初始化」搭配多個「TXT 流程」
- Q: 是否保留「最多 4 個流程」限制？ → A: 否，不在產品層加入 4 個流程上限；僅遵守安全使用最佳實踐
- Q: 流程積木是否一定要編號？ → A: 否，流程名稱是可選的，編號不作為必填 UX
- Q: 現有 `txt_main` 該如何處理？ → A: `txt_main` 未曾發布，因此本次直接重做；正式產品面只保留新模型，不設計 legacy migration

## Assumptions

- **目標硬體**：舊版 fischertechnik TXT Controller（非 TXT 4.0），運行 ftCommunity 社群韌體，SD 卡開機，不覆蓋原廠韌體
- **TXT 端環境**：ftCommunity firmware 已安裝；Python 3 可執行；ftrobopy 已安裝；SSH 服務已啟用；預設 SSH 帳號為 `ftc`
- **連線方式**：底層統一視為 IP + SSH 連線，預設採用 USB 網路介面（TXT 端固定 IP `192.168.7.2`）
- **程式執行模式**：仍產生單一 `main.py` 並透過 SSH 執行；本次擴充只改變工作區作者模型與流程執行模型，不改成多檔案或多個獨立上傳程式
- **多流程安全原則**：產品不限制流程數量，但實務上流程數量與複雜度仍受 TXT CPU、流程 pacing 與共享硬體競爭影響；教學文件需明確建議避免多流程同時控制同一硬體端點
- **未發布前重做**：目前分支內部的 `txt_main`、`txt_init`、`txt_input_read` 屬 pre-release 實作，可直接清理或重構，不形成對外相容承諾
