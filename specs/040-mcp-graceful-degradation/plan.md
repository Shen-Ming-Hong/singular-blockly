# Implementation Plan: MCP Server 優雅降級與 Node.js 依賴處理

**Branch**: `040-mcp-graceful-degradation` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/040-mcp-graceful-degradation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

當使用者電腦沒有安裝 Node.js 時,MCP Server 無法啟動會靜默失敗,導致 AI 輔助功能無法使用且使用者不知原因。本功能實作優雅降級機制,包含:

1. Extension 啟動時檢測 Node.js 可用性與版本(≥22.16.0)
2. 缺失時顯示友善的本地化警告訊息,提供安裝引導
3. 提供自訂 Node.js 路徑設定(支援 nvm/fnm 使用者)
4. 實作診斷命令供使用者與技術支援排查問題
5. 確保 MCP 失敗不影響 Blockly 編輯器核心功能

技術方案採用 `child_process.exec()` 執行 `node --version` 進行檢測,使用 semver 語法進行版本比較,透過 VSCode 設定 API 提供自訂路徑,並將 MCP Provider 註冊改為條件式執行(僅當檢測通過時註冊)。

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js 22.16.0+ (runtime requirement for MCP Server)  
**Primary Dependencies**:

- VSCode API 1.105.0+ (MCP Provider API)
- Node.js child_process (用於執行 `node --version` 檢測)
- 版本比較實作:自行實作 Regex-based 版本解析 (0 依賴策略,見 research.md 決策)
  **Storage**: VSCode workspace settings (`singularBlockly.mcp.nodePath`, `singularBlockly.mcp.showStartupWarning`)  
  **Testing**: Mocha + Sinon + @vscode/test-electron (從 copilot-instructions.md)  
  **Target Platform**: VSCode Extension (Node.js 環境 + Webview)  
  **Project Type**: single (VSCode Extension 架構)  
  **Performance Goals**:
- Node.js 檢測執行時間 < 3 秒
- 診斷命令執行時間 < 3 秒
- Extension 啟動時記憶體增加 < 5MB
  **Constraints**:
- MCP 功能失敗不得阻擋 Blockly 編輯器核心功能
- Extension 啟動時檢測一次並快取結果(不重複執行)
- 診斷命令總是重新檢測以獲取最新狀態
- 支援 15 種語言的本地化訊息
  **Scale/Scope**:
- 單一 VSCode Extension 功能增強
- 3 個新服務類別 (Node.js 檢測、診斷、設定驗證)
- 1 個新命令 (檢查 MCP 狀態)
- 2 個新設定項 (nodePath, showStartupWarning)
- 15 種語言的翻譯新增

**技術決策 (已於 research.md 研究完成)**:

所有技術決策已在 Phase 0 研究階段完成並記錄於 [research.md](./research.md),關鍵決策摘要:

1. **Node.js 檢測方法**: 使用 `child_process.exec()` (promisify),非同步執行避免阻塞 UI
2. **版本比較實作**: 自行實作 Regex-based 版本解析,遵循 0 依賴原則,不使用 semver npm package
3. **VSCode 設定監聽**: 使用 `vscode.workspace.onDidChangeConfiguration` 監聽設定變更並立即驗證
4. **條件式 MCP 註冊**: 在 `extension.ts` 的 `registerMcpProviderIfAvailable()` 中加入 Node.js 前置檢查
5. **路徑驗證策略**: 分階段驗證 - `fs.existsSync()` → `exec("node --version")` → 版本比較

詳細技術選擇理由與替代方案評估請參閱 [research.md](./research.md)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### 核心原則合規性檢查

