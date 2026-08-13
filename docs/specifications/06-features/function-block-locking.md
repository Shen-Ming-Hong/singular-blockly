# 函式積木鎖定

> 來源：`specs/050-lock-function-block`（2026-04）

函式積木鎖定用於降低教學活動中誤刪或誤改函式定義的機率。它是可由任何使用者解除的編輯輔助，不是權限、安全或密碼機制。

## 適用積木

- `arduino_function`
- `procedures_defnoreturn`
- `procedures_defreturn`

右鍵選單透過 Blockly `ContextMenuRegistry` 註冊 `lock_function_block`，並使用 `FUNCTION_LOCK_BLOCK`／`FUNCTION_UNLOCK_BLOCK` 在地化訊息。鎖定狀態要有清楚的視覺樣式與圖示。

## 鎖定行為

鎖定後必須防止：

- 刪除函式定義。
- 修改函式名稱。
- 透過 mutator 改寫參數結構。
- 將 statement stack 拖入或拖出函式；若 Blockly 已開始移動，需恢復原連接。
- 刪除鎖定函式內的子積木。

函式呼叫積木仍可正常建立、移動與使用。鎖定／解鎖本身不列入 undo 歷史；複製函式定義時則保留鎖定狀態。

## 儲存相容性

Arduino XML mutation 使用 `locked="1"`；MicroPython JSON extra state 使用 `locked: true`。欄位缺少時一律視為未鎖定，讓舊工作區可直接載入；不認識新欄位的舊版本也應忽略它，而不是破壞工作區。
