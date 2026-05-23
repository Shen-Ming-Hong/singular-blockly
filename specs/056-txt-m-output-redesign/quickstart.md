# 快速啟動指南：TXT M 系列輸出重設計

本文件用於 implementation 完成後的快速驗證，確認 `specs/056-txt-m-output-redesign` 定義的作者模型、衝突警告與相容行為都已落地。

## 前置條件

1. 已在工作區根目錄安裝依賴：
   - `npm install`
2. 已使用 VS Code 啟動擴充功能開發宿主，或至少可執行既有測試命令。
3. 已準備 TXT 工作區或可在 WebView 中切換到 TXT board。

## 建議驗證命令

```text
npm run compile
npm run lint
npm run validate:i18n
npm test
```

若後續任務把 TXT 相關測試拆成更聚焦的 suite，可先跑聚焦測試，再補跑完整 `npm test`。

## 手動驗證 1：M 系列設定積木的元件切換

1. 開啟 Blockly 編輯畫面，切換到 TXT board。
2. 從 TXT toolbox 拖出 M 系列設定積木。
3. 確認預設元件類型為 `MOTOR`。
4. 確認 `MOTOR` 模式會顯示：
   - M 埠選單
   - 元件選單
   - 方向欄位
   - 0~512 的輸出值欄位
5. 將元件切換為 `LAMP`。
6. 確認此時：
   - 方向欄位消失
   - 數值欄位仍為 0~512
   - UI 文案改為亮度語意
7. 切回 `MOTOR`，確認方向欄位會回來，且 block 不會壞掉或遺失主要欄位。

## 手動驗證 2：停止積木語意

1. 從 TXT toolbox 拖出 M 系列停止積木。
2. 確認積木固定顯示「停止輸出」。
3. 確認它只要求選擇 `M1~M4`，不要求再選元件類型。
4. 確認切換 workspace 其他 block 的元件類型，不會改變停止積木文案。

## 手動驗證 3：舊工作區相容

1. 載入一份不含 `COMPONENT` 欄位的舊版 TXT workspace fixture。
2. 確認舊的 `txt_motor_speed` 能正常出現，不會成為壞積木。
3. 確認其預設行為為 `MOTOR`，且方向欄位可見。
4. 儲存 workspace 後，再重新載入一次，確認 `COMPONENT` 已以新版格式穩定保存。

## 手動驗證 4：同一 M 埠不同元件衝突

1. 在同一 workspace 中放兩個 M 設定積木。
2. 都選 `M1`，但一個設為 `MOTOR`、另一個設為 `LAMP`。
3. 確認會出現明確 warning。
4. 嘗試 TXT 上傳／執行或匯出／程式碼輸出。
5. 確認系統會阻擋，而不是照常繼續。
6. 將兩個積木改成相同元件類型或刪除其一。
7. 確認 warning 消失，TXT 上傳／執行流程與匯出／程式碼輸出入口可恢復。

## 手動驗證 5：只有真實共腳位才警告

### Case A：應該警告

1. 放置一個使用 `M1` 的 M 設定積木。
2. 再放置 `O1` 或 `O2` 的輸出積木。
3. 確認出現 shared-pin warning。
4. 嘗試 TXT 上傳／執行或匯出／程式碼輸出，確認會被阻擋。

### Case B：不應警告

1. 放置一個使用 `M1` 的 M 設定積木。
2. 再放置 `O3`、`O4`、`O5`、`O6`、`O7` 或 `O8` 的輸出積木。
3. 確認不出現 M/O shared-pin warning。
4. 確認 TXT 上傳／執行流程與匯出／程式碼輸出入口不會因這組積木而被阻擋。

## 手動驗證 6：`txt_stop_all` 與 O 系列回歸

1. 保持 `txt_output` 的既有作者模型不變。
2. 放置 `txt_stop_all`。
3. 確認它的公開文案與行為沒有因本功能被重新命名或拆分。
4. 若產生程式碼，確認 `txt_stop_all` 仍同時關閉所有 M 與 O。

## 手動驗證 7：未來 M 元件 metadata 檢查

1. 檢查 `media/js/txtMOutputValidation.js` 中的 `M_COMPONENTS` metadata。
2. 確認每個 component 都宣告：顯示文字 key、是否需要方向欄位、數值文案、generator mode 與 shared-pin policy。
3. 若未來新增 M 元件，應先新增 metadata 與測試，再決定是否需要新的 generator mode。
4. 不應為新元件建立新的公開設定／停止 block type；應沿用 `txt_motor_speed` 與 `txt_motor_stop` 的 M 埠句型。
5. 新元件若仍使用同一個 M 埠硬體腳位，應沿用既有同 M 埠 component conflict 與 M/O shared-pin conflict 規則。

