# Quickstart: MicroPython 全域變數提升

**Date**: 2026-01-22  
**預計修改檔案**: 4 個  
**預計新增程式碼**: ~50 行

---

## 快速開始

### 修改檔案清單

| 檔案                                                | 修改類型    | 說明                 |
| --------------------------------------------------- | ----------- | -------------------- |
| `media/blockly/generators/micropython/index.js`     | 新增 + 修改 | 追蹤結構 + finish()  |
| `media/blockly/generators/micropython/variables.js` | 修改        | variables_set 積木   |
| `media/blockly/generators/micropython/functions.js` | 修改        | 函式定義積木         |
| `media/blockly/generators/micropython/loops.js`     | 確認        | 確認迴圈變數不受影響 |

---

## 實作步驟

### Step 1: 新增追蹤結構（index.js）

在 `init()` 函式中初始化：

```javascript
this.currentFunction_ = 'main';
this.functionGlobals_ = new Map();
this.functionGlobals_.set('main', new Set());
```

### Step 2: 修改 variables_set（variables.js）

```javascript
generator.forBlock['variables_set'] = function (block) {
	const varName = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
	const value = generator.valueToCode(block, 'VALUE', generator.ORDER_NONE) || '0';

	// 註冊全域變數
	generator.addVariable(varName, 'None');

	// 追蹤函式內賦值
	const currentFunc = generator.currentFunction_ || 'main';
	if (!generator.functionGlobals_.has(currentFunc)) {
		generator.functionGlobals_.set(currentFunc, new Set());
	}
	generator.functionGlobals_.get(currentFunc).add(varName);

	return `${varName} = ${value}\n`;
};
```

### Step 3: 修改函式定義（functions.js）

在 `procedures_defnoreturn` 和 `procedures_defreturn` 中：

1. 生成前設定 `currentFunction_ = funcName`
2. 生成後還原 `currentFunction_`
3. 查詢 `functionGlobals_` 並插入 `global` 宣告

### Step 4: 修改 finish()（index.js）

在 `def main():` 後插入 `global` 宣告。

---

## 測試驗證

### 測試案例 1: 自訂函式修改變數

**Blockly 積木**:

1. 建立變數 `count`
2. 建立函式 `increment`，內有 `count = count + 1`
3. main 中 `count = 0`，呼叫 `increment()`，印出 `count`

**預期輸出**:

```python
# [3] Global Variables
count = None

def increment():
    global count
    count = count + 1

def main():
    global count
    count = 0
    increment()
    print(count)
```

### 測試案例 2: 只讀取變數

**Blockly 積木**:

1. 建立變數 `score`
2. 建立函式 `show`，內只有 `print(score)`
3. main 中 `score = 100`，呼叫 `show()`

**預期輸出**:

```python
score = None

def show():
    # 無 global（只讀取）
    print(score)

def main():
    global score
    score = 100
    show()
```

### 測試案例 3: 迴圈變數不提升

**Blockly 積木**:

1. 使用 `controls_for` 迴圈（變數 `i`）
2. 建立變數 `sum`，在迴圈內累加

**預期輸出**:

```python
sum = None

def main():
    global sum
    sum = 0
    for i in range(1, 11):
        sum = sum + i
    # i 不在 Global Variables 區段
```

---

## 驗收標準

- [x] 自訂函式內可修改 main 中設定的變數
- [x] 只讀取變數的函式無 `global` 宣告
- [x] 迴圈變數不出現在 `[3] Global Variables`
- [x] 現有 MicroPython 積木無回歸
