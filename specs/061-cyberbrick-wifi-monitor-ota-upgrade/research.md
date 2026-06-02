# Phase 0 研究報告：CyberBrick WiFi Monitor + OTA Agent 自動升級

**對應計畫**: [plan.md](./plan.md)
**研究日期**: 2026-05-30

## 研究項目一：VS Code PTY Terminal API

### 問題

WiFi Monitor 需要一個可程式化寫入輸出的 VS Code Terminal，且能偵測 Terminal 被使用者關閉（FR-002a）。

### 研究發現

VS Code 1.105.0+ 提供 `vscode.Pseudoterminal` 介面，透過 `vscode.window.createTerminal({ pty })` 建立 PTY Terminal：

```typescript
const writeEmitter = new vscode.EventEmitter<string>();
const pty: vscode.Pseudoterminal = {
    onDidWrite: writeEmitter.event,   // 寫入 Terminal 輸出的事件
    open: (initialDimensions) => {    // Terminal 開啟時呼叫（開始輪詢）
        startPolling();
    },
    close: () => {                    // Terminal 被關閉時呼叫（使用者直接關閉面板）
        stopPolling('user_closed');   // 觸發 FR-002a 清理
    },
    handleInput: (data) => { },       // 使用者輸入（唯讀監控不需要）
};
const terminal = vscode.window.createTerminal({
    name: 'CyberBrick WiFi Monitor',
    pty,
});
terminal.show();

// 寫入輸出（必須使用 CRLF）
writeEmitter.fire('Connected to CyberBrick\r\n');
```

**關鍵確認**：
- `pty.close()` 在使用者直接關閉 Terminal 面板時自動觸發，**不需要**額外監聽 `vscode.window.onDidCloseTerminal`
- 輸出必須使用 `\r\n`（CRLF）；單獨 `\n` 在部分平台不換行
- `writeEmitter.fire()` 支援 ANSI escape codes（可用於顏色輸出，如連線狀態提示）
- Terminal dispose 後若未停止 `setInterval`，輪詢仍會繼續執行（記憶體洩漏）
- `open()` 被呼叫時 Terminal 已顯示，可立即開始輪詢

**決策**：採用 `vscode.Pseudoterminal` + `EventEmitter<string>`，在 `close()` 回呼中停止輪詢並釋放資源，滿足 FR-002a。

---

## 研究項目二：MicroPython stdout redirect

### 問題

裝置端需要捕捉所有 `print()` 輸出（即 `sys.stdout.write` 呼叫），同時不干擾現有 USB serial 通訊（SC-006）。

### 研究發現

MicroPython 的 `sys.stdout` 是可替換的物件，只需實作 `write(s)` 與 `flush()` 方法。

```python
import sys

class _LogCapture:
    def __init__(self, original):
        self._orig = original     # 保留原始 stdout（USB serial）
        self._buf = []
        self._seq = 0

    def write(self, s):
        self._orig.write(s)       # 保留 USB serial 輸出（SC-006 零退化）
        if s and s.strip():       # 忽略純換行（避免空項目）
            self._buf.append({'seq': self._seq, 'text': s})
            self._seq += 1
            if len(self._buf) > 500:  # 記憶體保護：最多 500 筆
                self._buf.pop(0)

    def flush(self):
        self._orig.flush()

    def get_since(self, since):
        return [e for e in self._buf if e['seq'] >= since]

    def next_seq(self):
        return self._seq


_log_capture = None

def _install_log_capture():
    global _log_capture
    if _log_capture is None:
        _log_capture = _LogCapture(sys.stdout)
        sys.stdout = _log_capture
```

**關鍵確認**：
- `self._orig.write(s)` 確保 USB serial 仍能接收所有輸出（SC-006 零退化）
- MicroPython 無標準 `threading.Lock`；單執行緒 HTTP 伺服器模型下不會有競態問題
- 記憶體保護：最多緩衝 500 筆 log，避免 ESP32 heap 耗盡
- `get_since(since)` 的 list comprehension 在 MicroPython 2.x 上有效
- 在 `_setup_server()` 最早期呼叫 `_install_log_capture()`，確保 agent 啟動後所有 print() 都被捕捉

**決策**：採用 `_LogCapture` 模式，在 OTA agent 初始化時安裝，滿足 FR-002 的序號式輸出需求。

---

## 研究項目三：HTTP 序號式輪詢

### 問題

