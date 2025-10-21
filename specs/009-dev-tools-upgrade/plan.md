# Implementation Plan: 開發工具依賴升級

**Branch**: `009-dev-tools-upgrade` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-dev-tools-upgrade/spec.md`

## Summary

本功能旨在升級三個開發工具依賴,確保專案使用最新穩定版本並保持配置一致性:

1. **@typescript-eslint/eslint-plugin 8.46.1 → 8.46.2** (P1): PATCH 版本升級,包含 bug 修復和穩定性改善
2. **ESLint ecmaVersion 2022 → 2023** (P1): 配置更新以對齊 TypeScript ES2023 編譯目標
3. **webpack-cli 5.1.4 → 6.0.1** (P2): 主版本升級評估,需完整研究破壞性變更和相容性

**技術方法**: 採用漸進式升級策略,P1 項目為低風險獨立升級,P2 項目需遵循 Phase 0 研究 → Phase 1 設計 → Phase 2 實作流程。所有升級必須通過完整測試套件(190 tests)和效能基準驗證(編譯時間 ±10%、bundle 大小 ±5%)。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 22.16.0+, ECMAScript 2023  
**Primary Dependencies**:

-   @typescript-eslint/eslint-plugin 8.46.1 → 8.46.2
-   @typescript-eslint/parser 8.46.1 (peer dependency)
-   eslint 9.38.0
-   webpack 5.102.1
-   webpack-cli 5.1.4 → 6.0.1

**Storage**: 檔案系統操作(package.json, eslint.config.mjs)  
**Testing**:

-   Mocha/Sinon 測試框架(190 個單元測試)
-   手動測試(VS Code Extension Development Host)

**Target Platform**: VS Code Extension Host (Node.js 22.16.0 環境)  
**Project Type**: Single project (VSCode Extension)  
**Performance Goals**:

-   編譯時間保持在 4 秒 ±10% (3.6s - 4.4s)
-   Bundle 大小保持在 130KB ±5% (124KB - 137KB)
-   測試執行時間 <3 秒

**Constraints**:

-   必須維持 189/190 測試通過率
-   不得破壞現有 Blockly 編輯器功能
-   webpack-cli 6.x 必須與 webpack 5.102.1 相容
-   遵循專案既定升級流程(Phase 0 → Phase 1 → Phase 2)

**Scale/Scope**:

-   3 個依賴升級項目
-   2 個配置檔案修改(package.json, eslint.config.mjs)
-   190 個測試案例驗證
-   10 項手動測試場景(Blockly 編輯器功能)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Review each core principle from `.specify/memory/constitution.md`:

-   [x] **Simplicity and Maintainability**: 設計避免不必要複雜性,三個升級項目明確獨立,配置修改清晰直觀
-   [x] **Modularity and Extensibility**: P1 和 P2 項目可獨立執行,不影響現有模組架構,webpack-cli 升級可獨立評估和回滾
-   [x] **Avoid Over-Development**: 僅升級有明確理由的依賴(bug 修復、配置對齊、版本追蹤),不追求不必要的最新版本
-   [x] **Flexibility and Adaptability**: 升級不改變現有架構,保持 service 層模式,支援未來依賴升級而無需重構
-   [x] **Research-Driven Development (MCP-Powered)**: 將使用 MCP 工具驗證 webpack-cli 6.x 相容性、@typescript-eslint 變更日誌、ESLint ES2023 支援
-   [x] **Structured Logging**: 升級過程將使用 logging service 記錄關鍵步驟(不涉及新程式碼,僅依賴更新)
-   [x] **Comprehensive Test Coverage**: 現有 190 個測試覆蓋所有業務邏輯,升級後必須保持 189/190 通過率
-   [x] **Pure Functions and Modular Architecture**: 升級不涉及程式碼邏輯修改,保持現有純函式架構和模組邊界
-   [x] **Traditional Chinese Documentation**: 本計畫、研究文件、任務清單均使用繁體中文撰寫

**Research Actions Taken**:

-   [x] 已完成初步依賴版本調查(npm outdated 執行)
-   [x] 已識別 @typescript-eslint/eslint-plugin 8.46.2 為 PATCH 升級(低風險)
-   [x] 已識別 webpack-cli 6.0.1 為 MAJOR 升級(需研究)
-   [ ] 待執行: 使用 MCP webSearch 查詢 webpack-cli 6.x 破壞性變更
-   [ ] 待執行: 使用 MCP webSearch 驗證 webpack-cli 6.x 與 webpack 5.x 相容性
-   [ ] 待執行: 查詢 @typescript-eslint/eslint-plugin 8.46.2 changelog
-   [ ] 待執行: 驗證 ESLint ecmaVersion 2023 對 ES2023 語法支援(Array.findLast, toSorted)

**Testability Assessment**:

-   [x] 所有業務邏輯已有獨立測試(190 tests)
-   [x] 無新增程式碼,因此無新增無限迴圈或阻塞操作風險
-   [x] 依賴升級透過測試套件自動驗證相容性
-   [x] 手動測試清單已在規格中明確定義(10 項 Blockly 編輯器功能)

**Violations Requiring Justification**: 無 - 所有憲章原則均符合

## Project Structure

### Documentation (this feature)

```
specs/009-dev-tools-upgrade/
├── spec.md              # 功能規格(已完成)
├── plan.md              # 本檔案 - 實作計畫
├── research.md          # Phase 0 輸出 - 技術研究文件
├── data-model.md        # Phase 1 輸出 - 資料模型(依賴版本、配置結構)
├── quickstart.md        # Phase 1 輸出 - 開發者快速開始指南
├── checklists/          # 檢查清單目錄
│   └── requirements.md  # 規格品質檢查清單(已完成)
└── tasks.md             # Phase 2 輸出(由 /speckit.tasks 產生 - 非本指令)
```

### Source Code (repository root)

本功能為依賴升級,不涉及新增原始碼檔案。修改範圍如下:

```
singular-blockly/
├── package.json                      # 升級依賴版本
├── package-lock.json                 # npm install 自動更新
├── eslint.config.mjs                 # 更新 ecmaVersion: 2023
├── node_modules/                     # npm install 自動更新
└── specs/009-dev-tools-upgrade/      # 本功能文件目錄
```

**不涉及修改的檔案**:

-   `src/**/*.ts` - 無需修改 TypeScript 原始碼
-   `media/**/*.js` - 無需修改 Blockly 相關檔案
-   `webpack.config.js` - 保持現有配置
-   `tsconfig.json` - 保持現有配置
-   `dist/**/*` - 由 webpack 編譯產生

**結構決策**: 此為純依賴升級功能,遵循專案既有單一專案結構(Single project),所有原始碼在 `src/` 目錄,測試在 `src/test/` 目錄。升級不改變專案結構或架構模式。

## Complexity Tracking

_本功能無憲章違規,此節留空_

本功能為標準依賴升級,完全符合所有憲章原則,無需複雜度追蹤。

---

## Phase 0: 研究大綱

### 研究任務清單

1. **@typescript-eslint/eslint-plugin 8.46.2 變更研究**

    - 查詢 8.46.1 → 8.46.2 的 changelog
    - 確認 bug 修復內容和影響範圍
    - 驗證與 eslint 9.38.0 的相容性
    - 檢查是否有新增規則或棄用規則

2. **ESLint ecmaVersion 2023 語法支援研究**

    - 驗證 ESLint 9.38.0 對 ES2023 的完整支援
    - 確認 ES2023 新語法特性(Array.findLast, toSorted, toReversed, with, findLastIndex)
    - 測試 @typescript-eslint/parser 8.46.1 對 ES2023 的解析能力
    - 確認 TypeScript 5.9.3 與 ESLint ecmaVersion 2023 的相容性

3. **webpack-cli 6.x 破壞性變更研究**

    - 查詢 webpack-cli 5.1.4 → 6.0.1 的完整 changelog
    - 識別所有破壞性變更(CLI 參數、配置格式、行為變更)
    - 驗證與 webpack 5.102.1 的相容性(官方文件和社群回報)
    - 評估對專案 5 個 npm scripts 的影響(compile, watch, package, lint, test)
    - 分析效能影響(編譯時間、記憶體使用)
    - 檢查是否需要更新 webpack.config.js

4. **相依性衝突風險評估**
    - 檢查 @typescript-eslint/eslint-plugin 8.46.2 的 peer dependencies
    - 驗證 @typescript-eslint/parser 版本對齊需求
    - 確認 webpack-cli 6.x 與 webpack 5.x 的 peer dependency 宣告
    - 評估升級順序和依賴關係

### 研究輸出格式(research.md)

```markdown
# Phase 0 研究: 開發工具依賴升級

