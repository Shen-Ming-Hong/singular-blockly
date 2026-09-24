---
name: maintain-singular-blockly
description: 維護或除錯 Singular Blockly 擴充套件時，依變更範圍定位 Extension Host、Blockly WebView、板型上傳、受管理 Runtime、範例或專案 Skill 的正式來源，並選擇對應驗證。適用於跨檔案的產品維護；翻譯、資安、Git、發布與完整 SDD 另依其專用技能處理。
---

# 維護 Singular Blockly

先讀 `AGENTS.md`，確認目前 Git 狀態與使用者變更。沿實際呼叫路徑追查問題；只讀 [專案地圖](references/project-map.md) 中與本次變更相關的區段，以及 [維護經驗](references/lessons.md) 中相關的規則。遇到規格化功能，檢查對應的 `specs/` 與現行 `docs/specifications/`；不要把一般修正自動擴張成完整 SDD。

## 動手前

1. 從入口追到寫入、產生程式碼或硬體操作的終點，查找所有共用函式的呼叫者；在共同根因處修正。
2. 分清楚貢獻者技能與產品技能：前者以 `.github/skills/` 為來源、由 `.agents/skills/` 連結；後者由 `resources/project-skills/singular-blockly/` 封裝並安裝到使用者專案。不要直接改生成或已安裝副本。
3. 沿用 `AGENTS.md` 的架構與安全規則。處理程式碼安全時使用 `security-checker`；有翻譯變更時使用 `i18n-maintenance`；範例、依賴、回饋或硬體問題使用相應專用技能。

## 驗證與交付

- 先執行受影響範圍的測試；依 [專案地圖](references/project-map.md) 補上該變更需要的建置、契約或 i18n 檢查。不要把未執行的檢查寫成通過。
- Blockly 積木、工具箱、schema 或產品 Skill 變更：執行 `npm run generate:project-skills`，檢查生成差異，再執行 `npm run check:project-skills`。
- 完成有可重用根因與實際證據的工作時，精簡更新 [維護經驗](references/lessons.md) 的現有規則；只有新規則確實影響未來決策才新增條目。
- Commit／push／PR 交給 `git-workflow`，審查／合併／發布交給 `pr-review-release`；依使用者本次要求及既有授權決定是否進入那些流程。本技能不另寫一套 Git 或發布步驟。
