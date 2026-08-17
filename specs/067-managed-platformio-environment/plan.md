# 實作計畫：受管理的 PlatformIO 雙 Core 環境

**分支**：`codex/067-managed-platformio-environment` | **日期**：2026-08-15 | **規格**：[spec.md](./spec.md)

**輸入**：`/specs/067-managed-platformio-environment/spec.md` 的功能規格

## 摘要

在 VS Code Extension Host 內新增由 Singular Blockly 擁有的自包含 Python 3.11 與 PlatformIO Core 環境。Extension 於 `onStartupFinished` 啟用後即非阻塞地預先初始化；每次開啟 Blockly 編輯器再重查並冪等續裝，建置／上傳的 `ensureReady()` 保留為最後防線。系統從已提交的 runtime manifest 選擇目前 OS／CPU 的固定 artifact，先驗證路徑、權限與 SHA-256，再於 staging 目錄完成解壓、PlatformIO／mpremote 安裝、健康檢查與原子切換。可用版本永遠由 committed install record 指向，更新失敗時保留前一版。

既有 PlatformIO IDE／PIOArduino provider 偵測與引導完整保留。新增 `CoreEnvironmentManager` 將工作負載路由為 Arduino「Provider 優先、Singular 備援」及 Python「Singular 優先、Provider 備援」，只允許在專案程序啟動前，針對可證明的本機 runtime 故障 fallback 一次。所有 Singular 子程序使用參數陣列與 `shell: false`，並以各自的 PlatformIO Core、cache、workspace 與 build 目錄隔離；原始專案不複製成 shadow project。

F5 驗收補充兩項邊界修正：一般資料夾在安全詢問明確同意前只允許唯讀檢查，Project Skill 與 workspace 設定延後到編輯器成功開啟後；CyberBrick OTA 設定與清除改用 modal 中同一個主題化進度卡，設定使用真實里程碑的 determinate progress，沒有中間事件的清除使用 indeterminate progress。

issue #132 再補強 Windows 預設安裝：PlatformIO/pip scratch 改到短的使用者暫存交易目錄並在所有 terminal path 清理；安裝前對 runtime 與 scratch 保留後代路徑預算，將上游 long-path hint 分類為 `path-too-long`。新增 `ManagedRuntimeProgressPresenter` 以 Notification 呈現首次安裝與 repair，負責絕對轉增量進度、取消橋接、跨視窗等待及三個安全復原動作，不阻塞 Extension activation 或 Blockly editor。

## 技術背景

**語言／版本**：TypeScript 5.9.3、Node.js 22.16.0+（貢獻者與 Extension Host 基準）、受管理 CPython 3.11

**主要相依套件**：VS Code Extension API `^1.109.0`、Node `child_process`／`crypto`／`fs`／`stream`、PlatformIO Core、mpremote；runtime 下載走支援 HTTPS proxy 的可注入 transport，archive 解壓採最小且可稽核的格式專用實作／工具

**儲存方式**：`ExtensionContext.globalStorageUri` 下的 runtime manifest、content-addressed downloads、staging、版本目錄、安裝紀錄、lock 與隔離的 PlatformIO Core 目錄；可由 machine-scoped 設定改到經驗證的本機絕對路徑

**測試工具**：Mocha、Sinon、`@vscode/test-electron`、三作業系統 GitHub-hosted runner、決定性假 artifact、核准後的真實 runtime 安裝矩陣與 VSIX smoke test

**目標平台**：VS Code 1.109+ 桌面版；Windows、macOS、glibc Linux x64。ARM64 只在 release-candidate 真實矩陣通過的平台宣告支援

**專案類型**：單一 VS Code extension；Extension Host 與 Blockly WebView 分離

**效能目標**：乾淨且網路正常的 runner 於 15 分鐘內完成首次 runtime 安裝；初始化在 activation 背景開始，不阻塞積木編輯器；已安裝且 manifest 未變時只進行本機紀錄與版本探測，不重複下載

