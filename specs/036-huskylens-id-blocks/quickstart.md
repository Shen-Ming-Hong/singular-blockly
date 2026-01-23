# Quickstart: HuskyLens ID-Based Block Query

**Feature Branch**: `036-huskylens-id-blocks`  
**Date**: 2026-01-23

## 快速開始

本指南說明如何實作 HuskyLens ID-Based 積木功能。

---

## 1. 實作步驟總覽

### Step 1: 積木定義 (blocks/huskylens.js)

在 `media/blockly/blocks/huskylens.js` 檔案末尾新增三個積木定義：

```javascript
// 依 ID 請求方塊積木
Blockly.Blocks['huskylens_request_blocks_id'] = {
	init: function () {
		this.appendValueInput('ID').setCheck('Number').appendField(window.languageManager.getMessage('HUSKYLENS_REQUEST_BLOCKS_ID', '請求 HUSKYLENS ID'));
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX', '的方塊'));

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP', '只請求特定 ID 的方塊辨識結果，可提高效率'));
	},
};

// 依 ID 取得方塊數量積木
Blockly.Blocks['huskylens_count_blocks_id'] = {
	init: function () {
		this.appendValueInput('ID').setCheck('Number').appendField(window.languageManager.getMessage('HUSKYLENS_COUNT_BLOCKS_ID', 'HUSKYLENS ID'));
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX', '的方塊數量'));

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP', '取得特定 ID 的方塊數量'));
	},
};

// 依 ID 取得方塊資訊積木
Blockly.Blocks['huskylens_get_block_id'] = {
	init: function () {
		this.appendValueInput('ID').setCheck('Number').appendField(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_ID', '取得 ID'));
		this.appendValueInput('INDEX').setCheck('Number').appendField(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_ID_INDEX', '的第'));
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX', '個方塊的'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('HUSKYLENS_X_CENTER', 'X 中心'), 'xCenter'],
					[window.languageManager.getMessage('HUSKYLENS_Y_CENTER', 'Y 中心'), 'yCenter'],
					[window.languageManager.getMessage('HUSKYLENS_WIDTH', '寬度'), 'width'],
					[window.languageManager.getMessage('HUSKYLENS_HEIGHT', '高度'), 'height'],
					[window.languageManager.getMessage('HUSKYLENS_ID', 'ID'), 'ID'],
				]),
				'INFO_TYPE'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_ID_TOOLTIP', '取得特定 ID 方塊的位置、大小或 ID 資訊'));
	},
};
```

### Step 2: Arduino 生成器 (generators/arduino/huskylens.js)

在 IIFE 中新增註冊：

```javascript
window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_request_blocks_id');
window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_count_blocks_id');
window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_get_block_id');
```

在檔案末尾新增生成器：

```javascript
// 依 ID 請求方塊代碼生成
window.arduinoGenerator.forBlock['huskylens_request_blocks_id'] = function (block) {
	try {
		const id = window.arduinoGenerator.valueToCode(block, 'ID', window.arduinoGenerator.ORDER_ATOMIC) || '1';
		return `huskylens.requestBlocks(${id});\n`;
	} catch (error) {
		log.error('Error generating huskylens_request_blocks_id code:', error);
		return '// Error: ' + error.message + '\n';
	}
};

// 依 ID 取得方塊數量代碼生成
window.arduinoGenerator.forBlock['huskylens_count_blocks_id'] = function (block) {
	try {
		const id = window.arduinoGenerator.valueToCode(block, 'ID', window.arduinoGenerator.ORDER_ATOMIC) || '1';
		return [`huskylens.countBlocks(${id})`, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_count_blocks_id code:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// 依 ID 取得方塊資訊代碼生成
window.arduinoGenerator.forBlock['huskylens_get_block_id'] = function (block) {
	try {
		const id = window.arduinoGenerator.valueToCode(block, 'ID', window.arduinoGenerator.ORDER_ATOMIC) || '1';
		const index = window.arduinoGenerator.valueToCode(block, 'INDEX', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const infoType = block.getFieldValue('INFO_TYPE');
		return [`huskylens.getBlock(${id}, ${index}).${infoType}`, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_get_block_id code:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};
```

### Step 3: Toolbox 配置 (toolbox/categories/vision-sensors.json)

在 `huskylens_forget` 之後新增：

```json
{
    "kind": "sep"
},
{
    "kind": "label",
    "text": "%{HUSKYLENS_BY_ID_LABEL}"
},
{
    "kind": "block",
    "type": "huskylens_request_blocks_id",
    "inputs": {
        "ID": {
            "shadow": {
                "type": "math_number",
                "fields": { "NUM": 1 }
            }
        }
    }
},
{
    "kind": "block",
    "type": "huskylens_count_blocks_id",
    "inputs": {
        "ID": {
            "shadow": {
                "type": "math_number",
                "fields": { "NUM": 1 }
            }
        }
    }
},
{
    "kind": "block",
    "type": "huskylens_get_block_id",
    "inputs": {
        "ID": {
            "shadow": {
                "type": "math_number",
                "fields": { "NUM": 1 }
            }
        },
        "INDEX": {
            "shadow": {
                "type": "math_number",
                "fields": { "NUM": 0 }
            }
        }
    }
}
```

### Step 4: 翻譯 (15 種語言)

在 `media/locales/{lang}/messages.js` 中新增翻譯鍵。

---

## 2. 驗證命令

```bash
# 編譯並監視
npm run watch

# 驗證翻譯完整性
npm run validate:i18n

# 更新 block dictionary (MCP)
npm run generate:dictionary
```

---

## 3. 手動測試流程

1. 按 F5 啟動 Extension Development Host
2. 開啟或建立 Blockly 專案
3. 在 Toolbox 找到「視覺感測」類別
4. 確認三個新積木出現在 HuskyLens 區塊末端
5. 拖曳每個積木到工作區
6. 檢視產生的 Arduino 程式碼
7. 切換語言確認翻譯正確

---

## 4. 預期產出程式碼範例

```cpp
#include <HUSKYLENS.h>
#include "Wire.h"

HUSKYLENS huskylens;

void setup() {
  Wire.begin();
  huskylens.begin(Wire);
}

void loop() {
  // 只請求 ID=1 的方塊
  huskylens.requestBlocks(1);

  // 取得 ID=1 的方塊數量
  int count = huskylens.countBlocks(1);

  // 取得 ID=1 的第 0 個方塊的 X 中心座標
  int x = huskylens.getBlock(1, 0).xCenter;
}
```
