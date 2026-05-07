---
name: txt-hardware-debug
description: >
  fischertechnik TXT Controller 硬體 SSH 除錯技能。當使用者提到 TXT 控制器、ftrobopy、
  超音波感測器、TXT SSH 除錯、io_server.py 錯誤、TXT 硬體測試、TXT sensor API、
  txt hardware debug、ftrobopy API、TXT connection、TXT sensor reading、
  TXT ultrasonic distance、txt.input().state()、txt.ultrasonic().distance()
  時自動啟用。涵蓋 SSH 連線、ftrobopy API 探索、感測器讀值方法確認、io_server.py 部署
  與測試的完整除錯流程。
metadata:
  author: singular-blockly
  version: '1.0.0'
  category: hardware-debug
  type: reference
---

# TXT Controller 硬體 SSH 除錯技能

本技能封裝了透過 SSH 連入 fischertechnik TXT 控制器、探索 ftrobopy API、
確認正確感測器讀值方法的完整除錯流程與關鍵知識。

---

## TXT 環境基礎資訊

| 項目 | 預設值 |
|---|---|
| IP（USB CDC-ECM） | `192.168.7.2` |
| IP（WiFi，視路由器） | 例：`192.168.0.85` |
| SSH 帳號 | `ftc` |
| SSH 密碼 | `ftc` |
| ftrobopy 監聽埠 | `65000`（localhost only） |
| io_server.py 部署路徑 | `/rom/tmp/singular_blockly/io_server.py` |
| io_server.py HTTP 埠 | `8080` |
| Python 常駐程序 | `python3 /opt/ftc/launcher.py`（PID ~1114，不可殺） |

---

## SSH 連線指令格式

**重要**：必須同時加 `-o PubkeyAuthentication=no` 和 `-o PreferredAuthentications=password`，
否則可能遭遇公鑰驗證失敗後無法回退密碼。

```bash
# 執行單一命令
sshpass -p ftc ssh \
  -o StrictHostKeyChecking=no \
  -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password \
  ftc@192.168.0.85 'COMMAND'

# SCP 上傳檔案（同樣需要三個 -o 選項）
sshpass -p ftc scp \
  -o StrictHostKeyChecking=no \
  -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password \
  /local/file.py ftc@192.168.0.85:/remote/path/file.py
```

**提示**：如果單行命令有引號轉義問題，改用 SCP 傳送 `.py` 腳本再執行：
```bash
# 1. 寫腳本到本機 /tmp/test.py（無引號逃脫煩惱）
cat > /tmp/test.py << 'EOF'
import ftrobopy
txt = ftrobopy.ftrobopy("localhost", 65000)
print(txt.ultrasonic(3).distance())
EOF

# 2. SCP 傳送
sshpass -p ftc scp -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password /tmp/test.py ftc@192.168.0.85:/tmp/test.py

# 3. 執行
sshpass -p ftc ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password ftc@192.168.0.85 'python3 /tmp/test.py'
```

---

## ftrobopy API 關鍵知識

### 感測器讀值方法（最重要！）

| 感測器類型 | 正確 Python 呼叫 | 回傳值 | 錯誤呼叫（避免）|
|---|---|---|---|
| 數位（按鈕、光柵） | `txt.input(i).state()` | `0` 或 `1` | — |
| 超音波 | `txt.ultrasonic(i).distance()` | 距離 cm（整數） | `txt.input(i).state()`（只回 0/1）|
| 電阻/類比 | `txt.resistor(i).value()` | 0–15000 Ω | — |
| 電壓 | `txt.voltage(i).value()` | 0–9999 mV | — |

**關鍵教訓**：`txt.input(i)` 和 `txt.ultrasonic(i)` 是兩個不同的方法，
各自回傳不同的內部 `inp` 物件：
- `txt.input(i)` → 有 `state()` 方法
- `txt.ultrasonic(i)` → 有 `distance()` 方法（無 `state()`）

若對超音波呼叫 `txt.input(i).state()` 只會得到 `0/1`，而非距離。

### setConfig 正確格式

```python
# 正確：I 必須是 (type, mode) tuple list
M, I = txt.getConfig()          # 先取得當前設定（保留馬達配置）
I[2] = (txt.C_ULTRASONIC, txt.C_ANALOG)   # 超音波
I[0] = (txt.C_SWITCH, txt.C_DIGITAL)      # 數位開關
txt.setConfig(M, I)
txt.updateConfig()
```

| 常數 | 值 | 用途 |
|---|---|---|
| `C_SWITCH` | 1 | 數位感測器類型 |
| `C_ULTRASONIC` | 3 | 超音波感測器類型 |
| `C_DIGITAL` | 1 | 數位模式 |
| `C_ANALOG` | 0 | 類比模式 |

### ftrobopy 物件屬性探索步驟

當遇到「不確定 API 是什麼」時，用以下步驟探索：

```python
import ftrobopy
txt = ftrobopy.ftrobopy("localhost", 65000)

# Step 1: 列出 txt 物件所有方法（找可用的高層 API）
print([a for a in dir(txt) if not a.startswith("__")])

# Step 2: 建立目標物件，列出其方法
inp = txt.input(3)
print([m for m in dir(inp) if not m.startswith("__")])
# → ['_ext', '_num', '_outer', 'state']

uc = txt.ultrasonic(3)
print([m for m in dir(uc) if not m.startswith("__")])
# → ['_ext', '_num', '_outer', 'distance']

# Step 3: 實際呼叫並觀察回傳值（配合 updateConfig 等待）
import time
M, I = txt.getConfig()
I[2] = (txt.C_ULTRASONIC, txt.C_ANALOG)
txt.setConfig(M, I)
txt.updateConfig()
time.sleep(0.8)  # 必要！等硬體設定生效

for n in range(5):
    print("distance:", txt.ultrasonic(3).distance())
    time.sleep(0.3)
```

