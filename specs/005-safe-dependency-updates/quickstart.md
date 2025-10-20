# Quick Start Guide: Safe Dependency Updates

**Feature**: 005-safe-dependency-updates  
**Date**: 2025-10-20  
**Target Audience**: 開發者 (執行依賴升級任務)

## Overview

本指南提供逐步執行依賴升級的流程,包含前置檢查、升級步驟、驗證流程和問題排查。整個升級過程分為四個優先級階段,每個階段獨立執行和驗證,確保可回滾性。

**預估時間**: 2-3 小時 (含所有驗證和測試)

---

## Prerequisites (前置準備)

### 1. 環境檢查

確認開發環境符合要求:

```powershell
# 1. 檢查 Node.js 版本 (需要 >= 20.x)
node --version
# 預期輸出: v20.x.x 或更高

# 2. 檢查 npm 版本 (需要 >= 10.x)
npm --version
# 預期輸出: 10.x.x 或更高

# 3. 確認專案依賴已安裝
npm list --depth=0
# 應列出所有 devDependencies,無錯誤

# 4. 驗證當前測試狀態 (建立基準)
npm test
# 預期: All 63 tests pass

# 5. 驗證當前測試覆蓋率 (建立基準)
npm run test:coverage
# 預期: >= 87.21% coverage
```

### 2. Git 狀態確認

確保工作目錄乾淨,便於追蹤升級變更:

```powershell
# 1. 確認在正確的分支
git branch
# 預期: * 005-safe-dependency-updates

# 2. 檢查工作目錄狀態
git status
# 預期: nothing to commit, working tree clean

# 3. 如有未提交的變更,先 stash 或 commit
git stash push -m "Pre-upgrade backup"
```

### 3. 建立效能基準

記錄升級前的效能數據,用於後續比對:

```powershell
# 1. 記錄編譯時間
Measure-Command { npm run compile }
# 記錄 TotalSeconds 值

# 2. 記錄測試執行時間
Measure-Command { npm test }
# 記錄 TotalSeconds 值

# 3. 記錄 lint 時間
Measure-Command { npm run lint }
# 記錄 TotalSeconds 值

# 4. 記錄建置產出大小
Get-ChildItem dist/extension.js | Select-Object Length, Name
# 記錄檔案大小 (bytes)
```

**建議**: 將上述數據記錄到 `specs/005-safe-dependency-updates/data/performance-baseline.json` 中:

```json
{
	"version": "baseline",
	"timestamp": "2025-10-20T10:00:00Z",
	"compilation": {
		"duration": 45000
	},
	"testing": {
		"duration": 120000,
		"totalTests": 63
	},
	"lint": {
		"duration": 25000
	},
	"build": {
		"developmentDuration": 45000,
		"productionDuration": 150000,
		"bundleSize": 1234567
	}
}
```

---

## Upgrade Execution (升級執行)

### Stage P1: TypeScript Ecosystem (優先級 1)

**套件**: typescript, @typescript-eslint/eslint-plugin, @typescript-eslint/parser

#### Step 1: 升級 TypeScript

```powershell
# 1. 升級 TypeScript 到 5.9.3
npm update typescript@5.9.3

# 2. 確認版本更新
npm list typescript
# 預期: typescript@5.9.3

# 3. 立即執行編譯檢查
npm run compile
# 預期: 編譯成功,無錯誤

# 4. 檢查型別錯誤 (不生成檔案)
npx tsc --noEmit
# 預期: 無輸出 (無型別錯誤)
```

**如遇錯誤**:

-   錯誤關鍵字包含 "ArrayBuffer" 或 "Buffer":
    ```powershell
    # 可能需要更新 @types/node (已在階段二計畫中)
    # 暫時跳過,繼續其他驗證
    ```
-   其他型別錯誤: 記錄錯誤訊息,回滾 TypeScript 版本

#### Step 2: 升級 @typescript-eslint

