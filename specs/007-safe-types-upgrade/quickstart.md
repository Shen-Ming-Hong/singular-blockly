# 快速開始指南 (Quickstart)

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  
**Data Model**: [data-model.md](./data-model.md) | **Contracts**: [contracts/](./contracts/)

---

## 概述

本指南提供開發者執行**階段 1: 安全升級**所需的最小步驟集。預計總時程: **45 分鐘**。

**升級項目**:

1. `@types/vscode`: 1.96.0 → 1.105.0
2. `@types/node`: 20.19.22 → 22.x
3. TypeScript target: ES2022 → ES2023

**風險等級**: 🟢 極低風險 (所有變更向後相容)

---

## 前置要求

開始前確認以下條件:

-   [x] **Git**: 版本控制系統已安裝
-   [x] **Node.js**: 22.16.0 或更高版本
-   [x] **npm**: 10.8.1 或更高版本
-   [x] **VSCode**: 1.96.0 或更高版本
-   [x] **乾淨的工作目錄**: `git status` 無未提交變更

**驗證指令**:

```powershell
# 檢查版本
node --version    # 預期: v22.16.0 或更高
npm --version     # 預期: 10.8.1 或更高
code --version    # 預期: 1.96.0 或更高

# 確認工作目錄乾淨
git status        # 預期: "working tree clean"
```

---

## 步驟 1: 更新 package.json (2 分鐘)

### 1.1 修改 devDependencies

在 `package.json` 中找到 `devDependencies`,更新以下三個套件版本:

```json
{
	"devDependencies": {
		"@types/node": "^22.0.0",
		"@types/vscode": "^1.105.0",
		"typescript": "^5.9.3"
	}
}
```

**具體變更**:

```diff
  "devDependencies": {
-   "@types/node": "^20.19.22",
+   "@types/node": "^22.0.0",
-   "@types/vscode": "^1.96.0",
+   "@types/vscode": "^1.105.0",
    "typescript": "^5.9.3"
  }
```

**注意**: TypeScript 版本維持 5.9.3 不變,僅升級型別定義套件。

### 1.2 驗證語法

```powershell
# 確認 JSON 語法正確
npm run lint --if-present
# 或手動檢查
Get-Content package.json | ConvertFrom-Json | Out-Null
```

---

## 步驟 2: 安裝依賴 (5 分鐘)

### 2.1 清理舊依賴

```powershell
# 刪除現有 node_modules 和 lock 檔案
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
```

**注意**: 此步驟確保完全乾淨安裝,避免依賴衝突。

### 2.2 安裝新依賴

```powershell
# 安裝所有依賴
npm install

# 預期輸出:
# added 1234 packages in 45s
```

**常見問題**:

-   **錯誤**: `ERESOLVE unable to resolve dependency tree`
    -   **解決**: 執行 `npm install --legacy-peer-deps`
-   **警告**: `deprecated package@version`
    -   **影響**: 無,可忽略 (非升級範圍)

### 2.3 驗證安裝結果

```powershell
# 檢查已安裝版本
npm list @types/vscode    # 預期: 1.105.0
npm list @types/node      # 預期: 22.x.x
npm list typescript       # 預期: 5.9.3
```

---

## 步驟 3: 更新 tsconfig.json (1 分鐘)

### 3.1 修改編譯目標

在 `tsconfig.json` 中,將 `target` 和 `lib` 從 ES2022 升級至 ES2023:

```json
{
	"compilerOptions": {
		"target": "ES2023",
		"lib": ["ES2023"],
		"module": "Node16",
		"outDir": "./dist"
	}
}
```

**具體變更**:

```diff
  "compilerOptions": {
-   "target": "ES2022",
+   "target": "ES2023",
-   "lib": ["ES2022"],
+   "lib": ["ES2023"],
    "module": "Node16"
  }
```

### 3.2 驗證配置語法

```powershell
# 確認 JSON 語法正確
Get-Content tsconfig.json | ConvertFrom-Json | Out-Null
```

---

## 步驟 4: 執行驗證檢查點 (15 分鐘)

### 4.1 Checkpoint 1: 型別檢查 (5 分鐘)

**目標**: 確認升級後無型別錯誤

```powershell
# 執行編譯
npm run compile

# 預期輸出:
# > webpack
# asset extension.js 132 KiB [emitted]
# webpack 5.102.1 compiled successfully in 3456 ms
```

**成功條件**:

-   ✅ 編譯成功 (exit code 0)
-   ✅ 無 TypeScript 錯誤
-   ✅ 建置時間 ≤ 5 秒
-   ✅ 產生 `dist/extension.js`

**如果失敗**: 參考 [contracts/checkpoint-1-type-check.md](./contracts/checkpoint-1-type-check.md#失敗處理-failure-handling)

### 4.2 Checkpoint 2: 測試套件 (8 分鐘)

**目標**: 確認所有測試通過,覆蓋率無退化

```powershell
# 執行測試套件
npm test

# 預期輸出:
#   190 passing (18s)
# Coverage summary:
#   Statements: 89.36%
#   Branches: 83.63%
#   Functions: 90.62%
#   Lines: 89.36%
```

**成功條件**:

-   ✅ 190/190 測試通過
-   ✅ 覆蓋率 ≥ 87.21%
-   ✅ 執行時間 ≤ 22 秒
-   ✅ 無新的功能迴歸

**如果失敗**: 參考 [contracts/checkpoint-2-test-suite.md](./contracts/checkpoint-2-test-suite.md#失敗處理-failure-handling)

### 4.3 Checkpoint 3: 建置產物 (2 分鐘 + 手動測試)

**目標**: 確認產物大小變化在 ±5% 範圍內

```powershell
# 檢查產物大小
$size = (Get-Item dist/extension.js).Length
$baseline = 130506
$changePct = (($size - $baseline) / $baseline) * 100

Write-Host "產物大小: $size bytes (變化: $([math]::Round($changePct, 2))%)"
```

**成功條件**:

-   ✅ 大小變化 ≤ ±5% (123,980 - 137,031 bytes)
-   ✅ 擴充功能可正常啟動 (按 F5)
-   ✅ 核心功能測試通過 (手動驗證)

**手動功能測試** (2 分鐘):

1. 按 F5 啟動 Extension Development Host
2. 開啟 `.ino` 檔案,右鍵選擇 "Open with Blockly Editor"
3. 拖曳積木,切換主題,檢查程式碼生成

**如果失敗**: 參考 [contracts/checkpoint-3-build-artifact.md](./contracts/checkpoint-3-build-artifact.md#失敗處理-failure-handling)

---

## 步驟 5: 提交變更 (5 分鐘)

### 5.1 更新 CHANGELOG.md

在 `CHANGELOG.md` 頂部新增升級記錄:

```markdown
## [Unreleased]

### Changed

-   升級 @types/vscode 從 1.96.0 至 1.105.0
-   升級 @types/node 從 20.19.22 至 22.x 以對齊 Node.js 22.16.0 runtime
-   更新 TypeScript target 從 ES2022 至 ES2023

### Technical

-   所有變更向後相容,無破壞性變更
-   190 測試全數通過,覆蓋率維持 87.21%
-   建置產物大小變化: +X.XX% (在 ±5% 容忍範圍內)
```

### 5.2 Git Commit

```powershell
# 檢視變更
git status
# 預期:
#   modified: package.json
#   modified: package-lock.json
#   modified: tsconfig.json
#   modified: CHANGELOG.md

# 提交變更
git add package.json package-lock.json tsconfig.json CHANGELOG.md
git commit -m "chore: upgrade @types/vscode to 1.105.0 and @types/node to 22.x

- Upgrade @types/vscode from 1.96.0 to 1.105.0
- Upgrade @types/node from 20.19.22 to 22.x to align with Node.js 22.16.0 runtime
- Update TypeScript target from ES2022 to ES2023
- All 190 tests passing with 87.21% coverage
- Build artifact size change: +X.XX% (within ±5% tolerance)

Checkpoints:
✅ Type check passed
✅ Test suite passed (190/190)
✅ Build artifact validated
"
```

**Commit Message 規範**:

-   使用 Conventional Commits 格式
-   Type: `chore` (依賴升級)
-   包含變更摘要和驗證結果

### 5.3 推送至遠端 (可選)

```powershell
# 推送至遠端分支
git push origin main
# 或建立 PR
git checkout -b chore/upgrade-types
git push origin chore/upgrade-types
```

---

## 完整自動化腳本

將以下腳本儲存為 `upgrade.ps1`,一鍵執行所有步驟:

```powershell
# upgrade.ps1 - 自動執行安全升級流程

param(
    [switch]$SkipTests,    # 跳過測試 (不建議)
    [switch]$DryRun        # 僅顯示將執行的命令
)

Write-Host "=== Singular Blockly 型別升級工具 ===" -ForegroundColor Cyan
Write-Host ""

# 前置檢查
Write-Host "[0/5] 檢查前置條件..." -ForegroundColor Yellow
if ((git status --porcelain).Count -ne 0) {
    Write-Error "工作目錄不乾淨,請先提交或儲藏變更"
    exit 1
}

# 步驟 1: 更新 package.json
Write-Host "`n[1/5] 更新 package.json..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  將更新: @types/vscode, @types/node"
} else {
    $pkg = Get-Content package.json | ConvertFrom-Json
    $pkg.devDependencies.'@types/vscode' = '^1.105.0'
    $pkg.devDependencies.'@types/node' = '^22.0.0'
    $pkg | ConvertTo-Json -Depth 10 | Set-Content package.json
    Write-Host "  ✅ package.json 已更新" -ForegroundColor Green
}

# 步驟 2: 安裝依賴
Write-Host "`n[2/5] 安裝依賴..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  將執行: npm install"
} else {
    Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "依賴安裝失敗"
        exit 1
    }
    Write-Host "  ✅ 依賴安裝完成" -ForegroundColor Green
}

