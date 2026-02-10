# Implementation Plan: 上傳錯誤分類與明確提示

**Branch**: `042-upload-error-clarity` | **Date**: 2026-02-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/042-upload-error-clarity/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

在 Arduino 上傳流程中新增硬體偵測前置階段，將上傳失敗錯誤區分為三種明確類別（無硬體、編譯失敗、上傳失敗），每種類別提供本地化的錯誤訊息並附帶技術細節摘要。改動範圍限定於 `ArduinoUploader`（在 `upload()` 流程中新增 `detectDevices()` 前置檢查）、WebView 錯誤處理（`getLocalizedUploadError` 擴展新增錯誤子分類）、以及 15 種語言的 i18n 翻譯新增。CyberBrick (MicroPython) 上傳流程不受影響。

## Technical Context

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: Blockly 12.3.1 | VSCode Extension API 1.105.0+ | PlatformIO CLI  
**Storage**: N/A（無持久化儲存變更）  
**Testing**: Mocha + Sinon（既有框架），依賴注入模式  
**Target Platform**: VSCode Extension（Node.js + WebView）  
**Project Type**: single  
**Performance Goals**: 硬體偵測階段 < 3 秒完成（含 `pio device list` 指令）  
**Constraints**: 不影響 CyberBrick 上傳流程；錯誤訊息技術細節 ≤ 200 字元  
**Scale/Scope**: 影響 3 個核心檔案 + 15 個語言檔案

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態    | 說明                                                                          |
| ---------------------- | ------- | ----------------------------------------------------------------------------- |
| I. 簡單性與可維護性    | ✅ 通過 | 擴展現有 `ArduinoUploader` 和 `getLocalizedUploadError`，無需新增全新模組     |
| II. 模組化與可擴展性   | ✅ 通過 | `detectDevices()` 已存在於 `ArduinoUploader`，錯誤分類通過擴展 stage 映射實現 |
| III. 避免過度開發      | ✅ 通過 | 僅新增使用者明確需要的三種錯誤分類，不新增額外 UI 元件                        |
| IV. 靈活性與適應性     | ✅ 通過 | 錯誤訊息透過 i18n 系統支援 15 種語言                                          |
| V. 研究驅動開發        | ✅ 通過 | 已研究 PlatformIO `device list` 輸出格式和現有錯誤處理模式                    |
| VI. 結構化日誌         | ✅ 通過 | 使用現有 `log()` 函式記錄偵測結果                                             |
| VII. 全面測試覆蓋      | ✅ 通過 | 為新增的偵測邏輯和錯誤分類撰寫單元測試                                        |
| VIII. 純函式與模組架構 | ✅ 通過 | 錯誤分類邏輯為純函式，偵測邏輯已有依賴注入支援                                |
| IX. 繁體中文文件標準   | ✅ 通過 | 本計畫文件使用繁體中文                                                        |
| X. 專業釋出管理        | N/A     | 非釋出相關                                                                    |
| XI. Agent Skills 架構  | N/A     | 不涉及新技能                                                                  |

**Gate 結果**: ✅ 全數通過，無違規需要辯護

## Project Structure

### Documentation (this feature)

```text
specs/042-upload-error-clarity/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── upload-error-flow.md  # 上傳錯誤流程契約
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── arduinoUploader.ts       # 修改：在 upload() 中新增 detectDevices() 前置檢查
├── types/
│   └── arduino.ts               # 修改：新增上傳錯誤細分類型常數
└── webview/
    └── messageHandler.ts        # 無需修改（已正確路由上傳請求）

media/
├── js/
│   └── blocklyEdit.js           # 修改：擴展 getLocalizedUploadError() 錯誤映射
│                                # 新增 detecting/uploading 階段的錯誤子分類
└── locales/
    ├── en/messages.js           # 修改：新增 6 個錯誤訊息 key
    ├── zh-hant/messages.js      # 修改：新增 6 個錯誤訊息 key
    ├── ja/messages.js           # 修改：新增 6 個錯誤訊息 key
    └── (其他 12 種語言)          # 修改：新增 6 個錯誤訊息 key

src/test/
└── suite/
    └── arduinoUploader.test.ts  # 修改：新增偵測階段和錯誤分類測試案例
```

**Structure Decision**: 使用既有專案結構，不新增獨立模組。所有變更均為現有檔案的擴充，符合 Principle I（簡單性）和 Principle III（避免過度開發）。

## Complexity Tracking

> 無 Constitution Check 違規，不需辯護。
