# Implementation Plan: 範本名稱多國語言化

**Branch**: `049-sample-name-i18n` | **Date**: 2026-04-06 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/049-sample-name-i18n/spec.md`

---

## Summary

為 CyberBrick MicroPython 範本新增名稱翻譯功能。範本 JSON 頂層加入選填的 `nameTranslations` 物件，存放函式名稱與變數名稱的多語系對照表。Extension Host 在載入範本時呼叫新的純函式 `applyNameTranslations()`，對 Blockly workspace JSON 進行深層複製並替換四類識別字（工作區變數名稱、函式定義名稱、extraState 中的函式呼叫名稱、函式參數名稱），回傳翻譯後的 workspace 傳送至 WebView。

技術方法：正規表達式字串替換（不引入新依賴）+ 三層回退策略（目標語系 → en → 原始名稱）+ Unicode-aware 識別字合法性驗證（FR-005）。

---

## Technical Context

**Language/Version**: TypeScript 5.9.3（VS Code Extension Host，Node.js runtime）  
**Primary Dependencies**: VS Code API（已有）、Blockly workspace JSON（已有）  
**Storage**: `media/samples/*.json`（file-based，Extension Host 透過 `readFileSync` 讀取）  
**Testing**: Mocha + Sinon（`@vscode/test-cli`）  
**Target Platform**: VS Code Extension Host（Node.js 22.16.0+）  
**Project Type**: Library function + data update + skill doc update  
**Performance Goals**: `applyNameTranslations()` 為同步純函式，Soccer Robot 範本（~2000 行）執行時間 < 5ms  
**Constraints**: 零新 npm 依賴；`nameTranslations` 為選填欄位，向後相容舊版範本 JSON  
**Scale/Scope**: 1 個 TypeScript 服務函式 + 1 個現有範本 JSON 更新 + 1 個 SKILL.md 更新

---

## Constitution Check

*所有 Gates 均通過，無需 Complexity Tracking。*

| # | 原則 | 評估結果 | 說明 |
|---|---|---|---|
| I | Simplicity | ✅ 通過 | `applyNameTranslations()` 為單一純函式，不引入新架構層 |
| II | Modularity | ✅ 通過 | 新函式從現有 `sampleBrowserService.ts` 匯出，遵循現有模組邊界 |
| III | Avoid Over-Development | ✅ 通過 | 僅實作 spec 要求的 4 個替換目標，不額外抽象 |
| IV | Flexibility | ✅ 通過 | `nameTranslations` 為選填欄位；不含此欄位的舊範本保持原有行為 |
| V | Research-Driven | ✅ 通過 | extraState XML 模式從原始碼確認；`resolveLanguage()` 簽章已驗證 |
| VI | Structured Logging | ✅ 通過 | 翻譯值不合法時使用 `log()` 記錄警告，不使用 `console.log` |
| VII | Comprehensive Tests | ✅ 通過 | SC-004 要求 6 個測試情境，完整涵蓋三層回退、pure function 特性、識別字驗證 |
| VIII | Pure Functions | ✅ 通過 | `applyNameTranslations()` 輸入物件不被修改，回傳深層複製的新物件 |
| IX | Traditional Chinese Docs | ✅ 通過 | 所有函式 JSDoc 以繁體中文撰寫 |
| X | Professional Release | N/A | 計畫階段不涉及 |
| XI | Agent Skills Architecture | ✅ 通過 | FR-007 更新 `add-cyberbrick-sample/SKILL.md`，插入 Phase 2.5 |

---

## Project Structure

### Documentation (this feature)

```text
specs/049-sample-name-i18n/
├── spec.md                         ✅ 完成
├── plan.md                         ✅ 此檔案
├── research.md                     ✅ 完成（Phase 0 output）
├── data-model.md                   ✅ 完成（Phase 1 output）
├── quickstart.md                   ✅ 完成（Phase 1 output）
├── contracts/
│   └── typescript-interfaces.md   ✅ 完成（Phase 1 output）
├── checklists/
│   └── requirements.md            ✅ 完成
└── tasks.md                       ⬜ 待建立（/speckit.tasks 命令輸出）
```

### Source Code（受影響的檔案）

```text
src/
└── services/
    └── sampleBrowserService.ts          # 新增介面 + 純函式
        ├── NameTranslationEntry（新增）
        ├── NameTranslations（新增）
        ├── SampleWorkspace.nameTranslations？（更新）
        ├── isValidIdentifier()（新增，不匯出）
        └── applyNameTranslations()（新增，匯出）

src/webview/
└── messageHandler.ts                    # handleLoadSelectedSample() 整合翻譯呼叫

src/test/services/
└── sampleBrowserService.test.ts         # 新增 applyNameTranslations 測試 suite

media/samples/
└── cyberbrick-soccer-robot.json         # 新增 nameTranslations 頂層欄位

.github/skills/add-cyberbrick-sample/
└── SKILL.md                             # 插入 Phase 2.5 翻譯指引
```

**Structure Decision**: 單一 VS Code Extension 專案結構。所有新程式碼集中於現有服務檔案，無需新增檔案（測試除外）。

---

## Phase 0：Research（已完成）

**所有 NEEDS CLARIFICATION 已解決。詳見 [research.md](research.md)。**

| 主題 | 決策 |
|---|---|
| extraState XML 替換策略 | 正規表達式字串替換（不引入 XML 解析器）；函式名稱用 ` name="X"` 模式，參數名稱用 `<arg name="X"` 模式 |
| `resolveLanguage()` 使用方式 | 在 `handleLoadSelectedSample()` 中取得解析後語系字串，作為 `string` 傳入純函式，不注入 SettingsManager |
| 深層複製策略 | `JSON.parse(JSON.stringify(workspace))`，與現有 messageHandler.ts L1430 模式一致 |
| 識別字合法性驗證 | `/^[^\d\W]\w*$/u`（Unicode-aware，對應 Python 3 PEP 3131 規則）|
| `nameTranslations` JSON 位置 | 範本 JSON 頂層（與 `workspace`、`board` 並列），不嵌入 workspace 物件 |

---

## Phase 1：Design & Contracts（已完成）

**所有設計文件已產生。**

### 資料模型

詳見 [data-model.md](data-model.md)。

**新增型別**：
- `NameTranslationEntry`：14 個語系的選填 string 欄位 + 索引簽章
- `NameTranslations`：`variables?: Record<string, NameTranslationEntry>` + `functions?: Record<string, NameTranslationEntry>`
- `SampleWorkspace`：新增 `nameTranslations?: NameTranslations` 選填欄位

### 函式合約

詳見 [contracts/typescript-interfaces.md](contracts/typescript-interfaces.md)。

**`applyNameTranslations(workspace, nameTranslations, language): object`**：
- 純函式，回傳深層複製的翻譯後 workspace
- 替換 4 類識別字（見 FR-003）
- 三層回退：目標語系 → en → 原始名稱

### 快速入門

詳見 [quickstart.md](quickstart.md)。提供 Soccer Robot 完整 `nameTranslations` 範例及命名規則說明。

---

## 實作順序（給 /speckit.tasks 使用）

以下為建議的任務拆分順序（從低耦合到高耦合）：

1. **Task 1**：在 `sampleBrowserService.ts` 新增 `NameTranslationEntry`、`NameTranslations` 介面，更新 `SampleWorkspace`
2. **Task 2**：實作 `isValidIdentifier()` 輔助函式（不匯出）
3. **Task 3**：實作 `applyNameTranslations()` 純函式（含遞迴 block 遍歷、三層回退、extraState 替換）
4. **Task 4**：在 `messageHandler.ts` 的 `handleLoadSelectedSample()` 整合呼叫
5. **Task 5**：在 `sampleBrowserService.test.ts` 新增 `applyNameTranslations` 測試 suite（6 個情境：SC-004）
6. **Task 6**：更新 `cyberbrick-soccer-robot.json`，新增完整 `nameTranslations` 欄位（15 個變數 + 5 個參數名 + 12 個函式名）
7. **Task 7**：更新 `add-cyberbrick-sample/SKILL.md`，插入 Phase 2.5 翻譯命名指引

---

## 風險與注意事項

| 風險 | 緩解策略 |
|---|---|
| Soccer Robot extraState 中的函式 `name=` 屬性可能在某些 block 版本有不同空白格式 | 使用 `\sname="X"` 捕捉前置空白，排除 `<arg name>` 誤匹配 |
| 多個積木共用同一函式名稱（定義 + 多個呼叫） | 遞迴遍歷整棵 block 樹，每個積木獨立替換 |
| `zh-hant` 作為目標語系時不應翻譯（原始名稱即中文） | `resolveTranslatedName()` 中：若目標語系為 `zh-hant`，直接回傳原始名稱 |
| nameTranslations 缺少某個工作區變數的翻譯 | 無對應 key 時靜默保留原始名稱（不記錄警告，只有翻譯值不合法才記錄）|
