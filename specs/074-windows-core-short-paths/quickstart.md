# 驗證指南：Singular Core 的 Windows 短路徑工作區

資料結構與預算公式見 [data-model.md](data-model.md)，量測依據見 [research.md](research.md)。

## 1. 雲端容器（Linux）

```bash
npm ci
npm run ci:static
xvfb-run -a npm run test:unit:ci
npm run test:managed-runtime
npm run test:managed-runtime:e2e -- --allow-network --root "$(mktemp -d)" --result /tmp/runtime-result.json
```

**預期結果**：

- 全部通過。
- Linux 的 E2E 結果不含 `workRootKind`（非 Windows 不建立工作位置）。

## 2. Windows CI

1. 維護者在 PR 加上 `runtime-e2e-approved`。
2. `Managed Runtime Installation` 的 Windows x64 job 執行 `--esp32-packages`。

**預期結果**：

- 證據 JSON 中的 `workRootKind` 為 `system-drive`：沙盒使用非 ASCII 的 `LOCALAPPDATA`，所以會改用磁碟根目錄。
- `longestPathLength` 小於 260。
- ESP32 平台與工具鏈安裝成功。

## 3. Windows 實機（Ray）

**前置條件**：

- Windows 10／11 x64，`LongPathsEnabled=0`（`reg query HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled` 顯示 `0x0` 或不存在）。
- 停用 PlatformIO IDE 擴充功能，讓 Arduino 工作流改走 Singular Core。

**步驟**：

1. 載入本分支，等待右下角的 Singular Core 準備完成（已準備好的不會重新下載）。
2. 開啟 ESP32 專案，例如內建範例的 LED 閃爍，按「上傳」。第一次會下載 ESP32 平台與工具鏈，需要幾分鐘。
3. 開啟 PlatformIO 診斷。

**預期結果**：

- 編譯並上傳成功，開發板的 LED 閃爍。
- 診斷的 Singular Core 卡片顯示工作位置類別（`local-app-data` 或 `system-drive`），以及 long paths `disabled`。
- `%LOCALAPPDATA%\SingularBlockly\pio` 或 `C:\SingularBlockly-xxxxxxxx` 底下有 `packages` 與 `platforms`。
- 磁碟根目錄的版本，執行 `icacls` 只會看到目前使用者、SYSTEM 與 Administrators。

## 4. 路徑過長提示

在任何平台以單元測試模擬：自訂 managed runtime 資料夾長度超過預算。

**預期結果**：

- 不啟動 PlatformIO，並顯示「Singular Core 需要較短的本機資料夾」通知與「選擇較短資料夾」動作。
