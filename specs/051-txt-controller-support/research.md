# 研究報告：fischertechnik TXT Controller 支援

**功能分支**：`051-txt-controller-support`  
**研究日期**：2026-05-03  
**狀態**：完成（所有 NEEDS CLARIFICATION 已解決）

---

## 研究議題一：ftrobopy API 查證

**決策**：使用 `motor(N).setSpeed(speed)` 其中 speed 為 **-512 到 +512**，負值即反轉，0 為停止。不存在 `Motor.left`/`Motor.right` 常數參數。

**依據**（已從 GitHub 原始碼查證，`ftrobopy/ftrobopy.py`）：

```python
# setSpeed 文件原文（德文）：
# Setzt die Geschwindigkeit und Richtung des Motors
# Wertebereich: 0 (anhalten) bis 512 (maximum)
# Falls negativ, laeuft Motor Rueckwaerts

def setSpeed(self, speed, direction=None):
    if speed > 0:
        self._ftobj.setPwm((self._output-1)*2, speed)
        self._ftobj.setPwm((self._output-1)*2+1, 0)
    elif speed < 0:
        self._ftobj.setPwm((self._output-1)*2, 0)
        self._ftobj.setPwm((self._output-1)*2+1, -speed)
    else:
        self._ftobj.setPwm((self._output-1)*2, 0)
        self._ftobj.setPwm((self._output-1)*2+1, 0)
```

**其他確認的 API**：

| API | 回傳值 | 說明 |
|-----|--------|------|
| `ftrobopy.ftrobopy(host, port=65000)` | `ftrobopy` 物件 | 建立連線；預設 port 65000 |
| `motor(N).setSpeed(speed)` | None | N=1-4；speed=-512~512 |
| `input(N).state()` | 0 或 1 | N=1-8；0=接地（閉路），1=開路 |
| `output(N).setLevel(level)` | None | N=1-8；level=1~512（開）或 0（關） |

**被拒絕的替代方案**：

- `Motor.left`/`Motor.right` 常數（舊版文件描述，實際原始碼中 `direction` 參數存在但方向已由正負號決定，無需此常數）

---

## 研究議題二：node-ssh npm 套件 API

**決策**：採用 `node-ssh`（最新穩定版），其 Promise-based API 與 Extension Host 非同步模式完整相容。

**核心 API 用法**：

```typescript
import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

// 1. 建立連線
await ssh.connect({
    host: config.host,
    username: config.username,
    password: password,
    readyTimeout: 5000, // 5 秒連線超時
});

// 2. SCP 上傳檔案
await ssh.putFile(localPath, remotePath);

// 3. 執行命令（阻塞式，Promise resolve = 命令結束）
const result = await ssh.execCommand('python3 main.py', {
    cwd: remoteDir,
    onStdout: (chunk) => { /* 即時輸出 */ },
    onStderr: (chunk) => { /* 即時錯誤 */ },
});
// result.code: exit code; result.stdout: 完整輸出

// 4. 中途停止（執行另一命令強制終止）
await ssh.execCommand('pkill -f main.py');

// 5. 關閉連線
ssh.dispose();
```

**Webpack 相容性注意**：`node-ssh` 依賴 `ssh2`，需確認 webpack externals 設定（Extension Host 不打包 node_modules）。

**被拒絕的替代方案**：

- 原始 `ssh2` 套件：API 較低階，需手動處理事件流；維護工作量較高
- `simple-ssh`：已停止維護
- `execa` + `ssh` CLI：需目標機器安裝 SSH client，不跨平台

---

## 研究議題三：io_server.py 架構設計

**決策**：使用 Python 標準函式庫 `http.server.BaseHTTPRequestHandler` 實作最小 HTTP REST Server，在 TXT 端 port 8080 執行。

**設計原則**：

- 零外部依賴（不使用 Flask、FastAPI）
- 支援 ftCommunity 韌體可能附帶的 Python 3.6+（避免 walrus operator、match-case 等新語法）
- 執行方式：`python3 io_server.py &`（背景執行），Extension 在「安裝 TXT Runtime」命令中一次性啟動

**端點設計**：

