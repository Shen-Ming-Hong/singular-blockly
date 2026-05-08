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
- 執行方式：`python3 io_server.py &`（背景執行），正常流程由 Extension 在開啟 Test Panel 時自動上傳並啟動；「安裝 TXT Runtime」命令僅保留作維護用途

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

## 研究議題七：USB 網路介面（教學場域連線方式分析）

**決策**：USB CDC-ECM 為教學場域**首選**連線方式；Wi-Fi 保留為可選備用。Extension 預設將 `singular-blockly.txt.host` 帶入 `192.168.7.2`，學生接上 USB 線即可使用，無需手動輸入 IP。

**背景**

ftCommunity 韌體透過 Linux USB Ethernet Gadget（`g_ether`）在 USB 傳輸線上模擬乙太網路介面。原始協定為 RNDIS；因 Linux kernel 準備移除 RNDIS 支援，ftCommunity 社群已計畫遷移至 CDC-ECM（issue #245 "Rework USB-PC-Connection"，已於 v1.1 合併 PR #246）。

**USB vs Wi-Fi 教學場域比較**

| 比較項目 | Wi-Fi | USB CDC-ECM |
|----------|-------|-------------|
| 需要事前網路設定 | ✅ 需設定 SSID/密碼 | ❌ 無需任何設定 |
| IP 位址 | DHCP 分配，每次可能不同 | 固定（`192.168.7.2`），永不變動 |
| 佔用學校網路頻寬/資源 | ✅ 是 | ❌ 點對點，完全不佔用 |
| 多台裝置互相干擾 | 可能（同一 Wi-Fi 下） | 不可能（每條 USB 線獨立） |
| 學生設定負擔 | 高（每台都要輸入） | **零**（接線即用） |
| Windows 驅動需求 | 無 | CDC-ECM：Windows 10 1903+ 內建驅動免手動安裝 |
| macOS / Linux | 無需設定 | 自動辨識，免驅動 |

**固定 IP 依據**

ftCommunity issue #222 說明 USB g_ether 比照 Raspberry Pi Zero USB 網路模式（同一 Raspberry Pi 論壇 workaround），Pi Zero 標準 IP 分配為：
- Device（TXT）端：`192.168.7.2`
- Host（PC）端：`192.168.7.1`

原廠 fischertechnik 韌體的 `S98usb_g_ether` 初始化腳本同樣遵循此 IP 範圍；ftCommunity 韌體相容原廠設計。

**Windows 驅動狀況**

- **RNDIS（舊版）**：Windows 需手動安裝驅動，且 Linux 正在移除 RNDIS 支援（Linux Security 2023 資訊）
- **CDC-ECM（v1.1 後）**：Windows 10 version 1903（2019 年 5 月）後內建驅動，現代 Windows 環境（10/11）通常免手動安裝
- **結論**：使用 Windows 10 1903+ 的教學環境接上 USB 後應自動辨識

**教學場域建議**

1. USB 連線 + 固定 IP `192.168.7.2` 為**零設定**方案：接上 USB 線，直接點擊上傳
2. Wi-Fi 連線保留為**進階/備用**選項（使用者可手動修改 host IP）
3. Extension 將 `singular-blockly.txt.host` 的預設值設為 `192.168.7.2`

**ftCommunity issue 查證**

| Issue | 狀態 | 說明 |
|-------|------|------|
| #222 "make g_ether usable under windows" | Not planned（已改由 #245 處理） | 指出 RNDIS 問題根源，指向遷移 CDC-ECM |
| #245 "Rework USB-PC-Connection" | Completed（v1.1，PR #246） | 正式遷移至 CDC-ECM，支援 IP/DHCP 設定選項 |
| #233 "Random Kernel Panics when using usb to PC" | Not planned | 已知偶發問題，v1.1 後改善 |

**被拒絕的替代方案**

- **mDNS / Bonjour 探索**：TXT 端需安裝 avahi；不在第一版範圍（列為 Assumptions）
- **USB 序列埠 (ttyUSB)**：需另外的 Python REPL server；複雜度遠高於 SSH over USB 網路

---

## 研究議題八：TXT 輪詢迴圈 pacing（`txt.updateWait()` vs `time.sleep()`）

**決策**：對「會持續輪詢/控制 TXT 硬體，且存在未節流就抵達 `while` 尾端路徑」的 loop，由 generator 自動補 `txt.updateWait(0.01)`；使用者明確放置的 `txt_wait` 仍維持 `time.sleep(...)`，不改寫為 `updateWait()`。

**依據**（已從 ftrobopy 原始碼、官方範例與 issue 查證）：

- `ftrobopy.ftrobopy(..., update_interval=0.01)` 的預設 exchange interval 為 10ms
- `updateWait()` docstring 明確指出以 `pass` 取代會導致顯著較高的 CPU 負載
- 官方範例在感測器/控制 loop 常使用 `time.sleep(0.02)` 節流
- 社群 issue #26 中，作者建議在高速控制 loop 內插入 `txt.updateWait(0.01)`

**設計含義**：

1. `updateWait()` 是通用的 TXT exchange-cycle 同步 API，不是超音波專用。
2. `txt_wait` 是「使用者語意上的等待 N 毫秒」，因此應保留 `time.sleep(...)`。
3. 自動 pacing 應放在 loop generator（`controls_whileUntil`），不能塞進 `txt_input_sensor` 之類 value block，避免把副作用綁進表達式。
4. 判斷需採路徑敏感（path-sensitive）分析：若某分支已 `txt_wait`，另一分支則進入不返回的內層 `while True`，外層 loop 不應再多補一個尾端 `txt.updateWait(0.01)`。

**被拒絕的替代方案**：

- 固定插入 `time.sleep(0.05)`：與 ftrobopy exchange cycle 不對齊，且屬任意常數
- 將 `txt_wait` 改生 `txt.updateWait()`：會改變使用者指定的等待語意
- 僅以「是否用到超音波」決定插入：會漏掉按鈕、光柵、一般輸入、輸出/馬達控制等 TXT 硬體 loop

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
| TXT 輪詢迴圈 pacing | 自動節流採 path-sensitive `txt.updateWait(0.01)`；`txt_wait` 維持 `time.sleep(...)` | 高（原始碼 + 範例 + issue） |
| USB CDC-ECM 連線方式 | 固定 IP `192.168.7.2`，預設帶入；Wi-Fi 為備用 | 中高（github issues 查證，IP 比照 Pi Zero 標準） |
| Webpack 相容性 | node-ssh 需 externals 設定 | 中（待 Phase A 實際驗證） |
| ftCommunity Python 版本 | 推測 3.6+，避免新語法 | 中（待實機確認） |
