# 研究報告：Arduino Serial Monitor 功能實現

**功能分支**: `038-arduino-serial-monitor`  
**研究日期**: 2026-01-27  
**狀態**: 完成

## 1. PlatformIO device monitor 命令參數

### 完整參數列表

```bash
pio device monitor [OPTIONS]

# 主要參數
-p, --port TEXT         # 連接埠 (如 COM3, /dev/ttyUSB0)
-b, --baud INTEGER      # Baud rate, 預設 9600
--parity [N|E|O|S|M]    # 校驗位, 預設 N
--rtscts                # 啟用 RTS/CTS 流控
--xonxoff               # 啟用軟體流控
--rts [0|1]             # 初始 RTS 狀態
--dtr [0|1]             # 初始 DTR 狀態
--echo                  # 啟用本地回顯
--encoding TEXT         # 編碼 (預設 UTF-8)
-f, --filter TEXT       # 文字轉換 filter (可多次使用)
--eol [CR|LF|CRLF]      # 行結尾模式
--raw                   # 不套用任何轉換
--exit-char INTEGER     # 退出字元 ASCII 碼 (預設 29 = Ctrl+])
--menu-char INTEGER     # 選單字元 ASCII 碼 (預設 20 = Ctrl+T)
--quiet                 # 抑制非錯誤訊息
--no-reconnect          # 停用自動重連
-d, --project-dir PATH  # 專案目錄 (預設 CWD)
-e, --environment TEXT  # 指定環境
```

### esp32_exception_decoder 正確用法

```bash
# 命令列方式
pio device monitor --filter esp32_exception_decoder

# 多個 filter 組合
pio device monitor --filter default --filter esp32_exception_decoder
```

**Decision**: 使用 `--filter esp32_exception_decoder` 參數

**Rationale**: 此 filter 為 PlatformIO 官方支援，無需額外安裝，可自動解碼 ESP32 崩潰訊息

**Alternatives considered**:

- 使用獨立的 ESP Exception Decoder 工具：需要額外配置，不如內建 filter 方便
- 不啟用解碼：影響除錯效率

---

## 2. platformio.ini 解析

### monitor_speed 設定格式

```ini
[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
```

### 其他相關 monitor 設定

```ini
[env:myenv]
monitor_port = COM3              # 指定連接埠
monitor_speed = 115200           # Baud rate
monitor_filters = default, esp32_exception_decoder  # 過濾器
monitor_parity = N               # 校驗位
monitor_rts = 0                  # RTS 初始狀態
monitor_dtr = 0                  # DTR 初始狀態
monitor_eol = CRLF               # 行結尾模式
monitor_echo = yes               # 本地回顯
monitor_encoding = UTF-8         # 編碼
monitor_raw = no                 # 原始模式
```

**Decision**: 自動讀取 `monitor_speed`，其他設定使用 PlatformIO 預設值

**Rationale**: 大多數用戶只會設定 baud rate，其他設定很少修改

**Alternatives considered**:

- 讀取所有 monitor 設定：增加複雜度，ROI 低
- 不讀取任何設定：可能導致 baud rate 不符顯示亂碼

---

## 3. 現有程式碼架構

### SerialMonitorService.ts（MicroPython）

| 元素         | 說明                                                       |
| ------------ | ---------------------------------------------------------- |
| 狀態管理     | `isRunning`、`currentPort`                                 |
| 生命週期方法 | `start()`、`stop()`、`stopForUpload()`                     |
| 回調機制     | `onStopped(callback)` 處理 `user_closed`、`upload_started` |
| 終端機監聽   | `vscode.window.onDidCloseTerminal` 同步狀態                |
| 實現方式     | Python 腳本 + pyserial                                     |

### messageHandler.ts 訊息處理模式

| 訊息           | 處理方法               | 回應訊息                          |
| -------------- | ---------------------- | --------------------------------- |
| `startMonitor` | `handleStartMonitor()` | `monitorStarted` / `monitorError` |
| `stopMonitor`  | `handleStopMonitor()`  | `monitorStopped`                  |

