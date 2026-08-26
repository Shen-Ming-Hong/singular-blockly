# Data Model: 提供回饋與進度追蹤

**Date**: 2026-08-19

## Conventions

- 所有主鍵使用不具時間或身分語意的 UUID；對外顯示 `public_reference`（例如 `SB-F7K3Q9`），不暴露資料庫 row id。
- 時間以 UTC ISO 8601 在 API 傳遞、以 Unix seconds 存入 D1。
- 自由文字一律視為 untrusted data；查詢使用 prepared statements，HTML 顯示使用 `textContent`。
- JSON 欄位在寫入前依固定 schema 驗證，不接受未定義欄位。
- Reporter secret、session token、CSRF token、GitHub token 與 webhook secret 永不寫入資料庫或 application log；只保存 keyed HMAC。

## Entity Relationship

```text
Reporter 1 ─── * Feedback 1 ─── 0..1 Attachment
                    │
                    ├── * FeedbackMessage
                    ├── * TriageAssessment
                    ├── 0..1 DevelopmentApproval
                    └── 0..1 FeedbackTombstone (delete 後取代內容)

Reporter 1 ─── * Session
Reporter 1 ─── * IdempotencyRecord

Feedback/Message/Delete ─── * OutboxEvent ─── 0..1 GitHubMapping
Uncommitted R2 upload ─── 1 PendingAttachmentUpload
WebhookDelivery ─── 0..* domain update
AuditEvent（只保存去敏事件代碼與 target id）
```

## 1. Reporter

匿名回報者 ownership，不含姓名、電子郵件或 GitHub 帳號。

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID |
| `secret_hmac` | TEXT UNIQUE | `HMAC-SHA-256(server_pepper, reporter_secret)` 的 base64url |
| `created_at` | INTEGER | required |
| `last_seen_at` | INTEGER | required；成功認證後更新但不作行為分析 |
| `revoked_at` | INTEGER nullable | delete-all 後設定；被撤銷者不得再交換 session |

Indexes: unique `secret_hmac`; `revoked_at`。

## 2. Feedback

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID |
| `public_reference` | TEXT UNIQUE | 6–10 chars 不連續隨機顯示碼 |
| `reporter_id` | TEXT FK | Reporter ownership，cascade delete |
| `kind` | TEXT | `bug \| feature \| question \| other` |
| `title` | TEXT | trim 後 5–120 Unicode chars |
| `description` | TEXT | 10–8,000 chars |
| `steps` | TEXT nullable | 0–4,000 chars；bug 才顯示但 server 不依 UI 信任 |
| `expected` | TEXT nullable | 0–2,000 chars |
| `diagnostics_json` | TEXT | schema versioned；最多 8 KiB；可為空 object |
| `public_status` | TEXT | `received \| triaging \| needs-info \| planned \| in-progress \| resolved \| closed` |
| `decision` | TEXT | `unreviewed \| actionable \| not-actionable` |
| `resolution` | TEXT nullable | `duplicate \| not-product \| unsupported \| out-of-scope \| cannot-reproduce \| insufficient-info \| spam` |
| `public_reason` | TEXT nullable | not-actionable 必填，20–2,000 chars |
| `created_at` | INTEGER | required |
| `updated_at` | INTEGER | required |
| `last_status_command_id` | INTEGER nullable | 最近一次成功公開狀態命令的 GitHub comment id；用於條件更新與同一 D1 batch 的訊息／delivery guard |

Validation invariants:

- `decision = not-actionable` ⇒ `resolution` 與 `public_reason` 皆非 null。
- `decision != not-actionable` ⇒ `resolution` 應為 null；公開說明可存在於 message，不塞入 `public_reason`。
- `public_status = needs-info` ⇒ 必須有一筆 maintainer public message 說明需要什麼。
- 建立時固定 `public_status=received`, `decision=unreviewed`。
- 診斷 schema 只允許 spec FR-006/007 欄位；禁止額外 properties。

Indexes: `(reporter_id, created_at DESC)`, `(decision, created_at)`, `(public_status, updated_at)`, `kind`。

## 3. Attachment

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID |
| `feedback_id` | TEXT FK UNIQUE | 每筆最多一張，cascade delete |
| `r2_key` | TEXT UNIQUE | 128-bit random key，不含 reporter/feedback/title |
| `media_type` | TEXT | `image/png \| image/jpeg` |
| `size_bytes` | INTEGER | 1..3,145,728 |
| `width` / `height` | INTEGER | 1..1920，至少一邊 ≤1920 且兩邊皆 ≤1920 |
| `sha256` | TEXT | 完整檔案 digest，用於 integrity/dedup evidence，不作公開 URL |
| `created_at` | INTEGER | required |

