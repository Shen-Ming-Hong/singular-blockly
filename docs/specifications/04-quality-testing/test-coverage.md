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

### Managed Core 與跨平台安裝（067）

Managed runtime 的測試分成三層，避免每個 PR 都重複下載真實 Python：

1. 每個 PR 執行不連網的 fake artifact、manifest、checksum、archive containment、root ownership、install／cleanup lock、PlatformIO 受測版本範圍、atomic rollback、Core 路由、fallback 與 Unicode／空白／特殊字元路徑測試。
2. 維護者加上 `runtime-e2e-approved` 後，三作業系統 x64 runner 執行真實 CPython、PlatformIO、mpremote 安裝及離線重啟；`release-candidate` 再涵蓋 manifest 宣告的 ARM64。
3. 正式發布重新執行完整矩陣，並以實際 VS Code CLI 安裝候選 VSIX，檢查封裝 runtime manifest 與授權資產。

Activation／editor-open coordinator 以注入式服務驗證：ready 不安裝、missing／invalid 續裝、unsupported 不下載，同視窗並行只呼叫 installer 一次。Extension Host 測試另涵蓋 Arduino monitor Pseudoterminal 的 stdout、exit、kill、workspace trust 及 `shell: false`。

Editor-open 同意邊界另以 Extension Host 回歸測試驗證：activation 與 workspace-folder change 即使面對既有 Blockly folder 也不安裝 Project Skill；`opened` 後只處理 primary workspace；`cancelled` 時 Skill 與 workspace settings 呼叫數皆為 0。`SettingsManager` 測試同時確認讀取不存在的偏好不會建立 `.vscode/`。

CyberBrick WebView contract 驗證 OTA provisioning／cleanup 只使用單一進度 DOM、兩個 request 都在送出前 render running、設定以 reducer 里程碑計算 determinate progress、清除 running 省略 `aria-valuenow`，並檢查亮暗 theme token、forced-colors、reduced-motion 與 `textContent` 安全渲染。

Evidence 會綁定 repository、PR、event、head、tree、VSIX SHA-256、runtime manifest SHA-256、runner 與真實 E2E 回報的 artifact id／SHA-256；缺矩陣、必要路徑案例不足、artifact 與 manifest 不符、新 commit、離線重啟失敗或包含疑似私密路徑／credential 時一律 fail closed。完整操作與成本說明見 [Managed Runtime 跨平台驗證與發布閘門](managed-runtime-environment.md)。

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
