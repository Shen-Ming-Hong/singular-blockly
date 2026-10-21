---
name: maintain-feedback-service
description: 修改、驗證或準備部署 Singular Blockly 的回饋服務（workers/feedback 的 Cloudflare Worker、D1、R2、GitHub App 同步、公開政策頁）與擴充套件端回饋流程時使用。涵蓋本地驗證、migration 順序、哪些正式環境操作必須先問 Ray、雲端工作階段的限制與回復。Use when changing or preparing to deploy the hosted feedback Worker and its extension-side client.
metadata:
  author: singular-blockly
  version: '1.0.0'
  category: maintenance
  inspired-by: Shen-Ming-Hong/singhong-tools singhong-tools-maintenance
---

# 維護回饋服務

回饋服務處理使用者的私密資料。程式修改照一般 PR 流程；任何會改到正式環境的動作都先問 Ray。寫入任務先依 `maintain-singular-blockly` 建立分支與檢查重疊；涉及資料流、驗證或權限時同時使用 `security-checker`。

## 服務在哪裡

| 項目 | 位置 |
| --- | --- |
| Worker 程式 | `workers/feedback/src/`（`routes/`、`domain/`、`services/`、`storage/`），設定 `workers/feedback/wrangler.jsonc` |
| D1 schema | `workers/feedback/migrations/`，依序編號，只新增不改舊檔 |
| 測試 | `workers/feedback/test/`（unit、integration、e2e，vitest） |
| 擴充套件端 | `src/services/feedback*.ts`、`src/webview/feedbackPanel.ts` 與其 `src/test/` |
| 契約與腳本 | `scripts/feedback/`（contracts、portal locales、VSIX 隱私檢查、triage 技能測試） |
| 正式值、secret 清單、部署順序與回復 | [docs/feedback-deployment.md](../../../docs/feedback-deployment.md) |
| 發布前人工 gate | [docs/feedback-release-checklist.md](../../../docs/feedback-release-checklist.md) |
| 規格 | `specs/070-user-feedback/`（整合歸檔後見 `docs/specifications/`） |

正式 Worker、網域、D1、R2、私密 repo 與 Access 設定以部署手冊為準；不要從記憶或本文件推定，也不要把手冊的值抄進其他地方。

## 不可違反的限制

- **隱私**：測試、fixture、PR、issue、log 與回報只用虛構內容。不得把真實回饋、reporter 識別、附件、診斷值或私密 repo 的 issue 內容貼到公開 repo、PR 描述或對話。分流回饋用 `triage-user-feedback`，它是唯讀的。
- **秘密**：pepper、GitHub App private key、webhook secret、actor／repository id 只放 Cloudflare secret store。不寫進 Git、`.dev.vars` 以外的檔案、命令參數或 shell history；`.dev.vars` 用完即刪。
- **資料保護不變式**：R2 維持私有；公開核准只限 `OWNER_ACTOR_IDS`；GitHub 內容操作先以 numeric repository id 驗證 slug 與 visibility；webhook 驗 HMAC；刪除與 scrub 失敗時 fail closed，交給 durable outbox 重試。修改相關程式時保留並補強測試，不放寬。
- **VSIX 邊界**：`workers/`、部署檔、測試、fixture 與 secret 不得進 VSIX；改到 `.vscodeignore` 或打包設定時跑 `npm run feedback:verify-vsix:test`。

## 修改流程

1. 讀 `docs/feedback-deployment.md` 中與本次相關的段落，以及 `maintain-singular-blockly` 的 lessons 相關條目。
2. 改程式，沿用既有寫法。新的 D1 欄位或表一律新增下一個編號的 migration，並在部署手冊記下「必須在哪個 Worker 版本切換流量前完成」。
3. 本地驗證（雲端容器同樣可跑）：

   ```bash
   npm run feedback:contracts
   npm run feedback:typecheck
   npm run feedback:test
   npm run feedback:portal-locales:check   # 改到 portal 或政策文字時先跑 feedback:portal-locales 重建
   npm run feedback:verify-vsix:test
   npm run ci:static
   ```

   改到擴充套件端回饋面板時另跑 `xvfb-run -a npm run test:unit:ci`，並依 `cloud-local-verification` 做視覺與互動驗證。改到政策頁或 portal 文字時依 `i18n-maintenance` 檢查 15 語系。
4. 依 `pr-review-release` 與整合佇列開 PR、合併。合併 PR 不會部署 Worker；正式部署是另一個步驟（見下節）。

## 必須先問 Ray 的事

下列都會改到正式環境或使用者資料，即使 CI 全綠也要先取得 Ray 在對話中的明確同意，並附上要執行的步驟、驗證方式與回復計畫：

- 部署 Worker 新版本、切換或回復流量版本。
- 對正式 D1 套用 migration，或任何正式 D1／R2 的寫入與刪除。
- 新增、輪替或刪除 secret（輪替 reporter pepper 會讓現有匿名憑證失效，需要使用者通知計畫）。
- 改 DNS route、Cloudflare Access policy、GitHub App 權限、安裝範圍或 webhook。
- 在正式環境建立 synthetic 回饋做 smoke test。

部署順序、smoke test 項目與回復步驟一律照部署手冊；完成後把新的 Worker version id 與驗證結果寫回手冊，不寫入任何秘密或使用者內容。

## 雲端工作階段

- 可以：修改程式、跑上面所有本地驗證、讀部署手冊、用 GitHub MCP 開 PR。
- 雲端工作階段可以執行正式部署（Ray 2026-10-21 決定）：上一節「必須先問 Ray 的事」仍須先在討論串取得 Ray 對該次操作的明確同意（例如「同意部署回饋網頁」）。環境的 `api.cloudflare.com` 由 proxy 注入 `CLOUDFLARE_API_TOKEN`，網路允許清單含 `blockly-support.singular-ai.org` 供部署後檢查。
- 部署步驟：在乾淨的 `origin/master` worktree 設 `CLOUDFLARE_API_TOKEN=proxy-injected`（實際值由 proxy 注入）與 `CLOUDFLARE_ACCOUNT_ID`（由 `GET /client/v4/accounts` 取得），先以 `npx wrangler d1 migrations list singular-blockly-feedback --config workers/feedback/wrangler.jsonc --remote` 確認待套用項目，再 `npx wrangler deploy --config workers/feedback/wrangler.jsonc`，最後依部署手冊檢查公開頁面並把 version id 寫回手冊。
- `wrangler secret` 與正式 D1 migration 一樣各自需要 Ray 同意；secret 值不得出現在雲端命令參數、log 或對話。
- 需要讀正式狀態（例如目前流量版本）時，只做唯讀查詢，結果只回報摘要。

## 回報

列出改了哪些路由、資料表或流程、跑過的驗證與結果、是否需要新的 migration 或部署，以及部署前要 Ray 決定的事項。
