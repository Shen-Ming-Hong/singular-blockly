# Checkpoint 2: 測試套件契約

**Spec**: [../spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)  
**Data Model**: [../data-model.md](../data-model.md#2-validationresult-驗證結果)  
**Previous**: [checkpoint-1-type-check.md](./checkpoint-1-type-check.md)

---

## 契約概述

本契約定義第二個驗證檢查點,確保升級後所有現有測試通過,且測試覆蓋率維持在基準線以上。

**檢查點名稱**: `checkpoint-2-test-suite`  
**執行時機**: Checkpoint 1 通過且 tsconfig.json 已更新後  
**預期時間**: ≤22 秒 (基準: 19.6 秒 × 1.1 安全係數)

---

## 前置條件 (Preconditions)

執行此檢查點前,以下條件必須滿足:

### 1. Checkpoint 1 已通過 ✅

**驗證方式**:

```powershell
# 確認編譯成功
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Checkpoint 1 未通過,請先修復編譯錯誤"
    exit 1
}
```

### 2. tsconfig.json 已更新

**驗證方式**:

```powershell
# 檢查 target 和 lib 設定
$tsconfig = Get-Content tsconfig.json | ConvertFrom-Json
if ($tsconfig.compilerOptions.target -ne "ES2023") {
    Write-Error "tsconfig.json target 未設為 ES2023"
    exit 1
}
if ($tsconfig.compilerOptions.lib -notcontains "ES2023") {
    Write-Error "tsconfig.json lib 未包含 ES2023"
    exit 1
}
```

**預期配置**:

```json
{
	"compilerOptions": {
		"target": "ES2023",
		"lib": ["ES2023"]
		// ...其他選項
	}
}
```

### 3. 測試框架可用

**驗證方式**:

```powershell
# 檢查測試依賴
npm list mocha @vscode/test-electron
```

**預期輸出**:

```
singular-blockly@0.37.1 E:\singular-blockly
├── mocha@10.8.2
└── @vscode/test-electron@2.4.1
```

---

## 驗證動作 (Validation Action)

### 主要指令

```powershell
npm test
```

### 預期行為

1. **編譯測試檔案**: 使用 TypeScript 編譯 src/test/ 下的測試
2. **啟動 VSCode Extension Host**: 執行 @vscode/test-electron
3. **執行測試套件**: 運行所有 .test.ts 檔案中的測試
4. **產生覆蓋率報告**: 輸出至 coverage/ 目錄

### 詳細驗證步驟

#### 步驟 1: 清理舊測試產物 (可選)

```powershell
# 刪除舊的覆蓋率報告
Remove-Item -Recurse -Force coverage -ErrorAction SilentlyContinue
```

#### 步驟 2: 執行測試套件

```powershell
# 執行測試並捕獲輸出
$testStartTime = Get-Date
npm test 2>&1 | Tee-Object -Variable testOutput
$testEndTime = Get-Date
$testDuration = ($testEndTime - $testStartTime).TotalSeconds
```

#### 步驟 3: 解析測試結果

```powershell
# 提取測試統計
$passedLine = $testOutput | Select-String "passing"
$failedLine = $testOutput | Select-String "failing"

# 範例輸出: "190 passing (19.6s)"
if ($passedLine -match "(\d+) passing") {
    $testsPassed = [int]$Matches[1]
}

if ($failedLine -match "(\d+) failing") {
    $testsFailed = [int]$Matches[1]
} else {
    $testsFailed = 0
}

$testsTotal = $testsPassed + $testsFailed
```

#### 步驟 4: 讀取覆蓋率報告

```powershell
# 從 coverage/coverage-summary.json 讀取
$coveragePath = "coverage/coverage-summary.json"
if (Test-Path $coveragePath) {
    $coverage = Get-Content $coveragePath | ConvertFrom-Json
    $coveragePercent = $coverage.total.lines.pct
} else {
    Write-Warning "覆蓋率報告不存在: $coveragePath"
    $coveragePercent = 0
}
```

---

## 成功條件 (Success Criteria)

所有以下條件必須同時滿足:

### 1. 所有測試通過 ✅

**判斷標準**:

-   `$testsFailed === 0`
-   終端輸出包含 "passing" 且數字 = 190
-   無 "AssertionError" 或 "Error:" 訊息

**範例成功輸出**:

```
  FileService
    ✓ should read file content
    ✓ should write file content
    ✓ should handle non-existent files

  SettingsManager
    ✓ should load settings
    ✓ should update settings
    ✓ should sync PlatformIO settings

  ... (更多測試)

  190 passing (19.6s)
```

### 2. 測試覆蓋率 ≥87.21% ✅

**檢查方式**:

```powershell
if ($coveragePercent -lt 87.21) {
    Write-Error "測試覆蓋率低於基準: $coveragePercent% (要求: ≥87.21%)"
    exit 1
}
```

**覆蓋率報告位置**: `coverage/index.html`

**範例覆蓋率摘要**:

```json
{
	"total": {
		"lines": { "total": 1450, "covered": 1265, "pct": 87.21 },
		"statements": { "total": 1520, "covered": 1328, "pct": 87.37 },
		"functions": { "total": 280, "covered": 245, "pct": 87.5 },
		"branches": { "total": 320, "covered": 278, "pct": 86.88 }
	}
}
```

### 3. 測試執行時間 ≤22 秒 ✅

**檢查方式**:

```powershell
Write-Host "測試執行時間: $testDuration 秒"

if ($testDuration -gt 22.0) {
    Write-Warning "測試執行時間超過 22 秒基準 (基準: 19.6s × 1.1)"
}
```

**注意**: 若略微超過 (例: 22.5 秒),不視為失敗,但需記錄警告

### 4. 無迴歸錯誤 ✅

**定義**: 升級前通過的測試,升級後也必須通過

**檢查方式**: 比較 Git commit 前後的測試結果

```powershell
# 假設升級前測試結果已記錄
$baselineTests = 190
if ($testsPassed -lt $baselineTests) {
    Write-Error "測試數量減少: $testsPassed (基準: $baselineTests)"
    exit 1
}
```

---

## 對應 data-model.md

```typescript
const result: ValidationResult = {
	timestamp: new Date().toISOString(),
	checkpointName: 'checkpoint-2-test-suite',
	testsPassed: 190,
	testsFailed: 0,
	testsTotal: 190,
	coveragePercent: 87.21,
	buildTimeMs: 19600, // 測試執行時間 (毫秒)
	passed: true,
	errorMessage: undefined,
};
```

---

## 失敗處理 (Failure Handling)

### 失敗類型 1: 測試執行錯誤

**範例錯誤**:

```
Error: Cannot find module 'vscode'
at Function.Module._resolveFilename
```

**診斷步驟**:

1. 確認 @vscode/test-electron 版本: `npm list @vscode/test-electron`
2. 檢查測試環境配置: `src/test/runTest.ts`

**修復方式**:

```powershell
# 重新安裝測試依賴
npm install @vscode/test-electron@2.4.1 --save-dev
```

### 失敗類型 2: 測試失敗 (功能迴歸)

**範例錯誤**:

```
  1) FileService
       should read file content:
     AssertionError: expected undefined to equal 'file content'
      at Context.<anonymous> (src/test/suite/fileService.test.ts:42:28)
```

**診斷步驟**:

1. 檢查失敗測試的檔案和行號
2. 執行單一測試隔離問題: `npm test -- --grep "should read file content"`
3. 檢查型別定義變更是否影響邏輯

**修復方式**:

-   若為型別不相容: 調整程式碼以符合新型別定義
-   若為測試過時: 更新測試以反映新行為 (需謹慎評估)

### 失敗類型 3: 覆蓋率下降

**範例輸出**:

```
Coverage decreased from 87.21% to 85.50%
```

**診斷步驟**:

1. 查看 `coverage/index.html` 找出未覆蓋的程式碼
2. 確認是否因新型別定義引入新分支

**修復方式**:

```powershell
# 產生詳細覆蓋率報告
npm test -- --coverage

# 查看哪些檔案覆蓋率下降
# 在瀏覽器開啟 coverage/index.html
Start-Process coverage/index.html
```

**重要**: 若無法立即恢復覆蓋率,考慮:

-   暫時接受略低的覆蓋率 (例: 86.5%),記錄技術債務
-   建立 GitHub Issue 追蹤覆蓋率恢復任務

### 失敗類型 4: 測試超時

**範例錯誤**:

```
Error: Timeout of 30000ms exceeded
```

**診斷步驟**:

1. 確認是否為網路或 I/O 操作延遲
2. 檢查是否有測試寫死等待時間

**修復方式**:

```typescript
// 調整測試超時設定
it('should handle slow operations', async function () {
	this.timeout(60000); // 增加至 60 秒
	// ... test logic
});
```

---

## 回滾策略 (Rollback Strategy)

若檢查點 2 失敗且無法立即修復:

### 1. 回滾至 Checkpoint 1 狀態

```powershell
# 回滾 tsconfig.json
git checkout HEAD -- tsconfig.json

# 重新編譯
npm run compile
```

### 2. 驗證回滾後測試通過

```powershell
npm test

# 預期: 190/190 passing, 87.21% coverage
```

### 3. 分析根本原因

可能的原因:

-   ES2023 語法導致執行環境問題 (unlikely,但需確認)
-   型別定義變更觸發邏輯錯誤
-   測試環境配置問題

---

## 驗證腳本 (Automated Validation Script)

完整的 PowerShell 驗證腳本:

```powershell
# checkpoint-2-validate.ps1
# 驗證測試套件檢查點

Write-Host "=== Checkpoint 2: 測試套件 ===" -ForegroundColor Cyan

# 前置條件檢查
Write-Host "`n[1/5] 檢查前置條件..." -ForegroundColor Yellow

# 檢查 tsconfig.json
$tsconfig = Get-Content tsconfig.json | ConvertFrom-Json
$target = $tsconfig.compilerOptions.target
$lib = $tsconfig.compilerOptions.lib

Write-Host "  - tsconfig.json target: $target (預期: ES2023)"
Write-Host "  - tsconfig.json lib: $($lib -join ', ') (預期: ES2023)"

if ($target -ne "ES2023" -or "ES2023" -notin $lib) {
    Write-Host "  ❌ tsconfig.json 配置不正確" -ForegroundColor Red
    exit 1
}

# 執行測試套件
Write-Host "`n[2/5] 執行測試套件..." -ForegroundColor Yellow

$testStartTime = Get-Date
$testOutput = npm test 2>&1
$testEndTime = Get-Date
$testDuration = ($testEndTime - $testStartTime).TotalSeconds

# 解析測試結果
Write-Host "`n[3/5] 解析測試結果..." -ForegroundColor Yellow

$testsPassed = 0
$testsFailed = 0

if ($testOutput -match "(\d+) passing") {
    $testsPassed = [int]$Matches[1]
}
if ($testOutput -match "(\d+) failing") {
    $testsFailed = [int]$Matches[1]
}

$testsTotal = $testsPassed + $testsFailed
$testSuccess = $LASTEXITCODE -eq 0 -and $testsFailed -eq 0

if ($testSuccess) {
    Write-Host "  ✅ 測試通過: $testsPassed/$testsTotal" -ForegroundColor Green
} else {
    Write-Host "  ❌ 測試失敗: $testsFailed/$testsTotal" -ForegroundColor Red
    $testOutput | Select-String "Error|failing" | ForEach-Object {
        Write-Host "     $_" -ForegroundColor Red
    }
}

# 檢查覆蓋率
Write-Host "`n[4/5] 檢查測試覆蓋率..." -ForegroundColor Yellow

$coveragePath = "coverage/coverage-summary.json"
if (Test-Path $coveragePath) {
    $coverage = Get-Content $coveragePath | ConvertFrom-Json
    $coveragePercent = $coverage.total.lines.pct

    if ($coveragePercent -ge 87.21) {
        Write-Host "  ✅ 覆蓋率: $coveragePercent% (基準: ≥87.21%)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 覆蓋率不足: $coveragePercent% (基準: ≥87.21%)" -ForegroundColor Red
        $testSuccess = $false
    }
} else {
    Write-Host "  ⚠️  覆蓋率報告不存在" -ForegroundColor Yellow
}

# 檢查執行時間
Write-Host "`n[5/5] 檢查執行時間..." -ForegroundColor Yellow

Write-Host "  測試執行時間: $([math]::Round($testDuration, 2)) 秒"

if ($testDuration -gt 22.0) {
    Write-Host "  ⚠️  執行時間略長 (基準: ≤22 秒)" -ForegroundColor Yellow
}

# 輸出摘要
Write-Host "`n=== 驗證摘要 ===" -ForegroundColor Cyan
Write-Host "測試通過: $testsPassed/$testsTotal"
Write-Host "測試失敗: $testsFailed"
Write-Host "覆蓋率: $coveragePercent%"
Write-Host "執行時間: $([math]::Round($testDuration, 2)) 秒"
Write-Host "退出碼: $LASTEXITCODE"

if ($testSuccess) {
    Write-Host "`n✅ Checkpoint 2 通過!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Checkpoint 2 失敗" -ForegroundColor Red
    exit 1
}
```

**使用方式**:

```powershell
# 執行驗證腳本
.\specs\007-safe-types-upgrade\contracts\checkpoint-2-validate.ps1
```

---

## 契約驗證紀錄範例

### 成功範例

```
=== Checkpoint 2: 測試套件 ===

[1/5] 檢查前置條件...
  - tsconfig.json target: ES2023 (預期: ES2023)
  - tsconfig.json lib: ES2023 (預期: ES2023)

[2/5] 執行測試套件...

  FileService
    ✓ should read file content (45ms)
    ✓ should write file content (38ms)
    ...

  190 passing (19.6s)

[3/5] 解析測試結果...
  ✅ 測試通過: 190/190

[4/5] 檢查測試覆蓋率...
  ✅ 覆蓋率: 87.21% (基準: ≥87.21%)

[5/5] 檢查執行時間...
  測試執行時間: 19.6 秒

=== 驗證摘要 ===
測試通過: 190/190
測試失敗: 0
覆蓋率: 87.21%
執行時間: 19.6 秒
退出碼: 0

✅ Checkpoint 2 通過!
```

### 失敗範例

```
=== Checkpoint 2: 測試套件 ===

[1/5] 檢查前置條件...
  - tsconfig.json target: ES2023 (預期: ES2023)
  - tsconfig.json lib: ES2023 (預期: ES2023)

[2/5] 執行測試套件...

  FileService
    ✓ should read file content
    1) should write file content
        AssertionError: expected undefined to equal 'content'
    ...

  189 passing (20.1s)
  1 failing

[3/5] 解析測試結果...
  ❌ 測試失敗: 1/190

[4/5] 檢查測試覆蓋率...
  ❌ 覆蓋率不足: 85.50% (基準: ≥87.21%)

[5/5] 檢查執行時間...
  測試執行時間: 20.1 秒

=== 驗證摘要 ===
測試通過: 189/190
測試失敗: 1
覆蓋率: 85.50%
執行時間: 20.1 秒
退出碼: 1

❌ Checkpoint 2 失敗
```

---

**契約版本**: 1.0  
**最後更新**: 2025-01-26  
**下一個檢查點**: [checkpoint-3-build-artifact.md](./checkpoint-3-build-artifact.md)
