# Checkpoint 3: 建置產物契約

**Spec**: [../spec.md](../spec.md) | **Plan**: [../plan.md](../plan.md)  
**Data Model**: [../data-model.md](../data-model.md#3-buildartifact-建置產物)  
**Previous**: [checkpoint-2-test-suite.md](./checkpoint-2-test-suite.md)

---

## 契約概述

本契約定義第三個驗證檢查點,確保升級後的建置產物大小變化在可接受範圍內,且功能正常運作。

**檢查點名稱**: `checkpoint-3-build-artifact`  
**執行時機**: Checkpoint 1 和 2 均通過後  
**預期時間**: 5 分鐘 (手動驗證)

---

## 前置條件 (Preconditions)

執行此檢查點前,以下條件必須滿足:

### 1. Checkpoint 1 和 2 已通過 ✅

**驗證方式**:

```powershell
# 確認編譯成功
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Checkpoint 1 未通過"
    exit 1
}

# 確認測試通過
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Error "Checkpoint 2 未通過"
    exit 1
}
```

### 2. 建置產物已產生

**驗證方式**:

```powershell
# 檢查 dist 目錄結構
if (-not (Test-Path dist/extension.js)) {
    Write-Error "建置產物不存在: dist/extension.js"
    exit 1
}
```

**預期檔案結構**:

```
dist/
├── extension.js       # 主要擴充功能程式碼
├── extension.js.map   # Source map (若啟用)
└── [其他 webpack 產物]
```

### 3. 基準線資料可用

**基準線檔案大小**: 130,506 bytes (升級前的 dist/extension.js)

**記錄方式**:

```powershell
# 在升級前記錄基準線
$baselineSize = (Get-Item dist/extension.js).Length
Write-Host "基準線大小: $baselineSize bytes"

# 儲存至變數供後續比較
$env:BASELINE_SIZE = $baselineSize
```

---

## 驗證動作 (Validation Action)

### 主要檢查項目

1. **檔案大小檢查**: 確認產物大小變化在 ±5% 範圍內
2. **檔案完整性**: 驗證 webpack 產物結構正確
3. **功能驗證**: 手動測試擴充功能核心功能
4. **效能檢查**: 確認啟動時間無明顯退化

### 詳細驗證步驟

#### 步驟 1: 檔案大小比較

```powershell
# 讀取新建置產物大小
$newSize = (Get-Item dist/extension.js).Length
$baselineSize = 130506  # 基準線

# 計算變化百分比
$sizeChangePct = (($newSize - $baselineSize) / $baselineSize) * 100

Write-Host "建置產物大小比較:"
Write-Host "  基準線: $baselineSize bytes"
Write-Host "  新產物: $newSize bytes"
Write-Host "  變化: $([math]::Round($sizeChangePct, 2))%"

# 檢查是否在 ±5% 範圍內
if ([math]::Abs($sizeChangePct) -gt 5.0) {
    Write-Warning "產物大小變化超過 ±5% 容忍範圍"
} else {
    Write-Host "  ✅ 大小變化在可接受範圍內" -ForegroundColor Green
}
```

#### 步驟 2: 檔案完整性檢查

```powershell
# 檢查 webpack 產物結構
$distFiles = Get-ChildItem dist -Recurse

Write-Host "`n建置產物檔案:"
$distFiles | ForEach-Object {
    Write-Host "  - $($_.Name) ($($_.Length) bytes)"
}

# 確認必要檔案存在
$requiredFiles = @('extension.js')
$missingFiles = $requiredFiles | Where-Object {
    -not (Test-Path "dist/$_")
}

if ($missingFiles.Count -gt 0) {
    Write-Error "缺少必要檔案: $($missingFiles -join ', ')"
    exit 1
}
```

#### 步驟 3: 校驗碼計算 (可選)

```powershell
# 計算 SHA-256 校驗碼
$hash = Get-FileHash dist/extension.js -Algorithm SHA256

Write-Host "`n檔案校驗碼:"
Write-Host "  SHA-256: $($hash.Hash)"

# 可選: 記錄至檔案供未來比對
$hash.Hash | Out-File dist/extension.js.sha256
```

---

## 成功條件 (Success Criteria)

所有以下條件必須同時滿足:

### 1. 檔案大小變化 ±5% ✅

**判斷標準**:

-   `Math.Abs((newSize - baselineSize) / baselineSize * 100) <= 5.0`
-   基準線: 130,506 bytes
-   可接受範圍: 123,980 - 137,031 bytes

**範例計算**:

```typescript
const baseline = 130506;
const newSize = 132018;
const changePct = ((newSize - baseline) / baseline) * 100; // 1.16%

const acceptable = Math.abs(changePct) <= 5.0; // true
```

### 2. 擴充功能可正常啟動 ✅

**手動驗證步驟**:

1. 在 VSCode 中按 F5 啟動 Extension Development Host
2. 檢查 Debug Console 無嚴重錯誤訊息
3. 預期輸出:

```
[Extension Host] Singular Blockly activated
[Extension Host] Loaded 15 Blockly modules
[Extension Host] i18n: zh-hant
```

**失敗指標**:

```
[Extension Host] ERROR: Cannot load extension
[Extension Host] TypeError: xxx is not a function
```

### 3. 核心功能正常運作 ✅

**功能測試檢查清單**:

-   [ ] **開啟 Blockly 編輯器**
    -   操作: 在 workspace 建立 `.ino` 檔案,右鍵選擇 "Open with Blockly Editor"
    -   預期: WebView 成功開啟,顯示 Blockly 工作區
-   [ ] **載入工作區狀態**
    -   操作: 拖曳積木至工作區
    -   預期: 積木正常顯示,可拖曳和連接
-   [ ] **儲存工作區**
    -   操作: 修改積木後關閉編輯器
    -   預期: 自動儲存至 `blockly/main.json`
-   [ ] **切換佈景主題**

    -   操作: 在編輯器工具列切換 Light/Dark 主題
    -   預期: Blockly 主題即時更新

-   [ ] **產生 Arduino 程式碼**
    -   操作: 拖曳 `setup_loop` 積木
    -   預期: 在預覽面板看到生成的 C++ 程式碼

**快速驗證腳本**:

```powershell
# 自動化功能測試 (需要人工確認)
Write-Host "=== 功能測試檢查清單 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "請手動執行以下測試:"
Write-Host "1. [ ] 開啟 Blockly 編輯器"
Write-Host "2. [ ] 載入工作區狀態"
Write-Host "3. [ ] 儲存工作區"
Write-Host "4. [ ] 切換佈景主題"
Write-Host "5. [ ] 產生 Arduino 程式碼"
Write-Host ""
$userConfirm = Read-Host "所有功能測試是否通過? (Y/N)"

if ($userConfirm -ne "Y") {
    Write-Error "功能測試未通過"
    exit 1
}
```

### 4. 無效能退化 ✅

**測量方式**:

```powershell
# 記錄擴充功能啟動時間
$activationStart = Get-Date

# 啟動 Extension Development Host (F5)
# 等待 "Singular Blockly activated" 訊息

$activationEnd = Get-Date
$activationTime = ($activationEnd - $activationStart).TotalSeconds

Write-Host "擴充功能啟動時間: $activationTime 秒"

# 基準線: ~2 秒 (取決於機器效能)
if ($activationTime -gt 5.0) {
    Write-Warning "啟動時間略長,可能存在效能問題"
}
```

**注意**: 啟動時間高度依賴機器效能和 VSCode 版本,此指標僅供參考

---

## 對應 data-model.md

```typescript
const artifact: BuildArtifact = {
	filePath: 'E:\\singular-blockly\\dist\\extension.js',
	sizeBytes: 132018,
	timestamp: new Date().toISOString(),
	checksum: 'a1b2c3d4e5f6...', // SHA-256
	sizeChangePct: 1.16,
	baselineSizeBytes: 130506,
};

// 驗證邏輯
const acceptable = Math.abs(artifact.sizeChangePct!) <= 5.0;
console.log(`產物大小: ${acceptable ? '✅ 通過' : '❌ 失敗'}`);
```

---

## 失敗處理 (Failure Handling)

### 失敗類型 1: 產物大小顯著增加 (>5%)

**範例情境**: 新產物 140,000 bytes (增加 7.27%)

**可能原因**:

1. TypeScript ES2023 產生更多 polyfill 程式碼
2. 新型別定義包含更多執行時檢查
3. webpack 配置問題

**診斷步驟**:

```powershell
# 分析 webpack bundle
npm install webpack-bundle-analyzer --save-dev

# 在 webpack.config.js 新增
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    // ...existing config
    plugins: [
        new BundleAnalyzerPlugin()
    ]
};

