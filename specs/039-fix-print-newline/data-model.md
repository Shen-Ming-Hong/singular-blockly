# Data Model: text_print 積木換行控制

**Feature**: `039-fix-print-newline` | **Date**: 2026年2月4日

## Overview

本功能修復 `text_print` 積木在 MicroPython 程式碼產生器中的換行控制邏輯。資料模型主要涉及 Blockly 積木定義、欄位狀態和程式碼產生流程。

---

## Entities

### 1. text_print Block

**類型**: Blockly Block (積木物件)  
**位置**: `media/blockly/blocks/arduino.js:798`  
**用途**: 在終端機輸出文字訊息，支援換行控制

#### Fields

| 欄位名稱   | 類型             | 預設值   | 說明                                      |
| ---------- | ---------------- | -------- | ----------------------------------------- |
| `TEXT`     | ValueInput (any) | `""`     | 要輸出的文字內容 (支援字串、變數、表達式) |
| `NEW_LINE` | FieldCheckbox    | `"TRUE"` | 控制是否在輸出後換行                      |

#### Block Definition

```typescript
interface TextPrintBlock {
	type: 'text_print';
	inputs: {
		TEXT: {
			type: 'input_value';
			check: null; // 接受任何類型
		};
	};
	fields: {
		NEW_LINE: {
			type: 'field_checkbox';
			value: 'TRUE' | 'FALSE'; // 字串,非 boolean
		};
	};
	previousStatement: true; // 可連接上方積木
	nextStatement: true; // 可連接下方積木
	colour: number; // 積木顏色
	tooltip: string; // 工具提示文字
	helpUrl: string; // 說明文件 URL
}
```

#### State Transitions

```
[初始化]
  ↓
[NEW_LINE = "TRUE"] (預設勾選)
  ↓
使用者操作 checkbox → [NEW_LINE = "FALSE" | "TRUE"]
  ↓
[產生程式碼]
  ↓
Arduino:  Serial.println() | Serial.print()
MicroPython: print(msg) | print(msg, end='')
```

#### Validation Rules

- **TEXT 輸入**: 無限制,接受所有類型 (字串、數字、變數)
- **NEW_LINE 欄位**: 僅限 `"TRUE"` 或 `"FALSE"` (Blockly 保證)
- **積木連接**: 必須放置於 Statement context (不可放在 Value context)

---

### 2. NEW_LINE Field State

**類型**: FieldCheckbox  
**用途**: 使用者介面元件,控制換行行為

#### State Schema

```typescript
interface NewLineFieldState {
	name: 'NEW_LINE';
	type: 'field_checkbox';
	value: 'TRUE' | 'FALSE'; // 注意: 字串類型,非 boolean

	// UI 屬性
	checked: boolean; // 視覺上的勾選狀態

	// 行為
	onChange: () => void; // 使用者切換時觸發
}
```

#### State Mapping

| UI 狀態  | Field Value | Arduino 輸出          | MicroPython 輸出     |
| -------- | ----------- | --------------------- | -------------------- |
| ☑ 勾選   | `"TRUE"`    | `Serial.println(msg)` | `print(msg)`         |
| ☐ 未勾選 | `"FALSE"`   | `Serial.print(msg)`   | `print(msg, end='')` |

#### State Persistence

```typescript
// Workspace State (blockly/main.json)
{
    "blocks": {
        "blocks": [
            {
                "type": "text_print",
                "id": "block_id_123",
                "fields": {
                    "NEW_LINE": "FALSE"  // 持久化狀態
                },
                "inputs": {
                    "TEXT": {
                        "shadow": {
                            "type": "text",
                            "fields": { "TEXT": "Hello" }
                        }
                    }
                }
            }
        ]
    }
}
```

---

### 3. Generator Function (MicroPython)

**類型**: Code Generator  
**位置**: `media/blockly/generators/micropython/text.js`  
**用途**: 將 `text_print` 積木轉換為 MicroPython 程式碼

#### Generator Interface

```typescript
interface GeneratorFunction {
	// 輸入
	input: {
		block: TextPrintBlock; // Blockly 積木物件
		generator: MicropythonGenerator; // 產生器實例
	};

	// 處理流程
	process: {
		readTextField: () => string; // 讀取 TEXT 輸入
		readCheckbox: () => boolean; // 讀取 NEW_LINE 欄位
		formatCode: (msg: string, newLine: boolean) => string;
	};

	// 輸出
	output: string; // 生成的 MicroPython 程式碼
}
```

#### Generator Logic Flow

