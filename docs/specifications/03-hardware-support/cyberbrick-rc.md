# CyberBrick ESP-NOW RC 與 ESP32 接收

> 來源：spec/029-espnow-rc-pairing、specs/045-rc-remove-rc-get-button，以及 [071 ESP32 接收規格](../../../specs/071-esp32-cyberbrick-rc/spec.md)。

## 現行通訊方式

CyberBrick 的 `rc_master_init` 和 `rc_send` 直接讀取 X12 的六個搖桿通道與四個按鈕，以 ESP-NOW 廣播。封包為小端序 `<B10h`，長度 21 bytes：第一個 byte 是配對 ID（1–255），後面依序是 L1、L2、L3、R1、R2、R3、K1、K2、K3、K4 的有號 16 位數值。頻道可設 1–11；發射與接收端必須使用相同頻道。配對 ID 只用於過濾教室裡其他組別的訊號，並非身分驗證或加密。

CyberBrick 接收端使用 `rc_slave_init`、`rc_wait_connection`、`rc_is_connected`、`rc_get_joystick`、`rc_get_joystick_mapped`、`rc_is_button_pressed`。舊數值按鈕積木 `rc_get_button` 只從工具箱移除，定義與產生器仍保留，以便舊工作區載入。

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
