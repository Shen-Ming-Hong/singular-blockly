# 研究報告：VSCodium / Open VSX 支援與引導安裝

## 決策 1：installExtension 指令的失敗行為

**決策**：使用 `workbench.extensions.installExtension` 以 try/catch 觸發安裝，失敗時 fallback 到 pioarduino。

**依據**：
- VS Code 官方文件記載 `workbench.extensions.installExtension` 可接受 extension ID 字串參數，回傳 `Thenable<void>`。
- 在 Open VSX 環境嘗試安裝不在 Open VSX 上的 extension ID（如 `platformio.platformio-ide`）時，預期以 rejected Promise 結束。
- 實作時需以單元測試驗證確切的錯誤型別（`Error` 物件的 message 內容），以確保 catch 能正確捕捉。

**備選方案**：以 `vscode.env.uriScheme` 偵測平台（`'vscodium'` → pioarduino）。
**拒絕原因**：Firebase Studio / Google Antigravity 等 Open VSX 平台的 uriScheme 未知，且此列表未來可能持續增長；try/catch 方式不依賴已知平台列表，更加健壯。

---

## 決策 2：penv 建立時機

**決策**：penv 由 PlatformIO IDE 或 pioarduino 在首次 activation 後**自動建立**，不需要使用者手動執行編譯。provider 安裝成功後主動呼叫 `platformio-ide.showHome`，以觸發 activation 與 Core 初始化。

**依據**：
- 官方文件：「PlatformIO Core (CLI) is built into PlatformIO IDE and you will be able to use it within PlatformIO IDE Terminal.」
- 安裝腳本（`get-platformio.py`）在 extension activation 時由 `platformio-node-helpers` / `pioarduino-node-helpers` 自動呼叫。
- pioarduino 原始碼確認使用相同的安裝腳本，產生相同的 `~/.platformio/penv/` 結構。

**影響**：從規格中移除「需先執行 build」的說明；安裝後依序執行 Home／Core 初始化與既有重新載入提示，不需要加入 build 指引。

---

## 決策 3：觸發點設計

**決策**：將 provider 偵測錦定於「積木編輯器面板建立時（`webviewManager.createAndShowWebView()` 建立新面板）」。上傳路徑只顯示簡明提示訊息，不再重複觸發安裝流程。

**不同於原始設計**：原先公法是「activation-time + 多個上傳路徑」的雙層偵測。實作後改為單層結構：

| 層次 | 原始 | 實作後 |
|------|------|----------|
| 主觸發 | activation（硬性 dependency） | **積木編輯器開啟**（所有板子） |
| Arduino 上傳 | 安裝 + 重試 | 簡明提示訊息 |
| CyberBrick USB | 安裝 + 重試 | 簡明提示訊息 |
| Serial Monitor | 安裝引導 | 簡明提示訊息 |

**成果**：5 個觸發點將為 1 個，積木編輯器開啟自然成為下載完成就使用的首個入口。

**板子類型策略**：不做篩選。舊版 `extensionDependencies` 對所有板子建立相同前置環境；執行期安裝延續同一行為，只改變安裝時機。

**備選方案考慮**：「activation + 上傳路徑全部偵測」方案維護成本高，且上傳路徑的安裝重試逻輯難以測試；被拓絕。

---

## 決策 4：直接安裝與 PenvProviderService 依賴注入

**決策**：未偵測到 provider 時直接呼叫 `installExtension`，不增加自訂的前置確認通知。`PenvProviderService` 接受 `PenvProviderServiceDeps` 介面進行依賴注入，所有 VS Code API 呼叫透過此介面傳入。另新增可選的 `getMsg` 欄位，由呼叫方提供 `localeService.getLocalizedMessage` 以實現多語言失敗與重新載入提示。

**i18n 整合方案**：`createDefaultDeps(localeService?)` 接受可選的 `LocaleService`，傳入後提示文字使用當前 UI 語言顯示；未傳入時退回英文 fallback。呼叫方（`webviewManager`）傳入 `this.localeService`。

**備選方案考慮**：將所有語言字串硬編碼到服務決不够，被拓絕。

---

## 決策 5：Home 初始化與 reload 的錯誤邊界

**決策**：任一 provider 安裝成功後，等待固定命令 `platformio-ide.showHome` 完成，再顯示既有 reload 提示。Home 命令 rejected 時只記錄不含例外細節的警告，仍繼續 reload；不得將 Home 失敗當成 marketplace 安裝失敗而改裝另一個 provider。

**依據**：
- 官方 PlatformIO IDE 與 pioarduino 共用 `platformio-ide.showHome` 命令 ID。
- 執行 contributed command 會啟動 provider extension，進而進入其 Core installer。
- provider 已成功安裝時，Home 錯誤屬初始化階段，與 `installExtension` fallback 的責任不同。

---

## 決策 6：不以固定路徑輪詢宣告 Core 就緒

**決策**：provider 安裝成功後觸發 Home／Core 初始化並提示重新載入，但不輪詢固定路徑，也不宣告 Core 已就緒。實際使用時仍由 PlatformIO invocation resolver 執行 `--version` 判斷。

**依據**：
- extension 安裝成功與 PlatformIO Core 可執行是兩個不同狀態。
- 固定輪詢 `~/.platformio` 無法涵蓋 `PLATFORMIO_CORE_DIR`、Windows 非 ASCII 使用者路徑與 launcher 權限異常。

---

## 決策 7：provider setup single-flight

**決策**：`WebViewManager` 在 provider setup 期間保存同一個 Promise。重複開啟積木編輯器時不再次呼叫安裝流程；Promise fulfilled 或 rejected 後都清除狀態，讓暫時性失敗可於下次操作重試。

**依據**：積木編輯器命令可在前一次非同步安裝完成前再次觸發，VS Code 不保證替擴充功能序列化命令。若沒有 in-flight guard，即使 marketplace 合併重複下載，後續 Home 與 reload 仍可能重複執行。

**安全性考量**：unexpected rejection 只記錄固定警告，不輸出第三方例外內容或本機路徑。

---

## 決策 8：PlatformIO 啟動 fallback

**決策**：以 `{ command, prefixArgs }` 表示 PlatformIO 啟動方式，逐一實際執行 `--version`；Windows direct launcher 失敗後，改用同一 penv 的 `python.exe -m platformio`。

**候選來源順序**：

1. `platformio-ide.customPATH`
2. `PLATFORMIO_CORE_DIR`
3. Windows 系統磁碟根目錄（例如 `C:\.platformio`）
4. 預設 `~/.platformio`
5. `PATH`

**安全性考量**：不把 `.cmd` / `.bat` 當主要 fallback，避免為了執行批次檔開啟 shell；`python -m platformio` 可使用 argv 直接啟動，並能涵蓋 `pio.exe` 被 Defender、AppLocker 或權限政策阻擋的情境。

**一致性要求**：版本檢查成功後，編譯、上傳與 Arduino Serial Monitor 都沿用同一啟動描述，避免「偵測成功但實際操作仍呼叫失敗的 pio.exe」。

---

## 備選方案考慮

| 方案 | 評估 |
|------|------|
| 安裝前顯示一個或兩個確認按鈕 | 增加不必要步驟；直接安裝並自動 fallback 較符合既有共同前置行為，因此拒絕 |
| `uriScheme` 偵測平台 | 無法涵蓋所有 Open VSX 平台；被拒絕 |
| 只在上傳時觸發（不在 activation）| 對新手太晚；積木編輯器開啟時對所有板子觸發被採納 |
| 用 post-install wizard 引導 first build | 規格確認不需要（penv 自動建立）；超出範圍 |
