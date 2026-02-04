---
description: 'MCP Server 優雅降級與 Node.js 依賴處理 - 任務分解'
---

# Tasks: MCP Server 優雅降級與 Node.js 依賴處理

**Feature Branch**: `040-mcp-graceful-degradation`  
**Target Version**: v0.60.0  
**Date**: 2026-02-04

**Input**: Design documents from `/specs/040-mcp-graceful-degradation/`

- ✅ plan.md (技術架構與實作計畫)
- ✅ spec.md (用戶故事與需求規格)
- ✅ data-model.md (資料模型定義)
- ✅ research.md (技術決策研究)
- ✅ quickstart.md (開發流程指引)
- ✅ contracts/ (VSCode 設定與命令契約)

**Total Tasks**: 100  
**Estimated Time**: 16-18 hours

---

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: 可平行執行 (不同檔案、無相依性)
- **[Story]**: 任務所屬的用戶故事 (US1, US2, US3)
- 所有路徑皆為專案根目錄的相對路徑

---

## Phase 1: Setup (專案初始化)

**目的**: 建立型別定義與基礎架構

- [ ] T001 建立 TypeScript 型別定義檔案 `src/types/nodeDetection.ts` 包含 NodeDetectionResult, PathValidationResult, McpDiagnosticReport, McpSettings, NodeVersion, NodeErrorType 介面
- [ ] T002 在 `src/types/nodeDetection.ts` 新增常數定義 MIN_NODE_VERSION, MIN_NODE_VERSION_STRING, NODE_DETECTION_CONFIG
- [ ] T003 [P] 在 `src/types/nodeDetection.ts` 定義服務介面 INodeDetectionService, IDiagnosticService
- [ ] T004 執行 `npm run compile` 驗證型別定義無 TypeScript 錯誤

---

## Phase 2: Foundational (基礎服務層)

**目的**: 實作 Node.js 檢測與診斷服務 (阻擋所有 User Story)

**⚠️ CRITICAL**: 此階段必須完成才能進行任何 User Story 實作

- [ ] T005 建立 `src/services/nodeDetectionService.ts` 實作 INodeDetectionService 介面框架
- [ ] T006 在 `src/services/nodeDetectionService.ts` 實作 `parseVersion()` 函數使用正規表示式解析 "v22.16.0" 格式
- [ ] T007 在 `src/services/nodeDetectionService.ts` 實作 `isVersionCompatible()` 函數比較版本號 >= 22.16.0
- [ ] T008 在 `src/services/nodeDetectionService.ts` 實作 `validateNodePath()` 函數使用 fs.existsSync 檢查路徑有效性
- [ ] T009 在 `src/services/nodeDetectionService.ts` 實作 `detectNodeJs()` 函數使用 child_process.exec 執行 node --version 並處理 5 種錯誤類型 (not_found, not_executable, permission, timeout, version_low)
- [ ] T010 在 `src/services/nodeDetectionService.ts` 加入 3 秒逾時保護與 windowsHide: true 設定
- [ ] T011 [P] 建立 `src/services/diagnosticService.ts` 實作 IDiagnosticService 介面框架
- [ ] T012 [P] 在 `src/services/diagnosticService.ts` 實作 `collectDiagnostics()` 函數整合 NodeDetectionService, 檢查 MCP Server bundle (dist/mcp-server.js), VSCode API 版本, 工作區路徑
- [ ] T013 [P] 在 `src/services/diagnosticService.ts` 實作 `formatReport()` 函數生成含 emoji (✅/❌/📁/⚙️) 的本地化文字報告
- [ ] T014 [P] 在 `src/services/diagnosticService.ts` 實作 `formatPlainTextReport()` 函數生成純文字格式 (適合複製到 GitHub Issue)
- [ ] T015 [P] 在 `src/services/diagnosticService.ts` 實作 `copyToClipboard()` 函數使用 vscode.env.clipboard.writeText
- [ ] T016 [P] 在 `src/services/diagnosticService.ts` 實作 `generateRecommendations()` 函數根據錯誤類型生成可操作建議
- [ ] T016a [P] 在 `src/services/nodeDetectionService.ts` 實作錯誤日誌記錄,遵循 FR-005 規格:使用結構化格式包含錯誤類型(NodeErrorType)、nodePath、執行命令、stdout/stderr、時間戳(ISO 8601)、版本號(若可解析)、完整錯誤訊息,日誌等級使用 error/warn
- [ ] T017 執行 `npm run compile` 驗證服務層無編譯錯誤並記錄日誌到 logging.ts

