# Feature Specification: 安全型別定義升級

**Feature Branch**: `007-safe-types-upgrade`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "階段 1: 安全升級 - 升級 @types/vscode, @types/node 和 TypeScript target 至最新穩定版本"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - VSCode API 型別定義升級 (Priority: P1)

作為擴充功能開發者，我需要升級 `@types/vscode` 從 1.96.0 到 1.105.0，以便在開發時獲得最新的 VSCode API 型別提示和自動完成功能，確保程式碼品質和開發效率。

**為什麼是 P1 優先級**: 這是風險最低且影響最直接的升級。VSCode 型別定義通常向後相容，且立即改善開發體驗。這是獨立的升級項目，不依賴其他變更。

**獨立測試**: 可透過執行 TypeScript 編譯檢查 (`npm run compile`) 和完整測試套件 (`npm test`) 來驗證。如果編譯成功且所有 190 個測試通過，即表示升級成功且無迴歸問題。

**Acceptance Scenarios**:

1. **Given** package.json 中 @types/vscode 版本為 1.96.0，**When** 執行 `npm install @types/vscode@1.105.0` 並執行編譯和測試，**Then** 編譯零錯誤，所有測試通過，IDE 中顯示最新的 VSCode API 型別提示
2. **Given** 現有程式碼使用 VSCode API（如 vscode.window, vscode.workspace），**When** 升級完成後，**Then** 所有 API 呼叫保持功能正常，無型別錯誤
3. **Given** 測試覆蓋率為 87.21%，**When** 升級完成後重新執行測試，**Then** 測試覆蓋率維持在 87.21% 或以上

---

### User Story 2 - Node.js 型別定義升級 (Priority: P2)

作為擴充功能開發者，我需要升級 `@types/node` 從 20.19.22 到 22.x（與實際執行環境 Node.js 22.16.0 對齊），以便型別定義與實際執行環境一致，避免潛在的型別不匹配問題。

**為什麼是 P2 優先級**: 雖然重要，但目前 Node.js 20.x 型別定義已經能正常運作。升級到 22.x 主要是為了長期維護和型別準確性，不是緊急需求。依賴 US1 的驗證流程。

**獨立測試**: 可透過執行編譯、測試和建置流程來獨立驗證。特別需要檢查 Node.js 特定 API（如 fs, path, process）的型別正確性。如果所有驗證通過，即表示型別升級成功。

**Acceptance Scenarios**:

1. **Given** 執行環境為 Node.js 22.16.0，package.json 中 @types/node 版本為 20.19.22，**When** 升級至 @types/node@22.x，**Then** 編譯和測試全部通過，型別定義與執行環境一致
2. **Given** 程式碼中使用 Node.js API（如 FileService 中的 fs 操作），**When** 升級完成後，**Then** 所有 Node.js API 呼叫的型別檢查正確，無型別不匹配警告
3. **Given** webpack 建置流程使用 Node.js API，**When** 升級完成後執行 `npm run package`，**Then** 生產建置成功，產出檔案大小變化在 ±2% 範圍內（基準: 130,506 bytes）

---

### User Story 3 - TypeScript 編譯目標升級 (Priority: P3)

作為擴充功能開發者，我需要將 TypeScript 編譯目標從 ES2022 升級到 ES2023，以便使用更現代的 JavaScript 語言特性（如 Array grouping, Array.prototype.toSorted 等），並保持與最新 ECMAScript 標準同步。

**為什麼是 P3 優先級**: 這是可選的優化項目。目前 ES2022 已足夠支援專案需求，升級到 ES2023 主要是為了未來可用性和最佳實踐，不影響現有功能。應在 US1 和 US2 穩定後執行。

**獨立測試**: 可透過修改 tsconfig.json 中的 target 和 lib 設定，然後執行完整的編譯、測試和建置流程來驗證。如果所有流程通過且產出檔案正常，即表示升級成功。

**Acceptance Scenarios**:

1. **Given** tsconfig.json 中 target 為 "ES2022"，lib 為 ["ES2022"]，**When** 更新為 target: "ES2023"，lib: ["ES2023"]，**Then** 編譯成功，測試全部通過
2. **Given** 升級後的編譯設定，**When** 執行 webpack 建置，**Then** 產出的 dist/extension.js 正常運作，載入到 VSCode 後所有功能正常
3. **Given** 現有程式碼不使用 ES2023 特定功能，**When** 升級完成後，**Then** 生成的 JavaScript 程式碼保持相容性，不引入執行時錯誤

---

### Edge Cases

