# 人工 UI／無障礙驗收記錄

**日期**：2026-08-26
**版本**：0.88.0，branch `codex/070-user-feedback`
**狀態**：T184 工具列鍵盤／主題／窄寬度／200% zoom 矩陣與 workspaceState 關閉重開矩陣均已完成

## 已由自動化契約覆蓋

- [x] Webview 所有表單控制項具有 label／fieldset／legend 或 ARIA 語意。
- [x] 動態使用者與伺服器文字以 `textContent` 顯示，不使用 HTML injection。
- [x] 表單開啟不發出網路請求；預覽與確認 digest 綁定同一份 payload。
- [x] 截圖提供選擇、預覽、移除與替代文字，並在本機重新編碼。
- [x] CSS 使用 VS Code theme token，並保留 visible focus 與 forced-colors 規則。
- [x] `npm run test:unit:ci`：0.88.0 最終全量重跑 1363 passing、1 pending；feedback、screenshot、Marketplace、workflow 封裝與高對比 contracts 全數通過。

## 2026-08-20 Development Host 實機結果

- [x] 在隔離設定的 VS Code 1.109.0 Extension Development Host，從 Command Palette 開啟 `Singular Blockly: Provide Feedback`；表單開啟與取消期間沒有送出回饋。
- [x] 僅用鍵盤依序走過類型、四個文字欄位、基本 diagnostics、近期事件、截圖、預覽與政策連結；兩個開關可切換並還原預設。
- [x] 鍵盤填入非敏感測試內容後進入預覽；完整 payload 只含 allowlist diagnostics，返回後保留內容並將焦點帶回表單標題。
- [x] 使用公開 `images/icon.png` 測試截圖：本機重編碼後不顯示原始檔名／路徑，AX tree 有替代文字，`Remove screenshot` 可全鍵盤操作。
- [x] 在 Dark、Light Modern、Dark High Contrast、Light High Contrast 逐一檢查文字、邊框、warning、focus 與 disabled/button 對比。
- [x] 在約 200% workbench zoom 與隱藏兩側欄的窄編輯器檢查：導覽改為垂直、長文字換行、主要內容與動作可到達；依此新增 `border-box`／`min-width: 0` regression contract。
- [x] 「我的回饋」全新安裝空狀態在本機直接顯示，沒有 reporter credential 或網路 request；依此隱藏不適用的 delete-all 危險區。
- [x] macOS accessibility tree 可辨識導覽、標題、欄位、開關狀態、圖片替代文字、預覽 payload 與動態 heading focus。

## 2026-08-20 入口與語音驗收範圍調整（入口外觀於 2026-08-21 被取代）

- [x] 實機確認通用編輯器標題列會同時出現其他擴充套件操作；只有圖示的「提供回饋」辨識度不足，依產品負責人回饋移除此入口。
- [x] 當時 SDD 曾要求 Blockly 自有控制區顯示完整文字標籤；2026-08-21 產品負責人改採有獨立顏色、圖示、tooltip 與 ARIA 名稱的圓形入口，Command Palette 與 `Help: Report Issue…` 原生入口維持不變。
- [x] 產品負責人確認不需要 VoiceOver／NVDA 實際語音朗讀驗收；發布 gate 保留鍵盤、HTML/ARIA 語意、焦點、高對比與 200% zoom。
- [x] 舊版長方形入口曾在 Extension Development Host 以滑鼠與鍵盤空白鍵驗證可開啟同一個受限表單，且未送出回報；新版圓形入口另列於下方待驗證項目。
- [x] 舊版在約 200% workbench zoom 下可自動換成兩列且沒有水平內容遺失；新版工具列分組與收合狀態另列於下方待驗證項目。

## 仍須人工執行

- [x] 在新的 Development Host 專案驗證工具列預設收合；展開後回饋按鈕為獨立藍色圓形圖示，鍵盤 focus 與可存取樹皆能辨識「提供回饋」。
- [x] 分別以收合與展開狀態關閉／重開 Blockly panel 與重新開啟同一專案，確認最後狀態從專案 `workspaceState` 恢復；另一個尚無偏好的專案仍預設收合。（2026-08-26 由產品負責人人工確認通過。）
- [x] 展開工具列後，確認次要操作、常用操作與最右側 toggle 之間的圓形按鈕水平間距一致，不因功能群組交界出現黏合或額外空隙。
- [x] 收合後只保留開發板選擇、備份、上傳、Monitor 與最右側展開按鈕；CyberBrick 操作集合正確，重新展開後可存取名稱與順序正確。
- [x] 在 Light、Dark、Light High Contrast、Dark High Contrast、620px 窄寬度與約 200% workbench zoom 驗證工具列無水平遺失、按鈕可達且焦點順序與視覺順序一致；窄寬度與 200% zoom 會自動換列並保持一致間距。
- [x] production 服務以無敏感內容的 synthetic reporter 完成 My Feedback create/list/detail/message replay/delete/delete-all 與 recovery portal；最終測試資料、公開測試 Issue 與 pending outbox 已清除。

## 2026-08-26 T184 最終工具列矩陣

- [x] 初始 AX tree 只包含開發板、備份、上傳、Monitor 與「顯示更多操作」；展開後依序包含「提供回饋」、語言、主題、搜尋、重新整理、範例、設定、三個常用操作與「顯示較少操作」。
- [x] Light Modern、Dark Modern、Default High Contrast 與 Default High Contrast Light 的文字、圖示、圓形背景與焦點邊界均可辨識，功能不只以顏色表達。
- [x] 620px 視窗的展開工具列自動換為兩列；約 200% workbench zoom 下換為三組可讀列，沒有工具列水平捲動或裁切。
- [x] 鍵盤巡覽依 DOM／視覺順序從開發板進入次要操作、常用操作及最右側 toggle；各控制項的可存取名稱與實際動作一致。
- [x] 驗收沒有開啟回饋表單、沒有送出回饋，也沒有讀寫 production 使用者資料。
- [x] Computer Use 在鍵盤巡覽期間開啟語言原生選單後留下無法關閉的 AX overlay，因此本輪停止於既有證據且未反覆重試；2026-08-26 由產品負責人另行完成人工 workspaceState 關閉重開矩陣。

## 本次工具限制記錄

Computer Use 最初連線逾時一次，之後成功取得 Development Host 畫面與 accessibility tree。所有入口與表單測試都沒有送出回報。VoiceOver 曾為確認既有設定而短暫開啟，已確認恢復為關閉；依產品決策，實際語音朗讀不再是 feature 070 的 release blocker。後端 list/detail/delete 流程已另以 production synthetic reporter 完成並清除測試資料。
