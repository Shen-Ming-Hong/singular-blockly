# Checkpoint 1: 型別檢查契約

**Spec**: [../spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)  
**Data Model**: [../data-model.md](../data-model.md#2-validationresult-驗證結果)

---

## 契約概述

本契約定義第一個驗證檢查點,確保升級後的型別定義與專案程式碼相容,無型別錯誤。

**檢查點名稱**: `checkpoint-1-type-check`  
**執行時機**: 更新 package.json 和執行 `npm install` 後  
**預期時間**: ≤5 秒 (基準: 4.6 秒)

---

## 前置條件 (Preconditions)

執行此檢查點前,以下條件必須滿足:

### 1. package.json 已更新

**驗證方式**:

```powershell
# 檢查 devDependencies 版本
npm list @types/vscode @types/node
```

**預期輸出**:

```
singular-blockly@0.37.1 E:\singular-blockly
├── @types/node@22.12.0
└── @types/vscode@1.105.0
```

**失敗處理**: 若版本不符,執行 `npm install` 重新安裝

### 2. node_modules 已更新

**驗證方式**:

```powershell
# 檢查型別定義檔案存在
Test-Path node_modules/@types/vscode/index.d.ts
Test-Path node_modules/@types/node/index.d.ts
```

**預期結果**: 兩者皆回傳 `True`

### 3. TypeScript 編譯器可用

**驗證方式**:

```powershell
# 檢查 TypeScript 版本
npx tsc --version
```

**預期輸出**: `Version 5.9.3` 或更新版本

---

## 驗證動作 (Validation Action)

### 主要指令

```powershell
npm run compile
```

### 預期行為

1. **webpack 啟動**: 讀取 webpack.config.js
2. **TypeScript 編譯**: 使用 ts-loader 編譯所有 src/ 下的 .ts 檔案
3. **型別檢查**: 驗證所有型別註解和介面
4. **產生產物**: 輸出至 dist/extension.js

### 詳細驗證步驟

#### 步驟 1: 清理舊產物 (可選)

```powershell
# 刪除舊的建置產物
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

#### 步驟 2: 執行編譯

```powershell
# 執行編譯並捕獲輸出
npm run compile 2>&1 | Tee-Object -Variable compileOutput
```

#### 步驟 3: 檢查退出碼

```powershell
# 檢查最後一個指令的退出碼
if ($LASTEXITCODE -ne 0) {
    Write-Error "編譯失敗,退出碼: $LASTEXITCODE"
    exit 1
}
```

---

## 成功條件 (Success Criteria)

所有以下條件必須同時滿足:

### 1. 編譯成功 ✅

**判斷標準**:

-   指令退出碼 = 0
-   終端輸出包含 "webpack compiled"
-   無 "error TS" 開頭的錯誤訊息

**範例成功輸出**:

```
> webpack

asset extension.js 132 KiB [emitted] (name: main)
webpack 5.102.1 compiled successfully in 4782 ms
```

### 2. 無型別錯誤 ✅

**檢查方式**:

```powershell
# 檢查輸出中是否包含型別錯誤
$typeErrors = $compileOutput | Select-String "error TS"
if ($typeErrors.Count -gt 0) {
    Write-Error "發現 $($typeErrors.Count) 個型別錯誤"
    $typeErrors | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
    exit 1
}
```

**常見型別錯誤範例 (應避免)**:

```
error TS2304: Cannot find name 'vscode'.
error TS2339: Property 'keys' does not exist on type 'SecretStorage'.
error TS7006: Parameter implicitly has an 'any' type.
```

### 3. 建置時間 ≤5 秒 ✅

**測量方式**:

```powershell
# 記錄開始時間
$startTime = Get-Date

# 執行編譯
npm run compile

# 計算耗時
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host "編譯時間: $duration 秒"

if ($duration -gt 5.0) {
    Write-Warning "編譯時間超過 5 秒基準 (基準: 4.6 秒)"
}
```

**對應 data-model.md**:

```typescript
const result: ValidationResult = {
	timestamp: new Date().toISOString(),
	checkpointName: 'checkpoint-1-type-check',
	testsPassed: 0, // 型別檢查不執行測試
	testsFailed: 0,
	testsTotal: 0,
	coveragePercent: 0, // 型別檢查不計算覆蓋率
	buildTimeMs: duration * 1000, // 轉換為毫秒
	passed: $LASTEXITCODE === 0 && duration <= 5.0,
};
```

### 4. 產生 dist/extension.js ✅

**驗證方式**:

```powershell
# 檢查檔案存在
if (Test-Path dist/extension.js) {
    $fileSize = (Get-Item dist/extension.js).Length
    Write-Host "✅ 建置產物已產生: $fileSize bytes"
} else {
    Write-Error "❌ 建置產物不存在: dist/extension.js"
    exit 1
}
```

---

## 失敗處理 (Failure Handling)

### 失敗類型 1: VSCode API 型別錯誤

**範例錯誤**:

```
error TS2339: Property 'asWebviewUri' does not exist on type 'Webview'.
```

**診斷步驟**:

1. 確認 `@types/vscode` 版本是否正確安裝: `npm list @types/vscode`
2. 檢查 `package.json` 中的 `engines.vscode` 版本要求
3. 查閱 VSCode API 變更日誌: [research.md](../research.md#1-vscode-extension-api-1960--1105)

**修復方式**:

-   若 API 已棄用: 更新程式碼使用新 API
-   若版本不符: 執行 `npm install @types/vscode@1.105.0 --save-dev --save-exact`

### 失敗類型 2: Node.js API 型別錯誤

**範例錯誤**:

```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'PathLike'.
```

**診斷步驟**:

1. 確認 `@types/node` 版本: `npm list @types/node`
2. 檢查使用的 Node.js API 是否為 22.x 版本引入

**修復方式**:

-   更新型別定義: `npm install @types/node@22.12.0 --save-dev --save-exact`
-   若需要: 調整型別轉換 (例: 使用 `as PathLike`)

### 失敗類型 3: TypeScript 編譯器錯誤

**範例錯誤**:

```
error TS5023: Unknown compiler option 'target'.
```

**診斷步驟**:

1. 檢查 tsconfig.json 語法是否正確
2. 確認 TypeScript 版本: `npx tsc --version`

**修復方式**:

-   驗證 tsconfig.json 格式: 使用 JSON linter
-   若需要: 重新安裝 TypeScript: `npm install typescript@5.9.3 --save-dev`

### 失敗類型 4: webpack 配置錯誤

**範例錯誤**:

```
ERROR in ./src/extension.ts
Module build failed: TypeError: Cannot read property 'xxx' of undefined
```

**診斷步驟**:

1. 檢查 webpack.config.js 語法
2. 確認 ts-loader 版本相容性

**修復方式**:

-   回滾 webpack.config.js 至上一個 commit
-   執行 `npm install` 重新安裝所有依賴

---

## 回滾策略 (Rollback Strategy)

若檢查點 1 失敗且無法立即修復:

### 1. 回滾 package.json

```powershell
# 使用 Git 回滾
git checkout HEAD -- package.json package-lock.json

# 重新安裝舊版本依賴
npm install
```

### 2. 驗證回滾成功

```powershell
# 執行編譯確認
npm run compile

# 檢查版本
npm list @types/vscode @types/node
```

**預期結果**: 回到升級前狀態 (vscode 1.96.0, node 20.19.22)

### 3. 記錄失敗原因

在 Git commit message 或專案文件中記錄:

-   失敗的錯誤訊息
-   嘗試的修復方式
-   回滾時間和原因

---

## 驗證腳本 (Automated Validation Script)

完整的 PowerShell 驗證腳本:

```powershell
# checkpoint-1-validate.ps1
# 驗證型別檢查檢查點

Write-Host "=== Checkpoint 1: 型別檢查 ===" -ForegroundColor Cyan

# 前置條件檢查
Write-Host "`n[1/4] 檢查前置條件..." -ForegroundColor Yellow

# 檢查依賴版本
$vscodeVersion = (npm list @types/vscode --depth=0 2>$null | Select-String "@types/vscode@").ToString().Split('@')[-1].Trim()
$nodeVersion = (npm list @types/node --depth=0 2>$null | Select-String "@types/node@").ToString().Split('@')[-1].Trim()

Write-Host "  - @types/vscode: $vscodeVersion (預期: 1.105.0)"
Write-Host "  - @types/node: $nodeVersion (預期: 22.12.0)"

# 執行編譯
Write-Host "`n[2/4] 執行編譯..." -ForegroundColor Yellow

$startTime = Get-Date
$compileOutput = npm run compile 2>&1
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

# 檢查結果
Write-Host "`n[3/4] 檢查編譯結果..." -ForegroundColor Yellow

$success = $LASTEXITCODE -eq 0
$typeErrors = $compileOutput | Select-String "error TS"

if ($success -and $typeErrors.Count -eq 0) {
    Write-Host "  ✅ 編譯成功,無型別錯誤" -ForegroundColor Green
} else {
    Write-Host "  ❌ 編譯失敗" -ForegroundColor Red
    $typeErrors | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
}

# 檢查建置產物
Write-Host "`n[4/4] 檢查建置產物..." -ForegroundColor Yellow

if (Test-Path dist/extension.js) {
    $fileSize = (Get-Item dist/extension.js).Length
    Write-Host "  ✅ 產物已產生: $fileSize bytes" -ForegroundColor Green
} else {
    Write-Host "  ❌ 產物不存在" -ForegroundColor Red
    $success = $false
}

# 輸出摘要
Write-Host "`n=== 驗證摘要 ===" -ForegroundColor Cyan
Write-Host "編譯時間: $([math]::Round($duration, 2)) 秒 (基準: ≤5 秒)"
Write-Host "型別錯誤: $($typeErrors.Count) 個"
Write-Host "退出碼: $LASTEXITCODE"

if ($success) {
    Write-Host "`n✅ Checkpoint 1 通過!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Checkpoint 1 失敗" -ForegroundColor Red
    exit 1
}
```

**使用方式**:

```powershell
# 執行驗證腳本
.\specs\007-safe-types-upgrade\contracts\checkpoint-1-validate.ps1
```

---

## 契約驗證紀錄範例

### 成功範例

```
=== Checkpoint 1: 型別檢查 ===

[1/4] 檢查前置條件...
  - @types/vscode: 1.105.0 (預期: 1.105.0)
  - @types/node: 22.12.0 (預期: 22.12.0)

[2/4] 執行編譯...

> webpack

asset extension.js 132018 bytes [emitted] (name: main)
webpack 5.102.1 compiled successfully in 4782 ms

[3/4] 檢查編譯結果...
  ✅ 編譯成功,無型別錯誤

[4/4] 檢查建置產物...
  ✅ 產物已產生: 132018 bytes

=== 驗證摘要 ===
編譯時間: 4.78 秒 (基準: ≤5 秒)
型別錯誤: 0 個
退出碼: 0

✅ Checkpoint 1 通過!
```

### 失敗範例

```
=== Checkpoint 1: 型別檢查 ===

[1/4] 檢查前置條件...
  - @types/vscode: 1.105.0 (預期: 1.105.0)
  - @types/node: 22.12.0 (預期: 22.12.0)

[2/4] 執行編譯...

ERROR in src/extension.ts:42:18
TS2339: Property 'asWebviewUri' does not exist on type 'Webview'.

[3/4] 檢查編譯結果...
  ❌ 編譯失敗
     error TS2339: Property 'asWebviewUri' does not exist on type 'Webview'.

[4/4] 檢查建置產物...
  ❌ 產物不存在

=== 驗證摘要 ===
編譯時間: 3.21 秒 (基準: ≤5 秒)
型別錯誤: 1 個
退出碼: 1

❌ Checkpoint 1 失敗
```

---

**契約版本**: 1.0  
**最後更新**: 2025-01-26  
**下一個檢查點**: [checkpoint-2-test-suite.md](./checkpoint-2-test-suite.md)
