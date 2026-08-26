# Tasks: 提供回饋與進度追蹤

**Input**: Design documents from `/specs/070-user-feedback/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: 規格 FR-042 明確要求單元、契約、整合、端到端、安全、語系與封裝檢查；各故事採先寫失敗測試再實作。

**Organization**: 依使用者故事分組；同為 P1 的 US1、US2、US5 先完成，再進入 P2 的 US3、US4。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可在不同檔案上平行處理，且不依賴同階段未完成任務
- **[Story]**: 對應 spec.md 的使用者故事
- 每項皆列出確切檔案路徑

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立 Worker、契約驗證與封裝邊界，不改 production 資源

- [x] T001 在根 `package.json` 與 `package-lock.json` 加入 Wrangler/Workers 測試相依與 `feedback:*` scripts，建立 `workers/feedback/wrangler.jsonc`、`workers/feedback/tsconfig.json`、`workers/feedback/vitest.config.mts`
- [x] T002 [P] 建立契約一致性檢查 `scripts/feedback/validate-contracts.js`，驗證 `specs/070-user-feedback/contracts/openapi.yaml`、TypeScript enums 與 GitHub command vocabulary
- [x] T003 [P] 更新 `.gitignore` 與 `.vscodeignore`，排除 `workers/feedback/.dev.vars`、Worker/deployment/spec/maintainer-only assets，保留 VSIX 所需 privacy/support/terms 與 feedback media
- [x] T004 [P] 建立 Worker 測試 fixtures 與 secret-safe 範例設定於 `workers/feedback/test/fixtures/`、`workers/feedback/.dev.vars.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 所有故事共用的 schema、身份、安全 middleware、儲存與隱私基礎

**⚠️ CRITICAL**: 本階段完成前不得進入任何使用者故事實作

- [x] T005 建立 Extension/API 共用契約型別、enum、size limit 與 type guards 於 `src/types/feedback.ts`
- [x] T006 [P] 建立 D1 初始 schema、constraints、indexes、TTL 欄位與 tombstone/outbox tables 於 `workers/feedback/migrations/0001_initial.sql`
- [x] T007 [P] 先寫 reporter HMAC、session、CSRF、origin、idempotency 與 constant-time compare 失敗測試於 `workers/feedback/test/unit/auth.test.ts`
- [x] T008 實作 Web Crypto reporter HMAC、session exchange、CSRF/origin 與 idempotency primitives 於 `workers/feedback/src/domain/auth.ts`
- [x] T009 [P] 先寫 strict schema、禁止欄位、狀態轉換與 error envelope 測試於 `workers/feedback/test/unit/schemas.test.ts`、`workers/feedback/test/unit/stateMachine.test.ts`
- [x] T010 實作 strict request/diagnostics schema、共用 error envelope 與 decision/status transitions 於 `workers/feedback/src/domain/schemas.ts`、`workers/feedback/src/domain/stateMachine.ts`
- [x] T011 [P] 建立可注入 D1/R2 repository interfaces 與 fake adapters 於 `workers/feedback/src/storage/types.ts`、`workers/feedback/test/fakes/storage.ts`
- [x] T012 實作 prepared statements、D1 batch 與 private R2 存取 adapters 於 `workers/feedback/src/storage/d1.ts`、`workers/feedback/src/storage/r2.ts`
- [x] T013 [P] 先寫 route dispatch、body cap、security headers、rate-limit key 與 sanitized audit tests 於 `workers/feedback/test/unit/http.test.ts`
- [x] T014 實作無框架 Worker router、request/body limits、no-store/security headers、Reporter/IP-HMAC rate limiting 與去敏 audit 於 `workers/feedback/src/index.ts`、`workers/feedback/src/domain/http.ts`
- [x] T015 [P] 將 `src/services/platformioPrivacyRedactor.ts` 泛化為 `src/services/privacyRedactor.ts` 並在相容 re-export 下保留既有呼叫，新增 `src/test/services/privacyRedactor.test.ts`
- [x] T016 更新 `src/services/platformioIssueDraftService.ts` 與既有測試改用通用 redactor，確認目前 PlatformIO 隱私測試全數通過

**Checkpoint**: Worker 可本機啟動、共用驗證與資料信任邊界可測試，尚未提供產品入口

---

## Phase 3: User Story 1 - 不需 GitHub 即可提供回饋 (Priority: P1) 🎯 MVP

**Goal**: 使用者可從原生入口填寫、預覽並確認送出純文字回饋，無需 GitHub 帳號

**Independent Test**: 全新 Extension Development Host 中開啟表單但取消時 Worker 無 request；完成一筆純文字回饋時預覽與實際 payload 一致並取得 reference

### Tests for User Story 1

- [x] T017 [P] [US1] 先寫 diagnostics allowlist/default/normalization 測試於 `src/test/services/feedbackDiagnostics.test.ts`
- [x] T018 [P] [US1] 先寫 SecretStorage identity、recovery fragment 與不洩漏 log 測試於 `src/test/services/feedbackIdentity.test.ts`
- [x] T019 [P] [US1] 先寫 API timeout/retry/idempotency/error sanitization 測試於 `src/test/services/feedbackClient.test.ts`
- [x] T020 [P] [US1] 先寫 create-feedback ownership、schema、rate-limit、idempotency 與 outbox integration tests 於 `workers/feedback/test/integration/createFeedback.test.ts`
- [x] T021 [P] [US1] 先寫 Webview CSP、message guards、preview confirmation digest 與 no-network-on-open contract tests 於 `src/test/webview/feedbackPanel.test.ts`

### Implementation for User Story 1

- [x] T022 [P] [US1] 實作只產生 spec FR-006/007 欄位的本機診斷與 recent stable event ring buffer 於 `src/services/feedbackDiagnostics.ts`
- [x] T023 [P] [US1] 實作 256-bit reporter secret 的 SecretStorage lifecycle 與 fragment recovery URL 於 `src/services/feedbackIdentity.ts`
- [x] T024 [US1] 實作可注入 fetch、proxy、timeout、Bearer 與 idempotency 的 API client 於 `src/services/feedbackClient.ts`
- [x] T025 [US1] 實作 Feedback/Reporter/Idempotency/Outbox 建立 transaction 與 `POST /api/v1/feedback` 純文字路徑於 `workers/feedback/src/domain/feedback.ts`、`workers/feedback/src/routes/feedback.ts`
- [x] T026 [P] [US1] 建立 accessible form/review/result HTML/CSS/JS 於 `media/html/feedback.html`、`media/css/feedback.css`、`media/js/feedback.js`，所有不可信文字使用 `textContent`
- [x] T027 [US1] 實作 `FeedbackPanel`、nonce CSP、最小 localResourceRoots、message validation、preview confirmation binding 與 API 呼叫於 `src/webview/feedbackPanel.ts`
- [x] T028 [US1] 在 `src/extension.ts` 與 `package.json` 註冊 `provideFeedback` 命令、`issue/reporter` menu 與 panel lifecycle
- [x] T029 [US1] 將 PlatformIO `createIssueDraft` action 改為預填並開啟通用 FeedbackPanel，更新 `src/webview/platformioDiagnosticPanel.ts`、`media/js/platformioDiagnostic.js` 與相關測試
- [x] T030 [US1] 在 `media/locales/*/messages.js`、`src/types/i18nKeys.ts` 與必要 `package.nls*.json` 加入 US1 表單、預覽、資料說明、錯誤與命令文案，執行 i18n validation

**Checkpoint**: 純文字問題/建議/疑問/其他回饋可在 VS Code 內安全送出，形成獨立 MVP

---

## Phase 4: User Story 2 - 自主控制診斷資料與截圖 (Priority: P1)

**Goal**: 使用者精確控制基本 diagnostics、recent events 與單張已淨化截圖