```
[Generator 被呼叫]
  ↓
[讀取 TEXT 輸入]
  valueToCode(block, 'TEXT', ORDER_NONE) → msg: string
  ↓
[讀取 NEW_LINE 欄位]
  getFieldValue('NEW_LINE') === 'TRUE' → newLine: boolean
  ↓
[條件式程式碼生成]
  newLine === true  → return `print(${msg})`
  newLine === false → return `print(${msg}, end='')`
  ↓
[輸出程式碼字串]
```

#### Code Generation Schema

```typescript
interface GeneratedCode {
	// 條件式輸出
	output: string; // `print(${msg})` | `print(${msg}, end='')`

	// 產生規則
	rules: {
		// 當 NEW_LINE = "TRUE"
		withNewLine: {
			template: 'print(${message})';
			example: 'print("Hello")';
		};

		// 當 NEW_LINE = "FALSE"
		withoutNewLine: {
			template: 'print(${message}, end="")';
			example: 'print("World", end="")';
		};
	};

	// 邊界情況
	edgeCases: {
		emptyInput: 'print("")';
		variableInput: 'print(variable_name)';
		expressionInput: 'print(x + y)';
	};
}
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────────┐
│  text_print Block   │
│  (Blockly 積木)     │
│                     │
│  Fields:            │
│  - TEXT: ValueInput │
│  - NEW_LINE: Checkbox│
└─────────────────────┘
          │
          │ 1:1 has
          ↓
┌─────────────────────┐
│  NEW_LINE Field     │
│  (FieldCheckbox)    │
│                     │
│  Value: "TRUE" | "FALSE"│
│  UI: ☑ | ☐          │
└─────────────────────┘
          │
          │ 1:1 read by
          ↓
┌─────────────────────┐
│ Generator Function  │
│ (MicroPython)       │
│                     │
│ getFieldValue('NEW_LINE')│
│       ↓             │
│ === 'TRUE' ? A : B  │
└─────────────────────┘
          │
          │ 1:1 produces
          ↓
┌─────────────────────┐
│  Generated Code     │
│  (String)           │
│                     │
│  print(msg) OR      │
│  print(msg, end='') │
└─────────────────────┘
```

---

## Data Flow

### User Interaction → Code Generation

```
1. 使用者從 Toolbox 拖曳 text_print 積木
   ↓
2. 積木初始化: NEW_LINE = "TRUE" (預設勾選)
   ↓
3. 使用者輸入文字到 TEXT 欄位: "Hello"
   ↓
4. 使用者取消勾選 NEW_LINE checkbox
   → NEW_LINE 值變更為 "FALSE"
   ↓
5. 儲存 Workspace State 到 blockly/main.json
   {
     "type": "text_print",
     "fields": { "NEW_LINE": "FALSE" },
     "inputs": { "TEXT": { "shadow": { "fields": { "TEXT": "Hello" }}}}
   }
   ↓
6. 使用者點擊「上傳程式碼」
   ↓
7. Generator 被呼叫:
   - msg = valueToCode(block, 'TEXT', ORDER_NONE) → '"Hello"'
   - newLine = getFieldValue('NEW_LINE') === 'TRUE' → false
   ↓
8. 條件式生成程式碼:
   return `print(${msg}${newLine ? '' : ', end=""'})`
   → 'print("Hello", end="")'
   ↓
9. 寫入 main.py 並上傳到 CyberBrick
   ↓
10. 終端機輸出: "Hello" (不換行,下一個輸出接續在同一行)
```

### Code Generation Decision Tree

```
Generator Function Invoked
  │
  ├─ Read TEXT Input
  │   ├─ Has Value → Use value
  │   └─ No Value → Use default '""'
  │
  ├─ Read NEW_LINE Field
  │   ├─ Value === 'TRUE' → newLine = true
  │   └─ Value === 'FALSE' → newLine = false
  │
  └─ Generate Code
      ├─ if (newLine === true)
      │   └─ return `print(${msg})`
      │
      └─ if (newLine === false)
          └─ return `print(${msg}, end="")`
```

---

## State Management

### Blockly Workspace State

```json
{
	"version": "1.0",
	"board": "cyberbrick",
	"blocks": {
		"languageVersion": 0,
		"blocks": [
			{
				"type": "text_print",
				"id": "unique_block_id",
				"x": 100,
				"y": 200,
				"fields": {
					"NEW_LINE": "FALSE" // ← KEY STATE
				},
				"inputs": {
					"TEXT": {
						"shadow": {
							"type": "text",
							"id": "shadow_id",
							"fields": {
								"TEXT": "Progress: "
							}
						}
					}
				},
				"next": {
					"block": {
						"type": "text_print",
						"fields": { "NEW_LINE": "TRUE" },
						"inputs": {
							/* ... */
						}
					}
				}
			}
		]
	}
}
```

