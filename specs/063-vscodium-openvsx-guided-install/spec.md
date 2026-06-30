# 功能規格：VSCodium / Open VSX 支援與引導安裝

**功能分支**：`063-vscodium-openvsx-guided-install`

**建立日期**：2026-06-30

**狀態**：草稿

## 澄清記錄

### 階段 2026-06-30

- Q：啟動通知的重複顯示政策為何？ → **每次 activation 皆顯示**（直到 provider 安裝完成）。採用雙層偵測：activation 只偵測 provider extension 是否安裝（不檢查 penv），penv 缺失只在上傳時才報告。
- Q：兩個 extension 都安裝失敗時的後備方案？ → 開啟 Extensions 面板搜尋，搜尋結果需同時涵蓋 PlatformIO IDE 和 pioarduino，通知訊息文字也需明確提及兩者名稱。
- Q：activation 的正確偵測點？ → 只偵測 provider extension 安裝狀態；penv 由 provider extension 在首次啟動時自動建立（下載 PlatformIO Core），**不需要使用者手動執行第一次編譯**。「安裝後需先執行 build」的假設已確認為錯誤。
- Q：是否根據板子類型篩選通知？ → **是**，只在工作區板子類型需要 penv 時才顯示通知（Arduino 系列、CyberBrick USB）；TXT Controller、CyberBrick OTA 等不顯示。
- Q：上傳時 provider 已安裝但 penv 仍在初始化（race condition）應如何處理？ → **自動重試最多 3 次**（每次間隔 3 秒），仍失敗才顯示錯誤訊息。

## 使用者情境與測試 *(必填)*

### 使用者故事 1 - VS Code 初次設定（優先級：P1）

學生在 VS Code 上首次開啟 Singular Blockly 工作區（板子類型為 Arduino 或 CyberBrick USB），尚未安裝 PlatformIO IDE。擴充功能主動通知學生環境尚未就緒，並提供一鍵安裝路徑。

**優先此項的理由**：這是最常見的初次設定情境。若無引導，學生在嘗試上傳時會遭遇不明錯誤，造成挫折與混淆。

**獨立測試方式**：移除 PlatformIO IDE 擴充功能，開啟 Arduino 工作區，確認通知出現且安裝按鈕可正常觸發安裝流程。

**驗收情境**：

1. **給定** 工作區板子為 Arduino 且未安裝任何 penv provider，**當** 擴充功能啟動，**則** 出現非阻擋式 VS Code 通知，說明 Python 環境尚未就緒，並提供「安裝擴充功能環境」按鈕。
2. **給定** 通知已顯示，**當** 學生點擊「安裝擴充功能環境」，**則** 擴充功能在背景自動安裝 `platformio.platformio-ide`。
3. **給定** 安裝完成，**當** VS Code 詢問是否重新載入，**則** VS Code 自動處理重新載入提示；penv 在 PlatformIO IDE 首次啟動時自動建立，無需手動步驟。
4. **給定** PlatformIO IDE 已安裝，**當** 擴充功能啟動，**則** 不出現任何通知。

---

### 使用者故事 2 - VSCodium / Open VSX 初次設定（優先級：P1）

學生在 VSCodium（或 Firebase Studio / Google Antigravity）開啟工作區，`platformio.platformio-ide` 在 Open VSX 上不可用。擴充功能自動偵測並改為安裝相容的 `pioarduino.pioarduino-ide`。

**優先此項的理由**：若無此流程，所有 VSCodium 及 Open VSX 使用者完全無法使用上傳功能。

**獨立測試方式**：在 VSCodium 上確認未安裝任何 provider，點擊通知按鈕，確認 pioarduino 被自動選擇並安裝。

**驗收情境**：

1. **給定** 未安裝任何 provider 且編輯器使用 Open VSX，**當** 學生點擊「安裝擴充功能環境」，**則** 嘗試安裝 `platformio.platformio-ide` 失敗後，自動 fallback 安裝 `pioarduino.pioarduino-ide`。
2. **給定** pioarduino 已安裝，**當** 擴充功能啟動，**則** 不出現通知，所有上傳功能正常運作。
3. **給定** 兩個 provider 均安裝失敗（例如：無網路），**當** 安裝嘗試失敗，**則** 開啟 Extensions 面板搜尋「platformio」，並以通知訊息說明可手動安裝 PlatformIO IDE 或 pioarduino。

---

### 使用者故事 3 - dismiss 通知後嘗試上傳（優先級：P2）

學生關閉了啟動通知，隨後嘗試上傳程式。擴充功能在上傳時再次顯示引導安裝通知，確保學生不會只看到難以理解的技術錯誤。

**優先此項的理由**：學生可能在未仔細閱讀的情況下關閉通知。上傳時才是學生最需要引導的時刻。

**獨立測試方式**：關閉啟動通知後嘗試 Arduino 或 CyberBrick USB 上傳，確認通知再次出現。

