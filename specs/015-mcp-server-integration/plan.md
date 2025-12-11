# Implementation Plan: MCP Server 整合

**Branch**: `015-mcp-server-integration` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-mcp-server-integration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

在 VSCode 擴展中整合 MCP (Model Context Protocol) Server，讓 AI 工具可以透過標準化介面查詢積木用法、讀取專案狀態、修改 main.json 並驗證生成結果。使用 VSCode 1.99+ 的 `registerMcpServerDefinitionProvider` API 註冊 MCP Server，採用 STDIO 傳輸層與 MCP Client 通訊。

## Technical Context

**Language/Version**: TypeScript 5.9.3 / JavaScript (ES2022)  
**Primary Dependencies**: VSCode Extension API 1.105.0+, @modelcontextprotocol/sdk (TypeScript SDK), Blockly 12.3.1  
**Storage**: JSON 檔案 (`{workspace}/blockly/main.json`)、INI 檔案 (`platformio.ini`)  
**Testing**: Mocha/Sinon（VS Code Extension 測試框架）+ 手動 WebView 測試  
**Target Platform**: VS Code Extension (Windows/macOS/Linux), 需 VSCode 1.99+  
**Project Type**: Single（VS Code Extension + WebView + MCP Server）  
**Performance Goals**: MCP 工具回應 ≤500ms, 編輯器刷新 ≤2s, Server 啟動 ≤3s  
**Constraints**: 需 VSCode 1.99+ (MCP API), 向後相容既有 main.json 格式  
**Scale/Scope**: 約 55 個自訂積木的字典、9 個 MCP 工具、5 種支援板卡

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 檢查項目                                              | 狀態    |
| ---------------------- | ----------------------------------------------------- | ------- |
| I. 簡潔與可維護性      | MCP Server 模組獨立、工具函數單一職責                 | ✅ PASS |
| II. 模組化與可擴展性   | 工具可動態註冊、積木字典可擴展                        | ✅ PASS |
| III. 避免過度開發      | 僅實作 spec 定義的 9 個工具                           | ✅ PASS |
| IV. 彈性與適應性       | 支援多板卡、多語言積木名稱                            | ✅ PASS |
| V. 研究驅動開發        | 已使用 MCP 查詢 VSCode MCP API 與 TypeScript SDK 文件 | ✅ PASS |
| VI. 結構化日誌         | 使用 `log.*` 記錄 MCP 工具調用                        | ✅ PASS |
| VII. 測試覆蓋率        | 整合測試覆蓋 MCP 工具操作                             | ✅ PASS |
| VIII. 純函數與模組架構 | 工具處理函數為純函數，副作用隔離至服務層              | ✅ PASS |
| IX. 繁體中文文件標準   | 積木字典使用繁體中文撰寫                              | ✅ PASS |
| X. 專業發布管理        | 不涉及發布流程                                        | N/A     |

**Pre-Phase 0 Gate**: ✅ PASSED - 無違規項目

## Project Structure

### Documentation (this feature)

```text
specs/015-mcp-server-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── mcp-tools.json   # MCP 工具契約定義
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single project (VS Code Extension + MCP Server)
src/
├── extension.ts              # 修改：註冊 MCP Server Definition Provider
├── mcp/                      # 新增：MCP Server 模組
│   ├── mcpServer.ts          # MCP Server 主入口
│   ├── tools/                # MCP 工具實作
│   │   ├── blockQuery.ts     # 積木查詢工具 (get_block_usage, search_blocks, list_blocks_by_category)
│   │   ├── workspaceOps.ts   # 工作區操作工具 (get_workspace_state, update_workspace, refresh_editor)
│   │   └── platformConfig.ts # 平台配置工具 (get_generated_code, get_platform_config, get_board_pins)
│   └── blockDictionary.ts    # 積木字典資料
├── services/
│   ├── fileService.ts        # 現有：檔案操作服務
│   └── settingsManager.ts    # 現有：設定管理服務
├── webview/
│   ├── webviewManager.ts     # 修改：添加 FileWatcher 支援
│   └── messageHandler.ts     # 修改：處理 refresh_editor 命令
└── test/
    ├── mcp/                  # 新增：MCP 測試
    │   ├── blockQuery.test.ts
    │   ├── workspaceOps.test.ts
    │   └── platformConfig.test.ts
    └── integration/
        └── mcpIntegration.test.ts

media/
├── blockly/
│   └── blocks/              # 現有：積木定義（作為字典來源）
└── locales/                 # 現有：多語言訊息（積木說明翻譯來源）
```

**Structure Decision**: 採用單一專案結構，在 `src/mcp/` 下建立獨立的 MCP Server 模組，與現有服務層整合。

## Complexity Tracking

> **無違規項目 - Constitution Check 全部通過**

本功能設計遵循所有憲法原則，無需記錄複雜度違規。

---

## Phase 0: 研究完成 ✅

研究成果已記錄於 [research.md](./research.md)，包含：

1. ✅ **VSCode MCP Server Definition Provider API** - 完整 API 文件與註冊範例
2. ✅ **@modelcontextprotocol/sdk TypeScript SDK** - 工具註冊模式與 Zod Schema
3. ✅ **FileWatcher 機制** - debounce 策略與循環觸發避免
4. ✅ **積木字典格式** - 完整資料結構設計

---

## Phase 1: 設計完成 ✅

Phase 1 產出：

| 文件                                                   | 狀態 | 說明                             |
| ------------------------------------------------------ | ---- | -------------------------------- |
| [research.md](./research.md)                           | ✅   | 技術研究報告                     |
| [data-model.md](./data-model.md)                       | ✅   | 完整資料模型定義                 |
| [contracts/mcp-tools.json](./contracts/mcp-tools.json) | ✅   | 9 個 MCP 工具的 JSON Schema 契約 |
| [quickstart.md](./quickstart.md)                       | ✅   | 開發者快速入門指南               |

---

## Post-Design Constitution Re-Check ✅

| 原則                   | 設計符合度 | 備註                           |
| ---------------------- | ---------- | ------------------------------ |
| I. 簡潔與可維護性      | ✅         | 工具函數單一職責，<200 行      |
| II. 模組化與可擴展性   | ✅         | 工具可動態註冊於 `tools/` 目錄 |
| III. 避免過度開發      | ✅         | 僅實作 spec 定義的 9 個工具    |
| IV. 彈性與適應性       | ✅         | 支援 5 種板卡、15 種語言       |
| V. 研究驅動開發        | ✅         | research.md 完整記錄 API 研究  |
| VI. 結構化日誌         | ✅         | 使用 log.\* 記錄工具調用       |
| VII. 測試覆蓋率        | ✅         | 規劃單元測試 + 整合測試        |
| VIII. 純函數與模組架構 | ✅         | 工具處理函數為純函數           |
| IX. 繁體中文文件標準   | ✅         | 積木字典預設 zh-hant           |
| X. 專業發布管理        | N/A        | 不涉及發布流程                 |

**Post-Design Gate**: ✅ PASSED - 設計符合所有適用原則
