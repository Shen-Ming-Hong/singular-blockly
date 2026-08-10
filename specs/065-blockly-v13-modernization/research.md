# Phase 0 研究：Blockly 13 現代化升級

## 決策 1：目標版本與執行環境

**決策**：升級至 Blockly 13.2.1 與 `@blockly/theme-modern` 13.2.0，`package.json` 保持 caret 相依範圍並由 lockfile 固定本次解析版本；新增 Node.js `>=22.16.0` engine。

**理由**：13.2.1 是 2026-08-09 查得的最新穩定版，包含 flyout toolbar、RTL insertion marker／trashcan lid 與 memory leak 修正。Blockly 13 的 Node engine 為 22 以上，專案既有基準已符合。

**考慮過的替代方案**：停留 13.0.0 會錯過後續無障礙、焦點與效能修正；追蹤未發布 main branch 無法提供可重現基準。

**來源**：[Blockly 13.0.0 release](https://github.com/RaspberryPiFoundation/blockly/releases/tag/blockly-v13.0.0)、[Blockly 13.2.1 release](https://github.com/RaspberryPiFoundation/blockly/releases/tag/blockly-v13.2.1)

## 決策 2：新版 UI、renderer 與媒體

**決策**：編輯與預覽均明確指定 `renderer: 'thrasos'`；Singular 明暗 theme 繼承新版 Modern theme；透過 `webview.asWebviewUri()` 將 `node_modules/blockly/media/` 設為 workspace media 來源。

**理由**：v13 已將 Thrasos 設為預設並建議明確指定。它比 Geras 使用更少 DOM 元素且提供均勻間距與實線邊界。自行託管新 drop sound 與 SVG 控制圖示可維持離線及 CSP 相容。

**考慮過的替代方案**：全面改用未客製 Modern theme 會失去品牌一致性；依賴 Blockly 官方媒體 URL 會破壞離線要求；維持 Geras 會錯過新版呈現與效能改善。

**來源**：[Blockly renderer 指南](https://developers.google.com/blockly/guides/create-custom-blocks/renderers/overview)、[Blockly 13.0.0 release](https://github.com/RaspberryPiFoundation/blockly/releases/tag/blockly-v13.0.0)

## 決策 3：工作區所有權與公開 API

**決策**：工作區建立後登記至 app-owned `window.getBlocklyWorkspace()`；helper 優先接收 workspace 參數，block method 使用 `this.workspace`，generator 使用呼叫端 workspace。全面移除 `getMainWorkspace()`、private fields 與核心 prototype monkeypatch。

**理由**：專案同時有 editor、preview、flyout 與 mutator workspace；依賴全域 main workspace 或底線欄位會在焦點與 flyout 重構後取得錯誤實例。公開 getter 與明確所有權可測試且支援多工作區。

**考慮過的替代方案**：保留 `getMainWorkspace()` 雖未在 v13 移除，但官方不建議多工作區應用依賴；逐版修補 private fields 無法提供穩定相容保證。

## 決策 4：已移除 API 與事件遷移

**決策**：procedure generator 以 `getVarModels()` 取得模型並使用名稱；變數操作統一走 `getVariableMap()`；事件類型改用 `BLOCK_CREATE`、`BLOCK_CHANGE`、`BLOCK_MOVE`、`BLOCK_DELETE`。變數模型操作產生的官方事件作為唯一狀態訊號，不手動偽造事件。

**理由**：`Block.getVars()` 與 Workspace variable wrappers 已在 v13 移除，舊事件別名已過時。使用模型及 VariableMap 可保留名稱、ID、型別與事件語意。

**考慮過的替代方案**：建立相容 shim 只會延後技術債並掩蓋呼叫端的名稱／ID 語意差異。

## 決策 5：變數對話與 VS Code 原生 UI

**決策**：使用 `Blockly.dialog.setPrompt()` 與 `setConfirm()` 安裝非同步 adapter，以 request ID 經 `postMessage` 交給 Extension Host 顯示輸入框／確認框；回應後呼叫 Blockly callback。移除 `FieldVariable` 與 `Variables.createVariable` 覆寫。

**理由**：公開 dialog API 保留 Blockly 內建的變數建立、重名檢查、引用更新、刪除確認與事件流程，同時可延續 VS Code 原生 UI 及開發板名稱驗證。

**考慮過的替代方案**：繼續覆寫 protected field methods 會耦合內部 menu 實作；直接使用 browser prompt 無法提供一致的 VS Code 體驗與名稱驗證。

## 決策 6：快捷鍵、IME 與無障礙

**決策**：保留 Blockly 13 所有預設導覽鍵；AI 建議使用 `ShortcutRegistry` 並以 suggestion active precondition 限定 Tab、Escape、Alt+[、Alt+]。移除 `FieldInput.onHtmlInputKeyDown_` monkeypatch；若 v13 原生 IME 測試仍失敗，才使用已註冊的 app-owned `FieldTextInput` subclass。

**理由**：v13 預設啟用鍵盤導覽與螢幕閱讀器，官方建議盡可能保留預設快捷鍵。集中 shortcut scope 可避免 document capture listener 在文字輸入、IME、dropdown 與 flyout 情境偷走按鍵。

**考慮過的替代方案**：維持 document capture listener 無法可靠理解 Blockly focus tree；停用內建鍵盤導覽違反已確認的無障礙目標。

**來源**：[Blockly 13.0.0 release](https://github.com/RaspberryPiFoundation/blockly/releases/tag/blockly-v13.0.0)、[Keyboard navigation](https://developers.google.com/blockly/guides/configure/keyboard-nav)

## 決策 7：JSON 序列化與 XML 相容邊界

**決策**：workspace save/load 維持 JSON；dynamic toolbox callback 回傳 JSON flyout items，預設 shadow 改用 JSON shadow state；所有動態自訂積木必須具備 `saveExtraState/loadExtraState`。XML parser 與 `mutationToDom/domToMutation` 僅保留舊備份及 legacy block state 相容。

**理由**：官方將 JSON 列為持續開發的建議格式，XML 已凍結但不會移除。此邊界可降低 runtime XML 依賴又不破壞舊資料。

**考慮過的替代方案**：完全移除 XML 會使既有備份不可用；保留所有 runtime XML 會繼續擴大凍結格式的使用面。

**來源**：[Blockly 儲存與載入](https://developers.google.com/blockly/guides/configure/web/serialization)

## 決策 8：動態語系切換

**決策**：WebView Manager 注入十五種官方 Blockly locale script URI map；`setLanguage()` 改為非同步 workspace rebuild：保存 JSON → 載入目標官方核心訊息 → 套用 Singular 訊息覆寫 → dispose/reinject → 還原 state、board、theme 與 mode。

**理由**：v13 英文核心訊息相較 v12 增加大量 ARIA 與快捷鍵內容。`Blockly.setLocale()` 是合併而非清空，若只套用專案訊息，A→B 切換後會留下前一語言核心字串。重新建立 workspace 也是官方建議的 runtime 語言切換方式。

**考慮過的替代方案**：將數百個官方核心 key 複製進十五個專案語系會增加同步成本；只呼叫 render 無法重建已建立積木與 focus tree 的文字。

**來源**：[Blockly translations](https://developers.google.com/blockly/guides/configure/translations)

## 決策 9：搜尋、實驗標記與整理保存

**決策**：搜尋高亮在 `block.getSvgRoot()` 套用 CSS class；實驗標記使用 workspace change listener、公開 toolbox/flyout getter 與 MutationObserver；工作區整理後保存依賴集中式 debounced change pipeline。

**理由**：`pathObject` 是 internal renderer 物件，Thrasos DOM 與 Geras 不同；prototype patch 會影響 editor、preview、flyout 與 mutator 所有實例。公開 root 與既有 observer 能達到相同行為且不綁定 renderer 內部結構。

**考慮過的替代方案**：針對 Thrasos 新 DOM 路徑再寫 selector 或 prototype patch 仍會在小版本更新時失效。

## 決策 10：驗證策略

**決策**：採四層驗證：靜態禁止 API contract、workspace／generator 自動回歸、封裝與離線整合、人工鍵盤／VoiceOver／高對比；另以固定 500-block fixture 比較升級前後基準。

**理由**：WebView JavaScript 無法直接匯入 Node 測試，而純人工測試無法防止舊 API 回歸。契約掃描、fixture 與實際 VSIX smoke test 組合符合專案測試限制。

**考慮過的替代方案**：本 feature 導入完整 Playwright/WebdriverIO 會顯著擴大基礎設施，且超出升級需求；只做編譯無法涵蓋 UMD runtime 與焦點行為。