```powershell
# 1. 同時升級 plugin 和 parser
npm update @typescript-eslint/eslint-plugin@8.46.1 @typescript-eslint/parser@8.46.1

# 2. 確認版本更新
npm list @typescript-eslint/eslint-plugin @typescript-eslint/parser
# 預期: 兩者皆為 8.46.1

# 3. 執行 lint 檢查
npm run lint
# 預期: 無新增錯誤

# 4. 如有新規則警告,記錄但不阻斷
npm run lint > lint-output.txt 2>&1
```

#### Step 3: P1 驗證

```powershell
# 1. 完整測試套件
npm test
# 預期: All 63 tests pass

# 2. 測試覆蓋率
npm run test:coverage
# 預期: >= 87.21%

# 3. 建置驗證
npm run compile
npm run package
# 預期: 兩者皆成功

# 4. 檢查建置產出大小
Get-ChildItem dist/extension.js | Select-Object Length
# 預期: 與基準相差 ±5% 內

# 5. 功能測試 (手動)
code --extensionDevelopmentPath=. .
# 在 Extension Development Host 中測試核心功能:
# - 開啟 Blockly 編輯器
# - 拖曳積木
# - 產生 Arduino 程式碼
# - 儲存工作區
```

#### Step 4: P1 提交

```powershell
# 如所有驗證通過,提交變更
git add package.json package-lock.json
git commit -m "chore: upgrade TypeScript ecosystem to 5.9.3 and @typescript-eslint to 8.46.1

- typescript: 5.7.2 → 5.9.3
- @typescript-eslint/eslint-plugin: 8.19.1 → 8.46.1
- @typescript-eslint/parser: 8.19.1 → 8.46.1

Validated: All tests pass, coverage maintained, build successful"
```

---

### Stage P2: Testing Frameworks (優先級 2)

**套件**: @vscode/test-electron, @vscode/test-cli, sinon

#### Step 1: 升級測試框架

```powershell
# 1. 同時升級三個測試相關套件
npm update @vscode/test-electron@2.5.2 @vscode/test-cli@0.0.12 sinon@21.0.0

# 2. 確認版本更新
npm list @vscode/test-electron @vscode/test-cli sinon
# 預期:
#   @vscode/test-electron@2.5.2
#   @vscode/test-cli@0.0.12
#   sinon@21.0.0
```

#### Step 2: 執行測試驗證

```powershell
# 1. 執行完整測試套件
npm test
# 預期: All 63 tests pass

# 2. 特別留意包含 mock/stub/spy 的測試
npm test -- --grep "should mock|should stub|should spy"
# 預期: 所有相關測試通過 (sinon 主要版本更新)

# 3. 測試覆蓋率驗證
npm run test:coverage
# 預期: >= 87.21%

# 4. 檢查測試執行時間
Measure-Command { npm test }
# 預期: 與基準相差 ≤10%
```

**如遇錯誤**:

-   sinon 相關錯誤: 檢查 sinon 21.0.0 release notes,可能需更新 mock/stub 語法
-   @vscode/test-cli 錯誤: 檢查測試輸出格式變更,更新 CI/CD 配置 (如需要)

#### Step 3: P2 驗證和提交

```powershell
# 1. 確認所有測試通過後提交
git add package.json package-lock.json
git commit -m "chore: upgrade testing frameworks

- @vscode/test-electron: 2.4.1 → 2.5.2
- @vscode/test-cli: 0.0.10 → 0.0.12
- sinon: 20.0.0 → 21.0.0

Validated: All 63 tests pass, coverage maintained at 87.21%"
```

---

### Stage P3a: Build Tools (優先級 3a)

**套件**: webpack, ts-loader

**重要**: webpack 和 ts-loader 必須同時升級以確保相容性

#### Step 1: 升級建置工具

```powershell
# 1. 同時升級 webpack 和 ts-loader
npm update webpack@5.102.1 ts-loader@9.5.4

# 2. 確認版本更新
npm list webpack ts-loader
# 預期: webpack@5.102.1, ts-loader@9.5.4
```

#### Step 2: 建置驗證

