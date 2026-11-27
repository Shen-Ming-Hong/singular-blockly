# 實作計畫：沒改程式時加速重複上傳

**分支**：`claude/project-thread-jutnxz` | **日期**：2026-11-27 | **規格**：[spec.md](./spec.md)

## 摘要

新增 `ArduinoBuildCache`，以 ini、原始檔與 Core 的雜湊記錄「套件已準備」與「韌體已建置」。`ArduinoUploader.upload()` 依記錄跳過 `pio pkg install`，並在可以時改用 `pio run -t nobuild -t upload`。

## 技術背景

- TypeScript 6.0.3（Extension Host），Node 內建 `crypto`、`fs/promises`。
- PlatformIO Core 6.1.18；`nobuild` 目標由平台 builder 處理：`atmelavr` 上傳 `firmware.hex`，`espressif32` 只上傳 `firmware.bin`（容器實測 6.9.0；7.0.1 builder 同樣邏輯）。
- 測試：Mocha + Sinon，真實暫存資料夾加注入的 `StreamingCommandExecutor`。

## 憲章檢查

- Extension Host 與 WebView 分離：只改 Extension Host，訊息格式不變（沿用 `uploadProgress` 的 `stage`）。
- 檔案 I/O：快取模組用可注入的 `BuildCacheFileSystem`；`main.cpp` 讀取沿用 `FileSystemInterface.readFileSync`。
- 日誌只用 `log()`。
- 不新增使用者設定、指令或訊息；不改 WebView、i18n、產生器。

## 設計

| 項目 | 做法 |
| --- | --- |
| 準備鍵 | sha256(版本、Core id、指令、PlatformIO 資料夾環境變數、ini 內容) |
| 建置鍵 | sha256(準備鍵 + `src/`、`include/`、`lib/` 每個檔案的相對路徑、長度、內容) |
| 韌體記錄 | `<buildRoot>/<env>/` 下的 firmware.bin/hex/elf、bootloader.bin、partitions.bin 的大小與 mtime |
| buildRoot | `PLATFORMIO_BUILD_DIR` → `PLATFORMIO_WORKSPACE_DIR/build` → `<專案>/.pio/build` |
| 平台檢查 | ini 的 `platform` 取名稱（支援 `owner/name@ver`），`platforms/<name>` 須存在；URL 或路徑不快取 |
| 燒錄方式 | `atmelavr` → `whole`（埠自動偵測）；`espressif32` → `app-only`（固定上次埠、比對 MAC）；其他 → 不走捷徑 |
| 板子身分 | 完整上傳成功時從輸出讀 `Auto-detected:`／`Serial port` 與 esptool 的 `MAC:`；不另外呼叫 `pio device list` |

## 驗證

- 單元：`arduinoBuildCache.test.ts`（鍵、平台、韌體、損壞快取、多 env）與 `arduinoUploader.test.ts`「Unchanged re-upload (spec 077)」（跳過、改碼、改 ini、nobuild 失敗退回、換板、無 MAC、AVR、燒錄失敗後重試）。
- 容器實測 PlatformIO 6.1.18：ESP32 無變更 `-t upload` 8.1 秒、`-t nobuild -t upload` 0.9 秒（無板子，燒錄前失敗）；確認兩者 esptool 參數差異。
- 硬體：需在 Ray 的 Windows 與 ESP32 實測（發布門檻）。

## 回退

移除 `ArduinoBuildCache` 的呼叫即回到原流程；快取檔是建置資料夾裡的獨立 JSON，刪除不影響 PlatformIO。
