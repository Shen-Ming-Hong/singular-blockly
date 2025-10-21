# Feature Specification: Phase 1 核心依賴升級

**Feature Branch**: `008-core-deps-upgrade`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "Phase 1: 核心依賴升級"

<!--
  LANGUAGE REQUIREMENT (Principle IX):
  This specification MUST be written in Traditional Chinese (繁體中文, zh-TW).
  All user stories, requirements, success criteria, and user-facing content
  should be in Traditional Chinese to align with the project's primary audience.

  Technical notes and code examples MAY remain in English for developer clarity.
-->

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Blockly 核心庫升級至 12.x (Priority: P1)

作為擴充功能開發者,我需要將 Blockly 從 11.2.2 升級至 12.3.1,以獲得最新功能、效能改進和安全性修復,同時確保現有功能完全相容。

**為何優先**: Blockly 是專案的核心依賴,影響所有視覺化程式設計功能。主版本升級可能包含破壞性變更,需要優先處理以避免技術債累積。

**獨立測試**: 可透過執行完整測試套件(190 個測試)和手動測試所有積木類型來驗證。成功標準為所有測試通過且無視覺或功能退化。

**驗收場景**:

1. **Given** 專案使用 Blockly 11.2.2, **When** 升級至 12.3.1 並執行測試, **Then** 所有 190 個單元測試通過
2. **Given** Blockly 12.3.1 已安裝, **When** 開啟積木編輯器, **Then** 所有積木類別正確顯示且可拖曳
3. **Given** 工作區包含現有積木, **When** 載入工作區, **Then** 所有積木正確還原且連接完整
4. **Given** 使用者切換語言, **When** 語言切換完成, **Then** 所有積木文字正確翻譯
5. **Given** 使用者切換主題, **When** 從淺色切換至深色主題, **Then** 所有積木顏色和樣式正確更新
6. **Given** 工作區包含各種積木, **When** 生成 Arduino 程式碼, **Then** 程式碼正確無誤且可編譯
7. **Given** 使用者測試多板卡支援, **When** 切換不同開發板, **Then** 板卡特定功能正確運作

---

### User Story 2 - Theme-Modern 主題系統升級 (Priority: P1)

作為擴充功能開發者,我需要將 @blockly/theme-modern 從 6.0.12 升級至 7.0.1,以確保與 Blockly 12.x 的主題系統相容,並獲得最新的視覺改進。

**為何優先**: 主題系統直接影響使用者體驗,且必須與 Blockly 12.x 同步升級以避免相容性問題。

**獨立測試**: 可透過切換淺色/深色主題並檢查自訂主題(singularDark.js)是否正常運作來驗證。

**驗收場景**:

1. **Given** theme-modern 7.0.1 已安裝, **When** 開啟編輯器, **Then** 預設主題正確套用
2. **Given** 使用者點擊主題切換按鈕, **When** 切換至深色模式, **Then** 自訂深色主題(singularDark)正確顯示
3. **Given** 深色模式啟用, **When** 檢查所有 UI 元件, **Then** 沒有視覺異常或對比度問題
4. **Given** 主題已切換, **When** 重新載入編輯器, **Then** 主題偏好設定正確保存並還原

---

### User Story 3 - API 相容性驗證與遷移 (Priority: P1)

作為擴充功能開發者,我需要識別並修復 Blockly 12.x 中的 API 破壞性變更,確保所有現有功能繼續正常運作。

**為何優先**: 破壞性變更可能導致擴充功能無法啟動或功能失效,必須在升級過程中立即處理。

**獨立測試**: 可透過 TypeScript 編譯錯誤和執行時錯誤來識別 API 變更,並透過測試套件驗證修復。

**驗收場景**:

