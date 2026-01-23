# Implementation Plan: HuskyLens 積木動態編號輸入

**Branch**: `035-huskylens-dynamic-index` | **Date**: 2026-01-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/035-huskylens-dynamic-index/spec.md`

## Summary

將 HuskyLens「取得方塊」和「取得箭頭」積木的編號欄位從固定數字（`FieldNumber`）改為可接受積木連接（`appendValueInput`），使其能在迴圈中動態掃描所有偵測結果。技術方法參考現有 `pixetto_apriltag_detect` 積木的實作模式。

## Technical Context

**Language/Version**: JavaScript (Blockly blocks/generators) + TypeScript 5.9.3 (Extension)  
**Primary Dependencies**: Blockly 12.3.1, VSCode Extension API 1.105.0+  
**Storage**: N/A（純 UI 與程式碼產生器修改）  
**Testing**: 手動測試（WebView 積木互動）+ 既有 Mocha 單元測試  
**Target Platform**: VSCode Extension (WebView)
**Project Type**: VSCode Extension（Two-Context System: Extension Host + WebView）  
**Performance Goals**: N/A（UI 變更，無效能需求）  
**Constraints**: 積木外觀需維持單行排列（inline mode）  
**Scale/Scope**: 2 個積木定義 + 2 個產生器 + 1 個 toolbox 設定

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity and Maintainability | ✅ Pass | 遵循現有 Pixetto 積木模式，程式碼清晰易懂 |
| II. Modularity and Extensibility | ✅ Pass | 僅修改積木定義與產生器，不影響其他模組 |
| III. Avoid Over-Development | ✅ Pass | 僅實作使用者要求的功能，無額外開發 |
| IV. Flexibility and Adaptability | ✅ Pass | 使編號欄位更靈活，支援動態值 |
| V. Research-Driven Development | ✅ Pass | 已研究現有 Pixetto 積木實作模式 |
| VI. Structured Logging | N/A | 無新增日誌需求 |
| VII. Comprehensive Test Coverage | ✅ Pass | 手動測試（WebView 互動），符合 UI Testing Exception |
| VIII. Pure Functions | ✅ Pass | 產生器為純函式，無副作用 |
| IX. Traditional Chinese Documentation | ✅ Pass | 本計畫以繁體中文撰寫 |
| X. Professional Release Management | N/A | 非發布相關變更 |
| XI. Agent Skills Architecture | N/A | 無技能相關變更 |

## Project Structure

### Documentation (this feature)

```text
specs/035-huskylens-dynamic-index/
├── plan.md              # 本檔案
├── spec.md              # 功能規格
├── research.md          # Phase 0：研究筆記
├── data-model.md        # Phase 1：資料模型（本功能不適用）
├── quickstart.md        # Phase 1：快速開始指南
├── contracts/           # Phase 1：API 合約（本功能不適用）
├── checklists/          # 品質檢查清單
│   └── requirements.md  # 需求完整性檢查
└── tasks.md             # Phase 2：任務分解
```

### Source Code (修改範圍)

```text
media/blockly/
├── blocks/
│   └── huskylens.js           # 修改：積木定義（FieldNumber → appendValueInput）
└── generators/
    └── arduino/
        └── huskylens.js       # 修改：產生器（getFieldValue → valueToCode）

media/toolbox/
└── categories/
    └── vision-sensors.json    # 修改：新增 shadow block 設定
```

**Structure Decision**: 本功能修改範圍明確，僅涉及 3 個檔案：
1. 積木定義檔案（blocks/huskylens.js）
2. Arduino 產生器檔案（generators/arduino/huskylens.js）
3. 工具箱分類設定（categories/vision-sensors.json）

## Complexity Tracking

> 本功能無需違反 Constitution 原則，無複雜度追蹤項目。
