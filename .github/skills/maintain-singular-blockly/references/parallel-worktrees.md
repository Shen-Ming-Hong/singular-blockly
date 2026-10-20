# 並行開發工作目錄

一個進行中的寫入任務使用一個專屬 Git worktree 與功能分支；不同任務可以同時開發，不共用工作目錄或暫存區。唯讀調查不必建立 worktree。此規則只管理任務隔離；commit、PR 與發布仍依 `git-workflow`、`pr-review-release` 及使用者授權。

## 開始或恢復任務

1. 檢查 `git worktree list --porcelain`、`git status --short --branch`、目前分支與 diff，確認目錄歸屬。延續同一任務就使用原有 worktree；如果目前目錄有另一任務的未提交變更，保留原狀，在新目錄處理本次工作。不要用 `stash`、`reset`、強制 checkout 或切分支搬移別人的工作。
2. 新任務先取得最新 `origin/master`，再建立唯一的 `codex/<任務名稱>` 分支與 worktree。優先使用環境提供的受管理 worktree；若它以 detached HEAD 建立，在該 worktree 建立新分支。一般 Git 環境可使用 `git fetch origin` 與 `git worktree add -b codex/<任務名稱> <任務目錄> origin/master`。若無法 fetch，先查明本地基準的新舊程度並說明，不把過期基準當作最新。
3. 開始編輯前報告本任務的絕對目錄與分支。所有檔案讀寫、建置、測試與 Git 命令都指定此目錄；恢復任務及提交前以 `git rev-parse --show-toplevel`、`git branch --show-current` 和 `git status --short --branch` 再確認。不要因為對話仍在同一儲存庫，就假設目前 shell 位於任務 worktree。
4. 使用者明確要求處理另一分支上尚未提交的內容時，先確認那個目錄的所有權與寫入者；同一目錄同時只允許一個寫入者。新 worktree 不會帶入未提交檔案，不要偷偷複製、提交或遺失它們。

## 整合並行工作

- 開始時辨識是否與其他任務共用 WebView／Extension Host 訊息、Blockly 積木與產生器、工作區格式、上傳流程、Skill 契約或版本檔。共用契約由一個分支先整合，其他分支再接入；文字上沒有衝突仍要驗證共同行為。
- 各分支只修改自己的檔案與 Git refs。worktree 隔離原始碼和 `dist/`、`out/`、`coverage/` 等目錄，不隔離硬體裝置、服務埠或外部帳號；同時測試時避開共用可寫資源。各 worktree 各自安裝相依套件，不共用可寫的 `node_modules`。
- macOS 上深路徑 worktree 執行 `npm run test:unit:ci` 時，VS Code 的 IPC socket 可能超過路徑長度限制。依 `.vscode-test.mjs` 設定 `VSCODE_TEST_TEMP_DIR` 為短且每任務獨立的暫存目錄，例如 `/private/tmp/sb-<任務名稱>`；不要讓兩個測試共用該目錄。
- 分支可暫時落後 `master` 繼續開發。輪到該 PR 整合或基準差異會影響正確性時，才在**自己的** worktree 更新基準、處理衝突並重跑受影響檢查；不要為了另一個 PR 前進而改寫所有進行中分支。最終 PR、CI、合併與發布仍遵守 `pr-review-release`。
- 發布流程需要確認最新 `master` 或建立 tag 時，使用乾淨且專屬的整合 worktree。若 `master` 已在其他目錄 checkout，就從最新 `origin/master` 建立 detached 整合 worktree，將 `pr-review-release` 中的 `git switch master`／`git merge --ff-only` 改為在此目錄確認 `HEAD` 等於 `origin/master`；不要切換其他任務的分支。完成後只清理已確認無未提交變更、無活躍任務的 worktree；保留其他分支與獨有內容。

## 多個 PR 並行時的整合順序

