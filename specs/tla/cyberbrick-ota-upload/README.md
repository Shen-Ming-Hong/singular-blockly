# 模型：CyberBrick Wi-Fi（OTA）上傳

`CyberBrickOtaUpload.tla` 描述 CyberBrick 透過 Wi-Fi 上傳 `/app/rc_main.py` 的現況：擴充功能端的兩次嘗試與逾時回復，以及板子端代理程式寫檔與重開機。

## 對應的程式

| 模型動作 | 程式位置 |
| --- | --- |
| `Start`、`A1Ok`、`A1Bad`、`A1Retry` | `src/services/cyberbrickOtaUploader.ts` `upload()`：代理程式夠新時先用 2 秒的短視窗直接上傳；逾時、5xx 或連線錯誤就重試 |
| `ReopenWithReset`、`ReopenNoReset` | `reopenUploadWindow()`：送 `POST /reset`（可能有效、可能沒有）再等 health |
| `A2Result`、`A2Timeout` | 第二次上傳，30 秒視窗 |
| `Recover` | `tryRecoverFromUploadTimeout()`：等 5 秒後 `GET /health`，同一個 deviceId 有回應就回報「OTA upload complete」，沒有比對檔案內容 |
| 逾時不中止請求 | `withTimeout()` 用 `Promise.race`，原本的 `fetch` 會繼續送 |
| `Accept`、`Finish` | `src/services/cyberbrickOtaAgentSource.ts` 的 `S()`、`U()`、`F()`：一次處理一個連線；`open(R,'wb')` 直接寫 `/app/rc_main.py`，`finally: f.close()` 一定會關檔；SHA-256 相符才回 200 並 `machine.reset()` |
| `AgentReset`、`PowerCycle` | 代理程式自己重開機；學生關掉再打開電源 |
| `Boot` | 官方 `boot.py` 會 `import rc_main`，OTA 代理程式也是由 `rc_main.py` 開頭的 bootstrap 啟動。檔案只寫了一半的 Python 會語法錯誤，所以**程式和 Wi-Fi 上傳都不會啟動** |

假設：板子的檔案系統是 LittleFS（MicroPython ESP32 預設），寫到一半斷電會保留舊檔，只有 `close()` 之後才生效。如果 CyberBrick 韌體用的是 FAT，斷電也會留下半截檔，情況更糟。簡化：Wi-Fi 最多斷 1 次、學生最多關電源 1 次；舊版代理程式（沒有 2 秒短視窗、只嘗試一次）沒有另外建模，它直接走第二次嘗試的路徑。

## 性質

| 性質 | 白話 | 現況 |
| --- | --- | --- |
| `NoTornFile`（不變式） | `rc_main.py` 永遠是完整的舊程式或新程式 | 有反例 |
| `SuccessMeansNewProgram`（不變式） | 畫面說「上傳完成」，板子存的就是新程式 | 有反例 |
| `SuccessNeverOnTornFile`（不變式） | 至少不會在檔案只寫一半時說成功 | 有反例 |
| `FailureKeepsBoardBootable`（不變式） | 畫面說「上傳失敗」，板子至少還能開機跑舊程式 | 有反例 |
| `UploadEnds`（活性） | 每次上傳最後都會有結果，不會一直轉圈 | 成立 |
| `EventuallyConsistent`（活性） | 最後畫面的結果和板子開機後的狀態一致 | 有反例 |

## 反例

### 1. 半截的 `rc_main.py`，下次開機什麼都不跑（`NoTornFile`、`FailureKeepsBoardBootable`）

**操作順序**：板子開始接收新程式 → Wi-Fi 在傳到一半時斷了，連線被關掉 → 代理程式收到的位元組不夠，但 `finally` 照樣關檔，`rc_main.py` 只剩前半段 → SHA-256 不符，不重開機，板子繼續跑記憶體裡的舊程式。

**使用者會看到**：畫面說「上傳失敗」（有時是逾時後的「成功」，見下一條），車子看起來照常動。等到下次關電源再開，車子完全不動，Wi-Fi 上傳也連不到，只能接 USB 重新上傳。學生不會把「昨天上傳失敗」和「今天車子壞了」聯想在一起。

**空窗**：從板子開始收檔到收完，幾 KB 的程式在正常 Wi-Fi 下不到 1 秒；Wi-Fi 不穩時會拉長到逾時（2 秒或 30 秒）。

**多常見**：需要「傳到一半斷線」。家裡少見；教室裡二三十台裝置擠同一個 AP、學生拿著車子走動時會發生。後果重（要 USB 救），所以排第一。

### 2. 兩次都逾時，卻說「上傳完成」（`SuccessMeansNewProgram`、`SuccessNeverOnTornFile`）

**操作順序**：2 秒的直接上傳逾時 → 重開視窗 → 第二次上傳 30 秒內沒有回應 → 等 5 秒問 health，板子有回應 → 回報「OTA upload complete」。這時板子可能根本沒收到新程式（還是舊的），也可能晚一點才收到被截斷的請求，留下半截檔。

**使用者會看到**：綠色的成功提示，車子卻還跑舊程式；學生以為新積木沒效、開始亂改。

**空窗**：整段約 40 秒以上的上傳期間。

**多常見**：需要兩次嘗試都逾時、之後板子又恢復回應，也就是 Wi-Fi 短暫卡住。比第 1 條常見一些，後果較輕（再上傳一次就好）。
