# Feature Specification: CyberBrick 範例工作區瀏覽器

**Feature Branch**: `048-cyberbrick-sample-browser`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "CyberBrick 開發板 MicroPython 模式的範例工作區瀏覽器：在 Blockly 工具列新增按鈕（僅 CyberBrick 板顯示），點擊後開啟模態瀏覽器；從 GitHub Raw URL 取得 index.json 範例目錄清單，展示可選擇的範例卡片；選擇後下載對應 JSON 並替換目前工作區；無網路時 fallback 至 extension 內建版本；支援未來擴充多個範例。"

## Background & Problem Statement

使用 CyberBrick 開發板（MicroPython 模式）的使用者——主要為學生與初學者——在啟動 Blockly 編輯器時面對空白工作區，不知道如何開始。目前沒有任何內建的起始範例或教學模板機制，使用者必須從零建立積木，門檻較高。

此功能提供一個可從雲端動態取得的範例清單，讓使用者能快速載入預先設計好的工作區（例如足球機器人模板），立即開始探索與學習。新增範例不需重新發布 extension，只需更新 GitHub repo 上的 `media/samples/index.json` 即可讓所有使用者看到最新內容。

## Assumptions

- 目標使用者為 CyberBrick 板的學生與初學者；Arduino 板使用者無此需求，因此按鈕**僅在 CyberBrick 板模式下顯示**。
- 範例清單透過 GitHub Raw URL 取得（`https://raw.githubusercontent.com/Shen-Ming-Hong/singular-blockly/master/media/samples/index.json`）；使用者不需安裝 Git 工具。
- 無網路時 fallback 至 extension 內建的 `media/samples/` 資料夾，確保離線環境也能使用。
- 範例的多語言標題與描述內嵌於 `index.json`，不依賴 extension i18n 系統，日後更新標題文案無需重新發布 extension。
- 確認對話框（「是否覆蓋目前工作區」）在 extension host 顯示，與現有 VS Code 警告 UX 一致。
- 初始部署包含一個範例（足球機器人 `cyberbrick-soccer-robot.json`），架構支援日後擴充至多個範例。

## Clarifications

### Session 2026-04-04

- Q: 下載的 JSON 是否需要驗證？ → A: 基本 schema 驗證（確認 `workspace` 欄位存在、`board === 'cyberbrick'`；驗證失敗則顯示錯誤通知，工作區不變）
- Q: 模態開啟期間（取得 index.json 過程中）使用者看到什麼？ → A: 先開模態並顯示 loading spinner，取得完成後渲染範例卡片（inline loading）
- Q: 網路請求 timeout 應設為多少秒？ → A: 10 秒（index.json 與具體範例 JSON 均使用相同 timeout）
- Q: 使用者目前工作區為空白時，確認對話框是否仍要顯示？ → A: 工作區為空白時跳過確認，直接載入範例；工作區有積木時才顯示確認對話框
- Q: `index.json` 的 `version` 欄位用途為何？ → A: 純紀錄用，extension 讀取 `version` 但不做任何版本比對或條件行為

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 使用者從瀏覽器選取範例並載入工作區 (Priority: P1)

使用 CyberBrick 板的學生打開 Blockly 編輯器後，注意到工具列有一個「範例」按鈕。點擊後出現模態瀏覽器，顯示可用範例的卡片清單（標題、描述）。他選擇「足球機器人」範例，確認後工作區立即替換為預設的足球機器人積木。

**Why this priority**: 這是功能的核心價值——讓使用者能夠快速開始，無需從零積木排列。沒有這個流程，整個功能無意義。

**Independent Test**: 在已設定 CyberBrick 板的 Blockly 工作區中點擊「範例」按鈕，選擇任一範例並確認，驗證工作區積木被正確替換。

**Acceptance Scenarios**:

1. **Given** 使用者已開啟 Blockly 且板子選為 CyberBrick，**When** 使用者點擊工具列的「範例」按鈕，**Then** 模態瀏覽器立即開啟並顯示 loading spinner；取得 index.json 完成後 spinner 消失，顯示至少一張範例卡片（包含標題與描述）
2. **Given** 模態瀏覽器已開啟，**When** 使用者點擊某張卡片上的「載入」按鈕，**Then** 出現確認對話框提示目前工作區將被覆蓋
3. **Given** 確認對話框已顯示，**When** 使用者選擇確認，**Then** 工作區積木替換為選定範例的積木，板子維持 CyberBrick
4. **Given** 確認對話框已顯示，**When** 使用者選擇取消，**Then** 工作區不變，模態瀏覽器恢復顯示