```
GET  /io              → 回傳完整 I/O snapshot JSON
POST /motor           → Body: {"motor": 1-4, "speed": -512~512}
POST /output          → Body: {"output": 1-8, "level": 0 或 512}
POST /stop_all        → 停止所有馬達和輸出（無 Body）
```

**被拒絕的替代方案**：

- Flask：需 pip 安裝，不保證 TXT 端可用
- 直接 SSH polling（Test Panel 每 500ms 建立 SSH 連線）：延遲 > 1 秒，不符合 SC-003

---

## 研究議題四：VS Code SecretStorage API

**決策**：使用 `vscode.ExtensionContext.secrets`（VS Code 1.53+ 內建 SecretStorage API）。

**用法**：

```typescript
// 儲存密碼
await context.secrets.store('singular-blockly.txt.password', password);

// 讀取密碼
const password = await context.secrets.get('singular-blockly.txt.password');

// 刪除
await context.secrets.delete('singular-blockly.txt.password');
```

**特性**：

- 底層使用作業系統金鑰鏈（macOS Keychain、Windows Credential Manager、Linux Secret Service）
- 不寫入任何文字檔案或 settings.json（符合 FR-011）
- 跨 VS Code 重啟後仍保留（符合 FR-013）

---

## 研究議題五：TxtDeviceState 狀態機設計

**決策**：以 TypeScript enum-like union type 實作，由 `TxtUploader` 擁有狀態，透過 postMessage 通知 WebView。

**狀態轉換圖**：

```
           開啟 Test Panel           點擊上傳
  Idle ──────────────────→ Testing   ──→ Running
   ↑   ←────────────────── Testing       │
   │       關閉 Test Panel               │ execCommand resolve
   │                                     ↓
   ←────────────────────────────── Idle / Error
   
  任何狀態 ──點擊停止──→ Stopping ──完成──→ Idle
  
  網路中斷 ──偵測到──→ Disconnected
```

**防止衝突規則**：

- `Testing` 狀態下，上傳操作被拒絕（回傳錯誤訊息）
- `Running` 狀態下，Test Panel 進入「程式執行中」暫停模式
- `Stopping` 狀態下，所有操作鎖定直到轉換至 `Idle`

---

## 研究議題六：Blockly Generator 模式（TXT 特有）

**決策**：新增獨立的 `txtGenerator` 物件，模式與 `arduinoGenerator`/`micropythonGenerator` 相同。

**關鍵設計**：

1. **全域連線物件**：`txt_init` 積木生成 `txt = ftrobopy.ftrobopy(host, 65000)` 頂層程式碼
2. **反轉邏輯**：Generator 讀取方向下拉值，反轉時輸出負速度：
   ```javascript
   const dir = block.getFieldValue('DIRECTION'); // 'FORWARD' | 'BACKWARD'
   const code = dir === 'BACKWARD' ? `-${speed}` : `${speed}`;
   return `txt.motor(${motor}).setSpeed(${code})\n`;
   ```
3. **孤立積木保護**：所有 TXT 積木需在 `micropython_main`（MicroPython 容器）或新設的 TXT 主程式容器內，否則顯示警告

**被拒絕的替代方案**：

- 複用 `micropythonGenerator`：ftrobopy API 與 MicroPython machine API 語意完全不同，強行共用會引入大量 board 判斷邏輯

---

## 研究摘要表

| 議題 | 決策 | 信心度 |
|------|------|--------|
| ftrobopy setSpeed API | speed -512~512，負值反轉，已查證原始碼 | 高（原始碼） |
| node-ssh API | Promise-based，execCommand resolve = 命令結束 | 高（文件） |
| io_server.py 架構 | 標準 http.server，無外部依賴 | 高 |
| SecretStorage | VS Code 內建 context.secrets API | 高（官方文件） |
| TxtDeviceState 狀態機 | Union type + 狀態轉換函式 | 高 |
| Blockly Generator 模式 | 獨立 txtGenerator，反轉用負值 | 高 |
| Webpack 相容性 | node-ssh 需 externals 設定 | 中（待 Phase A 實際驗證） |
| ftCommunity Python 版本 | 推測 3.6+，避免新語法 | 中（待實機確認） |
