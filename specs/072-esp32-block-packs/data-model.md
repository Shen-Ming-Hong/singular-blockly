# 資料模型：ESP32 積木包

## BlockPack（`.sbpack.json` 與專案快照共用）

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `formatVersion` | `1` | 是 | 目前只接受 1 |
| `id` | string | 是 | `^[a-z][a-z0-9_]{1,31}$`，專案內唯一 |
| `version` | string | 是 | SemVer `MAJOR.MINOR.PATCH` |
| `author` | string | 否 | ≤ 80 字 |
| `defaultLocale` | string | 是 | 15 個支援語系之一 |
| `category` | `{ name: LocalizedText, colour: 0–360 }` | 是 | 工具箱分類 |
| `blocks` | `PackBlock[]` | 是 | 1–50 個 |
| `targets` | `{ esp32: PackTarget }` | 是 | 第一版只允許 `esp32` 鍵 |

`LocalizedText` 為字串，或 `{ [locale]: string }`（至少含 `defaultLocale`）。顯示時依目前語系 → `en` → `defaultLocale` 退回。

## PackBlock

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `name` | string | 是 | `^[a-z][a-z0-9_]{0,31}$`，積木包內唯一；Blockly 型別為 `pack_<id>_<name>` |
| `shape` | `"statement"` \| `"value"` | 是 | value 可加 `output`：`Number`、`Boolean`、`String` 或省略 |
| `label` | LocalizedText | 是 | 以 `{NAME}` 標示輸入位置；每個輸入恰好出現一次 |
| `tooltip` | LocalizedText | 否 | |
| `inputs` | `PackInput[]` | 否 | ≤ 10 個 |

## PackInput

| `kind` | 額外欄位 | Blockly 對應 | 模板替換 |
| --- | --- | --- | --- |
| `value` | `check?`、`default?`（數字或文字 shadow） | 值輸入 | `(valueToCode)`，空時用 default 或 `0` |
| `number` | `default`、`min?`、`max?`、`precision?` | `field_number` | 數值字面值 |
| `text` | `default` | `field_input` | C++ 字串字面值（已跳脫） |
| `dropdown` | `options: [LocalizedText, value][]` | `field_dropdown` | 選項 value（`^[A-Za-z0-9_]+$`） |
| `pin` | `mode: "digital"` \| `"analog"`、`direction?: "input"` \| `"output"`、`exclusive?` | `field_dropdown`（板子腳位） | 腳位數字 |
| `statement` | — | 語句輸入 | `statementToCode` |

`name` 為 `^[A-Z][A-Z0-9_]{0,31}$`，積木內唯一。

## PackTarget（`targets.esp32`）

| 欄位 | 型別 | 規則 |
| --- | --- | --- |
| `includes` | string[] | 標頭檔名，`^[A-Za-z0-9_./-]+\.h(pp)?$`，產生 `#include <…>` |
| `libDeps` | string[] | `^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+@[~^]?\d+\.\d+\.\d+$` |
| `globals` | string | 全域宣告，整包一次 |
| `setup` | string | `setup()` 內程式，整包一次 |
| `blocks` | `{ [blockName]: string }` | 每個積木都要有模板；只可引用該積木的輸入 `{{NAME}}` |

## 專案快照（`workspace.customBlocks`）

```json
{ "formatVersion": 1, "packs": [ { "...BlockPack": "...", "importedAt": "2026-10-22T03:00:00Z", "sourceName": "hc-sr04.sbpack.json" } ] }
```

沒有積木包時不輸出此區段。

## 佔位積木

| 型別 | 形狀 | `extraState` |
| --- | --- | --- |
| `block_pack_placeholder_statement` | 前後連接 | `{ original: <完整序列化積木狀態> }` |
| `block_pack_placeholder_value` | output | 同上 |

## 狀態轉換

`未匯入 →(匯入)→ 可用 →(切到非 esp32)→ 板型警告 →(切回)→ 可用`；`可用 →(移除或定義失效)→ 佔位 →(重新匯入同 id)→ 可用`。
