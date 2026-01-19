# Quickstart: Blockly Language Selector

**Feature Branch**: `030-language-selector`  
**Date**: 2026-01-19

## 快速開始

### 前置條件

1. Node.js 18+
2. npm 9+
3. VS Code 1.105.0+

### 設定開發環境

```bash
# 克隆並切換到功能分支
git checkout 030-language-selector

# 安裝依賴
npm install

# 啟動監視模式
npm run watch
```

### 偵錯

1. 按 `F5` 啟動 Extension Development Host
2. 在新視窗中開啟任意專案資料夾
3. 執行命令 `Singular Blockly: Open Blockly Edit`
4. 右鍵點擊 WebView 面板 → 選擇「Open Developer Tools」偵錯 WebView

---

## 實作順序

### Phase 1: Extension Host（2-3 小時）

1. **`src/services/settingsManager.ts`**：新增 `getLanguage()` 和 `updateLanguage()` 方法
2. **`src/webview/messageHandler.ts`**：
    - 新增 `updateLanguage` 訊息處理
    - 修改 `saveWorkspace` 移除 `theme` 欄位

### Phase 2: WebView UI（2-3 小時）

1. **`media/html/blocklyEdit.html`**：新增語言按鈕 HTML
2. **`media/css/blocklyEdit.css`**：新增下拉選單樣式
3. **`media/js/blocklyEdit.js`**：
    - 新增語言選擇器互動邏輯
    - 處理下拉選單開關
    - 呼叫 `window.languageManager.setLanguage()`

### Phase 3: i18n（1 小時）

1. 在所有 15 個 `messages.js` 檔案中新增翻譯鍵

### Phase 4: 測試（1-2 小時）

1. 新增 `settingsManager.test.ts` 單元測試
2. 手動測試 WebView UI 互動

---

## 關鍵檔案

| 檔案                              | 修改類型 | 說明                          |
| --------------------------------- | -------- | ----------------------------- |
| `src/services/settingsManager.ts` | 修改     | 新增語言設定方法              |
| `src/webview/messageHandler.ts`   | 修改     | 新增訊息處理、移除 theme 欄位 |
| `src/webview/webviewManager.ts`   | 修改     | 傳遞語言設定到 WebView        |
| `media/html/blocklyEdit.html`     | 修改     | 新增語言按鈕 HTML             |
| `media/css/blocklyEdit.css`       | 修改     | 新增下拉選單樣式              |
| `media/js/blocklyEdit.js`         | 修改     | 新增語言選擇器邏輯            |
| `media/locales/*/messages.js`     | 修改     | 新增 i18n 鍵（15 個檔案）     |

---

## 驗證清單

- [ ] 點擊語言按鈕展開下拉選單
- [ ] 選擇語言後 UI 即時切換
- [ ] 關閉重開 Blockly 後語言設定保持
- [ ] "Auto" 選項正確跟隨 VS Code 語言
- [ ] 深色主題下樣式正確
- [ ] 舊專案可以正常開啟（向後相容）
- [ ] `main.json` 中不再包含 `theme` 欄位

---

## 常見問題

### Q: 語言選擇器不出現？

A: 確認 `blocklyEdit.html` 中的 HTML 已正確加入，並檢查瀏覽器開發者工具的錯誤訊息。

### Q: 語言切換後積木沒有更新？

A: 確認 `window.languageManager.setLanguage()` 有呼叫 `Blockly.getMainWorkspace().render()`。

### Q: 設定沒有保存？

A: 檢查 `.vscode/settings.json` 是否有正確建立，以及 `SettingsManager` 是否有錯誤日誌。
