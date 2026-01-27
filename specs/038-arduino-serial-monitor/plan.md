# Implementation Plan: Arduino Serial Monitor 整合

**Branch**: `038-arduino-serial-monitor` | **Date**: 2026-01-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/038-arduino-serial-monitor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

為 Arduino/C++ 開發板添加 Serial Monitor 功能，使用 PlatformIO CLI 的 `pio device monitor` 命令。功能包含：自動從 platformio.ini 讀取 baud rate、ESP32 系列自動啟用崩潰解碼器、上傳流程整合（自動關閉/重啟 Monitor）、與 MicroPython 終端機 UI 保持一致。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode)  
**Primary Dependencies**: VS Code Extension API 1.105.0+, Blockly 12.3.1, PlatformIO CLI  
**Storage**: 專案目錄下的 platformio.ini 設定檔  
**Testing**: Mocha + Sinon，整合 @vscode/test-electron  
**Target Platform**: VS Code Extension (Windows/macOS/Linux)
**Project Type**: VS Code Extension (Extension Host + WebView 雙環境)  
**Performance Goals**: Monitor 開啟/關閉在 3 秒內完成  
**Constraints**: 依賴 PlatformIO CLI 已安裝；ESP32 exception decoder 需要已編譯的 .elf 檔案  
**Scale/Scope**: 支援 5 種 Arduino 語言開發板 (uno, nano, mega, esp32, supermini)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態    | 說明                                                                 |
| ------------------------------------- | ------- | -------------------------------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ PASS | 複用現有 SerialMonitorService 架構，建立平行的 ArduinoMonitorService |
| II. Modularity and Extensibility      | ✅ PASS | 服務分離設計，透過 getBoardLanguage() 路由                           |
| III. Avoid Over-Development           | ✅ PASS | 只實作核心功能，不添加不必要的配置 UI                                |
| IV. Flexibility and Adaptability      | ✅ PASS | 支援多種開發板，自動偵測連接埠和 baud rate                           |
| V. Research-Driven Development        | ✅ PASS | 已研究 PlatformIO CLI 參數和現有程式碼架構                           |
| VI. Structured Logging                | ✅ PASS | 使用 log() 服務進行日誌記錄                                          |
| VII. Comprehensive Test Coverage      | ✅ PASS | 將為 ArduinoMonitorService 編寫單元測試                              |
| VIII. Pure Functions                  | ✅ PASS | platformio.ini 解析為純函式設計                                      |
| IX. Traditional Chinese Documentation | ✅ PASS | 所有規格文件使用繁體中文                                             |
| X. Professional Release Management    | N/A     | 功能完成後納入版本釋出                                               |
| XI. Agent Skills Architecture         | N/A     | 非技能開發任務                                                       |

## Project Structure

### Documentation (this feature)

```text
specs/038-arduino-serial-monitor/
├── plan.md              # 此檔案
├── research.md          # Phase 0 研究結果 ✅ 已完成
├── data-model.md        # Phase 1 資料模型 ✅ 已完成
├── quickstart.md        # Phase 1 快速入門 ✅ 已完成
├── contracts/           # Phase 1 介面合約 ✅ 已完成
│   └── arduino-monitor-service.md
├── checklists/          # 驗證清單
│   └── requirements.md  ✅ 已完成
└── tasks.md             # Phase 2 任務清單 (待 /speckit.tasks 產生)
```

### Source Code (repository root)

```text
src/
├── extension.ts                    # 擴展入口
├── services/
│   ├── arduinoMonitorService.ts    # 【新增】Arduino Monitor 服務
│   ├── serialMonitorService.ts     # 現有 MicroPython Monitor 服務
│   ├── arduinoUploader.ts          # 【修改】整合 Monitor 狀態管理
│   └── index.ts                    # 【修改】匯出新服務
├── types/
│   └── arduino.ts                  # 【修改】新增類型定義
└── webview/
    └── messageHandler.ts           # 【修改】路由 Monitor 訊息

media/
└── js/
    └── blocklyEdit.js              # 【修改】Monitor 按鈕可見性邏輯

src/test/
└── suite/
    └── arduinoMonitorService.test.ts  # 【新增】單元測試
```

**Structure Decision**: 採用現有服務層架構，新增獨立服務類別，避免修改現有 SerialMonitorService

## Complexity Tracking

> 無違反憲法原則，無需記錄複雜度權衡。

---

## Phase 0 Output: Research

詳見 [research.md](research.md)

**關鍵決策**:

