# 功能規格：VSCodium / Open VSX 支援與引導安裝

**功能分支**：`063-vscodium-openvsx-guided-install`

**建立日期**：2026-06-30

**狀態**：草稿

## 澄清記錄

### 階段 2026-06-30

- Q：未安裝 provider 時是否要先顯示確認按鈕？ → **不需要**。每次建立積木編輯器面板時只偵測 provider extension 是否安裝（不檢查 penv）；若未安裝就直接啟動自動安裝，不另外顯示前置確認通知。penv 缺失只在上傳時報告。
- Q：兩個 extension 都安裝失敗時的後備方案？ → 開啟 Extensions 面板搜尋，搜尋結果需同時涵蓋 PlatformIO IDE 和 pioarduino，通知訊息文字也需明確提及兩者名稱。
- Q：provider 的正確偵測點？ → 在積木編輯器面板建立時只偵測 provider extension 安裝狀態；penv 由 provider extension 在首次啟動時自動建立（下載 PlatformIO Core），**不需要使用者手動執行第一次編譯**。「安裝後需先執行 build」的假設已確認為錯誤。
- Q：是否根據板子類型篩選 provider 安裝？ → **否**。舊版以 `extensionDependencies` 要求所有使用者先安裝 PlatformIO；移除硬依賴後，積木編輯器對所有板子沿用相同的 provider 安裝前置，以維持既有環境模型。
- Q：上傳時 provider 已安裝但 Core 仍在初始化（race condition）應如何處理？ → 實際探測所有可信候選；本次操作都不可執行時顯示初始化中或診斷指引，不在背景長時間輪詢固定路徑。
- Q：如何判斷 PlatformIO Core 可用？ → 不以檔案存在作為成功條件；必須實際執行 `--version`。Windows 的 `pio.exe` 無法執行時，繼續嘗試同一 penv 的 `python.exe -m platformio`，並讓編譯、上傳與監控沿用成功的啟動方式。

### 階段 2026-08-07

- Q：provider 安裝完成後如何立即啟動 Core 初始化？ → 官方 PlatformIO IDE 與 pioarduino 安裝成功後都呼叫固定命令 `platformio-ide.showHome`，以啟動 provider 並進入其 Home／Core 初始化流程。
- Q：Home 命令失敗時是否改裝另一個 provider？ → **否**。provider 已安裝成功，Home 失敗只記錄不含例外細節的警告，並繼續顯示既有重新載入提示，不將初始化錯誤誤判為 marketplace 安裝失敗。
- Q：provider 安裝期間重複開啟積木編輯器時是否建立第二條流程？ → **否**。同一個 `WebViewManager` 共用進行中的 setup Promise；流程結束後清除狀態，讓暫時性失敗可在下次開啟時重試。

## 使用者情境與測試 *(必填)*

### 使用者故事 1 - VS Code 初次設定（優先級：P1）

學生在 VS Code 上首次開啟任一 Singular Blockly 工作區，尚未安裝 PlatformIO IDE。擴充功能沿用舊版的 PlatformIO 前置需求，改以執行期自動安裝提供環境。

**優先此項的理由**：這是最常見的初次設定情境。若無引導，學生在嘗試上傳時會遭遇不明錯誤，造成挫折與混淆。

**獨立測試方式**：移除 PlatformIO IDE 擴充功能，開啟 Arduino 工作區，確認不需點擊前置確認按鈕就會直接啟動安裝流程。

**驗收情境**：

1. **給定** 任一板子工作區未安裝任何 penv provider，**當** 學生開啟積木編輯器，**則** 擴充功能直接開始安裝 `platformio.platformio-ide`，不顯示自訂的前置確認按鈕。
2. **給定** provider 安裝完成，**當** 自動安裝流程繼續執行，**則** 擴充功能先開啟 PlatformIO Home 觸發 provider 與 Core 初始化，再顯示既有重新載入提示。
3. **給定** PlatformIO IDE 已安裝，**當** 擴充功能啟動，**則** 不重複觸發安裝。

---

### 使用者故事 2 - VSCodium / Open VSX 初次設定（優先級：P1）

學生在 VSCodium（或 Firebase Studio / Google Antigravity）開啟工作區，`platformio.platformio-ide` 在 Open VSX 上不可用。擴充功能自動偵測並改為安裝相容的 `pioarduino.pioarduino-ide`。

**優先此項的理由**：若無此流程，所有 VSCodium 及 Open VSX 使用者完全無法使用上傳功能。

**獨立測試方式**：在 VSCodium 上確認未安裝任何 provider，開啟積木編輯器，確認 pioarduino 被自動選擇並安裝。