| 原則                                          | 狀態      | 說明                                                                                                                              |
| --------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| I. Simplicity and Maintainability             | ✅ 符合   | 使用清晰的服務層模式(NodeDetectionService),錯誤訊息本地化且易於理解                                                               |
| II. Modularity and Extensibility              | ✅ 符合   | 新增獨立服務(NodeDetectionService, DiagnosticService),不修改現有 MCP Provider 核心邏輯,僅在入口點增加條件判斷                     |
| III. Avoid Over-Development                   | ✅ 符合   | 解決真實使用者痛點(Node.js 缺失導致靜默失敗),功能範圍明確且必要,避免過度設計                                                      |
| IV. Flexibility and Adaptability              | ✅ 符合   | 支援自訂 Node.js 路徑設定,適應 nvm/fnm 等版本管理器使用者,設定驅動行為                                                            |
| V. Research-Driven Development                | ⚠️ 需遵守 | 需透過 MCP 工具研究: Node.js 檢測最佳實踐、semver 版本比較、VSCode 設定 API 模式                                                  |
| VI. Structured Logging                        | ⚠️ 需遵守 | 所有 Node.js 檢測錯誤、MCP 啟動失敗、診斷資訊都必須使用 `log.*` 方法記錄,不使用 console.log                                       |
| VII. Comprehensive Test Coverage              | ⚠️ 需遵守 | 目標 100% 覆蓋率(最低 90%),需為 NodeDetectionService、DiagnosticService、設定驗證邏輯撰寫完整單元測試。未達 100% 時應記錄剩餘工作 |
| VIII. Pure Functions and Modular Architecture | ⚠️ 需遵守 | 版本比較邏輯應設計為純函數,檢測邏輯與副作用(child_process 呼叫)分離以提升可測試性                                                 |
| IX. Traditional Chinese Documentation         | ✅ 符合   | spec.md 與 plan.md 都使用繁體中文撰寫                                                                                             |
| X. Professional Release Management            | ✅ 無影響 | 此為功能開發階段,不涉及發布流程                                                                                                   |
| XI. Agent Skills Architecture                 | ✅ 無影響 | 此為功能開發,不涉及技能系統擴展                                                                                                   |

### 開發標準合規性

| 標準                | 狀態      | 說明                                                                                           |
| ------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| Code Quality        | ⚠️ 需遵守 | 使用 TypeScript strict mode,遵循 ESLint 規則,函數保持簡短(<50 行)                              |
| File Organization   | ⚠️ 需遵守 | 新服務放在 `src/services/`,測試放在 `src/test/services/`                                       |
| Documentation       | ⚠️ 需遵守 | 更新 README.md(新增 Node.js 需求說明),CHANGELOG.md 記錄功能新增,JSDoc 註解公開 API             |
| Testing Strategy    | ⚠️ 需遵守 | 使用 Mocha + Sinon,模擬 child_process 和 vscode API,避免實際執行 node --version 造成測試不穩定 |
| Git Commit Messages | ⚠️ 需遵守 | 使用 Conventional Commits 格式,描述使用繁體中文,例如 `feat(mcp): 新增 Node.js 檢測與優雅降級`  |

### 結論

**✅ 通過 Constitution Check** - 無原則違反,所有警告項目都是標準遵守提醒,將在實作階段確保合規。

**關鍵風險項目:**

- **測試設計**: 需小心設計 NodeDetectionService 測試,避免實際執行外部命令(使用 Sinon stub)
- **錯誤訊息本地化**: 需為 15 種語言新增翻譯鍵(使用 `npm run validate:i18n` 驗證),所有訊息必須透過 LocaleService 載入
- **MCP Provider 條件註冊**: 需確保改動不破壞現有 MCP 功能(有 Node.js 的使用者體驗不變)
- **測試覆蓋率目標**: 以 100% 為目標,最低 90%。未達 100% 時需在文件中記錄剩餘工作

## Project Structure

### Documentation (this feature)

```text
specs/040-mcp-graceful-degradation/
├── spec.md              # Feature specification (已存在)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - 技術研究報告
├── data-model.md        # Phase 1 output - 資料模型與實體定義
├── quickstart.md        # Phase 1 output - 快速開始指南
└── contracts/           # Phase 1 output - API contracts (設定項、命令介面)
```

### Source Code (repository root)