# 重新建置並查看分析報告
npm run compile
```

**修復方式**:

-   檢查是否有不必要的依賴被打包
-   調整 webpack 的 `externals` 配置排除 VSCode API
-   啟用 tree-shaking 移除未使用程式碼

**接受標準**: 若增加在 5-7% 且功能正常,可視為可接受的技術債務,記錄於 CHANGELOG

### 失敗類型 2: 產物大小顯著減少 (<-5%)

**範例情境**: 新產物 122,000 bytes (減少 6.52%)

**可能原因**:

1. 某些程式碼被錯誤地 tree-shaken
2. webpack 打包遺漏模組

**診斷步驟**:

```powershell
# 檢查是否所有模組都被打包
npm run compile -- --display-modules

# 搜尋關鍵模組
$webpackOutput | Select-String "fileService|settingsManager|localeService"
```

**修復方式**:

-   檢查 webpack entry points
-   確認 import 語句正確
-   執行功能測試驗證無遺失功能

### 失敗類型 3: 擴充功能無法啟動

**範例錯誤**:

```
[Extension Host] Failed to activate extension 'singular-blockly'
[Extension Host] TypeError: vscode.commands.registerCommand is not a function
```

**診斷步驟**:

1. 檢查 Debug Console 完整錯誤堆疊
2. 確認 `package.json` 中的 `main` 欄位指向正確產物
3. 驗證 webpack 的 `externals` 配置

**修復方式**:

```javascript
// webpack.config.js - 確保 vscode 模組被排除
module.exports = {
	externals: {
		vscode: 'commonjs vscode', // ✅ 必須設定
	},
};
```

### 失敗類型 4: 功能測試失敗

**範例**: Blockly 編輯器無法開啟

**診斷步驟**:

1. 開啟 Developer Tools (WebView)
2. 檢查 Console 錯誤訊息
3. 驗證 WebView 資源載入 (media/html/, media/js/)

**修復方式**:

-   檢查 `webviewManager.ts` 中的 `asWebviewUri()` 呼叫
-   確認 WebView CSP (Content Security Policy) 設定
-   驗證 Blockly 函式庫版本相容性

---

## 回滾策略 (Rollback Strategy)

若檢查點 3 失敗且功能不可用:

### 完整回滾至升級前狀態

```powershell
# 1. 回滾所有變更
git checkout HEAD -- package.json package-lock.json tsconfig.json