1. **Given** Blockly 12.x API 文件已閱讀, **When** 執行 TypeScript 編譯, **Then** 無型別錯誤
2. **Given** 識別出 API 變更, **When** 更新程式碼以使用新 API, **Then** 功能行為與升級前一致
3. **Given** setLocale API 已更新, **When** 執行語言切換, **Then** 語言正確載入且無降級(fallback)警告
4. **Given** 事件系統已更新, **When** 積木變更觸發事件, **Then** 事件處理器正確執行
5. **Given** Generator API 已更新, **When** 生成程式碼, **Then** 程式碼格式和內容正確

---

### User Story 4 - 回歸測試與文件更新 (Priority: P2)

作為專案維護者,我需要執行完整回歸測試並更新所有相關文件,確保升級過程被完整記錄且可追溯。

**為何優先**: 文件更新是確保團隊成員和未來開發者理解變更的關鍵,但可在核心功能驗證完成後進行。

**獨立測試**: 可透過檢查清單和文件審查來驗證完整性。

**驗收場景**:

1. **Given** 所有程式碼變更已完成, **When** 執行完整測試套件, **Then** 測試覆蓋率維持在 87%+ 且所有測試通過
2. **Given** 手動測試計畫已準備, **When** 執行手動測試, **Then** 所有關鍵使用者流程正常運作
3. **Given** 升級已完成, **When** 更新 CHANGELOG.md, **Then** 包含版本號、升級內容和破壞性變更說明
4. **Given** API 使用已變更, **When** 更新技術文件, **Then** 所有程式碼範例和說明正確反映新 API
5. **Given** 文件已更新, **When** 審查 .github/copilot-instructions.md, **Then** AI 編碼指引包含 Blockly 12.x 特定注意事項

---

### Edge Cases

-   **版本相容性問題**: 如果 Blockly 12.3.1 與其他依賴(如 webpack、TypeScript)不相容怎麼辦?
    -   解決方案: 在測試環境中先驗證相容性,必要時調整 webpack 或 TypeScript 配置
-   **效能退化**: 如果 Blockly 12.x 比 11.x 慢怎麼辦?
    -   解決方案: 使用效能基準測試比較,如有退化則回報 Blockly 團隊或尋找替代方案
-   **主題破壞**: 如果自訂主題(singularDark.js)在新版本中無法運作怎麼辦?
    -   解決方案: 參考 theme-modern 7.x 文件重構主題定義,必要時使用新的主題 API
-   **工作區不相容**: 如果舊版工作區檔案無法在新版 Blockly 中載入怎麼辦?
    -   解決方案: 實作工作區遷移邏輯,提供使用者友善的錯誤訊息和恢復選項
-   **語言檔案問題**: 如果 Blockly 12.x 的訊息格式變更導致翻譯失效怎麼辦?
    -   解決方案: 檢查 15 種語言檔案,必要時更新訊息鍵值以符合新格式
-   **程式碼生成器失效**: 如果 Generator API 變更導致 Arduino 程式碼無法生成怎麼辦?
    -   解決方案: 參考 Blockly 12.x generator 文件,更新所有 generator 檔案(arduino/\*.js)

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統必須成功升級 Blockly 從 11.2.2 至 12.3.1
-   **FR-002**: 系統必須成功升級 @blockly/theme-modern 從 6.0.12 至 7.0.1
-   **FR-003**: 系統必須在升級前建立 git tag (v0.38.0) 作為還原點
-   **FR-004**: 系統必須識別並記錄所有 Blockly 12.x 的 API 破壞性變更
-   **FR-005**: 系統必須更新所有受影響的程式碼以使用新 API
-   **FR-006**: 系統必須保持所有現有功能完全運作(190 個測試通過)
-   **FR-007**: 系統必須維持或改善測試覆蓋率(不低於 87.21%)
-   **FR-008**: 系統必須確保所有 15 種語言的翻譯正常運作
-   **FR-009**: 系統必須確保淺色和深色主題正確顯示
-   **FR-010**: 系統必須確保所有 5 種開發板配置正常運作
-   **FR-011**: 系統必須使用 MCP 工具查詢 Blockly 12.x 官方文件和遷移指南
-   **FR-012**: 系統必須記錄升級過程中的所有技術決策和解決方案
-   **FR-013**: 系統必須更新 CHANGELOG.md 包含升級資訊
-   **FR-014**: 系統必須更新 package.json 和 package-lock.json
-   **FR-015**: 系統必須驗證建置產物大小變化在可接受範圍內(±5%)

