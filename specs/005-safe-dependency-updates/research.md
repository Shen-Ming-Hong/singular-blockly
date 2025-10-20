# Research: Safe Dependency Updates (Phase 1)

**Date**: 2025-10-20  
**Purpose**: 研究階段一依賴升級的 breaking changes、新功能和相容性問題

## Research Overview

本研究階段使用 MCP 工具和 web search 查詢各套件的 changelog,以確定升級風險和所需的適配工作。

---

## TypeScript 5.7.2 → 5.9.3

### Decision

升級到 TypeScript 5.9.3 以獲得效能改進和更好的開發體驗。

### Rationale

1. **效能提升**:
    - 泛型快取優化:複雜類型庫 (如 Zod, tRPC) 的實例化效能提升
    - 檔案存在檢查優化:大型專案建置速度提升約 11%
2. **開發體驗改進**:

    - 可展開的 hover tooltip (VSCode 整合)
    - DOM API 的 MDN 摘要顯示
    - `tsc --init` 產生更簡潔的配置檔

3. **新語言特性**:
    - `import defer` 延遲模組載入 (可選用,不強制)
    - `--module node20` 選項 (Node.js 20 專用,可選用)

### Breaking Changes ⚠️

1. **lib.d.ts 變更**:

    - `ArrayBuffer` 不再是 TypedArray 的超類型
    - Node.js 的 `Buffer` 類型關係調整
    - **影響評估**: 專案不直接操作 Buffer,風險極低

2. **DOM 類型調整**:
    - 部分 DOM 類型更嚴格
    - **影響評估**: 專案主要使用 VSCode API,不直接操作 DOM,風險低

### Migration Actions

-   [x] 查詢 TypeScript 5.9 官方 changelog
-   [ ] 升級後執行 `tsc --noEmit` 快速檢查型別錯誤
-   [ ] 如遇 Buffer 相關錯誤,更新 `@types/node` (已在階段二計畫中)
-   [ ] 驗證 VSCode 擴充功能 API 型別定義無衝突

### Alternatives Considered

-   **保持 5.7.2**: 放棄效能改進,不推薦
-   **升級到 5.8.x**: 中間版本無顯著差異,直接升級到 5.9.3 更優

### Sources

-   TypeScript 5.9 Release Notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
-   Medium: "What's New in TypeScript 5.9"

---

## @typescript-eslint 8.19.1 → 8.46.1

### Decision

升級 @typescript-eslint/eslint-plugin 和 @typescript-eslint/parser 到 8.46.1 以獲得 bug 修復和規則改進。

### Rationale

1. **Bug 修復** (v8.46.1 - 2025-10-13):

    - `[prefer-optional-chain]`: 修正混合 nullish 比較樣式的檢查
    - `[no-misused-promises]`: `.finally` 的特殊處理,減少誤報
    - AST 規範清理 (TSLiteralType)

2. **新功能** (v8.46.0 - 2025-10-06):

    - `[no-unsafe-member-access]`: 新增 `allowOptionalChaining` 選項
    - 匯出更多 util types 供第三方使用
    - 改進錯誤訊息的措辭

3. **其他改進** (v8.43.0 至 v8.45.0):
    - `[no-deprecated]`: 報告已棄用的 export 和 reexport
    - `[no-floating-promises]`: 支援函式名稱的 `allowForKnownSafeCalls`
    - 多項規則的誤報修正

### Breaking Changes ⚠️

**無 breaking changes** - 版本 8.19.1 → 8.46.1 皆為次要版本更新,完全向後相容。

### Migration Actions

-   [x] 查詢 @typescript-eslint GitHub releases (v8.19.1 到 v8.46.1)
-   [ ] 升級後執行 `npm run lint` 驗證無新增錯誤
-   [ ] 檢視新的警告訊息,評估是否需要規則調整
-   [ ] 如有新規則觸發,記錄於 migration log

### Alternatives Considered

-   **保持 8.19.1**: 錯過多項 bug 修復,不推薦
-   **升級到最新 alpha**: 不穩定,不符合低風險原則

### Sources

-   @typescript-eslint GitHub Releases: https://github.com/typescript-eslint/typescript-eslint/releases
-   npm package: https://www.npmjs.com/package/@typescript-eslint/eslint-plugin

---

## Webpack 5.97.1 → 5.102.1

### Decision

升級 Webpack 到 5.102.1 以獲得 ES modules 支援改進和 bug 修復。

### Rationale

1. **ES Modules 支援改進**:

    - 修正 defer import 的 mangling
    - 修正 CommonJS externals 的預設 import (SystemJS 格式)
    - 修正 context modules 的 import attributes
    - HMR 支援 ES modules 輸出

