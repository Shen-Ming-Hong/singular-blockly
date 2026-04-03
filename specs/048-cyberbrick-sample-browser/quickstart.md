# 快速上手：CyberBrick 範例工作區瀏覽器

**功能**: 048-cyberbrick-sample-browser
**日期**: 2026-04-04

---

## 一、為使用者新增範例

### 1. 建立範例工作區 JSON

在 Blockly 編輯器中設定好 CyberBrick 板，排列好積木後，從 `blockly/main.json` 複製 workspace 內容（或直接手動建立）：

```json
{
	"workspace": {
		/* Blockly 序列化狀態 */
	},
	"board": "cyberbrick"
}
```

儲存為 `media/samples/{your-id}.json`。

### 2. 更新 `media/samples/index.json`

在 `samples` 陣列中新增條目：

```json
{
	"id": "cyberbrick-your-example",
	"filename": "cyberbrick-your-example.json",
	"board": "cyberbrick",
	"title": {
		"en": "Your Example Title",
		"zh-hant": "您的範例標題"
	},
	"description": {
		"en": "Short description of this example.",
		"zh-hant": "此範例的簡短說明。"
	}
}
```

### 3. 部署

將兩個檔案 commit 並 push 至 `master` 分支，使用者下次開啟範例瀏覽器（有網路時）即可看到新範例。**無需發布新版 extension。**

---

## 二、開發環境設定

```powershell
cd e:\singular-blockly
npm install
npm run watch   # webpack watch mode
```

F5 啟動 Extension Development Host，選擇 CyberBrick 板，點擊工具列「範例」按鈕測試。

---

## 三、執行單元測試

```powershell
npm test
```

測試 `SampleBrowserService` 的 fetch + fallback + validation 邏輯：

```powershell
# 僅執行 sampleBrowserService 相關測試
# 在 src/test/suite/services/sampleBrowserService.test.ts 中加入 describe.only 後執行
npm test
```

---

## 四、手動測試清單（WebView — 按規格 VII UI Testing Exception 條款）

### P1 — 正常載入流程（需要網路）

1. 選擇 CyberBrick 板 → 確認工具列出現「範例」按鈕（有 tooltip）
2. 點擊「範例」按鈕 → 模態立即開啟，顯示 loading spinner
3. spinner 消失後，出現至少一張範例卡片（標題、描述、「載入」按鈕）
4. 工作區有積木時點擊「載入」→ 出現確認對話框
5. 確認 → 工作區積木被替換，板子維持 CyberBrick，模態關閉

### P2 — 離線 fallback

1. 斷開網路或封鎖 `raw.githubusercontent.com`
2. 點擊「範例」按鈕 → 模態開啟（等待約 10 秒 timeout 後或立即，端看 DNS 快取）
3. 出現離線提示橫幅，範例卡片仍顯示
4. 選取範例並確認 → 工作區正常替換

### P3 — 板子切換

1. 選 Arduino（uno/esp32 等）→ 工具列無「範例」按鈕
2. 切換至 CyberBrick → 「範例」按鈕立即出現
3. 切換回 Arduino → 按鈕立即消失

### P5 — 空白工作區

1. 清空工作區（或開啟新工作區）→ 點擊「範例」→ 點卡片「載入」
2. 確認**不顯示**確認對話框，直接載入範例

---

## 五、新增 i18n 鍵值的位置

`media/locales/{lang}/messages.js` — 在現有鍵值後追加（勿破壞 JS 物件格式）：

```javascript
// Sample Browser
SAMPLE_BROWSER_BUTTON_TITLE: 'Load Sample',
SAMPLE_BROWSER_TITLE: 'CyberBrick Samples',
SAMPLE_BROWSER_LOADING: 'Loading samples...',
SAMPLE_BROWSER_OFFLINE_NOTICE: 'Using built-in samples (offline)',
SAMPLE_BROWSER_LOAD_BUTTON: 'Load',
SAMPLE_BROWSER_EMPTY: 'No samples available',
SAMPLE_BROWSER_CONFIRM_LOAD: 'This will replace your current workspace. Continue?',
SAMPLE_BROWSER_CONFIRM_YES: 'Load Sample',
SAMPLE_BROWSER_CONFIRM_NO: 'Cancel',
SAMPLE_BROWSER_ERROR_INVALID: 'Invalid sample format, cannot load',
```

執行 `npm run validate:i18n` 確認所有 15 語系完整。
