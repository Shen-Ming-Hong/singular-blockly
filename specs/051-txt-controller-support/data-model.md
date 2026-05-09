# 資料模型：fischertechnik TXT Controller 支援（多流程擴充）

**功能分支**：`051-txt-controller-support`  
**日期**：2026-05-09

---

## 核心型別（既有 TXT 服務型別）

### TxtConnectionConfig

TXT 裝置的連線參數。IP 與 username 存於工作區設定；密碼存於 VS Code SecretStorage。

```typescript
export interface TxtConnectionConfig {
    host: string;
    username: string;
    remotePath: string;
    runtimePort: number;
}
```

---

### TxtDeviceState

TXT 裝置的目前狀態。由現有 `TxtConnectionService` / `TxtUploader` / `TxtTestService` 協調，避免 Program Mode 與 Test Mode 衝突。

```typescript
export type TxtDeviceState =
    | 'Idle'
    | 'Testing'
    | 'Running'
    | 'Stopping'
    | 'Disconnected'
    | 'Error';
```

---

### TxtIoSnapshot

某一時刻 TXT 的完整 I/O 狀態快照，供 Test Panel 使用。

```typescript
export interface TxtIoSnapshot {
    motors: [number, number, number, number];
    outputs: [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];
    inputs: [number, number, number, number, number, number, number, number];
    timestamp: number;
}
```

---

## 既有上傳型別（延續）

### TxtUploadStage

沿用既有 TXT uploader 的進度階段。

```typescript
export type TxtUploadStage =
    | 'connecting'
    | 'uploading'
    | 'executing'
    | 'stopping'
    | 'completed'
    | 'failed';
```

### TxtUploadProgress

WebView 與 Extension 間顯示上傳 / 執行進度時使用。

```typescript
export interface TxtUploadProgress {
    stage: TxtUploadStage;
    progress: number;
    message: string;
    error?: string;
}
```

### TxtUploadResult

上傳與遠端執行完成後的結果摘要。

```typescript
export interface TxtUploadResult {
    success: boolean;
    timestamp: string;
    duration: number;
    exitCode?: number;
    error?: {
        stage: TxtUploadStage;
        message: string;
        details?: string;
    };
}
```

### TxtUploadRequest

由 WebView 發出、交給 `TxtUploader` 消費的請求。多流程擴充不改變此介面形狀。

```typescript
export interface TxtUploadRequest {
    code: string;
    board: 'txt';
}
```

---

## 多流程擴充型別（本次新增）

### TxtFlowDescriptor

單一「TXT 流程」的內部描述。使用 hidden ID 作為穩定識別鍵，不要求顯示名稱唯一。

```typescript
export interface TxtFlowDescriptor {
    /** 穩定識別碼，用於 codegen、workspace 驗證與診斷 */
    id: string;
    /** 可選顯示名稱；留空也合法 */
    displayName?: string;
    /** 啟動順序（以工作區頂層順序決定） */
    order: number;
}
```

---

### TxtWorkspaceTopology

描述目前工作區頂層 TXT 模型的摘要，供 workspace 驗證與診斷使用。

```typescript
export interface TxtWorkspaceTopology {
    setupBlockIds: string[];
    processIds: string[];
    executableProcessCount: number;
}
```

---

## Blockly 頂層模型

### 新可見頂層積木

| 積木型別 | 使用者可見名稱 | 角色 | 主要輸出 |
|---------|----------------|------|----------|
| `txt_setup` | TXT 初始化 | 單次初始化容器 | 建立 shared `txt`、執行一次性初始化程式碼 |
| `txt_process` | TXT 流程 | 可重複頂層流程容器 | 產生單一流程 runner，供主程式統一啟動 |

### 預發布舊模型清理原則

`txt_main`、`txt_init`、`txt_input_read` 僅屬目前分支內部尚未發布的單主程式遺留，不納入正式資料模型；實作時可直接清理或重構。

---

## 核心積木集摘要

| 積木型別 | 輸入欄位 | 輸出型別 | Generator 摘要 |
|---------|---------|---------|----------------|
| `txt_setup` | DO: statements | top-level container | `import ftrobopy`, 建立 shared `txt`、預建 `_mN` 等 |
| `txt_process` | NAME（可選）、DO: statements | top-level container | 產生 `_txt_flow_*` runner 並註冊到主程式啟動清單 |
| `txt_motor_speed` | MOTOR, SPEED, DIRECTION | statement | `_mN.setSpeed(±speed)` |
| `txt_motor_stop` | MOTOR | statement | `_mN.setSpeed(0)` |
| `txt_output` | OUTPUT, STATE | statement | `txt.output(N).setLevel(0/512)` |
| `txt_input_sensor` | SENSOR_TYPE, INPUT | value | `txt.input(...).state()` 或 `_read_ultrasonic(port)` |
| `txt_wait` | MS | statement | `time.sleep(...)`；在多流程模型下只暫停當前流程 |
| `txt_stop_all` | 無 | statement | 關閉所有馬達與輸出 |

---

## 多流程 runtime 模型（規格層）

### 單一程式 / 單一 shared `txt`

- 產出物仍為單一 `main.py`
- `TXT 初始化` 只執行一次
- 所有流程共享同一個 `txt` 物件與同一組硬體資源

### 流程生命週期

- 每個 `TXT 流程` 都有自己的 `TxtFlowDescriptor`
- 流程可以是有限流程，也可以是長時間運行流程
- 一個流程完成時，不影響其他流程繼續執行

### 衝突控制原則

- 多流程同時寫同一馬達 / 輸出不是推薦教學模式
- 本次規格以文件化與 UX 提示為主，不要求建立完整資源仲裁器

---

## 正式工作區一致性規則

1. 頂層必須恰有一個 `txt_setup`
2. 頂層必須至少有一個 `txt_process`
3. `TxtWorkspaceTopology` 用於檢查缺少初始化、重複初始化與沒有可執行流程等情況
4. 正式工具箱、範例與預設工作區只使用新模型，不規劃 migration layer

---

## 與現有 service 型別的關係

- `TxtConnectionConfig`、`TxtDeviceState`、`TxtIoSnapshot`、`TxtUploadProgress` 等既有 service 型別仍然有效
- 多流程擴充主要影響 Blockly 作者模型、generator root 聚合與 workspace 驗證，不改變 SSH/Test Panel 的基本 service 介面
