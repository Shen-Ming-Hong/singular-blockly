# Feature Specification: 次要依賴更新 (Phase 2)

**Feature Branch**: `006-minor-deps-update`  
**Created**: 2025-10-20  
**Status**: Draft  
**Input**: User description: "Phase 2: 安全的 Minor 依賴更新 - 升級 @blockly/theme-modern (6.0.10→6.0.12) 和 @types/node (20.17.12→20.19.22) 到最新穩定次要版本"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Blockly 主題模組更新 [P1]

作為開發者,我需要將 `@blockly/theme-modern` 從 6.0.10 升級到 6.0.12,以獲得最新的 bug 修復和主題系統改進,確保 Blockly 編輯器的明暗主題切換功能保持穩定且視覺一致。

**Why this priority**: 此套件直接影響使用者體驗,主題系統是編輯器的核心視覺元件。這是最低風險的升級 (patch 版本),應優先驗證以確保視覺穩定性。

**Independent Test**: 可透過啟動 Extension Development Host、開啟 Blockly 編輯器並測試明暗主題切換功能獨立驗證,無需依賴其他升級項目。

**Acceptance Scenarios**:

1. **Given** 專案使用 @blockly/theme-modern 6.0.10, **When** 升級到 6.0.12 並執行 TypeScript 編譯, **Then** 編譯成功且無新增型別錯誤
2. **Given** 升級完成, **When** 在 Blockly 編輯器中切換明亮主題, **Then** 所有積木和工具箱正確顯示明亮配色且無視覺異常
3. **Given** 升級完成, **When** 在 Blockly 編輯器中切換深色主題, **Then** 所有積木和工具箱正確顯示深色配色且無視覺異常
4. **Given** 升級完成, **When** 執行完整測試套件, **Then** 所有測試通過且測試覆蓋率維持在 87.21% 或以上

---

### User Story 2 - Node.js 型別定義更新 [P2]

作為開發者,我需要將 `@types/node` 從 20.17.12 升級到 20.19.22,以獲得最新的 Node.js 20.x API 型別定義,確保開發時的型別檢查準確性和 IDE 自動完成功能的正確性。

**Why this priority**: 型別定義影響開發體驗但不影響執行時功能,應在主題模組驗證穩定後進行。此更新保持在 Node.js 20.x 主版本內,風險極低。

**Independent Test**: 可透過執行 TypeScript 編譯 (`npm run compile`) 和完整測試套件 (`npm test`) 獨立驗證,確保所有 Node.js API 使用都有正確的型別推斷。

**Acceptance Scenarios**:

1. **Given** 專案使用 @types/node 20.17.12, **When** 升級到 20.19.22 並執行 TypeScript 編譯, **Then** 編譯成功且無新增型別錯誤
2. **Given** 升級完成, **When** 檢查使用 Node.js API 的檔案 (fs, path, child_process 等), **Then** IDE 提供正確的型別提示和自動完成
3. **Given** 升級完成, **When** 執行完整測試套件, **Then** 所有 191 個測試執行結果與基準一致 (190 通過, 1 個已知失敗)
4. **Given** 升級完成, **When** 執行開發和生產建置, **Then** 兩種建置都成功完成且產出檔案結構正確

---

### Edge Cases

-   **升級後型別衝突**: 如果 @types/node 20.19.22 引入的新型別定義與現有程式碼產生衝突,應如何快速識別和修正?
-   **主題視覺迴歸**: 如果 @blockly/theme-modern 6.0.12 的 CSS 變更導致特定積木或 UI 元件顯示異常,應如何回溯驗證?
-   **跨平台建置差異**: 升級後在 Windows、macOS、Linux 環境下的型別檢查結果是否一致?
-   **依賴鏈衝突**: 兩個套件升級後是否會與其他相依套件產生 peer dependency 警告?
-   **IDE 快取問題**: VSCode 的 TypeScript 伺服器是否需要重啟才能正確載入新的型別定義?

## Requirements _(mandatory)_

