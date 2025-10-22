# Implementation Plan: 專案安全防護機制

**Branch**: `010-project-safety-guard` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-project-safety-guard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

在使用者於非 Blockly 專案中誤觸擴展按鈕時,提供專案類型偵測與警告對話框機制,防止意外破壞現有專案檔案結構。核心技術方案包括:在命令執行前檢查 `blockly/` 資料夾存在性、使用 VSCode 標準對話框 API 顯示兒童友善警告訊息、透過檔案存在性檢查識別專案類型(Node.js/Python/Java/.NET/Go)、並將使用者偏好設定持久化至工作區設定。系統設計為三階段優先級:P1 核心防護、P2 智慧識別、P3 偏好記憶,確保最小可行產品即可提供完整保護價值。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 22.16.0+  
**Primary Dependencies**: VSCode Extension API 1.96.0+, @types/vscode, 現有 FileService/SettingsManager/logging 服務層  
**Storage**: VSCode workspace settings (`.vscode/settings.json`) 用於使用者偏好設定  
**Testing**: 現有測試框架 (Mocha/TypeScript), mock VSCode API  
**Target Platform**: VSCode Extension (Windows/macOS/Linux)
**Project Type**: VSCode Extension (單一專案結構)  
**Performance Goals**: 對話框顯示 <100ms, 專案類型偵測 <50ms, 不影響編輯器開啟速度  
**Constraints**: 必須與現有 webviewManager.ts 工作區檢查邏輯整合, 使用標準 VSCode API (不自訂 WebView UI), 兒童友善文案  
**Scale/Scope**: 5 種專案類型識別 (Node.js/Python/Java/.NET/Go), 3 個功能優先級 (P1/P2/P3), 13 項功能需求

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Review each core principle from `.specify/memory/constitution.md`:

-   [x] **Simplicity and Maintainability**: 設計採用簡單的資料夾存在性檢查 + 標準 VSCode 對話框 API,無複雜邏輯,元件職責明確
-   [x] **Modularity and Extensibility**: 專案類型偵測器獨立模組化,可輕鬆擴展新專案類型;偏好設定機制解耦於核心邏輯
-   [x] **Avoid Over-Development**: 功能範圍最小化,P1 即提供完整價值,P2/P3 為漸進增強;無過度設計(不追蹤歷史、不建立規則引擎)
-   [x] **Flexibility and Adaptability**: 專案類型識別採用 JSON 設定檔模式(類似 board_configs.js),未來可無程式碼變更擴展
-   [x] **Research-Driven Development (MCP-Powered)**: 需使用 MCP 工具查詢 VSCode API 最佳實踐(showWarningMessage、workspace settings API)
-   [x] **Structured Logging**: 所有診斷輸出使用 `log.info/warn/error` 記錄檢查結果、使用者選擇、專案類型偵測結果
-   [x] **Comprehensive Test Coverage**: 設計為 100% 可測試:專案類型偵測為純函式,對話框處理使用 mock VSCode API,無阻塞操作
-   [x] **Pure Functions and Modular Architecture**: 專案類型偵測邏輯為純函式(輸入路徑 → 輸出類型),與 UI 層(對話框)分離
-   [x] **Traditional Chinese Documentation**: 本實作計畫以繁體中文撰寫,符合憲法第九原則要求

**Research Actions Taken**:

-   [ ] 需驗證 VSCode `showWarningMessage` API 是否支援核取方塊選項(modal: true 模式)
-   [ ] 需確認 workspace settings API 最佳實踐(設定鍵命名慣例、作用域選擇)
-   [ ] 需檢查現有 `webviewManager.ts` 工作區檢查邏輯的詳細實作方式
-   [ ] 需確認 VSCode API 對話框按鈕本地化最佳實踐(兒童友善文案)
-   [ ] 需記錄研究結果於 `research.md`

**Testability Assessment**:

-   [x] 所有業務邏輯可獨立測試:專案類型偵測、偏好設定讀寫、blockly 資料夾檢查
-   [x] 無無限迴圈或阻塞操作:所有檢查為同步檔案系統操作或 VSCode API 呼叫
-   [x] 純函式已識別:專案類型偵測邏輯(輸入工作區路徑 → 輸出專案類型字串)
-   [x] 依賴注入用於可測試邊界:FileService/SettingsManager 可注入 mock 實作

**Violations Requiring Justification**: 無

## Project Structure

### Documentation (this feature)

```
specs/010-project-safety-guard/
├── spec.md                    # 功能規格(已完成)
├── plan.md                    # 本檔案(實作計畫)
├── research.md                # Phase 0 輸出(研究結果)
├── data-model.md              # Phase 1 輸出(資料模型)
├── quickstart.md              # Phase 1 輸出(快速入門)
├── contracts/                 # Phase 1 輸出(API 合約)
│   └── projectSafetyGuard.ts # TypeScript 介面定義
├── checklists/                # 檢查清單
│   └── requirements.md        # 規格品質檢查(已完成)
└── tasks.md                   # Phase 2 輸出(/speckit.tasks 命令產生)
```

### Source Code (repository root)

```
src/
├── extension.ts                           # 需修改:在 openBlocklyEdit 命令前加入安全檢查
├── services/
│   ├── fileService.ts                     # 現有:檔案操作服務(已有)
│   ├── settingsManager.ts                 # 需擴展:新增偏好設定讀寫方法
│   ├── logging.ts                         # 現有:日誌服務(已有)
│   ├── localeService.ts                   # 現有:多語言服務(已有)
│   ├── projectTypeDetector.ts             # 新增:專案類型識別服務
│   └── workspaceValidator.ts              # 新增:工作區驗證服務(整合檢查邏輯)
├── webview/
│   ├── webviewManager.ts                  # 需修改:整合安全檢查至 createAndShowWebView()
│   └── messageHandler.ts                  # 現有:訊息處理器(不需修改)
└── test/
    ├── services/
    │   ├── projectTypeDetector.test.ts    # 新增:專案類型偵測測試
    │   ├── workspaceValidator.test.ts     # 新增:工作區驗證測試
    │   └── settingsManager.test.ts        # 需擴展:偏好設定測試
    └── integration/
        └── safetyGuard.test.ts            # 新增:端到端整合測試
```

**Structure Decision**:

-   採用現有 VSCode Extension 單一專案結構
-   新增兩個服務類別:`ProjectTypeDetector`(純函式邏輯)、`WorkspaceValidator`(整合協調器)
-   擴展 `SettingsManager` 以支援偏好設定 CRUD
-   修改 `extension.ts` 與 `webviewManager.ts` 以整合安全檢查流程
-   測試覆蓋率目標:100%(純函式 + mock VSCode API)

## Complexity Tracking

## Complexity Tracking

_無憲法違規需要說明。所有設計決策符合簡單性、模組化、避免過度開發等核心原則。_

---

## Phase 0: Research & Design (COMPLETED)

**Status**: ✅ 完成  
**Date**: 2025-01-22  
**Duration**: 1 session

### Research Findings

詳見 `research.md`,關鍵發現:

1. **R1**: VSCode `showWarningMessage` 不支援 checkbox,改用三按鈕設計(繼續/取消/不再提醒)
2. **R2**: 使用 `vscode.workspace.getConfiguration()` API 管理偏好設定,鍵名 `singularBlockly.safetyGuard.suppressWarning`
3. **R3**: 整合點位於 `webviewManager.ts` lines 67-77 之後,在 PlatformIO 設定前執行
4. **R4**: 使用現有 `LocaleService` 機制,新增 5 個訊息鍵(SAFETY*WARNING*_, BUTTON\__)
5. **R5**: 定義 6 種專案類型識別規則(Node.js/Python/Java/NET/Go),使用檔案存在性檢查

### Design Artifacts Created

