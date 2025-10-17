# Contributing to Singular Blockly

感謝您對 Singular Blockly 的貢獻興趣！本指南將協助您了解如何為專案做出貢獻。

## 目錄

-   [開發環境設定](#開發環境設定)
-   [貢獻翻譯](#貢獻翻譯)
-   [提交程式碼](#提交程式碼)
-   [報告問題](#報告問題)
-   [行為準則](#行為準則)

---

## 開發環境設定

### 前置需求

-   Node.js 18 或更高版本
-   npm 9 或更高版本
-   Visual Studio Code

### 安裝步驟

```bash
# 克隆專案
git clone https://github.com/Shen-Ming-Hong/singular-blockly.git
cd singular-blockly

# 安裝依賴
npm install

# 開發模式（自動編譯）
npm run watch

# 或編譯一次
npm run compile
```

### 偵錯擴充功能

1. 在 VS Code 中開啟專案
2. 按 F5 啟動擴充功能開發主機
3. 在新視窗中測試擴充功能

---

## 🌍 貢獻翻譯

我們歡迎本地化貢獻！Singular Blockly 支援 15 種語言，我們持續改善翻譯品質。

### 開始之前

1. **閱讀指南**：查看 `specs/002-i18n-localization-review/guidelines/{lang}.md` 了解您的語言的具體指導原則
2. **檢查詞彙表**：參考 `specs/002-i18n-localization-review/localization-glossary.json` 查看已核准的術語
3. **執行審計**：使用 `node scripts/i18n/audit-translations.js --languages={lang}` 查看目前問題

### 翻譯工作流程

#### 步驟 1：識別問題

```bash
# 對您的語言執行審計
node scripts/i18n/audit-translations.js --languages=ja --verbose

# 檢視摘要
node scripts/i18n/audit-summary.js specs/002-i18n-localization-review/audit-reports/audit-{date}-baseline.json
```

#### 步驟 2：建立功能分支

```bash
git checkout -b localization/{lang}/fix-high-priority
```

#### 步驟 3：編輯翻譯檔案

檔案位置：`media/locales/{lang}/messages.js`

```javascript
// 修改前
window.languageManager.loadMessages({
	CATEGORY_LOGIC: 'Logic', // 英文回退
});

// 修改後
window.languageManager.loadMessages({
	CATEGORY_LOGIC: '論理ブロック', // 文化適切的日文
});
```

#### 步驟 4：驗證變更

```bash
# 再次執行審計以確認修復
node scripts/i18n/audit-translations.js --languages={lang}

# 驗證解析正常
node -e "require('./scripts/i18n/lib/translation-reader.js').loadMessagesFile('{lang}')"

# 執行自動驗證（檢查佔位符、空翻譯、編碼、長度比例）
node scripts/i18n/validate-translations.js --language={lang}

# 檢測翻譯模式（直譯警告）
node scripts/i18n/detect-patterns.js --language={lang}

# 產生翻譯統計
npm run stats:i18n

# 或使用 npm 腳本（推薦）
npm run validate:i18n          # 驗證所有語言
npm run audit:i18n:ja          # 審計特定語言
npm run detect:i18n            # 檢測所有語言的模式
npm run stats:i18n             # 產生 Markdown 統計報告
npm run stats:i18n:json        # 產生 JSON 統計數據
```

#### 步驟 5：提交 Pull Request

使用本地化 PR 模板（`.github/PULL_REQUEST_TEMPLATE/localization.md`）

包含：

-   前後對比範例（至少 3-5 個主要變更）
-   參考正在修復的審計問題
-   UI 渲染截圖（如適用）
-   自我評估分數（文化適切性、語氣、術語、清晰度各 1-5 分）

### 翻譯指南

#### 高優先級鍵值（頻率 ≥70）

優先處理這些 - 它們對使用者永遠可見：

-   `CATEGORY_*` - 工具箱分類
-   `BLOCKS_TAB`, `CODE_TAB` - 主要頁籤
-   `BOARD_SELECT_*` - 板子選擇 UI
-   常用積木標籤

#### 品質標準

-   **文化適切性**：符合當地教育規範
-   **語氣**：友善、鼓勵性、適合學生
-   **術語**：使用已核准的詞彙表術語
-   **長度**：避免翻譯超過英文長度 150%（UI 溢出風險）
-   **完整性**：無空字串或英文回退

#### 語言特定規則

**日文（ja）**：

-   使用禮貌形式（です・ます）適合教育情境
-   避免過度片假名音譯
-   複雜術語使用漢字附注音

**韓文（ko）**：

-   使用禮貌非正式（해요체），非正式（하십시오체）
-   當有韓文對應詞時避免英文外來語

**德文（de）**：

-   使用非正式 "du"，非正式 "Sie"（目標：學生）
-   保持翻譯簡潔（德文通常長 20-30%）

**繁體中文（zh-hant）**：

-   使用台灣用語，非大陸用語
-   範例："軟體"（台灣）非 "软件"（大陸）

**西班牙文（es）**：

-   使用非正式 "tú"，非正式 "usted"
-   使用中性西班牙文（避免地區方言）

### 自動驗證工具

Singular Blockly 提供多個自動化工具來協助維護翻譯品質。所有工具都可以透過 npm scripts 執行,也可以直接使用 node 命令。

#### 驗證腳本 (`validate-translations.js`)

檢查常見錯誤：

```bash
# 驗證所有語言
npm run validate:i18n

# 驗證特定語言
npm run validate:i18n:lang -- --language=ja
# 或直接使用
node scripts/i18n/validate-translations.js --language=ja
```

**檢查項目**：

-   ✅ **佔位符保留**：{0}, %1 等必須完整保留
-   ✅ **無空翻譯**：所有訊息值為非空字串
-   ✅ **UTF-8 編碼**：檔案編碼正確
-   ✅ **長度比例警告**：翻譯長度 >150% 或 <50% 英文時警告（UI 溢出風險）
-   ✅ **Schema 驗證**：檔案結構符合規範

#### 模式偵測 (`detect-patterns.js`)

偵測直譯模式：

```bash
# 偵測所有語言
npm run detect:i18n

# 偵測特定語言
npm run detect:i18n:lang -- --language=ja
# 或直接使用
node scripts/i18n/detect-patterns.js --language=ja
```

**偵測項目**：

-   ⚠️ **英文冠詞**：在非英文文字中出現 "a", "an", "the"
-   ⚠️ **英文大寫模式**：句中不當大寫單字
-   ⚠️ **過度使用省略號**：連續三個以上句點 "..."
-   ⚠️ **違反詞彙表術語**：使用未核准的術語替代

#### 審計腳本 (`audit-translations.js`)

執行深度品質分析：

```bash
# 審計主要語言
npm run audit:i18n

# 審計所有語言
npm run audit:i18n:all

# 審計特定語言
npm run audit:i18n:ja
# 或直接使用
node scripts/i18n/audit-translations.js --languages=ja --verbose
```

#### 統計腳本 (`translation-stats.js`) ⭐ 新增

產生翻譯覆蓋率和品質統計：

```bash
# 產生 Markdown 報告
npm run stats:i18n

# 產生 JSON 數據
npm run stats:i18n:json

# 指定輸出檔案
node scripts/i18n/translation-stats.js --format both --output my-stats.json
```

**統計項目**：

-   📊 **覆蓋率**：每種語言的翻譯完整度百分比
-   📏 **平均長度**：翻譯字串的平均字元數
-   📐 **長度比例**：相對於英文基準的長度比較
-   ❌ **空鍵值計數**：需要翻譯的空字串數量

**輸出格式**：

-   Markdown 表格報告（適合檢視）
-   JSON 結構化數據（適合程式處理）

### CI/CD 整合

所有翻譯 PR 會自動執行 GitHub Actions 工作流程：

#### 必須通過的檢查 ✅

1. **驗證檢查** (`validate-translations.js`)

    - 佔位符保留
    - 編碼正確性
    - 無空字串
    - 長度比例在合理範圍內

2. **ESLint 檢查**
    - JavaScript 語法正確
    - 無程式碼風格問題

#### 建議性警告 ⚠️

1. **模式偵測** (`detect-patterns.js`)
    - 直譯模式識別
    - 詞彙表違規
    - 這些是警告,不會阻擋 PR 合併

#### 自動化報告

GitHub Actions 會在 PR 中自動留言,包含：

-   ✅/❌ 驗證結果
-   ⚠️ 警告清單
-   📊 翻譯統計摘要
-   🔗 完整報告連結

#### 月度審計

每月 1 日自動執行完整審計：

-   所有 15 種語言的品質報告
-   自動建立 GitHub Issue 附帶審計結果
-   若高嚴重性問題增加 >10% 會通知維護者

查看工作流程設定：`.github/workflows/i18n-validation.yml`

### 測試清單

提交 PR 前請確認：

#### 自動化測試

-   [ ] `validate-translations.js` 全部通過
-   [ ] `detect-patterns.js` 已檢視警告
-   [ ] ESLint 無錯誤
-   [ ] 翻譯檔案正確載入

#### 手動測試

-   [ ] **建立積木**：開啟工具箱 → 選擇分類 → 拖曳積木 → 驗證工具提示
-   [ ] **變更板子**：偏好設定 → 板子下拉選單 → 驗證板子名稱本地化
-   [ ] **產生程式碼**：新增積木 → 點擊「產生程式碼」→ 驗證成功訊息
-   [ ] **錯誤處理**：故意製造錯誤 → 驗證錯誤訊息本地化

#### UI 渲染

-   [ ] 無文字溢出
-   [ ] 無文字截斷
-   [ ] 無空字串
-   [ ] 語言切換正常
-   [ ] 淺色和深色主題都測試

---

## 提交程式碼

### 分支命名

-   `feature/{feature-name}` - 新功能
-   `fix/{bug-description}` - 錯誤修復
-   `localization/{lang}/{description}` - 翻譯改進
-   `docs/{description}` - 文件更新

### 提交訊息

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
<type>(<scope>): <subject>

<body>

<footer>
```

類型：

-   `feat`: 新功能
-   `fix`: 錯誤修復
-   `docs`: 文件變更
-   `style`: 程式碼格式（不影響功能）
-   `refactor`: 重構
-   `test`: 測試相關
-   `chore`: 建置或工具變更
-   `i18n`: 翻譯變更

範例：

```
i18n(ja): Replace direct translations in toolbox categories

- CATEGORY_LOGIC: "論理" → "論理ブロック"
- CATEGORY_TEXT: "テキスト" → "文字列"
- CATEGORY_VARIABLES: "変数" → "変数ブロック"

These changes improve cultural appropriateness and match
educational context for Japanese students.

Fixes #123
```

### Pull Request 流程

1. Fork 專案並建立功能分支
2. 進行變更並提交
3. 推送到您的 fork
4. 建立 Pull Request
5. 等待審查和 CI 檢查
6. 根據回饋進行調整
7. 合併後刪除分支

### 程式碼審查

所有 PR 需要：

-   ✅ CI 檢查通過
-   ✅ 至少一位維護者核准
-   ✅ 無合併衝突
-   ✅ 遵循程式碼風格（ESLint）

---

## 報告問題

### 錯誤報告

使用 GitHub Issues 報告錯誤：

**必要資訊**：

-   VS Code 版本
-   擴充功能版本
-   作業系統
-   重現步驟
-   預期行為
-   實際行為
-   錯誤訊息或截圖

### 功能請求

我們歡迎功能建議！請包含：

-   使用案例描述
-   建議的實作方式
-   相關範例或截圖
-   對現有功能的影響

### 翻譯問題

報告翻譯問題時請包含：

-   語言代碼（ja, ko, de 等）
-   問題鍵值（如 `CATEGORY_LOGIC`）
-   目前文字
-   建議的改進
-   為何目前文字有問題（文化、語氣、術語等）

---

## 行為準則

### 我們的承諾

為了營造開放和友善的環境，我們承諾：

-   使用包容性語言
-   尊重不同觀點和經驗
-   優雅地接受建設性批評
-   關注對社群最有利的事情
-   對其他社群成員表現同理心

### 不可接受的行為

-   使用性化語言或圖像
-   人身攻擊或侮辱性言論
-   公開或私下騷擾
-   未經許可發布他人私人資訊
-   其他在專業環境中合理被視為不當的行為

### 執行

違反行為準則的案例可以透過聯絡專案維護者報告。所有投訴都會被審查和調查。

---

## 資源

### 文件

-   [README.md](README.md) - 專案概述
-   [Translation Guidelines](specs/002-i18n-localization-review/guidelines/) - 語言特定指南
-   [Localization Glossary](specs/002-i18n-localization-review/localization-glossary.json) - 術語參考
-   [Architecture Guide](.github/copilot-instructions.md) - 專案架構說明

### 工具

-   [Blockly Documentation](https://developers.google.com/blockly)
-   [PlatformIO](https://platformio.org/)
-   [VS Code Extension API](https://code.visualstudio.com/api)

### 社群

-   GitHub Issues: [問題追蹤](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
-   GitHub Discussions: [討論區](https://github.com/Shen-Ming-Hong/singular-blockly/discussions)

---

## 授權

貢獻至本專案即表示您同意您的貢獻將依照專案的 [LICENSE](LICENSE) 授權。

---

**感謝您的貢獻！** 🎉

如有任何問題，請隨時透過 GitHub Issues 或 Discussions 聯絡我們。
