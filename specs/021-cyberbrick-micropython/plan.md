# Implementation Plan: CyberBrick MicroPython 積木支援

**Branch**: `021-cyberbrick-micropython` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-cyberbrick-micropython/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援，使用 MicroPython 語言與 mpremote 工具實現一鍵上傳，避免手動 Ctrl-C 中斷操作。技術方案包括：

-   新增 MicroPython 程式碼生成器（與現有 Arduino 生成器平行）
-   擴展 Board Config 架構以支援不同語言類型（arduino/micropython）
-   使用 PlatformIO 的 Python 環境執行 mpremote 工具進行上傳
-   實現工作區切換時的自動備份機制

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) + JavaScript (WebView/Blockly)  
**Primary Dependencies**: Blockly 12.3.1, VS Code API 1.105.0+, mpremote (MicroPython 工具)  
**Storage**: 工作區 `blockly/main.json`（積木狀態）、`blockly/backups/`（備份目錄）  
**Testing**: Mocha + VS Code Extension Test（現有測試框架）  
**Target Platform**: VS Code Extension + WebView（Windows/macOS/Linux）  
**Project Type**: VS Code Extension (WebView 架構)  
**Performance Goals**: 上傳時間 ≤10 秒、主板切換 <1 秒、程式碼生成即時  
**Constraints**: 依賴 PlatformIO Python 環境、需要 USB COM Port 存取權限  
**Scale/Scope**: 單一主板（CyberBrick）、約 15 個核心積木類別、1 個新生成器

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                       | 狀態    | 說明                                                                                 |
| -------------------------- | ------- | ------------------------------------------------------------------------------------ |
| **I. 簡潔性與可維護性**    | ✅ PASS | MicroPython 生成器將採用與 Arduino 生成器相同的模組化架構，每個積木類別一個檔案      |
| **II. 模組化與可擴展性**   | ✅ PASS | 新增獨立的生成器目錄 `generators/micropython/`，不影響現有 Arduino 程式碼            |
| **III. 避免過度開發**      | ✅ PASS | 僅實作 Phase 1 核心功能（LED、GPIO、WiFi、時序），進階功能（X11/X12/RC）留待 Phase 2 |
| **IV. 靈活性與適應性**     | ✅ PASS | Board Config 擴展為支援 `language` 屬性，未來可輕鬆新增其他 MicroPython 主板         |
| **V. 研究驅動開發**        | ✅ PASS | 已透過 MCP 工具查詢 mpremote 官方文件，將在 research.md 記錄完整發現                 |
| **VI. 結構化日誌**         | ✅ PASS | 新增服務將使用 `log.*` 方法，WebView 使用 `console.log`                              |
| **VII. 全面測試覆蓋**      | ✅ PASS | 新增服務需配對單元測試，WebView 互動使用手動測試（spec 已定義情境）                  |
| **VIII. 純函數與模組架構** | ✅ PASS | 上傳服務設計為可測試的純函數，副作用隔離至 I/O 層                                    |
| **IX. 繁體中文文件標準**   | ✅ PASS | 所有規格文件、計畫、使用者指南使用繁體中文                                           |
| **X. 專業發布管理**        | N/A     | 功能開發階段，發布時再套用                                                           |

**Gate 結果**: ✅ 所有原則通過，可進入 Phase 0 研究階段

## Project Structure

### Documentation (this feature)

```text
specs/021-cyberbrick-micropython/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── webview-messages.md  # WebView ↔ Extension 訊息契約
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# 現有結構（需擴展）
src/
├── services/
│   ├── fileService.ts           # 現有：檔案操作
│   ├── settingsManager.ts       # 現有：PlatformIO 設定
│   └── micropythonUploader.ts   # 新增：mpremote 上傳服務
├── webview/
│   ├── webviewManager.ts        # 擴展：載入 MicroPython 生成器
│   └── messageHandler.ts        # 擴展：處理上傳/備份訊息
└── test/
    └── micropythonUploader.test.ts  # 新增：上傳服務測試

# WebView 資源（需擴展）
media/
├── blockly/
│   ├── blocks/
│   │   ├── board_configs.js     # 擴展：新增 cyberbrick 配置
│   │   └── cyberbrick.js        # 新增：CyberBrick 專用積木定義
│   └── generators/
│       ├── arduino/             # 現有：Arduino 程式碼生成器
│       └── micropython/         # 新增：MicroPython 程式碼生成器目錄
│           ├── index.js         # 生成器入口與基礎設定
│           ├── loops.js         # 迴圈積木
│           ├── logic.js         # 邏輯積木
│           ├── math.js          # 數學積木
│           ├── text.js          # 文字積木
│           ├── variables.js     # 變數積木
│           ├── functions.js     # 函數積木
│           └── cyberbrick.js    # CyberBrick 硬體積木
├── toolbox/
│   ├── index.json              # 現有：Arduino 工具箱
│   └── cyberbrick.json         # 新增：CyberBrick MicroPython 工具箱
└── js/
    └── blocklyEdit.js          # 擴展：主板切換邏輯、生成器切換
```

**Structure Decision**: 採用現有的 VSCode Extension + WebView 架構，新增平行的 MicroPython 生成器目錄，與 Arduino 生成器完全分離。上傳功能作為獨立服務實作，便於測試和維護。

## Complexity Tracking

> 本功能無需違反 Constitution 原則，無需記錄複雜度例外。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| 無        | -          | -                                    |
