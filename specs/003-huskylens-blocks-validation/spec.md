# Feature Specification: HuskyLens 積木程式碼驗證與修正

**Feature Branch**: `003-huskylens-blocks-validation`  
**Created**: 2025 年 10 月 17 日  
**Status**: Draft  
**Input**: 使用者描述: "規劃,哈士奇相關積木程式檢查並修正"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - HuskyLens 積木定義驗證 (Priority: P1)

作為 Singular Blockly 開發者,我需要驗證所有 HuskyLens 積木的定義是否完整且正確,以確保使用者能夠在 Blockly 編輯器中正常使用這些積木。

**Why this priority**: HuskyLens 積木已標記為實驗性功能,需要確保核心功能的正確性,這是所有其他改進的基礎。如果積木定義本身有問題,後續的程式碼生成和測試都無法進行。

**Independent Test**: 可以透過載入 Blockly 編輯器,檢查工具箱中是否正確顯示所有 HuskyLens 積木(11 個積木類型),並驗證每個積木的欄位、下拉選單、輸入連接埠是否正確運作。

**Acceptance Scenarios**:

1. **Given** Blockly 編輯器已載入, **When** 開啟「視覺感測器」類別, **Then** 應顯示所有 11 個 HuskyLens 積木(初始化 I2C、初始化 UART、設定演算法、請求資料、檢查學習狀態、計數方塊、取得方塊資訊、計數箭頭、取得箭頭資訊、學習物體、忘記學習)
2. **Given** HuskyLens UART 初始化積木已拖曳到工作區, **When** 檢查 RX/TX 腳位下拉選單, **Then** 應根據當前選擇的開發板顯示正確的腳位選項
3. **Given** HuskyLens 設定演算法積木已拖曳到工作區, **When** 點擊演算法下拉選單, **Then** 應顯示 7 種演算法選項(人臉辨識、物體追蹤、物體辨識、線路追蹤、顏色辨識、標籤辨識、物體分類),且文字正確國際化
4. **Given** HuskyLens 取得方塊資訊積木已拖曳到工作區, **When** 檢查資訊類型下拉選單, **Then** 應顯示 5 個選項(X 中心、Y 中心、寬度、高度、ID)
5. **Given** HuskyLens 取得箭頭資訊積木已拖曳到工作區, **When** 檢查資訊類型下拉選單, **Then** 應顯示 5 個選項(X 起點、Y 起點、X 終點、Y 終點、ID)
6. **Given** HuskyLens 學習物體積木已拖曳到工作區, **When** 檢查 ID 輸入埠, **Then** 應有數字影子積木(預設值為 1)且可接受數字類型輸入

---

### User Story 2 - Arduino 程式碼生成驗證 (Priority: P1)

作為 Singular Blockly 開發者,我需要驗證 HuskyLens 積木生成的 Arduino 程式碼是否正確、完整且可編譯,以確保使用者能夠成功上傳程式到硬體。

**Why this priority**: 程式碼生成是視覺化程式設計的核心價值,如果生成的程式碼不正確或無法編譯,整個功能就失去意義。這直接影響使用者體驗。

**Independent Test**: 可以建立包含各種 HuskyLens 積木組合的測試工作區,生成 Arduino 程式碼,並透過 PlatformIO 編譯驗證程式碼的正確性。

**Acceptance Scenarios**:

1. **Given** 工作區包含 HuskyLens I2C 初始化積木, **When** 生成 Arduino 程式碼, **Then** 應包含 `#include <HUSKYLENS.h>`、`#include "Wire.h"`、pragma 編譯指令、全域變數 `HUSKYLENS huskylens`、setup 中的初始化程式碼、以及 platformio.ini 中的函式庫依賴
2. **Given** 工作區包含 HuskyLens UART 初始化積木(RX=10, TX=11), **When** 生成 Arduino 程式碼, **Then** 應包含 `#include <SoftwareSerial.h>`、`SoftwareSerial huskySerial(10, 11)`、以及 UART 初始化程式碼
3. **Given** 工作區包含 HuskyLens 設定演算法積木(選擇「人臉辨識」), **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.writeAlgorithm(ALGORITHM_FACE_RECOGNITION);`
4. **Given** 工作區包含 HuskyLens 請求資料積木, **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.request();`
5. **Given** 工作區包含 HuskyLens 是否學習過積木(用於條件判斷), **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.isLearned()` 且作為表達式
6. **Given** 工作區包含 HuskyLens 方塊數量積木(用於變數賦值), **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.countBlocks()` 且作為表達式
7. **Given** 工作區包含 HuskyLens 取得方塊資訊積木(索引=0, 類型=X 中心), **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.getBlock(0).xCenter`
8. **Given** 工作區包含 HuskyLens 箭頭數量積木, **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.countArrows()`
9. **Given** 工作區包含 HuskyLens 取得箭頭資訊積木(索引=1, 類型=X 終點), **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.getArrow(1).xTarget`
10. **Given** 工作區包含 HuskyLens 學習物體積木(ID 輸入為數字 5), **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.writeLearn(5);`
11. **Given** 工作區包含 HuskyLens 忘記所有積木, **When** 生成 Arduino 程式碼, **Then** 應生成 `huskylens.writeForget();`
12. **Given** 工作區同時包含 I2C 和 UART 初始化積木, **When** 生成 Arduino 程式碼, **Then** 不應重複宣告 `HUSKYLENS huskylens` 全域變數
13. **Given** 工作區包含多個需要 HuskyLens 函式庫的積木, **When** 生成 Arduino 程式碼, **Then** platformio.ini 中的 lib_deps 應只包含一次 HuskyLens 函式庫 URL

---

### User Story 3 - 國際化訊息完整性驗證 (Priority: P2)

作為 Singular Blockly 開發者,我需要驗證所有 HuskyLens 積木的多語言訊息是否完整且一致,以確保不同語言使用者都能正確理解積木功能。

**Why this priority**: 專案支援 12 種語言,訊息不完整會導致部分使用者看到未翻譯的英文或錯誤訊息,影響國際化品質。這是品質保證但不影響核心功能。

**Independent Test**: 可以透過檢查所有語言的 messages.js 檔案,驗證每個 HuskyLens 相關訊息鍵是否存在且非空,並在編輯器中切換語言進行視覺驗證。

**Acceptance Scenarios**:

1. **Given** 檢查所有語言的 messages.js 檔案, **When** 搜尋 HuskyLens 訊息鍵, **Then** 每種語言應包含所有 44 個 HuskyLens 訊息鍵(積木名稱、欄位標籤、下拉選項、工具提示)
2. **Given** 編輯器語言設定為繁體中文, **When** 檢查 HuskyLens 積木, **Then** 所有文字應顯示繁體中文
3. **Given** 編輯器語言設定為英文, **When** 檢查 HuskyLens 積木, **Then** 所有文字應顯示英文
4. **Given** 編輯器語言設定為任一支援語言, **When** 檢查演算法下拉選單, **Then** 7 個演算法名稱應正確翻譯且無遺漏
5. **Given** 某個語言的訊息檔案缺少某個 HuskyLens 訊息鍵, **When** 在該語言下使用對應積木, **Then** 應顯示備用文字(通常是繁體中文預設值)而非 undefined 或錯誤

---

### User Story 4 - 錯誤處理與邊界條件驗證 (Priority: P2)

作為 Singular Blockly 開發者,我需要驗證 HuskyLens 積木在異常情況下的錯誤處理是否適當,以確保系統穩定性和除錯友善性。

**Why this priority**: 雖然正常流程更重要,但良好的錯誤處理能提升開發者除錯體驗,減少使用者困惑。這對系統穩定性有幫助但非緊急。

**Independent Test**: 可以透過模擬各種異常狀況(如 arduinoGenerator 未初始化、欄位值為空、輸入埠未連接等),驗證程式碼生成器是否正確處理並記錄錯誤。

**Acceptance Scenarios**:

