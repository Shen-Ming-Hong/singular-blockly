# 回饋服務部署與回復手冊

本文件定義正式環境需求、已建立的非機密資源與人工回復步驟。`workers/feedback/wrangler.jsonc` 已包含經專案負責人核准的正式 D1 UUID、Access audience 與自訂網域 route；所有秘密仍只存在 Cloudflare secret store，不會寫入儲存庫。後續新增、刪除或重新建立 Cloudflare、GitHub 與 DNS 資源仍須另行核准，不能由一般建置或測試自動執行。

## 固定正式值

| 項目 | 正式值或規則 |
|---|---|
| Worker | `singular-blockly-support` |
| 公開來源 | `https://blockly-support.singular-ai.org` |
| Access team domain | `innovationspark.cloudflareaccess.com` |
| D1 | `singular-blockly-feedback`，location hint 固定為 `apac` |
| R2 | 私有 bucket；名稱建議 `singular-blockly-feedback-screenshots` |
| 私密儲存庫 | `Shen-Ming-Hong/singular-blockly-feedback`，必須是 private |
| 公開儲存庫 | `Shen-Ming-Hong/singular-blockly` |
| Session | 最長 24 小時，`HttpOnly; Secure; SameSite=Strict` |
| Idempotency | 7 天 |
| Audit | 最長 90 天，不含 raw IP、header、本文或例外內容 |

正式環境已於 2026-08-20 建立；2026-08-21 將 durable delete-all jobs、永續隱私刪除重試與服務端診斷值允許清單部署為 Worker version ID `9d3bccf8-89bb-49bf-8e3f-d11289da04fb`。部署後 `/health`、完整政策頁均為 HTTP 200，未認證 attachment route 為 Cloudflare Access HTTP 302。production synthetic `SB-KMYPSBZ4`／`SB-XT89QWE4` 已通過 create/list/detail/message replay/recovery/private GitHub sync/delete-all；Issue #5/#6 刪除後只剩 `[Deleted feedback]` 且 0 comments。先前中斷的 synthetic Issue #3/#4 也由 durable outbox 完成相同清除，最後 D1 synthetic feedback、pending delete 與 pending attachment 均為 0。R2 不得開啟公開網址或自訂公開網域。Worker broad observability 維持關閉；應用程式只使用 D1 的 allowlisted audit event。

2026-08-23 已核對 `0003_status_transition_command.sql` 的正式 schema 並補齊缺少的 migration registry 紀錄，接著正式套用 `0004_detached_development_approvals.sql`。目前 100% 流量版本為 `aa5f5203-2ad4-4fd8-97f8-8c57fe10cb70`（程式版本 `f6ccc71a-1966-4e79-a44b-88d1a2bbc4ce` 加上 webhook secret 更新）；`/health` 與三個政策頁為 HTTP 200，未認證 attachment route 為 Access 302。私人 repository webhook `669404259` 已啟用、只訂閱 Issues／Issue comment，最近正式 issue-comment deliveries 均為 HTTP 202。production smoke 使用一個不含敏感內容的 synthetic reporter，完成 create/list/detail/message replay、recovery、status、public-reply、匿名公開核准、單筆刪除與 delete-all；私人 Issue #10 已成為鎖定、0 comments 的 `[Deleted feedback]` tombstone，synthetic public Issue #138 已在驗證後刪除。最終 D1 active synthetic feedback 與 pending／processing outbox 均為 0，並保留一筆已解除私密 `feedback_id` 關聯的 content-free 核准證據。測試 recovery secret 只存在單一程序記憶體，未寫檔或輸出。

2026-08-26 08:04–08:07（Asia/Taipei）完成正式 Worker deployment rollback drill：先由 `aa5f5203-2ad4-4fd8-97f8-8c57fe10cb70` 回復至上一個已驗證版本 `f6ccc71a-1966-4e79-a44b-88d1a2bbc4ce`，Dashboard 顯示舊版承接 100% 流量；在回復會同步還原 `GITHUB_WEBHOOK_SECRET` 的明確警告下取得專案負責人核准後執行。舊版的 `/health`、`/privacy`、`/support`、`/terms` 均回傳 HTTP 200。隨後立即將 `aa5f5203-2ad4-4fd8-97f8-8c57fe10cb70` 提升回 100% 流量，四個公開端點再次全部回傳 HTTP 200。演練未修改或回復 D1／R2、未使用 D1 Time Travel、未建立測試回饋，最終正式版本與演練前相同。

## Worker secrets

以下值只能放入 Cloudflare secret store，不能寫入 `.dev.vars` 以外的本機暫存、Git、VSIX、CI log 或文件：

