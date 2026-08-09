# 實作計畫：Blockly 13 現代化升級

**分支**：`065-blockly-v13-modernization` | **日期**：2026-08-09 | **規格**：[spec.md](./spec.md)

**輸入**：`specs/065-blockly-v13-modernization/spec.md`

## 摘要

將 Blockly 由 12.3.1 升級至 13.2.1，並將 Modern theme 升級至相容的 13.2.0。編輯器與預覽工作區明確採用 Thrasos renderer、套件內媒體與 Singular 明暗品牌主題；同時以明確 workspace ownership、公開工具箱／事件／變數／對話／快捷鍵介面取代已移除 API、private field 與核心 prototype monkeypatch。主要資料格式維持 JSON，XML 僅保留舊備份匯入及 mutation 相容；語言切換會依「保存狀態、載入官方核心語系、套用專案覆寫、重建工作區、還原狀態」順序執行。

## 技術背景

**語言／版本**：TypeScript 5.9.3、WebView JavaScript、Node.js 22.16.0 以上

**主要相依套件**：Blockly 13.2.1、`@blockly/theme-modern` 13.2.0、VS Code API `^1.105.0`

**儲存**：工作區 JSON (`main.json`)；舊 XML 備份為唯讀相容輸入

**測試**：Mocha、Sinon、`@vscode/test-electron`、WebView contract tests、整合測試、人工鍵盤／VoiceOver／高對比驗收

**目標平台**：VS Code／VSCodium Extension Host 與 Chromium WebView；macOS 為 VoiceOver 驗收平台

**專案類型**：桌面編輯器擴充套件，Extension Host 與 WebView 分離

**效能目標**：含 500 個代表性積木的工作區，其載入與主要互動時間相較升級前基準不得惡化超過 10%

**限制**：離線可用、十五語系、維持 JSON 資料架構、保留空狀態 guard、WebView 資源皆須經 `asWebviewUri()`、不得依賴 Blockly private/protected runtime 欄位或全域 prototype monkeypatch

**規模／範圍**：約 123 個自訂積木定義、248 個 toolbox block 項目、十五語系、編輯與預覽兩種工作區、Arduino／MicroPython／TXT 三套程式產生流程

## 憲法檢查

*Gate：Phase 0 前及 Phase 1 設計後均已通過。*

- **I 簡潔與可維護性**：以單一 workspace accessor、共用 locale lifecycle 與公開 API 取代分散 monkeypatch，降低隱性耦合。
- **II 模組化與擴充性**：Extension Host 對話橋接、WebView runtime 設定、locale bundle 與 workspace lifecycle 各自有明確契約。
- **III 避免過度開發**：不改造外層工具列、不新增積木或開發板、不導入新的前端框架與 bundler。
- **IV 彈性與適應性**：媒體及十五語系 URI 使用資料映射，編輯與預覽共用同一套初始化規則。
- **V 研究驅動**：版本、breaking changes、renderer、序列化、鍵盤及語系決策皆以 Blockly 官方 release 與文件為依據，彙整於 [research.md](./research.md)。
- **VI 結構化日誌**：Extension Host 維持專案 logging service；WebView 使用既有 `window.log`，不新增 Extension Host `console.log`。
- **VII 完整測試覆蓋**：純邏輯及訊息處理以自動測試覆蓋；WebView 視覺與 VoiceOver 依憲法例外採有紀錄的人工驗收。
- **VIII 純函式與模組化**：locale 合併、dialog request 配對、workspace state 保存與禁止 API 掃描設計為可獨立測試的 helper。
- **IX 繁體中文文件**：所有 feature artifacts 皆使用繁體中文。
- **X 專業發布管理**：本 feature 僅完成可封裝驗證，不建立 tag 或發布版本。
- **XI Agent Skills 架構**：依 Spec Kit skills 產出 SDD artifacts；實作階段啟用 security-checker。

**Phase 1 後重檢**：資料模型未新增持久化 schema，契約僅增加 app-owned WebView 介面；未出現憲法違規或需額外複雜度豁免的設計。

## 專案結構

### 本功能文件

```text
specs/065-blockly-v13-modernization/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── webview-blockly-v13.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 原始碼

```text
src/
├── webview/
│   ├── webviewManager.ts        # 注入 Blockly runtime、media 與 locale URI
│   └── messageHandler.ts        # VS Code prompt/confirm 非同步橋接
└── test/
    ├── suite/                   # 相容性、產生器、IME 與主題契約測試
    └── webview/                 # WebView 訊息與 runtime contract tests

media/
├── html/
│   ├── blocklyEdit.html         # 語言管理與 editor bootstrap
│   └── blocklyPreview.html      # preview bootstrap
├── js/
│   ├── blocklyEdit.js           # workspace lifecycle 與公開 API 遷移
│   ├── blocklyPreview.js        # 唯讀 workspace lifecycle
│   ├── experimentalBlockMarker.js
│   └── shadowKeyboardHandler.js
└── blockly/
    ├── blocks/                  # event、mutator、shadow state 遷移
    ├── generators/              # variable model 與 workspace 傳遞遷移
    └── themes/                  # Singular 明暗 theme
```

**結構決策**：沿用現有 Extension Host／WebView 分離架構；不建立新應用層。可重用的 runtime lifecycle 與 dialog adapter 置於既有 WebView orchestration 邊界，契約測試保留在 `src/test/`。

## 實作策略

1. **依賴與封裝基線**：更新 Blockly 與 Modern theme，宣告 Node.js 基準，確認 `.vscodeignore` 會封裝新版 core、locale、theme 與 `media/`。
2. **工作區與 UI runtime**：編輯及預覽明確設定 Thrasos、套件內 media URI 與 Singular theme；建立 app-owned workspace accessor，將主題、搜尋、標記、AI 與產生器改用明確 workspace。
3. **公開 API 翻新**：替換 variable model、VariableMap、事件常數及 toolbox/flyout getter；移除核心 prototype 覆寫、private DOM path 與手動偽造事件。
4. **對話與快捷鍵**：以公開 dialog adapter 將 prompt/confirm 非同步橋接至 VS Code；以 ShortcutRegistry 註冊 AI 建議按鍵並保留原生導覽優先權。
5. **JSON 與舊資料相容**：dynamic flyout 與預設 shadow 使用 JSON state；逐一驗證 dynamic blocks 的 extra state，保留 XML 匯入及 legacy mutation hooks。
6. **語系重建流程**：注入十五個官方核心語系 URI；切換語言時保存 JSON、載入官方 core、套用 Singular 覆寫、重建並還原 editor/preview workspace。
7. **回歸與無障礙驗收**：建立禁止 API 掃描、workspace fixtures、程式輸出、語系 A→B→A、IME、快捷鍵、離線封裝及 500-block benchmark，最後執行人工鍵盤／VoiceOver／高對比矩陣。

## 複雜度追蹤

無憲法違規，無需複雜度豁免。