**Independent Test**: 預設/全關/主動開啟三組 payload 與 UI 一致；100 組格式/尺寸 fixtures 只接受符合 3 MiB/1920px/metadata-free 規則的附件

### Tests for User Story 2

- [x] T031 [P] [US2] 先寫 Webview Canvas re-encode、dimension/size、preview/remove 與 forbidden metadata contract tests 於 `src/test/suite/feedbackScreenshotContract.test.ts`
- [x] T032 [P] [US2] 先寫 magic bytes、media type、dimension、one-attachment 與 malicious multipart Worker tests 於 `workers/feedback/test/unit/screenshot.test.ts`、`workers/feedback/test/integration/createFeedbackAttachment.test.ts`
- [x] T033 [P] [US2] 先寫 diagnostics toggle 與 exact preview/submit digest tests 於 `src/test/webview/feedbackPanelPrivacy.test.ts`

### Implementation for User Story 2

- [x] T034 [P] [US2] 在 `media/js/feedback.js` 實作選檔、Canvas metadata stripping、1920px resize、3 MiB hard cap、preview/remove 與 local privacy warning
- [x] T035 [US2] 在 `src/webview/feedbackPanel.ts` 驗證 base64 canonical、magic bytes、dimensions、digest 並以 multipart 傳送，不傳檔名/path/lastModified
- [x] T036 [US2] 實作 Worker attachment revalidation、R2 random-key write 與 D1 Attachment transaction 於 `workers/feedback/src/services/screenshot.ts`、`workers/feedback/src/routes/feedback.ts`
- [x] T037 [US2] 完成基本 diagnostics 可關閉、recent events 預設關閉與傳送摘要 UI 於 `media/html/feedback.html`、`media/css/feedback.css`、`media/js/feedback.js`
- [x] T038 [US2] 補齊 15 語系的 diagnostics/事件/截圖/未成年隱私警示文案於 `media/locales/*/messages.js` 並更新 i18n contract tests

**Checkpoint**: US1 純文字流程維持可用，US2 額外資料只有主動選擇且三層驗證後才傳送

---

## Phase 5: User Story 5 - 符合擴充套件上架資訊揭露 (Priority: P1)

**Goal**: 安裝前與送出前均可取得一致的線上服務、資料、保留與刪除揭露，VSIX 不含服務端或秘密

**Independent Test**: 從 manifest/README 找到 policy 文件，逐欄比對 UI 揭露；打包後自動確認不含 Worker、秘密與 maintainer-only 資產

### Tests for User Story 5

- [x] T039 [P] [US5] 先寫 manifest links、README disclosure、policy required sections 與 UI disclosure consistency tests 於 `src/test/suite/feedbackMarketplaceCompliance.test.ts`
- [x] T040 [P] [US5] 先寫 VSIX archive allow/deny list 與 secret-pattern verifier 於 `scripts/feedback/verify-vsix-privacy.js`、`scripts/feedback/verify-vsix-privacy.test.js`

### Implementation for User Story 5

- [x] T041 [P] [US5] 撰寫繁體中文 `PRIVACY.md`，涵蓋收集項目、目的、Cloudflare/GitHub、跨境、保留、刪除、備份、公開匿名摘要、未成年與聯絡方式
- [x] T042 [P] [US5] 撰寫繁體中文 `SUPPORT.md` 與 `TERMS.md`，區分一般回饋、安全漏洞通報、服務限制與禁止濫用
- [x] T043 [US5] 更新 `README.md` 的 Online Services and Data Use 摘要、隱私/支援/條款連結與非 GitHub 回饋流程
- [x] T044 [US5] 在 `package.json` 加入 `homepage`、`bugs.url`、合規 scripts 與必要 marketplace metadata，並完成 `.vscodeignore` 最終封裝邊界
- [x] T045 [US5] 在 Worker portal 實作 `/privacy`、`/support`、`/terms` 靜態頁與 no-store/security headers 於 `workers/feedback/src/routes/portal.ts`、`workers/feedback/src/portal/`
- [x] T046 [US5] 建立不得自動略過的發布者後台/正式 URL/Open VSX scan 人工 gate 於 `docs/feedback-release-checklist.md`

**Checkpoint**: 程式碼與文件層合規條件可自動驗證；外部市集後台欄位仍明確標為 production release blocker

---

## Phase 6: User Story 3 - 查看、補充與刪除自己的回饋 (Priority: P2)

**Goal**: 回報者可在 Extension 與 recovery portal 查看自己的回饋、補充文字、刪除單筆或全部

**Independent Test**: 新 reporter 建兩筆後跨 Extension/portal 看見一致狀態；ownership attack 全失敗；補充、單筆刪除與 delete-all 按契約完成且舊 credential 失效

### Tests for User Story 3

- [x] T047 [P] [US3] 先寫 list/detail/message ownership、cursor、idempotency 與 delete semantics tests 於 `workers/feedback/test/integration/reporterFeedback.test.ts`
- [x] T048 [P] [US3] 先寫 fragment exchange、cookie flags、CSRF、origin、fragment cleanup 與 revoked session tests 於 `workers/feedback/test/integration/sessionPortal.test.ts`
- [x] T049 [P] [US3] 先寫 Extension My Feedback list/detail/message/delete/delete-all 與 SecretStorage cleanup tests 於 `src/test/webview/myFeedbackPanel.test.ts`
- [x] T050 [P] [US3] 先寫 R2 failure delete-pending、outbox retry、GitHub content-free tombstone tests 於 `workers/feedback/test/integration/deleteFeedback.test.ts`

### Implementation for User Story 3

- [x] T051 [US3] 實作 `GET /feedback`、`GET /feedback/:id`、`POST /messages` 的 ownership-scoped queries 與 cursor pagination 於 `workers/feedback/src/routes/feedback.ts`、`workers/feedback/src/storage/d1.ts`
- [x] T052 [US3] 實作 `DELETE /feedback/:id`、`DELETE /reporter`、delete-pending 與 tombstone/outbox 於 `workers/feedback/src/routes/feedback.ts`、`workers/feedback/src/services/outbox.ts`
- [x] T053 [US3] 實作 `/api/v1/session/exchange`、HttpOnly session/CSRF 與 `/r` recovery portal 於 `workers/feedback/src/routes/portal.ts`、`workers/feedback/src/portal/`
- [x] T054 [US3] 擴充 `FeedbackClient` 支援 list/detail/message/delete/delete-all 與 stable errors 於 `src/services/feedbackClient.ts`
- [x] T055 [US3] 在 `FeedbackPanel` 與 `media/*/feedback.*` 實作 My Feedback list/detail/timeline、純文字補充、copy recovery link 與 destructive confirmations
- [x] T056 [US3] 在 `src/extension.ts`、`package.json` 註冊 `showMyFeedback` 命令與入口，成功 delete-all 後清除 `src/services/feedbackIdentity.ts` credential
- [x] T057 [US3] 補齊 15 語系追蹤、狀態、補充、刪除、備援存取與 provider backup caveat 文案於 `media/locales/*/messages.js`

**Checkpoint**: Reporter self-service 完整，無需帳號/email/GitHub 且 ownership/刪除可獨立驗證

---

## Phase 7: User Story 4 - 維護者安全分流與公開溝通 (Priority: P2)

**Goal**: 私密 GitHub 工作副本、可靠 outbox、嚴格公開命令與安全 triage Skill 可用，公開 issue 需 project owner 核准

**Independent Test**: 500 筆/10 頁 fixtures 全部被分流且 injection 無效；一般 comment 永不公開；只有 allowlisted actor/owner 命令能改公開狀態或建立匿名 public issue

### Tests for User Story 4

