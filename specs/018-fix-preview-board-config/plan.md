# Implementation Plan: 修復預覽模式開發板配置顯示錯誤

**Branch**: `018-fix-preview-board-config` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/018-fix-preview-board-config/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修復 ESP32 備份檔案預覽模式顯示 Arduino 腳位而非 ESP32 腳位的問題。核心問題是預覽視窗在載入備份內容時，未讀取備份檔案中的 `board` 欄位並設定 `window.currentBoard`，導致積木腳位下拉選單使用預設的 Arduino 配置。解決方案為在 `loadBackupContent` 發送 `loadWorkspaceState` 訊息前，先傳送開發板設定，並在 `blocklyPreview.js` 中於載入工作區狀態前呼叫 `setCurrentBoard()`。

## Technical Context

**Language/Version**: TypeScript 5.9.3, JavaScript ES2023  
**Primary Dependencies**: Blockly 12.3.1, VS Code API 1.105.0+  
**Storage**: JSON 檔案（備份格式: `{ workspace, board, theme }`）  
**Testing**: Mocha + c8 coverage (npm test), 手動 WebView 測試  
**Target Platform**: VS Code Extension (跨平台: Windows/macOS/Linux)  
**Project Type**: single (VSCode Extension)  
**Performance Goals**: 預覽視窗載入時間增加 < 500ms  
**Constraints**: 必須保持向後相容性（舊備份缺少 `board` 欄位時預設 `arduino_uno`）  
**Scale/Scope**: 支援 5 種開發板（Uno, Nano, Mega, ESP32, Super Mini）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                           | 狀態       | 說明                                                 |
| ---------------------------------------------- | ---------- | ---------------------------------------------------- |
| I. Simplicity and Maintainability              | ✅ PASS    | 修改範圍小且集中（2 個檔案），邏輯清晰               |
| II. Modularity and Extensibility               | ✅ PASS    | 利用現有 `setCurrentBoard()` API，無需新增模組       |
| III. Avoid Over-Development                    | ✅ PASS    | 僅實作規格要求的功能，無額外 feature                 |
| IV. Flexibility and Adaptability               | ✅ PASS    | 支援所有已定義的開發板類型                           |
| V. Research-Driven Development                 | ✅ PASS    | 已分析現有程式碼流程                                 |
| VI. Structured Logging                         | ✅ PASS    | 使用現有 `log` 物件                                  |
| VII. Comprehensive Test Coverage               | ⚠️ PARTIAL | WebView 互動需手動測試（符合 constitution 例外條款） |
| VIII. Pure Functions and Modular Architecture  | ✅ PASS    | 修改為純粹的訊息傳遞邏輯                             |
| IX. Traditional Chinese Documentation Standard | ✅ PASS    | 所有文件使用繁體中文                                 |
| X. Professional Release Management             | N/A        | 非發布相關                                           |

**Gate 評估**: ✅ 通過 - 無違規項目需要特別說明

## Project Structure

### Documentation (this feature)

```text
specs/018-fix-preview-board-config/
├── plan.md              # 本檔案 (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── webview/
│   └── webviewManager.ts    # 修改: loadBackupContent() 傳送 board 設定
└── types/
    └── previewMessages.ts   # 新增: PreviewMessage 類型定義

media/
├── js/
│   └── blocklyPreview.js    # 修改: 處理 setBoard 訊息
├── html/
│   └── blocklyPreview.html  # 可能修改: 載入 ESP32 積木定義
└── blockly/
    └── blocks/
        └── esp32-wifi-mqtt.js  # 現有: 需確保預覽模式載入
```

**Structure Decision**: 使用現有單一專案結構，修改集中在 WebView 管理層和預覽 JS 檔案。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

_無違規項目，此表格留空_

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| -         | -          | -                                    |
