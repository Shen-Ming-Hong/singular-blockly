# Implementation Plan: 修復 MCP SDK 打包問題

**Branch**: `041-fix-mcp-bundling` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/041-fix-mcp-bundling/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修復打包後的 VS Code extension 中 MCP Server 因 `Cannot find module '@modelcontextprotocol/sdk/server/mcp.js'` 而無法啟動的問題。根因是 webpack 將 MCP SDK 和 zod 標記為 externals（不打包），但 `.vscodeignore` 排除了 `node_modules`，導致 runtime 找不到模組。

解決方案：移除 externals 聲明讓 webpack 完整打包 SDK 和 zod，並以自訂 resolve plugin 取代全域性的 `extensionAlias`，避免與 SDK 的 exports map 衝突。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (ES2023 target, Node16 module)  
**Primary Dependencies**: webpack 5.102.1, ts-loader 9.5.4, @modelcontextprotocol/sdk ^1.26.0, zod ^4.1.13  
**Storage**: N/A  
**Testing**: 編譯驗證（`npm run compile`）+ 輸出檔案內容檢查 + 端對端安裝測試  
**Target Platform**: Node.js (VS Code extension host + 獨立 MCP server 子程序)  
**Project Type**: single（VS Code extension）  
**Performance Goals**: MCP Server 啟動 ≤5 秒、webpack 編譯穩定無靜默失敗  
**Constraints**: `dist/mcp-server.js` < 5 MB、`.vsix` 體積增幅 < 20%  
**Scale/Scope**: 修改 1 個檔案（webpack.config.js）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態    | 說明                                                                            |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ 通過 | 自訂 resolve plugin ~15 行程式碼，邏輯清晰，有明確的意圖註解                    |
| II. Modularity and Extensibility      | ✅ 通過 | 僅修改 `mcpServerConfig`，不影響 `extensionConfig`（FR-006）                    |
| III. Avoid Over-Development           | ✅ 通過 | 最小改動解決核心問題，不引入新 npm 依賴                                         |
| IV. Flexibility and Adaptability      | ✅ 通過 | resolve plugin 設計泛用，未來新增 MCP 工具模組無需額外配置                      |
| V. Research-Driven Development        | ✅ 通過 | 已研究 SDK exports map、webpack extensionAlias 行為、替代方案（見 research.md） |
| VI. Structured Logging                | ✅ N/A  | 不涉及 runtime 邏輯，純建構配置修改                                             |
| VII. Comprehensive Test Coverage      | ✅ 通過 | 透過編譯驗證（exit code）和輸出檔案檢查驗證正確性                               |
| VIII. Pure Functions                  | ✅ N/A  | 建構配置，非 runtime 程式碼                                                     |
| IX. Traditional Chinese Documentation | ✅ 通過 | 所有規格文件使用繁體中文                                                        |
| X. Professional Release Management    | ✅ 通過 | 修復後將遵循標準發布流程                                                        |
| XI. Agent Skills Architecture         | ✅ N/A  | 不涉及 Agent Skills                                                             |

**Pre-Phase 0 Gate**: ✅ 全部通過  
**Post-Phase 1 Gate**: ✅ 全部通過（無新增複雜度或違反原則）

## Project Structure

### Documentation (this feature)

```text
specs/041-fix-mcp-bundling/
├── spec.md              # 需求規格
├── plan.md              # 本檔案（實作規劃）
├── research.md          # Phase 0 研究結果
├── quickstart.md        # 快速實作指南
├── checklists/
│   └── requirements.md  # 品質檢核清單
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
webpack.config.js        # 唯一需修改的檔案
```

本 feature 不新增任何源碼檔案，僅修改 webpack 建構配置。

**Structure Decision**: 單一檔案修改。`webpack.config.js` 中的 `mcpServerConfig` 區塊是唯一的修改目標。不影響 `extensionConfig` 區塊和專案其他結構。

## 實作方案

### 變更內容

修改 `webpack.config.js` 中的 `mcpServerConfig` 配置：

#### 1. 移除 SDK/zod 的 externals 聲明

**Before**:

```javascript
externals: {
    vscode: 'commonjs vscode',
    '@modelcontextprotocol/sdk/server/mcp.js': 'commonjs @modelcontextprotocol/sdk/server/mcp.js',
    '@modelcontextprotocol/sdk/server/stdio.js': 'commonjs @modelcontextprotocol/sdk/server/stdio.js',
    zod: 'commonjs zod',
},
```

**After**:

```javascript
externals: {
    vscode: 'commonjs vscode',
},
```

#### 2. 以自訂 resolve plugin 取代 extensionAlias

**Before**:

```javascript
resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
        '.js': ['.ts', '.js'],
    },
},
```

**After**:

```javascript
resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
        {
            // 自訂 resolver：僅對相對/絕對路徑的 .js import 嘗試 .ts 解析
            // 取代全域 extensionAlias 以避免與 SDK exports map 衝突
            apply(resolver) {
                const target = resolver.ensureHook('resolve');
                resolver.getHook('described-resolve')
                    .tapAsync('TsJsResolverPlugin', (request, resolveContext, callback) => {
                        const req = request.request;
                        if (
                            typeof req === 'string' &&
                            (req.startsWith('./') || req.startsWith('../') || req.startsWith('/')) &&
                            req.endsWith('.js')
                        ) {
                            const tsRequest = req.replace(/\.js$/, '.ts');
                            resolver.doResolve(
                                target,
                                { ...request, request: tsRequest },
                                'TsJsResolverPlugin: .js → .ts',
                                resolveContext,
                                (err, result) => {
                                    if (result) return callback(null, result);
                                    return callback(); // fallback to original .js
                                }
                            );
                        } else {
                            return callback();
                        }
                    });
            },
        },
    ],
},
```

#### 3. 更新註解

移除過時的 _"MCP server runs as standalone Node.js process with access to node_modules"_ 註解，替換為準確的說明。

### 為何不需要其他修改

- **tsconfig.json**: 不需修改，`module: Node16` 設定已正確
- **package.json**: 不需修改，`@modelcontextprotocol/sdk` 和 `zod` 已在 `dependencies` 中
- **src/mcp/\*.ts**: 不需修改，import 路徑保持 Node16 風格不變
- **mcpProvider.ts**: 不需修改，MCP server 啟動方式不變
- **.vscodeignore**: 不需特殊處理，完整打包後不再依賴 `node_modules`

### 設計決策紀錄

| 決策                | 選擇                | 替代方案                             | 理由                                         |
| ------------------- | ------------------- | ------------------------------------ | -------------------------------------------- |
| 打包策略            | 完整打包 SDK+zod    | 保持 externals + node_modules 白名單 | 17+ transitive deps 維護成本太高             |
| `.js`→`.ts` 解析    | 自訂 resolve plugin | `resolve-typescript-plugin` npm 套件 | ~15 行即可實現，避免新增依賴（原則 III）     |
| extensionAlias 處理 | 完全替換為 plugin   | 保持 + alias 映射                    | plugin 方案根本性解決衝突，不需逐一映射      |
| conditionNames      | 保持預設            | 明確設定 `['require', 'node']`       | webpack 自動處理，ESM 版本 tree-shaking 更佳 |

## Complexity Tracking

> 無原則違反需要辯護。
