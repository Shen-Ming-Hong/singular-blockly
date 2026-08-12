# 開發者快速入門指南 (quickstart.md)

> 新開發者進入 Singular Blockly 專案的快速上手指南。
> 最後更新：2026-08-12

---

## 一、專案概述

**Singular Blockly** 是一個 VS Code 擴充功能，提供 Arduino 開發的視覺化程式介面：

-   🧩 **視覺化編程**：使用 Google Blockly 拖放積木
-   🔧 **多板支援**：Arduino UNO/Nano/Mega、ESP32
-   🌍 **多語言**：15 種語言支援
-   🤖 **AI 整合**：專案內 Agent Skills 提供目前積木與工作區契約

---

## 二、環境設定

### 2.1 系統需求

-   **Node.js**: 22.16.0+
-   **VS Code**: 1.109.0+
-   **PlatformIO**: VS Code 擴充功能

### 2.2 初始設定

```powershell
# 1. 複製專案
git clone https://github.com/Shen-Ming-Hong/singular-blockly.git
cd singular-blockly

# 2. 安裝依賴
npm install

# 3. 編譯
npm run compile

# 4. 啟動開發模式
npm run watch
```

### 2.3 執行測試

```powershell
# 執行所有測試
npm test

# 執行測試並產生覆蓋率報告
npm run test:coverage

# 驗證 i18n 翻譯
npm run validate:i18n

# 重建並驗證產品 Agent Skill 契約
npm run generate:project-skills
npm run check:project-skills
```

---

## 三、專案結構速覽

```
singular-blockly/
├── src/                    # Extension Host (TypeScript)
│   ├── extension.ts        # ⭐ 入口點
│   ├── webview/            # WebView 管理
│   └── services/           # Skill 安裝、候選驗證與其他核心服務
│
├── media/                  # WebView 資源 (Browser)
│   ├── js/blocklyEdit.js   # ⭐ 主編輯器邏輯
│   ├── blockly/            # 積木定義與生成器
│   ├── locales/            # 多語言訊息
│   └── toolbox/            # 工具箱配置
│
├── resources/project-skills/ # 封裝的英文產品 Skill 與 runtime 契約
│
├── docs/specifications/    # 整合規格書
│   ├── 00-technical-foundation/  # 技術基礎
│   └── ...                 # 各領域規格
│
└── specs/                  # 原始規格 (歷史參考)
```

---

## 四、核心概念

### 4.1 雙環境架構

```
┌─────────────────────┐     ┌─────────────────────┐
│  Extension Host     │     │      WebView        │
│  (Node.js)          │ ◄──►│    (Browser)        │
│                     │     │                     │
│  • TypeScript       │     │  • JavaScript       │
│  • VS Code API      │     │  • Blockly API      │
│  • 檔案系統存取     │     │  • DOM 操作         │
└─────────────────────┘     └─────────────────────┘
        postMessage 雙向通訊
```

### 4.2 積木開發雙檔案模式

每個積木類型需要兩個檔案：

| 檔案類型     | 位置                                             | 用途           |
| ------------ | ------------------------------------------------ | -------------- |
| 積木定義     | `media/blockly/blocks/{category}.js`             | UI 外觀、欄位  |
| 程式碼生成器 | `media/blockly/generators/arduino/{category}.js` | Arduino 程式碼 |

### 4.3 資料流

```
Blockly 積木 → main.json (狀態) → arduinoGenerator → main.cpp
```

### 4.4 產品 Agent Skill 與候選驗證

- 編輯 `resources/project-skills/singular-blockly/` 下的英文 Skill 來源；不要直接維護產生後的專案副本。
- 積木或工具箱變更後執行 `npm run generate:project-skills`，並提交更新後的 contract 與 manifest。
- 外部寫入 `blockly/main.json` 必須先通過 WebView 中的真實 Blockly load/save/load，再以原子方式更新 `main.json` 與 `.bak`。
- 無效候選只能隔離至 `main.invalid.json` 與有限歷史，不能直接進入 live workspace。

---

## 五、常見開發任務

### 5.1 新增 Blockly 積木

1. **定義積木** (`media/blockly/blocks/myblocks.js`)

```javascript
Blockly.Blocks['my_new_block'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('MY_BLOCK_LABEL')).appendField(new Blockly.FieldNumber(0), 'VALUE');
		this.setOutput(true, 'Number');
		this.setStyle('math_blocks');
		this.setTooltip(window.languageManager.getMessage('MY_BLOCK_TOOLTIP'));
	},
};
```

2. **實作生成器** (`media/blockly/generators/arduino/myblocks.js`)

