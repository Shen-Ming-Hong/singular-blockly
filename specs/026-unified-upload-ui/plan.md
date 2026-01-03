# Implementation Plan: 統一 Arduino C++ 與 MicroPython 上傳 UI

**Branch**: `026-unified-upload-ui` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/026-unified-upload-ui/spec.md`

---

## Summary

將 Arduino C++ 的編譯/上傳流程整合到現有的 MicroPython 上傳 UI 框架中。Arduino 模式透過 PlatformIO CLI 執行：有偵測到板子時完整上傳，無板子時僅編譯驗證語法。保持一致的上傳按鈕圖示，透過 Toast 文字區分編譯/上傳階段。

技術實現策略：

1. 新增 `ArduinoUploader` 服務類別處理 PlatformIO CLI 操作
2. 擴展 `messageHandler.ts` 根據板子類型路由上傳請求
3. 修改 WebView UI 統一顯示上傳按鈕並動態更新文字
4. 新增 15 種語系的 i18n 鍵名

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 | JavaScript ES6+  
**Primary Dependencies**: Blockly 12.3.1 | VSCode API 1.105.0+ | PlatformIO CLI  
**Storage**: JSON 檔案 (blockly/main.json, platformio.ini)  
**Testing**: Mocha + Chai (手動測試 WebView 互動)  
**Target Platform**: VSCode Extension (跨平台：Windows, macOS, Linux)  
**Project Type**: VSCode Extension (Two-Context: Extension Host + WebView)  
**Performance Goals**: 編譯時間 < 30 秒，上傳時間 < 90 秒，UI 回應 < 500ms  
**Constraints**: 依賴 PlatformIO 預設安裝路徑，不額外安裝依賴  
**Scale/Scope**: 支援 Arduino Uno/Nano/Mega/ESP32/ESP8266 + CyberBrick

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態    | 說明                                     |
| ---------------------- | ------- | ---------------------------------------- |
| I. 簡潔與可維護性      | ✅ 通過 | 新增獨立 ArduinoUploader 類別，單一職責  |
| II. 模組化與可擴展性   | ✅ 通過 | 使用 IUploader 介面，未來易於擴展新平台  |
| III. 避免過度開發      | ✅ 通過 | 僅實作規格書定義的功能，不預設未來需求   |
| IV. 彈性與適應性       | ✅ 通過 | 支援多種板子類型，動態判斷上傳流程       |
| V. 研究驅動開發        | ✅ 通過 | 已完成 research.md 解決所有技術疑問      |
| VI. 結構化日誌         | ✅ 通過 | 使用現有 log 服務，不引入新日誌方式      |
| VII. 全面測試覆蓋      | ⚠️ 部分 | WebView 互動使用手動測試（符合例外條款） |
| VIII. 純函式與模組架構 | ✅ 通過 | ArduinoUploader 使用依賴注入設計         |
| IX. 繁體中文文件標準   | ✅ 通過 | 所有規格文件使用繁體中文                 |
| X. 專業發布管理        | N/A     | 非發布相關功能                           |

**Constitution Check 結論**: 所有適用原則通過，可進入開發階段。

---

## Project Structure

### Documentation (this feature)

```text
specs/026-unified-upload-ui/
├── plan.md              # 實作計畫（本文件）
├── research.md          # 技術研究（Phase 0 輸出）
├── data-model.md        # 資料模型（Phase 1 輸出）
├── quickstart.md        # 快速開發指南（Phase 1 輸出）
├── contracts/           # API 合約（Phase 1 輸出）
│   └── webview-message-protocol.md
├── tasks.md             # 任務分解（Phase 2 輸出 - 由 /speckit.tasks 建立）
└── checklists/          # 驗收檢查清單
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── micropythonUploader.ts  # 現有 - MicroPython 上傳服務
│   ├── arduinoUploader.ts      # 新增 - Arduino C++ 編譯/上傳服務
│   ├── settingsManager.ts      # 現有 - PlatformIO 設定同步
│   └── fileService.ts          # 現有 - 檔案操作
├── webview/
│   └── messageHandler.ts       # 修改 - 擴展 handleRequestUpload
├── types/
│   └── arduino.ts              # 新增 (可選) - Arduino 類型定義
└── test/
    └── services/
        └── arduinoUploader.test.ts  # 新增 - 單元測試

media/
├── js/
│   └── blocklyEdit.js          # 修改 - UI 邏輯調整
├── html/
│   └── blocklyEdit.html        # 可能微調 - 按鈕顯示邏輯
└── locales/
    ├── bg/messages.js          # 修改 - 新增 i18n 鍵名
    ├── cs/messages.js
    ├── de/messages.js
    ├── en/messages.js
    ├── es/messages.js
    ├── fr/messages.js
    ├── hu/messages.js
    ├── it/messages.js
    ├── ja/messages.js
    ├── ko/messages.js
    ├── pl/messages.js
    ├── pt-br/messages.js
    ├── ru/messages.js
    ├── tr/messages.js
    └── zh-hant/messages.js
```

**Structure Decision**: 採用現有 VSCode Extension 雙環境架構（Extension Host + WebView），新增 `ArduinoUploader` 服務類別與現有 `MicropythonUploader` 平行，透過 `messageHandler.ts` 路由上傳請求。

---

## Complexity Tracking

> 無憲法違規需要解釋。設計符合所有核心原則。

---

## Related Documents

-   [spec.md](spec.md) - 功能規格書
-   [research.md](research.md) - 技術研究
-   [data-model.md](data-model.md) - 資料模型
-   [quickstart.md](quickstart.md) - 快速開發指南
-   [contracts/webview-message-protocol.md](contracts/webview-message-protocol.md) - WebView 訊息協定