**驗收情境**：

1. **給定** 啟動通知已被 dismiss 且 provider 仍未安裝，**當** 學生嘗試 Arduino 上傳，**則** 安裝引導通知再次出現。
2. **給定** 啟動通知已被 dismiss 且 provider 仍未安裝，**當** 學生嘗試 CyberBrick USB 上傳，**則** 安裝引導通知再次出現。
3. **給定** provider 已安裝但 penv 仍在初始化中（race condition），**當** 學生嘗試上傳，**則** 系統自動重試最多 3 次（間隔 3 秒），仍失敗才顯示「環境初始化中，請稍候再試」訊息。
4. **給定** 啟動通知已被 dismiss 且 provider 仍未安裝，**當** 學生開啟 Arduino Serial Monitor，**則** 顯示明確說明訊息，而非靜默失敗。

---

### 使用者故事 4 - 現有使用者行為不變（優先級：P1）

已安裝 PlatformIO IDE 或 pioarduino 的使用者，行為與現在完全相同。

**優先此項的理由**：迴歸防護。此變更對已有正常環境的使用者必須完全透明。

**獨立測試方式**：確認 provider 已安裝時不出現通知，且所有上傳路徑正常運作。

**驗收情境**：

1. **給定** PlatformIO IDE 已安裝，**當** 擴充功能啟動，**則** 不出現安裝通知。
2. **給定** pioarduino 已安裝，**當** 擴充功能啟動，**則** 不出現安裝通知。
3. **給定** 任一 provider 已安裝，**當** 學生上傳至任何板子類型，**則** 上傳流程正常，不出現額外對話框。

---

### 使用者故事 5 - 非 penv 板子不受影響（優先級：P1）

使用 TXT Controller 或 CyberBrick OTA 工作區的使用者，即使未安裝任何 penv provider，也**不**會看到安裝通知。

**優先此項的理由**：TXT 和 CyberBrick OTA 完全不依賴 penv；不相干的通知會造成困擾。

**驗收情境**：

1. **給定** 工作區板子為 TXT Controller 且未安裝任何 penv provider，**當** 擴充功能啟動，**則** 不出現安裝通知。
2. **給定** 工作區板子為 CyberBrick OTA 且未安裝任何 penv provider，**當** 擴充功能啟動，**則** 不出現安裝通知。

---

### 邊界情境

- 學生安裝 extension 後立即關閉 VS Code，尚未等待 penv 初始化完成？ → 下次開啟時，provider 已安裝（不顯示安裝通知）；上傳時若 penv 仍未就緒，觸發重試機制。
- Windows 與 macOS 的 penv 路徑不同（`Scripts` vs `bin`）？ → 由現有 `executableResolver.ts` 的 `platform === 'win32'` 判斷處理，本功能不需額外處理。
- 板子類型尚未設定（`none`）的工作區？ → 視為不需要 penv，不顯示通知。
- 重新載入後 PlatformIO IDE 正在下載 PlatformIO Core，上傳被觸發？ → 由重試機制（最多 3 次）處理。

## 需求 *(必填)*

### 功能需求