```text
src/
├── extension.ts                           # [修改] 加入 Node.js 檢測邏輯與條件式 MCP 註冊
├── mcp/
│   └── mcpProvider.ts                     # [修改] 接收 Node.js 檢測結果,條件式註冊
├── services/
│   ├── fileService.ts                     # [現有] 不修改
│   ├── logging.ts                         # [現有] 使用於新服務的日誌記錄
│   ├── settingsManager.ts                 # [現有] 不修改
│   ├── nodeDetectionService.ts            # [新增] Node.js 檢測與版本驗證服務
│   └── diagnosticService.ts               # [新增] MCP 診斷命令實作
├── test/
│   ├── helpers/
│   │   └── mocks.ts                       # [可能修改] 加入 Node.js child_process mock
│   └── services/
│       ├── nodeDetectionService.test.ts   # [新增] Node.js 檢測服務測試
│       └── diagnosticService.test.ts      # [新增] 診斷服務測試
└── types/
    └── nodeDetection.ts                   # [新增] Node.js 檢測結果的 TypeScript 介面

media/
└── locales/                               # [修改] 15 種語言新增訊息鍵
    ├── en/messages.js                     # 新增 ERROR_MCP_NODE_*, config.mcp.*, command.*
    ├── zh-hant/messages.js                # 新增對應繁體中文翻譯
    └── [...other 13 languages]/messages.js

package.json                               # [修改] 新增設定項與命令定義
```

**Structure Decision**: 採用現有的 single project 結構,在 `src/services/` 新增兩個獨立服務:

1. **NodeDetectionService** - 負責 Node.js 檢測、版本驗證、路徑驗證,封裝所有與 child_process 互動的邏輯
2. **DiagnosticService** - 負責收集診斷資訊並格式化為本地化報告,依賴 NodeDetectionService 提供的檢測結果

此結構符合 Principle II (Modularity) 與 Principle VIII (Pure Functions),將副作用(child_process 呼叫)隔離在服務層,核心邏輯(版本比較、路徑驗證)可設計為純函數以利測試。

**檔案修改影響分析**:

- **高風險修改** (需謹慎測試): `extension.ts`, `mcpProvider.ts` - 影響 Extension 啟動流程與 MCP 註冊
- **中風險新增**: `nodeDetectionService.ts` - 涉及外部程序呼叫,需完善錯誤處理
- **低風險新增**: `diagnosticService.ts`, 類型定義, 測試檔案
- **批次修改**: 15 個 `messages.js` 檔案 - 使用 `npm run validate:i18n` 驗證完整性

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**✅ 無違反項目** - 本功能完全符合憲法所有原則,無需複雜度豁免。

**複雜度控制策略**:

- 使用服務層模式(Service Layer Pattern)隔離檢測邏輯,符合 Principle II (Modularity)
- 檢測邏輯封裝為可測試的純函數,符合 Principle VIII (Pure Functions)
- 避免過度設計,僅實作必要功能(Node.js 檢測、警告、診斷),符合 Principle III (Avoid Over-Development)
- 所有新增程式碼預期行數 < 500 行(包含測試),保持專案整體簡潔性

## Phase Progress

### Phase 0: Research ✅ COMPLETED

**完成日期**: 2026-02-04

**產出文件**: [research.md](./research.md)

**技術決策摘要**:

1. **Node.js 檢測方法**: 採用 `child_process.exec()` (promisify),非同步執行避免阻塞 UI
2. **版本比較實作**: 自行實作 Regex-based 版本解析,遵循「避免非必要依賴」原則,不使用 semver npm package
3. **VSCode 設定監聽**: 使用 `vscode.workspace.onDidChangeConfiguration` 監聽 `singularBlockly.mcp.*` 設定變更
4. **條件式 MCP 註冊**: 在 `extension.ts` 的 `activate()` 中加入 Node.js 前置檢查,僅當檢測通過時呼叫 `registerMcpProvider()`
5. **路徑驗證策略**: 多階段驗證 - `fs.existsSync()` 檢查存在性 → `exec("node --version")` 驗證功能性 → 版本比較

**關鍵發現**:

- 現有 `mcpProvider.ts` 設計已支援條件式註冊,不需大幅修改
- `FileService` 與 `SettingsManager` 提供良好的服務層模式參考
- 專案已有 15 種語言國際化基礎建設,可直接擴充

### Phase 1: Design & Contracts ✅ COMPLETED

**完成日期**: 2026-02-04

**產出文件**:

- ✅ [data-model.md](./data-model.md) - 4 個核心實體介面定義
    - `NodeDetectionResult` - Node.js 檢測結果
    - `PathValidationResult` - 路徑驗證結果
    - `McpDiagnosticReport` - 診斷報告
    - `McpSettings` - MCP 設定
- ✅ [contracts/vscode-settings.md](./contracts/vscode-settings.md) - 2 個 VSCode 設定項契約
    - `singularBlockly.mcp.nodePath` - 自訂 Node.js 路徑
    - `singularBlockly.mcp.showStartupWarning` - 啟動警告開關
- ✅ [contracts/vscode-command.md](./contracts/vscode-command.md) - 1 個 VSCode 命令契約
    - `singular-blockly.checkMcpStatus` - 診斷命令
- ✅ [quickstart.md](./quickstart.md) - 開發者快速入門指南
- ✅ Agent 上下文更新 - `.github/agents/copilot-instructions.md` 已更新

**設計亮點**:

- 使用 TypeScript 介面驅動設計 (Interface-Driven Design)
- 錯誤類型枚舉 (`NodeErrorType`) 涵蓋 5 種錯誤場景
- 診斷報告支援多格式輸出 (文字/JSON/純文字)
- 所有使用者訊息設計為可本地化 (15 種語言)

**Constitution Check 再次驗證**:

- ✅ 設計符合所有憲法原則,無新增違反項目
- ✅ 服務介面設計支援依賴注入 (Dependency Injection),便於測試
- ✅ 版本比較邏輯設計為純函數,無副作用

### Phase 2: Tasks & Implementation ✅ COMPLETED

**完成日期**: 2026-02-04

**產出文件**: [tasks.md](./tasks.md)

**任務分解摘要**:

- **總任務數**: 100 個 (T001-T100)
- **預估時間**: 16-18 小時 (單人) | 10-12 小時 (3 人協作)
- **Phase 結構**: 9 個 Phase (Setup → Foundational → User Stories → 國際化 → 文件 → 測試 → Polish)
- **平行執行標記**: 使用 [P] 標記可同時執行的任務
- **User Story 對應**: 明確標記 [US1], [US2], [US3] 以追蹤覆蓋率

**實作策略**:

1. **MVP 優先策略** (僅 User Story 1): Phase 1 → Phase 2 → Phase 3 → 驗證 → 可選國際化與測試
2. **完整功能策略** (所有 User Story): 循序完成 Phase 1-9,每個 User Story 完成後獨立驗證
3. **多人協作策略** (3 位開發者): Foundation ready 後,分工執行 US1/US2/US3

**關鍵里程碑**:

- ✅ Phase 1 (Setup): 型別定義與基礎架構
- ✅ Phase 2 (Foundational): NodeDetectionService + DiagnosticService (阻擋所有 User Story)
- ✅ Phase 3-5: User Story 1 (P1) → User Story 2 (P2) → User Story 3 (P3)
- ✅ Phase 6: 國際化 (15 種語言,32 個翻譯任務可平行)
- ✅ Phase 7: 文件更新 (README, CHANGELOG, copilot-instructions)
- ✅ Phase 8: 測試與品質保證 (目標覆蓋率 >= 90%)
- ✅ Phase 9: Code review 與最終驗證

---

## Summary

✅ **Phase 0 & Phase 1 已完成** - 所有技術研究、資料模型、API 契約、快速入門指南已產生

📋 **已產生文件**:

- `research.md` - 5 個技術決策的詳細研究報告
- `data-model.md` - 4 個核心實體 + 服務介面定義
- `contracts/vscode-settings.md` - 2 個設定項完整規格
- `contracts/vscode-command.md` - 1 個命令完整規格
- `quickstart.md` - 7 步驟完整開發指引 + 測試策略 + FAQ

🔄 **Agent 上下文已更新**:

- TypeScript 5.9.3, Node.js 22.16.0+ 已加入技術堆疊
- VSCode 設定項已加入資料庫描述

🎯 **準備進入 Phase 2**:

- 執行 `@workspace /speckit.tasks` 命令
- 生成詳細的任務分解與實作步驟

**分支**: `040-mcp-graceful-degradation`  
**規格目錄**: `E:\singular-blockly\specs\040-mcp-graceful-degradation\`
