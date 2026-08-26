# Implementation Plan: 提供回饋與進度追蹤

**Branch**: `codex/070-user-feedback` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/070-user-feedback/spec.md`

## Summary

在 Singular Blockly 擴充套件加入原生「提供回饋」與「我的回饋」入口，讓不熟悉 GitHub 的使用者可在 VS Code 內完成知情預覽、送出、追蹤、補充與刪除。擴充套件只建立允許清單式診斷快照，以安全儲存保管匿名回報者密鑰，Webview 不直接連網；獨立的邊緣服務負責驗證、私密資料與附件、匿名工作階段、防濫用、可靠同步及維護者事件。私密維護工作區與公開開發工作區完全分離，所有公開回覆、最終決定與匿名公開項目都有明確核准邊界。

實作採同一版本庫、兩個可獨立建置的執行目標：既有 VS Code Extension Host/Webview，以及 `workers/feedback/` 的 Cloudflare Worker。Worker 使用 D1 保存結構化資料與 outbox、私有 R2 保存淨化截圖、GitHub App 最小權限同步私密 issue；正式服務位於 `https://blockly-support.singular-ai.org`。第一版不加入遙測、背景通知、電子郵件、原始紀錄上傳或回報者 GitHub 登入。

## Technical Context

**Language/Version**: Extension Host 使用 TypeScript 6.0.3、Node.js 22.16.0+ 與 ES2023；Webview 使用瀏覽器 JavaScript/CSS/HTML；Worker 使用 TypeScript 6.0.3 與 Web Standards runtime，compatibility date 固定為 `2026-08-19`

**Primary Dependencies**: VS Code API `^1.109.0`、既有 `@vscode/proxy-agent` 與 Ajv；Worker 使用原生 Fetch/Web Crypto、Cloudflare D1/R2/Rate Limiting bindings、Wrangler；GitHub 整合使用原生 REST 呼叫與最小 JWT/installation-token 產生器，不引入完整 Web 框架

**Storage**: VS Code `SecretStorage` 保存 256-bit 回報者秘密；D1 `singular-blockly-feedback` 保存匿名回報者 HMAC、回饋、公開訊息、工作階段雜湊、idempotency、webhook delivery、outbox 與去敏安全稽核；私有 R2 `singular-blockly-feedback-screenshots` 保存最多一張已淨化截圖；私有 GitHub 儲存庫 `Shen-Ming-Hong/singular-blockly-feedback` 以不含內容的 Issue shell 與可刪除 comments 保存維護者工作副本

**Testing**: 既有 Mocha/Sinon 與 `@vscode/test` 驗證 Extension Host；契約式測試驗證不能直接載入 Node 的 Webview；Cloudflare Workers Vitest integration 驗證 Worker/D1/R2；本機 Wrangler 執行端對端；既有 ESLint、i18n、project-skill、VSIX 封裝與 secret-scan 檢查

**Target Platform**: VS Code/VSCodium 相容桌面 Extension Host（本機、SSH/Container/WSL 遠端與 workspace trust 模式）；Cloudflare Workers Free 起始部署；VS Code Marketplace 與 Open VSX 發布

**Project Type**: 桌面擴充套件 + Webview 客戶端 + 邊緣 Web 服務

**Performance Goals**: 正常送出 95% 於 10 秒內得到成功或可重試結果；表單開啟不做網路請求且 500 ms 內呈現本機資料；我的回饋一般查詢 95% 於 2 秒內呈現；outbox 最終同步不阻塞使用者成功回應

**Constraints**: 不讀取或傳送使用者程式與工作區內容；基本環境可關閉、事件預設關閉；單張截圖最長邊 1920 px 且最多 3 MiB；Webview `connect-src 'none'`、無遠端可執行資源；Reporter secret 只存本機 SecretStorage 與 URL fragment，服務端只存 HMAC；無原始 IP 長期保存；所有 mutation 具 idempotency、schema/size、authorization、origin/CSRF 與 rate-limit 防護；Worker 與秘密不得進入 VSIX

