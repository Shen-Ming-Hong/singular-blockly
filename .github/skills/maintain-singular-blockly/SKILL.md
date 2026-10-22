---
name: maintain-singular-blockly
description: 在 Singular Blockly 儲存庫進行寫入型維護時，先隔離任務 worktree 與分支、檢查與其他開啟中 PR 的重疊，再依變更範圍定位正式來源並選擇驗證；多個 PR 並行時依整合佇列一次合併一個，符合前置條件的非發布 PR 可自主 squash 合併。翻譯、資安、Git、發布與完整 SDD 另依其專用技能處理。
---

# 維護 Singular Blockly

先讀 `AGENTS.md`。寫入前依 [並行開發工作目錄](references/parallel-worktrees.md) 確認任務目錄、分支命名、既有變更與其他開啟中 PR 的檔案重疊；PR 依 [整合佇列與自主合併](references/merge-queue.md) 取得合併權、一次合併一個；唯讀檢查不需建立 worktree。沿實際呼叫路徑追查問題；只讀 [專案地圖](references/project-map.md) 中與本次變更相關的區段，以及 [維護經驗](references/lessons.md) 中相關的規則。遇到規格化功能，檢查對應的 `specs/` 與現行 `docs/specifications/`；不要把一般修正自動擴張成完整 SDD。

## 動手前

1. 從入口追到寫入、產生程式碼或硬體操作的終點，查找所有共用函式的呼叫者；在共同根因處修正。
2. 分清楚貢獻者技能與產品技能：前者以 `.github/skills/` 為來源、由 `.agents/skills/` 連結；後者由 `resources/project-skills/singular-blockly/` 封裝並安裝到使用者專案。不要直接改生成或已安裝副本。
3. 沿用 `AGENTS.md` 的架構與安全規則。處理程式碼安全時使用 `security-checker`；有翻譯變更時使用 `i18n-maintenance`；範例、依賴、回饋或硬體問題使用相應專用技能。

## Mac 測試與使用者工作並行

- 本專案在 Mac 上測試時，預設使用背景日誌、CLI 與不搶焦點的受控驗證。即使測試需要有畫面，也保持在背景；不得呼叫 activate／focus／bring-to-front，或反覆開啟 Extension Development Host 打斷使用者操作其他程式。
- 先確認目前工具有文件支援且已實測能保持背景；`open -g` 等啟動參數不能保證子視窗不搶焦點。無法保證背景時，不啟動該測試；說明尚待驗證的項目，若必須前景操作，先告知並等使用者同意適當時段後再進行。
- 不得停止使用者正在工作的進程，也不得為了測試更動全域安全設定。需清理本次測試時，先確認實例屬於自己的隔離測試；使用者要求停止搶焦點操作後，立即停止相關 UI／F5 動作，並轉為背景檢查。

## 驗證與交付

- 先執行受影響範圍的測試；依 [專案地圖](references/project-map.md) 補上該變更需要的建置、契約或 i18n 檢查。不要把未執行的檢查寫成通過。
- 在雲端容器或無螢幕環境驗證 PR、或需要 Blockly webview 截圖與拖曳互動證據時，使用 `cloud-local-verification`；不要只依賴 GitHub CI。
- Blockly 積木、工具箱、schema 或產品 Skill 變更：執行 `npm run generate:project-skills`，檢查生成差異，再執行 `npm run check:project-skills`。
- 完成有可重用根因與實際證據的工作時，精簡更新 [維護經驗](references/lessons.md) 的現有規則；只有新規則確實影響未來決策才新增條目。
- Commit／push／PR 交給 `git-workflow`，本地審查與發布交給 `pr-review-release`。非發布 PR 依 Ray 的常設授權，在 [整合佇列與自主合併](references/merge-queue.md) 的前置條件全部成立時自行 squash 合併，不再另外詢問；該文件「仍須先問 Ray」列出的事項仍先取得 Ray 明確同意。
- 合併後在乾淨的整合 worktree 確認 `master` 包含本次 commit，並等 `master` 的完整 CI 結束；失敗時依該文件處理，不把合併當成完成。
- 何時發布依 `pr-review-release` 的「何時發布」：以改動是否進到使用者安裝的 VSIX、使用者是否感受得到判斷 patch、累積 minor 或不用發；patch／minor 由協調者判斷並執行、發布後回報 Ray（見 `pr-review-release` 的「誰決定發布」），major 候選仍先問 Ray。新的使用者可見介面須 Ray 確認外觀、涉及硬體行為須 Ray 完成實體硬體測試，未通過前只能以預設關閉的形式合併與發布（見該技能的「發布門檻」）。
