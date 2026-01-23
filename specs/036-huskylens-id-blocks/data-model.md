# Data Model: HuskyLens ID-Based Block Query

**Feature Branch**: `036-huskylens-id-blocks`  
**Date**: 2026-01-23  
**Status**: 完成

## 實體定義

本功能涉及的主要實體為 Blockly 積木定義，以下為各積木的資料模型。

---

## 1. Block: huskylens_request_blocks_id

### 1.1 積木定義

```javascript
{
    type: 'huskylens_request_blocks_id',
    category: 'sensor_blocks',
    colour: '#5ba55b',        // 使用 sensor_blocks style
    connections: {
        previousStatement: true,
        nextStatement: true,
        output: null
    },
    inputs: {
        ID: {
            type: 'value',
            check: 'Number',
            shadow: {
                type: 'math_number',
                fields: { NUM: 1 }
            }
        }
    },
    fields: {},
    tooltip: 'HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP',
    helpUrl: ''
}
```

### 1.2 生成程式碼

```javascript
// Arduino Generator Output
huskylens.requestBlocks(${ID});
```

---

## 2. Block: huskylens_count_blocks_id

### 2.1 積木定義

```javascript
{
    type: 'huskylens_count_blocks_id',
    category: 'sensor_blocks',
    colour: '#5ba55b',
    connections: {
        previousStatement: null,
        nextStatement: null,
        output: 'Number'
    },
    inputs: {
        ID: {
            type: 'value',
            check: 'Number',
            shadow: {
                type: 'math_number',
                fields: { NUM: 1 }
            }
        }
    },
    fields: {},
    tooltip: 'HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP',
    helpUrl: ''
}
```

### 2.2 生成程式碼

```javascript
// Arduino Generator Output (Expression)
huskylens.countBlocks(${ID})
```

---

## 3. Block: huskylens_get_block_id

### 3.1 積木定義

```javascript
{
    type: 'huskylens_get_block_id',
    category: 'sensor_blocks',
    colour: '#5ba55b',
    connections: {
        previousStatement: null,
        nextStatement: null,
        output: 'Number'
    },
    inputs: {
        ID: {
            type: 'value',
            check: 'Number',
            shadow: {
                type: 'math_number',
                fields: { NUM: 1 }
            }
        },
        INDEX: {
            type: 'value',
            check: 'Number',
            shadow: {
                type: 'math_number',
                fields: { NUM: 0 }
            }
        }
    },
    fields: {
        INFO_TYPE: {
            type: 'dropdown',
            options: [
                ['X 中心', 'xCenter'],
                ['Y 中心', 'yCenter'],
                ['寬度', 'width'],
                ['高度', 'height'],
                ['ID', 'ID']
            ]
        }
    },
    tooltip: 'HUSKYLENS_GET_BLOCK_ID_TOOLTIP',
    helpUrl: ''
}
```

### 3.2 生成程式碼

```javascript
// Arduino Generator Output (Expression)
huskylens.getBlock(${ID}, ${INDEX}).${INFO_TYPE}
```

---

## 4. 翻譯鍵定義

### 4.1 必要翻譯鍵

| Key                                   | 繁體中文                                   | 用途         |
| ------------------------------------- | ------------------------------------------ | ------------ |
| `HUSKYLENS_REQUEST_BLOCKS_ID`         | `請求 HUSKYLENS ID {0} 的方塊`             | 積木顯示文字 |
| `HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP` | `只請求特定 ID 的方塊辨識結果，可提高效率` | 提示文字     |
| `HUSKYLENS_COUNT_BLOCKS_ID`           | `HUSKYLENS ID {0} 的方塊數量`              | 積木顯示文字 |
| `HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP`   | `取得特定 ID 的方塊數量`                   | 提示文字     |
| `HUSKYLENS_GET_BLOCK_ID`              | `取得 ID`                                  | 積木開頭文字 |
| `HUSKYLENS_GET_BLOCK_ID_INDEX`        | `的第`                                     | 連接詞       |
| `HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX` | `個方塊的`                                 | 連接詞       |
| `HUSKYLENS_GET_BLOCK_ID_TOOLTIP`      | `取得特定 ID 方塊的位置、大小或 ID 資訊`   | 提示文字     |

### 4.2 翻譯鍵在各語言檔案中的位置

翻譯鍵應加入 `media/locales/{lang}/messages.js` 檔案中，放置於現有 HuskyLens 翻譯之後（約第 466 行）。

---

## 5. Toolbox 配置

### 5.1 新增條目 (vision-sensors.json)

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

## 6. 驗證規則

### 6.1 輸入驗證

| 欄位      | 驗證規則 | 處理方式                           |
| --------- | -------- | ---------------------------------- |
| ID        | 任意整數 | 直接傳入 API，負數/0 由函式庫處理  |
| INDEX     | 任意整數 | 直接傳入 API，超出範圍由函式庫處理 |
| INFO_TYPE | 固定選項 | Dropdown 限制選項                  |

### 6.2 狀態轉換

此功能為無狀態積木，無狀態轉換邏輯。

---

## 7. 相依性

### 7.1 函式庫相依

- **HUSKYLENSArduino** — 已在現有 `huskylens_init_*` 積木中處理 lib_deps 注入

### 7.2 積木相依

- 新積木需搭配 `huskylens_init_i2c` 或 `huskylens_init_uart` 使用
- 建議搭配 `huskylens_request_blocks_id` 先請求再取得資訊

---

## 8. 關聯圖

```
┌─────────────────────────────────────┐
│         HuskyLens 積木生態          │
├─────────────────────────────────────┤
│                                     │
│  初始化積木                          │
│  ┌─────────────────────────────┐   │
│  │ huskylens_init_i2c/uart    │   │
│  └──────────────┬──────────────┘   │
│                 │                   │
│  請求積木 ──────▼──────             │
│  ┌─────────────────────────────┐   │
│  │ huskylens_request          │   │ ← 現有（所有方塊）
│  │ huskylens_request_blocks_id│   │ ← 新增（特定 ID）
│  └──────────────┬──────────────┘   │
│                 │                   │
│  查詢積木 ──────▼──────             │
│  ┌─────────────────────────────┐   │
│  │ huskylens_count_blocks     │   │ ← 現有（所有方塊）
│  │ huskylens_count_blocks_id  │   │ ← 新增（特定 ID）
│  │ huskylens_get_block_info   │   │ ← 現有（依索引）
│  │ huskylens_get_block_id     │   │ ← 新增（依 ID+索引）
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```
