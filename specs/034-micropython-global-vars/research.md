# Research: MicroPython 全域變數提升

**Date**: 2026-01-22  
**Status**: Complete  
**Related**: [spec.md](spec.md) | [plan.md](plan.md)

## 研究問題

1. 現有生成器如何管理變數宣告？
2. 函式生成時如何知道需要插入 `global`？
3. 如何排除迴圈變數？
4. Python 的 `global` 語法規則為何？

---

## 研究結果

### 1. 現有生成器變數管理

**Decision**: 使用既有的 `addVariable()` API 和 `variables_` Map

**Rationale**:

- `index.js` 已有完整的變數追蹤結構（Line 53: `variables_ = new Map()`）
- `addVariable(name, initialValue)` API 已存在（Line 328-332）
- `finish()` 已在 `[3] Global Variables` 區段輸出變數宣告
- 問題是 `variables_set` 積木**未呼叫** `addVariable()`

**Alternatives Considered**:

- 新建獨立的變數追蹤系統 → 拒絕：重複造輪子，增加維護負擔

**現有程式碼參考**:

```javascript
// index.js:53
window.micropythonGenerator.variables_ = new Map();

// index.js:328-332
window.micropythonGenerator.addVariable = function (name, initialValue) {
    if (!this.variables_.has(name)) {
        this.variables_.set(name, { name, initialValue });
    }
};

// variables.js:28-32 (目前)
generator.forBlock['variables_set'] = function (block) {
    const varName = generator.nameDB_.getName(...);
    const value = generator.valueToCode(block, 'VALUE', ...) || '0';
    return `${varName} = ${value}\n`;  // ← 沒有呼叫 addVariable()
};
```

---

### 2. 函式內 global 插入機制

**Decision**: 新增 `currentFunction_` 和 `functionGlobals_` 追蹤結構

**Rationale**:

- 需要知道「哪個函式內有哪些變數賦值」
- `currentFunction_` 記錄目前正在生成的函式名稱
- `functionGlobals_` 用 Map<string, Set<string>> 記錄每個函式的變數

**實作流程**:

1. `init()` 初始化：`currentFunction_ = 'main'`, `functionGlobals_ = new Map()`
2. 函式生成開始：設定 `currentFunction_ = funcName`
3. `variables_set` 生成時：將 varName 加入 `functionGlobals_.get(currentFunction_)`
4. 函式生成結束：查詢 `functionGlobals_.get(funcName)` 並插入 `global` 宣告
5. `finish()` 處理 main 的 `global` 宣告

**Alternatives Considered**:

- 在 `variables_set` 直接判斷是否在函式內 → 拒絕：無法取得函式名稱
- 用 block.getParent() 遞迴查找 → 拒絕：複雜且不可靠

---

### 3. 迴圈變數排除

**Decision**: 迴圈變數由積木生成器內部處理，不呼叫 `addVariable()`

**Rationale**:

- `controls_for` 使用 `nameDB_.getName()` 取得變數名（Line 95）
- `controls_forEach` 同樣使用 `nameDB_.getName()`（Line 107）
- `controls_repeat_ext` 使用 `nameDB_.getDistinctName('count', ...)` 產生臨時變數（Line 81）
- 這些積木**從未呼叫** `addVariable()`，所以不會出現在全域區段 ✅

**現有程式碼確認**:

```javascript
// loops.js:95 - controls_for
const variable0 = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
// 沒有呼叫 addVariable()

// loops.js:107 - controls_forEach
const variable0 = generator.nameDB_.getName(block.getFieldValue('VAR'), Blockly.VARIABLE_CATEGORY_NAME);
// 沒有呼叫 addVariable()
```

**結論**: 迴圈變數無需額外處理，現況已正確排除。

---

### 4. Python global 語法規則

**Decision**: 遵循 Python 3 標準語法

**Python global 規則**:

1. `global` 宣告必須在函式開頭（賦值之前）
2. 只有「賦值」操作需要 `global`，「讀取」不需要
3. 函式參數優先於全域變數（區域遮蔽）
4. 多個變數可合併：`global x, y, z`

**正確範例**:

```python
count = None  # 全域宣告

def increment():
    global count  # 必須在賦值前宣告
    count = count + 1

def show():
    print(count)  # 只讀取，不需要 global
```

**結論**: 在函式定義的第一行插入 `global` 宣告。

---

## 實作細節

### 新增追蹤結構（index.js）

```javascript
// 在 init() 中初始化
window.micropythonGenerator.currentFunction_ = 'main';
window.micropythonGenerator.functionGlobals_ = new Map();
window.micropythonGenerator.functionGlobals_.set('main', new Set());

// 在 finish() 中清理
this.currentFunction_ = 'main';
this.functionGlobals_.clear();
```

### 修改 variables_set（variables.js）

```javascript
generator.forBlock['variables_set'] = function (block) {
    const varName = generator.nameDB_.getName(...);
    const value = generator.valueToCode(block, 'VALUE', ...) || '0';

    // 新增：註冊全域變數
    generator.addVariable(varName, 'None');

    // 新增：追蹤函式內賦值
    const currentFunc = generator.currentFunction_ || 'main';
    if (!generator.functionGlobals_.has(currentFunc)) {
        generator.functionGlobals_.set(currentFunc, new Set());
    }
    generator.functionGlobals_.get(currentFunc).add(varName);

    return `${varName} = ${value}\n`;
};
```

### 修改函式生成（functions.js）

```javascript
generator.forBlock['procedures_defnoreturn'] = function (block) {
    const funcName = generator.nameDB_.getName(...);

    // 設定目前函式
    const prevFunction = generator.currentFunction_;
    generator.currentFunction_ = funcName;
    generator.functionGlobals_.set(funcName, new Set());

    // 生成函式內容
    let branch = generator.statementToCode(block, 'STACK');

    // 還原
    generator.currentFunction_ = prevFunction;

    // 取得需要 global 的變數
    const globals = generator.functionGlobals_.get(funcName);
    let globalDecl = '';
    if (globals && globals.size > 0) {
        globalDecl = generator.INDENT + 'global ' + Array.from(globals).join(', ') + '\n';
    }

    // 組裝程式碼
    const code = 'def ' + funcName + '(...):\n' + globalDecl + branch;
    generator.addFunction(funcName, code);
    return null;
};
```

### 修改 finish() 處理 main（index.js）

```javascript
// 在 def main(): 後插入 global 宣告
const mainGlobals = this.functionGlobals_.get('main');
let mainGlobalDecl = '';
if (mainGlobals && mainGlobals.size > 0) {
	mainGlobalDecl = this.INDENT + 'global ' + Array.from(mainGlobals).join(', ') + '\n';
}

fullCode += 'def main():\n';
fullCode += mainGlobalDecl; // ← 新增
if (code && code.trim()) {
	fullCode += code;
} else {
	fullCode += this.INDENT + 'pass\n';
}
```

---

## 參考資料

- Python 3 `global` 語句: https://docs.python.org/3/reference/simple_stmts.html#the-global-statement
- Blockly Generator API: 專案內 `media/blockly/generators/micropython/index.js`
