# 手動測試指南 Manual Testing Guide

**專案 Project**: Singular Blockly Architecture Cleanup  
**分支 Branch**: 001-refactor-architecture-cleanup  
**測試日期 Test Date**: 2025 年 10 月 17 日  
**測試者 Tester**: **\*\***\_**\*\***

---

## 📋 測試清單總覽 Test Checklist Overview

總共 9 個手動測試任務 (Total 9 Manual Tests):

-   [ ] **T032**: 主編輯器語言載入測試 (Phase 5)
-   [ ] **T033**: 預覽視窗語言載入測試 (Phase 5)
-   [ ] **T045**: 多視窗唯一臨時檔案測試 (Phase 6)
-   [ ] **T046**: 視窗關閉時檔案清理測試 (Phase 6)
-   [ ] **T058**: 動態模組發現 - 新增檔案測試 (Phase 7)
-   [ ] **T059**: 動態模組發現 - 刪除檔案測試 (Phase 7)
-   [ ] **Bonus 1**: 過期檔案清理測試 (Phase 6 - T041-T043)
-   [ ] **Bonus 2**: 多語言完整切換測試 (Phase 5)
-   [ ] **Bonus 3**: 端對端整合測試 (All Phases)

**預估時間 Estimated Time**: 30-45 分鐘

---

## 🧪 Phase 5: 語言載入測試 Locale Loading Tests

### ✅ T032: 主編輯器語言載入測試

**測試目標 Goal**: 驗證統一的 `loadLocaleScripts()` 方法在主編輯器中正確載入所有語言檔案

**前置條件 Prerequisites**:

-   擴充套件已安裝在 VSCode
-   工作區已開啟（任何專案皆可）

**測試步驟 Steps**:

1. **開啟 Blockly 編輯器**

    ```
    方法 1: 按 Ctrl+Shift+P → 輸入 "Blockly" → 選擇 "Open Blockly Editor"
    方法 2: 點擊左側活動列的 Blockly 圖示 → 點擊工具列的 "Open Editor" 按鈕
    方法 3: 點擊底部狀態列的魔法棒圖示 ($(wand))
    ```

2. **開啟瀏覽器開發者工具**

    ```
    在 Blockly WebView 面板上右鍵 → 選擇 "開啟開發人員工具"
    或按 Ctrl+Shift+I (當焦點在 WebView 時)
    ```

3. **檢查 Console 訊息**

    - ✅ **預期結果 Expected**:
        - 看到 "Blockly workspace initialized" 訊息
        - 無語言載入相關的錯誤 (error)
        - 無 404 錯誤（找不到 locale 檔案）

4. **檢查 Network 請求（可選）**

    - 切換到 "Network" 標籤
    - 重新載入 WebView (Ctrl+R)
    - ✅ **預期結果 Expected**:
        - 看到成功載入的 locale 相關檔案：
            - `messages.js` (自訂訊息)
            - `zh-hant.js` 或其他語言的 Blockly 核心訊息
        - 所有請求狀態碼應為 200 (成功)

5. **功能驗證**
    - 拖曳幾個積木到工作區
    - 檢查積木上的文字是否為正確的語言
    - ✅ **預期結果 Expected**:
        - 積木文字顯示正確（中文或目前設定的語言）
        - 工具箱分類名稱正確顯示
        - 無亂碼或英文 fallback

**驗證標準 Pass Criteria**:

-   [ ] 無 console 錯誤
-   [ ] 無 404 網路請求錯誤
-   [ ] 積木文字正確顯示當前語言
-   [ ] 工具箱分類名稱正確

**失敗處理 If Failed**:

-   記錄 Console 中的錯誤訊息
-   截圖保存錯誤畫面
-   檢查 VSCode 輸出面板的 "Singular Blockly" 日誌

---

### ✅ T033: 預覽視窗語言載入測試

**測試目標 Goal**: 驗證統一的 `loadLocaleScripts()` 方法在預覽視窗中也能正確載入

**前置條件 Prerequisites**:

-   已完成 T032 測試
-   Blockly 編輯器已開啟並有一些積木

**測試步驟 Steps**:

1. **建立一個簡單的程式**

    ```
    在主編輯器中拖曳以下積木：
    - "重複執行" 迴圈
    - "LED 點亮" (或任何簡單的 Arduino 命令)
    ```

