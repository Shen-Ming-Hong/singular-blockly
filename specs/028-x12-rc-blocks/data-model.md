# Data Model: CyberBrick X12 與 RC 遙控積木

**功能分支**: `028-x12-rc-blocks`  
**更新日期**: 2026-01-04

---

## 核心資料結構

### RC 資料 Tuple

```
RC_DATA = (L1, L2, L3, R1, R2, R3, K1, K2, K3, K4)
         └─────────────────────┘  └─────────────┘
              搖桿 (0-4095)          按鈕 (0/1)
```

| 索引 | 通道名稱 | 類型     | 值域   | 預設值 | 說明                    |
| ---- | -------- | -------- | ------ | ------ | ----------------------- |
| 0    | L1       | 搖桿 ADC | 0-4095 | 2048   | 左搖桿 X 軸 (水平)      |
| 1    | L2       | 搖桿 ADC | 0-4095 | 2048   | 左搖桿 Y 軸 (垂直)      |
| 2    | L3       | 搖桿 ADC | 0-4095 | 2048   | 左搖桿第三軸/旋鈕       |
| 3    | R1       | 搖桿 ADC | 0-4095 | 2048   | 右搖桿 X 軸 (水平)      |
| 4    | R2       | 搖桿 ADC | 0-4095 | 2048   | 右搖桿 Y 軸 (垂直)      |
| 5    | R3       | 搖桿 ADC | 0-4095 | 2048   | 右搖桿第三軸/旋鈕       |
| 6    | K1       | 按鈕     | 0, 1   | 1      | 按鈕 1 (0=按下, 1=放開) |
| 7    | K2       | 按鈕     | 0, 1   | 1      | 按鈕 2                  |
| 8    | K3       | 按鈕     | 0, 1   | 1      | 按鈕 3                  |
| 9    | K4       | 按鈕     | 0, 1   | 1      | 按鈕 4                  |

---

## 實體定義

### 1. 搖桿通道 (JoystickChannel)

**下拉選單選項**

```javascript
const JOYSTICK_CHANNEL_OPTIONS = [
	['L1', '0'], // 左搖桿 X 軸
	['L2', '1'], // 左搖桿 Y 軸
	['L3', '2'], // 左搖桿第三軸
	['R1', '3'], // 右搖桿 X 軸
	['R2', '4'], // 右搖桿 Y 軸
	['R3', '5'], // 右搖桿第三軸
];
```

**驗證規則**:

-   索引值必須為 0-5 的整數
-   顯示名稱使用實體標籤 (L1-L3, R1-R3)

### 2. 按鈕通道 (ButtonChannel)

**下拉選單選項**

```javascript
const BUTTON_CHANNEL_OPTIONS = [
	['K1', '6'],
	['K2', '7'],
	['K3', '8'],
	['K4', '9'],
];
```

**驗證規則**:

-   索引值必須為 6-9 的整數
-   按鈕狀態: 0 = 按下, 1 = 放開

### 3. 配對索引 (RCIndex)

**狀態定義**

| 值  | 狀態    | 說明                        |
| --- | ------- | --------------------------- |
| 0   | 未配對  | 尚未與任何發射端/接收端配對 |
| 1   | Slave 1 | 已配對為第一接收端          |
| 2   | Slave 2 | 已配對為第二接收端          |

---

## 狀態轉換

### 初始化流程

```
┌─────────────┐
│   未初始化   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         rc_master_init()                  │
│         或 rc_slave_init()                │
└──────────────────┬───────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    ▼                             ▼
┌─────────┐                 ┌─────────┐
│ Master  │                 │  Slave  │
│  模式   │                 │   模式  │
└────┬────┘                 └────┬────┘
     │                           │
     │ rc_master_data()          │ rc_slave_data()
     │ (讀取本機搖桿)             │ (讀取遠端資料)
     ▼                           ▼
┌─────────────────┐       ┌─────────────────┐
│ Tuple 或 None   │       │ Tuple 或 None   │
└─────────────────┘       └─────────────────┘
```

### 連線狀態判斷

```
rc_slave_data() != None  →  已連線 (is_connected = True)
rc_slave_data() == None  →  未連線 (is_connected = False)
```

---

## 映射函式

### 線性映射

**輸入**:

-   `value`: 原始 ADC 值 (0-4095)
-   `out_min`: 輸出最小值
-   `out_max`: 輸出最大值

**輸出**:

-   映射後的整數值

**公式**:

```python
mapped = (value * (out_max - out_min) // 4095) + out_min
```

**範例**:
| 輸入 (ADC) | 輸出範圍 | 結果 |
|------------|----------|------|
| 0 | -100 ~ 100 | -100 |
| 2048 | -100 ~ 100 | 0 |
| 4095 | -100 ~ 100 | 100 |
| 2048 | 0 ~ 180 | 90 |

---

## 積木類型摘要

### RC 選單積木 (8 個)

| 積木類型                 | 輸入               | 輸出    | 說明                 |
| ------------------------ | ------------------ | ------- | -------------------- |
| `rc_master_init`         | -                  | -       | 初始化發射端模式     |
| `rc_slave_init`          | -                  | -       | 初始化接收端模式     |
| `rc_get_joystick`        | channel (dropdown) | Number  | 讀取遠端搖桿 ADC     |
| `rc_get_joystick_mapped` | channel, min, max  | Number  | 讀取並映射遠端搖桿   |
| `rc_is_button_pressed`   | button (dropdown)  | Boolean | 檢查遠端按鈕是否按下 |
| `rc_get_button`          | button (dropdown)  | Number  | 讀取遠端按鈕狀態     |
| `rc_is_connected`        | -                  | Boolean | 檢查是否已連線       |
| `rc_get_rc_index`        | -                  | Number  | 取得配對索引         |