### Functional Requirements

#### Blockly 主題模組升級

-   **FR-001**: 系統必須將 `@blockly/theme-modern` 從 6.0.10 升級到 6.0.12
-   **FR-002**: 升級後 TypeScript 編譯必須成功且無新增型別錯誤
-   **FR-003**: 升級後 Blockly 編輯器的明亮主題必須正確顯示所有積木和工具箱
-   **FR-004**: 升級後 Blockly 編輯器的深色主題必須正確顯示所有積木和工具箱
-   **FR-005**: 升級後主題切換功能必須即時生效且無視覺閃爍或延遲

#### Node.js 型別定義升級

-   **FR-006**: 系統必須將 `@types/node` 從 20.17.12 升級到 20.19.22
-   **FR-007**: 升級後所有使用 Node.js API 的檔案必須有正確的型別推斷
-   **FR-008**: 升級後 IDE (VSCode) 必須提供準確的自動完成和型別提示
-   **FR-009**: 升級後專案必須保持與 Node.js 20.x 執行環境的相容性

#### 驗證與文件

-   **FR-010**: 系統必須在升級前執行完整測試套件以建立基準線
-   **FR-011**: 系統必須在升級後執行完整測試套件並比對結果
-   **FR-012**: 升級後測試覆蓋率必須維持在 87.21% 或以上
-   **FR-013**: 系統必須在升級後執行開發和生產建置驗證
-   **FR-014**: 系統必須更新 `package.json` 和 `package-lock.json` 中的依賴版本
-   **FR-015**: 系統必須執行 `npm audit` 驗證無新增安全漏洞
-   **FR-016**: 系統必須在 CHANGELOG.md 中記錄此次升級內容

#### 品質保證

-   **FR-017**: 升級過程必須遵循「升級 → 測試 → 驗證」的循環模式
-   **FR-018**: 每個套件必須作為獨立可驗證的單元進行升級和測試
-   **FR-019**: 如果任何測試失敗,必須分析並修復或記錄為已知問題後才能繼續
-   **FR-020**: 最終版本必須能在 Windows 環境下成功建置和測試 (macOS 和 Linux 驗證為選配)

### Key Entities

-   **Dependency Package**: 代表 npm 套件,包含名稱、當前版本、目標版本、升級類型 (patch/minor)
-   **Test Result**: 代表測試執行結果,包含測試套件名稱、通過/失敗狀態、執行時間、覆蓋率數據
-   **Build Artifact**: 代表建置產出,包含檔案路徑、大小、source map 資訊
-   **Visual Theme State**: 代表 Blockly 主題狀態,包含當前主題 (light/dark)、積木配色、工具箱樣式
-   **Type Definition Coverage**: 代表型別定義涵蓋範圍,包含 API 名稱、型別正確性、自動完成可用性

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 兩個目標套件成功升級到指定版本,透過 `npm list` 命令驗證版本正確且無依賴衝突
-   **SC-002**: TypeScript 編譯時間不超過 Phase 1 基準 (4.6 秒) 的 110%,且編譯成功無錯誤
-   **SC-003**: 完整測試套件執行結果維持在 190/191 測試通過 (與 Phase 1 基準一致)
-   **SC-004**: 測試覆蓋率維持在 87.21% 或更高,無覆蓋率下降情況
-   **SC-005**: 開發模式和生產模式建置都成功完成,產出檔案 (extension.js, extension.js.map) 大小變化在 ±2% 範圍內
-   **SC-006**: Blockly 編輯器在明暗主題下都能正確顯示,手動測試確認無視覺異常
-   **SC-007**: 所有使用 Node.js API 的檔案在 VSCode 中都有正確的型別提示和自動完成
-   **SC-008**: `npm audit` 回報 0 個 critical 或 high 級別安全漏洞
-   **SC-009**: CHANGELOG.md 中記錄了升級的兩個套件及其版本號
-   **SC-010**: 升級過程在 Windows 環境下驗證通過,整體耗時不超過 45 分鐘

