# TXT 虛擬控制 Companion Runtime API 合約

**版本**：v1  
**服務位置**：`txt-runtime/virtual_controls_runtime.py`（新）  
**主要消費者**：Extension Host（不是 WebView 直接呼叫）

---

## 合約目標

本 runtime 專門支援 **Program Mode 的虛擬控制輸入**，與 `io_server.py` 的 Test Panel 用途分離。

其責任只有三件事：

1. 建立 / 重設虛擬控制 session
2. 接收最新按鈕狀態 snapshot
3. 維護 TXT 本機的 canonical state file，供 generated Python helper 讀取

---

## 連線與埠號策略

### 監聽埠

companion runtime 使用：

```text
virtualControlPort = runtimePort + 1
```

若既有 `runtimePort` 為 `8080`，則 companion runtime 預設使用 `8081`。

### 理由

- 不需要新增一個使用者可編輯的設定欄位
- 可以清楚與 `io_server.py` 分離
- 由 Extension Host 根據現有 TXT 設定推導即可

---

## Canonical State File

### 檔案位置

```text
/tmp/singular_blockly/virtual_controls_state.json
```

### JSON 形狀

```json
{
  "sessionId": "session-uuid",
  "updatedAt": 1710000000000,
  "controls": {
    "btn-001": {
      "identifier": "start_button",
      "pressed": false
    },
    "btn-002": {
      "identifier": "stop_button",
      "pressed": true
    }
  }
}
```

### 規則

- 以 `stableId` 為 key
- `pressed` 只反映目前執行 session 的狀態
- session 結束時必須重設或移除狀態檔

---

## HTTP 端點

### 1. `GET /health`

確認 runtime 是否已啟動。

**回應（200 OK）**：

```json
{
  "ok": true,
  "sessionId": "session-uuid",
  "updatedAt": 1710000000000
}
```

若尚未建立 session，也應回傳 `ok: true`，但 `sessionId` 可為 `null`。

---

### 2. `PUT /session`

建立或覆蓋目前虛擬控制 session，並將所有按鈕狀態初始化為未按下。

**請求 Body**：

```json
{
  "sessionId": "session-uuid",
  "controls": [
    { "stableId": "btn-001", "identifier": "start_button" },
    { "stableId": "btn-002", "identifier": "stop_button" }
  ]
}
```

**回應（200 OK）**：

```json
{
  "ok": true,
  "sessionId": "session-uuid",
  "controlCount": 2
}
```

### 規則

- 同一時間只維護一個 active session
- 新 session 建立時，必須把所有 `pressed` 初始化為 `false`
- Companion runtime 建立 session 後，應同步寫出 canonical state file

---

### 3. `POST /snapshot`

以完整 snapshot 更新所有按鈕目前狀態。

**請求 Body**：

```json
{
  "sessionId": "session-uuid",
  "controls": [
    { "stableId": "btn-001", "pressed": true },
    { "stableId": "btn-002", "pressed": false }
  ]
}
```

**回應（200 OK）**：

```json
{
  "ok": true,
  "updatedAt": 1710000000000
}
```

### 規則

- 只接受目前 active `sessionId`
- 同步更新記憶體狀態與 canonical state file
- 第一版採 full snapshot，而不是 delta patch，讓狀態可自我修復

---

### 4. `DELETE /session`

結束目前 session 並清空狀態。

**回應（200 OK）**：

```json
{
  "ok": true
}
```

### 規則

- 應將所有 `pressed` 重設為 `false`
- 可選擇刪除 state file，或寫回空 session 狀態；但不得殘留上一輪按下狀態

---

## 錯誤處理約定

| HTTP 狀態 | 情境 |
|-----------|------|
| 200 | 操作成功 |
| 400 | Body 缺欄位、格式錯誤、非法 `stableId` |
| 409 | `sessionId` 與 active session 不符 |
| 500 | runtime 內部錯誤（檔案寫入、JSON 編碼、未預期例外） |

---

## Generated Python Helper Contract

使用者程式不直接操作 runtime HTTP；它透過 generator 注入 helper 函式讀取 canonical state file。

### 建議 helper 介面

```python
def _txt_virtual_button_state(stable_id) -> int:
    ...
```

### 行為規則

- 回傳 `1`（按下）或 `0`（未按下）
- 若 state file 不存在、session 尚未建立、`stableId` 不存在或 JSON 損壞，安全回傳 `0`
- helper 可以做 mtime / interval cache，避免 tight loop 每次都完整重讀 JSON

---

## Lifecycle 整合規則

### 啟動執行前

1. Extension Host 啟動 companion runtime（若尚未啟動）
2. Host 呼叫 `PUT /session`
3. Host 成功後才允許進入 TXT user program 執行

### 執行期間

1. WebView `txtVirtualControlStateChanged`
2. Host 整理成 full snapshot
3. Host 呼叫 `POST /snapshot`
4. Companion runtime 更新 state file
5. Generated helper 讀取最新狀態

### 停止或失敗時

1. Host 呼叫 `DELETE /session`
2. WebView 切回 `editing` 模式
3. 所有按鈕視覺 pressed state 清空

---

## 不做的事（v1 範圍外）

- 不讓 WebView 直接打 companion runtime HTTP
- 不支援多個並行 runtime session
- 不處理除 `button` 以外的其他控制元件型別
- 不把這個 runtime 與 `io_server.py` 合併成單一服務