2. **開啟預覽視窗**

    ```
    方法 1: 在編輯器右上角點擊 "Preview" 按鈕
    方法 2: Ctrl+Shift+P → "Blockly: Open Preview"
    ```

3. **開啟預覽視窗的開發者工具**

    ```
    在預覽 WebView 面板上右鍵 → "開啟開發人員工具"
    ```

4. **檢查 Console 訊息**

    - ✅ **預期結果 Expected**:
        - 看到 "Preview workspace initialized" 或類似訊息
        - 無語言載入錯誤
        - 無 404 錯誤

5. **比較主編輯器與預覽視窗**

    - 檢查預覽視窗中積木的文字
    - ✅ **預期結果 Expected**:
        - 預覽視窗與主編輯器顯示相同語言
        - 積木文字完全一致
        - 無語言不一致的情況

6. **測試語言切換（進階）**
    ```
    1. 關閉預覽視窗
    2. 在 VSCode 設定中更改語言（File > Preferences > Settings > "Display Language"）
    3. 重新啟動 VSCode
    4. 開啟主編輯器和預覽視窗
    5. 驗證兩者都顯示新語言
    ```

**驗證標準 Pass Criteria**:

-   [ ] 預覽視窗無 console 錯誤
-   [ ] 預覽視窗積木文字與主編輯器一致
-   [ ] 語言切換後兩個視窗同步更新（可選）

**失敗處理 If Failed**:

-   比較主編輯器與預覽視窗的 Network 請求差異
-   檢查是否載入了不同的 locale 檔案

---

## 📁 Phase 6: 臨時檔案管理測試 Temp File Management Tests

### ✅ T045: 多視窗唯一臨時檔案測試

**測試目標 Goal**: 驗證開啟多個 Blockly 編輯器時，每個視窗產生唯一的臨時工具箱檔案

**前置條件 Prerequisites**:

-   工作區已開啟
-   準備檔案瀏覽器工具（File Explorer）

**測試步驟 Steps**:

1. **記錄初始狀態**

    ```powershell
    # 在 PowerShell 中執行
    cd E:\singular-blockly
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json" | Select-Object Name, LastWriteTime
    ```

    - 記錄現有的臨時檔案數量和名稱

2. **開啟第一個 Blockly 編輯器**

    ```
    按 Ctrl+Shift+P → "Open Blockly Editor"
    ```

    - 等待編輯器完全載入（看到積木工具箱）

3. **檢查產生的臨時檔案**

    ```powershell
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json" | Select-Object Name
    ```

    - ✅ **預期結果 Expected**:
        - 新增 1 個檔案，格式為 `temp_toolbox_1760686XXXXXX.json`
        - 時間戳記為 13 位數字（Date.now()）

4. **開啟第二個 Blockly 編輯器**

    ```
    方法 1: 分割編輯器視窗 (Ctrl+\)，然後在新視窗中執行 "Open Blockly Editor"
    方法 2: 開啟另一個工作區資料夾，執行 "Open Blockly Editor"
    ```

5. **再次檢查臨時檔案**

    ```powershell
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json" | Select-Object Name
    ```

    - ✅ **預期結果 Expected**:
        - 現在有 2 個不同的臨時檔案
        - 檔名中的時間戳記不同（至少相差幾毫秒）

6. **開啟第三個 Blockly 編輯器**

    ```
    重複步驟 4
    ```

7. **最終檢查**
    ```powershell
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json" | Select-Object Name, Length
    ```
    - ✅ **預期結果 Expected**:
        - 有 3 個不同的臨時檔案
        - 每個檔案大小相似（都包含完整的工具箱配置）
        - 所有檔名都以 `temp_toolbox_` 開頭

**驗證標準 Pass Criteria**:

-   [ ] 每個視窗產生唯一的臨時檔案
-   [ ] 檔名包含不同的時間戳記
-   [ ] 檔案內容完整（JSON 格式正確）
-   [ ] 多個視窗可同時正常運作

**失敗處理 If Failed**:

-   檢查 VSCode 輸出面板的 "Singular Blockly" 日誌
-   檢查是否有 "File already exists" 錯誤
-   驗證 `generateTempToolboxPath()` 方法是否正確使用 `Date.now()`

