# 實作計畫：Singular Core 的 Windows 短路徑工作區

**分支**：`claude/project-thread-cwsbzq` | **日期**：2026-11-26 | **規格**：[spec.md](spec.md)

**輸入**：`specs/074-windows-core-short-paths/spec.md`

## 摘要

在 Windows 上，Singular Core 執行 PlatformIO 時，把平台、套件、快取與專案編譯資料夾改放到一個短的「工作位置」。這個位置依序從三個候選中選出（自訂資料夾內、`%LOCALAPPDATA%`、磁碟根目錄下的個人資料夾），必須只含 ASCII、符合 260 字元預算，並且由本使用者的 Extension 建立、帶有擁有權標記。

Core 本身（Python、penv、PlatformIO Core）留在原位，不需要重新下載。

另外新增 `path-too-long` 失敗類別，讓編譯期的長路徑錯誤也會顯示既有的「選擇較短資料夾」通知。診斷面板會顯示工作位置的隱私化標記與 long paths 狀態。Windows 真實安裝 CI 也會實際安裝 ESP32 套件並記錄最長路徑。

## 技術背景

**語言／版本**：TypeScript 6.0.3（strict），Node.js 24.20.0（最低支援 22.16.0）

**主要相依**：VS Code Extension API `^1.126.0`；PlatformIO Core（由 managed runtime manifest 固定版本）；Windows 內建 `whoami` 與 `icacls`

**儲存**：`<managed root>\work-root.json` 與工作位置內的標記檔，一律透過 `FileService` 讀寫

**測試**：Mocha＋Sinon，以 `@vscode/test-electron` 執行；平台相關邏輯以注入的 `platform`、`env` 與 `FileSystem` 進行決定性測試；Windows 真實安裝 E2E 以 `scripts/managed-runtime/test-real-installation.js` 執行

**目標平台**：Windows x64／ARM64（新行為）；macOS 與 Linux 必須不變

**效能目標**：選擇工作位置只在第一次（或紀錄失效時）執行，最多兩次子行程（`whoami`、`icacls`）；之後每次只讀一個 JSON 與一個標記檔

**限制**：不得要求系統管理員權限、不得修改登錄檔；子行程一律以引數陣列呼叫、不經過 shell；日誌與診斷不得出現完整路徑

**規模**：約 6 個 TypeScript 模組、1 個 E2E 腳本、1 個 workflow，以及 15 語系各 2 到 3 個新字串

## 憲章檢查

| 原則 | 結論 |
| --- | --- |
| I／III 簡單、不過度開發 | 只搬 PlatformIO 的重型資料夾，不搬 Core，也不引入新設定。通過 |
| II／VIII 模組化、純函式 | 候選產生與路徑預算寫成不碰檔案系統的純函式；建立與驗證放在獨立服務，透過注入的介面測試。通過 |
| V 研究導向 | 實際量測套件深度，並查核 PlatformIO IDE、ESP-IDF、NXP 與 Microsoft 的官方做法（[research.md](research.md)）。通過 |
| VI 結構化日誌 | 使用 `log()`，只記錄候選類別與隱私化標記。通過 |
| VII 測試 | 每個 FR 都有單元測試或 E2E 對應（見 tasks）。通過 |
| IX 繁體中文文件 | 規格、計畫與 CHANGELOG 使用繁體中文；程式內使用者可見字串走 i18n。通過 |
| X 發布管理 | 屬於使用者可見的修正，進 VSIX；由協調者依「何時發布」決定 patch。硬體行為須先由 Ray 在 Windows 實測。通過（附條件） |
| 安全邊界 | 寫入可執行檔的位置需防止跨帳號竄改：移除繼承權限、使用隨機名稱並驗證擁有權標記（research R4、R5）。通過 |

設計完成後重新檢查：沒有新增違反項目。

## 專案結構

### 文件（本功能）

