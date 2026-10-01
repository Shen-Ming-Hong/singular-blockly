# 071 發佈方案（2026-10-01）

狀態：使用者於 2026-10-01 核准 Phase 1.5 的 v0.89.0 與雙語 CHANGELOG 方案；Phase 2 本地整合、版本更新及 Phase 3 重審已完成，以下成果納入本地提交。Phase 3.5 遠端發布尚待最終核准。

## 版本與範圍

- 已準備 **v0.89.0（minor）**：新增六種 ESP32 DevKit 實驗性 RC 接收積木，保留原有 Arduino／CyberBrick／TXT 工作區契約。
- 已 fast-forward 整合 origin/master 的七筆提交，整合基準為 f3fae46966f226eae30483b73130485d6b4c183a，包含已發布 v0.88.3 的安全依賴修正與並行 worktree 指引。
- 已執行 `npm version 0.89.0 --no-git-tag-version`；package.json、package-lock.json 兩個版本欄位與雙語 CHANGELOG 均為 0.89.0，保留 0.88.3 的依賴修正與發布紀錄。
- 原審查四項 finding 已修正，結論見 [local-review.md](./local-review.md)。除發布檔、主分支整合與必要審計資料外，不新增產品功能。
- 使用單一 PR、squash merge、annotated v0.89.0 tag，正式 VSIX 與三端發布交由 GitHub Actions。

## 已取得的證據

- 整合後使用 Node.js **24.20.0**，`npm ci` 與完整 `npm run ci:static` 均 exit 0。Skill/runtime 合約、TypeScript 編譯、webpack、三組 lint、15 語系結構驗證、i18n 21 項、release 25 項、回饋契約/typecheck、VSIX 隱私 6 項、triage Skill 4 項及 Worker 20 個檔案／152 項均通過。
- 整合後定向測試 **97 + 91 = 188 項通過**；91 項 AI 測試使用最小 VS Code API 替身，只驗證邏輯。上一輪 185 項保留為歷史，不重複加總。
- 完整語意審計實際逐批完成 19,832 組／100 批，結果 `PASS_WITH_ADVISORIES`：0 Blocker、2304 Major、2 Minor、0 Info。新增的 27 項既有翻譯待辦為 13 語系的兩個 PID tooltip 缺漏及土耳其文 AprilTag 名稱不一致；只記錄待辦，未擴張此 PR 翻譯修改。
- audit-state 的完成時間為 `2026-10-01T08:44:00.807Z`，manifest 為 `04381dba46643354fa7b825455db887b8baf2289a0881e22ba7697fda162e401`；helper 確認 `audit.required=false`、`reason=current`、`nextBatch=null`。
- 最終 `npm run validate:i18n` 為 PASS，15 語系／0 errors；`npm run release:prepare` 與 `git diff --check` 通過。本地 v0.89.0 tag 不存在。
- 本地整合重審為 **CLEAR**，沒有新增可執行 finding；簡化核對保留既有最小實作，沒有額外重構。外部 reviewer 0 輪。

整合後日誌：`/tmp/071-release-static-integrated.log`、`/tmp/071-release-contracts-integrated.log`、`/tmp/071-release-ai-integrated.log`、`/tmp/071-release-i18n-final.log`。整合前沙箱 EPERM／Node.js 25.9.0 的檢查及版本預覽只屬歷史，以上正式工具鏈結果取代發布判斷。

## 仍須完成

1. 提交以上具體成果與限制，取得 Phase 3.5 的 push／PR／squash merge／annotated tag／GitHub Actions CD 核准。目前尚未執行任何遠端發布動作。
2. 完整 `test:unit:ci`／真實 VS Code 主機測試本輪未執行：Mac 背景測試指引不允許無法保證不搶焦點的啟動，改由 PR CI 的 unit job 執行，發布前核准須明示此安排。必須確認目前 PR head 的 CI Gate 與 CodeQL 均通過後才能合併及推 tag。
3. 核准後依發布技能完成 PR、受保護分支 squash merge、annotated tag 與三端同一 VSIX 發布驗證，不在本機建立正式 VSIX。

硬體互通、燒入、同頻道 Wi-Fi 重連與真實 Copilot 整合仍未驗證；RC 維持實驗性標記與文件限制。使用者已回報 UI/UX 手測通過。

## 已套用的雙語 CHANGELOG

## [0.89.0] - 2026-10-01

### ✨ 新增功能 Features

- 新增 ESP32 DevKit 實驗性 RC 接收積木，支援 CyberBrick ESP-NOW 的六軸、四按鈕、限時等待與連線狀態；工具箱、備份預覽、15 語系及產品 Skill 合約同步支援
  Added experimental ESP32 DevKit RC receiver blocks for CyberBrick ESP-NOW, including six joystick axes, four buttons, timed connection waiting, and connection status, with toolbox, backup preview, 15 locales, and project Skill contract support

### 🐛 修復 Bug Fixes

- RC 接收拒收越界搖桿與非法按鈕封包，不更新資料或延長連線有效時間；補齊孤立積木警告，避免板型刷新清除其他警告
  RC receivers now reject out-of-range joystick values and invalid button packets without updating data or extending connection validity; orphan block warnings are preserved across board-warning refreshes
- Wi-Fi 連線積木恢復自動重連，並在 RC 與 Wi-Fi 並存時顯示初始化順序及同頻道要求
  Wi-Fi connection blocks now restore automatic reconnection, and RC/Wi-Fi coexistence warnings explain initialization order and the shared-channel requirement
- Copilot 模型初始化改在背景執行，避免阻塞一般編輯命令；停用 AI 或關閉編輯器時取消請求並隔離晚回結果
  Copilot model initialization now runs in the background without blocking ordinary editor commands; disabling AI or closing the editor cancels requests and discards late results
- 修正 RC 實驗標記在工作區載入、語言重建與飛出選單的刷新，並讓實驗提醒圖示在工具列收合時持續顯示
  Fixed RC experimental marker refreshes after workspace loading, language rebuilds, and flyout selection, and kept the experimental indicator visible when the toolbar is collapsed

### 🔧 維護 Maintenance

- 精簡貢獻者與產品 Skill 指引，補充背景測試、AI 生命週期及獨立警告 ID 的維護規則
  Simplified contributor and project Skill guidance and documented background testing, AI lifecycle handling, and independent warning IDs