---

### ✅ T046: 視窗關閉時檔案清理測試

**測試目標 Goal**: 驗證關閉 Blockly 編輯器視窗時，對應的臨時檔案被正確刪除

**前置條件 Prerequisites**:

-   已完成 T045 測試
-   目前有 3 個 Blockly 編輯器視窗開啟

**測試步驟 Steps**:

1. **記錄當前臨時檔案**

    ```powershell
    $files = Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json"
    $files | Format-Table Name, LastWriteTime -AutoSize
    Write-Host "Total files: $($files.Count)"
    ```

    - 記錄 3 個檔案的完整名稱
    - 例如：
        - `temp_toolbox_1760686476961.json` (第一個)
        - `temp_toolbox_1760686477123.json` (第二個)
        - `temp_toolbox_1760686477456.json` (第三個)

2. **關閉中間的編輯器視窗**

    ```
    點擊第二個 Blockly 編輯器分頁的 "X" 按鈕
    或按 Ctrl+W (當焦點在該分頁時)
    ```

    - ⏱️ 等待 1-2 秒讓清理程序完成

3. **檢查檔案是否被刪除**

    ```powershell
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json" | Format-Table Name -AutoSize
    ```

    - ✅ **預期結果 Expected**:
        - 剩下 2 個檔案
        - 第二個檔案（對應關閉的視窗）已被刪除
        - 第一個和第三個檔案仍然存在

4. **關閉第一個編輯器視窗**

    ```
    點擊第一個分頁的 "X"
    ```

    - ⏱️ 等待 1-2 秒

5. **再次檢查**

    ```powershell
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json" | Format-Table Name -AutoSize
    ```

    - ✅ **預期結果 Expected**:
        - 剩下 1 個檔案（第三個）
        - 前兩個檔案都已被刪除

6. **關閉最後一個編輯器視窗**

    ```
    點擊最後一個分頁的 "X"
    ```

    - ⏱️ 等待 1-2 秒

7. **最終驗證**
    ```powershell
    Get-ChildItem -Path "media\toolbox\temp_toolbox_*.json"
    ```
    - ✅ **預期結果 Expected**:
        - 沒有臨時檔案殘留（空列表）
        - 或只有從上次測試殘留的舊檔案（如果有）

**驗證標準 Pass Criteria**:

-   [ ] 關閉視窗後對應檔案被刪除
-   [ ] 刪除時間在 2 秒內完成
-   [ ] 其他視窗的檔案不受影響
-   [ ] 所有視窗關閉後無檔案殘留

**失敗處理 If Failed**:

-   檢查 `cleanupTempFile()` 方法是否被正確調用
-   檢查 `panel.onDidDispose()` 事件是否正確註冊
-   查看 VSCode 輸出日誌中的清理訊息

---

## 🔧 Phase 7: 動態模組發現測試 Dynamic Module Discovery Tests

### ✅ T058: 新增模組檔案測試

**測試目標 Goal**: 驗證新增的 Arduino generator 檔案會被自動發現和載入

**前置條件 Prerequisites**:

-   擴充套件已安裝
-   準備文字編輯器建立測試檔案

**測試步驟 Steps**:

1. **建立測試模組檔案**

    ```javascript
    // 在 E:\singular-blockly\media\blockly\generators\arduino\ 建立檔案
    // 檔名: test_module.js

    /**
     * @license
     * Copyright 2024 Singular Blockly Contributors
     * SPDX-License-Identifier: Apache-2.0
     */

    import { Order } from 'blockly/javascript';

    export const arduinoGenerator = Object.create(null);

    // 測試用的簡單積木生成器
    arduinoGenerator.forBlock['test_block'] = function (block, generator) {
    	return '// Test module loaded successfully\n';
    };

    console.log('TEST MODULE LOADED: test_module.js');
    ```

2. **儲存檔案**

    ```
    確保檔案儲存在正確位置：
    E:\singular-blockly\media\blockly\generators\arduino\test_module.js
    ```

3. **重新載入擴充套件**

    ```
    方法 1: 按 Ctrl+Shift+P → "Developer: Reload Window"
    方法 2: 關閉並重新開啟 VSCode
    ```

