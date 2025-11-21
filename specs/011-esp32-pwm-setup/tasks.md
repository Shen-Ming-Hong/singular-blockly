# Tasks: ESP32 PWM 頻率與解析度設定

**Feature Branch**: `011-esp32-pwm-setup`  
**Input**: Design documents from `/specs/011-esp32-pwm-setup/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/esp32-pwm-api.md, quickstart.md

**Tests**: 此功能包含單元測試與整合測試,用於驗證 PWM 驗證邏輯和程式碼生成的正確性。WebView 互動功能使用手動測試(符合 Constitution Principle VII UI Testing Exception)。

**Organization**: 任務依使用者故事分組,每個故事可獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可並行執行(不同檔案,無依賴關係)
-   **[Story]**: 此任務屬於哪個使用者故事(如 US1, US2, US3)
-   所有任務皆包含確切的檔案路徑

## Path Conventions

此專案為 VSCode Extension,程式碼分為兩個執行環境:

-   **Extension Host (Node.js)**: `src/` 目錄 - TypeScript 程式碼
-   **WebView (Browser)**: `media/` 目錄 - JavaScript/HTML/CSS 程式碼
-   **測試**: `src/test/suite/` 目錄 - TypeScript 測試程式碼
-   **規格文件**: `specs/011-esp32-pwm-setup/` 目錄

---

## Phase 0: Research (研究驗證)

**目的**: 使用 MCP 工具驗證技術可行性與 API 相容性,符合 Constitution Principle V (研究驅動開發)

-   [ ] R001 [P] 使用 MCP `resolve-library-id` 和 `get-library-docs` 查閱 ESP32 LEDC API 文件,驗證 `ledcSetup()`, `ledcAttachPin()`, `ledcWrite()` 的參數與行為
-   [ ] R002 [P] 使用 MCP `webSearch` 查閱 ESP32 硬體限制公式 (頻率 × 2^解析度 ≤ 80,000,000),確認 APB_CLK 80MHz 的官方文件來源
-   [ ] R003 [P] 使用 MCP `webSearch` 查閱 TB6612/DRV8833/AT8833CR 馬達驅動晶片規格表,確認 PWM 頻率需求 (20-75KHz 範圍)
-   [ ] R004 [P] 使用 MCP `resolve-library-id` 和 `get-library-docs` 查閱 Blockly 12.3.1 的 FieldNumber 和 FieldDropdown API,驗證 min/max 參數與選項設定方法

**Checkpoint**: 所有技術假設已透過權威文件驗證,可安全進入實作階段

---

## Phase 1: Setup (環境準備)

**目的**: 專案初始化與基本環境驗證

-   [ ] T001 驗證開發環境符合 quickstart.md 需求(Node.js 22.16.0+, npm 10.0.0+)
-   [ ] T002 執行 `npm install` 確認所有依賴正確安裝
-   [ ] T003 [P] 執行 `npm run compile` 驗證 TypeScript 編譯無誤
-   [ ] T004 [P] 執行 `npm test` 確認現有測試全部通過(作為基準線)
-   [ ] T005 啟動 Extension Development Host(F5)驗證擴充功能可正常載入

---

## Phase 2: Foundational (基礎建設)

**目的**: 建立核心驗證邏輯與測試框架,供所有使用者故事使用

**⚠️ 關鍵**: 此階段必須完成才能開始任何使用者故事的實作

-   [ ] T006 建立 `specs/011-esp32-pwm-setup/contracts/esp32-pwm-api.md` 文件，定義 `validateAndAdjustPwmConfig` 函數的 API 契約（輸入參數：frequency: number, resolution: number；返回值：{ adjustedFrequency: number, adjustedResolution: number, isAdjusted: boolean, warningMessage?: string }）
-   [ ] T007 在 `media/blockly/generators/arduino/io.js` 開頭新增 `validateAndAdjustPwmConfig` 驗證函數(約 30 行程式碼，依據 contracts/esp32-pwm-api.md 定義實作)
-   [ ] T008 [P] 建立測試檔案 `src/test/suite/pwm-validation.test.ts` 並實作驗證邏輯的單元測試
-   [ ] T009 [P] 在 `media/locales/zh-hant/messages.js` 末尾新增 ESP32 PWM 相關的繁體中文翻譯鍵值(共 8 個鍵值)：
    -   `ESP32_PWM_SETUP`：積木標籤「設定 ESP32 PWM」
    -   `ESP32_PWM_FREQUENCY`：欄位名稱「頻率 (Hz)」
    -   `ESP32_PWM_RESOLUTION`：欄位名稱「解析度 (bit)」
    -   `ESP32_PWM_FREQUENCY_TOOLTIP`：頻率欄位 tooltip「設定 PWM 頻率，範圍 1-80000 Hz。高頻率適用於馬達驅動晶片（20-75KHz）」
    -   `ESP32_PWM_RESOLUTION_TOOLTIP`：解析度欄位 tooltip「設定 PWM 解析度，影響輸出精度。注意：頻率 × 2^解析度 ≤ 80,000,000」
    -   `ESP32_PWM_RESOLUTION_8BIT`：解析度選項「8 bit (0-255)」
    -   `ESP32_PWM_RESOLUTION_10BIT`：解析度選項「10 bit (0-1023)」
    -   `ESP32_PWM_RESOLUTION_12BIT`：解析度選項「12 bit (0-4095)」（及其他解析度選項）
-   [ ] T010 [P] 在 `media/locales/en/messages.js` 末尾新增 ESP32 PWM 相關的英文翻譯鍵值(共 8 個鍵值，對應 T009 的英文版本)

**Checkpoint**: 驗證函數與測試框架已就緒,可開始使用者故事實作

---

## Phase 3: User Story 1 - 馬達晶片高頻控制 (Priority: P1) 🎯 MVP

**目標**: 教育者或學生可透過視覺化積木設定 ESP32 的 PWM 頻率(最高 75KHz)和解析度(8-16 bit),用於控制需要高頻 PWM 的馬達驅動晶片(如 AT8833CR、DRV8833),無需手動撰寫程式碼。

**獨立測試**: 拖曳 ESP32 PWM 設定積木並設定 75000Hz / 8bit,然後使用類比輸出積木,檢查生成的 Arduino 程式碼是否正確包含 `ledcSetup(channel, 75000, 8)`,並在實體硬體上驗證馬達驅動晶片正常運作。

### 積木定義與介面

-   [ ] T011 [P] [US1] 在 `media/blockly/blocks/arduino.js` 末尾新增 `esp32_pwm_setup` 積木定義(約 30 行程式碼,包含 FieldNumber 和 FieldDropdown)
-   [ ] T012 [P] [US1] 在 `media/toolbox/categories/arduino.json` 中的 `arduino_pullup` 積木之後新增 `esp32_pwm_setup` 積木項目

### 程式碼生成器修改

**註**：`validateAndAdjustPwmConfig` 函數僅負責驗證與調整邏輯（純函數），不修改全域變數。全域變數 `window.esp32PwmFrequency` 和 `window.esp32PwmResolution` 的寫入由積木的 `onchange` 事件處理（在 Phase 5 實作）。

-   [ ] T013 [US1] 在 `media/blockly/generators/arduino/io.js` 中定位 `arduino_analog_write` 生成器(約第 113 行)的 ESP32 分支
-   [ ] T014 [US1] 修改 `arduino_analog_write` 生成器的 ESP32 分支:讀取全域 PWM 配置(window.esp32PwmFrequency/Resolution),呼叫 validateAndAdjustPwmConfig,生成 ledcSetup/ledcAttachPin/ledcWrite 程式碼(約 40 行修改)
-   [ ] T015 [US1] 在程式碼生成器中實作防重複機制:使用 setupKey（生成器內部使用的唯一識別符，格式為 `pwm_setup_${pin}`，用於防止同一腳位多次生成初始化程式碼）檢查避免同一腳位多次生成 ledcSetup

### 測試與驗證

-   [ ] T016 [US1] 執行 Phase 2 建立的單元測試,確認驗證函數邏輯正確(相容配置、不相容配置、邊界值)
-   [ ] T017 [US1] 手動測試:在 Extension Development Host 中開啟 Blockly 編輯器,切換至 ESP32 開發板,驗證工具箱顯示 PWM 設定積木
-   [ ] T018 [US1] 手動測試:拖曳 PWM 設定積木(75000Hz / 8bit) + 類比輸出積木(GPIO25, 值 128),生成程式碼並檢查包含正確的 ledcSetup 和驗證註解
-   [ ] T019 [US1] 實體硬體測試:上傳程式到 ESP32 實體硬體,連接 AT8833CR 或 DRV8833 馬達驅動模組和直流馬達,驗證馬達正常運轉且無高頻噪音

### 工具箱開發板過濾 (FR-008)

-   [ ] T020 [US1] 在 `media/js/blocklyEdit.js` 的 `updateToolboxForBoard` 函數中實作邏輯:檢查 `window.currentBoard` 是否為 'esp32' 系列開發板,僅在 ESP32 時於工具箱顯示 `esp32_pwm_setup` 積木（完全隱藏而非禁用）
-   [ ] T021 [US1] 手動測試:切換開發板從 Arduino Uno 到 ESP32,驗證工具箱中 PWM 設定積木在 Arduino 時完全不可見、在 ESP32 時正常顯示

**Checkpoint**: 使用者可透過積木介面設定 PWM 並正確控制馬達驅動晶片

---

## Phase 4: User Story 2 - 自動相容性驗證與調整 (Priority: P2)

**目標**: 當使用者設定不相容的頻率/解析度組合(如 75000Hz @ 12bit)時,系統自動調整為相容配置並生成警告註解,避免生成無法運作的程式碼。

**獨立測試**: 設定不相容參數(75000Hz @ 12bit)並檢查生成的程式碼是否自動調整為相容配置(如 75000Hz @ 10bit 或 8bit)且包含警告註解,然後驗證程式上傳後硬體正常運作。

### 驗證邏輯增強

-   [ ] T022 [US2] 在 `validateAndAdjustPwmConfig` 函數中完善警告訊息格式,確保清楚說明原始設定、限制原因和調整結果(已在 Phase 2 實作基礎,此處優化訊息)
-   [ ] T023 [US2] 在 `arduino_analog_write` 生成器中實作註解插入邏輯:根據 validateAndAdjustPwmConfig 返回結果,在 setupCode\_ 中插入驗證通過或警告註解

### 測試案例擴充

-   [ ] T024 [P] [US2] 在 `src/test/suite/pwm-validation.test.ts` 中新增不相容配置的測試案例(75000Hz @ 12bit → 自動調整為 10bit)
-   [ ] T025 [P] [US2] 在 `src/test/suite/pwm-validation.test.ts` 中新增極限頻率測試案例(80000Hz @ 8bit,確認計算正確性)
-   [ ] T026 [US2] 手動測試:設定不相容參數(75000Hz @ 12bit),生成程式碼,檢查包含 "⚠️ 警告" 註解
-   [ ] T027 [US2] 手動測試:設定相容參數(5000Hz @ 12bit),生成程式碼,檢查包含 "✓ 驗證" 註解
-   [ ] T028 [US2] 實體硬體測試:上傳自動調整後的程式到 ESP32,驗證硬體正常初始化 PWM 且無錯誤

### 邊界情況測試 (Edge Cases)

-   [ ] T029 [US2] 手動測試:在 PWM 設定積木的頻率欄位嘗試輸入 90000Hz (超出上限),驗證 FieldNumber 阻擋輸入並保持最大值 80000Hz
-   [ ] T030 [US2] 手動測試:在 PWM 設定積木的頻率欄位嘗試輸入 0Hz (低於下限),驗證 FieldNumber 阻擋輸入並保持最小值 1Hz

**Checkpoint**: 系統可自動檢測並修正不相容配置,確保生成可運作的程式碼

---

## Phase 5: User Story 3 - 預設值向後相容 (Priority: P3)

**目標**: 現有使用 ESP32 的專案若未使用 PWM 設定積木,應繼續以預設值(75000Hz / 8bit)正常運作,不破壞已存在的工作區檔案。

**獨立測試**: 開啟舊版本建立的 ESP32 專案(包含類比輸出積木但沒有 PWM 設定積木),驗證載入後能正常生成程式碼,且使用預設值 75000Hz / 8bit。

### 工作區載入邏輯

-   [ ] T031 [US3] 在 `media/js/blocklyEdit.js` 末尾新增 `rebuildPwmConfig(workspace)` 函數:掃描工作區中的 esp32_pwm_setup 積木並重建全域變數,若無積木則使用預設值
-   [ ] T032 [US3] 在 `media/js/blocklyEdit.js` 的 `loadWorkspace` 事件處理器中,於載入工作區狀態後呼叫 `rebuildPwmConfig(workspace)`
-   [ ] T033 [US3] 在 `media/js/blocklyEdit.js` 的工作區變更監聽器中新增邏輯:監聽 esp32_pwm_setup 積木的變更事件並執行對應操作：
    -   **Blockly.Events.BLOCK_CHANGE**（欄位值更新）：讀取積木當前的頻率和解析度值，即時更新 `window.esp32PwmFrequency` 和 `window.esp32PwmResolution`
    -   **Blockly.Events.BLOCK_CREATE**（積木新增）：讀取新積木的預設值或使用者設定值，更新全域變數（若工作區已有其他 PWM 設定積木，取最後一個）
    -   **Blockly.Events.BLOCK_DELETE**（積木刪除）：檢查工作區是否還有其他 esp32_pwm_setup 積木，若無則重置全域變數為預設值（75000Hz / 8bit），若有則取剩餘積木的設定值

### 預設值機制驗證

-   [ ] T034 [US3] 在 `arduino_analog_write` 生成器中確認讀取全域變數時使用容錯語法:`window.esp32PwmFrequency || 75000` 和 `window.esp32PwmResolution || 8`
-   [ ] T035 [US3] 手動測試:建立新專案但不拖曳 PWM 設定積木,直接使用類比輸出積木,生成程式碼並檢查使用預設值 `ledcSetup(..., 75000, 8)`
-   [ ] T036 [US3] 手動測試:開啟舊專案(僅包含類比輸出積木),載入後檢查 Console 訊息確認 rebuildPwmConfig 正確重建預設值,生成程式碼驗證正確
-   [ ] T037 [US3] 手動測試:切換開發板從 Arduino Uno 到 ESP32,驗證類比輸出積木生成的程式碼使用預設 PWM 設定
-   [ ] T038 [US3] 整合測試:驗證從 main.json 載入包含 esp32_pwm_setup 積木的工作區後,全域變數正確重建為積木設定的值（而非預設值）

**Checkpoint**: 舊專案與新專案無 PWM 設定積木時,皆正常使用預設值運作

---

## Phase 6: User Story 4 - 伺服馬達與 PWM 共存 (Priority: P3)

**目標**: 使用者可在同一專案中同時使用伺服馬達(SG90/MG90,固定 50Hz)和高頻 PWM 控制馬達驅動晶片(75KHz),兩者使用不同腳位且互不干擾。

**獨立測試**: 建立同時包含伺服馬達設定積木(GPIO18)和 ESP32 PWM 設定積木(75KHz) + 類比輸出積木(GPIO25)的專案,驗證生成的程式碼正確使用兩種獨立的 PWM 系統(ESP32Servo 和 LEDC),並在實體硬體上確認兩者同時正常運作。

### 程式碼生成隔離驗證

-   [ ] T039 [US4] 檢視 `media/blockly/generators/arduino/io.js` 中的伺服馬達相關程式碼生成器,確認其使用 ESP32Servo 庫而非 LEDC 系統
-   [ ] T040 [US4] 驗證 `arduino_analog_write` 生成器使用的 LEDC 通道編號不與伺服馬達使用的通道衝突(LEDC 通道 0-15,伺服馬達使用 ESP32Servo 庫的獨立通道)

### 共存測試

-   [ ] T041 [US4] 手動測試:建立包含伺服馬達積木(GPIO18, 90 度) + PWM 設定積木(75000Hz / 8bit) + 類比輸出積木(GPIO25, 值 128)的專案
-   [ ] T042 [US4] 生成程式碼並檢查:同時包含 `servo.setPeriodHertz(50)` 和 `ledcSetup(channel, 75000, 8)`,兩者使用不同的程式碼區塊
-   [ ] T043 [US4] 實體硬體測試:上傳程式到 ESP32,連接伺服馬達(GPIO18)和馬達驅動晶片(GPIO25),同時執行並驗證兩者互不干擾
-   [ ] T044 [US4] 在 quickstart.md 或相關文件中新增警告說明:伺服馬達和類比輸出不可使用同一腳位(此為文件需求,非程式驗證)

**Checkpoint**: 伺服馬達和高頻 PWM 可在同一專案中和平共存

---

## Phase 7: Polish & Cross-Cutting Concerns (完善與跨功能改進)

**目的**: 針對所有使用者故事的改進與優化

-   [ ] T045 [P] 新增程式碼生成測試案例到 `src/test/suite/code-generation.test.ts`:測試 ESP32 PWM 設定積木的程式碼生成正確性
-   [ ] T046 [P] 執行完整測試套件 `npm test`,確認新增的測試全部通過且未破壞現有測試
-   [ ] T047 檢視生成的 Arduino 程式碼可讀性:確認註解清晰、縮排正確、變數命名符合 Arduino 慣例
-   [ ] T048 [P] 更新 `CHANGELOG.md`:新增 ESP32 PWM 設定功能的版本紀錄(功能描述、影響範圍、向後相容性說明)
-   [ ] T049 檢視 ESLint 與 TypeScript 編譯警告,修正所有程式碼品質問題
-   [ ] T050 執行 quickstart.md 中的所有手動測試檢查清單,確認所有測試案例通過
-   [ ] T051 效能測試:使用包含 10 個類比輸出積木的專案,在 Intel i5 或同等級處理器上測量程式碼生成時間(目標 ≤500ms，符合 spec.md SC-009)
-   [ ] T052 [P] 準備 Pull Request 描述:總結功能、列出變更檔案、附上測試結果截圖(程式碼生成範例、實體硬體運作照片)

---

## Dependencies & Execution Order (依賴關係與執行順序)

### Phase Dependencies (階段依賴關係)

-   **Research (Phase 0)**: 無依賴 - 可立即開始(建議優先執行)
-   **Setup (Phase 1)**: 依賴 Phase 0 完成(確保技術假設已驗證)
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻擋所有使用者故事**
-   **User Stories (Phase 3-6)**: 全部依賴 Foundational 完成
    -   使用者故事可並行進行(若有足夠人力)
    -   或依優先順序循序執行(P1 → P2 → P3)
-   **Polish (Phase 7)**: 依賴所有欲完成的使用者故事

### User Story Dependencies (使用者故事依賴關係)

-   **User Story 1 (P1)**: Foundational 完成後可開始 - **無其他故事依賴**
-   **User Story 2 (P2)**: Foundational 完成後可開始 - 依賴 User Story 1 的積木與生成器(但應獨立測試)
-   **User Story 3 (P3)**: Foundational 完成後可開始 - 依賴 User Story 1 的積木與生成器(但應獨立測試)
-   **User Story 4 (P3)**: Foundational 完成後可開始 - 依賴 User Story 1 的生成器(但應獨立測試)

### Within Each User Story (單一使用者故事內部)

-   積木定義與介面任務可並行(標記 [P])
-   程式碼生成器修改必須在積木定義完成後
-   測試任務在實作完成後執行
-   實體硬體測試在所有程式碼測試通過後執行

### Parallel Opportunities (並行執行機會)

-   **Phase 0**: R001, R002, R003, R004 可並行(不同 MCP 查詢,獨立研究任務)
-   **Phase 1**: T003 和 T004 可並行(不同操作)
-   **Phase 2**: T007, T008, T009 可並行(不同檔案)
-   **User Story 1**: T010 和 T011 可並行(不同檔案)
-   **User Story 2**: T023 和 T024 可並行(同檔案不同測試案例,但可同時撰寫)
-   **Phase 7**: T043, T044, T046 可並行(不同檔案或獨立操作)
-   **跨故事並行**: 若有多位開發者,User Story 2, 3, 4 可在 User Story 1 完成後同時進行

---

## Parallel Example: User Story 1 (使用者故事 1 並行範例)

```bash
# 同時啟動積木定義與工具箱配置(不同檔案):
Task T010: "在 media/blockly/blocks/arduino.js 新增 esp32_pwm_setup 積木定義"
Task T011: "在 media/toolbox/categories/arduino.json 新增積木項目"