**限制**：不要求系統 Python、pip 或管理員權限；不支援 Web Extension、musl、UNC／網路磁碟；下載內容在 checksum 與 archive containment 驗證前不得執行；Workspace 未信任時不得執行會載入專案腳本的操作；上傳開始後不得自動重試另一 Core

**規模／範圍**：兩類 Core、兩類工作負載、Windows／macOS／Linux x64，發布候選再涵蓋可取得標準 runner 的支援 ARM64；15 語系使用者介面

## 憲法檢查

*閘門：Phase 0 研究前必須通過，Phase 1 設計後再次檢查。*

| 原則 | 研究前 | 設計後 | 符合方式 |
|------|--------|--------|----------|
| I. 簡潔與可維護性 | 通過 | 通過 | 將 manifest、安裝交易、路由與錯誤分類拆成小型服務；工作負載只接收統一 invocation。 |
| II. 模組化與可擴充性 | 通過 | 通過 | Core provider、下載、檔案系統、程序執行與時鐘皆有可注入介面；未來增加 artifact 不改工作流。 |
| III. 避免過度開發 | 通過 | 通過 | 第一版只支援本機桌面與明列矩陣；不建立 daemon、通用套件管理器、shadow project 或 cloud 硬體測試。 |
| IV. 彈性與適應性 | 通過 | 通過 | runtime manifest 資料驅動平台／架構；machine-scoped 自訂路徑經同一驗證流程。 |
| V. 研究驅動開發 | 通過 | 通過 | 依 PlatformIO、VS Code、Astral 與 GitHub Actions 官方文件決定整合、安全與 CI 邊界，記錄於 research.md。 |
| VI. 結構化日誌 | 通過 | 通過 | 使用既有 `log()`，只記穩定錯誤碼與遮蔽路徑，不新增 `console.log`。 |
| VII. 完整測試覆蓋 | 通過 | 通過 | 安裝狀態機、路徑、checksum、rollback、路由、fallback 與 gate 皆有單元／契約／整合測試。 |
| VIII. 純函式與模組化架構 | 通過 | 通過 | manifest 驗證、平台選擇、錯誤分類、路徑遮蔽及 gate 判定採純函式；副作用集中於 adapter。 |
| IX. 繁體中文文件標準 | 通過 | 通過 | SDD 與使用者文件使用繁體中文；所有新增 UI 字串進入 15 語系。 |
| X. 專業發布管理 | 通過 | 通過 | release evidence 綁定 tree／VSIX／manifest，tag VSIX smoke 成功後才允許發布。 |
| XI. Agent Skills 架構 | 通過 | 通過 | 不改 Agent Skills 產品契約；若開發板平台 pin 影響衍生契約，依現有產生與新鮮度流程更新。 |

設計後沒有需要豁免的憲法違規。

## 專案結構

### 本功能文件

```text
specs/067-managed-platformio-environment/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── core-environment.md
│   ├── managed-runtime-manifest.md
│   └── release-gate-evidence.md
├── checklists/
│   ├── requirements.md
│   ├── release-readiness.md
│   ├── security.md
│   ├── implementation.md
│   └── ux.md
└── tasks.md
```

### 預計產品程式與資產

```text
src/
├── extension.ts
├── services/
│   ├── coreEnvironmentManager.ts
│   ├── managedRuntimeInstaller.ts
│   ├── managedRuntimeProgressPresenter.ts
│   ├── managedRuntimeService.ts
│   ├── managedRuntimeStorage.ts
│   ├── platformioDiagnosticService.ts
│   ├── platformioInvocationResolver.ts
│   ├── platformioProcess.ts
│   ├── arduinoUploader.ts
│   ├── arduinoMonitorService.ts
│   └── micropythonUploader.ts
├── types/
│   ├── coreEnvironment.ts
│   ├── managedRuntime.ts
│   └── platformioDiagnostic.ts
└── test/
    ├── services/
    │   ├── coreEnvironmentManager.test.ts
    │   ├── managedRuntimeInstaller.test.ts
    │   ├── managedRuntimeService.test.ts
    │   └── managedRuntimeStorage.test.ts
    └── suite/
        └── managedRuntimePathMatrix.test.ts

media/
├── html/blocklyEdit.html
├── css/blocklyEdit.css
└── js/blocklyEdit.js

resources/
└── managed-runtime/
    ├── get-platformio.py
    ├── runtime-manifest.json
    └── THIRD_PARTY_NOTICES.md

scripts/
└── managed-runtime/
    ├── create-fake-artifact.js
    ├── test-installation.js
    ├── collect-evidence.js
    ├── verify-evidence.js
    └── smoke-vsix.js

.github/workflows/
├── ci.yml
├── runtime-installation.yml
└── publish.yml
```

