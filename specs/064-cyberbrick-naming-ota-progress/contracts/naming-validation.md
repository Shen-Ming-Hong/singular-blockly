# 契約：CyberBrick MicroPython 名稱驗證

## 適用範圍

- `board === 'cyberbrick'`：套用本契約。
- 其他板子：回到既有命名行為，不得套用 CyberBrick error／warning 或上傳 guard。
- 名稱類型：`variable`、`function`、`parameter`。

## 純驗證 API

概念輸入：

```text
validateName({
  name,
  kind,
  duplicateNames?,
}) -> NameValidationResult
```

### 共通正規化

1. 只執行前後空白移除。
2. 不移除內部空白，不替換連字號，不轉換中文，不改變大小寫。
3. 回傳的 `normalizedName` 是唯一可提交值。

### 合法字元

```text
first    := ASCII_LETTER | "_" | CJK_A | CJK_UNIFIED | CJK_COMPAT
continue := first | ASCII_DIGIT
name     := first continue*
```

- `CJK_A`：U+3400–U+4DBF
- `CJK_UNIFIED`：U+4E00–U+9FFF
- `CJK_COMPAT`：U+F900–U+FAFF

### Hard keywords

以下大小寫相符的 Python hard keywords 為 `python-keyword` error：

```text
False None True and as assert async await break class continue def del elif else
except finally for from global if import in is lambda nonlocal not or pass raise
return try while with yield
```

`match`、`case`、`_` 與 `type` 不列入 hard keyword；其中 `type` 依內建名稱清單回傳 warning。

### Warning 名稱

**執行環境**：`machine`、`time`、`network`、`Pin`、`PWM`、`ADC`、`UART`、`I2C`、`SPI`、`Timer`、`NeoPixel`。

**內建功能**：`print`、`input`、`len`、`range`、`int`、`float`、`str`、`bool`、`list`、`dict`、`tuple`、`set`、`min`、`max`、`sum`、`abs`、`round`、`type`、`isinstance`、`enumerate`、`zip`、`map`、`filter`、`open`。

warning 一律允許提交與上傳。

## 互動契約

### 變數（Extension Host InputBox）

| 驗證結果 | 顯示 | 可按 Enter | 提交值 |
|----------|------|------------|--------|
| valid | 無訊息 | 是 | `normalizedName` |
| warning | Warning 訊息 | 是 | `normalizedName` |
| error | Error 訊息 | 否 | 不送出 `createVariable` |

### 函式與參數（Blockly FieldTextInput）

| 驗證結果 | validator 回傳 | 積木狀態 |
|----------|----------------|----------|
| valid | `normalizedName` | 清除本功能專用 warning |
| warning | `normalizedName` | 顯示 warning，提交新值 |
| error | `null` | 顯示 error，欄位保留先前值 |

- 函式 duplicateNames 是同工作區其他函式名稱。
- 參數 duplicateNames 是同一 mutator／函式的其他參數名稱。
- 不同函式可使用相同參數名稱。

## 舊工作區與上傳契約

1. 所有 `Blockly.serialization.workspaces.load()` 入口必須由共用 hydration scope 包住；scope 內的行內 validator 原樣接受反序列化值，並以 `finally` 保證結束旁路，因此 deserialize 不修改任何名稱。
2. hydration scope 結束後，工作區掃描產生 `CyberBrickNamingIssue[]`，以本功能專用 warning ID 套到積木，不覆蓋其他安全警告。
3. 上傳按鈕每次都重新掃描：
   - 至少一個 error：不產生／不送出上傳請求，顯示在地化摘要並引導第一個問題積木。
   - 只有 warning 或無問題：可繼續上傳。
4. 程式碼預覽不因命名 issue 被停用。
5. 切換離開 CyberBrick 時清除本功能專用 warning；切回時重新掃描。

## 必要測試向量

- valid：`motor`、`_motor2`、`馬達`、`馬達2`、`_計數`、CJK 三區段邊界字元。
- trim：`  馬達2  ` → `馬達2`。
- empty：`''`、`'   '`。
- starts-with-number：`1motor`、`2馬達`。
- whitespace：`motor speed`、`馬達 速度`、tab／換行。
- hyphen：`motor-speed`。
- invalid：標點、emoji、貨幣符號、斜線。
- hard keyword：完整清單逐一驗證。
- warning：兩份完整清單逐一驗證且可接受。
- duplicate：函式同名、同一函式參數同名；不同函式同參數名放行。
- board isolation：相同輸入在 Arduino／TXT 沿用原本結果。
- hydration：非法函式／參數名稱在一般載入、FileWatcher 重載與語言切換重載都原樣保留；載入後 issue collector 仍標示 error 並使 CyberBrick `canUpload = false`。
