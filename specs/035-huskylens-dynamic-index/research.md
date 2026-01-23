# Research: HuskyLens 積木動態編號輸入

**Date**: 2026-01-23  
**Branch**: `035-huskylens-dynamic-index`

## 研究目標

釐清如何將 HuskyLens 積木的編號欄位從固定數字改為可接受積木連接，以支援迴圈中的動態索引存取。

## 研究結果

### 1. 目前積木實作方式

**積木類型**：

- `huskylens_get_block_info` — 取得方塊資訊
- `huskylens_get_arrow_info` — 取得箭頭資訊

**目前編號欄位實作**（[media/blockly/blocks/huskylens.js](../../media/blockly/blocks/huskylens.js#L230-L248)）：

```javascript
Blockly.Blocks['huskylens_get_block_info'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_INFO', '取得方塊'))
            .appendField(new Blockly.FieldNumber(0, 0), 'INDEX')  // 固定數字欄位
            .appendField(window.languageManager.getMessage('HUSKYLENS_BLOCK_INFO_TYPE', '的'))
            .appendField(new Blockly.FieldDropdown([...]), 'INFO_TYPE');
        // ...
    },
};
```

**問題**：`Blockly.FieldNumber` 只能輸入固定數字，無法連接變數積木或數學運算積木。

### 2. 參考實作：Pixetto AprilTag 積木

**積木定義**（[media/blockly/blocks/pixetto.js](../../media/blockly/blocks/pixetto.js#L159-L173)）：

```javascript
Blockly.Blocks['pixetto_apriltag_detect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_APRILTAG_DETECT', 'Pixetto 偵測 AprilTag'));

		// 使用 appendValueInput 允許連接其他積木
		this.appendValueInput('TAG_ID').setCheck('Number').appendField(window.languageManager.getMessage('PIXETTO_TAG_ID', '標籤 ID'));

		this.setInputsInline(true); // 維持單行外觀
		// ...
	},
};
```

**產生器取值**（[media/blockly/generators/arduino/pixetto.js](../../media/blockly/generators/arduino/pixetto.js#L222-L228)）：

```javascript
window.arduinoGenerator.forBlock['pixetto_apriltag_detect'] = function (block) {
	const tagId = window.arduinoGenerator.valueToCode(block, 'TAG_ID', window.arduinoGenerator.ORDER_ATOMIC) || '0';
	// ...
};
```

**Toolbox 設定**（[media/toolbox/categories/vision-sensors.json](../../media/toolbox/categories/vision-sensors.json#L37-L52)）：

```json
{
	"kind": "block",
	"type": "pixetto_apriltag_detect",
	"inputs": {
		"TAG_ID": {
			"shadow": {
				"type": "math_number",
				"fields": {
					"NUM": 0
				}
			}
		}
	}
}
```

### 3. 技術決策

| 決策       | 選擇                                      | 理由                                               |
| ---------- | ----------------------------------------- | -------------------------------------------------- |
| 輸入方式   | `appendValueInput` + `setCheck('Number')` | 允許連接變數、數學運算積木，同時限制只接受數字類型 |
| 外觀排列   | `setInputsInline(true)`                   | 維持原本單行外觀，視覺上無明顯差異                 |
| 預設值     | Shadow block (`math_number`, NUM: 0)      | 從工具箱拖曳時自動填入預設值，維持使用體驗         |
| 產生器取值 | `valueToCode()` + fallback `'0'`          | 正確處理動態值，未連接時使用預設值                 |

### 4. 排除項目

- **MicroPython 產生器**：目前 HuskyLens 不支援 MicroPython（CyberBrick 未整合 HuskyLens），暫不處理
- **huskylens_get_id_block_info / huskylens_get_id_arrow_info**：這些積木使用 `FILTER_ID` 欄位而非 `INDEX`，結構不同，不在本次修改範圍

## 替代方案評估

| 方案                   | 優點                 | 缺點                            | 結論        |
| ---------------------- | -------------------- | ------------------------------- | ----------- |
| FieldNumber + 變數參考 | 無需修改積木結構     | 無法連接積木，不支援迴圈        | ❌ 不採用   |
| appendValueInput       | 支援所有數字類型積木 | 需修改積木定義、產生器、toolbox | ✅ 採用     |
| 自訂 Field 類型        | 高度客製化           | 開發成本高，維護困難            | ❌ 過度開發 |

## 相關檔案

| 檔案                                            | 用途           | 修改內容                       |
| ----------------------------------------------- | -------------- | ------------------------------ |
| `media/blockly/blocks/huskylens.js`             | 積木定義       | FieldNumber → appendValueInput |
| `media/blockly/generators/arduino/huskylens.js` | Arduino 產生器 | getFieldValue → valueToCode    |
| `media/toolbox/categories/vision-sensors.json`  | 工具箱設定     | 新增 shadow block              |