```powershell
# 1. 清除舊建置產出
Remove-Item -Recurse -Force dist/
Remove-Item -Recurse -Force out/

# 2. 執行開發建置
npm run compile
# 預期: 建置成功,無錯誤

# 3. 檢查 source map 生成
Test-Path dist/extension.js.map
# 預期: True

# 4. 執行生產建置
npm run package
# 預期: 建置成功

# 5. 檢查建置產出大小
Get-ChildItem dist/extension.js | Select-Object Length, Name
# 預期: 與基準相差 ±5% 內

# 6. 比對建置時間
Measure-Command { npm run compile }
# 預期: 與基準相差 ≤10% (可能更快,得益於 TS 5.9.3 效能改進)
```

#### Step 3: 功能驗證

```powershell
# 1. 執行測試確認建置正確
npm test
# 預期: All tests pass

# 2. 手動功能測試
code --extensionDevelopmentPath=. .
# 測試擴充功能完整載入和運作
```

#### Step 4: P3a 提交

```powershell
git add package.json package-lock.json
git commit -m "chore: upgrade build tools

- webpack: 5.97.1 → 5.102.1
- ts-loader: 9.5.1 → 9.5.4

Validated: Build successful, bundle size within ±5%, performance maintained"
```

---

### Stage P3b: ESLint (優先級 3b)

**套件**: eslint

#### Step 1: 升級 ESLint

```powershell
# 1. 升級 ESLint
npm update eslint@9.38.0

# 2. 確認版本更新
npm list eslint
# 預期: eslint@9.38.0
```

#### Step 2: Lint 驗證

```powershell
# 1. 執行 lint 檢查
npm run lint
# 預期: 無新增錯誤

# 2. 執行 i18n lint (如適用)
npm run lint:i18n
# 預期: 無錯誤

# 3. 如有新規則警告,檢視並決定處理方式
npm run lint -- --format json > lint-results.json
# 分析新規則是否需要程式碼調整或規則調整

# 4. 測量 lint 時間
Measure-Command { npm run lint }
# 預期: ≤30 秒
```

#### Step 3: 最終驗證

```powershell
# 1. 完整測試套件
npm test
# 預期: All 63 tests pass

# 2. 測試覆蓋率
npm run test:coverage
# 預期: >= 87.21%

# 3. 完整建置
npm run compile
npm run package
# 預期: 兩者皆成功
```

#### Step 4: P3b 提交

```powershell
git add package.json package-lock.json
git commit -m "chore: upgrade eslint to 9.38.0

Validated: No new errors, lint time within target, all tests pass"
```

---

## Final Validation (最終驗證)

### 1. 完整回歸測試

```powershell
# 1. 清除所有建置和測試快取
Remove-Item -Recurse -Force dist/, out/, coverage/, node_modules/.cache/

# 2. 重新安裝依賴 (確保 lock file 正確)
npm ci

# 3. 完整建置
npm run compile
npm run package

# 4. 完整測試
npm test

# 5. 覆蓋率檢查
npm run test:coverage

# 6. Lint 檢查
npm run lint
npm run lint:i18n
```

### 2. 跨平台驗證 (如可行)

在 CI/CD 環境或其他作業系統上執行:

```powershell
# Windows (已在本地驗證)
npm ci && npm run compile && npm test

# macOS / Linux (透過 CI 或虛擬機)
# 相同指令,確認跨平台一致性
```

### 3. 功能整合測試 (手動)

在 Extension Development Host 中完整測試:

```powershell
code --extensionDevelopmentPath=. .
```

**測試清單**:

-   [ ] Blockly 編輯器正常開啟
-   [ ] 可拖曳和編輯積木
-   [ ] 程式碼生成正確
-   [ ] 工作區儲存和載入
-   [ ] 板子選擇功能正常
-   [ ] 主題切換 (亮/暗) 正常
-   [ ] PlatformIO 整合無錯誤
-   [ ] 多語言切換正常

### 4. 效能比對

比對升級前後的效能數據:

```json
{
	"compilation": {
		"before": 45000,
		"after": 42000,
		"delta": -3000,
		"deltaPercent": -6.67,
		"status": "✅ Improved"
	},
	"testing": {
		"before": 120000,
		"after": 125000,
		"delta": 5000,
		"deltaPercent": 4.17,
		"status": "✅ Within ±10%"
	},
	"build": {
		"before": 1234567,
		"after": 1220000,
		"delta": -14567,
		"deltaPercent": -1.18,
		"status": "✅ Within ±5%"
	}
}
```