**結構決策**：維持單一 extension 專案。`ManagedRuntimeInitializationCoordinator` 合併 activation／editor-open 的預先初始化請求；`ManagedRuntimeService` 對 UI／工作負載提供冪等的 ensure／diagnose／repair／cleanup；`ManagedRuntimeInstaller` 只處理下載到 atomic commit 的交易；`ManagedRuntimeStorage` 驗證擁有權、路徑與 lock；`CoreEnvironmentManager` 只負責 provider／managed Core 健康探測、工作負載選擇與視窗內 sticky fallback。現有上傳器與 monitor 消費統一 `CoreInvocation`，避免直接認識安裝細節。

## 設計決策

### 1. Runtime manifest 與供應鏈

- `resources/managed-runtime/runtime-manifest.json` 是封裝與 CI 的唯一 runtime 契約；使用專屬檔名避免被 Minecraft 等第三方 Extension 的通用 `manifest.json` schema 誤判。每個 artifact 固定 Python release、implementation、platform、arch、archive format、HTTPS URL、SHA-256、license 與來源頁。
- Python 使用 Astral `python-build-standalone` CPython 3.11 `install_only` 發行物：Windows shared、macOS 與 Linux glibc 對應原生架構。Linux 啟動時先驗證 glibc 支援範圍。
- PlatformIO installer 使用 manifest 內固定 commit URL、大小與 SHA-256 的官方 `get-platformio.py` 下載 artifact，再安裝到該 Python；VSIX 不重複內嵌大檔。installer 的 pip 解析受本地 constraint 限制在 manifest 的 PlatformIO 測試範圍，安裝後版本 probe 再次 fail closed；mpremote 與開發平台採明確版本。更新 runtime manifest 必須經 runtime-sensitive CI。
- 下載採 HTTPS、限制 redirect、大小與逾時，完成 SHA-256 後才解壓。archive entry 在建立前驗證相對路徑、目標 containment、類型及連結政策；上游指向 archive 內一般檔案的相對 alias symbolic link 經驗證後略過，manifest 直接使用真實檔案，hardlink、逃逸 link、device 與其他特殊 entry 一律拒絕。

### 2. 儲存、權限與原子交易

- 預設根目錄為 `context.globalStorageUri/runtime-v1`；自訂 `singularBlockly.managedRuntime.path` 為 machine scope，只接受本機絕對路徑，不允許 workspace-relative、UNC／network path、根目錄或既有 symlink component。
- 儲存根先以 `.singular-managed-runtime-root.json` 證明所有權；全新目錄只有在為空時可認領，非空且未受管理的自訂路徑直接拒絕。其下含 `downloads/`、`staging/`、`versions/<transaction-uuid>/`、`current.json`、`locks/install.lock` 與 `workspaces/<sha256-workspace>/`。固定長度 UUID 為 Windows 預設 global storage 保留路徑預算；完整 runtime／artifact id 只存於 record。工作區 hash 使用 canonical URI，不把原始路徑寫入公開診斷。
- 安裝先取得跨視窗 lock，再於同一檔案系統建立具 transaction marker 的 staging metadata，並直接準備不可變候選版本以保留 Python venv 的絕對路徑語意。健康檢查至少涵蓋 Python、pip、受測範圍內的 `pio --version`、`pio system info --json-output` 與 `mpremote version`；全部成功後最後原子替換 `current.json`。
- `current.json` 永遠指向完整且已驗證版本。cleanup 與安裝／修復共用同一 lock，只清理由有效 transaction marker、版本 ownership marker 或 manifest hash 證明屬於 Singular 的項目；未知 staging／版本與非受管檔案保持不動。更新失敗保留 current 與前一個可用版本。
- `onStartupFinished` 呼叫 background coordinator；若狀態不是 ready／unsupported，開始 `ensureReady()`。開啟 Blockly 再呼叫同一 coordinator；同一 Extension Host 的 ensure／repair 共用單一 in-flight provisioning Promise，跨視窗使用 install lock。service 在記憶體保留 provisioning attempt、trigger、stage、percent 與最近失敗；installer 將受限長度且完成 privacy redaction 的 message／stdout／stderr 附在結構化失敗。背景 log 只寫 stage／attempt，不輸出 raw evidence；失敗不阻止編輯器或 provider 引導。

