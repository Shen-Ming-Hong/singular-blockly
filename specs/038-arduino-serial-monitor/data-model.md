# 資料模型：Arduino Serial Monitor

**功能分支**: `038-arduino-serial-monitor`  
**建立日期**: 2026-01-27

## 實體定義

### ArduinoMonitorService

管理 Arduino Serial Monitor 生命週期的核心服務。

| 欄位                     | 類型                      | 說明                        |
| ------------------------ | ------------------------- | --------------------------- |
| `terminal`               | `vscode.Terminal \| null` | VS Code 終端機實例          |
| `isRunning`              | `boolean`                 | Monitor 是否正在運行        |
| `currentPort`            | `string \| null`          | 目前使用的連接埠            |
| `currentBoard`           | `string \| null`          | 目前監控的開發板            |
| `wasRunningBeforeUpload` | `boolean`                 | 上傳前 Monitor 是否開啟     |
| `pioPath`                | `string`                  | PlatformIO CLI 可執行檔路徑 |
| `onStoppedCallback`      | `Function \| null`        | 停止時的回調函式            |

### MonitorStartResult

啟動 Monitor 的結果。

| 欄位      | 類型                        | 說明             |
| --------- | --------------------------- | ---------------- |
| `success` | `boolean`                   | 是否成功啟動     |
| `port`    | `string`                    | 使用的連接埠     |
| `error`   | `MonitorError \| undefined` | 錯誤資訊（如有） |

### MonitorStopReason

Monitor 停止的原因列舉。

| 值                    | 說明                      |
| --------------------- | ------------------------- |
| `user_closed`         | 用戶手動關閉終端機        |
| `upload_started`      | 因程式上傳而關閉          |
| `device_disconnected` | 裝置連線中斷              |
| `manual_stop`         | 用戶點擊 Monitor 按鈕關閉 |

### ArduinoMonitorConfig

Monitor 設定配置。

| 欄位                  | 類型                  | 說明               | 預設值             |
| --------------------- | --------------------- | ------------------ | ------------------ |
| `baudRate`            | `number`              | 通訊速率           | `115200`           |
| `port`                | `string \| undefined` | 連接埠（自動偵測） | -                  |
| `useExceptionDecoder` | `boolean`             | 是否使用崩潰解碼器 | ESP32 系列自動啟用 |

---

## 狀態轉換

```
                    ┌──────────────┐
                    │   Stopped    │ ◄──────────────────────┐
                    │ (isRunning=  │                        │
                    │   false)     │                        │
                    └──────┬───────┘                        │
                           │                                │
                           │ start()                        │
                           ▼                                │
                    ┌──────────────┐                        │
                    │  Starting    │                        │
                    │  (偵測連接埠  │                        │
                    │   建立終端機) │                        │
                    └──────┬───────┘                        │
                           │                                │
              失敗 ◄───────┴───────► 成功                   │
              │                      │                      │
              ▼                      ▼                      │
       ┌──────────────┐       ┌──────────────┐              │
       │    Error     │       │   Running    │              │
       │ (顯示錯誤)   │       │ (isRunning=  │              │
       └──────┬───────┘       │   true)      │              │
              │               └──────┬───────┘              │
              │                      │                      │
              └──────────────────────┼──────────────────────┤
                                     │                      │
               stop() / 終端機關閉 / │                      │
               stopForUpload()       │                      │
                                     └──────────────────────┘
```

---

## 上傳流程整合

```
┌─────────────────────────────────────────────────────────────────┐
│                      用戶點擊上傳按鈕                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  MonitorService.stopForUpload()                                 │
│  └─ wasRunningBeforeUpload = isRunning                          │
│  └─ if (isRunning) stop()                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     執行 PlatformIO 上傳                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              失敗 ◄────────┴────────► 成功
              │                         │
              ▼                         ▼
┌─────────────────────┐   ┌─────────────────────────────────────┐
│ Monitor 保持關閉    │   │  if (wasRunningBeforeUpload)        │
│ (避免遮蓋錯誤訊息)  │   │    MonitorService.restartAfterUpload()│
└─────────────────────┘   └─────────────────────────────────────┘
```

---

## 驗證規則

### Baud Rate 驗證

- 必須為正整數
- 常見值：9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600
- 若 platformio.ini 解析失敗，使用預設值 115200

### 連接埠驗證

- Windows：格式 `COM[1-256]`
- macOS/Linux：格式 `/dev/tty*`
- 若未連接裝置，顯示「找不到裝置」錯誤

### ESP32 系列識別

- `esp32` → 啟用 exception decoder
- `supermini` (ESP32-C3) → 啟用 exception decoder
- 其他開發板 → 不啟用 exception decoder

---

## 與現有系統的關係

```
┌─────────────────────────────────────────────────────────────────┐
│                         messageHandler.ts                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  handleStartMonitor(message)                              │   │
│  │    └─ boardLanguage = getBoardLanguage(message.board)     │   │
│  │    └─ if (boardLanguage === 'arduino')                    │   │
│  │         → arduinoMonitorService.start()                   │   │
│  │       else if (boardLanguage === 'micropython')           │   │
│  │         → serialMonitorService.start()                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌─────────────────────┐             ┌─────────────────────┐
│ ArduinoMonitorService│             │ SerialMonitorService │
│ (新建)               │             │ (現有)               │
│ ┌─────────────────┐ │             │ ┌─────────────────┐ │
│ │ PlatformIO CLI  │ │             │ │ Python/pyserial │ │
│ │ pio device      │ │             │ │ 腳本            │ │
│ │ monitor         │ │             │ └─────────────────┘ │
│ └─────────────────┘ │             └─────────────────────┘
└─────────────────────┘
```