- [x] T058 [P] [US4] 先寫 GitHub App JWT/token cache、permission assumptions、private issue render 與 raw-error redaction tests 於 `workers/feedback/test/unit/githubApp.test.ts`
- [x] T059 [P] [US4] 先寫 webhook HMAC vector、delivery/repo/event/actor allowlist、command parser 與 replay tests 於 `workers/feedback/test/integration/githubWebhook.test.ts`
- [x] T060 [P] [US4] 先寫 outbox exponential retry、dead-letter、external idempotency 與 scheduled cleanup tests 於 `workers/feedback/test/integration/outbox.test.ts`
- [x] T061 [P] [US4] 先建立 500 筆/10 頁、duplicate 與 prompt-injection Skill fixtures 及 validator tests 於 `.github/skills/triage-user-feedback/tests/`、`scripts/feedback/validate-triage-skill.test.js`

### Implementation for User Story 4

- [x] T062 [US4] 實作 GitHub App Web Crypto JWT、installation token、最小 Issues API 與 private issue content renderer 於 `workers/feedback/src/services/githubApp.ts`
- [x] T063 [US4] 實作 D1 outbox claim/retry/jitter/dead/completed cleanup 與 scheduled handler 於 `workers/feedback/src/services/outbox.ts`、`workers/feedback/src/index.ts`
- [x] T064 [US4] 實作 webhook raw-body HMAC、delivery/repo/event/actor allowlist 與嚴格 slash command parser 於 `workers/feedback/src/routes/githubWebhook.ts`、`workers/feedback/src/domain/githubCommands.ts`
- [x] T065 [US4] 實作 public reply、status、decision/resolution、reopen 與 owner-only anonymized public issue transitions 於 `workers/feedback/src/routes/githubWebhook.ts`、`workers/feedback/src/domain/stateMachine.ts`
- [x] T066 [US4] 實作 Cloudflare Access 維護者 attachment stream 與 no-store/nosniff 於 `workers/feedback/src/routes/adminAttachments.ts`
- [x] T067 [US4] 使用 `skill-creator` 建立 `.github/skills/triage-user-feedback/SKILL.md`、`references/classification.md`、`references/safety.md` 與 deterministic validator，並建立 `.agents/skills/triage-user-feedback` 相對 symlink
- [x] T068 [US4] 將 triage validator 與 contract checks 接入根 `package.json` `ci:static`，驗證跨頁 pagination、duplicate search、untrusted boundaries 與人工核准限制

**Checkpoint**: 維護者 workflow 有最小 GitHub 權限、internal-by-default 與 project owner approval；Agent 只能建議不能自動公開/決定

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 全故事整合、安全、效能、文件與封裝收斂