4. **開啟 Blockly 編輯器**

    ```
    按 Ctrl+Shift+P → "Open Blockly Editor"
    ```

5. **開啟開發者工具並檢查 Console**

    ```
    右鍵 WebView → "開啟開發人員工具" → Console 標籤
    ```

    - ✅ **預期結果 Expected**:
        - 看到 "TEST MODULE LOADED: test_module.js" 訊息
        - 表示測試模組已被成功載入

6. **檢查 Network 請求（可選）**

    ```
    切換到 Network 標籤 → 篩選 "test_module"
    ```

    - ✅ **預期結果 Expected**:
        - 看到 `test_module.js` 的請求
        - 狀態碼為 200 (成功載入)

7. **檢查擴充套件日誌**
    ```
    VSCode → 查看 → 輸出 → 選擇 "Singular Blockly"
    ```
    - ✅ **預期結果 Expected**:
        - 看到 "Discovered X Arduino generator modules" 訊息
        - X 應該比之前多 1（包含新的 test_module.js）

**驗證標準 Pass Criteria**:

-   [ ] test_module.js 被成功載入
-   [ ] Console 顯示測試訊息
-   [ ] 模組數量增加 1
-   [ ] 無載入錯誤

**失敗處理 If Failed**:

-   檢查檔案名稱是否正確（必須是 `.js` 結尾）
-   檢查檔案位置是否正確
-   檢查 `discoverArduinoModules()` 方法的日誌輸出
-   驗證檔案權限是否正確

---

### ✅ T059: 刪除模組檔案測試

**測試目標 Goal**: 驗證刪除 Arduino generator 檔案後不再被載入

**前置條件 Prerequisites**:

-   已完成 T058 測試
-   test_module.js 檔案存在且已被載入

**測試步驟 Steps**:

1. **記錄當前模組數量**

    ```
    在 VSCode 輸出面板查看 "Singular Blockly" 日誌
    找到最後一行 "Discovered X Arduino generator modules"
    記錄 X 的值
    ```

2. **關閉所有 Blockly 編輯器視窗**

    ```
    關閉所有開啟的 Blockly 編輯器分頁
    ```

3. **刪除測試模組檔案**

    ```powershell
    # 在 PowerShell 中執行
    Remove-Item "E:\singular-blockly\media\blockly\generators\arduino\test_module.js"

    # 或在檔案總管中手動刪除
    ```

4. **重新載入擴充套件**

    ```
    按 Ctrl+Shift+P → "Developer: Reload Window"
    ```

5. **重新開啟 Blockly 編輯器**

    ```
    按 Ctrl+Shift+P → "Open Blockly Editor"
    ```

6. **開啟開發者工具並檢查 Console**

    ```
    右鍵 WebView → "開啟開發人員工具" → Console 標籤
    ```

    - ✅ **預期結果 Expected**:
        - **不再看到** "TEST MODULE LOADED: test_module.js" 訊息
        - 表示測試模組未被載入

7. **檢查 Network 請求**

    ```
    Network 標籤 → 篩選 "test_module"
    ```

    - ✅ **預期結果 Expected**:
        - 沒有 `test_module.js` 的請求
        - 或有請求但狀態碼為 404 (找不到檔案)

8. **檢查模組數量**

    ```
    VSCode → 輸出 → "Singular Blockly"
    找到 "Discovered X Arduino generator modules"
    ```

    - ✅ **預期結果 Expected**:
        - X 應該比步驟 1 記錄的值少 1
        - 確認回到原始的模組數量

9. **驗證編輯器仍正常運作**
    - 拖曳一些標準積木到工作區
    - ✅ **預期結果 Expected**:
        - 其他積木正常運作
        - 無錯誤訊息
        - 工具箱顯示正常

**驗證標準 Pass Criteria**:

-   [ ] test_module.js 不再被載入
-   [ ] Console 無測試模組訊息
-   [ ] 模組數量減少 1
-   [ ] 編輯器其他功能正常

**失敗處理 If Failed**:

-   檢查檔案是否真的被刪除（可能被快取）
-   嘗試清除瀏覽器快取並重新載入
-   檢查 `discoverArduinoModules()` 的 fallback 邏輯是否被觸發

---

## ⚠️ 已知問題與解決方案 Known Issues

