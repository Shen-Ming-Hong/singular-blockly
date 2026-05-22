# TXT 預覽虛擬控制畫布 PostMessage 合約

**版本**：v1  
**範圍**：`src/webview/webviewManager.ts` ↔ `media/js/blocklyPreview.js`

---

## 合約目標

本文件定義 TXT backup preview 為了顯示**唯讀虛擬控制畫布**而新增或擴充的訊息契約。

此合約延伸既有 preview 流程，不建立新的保存或執行通道。

---

## Extension Host → Preview WebView

### 1. `setBoard`（擴充）

```json
{
  "command": "setBoard",
  "board": "txt",
  "originalBoard": "txt"
}
```

#### 規則

- `board` 必須新增支援 `txt`。
- `setBoard` 必須先於 `loadWorkspaceState` 發送。
- 若 backup 中 board 無法識別，仍可走既有 fallback；但本 feature 的 TXT 分支只在 `board === 'txt'` 時啟用虛擬控制畫布。

---

### 2. `loadWorkspaceState`（擴充）

```json
{
  "command": "loadWorkspaceState",
  "workspaceState": {},
  "txtVirtualControls": {
    "schemaVersion": 1,
    "canvas": { "mode": "editing" },
    "controls": []
  },
  "previewWarnings": [
    {
      "code": "empty-controls",
      "severity": "info",
      "scope": "canvas"
    }
  ]
}
```

#### 規則

- `workspaceState` 保持既有 Blockly serialization 格式。
- `txtVirtualControls` 僅在 TXT preview 時傳送；缺失時 preview 需以空狀態降級。
- `previewWarnings` 為結構化資料，供 preview 自行依目前語言顯示訊息。
- `previewWarnings` 不可阻止 preview 顯示；它們只負責揭露狀態。

#### v1 warning codes

| Code | Severity | Scope | 用途 |
|------|----------|-------|------|
| `legacy-missing-document` | `info` | `canvas` | 舊備份缺少 `txtVirtualControls` 根文件 |
| `empty-controls` | `info` | `canvas` | TXT 虛擬控制文件存在但沒有任何控制項 |
| `invalid-control-shape` | `warning` | `control` | 部分控制項資料不完整，已以安全預設值恢復可顯示內容 |
| `missing-control-reference` | `warning` | `control` | Blockly 積木參照了備份中不存在的虛擬控制 stableId |

---

### 3. `updateTheme`（沿用）

```json
{
  "command": "updateTheme",
  "theme": "dark"
}
```

#### 規則

- 除既有 Blockly preview 主題外，TXT 虛擬控制畫布也必須同步套用 preview 主題樣式。

---

### 4. `updateLanguage`（沿用）

```json
{
  "command": "updateLanguage",
  "languagePreference": "zh-hant",
  "resolvedLanguage": "zh-hant"
}
```

#### 規則

- Preview 收到後，必須同步更新：
  - 預覽 badge
  - 空狀態訊息
  - warning 文案
  - 任何 preview-only 的輔助標籤
- 使用者儲存的 `displayName` 不做翻譯，只更新系統文案。

---

### 5. `loadError`（沿用）

```json
{
  "command": "loadError",
  "error": "載入備份內容失敗"
}
```

#### 規則

- 收到 `loadError` 時，preview 可顯示錯誤狀態，但不應因 TXT 虛擬控制畫布的失敗而讓整個 WebView 崩潰。

---

## Preview WebView → Extension Host

### 1. `loadBackupData`（沿用）

```json
{
  "command": "loadBackupData",
  "fileName": "backup.json"
}
```

#### 規則

- Preview 啟動後仍沿用既有方式要求 Host 載入備份。

---

### 2. `themeChanged`（沿用）

```json
{
  "command": "themeChanged",
  "theme": "light"
}
```

#### 規則

- 只同步 theme 設定。
- 不得夾帶任何 `txtVirtualControls` 改動。

---

## Preview 明確禁止送出的訊息

在 TXT preview 中，下列訊息都屬於**不合法**：

- `saveWorkspace`
- `txtUpload`
- `txtVirtualControlStateChanged`
- 任意新增、刪除、改名、改色的保存訊息

### 原因

- Preview 是唯讀投影，不是執行或編輯入口。
- 任何這類訊息一旦在 preview 出現，都代表 readonly guard 有漏洞。

---

## 狀態一致性規則

1. `setBoard` 必須先於 `loadWorkspaceState`。
2. `board === 'txt'` 時，preview 應同時準備 Blockly 與虛擬控制畫布兩個視覺區域。
3. `txtVirtualControls` 缺失時，必須保留面板並顯示空狀態訊息。
4. `previewWarnings` 只影響呈現，不可阻止預覽顯示。
5. theme / language 更新不得改動任何 backup 內容。
6. Host 端收到 `saveWorkspace`、`txtUpload`、`txtVirtualControlStateChanged` 等 preview 禁止訊息時，必須保持無作用，避免錯誤觸發保存或 runtime 流程。

---

## 不做的事（v1 範圍外）

- 不新增 preview 專屬的保存 API
- 不讓 preview 直接存取 TXT runtime
- 不在 preview 中同步任何按壓狀態或執行狀態
- 不讓 preview 端自行重新解析 backup 檔案
