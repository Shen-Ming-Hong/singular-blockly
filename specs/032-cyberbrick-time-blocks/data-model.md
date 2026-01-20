# 資料模型：CyberBrick 時間回傳值積木

## 實體

### TimeBlockDefinition
**用途**：描述 CyberBrick 時間回傳值積木的核心定義。

**主要欄位**：
- `type`：積木唯一識別（例如取得時間、時間差計算）
- `displayName`：介面顯示名稱
- `category`：積木分類（CyberBrick 時間類）
- `inputs`：輸入欄位集合（NOW、START）
- `outputType`：回傳值型別（數值）
- `boardScope`：可用板卡（僅 CyberBrick）
- `messageKeys`：對應的 i18n 文字鍵

**關係**：
- 1 個 TimeBlockDefinition 對應多個 LocalizationString
- 1 個 TimeBlockDefinition 對應 1 個 MCPBlockDictionaryEntry

### LocalizationString
**用途**：保存各語系積木名稱、欄位文字與提示說明。

**主要欄位**：
- `key`：文字鍵
- `locale`：語系代碼
- `value`：翻譯內容
- `context`：使用情境（名稱／欄位／提示）

**關係**：
- 多個 LocalizationString 可對應單一 TimeBlockDefinition

### MCPBlockDictionaryEntry
**用途**：提供 MCP 查詢與搜尋使用的積木描述。

**主要欄位**：
- `type`：積木識別
- `category`：MCP 分類（CyberBrick）
- `names`：多語系名稱
- `descriptions`：多語系用途說明
- `inputs`：輸入欄位定義
- `output`：回傳型別
- `boards`：支援板卡
- `tags`：搜尋關鍵字

**關係**：
- 每個 MCPBlockDictionaryEntry 對應 1 個 TimeBlockDefinition

## 約束

- `type` 必須全域唯一。
- `inputs` 與 `messageKeys` 必須保持一致對應。
- `boardScope` 必須限制為 CyberBrick。
- MCP 字典條目必須出現在索引中，確保可被搜尋與分類。
