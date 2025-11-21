# Implementation Plan: ESP32 PWM 頻率與解析度設定

**Branch**: `011-esp32-pwm-setup` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-esp32-pwm-setup/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能為 ESP32 開發板新增全域 PWM 頻率與解析度設定積木,允許使用者自訂頻率(1-80000 Hz)和解析度(8-16 bit),以支援需要高頻 PWM 的馬達驅動晶片(如 TB6612、DRV8833 等需要 20-75KHz)。系統將自動驗證參數是否符合 ESP32 硬體限制(頻率 × 2^解析度 ≤ 80,000,000),並在不相容時自動調整解析度至可用值,確保生成的程式碼能在硬體上正常運作。功能透過記憶體中的全域變數儲存配置,並在載入工作區時自動重建,確保向後相容性。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension), JavaScript ES2020 (WebView/Blockly)  
**Primary Dependencies**:

-   Blockly 12.3.1
-   @blockly/theme-modern 7.0.1
-   VSCode Engine 1.96.0+
-   Node.js 22.16.0+
-   Webpack 5.102.1

**Storage**:

-   Workspace state: `{workspace}/blockly/main.json` (不持久化 PWM 配置,透過積木存在重建；載入工作區時由 rebuildPwmConfig 函數掃描積木並重建全域變數，測試任務包含於 Phase 5 User Story 3)
-   PlatformIO config: `{workspace}/platformio.ini` (不受此功能影響)

**Testing**:

-   Unit tests: 使用 Mocha + @vscode/test-electron
-   WebView 互動功能: 手動測試(根據 Constitution Principle VII UI Testing Exception)
-   目標覆蓋率: 100% 核心邏輯（定義：Extension Host 環境中的所有 business logic 和 services；WebView 環境中的驗證函數 validateAndAdjustPwmConfig、程式碼生成器邏輯、全域配置管理函數。積木 UI 互動使用手動測試）

**Target Platform**:

-   VSCode Extension (Node.js runtime)
-   WebView (Chromium browser context)
-   ESP32 硬體(標準 ESP32,非 S2/S3/C3 變體)

**Project Type**: VSCode Extension (Extension Host + WebView 雙環境架構)

**Performance Goals**:

-   程式碼生成: ≤500ms (與現有積木一致)
-   WebView 初始化: ≤2s
-   積木拖曳回應: <100ms

**Constraints**:

-   ESP32 LEDC 硬體限制: 頻率 × 2^解析度 ≤ 80,000,000 (APB_CLK 80MHz)
-   頻率範圍: 1-80000 Hz
-   解析度選項: 8, 10, 12, 13, 14, 15, 16 bit
-   必須與 ESP32Servo 庫(50Hz 伺服馬達)相互獨立運作
-   不可破壞現有專案的向後相容性

**Scale/Scope**:

-   新增 1 個積木定義 (esp32_pwm_setup)
-   修改 1 個程式碼生成器 (arduino_analog_write in io.js)
-   新增約 150-200 行程式碼 (積木定義 + 驗證邏輯 + 生成器修改)
-   影響範圍: ESP32 開發板的類比輸出功能
-   多語言支援: 繁體中文、英文(初期),其他語言 Phase 2

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ Principle I: Simplicity and Maintainability

-   **Status**: PASS
-   **Assessment**: 功能設計簡單直接,僅新增一個積木和修改現有生成器。使用記憶體全域變數而非複雜的狀態管理。驗證邏輯清晰(頻率 × 2^解析度 ≤ 80,000,000)。
-   **Evidence**:
    -   單一積木負責配置 (esp32_pwm_setup)
    -   複用現有的 arduino_analog_write 積木
    -   自動調整邏輯使用簡單的數學驗證

### ✅ Principle II: Modularity and Extensibility

-   **Status**: PASS
-   **Assessment**: 功能模組化設計,PWM 配置透過全域變數與類比輸出積木解耦。未來可輕鬆擴展支援其他開發板或新增驗證規則。
-   **Evidence**:
    -   配置儲存在 window.esp32PwmFrequency/Resolution
    -   驗證邏輯可獨立於積木定義
    -   不修改其他積木或核心架構

### ✅ Principle III: Avoid Over-Development

-   **Status**: PASS
-   **Assessment**: 僅實作核心需求(頻率/解析度設定),不包含非必要功能如視覺化相容性圖表、每腳位獨立配置等。
-   **Evidence**:
    -   Out of Scope 明確列出不實作項目
    -   使用全域配置而非複雜的每腳位配置
    -   不自動偵測硬體類型

### ✅ Principle IV: Flexibility and Adaptability