**Scale/Scope**: 公開回報者超過 50 人、初期低流量但設計可在 Workers Free 的 100,000 requests/day 內運作；分流流程至少完整處理 500 筆/10 頁未審回饋；15 語系；一個私密回饋儲存庫與一個公開產品儲存庫

## Constitution Check

*GATE: Phase 0 前通過；Phase 1 設計後再次通過。*

| Principle | Gate | Result |
|-----------|------|--------|
| I Simplicity and Maintainability | Extension 與 Worker 各維持單一入口、純函式驗證與明確服務邊界；Worker 不採大型框架 | PASS |
| II Modularity and Extensibility | 診斷收集、遮蔽、API client、panel、auth、storage、GitHub sync 分離且可注入測試替身 | PASS |
| III Avoid Over-Development | v1 僅單張截圖、補充純文字、無通知/郵件/遙測/離線同步；不建管理後台 | PASS |
| IV Flexibility and Adaptability | 允許清單診斷、狀態與標籤使用共享 schema；端點可在測試注入但正式值固定 | PASS |
| V Research-Driven Development | VS Code、Microsoft Marketplace、Open VSX、Cloudflare 與 GitHub 選擇皆記錄官方來源於 research.md | PASS |
| VI Structured Logging | Extension 使用 `log.*`；Worker 只記錄結構化安全事件，不記錄秘密或完整內容 | PASS |
| VII Comprehensive Test Coverage | 純邏輯單元測試、Worker binding 整合、Webview contract、E2E、安全/i18n/封裝 gate 均列入 tasks | PASS |
| VIII Pure Functions and Modular Architecture | DTO 驗證、環境正規化、HMAC、狀態轉換、redaction 與 GitHub command parsing 優先純函式 | PASS |
| IX Traditional Chinese Documentation | 規格、計畫、研究、資料模型、契約說明、quickstart 與任務均使用繁體中文 | PASS |
| X Professional Release Management | 本功能不改版本、不 tag、不發布；加入發布前隱私與 VSIX 檢查，正式發布另走 release workflow | PASS |
| XI Agent Skills Architecture | 新增 `triage-user-feedback` 的 canonical source 與 `.agents` 連結；不執行不可信回饋內容且保留人工核准 | PASS |

### Phase 1 Post-Design Re-check

- Extension/Worker 兩個執行目標是資料信任邊界所需，不把後端憑證放進 VSIX；未引入第三個服務或管理前端。
- D1 outbox 是避免「使用者已成功送出但 GitHub 同步失敗」資料不一致所需的最小可靠性元件。
- 公開 portal 與 API 由同一 Worker 提供，沒有額外前端專案；維護者仍使用既有 GitHub UI。
- 所有 NEEDS CLARIFICATION 已在 research.md 解決，沒有憲法違反或未解釋例外。

## Project Structure

### Documentation (this feature)

```text
specs/070-user-feedback/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── openapi.yaml
│   ├── webview-messages.md
│   └── github-commands.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── extension.ts
├── types/
│   └── feedback.ts
├── services/
│   ├── feedbackClient.ts
│   ├── feedbackDiagnostics.ts
│   ├── feedbackIdentity.ts
│   └── privacyRedactor.ts
├── webview/
│   └── feedbackPanel.ts
└── test/
    ├── services/
    │   ├── feedbackClient.test.ts
    │   ├── feedbackDiagnostics.test.ts
    │   ├── feedbackIdentity.test.ts
    │   └── privacyRedactor.test.ts
    └── webview/
        └── feedbackPanel.test.ts

media/
├── html/feedback.html
├── css/feedback.css
├── js/feedback.js
└── locales/*/messages.js

workers/feedback/
├── wrangler.jsonc
├── tsconfig.json
├── migrations/
│   ├── 0001_initial.sql
│   ├── 0002_pending_attachment_cleanup.sql
│   ├── 0003_status_transition_command.sql
│   └── 0004_detached_development_approvals.sql
├── src/
│   ├── index.ts
│   ├── domain/{auth,feedback,privacy,schemas,stateMachine}.ts
│   ├── routes/{feedback,portal,githubWebhook,adminAttachments}.ts
│   ├── services/{githubApp,outbox,screenshot}.ts
│   └── storage/{d1,r2}.ts
└── test/{unit,integration}/

.github/skills/triage-user-feedback/
├── SKILL.md
├── references/{classification,safety}.md
└── scripts/validate-feedback-triage.js

.agents/skills/triage-user-feedback -> ../../.github/skills/triage-user-feedback

scripts/feedback/{validate-contracts,verify-vsix-privacy}.js

PRIVACY.md
SUPPORT.md
TERMS.md
```

