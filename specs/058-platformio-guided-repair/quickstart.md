# Quickstart：PlatformIO Guided Repair 驗證指南

## 目標

本指南用於實作完成後驗證 `singular-blockly.checkPlatformioStatus` 面板的新 guided repair 能力：偵測、修復、歷程、AI packet、issue draft 與 privacy masking。

## 自動化驗證

在實作完成後執行：

```bash
npm run compile
npm run lint
npm test
```

若新增或修改任何使用者可見字串，執行：

```bash
npm run validate:i18n
```

建議新增/更新的測試檔：

- `src/test/services/platformioDiagnosticService.test.ts`
  - 官方 PlatformIO settings (`customPATH`、`useBuiltinPIOCore`、`useBuiltinPython`) 被納入診斷候選。
  - Windows PATH 分隔與 Unicode 路徑不透過 shell 字串處理。
- `src/test/services/platformioRepairService.test.ts`
  - planner 只產生 allowlisted user-space flows。
  - flow 最多 3 個 steps，且 stop-on-success-or-blocking-failure。
  - executor 使用注入的 `execFile`，套用 timeout 與 output redaction。
- `src/test/services/platformioRepairHistoryStore.test.ts`
  - history 寫入 `workspaceState`。
  - fingerprint 改變時標記 stale。
  - 清除 history 後 AI packet 不引用舊紀錄。
- `src/test/services/platformioPrivacyRedactor.test.ts`
  - home path、workspace path、proxy credential、token-like 字串被遮罩。
- `src/test/webview/platformioDiagnosticPanel.test.ts`
  - 新 messages：start/confirm/cancel repair、copy AI packet、issue draft、clear history。
  - 有 active repair run 時 `retest` 被保護。

## 手動驗證矩陣

### 1. 正常環境不干擾

1. 在已可用的 PlatformIO/CyberBrick 環境開啟 `Singular Blockly: Check PlatformIO Status`。
2. 確認 overall status 為 operational。
3. 確認不顯示突兀的修復警告；可保留 AI/summary action 但不得暗示有問題。
4. 點擊重新檢測，確認既有診斷 UI 正常。

### 2. `pio` 缺失或 false negative

1. 啟動 VS Code 時使用不含 PlatformIO 的 PATH。
2. 在 VS Code Settings 設定 `platformio-ide.customPATH` 指向可用 `pio` 所在目錄。
3. 開啟 status panel。
4. 確認診斷把 official `customPATH` 納入 evidence/search candidates。
5. 確認若因此找到 `pio`，來源顯示為設定或等效可理解來源。

### 3. CyberBrick `mpremote` 缺失

1. 準備 `pio/python/pip` 可用但 `mpremote` 缺失或版本 probe 失敗的環境。
2. 開啟 status panel。
3. 確認顯示主要 `自動修復` action。
4. 點擊後確認出現 lightweight confirmation，列出將執行的有限步驟。
5. 取消 confirmation，確認沒有執行任何有副作用步驟。
6. 再次啟動並確認後執行修復。
7. 確認 step progress、結果與修復後 retest 顯示正確。

### 4. Blocking failure 與 timeout

1. 用測試替身或受控環境讓 pip/mpremote 安裝或 probe 逾時。
2. 確認 run 狀態變成 `blocked`、`failed` 或 `timed-out`，不會繼續無限制嘗試。
3. 確認面板提供下一步與 AI packet action。
4. 確認 output 已截斷且遮罩。

### 5. Workspace-scoped repair history

1. 在 workspace A 執行一次 repair run。
2. 關閉並重新開啟 panel，確認歷程仍存在。
3. 重新啟動 VS Code 並開啟同一 workspace，確認歷程仍存在。
4. 切到 workspace B，確認不顯示 workspace A 的歷程。
5. 點擊清除歷程，確認 history 與 AI packet 都不再引用舊 run。

### 6. Environment fingerprint 變更

1. 在相同 workspace 中改變 `platformio-ide.customPATH` 或切換可用 `pio` 版本。
2. 重新開啟/重新檢測面板。
3. 確認歷程被標記為 stale，並提示清除或確認保留。
4. 確認 stale 歷程在 AI packet 中有明確標記，不會被當成目前證據。

### 7. AI repair packet

1. 在 degraded/unavailable 環境點擊 `複製 AI 修復摘要`。
2. 貼到純文字檢視器。
3. 確認包含：環境、官方 PlatformIO settings evidence、固定順序 diagnostics、修復歷程、current blocker、requested response contract。
4. 確認不包含未遮罩的 home path、workspace path、proxy credential、token-like 字串。
5. 確認不聲稱執行未發生的修復步驟。

### 8. Issue draft proposal

1. 在修復失敗或 blocked 後點擊 `產生 Issue 草稿`。
2. 確認產生的是草稿/clipboard，不會自動發佈 GitHub issue。
3. 確認草稿包含 privacy checklist 與 duplicate-search keywords。
4. 確認 Windows Unicode path 問題以特徵描述，不暴露完整使用者名稱。

### 9. WebView 安全與可用性

1. 用含 `<script>`、HTML 特殊字元或 token-like 字串的 fake stderr 測試 render。
2. 確認 WebView 顯示為文字，不執行 HTML/JS。
3. 確認 VS Code API object 沒有暴露到全域。
4. 確認 panel 關閉/重開後不依賴 WebView state 保存歷程。

## 回歸檢查

- 既有 `copySummary` 仍可用。
- 既有 `retest` 仍只觸發一次診斷 cycle。
- 沒有新增 top-level command。
- 沒有在 source code 中使用 `console.log`。
- 沒有修改 shell profile、系統 PATH 或系統套件管理器。
- 所有新增使用者可見字串都有 15 語系 key 或明確 fallback 策略，並通過 i18n validate。
