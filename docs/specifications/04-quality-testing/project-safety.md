# 專案安全防護規格

> 整合自 specs/010-project-safety-guard

## 概述

**目標**：防止使用者在非 Blockly 專案中誤觸擴展按鈕，避免破壞現有專案的檔案結構

**狀態**：✅ 完成

---

## 問題描述

使用者在其他專案（Node.js、Python、Java 等）中不小心按到 Singular Blockly 的按鈕，會：

1. 開啟 Blockly 編輯器
2. 建立 `blockly/` 資料夾
3. 生成 `main.json`、`src/main.cpp`、`platformio.ini` 等檔案
4. 破壞原有專案結構

---

## 三層防護機制

### P1 - 偵測與警告（核心功能）

**觸發條件**：工作區不存在 `blockly/` 資料夾

**對話框內容**：

```
這個專案還沒有 Blockly 積木。
如果繼續，會在這裡建立 blockly 資料夾和檔案。
要繼續嗎？

[繼續] [取消] [不再提醒]
```

**行為**：

-   「繼續」：建立 Blockly 結構並開啟編輯器
-   「取消」：完全中止，不做任何變更
-   「不再提醒」：儲存偏好並繼續

### P2 - 智慧專案識別

**偵測規則**：

| 專案類型    | 識別檔案                                         |
| ----------- | ------------------------------------------------ |
| Node.js     | `package.json`                                   |
| Python      | `requirements.txt`, `setup.py`, `pyproject.toml` |
| Java Maven  | `pom.xml`                                        |
| Java Gradle | `build.gradle`                                   |
| .NET        | `*.csproj`, `*.sln`                              |
| Go          | `go.mod`                                         |

**警告訊息增強**：

```
偵測到 Node.js 專案。
這個專案還沒有 Blockly 積木...
```

### P3 - 使用者偏好記憶

**儲存位置**：`.vscode/settings.json`（工作區級別）

```json
{
	"singularBlockly.safetyGuard.suppressWarning": true
}
```

**特性**：

-   工作區級別，不跨專案
-   重置方式：刪除設定或設為 `false`

---

## 實作細節

### WorkspaceValidator 服務

```typescript
// src/services/workspaceValidator.ts
export interface ValidationResult {
	isBlocklyProject: boolean;
	detectedProjectType: ProjectType | null;
	shouldShowWarning: boolean;
}

export class WorkspaceValidator {
	async validate(workspaceFolder: vscode.Uri): Promise<ValidationResult> {
		// 1. 檢查 blockly/ 資料夾
		const blocklyExists = await this.checkBlocklyFolder(workspaceFolder);

		// 2. 檢查偏好設定
		const suppressWarning = this.checkSuppressSetting();

		// 3. 偵測專案類型
		const projectType = await this.detectProjectType(workspaceFolder);

		return {
			isBlocklyProject: blocklyExists,
			detectedProjectType: projectType,
			shouldShowWarning: !blocklyExists && !suppressWarning,
		};
	}
}
```

### 專案類型偵測

```typescript
async detectProjectType(folder: vscode.Uri): Promise<ProjectType | null> {
  const detectors: [string, ProjectType][] = [
    ['package.json', 'nodejs'],
    ['requirements.txt', 'python'],
    ['setup.py', 'python'],
    ['pyproject.toml', 'python'],
    ['pom.xml', 'java-maven'],
    ['build.gradle', 'java-gradle'],
    ['go.mod', 'go'],
  ];

  for (const [file, type] of detectors) {
    if (await this.fileExists(vscode.Uri.joinPath(folder, file))) {
      return type;
    }
  }

  // 檢查 .csproj / .sln
  const files = await vscode.workspace.fs.readDirectory(folder);
  for (const [name] of files) {
    if (name.endsWith('.csproj') || name.endsWith('.sln')) {
      return 'dotnet';
    }
  }

  return null;
}
```

### 對話框實作

```typescript
async showWarningDialog(projectType: ProjectType | null): Promise<'continue' | 'cancel' | 'suppress'> {
  const typeLabel = projectType
    ? `偵測到 ${this.getProjectTypeLabel(projectType)} 專案。\n`
    : '';

  const message = `${typeLabel}這個專案還沒有 Blockly 積木。如果繼續，會在這裡建立 blockly 資料夾和檔案。要繼續嗎？`;

  const result = await vscode.window.showWarningMessage(
    message,
    { modal: true },
    '繼續',
    '不再提醒'
  );

  if (result === '繼續') return 'continue';
  if (result === '不再提醒') return 'suppress';
  return 'cancel';
}
```

---

## 邊界情況處理

### 空工作區

```typescript
if (!vscode.workspace.workspaceFolders?.length) {
	await vscode.window.showInformationMessage('請先開啟一個資料夾，才能使用 Blockly 積木喔！');
	return;
}
```

### Multi-root Workspace

使用第一個根資料夾進行檢查：

```typescript
const primaryFolder = vscode.workspace.workspaceFolders[0];
```

### 防止重複對話框

```typescript
private isDialogShowing = false;

async showWarning(): Promise<void> {
  if (this.isDialogShowing) return;

  this.isDialogShowing = true;
  try {
    // 顯示對話框
  } finally {
    this.isDialogShowing = false;
  }
}
```

### 測試環境繞過

```typescript
if (process.env.NODE_ENV === 'test') {
	// 測試環境跳過警告
	return { shouldShowWarning: false };
}
```

---

## 驗收標準

1. ✅ 非 Blockly 專案 100% 顯示警告
2. ✅ 現有 Blockly 專案 0 延遲開啟
3. ✅ 正確識別 5+ 種專案類型
4. ✅ 偏好設定 100% 持久化成功
5. ✅ 對話框響應時間 < 100ms

---

## 相關文件

-   實作：`src/services/workspaceValidator.ts`
-   設定：`package.json` 中的 `configuration` 區段
