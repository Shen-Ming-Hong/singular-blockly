# Implementation Plan: Blockly Language Selector

**Branch**: `030-language-selector` | **Date**: 2026-01-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/030-language-selector/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

為 Blockly 編輯器新增語言選擇下拉選單，讓使用者可以獨立設定 Blockly 介面語言（與 VS Code 語言分開）。同時清理 `main.json` 中冗餘的 `theme` 欄位，統一設定儲存位置。技術實現將利用現有的 `window.languageManager` 機制和 `SettingsManager` 服務。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension), JavaScript ES2020 (WebView)
**Primary Dependencies**: Google Blockly 12.3.1, VS Code Extension API 1.105.0+
**Storage**: `.vscode/settings.json` (JSON 設定檔) + `blockly/main.json` (工作區狀態)
**Testing**: Mocha + Chai (Extension), 手動測試 (WebView UI)
**Target Platform**: VS Code Desktop (Windows, macOS, Linux)
**Project Type**: VS Code Extension (Two-Context: Extension Host + WebView)
**Performance Goals**: 語言切換 < 500ms（包含 UI 重新渲染）
**Constraints**: 向後相容舊版 `main.json`（包含 `theme` 欄位不報錯）
**Scale/Scope**: 支援 15 種語言 + Auto 選項

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態           | 說明                                                                   |
| ------------------------------------- | -------------- | ---------------------------------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ PASS        | 利用現有 `window.languageManager` 和 `SettingsManager`，無需引入新架構 |
| II. Modularity and Extensibility      | ✅ PASS        | 語言選擇器作為獨立 UI 元件，可輕鬆擴展支援更多語言                     |
| III. Avoid Over-Development           | ✅ PASS        | 只實作使用者明確需求的功能（語言切換 + 設定同步）                      |
| IV. Flexibility and Adaptability      | ✅ PASS        | 支援 "Auto" 模式，自動跟隨 VS Code 語言                                |
| V. Research-Driven Development        | ✅ PASS        | 已研究現有 `languageManager.setLanguage()` 機制                        |
| VI. Structured Logging                | ✅ PASS        | 使用現有 `log()` 和 `window.log` 記錄操作                              |
| VII. Comprehensive Test Coverage      | ✅ PASS (部分) | Extension 邏輯 100% 覆蓋；WebView UI 使用手動測試                      |
| VIII. Pure Functions                  | ✅ PASS        | 語言切換邏輯為純函數，無副作用                                         |
| IX. Traditional Chinese Documentation | ✅ PASS        | 所有規格文件使用繁體中文                                               |
| X. Professional Release Management    | ⏳ N/A         | 發布流程在功能完成後執行                                               |
| XI. Agent Skills Architecture         | ⏳ N/A         | 無需新增技能                                                           |

## Project Structure

### Documentation (this feature)

```text
specs/030-language-selector/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# VS Code Extension (Two-Context Architecture)
src/
├── extension.ts              # 擴充功能進入點
├── services/
│   ├── localeService.ts      # 【修改】新增語言偏好管理方法
│   └── settingsManager.ts    # 【修改】新增語言設定存取方法
├── webview/
│   ├── webviewManager.ts     # 【修改】傳遞語言設定到 WebView
│   └── messageHandler.ts     # 【修改】移除 main.json 中的 theme 欄位
└── test/
    └── services/
        └── localeService.test.ts  # 【新增】語言偏好管理測試

media/
├── html/
│   └── blocklyEdit.html      # 【修改】新增語言選擇按鈕 HTML
├── css/
│   └── blocklyEdit.css       # 【修改】新增語言下拉選單樣式
├── js/
│   └── blocklyEdit.js        # 【修改】新增語言選擇器互動邏輯
└── locales/
    └── */messages.js         # 【修改】新增語言選擇器相關 i18n 鍵
```

**Structure Decision**: 使用現有的 Two-Context 架構，Extension Host 處理設定持久化，WebView 處理 UI 互動。無需新增目錄結構。

## Complexity Tracking

> 本功能符合所有憲法原則，無需額外複雜性。

| 違規項目 | 為何需要 | 拒絕較簡單替代方案的原因 |
| -------- | -------- | ------------------------ |
| 無       | -        | -                        |
