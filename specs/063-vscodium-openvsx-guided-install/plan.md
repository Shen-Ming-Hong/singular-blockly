# 實作計畫：VSCodium / Open VSX 支援與引導安裝

**分支**：`063-vscodium-openvsx-guided-install` | **日期**：2026-06-30 | **規格**：[spec.md](spec.md)

## 摘要

從 `package.json` 移除硬性 `extensionDependencies`，使擴充功能可在 VSCodium / Open VSX 環境啟動。新增集中化的 `PenvProviderService`，統一管理 penv provider 偵測、引導安裝通知與自動 fallback（platformio → pioarduino → 手動搜尋）邏輯。在 Arduino 上傳路徑加入 activation-time 通知（板子類型篩選），在 CyberBrick USB 上傳、Serial Monitor 路徑加入 upload-time 重試偵測，並更新全部 15 個語系 locale 及補全單元測試。

## 技術背景

**語言/版本**：TypeScript 5.9.3（`tsconfig.json` strict 模式）

**主要依賴**：VS Code Extension API（`vscode`）、Mocha + Sinon（測試）、`@vscode/test-electron`

**儲存**：無新持久化資料

**測試**：Mocha + Sinon mock，`vscode.extensions.getExtension`、`vscode.window.showInformationMessage`、`vscode.commands.executeCommand` 均需可 mock

**目標平台**：VS Code 1.105.0+、VSCodium 1.121+、Firebase Studio / Google Antigravity（Open VSX）

**專案類型**：VS Code Extension（extension host TypeScript）

**效能目標**：通知在 `onStartupFinished` 啟動視窗內出現；penv 重試最多 9 秒完成（3 次 × 3 秒間隔）

**限制**：不破壞現有 908 筆測試；Windows（`Scripts/`）與 macOS/Linux（`bin/`）路徑差異已由既有 `executableResolver.ts` 處理，無需額外適配

## 憲章檢查

*門檻：Phase 0 研究前必須通過。Phase 1 設計後重新確認。*

| 原則 | 評估 | 結果 |
|------|------|------|
| I — 簡潔可維護 | `PenvProviderService` 職責單一；重試邏輯封裝於服務層 | ✅ |
| II — 模組化 | 新服務集中管理，避免在多個 uploader 重複實作通知邏輯 | ✅ |
| III — 避免過度開發 | 僅實作規格所需功能；無 post-install wizard，無自訂 reload 按鈕 | ✅ |
| VI — 結構化日誌 | 所有新偵測邏輯使用 `log()` 記錄，不使用 `console.log` | ✅ |
| VII — 測試覆蓋率 | FR-014 明確要求新邏輯須有單元測試覆蓋 | ✅ |
| VIII — 純函數/模組架構 | `detectPenvProviderStatus()` 設計為可注入依賴的純邏輯；`vscode.extensions.getExtension` 透過依賴注入可在測試中覆寫 | ✅ |
| IX — 繁體中文文件 | 本文件及所有規格文件以繁體中文撰寫 | ✅ |
| X — 版本管理 | 新增使用者可見 UX 功能 → minor 版本升級，需更新 CHANGELOG | ✅ |

**Phase 1 後重新確認**：設計完成後確認無憲章違規。

## 專案結構

### 文件（本功能）

```text
specs/063-vscodium-openvsx-guided-install/
├── plan.md              ← 本文件
├── research.md          ← Phase 0 研究產出
├── data-model.md        ← Phase 1 資料模型
├── quickstart.md        ← Phase 1 驗證指南
├── contracts/
│   └── vs-code-api.md   ← Phase 1 VS Code API 合約
└── tasks.md             ← Phase 2 由 /speckit.tasks 產生
```

### 原始碼（倉庫根目錄）

```text
src/
├── extension.ts                        ← 修改：activation-time 板子類型篩選與通知觸發
├── services/
│   ├── penvProviderService.ts          ← 新增：集中化 provider 偵測、通知、安裝 fallback
│   ├── arduinoUploader.ts              ← 修改：upload-time penv check + 重試 + 通知
│   ├── micropythonUploader.ts          ← 修改：upload-time penv check + 重試 + 更新錯誤訊息
│   ├── serialMonitorService.ts         ← 修改：penv guard，失敗時有明確訊息
│   └── settingsManager.ts              ← 已由 PR#91 更新（provider guard）
└── test/
    ├── penvProviderService.test.ts     ← 新增：provider 偵測、通知、安裝 fallback 的單元測試
    └── settingsManager.test.ts         ← 已由 PR#91 更新

package.json                            ← 移除 extensionDependencies
media/locales/*/messages.js             ← 15 個語系：新增通知文字 i18n key
```