**驗收情境**：

1. **給定** 未安裝任何 provider 且編輯器使用 Open VSX，**當** 學生開啟積木編輯器，**則** 嘗試安裝 `platformio.platformio-ide` 失敗後，自動 fallback 安裝 `pioarduino.pioarduino-ide`。
2. **給定** pioarduino fallback 安裝成功，**當** 自動安裝流程繼續執行，**則** 同樣呼叫 `platformio-ide.showHome` 啟動 pioarduino 的 Core 初始化流程。
3. **給定** pioarduino 已安裝，**當** 擴充功能啟動，**則** 不重複觸發安裝或自動開啟 Home，所有上傳功能正常運作。
4. **給定** 兩個 provider 均安裝失敗（例如：無網路），**當** 安裝嘗試失敗，**則** 開啟 Extensions 面板搜尋「platformio」，並以通知訊息說明可手動安裝 PlatformIO IDE 或 pioarduino。

---

### 使用者故事 3 - 上傳時 penv 不就緒的提示（優先級：P2）

學生於積木編輯器尚未安裝完成或 penv 尚在初始化時嘗試上傳。擴充功能在上傳路徑顯示簡明的提示訊息，引導學生回到積木編輯器（安裝已在編輯器開啟時自動觸發）。

**優先此項的理由**：安裝處理已在編輯器開啟時處理，上傳路徑不需要重複安裝邏輯，只需提示使用者狀態。

**獨立測試方式**：確認未安裝 provider 時 Arduino/CyberBrick 上傳顯示簡明提示，而非再次觸發安裝流程。

**驗收情境**：

1. **給定** provider 尚未安裝，**當** 學生嘗試 Arduino 上傳，**則** 顯示簡明提示訊息（例：「環境尚未安裝，請開啟積木編輯器自動設定」），而非再次觸發安裝流程。
2. **給定** provider 尚未安裝，**當** 學生嘗試 CyberBrick USB 上傳，**則** 同上，顯示簡明提示訊息而非再次觸發安裝。
3. **給定** provider 已安裝但 penv 尚在初始化中，**當** 學生嘗試上傳，**則** 顯示「環境初始化中，請稍候再試」訊息。
4. **給定** provider 尚未安裝，**當** 學生開啟 Arduino Serial Monitor，**則** 顯示明確說明訊息，而非靜默失敗。

---

### 使用者故事 4 - 現有使用者行為不變（優先級：P1）

已安裝 PlatformIO IDE 或 pioarduino 的使用者，行為與現在完全相同。

**優先此項的理由**：迴歸防護。此變更對已有正常環境的使用者必須完全透明。

**獨立測試方式**：確認 provider 已安裝時不重複觸發安裝，且所有上傳路徑正常運作。

**驗收情境**：

1. **給定** PlatformIO IDE 已安裝，**當** 擴充功能啟動，**則** 不重複觸發安裝。
2. **給定** pioarduino 已安裝，**當** 擴充功能啟動，**則** 不重複觸發安裝。
3. **給定** 任一 provider 已安裝，**當** 學生上傳至任何板子類型，**則** 上傳流程正常，不出現額外對話框。

---

### 使用者故事 5 - 所有板子維持既有前置環境（優先級：P1）

使用 TXT Controller 或 CyberBrick OTA 工作區的使用者，與舊版 `extensionDependencies` 行為一致，仍會安裝 PlatformIO provider；差異僅在安裝時機改成積木編輯器開啟後直接觸發。

**優先此項的理由**：避免移除硬性 dependency 後，不同板子產生不同的環境基線。

**驗收情境**：

1. **給定** 工作區板子為 TXT Controller 且未安裝任何 penv provider，**當** 學生開啟積木編輯器，**則** 觸發 provider 安裝流程。
2. **給定** 工作區板子為 CyberBrick OTA 且未安裝任何 penv provider，**當** 學生開啟積木編輯器，**則** 觸發相同的 provider 安裝流程。

---

### 邊界情境