---

## Update Documentation (更新文件)

### 1. 更新 CHANGELOG.md

在 `CHANGELOG.md` 的 `[Unreleased]` 區段新增:

```markdown
### Dependencies

-   Upgraded TypeScript from 5.7.2 to 5.9.3 for improved build performance
-   Updated @typescript-eslint packages from 8.19.1 to 8.46.1 (bug fixes)
-   Upgraded webpack from 5.97.1 to 5.102.1 (ES modules support improvements)
-   Updated ts-loader from 9.5.1 to 9.5.4
-   Upgraded ESLint from 9.32.0 to 9.38.0
-   Updated testing frameworks:
    -   @vscode/test-electron: 2.4.1 → 2.5.2
    -   @vscode/test-cli: 0.0.10 → 0.0.12
    -   sinon: 20.0.0 → 21.0.0
```

### 2. 最終提交

```powershell
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for dependency upgrades"
```

### 3. 合併到主分支

```powershell
# 1. 推送分支到遠端
git push origin 005-safe-dependency-updates

# 2. 創建 Pull Request (透過 GitHub UI 或 CLI)
gh pr create --title "chore: upgrade dependencies (Phase 1 - Safe Updates)" \
  --body "升級 9 個開發依賴套件至最新穩定版本,已通過完整測試和驗證。

**升級套件**:
- TypeScript: 5.7.2 → 5.9.3
- @typescript-eslint: 8.19.1 → 8.46.1
- webpack: 5.97.1 → 5.102.1
- ts-loader: 9.5.1 → 9.5.4
- eslint: 9.32.0 → 9.38.0
- @vscode/test-electron: 2.4.1 → 2.5.2
- @vscode/test-cli: 0.0.10 → 0.0.12
- sinon: 20.0.0 → 21.0.0

**驗證結果**:
- ✅ 所有 63 個測試通過
- ✅ 測試覆蓋率維持 87.21%
- ✅ 建置產出大小變化 < 5%
- ✅ 效能指標符合預期
- ✅ 跨平台建置一致性確認

**風險評估**: 低 - 僅次要版本和補丁更新,無 breaking changes
**回歸測試**: 完整通過"
```

---

## Troubleshooting (問題排查)

### 問題 1: TypeScript 編譯錯誤

**症狀**:

```
error TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'ArrayBuffer'
```

**原因**: TypeScript 5.9.3 的 ArrayBuffer 類型變更

**解決方案**:

```powershell
# 選項 1: 更新 @types/node (如在階段二計畫中)
npm update @types/node

# 選項 2: 暫時回滾 TypeScript
npm install typescript@5.7.2
git restore package.json package-lock.json
```

### 問題 2: ESLint 新規則錯誤

**症狀**:

```
error: Unexpected console statement (no-console)
```

**原因**: ESLint 9.38.0 啟用了新規則或改變規則行為

**解決方案**:

```javascript
// 在 eslint.config.mjs 中調整規則
export default [
	{
		rules: {
			'no-console': 'off', // 或調整為 'warn'
		},
	},
];
```

### 問題 3: 測試失敗 (sinon 相關)

**症狀**:

```
TypeError: stub.restore is not a function
```

**原因**: sinon 21.0.0 API 變更

**解決方案**:

```typescript
// 檢查 sinon 21.0.0 migration guide
// 可能需要更新 stub/spy 的使用方式
// 範例: sinon.restore() → sandbox.restore()
```

### 問題 4: 建置產出大小異常增加

**症狀**: `dist/extension.js` 大小增加 > 5%

**原因**: webpack 或 ts-loader 的 tree-shaking 行為變更

**診斷**:

```powershell
# 使用 webpack-bundle-analyzer 分析
npm install --save-dev webpack-bundle-analyzer
# 修改 webpack.config.js 加入 analyzer plugin
npm run compile -- --analyze
```

### 問題 5: 測試執行時間顯著增加

**症狀**: 測試時間增加 > 10%

**診斷**:

```powershell
# 使用 --reporter spec 查看各測試耗時
npm test -- --reporter spec

# 檢查是否有測試超時
npm test -- --timeout 5000
```