## R1: @typescript-eslint/eslint-plugin 8.46.2 變更分析

-   **決策**: [升級/不升級]
-   **理由**: [變更內容摘要]
-   **替代方案**: [保持 8.46.1 的考量]

## R2: ESLint ecmaVersion 2023 相容性

-   **決策**: [更新配置/保持現狀]
-   **理由**: [ES2023 語法支援驗證結果]
-   **替代方案**: [保持 2022 的影響]

## R3: webpack-cli 6.x 破壞性變更評估

-   **決策**: [升級/保持 5.x/延後]
-   **理由**: [相容性分析、風險評估]
-   **替代方案**: [保持 5.1.4 的長期影響]
-   **影響清單**: [CLI 參數、配置、效能]

## R4: 升級順序和策略

-   **推薦順序**: [P1 項目 → P2 項目分期實施]
-   **回滾策略**: [package-lock.json 備份、git revert]
```

---

## Phase 1: 設計與合約

### Phase 1.1: 資料模型(data-model.md)

**核心實體**:

1. **依賴版本實體(DependencyVersion)**

    - 套件名稱(packageName): string
    - 當前版本(currentVersion): string (semver)
    - 目標版本(targetVersion): string (semver)
    - 升級類型(upgradeType): "MAJOR" | "MINOR" | "PATCH"
    - 風險等級(riskLevel): "LOW" | "MEDIUM" | "HIGH"
    - 狀態(status): "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"

2. **配置變更實體(ConfigChange)**

    - 檔案路徑(filePath): string
    - 配置鍵(configKey): string
    - 舊值(oldValue): any
    - 新值(newValue): any
    - 變更原因(reason): string
    - 驗證狀態(validated): boolean

3. **測試結果實體(TestResult)**

    - 測試類型(testType): "UNIT" | "INTEGRATION" | "MANUAL"
    - 測試名稱(testName): string
    - 狀態(status): "PASS" | "FAIL" | "SKIP"
    - 執行時間(duration): number (秒)
    - 錯誤訊息(errorMessage): string | null

4. **效能基準實體(PerformanceBenchmark)**
    - 指標名稱(metricName): string
    - 基準值(baselineValue): number
    - 當前值(currentValue): number
    - 容忍範圍(tolerance): number (百分比)
    - 是否通過(passed): boolean

### Phase 1.2: 合約定義(contracts/)

**注意**: 此功能為依賴升級,不涉及 API 端點。合約目錄不適用,以升級檢查清單取代。

**升級驗證檢查清單** (`contracts/upgrade-validation-checklist.md`):

```markdown
# 升級驗證檢查清單

