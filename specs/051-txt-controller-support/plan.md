# 實作計劃：fischertechnik TXT Controller 支援

**分支**：`051-txt-controller-support` | **日期**：2026-05-03 | **規格**：[spec.md](./spec.md)  
**輸入**：[specs/051-txt-controller-support/spec.md](./spec.md)

## 摘要

為 Singular Blockly 新增 fischertechnik TXT Controller（舊版，ftCommunity 韌體）作為第三類開發板。使用者透過視覺化積木生成 ftrobopy Python 程式，Extension 透過 node-ssh 以 SSH/SCP 將程式上傳到 TXT 並執行；同時提供與 ROBO Pro 對齊的 I/O 即時測試面板（HTTP polling `io_server.py`）。技術核心為三層架構擴展：(1) BoardLanguage/UploadMethod 型別新增 `'txt'`/`'ssh'`；(2) 新增 `TxtUploader`、`TxtConnectionService`、`TxtTestService` 三個 Service；(3) 新增 `txt.js` 積木及 Generator，以及 Test Panel WebView。對於未自行放置 delay 的 TXT 硬體輪詢/控制 `while` 迴圈，現行實作會由共通 generator 以 path-sensitive 方式自動補 `txt.updateWait(0.01)`，避免 busy loop 搶占 ftrobopy exchange thread。

---

## 技術背景 (Technical Context)

| 項目 | 細節 |
|------|------|
| **語言/版本** | TypeScript 5.9.3（Extension Host）；JavaScript ES2020（WebView）；Python 3（TXT 端） |
| **主要依賴（現有）** | Blockly 12.3.1、VS Code API 1.105.0+ |
| **主要依賴（新增）** | node-ssh（SSH/SCP）|
| **TXT 端依賴** | ftrobopy（已安裝）、Python 3 `http.server`（標準函式庫） |
| **儲存** | 連線設定：`vscode.workspace.getConfiguration`；密碼：`vscode.SecretStorage` |
| **測試** | Mocha + Sinon + `@vscode/test-electron`；FileSystem interface 注入 |
| **目標平台** | VS Code 1.105.0+（macOS/Windows/Linux）；TXT 端 Linux ARMv7 |
| **專案類型** | VS Code Extension（Extension Host + WebView 雙 context） |
| **效能目標** | Test Panel polling ≤ 500ms；「全部停止」≤ 1 秒；上傳到執行 ≤ 30 秒 |
| **限制** | Extension Host 與 WebView 嚴格隔離，僅 postMessage 溝通；不使用 polling 偵測執行結束 |
| **規模/範圍** | 第一版：7 個 TXT 積木、4 馬達、8 輸出、8 輸入、15 語系 i18n |

---

## Constitution Check

*閘門（GATE）：Phase 0 研究前須通過；Phase 1 設計後再次確認。*

| 憲法原則 | 評估 | 狀態 |
|---------|------|------|
| I. 簡單性與可維護性 | `TxtUploader` 照 `MicropythonUploader` 模式實作；`io_server.py` 使用 Python 標準 `http.server`，不引入額外依賴 | ✅ 通過 |
| II. 模組化與可擴展性 | 新增 `TxtConnectionService`、`TxtUploader`、`TxtTestService` 各自獨立；`BoardLanguage = 'txt'` 以資料驅動方式擴展 | ✅ 通過 |
| III. 避免過度開發 | 第一版僅覆蓋 M1-M4、O1-O8、I1-I8 數位；encoder、類比感測器、TXT 4.0 明確排除 | ✅ 通過 |
| IV. 彈性與適應性 | `TxtConnectionConfig` 可配置 host、port、remotePath；未來 mDNS 或 TXT 4.0 可獨立新增 | ✅ 通過 |
| V. 研究驅動開發 | ftrobopy API 已透過 GitHub 原始碼查證；node-ssh API 見 research.md | ✅ 通過 |
| VI. 結構化日誌 | 所有 Extension Host 代碼使用 `log()` from `logging.ts`；WebView 使用 `console.log` | ✅ 通過 |
| VII. 完整測試覆蓋率 | `TxtConnectionService`、`TxtUploader` 使用 DI 可測試；WebView 及 SSH 互動以手動測試文件化 | ✅ 通過（WebView 例外適用） |
| VIII. 純函式與模組化 | Generator 為純函式；Service 透過建構函式注入依賴；`TxtDeviceState` 狀態機避免全域狀態 | ✅ 通過 |
| IX. 繁體中文文件標準 | 本 plan.md 以繁體中文撰寫 | ✅ 通過 |

