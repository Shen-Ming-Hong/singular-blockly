# 開發指引：CyberBrick WiFi Monitor + OTA Agent 自動升級

**對應計畫**: [plan.md](./plan.md)

## 前置條件

- Node.js 22.16.0+（`node --version`）
- VS Code Insiders（推薦）或 VS Code 1.105.0+
- 至少一台已完成 OTA 配對的 CyberBrick 裝置（spec-059 流程）
- 裝置與開發機在同一 WiFi 網路

## 快速開始

### 1. 安裝依賴並建置

```bash
cd /Users/user/Documents/singular-blockly
npm install
npm run compile
```

### 2. 啟動除錯模式

1. 在 VS Code 按 `F5` 啟動 Extension Development Host
2. 在新開啟的 VS Code 視窗，確認工作區含 `blockly/main.json`
3. 設定 Board 為 `CyberBrick`

### 3. 確認裝置 Health Endpoint

```bash
# 取代 <device-ip>、<token>、<deviceId>
curl -s \
  -H "Authorization: Bearer <token>" \
  -H "X-CyberBrick-Device-ID: <deviceId>" \
  -H "X-CyberBrick-Protocol-Version: 2" \
  http://<device-ip>:8266/api/v1/health | python3 -m json.tool

# 預期含有：
# { "status": "ready", "agentVersion": "1.5.8", ... }
```

---

## 測試情境

### 情境 A：WiFi Monitor 正常流程（FR-001 ~ FR-003）

**前置**：裝置安裝 Agent 1.5.8（或任何 `agentVersion >= 1.5.0`），以驗證 reset-capable 的 Monitor 啟動流程

1. 在 Blockly 編輯器按 **Monitor** 按鈕
2. **預期**：WebView 立即顯示「WiFi 監控連線中…」提示；VS Code 開啟「CyberBrick WiFi Monitor」Terminal，顯示連線成功訊息與 `Resetting device...`
3. **預期**：裝置重啟完成後，Terminal 顯示 `Device ready.`；在 CyberBrick 執行含 `print("Hello")` 的程式，觀察 Terminal 即時輸出
4. 再次按 **Monitor** 按鈕
5. **預期**：Terminal 關閉，按鈕狀態重設
6. 直接關閉 Terminal 面板（不按按鈕）
7. **預期**：按鈕狀態自動重設（FR-002a）

> 補充：若裝置仍是 1.4.x legacy agent，WiFi Monitor 可使用，但不會自動 `reset` 重跑程式；Terminal 也可能顯示目前裝置 boot 週期中既有的 log。

### 情境 B：WiFi Monitor 斷線重試（FR-003）

**模擬斷線**：在 Monitor 運行中，暫時關閉裝置 WiFi AP 或 5 秒後重開

1. 觀察 Terminal 顯示重試提示（`WIFI_MONITOR_RETRY`）
2. 重試 5 次失敗後顯示錯誤（`WIFI_MONITOR_ERROR`）
3. 按鈕狀態自動重設

### 情境 C：OTA Agent 自動升級（FR-004 ~ FR-007）

**準備**：使用一台 `agentVersion` 位於 `1.4.0 ~ 1.5.6` 的裝置，或暫時修改常數模擬「裝置落後」場景

```typescript
// src/types/cyberbrickUpload.ts（測試用，完成後還原）
export const CYBERBRICK_OTA_AGENT_TARGET_VERSION = '1.5.9';
```

1. 執行 OTA 上傳
2. **預期**：進度提示出現「正在更新 OTA Agent {目前版本} → 1.5.8...」
3. 裝置重啟（約 5-10s），進度繼續
4. **預期**：「Agent 更新完成，繼續上傳...」後正常完成上傳
5. 還原 `CYBERBRICK_OTA_AGENT_TARGET_VERSION = '1.5.8'`

### 情境 D：Agent 升級失敗仍繼續上傳（FR-007a）

**模擬**：讓 `waitForAgentReady` 逾時（修改 timeout 為 1ms）

1. 執行 OTA 上傳
2. **預期**：顯示升級失敗警告
3. **預期**：繼續執行程式碼上傳（不中止）
4. **預期**：上傳成功

### 情境 E：舊版 Agent 降級提示（FR-008）

**前置**：裝置安裝 Agent 1.3.0（`agentVersion` = `"1.3.0"`，或未回傳此欄位）

1. 執行 OTA 上傳
2. **預期**：上傳成功（不阻擋）
3. **預期**：顯示「Agent 版本過舊，請重新配對」提示（`OTA_AGENT_UPGRADE_NEEDED`）
4. 按 **Monitor** 按鈕
5. **預期**：顯示「需要更新 OTA Agent 才能使用 WiFi Monitor」提示，Monitor 不啟動

### 情境 F：多裝置選擇（FR-001）

**前置**：配對 2 台以上 CyberBrick 裝置