```javascript
window.arduinoGenerator.forBlock['my_new_block'] = function (block) {
	const value = block.getFieldValue('VALUE');
	return [`(${value} * 2)`, arduinoGenerator.ORDER_MULTIPLICATIVE];
};
```

3. **加入工具箱** (`media/toolbox/categories/myblocks.json`)

```json
{
	"kind": "block",
	"type": "my_new_block"
}
```

4. **新增多語言訊息** (所有 `media/locales/*/messages.js`)

```javascript
"MY_BLOCK_LABEL": "我的積木",
"MY_BLOCK_TOOLTIP": "這是我的積木"
```

### 5.2 新增 Extension 命令

1. **註冊命令** (`src/extension.ts`)

```typescript
const myCommand = vscode.commands.registerCommand('singular-blockly.myCommand', async () => {
	// 命令實作
});
context.subscriptions.push(myCommand);
```

2. **宣告於 `package.json`**

```json
"contributes": {
  "commands": [
    {
      "command": "singular-blockly.myCommand",
      "title": "Singular Blockly: My Command"
    }
  ]
}
```

### 5.3 處理 WebView 訊息

1. **WebView 發送** (`media/js/blocklyEdit.js`)

```javascript
vscode.postMessage({
	command: 'myNewMessage',
	data: { key: 'value' },
});
```

2. **Extension 處理** (`src/webview/messageHandler.ts`)

```typescript
case 'myNewMessage':
  await this.handleMyNewMessage(message);
  break;
```

---

## 六、除錯技巧

### 6.1 Extension Host 除錯

-   使用 `log.info()` / `log.error()` (輸出到 "Singular Blockly" 通道)
-   按 F5 啟動除錯
-   在 TypeScript 設定斷點

### 6.2 WebView 除錯

-   使用 `console.log()` (瀏覽器環境)
-   右鍵 WebView → "Open Developer Tools"
-   檢視 Network/Console 面板

### 6.3 常見問題

| 問題                 | 解決方案                                         |
| -------------------- | ------------------------------------------------ |
| WebView 資源載入失敗 | 使用 `webview.asWebviewUri()`                    |
| 積木不出現在工具箱   | 檢查 `toolbox/index.json` 的 `$include`          |
| 程式碼生成錯誤       | 檢查 `forBlock` 名稱是否與 `Blockly.Blocks` 一致 |
| 多語言鍵缺失         | 執行 `npm run validate:i18n`                     |

---

## 七、程式碼慣例

### 7.1 日誌記錄

```typescript
// ✅ Extension Host
import { log } from '../services/logging';
log.info('訊息', { context: 'value' });
log.error('錯誤', error);

// ❌ 禁止
console.log('something');
```

```javascript
// ✅ WebView
console.log('訊息'); // 瀏覽器環境可用
log.info('訊息'); // 也會轉發到 Extension
```

### 7.2 檔案操作

```typescript
// ✅ 使用 FileService
const content = await fileService.readFile(relativePath);
await fileService.writeFile(relativePath, content);

// ❌ 禁止直接使用 fs
fs.readFileSync(path);
```

### 7.3 測試模式

```typescript
// 依賴注入模式
export class MyService {
	constructor(
		private workspacePath: string,
		fileService?: FileService // 可選，用於測試
	) {
		this.fileService = fileService || new FileService(workspacePath);
	}
}
```

---

## 八、關鍵檔案參考

| 檔案                                        | 說明           | 行數  |
| ------------------------------------------- | -------------- | ----- |
| `src/extension.ts`                          | 擴充功能入口   | ~250  |
| `src/webview/webviewManager.ts`             | WebView 管理   | ~970  |
| `src/webview/messageHandler.ts`             | 訊息處理       | ~800  |
| `media/js/blocklyEdit.js`                   | 主編輯器       | ~2200 |
| `media/blockly/generators/arduino/index.js` | Arduino 生成器 | ~280  |

---

## 九、相關文件

-   [技術架構研究](research.md) - 完整技術架構分析
-   [資料模型規格](data-model.md) - 資料結構定義
-   [整合規格書索引](../README.md) - 所有規格文件導覽
-   [Copilot 指引](../../../.github/copilot-instructions.md) - AI 輔助開發指南

---

## 十、下一步

1. 閱讀 [技術架構研究](research.md) 了解完整架構
2. 瀏覽 `media/blockly/blocks/` 學習積木定義範例
3. 執行 `npm run watch` 開始開發
4. 提交 PR 前執行 `npm run lint` 和 `npm test`

---

_歡迎加入 Singular Blockly 開發！有問題請開 Issue。_