### Generated Code State (main.py)

```python
# Generated from text_print blocks with different NEW_LINE states
print("Progress: ", end="")  # NEW_LINE = FALSE
print("100%")                 # NEW_LINE = TRUE

# Terminal Output:
# Progress: 100%
```

---

## Constraints & Invariants

### Invariants

1. **Field Value Type**: `NEW_LINE` 欄位的值永遠是字串 `"TRUE"` 或 `"FALSE"`,從不是 boolean
2. **Generator Output**: Generator 永遠返回字串,不可返回 `null` 或 `undefined`
3. **Code Validity**: 生成的程式碼必須是有效的 Python 語法
4. **Platform Consistency**: Arduino 和 MicroPython 版本在相同 `NEW_LINE` 狀態下行為必須一致

### Validation Rules

| 規則           | 驗證時機            | 驗證邏輯                                                                 |
| -------------- | ------------------- | ------------------------------------------------------------------------ |
| Field Value    | Generator execution | `typeof value === 'string' && (value === 'TRUE' \|\| value === 'FALSE')` |
| TEXT Input     | Generator execution | Allow any value (string/number/variable), use `""` if empty              |
| Generated Code | After generation    | Must match regex: `/^print\(.*\)(, end="")?\n$/`                         |
| Cross-Platform | Manual testing      | Arduino println/print ≈ MicroPython print()/print(end='')                |

---

## Edge Cases

### 1. 空輸入 (Empty TEXT)

```typescript
// Input
{
    "type": "text_print",
    "fields": { "NEW_LINE": "TRUE" },
    "inputs": { "TEXT": null }
}

// Generator Logic
const msg = valueToCode(block, 'TEXT', ORDER_NONE) || '""';
// msg = '""'

// Generated Code
print("")  // 輸出空行 (換行符)
```

### 2. 變數輸入 (Variable Input)

```typescript
// Input
{
    "type": "text_print",
    "inputs": {
        "TEXT": {
            "block": {
                "type": "variables_get",
                "fields": { "VAR": "message" }
            }
        }
    }
}

// Generator Logic
const msg = valueToCode(block, 'TEXT', ORDER_NONE);
// msg = 'message' (無引號)

// Generated Code
print(message)  // 輸出變數的值
```

### 3. 文字中包含換行符

```typescript
// Input
TEXT = 'Hello\nWorld';
NEW_LINE = FALSE;

// Generated Code
print('Hello\nWorld', end='');

// Terminal Output
Hello;
World[(無換行符結尾, 下一個輸出接續)];
```

### 4. 連續不換行後接換行

```typescript
// Blocks Sequence
1. text_print: TEXT = "A", NEW_LINE = FALSE
2. text_print: TEXT = "B", NEW_LINE = FALSE
3. text_print: TEXT = "C", NEW_LINE = TRUE

// Generated Code
print("A", end="")
print("B", end="")
print("C")

// Terminal Output
ABC
```

---

## Implementation Notes

### MicroPython Generator 修改重點

**檔案**: `media/blockly/generators/micropython/text.js`

**修改前** (錯誤版本):

```javascript
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	// ❌ 未讀取 NEW_LINE 欄位,直接使用 print
	return `print(${msg})`;
};
```

**修改後** (正確版本):

```javascript
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	// ✅ 讀取 NEW_LINE 欄位
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// ✅ 條件式生成程式碼
	return `print(${msg}${newLine ? '' : ', end=""'})`;
};
```

### 關鍵變更

1. **新增欄位讀取**: `const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';`
2. **條件式字串拼接**: `${newLine ? '' : ', end=""'}`
3. **保持 Arduino 邏輯對等**: `println/print` ≈ `print()/print(end='')`

---

## Testing Strategy

參考 [research.md](research.md#4-generator-函數測試策略) 的詳細測試策略。

### Key Test Scenarios

| 測試場景 | NEW_LINE | TEXT    | 預期輸出                 |
| -------- | -------- | ------- | ------------------------ |
| 標準換行 | TRUE     | "Hello" | `print("Hello")`         |
| 抑制換行 | FALSE    | "World" | `print("World", end="")` |
| 空輸入   | TRUE     | (空)    | `print("")`              |
| 變數輸入 | FALSE    | var:msg | `print(msg, end="")`     |

---

**Data Model Version**: 1.0  
**Status**: ✅ Ready for Implementation  
**Last Updated**: 2026年2月4日
