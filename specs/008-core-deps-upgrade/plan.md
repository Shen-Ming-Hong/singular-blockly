# Implementation Plan: Phase 1 核心依賴升級

**Branch**: `008-core-deps-upgrade` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-core-deps-upgrade/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

<!--
  LANGUAGE REQUIREMENT (Principle IX):
  This implementation plan MUST be written in Traditional Chinese (繁體中文, zh-TW).
  All planning content, technical context, and documentation should be in Traditional
  Chinese to align with the project's primary audience and facilitate team collaboration.

  Code snippets and technical references MAY remain in English for developer clarity.
-->

## Summary

本實作計畫旨在將 Singular Blockly VSCode Extension 的核心依賴套件進行主版本升級,包括 Blockly (11.2.2 → 12.3.1) 和 @blockly/theme-modern (6.0.12 → 7.0.1)。升級過程將採用研究驅動的方法,使用 MCP 工具獲取最新文件,識別並處理 API 破壞性變更,確保所有現有功能(190 個測試、15 種語言、5 種板卡、主題系統)完全相容,並維持 87.21% 的測試覆蓋率。

**技術策略**: 階段性升級 → API 遷移 → 完整測試驗證 → 文件更新

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 22.16.0 (VS Code Extension Runtime)  
**Primary Dependencies**:

-   Blockly 11.2.2 → 12.3.1 (核心視覺化程式設計庫)
-   @blockly/theme-modern 6.0.12 → 7.0.1 (主題系統)
-   VS Code API 1.96.0+ (擴充功能 API)
-   webpack 5.102.1 (打包工具)

**Storage**: 檔案系統 (workspace state: blockly/main.json, board config: platformio.ini)  
**Testing**: Mocha + @vscode/test-electron (目前 190 個測試, 87.21% 覆蓋率)  
**Target Platform**: VS Code Extension Host (跨平台: Windows/macOS/Linux)  
**Project Type**: Single VSCode Extension Project (Extension Host + WebView)  
**Performance Goals**:

-   測試執行時間 <3 秒
-   編譯時間 ±10% (基準: 4.6 秒)
-   Bundle 大小 ±5% (基準: 130,506 bytes)
-   Blockly 編輯器載入時間 <2 秒

**Constraints**:

-   必須保持向後相容 (現有工作區檔案可載入)
-   所有 190 個測試必須通過
-   測試覆蓋率不低於 87.21%
-   無 TypeScript 編譯錯誤
-   無 ESLint 錯誤

**Scale/Scope**:

-   15 種語言支援 (i18n)
-   5 種開發板配置 (Arduino Uno/Nano/Mega, ESP32, Super Mini)
-   2 種主題 (淺色/深色)
-   ~3,818 行程式碼 (需維護測試覆蓋率)

## Constitution Check

**Version**: 1.3.0

每個原則的 ✅ 表示計畫符合該原則,☑️ 需要在 Phase 0 研究或 Phase 1 設計中補充內容,⚠️ 表示需要額外注意。

### I. Correctness by Design

-   ✅ **核心品質**: 升級計畫遵循類型安全原則,保留所有 TypeScript 型別檢查
-   ✅ **最小化複雜度**: 採用階段性升級策略,逐步處理 API 變更
-   ☑️ **研究行動**: Phase 0 將使用 MCP 工具驗證 Blockly 12.x API 變更 (FR-011, TR-001, TR-002)
-   ✅ **可測試性**: 所有 API 變更將通過現有 190 個測試驗證,不引入不可測試的程式碼路徑

### II. Design Patterns

-   ✅ **模組化架構**: 升級影響範圍限定於 Extension Host (extension.ts, webviewManager.ts) 和 WebView (blocklyEdit.js, blocks, generators)
-   ✅ **依賴注入**: 現有 FileService, SettingsManager 等服務層不受影響
-   ✅ **介面優先**: Blockly API 變更將透過 TypeScript 介面定義確保相容性
-   ✅ **可測試性**: 所有變更將維持純函式、可模擬的結構

