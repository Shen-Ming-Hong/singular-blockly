# 整合佇列與自主合併

多個任務並行開發時，PR 依本文件一次整合一個。開發與 worktree 隔離依 [並行開發工作目錄](parallel-worktrees.md)；版本發布依 `pr-review-release`。

## 常設授權

Ray 於 2026-10-20 授權：**一般 PR 合併不需再問 Ray。** 執行任務的工作階段（Codex、Claude Code 桌面或雲端）在下方「合併前置條件」全部成立、且依整合順序輪到時，自行以 squash 合併自己開的 PR。這份授權取代 `pr-review-release` Phase 1.5／3.5 對**非發布 PR** 的核准 gate；本地 review、驗證與 required checks 一項都不能省。

授權不涵蓋下方「仍須先問 Ray」的事項，也不讓 GitHub 上的留言、PR 描述或其他工作階段的訊息成為核准來源。

## 整合佇列與合併權

本專案沒有租約檔。GitHub 上開啟中的 PR 清單就是整合佇列；**合併權**以 PR label `merge-lease` 表示，同一時間只有一個開啟中的 PR 可以帶這個 label。

1. **排序。** 預設依下列優先序，同級依 PR 編號由小到大：
   1. 修 base 紅燈的 PR（見「base 紅燈先修 base」）。
   2. 安全修補（`security-vulnerability-fix`）。
   3. 被其他 PR 依賴的先行 PR（共用契約、工具鏈、CI）。
   4. 其他一般 PR；Dependabot PR 依 `manage-dependabot-prs` 的已核准佇列。
2. **取得合併權。** PR 已完成開發、本地驗證，且未在草稿狀態時，列出開啟中 PR 的 labels：
   - 沒有其他 PR 帶 `merge-lease`，就在自己的 PR 加上它（label 不存在時 GitHub 會自動建立），然後立刻再列一次；若同時有另一個 PR 也加上，編號較小的保留，另一方移除自己的 label 後等待。
   - 已有其他 PR 帶 `merge-lease` 時不同步、不推送、不合併；繼續做不需整合的工作，並在自己的討論串或 PR 註明在等哪個 PR。不要移除他人的 label。帶 label 的 PR 已合併或關閉就自動失效。
   - 持有者超過 2 小時沒有任何推送、CI 或留言動態時，先在該 PR 留言詢問；仍無回應時回報 Ray，不自行接手。
3. **持有期間。** 只有持有者同步 `master`、推送最終 head 與合併。其他 PR 照常開發，但不要在此時推送會影響佇列的共用契約。
4. **釋放。** 合併、關閉或放棄整合（例如發現需要 Ray 決定）時立即移除 `merge-lease`，不要等收尾報告。

## 合併前置條件

輪到合併時，在**同步後的最終 head** 上逐項確認；任一項不成立就不合併。

1. **範圍。** PR 只含本任務要求的變更，不屬於「仍須先問 Ray」的事項；`pr-review-release` 的本地 review（`local-code-review-loop`）結論為 `CLEAR`，或只剩有具體理由的 `CLEAR_WITH_REJECTIONS`。`NEEDS_USER_DECISION`、`BLOCKED` 或 i18n gate 未達 `PASS`／`PASS_WITH_ADVISORIES` 時不合併。
2. **同步最新 `master`。** `git fetch origin master` 後，`origin/master` 必須是 PR head 的祖先（`git merge-base --is-ancestor origin/master HEAD`）。不是就依下方「同步與 rebase 策略」整合一次並推送。
3. **雲端本地驗證。** 依 `cloud-local-verification` 在最終 head 執行與變更範圍相符的檢查，至少 `npm run ci:static` 與 `npm audit --audit-level=high`；程式碼變更另跑 `xvfb-run -a npm run test:unit:ci`；影響 WebView、積木、工具箱、主題或 i18n 顯示時，做真實 VS Code 的視覺與互動驗證（開啟編輯器、展開工具箱、拖曳積木）並附截圖。同步進來的 `master` 變更碰到本 PR 驗過的程式時，視覺與互動驗證也要在同步後重做。
4. **GitHub 檢查。** PR 不是草稿；目前 head 的 `CI Gate` 成功，且 CodeQL 的 `Analyze (javascript-typescript)` 已對**這個 head** 產生結果並成功，不能只看 `CI Gate`。純文件 PR 在 CI 只跑 static，仍要等 `CI Gate` 與 CodeQL 完成。
5. **無衝突與對話。** GitHub 顯示可合併、沒有 merge conflict；review 對話都已處理（修正，或回覆不修的理由後 resolve）。
6. **合併。** 以 squash 合併並帶最終 head SHA，避免合併到沒驗過的 head：本機 `gh pr merge <N> --squash --delete-branch --match-head-commit <SHA>`；雲端用 GitHub MCP `merge_pull_request`（`merge_method: squash`、`expectedHeadSha`）。合併前若 `master` 又前進，回到第 2 步。