### 3. 雙 Core 選擇與 fallback

- Provider Core 仍由 `PlatformioInvocationResolver` 從官方 customPATH、provider penv 與 PATH 探測；同時存在時固定優先官方 `platformio.platformio-ide` 再 PIOArduino，診斷呈現來源。
- Singular Core 由 install record 產生絕對 Python／pio／pip／mpremote 路徑與專用環境變數：`PLATFORMIO_CORE_DIR`、`PLATFORMIO_CACHE_DIR`、`PLATFORMIO_WORKSPACE_DIR`、`PLATFORMIO_BUILD_DIR`、`PLATFORMIO_LIBDEPS_DIR`、`PLATFORMIO_SETTING_ENABLE_TELEMETRY=No`、`PLATFORMIO_SETTING_ENABLE_PROMPTS=No`、`PLATFORMIO_NO_ANSI=true`。
- Arduino 操作選擇 provider → managed；Python／mpremote 選擇 managed → provider。選擇結果與最近本機故障在視窗記憶體中依 workload sticky，重新測試、修復或視窗重啟清除。
- 每個候選先執行不載入專案的版本／能力探測。Arduino 真正啟動前先在已信任 workspace 執行 `pio pkg install --project-dir <project>`；只有 spawn、missing executable、Python import、permission、local Core store corruption，以及明確標記為 `managed-provisioning` 的 probe／prepare 失敗，可在真正 `pio run -t upload` 之前切換一次。
- 編譯／設定、DNS／proxy／TLS／registry、裝置／serial 與 cancellation 錯誤不 fallback；`pio run -t upload` spawn 成功即視為上傳已開始，後續任何 exit code 都不以另一 Core 重試。

### 4. 子程序、監控與 Workspace Trust

- 所有 Singular 命令使用 `spawn`／`execFile` 的 argument array、`shell: false`、明確 `cwd` 與該 Core 的 environment；禁止把路徑串成 shell command。
- Arduino monitor 改用 VS Code `Pseudoterminal` 將非 shell 子程序 stdout／stderr 寫入 terminal，保留既有 stop／restart 行為並能可靠終止 process tree。
- 每次 `pio pkg install`、build、upload 或任何可能載入 `platformio.ini` script 的流程前檢查 `workspace.isTrusted`；不受信任時以明確結果停止，不安裝專案套件。單純 runtime manifest／工具版本探測不需要 workspace trust。
- Provider Extension 自己啟動的 UI task 不在 Singular lock 範圍；Singular 操作以每個 workspace／workload mutex 及隔離 build 目錄避免自己的競態。

### 5. 診斷、修復、隱私與 i18n

- 現有 PlatformIO 診斷 schema 升級為雙環境：每個 Core 顯示來源、版本、健康、受管理根目錄摘要、用量、工具與 package 狀態；另顯示 Arduino／Python 目前選擇及最近 fallback 類別。
- package 狀態在尚未執行真實 project package install 前為 `unknown`，不以網路探測或假 install 宣告健康。
- 診斷 session 會納入 managed provisioning 的 running／failed snapshot；失敗時整體狀態至少為 degraded，即使 provider 可用也不得把背景安裝失敗誤報為完全 operational。複製摘要、AI repair packet 與 issue draft 共用遮蔽後 attempt／stage／code／bounded stdout／stderr。
- 複製摘要使用現有 privacy redactor，workspace 與 home 轉成穩定 token；不輸出完整 manifest URL query、專案內容、環境變數值或 secrets。
- managed Core 卡片提供「開啟 Singular Core 資料夾」動作；WebView 只送出固定 command，不攜帶路徑，Extension Host 才以本機 `revealFileInOS` 開啟 managed root。完整路徑不進入 WebView state、log、clipboard 或 issue draft。
- repair 建立新交易並只切換 managed current；cleanup 列出並驗證目標後只刪除 managed-owned 項目，不觸碰 provider、專案或自訂路徑中的未知檔案。新增文字全部經 15 語系流程。

