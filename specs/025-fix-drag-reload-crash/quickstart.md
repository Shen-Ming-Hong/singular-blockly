# Quickstart: 修復拖曳時 FileWatcher 重載崩潰問題

**Date**: 2026-01-03  
**Feature**: 025-fix-drag-reload-crash

## 快速上手

本指南說明如何驗證此功能修復是否正確運作。

---

## 1. 開發環境設定

```powershell
# 進入專案目錄
cd e:\singular-blockly

# 安裝依賴
npm install

# 啟動 watch 模式
npm run watch
```

按 F5 啟動 Extension Development Host 進行除錯。

---

## 2. 重現問題（修復前）

1. 開啟任意 Blockly 專案
2. 從 Toolbox 拖放約 10-15 個積木到工作區
3. 選取所有積木並按 Ctrl+C 複製
4. 按 Ctrl+V 貼上
5. **立即**開始拖曳貼上的積木群組
6. 嘗試將積木連接到另一個區塊
7. 觀察：當連接預覽（InsertionMarker）顯示時，可能發生崩潰

**預期問題行為**:

-   積木消失
-   滑鼠被鎖定在「抓著積木」狀態
-   Console 顯示錯誤：`Error: Block not present in workspace's list of top-most blocks`

---

## 3. 驗證修復（修復後）

### 3.1 測試拖曳保護

1. 開啟 Blockly 專案
2. 複製並貼上大量積木
3. 開始拖曳積木
4. **同時**：手動修改 `blockly/main.json` 檔案以觸發 FileWatcher
5. 完成拖曳連接操作

**預期行為**:

-   ✅ 拖曳操作正常完成
-   ✅ 無崩潰發生
-   ✅ 拖曳結束後工作區自動同步 FileWatcher 的變更

### 3.2 測試剪貼簿鎖定

1. 複製大量積木 (20+)
2. 按 Ctrl+V 貼上
3. 觀察 Console 日誌

**預期行為**:

-   ✅ 看到「剪貼簿操作鎖定中，跳過保存」的日誌
-   ✅ 貼上完成後約 300ms，自動儲存觸發

### 3.3 測試 Variable API 更新

1. 開啟 Console (F12)
2. 搜尋「deprecated」或「getAllVariables was deprecated」

**預期行為**:

-   ✅ 無 Variable API 棄用警告

---

## 4. 手動測試清單

| #   | 測試案例                | 步驟                          | 預期結果               |
| --- | ----------------------- | ----------------------------- | ---------------------- |
| 1   | 拖曳中 FileWatcher 觸發 | 拖曳積木 + 外部修改 main.json | 無崩潰，拖曳結束後同步 |
| 2   | 大量積木貼上            | Ctrl+V 貼上 20+ 積木          | 無不完整儲存           |
| 3   | 快速連續貼上            | 連續按 Ctrl+V 5 次            | 所有積木正確建立並儲存 |
| 4   | 拖曳取消                | 拖曳中按 ESC                  | 無崩潰，滑鼠不鎖定     |
| 5   | Variable API            | 建立/刪除變數                 | Console 無棄用警告     |

---

## 5. 關鍵程式碼位置

| 功能               | 檔案                                | 行號範圍   |
| ------------------ | ----------------------------------- | ---------- |
| 拖曳狀態追蹤       | `media/js/blocklyEdit.js`           | ~1488-1560 |
| 自動儲存邏輯       | `media/js/blocklyEdit.js`           | ~1445-1475 |
| loadWorkspace 處理 | `media/js/blocklyEdit.js`           | ~2118-2230 |
| Variable API 呼叫  | `media/blockly/blocks/functions.js` | ~148       |

---

## 6. 除錯提示

### 啟用詳細日誌

在 `blocklyEdit.js` 中，所有狀態變更都會透過 `log.info()` 記錄：

```javascript
log.info('跳過保存：正在拖曳');
log.info('跳過保存：剪貼簿操作鎖定中');
log.info('FileWatcher 重載請求已暫存，等待拖曳結束');
log.info('拖曳結束，執行待處理的 FileWatcher 重載');
```

### WebView DevTools

1. 在 Extension Development Host 中右鍵點擊 Blockly 面板
2. 選擇「Open Developer Tools」
3. 檢視 Console 輸出

---

## 7. 常見問題

### Q: 修改後的 debounce 時間會影響響應速度嗎？

A: 150ms → 300ms 的增加對使用者感知影響微乎其微。300ms 仍遠低於人類可感知的延遲閾值（~500ms），但足以讓 Blockly 內部狀態穩定。

### Q: 如何確認 FileWatcher 重載被正確延遲？

A: 在拖曳期間觸發 FileWatcher（手動修改 main.json），Console 會顯示：

```
FileWatcher 重載請求已暫存，等待拖曳結束
```

拖曳結束後會顯示：

```
拖曳結束，執行待處理的 FileWatcher 重載
```