# 2. 重新安裝依賴
npm install

# 3. 重新建置
npm run compile

# 4. 驗證回滾成功
npm test

# 5. 檢查產物大小
$size = (Get-Item dist/extension.js).Length
Write-Host "回滾後產物大小: $size bytes (預期: ~130,506 bytes)"
```

---

## 驗證腳本 (Automated Validation Script)

完整的 PowerShell 驗證腳本:

```powershell
# checkpoint-3-validate.ps1
# 驗證建置產物檢查點

Write-Host "=== Checkpoint 3: 建置產物 ===" -ForegroundColor Cyan

# 前置條件檢查
Write-Host "`n[1/4] 檢查前置條件..." -ForegroundColor Yellow

if (-not (Test-Path dist/extension.js)) {
    Write-Error "建置產物不存在: dist/extension.js"
    exit 1
}

# 檔案大小比較
Write-Host "`n[2/4] 檢查檔案大小..." -ForegroundColor Yellow

$baselineSize = 130506
$newSize = (Get-Item dist/extension.js).Length
$sizeChangePct = (($newSize - $baselineSize) / $baselineSize) * 100

Write-Host "  基準線: $baselineSize bytes"
Write-Host "  新產物: $newSize bytes"
Write-Host "  變化: $([math]::Round($sizeChangePct, 2))%"

$sizeAcceptable = [math]::Abs($sizeChangePct) -le 5.0

if ($sizeAcceptable) {
    Write-Host "  ✅ 大小變化在 ±5% 範圍內" -ForegroundColor Green
} else {
    Write-Host "  ❌ 大小變化超過 ±5%" -ForegroundColor Red
}

# 檔案完整性
Write-Host "`n[3/4] 檢查檔案完整性..." -ForegroundColor Yellow

$hash = Get-FileHash dist/extension.js -Algorithm SHA256
Write-Host "  SHA-256: $($hash.Hash.Substring(0, 16))..."

