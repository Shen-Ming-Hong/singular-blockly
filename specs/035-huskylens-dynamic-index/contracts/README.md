# Contracts: HuskyLens 積木動態編號輸入

本功能不涉及 API 合約。所有變更都在 Blockly 積木層級（前端 WebView），無後端 API 或資料傳輸需求。

## 不適用項目

- REST API
- GraphQL Schema
- WebSocket 協定
- 資料庫 Schema

## 相關介面

唯一的「合約」是 Blockly 積木產生的 Arduino 程式碼格式：

```cpp
// Block 資訊存取
huskylens.getBlock(<index>).<property>

// Arrow 資訊存取
huskylens.getArrow(<index>).<property>
```

其中 `<index>` 可以是：
- 固定數字：`0`, `1`, `2`
- 變數：`i`, `blockIndex`
- 表達式：`(i + 1)`, `(count - 1)`

`<property>` 為下列之一：
- `xCenter`, `yCenter` — 中心座標
- `width`, `height` — 尺寸
- `ID` — 物件 ID
