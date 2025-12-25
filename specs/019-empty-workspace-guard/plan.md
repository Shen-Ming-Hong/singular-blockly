# Implementation Plan: 空 Workspace 防護機制

**Branch**: `019-empty-workspace-guard` | **Date**: 2025-12-25 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/019-empty-workspace-guard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修復方塊拖曳時意外消失的資料遺失問題。實作三層防護機制：WebView 端不存空 Workspace、Extension 端拒絕空資料、覆寫前備份到 `.bak`。

技術方法（來自 research.md）：

-   複用現有 `isDraggingBlock` 變數進行儲存攔截
-   複用 spec 017 的空值檢查邏輯
-   使用 FileService 的 `copyFile` 方法實作備份

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) + JavaScript ES6 (WebView)  
**Primary Dependencies**: Blockly 12.3.1, VS Code Extension API 1.105.0+  
**Storage**: JSON 檔案 (`blockly/main.json`, `blockly/main.json.bak`)  
**Testing**: Mocha + VSCode Extension Test Framework  
**Target Platform**: VS Code Extension (Windows/macOS/Linux)  
**Project Type**: VSCode Extension (Extension Host + WebView 架構)  
**Performance Goals**: 儲存攔截應在 < 1ms 內完成判斷  
**Constraints**: 不影響正常儲存流程效能  
**Scale/Scope**: 單一功能修復，約 50 行程式碼變更

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態      | 說明                               |
| ---------------------- | --------- | ---------------------------------- |
| I. 簡單性與可維護性    | ✅ 通過   | 修改僅涉及 2 個檔案，邏輯清晰      |
| II. 模組化與可擴展性   | ✅ 通過   | 新增獨立的驗證函數，不修改核心架構 |
| III. 避免過度開發      | ✅ 通過   | 只實作規格要求的功能，無多餘特性   |
| IV. 靈活性與適應性     | ✅ 通過   | 驗證邏輯可配置擴展                 |
| V. 研究驅動開發        | ✅ 通過   | 已完成 research.md 分析現有程式碼  |
| VI. 結構化日誌         | ✅ 通過   | 使用 log.info/warn 進行記錄        |
| VII. 全面測試覆蓋      | ⚠️ 待驗證 | 需新增單元測試                     |
| VIII. 純函數與模組架構 | ✅ 通過   | 新增的驗證函數為純函數             |
| IX. 繁體中文文件標準   | ✅ 通過   | 所有規格文件使用繁體中文           |
| X. 專業發布管理        | N/A       | 本功能不涉及發布流程               |

**設計後再檢查**: ✅ 所有原則通過

## Project Structure

### Documentation (this feature)

```text
specs/019-empty-workspace-guard/
├── plan.md              # 本檔案
├── research.md          # Phase 0 研究文件（已完成）
├── data-model.md        # Phase 1 資料模型（已完成）
├── quickstart.md        # Phase 1 快速入門（已完成）
├── contracts/           # Phase 1 合約定義
│   └── message-contracts.md  # WebView ↔ Extension 訊息合約
└── tasks.md             # Phase 2 任務清單（待 /speckit.tasks 建立）
```

### Source Code (repository root)

```text
# 本功能涉及的檔案
media/
└── js/
    └── blocklyEdit.js      # WebView 端：修改 saveWorkspaceState()

src/
├── webview/
│   └── messageHandler.ts   # Extension 端：修改 handleSaveWorkspace()
└── test/
    └── messageHandler.test.ts  # 新增測試案例
```

**Structure Decision**: 採用現有的 VSCode Extension 架構，遵循 Extension Host + WebView 分離模式。本功能僅修改現有檔案，不新增檔案。

## Complexity Tracking

> 本功能無憲法違規，此表為空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| -         | -          | -                                    |