### 問題 1: 舊版 Workspace 積木選項不相容

**現象 Symptoms**:

```
Cannot set the dropdown's value to an unavailable option.
Block type: threshold_function_read, Field name: FUNC, Value: IR_LL/IR_M/IR_R
```

**原因 Root Cause**:

-   舊版本的 workspace JSON 中儲存了已廢棄的函式名稱（如 `IR_LL`, `IR_M`, `IR_R`）
-   這些是舊版紅外線感測器相關的函式，在當前版本已不存在

**解決方案 Solution**:
✅ **已修復** - 在 `arduino.js` 的 `threshold_function_read` 積木中新增了容錯處理：

-   當恢復無效的舊值時，自動降級使用預設值 `Func0`
-   在 Console 中顯示警告訊息但不中斷載入
-   使用者無需手動處理，積木會自動修正

**驗證方法 Verification**:

1. 開啟包含舊版積木的 workspace
2. 檢查 Console 是否出現警告（應該只有警告，無錯誤）
3. 確認積木已自動使用預設值 `Func0`
4. 儲存後重新開啟，確認問題不再出現

---

### 問題 2: WebView Sandbox 安全警告

**現象 Symptoms**:

```
An iframe which has both allow-scripts and allow-same-origin for its sandbox attribute can escape its sandboxing.
```

**原因 Root Cause**:

-   VSCode WebView 的標準安全性警告
-   由於 Blockly 需要執行 JavaScript 並存取 DOM，必須啟用這些權限

**影響 Impact**:

-   ℹ️ **資訊性訊息** - 不影響功能，可忽略
-   這是 VSCode 擴充套件開發的正常現象

**無需處理** - 此為預期行為

---

### 問題 3: PlatformIO 擴充套件錯誤

**現象 Symptoms**:

```
Cannot read properties of undefined (reading 'envs')
at platformio.platformio-ide
```

**原因 Root Cause**:

-   PlatformIO 擴充套件內部錯誤
-   與 Singular Blockly 無關

**解決方案 Solution**:

-   這不是本專案的問題，無需處理
-   如果影響使用，可嘗試：
    1. 重新啟動 VSCode
    2. 更新 PlatformIO 擴充套件
    3. 在 PlatformIO 專案中執行 `PlatformIO: Re-Init`

---

## 🌟 Bonus Tests: 額外測試

### ✅ Bonus 1: 過期檔案清理測試 (T041-T043)

**測試目標 Goal**: 驗證擴充套件啟動時自動清理超過 1 小時的臨時檔案

**測試步驟 Steps**:

1. **建立模擬過期檔案**

    ```powershell
    # 建立一個測試用的臨時檔案
    $oldTimestamp = [DateTimeOffset]::Now.AddHours(-2).ToUnixTimeMilliseconds()
    $oldFile = "media\toolbox\temp_toolbox_$oldTimestamp.json"
    Copy-Item "media\toolbox\index.json" $oldFile

    # 修改檔案的時間戳記為 2 小時前
    $date = (Get-Date).AddHours(-2)
    (Get-Item $oldFile).LastWriteTime = $date
    (Get-Item $oldFile).CreationTime = $date
    ```

2. **建立新的臨時檔案（不過期）**

    ```powershell
    $newTimestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    $newFile = "media\toolbox\temp_toolbox_$newTimestamp.json"
    Copy-Item "media\toolbox\index.json" $newFile
    ```

3. **檢查初始狀態**

    ```powershell
    Get-ChildItem "media\toolbox\temp_toolbox_*.json" |
        Select-Object Name, @{N='Age(Hours)';E={(New-TimeSpan $_.LastWriteTime).TotalHours}} |
        Format-Table -AutoSize
    ```

    - 應該看到 2 個檔案：一個超過 1 小時，一個是新的

4. **重新載入 VSCode**

    ```
    按 Ctrl+Shift+P → "Developer: Reload Window"
    ```

    - 這會觸發擴充套件重新啟動

5. **等待清理完成**

    - ⏱️ 等待 3-5 秒讓清理程序完成

6. **檢查清理結果**

    ```powershell
    Get-ChildItem "media\toolbox\temp_toolbox_*.json" | Select-Object Name
    ```

    - ✅ **預期結果 Expected**:
        - 只剩下新的檔案（不到 1 小時的）
        - 舊檔案（超過 1 小時）已被刪除