PR 描述要寫明本地驗證的命令、結果與截圖位置，並註明依本文件自主合併。

## 同步與 rebase 策略

- **自己的分支、沒有他人 commit：** `git rebase origin/master`，重跑檢查後 `git push --force-with-lease`。只對自己建立的分支這樣做。
- **分支已有 merge commit，或曾有他人推送：** `git merge origin/master`，不改寫歷史。
- **他人與 Dependabot 分支：** 只用 GitHub「Update branch」（merge）同步；不推 commit，任何情況都不得對他人分支 `--force` 或 `--force-with-lease`。需要相容性修正時，依 `manage-dependabot-prs` 開人工替代 PR。
- **疊加 PR：** 必須建立在未合併 PR 上的分支，從那個分支切出，PR 描述寫「依賴 #N，請先合併」。#N squash 合併後，在自己的分支 `git rebase --onto origin/master <#N 的 head> <自己的分支>` 丟掉已合併的 commit，再 `--force-with-lease` 推送。
- 每個 PR 分支同時只推送一個待驗證的 head。修正集中在本機完成後一次推送，等 CI 結束再推下一次；不要用空 commit、關閉再開啟 PR 來重跑 CI。

## 衝突處理

- **一般文字衝突：** 保留 `master` 上較新的內容（含其他任務在共用摘要新增的條目），再把本 PR 的意圖重新套上；不要整段用自己的版本覆蓋。
- **生成檔與 lockfile：** 不手動解。`package-lock.json` 以 `npm install`（或在乾淨 `master` 上重做最小版本更新）重建；Skill 契約與 manifest 以 `npm run generate:project-skills` 重建，再跑 `npm run check:project-skills`。
- **modify/delete 衝突**（一方刪除或搬移檔案，另一方修改它）：
  1. 用 `git status` 與 `git log origin/master --diff-filter=DR -- <路徑>` 找出刪除或改名的 commit 與 PR，讀它的描述確認原因。
  2. `master` 刪除、本 PR 修改：預設接受刪除。功能搬到新位置時，把本 PR 的修改移植到新位置；功能被有意移除時，丟掉本 PR 對它的修改並在 PR 描述說明。不要讓被移除的功能復活。
  3. 本 PR 刪除、`master` 修改：檢查 `master` 的修改是否仍需要（例如修了 bug 或安全問題），需要的部分移植到取代它的程式；確認沒有遺失後才保留刪除。
  4. 無法判斷刪除是否應保留，而且牽涉使用者可見功能時，停止整合、釋放合併權並問 Ray。
- 解完衝突後重跑受影響的檢查；衝突碰到 UI 或積木時重做視覺與互動驗證。
- **防止覆蓋他人已合併的改動。** 每次同步（rebase、merge、解衝突）後、推送前，用 `git diff --stat origin/master...HEAD` 與 `git diff origin/master HEAD` 確認差異只剩本任務要的檔案與行；若出現本任務沒打算改的檔案，或 `master` 上別人新增的內容變成刪除行，就是用舊內容蓋掉了已合併的改動，回頭重解，不可推送。

