# 資料模型：PlatformIO 診斷 UI

**功能分支**：`052-platformio-diagnostic-ui`  
**日期**：2026-05-13

---

## 核心列舉型別

### DiagnosticItemId

第一版固定診斷項目，順序不可漂移。

```typescript
export type DiagnosticItemId = 'pio' | 'penvRoot' | 'python' | 'pip' | 'mpremote';
```

---

### DiagnosticItemKind

`penv` 根目錄不是可執行檔，需與一般 executable 分開表示。

```typescript
export type DiagnosticItemKind = 'executable' | 'derived-directory';
```

---

### DiagnosticItemStatus

單一項目的可用性狀態。

```typescript
export type DiagnosticItemStatus = 'ok' | 'warning' | 'error';
```

---

### DiagnosticSource

表示系統最終採用哪一種來源判定該項目位置。

```typescript
export type DiagnosticSource =
    | 'default-platformio-path'
    | 'path-search'
    | 'resolved-pio-sibling'
    | 'derived-from-penv'
    | 'unresolved';
```

**語意說明**：

- `default-platformio-path`：來自預設 `~/.platformio/penv/...`（或 Windows 對應路徑）
- `path-search`：透過 PATH / common bin 搜尋得到
- `resolved-pio-sibling`：根據已解析的 `pio` 所在目錄推導
- `derived-from-penv`：根據已確認的 `penv` 根目錄衍生
- `unresolved`：無法決定有效來源

---

### PlatformioOverallStatus

整體診斷狀態。

```typescript
export type PlatformioOverallStatus = 'operational' | 'degraded' | 'unavailable';
```

**狀態判準**：

- `operational`：五個固定項目都能提供符合預期的結果，必要 executable 的版本探測通過
- `degraded`：至少可完成部分診斷，且能指出可疑缺口；例如 `pio` 可用但 `mpremote` 缺失
- `unavailable`：無法辨識 `pio`，或整體診斷無法提供可用判斷基礎

---

### DiagnosticRunState

panel 當前執行狀態。

```typescript
export type DiagnosticRunState = 'idle' | 'loading' | 'ready' | 'error';
```

---

### PanelActionId

第一版 panel 僅保留兩個主要操作。

```typescript
export type PanelActionId = 'retest' | 'copySummary';
```

---

## 核心實體

### VersionProbeResult

執行 `--version` 或 `version` 的結果。只有 executable 類型會有這個欄位。

```typescript
export interface VersionProbeResult {
    command: string;
    succeeded: boolean;
    output?: string;
    errorMessage?: string;
    durationMs: number;
}
```

**驗證規則**：

- `command` 必須記錄實際執行的版本探測指令形式
- `succeeded === true` 時，`output` 必須存在且可供顯示／摘要使用
- `succeeded === false` 時，`errorMessage` 必須存在

---

### PlatformioDiagnosticItem

單一診斷項目的結果。

```typescript
export interface PlatformioDiagnosticItem {
    id: DiagnosticItemId;
    kind: DiagnosticItemKind;
    status: DiagnosticItemStatus;
    resolvedPath: string | null;
    source: DiagnosticSource;
    exists: boolean;
    isFromDetectedPenv: boolean | null;
    reason: string;
    nextStep?: string;
    versionProbe?: VersionProbeResult;
}
```

**欄位說明**：

- `resolvedPath`：實際採用的位置；若未找到則為 `null`
- `isFromDetectedPenv`：
  - `python` / `pip` / `mpremote` 必須是 `true` 或 `false`
  - `pio` 與 `penvRoot` 則為 `null`
- `reason`：提供給 UI 顯示的主要結果說明
- `nextStep`：提供給 UI 顯示的下一步建議，僅在警告或失敗時需要

**驗證規則**：

1. `penvRoot` 的 `kind` 必須是 `derived-directory`
2. `penvRoot` 不應帶 `versionProbe`
3. `python` / `pip` / `mpremote` 必須明確指出 `isFromDetectedPenv`
4. `source === 'unresolved'` 時，`resolvedPath` 應為 `null`
5. `status === 'ok'` 不等於只看 `exists`；若版本探測失敗，應降為 `warning` 或 `error`
6. `status === 'warning'` 或 `status === 'error'` 時，`nextStep` 必須存在且具體可執行

---

### PlatformioDiagnosticSession

一次由使用者開啟診斷或按下重新測試後產生的完整結果。

