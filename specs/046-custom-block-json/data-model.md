# 資料模型：Singular Block — 自訂積木 JSON 系統

**Branch**: `046-custom-block-json` | **Date**: 2026-02-24

## 實體定義

### CustomBlockDefinition（自訂積木 JSON 檔案格式）

使用者建立的 JSON 檔案結構，一份檔案對應一個積木定義。

| 欄位          | 型態                  | 必填 | 說明                                  | 驗證規則                                     |
| ------------- | --------------------- | ---- | ------------------------------------- | -------------------------------------------- |
| `type`        | `string`              | ✅   | 積木類型識別碼（唯一鍵）              | 正則 `^[a-z][a-z0-9_]*$`，不得與內建積木衝突 |
| `message`     | `string`              | ✅   | 積木上顯示的文字，含 `%1` `%2` 佔位符 | 佔位符數量須與 `inputs` 長度一致             |
| `colour`      | `number`              | ✅   | 積木顏色（HSV hue 0-360）             | 整數，範圍 0-360                             |
| `shape`       | `string`              | ✅   | `"statement"` \| `"value"` \| `"hat"` | 列舉值                                       |
| `tooltip`     | `string`              | ❌   | 積木提示文字                          | —                                            |
| `helpUrl`     | `string`              | ❌   | 說明連結                              | 合法 URL 或空字串                            |
| `inputs`      | `CustomBlockInput[]`  | ❌   | 輸入欄位列表，預設空陣列              | —                                            |
| `arduino`     | `ArduinoTemplate`     | ❌   | Arduino 程式碼模板                    | —                                            |
| `micropython` | `MicroPythonTemplate` | ❌   | MicroPython 程式碼模板                | —                                            |

### ArduinoTemplate（Arduino 程式碼模板）

| 欄位        | 型態                     | 必填 | 說明                                                             | 驗證規則                     |
| ----------- | ------------------------ | ---- | ---------------------------------------------------------------- | ---------------------------- |
| `code`      | `string`                 | ✅   | 程式碼模板，可含 `${INPUT_NAME}` 佔位符                          | —                            |
| `includes`  | `string[]`               | ❌   | 標頭檔列表（如 `["Servo.h"]`）                                   | 不含 `#include` 前綴和角括號 |
| `libDeps`   | `string[]`               | ❌   | PlatformIO 函式庫依賴（如 `["arduino-libraries/Servo@^1.2.2"]`） | PlatformIO lib_deps 格式     |
| `variables` | `Record<string, string>` | ❌   | 全域變數宣告（key→code）                                         | —                            |
| `setupCode` | `string`                 | ❌   | `setup()` 中的初始化程式碼                                       | —                            |

### MicroPythonTemplate（MicroPython 程式碼模板）

| 欄位           | 型態                     | 必填 | 說明                                                | 驗證規則                    |
| -------------- | ------------------------ | ---- | --------------------------------------------------- | --------------------------- |
| `code`         | `string`                 | ✅   | 程式碼模板，可含 `${INPUT_NAME}` 佔位符             | —                           |
| `imports`      | `string[]`               | ❌   | import 語句列表（如 `["from machine import Pin"]`） | 僅限標準 MicroPython 函式庫 |
| `hardwareInit` | `Record<string, string>` | ❌   | 硬體初始化（key→code）                              | key 作為去重識別            |

### CustomBlockInput（輸入欄位定義）

| 欄位        | 型態                 | 必填 | 說明                                                                           | 驗證規則                     |
| ----------- | -------------------- | ---- | ------------------------------------------------------------------------------ | ---------------------------- |
| `name`      | `string`             | ✅   | 欄位識別碼                                                                     | 正則 `^[A-Z][A-Z0-9_]*$`     |
| `type`      | `string`             | ✅   | `"value"` \| `"text"` \| `"number"` \| `"dropdown"` \| `"angle"` \| `"colour"` | 列舉值                       |
| `label`     | `string`             | ❌   | 欄位前的文字標籤                                                               | —                            |
| `default`   | `string \| number`   | ❌   | 預設值                                                                         | 須符合 `type` 限制           |
| `check`     | `string \| string[]` | ❌   | 值型態檢查（`"Number"`、`"Boolean"` 等）                                       | 僅 `type: "value"` 時有效    |
| `options`   | `[string, string][]` | ❌   | 下拉選項（`[["顯示文字", "值"]]`）                                             | 僅 `type: "dropdown"` 時必填 |
| `min`       | `number`             | ❌   | 數字最小值                                                                     | 僅 `type: "number"` 時有效   |
| `max`       | `number`             | ❌   | 數字最大值                                                                     | 僅 `type: "number"` 時有效   |
| `precision` | `number`             | ❌   | 數字精度（小數位數）                                                           | 僅 `type: "number"` 時有效   |

