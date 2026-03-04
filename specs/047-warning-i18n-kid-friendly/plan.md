# Implementation Plan: 非 Blockly 專案警告的 i18n 完善與孩子友善文案改進

**Branch**: `047-warning-i18n-kid-friendly` | **Date**: 2025-07-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/047-warning-i18n-kid-friendly/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

將 Singular Blockly 安全守衛（Safety Guard）的警告對話框、按鈕與回饋訊息，從技術性文案全面改寫為 8-14 歲兒童能理解的親切用語。範圍涵蓋 15 個語系的 7 個訊息鍵值（共 105 筆翻譯文案），以及 `workspaceValidator.ts` 與 `webviewManager.ts` 中的硬編碼後備訊息。技術方法為：僅修改語系檔文案與兩個 TypeScript 檔案中的 fallback 字串，不變更安全守衛的邏輯、偵測機制或使用者偏好儲存流程。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Target ES2023  
**Primary Dependencies**: VS Code Extension API ^1.105.0, Blockly ^12.3.1, 自建 `LocaleService` i18n 服務  
**Storage**: VS Code workspace settings（`singularBlockly.safetyGuard.suppressWarning`）；語系訊息檔 `media/locales/{lang}/messages.js`  
**Testing**: Mocha + Sinon via `@vscode/test-cli`（`npm test` 單元測試、`npm run test:integration` 整合測試）  
**Target Platform**: VS Code Extension（Node.js 環境）  
**Project Type**: VS Code Extension（教育用途的視覺化 Arduino 程式設計擴充套件）  
**Performance Goals**: N/A（僅文案更新，無效能影響）  
**Constraints**: 警告本文 ≤ 200 字元、按鈕文字 ≤ 15 字元、回饋訊息 ≤ 100 字元（依各語系字元計算，符合 VS Code 原生模態對話框排版限制）  
**Scale/Scope**: 15 個語系 × 7 個訊息鍵值 = 105 筆翻譯文案；2 個 TypeScript 檔案的 fallback 字串更新

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 簡潔與可維護性 | ✅ 通過 | 僅修改文字字串，不引入新的架構複雜度 |
| II. 模組化與擴展性 | ✅ 通過 | 沿用既有 `LocaleService` + `messages.js` 模式，不新增模組 |
| III. 避免過度開發 | ✅ 通過 | 僅更新現有訊息文案，不新增功能或語系 |
| IV. 彈性與適應性 | ✅ 通過 | 利用既有 i18n 基礎設施，維持資料驅動的翻譯管理模式 |
| V. 研究驅動開發 | ✅ 通過 | Phase 0 將研究各語系孩子友善用語標準與 VS Code 對話框限制 |
| VI. 結構化日誌 | ✅ 通過 | 本功能不涉及日誌變更 |
| VII. 全面測試覆蓋 | ✅ 通過 | 將新增訊息鍵值一致性測試與字元長度驗證測試 |
| VIII. 純函式與模組架構 | ✅ 通過 | 不變更業務邏輯，僅改動 fallback 字串常量 |
| IX. 繁體中文文件標準 | ✅ 通過 | 所有規劃文件以繁體中文撰寫 |
| X. 專業發布管理 | ✅ 通過 | 文案更新為 MINOR 版本變更 |
| XI. Agent Skills 架構 | ✅ 通過 | 不涉及 Skills 變更 |

**Gate 結果**: ✅ 全部通過，無違規項目，可進入 Phase 0 研究階段。

## Project Structure

### Documentation (this feature)

```text
specs/047-warning-i18n-kid-friendly/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── ui-dialog-contract.md  # VS Code 模態對話框 UI 合約
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── services/
│   └── workspaceValidator.ts    # 安全守衛邏輯 — 修改 catch block fallback 字串
└── webview/
    └── webviewManager.ts        # WebView 管理 — 修改回饋訊息 fallback 參數

media/
└── locales/
    ├── en/messages.js           # 英文（基準語系）— 更新 7 個安全守衛鍵值
    ├── bg/messages.js           # 保加利亞文
    ├── cs/messages.js           # 捷克文
    ├── de/messages.js           # 德文
    ├── es/messages.js           # 西班牙文
    ├── fr/messages.js           # 法文
    ├── hu/messages.js           # 匈牙利文
    ├── it/messages.js           # 義大利文
    ├── ja/messages.js           # 日文
    ├── ko/messages.js           # 韓文
    ├── pl/messages.js           # 波蘭文
    ├── pt-br/messages.js        # 巴西葡萄牙文
    ├── ru/messages.js           # 俄文
    ├── tr/messages.js           # 土耳其文
    └── zh-hant/messages.js      # 繁體中文
```

**Structure Decision**: 此功能不新增任何目錄或檔案結構。所有修改集中在既有的 17 個檔案（15 個語系檔 + 2 個 TypeScript 檔案），符合「避免過度開發」原則。

## Constitution Re-check (Post Phase 1 Design)

*Phase 1 設計完成後的二次檢查：*

| 原則 | 狀態 | 設計後驗證 |
|------|------|-----------|
| I. 簡潔與可維護性 | ✅ 通過 | 設計僅涉及字串修改，data-model 清晰定義 7 個鍵值 |
| II. 模組化與擴展性 | ✅ 通過 | 完全沿用既有 LocaleService 架構，未引入新模組 |
| III. 避免過度開發 | ✅ 通過 | 未新增功能、語系或檔案結構 |
| IV. 彈性與適應性 | ✅ 通過 | 翻譯品質清單允許各語系在地化調整，非強制逐字翻譯 |
| V. 研究驅動開發 | ✅ 通過 | research.md 已完成 6 項研究課題，所有 NEEDS CLARIFICATION 已解決 |
| VI. 結構化日誌 | ✅ 通過 | 不涉及日誌 |
| VII. 全面測試覆蓋 | ✅ 通過 | 規劃了訊息鍵值一致性、占位符驗證、字元長度驗證等自動化測試 |
| VIII. 純函式與模組架構 | ✅ 通過 | 未改變業務邏輯或架構 |
| IX. 繁體中文文件標準 | ✅ 通過 | plan.md、research.md、data-model.md、quickstart.md 皆以繁體中文撰寫 |
| X. 專業發布管理 | ✅ 通過 | 文案更新歸類為 MINOR 版本 |
| XI. Agent Skills 架構 | ✅ 通過 | 不涉及 |

**Post-Design Gate 結果**: ✅ 全部通過。設計方案完全符合憲法所有原則，無違規項目。

## Complexity Tracking

> 本功能無憲法違規項目，無需記錄。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| （無）     | —          | —                                   |
