# 實作計畫：上傳進度提示加入進度條與下載／安裝進度

**分支**：`claude/project-thread-xxd52i` | **日期**：2026-11-27 | **規格**：[spec.md](spec.md)

## 摘要

Extension 在 `pio pkg install` 執行時量測寫入量並判斷下載／安裝階段，透過 `uploadProgress` 的新可選欄位 `packages` 送到 WebView。WebView 的進度提示改成「短標籤 百分比」加一條細進度條與經過時間；原始工具訊息只寫到輸出面板。

## 技術背景

- TypeScript 6.0.3 strict；WebView 為一般 JavaScript。
- 量測用注入的唯讀檔案系統介面（`readdir`、`lstat`），測試時以假資料夾驅動。
- 不新增設定、指令或依賴。

## 憲章檢查

| 原則 | 結論 |
| --- | --- |
| 簡單 | 一個新的純量測模組；WebView 只多一個進度條元素。通過 |
| 模組化、可測 | 百分比與階段判斷是純函式；Extension 與 WebView 只透過 `postMessage`。通過 |
| 研究導向 | 量測實際安裝流程與大小（research R1、R2）。通過 |
| 結構化日誌 | 用 `log()`，路徑隱私化。通過 |
| i18n | 2 個新字串 × 15 語系。通過 |

## 設計

### Extension Host

- `src/services/packageInstallProgress.ts`（新）：
  - `PACKAGE_INSTALL_ESTIMATED_BYTES`：依開發板 id 的預估總量。
  - `resolvePlatformioDirectories(env, homeDir)`：由 `PLATFORMIO_*` 環境變數推出 downloads、tmp、packages、platforms。
  - `PackageInstallProgressTracker`：`start()` 記下既有項目，`sample()` 只量新項目並保持單調，`observeOutput(text)` 判斷階段，`snapshot()` 回傳 `{ phase, percent }`（`percent` 為 `null` 表示不定，最多 95）。
- `ArduinoUploader.prepareProjectPackages`：建立 tracker，每秒取樣並回報；PlatformIO 安裝行寫到輸出面板（隱私化）；結束時記錄實際總量。
- `ArduinoUploadProgress` 與 `UploadProgress` 新增 `packages?: PackageProgress`，`messageHandler` 原樣轉送。

### WebView

- `toast.showProgress(text, startTime, value)`：`value` 為 0–100 顯示確定進度，`null` 顯示不定進度。進度條 `role="progressbar"`，以 `aria-labelledby` 指向狀態文字。
- `formatUploadProgress(message, getMessage, boardName)`：產生短標籤與數值，`handleUploadProgress` 只用它，不再拼接 `message` 原文。移除為原文設計的 `uploadProgressFilter`。
- CyberBrick OTA 進度沒有百分比，顯示不定進度條。
- CSS：4px 高的進度條，軌道用半透明白、填色用白（在藍色提示上對比 > 3:1）；`prefers-reduced-motion` 時不定進度不做動畫。

## 驗證

- 單元測試：tracker（階段、單調、上限、新項目才量、讀取失敗略過）、`ArduinoUploader` 套件進度轉送、`messageHandler` 轉送 `packages`。
- WebView 契約測試：進度條屬性、不定進度、短標籤不含原文。
- i18n：`validate:i18n`、`test:i18n`。
- 視覺：在真實 VS Code webview 注入進度訊息，截亮色、深色、窄視窗。
- 實機：Ray 的 Windows 電腦以清空的 Singular Core ESP32 套件跑一次首次安裝。
