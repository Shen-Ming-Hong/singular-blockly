---
name: security-checker
description: 編輯程式碼時的安全檢查技能。當使用者編輯檔案、修改程式碼、或進行 code review 時自動啟用。監控命令注入、XSS、eval 使用、敏感資料外洩、不安全的 postMessage 等安全風險。靈感來源於 Anthropic 官方 security-guidance plugin。Security checking skill that monitors for potential security issues when editing code, including command injection, XSS, eval usage, credential exposure, and unsafe postMessage patterns. Inspired by Anthropic's official security-guidance plugin.
metadata:
    author: singular-blockly
    version: '1.0.0'
    category: security
    inspired-by: anthropics/claude-code/plugins/security-guidance
license: Apache-2.0
---

# 程式碼安全檢查技能 Security Checker Skill

編輯程式碼時主動偵測潛在安全風險，防止漏洞進入程式碼庫。
Proactively detect potential security risks when editing code, preventing vulnerabilities from entering the codebase.

## 核心原則 Core Principles

> **安全優先**：寧可誤報，也不要漏報安全問題。
> **Security First**: Better to have false positives than miss security issues.

## 適用情境 When to Use

-   編輯任何程式碼檔案時
-   進行 Code Review 時
-   實作涉及使用者輸入的功能
-   處理 WebView ↔ Extension Host 通訊
-   修改檔案操作或命令執行邏輯

## 監控模式 Monitored Patterns

### 🔴 Critical：命令注入 Command Injection

**檢測模式**：

```typescript
// ❌ 危險：未驗證的字串插值
exec(`git commit -m "${userInput}"`);
spawn('bash', ['-c', userInput]);
child_process.execSync(command + userInput);

// ❌ 危險：shell: true 配合動態命令
spawn(cmd, args, { shell: true });
```

**安全替代**：

```typescript
// ✅ 使用陣列參數避免 shell 解析
spawn('git', ['commit', '-m', userInput], { shell: false });

// ✅ 驗證/清理輸入
const sanitized = userInput.replace(/[;&|`$]/g, '');
```

**專案特定注意**：

-   `run_in_terminal` 工具執行的命令
-   `arduinoUploader.ts` 和 `micropythonUploader.ts` 的命令組建

---

### 🔴 Critical：XSS 與不安全 HTML Cross-Site Scripting

**檢測模式**：

```typescript
// ❌ 危險：直接插入 HTML
element.innerHTML = userInput;
document.write(userInput);
webview.html = `<div>${untrustedData}</div>` // ❌ 危險：WebView 中的動態腳本
`<script>${dynamicCode}</script>`;
```

**安全替代**：

```typescript
// ✅ 使用 textContent
element.textContent = userInput;

// ✅ WebView 使用 CSP
const csp = "default-src 'none'; script-src ${webview.cspSource};";

// ✅ 使用模板字面值時轉義
function escapeHtml(str) {
	return str.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}
```

**專案特定注意**：

-   `blocklyEdit.html` 的動態內容
-   `webviewManager.ts` 的 `getWebviewContent()`
-   使用者自定義的積木標籤文字

---

### 🔴 Critical：不安全的 postMessage Unsafe postMessage

**檢測模式**：

```typescript
// ❌ 危險：未驗證來源
window.addEventListener('message', event => {
	// 直接處理 event.data 而不檢查 origin
	handleMessage(event.data);
});

// ❌ 危險：發送到任意來源
window.postMessage(data, '*');
```

**安全替代**：

```typescript
// ✅ 驗證訊息來源（WebView 中）
window.addEventListener('message', event => {
	// VS Code WebView 的訊息來自 extension host
	if (event.source !== window) return;
	handleMessage(event.data);
});

// ✅ Extension 端使用 panel.webview.postMessage()
// 這是 VS Code 提供的安全 API
panel.webview.postMessage({ command: 'update', data: safeData });
```

**專案特定注意**：

-   `media/js/blocklyEdit.js` 的 `window.addEventListener('message', ...)`
-   `src/webview/messageHandler.ts` 的訊息處理
-   確保 `vscode.postMessage()` 只傳遞預期的 command

---

### 🟠 High：eval 與動態程式碼執行 Dynamic Code Execution

**檢測模式**：

```typescript
// ❌ 危險：動態程式碼執行
eval(code);
new Function(userInput);
setTimeout(codeString, 0);
setInterval(codeString, 1000);

// ❌ 危險：動態 import
import(userControlledPath);
require(dynamicPath);
```

**安全替代**：

```typescript
// ✅ 使用物件映射取代 eval
const handlers = {
	action1: handleAction1,
	action2: handleAction2,
};
handlers[action]?.();

// ✅ 使用函數參考
setTimeout(myFunction, 0);
```

**專案特定注意**：

-   Blockly generators 不應執行使用者定義的程式碼
-   MCP 工具的輸入驗證（已使用 Zod）

---

### 🟠 High：敏感資料外洩 Credential Exposure

**檢測模式**：

```typescript
// ❌ 危險：硬編碼憑證
const apiKey = 'sk-1234567890abcdef';
const password = 'admin123';
const secret = 'my-secret-token';

// ❌ 危險：日誌中包含敏感資訊
console.log('User token:', token);
log.info(`API Key: ${apiKey}`);
```

**安全替代**：

```typescript
// ✅ 使用環境變數
const apiKey = process.env.API_KEY;