```typescript
export interface PlatformioDiagnosticSession {
    requestedAt: string;
    workspacePath: string | null;
    overallStatus: PlatformioOverallStatus;
    items: [
        PlatformioDiagnosticItem,
        PlatformioDiagnosticItem,
        PlatformioDiagnosticItem,
        PlatformioDiagnosticItem,
        PlatformioDiagnosticItem
    ];
    scopeNotice: string;
}
```

**驗證規則**：

- `items` 必須固定為五項，順序依序為：`pio` → `penvRoot` → `python` → `pip` → `mpremote`
- `scopeNotice` 必須提醒「本次診斷只涵蓋工具辨識與可用性，不保證裝置連線一定正常」
- `workspacePath` 可為 `null`，但 session 本身仍應可建立

---

### PlatformioDiagnosticPanelState

提供 WebView panel rendering 的最小 view model。

```typescript
export interface PlatformioDiagnosticPanelState {
    runState: DiagnosticRunState;
    session: PlatformioDiagnosticSession | null;
    topLevelError: string | null;
    availableActions: PanelActionId[];
    sectionOrder: ['summary', 'tools', 'scope'];
}
```

**用途**：

- 支援 panel 的 `loading` / `ready` / `error` 切換
- 讓 Extension Host 能在不暴露內部 service 細節的前提下，把完整 render state 傳給 WebView
- 保持第一版 UI 結構簡潔：摘要、工具清單、範圍提醒三段即可

**驗證規則**：

1. `runState === 'ready'` 時，`session` 必須存在
2. `runState === 'error'` 時，`topLevelError` 必須存在
3. `availableActions` 第一版只能包含 `retest` 與 `copySummary`
4. `sectionOrder` 固定為 `summary` → `tools` → `scope`，避免 UI 主資訊順序漂移

---

### ClipboardSummary

提供給使用者複製與回報問題的純文字摘要。

```typescript
export interface ClipboardSummary {
    plainText: string;
    generatedAt: string;
    overallStatus: PlatformioOverallStatus;
}
```

**用途**：

- GitHub Issue / PR comment / 討論串貼文
- 教師或維護者遠端協助時的快速比對資訊

---

## 狀態轉換模型

### Panel Lifecycle

```text
idle
  └─(command 開啟 panel)→ loading
loading
  ├─(成功取得 session)→ ready
  └─(發生頂層例外)→ error
ready
  ├─(使用者按下重新測試)→ loading
  └─(使用者按下複製摘要)→ ready
error
  └─(使用者按下重新測試)→ loading
```

**補充**：

- 只要能對五個固定項目產生結果，即使其中部分失敗，也應落在 `ready` + `overallStatus = degraded/unavailable`，而不是直接 `error`
- `error` 只保留給「連診斷 session 都無法組出來」的頂層例外
- `copySummary` 不會改變 panel 狀態，只會使用最近一次 `ready` 的 session

---

## 實體關係圖（概念）

```text
PlatformioDiagnosticPanelState
├── 0..1 x PlatformioDiagnosticSession
│   ├── 5 x PlatformioDiagnosticItem (固定順序)
│   │   └── 0..1 x VersionProbeResult
│   └── 1 x scopeNotice
└── 1 x ClipboardSummary（由 session 派生）
```

---

## 與既有程式碼的對應關係

| 資料模型 | 對應程式邊界 | 說明 |
|---------|--------------|------|
| `PlatformioDiagnosticSession` | 新 `PlatformioDiagnosticService` | 收集與格式化診斷結果的主輸出 |
| `PlatformioDiagnosticItem` | `executableResolver.ts` + 新 service | 將現有解析規則轉為可顯示資料，補齊 reason / nextStep |
| `PlatformioDiagnosticPanelState` | 新 `src/webview/platformioDiagnosticPanel.ts` | 提供 WebView render 所需的最小狀態 |
| `VersionProbeResult` | 新 service 的 probe helper | 封裝 `--version` / `version` 結果 |
| `ClipboardSummary` | 新 service 或 panel host helper | 提供 `複製診斷摘要` 的純文字內容 |

---

## 不納入第一版的資料

以下資料本次不作為第一版正式模型的一部分：

- PlatformIO VS Code 擴充套件安裝狀態
- 裝置連接埠 / USB 裝置清單
- 自動修復建議（例如一鍵安裝 `mpremote`）
- 手動工具路徑覆寫設定（`pio` / `penv` / `python` / `pip` / `mpremote`）
- upload button 視覺狀態或 spinner class 追蹤（此修正視為既有 WebView UI 基線，由回歸驗證保護）
- 歷史診斷快照持久化

這些需求可在後續版本評估，但不應擴張 v1 的資料模型邊界。
