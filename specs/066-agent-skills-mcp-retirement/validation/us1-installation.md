# US1：靜默安裝與無系統 Node.js 驗收

驗證日期：2026-08-12

## 結果

- 使用 VS Code 1.109.0，在隔離工作區與空 extension 目錄中，將 `PATH` 限制為 `/usr/bin:/bin`，使 extension 無法呼叫系統 `node`。
- 測試 harness 由絕對路徑啟動；Singular Blockly extension 本身未執行 Node.js 探測、外部 server 或子程序。
- VS Code 主程序於 `2026-08-12T04:30:20.462Z` 啟動，英文 `ready` 狀態於 `2026-08-12T04:30:24.008Z` 寫入，約 3.55 秒完成，低於 30 秒門檻。
- 自動建立 `.agents/skills/singular-blockly/` 正式來源、`.claude/skills/singular-blockly/SKILL.md` 相容入口、manifest、project notes 與 AI 狀態；沒有符號連結。
- 安裝內容 hash 與 packaged manifest 全部一致；`block-contract.json` 索引與其 19 個 category 分片均為獨立受管理檔案。
- extension activation 測試涵蓋既有 Blockly 專案、新建專案訊號、執行中新增／移除資料夾、多根 workspace 與一般專案不誤裝。
- `ProjectSkillService` 測試確認正常、失敗、唯讀／衝突及更新路徑都不呼叫一般使用者通知或確認 API；失敗只寫診斷與可寫入時的英文 AI 狀態。
- layout 契約測試確認所有受管理人類可讀 Skill 內容均為英文，且無安裝 Node.js 或設定外部 server 的指示。

## 結論

SC-001、SC-008、SC-012 與 SC-013 的產品及封裝層證據通過。隔離驗收產物位於 `/private/tmp/sb066-offline-test/workspace`，不屬於版本控制內容。
