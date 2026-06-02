# Phase 1 資料模型：CyberBrick WiFi Monitor + OTA Agent 自動升級

**對應計畫**: [plan.md](./plan.md)
**版本**: 1.0.0

## 實體定義

### 1. PairedCyberBrickDevice（既有，語意擴充）

**位置**: `src/types/cyberbrickUpload.ts`
**狀態**: 介面定義不變；`agentVersion?` 欄位已存在，本 spec 新增語意說明

```typescript
interface PairedCyberBrickDevice {
    deviceId: string;                    // UUID，裝置唯一識別碼
    friendlyName: string;                // 使用者友善名稱（如 "My CyberBrick"）
    createdAt: string;                   // ISO 8601，首次配對時間
    updatedAt: string;                   // ISO 8601，最後更新時間
    otaPort: number;                     // OTA HTTP 伺服器埠（預設 8266）
    protocolVersion: 1 | 2;             // OTA 通訊協定版本
    lastKnownIp?: string;               // 最後已知 IP（DHCP 可能改變）
    lastSeenAt?: string;                // ISO 8601，最後成功連線時間
    lastSuccessfulUploadAt?: string;    // ISO 8601，最後成功上傳時間
    statusSummary?: string;             // 'ready' | 'offline' | 'unknown'
    agentVersion?: string;              // ★ semver 格式（如 "1.5.8"）
                                        //   undefined = 未知（視為 "0.0.0"）
}
```

**agentVersion 語意**：

| `agentVersion` 值 | 行為 |
|---|---|
| `undefined` / 格式非法 | 視為 `"0.0.0"` → FR-009 降級（提示重配對）|
| `< "1.4.0"` | 不支援 WiFi Monitor；OTA 上傳不阻擋但顯示重配對提示（FR-008）|
| `≥ "1.4.0"` 且 `< TARGET` | 支援無線升級 → 先升級再上傳（FR-005）|
| `= CYBERBRICK_OTA_AGENT_TARGET_VERSION` | 已是最新 → 跳過升級（FR-004）|
| `> TARGET` | 未來版本 → 跳過升級（不降版）|

> 補充：WiFi Monitor 啟動時是否可自動 reset 並等待 `Device ready.`，另受 `AGENT_RESET_MIN_VERSION = "1.5.0"` 控制；1.4.x 仍可用 WiFi Monitor，但屬於 legacy log polling 模式。

**更新時機**：每次 `GET /api/v1/health` 成功後，更新 `PairedCyberBrickDevice.agentVersion` 並持久化到 workspace state。

---

### 2. OtaToken（既有，無變更）

**位置**: VS Code `secretStorage`
**鍵值格式**: `singular-blockly.cyberbrick.{deviceId}.otaToken`
**型別**: `string`（Bearer token，64 字元 hex）
**安全要求**: 絕不記錄至 log 或顯示於 UI（含 agent 升級 body 中的嵌入值）

---

### 3. AgentVersion（新增，值類型）

**位置**: `src/services/cyberbrickOtaUploader.ts`（模組級常數 + 純函式）

```typescript
// 常數定義
export const CYBERBRICK_OTA_AGENT_TARGET_VERSION = '1.5.8';
// 支援無線自我升級的最低版本
export const CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION = '1.4.0';

// 版本比較純函式（詳見 research.md 項目四）
export function parseAgentVersion(version: string | undefined): [number, number, number];
export function compareAgentVersion(a: string | undefined, b: string): number;
```

**版本決策矩陣**：

```
agentVersion 值       compareAgentVersion(v, MIN)   compareAgentVersion(v, TARGET)   行為
─────────────────     ───────────────────────────   ──────────────────────────────   ─────
undefined / "dev"          < 0                              < 0                       FR-008：提示重配對
"1.3.0"                    < 0                              < 0                       FR-008：提示重配對
"1.3.0"                    < 0                              < 0                       FR-008：提示重配對
"1.4.0"                    >= 0                             < 0                       FR-005：自動無線升級到 1.5.8
"1.5.8"（= TARGET）       >= 0                             = 0                       FR-004：跳過升級（目前最新）
"1.5.9"（> TARGET）       >= 0                             > 0                       跳過升級（不降版）
```

> ⚠️ **版本策略說明**：目前 `TARGET = '1.5.8'`、`MIN = '1.4.0'`，因此 1.4.x～1.5.7 裝置都會走 FR-005 自動升級路徑。另於 `cyberbrickWifiMonitorService.ts` 定義 `AGENT_RESET_MIN_VERSION = '1.5.0'`，用來判斷 WiFi Monitor 啟動時是否可自動 reset 並等待 reboot signal。

---

### 4. LogEntry（新增）

**位置**: 裝置端 MicroPython `_LogCapture._buf` + Extension Host 輪詢記憶體

```typescript
// Extension Host 側型別
interface LogEntry {
    seq: number;    // 單調遞增序號（本次 agent 生命週期內唯一，重啟後重置為 0）
    text: string;   // print() 原始輸出字串（含原始換行符號 "\n"）
}

// API 回應型別
interface LogsResponse {
    entries: LogEntry[];
    next_seq: number;   // 下次輪詢應使用的 since 值
}
```

