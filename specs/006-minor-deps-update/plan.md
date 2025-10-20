# Implementation Plan: 次要依賴更新 (Phase 2)

**Branch**: `006-minor-deps-update` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-minor-deps-update/spec.md`

## Summary

本階段將升級兩個開發依賴套件到最新穩定次要版本:

1. **@blockly/theme-modern**: 6.0.10 → 6.0.12 (patch 更新,修復 bug 並改進主題系統)
2. **@types/node**: 20.17.12 → 20.19.22 (minor 更新,提供最新 Node.js 20.x API 型別定義)

**技術方法**: 採用「升級 → 測試 → 驗證」循環模式,每個套件獨立升級並驗證,確保零迴歸。基於 Phase 1 成功經驗,使用既有的測試基準 (190/191 測試通過, 87.21% 覆蓋率) 作為驗證標準。

**預期效益**: 改善開發體驗(更準確的型別提示)、確保視覺穩定性(主題系統 bug 修復)、維持安全性(無新增漏洞)。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 20.x  
**Primary Dependencies**:

-   @blockly/theme-modern 6.0.10 → 6.0.12 (Blockly 主題套件)
-   @types/node 20.17.12 → 20.19.22 (Node.js 型別定義)
-   基礎設施: webpack 5.102.1, ts-loader 9.5.4, eslint 9.38.0 (Phase 1 已升級)

**Storage**: 檔案系統 (package.json, package-lock.json, CHANGELOG.md)  
**Testing**:

-   Mocha + @vscode/test-electron 2.5.2 (單元測試與整合測試)
-   手動測試 (Blockly 編輯器主題切換功能)
-   測試基準: 190/191 測試通過, 87.21% 覆蓋率 (Phase 1 基準)

**Target Platform**: VSCode Extension (Windows 開發環境,支援 VSCode 1.96.0+)  
**Project Type**: VSCode Extension (單一專案結構)  
**Performance Goals**:

-   TypeScript 編譯時間 ≤ 5.06 秒 (Phase 1 基準 4.6 秒 的 110%)
-   測試執行時間 ≤ 21.58 秒 (Phase 1 基準 19.6 秒 的 110%)
-   整體升級流程完成時間 ≤ 45 分鐘

**Constraints**:

-   建置產出檔案大小變化在 ±2% 範圍內 (基準: 130,506 bytes)
-   必須維持與 Phase 1 相同的測試通過率 (190/191)
-   必須維持測試覆蓋率 ≥ 87.21%
-   npm audit 必須回報 0 個 critical/high 安全漏洞

**Scale/Scope**:

-   2 個 npm 套件升級
-   ~10 個驗證檢查點
-   1 個 Git commit (或依升級順序分為 2 個 commits)
-   1 個 CHANGELOG 條目更新

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Review each core principle from `.specify/memory/constitution.md`:

-   [x] **Simplicity and Maintainability**: 升級範圍限定於兩個套件,採用直接的「安裝 → 測試 → 驗證」流程,無複雜配置變更
-   [x] **Modularity and Extensibility**: 兩個套件各自獨立升級,互不依賴,失敗時可獨立回滾
-   [x] **Avoid Over-Development**: 僅升級必要的 patch/minor 版本,不追求最新主版本或不必要的功能
-   [x] **Flexibility and Adaptability**: 升級過程不改變現有架構,保持對多平台支援的彈性
-   [x] **Research-Driven Development (MCP-Powered)**: 將使用 MCP 工具驗證套件 changelog、breaking changes 和最佳實踐
-   [x] **Structured Logging**: 升級過程記錄於 Git commit 訊息和 CHANGELOG.md,使用標準化格式
-   [x] **Comprehensive Test Coverage**: 每個升級步驟都透過完整測試套件驗證,維持 87.21% 覆蓋率,無新增測試需求
-   [x] **Pure Functions and Modular Architecture**: 升級不涉及程式碼變更,僅更新套件版本,不影響現有架構
-   [x] **Traditional Chinese Documentation**: 本計畫使用繁體中文撰寫,符合 Principle IX 要求

**Research Actions Taken**:

-   [x] 使用 `npm outdated` 命令分析可升級套件及版本差異
-   [x] 檢視 Phase 1 完成報告 (005-safe-dependency-updates/PHASE-7-COMPLETION-REPORT.md) 了解成功模式
-   [x] **Phase 0 已完成**: 使用 MCP `resolve-library-id` 和 `get-library-docs` 查詢套件 changelog
-   [x] **Phase 0 已完成**: 使用 `webSearch` 和 `fetch_webpage` 搜尋已知問題和版本資訊
-   [x] **Phase 0 已完成**: 確認與 Blockly 11.2.2、VSCode 1.96.0、TypeScript 5.9.3 的相容性
-   [x] **Phase 0 已完成**: 研究成果記錄於 `research.md`,包含版本分析、相容性驗證和風險評估

**Testability Assessment**:

-   [x] 升級不涉及新程式碼,無新增可測試邏輯
-   [x] 使用現有測試套件驗證,無需編寫新測試
-   [x] 測試執行無阻塞操作,Phase 1 已驗證測試穩定性
-   [x] 依賴注入架構已就緒 (FileService, SettingsManager 等服務層)

**Violations Requiring Justification**: 無違反事項

**Constitution Check 結果**: ✅ **通過** - 所有原則符合,可進入 Phase 0 研究階段

## Project Structure

### Documentation (this feature)

```
specs/006-minor-deps-update/
├── spec.md              # 功能規格 (已完成)
├── plan.md              # 本檔案 (實作計畫)
├── research.md          # Phase 0 輸出 (套件 changelog 和相容性研究)
├── data-model.md        # Phase 1 輸出 (升級流程數據模型)
├── quickstart.md        # Phase 1 輸出 (快速開始指南)
├── contracts/           # Phase 1 輸出 (驗證契約)
│   └── upgrade-validation-contract.yaml  # 升級驗證檢查點定義
└── checklists/
    └── requirements.md  # 規格品質檢查清單 (已完成)
