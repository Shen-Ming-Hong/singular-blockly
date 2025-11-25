# 研究報告：HuskyLens 動態腳位提示與工具箱間距修復

**功能分支**: `013-huskylens-tooltip-pins`  
**建立日期**: 2025-11-25  
**狀態**: 已完成

## 研究目標

1. 確認 Blockly 12.3.1 的 `setTooltip()` API 是否支援動態內容（函數參數）
2. 驗證各開發板的 I2C 與 UART 腳位資訊正確性
3. 分析 vision-sensors 工具箱間距問題的根本原因

---

## 研究 1：Blockly setTooltip() API

### 問題

規格假設 Blockly 12.3.1 的 `setTooltip()` 方法支援函數參數，每次滑鼠懸停時重新評估。需驗證此假設。

### 研究方法

-   使用 MCP 工具 `fetch_webpage` 取得 Blockly 官方 API 文件
-   確認 `Block.setTooltip()` 方法簽名

### 發現

**來源**: [Google Blockly API Reference](https://developers.google.com/blockly/reference/js/blockly.block_class.settooltip_1_method)

API 簽名：

```typescript
setTooltip(newTip: Tooltip.TipInfo): void;
```

`Tooltip.TipInfo` 類型定義：

> 工具提示的文字、**傳回工具提示文字的函式**，或會使用工具提示的父項物件。

### 結論

✅ **確認支援**：Blockly 12.3.1 的 `setTooltip()` 接受函數參數，每次懸停時執行函數取得 tooltip 內容。

### 使用範例

```javascript
this.setTooltip(() => {
	const board = window.currentBoard || 'uno';
	return `初始化 HUSKYLENS (I2C)\n接線提示：${getPinInfo(board)}`;
});
```

---

## 研究 2：開發板腳位資訊

### 問題

需確認規格中的腳位對應表是否正確：

-   Arduino Uno/Nano/Mega 的 I2C 腳位
-   ESP32 系列的 I2C 與 UART 預設腳位
-   ESP32-C3 Super Mini 的特殊腳位配置

### 研究方法

-   使用 `webSearch` 查詢各開發板的官方腳位資訊
-   交叉驗證多個來源

### 發現

#### Arduino 系列

| 開發板       | I2C SDA | I2C SCL | 來源                                                                                                |
| ------------ | ------- | ------- | --------------------------------------------------------------------------------------------------- |
| Arduino Uno  | A4      | A5      | [Arduino Wire 官方文件](https://www.arduino.cc/reference/en/language/functions/communication/wire/) |
| Arduino Nano | A4      | A5      | Arduino 官方商店頁面                                                                                |
| Arduino Mega | D20     | D21     | Arduino Forum、DCC-EX 文件                                                                          |

**UART 說明**：AVR 系列（Uno/Nano/Mega）使用 SoftwareSerial 函式庫，可在任意數位腳位模擬 UART 通訊。

#### ESP32 系列

| 開發板              | I2C SDA | I2C SCL | UART2 RX | UART2 TX | 來源                                                                                                              |
| ------------------- | ------- | ------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| ESP32 DevKit        | GPIO21  | GPIO22  | GPIO16   | GPIO17   | [uPesy ESP32 Pinout Guide](https://www.upesy.com/blogs/tutorials/esp32-pinout-reference-gpio-pins-ultimate-guide) |
| ESP32-C3 Super Mini | GPIO8   | GPIO9   | GPIO20   | GPIO21   | [ProtoSupplies ESP32-C3 Super Mini](https://protosupplies.com/product/esp32c3-supermini/)                         |

**注意事項**：

-   ESP32-WROVER 模組的 GPIO16/17 被 PSRAM 佔用，需使用其他腳位
-   ESP32-C3 的 GPIO8 同時連接藍色 LED，使用 I2C 時應避免同時控制 LED

### 結論

✅ **規格正確**：所有腳位資訊經網路查證均正確無誤。

---

## 研究 3：工具箱間距問題

### 問題

vision-sensors 類別的區塊群組間距與其他類別不同，需找出根本原因。

### 研究方法

-   使用 `grep_search` 搜尋所有工具箱 JSON 檔案中的 `sep` 關鍵字
-   比較不同類別的 JSON 結構

### 發現

#### sep 分隔符使用統計

| 類別檔案            | sep 數量 |
| ------------------- | -------- |
| vision-sensors.json | **4**    |
| arduino.json        | 0        |
| sensors.json        | 0        |
| motors.json         | 0        |
| logic.json          | 0        |
| loops.json          | 0        |
| math.json           | 0        |
| text.json           | 0        |
| lists.json          | 0        |

#### vision-sensors.json 中的 sep 位置

1. **第 19 行**（pixetto_set_mode 後）→ 造成額外間距
2. **第 96 行**（HUSKYLENS_LABEL 前）→ **合理**，用於分隔 Pixetto 與 HuskyLens 群組
3. **第 115 行**（huskylens_set_algorithm 後）→ 造成額外間距
4. **第 142 行**（huskylens_get_arrow_info 後）→ 造成額外間距

### 結論

✅ **根本原因確認**：vision-sensors.json 是唯一使用 `sep` 分隔符的類別。

**修復方案**：

-   移除第 19、115、142 行的 sep
-   保留第 96 行的 sep（Pixetto 與 HuskyLens 群組分隔）

---

## 研究摘要

| 項目                     | 狀態      | 結論                                  |
| ------------------------ | --------- | ------------------------------------- |
| Blockly setTooltip() API | ✅ 已驗證 | 支援函數參數，每次懸停時執行          |
| 開發板腳位資訊           | ✅ 已驗證 | 規格中所有腳位正確                    |
| 工具箱間距問題           | ✅ 已分析 | vision-sensors.json 多餘的 sep 分隔符 |

所有技術假設已驗證完成，可進入實作階段。
