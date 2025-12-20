# Implementation Plan: Ctrl+S 快速備份快捷鍵

**Branch**: `017-ctrl-s-quick-backup` | **Date**: 2025-12-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-ctrl-s-quick-backup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實作 Ctrl+S（macOS 為 Cmd+S）快捷鍵觸發快速備份功能。在 WebView 中監聽鍵盤事件，使用現有的 `createBackup` 訊息機制儲存備份，新增 Toast 通知系統顯示操作結果，並實作 3 秒節流機制防止重複備份。

## Technical Context

**Language/Version**: TypeScript 5.9.3 / JavaScript (ES2022+)  
**Primary Dependencies**: VSCode Extension API 1.105.0+, Blockly 12.3.1  
**Storage**: JSON 檔案 (`{workspace}/blockly/backups/*.json`)  
**Testing**: Mocha + Sinon (VSCode Extension 測試框架) + 手動 WebView 測試  
**Target Platform**: VSCode Extension (Windows, macOS, Linux)  
**Project Type**: VSCode Extension (Extension Host + WebView 雙層架構)  
**Performance Goals**: Ctrl+S 到 Toast 顯示 < 500ms，Toast 自動消失 2.5s (±200ms)  
**Constraints**: 3 秒節流機制防止重複備份，需支援 15 種語言 i18n  
**Scale/Scope**: 單一功能增強，影響約 4 個檔案

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                 | 評估                                               | 結果    |
| -------------------- | -------------------------------------------------- | ------- |
| I. 簡單性與可維護性  | 功能簡單專注，僅新增鍵盤快捷鍵處理和 Toast 通知    | ✅ 通過 |
| II. 模組化與可擴展性 | 複用現有 `createBackup` 機制，Toast 系統獨立模組化 | ✅ 通過 |
| III. 避免過度開發    | 僅實作使用者明確需求的備份快捷鍵功能               | ✅ 通過 |
| IV. 彈性與適應性     | 節流時間和 Toast 時長可透過常數配置                | ✅ 通過 |
| V. 研究驅動開發      | 需研究 WebView 鍵盤事件處理最佳實踐                | ✅ 通過 |
| VI. 結構化日誌       | 使用現有 `log.*` 系統記錄操作                      | ✅ 通過 |
| VII. 測試覆蓋        | WebView 互動使用手動測試（符合 UI 測試例外條款）   | ✅ 通過 |
| VIII. 純函數與模組化 | Toast 系統設計為可獨立測試的純函數                 | ✅ 通過 |
| IX. 繁體中文文件     | 所有規格文件使用繁體中文                           | ✅ 通過 |

**Gate 結果**: ✅ 全部通過，無需記錄複雜度違規

### Phase 1 設計後重新評估

| 原則         | 設計決策驗證                                       | 結果    |
| ------------ | -------------------------------------------------- | ------- |
| I. 簡單性    | Toast 系統 < 50 行程式碼，quickBackup 物件 < 60 行 | ✅ 維持 |
| II. 模組化   | `quickBackup` 和 `toast` 為獨立物件，可單獨測試    | ✅ 維持 |
| III. YAGNI   | 未實作錯誤回傳監聽（非必要功能）                   | ✅ 維持 |
| VIII. 純函數 | `canSave()` 和 `generateBackupName()` 為純函數     | ✅ 維持 |

**Phase 1 Gate 結果**: ✅ 設計符合所有原則，可進入 Phase 2

## Project Structure

### Documentation (this feature)

```text
specs/017-ctrl-s-quick-backup/
├── plan.md              # 本文件（/speckit.plan 指令輸出）
├── research.md          # Phase 0 輸出（/speckit.plan 指令）
├── data-model.md        # Phase 1 輸出（/speckit.plan 指令）
├── quickstart.md        # Phase 1 輸出（/speckit.plan 指令）
├── contracts/           # Phase 1 輸出（WebView ↔ Extension 訊息介面）
└── tasks.md             # Phase 2 輸出（/speckit.tasks 指令 - 非本指令建立）
```

### Source Code (repository root)

```text
# 變更檔案清單
media/
├── js/
│   └── blocklyEdit.js       # 新增: Ctrl+S 監聽、節流邏輯、Toast 顯示函數
├── css/
│   └── blocklyEdit.css      # 新增: Toast 通知樣式（成功/警告狀態）
└── locales/
    ├── en/messages.js       # 新增: 3 個 i18n 鍵
    ├── zh-hant/messages.js  # 新增: 3 個 i18n 鍵
    └── [其他 13 種語言]/     # 新增: 3 個 i18n 鍵

src/
└── webview/
    └── messageHandler.ts    # 現有: 複用 handleCreateBackup（無需修改）

# 測試檔案
src/test/
└── integration/
    └── quickBackup.test.ts  # 新增: 節流邏輯單元測試（純函數部分）
```

**Structure Decision**: 採用現有 VSCode Extension 架構，WebView 前端（`media/js/blocklyEdit.js`）處理鍵盤事件和 Toast 顯示，Extension Host（`src/webview/messageHandler.ts`）複用現有備份邏輯。Toast 通知系統在 WebView 內部實作，無需新增 Extension → WebView 的回傳訊息類型。

## Complexity Tracking

> **無需填寫** - Constitution Check 全部通過，無違規需要記錄