1. **Given** arduinoGenerator 尚未完全初始化, **When** 嘗試生成 HuskyLens 初始化積木的程式碼, **Then** 應返回錯誤註解 `// Error: Arduino generator not available` 並記錄錯誤到日誌
2. **Given** HuskyLens 學習物體積木的 ID 輸入埠未連接任何積木, **When** 生成 Arduino 程式碼, **Then** 應使用預設值 1 (`huskylens.writeLearn(1);`)
3. **Given** HuskyLens 取得方塊資訊積木的索引欄位為負數, **When** 生成 Arduino 程式碼, **Then** 仍應生成程式碼但可能導致執行時錯誤(這是使用者責任)
4. **Given** 程式碼生成過程中發生 JavaScript 例外, **When** 任一 HuskyLens 積木生成器執行, **Then** 應捕捉錯誤、記錄到日誌、並返回包含錯誤訊息的註解
5. **Given** 工作區包含 HuskyLens 積木但未包含初始化積木, **When** 生成 Arduino 程式碼, **Then** 不應自動添加初始化程式碼(使用者應負責正確流程)

---

### User Story 5 - 積木註冊機制驗證 (Priority: P3)

作為 Singular Blockly 開發者,我需要驗證 HuskyLens 積木的「總是生成」註冊機制是否正常運作,以確保初始化程式碼即使未直接連接到流程也能被生成。

**Why this priority**: 這是特殊的技術機制,確保初始化積木即使浮動在工作區也能生成程式碼。雖然重要但影響範圍較小,屬於進階功能優化。

**Independent Test**: 可以建立包含浮動 HuskyLens 初始化積木的工作區(未連接到任何流程),生成程式碼並驗證初始化程式碼是否仍被包含在 setup 函數中。

**Acceptance Scenarios**:

1. **Given** 工作區包含浮動的 HuskyLens I2C 初始化積木(未連接到任何流程), **When** 生成 Arduino 程式碼, **Then** setup 函數中應包含 HuskyLens 初始化程式碼
2. **Given** arduinoGenerator 載入時, **When** 檢查已註冊的「總是生成」積木清單, **Then** 應包含所有 11 個 HuskyLens 積木類型
3. **Given** 註冊機制在 arduinoGenerator 初始化前執行, **When** 頁面載入, **Then** 應透過重試機制(最多 10 次,每次間隔 100ms)確保最終註冊成功
4. **Given** registerAlwaysGenerateBlock 函數不存在, **When** 嘗試註冊 HuskyLens 積木, **Then** 註冊應失敗但不應導致頁面崩潰

---

### Edge Cases

-   **如果使用者同時放置 I2C 和 UART 初始化積木會發生什麼?** 兩者都會生成初始化程式碼,但會導致 `HUSKYLENS huskylens` 變數重複宣告錯誤。應檢測並防止重複宣告。
-   **如果使用者未放置初始化積木就直接使用其他 HuskyLens 功能積木會發生什麼?** 程式碼會編譯成功但執行時會失敗,因為 `huskylens` 物件未初始化。這是使用者責任,但可考慮在生成時發出警告。
-   **如果 HuskyLens 函式庫 URL 失效或無法下載會發生什麼?** PlatformIO 編譯會失敗。應考慮使用更穩定的函式庫來源(如 PlatformIO 官方 registry)。
-   **如果使用者在不支援 SoftwareSerial 的開發板(如 ESP32)上使用 UART 初始化會發生什麼?** 程式碼會編譯失敗。應根據開發板類型動態調整可用的初始化選項。
-   **如果工作區中有多個 HuskyLens 初始化積木(相同類型)會發生什麼?** 初始化程式碼可能被重複添加到 setup 函數。目前有重複檢查機制(`setupCode_.includes(initCode)`),但應驗證其有效性。
-   **如果生成的程式碼中 pragma 指令位置不正確會發生什麼?** 可能無法正確抑制第三方函式庫的編譯警告。應確保 pragma 指令在正確的位置(包含檔案之前/之後)。

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統必須為每個 HuskyLens 積木定義正確的欄位類型(下拉選單、數字輸入、輸入埠)
-   **FR-002**: 系統必須為每個需要開發板相關資訊的欄位(如 UART 腳位)提供動態選項
-   **FR-003**: 系統必須為每個 HuskyLens 積木生成符合 HUSKYLENS Arduino 函式庫 API 的 C++ 程式碼
-   **FR-004**: 系統必須在生成程式碼時自動添加必要的 #include 指令(`<HUSKYLENS.h>`, `"Wire.h"`, `<SoftwareSerial.h>`)
-   **FR-005**: 系統必須在生成程式碼時自動添加必要的 pragma 編譯指令以抑制第三方函式庫警告
-   **FR-006**: 系統必須宣告 HuskyLens 相關全域變數(`HUSKYLENS huskylens` 或 `SoftwareSerial huskySerial`)
-   **FR-007**: 系統必須在 setup 函數中生成正確的初始化程式碼(包含錯誤檢測與重試邏輯)
-   **FR-008**: 系統必須在 platformio.ini 的 lib_deps 中添加 HuskyLens 函式庫依賴
-   **FR-009**: 系統必須避免重複添加相同的 #include 指令、全域變數宣告、或函式庫依賴
-   **FR-010**: 系統必須為每個 HuskyLens 積木提供多語言訊息(至少支援繁體中文和英文)
-   **FR-011**: 系統必須將所有 HuskyLens 積木註冊為「總是生成」類型,確保初始化程式碼即使未連接也能生成
-   **FR-012**: 系統必須在程式碼生成失敗時捕捉錯誤並記錄到日誌系統
-   **FR-013**: 系統必須在程式碼生成失敗時返回包含錯誤訊息的註解,而非導致整體生成失敗
-   **FR-014**: 系統必須正確處理積木欄位的預設值(如學習 ID 預設為 1)
-   **FR-015**: 系統必須為返回數值的積木(如 countBlocks、isLearned)設定正確的運算子優先順序(ORDER_ATOMIC)

