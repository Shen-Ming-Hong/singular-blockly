# Quickstart: 修復預覽模式開發板配置顯示錯誤

**Feature Branch**: `018-fix-preview-board-config`
**Date**: 2025-12-25

## 快速概覽

本功能修復 ESP32 備份檔案在預覽模式中顯示 Arduino 腳位的問題。

**問題**: 預覽模式未讀取備份檔案中的 `board` 設定，導致所有預覽都使用預設的 Arduino Uno 腳位配置。

**解決方案**: 在載入工作區狀態前，先傳送開發板設定訊息給 WebView。

## 修改檔案清單

| 檔案                              | 修改類型 | 說明                      |
| --------------------------------- | -------- | ------------------------- |
| `src/webview/webviewManager.ts`   | 修改     | 新增 board 映射與訊息發送 |
| `media/js/blocklyPreview.js`      | 修改     | 新增 setBoard 訊息處理    |
| `media/html/blocklyPreview.html`  | 修改     | 載入 ESP32 積木定義       |
| `src/test/webviewPreview.test.ts` | 修改     | 新增 board 載入測試       |

## 實作步驟

### 步驟 1: 修改 webviewManager.ts

在 `loadBackupContent` 方法中：

```typescript
// 在解析 backupData 後，發送 loadWorkspaceState 前

// 1. 讀取並映射 board 值
const boardMapping: Record<string, string> = {
	arduino_uno: 'uno',
	arduino_nano: 'nano',
	arduino_mega: 'mega',
	esp32: 'esp32',
	esp32_super_mini: 'supermini',
	uno: 'uno',
	nano: 'nano',
	mega: 'mega',
	supermini: 'supermini',
};

const rawBoard = backupData.board;
let mappedBoard = 'uno'; // 預設值
let warningMessage: string | undefined;

if (rawBoard && boardMapping[rawBoard]) {
	mappedBoard = boardMapping[rawBoard];
} else if (rawBoard) {
	// 無效的 board 值
	warningMessage = `無法識別的開發板類型 '${rawBoard}'，已使用預設配置`;
	log(warningMessage, 'warn');
}

// 2. 發送 setBoard 訊息
panel.webview.postMessage({
	command: 'setBoard',
	board: mappedBoard,
	...(warningMessage && { warning: warningMessage }),
});

// 3. 然後發送 loadWorkspaceState (現有程式碼)
```

### 步驟 2: 修改 blocklyPreview.js

在 message event listener 中新增 case：

```javascript
case 'setBoard':
  // 設定開發板類型
  if (message.board && window.setCurrentBoard) {
    window.setCurrentBoard(message.board);
    log.info(`預覽模式開發板已設定為: ${message.board}`);
  }

  // 顯示警告 (如果有)
  if (message.warning) {
    log.warn(message.warning);
    // 可選：在預覽視窗顯示警告提示
    showBoardWarning(message.warning);
  }
  break;
```

新增警告顯示函數：

```javascript
function showBoardWarning(message) {
	const warningEl = document.createElement('div');
	warningEl.className = 'board-warning';
	warningEl.textContent = message;
	document.querySelector('.preview-info')?.appendChild(warningEl);
}
```

### 步驟 3: 修改 blocklyPreview.html

在現有積木腳本後新增：

```html
<!-- ESP32 WiFi/MQTT 積木定義 -->
<script src="{esp32WifiMqttBlocksUri}"></script>
```

### 步驟 4: 更新 getPreviewContent

在 `webviewManager.ts` 的 `getPreviewContent` 方法中新增 ESP32 積木 URI 替換：

```typescript
// 新增 ESP32 積木 URI
const esp32WifiMqttBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/esp32-wifi-mqtt.js'));
const esp32WifiMqttBlocksUri = tempWebview.asWebviewUri(esp32WifiMqttBlocksPath);

// 在替換區段新增
htmlContent = htmlContent.replace('{esp32WifiMqttBlocksUri}', esp32WifiMqttBlocksUri.toString());
```

## 測試驗證

### 手動測試

1. **建立 ESP32 測試備份**:

    - 開啟 Blockly 編輯器
    - 選擇 ESP32 開發板
    - 新增數位輸出積木，選擇 GPIO 腳位
    - 建立備份

2. **測試預覽顯示**:

    - 右鍵備份檔案 → 預覽
    - 確認腳位顯示為 `GPIO0`, `GPIO2` 等格式
    - 確認不是 `D0`, `D1` Arduino 格式

3. **測試 WiFi 積木**:

    - 建立包含 ESP32 WiFi 連線積木的備份
    - 預覽時確認積木正確顯示

4. **測試向後相容**:
    - 開啟舊版無 `board` 欄位的備份
    - 確認使用 Arduino Uno 預設配置

### 單元測試

```typescript
describe('Preview board loading', () => {
	it('should send setBoard message before loadWorkspaceState', async () => {
		const messages: any[] = [];
		mockPanel.webview.postMessage = (msg: any) => {
			messages.push(msg);
		};

		await webViewManager.openBackupPreview(esp32BackupPath);

		const setBoardIndex = messages.findIndex(m => m.command === 'setBoard');
		const loadStateIndex = messages.findIndex(m => m.command === 'loadWorkspaceState');

		assert(setBoardIndex < loadStateIndex, 'setBoard should come before loadWorkspaceState');
		assert.strictEqual(messages[setBoardIndex].board, 'esp32');
	});
});
```

## 關鍵注意事項

1. **訊息順序**: `setBoard` **必須**在 `loadWorkspaceState` 之前發送
2. **Board 映射**: 備份使用 `arduino_uno`，BOARD_CONFIGS 使用 `uno`
3. **向後相容**: 缺少 board 欄位時預設使用 `uno`
4. **警告處理**: 無效 board 值要顯示警告但不中斷載入

## 相關文件

-   [spec.md](spec.md) - 功能規格
-   [research.md](research.md) - 技術研究
-   [data-model.md](data-model.md) - 資料模型
-   [contracts/webview-messages.md](contracts/webview-messages.md) - 訊息契約
