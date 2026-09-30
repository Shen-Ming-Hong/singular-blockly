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
