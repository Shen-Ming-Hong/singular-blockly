---
name: maintain-singular-blockly
description: 在 Singular Blockly 儲存庫進行寫入型維護時，先隔離任務 worktree 與分支、檢查與其他開啟中 PR 的重疊，再依變更範圍定位正式來源並選擇驗證；多個 PR 並行時依整合佇列一次合併一個，符合前置條件的非發布 PR 可自主 squash 合併。翻譯、資安、Git、發布與完整 SDD 另依其專用技能處理。
---

# 維護 Singular Blockly

先讀 `AGENTS.md`。寫入前依 [並行開發工作目錄](references/parallel-worktrees.md) 確認任務目錄、分支命名、既有變更與其他開啟中 PR 的檔案重疊；PR 依 [整合佇列與自主合併](references/merge-queue.md) 取得合併權、一次合併一個；唯讀檢查不需建立 worktree。沿實際呼叫路徑追查問題；只讀 [專案地圖](references/project-map.md) 中與本次變更相關的區段，以及 [維護經驗](references/lessons.md) 中相關的規則。遇到規格化功能，檢查對應的 `specs/` 與現行 `docs/specifications/`；不要把一般修正自動擴張成完整 SDD，但也不要把該走 SDD 的變更當成一般修正（見「動手前」第 1 步）。

## 動手前

1. **SDD 判斷（必做，寫程式前）。** 對照 `AGENTS.md`「Spec-Driven Development」的觸發清單，逐項判斷本次變更是否碰到：Extension Host 與 WebView 的訊息約定、Blockly 積木與產生器的約定、持久化的工作區格式、開發板上傳流程、managed runtime、安全邊界、重大相容性變動（重大依賴升級依實際影響判斷）。符合任何一項，先依 `AGENTS.md` 的順序跑完 Spec Kit 流程（`speckit-specify` 起）再寫程式；修 bug 也一樣，只要改到上述流程的行為。都不符合才走一般維護。判斷結果（符合哪一項、或逐項說明為何不符合）寫進 PR 描述的「SDD 判斷」段落；無法確定時視為符合，或先問 Ray。依 [SDD 分級與版本門檻](references/sdd-gate.md) 再依規模分成 No SDD、Lightweight plan、Full SDD 三級；走 Full SDD 或接續既有 SDD 前，先通過該文件的 Spec Kit 版本門檻。
2. 從入口追到寫入、產生程式碼或硬體操作的終點，查找所有共用函式的呼叫者；在共同根因處修正。
3. 分清楚貢獻者技能與產品技能：前者以 `.github/skills/` 為來源、由 `.agents/skills/` 連結；後者由 `resources/project-skills/singular-blockly/` 封裝並安裝到使用者專案。不要直接改生成或已安裝副本。
4. 沿用 `AGENTS.md` 的架構與安全規則。處理程式碼安全時使用 `security-checker`；有翻譯變更時使用 `i18n-maintenance`；範例、依賴、回饋或硬體問題使用相應專用技能。
5. 修改元件的 UI/UX（WebView 面板、對話框、選單、工具箱、捲軸、按鈕、主題配色、通知與錯誤畫面等）之前，先查看現代主流產品與網站怎麼呈現同類元件，再回來評估本站最合適的做法：
   - 至少比對兩個參考，優先找同類工具：VS Code 本身與其 Webview UI 規範、Scratch／MakeCode 等積木編輯器，再加上 Material、Fluent、Apple HIG、GitHub、Figma 等主流設計系統或產品；查實際畫面或官方文件，不憑印象。
   - 對照它們在亮色／深色主題、狀態（hover、focus、disabled、選取）、間距與互動上的共同做法，再依本站情境取捨：VS Code 主題變數與 Blockly 既有樣式優先，兒童與教學使用者需要的可讀性與點擊範圍，以及不破壞既有使用者的習慣。
   - 在 PR 描述寫下參考了哪些產品、採用或不採用的理由；之後的視覺驗證截圖要拿來對照這個結論。純文字、翻譯或不改外觀的修正不需要這一步。

## Mac 測試與使用者工作並行