---

### User Story 2 - 無網路時使用內建 fallback 版本 (Priority: P2)

同一位學生在沒有網路的教室環境打開範例瀏覽器。系統自動偵測到無法連線 GitHub，改用 extension 內建版本的範例清單與範例檔案，功能運作如常。模態瀏覽器顯示一個離線提示，說明目前使用的是內建版本。

**Why this priority**: 許多學校環境無法確保穩定網路。若沒有離線 fallback，功能在這些場合完全失效，損害使用者體驗。

**Independent Test**: 在無網路（或封鎖 `raw.githubusercontent.com`）的環境下點擊「範例」按鈕，驗證仍能顯示範例清單並載入範例。

**Acceptance Scenarios**:

1. **Given** 使用者點擊「範例」按鈕但網路不可用，**When** 系統嘗試取得雲端 `index.json` 失敗，**Then** 自動 fallback 至 extension 內建的 `index.json`，模態照常開啟
2. **Given** 模態瀏覽器以離線 fallback 開啟，**When** 畫面渲染完成，**Then** 顯示離線提示文字（例如「目前使用內建版本」），範例卡片仍正常顯示
3. **Given** 使用者在離線模式下選擇範例並確認，**When** 系統嘗試取得雲端 JSON 失敗，**Then** 從 extension 內建版本載入對應的範例 JSON，工作區正常替換

---

### User Story 3 - 範例按鈕僅在 CyberBrick 板時可見 (Priority: P3)

使用者在 Arduino（Uno/ESP32/Mega 等）板模式下，工具列**不會**出現「範例」按鈕，避免視覺干擾。切換到 CyberBrick 板後，按鈕立即出現。

**Why this priority**: 此功能範圍限定在 CyberBrick。非 CyberBrick 使用者不應看到無關按鈕。

**Independent Test**: 分別在 Arduino 板與 CyberBrick 板下觀察工具列按鈕是否正確顯示/隱藏。

**Acceptance Scenarios**:

1. **Given** 使用者選擇任意 Arduino 板（uno、esp32、mega 等），**When** 工具列渲染完成，**Then** 範例按鈕不可見
2. **Given** 使用者切換板子為 CyberBrick，**When** 板子切換完成，**Then** 範例按鈕立即出現於工具列
3. **Given** 使用者從 CyberBrick 切換回 Arduino 板，**When** 板子切換完成，**Then** 範例按鈕立即消失

---

### User Story 4 - 新增範例不需重新發布 extension (Priority: P4)

開發者（或課程設計者）新增一個「避障機器人」範例：只需在 GitHub repo 新增 `media/samples/cyberbrick-obstacle-avoider.json` 並更新 `media/samples/index.json`，使用網路的使用者立即在範例瀏覽器看到新卡片，無需等待 extension 更新。

**Why this priority**: 這是雲端更新架構的核心價值主張，確保內容迭代速度不受 extension 發布週期限制。

**Independent Test**: 在 `index.json` 手動加入一個新的範例條目（不對應實際檔案），驗證模態瀏覽器渲染出對應卡片，卡片點擊後嘗試載入。

**Acceptance Scenarios**:

1. **Given** `media/samples/index.json` 包含 N 個範例條目，**When** 使用者開啟範例瀏覽器（有網路），**Then** 顯示 N 張範例卡片
2. **Given** 開發者新增第 N+1 個條目至 `index.json` 並 push 到 master，**When** 使用者下次開啟範例瀏覽器（有網路），**Then** 顯示 N+1 張範例卡片，不需更新 extension

---

### Edge Cases