---

## io_server.py 設計模式

### 感測器讀值：dispatch table（推薦）

使用字典 dispatch table 取代 `if/else` 鏈，讓新增感測器類型只需加一行：

```python
# 模組頂層定義（易於擴充）
_INPUT_READERS = {
    "SWITCH":     lambda txt, i: txt.input(i).state(),
    "ULTRASONIC": lambda txt, i: txt.ultrasonic(i).distance(),
    # 未來新增：只需加一行
    # "VOLTAGE":  lambda txt, i: txt.voltage(i).value(),
    # "RESISTOR": lambda txt, i: txt.resistor(i).value(),
}

# /io 端點使用
inputs = []
for i in range(1, 9):
    reader = _INPUT_READERS.get(_sensor_types[i - 1], _INPUT_READERS["SWITCH"])
    inputs.append(reader(_txt, i))
```

**禁止的寫法**（難以維護）：
```python
# ❌ 不要這樣：每新增一種感測器就要多一個 elif
for i in range(1, 9):
    if _sensor_types[i - 1] == "ULTRASONIC":
        inputs.append(_txt.ultrasonic(i).distance())
    elif _sensor_types[i - 1] == "VOLTAGE":
        inputs.append(_txt.voltage(i).value())
    else:
        inputs.append(_txt.input(i).state())
```

### io_server.py 部署與重啟

```bash
# 部署（SCP）
sshpass -p ftc scp -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password \
  /Users/user/Documents/singular-blockly/txt-runtime/io_server.py \
  ftc@192.168.0.85:/rom/tmp/singular_blockly/io_server.py

# 殺掉舊程序並重啟（注意：不可殺 launcher.py PID ~1114）
sshpass -p ftc ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password ftc@192.168.0.85 \
  'pkill -f io_server.py 2>/dev/null; sleep 1; nohup python3 /rom/tmp/singular_blockly/io_server.py > /tmp/ioserver.log 2>&1 & echo "pid=$!"'

# 等待啟動後驗證
sleep 2 && curl -s http://192.168.0.85:8080/io
```

### 常見錯誤診斷

| 錯誤訊息 | 原因 | 修正 |
|---|---|---|
| `'inp' object has no attribute 'distance'` | 對超音波用 `input(i).state()` | 改用 `ultrasonic(i).distance()` |
| `'int' object is not subscriptable` | setConfig 的 I 參數用整數而非 tuple | 改為 `(C_ULTRASONIC, C_ANALOG)` |
| `serial.serialutil.SerialException: device disconnected` | 多個 Python 程序同時連 ftrobopy | 殺掉所有 `io_server.py` 和測試程序後重啟 |
| `Connection refused port 8080` | io_server.py 啟動失敗 | `cat /tmp/ioserver.log` 查看錯誤 |
| `Permission denied (publickey)` | SSH 沒有強制密碼驗證 | 加 `-o PubkeyAuthentication=no -o PreferredAuthentications=password` |

---

## 除錯流程 SOP

```
1. 確認 TXT 在線
   └─ ping -c 2 192.168.0.85

2. SSH 連線測試
   └─ sshpass -p ftc ssh -o ... ftc@192.168.0.85 'echo ok'

3. 查看 io_server.py 狀態
   ├─ ps aux | grep io_server（是否在跑？）
   └─ cat /tmp/ioserver.log（最後錯誤是什麼？）

4. 若需探索 ftrobopy API
   ├─ 寫測試腳本到 /tmp/test.py
   ├─ SCP 傳送
   └─ ssh 執行，觀察輸出

5. 確認感測器讀值方法
   ├─ dir(txt) → 找可用方法列表
   ├─ dir(txt.input(i)) → ['state']（數位）
   └─ dir(txt.ultrasonic(i)) → ['distance']（超音波）

6. 修正 io_server.py 並重新部署
   └─ SCP + pkill + nohup restart

7. curl 端到端驗證
   ├─ POST /sensor_config → {"ok":true}
   └─ GET /io → inputs[i] 顯示正確值
```

---

## Test Panel 前端設計原則

- **每個 I1–I8 各有獨立下拉選單**（`<select>`），使用者主動選擇感測器類型
- 下拉改變時送出完整 8 個感測器類型陣列：`{ command: 'txtTestSetSensorConfig', sensorTypes: [...] }`
- 後端使用 **dispatch table**（非 if/else）根據類型呼叫對應 API
- 超音波顯示格式：`150 cm`；數位顯示：`0` / `1`
- 未來新增感測器類型：只需在前端 options 加一個 `<option>`，在後端 `_INPUT_READERS` 加一個 lambda

---

## 參考資源

- ftrobopy 原始碼位置（TXT 上）：`/media/sdcard/root/usr/lib/python3.11/site-packages/ftrobopy.pyc`
- 官方 ftrobopy GitHub：https://github.com/ftrobopy/ftrobopy
- io_server.py 本地路徑：`txt-runtime/io_server.py`
- 相關 spec：`specs/051-txt-controller-support/`
