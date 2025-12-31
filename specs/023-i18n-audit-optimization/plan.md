# Implementation Plan: i18n 審計機制優化

**Branch**: `023-i18n-audit-optimization` | **Date**: 2025-12-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/023-i18n-audit-optimization/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能旨在解決 Issue #29 中報告的翻譯誤報問題。主要工作包括：

1. 擴展白名單以涵蓋 CyberBrick 品牌名稱和國際技術縮寫
2. 為 CJK 語言（日文、韓文、繁體中文）放寬長度檢測閾值
3. 將 `culturalMismatch` 檢測嚴重性降級為 `low`
4. 修復俄語翻譯檔案中的變數名稱錯誤（西里爾字母混用問題）

## Technical Context

**Language/Version**: JavaScript (Node.js 22+), TypeScript 5.9.3  
**Primary Dependencies**: Node.js fs 模組、glob 模式匹配  
**Storage**: JSON 檔案 (audit-whitelist.json)、JS 模組 (messages.js)  
**Testing**: 現有翻譯審計腳本 `npm run validate:i18n`  
**Target Platform**: Node.js CLI 腳本、GitHub Actions CI/CD  
**Project Type**: Single project (VSCode Extension)  
**Performance Goals**: 審計腳本執行時間 < 30 秒  
**Constraints**: 零 runtime 依賴新增、向後相容現有白名單格式  
**Scale/Scope**: 15 種語言、約 453 個翻譯 key、5 個審計檢測器

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                             | Status   | Notes                                          |
| ------------------------------------- | -------- | ---------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ PASS  | 僅調整 JSON 設定和修改檢測邏輯閾值，無複雜實作 |
| II. Modularity and Extensibility      | ✅ PASS  | 白名單規則可獨立新增、檢測器為獨立模組         |
| III. Avoid Over-Development           | ✅ PASS  | 僅解決 Issue #29 中報告的具體問題              |
| IV. Flexibility and Adaptability      | ✅ PASS  | 白名單支援 pattern 萬用字元、語言特定規則      |
| V. Research-Driven Development        | ✅ PASS  | 基於 Issue #29 數據分析結果                    |
| VI. Structured Logging                | N/A      | 審計腳本使用現有 logger                        |
| VII. Comprehensive Test Coverage      | ⚠️ CHECK | 可透過 `npm run validate:i18n` 驗證            |
| VIII. Pure Functions                  | ✅ PASS  | 檢測器為純函數設計                             |
| IX. Traditional Chinese Documentation | ✅ PASS  | 本文件使用繁體中文                             |
| X. Professional Release Management    | N/A      | 非發布相關功能                                 |

## Project Structure

### Documentation (this feature)

```text
specs/023-i18n-audit-optimization/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Affected files for this feature
scripts/i18n/
├── audit-whitelist.json              # 白名單設定 (需修改)
├── audit-translations.js             # 審計主程式 (無需修改)
└── lib/
    └── detectors/
        ├── direct-translation.js     # 直接翻譯檢測 (需修改閾值)
        ├── length-overflow.js        # 長度檢測 (需修改閾值)
        ├── cultural-mismatch.js      # 文化不匹配檢測 (需修改嚴重性)
        └── missing-translation.js    # 缺失翻譯檢測 (無需修改)

media/locales/ru/
└── messages.js                       # 俄語翻譯 (需修復變數名稱)

.github/workflows/
└── i18n-validation.yml               # CI 工作流程 (需修改失敗條件)
```

**Structure Decision**: 單一專案結構，現有目錄架構完整支援本功能需求。

## Complexity Tracking

> 本功能無違反 Constitution 原則，不需要額外的複雜度追蹤。