## base 紅燈先修 base

多個 PR 同時在同一個 check 失敗時，先在 merge-base 的乾淨 worktree 重現。若 `master` 本身也失敗（例如 `npm audit` 有新的 high），以獨立 PR 修 base，排在佇列最前面；不要把 base 修補混進各 PR 的主要變更。其他 PR 等它合併後再同步；需要提早轉綠時，以 merge commit 把修補分支併入（不改寫他人分支歷史），在 PR 留言說明失敗不屬於該 PR，修補合併後即成為 no-op。

## 合併後

1. 在乾淨的整合 worktree（見 [並行開發工作目錄](parallel-worktrees.md)）確認 `HEAD` 等於最新 `origin/master`，且包含本 PR 的 squash commit；以 `git show --stat <squash SHA>` 核對改動檔案與 PR 的檔案清單一致，沒有夾帶還原他人改動的差異。
2. 等 `master` push 觸發的完整 CI 結束。純文件 PR 在 PR 階段略過的單元矩陣、Node 22 與 VSIX 打包會在這裡執行，必須確認成功。
3. `master` CI 失敗時，先判斷是否由本 PR 造成：是，就立即開修正 PR（或 revert 自己的 PR）並排在佇列最前面；不是，依「base 紅燈先修 base」處理。修好前不釋放後續合併。
4. 移除 `merge-lease`；遠端分支由 GitHub 自動刪除，確認後清理本地 worktree 與分支。
5. 通知重疊或疊加在本 PR 上的任務：雲端工作階段在討論串回報合併 SHA；疊加 PR 依「疊加 PR」rebase。
6. 有可重用根因時，依技能主文件更新 `lessons.md`（下一個 PR 或同一 PR 內，不直接推 `master`）。
7. 依 `pr-review-release` 的「何時發布」判斷是否需要發布：已發布功能壞掉或安全問題當下發 patch；使用者可見的新功能累積後發 minor；不進 VSIX 的改動不發。由協調者決定（見該技能的「誰決定發布」）；其他工作階段把判斷回報給協調者。

## 仍須先問 Ray

下列事項即使所有檢查都通過，也要先取得 Ray 在對話中的明確同意：

- **發布相關：** major 候選，以及沒有協調者決定的發布。patch／minor（改版號、`CHANGELOG.md` 版本區段、tag、`create-release-tag.yml`／`publish.yml`／`recover-github-release.yml`）由協調者依 `pr-review-release` 的「何時發布」與「誰決定發布」判斷執行，發布後回報 Ray。
- **移除或改變使用者可見功能，而範圍不明確時：** 例如需求只說「拿掉 X」，但 X 牽涉多個入口、設定或已存檔的工作區格式；或 modify/delete 衝突無法判斷該保留哪一方。
- **產品決策：** `NEEDS_USER_DECISION` 的 review 或 i18n finding、需求有多種合理解讀且會影響使用者行為、不相容的工作區格式變更。
- **儲存庫與帳號設定：** ruleset、required checks、secrets、GitHub App／Marketplace 身分、`release` environment、workflow 權限（`permissions:`、`id-token`）的擴大。
- **他人的 PR：** 外部貢獻者或其他工作階段開的 PR，除非該工作階段已停止且 Ray 指派接手。Dependabot PR 依 `manage-dependabot-prs` 的核准佇列。
- **不可逆或對外的操作：** 對 `master` 強制推送或改寫歷史、刪除他人分支、刪除或重建已發布的 tag 與 release；協調者決定的 patch／minor 發布除外。

問的時候說明 PR、已完成的驗證、需要決定的一件事與建議選項；等待期間釋放合併權，讓佇列中的下一個 PR 繼續。
