# 契約：必要主程式 Blockly runtime 政策

## 受保護類型

```js
const REQUIRED_MAIN_BLOCK_TYPES = new Set([
  'arduino_setup_loop',
  'micropython_main',
  'txt_setup',
]);
```

集合由共用 runtime 擁有並以唯讀方式供 editor 使用。`txt_process`、函式及普通積木不得加入。

## Context menu 安裝契約

```js
installRequiredMainBlockDisableGuard(): boolean
```

- 前置條件：Blockly 13.2.1 已載入，預設 `blockDisable` item 已註冊。
- 第一次成功包裝回傳 `true`；目前 item 已是同一 runtime 包裝時回傳 `false`。
- 若找不到原始 item，函式不得註冊不完整替代品或中斷 workspace 建立；必須回傳 `false` 且保持 registry 不變。此回傳只表示本次未安裝，呼叫端仍可在下一次 workspace 建立時重試。
- 包裝 item 使用原始 ID `blockDisable`。對受保護積木，`preconditionFn(scope, event)` 固定回傳 `hidden`，不呼叫原始 precondition。
- 對非受保護積木及沒有 block 的 scope，必須以相同 `this`、scope 與 menu event 呼叫原始 precondition，回傳值不得改寫。
- `displayText`、`callback`、`weight`、`scopeType`、`associatedKeyboardShortcut` 與未來 Blockly 加入的其他 enumerable metadata 必須完整保留。
- workspace 建立與語言重建後可再次呼叫；不得產生重複 ID 或第二個停用選項。若 registry reset 後 `blockDisable` 回到新的核心 item，必須能再次包裝。

## 工作區修復契約

```js
repairRequiredMainBlockDisabledReasons(workspace): boolean
```

1. `workspace` 不存在或沒有受保護積木時回傳 `false`。
2. 掃描 `workspace.getAllBlocks(false)` 或等價的完整非 flyout 集合。
3. 對每個受保護積木建立 `Array.from(block.getDisabledReasons())` 快照。
4. 原因快照非空時，逐項呼叫 `block.setDisabledReason(false, reason)`，不得假設原因名稱。
5. 只要至少清除一項即回傳 `true`；穩定狀態重複呼叫回傳 `false`。
6. 清除時若 Blockly events 原本啟用，先 disable，並在 `finally` enable；原本已停用時不得自行 enable。
7. 任一例外都必須恢復原 events 狀態後向呼叫者傳播，不可留在全域事件停用狀態。

## 編輯器統一保護順序

```text
install menu guard
→ repairRequiredMainBlockDisabledReasons
→ resolve current board main type
→ count current-board main blocks
→ set deletable and duplicate warning
→ TXT setup/process validation when applicable
→ return repaired
```

呼叫入口：

- `BLOCK_CREATE`
- `BLOCK_DELETE`
- `BLOCK_CHANGE` 且 `element === 'disabled'`
- 初次正式工作區載入
- 外部候選與 FileWatcher 正式載入
- 備份及其他現有正式載入
- 開發板切換
- 語言切換後 workspace 重建

## 事件與保存契約

- 使用者或其他程式造成的原始 disabled change event 可進入 listener。
- listener 在同一次處理中修復狀態；修復本身不發出新 Blockly event。
- 原始事件仍繼續既有 debounce／save 路徑，序列化時讀到已修復狀態。
- 正式 load 的修復結果由 load acknowledgement 明確回報，不依賴被抑制的 repair event 觸發保存。

## 驗收矩陣

| 對象 | 選單 | 原因清除 | 可刪除政策 |
|------|------|----------|------------|
| `arduino_setup_loop` | hidden | 全部清除 | 單一否、重複是 |
| `micropython_main` | hidden | 全部清除 | 單一否、重複是 |
| `txt_setup` | hidden | 全部清除 | 單一否、重複是 |
| `txt_process` | 原始行為 | 不清除 | 原始行為 |
| 函式積木 | 原始行為 | 不清除 | 原始行為 |
| 普通積木 | 原始行為 | 不清除 | 原始行為 |
