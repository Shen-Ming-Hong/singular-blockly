# 資料模型：鎖定函式積木 (Lock Function Block)

**Phase**: 1 — 設計與合約  
**Branch**: `050-lock-function-block`  
**Date**: 2026-04-08

---

## 核心實體

### LockState（鎖定狀態）

附加於函式定義積木的運行時屬性，決定積木的行為與外觀。

| 屬性 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `isLocked_` | `boolean` | `false` | 積木是否處於鎖定狀態 |

**生命週期**：
1. **初始化**：`init()` 呼叫時設為 `false`
2. **鎖定**：使用者右鍵 → 「鎖定積木」→ `setLocked_(true)` → `applyLockState_(true)`
3. **解鎖**：使用者右鍵 → 「解鎖積木」→ `setLocked_(false)` → `applyLockState_(false)`
4. **序列化**（儲存）：由 `mutationToDom` 或 `saveExtraState` 寫入存檔
5. **反序列化**（讀取）：由 `domToMutation` 或 `loadExtraState` 讀取並呼叫 `applyLockState_()`
6. **積木刪除**：隨積木銷毀，不留殘留

---

## 方法定義

### `setLocked_(locked: boolean): void`
入口方法。包裹在 `Blockly.Events.disable()`/`enable()` 之間，確保操作不進入 undo 佇列，然後呼叫 `applyLockState_(locked)`。

```
setLocked_(locked)
  ├── Blockly.Events.disable()
  ├── this.isLocked_ = locked
  ├── applyLockState_(locked)
  └── Blockly.Events.enable()
```

### `applyLockState_(locked: boolean): void`
實際套用視覺與行為限制的方法：

```
applyLockState_(locked)
  ├── this.setDeletable(!locked)              // 防止刪除整個積木
  ├── this.getField('NAME').setEnabled(!locked) // 防止重新命名
  ├── locked
  │   ? this.setStyle('locked_procedure_blocks') + 加 🔒 圖示
  │   : this.setStyle('procedure_blocks')     + 移除 🔒 圖示
  └── (STACK 保護由 workspace onchange 監聽器處理)
```

---

## 序列化格式

### arduino_function（XML Mutation）

```xml
<!-- 鎖定狀態 -->
<mutation locked="1">
  <arg name="x" type="int"/>
</mutation>

<!-- 未鎖定 / 舊版檔案（不含 locked 屬性）-->
<mutation>
  <arg name="x" type="int"/>
</mutation>
```

### procedures_defnoreturn / procedures_defreturn（JSON Extra State）

```json
{
  "hasStatements": true,
  "params": [
    {"name": "x", "id": "abc123"}
  ],
  "locked": true
}
```

未鎖定時不寫入 `locked` 鍵（減少存檔體積，向下相容一致）。

---

## 狀態轉移圖

```
           右鍵「鎖定積木」
UNLOCKED ──────────────────► LOCKED
  ▲                              │
  │    右鍵「解鎖積木」           │
  └──────────────────────────────┘

LOADED (重開檔案)
  ├── locked="1" / locked:true → LOCKED
  └── (無屬性) / locked:false  → UNLOCKED
```

---

## 積木類型對應表

| 積木類型 | 板子 | 序列化方式 | 保護的欄位名稱 |
|---|---|---|---|
| `arduino_function` | Arduino | XML Mutation | `NAME` |
| `procedures_defnoreturn` | CyberBrick / MicroPython | JSON saveExtraState | `NAME` |
| `procedures_defreturn` | CyberBrick / MicroPython | JSON saveExtraState | `NAME` |

---

## STACK 保護事件流

```
使用者拖拽積木到鎖定函式的 STACK
  │
  ▼
Blockly.Events.BLOCK_MOVE 觸發
  │
  ├── 是否 newParentId 指向鎖定積木的 STACK？
  │   YES → 內包 Events.disable/enable：
  │         1. block.unplug()          // 斷開連接
  │         2. block.moveTo(oldXY)    // 歸還到原座標
  │         NO → 允許通過
  │
  └── 是否 oldParentId 指向鎖定積木的 STACK？
      （子積木被拖出）
      YES → 還原：重新連接回 oldInputName 輸入口
      NO  → 允許通過
```

---

## i18n 鍵定義

| 鍵名 | 用途 | 英文範例值 |
|---|---|---|
| `FUNCTION_LOCK_BLOCK` | 右鍵選單「鎖定積木」選項 | `'Lock Block'` |
| `FUNCTION_UNLOCK_BLOCK` | 右鍵選單「解鎖積木」選項 | `'Unlock Block'` |

需新增至全部 15 個語系的 `messages.js` 檔案。

---

## 主題樣式定義

| 樣式名稱 | 主題 | `colourPrimary` | 說明 |
|---|---|---|---|
| `locked_procedure_blocks` | singular（淺色）| `'#9E9E9E'` | 中性灰 |
| `locked_procedure_blocks` | singularDark（深色）| `'#757575'` | 稍深灰 |