- 學生安裝 extension 後立即關閉 VS Code，尚未等待 penv 初始化完成？ → 下次開啟時，積木編輯器會偵測到 provider 已安裝（不重複安裝）；上傳時若 penv 仍未就緒，顯示「環境初始化中，請稍候再試」。
- Windows 與 macOS 的 penv 路徑不同（`Scripts` vs `bin`）？ → 由 `platformioInvocationResolver.ts` 建立跨平台候選並逐一實際執行驗證。
- Windows 使用者目錄含非 ASCII 字元或使用自訂 Core 位置？ → 依序納入 `platformio-ide.customPATH`、`PLATFORMIO_CORE_DIR`、Windows 系統磁碟根目錄與預設使用者目錄。
- `pio.exe` 存在但被系統拒絕執行？ → 不立即判定 unavailable，繼續嘗試同一 penv 的 `python.exe -m platformio`。
- 板子類型尚未設定（`none`）的工作區？ → 與其他板子相同，維持 provider 前置安裝流程。
- 積木編輯器尚未開啟就嘗試上傳？ → 上傳路徑只顯示簡明提示訊息，不重複觸發安裝。
- provider 安裝成功但 `platformio-ide.showHome` 執行失敗？ → 記錄一般性警告並保留重新載入提示；不 fallback 安裝另一個 provider，也不暴露第三方例外細節。
- provider 安裝尚未完成時連續開啟積木編輯器？ → 共用既有的 provider setup，不重複安裝、不重複開啟 Home，也不顯示多個 reload 提示；流程結束後允許下一次重新偵測。

## 需求 *(必填)*

### 功能需求

- **FR-001**：擴充功能在啟動（activate）時，**不得**要求 `platformio.platformio-ide` 事先安裝（移除 `package.json` 中的 `extensionDependencies`）。
- **FR-002**：積木編輯器面板建立時（`webviewManager.createAndShowWebView()` 建立新面板階段），所有板子類型都必須進行 provider 偵測，以維持舊版 `extensionDependencies` 的共同環境前置。
- **FR-003**：積木編輯器開啟時必須偵測是否已安裝 penv provider（`platformio.platformio-ide` 或 `pioarduino.pioarduino-ide`），**以 `vscode.extensions.getExtension()` 判斷，不以 Core 路徑存在作為 provider 安裝判斷**。
- **FR-004**：未偵測到任何 penv provider 時，系統必須直接呼叫 `workbench.extensions.installExtension` 啟動安裝，不顯示自訂的前置確認通知或按鈕。
- **FR-005**：系統必須先嘗試安裝 `platformio.platformio-ide`；若安裝失敗（表示當前 marketplace 不提供此 extension），則自動 fallback 安裝 `pioarduino.pioarduino-ide`。
- **FR-006**：若兩個 provider 均安裝失敗，系統必須開啟 Extensions 面板搜尋「platformio」，並在通知訊息中明確提及 PlatformIO IDE 和 pioarduino 兩個選項，供使用者手動選擇。
- **FR-007**：只有 `installExtension` 成功時才進入 Home／重新載入路徑；兩個 provider 均安裝失敗時只開啟 Extensions 搜尋並顯示手動安裝訊息，不得開啟 Home 或顯示「環境已就緒」。
- **FR-008**：Arduino 上傳時，若 `checkPioInstalled()` 回傳 false，顯示簡明提示訊息（引導學生開啟積木編輯器以自動安裝），不在上傳路徑重複觸發安裝流程。安裝已由積木編輯器開啟時處理。
- **FR-009**：CyberBrick USB 上傳時，若 `checkPythonEnvironment()` 回傳 false，同 FR-008 處理方式（顯示簡明提示，不重複觸發安裝）。
- **FR-010**：`micropythonUploader.ts` 中 `installMpremote()` 失敗時的 `details` 訊息，必須更新為同時提及 pioarduino 作為替代 provider，而非僅提及 PlatformIO。
- **FR-011**：`serialMonitorService.ts` 必須使用成功偵測裝置的後端啟動監控：pyserial 偵測成功則沿用該 Python；只有 mpremote fallback 偵測成功時才直接啟動 mpremote，不得以固定 `~/.platformio/penv` guard 排除可用的自訂或系統 Python。
- **FR-012**：`configurePlatformIOSettings()` 在 `settingsManager.ts` 中，必須僅在偵測到 provider（`platformio.platformio-ide` 或 `pioarduino.pioarduino-ide`）已安裝時，才寫入 `platformio-ide.*` 工作區設定。
- **FR-013**：本功能新增的所有使用者可見字串，必須加入全部 15 個語系的 `media/locales/*/messages.js` 檔案，並以 `npm run validate:i18n` 驗證通過。
- **FR-014**：本功能的所有新邏輯（provider 偵測、安裝 fallback、啟動候選探測、後端選擇）必須以 Mocha / Sinon mock 建立單元測試，維持或超過現有測試通過數（908 筆）。
- **FR-015**：PlatformIO Core 可用性必須以實際 `--version` 執行結果判斷；某候選存在但執行失敗時必須繼續 fallback。
- **FR-016**：PlatformIO 啟動候選必須支援 `platformio-ide.customPATH`、`PLATFORMIO_CORE_DIR`、Windows 系統磁碟根目錄、預設 `~/.platformio` 與 `PATH`。
- **FR-017**：若 direct launcher 失敗但 `python -m platformio` 成功，後續編譯、上傳與 Arduino Serial Monitor 必須沿用該 Python module 啟動方式。
- **FR-018**：PlatformIO 診斷必須納入相同的 Core 位置候選；若 Python module fallback 成功，Core 項目顯示為可用，整體狀態可因其他工具缺失顯示為降級，但不得顯示 unavailable。
- **FR-019**：官方 PlatformIO IDE 或 pioarduino 安裝成功後，系統必須先等待固定命令 `platformio-ide.showHome` 完成，再顯示既有重新載入提示；Home 命令失敗時只記錄不含例外細節的警告並繼續提示，不得重新觸發 provider fallback。
- **FR-020**：provider setup 進行期間，重複開啟積木編輯器必須共用同一條 in-flight 流程；不得重複安裝 provider、開啟 Home 或顯示 reload。流程完成或失敗後必須清除 in-flight 狀態，以允許後續重新偵測與重試。