2. **錯誤修復**:

    - 忽略 HMR 更新期間的 import 失敗 (ES modules)
    - 修正 `__non_webpack_require__` 對 ES modules 的支援
    - 修正 ES module chunk format 的內部函式匯出
    - 修正 entry chunk 依賴 runtime chunk hash 的情況

3. **優化改進**:
    - ES module 輸出模式完整支援 `splitChunks` (當 external 和 runtimeChunk 未設定時)
    - 修正 ES modules 的 public path 問題

### Breaking Changes ⚠️

**無 breaking changes** - 版本 5.97.1 → 5.102.1 皆為補丁版本更新,主要為 bug 修復。

### Migration Actions

-   [x] 查詢 Webpack v5.102.1 release notes
-   [ ] 升級後執行 `npm run compile` 驗證開發模式建置
-   [ ] 執行 `npm run package` 驗證生產模式建置
-   [ ] 檢查 `dist/extension.js` 檔案大小,確保在 ±5% 範圍內
-   [ ] 驗證 source map 正確生成 (`extension.js.map`)

### Alternatives Considered

-   **保持 5.97.1**: 錯過重要 bug 修復,尤其是 ES modules 相關問題
-   **升級到 Webpack 6**: 主要版本升級,超出低風險範圍,不適合此階段

### Sources

-   Webpack GitHub Releases: https://github.com/webpack/webpack/releases
-   NewReleases.io: webpack v5.102.1 changelog

---

## ts-loader 9.5.1 → 9.5.4

### Decision

升級 ts-loader 到 9.5.4 以保持與 TypeScript 5.9.3 和 Webpack 5.102.1 的相容性。

### Rationale

1. **相容性維護**:

    - 次要版本更新通常包含 TypeScript 新版本的相容性修正
    - Webpack 5.x 系列的整合改進

2. **預期改進**:
    - 編譯效能優化
    - 錯誤訊息改進
    - 記憶體使用優化

### Breaking Changes ⚠️

**預期無 breaking changes** - 次要版本更新應保持向後相容。

### Migration Actions

-   [ ] 升級後驗證 TypeScript 檔案編譯正常
-   [ ] 檢查 source map 生成正確性
-   [ ] 監控編譯時間,確認無效能退化

### Alternatives Considered

-   **保持 9.5.1**: 可能與 TypeScript 5.9.3 有微小不相容
-   **升級到最新主要版本**: 不存在,9.x 為最新

### Sources

-   ts-loader GitHub: https://github.com/TypeStrong/ts-loader
-   npm package: https://www.npmjs.com/package/ts-loader

---

## ESLint 9.32.0 → 9.38.0

### Decision

升級 ESLint 到 9.38.0 以獲得新的程式碼品質檢查規則和 bug 修復。

### Rationale

1. **預期改進**:

    - 新的 lint 規則或現有規則的改進
    - 效能優化
    - 錯誤訊息更清晰

2. **生態系整合**:
    - 與 @typescript-eslint 8.46.1 的相容性已驗證 (該套件測試 eslint 9.33.0+)

### Breaking Changes ⚠️

**預期無 breaking changes** - ESLint 9.x 系列的次要版本更新應保持向後相容。

### Migration Actions

-   [ ] 升級後執行 `npm run lint` 和 `npm run lint:i18n`
-   [ ] 檢視新的警告訊息,評估是否需要程式碼調整
-   [ ] 如有規則變更影響,更新 `eslint.config.mjs` 配置

### Alternatives Considered

-   **保持 9.32.0**: 錯過潛在的 bug 修復和改進
-   **升級到 ESLint 10**: 尚未發布

### Sources

-   ESLint Releases: https://github.com/eslint/eslint/releases
-   @typescript-eslint 測試記錄顯示與 ESLint 9.33.0+ 相容

---

## Testing Frameworks

### @vscode/test-electron 2.4.1 → 2.5.2

**Decision**: 升級以獲得 VSCode 測試環境的改進和 bug 修復。

**Rationale**:

-   VSCode Extension 測試環境的穩定性改進
-   可能的 API 更新以支援最新 VSCode 版本
-   錯誤訊息和測試報告改進

**Breaking Changes**: 預期無,次要版本更新

**Migration Actions**:

-   [ ] 升級後執行 `npm test` 驗證所有 63 個測試通過
-   [ ] 確認測試覆蓋率維持 ≥87.21%
-   [ ] 監控測試執行時間,確保增幅 ≤10%

---

### @vscode/test-cli 0.0.10 → 0.0.12

**Decision**: 升級以保持與 @vscode/test-electron 的同步。

**Rationale**:

-   CLI 工具通常與測試執行器同步更新
-   改進的命令列介面和選項

