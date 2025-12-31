# Implementation Plan: i18n 硬編碼字串修復

**Branch**: `024-i18n-hardcode-fix` | **Date**: 2025-12-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-i18n-hardcode-fix/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本功能修復 Extension Host 端的 i18n 國際化問題：

1. 修正英文環境下警告訊息顯示 i18n 鍵名（如 `SAFETY_WARNING_BODY_NO_TYPE`）而非正確翻譯
2. 修正 MicroPython 上傳時進度訊息硬編碼中文
3. 修正備份功能確認對話框硬編碼中文
4. 建立統一 i18n 常數管理機制

技術方案：強化 `LocaleService.getLocalizedMessage()` 的回退鏈（當前語言 → 英文翻譯 → fallback 參數），並將所有硬編碼中文字串改為英文 fallback + i18n 機制。

## Technical Context

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: VSCode Extension API 1.105.0+, Blockly 12.3.1  
**Storage**: JSON 翻譯檔案 (`media/locales/{lang}/messages.js`)  
**Testing**: Mocha + sinon (VSCode Extension Testing)  
**Target Platform**: VSCode Extension (cross-platform: Windows, macOS, Linux)
**Project Type**: VSCode Extension (two-context: Extension Host + WebView)  
**Performance Goals**: 訊息取得 < 10ms（已有快取機制）  
**Constraints**: 支援 15 種語言、需向下相容現有翻譯檔案格式  
**Scale/Scope**: ~50 個新增/修改的 i18n 鍵名

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                   | 狀態    | 說明                                         |
| ---------------------- | ------- | -------------------------------------------- |
| I. 簡潔與可維護性      | ✅ PASS | 新增統一 i18n 常數檔案提升可維護性           |
| II. 模組化與擴展性     | ✅ PASS | LocaleService 已有良好架構，僅需強化回退機制 |
| III. 避免過度開發      | ✅ PASS | 僅修復已報告的問題，不擴展額外功能           |
| IV. 靈活性與適應性     | ✅ PASS | 回退鏈機制支援未來新語言無縫整合             |
| V. 研究驅動開發        | ✅ PASS | 已分析現有程式碼確認問題根源                 |
| VI. 結構化日誌         | ✅ PASS | 不影響現有日誌機制                           |
| VII. 完整測試覆蓋      | ✅ PASS | 需新增 LocaleService 回退鏈測試              |
| VIII. 純函數與模組架構 | ✅ PASS | LocaleService 保持依賴注入模式               |
| IX. 繁體中文文件標準   | ✅ PASS | 本計劃文件使用繁體中文                       |
| X. 專業版本管理        | N/A     | 非版本發布相關                               |

**Gate Status**: ✅ 全部通過

## Project Structure

### Documentation (this feature)

```text
specs/024-i18n-hardcode-fix/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── localeService.ts          # 強化回退鏈機制（主要修改）
│   ├── micropythonUploader.ts    # 進度訊息改用英文 fallback
│   ├── workspaceValidator.ts     # fallback 改為英文
│   └── backupService.ts          # 確認對話框 i18n（若存在）
├── webview/
│   └── messageHandler.ts         # 錯誤/確認訊息 i18n
├── types/
│   └── i18nKeys.ts               # 新增：統一 i18n 常數檔案
└── test/
    └── localeService.test.ts     # 新增回退鏈測試

media/locales/
├── en/messages.js                # 新增缺少的鍵值
├── zh-hant/messages.js           # 新增缺少的鍵值
└── {other-langs}/messages.js     # 新增缺少的鍵值（共 15 種語言）
```

**Structure Decision**: 使用 Option 1 (Single project) 結構，因為這是 VSCode Extension 專案，所有原始碼在 `src/` 下，測試在 `src/test/` 下。

## Complexity Tracking

> 本功能無需違反 Constitution 原則，無複雜度追蹤項目。