7. **檢查日誌訊息**
    ```
    VSCode → 輸出 → "Singular Blockly"
    ```
    - ✅ **預期結果 Expected**:
        - 看到 "Cleaned up 1 stale temporary toolbox file(s)" 訊息
        - 或類似的清理日誌

**驗證標準 Pass Criteria**:

-   [ ] 超過 1 小時的檔案被刪除
-   [ ] 新的檔案保留
-   [ ] 清理在啟動時自動執行
-   [ ] 日誌記錄清理數量

---

### ✅ Bonus 2: 多語言完整切換測試

**測試目標 Goal**: 驗證支援的 15 種語言都能正確載入

**支援的語言列表**:

-   🇧🇬 Bulgarian (bg)
-   🇨🇿 Czech (cs)
-   🇩🇪 German (de)
-   🇬🇧 English (en)
-   🇪🇸 Spanish (es)
-   🇫🇷 French (fr)
-   🇭🇺 Hungarian (hu)
-   🇮🇹 Italian (it)
-   🇯🇵 Japanese (ja)
-   🇰🇷 Korean (ko)
-   🇵🇱 Polish (pl)
-   🇧🇷 Portuguese (Brazil) (pt-br)
-   🇷🇺 Russian (ru)
-   🇹🇷 Turkish (tr)
-   🇹🇼 Traditional Chinese (zh-hant)

**快速測試步驟** (每種語言 1-2 分鐘):

1. **更改 VSCode 語言設定**

    ```
    File → Preferences → Settings
    搜尋 "locale"
    修改 "Locale" 設定為測試語言代碼
    ```

2. **重新啟動 VSCode**

    ```
    Ctrl+Shift+P → "Developer: Reload Window"
    ```

3. **開啟 Blockly 編輯器**

    ```
    檢查工具箱和積木文字是否為該語言
    ```

4. **快速驗證**

    - 拖曳 1-2 個積木
    - 檢查文字正確顯示
    - 檢查 Console 無錯誤

5. **重複步驟 1-4** 測試所有 15 種語言

**抽樣測試建議** (如果時間有限):

-   ✅ 必測: en (英文), zh-hant (繁中)
-   ⚠️ 建議測: ja (日文), ko (韓文), de (德文)
-   ℹ️ 可選: 其他語言

---

### ✅ Bonus 3: 端對端整合測試

**測試目標 Goal**: 驗證所有重構功能在真實使用場景中協同工作

**完整測試流程** (5-10 分鐘):

1. **建立新專案**

    ```
    在 VSCode 中開啟一個空資料夾
    ```

2. **開啟 3 個 Blockly 編輯器**

    ```
    分別在 3 個分頁開啟編輯器
    驗證產生 3 個唯一的臨時檔案
    ```

3. **在第一個編輯器中建立程式**

    ```
    拖曳積木建立一個簡單的 Arduino 程式：
    - Setup 區塊：設定 LED 腳位
    - Loop 區塊：閃爍 LED
    ```

4. **切換板子類型**

    ```
    從工具列選擇不同的板子 (Uno → Mega → ESP32)
    驗證程式碼正確生成
    ```

5. **開啟預覽視窗**

    ```
    點擊 Preview 按鈕
    驗證預覽視窗正確顯示程式
    驗證語言一致
    ```

6. **關閉中間的編輯器**

    ```
    關閉第 2 個編輯器
    驗證對應臨時檔案被刪除
    其他編輯器不受影響
    ```

7. **重新載入 VSCode**

    ```
    Developer: Reload Window
    驗證過期臨時檔案被清理（如果有）
    ```

8. **重新開啟編輯器**
    ```
    驗證之前的程式保存在 workspace
    驗證所有功能正常
    ```

**驗證標準 Pass Criteria**:

-   [ ] 多視窗同時工作無衝突
-   [ ] 臨時檔案管理正確
-   [ ] 語言載入正確
-   [ ] 板子切換正常
-   [ ] 預覽功能正常
-   [ ] 重新啟動後狀態正確

---

## 📝 測試報告模板 Test Report Template

完成測試後，請填寫以下報告：