## 自動化驗證重點

### 本次 focused tests 執行紀錄

- 2026-05-23：`npm run compile-tests && npx mocha --ui tdd out/test/suite/txtMOutputValidation.test.js out/test/suite/txtMOutputSharedPins.test.js out/test/suite/txtMOutputPreflight.test.js out/test/suite/txtMOutputBlockUi.test.js out/test/suite/txtMOutputMetadata.test.js out/test/suite/txtMOutputI18n.test.js out/test/suite/txtToolbox.test.js out/test/suite/txtWorkspaceFixtures.test.js out/test/suite/txt-multi-flow-generation.test.js`
- 結果：40 passing（涵蓋 validation、shared-pin、preflight、UI、metadata、i18n、toolbox、fixtures 與 generator regression）。
- 2026-05-23：`npm run compile-tests && npx mocha --ui tdd out/test/suite/txtToolbox.test.js out/test/suite/txtMOutputMetadata.test.js`
- 結果：6 passing（補驗 toolbox 與 MCP block dictionary template 會為 `txt_motor_speed` 的 `SPEED` 放入預設數字 512）。
- 2026-05-23：`npm run compile-tests && npx mocha --ui tdd out/test/suite/txtMOutputBlockUi.test.js out/test/suite/txtToolbox.test.js`
- 結果：7 passing（補驗 `txt_motor_speed` dynamic shape 會為 `SPEED` 放入可替換的 `math_number(512)` shadow）。
- 2026-05-23：headless Blockly 建立 `txt_motor_speed`，確認 `SPEED` 會自動接上 `math_number` shadow，`NUM = 512`，且 input check 維持 `Number`。
- 2026-05-23：`npm run compile-tests && npx mocha --ui tdd out/test/suite/txtMOutputBlockUi.test.js out/test/suite/txtToolbox.test.js`
- 結果：9 passing（補驗 dynamic shape 重建時不會把 toolbox/flyout 的 shadow 數字當成真實積木重接，且 flyout dropdown validator 不再排程延遲重建，避免輸出 M 積木在 toolbox 中變成空槽）。

### 本次收尾驗證紀錄

- 2026-05-23：`npm run validate:i18n` → PASS，14/14 非英文語系 0 errors（既有 length warnings 保留）。
- 2026-05-23：`npm run generate:dictionary` → PASS，`src/mcp/block-dictionary.json` 已包含 `txt_motor_speed` 的 `COMPONENT` metadata 與 `txt_motor_stop` 的 generic stop metadata。
- 2026-05-23：`npm run compile` → PASS。
- 2026-05-23：`npm run lint` → PASS。
- 2026-05-23：`npm test` → PASS，741 passing / 1 pending。

### Manual matrix review note

- 2026-05-23：本次在 headless 測試環境完成 manual matrix 的 source/contract 對照；未連接實體 TXT Controller，也未在 VS Code WebView 進行人工點擊流程。
- 手動驗證 1~7 的步驟已對應到 focused tests 與 source contracts，未發現需要修正文案或步驟的不準確處。

完成 implementation 後，至少應有以下測試覆蓋：

- `MOTOR` / `LAMP` 的 block shape 差異
- 舊 workspace 缺少 `COMPONENT` 時預設為 `MOTOR`
- `LAMP` 模式不顯示方向欄位
- 同埠不同元件會產生 blocking conflict
- 只有實際共腳位的 M/O 組合才會觸發 blocking conflict
- `txt_motor_stop` 維持「停止輸出」且不依賴元件推論
- 15 語系新增 key 通過 `npm run validate:i18n`
- metadata-driven 設計可支援未來 M 元件，不需要新增 lamp-specific 或其他元件專用 public block type

## 驗收完成條件

當以下條件全部成立，即可視為本功能達到 plan 階段預期：

- 編譯、lint、i18n 驗證都通過
- TXT 相關自動化測試通過
- `MOTOR` / `LAMP` 兩種模式在 UI 與 generator 上都正確
- 真實 shared-pin conflict 會 warning + blocking
- 不相關 O 埠不會誤判
- 舊工作區可正常載入且預設為 `MOTOR`
- 停止積木固定顯示「停止輸出」
