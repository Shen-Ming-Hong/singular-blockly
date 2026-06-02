# HTTP API 契約：POST /api/v1/reset

**Endpoint**: `POST /api/v1/reset`
**實作版本**: CyberBrick OTA Agent v1.5.0+
**用途**: WiFi Monitor 啟動時要求裝置清空既有 log、重新執行 `rc_main.py`，讓 Terminal 對齊本次執行的新輸出

## Request

### Headers（必要）

| Header | 格式 | 說明 |
|--------|------|------|
| `Authorization` | `Bearer {otaToken}` | OTA Token（來自 VS Code secretStorage）|
| `X-CyberBrick-Device-ID` | `{deviceId}` | 裝置識別碼 |
| `X-CyberBrick-Protocol-Version` | `"2"` | OTA 通訊協定版本（固定為 `"2"`）|

### 範例 Request

```http
POST /api/v1/reset HTTP/1.1
Host: 192.168.1.100:8266
Authorization: Bearer abc123def456
X-CyberBrick-Device-ID: cb-device-uuid-001
X-CyberBrick-Protocol-Version: 2
```

## Response

### 成功（200 OK）

> 回應 body 為 JSON；目前裝置端實作**不保證**附帶 `Content-Type: application/json` header。

```json
{ "restarting": true }
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `restarting` | `true` | 裝置已接受 reset 指令，request 完成後會安排重啟 |

### 驗證失敗（401 Unauthorized）

```json
{ "error": "auth" }
```

### Agent 版本不支援（404 Not Found）

當 Agent < 1.5.0 時，此 endpoint 不存在。Extension Host 應回退為 legacy WiFi Monitor 模式，不可將此情況視為致命錯誤。

## 行為規格

### 裝置端 reset 流程

1. 驗證 Authorization / Device ID / Protocol Version
2. 清空 log buffer 與 cursor 狀態
3. 回傳 `{ "restarting": true }`
4. 將 reboot flag 標記為待處理
5. request 完成後短暫等待（約 200ms）再呼叫 `machine.reset()`

### Extension Host 啟動流程

1. 先以 `GET /api/v1/logs?since=999999` 取得 reset 前 cursor
2. 呼叫 `POST /api/v1/reset`
3. 啟動 `/api/v1/logs` 輪詢
4. 觀察任一 reboot signal 後，才顯示 `Device ready.`：
   - 實際斷線後恢復
   - `next_seq` 回退（cursor rollback）
   - bootstrap marker：`[Singular Blockly] OTA bootstrap ready`

## MicroPython 裝置端實作

```python
# POST /api/v1/reset
def _handle_reset(client):
    log_buffer.clear()
    next_seq[0] = 0
    reboot_pending[0] = True
    return _send_json(client, 200, {'restarting': True})
```

## Extension Host 實作（偽程式碼）

```typescript
const init = await fetchLogs(device, token, 999_999);
const resetCursorBeforeReset = init.next_seq;

await sendReset(device, token);
startPolling(device, token, resetCursorBeforeReset);

// poll loop
if (next_seq < resetCursorBeforeReset || sawBootstrapMarker || sawDisconnectThenReconnect) {
	writeEmitter.fire('Device ready.\r\n');
}
```