### III. Testing & Coverage

-   ✅ **100% 覆蓋率目標**: 升級後測試覆蓋率不低於 87.21% (目標提升至 90%+)
-   ✅ **避免不可測試程式碼**: 不引入無限迴圈、阻塞操作或長時間等待
-   ✅ **測試優先**: Phase 2 將針對破壞性變更新增測試案例,確認升級前後行為一致
-   ☑️ **研究行動**: Phase 0 將檢視 Blockly 12.x 測試最佳實踐,確保測試策略符合新版本

### IV. Documentation

-   ✅ **繁體中文文件**: 所有規格、計畫、研究文件使用繁體中文撰寫
-   ✅ **程式碼註解**: 升級相關的程式碼變更將添加清晰的註解說明原因
-   ☑️ **研究文件**: Phase 0 將產生 research.md 記錄 API 變更調查結果
-   ☑️ **快速開始指南**: Phase 1 將產生 quickstart.md 記錄升級開發環境設定

### V. Research-Driven Development (MCP-Powered)

-   ✅ **MCP 工具使用**: FR-011, TR-001, TR-002 明確要求使用 MCP 工具
-   ☑️ **必要研究**: Phase 0 將執行:
    1. `resolve-library-id` 查詢 Blockly 12.3.1 和 @blockly/theme-modern 7.0.1
    2. `get-library-docs` 獲取最新 API 文件
    3. `webSearch` 搜尋破壞性變更和遷移指南
-   ✅ **替代方案**: 如 webSearch 不可用,將使用 fetch_webpage 或 github_repo
-   ✅ **決策記錄**: 研究結果將記錄於 research.md,包含決策理由和替代方案

### VI. Version Control

-   ✅ **分支策略**: 已建立 `008-core-deps-upgrade` 功能分支
-   ✅ **提交訊息**: 將使用 Conventional Commits 格式 (feat/fix/test/docs)
-   ✅ **Git 工作流程**: 遵循 feature branch → PR → review → merge 流程
-   ✅ **清晰歷史**: 每個邏輯變更獨立提交,易於追蹤和回溯

### VII. Refactoring Guidelines

-   ✅ **保持綠燈**: 每次重構確保所有測試通過
-   ✅ **單一變更原則**: API 升級與功能新增分離,避免混合提交
-   ✅ **性能基準**: 編譯時間 ±10%, bundle 大小 ±5%, 測試執行 <3 秒
-   ✅ **向後相容**: 現有工作區檔案必須在升級後正常載入

### VIII. Code Structure

-   ✅ **純函式優先**: 升級不改變現有架構,保持 FileService, LocaleService 等純函式設計
-   ✅ **模組化**: 影響範圍清晰 (Extension Host API 呼叫 + WebView Blockly 初始化)
-   ✅ **依賴管理**: package.json, webpack.config.js 變更將獨立驗證
-   ✅ **可維護性**: 升級後程式碼結構保持清晰,易於未來再次升級

### IX. Traditional Chinese Documentation

-   ✅ **規格文件**: spec.md 使用繁體中文撰寫
-   ✅ **實作計畫**: 本 plan.md 使用繁體中文撰寫
-   ☑️ **研究文件**: Phase 0 research.md 將使用繁體中文
-   ☑️ **設計文件**: Phase 1 data-model.md, quickstart.md 將使用繁體中文
-   ✅ **程式碼註解**: 關鍵變更將添加繁體中文註解解釋升級原因

**總結**: 計畫符合所有 9 項憲章原則。Phase 0/1 將補充研究和設計文件,確保完整符合研究驅動和文件完整性要求。

**Research Actions Taken**:

-   [ ] Verified library documentation using MCP `resolve-library-id` and `get-library-docs` tools
-   [ ] Checked for API breaking changes using web search
-   [ ] Confirmed compatibility with current Blockly/VSCode/PlatformIO versions
-   [ ] Documented research findings: [LINK TO RESEARCH.MD OR INLINE NOTES]

