# Quickstart：Blockly 13 升級驗證

## 前置條件

- Node.js 22.16.0 以上
- 已安裝專案相依套件
- VS Code／VSCodium 1.105.0 以上
- macOS VoiceOver 可供人工無障礙驗收
- 已準備 Arduino、CyberBrick、TXT 的 JSON workspace fixture 與至少一份舊 XML 備份

## 1. 版本與禁止 API 檢查

```bash
npm install
npm run compile
npm run lint
```

確認：

- lockfile 解析 Blockly 13.2.1 與相容的 Modern theme。
- 自動契約測試對 [WebView Blockly 13 整合契約](./contracts/webview-blockly-v13.md) 的禁止項目回報為零。
- editor 與 preview 均注入 Thrasos 與套件內 media URI。

## 2. 自動回歸

```bash
npm test
npm run test:integration
npm run validate:i18n
```

確認：

- JSON 與 XML fixtures 均可載入。
- 變數、函式、mutator、shadow、鎖定與 orphan guard 測試通過。
- Arduino、MicroPython、TXT 代表性程式輸出無未核准差異。
- 十五種官方 core locale 檔案均存在，A→B→A 語言切換契約通過。
- AI shortcut、一般文字輸入及 IME composition contract tests 通過。

## 3. 效能基準

以固定 500-block fixture 分別在升級前基準與升級後版本記錄：

- 首次 workspace ready 時間
- JSON load 完成時間
- toolbox 開啟與搜尋高亮的主要互動時間
- 重複開啟／關閉 editor 後的明顯資源洩漏訊號

升級後時間不得比基準惡化超過 10%。測試環境、VS Code 版本與 fixture 必須相同。

## 4. 封裝與離線驗證

```bash
npm run package
npx @vscode/vsce package
```

在封鎖外部網路的測試環境安裝 VSIX，開啟 editor 與 preview。確認積木、SVG 控制圖示、trashcan、縮放、drop sound、十五語系與 Singular theme 均由套件內資源載入，WebView 不需要外部 Blockly URL。

## 5. 人工 UI 與相容性矩陣

依序驗證：

1. 明亮、深色及 VS Code 高對比模式。
2. Arduino、CyberBrick、TXT toolbox 與工作區。
3. JSON workspace 的開啟、編輯、儲存、重開與程式輸出。
4. 舊 XML 備份匯入後另存 JSON。
5. 搜尋高亮、實驗積木標記、整理工作區保存及唯讀 preview。
6. 語言 A→B→A，確認畫面與 ARIA 訊息無前一語言殘留。

## 6. 純鍵盤與 VoiceOver

不使用滑鼠完成：

1. 將焦點移入 workspace。
2. 巡覽 toolbox 與 flyout，建立積木。
3. 巡覽積木、connection、field、dropdown、icon 與 comment。
4. 編輯文字／數字／變數欄位，測試中文輸入法 composition。
5. 移動、連接、複製、刪除與整理積木。
6. 開啟 mutator，新增與移除函式參數。
7. 啟用 AI suggestion，測試接受、取消與切換；關閉後確認 Tab/Escape 回復原生導覽。

通過條件：無阻斷性鍵盤問題，VoiceOver 對焦點、名稱、狀態、動作與結果無嚴重或高優先級缺陷。

## 7. 最終完成條件

- 規格的 SC-001 至 SC-010 全部具備測試或人工驗收紀錄。
- `git diff --check` 通過。
- 未建立 release tag，未發布 Marketplace／Open VSX 版本。
