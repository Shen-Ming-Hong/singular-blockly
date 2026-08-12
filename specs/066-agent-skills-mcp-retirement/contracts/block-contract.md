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
    for each supported board:
        set the real board runtime context
        create block in a disposable headless workspace
        capture actual connections, inputs, fields, default extra state
        serialize a minimal state
        load and save that state in a second disposable workspace
        record normalized metadata as the board variant

assert generated types == publicTypes
assert no duplicate type
```

若任一公開 type 未註冊、無法實例化或 round-trip，產生器必須非零結束，不得輸出部分契約。

## `block-contract.json` 索引必要結構

```json
{
  "schemaVersion": 3,
  "blocklyVersion": "13.2.1",
  "boards": [
    {
      "id": "uno",
      "language": "arduino",
      "toolbox": "index"
    }
  ],
  "shards": [
    {
      "category": "logic",
      "path": "block-contract/logic.json",
      "blockTypes": ["controls_if"]
    }
  ]
}
```

索引依 category 排序，`path` 必須符合 `block-contract/<category>.json` 的安全專案相對格式。`blockTypes` 在分片內排序，且所有分片合併後不得重複或遺漏公開 type。只有一個 category 的積木放入該 category 分片；具有多個 category 的積木集中於 `shared`，避免重複 metadata。

## Category 分片必要結構

```json
{
  "schemaVersion": 3,
  "category": "logic",
  "blocks": [
    {
      "type": "controls_if",
      "categories": ["logic"],
      "boards": ["uno"],
      "variants": {
        "uno": {
          "connections": {
            "previous": { "enabled": true, "check": null },
            "next": { "enabled": true, "check": null },
            "output": { "enabled": false, "check": null }
          },
          "inputs": [],
          "fields": [],
          "minimalState": { "type": "controls_if" }
        }
      }
    }
  ]
}
```

實際內容中的陣列與物件鍵順序必須穩定，讓 `--check` 能逐位元比較。`categories` 由解析後 toolbox category ID 或動態 flyout owner 衍生，排序、去重且不得手寫顯示名稱。`variants` 必須恰好包含 `boards` 列出的板型，且每個 connection 必須以 `enabled` 區分不存在與 unrestricted；對沒有 `extraState` 的 block 省略該欄位，不以 `null` 假裝存在。Agent 先讀索引，只讀本次 type 對應的分片；產品內消費者由 `BlockContractService` 驗證並組合全部分片。

每個 field 另以 `optionsMode` 區分 runtime 行為：固定選單為 `static`，其 `options` 是可直接驗證的完整合法值；function、variable 或其他 runtime 產生的選單為 `dynamic`，其產生時快照只供理解，候選值必須在 disposable workspace 載入後向實際 field 取得當下 options 驗證。不得把動態快照誤當成永久白名單。

## `workspace.schema.json` 邊界

- schema 描述完整 `main.json` 的文件層必要欄位、已知板型及 Blockly workspace 容器。
- schema 用於指導 AI 與提早拒絕明顯錯誤，但不能取代 runtime validation。
- schema 的 `$id` 使用穩定、非網路相依的識別；不得引用必須連線下載的外部 schema。
- schema 與說明固定使用英文。

## 消費者

- 專案 Skill references：供 VS Code/Codex 與 Claude Code 以索引漸進讀取可建立資料。
- `BlockContractService`：提供產品內查詢與 `ShadowSuggestionService` 使用。
- 契約測試：驗證所有工具箱／動態 type 完整覆蓋、minimal state round-trip、TXT metadata 與三種板型代表案例。

不得再保留 MCP 專用 dictionary 或第二份手寫 metadata。封裝與開發模式都必須解析到相同內容雜湊。

## 建置契約

- `npm run generate:skill-contract`：完成全量驗證後，原子更新索引、全部 tracked 英文分片與 schema，並移除已過時的已知 JSON 分片。
- `npm run check:skill-contract`：只在記憶體產生預期內容並逐位元比較索引、分片與 schema；不得改 working tree，且過時分片必須使檢查失敗。
- production build 將已驗證資產複製到 `dist/project-skills/singular-blockly/`。
- 積木、工具箱、板型或 Blockly 版本改變而未重建契約時，CI 必須失敗。