```

### Source Code (repository root)

```
# 此功能不涉及程式碼變更,僅更新依賴和文件

# 需要修改的檔案:
package.json             # 更新依賴版本
package-lock.json        # npm install 自動更新
CHANGELOG.md             # 記錄升級內容

# 驗證涉及的現有程式碼結構:
src/
├── extension.ts         # 擴充功能入口點
├── services/
│   ├── fileService.ts   # 檔案操作服務
│   ├── settingsManager.ts  # 設定管理服務
│   ├── localeService.ts    # 語系服務
│   └── logging.ts       # 日誌服務
└── webview/
    ├── webviewManager.ts    # WebView 管理器
    └── messageHandler.ts    # 訊息處理器

media/
├── blockly/
│   ├── blocks/          # Blockly 積木定義
│   ├── generators/      # 程式碼生成器
│   └── themes/          # 主題定義 (使用 @blockly/theme-modern)
├── html/
│   └── blocklyEdit.html # Blockly 編輯器 WebView
└── js/
    └── blocklyEdit.js   # Blockly 編輯器邏輯

src/test/
├── suite/
│   ├── fileService.test.ts        # FileService 測試
│   ├── settingsManager.test.ts    # SettingsManager 測試
│   ├── localeService.test.ts      # LocaleService 測試
│   └── webviewMessageHandler.test.ts  # MessageHandler 測試
└── index.ts             # 測試入口

coverage/                # 測試覆蓋率報告目錄
```

**Structure Decision**:
此為依賴升級功能,不新增或修改程式碼檔案,僅更新 npm 套件版本。專案維持既有的單一專案結構 (VSCode Extension)。主要變更集中在:

1. **套件管理檔案**: package.json, package-lock.json
2. **文件檔案**: CHANGELOG.md
3. **驗證範圍**: 現有測試套件 (src/test/) 和手動主題測試 (media/)

## Complexity Tracking

_無需填寫 - 本升級符合所有 Constitution 原則,無違反事項需要說明_