- [x] T069 [P] 建立 API/Webview/GitHub contracts 的 schema drift 與 forbidden-field regression fixtures 於 `scripts/feedback/fixtures/`、`scripts/feedback/validate-contracts.js`
- [x] T070 [P] 補充所有穩定錯誤碼、logging redaction、no raw IP/secret/body audit tests 於 `src/test/services/feedbackSecurity.test.ts`、`workers/feedback/test/unit/securityLogging.test.ts`
- [x] T071 建立本機 Extension→Worker→D1/R2→fake GitHub 端到端測試與 10 秒/500 筆效能情境於 `workers/feedback/test/e2e/feedbackFlow.test.ts`
- [x] T072 執行並修正 `npm run lint`、`npm run validate:i18n`、`npm run test:i18n`、`npm run check:project-skills`、`npm run feedback:contracts`、`npm run feedback:test`
- [x] T073 執行並修正 `npm run compile-tests`、`npm run compile`、`npm run test:unit:ci`、`npm run test:integration`，確認無 `.only` 且 coverage 不倒退
- [x] T074 執行 `specs/070-user-feedback/quickstart.md` 的鍵盤、HTML/ARIA 語意、light/dark/high-contrast、200% zoom 人工情境並記錄於 `specs/070-user-feedback/checklists/manual-ux.md`
- [x] T075 執行 production package 與 temporary VSIX privacy verifier，將檔案清單/secret scan/marketplace metadata 證據記錄於 `specs/070-user-feedback/checklists/packaging.md`
- [x] T076 檢查 `PRIVACY.md`、`SUPPORT.md`、`TERMS.md`、README、UI 與 portal 文案一致性，完成 `specs/070-user-feedback/checklists/release-compliance.md`
- [x] T077 在不建立正式雲端資源的前提下整理 production provisioning values、secret 名稱、GitHub App minimum permissions 與 rollback runbook 於 `docs/feedback-deployment.md`
- [x] T078 修正 reporter/delete-all 冪等、delete-pending 復原、outbox stale lease 與 create/delete GitHub issue race，補齊 Worker integration tests
- [x] T079 對所有 Worker request body 實作串流上限，新增 fail-closed production config 與 D1 health probe，補齊設定／HTTP tests
- [x] T080 強化 owner-approved public summary 去識別，拒絕 email、IP、路徑、版本、診斷值、私密文字片段與 private reference
- [x] T081 補上 extension recent-event producers，並強化 feedback list/detail/message response type guards 與 malformed response tests
- [x] T082 將 My Feedback 導覽、狀態、日期與 timeline author 文案納入 15 語系，完成增量 i18n validation
- [x] T083 排除 VSIX 內 `ssh2` 測試私鑰 fixtures，僅對三個已審查 runtime parser 路徑允許 PEM marker，完整私鑰一律拒絕
- [x] T084 將目標版本提升至 0.88.0，更新雙語 CHANGELOG 並通過 release prepare gate
- [x] T085 以 VS Code 1.109.0 Development Host 驗證鍵盤、預覽返回、診斷開關、四種主題、約 200% zoom 與截圖預覽／移除；未送出網路 request
- [x] T086 依人工驗收修正窄視窗水平溢位，並在無 reporter credential 的空狀態隱藏 delete-all 危險區與補齊 contracts
- [x] T087 [LCR:platformioDiagnosticPanel:allowlisted-prefill] PlatformIO 入口只預填 stable status/item code，不把診斷草稿原文帶入回饋本文
- [x] T088 [LCR:reporterFeedback:synchronous-private-scrub] 刪除 API 只有在私密 GitHub issue 已 scrub、R2 已移除且 D1 已提交後才回 204；失敗回可重試 503
- [x] T089 [LCR:outbox:preserve-create-marker] 刪除流程保留 create outbox marker，處理 processing、dead 與外部已建立但 mapping 未提交的競態
- [x] T090 [LCR:vscodeignore:ssh2-private-fixtures] VSIX 以 production dependency discovery 與明確 runtime allowlist 保留 Blockly／SSH 執行期，並排除 `ssh2/test` 私鑰 fixtures
- [x] T091 [LCR:ci:verify-published-vsix] CI 與 runtime-installation workflow 對實際準備發布的 VSIX 執行 privacy verifier
- [x] T092 [LCR:screenshot:full-structure-validation] Worker 完整驗證 PNG chunk/CRC/deflate 與 JPEG marker/EOI，拒絕 metadata、截斷或尾隨資料
- [x] T093 [LCR:githubApp:authenticated-attachment-link] 私密 issue 加入受 Cloudflare Access 保護的附件 URL，不暴露 R2 object key
- [x] T094 [LCR:feedbackIdentity:persistent-delete-all-key] 將未確定 delete-all idempotency key 保存於 SecretStorage，面板重開仍沿用
- [x] T095 [LCR:portal:cursor-pagination] Recovery portal 實作 `nextCursor` 與 Load more，不再只顯示前 20 筆
- [x] T096 [LCR:portal:locale-negotiation] Recovery／policy portal 依 `lang` 或 Accept-Language 提供 15 語系且保留 locale
- [x] T097 [LCR:feedback-ui:stable-errors] 將 timeout、rate limit、service、attachment 與 validation stable code 映射為可操作的本地化訊息
- [x] T098 [LCR:githubWebhook:atomic-command-delivery] webhook command mutation、公開訊息與 delivery receipt 使用同一 D1 batch 原子提交
- [x] T099 [LCR:auth:exact-reporter-secret] Bearer 與 session exchange reporter secret 均嚴格限制為 43 字元 base64url
- [x] T100 [LCR:feedback-ui:deletion-retention-notice] destructive confirmation 明示 provider backup 與 owner-approved anonymous public record 例外
- [x] T101 [LCR:feedback-ui:diagnostics-off-warning] 關閉基本環境資訊時以 live warning 說明診斷效果可能降低但不阻擋送出
- [x] T102 [LCR:feedback-webview:document-language] Webview HTML `lang` 使用實際 VS Code locale 並拒絕非法值
- [x] T103 [LCR:i18n:semantic-audit-refresh] 重建 19,607 units／99 batches 語意審計 checkpoint，15 語系 deterministic validation 0 error
- [x] T104 [US1] 依實機 UX 回饋移除通用編輯器標題列圖示，初版在 Blockly 自有控制區加入有文字標籤的「提供回饋」，補齊固定訊息路由、contract/unit tests、文件與人工驗收；入口外觀與工具列收合後由 T177–T182 取代
- [x] T105 [LCR:.github/workflows/ci.yml:184:yaml-tab-indentation] 修正 CI 與 runtime-installation 封裝 shell block 的 YAML tab 縮排，新增禁止 tab 與強制 VSIX privacy verifier 的防回歸契約，並完成第二輪本地審查
- [x] T106 [LCR:workers/feedback/src/index.ts:29:missing-allow-header] 讓所有 405 API 回覆列出路由允許的方法，並新增七條公開路由的端對端契約測試
- [x] T107 [DEPLOY:githubApp:long-installation-token] 配合 GitHub 2026 installation token 格式延長，將 fail-closed 上限提高至 1024 字元並新增 520 字元 token 回歸測試
- [x] T108 [DEPLOY:production:cloudflare-github] 依使用者明確核准建立 private feedback repository、最小權限 GitHub App、D1、私有 R2、Cloudflare Access、自訂網域與十項 secret，套用 migration 並驗證公開端點及 Access 攔截
- [x] T109 [DEPLOY:githubApp:workerd-fetch-receiver] 修正 workerd 原生 `fetch` 失去 global receiver 所造成的 `illegal invocation`，補齊 GitHub `User-Agent` 契約，並以正式 cron 將無敏感資料測試回饋冪等同步成單一 private issue
- [x] T110 [DEPLOY:docs:production-evidence] 更新部署手冊、release checklist 與 compliance evidence，記錄 PKCS#1→PKCS#8、Dashboard 單行 PEM、正式資源與尚未完成的完整生命週期／Marketplace gates
- [x] T111 [LCR:.github/workflows/ci.yml:185:vsix-runtime-dependencies] 移除會略過所有 dependencies 的 `vsce --no-dependencies`，以實際 production dependency discovery 保留 Blockly／theme-modern／node-ssh／ssh2，並讓 VSIX verifier 對必要 runtime 檔案 fail closed
- [x] T112 [LCR:workers/feedback/src/routes/feedback.ts:49:preparse-rate-limit] 將 reporter 與來源網路速率限制移到 request body、multipart 與圖片解析前，新增無效 payload 仍先回 429 的回歸測試
- [x] T113 [LCR:workers/feedback/src/routes/portal.ts:61:complete-policy-pages] 將 `/privacy`、`/support`、`/terms` 從摘要擴充為版本化完整政策，先完成繁體中文與英文詳細本文及其餘支援語系的本地化摘要
- [x] T114 [LCR:workers/feedback/src/domain/cloudflareAccess.ts:56:workerd-fetch-receiver] 對 Cloudflare Access JWKS 的原生 `fetch` 保留 global receiver，新增實際 RS256 JWT／JWKS brand-check 回歸測試
- [x] T115 [LCR:workers/feedback/src/routes/githubWebhook.ts:205:later-message-public-summary] 將所有後續 reporter／maintainer 訊息納入 owner-approved 公開摘要逐字片段檢查，避免用稍後訊息繞過去識別化
- [x] T116 [LCR:workers/feedback/src/routes/feedback.ts:136:durable-attachment-cleanup] 以 `pending_attachment_uploads` D1 marker 與 scheduled cleanup 補償 D1 create 失敗後的 R2 orphan，並避免模糊 commit 結果誤刪已提交附件
- [x] T117 [LCR:src/services/feedbackClient.ts:17:legal-response-cap] 將 Extension response 串流上限提高到可容納契約允許的 list/detail payload，仍對超過 1 MiB 的回應 fail closed
- [x] T118 [LCR:workers/feedback/src/routes/reporterFeedback.ts:211:message-pagination] 將明細 timeline 改為 ownership-scoped、簽章 cursor 分頁，Extension 提供訊息 Load more 並驗證每頁 response
- [x] T119 [LCR:src/services/feedbackClient.ts:169:response-body-timeout] 讓 create 與一般 API timeout 涵蓋 response body 讀取及解析，abort 時主動取消串流並維持冪等重試
- [x] T120 [LCR:workers/feedback/src/services/screenshot.ts:140:jpeg-decode-validation] 以有記憶體與解析度上限的完整 JPEG entropy decode 驗證取代只檢查 marker 結構，拒絕偽造 scan data
- [x] T121 [LCR:workers/feedback/src/services/outbox.ts:110:delete-message-race] 刪除流程保留並等待 processing message lease，完成同步後才 scrub 私密 Issue 與回覆 204，避免刪除完成後原文重新出現
- [x] T122 [LCR:src/webview/feedbackPanel.ts:447:uncertain-create-key] 對已嘗試但結果不確定的建立請求跨 preview expiry 與 Webview 重開保留相同 payload digest／idempotency key，直到取得明確結果
- [x] T123 [LCR:src/services/feedbackDiagnostics.ts:106:independent-recent-events] 將近期結構化事件同意與基本環境資訊開關解耦，允許只送出使用者明確勾選的 bounded events
- [x] T124 [LCR:workers/feedback/src/routes/portal.ts:183:portal-message-pagination] 在備援入口續載 ownership-scoped message cursor，確保超過 20 則的時間軸與 Extension 一致
- [x] T125 [LCR:workers/feedback/src/routes/portal.ts:166:portal-persisted-mutation-key] 將備援入口 pending mutation 的 SHA-256 指紋與 UUID key 保存至 sessionStorage，跨重新載入安全重試且不保存回饋原文
- [x] T126 [LCR:workers/feedback/src/routes/feedback.ts:66:stable-parse-errors] 將 multipart／JSON 解析例外映射至固定 allowlist 錯誤碼，不回傳 runtime 原始例外內容
- [x] T127 [LCR:media/html/feedback.html:112:delete-input-accessible-name] 以 legend 與確認說明共同命名單筆／全部刪除輸入框，補齊主要控制項可稽核的可存取名稱
- [x] T128 [LCR:workers/feedback/src/routes/reporterFeedback.ts:446:delete-all-create-race] 在列舉 delete-all 目標前撤銷 reporter，並讓 create transaction 原子檢查撤銷狀態，避免並行建立留下無法存取的私密資料
- [x] T129 [LCR:workers/feedback/src/routes/githubWebhook.ts:209:private-comment-summary] 在 owner 核准公開摘要前 fail-closed 讀取所有私密 Issue 留言並納入原文重複檢查，排除目前核准指令本身
- [x] T130 [LCR:workers/feedback/src/routes/githubWebhook.ts:95:punctuated-private-identifiers] 公開摘要禁止規則須拒絕括號等標點包住的私密 Issue 編號與 Unix 路徑
- [x] T131 [LCR:media/html/feedback.html:109:single-delete-disclosure] 在單筆刪除確認控制旁顯示備份與匿名公開紀錄保留例外
- [x] T132 [LCR:workers/feedback/src/routes/portal.ts:142:portal-delete-all-disclosure] 在備援入口的 delete-all 控制旁永遠顯示刪除例外，不能依賴已選取的明細區
- [x] T133 [LCR:media/js/feedback.js:438:submitted-draft-reset] 僅在建立成功後清除已提交表單、診斷選項與截圖 object URL，失敗時仍保留草稿
- [x] T134 [LCR:workers/feedback/src/services/githubApp.ts:155:comment-marker-pagination] GitHub 留言 marker 搜尋須由最新往前涵蓋全部頁面，超出安全上限時 fail closed 而非重複留言
- [x] T135 [LCR:workers/feedback/src/services/githubApp.ts:158:private-issue-edit-history] 私密 GitHub Issue 的 title/body 只能保存無內容路由 shell；回饋原文、診斷與附件入口改放在可刪除的初始私密留言，刪除後不得由 Issue 編輯歷史取回原文
- [x] T136 [LCR:workers/feedback/src/routes/githubWebhook.ts:221:prior-command-summary] owner 核准公開摘要時只排除目前核准指令，先前所有私密 slash command 本文仍須納入逐字片段檢查
- [x] T137 [LCR:src/webview/feedbackPanel.ts:484:revoked-local-reporter] 建立回饋收到 `invalid_reporter` 時淘汰已撤銷的本機 SecretStorage 憑證，並以新匿名憑證及相同建立冪等鍵安全重試一次
- [x] T138 [LCR:src/services/feedbackClient.ts:202:invalid-success-idempotency] 成功狀態的 response body 若無法解析或不符合契約，必須視為結果不確定並保留建立請求的冪等鍵
- [x] T139 [LCR:media/js/feedback.js:453:submitted-status] 成功結果畫面除回饋編號與備援入口外，須以本地化標籤顯示服務端回傳的目前公開狀態
- [x] T140 [CONVERGENCE:specs/070-user-feedback/contracts/webview-messages.md:command-discriminator] 將 Webview message 契約收斂至實作使用的 `command` discriminator 與實際雙向訊息名稱，並讓 contract validator 拒絕舊名稱回歸
- [x] T141 [LCR:workers/feedback/src/routes/reporterFeedback.ts:475:durable-delete-all-job] 在撤銷 reporter/session 的同一個 D1 transaction 中，將其全部 active/delete-pending feedback 標成 delete-pending 並為每筆持久化可由 cron 完成的 delete outbox，避免中途失敗後留下無法再驗證的私密資料
- [x] T142 [LCR:workers/feedback/src/domain/schemas.ts:81:diagnostic-value-allowlist] Worker 端對版本、board、tool version、lastError 與 recentEvents 套用 stable-value／版本格式允許清單，拒絕路徑、空白原文與 token-shaped 診斷值
- [x] T143 [LCR:media/js/feedback.js:290:persisted-message-idempotency] 由 Extension host 依 feedback id 與訊息 payload digest 持久保存補充訊息 idempotency key，只有取得明確結果後才清除，Webview 重開後仍安全重試
- [x] T144 [LCR:media/js/feedback.js:469:visible-recovery-error] 成功結果頁複製備援連結失敗時，將穩定錯誤顯示於目前可見的 recovery status 區域並清除舊成功訊息
- [x] T145 [LCR:media/js/feedback.js:376:complete-feedback-detail] Extension 與 recovery portal 的回饋明細完整呈現 steps、expected、allowlisted diagnostics 與附件保存狀態
- [x] T146 [LCR:src/webview/platformioDiagnosticPanel.ts:389:localized-platformio-prefill] 將 PlatformIO 回饋預填的摘要、整體狀態、受影響檢查與引導文字改由 LocaleService 取得，並同步全部 15 語系
- [x] T147 [LCR:workers/feedback/src/services/githubApp.ts:162:complete-private-comment-scrub] 私密 Issue 留言清除達批次安全上限時再次確認留言已清空；若仍有內容則 fail closed 並保留 durable delete 工作重試，不得關閉 Issue 或完成 D1 刪除
- [x] T148 [LCR:workers/feedback/src/domain/reporterAuth.ts:63:stable-reporter-rate-key] session 與 bearer 驗證必須共用 reporter secret HMAC 作為主要限速鍵，重複交換 recovery session 不得增加限速配額
- [x] T149 [LCR:src/services/feedbackClient.ts:275:uncertain-message-response] 補充訊息成功狀態的 response body 無法解析或不符契約時視為結果未定，保留並重用原冪等鍵直到明確成功或不可重試失敗
- [x] T150 [LCR:workers/feedback/src/domain/cloudflareAccess.ts:75:jwks-rotation-refresh] Cloudflare Access JWT 出現快取中未知 kid 時強制重新取得一次 JWKS，再 fail closed 驗證輪替後的新簽章金鑰
- [x] T151 [LCR:media/js/feedback.js:160:bounded-screenshot-preflight] 截圖解碼前限制原始檔案容量並由有界 header 解析 PNG/JPEG 尺寸與像素預算，超限時不得交給 Webview 圖片解碼器
- [x] T152 [LCR:media/js/feedback.js:264:screenshot-selection-generation] 以選取世代丟棄已被新選擇或移除操作取代的非同步截圖處理結果，避免舊圖片覆蓋目前狀態
- [x] T153 [LCR:media/js/feedback.js:289:pagination-in-flight] Extension Webview 與 recovery portal 對清單及訊息分頁加入 in-flight cursor／request identity，停用重複操作並忽略過期回應
- [x] T154 [LCR:media/js/feedback.js:415:detail-request-identity] Extension Webview 與 recovery portal 追蹤最後一次明細選取，只接受相符 feedback ID 的結果，避免過期回應改變後續補充或刪除目標
- [x] T155 [LCR:workers/feedback/src/routes/githubWebhook.ts:134:cjk-private-excerpt] 公開摘要去識別化檢查須以 CJK 字元 n-gram 阻擋中文、日文、韓文等無空白語系的私密原文片段，不得只比對完整句子
- [x] T156 [LCR:workers/feedback/src/routes/portal.ts:305:portal-uncertain-message] Recovery portal 只有在解析並驗證補充訊息成功回應後才能清除持久冪等鍵；截斷或不符契約的成功狀態視為結果未定
- [x] T157 [LCR:workers/feedback/src/routes/portal.ts:297:portal-message-in-flight] Recovery portal 在補充訊息送出期間停用按鈕並拒絕重複觸發，避免不同 payload 互相覆寫持久冪等鍵
- [x] T158 [LCR:workers/feedback/src/routes/githubWebhook.ts:203:resolved-only-reopen] `/feedback reopen` 僅允許 `resolved` 回到 `in-progress`，`closed` 維持終止狀態
- [x] T159 [LCR:workers/feedback/src/routes/githubWebhook.ts:176:atomic-status-transition] 公開狀態更新須以已驗證舊狀態作條件並原子確認實際更新，並行命令不得產生禁止的狀態轉移或孤立公開訊息
- [x] T160 [LCR:workers/feedback/src/policyContent.ts:137:complete-policy-locales] 隱私權、支援與條款的完整政策內容須提供全部 15 個既有語系，支援語系不得把完整本文強制回退成英文
- [x] T161 [LCR:workers/feedback/src/services/githubApp.ts:199:issue-marker-search-cap] GitHub Issue marker 搜尋到達安全頁數上限仍未窮盡時須 fail closed，不得把未知結果當成不存在而建立重複 Issue 或遺留私密內容
- [x] T162 [LCR:workers/feedback/src/routes/githubWebhook.ts:131:punctuation-mention-boundary] 公開摘要須拒絕括號、標點或行首等非文字邊界後的 GitHub mention，避免識別或通知使用者
- [x] T163 [LCR:media/js/feedback.js:531:delete-refresh-correlation] Extension 回饋面板刪除成功後須建立可接受 Host 自動刷新結果的清單 request identity，並立即清除舊清單內容
- [x] T164 [LCR:workers/feedback/src/routes/portal.ts:316:normalized-message-fingerprint] Recovery portal 須先 trim 補充訊息，再以同一正規化本文建立 fingerprint、送出請求及驗證成功回應
- [x] T165 [LCR:workers/feedback/src/routes/githubWebhook.ts:353:durable-command-acknowledgement] 私密維護者命令須以 idempotent 短留言確認 accepted 或穩定錯誤代碼，並將確認狀態持久化，GitHub API 暫時失敗時可由相同 delivery 重送而不重複執行命令
- [x] T166 [LCR:workers/feedback/src/services/githubApp.ts:177:bounded-scrub-lock] 私密 Issue 清除須以有界批次阻止競態，並在完成留言刪除後鎖定 conversation、確認內容已清空
- [x] T167 [LCR:src/webview/feedbackPanel.ts:405:persist-delete-one] 持久化單筆刪除冪等鍵，讓不確定結果可跨 Webview／VS Code 重開安全重試
- [x] T168 [LCR:src/webview/feedbackPanel.ts:347:revoked-local-identity] 偵測 recovery portal 已撤銷 reporter 時清除本機憑證並回復空清單狀態
- [x] T169 [LCR:workers/feedback/worker-configuration.d.ts:11:regenerate-bindings] 重新產生與正式 Wrangler bindings 一致的 Worker 型別
- [x] T170 [LCR:src/services/feedbackIdentity.ts:88:digest-keyed-message-idempotency] Extension 與 recovery portal 的不同未決補充訊息須以 target／digest 分槽保存，不得因後送的不同本文覆寫較早操作的冪等鍵
- [x] T171 [LCR:workers/feedback/src/routes/feedback.ts:31:contract-sized-multipart] 建立回饋 multipart 解析須接受欄位符合契約上限但因 JSON escaping 超過 20,000 字元的合法 payload
- [x] T172 [LCR:workers/feedback/src/routes/reporterFeedback.ts:195:cjk-message-byte-budget] 補充訊息 request byte 上限須容納契約允許的 4,000 個 CJK 字元與 JSON escaping
- [x] T173 [LCR:src/services/feedbackScreenshot.ts:43:predecode-base64-limit] Extension Host 在正則驗證與 base64 解碼前先依 3 MiB 原始容量計算字串硬上限，拒絕任意大型 Webview 截圖訊息
- [x] T174 [LCR:workers/feedback/src/domain/schemas.ts:50:sensitive-diagnostic-shapes] Worker 診斷允許清單須拒絕 IP、UUID／裝置識別碼、一般 43 字元 bearer secret 與 `sk-proj-*` 等敏感值形狀
- [x] T175 [LCR:workers/feedback/src/routes/githubWebhook.ts:365:invalid-command-acknowledgement] 已驗證維護者在已映射私密 Issue 送出的無效命令也須持久化穩定錯誤並以 comment-id marker 冪等確認
- [x] T176 [LCR:src/services/localeService.ts:216:decode-localized-escapes] LocaleService 載入 JS 訊息時須安全還原換行與引號跳脫，讓 15 語系 PlatformIO 回饋預填顯示真正分行
- [x] T177 [SDD:toolbar-ux] 更新 feature 070 spec、plan、tasks 與人工 UX checklist，定義圓形回饋入口、常用／次要操作分組及最右側收合按鈕
- [x] T178 [P] [US1] 先建立 Blockly 工具列 DOM、狀態持久化、可存取名稱、圓形按鈕一致間距與 15 語系一致性的契約測試
- [x] T179 [US1] 將回饋入口改為獨立藍色圓形圖示按鈕，使用本地化 tooltip／ARIA label 且不依賴顏色辨識
- [x] T180 [US1] 將備份、上傳、Monitor 設為收合後保留的常用操作，其他動作置入可隱藏群組，統一展開後圓形按鈕間距，最右側 toggle 預設收合並保存選擇
- [x] T181 [P] [US1] 為全部 15 語系加入顯示更多／較少操作文案；deterministic validation 為 0 error，新增 30 個語意 units 已依政策人工檢查
- [x] T182 [US1] 執行 contract、i18n、lint、compile 與完整 unit regression，並在 Development Host 驗證 Light 主題的展開／收合、按鈕間距、圖示與 accessibility tree
- [x] T183 [Release:i18n] 已於 2026-08-26 從 batch 1 重新索引 19,757 units／99 batches；沿用 2026-08-20 未變更單位的既有人工分類，並逐項覆核造成 manifest 變更的 30 個工具列展開／收合語意單位，結果維持 0 Blocker、2,277 個既有 Major backlog、2 Minor
- [x] T184 [Release:manual-ux] 已於 2026-08-26 補完鍵盤、Dark、Light、Light High Contrast、Dark High Contrast、620px 窄寬度與約 200% workbench zoom 人工矩陣；工具列可自動換列、無水平遺失，焦點與視覺順序一致
- [x] T185 [UX:spacing-regression] 修正舊版按鈕容器 `margin-left: 10px` 與新版 `gap: 10px` 疊加成約 20px 的 cascade 問題，並以高 specificity reset 契約防止復發
- [x] T186 [UX:persistence] 將工具列初始狀態改為預設收合，透過嚴格 boolean Webview 訊息保存到專案 `workspaceState`，並保留 Webview state 作為同一 panel 重建的即時恢復來源
- [x] T187 [Production:github-scrub-lock] 依正式 smoke test 修正 GitHub App 在已鎖定 Issue 刪除留言會回 403 的順序：只於每批 DELETE 前暫時解除鎖定，刪除後立即重新鎖定並驗證留言為空；失敗時恢復鎖定且保留 durable delete 重試
- [x] T188 [Marketplace:support-url] 將 manifest `bugs.url` 從尚未發布而回 404 的 GitHub `SUPPORT.md` 改為公開 200 且不要求 GitHub 帳號的正式 `/support`，並以 marketplace contract 固定此邊界
- [x] T189 [LCR:production-privacy-boundaries] 在 GitHub 內容操作前以 numeric ID、slug 與 visibility 驗證 repository 實際身分；拒絕公開 placeholder 或重複使用的 Worker secrets；並在 delete-all 撤銷 transaction 內立即移除 idempotency response 本文
- [x] T190 [Security:client-diagnostic-shapes] 讓 Extension 端診斷允許清單與 Worker 一致拒絕 credential、IPv4、UUID／裝置識別碼及非 ISO event timestamp，並補齊回歸測試
- [x] T191 [LCR:preauth-source-rate-limit] 所有 reporter 查詢與 mutation 在 D1 憑證查詢前先套用獨立來源 HMAC 限速，驗證成功後再套用 reporter 主要限速，避免輪替隨機憑證繞過濫用防護
- [x] T192 [LCR:detail-switch-mutation-freeze] Extension 與 recovery portal 切換明細時立即清除舊操作目標、隱藏舊明細並停用補充／刪除控制，只有目前明細成功載入後才恢復操作
- [x] T193 [LCR:mutation-non-json-5xx] 補充與刪除 mutation 遇到 429／5xx 的截斷或非 JSON 回應時仍視為可重試，保留並重用原冪等鍵，避免 Webview 重開後重複建立資料
- [x] T194 [LCR:source-limiter-readiness] 將 `SOURCE_RATE_LIMITER` 納入 fail-closed runtime readiness，避免漏綁時健康檢查錯誤通過而 reporter API 全面 500
- [x] T195 [LCR:public-issue-title] owner 核准的公開摘要以第一個移除 Markdown heading 後的非空行產生標題，完全無文字時使用固定安全 fallback，避免 GitHub 422 與 outbox dead-letter
- [x] T196 [LCR:create-auth-contract] OpenAPI 建立端點覆寫全域驗證，僅宣告實作支援的 bearer reporter secret
- [x] T197 [LCR:jpeg-contract] OpenAPI multipart 截圖契約同時宣告 PNG 與 JPEG binary media type，並由契約檢查防止漂移
- [x] T198 [LCR:server-sensitive-feedback-text] 在 Worker 信任邊界統一拒絕回饋本文與補充訊息中的已知權杖、環境變數、私人金鑰、帶帳密 URL、IP、本機路徑、常見終端輸出與程式碼區塊，回傳穩定 `sensitive_content` 與欄位名稱並補齊回歸測試
- [x] T199 [LCR:complete-path-ipv6-boundary] 擴充 Worker 回饋本文信任邊界，拒絕任意 POSIX 絕對／相對路徑與有效 IPv6，並以 `/workspace`、`/srv`、`path=/home`、相對路徑及壓縮 IPv6 補齊全部本文欄位回歸案例
- [x] T200 [LCR:post-delete-github-comment-race] 刪除中或刪除後持續以 mapping／content-free tombstone 辨識 private issue；若該 Issue 再收到留言 webhook，原子建立／更新 tombstone、寫入 delivery 與全新持久 scrub outbox，避免留言落在首次空檢查與 D1 finalize 之間或 GitHub conversation lock 無法阻止 collaborator 留言而永久遺留私密內容
- [x] T201 [LCR:relative-path-false-positive] 相對路徑偵測只拒絕明確 `./`、`../`、`~/` 或具檔名副檔名的路徑形狀，避免把 `Arduino/MicroPython`、`upload/download`、`light/dark` 等正常產品描述誤判為敏感內容
- [x] T202 [LCR:documented-status-transitions] 一般 status 指令只允許資料模型文件化的逐步轉移，`resolved → in-progress` 僅能由必填公開說明的專用 reopen 指令執行
- [x] T203 [LCR:session-reporter-rate-limit] recovery session exchange 在解析 request 前套用不可省略的來源限速，計算 reporter secret HMAC 後再套用同一 reporter 主限速鍵，避免跨來源反覆建立 session
- [x] T204 [LCR:pagination-error-identity] list/messages 分頁錯誤攜帶原 request cursor，messages 同時攜帶 feedback ID；Webview 僅清除完全相符的 in-flight identity，不讓舊錯誤吞掉新回應
- [x] T205 [LCR:support-entry-copy] 同步本機與 Worker 支援頁，改述為展開最右側選單後使用藍色圓形回饋圖示，不再指示已移除的文字標籤按鈕
- [x] T206 [LCR:revoked-reporter-submit-race] 建立回饋收到 `invalid_reporter` 時只淘汰已撤銷的本機 secret 並保留表單，不在同一次操作自動建立新 reporter 或重送；後續建立必須來自使用者再次明確送出
- [x] T207 [LCR:single-segment-posix-path] Worker 信任邊界拒絕具明確文字邊界的單層 POSIX 絕對路徑（例如 `/secret.txt`、`path=/alice`），同時保留 slash-separated 產品術語
- [x] T208 [LCR:detail-error-identity] Extension Host 的明細錯誤攜帶 feedback ID，Webview 只接受目前明細錯誤；recovery portal 也只讓最後一次 detail request 的失敗更新狀態，並補齊 messages 無憑證分支的 request identity
- [x] T209 [LCR:private-issue-number-summary] Owner 核准公開摘要時須比對實際私密 Issue numeric id，拒絕不含 `#` 的裸編號及其文字包裝，避免公開可反查識別碼
- [x] T210 [LCR:add-message-response-identity] Extension Host 的補充訊息結果須攜帶 feedback ID 與 Webview request idempotency key；Webview 僅讓完全相符的目前未決操作清除草稿與 key
- [x] T211 [LCR:durable-public-approval-evidence] 新增 D1 migration 將公開開發紀錄的核准證據改為可解除私密 feedback 外鍵的獨立紀錄；刪除私密內容時保留 owner、時間與公開 Issue mapping 並設定 severed timestamp
- [x] T212 [LCR:platformio-generic-feedback-entry] PlatformIO 的「提供回饋」入口即使診斷 operational／issue draft 不建議，也必須開啟通用回饋表單並使用安全的本地化預填
- [x] T213 [LCR:message-delete-atomicity] 將補充訊息 active／ownership 條件與 message、outbox、idempotency 寫入放在同一個 D1 batch；刪除先取得寫入順序時不得留下訊息本文或成功 replay
- [x] T214 [LCR:public-issue-delete-race] 公開 Issue outbox 正在 processing 且尚未回寫 mapping 時，私密刪除必須等待同步完成，再解除並保留 owner 核准與公開 Issue 證據
- [x] T215 [LCR:reporter-secret-sensitive-text] Worker 信任邊界須拒絕回饋本文與補充訊息中的裸 43 字元 reporter secret，以及含 `#secret=` 的備援連結，避免可重用的匿名存取憑證寫入 D1 或 GitHub
- [x] T216 [LCR:create-delete-private-issue-tombstone] 私密 Issue 建立與刪除競態時，須在 scrub 前持久保存 issue number 的 content-free tombstone，並在最終刪除時保留該路由，讓後續留言 webhook 仍可再次 scrub
- [x] T217 [LCR:public-issue-uncertain-delete] 刪除私密回饋前須保留已嘗試的 `create-public-issue` marker，依 outbox id 查回結果未定的公開 Issue 並寫回 mapping，再解除私密關聯與保留 owner 核准證據
- [x] T218 [LCR:delete-one-response-identity] Extension Host 的單筆刪除成功與失敗結果須攜帶 feedback ID 與 Webview request idempotency key；Webview 只讓相符的目前操作更新畫面與清除對應 key
- [x] T219 [LCR:portal-delete-target-freeze] Recovery portal 的單筆刪除須凍結送出時的 target／fingerprint，避免晚到回應清除另一筆回饋的冪等鍵或覆寫其明細狀態
- [x] T220 [LCR:portal-mutation-network-errors] Recovery portal 的補充、單筆刪除與全部刪除須捕捉 request rejection，保留輸入與冪等鍵並顯示安全的本地化重試錯誤
- [x] T221 [LCR:webhook-rejection-audit] GitHub webhook 簽章拒絕須寫入 content-free、allowlisted 的安全稽核事件；稽核不可包含 header、payload、secret、raw IP 或例外內容，且稽核寫入失敗不得改變拒絕結果
- [x] T222 [LCR:preflight-sensitive-text] Extension Host 與 recovery portal 在任何建立／補充網路請求前須使用與 Worker 一致的敏感文字檢查並保留服務端二次驗證，避免禁止內容先被傳輸後才拒絕
- [x] T223 [LCR:serial-device-source-shapes] 回饋本文信任邊界須拒絕明確序列埠、UUID／裝置識別碼及未加 code fence 的 Arduino／MicroPython 原始碼形狀，create 與 message 路徑均需回歸測試
- [x] T224 [LCR:message-draft-refresh] Extension 補充成功後自動刷新明細時，只能清除已成功送出的原本文；送出期間新輸入的下一則草稿必須保留
- [x] T225 [LCR:experimental-indicator-collapse] 實驗積木持久指示器須納入次要工具列群組，收合時不可自行恢復顯示，展開時仍遵守共用按鈕間距
- [x] T226 [LCR:public-issue-delete-claim-race] 回饋進入刪除流程後須原子取消尚未嘗試的 pending 公開 Issue outbox；若已被 claim 則必須等待並回收結果，避免留下無核准證據或解除關聯紀錄的公開 Issue
- [x] T227 [LCR:portal-sensitive-guard-source] Recovery reporter portal `/r` 頁面須注入與 Extension／Worker 相同的敏感文字 browser guard，且在任何補充訊息 request 前可實際執行
- [x] T228 [LCR:delete-idempotency-waiters] 單筆刪除的每個等待中冪等鍵須持久保存；任一重試完成清除時，所有相同 reporter／route／request digest 的 pending key 均須可重播 204
- [x] T229 [LCR:github-scrub-relock-finally] 私密 Issue scrub 自解鎖嘗試開始後的所有成功、失敗與回應不確定路徑都須 best-effort 重新鎖定，避免 durable retry 退避期間暴露未鎖定的私密 conversation
- [x] T230 [LCR:submission-panel-generation] 建立回饋的非同步成功與失敗結果須綁定發出請求的 Webview panel／generation；面板已關閉、被取代或重新編輯時不得更新新面板或清除新草稿
- [x] T231 [LCR:coalesce-feedback-panel-open] 並行呼叫回饋 panel `show()`／`showMyFeedback()` 時須合併同一個 opening promise，只能建立一個可管理的 WebviewPanel
- [x] T232 [LCR:unicode-code-point-length] Webview、Extension Host 與 Worker 對回饋標題、描述、步驟、預期結果及補充訊息的長度限制須以 Unicode code point 計算，與 D1 `length()` constraint 一致
- [x] T233 [LCR:portal-message-draft-retry] Recovery portal 須依 feedback ID 在頁面記憶體保留未明確成功的補充草稿，重試 prompt 預填相同本文，且僅於成功回應通過結構與本文驗證後清除
- [x] T234 [LCR:webview-message-draft-navigation] Extension Webview 須依 feedback ID 保留切換明細前與請求中的補充草稿；失敗或結果不確定時可回到原明細安全重試，成功時只清除實際送達且未被新輸入取代的本文
- [x] T235 [LCR:delete-one-list-refresh] Extension 單筆刪除成功後須不受目前明細選取狀態影響地移除過期清單項目並刷新第一頁；若使用者已切換到其他回饋，不得清除其明細或進行中狀態
- [x] T236 [DEPLOY:access-team-domain] 正式 Worker 的 `CLOUDFLARE_ACCESS_TEAM_DOMAIN` 須與受保護資源 metadata 宣告的 `innovationspark.cloudflareaccess.com` 一致，避免 Access 登入後因 issuer 不符而拒絕附件請求
- [x] T237 [DEPLOY:migration-worker] 核對正式 D1 的 `0003` schema 後補齊 migration registry、套用 `0004_detached_development_approvals.sql`，部署回饋 Worker 並確認目前版本、健康檢查、政策頁與 Access 保護路徑
- [x] T238 [DEPLOY:github-webhook] 在私人 feedback repository 建立只訂閱 Issues／Issue comment 的 webhook，以同一組未落盤隨機密鑰同步 Cloudflare secret，並以正式 issue-comment delivery 驗證 HTTP 202
- [x] T239 [VERIFY:production-smoke] 以無敏感內容的單一 production synthetic reporter 完成 create/list/detail/message replay、recovery session、私密同步、status、public-reply、owner 匿名核准、單筆刪除、delete-all、session 撤銷、GitHub tombstone 與核准證據斷鏈；刪除 synthetic public Issue 並確認 active synthetic feedback／pending outbox 均為 0
- [ ] T240 [RELEASE:publisher-gates] 由發布者完成 VS Code Marketplace 後台身分／隱私／支援／條款／掃描，以及 Open VSX Publisher Agreement／namespace／專用 token／server-side scans；由資料控制者確認教育與未成年人情境後，才可上傳或發布候選 VSIX
- [x] T241 [LEGAL:data-controller-authorization] 2026-08-26 由專案負責人明確確認具資料控制者授權，接受 Cloudflare／GitHub 跨境與備份限制、保存與刪除邊界、教育／未成年人告知及必要同意責任、使用者主動輸入／截圖風險與匿名憑證遺失限制；平台 server-side scans 與發布後 metadata 仍保留於 T240
- [x] T242 [LCR:vsix-fine-grained-github-pat] VSIX 隱私 verifier 同時拒絕 `gh*_*` 舊式與 `github_pat_*` fine-grained GitHub token，並以合成 token fixture 防止掃描規則回歸；既有 0.88.0 候選 VSIX 重新掃描通過

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: 無依賴。
- **Phase 2 Foundational**: 依賴 Phase 1，阻擋所有 user stories。
- **US1 (Phase 3)**: 依賴 Foundation，是可送出純文字回饋的 MVP。
- **US2 (Phase 4)**: 依賴 Foundation；與 US1 的 panel/create route 整合，應在 US1 後收斂。
- **US5 (Phase 5)**: 依賴已確定的 US1/US2 資料欄位；部分文件任務可平行。
- **US3 (Phase 6)**: 依賴 Foundation 與已存在 Feedback/Reporter；可用 fixture 獨立測試，但產品整合在 US1 後。
- **US4 (Phase 7)**: 依賴 Feedback/outbox/tombstone；GitHub unit/Skill fixtures可在 Foundation 後平行準備。
- **Polish (Phase 8)**: 依賴所有目標故事完成。