**Checkpoint**: 基礎服務層已完成,可開始 User Story 實作

---

## Phase 3: User Story 1 - Node.js 缺失時的友善警告 (Priority: P1) 🎯 MVP

**Goal**: 當使用者電腦沒有 Node.js 時,Extension 啟動時顯示友善警告訊息並提供安裝引導,同時 Blockly 核心功能不受影響

**Independent Test**: 暫時從 PATH 移除 Node.js 或設定 nodePath 為無效路徑,啟動 Extension 應顯示警告訊息包含「安裝指引」與「稍後提醒」按鈕,點擊「安裝指引」開啟 https://nodejs.org/,點擊「稍後提醒」設定 showStartupWarning 為 false,Blockly 編輯器功能完全正常

### 實作

- [ ] T018 [US1] 在 `src/extension.ts` 建立 `registerMcpProviderIfAvailable()` 函數,加入 Node.js 前置檢測邏輯呼叫 NodeDetectionService.detectNodeJs()
- [ ] T019 [US1] 在 `src/extension.ts` 實作 `showNodeJsWarning()` 函數,使用 vscode.window.showWarningMessage 顯示本地化警告訊息包含兩個按鈕。**所有文字必須透過 LocaleService.getMessage() 取得,不得硬編碼字串**(FR-023)
- [ ] T020 [US1] 在 `showNodeJsWarning()` 中處理「安裝指引」按鈕點擊,使用 vscode.env.openExternal 開啟 https://nodejs.org/
- [ ] T021 [US1] 在 `showNodeJsWarning()` 中處理「稍後提醒」按鈕點擊,使用 vscode.workspace.getConfiguration 將 singularBlockly.mcp.showStartupWarning 設為 false 以永久停用該警告
- [ ] T022 [US1] 在 `registerMcpProviderIfAvailable()` 中讀取 showStartupWarning 設定,僅當為 true 時顯示警告
- [ ] T023 [US1] 在 `registerMcpProviderIfAvailable()` 中加入條件判斷,僅當 Node.js 可用且版本相容時呼叫 registerMcpProvider()
- [ ] T023a [US1] 在 `registerMcpProviderIfAvailable()` 中加入 VSCode API 版本檢查 (vscode.lm.registerMcpServerDefinitionProvider 存在性),確保 VSCode < 1.105.0 時靜默跳過註冊 (FR-026),記錄 info 日誌但不顯示錯誤
- [ ] T024 [US1] 修改 `src/extension.ts` 的 `activate()` 函數,將原有的 MCP Provider 註冊邏輯替換為 registerMcpProviderIfAvailable() 呼叫
- [ ] T025 [US1] 使用 logging.ts 記錄 Node.js 檢測結果與 MCP Provider 註冊狀態 (info/warn 等級)

**Checkpoint**: User Story 1 完成 - Node.js 缺失時顯示友善警告,有 Node.js 時功能正常

---

## Phase 4: User Story 2 - 自訂 Node.js 路徑設定 (Priority: P2)

**Goal**: 進階使用者 (特別是使用 nvm/fnm 的開發者) 可以在 VSCode 設定中指定自訂的 Node.js 可執行檔路徑,Extension 優先使用自訂路徑啟動 MCP Server

**Independent Test**: 在設定中指定 singularBlockly.mcp.nodePath 為有效的 Node.js 路徑,重新啟動 Extension,執行診斷命令應顯示使用該自訂路徑。設定為無效路徑時應立即顯示警告訊息

### 實作

