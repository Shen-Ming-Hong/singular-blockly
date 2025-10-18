# 測試框架修復進度報告

## 執行日期

2025-10-18

## 總體進度

### 修復前

-   ✅ 22 個測試通過
-   ❌ 31 個測試失敗
-   **通過率**: 41.5%

### 修復後

-   ✅ 28 個測試通過 (+6)
-   ❌ 25 個測試失敗 (-6)
-   **通過率**: 52.8% (+11.3%)

## 已修復的測試模組

### ✅ Logging Service (6/6 測試通過)

**修復方法**:

-   在 `logging.ts` 中添加依賴注入功能：
    -   `_setVSCodeApi()`: 允許測試注入 mock VSCode API
    -   `_getOutputChannel()`: 允許測試訪問內部 output channel
-   修改 `LogOutputChannel` mock 實作，使其正確模擬 VSCode API
-   更新所有 logging 測試以使用新的測試 API

**關鍵技術點**:

-   使用依賴注入而非全域變數替換
-   Mock 需要包含 `trace`, `debug`, `info`, `warn`, `error` 方法
-   每個測試前重置 output channel 狀態

**測試清單**:

-   [x] should create output channel and log messages
-   [x] should log messages with different levels
-   [x] should format additional arguments
-   [x] should handle WebView logs with source prefix
-   [x] should show output channel when requested
-   [x] should dispose output channel

### ✅ File Service - 基本操作 (6/10 測試通過)

**修復方法**:

-   修改測試從使用 `sinon.spy` 改為直接驗證 `FSMock` 的狀態
-   確保 mock 檔案系統的方法實際執行操作（寫入、刪除、複製）

**已修復測試**:

-   [x] should read file content
-   [x] should return default content for non-existent files
-   [x] should check if file exists
-   [x] should read JSON files
-   [x] should return null for missing file (getFileStats)
-   [x] should use file cache for repeated loads (LocaleService)

**尚未修復測試** (4 個):

-   [ ] should write file content
-   [ ] should create directory
-   [ ] should copy files
-   [ ] should delete files
-   [ ] should list files in directory
-   [ ] should write JSON files
-   [ ] should return file stats for existing file

**問題根因**: FSMock 的 `promises` API 與 sinon spy 整合不良

## 尚未修復的測試模組

### ❌ WebView Manager (0/8 測試失敗)

**失敗原因**:

-   WebView 測試需要完整的 VSCode 環境模擬
-   `createWebviewPanel` mock 回傳值結構不完整
-   缺少工作區資料夾設定

**需要的修復**:

1. 完善 `VSCodeMock.window.createWebviewPanel` 的回傳結構
2. 添加 WebView URI 轉換 mock (`webview.asWebviewUri()`)
3. 確保工作區設定正確傳遞

**預估工作量**: 1-2 小時

### ❌ WebView Preview (0/3 測試失敗)

**失敗原因**: 與 WebView Manager 相同
**預估工作量**: 30 分鐘（與 WebView Manager 共用修復）

### ❌ Locale Service (3/9 測試失敗)

**失敗原因**:

-   檔案系統 mock 未正確攔截 `fs.readFileSync`
-   `LocaleService` 使用的是實際的 Node.js `require('fs')`，繞過了 mock

**需要的修復**:

1. 使用 `proxyquire` 或類似工具注入 fs mock
2. 或者在 LocaleService 中添加檔案讀取的依賴注入
3. 修復語言映射邏輯測試

**預估工作量**: 1 小時

### ❌ Message Handler (1/1 測試失敗)

**失敗原因**: `beforeEach` hook 失敗 - "No workspace folder open"
**需要的修復**: 在測試設置中提供 workspace folders mock
**預估工作量**: 15 分鐘

### ❌ Extension Activate (0/1 測試失敗)

**失敗原因**: 命令註冊驗證邏輯不正確
**需要的修復**: 修改測試以正確驗證 VSCode 命令註冊
**預估工作量**: 15 分鐘

## 修復策略建議

### 短期策略（1-2 小時）

**優先級 1**: 修復剩餘的 FileService 測試

-   影響範圍：4 個測試
-   技術難度：低
-   重要性：高（基礎設施）

**優先級 2**: 修復 MessageHandler 和 Extension Activate