### User Story Completion Order

```text
Setup → Foundation → US1 (MVP)
                    ├── US2 → US5
                    ├── US3
                    └── US4
US2 + US5 + US3 + US4 → Polish
```

### Within Each Story

- 先寫測試並確認因缺少功能而失敗。
- 純 model/schema/security primitives 先於 service；service 先於 route/panel integration。
- 所有 mutation 先驗證 authorization/idempotency，再寫 storage/outbox。
- 每階段 checkpoint 通過才進下一階段，不以 production deploy 代替本機驗證。

### Parallel Opportunities

- T002–T004 可平行。
- T006/T007/T009/T011/T013/T015 可在不同檔案平行準備。
- 每個故事的 `[P]` test tasks 可平行撰寫；implementation 依其對應測試與 foundational contract。
- US5 文件、US4 Skill fixtures、US3 UI tests 可在 US1 MVP 完成後平行。
- 本次執行不使用子代理；`[P]` 僅表示依賴結構允許，不代表自動 delegation。

## Parallel Examples

### User Story 1

```text
T017 feedbackDiagnostics tests
T018 feedbackIdentity tests
T019 feedbackClient tests
T020 Worker create integration tests
T021 FeedbackPanel contract tests
```

### User Story 3

```text
T047 ownership/API tests
T048 portal session tests
T049 Extension My Feedback tests
T050 delete/outbox tests
```

