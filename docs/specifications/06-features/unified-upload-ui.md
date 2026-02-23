# 統一上傳 UI

> 整合自 specs/026-unified-upload-ui

## 概述

**目標**：統一 Arduino C++ 與 MicroPython 上傳 UI，提供一致的使用體驗

**狀態**：✅ 完成

---

## 設計原則

1. **統一入口**：所有板子使用相同的上傳按鈕
2. **智慧判斷**：根據板子類型自動選擇編譯/上傳流程
3. **即時回饋**：Toast 訊息顯示當前階段

---

## 上傳流程

### Arduino 板子（有連接硬體）

```
點擊上傳 → 同步設定 → 編譯中 → 上傳中 → 上傳成功
```

### Arduino 板子（無連接硬體）

```
點擊上傳 → 同步設定 → 編譯中 → 編譯成功
```

### MicroPython CyberBrick

```
點擊上傳 → 準備中 → 檢查工具 → 連接裝置 → 上傳中 → 上傳成功
```

---

## 架構設計

### 板子語言判斷

**位置**：`src/types/arduino.ts`

```typescript
export function getBoardLanguage(board: string): BoardLanguage | undefined {
	const languageMap: Record<string, BoardLanguage> = {
		uno: 'cpp',
		nano: 'cpp',
		mega: 'cpp',
		esp32: 'cpp',
		supermini: 'cpp',
		cyberbrick: 'micropython',
	};
	return languageMap[board];
}
```

### 上傳路由

**位置**：`src/webview/messageHandler.ts`

```typescript
case 'upload':
  const language = getBoardLanguage(message.board);

  if (language === 'micropython') {
    await this.micropythonUploader.upload(message);
  } else {
    await this.arduinoUploader.upload(message);
  }
  break;
```

---

## Arduino 上傳器

**位置**：`src/services/arduinoUploader.ts`

### 編譯流程

```typescript
async compile(): Promise<boolean> {
  // 1. 同步 platformio.ini 設定
  await this.syncPlatformIOConfig();

  // 2. 執行 PlatformIO 編譯
  const result = await this.runPlatformIO(['run', '--environment', this.board]);

  return result.success;
}
```

### 上傳流程

```typescript
async upload(): Promise<boolean> {
  // 1. 偵測連接的板子
  const ports = await this.detectPorts();

  if (ports.length === 0) {
    // 無板子：僅編譯
    return await this.compile();
  }

  // 2. 完整上傳
  const result = await this.runPlatformIO([
    'run', '--target', 'upload',
    '--environment', this.board,
    '--upload-port', ports[0]
  ]);

  return result.success;
}
```

---

## MicroPython 上傳器

**位置**：`src/services/micropythonUploader.ts`

### 上傳流程

```typescript
async upload(): Promise<boolean> {
  // 1. 檢查 mpremote 工具
  if (!await this.checkMpremote()) {
    throw new Error('mpremote not found');
  }

  // 2. 連接裝置並重置
  await this.runMpremote(['reset']);
  await this.runMpremote(['soft-reset']);

  // 3. 上傳程式
  await this.runMpremote(['cp', this.localFile, ':/app/rc_main.py']);

  // 4. 重啟執行
  await this.runMpremote(['reset']);

  return true;
}
```

---

## UI 元件

### 上傳按鈕

**位置**：`media/js/blocklyEdit.js`

```javascript
const uploadButton = document.createElement('button');
uploadButton.id = 'uploadButton';
uploadButton.innerHTML = getUploadIcon();
uploadButton.onclick = handleUpload;

// Tooltip 根據板子類型更新
function updateUploadTooltip(board) {
	const language = getBoardLanguage(board);
	if (language === 'micropython') {
		uploadButton.title = Blockly.Msg['UPLOAD_TO_CYBERBRICK'];
	} else {
		uploadButton.title = Blockly.Msg['COMPILE_AND_UPLOAD'];
	}
}
```

### Toast 訊息

| 階段   | Arduino 訊息 | MicroPython 訊息 |
| ------ | ------------ | ---------------- |
| 開始   | 同步設定...  | 準備中...        |
| 準備   | 編譯中...    | 檢查工具...      |
| 連接   | -            | 連接裝置...      |
| 上傳   | 上傳中...    | 上傳中...        |
| 成功   | 上傳成功 ✓   | 上傳成功 ✓       |
| 僅編譯 | 編譯成功 ✓   | -                |
| 錯誤   | 編譯失敗     | 上傳失敗         |

