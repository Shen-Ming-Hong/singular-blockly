# 內部契約：工作區、文字欄位與 Monitor

## 1. Workspace watcher 契約

1. 內部主檔變更前，service 必須先登記變更完成後的精確預期狀態。
2. watcher 每次處理事件時比較「目前磁碟狀態」與「最後內部預期狀態」。
3. 相符事件回傳而不清除預期狀態；不相符事件交由既有候選流程。
4. 候選流程仍以 observation revision 與 generation 保證只有最新內容可提交。
5. 初始化只有在載入來源仍等於目前磁碟 bytes 時才能建立基準。

## 2. WebView 文字欄位契約

1. JSON block 定義使用的 `field_input` 必須解析成 app-owned IME-safe subclass。
2. 自訂 block definition 不得直接 `new Blockly.FieldTextInput`。
3. factory 必須保留 `initialValue` 與 `validator` 原參數。
4. composition、`Process` 或 229 期間，欄位與全域快捷鍵都不得處理該 keydown。
5. 非 composition 鍵盤事件必須維持 Blockly 原生行為。

## 3. Monitor service 契約

```ts
type MonitorStopReason =
  | 'manual_stop'
  | 'upload_started'
  | 'user_closed'
  | 'device_disconnected';

stop(reason?: MonitorStopReason): Promise<void>;
onStopped(callback: (reason: MonitorStopReason) => void): void;
```

- `stop()` 的預設原因是 `manual_stop`。
- `stopForUpload()` 必須等價於 `stop('upload_started')` 加既有的連接埠釋放等待。
- 同一輪 start 到 stop 只允許一次 callback。
- `manual_stop`、`upload_started`、`user_closed` 的 PTY exit code 為 0。
- `device_disconnected` 保留實際非零 code；無實際 code 的未預期結束使用非零失敗值。

## 4. WebView `monitorStopped` 契約

既有訊息格式維持：

```json
{
  "command": "monitorStopped",
  "reason": "manual_stop | upload_started | user_closed | device_disconnected"
}
```

| reason | 按鈕狀態 | 既有 toast | 新 toast |
|--------|------------|------------|----------|
| `manual_stop` | stopped | 清除 | 無 |
| `upload_started` | stopped | 清除 | 無 |
| `user_closed` | stopped | 清除 | 無 |
| `device_disconnected` | stopped | 清除／取代 | warning |

## 5. 子程序安全契約

- command 與 args 必須分離傳入 spawn。
- `shell` 必須固定為 `false`。
- 使用者可影響的 port／path 必須保持單一 argv 元素。
- CyberBrick process environment 必須保留 `process.env` 並覆寫 UTF-8 變數。
- 日誌不得包含 Wi-Fi／MQTT 密碼、完整環境或任意 stdout／stderr 內容。
