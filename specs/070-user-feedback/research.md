# Phase 0 Research: 提供回饋與進度追蹤

**Date**: 2026-08-19

## 1. VS Code 回饋入口與 Webview 安全

**Decision**: 提供 `singular-blockly.provideFeedback` 與 `singular-blockly.showMyFeedback` 命令；前者由 Blockly Webview 內具獨立藍色、回饋圖示、本地化 tooltip 與 ARIA 名稱的圓形產品按鈕、Command Palette 與 VS Code `issue/reporter` menu 開啟。產品按鈕只送出固定的 `provideFeedback` 訊息，再由 Extension Host 執行已註冊命令；不使用會與其他擴充套件操作混在一起的 `editor/title` 圖示。工具列在尚無專案偏好時預設收合並可從最右側展開，收合後只保留備份、上傳與 Monitor；同一 panel 狀態留在 VS Code Webview state，跨 panel／重開專案的最後選擇以嚴格 boolean 訊息保存於專案 `workspaceState`。兩個回饋流程共用一個受限 WebviewPanel；Webview 只透過 `postMessage` 與 Extension Host 溝通，`connect-src 'none'`、僅載入 `webview.asWebviewUri()` 的本地資源、使用 nonce 與最小 `localResourceRoots`。

**Rationale**: VS Code 官方建議擴充套件整合 `Help: Report Issue...` 的 `issue/reporter` contribution，而不是另做只會導向外部 issue 的回報命令；同時 Webview 官方安全指引要求最小 capabilities、CSP、HTTPS 與輸入消毒。實機 UX 驗證顯示通用編輯器標題列的圖示會與其他擴充套件操作混淆，因此主要可發現入口放在 Singular Blockly 自己的控制區，`issue/reporter` 保留為額外原生入口。

**Alternatives considered**: 只開外部 GitHub issue 會排除目標使用者並可能公開敏感診斷；只用內建 issue reporter 無法提供匿名追蹤、刪除與私密附件；Webview 直接呼叫服務會擴大 CSP、CORS 與 token 暴露面。

