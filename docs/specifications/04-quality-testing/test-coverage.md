# 測試覆蓋率規格

> 整合自 specs/004-test-coverage-improvement

## 概述

**目標**：將測試覆蓋率從 87.21% 提升至 90%+

**狀態**：🔄 進行中

---

## 基線數據

| 指標         | 基線值 | 目標值 |
| ------------ | ------ | ------ |
| 整體覆蓋率   | 87.21% | 90%+   |
| 測試數量     | 190    | TBD    |
| 測試執行時間 | < 3s   | ≤ 3s   |

---

## 測試架構

### 目錄結構

```
src/test/
├── extension.test.ts          # 擴展啟動測試
├── services/
│   ├── fileService.test.ts    # 檔案服務
│   ├── settingsManager.test.ts # 設定管理
│   ├── localeService.test.ts  # i18n 服務
│   └── workspaceValidator.test.ts # 專案驗證
├── webview/
│   ├── webviewManager.test.ts # WebView 管理
│   └── messageHandler.test.ts # 訊息處理
├── integration/               # 整合測試
│   └── ...
└── helpers/                   # 測試工具
    ├── mockFactory.ts         # Mock 工廠
    └── testUtils.ts           # 通用工具
```

### 測試框架

-   **Mocha**：測試執行器
-   **Sinon**：Mock/Stub/Spy
-   **@vscode/test-electron**：VSCode 整合測試

---

## 依賴注入模式

### Service 類別設計

```typescript
// services/fileService.ts
export class FileService {
	constructor(private readonly fs: typeof import('fs') = require('fs'), private readonly path: typeof import('path') = require('path')) {}

	async readFile(filePath: string): Promise<string> {
		return this.fs.promises.readFile(filePath, 'utf-8');
	}
}

// 測試時注入 mock
const mockFs = {
	promises: {
		readFile: sinon.stub().resolves('mock content'),
	},
};
const service = new FileService(mockFs as any);
```

### WebView 訊息處理

```typescript
// webview/messageHandler.ts
export class MessageHandler {
	constructor(private readonly fileService: FileService, private readonly settingsManager: SettingsManager) {}

	async handleMessage(message: WebviewMessage): Promise<void> {
		switch (message.command) {
			case 'saveWorkspace':
				await this.fileService.writeFile(/* ... */);
				break;
		}
	}
}
```

---

## 測試類型

### 單元測試

測試獨立功能單元，隔離外部依賴。

```typescript
// fileService.test.ts
suite('FileService', () => {
	let service: FileService;
	let mockFs: any;

	setup(() => {
		mockFs = {
			promises: {
				readFile: sinon.stub(),
				writeFile: sinon.stub(),
			},
		};
		service = new FileService(mockFs);
	});

	test('readFile 應返回檔案內容', async () => {
		mockFs.promises.readFile.resolves('test content');

		const result = await service.readFile('/test/path');

		assert.strictEqual(result, 'test content');
	});
});
```

### 整合測試

測試多個元件的協作。

```typescript
// integration/workspaceFlow.test.ts
suite('Workspace Flow', () => {
	test('建立新專案流程', async () => {
		// 1. 觸發命令
		await vscode.commands.executeCommand('singularBlockly.openEditor');

		// 2. 驗證 WebView 開啟
		assert.ok(/* WebView panel exists */);

		// 3. 驗證檔案建立
		assert.ok(/* blockly/main.json exists */);
	});
});
```

---

## 測試慣例

### 命名規則

```typescript
// 檔案：{module}.test.ts
// Suite：模組名稱
// Test：應 + 預期行為

suite('FileService', () => {
	test('應正確讀取 UTF-8 檔案', async () => {});
	test('應在檔案不存在時拋出錯誤', async () => {});
	test('應建立不存在的目錄', async () => {});
});
```

### Mock 工廠

```typescript
// helpers/mockFactory.ts
export function createMockPanel(): vscode.WebviewPanel {
	return {
		webview: {
			postMessage: sinon.stub(),
			asWebviewUri: sinon.stub().callsFake(uri => uri),
			html: '',
		},
		dispose: sinon.stub(),
	} as any;
}

export function createMockWorkspaceFolder(path: string): vscode.WorkspaceFolder {
	return {
		uri: vscode.Uri.file(path),
		name: path.split('/').pop()!,
		index: 0,
	};
}
```

---

## 覆蓋率報告

### 生成方式

```powershell
npm test -- --coverage
```

### 報告位置

```
coverage/
├── index.html         # HTML 報告首頁
├── src/
│   ├── extension.ts.html
│   ├── services/
│   └── webview/
└── lcov.info          # CI 用 LCOV 格式
```

---

## Fail-Fast 錯誤處理

### 模式

```typescript
// ❌ 錯誤：靜默失敗
try {
	await doSomething();
} catch (e) {
	// 忽略錯誤
}

// ✅ 正確：明確處理或傳播
try {
	await doSomething();
} catch (e) {
	log.error('操作失敗', e);
	throw new SpecificError('操作失敗', { cause: e });
}
```

### 測試中驗證錯誤

```typescript
test('應在無效輸入時拋出錯誤', async () => {
	await assert.rejects(() => service.doSomething(invalidInput), {
		name: 'ValidationError',
		message: /無效的輸入/,
	});
});
```

---

## CI 整合

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
            - run: npm ci
            - run: npm test -- --coverage
            - uses: codecov/codecov-action@v4
              with:
                  files: ./coverage/lcov.info
```

---

## 相關文件

-   測試配置：`.vscode/launch.json`
-   覆蓋率報告：`coverage/index.html`
