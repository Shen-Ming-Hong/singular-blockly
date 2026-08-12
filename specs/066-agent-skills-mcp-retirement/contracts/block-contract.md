# 契約：Runtime 衍生積木資料

## 權威輸入

產生器只可使用目前 repository 中會被產品載入的來源：

1. Blockly 13.2.1 與英文 core messages。
2. `media/blockly/blocks/` 的產品積木定義。
3. `media/toolbox/` 與各支援板型實際解析的 category JSON。
4. 變數、程序等由正式動態 flyout 建立的公開 block type 清單。

動態清單只能補充「可由 UI 建立的 type 身分」，不得手寫 fields、inputs、connections 或 extra state。這些 metadata 全部由 runtime 實例取得。

## 集合演算法

```text
publicTypes = union(all resolved board toolbox block types,
                    registered public dynamic-flyout types)

for each type in sorted(publicTypes):
    assert Blockly.Blocks[type] exists
    create block in a disposable headless workspace
    capture category/board membership, actual connections, inputs, fields, default extra state
    serialize a minimal state
    load and save that state in a second disposable workspace
    record board membership and normalized metadata

assert generated types == publicTypes
assert no duplicate type
```

若任一公開 type 未註冊、無法實例化或 round-trip，產生器必須非零結束，不得輸出部分契約。

## `block-contract.json` 必要結構

```json
{
  "schemaVersion": 1,
  "blocklyVersion": "13.2.1",
  "boards": [
    {
      "id": "uno",
      "language": "arduino",
      "toolbox": "index"
    }
  ],
  "blocks": [
    {
      "type": "controls_if",
      "categories": ["logic"],
      "boards": ["uno"],
      "connections": {
        "previous": {
          "enabled": true,
          "check": null
        },
        "next": {
          "enabled": true,
          "check": null
        },
        "output": {
          "enabled": false,
          "check": null
        }
      },
      "inputs": [],
      "fields": [],
      "minimalState": {
        "type": "controls_if"
      }
    }
  ]
}
```

實際內容中的陣列與物件鍵順序必須穩定，讓 `--check` 能逐位元比較。`categories` 由解析後 toolbox category ID 或動態 flyout owner 衍生，排序、去重且不得手寫顯示名稱。每個 connection 必須以 `enabled` 區分不存在與 unrestricted；對沒有 `extraState` 的 block 省略該欄位，不以 `null` 假裝存在。

## `workspace.schema.json` 邊界

- schema 描述完整 `main.json` 的文件層必要欄位、已知板型及 Blockly workspace 容器。
- schema 用於指導 AI 與提早拒絕明顯錯誤，但不能取代 runtime validation。
- schema 的 `$id` 使用穩定、非網路相依的識別；不得引用必須連線下載的外部 schema。
- schema 與說明固定使用英文。

## 消費者

- 專案 Skill references：供 VS Code/Codex 與 Claude Code 理解可建立資料。
- `BlockContractService`：提供產品內查詢與 `ShadowSuggestionService` 使用。
- 契約測試：驗證所有工具箱／動態 type 完整覆蓋、minimal state round-trip、TXT metadata 與三種板型代表案例。

不得再保留 MCP 專用 dictionary 或第二份手寫 metadata。封裝與開發模式都必須解析到相同內容雜湊。

## 建置契約

- `npm run generate:skill-contract`：以暫存輸出完成全量驗證後，原子更新 tracked 英文產物。
- `npm run check:skill-contract`：只產生至暫存位置並逐位元比較；不得改 working tree。
- production build 將已驗證資產複製到 `dist/project-skills/singular-blockly/`。
- 積木、工具箱、板型或 Blockly 版本改變而未重建契約時，CI 必須失敗。