- **使用者目前工作區為空白**：跳過確認對話框，直接載入範例（空工作區無使用者資料需保護）
- **範例 JSON 損壞或格式錯誤**：載入後進行基本 schema 驗證（`workspace` 欄位存在、`board === 'cyberbrick'`）；驗證失敗則顯示錯誤通知，工作區不做任何變更
- **index.json 中某範例的具體 JSON 檔案不存在（雲端或本機）**：顯示錯誤通知，其他範例不受影響
- **使用者快速連按「範例」按鈕多次**：第二次點擊不開啟第二個模態，或關閉後重新開啟
- **index.json 為空陣列（無範例）**：模態顯示「目前沒有可用範例」的提示訊息

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 工具列的範例按鈕 MUST 僅在板子為 `cyberbrick` 時可見，其他板子時隱藏
- **FR-002**: 點擊範例按鈕 MUST 先嘗試從雲端取得 `index.json`，失敗後 MUST fallback 至 extension 內建版本
- **FR-003**: 模態瀏覽器 MUST 依據 `index.json` 動態渲染範例卡片，每張卡片包含本地化標題、描述與載入按鈕
- **FR-004**: 使用者點擊卡片的載入按鈕時，若工作區內有積木 MUST 顯示確認對話框說明目前工作區將被覆蓋；若工作區為空白則跳過確認，直接進行載入
- **FR-005**: 使用者確認後 MUST 先嘗試從雲端取得對應範例 JSON，失敗後 MUST fallback 至 extension 內建版本
- **FR-006**: 成功取得範例 JSON 後 MUST 替換目前工作區，板子維持 `cyberbrick`
- **FR-007**: 離線 fallback 啟用時，模態瀏覽器 MUST 顯示離線提示訊息
- **FR-008**: 範例卡片的標題與描述 MUST 依據使用者目前的 UI 語言顯示，`index.json` 內嵌多語言鍵值（至少支援 15 個語系：bg、cs、de、en、es、fr、hu、it、ja、ko、pl、pt-br、ru、tr、zh-hant）；若當前語系不存在則 fallback 至英文
- **FR-009**: 工具列按鈕 MUST 有 tooltip，顯示本地化文字
- **FR-010**: 新增範例 MUST 只需更新 `media/samples/index.json` 與新增對應 JSON 檔，不需修改 extension 程式碼
- **FR-011**: 載入範例 JSON 後 MUST 執行基本 schema 驗證（確認 `workspace` 欄位存在且 `board === 'cyberbrick'`）；驗證失敗 MUST 顯示錯誤通知並放棄載入，不修改目前工作區
- **FR-012**: 模態瀏覽器 MUST 在點擊按鈕後立即開啟，並顯示 loading spinner；待 index.json 取得完成後（成功或 fallback）再渲染範例卡片，spinner 消失
- **FR-013**: 所有對外 HTTP 請求（index.json 與具體範例 JSON）MUST 設定 10 秒 timeout；超時後 MUST 自動觸發 fallback 至 extension 內建版本

### Key Entities

- **Sample Index** (`index.json`)：範例目錄，包含 `version`（架構版本號，純紀錄用，不影響讀取行為）與 `samples` 陣列；每個 sample 條目含 `id`、`filename`、`board`、多語言 `title`（物件，鍵為語系代碼）、多語言 `description`
- **Sample Workspace** (`{id}.json`)：標準 Blockly workspace JSON，包含 `workspace`（積木序列化狀態）與 `board`（固定為 `"cyberbrick"`）
- **Sample Card**：模態瀏覽器中展示單一範例的 UI 卡片，從 Sample Index 的一個條目渲染而來

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者從點擊「範例」按鈕到看到範例卡片清單，完成時間在有網路下 MUST 在 5 秒以內（包含 index.json 取得時間）
- **SC-002**: 使用者從選擇範例到工作區完成替換，完成時間 MUST 在 5 秒以內（包含範例 JSON 取得時間）
- **SC-003**: 離線環境下，整個範例載入流程 MUST 在 15 秒以內完成（含 10 秒網路 timeout 後的 fallback 執行時間）
- **SC-004**: 在 Arduino 板與 CyberBrick 板之間切換時，範例按鈕的顯示/隱藏切換 MUST 即時發生（使用者感知無延遲）
- **SC-005**: 範例瀏覽器架構 MUST 支援 `index.json` 中包含任意數量的範例條目，不需修改程式碼即可擴充
