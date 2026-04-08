# 快速入門指南：鎖定函式積木 (Lock Function Block)

**Branch**: `050-lock-function-block`  
**Date**: 2026-04-08

---

## 開發環境啟動

```powershell
# 安裝依賴（若未安裝）
npm install

# 啟動 Webpack 監看模式
npm run watch

# 按 F5 在 VS Code 中啟動擴充套件除錯
```

---

## 手動測試矩陣

### 測試 A — 鎖定與解鎖基本流程

1. 新增一個 Arduino 函式積木（工具箱 → 函式）
2. 在函式 STACK 中放入一些積木
3. 對函式定義積木按右鍵 → 確認看到「鎖定積木」選項（不含其他函式不支援的積木類型）
4. 點選「鎖定積木」
5. **預期**：積木顏色變為灰色，標題前出現 🔒 圖示，右鍵選單變為「解鎖積木」
6. 嘗試點擊函式名稱 → **預期**：欄位不可編輯
7. 嘗試把積木從工作區刪除（Delete 鍵）→ **預期**：積木不被刪除
8. 嘗試拖入新積木到 STACK → **預期**：積木彈回原位
9. 嘗試拖出 STACK 中的積木 → **預期**：積木彈回 STACK
10. 拖入函式呼叫積木到 Setup/Loop → **預期**：正常執行，程式碼正確生成
11. 對鎖定積木按右鍵 → 點選「解鎖積木」
12. **預期**：顏色恢復靛藍色，🔒 消失，所有操作重新可用

### 測試 B — 持久化（存檔/重開）

1. 鎖定一個函式積木
2. Ctrl+S 儲存專案
3. 關閉並重新開啟同一個 `.json` 專案
4. **預期**：函式積木自動恢復鎖定狀態（灰色 + 🔒）

### 測試 C — Ctrl+Z 無法復原

1. 鎖定一個函式積木
2. 按 Ctrl+Z
3. **預期**：積木仍為鎖定狀態（鎖定操作不進入 undo 佇列）

### 測試 D — 複製貼上保持鎖定

1. 鎖定一個函式積木
2. Ctrl+C 複製、Ctrl+V 貼上
3. **預期**：貼上的副本亦為鎖定狀態

### 測試 E — MicroPython（CyberBrick）

1. 切換板子為 CyberBrick
2. 新增 MicroPython 函式積木（`procedures_defnoreturn` 或 `procedures_defreturn`）
3. 重複測試 A 的所有步驟
4. **預期**：行為與 Arduino 函式一致

### 測試 F — 向下相容（舊版模擬）

1. 在新版中建立含鎖定函式的專案並儲存
2. 手動開啟儲存的 `.json` 檔，確認 XML mutation 包含 `locked="1"` 屬性
3. 模擬舊版：暫時將 `domToMutation` 改為不讀取 `locked` 屬性，重開檔案
4. **預期**：工作區正常載入，積木以未鎖定狀態顯示，無任何錯誤

### 測試 G — i18n 驗證

```powershell
npm run validate:i18n
```
**預期**：0 個錯誤，`FUNCTION_LOCK_BLOCK`、`FUNCTION_UNLOCK_BLOCK` 在 15 個語系中均存在

### 測試 H — 多積木獨立鎖定

1. 新增 3 個函式積木
2. 只鎖定第 2 個
3. **預期**：第 1 和第 3 個積木不受影響，正常可編輯

### 測試 I — 右鍵選單只在函式積木顯示

1. 對非函式積木（例如 `controls_if`）按右鍵
2. **預期**：選單中不出現「鎖定積木」選項

---

## 除錯提示

- **WebView 開發工具**：在 Blockly 面板上右鍵 → 「Open Developer Tools」→ Console 檢查錯誤
- **事件日誌**：鎖定操作會透過 `log.info()` 記錄，在 VS Code Output → Singular Blockly 中可查看
- **序列化驗證**：在 Console 執行 `Blockly.serialization.workspaces.save(workspace)` 可直接查看 JSON 輸出

---

## 相關檔案

| 檔案 | 說明 |
|---|---|
| [media/blockly/blocks/functions.js](../../../media/blockly/blocks/functions.js) | 主要實作目標 |
| [media/blockly/themes/singular.js](../../../media/blockly/themes/singular.js) | 淺色主題，需新增 `locked_procedure_blocks` |
| [media/blockly/themes/singularDark.js](../../../media/blockly/themes/singularDark.js) | 深色主題，需新增 `locked_procedure_blocks` |
| `media/locales/*/messages.js` × 15 | 需新增 i18n 鍵 |
