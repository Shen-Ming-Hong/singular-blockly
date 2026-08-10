# Blockly 13 效能比較

**記錄日期**：2026-08-09  
**平台**：macOS arm64  
**Node.js**：v25.9.0  
**Blockly**：13.2.1

## 執行方式

```bash
node scripts/benchmark-blockly-workspace.js --iterations 12
```

固定建立 500 個 `math_number` 積木，暖機 3 次後執行 12 次 JSON 載入與儲存。序列化大小與 v12 基線相同，皆為 41,933 bytes。

| 操作 | v12.3.1 中位數 | v13.2.1 中位數 | 差異 | 允許上限 | 結果 |
|---|---:|---:|---:|---:|---|
| Load | 32.093 ms | 29.577 ms | -7.8% | 35.302 ms | 通過 |
| Save | 0.885 ms | 0.744 ms | -15.9% | 0.974 ms | 通過 |

## v13 原始結果

```json
{
  "blocklyVersion": "13.2.1",
  "nodeVersion": "v25.9.0",
  "platform": "darwin-arm64",
  "blockCount": 500,
  "iterations": 12,
  "serializedBytes": 41933,
  "load": { "minMs": 26.561, "medianMs": 29.577, "meanMs": 28.983, "maxMs": 32.832 },
  "save": { "minMs": 0.570, "medianMs": 0.744, "meanMs": 0.799, "maxMs": 1.181 }
}
```

結論：兩項中位數都優於升級前基線，SC-009 的「退化不超過 10%」條件通過。
