# 資料模型：防止孤立積木產生無效程式碼

**功能分支**: `044-prevent-orphan-blocks`
**建立日期**: 2025-07-15

## 概述

本功能的資料模型著重於定義積木分類體系與狀態轉換，而非傳統的資料庫實體。所有資料結構均在記憶體中運作（JavaScript 物件/陣列），不涉及持久化儲存。

---

## 實體定義

### 1. AllowedTopLevelBlocks（允許的頂層積木清單）

**用途**: 定義哪些積木類型允許作為工作區頂層積木並直接生成程式碼

| 欄位 | 型別 | 說明 | 驗證規則 |
|------|------|------|----------|
| blockType | `string` | 積木類型識別碼 | 必須對應 Blockly 註冊的積木類型 |
| generator | `'arduino' \| 'micropython'` | 所屬 generator | 必須為支援的 generator 之一 |

**Arduino 模式實例**:
```javascript
allowedTopLevelBlocks_ = [
    'arduino_setup_loop',      // setup()/loop() 主容器
    'arduino_function',         // 自訂函式
    'procedures_defnoreturn',   // 無回傳值程序
    'procedures_defreturn',     // 有回傳值程序
]
```

**MicroPython 模式實例**:
```javascript
allowedTopLevelBlocks_ = [
    'micropython_main',         // 主程式容器
    'procedures_defnoreturn',   // 無回傳值程序
    'procedures_defreturn',     // 有回傳值程序
    'arduino_function',         // 共用函式積木
]
```

**關係**: 被 `workspaceToCode()` 覆寫引用，決定頂層過濾邏輯

---

### 2. AllowedContainers（合法容器清單）

**用途**: 定義控制積木可以合法嵌套於其中的容器類型

| 欄位 | 型別 | 說明 | 驗證規則 |
|------|------|------|----------|
| containerType | `string` | 容器積木類型識別碼 | 必須對應 Blockly 註冊的積木類型 |

**共用容器清單**:
```javascript
const ALLOWED_CONTAINERS = [
    'arduino_setup_loop',      // Arduino: setup()/loop()
    'arduino_function',         // 自訂函式
    'procedures_defnoreturn',   // 無回傳值程序
    'procedures_defreturn',     // 有回傳值程序
    'micropython_main',         // MicroPython: 主程式
]
```

**關係**: 被 `isInAllowedContext()` helper 引用，用於 `getSurroundParent()` 遞迴檢查

---

### 3. GuardedBlocks（受防護的控制流程積木）

**用途**: 列舉需要在 `forBlock` handler 中加入深層防護 guard 的積木類型

| 積木類型 | 分類 | Arduino | MicroPython | 說明 |
|----------|------|---------|-------------|------|
| `controls_repeat_ext` | 迴圈 | ✅ | ✅ | 重複 N 次 |
| `controls_whileUntil` | 迴圈 | ✅ | ✅ | while/until 迴圈 |
| `controls_for` | 迴圈 | ✅ | ✅ | 計數 for 迴圈 |
| `controls_forEach` | 迴圈 | ✅ | ✅ | forEach 迴圈 |
| `controls_if` | 條件 | ✅ | ✅ | if/else 條件 |
| `singular_flow_statements` | 流程控制 | ✅ | ✅ | break/continue |
| `controls_duration` | 迴圈 | ✅ | N/A | 計時迴圈（Arduino 專用）|

**關係**: 每個積木的 `forBlock` handler 開頭加入 `isInAllowedContext()` 檢查

---

### 4. AlwaysGenerateBlocks（始終生成積木）

**用途**: 已註冊的特殊積木，即使不在標準容器內也需要生成程式碼

| 欄位 | 型別 | 說明 | 驗證規則 |
|------|------|------|----------|
| blockType | `string` | 積木類型識別碼 | 透過 `registerAlwaysGenerateBlock()` 動態註冊 |

**現有已註冊積木**（例如）:
- `servo_setup` — 伺服馬達設定
- `encoder_setup` — 編碼器設定

**關係**: 在 `arduino_setup_loop.forBlock` 內部掃描處理，不受 `workspaceToCode` 頂層過濾影響

---

### 5. OrphanBlockWarning（孤立積木警告訊息）

**用途**: 孤立積木上顯示的多語系警告訊息

| 欄位 | 型別 | 說明 |
|------|------|------|
| key | `string` | i18n 鍵值：`ORPHAN_BLOCK_WARNING` |
| message | `Record<string, string>` | 15 個語系的翻譯字串 |

