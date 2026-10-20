# CyberBrick ESP-NOW RC 與 ESP32 接收

> 來源：spec/029-espnow-rc-pairing、specs/045-rc-remove-rc-get-button，以及 [071 ESP32 接收規格](../../../specs/071-esp32-cyberbrick-rc/spec.md)。

## 現行通訊方式

CyberBrick 的 `rc_master_init` 和 `rc_send` 直接讀取 X12 的六個搖桿通道與四個按鈕，以 ESP-NOW 廣播。封包為小端序 `<B10h`，長度 21 bytes：第一個 byte 是配對 ID（1–255），後面依序是 L1、L2、L3、R1、R2、R3、K1、K2、K3、K4 的有號 16 位數值。頻道可設 1–11；發射與接收端必須使用相同頻道。配對 ID 只用於過濾教室裡其他組別的訊號，並非身分驗證或加密。

CyberBrick 接收端使用 `rc_slave_init`、`rc_wait_connection`、`rc_is_connected`、`rc_get_joystick`、`rc_get_joystick_mapped`、`rc_is_button_pressed`。舊數值按鈕積木 `rc_get_button`（與發射端的 `x12_get_button`）已完全移除；舊工作區載入時由 `blocklyRuntime.normalizeWorkspaceState` 改寫成「`rc_is_button_pressed` ? 0 : 1」，行為不變。

## 與 OTA 共存的 Wi-Fi channel（062）

> 來源：specs/062-cyberbrick-ota-rc-channel-conflict（2026-06）；交付紀錄：[PR #92](https://github.com/Shen-Ming-Hong/singular-blockly/pull/92)

ESP32 的 STA 一旦連上 AP，ESP-NOW 的 RF channel 就由 AP 決定，無法另外設定。因此 RC 初始化不能只因裝置存在 OTA 設定就保留 Wi-Fi，否則 AP 不在線時兩台裝置會停在不一致的 channel 上，RC 失效。

RC master／slave 生成碼（`media/blockly/generators/micropython/rc.js` 的 `_buildOtaWifiGuard()`）內嵌 `_rc_should_keep_wifi_for_ota()`：

| 情境 | 回傳 | RC 行為 |
| --- | --- | --- |
| OTA config 有 SSID 與 token，且 STA 已連上 AP | `True` | 保留 AP channel，不 `disconnect()`、不改 channel，OTA 可直接上傳 |
| 有 OTA config 但 STA 未連線 | `False` | `disconnect()`、`reconnects=0`，改用積木設定的 channel |
| 沒有 OTA config | `False` | 同上 |
| 讀取 `network` 或 Wi-Fi 狀態發生任何例外 | `False` | 同上（安全降級，不阻擋 RC 主流程） |

OTA bootstrap（`src/services/cyberbrickOtaAgentSource.ts` 寫入 `/app/rc_main.py` 的區塊）在原有短暫等待 agent 狀態 `Y[0] > 1` 之後，再以每 100 ms 檢查一次、最多約 5 秒等待 STA 連線；已連線或 agent 已完成連線流程就提早結束。等待後仍未連線時，停止 STA 背景連線與掃描（`disconnect()` 並設 `reconnects=0`），讓 RC 可用積木 channel 初始化。OTA agent body 與目標版本不因此修改。

| 兩台裝置狀態 | 結果 |
| --- | --- |
| 都有 OTA 且 AP 在線 | 使用 AP channel，RC 與 OTA 同時可用 |
| 都有 OTA 但 AP 不在線 | 約 5 秒後退回積木 channel，RC 可連線 |
| 一台有 OTA、一台沒有，AP 不在線 | 都使用積木 channel，RC 正常 |
| 一台有 OTA 且 AP 在線、另一台沒有 OTA | 可能 channel 不一致而失敗；這是接受的設計邊界 |

`RC_MASTER_INIT_TOOLTIP`、`RC_SLAVE_INIT_TOOLTIP` 以學生能懂的語氣說明兩台要用相同 channel；OTA provisioning 成功後另顯示 `CYBERBRICK_OTA_RC_CHANNEL_NOTE` 說明上述規則，15 個語系同步維護。

## ESP32 DevKit 實驗性接收

ESP32 DevKit 的獨立「RC 連線」分類提供六種積木：`esp32_rc_receiver_init`、`esp32_rc_wait_connection`、`esp32_rc_is_connected`、`esp32_rc_get_joystick`、`esp32_rc_get_joystick_mapped`、`esp32_rc_is_button_pressed`。它們接收本專案 CyberBrick 發射積木的訊號，不支援原廠遙控協定。六種積木沿用黃色發光虛線和實驗功能提醒；分類只在 `esp32` 板型顯示。

ESP32 只接受長度正好 21 bytes、配對 ID 相符、六軸值在 0–4095 且四按鈕值為 0 或 1 的封包。任一值不合法即拒收整包，不刷新最後有效封包時間。超過 1.5 秒沒有有效封包、缺少初始化積木或初始化失敗時，連線狀態為 false，搖桿回傳 2048，按鈕回傳未按下。等待積木在指定時間到後繼續執行。

首版使用固定頻道。RC 初始化會主動斷開當時的 Wi-Fi 連線並停用自動重連，因此若要與 Wi-Fi／MQTT 共用，應先初始化 RC，再執行 Wi-Fi 連線，並將 Wi-Fi 基地台固定在 RC 發射端與接收端使用的頻道。Wi-Fi 連線積木會恢復自動重連；不同頻道的連線或掃描仍可能使 RC 接收中斷。工作區同時包含 RC 初始化與 Wi-Fi 連線積木時，兩者會顯示此順序及頻道警告；此版本不自動協調頻道。

## 安全預設值

| 資料類型 | 斷線預設值 | 說明 |
| --- | --- | --- |
| 搖桿值 | 2048 | 搖桿中點 |
| 按鈕狀態 | 未按下 | 不因舊封包持續觸發按鈕動作 |

2048 是搖桿中點，映射後的值取決於使用者設定的範圍，不能保證讓馬達停止。控制馬達時應以「是否連線」積木判斷，斷線時明確設定馬達停止。

## 相關文件

- [CyberBrick 擴展板](cyberbrick-expansion-boards.md)
- [CyberBrick MicroPython](cyberbrick-micropython.md)
