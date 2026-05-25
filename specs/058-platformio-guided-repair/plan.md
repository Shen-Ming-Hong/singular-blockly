# 實作計畫：PlatformIO Guided Repair

**分支**：`058-platformio-guided-repair` | **日期**：2026-05-25 | **規格**：`specs/058-platformio-guided-repair/spec.md`  
**輸入**：來自 `specs/058-platformio-guided-repair/spec.md` 的功能規格

**註記**：本計畫由 `/speckit.plan` 工作流程產生；`tasks.md` 已由後續 `/speckit.tasks` 工作流程建立。

## 摘要

在既有 `singular-blockly.checkPlatformioStatus` / PlatformIO diagnostic panel 中加入 guided repair。v1 聚焦「最划算的止血版」：吸收官方 PlatformIO VS Code extension 的公開設定作為偵測證據、提供一個使用者確認後才執行的 user-space bounded repair flow、保存 workspace-scoped 修復歷程、產生預設遮罩的 AI repair packet 與 human-approved issue draft。不得新增 top-level command，不做 system-level repair，不依賴 PlatformIO extension private `penv` internals。

## 技術脈絡

**語言／版本**：TypeScript 5.9.3（Extension Host）、browser JavaScript（WebView）、HTML/CSS；VS Code API `^1.105.0`。  
**主要相依**：VS Code extension API、既有 `LocaleService`、`PlatformioDiagnosticService`、`PlatformioDiagnosticPanel`、Node.js `child_process.execFile` pattern、PlatformIO IDE extension dependency (`platformio.platformio-ide`)；開發/測試使用 Mocha、Sinon、`@vscode/test-electron`、ESLint。  
**儲存方式**：使用 `ExtensionContext.workspaceState` (`Memento`) 保存 workspace-scoped repair history；不使用資料庫；不使用 `globalState`；不把 secrets 存入 history；輸出前套用 privacy redaction。  
**測試方式**：Mocha + Sinon unit tests、VS Code webview/panel contract-style tests、`npm run compile`、`npm run lint`、`npm test`；若新增 i18n 字串則跑 `npm run validate:i18n`。  
**目標平台**：macOS / Windows / Linux 上的 VS Code desktop extension；需特別涵蓋 Windows Unicode/中文路徑與 PATH 分隔差異。  
**專案類型**：單一 VS Code extension，包含 Extension Host (`src/`) 與 WebView (`media/`) 兩個隔離 JavaScript context。  
**效能目標**：診斷面板初次 render 保持目前體感；修復 planner 必須同步/快速完成；外部 probe/repair step 必須有 timeout；repair progress 需持續回報，避免 UI 像當機。  
**限制條件**：不新增 top-level command；不修改 shell profile、系統 PATH、registry 或系統套件；不使用 `sudo` / Homebrew / apt / choco / winget；不使用 shell 字串執行 repair commands；WebView 不直接存取 filesystem/process；所有使用者可見文字需 i18n；Extension Host logging 使用 `log()`，不用 `console.log`。  
**規模／範圍**：v1 延伸既有 5 個診斷項目（`pio`、`penvRoot`、`python`、`pip`、`mpremote`），支援少量 allowlisted repair flows、最近 20 筆 workspace repair history、AI packet 與 issue draft 兩種匯出格式。

## 憲章檢查

*關卡：必須在階段 0 研究前通過，並在階段 1 設計後重新檢查。*

### 初始檢查（階段 0 前）

| 原則 | 狀態 | 證據 |
|------|------|------|
| I. Simplicity and Maintainability | 通過 | 沿用既有 status command/panel，不新增入口；v1 限定 2–3 個安全步驟的 primary flow。 |
| II. Modularity and Extensibility | 通過 | 診斷、planner、executor、history、redactor、AI/issue export 以服務分層；WebView 只處理 render/message。 |
| III. Avoid Over-Development | 通過 | 不做 system-level installer、不自動開 issue、不導入資料庫或大型 UI 框架。 |
| IV. Flexibility and Adaptability | 通過 | 使用官方 PlatformIO settings evidence、平台差異判斷、手動替代路徑與可調整的 repair flow model，避免把單一路徑硬編進 UI。 |
| V. Research-Driven Development (MCP-Powered) | 通過 | 已查 VS Code API/Webview docs、PlatformIO official integration/settings/installer docs、既有 repo code/tests。 |
| VI. Structured Logging | 通過 | 規劃要求 Extension Host 使用既有 `log()`；WebView 不使用 console 作為診斷來源。 |
| VII. Comprehensive Test Coverage | 通過 | plan 指定 planner/executor/history/redactor/panel message 測試；手動 matrix 只涵蓋 UI/環境整合。 |
| VIII. Pure Functions and Modular Architecture | 通過 | planner、fingerprint、redaction、packet formatting 可設計為 pure functions；executor 透過依賴注入隔離副作用。 |
| IX. Traditional Chinese Documentation Standard | 通過 | 規格、研究、資料模型、contracts、quickstart 與 tasks 皆以繁體中文維護，技術名詞與 API 名稱保留原文。 |
| X. Professional Release Management | 通過 | 無發布動作；後續實作若合併需遵守 Conventional Commits 與 CHANGELOG。 |
| XI. Agent Skills Architecture | 通過 | 本 feature 維持在專案既有 service/WebView 架構，不新增 agent/skill。 |

