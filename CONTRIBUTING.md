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

-   Node.js 22.16.0 或更高版本
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

1. 閱讀 [i18n 規格](docs/specifications/02-internationalization/i18n.md)。
2. 使用工作區 `i18n-maintenance` Skill 的 semantic policy 與目標 locale profile。
3. 確認實際 call site 的操作、後果、fallback 與訊息類型。

### 翻譯工作流程

#### 步驟 1：建立功能分支

```bash
git checkout -b localization/{lang}/fix-high-priority
```

#### 步驟 2：編輯翻譯

翻譯可能位於：

- `media/locales/{lang}/messages.js`
- `package.nls*.json`
- `media/samples/index.json`
- sample JSON 的 `nameTranslations`／`stringTranslations`

英文 locale 是一般訊息的 key／placeholder 結構基準，但語意以程式實際行為與核准規格為準。英文新增 key 時必須同步其他 14 個 locale。

#### 步驟 3：執行結構與語意維護

```bash
npm run validate:i18n
npm run validate:i18n:lang -- --language={lang}
npm run test:i18n
npm run lint:i18n
```

使用 `i18n-maintenance` 的增量修復模式審計本次 diff。硬檢查最多修復三輪；結果必須為 `PASS` 或 `PASS_WITH_ADVISORIES`。`NEEDS_USER_DECISION` 必須由產品負責人選擇候選譯法；`BLOCKED` 不得提交。

#### 步驟 4：手動驗證

- 按鈕、選單與確認框動作符合實際效果。
- 警告／錯誤包含具體後果及可行的下一步。
- 8–14 歲使用者能理解發生什麼、要做什麼、結果是什麼。
- 技術名稱、板型、腳位、數值、單位、識別字與 fallback 正確。
- ARIA 描述用途／狀態；受影響 UI 沒有截斷或溢出。

#### 步驟 5：提交 Pull Request

使用本地化 PR 模板（`.github/PULL_REQUEST_TEMPLATE/localization.md`）

包含：

- 重要前後對照與 semantic rule ID。
- `i18n-maintenance` 結果與 deterministic 測試。
- 使用者核准的 ambiguous finding／waiver（如有）。
- UI 渲染截圖（如適用）。
- full-audit 既有 Major backlog 與其他殘餘風險。

### 翻譯指南

#### 品質標準

- **意義與操作**：保留行為、否定、條件、數量、因果、可逆性與安全後果。
- **兒少可理解性**：使用常見詞與具體動詞，不把必要技術名稱錯誤簡化掉。
- **語氣與在地性**：友善、不責怪、不幼兒化；遵循版本化 locale policy。
- **術語**：使用 `preferred`／`allowed` 詞彙，不在一般翻譯 PR 臨時改政策。
- **可及性與版面**：ARIA 描述語意；字元比例本身不代表溢出，實際 UI 才是證據。

### 自動驗證工具

`validate-translations.js` 只處理客觀、可重複的錯誤：

```bash
npm run validate:i18n
npm run validate:i18n:lang -- --language=ja
node scripts/i18n/validate-translations.js --all --format=json
```

檢查 15 語系與 package NLS 的缺少／多餘 key、UTF-8／BOM、schema、空值、placeholder 次數、必要 ARIA 與 Blockly core locale。語意品質由 `i18n-maintenance` 處理，不使用 regex detector、whitelist 或總分取代 reviewer 判斷。

### CI/CD 整合

GitHub Actions 只執行 deterministic gate、ESLint 與 i18n tests，不執行會隨模型改變的語意 detector。工作區 Skill 每次觸發時檢查 repo audit state；距完整審計已滿 30 天、政策版本改變或 audit 尚未完成時，以每批 200 組的 checkpoint 繼續全量審計，不建立固定月度 workflow。

### 測試清單

提交 PR 前請確認：

#### 自動化測試

- [ ] `npm run validate:i18n` 全部通過
- [ ] `npm run test:i18n` 全部通過
- [ ] `npm run lint:i18n` 無錯誤
- [ ] `i18n-maintenance` 結果為 `PASS` 或 `PASS_WITH_ADVISORIES`

#### 手動測試

- [ ] **建立積木**：開啟工具箱 → 選擇分類 → 拖曳積木 → 驗證工具提示
- [ ] **變更板子**：偏好設定 → 板子下拉選單 → 驗證板子名稱本地化
- [ ] **產生程式碼**：新增積木 → 點擊「產生程式碼」→ 驗證成功訊息
- [ ] **錯誤處理**：故意製造錯誤 → 驗證錯誤訊息與復原步驟

#### UI 渲染

- [ ] 無文字溢出或截斷
- [ ] 無空字串
- [ ] 語言切換與 fallback 正常
- [ ] 受影響畫面已測試適用的淺色和深色主題

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
-   [i18n 規格](docs/specifications/02-internationalization/i18n.md) - 結構、語意與完整審計契約
-   [i18n-maintenance Skill](.github/skills/i18n-maintenance/SKILL.md) - 維護工作流程與版本化政策
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
