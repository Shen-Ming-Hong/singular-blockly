# WebView Blockly 13 整合契約

## 1. Runtime 注入契約

Extension Host 產生 editor／preview HTML 時必須提供：

```js
window.BLOCKLY_MEDIA_URL = 'vscode-webview-resource-uri/.../node_modules/blockly/media/';
window.BLOCKLY_CORE_LOCALE_URIS = {
  en: '.../node_modules/blockly/msg/en.js',
  // 十五種支援 locale
};
```

- 所有 URI 必須由 `webview.asWebviewUri()` 產生。
- `BLOCKLY_MEDIA_URL` 必須以 `/` 結尾。
- locale key 必須使用專案既有 normalized locale 名稱，且每個 URI 指向存在的官方 script。
- editor 與 preview 必須注入相同的 core、theme、locale 與 media 版本。

## 2. Workspace ownership 契約

WebView 公開以下 app-owned accessor：

```js
window.getBlocklyWorkspace = function () {
  return canonicalWorkspaceOrNull;
};
```

- workspace factory 是唯一可設定 canonical workspace 的模組。
- workspace dispose 後 accessor 必須立即回傳 `null`，直到重建完成。
- block method 使用自身 workspace；接收 workspace 的 helper 不得忽略參數改查全域。
- editor、preview、flyout 與 mutator workspace 不得互相誤認。

## 3. Blockly 建立設定

Editor 與 preview 的 `Blockly.inject()` 必須包含：

```js
{
  renderer: 'thrasos',
  theme: selectedSingularTheme,
  media: window.BLOCKLY_MEDIA_URL
}
```

Preview 另必須保持 `readOnly: true`；editor 的 toolbox、move、zoom、trashcan 與 maxInstances 行為維持現況。

## 4. Prompt request／result

### WebView → Extension Host

```json
{
  "command": "blocklyDialogPrompt",
  "requestId": "dlg-unique-id",
  "message": "已解析提示文字",
  "defaultValue": "目前值",
  "board": "current-board-id"
}
```

### Extension Host → WebView

```json
{
  "command": "blocklyDialogPromptResult",
  "requestId": "dlg-unique-id",
  "value": "使用者輸入或 null"
}
```

- Extension Host 使用既有板別規則驗證變數／識別字名稱。
- 使用者取消時 `value` 必須為 `null`。
- result 必須且只能完成同 ID 的 pending callback 一次。

## 5. Confirm request／result

### WebView → Extension Host

```json
{
  "command": "blocklyDialogConfirm",
  "requestId": "dlg-unique-id",
  "message": "已解析確認文字"
}
```

### Extension Host → WebView

```json
{
  "command": "blocklyDialogConfirmResult",
  "requestId": "dlg-unique-id",
  "confirmed": true
}
```

- 關閉、取消或非確認按鈕一律回傳 `false`。
- 不再使用 `promptNewVariable/createVariable/confirmDeleteVariable/deleteVariable` 直接改寫 workspace 的特殊流程。

## 6. 語言切換契約

`languageManager.setLanguage(locale)` 必須回傳 Promise，並依序執行：

1. 驗證 locale 存在於 project messages 與 core URI map。
2. 保存目前 workspace JSON、board、theme 與 mode。
3. 進入 rebuilding guard，暫停一般自動儲存。
4. 載入目標官方 Blockly core locale script。
5. 使用 `Blockly.setLocale()` 套用 Singular project messages。
6. dispose 舊 workspace 並以原設定重新 inject。
7. 載入保存的 JSON state，恢復 board/theme/mode 與必要 listener。
8. 離開 rebuilding guard 並發出 `languageChanged`。

任一步驟失敗時：

- 保留最近有效 JSON state。
- accessor 不得留下已 dispose workspace。
- 顯示可理解錯誤並允許以原 locale 重建。
- 不得把暫時空 workspace 寫回 `main.json`。

## 7. 快捷鍵契約

- Blockly 13 預設快捷鍵註冊不得移除或全域停用。
- AI suggestion shortcuts 必須透過 `ShortcutRegistry` 註冊。
- Tab、Escape、Alt+[、Alt+] 只有 suggestion active 且焦點不在文字輸入／IME composition 時才能執行。
- Suggestion inactive 時 callback precondition 必須回傳 false，讓 Blockly 原生導覽處理按鍵。
- VS Code 頁面層 Ctrl/Cmd+S 與 Ctrl/Cmd+F 必須保留文字輸入與 Blockly focus guard。

## 8. 允許與禁止的 Blockly 整合面

### 必須使用

- Workspace／Block instance 明確傳遞
- `getVariableMap()` 與 VariableModel
- `getToolbox()`、`getFlyout()`、`getWorkspace()`
- `getSvgRoot()` 與 app-owned CSS class
- `Blockly.dialog.setPrompt/setConfirm`
- `ShortcutRegistry`
- JSON workspace serialization、JSON flyout items、JSON shadow state
- `saveExtraState/loadExtraState`

### 禁止新增或保留

- `Block.getVars()`
- Workspace variable wrapper APIs
- `Blockly.Events.CREATE/CHANGE/MOVE/DELETE` 舊別名
- `Blockly.getMainWorkspace()`
- `toolbox_`、`flyout_`、`workspace_`、`pathObject`
- 覆寫 Blockly core prototype 或 static variable UI functions
- 手動傳入 plain object 偽造 Blockly change event
- 新增 runtime XML flyout 或 shadow 建立流程

### Legacy allowlist

- Preview 舊 XML 備份 parser
- 自訂動態積木的 `mutationToDom/domToMutation`，僅供舊資料載入

## 9. 資料相容契約

- `main.json` 對外 workspace schema 不變。
- 現有 JSON state 經 load/save round-trip 後保留所有語意狀態。
- XML import 不修改來源備份；成功載入後可另存現行 JSON。
- Dynamic block 的 JSON extra state 與 legacy mutation 必須產生等價 shape。
- 讀取失敗不得觸發空狀態覆寫。