**Extension Host 輪詢狀態**：

```typescript
// CyberBrickWifiMonitorService 內部狀態（私有）
interface PollingState {
    lastSeq: number;        // 上次輪詢取得的 next_seq（初始值 = Monitor 啟動時的 next_seq）
    retryCount: number;     // 當前連續失敗次數（上限 5，FR-003）
    isRunning: boolean;     // 是否正在輪詢
}
```

**約束**：
- `seq` 為裝置本地計數器，agent 重啟後從 0 開始；Extension Host 偵測到 `next_seq < lastSeq` 時重置 `lastSeq = 0`
- `text` 長度無限制，Extension Host 直接以 `writeEmitter.fire(text.replace(/\n/g, '\r\n'))` 輸出
- 裝置端最多緩衝 500 筆，超過時捨棄最舊項目

---

### 5. WifiMonitorState（新增）

**位置**: `src/services/cyberbrickWifiMonitorService.ts`（介面 + 內部狀態）

```typescript
export type WifiMonitorStopReason =
    | 'user_closed'        // 使用者直接關閉 Terminal（FR-002a）
    | 'connection_failed'; // 重試 5 次後仍失敗（FR-003）

export interface WifiMonitorStartResult {
    success: boolean;
    error?: {
        code:
            | 'AGENT_VERSION_TOO_OLD'   // agentVersion < MIN_VERSION（FR-001）
            | 'DEVICE_NOT_FOUND'        // lastKnownIp 無效或裝置離線
            | 'CONNECTION_FAILED';      // health check 失敗
        message: string;
    };
}
```

**服務介面**：

```typescript
export interface ICyberBrickWifiMonitorService {
    start(device: PairedCyberBrickDevice, token: string): Promise<WifiMonitorStartResult>;
    stop(): Promise<void>;
    isRunning(): boolean;
    onStopped(callback: (reason: WifiMonitorStopReason) => void): void;
}
```

**狀態轉換圖**：

```
          start()
[idle] ──────────────→ [polling]
  ↑                        │
  │   stop() /             │  連線失敗 5×
  │   Terminal 關閉        │  (FR-003)
  └────────────────────────┘
         WifiMonitorStopReason 回報給 messageHandler.ts
```

---

## 新增 CyberBrickUploadProgressStage 值

**位置**: `src/types/cyberbrickUpload.ts`

在現有 `CyberBrickUploadProgressStage` union 中新增：

```typescript
// 既有值（不變）：'preparing' | 'checking_settings' | 'checking_readiness' |
//               'connecting' | 'uploading' | 'verifying' | 'completed' | 'failed'

// 新增值：
| 'upgrading_agent'      // 正在無線升級 OTA agent（FR-006）
| 'agent_upgraded'       // agent 升級完成，繼續上傳（FR-007）
| 'agent_upgrade_needed' // agent 過舊，提示重配對（FR-008；非失敗狀態）
```

---

## 新增 CyberBrickUploadErrorCode 值

**位置**: `src/types/cyberbrickUpload.ts`

在現有 `CyberBrickUploadErrorCode` union 中新增：

```typescript
| 'agent-upgrade-failed'  // agent 無線升級失敗（FR-007a：不阻擋後續上傳）
| 'wifi-monitor-failed'   // WiFi Monitor 連線失敗（重試超限）
```

---

## 新增 i18n Keys（15 語系）

**位置**: `media/locales/{語系}/messages.js`（15 個語系檔案）

| Key | 用途 | 英文範例值 |
|-----|------|-----------|
| `WIFI_MONITOR_CONNECTED` | WiFi Monitor 連線成功提示 | `'WiFi Monitor connected to {0}'` |
| `WIFI_MONITOR_CONNECTING` | WiFi Monitor 連線中提示 | `'WiFi Monitor connecting...'` |
| `WIFI_MONITOR_DISCONNECTED` | WiFi Monitor 已斷線提示 | `'WiFi Monitor disconnected'` |
| `WIFI_MONITOR_ERROR` | WiFi Monitor 連線錯誤 | `'WiFi Monitor connection failed after {0} retries'` |
| `WIFI_MONITOR_RETRY` | 重試提示（含次數） | `'WiFi Monitor reconnecting... ({0}/{1})'` |
| `WIFI_MONITOR_AGENT_UPGRADE_NEEDED` | Agent 版本過舊（Monitor 無法啟動）| `'WiFi Monitor requires OTA Agent {0}+. Please re-pair your CyberBrick.'` |
| `OTA_AGENT_UPGRADING` | 正在升級 agent | `'Upgrading OTA Agent {0} → {1}...'` |
| `OTA_AGENT_UPGRADED` | Agent 升級完成 | `'OTA Agent upgraded to {0}. Resuming upload...'` |
| `OTA_AGENT_UPGRADE_NEEDED` | OTA 上傳後的重配對提示 | `'OTA Agent {0} is outdated. Re-pair CyberBrick to enable auto-upgrade.'` |

**注意**：`{0}`, `{1}` 為位置參數，與現有 i18n 系統一致。
