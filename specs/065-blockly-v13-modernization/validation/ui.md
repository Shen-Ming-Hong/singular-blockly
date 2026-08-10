# Blockly 13 UI 驗收矩陣

**日期**：2026-08-09  
**狀態**：自動契約通過；人工視覺矩陣待 UI 控制授權。

自動契約已驗證 Thrasos renderer、Modern theme、本地 media URI、app-owned 搜尋／實驗標記 class、明暗色焦點、無效輸入與 forced-colors CSS，相關測試 6/6 通過。

| 模式 | Editor | Preview | 狀態 |
|---|---|---|---|
| 明亮 | 待人工觀察 | 待人工觀察 | 未執行 |
| 深色 | 待人工觀察 | 待人工觀察 | 未執行 |
| VS Code 高對比 | 待人工觀察 | 待人工觀察 | 未執行 |
| 斷網 | 待人工觀察 | 待人工觀察 | 封裝契約通過，GUI 未執行 |

Computer Use 可讀取 VS Code Insiders，但操作開啟專案／按鍵時遭權限拒絕。T035 保持未勾選，避免把靜態 CSS 契約誤當成人工視覺驗收。
