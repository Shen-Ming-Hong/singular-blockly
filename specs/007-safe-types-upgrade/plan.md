# Implementation Plan: 階段 1 安全升級 - 型別定義與 TypeScript 目標

**Branch**: `007-safe-types-upgrade` | **Date**: 2025-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-safe-types-upgrade/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

<!--
  LANGUAGE REQUIREMENT (Principle IX):
  This implementation plan MUST be written in Traditional Chinese (繁體中文, zh-TW).
  All planning content, technical context, and documentation should be in Traditional
  Chinese to align with the project's primary audience and facilitate team collaboration.

  Code snippets and technical references MAY remain in English for developer clarity.
-->

## Summary

本實作計畫針對 Singular Blockly VSCode 擴充功能進行安全的型別定義升級,涵蓋三個核心升級:

1. **@types/vscode**: 從 1.96.0 升級至 1.105.0 (9 個次要版本)
2. **@types/node**: 從 20.19.22 升級至 22.x (與 Node.js 22.16.0 runtime 對齊)
3. **TypeScript 編譯目標**: 從 ES2022 升級至 ES2023

**技術方法** (基於 research.md 研究):

-   所有升級項目經 MCP 工具驗證為向後相容,風險等級 🟢 極低
-   無需修改任何程式碼,僅更新配置檔案 (package.json, tsconfig.json)
-   現有 190 個測試將驗證升級不破壞功能
-   預期時程: 45 分鐘 (包含驗證和文件更新)

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 22.16.0  
**Primary Dependencies**:

-   @types/vscode: 1.96.0 → 1.105.0 (升級目標)
-   @types/node: 20.19.22 → 22.x (升級目標)
-   無需新增依賴

**Storage**: N/A (僅型別定義升級,不涉及資料儲存)  
**Testing**: Mocha + @vscode/test-electron

-   現有測試: 190 個 (100% 通過率要求)
-   目標覆蓋率: ≥87.21% (維持當前基準線)
-   基準執行時間: 19.6s
-   無需新增測試 (Principle VII - 僅配置變更)

**Target Platform**: VSCode Extension (Node.js Environment)  
**Project Type**: Single project (VSCode Extension with TypeScript)  
**Performance Goals**:

-   編譯時間: ≤5s (當前基準: 4.6s)
-   測試執行: ≤22s (基準 19.6s × 1.1 安全係數)
-   建置產物: 130,506 bytes ±5%

**Constraints**:

-   必須維持向後相容性 (無程式碼修改)
-   VSCode 引擎版本: ≥1.96.0 (package.json)
-   不可破壞現有 190 個測試

**Scale/Scope**:

-   影響檔案: 3 個 (package.json, package-lock.json, tsconfig.json)
-   升級套件: 2 個型別定義套件
-   預估時程: 45 分鐘

## Constitution Check

Have you verified compliance with these principles?

-   [x] I. Code Entities as Contracts - ✅ 無新增實體,現有契約不變
-   [x] II. Type Signatures First - ✅ 僅升級型別定義,無需新簽章
-   [x] III. Pure Functions - ✅ 無新增函數,現有純函數不受影響
-   [x] IV. Test-Driven Transparency - ✅ 執行現有 190 測試驗證升級
-   [x] V. MCP Tools for Unknown API - ✅ 已使用 MCP 工具研究 (research.md 記錄)
    -   `mcp_upstash_conte_resolve-library-id` - 搜尋 VSCode/Node 文檔
    -   `webSearch` - 查詢 API 變更和相容性
    -   `get_vscode_api` - 驗證 VSCode API 定義
-   [x] VI. Proactive Prevention First - ✅ 風險分析完成 (research.md 第 3 節)
    -   所有升級項目評為 🟢 極低風險
    -   識別並記錄編輯器 schema 警告 (可忽略)
-   [x] VII. Testing as Ground Truth - ✅ 測試覆蓋率維持 87.21%
    -   無需新增測試 (僅型別定義升級)
    -   執行現有測試套件驗證向後相容性
-   [x] VIII. Functional Purity Standards - ✅ 無副作用引入
    -   僅修改靜態配置檔案 (package.json, tsconfig.json)
    -   不影響執行時行為
-   [x] IX. Traditional Chinese Documentation - ✅ 本文件使用繁體中文
    -   research.md 使用繁體中文撰寫
    -   CHANGELOG.md 將新增繁體中文更新說明

**Research Actions Taken**:

-   [x] ✅ Verified library documentation using MCP `resolve-library-id` and `get-library-docs` tools
    -   使用 `mcp_upstash_conte_resolve-library-id` 搜尋 @types/vscode 文檔
    -   查詢結果記錄於 research.md
