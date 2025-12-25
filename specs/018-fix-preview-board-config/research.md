# Research: 修復預覽模式開發板配置顯示錯誤

**Feature Branch**: `018-fix-preview-board-config`
**Date**: 2025-12-25

## 研究目標

1. 了解現有預覽模式載入流程
2. 找出導致 ESP32 腳位顯示錯誤的根本原因
3. 確認 ESP32 專屬積木在預覽模式的載入狀態
4. 研究最佳修復方案

## 研究發現

### 1. 預覽模式載入流程分析

**現有流程** (位於 `webviewManager.ts` 的 `loadBackupContent()` 方法):

```
1. 讀取備份檔案 JSON
2. 解析 backupData = { workspace, board, theme }
3. 提取 blocklyState = backupData.workspace
4. 直接發送 loadWorkspaceState 訊息
   → 問題：從未使用 backupData.board
```

**主編輯器流程** (位於 `blocklyEdit.js` 的 message handler):

```
1. 接收 loadWorkspace 訊息
2. 先設定 board: window.setCurrentBoard(message.board)
3. 再載入 workspace state
```

**關鍵差異**:

-   ✅ 主編輯器：先設定 board，再載入 workspace
-   ❌ 預覽模式：直接載入 workspace，未設定 board

### 2. 開發板配置機制

**Board 設定儲存位置**: `media/blockly/blocks/board_configs.js`

**全域狀態變數**:

-   `window.currentBoard` - 當前選擇的開發板 (預設: `'uno'`)
-   `window.BOARD_CONFIGS` - 所有開發板配置對照表

**關鍵函數**:

-   `window.setCurrentBoard(boardType)` - 設定當前開發板
-   `window.getDigitalPinOptions()` - 根據 currentBoard 回傳腳位選項
-   `window.getAnalogPinOptions()` - 根據 currentBoard 回傳類比腳位

**board 值映射**:
| 備份檔案 board 值 | BOARD_CONFIGS key |
|------------------|-------------------|
| `arduino_uno` | `uno` |
| `arduino_nano` | `nano` |
| `arduino_mega` | `mega` |
| `esp32` | `esp32` |
| `esp32_super_mini` | `supermini` |

**⚠️ 發現問題**: 備份檔案使用 `arduino_uno` 格式，但 BOARD_CONFIGS 使用 `uno` 格式。需要映射轉換。

### 3. ESP32 專屬積木載入狀態

**主編輯器 HTML** (`blocklyEdit.html`):

```html
<script src="{esp32WifiMqttBlocksUri}"></script>
```

**預覽模式 HTML** (`blocklyPreview.html`):

```html
<!-- 未載入 esp32-wifi-mqtt.js -->
```

**結論**: 預覽模式缺少 ESP32 WiFi/MQTT 積木定義腳本載入。

### 4. 訊息傳遞流程對比

| 步驟 | 主編輯器                       | 預覽模式                       |
| ---- | ------------------------------ | ------------------------------ |
| 1    | 接收 `loadWorkspace` 訊息      | 接收 `loadWorkspaceState` 訊息 |
| 2    | 讀取 `message.board`           | ❌ 無 board 資訊               |
| 3    | 呼叫 `setCurrentBoard(board)`  | ❌ 未執行                      |
| 4    | 呼叫 `updateToolboxForBoard()` | ❌ 預覽無 toolbox              |
| 5    | 載入 workspace state           | 載入 workspace state           |

## 解決方案

### 方案 A: 最小修改方案 (採用)

**修改檔案**:

1. `src/webview/webviewManager.ts` - `loadBackupContent()` 方法
2. `media/js/blocklyPreview.js` - 新增 `setBoard` 訊息處理
3. `media/html/blocklyPreview.html` - 新增 ESP32 積木腳本載入

**實作步驟**:

1. **Extension 端** (`loadBackupContent`):

    - 從 backupData 讀取 board 欄位
    - 若無 board 欄位，預設使用 `'arduino_uno'`
    - 在發送 `loadWorkspaceState` 前，先發送 `setBoard` 訊息
    - 新增 board 值映射函數

2. **WebView 端** (`blocklyPreview.js`):

    - 新增 `case 'setBoard':` 訊息處理
    - 呼叫 `window.setCurrentBoard(board)`
    - 驗證 board 值有效性，無效則顯示警告

3. **HTML 端** (`blocklyPreview.html`):
    - 新增 `<script src="{esp32WifiMqttBlocksUri}"></script>`

### 方案 B: 合併訊息方案 (備選)

將 board 資訊合併到 `loadWorkspaceState` 訊息中。

**缺點**: 需要修改現有訊息格式，影響範圍較大。

### Board 值映射邏輯

```typescript
function mapBoardValue(backupBoard: string | undefined): string {
	const boardMap: Record<string, string> = {
		arduino_uno: 'uno',
		arduino_nano: 'nano',
		arduino_mega: 'mega',
		esp32: 'esp32',
		esp32_super_mini: 'supermini',
		// 相容舊格式
		uno: 'uno',
		nano: 'nano',
		mega: 'mega',
		supermini: 'supermini',
	};
	return boardMap[backupBoard || ''] || 'uno'; // 預設 uno
}
```

## 邊界情況處理

| 情況                   | 處理方式                            |
| ---------------------- | ----------------------------------- |
| 備份缺少 `board` 欄位  | 預設使用 `'arduino_uno'` (向後相容) |
| `board` 值不在支援清單 | 顯示警告通知，使用 `'arduino_uno'`  |
| 連續開啟不同板子預覽   | 每個視窗獨立設定 board              |

## 測試驗證點

1. **ESP32 備份**: 開啟 ESP32 專案備份，確認 GPIO 腳位顯示
2. **Arduino 備份**: 開啟 Arduino 專案備份，確認 D/A 腳位顯示
3. **舊備份相容**: 開啟無 board 欄位的舊備份，確認使用預設配置
4. **不支援板子**: 修改備份為無效 board 值，確認警告顯示
5. **ESP32 積木**: 開啟含 WiFi/MQTT 積木的備份，確認積木正確顯示

## 決策總結

| 決策項目   | 選擇                              | 理由                        |
| ---------- | --------------------------------- | --------------------------- |
| 修改方案   | 方案 A (最小修改)                 | 符合 YAGNI 原則，影響範圍小 |
| 訊息順序   | 先 setBoard 再 loadWorkspaceState | 確保腳位選項在載入前已設定  |
| 預設 board | `arduino_uno`                     | 維持向後相容性              |
| 警告顯示   | VSCode 通知 + 預覽內標示          | 使用者清楚知道異常          |

## 參考資料

-   主編輯器 message handler: `media/js/blocklyEdit.js` L1930-1980
-   Board 配置: `media/blockly/blocks/board_configs.js`
-   預覽載入: `src/webview/webviewManager.ts` L700-780
-   ESP32 積木: `media/blockly/blocks/esp32-wifi-mqtt.js`