## P1-1: @typescript-eslint/eslint-plugin 8.46.2

-   [ ] npm install 成功
-   [ ] npm run lint 執行無錯誤
-   [ ] 無新增 lint 警告
-   [ ] npm test 通過(189/190)
-   [ ] npm run compile 成功
-   [ ] peer dependency 警告可接受

## P1-2: ESLint ecmaVersion 2023

-   [ ] eslint.config.mjs 已更新
-   [ ] ES2023 語法測試檔案通過 lint
-   [ ] 現有檔案 lint 結果不變
-   [ ] VS Code IntelliSense 正確識別語法

## P2: webpack-cli 6.0.1

-   [ ] 相容性研究完成
-   [ ] npm install 成功(如執行升級)
-   [ ] npm run compile 成功
-   [ ] npm run watch 功能正常
-   [ ] npm run package 產生正確 bundle
-   [ ] 編譯時間在 3.6s - 4.4s 範圍
-   [ ] Bundle 大小在 124KB - 137KB 範圍
-   [ ] 10 項手動測試通過
```

### Phase 1.3: 快速開始指南(quickstart.md)

**內容大綱**:

1. **環境準備**

    - Node.js 22.16.0+ 安裝驗證
    - npm 版本檢查
    - Git 工作目錄乾淨(無未提交變更)

2. **升級步驟 - P1 項目**

    ```bash
    # 1. 備份 package-lock.json
    cp package-lock.json package-lock.json.backup

    # 2. 升級 @typescript-eslint/eslint-plugin
    npm install --save-dev @typescript-eslint/eslint-plugin@8.46.2

    # 3. 更新 ESLint 配置
    # 手動編輯 eslint.config.mjs: ecmaVersion: 2023

    # 4. 驗證
    npm run lint
    npm test
    npm run compile
    ```

3. **升級步驟 - P2 項目**(如研究結果為可行)

    ```bash
    # 1. 升級 webpack-cli
    npm install --save-dev webpack-cli@6.0.1

    # 2. 驗證建置
    npm run compile
    npm run watch  # 測試後 Ctrl+C 停止
    npm run package

    # 3. 效能驗證
    # 記錄編譯時間和 bundle 大小

    # 4. 手動測試
    # F5 開啟 Extension Development Host
    # 執行 10 項 Blockly 編輯器測試
    ```

4. **回滾程序**(如遇問題)

    ```bash
    # 恢復 package.json 和 package-lock.json
    git checkout package.json package-lock.json eslint.config.mjs
    npm install
    ```

5. **故障排除**
    - peer dependency 警告處理
    - 測試失敗分析
    - 編譯錯誤診斷

### Phase 1.4: 代理上下文更新

執行 `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` 以更新 GitHub Copilot 上下文檔案,新增:

-   @typescript-eslint/eslint-plugin 8.46.2
-   webpack-cli 6.0.1(如升級執行)
-   ESLint ecmaVersion 2023 配置標準

---

## Phase 2: 任務分解計畫

**Phase 2 不在本指令範圍** - 將由 `/speckit.tasks` 指令產生 `tasks.md` 檔案。

Phase 2 將包含:

-   任務分解(T001-T010)
-   依賴關係圖
-   時程估算
-   測試策略細節
-   文件更新任務

---

## 下一步行動

1. ✅ Constitution Check 通過
2. ⏳ 執行 Phase 0 研究任務(產生 research.md)
3. ⏳ 執行 Phase 1 設計任務(產生 data-model.md, quickstart.md, contracts/)
4. ⏳ 更新代理上下文(執行 update-agent-context.ps1)
5. ⏳ 執行 `/speckit.tasks` 產生任務分解(tasks.md)

**當前狀態**: 實作計畫已完成,準備進入 Phase 0 研究階段
