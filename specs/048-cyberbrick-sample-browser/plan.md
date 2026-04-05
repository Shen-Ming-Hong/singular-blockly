# 實作計畫：CyberBrick 範例工作區瀏覽器

**分支**: `048-cyberbrick-sample-browser` | **日期**: 2026-04-04 | **規格**: [spec.md](spec.md)
**輸入**: 功能規格文件 `/specs/048-cyberbrick-sample-browser/spec.md`

## 摘要

為 CyberBrick 板（MicroPython 模式）的 Blockly 工具列新增「範例」按鈕，點擊後開啟模態瀏覽器顯示可用範例卡片。範例清單（`index.json`）優先從 GitHub Raw URL 取得（10 秒 timeout），失敗則 fallback 至 extension 內建版本；工作區有積木時顯示確認對話框，空白時直接載入；載入後執行基本 schema 驗證。

## 技術背景

**語言/版本**: TypeScript 5.9.3（Extension Host）| 瀏覽器 JavaScript（WebView）
**主要依賴**: VS Code API 1.105.0+ | Blockly 12.3.1 | Node.js 22.16.0+（global `fetch` + `AbortController`）
**儲存**: JSON 檔案（`media/samples/index.json`、`media/samples/*.json`）
**測試**: Mocha + Sinon + `@vscode/test-electron`（unit tests for `SampleBrowserService`）
**目標平台**: VS Code Extension Host（Node.js）+ WebView（Chromium browser context）
**專案類型**: VS Code extension feature
**效能目標**: 有網路下從按鈕點擊到卡片顯示 < 5 秒；離線 fallback 整體 < 15 秒
**限制**: Extension Host ↔ WebView 僅能透過 `postMessage` 通訊；WebView 不可直接 import Node.js 模組
**規模/範圍**: 新增 1 個 Service、2 個 messageHandler cases、1 個模態 UI 元件、15 個 i18n 語系鍵值

## Constitution Check

_GATE：Phase 0 研究前必須通過；Phase 1 設計後重新確認。_

| 原則                   | 狀態     | 說明                                                                                                   |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| I. 簡易性與可維護性    | ✓ PASS   | 新 Service 沿用 `FileService` 依賴注入模式；WebView UI 沿用 `backupManager` 物件模式                   |
| II. 模組化與擴充性     | ✓ PASS   | `SampleBrowserService` 為獨立 service，注入介面可替換；`index.json` 驅動範例目錄                       |
| III. 避免過度開發      | ✓ PASS   | 僅實作 P1-P4 User Stories；不加入版本比對、多選、preview 等未請求功能                                  |
| IV. 彈性與適應性       | ✓ PASS   | 範例清單由 `index.json` 設定驅動；按鈕可見性由 `isCyberBrick` 控制，不硬編碼                           |
| V. 研究驅動開發        | ⚠ 待研究 | 需確認 Node.js global `fetch` + `AbortController` 在 VS Code extension host 的相容性（見 research.md） |
| VI. 結構化日誌         | ✓ PASS   | Service 使用 `log()` from `logging.ts`；WebView 使用 `console.log`（瀏覽器環境）                       |
| VII. 全面測試覆蓋      | ✓ PASS   | `SampleBrowserService` 業務邏輯可注入 `fetch` mock 進行單元測試；WebView 按規格使用手動測試例外條款    |
| VIII. 純函式與模組架構 | ✓ PASS   | `fetchIndex`、`fetchWorkspace`、`validateWorkspace` 皆為可注入依賴的純淨函式                           |
| IX. 繁體中文文件標準   | ✓ PASS   | 本文件及所有規格產出物均以繁體中文撰寫                                                                 |

**GATE 結果**：無違規，允許進入 Phase 0。

## 專案結構

### 文件（本功能）

```text
specs/048-cyberbrick-sample-browser/
├── plan.md              # 本檔案
├── research.md          # Phase 0 輸出
├── data-model.md        # Phase 1 輸出
├── quickstart.md        # Phase 1 輸出
├── contracts/           # Phase 1 輸出
│   └── postmessage.md   # Extension Host ↔ WebView 訊息合約
└── tasks.md             # Phase 2 輸出（由 /speckit.tasks 產生）
```

### 原始碼（repo 根目錄）

```text
media/
├── samples/
│   ├── index.json                        # 新增：範例目錄（雲端/離線共用）
│   └── cyberbrick-soccer-robot.json      # 已存在
├── html/
│   └── blocklyEdit.html                  # 修改：新增 sampleContainer + sampleModal
├── js/
│   └── blocklyEdit.js                    # 修改：updateUIForBoard + DOMContentLoaded + message handler
├── css/
│   └── blocklyEdit.css                   # 修改：.sample-switch + #sampleModal 樣式
└── locales/
    └── {15 語系}/messages.js             # 修改：新增 10 個 i18n 鍵值

src/
├── services/
│   └── sampleBrowserService.ts           # 新增：HTTP fetch + fallback + validation
├── webview/
│   └── messageHandler.ts                 # 修改：2 個新 case + 委派至 service
└── test/suite/services/
    └── sampleBrowserService.test.ts      # 新增：單元測試
```

**結構決策**：採用單一專案模式。新 `SampleBrowserService` 置於 `src/services/` 遵循現有 service 層慣例；WebView UI 邏輯直接擴充既有 `blocklyEdit.js`（不新增獨立 JS 檔案，避免增加 `blocklyEdit.html` 載入腳本數量）。

## 複雜度追蹤

> 無 Constitution Check 違規，此區塊不適用。