**結構決策**：採用單一擴充套件架構（Option 1）。`PenvProviderService` 作為新服務，符合 Principle VIII（模組化）且在三個上傳路徑中可重複使用。

## Phase 0：研究

詳見 [research.md](research.md)。

**關鍵發現摘要**：

1. **installExtension 指令**：`workbench.extensions.installExtension` 為 VS Code 官方記載的內建指令。在 Open VSX 環境嘗試安裝不存在的 extension ID 時，預期會以 rejected Promise 回傳（需在實作階段以單元測試驗證確切錯誤類型）。
2. **penv 自動建立**：PlatformIO IDE 與 pioarduino 在首次 activation 後**自動**執行安裝腳本建立 penv，無需使用者手動執行編譯。因此「需先執行 build」的說明已從規格移除。
3. **板子類型值**：`mainJson.board` 的值為 `'none'`（預設）、`'cyberbrick'`、`'txt'`，或 Arduino 板名（例如 `esp32dev`、`uno` 等非以上三者的值）。
4. **通知 API**：`vscode.window.showInformationMessage(message, ...items)` 回傳被選中的 item 字串或 `undefined`（使用者 dismiss），在 extension host 可直接呼叫。
5. **VS Code 通知機制**：`vscode.window.showInformationMessage` 是非阻擋式，符合讓使用者可同時操作 Blockly 的需求。

## Phase 1：設計

詳見 [data-model.md](data-model.md)、[contracts/vs-code-api.md](contracts/vs-code-api.md)、[quickstart.md](quickstart.md)。

**設計決策摘要**：

### 雙層偵測架構

```
[Activation 層]
extension.ts activate()
  └── 讀取 mainJson.board
      ├── board 為 Arduino 板（非 cyberbrick / txt / none）
      │   └── PenvProviderService.checkAndNotify()
      │       ├── getExtension('platformio.platformio-ide') 已安裝 → 不顯示通知
      │       ├── getExtension('pioarduino.pioarduino-ide') 已安裝 → 不顯示通知
      │       └── 都未安裝 → showInformationMessage + 按鈕
      └── 其他板子（cyberbrick / txt / none）→ 略過

[Upload 層]
arduinoUploader / micropythonUploader
  └── checkPioInstalled() / checkPythonEnvironment() 失敗
      ├── PenvProviderService.isProviderInstalled() === false
      │   └── 顯示安裝引導通知
      └── PenvProviderService.isProviderInstalled() === true（penv 正在初始化）
          └── 重試最多 3 次（間隔 3 秒）
              └── 仍失敗 → 顯示「環境初始化中，請稍候再試」
```

### PenvProviderService 介面

```typescript
// src/services/penvProviderService.ts
export type PenvProviderStatus =
  | 'not-installed'    // 無任何 provider extension
  | 'installed-ready'  // provider 已安裝且 penv 就緒
  | 'installed-pending'; // provider 已安裝但 penv 尚未建立

export interface PenvProviderServiceDeps {
  getExtension: (id: string) => { id: string } | undefined;
  executeCommand: (cmd: string, ...args: unknown[]) => Thenable<unknown>;
  showInformationMessage: (msg: string, ...items: string[]) => Thenable<string | undefined>;
  checkPenvExists: () => boolean;
}
```

### i18n 新 Key

| Key | 用途 |
|-----|------|
| `PENV_PROVIDER_NOT_INSTALLED` | 通知主訊息 |
| `PENV_PROVIDER_INSTALL_BUTTON` | 按鈕文字 |
| `PENV_PROVIDER_INSTALL_FAILED` | 兩個 extension 都安裝失敗時的訊息 |
| `PENV_PROVIDER_PENDING` | 已安裝但 penv 仍初始化中的訊息 |

### Phase 1 後憲章重新確認

- I（簡潔）：✅ `PenvProviderService` 職責明確，介面清晰
- VIII（純函數）：✅ 透過 `PenvProviderServiceDeps` 依賴注入，所有 VS Code API 可在測試中替換
- 無新憲章違規

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
