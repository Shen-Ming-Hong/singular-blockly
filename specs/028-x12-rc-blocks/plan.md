# Implementation Plan: CyberBrick X12 與 RC 遙控積木

**Branch**: `028-x12-rc-blocks` | **Date**: 2026-01-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/028-x12-rc-blocks/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

新增 CyberBrick X12 Remote Control Transmitter Shield 積木選單與獨立 RC 遙控通訊選單。X12 選單提供發射端本機搖桿/按鈕讀取功能，RC 選單提供無線遙控通訊功能（Master/Slave 初始化、遠端資料讀取、連線狀態查詢）。參考現有 X11 擴展板積木實現模式，使用 MicroPython `rc_module` API 生成程式碼。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) + JavaScript (Blockly blocks/generators)  
**Primary Dependencies**: Blockly 12.3.1, VSCode API 1.105.0+, MicroPython `rc_module` API  
**Storage**: N/A (使用現有 blockly/main.json 儲存工作區狀態)  
**Testing**: 手動測試 (WebView 互動功能按 Constitution Principle VII 例外)  
**Target Platform**: VSCode Extension (CyberBrick 開發板 MicroPython 執行環境)
**Project Type**: VSCode Extension (Two-Context System: Extension Host + WebView)  
**Performance Goals**: 積木拖放和程式碼生成延遲 < 100ms  
**Constraints**: 必須支援 15 種語言 i18n、僅限 CyberBrick 板使用 (MicroPython only)  
**Scale/Scope**: 新增 12 個積木 (8 RC + 4 X12)、2 個新選單類別、約 15 個新 i18n keys × 15 種語言

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態    | 說明                                                        |
| ---------------------- | ------- | ----------------------------------------------------------- |
| I. 簡潔性與可維護性    | ✅ 通過 | 遵循現有 X11 積木模式，程式碼結構清晰，每個積木職責單一     |
| II. 模組化與可擴展性   | ✅ 通過 | 新增獨立的 x12.js 和 rc.js 檔案，不修改核心邏輯             |
| III. 避免過度開發      | ✅ 通過 | 僅實現規格中定義的 12 個積木，無額外功能                    |
| IV. 彈性與適應性       | ✅ 通過 | 使用 i18n 支援 15 種語言，遵循 JSON 配置驅動的 toolbox      |
| V. 研究驅動開發        | ✅ 通過 | 參考現有 X11 實現和 CyberBrick rc_module API 文件           |
| VI. 結構化日誌         | ✅ 通過 | 使用 console.log('[blockly]') 模式 (WebView 環境)           |
| VII. 全面測試覆蓋      | ⚠️ 例外 | WebView 互動功能使用手動測試 (按 UI Testing Exception 規定) |
| VIII. 純函式與模組架構 | ✅ 通過 | 積木定義和生成器為無副作用的純函式                          |
| IX. 繁體中文文件標準   | ✅ 通過 | 所有規格和計劃文件使用繁體中文撰寫                          |
| X. 專業版本管理        | N/A     | 此功能開發階段不涉及版本發布                                |

## Project Structure

### Documentation (this feature)

```text
specs/028-x12-rc-blocks/
├── spec.md              # 功能規格 (已完成)
├── plan.md              # 本實作計劃
├── research.md          # Phase 0 研究輸出
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速入門
├── contracts/           # Phase 1 積木 API 合約
│   ├── rc-blocks.json   # RC 選單積木定義
│   └── x12-blocks.json  # X12 選單積木定義
└── tasks.md             # Phase 2 任務清單 (由 /speckit.tasks 產生)
```

### Source Code (repository root)

```text
media/blockly/
├── blocks/
│   ├── x12.js           # 新增: X12 積木定義 (發射端本機讀取)
│   └── rc.js            # 新增: RC 積木定義 (無線遙控通訊)
└── generators/micropython/
    ├── x12.js           # 新增: X12 MicroPython 生成器
    └── rc.js            # 新增: RC MicroPython 生成器

media/toolbox/
├── cyberbrick.json      # 修改: 引入新選單類別
└── categories/
    ├── cyberbrick_x12.json  # 新增: X12 選單配置
    └── cyberbrick_rc.json   # 新增: RC 選單配置

media/locales/
└── {15 languages}/
    └── messages.js      # 修改: 新增 i18n keys (X12_*, RC_*, CATEGORY_X12, CATEGORY_RC)

media/html/
└── blocklyEdit.html     # 修改: 引入新 blocks/generators JS 檔案
```

**Structure Decision**: 遵循現有 CyberBrick X11 模組結構，將 X12 和 RC 分離為獨立檔案以符合模組化原則。RC 是無線通訊功能，X12 是硬體擴展板功能，兩者職責不同故分開實作。

## Complexity Tracking

> **無違規需要記錄** - 本功能完全遵循現有架構模式，無需複雜度例外。

| 違規 | 為何需要 | 更簡單的替代方案被拒絕的原因 |
| ---- | -------- | ---------------------------- |
| (無) | -        | -                            |

---

## Phase 1 設計完成後重新評估

### Constitution Check (Post-Design)

| 原則                   | 狀態    | 設計階段驗證                                                               |
| ---------------------- | ------- | -------------------------------------------------------------------------- |
| I. 簡潔性與可維護性    | ✅ 確認 | 積木定義遵循現有 X11 模式，程式碼結構簡潔清晰                              |
| II. 模組化與可擴展性   | ✅ 確認 | 獨立檔案結構 (rc.js, x12.js) 符合模組化設計                                |
| III. 避免過度開發      | ✅ 確認 | 僅定義規格中的 12 個積木，無額外功能                                       |
| IV. 彈性與適應性       | ✅ 確認 | i18n 鍵值設計完整，支援 15 種語言擴展                                      |
| V. 研究驅動開發        | ✅ 確認 | research.md 完整記錄 API 研究和決策理由                                    |
| VI. 結構化日誌         | ✅ 確認 | 程式碼範本使用 console.log('[blockly]') 模式                               |
| VII. 全面測試覆蓋      | ⚠️ 例外 | WebView 互動使用 quickstart.md 定義的手動測試                              |
| VIII. 純函式與模組架構 | ✅ 確認 | 積木生成器為純函式，無副作用                                               |
| IX. 繁體中文文件標準   | ✅ 確認 | 所有文件 (plan.md, research.md, data-model.md, quickstart.md) 使用繁體中文 |

### 設計摘要

-   **Phase 0 輸出**: [research.md](research.md) - 7 項技術決策，無未解決問題
-   **Phase 1 輸出**:
    -   [data-model.md](data-model.md) - RC 資料結構、實體定義、i18n 鍵值清單
    -   [contracts/rc-blocks.json](contracts/rc-blocks.json) - 8 個 RC 積木 API 合約
    -   [contracts/x12-blocks.json](contracts/x12-blocks.json) - 4 個 X12 積木 API 合約
    -   [quickstart.md](quickstart.md) - 快速入門指南與使用情境

### 下一步

執行 `/speckit.tasks` 命令產生 `tasks.md`，進入 Phase 2 實作階段。