### 6. 專案平台 pin 與相容性

- 新產生的 `platformio.ini` 使用 runtime manifest 所列的受測 PlatformIO platform package 版本；既有 `platform = atmelavr`／`espressif32` 等未鎖定設定只在操作前顯示一次警告，不背景改寫。
- PlatformIO／PIOArduino 安裝引導維持 spec 063：每次開啟 Blockly 對所有板型檢查官方 provider，失敗後 PIOArduino，最後開啟 Extensions 搜尋；不新增 `extensionDependencies`。
- 同時有 provider 與 managed Core 時不自動移除、更新或清理 provider；所有差異都可由診斷看到。

### 7. CI、PR 與發布閘門

- `ci.yml` 的每個 PR 在 Windows／macOS／Linux 以本機 fake artifact 執行安裝、Unicode／空白／特殊字元／長路徑、checksum、permission 與 rollback 測試，不連外，維持 `pull_request`、`contents: read`、零 secrets。真實 E2E 的 sandbox 需模擬 VS Code 預設 global storage 層級，且上層目錄含 Unicode、空白與合法特殊字元，避免短暫存根掩蓋 Windows 路徑預算缺陷。
- `runtime-installation.yml` 只由 `pull_request` 的 label gate 或受限 `workflow_dispatch` 執行。`runtime-e2e-approved` 執行三 OS x64 真實下載；`release-candidate` 加入目前宣告支援且可由標準 GitHub-hosted runner 執行的 ARM64。外部 PR 在維護者核准前不執行真實下載，且永不使用 `pull_request_target` 執行 PR 程式碼。所有會執行候選程式碼的 checkout 直接使用 GitHub event 綁定的 immutable SHA；reusable publish caller 則明確傳入同一 release tag 作 `candidate_ref`，且動態 release ref 的真實矩陣不寫入 npm dependency cache。被呼叫 workflow 的 `github.event_name` 沿用 caller event，不能以 `workflow_call` 字串判斷是否執行；prepare job 輸出的 SHA 只供 evidence 身分比對，不得再作為可執行 checkout ref。
- 底層 artifact selector 對 `release-candidate` 預設 fail closed；正式 Extension factory 因 publish workflow 強制要求完整 ARM64 release matrix，才明確啟用 manifest 內的 ARM64 候選。缺少對應 evidence 時不得發布該 factory policy。
- evidence JSON 直接讀取真實 E2E result，記錄 PR／event、head SHA、tree SHA、VSIX SHA-256、runtime manifest SHA-256、runner image／arch、artifact id／SHA-256 與測試結果；verifier 必須將 artifact 逐項對回 manifest。新 commit 使 check 與 evidence 自動失效。
- squash merge 後的 release 準備腳本比較 master tree 與 evidence 的已測 tree；只有內容相同才允許 annotated tag。tag 工作流重新建置正式 VSIX並執行不連外的封裝資源／fake-runtime smoke，成功後才讓 GitHub Release、Marketplace 與 Open VSX jobs 開始。

### 8. 新專案同意與寫入邊界

