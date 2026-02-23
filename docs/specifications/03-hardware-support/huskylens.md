# HuskyLens 積木規格

> 整合自 specs/003-huskylens-blocks-validation 與 specs/013-huskylens-tooltip-pins

## 概述

**目標**：提供完整的 HuskyLens AI 視覺鏡頭積木支援，包含 I2C/UART 初始化、演算法設定、物件偵測等功能

**狀態**：✅ 完成

---

## 積木類型總覽

### 初始化積木

| 積木                  | 用途        | 通訊方式 |
| --------------------- | ----------- | -------- |
| `huskylens_init_i2c`  | I2C 初始化  | I2C      |
| `huskylens_init_uart` | UART 初始化 | Serial   |

### 演算法設定

| 積木                      | 用途           |
| ------------------------- | -------------- |
| `huskylens_set_algorithm` | 設定辨識演算法 |

**支援演算法**（7 種）：

1. 人臉辨識（Face Recognition）
2. 物件追蹤（Object Tracking）
3. 物件辨識（Object Recognition）
4. 線條追蹤（Line Tracking）
5. 顏色辨識（Color Recognition）
6. 標籤辨識（Tag Recognition）
7. 物件分類（Object Classification）

### 物件偵測

| 積木                   | 用途         | 輸出類型 |
| ---------------------- | ------------ | -------- |
| `huskylens_request`    | 請求資料     | void     |
| `huskylens_get_count`  | 取得物件數量 | Number   |
| `huskylens_get_id`     | 取得物件 ID  | Number   |
| `huskylens_get_center` | 取得中心座標 | Number   |
| `huskylens_get_size`   | 取得物件尺寸 | Number   |

### 學習控制

| 積木                   | 用途           |
| ---------------------- | -------------- |
| `huskylens_learn_once` | 學習一次       |
| `huskylens_forget`     | 遺忘學習資料   |
| `huskylens_is_learned` | 檢查是否已學習 |

---

## 動態腳位提示（Tooltip）

### 需求背景

使用者需要根據不同開發板知道正確的接線方式，原 tooltip 僅顯示功能說明。

### 腳位對照表

| 開發板              | I2C (SDA/SCL) | UART 建議               |
| ------------------- | ------------- | ----------------------- |
| Arduino Uno         | A4/A5         | 任意數位腳位            |
| Arduino Nano        | A4/A5         | 任意數位腳位            |
| Arduino Mega        | D20/D21       | 任意數位腳位            |
| ESP32               | GPIO21/GPIO22 | GPIO16(RX2)/GPIO17(TX2) |
| ESP32-C3 Super Mini | GPIO8/GPIO9   | GPIO20(RX)/GPIO21(TX)   |

### 實作方式

```javascript
// 使用函數動態產生 tooltip
this.setTooltip(function () {
	const board = window.currentBoard || 'uno';
	const baseMsg = Blockly.Msg['HUSKYLENS_INIT_I2C_TOOLTIP'];
	const pinInfo = getPinInfoForBoard(board, 'i2c');
	return baseMsg + '\n' + pinInfo;
});
```

---

## 程式碼生成

### I2C 初始化

```cpp
// 生成程式碼
#include <Wire.h>
#include <HUSKYLENS.h>

HUSKYLENS huskylens;

void setup() {
  Wire.begin();
  while (!huskylens.begin(Wire)) {
    Serial.println("HuskyLens 連線失敗！");
    delay(100);
  }
}
```

### UART 初始化

```cpp
// Arduino (SoftwareSerial)
#include <SoftwareSerial.h>
#include <HUSKYLENS.h>

SoftwareSerial mySerial(10, 11); // RX, TX
HUSKYLENS huskylens;

void setup() {
  mySerial.begin(9600);
  while (!huskylens.begin(mySerial)) {
    Serial.println("HuskyLens 連線失敗！");
    delay(100);
  }
}

// ESP32 (HardwareSerial)
#include <HUSKYLENS.h>

HUSKYLENS huskylens;

void setup() {
  Serial2.begin(9600, SERIAL_8N1, 16, 17); // RX, TX
  while (!huskylens.begin(Serial2)) {
    Serial.println("HuskyLens 連線失敗！");
    delay(100);
  }
}
```

