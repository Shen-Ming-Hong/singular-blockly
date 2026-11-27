# 功能規格：沒改程式時加速重複上傳

**功能分支**：`claude/project-thread-jutnxz`（雲端工作階段指定分支，疊在 PR #302 的分支上）

**建立日期**：2026-11-27

**狀態**：Draft

**輸入**：Ray（2026-11-27）：「目前在 windows 上面重複編譯並上傳真的很久，原因是什麼？我沒改程式」「好啊，我很需要分析並加速」。在 Ray 的 Windows 筆電（Singular08-NB，managed Core，ESP32-D0WD-V3 接 COM35）實測，沒改程式再按一次上傳要 43.6 秒：`pio pkg install` 約 5.5 秒（沒有下載任何東西）、`pio` 每次啟動 3.6 到 7.1 秒、SCons 相依掃描 25 到 28 秒（47 個 .o 全部沿用、沒有重新連結）、燒錄約 10 秒。`lib_ldf_mode = off` 仍要 32 秒，所以時間不在 LDF。`pio run -t nobuild` 只要 11.8 秒。

## Clarifications

### Session 2026-11-27

依 `sdd-gate.md`「clarify 有合理預設時寫進 Assumptions 繼續」，以下問題以預設答案處理：

- Q：怎麼判斷「沒改」？→ A：`platformio.ini` 與 `src/`、`include/`、`lib/` 每個檔案的內容雜湊，加上執行的 PlatformIO Core（id、指令、PlatformIO 資料夾環境變數）。另外上次記錄的韌體檔（大小與修改時間）必須還在且沒被換過。
- Q：跳過編譯後怎麼燒錄？→ A：`pio run -t nobuild -t upload`。在容器以 PlatformIO 6.1.18 實測：AVR 的 nobuild 上傳和平常一樣寫入整個 `firmware.hex`；ESP32 的 nobuild 只寫 `0x10000 firmware.bin`，不寫 bootloader、分割表與 boot_app0。
- Q：ESP32 只寫主程式會不會出事？→ A：同一塊板子上次已由完整上傳寫好其他三個映像，所以安全；換成另一塊板子（例如老師用同一份程式燒很多塊板子）可能分割表或 otadata 不同。做法：只在上次完整燒錄的連接埠上走捷徑，燒錄時比對 esptool 印出的晶片 MAC，不同或讀不到就立刻再做一次完整上傳。不額外呼叫 `pio device list`，因為每次啟動 pio 就要 3.6 到 7.1 秒。
- Q：可以用 `PLATFORMIO_UPLOAD_FLAGS` 把 bootloader 等映像加進 nobuild 上傳嗎？→ A：不行。實測加了之後 PlatformIO 的 `project.checksum` 改變，整個建置資料夾被清掉，下一次要完整重建約 3 分鐘。擴充功能不能改動任何會影響建置設定的值。
- Q：要不要顯示「正在檢查變更…」？→ A：這次不改 WebView。捷徑直接進入「上傳程式」階段；需要完整建置時沿用 PR #302 的「編譯中」標籤。新增文字要動 15 個語系，等 Ray 看過效果再決定。

## 使用者情境與測試 *(必填)*

### 使用者故事 1－沒改程式再上傳一次很快（優先級：P1）

學生上傳後發現板子沒接好，接好後再按上傳；或老師按兩次上傳確認。程式沒改，所以直接燒錄上次的韌體，不再等套件確認與半分鐘的檔案檢查。

**獨立測試方式**：以注入的 PlatformIO 執行器跑兩次相同上傳，第二次只有一個 `run --target nobuild --target upload` 命令；在 Ray 的 Windows 上實測秒數。

**驗收情境**：

