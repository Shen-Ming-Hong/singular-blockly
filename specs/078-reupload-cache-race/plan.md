# 實作計畫：上傳途中改積木時，快速重新上傳不再燒錯程式

**輸入**：[spec.md](./spec.md)；反例來源 `specs/tla/upload-build-cache/`

## 摘要

上傳期間把編輯器送來的程式更新延後到上傳結束才寫入，讓 `src/` 在一次上傳中保持不變；完整建置後再算一次指紋，不同就不寫建置紀錄。修正後的 TLA+ 模型以 TLC 驗證三條性質成立。

## 技術背景

- Extension Host：TypeScript 6、Mocha／Sinon 測試，`@vscode/test-electron`。
- `WebViewMessageHandler.handleMessage` 對每則訊息各自 `await`，但 VS Code 的 `onDidReceiveMessage` 不會等前一則處理完，所以 `updateCode` 與 `requestUpload` 會交錯執行。
- 快取模組 `ArduinoBuildCache` 與上傳流程 `ArduinoUploader.upload()` 來自 spec 077。

## 憲章檢查

- 架構：只改 Extension Host 的訊息處理順序與上傳器；WebView 與訊息格式不變（通過）。
- 檔案 I/O 仍經 `FileService`；記錄用 `log()`（通過）。
- 測試：每條反例對應一個會在舊寫法下失敗的測試（通過）。
- 不改持久化格式，不需 migration（通過）。

## 設計

### 1. 程式寫入的序列化（`src/webview/messageHandler.ts`）

- 新增 `uploadInProgress`（布林）、`deferredCodeUpdate`（最新一份 `updateCode` 訊息或 `undefined`）、`codeWriteTail`（Promise，串起所有程式寫入）。
- `handleUpdateCode(message)`：
  - 上傳中：只記下 `deferredCodeUpdate = message`，記一行 log，回傳。
  - 否則：把實際寫入（原本的內容，移到 `writeCodeUpdate`）接在 `codeWriteTail` 後面執行並等待。
- `handleRequestUpload`：一進來就同步設 `uploadInProgress = true`，然後 `await this.codeWriteTail`（FR-002），再走原本的流程；`finally` 中清除旗標，若有 `deferredCodeUpdate` 就取出並交給 `handleUpdateCode`（FR-001）。
- TXT 的 `txtUpload` 不在範圍（`src/main.py` 不參與 PlatformIO 快取）。

### 2. 建置後重算指紋（`src/services/arduinoUploader.ts`）

- `runCompileAndUpload` 在完整建置成功（或到達燒錄）後、`markBuilt` 前，再呼叫一次 `computeBuildInputs()`；`buildKey` 或 `prepareKey` 與建置前不同時，不呼叫 `markBuilt`／`recordDevice`，並記一行 log（FR-003）。

### 3. TLA+ 模型（`specs/tla/upload-build-cache/`）

- `AutoSave` 在 `pc # "idle"` 時只更新 `pending`，上傳回到 `idle` 時寫入（新動作 `FlushDeferred`）。
- 新增 `ExternalEdit`（有界）代表擴充功能看不到的改檔，`MarkBuilt` 前比對重算的指紋。
- `expected.txt` 三條改為 `holds`；README 改寫成修正後的描述，保留舊反例的說明作為歷史。

## 驗證

- `bash specs/tla/run-tlc.sh upload-build-cache`：三條 `holds`。
- 單元測試：`src/test/messageHandler.test.ts`（延後寫入、只寫最後一份、失敗後仍寫入、上傳等待進行中的寫入）、`src/test/services/arduinoUploader*.test.ts`（編譯期間指紋改變就不記錄）。每條先在舊寫法上確認會失敗。
- 型別檢查、ESLint、受影響的測試檔、`npm run compile`。
- 不改 WebView 外觀，不需截圖；依驗證分層，上傳流程以 API 層測試為主。

## 回退

單一 commit，可直接 revert；快取檔格式不變，回退後舊紀錄仍可讀。