### 設計後複查（階段 1 後）

| 關卡 | 狀態 | 備註 |
|------|------|------|
| 技術未知數已解決 | 通過 | `research.md` 已決定 storage、repair boundary、official settings evidence、AI/issue redaction 與 history fingerprint。 |
| 契約足以導出 tasks | 通過 | `contracts/` 定義 panel messages、repair execution、AI packet、issue draft。 |
| 無 constitution violation | 通過 | 未引入系統層修復、自動 issue 發佈、跨 context import 或未受控外部命令。 |

## 專案結構

### 文件（本功能）

```text
specs/058-platformio-guided-repair/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ai-repair-packet.md
│   ├── auto-repair-run.md
│   ├── issue-draft-proposal.md
│   └── platformio-guided-repair-panel.md
└── tasks.md             # 由 /speckit.tasks 產生的任務清單
```

### 原始碼（repository root）

```text
src/
├── extension.ts                         # 保留既有 singular-blockly.checkPlatformioStatus registration
├── services/
│   ├── platformioDiagnosticService.ts   # 擴充 diagnostics/settings evidence；保留診斷相容行為
│   ├── platformioRepairService.ts       # 新增：repair planner/executor orchestration
│   ├── platformioRepairHistoryStore.ts  # 新增：workspaceState persistence + fingerprint invalidation
│   ├── platformioPrivacyRedactor.ts     # 新增：packet/history/issue output masking rules
│   ├── platformioAiRepairPacketService.ts # 新增：AI-ready repair packet formatting
│   └── platformioIssueDraftService.ts   # 新增：不自動發布的 issue draft formatting
├── types/
│   └── platformioDiagnostic.ts          # 擴充 typed panel state/messages 與 repair domain contracts
└── webview/
    └── platformioDiagnosticPanel.ts     # 由 Extension Host 處理新的 repair/copy/history messages

media/
├── html/platformioDiagnostic.html       # 保留既有 panel host
├── js/platformioDiagnostic.js           # render repair UI；不得執行本機命令
├── css/platformioDiagnostic.css         # repair cards/progress/history styling
└── locales/*/messages.js                # 視需要新增 15 語系使用者可見字串

src/test/
├── services/
│   ├── platformioDiagnosticService.test.ts
│   ├── platformioRepairService.test.ts
│   ├── platformioRepairHistoryStore.test.ts
│   ├── platformioPrivacyRedactor.test.ts
│   ├── platformioAiRepairPacketService.test.ts
│   └── platformioIssueDraftService.test.ts
└── webview/
    └── platformioDiagnosticPanel.test.ts
```

**結構決策**：採用既有 VS Code extension 單專案結構。核心規劃/執行/遮罩/歷程留在 Extension Host service 層；WebView 只負責顯示與 `postMessage` action；contracts 作為實作與測試之間的穩定介面。

## 階段 0 產出

`research.md` 已完成並記錄以下決策：

1. 沿用既有 PlatformIO status command/panel。
2. 修復歷程使用 `workspaceState`，不依賴 WebView state。
3. 拆分 planner/executor/history/redaction/export modules。
4. 自動修復僅允許 user-space allowlist，使用 `execFile` 與 timeout。
5. 吸收官方 PlatformIO extension settings 作為偵測與修復證據。
6. AI packet 與 issue draft 預設遮罩敏感資訊，且 issue 只產生草稿。
7. 使用 environment fingerprint 判斷歷程有效性。

## 階段 1 產出

- `data-model.md`: 定義 Diagnostic Finding、Official PlatformIO Settings Evidence、Repair Flow、Repair Step、Auto Repair Run、Repair History、Environment Fingerprint、AI Repair Packet、Issue Draft Proposal 與 Panel Repair State。
- `contracts/platformio-guided-repair-panel.md`: 定義 Extension Host ↔ WebView messages 與 UI contract。
- `contracts/auto-repair-run.md`: 定義 allowlisted repair execution、stop policy、timeout、錯誤分類與 history 寫入。
- `contracts/ai-repair-packet.md`: 定義 AI-ready Markdown/plain text packet 與 redaction 規則。
- `contracts/issue-draft-proposal.md`: 定義 human-approved public issue draft governance。
- `quickstart.md`: 定義自動化測試、手動驗證矩陣與回歸檢查。

## 複雜度追蹤

> 無 constitution violation；不需要 complexity exception。

| 違規項目 | 必要原因 | 拒絕較簡單替代方案的原因 |
|----------|----------|----------------------------------|
| N/A | N/A | N/A |
