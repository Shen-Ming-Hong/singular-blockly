# Research: CyberBrick ESP-NOW RC 自定義配對積木

**Branch**: `029-espnow-rc-pairing` | **Date**: 2026-01-15

## 研究摘要

本文件記錄為實現 ESP-NOW 自定義配對機制所進行的技術研究，包含 MicroPython espnow 模組 API、配對 ID 轉 MAC 地址的設計決策、以及與現有 RC 積木的整合策略。

---

## 1. ESP-NOW MicroPython API 研究

### 1.1 核心 API 概述

根據 MicroPython 官方文檔，ESP32 上的 `espnow` 模組提供以下關鍵功能：

| API                               | 說明                     |
| --------------------------------- | ------------------------ |
| `ESPNow.active(True)`             | 啟用 ESP-NOW             |
| `ESPNow.add_peer(mac, channel=0)` | 註冊配對對象，可指定頻道 |
| `ESPNow.send(mac, data)`          | 發送資料到指定 MAC       |
| `ESPNow.recv(timeout_ms)`         | 同步接收資料             |
| `ESPNow.irecv(timeout_ms)`        | 迭代接收，適合 callback  |
| `ESPNow.irq(callback)`            | 設定非同步接收 callback  |
| `network.WLAN.config(channel=N)`  | 設定 WiFi 頻道           |

### 1.2 配對機制設計

**Decision**: 使用「配對 ID 轉換為虛擬 MAC 地址」的方案

**Rationale**:

-   ESP-NOW 需要 6-byte MAC 地址作為配對標識
-   使用者只需記住 1-255 的數字 ID，無需理解 MAC 地址
-   轉換公式：`b'\x02\x00\x00\x00\x00\x{ID}'`
    -   第一個 byte `\x02` 設定 locally administered bit，確保不與真實設備 MAC 衝突
-   WiFi 頻道 1-11 提供額外隔離層

**Alternatives Considered**:

1. 使用廣播 MAC `ff:ff:ff:ff:ff:ff` + 自定義封包標頭
    - 拒絕原因：所有設備都會收到封包，需要額外篩選邏輯
2. 動態 MAC 交換（handshake 協定）
    - 拒絕原因：增加配對複雜度，不適合教學環境

### 1.3 非同步接收架構

**Decision**: 採用 `espnow.irq(callback)` 非同步接收

**Rationale**:

-   根據 MicroPython 文檔，irq callback 應使用 `irecv(0)` 迴圈讀取所有緩衝區訊息
-   避免遺漏封包，確保接收端資料即時更新
-   不需要使用者手動加入「接收資料」積木，簡化程式設計

**Implementation Pattern**:

```python
def _rc_recv_cb(e):
    global _rc_data, _rc_connected, _rc_last_recv
    while True:
        mac, msg = e.irecv(0)
        if mac is None:
            return
        _rc_data = struct.unpack('10h', msg)  # 10 個 16-bit 整數
        _rc_connected = True
        _rc_last_recv = time.ticks_ms()
```

---

## 2. 資料格式設計

### 2.1 RC 資料結構

**Decision**: 沿用官方 10 元素 tuple 格式

| Index | 名稱 | 說明        | 範圍   |
| ----- | ---- | ----------- | ------ |
| 0     | L1   | 左搖桿 X 軸 | 0-4095 |
| 1     | L2   | 左搖桿 Y 軸 | 0-4095 |
| 2     | L3   | 左搖桿按壓  | 0-4095 |
| 3     | R1   | 右搖桿 X 軸 | 0-4095 |
| 4     | R2   | 右搖桿 Y 軸 | 0-4095 |
| 5     | R3   | 右搖桿按壓  | 0-4095 |
| 6     | K1   | 按鈕 1      | 0/1    |
| 7     | K2   | 按鈕 2      | 0/1    |
| 8     | K3   | 按鈕 3      | 0/1    |
| 9     | K4   | 按鈕 4      | 0/1    |

**Wire Format**: 使用 `struct.pack('10h', *data)` 打包為 20 bytes

**Rationale**:

-   與現有 `rc_module.rc_master_data()` 格式相容
-   20 bytes 遠小於 ESP-NOW 250 bytes 上限

### 2.2 安全預設值

| 資料類型 | 安全值 | 說明               |
| -------- | ------ | ------------------ |
| 搖桿     | 2048   | ADC 中點，馬達停止 |
| 按鈕     | 1      | 放開狀態           |

