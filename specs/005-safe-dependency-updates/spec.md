# Feature Specification: Safe Dependency Updates (Phase 1)

**Feature Branch**: `005-safe-dependency-updates`  
**Created**: 2025-10-20  
**Status**: Draft  
**Input**: User description: "階段一: 安全更新 (低風險) - 升級 TypeScript 生態系、ESLint、測試框架和建置工具至最新次要版本,確保開發環境現代化且安全"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - TypeScript Ecosystem Update [P1]

作為開發者,我需要將 TypeScript 及其相關工具升級到最新穩定版本,以獲得更好的型別推斷、效能改進和最新的語言特性支援。

**Why this priority**: TypeScript 是專案的核心開發工具,其版本直接影響開發體驗、程式碼品質檢查和編譯效能。此更新風險最低且影響最廣。

**Independent Test**: 可透過執行完整的編譯流程 (`npm run compile`) 和測試套件 (`npm test`) 獨立驗證,確保所有現有功能正常運作且無型別錯誤。

**Acceptance Scenarios**:

1. **Given** 專案使用 TypeScript 5.7.2, **When** 升級到 5.9.3 並執行編譯, **Then** 編譯成功且無新增型別錯誤
2. **Given** 專案使用 @typescript-eslint/eslint-plugin 8.19.1, **When** 升級到 8.46.1, **Then** ESLint 檢查正常運作且無誤報
3. **Given** 專案使用 @typescript-eslint/parser 8.19.1, **When** 升級到 8.46.1, **Then** 與 ESLint 整合無衝突
4. **Given** 所有 TypeScript 套件已升級, **When** 執行完整測試套件, **Then** 所有測試通過且覆蓋率維持在 87%+ 水準

---

### User Story 2 - Testing Framework Update [P2]

作為開發者,我需要升級測試框架相關套件,以獲得更穩定的測試環境、更準確的測試結果和更好的錯誤訊息。

**Why this priority**: 測試框架確保程式碼品質,升級可修復已知 bug 並提供更好的測試工具。此更新依賴於 TypeScript 更新完成後的穩定環境。

**Independent Test**: 可透過執行完整測試套件 (`npm test`) 和覆蓋率測試 (`npm run test:coverage`) 獨立驗證,確保所有測試正常執行且結果一致。

**Acceptance Scenarios**:

1. **Given** 專案使用 @vscode/test-electron 2.4.1, **When** 升級到 2.5.2, **Then** VSCode 擴充功能測試正常執行
2. **Given** 專案使用 @vscode/test-cli 0.0.10, **When** 升級到 0.0.12, **Then** CLI 測試命令正常運作
3. **Given** 專案使用 sinon 20.0.0, **When** 升級到 21.0.0, **Then** 所有 mock/stub/spy 功能正常運作
4. **Given** 所有測試套件已升級, **When** 執行覆蓋率測試, **Then** 覆蓋率維持在 87.21% 以上且無測試失敗

---

### User Story 3 - Build Tools Update [P3]

作為開發者,我需要升級 Webpack 和相關載入器,以獲得更快的建置速度、更好的錯誤訊息和安全性修補。

**Why this priority**: 建置工具影響開發效率和最終產出品質,但對核心功能影響較小。此更新應在前兩項穩定後進行。

**Independent Test**: 可透過執行開發模式建置 (`npm run watch`)、生產模式建置 (`npm run package`) 和擴充功能載入測試獨立驗證。

**Acceptance Scenarios**:

1. **Given** 專案使用 webpack 5.97.1, **When** 升級到 5.102.1, **Then** 開發和生產建置都成功完成
2. **Given** 專案使用 ts-loader 9.5.1, **When** 升級到 9.5.4, **Then** TypeScript 檔案正確編譯且 source map 正常生成
3. **Given** 所有建置工具已升級, **When** 在 VSCode 中載入擴充功能, **Then** 擴充功能正常啟動且所有功能可用
4. **Given** 建置完成, **When** 檢查產出檔案大小和結構 (包含 extension.js 和 extension.js.map), **Then** 檔案大小無異常增大且必要檔案 (source map) 存在

---

### User Story 4 - ESLint Update [P3]

作為開發者,我需要升級 ESLint 到最新版本,以獲得新的程式碼品質檢查規則和更準確的程式碼分析。

**Why this priority**: ESLint 改進程式碼品質但不影響執行時功能,可與建置工具更新並行或後續進行。

**Independent Test**: 可透過執行 `npm run lint` 命令獨立驗證,確保現有程式碼符合新規則或合理調整規則配置。

**Acceptance Scenarios**:

1. **Given** 專案使用 eslint 9.32.0, **When** 升級到 9.38.0, **Then** ESLint 檢查正常執行且無錯誤
2. **Given** ESLint 已升級, **When** 對現有程式碼執行 lint 檢查, **Then** 無新增的阻斷性錯誤
3. **Given** ESLint 規則可能有調整, **When** 檢視新的警告訊息, **Then** 所有警告都已評估並記錄處理方案
4. **Given** 所有檢查完成, **When** 執行 `npm run lint:i18n`, **Then** i18n 腳本的 lint 檢查也正常運作

---

### Edge Cases

-   **向後相容性問題**: 如果某個套件的次要版本更新引入了非預期的 breaking change,應如何快速回滾?
-   **測試失敗處理**: 如果升級後部分測試失敗,如何判斷是測試本身需要更新還是升級導致的問題?
-   **建置產出差異**: 如果 Webpack 升級後產出的 bundle 大小或結構有顯著變化,如何驗證是否為正常優化?
-   **依賴衝突**: 如果某些套件之間存在版本相容性問題 (peer dependency warnings),應如何處理?
-   **開發環境差異**: 如何確保團隊成員在不同作業系統 (Windows/macOS/Linux) 上升級後的行為一致?

## Requirements _(mandatory)_

### Functional Requirements

#### TypeScript Ecosystem

-   **FR-001**: 系統必須將 TypeScript 生態系升級到最新版本 (包含 `typescript` 5.7.2→5.9.3, `@typescript-eslint/eslint-plugin` 8.19.1→8.46.1, `@typescript-eslint/parser` 8.19.1→8.46.1),這三個套件必須同步升級以確保相容性
-   **FR-002**: 升級後所有 TypeScript 編譯必須成功且無新增型別錯誤

#### Testing Framework

-   **FR-003**: 系統必須將 `@vscode/test-electron` 從 2.4.1 升級到 2.5.2
-   **FR-004**: 系統必須將 `@vscode/test-cli` 從 0.0.10 升級到 0.0.12
-   **FR-005**: 系統必須將 `sinon` 從 20.0.0 升級到 21.0.0
-   **FR-006**: 升級後所有測試必須通過且測試覆蓋率維持在 87%+ 水準

#### Build Tools

-   **FR-007**: 系統必須將 `webpack` 從 5.97.1 升級到 5.102.1
-   **FR-008**: 系統必須將 `ts-loader` 從 9.5.1 升級到 9.5.4
-   **FR-009**: 升級後開發模式 (`npm run watch`) 和生產模式 (`npm run package`) 建置都必須成功

#### Code Quality Tools

-   **FR-010**: 系統必須將 `eslint` 從 9.32.0 升級到 9.38.0
-   **FR-011**: 升級後 ESLint 檢查必須正常執行且無阻斷性錯誤

#### Verification & Documentation

-   **FR-012**: 系統必須在升級前執行完整測試套件以建立效能和功能基準線 (包含測試執行時間、建置時間、產出檔案大小和所有測試案例的通過狀態)
-   **FR-013**: 系統必須在升級後執行完整測試套件並比對結果
-   **FR-014**: 系統必須記錄所有升級過程中遇到的問題和解決方案
-   **FR-015**: 系統必須更新 `package.json` 中的依賴版本
-   **FR-016**: 系統必須更新 `package-lock.json` 以確保版本鎖定
-   **FR-017**: 系統必須在 CHANGELOG.md 中記錄此次升級內容

#### Security & Quality Assurance

-   **FR-018**: 系統必須執行 `npm audit` 驗證升級後無 critical 或 high 級別的已知安全漏洞
-   **FR-019**: 升級後的建置產出必須包含必要的結構檔案 (如 source map),以確保除錯和錯誤追蹤功能正常

#### Quality Assurance

-   **FR-020**: 升級過程必須遵循「升級 → 測試 → 驗證」的循環模式
-   **FR-021**: 每個套件類別 (TypeScript/Testing/Build/ESLint) 必須作為獨立可驗證的單元
-   **FR-022**: 如果任何測試失敗,必須分析並修復或記錄為已知問題後才能繼續
-   **FR-023**: 最終版本必須在 Windows、macOS 和 Linux 環境下都能成功建置和測試

### Key Entities

