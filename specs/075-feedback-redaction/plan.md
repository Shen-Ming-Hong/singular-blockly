# 實作計畫：意見回饋自動遮蔽私人細節

**分支**：`claude/project-thread-7x1u6e` | **日期**：2026-11-26 | **規格**：[spec.md](./spec.md)

## 摘要

把 070 的單一「敏感內容就拒收」拆成兩層：憑證拒收、其他私人細節替換成固定佔位文字。規則仍只定義一次（`src/services/feedbackContentSafety.ts`），由擴充套件、Worker 驗證層、公開 Issue 產生器與入口網站的瀏覽器程式共用。

## 技術背景

**語言／版本**：TypeScript 6.0.3（Extension Host、Worker）、WebView 與入口網站的瀏覽器 JavaScript。\
**相依**：不新增依賴。正規表示式使用 lookbehind 與 Unicode 屬性，VS Code（Electron）、workerd 與現代瀏覽器皆支援。\
**儲存**：D1 欄位與 CHECK 不變，無 migration。\
**驗證**：Mocha（擴充套件與瀏覽器版一致性）、Vitest + workerd 本機 D1（Worker 單元與整合）、i18n 驗證、portal 語系產物檢查、雲端本地 VS Code 截圖。\
**限制**：Extension Host 與 WebView 只透過 `postMessage`；WebView 訊息格式不變（`feedback:preview`、`feedback:previewReady`、`feedback:error` 的欄位不增減）。

## 憲法檢查

符合。共用規則避免三處各自實作；資料保護不變式維持（憑證仍 fail closed、Worker 仍是最後一道驗證）。沒有豁免。

## 設計

1. **規則（`feedbackContentSafety.ts`）**：`BLOCKED_PATTERN_DEFINITIONS`（070 的憑證規則原樣保留）→ `containsBlockedFeedbackText`；`LOCAL_REDACTION_DEFINITIONS`（序列埠、Windows、Unix、相對路徑，只在網址之外套用）與 `GLOBAL_REDACTION_DEFINITIONS`（IPv4、UUID），加上 IPv6 候選以 `URL` 解析確認 → `redactFeedbackText`。序列埠先於路徑，`./`／`~/` 先於 Unix 絕對路徑，避免部分替換。Windows 路徑的中間資料夾可含空白，最後一段不含 `:`，讓 `:12:5` 行號保留。
2. **瀏覽器版**：`feedbackContentSafetyBrowserSource()` 以 JSON 內嵌同一份定義，產生 `containsBlockedFeedbackText` 與 `redactFeedbackText`。
3. **擴充套件（`feedbackPanel.ts`）**：預覽與送出都先驗長度、擋憑證、遮蔽、再驗長度；草稿以遮蔽後內容建立預覽與摘要，因此確認比對不受影響。補充訊息同樣處理，遮蔽後超過 4000 字回 `invalid_input`。
4. **Worker（`schemas.ts`）**：憑證回 `sensitive_content`；通過後遮蔽並重新檢查長度。`renderPublicIssue` 在建立公開 Issue 前遮蔽摘要。
5. **入口網站（`portal.ts`）**：補充訊息先擋憑證（顯示警語並保留草稿），再遮蔽後送出，維持「回傳 body 等於送出 body」的確認方式。
6. **文案**：`FEEDBACK_PERSONAL_DATA_WARNING`、`FEEDBACK_ERROR_SENSITIVE_CONTENT` 15 語系更新；入口網站語系重新產生；隱私政策英文、繁中與 13 個精簡語系各加一句並更新日期。

## 專案位置

- 規格：`specs/075-feedback-redaction/`
- 共用規則：`src/services/feedbackContentSafety.ts`
- Extension Host：`src/webview/feedbackPanel.ts`
- WebView：`media/html/feedback.html`、`media/locales/*/messages.js`
- Worker：`workers/feedback/src/domain/schemas.ts`、`routes/portal.ts`、`services/githubApp.ts`、`policyContent.ts`、`policyContentTranslations.ts`、`portalLocales.ts`（產物）
- 測試：`src/test/services/feedbackContentSafety.test.ts`、`src/test/webview/feedbackPanel.test.ts`、`myFeedbackPanel.test.ts`；`workers/feedback/test/unit/schemas.test.ts`、`portal.test.ts`、`githubApp.test.ts`、`integration/createFeedback.test.ts`

## 部署與回退

合併後依 `maintain-feedback-service` 部署 Worker（無 migration）。回退：`wrangler rollback` 到上一版；舊版 Worker 會重新拒收路徑，不影響已存資料。擴充套件端隨下一版 VSIX 生效；舊版擴充套件送出的內容本來就不含這些細節，與新版 Worker 相容。
