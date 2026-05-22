# 資料模型：TXT 預覽虛擬控制畫布

**功能分支**：`054-preview-txt-controls`  
**日期**：2026-05-22

---

## 設計原則

本功能**不建立新的永久儲存格式**，而是消費既有的 `TxtVirtualControlsDocument`，再在 preview 端建立一份**唯讀投影模型**。

- 永久資料來源：`blockly/main.json`
- 暫時顯示狀態：preview WebView session state
- 不新增任何新的專案持久化欄位

---

## 根層級載入模型

### TxtPreviewLoadPayload

```typescript
export interface TxtPreviewLoadPayload {
    board: 'txt';
    workspaceState: Record<string, unknown>;
    txtVirtualControls?: TxtVirtualControlsDocument;
    previewWarnings: PreviewWarning[];
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| `board` | 僅在 TXT preview 中使用此模型 |
| `workspaceState` | 既有 Blockly serialization state |
| `txtVirtualControls` | 來自備份或專案保存內容的 TXT 虛擬控制文件 |
| `previewWarnings` | Host 正規化後提供給 preview 顯示的非阻斷警示 |

### 驗證規則

1. `board !== 'txt'` 時，不建立 TXT preview 投影。
2. `txtVirtualControls` 缺失時，不視為錯誤；由 preview 轉為空狀態。
3. `previewWarnings` 必須永遠存在；沒有警示時傳空陣列。

---

## 唯讀投影文件模型

### ReadonlyPreviewVirtualControlsDocument

```typescript
export interface ReadonlyPreviewVirtualControlsDocument {
    sourceState: 'present' | 'empty' | 'legacy-missing' | 'partial-recovered';
    controls: ReadonlyPreviewVirtualControl[];
    warnings: PreviewWarning[];
}
```

### 設計重點

- `sourceState` 用來描述 preview 呈現來源狀態，而不是持久化 schema。
- `controls` 只包含可被畫面安全渲染的控制項。
- `warnings` 會反映在 preview 畫面，但不阻止內容顯示。

---

## 單一虛擬控制投影模型

### ReadonlyPreviewVirtualControl

```typescript
export interface ReadonlyPreviewVirtualControl {
    stableId: string;
    displayName: string;
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    style: {
        textColor: string;
        backgroundColor: string;
    };
    renderState: 'normal' | 'recovered';
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| `stableId` | 唯一識別控制項；供 warning / reference 對應 |
| `displayName` | 畫面上實際顯示的名稱 |
| `position` | 保存時的畫布位置 |
| `size` | 保存時的實際渲染尺寸 |
| `style` | 唯讀投影時要保留的視覺樣式 |
| `renderState` | `normal` 為完整資料；`recovered` 為經正規化後仍可渲染 |

### 驗證規則

1. 缺少 `stableId` 的控制項不可進入 `controls`。
2. 缺少必要幾何資料時，若可合理補預設值，則標記為 `recovered`；否則改由 warning 表示，不直接渲染。
3. Preview 永遠不得修改此模型內容。

---

## 警示模型

### PreviewWarning

```typescript
export interface PreviewWarning {
    code:
        | 'legacy-missing-document'
        | 'empty-controls'
        | 'invalid-control-shape'
        | 'missing-control-reference';
    severity: 'info' | 'warning';
    scope: 'canvas' | 'control' | 'reference';
    stableId?: string;
    fallbackText?: string;
}
```

### 設計重點

- `code` 讓 preview 可依語系決定顯示文字。
- `stableId` 只在 warning 能對應到單一控制項時使用。
- `fallbackText` 用於極端情況下的保底顯示，不應作為主要 i18n 機制。

### 典型情境

| `code` | 代表意義 |
|--------|----------|
| `legacy-missing-document` | 舊備份完全沒有 `txtVirtualControls` |
| `empty-controls` | 有文件但 `controls` 為空 |
| `invalid-control-shape` | 某顆按鈕資料形狀不完整，無法完整還原 |
| `missing-control-reference` | 工作區中引用了已不存在的虛擬控制項 |

---

## Preview 版面 session 狀態

### PreviewLayoutSessionState

```typescript
export interface PreviewLayoutSessionState {
    splitRatio: number;
    canvasScrollLeft: number;
    canvasScrollTop: number;
}
```

### 設計重點

- 此狀態**只存在於目前 preview 視窗 session**。
- 關閉 preview 後不做持久化。
- 重新開啟 preview 時一律回到預設比例與預設滾動位置。

### 驗證規則

1. `splitRatio` 必須落在允許範圍內（例如 0.2 ~ 0.8）。
2. 調整 `splitRatio` 僅改變視覺版面，不可改寫 `txtVirtualControls`。
3. 滾動狀態不得回寫到備份或專案資料。

---

## Preview 呈現狀態機

### PreviewRenderState

```typescript
export type PreviewRenderState =
    | 'loading'
    | 'ready-empty'
    | 'ready-content'
    | 'ready-partial'
    | 'error';
```

### 狀態轉移

```mermaid
stateDiagram-v2
    [*] --> loading
    loading --> ready-empty: 缺少文件 / 空畫布
    loading --> ready-content: 完整投影成功
    loading --> ready-partial: 部分恢復 + warning
    loading --> error: 無法完成基本載入
    ready-empty --> [*]: 關閉 preview
    ready-content --> [*]: 關閉 preview
    ready-partial --> [*]: 關閉 preview
    error --> [*]: 關閉 preview
```

### 說明

- `ready-empty`：保留唯讀畫布區，但顯示空狀態訊息。
- `ready-partial`：顯示可恢復控制項與 warning。
- `error`：保住 Blockly 預覽與基本錯誤說明；不讓整個 WebView 崩潰。

---

## 與既有持久化模型的關係

### 來源模型（既有）

- `TxtVirtualControlsDocument`
- `TxtVirtualButton`
- `InvalidVirtualControlReference`

### 本功能新增的 preview 模型責任

| 型別 | 責任 |
|------|------|
| `TxtPreviewLoadPayload` | Host 傳給 preview 的載入根模型 |
| `ReadonlyPreviewVirtualControlsDocument` | Preview 使用的唯讀投影文件 |
| `ReadonlyPreviewVirtualControl` | 單一按鈕的唯讀渲染資料 |
| `PreviewWarning` | 舊資料、失效資料與部分恢復提示 |
| `PreviewLayoutSessionState` | 當前 preview 視窗的暫時版面狀態 |

---

## 建議的責任切分

### Extension Host

- 讀取備份 JSON
- 解析 `board` 與 `txtVirtualControls`
- 建立 `PreviewWarning[]`
- 將可顯示資料正規化後傳給 preview

### Preview WebView

- 根據 `ReadonlyPreviewVirtualControlsDocument` 渲染唯讀畫布
- 顯示空狀態 / warning / placeholder
- 維護 `PreviewLayoutSessionState`
- 阻止所有會改變內容的互動

### 不做的事

- 不在 preview 端保存任何 `txtVirtualControls`
- 不在 preview 端啟動 TXT runtime
- 不把 splitter ratio、捲動位置或 warning 寫回備份檔
