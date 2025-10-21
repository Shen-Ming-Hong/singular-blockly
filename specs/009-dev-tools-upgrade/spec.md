# Feature Specification: 開發工具依賴升級

**Feature Branch**: `009-dev-tools-upgrade`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: 升級開發工具: @typescript-eslint/eslint-plugin 8.46.1 → 8.46.2, ESLint ecmaVersion 2022 → 2023, webpack-cli 5.1.4 → 6.0.1 (需研究相容性)

## 術語對照表

| 中文術語                      | 英文術語                         | 說明                                           |
| ----------------------------- | -------------------------------- | ---------------------------------------------- |
| PATCH 版本升級 / 修補版本升級 | PATCH version upgrade            | 語意化版本的第三位數字變更,向後相容的 bug 修復 |
| MAJOR 版本升級 / 主版本升級   | MAJOR version upgrade            | 語意化版本的第一位數字變更,可能包含破壞性變更  |
| ECMAScript 版本 (ecmaVersion) | ECMAScript version (ecmaVersion) | ESLint 配置中指定的 JavaScript 語法版本支援    |
| Bundle 大小 / 打包大小        | Bundle size                      | webpack 編譯後的最終輸出檔案大小               |
| 編譯時間 / 建置時間           | Compile time / Build time        | 執行 `npm run compile` 所需的時間              |
| 測試通過率                    | Test pass rate                   | 通過測試的數量與總測試數量的比率               |

## User Scenarios & Testing

### User Story 1 - TypeScript ESLint Plugin 修補升級 (Priority: P1)

開發者在開發過程中使用 ESLint 進行程式碼品質檢查。透過升級 @typescript-eslint/eslint-plugin 從 8.46.1 到 8.46.2,開發者將獲得最新的 bug 修復和穩定性改善,確保 TypeScript 程式碼檢查工具運作正常。

**Why this priority**: 這是 PATCH 版本升級,風險極低且包含重要的 bug 修復。不依賴其他升級項目,可以獨立完成。

**Independent Test**: 執行 `npm run lint` 指令並驗證所有現有檔案的 lint 檢查通過,無新增錯誤或警告。

**Acceptance Scenarios**:

1. **Given** 專案已安裝 @typescript-eslint/eslint-plugin 8.46.1, **When** 升級到 8.46.2 並執行 `npm run lint`, **Then** 所有現有通過的檔案仍然通過檢查
2. **Given** 升級完成後, **When** 執行完整測試套件 `npm test`, **Then** 所有 190 個測試保持通過狀態
3. **Given** 升級完成後, **When** 執行 `npm run compile`, **Then** 編譯成功且無新增警告

---

### User Story 2 - ESLint ECMAScript 版本對齊 (Priority: P1)

開發者需要確保 ESLint 配置與 TypeScript 編譯目標版本一致。當前 tsconfig.json 設定為 ES2023,但 eslint.config.mjs 仍使用 ecmaVersion: 2022。透過更新 ESLint 配置為 2023,開發者將獲得對 ES2023 語法特性(如 Array.findLast, toSorted 等)的正確語法檢查支援。

**Why this priority**: 配置不一致會導致開發者困惑,ESLint 可能誤報 ES2023 語法為錯誤。此項調整風險極低,只需修改配置檔案。

**Independent Test**: 建立測試檔案使用 ES2023 新語法(如 `[1,2,3].toSorted()`),驗證 ESLint 不會標記為錯誤。

**Acceptance Scenarios**:

1. **Given** eslint.config.mjs 已更新為 ecmaVersion: 2023, **When** 在 TypeScript 檔案中使用 ES2023 語法, **Then** ESLint 不會報告語法錯誤
2. **Given** 配置更新完成, **When** 執行 `npm run lint`, **Then** 現有所有檔案的 lint 檢查結果保持一致
3. **Given** 配置更新完成, **When** 開發者在 VS Code 中編輯 .ts 檔案, **Then** IntelliSense 正確識別 ES2023 語法而不顯示錯誤下劃線

---

### User Story 3 - webpack-cli 主版本升級評估 (Priority: P2)

開發者需要評估將 webpack-cli 從 5.1.4 升級到 6.0.1 的可行性。由於這是主版本升級,需要進行完整的破壞性變更研究,確認與現有 webpack 5.102.1 的相容性,並驗證所有建置指令(compile, watch, package)在升級後仍正常運作。

**Why this priority**: 這是主版本升級,涉及潛在破壞性變更,需要謹慎研究。可在完成 P1 項目後獨立進行研究和測試。

**Independent Test**: 在測試分支上升級 webpack-cli,執行所有 npm scripts(compile, watch, package),驗證產出的 bundle 大小和功能與升級前一致。