---

## 專案結構

### 文件（本功能）

```text
specs/051-txt-controller-support/
├── spec.md              # 功能規格
├── plan.md              # 本計劃（/speckit.plan 輸出）
├── research.md          # Phase 0 研究（/speckit.plan 輸出）
├── data-model.md        # Phase 1 資料模型（/speckit.plan 輸出）
├── quickstart.md        # Phase 1 快速啟動指南（/speckit.plan 輸出）
├── contracts/           # Phase 1 介面合約（/speckit.plan 輸出）
│   ├── txt-blocks-api.md      # 積木 API 合約
│   └── io-server-api.md       # io_server.py HTTP API 合約
└── tasks.md             # Phase 2 任務清單（/speckit.tasks 命令產生）
```

### 原始碼（儲存庫根目錄）

```text
src/
├── types/
│   ├── board.ts              # 現有 - 新增 'txt' 到 BoardLanguage、'ssh' 到 UploadMethod
│   ├── arduino.ts            # 現有 - 更新 getBoardLanguage() 支援 'txt'
│   └── txt.ts                # 新增 - TxtConnectionConfig, TxtDeviceState, TxtIoSnapshot,
│                             #         TxtUploadRequest, TxtUploadProgress, TxtUploadResult
├── services/
│   ├── txtConnectionService.ts  # 新增 - SSH 連線管理、SecretStorage、測試連線
│   ├── txtUploader.ts           # 新增 - SCP 上傳 + SSH 執行 + 狀態機
│   └── txtTestService.ts        # 新增 - Test Panel HTTP polling + io_server.py 安裝
├── webview/
│   └── messageHandler.ts        # 現有 - 新增 TXT 相關訊息 case 路由
└── extension.ts                 # 現有 - 新增 TXT 相關命令註冊

media/
├── blockly/
│   ├── blocks/
│   │   └── txt.js               # 新增 - 7 個 TXT 積木定義
│   └── generators/
│       └── txt/
│           ├── txt.js           # 新增 - TXT Python Generator（ftrobopy API）
│           └── python_common.js # 修改 - 共通流程控制與 while 自動 pacing 規則
├── html/
│   ├── blocklyEdit.html         # 現有 - 新增 TXT 連線設定 UI 區塊
│   └── txtTestPanel.html        # 新增 - TXT I/O Test Panel WebView
├── js/
│   ├── blocklyEdit.js           # 現有 - 新增 TXT 連線設定 UI 互動邏輯
│   └── txtTestPanel.js          # 新增 - Test Panel 滑桿、開關、polling 邏輯
├── toolbox/
│   └── categories/
│       └── txt.json             # 新增 - TXT 工具箱類別定義
└── locales/
    └── {15 語系}/
        └── messages.js          # 現有 - 新增 TXT 積木 i18n 鍵值

txt-runtime/
└── io_server.py                 # 新增 - TXT 端 HTTP I/O Server（Python 標準函式庫）

package.json                     # 現有 - 新增 node-ssh dependency、TXT 板子設定、命令
```

## 複雜度追蹤

| 違規 | 必要原因 | 被拒絕的簡單替代方案 |
|------|---------|-------------------|
| 新增第三個 BoardLanguage `'txt'` | ftrobopy API 語意與 `micropython` machine API 完全不同，共用 generator 會造成混淆 | 複用 `'micropython'` 但加條件判斷 → 違反 Principle I（增加維護複雜度） |
| 新增 `io_server.py` 端側腳本 | Test Panel 需即時 I/O 讀取，SSH 逐次查詢延遲過高 | 直接 SSH polling → 每次需建立連線，延遲 > 500ms 無法達成 SC-003 |

---

## Phase 0：研究摘要

*完整研究詳見 [research.md](./research.md)*

| 議題 | 決策 | 信心度 |
|------|------|--------|
| ftrobopy setSpeed API | `speed` 範圍 -512~512，負值反轉，已從 GitHub 原始碼查證 | 高 |
| node-ssh API | Promise-based；`execCommand()` resolve = 命令結束，符合 FR-024 | 高 |
| io_server.py 架構 | Python 標準 `http.server`，無外部依賴 | 高 |
| SecretStorage | VS Code `context.secrets` API，key：`singular-blockly.txt.password` | 高 |
| TxtDeviceState 狀態機 | Union type + 5 種狀態轉換（詳見 data-model.md） | 高 |
| Blockly Generator 模式 | 獨立 `txtGenerator`，反轉時輸出負速度值 | 高 |
| TXT while 迴圈 pacing | 使用 path-sensitive `txt.updateWait(0.01)` 自動節流未明確 pacing 的硬體輪詢/控制 loop；`txt_wait` 維持 `time.sleep(...)` | 高 |
| Webpack 相容性 | node-ssh 需加入 webpack externals（待 Phase A 驗證） | 中 |