### blocklyEdit.js Monitor 按鈕

| 函式                              | 功能                                           |
| --------------------------------- | ---------------------------------------------- |
| `initMonitorButton()`             | 初始化按鈕事件                                 |
| `updateMonitorButtonVisibility()` | 控制按鈕可見性（**目前只對 cyberbrick 顯示**） |
| `toggleMonitor()`                 | 切換 Monitor 狀態                              |
| `handleMonitorStarted()`          | 處理啟動成功                                   |
| `handleMonitorStopped()`          | 處理停止                                       |
| `updateMonitorButtonState()`      | 更新按鈕樣式（`.active` class）                |

**Decision**: 複用現有架構，建立平行的 `ArduinoMonitorService`

**Rationale**: 與 MicroPython 版本保持一致的介面，降低維護成本

---

## 4. ESP32 開發板偵測

### 現有識別方式（src/types/arduino.ts）

```typescript
export const BOARD_LANGUAGE_MAP: Record<string, BoardLanguage> = {
	uno: 'arduino',
	nano: 'arduino',
	mega: 'arduino',
	esp32: 'arduino',
	supermini: 'arduino',
	cyberbrick: 'micropython',
};
```

### 判斷是否為 ESP32 系列

```typescript
// 方法：建立 ESP32_BOARDS 常數
export const ESP32_BOARDS = ['esp32', 'supermini'] as const;

function isEsp32Board(board: string): boolean {
	return ESP32_BOARDS.includes(board as (typeof ESP32_BOARDS)[number]);
}
```

**Decision**: 建立 `ESP32_BOARDS` 常數陣列進行判斷

**Rationale**: 未來新增 ESP32 系列開發板時，只需修改陣列

**Alternatives considered**:

- 檢查 platform 設定：需要解析 BOARD_CONFIGS，較為複雜
- 硬編碼比對：不易維護

---

## 5. 現有開發板設定

| 開發板     | Platform    | 語言類型    | ESP32 系列 |
| ---------- | ----------- | ----------- | ---------- |
| uno        | atmelavr    | arduino     | ❌         |
| nano       | atmelavr    | arduino     | ❌         |
| mega       | atmelavr    | arduino     | ❌         |
| esp32      | espressif32 | arduino     | ✅         |
| supermini  | espressif32 | arduino     | ✅         |
| cyberbrick | -           | micropython | ❌         |

---

## 6. 風險與緩解措施

| 風險                                   | 影響                   | 緩解措施                                |
| -------------------------------------- | ---------------------- | --------------------------------------- |
| ESP32 exception decoder 需要 .elf 檔案 | 首次使用前必須先編譯   | 若 .elf 不存在，filter 仍可運作但不解碼 |
| COM 埠被佔用                           | 啟動失敗               | 解析錯誤訊息，顯示提示                  |
| platformio.ini 格式錯誤                | 無法解析 monitor_speed | try-catch 回退到預設值 115200           |
| 終端機非預期關閉                       | 狀態不同步             | 已有 `onDidCloseTerminal` 監聽機制      |
| 上傳過程中開啟 Monitor                 | 可能衝突               | 阻擋操作並顯示提示訊息                  |
| Windows/Mac/Linux 路徑差異             | 命令執行失敗           | 使用 `path.join()`                      |

---

## 7. 實現決策總結

| 決策項目       | 選擇                               | 理由                              |
| -------------- | ---------------------------------- | --------------------------------- |
| Monitor 命令   | `pio device monitor`               | PlatformIO 官方工具，整合性佳     |
| Baud rate 來源 | platformio.ini 優先，預設 115200   | 用戶習慣，避免亂碼                |
| ESP32 解碼     | `--filter esp32_exception_decoder` | 自動啟用，無需用戶配置            |
| 服務架構       | 獨立 `ArduinoMonitorService`       | 與 MicroPython 版本分離，降低耦合 |
| 按鈕可見性     | 所有 Arduino 語言開發板            | 功能統一性                        |
| 上傳整合       | `wasRunningBeforeUpload` 狀態追蹤  | 用戶體驗優化                      |
