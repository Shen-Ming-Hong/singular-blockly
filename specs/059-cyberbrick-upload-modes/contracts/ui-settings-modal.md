# 契約：CyberBrick 上傳設定 Modal UI

## 目的

定義 Blockly 編輯畫面右上角 CyberBrick 上傳設定齒輪與 modal 的使用者體驗。此契約聚焦兒童友善、明確模式、少打擾與多裝置辨識。

## 顯示條件

- 當目前 board 是 CyberBrick 時，右上工具列顯示 CyberBrick 上傳設定齒輪。
- 當目前 board 不是 CyberBrick 時，齒輪不顯示或 disabled，且不得影響 Arduino/TXT 上傳 UI。
- 新專案第一次開啟 modal 時，模式 radio/segmented control 預設 `USB`。

## Modal 區塊

### 1. 模式選擇

必須包含：

- `USB`：預設；說明「使用傳輸線上傳」。
- `OTA`：說明「使用已配對並連上同一網路的 CyberBrick」。

**規則**

- 切換到 `OTA` 只代表使用者選擇模式，不代表 provisioning 自動開始。
- 若 OTA readiness 不完整，顯示清楚提示與「開始 USB 設定」行動。
- 若從 OTA 切回 USB，立即隱藏/收合 OTA 專用必要欄位，但不刪除已保存 pairing。

### 2. 已配對裝置清單

每台裝置顯示：

- `friendlyName`
- `shortDeviceLabel` 或 `deviceId` 摘要
- 最近 IP 或「尚未取得 IP」
- 最後成功上傳或最後看到時間
- 狀態 badge：`ready`、`offline`、`needs setup`、`token missing` 等

**規則**

- 名稱重複時不得合併；必須顯示唯一識別摘要。
- 選擇主要目標後，保存為 `primaryDeviceId`。
- 刪除裝置需要二次確認，並清楚告知會刪除本機 secrets。

### 3. 首次 USB 設定 / Provisioning

欄位與動作：

- USB port selector。
- 裝置顯示名稱 `friendlyName`。
- Wi‑Fi SSID combobox。
- 「重新掃描」按鈕。
- Wi‑Fi 密碼欄位（password input）。
- 「開始設定」按鈕。

**規則**

- SSID 清單由 CyberBrick 裝置掃描結果填入。
- 清單空白時顯示友善說明，並保留手動輸入。
- 掃描與 provisioning 進行中需 disabled 會造成衝突的操作，但允許取消/關閉時清楚處理狀態。
- 密碼欄位內容不可在重新載入 modal 時回填明文；只能顯示「已儲存密碼」狀態。

### 4. Readiness 與上傳前提示

- `USB` 模式：顯示「會使用原本 USB 上傳流程」。
- `OTA` 且 ready：顯示目前目標裝置與最近狀態。
- `OTA` 但 not ready：顯示 blocking reason 與下一步按鈕。

**規則**

- 不顯示「自動改用 USB」或等價文案。
- 可顯示「你可以手動切回 USB」作為使用者可選行動。

## Accessibility / i18n

- 所有使用者可見文字需走現有 locale messages，新增 key 要補 15 語系。
- 表單 label 必須與 input 關聯。
- 按鈕需有可理解 aria-label/title。
- 深色/淺色主題需沿用既有 editor theme tokens，不硬塞 TXT 專用 class。
- 錯誤訊息不能只靠顏色呈現。

## 視覺與狀態規則

- CyberBrick 設定齒輪不可使用 `txt-*` 狀態 class。
- 不得改壞 `uploadButton` spinning/loading selector。
- Modal 開啟時載入最新 Extension Host state；保存成功後以 response state 重新 render。
- WebView 可用 `vscode.setState()` 保存未提交暫態表單，但不可作為 persisted settings。

## Manual validation cases

1. 新 CyberBrick 專案開啟 modal，看到 USB 預設。
2. USB 模式按上傳，不出現 OTA 欄位/詢問。
3. 切到 OTA 但未 provisioning，按保存後看到 readiness 提示，不自動開始上傳。
4. 使用 USB 掃描 SSID，清單可選，也可手動輸入。
5. provisioning 成功後仍顯示目前模式 USB。
6. 手動切到 OTA 後，按上傳直接走 OTA。
7. 兩台裝置同名時仍能分辨 deviceId 摘要。
8. OTA 失敗時只顯示下一步，不自動 USB fallback。