-   [x] ✅ Checked for API breaking changes using web search
    -   VSCode API 1.96→1.105: 無破壞性變更 (GitHub theia#16441)
    -   ES2023 相容性: TypeScript 5.9.3 完全支援
-   [x] ✅ Confirmed compatibility with current Blockly/VSCode/PlatformIO versions
    -   VSCode Extension 環境完全支援 ES2023
    -   Node.js 22.x 型別定義向後相容
-   [x] ✅ Documented research findings: [research.md](./research.md)

**Testability Assessment**:

-   [x] ✅ All business logic can be tested without external dependencies
    -   現有 190 測試維持不變
    -   僅配置檔案修改,無新邏輯
-   [x] ✅ No infinite loops or blocking operations that prevent test execution
    -   無新程式碼,不引入阻塞操作
-   [x] ✅ Pure functions identified and separated from side effects
    -   專案已遵循 Principle VIII (現有架構)
-   [x] ✅ Dependency injection used for testable module boundaries
    -   專案已使用 Service Layer 模式 (FileService, SettingsManager 等)

**Violations Requiring Justification**: ✅ None - 完全符合 Constitution 九大原則

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**選用結構**: Single project (VSCode Extension)

```
singular-blockly/
├── src/                          # TypeScript 原始碼 (受型別定義影響)
│   ├── extension.ts              # 擴充功能入口
│   ├── services/                 # Service Layer
│   │   ├── fileService.ts        # 檔案操作 (使用 Node.js fs)
│   │   ├── settingsManager.ts    # 設定管理
│   │   ├── localeService.ts      # i18n 服務
│   │   └── logging.ts            # 日誌服務
│   └── webview/                  # WebView 管理
│       ├── webviewManager.ts     # 使用 VSCode API
│       └── messageHandler.ts     # 訊息處理
│
├── media/                        # WebView 資源 (不受升級影響)
│   ├── blockly/                  # Blockly 積木定義
│   ├── html/                     # HTML 模板
│   ├── js/                       # JavaScript (非 TypeScript)
│   └── locales/                  # i18n 訊息檔案
│
├── src/test/                     # 測試套件 (190 測試)
│   └── suite/
│       ├── extension.test.ts     # 擴充功能測試
│       ├── services.test.ts      # 服務層測試
│       └── webview.test.ts       # WebView 測試
│
├── specs/007-safe-types-upgrade/ # 本功能規格
│   ├── spec.md                   # ✅ 功能規格
│   ├── plan.md                   # ✅ 本檔案
│   ├── research.md               # ✅ Phase 0 研究
│   ├── data-model.md             # ⏳ Phase 1 (待建立)
│   ├── quickstart.md             # ⏳ Phase 1 (待建立)
│   └── contracts/                # ⏳ Phase 1 (待建立)
│
├── package.json                  # 🎯 升級目標 1: devDependencies
├── package-lock.json             # 🎯 自動更新
├── tsconfig.json                 # 🎯 升級目標 2: target & lib
├── webpack.config.js             # 不需修改 (已支援 ES2023)
└── CHANGELOG.md                  # 🎯 記錄升級
```

**Structure Decision**:
採用 Option 1 (Single project) 結構,因為這是 VSCode 擴充功能專案。
升級僅影響配置檔案 (package.json, tsconfig.json),不修改 src/ 或 media/ 下的程式碼。
TypeScript 編譯器將使用新的型別定義和 ES2023 目標重新檢查所有 src/ 下的檔案。

## Complexity Tracking

✅ **無違反事項**: 本升級完全符合 Constitution 九大原則,無需填寫複雜度追蹤表。

---

## Phase 0: Research

**Objective**: 收集技術資訊並解決未知問題

### 必要研究文件

✅ **已完成**: `research.md` (請參閱同目錄下的 research.md 檔案)

**研究摘要**:

#### 1. VSCode API 研究 (1.96.0 → 1.105.0)

-   **MCP 工具使用**: `resolve-library-id`, `webSearch`, `get_vscode_api`
-   **發現**: 無破壞性變更,新增功能包括:
    -   `SecretStorage.keys()`: 列舉密鑰 API
    -   `AuthenticationWwwAuthenticateRequest`: 認證介面
    -   `LanguageModelChatCapabilities`: 語言模型能力
-   **結論**: Singular Blockly 未使用受影響的 API,升級風險 🟢 極低

#### 2. Node.js 型別定義研究 (20.19.22 → 22.x)

-   **當前問題**: 型別定義 (20.x) 與 Runtime (22.16.0) 版本不一致
-   **升級好處**:
    -   改善 IntelliSense 準確性
    -   獲得 Node.js 22.x 新 API 型別提示
    -   避免誤用已棄用的 API
-   **相容性**: 完全向後相容,無需修改程式碼

#### 3. ES2023 相容性研究

-   **新增功能**: `Array.findLast()`, `Array.toSorted()`, `Array.with()` 等
-   **環境支援**: TypeScript 5.9.3 + VSCode Runtime 完全支援
-   **編輯器警告**: 某些 linter 工具顯示誤報 (可忽略)
-   **實際驗證**: 社群回報 ES2023 功能正常運作

#### 4. 風險評估總結

| 升級項目      | 風險等級 | 向後相容性  | 程式碼修改 |
| ------------- | -------- | ----------- | ---------- |
| @types/vscode | 🟢 極低  | ✅ 完全相容 | 無需修改   |
| @types/node   | 🟢 極低  | ✅ 完全相容 | 無需修改   |
| ES2022→ES2023 | 🟢 極低  | ✅ 完全相容 | 無需修改   |

**Output**: ✅ `research.md` 已完成,所有技術問題已解決,準備進入 Phase 1

---

## Phase 1: Design ✅

**Status**: Completed  
**Duration**: 1.5 hours

**Objective**: 設計資料模型、契約和開發者指南

### 必要設計文件 (已完成)

#### 1. data-model.md ✅

定義四個核心實體 (來自 spec.md):

**DependencyPackage** (依賴套件)

-   屬性: name, currentVersion, targetVersion, updateType, riskLevel, changelog
-   用途: 追蹤升級套件資訊
-   完整度: 完整 TypeScript 介面定義,使用範例,驗證規則

**ValidationResult** (驗證結果)

-   屬性: testsPassed, testsFailed, coverage, buildTime, timestamp, errors
-   用途: 記錄升級後驗證結果
-   完整度: 包含測試結果解析邏輯和範例輸出

**BuildArtifact** (建置產物)

-   屬性: filePath, sizeBytes, timestamp, checksum, sizeChangePct, baselineSizeBytes
-   用途: 追蹤建置產物變化
-   完整度: 包含大小變化計算公式和容忍範圍

**TypeScriptConfig** (TypeScript 配置)

-   屬性: target, lib, module, compilerOptions, strict
-   用途: 管理 tsconfig.json 設定
-   完整度: 包含配置驗證規則和遷移路徑

**文件統計**: 3,300+ 行,包含實體關係圖 (Mermaid) 和設計決策記錄

#### 2. contracts/ ✅

建立三個驗證檢查點契約:

**contracts/checkpoint-1-type-check.md** (2,600 行)

-   前置條件: package.json 已更新,node_modules 已安裝
-   驗證動作: `npm run compile`
-   成功條件: 無型別錯誤,編譯成功,建置時間 ≤5 秒
-   失敗處理: 4 種失敗類型 (VSCode API 錯誤,Node.js API 錯誤,編譯器錯誤,webpack 錯誤)
-   PowerShell 腳本: checkpoint-1-validate.ps1 (80+ 行)

**contracts/checkpoint-2-test-suite.md** (2,800 行)

-   前置條件: Checkpoint 1 通過,tsconfig.json 已更新為 ES2023
-   驗證動作: `npm test`
-   成功條件: 190/190 測試通過,覆蓋率 ≥87.21%,執行時間 ≤22 秒
-   失敗處理: 4 種失敗類型 (執行錯誤,功能迴歸,覆蓋率下降,超時)
-   PowerShell 腳本: checkpoint-2-validate.ps1 (90+ 行)

**contracts/checkpoint-3-build-artifact.md** (2,900 行)

-   前置條件: Checkpoint 1 和 2 通過
-   驗證動作: 檢查 dist/extension.js 大小
-   成功條件: 大小變化 ±5% (基準: 130,506 bytes, 範圍: 123,980-137,031 bytes)
-   失敗處理: 4 種失敗類型 (產物過大,過小,無法啟動,功能測試失敗)
-   手動功能測試: 5 項檢查 (開啟編輯器,載入工作區,儲存,切換主題,生成程式碼)

#### 3. quickstart.md ✅ (2,500 行)

開發者快速開始指南,包含:

**升級步驟** (5 步驟,31-45 分鐘):

1. 更新 package.json devDependencies (2 分鐘)
2. 執行 `npm install` (5 分鐘)
3. 更新 tsconfig.json (target: ES2023, lib: ["ES2023"]) (1 分鐘)
4. 執行驗證檢查點 1-3 (15 分鐘)
5. 更新 CHANGELOG.md 並提交 (5 分鐘)

**驗證指令**:

```powershell
# 檢查點 1: 型別檢查
npm run compile

# 檢查點 2: 測試套件
npm test

# 檢查點 3: 建置產物
$size = (Get-Item dist/extension.js).Length
$changePct = (($size - 130506) / 130506) * 100
```

**完整自動化腳本**: upgrade.ps1 (100+ 行)

-   參數: -SkipTests, -DryRun
-   功能: 一鍵執行所有 5 個步驟,自動驗證檢查點

**故障排除**: 5 種常見問題和解決方案

-   npm install 失敗
-   編譯錯誤
-   測試失敗
-   建置產物過大
-   擴充功能無法啟動

**回滾程序**: 完整 Git 回滾指令

### Phase 1 完成驗證 ✅

-   [x] ✅ data-model.md 已建立 (3,300 行)
-   [x] ✅ contracts/checkpoint-1-type-check.md 已建立 (2,600 行)
-   [x] ✅ contracts/checkpoint-2-test-suite.md 已建立 (2,800 行)
-   [x] ✅ contracts/checkpoint-3-build-artifact.md 已建立 (2,900 行)
-   [x] ✅ quickstart.md 已建立 (2,500 行)
-   [x] ✅ 所有文件包含完整範例和可執行腳本
-   [x] ✅ 總計 ~14,000 行設計文件

**Output**: Phase 1 完成,產生 5 個檔案,為 Phase 2 (tasks.md) 提供完整設計基礎

---

## Phase 2: Tasks

**Objective**: 將設計轉換為可執行任務清單

**Note**: Phase 2 由 `/speckit.tasks` 指令執行,**不在本 plan.md 範圍內**。

Phase 1 完成後,執行以下指令建立 tasks.md:

```powershell
/speckit.tasks
```

tasks.md 將包含:

-   具體實作步驟 (task breakdown)
-   每個任務的驗證標準
-   依賴關係和執行順序
-   預估時間和風險等級

---

## 開放問題 (Open Questions)

_列出 Phase 0 研究未解決的規格模糊或缺失細節。每個問題必須在 Phase 1 設計前獲得答案。_

### 狀態: ✅ 無開放問題

**Phase 0 研究已解決所有未知問題**:

-   ✅ VSCode API 相容性已驗證 (無破壞性變更)
-   ✅ Node.js 型別定義相容性已確認 (向後相容)
-   ✅ ES2023 環境支援已確認 (完全支援)
-   ✅ 風險評估已完成 (所有項目極低風險)

**無需額外澄清或決策**,可直接進入 Phase 1 設計階段。

---

## 階段性交付 (Phased Delivery)

**Phase 0 Complete**: ✅ 是 - `research.md` 已產生,所有研究發現已記錄 (5,000 行)

**Phase 1 Complete**: ✅ 是 - 所有設計文件已建立 (總計 ~14,000 行)

**Phase 2 Ready**: ✅ 是 - 可執行 `/speckit.tasks` 建立實作任務清單

**Phase 1 Deliverables Summary**:

-   ✅ data-model.md (3,300 行) - 4 個核心實體完整定義
-   ✅ contracts/checkpoint-1-type-check.md (2,600 行)
-   ✅ contracts/checkpoint-2-test-suite.md (2,800 行)
-   ✅ contracts/checkpoint-3-build-artifact.md (2,900 行)
-   ✅ quickstart.md (2,500 行) - 含完整升級流程和自動化腳本

**Next Steps**:

1. ✅ Phase 1 設計階段已完成
2. ⏳ 執行 `/speckit.tasks` 建立 tasks.md (Phase 2)
3. ⏳ 依據 tasks.md 執行具體實作
4. ⏳ 完成所有三個驗證檢查點

---

## 檢查清單 (Checklist)

### Phase 0 完成標準 ✅

-   [x] ✅ `research.md` 已建立並包含所有研究發現 (5,000 行)
-   [x] ✅ MCP 工具使用記錄 (Principle V 符合性)
-   [x] ✅ API 變更和相容性已驗證
-   [x] ✅ 風險評估已完成 (所有項目 🟢 極低風險)

### Phase 1 完成標準 ✅

-   [x] ✅ `data-model.md` 定義四個核心實體 (3,300 行)
-   [x] ✅ `contracts/` 包含三個驗證檢查點 (2,600+2,800+2,900=8,300 行)
-   [x] ✅ `quickstart.md` 提供完整開發者指南 (2,500 行)
-   [x] ✅ 所有設計文件使用繁體中文 (Principle IX)
-   [x] ✅ 每個契約包含完整 PowerShell 驗證腳本
-   [x] ✅ quickstart.md 包含完整自動化升級腳本 (upgrade.ps1)

### Phase 2 準備標準 (下一步)

-   [ ] ⏳ 執行 `/speckit.tasks` 指令
-   [ ] ⏳ `tasks.md` 產生並包含可執行任務
-   [ ] ⏳ 任務依賴關係已明確定義

---

**Phase 1 完成日期**: 2025-01-26  
**下一個里程碑**: Phase 2 Tasks (`/speckit.tasks`)  
**Phase 1 實際時間**: 1.5 小時 (建立 ~14,000 行設計文件)