### X12 選單積木 (4 個)

| 積木類型                  | 輸入               | 輸出    | 說明                 |
| ------------------------- | ------------------ | ------- | -------------------- |
| `x12_get_joystick`        | channel (dropdown) | Number  | 讀取本機搖桿 ADC     |
| `x12_get_joystick_mapped` | channel, min, max  | Number  | 讀取並映射本機搖桿   |
| `x12_is_button_pressed`   | button (dropdown)  | Boolean | 檢查本機按鈕是否按下 |
| `x12_get_button`          | button (dropdown)  | Number  | 讀取本機按鈕狀態     |

---

## i18n 鍵值清單

### 選單與標籤

| 鍵值                 | 繁體中文   | 英文              |
| -------------------- | ---------- | ----------------- |
| `CATEGORY_X12`       | X12 發射端 | X12 Transmitter   |
| `CATEGORY_RC`        | RC 遙控    | RC Remote Control |
| `RC_LABEL_INIT`      | 初始化     | Initialization    |
| `RC_LABEL_JOYSTICK`  | 搖桿       | Joystick          |
| `RC_LABEL_BUTTON`    | 按鈕       | Button            |
| `RC_LABEL_STATUS`    | 狀態       | Status            |
| `X12_LABEL_JOYSTICK` | 搖桿       | Joystick          |
| `X12_LABEL_BUTTON`   | 按鈕       | Button            |

### 積木文字

| 鍵值                             | 繁體中文              | 英文                            |
| -------------------------------- | --------------------- | ------------------------------- |
| `RC_MASTER_INIT`                 | 初始化發射端 (Master) | Initialize Transmitter (Master) |
| `RC_SLAVE_INIT`                  | 初始化接收端 (Slave)  | Initialize Receiver (Slave)     |
| `RC_GET_JOYSTICK_PREFIX`         | 遠端搖桿              | Remote Joystick                 |
| `RC_GET_JOYSTICK_MAPPED_PREFIX`  | 遠端搖桿              | Remote Joystick                 |
| `RC_GET_JOYSTICK_MAPPED_MIN`     | 映射                  | map to                          |
| `RC_GET_JOYSTICK_MAPPED_MAX`     | ~                     | ~                               |
| `RC_IS_BUTTON_PRESSED_PREFIX`    | 遠端按鈕              | Remote Button                   |
| `RC_IS_BUTTON_PRESSED_SUFFIX`    | 被按下?               | pressed?                        |
| `RC_GET_BUTTON_PREFIX`           | 遠端按鈕              | Remote Button                   |
| `RC_GET_BUTTON_SUFFIX`           | 狀態                  | state                           |
| `RC_IS_CONNECTED`                | 已連線?               | Connected?                      |
| `RC_GET_RC_INDEX`                | 配對索引              | Pairing Index                   |
| `X12_GET_JOYSTICK_PREFIX`        | 本機搖桿              | Local Joystick                  |
| `X12_GET_JOYSTICK_MAPPED_PREFIX` | 本機搖桿              | Local Joystick                  |
| `X12_GET_JOYSTICK_MAPPED_MIN`    | 映射                  | map to                          |
| `X12_GET_JOYSTICK_MAPPED_MAX`    | ~                     | ~                               |
| `X12_IS_BUTTON_PRESSED_PREFIX`   | 本機按鈕              | Local Button                    |
| `X12_IS_BUTTON_PRESSED_SUFFIX`   | 被按下?               | pressed?                        |
| `X12_GET_BUTTON_PREFIX`          | 本機按鈕              | Local Button                    |
| `X12_GET_BUTTON_SUFFIX`          | 狀態                  | state                           |

### Tooltip 說明

| 鍵值                              | 繁體中文                                      |
| --------------------------------- | --------------------------------------------- |
| `RC_MASTER_INIT_TOOLTIP`          | 初始化為發射端模式，用於遙控器上              |
| `RC_SLAVE_INIT_TOOLTIP`           | 初始化為接收端模式，用於被遙控的裝置上        |
| `RC_GET_JOYSTICK_TOOLTIP`         | 讀取遠端搖桿的 ADC 值 (0-4095)，2048 為中點   |
| `RC_GET_JOYSTICK_MAPPED_TOOLTIP`  | 讀取遠端搖桿並映射到指定範圍                  |
| `RC_IS_BUTTON_PRESSED_TOOLTIP`    | 檢查遠端按鈕是否被按下                        |
| `RC_GET_BUTTON_TOOLTIP`           | 讀取遠端按鈕狀態 (0=按下, 1=放開)             |
| `RC_IS_CONNECTED_TOOLTIP`         | 檢查是否已與發射端/接收端配對連線             |
| `RC_GET_RC_INDEX_TOOLTIP`         | 取得配對索引 (0=未配對, 1=Slave 1, 2=Slave 2) |
| `X12_GET_JOYSTICK_TOOLTIP`        | 讀取發射端本機搖桿的 ADC 值 (0-4095)          |
| `X12_GET_JOYSTICK_MAPPED_TOOLTIP` | 讀取發射端本機搖桿並映射到指定範圍            |
| `X12_IS_BUTTON_PRESSED_TOOLTIP`   | 檢查發射端本機按鈕是否被按下                  |
| `X12_GET_BUTTON_TOOLTIP`          | 讀取發射端本機按鈕狀態 (0=按下, 1=放開)       |