**Acceptance Scenarios**:

1. **Given** 已完成 webpack-cli 6.x 破壞性變更研究, **When** 識別出所有與專案相關的變更, **Then** 產出詳細的變更清單和影響分析報告
2. **Given** webpack-cli 已升級到 6.0.1, **When** 執行 `npm run compile`, **Then** 編譯成功且 dist/extension.js 大小在基準值 ±5% 範圍內
3. **Given** webpack-cli 升級完成, **When** 執行 `npm run watch` 並修改原始碼, **Then** 檔案變更自動觸發重新編譯且無錯誤
4. **Given** webpack-cli 升級完成, **When** 執行 `npm run package` (production build), **Then** 產生的 bundle 包含正確的 source map 且大小符合預期
5. **Given** webpack-cli 升級後建置完成, **When** 在 VS Code Extension Development Host 中載入擴充功能, **Then** Blockly 編輯器正常開啟且所有功能運作正常

---

### Edge Cases

-   **相依性衝突**: 如果 @typescript-eslint/eslint-plugin 8.46.2 與其他開發依賴(如 eslint 9.38.0)產生 peer dependency 警告,需要驗證警告不影響實際功能
    -   **驗證方法**: 執行完整測試套件 (`npm test`) 和 ESLint 檢查 (`npm run lint`),確認無功能性錯誤
-   **webpack-cli 6.x 與 webpack 5.x 不相容**: 如果發現 webpack-cli 6.0.1 無法與 webpack 5.102.1 正常運作,需要決定是否同時升級 webpack 或保持 webpack-cli 5.x
    -   **驗證方法**: 執行所有 npm scripts (compile, watch, package) 並檢查建置產物大小和功能
-   **建置腳本破壞**: 如果 webpack-cli 6.x 改變 CLI 參數格式,package.json 中的 scripts 可能需要更新
    -   **驗證方法**: 手動檢查 package.json scripts 是否使用 webpack-cli 6.x 移除的參數 (詳見 research.md)
-   **TypeScript 編譯錯誤**: 如果升級後出現新的 TypeScript 型別檢查錯誤,需要驗證是合理的錯誤檢測還是誤判
    -   **驗證方法**: 檢查錯誤訊息是否指出真實的型別問題,查閱 @typescript-eslint 變更日誌確認是否為預期行為
-   **效能回歸**: 如果 webpack-cli 6.x 導致編譯時間顯著增加(超過 10%),需要評估是否值得升級
    -   **驗證方法**: 測量編譯時間 3 次並計算平均值,與基準值 4000ms 比較,允許範圍 3600-4400ms

### Edge Case 處理檢查清單

在 webpack-cli 升級 (User Story 3) 執行時,必須完成以下檢查:

-   [ ] 檢查 peer dependency 警告,執行 `npm install` 並記錄警告訊息
-   [ ] 執行 `npm test` 驗證功能無破壞
-   [ ] 執行所有 npm scripts (compile, watch, package) 驗證建置流程
-   [ ] 測量編譯時間 3 次,驗證在 3600-4400ms 範圍內
-   [ ] 測量 bundle 大小,驗證在 123.5-136.5KB 範圍內
-   [ ] 檢查 package.json scripts 是否使用已移除的 CLI 參數
-   [ ] 如出現新的 TypeScript 錯誤,查閱變更日誌驗證是否預期行為
-   [ ] 如效能超出範圍,記錄差異並評估是否可接受 (記錄於 research.md)

## 效能基準測量方法

### 基準值來源

所有效能基準值均基於升級前的實際測量結果,測量環境如下:

-   **測量時間**: 升級前 (2025-10-21)
-   **測量環境**: Windows 11, Node.js 22.16.0, npm 10.x
-   **測量方法**: 每項指標測量 3 次,取平均值作為基準

### 編譯時間基準

-   **測量命令**: `npm run compile`
-   **基準值**: 4000ms (4 秒)
-   **容忍範圍**: ±10% (3600-4400ms)
-   **測量次數**: 3 次,計算平均值
-   **記錄位置**: `performance-baseline.txt` (升級前) 和任務執行記錄 (升級後)

### Bundle 大小基準

-   **測量目標**: `dist/extension.js`
-   **基準值**: 130KB (130,506 bytes)
-   **容忍範圍**: ±5% (123.5KB - 136.5KB, 即 124,281 - 136,731 bytes)
-   **測量方法**: 執行 `Get-Item dist/extension.js | Select-Object Length` (PowerShell)
-   **記錄位置**: `performance-baseline.txt`

### 測試通過率基準