-   **型別定義衝突**: 如果 @types/vscode 1.105.0 中的型別定義與現有程式碼中的自訂型別有命名衝突，系統應該能透過 TypeScript 編譯錯誤明確指出問題位置
-   **Node.js 版本不匹配**: 如果開發環境的 Node.js 版本低於 22.x，但 @types/node 升級到 22.x，系統應該在 package.json 中新增 engines 欄位警告，並在 README 中更新最低 Node.js 版本需求
-   **ES2023 功能相容性**: 如果升級到 ES2023 後，webpack 產出的程式碼在較舊的 VSCode 版本（< 1.96.0）中執行失敗，需要評估是否要在 tsconfig.json 中調整 target（例如保持 ES2022）或更新 package.json 中的 engines.vscode 欄位
-   **測試覆蓋率下降**: 如果升級後測試覆蓋率從 87.21% 下降超過 0.5%，需要調查是否有測試檔案因型別錯誤而被跳過，或是否需要更新測試檔案的型別註解
-   **建置產出大小異常增加**: 如果升級後 dist/extension.js 大小增加超過 5%（> 137,031 bytes），需要分析是否有不必要的 polyfills 被引入，或是否需要調整 webpack 的 target 設定

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統必須將 `@types/vscode` 從 1.96.0 升級到 1.105.0，並確保所有 VSCode API 型別定義可用
-   **FR-002**: 系統必須將 `@types/node` 從 20.19.22 升級到 22.x 版本（與執行環境 Node.js 22.16.0 對齊）
-   **FR-003**: 系統必須將 `tsconfig.json` 中的 `target` 從 "ES2022" 升級到 "ES2023"
-   **FR-004**: 系統必須將 `tsconfig.json` 中的 `lib` 從 ["ES2022"] 升級到 ["ES2023"]
-   **FR-005**: 升級過程必須執行完整的 TypeScript 編譯檢查，確保零編譯錯誤
-   **FR-006**: 升級過程必須執行完整的測試套件（190 個測試），確保 100% 測試通過率
-   **FR-007**: 升級過程必須執行測試覆蓋率檢查，確保覆蓋率維持在 87.21% 或以上（允許 -0.5% 誤差範圍）
-   **FR-008**: 升級過程必須執行生產建置檢查，確保 dist/extension.js 成功生成且大小變化在 ±5% 範圍內
-   **FR-009**: 升級過程必須執行 ESLint 檢查，確保零 lint 錯誤
-   **FR-010**: 系統必須更新 `package.json` 和 `package-lock.json` 以反映新的依賴版本
-   **FR-011**: 系統必須在 `CHANGELOG.md` 中記錄升級內容，包含版本號變更和預期效益
-   **FR-012**: 升級完成後必須執行完整的功能基準測試，包含：Blockly 編輯器啟動、積木拖放、程式碼生成、主題切換、備份還原功能
-   **FR-013**: 如果任何驗證檢查失敗，系統必須能夠回滾到升級前的狀態（透過 Git）

### Key Entities

-   **DependencyPackage（依賴套件）**: 代表需要升級的 npm 套件，包含套件名稱、當前版本、目標版本、升級狀態（pending/success/failed）、驗證結果
-   **ValidationResult（驗證結果）**: 記錄每個驗證檢查點的結果，包含檢查類型（compilation/test/coverage/build/lint）、狀態（pass/fail）、執行時間、錯誤訊息（如果失敗）
-   **BuildArtifact（建置產物）**: 記錄建置產出的元資料，包含檔案大小、生成時間、source map 完整性、與基準值的比較結果
-   **TypeScriptConfig（TypeScript 配置）**: 代表 tsconfig.json 中的關鍵配置項目，包含 target、lib、module 設定的當前值和目標值

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 開發者在 IDE 中輸入 VSCode API 時，可看到完整的 VSCode 1.105.0 API 型別提示和自動完成選項（100% VSCode API 覆蓋）
-   **SC-002**: TypeScript 編譯時間維持在 5 秒以內（基準: 4.6 秒，允許 +10%）
-   **SC-003**: 完整測試套件執行時間維持在 22 秒以內（基準: 19.6 秒，允許 +10%）
-   **SC-004**: 測試覆蓋率維持在 87.21% 或以上（允許 -0.5% 誤差範圍，即 ≥ 86.71%）
-   **SC-005**: 所有 190 個測試案例通過率達到 100%（190/190 通過）
-   **SC-006**: 生產建置產出檔案 dist/extension.js 大小變化在 ±5% 範圍內（基準: 130,506 bytes，即 123,980~137,031 bytes）
-   **SC-007**: 整個升級流程（包含所有驗證）在 45 分鐘內完成
-   **SC-008**: npm audit 回報零個 critical 或 high 等級的安全漏洞
-   **SC-009**: 開發者可以在 5 分鐘內根據文件（quickstart.md）獨立完成升級流程
-   **SC-010**: Blockly 編輯器的核心功能（積木拖放、程式碼生成、主題切換）在升級後正常運作，使用者體驗無變化

## Constitution Alignment

此功能規格符合 Singular Blockly 憲章原則：

-   **簡潔性 (Simplicity)**: 升級流程採用標準 npm 工具，無複雜腳本。每個套件獨立升級和驗證，易於理解和執行
-   **模組化 (Modularity)**: 三個使用者故事（US1/US2/US3）各自獨立，可獨立實作、測試和部署。失敗時可獨立回滾
-   **避免過度開發 (Avoid Over-Development)**: 僅升級必要的型別定義和編譯目標，不追求最新主要版本或引入新功能
-   **靈活性 (Flexibility)**: 升級不改變專案架構，保持對多平台（Windows/macOS/Linux）和多開發板的支援彈性
-   **研究驅動開發 (Research-Driven)**: 將使用 MCP 工具驗證套件 changelog、breaking changes 和最佳實踐（如 `get-library-docs` 查詢 @types/vscode 和 @types/node 的版本資訊）
-   **結構化日誌 (Structured Logging)**: 升級過程記錄於 Git commit 訊息和 CHANGELOG.md，使用標準化格式
-   **全面測試覆蓋 (Comprehensive Test Coverage)**: 每個升級步驟都透過完整測試套件驗證，維持 87.21% 覆蓋率，無新增測試需求。現有測試已覆蓋所有關鍵路徑
-   **純函數與模組化架構 (Pure Functions and Modular Architecture)**: 升級不涉及程式碼變更，僅更新套件版本和配置檔案，不影響現有的服務層架構（FileService, SettingsManager 等）
-   **繁體中文文件 (Traditional Chinese Documentation)**: 本規格使用繁體中文撰寫，符合專案主要受眾的語言需求