---

## 錯誤處理

### 常見錯誤與訊息

| 錯誤類型          | 顯示訊息                   |
| ----------------- | -------------------------- |
| PlatformIO 未安裝 | 請安裝 PlatformIO 擴充功能 |
| 編譯錯誤          | 編譯失敗：{錯誤摘要}       |
| 上傳逾時          | 上傳逾時，請檢查連線       |
| mpremote 未安裝   | 請安裝 mpremote 工具       |
| 裝置未連接        | 找不到 CyberBrick 裝置     |

---

## i18n 支援

相關翻譯鍵：

```javascript
Blockly.Msg['UPLOAD_TO_CYBERBRICK'] = '上傳至 CyberBrick';
Blockly.Msg['COMPILE_AND_UPLOAD'] = '編譯並上傳';
Blockly.Msg['UPLOAD_STAGE_SYNC'] = '同步設定...';
Blockly.Msg['UPLOAD_STAGE_COMPILE'] = '編譯中...';
Blockly.Msg['UPLOAD_STAGE_UPLOAD'] = '上傳中...';
Blockly.Msg['UPLOAD_SUCCESS'] = '上傳成功';
Blockly.Msg['COMPILE_SUCCESS'] = '編譯成功';
```

---

---

## 上傳錯誤分類與明確提示（042）

> 來源：spec/042-upload-error-clarity（2026-02）

### 問題背景

原上傳失敗只顯示籠統的「上傳失敗」，使用者無法判斷是「沒接開發板」、「程式碼編譯錯誤」還是「上傳過程中斷線」。

### 三種錯誤分類

| 錯誤類型     | 觸發條件                             | 顯示訊息（本地化）                                 |
| ------------ | ------------------------------------ | -------------------------------------------------- |
| 未偵測到硬體 | 上傳前未找到任何連接埠               | 「未偵測到硬體裝置，請確認開發板已連接」           |
| 編譯失敗     | PlatformIO 編譯回傳非零 exit code    | 「編譯失敗：{錯誤摘要，最多 200 字元}」            |
| 裝置連接問題 | 編譯成功但上傳過程斷線/埠被佔用/逾時 | 「裝置已斷開連接」/ 「連接埠被佔用」/ 「連接逾時」 |

### 流程設計

```
點擊上傳
  ├── 僅編譯模式 → 跳過硬體偵測，直接編譯
  └── 一般上傳模式
        ├── 偵測連接埠
        │     └── 無裝置 → 立即顯示「未偵測到硬體裝置」（不進入編譯）
        ├── 編譯
        │     └── 失敗 → 顯示「編譯失敗：{摘要}」
        └── 上傳
              └── 失敗 → 依錯誤類型顯示具體訊息
```

**硬體偵測優先**：在進入編譯階段前，先偵測裝置，避免使用者等待完整編譯後才發現沒接板子。

### 錯誤摘要截取

- 多個編譯錯誤時，僅顯示第一個主要錯誤
- 最大長度 200 字元，超過則截斷並加「...」

### i18n 新增鍵

```javascript
Blockly.Msg['UPLOAD_ERROR_NO_DEVICE'] = '未偵測到硬體裝置，請確認開發板已連接';
Blockly.Msg['UPLOAD_ERROR_COMPILE_FAILED'] = '編譯失敗';
Blockly.Msg['UPLOAD_ERROR_DEVICE_DISCONNECTED'] = '裝置已斷開連接';
Blockly.Msg['UPLOAD_ERROR_PORT_OCCUPIED'] = '裝置連接埠被佔用';
Blockly.Msg['UPLOAD_ERROR_TIMEOUT'] = '連接逾時';
```

---

## 相關文件

- [CyberBrick MicroPython](../03-hardware-support/cyberbrick-micropython.md) - MicroPython 上傳細節
- [快速備份](quick-backup.md) - Toast 通知元件
- [Serial Monitor](serial-monitor.md) - Monitor 與上傳的埠衝突管理
