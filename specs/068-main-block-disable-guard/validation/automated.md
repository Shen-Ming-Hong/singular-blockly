# 自動化驗證結果

日期：2026-08-18

| 命令 | 結果 |
|---|---|
| `npm run release:prepare` | 通過，版本契約為 `v0.87.3` |
| `npm run ci:static` | 通過；Project Skill、managed runtime、compile、lint、i18n 與 release 契約均通過 |
| `npm run test:unit:ci` | 1259 passing、1 pending、0 failing |
| `npm run compile-tests` | 通過 |
| `npm run lint` | 通過，0 errors、0 warnings |
| `npm run validate:i18n` | 通過，15 locales、0 errors |
| `npm run test:i18n` | 21 passing |
| `npm run compile` | webpack 通過 |
| `npm test`／完整 unit runner | 實作收斂階段 1258 passing、1 pending、0 failing |
| `npm run test:integration` | 9 passing、3 pending；pending 為環境未登入 GitHub Copilot 的既有 real-API 測試 |
| `npm run test:coverage` | unit 1256 passing、3 pending；integration 9 passing、3 pending；0 failing |
| `npm run package` | production webpack 通過 |

Coverage summary：

- Statements：71.95%（38364/53319）
- Branches：74.63%（10154/13605）
- Functions：11.8%（3467/29365）
- Lines：71.95%（38364/53319）

備註：一次在 webpack 與完整 Electron suite 連續高負載下，既有 `PlatformioProcess` bounded-output 案例觸發 5 秒 timeout；該 suite 隨即獨立重跑為 6/6 passing，之後 coverage 全套與最終完整 unit runner 均通過。