**Official sources**: [VS Code Issue Reporting](https://code.visualstudio.com/api/get-started/wrapping-up#_issue-reporting)、[VS Code Webview security](https://code.visualstudio.com/api/extension-guides/webview#_security)

## 2. 回報者秘密與備援連結

**Decision**: Extension 首次送出前以密碼安全亂數產生 32 bytes（256-bit）base64url reporter secret，保存在 VS Code `SecretStorage`。服務端以獨立 server pepper 做 HMAC-SHA-256 後查找，不保存明文或普通雜湊。備援連結為 `https://blockly-support.singular-ai.org/r#secret=<value>`；portal script 讀取 fragment、呼叫同源 `/api/v1/session/exchange`、收到 `HttpOnly; Secure; SameSite=Strict` session cookie 與 CSRF token，隨即清除 fragment。

**Rationale**: VS Code desktop 的 SecretStorage 使用 Electron safeStorage；URL fragment 不會作為 HTTP request target 傳送。HMAC pepper 防止資料庫單獨外洩後的離線驗證；256-bit secret 不需帳號或個資即可證明 ownership。

**Alternatives considered**: Email OTP 收集額外個資；Cloudflare Access 不適合超過 50 人的公開匿名回報；query string 會進入 request/log/Referer；服務端保存明文不可接受。

**Official sources**: [VS Code Common Capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities)、[Cloudflare Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)

## 3. 最小化診斷與遙測界線

**Decision**: 回饋是使用者主動觸發的 support upload，不在 activation、表單開啟或背景傳輸。基本 allowlist 預設開啟但可關閉；近期穩定事件預設關閉；不收集 raw logs/stack/errors/source/workspace/path/device/network secrets。文件與 UI 明確稱為「回饋資料」，不稱 telemetry。未來若加入自動使用分析，須另行尊重 `vscode.env.isTelemetryEnabled` 與提供 `telemetry.json`。

**Rationale**: VS Code 官方遙測指引要求最小化、透明、不得收集 PII，且自訂遙測需尊重全域選擇。主動 support upload 與背景 usage analytics 的使用者期待不同，但清楚揭露與送出確認仍是必要邊界。

**Alternatives considered**: 直接附加 extension logs 可能含路徑、命令輸出或 user content；基本資訊全預設關閉會使多數非技術回報無法診斷，故採可見、可關閉、嚴格 allowlist。

**Official source**: [VS Code Telemetry extension authors guide](https://code.visualstudio.com/api/extension-guides/telemetry)

## 4. 截圖安全管線

**Decision**: Webview 只接受一張 PNG/JPEG；解碼前先限制原始檔為 16 MiB，從最多 512 KiB header 解析尺寸並限制單邊 16384、約 40MP 像素預算，再使用 Canvas 重新繪製並輸出 JPEG 或 PNG，以移除 EXIF/文字 chunks 等 metadata；等比例縮至最長邊 1920，輸出後硬限制 3 MiB。非同步處理以選取世代丟棄已被更換或移除的結果。Extension Host 再檢查 magic bytes 與長度；Worker 完整檢查 PNG chunk/CRC/deflate 或 JPEG marker/EOI、解碼尺寸、容量與單附件規則，最後以隨機 object key 存入非公開 R2。

**Rationale**: 重新編碼比逐格式剝除 metadata 更容易驗證；三層驗證處理惡意 Webview message、格式偽裝與直接 API 呼叫。R2 bucket 預設不是公開資源，附件只經受維護者身分保護的 endpoint 串流。

**Alternatives considered**: Base64 放 D1 不適合二進位物件；公開或 presigned URL 可能被轉貼；OCR 自動遮蔽誤判與複雜度過高，v1 使用預覽、警示與 sanitation。

**Official sources**: [R2 public bucket behavior](https://developers.cloudflare.com/r2/buckets/public-buckets/)、[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

## 5. Worker、D1、R2 與 Free plan

**Decision**: 以單一 `singular-blockly-support` Worker 提供 API、portal static HTML 與 webhook；D1 綁定 `singular-blockly-feedback`，R2 綁定私有 `singular-blockly-feedback-screenshots`，route 指向 `blockly-support.singular-ai.org`。查詢使用 prepared statements；多表一致寫入使用 D1 `batch()`；schema 以順序 migrations 管理。所有 reporter API 在 D1 驗證前先以獨立來源 HMAC rate-limit key 套用有界限速；驗證成功後，bearer 與所有 recovery sessions 再依同一 reporter HMAC 套用主要限速。建立與 session exchange 另保留較嚴格的未驗證來源限制，絕不保存 raw IP。

**Rationale**: Cloudflare binding 直接提供資源 capability，無需把 D1/R2 credential 放入程式。D1 batch 具 transaction rollback；R2 預設 private。官方 rate-limit 指引不建議共享 IP 作主要 key。Free plan 100,000 requests/day、D1 5M rows read/100k writes per day與 R2 10 GB-month 足以涵蓋初始規模，但需索引與 abuse controls。

**Alternatives considered**: 多 Worker 不符合目前規模；GitHub 作唯一資料庫無法安全實作個人查詢/刪除/internal comment；Cloudflare Access 僅用於 `/admin/*`，不作 reporter 身分。

**Official sources**: [Workers bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)、[D1 API](https://developers.cloudflare.com/d1/worker-api/)、[D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)、[D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)、[Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、[Workers limits](https://developers.cloudflare.com/workers/platform/limits/)、[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

## 6. 冪等、outbox 與刪除一致性

**Decision**: Extension 為每次 mutation 產生 UUID idempotency key；Worker 以 `(reporter_id, route, key)` 唯一鍵保存 request digest 與 response，digest 不同則 409。建立/補充在 D1 transaction 同時寫 domain state 與 outbox；GitHub 同步失敗只留下 outbox，scheduled handler 後續重試並使用外部 marker/mapping 避免重複。刪除先標為 delete-pending，保留 create marker 處理並行建立，再同步 scrub GitHub 私密內容與移除 R2；只有外部清除和 D1 tombstone transaction 都成功才回 204，暫時失敗回可用相同 idempotency key 重試的 503，outbox 也會續作。

**Rationale**: 網路逾時常使 client 不知道 server 是否完成；idempotency 能安全重試。Transactional outbox 保證 D1 真實來源與 GitHub 維護副本最終一致。刪除流程需承認第三方備份/稽核限制，不宣稱物理即時完全抹除。

**Alternatives considered**: 請求內同步 GitHub 會讓第三方暫時故障阻斷回饋；Queue 作唯一 outbox 無法與 domain row 原子寫入且 Free retention 較短。

## 7. GitHub App 權限與 webhook

**Decision**: 建立專用 GitHub App，只安裝在 `Shen-Ming-Hong/singular-blockly-feedback` 與 `Shen-Ming-Hong/singular-blockly`，repository permissions 僅 `Metadata: read`、`Issues: read/write`；不要求 Contents、Pull requests、Actions 或 organization 權限。Worker secret 保存 App ID、installation ID、private key 與 webhook secret，產生短期 JWT 並換取一小時 installation token；不假設 token 固定長度。每個 GitHub 內容操作在使用設定的 slug 前，須以 installation token 查詢 numeric repository ID，確認 API 回傳的 `id`、`full_name` 與預期 private/public visibility 全部一致；不一致時不得建立 Issue 或留言。Webhook 先以原始 body 驗證 `X-Hub-Signature-256` constant-time HMAC、檢查 `X-GitHub-Delivery` 唯一性、event allowlist 與 repository id allowlist，再解析 payload。私密 Issue scrub 只在呼叫留言 DELETE 的有界區段暫時解除 conversation lock，每批刪除後立即重新鎖定並在鎖定狀態確認沒有競態新增留言；刪除或驗證失敗時 fail closed，且失敗路徑仍嘗試恢復鎖定。所有 pepper 與 webhook secret 除了至少 32 bytes，亦須拒絕公開範例值且彼此不同。

**Rationale**: GitHub Apps 預設無權限且官方要求最小權限；installation token 適合獨立自動化並短期有效。2026 年新 token format 不可假設 40 字元。Webhook 官方要求 HMAC-SHA-256 與安全比較。

**Alternatives considered**: PAT 與個人生命週期耦合；OAuth user token 不符合服務自動化；repo webhook + bot PAT 仍需長期 PAT。

**Official sources**: [GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)、[GitHub App authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app)、[Installation tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)、[App best practices](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app)、[Webhook validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)

## 8. 維護者互動與 Agent Skill 安全

**Decision**: GitHub 私密 issue title/body 只保存不含回饋內容的 routing shell 與 outbox marker；回饋唯讀鏡像放在 App 建立、可由 Issues API 真正刪除的初始 private comment，避免 Issue 編輯歷史保留已刪除原文。其餘 comments 全是 internal。只有 App 可解析的嚴格 slash commands 能產生公開訊息/狀態，語法見 `contracts/github-commands.md`。`triage-user-feedback` Skill 只能列出/分頁/搜尋重複與提出 kind/area/impact/recommendation 建議；不得自行公開回覆、作 final decision、建立公開 issue 或啟動 SDD。feedback title/body/message 一律作為 `<untrusted-feedback>` 資料，不作指令。

**Rationale**: comments 預設 internal 比自然語言猜測公開意圖安全。決定與建議分離可留下人工 ownership；建立公開產品 issue 是外部狀態變更，必須由專案負責人核准。

**Alternatives considered**: 所有 comment 同步極易洩漏；Agent 自動關閉/公開容易受 prompt injection 且超出核准邊界。

## 9. Marketplace / Open VSX 合規與封裝

**Decision**: 新增 `PRIVACY.md`、`SUPPORT.md`、`TERMS.md` 與 README「線上服務與資料使用」摘要，`package.json` 加入 `homepage`，並將 `bugs.url` 固定為不要求 GitHub 登入且公開回應 200 的 `https://blockly-support.singular-ai.org/support`。正式網站提供 `/privacy`、`/support`、`/terms`，並與 recovery portal 一致提供全部 15 個既有語系的完整政策本文；英文只作未知語系 fallback。Microsoft Marketplace Publisher 後台 privacy URL 作人工 release gate。`.vscodeignore` 排除 `workers/**`、服務端測試/設定、`.dev.vars`、specs 與 contributor-only triage Skill；package gate 列出 VSIX 並掃描 secrets。Open VSX 上傳後再檢查 metadata 與掃描結果。

**Rationale**: Microsoft Publisher Agreement 8.0 明定 Offer 存取、收集或傳送 Personal Data 時必須維護並告知 privacy policy；即使不主動收姓名/郵件，截圖與自由文字仍可能包含個資。VS Code manifest 支援 bugs/homepage。Open VSX 發布會執行 secret、blocklist 與 namespace similarity 掃描。

**Alternatives considered**: 只在送出 dialog 提示使安裝前不可見；把 Worker 與部署檔打入 VSIX 沒有執行需求且增加 secrets false positive 與攻擊面。

**Official sources**: [Microsoft Publisher Agreement](https://learn.microsoft.com/en-us/legal/marketplace/msft-publisher-agreement)、[VS Code Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)、[VS Code Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)、[Open VSX Publisher Agreement](https://www.eclipse.org/legal/documents/eclipse-openvsx-publisher-agreement.pdf)、[Open VSX Publishing](https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions)、[Open VSX Scanning](https://github.com/eclipse-openvsx/openvsx/wiki/Extension-Scanning)

## 10. 保留政策與資料位置揭露

**Decision**: 回饋本文無固定到期日，直到回報者刪除；session 最長 24 小時，idempotency 7 天，webhook delivery 30 天，rate-limit/IP-HMAC 最長 24 小時，已完成 outbox 7 天，去敏 security audit 90 天。GitHub private issue 刪除後保留 content-free tombstone；供應商備份與安全稽核可能依政策短期保留。隱私文件揭露 Cloudflare 與 GitHub 是處理者、可能跨境處理，以及匿名公開摘要經專案負責人核准後可永久保留但切斷私密關聯。

**Rationale**: 產品需求選擇「回報者刪除前保存」；技術性資料應有短期上限。公開 issue 是社群開發紀錄，刪除來源回饋時以去識別與 sever link 平衡透明度與資料控制。

**Alternatives considered**: 所有資料定期到期會使 planned/in-progress 回饋與對話消失；宣稱刪除所有 provider backup 是系統無法保證的承諾。