---

## 3. 連線狀態管理

### 3.1 斷線偵測

**Decision**: 500ms 超時判定斷線

**Rationale**:

-   發射端以 50Hz (20ms) 頻率發送，正常情況 500ms 會收到 25 筆資料
-   500ms 足夠容忍短暫干擾，但不會讓遙控車失控太久

**Implementation**:

```python
# 在資料讀取時檢查
def _check_connected():
    global _rc_connected
    if time.ticks_diff(time.ticks_ms(), _rc_last_recv) > 500:
        _rc_connected = False
    return _rc_connected
```

### 3.2 等待配對機制

**Decision**: 阻塞等待 + LED 閃爍 + 超時退出

**Rationale**:

-   阻塞等待符合 Blockly 順序執行的教學邏輯
-   LED 閃爍提供視覺回饋
-   超時後程式繼續執行，讓使用者自行決定後續處理

---

## 4. 與現有系統的整合

### 4.1 與 X12 積木的關係

**現有架構**:

-   `x12_get_joystick` → 讀取本機 X12 擴展板資料 (透過 `rc_master_data()`)
-   `rc_get_joystick` → 讀取遠端資料 (透過 `rc_slave_data()`)

**新架構**:

-   X12 積木保持不變，讀取本機資料
-   新增 `rc_espnow_*` 系列積木，使用自定義 ESP-NOW
-   現有 `rc_*` 積木可考慮棄用或維持相容

**Decision**: 新增獨立的 `rc_espnow_*` 積木系列

**Rationale**:

-   不破壞現有使用官方 `rc_module` 的專案
-   積木名稱明確區分功能來源
-   未來可考慮合併或提供遷移路徑

### 4.2 程式碼生成策略

**發射端流程**:

1. `rc_espnow_master_init` → 設定 MAC、頻道、初始化 ESP-NOW
2. 迴圈中 `rc_espnow_send` → 讀取 `rc_master_data()`、打包、發送、delay 20ms

**接收端流程**:

1. `rc_espnow_slave_init` → 設定 MAC、頻道、初始化 ESP-NOW、註冊 irq callback
2. `rc_espnow_wait_connection` → 阻塞等待 + LED 閃爍
3. 迴圈中使用 `rc_get_joystick` 等讀取積木（共用現有積木但改用全域 `_rc_data`）

---

## 5. i18n 考量

### 5.1 新增翻譯鍵

需新增約 15-20 個翻譯鍵，分佈於：

-   積木標籤（init, send, wait, is_connected）
-   欄位提示（配對 ID、WiFi 頻道、超時秒數）
-   工具提示（tooltip）

### 5.2 翻譯策略

-   優先完成 zh-hant 和 en
-   其他 13 種語言可使用 AI 輔助翻譯後人工校對
-   使用 `npm run validate:i18n` 驗證完整性

---

## 6. 測試策略

### 6.1 硬體測試

| 測試案例 | 所需設備                    | 驗證項目                      |
| -------- | --------------------------- | ----------------------------- |
| 基本配對 | 2x CyberBrick Core          | 相同 ID 可通訊                |
| 隔離測試 | 4x CyberBrick Core          | 不同 ID 互不干擾              |
| 頻道隔離 | 4x CyberBrick Core          | 不同頻道互不干擾              |
| 斷線測試 | 2x CyberBrick Core          | 關閉發射端後 500ms 內偵測斷線 |
| 延遲測試 | 2x CyberBrick Core + 示波器 | 搖桿到馬達 <100ms             |

### 6.2 程式碼生成測試

-   驗證生成的 MicroPython 程式碼語法正確
-   驗證 import 和 hardware init 不重複
-   驗證與 X12 積木混用時的程式碼正確性

---

## 7. 未解決問題

所有 NEEDS CLARIFICATION 項目已在 spec.md 中釐清：

-   ✅ 等待配對超時行為 → 超時後結束等待，程式繼續
-   ✅ 接收架構選擇 → irq callback 非同步
-   ✅ 發送頻率控制 → 發送積木自動附加 20ms delay

---

## 8. 實作經驗與關鍵發現 (2026-01-15 實測)

### 8.1 廣播模式取代虛擬 MAC

**重大設計變更**: 放棄虛擬 MAC 方案，改用廣播模式

**原設計**:

```python
# 配對 ID 轉虛擬 MAC (不可行！)
mac = b'\x02\x00\x00\x00\x00' + bytes([pair_id])
espnow.add_peer(mac)
espnow.send(mac, data)  # ❌ ESP-NOW 無法發送到虛擬 MAC
```

**新設計**:

```python
# 使用廣播 MAC + 封包內嵌配對 ID
broadcast = b'\xff\xff\xff\xff\xff\xff'
espnow.add_peer(broadcast)
espnow.send(broadcast, struct.pack('<B10h', pair_id, *data))  # ✅ 可運作
```

**原因**: ESP-NOW 的 `send()` 只能發送到實際存在的 MAC 地址或廣播地址，無法發送到自定義虛擬 MAC。

### 8.2 WiFi 頻道設定關鍵步驟

**問題**: 直接呼叫 `wlan.config(channel=N)` 可能失敗，導致發送端和接收端不在同頻道。

**解決方案**:

```python
wlan = network.WLAN(network.WLAN.IF_STA)
wlan.active(True)
wlan.disconnect()       # ⚠️ 關鍵！必須先斷開連線
time.sleep_ms(100)      # 等待狀態穩定
wlan.config(channel=1)  # 現在可以正確設定頻道
```

### 8.3 struct 封包格式注意事項

**問題**: MicroPython 的 `struct.pack()` 會有記憶體對齊 padding。

| 格式      | 預期大小 | 實際大小 |
| --------- | -------- | -------- |
| `'B10h'`  | 21 bytes | 22 bytes |
| `'<B10h'` | 21 bytes | 22 bytes |

**解決方案**: 接收端必須使用：

```python
if len(msg) >= 21 and msg[0] == pair_id:
    data = struct.unpack('<10h', msg[1:21])  # 明確指定 slice
```

### 8.4 rc_module 與 ESP-NOW 的衝突

**發現**: 原本的 `rc_module` 函式庫會與 ESP-NOW 衝突，導致裝置當機。

**解決方案**: 完全移除對 `rc_module` 的依賴，使用直接硬體存取：

```python
# X12 硬體直接存取 (不使用 rc_module)
_x12_adc = {}
for _i, _p in enumerate([0, 1, 2, 3, 4, 5]):
    _x12_adc[_i] = ADC(Pin(_p))
    _x12_adc[_i].atten(ADC.ATTN_11DB)
_x12_btn = {
    6: Pin(6, Pin.IN, Pin.PULL_UP),
    7: Pin(7, Pin.IN, Pin.PULL_UP),
    8: Pin(21, Pin.IN, Pin.PULL_UP),  # K3 = GPIO21
    9: Pin(20, Pin.IN, Pin.PULL_UP)   # K4 = GPIO20
}
```

### 8.5 X12 按鈕 GPIO 映射

**硬體映射確認**:
| 按鈕 | GPIO | 說明 |
|------|------|------|
| K1 | 6 | 按下=0, 放開=1 |
| K2 | 7 | 按下=0, 放開=1 |
| K3 | 21 | 注意：不是連續編號！ |
| K4 | 20 | 注意：不是連續編號！ |

### 8.6 hardwareInit 排序保證

**問題**: ESP-NOW 初始化必須在 RC 資料讀取之前完成。

**解決方案**: 在 `micropythonGenerator.finish()` 中按 key 排序 hardwareInit：

```javascript
// 按 key 排序，確保 'espnow_*' 在 'x12_*' 之前
const hardwareInitKeys = Array.from(this.hardwareInit_.keys()).sort();
const hardwareInit = hardwareInitKeys.map(k => this.hardwareInit_.get(k)).join('\n');
```

### 8.7 長時間運作穩定性問題 (2026-01-15 補充)

**問題**: 發射端連續運作一段時間後會變得不穩定，需要 reset 才能恢復。

**根本原因**:

1. ESP-NOW 發送緩衝區滿時會回傳 `ESP_ERR_ESPNOW_NO_MEM`
2. MicroPython 官方文檔指出：「when this happens, you can delay a while before sending the next data」
3. 連續快速發送會導致封包堆積在內部緩衝區

**解決方案**:

```python
# 1. 增加 rxbuf 大小 (預設 526 bytes → 1024 bytes)
_espnow.config(rxbuf=1024)

# 2. 檢查發送結果，失敗時延遲重試
if _espnow.send(mac, data):
    # 發送成功
    fail_count = 0
else:
    # 發送失敗（廣播無 ACK，通常是緩衝區問題）
    fail_count += 1

# 3. 連續失敗多次時重新初始化 ESP-NOW
if fail_count > 10:
    _espnow.active(False)
    time.sleep_ms(50)
    _espnow.active(True)
    _espnow.add_peer(broadcast)
    fail_count = 0
```

**最佳實踐來源**:

-   [ESP-IDF 官方文檔](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html): 建議發送失敗時延遲再試
-   [Reddit 討論](https://www.reddit.com/r/esp32/comments/uy3p59/): 在發送後加入 1ms 延遲可解決 NO_MEM 問題
-   [MicroPython espnow 文檔](https://docs.micropython.org/en/v1.26.0/library/espnow.html): 建議增加 rxbuf 以處理高頻傳輸

### 8.8 接收端長時間運作穩定性 (2026-01-16 補充)

**問題**: 接收端在長時間運作後會變得不穩定，訊號接收不正常。

**根本原因分析**:

1. **記憶體洩漏**: MicroPython 在長時間運行時，頻繁的 struct.unpack 和 tuple 創建會累積記憶體碎片
2. **irq callback 異常未處理**: callback 中的異常會導致 ESP-NOW 模組狀態不一致
3. **無斷線重連機制**: 發射端重啟後，接收端無法自動恢復連線

**解決方案**:

```python
import gc

# 1. irq callback 加入 try-except 防止異常導致系統卡死
def _rc_recv_cb(e):
    global _rc_data, _rc_connected, _rc_last_recv, _rc_recv_count
    try:
        while True:
            mac, msg = e.irecv(0)
            if mac is None:
                return
            if len(msg) >= 21 and msg[0] == _rc_pair_id:
                _rc_data = struct.unpack('<10h', msg[1:21])
                _rc_connected = True
                _rc_last_recv = time.ticks_ms()
                _rc_recv_count += 1
    except Exception:
        pass  # 防止 irq 異常導致系統卡死

# 2. 維護函數：定期垃圾回收 + 斷線重連
def _rc_maintenance():
    global _rc_last_gc, _rc_connected, _espnow
    now = time.ticks_ms()

    # 每 30 秒執行一次垃圾回收
    if time.ticks_diff(now, _rc_last_gc) > 30000:
        gc.collect()
        _rc_last_gc = now

    # 斷線超過 5 秒，嘗試重新初始化 ESP-NOW
    if _rc_connected and time.ticks_diff(now, _rc_last_recv) > 5000:
        try:
            _espnow.active(False)
            time.sleep_ms(100)
            _espnow.active(True)
            _espnow.config(rxbuf=1024)
            _espnow.irq(_rc_recv_cb)
            _rc_connected = False
        except Exception:
            pass

    # 回傳連線狀態 (500ms 內有收到資料)
    return _rc_connected and time.ticks_diff(now, _rc_last_recv) < 500
```

**設計決策**: 將 `_rc_maintenance()` 整合到 `rc_is_connected` 積木中，使用者只需在主迴圈檢查連線狀態，就會自動執行維護。

### 8.9 禁止 WiFi 自動重連 (sta.config(reconnects=0))

**問題根源** (來自 MicroPython 官方文件):
> "MicroPython re-scans wifi channels when trying to reconnect... This means ESPNow messages will be lost while scanning for the AP. This can be disabled by `sta.config(reconnects=0)`"

當 ESP32 嘗試重新連接 WiFi AP 時，會自動掃描頻道，這會**干擾 ESP-NOW 通訊**，導致訊息遺失。

**解決方案**:
```python
_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.disconnect()
_wlan.config(reconnects=0)  # 禁止自動重連避免頻道掃描干擾 ESP-NOW
time.sleep_ms(100)
_wlan.config(channel=N)
```

**效果**: 發送端和接收端都加入此設定，確保 WiFi 不會自動掃描頻道，維持 ESP-NOW 頻道穩定。

---

## 參考資料

1. [MicroPython espnow 文檔](https://docs.micropython.org/en/latest/library/espnow.html)
2. [ESP-NOW 官方說明](https://www.espressif.com/en/products/software/esp-now/overview)
3. [ESP-IDF ESP-NOW API](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/network/esp_now.html)
4. 現有 RC 積木實作：`media/blockly/blocks/rc.js`, `media/blockly/generators/micropython/rc.js`
