---
name: local-code-review-loop
description: 對目前專案差異執行有成本上限的本地 Code Review 收斂循環。當使用者要求「開始本地端 code review」、評估 findings 是否採納、修正採納項目、重新送審、反覆 review 到清空，或提到 local review loop、re-review、review until clean 時使用。涵蓋已提交、暫存、未暫存與未追蹤變更；保留不採納理由，並在收斂、達到審查預算或需要使用者決定時停止。
---

# 本地 Code Review 收斂循環

對目前工作區的有效差異執行有界的「審查、評估、修正、驗證、重審」。完整差異仍是最終判斷依據，但大型差異須先分批，不得以無上限的時間、token 或工具重試追求 `CLEAR`。

## 0. 成本、範圍與停止預算

開始前先向使用者簡短揭露本輪範圍、是否會把程式碼送至雲端模型、預計執行的驗證，以及下列預算：

- 使用外部／雲端 reviewer 必須先取得明確同意；「本地 Code Review」不代表程式碼一定只在本機處理。
- 每次使用者授權最多執行兩輪外部 reviewer。兩輪後即使尚未 `CLEAR`，也必須停止、回報剩餘 finding，並由使用者決定是否增加新預算。
- 單輪外部 reviewer 最多等待 15 分鐘。達到上限、串流中斷重試、輸出連續兩次截斷，或 reviewer 開始重複已完成的掃描時，立即終止該輪並回報現況。
- 外部 reviewer 預設只做唯讀靜態審查；不得自行執行完整測試、封裝、部署或發布。若使用的 reviewer 無法可靠限制這些動作，不得用它審查大型差異。
- 若有效差異超過 50 個檔案或 5,000 行增刪，先依功能／風險切成可追蹤批次。不得直接把整份差異送入外部 reviewer；完成批次後只做一次有界的跨批次整合檢查。
- 每個修正批次最多執行一次完整驗證套件；同一差異未變時沿用既有成功證據。修正期間只重跑受影響的定向測試，不得由 reviewer 與主流程重複執行相同完整驗證。
- Code Review 授權不包含 commit、push、PR、部署、GitHub／雲端設定或 Marketplace 發布。審查結束後不得自動銜接這些外部動作。

任何預算停止都不是失敗，也不可偽裝成 `CLEAR`。使用 `BUDGET_STOP` 回報已完成範圍、尚未驗證項目、剩餘 finding、已耗輪數與建議的下一個最小步驟。

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
6. 先以 `--stat`／`--numstat` 判斷大小，再依第 0 節決定是否分批；不得先把超大型完整 diff 載入模型後才發現超出預算。

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
4. 依風險執行最小相關測試，再執行專案要求的靜態檢查。遵守第 0 節的驗證去重與單次完整驗證上限；測試失敗視為新 finding，不得忽略。
5. 不自行 commit、push、建立 PR、merge、tag 或發布；只有呼叫流程或使用者明確授權時才執行。

## 5. 有界重新送審

每次修正與驗證後，重新審查完整有效差異並比較 finding 簽章：

- 沒有 finding：以 `CLEAR` 結案。
- 只剩有具體理由的 `REJECT`：以 `CLEAR_WITH_REJECTIONS` 結案。
- 存在 `NEEDS_USER_DECISION`：停止並列出選項、證據與風險。
- 同一採納 finding 修正後連續兩輪重現、finding 數沒有下降，或差異在兩個方案間震盪：以 `BLOCKED` 停止，回報根因與需要的決定。
- 達到第 0 節任一輪數、時間、輸出、差異大小或重複驗證上限：以 `BUDGET_STOP` 停止，不得自動增加預算或開啟新 reviewer session。

finding 持續減少只代表可在剩餘預算內繼續，不得覆蓋硬性停止條件。每輪只檢查新修正與必要整合邊界是否產生回歸；完整有效差異的最終檢查仍須遵守大型差異分批規則。

## 6. 結案報告

回報：

- 審查 base、範圍與輪數。
- 每個 finding ID 的最終分類與理由。
- 實際修正與測試結果。
- `CLEAR`、`CLEAR_WITH_REJECTIONS`、`NEEDS_USER_DECISION`、`BLOCKED` 或 `BUDGET_STOP`。
- 殘餘風險及未執行的外部動作。
- 外部 reviewer 使用輪數、是否傳送至雲端、是否因時間／輸出／差異大小停止，以及哪些既有驗證證據被沿用而未重跑。
