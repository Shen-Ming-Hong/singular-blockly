# io_server.py HTTP API 合約

**版本**：v1（第一版，TXT Controller 支援）  
**服務**：`txt-runtime/io_server.py`  
**執行環境**：fischertechnik TXT Controller（ftCommunity 韌體，Python 3.6+）  
**監聽位址**：`0.0.0.0:8080`（預設 port，可由命令列參數覆蓋）

---

## 啟動方式

```bash
# 直接執行（前景）
python3 io_server.py

# 背景執行（由 Extension 安裝命令使用）
python3 io_server.py &
```

---

## 端點規格

### GET /io

回傳 TXT 目前完整 I/O 狀態快照。

**請求**：無 Body

**回應（200 OK）**：

```json
{
  "motors": [0, 0, 0, 0],
  "outputs": [false, false, false, false, false, false, false, false],
  "inputs": [1, 1, 0, 1, 1, 1, 1, 1],
  "timestamp": 1714742400000
}
```

| 欄位 | 型別 | 說明 |
|------|------|------|
| `motors` | number[4] | M1-M4 目前速度（-512~512），index 0=M1 |
| `outputs` | boolean[8] | O1-O8 目前狀態，index 0=O1，true=開 |
| `inputs` | number[8] | I1-I8 讀值，index 0=I1，0=接地，1=開路 |
| `timestamp` | number | Unix 毫秒時間戳 |

**錯誤（503 Service Unavailable）**：ftrobopy 連線失敗時回傳：

```json
{ "error": "ftrobopy connection failed" }
```

---

### POST /motor

設定指定馬達速度。

**請求 Body（application/json）**：

```json
{ "motor": 1, "speed": 300 }
```

| 欄位 | 型別 | 合法值 | 說明 |
|------|------|--------|------|
| `motor` | integer | 1-4 | 馬達編號（對應 M1-M4） |
| `speed` | integer | -512~512 | 速度；正值正轉，負值反轉，0 停止 |

**回應（200 OK）**：

```json
{ "ok": true }
```

**錯誤（400 Bad Request）**：欄位缺失或超出範圍：

```json
{ "error": "invalid motor or speed value" }
```

---

### POST /output

設定指定輸出狀態。

**請求 Body（application/json）**：

```json
{ "output": 3, "level": 512 }
```

| 欄位 | 型別 | 合法值 | 說明 |
|------|------|--------|------|
| `output` | integer | 1-8 | 輸出編號（對應 O1-O8） |
| `level` | integer | 0 或 512 | 0=關閉，512=最大輸出 |

**回應（200 OK）**：

```json
{ "ok": true }
```

**錯誤（400 Bad Request）**：

```json
{ "error": "invalid output or level value" }
```

---

### POST /stop_all

立即停止所有馬達（M1-M4 speed=0）並關閉所有輸出（O1-O8 level=0）。

**請求**：無 Body（或空 JSON `{}`）

**回應（200 OK）**：

```json
{ "ok": true, "stopped": { "motors": 4, "outputs": 8 } }
```

---

## 錯誤處理約定

| HTTP 狀態碼 | 情境 |
|------------|------|
| 200 OK | 操作成功 |
| 400 Bad Request | 請求 Body 欄位錯誤或值超出範圍 |
| 404 Not Found | 不存在的端點（預設 http.server 行為） |
| 503 Service Unavailable | ftrobopy 連線失敗（TXT 硬體通訊問題） |

---

## 跨來源請求（CORS）

`io_server.py` 需加入 CORS 標頭，以允許 VS Code WebView 直接發送 fetch 請求：

```
Access-Control-Allow-Origin: *
Content-Type: application/json
```
