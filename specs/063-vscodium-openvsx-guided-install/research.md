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

**決策**：penv 由 PlatformIO IDE 或 pioarduino 在首次 activation 後**自動建立**，不需要使用者手動執行編譯。

**依據**：
- 官方文件：「PlatformIO Core (CLI) is built into PlatformIO IDE and you will be able to use it within PlatformIO IDE Terminal.」
- 安裝腳本（`get-platformio.py`）在 extension activation 時由 `platformio-node-helpers` / `pioarduino-node-helpers` 自動呼叫。
- pioarduino 原始碼確認使用相同的安裝腳本，產生相同的 `~/.platformio/penv/` 結構。

**影響**：從規格中移除「需先執行 build」的說明；通知訊息不需要包含此步驟指引。

---

## 決策 3：板子類型篩選邏輯

**決策**：activation-time 通知僅對 Arduino 板子顯示（非 `cyberbrick`、非 `txt`、非 `none`）。CyberBrick 等待至 USB 上傳時才觸發。

**依據**：
- CyberBrick OTA 上傳完全不依賴 penv，若對 CyberBrick 工作區顯示通知是不必要的干擾。
- `extension.ts` 的 `mainJson.board` 讀取邏輯已存在，可直接復用。
- 已知板子類型值：`'none'`（無板子）、`'cyberbrick'`（CyberBrick USB 或 OTA）、`'txt'`（TXT Controller）、其他字串（Arduino 板名，如 `esp32dev`、`uno`）。

**實作判斷**：

```typescript
function needsPenvAtActivation(board: string): boolean {
  return board !== 'none' && board !== 'cyberbrick' && board !== 'txt';
}
```

---

## 決策 4：PenvProviderService 依賴注入

**決策**：`PenvProviderService` 接受 `PenvProviderServiceDeps` 介面進行依賴注入，所有 VS Code API 呼叫透過此介面傳入。

**依據**：
- 符合憲章 Principle VIII（純函數/模組架構）。
- 在測試中可 stub `getExtension`、`executeCommand`、`showInformationMessage` 而無需 VS Code 執行環境。
- 現有 `settingsManager.ts` 的 `platformIOProviderDetector` 欄位採用類似的可測試設計（PR #91）。

---

## 決策 5：重試機制的放置層

**決策**：重試邏輯（最多 3 次、間隔 3 秒）放在 `PenvProviderService.waitForPenvReady()` 而非個別 uploader 中。

**依據**：
- 多個 uploader（arduino、micropython）都需要同樣的重試行為。
- 集中於 service 層符合 DRY 原則，減少 uploader 的複雜度。

---

## 備選方案考慮

| 方案 | 評估 |
|------|------|
| 兩個按鈕（使用者手選平台）| 對小學生不夠直覺；被拒絕 |
| `uriScheme` 偵測平台 | 無法涵蓋所有 Open VSX 平台；被拒絕 |
| 只在上傳時觸發（不在 activation）| 對新手太晚；Arduino 板採 activation 觸發被採納 |
| 用 post-install wizard 引導 first build | 規格確認不需要（penv 自動建立）；超出範圍 |