- [ ] T026 [US2] 在 `package.json` 的 contributes.configuration 中新增 singularBlockly.mcp.nodePath 設定項,type: string, default: "node", scope: machine-overridable
- [ ] T027 [US2] 在 `package.json` 的 contributes.configuration 中新增 singularBlockly.mcp.showStartupWarning 設定項,type: boolean, default: true, scope: machine-overridable
- [ ] T028 [US2] 在 `src/extension.ts` 建立 `setupConfigurationListener()` 函數,使用 vscode.workspace.onDidChangeConfiguration 監聽 singularBlockly.mcp 設定變更
- [ ] T029 [US2] 在 `setupConfigurationListener()` 中加入 event.affectsConfiguration('singularBlockly.mcp.nodePath') 檢查
- [ ] T030 [US2] 在 `setupConfigurationListener()` 中讀取新的 nodePath 設定並使用非同步驗證 (async/await),立即呼叫 NodeDetectionService.validateNodePath(),UI 使用 vscode.window.withProgress 顯示驗證進度通知「正在驗證 Node.js 路徑...」以避免阻塞設定介面 (FR-014)
- [ ] T031 [US2] 在 `setupConfigurationListener()` 中根據 PathValidationResult 顯示警告訊息 (無效路徑,格式:「指定的 Node.js 路徑無效:[路徑]。錯誤:[具體錯誤]。請修正路徑或清空設定以使用預設的 'node' 命令。」) 或資訊訊息 (有效路徑)
- [ ] T032 [US2] 修改 `src/extension.ts` 的 `activate()` 函數,加入 setupConfigurationListener(context, nodeDetectionService, localeService) 呼叫
- [ ] T033 [US2] 修改 `registerMcpProviderIfAvailable()` 函數,從設定讀取 nodePath 並傳遞給 detectNodeJs(nodePath)
- [ ] T034 [US2] 使用 logging.ts 記錄設定變更與路徑驗證結果

**Checkpoint**: User Story 2 完成 - 使用者可自訂 Node.js 路徑且設定變更時立即驗證

---

## Phase 5: User Story 3 - MCP 狀態診斷命令 (Priority: P3)

**Goal**: 使用者和開發者可以執行命令面板中的「Singular Blockly: Check MCP Status」命令,查看完整的 MCP Server 診斷資訊,診斷結果可複製到剪貼簿供技術支援使用

**Independent Test**: 執行命令面板 (Ctrl+Shift+P) → 輸入 "MCP Status" → 執行命令,應顯示診斷報告訊息框包含 Node.js 版本/MCP Bundle/VSCode API/工作區路徑/狀態評估/建議,點擊「複製診斷資訊」按鈕應將報告複製到剪貼簿

### 實作

- [ ] T035 [US3] 在 `package.json` 的 contributes.commands 中新增 singular-blockly.checkMcpStatus 命令定義,title: "%command.checkMcpStatus.title%", category: "Singular Blockly"
- [ ] T036 [US3] 在 `src/extension.ts` 的 `registerCommands()` 函數中註冊 singular-blockly.checkMcpStatus 命令處理器
- [ ] T037 [US3] 在命令處理器中使用 vscode.window.withProgress 顯示進度通知「Checking MCP status...」
- [ ] T038 [US3] 在命令處理器中呼叫 DiagnosticService.collectDiagnostics(context.extensionPath) 收集診斷資訊
- [ ] T039 [US3] 在命令處理器中呼叫 DiagnosticService.formatReport(report, { useEmoji: true }) 格式化報告
- [ ] T040 [US3] 在命令處理器中使用 vscode.window.showInformationMessage 顯示格式化報告,附帶「複製診斷資訊」按鈕
- [ ] T041 [US3] 在命令處理器中處理按鈕點擊,呼叫 DiagnosticService.copyToClipboard(report) 並顯示「已複製到剪貼簿」提示
- [ ] T042 [US3] 使用 logging.ts 記錄診斷命令執行與錯誤 (若發生)

**Checkpoint**: User Story 3 完成 - 診斷命令可執行並提供完整報告與複製功能

---

## Phase 6: 國際化 (15 種語言)

**目的**: 為所有新增訊息鍵提供 15 種語言翻譯

