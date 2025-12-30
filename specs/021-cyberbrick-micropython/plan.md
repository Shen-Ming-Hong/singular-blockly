# Implementation Plan: CyberBrick MicroPython 積木支援

**Branch**: `021-cyberbrick-micropython` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/021-cyberbrick-micropython/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援，使用 MicroPython 語言與 mpremote 工具實現一鍵上傳。

**核心功能**:

1. 主板選擇時自動切換工具箱（隱藏 Arduino 積木，顯示 MicroPython 積木）
2. 選擇 CyberBrick 時自動刪除 `platformio.ini`（避免衝突）
3. MicroPython 程式碼生成器
4. 使用 mpremote 上傳程式到 `/app/rc_main.py`
5. 主板切換時自動備份工作區（使用現有 Ctrl+S 機制）
6. 上傳按鈕與現有控制區按鈕樣式一致

**實作順序**: UI/UX 互動正確性 → 程式碼生成 → 上傳功能

## Technical Context

**Language/Version**: TypeScript 5.9.3 + JavaScript (WebView) + MicroPython (生成)  
**Primary Dependencies**: Blockly 12.3.1, VS Code Extension API 1.105.0+, mpremote 1.20+  
**Storage**: `{workspace}/blockly/main.json`（工作區）, `{workspace}/blockly/backups/`（備份）  
**Testing**: Mocha + VS Code Extension Test Framework，目標 80%+ 覆蓋率  
**Target Platform**: VS Code Extension（Windows/macOS/Linux）  
**Project Type**: VS Code Extension + WebView hybrid  
**Performance Goals**: 程式碼生成 <1s（≤100 區塊），上傳 <10s（含重置）  
**Constraints**: 需 PlatformIO 環境（使用其 Python 環境執行 mpremote）  
**Scale/Scope**: 教育用途，核心板 Phase 1 積木約 15-20 個

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Phase 0 檢查

| 原則                   | 狀態    | 說明                                                     |
| ---------------------- | ------- | -------------------------------------------------------- |
| I. 簡潔性與可維護性    | ✅ 通過 | 重用現有架構模式（toolbox 切換、備份機制、按鈕樣式）     |
| II. 模組化與擴展性     | ✅ 通過 | 獨立的 MicroPython 生成器和上傳服務，不影響 Arduino 功能 |
| III. 避免過度開發      | ✅ 通過 | Phase 1 僅核心板功能，擴展板功能推遲到 Phase 2+          |
| IV. 靈活性與適應性     | ✅ 通過 | BoardConfig 擴展支援多語言，工具箱可配置                 |
| V. 研究驅動開發        | ✅ 通過 | 已完成 mpremote、GPIO、官方倉庫研究（見 research.md）    |
| VI. 結構化日誌         | ✅ 通過 | 使用 `[blockly]` 標籤，Extension 使用 `log.*`            |
| VII. 全面測試覆蓋      | ✅ 通過 | 上傳服務 ≥80% 覆蓋，WebView 互動使用手動測試             |
| VIII. 純函數與模組架構 | ✅ 通過 | 上傳服務使用依賴注入，純函數處理程式碼生成               |
| IX. 繁體中文文件標準   | ✅ 通過 | 所有規格文件使用繁體中文                                 |
| X. 專業發布管理        | N/A     | 功能開發階段，不涉及發布                                 |

### Post-Phase 1 Re-check

待設計完成後重新檢查。

## Project Structure

### Documentation (this feature)

```text
specs/021-cyberbrick-micropython/
├── plan.md              # 本檔案 - 實作計畫
├── research.md          # 技術研究（mpremote、GPIO、官方倉庫）
├── data-model.md        # 資料模型定義
├── quickstart.md        # 開發快速入門
├── contracts/           # API 契約
│   └── webview-messages.md  # WebView 訊息協議
└── tasks.md             # 實作任務清單（Phase 2 產出）
```

### Source Code (repository root)

```text
src/
├── extension.ts                    # 擴充功能入口
├── services/
│   ├── fileService.ts              # 檔案操作（重用）
│   ├── settingsManager.ts          # 設定管理（重用）
│   ├── quickSaveManager.ts         # 快速備份（重用）
│   └── micropythonUploader.ts      # [新增] MicroPython 上傳服務
├── webview/
│   ├── webviewManager.ts           # WebView 管理（擴展）
│   └── messageHandler.ts           # 訊息處理（擴展）
└── test/
    ├── micropythonUploader.test.ts # [新增] 上傳服務測試
    └── integration/
        └── boardSwitch.test.ts     # [新增] 主板切換整合測試

media/
├── blockly/
│   ├── blocks/
│   │   ├── board_configs.js        # 主板配置（擴展 cyberbrick）
│   │   └── cyberbrick_*.js         # [新增] CyberBrick 專用積木
│   ├── generators/
│   │   ├── arduino/                # 現有 Arduino 生成器
│   │   └── micropython/            # [新增] MicroPython 生成器
│   │       ├── index.js            # 生成器入口
│   │       ├── logic.js            # 邏輯積木生成
│   │       ├── loops.js            # 迴圈積木生成
│   │       ├── math.js             # 數學積木生成
│   │       ├── text.js             # 文字積木生成
│   │       ├── variables.js        # 變數積木生成
│   │       └── cyberbrick.js       # CyberBrick 專用生成
│   └── themes/                     # 主題（重用）
├── css/
│   └── blocklyEdit.css             # 樣式（擴展上傳按鈕）
├── html/
│   └── blocklyEdit.html            # WebView HTML（擴展）
├── js/
│   └── blocklyEdit.js              # WebView 主邏輯（擴展）
├── locales/
│   └── */messages.js               # 翻譯（新增 CYBERBRICK_* 鍵）
└── toolbox/
    ├── index.json                  # Arduino 工具箱
    └── cyberbrick.json             # [新增] CyberBrick 工具箱
```

**Structure Decision**: 採用現有 VS Code Extension + WebView 混合架構，
新增 `micropython/` 生成器目錄和 `cyberbrick.json` 工具箱，
上傳服務獨立於 `services/micropythonUploader.ts`。

## Complexity Tracking

> 本功能未違反 Constitution，無需額外追蹤。

| 違規項目 | 必要性說明 | 拒絕更簡單替代方案的原因 |
| -------- | ---------- | ------------------------ |
| 無       | -          | -                        |
