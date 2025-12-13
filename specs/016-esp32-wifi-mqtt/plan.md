# Implementation Plan: ESP32 WiFi/MQTT 積木與修復

**Branch**: `016-esp32-wifi-mqtt` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-esp32-wifi-mqtt/spec.md`

## Summary

本功能包含兩個 P1 等級的 Bug 修復（積木刪除視角重置、text_join 型態轉換）以及三個 P2 等級的新功能（ESP32 WiFi 積木、MQTT 積木、字串轉數字積木）。技術方案採用 Blockly 事件監聽進行視角保持、Arduino String 類型包裝進行類型安全串接、ESP32 WiFi.h 和 PubSubClient 庫實現 IoT 通訊功能。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension), JavaScript ES2022 (WebView/Blockly)  
**Primary Dependencies**:

-   Blockly 12.3.1 (視覺積木引擎)
-   @blockly/theme-modern 7.0.1 (主題)
-   VS Code API 1.105.0+ (擴充功能平台)
-   ESP32 WiFi.h (內建，無需額外依賴)
-   PubSubClient ^2.8 (MQTT 通訊庫)

**Storage**: JSON 檔案（workspace 狀態存於 `{workspace}/blockly/main.json`）  
**Testing**:

-   單元測試：Mocha + Sinon（現有測試架構）
-   整合測試：WebView 手動測試（依據 Constitution 第 VII 條 UI 例外）
-   硬體測試：ESP32 開發板實際部署驗證

**Target Platform**: VSCode 1.105.0+, Windows/macOS/Linux, ESP32/ESP32-C3 開發板  
**Project Type**: VSCode Extension (single project with media assets)  
**Performance Goals**:

-   編譯時間 ≤5s
-   Bundle 大小 ≤137KB
-   視角恢復 debounce 50ms
-   WiFi 連線超時 10 秒

**Constraints**:

-   Blockly 12.x API 相容性
-   15 語言 i18n 完整覆蓋率
-   ESP32 專屬功能不影響 Arduino Uno/Nano/Mega

**Scale/Scope**:

-   新增 12+ 個積木定義
-   新增 60+ 個 i18n 翻譯鍵值（每語言）
-   修改 3 個核心檔案（blocklyEdit.js、text.js、toolbox）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態    | 評估說明                                                           |
| ------------------------------------- | ------- | ------------------------------------------------------------------ |
| I. Simplicity and Maintainability     | ✅ PASS | 所有功能採用既有模式（Block + Generator 雙檔案模式），無新架構引入 |
| II. Modularity and Extensibility      | ✅ PASS | WiFi/MQTT 積木作為獨立模組，不影響既有積木運作                     |
| III. Avoid Over-Development           | ✅ PASS | 僅實作規格書明確要求的功能，無額外擴充                             |
| IV. Flexibility and Adaptability      | ✅ PASS | 透過 board_configs.js 支援多板子配置                               |
| V. Research-Driven Development        | ✅ PASS | 已透過 MCP 工具查詢 Blockly、PubSubClient 文檔                     |
| VI. Structured Logging                | ✅ PASS | WebView 使用 log.\* 結構化日誌                                     |
| VII. Comprehensive Test Coverage      | ✅ PASS | 業務邏輯 100% 覆蓋，UI 採手動測試（Constitution 例外條款）         |
| VIII. Pure Functions                  | ✅ PASS | Generator 函數為純函數，無副作用                                   |
| IX. Traditional Chinese Documentation | ✅ PASS | 所有文檔使用繁體中文                                               |
| X. Professional Release Management    | N/A     | 適用於發布階段                                                     |

**Gate Result**: ✅ 通過 - 可進行 Phase 0 研究

## Project Structure

### Documentation (this feature)

```text
specs/016-esp32-wifi-mqtt/
├── plan.md              # 本檔案（實作計劃）
├── research.md          # Phase 0 輸出（研究發現）
├── data-model.md        # Phase 1 輸出（資料模型）
├── quickstart.md        # Phase 1 輸出（開發者指南）
└── tasks.md             # Phase 2 輸出（任務分解，由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
media/
├── blockly/
│   ├── blocks/
│   │   └── esp32-wifi-mqtt.js    # 新增：WiFi/MQTT 積木定義
│   └── generators/arduino/
│       ├── esp32-wifi-mqtt.js    # 新增：WiFi/MQTT 代碼生成
│       └── text.js               # 修改：修復 text_join
├── js/
│   └── blocklyEdit.js            # 修改：視角保持邏輯
├── toolbox/categories/
│   ├── arduino.json              # 修改：新增 text_to_number
│   └── communication.json        # 新增：WiFi/MQTT 積木類別
└── locales/
    └── {15 languages}/messages.js # 修改：新增翻譯鍵值

src/
└── test/                         # 新增測試（如需）
```

**Structure Decision**: 採用既有單一專案結構，新增積木遵循 Two-File Pattern（Block + Generator），新增工具箱類別 `communication.json` 存放 WiFi/MQTT 積木。

## Complexity Tracking

> 本功能無 Constitution 違規，不需額外說明。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| 無        | N/A        | N/A                                  |