# 步驟 3: 更新 tsconfig.json
Write-Host "`n[3/5] 更新 tsconfig.json..." -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  將更新: target ES2023, lib ES2023"
} else {
    $tsconfig = Get-Content tsconfig.json | ConvertFrom-Json
    $tsconfig.compilerOptions.target = 'ES2023'
    $tsconfig.compilerOptions.lib = @('ES2023')
    $tsconfig | ConvertTo-Json -Depth 10 | Set-Content tsconfig.json
    Write-Host "  ✅ tsconfig.json 已更新" -ForegroundColor Green
}

# 步驟 4: 驗證檢查點
Write-Host "`n[4/5] 執行驗證檢查點..." -ForegroundColor Yellow

## Checkpoint 1: 型別檢查
Write-Host "  [Checkpoint 1] 型別檢查..." -ForegroundColor Cyan
if (-not $DryRun) {
    npm run compile
    if ($LASTEXITCODE -ne 0) {
        Write-Error "型別檢查失敗"
        exit 1
    }
    Write-Host "    ✅ 編譯成功" -ForegroundColor Green
}

## Checkpoint 2: 測試套件
if (-not $SkipTests) {
    Write-Host "  [Checkpoint 2] 測試套件..." -ForegroundColor Cyan
    if (-not $DryRun) {
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Error "測試失敗"
            exit 1
        }
        Write-Host "    ✅ 測試通過" -ForegroundColor Green
    }
}

## Checkpoint 3: 建置產物
Write-Host "  [Checkpoint 3] 建置產物..." -ForegroundColor Cyan
if (-not $DryRun) {
    $size = (Get-Item dist/extension.js).Length
    $baseline = 130506
    $changePct = (($size - $baseline) / $baseline) * 100
    Write-Host "    產物大小: $size bytes (變化: $([math]::Round($changePct, 2))%)"

    if ([math]::Abs($changePct) -le 5.0) {
        Write-Host "    ✅ 大小變化可接受" -ForegroundColor Green
    } else {
        Write-Warning "    大小變化超過 ±5%,建議檢查"
    }
}

# 步驟 5: 準備提交
Write-Host "`n[5/5] 準備提交..." -ForegroundColor Yellow
Write-Host "  請執行以下指令提交變更:"
Write-Host '  git add package.json package-lock.json tsconfig.json'
Write-Host '  git commit -m "chore: upgrade @types/vscode to 1.105.0 and @types/node to 22.x"'

Write-Host "`n✅ 升級完成!" -ForegroundColor Green
```

**使用方式**:

```powershell
# 完整執行
.\upgrade.ps1

# 跳過測試 (不建議)
.\upgrade.ps1 -SkipTests

# 預覽執行計畫
.\upgrade.ps1 -DryRun
```

---

## 時間估算

| 步驟     | 說明                                | 預估時間       |
| -------- | ----------------------------------- | -------------- |
| 1        | 更新 package.json                   | 2 分鐘         |
| 2        | 安裝依賴                            | 5 分鐘         |
| 3        | 更新 tsconfig.json                  | 1 分鐘         |
| 4.1      | Checkpoint 1: 型別檢查              | 5 分鐘         |
| 4.2      | Checkpoint 2: 測試套件              | 8 分鐘         |
| 4.3      | Checkpoint 3: 建置產物 (含手動測試) | 5 分鐘         |
| 5        | 提交變更                            | 5 分鐘         |
| **總計** |                                     | **31-45 分鐘** |

**注意**: 時間依機器效能和網路速度而定,npm install 可能需要更長時間。

---

## 故障排除

### 問題 1: npm install 失敗

**錯誤訊息**: `ERESOLVE unable to resolve dependency tree`

**解決方式**:

```powershell
# 方案 A: 使用 legacy peer deps
npm install --legacy-peer-deps

