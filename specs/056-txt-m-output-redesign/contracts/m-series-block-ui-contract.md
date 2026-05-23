# 契約：TXT M 系列積木 UI

## 適用範圍

本契約定義 TXT M 系列設定積木與停止積木的公開作者體驗。它約束 `txt_motor_speed` 與 `txt_motor_stop` 的可見文案、欄位、動態 shape 與舊工作區相容行為。

## M 系列設定積木

### 固定句型

設定類積木必須以此概念句型呈現：

```text
輸出 [M選單] [元件名稱] ...
```

### 欄位

| 欄位 | 類型 | 必要 | 說明 |
|---|---|---:|---|
| `MOTOR` 或等價既有埠欄位 | dropdown | 是 | 選擇 `M1` 到 `M4`。若既有欄位名稱已是 `MOTOR`，實作可沿用以降低 migration 成本。 |
| `COMPONENT` | dropdown | 是 | 選擇 `MOTOR` 或 `LAMP`。缺值時預設 `MOTOR`。 |
| `DIRECTION` | dropdown | 僅 MOTOR | `MOTOR` 模式顯示；`LAMP` 模式不得顯示。 |
| `SPEED` 或等價數值欄位 | number/value | 是 | 0 到 512。MOTOR 語意為輸出值，LAMP 語意為亮度。 |

### 元件模式

#### `MOTOR`

- 必須顯示方向欄位。
- 必須接受 0..512 的輸出值。
- generator 可依方向轉換成正負速度。
- 可見元件名稱必須來自 i18n key，不得硬編碼單一語言。

#### `LAMP`

- 必須隱藏方向欄位。
- 必須接受 0..512 的亮度值。
- 不得顯示順時針、逆時針或任何方向性文字。
- generator 必須以非方向性輸出處理。

### 序列化

- `COMPONENT` 必須以 Blockly field 值序列化。
- `COMPONENT` 欄位值必須是語言中立鍵，例如 `MOTOR` / `LAMP`。
- 舊工作區缺少 `COMPONENT` 時，載入後必須等價於 `MOTOR`。
- 不得為首版建立大型 workspace migration table。

### 動態 shape

- 當 `COMPONENT` 變更時，block 必須即時更新欄位顯示。
- shape update 必須保留使用者已選的 M 埠與數值。
- 切換至 `LAMP` 時不得留下無作用的方向欄位。
- 切回 `MOTOR` 時方向欄位必須恢復為有效選項。

## M 系列停止積木

### 固定句型

停止積木必須固定表達為：

```text
停止輸出 [M選單]
```

或語意等價、但必須包含固定中性文案「停止輸出」。

### 欄位

| 欄位 | 類型 | 必要 | 說明 |
|---|---|---:|---|
| M 埠選單 | dropdown | 是 | 選擇 `M1` 到 `M4`。 |
| `COMPONENT` | 不允許 | 否 | 停止積木不得要求選元件。 |

### 行為

- 停止積木是通用斷電/歸零動作。
- 不得依賴同埠其他設定積木推論文案。
- 不得因 workspace 中存在 `LAMP` 或 `MOTOR` 而改變顯示文字。
- generator 必須讓指定 M 埠停止輸出。

## Warning 合併

M 系列積木可同時顯示：

- orphan warning
- 同 M 埠不同元件 warning
- M/O shared-pin warning

多個 warning 必須可讀地合併，不得互相覆蓋。

## 非目標

- 不新增獨立燈泡設定積木。
- 不新增獨立燈泡關閉積木。
- 不改 O 系列公開作者模型。
