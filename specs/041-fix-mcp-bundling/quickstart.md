# Quickstart: 修復 MCP SDK 打包問題

**Feature**: 041-fix-mcp-bundling  
**預估時間**: 15 分鐘  
**修改範圍**: `webpack.config.js`（單一檔案）

## 快速實作步驟

### Step 1: 修改 webpack.config.js

修改 `mcpServerConfig` 區塊（約第 53-91 行），做三項變更：

1. **移除 externals 中的 SDK 和 zod**（僅保留 vscode）
2. **移除 `extensionAlias`**，替換為自訂 resolve plugin
3. **更新註解**

### Step 2: 編譯驗證

```powershell
npm run compile
```

確認：

- Exit code 為 0
- `dist/mcp-server.js` 成功產生
- 無靜默失敗

### Step 3: 輸出檢查

```powershell
# 確認 SDK 已被內聯打包（不應出現外部 require）
node -e "const fs = require('fs'); const c = fs.readFileSync('dist/mcp-server.js','utf8'); console.log('SDK external require:', c.includes('require(\"@modelcontextprotocol')); console.log('zod external require:', c.includes('require(\"zod\")'))"
# 兩者都應該輸出 false

# 檢查檔案大小
node -e "const fs = require('fs'); const s = fs.statSync('dist/mcp-server.js'); console.log((s.size/1024).toFixed(1) + ' KB')"
```

### Step 4: 功能測試

```powershell
# 直接執行 MCP server 測試模組載入
node dist/mcp-server.js
# 應看到 stderr 輸出: [Singular Blockly MCP Server] Started v1.0.0
# 然後等待 STDIO 輸入（Ctrl+C 中斷即可）
```

### Step 5: extension 完整測試

```powershell
npm test
```

## 修改參照

完整的變更內容請參閱 [plan.md](plan.md) 的「實作方案」章節。
