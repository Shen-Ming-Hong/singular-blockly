# 任務：意見回饋自動遮蔽私人細節

**輸入**：[spec.md](./spec.md)、[plan.md](./plan.md)

## Phase 1：共用規則

- [x] T001 在 `src/services/feedbackContentSafety.ts` 拆出 `containsBlockedFeedbackText` 與 `redactFeedbackText`，瀏覽器版由同一份定義產生
- [x] T002 [P] 新增 `src/test/services/feedbackContentSafety.test.ts`：瀏覽器版與 TS 版結果一致、遮蔽可重複套用、只有憑證被擋

## Phase 2：使用情境一與二—貼錯誤可送出、憑證仍擋（P1）

- [x] T003 `src/webview/feedbackPanel.ts` 預覽與送出改為擋憑證後遮蔽，遮蔽後再驗長度
- [x] T004 `workers/feedback/src/domain/schemas.ts` 同步規則並在遮蔽後驗長度
- [x] T005 [P] 測試：`feedbackPanel.test.ts`（憑證拒收、預覽與送出內容為遮蔽結果）、`schemas.test.ts`（憑證表、遮蔽對照表、程式碼照收、遮蔽後超長）、`createFeedback.test.ts`（D1 實際儲存遮蔽後內容、憑證不寫入）

## Phase 3：使用情境三—補充訊息與入口網站（P2）

- [x] T006 `feedbackPanel.ts` 的補充訊息先擋憑證再遮蔽
- [x] T007 `workers/feedback/src/routes/portal.ts` 送出前擋憑證、遮蔽
- [x] T008 [P] 測試：`myFeedbackPanel.test.ts`、`portal.test.ts`

## Phase 4：使用情境四—公開摘要（P3）

- [x] T009 `workers/feedback/src/services/githubApp.ts` 的 `renderPublicIssue` 遮蔽摘要，並在 `githubApp.test.ts` 驗證

## Phase 5：語系、政策與驗證

- [x] T010 15 語系更新表單警語與憑證錯誤訊息，`media/html/feedback.html` 預設英文同步；`npm run feedback:portal-locales`
- [x] T011 隱私政策（英文、繁中、13 個精簡語系）加入遮蔽與拒收說明並更新日期
- [x] T012 本地驗證：`npm audit --audit-level=high`、`npm run ci:static`、`xvfb-run -a npm run test:unit:ci`、回饋面板截圖（表單警語、審查畫面）
- [ ] T013 合併後部署 Worker 並依 `maintain-feedback-service` 核對
