# Data Model: CyberBrick ESP-NOW RC 自定義配對積木

**Branch**: `029-espnow-rc-pairing` | **Date**: 2026-01-15

## 實體定義

### 1. 配對 ID (Pair ID)

| 屬性    | 類型    | 範圍  | 說明                       |
| ------- | ------- | ----- | -------------------------- |
| `value` | Integer | 1-255 | 用於區隔不同組別的配對標識 |

**衍生值**:

-   MAC 地址：`b'\x02\x00\x00\x00\x00\x{value}'`
-   第一個 byte `0x02` 設定 locally administered bit

**驗證規則**:

-   超出範圍時自動限制：`max(1, min(255, value))`

---

### 2. WiFi 頻道 (Channel)

| 屬性    | 類型    | 範圍 | 說明                      |
| ------- | ------- | ---- | ------------------------- |
| `value` | Integer | 1-11 | WiFi 頻道，提供額外隔離層 |

**驗證規則**:

-   超出範圍時自動限制：`max(1, min(11, value))`

**預設值**: `1`（建議大多數情況使用預設）

---

### 3. RC 資料 (RC Data)

| Index | 名稱 | 類型   | 範圍   | 預設值 | 說明                     |
| ----- | ---- | ------ | ------ | ------ | ------------------------ |
| 0     | L1   | uint16 | 0-4095 | 2048   | 左搖桿 X 軸 ADC          |
| 1     | L2   | uint16 | 0-4095 | 2048   | 左搖桿 Y 軸 ADC          |
| 2     | L3   | uint16 | 0-4095 | 2048   | 左搖桿按壓 ADC           |
| 3     | R1   | uint16 | 0-4095 | 2048   | 右搖桿 X 軸 ADC          |
| 4     | R2   | uint16 | 0-4095 | 2048   | 右搖桿 Y 軸 ADC          |
| 5     | R3   | uint16 | 0-4095 | 2048   | 右搖桿按壓 ADC           |
| 6     | K1   | uint16 | 0/1    | 1      | 按鈕 1（0=按下, 1=放開） |
| 7     | K2   | uint16 | 0/1    | 1      | 按鈕 2                   |
| 8     | K3   | uint16 | 0/1    | 1      | 按鈕 3                   |
| 9     | K4   | uint16 | 0/1    | 1      | 按鈕 4                   |

**Wire Format**: `struct.pack('10h', *data)` → 20 bytes

**安全預設值 Tuple**: `(2048, 2048, 2048, 2048, 2048, 2048, 1, 1, 1, 1)`

---

### 4. 連線狀態 (Connection State)

| 屬性            | 類型    | 說明                           |
| --------------- | ------- | ------------------------------ |
| `_rc_connected` | Boolean | 是否已連線（500ms 內收到資料） |
| `_rc_last_recv` | Integer | 最後接收時間戳（ticks_ms）     |
| `_rc_data`      | Tuple   | 最新接收的 10 元素資料         |

**狀態轉換**:

```
[未連線] ---(收到資料)---> [已連線]
   ^                          |
   |                          |
   +-----(500ms 無資料)-------+
```

---

### 5. 等待配對參數

| 屬性              | 類型    | 範圍 | 預設值      | 說明                    |
| ----------------- | ------- | ---- | ----------- | ----------------------- |
| `timeout_sec`     | Integer | 1-60 | 30          | 等待超時秒數            |
| `led_interval_ms` | Integer | -    | 500         | LED 閃爍間隔            |
| `led_color`       | Tuple   | RGB  | (0, 0, 255) | 等待時 LED 顏色（藍色） |

---

## 積木定義

### 發射端積木

#### `rc_espnow_master_init`

-   **類型**: Statement
-   **欄位**:
    -   PAIR_ID: Number (1-255)
    -   CHANNEL: Number (1-11)
-   **顏色**: 160 (藍綠色)
-   **生成程式碼**: 初始化 ESP-NOW、設定頻道、新增 peer

#### `rc_espnow_send`

-   **類型**: Statement
-   **欄位**: 無
-   **顏色**: 160
-   **生成程式碼**: 讀取 `rc_master_data()`、打包、發送、delay 20ms

---

### 接收端積木

#### `rc_espnow_slave_init`

-   **類型**: Statement
-   **欄位**:
    -   PAIR_ID: Number (1-255)
    -   CHANNEL: Number (1-11)
-   **顏色**: 160
-   **生成程式碼**: 初始化 ESP-NOW、設定頻道、新增 peer、註冊 irq callback

#### `rc_espnow_wait_connection`

-   **類型**: Statement
-   **欄位**:
    -   TIMEOUT: Number (秒, 預設 30)
-   **顏色**: 160
-   **生成程式碼**: 迴圈等待 `_rc_connected=True`、LED 閃爍

#### `rc_espnow_is_connected`

-   **類型**: Output (Boolean)
-   **欄位**: 無
-   **顏色**: 160
-   **生成程式碼**: 檢查連線狀態並回傳

---

### 資料讀取積木

#### `rc_espnow_get_joystick`

-   **類型**: Output (Number)
-   **欄位**:
    -   CHANNEL: Dropdown (L1, L2, L3, R1, R2, R3)
-   **顏色**: 160
-   **生成程式碼**: 回傳 `(_rc_data[{index}] if _rc_connected else 2048)`

#### `rc_espnow_get_joystick_mapped`

