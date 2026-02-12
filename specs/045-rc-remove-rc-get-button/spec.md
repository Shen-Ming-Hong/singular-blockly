# 移除 RC 積木選單中多餘的 `rc_get_button` 積木

**Feature Branch**: `specs/045-rc-remove-rc-get-button`
**Created**: 2026-02-12
**Status**: Draft
**Input**: 使用者敘述："從 RC toolbox 中移除 rc_get_button 條目（不要刪除 block 或 i18n 鍵，只從 toolbox 隱藏該條目）"

## 問題描述 (Problem Statement)

在 CyberBrick RC（以下簡稱 RC）toolbox 中，同一功能出現兩個按鈕狀態相關的積木：
- `rc_is_button_pressed`（Boolean，帶問號） — 應保留
- `rc_get_button`（Number，返回 0=按下、1=放開） — 與 X12 等其他模組不一致，且造成使用者混淆，應從 toolbox 隱藏

目標：保留 block 定義與 i18n 鍵，僅從 RC 的 toolbox JSON 中移除/隱藏 `rc_get_button` 條目，並重新生成 block-dictionary 以反映 toolbox 的變更。

## 背景 (Background)

- X12 的 toolbox 只保留 `x12_is_button_pressed`，未在 toolbox 顯示 `x12_get_button`，RC 應與其行為一致。
- 必須保留 block 定義與生成器（generator）程式碼，以確保向後相容，避免破壞已使用該積木的現有專案。

來源引用：
- 來自 session plan.md 的摘錄（參考檔案：C:\Users\User\.copilot\session-state\d2a4dc5f-c17e-4750-be39-33677e10e147\plan.md）:
  - 引用段落（來源行或摘錄）:
    "從 RC toolbox 中移除 `rc_get_button` 的條目。保留 block definition 和 generator 程式碼（以免破壞已使用該積木的現有專案），只從選單中隱藏。最後重新生成 block-dictionary.json." (plan.md 摘錄)

- 來自 .github agent 範本（用於格式與必填欄位）: E:\singular-blockly\.github\agents\speckit.specify.agent.md

## 修改範圍 (Scope)

包含：
- 更新 `media/toolbox/categories/cyberbrick_rc.json`，移除 `rc_get_button` 的 toolbox 條目（僅隱藏，不刪除 block 定義或 i18n 鍵）
- 重新執行字典/生成流程：`npm run generate:dictionary`（或相應的專案命令）以更新 `src/mcp/block-dictionary.json` 的內容
- 更新相關文件/說明（若有）以反映 toolbox 的差異

不包含（Non-goals）：
- 不會刪除 `media/blockly/blocks/rc.js` 中的 block 定義
- 不會刪除 `media/blockly/generators/micropython/rc.js` 中的 generator
- 不會移除或修改任何 i18n 翻譯鍵

## 實作方案 (Implementation Plan)

步驟：
1. 在本分支建立變更草案：
   - 編輯 `media/toolbox/categories/cyberbrick_rc.json`，移除代表 `rc_get_button` 的條目（或註解/停用該條目）
   - 儲存變更至本地分支 `specs/045-rc-remove-rc-get-button`

2. 重新生成 block-dictionary：
   - 執行 `npm run generate:dictionary`（或等價步驟），確認 `src/mcp/block-dictionary.json` 已反映 toolbox 中的變更

3. 測試：
   - 在開發環境中啟動應用或載入本地 assets，檢查 RC toolbox 是否不再顯示 `rc_get_button`
   - 確認使用到 `rc_get_button` 的既有專案仍能正常執行（block definition 與 generator 未被刪除）

4. 文件與發布：
   - 更新變更日誌（如需要）與內部說明
   - 規劃在合併後觸發的自動流程（例如 CI 生成字典）

## 相依項目 (Dependencies)

- `media/toolbox/categories/cyberbrick_rc.json` 的修改權限
- `npm run generate:dictionary`（或相等的 generate 指令）能在 CI/本地正確執行
- 測試環境能載入本地 toolbox 變更以驗證 UI

## 接受準則 (Acceptance Criteria)

- AC-1: RC 的 toolbox 不再顯示 `rc_get_button` 條目（可在 UI 中驗證）
- AC-2: `media/blockly/blocks/rc.js` 與 generators 的 `rc_get_button` 定義仍存在且未被修改
- AC-3: `src/mcp/block-dictionary.json` 在執行生成流程後，不包含 toolbox 層級的 `rc_get_button` 條目（若字典包含 toolbox 映射）
- AC-4: 既有使用 `rc_get_button` 的專案在載入時不會因為本次變更而發生 runtime error

## 回退計畫 (Rollback Plan)

- 若變更導致問題，使用 git revert 或切換回先前的 main/master 分支並重置 `media/toolbox/categories/cyberbrick_rc.json` 到先前版本。
- 若字典生成有問題，可恢復到先前的 `src/mcp/block-dictionary.json` 並重新評估生成流程。

## 測試要點 (Testing Notes)

- 驗證 UI: 在瀏覽器或開發環境中載入新的 assets，開啟 RC 分類，確認 `rc_get_button` 條目已隱藏
- 回歸測試：打開一個包含 `rc_get_button` 的現有範例專案（.sbp 或專案資料），確認生成的代碼仍正確且程式可執行
- 自動化測試（若適用）：檢查 block-dictionary.json 的差異，並加入一項 CI 驗證步驟，確保字典生成成功且未遺漏必需資料

## 國際化影響 (i18n keys)

- 明確：不要刪除 i18n 翻譯鍵（例如 `RC_GET_BUTTON_*`）。本次變更僅隱藏 toolbox 中的條目，翻譯鍵需保留以維持向後相容。

## 向後相容說明 (Backward compatibility)

- 保留 block 定義與 generator，現有專案仍能繼續使用 `rc_get_button`，僅在 toolbox UI 中不再顯示
- 建議在變更說明中標註：此為 UI 層隱藏，非移除

## Tasks list

- [ ] 編輯 `media/toolbox/categories/cyberbrick_rc.json`，移除/註解 `rc_get_button` 條目
- [ ] 執行 `npm run generate:dictionary`，確認字典更新
- [ ] 本地 UI 檢查與回歸測試
- [ ] 更新說明/變更記錄

## 引用來源 (References)

- Session plan.md (C:\Users\User\.copilot\session-state\d2a4dc5f-c17e-4750-be39-33677e10e147\plan.md): "從 RC toolbox 中移除 `rc_get_button` 的條目。保留 block definition 和 generator 程式碼（以免破壞已使用該積木的現有專案），只從選單中隱藏。最後重新生成 block-dictionary.json." (摘錄)
- speckit.specify.agent.md (E:\singular-blockly\.github\agents\speckit.specify.agent.md): 用於遵循的 spec 格式與必填欄位

---

(此規格檔遵循 .github agent 中的範本欄位要求；如需調整格式或加入更多 user story 與測試場景，請回覆說明。)