選擇 Extension Host 輪詢裝置 log 的協定設計，需兼顧 MicroPython 單執行緒伺服器限制與 SC-002（≤ 1s 延遲）效能需求。

### 研究發現

**方案比較**：

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| HTTP long-poll（chunked transfer）| 最低延遲 | MicroPython HTTP 伺服器無法保持長連線 | ❌ 不可行 |
| WebSocket | 雙向、低延遲 | MicroPython `uwebsockets` 不穩定 | ❌ 排除 |
| Server-Sent Events | 單向 stream | 需要持久連線，MicroPython 不支援 | ❌ 排除 |
| HTTP 輪詢 + 序號 | 無狀態、簡單、斷線可重試 | 固定間隔 500ms 約有 250ms 平均延遲 | ✅ **選用** |

**序號設計（避免重複/遺漏）**：

```
# Monitor 啟動
GET /api/v1/logs?since=999999 → { "entries": [], "next_seq": 42 }
# lastSeq = 42（忽略歷史 log，FR-002）

# 輪詢 1（500ms 後）
GET /api/v1/logs?since=42 → { "entries": [{"seq":42,"text":"Hello\n"}], "next_seq": 43 }
# lastSeq = 43

# 輪詢 2（斷線重連場景）
GET /api/v1/logs?since=43 → { "entries": [], "next_seq": 43 }
# 無新 log，保持 lastSeq = 43
```

**關鍵確認**：
- `since` 參數確保斷線重連後不重複顯示已輸出的 log
- `next_seq` 由伺服器回傳，Extension Host 不需自行計算
- 500ms 間隔符合 SC-002（≤ 1s）：平均 250ms 輪詢延遲 + 網路延遲 ≤ 500ms

**決策**：500ms 固定間隔輪詢；Monitor 啟動時先查詢 `next_seq` 作為起點，後續以回傳的 `next_seq` 更新，滿足 FR-002。

---

## 研究項目四：Semver 比較（無外部依賴）

### 問題

需要比較 agent 版本字串（如 `"1.4.0"` vs `"1.3.0"`），TypeScript 5.9.3 環境，不得引入新套件（Principle III）。

### 研究發現

純 TypeScript 實作，使用字串分割與數值比較：

```typescript
/**
 * 解析語意版本字串為數值三元組。
 * 非標準格式（含 undefined）回傳 [0, 0, 0]，視為最舊版本（FR-009）。
 */
export function parseAgentVersion(version: string | undefined): [number, number, number] {
    if (!version) return [0, 0, 0];
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some(n => !Number.isInteger(n) || n < 0 || isNaN(n))) {
        return [0, 0, 0];
    }
    return [parts[0], parts[1], parts[2]];
}

/**
 * 比較兩個 semver 字串。
 * @returns 負數 = a < b；0 = 相等；正數 = a > b
 */
export function compareAgentVersion(a: string | undefined, b: string): number {
    const [aMaj, aMin, aPatch] = parseAgentVersion(a);
    const [bMaj, bMin, bPatch] = parseAgentVersion(b);
    if (aMaj !== bMaj) return aMaj - bMaj;
    if (aMin !== bMin) return aMin - bMin;
    return aPatch - bPatch;
}
```

**使用情境**：

```typescript
const MIN_VERSION = '1.4.0';
const TARGET_VERSION = '1.5.8';

// FR-009：非法版本視為舊版
compareAgentVersion(undefined, MIN_VERSION) < 0  // true → 提示重配對
compareAgentVersion('dev', MIN_VERSION) < 0       // true → 提示重配對

// FR-004：已是最新版，跳過升級
compareAgentVersion('1.5.8', TARGET_VERSION) === 0  // true → 直接上傳

// FR-005：支援無線升級，自動升級
compareAgentVersion('1.4.0', TARGET_VERSION) < 0    // true → 觸發升級到 1.5.8

// FR-008：不支援無線升級
compareAgentVersion('1.3.0', MIN_VERSION) < 0   // true → 提示重配對
```

**決策**：直接實作於 `cyberbrickOtaUploader.ts` 中，不引入任何套件。純函式，100% 可單元測試。

---

## 研究項目五：Agent 重啟偵測

### 問題

Agent 升級後裝置需重啟（約 5-10 秒），需等待裝置就緒才能繼續上傳程式碼（FR-007）；逾時則繼續上傳（FR-007a）。

### 研究發現

以輪詢 `GET /api/v1/health` 實作等待機制：