```markdown
# 手動測試報告 Manual Test Report

**測試日期**: 2025/10/**/**
**測試者**: \***\*\_\_\*\***
**VSCode 版本**: \***\*\_\_\*\***
**作業系統**: Windows/Mac/Linux \***\*\_\_\*\***

## 測試結果總覽

| 測試編號 | 測試項目         | 結果  | 備註               |
| -------- | ---------------- | ----- | ------------------ |
| T032     | 主編輯器語言載入 | ✅/❌ |                    |
| T033     | 預覽視窗語言載入 | ✅/❌ |                    |
| T045     | 多視窗唯一檔案   | ✅/❌ |                    |
| T046     | 視窗關閉清理     | ✅/❌ |                    |
| T058     | 新增模組發現     | ✅/❌ |                    |
| T059     | 刪除模組處理     | ✅/❌ |                    |
| Bonus 1  | 過期檔案清理     | ✅/❌ |                    |
| Bonus 2  | 多語言切換       | ✅/❌ | 測試語言: \_\_\_\_ |
| Bonus 3  | 端對端整合       | ✅/❌ |                    |

## 詳細問題記錄

### 發現的問題 Issues Found

1. **問題標題**

    - 測試: T\_\_\_
    - 現象: \***\*\_\_\_\*\***
    - 重現步驟: \***\*\_\_\_\*\***
    - 預期結果: \***\*\_\_\_\*\***
    - 實際結果: \***\*\_\_\_\*\***
    - 嚴重程度: 高/中/低

2. ...

### 截圖 Screenshots

(如果有錯誤，請附上截圖)

### 建議 Recommendations

(對改進的建議)

## 測試結論

-   [ ] 所有核心測試通過 (T032-T059)
-   [ ] 所有 Bonus 測試通過
-   [ ] 發現 \_\_ 個問題
-   [ ] 建議: 通過/需修正後重測/不通過

**測試者簽名**: \***\*\_\_\*\***
**日期**: 2025/10/**/**
```

---

## 🛠️ 故障排除指南 Troubleshooting Guide

### 常見問題 Common Issues

#### 問題 1: 開啟開發者工具時找不到選項

**解決方案**:

```
1. 確保焦點在 WebView 面板上（點擊面板內部）
2. 右鍵點擊 WebView 內容區域（不是標題列）
3. 如果仍看不到，嘗試：
   Ctrl+Shift+P → "Developer: Toggle Developer Tools"
```

#### 問題 2: 臨時檔案檢查時找不到檔案

**解決方案**:

```powershell
# 確保在正確目錄
cd E:\singular-blockly

# 使用完整路徑
Get-ChildItem -Path "E:\singular-blockly\media\toolbox\temp_toolbox_*.json"

# 檢查是否有權限問題
Get-Acl "E:\singular-blockly\media\toolbox"
```

#### 問題 3: test_module.js 建立後沒有被載入

**檢查清單**:

-   [ ] 檔案名稱正確（小寫，.js 結尾）
-   [ ] 檔案位置正確（在 generators/arduino/ 目錄）
-   [ ] 檔案內容語法正確（無 JavaScript 錯誤）
-   [ ] 已重新載入 VSCode
-   [ ] 檢查 Console 是否有載入錯誤

#### 問題 4: 語言切換後沒有效果

**解決方案**:

```
1. 確認修改了正確的設定（File > Preferences > Settings > Display Language）
2. 完全關閉 VSCode 並重新開啟（不只是 Reload Window）
3. 檢查 locale 設定檔：
   - Windows: %APPDATA%\Code\User\settings.json
   - Mac: ~/Library/Application Support/Code/User/settings.json
4. 確認 "locale" 設定值正確
```

---

## ✅ 測試完成檢查表 Final Checklist

完成所有測試後，請確認：

-   [ ] 所有 Console 訊息已截圖/記錄
-   [ ] 所有測試檔案已清理（test_module.js、模擬的過期檔案等）
-   [ ] 測試報告已填寫完整
-   [ ] 發現的問題已記錄在 GitHub Issues
-   [ ] tasks.md 已更新測試狀態
-   [ ] 向團隊報告測試結果

---

**感謝您的測試！Thank you for testing!** 🎉

如有任何問題，請聯絡開發團隊或在 GitHub 建立 Issue。