---

## Rollback Procedure (回滾程序)

如升級導致嚴重問題,使用以下回滾程序:

### 完整回滾 (回到升級前狀態)

```powershell
# 1. 回滾所有變更
git reset --hard HEAD~4  # 假設有 4 個升級提交

# 2. 強制推送到遠端 (如已推送)
git push --force origin 005-safe-dependency-updates

# 3. 重新安裝依賴
npm ci

# 4. 驗證回滾成功
npm test
npm run compile
```

### 部分回滾 (僅回滾特定階段)

```powershell
# 範例: 回滾 P3b (ESLint) 但保留其他升級
git revert HEAD  # 回滾最後一個 commit (P3b)

# 或使用 interactive rebase
git rebase -i HEAD~4
# 在編輯器中刪除或標記為 'drop' 要回滾的 commit

# 重新安裝依賴
npm ci
npm test
```

---

## Success Criteria Checklist (成功標準檢查清單)

升級完成後,確認以下所有項目:

### 功能驗證

-   [ ] 所有 63 個單元測試通過 (無失敗,無跳過)
-   [ ] 測試覆蓋率 >= 87.21% (行、分支、函式、語句)
-   [ ] TypeScript 編譯無錯誤 (`npx tsc --noEmit`)
-   [ ] ESLint 檢查無錯誤 (`npm run lint`)
-   [ ] 開發建置成功 (`npm run compile`)
-   [ ] 生產建置成功 (`npm run package`)
-   [ ] Blockly 編輯器正常運作 (手動測試)
-   [ ] 程式碼生成功能正常 (手動測試)

### 效能驗證

-   [ ] 測試執行時間增幅 ≤10%
-   [ ] 首次編譯時間增幅 ≤10%
-   [ ] ESLint 檢查時間 ≤30 秒
-   [ ] 建置產出檔案大小變化 ±5% 內

### 跨平台驗證

-   [ ] Windows 10/11 建置和測試通過
-   [ ] macOS 建置和測試通過 (透過 CI)
-   [ ] Ubuntu 22.04 建置和測試通過 (透過 CI)

### 文件驗證

-   [ ] CHANGELOG.md 已更新
-   [ ] 所有升級變更已提交到 Git
-   [ ] Pull Request 已創建並包含完整說明
-   [ ] 效能比對數據已記錄

---

## Estimated Timeline (預估時間表)

| 階段           | 預估時間 | 累計時間       |
| -------------- | -------- | -------------- |
| 前置準備       | 15 分鐘  | 15 分鐘        |
| P1: TypeScript | 30 分鐘  | 45 分鐘        |
| P2: Testing    | 25 分鐘  | 1 小時 10 分鐘 |
| P3a: Build     | 25 分鐘  | 1 小時 35 分鐘 |
| P3b: ESLint    | 20 分鐘  | 1 小時 55 分鐘 |
| 最終驗證       | 30 分鐘  | 2 小時 25 分鐘 |
| 文件更新和 PR  | 15 分鐘  | 2 小時 40 分鐘 |

**總計**: 約 2-3 小時 (含所有驗證和測試,不含問題排查時間)

---

## Additional Resources (額外資源)

### 官方文件連結

-   [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)
-   [@typescript-eslint Releases](https://github.com/typescript-eslint/typescript-eslint/releases)
-   [Webpack 5 Changelog](https://github.com/webpack/webpack/releases)
-   [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
-   [sinon Documentation](https://sinonjs.org/)

### 專案內部文件

-   完整規格: `specs/005-safe-dependency-updates/spec.md`
-   研究報告: `specs/005-safe-dependency-updates/research.md`
-   資料模型: `specs/005-safe-dependency-updates/data-model.md`
-   實作計畫: `specs/005-safe-dependency-updates/plan.md`

---

## Conclusion

遵循本指南逐步執行升級,確保每個階段完成後再進入下一階段,可以最大程度降低升級風險。如遇問題,參考「問題排查」章節或回滾到上一個已驗證的階段。

**記住**: 每個階段都是獨立的,可以單獨驗證和回滾。不要跳過驗證步驟!