```typescript
private async waitForAgentReady(
    device: PairedCyberBrickDevice,
    token: string,
    timeoutMs = 30_000,
    intervalMs = 1_000
): Promise<boolean> {
    const deadline = this.now().getTime() + timeoutMs;
    // 先等待裝置開始重啟（約 1s）
    await this.delay(1_000);
    while (this.now().getTime() < deadline) {
        try {
            const resp = await this.fetchHealth(device, token);
            if (resp.status === 'ready') return true;
        } catch {
            // 裝置重啟中，ECONNREFUSED 是預期行為，繼續等待
        }
        await this.delay(intervalMs);
    }
    return false;  // 逾時 → FR-007a：顯示警告後繼續上傳
}
```

**關鍵確認**：
- 連線失敗（`ECONNREFUSED`、`EHOSTUNREACH`）是正常狀態，不計入錯誤
- 先等待 1s 讓裝置開始重啟，再進入輪詢迴圈
- 逾時上限 30s 足夠（裝置重啟通常 5-10s，加 buffer）
- `this.now()` 注入使測試可控時間
- 逾時後回傳 `false`，觸發 FR-007a：顯示警告後繼續程式碼上傳

**決策**：採用此輪詢模式，封裝在 `cyberbrickOtaUploader.ts` 私有方法 `waitForAgentReady()`。

---

## 研究項目六：WiFi Monitor 啟動時的 Reset / Reboot Signal

### 問題

對於支援新版 OTA agent 的裝置，WiFi Monitor 啟動時如何避免顯示舊的 buffer log，並且只在裝置真正完成重啟後才顯示 `Device ready.`？

### 研究發現

實機驗證顯示，Monitor 啟動時如果直接沿用既有 `/api/v1/logs` cursor，可能會混入 reset 前的舊 log；另一方面，`POST /api/v1/reset` 在部分裝置上可能回應很快、很慢，甚至看起來像掛住，因此 Host 不能把「收到 reset response」直接當成 ready。

目前實作採用以下策略：

1. **reset capability gate**：只有 agentVersion ≥ `1.5.0` 的裝置，Monitor 啟動時才會呼叫 `POST /api/v1/reset`
2. **清空 buffer**：裝置端在 `/api/v1/reset` 內先清空 log buffer，再安排 `machine.reset()`
3. **三種 reboot signal**：Host 必須看到以下任一訊號，才宣布 `Device ready.`
    - 實際斷線後恢復
    - log cursor rollback（`next_seq < resetCursorBeforeReset`）
    - OTA bootstrap marker：`[Singular Blockly] OTA bootstrap ready`
4. **legacy fallback**：1.4.x agent 沒有 `/api/v1/reset`，因此 WiFi Monitor 只能從目前可取得的 log cursor 開始監看，不能保證自動重跑程式

### 決策

- `WiFi Monitor connected to ...` 代表舊 agent HTTP 服務可連線
- `Device ready.` 代表 reset 後的新 runtime 已被確認重新上線
- 兩者之間的等待時間主要來自 `reset → reboot → Wi‑Fi reconnect → agent restart → next poll detection`
- 預設輪詢間隔維持 500ms；這不是等待的主要來源，但會決定 Host 觀察到 ready 的最後一小段偵測粒度

---

## Phase 0 結論

所有技術未知項目已確認，無 NEEDS CLARIFICATION 殘留：

| 研究項目 | 技術決策 | 狀態 |
|----------|----------|------|
| WiFi Monitor 通訊協定 | HTTP 500ms 輪詢 + 序號（`since` 參數） | ✅ 確定 |
| Terminal API | `vscode.Pseudoterminal` + `EventEmitter<string>` | ✅ 確定 |
| Terminal 關閉偵測 | `pty.close()` 回呼（無需 `onDidCloseTerminal`） | ✅ 確定 |
| stdout 捕捉 | `_LogCapture` 類別，替換 `sys.stdout` | ✅ 確定 |
| Semver 比較 | 純函式 `compareAgentVersion()`，無外部依賴 | ✅ 確定 |
| Agent 重啟等待 | 輪詢 health endpoint，逾時 30s | ✅ 確定 |
| 版本門檻 | `1.4.0` 啟用 WiFi Monitor / 無線升級；`1.5.0` 啟用 reset-capable Monitor；目前 target = `1.5.8` | ✅ 確定 |
| 重連後序號處理 | `next_seq < lastSeq` → 重置 `lastSeq = 0` | ✅ 確定 |