---

## Phase 1：設計與合約

*完整設計詳見 [data-model.md](./data-model.md) 與 [contracts/](./contracts/)*

**核心實體摘要**：

| 實體 | 位置 | 說明 |
|------|------|------|
| `TxtConnectionConfig` | `src/types/txt.ts` | host, username, remotePath, runtimePort |
| `TxtDeviceState` | `src/types/txt.ts` | `'Idle' \| 'Testing' \| 'Running' \| 'Stopping' \| 'Disconnected' \| 'Error'` |
| `TxtIoSnapshot` | `src/types/txt.ts` | motors[4], outputs[8], inputs[8] |
| `TxtUploadStage` | `src/types/txt.ts` | `'connecting' \| 'uploading' \| 'executing' \| 'stopping' \| 'completed' \| 'failed'` |
| `TxtUploadProgress` | `src/types/txt.ts` | stage, progress(0-100), message, error? |

**積木型別摘要**（現況 9 個，含容器/相容積木）：`txt_main`, `txt_init`, `txt_motor_speed`, `txt_motor_stop`, `txt_output`, `txt_input_sensor`, `txt_input_read`, `txt_wait`, `txt_stop_all`

**io_server.py HTTP API 端點**：`GET /io`、`POST /motor`、`POST /output`、`POST /stop_all`

**WebView ↔ Extension postMessage 合約**：詳見 [contracts/txt-blocks-api.md](./contracts/txt-blocks-api.md) 和 [contracts/io-server-api.md](./contracts/io-server-api.md)

---

## 實作階段規劃

### Phase A：型別系統 + 積木層（前端無依賴）

**目標**：在不動現有功能的前提下，建立完整的積木定義與 Generator。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| A-1 | `src/types/board.ts` | 新增 `'txt'` 到 BoardLanguage；`'ssh'` 到 UploadMethod |
| A-2 | `src/types/arduino.ts` | 更新 `getBoardLanguage()` 支援 `'txt'` |
| A-3 | `src/types/txt.ts` | 定義所有 TXT 型別 |
| A-4 | `media/blockly/blocks/txt.js` | 7 個積木定義（HSV 200） |
| A-5 | `media/blockly/generators/txt/txt.js`、`media/blockly/generators/txt/python_common.js` | TXT Python Generator（ftrobopy API）與 while 自動 pacing 規則 |
| A-6 | `media/toolbox/categories/txt.json` | TXT 工具箱類別 JSON |
| A-7 | `media/locales/{15語系}/messages.js` | 新增所有 TXT 積木 i18n 鍵值 |
| A-8 | `package.json` | 新增 `node-ssh` dependency；TXT 板子 display name |

**驗收標準**：選擇 TXT 板子後看到工具箱；`npm run validate:i18n` 通過；`npm run lint` 通過。

---

### Phase B：後端服務層（Extension Host）

**目標**：實作 SSH 連線、上傳、狀態管理三個 Service。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| B-1 | `src/services/txtConnectionService.ts` | SSH 連線管理；SecretStorage；`testConnection()` |
| B-2 | `src/services/txtUploader.ts` | `upload()`：connect→SCP→execCommand→狀態機；`stopExecution()` |
| B-3 | `src/services/txtTestService.ts` | `installRuntime()`；`pollIo()`；`setMotor/Output/stopAll()` |
| B-4 | `src/webview/messageHandler.ts` | 新增 TXT 相關 case 路由 |
| B-5 | `src/extension.ts` | 註冊「安裝 TXT Runtime」命令 |
| B-6 | `package.json` | 新增命令 contributes 設定 |
| B-7 | `src/test/suite/txtConnectionService.test.ts` | SecretStorage mock；testConnection 成功/失敗 |
| B-8 | `src/test/suite/txtUploader.test.ts` | node-ssh mock；各 stage；exit code 非 0 |
| B-9 | `src/test/suite/txtTestService.test.ts` | HTTP fetch mock；pollIo；installRuntime |

**驗收標準**：TypeScript 編譯無錯誤；Unit tests 通過（mock node-ssh）。

---

### Phase C：WebView UI 層