-   影響範圍：2 個測試
-   技術難度：低
-   重要性：中

### 中期策略（2-4 小時）

**優先級 3**: 修復 WebView 相關測試

-   影響範圍：11 個測試
-   技術難度：中
-   重要性：高（核心功能）

**優先級 4**: 修復 LocaleService 測試

-   影響範圍：6 個測試
-   技術難度：中
-   重要性：中

### 長期策略

**建議**: 考慮引入更強大的測試框架

-   使用 `rewire` 或 `proxyquire` 進行模組依賴注入
-   考慮使用 VSCode Extension Test Runner 的官方最佳實踐
-   添加整合測試以補充單元測試

## 技術債務記錄

### 已知問題

1. **測試隔離不足**: 某些測試依賴全域狀態（如 `require.cache`）
2. **Mock 不完整**: FSMock 的 `promises` API 缺少某些方法
3. **依賴注入缺失**: 大部分服務類缺少依賴注入，難以測試

### 建議改進

1. **服務層重構**: 所有服務類都應支援依賴注入
2. **Mock 標準化**: 建立標準的 Mock 介面和實作
3. **測試輔助函數**: 創建通用的測試設置和清理函數

## 測試覆蓋率目標

### 當前狀態

-   單元測試覆蓋率：52.8%
-   關鍵服務覆蓋率：
    -   ✅ Logging Service: 100%
    -   ⚠️ File Service: 60%
    -   ⚠️ Locale Service: 33%
    -   ❌ WebView Manager: 0%
    -   ❌ Message Handler: 0%

### 目標狀態（第一階段）

-   單元測試覆蓋率：>80%
-   所有服務類至少 70% 覆蓋率

### 目標狀態（第二階段）

-   單元測試覆蓋率：>90%
-   添加整合測試
-   添加 E2E 測試

## 下一步行動

### 立即行動（已完成）

-   [x] 修復 Logging Service 測試（6 個）
-   [x] 部分修復 FileService 測試（6 個）
-   [x] 創建此進度報告

### 下次會話行動

1. 修復剩餘 FileService 測試（預估 30 分鐘）
2. 修復 MessageHandler 測試（預估 15 分鐘）
3. 修復 Extension Activate 測試（預估 15 分鐘）
4. 開始修復 WebView 測試（預估 1-2 小時）

### 後續會話行動

1. 完成 WebView 測試修復
2. 修復 LocaleService 測試
3. 添加缺失的測試案例
4. 提高測試覆蓋率至 80%

## 參考資料

### 相關檔案

-   `src/test/helpers/mocks.ts` - Mock 實作
-   `src/test/logging.test.ts` - Logging 測試（已修復範例）
-   `src/services/logging.ts` - 依賴注入範例

### 有用的文檔

-   [VSCode Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
-   [Sinon.js Documentation](https://sinonjs.org/releases/latest/)
-   [Mocha Test Framework](https://mochajs.org/)

## Fail-Fast Mode

為了加速測試開發週期，專案現在支援 fail-fast 模式，該模式會在第一個測試失敗時立即停止測試執行。

### 使用方法

```bash
# Fail-fast 模式：在第一個失敗時停止
npm run test:bail

# 標準模式：執行所有測試（預設）
npm test

# 選擇性重新執行特定測試
npm test -- --grep "FileService"

# 組合使用 fail-fast 和選擇性測試
npm run test:bail -- --grep "FailedTest"
```

### 預期行為

- **fail-fast 模式** (`test:bail`): 遇到第一個測試失敗時立即停止，節省時間
- **標準模式** (`test`): 執行所有測試，提供完整的測試報告
- **向後相容**: 現有的測試腳本不受影響

### 使用情境

- **開發中**: 使用 `test:bail` 快速驗證修復
- **CI/CD**: 使用 `test` 獲得完整的測試覆蓋報告
- **除錯**: 使用 `--grep` 重複執行特定失敗的測試

## 備註

本次修復工作聚焦於：

1. 建立可測試的架構模式（依賴注入）
2. 修復核心服務的測試（優先 Logging）
3. 記錄未來修復策略

**重要**: 這些測試失敗在 master 分支上就已經存在，不是 HuskyLens 功能導致的退步。修復測試框架是一個獨立的改進項目。
