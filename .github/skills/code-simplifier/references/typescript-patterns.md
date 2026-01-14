# TypeScript/JavaScript 簡化模式參考 TypeScript/JavaScript Simplification Patterns

本專案 (singular-blockly) 的程式碼簡化最佳實踐參考。

## Import 整理 Import Organization

```typescript
// ❌ 混亂的 imports
import { WebviewPanel } from 'vscode';
import * as path from 'path';
import { FileService } from '../services/fileService';
import * as vscode from 'vscode';
import { log } from '../services/logging';

// ✅ 整理後：按類型分組，字母排序
// 1. Node.js built-ins
import * as path from 'path';

// 2. Third-party packages
import * as vscode from 'vscode';
import { WebviewPanel } from 'vscode';

// 3. Internal modules
import { FileService } from '../services/fileService';
import { log } from '../services/logging';
```

## 函式宣告 Function Declarations

```typescript
// ❌ 頂層函式使用 arrow function
const processWorkspace = async (folder: vscode.WorkspaceFolder): Promise<void> => {
	// ...
};

// ✅ 頂層函式使用 function 關鍵字，並加入 return type
async function processWorkspace(folder: vscode.WorkspaceFolder): Promise<void> {
	// ...
}

// ✅ Arrow functions 適用於：callbacks、內聯函式
const items = data.map(item => item.value);
```

## 錯誤處理 Error Handling

```typescript
// ❌ 過度使用 try/catch
async function loadFile(path: string): Promise<string> {
	try {
		const content = await fs.readFile(path, 'utf8');
		return content;
	} catch (error) {
		throw error; // 無意義的 re-throw
	}
}

// ✅ 必要時才使用 try/catch，並有意義地處理
async function loadFile(path: string): Promise<string | null> {
	const exists = await fs.access(path).catch(() => false);
	if (!exists) {
		log(`File not found: ${path}`, 'warning');
		return null;
	}
	return fs.readFile(path, 'utf8');
}
```

## 條件邏輯 Conditional Logic

```typescript
// ❌ 巢狀三元運算子
const icon = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : status === 'error' ? '❌' : '❓';

// ✅ 使用物件映射
const statusIcons: Record<string, string> = {
	success: '✅',
	warning: '⚠️',
	error: '❌',
};
const icon = statusIcons[status] ?? '❓';
```

## Early Return Pattern

```typescript
// ❌ 深層巢狀
function validateBoard(board: Board | undefined, settings: Settings | undefined): boolean {
	if (board) {
		if (settings) {
			if (board.pins.length > 0) {
				if (settings.enabled) {
					return true;
				}
			}
		}
	}
	return false;
}

// ✅ Guard clauses
function validateBoard(board: Board | undefined, settings: Settings | undefined): boolean {
	if (!board || !settings) {
		return false;
	}
	if (board.pins.length === 0) {
		return false;
	}
	return settings.enabled;
}
```

## WebView Message Handling

```typescript
// ❌ 冗長的 switch case
switch (message.command) {
	case 'save':
		await handleSave(message);
		break;
	case 'load':
		await handleLoad(message);
		break;
	case 'compile':
		await handleCompile(message);
		break;
	default:
		log(`Unknown command: ${message.command}`, 'warning');
}

// ✅ 使用 handler map
const messageHandlers: Record<string, (msg: Message) => Promise<void>> = {
	save: handleSave,
	load: handleLoad,
	compile: handleCompile,
};

const handler = messageHandlers[message.command];
if (handler) {
	await handler(message);
} else {
	log(`Unknown command: ${message.command}`, 'warning');
}
```

## 移除冗餘 Remove Redundancy

```typescript
// ❌ 不必要的變數
const result = someFunction();
return result;

// ✅ 直接返回
return someFunction();

// ❌ 不必要的 else
if (condition) {
	return valueA;
} else {
	return valueB;
}

// ✅ 簡化
if (condition) {
	return valueA;
}
return valueB;
```

## Singular Blockly 專案特定模式 Project-Specific Patterns

### Generator Block 定義

```typescript
// ❌ 不一致的模式
arduinoGenerator['my_block'] = function (block: Block) {
	// ...
};

// ✅ 使用 forBlock 並取得 currentBoard
arduinoGenerator.forBlock['my_block'] = function (block: Block): string {
	const currentBoard = window.getCurrentBoard();
	// board-specific logic
	return code;
};
```

### 日誌記錄 Logging

```typescript
// ❌ 使用 console.log
console.log('Loading workspace...');

// ✅ 使用專案的 logging service
import { log } from '../services/logging';
log('Loading workspace...', 'info');

// WebView 中使用
log.info('Loading workspace...');
```

### File I/O

```typescript
// ❌ 直接使用 fs
import * as fs from 'fs';
const content = fs.readFileSync(filePath, 'utf8');

// ✅ 使用 FileService (支援 DI 測試)
import { FileService } from '../services/fileService';
const fileService = new FileService(workspacePath);
const content = await fileService.readFile(filePath);
```