**目標**：在 Blockly Editor 內新增連線設定區；建立獨立 Test Panel。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| C-1 | `media/html/blocklyEdit.html` | 新增 TXT 連線設定區塊（預設折疊，選 TXT 板才顯示） |
| C-2 | `media/js/blocklyEdit.js` | 連線設定 UI 互動；postMessage 整合 |
| C-3 | `media/html/txtTestPanel.html` | Test Panel：M1-M4 滑桿、O1-O8 開關、I1-I8 讀值 |
| C-4 | `media/js/txtTestPanel.js` | polling（400ms）、滑桿（鬆手保持）、關閉自動停止 |
| C-5 | `src/webview/webviewManager.ts` | 新增 `createTxtTestPanel()` |

**驗收標準**：手動測試（需 TXT 硬體）：測試連線成功；Test Panel 滑桿拖動馬達轉動；I1 讀值即時更新。

---

### Phase D：TXT 端 Runtime（可與 A/B/C 並行）

**目標**：實作 `io_server.py`，讓 Test Panel 可透過 HTTP 控制 TXT I/O。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| D-1 | `txt-runtime/io_server.py` | HTTP server（port 8080）；4 端點（/io、/motor、/output、/stop_all） |

**驗收標準**：Python 3.6+ 環境可直接執行；HTTP API 端點回傳正確 JSON。

---

## 建議實作順序

```
A（型別+積木）──→ B（後端服務）──→ C（WebView UI）
                                    ↑
D（TXT Runtime）─────────────────────── （獨立，可並行）
```

---

## 測試策略

### 自動化測試（Unit Tests）

| 測試檔案 | 涵蓋範圍 |
|---------|---------|
| `src/test/suite/txtConnectionService.test.ts` | SecretStorage mock；testConnection 成功/失敗路徑 |
| `src/test/suite/txtUploader.test.ts` | node-ssh mock；upload 各 stage；stopExecution；exit code 非 0 → Error 狀態 |
| `src/test/suite/txtTestService.test.ts` | HTTP fetch mock；pollIo；installRuntime |

### 手動測試（WebView / 硬體整合）

| 場景 | 通過條件 |
|------|---------|
| 積木生成（反轉） | `txt_motor_speed(M1, 200, 反轉)` → 生成 `setSpeed(-200)` |
| 上傳流程 | 進度條顯示 connecting→uploading→executing；馬達轉動 |
| 連線失敗 | 錯誤 IP → 顯示明確訊息，不崩潰 |
| Test Panel M1 滑桿 | 拖動至 300 鬆手 → 馬達維持速度 300（不歸零） |
| Test Panel I1 讀值 | 遮住感測器 → 500ms 內讀值更新 |
| 全部停止 | 馬達運轉中 → 1 秒內所有馬達停止 |
| 關閉 Test Panel | 馬達運轉中 → 自動 stop_all 後關閉 |
| 衝突防護 | Test Panel 開啟中 → 點擊上傳 → Test Panel 進入暫停模式 |
| i18n 驗證 | 切換 DE/JA 語言 → TXT 積木正確顯示翻譯 |

---

## 風險與緩解

| 風險 | 可能性 | 緩解策略 |
|------|--------|---------|
| node-ssh webpack 打包問題 | 中 | Phase A 早期驗證；備選 `ssh2` 純 JS |
| ftCommunity Python 版本（3.6）語法相容 | 低 | 避免 walrus operator、match-case 等 3.8+ 語法 |
| SSH execCommand 無限等待（網路中斷） | 中 | 30 秒 timeout watchdog + dispose SSH 連線 |
| Test Panel CORS 問題 | 低 | io_server.py 加入 `Access-Control-Allow-Origin: *` |

---

## 完成標準（對齊 Success Criteria）

| SC | 驗證方式 |
|----|---------|
| SC-001：上傳到執行 ≤ 30 秒 | 手動計時測試 |
| SC-002：5 分鐘完整流程 | 使用者情境測試 |
| SC-003：Test Panel 更新 ≤ 500ms | 手動測量（400ms polling + 100ms 緩衝） |
| SC-004：明確錯誤訊息 | 故障注入測試（錯誤 IP、錯誤密碼） |
| SC-005：全部停止 ≤ 1 秒 | 手動計時（HTTP POST /stop_all） |
| SC-006：15 語系 100% 覆蓋 | `npm run validate:i18n`（CI 自動） |
| SC-007：現有功能不受影響 | 現有測試套件全通過（CI 自動） |
