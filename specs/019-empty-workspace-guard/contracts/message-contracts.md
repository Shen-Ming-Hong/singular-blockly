# WebView ↔ Extension 訊息合約

**Feature Branch**: `019-empty-workspace-guard`  
**Date**: 2025-12-25

---

## 概述

本功能不新增任何訊息類型，僅修改現有 `saveWorkspace` 訊息的處理邏輯。

---

## 1. saveWorkspace 訊息

### 方向

WebView → Extension

### 訊息格式

```typescript
interface SaveWorkspaceMessage {
	command: 'saveWorkspace';
	state: BlocklyWorkspaceState;
	board: string;
	theme: 'light' | 'dark';
}
```

### 現有行為（修改前）

| 步驟 | 動作                     |
| ---- | ------------------------ |
| 1    | 接收訊息                 |
| 2    | 清理狀態資料             |
| 3    | 寫入 `blockly/main.json` |

### 新行為（修改後）

| 步驟 | 動作                                   | 新增 |
| ---- | -------------------------------------- | ---- |
| 1    | 接收訊息                               |      |
| 2    | **驗證狀態是否為空**                   | ✅   |
| 2a   | 若為空 → 拒絕並記錄警告，結束          | ✅   |
| 3    | **備份現有 main.json（若存在且非空）** | ✅   |
| 4    | 清理狀態資料                           |      |
| 5    | 寫入 `blockly/main.json`               |      |

---

## 2. 驗證規則詳細說明

### 空狀態判斷函數

```typescript
/**
 * 判斷 workspace 狀態是否為空
 * @param state Blockly 序列化狀態
 * @returns true 表示狀態為空，應拒絕儲存
 */
private isEmptyWorkspaceState(state: any): boolean {
    // 狀態不存在
    if (!state) return true;

    // blocks 屬性不存在
    if (!state.blocks) return true;

    // blocks.blocks 陣列不存在
    if (!state.blocks.blocks) return true;

    // 方塊陣列為空
    if (state.blocks.blocks.length === 0) return true;

    return false;
}
```

### 拒絕處理

-   **不發送** 任何回應訊息給 WebView
-   **記錄** warn 層級日誌：`"Rejected empty workspace save request"`
-   **不顯示** 使用者錯誤訊息（靜默拒絕）

---

## 3. 備份合約

### 備份檔案路徑

-   來源：`blockly/main.json`
-   目標：`blockly/main.json.bak`

### 備份觸發條件

```typescript
// 虛擬碼
if (fileExists('blockly/main.json')) {
	const existing = readFile('blockly/main.json');
	if (!isEmptyWorkspaceState(existing.workspace)) {
		copyFile('blockly/main.json', 'blockly/main.json.bak');
	}
}
```

### 備份失敗處理

-   **不中斷** 主檔案儲存流程
-   **記錄** warn 層級日誌：`"Failed to create backup: {error}"`

---

## 4. 日誌訊息規範

| 場景                 | 層級    | 訊息格式                                | 語言 |
| -------------------- | ------- | --------------------------------------- | ---- |
| Extension 拒絕空狀態 | `warn`  | `Rejected empty workspace save request` | EN   |
| 建立備份成功         | `debug` | `Created backup: main.json.bak`         | EN   |
| 備份失敗但繼續       | `warn`  | `Failed to create backup: {error}`      | EN   |

**語言說明**：Extension 端日誌使用英文，符合現有程式碼慣例。
