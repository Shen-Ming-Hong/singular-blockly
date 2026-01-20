# MCP Block Dictionary 契約：CyberBrick 時間積木

## 目的

確保新增時間積木可被 MCP 查詢與搜尋，並與既有字典格式一致。

## 契約範圍

- 只描述新增積木的字典條目格式與必要欄位
- 不新增或變更 MCP 既有工具介面

## 條目格式（摘要）

每個新積木條目需包含：
- `type`：積木識別（唯一）
- `category`：MCP 分類（CyberBrick）
- `names`：多語系名稱
- `descriptions`：多語系用途說明
- `inputs`：輸入欄位定義（NOW/START）
- `output`：回傳型別（數值）
- `boards`：支援板卡（僅 CyberBrick）
- `tags`：搜尋關鍵字（含時間/毫秒/ticks 等）

## 驗證條件

- 兩個新積木條目必須存在於字典中
- 可透過 MCP 搜尋（關鍵字或 type）找到對應條目
- `category` 可被列舉為 CyberBrick 類別