1. **Given** 上一次上傳已完整編譯並成功燒錄這塊 ESP32，**When** 不改程式再上傳，**Then** 不跑 `pio pkg install`，只跑一次 `pio run -t nobuild -t upload --upload-port <上次的埠>`，進度直接是「上傳程式」。
2. **Given** 上一次編譯成功但燒錄失敗（例如沒接板子），**When** 接好 AVR 板子再上傳，**Then** 直接燒錄，不重新編譯。
3. **Given** 改了任何積木，**When** 上傳，**Then** 照常完整編譯（但套件確認仍可跳過）。

### 使用者故事 2－換板子仍然正確（優先級：P1）

老師用同一份程式依序燒很多塊 ESP32。每換一塊，即使走了捷徑，也會因 MAC 不同立刻再完整燒錄一次，板子最後的內容和完整上傳相同。

**獨立測試方式**：注入不同 MAC 的燒錄輸出，確認 nobuild 之後接著跑完整上傳，且新板子被記住。

### 使用者故事 3－不能比原本更不可靠（優先級：P1）

任何判斷失敗（讀不到檔案、快取壞掉、韌體被刪、平台被移除、多個 env、平台用 URL）都退回原本的完整流程。

### 邊界情境

- `.pio` 或建置資料夾被刪 → 韌體記錄對不上，完整建置。
- nobuild 在燒錄前就失敗（找不到韌體）→ 忘掉記錄，同一次上傳接著完整建置。
- nobuild 燒錄時失敗（板子沒接）→ 照常回報燒錄失敗，不重新編譯。
- `platformio.ini` 改了 → 重新跑 `pio pkg install` 並完整建置。
- managed Core 把建置資料夾移到短路徑（spec 074 的 `PLATFORMIO_BUILD_DIR`）→ 快取檔跟著放在那裡。
- 使用者自己在 `lib/` 或 `include/` 加檔案 → 雜湊不同，完整建置；超過 500 個原始檔就不使用快取。
- 同一塊板子在兩次上傳之間被其他工具重刷而程式沒改 → 走捷徑只寫主程式（已知限制，見 Assumptions）。

## 需求 *(必填)*

- **FR-001**：同一份 `platformio.ini` 與 Core 已成功跑過 `pio pkg install`，且 ini 中每個平台資料夾仍在時，跳過 `pio pkg install`。
- **FR-002**：輸入雜湊與上次成功編譯相同、記錄的韌體檔未變時，以 `pio run -t nobuild -t upload` 燒錄。
- **FR-003**：ESP32 只在有上次完整燒錄的連接埠與晶片 MAC 時走捷徑，並固定 `--upload-port`；燒錄輸出的 MAC 不同或沒有 MAC 時立刻完整上傳。
- **FR-004**：完整建置開始前先清掉建置記錄；編譯成功（即使燒錄失敗）才記錄韌體。
- **FR-005**：`src/main.cpp` 內容相同時不重寫。
- **FR-006**：不改動任何 PlatformIO 建置設定或環境變數（避免 `project.checksum` 改變而完整重建）。
- **FR-007**：快取檔放在建置資料夾根目錄的 `singular-blockly-upload-cache.json`；讀寫失敗只影響速度。

## 成功標準 *(必填)*

- **SC-001**：Ray 的 Windows 上，沒改程式重複上傳 ESP32 從約 44 秒降到 20 秒以內（估計：pio 啟動與平台載入約 7 到 12 秒，燒錄約 10 秒）。
- **SC-002**：改了程式時的上傳時間不比現在長（少了 pkg install 約 5 秒）。
- **SC-003**：換板子後板子內容與完整上傳相同。

## Assumptions

- 已知限制：同一塊 ESP32 在兩次上傳之間被其他工具重刷、且這邊程式沒改，捷徑只寫主程式。機率低，且分割表通常仍是 Arduino 預設；若要排除，可在 Ray 決定後加一個「強制完整上傳」選項。
- Windows Defender 對 `.platformio` 與專案資料夾的即時掃描可能是掃描慢的主因，但需要系統管理員權限才能量測與排除，由 Ray 自行決定，擴充功能不處理。