1. 按 **Monitor** 按鈕
2. **預期**：顯示 spec-059 裝置選取清單
3. 選擇目標裝置後進入 WiFi Monitor 模式

### 情境 G：無 OTA 裝置（SC-006 零退化）

**前置**：未配對任何 OTA 裝置，只有 USB 連線

1. 按 **Monitor** 按鈕
2. **預期**：使用 USB serial monitor（與舊版行為完全相同）

---

## 手動測試新 Endpoints

### GET /api/v1/logs

```bash
# 取得所有 log（從頭開始）
curl -s \
  -H "Authorization: Bearer <token>" \
  -H "X-CyberBrick-Device-ID: <deviceId>" \
  -H "X-CyberBrick-Protocol-Version: 2" \
  "http://<device-ip>:8266/api/v1/logs?since=0"

# 預期：
# {"entries":[{"seq":0,"text":"Hello\n"},{"seq":1,"text":"World\n"}],"next_seq":2}

# 取得啟動序號（超大值）
curl -s ... "http://<device-ip>:8266/api/v1/logs?since=999999"
# 預期：{"entries":[],"next_seq":<current>}
```

### POST /api/v1/upload-agent

```bash
# 先計算 body SHA-256
AGENT_SHA=$(shasum -a 256 /path/to/cyberbrick_ota_agent.py | awk '{print $1}')

# 上傳新版 agent（body 含 credentials，勿在生產環境執行）
curl -s -X POST \
  -H "Authorization: Bearer <token>" \
  -H "X-CyberBrick-Device-ID: <deviceId>" \
  -H "X-CyberBrick-Protocol-Version: 2" \
  -H "Content-Type: text/plain" \
  -H "X-Singular-Content-Sha256: ${AGENT_SHA}" \
  --data-binary @/path/to/cyberbrick_ota_agent.py \
  http://<device-ip>:8266/api/v1/upload-agent

# 預期：{"contentSha256":"..."}
# 成功回應後裝置會在連線關閉後安排重啟，不一定在 response body 中附帶 restarting / bytesWritten 欄位
```

### POST /api/v1/reset

```bash
curl -s -X POST \
  -H "Authorization: Bearer <token>" \
  -H "X-CyberBrick-Device-ID: <deviceId>" \
  -H "X-CyberBrick-Protocol-Version: 2" \
  http://<device-ip>:8266/api/v1/reset

# 預期：{"restarting":true}
# 僅 agentVersion >= 1.5.0 的裝置支援；舊版 agent 會是 404，應回退為 legacy WiFi Monitor 模式
```

---

## 執行單元測試

```bash
# 全部測試
npm test

# 帶覆蓋率
npm run test:coverage

# 快速驗證（第一個失敗就停止）
npm run test:bail
```

在 `src/test/suite/cyberbrickWifiMonitorService.test.ts` 中可用 `.only` 聚焦特定測試：

```typescript
// 暫時只執行這個 suite
describe.only('CyberBrickWifiMonitorService', () => { ... });
```

---

## i18n 驗證

```bash
# 確認 15 語系全部包含新增的 9 個 key
npm run validate:i18n
```

確認以下 key 在所有語系都有值：
- `WIFI_MONITOR_CONNECTED`
- `WIFI_MONITOR_CONNECTING`
- `WIFI_MONITOR_DISCONNECTED`
- `WIFI_MONITOR_ERROR`
- `WIFI_MONITOR_RETRY`
- `WIFI_MONITOR_AGENT_UPGRADE_NEEDED`
- `OTA_AGENT_UPGRADING`
- `OTA_AGENT_UPGRADED`
- `OTA_AGENT_UPGRADE_NEEDED`

---

## 常見問題

| 問題 | 排查步驟 |
|------|----------|
| Monitor 按鈕未顯示 WiFi 模式 | 確認 health endpoint 回傳 `agentVersion >= "1.4.0"` |
| Terminal 開啟後無輸出 | 確認裝置程式有 `print()` 且 agent 安裝了 `_LogCapture` |
| 關閉 Terminal 後按鈕未重設 | 確認 `pty.close()` 回呼有觸發 stop callback |
| `WiFi Monitor connected ...` 到 `Device ready.` 之間等待很久 | 對 `agentVersion >= 1.5.0` 的裝置，這段時間在等待 `/api/v1/reset` 後的裝置 reboot / Wi‑Fi reconnect / agent restart；如需詳細原因，開啟 `singularBlockly.cyberbrick.monitorDebugOutput` |
| 升級失敗後上傳中止 | 確認 `upgradeAgentOverWifi` 失敗時仍 `return 'failed'` 而非 throw |
| `validate:i18n` 報錯 | 確認 15 個語系檔案都已加入新 key |
| 測試中計時器未清除 | 確認 `afterEach()` 呼叫 `sinon.restore()` 並 `service.stop()` |