```text
specs/074-windows-core-short-paths/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

### 原始碼

```text
src/
├── services/
│   ├── managedRuntimeWorkRoot.ts        # 新增：候選產生、路徑預算（純函式）與工作位置服務
│   ├── managedRuntimeService.ts         # getCoreEnvironment 依工作負載套用工作位置；cleanup 清掉舊套件
│   ├── coreEnvironmentProviders.ts      # Managed provider 傳入工作負載
│   ├── coreEnvironmentManager.ts        # 環境快取鍵加入工作負載
│   ├── coreFailureClassifier.ts         # 新增 path-too-long 類別
│   ├── arduinoUploader.ts               # 回傳 path-too-long 錯誤碼
│   └── platformioDiagnosticService.ts   # 顯示工作位置與 long paths 狀態
├── webview/messageHandler.ts            # 收到 path-too-long 時顯示既有通知動作
├── types/coreEnvironment.ts             # CoreFailureClass 加入 path-too-long
└── test/services/                       # 對應的單元測試
scripts/managed-runtime/test-real-installation.js  # Windows 加上 ESP32 套件安裝與最長路徑紀錄
.github/workflows/runtime-installation.yml          # Windows job 啟用 ESP32 套件安裝
media/locales/*/messages.js                         # 新字串（15 語系）
```

## 設計重點

### 1. 選擇工作位置

- 新增純函式 `listWorkRootCandidates({ platform, env, customRoot })`，依 FR-003 產生候選。`system-drive` 候選的路徑在建立時才加上隨機字尾。
- 新增純函式 `checkWorkRootBudget(workRoot)`，依 data-model 的三項預算回傳通過或不通過。
- 新增 `PlatformioWorkRootService`：
  1. 讀取並驗證紀錄。紀錄有效、資料夾存在且標記一致時直接採用。
  2. 否則依序嘗試候選：先排除非 ASCII 與超出預算的候選。
  3. 以不遞迴的 `mkdir` 建立最後一層資料夾；資料夾已存在且沒有我們的標記時，跳過這個候選。
  4. `system-drive` 候選另外設定 ACL。
  5. 寫入標記與紀錄。
  6. 全部失敗時拋出 `ManagedRuntimeServiceError('path-too-long')`。
- 多個視窗同時選擇時，沿用 managed root 的安裝鎖：鎖內重新讀取紀錄；拿不到鎖時等候，再讀取並採用另一個視窗寫入的紀錄。

### 2. 套用到 PlatformIO 環境

- `ManagedCoreEnvironmentProvider.resolve` 收到 `workload`。只有 `arduino` 工作負載而且在 Windows 上，才解析工作位置並覆寫 `PLATFORMIO_PACKAGES_DIR`、`PLATFORMIO_PLATFORMS_DIR`、`PLATFORMIO_CACHE_DIR`、`PLATFORMIO_WORKSPACE_DIR`、`PLATFORMIO_BUILD_DIR`、`PLATFORMIO_LIBDEPS_DIR`。
- `python` 工作負載（CyberBrick）不受影響，即使工作位置無法建立也照常運作。
- `CoreEnvironmentManager` 的環境快取鍵加入工作負載，避免兩種工作負載共用同一份環境。
- 其他平台維持目前的 `versions\<v>\cache` 與 `workspaces\<64 hex>`，保持路徑不變（FR-012）。

### 3. 錯誤分類與通知

- `CoreFailureClass` 新增 `path-too-long`，判斷規則見 research R6，排在 `compile` 與 `missing-executable` 之前。
- `path-too-long` 加入允許退回另一個 Core 的本機失敗清單：provider 可能沒有這個問題。
- `ArduinoUploader` 在失敗輸出符合 path-too-long 規則時，於 `error` 加上 `code: 'path-too-long'`，並把階段標成 `compiling` 或 `preparing`。
- `MessageHandler` 收到這個錯誤碼時，透過注入的 `managedRuntimeNotices.showPathTooLong()` 顯示既有的 `MANAGED_RUNTIME_PROGRESS_PATH_TOO_LONG` 訊息，以及「開啟診斷」與「選擇較短資料夾」動作。這個方法由 `ManagedRuntimeProgressPresenter` 公開既有的失敗呈現邏輯提供。
- WebView 端沿用既有的編譯失敗顯示，並在詳細內容加上一行新的 i18n 文字 `ARDUINO_PATH_TOO_LONG_DETAILS`。

### 4. 清理

`cleanup()` 新增兩類清理，都必須先取得安裝鎖：

- 在使用中版本的 `core` 底下，刪除 `packages`、`platforms`，以及版本根目錄下的 `cache`。只在 Windows、且工作位置已建立時執行；penv 與 Core 不受影響。
- 在工作位置的 `w` 底下，刪除 30 天沒有修改、而且不是目前開啟中專案的專案資料夾。

只處理帶有我們標記的工作位置；回傳的計數加上 `packages` 與 `projects` 兩項。

### 5. 診斷與隱私

- 診斷的 managed 卡片加上三項資訊：
  - `workRoot`：以 `<pio-work-root:hash>` 隱私化顯示的位置。
  - `workRootKind`：候選類別。
  - `windowsLongPaths`：`enabled`、`disabled` 或 `unknown`。以 `reg query HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled` 讀取，只讀不寫；讀不到時為 `unknown`。
- 隱私化工具加入工作位置的路徑，確保 AI repair packet 與日誌中不出現完整路徑。

### 6. CI

- `test-real-installation.js` 新增 `--esp32-packages` 旗標：
  - 在既有的中文與空白沙盒中，以 `arduino` 工作負載取得環境。
  - `LOCALAPPDATA` 指向沙盒，觸發非 ASCII 時改用磁碟根目錄的路徑。
  - 執行 `pio pkg install --platform espressif32@7.0.1 --tool …`（實際下載的套件以平台需求為準）。
  - 掃描工作位置內的最長路徑，寫入結果 JSON。最長路徑大於等於 260 時判定失敗。
- `runtime-installation.yml` 只在 Windows x64 job 加上這個旗標。`collect-evidence.js` 收錄 `longestPathLength` 與 `workRootKind`，不收錄路徑本身。

## 驗證矩陣

| 層級 | 內容 | 對應 |
| --- | --- | --- |
| 單元測試 | 候選順序、ASCII 與預算判斷、名稱長度 1 到 13 的邊界、56 字元的工作位置上限、custom 不退回其他候選 | FR-002、FR-003、FR-004、SC-002 |
| 單元測試 | 標記不符、資料夾已存在、`icacls` 失敗後刪除空資料夾、紀錄失效時重新選擇、並行時採用他人紀錄 | FR-006、FR-007、US4 |
| 單元測試 | 環境變數只在 win32 的 arduino 工作負載覆寫；python 工作負載與 macOS／Linux 路徑不變 | FR-001、FR-009、FR-012、SC-007 |
| 單元測試 | 分類器：明確的長路徑訊息、長路徑加上 ENOENT、短路徑的 include 錯誤仍是 `compile` | FR-008、SC-004 |
| 單元測試 | 清理只刪除有標記的位置與舊套件，不碰 penv | FR-010 |
| 單元測試 | 診斷與 repair packet 不含完整路徑或使用者名稱 | FR-011、SC-005 |
| i18n | `npm run validate:i18n`、`npm run test:i18n` | 新字串 |
| 整合 | `npm run ci:static`、`xvfb-run -a npm run test:unit:ci`、`npm run test:managed-runtime` | 全部 |
| 雲端 E2E | 在 Linux 容器執行 `test:managed-runtime:e2e`，確認非 Windows 路徑不變 | FR-012 |
| Windows CI | `runtime-e2e-approved` 標籤觸發 Windows 真實安裝，並安裝 ESP32 套件 | FR-013、SC-006 |
| 實機 | Ray 在 Windows 停用 provider，用 Singular Core 編譯並上傳 ESP32 | SC-001、發布門檻 |
| 畫面 | 診斷面板 managed 卡片的亮色與深色截圖 | US5 |

## 回退方式

- 工作位置是可重建的快取。回退版本後，PlatformIO 會重新使用 `versions\<v>\core` 底下的舊資料夾，在 Windows 上恢復原本的行為（ESP32 仍會因路徑過長失敗）。
- 已建立的工作位置留在磁碟上，不影響運作，使用者可以手動刪除。
- `work-root.json` 會被舊版忽略。

## 複雜度追蹤

| 項目 | 為何需要 | 為何不採用較簡單的做法 |
| --- | --- | --- |
| 磁碟根目錄候選與權限設定 | 非 ASCII 使用者資料夾在學校很常見（#130 的回報者即是），而 GCC 工具鏈收到非 ASCII 路徑時不可靠 | 只用 `%LOCALAPPDATA%` 無法解決非 ASCII 的問題；不設定權限又會留下跨帳號執行任意程式的風險 |
