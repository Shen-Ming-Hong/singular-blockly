# 研究：受管理的 PlatformIO 雙 Core 環境

## 決策 1：以 Extension 自有 Python 作為 Singular Core 根基

**決策**：封裝 runtime manifest，下載 Astral `python-build-standalone` 的 CPython 3.11 `install_only` artifact，再以該 Python 執行由 manifest 固定 commit、大小與 SHA-256 的 PlatformIO 官方 installer artifact。

**理由**：PlatformIO 的 IDE 整合文件建議編輯器整合使用官方 `get-platformio.py`，而不是假設系統 Python 可用；Astral 的 `install_only` 發行物正是供應用程式嵌入的可攜 Python，包含 pip 與授權 metadata。這能解決沒有 Python、系統 Python 版本不同及 provider 尚未初始化的問題。

**替代方案**：繼續只用 provider penv 無法解除單點依賴；呼叫系統 `python`／`py` 不符合無 Python 需求；把所有平台 runtime 放進 VSIX 則會使套件過大。

**來源**：[PlatformIO custom integration](https://docs.platformio.org/en/stable/core/installation/integration.html)、[PlatformIO installer](https://docs.platformio.org/en/stable/core/installation/methods/installer-script.html)、[Astral running distributions](https://github.com/astral-sh/python-build-standalone/blob/main/docs/running.rst)、[Astral releases](https://github.com/astral-sh/python-build-standalone/releases)。

研究日最新 upstream release 為 `20260814`；產品不在執行期追蹤 latest，而把審查過的版本與 SHA-256 固定於 manifest。

## 決策 2：預設使用 `globalStorageUri`，自訂路徑只接受 machine scope 本機目錄

**決策**：runtime 預設放在 `ExtensionContext.globalStorageUri/runtime-v1`。自訂設定先拒絕相對路徑、UNC／網路位置、根目錄、symlink component、不可寫或不可執行位置；新根目錄只在為空時寫入固定 ownership marker，既有非空且無有效 marker 的路徑不認領。

**理由**：VS Code 將 `globalStorageUri` 定義為 Extension 的全域持久儲存位置，適合大型、不需同步的 machine-local 資料。runtime 不應進入 workspace 或設定同步。

**來源**：[VS Code API](https://code.visualstudio.com/api/references/vscode-api)、[VS Code Common Capabilities](https://code.visualstudio.com/api/extension-capabilities/common-capabilities)。

## 決策 3：使用 manifest、checksum 與 committed install record

**決策**：每個 artifact 由封裝 manifest 固定 URL、大小上限、SHA-256、授權與平台。installer 只在同一檔案系統的 staging 工作，健康檢查成功後先提交不可變版本目錄，最後原子替換 `current.json`。

Archive 解壓前列舉全部 entry。`python-build-standalone` 的 `install_only` tarball 含少量指向同一 archive 內版本化一般檔案的相對 alias symlink；本功能驗證其 target 後略過 alias，並讓 manifest 直接指向 `python3.11`。absolute／逃逸 link、hardlink、device 與其他特殊 entry 一律拒絕，因此 managed store 不建立 archive symlink。

**理由**：僅有目錄存在無法區分中斷安裝與可用環境；小型 committed record 可讓更新失敗、編輯器關閉與多視窗競態都回到既有版本。直接覆寫 current 或只檢查檔案存在都不足以保護既有可用環境。

## 決策 4：PlatformIO 資料目錄由環境變數完整隔離

**決策**：對 Singular Core 設定 `PLATFORMIO_CORE_DIR`、`PLATFORMIO_CACHE_DIR`、`PLATFORMIO_WORKSPACE_DIR`、`PLATFORMIO_BUILD_DIR` 與 `PLATFORMIO_LIBDEPS_DIR`，並關閉 prompt、telemetry 與 ANSI。每個 workspace 以 canonical URI SHA-256 取得專用子目錄。

**理由**：PlatformIO 官方提供這些變數作為 Core、cache、workspace、build 與 libdeps 的設定介面；可以保留原始 project directory，同時避免兩套 Core 共用狀態。

**來源**：[PlatformIO environment variables](https://docs.platformio.org/en/stable/envvars.html)。

## 決策 5：健康探測與專案套件準備分離

**決策**：工具健康只執行不載入專案的 `--version` 與 `pio system info --json-output`；只有實際且受信任的專案操作才執行 `pio pkg install --project-dir`。未完成真實 install 時 package 狀態為 `unknown`。

**理由**：診斷不應為了顯示綠燈產生網路副作用，也不能把 CLI 可啟動當成 project package 已可用。

**來源**：[pio system info](https://docs.platformio.org/en/stable/core/userguide/system/cmd_info.html)、[pio pkg install](https://docs.platformio.org/en/stable/core/userguide/pkg/cmd_install.html)。

## 決策 6：Workspace Trust 是專案程序的硬閘門

**決策**：package resolve、build、upload 與 monitor 前必須確認 `vscode.workspace.isTrusted`；不受信任時不啟動 project-aware process。固定 runtime 下載與版本探測可以進行。

**理由**：PlatformIO project configuration 可引用 scripts；VS Code Workspace Trust 正是 Extension 限制這類 workspace code execution 的正式介面。

**來源**：[VS Code Workspace Trust](https://code.visualstudio.com/api/extension-guides/workspace-trust)。

## 決策 7：fallback 由階段與錯誤分類共同限制

**決策**：只有 spawn 失敗、找不到 executable、Python import、permission 或本機 Core store corruption 可在真正 project process 前 fallback 一次。網路、編譯、設定、裝置、serial、取消及 upload spawn 後錯誤都不 fallback。

**理由**：上傳重試可能對硬體造成不可預期效果；網路與程式碼錯誤換 Core 也不會修復根因。未知錯誤採 fail closed。

## 決策 8：PR 快速矩陣與核准後真實矩陣分層

**決策**：所有 PR 的 Windows／macOS／Linux 測試使用 repository fake artifact；runtime-sensitive PR 在 `runtime-e2e-approved` 後做 x64 真實下載；`release-candidate` 再加入已承諾 ARM64。外部 PR 不使用 secrets、永久 self-hosted runner 或 `pull_request_target` 執行 PR code。

**理由**：快速測試低成本覆蓋 path／transaction 邏輯，真實測試驗證 upstream artifact 與 runner 相容性。公開 repository 的標準 GitHub-hosted runner 分鐘目前不直接計費；larger runner 與額外 storage 仍可能計費。

**來源**：[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)、[Choosing runners](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)、[Secure use](https://docs.github.com/en/actions/reference/security/secure-use)、[pull_request_target security](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target)。

## 決策 9：Pseudoterminal 取代 shell command monitor

**決策**：Arduino monitor 以 `spawn(..., { shell: false })` 啟動，透過 `Pseudoterminal` 將 stdout／stderr 呈現在 VS Code terminal。

**理由**：目前 `sendText()` 需要自行 quoting，中文、空白與特殊字元容易失敗，也無法可靠取得程序生命週期。Pseudoterminal 保留介面並使用安全 argument array。

## 決策 10：Activation 預先初始化，editor-open 冪等重查

**決策**：保留 `onStartupFinished` activation event，Extension 啟用後立刻以 background coordinator 呼叫 `getStatus()`／`ensureReady()`；每次活動列或命令開啟 Blockly 編輯器時再呼叫同一 coordinator。建置、上傳與 monitor 消費端仍自行 `ensureReady()`，不假設背景工作必然成功。

**理由**：首次 runtime 安裝包含 Python、PlatformIO 與 mpremote 下載，若延遲到學生按下上傳才開始，會把最長等待放在最敏感的課堂操作上。Activation 預熱能提早利用編輯時間；editor-open 重查可處理離線後恢復、安裝中斷或環境損壞。同視窗合併 Promise 與跨視窗 lock 避免重複交易；背景錯誤不阻止編輯器，保留 provider 與稍後重試的可用性。

**替代方案**：只在上傳 lazy install 雖然網路副作用最少，但首次操作延遲最高；阻塞 activation 或 editor-open 直到下載完成會讓無網路使用者連編輯器都無法使用，因此不採用。

**來源**：[VS Code activation events](https://code.visualstudio.com/api/references/activation-events)、[VS Code extension anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy)。

## 決策 11：PlatformIO 使用受測範圍 constraint 與安裝後雙重驗證

**決策**：固定 commit 的官方 installer 仍負責建立 PlatformIO penv，但透過 pip constraint 將 `platformio` 解析限制在 manifest 的 `>=minimum <next-major` 範圍；完成後解析 `pio --version` 並再次驗證，同一範圍外不得寫入 ready record。

**理由**：官方 installer 的 stable 流程會以 pip `-U platformio` 取得最新版本，未提供產品所需的精確 Core pin；只把測試範圍寫在文件卻不執行會讓未驗證大版本進入環境。constraint 保留官方 penv 建立流程，同時在安裝前解析與安裝後 probe 兩側限制相容性。

**來源**：[PlatformIO custom integration](https://docs.platformio.org/en/stable/core/installation/integration.html)、[PlatformIO installer source](https://github.com/platformio/platformio-core-installer/blob/develop/pioinstaller/core.py)。
