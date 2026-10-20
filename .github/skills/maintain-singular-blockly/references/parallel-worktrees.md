# 並行開發工作目錄

一個進行中的寫入任務使用一個專屬 Git worktree 與功能分支；不同任務（Codex、Claude Code 桌面或雲端工作階段）可以同時開發，不共用工作目錄或暫存區。唯讀調查不必建立 worktree。本文件管理任務隔離與開工協調；PR 的整合順序、合併前置條件與自主合併依 [整合佇列與自主合併](merge-queue.md)，commit 與發布依 `git-workflow`、`pr-review-release`。

設計參考 Ray 其他專案的維護技能：SINGULAR Academy 的「一個對話一個 worktree」與單一 merge lease，以及 ComputerCraftEdu-Modern 的「開工前檢查重疊」「共用摘要整合時才更新」與「雲端工作階段的 PR」。

## 分支與 worktree 命名

| 執行環境 | 分支 | worktree 目錄 |
| --- | --- | --- |
| Codex（本機或雲端） | `codex/<任務名稱>` | `../singular-blockly-<任務名稱>` |
| Claude Code 桌面 App | `claude/<任務名稱>` | `../singular-blockly-<任務名稱>` |
| Claude Code 雲端工作階段（claude.ai 專案討論串、Claude Code on the web） | 系統指定的 `claude/…` 分支；同一工作階段要開第二個 PR 時用 `<指定分支>-<主題>`（例如 `-security`、`-deps`） | 容器內的 clone 就是本任務專屬目錄；同時處理多個 PR 時，其他 PR 另建 `git worktree` |
| Spec Kit 功能 | 沿用 Spec Kit 產生的 `NNN-feature-name` | 同上 |
| Dependabot | `dependabot/…`（只由 Dependabot 推送） | 驗證時另建 detached worktree |

- `<任務名稱>` 用小寫英文與連字號，描述功能而非人名或日期，例如 `merge-queue-rules`、`esp32-servo-fix`。
- 分支名稱在所有開啟中的 PR 與遠端分支中唯一；建立前先看 `git branch -r`。
- 已合併的 PR 分支不再沿用。後續修正從最新 `origin/master` 重建（雲端工作階段沿用同一個指定分支名稱，`git checkout -B <分支> origin/master`），開新 PR。

## 開始或恢復任務

1. 檢查 `git worktree list --porcelain`、`git status --short --branch`、目前分支與 diff，確認目錄歸屬。延續同一任務就使用原有 worktree；如果目前目錄有另一任務的未提交變更，保留原狀，在新目錄處理本次工作。不要用 `stash`、`reset`、強制 checkout 或切分支搬移別人的工作。
2. 新任務先取得最新 `origin/master`，再依上表建立唯一分支與 worktree。優先使用環境提供的受管理 worktree；若它以 detached HEAD 建立，在該 worktree 建立新分支。一般 Git 環境可使用 `git fetch origin` 與 `git worktree add -b codex/<任務名稱> <任務目錄> origin/master`。若無法 fetch，先查明本地基準的新舊程度並說明，不把過期基準當作最新。
3. 開始編輯前報告本任務的絕對目錄與分支。所有檔案讀寫、建置、測試與 Git 命令都指定此目錄；恢復任務及提交前以 `git rev-parse --show-toplevel`、`git branch --show-current` 和 `git status --short --branch` 再確認。不要因為對話仍在同一儲存庫，就假設目前 shell 位於任務 worktree。
4. 使用者明確要求處理另一分支上尚未提交的內容時，先確認那個目錄的所有權與寫入者；同一目錄同時只允許一個寫入者。新 worktree 不會帶入未提交檔案，不要偷偷複製、提交或遺失它們。

## 開工前檢查重疊

開始修改前，以及開 PR 前各做一次：

