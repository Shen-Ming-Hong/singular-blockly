# 模型：快速重新上傳的建置快取

`UploadBuildCache.tla` 描述 spec 077（0.94.0 起）Arduino 上傳「程式沒改就直接燒錄上次的韌體」，以及它和編輯器自動存檔的互動。模型已更新為 spec 078 修正後的行為：三條性質都成立。

## 對應的程式

| 模型動作 | 程式位置 |
| --- | --- |
| `Edit`、`AutoSave` | `media/js/blocklyEdit.js` 的 `debouncedCodeUpdate`（300 ms）→ `src/webview/messageHandler.ts` 的 `handleUpdateCode`。上傳中編輯器不鎖定；`DeferWrites` 時上傳期間只留下最新一份，上傳結束（`handleRequestUpload` 的 `finally`）才寫入 |
| `ExternalEdit` | 在 Blockly 以外改 `src/`（VS Code 編輯器、git），擴充功能看不到 |
| `Click` | `handleUploadClick` 送出 `request.code` → `ArduinoUploader.upload()` 的 `saveCode()` |
| `Fingerprint` | `computeBuildInputs()` → `ArduinoBuildCache.computeInputs()`：當下讀 `src/` 算 buildKey |
| `Decide`、`ReuseFlash` | `findReuse()` → `canReuseBuild()`（比 buildKey 與韌體檔的大小和時間）→ `pio run -t nobuild -t upload` |
| `Invalidate` | `invalidateBuild()` |
| `SconsRead`、`Link`、`Flash` | `pio run -t upload`：相依掃描（約半分鐘）後 SCons 才讀 `src/main.cpp`、編譯並燒錄 |
| `MarkBuilt` | `markBuilt(fingerprint.inputs, …)`：用編譯前算的 buildKey；`RecheckBeforeMark` 時先 `isUnchangedSince()` 重算，不同就不記錄 |

簡化：程式內容只取兩種（`Code = {1, 2}`），編輯器最多改 3 次、外部最多改 1 次；只建模一個開發板、一個連接埠，不建模 `platformio.ini` 與 `pio pkg install` 那段（`prepareKey` 有同樣的問題，見下方）；燒錄一定成功。

## 性質

| 性質 | 白話 | 修正後 |
| --- | --- | --- |
| `RecordSound`（不變式） | 快取紀錄說「這份韌體是用程式 X 編的」，它就真的是用 X 編的 | 成立 |
| `ReuseFlashesCurrentSource`（不變式） | 顯示「沿用上次的韌體」時，燒進去的就是 `src/main.cpp` 現在的程式 | 成立 |
| `EventuallyConsistent`（活性） | 學生停止修改、持續按上傳，板子最後一定跑畫面上的程式 | 成立 |

## 兩個修正都需要

把 `.cfg` 的 `DeferWrites` 或 `RecheckBeforeMark` 任一個改成 `FALSE`，`RecordSound` 與 `ReuseFlashesCurrentSource` 都會再出現反例：

- 只有重算指紋：編輯器改成 B 又改回 A（ABA），重算的指紋仍是 A，照樣記錯。
- 只有延後寫入：在 VS Code 直接改 `src/` 時擴充功能看不到。

已知限制：一次建置期間在 Blockly 以外把同一個檔案改掉又改回原樣（`MaxExternal = 2`）仍會記錯，機率極低，不處理。上傳中切換開發板（`updateBoard` 改寫 `platformio.ini`）沒有建模。

## 修正前的反例（spec 078 之前）

**操作順序**（把兩個開關都設成 `FALSE` 時 TLC 找到的最短路徑）：

1. 畫面是程式 A，學生按上傳。擴充功能把 A 寫進 `src/main.cpp`，算出指紋 A。
2. 等編譯的半分鐘裡，學生又拖了一個積木（程式 B），300 ms 後自動存檔把 B 寫進 `src/main.cpp`。
3. PlatformIO 掃描完才讀檔，編出 B 的韌體、燒進板子，快取卻記成「指紋 A ＝ 這份韌體」。
4. 學生覺得剛剛那塊不對，按復原回到 A，再按上傳。
5. 指紋 A 和紀錄相符、韌體檔也沒變，於是顯示「沿用上次的韌體（沒有變更）」，把 **B** 燒進去。

**使用者會看到**：畫面是 A，上傳成功，板子跑的卻是 B。之後不管按幾次上傳都一樣（活性反例就是這個無限迴圈），直到再改任何一個積木、或刪掉 `.pio` 資料夾。學生和老師會以為是自己的積木寫錯。

**空窗**：從按上傳後算指紋，到 PlatformIO 讀 `src/main.cpp` 為止。ESP32 約十幾秒到半分鐘以上，Uno 幾秒。

**多常見**：要同時滿足「上傳中改了積木」和「之後又改回上傳當下的樣子」。前者在教室很常見（學生等編譯時會繼續拖）；後者靠復原（Ctrl+Z）或把剛拖的積木拿掉，偶爾發生。每個班級一學期遇到幾次是合理估計，但很難重現、很難被回報。

同樣的順序也會發生在 `platformio.ini`（`handleUpdateCode` 也會改 `lib_deps`／`build_flags`）。修正後上傳期間不再改寫它，`markPrepared` 前沒有另外重算；少了函式庫會直接編譯失敗，不會燒錯程式。
