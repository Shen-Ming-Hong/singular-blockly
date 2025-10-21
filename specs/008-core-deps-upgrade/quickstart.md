# Quickstart Guide: Blockly 12.x 升級開發環境

**Feature**: Phase 1 核心依賴升級  
**Phase**: Design  
**Date**: 2025-01-21

## 概述

本指南協助開發者快速設定 Blockly 12.3.1 升級後的開發環境,包含依賴安裝、建置流程、測試執行和手動測試步驟。適用於新加入的開發者或需要重新設定環境的情境。

---

## 前置需求

### 必要軟體

| 軟體        | 最低版本 | 推薦版本 | 驗證指令         |
| ----------- | -------- | -------- | ---------------- |
| **Node.js** | 18.x     | 22.16.0+ | `node --version` |
| **npm**     | 8.x      | 10.x+    | `npm --version`  |
| **VS Code** | 1.96.0   | 最新版   | `code --version` |
| **Git**     | 2.x      | 最新版   | `git --version`  |

### VS Code 擴充功能

-   **必要**: `platformio.platformio-ide` (Arduino 開發支援)
-   **推薦**: ESLint, Prettier, GitLens

### 作業系統支援

-   ✅ Windows 10/11
-   ✅ macOS 12+
-   ✅ Linux (Ubuntu 20.04+)

---

## 快速開始

### 1. 取得專案原始碼

```powershell
# 複製儲存庫
git clone https://github.com/Shen-Ming-Hong/singular-blockly.git
cd singular-blockly

# 切換到升級分支 (如果還在開發中)
git checkout 008-core-deps-upgrade

# 或者拉取最新的 master 分支 (升級完成後)
git checkout master
git pull origin master
```

### 2. 安裝依賴 (升級後)

```powershell
# 安裝所有依賴 (包含 Blockly 12.3.1)
npm install

# 如果遇到 peer dependency 警告,使用:
npm install --legacy-peer-deps
```

**預期安裝的套件**:

-   `blockly@12.3.1` (從 11.2.2 升級)
-   `@blockly/theme-modern@7.0.1` (從 6.0.12 升級)
-   `typescript@5.9.3`
-   `webpack@5.102.1`
-   其他 devDependencies

**安裝驗證**:

```powershell
# 檢查 Blockly 版本
npm list blockly
# 應顯示: blockly@12.3.1

# 檢查主題套件版本
npm list @blockly/theme-modern
# 應顯示: @blockly/theme-modern@7.0.1
```

### 3. 編譯專案

```powershell
# 一次性編譯
npm run compile

# 監視模式 (開發時推薦)
npm run watch
```

**編譯成功標誌**:

```
webpack 5.102.1 compiled successfully in XXXX ms
asset extension.js XXX KiB [emitted] [minimized] (name: main)
```

**效能基準** (升級後):

-   ⏱️ 編譯時間: ~4.6 秒 ± 10% (4.14s - 5.06s)
-   📦 Bundle 大小: ~130KB ± 5% (124KB - 137KB)

---

## 開發流程

### 建置指令

| 指令                        | 用途         | 使用時機       |
| --------------------------- | ------------ | -------------- |
| `npm run compile`           | 一次性編譯   | 測試前、提交前 |
| `npm run watch`             | 監視模式編譯 | 開發期間       |
| `npm run package`           | 生產打包     | 發布前         |
| `npm run vscode:prepublish` | 發布前處理   | 自動執行       |

### 測試指令

| 指令                    | 用途           | 預期結果              |
| ----------------------- | -------------- | --------------------- |
| `npm test`              | 執行所有測試   | 190 tests passed, <3s |
| `npm run test:coverage` | 測試覆蓋率報告 | ≥87.21% coverage      |
| `npm run test:bail`     | 遇錯即停測試   | 快速錯誤定位          |

**測試執行範例**:

```powershell
npm test
```

**預期輸出**:

```
  Extension Tests
    ✓ should activate extension
    ✓ should register commands
    ... (188 more tests)

  190 passing (2.8s)
```

### Lint 指令

| 指令                | 用途            | 修復方式                  |
| ------------------- | --------------- | ------------------------- |
| `npm run lint`      | 檢查 TypeScript | 修正 `src/` 下的問題      |
| `npm run lint:i18n` | 檢查 i18n 腳本  | 修正 `scripts/i18n/` 問題 |

---

## 開發環境設定

