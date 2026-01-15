# Quickstart: CyberBrick ESP-NOW RC 自定義配對積木

**Branch**: `029-espnow-rc-pairing` | **Date**: 2026-01-15

## 快速開始指南

本文件說明如何使用 ESP-NOW 自定義配對積木，讓兩台 CyberBrick Core 建立遙控通訊。

---

## 基本使用範例

### 發射端程式（遙控器）

```
[主程式]
├── [初始化發射端 配對ID: 42 頻道: 1]
└── [永遠執行]
    └── [發送資料]
```

生成的 MicroPython 程式碼：

```python
import network
import espnow
import struct
import time
import rc_module

# 配對 ID 42 → MAC 地址
_rc_pair_mac = b'\x02\x00\x00\x00\x00\x2a'

# 初始化 WiFi 和 ESP-NOW
_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.config(channel=1)

_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.add_peer(_rc_pair_mac, channel=1)

# 初始化 X12 擴展板
rc_module.rc_master_init()

# 主迴圈
while True:
    data = rc_module.rc_master_data() or (2048,)*6 + (1,)*4
    _espnow.send(_rc_pair_mac, struct.pack('10h', *data))
    time.sleep_ms(20)
```

---

### 接收端程式（遙控車）

```
[主程式]
├── [初始化接收端 配對ID: 42 頻道: 1]
├── [等待配對 超時: 30秒]
└── [永遠執行]
    ├── [如果 遠端搖桿L2 > 2100]
    │   └── [設定馬達 M1 速度: 500]
    ├── [否則如果 遠端搖桿L2 < 1900]
    │   └── [設定馬達 M1 速度: -500]
    └── [否則]
        └── [設定馬達 M1 速度: 0]
```

生成的 MicroPython 程式碼：

```python
import network
import espnow
import struct
import time
from machine import Pin
from neopixel import NeoPixel
from bbl.motors import MotorsController

# 配對 ID 42 → MAC 地址
_rc_pair_mac = b'\x02\x00\x00\x00\x00\x2a'

# 全域 RC 狀態
_rc_data = (2048, 2048, 2048, 2048, 2048, 2048, 1, 1, 1, 1)
_rc_connected = False
_rc_last_recv = 0

# ESP-NOW 接收 callback
def _rc_recv_cb(e):
    global _rc_data, _rc_connected, _rc_last_recv
    while True:
        mac, msg = e.irecv(0)
        if mac is None:
            return
        if mac == _rc_pair_mac and len(msg) == 20:
            _rc_data = struct.unpack('10h', msg)
            _rc_connected = True
            _rc_last_recv = time.ticks_ms()

# 初始化 WiFi 和 ESP-NOW
_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.config(channel=1)

_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.add_peer(_rc_pair_mac, channel=1)
_espnow.irq(_rc_recv_cb)

# 等待配對（30秒超時，藍色 LED 閃爍）
onboard_led = NeoPixel(Pin(8), 1)
_wait_start = time.ticks_ms()
while not _rc_connected and time.ticks_diff(time.ticks_ms(), _wait_start) < 30000:
    onboard_led[0] = (0, 0, 50)
    onboard_led.write()
    time.sleep_ms(250)
    onboard_led[0] = (0, 0, 0)
    onboard_led.write()
    time.sleep_ms(250)
onboard_led[0] = (0, 0, 0)
onboard_led.write()

# 硬體初始化
motors = MotorsController()

# 主迴圈
while True:
    # 檢查連線狀態
    if time.ticks_diff(time.ticks_ms(), _rc_last_recv) > 500:
        _rc_connected = False

    # 讀取遠端搖桿 L2 (index 1)
    joystick_l2 = _rc_data[1] if _rc_connected else 2048

    if joystick_l2 > 2100:
        motors.set_speed(1, 500)
    elif joystick_l2 < 1900:
        motors.set_speed(1, -500)
    else:
        motors.set_speed(1, 0)
```

---

## 配對說明

### 配對 ID 規則

| 情境           | 建議配置                                   |
| -------------- | ------------------------------------------ |
| 教室內 10 組   | 每組使用不同 ID (1-10)，相同頻道           |
| 大型活動 30 組 | ID 1-10 搭配頻道 1，ID 11-20 搭配頻道 2... |
| 個人開發       | 任意 ID，預設頻道 1                        |

### 配對成功判斷

1. 發射端程式啟動後開始發送資料
2. 接收端「等待配對」積木執行時，LED 藍色閃爍
3. 配對成功後 LED 停止閃爍
4. 「是否已連線」積木回傳 `True`

### 斷線處理

-   發射端關閉或超出範圍後約 500ms，接收端自動偵測斷線
-   斷線時搖桿值自動回歸中點 (2048)，馬達停止
-   使用「是否已連線」積木可判斷狀態

---

## 與 X12 積木混用

發射端可同時使用 X12 本機讀取積木和 ESP-NOW 發送積木：

```
[主程式]
├── [初始化發射端 配對ID: 42 頻道: 1]
└── [永遠執行]
    ├── [如果 按鈕K1被按下]  ← X12 積木（讀取本機）
    │   └── [設定板載LED 紅色]
    └── [發送資料]  ← ESP-NOW 積木（發送給接收端）
```

---

## 疑難排解

### 無法配對

1. 確認兩端的配對 ID 完全相同
2. 確認兩端的頻道完全相同
3. 確認發射端程式已開始執行（在迴圈中發送）
4. 檢查 X12 擴展板是否正確連接到發射端

### 延遲過高

1. 確保發射端在迴圈中持續發送（不要加額外 delay）
2. 減少接收端主迴圈中的處理時間
3. 避免在主迴圈中使用長時間 delay

### 馬達突然停止

1. 檢查發射端是否仍在運作
2. 這是正常的斷線保護機制
3. 重新啟動發射端後會自動恢復
