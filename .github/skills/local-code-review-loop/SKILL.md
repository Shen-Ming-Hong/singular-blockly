---
name: local-code-review-loop
description: 對目前專案差異執行本地 Code Review 收斂循環。當使用者要求「開始本地端 code review」、評估 findings 是否採納、修正採納項目、重新送審、反覆 review 到清空，或提到 local review loop、re-review、review until clean 時使用。涵蓋已提交、暫存、未暫存與未追蹤變更；保留不採納理由，直到沒有可採納 finding、只剩已證實不採納項目，或需要使用者決定。
---

# 本地 Code Review 收斂循環

對目前工作區的完整有效差異反覆執行「審查、評估、修正、驗證、重審」，不要只審查上一輪補丁。

## 1. 建立審查範圍

1. 讀取適用的 `AGENTS.md`、核准規格與測試契約。
2. 執行：

   ```bash
   git status --short
   git merge-base origin/master HEAD
   git diff --stat origin/master...HEAD
   git diff origin/master...HEAD
   git diff --cached
   git diff
   git ls-files --others --exclude-standard
   ```

3. 若沒有 `origin/master`，改用本地預設分支的 merge-base；不要只為取得 base 自動 fetch。
4. 納入已提交、暫存、未暫存及未追蹤檔案；逐一讀取未追蹤檔案內容，不能只看檔名。保留使用者既有變更，不回復、不覆寫無關內容。
5. Code review 一律啟用 `security-checker`。若差異涉及翻譯，使用 `i18n-maintenance` 唯讀 gate；若涉及 TS／JS 簡化，再使用 `code-simplifier`。

## 2. 執行一輪審查

1. 檢查正確性、回歸、邊界條件、安全性、相容性、架構契約與必要測試覆蓋。
2. 只提出可執行的 P0–P3 finding。每項包含穩定 ID、檔案與行號、證據、影響及最小修正方案。
3. 以 `LCR:<path>:<line>:<slug>` 作為 finding ID；同一根因跨輪沿用相同 ID。
4. 不把純偏好、未具體化的擔憂或與本次差異無關的既有問題列為 finding。

## 3. 評估是否採納

逐項使用下列其中一種結果：

- `ADOPT`：有具體證據，且最小修正位於本次範圍。
- `ADOPT_WITH_ADJUSTMENT`：根因成立，但縮小原建議的改動範圍。
- `REJECT`：與程式行為、核准規格或專案契約衝突，或只是偏好／投機性抽象；記錄理由。
- `NEEDS_USER_DECISION`：需要產品、相容性、文案或風險取捨；不得猜測，也不得假裝成 `REJECT` 以結束循環。

只有 `ADOPT` 與 `ADOPT_WITH_ADJUSTMENT` 可以進入修正。不得為了降低 finding 數量而改變分類。

## 4. 修正與驗證

1. 使用者明確要求完整 review／fix／re-review 循環時，可執行本地、可逆且不擴張範圍的採納修正。若只要求 review，保持唯讀。
2. 若由 `pr-review-release` 呼叫，該 Skill 的 Phase 1.5 修正核准與 Phase 3.5 發布核准優先；取得核准前只完成審查與採納評估。
3. 只修正已授權的採納項目；不修改 `REJECT` 或 `NEEDS_USER_DECISION` 項目。
4. 依風險執行最小相關測試，再執行專案要求的靜態檢查。測試失敗視為新 finding，不得忽略。
5. 不自行 commit、push、建立 PR、merge、tag 或發布；只有呼叫流程或使用者明確授權時才執行。

## 5. 重新送審直到收斂

每次修正與驗證後，重新審查完整有效差異並比較 finding 簽章：

- 沒有 finding：以 `CLEAR` 結案。
- 只剩有具體理由的 `REJECT`：以 `CLEAR_WITH_REJECTIONS` 結案。
- 存在 `NEEDS_USER_DECISION`：停止並列出選項、證據與風險。
- 同一採納 finding 修正後連續兩輪重現、finding 數沒有下降，或差異在兩個方案間震盪：以 `BLOCKED` 停止，回報根因與需要的決定。

只要採納 finding 持續減少就繼續循環，不設定任意輪數上限。每輪都要重新檢查新修正是否產生回歸。

## 6. 結案報告

回報：

- 審查 base、範圍與輪數。
- 每個 finding ID 的最終分類與理由。
- 實際修正與測試結果。
- `CLEAR`、`CLEAR_WITH_REJECTIONS`、`NEEDS_USER_DECISION` 或 `BLOCKED`。
- 殘餘風險及未執行的外部動作。