- [ ] T043 [P] 在 `package.nls.json` (英文) 新增 command.checkMcpStatus.title, config.mcp.nodePath.description, config.mcp.showStartupWarning.description
- [ ] T044 [P] 在 `package.nls.zh-hant.json` (繁體中文) 新增對應翻譯
- [ ] T045 [P] 在 `package.nls.ja.json` (日文) 新增對應翻譯
- [ ] T046 [P] 在 `package.nls.ko.json` (韓文) 新增對應翻譯
- [ ] T047 [P] 在 `package.nls.es.json` (西班牙文) 新增對應翻譯
- [ ] T048 [P] 在 `package.nls.pt-br.json` (葡萄牙文-巴西) 新增對應翻譯
- [ ] T049 [P] 在 `package.nls.fr.json` (法文) 新增對應翻譯
- [ ] T050 [P] 在 `package.nls.de.json` (德文) 新增對應翻譯
- [ ] T051 [P] 在 `package.nls.it.json` (義大利文) 新增對應翻譯
- [ ] T052 [P] 在 `package.nls.ru.json` (俄文) 新增對應翻譯
- [ ] T053 [P] 在 `package.nls.pl.json` (波蘭文) 新增對應翻譯
- [ ] T054 [P] 在 `package.nls.hu.json` (匈牙利文) 新增對應翻譯
- [ ] T055 [P] 在 `package.nls.tr.json` (土耳其文) 新增對應翻譯
- [ ] T056 [P] 在 `package.nls.bg.json` (保加利亞文) 新增對應翻譯
- [ ] T057 [P] 在 `package.nls.cs.json` (捷克文) 新增對應翻譯
- [ ] T058 [P] 在 `media/locales/en/messages.js` 新增訊息鍵 WARNING_NODE_NOT_AVAILABLE, BUTTON_INSTALL_GUIDE, BUTTON_REMIND_LATER, WARNING_INVALID_NODE_PATH, INFO_NODE_PATH_VALID, PROGRESS_CHECKING_MCP, BUTTON_COPY_DIAGNOSTICS, INFO_COPIED_TO_CLIPBOARD
- [ ] T059 [P] 在 `media/locales/zh-hant/messages.js` 新增對應繁體中文翻譯
- [ ] T060 [P] 在 `media/locales/ja/messages.js` 新增對應日文翻譯
- [ ] T061 [P] 在 `media/locales/ko/messages.js` 新增對應韓文翻譯
- [ ] T062 [P] 在 `media/locales/es/messages.js` 新增對應西班牙文翻譯
- [ ] T063 [P] 在 `media/locales/pt-br/messages.js` 新增對應葡萄牙文-巴西翻譯
- [ ] T064 [P] 在 `media/locales/fr/messages.js` 新增對應法文翻譯
- [ ] T065 [P] 在 `media/locales/de/messages.js` 新增對應德文翻譯
- [ ] T066 [P] 在 `media/locales/it/messages.js` 新增對應義大利文翻譯
- [ ] T067 [P] 在 `media/locales/ru/messages.js` 新增對應俄文翻譯
- [ ] T068 [P] 在 `media/locales/pl/messages.js` 新增對應波蘭文翻譯
- [ ] T069 [P] 在 `media/locales/hu/messages.js` 新增對應匈牙利文翻譯
- [ ] T070 [P] 在 `media/locales/tr/messages.js` 新增對應土耳其文翻譯
- [ ] T071 [P] 在 `media/locales/bg/messages.js` 新增對應保加利亞文翻譯
- [ ] T072 [P] 在 `media/locales/cs/messages.js` 新增對應捷克文翻譯
- [ ] T073 執行 `npm run validate:i18n` 驗證所有語言翻譯完整性
- [ ] T074 執行 `npm run audit:i18n:all` 確保翻譯品質評分 >= 8.0

---

## Phase 7: 文件更新

**目的**: 更新文件以反映新功能與 Node.js 需求

- [ ] T075 [P] 在 `README.md` 的 Requirements 區段明確說明 Node.js 22.16.0+ 為 MCP 功能的必要需求
- [ ] T076 [P] 在 `README.md` 新增 Troubleshooting 區段說明 Node.js 檢測失敗的處理方式與診斷命令使用
- [ ] T077 [P] 在 `CHANGELOG.md` 新增 v0.60.0 區段記錄 Added (MCP 優雅降級功能, Node.js 檢測, 診斷命令, 自訂路徑設定)
- [ ] T078 [P] 更新 `.github/agents/copilot-instructions.md` 加入 NodeDetectionService 與 DiagnosticService 的架構說明

---

## Phase 8: 測試與品質保證

**目的**: 驗證功能正確性與程式碼品質