# 功能測試 (需人工確認)
Write-Host "`n[4/4] 功能測試..." -ForegroundColor Yellow
Write-Host "  請手動執行以下測試:"
Write-Host "    1. 按 F5 啟動 Extension Development Host"
Write-Host "    2. 開啟 .ino 檔案,右鍵選擇 'Open with Blockly Editor'"
Write-Host "    3. 拖曳積木,切換主題,檢查程式碼生成"
Write-Host ""

$functionalOk = Read-Host "  功能測試是否通過? (Y/N)"

# 輸出摘要
Write-Host "`n=== 驗證摘要 ===" -ForegroundColor Cyan
Write-Host "產物大小: $newSize bytes (變化: $([math]::Round($sizeChangePct, 2))%)"
Write-Host "大小檢查: $(if ($sizeAcceptable) { '✅ 通過' } else { '❌ 失敗' })"
Write-Host "功能測試: $(if ($functionalOk -eq 'Y') { '✅ 通過' } else { '❌ 失敗' })"

if ($sizeAcceptable -and $functionalOk -eq 'Y') {
    Write-Host "`n✅ Checkpoint 3 通過!" -ForegroundColor Green
    Write-Host "所有驗證檢查點已完成,可以提交變更" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Checkpoint 3 失敗" -ForegroundColor Red
    exit 1
}
```

**使用方式**:

```powershell
# 執行驗證腳本
.\specs\007-safe-types-upgrade\contracts\checkpoint-3-validate.ps1
```

---

## 契約驗證紀錄範例

### 成功範例

```
=== Checkpoint 3: 建置產物 ===

[1/4] 檢查前置條件...

[2/4] 檢查檔案大小...
  基準線: 130506 bytes
  新產物: 132018 bytes
  變化: 1.16%
  ✅ 大小變化在 ±5% 範圍內

[3/4] 檢查檔案完整性...
  SHA-256: a1b2c3d4e5f6g7h8...

[4/4] 功能測試...
  請手動執行以下測試:
    1. 按 F5 啟動 Extension Development Host
    2. 開啟 .ino 檔案,右鍵選擇 'Open with Blockly Editor'
    3. 拖曳積木,切換主題,檢查程式碼生成

  功能測試是否通過? (Y/N): Y

=== 驗證摘要 ===
產物大小: 132018 bytes (變化: 1.16%)
大小檢查: ✅ 通過
功能測試: ✅ 通過

✅ Checkpoint 3 通過!
所有驗證檢查點已完成,可以提交變更
```

### 失敗範例 (產物過大)

```
=== Checkpoint 3: 建置產物 ===

[1/4] 檢查前置條件...

[2/4] 檢查檔案大小...
  基準線: 130506 bytes
  新產物: 140250 bytes
  變化: 7.47%
  ❌ 大小變化超過 ±5%

[3/4] 檢查檔案完整性...
  SHA-256: x9y8z7w6v5u4t3s2...

[4/4] 功能測試...
  (略過,因大小檢查未通過)

=== 驗證摘要 ===
產物大小: 140250 bytes (變化: 7.47%)
大小檢查: ❌ 失敗
功能測試: (未執行)

❌ Checkpoint 3 失敗

建議: 使用 webpack-bundle-analyzer 分析產物增長原因
```

---

## 最終驗證總結

### 完整驗證流程

```powershell
# 執行所有三個檢查點
Write-Host "=== 執行完整驗證流程 ===" -ForegroundColor Cyan

# Checkpoint 1
.\specs\007-safe-types-upgrade\contracts\checkpoint-1-validate.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

# Checkpoint 2
.\specs\007-safe-types-upgrade\contracts\checkpoint-2-validate.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

# Checkpoint 3
.\specs\007-safe-types-upgrade\contracts\checkpoint-3-validate.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n✅ 所有驗證檢查點通過!" -ForegroundColor Green
Write-Host "升級完成,可以提交變更並更新 CHANGELOG.md" -ForegroundColor Green
```

### 提交檢查清單

在 Git commit 前確認:

-   [x] ✅ Checkpoint 1: 型別檢查通過
-   [x] ✅ Checkpoint 2: 測試套件通過 (190/190, ≥87.21%)
-   [x] ✅ Checkpoint 3: 建置產物大小可接受 (±5%)
-   [x] ✅ 功能手動測試通過
-   [ ] ⏳ CHANGELOG.md 已更新
-   [ ] ⏳ Git commit message 遵循 Conventional Commits

---

**契約版本**: 1.0  
**最後更新**: 2025-01-26  
**完成**: 所有驗證檢查點契約已建立 ✅
