# Implementation Plan: ESP32 Pixetto 程式碼生成修正

**Branch**: `012-esp32-pixetto-fix` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: 修正 ESP32 使用 Pixetto 智慧鏡頭的程式碼生成邏輯

## Summary

修正 `pixetto_init` generator 中缺少開發板類型判斷的問題。參照已正確實作的 `huskylens_init_uart` 模式，在程式碼生成時檢測 ESP32 開發板，並條件性地排除 SoftwareSerial 引用和 AVR 專用 build_flags。

**技術方案**：使用 `window.currentBoard.includes('esp32')` 進行開發板類型判斷，ESP32 時只添加 `#include <Pixetto.h>`，AVR 時維持現有邏輯包含 SoftwareSerial。

## Technical Context

**Language/Version**: JavaScript (ES6+) - WebView 環境  
**Primary Dependencies**: Blockly 12.3.1, arduinoGenerator (自訂程式碼生成器)  
**Storage**: N/A  
**Testing**: 手動測試（WebView 互動，符合 Constitution VII UI Testing Exception）  
**Target Platform**: VSCode Extension WebView  
**Project Type**: VSCode Extension (media/blockly/generators/)  
**Performance Goals**: 即時程式碼生成，無可感知延遲  
**Constraints**: 必須向後相容 Arduino AVR 開發板現有行為  
**Scale/Scope**: 單一檔案修改 (`pixetto.js`)

## Constitution Check

_GATE: 必須在 Phase 0 研究前通過。Phase 1 設計後需重新檢查。_

| 原則                        | 狀態    | 說明                                         |
| --------------------------- | ------- | -------------------------------------------- |
| I. Simplicity               | ✅ Pass | 參照現有 HuskyLens 模式，無新複雜性          |
| II. Modularity              | ✅ Pass | 修改局限於 pixetto.js generator              |
| III. Avoid Over-Development | ✅ Pass | 只修正必要的開發板判斷                       |
| IV. Flexibility             | ✅ Pass | 使用 `includes('esp32')` 支援所有 ESP32 變體 |
| V. Research-Driven          | ✅ Pass | 已透過 GitHub 查證 Pixetto 庫 ESP32 支援     |
| VI. Structured Logging      | ✅ Pass | 使用現有 `log.info/error`                    |
| VII. Test Coverage          | ✅ Pass | WebView UI 測試例外，使用手動測試            |
| VIII. Pure Functions        | ✅ Pass | Generator 函數維持純函數特性                 |
| IX. Traditional Chinese     | ✅ Pass | 文件使用繁體中文                             |

**結論**：無憲法違規，可進入實作階段。

## Project Structure

### Documentation (this feature)

```text
specs/012-esp32-pixetto-fix/
├── plan.md              # 本文件
├── research.md          # ESP32/Pixetto 相容性研究（已完成於對話中）
├── quickstart.md        # 開發者快速指南
├── checklists/
│   └── requirements.md  # 規格品質檢查
└── tasks.md             # Phase 2 任務清單（由 /speckit.tasks 建立）
```

### Source Code (repository root)

```text
media/blockly/generators/arduino/
├── pixetto.js           # 🔧 修改目標：pixetto_init generator
└── huskylens.js         # 📖 參考範本：huskylens_init_uart 實作
```

**Structure Decision**: 此為單一檔案 bug fix，僅修改 `media/blockly/generators/arduino/pixetto.js` 中的 `pixetto_init` generator 函數。

## Implementation Details

### 修改範圍

**檔案**: `media/blockly/generators/arduino/pixetto.js`  
**函數**: `window.arduinoGenerator.forBlock['pixetto_init']`  
**行數**: 約第 48-98 行

### 修改邏輯

```javascript
// 新增：檢測開發板類型
const currentBoard = window.currentBoard || 'uno';
const isESP32 = currentBoard.includes('esp32');

if (isESP32) {
	// ESP32: 不添加 SoftwareSerial，不添加 AVR build_flags
	// Pixetto 庫內部已處理 HardwareSerial
} else {
	// AVR: 維持現有邏輯
	window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';
	// ... build_flags
}
```

### 參考範本

HuskyLens generator (`huskylens.js` 第 183-216 行) 已正確實作：

-   使用 `window.currentBoard.includes('esp32')` 判斷
-   ESP32 分支：使用 HardwareSerial，不添加 SoftwareSerial
-   AVR 分支：添加 SoftwareSerial include

## Manual Test Plan

由於 WebView 互動測試（Constitution VII Exception），採用手動測試：

| 測試案例                   | 步驟                                                                               | 預期結果                                                       |
| -------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ESP32 + Pixetto            | 1. 選擇 ESP32 開發板<br>2. 拖曳 Pixetto 初始化積木<br>3. 檢查生成程式碼            | 不包含 `#include <SoftwareSerial.h>`<br>不包含 AVR build_flags |
| Arduino UNO + Pixetto      | 1. 選擇 Arduino UNO 開發板<br>2. 拖曳 Pixetto 初始化積木<br>3. 檢查生成程式碼      | 包含 `#include <SoftwareSerial.h>`<br>包含 AVR build_flags     |
| ESP32 Super Mini + Pixetto | 1. 選擇 ESP32 Super Mini 開發板<br>2. 拖曳 Pixetto 初始化積木<br>3. 檢查生成程式碼 | 識別為 ESP32，套用 ESP32 邏輯                                  |
| 開發板切換                 | 1. 使用 ESP32 生成程式碼<br>2. 切換至 Arduino UNO<br>3. 重新生成程式碼             | 程式碼正確更新為 AVR 版本                                      |

## Complexity Tracking

> 無憲法違規，此區塊不需要填寫。
