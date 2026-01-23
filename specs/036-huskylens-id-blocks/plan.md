# Implementation Plan: HuskyLens ID-Based Block Query

**Branch**: `036-huskylens-id-blocks` | **Date**: 2026-01-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/036-huskylens-id-blocks/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

新增三個 HuskyLens 積木，讓使用者可透過指定 ID 直接取得方塊/箭頭資訊，無需迴圈遍歷：

1. **依 ID 請求辨識結果** — 只請求特定 ID 的結果（`huskylens.requestBlocks(ID)`）
2. **依 ID 取得方塊數量** — 取得特定 ID 的方塊數量（`huskylens.countBlocks(ID)`）
3. **依 ID 取得方塊資訊** — 取得特定 ID 第 N 個方塊的屬性（`huskylens.getBlock(ID, index).property`）

技術實作沿用現有 HuskyLens 積木架構，透過 HUSKYLENSArduino 函式庫已提供的 ID-based API。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) + JavaScript ES6 (WebView/Blockly)  
**Primary Dependencies**: Blockly 12.3.1, VSCode API 1.105.0+, HUSKYLENSArduino (Arduino Library)  
**Storage**: N/A（積木定義與程式碼生成，無持久化需求）  
**Testing**: 手動測試為主（WebView 積木拖曳），程式碼生成邏輯可單元測試  
**Target Platform**: VSCode Extension WebView（跨平台 Windows/macOS/Linux）
**Project Type**: single（VSCode Extension）  
**Performance Goals**: 積木組合 < 10 秒（使用者操作時間）  
**Constraints**: 需支援 15 種語言翻譯、僅 Arduino 程式碼生成（無 MicroPython）  
**Scale/Scope**: 新增 3 個積木 + 15 語言翻譯 ≈ 45 個翻譯條目

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態    | 說明                                                      |
| ---------------------- | ------- | --------------------------------------------------------- |
| I. 簡潔與可維護性      | ✅ 通過 | 沿用現有 HuskyLens 積木模式，程式碼結構一致               |
| II. 模組化與可擴展性   | ✅ 通過 | 新積木獨立於現有積木，使用相同抽象層                      |
| III. 避免過度開發      | ✅ 通過 | 僅實作規格中明確要求的 3 個積木                           |
| IV. 彈性與適應性       | ✅ 通過 | ID/INDEX 支援數值輸入，可接受變數或表達式                 |
| V. 研究驅動開發        | ✅ 通過 | 已查詢 HUSKYLENSArduino API 文件確認可用函式              |
| VI. 結構化日誌         | ✅ 通過 | Generator 錯誤使用 log.error()                            |
| VII. 測試覆蓋率        | ⚠️ 例外 | WebView 手動測試（依 Principle VII UI Testing Exception） |
| VIII. 純函式與模組架構 | ✅ 通過 | Generator 函式為純函式，無副作用                          |
| IX. 繁體中文文件標準   | ✅ 通過 | 本計劃與所有規格文件使用繁體中文                          |
| X. 專業發布管理        | N/A     | 此為功能開發，非發布流程                                  |
| XI. Agent Skills 架構  | N/A     | 無需使用 Agent Skills                                     |

**Gate 結果**: ✅ 通過，可進入 Phase 0 研究階段

## Project Structure

### Documentation (this feature)

```text
specs/036-huskylens-id-blocks/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── block-api.md     # 積木 API 規格
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
media/blockly/
├── blocks/
│   └── huskylens.js              # 新增 3 個積木定義
└── generators/arduino/
    └── huskylens.js              # 新增 3 個 Arduino 程式碼生成器

media/toolbox/categories/
└── vision-sensors.json           # 新增積木到 toolbox

media/locales/
├── zh-hant/messages.js           # 繁體中文翻譯
├── en/messages.js                # 英文翻譯
├── ja/messages.js                # 日文翻譯
└── [其他 12 種語言]/messages.js  # 其他語言翻譯
```

**Structure Decision**: 沿用現有 HuskyLens 積木檔案結構，新積木直接加入現有檔案末端

## Complexity Tracking

> **無違規項目** — 所有設計符合 Constitution 原則