### 核心概念

- **penv Provider**：已安裝的 VS Code 擴充功能（`platformio.platformio-ide` 或 `pioarduino.pioarduino-ide`），負責在首次啟動時建立並維護 PlatformIO Python 虛擬環境。
- **penv**：PlatformIO Core 使用的 Python 虛擬環境；預設位於 `~/.platformio/penv/`，也可能由 `PLATFORMIO_CORE_DIR` 或 provider 設定改到其他位置。
- **自動安裝流程（Automatic Provider Installation）**：未偵測到 penv provider 時直接啟動安裝；官方 provider 不可用時依序 fallback 到 pioarduino 與 Extensions 搜尋。任一 provider 安裝成功後開啟 PlatformIO Home 觸發 Core 初始化，再保留重新載入提示。

## 成功指標 *(必填)*

### 可量測目標

- **SC-001**：VSCodium 使用者在未安裝任何 provider 的情況下，能完成完整的引導安裝流程（開啟積木編輯器 → 自動安裝 → PlatformIO Home／Core 初始化 → 重新載入），全程無不明錯誤。
- **SC-002**：VS Code 上已安裝 PlatformIO IDE 的使用者，行為零變化——不重複安裝，上傳流程不受影響。
- **SC-003**：上傳時 penv 缺失，使用者在 3 秒內看到有行動指引的訊息，而非裸露的技術錯誤字串。
- **SC-004**：908 筆以上的現有單元測試全數通過；新增測試涵蓋 provider 偵測、安裝結果、Windows Core fallback 及 Monitor 後端選擇。
- **SC-005**：`npm run validate:i18n` 於新增 locale key 後驗證通過。
- **SC-006**：VSCodium 1.121 搭配 pioarduino 1.4.4，擴充功能正常啟動，Blockly 編輯器、程式碼生成、CyberBrick 上傳皆正常運作。
- **SC-007**：provider setup 尚未完成時連續觸發兩次積木編輯器，安裝、Home 與 reload 各只執行一次；流程完成後下一次觸發可重新偵測。

## 假設

- `workbench.extensions.installExtension` 為 VS Code 官方記載的內建指令，在 VS Code、VSCodium、Firebase Studio、Google Antigravity 等目標編輯器均可使用。
- 安裝完成後由本擴充功能呼叫 `platformio-ide.showHome` 啟動 provider／Core 初始化，再顯示既有重新載入提示；Home 命令 ID 在官方 PlatformIO IDE 與 pioarduino 中相容。
- `pioarduino.pioarduino-ide` 預設建立與官方 PlatformIO extension 相容的 penv 結構；若設定自訂 Core 目錄，實際位置可不同於 `~/.platformio/penv/`。
- 在 Open VSX 環境嘗試安裝 `platformio.platformio-ide` 會產生可捕捉的 rejection，使 fallback 到 pioarduino 得以觸發。
- TypeScript 側的上傳錯誤 `message` 與 `details` 字串在現有程式碼中全為硬編碼英文；本規格不改變此模式（i18n 化屬既有技術債）。

## 超出範圍

- 讓使用者透過設定自訂 Python 路徑。
- 在不安裝 VS Code extension 的情況下支援獨立安裝 PlatformIO CLI。
- 實作安裝後自動執行第一次 build 的精靈流程。
- 修復本功能以外的既有 TypeScript 硬編碼英文錯誤字串。