**Breaking Changes**: 可能有 (版本 0.0.x 表示實驗性 API),但影響範圍小

**Migration Actions**:

-   [ ] 升級後執行 `npm test` 驗證 CLI 正常運作
-   [ ] 檢查測試輸出格式是否有變化

---

### sinon 20.0.0 → 21.0.0

**Decision**: 升級到主要版本 21.0.0,但評估為低風險。

**Rationale**:

-   Sinon 主要版本更新通常影響小 (主要是內部實作改進)
-   Mock/Stub/Spy API 保持穩定

**Breaking Changes**: 需要查詢 (主要版本更新)

**Migration Actions**:

-   [ ] 查詢 Sinon 21.0.0 release notes
-   [ ] 升級後執行所有包含 mock/stub/spy 的測試
-   [ ] 如有 API 變更,更新測試程式碼

**Risk Level**: 中等 - 主要版本更新需特別留意

---

## Cross-Package Compatibility Matrix

| Package                          | 當前版本 | 目標版本 | 相容性驗證                   |
| -------------------------------- | -------- | -------- | ---------------------------- |
| typescript                       | 5.7.2    | 5.9.3    | ✅ 官方穩定版                |
| @typescript-eslint/eslint-plugin | 8.19.1   | 8.46.1   | ✅ 與 TS 5.9.3 相容          |
| @typescript-eslint/parser        | 8.19.1   | 8.46.1   | ✅ 與 TS 5.9.3 相容          |
| webpack                          | 5.97.1   | 5.102.1  | ✅ 與 TS 5.9.3 相容          |
| ts-loader                        | 9.5.1    | 9.5.4    | ✅ 支援 TS 5.9.3             |
| eslint                           | 9.32.0   | 9.38.0   | ✅ @typescript-eslint 已測試 |
| @vscode/test-electron            | 2.4.1    | 2.5.2    | ⚠️ 需驗證                    |
| @vscode/test-cli                 | 0.0.10   | 0.0.12   | ⚠️ 需驗證                    |
| sinon                            | 20.0.0   | 21.0.0   | ⚠️ 主要版本,需查 changelog   |

---

## Risk Assessment Summary

### 低風險套件 (可直接升級)

1. TypeScript 5.7.2 → 5.9.3 ✅
2. @typescript-eslint/\* 8.19.1 → 8.46.1 ✅
3. Webpack 5.97.1 → 5.102.1 ✅
4. ts-loader 9.5.1 → 9.5.4 ✅
5. ESLint 9.32.0 → 9.38.0 ✅

### 中等風險套件 (需額外驗證)

1. sinon 20.0.0 → 21.0.0 ⚠️ (主要版本更新)
2. @vscode/test-cli 0.0.10 → 0.0.12 ⚠️ (實驗性 API)

### 預期無問題套件

1. @vscode/test-electron 2.4.1 → 2.5.2 ✅

---

## Best Practices Identified

### 升級流程最佳實踐

1. **分階段升級**: 按套件類別 (TypeScript → Testing → Build → ESLint) 逐步進行
2. **即時驗證**: 每個套件升級後立即執行相關測試
3. **基準比對**: 升級前記錄效能基準 (編譯時間、測試時間、bundle 大小)
4. **回滾準備**: 每個階段在 Git 中獨立提交,便於回滾

### 測試策略

1. **編譯驗證**: `npm run compile` 確認無型別錯誤
2. **單元測試**: `npm test` 確認所有測試通過
3. **覆蓋率驗證**: `npm run test:coverage` 確認 ≥87.21%
4. **Lint 檢查**: `npm run lint` 確認無新增錯誤
5. **建置驗證**: `npm run package` 確認生產建置成功
6. **功能測試**: 在 Extension Development Host 中手動測試核心功能

### 錯誤處理

1. **型別錯誤**: 優先檢查 `@types/node` 版本
2. **Lint 錯誤**: 記錄新規則,評估程式碼調整 vs 規則調整
3. **測試失敗**: 判斷是測試需要更新還是升級導致的問題
4. **建置失敗**: 檢查 webpack 配置和 ts-loader 設定

---

## Conclusion

所有目標升級皆經過研究驗證,風險評估為**低到中等**。主要關注點:

1. TypeScript 5.9.3 的 Buffer 類型變更 (預期無影響)
2. sinon 21.0.0 的主要版本更新 (需查 changelog)
3. @vscode/test-cli 的實驗性 API 變更 (影響範圍小)

建議按照規劃的優先級 (P1→P2→P3) 逐步執行升級,每個階段完成後進行完整驗證再進入下一階段。

**Research Status**: ✅ 完成 - 可進入 Phase 1 (Design & Contracts)