- 本專案在 Mac 上測試時，預設使用背景日誌、CLI 與不搶焦點的受控驗證。即使測試需要有畫面，也保持在背景；不得呼叫 activate／focus／bring-to-front，或反覆開啟 Extension Development Host 打斷使用者操作其他程式。
- 先確認目前工具有文件支援且已實測能保持背景；`open -g` 等啟動參數不能保證子視窗不搶焦點。無法保證背景時，不啟動該測試；說明尚待驗證的項目，若必須前景操作，先告知並等使用者同意適當時段後再進行。
- **需要 Ray 親自確認的修改併進本機整合分支，由 Ray 在同一個 VS Code 視窗按 F5 確認。** 範圍依 `pr-review-release`「發布門檻」：涉及硬體行為的改動，Ray 實測通過後才開 PR；新的使用者可見介面可以先開 PR 跑 CI，但 Ray 在 F5 中確認外觀後才合併。Ray 的 Mac 主資料夾 `/Users/user/Documents/singular-blockly` 固定停在本機整合分支 `local/integration`，Ray 永遠開這個資料夾測試，多個任務的改動都在這裡一起測：
  - 每個任務仍在自己的分支開發與開 PR。需要 Ray 實測時，先看主資料夾的 `git status`；有 Ray 未提交的改動就不動，先告訴 Ray 並等 Ray 決定。乾淨時推送任務分支，在主資料夾 `git fetch` 後切到 `local/integration`（不存在就從最新 `origin/master` 建立），以 `git merge --no-ff origin/<任務分支>` 併入；不要 rebase、不要 force，也不要改寫整合分支上其他任務的 merge。
  - 衝突由該任務自行解決，並確認沒有吃掉其他任務已併入的改動；解決不了就停止、還原這次 merge（`git merge --abort`），回報 Ray。
  - 併入後依需要跑 `npm install`（依賴有變時）與 `npm run compile`，確認 F5 會載入新版本。雲端工作階段透過 Remote Control 在該資料夾執行這些命令；桌面工作階段可直接在該資料夾操作。
  - 準備好就主動通知 Ray 可以 F5 確認了，說明併入了哪個分支、要看哪些畫面（亮色／深色主題、受影響的互動）或要測哪些板子與流程；由 Ray 自己按 F5，不替 Ray 啟動 Extension Development Host。
  - Ray 回報通過後，在 PR 描述記錄 Ray 的回報（時間與內容摘要）作為「發布門檻」的外觀確認或硬體測試證據，硬體改動此時才開 PR；發現問題就在任務分支修正，再 merge 一次、再通知 Ray。
  - `local/integration` 只在本機，不推上遠端、不從它開 PR，也不在上面直接改檔。
  - 某個 PR 合併後，或整合分支累積太多已過時的 merge 時，從最新 `origin/master` 重建：先確認沒有 Ray 未提交的改動，`git switch -C local/integration origin/master`，再把仍在等測試的任務分支一個個 merge 回來，重新 compile 並告訴 Ray。
  - 不要把未提交的檔案留在 `master` 或整合分支上；測試用的改動一律先提交到任務分支再併入。
- 不得停止使用者正在工作的進程，也不得為了測試更動全域安全設定。需清理本次測試時，先確認實例屬於自己的隔離測試；使用者要求停止搶焦點操作後，立即停止相關 UI／F5 動作，並轉為背景檢查。

## 驗證與交付

- 先執行受影響範圍的測試；依 [專案地圖](references/project-map.md) 補上該變更需要的建置、契約或 i18n 檢查。開跑前寫下這次的驗證範圍與理由，拿不準時往大的範圍測。
- PR 描述的驗證結果逐項只寫「通過」「失敗」「沒驗到」三種；瀏覽器起不來、網路或權限這類工具與環境問題算「沒驗到」並寫明原因，不能當成通過。有失敗就修好再合併；有沒驗到的項目時，回報 Ray 時逐項列出。
- 在雲端容器或無螢幕環境驗證 PR、或需要 Blockly webview 截圖與拖曳互動證據時，使用 `cloud-local-verification`；不要只依賴 GitHub CI。UI/UX 變更的截圖要涵蓋亮色與深色主題及受影響的互動狀態，並對照「動手前」第 5 步選定的業界參考；同一元件在不同主題或狀態下呈現不一致（例如某主題的捲軸顏色與周圍元件不協調）就還沒完成。
- Blockly 積木、工具箱、schema 或產品 Skill 變更：執行 `npm run generate:project-skills`，檢查生成差異，再執行 `npm run check:project-skills`。
- 完成有可重用根因與實際證據的工作時，精簡更新 [維護經驗](references/lessons.md) 的現有規則；只有新規則確實影響未來決策才新增條目。
- Commit／push／PR 交給 `git-workflow`，本地審查與發布交給 `pr-review-release`。只有純介面與純軟體的改動能從開發一路自行做到合併；涉及硬體行為的改動先依「Mac 測試與使用者工作並行」讓 Ray 在本機按 F5 實測通過，才開 PR、進整合佇列；新的使用者可見介面同樣在本機讓 Ray 按 F5 確認外觀後才合併（Ray，2026-11-13）。非發布 PR 依 Ray 的常設授權，在 [整合佇列與自主合併](references/merge-queue.md) 的前置條件全部成立時自行 squash 合併，不再另外詢問；該文件「仍須先問 Ray」列出的事項仍先取得 Ray 明確同意。
- 合併後在乾淨的整合 worktree 確認 `master` 包含本次 commit，並等 `master` 的完整 CI 結束；失敗時依該文件處理，不把合併當成完成。
- 何時發布依 `pr-review-release` 的「何時發布」：以改動是否進到使用者安裝的 VSIX、使用者是否感受得到判斷 patch、累積 minor 或不用發；patch／minor 由協調者判斷並執行、發布後回報 Ray（見 `pr-review-release` 的「誰決定發布」），major 候選仍先問 Ray。新的使用者可見介面須 Ray 確認外觀、涉及硬體行為須 Ray 完成實體硬體測試，未通過前只能以預設關閉的形式合併與發布（見該技能的「發布門檻」）。
