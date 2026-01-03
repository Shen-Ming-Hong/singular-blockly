# Implementation Plan: CyberBrick X11 擴展板積木選單

**Branch**: `027-cyberbrick-x11-blocks` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/027-cyberbrick-x11-blocks/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

新增 CyberBrick X11 擴展板的 Blockly 積木選單，支援 S1-S4 伺服馬達（180°/360°）、M1-M2 直流馬達、D1-D2 LED 燈帶控制。使用 CyberBrick MicroPython 韌體內建的 `bbl.servos`、`bbl.motors` 模組及原生 `neopixel` 模組，實現視覺化程式設計到 MicroPython 程式碼的自動生成。平滑移動功能的 `timing_proc()` 呼叫將自動注入，降低使用者學習門檻。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) + JavaScript (WebView/Blockly)  
**Primary Dependencies**: Blockly 12.3.1, VSCode Extension API 1.105.0+  
**Storage**: JSON (workspace state in `blockly/main.json`)  
**Testing**: Mocha + Chai (npm run test), Manual WebView testing  
**Target Platform**: VSCode Extension (跨平台: Windows, macOS, Linux)  
**Project Type**: VSCode Extension (Two-Context: Extension Host + WebView)  
**Performance Goals**: 積木拖放 <100ms 響應，程式碼生成 <500ms  
**Constraints**: 僅限 CyberBrick 開發板顯示 X11 類別，15 語言 i18n 100% 覆蓋  
**Scale/Scope**: 8 種新積木類型，15 語言翻譯，~50 個新 i18n 鍵

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態      | 說明                                             |
| ------------------------------------- | --------- | ------------------------------------------------ |
| I. Simplicity and Maintainability     | ✅ 通過   | 遵循現有 CyberBrick 積木模式，使用清晰的檔案結構 |
| II. Modularity and Extensibility      | ✅ 通過   | 新增獨立的 x11.js 檔案，不修改現有積木           |
| III. Avoid Over-Development           | ✅ 通過   | 僅實作規格書中定義的 8 種積木，無額外功能        |
| IV. Flexibility and Adaptability      | ✅ 通過   | 使用 JSON 配置 Toolbox，支援 i18n                |
| V. Research-Driven Development        | ✅ 通過   | 已研究 bbl.servos/motors API，見 research.md     |
| VI. Structured Logging                | ✅ 通過   | WebView 使用 console.log，符合規範               |
| VII. Comprehensive Test Coverage      | ✅ 通過   | 核心邏輯單元測試，WebView 手動測試               |
| VIII. Pure Functions                  | ✅ 通過   | 生成器為純函式，無副作用                         |
| IX. Traditional Chinese Documentation | ✅ 通過   | 所有文件使用繁體中文                             |
| X. Professional Release Management    | ⏳ 待驗證 | 發布時驗證                                       |

**Post-Design Re-check**: ✅ 所有原則通過

## Project Structure

### Documentation (this feature)

```text
specs/027-cyberbrick-x11-blocks/
├── plan.md              # 本檔案
├── research.md          # Phase 0 研究成果
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速開始指南
├── contracts/           # Phase 1 API 合約
│   └── api.md           # MicroPython 生成器 API 定義
└── tasks.md             # Phase 2 任務分解 (由 /speckit.tasks 生成)
```

### Source Code (repository root)

```text
media/blockly/
├── blocks/
│   └── x11.js                    # [新增] X11 擴展板積木定義
└── generators/
    └── micropython/
        ├── micropython.js        # [修改] finish() 新增 timing_proc 注入
        └── x11.js                # [新增] X11 MicroPython 生成器

media/toolbox/
├── categories/
│   └── cyberbrick_x11.json       # [新增] X11 Toolbox 類別定義
└── cyberbrick.json               # [修改] 引入 cyberbrick_x11.json

media/locales/
├── zh-hant/messages.js           # [修改] 新增 X11 翻譯鍵
├── en/messages.js                # [修改] 新增 X11 翻譯鍵
├── ja/messages.js                # [修改] 新增 X11 翻譯鍵
└── [其他 12 種語言]/messages.js  # [修改] 新增 X11 翻譯鍵

media/html/
└── blocklyEdit.html              # [修改] 引入 x11.js 腳本

src/test/
└── generators/
    └── x11.test.ts               # [新增] X11 生成器單元測試
```

**Structure Decision**: 採用 VSCode Extension 標準結構，新增獨立的 x11.js 檔案於現有 blocks 和 generators 目錄中，符合專案模組化原則。Toolbox 使用 $include 機制引入新類別，遵循現有 cyberbrick_core.json 和 cyberbrick_wifi.json 的模式。

## Complexity Tracking

> **無違規 - 本功能遵循所有 Constitution 原則**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| N/A       | -          | -                                    |
