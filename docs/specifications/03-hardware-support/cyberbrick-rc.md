# CyberBrick ESP-NOW RC 配對積木規格

> 來源：spec/029-espnow-rc-pairing（2026-01）

## 概述

**目標**：實作 CyberBrick ESP-NOW 自定義配對機制，取代官方廣播模式，透過「配對 ID」(1-255) 搭配「WiFi 頻道」(1-11) 隔離多組遙控訊號，解決教室多組同時使用的干擾問題。

**狀態**：✅ 完成

---

## 背景與動機

CyberBrick 官方 `rc_module` 使用 ESP-NOW 廣播模式，導致教室環境中多組同時使用時訊號互相干擾。本功能允許每組設定專屬配對 ID，各組通訊完全隔離。

---

## 技術架構

### 配對機制

- **配對 ID → MAC 地址**：`配對ID` 轉換為 `b'\x02\x00\x00\x00\x00\x{ID}'` 格式的 MAC 地址
- **WiFi 頻道**：搭配配對 ID 進一步隔離，可選 1-11
- **斷線預設值**：搖桿值 2048（中點）、按鈕值 1（放開），確保斷線時遙控車不失控

### 發射端

使用 `rc_module.rc_master_data()` 讀取 X12 擴展板感測器，透過自定義 ESP-NOW 發送至目標 MAC 地址。

### 接收端

透過自定義 ESP-NOW 接收資料，存入全域變數，供現有 `rc_get_joystick`、`rc_is_button_pressed` 等讀取積木使用。

---

## 積木清單

| 積木                    | 類型 | 用途                                    |
| ----------------------- | ---- | --------------------------------------- |
| `rc_pair_init_sender`   | 語句 | 發射端初始化（配對 ID、WiFi 頻道）      |
| `rc_pair_init_receiver` | 語句 | 接收端初始化（配對 ID、WiFi 頻道）      |
| `rc_pair_send`          | 語句 | 發射端發送 X12 感測器資料（放在迴圈中） |
| `rc_pair_wait`          | 語句 | 接收端等待配對（帶可選超時）            |
| `rc_pair_is_connected`  | 布林 | 檢查是否已建立連線                      |

**視覺回饋**：接收端等待配對時，板載 LED 以藍色 500ms 間隔閃爍；收到第一筆資料後停止閃爍。

---

## 安全預設值

| 資料類型 | 斷線預設值 | 說明                 |
| -------- | ---------- | -------------------- |
| 搖桿值   | 2048       | 對應馬達停止（中點） |
| 按鈕值   | 1          | 對應「放開」狀態     |

超過 500ms 未收到資料視為斷線，自動套用預設值。

---

## 相關文件

- [CyberBrick 擴展板](cyberbrick-expansion-boards.md) - X12 擴展板感測器
- [CyberBrick MicroPython](cyberbrick-micropython.md) - MicroPython 整體架構