### Key Entities

-   **HuskyLens 積木**: 視覺化程式設計元件,包含 11 種不同功能的積木(初始化、設定、查詢、學習)
-   **Arduino 程式碼**: 由積木生成的 C++ 程式碼,包含 #include、全域變數、setup、loop 函數內容
-   **程式碼生成器配置**: arduinoGenerator 物件中的 includes*、variables*、setupCode*、lib_deps* 陣列/物件
-   **國際化訊息**: 多語言訊息鍵值對,定義在 media/locales/\*/messages.js 檔案中
-   **工具箱定義**: vision-sensors.json 中定義的積木清單與預設配置
-   **積木註冊清單**: 註冊為「總是生成」的積木類型清單

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 所有 11 個 HuskyLens 積木都能在 Blockly 編輯器中正確顯示且無 JavaScript 錯誤
-   **SC-002**: 所有 HuskyLens 積木生成的 Arduino 程式碼都能通過 PlatformIO 編譯(針對 Arduino Uno、Nano、Mega)
-   **SC-003**: 所有支援的語言(12 種)都包含完整的 HuskyLens 訊息定義(44 個訊息鍵),無遺漏
-   **SC-004**: 包含任意 HuskyLens 積木組合的工作區都能在 2 秒內完成 Arduino 程式碼生成
-   **SC-005**: 程式碼生成過程中若發生錯誤,100% 的錯誤都應被捕捉並記錄到日誌(不導致應用程式崩潰)
-   **SC-006**: 測試工作區(包含所有 11 種 HuskyLens 積木)生成的程式碼應在 20KB 以內(不含函式庫)
-   **SC-007**: HuskyLens 初始化積木(浮動或連接)都能確保 setup 函數包含初始化程式碼
-   **SC-008**: 重複使用相同類型的初始化積木不應導致重複的初始化程式碼(驗證去重機制)

## MCP Tools Research Requirements

在實作驗證與修正前,必須使用 MCP 工具查證以下資訊以確保正確性:

### 必要查證項目

1. **HuskyLens Arduino 函式庫 API 驗證**
    - 使用 `resolve-library-id` + `get-library-docs` 查詢 HuskyLens Arduino 函式庫
    - 搜尋關鍵字: "HUSKYLENSArduino", "HUSKYLENS library"
    - 驗證項目:
        - `HUSKYLENS` 類別的建構函數與初始化方法(`begin()`)
        - I2C 與 UART 通訊模式的正確初始化語法
        - 演算法常數名稱(如 `ALGORITHM_FACE_RECOGNITION`)是否與程式碼一致
        - `request()`, `isLearned()`, `countBlocks()`, `countArrows()` 等方法的正確語法
        - `getBlock()`, `getArrow()` 回傳物件的屬性名稱(如 `xCenter`, `yCenter`, `xOrigin`, `xTarget`)
        - `writeLearn()`, `writeForget()`, `writeAlgorithm()` 方法的參數類型
