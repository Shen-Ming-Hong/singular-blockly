# 資料模型：fischertechnik TXT Controller 支援

**功能分支**：`051-txt-controller-support`  
**日期**：2026-05-03

---

## 核心型別（src/types/txt.ts）

### TxtConnectionConfig

TXT 裝置的連線參數。IP 與 username 存於工作區設定（`vscode.workspace.getConfiguration`）；密碼存於 VS Code SecretStorage，不得出現在任何文字檔案中。

```typescript
export interface TxtConnectionConfig {
    /** TXT 裝置的 IP 位址或 hostname */
    host: string;
    /** SSH 使用者名稱（ftCommunity 預設：'ft'） */
    username: string;
    /** 遠端程式存放路徑（預設：'/tmp/singular_blockly/main.py'） */
    remotePath: string;
    /** io_server.py 的 HTTP port（預設：8080） */
    runtimePort: number;
}
```

**驗證規則**：

- `host`：非空字串，允許 IP（如 `192.168.0.100`）或 hostname
- `username`：非空字串，不允許空白
- `remotePath`：絕對路徑（以 `/` 開頭），預設 `/tmp/singular_blockly/main.py`
- `runtimePort`：1024-65535 範圍整數，預設 8080

---

### TxtDeviceState

TXT 裝置的當前狀態枚舉。由 `TxtUploader` 擁有，防止 Program Mode 與 Test Mode 衝突。

```typescript
export type TxtDeviceState =
    | 'Idle'          // 空閒，可進行任何操作
    | 'Testing'       // Test Panel 使用中（I/O 控制由 Test Panel 負責）
    | 'Running'       // 程式執行中（I/O 控制由 SSH execCommand 負責）
    | 'Stopping'      // 停止命令發出，等待確認
    | 'Disconnected'  // 連線中斷（偵測到網路錯誤）
    | 'Error';        // 發生錯誤（exit code 非 0 或 SSH 例外）
```

**狀態轉換規則**：

| 當前狀態 | 觸發事件 | 下一狀態 |
|---------|---------|---------|
| Idle | 開啟 Test Panel | Testing |
| Idle | 點擊上傳 | Running |
| Testing | 關閉 Test Panel | Idle |
| Running | execCommand resolve（exit code 0） | Idle |
| Running | execCommand resolve（exit code ≠ 0） | Error |
| Running / Testing | 點擊停止 | Stopping |
| Stopping | 停止完成 | Idle |
| 任何狀態 | 偵測到連線中斷 | Disconnected |
| Disconnected / Error | 使用者確認/重試 | Idle |

**防衝突規則**：

- `Testing` 狀態下，上傳操作被拒絕（回傳錯誤訊息給 WebView）
- `Running` 狀態下，Test Panel 自動進入暫停模式，顯示「程式執行中，Test Panel 暫停」
- `Stopping` 狀態下，所有操作鎖定（防止重複停止命令）

---

### TxtIoSnapshot

某一時刻 TXT 的完整 I/O 狀態快照。由 `io_server.py` 回傳，`TxtTestService` polling 後透過 postMessage 送至 WebView。

```typescript
export interface TxtIoSnapshot {
    /** M1-M4 馬達速度（index 0-3 對應 M1-M4），範圍 -512~512 */
    motors: [number, number, number, number];
    /** O1-O8 輸出狀態（index 0-7 對應 O1-O8），true=開，false=關 */
    outputs: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
    /** I1-I8 輸入讀值（index 0-7 對應 I1-I8），0 或 1 */
    inputs: [number, number, number, number, number, number, number, number];
    /** 快照時間戳（Unix ms） */
    timestamp: number;
}
```

---

### TxtUploadStage

上傳流程的各個階段，用於進度顯示。

```typescript
export type TxtUploadStage =
    | 'connecting'   // 建立 SSH 連線
    | 'uploading'    // SCP 上傳 main.py
    | 'executing'    // SSH 執行 python3 main.py
    | 'stopping'     // 發送停止命令
    | 'completed'    // 成功完成
    | 'failed';      // 失敗
```

---

### TxtUploadProgress

上傳進度介面，用於 WebView ↔ Extension 間的進度通訊（postMessage payload）。

```typescript
export interface TxtUploadProgress {
    stage: TxtUploadStage;
    /** 總進度百分比 0-100 */
    progress: number;
    /** 顯示訊息（已 i18n） */
    message: string;
    /** 錯誤訊息（僅 failed 時有值） */
    error?: string;
}
```

**各 stage 對應進度值**：

| stage | progress |
|-------|---------|
| connecting | 10 |
| uploading | 40 |
| executing | 60 |
| stopping | 80 |
| completed | 100 |
| failed | 維持失敗時的進度 |

---

### TxtUploadResult

上傳操作的最終結果。

```typescript
export interface TxtUploadResult {
    success: boolean;
    timestamp: string;       // ISO 8601
    duration: number;        // 毫秒
    exitCode?: number;       // Python 程式 exit code
    error?: {
        stage: TxtUploadStage;
        message: string;
        details?: string;   // 技術細節（僅供開發者 log）
    };
}
```

---

### TxtUploadRequest

上傳請求，由 WebView 發出（透過 postMessage），由 `TxtUploader` 消費。

```typescript
export interface TxtUploadRequest {
    /** 生成的 Python 程式碼 */
    code: string;
    /** 固定為 'txt' */
    board: 'txt';
}
```

> 連線設定由 `TxtConnectionService` 從 workspace settings + SecretStorage 讀取，不需由 WebView 傳入。

---

## 積木型別（media/blockly/blocks/txt.js）

| 積木型別 | 輸入欄位 | 輸出型別 | Generator 摘要輸出 |
|---------|---------|---------|------------------|
| `txt_init` | （無可編輯欄位，host 從設定讀取） | statement | `import ftrobopy\ntxt = ftrobopy.ftrobopy('{host}', 65000)\n` |
| `txt_motor_speed` | MOTOR: 下拉（M1-M4）、SPEED: 數字（0-512）、DIRECTION: 下拉（正轉/反轉） | statement | `txt.motor({N}).setSpeed({±speed})\n` |
| `txt_motor_stop` | MOTOR: 下拉（M1-M4） | statement | `txt.motor({N}).setSpeed(0)\n` |
| `txt_output` | OUTPUT: 下拉（O1-O8）、STATE: 下拉（開/關） | statement | `txt.output({N}).setLevel({512\|0})\n` |
| `txt_input_read` | INPUT: 下拉（I1-I8） | value（數值） | `txt.input({N}).state()` |
| `txt_wait` | MS: 數字（毫秒） | statement | `import time\ntime.sleep({ms}/1000)\n` |
| `txt_stop_all` | （無欄位） | statement | `for i in range(1,5): txt.motor(i).setSpeed(0)\nfor i in range(1,9): txt.output(i).setLevel(0)\n` |

---

## 工作區設定鍵值（package.json contributes.configuration）

| 設定鍵 | 型別 | 預設值 | 說明 |
|-------|------|--------|------|
| `singular-blockly.txt.host` | string | `""` | TXT IP 或 hostname |
| `singular-blockly.txt.username` | string | `"ft"` | SSH 使用者名稱 |
| `singular-blockly.txt.remotePath` | string | `"/tmp/singular_blockly/main.py"` | 遠端程式路徑 |
| `singular-blockly.txt.runtimePort` | number | `8080` | io_server.py HTTP port |

> 密碼使用 SecretStorage key：`singular-blockly.txt.password`
