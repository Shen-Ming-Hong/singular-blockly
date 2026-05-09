# 快速啟動指南：TXT Controller 多流程擴充

**功能分支**：`051-txt-controller-support`  
**適用對象**：接手本次多流程擴充實作的開發者

---

## 開發環境設定

### 1. 安裝依賴

```bash
cd /path/to/singular-blockly
npm install
```

### 2. 啟動開發模式

```bash
npm run watch
```

然後在 VS Code 按 `F5` 啟動 Extension Development Host。

### 3. 驗證建置

```bash
npm run compile
npm run lint
npm test
npm run validate:i18n
```

---

## 本次擴充優先閱讀入口

| 類型 | 檔案 | 用途 |
|------|------|------|
| 規格 | [spec.md](./spec.md) | 使用者行為、首發模型一致性、成功標準 |
| 計畫 | [plan.md](./plan.md) | 多流程落地範圍與風險 |
| 研究 | [research.md](./research.md) | FT API、直接重做策略與可行性重評 |
| 模型 | [data-model.md](./data-model.md) | `TxtFlowDescriptor`、`TxtWorkspaceTopology` |
| 契約 | [contracts/txt-blocks-api.md](./contracts/txt-blocks-api.md) | `txt_setup` / `txt_process` block 合約 |

---

## 第一個應做的程式碼盤點

1. `media/blockly/blocks/txt.js`
2. `media/blockly/generators/txt/index.js`
3. `media/blockly/generators/txt/txt.js`
4. `media/blockly/generators/txt/python_common.js`
5. `media/js/blocklyEdit.js`
6. `media/toolbox/categories/txt.json`

> 這六個檔案決定了新的 TXT 頂層模型是否能成立，也決定單主程式舊路徑是否真的被清乾淨。

---

## 目標工作區範例

### 新模型（預期作者體驗）

建立以下工作區：

1. 一個 `TXT 初始化`
2. 流程 A：`TXT 流程：馬達`
    - `txt_motor_speed(M1, 200, 正轉)`
    - `txt_wait(1000)`
    - `txt_motor_stop(M1)`
3. 流程 B：`TXT 流程：燈號`
    - `controls_forever`
    - 內部切換 `txt_output(O1)` 與 `txt_wait(200)`

**預期生成方向**：

- 單一 `main.py`
- 單一 `ftrobopy.ftrobopy('auto')`
- 一段初始化程式
- 多個流程 runner 定義與啟動邏輯

---

## 重要驗證情境

### 1. 多流程不互相阻塞

**步驟**：

1. 讓流程 A 執行 `txt_wait(1000)`
2. 讓流程 B 每 200ms 切換輸出

**預期**：

- 流程 A 等待時，流程 B 仍持續運作

### 2. 正式產品面不殘留單主程式模型

**步驟**：

1. 新建或開啟 TXT workspace
2. 檢查 toolbox、預設工作區與相關 fixture

**預期**：

- 只出現 `TXT 初始化` + `TXT 流程`
- `txt_main`、`txt_init`、`txt_input_read` 不出現在正式 UI、文件與範例

### 3. pacing 規則不回歸

**步驟**：

1. 在某個 `TXT 流程` 內建立緊密硬體輪詢 `while`
2. 不放 `txt_wait`

**預期**：

- 仍由 `python_common.js` 自動補上 path-sensitive `txt.updateWait(0.01)`

### 4. 初始化驗證

**步驟**：

1. 建立兩個 `TXT 初始化`
2. 或建立零個 `TXT 初始化`

**預期**：

- UI 給出明確警告，不靜默產生模糊結果

---

## 實作檔案清單（延伸部分）

```text
□ media/blockly/blocks/txt.js
□ media/blockly/generators/txt/index.js
□ media/blockly/generators/txt/txt.js
□ media/blockly/generators/txt/python_common.js
□ media/toolbox/categories/txt.json
□ media/js/blocklyEdit.js
□ media/blockly/blocks/loops.js
□ media/locales/{15語系}/messages.js
□ scripts/generate-block-dictionary.js
□ src/mcp/block-dictionary.json
□ specs/051-txt-controller-support/*.md
```

---

## 注意事項

1. **可以直接重做 `txt_main`**：它尚未發布，不需要 load-time migration；但要同步更新 blocks、generator、toolbox、workspace 驗證與 tests
2. **不要新增「4 個流程」硬限制**：這與使用者最新決策相衝突
3. **名稱欄位是可選的**：任何驗證都不能把流程名稱當必填
4. **保留單一 shared `txt`**：這是 FT API 與既有設計評估後的核心限制
5. **`txt_wait` 的使用者語意要保住**：它仍應被理解為「當前流程等待」
6. **更新 block dictionary**：新的 `txt_setup` / `txt_process` 不可漏掉 MCP 字典同步
