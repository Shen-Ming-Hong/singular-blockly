# Data Model: MicroPython 全域變數提升

**Date**: 2026-01-22  
**Related**: [spec.md](spec.md) | [plan.md](plan.md) | [research.md](research.md)

## 實體定義

本功能新增 2 個追蹤實體到 MicroPython 生成器：

### 1. currentFunction\_

| 屬性         | 說明                                                 |
| ------------ | ---------------------------------------------------- |
| **類型**     | `string`                                             |
| **用途**     | 記錄目前正在生成的函式名稱                           |
| **預設值**   | `'main'`                                             |
| **生命週期** | `init()` 初始化 → 函式生成時更新 → `finish()` 後重置 |

**狀態轉換**:

```
init() → 'main'
    ↓
procedures_defnoreturn 開始 → 'myFunction'
    ↓
procedures_defnoreturn 結束 → 'main'（還原）
    ↓
finish() → 重置
```

### 2. functionGlobals\_

| 屬性         | 說明                                                     |
| ------------ | -------------------------------------------------------- |
| **類型**     | `Map<string, Set<string>>`                               |
| **用途**     | 追蹤每個函式內有賦值的變數名稱                           |
| **Key**      | 函式名稱（包含 `'main'`）                                |
| **Value**    | 該函式內有賦值的變數名稱 Set                             |
| **生命週期** | `init()` 初始化 → `variables_set` 更新 → `finish()` 清理 |

**資料範例**:

```javascript
functionGlobals_ = Map {
    'main' => Set { 'count', 'score' },
    'increment' => Set { 'count' },
    'show' => Set { }  // 只讀取，無賦值
}
```

---

## 既有實體（無需修改結構）

### variables\_

| 屬性     | 說明                                                |
| -------- | --------------------------------------------------- |
| **類型** | `Map<string, {name: string, initialValue: string}>` |
| **用途** | 儲存全域變數宣告                                    |
| **位置** | `index.js:53`                                       |

**修改點**: `variables_set` 積木生成時呼叫 `addVariable(varName, 'None')`

---

## 關係圖

```
┌─────────────────┐
│   variables_    │ ← 全域變數宣告（輸出到 [3] Global Variables）
│  Map<name, obj> │
└────────┬────────┘
         │ addVariable() 呼叫
         │
┌────────▼────────┐
│  variables_set  │ ← 變數設定積木
│     積木生成     │
└────────┬────────┘
         │ 追蹤賦值
         │
┌────────▼────────────┐
│  functionGlobals_   │ ← 函式內賦值追蹤
│ Map<func, Set<var>> │
└────────┬────────────┘
         │ 查詢
         │
┌────────▼────────┐     ┌──────────────────┐
│ currentFunction_│ ←───│ procedures_def*  │
│     string      │     │  設定目前函式    │
└─────────────────┘     └──────────────────┘
```

---

## 初始化與清理

### init() 新增內容

```javascript
this.currentFunction_ = 'main';
this.functionGlobals_ = new Map();
this.functionGlobals_.set('main', new Set());
```

### finish() 新增內容（清理部分）

```javascript
this.currentFunction_ = 'main';
this.functionGlobals_.clear();
```

---

## 驗證規則

1. **變數名稱唯一性**: 由 `nameDB_.getName()` 保證
2. **函式內重複賦值**: Set 自動去重，只記錄一次
3. **空集合處理**: 若 `functionGlobals_.get(func).size === 0`，不插入 `global`
