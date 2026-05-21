# TXT 虛擬控制畫布 PostMessage 合約

**版本**：v1  
**範圍**：`media/js/blocklyEdit.js` ↔ `src/webview/messageHandler.ts`

---

## 合約目標

本文件定義 TXT 虛擬控制畫布在同一個 Blockly WebView 內運作時，WebView 與 Extension Host 間新增或擴充的 message contract。

既有 `saveWorkspace`、`init`、`loadWorkspace`、`txtUpload`、`txtExecutionStopped` 會被**擴充欄位**，而不是另開一組完全平行的保存流程。

---

## WebView → Extension Host

### 1. `saveWorkspace`（擴充）

儲存 Blockly workspace 時，同步帶上虛擬控制版面資料。

```json
{
  "command": "saveWorkspace",
  "state": {},
  "board": "txt",
  "txtVirtualControls": {
    "schemaVersion": 1,
    "canvas": { "mode": "editing" },
    "controls": []
  }
}
```

#### 規則

- `board === 'txt'` 時才應附帶 `txtVirtualControls`
- `canvas.mode` 實際保存時可被正規化為 `editing`
- 若 WebView 尚未建立任何虛擬控制，可傳空 `controls`

---

### 2. `txtUpload`（擴充）

TXT 執行請求需附帶目前版面快照與 preflight 結果，避免 Host 端只看到舊保存狀態。

```json
{
  "command": "txtUpload",
  "board": "txt",
  "code": "...generated python...",
  "txtVirtualControls": {
    "schemaVersion": 1,
    "canvas": { "mode": "editing" },
    "controls": []
  },
  "virtualControlPreflight": {
    "valid": true,
    "invalidReferences": []
  }
}
```

#### 規則

- WebView 必須先做一次 invalid reference 檢查
- 即使 WebView 回報 `valid: true`，Host 端仍需再次檢查
- 若 `valid: false`，Host 端不得開始執行 TXT 程式

---

### 3. `txtVirtualControlStateChanged`

程式執行期間，按鈕 press / release 事件透過這個訊息送到 Host，再由 Host 轉送到 TXT companion runtime。

```json
{
  "command": "txtVirtualControlStateChanged",
  "sessionId": "session-uuid",
  "stableId": "btn-001",
  "pressed": true
}
```

#### 規則

- 僅 `running` 模式可送出
- `editing` 模式點擊不得送出這個訊息
- `sessionId` 必須與目前執行中的 TXT runtime session 一致

---

## Extension Host → WebView

### 1. `init`（擴充）

初始化 WebView 時帶回保存過的虛擬控制資料。

```json
{
  "command": "init",
  "board": "txt",
  "workspace": {},
  "theme": "light",
  "txtVirtualControls": {
    "schemaVersion": 1,
    "canvas": { "mode": "editing" },
    "controls": []
  }
}
```

---

### 2. `loadWorkspace`（擴充）

從 FileWatcher、備份還原或其他 reload 路徑重新載入時，需一併帶回虛擬控制資料。

```json
{
  "command": "loadWorkspace",
  "board": "txt",
  "state": {},
  "txtVirtualControls": {
    "schemaVersion": 1,
    "canvas": { "mode": "editing" },
    "controls": []
  }
}
```

---

### 3. `txtVirtualControlsExecutionStateChanged`

告知 WebView 畫布目前應切換成 `editing` 或 `running`。

```json
{
  "command": "txtVirtualControlsExecutionStateChanged",
  "mode": "running",
  "sessionId": "session-uuid"
}
```

#### 規則

- `mode === 'running'` 時，畫布必須鎖定位置編輯
- `mode === 'editing'` 時，所有 button pressed state 必須重設為未按下

---

### 4. `txtVirtualControlsExecutionBlocked`

Host-side preflight 發現仍有失效引用時，回傳阻止執行結果。

```json
{
  "command": "txtVirtualControlsExecutionBlocked",
  "invalidReferences": [
    {
      "blockId": "block-123",
      "stableId": "btn-001",
      "lastKnownDisplayName": "開始",
      "reason": "missing-control"
    }
  ]
}
```

#### 規則

- WebView 收到後應高亮或清楚標示對應 block
- 收到此訊息後必須維持 `editing` 模式

---

### 5. `txtVirtualControlsRuntimeError`

companion runtime 啟動、同步或停止失敗時，回傳錯誤給 WebView。

```json
{
  "command": "txtVirtualControlsRuntimeError",
  "stage": "sync",
  "message": "Failed to update virtual control runtime state"
}
```

---

## 狀態一致性規則

1. `saveWorkspace` 與 `txtUpload` 看到的 `txtVirtualControls` 必須來自同一份 WebView in-memory document。
2. `txtVirtualControlStateChanged` 只在 `running` 模式合法。
3. `txtExecutionStopped`、`txtUploadResult`（成功或失敗）與 `txtVirtualControlsRuntimeError` 都應讓 WebView 回到 `editing` 模式。
4. 任何 reload 流程都必須帶回 `txtVirtualControls`，避免只還原 block 而遺失按鈕版面。

---

## 與既有訊息的整合

| 現有訊息 | 擴充方式 |
|---------|----------|
| `saveWorkspace` | 新增 `txtVirtualControls` 欄位 |
| `init` | 新增 `txtVirtualControls` 欄位 |
| `loadWorkspace` | 新增 `txtVirtualControls` 欄位 |
| `txtUpload` | 新增 `txtVirtualControls` 與 `virtualControlPreflight` |
| `txtExecutionStopped` | 保持既有事件，但需驅動畫布回到 `editing` |

---

## 不做的事（v1 範圍外）

- 不讓 WebView 直接打 TXT runtime HTTP API
- 不在 `editing` 模式送出模擬 pressed state
- 不為每次 drag / rename 都單獨開一個 postMessage；這些變更統一透過 `saveWorkspace` 持久化
