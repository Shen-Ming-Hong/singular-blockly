# Data Model: HuskyLens 積木動態編號輸入

**Branch**: `035-huskylens-dynamic-index`

## 概述

本功能僅修改 Blockly 積木的欄位類型和程式碼產生器，不涉及新的資料實體或狀態管理。

## 積木結構變更

### huskylens_get_block_info

| 欄位 | 修改前 | 修改後 |
|------|--------|--------|
| INDEX | `FieldNumber(0, 0)` | `ValueInput('INDEX').setCheck('Number')` |
| INFO_TYPE | `FieldDropdown` | 無變更 |

### huskylens_get_arrow_info

| 欄位 | 修改前 | 修改後 |
|------|--------|--------|
| INDEX | `FieldNumber(0, 0)` | `ValueInput('INDEX').setCheck('Number')` |
| INFO_TYPE | `FieldDropdown` | 無變更 |

## 產生器取值變更

| 項目 | 修改前 | 修改後 |
|------|--------|--------|
| 取值方式 | `block.getFieldValue('INDEX')` | `valueToCode(block, 'INDEX', ORDER_ATOMIC) || '0'` |
| 回傳類型 | 固定數字字串 | 任意 JavaScript 表達式 |

## Toolbox Shadow Block

```json
{
    "INDEX": {
        "shadow": {
            "type": "math_number",
            "fields": {
                "NUM": 0
            }
        }
    }
}
```

## 無新增實體

- 無新增資料庫表格
- 無新增 API 端點
- 無新增設定檔
- 無狀態持久化需求
