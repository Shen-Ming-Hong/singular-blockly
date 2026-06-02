# HTTP API 契約：GET /api/v1/logs

**Endpoint**: `GET /api/v1/logs`
**實作版本**: CyberBrick OTA Agent v1.4.0+（Monitor 啟動時的自動 reset / reboot orchestration 從 v1.5.0+ 開始）
**用途**: WiFi Monitor 輪詢裝置 stdout log，支援序號式斷點續傳（FR-002）

## Request

### Headers（必要）

| Header | 格式 | 說明 |
|--------|------|------|
| `Authorization` | `Bearer {otaToken}` | OTA Token（來自 VS Code secretStorage）|
| `X-CyberBrick-Device-ID` | `{deviceId}` | 裝置識別碼 |
| `X-CyberBrick-Protocol-Version` | `"2"` | OTA 通訊協定版本（固定為 `"2"`）|

### Query Parameters

| 參數 | 型別 | 必要 | 說明 |
|------|------|------|------|
| `since` | `integer ≥ 0` | 否（預設 `0`）| 回傳序號 ≥ `since` 的 log 項目 |

### 範例 Request

```http
GET /api/v1/logs?since=42 HTTP/1.1
Host: 192.168.1.100:8266
Authorization: Bearer abc123def456
X-CyberBrick-Device-ID: cb-device-uuid-001
X-CyberBrick-Protocol-Version: 2
```

## Response

### 成功（200 OK）

> 回應 body 為 JSON；目前裝置端實作**不保證**附帶 `Content-Type: application/json` header，呼叫端應依 endpoint 契約解析 JSON body。

```json
{
  "entries": [
    { "seq": 42, "text": "Hello World\n" },
    { "seq": 43, "text": "Temperature: 25.3\n" }
  ],
  "next_seq": 44
}
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `entries` | `Array<{seq: number, text: string}>` | 序號 ≥ `since` 的 log 項目（可為空陣列）|
| `entries[].seq` | `integer ≥ 0` | 單調遞增序號（本次 agent 生命週期內唯一）|
| `entries[].text` | `string` | print() 原始輸出（含換行符號 `\n`）|
| `next_seq` | `integer ≥ 0` | 下次輪詢應使用的 `since` 值 |

**無新 log 時**（正常，空陣列）：

```json
{ "entries": [], "next_seq": 44 }
```

### 驗證失敗（401 Unauthorized）

```json
{ "error": "auth" }
```

### Agent 版本不支援（404 Not Found）

當 Agent < 1.4.0 時，此 endpoint 不存在，回傳 404、連線拒絕，或根本尚未安裝新版 agent。Extension Host 以此判斷需提示重配對。

## 行為規格

### Monitor 啟動序號取得

Extension Host 會依 agentVersion 分成兩種模式：

1. **reset-capable mode（agentVersion ≥ 1.5.0）**：先以超大值查詢當前 `next_seq`，接著呼叫 `POST /api/v1/reset` 清空 buffer 並等待 reboot signal，之後只顯示 reset 後的新輸出
2. **legacy mode（agentVersion = 1.4.x）**：因為沒有 `/api/v1/reset`，直接從 `since=0` 開始輪詢，顯示目前裝置 boot 週期中仍可取得的輸出

reset-capable mode 的起始 cursor 取得流程：

```
GET /api/v1/logs?since=999999
→ { "entries": [], "next_seq": 42 }
  lastSeq = 42  ← 記錄 reset 前 cursor，後續等待 reboot signal
```

### 輪詢迴圈

1. Extension Host 以輪詢週期發送請求（預設：前一次請求完成後約 500ms 再次輪詢）
2. 回傳空 `entries` 時正常，保持 `lastSeq` 不變
3. 每次請求成功後重置 `retryCount = 0`；失敗則 `retryCount++`

### 重試機制（FR-003）

```
連線失敗 → retryCount++
if retryCount >= 5:
    停止輪詢，顯示錯誤（WIFI_MONITOR_ERROR）
else:
  等待下一輪 poll 週期，更新提示（WIFI_MONITOR_RETRY），繼續輪詢
```

### Agent 重啟處理

Agent 重啟後 `seq` 可能從 0 重置。對於 reset-capable agent，Extension Host 只有在觀察到以下任一 reboot signal 後，才會顯示 `Device ready.` 並切換到新 runtime：

- 實際斷線後恢復
- `next_seq < lastSeq` 的 cursor rollback
- bootstrap marker：`[Singular Blockly] OTA bootstrap ready`

### CRLF 轉換

Extension Host 將 `text` 中的 `\n` 替換為 `\r\n` 再寫入 PTY Terminal（VS Code Terminal 要求 CRLF）。

## MicroPython 裝置端實作

```python
# GET /api/v1/logs?since={seq}
def _handle_logs(client, qs):
    since = int(qs.get('since', '0'))
    entries = _log_capture.get_since(since) if _log_capture else []
    next_seq = _log_capture.next_seq() if _log_capture else 0
    body = _json_encode({'entries': entries, 'next_seq': next_seq})
    _send_json(client, 200, body)
```

## Extension Host 實作（型別定義）

```typescript
// src/services/cyberbrickWifiMonitorService.ts

interface LogEntry { seq: number; text: string; }
interface LogsResponse { entries: LogEntry[]; next_seq: number; }

// reset-capable agent：先取得 reset 前 cursor
const init = await fetchLogs(device, token, 999_999);
let lastSeq = init.next_seq;

// legacy agent（1.4.x）則直接從 since=0 開始
// 輪詢主迴圈（每次請求完成後再等待 500ms）
const { entries, next_seq } = await fetchLogs(device, token, lastSeq);
for (const e of entries) {
    writeEmitter.fire(e.text.replace(/\n/g, '\r\n'));
}
if (next_seq < lastSeq) lastSeq = 0;   // agent 重啟
else lastSeq = next_seq;
```
