# 研究報告：CyberBrick 範例工作區瀏覽器

**功能**: 048-cyberbrick-sample-browser
**日期**: 2026-04-04

---

## 決策 1：Node.js global `fetch` + `AbortController` 在 VS Code Extension Host 的可用性

**決定**: 使用 Node.js 22+ 內建的 global `fetch` 搭配 `AbortController` 實作 10 秒 timeout。

**理由**:

- 本專案 `package.json` 及 README 明確要求 Node.js 22.16.0+，全局 `fetch` 自 Node.js 18 起可用（Node 21 正式 unflagged），Node 22 為穩定 API。
- VS Code Extension Host 在 Node.js 環境中執行，global `fetch` 可直接使用，無需 `node-fetch` 等第三方套件。
- `AbortController` 自 Node.js 14.17.0 起可用，Node 22 完全支援。
- 現有 `src/services/` 層（例如 `micropythonUploader.ts`）未使用任何 HTTP fetch 套件，新增 HTTP 存取應維持最少依賴原則。

**考慮過的替代方案**:

- `node-fetch` npm 套件：已棄用，v3 為 ESM-only 與 CommonJS 不相容；v2 不再維護。拒絕原因：增加依賴、無附加價值。
- Node.js `https` module：callback-based 或 Promise 包裝，程式碼冗長，且無 signal/abort 支援（需手動 `req.abort()`）。拒絕原因：可讀性差，且 Node 22 global `fetch` 已為更佳方案。

**timeout 實作模式**:

```typescript
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}
```

---

## 決策 2：LocaleService 用於 Extension Host 確認對話框文字

**決定**: 使用現有 `LocaleService.getLocalizedMessage()` 取得確認對話框文字，並將新鍵值加入所有 15 個 `media/locales/*/messages.js` 檔案。

**理由**:

- `LocaleService` 在執行時解析 `media/locales/*/messages.js` 的文字內容，從 `window.languageManager.loadMessages(...)` 呼叫中萃取 key-value 對，供 Extension Host 使用——這是現有 `handleUploadRequest`、`handleSaveWorkspace` 等方法取得 UI 文字的既定模式。
- 確認按鈕文字（`SAMPLE_BROWSER_CONFIRM_YES` 等）需要隨 VS Code 語言即時切換，`LocaleService` 支援此行為，`package.nls.*.json`（僅在 extension 啟動時載入一次）無法做到。
- 現有 `messageHandler.ts` 中 `localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT')` 等用例證明此模式可行。

**考慮過的替代方案**:

- `package.nls.*.json`：extension 貢獻點的靜態翻譯機制，不適合動態 UI 文字，且需在每個 `package.nls.{lang}.json` 中維護，共 14 個額外檔案。拒絕原因：不符合現有 i18n 模式，且無法自動隨使用者語言切換。

---

## 決策 3：工作區是否有積木的偵測方式

**決定**: 在 `openSampleBrowserRequest` 訊息中，由 WebView 附帶 `hasBlocks: boolean` 旗標，Extension Host 依此決定是否顯示確認對話框。

**理由**:

- Extension Host 無法直接讀取 Blockly 工作區狀態（不在同一脈絡），必須透過 WebView 傳遞資訊。
- `blockly/main.json` 雖儲存於磁碟，但可能與目前未儲存的工作區狀態不一致（使用者做了修改但尚未存檔）。
- WebView 端可透過 `Blockly.getMainWorkspace().getAllBlocks().length > 0` 即時判斷。
- 此模式與現有 `saveWorkspace` 訊息附帶 `state` 的做法一致。

**考慮過的替代方案**:

- 讀取 `blockly/main.json` 判斷：可能與目前工作區狀態不符。拒絕原因：準確性不足。
- 始終顯示確認對話框：使用者澄清（Q4/A4）明確要求空白時跳過。拒絕。

---

## 決策 4：VS Code WebView CSP 與模態實作方式

**決定**: `sampleModal` 採用與 `backupModal`、`functionSearchModal` 完全相同的 `display: block/none` 切換模式，無需修改 CSP 設定。

**理由**:

- 現有模態（`backupModal`、`functionSearchModal`）使用 `style.display = 'block'/'none'` 切換，CSS `@keyframes modal-appear` 入場動畫，此模式在現有 CSP 環境下可正常運作。
- VS Code WebView 預設 CSP 不允許 `eval()`、外部資源（除非明確列白），但允許 inline style 操作與現有 CSS animations。
- Loading spinner 可用純 CSS `@keyframes` 實作，不需要 JavaScript 計時器或外部資源。

**考慮過的替代方案**:

- 使用第三方 UI 元件庫：需修改 CSP、增加打包複雜度。拒絕原因：過度工程化。
- VS Code native QuickPick（extension host UI）：無法展示卡片格式的豐富多媒體描述；且 QuickPick 在 Blockly 模態框架內使用者體驗較差。拒絕原因：無法滿足 FR-003 的卡片呈現需求。

---

## 決策 5：`index.json` 的 filename 欄位 vs 完整 URL

**決定**: `index.json` 中 `filename` 欄位儲存相對檔名（如 `cyberbrick-soccer-robot.json`），Extension Host 在取得時動態拼接基底 URL 或 extension 本機路徑。

**理由**:

- 使用相對檔名可讓 `index.json` 與 `SampleBrowserService` 中的路徑解析邏輯解耦。
- 雲端基底 URL（`https://raw.githubusercontent.com/Shen-Ming-Hong/singular-blockly/master/media/samples/`）與本機路徑（`path.join(extensionPath, 'media', 'samples', filename)`）均由 service 組合。
- 若未來 CDN 或資源路徑變更，只需修改 service 中的基底 URL 常數，不需更新 `index.json` 內每個條目。

**考慮過的替代方案**:

- 儲存完整 URL：`index.json` 與特定 CDN/路徑耦合，遷移成本高。拒絕原因：彈性不足。

---

## 決策 6：範例按鈕工具列圖示選擇

**決定**: 使用 Feather Icons / Lucide `book-open`（翻開的書）圖示，`stroke-width: 2`、`stroke-linecap: round`，與現有工具列按鈕設計語言一致。

**理由**:

- VS Code 及主流 IDE 慣用書本圖示代表「範例」、「教學」、「學習資源」，使用者有既定認知。
- 語意上與工具列其他按鈕清晰區隔：書本 = 範例瀏覽，不與上傳/下載/匯入/匯出等動作性圖示混淆。
- 採用 `book-open` 可為未來「匯出/匯入專案」功能（候選圖示：文件 + 箭頭）保留語意空間，兩者不會視覺衝突。

**考慮過的替代方案**:

- 文件 + 向下箭頭（`file-down`）：語意最接近「載入範例」動作，但該圖示已被識別為未來「匯入/匯出專案」功能的最佳候選，預留空間故捨棄。
- 2×2 卡片格線（`layout-grid`）：代表「瀏覽多張卡片」語意正確，但與 Blockly 積木的「格線」視覺太相近，可能造成混淆。
- 旗幟（`flag`）：語意偏向「精選/標記」，對初學者較不直覺。
