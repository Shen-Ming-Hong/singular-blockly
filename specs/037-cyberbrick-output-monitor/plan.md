# Implementation Plan: CyberBrick Output Monitor

**Branch**: `037-cyberbrick-output-monitor` | **Date**: 2026-01-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/037-cyberbrick-output-monitor/spec.md`

## Summary

為 CyberBrick (MicroPython) 板提供 Serial Monitor 功能，讓使用者能即時查看裝置的 `print()` 輸出。技術方案使用 VSCode Terminal API 配合 `mpremote` 工具的 `repl` 命令建立持久的串流連線，複用現有 `MicropythonUploader` 的 mpremote 安裝檢查與埠偵測邏輯。

## Technical Context

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: VSCode API 1.105.0+, mpremote (via PlatformIO Python)  
**Storage**: N/A（無持久化需求）  
**Testing**: Mocha + Sinon + @vscode/test-electron  
**Target Platform**: VSCode Extension (Windows/macOS/Linux)  
**Project Type**: Single (VSCode Extension + WebView)  
**Performance Goals**: 終端機開啟 <2 秒，輸出延遲 <1 秒  
**Constraints**: 需自動處理埠衝突（上傳時關閉 Monitor）  
**Scale/Scope**: 單一 CyberBrick 裝置監控

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Check (Phase 0)

| 原則                     | 狀態      | 說明                                                    |
| ------------------------ | --------- | ------------------------------------------------------- |
| I. 簡單性與可維護性      | ✅ 通過   | 新增單一服務檔案，複用現有 MicropythonUploader 邏輯     |
| II. 模組化與擴展性       | ✅ 通過   | SerialMonitorService 獨立模組，透過 messageHandler 整合 |
| III. 避免過度開發        | ✅ 通過   | 僅實作唯讀監控，REPL 互動模式列為 Out of Scope          |
| IV. 靈活性與適應性       | ✅ 通過   | 使用 mpremote 抽象底層串口通訊                          |
| V. 研究驅動開發          | ✅ 通過   | 需研究 VSCode Terminal API 與 mpremote run 命令         |
| VI. 結構化日誌           | ✅ 通過   | 使用 log() 函數紀錄 Monitor 生命週期事件                |
| VII. 全面測試覆蓋        | ⚠️ 需注意 | Terminal API 需 mock，埠偵測需整合測試                  |
| VIII. 純函數與模組化架構 | ✅ 通過   | 狀態管理集中在 SerialMonitorService                     |
| IX. 繁體中文文件標準     | ✅ 通過   | 所有規格文件使用繁體中文                                |
| X. 專業發布管理          | ✅ 通過   | CHANGELOG 將記錄新功能                                  |
| XI. Agent Skills 架構    | ✅ 通過   | 無需新增技能                                            |

### Post-Design Check (Phase 1)

| 原則                     | 狀態    | 說明                                                      |
| ------------------------ | ------- | --------------------------------------------------------- |
| I. 簡單性與可維護性      | ✅ 通過 | SerialMonitorService 約 120 行，職責單一明確              |
| II. 模組化與擴展性       | ✅ 通過 | 清晰的介面設計 (start/stop/isRunning)，可獨立測試         |
| III. 避免過度開發        | ✅ 通過 | 複用 MicropythonUploader，避免重複實作埠偵測邏輯          |
| IV. 靈活性與適應性       | ✅ 通過 | 訊息協定設計允許未來擴展（如 REPL 模式）                  |
| V. 研究驅動開發          | ✅ 通過 | research.md 完整記錄 VSCode Terminal API 與 mpremote 決策 |
| VI. 結構化日誌           | ✅ 通過 | quickstart.md 範例程式碼使用 log() 函數                   |
| VII. 全面測試覆蓋        | ✅ 通過 | 設計支援 DI，可透過 mock 測試 Terminal API                |
| VIII. 純函數與模組化架構 | ✅ 通過 | 狀態封裝在 SerialMonitorService，無全域狀態               |
| IX. 繁體中文文件標準     | ✅ 通過 | 所有產出文件使用繁體中文                                  |
| X. 專業發布管理          | ✅ 通過 | i18n 鍵定義完整，支援 15 語言翻譯                         |
| XI. Agent Skills 架構    | ✅ 通過 | 無需新增技能                                              |

**Post-Design 結論**: 所有原則通過，無違規需要追蹤。

## Project Structure

### Documentation (this feature)

```text
specs/037-cyberbrick-output-monitor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── webview-messages.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── serialMonitorService.ts   # [NEW] Monitor 核心服務
│   └── micropythonUploader.ts    # [MODIFY] 新增埠衝突處理
├── webview/
│   └── messageHandler.ts         # [MODIFY] 新增 Monitor 訊息處理
└── types/
    └── arduino.ts                # [MODIFY] 新增 Monitor 相關型別

media/
├── js/
│   └── blocklyEdit.js            # [MODIFY] 新增 Monitor 按鈕邏輯
├── css/
│   └── blocklyEdit.css           # [MODIFY] 新增 Monitor 按鈕樣式
└── locales/
    └── {15 languages}/messages.js # [MODIFY] 新增 Monitor i18n 鍵

src/test/
├── suite/
│   └── serialMonitorService.test.ts  # [NEW] 單元測試
└── integration/
    └── serialMonitor.test.ts         # [NEW] 整合測試
```

**Structure Decision**: 採用 Option 1 (Single project) 結構。新增 `SerialMonitorService` 作為獨立服務模組，遵循現有 `MicropythonUploader` 的設計模式，透過 `messageHandler.ts` 處理 WebView 訊息。

## Complexity Tracking

> 無 Constitution Check 違規，此表格保留為空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| -         | -          | -                                    |