-   ✅ `research.md` - 研究結果文件(5 個研究問題與答案)
-   ✅ `data-model.md` - 資料實體定義(4 個核心實體 + 狀態流轉圖)
-   ✅ `contracts/projectSafetyGuard.ts` - TypeScript 介面定義(IWorkspaceValidator, IProjectTypeDetector + 常數)
-   ✅ `quickstart.md` - 開發者快速入門指南(環境設定、實作步驟、測試流程)

### Constitution Re-evaluation

**變更項目**: 無(設計期間無架構調整)

**憲法檢查結果**: 全部通過 ✅

-   Principle I (簡單性): 純函式設計 + 服務層協調
-   Principle II (模組化): 新增兩個獨立服務,擴展現有 SettingsManager
-   Principle III (避免過度開發): 僅實作核心 P1 功能,P2/P3 留待需求確認
-   Principle IV (可擴展性): 規則陣列設計支援新增專案類型
-   Principle V (研究驅動): 使用 MCP 工具驗證 VSCode API 能力
-   Principle VI (可讀性優先): 100% TypeScript 型別註解 + JSDoc 註釋
-   Principle VII (測試驅動): 設計包含完整測試策略(100% 覆蓋率目標)
-   Principle VIII (效能意識): 定義效能目標(<100ms 對話框, <50ms 偵測)
-   Principle IX (使用者中心): 兒童友善語言設計 + 三按鈕簡化 UX

---

## Phase 1: Design & Contracts (COMPLETED)

**Status**: ✅ 完成  
**Date**: 2025-01-22  
**Duration**: 1 session

### Deliverables

1. **Data Model** (`data-model.md`)

    - 定義 4 個核心實體:
        - `WorkspaceValidationResult`: 驗證結果狀態
        - `ProjectTypeRule`: 專案類型識別規則
        - `UserPreference`: 使用者偏好設定
        - `SafetyGuardDialogResult`: 對話框回應結果
    - 包含狀態流轉圖(Mermaid)與資料流分析(3 個情境)
    - 定義驗證規則與效能考量(<200ms 總計)

2. **Contracts** (`contracts/projectSafetyGuard.ts`)

    - TypeScript 介面定義:
        - `IWorkspaceValidator`: 工作區驗證服務介面
        - `IProjectTypeDetector`: 專案類型偵測器介面
    - 常數定義:
        - `PROJECT_TYPE_RULES`: 6 種專案類型規則
        - `MESSAGE_KEYS`: 5 個 i18n 訊息鍵
        - `SETTING_KEY`: VSCode 設定鍵名
    - 工具函式:
        - `isValidWorkspacePath()`: 路徑驗證
        - `validateProjectTypeRules()`: 規則驗證
        - Type guards(`isSafetyGuardDialogResult`, `isWorkspaceValidationResult`)

3. **Quickstart Guide** (`quickstart.md`)

    - 開發環境設定(Node.js 22.16.0+, VSCode 1.96.0+)
    - 6 步驟實作指南:
        - Step 1: 定義類型(`src/types/safetyGuard.ts`)
        - Step 2: 實作 ProjectTypeDetector(純函式)
        - Step 3: 實作 WorkspaceValidator(服務層)
        - Step 4: 整合至 webviewManager.ts
        - Step 5: 更新 package.json(設定項目)
        - Step 6: 新增翻譯訊息(15 語系)
    - 測試流程:5 個手動測試情境(A-E)
    - 除錯技巧與常見問題

4. **Agent Context** (`.github/copilot-instructions.md`)
    - 已更新技術棧資訊:
        - Language: TypeScript 5.9.3, Node.js 22.16.0+
        - Framework: VSCode Extension API 1.96.0+
        - Database: VSCode workspace settings
    - 執行工具: `update-agent-context.ps1`

### Next Steps

執行 `/speckit.tasks` 命令進入 Phase 2,產生 `tasks.md` 並開始實作。

---

## Phase 2: Task Breakdown

**Status**: ⏸️ 待執行  
**Command**: `/speckit.tasks`  
**Expected Output**: `tasks.md` 檔案,包含 P1/P2/P3 原子任務清單

_此階段由 /speckit.tasks 命令自動產生,不在 plan.md 手動編輯。_
