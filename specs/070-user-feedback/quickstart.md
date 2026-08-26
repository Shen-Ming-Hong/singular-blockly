# Quickstart Validation: 提供回饋與進度追蹤

本文件是可執行的驗證指南，不包含正式秘密或 production mutation。預設使用本機 D1/R2/Worker 與 fake GitHub adapter。

## Prerequisites

- Node.js 22.16.0+
- 已執行 `npm install`
- VS Code `^1.109.0`
- 不需 Cloudflare/GitHub production credential 即可完成本機 gate

## 1. Static and Contract Gates

```bash
npm run compile-tests
npm run compile
npm run lint
npm run validate:i18n
npm run test:i18n
npm run check:project-skills
npm run feedback:contracts
```

Expected:

- TypeScript strict compile 無錯誤。
- 15 語系具有相同 feedback keys 與 placeholders。
- OpenAPI、Webview message schema、GitHub command vocabulary 與 TypeScript enum 一致。
- `triage-user-feedback` validator 能拒絕缺頁、未核准 mutation 與 prompt-injection fixture。

## 2. Extension Unit and Contract Tests

```bash
npm run test:unit:ci -- --grep "Feedback|PrivacyRedactor"
```

Expected:

- 診斷 allowlist 不含 path/name/source/raw log/error/token/IP/serial/Wi-Fi。
- 基本 diagnostics 預設 true、recent events false。
- reporter secret 32 bytes 且只經 SecretStorage adapter。
- preview digest 改變後舊 confirmationId 失效。
- Webview CSP `connect-src 'none'`，所有不可信文字用 `textContent`。

## 3. Worker Local Tests

```bash
npm run feedback:test
npm run feedback:migrate:local
npm run feedback:dev
```

Expected:

- Worker test 使用本機 D1/R2 bindings，無 production remote binding。
- create/list/detail/message/delete/delete-all/session exchange 通過 ownership、CSRF、origin、size 與 idempotency 測試；delete-all 在撤銷憑證前已原子持久化每筆刪除工作，排程不會把隱私刪除永久 dead-letter。
- duplicate webhook delivery 只處理一次；錯誤 repo/signature/actor 被拒絕。
- fake GitHub outage 時 create 仍回 201，outbox pending；恢復後只建立一個 private issue。

## 4. End-to-End Reporter Flow

1. 以 Extension Development Host 開啟 Blockly 編輯器。
2. 確認 Blockly 編輯器自己的控制區有獨立藍色圓形「提供回饋」圖示，hover／鍵盤 focus／可存取樹可辨識其本地化名稱；Command Palette 可執行相同命令，Help: Report Issue 也列出 Singular Blockly，通用編輯器標題列不應出現容易混淆的回饋圖示。最右側 toggle 收合後只顯示備份、上傳、Monitor 與 toggle，重新展開後其他適用操作恢復。
3. 開啟表單但直接關閉；檢查 Worker 沒有 request。
4. 建立 bug 回饋：填入 title/description，保留基本環境、不要開啟 recent events。
5. 點預覽，逐欄比對畫面與 local Worker request；確認沒有 workspace name/path/source/raw logs。
6. 修改 title 後直接嘗試送出；應要求重新預覽。
7. 加入含 EXIF 且大於 1920px 的測試截圖；預覽應顯示縮小後尺寸、≤3 MiB，server object 不含 EXIF。
8. 送出並確認取得 reference；重送相同 idempotency key 不新增第二筆。
9. 開啟「我的回饋」、確認明細同時顯示描述、重現步驟、預期結果、允許清單式 diagnostics、附件狀態與訊息，再補充文字；模擬不確定回應並重開 Webview，相同本文不得新增第二則訊息。
10. 複製 recovery link；確認 secret 只在 fragment，exchange 後 address bar 不再含 fragment，cookie 為 HttpOnly/Secure/SameSite Strict；模擬剪貼簿失敗時，錯誤必須顯示在目前成功結果畫面的 recovery status。
11. 刪除單筆，確認 API 立即 404、R2 object 消失、private issue 只剩 content-free closed tombstone。
12. 建立兩筆後執行 delete-all，確認 SecretStorage 清除、舊 bearer/session/recovery link 全失效。