- Extension activation 可對已有 `blockly/` marker 的正式專案維護必要設定與 candidate watcher，但不得安裝 Project Skill；一般資料夾只啟動 managed runtime 的 extension-owned 背景初始化，不寫入 workspace。
- `SettingsManager.readSetting()` 是安全詢問前唯一需要的偏好查詢，必須只讀既有 `.vscode/settings.json`；檔案或目錄不存在時直接回傳預設值，不建立 `.vscode/`。
- `WebViewManager.createAndShowWebView()` 回傳 `opened`、`cancelled` 或 `no-workspace`。只有 `opened` 代表既有專案或使用者已明確選擇繼續，呼叫端才可執行 Project Skill 安裝；activation 與 workspace-folder change 不再具有 Skill 安裝入口。
- Activity Bar 可能由 view resolve 與 visibility change 近乎同時送出命令；`editorOpenInFlight` 合併並行請求，使所有呼叫者共用一個安全詢問結果，並只執行一次 watcher／Skill 後置動作。
- workspace settings 初始化移到 safety guard 之後；取消、Escape 或關閉詢問都在任何 Project Skill、Blockly 專案或設定寫入前返回。
- 「不再提醒」同時表示本次繼續，故可在使用者作出選擇後保存偏好並執行初始化；這不構成詢問前的隱式同意。

### 9. OTA 共用進度呈現

- `cyberbrickProvisioningStatus` 移到設定與進階清除 accordion 外，成為兩個操作共用且永遠位於操作區上方的單一進度卡；不保留第二套 cleanup-only status DOM。
- WebView state 以 `activeProgressOperation` 區分 `provisioning`／`cleanup`。兩種操作互斥，running 時共同鎖定 USB、Wi-Fi、配對裝置與操作按鈕；cleanup request id 必須相符才接受結果，避免晚到訊息覆蓋較新的 operation。
- OTA 設定沿用 reducer 的六個已完成里程碑計算實際進度；OTA 清除服務沒有中間事件，running 時不設定 `aria-valuenow`，以主題化 sweep 表示 indeterminate，收到 terminal result 後才設為完成。
- 填色、邊框與動畫只使用既有 `--editor-*` token。forced-colors 使用系統 `Highlight`；reduced-motion 停止 transition／pulse／sweep，但保留靜態 overlay 與狀態邊框。
- 所有動態文案仍經 15 語系既有 key 並以 `textContent` 寫入；不渲染 Host HTML、不新增可控制 DOM 的 WebView message payload。

### 10. Windows scratch 路徑與 Notification progress

- installer 以 `os.tmpdir()/singular-blockly/core-installer/<20-hex>` 作 scratch。20-hex 由 managed root 與完整 transaction id 的 SHA-256 衍生，避免把 UUID、runtime id 或使用者輸入直接放入短路徑；外部檔案操作仍由以系統暫存根為 containment boundary 的 `FileService` 完成。
- Windows 預檢分別為 immutable runtime 與 installer scratch 保留已量測的後代路徑餘裕，投影達 260 字元即在執行 artifact 前以 `path-too-long` fail closed；PlatformIO/pip 回傳明確 long-path hint 時也正規化為同一錯誤碼。
- scratch leaf 只由獨占交易 marker 認領；marker 碰撞時不使用也不刪除未知 leaf，成功認領後才於 `finally` 清理。候選 runtime rollback、lock release 與 scratch cleanup 彼此獨立，任何清理失敗不得擴大到 temp root、managed root 或 provider `.platformio`。
- `ManagedRuntimeProgressPresenter` 在 ready／unsupported 前置檢查後才呼叫 `withProgress`，activation 與 editor-open 共用同一 notification promise。等待 lock 只回報在地化訊息；其餘 stage 將 installer 絕對百分比轉為單調 `increment`。
- VS Code cancellation token 只轉為 `AbortController.abort()`，由既有 downloader／process／installer 交易邊界負責停止與 rollback。取消不顯示一般錯誤；其他失敗只顯示已在地化、無路徑內容的訊息與固定安全動作。
- 跨視窗取得 lock 後由 installer 回呼 service 重新驗證 `current.json`；健康且符合目前 manifest／artifact 時直接採用。若等候逾時但另一視窗剛完成，service 在形成失敗 snapshot 前再做一次相同採用檢查。

## 複雜度追蹤

無需憲法豁免。新增服務對應不可合併的安全邊界（artifact 信任、安裝交易、環境路由），不建立常駐程序或平行專案模型。
