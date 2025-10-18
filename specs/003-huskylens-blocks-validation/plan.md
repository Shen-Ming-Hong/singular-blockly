# Implementation Plan: HuskyLens 積木程式碼驗證與修正

**Branch**: `003-huskylens-blocks-validation` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-huskylens-blocks-validation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能旨在驗證並修正 Singular Blockly 擴充套件中所有 HuskyLens 相關積木的實作正確性。主要工作包括:驗證 11 個積木的定義完整性、Arduino 程式碼生成正確性、12 種語言的國際化訊息完整性、錯誤處理機制、以及積木註冊機制。技術方法採用 MCP 工具查證 HuskyLens Arduino 函式庫 API、Blockly 最佳實踐、PlatformIO 函式庫管理、以及開發板相容性,確保所有修正基於最新的技術資訊。

## Technical Context

**Language/Version**: TypeScript (Node.js runtime for VSCode Extension) + JavaScript (Browser runtime for WebView)
**Primary Dependencies**:

-   VSCode Extension API (^1.85.0 - 從 package.json engines.vscode 取得)
-   Google Blockly (^11.2.2 - Context7 Trust Score 8.9, /google/blockly)
-   HUSKYLENSArduino 函式庫 (GitHub master branch, URL: https://github.com/HuskyLens/HUSKYLENSArduino/archive/refs/heads/master.zip)
-   PlatformIO (lib_deps 支援 GitHub archive URLs, 已驗證規格相容)
    **Storage**:
-   檔案系統 (`media/blockly/blocks/huskylens.js`, `media/blockly/generators/arduino/huskylens.js`, `media/locales/*/messages.js`, `media/toolbox/categories/vision-sensors.json`)
-   工作區狀態 JSON (`{workspace}/blockly/main.json`)
-   PlatformIO 設定 (`{workspace}/platformio.ini`)
    **Testing**:
-   單元測試框架 (已有測試基礎設施 - 需檢查覆蓋率工具)
-   整合測試 (PlatformIO 編譯驗證)
-   手動測試 (WebView UI 驗證)
    **Target Platform**:
-   VSCode Extension Host (Node.js)
-   WebView (Chromium-based browser context)
-   目標硬體: Arduino Uno/Nano/Mega, ESP32, ESP32 Super Mini
    **Project Type**: VSCode Extension (單一專案,Extension Host + WebView 雙環境)
    **Performance Goals**:
-   程式碼生成時間 <2 秒 (任意積木組合)
-   WebView 載入時間 <3 秒
-   積木拖曳響應 <100ms
    **Constraints**:
-   生成程式碼大小 <20KB (不含函式庫)
-   100% 錯誤捕捉率 (不導致應用程式崩潰)
-   支援 12 種語言的完整國際化
-   向後相容現有工作區檔案
    **Scale/Scope**:
-   11 個 HuskyLens 積木
-   44 個國際化訊息鍵 × 12 種語言 = 528 個訊息條目
-   33 個驗收場景
-   6 個邊界案例

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Review each core principle from `.specify/memory/constitution.md`:

-   [x] **Simplicity and Maintainability**: 驗證工作專注於既有積木的正確性檢查,不新增複雜功能。修正後的程式碼將添加清晰註解,說明 API 呼叫與錯誤處理邏輯。
-   [x] **Modularity and Extensibility**: 積木定義 (blocks/huskylens.js) 與程式碼生成器 (generators/arduino/huskylens.js) 已分離,驗證工作不改變現有模組邊界。國際化訊息透過 LocaleService 統一管理。
-   [x] **Avoid Over-Development**: 僅驗證並修正規格要求的 11 個積木,不添加新積木或新功能。錯誤處理僅針對 6 個邊界案例,不實作不必要的防禦邏輯。
-   [x] **Flexibility and Adaptability**: 修正後的積木設計將支援未來新增的 HuskyLens 函式庫版本 (透過 Phase 0 Research 查證 API 穩定性)。國際化機制已支援新語言的擴充。
-   [x] **Research-Driven Development (MCP-Powered)**: **CRITICAL** - 規格已明確要求 5 個 MCP 查證任務,將在 Phase 0 Research 執行 (見下方 Research Actions Taken)。
-   [x] **Structured Logging**: 現有程式碼已使用 `log.info/error/debug` (logging.ts)。驗證過程中的錯誤發現將透過 log.error 記錄,修正後的程式碼不使用 console.log。
-   [x] **Comprehensive Test Coverage**: 目標 100% 單元測試覆蓋率 (區塊定義驗證函式、程式碼生成器驗證函式)。整合測試: PlatformIO 編譯驗證。手動測試: 33 個驗收場景。
-   [x] **Pure Functions and Modular Architecture**: 驗證函式將設計為純函式 (輸入積木定義/生成器程式碼 → 輸出驗證結果)。不依賴全域狀態,便於單元測試。

**Research Actions Taken**:

-   [x] **Task 1**: ✅ 已完成 - 使用 `resolve-library-id` + `github_repo` 查證 HUSKYLENSArduino API, 50+ 程式碼範例, 發現 `.id` → `.ID` 大小寫錯誤
-   [x] **Task 2**: ✅ 已完成 - 使用 `get-library-docs` 查詢 Blockly (Context7), 取得 15+ 範例, 建立 8 項驗證清單
-   [x] **Task 3**: ✅ 已完成 - 使用 `fetch_webpage` 查證 PlatformIO lib_deps, 確認 GitHub archive URL 格式符合官方規格
-   [x] **Task 4**: ✅ 已完成 - 使用 `github_repo` 研究 ESP32 HardwareSerial, 驗證 Arduino AVR SoftwareSerial 實作正確, ESP32 需新增 HardwareSerial 支援
-   [x] **Task 5**: ✅ 已完成 - 使用 `grep_search` + `read_file` 驗證 GCC pragma 指令正確性, 確認 JavaScript 插入順序保證有效
-   [x] 所有研究成果已記錄於 `specs/003-huskylens-blocks-validation/research.md` (100% 完成)

**Testability Assessment**:

-   [x] 所有驗證邏輯將設計為純函式,輸入為 Blockly 積木定義物件或生成器程式碼字串,輸出為驗證結果物件
-   [x] 無無限迴圈或阻塞操作 (所有驗證都是同步的欄位檢查或字串比對)
-   [x] 純函式已識別: `validateBlockDefinition()`, `validateCodeGenerator()`, `validateI18nMessages()`, `validateToolboxEntry()`, `validateRegistration()`
-   [x] 依賴注入: 驗證函式接收 Blockly 物件作為參數,不直接存取全域變數

**Violations Requiring Justification**:

-   **Medium Complexity - 國際化訊息**: 528 個訊息條目 (44 keys × 12 languages) 為規格要求 (FR-003),無法簡化
-   **High Complexity - 跨開發板相容性**: 55 個測試場景 (11 blocks × 5 boards) 為規格要求 (FR-005),ESP32 SoftwareSerial 不相容性需特殊處理

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

```
singular-blockly/
├── src/                              # VSCode Extension (Node.js runtime)
│   ├── extension.ts                  # 擴充套件進入點 (已存在)
│   ├── services/                     # 服務層 (已存在)
│   │   ├── fileService.ts            # 檔案 I/O
│   │   ├── localeService.ts          # 國際化訊息載入
│   │   ├── logging.ts                # 結構化日誌
│   │   └── settingsManager.ts        # PlatformIO 設定管理
│   ├── webview/                      # WebView 管理 (已存在)
│   │   ├── messageHandler.ts         # Extension ↔ WebView 訊息處理
│   │   └── webviewManager.ts         # WebView 面板管理
│   └── test/                         # 單元測試 (已存在)
│       ├── huskylensValidation.test.ts  # [新增] 本功能的驗證邏輯測試
│       └── ... (其他既有測試)
│
├── media/                            # WebView 資源 (Browser runtime)
│   ├── blockly/
│   │   ├── blocks/
│   │   │   ├── huskylens.js          # [需驗證/修正] 11 個積木定義
│   │   │   └── ... (其他積木)
│   │   ├── generators/
│   │   │   └── arduino/
│   │   │       ├── huskylens.js      # [需驗證/修正] Arduino 程式碼生成器
│   │   │       └── ... (其他生成器)
│   │   └── themes/                   # Blockly 主題 (已存在)
│   ├── locales/                      # 國際化訊息檔案
│   │   ├── en/messages.js            # [需驗證/修正] 英文訊息
│   │   ├── zh-hant/messages.js       # [需驗證/修正] 繁體中文訊息
│   │   └── ... (其他 10 種語言)
│   └── toolbox/
│       └── categories/
│           └── vision-sensors.json   # [需驗證] HuskyLens 積木工具箱定義
│
├── specs/                            # 功能規格文件
│   └── 003-huskylens-blocks-validation/
│       ├── spec.md                   # ✅ [已完成] 功能規格
│       ├── plan.md                   # ✅ [本檔案] 實作計畫 (Phase 0-1 完成)
│       ├── research.md               # ✅ [已完成] Phase 0 研究成果 (100% 完成)
│       ├── data-model.md             # ✅ [已完成] Phase 1 資料模型 (5 個實體定義)
│       ├── quickstart.md             # ✅ [已完成] Phase 1 開發者指南 (含測試流程)
│       └── tasks.md                  # ⏳ [待產生] Phase 2 任務分解
│
└── package.json                      # 專案依賴 (包含 Blockly 版本)
```

**Structure Decision**:
Singular Blockly 為單一 VSCode 擴充套件專案,採用 Extension Host + WebView 雙環境架構。本功能的驗證工作涉及三個主要區域:

1. **積木定義與程式碼生成** (`media/blockly/`) - JavaScript,Browser 環境
2. **國際化訊息** (`media/locales/`) - JavaScript 物件字面值
3. **驗證邏輯測試** (`src/test/`) - TypeScript,Node.js 環境

驗證函式將建立為純函式,可在 Node.js 測試環境中執行,但驗證目標檔案位於 WebView 環境。因此需要使用檔案 I/O (FileService) 讀取 `media/blockly/` 下的檔案進行靜態分析。

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