-   **Status**: PASS
-   **Assessment**: 設計支援多種頻率(1-80000Hz)和解析度(8-16 bit)組合,自動調整機制適應不同使用場景。向後相容現有專案。
-   **Evidence**:
    -   預設值確保向後相容(75000Hz / 8bit)
    -   自動調整機制處理不相容配置
    -   與伺服馬達積木相互獨立

### ✅ Principle V: Research-Driven Development

-   **Status**: PASS (Phase 0 will verify)
-   **Assessment**: 需在 Phase 0 使用 MCP 工具驗證 ESP32 LEDC API、硬體限制公式和最佳實踐。
-   **Required Research**:
    -   ESP32 LEDC API 文件 (ledcSetup/ledcWrite 參數)
    -   ESP32 硬體限制的官方驗證 (80MHz APB_CLK 限制)
    -   TB6612/DRV8833 馬達驅動晶片 PWM 頻率需求
    -   Blockly 12.3.1 欄位下拉選單 API

### ✅ Principle VI: Structured Logging

-   **Status**: PASS
-   **Assessment**: 使用 log.error/info 記錄程式碼生成錯誤,在 WebView 使用 console.log。
-   **Evidence**:
    -   參考現有 io.js 的錯誤處理模式
    -   積木生成器中的 try-catch 使用 log.error

### ✅ Principle VII: Comprehensive Test Coverage

-   **Status**: PASS (with UI Testing Exception)
-   **Assessment**: 核心邏輯(驗證公式、自動調整)可達 100% 覆蓋率。WebView 積木拖曳使用手動測試。
-   **Test Strategy**:
    -   Unit tests: 頻率驗證函數、自動調整邏輯、程式碼生成器
    -   Integration tests: 工作區載入時重建全域變數
    -   Manual tests: 積木拖曳、UI 回饋、實體硬體驗證
-   **Exception Justification**: 符合 Constitution Principle VII UI Testing Exception - 積木 UI 互動複雜度高,手動測試投資報酬率優於自動化。

### ✅ Principle VIII: Pure Functions and Modular Architecture

-   **Status**: PASS
-   **Assessment**: 驗證邏輯為純函數(輸入頻率/解析度,輸出調整結果),副作用(setupCode\_ 修改)隔離在生成器中。
-   **Evidence**:
    -   驗證函數可獨立測試
    -   程式碼生成器職責單一
    -   全域變數僅用於跨積木協調

### ✅ Principle IX: Traditional Chinese Documentation Standard

-   **Status**: PASS
-   **Assessment**: spec.md 和 plan.md 已使用繁體中文撰寫。
-   **Evidence**: 所有使用者故事、需求、計畫文件皆為繁體中文

### 總結

**GATE STATUS**: ✅ **PASS** - 功能設計符合所有憲法原則,可進入 Phase 0 研究階段。

## Project Structure

### Documentation (this feature)

```text
specs/011-esp32-pwm-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── esp32-pwm-api.md # PWM 配置 API 和驗證規則定義 (由開發者在 Phase 2 實作前手動建立，或在 Phase 0 研究階段同步撰寫)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# VSCode Extension 專案結構
media/
├── blockly/
│   ├── blocks/
│   │   ├── arduino.js            # [修改] 新增 esp32_pwm_setup 積木定義
│   │   └── board_configs.js      # [不變] ESP32 配置已存在
│   └── generators/
│       └── arduino/
│           └── io.js             # [修改] arduino_analog_write 生成器支援全域 PWM 配置
├── toolbox/
│   └── categories/
│       └── arduino.json          # [修改] 新增 esp32_pwm_setup 積木到工具箱
├── locales/
│   ├── zh-hant/
│   │   └── messages.js           # [修改] 繁體中文翻譯
│   └── en/
│       └── messages.js           # [修改] 英文翻譯
└── js/
    └── blocklyEdit.js            # [可能修改] 工作區載入時重建全域變數邏輯

src/
└── test/
    └── suite/
        ├── pwm-validation.test.ts     # [新增] PWM 驗證邏輯單元測試
        └── code-generation.test.ts    # [修改] 新增 ESP32 PWM 程式碼生成測試
```

**Structure Decision**: 採用 VSCode Extension 單一專案結構,程式碼分為 Extension Host (src/) 和 WebView (media/) 兩個執行環境。此功能主要在 WebView 環境中實作(Blockly 積木和生成器),測試在 Extension Host 環境執行。

## Complexity Tracking

**本功能無憲法違規項目,不需要 Complexity Tracking 表格。**

所有設計決策符合 Simplicity、Modularity、Avoid Over-Development 原則,未引入不必要的複雜度。