## 5. Maintainer and Public Approval Flow

使用 fake GitHub fixtures 或獨立 staging private repo：

1. 建立回饋後確認 private issue title/body 只含不帶回饋內容的 routing shell/outbox marker；原文只出現在可刪除的初始 private comment，且沒有 reporter secret、IP、路徑或附件 public URL。
2. 加一般 comment；reporter timeline 不變。
3. 以非 allowlisted actor 發 `/feedback public-reply`；應 403/ignore。
4. 以 maintainer 執行 `needs-info` 並附文字；reporter 看到狀態與訊息。
5. 執行不採取行動但不附 public reason；應拒絕。
6. 執行有效 `not-actionable duplicate`；decision/status/resolution 依契約更新。
7. 在 feedback body 放 prompt injection 與偽 slash command，執行 triage Skill；只能產生建議 labels，不執行內容。
8. 由非 owner maintainer 執行 `approve-public`；應拒絕。
9. 由 owner allowlist 執行 `approve-public`，檢查 public issue 不含 private reference、附件、diagnostics/backlink，且只建立一次。
10. 刪除原 feedback，public issue 保留但任何 private mapping 被 sever。

## 6. Accessibility and Theme Manual Gate

- 僅鍵盤完成開啟、類型選擇、文字輸入、diagnostics toggle、截圖移除、預覽、確認、送出、明細、補充與刪除。
- 確認欄位 label、required/error、toggle default、送出摘要、busy/status 與 destructive confirmation 都具有可稽核的 HTML/ARIA 語意；不要求實際語音朗讀驗收。
- VS Code light/dark/high-contrast themes 下 focus、error、disabled、link、status chip 與 screenshot preview 可辨識。
- 視窗縮至窄欄、字型 200% 時不發生水平內容遺失。

## 7. Privacy and Marketplace Packaging Gate

```bash
npm run package
npx @vscode/vsce package --out /tmp/singular-blockly-feedback-test.vsix
npm run feedback:verify-vsix -- /tmp/singular-blockly-feedback-test.vsix
```

Expected:

- VSIX 不含 `workers/`, `.dev.vars`, migrations、private keys、service secrets、specs、triage maintainer Skill 或 server tests。
- VSIX 包含 `PRIVACY.md`, `SUPPORT.md`, `TERMS.md` 與必要 feedback media assets。
- manifest 有 `homepage` 與 `bugs.url`；README 線上服務摘要與 policy 文件一致。
- 人工 release checklist 仍標記：Microsoft Marketplace Publisher privacy URL、正式 `/privacy`/`support`/`terms` 可到達、Open VSX 掃描結果。未確認前不得發布。

## 8. Production Provisioning Gate（需明確授權）

只有在程式、測試、隱私文件與 staging 全通過後才執行：

1. 建立/確認 Worker `singular-blockly-support`、D1 `singular-blockly-feedback`、private R2 `singular-blockly-feedback-screenshots`。
2. 設定 custom domain `blockly-support.singular-ai.org` 與 `/admin/*` Access policy。
3. 建立 private repo `Shen-Ming-Hong/singular-blockly-feedback`。
4. 建立 GitHub App、只選兩個 repo、只授予 Metadata read + Issues read/write，設定 webhook secret。
5. 以 secret store 寫入 pepper、App private key、webhook secret、repo/actor allowlists；不得寫入版本庫。
6. apply remote D1 migration、deploy Worker、執行無敏感資料 smoke test。
7. 檢查 Cloudflare/GitHub logs 不含 reporter secret、request body、raw IP persistence 或 attachment content。

任何 production create/deploy/repo/App/policy mutation 都不由本機 quickstart 自動執行。