刪除順序：先標為 delete-pending 並拒絕讀取，保留 create outbox marker；私密 GitHub issue 的可刪除 content comments 與 R2 object 刪除成功後，才以 D1 batch 寫入 content-free tombstone、成功 idempotency record 並刪除 row。GitHub Issue title/body 從建立起只含無內容 routing shell，不得把回饋原文寫入會留下編輯歷史的欄位。任何外部步驟暫時失敗都回 503，並由相同 idempotency key 或 outbox 重試。delete-all 在撤銷 reporter/session 的同一個 D1 batch 中，必須把所有 active/delete-pending row 標為 delete-pending、為尚未排程者建立 delete outbox，並將其他 idempotency response 改成不含本文的固定 410 envelope，確保撤銷後即使 Worker 中斷也不依賴舊憑證或後續 request 才能完成隱私清除。

### 3.1 PendingAttachmentUpload

在 R2 upload 前先建立的持久補償 marker，不屬於已提交的 Feedback。

| Field | Type | Rules |
|-------|------|-------|
| `r2_key` | TEXT PK | 與預計寫入 R2 的 128-bit random key 相同；不得含使用者資料 |
| `created_at` | INTEGER | required；供 scheduled cleanup 判定 grace period |

建立 Feedback 的 D1 batch 必須與 Attachment 一起原子刪除 marker。若 R2 write 或 D1 batch 失敗，marker 保留至少 10 分鐘後由 cron 刪除 R2 object；只有 R2 delete 成功後才刪除 marker，失敗則下次重試。此 grace period 可涵蓋不確定的 response/commit 結果，且成功 commit 不會留下可誤刪正式附件的 marker。

## 4. FeedbackMessage

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID |
| `feedback_id` | TEXT FK | cascade delete |
| `author_type` | TEXT | `reporter \| maintainer` |
| `visibility` | TEXT | v1 持久層只接受 `public`；internal comments 只留 GitHub |
| `body` | TEXT | 1–4,000 chars |
| `github_comment_id` | INTEGER nullable UNIQUE | maintainer public command 同步來源 |
| `created_at` | INTEGER | required |

Reporter detail 固定先回傳最早 20 筆訊息與簽章 `nextMessageCursor`；後續以 ownership-scoped `GET /messages` 每頁最多 50 筆。Cursor 綁定 reporter 與 feedback id，不能跨 reporter、跨 feedback 或與 feedback list cursor 混用。

## 5. TriageAssessment

保存建議與人工決定的區隔；自動化只能寫 suggestion fields。

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID |
| `feedback_id` | TEXT FK | cascade delete |
| `source` | TEXT | `agent \| maintainer` |
| `kind_suggestion` | TEXT nullable | kind enum |
| `area` | TEXT nullable | controlled label vocabulary |
| `impact` | TEXT nullable | `low \| medium \| high \| critical` |
| `recommendation` | TEXT nullable | `investigate \| duplicate \| plan \| decline \| ask-info` |
| `duplicate_feedback_id` | TEXT nullable FK | 不可指向自己 |
| `rationale` | TEXT | 1–2,000 chars；不可含秘密/完整 diagnostics |
| `created_at` | INTEGER | required |

## 6. DevelopmentApproval

| Field | Type | Rules |
|-------|------|-------|
| `approval_id` | TEXT PK | 建立時可沿用 feedback UUID；解除私密關聯後仍作穩定稽核識別 |
| `feedback_id` | TEXT nullable UNIQUE FK | 公開 Issue 建立前連結私密回饋；刪除未公開回饋時一併移除，公開後刪除則設為 null |
| `proposed_summary` | TEXT | 去識別化，20–4,000 chars |
| `approved_by` | TEXT | 專案負責人的 GitHub numeric actor id 字串 |
| `approved_at` | INTEGER | required |
| `public_repo_id` | TEXT nullable | 建立後設定 |
| `public_issue_number` | INTEGER nullable | 建立後設定 |
| `link_severed_at` | INTEGER nullable | 公開 Issue 已建立且原回饋刪除時設定，同一交易清除 private feedback id mapping |

公開摘要禁止 reporter reference、private issue number（包含不帶 `#` 的實際 numeric id）、attachment、diagnostics、原始逐字內容與任何內部 URL。公開 Issue 建立後，即使回報者刪除私密回饋，`approved_by`、`approved_at`、公開 repository／Issue mapping 與 `link_severed_at` 仍須保留為 content-free 核准證據。

## 7. Session

| Field | Type | Rules |
|-------|------|-------|
| `id_hmac` | TEXT PK | session cookie 的 HMAC，不保存明文 |
| `reporter_id` | TEXT FK | cascade delete |
| `csrf_hmac` | TEXT | CSRF token HMAC |
| `created_at` | INTEGER | required |
| `expires_at` | INTEGER | ≤ created + 24h |
| `revoked_at` | INTEGER nullable | delete-all / credential reset 時撤銷 |

Cookie: random 256-bit; `HttpOnly; Secure; SameSite=Strict; Path=/`; portal response `Cache-Control: no-store`。

## 8. IdempotencyRecord

| Field | Type | Rules |
|-------|------|-------|
| `reporter_id` | TEXT FK | composite PK part |
| `route` | TEXT | composite PK part，固定 allowlist |
| `key` | TEXT | composite PK part，UUID |
| `request_sha256` | TEXT | canonical metadata + attachment digest |
| `response_status` | INTEGER | original status |
| `response_json` | TEXT | 不含 secret；≤16 KiB |
| `created_at` / `expires_at` | INTEGER | 7-day TTL |

