# TXT 虛擬控制積木合約

**版本**：v1  
**積木定義位置**：`media/blockly/blocks/txt.js`  
**Generator 位置**：`media/blockly/generators/txt/txt.js`

---

## 合約概述

第一版虛擬控制畫布只支援建立 `button` 元件，因此 Blockly 與程式端的橋接也先聚焦在**讀取虛擬按鈕狀態**。

按鈕本身不是透過 block 建立；使用者是在虛擬控制畫布中建立按鈕，再由 TXT block 以 `stableId` 綁定它。

---

## v1 Block Surface

### `txt_virtual_button_state`

**用途**：讀取指定虛擬按鈕目前是否處於按下狀態。

**Blockly 型別**：value block  
**輸出**：`Number`（`1` 或 `0`）

### 建議介面

```text
讀取虛擬按鈕 [開始]
```

其中下拉選單顯示 `displayName`，但內部保存值是 `stableId`。

---

## 欄位與綁定規則

### Field model

```typescript
interface TxtVirtualButtonFieldValue {
    stableId: string;
}
```

### UI 顯示規則

- 下拉選單顯示目前按鈕的 `displayName`
- block 儲存值必須是 `stableId`
- rename 後：選單標籤與 block 顯示名稱要更新
- delete 後：若 `stableId` 找不到，該 block 轉為 invalid reference 狀態

---

## Invalid Reference Contract

當 block 綁定的 `stableId` 對應按鈕已不存在時：

1. block **保留**在工作區
2. block 顯示清楚警告文字
3. block 仍保留最後一次可辨識名稱（若有）供使用者理解
4. 工作區 preflight 判定為不可執行

### 不允許的 fallback

- 不可默默改成 `false`
- 不可自動改綁到第一顆按鈕
- 不可自動刪除 block

---

## Generator Contract

### 產出形式

建議 generator 產出 helper 呼叫：

```python
_txt_virtual_button_state('btn-001')
```

### Helper 行為

- 回傳 `1`：按下
- 回傳 `0`：未按下 / state unavailable
- 若 `stableId` 不存在於目前 runtime snapshot，也回傳 `0`

### 為什麼不直接產出 `identifier`

- `identifier` 會因 rename 與 collision resolution 被重算
- `stableId` 才是引用穩定鍵
- helper 以 `stableId` 查 canonical state file 最符合本 feature 的 binding model

---

## Toolbox Contract

### 類別位置

此 block 應加入 TXT toolbox 類別，並與既有 TXT 輸入 / 輸出相關積木放在同一組學習脈絡中。

### v1 範圍內應新增的使用者可見積木

| Block type | 說明 |
|------------|------|
| `txt_virtual_button_state` | 讀取某顆虛擬按鈕是否被按下 |

### v1 不新增的積木

- 不用 block 建立虛擬按鈕
- 不用 block 設定按鈕顏色
- 不用 block 編輯按鈕位置

這些都屬於畫布 UI 責任，而不是 Blockly 程式結構的一部分。

---

## Workspace / UI 同步規則

1. WebView 載入工作區後，`txt_virtual_button_state` 的選單資料來源必須來自 `txtVirtualControls.controls`
2. 按鈕 rename / delete 後，所有相關 block 顯示應同步更新
3. 若專案重新載入，block 綁定應由 `stableId` 重新解析
4. 若目前板子不是 `txt`，這個 block 不應出現在非 TXT toolbox 中

---

## 使用者語意契約

### 編輯模式

- block 只代表「程式未來要讀哪一顆按鈕」
- 點擊畫布上的按鈕不會讓這個 block 立即變成 pressed

### 執行模式

- block 讀到的是 companion runtime 目前記錄的 pressed state
- 滑鼠按下 -> `1`
- 滑鼠放開 -> `0`

---

## i18n 要求

此 block 至少需要新增：

- block label
- tooltip
- invalid reference warning
- empty dropdown / missing button placeholder

而且必須同步到 15 個 locale 檔案。

---

## 未來可擴充方向（非 v1）

- `txt_virtual_button_name`：取得顯示名稱
- `txt_virtual_control_exists`：檢查控制是否仍存在
- 其他控制型別（slider / toggle / joystick）對應的讀值 blocks

但第一版只承諾 `txt_virtual_button_state` 這個最小可用橋接面。