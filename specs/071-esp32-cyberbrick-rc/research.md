# 研究：ESP32 接收 CyberBrick RC 訊號

## 封包與板型

現有 `media/blockly/generators/micropython/rc.js` 使用 `struct.pack('<B10h', pair_id, *_data)` 廣播。X12 讀值順序為 L1、L2、L3、R1、R2、R3、K1、K2、K3、K4，共 21 bytes。`esp32` 設定為 `esp32dev` 和 `platformio/espressif32@7.0.1`；`supermini` 是非 ESP32 板型，不能沿用既有通信分類的寬鬆判斷。

## SDK 相容性

[PlatformIO 7.0.1 發布資料](https://github.com/platformio/platform-espressif32/releases/tag/v7.0.1)列出 Arduino 2.0.17 / IDF 4.4.7。[Espressif IDF 4.4.7 ESP-NOW API](https://docs.espressif.com/projects/esp-idf/en/v4.4.7/esp32/api-reference/network/esp_now.html)的接收回呼為 `const uint8_t *mac_addr, const uint8_t *data, int data_len`，在 Wi-Fi task 執行，不應進行耗時操作。[Wi-Fi channel API](https://docs.espressif.com/projects/esp-idf/en/v4.4.7/esp32/api-reference/network/esp_wifi.html)要求 Wi-Fi 啟動後設定頻道，並禁止於 STA 掃描或連接 AP 期間變更。故首版固定頻道獨立使用，不嘗試自動與 Wi-Fi／MQTT 共存。

## 契約與安全

接收端須逐 byte 解碼，不能直接 `memcpy` 至未保證 layout 的 C++ struct。接收回呼只接受 21 bytes 與指定配對 ID；配對 ID 僅作教室訊號過濾，不構成身分驗證。跨 Wi-Fi task 與 Arduino 主循環以短 critical section 保護資料快照；逾時讀值在讀取端計算，毋須額外維護工作。
