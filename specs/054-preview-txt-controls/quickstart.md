# Quickstart：TXT 預覽虛擬控制畫布

**功能分支**：`054-preview-txt-controls`  
**適用對象**：開發者、測試者、reviewer

---

## 前置條件

- 使用 VS Code 1.105.0+
- 工作區已開啟 `singular-blockly`
- 已完成 npm 依賴安裝
- 手邊至少準備以下其中一種資料：
  - 含 `txtVirtualControls` 的 TXT 備份
  - 舊版 TXT 備份（沒有 `txtVirtualControls`）
  - 人工製造部分損壞的 TXT 備份
  - 含最多 50 個虛擬控制按鈕的代表性 TXT 備份（用於效能 smoke 驗證）

---

## 本機啟動

在 repo root 啟動開發建置：

```text
npm run watch
```

若只需要一次性建置：

```text
npm run compile
```

若有新增 preview 文案或 warning key，請驗證 i18n：

```text
npm run validate:i18n
```

---

## 建議的自動化驗證

本功能完成後，至少執行：

```text
npm run compile
npm run lint
npm run validate:i18n
npm test
```

### 建議重點關注測試

- `src/test/webviewPreview.test.ts`
- 與 `webviewManager.ts` / `previewMessages.ts` 對應的載入與型別測試

> 本 quickstart 只列出建議驗證步驟；以上命令是否已執行，以實際工作階段紀錄為準。

### 本次實作驗證紀錄

| 項目 | 結果 | 備註 |
|------|------|------|
| `npm run compile` | PASS | Webpack extension 與 MCP server 皆 compiled successfully |
| `npm run lint` | PASS | `eslint src` 無錯誤輸出 |
| `npm run validate:i18n` | PASS | 14/14 非英文語系 0 errors；既有 warnings 保留 |
| `npm test` | PASS | 695 passing, 1 pending；新增 WebView Preview 與 FileWatcher TXT restore 回歸測試通過 |
| Manual WebView QA | PASS | 2026-05-22 使用者回報已完成 quickstart 手動驗證；效能 smoke 未記載估測秒數 |

---

## 最小功能驗證流程

### 1. 預覽含有虛擬控制的 TXT 備份

1. 開啟一份含有 `txtVirtualControls` 的 TXT 備份
2. 觸發 backup preview
3. 確認畫面同時出現：
   - Blockly 唯讀工作區
   - TXT 虛擬控制唯讀畫布

**預期結果**：

- 可看到已保存的按鈕名稱、位置、尺寸與顏色
- Preview 不會變成第二個 editor

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：有效 TXT 備份 preview 可同時顯示 Blockly 唯讀工作區與 TXT 虛擬控制唯讀畫布。

---

### 2. 驗證唯讀邊界

1. 嘗試拖曳虛擬按鈕
2. 嘗試重新命名、改色、新增、刪除
3. 嘗試做任何會改變內容的互動

**預期結果**：

- 以上互動都被阻止
- 不會送出保存或執行相關訊息
- Blockly 工作區仍維持既有 preview 的平移 / 縮放能力
- 畫面有明確 preview badge、唯讀文案或不可編輯游標 / 提示，讓 reviewer 能判斷這不是編輯模式

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：虛擬控制內容維持唯讀，未產生保存或 runtime 相關操作。

---

### 3. 驗證左右佔比與捲動

1. 將虛擬控制畫布與 Blockly 預覽區的左右比例調窄 / 調寬
2. 若畫布超出可視範圍，進行唯讀捲動
3. 關閉 preview 後重新開啟同一份備份

**預期結果**：

- 佔比調整只改變當前視窗檢視
- 虛擬按鈕位置不會改變
- 畫布捲動只改變檢視範圍，不改變控制項位置或保存內容
- 重開 preview 後回到預設比例與預設捲動位置

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：splitter 與 canvas scroll 僅改變檢視，不改變控制項位置或保存內容。

---

### 4. 驗證舊備份降級

1. 開啟一份沒有 `txtVirtualControls` 的舊版 TXT 備份

**預期結果**：

- Preview 仍成功開啟
- 保留虛擬控制面板
- 畫布顯示明確空狀態訊息

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：舊版或缺少 `txtVirtualControls` 的 TXT 備份可正常 preview 並顯示空狀態。

---

### 5. 驗證部分損壞資料降級

1. 開啟一份部分虛擬控制資料損壞的 TXT 備份
2. 觀察畫布與 warning 區

**預期結果**：

- 可恢復的控制項仍會顯示
- 無法還原的部分會出現 warning 或 placeholder
- Preview 不會整體失效

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：部分損壞資料可降級處理，可恢復內容仍能顯示並提供 warning。

---

### 6. 驗證非 TXT 預覽無回歸

1. 開啟 Arduino 或 CyberBrick 備份 preview

**預期結果**：

- 既有 preview 行為不改變
- 不會錯誤顯示、啟用或佔用 TXT 虛擬控制面板版面
- 若 HTML template 靜態包含 TXT panel DOM，非 TXT preview 中該 DOM 應維持 hidden / inert / `aria-hidden`

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：非 TXT 備份 preview 未顯示或啟用 TXT 虛擬控制面板。

---

### 7. 驗證唯讀辨識與可近性

1. 由至少 2 位 reviewer 在不查看實作細節的情況下觀察 TXT preview
2. 檢查 preview badge、唯讀文案、不可編輯游標 / 提示是否足以表達「只能檢視」
3. 檢查 splitter 是否有可理解的 aria 說明
4. 檢查 warning 區域是否能被螢幕閱讀器語意讀取（例如使用 role、aria-live 或等效語意）

**預期結果**：

- 2 位 reviewer 都能判定此畫面是唯讀 preview，而不是第二個 editor
- Splitter 的用途是調整檢視比例，而不是改變保存內容
- Warning / 空狀態訊息具備可讀語意，不只依賴顏色或圖示

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：唯讀辨識與可近性檢查已完成，preview 可被辨識為不可編輯檢視。

---

### 8. 驗證效能 smoke

1. 開啟一份含最多 50 個虛擬控制按鈕的代表性 TXT 備份
2. 從收到 / 觸發 `loadWorkspaceState` 後觀察虛擬控制畫布出現時間
3. 確認 preview 沒有啟動 TXT runtime、輪詢或長時間背景工作

**預期結果**：

- 目標是在 1 秒內看到虛擬控制畫布
- 若目前環境無法可靠計時，需記錄作業系統、硬體 / VS Code 環境與觀察結果
- 效能驗證不得要求寫回任何 workspace、backup 或使用者設定

**手動驗證紀錄**：PASS（2026-05-22 使用者回報已完成）：代表性 TXT 備份效能 smoke 已完成；未提供精確載入時間，因此不記載估測數字。

---

## 建議的回歸清單

在 feature 完成前，至少再次確認以下項目：

1. `setBoard` → `loadWorkspaceState` 的 preview 時序未回歸
2. 非 TXT preview 仍可正常載入
3. 主題切換與語言切換仍同步到 preview
4. `npm run validate:i18n` 通過
5. `webviewPreview.test.ts` 新增案例通過
6. Canvas overflow scroll 與 splitter session state 不會寫回備份
7. 唯讀辨識與可近性檢查通過
8. 代表性 50 控制項備份的效能 smoke 結果已記錄

---

## 驗收順序建議

```text
Message Contract → Host Normalization → Readonly Presenter → Empty/Partial Fallback → Splitter / Scroll Session State → Accessibility → Regression
```

這個順序能先把最容易破壞 preview 載入的契約與資料降級做好，再處理互動與視覺細節。