### User Story 4

```text
T058 GitHub App unit tests
T059 webhook tests
T060 outbox tests
T061 Skill safety fixtures
```

## Implementation Strategy

### MVP First

1. 完成 Phase 1–2。
2. 完成 US1 純文字送出。
3. 停下並以 local Worker 驗證「開啟不傳輸、預覽一致、無 GitHub 需求、冪等不重複」。
4. 不在 MVP checkpoint 建立 production Cloudflare/GitHub 資源。

### Incremental Delivery

1. US1：非 GitHub 純文字回饋。
2. US2：資料控制與截圖。
3. US5：上架揭露與封裝 gate。
4. US3：個人追蹤、補充與刪除。
5. US4：維護者分流、私密 GitHub 與核准公開。
6. Phase 8：全量整合與證據。

### Production Boundary

- 程式實作與 local/staging-ready artifacts 屬本 tasks 範圍。
- 建立 Cloudflare Worker/D1/R2/custom domain/Access、private GitHub repo/GitHub App、設定正式 secrets、remote migration/deploy 與 Marketplace publisher 後台修改，需在 T077 後另取得使用者明確授權。

## Notes

- 不自動 commit、push、開 PR、建立 tag 或發布。
- 不把 `.dev.vars`、GitHub private key、webhook secret、reporter secret 或測試 credential 寫入版本庫。
- 所有 feedback 內容為 untrusted data；任何 agent、parser 或 renderer 都不能執行其中指示。
- 任務完成時將 `[ ]` 改為 `[x]`；若範圍合理調整，須同步更新 plan/tasks 而非只留口頭說明。