同 key + 同 digest 回傳原 response；同 key + 不同 digest 回 `409 idempotency_conflict`。

## 9. GitHubMapping

| Field | Type | Rules |
|-------|------|-------|
| `feedback_id` | TEXT PK/FK | 一筆 private issue |
| `repository_id` | TEXT | 必須等於 private repo allowlist id |
| `issue_number` | INTEGER UNIQUE | positive |
| `issue_node_id` | TEXT | GitHub opaque id |
| `last_synced_at` | INTEGER | required |

Delete 後 mapping 移到 tombstone，Feedback FK 解除。

## 10. OutboxEvent

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID，同時作 external idempotency marker |
| `aggregate_type` / `aggregate_id` | TEXT | feedback/message/tombstone |
| `event_type` | TEXT | create/update/public-message/delete/create-public-issue |
| `payload_json` | TEXT | 僅同步所需資料；禁止 secret/session/IP |
| `status` | TEXT | `pending \| processing \| completed \| dead` |
| `attempt_count` | INTEGER | 0..10 |
| `next_attempt_at` | INTEGER | exponential backoff + jitter |
| `last_error_code` | TEXT nullable | 穩定代碼，不保存第三方 raw body |
| `created_at` / `completed_at` | INTEGER | completed row 7 天後清除 |

一般同步事件達重試上限後可進入 `dead` 供維護者調查；`delete` 屬隱私清除工作，不得永久 dead-letter，逾時 lease 或達一般上限時須回到 pending 並繼續採退避重試。

## 11. WebhookDelivery

| Field | Type | Rules |
|-------|------|-------|
| `delivery_id` | TEXT PK | `X-GitHub-Delivery` UUID |
| `event_name` | TEXT | allowlist: `issues`, `issue_comment` |
| `repository_id` | TEXT | 必須符合兩個 allowlist repo |
| `payload_sha256` | TEXT | integrity/debug，不保存 raw payload |
| `processed_at` | INTEGER | 30-day TTL |
| `command_result_code` | TEXT nullable | 命令成功為 `accepted`，失敗只保存穩定錯誤代碼；一般事件為 null |
| `command_acknowledged_at` | INTEGER nullable | GitHub 私密短確認完成時間；null 表示相同 delivery 重送時只需補做確認 |

先驗證 signature，才查/寫 delivery row；重送相同 delivery 不重做 mutation。若命令結果已保存但確認時間仍為 null，Worker 只以 command comment id marker 補送同一短確認，完成後回 202。

## 12. FeedbackTombstone

| Field | Type | Rules |
|-------|------|-------|
| `public_reference_hash` | TEXT PK | server-keyed HMAC，不保存可顯示 reference |
| `private_issue_number` | INTEGER nullable | 不含內容的後續 scrub routing；已建立私密 Issue 時持續保留，讓刪除後的新留言 webhook 可重新排程清除 |
| `delete_state` | TEXT | `pending \| scrubbed` |
| `deleted_at` | INTEGER | required |

不得保存 title、body、diagnostics、message、attachment key、reporter id 或 public record link。

## 13. AuditEvent

| Field | Type | Rules |
|-------|------|-------|
| `id` | TEXT PK | UUID |
| `event_code` | TEXT | allowlist，例如 auth_failed/rate_limited/webhook_rejected |
| `target_hash` | TEXT nullable | server-keyed、短期穩定 pseudonym |
| `outcome` | TEXT | success/denied/error |
| `created_at` / `expires_at` | INTEGER | 最長 90 天 |

Audit 不含 raw IP、headers、request body、secret、free text 或 raw exception。

## State Transitions

### Public Status

```text
received → triaging → needs-info ↔ triaging
                    → planned → in-progress → resolved → closed
received/triaging/needs-info/planned/in-progress → closed
resolved → in-progress（僅明確 reopen command）
```

- `needs-info` 必須伴隨 maintainer public message。
- `closed` 不等於 `not-actionable`；duplicate 等不採取行動通常組合 `not-actionable + closed`。
- `resolved` 表示問題或需求已完成；`closed` 表示不再追蹤。
- 狀態命令以目前狀態與 `last_status_command_id` 做原子條件更新；只有成功取得該命令識別的 batch 才能寫入伴隨公開訊息與 webhook delivery。

### Decision

```text
unreviewed → actionable
unreviewed → not-actionable (resolution + public_reason required)
actionable ↔ not-actionable（每次都需 maintainer explicit command 與 audit）
```

Agent suggestion 不改 decision。

### Delete

```text
active → delete-pending (立即停止讀取；API 回 503 直到完成)
       → github-private-content-scrubbed + R2-deleted
       → tombstone-only + idempotent 204
```

R2 或 GitHub 暫時失敗時由相同 idempotency key 或 outbox 重試；API 對一般讀取從 `delete-pending` 起即視為不存在，但刪除重試仍可依 ownership 完成。