### Technical Requirements

-   **TR-001**: 必須使用 `resolve-library-id` 和 `get-library-docs` MCP 工具獲取 Blockly 12.3.1 文件
-   **TR-002**: 必須使用 `webSearch` MCP 工具搜尋 Blockly 12.0 遷移指南和已知問題
-   **TR-003**: 必須在獨立測試分支進行升級(upgrade/blockly-12.x)
-   **TR-004**: 必須採用階段性升級策略(11.2.2 → 11.3.x → 12.0.0 → 12.3.1,如適用)
-   **TR-005**: 必須執行完整測試矩陣:
    -   190 個單元測試
    -   15 種語言切換測試
    -   5 種開發板配置測試
    -   淺色/深色主題測試
    -   所有積木類型手動測試
    -   備份還原功能測試
-   **TR-006**: 必須準備回滾計畫和降級腳本
-   **TR-007**: 必須記錄升級前後的效能基準(編譯時間、測試時間、bundle 大小)

### Key Entities

-   **Blockly Package**: 核心視覺化程式設計函式庫

    -   版本: 11.2.2 → 12.3.1
    -   用途: 提供積木編輯器、程式碼生成器、工作區管理
    -   關鍵 API: setLocale, theme system, event system, generator API

-   **Theme-Modern Package**: Blockly 現代化主題

    -   版本: 6.0.12 → 7.0.1
    -   用途: 提供預設主題樣式
    -   相依性: 必須與 Blockly 版本相容

-   **Custom Theme (singularDark.js)**: 專案自訂深色主題

    -   用途: 提供客製化深色模式體驗
    -   相依性: 使用 Blockly theme API

-   **Workspace State**: 使用者積木配置
    -   格式: JSON (blockly/main.json)
    -   相容性需求: 必須支援新舊版本 Blockly

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 所有 190 個單元測試在升級後通過,執行時間維持在 3 秒內
-   **SC-002**: 測試覆蓋率維持在 87.21% 或更高
-   **SC-003**: 編譯時間變化在 ±10% 範圍內(當前基準: 4.6 秒)
-   **SC-004**: 建置產物大小變化在 ±5% 範圍內(當前基準: 130,506 bytes)
-   **SC-005**: 所有 15 種語言在升級後正確顯示且無翻譯遺失
-   **SC-006**: 淺色和深色主題切換流暢,無視覺異常
-   **SC-007**: 所有 5 種開發板(Arduino Uno/Nano/Mega, ESP32, Super Mini)配置正常運作
-   **SC-008**: 使用者可成功載入現有工作區檔案(向後相容)
-   **SC-009**: 程式碼生成功能正常,產生的 Arduino 程式碼可正確編譯
-   **SC-010**: 升級過程記錄完整,包含所有 API 變更和解決方案
-   **SC-011**: CHANGELOG.md 包含詳細的升級資訊和破壞性變更說明
-   **SC-012**: 技術文件(.github/copilot-instructions.md)更新完整,反映新 API 使用方式

### Quality Gates

-   **QG-001**: 無 TypeScript 編譯錯誤
-   **QG-002**: 無執行時錯誤或警告(除預期的 deprecation warnings)
-   **QG-003**: 無新增的 ESLint 錯誤
-   **QG-004**: 所有手動測試檢查清單項目標記為通過
-   **QG-005**: Code review 通過,至少一位審查者核准

## Assumptions

