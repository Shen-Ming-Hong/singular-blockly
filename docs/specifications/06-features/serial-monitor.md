# Serial Monitor 規格

> 來源：spec/037-cyberbrick-output-monitor（2026-01）、spec/038-arduino-serial-monitor（2026-01）

## 概述

**目標**：在 Blockly 編輯器中提供即時 Serial Monitor，讓使用者無需離開 VS Code 即可查看開發板的輸出，支援 CyberBrick (MicroPython) 與 Arduino (C++) 兩種板型。

**狀態**：✅ 完成

---

## 架構設計

### 板型對應

| 板型                     | 實作方式                 | 工具           |
| ------------------------ | ------------------------ | -------------- |
| CyberBrick               | `mpremote run` REPL 輸出 | mpremote       |
| Arduino (ESP32/UNO/Mega) | `pio device monitor`     | PlatformIO CLI |

### Monitor 按鈕

Monitor 按鈕僅在對應板型下顯示：

- **CyberBrick 板**：顯示 Monitor 按鈕
- **Arduino 板**：顯示 Monitor 按鈕
- 切換板型時按鈕會自動顯示/隱藏

---

## CyberBrick Output Monitor（037）

### 功能

- 開啟 VS Code Terminal，使用 `mpremote` 連接 CyberBrick 並顯示 stdout 輸出
- **自動偵測**：掃描 USB 裝置，識別 VID: 303A / PID: 1001（CyberBrick）
- **埠衝突處理**：上傳前自動關閉 Monitor 釋放 COM 埠，上傳完成後提示使用者重新開啟

### 自動裝置偵測

```typescript
// 依 VID/PID 識別 CyberBrick
const CYBERBRICK_VID = '303A';
const CYBERBRICK_PID = '1001';

async function detectCyberBrick(): Promise<string | null> {
	const ports = await serialport.list();
	return ports.find(p => p.vendorId === CYBERBRICK_VID && p.productId === CYBERBRICK_PID)?.path ?? null;
}
```

### 埠衝突管理

```
Monitor 開啟時點擊上傳 → 自動關閉 Monitor → 執行上傳 → 提示可重新開啟 Monitor
Monitor 未開啟時點擊上傳 → 直接執行上傳
```

---

## Arduino Serial Monitor（038）

### 功能

- 開啟 VS Code Terminal，使用 `pio device monitor` 連接 Arduino 開發板
- **自動讀取 Baud Rate**：從 `platformio.ini` 的 `monitor_speed` 設定讀取，預設 9600
- **自動管理 Monitor 狀態**：上傳時自動關閉，上傳成功後自動重新開啟（上傳前已開啟）

### Baud Rate 邏輯

```typescript
async function getBaudRate(): Promise<number> {
	const iniPath = path.join(workspaceRoot, 'platformio.ini');
	const content = await fs.readFile(iniPath, 'utf8');
	const match = content.match(/monitor_speed\s*=\s*(\d+)/);
	return match ? parseInt(match[1]) : 9600; // 預設 9600
}
```

### 上傳與 Monitor 狀態管理

| Monitor 狀態 | 上傳結果 | 上傳後 Monitor 狀態        |
| ------------ | -------- | -------------------------- |
| 開啟中       | 成功     | 自動重新開啟               |
| 開啟中       | 失敗     | 保持關閉（不遮蓋錯誤訊息） |
| 關閉         | 成功     | 保持關閉                   |

---

## 共用 UI 行為

### 按鈕 Toggle

Monitor 按鈕為切換式（Toggle）：

- 點擊開啟 → 開啟 Terminal，按鈕顯示「關閉 Monitor」提示
- 點擊關閉 → 關閉 Terminal，釋放 COM 埠
- 手動關閉 Terminal → WebView 按鈕狀態自動同步為「已停止」

### i18n 訊息鍵

```javascript
Blockly.Msg['MONITOR_OPEN'] = '開啟 Monitor';
Blockly.Msg['MONITOR_CLOSE'] = '關閉 Monitor';
Blockly.Msg['MONITOR_NO_DEVICE'] = '找不到裝置，請確認開發板已連接';
```

---

## 相關文件

- [統一上傳 UI](../06-features/unified-upload-ui.md) - 上傳流程與 Monitor 狀態整合
- [CyberBrick MicroPython](../03-hardware-support/cyberbrick-micropython.md) - mpremote 工具