### VS Code 設定

**開啟專案**:

```powershell
code .
```

**推薦設定** (`.vscode/settings.json`):

```json
{
	"typescript.tsdk": "node_modules/typescript/lib",
	"editor.formatOnSave": true,
	"eslint.validate": ["typescript"],
	"files.exclude": {
		"**/.git": true,
		"**/node_modules": true,
		"**/out": true,
		"**/dist": true
	}
}
```

### Extension Development Host

**啟動偵錯**:

1. 按下 `F5` 或選擇 `Run > Start Debugging`
2. VS Code 會開啟新視窗 (Extension Development Host)
3. 在新視窗執行 `Singular Blockly: Open Blockly Edit`

**偵錯 WebView**:

1. 在 Extension Development Host 中開啟 Blockly 編輯器
2. 右鍵點擊 WebView 面板 → `開啟開發人員工具`
3. 使用 Chrome DevTools 偵錯 JavaScript

**日誌查看**:

-   Extension Host 日誌: `Output` → `Singular Blockly`
-   WebView 日誌: WebView DevTools → `Console`

---

## 手動測試指南

### 測試場景 1: Blockly 編輯器載入

**步驟**:

1. 按下 `F5` 啟動 Extension Development Host
2. 建立新工作區資料夾 (或開啟現有專案)
3. 執行指令 `Singular Blockly: Open Blockly Edit`
4. 觀察 Blockly 編輯器是否正常顯示

**驗收標準**:

-   ✅ 工具箱正常載入 (顯示所有類別)
-   ✅ 工作區背景顏色正確
-   ✅ 積木可正常拖曳
-   ✅ 無 console 錯誤

### 測試場景 2: 主題切換

**步驟**:

1. 開啟 Blockly 編輯器
2. 點擊右上角主題切換按鈕 (🌙 / ☀️)
3. 觀察主題是否切換

**驗收標準**:

-   ✅ 淺色 ↔ 深色主題順利切換
-   ✅ 工作區背景顏色改變
-   ✅ 積木顏色保持一致
-   ✅ 切換後重新載入仍保持選擇

### 測試場景 3: 板卡配置切換

**步驟**:

1. 開啟 Blockly 編輯器
2. 從下拉選單選擇不同開發板:
    - Arduino Uno
    - Arduino Nano
    - Arduino Mega
    - ESP32
    - Super Mini
3. 觀察工具箱和積木變化

**驗收標準**:

-   ✅ 板卡選單顯示 5 個選項
-   ✅ 切換板卡後工具箱更新
-   ✅ PlatformIO 設定檔產生正確
-   ✅ 切換後重新載入仍保持選擇

### 測試場景 4: 工作區序列化/反序列化

**步驟**:

1. 在 Blockly 編輯器中拖曳一些積木
2. 儲存專案 (自動儲存或手動儲存)
3. 關閉並重新開啟 Blockly 編輯器
4. 檢查積木是否還原

**驗收標準**:

-   ✅ 積木位置正確還原
-   ✅ 積木連接關係保持
-   ✅ 變數定義保留
-   ✅ 無資料遺失

### 測試場景 5: 載入舊版工作區 (向後相容性)

**步驟**:

1. 準備 Blockly 11.2.2 產生的 `main.json` 檔案
2. 將檔案放置於 `{workspace}/blockly/main.json`
3. 開啟 Blockly 編輯器
4. 檢查工作區是否正常載入

**驗收標準**:

-   ✅ 舊版 JSON 檔案可正常解析
-   ✅ 積木全部顯示
-   ✅ 無 console 錯誤
-   ✅ 可正常儲存 (升級為 Blockly 12 格式)

### 測試場景 6: 程式碼產生

**步驟**:

1. 拖曳幾個積木 (例如 `setup`, `loop`, `digitalWrite`)
2. 觀察右側程式碼預覽面板
3. 複製程式碼到 PlatformIO 專案

**驗收標準**:

-   ✅ Arduino C++ 程式碼正確產生
-   ✅ 包含必要的 `#include` 標頭
-   ✅ `setup()` 和 `loop()` 函式完整
-   ✅ 程式碼可在 PlatformIO 中編譯

### 測試場景 7: 多語言介面

**步驟**:

1. 變更 VS Code 語言設定 (檔案 > 偏好設定 > 語言)
2. 重新啟動 VS Code
3. 開啟 Blockly 編輯器