**Structure Decision**: 保留既有 Extension Host/Webview 分層，新增獨立 `FeedbackPanel` 而不擴張已很大的 Blockly `WebViewManager`。Worker 位於同一版本庫並共用根 `package-lock.json`，但有獨立 Wrangler/TypeScript 設定；根 `.vscodeignore` 排除整個 `workers/**`、規格、管理 Skill 與服務端測試。共用契約以 TypeScript 型別與 `specs/070-user-feedback/contracts/` 為設計來源，運行時兩端各自做 schema 驗證，不跨執行目標直接 import 造成打包耦合。

所有會寫入 D1 `length()` constraint 的使用者可見文字，以 Unicode code point 作為 Webview、Extension Host 與 Worker 的共同長度單位；Webview 不依賴以 UTF-16 code unit 計算的原生 `minlength`／`maxlength`。回饋 panel 的建立以單一 opening promise 合併並行入口，建立回饋的非同步結果另以來源 panel 與 confirmation id 綁定，避免舊結果更新重開面板或清除後續草稿。補充訊息草稿只在當前頁面記憶體中依 feedback ID 暫存，不寫入 VS Code state 或 browser storage；持久層只保存不含本文的 digest 與冪等鍵。切換明細時先保存目前文字，成功回應只清除與已確認本文相同的草稿；單筆刪除成功則獨立移除清單項目並要求第一頁刷新，不影響使用者已切換到的其他明細。

## 2026-08-21 Blockly 工具列 UX 增補

- 將「提供回饋」由長方形文字按鈕改為與其他工具一致的 32px 圓形圖示按鈕，保留獨立藍色、固定回饋圖示、本地化 tooltip、ARIA label、鍵盤焦點與 forced-colors 邊界。
- 工具列分為常用操作與次要操作：常用固定為備份、上傳、Monitor；回饋、語言、主題、搜尋、重新整理、範例與各開發板設定屬次要操作。
- 展開與收合皆由同一個 10px 水平 gap 規則控制所有圓形操作，避免群組交界產生黏合或雙倍間距。
- 最右側加入收合／展開按鈕。尚無專案偏好時預設收合；Webview 以 `acquireVsCodeApi().getState()/setState()` 避免同一 panel 重載閃爍，並用固定、嚴格驗證的 boolean `postMessage` 將最後狀態保存到 Extension Host 的專案 `workspaceState`。不新增 Extension setting、工作區檔案或外部傳輸。
- 收合只隱藏次要操作群組，開發板切換造成的既有 `display` 狀態仍由原本 board-aware 邏輯管理；重新展開不自行顯示不適用於目前開發板的操作。
- 契約測試驗證 DOM 分組、最右側 toggle、預設／持久狀態、15 語系文案、可存取狀態及 CSS 圓形／主題／高對比規則；Development Host 人工驗證寬窄版、約 200% 縮放與鍵盤順序。

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 無憲法違反；但新增第二個執行目標 | 匿名公開回饋需要服務端保存私密資料與 GitHub App 秘密，不能放入 VSIX | 直接建立公開 GitHub issue 會要求回報者理解 GitHub、公開環境資料，且無法安全提供個人查詢與刪除 |
| D1 outbox | 使用者成功結果不可依賴 GitHub 當下可用，且所有重試必須冪等 | 在請求內同步建立 issue 會把第三方暫時失敗變成回饋遺失或重複 |