- [ ] T079 [P] 建立 `src/test/suite/nodeDetectionService.test.ts` 測試 detectNodeJs(), parseVersion(), isVersionCompatible(), validateNodePath() 函數 (10+ 測試場景)
- [ ] T080 [P] 建立 `src/test/suite/diagnosticService.test.ts` 測試 collectDiagnostics(), formatReport(), copyToClipboard() 函數 (5+ 測試場景)
- [ ] T081 [P] 建立 `src/test/integration/mcpGracefulDegradation.test.ts` 測試完整流程 Extension 啟動 → Node.js 檢測 → MCP 註冊 (4+ 測試場景)
- [ ] T082 執行 `npm test` 確保所有測試通過
- [ ] T083 執行 `npm run test:coverage` 驗證測試覆蓋率,目標 100%,最低可接受 90% (Statements, Branches, Functions, Lines)。若未達 100%,記錄剩餘未覆蓋的程式碼區塊與原因
- [ ] T084 執行 `npm run lint` 確保無 ESLint 錯誤
- [ ] T085 手動測試 Node.js 不可用場景 (暫時重命名 node.exe 或設定無效路徑)
- [ ] T086 手動測試診斷命令 (Ctrl+Shift+P → Singular Blockly: Check MCP Status)
- [ ] T087 手動測試自訂路徑設定變更 (設定有效/無效路徑並觀察警告)
- [ ] T088 手動測試 15 種語言介面 (切換 VSCode 語言並驗證訊息正確顯示)
- [ ] T088a-01 [Edge Case] 手動測試:同時缺少 Node.js 和 MCP Server bundle,驗證診斷報告列出兩個問題並按優先級提供建議
- [ ] T088a-02 [Edge Case] 手動測試:Node.js 版本剛好是 22.16.0,驗證視為合格版本且不顯示警告
- [ ] T088a-03 [Edge Case] 手動測試:自訂路徑指向符號連結 (symlink),驗證正確解析並驗證最終可執行檔
- [ ] T088a-04 [Edge Case] 手動測試:Windows 長路徑 (超過 260 字元,使用 \\?\C:\... 格式),驗證自訂路徑設定支援長路徑
- [ ] T088a-05 [Edge Case] 手動測試:多工作區 (Multi-root workspace),驗證 Node.js 缺失警告僅顯示一次,診斷命令顯示主要工作區路徑
- [ ] T088a-06 [Edge Case] 手動測試:權限問題,Node.js 可執行檔存在但無執行權限,驗證顯示「權限不足」錯誤而非「未找到」
- [ ] T088a-07 [Edge Case] 手動測試:中文路徑包含中文字元,驗證自訂路徑正確處理 Windows 路徑編碼問題
- [ ] T088a-08 [Edge Case] 手動測試:使用 nvm/fnm 快速切換 Node.js 版本後重新啟動 VSCode,驗證使用新版本且不快取舊版本資訊
- [ ] T088a-09 [Edge Case] 手動測試:VSCode 版本過低 (< 1.105.0),驗證 MCP Provider 靜默跳過註冊,診斷命令顯示「❌ VSCode API 版本過低」
- [ ] T088a-10 [Edge Case] 手動測試:離線環境,點擊「安裝 Node.js」按鈕驗證顯示「無法開啟瀏覽器,請手動訪問 https://nodejs.org/」訊息
- [ ] T088a-11 [Edge Case] 手動測試:Extension 更新後 MCP Server bundle 改變,驗證重新啟動後使用新 bundle,檢測邏輯不快取檔案狀態
- [ ] T088b [SC-011] 手動測試離線環境診斷命令:中斷網路連線後執行診斷命令,驗證仍能正常顯示本地化報告且不依賴網路。點擊「安裝 Node.js」按鈕驗證顯示適當的離線提示訊息
- [ ] T088c [SC-008] 驗證診斷報告品質:模擬 10 個常見 MCP 問題場景 (1.Node.js 未安裝 2.版本過低 3.路徑錯誤 4.bundle 缺失 5.權限問題 6.VSCode版本過低 7.多個問題同時存在 8.符號連結路徑 9.長路徑 10.中文路徑),執行診斷命令並收集報告,驗證每個場景的報告都能直接識別根本原因且提供可操作建議,記錄驗證結果於測試報告中

---

## Phase 9: Polish & 最終驗證

**目的**: 程式碼優化與發布準備