# 方案 B: 強制覆蓋
npm install --force

# 方案 C: 清理 npm 快取
npm cache clean --force
npm install
```

### 問題 2: 編譯錯誤

**錯誤訊息**: `TS2304: Cannot find name 'xxx'`

**診斷步驟**:

```powershell
# 檢查已安裝版本
npm list @types/vscode @types/node

# 重新安裝型別定義
npm install @types/vscode@^1.105.0 @types/node@^22.0.0 --save-dev
```

**參考**: [checkpoint-1-type-check.md](./contracts/checkpoint-1-type-check.md#失敗處理-failure-handling)

### 問題 3: 測試失敗

**錯誤訊息**: 某些測試 timeout 或 assertion failed

**診斷步驟**:

```powershell
# 執行單一測試檔案
npm test -- --grep "SettingsManager"

# 啟用詳細輸出
npm test -- --reporter spec
```

**參考**: [checkpoint-2-test-suite.md](./contracts/checkpoint-2-test-suite.md#失敗處理-failure-handling)

### 問題 4: 建置產物過大

**症狀**: 大小變化超過 +5%

**診斷步驟**:

```powershell
# 安裝 bundle 分析工具
npm install webpack-bundle-analyzer --save-dev

# 分析 bundle
npx webpack-bundle-analyzer dist/stats.json
```

**參考**: [checkpoint-3-build-artifact.md](./contracts/checkpoint-3-build-artifact.md#失敗處理-failure-handling)

### 問題 5: 擴充功能無法啟動

**症狀**: 按 F5 後 Extension Host 顯示錯誤

**診斷步驟**:

1. 開啟 Debug Console 查看完整錯誤
2. 檢查 `package.json` 的 `main` 欄位指向正確產物
3. 確認 webpack 的 `externals` 配置

```javascript
// webpack.config.js - 確認此設定存在
module.exports = {
	externals: {
		vscode: 'commonjs vscode',
	},
};
```

---

## 回滾程序

如果升級過程中遇到無法解決的問題,執行完整回滾:

```powershell
# 回滾所有檔案
git checkout HEAD -- package.json package-lock.json tsconfig.json

# 重新安裝依賴
Remove-Item node_modules -Recurse -Force
npm install

# 重新建置
npm run compile

# 驗證回滾成功
npm test
```

**驗證回滾成功**:

-   ✅ `@types/vscode` 版本為 1.96.0
-   ✅ `@types/node` 版本為 20.19.22
-   ✅ tsconfig.json target 為 ES2022
-   ✅ 所有測試通過

---

## 檢查清單

升級完成前確認:

-   [ ] ✅ package.json 版本已更新
-   [ ] ✅ npm install 成功
-   [ ] ✅ tsconfig.json target 為 ES2023
-   [ ] ✅ Checkpoint 1: 編譯成功
-   [ ] ✅ Checkpoint 2: 190/190 測試通過
-   [ ] ✅ Checkpoint 3: 建置產物大小可接受
-   [ ] ✅ 手動功能測試通過
-   [ ] ✅ CHANGELOG.md 已更新
-   [ ] ✅ Git commit 完成
-   [ ] ⏳ (可選) 推送至遠端

---

## 後續步驟

升級完成後,建議執行:

1. **執行完整測試**: 在多個環境測試 (Windows, macOS, Linux)
2. **效能基準測試**: 記錄啟動時間和記憶體使用量
3. **更新文檔**: 若 API 使用範例需更新
4. **發布 Release**: 依照專案發布流程

---

## 支援資源

-   **研究報告**: [research.md](./research.md) - 詳細的升級調查和風險評估
-   **資料模型**: [data-model.md](./data-model.md) - 4 個核心實體定義
-   **驗證契約**: [contracts/](./contracts/) - 3 個檢查點詳細說明
-   **實作計畫**: [plan.md](./plan.md) - 完整專案計畫

---

**文件版本**: 1.0  
**最後更新**: 2025-01-26  
**預估時程**: 31-45 分鐘 (含手動測試)  
**風險等級**: 🟢 極低風險