// ✅ 使用 VS Code SecretStorage
const secret = await context.secrets.get('mySecret');

// ✅ 日誌時遮蔽敏感資訊
log.info(`Token: ${token.substring(0, 4)}****`);
```

**專案特定注意**：

-   `platformio.ini` 中不應包含 WiFi 密碼
-   MQTT broker 憑證應使用變數

---

### 🟠 High：不安全的檔案操作 Unsafe File Operations

**檢測模式**：

```typescript
// ❌ 危險：路徑遍歷
fs.readFileSync(userPath)
fs.writeFileSync(`${basePath}/${userInput}`)

// ❌ 危險：未驗證的檔案類型
if (filename.endsWith('.json')) // 可被繞過
```

**安全替代**：

```typescript
// ✅ 驗證路徑在允許範圍內
const safePath = path.resolve(basePath, userInput);
if (!safePath.startsWith(basePath)) {
	throw new Error('Path traversal detected');
}

// ✅ 使用 FileService 而非直接 fs 操作
const content = await fileService.readFile(safePath);
```

**專案特定注意**：

-   `FileService` 是唯一允許的檔案操作介面
-   `main.json` 的讀寫必須透過 `FileService`
-   備份檔案路徑驗證

---

### 🟡 Medium：不安全的反序列化 Unsafe Deserialization

**檢測模式**：

```typescript
// ❌ 危險：未驗證的 JSON 解析後直接使用
const data = JSON.parse(userInput);
executeCommand(data.command);

// ❌ 危險：pickle/yaml 反序列化（Python 相關）
pickle.loads(userInput);
yaml.load(userInput); // 使用 unsafe loader
```

**安全替代**：

```typescript
// ✅ 使用 Zod 驗證結構
const schema = z.object({
	command: z.enum(['save', 'load', 'update']),
	data: z.string(),
});
const validated = schema.parse(JSON.parse(userInput));

// ✅ 專案已使用的模式
import { z } from 'zod';
const inputSchema = z.object({ blockType: z.string() });
```

**專案特定注意**：

-   MCP 工具已正確使用 Zod 驗證
-   `main.json` 載入時應驗證結構

---

### 🟡 Medium：os.system 與 shell 命令 Shell Commands

**檢測模式**：

```typescript
// ❌ 危險：直接執行 shell 命令
os.system(command);
subprocess.call(command, (shell = True));
require('child_process').execSync(cmd);
```

**專案特定注意**：

-   PlatformIO 命令應使用 `spawn` 而非 `exec`
-   mpremote 命令組建需驗證參數

---

## 專案特定安全規則 Project-Specific Security Rules

### WebView 通訊安全

```typescript
// ✅ 正確的 messageHandler 模式
case 'saveWorkspace':
    // 驗證 message 結構
    if (!message.state || typeof message.state !== 'object') {
        log('Invalid workspace state', 'error')
        return
    }
    await this.handleSaveWorkspace(message)
    break
```

### FileService 使用規範

```typescript
// ✅ 所有檔案操作必須透過 FileService
import { FileService } from '../services/fileService';

// ❌ 禁止直接使用 fs
import * as fs from 'fs'; // 應該使用 FileService
```

### 日誌安全

```typescript
// ✅ 使用 logging.ts 的 log() 函數
import { log } from '../services/logging';
log('Operation completed', 'info');

// ❌ 禁止 console.log（可能外洩資訊）
console.log('Debug:', sensitiveData); // WebView 例外
```

---

## 檢查清單 Checklist

### 編輯前 Before Editing

-   [ ] 確認修改的檔案類型和風險等級
-   [ ] 檢查是否涉及使用者輸入處理
-   [ ] 確認是否涉及 WebView 通訊

### 編輯時 During Editing

-   [ ] 未使用 `eval()` 或 `new Function()`
-   [ ] 未使用 `innerHTML` 插入未轉義的內容
-   [ ] 未硬編碼任何憑證或 API 金鑰
-   [ ] 命令執行使用陣列參數而非字串連接
-   [ ] 檔案操作透過 `FileService`
-   [ ] postMessage 通訊有適當的來源驗證

### 編輯後 After Editing

-   [ ] 執行 `npm run lint` 檢查程式碼品質
-   [ ] 執行 `npm test` 確認無回歸
-   [ ] 檢查 git diff 無意外的敏感資訊

---

## 警告訊息範本 Warning Message Templates

當偵測到潛在安全問題時，使用以下格式提醒：

````markdown
⚠️ **安全警告 Security Warning**

偵測到潛在的 {issue_type}：
Detected potential {issue_type}:

**檔案 File**: `{file_path}:{line_number}`
**問題 Issue**: {description}
**風險等級 Severity**: {Critical|High|Medium|Low}

**建議修正 Suggested Fix**:

```code
{safe_alternative}
```
````

**參考資料 Reference**: {link_or_doc}

```

---

## 相關資源 Related Resources

-   [Anthropic security-guidance plugin](https://github.com/anthropics/claude-code/tree/main/plugins/security-guidance) - 本技能靈感來源
-   [VS Code WebView Security](https://code.visualstudio.com/api/extension-guides/webview#security)
-   [OWASP Top 10](https://owasp.org/www-project-top-ten/)
-   [專案 copilot-instructions.md](../../copilot-instructions.md) - 專案架構說明
```