**測試語言** (至少測試 3 種):

-   ✅ 繁體中文 (zh-TW)
-   ✅ 英文 (en)
-   ✅ 日文 (ja)

**驗收標準**:

-   ✅ 工具箱類別名稱翻譯正確
-   ✅ 積木文字翻譯正確
-   ✅ 按鈕和選單翻譯正確
-   ✅ 無遺漏翻譯 (顯示 key 而非翻譯)

---

## 常見問題排解

### Q1: 編譯時出現 TypeScript 錯誤

**症狀**:

```
ERROR in src/extension.ts:XX:XX
TS2339: Property 'xxx' does not exist on type 'yyy'
```

**解決方案**:

```powershell
# 清除編譯快取
Remove-Item -Recurse -Force out, dist

# 重新編譯
npm run compile
```

**如果問題持續**:

-   檢查 `tsconfig.json` 配置是否正確
-   確認 `node_modules` 已安裝完整
-   重新安裝依賴: `npm ci`

### Q2: Blockly 編輯器無法載入

**症狀**:

-   空白頁面
-   Console 錯誤: `Blockly is not defined`

**解決方案**:

1. 檢查 `media/html/blocklyEdit.html` 中的 Blockly 腳本載入
2. 驗證 webpack 打包成功
3. 清除 WebView 快取: 重新啟動 Extension Development Host

**檢查腳本路徑**:

```html
<!-- 應該正確載入 -->
<script src="${blocklyUri}/blockly_compressed.js"></script>
<script src="${blocklyUri}/blocks_compressed.js"></script>
<script src="${blocklyUri}/javascript_compressed.js"></script>
```

### Q3: 主題切換後顏色異常

**症狀**:

-   主題切換後部分顏色未改變
-   積木顏色與預期不符

**解決方案**:

1. 檢查 `media/blockly/themes/singular.js` 和 `singularDark.js`
2. 驗證 `Blockly.Themes.Modern` 是否正確載入
3. 清除瀏覽器快取 (WebView DevTools → Network → Disable cache)

**驗證主題載入**:

```javascript
// 在 WebView Console 執行
console.log(window.SingularBlocklyTheme);
console.log(window.SingularBlocklyDarkTheme);
// 應顯示完整的主題物件
```

### Q4: 測試執行失敗

**症狀**:

```
Error: Cannot find module '@vscode/test-electron'
```

**解決方案**:

```powershell
# 重新安裝測試依賴
npm install --save-dev @vscode/test-cli @vscode/test-electron

# 編譯測試
npm run compile-tests

# 執行測試
npm test
```

### Q5: 工作區檔案無法載入 (JSON 解析錯誤)

**症狀**:

```
Error: Unexpected token in JSON at position XXX
```

**解決方案**:

1. 檢查 `blockly/main.json` 檔案格式是否正確
2. 使用 JSON validator 驗證: https://jsonlint.com/
3. 備份並刪除損壞的檔案,重新建立工作區

**JSON 格式檢查**:

```powershell
# 使用 PowerShell 驗證 JSON
Get-Content blockly/main.json | ConvertFrom-Json
# 如果無錯誤,檔案格式正確
```

### Q6: Bundle 大小超出 ±5% 限制

**症狀**:

-   編譯後 `dist/extension.js` 大小 >137KB

**解決方案**:

1. 分析 bundle 組成: 使用 webpack-bundle-analyzer
2. 檢查是否引入不必要的依賴
3. 確認 tree-shaking 正常運作

**分析 Bundle**:

```powershell
# 安裝分析工具
npm install --save-dev webpack-bundle-analyzer

# 在 webpack.config.js 中啟用分析
# 執行編譯並查看報告
npm run package
```

---

## 效能驗證

### 編譯時間基準

**測試環境**: Windows 11, Intel i7-12700K, 32GB RAM, SSD

| 指令              | Blockly 11.2.2 | Blockly 12.3.1 | 變化    |
| ----------------- | -------------- | -------------- | ------- |
| `npm run compile` | 4.6s           | 4.5s - 5.0s    | ±10% ✅ |
| `npm run package` | 8.2s           | 8.0s - 9.0s    | ±10% ✅ |

**驗證指令**:

```powershell
# 計時編譯
Measure-Command { npm run compile }
# 檢查輸出: TotalSeconds 應在 4.14 - 5.06 秒範圍
```

### Bundle 大小基準