- `REPORTER_HMAC_PEPPER`: 至少 32 個隨機 bytes，用於 reporter、session、cursor 與 tombstone HMAC。
- `IP_HMAC_PEPPER`: 與 reporter pepper 獨立的至少 32 個隨機 bytes，只用於短期速率限制鍵。
- `GITHUB_APP_ID`: GitHub App numeric id；雖非高敏感資料，與其他 App 設定一併管理。
- `GITHUB_INSTALLATION_ID`: 只允許指定 repositories 的 installation id。
- `GITHUB_PRIVATE_KEY`: GitHub App PKCS#8 private key。
- `GITHUB_WEBHOOK_SECRET`: 至少 32 bytes 的 webhook HMAC secret。
- `PRIVATE_GITHUB_REPOSITORY_ID`、`PUBLIC_GITHUB_REPOSITORY_ID`: numeric repository id allowlist，不使用可改名的名稱作授權判斷。
- `MAINTAINER_ACTOR_IDS`: 逗號分隔的 numeric GitHub actor id allowlist。
- `OWNER_ACTOR_IDS`: `MAINTAINER_ACTOR_IDS` 的明確子集；只有此清單可執行 `approve-public`。

每個 pepper／private key／webhook secret 必須獨立產生、彼此不同且可個別撤銷；Worker 會拒絕 `.dev.vars.example` 的公開 placeholder 或其他已知範例形狀。輪替 reporter pepper 會使現有匿名憑證失效，需先有使用者通知與資料處置計畫；不要把它當作一般無停機輪替。

GitHub 下載的 App private key 是 PKCS#1（`BEGIN RSA PRIVATE KEY`）；Worker Web Crypto 只接受 PKCS#8（`BEGIN PRIVATE KEY`）。部署前須在記憶體或受控本機環境轉換，例如 `openssl pkcs8 -topk8 -nocrypt -in app.pem -out app-pkcs8.pem`，完成 Cloudflare secret 更新後依秘密檔案處置政策清除暫存。使用 Wrangler 可直接輸入多行 PEM；若 Cloudflare Dashboard 欄位只接受單行，必須以字面 `\n` 保存換行，Worker 會在匯入前還原。不得把 PEM 放在命令參數、shell history、文件或 Git。

## GitHub App 最小權限

建立專用 App，不共用個人 token。Repository permissions 只開：

- Metadata: read（GitHub 固有最低需求）
- Issues: read and write

不開 Contents、Actions、Administration、Members、Secrets 或其他 organization 權限。App 安裝範圍必須選 **Only select repositories**，且只選私密 feedback repo 與公開產品 repo；前者保存私密工作副本，後者只允許 owner 核准後建立去識別化 Issue。每個內容操作會先透過 numeric repository ID 讀取 GitHub metadata，並要求回傳的 ID、完整 slug 與 private/public visibility 全部符合設定；任何對調、改名或 visibility 錯置都會在內容送出前 fail closed。Webhook 只訂閱 `Issues` 與 `Issue comment`，URL 固定為 `/api/v1/github/webhooks`，啟用 webhook secret。

Worker 對 GitHub REST API 的 token 與 Issues 請求都明確帶 `User-Agent: Singular-Blockly-Feedback`。Cloudflare workerd 的原生 `fetch` 必須以 `globalThis.fetch.bind(globalThis)` 保留正確 receiver；否則 scheduled outbox 會以 `illegal invocation` 失敗，即使相同 GitHub App JWT 在 Node.js 可成功換取 installation token。

私密 GitHub Issue 的 title/body 只能保存不含回饋內容的 routing shell 與 outbox marker。回饋原文、allowlisted diagnostics、附件 Access URL 與後續內部討論都必須放在可由 Issues API 刪除的 comments；不能把可刪除資料寫入會留下可見編輯歷史的 Issue title/body。GitHub App 對已鎖定 conversation 執行 comment DELETE 可能回 403，因此 scrub 只在每個有界刪除批次前暫時解除鎖定，批次完成後立即重新鎖定並在鎖定狀態確認沒有殘留留言；刪除失敗時也須嘗試恢復鎖定。只有確認清空後才可把 shell 關閉為 content-free tombstone；若 100 批後仍有留言，必須 fail closed 留給 durable outbox 重試。

相同 receiver 規則也適用於 Cloudflare Access JWKS 下載；快取中遇到未知 `kid` 時只強制重抓一次 JWKS，以支援金鑰輪替並維持 fail closed。GitHub App 與 Access JWT 驗證均有 brand-checked runtime fetch 回歸測試。公開建立回饋 API 必須在讀取 request body、解析 multipart 或解壓圖片前，先以 header 可取得的 reporter HMAC 與來源 HMAC 執行速率限制，避免超額請求仍消耗圖片驗證資源。所有 reporter 查詢與 mutation 也必須在 D1 憑證查詢前使用獨立的 `SOURCE_RATE_LIMITER`（來源 HMAC、每分鐘 120 次）；驗證成功後再使用 `REPORTER_RATE_LIMITER`，且同一 reporter 的 bearer 與所有 recovery sessions 必須共用相同主要限速鍵。

設定完成後，把兩個 numeric repository id、installation id、maintainer/owner numeric actor ids 寫入 secret store。測試改名、重送 delivery、非白名單 actor、非白名單 repository 與錯誤簽章都必須被拒絕。

## Cloudflare Access

`/admin/attachments/*` 必須放在獨立 Access application 後方。設定 `CLOUDFLARE_ACCESS_TEAM_DOMAIN` 與正式 audience，policy 只允許專案維護者身分。Worker 仍會驗證 Access JWT 的 RS256 簽章、issuer、audience、期限與 subject，不能只信任 email header。