參考 SINGULAR Academy 的 merge lease 與 ComputerCraftEdu-Modern「雲端工作階段的 PR」規則。本專案沒有租約檔；GitHub 上的開啟 PR 清單就是整合佇列，一次只整合一個。

1. **開工與開 PR 前先看佇列。** 列出所有開啟中的 PR（含 Dependabot），比對改動檔案與 CI 狀態。下列共用檔案同時被兩個 PR 修改時，視為重疊，先決定順序再動手：`package.json`／`package-lock.json`、`resources/project-skills/` 的生成契約與 manifest、`.github/workflows/`、版本檔與 `CHANGELOG.md`、`media/locales/`、`references/lessons.md` 等共用摘要。共用摘要只改本任務直接相關的條目，減少文字衝突。
2. **base 紅燈先修 base。** 多個 PR 同時在同一個 check 失敗時，先在 merge-base 的乾淨 worktree 重現；若 `master` 本身也失敗（例如 `npm audit` 有新的 high），以獨立 PR 修 base，並排在佇列最前面。其他 PR 等它合併後再同步；需要提早轉綠時，以 merge commit 把修補分支併入（不改寫他人分支歷史），在 PR 留言說明失敗不屬於該 PR，修補合併後即成為 no-op。
3. **疊加 PR 要寫明依賴。** 必須建立在未合併修補上的分支（例如依賴群組需要先有 audit 修補），從修補分支切出，PR 描述寫「依賴 #N，請先合併」。前一個 PR squash 合併後，在自己的分支 rebase 到新的 `origin/master`，丟掉已合併的 commit，再用 `--force-with-lease` 推送；只對自己建立的分支這樣做。
4. **一次只合併一個。** 每合併一個 PR：下一個 PR 先同步最新 `master`（自己的分支 rebase 或 merge；他人與 Dependabot 分支用 GitHub「Update branch」的 merge），重跑受影響的本地檢查，等目前 head 的 CI Gate 與 CodeQL 都完成，再以 squash 合併並帶 `expectedHeadSha`，避免合併到沒驗過的 head。Git 沒有文字衝突不代表行為相容；同步進來的變更碰到本 PR 驗過的程式時，重跑對應的視覺或互動驗證。
5. **生成檔與 lockfile 不手動解衝突。** 以 `npm install`（或在乾淨 `master` 上重做最小版本更新）重建 `package-lock.json`，以 `npm run generate:project-skills` 重建 Skill 契約與 manifest，再跑 `check:project-skills`。
6. **Dependabot 與他人分支。** 不推 commit 到 Dependabot 分支；需要相容性修正時，依 `manage-dependabot-prs` 開人工替代 PR，合併後關閉原 PR 並留下替代連結。只需要同步 base 時用「Update branch」。他人分支只做同步或使用者明確交辦的修正，不強制推送。
7. **雲端工作階段的分支。** 雲端工作階段只能推送系統指定的 `claude/…` 分支。使用者要求一次處理多個 PR 時，額外的 PR 使用 `<指定分支>-<主題>`（例如 `-security`、`-deps`），並在回覆中列出分支與 PR 的對應。已合併的 PR 不再沿用；後續修正從最新 `master` 重建分支並開新 PR。
8. **合併需要使用者核准。** 本專案沒有常設合併授權：提出合併順序與每個 PR 的驗證結果，取得使用者核准後依序合併；核准涵蓋該次列出的 PR 與順序，不延伸到發布、tag 或之後新增的 PR。版本發布仍走 `pr-review-release`。
9. **本地驗證的並行。** 每個 worktree 各自 `npm ci`；`.vscode-test/` 的 VS Code 執行檔可複製共用，但 user-data 與 `VSCODE_TEST_TEMP_DIR` 要每任務獨立。同時跑多個 VS Code 測試時都用 `xvfb-run -a` 取得不同的 display；容器 CPU 有限時，單元測試與視覺驗證錯開執行，詳見 `cloud-local-verification`。
