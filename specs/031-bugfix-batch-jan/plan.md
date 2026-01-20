# Implementation Plan: January 2026 Bugfix Batch

**Branch**: `031-bugfix-batch-jan` | **Date**: 2026-01-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/031-bugfix-batch-jan/spec.md`

## Summary

修復四個 bug：(1) 使用 Blockly `maxInstances` 限制主程式積木為單一實例，並動態控制 deletable 狀態允許刪除多餘積木；(2) 使用 `vscode.Uri.file()` 包裝備份預覽路徑；(3) 在還原備份前自動建立 `auto_restore_*` 備份；(4) 建立 Blockly.Msg 翻譯鍵掃描工具並補充缺失翻譯。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) | JavaScript ES6 (WebView)  
**Primary Dependencies**: Blockly 12.3.1 | VSCode API 1.105.0+  
**Storage**: JSON 檔案 (`blockly/main.json`, `blockly/backup/*.json`)  
**Testing**: Mocha + Sinon (單元測試) | 手動測試 (WebView 互動)  
**Target Platform**: VSCode Extension (Windows/macOS/Linux)  
**Project Type**: VSCode Extension (兩層架構：Extension Host + WebView)  
**Performance Goals**: N/A (修復 bug，非效能優化)  
**Constraints**: 保持向後相容，不破壞現有專案檔案格式  
**Scale/Scope**: 4 個獨立 bug 修復，影響約 5 個主要檔案

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                          | 狀態    | 說明                                    |
| --------------------------------------------- | ------- | --------------------------------------- |
| I. Simplicity and Maintainability             | ✅ 通過 | 使用 Blockly 原生 API，無額外複雜性     |
| II. Modularity and Extensibility              | ✅ 通過 | 修改局部化，不影響整體架構              |
| III. Avoid Over-Development                   | ✅ 通過 | 僅修復已知 bug，無新功能                |
| IV. Flexibility and Adaptability              | ✅ 通過 | 支援多開發板、多語言                    |
| V. Research-Driven Development                | ✅ 通過 | 已透過 Context7 查詢 Blockly API 文件   |
| VI. Structured Logging                        | ✅ 通過 | 使用現有 `log()` 函數                   |
| VII. Comprehensive Test Coverage              | ⚠️ 部分 | WebView 互動使用手動測試 (符合例外條款) |
| VIII. Pure Functions and Modular Architecture | ✅ 通過 | 新增函數為純函數                        |
| IX. Traditional Chinese Documentation         | ✅ 通過 | 所有規格文件使用繁體中文                |
| X. Professional Release Management            | N/A     | 待發布時適用                            |
| XI. Agent Skills Architecture                 | N/A     | 未涉及 Agent Skills                     |

**Gate 結論**: 通過。無需 Complexity Tracking。

## Project Structure

### Documentation (this feature)

```text
specs/031-bugfix-batch-jan/
├── plan.md              # 本檔案 - 實作計劃
├── spec.md              # 需求規格
├── research.md          # 技術研究 (Phase 0)
├── data-model.md        # 資料模型 (Phase 1)
├── quickstart.md        # 快速上手 (Phase 1)
├── contracts/           # 介面合約 (Phase 1)
│   ├── webview-messages.md
│   └── blockly-api.md
├── tasks.md             # 工作分解 (Phase 2 - /speckit.tasks)
└── checklists/          # 已存在的檢查清單
    └── requirements.md
```

### Source Code (影響範圍)

```text
媒體/WebView 層
├── media/js/blocklyEdit.js            # Bug 1: maxInstances + deletable 控制
├── media/blockly/blocks/arduino.js    # Bug 1: 添加 setDeletable(false)
└── media/locales/*/messages.js        # Bug 4: 補充 15 語言翻譯鍵

Extension Host 層
└── src/webview/messageHandler.ts      # Bug 2 & 3: URI 修復 + 還原前備份

工具腳本
├── scripts/i18n/scan-blockly-msg.js   # Bug 4: 新建翻譯鍵掃描工具
└── package.json                       # Bug 4: 添加 npm script

測試
└── src/test/messageHandler.test.ts    # Bug 2 & 3: 單元測試更新
```

## Implementation Phases

### Phase 0: Research (已完成)

見 [research.md](research.md)

- ✅ R-001: Blockly `maxInstances` 機制
- ✅ R-002: 動態 `setDeletable()` 控制
- ✅ R-003: VSCode `vscode.Uri.file()` API
- ✅ R-004: 還原前自動備份策略
- ✅ R-005: Blockly.Msg 翻譯鍵掃描策略

### Phase 1: Design & Contracts (已完成)

見 [data-model.md](data-model.md) 和 [contracts/](contracts/)

- ✅ 主程式積木實體定義
- ✅ 自動還原備份命名規則
- ✅ 翻譯鍵結構
- ✅ WebView 訊息合約
- ✅ Blockly API 合約

### Phase 2: Tasks (待執行)

待由 `/speckit.tasks` 生成 [tasks.md](tasks.md)

預估工作項目:

1. **T-001**: 修改 `blocklyEdit.js` 添加 `maxInstances`
2. **T-002**: 實作主程式積木 deletable 動態控制
3. **T-003**: 修復 `handlePreviewBackup()` URI 問題
4. **T-004**: 實作 `handleRestoreBackup()` 還原前備份
5. **T-005**: 建立 `scan-blockly-msg.js` 掃描工具
6. **T-006**: 補充 15 語言翻譯鍵
7. **T-007**: 更新單元測試
8. **T-008**: 執行手動測試驗證

## Risk Assessment

| 風險                        | 影響 | 機率 | 緩解措施                        |
| --------------------------- | ---- | ---- | ------------------------------- |
| maxInstances 影響舊專案載入 | 中   | 低   | 動態 deletable 允許刪除多餘積木 |
| 翻譯鍵遺漏                  | 低   | 中   | 掃描工具全盤檢查                |
| 測試覆蓋不足                | 中   | 低   | 組合單元測試 + 手動測試         |

## Dependencies

- Blockly 12.3.1 (`maxInstances` 選項支援)
- VSCode API 1.105.0+ (`vscode.Uri.file()`)
- Node.js 22.16.0+ (掃描工具執行)

## Complexity Tracking

> 無需填寫 - Constitution Check 無違規

---

## 附錄

### 相關檔案連結

| 檔案                                                           | 說明             |
| -------------------------------------------------------------- | ---------------- |
| [spec.md](spec.md)                                             | 需求規格         |
| [research.md](research.md)                                     | 技術研究         |
| [data-model.md](data-model.md)                                 | 資料模型         |
| [quickstart.md](quickstart.md)                                 | 快速上手         |
| [contracts/webview-messages.md](contracts/webview-messages.md) | WebView 訊息合約 |
| [contracts/blockly-api.md](contracts/blockly-api.md)           | Blockly API 合約 |