### CustomBlockLoadResult（載入結果包裝）

`loadAllCustomBlocks()` 的回傳項目，包含定義和來源檔案路徑。

| 欄位         | 型態                    | 說明                                                       |
| ------------ | ----------------------- | ---------------------------------------------------------- |
| `definition` | `CustomBlockDefinition` | 驗證通過的積木定義                                         |
| `filePath`   | `string`                | 原始 JSON 檔案的完整路徑（用於編輯覆寫和 MCP delete 操作） |

### PlaceholderBlockMeta（佔位積木中繼資料）

Extension Host 端管理的佔位積木追蹤資訊，存於記憶體中（非持久化）。

| 欄位         | 型態                              | 說明                                 |
| ------------ | --------------------------------- | ------------------------------------ |
| `type`       | `string`                          | 原始積木類型識別碼                   |
| `shape`      | `"statement" \| "value" \| "hat"` | 原始積木形狀                         |
| `sourceFile` | `string`                          | 原始 JSON 檔案路徑（用於恢復時比對） |

### WizardState（精靈介面狀態）

WebView 端管理的精靈表單狀態，僅存於記憶體。

| 欄位             | 型態                  | 說明                             |
| ---------------- | --------------------- | -------------------------------- |
| `mode`           | `"create" \| "edit"`  | 精靈模式                         |
| `currentStep`    | `number`              | 目前步驟（1-4）                  |
| `type`           | `string`              | 積木類型識別碼（編輯模式下唯讀） |
| `message`        | `string`              | 積木顯示文字                     |
| `colour`         | `number`              | 積木顏色                         |
| `shape`          | `string`              | 積木形狀                         |
| `tooltip`        | `string`              | 提示文字                         |
| `inputs`         | `CustomBlockInput[]`  | 輸入欄位列表                     |
| `arduino`        | `ArduinoTemplate`     | Arduino 模板                     |
| `micropython`    | `MicroPythonTemplate` | MicroPython 模板                 |
| `sourceFilePath` | `string \| null`      | 編輯模式下的原始 JSON 路徑       |

## 狀態轉換

### 自訂積木生命週期

```
                    ┌──────────────┐
     建立 JSON      │   已註冊     │  修改 JSON
    ──────────────→ │  (Active)    │ ←──────────
                    └──────┬───────┘
                           │
                     刪除/損壞 JSON
                           │
                           ▼
                    ┌──────────────┐
                    │   佔位中     │
                    │ (Placeholder)│
                    └──────┬───────┘
                           │
                     重建同名 JSON
                           │
                           ▼
                    ┌──────────────┐
                    │   已恢復     │
                    │  (Restored)  │ → 回到 Active
                    └──────────────┘
```

### 精靈 UI 步驟流程

```
步驟 1: 基本設定    →  步驟 2: 輸入欄位  →  步驟 3: 程式碼模板  →  步驟 4: 確認完成
(type, message,       (inputs 列表,         (arduino.code,         (預覽 + 儲存)
 colour, shape,        新增/刪除/排序         micropython.code,
 tooltip)              欄位)                  includes, libDeps,
                                              imports, hardwareInit,
                                              PIO 函式庫搜尋)
         ← 可自由回上一步 →
```

## 關聯關係

```
CustomBlockDefinition 1 ──── * CustomBlockInput
CustomBlockDefinition 1 ──── 0..1 ArduinoTemplate
CustomBlockDefinition 1 ──── 0..1 MicroPythonTemplate
CustomBlockDefinition 1 ──── 0..1 PlaceholderBlockMeta (當 JSON 遺失時)
WizardState ────────── maps to ──── CustomBlockDefinition (表單 → JSON)
```