- [ ] T089 Code review - 檢查所有新增檔案遵循 TypeScript strict mode 與 ESLint 規則。**額外檢查項目**(FR-023, FR-024):1) 驗證所有使用者可見文字都透過 LocaleService.getMessage() 或 vscode.l10n.t() 取得,無硬編碼字串 2) 驗證所有訊息鍵遵循命名慣例 (ERROR*MCP*_, config.mcp._, command.\*.title) 3) 驗證 15 種語言翻譯檔案的鍵名一致性
- [ ] T090 Code review - 確保所有 console.log 已替換為 logging.ts 的 log() 方法
- [ ] T091 Code review - 驗證所有錯誤處理使用 try-catch 且有適當日誌記錄,錯誤日誌符合 FR-005 的結構化格式要求
- [ ] T092 執行 `specs/040-mcp-graceful-degradation/quickstart.md` 中的所有驗證步驟
- [ ] T093 使用 F5 啟動 Extension Development Host 並檢查 Output Channel 日誌無異常
- [ ] T094 在多工作區 (Multi-root workspace) 環境測試 Node.js 缺失警告僅顯示一次
- [ ] T095 測試向後相容性 - 有 Node.js 的使用者升級後體驗不變
- [ ] T096 效能測試 - 確認 Extension 啟動時記憶體增加 < 5MB
- [ ] T097 效能測試 - 確認 Node.js 檢測執行時間 < 3 秒
- [ ] T098 安全性檢查 - 確認無使用 eval(), 無執行任意使用者輸入的命令
- [ ] T099 執行 `npm run compile` 生成最終建置確保無錯誤
- [ ] T100 執行 `npm run package` 生成 .vsix 檔案並手動安裝測試

---

## 依賴關係與執行順序

### Phase 依賴

- **Setup (Phase 1)**: 無依賴 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Phase 1 完成 - 阻擋所有 User Story
- **User Stories (Phase 3-5)**: 依賴 Phase 2 完成
    - User Story 1, 2, 3 可依優先級順序執行 (P1 → P2 → P3)
    - 或若有多人力可平行開發 (但 US2, US3 依賴 US1 的 extension.ts 修改)
- **國際化 (Phase 6)**: 依賴 Phase 3-5 完成 (需知道所有訊息鍵)
- **文件更新 (Phase 7)**: 可與 Phase 6 平行
- **測試 (Phase 8)**: 依賴 Phase 2-5 完成
- **Polish (Phase 9)**: 依賴所有前面 Phase 完成

### User Story 依賴

- **User Story 1 (P1)**: 依賴 Foundational (Phase 2) - 修改 extension.ts 建立 MCP 前置檢測
- **User Story 2 (P2)**: 依賴 US1 完成 - 擴展 extension.ts 加入設定監聽
- **User Story 3 (P3)**: 依賴 Foundational (Phase 2) - 可與 US1/US2 平行但需避免 extension.ts 衝突

### 各 User Story 內部順序

**User Story 1**:

- T018 → T019 → T020, T021, T022 (平行) → T023 → T024 → T025

**User Story 2**:

- T026, T027 (平行) → T028 → T029 → T030 → T031 → T032 → T033 → T034

**User Story 3**:

- T035 → T036 → T037 → T038 → T039 → T040 → T041 → T042

### 平行執行機會

**Phase 1 (Setup)**:

- T001, T002, T003 可同時進行 (都在 nodeDetection.ts)

**Phase 2 (Foundational)**:

- T005-T010 (NodeDetectionService) 與 T011-T016 (DiagnosticService) 可平行

**Phase 6 (國際化)**:

- T043-T057 (package.nls) 可全部平行
- T058-T072 (messages.js) 可全部平行

**Phase 7 (文件更新)**:

- T075-T078 可全部平行

**Phase 8 (測試)**:

- T079-T081 可平行
- T085-T088 可平行

---

## 平行執行範例

### Foundational Phase (Phase 2)

```bash
# 同時啟動兩個服務的開發:
Task: "建立 NodeDetectionService" (T005-T010 序列執行)
Task: "建立 DiagnosticService" (T011-T016 序列執行)
```

### 國際化 Phase (Phase 6)

```bash
# 同時翻譯所有 package.nls 檔案:
Task: "package.nls.json (en)" (T043)
Task: "package.nls.zh-hant.json" (T044)
Task: "package.nls.ja.json" (T045)
# ... (共 15 個語言檔案)

# 同時翻譯所有 messages.js 檔案:
Task: "media/locales/en/messages.js" (T058)
Task: "media/locales/zh-hant/messages.js" (T059)
Task: "media/locales/ja/messages.js" (T060)
# ... (共 15 個語言檔案)
```

---

## 實作策略

### MVP 優先策略 (僅 User Story 1)

1. ✅ 完成 Phase 1: Setup (型別定義)
2. ✅ 完成 Phase 2: Foundational (服務層) **← CRITICAL 阻擋點**
3. ✅ 完成 Phase 3: User Story 1 (Node.js 缺失警告)
4. **STOP 並驗證**: 測試 Node.js 缺失場景與正常場景
5. 可選: 完成 Phase 6 (國際化 - US1 相關訊息) + Phase 8 (測試 - US1)
6. **部署/展示**: MVP 已完成,可收集使用者回饋