**語系範例**:

| 語系 | 訊息 |
|------|------|
| `en` | `This block must be placed inside setup(), loop(), or a function to generate code.` |
| `zh-hant` | `此積木必須放在 setup()、loop() 或函式內才能產生程式碼。` |
| `ja` | `このブロックはコードを生成するために setup()、loop()、または関数の中に配置する必要があります。` |
| `ko` | `이 블록은 코드를 생성하려면 setup(), loop() 또는 함수 안에 배치해야 합니다.` |
| `de` | `Dieser Block muss in setup(), loop() oder einer Funktion platziert werden, um Code zu generieren.` |
| `fr` | `Ce bloc doit être placé dans setup(), loop() ou une fonction pour générer du code.` |
| `es` | `Este bloque debe colocarse dentro de setup(), loop() o una función para generar código.` |
| `it` | `Questo blocco deve essere posizionato all'interno di setup(), loop() o una funzione per generare codice.` |
| `pt-br` | `Este bloco deve ser colocado dentro de setup(), loop() ou uma função para gerar código.` |
| `ru` | `Этот блок должен быть размещён внутри setup(), loop() или функции для генерации кода.` |
| `pl` | `Ten blok musi być umieszczony wewnątrz setup(), loop() lub funkcji, aby wygenerować kod.` |
| `tr` | `Bu blok, kod üretmek için setup(), loop() veya bir fonksiyonun içine yerleştirilmelidir.` |
| `hu` | `Ezt a blokkot a setup(), loop() vagy egy függvényen belül kell elhelyezni a kód generálásához.` |
| `cs` | `Tento blok musí být umístěn uvnitř setup(), loop() nebo funkce pro generování kódu.` |
| `bg` | `Този блок трябва да бъде поставен вътре в setup(), loop() или функция, за да генерира код.` |

---

## 狀態轉換

### 積木的孤立狀態機

```
┌─────────────┐     放置到工作區空白處     ┌──────────────┐
│   正常狀態   │ ──────────────────────── → │   孤立狀態   │
│ (在合法容器) │                            │ (工作區頂層)  │
│              │     拖入合法容器           │              │
│ • 無警告     │ ← ──────────────────────── │ • 顯示警告    │
│ • 正常生成   │                            │ • 不生成程式碼 │
│   程式碼     │                            │ • 輸出註解    │
└─────────────┘                            └──────────────┘
       ↑                                          │
       │         複製貼上到容器內                    │
       └──────────────────────────────────────────┘
                 Undo/Redo 還原到容器
```

**觸發事件**:
- `Blockly.Events.BLOCK_MOVE`：積木拖放完成
- `Blockly.Events.BLOCK_CREATE`：積木建立（包含複製貼上）
- `Blockly.Events.FINISHED_LOADING`：工作區載入/Undo/Redo

**狀態判定邏輯**: `isInAllowedContext(block)` → `true`（正常）/ `false`（孤立）

---

## 資料流程圖

```
使用者操作（拖放/複製/Undo）
         │
         ▼
  Blockly 事件觸發
         │
         ├──→ block.onchange() 回呼
         │         │
         │         ▼
         │    isInAllowedContext(block)
         │         │
         │    ┌────┴────┐
         │    │ true    │ false
         │    ▼         ▼
         │  清除警告  設定警告
         │ setWarningText(null)  setWarningText(msg)
         │
         └──→ debouncedCodeUpdate() (300ms)
                   │
                   ▼
            workspaceToCode(workspace)
                   │
                   ├── 過濾頂層積木（allowedTopLevelBlocks_）
                   │      │
                   │      ├── 允許 → blockToCode(block)
                   │      └── 跳過 → 加入註解
                   │
                   ▼
            forBlock[type](block)
                   │
                   ├── isInAllowedContext guard
                   │      │
                   │      ├── 通過 → 生成程式碼
                   │      └── 失敗 → return ''
                   │
                   ▼
            finish() → 組裝完整程式碼
```

---

## 關係摘要

```
AllowedTopLevelBlocks ──uses──→ workspaceToCode() 覆寫
AllowedContainers ──uses──→ isInAllowedContext() helper
GuardedBlocks ──guard-by──→ isInAllowedContext() 在 forBlock 中
AlwaysGenerateBlocks ──scanned-by──→ arduino_setup_loop.forBlock
OrphanBlockWarning ──displayed-by──→ block.setWarningText() 在 onchange 中
```