# 完成後,依序進行程式碼生成器修改(同一檔案,無法並行):
Task T012 → Task T013 → Task T014

# 最後進行測試(依序執行,確保前置條件滿足):
Task T015 → Task T016 → Task T017 → Task T018
```

---

## Implementation Strategy (實作策略)

### MVP First (僅 User Story 1)

1. 完成 Phase 0: Research (驗證技術假設)
2. 完成 Phase 1: Setup
3. 完成 Phase 2: Foundational (**關鍵** - 阻擋所有故事)
4. 完成 Phase 3: User Story 1
5. **停止並驗證**: 獨立測試 User Story 1,確認可透過積木設定 PWM 並控制馬達
6. 若就緒可部署/展示

### Incremental Delivery (漸進交付)

1. 完成 Research + Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示(MVP!)
3. 新增 User Story 2 → 獨立測試 → 部署/展示(自動驗證機制)
4. 新增 User Story 3 → 獨立測試 → 部署/展示(向後相容)
5. 新增 User Story 4 → 獨立測試 → 部署/展示(伺服馬達共存)
6. 每個故事皆增加價值且不破壞先前故事

### Parallel Team Strategy (並行團隊策略)

若有多位開發者:

1. 團隊共同完成 Research (Phase 0 的 4 個任務可並行)
2. 團隊共同完成 Setup + Foundational
3. Foundational 完成後:
    - 開發者 A: User Story 1(優先完成 MVP)
    - 開發者 B: User Story 2(等待 US1 完成積木定義後開始)
    - 開發者 C: User Story 3(等待 US1 完成生成器修改後開始)
4. 各故事獨立完成並整合

---

## Notes (注意事項)

-   **[P] 任務** = 不同檔案,無依賴關係,可並行執行
-   **[Story] 標籤** = 將任務映射至特定使用者故事,便於追蹤
-   **每個使用者故事應可獨立完成與測試**
-   **測試驅動**: 先撰寫測試,確認測試失敗,再實作功能
-   **提交頻率**: 每完成一個任務或邏輯群組後提交
-   **Checkpoint 驗證**: 在每個 Checkpoint 停下來獨立驗證故事功能
-   **避免事項**: 模糊任務描述、同檔案衝突、破壞故事獨立性的跨故事依賴

---

## Edge Cases Handling (邊界情況處理)

以下邊界情況已在設計階段考慮,實作時需注意:

-   **超出頻率上限(>80000Hz)**: FieldNumber 的 max 參數限制為 80000,使用者無法輸入更高值
-   **超出頻率下限(<1Hz)**: FieldNumber 的 min 參數限制為 1,使用者無法輸入更低值
-   **非 ESP32 開發板選擇**: PWM 設定積木在工具箱中不顯示(透過 updateToolboxForBoard 實作,Phase 7 可選實作)
-   **類比輸出值超出解析度範圍**: 使用 `constrain(value, 0, maxDuty)` 限制,已在 arduino_analog_write 生成器中實作
-   **多次設定 PWM 積木**: rebuildPwmConfig 取最後一個積木的設定值(後蓋前原則)
-   **切換開發板後的行為**: 全域變數保持不變,但 arduino_analog_write 生成器檢查 currentBoard,僅在 ESP32 時使用 PWM 配置

---

## Task Count Summary (任務統計摘要)

-   **Research (Phase 0)**: 4 tasks
-   **Setup (Phase 1)**: 5 tasks
-   **Foundational (Phase 2)**: 6 tasks (新增 API 契約文件任務，翻譯任務擴充至包含 tooltip)
-   **User Story 1 (Phase 3)**: 11 tasks
-   **User Story 2 (Phase 4)**: 9 tasks
-   **User Story 3 (Phase 5)**: 8 tasks (新增工作區載入整合測試任務)
-   **User Story 4 (Phase 6)**: 6 tasks
-   **Polish (Phase 7)**: 8 tasks

**Total Tasks**: 57 tasks (原 54 + 新增 3)

**Parallel Opportunities**:

-   Phase 0: 4 parallel tasks (全部可並行)
-   Phase 1: 2 parallel tasks
-   Phase 2: 3 parallel tasks
-   User Story 1: 2 parallel tasks
-   User Story 2: 2 parallel tasks
-   Phase 7: 3 parallel tasks

**Estimated MVP Scope (User Story 1 Only)**:

-   Research (4) + Setup (5) + Foundational (6) + User Story 1 (11) = **26 tasks** for MVP

**Full Feature Scope**:

-   All 57 tasks for complete feature implementation

---

**Tasks Version**: 1.2  
**Generated**: 2025-01-21  
**Updated**: 2025-01-21 (修復分析報告中的 10 個 MEDIUM/HIGH 問題：新增 API 契約文件任務、擴充翻譯任務至 tooltip、補充事件監聽器規格、明確職責分離、統一術語、新增整合測試)  
**Next Step**: 開始執行 Phase 0: Research,驗證技術假設後進入 Phase 1: Setup
