# Data Model: 空 Workspace 防護機制

**Feature Branch**: `019-empty-workspace-guard`  
**Date**: 2025-12-25

---

## 1. 實體定義

### 1.1 WorkspaceState（Blockly 序列化狀態）

**描述**：Blockly 工作區的完整序列化表示，由 `Blockly.serialization.workspaces.save()` 產生。

```typescript
interface BlocklyWorkspaceState {
	/** 方塊資料 */
	blocks?: {
		/** Blockly 語言版本 */
		languageVersion: number;
		/** 頂層方塊陣列 */
		blocks: BlockDefinition[];
	};
	/** 變數資料 */
	variables?: VariableDefinition[];
	/** 程序（函數）資料 */
	procedures?: ProcedureDefinition;
}

interface BlockDefinition {
	/** 方塊類型識別碼 */
	type: string;
	/** 方塊唯一 ID */
	id: string;
	/** X 座標 */
	x?: number;
	/** Y 座標 */
	y?: number;
	/** 欄位值 */
	fields?: Record<string, any>;
	/** 輸入連接 */
	inputs?: Record<string, InputConnection>;
	/** 下一個方塊連接 */
	next?: { block: BlockDefinition };
}
```

**驗證規則**：

-   `blocks.blocks` 必須存在且為陣列
-   空工作區定義：`blocks.blocks.length === 0`

---

### 1.2 SaveWorkspaceMessage（儲存訊息）

**描述**：WebView 發送給 Extension 的儲存請求訊息。

```typescript
interface SaveWorkspaceMessage {
	/** 訊息命令類型 */
	command: 'saveWorkspace';
	/** Blockly 工作區狀態 */
	state: BlocklyWorkspaceState;
	/** 開發板類型 */
	board: string;
	/** 主題設定 */
	theme: 'light' | 'dark';
}
```

**驗證規則**：

-   `state` 必須存在
-   `state.blocks.blocks.length > 0` 才允許儲存

---

### 1.3 PersistentWorkspaceData（持久化檔案格式）

**描述**：儲存於 `blockly/main.json` 的完整資料結構。

```typescript
interface PersistentWorkspaceData {
	/** 工作區狀態 */
	workspace: BlocklyWorkspaceState;
	/** 開發板設定 */
	board: string;
	/** 主題設定 */
	theme: 'light' | 'dark';
}
```

**檔案位置**：

-   主檔案：`{workspace}/blockly/main.json`
-   備份檔案：`{workspace}/blockly/main.json.bak`

---

## 2. 狀態機

### 2.1 儲存流程狀態機

```
┌─────────────┐
│    Idle     │◄────────────────────────────────┐
└──────┬──────┘                                 │
       │ [觸發儲存事件]                          │
       ▼                                        │
┌─────────────┐                                 │
│ CheckDrag   │──[正在拖曳]──► 跳過儲存 ─────────┤
└──────┬──────┘                                 │
       │ [非拖曳狀態]                            │
       ▼                                        │
┌─────────────┐                                 │
│ Serialize   │                                 │
└──────┬──────┘                                 │
       │                                        │
       ▼                                        │
┌─────────────┐                                 │
│ CheckEmpty  │──[狀態為空]──► 跳過儲存 ─────────┤
│ (WebView)   │                                 │
└──────┬──────┘                                 │
       │ [狀態非空]                              │
       ▼                                        │
┌─────────────┐                                 │
│ SendMessage │ ──► Extension                   │
└─────────────┘                                 │
                                                │
       Extension Side                           │
       ─────────────                            │
       ▼                                        │
┌─────────────┐                                 │
│ Validate    │──[狀態為空]──► 拒絕儲存 ─────────┤
│ (Extension) │                                 │
└──────┬──────┘                                 │
       │ [狀態非空]                              │
       ▼                                        │
┌─────────────┐                                 │
│ Backup      │──[備份失敗]──► 記錄警告 ──┐      │
│ (optional)  │                          │      │
└──────┬──────┘                          │      │
       │ [備份成功/跳過]                  │      │
       ▼                                 │      │
┌─────────────┐                          │      │
│ WriteFile   │◄─────────────────────────┘      │
└──────┬──────┘                                 │
       │                                        │
       ▼                                        │
   儲存完成 ────────────────────────────────────┘
```

---

## 3. 驗證規則摘要

| 層級              | 檢查項目   | 條件                                   | 動作                |
| ----------------- | ---------- | -------------------------------------- | ------------------- |
| WebView Layer 1   | 拖曳狀態   | `isDraggingBlock === true`             | 跳過儲存，記錄 info |
| WebView Layer 2   | 序列化狀態 | `isWorkspaceStateEmpty(state)`         | 跳過儲存，記錄 warn |
| Extension Layer 3 | 訊息狀態   | `isEmptyWorkspaceState(message.state)` | 拒絕儲存，記錄 warn |

---

## 4. 檔案結構

```
{workspace}/
└── blockly/
    ├── main.json          # 主要工作區檔案
    ├── main.json.bak      # 自動覆寫前備份（單一版本）
    └── backup/            # 手動備份目錄（現有功能）
        └── *.json
```

---

## 5. 備份策略

### 建立備份的條件

1. `main.json` 存在
2. `main.json` 內容非空（`workspace.blocks.blocks.length > 0`）
3. 即將執行覆寫操作

### 不建立備份的條件

1. `main.json` 不存在（新專案首次儲存）
2. `main.json` 內容為空
3. 備份操作失敗（仍繼續儲存主檔案）

### 備份檔案生命週期

-   **建立時機**：每次成功驗證後、寫入主檔案前
-   **覆寫規則**：新備份直接覆蓋舊備份，只保留一份
-   **刪除時機**：無自動刪除機制，使用者可手動刪除