-   **類型**: Output (Number)
-   **欄位**:
    -   CHANNEL: Dropdown (L1, L2, L3, R1, R2, R3)
-   **輸入**:
    -   MIN: Number input (預設 -100)
    -   MAX: Number input (預設 100)
-   **顏色**: 160
-   **生成程式碼**: 映射 0-4095 → 使用者指定範圍，斷線時回傳映射後的中點值

#### `rc_espnow_is_button_pressed`

-   **類型**: Output (Boolean)
-   **欄位**:
    -   BUTTON: Dropdown (K1, K2, K3, K4)
-   **顏色**: 160
-   **生成程式碼**: 回傳 `(_rc_data[{6+index}] == 0 if _rc_connected else False)`

#### `rc_espnow_get_button`

-   **類型**: Output (Number)
-   **欄位**:
    -   BUTTON: Dropdown (K1, K2, K3, K4)
-   **顏色**: 160
-   **生成程式碼**: 回傳按鈕原始狀態 `(_rc_data[{6+index}] if _rc_connected else 1)`

**設計決策**: 新增 `rc_espnow_*` 前綴的讀取積木，與現有 RC 積木分開，保持模組化。

---

## 全域變數對照表

| 變數名稱        | 類型   | 初始值     | 用途           |
| --------------- | ------ | ---------- | -------------- |
| `_rc_pair_mac`  | bytes  | None       | 配對 MAC 地址  |
| `_rc_data`      | tuple  | 安全預設值 | 最新接收資料   |
| `_rc_connected` | bool   | False      | 連線狀態       |
| `_rc_last_recv` | int    | 0          | 最後接收時間戳 |
| `_espnow`       | ESPNow | None       | ESP-NOW 實例   |

---

## Toolbox 結構

```json
{
	"kind": "category",
	"name": "%{CATEGORY_RC_ESPNOW}",
	"colour": "160",
	"contents": [
		{ "kind": "label", "text": "%{RC_ESPNOW_LABEL_MASTER}" },
		{ "kind": "block", "type": "rc_espnow_master_init" },
		{ "kind": "block", "type": "rc_espnow_send" },

		{ "kind": "label", "text": "%{RC_ESPNOW_LABEL_SLAVE}" },
		{ "kind": "block", "type": "rc_espnow_slave_init" },
		{ "kind": "block", "type": "rc_espnow_wait_connection" },

		{ "kind": "label", "text": "%{RC_ESPNOW_LABEL_DATA}" },
		{ "kind": "block", "type": "rc_espnow_get_joystick" },
		{ "kind": "block", "type": "rc_espnow_get_joystick_mapped" },
		{ "kind": "block", "type": "rc_espnow_is_button_pressed" },
		{ "kind": "block", "type": "rc_espnow_get_button" },

		{ "kind": "label", "text": "%{RC_ESPNOW_LABEL_STATUS}" },
		{ "kind": "block", "type": "rc_espnow_is_connected" }
	]
}
```

---

## i18n 鍵清單

### 類別與標籤

-   `CATEGORY_RC_ESPNOW`
-   `RC_ESPNOW_LABEL_MASTER`
-   `RC_ESPNOW_LABEL_SLAVE`
-   `RC_ESPNOW_LABEL_DATA`
-   `RC_ESPNOW_LABEL_STATUS`

### 發射端積木

-   `RC_ESPNOW_MASTER_INIT`
-   `RC_ESPNOW_MASTER_INIT_PAIR_ID`
-   `RC_ESPNOW_MASTER_INIT_CHANNEL`
-   `RC_ESPNOW_MASTER_INIT_TOOLTIP`
-   `RC_ESPNOW_SEND`
-   `RC_ESPNOW_SEND_TOOLTIP`

### 接收端積木

-   `RC_ESPNOW_SLAVE_INIT`
-   `RC_ESPNOW_SLAVE_INIT_PAIR_ID`
-   `RC_ESPNOW_SLAVE_INIT_CHANNEL`
-   `RC_ESPNOW_SLAVE_INIT_TOOLTIP`
-   `RC_ESPNOW_WAIT_CONNECTION`
-   `RC_ESPNOW_WAIT_TIMEOUT`
-   `RC_ESPNOW_WAIT_SECONDS`
-   `RC_ESPNOW_WAIT_TOOLTIP`
-   `RC_ESPNOW_IS_CONNECTED`
-   `RC_ESPNOW_IS_CONNECTED_TOOLTIP`

### 資料讀取積木

-   `RC_ESPNOW_GET_JOYSTICK_PREFIX`
-   `RC_ESPNOW_GET_JOYSTICK_TOOLTIP`
-   `RC_ESPNOW_GET_JOYSTICK_MAPPED_PREFIX`
-   `RC_ESPNOW_GET_JOYSTICK_MAPPED_MIN`
-   `RC_ESPNOW_GET_JOYSTICK_MAPPED_MAX`
-   `RC_ESPNOW_GET_JOYSTICK_MAPPED_TOOLTIP`
-   `RC_ESPNOW_IS_BUTTON_PRESSED_PREFIX`
-   `RC_ESPNOW_IS_BUTTON_PRESSED_SUFFIX`
-   `RC_ESPNOW_IS_BUTTON_PRESSED_TOOLTIP`
-   `RC_ESPNOW_GET_BUTTON_PREFIX`
-   `RC_ESPNOW_GET_BUTTON_TOOLTIP`