### PlatformIO 依賴

```ini
; platformio.ini
lib_deps =
  HUSKYLENS@^1.0.0

; Arduino AVR 需要額外 build_flags
build_flags =
  -I ${platformio.packages_dir}/framework-arduino-avr/libraries/SoftwareSerial/src
```

---

## i18n 訊息鍵

共 44 個訊息鍵，支援 12 種語言：

| 類別       | 範例鍵值                                                  |
| ---------- | --------------------------------------------------------- |
| 標籤       | `HUSKYLENS_INIT_I2C`, `HUSKYLENS_SET_ALGORITHM`           |
| Tooltip    | `HUSKYLENS_INIT_I2C_TOOLTIP`, `HUSKYLENS_REQUEST_TOOLTIP` |
| 下拉選項   | `HUSKYLENS_ALGORITHM_FACE`, `HUSKYLENS_ALGORITHM_OBJECT`  |
| 程式碼註解 | `HUSKYLENS_COMMENT_INIT`, `HUSKYLENS_COMMENT_REQUEST`     |

---

## 驗收標準

1. ✅ 11 種積木類型全部實作
2. ✅ I2C/UART 兩種通訊方式支援
3. ✅ 7 種演算法可選擇
4. ✅ 動態腳位提示根據開發板變化
5. ✅ 12 種語言翻譯完成
6. ✅ 程式碼可在 Arduino/ESP32 編譯通過

---

## 相關文件

- 積木定義：`media/blockly/blocks/vision_sensors.js`
- 程式碼生成：`media/blockly/generators/arduino/huskylens.js`

---

## INDEX 動態數値輸入（035）

> 來源：spec/035-huskylens-dynamic-index（2026-01）

### 變更

`huskylens_get_block_info` 和 `huskylens_get_arrow_info` 的 `INDEX` 欄位從固定數字輸入（dropdown）改為接受 Number 類型積木連接：

- **前**：`FIELD_NUMBER`，只能指定固定索引
- **後**：`INPUT_VALUE`，可連接任意 Number 積木（包括迴圈變數、其他函式回傳値）
- **shadow block**：預設陰影積木 `math_number`，預設値 0

### 應用情境

支援使用迴圈變數湃次前往後掃描所有至今辨別的對象：

```c
for (int i = 0; i < huskylens.countBlocks(); i++) {
  HUSKYLENSResult result = huskylens.getBlock(i);  // INDEX 用迴圈變數
  // ...
}
```

### 向下相容

經 shadow block 設計，时财中未連接外部積木的工作區行為及可讓導入索引=0預設，與更新前劯一致。

---

## HuskyLens ID 導向積木（036）

> 來源：spec/036-huskylens-id-blocks（2026-01）

### 新增積木

三個新增積木，允許透過訓練 ID 存取 HuskyLens 確認的特定對象，不需要迴圈遊歷：

| 積木類型                          | 生成碼                                 | 說明                              |
| --------------------------------- | -------------------------------------- | --------------------------------- |
| `huskylens_request_by_id`         | `huskylens.requestBlocksLearned({ID})` | 道 HuskyLens 小说資料舉 ID 對象   |
| `huskylens_get_block_by_id`       | `huskylens.getBlock(index, {ID})`      | 取得該 ID 稍未下第 n 個辨別長方形 |
| `huskylens_get_block_count_by_id` | `huskylens.countBlocks({ID})`          | 查詢該 ID 目前對應几個辨別結果    |

### 支援對象屬性

`huskylens_get_block_by_id` 支援以下屬性查詢（與 `huskylens_get_block_info` 一致）：

- `xCenter`、`yCenter`：物件中心座標
- `width`、`height`：物件寬高
- `ID`：訓練 ID

### 限制

- **Arduino only**：目前 HuskyLens 庁含庫僅支援 Arduino C++，沒有 MicroPython 版本
- 與現有索引導向積木完全向下相容