**Testability Assessment**:

-   [ ] All business logic can be tested without external dependencies
-   [ ] No infinite loops or blocking operations that prevent test execution
-   [ ] Pure functions identified and separated from side effects
-   [ ] Dependency injection used for testable module boundaries

**Violations Requiring Justification**: [None / List any unavoidable violations with rationale]

## Project Structure

### Documentation Tree

```
specs/008-core-deps-upgrade/
├── spec.md                    # ✅ 功能規格 (完成)
├── plan.md                    # 🔄 本實作計畫 (進行中)
├── research.md                # ⏳ Phase 0: 研究文件 (待產生)
├── data-model.md              # ⏳ Phase 1: 資料模型 (待產生)
├── quickstart.md              # ⏳ Phase 1: 快速開始指南 (待產生)
├── tasks.md                   # ⏳ Phase 2: 任務分解 (待產生)
├── MANUAL-TESTING-GUIDE.md    # ⏳ Phase 2: 手動測試指南 (待產生)
├── checklists/
│   ├── requirements.md        # ✅ 需求驗證清單 (完成)
│   ├── phase0.md              # ⏳ Phase 0 完成清單 (待產生)
│   ├── phase1.md              # ⏳ Phase 1 完成清單 (待產生)
│   └── phase2.md              # ⏳ Phase 2 完成清單 (待產生)
└── contracts/                 # ⏳ Phase 1: API 合約 (待產生,如適用)
```

### Source Code Structure

```
專案根目錄: E:\singular-blockly\

核心升級影響範圍:
├── package.json                      # 🔄 依賴版本更新
├── package-lock.json                 # 🔄 鎖定檔更新
├── webpack.config.js                 # ⚠️ 可能需調整 (如 Blockly 12 改變打包方式)
├── src/
│   ├── extension.ts                  # ⚠️ Blockly API 呼叫點檢查
│   └── webview/
│       ├── webviewManager.ts         # ⚠️ Blockly 初始化邏輯
│       └── messageHandler.ts         # ⚠️ 工作區狀態處理
├── media/
│   ├── html/
│   │   └── blocklyEdit.html          # ⚠️ Blockly 腳本載入檢查
│   ├── js/
│   │   └── blocklyEdit.js            # 🔥 主要 Blockly API 使用點
│   ├── blockly/
│   │   ├── blocks/*.js               # ⚠️ 積木定義 (API 變更檢查)
│   │   ├── generators/arduino/*.js   # ⚠️ 程式碼產生器 (API 變更檢查)
│   │   └── themes/
│   │       ├── singularBlocklyDark.js    # 🔥 主題系統升級
│   │       └── singularBlocklyLight.js   # 🔥 主題系統升級
│   └── locales/
│       └── */messages.js             # ⚠️ 如有新 Blockly 訊息需翻譯
└── src/test/
    └── **/*.test.ts                  # ✅ 所有測試必須通過 (190 個)

圖例:
✅ 已完成
🔄 進行中
⏳ 待處理
⚠️ 需檢查/可能需修改
🔥 主要變更點
```

**關鍵路徑分析**:

1. **Extension Host API** (低風險): `src/extension.ts`, `src/webview/webviewManager.ts` - 主要是版本宣告和初始化邏輯
2. **WebView Blockly Core** (高風險): `media/js/blocklyEdit.js` - Blockly workspace 初始化、事件處理、序列化 API
3. **Block Definitions** (中風險): `media/blockly/blocks/*.js` - 積木定義 API 可能有變更
4. **Code Generators** (中風險): `media/blockly/generators/arduino/*.js` - 程式碼產生 API 可能有變更
5. **Theme System** (高風險): `media/blockly/themes/*.js` - @blockly/theme-modern 7.x 架構變更
6. **Build System** (中風險): `webpack.config.js` - 打包配置可能需調整

**Phase 0 研究重點**:

-   Blockly 12.x 工作區初始化 API 變更 (Blockly.inject, workspace options)
-   主題系統架構變更 (@blockly/theme-modern 7.x 新 API)
-   積木和產生器 API 兼容性 (Blockly.Blocks, javascriptGenerator → arduinoGenerator)
-   序列化和反序列化 API (Blockly.serialization)

### Known Constraints

-   **向後相容**: 現有 `blockly/main.json` 工作區檔案必須能在升級後載入
-   **測試覆蓋率**: 不得低於 87.21% (理想目標 90%+)
-   **性能基準**:
    -   編譯時間: 4.6s ± 10% (4.14s - 5.06s)
    -   Bundle 大小: 130,506 bytes ± 5% (124,000 - 137,000 bytes)
    -   測試執行: <3 秒
-   **多語言支援**: 15 種語言翻譯必須完整 (如 Blockly 12 有新訊息)
-   **多板卡支援**: 5 種開發板配置必須正常運作

## Complexity Tracking

**Purpose**: 記錄所有違反憲章原則的複雜性決策,確保有充分理由和緩解措施。

| Violation    | Principle | Justification                                   | Mitigation | Status |
| ------------ | --------- | ----------------------------------------------- | ---------- | ------ |
| (無預期違規) | -         | 本升級計畫設計為完全符合憲章原則,無需複雜性豁免 | -          | N/A    |

**注意事項**: 如在實作過程中發現必須違反憲章原則的情況 (例如:無法避免的阻塞操作、暫時的測試覆蓋率下降),必須在此記錄並提出緩解方案。

**預防性說明**:

-   **測試覆蓋率**: 如升級導致暫時無法達到 87.21%,將在 Phase 2 補充測試案例
-   **性能回歸**: 如編譯時間或 bundle 大小超出 ±10%/±5% 範圍,將分析原因並優化
-   **破壞性變更**: 所有 Blockly 12.x API 變更將透過適配層保持向後相容

---

## Phase 0: Research

**Objective**: 使用 MCP 工具深入調查 Blockly 12.x 和 @blockly/theme-modern 7.x 的 API 變更,產生完整的研究文件 (research.md),為 Phase 1 設計提供充分資訊。

### Research Tasks

#### R1: Blockly 12.x API 文件查詢

**Tool**: `resolve-library-id` + `get-library-docs`
**Goal**: 獲取 Blockly 12.3.1 完整 API 文件,識別破壞性變更
**Focus Areas**:

-   Workspace 初始化 API (Blockly.inject, WorkspaceOptions)
-   Block 定義 API (Blockly.Blocks)
-   Code Generator API (javascriptGenerator → arduinoGenerator)
-   Serialization API (Blockly.serialization)
-   Theme API (Blockly.Theme, setTheme)
-   Event System (Blockly.Events)

**Deliverable**: `research.md` 第一節 - Blockly 12.x API 變更清單

#### R2: @blockly/theme-modern 7.x 主題架構調查

**Tool**: `resolve-library-id` + `get-library-docs`
**Goal**: 了解主題套件從 6.x → 7.x 的架構變更
**Focus Areas**:

-   Theme 匯入方式變更
-   Theme 物件結構變更
-   自訂主題定義方式
-   與 Blockly 12.x 的整合方式

**Deliverable**: `research.md` 第二節 - 主題系統升級策略

#### R3: 破壞性變更和遷移指南

**Tool**: `webSearch` (或 fetch_webpage 作為備案)
**Goal**: 搜尋 Blockly 官方遷移指南、社群討論、已知問題
**Search Terms**:

-   "Blockly 12 migration guide"
-   "Blockly 11 to 12 breaking changes"
-   "@blockly/theme-modern 7 upgrade"
-   "Blockly 12 workspace serialization changes"

**Deliverable**: `research.md` 第三節 - 社群最佳實踐和已知問題

#### R4: TypeScript 類型定義檢查

**Tool**: `grep_search` (本地搜尋 node_modules/@types/blockly)
**Goal**: 確認 @types/blockly 是否需要更新,型別定義是否完整
**Deliverable**: `research.md` 第四節 - TypeScript 整合策略