`/privacy`、`/support`、`/terms`、`/health` 與 reporter API 不放在 maintainer Access application 內。R2 object key 永不直接回傳給 Extension 或公開 portal。

三個公開政策頁必須提供版本化完整內容，不得只呈現送出畫面的摘要。全部 15 個既有支援語系都要顯示該語系的完整隱私權、支援與條款本文；英文只允許作未知語系 fallback。每次資料流、保存期限或處理者異動都要同步檢查 repository policy 文件與 Worker 詳細政策。

## 初次部署順序

1. 由負責人核准 `apac` 資料區域、隱私文件、GitHub App 與 Access policy。
2. 建立 D1/R2，但不接 production DNS；把真實 binding id 寫入受審查的部署設定。
3. 以 Cloudflare secret 管理命令逐項加入上列秘密，確認命令輸出不回顯值。
4. 在 staging/local 套用 `workers/feedback/migrations/`，執行 `npm run feedback:contracts` 與 `npm run feedback:test`。
5. 部署 Worker 到暫時 hostname，逐項執行建立、查詢、補充、刪除、delete-all、session、webhook、outbox、附件 Access 與 tombstone smoke tests。
6. 驗證公開政策頁與 VSIX 中的版本一致，再切換 `blockly-support.singular-ai.org` route。
7. 完成 [feedback-release-checklist.md](feedback-release-checklist.md) 的 Marketplace 與 Open VSX 人工 gate 後才發布 Extension。

不得在 migration 尚未成功、secret 含占位值、R2 可公開讀取、GitHub App 權限過大或 Access 未驗證時切 production DNS。

Migration `0002_pending_attachment_cleanup.sql` 必須在含 durable attachment cleanup 的 Worker 版本切換流量前完成。Scheduled handler 每分鐘檢查超過 10 分鐘的 `pending_attachment_uploads`：成功 Feedback transaction 已原子移除 marker；其餘 marker 對應的 R2 object 只有在刪除成功後才移除，暫時失敗會留待下一輪重試。部署後應確認此表存在、cron 正常執行，且 R2 仍維持 private。

Migration `0003_status_transition_command.sql` 必須在含條件式狀態命令與短確認的 Worker 版本切換流量前完成。`last_status_command_id` 只保存 GitHub comment numeric id，不含回饋本文；狀態更新、伴隨公開訊息與 webhook delivery 會在同一 D1 batch 以此值綁定，避免兩個以相同舊狀態開始的命令產生禁止轉移。`webhook_deliveries.command_result_code` 與 `command_acknowledged_at` 只保存穩定結果與時間；部署後須驗證 GitHub API 暫時失敗時，同一 delivery 只補送有 comment-id marker 的短確認而不重做 mutation。

Migration `0004_detached_development_approvals.sql` 必須在含公開核准證據保留邏輯的 Worker 版本切換流量前完成。它為核准紀錄加入獨立 `approval_id`，並允許公開 Issue 建立後在刪除私密回饋時把 `feedback_id` 設為 null、寫入 `link_severed_at`，同時保留 owner、核准時間及公開 repository／Issue mapping。部署後須以無敏感內容的測試回饋建立公開項目、刪除私密回饋，確認公開紀錄無 backlink 且 D1 仍保有 content-free 核准證據。

上述 `0004` 部署後驗證已於 2026-08-23 完成：公開項目建立後刪除私密回饋，D1 核准紀錄的 `feedback_id` 為 null、`link_severed_at` 已寫入，私人 Issue 已 scrub；synthetic 公開項目隨後刪除，不保留測試用公開內容。

## 回復與事故處理

- Worker 程式回歸：先停止新的 Extension 發布，透過 Cloudflare deployment history 回復到上一個已驗證版本。不要刪除 D1/R2；確認舊版 schema 能讀目前 migration 後才回復。
- GitHub 同步故障：保留 API 與 D1 接收，暫停 scheduled outbox consumer；修正後以相同 outbox id 重試，不能手動複製私密內容到公開 repo。
- 可疑 webhook/private key：撤銷 App private key、輪替 webhook secret、暫停 webhook route，檢查 `webhook_deliveries` 與 content-free audit，不匯出原始回饋。
- 備援憑證疑似外洩：使用者執行 delete-all 會撤銷 reporter 與所有 session。若無法證明 ownership，不以搜尋內容替代驗證。
- R2 刪除失敗：回饋保持 `delete-pending` 且立即不可讀，由 outbox 重試；不得先宣稱供應商備份已完全抹除。
- 需要完全停用：移除 DNS route 或套用回覆穩定 `service_unavailable` 的已審查版本，保留 `/privacy`、`/support`、`/terms`；通知使用者後再決定資料匯出或刪除。任何批次刪除都需另行核准與可復原備份計畫。

回復後重跑完整 smoke tests，確認沒有重複 GitHub Issue／留言、沒有重新出現已刪除內容，並記錄穩定事件代碼與時間，不記錄 raw request 或使用者本文。
