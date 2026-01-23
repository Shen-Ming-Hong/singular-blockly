# Block API Contract: HuskyLens ID-Based Blocks

**Feature Branch**: `036-huskylens-id-blocks`  
**Date**: 2026-01-23  
**Status**: 完成

## 概述

本文件定義三個新 HuskyLens 積木的 API 規格，包含積木定義、程式碼生成、翻譯鍵。

---

## 1. huskylens_request_blocks_id

### 1.1 積木規格

| 屬性                   | 值                            |
| ---------------------- | ----------------------------- |
| **Type**               | `huskylens_request_blocks_id` |
| **Category**           | `sensor_blocks`               |
| **Style**              | `sensor_blocks`               |
| **Output**             | None (Statement)              |
| **Previous Statement** | Yes                           |
| **Next Statement**     | Yes                           |

### 1.2 輸入欄位

| 名稱 | 類型       | 檢查     | Shadow                 |
| ---- | ---------- | -------- | ---------------------- |
| `ID` | ValueInput | `Number` | `math_number` (預設 1) |

### 1.3 顯示格式

```
請求 HUSKYLENS ID [1▼] 的方塊
```

### 1.4 程式碼生成 (Arduino)

```cpp
huskylens.requestBlocks({ID});
```

### 1.5 翻譯鍵

| Key                                   | 用途     |
| ------------------------------------- | -------- |
| `HUSKYLENS_REQUEST_BLOCKS_ID`         | 積木顯示 |
| `HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP` | 提示文字 |

---

## 2. huskylens_count_blocks_id

### 2.1 積木規格

| 屬性                   | 值                          |
| ---------------------- | --------------------------- |
| **Type**               | `huskylens_count_blocks_id` |
| **Category**           | `sensor_blocks`             |
| **Style**              | `sensor_blocks`             |
| **Output**             | `Number`                    |
| **Previous Statement** | No                          |
| **Next Statement**     | No                          |

### 2.2 輸入欄位

| 名稱 | 類型       | 檢查     | Shadow                 |
| ---- | ---------- | -------- | ---------------------- |
| `ID` | ValueInput | `Number` | `math_number` (預設 1) |

### 2.3 顯示格式

```
HUSKYLENS ID [1▼] 的方塊數量
```

### 2.4 程式碼生成 (Arduino)

```cpp
huskylens.countBlocks({ID})
```

**回傳**: `[code, ORDER_ATOMIC]`

### 2.5 翻譯鍵

| Key                                 | 用途     |
| ----------------------------------- | -------- |
| `HUSKYLENS_COUNT_BLOCKS_ID`         | 積木顯示 |
| `HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP` | 提示文字 |

---

## 3. huskylens_get_block_id

### 3.1 積木規格

| 屬性                   | 值                       |
| ---------------------- | ------------------------ |
| **Type**               | `huskylens_get_block_id` |
| **Category**           | `sensor_blocks`          |
| **Style**              | `sensor_blocks`          |
| **Output**             | `Number`                 |
| **Previous Statement** | No                       |
| **Next Statement**     | No                       |
| **Inline**             | Yes                      |

### 3.2 輸入欄位

| 名稱    | 類型       | 檢查     | Shadow                 |
| ------- | ---------- | -------- | ---------------------- |
| `ID`    | ValueInput | `Number` | `math_number` (預設 1) |
| `INDEX` | ValueInput | `Number` | `math_number` (預設 0) |

### 3.3 下拉選單欄位

| 名稱        | 選項                                          |
| ----------- | --------------------------------------------- |
| `INFO_TYPE` | `xCenter`, `yCenter`, `width`, `height`, `ID` |

### 3.4 顯示格式

```
取得 ID [1▼] 的第 [0▼] 個方塊的 [X 中心 ▼]
```

### 3.5 程式碼生成 (Arduino)

```cpp
huskylens.getBlock({ID}, {INDEX}).{INFO_TYPE}
```

**回傳**: `[code, ORDER_ATOMIC]`

### 3.6 翻譯鍵

| Key                                   | 用途               |
| ------------------------------------- | ------------------ |
| `HUSKYLENS_GET_BLOCK_ID`              | 開頭文字 "取得 ID" |
| `HUSKYLENS_GET_BLOCK_ID_INDEX`        | 連接詞 "的第"      |
| `HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX` | 連接詞 "個方塊的"  |
| `HUSKYLENS_GET_BLOCK_ID_TOOLTIP`      | 提示文字           |

**屬性選項重用現有翻譯鍵**:

- `HUSKYLENS_X_CENTER`
- `HUSKYLENS_Y_CENTER`
- `HUSKYLENS_WIDTH`
- `HUSKYLENS_HEIGHT`
- `HUSKYLENS_ID`

---

## 4. 完整翻譯鍵表

### 4.1 繁體中文 (zh-hant)

```javascript
// HuskyLens ID-Based 積木
HUSKYLENS_BY_ID_LABEL: '依 ID 查詢',
HUSKYLENS_REQUEST_BLOCKS_ID: '請求 HUSKYLENS ID',
HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX: '的方塊',
HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: '只請求特定 ID 的方塊辨識結果，可提高效率',
HUSKYLENS_COUNT_BLOCKS_ID: 'HUSKYLENS ID',
HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX: '的方塊數量',
HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: '取得特定 ID 的方塊數量',
HUSKYLENS_GET_BLOCK_ID: '取得 ID',
HUSKYLENS_GET_BLOCK_ID_INDEX: '的第',
HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX: '個方塊的',
HUSKYLENS_GET_BLOCK_ID_TOOLTIP: '取得特定 ID 方塊的位置、大小或 ID 資訊',
```

### 4.2 英文 (en)

```javascript
// HuskyLens ID-Based Blocks
HUSKYLENS_BY_ID_LABEL: 'Query by ID',
HUSKYLENS_REQUEST_BLOCKS_ID: 'request HUSKYLENS blocks with ID',
HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX: '',
HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: 'Request only blocks with specific ID for better efficiency',
HUSKYLENS_COUNT_BLOCKS_ID: 'HUSKYLENS block count with ID',
HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX: '',
HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: 'Get the count of blocks with specific ID',
HUSKYLENS_GET_BLOCK_ID: 'get block with ID',
HUSKYLENS_GET_BLOCK_ID_INDEX: 'index',
HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX: '',
HUSKYLENS_GET_BLOCK_ID_TOOLTIP: 'Get position, size or ID info of a block with specific ID',
```

---

## 5. Toolbox 配置變更

### 5.1 vision-sensors.json 新增內容

在 `huskylens_forget` 積木之後新增：

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
                "fields": {
                    "NUM": 1
                }
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
                "fields": {
                    "NUM": 1
                }
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
                "fields": {
                    "NUM": 1
                }
            }
        },
        "INDEX": {
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

---

## 6. Generator 註冊

### 6.1 IIFE 註冊區塊

在 `huskylens.js` 的 IIFE 中新增註冊：

```javascript
window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_request_blocks_id');
window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_count_blocks_id');
window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_get_block_id');
```

---

## 7. 錯誤處理

所有 Generator 函式應遵循現有模式：

```javascript
window.arduinoGenerator.forBlock['huskylens_xxx'] = function (block) {
	try {
		// 程式碼生成邏輯
		return code;
	} catch (error) {
		log.error('Error generating huskylens_xxx code:', error);
		return '// Error: ' + error.message + '\n';
	}
};
```