- 使用 `pio device monitor` 作為底層工具
- 自動從 platformio.ini 讀取 `monitor_speed`，預設 115200
- ESP32 系列自動啟用 `--filter esp32_exception_decoder`
- 建立獨立 ArduinoMonitorService，與 SerialMonitorService 平行

---

## Phase 1 Output: Design

### 資料模型

詳見 [data-model.md](data-model.md)

**核心實體**:

- `ArduinoMonitorService`: 管理終端機生命週期
- `MonitorStartResult`: 啟動結果
- `MonitorStopReason`: 停止原因列舉
- `ArduinoMonitorConfig`: 配置選項

### 介面合約

詳見 [contracts/arduino-monitor-service.md](contracts/arduino-monitor-service.md)

**主要介面**:

- `IArduinoMonitorService`: 服務介面
- WebView 訊息合約: `startMonitor`, `monitorStarted`, `monitorStopped`, `monitorError`

### 快速入門

詳見 [quickstart.md](quickstart.md)

**實作步驟摘要**:

1. 建立 ArduinoMonitorService 類別
2. 實作 platformio.ini 解析
3. 實作 start() 方法含 ESP32 判斷
4. 更新 messageHandler.ts 路由邏輯
5. 更新 WebView 按鈕可見性
6. 整合上傳流程

---

## Implementation Phases

### Phase A: Core Service (P1 功能)

| 任務                            | 檔案                                    | 預估 |
| ------------------------------- | --------------------------------------- | ---- |
| 建立 ArduinoMonitorService 類別 | `src/services/arduinoMonitorService.ts` | 2h   |
| 實作 start/stop/isRunning 方法  | 同上                                    | 1h   |
| 實作 platformio.ini 解析        | 同上                                    | 0.5h |
| 實作終端機關閉同步              | 同上                                    | 0.5h |
| 更新類型定義                    | `src/types/arduino.ts`                  | 0.5h |
| 匯出新服務                      | `src/services/index.ts`                 | 0.1h |

### Phase B: Integration (P1 功能)

| 任務                    | 檔案                              | 預估 |
| ----------------------- | --------------------------------- | ---- |
| messageHandler 路由邏輯 | `src/webview/messageHandler.ts`   | 1h   |
| WebView 按鈕可見性      | `media/js/blocklyEdit.js`         | 0.5h |
| 上傳流程整合            | `src/services/arduinoUploader.ts` | 1h   |

### Phase C: ESP32 Features (P2 功能)

| 任務                     | 檔案                                    | 預估 |
| ------------------------ | --------------------------------------- | ---- |
| ESP32 板子判斷           | `src/services/arduinoMonitorService.ts` | 0.3h |
| exception decoder filter | 同上                                    | 0.2h |

### Phase D: Testing & Polish

| 任務      | 檔案                                           | 預估 |
| --------- | ---------------------------------------------- | ---- |
| 單元測試  | `src/test/suite/arduinoMonitorService.test.ts` | 2h   |
| 手動測試  | -                                              | 1h   |
| i18n 驗證 | `npm run validate:i18n`                        | 0.5h |

**總預估**: ~11 小時

---

## Dependencies

| 依賴                  | 版本     | 用途                             |
| --------------------- | -------- | -------------------------------- |
| PlatformIO Core CLI   | 任意     | `pio device monitor` 命令        |
| VS Code Extension API | ^1.105.0 | `vscode.window.createTerminal()` |
| Node.js fs/path       | 內建     | 讀取 platformio.ini              |

---

## Risks & Mitigations

| 風險                    | 影響                   | 機率 | 緩解               |
| ----------------------- | ---------------------- | ---- | ------------------ |
| PlatformIO CLI 未安裝   | 功能完全不可用         | 低   | 顯示安裝指引       |
| COM 埠被佔用            | 啟動失敗               | 中   | 顯示錯誤提示       |
| platformio.ini 格式錯誤 | Baud rate 錯誤         | 低   | try-catch + 預設值 |
| ESP32 .elf 不存在       | Exception decoder 無效 | 中   | Filter 仍可運作    |

---

## Success Metrics Tracking

| 指標   | 目標                | 驗證方式                |
| ------ | ------------------- | ----------------------- |
| SC-001 | 3 秒內開啟/關閉     | 手動測試                |
| SC-002 | 上傳額外耗時 <1 秒  | 手動測試                |
| SC-003 | 所有 Arduino 板可用 | 功能測試                |
| SC-004 | ESP32 解碼 100%     | 功能測試                |
| SC-005 | UI 一致性           | 視覺檢查                |
| SC-006 | 15 語言翻譯         | `npm run validate:i18n` |
