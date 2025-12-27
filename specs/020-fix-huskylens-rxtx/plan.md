# Implementation Plan: 修正 HuskyLens 積木 RX/TX 標籤顯示

**Branch**: `020-fix-huskylens-rxtx` | **Date**: 2025-12-28 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-fix-huskylens-rxtx/spec.md`

## Summary

修正 HuskyLens UART 積木的 RX/TX 標籤顯示，從原本的「RX 腳位」「TX 腳位」改為「連接 HuskyLens TX →」「連接 HuskyLens RX →」格式，使使用者能直觀理解 Arduino 腳位應連接到 HuskyLens 的哪個腳位。同時根據不同開發板設定智慧預設腳位（ESP32: GPIO16/17, Super Mini: GPIO20/21, AVR: D2/D3）。

## Technical Context

**Language/Version**: JavaScript (ES6+), TypeScript 5.9.3  
**Primary Dependencies**: Google Blockly 12.3.1, VSCode Extension API 1.105.0+  
**Storage**: Workspace JSON 檔案 (`blockly/main.json`)  
**Testing**: 手動測試（WebView 互動）+ i18n 驗證腳本 (`npm run validate:i18n`)  
**Target Platform**: VSCode Extension (跨平台)  
**Project Type**: VSCode 擴充套件（Extension Host + WebView 架構）  
**Performance Goals**: 積木載入 <100ms，標籤顯示即時響應  
**Constraints**: 向後相容舊版 main.json、15 種語言 i18n 支援  
**Scale/Scope**: 單一積木類型 (`huskylens_init_uart`)、15 個語言檔案、1 個積木定義檔案

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態    | 說明                                   |
| ---------------------- | ------- | -------------------------------------- |
| I. 簡潔性和可維護性    | ✅ 通過 | 僅修改標籤文字和預設值，無複雜邏輯     |
| II. 模組化和可擴展性   | ✅ 通過 | 不改變積木結構，僅更新訊息和預設值     |
| III. 避免過度開發      | ✅ 通過 | 專注於核心需求，無額外功能             |
| IV. 靈活性和適應性     | ✅ 通過 | 預設腳位根據開發板動態設定             |
| V. 研究驅動開發        | ✅ 通過 | 已確認 Blockly API 和現有程式碼結構    |
| VI. 結構化日誌         | N/A     | 此功能無日誌需求                       |
| VII. 完整測試覆蓋      | ✅ 通過 | 使用 i18n 驗證腳本 + 手動 WebView 測試 |
| VIII. 純函式和模組架構 | ✅ 通過 | 不引入新的副作用                       |
| IX. 繁體中文文件標準   | ✅ 通過 | 所有文件使用繁體中文                   |
| X. 專業發布管理        | N/A     | 此功能為 Bug 修正，不需獨立發布        |

## Project Structure

### Documentation (this feature)

```text
specs/020-fix-huskylens-rxtx/
├── plan.md              # 本檔案（實施計畫）
├── research.md          # 研究文件
├── data-model.md        # 資料模型
├── quickstart.md        # 快速入門指南
├── contracts/           # API 合約（本功能不需要）
└── tasks.md             # 任務清單（由 /speckit.tasks 建立）
```

### Source Code (repository root)

```text
media/
├── blockly/
│   └── blocks/
│       └── huskylens.js          # HuskyLens 積木定義（修改預設腳位邏輯）
└── locales/
    ├── bg/messages.js            # 保加利亞語
    ├── cs/messages.js            # 捷克語
    ├── de/messages.js            # 德語
    ├── en/messages.js            # 英語
    ├── es/messages.js            # 西班牙語
    ├── fr/messages.js            # 法語
    ├── hu/messages.js            # 匈牙利語
    ├── it/messages.js            # 義大利語
    ├── ja/messages.js            # 日語
    ├── ko/messages.js            # 韓語
    ├── pl/messages.js            # 波蘭語
    ├── pt-br/messages.js         # 巴西葡萄牙語
    ├── ru/messages.js            # 俄語
    ├── tr/messages.js            # 土耳其語
    └── zh-hant/messages.js       # 繁體中文

scripts/
└── i18n/
    └── validate-huskylens.js     # HuskyLens i18n 驗證（無需修改）
```

**Structure Decision**: 使用現有專案結構，修改積木定義檔案和 15 個語言檔案。不需要新增檔案或改變架構。

## Complexity Tracking

> 無違反情況，本功能符合所有 Constitution 原則。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| 無        | -          | -                                    |
