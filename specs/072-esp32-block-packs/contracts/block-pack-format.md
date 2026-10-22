# 合約：積木包格式與驗證錯誤

欄位定義見 [data-model.md](../data-model.md)。以下為範例與驗證器必須回傳的錯誤代碼；每個錯誤附 `path`（例如 `blocks[1].inputs[0].name`），由 WebView 以 `BLOCK_PACK_ERROR_<CODE>` 語系字串顯示。

## 範例：HC-SR04 超音波

```json
{
  "formatVersion": 1,
  "id": "hc_sr04",
  "version": "1.0.0",
  "author": "Singular Blockly",
  "defaultLocale": "en",
  "category": { "name": { "en": "Ultrasonic", "zh-hant": "超音波" }, "colour": 200 },
  "blocks": [
    {
      "name": "distance",
      "shape": "value",
      "output": "Number",
      "label": { "en": "distance (cm) trig {TRIG} echo {ECHO}", "zh-hant": "距離（公分） trig {TRIG} echo {ECHO}" },
      "inputs": [
        { "name": "TRIG", "kind": "pin", "mode": "digital", "direction": "output" },
        { "name": "ECHO", "kind": "pin", "mode": "digital", "direction": "input" }
      ]
    }
  ],
  "targets": {
    "esp32": {
      "globals": "float hcsr04Distance(int trig, int echo) {\n  pinMode(trig, OUTPUT); pinMode(echo, INPUT);\n  digitalWrite(trig, LOW); delayMicroseconds(2);\n  digitalWrite(trig, HIGH); delayMicroseconds(10); digitalWrite(trig, LOW);\n  return pulseIn(echo, HIGH, 30000) / 58.0;\n}\n",
      "blocks": { "distance": "hcsr04Distance({{TRIG}}, {{ECHO}})" }
    }
  }
}
```

## 錯誤代碼

| 代碼 | 情況 |
| --- | --- |
| `INVALID_JSON` | 檔案不是合法 JSON 或超過 256 KB |
| `UNSUPPORTED_FORMAT_VERSION` | `formatVersion` 不是 1 |
| `MISSING_FIELD` | 必填欄位缺少 |
| `INVALID_VALUE` | 型別、格式、範圍或列舉不符 |
| `UNKNOWN_FIELD` | 出現未定義欄位 |
| `UNSUPPORTED_BOARD` | `targets` 含 `esp32` 以外的鍵 |
| `DUPLICATE_NAME` | 積木或輸入名稱重複 |
| `LABEL_INPUT_MISMATCH` | 標籤中的 `{NAME}` 與輸入清單不一致 |
| `MISSING_TEMPLATE` | 積木沒有 `targets.esp32.blocks` 模板 |
| `UNKNOWN_TEMPLATE_INPUT` | 模板引用不存在的輸入 |
| `INVALID_LIB_DEP` | 依賴不是 `owner/name@版本` |
| `UNTRUSTED_WORKSPACE` | 含 `libDeps` 但工作區未受信任 |