2. **Blockly 積木最佳實踐**

    - 使用 `get-library-docs` 查詢 Blockly 文件
    - 搜尋主題: "block definition", "field types", "dropdown fields", "input types"
    - 驗證項目:
        - `FieldDropdown` 動態選項的正確實作方式(函數 vs 陣列)
        - `FieldNumber` 的最小值限制設定
        - `setCheck()` 類型檢查的正確用法
        - 影子積木(shadow blocks)在工具箱中的設定語法
        - 實驗性積木標記機制(`window.potentialExperimentalBlocks`)是否為最佳實踐

3. **PlatformIO 函式庫管理**

    - 使用 `webSearch` 搜尋: "PlatformIO lib_deps GitHub archive best practices"
    - 驗證項目:
        - 使用 GitHub archive URL 作為函式庫來源是否為最佳實踐
        - 是否存在官方 PlatformIO Registry 版本的 HuskyLens 函式庫
        - 函式庫版本鎖定機制(避免未來 API 變更導致程式碼失效)
        - `lib_deps` 陣列去重的最佳實踐

4. **SoftwareSerial 與開發板相容性**

    - 使用 `webSearch` 搜尋: "ESP32 SoftwareSerial alternative HardwareSerial"
    - 驗證項目:
        - ESP32 是否支援 SoftwareSerial 函式庫
        - ESP32 替代方案(如 HardwareSerial)的正確用法
        - 其他開發板(Arduino Mega)的多 UART 埠支援

5. **編譯器 Pragma 指令用法**
    - 使用 `webSearch` 搜尋: "GCC pragma diagnostic push pop Arduino"
    - 驗證項目:
        - Pragma 指令的正確位置(是否應在 include 之前或之後)
        - `-Wreturn-type` 和 `-Wunused-variable` 警告的來源分析
        - 是否有更好的方式處理第三方函式庫警告

### 查證時機

-   **規劃階段前**: 執行完整查證,確保規劃基於正確的技術資訊
-   **實作階段前**: 再次驗證 API 是否有更新,特別是函式庫版本
-   **發現問題時**: 即時使用 MCP 工具查證正確語法與最佳實踐

### 預期結果

查證後應能回答:

-   現有程式碼是否使用正確的 HuskyLens API
-   是否有更穩定的函式庫來源
-   開發板相容性問題的最佳解決方案
-   程式碼生成是否符合 Blockly 最佳實踐

## Constitution Alignment

本功能規格符合 Singular Blockly 專案原則:

-   **Simplicity**: 驗證專注於現有功能的正確性,不添加不必要的複雜性
-   **Modularity**: 檢查項目按功能模組劃分(積木定義、程式碼生成、國際化、錯誤處理),支援獨立驗證和修正
-   **Avoid Over-Development**: 規格僅涵蓋已實作的 HuskyLens 積木,不擴展新功能
-   **Flexibility**: 驗證考慮多開發板支援(Arduino Uno/Nano/Mega/ESP32),以及未來可能的函式庫版本更新
-   **Research-Driven**: 實作前必須使用 MCP 工具查證 HuskyLens 函式庫 API、Blockly 最佳實踐、PlatformIO 函式庫管理、以及開發板相容性(詳見 MCP Tools Research Requirements 章節)
-   **Structured Logging**: 所有錯誤處理都使用結構化日誌記錄(`log.error`),不使用 `console.log`
-   **Comprehensive Test Coverage**: 驗證方法設計為可測試,包含單元測試(程式碼生成函數)和整合測試(完整工作區生成與編譯)
-   **Pure Functions and Modular Architecture**: 程式碼生成函數設計為純函數(輸入積木配置,輸出程式碼字串),便於測試和維護