-   **測量命令**: `npm test`
-   **基準值**: 189/190 tests passing
-   **允許失敗測試**: 1 個測試允許失敗 (src/test/services/settingsManager.test.ts 中的 "should handle missing platformio.ini gracefully")
    -   **失敗原因**: 此測試驗證 PlatformIO 配置檔案不存在時的錯誤處理,在某些環境下可能因檔案系統權限或時序問題而不穩定
    -   **影響評估**: 此測試失敗不影響核心功能,僅為邊界條件測試
-   **要求**: 升級後必須保持 189/190 或 190/190,不得有更多測試失敗
-   **記錄位置**: 測試輸出日誌

### 測試執行時間基準

-   **測量命令**: `npm test`
-   **要求**: <3000ms (3 秒)
-   **測量方法**: 從測試輸出的 "Time:" 行讀取
-   **記錄位置**: 測試輸出日誌

### 如何使用基準值

1. **升級前**: 執行 Phase 1 任務 T012-T015,記錄所有基準值到 `performance-baseline.txt`
2. **升級中**: 在每個 User Story 完成後,重新測量所有指標
3. **升級後**: 在 Phase 5 任務 T068 進行最終驗證,確保所有指標在容忍範圍內
4. **失敗處理**: 如任何指標超出範圍:
    - 記錄實際值和差異百分比
    - 評估是否為可接受的變更 (例如: 新功能導致的合理增長)
    - 如不可接受,執行回滾程序 (見 tasks.md 回滾策略)

## Requirements

### Functional Requirements

-   **FR-001**: 系統必須將 @typescript-eslint/eslint-plugin 從 8.46.1 升級至 8.46.2
-   **FR-002**: 系統必須更新 eslint.config.mjs 中的 ecmaVersion 設定從 2022 至 2023
-   **FR-003**: 系統必須完成 webpack-cli 6.x 破壞性變更的完整技術研究
-   **FR-004**: 系統必須驗證 webpack-cli 6.0.1 與 webpack 5.102.1 的相容性
-   **FR-005**: 系統必須確保所有現有的 npm scripts(compile, watch, package, lint, test)在升級後正常運作
-   **FR-006**: 系統必須保持現有測試套件的通過率 (190 個測試中至少 189 個通過,即 189/190 passing),詳見「效能基準測量方法」章節中的測試通過率基準說明
-   **FR-007**: 系統必須確保編譯產出的 bundle 大小在基準值 130KB (130,506 bytes) ±5% 範圍內 (123.5KB - 136.5KB)
-   **FR-008**: 系統必須驗證 ESLint 能正確識別和檢查 ES2023 語法特性
    -   **驗證方法**: 建立測試檔案 `src/test/es2023-syntax-test.ts`,使用 ES2023 新方法 (toSorted, findLast, toReversed, with, findLastIndex),執行 `npx eslint src/test/es2023-syntax-test.ts` 確認無語法錯誤
-   **FR-009**: 系統必須記錄 webpack-cli 升級的決策過程,包括風險評估和測試結果
    -   **記錄位置**: research.md 中的 webpack-cli 6.x 評估章節
    -   **記錄內容**: 破壞性變更分析、相容性測試結果、效能影響評估、最終升級決策和理由
-   **FR-010**: 系統必須在升級過程中遵循專案既定的升級流程(Phase 0 研究 → Phase 1 設計 → Phase 2 實作)

### Key Entities

-   **ESLint 配置**: eslint.config.mjs 檔案,定義程式碼檢查規則和 ECMAScript 版本支援
-   **package.json**: 專案依賴清單,記錄所有開發和執行時依賴的版本
-   **webpack 配置**: webpack.config.js 檔案,定義模組打包和建置流程
-   **測試套件**: src/test/ 目錄下的所有測試檔案,用於驗證升級後功能完整性
-   **建置產物**: dist/extension.js 和相關檔案,webpack 編譯的最終輸出

## 風險等級評定標準

本專案使用三級風險評定系統,用於評估依賴升級的風險等級:

### 低風險 (LOW)

**定義**: 升級過程透明,無需程式碼修改,向後相容性完整

**判定標準**:

-   PATCH 或 MINOR 版本升級
-   官方變更日誌明確標註為 bug 修復或向後相容的新功能
-   無破壞性變更 (breaking changes)
-   不影響現有 API 或配置格式
-   測試套件 100% 通過
-   效能指標在基準範圍內 (編譯時間 ±10%, bundle 大小 ±5%)

**範例**: @typescript-eslint/eslint-plugin 8.46.1 → 8.46.2 (PATCH 升級)

### 中風險 (MEDIUM)

**定義**: 升級可能需要程式碼或配置調整,但影響範圍可控

**判定標準**:

-   MAJOR 版本升級,但破壞性變更不影響專案使用的功能
-   需要更新配置檔案或建置腳本
-   可能產生新的警告訊息,但不影響功能
-   測試套件可能需要微調 (不超過 5 個測試)
-   效能指標可能接近容忍範圍邊界
-   有明確的遷移指南和社群支援

**範例**: webpack-cli 5.1.4 → 6.0.1 (MAJOR 升級,但 webpack 5.x 相容性已確認)

### 高風險 (HIGH)

**定義**: 升級涉及大量程式碼修改或可能破壞核心功能

**判定標準**:

-   MAJOR 版本升級且破壞性變更影響專案核心功能
-   需要重構大量程式碼 (超過 10 個檔案)
-   測試套件通過率低於 95% (超過 10 個測試失敗)
-   效能指標顯著惡化 (編譯時間 >20% 增長,bundle 大小 >10% 增長)
-   缺乏遷移指南或社群回報大量問題
-   影響使用者可見的功能或介面

**處理方式**: 高風險升級需要額外的 Phase 0 研究,建立詳細的遷移計畫,並在隔離分支上進行完整測試

### 風險評定流程

1. **Phase 0 研究**: 查閱官方變更日誌和破壞性變更清單
2. **影響分析**: 識別專案中使用的相關 API 或功能
3. **測試驗證**: 在測試環境中執行升級並運行完整測試套件
4. **效能評估**: 測量編譯時間和 bundle 大小變化
5. **風險定級**: 根據上述標準確定風險等級
6. **記錄決策**: 在 research.md 中記錄風險評定結果和理由

## Success Criteria

### Measurable Outcomes

-   **SC-001**: @typescript-eslint/eslint-plugin 升級到 8.46.2 後,執行 `npm run lint` 的結果與升級前完全一致(無新增錯誤或警告)
-   **SC-002**: ESLint ecmaVersion 更新為 2023 後,開發者可以在 TypeScript 檔案中使用 ES2023 語法(如 Array.findLast, toSorted)而不觸發 ESLint 錯誤
-   **SC-003**: 完成 webpack-cli 升級研究後,產出包含至少以下內容的研究文件 (記錄於 research.md):
    -   webpack-cli 5.x → 6.x 的破壞性變更清單 (含官方文件連結)
    -   與 webpack 5.x 的相容性分析 (含測試結果)
    -   對專案 5 個 npm scripts 的影響評估 (compile, watch, package, lint, test)
    -   升級風險等級評定 (低/中/高),依據「風險等級評定標準」章節的判定標準
    -   升級決策建議 (升級/保持/延後) 和理由
-   **SC-004**: 如果 webpack-cli 升級執行,編譯時間保持在基準值 4000ms ±10% 範圍內 (3600-4400ms)
-   **SC-005**: 如果 webpack-cli 升級執行,測試通過率符合 FR-006 要求 (至少 189/190 tests passing)
-   **SC-006**: 如果 webpack-cli 升級執行,production build 產生的 bundle 大小符合 FR-007 要求 (123.5KB - 136.5KB,基準值 130KB ±5%)
-   **SC-007**: 升級完成後,在 VS Code Extension Development Host 中手動測試 Blockly 編輯器的 10 項核心功能(開啟專案、切換主題、拖放積木、產生程式碼、儲存工作區、切換開發板、多語言切換、預覽程式碼、工具箱展開、垃圾桶刪除)全部正常運作
-   **SC-008**: 所有升級變更記錄在 CHANGELOG.md 中,遵循 Keep a Changelog 格式

## Constitution Alignment

本功能規格符合 Singular Blockly 專案憲章原則:

-   **簡潔性**: 升級範圍明確限定於三個開發工具,避免不必要的連鎖升級
-   **模組化**: 三個升級項目可獨立執行和測試,P1 項目不依賴 P2 項目
-   **避免過度開發**: 只升級有明確改善理由的依賴(bug 修復、配置對齊、版本追蹤),不盲目追求最新版本
-   **靈活性**: 設計允許 webpack-cli 升級獨立於其他項目進行,如遇問題可保持現狀
-   **研究驅動開發**: 遵循專案既定流程,對 webpack-cli 主版本升級進行 Phase 0 研究後再決定是否實施
-   **結構化日誌**: 升級過程使用專案的 logging service 記錄關鍵步驟和決策
-   **完整測試覆蓋**: 每個升級項目都有明確的自動化測試和手動測試驗證步驟
-   **純函式與模組化架構**: 升級不改變現有架構,保持服務層模式和 WebView 通訊機制
-   **繁體中文文件**: 本規格使用繁體中文撰寫,符合專案語言要求