1. **版本策略**: 假設直接升級至 Blockly 12.3.1 是可行的,如遇重大阻礙才考慮階段性升級
2. **向後相容性**: 假設 Blockly 12.x 提供工作區格式的向後相容性或遷移工具
3. **效能影響**: 假設 Blockly 12.x 的效能表現與 11.x 相當或更好
4. **文件完整性**: 假設 Blockly 團隊提供完整的遷移指南和 API 文件
5. **依賴相容性**: 假設當前的 webpack (5.102.1) 和 TypeScript (5.9.3) 與 Blockly 12.x 相容
6. **測試充分性**: 假設現有的 190 個測試足以捕捉大部分回歸問題
7. **時程估算**: 假設完整升級(含測試和文件)需要 2-3 週時間
8. **回滾可行性**: 假設如遇重大問題可在 1 天內回滾至 Blockly 11.2.2

## Dependencies

-   **內部依賴**:

    -   所有積木定義檔案(media/blockly/blocks/\*.js)
    -   所有程式碼生成器(media/blockly/generators/arduino/\*.js)
    -   主題定義檔案(media/blockly/themes/\*.js)
    -   WebView 管理器(src/webview/webviewManager.ts)
    -   訊息處理器(src/webview/messageHandler.ts)
    -   擴充功能主檔案(src/extension.ts)

-   **外部依賴**:

    -   Node.js 22.16.0
    -   VS Code API 1.96.0+
    -   webpack 5.102.1
    -   TypeScript 5.9.3

-   **工具依賴**:
    -   MCP tools (resolve-library-id, get-library-docs, webSearch)
    -   Git (版本控制和回滾)
    -   npm (套件管理)

## Risks

1. **高風險 - API 破壞性變更**:

    - 影響: 可能導致擴充功能無法啟動或功能失效
    - 緩解: 使用 MCP 工具徹底研究 API 變更,逐步測試每個模組
    - 應變: 準備回滾計畫,必要時降級至 11.2.2

2. **中風險 - 效能退化**:

    - 影響: 編輯器載入變慢或操作不順暢
    - 緩解: 執行效能基準測試,識別瓶頸
    - 應變: 向 Blockly 團隊回報問題或尋找優化方案

3. **中風險 - 工作區不相容**:

    - 影響: 使用者現有專案無法開啟
    - 緩解: 提前測試工作區載入,實作遷移邏輯
    - 應變: 提供工作區修復工具或手動遷移指南

4. **低風險 - 主題視覺問題**:

    - 影響: UI 顯示異常但不影響功能
    - 緩解: 徹底測試淺色/深色主題
    - 應變: 調整自訂主題定義或暫時禁用有問題的樣式

5. **低風險 - 翻譯問題**:
    - 影響: 部分語言顯示不正確
    - 緩解: 檢查 15 種語言檔案
    - 應變: 更新訊息鍵值或暫時降級至英文

## Out of Scope

-   **不包含**: webpack 6.x 升級(留待 Phase 2)
-   **不包含**: @types/node 24.x 升級(等待 VS Code 內建 Node.js 升級)
-   **不包含**: TypeScript ES2024 目標升級(低優先級)
-   **不包含**: 新功能開發(僅專注於升級相容性)
-   **不包含**: UI/UX 改進(除非直接由主題升級帶來)
-   **不包含**: 效能優化(除非解決由升級引起的退化)

## Constitution Alignment

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: 專注於單一目標(核心依賴升級),避免範圍蔓延
-   **Modularity**: 採用階段性升級策略,每個階段獨立驗證
-   **Avoid Over-Development**: 僅處理必要的 API 變更,不重構無關程式碼
-   **Flexibility**: 確保升級後多板卡、多語言功能繼續運作
-   **Research-Driven**: 強制使用 MCP 工具查詢官方文件,避免基於過時資訊決策
-   **Structured Logging**: 升級過程中使用標準日誌服務記錄所有關鍵步驟
-   **Comprehensive Test Coverage**: 利用現有 87.21% 覆蓋率捕捉回歸問題
-   **Pure Functions and Modular Architecture**: 升級過程中保持現有架構清晰度
-   **Traditional Chinese Documentation**: 本規格使用繁體中文撰寫,符合專案語言要求
