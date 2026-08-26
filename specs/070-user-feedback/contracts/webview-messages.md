# Webview Message Contract

Webview 不直接連網、不持有 reporter secret，也不接受任意 command name。Extension Host 對每個 message 做 discriminated-union 驗證；未知欄位或 `command` 直接忽略並記錄穩定事件代碼。

## Webview → Extension Host

| command | Payload | Effect |
|------|---------|--------|
| `feedback:ready` | `{ command }` | 回傳本機初始 state；不連網 |
| `feedback:preview` | `{ command, draft, includeDiagnostics, includeRecentEvents, screenshot? }` | 本機驗證並回傳即將傳送的完整 payload；不連網 |
| `feedback:submit` | `{ command, draft, includeDiagnostics, includeRecentEvents, screenshot?, confirmationId }` | confirmationId 必須對應最新 preview digest，否則拒絕；Extension 呼叫 API |
| `feedback:list` | `{ command, cursor? }` | Extension 以 SecretStorage credential 查詢自己的回饋 |
| `feedback:detail` | `{ command, feedbackId }` | 只接受 UUID；查詢自己的明細 |
| `feedback:messages` | `{ command, feedbackId, cursor }` | 以受簽章 cursor 續載自己的公開訊息時間軸 |
| `feedback:addMessage` | `{ command, feedbackId, body, idempotencyKey }` | 補充文字 |
| `feedback:deleteOne` | `{ command, feedbackId, confirmationText, idempotencyKey }` | confirmationText 必須符合本地化確認值 |
| `feedback:deleteAll` | `{ command, confirmationText, idempotencyKey }` | 刪除全部並在成功後清除 SecretStorage |
| `feedback:copyRecovery` | `{ command }` | 由 Extension 以 secret 組合 fragment URL 後寫入 clipboard；Webview 永不收到 secret |
| `feedback:openPolicy` | `{ command, policy: 'privacy'|'support'|'terms' }` | Extension 使用 `vscode.env.openExternal` 開固定 allowlist URL |

## Extension Host → Webview

| command | Payload |
|------|---------|
| `feedback:initialState` | localized strings、mode、diagnostics preview、limits；不含 secret |
| `feedback:previewReady` | normalized draft、exact diagnostics、screenshot summary、`confirmationId` |
| `feedback:submitted` | success reference 與目前公開狀態；不回 raw server body |
| `feedback:error` | stable error code；不回 raw server body |
| `feedback:recoveryCopied` | clipboard 寫入成功通知；不含 secret 或 URL |
| `feedback:listResult` | `FeedbackSummary[]`, request cursor、nextCursor |
| `feedback:detailResult` | `FeedbackDetail` |
| `feedback:messagesResult` | `feedbackId`, request cursor、`FeedbackMessage[]`, nextCursor |
| `feedback:mutationResult` | operation、success、stable error code；detail 錯誤帶 feedbackId；list/messages 分頁錯誤另帶原 request cursor，messages 同時帶 feedbackId，Webview 只接受符合目前 request identity 的錯誤 |

## Screenshot DTO

Webview 經 Canvas 重新編碼後傳：

```ts
interface SanitizedScreenshotMessage {
  mediaType: 'image/png' | 'image/jpeg';
  bytesBase64: string;
  width: number;
  height: number;
  originalName?: never;
}
```

Extension 解碼後驗證 ≤3 MiB、1..1920 dimensions、base64 canonical 與 magic bytes。不得傳原始檔名、路徑、lastModified 或 EXIF。

## Preview Confirmation Binding

1. Extension 對 normalized draft + selected diagnostics + screenshot SHA-256 計算 digest。
2. Extension 產生一次性 `confirmationId`，記錄 `{digest, expiresAt}`，最長 10 分鐘。
3. `submit` 時重新 normalize 與 digest；不一致、過期或已使用即拒絕並要求重新預覽。
4. 只有 submit 通過後才建立/讀取 reporter secret 並進行網路請求。
5. 若服務端回覆 `invalid_reporter`，Extension 清除已撤銷 secret 並保留表單，但不得在同一次 submit 自動建立新 reporter 或重送；只有使用者再次明確送出才可建立新匿名身分。

## Rendering Rules

- 所有 title/body/message/error 使用 `textContent`；不得以 `innerHTML` 顯示外部或自由文字。
- 清單與訊息分頁一次只允許一個 in-flight cursor，明細只接受最後一次要求的 feedback ID；過期或重複回應不得改變目前選取與後續 mutation 目標。
- HTML template 不插入使用者內容；localization 只從 extension-owned locale 檔載入。
- CSP: `default-src 'none'; img-src <webview-source> data: blob:; style-src <webview-source>; script-src 'nonce-...'; connect-src 'none'; font-src <webview-source>;`。
- `localResourceRoots` 僅 `media/`；不允許 workspace URI。
