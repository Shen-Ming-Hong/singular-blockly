# Data Model: MicroPython Custom Function Generator

**Date**: 2025-12-31  
**Feature Branch**: `022-micropython-custom-function`

## 概述

本文件定義 `arduino_function` 和 `arduino_function_call` 積木在 MicroPython 程式碼生成中的資料模型。

---

## 1. 實體定義

### 1.1 ArduinoFunctionBlock（函數定義積木）

**Blockly 積木類型**: `arduino_function`

| 屬性             | 型別         | 必填 | 說明                                   |
| ---------------- | ------------ | ---- | -------------------------------------- |
| `NAME`           | `string`     | ✅   | 函數名稱（支援中文）                   |
| `arguments_`     | `string[]`   | ✅   | 參數名稱陣列                           |
| `argumentTypes_` | `string[]`   | ✅   | 參數型別陣列（MicroPython 生成時忽略） |
| `STACK`          | `Connection` | ✅   | 函數體語句輸入連接                     |

**有效型別值**:

-   `'int'` - 整數
-   `'float'` - 浮點數
-   `'bool'` - 布林值
-   `'String'` - 字串

**驗證規則**:

-   `NAME` 不可為空
-   `arguments_.length === argumentTypes_.length`

### 1.2 ArduinoFunctionCallBlock（函數呼叫積木）

**Blockly 積木類型**: `arduino_function_call`

| 屬性             | 型別         | 必填       | 說明              |
| ---------------- | ------------ | ---------- | ----------------- |
| `NAME`           | `string`     | ✅         | 呼叫的函數名稱    |
| `arguments_`     | `string[]`   | ✅         | 參數名稱陣列      |
| `argumentTypes_` | `string[]`   | ✅         | 參數型別陣列      |
| `ARG{n}`         | `ValueInput` | 依參數數量 | 第 n 個參數值輸入 |

**連接類型**:

-   `previousConnection: true` - 可連接上方積木
-   `nextConnection: true` - 可連接下方積木
-   `outputConnection: false` - 無輸出連接（語句積木）

---

## 2. 生成器資料結構

### 2.1 MicroPythonGenerator 擴展

```typescript
interface MicroPythonGeneratorExtensions {
	// 既有屬性
	functions_: Map<string, FunctionDefinition>;
	allowedTopLevelBlocks_: string[];

	// 方法
	addFunction(name: string, code: string): void;
}

interface FunctionDefinition {
	name: string; // 函數名稱
	code: string; // 完整函數定義程式碼
}
```

### 2.2 allowedTopLevelBlocks\_ 更新

**當前值**:

```javascript
['micropython_main', 'procedures_defnoreturn', 'procedures_defreturn'];
```

**更新後**:

```javascript
['micropython_main', 'procedures_defnoreturn', 'procedures_defreturn', 'arduino_function'];
```

---

## 3. 輸入/輸出對應

### 3.1 arduino_function 生成對應

**輸入（Blockly Block）**:

```javascript
{
    type: 'arduino_function',
    fields: { NAME: '馬達控制' },
    extraState: {
        arguments_: ['speed', 'direction'],
        argumentTypes_: ['int', 'int']
    },
    inputs: {
        STACK: { /* 連接的語句積木 */ }
    }
}
```

**輸出（MicroPython Code）**:

```python
def 馬達控制(speed, direction):
    # STACK 內容...
    pass  # 若 STACK 為空
```

### 3.2 arduino_function_call 生成對應

**輸入（Blockly Block）**:

```javascript
{
    type: 'arduino_function_call',
    fields: { NAME: '馬達控制' },
    extraState: {
        arguments_: ['speed', 'direction'],
        argumentTypes_: ['int', 'int']
    },
    inputs: {
        ARG0: { shadow: { type: 'math_number', fields: { NUM: 100 } } },
        ARG1: { shadow: { type: 'math_number', fields: { NUM: 1 } } }
    }
}
```

**輸出（MicroPython Code）**:

```python
馬達控制(100, 1)
```

---

## 4. 狀態轉換

### 4.1 函數定義生成流程

```
[Blockly Block] → [Generator] → [functions_ Map] → [finish()] → [輸出程式碼]
     │                │               │                │              │
     │                │               │                │              │
     ▼                ▼               ▼                ▼              ▼
arduino_function  forBlock()   addFunction()     組合函數區塊    # [4] User Functions
                                                               def 函數名():
                                                                   ...
```

### 4.2 函數呼叫生成流程

```
[Blockly Block] → [Generator] → [直接返回程式碼]
     │                │               │
     │                │               │
     ▼                ▼               ▼
arduino_function_call  forBlock()  "函數名(參數...)\n"
```

---

## 5. 錯誤處理

### 5.1 預設值對應表

當參數輸入未連接積木時，使用預設值：

| Arduino 型別 | MicroPython 預設值 |
| ------------ | ------------------ |
| `int`        | `0`                |
| `float`      | `0.0`              |
| `bool`       | `False`            |
| `String`     | `''`               |
| 未指定       | `None`             |

### 5.2 空函數體處理

| 狀態                     | 處理        |
| ------------------------ | ----------- |
| STACK 無連接             | 生成 `pass` |
| STACK 有連接但生成空字串 | 生成 `pass` |
| STACK 有有效內容         | 正常輸出    |

---

## 6. 關係圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Blockly Workspace                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────────────┐  │
│  │  arduino_function   │     │   arduino_function_call     │  │
│  │  ┌───────────────┐  │     │  ┌─────────────────────┐   │  │
│  │  │ NAME: 馬達控制│  │     │  │ NAME: 馬達控制       │   │  │
│  │  ├───────────────┤  │     │  ├─────────────────────┤   │  │
│  │  │ arguments_:   │  │◄────│  │ arguments_: (同步)  │   │  │
│  │  │ ['speed']     │  │     │  │ ['speed']           │   │  │
│  │  ├───────────────┤  │     │  ├─────────────────────┤   │  │
│  │  │ STACK:        │  │     │  │ ARG0: ─────────┐    │   │  │
│  │  │ [語句積木]    │  │     │  │              ▼    │   │  │
│  │  └───────────────┘  │     │  │         [100]     │   │  │
│  └─────────────────────┘     │  └─────────────────────┘   │  │
│             │                │             │               │  │
└─────────────┼────────────────┼─────────────┼───────────────┘  │
              │                              │                   │
              ▼                              ▼                   │
┌─────────────────────────────────────────────────────────────────┐
│                   MicroPython Generator                         │
├─────────────────────────────────────────────────────────────────┤
│  forBlock['arduino_function']    forBlock['arduino_function_call']│
│           │                                │                     │
│           ▼                                ▼                     │
│  ┌─────────────────┐              ┌──────────────────┐         │
│  │ addFunction()   │              │ 直接返回程式碼   │         │
│  │     │           │              │                  │         │
│  │     ▼           │              │                  │         │
│  │ functions_ Map  │              │ "馬達控制(100)\n"│         │
│  └─────────────────┘              └──────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Generated Code                              │
├─────────────────────────────────────────────────────────────────┤
│  # [4] User Functions                                           │
│  def 馬達控制(speed):                                           │
│      pass                                                        │
│                                                                 │
│  # [5] Main Program                                             │
│  def main():                                                    │
│      馬達控制(100)                                              │
└─────────────────────────────────────────────────────────────────┘
```