**MVP 價值**: 解決最關鍵的使用者痛點 (靜默失敗 → 友善警告)

### 完整功能策略 (所有 User Story)

1. ✅ Phase 1: Setup → Phase 2: Foundational
2. ✅ Phase 3: User Story 1 → 測試驗證
3. ✅ Phase 4: User Story 2 → 測試驗證
4. ✅ Phase 5: User Story 3 → 測試驗證
5. ✅ Phase 6: 國際化 (所有語言)
6. ✅ Phase 7: 文件更新
7. ✅ Phase 8: 完整測試 (單元 + 整合 + 手動)
8. ✅ Phase 9: Code review + 效能測試 + 安全性檢查
9. **發布**: v0.60.0 完整版本

**優點**: 每個 User Story 完成後都可獨立驗證,降低整合風險

### 多人協作策略

**前提**: Phase 1 + Phase 2 必須由團隊共同完成 (Foundation ready)

**分工範例** (3 位開發者):

- **Developer A**: User Story 1 (Phase 3) → 國際化 (US1 訊息)
- **Developer B**: User Story 2 (Phase 4) → 國際化 (US2 訊息)
- **Developer C**: User Story 3 (Phase 5) → 國際化 (US3 訊息)
- **All**: Phase 8 測試 → Phase 9 最終驗證

**風險**: US2 依賴 US1 的 extension.ts 修改,需協調避免衝突

---

## 時間估算

| Phase                 | 任務數  | 預估時間       | 關鍵路徑         |
| --------------------- | ------- | -------------- | ---------------- |
| Phase 1: Setup        | 4       | 0.5 小時       | ✅               |
| Phase 2: Foundational | 13      | 3.5 小時       | ✅ (阻擋所有 US) |
| Phase 3: US1          | 8       | 2 小時         | ✅ (MVP)         |
| Phase 4: US2          | 9       | 1.5 小時       | -                |
| Phase 5: US3          | 8       | 1.5 小時       | -                |
| Phase 6: 國際化       | 32      | 2 小時         | - (可平行)       |
| Phase 7: 文件更新     | 4       | 0.5 小時       | - (可平行)       |
| Phase 8: 測試         | 10      | 3 小時         | ✅               |
| Phase 9: Polish       | 12      | 2 小時         | ✅               |
| **總計**              | **100** | **16-18 小時** | -                |

**MVP 時間** (Phase 1 + 2 + 3 + 部分 6 + 部分 8): **10-12 小時**

---

## 注意事項

- **[P] 標記**: 表示可與同 Phase 其他任務平行執行 (不同檔案、無依賴)
- **[Story] 標記**: 映射到 spec.md 的 User Story (US1, US2, US3)
- **Checkpoint**: 每個 User Story 完成後應獨立驗證功能正確性
- **避免衝突**: extension.ts 是熱點檔案,US1/US2/US3 都會修改,需按順序執行或協調分工
- **測試覆蓋率**: 目標 90%+ (參考 `docs/specifications/04-quality-testing/test-coverage.md`)
- **國際化驗證**: 使用 `npm run validate:i18n` 確保所有語言翻譯完整
- **日誌規範**: 所有新程式碼必須使用 `logging.ts` 的 `log()` 方法,不使用 `console.log`
- **型別安全**: 啟用 TypeScript strict mode,確保無 `any` 型別濫用

---

## 相關文件

- [Feature Specification (spec.md)](./spec.md)
- [Implementation Plan (plan.md)](./plan.md)
- [Data Model (data-model.md)](./data-model.md)
- [Research Report (research.md)](./research.md)
- [Quickstart Guide (quickstart.md)](./quickstart.md)
- [VSCode Settings Contract (contracts/vscode-settings.md)](./contracts/vscode-settings.md)
- [VSCode Command Contract (contracts/vscode-command.md)](./contracts/vscode-command.md)
- [Project Constitution (.specify/memory/constitution.md)](../../.specify/memory/constitution.md)
- [Test Coverage Specification (docs/specifications/04-quality-testing/test-coverage.md)](../../docs/specifications/04-quality-testing/test-coverage.md)

---

**最後更新**: 2026-02-04  
**狀態**: Ready for Implementation  
**預估完成時間**: 16-18 小時 (單人) | 10-12 小時 (3 人協作)
