# 資料模型：CyberBrick 中文與編輯穩定性修復

本功能不新增持久化 schema；以下模型皆為執行期狀態或既有訊息契約。

## 預期主檔狀態 `ExpectedMainState`

| 變體 | 欄位 | 驗證規則 |
|------|------|----------|
| `present` | `hash: string` | 必須是即將或已完成的內部 `main.json` bytes 之 SHA-256 |
| `absent` | 無 | 代表內部流程預期主檔不存在 |

### 狀態轉移

```text
未設定 ──初始化成功／內部寫入──> present(hash)
present(A) ──新的內部寫入 B──> present(hash(B))
present/未設定 ──內部刪除──> absent
present/absent ──相符重複事件──> 原狀態
present/absent ──不相符事件──> 原狀態 + 建立外部候選世代
```

## Monitor 生命週期

| 欄位 | 型別 | 規則 |
|------|------|------|
| `expectedStopReason` | `MonitorStopReason \| undefined` | 主動停止或 PTY 使用者關閉時在 kill 前設定 |
| `stoppedReported` | `boolean` | 每次成功 start 重設為 `false`；第一次回報後固定為 `true` |
| `activeProcess` | child process 或 `null` | 只屬於目前生命週期 |
| `terminal` | VS Code terminal 或 `null` | 與 active process 同一生命週期 |

### `MonitorStopReason`

- `manual_stop`：Monitor 按鈕主動停止。
- `upload_started`：為釋放裝置連接埠而停止。
- `user_closed`：使用者關閉終端頁籤。
- `device_disconnected`：未預期的程序失敗或裝置中斷。

### 狀態轉移

```text
idle ──start 成功──> running(stoppedReported=false)
running ──stop(reason)──> stopping(expectedStopReason=reason)
running ──PTY close──> stopping(expectedStopReason=user_closed)
running ──未預期 exit/error──> stopped(device_disconnected)
stopping ──process close/terminal close──> stopped(expected reason)
stopped ──重複 close/exit──> stopped（不再回報）
```

## UTF-8 解碼器對

| 欄位 | 用途 | 生命週期 |
|------|------|----------|
| `stdoutDecoder` | stdout bytes | PTY 建立至 process close／exit flush |
| `stderrDecoder` | stderr bytes | PTY 建立至 process close／exit flush |

兩個 decoder 不得共用；`write()` 可能暫時回傳空字串，只有非空內容才進入換行正規化。

## IME-safe 文字欄位

| 屬性 | 規則 |
|------|------|
| 基底類別 | 既有 Blockly `FieldTextInput` |
| 組字判定 | `isComposing`、`key === 'Process'`、`keyCode/which === 229` 或 WebView composition active |
| 組字期間 | 不呼叫基底 keydown handler |
| 非組字期間 | 完整委派給基底類別 |
| validator | 原樣傳遞，不放寬或替換 |
| 序列化 | 沿用 `field_input`／原欄位格式 |