### Phase 0 Completion Criteria

-   ✅ `research.md` 完成,包含所有 4 個研究任務結果
-   ✅ 識別所有需要修改的檔案清單 (依據 API 變更)
-   ✅ 記錄所有決策理由和替代方案
-   ✅ Phase 0 完成清單 (`checklists/phase0.md`) 100% 通過

**Estimated Duration**: 2-3 小時

---

## Phase 1: Design

**Objective**: 基於 Phase 0 研究結果,設計升級策略、資料模型和 API 合約,產生 Phase 1 設計文件。

### Design Tasks

#### D1: 資料模型設計 (data-model.md)

**Content**:

-   **Blockly Package Entity**: 版本、匯入方式、初始化參數
-   **Theme Package Entity**: 版本、匯入方式、主題物件結構
-   **Workspace State Entity**: 序列化格式、向後相容性策略
-   **Board Configuration Entity**: PlatformIO 設定與 Blockly 工作區的關聯

**Purpose**: 明確定義升級過程中涉及的實體及其關係,確保狀態管理一致性

#### D2: API 合約設計 (contracts/)

**Content** (如適用):

-   **Blockly Initialization Contract**: Extension Host 與 WebView 之間的初始化訊息格式
-   **Theme Switching Contract**: 主題切換的 API 介面
-   **Workspace Serialization Contract**: 工作區儲存和載入的格式約定

**Purpose**: 確保 Extension Host 和 WebView 之間的通訊在升級後保持穩定

#### D3: 快速開始指南 (quickstart.md)

**Content**:

-   開發環境設定 (Node.js, VS Code, 依賴安裝)
-   升級後的建置流程 (npm run compile, npm run watch)
-   測試執行方式 (npm test)
-   手動測試 Blockly 編輯器的步驟
-   常見問題排解 (編譯錯誤、主題載入失敗等)

**Purpose**: 讓其他開發者或未來的自己能快速理解升級後的開發流程

#### D4: 更新 AI Agent 上下文 (.github/copilot-instructions.md)

**Content**:

-   更新依賴版本資訊 (Blockly 12.3.1, @blockly/theme-modern 7.0.1)
-   添加升級相關的開發慣例 (如 Blockly API 呼叫模式)
-   更新關鍵檔案路徑說明 (如主題系統新架構)

**Purpose**: 確保 AI Agent 在後續協作中了解最新的專案狀態

### Phase 1 Completion Criteria

-   ✅ `data-model.md` 完成,所有實體清晰定義
-   ✅ `contracts/` 目錄建立 (如適用),API 合約文件化
-   ✅ `quickstart.md` 完成,包含完整開發流程
-   ✅ `.github/copilot-instructions.md` 更新完成
-   ✅ Phase 1 完成清單 (`checklists/phase1.md`) 100% 通過

**Estimated Duration**: 1-2 小時

---

## Phase 2: Task Breakdown

**Objective**: 將升級工作分解為可執行的任務清單 (tasks.md),每個任務獨立、可測試、可追蹤。

### Task Planning Approach

**Task Structure** (遵循 `.specify/templates/tasks.md`):

-   每個任務包含: ID, 標題, 描述, 驗收標準, 估時, 依賴關係
-   任務狀態: ⏳ TODO, 🔄 IN PROGRESS, ✅ DONE, ⚠️ BLOCKED
-   優先級: P0 (阻塞), P1 (高), P2 (中), P3 (低)

**Estimated Task Categories**:

1. **依賴更新** (3-5 個任務)

    - 更新 package.json 版本
    - 執行 npm install 並解決衝突
    - 驗證 TypeScript 編譯無錯誤
    - 驗證 webpack 打包成功
    - 執行測試確認基本功能

2. **Extension Host 調整** (2-3 個任務)

    - 更新 extension.ts 中的 Blockly API 呼叫
    - 更新 webviewManager.ts 初始化邏輯
    - 更新 messageHandler.ts 工作區狀態處理

