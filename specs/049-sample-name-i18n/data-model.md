# Data Model: 範本名稱多國語言化

**Feature**: 049-sample-name-i18n  
**Date**: 2026-04-06

---

## 實體與型別定義

### `NameTranslationEntry`（新增）

單一名稱的多語系翻譯映射。`zh-hant` 不納入（以原始名稱為基準語言）。

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `en` | `string` | 建議填寫 | 英文翻譯，作為三層回退的第二層 |
| `ja` | `string` | 選填 | 日文翻譯 |
| `ko` | `string` | 選填 | 韓文翻譯 |
| `de` | `string` | 選填 | 德文翻譯 |
| `fr` | `string` | 選填 | 法文翻譯 |
| `es` | `string` | 選填 | 西班牙文翻譯 |
| `it` | `string` | 選填 | 義大利文翻譯 |
| `pt-br` | `string` | 選填 | 葡萄牙文（巴西）翻譯 |
| `ru` | `string` | 選填 | 俄文翻譯 |
| `pl` | `string` | 選填 | 波蘭文翻譯 |
| `cs` | `string` | 選填 | 捷克文翻譯 |
| `hu` | `string` | 選填 | 匈牙利文翻譯 |
| `bg` | `string` | 選填 | 保加利亞文翻譯 |
| `tr` | `string` | 選填 | 土耳其文翻譯 |
| `[key: string]` | `string \| undefined` | — | 索引簽章允許動態語系 |

**合法性約束**：每個翻譯值必須符合 Python 3 識別字規則——
`/^[^\d\W]\w*$/u`（Unicode aware）：以 Unicode 字母或底線開頭，後接字母、數字、底線，不含空格、連字號、標點符號。

---

### `NameTranslations`（新增）

存放於範本 JSON 頂層。包含兩個映射：

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `variables` | `Record<string, NameTranslationEntry>` | 選填 | key：中文基準名稱（涵蓋工作區變數 + 函式參數名稱）|
| `functions` | `Record<string, NameTranslationEntry>` | 選填 | key：中文函式定義名稱 |

**注意**：`variables` 映射同時涵蓋兩類識別字：
1. 工作區 `variables[].name`（全域變數）
2. 函式 `extraState` 中的 `<arg name="...">` 參數名稱

---

### `SampleWorkspace`（更新）

在現有結構加入選填的 `nameTranslations` 欄位。

| 欄位 | 型別 | 必填 | 說明 |
|---|---|---|---|
| `workspace` | `object` | ✅ | Blockly workspace state（現有） |
| `board` | `string` | ✅ | 開發板代號，必須為 `'cyberbrick'`（現有） |
| `nameTranslations` | `NameTranslations` | 選填 | 函式與變數名稱的多語系翻譯表（新增）|

**向後相容**：`nameTranslations` 為選填，不含此欄位的舊版範本 JSON 保持現有行為。

---

## 狀態轉換：`applyNameTranslations()` 輸入 → 輸出

```text
輸入 workspace（原始中文名稱）
  ↓
[applyNameTranslations(workspace, nameTranslations, language)]
  ├── 步驟 1：深層複製（JSON.parse/stringify）
  ├── 步驟 2：替換 variables[].name
  ├── 步驟 3：遞迴遍歷 block 樹
  │     ├── arduino_function   → 替換 fields.NAME + extraState <arg name="...">
  │     ├── arduino_function_call → 替換 extraState name="..." + extraState <arg name="...">
  │     └── 所有積木           → 遞迴 inputs.*.block + next.block
  └── 輸出翻譯後 workspace
```

---

## 三層回退策略（每個名稱獨立執行）

```text
查找 nameTranslations.variables[originalName][targetLang]
  ├── 有翻譯且合法 → 使用此翻譯
  ├── 無翻譯或不合法 → 查找 nameTranslations.variables[originalName]['en']
  │                       ├── 有翻譯且合法 → 使用英文翻譯
  │                       └── 無翻譯或不合法 → 保留原始中文名稱
  └── 記錄警告日誌（若有翻譯但不合法；跳過無翻譯情境，無需日誌）
```

函式名稱使用同等策略，從 `nameTranslations.functions` 映射查找。

---

## Soccer Robot 範本：需翻譯的名稱清單（完整）

### 變數名稱（workspace.variables）

| zh-hant 原始名稱 | 備註 |
|---|---|
| 前後搖桿數值 | 遙控器搖桿 Y 軸讀數 |
| 左右搖桿數值 | 遙控器搖桿 X 軸讀數 |
| 連線編號 | BLE 連線識別碼 |
| 前進速度 | 計算後的前進速度 |
| 右轉速度 | 計算後的右轉速度 |
| 後退速度 | 計算後的後退速度 |
| 左轉速度 | 計算後的左轉速度 |
| 搖桿數值 | 搖桿原始數值 |
| 最大速度 | 速度上限常數 |
| 死區 | 搖桿死區閾值 |
| 左偏修正 | 方向校正值 |
| 偵測到球 | 攝影機偵測旗標 |
| 球的X位置 | 球的 X 座標 |
| 球的Y位置 | 球的 Y 座標 |
| 球的大小 | 球的佔比尺寸 |

### 函式參數名稱（extraState 中的 `<arg>`；也使用 variables 映射）

| zh-hant 原始名稱 | 屬於哪個函式 |
|---|---|
| 紅色 | 車燈 |
| 綠色 | 車燈 |
| 藍色 | 車燈 |
| 左輪速度 | 馬達移動 |
| 右輪速度 | 馬達移動 |

### 函式名稱（arduino_function.fields.NAME）

| zh-hant 原始名稱 | 說明 |
|---|---|
| 遙控器 | 主遙控迴圈函式 |
| 連線完成後要做的事情 | BLE 連線回呼 |
| 讀取搖控器數值 | 讀取搖桿輸入 |
| 計算速度 | 計算輪速 |
| 馬達移動 | 驅動馬達 |
| 往前 | 前進動作 |
| 往後 | 後退動作 |
| 左轉 | 左轉動作 |
| 右轉 | 右轉動作 |
| 停止 | 停止動作 |
| 車燈 | 設定 LED 顏色 |
| 追球 | 視覺追球模式 |