1. 列出所有開啟中的 PR（含 Dependabot 與草稿）與其改動檔案、CI 狀態：本機用 `gh pr list --state open --json number,title,headRefName,isDraft` 與 `gh pr diff <N> --name-only`；雲端工作階段沒有 `gh`，用 GitHub MCP 的 `list_pull_requests` 與 `pull_request_read`（`get_files`）。另看 `git branch -r` 是否有尚未開 PR 的進行中分支。
2. 對照本任務預計改動的檔案。下列共用契約同時被兩個任務修改時，視為**重疊**：
   - `package.json`／`package-lock.json`、`.nvmrc`、工具鏈與依賴版本。
   - Extension Host ↔ WebView 的 `postMessage` 訊息格式、`src/webview/` 的訊息處理。
   - Blockly 積木定義、Arduino／MicroPython 產生器、`media/toolbox/`，以及 `resources/project-skills/` 的生成契約與 manifest。
   - 工作區儲存格式（`blockly/main.json`、schema）、上傳流程（`ArduinoUploader`、`MicropythonUploader`）。
   - `.github/workflows/`、ruleset 相關文件、版本檔與 `CHANGELOG.md`。
   - `media/locales/`、`package.nls*.json`。
   - 共用摘要：`AGENTS.md`、`references/lessons.md`、`references/project-map.md`、本技能的 references。
3. 有重疊時先決定順序再動手：修改共用契約的一方拆成獨立的先行 PR、排在佇列前面；依賴它的任務從先行分支切出（依 [整合佇列與自主合併](merge-queue.md) 的「疊加 PR」）或等它合併後再開始改同一處。雲端工作階段之間以討論串訊息對齊順序與完成通知；不要改別人的分支。
4. Git 沒有文字衝突不代表行為相容。重疊但不衝突的兩個 PR，後合併的一方仍要在同步後重跑共同行為的驗證。

## 分支內的紀錄

- 分支只改本任務直接相關的檔案。共用摘要（`AGENTS.md`、`lessons.md`、`project-map.md`、`CHANGELOG.md` 的 `[未發布]`）只新增或修改本任務直接相關的條目，不順手整理其他段落，減少文字衝突。
- 任務證據（截圖、測試輸出）放在 PR 描述或專案共用資料夾，不提交到儲存庫，除非規格要求。
- 生成檔（Skill 契約、manifest、lockfile）不手寫；整合時一律以生成命令重建，見 [整合佇列與自主合併](merge-queue.md) 的衝突處理。

## 並行時的共用資源

- 各分支只修改自己的檔案與 Git refs。worktree 隔離原始碼和 `dist/`、`out/`、`coverage/` 等目錄，不隔離硬體裝置、服務埠或外部帳號；同時測試時避開共用可寫資源（同一塊開發板、同一個序列埠、同一個 VS Code user-data）。
- 每個 worktree 各自 `npm ci`，不共用可寫的 `node_modules`。`.vscode-test/` 的 VS Code 執行檔可複製共用，但 user-data 與 `VSCODE_TEST_TEMP_DIR` 要每任務獨立。
- macOS 上深路徑 worktree 執行 `npm run test:unit:ci` 時，VS Code 的 IPC socket 可能超過路徑長度限制。依 `.vscode-test.mjs` 設定 `VSCODE_TEST_TEMP_DIR` 為短且每任務獨立的暫存目錄，例如 `/private/tmp/sb-<任務名稱>`；不要讓兩個測試共用該目錄。
- 同時跑多個 VS Code 測試時都用 `xvfb-run -a` 取得不同的 display；容器 CPU 有限時，單元測試與視覺驗證錯開執行，詳見 `cloud-local-verification`。
- 硬體上傳測試同一時間只有一個任務使用同一塊板子；開始前確認沒有其他任務的上傳或序列監看程序。

## 落後 master 時

分支可暫時落後 `master` 繼續開發。**沒有輪到整合的 PR 不追 `master`**：其他 PR 合併、GitHub 顯示 behind 時，不要每個等待中的分支都同步、推送、重跑 CI。只有輪到該 PR 整合、或基準差異會影響正確性（例如要用到剛合併的 API）時，才在**自己的** worktree 同步一次並重跑受影響檢查。

## 整合與清理用的 worktree

- 合併後驗證、發布確認或建立 tag 需要最新 `master` 時，使用乾淨且專屬的整合 worktree。若 `master` 已在其他目錄 checkout，就從最新 `origin/master` 建立 detached 整合 worktree，將 `pr-review-release` 中的 `git switch master`／`git merge --ff-only` 改為在此目錄確認 `HEAD` 等於 `origin/master`；不要切換其他任務的分支。
- 完成後只清理已確認無未提交變更、無活躍任務的 worktree；保留其他分支與獨有內容。`git branch` 顯示 `+` 只代表分支仍掛在某個 worktree，不足以判定任務仍活躍。