- **FR-001**：擴充功能在啟動（activate）時，**不得**要求 `platformio.platformio-ide` 事先安裝（移除 `package.json` 中的 `extensionDependencies`）。
- **FR-002**：啟動時，系統必須偵測工作區板子類型；僅當板子類型為 Arduino 系列（即 `mainJson.board` 不為 `'none'`、`'cyberbrick'`、`'txt'`）時，才於啟動時進行 provider 偵測並顯示安裝通知。CyberBrick USB 的 penv 偵測刻意延後至上傳時觸發（由 FR-009 涵蓋），因為 CyberBrick 工作區可能使用不需要 penv 的 OTA 上傳模式。TXT Controller、`none` 板子類型永遠跳過 provider 偵測。
- **FR-003**：啟動時，對於需要 penv 的工作區，系統必須偵測是否已安裝 penv provider（`platformio.platformio-ide` 或 `pioarduino.pioarduino-ide`），**以 `vscode.extensions.getExtension()` 判斷，不檢查 penv 路徑是否存在**。
- **FR-004**：未偵測到任何 penv provider 時，系統必須顯示非阻擋式 VS Code 通知，告知使用者環境尚未就緒，並提供一個「安裝擴充功能環境」按鈕（需於全部 15 個語系 locale 檔案中提供對應翻譯）。
- **FR-005**：使用者點擊「安裝擴充功能環境」後，系統必須先嘗試安裝 `platformio.platformio-ide`；若安裝失敗（表示當前 marketplace 不提供此 extension），則自動 fallback 安裝 `pioarduino.pioarduino-ide`。
- **FR-006**：若兩個 provider 均安裝失敗，系統必須開啟 Extensions 面板搜尋「platformio」，並在通知訊息中明確提及 PlatformIO IDE 和 pioarduino 兩個選項，供使用者手動選擇。
- **FR-007**：安裝完成後的重新載入步驟，由 VS Code 框架自動處理；系統不需要實作自訂 reload 按鈕或重啟邏輯。penv 將由 PlatformIO IDE 或 pioarduino 在首次啟動時自動建立。
- **FR-008**：Arduino 上傳時，若 `checkPioInstalled()` 回傳 false（penv 不存在），系統必須先確認 provider 是否已安裝：若未安裝，觸發與啟動通知相同的安裝引導流程；若已安裝，自動重試最多 3 次（間隔 3 秒），仍失敗才顯示「環境初始化中，請稍候再試」訊息。
- **FR-009**：CyberBrick USB 上傳時，若 `checkPythonEnvironment()` 回傳 false，同 FR-008 邏輯處理。
- **FR-010**：`micropythonUploader.ts` 中 `installMpremote()` 失敗時的 `details` 訊息，必須更新為同時提及 pioarduino 作為替代 provider，而非僅提及 PlatformIO。
- **FR-011**：`serialMonitorService.ts` 在呼叫 `getPlatformioPythonPath()` 之前，必須先確認 penv 是否存在；若不存在，以明確的使用者可見訊息說明失敗原因，而非靜默失敗。
- **FR-012**：`configurePlatformIOSettings()` 在 `settingsManager.ts` 中，必須僅在偵測到 provider（`platformio.platformio-ide` 或 `pioarduino.pioarduino-ide`）已安裝時，才寫入 `platformio-ide.*` 工作區設定。
- **FR-013**：本功能新增的所有使用者可見字串，必須加入全部 15 個語系的 `media/locales/*/messages.js` 檔案，並以 `npm run validate:i18n` 驗證通過。
- **FR-014**：本功能的所有新邏輯（provider 偵測、通知觸發、安裝 fallback、重試機制）必須以 Mocha / Sinon mock 建立單元測試，維持或超過現有測試通過數（908 筆）。

### 核心概念

- **penv Provider**：已安裝的 VS Code 擴充功能（`platformio.platformio-ide` 或 `pioarduino.pioarduino-ide`），負責在首次啟動時於 `~/.platformio/penv/` 建立並維護 Python 虛擬環境。
- **penv**：位於 `~/.platformio/penv/` 的 Python 虛擬環境，包含 Arduino 編譯與 CyberBrick 上傳所需的 `python`、`pip`、`pio`、`mpremote` 執行檔。
- **安裝引導通知（Installation Notification）**：未偵測到 penv provider 時顯示的非阻擋式 VS Code 資訊訊息，引導使用者透過一鍵安裝完成設定。

## 成功指標 *(必填)*

### 可量測目標

- **SC-001**：VSCodium 使用者在未安裝任何 provider 的情況下，能完成完整的引導安裝流程（通知 → 安裝 → 重新載入 → 自動建立 penv），全程無不明錯誤。
- **SC-002**：VS Code 上已安裝 PlatformIO IDE 的使用者，行為零變化——不出現新通知，上傳流程不受影響。
- **SC-003**：上傳時 penv 缺失，使用者在 3 秒內看到有行動指引的訊息，而非裸露的技術錯誤字串。
- **SC-004**：908 筆以上的現有單元測試全數通過；至少新增 3 筆測試，涵蓋 provider 偵測、安裝 fallback、及重試機制邏輯。
- **SC-005**：`npm run validate:i18n` 於新增 locale key 後驗證通過。
- **SC-006**：VSCodium 1.121 搭配 pioarduino 1.4.4，擴充功能正常啟動，Blockly 編輯器、程式碼生成、CyberBrick 上傳皆正常運作。

## 假設

- `workbench.extensions.installExtension` 為 VS Code 官方記載的內建指令，在 VS Code、VSCodium、Firebase Studio、Google Antigravity 等目標編輯器均可使用。
- 安裝完成後的重新載入步驟，由 VS Code 框架自動處理。
- `pioarduino.pioarduino-ide` 建立的 Python 環境路徑與官方 PlatformIO extension 完全相同（`~/.platformio/penv/`）。
- 在 Open VSX 環境嘗試安裝 `platformio.platformio-ide` 會產生可捕捉的 rejection，使 fallback 到 pioarduino 得以觸發。
- TypeScript 側的上傳錯誤 `message` 與 `details` 字串在現有程式碼中全為硬編碼英文；本規格不改變此模式（i18n 化屬既有技術債）。

## 超出範圍

- 讓使用者透過設定自訂 Python 路徑。
- 在不安裝 VS Code extension 的情況下支援獨立安裝 PlatformIO CLI。
- 實作安裝後自動執行第一次 build 的精靈流程。
- 修復本功能以外的既有 TypeScript 硬編碼英文錯誤字串。