| 檔案                | Blockly 11.2.2 | Blockly 12.3.1 | 變化   |
| ------------------- | -------------- | -------------- | ------ |
| `dist/extension.js` | 130,506 bytes  | 130KB - 137KB  | ±5% ✅ |

**驗證指令**:

```powershell
# 檢查 bundle 大小
(Get-Item dist/extension.js).Length
# 應在 123,980 - 136,931 bytes 範圍
```

### 測試執行時間基準

| 測試套件  | Blockly 11.2.2 | Blockly 12.3.1 | 目標 |
| --------- | -------------- | -------------- | ---- |
| 190 tests | 2.8s           | <3s            | ✅   |

**驗證**:

```powershell
npm test
# 觀察輸出: "190 passing (2.Xs)"
```

---

## 開發最佳實踐

### 程式碼風格

1. **遵循 ESLint 規則**:

    ```powershell
    npm run lint
    # 修正所有錯誤後再提交
    ```

2. **使用 TypeScript 嚴格模式**:

    - 啟用 `strict: true` in `tsconfig.json`
    - 避免使用 `any` 型別

3. **撰寫測試**:
    - 新功能必須包含單元測試
    - 維持測試覆蓋率 ≥87.21%

### Git 工作流程

**提交前檢查清單**:

-   [ ] `npm run compile` 成功
-   [ ] `npm test` 全部通過
-   [ ] `npm run lint` 無錯誤
-   [ ] 手動測試關鍵功能

**提交訊息格式** (Conventional Commits):

```
feat: 新增 Blockly 12.3.1 支援
fix: 修正主題切換錯誤
test: 新增工作區序列化測試
docs: 更新 README Blockly 版本資訊
```

### 偵錯技巧

**Extension Host 偵錯**:

```typescript
// 在 src/extension.ts 中
import { log } from './services/logging';
log.info('Blockly version:', blocklyVersion);
```

**WebView 偵錯**:

```javascript
// 在 media/js/blocklyEdit.js 中
console.log('Workspace initialized:', workspace);
log.debug('Current board:', window.currentBoard);
```

**中斷點設定**:

1. Extension Host: VS Code 偵錯器中設定中斷點
2. WebView: Chrome DevTools → Sources → 設定中斷點

---

## 進階設定

### 使用自訂 Blockly 版本 (開發用)

如需測試特定 Blockly 版本:

```powershell
# 安裝特定版本
npm install blockly@12.3.0

# 或從 GitHub 安裝
npm install google/blockly#v12.3.1
```

### 啟用 Source Maps

**webpack.config.js**:

```javascript
module.exports = {
	mode: 'development',
	devtool: 'source-map', // 啟用 source maps
	// ...
};
```

重新編譯後可在 WebView DevTools 中看到原始 TypeScript 程式碼。

### 效能分析

**啟用 Chrome DevTools Performance**:

1. 開啟 WebView DevTools
2. Performance → Record
3. 操作 Blockly 編輯器 (拖曳積木、切換主題)
4. Stop → 分析效能瓶頸

---

## 參考資源

### 官方文件

-   **Blockly Guides**: https://developers.google.com/blockly/guides/overview
-   **Blockly API Reference**: https://developers.google.com/blockly/reference/js
-   **@blockly/theme-modern**: https://google.github.io/blockly-samples/plugins/theme-modern/

### 專案文件

-   **Architecture Guide**: `.github/copilot-instructions.md`
-   **Testing Guide**: `specs/004-test-coverage-improvement/`
-   **I18n Guide**: `specs/002-i18n-localization-review/`

### 社群資源

-   **GitHub Issues**: https://github.com/google/blockly/issues
-   **Google Groups**: https://groups.google.com/g/blockly

---

## 快速指令參考

```powershell
# 開發流程
npm install              # 安裝依賴
npm run watch           # 監視編譯
F5                      # 啟動偵錯

# 測試流程
npm test                # 執行測試
npm run test:coverage   # 測試覆蓋率
npm run lint            # 程式碼檢查

# 建置流程
npm run compile         # 編譯
npm run package         # 打包
npm run vscode:prepublish  # 發布前處理

# 清理
Remove-Item -Recurse -Force out, dist, node_modules
npm install
npm run compile
```

---

**Quickstart Status**: ✅ 完成  
**Last Updated**: 2025-01-21  
**Next Step**: 更新 .github/copilot-instructions.md (Phase 1 最後任務)