## Constitution Alignment

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: 升級範圍限定在兩個低風險的 patch/minor 版本更新,避免引入複雜的重構需求
-   **Modularity**: 兩個套件可獨立升級和驗證,互不依賴且失敗時可獨立回滾
-   **Avoid Over-Development**: 僅升級必要的次要版本更新,不追求最新主要版本或不必要的功能
-   **Flexibility**: 升級過程保持對多平台和多開發環境的支援,不限定特定 OS
-   **Research-Driven**: 基於 Phase 1 的成功經驗和 `npm outdated` 分析結果進行升級決策
-   **Structured Logging**: 升級過程記錄於 Git commit 和 CHANGELOG,便於追蹤和回溯
-   **Comprehensive Test Coverage**: 每個升級步驟都透過完整測試套件驗證,確保無迴歸問題
-   **Pure Functions and Modular Architecture**: 升級不改變現有架構,保持服務層和業務邏輯的純淨性
-   **Traditional Chinese Documentation**: 本規格使用繁體中文撰寫,符合專案語言要求

## Assumptions

-   假設開發環境已完成 Phase 1 升級,Node.js 20.x 和 npm 已安裝
-   假設 Phase 1 的測試基準 (190/191 測試通過) 為此階段的參考基準
-   假設 @blockly/theme-modern 6.0.10 → 6.0.12 為 patch 版本,遵循 semver 規範不應包含 breaking changes
-   假設 @types/node 20.17.12 → 20.19.22 保持在 Node.js 20.x 相容範圍內
-   假設現有的 Blockly 主題配置 (SingularBlocklyLightTheme, SingularBlocklyDarkTheme) 與新版本相容
-   假設 peer dependency 警告可接受,只要實際功能測試通過
-   假設手動主題測試可在 Windows 環境下完成,無需跨平台驗證

## Dependencies

-   **內部依賴**:
    -   Phase 1 (005-safe-dependency-updates) 必須已完成並合併到 master
    -   TypeScript 5.9.3、webpack 5.102.1 等開發工具必須已就緒
-   **外部依賴**:
    -   npm registry 可正常存取以下載套件
    -   VSCode Extension Development Host 環境可用於手動主題測試
    -   Git 工作目錄乾淨,無未提交的變更

## Risks & Mitigation

### Risk 1: 主題視覺迴歸

-   **影響**: 低-中等
-   **緩解**:
    -   在專案分支上進行升級,不直接在 master 分支操作
    -   升級後立即進行手動主題切換測試
    -   檢查 @blockly/theme-modern 6.0.12 的 changelog,確認 CSS 變更範圍
    -   如有問題可快速回滾到 6.0.10

### Risk 2: 型別定義不相容

-   **影響**: 低
-   **緩解**:
    -   @types/node 保持在 20.x 版本內,API 變化極小
    -   升級後立即執行 TypeScript 編譯,快速發現型別錯誤
    -   使用 VSCode 的 TypeScript 伺服器即時檢查型別問題
    -   保留詳細的編譯錯誤記錄,便於回溯分析

### Risk 3: IDE 快取導致型別提示不更新

-   **影響**: 低
-   **緩解**:
    -   升級後重啟 VSCode 的 TypeScript 伺服器
    -   執行 "TypeScript: Restart TS Server" 命令清除快取
    -   記錄重啟步驟於升級文件中

## Out of Scope

-   **不包含**: 升級 @blockly/theme-modern 到 7.0.1 主要版本 - 需等待 Blockly 12.x 升級
-   **不包含**: 升級 @types/node 到 24.x - 跨越多個主要版本,需獨立評估
-   **不包含**: 跨平台 (macOS, Linux) 驗證 - 僅在 Windows 環境驗證
-   **不包含**: 效能優化或重構 - 除非升級後測試失敗需要修正
-   **不包含**: 新增或修改現有功能 - 此次僅進行依賴升級
-   **不包含**: CI/CD 流程調整 - 除非升級導致 GitHub Actions 失敗