-   **Dependency Package**: 代表 npm 套件,包含名稱、當前版本、目標版本、套件類型 (dev/prod)
-   **Test Result**: 代表測試執行結果,包含測試套件名稱、通過/失敗狀態、覆蓋率數據
-   **Build Artifact**: 代表建置產出,包含檔案路徑、大小、source map 資訊
-   **Change Log Entry**: 代表更新記錄,包含日期、變更類型、受影響套件清單

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 所有目標套件成功升級到指定版本,透過 `npm list` 命令驗證無版本衝突
-   **SC-002**: 完整測試套件執行時間不增加超過 10%,且所有 63 個測試全數通過
-   **SC-003**: 測試覆蓋率維持在 87.21% 或更高,無覆蓋率下降情況
-   **SC-004**: 生產模式建置產出的 extension.js 檔案大小變化在 ±5% 範圍內
-   **SC-005**: 開發模式下首次編譯時間不超過當前基準的 110%
-   **SC-006**: ESLint 檢查執行時間不超過 30 秒,且無新增的阻斷性錯誤
-   **SC-007**: 擴充功能在 VSCode Extension Development Host 中正常啟動,所有命令可執行
-   **SC-008**: Blockly 編輯器可正常開啟,積木拖放、程式碼生成、檔案儲存等核心功能正常運作
-   **SC-009**: 在 Windows 10/11、macOS 和 Ubuntu 22.04 環境下建置和測試結果一致
-   **SC-010**: CHANGELOG.md 中明確記錄升級的套件清單和版本號,供使用者參考

## Constitution Alignment

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: 升級範圍限定在低風險的次要版本更新,避免引入複雜的重構需求
-   **Modularity**: 將升級分為四個獨立模組 (TypeScript/Testing/Build/ESLint),每個都可獨立驗證
-   **Avoid Over-Development**: 僅升級必要的安全更新和效能改進,不追求最新主要版本
-   **Flexibility**: 升級過程保持對多平台 (Windows/macOS/Linux) 和多開發環境的支援
-   **Research-Driven**: 使用 `npm outdated` 和套件 changelog 分析升級影響,基於數據決策
-   **Structured Logging**: 升級過程中使用標準化的記錄格式,便於問題追蹤和回溯
-   **Comprehensive Test Coverage**: 每個升級步驟都透過完整測試套件驗證,確保無迴歸問題
-   **Pure Functions and Modular Architecture**: 升級不改變現有架構,保持服務層和業務邏輯的純淨性

## Assumptions

-   假設開發環境已安裝 Node.js 20.x 版本 (與 CI/CD 一致)
-   假設團隊成員使用 `npm ci` 而非 `npm install` 來確保依賴一致性
-   假設次要版本更新 (minor/patch) 遵循 semver 規範,不應包含 breaking changes
-   假設現有測試套件已充分覆蓋核心功能,能有效檢測升級導致的問題
-   假設 peer dependency 警告可接受,只要實際功能測試通過
-   假設建置產出大小變化在 ±5% 內為正常範圍 (優化或 polyfill 變化所致)

## Dependencies

-   **內部依賴**: 無 - 此為基礎設施升級,不依賴其他功能開發
-   **外部依賴**:
    -   npm registry 可正常存取以下載套件
    -   GitHub Actions runner 環境與本地開發環境一致
    -   VSCode Extension Development Host 環境可用於整合測試

## Risks & Mitigation

### Risk 1: 隱藏的 Breaking Changes

-   **影響**: 中等
-   **緩解**:
    -   在專案分支上進行升級,不直接在 master 分支操作
    -   每次升級後立即執行完整測試套件
    -   保留詳細的升級前後對比記錄,便於快速回滾

### Risk 2: 跨平台建置差異

-   **影響**: 低
-   **緩解**:
    -   在 Windows、macOS 和 Linux 環境下分別驗證
    -   使用 GitHub Actions CI 作為標準驗證環境
    -   記錄任何平台特定的問題和解決方案

### Risk 3: 測試套件不穩定

-   **影響**: 低
-   **緩解**:
    -   升級前多次執行測試確保基準穩定
    -   使用 `npm run test:bail` 在首個失敗時停止,快速定位問題
    -   如遇間歇性失敗,增加測試超時時間或修復 flaky test

## Out of Scope

-   **不包含**: 升級 Blockly (11.2.2 → 12.3.1) - 此為主要版本升級,風險較高
-   **不包含**: 升級 @blockly/theme-modern (6.0.10 → 7.0.1) - 依賴於 Blockly 升級
-   **不包含**: 升級 @types/node (20.x → 24.x) - 跨越多個主要版本,需獨立評估
-   **不包含**: 升級 @types/vscode (1.96.0 → 1.105.0) - 可能需要調整 VSCode API 使用方式
-   **不包含**: 升級 webpack-cli (5.1.4 → 6.0.1) - 主要版本升級,需獨立處理
-   **不包含**: 新增或修改現有功能 - 此次僅進行依賴升級
-   **不包含**: 效能優化或重構 - 除非升級後測試失敗需要修正