3. **WebView Core 升級** (5-7 個任務)

    - 更新 blocklyEdit.html 腳本載入
    - 更新 blocklyEdit.js Workspace 初始化
    - 更新 Blockly.inject 參數
    - 更新序列化/反序列化邏輯
    - 更新事件處理器 (Blockly.Events)

4. **主題系統升級** (3-4 個任務)

    - 更新 @blockly/theme-modern 匯入方式
    - 重構 singularBlocklyDark.js
    - 重構 singularBlocklyLight.js
    - 更新主題切換邏輯

5. **積木和產生器檢查** (5-8 個任務)

    - 掃描所有 blocks/\*.js 檔案,識別 API 變更
    - 更新受影響的積木定義
    - 掃描所有 generators/arduino/\*.js 檔案
    - 更新受影響的程式碼產生器
    - 驗證所有積木在工作區中正常顯示

6. **測試和驗證** (4-6 個任務)

    - 執行完整測試套件 (190 個測試)
    - 補充新測試案例 (針對 API 變更)
    - 測試覆蓋率驗證 (≥87.21%)
    - 性能基準測試 (編譯時間, bundle 大小)
    - 手動測試 (5 種板卡, 2 種主題, 多種語言)

7. **文件更新** (2-3 個任務)
    - 更新 README.md (依賴版本資訊)
    - 更新 CHANGELOG.md
    - 更新 .github/copilot-instructions.md

**Total Estimated Tasks**: 24-36 個任務
**Estimated Implementation Duration**: 6-10 小時 (依 API 變更複雜度)

### Phase 2 Deliverables

-   ✅ `tasks.md` 完成,所有任務清晰定義
-   ✅ `MANUAL-TESTING-GUIDE.md` 完成,包含完整測試場景
-   ✅ Phase 2 完成清單 (`checklists/phase2.md`) 建立

**Note**: Phase 2 將由 `/speckit.tasks` 指令執行,自動產生任務清單

---

## Next Steps

1. ✅ **Complete this plan.md**: 確認所有章節填寫完整
2. ⏳ **Execute Phase 0**: 執行研究任務,使用 MCP 工具查詢 Blockly 12.x 文件
3. ⏳ **Review research.md**: 檢視研究結果,確認無遺漏
4. ⏳ **Execute Phase 1**: 執行設計任務,產生 data-model.md, quickstart.md 等
5. ⏳ **Execute Phase 2**: 執行 `/speckit.tasks` 產生任務清單
6. ⏳ **Begin Implementation**: 依照 tasks.md 逐項執行升級任務

**Immediate Action**: 開始執行 Phase 0 研究任務

---

## Appendix

### Blockly 11.x → 12.x 已知變更 (初步)

_Note: 此列表將在 Phase 0 完成後更新為完整清單_

-   ⚠️ **Workspace 初始化**: `Blockly.inject()` 參數可能有變更
-   ⚠️ **主題 API**: Theme 物件結構和註冊方式可能不同
-   ⚠️ **序列化 API**: `Blockly.serialization` 可能有新方法
-   ⚠️ **事件系統**: Event 類別和監聽器註冊可能有變更
-   ⚠️ **TypeScript 型別**: @types/blockly 可能需要更新

### Performance Baselines (Current)

-   **編譯時間**: ~4.6 秒 (target: ±10%)
-   **Bundle 大小**: 130,506 bytes (target: ±5%)
-   **測試執行**: <3 秒 (190 tests)
-   **測試覆蓋率**: 87.21% (target: maintain or improve)

### Risk Mitigation

-   **高風險**: 主題系統架構變更 → 提前測試主題載入,準備回退方案
-   **中風險**: Blockly API 破壞性變更 → 使用適配層保持向後相容
-   **低風險**: 依賴衝突 → 使用 `npm install --legacy-peer-deps` 解決

---

**Plan Status**: ✅ 計畫完成,Phase 0 準備就緒  
**Last Updated**: 2025-01-21
