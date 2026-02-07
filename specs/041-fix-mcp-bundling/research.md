# Research: 修復 MCP SDK 打包問題

**Created**: 2026-02-08  
**Feature**: 041-fix-mcp-bundling

## 研究問題

1. `extensionAlias` 與 SDK exports map 的衝突機制
2. 移除 `extensionAlias` 後如何處理 Node16 風格 `.js` import
3. 完整打包 SDK 後的體積影響
4. MCP SDK 的 transitive dependencies 是否有 webpack 打包問題

---

## 決策 1：extensionAlias 衝突的根因與解法

### 決策

使用自訂 webpack resolve plugin 取代 `extensionAlias`，僅對非 `node_modules` 的 `.js` import 執行 `.ts` 回退解析。

### 理由

`extensionAlias: { '.js': ['.ts', '.js'] }` 是**全域性的**——它會影響所有 `.js` 解析，包括 `node_modules` 中的套件。衝突流程如下：

1. `import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'`
2. Webpack 用 exports map `"./*"` 得到 `./dist/esm/server/mcp.js`
3. `extensionAlias` 介入，**先嘗試** `./dist/esm/server/mcp.ts`（不存在！）
4. 某些邊界情況下 fallback 失敗，導致 webpack 靜默退出（exit code 1）

自訂 resolve plugin 可以限制作用範圍：僅當解析來源（issuer）不在 `node_modules` 中時，才嘗試 `.js` → `.ts` 轉換。

### 考慮過的替代方案

| 方案                                                    | 優點                  | 為何捨棄                                                                                                            |
| ------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 直接移除 `extensionAlias`                               | 最簡單                | MCP server 使用 Node16 風格 `.js` import（如 `from './tools/blockQuery.js'`），移除後 webpack 無法解析到 `.ts` 檔案 |
| `resolve-typescript-plugin` npm 套件                    | 專為此問題設計        | 新增外部依賴；自訂 plugin 僅需 ~15 行程式碼即可實現相同效果                                                         |
| `resolve.alias` 明確映射 SDK 路徑                       | 不需改 extensionAlias | SDK 有多個 sub-path export，需逐一映射，且 transitive dependencies 也可能受影響                                     |
| 保持 externals + 在 `.vscodeignore` 中包含 node_modules | 改動最小              | SDK 依賴鏈很深（express, hono, cors, jose 等 17+ 套件），需手動追蹤所有 transitive dependencies                     |

---

## 決策 2：Import 風格差異的處理

### 決策

保持 MCP server 的 Node16 風格 `.js` import 不變，透過 resolve plugin 處理。

### 理由

專案中存在兩種 import 風格：

| 配置              | Import 風格       | 範例                           |
| ----------------- | ----------------- | ------------------------------ |
| `extensionConfig` | 無副檔名          | `from './services/logging'`    |
| `mcpServerConfig` | Node16 `.js` 後綴 | `from './tools/blockQuery.js'` |

`extensionConfig` 不需要 `extensionAlias`，因為 `resolve.extensions: ['.ts', '.js']` 已夠用（無副檔名時自動搜尋）。`mcpServerConfig` 的 `.js` import 需要額外處理，因為 webpack 的 `resolve.extensions` 只在 import **沒有副檔名**時生效。

更改 MCP server 的 import 風格（移除 `.js` 後綴）雖然可行，但會偏離 `tsconfig.json` 的 `module: Node16` 規範，且需修改所有 MCP 相關檔案，增加改動範圍。

### 考慮過的替代方案

| 方案                         | 為何捨棄                                                    |
| ---------------------------- | ----------------------------------------------------------- |
| 修改 MCP 檔案移除 `.js` 後綴 | 增加修改範圍、偏離 Node16 規範、TypeScript 編譯器會產生警告 |

---

## 決策 3：SDK 打包策略

### 決策

移除 `@modelcontextprotocol/sdk` 和 `zod` 的 externals 聲明，讓 webpack 完整打包。

### 理由

MCP server 作為獨立 Node.js 子程序執行，其 `cwd` 為使用者工作區（不含 SDK）。打包後的 extension 安裝目錄中沒有 `node_modules`（被 `.vscodeignore` / `.gitignore` 排除）。因此 runtime 的 `require()` 呼叫無法找到 SDK 模組。

完整打包後：

- `dist/mcp-server.js` 將是自包含的（self-contained），僅依賴 Node.js 內建模組
- 預估體積增長：目前 152.9 KB → 估計 1-3 MB（SDK 有大量依賴如 express、hono）
- 但 MCP server 只使用 STDIO transport，tree-shaking（production mode）可排除 HTTP/SSE 相關模組

### 考慮過的替代方案

以上「決策 1」中已列出。

---

## 決策 4：SDK exports map 解析的 conditionNames

### 決策

保持 webpack 預設行為，不明確設定 `conditionNames`。

### 理由

webpack 5 會根據原始碼的語法自動選擇 condition：

- `import` 語法 → 匹配 `"import"` condition → `./dist/esm/*`
- `target: 'node'` → 匹配 `"node"` condition

MCP SDK 的 ESM 和 CJS 版本功能相同，使用 ESM 版本（webpack 預設）可獲得更好的 tree-shaking 效果。

---

## 技術發現

### MCP SDK 依賴鏈

SDK v1.26.0 的直接 dependencies 有 17 個套件，包括：

- `express` ^5.2.1（HTTP transport，STDIO 模式不使用）
- `hono` ^4.11.4（HTTP framework，STDIO 模式不使用）
- `cors` ^2.8.5（HTTP middleware）
- `jose` ^6.1.3（JWT 認證）
- `eventsource` ^3.0.2（SSE client）
- `zod` ^3.25 || ^4.0（schema validation，核心使用）
- `cross-spawn` ^7.0.5（process spawning）

**關鍵觀察**：MCP server 僅使用 STDIO transport，大部分 HTTP/SSE 依賴在 tree-shaking 後可能被移除。但 `mode: 'none'` 下不會執行 tree-shaking，可能需要在 production build 時才能看到效果。

### 開發/生產模式差異

- `mode: 'none'`（開發）：不執行 minification 和 tree-shaking
- `mode: 'production'`（`npm run package`）：執行完整優化

體積在開發模式下可能較大，但不影響功能。production build 會顯著減小體積。

### Webpack 已知問題

在 `modelcontextprotocol/typescript-sdk` GitHub repo 中**沒有找到**任何 webpack 打包相關的 issue。SDK 的 CJS 和 ESM 雙格式輸出是標準做法，webpack 5 完全支援。
