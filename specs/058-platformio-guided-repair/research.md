# 研究：PlatformIO Guided Repair

## 研究來源

- 既有程式碼：`src/services/platformioDiagnosticService.ts`、`src/webview/platformioDiagnosticPanel.ts`、`src/types/platformioDiagnostic.ts`、`media/js/platformioDiagnostic.js`。
- 既有測試：`src/test/services/platformioDiagnosticService.test.ts`、`src/test/webview/platformioDiagnosticPanel.test.ts`。
- VS Code 官方 API/Webview 文件：確認 `ExtensionContext.workspaceState`、`Memento`、Webview message passing、clipboard、Webview 安全與狀態保存邊界。
- PlatformIO 官方文件：VS Code integration、Core installer script、custom applications/extensions integration、proxy configuration。
- 本 repo memory：`platformio-resolution-and-upload-button.md` 中已驗證「不要寫死 `~/.platformio/penv`」與 Windows Unicode/shell 字串風險。

## 決策 1：沿用既有 PlatformIO status command/panel，而非新增入口

**Decision**: v1 將 guided repair 合併進既有 `singular-blockly.checkPlatformioStatus` 指令與 `PlatformioDiagnosticPanel`，在同一個面板內加入自動修復、修復歷程、AI packet 與 issue draft 區塊。

**Rationale**: 使用者已把這個入口視為 PlatformIO 狀態與診斷的單一位置。新增 command/panel 會分散 UX，也會讓診斷結果與修復狀態需要跨面板同步。現有面板已具備 `retest`、`copySummary`、localized strings、Extension Host ↔ WebView 訊息通道與可注入 service 測試基礎，最符合「止血版」的低複雜度目標。

**Alternatives considered**:
- 新增 `singular-blockly.repairPlatformio` command：被拒絕，因為會產生兩個相似入口，且違反「repair UI 合併進既有 status command/panel」的產品決策。
- 在 Blockly 主 WebView 中加入修復 UI：被拒絕，因為會把工具鏈修復與積木編輯流程耦合，並增加 Extension Host/WebView 邊界風險。

## 決策 2：修復歷程使用 `ExtensionContext.workspaceState`，不依賴 Webview state

**Decision**: 修復歷程以 workspace scope 儲存在 `context.workspaceState`，key 需包含 feature namespace 與 workspace identity；資料以環境 fingerprint 判斷是否仍適用。Webview 的 `getState/setState` 僅保留面板生命週期中的暫時 UI 狀態。

**Rationale**: 需求要求歷程在工作區範圍內保存，直到使用者清除或環境 fingerprint 改變。VS Code `Memento` 的 `workspaceState` 正是 workspace-scoped persistence；`globalState` 會跨工作區污染；Webview state 在 panel 銷毀後不可靠，也不適合當修復稽核紀錄。

**Alternatives considered**:
- `globalState`：被拒絕，跨工作區共享歷程會混淆不同專案與不同機器狀態。
- `WebviewPanelSerializer` / `retainContextWhenHidden`：被拒絕作為資料來源；它們是 UI 還原/保留機制，不是可靠的 workspace-scoped history store。
- 寫入專案檔案：被拒絕，修復歷程屬於本機環境狀態，不應污染使用者專案與 Git diff。

## 決策 3：拆出修復 planner/executor/history/redaction 模組，保留既有診斷服務責任

**Decision**: `PlatformioDiagnosticService` 保持「蒐集與描述狀態」為主，新增或擴充獨立服務負責：修復候選規劃、allowlisted repair execution、歷程保存、AI packet 產生、issue draft 產生與敏感資訊遮罩。純決策邏輯需可用單元測試覆蓋；具副作用的 executor 必須注入 `execFile`、clock、filesystem/config reader。

**Rationale**: 既有 service 已有固定診斷項目與測試。把修復流程塞進同一個大型 service 會降低可測性，也容易把「偵測」與「修改使用者環境」混成一團。模組拆分符合 constitution 的 modularity/testability，並讓 hidden tests 可以直接驗證 planner、redactor 與 history invalidation。

**Alternatives considered**:
- 在 `PlatformioDiagnosticService.collectDiagnostics()` 內直接執行修復：被拒絕，診斷應無副作用；使用者也需要先確認。
- 在 WebView JS 中決定修復步驟：被拒絕，WebView 不應掌握本機檔案/執行權限，且不利於測試。

## 決策 4：自動修復僅允許 user-space allowlist，使用 `execFile` 與 timeout，不使用 shell

**Decision**: v1 自動修復只能執行安全、有限、可描述的 user-space 步驟；所有外部指令使用 `execFile(file, args, options)` 或等效直呼 API，不使用 shell 字串。每個 repair run 最多執行一個 primary flow 中的 2–3 個步驟；遇到成功、blocking failure、使用者取消或 timeout 即停止。

**Rationale**: 使用者明確要求 v1 不做 system-level repair。Windows 路徑含中文/Unicode、空白或特殊字元時，shell 字串容易造成假陰性或命令注入風險；`execFile` 可避免 shell quoting 問題。有限步驟與 timeout 能避免修復流程變成黑盒安裝器。

**Alternatives considered**:
- 修改 shell profile / PATH：被拒絕，屬於系統或使用者 shell 層面的持久變更，不符合 v1 邊界。
- 使用 Homebrew/apt/choco/sudo：被拒絕，屬於系統套件管理或系統權限。
- 一鍵執行多個互不相關 flow：被拒絕，難以回報因果與風險，且不符合「limited sequence」澄清。

## 決策 5：吸收官方 PlatformIO extension settings 作為偵測與修復證據

**Decision**: 診斷與 repair planner 需讀取 `vscode.workspace.getConfiguration('platformio-ide')` 的核心設定，至少包含 `customPATH`、`useBuiltinPIOCore`、`useBuiltinPython`、`useDevelopmentPIOCore`、`customPyPiIndexUrl`，以及 VS Code `http.proxy` / `http.proxyStrictSSL`。這些資料只作為搜尋候選、環境證據與建議，不直接依賴 PlatformIO extension 的私有 `penv` 實作。

**Rationale**: 官方 VS Code integration 文件明確列出 `platformio-ide.customPATH`、`useBuiltinPython`、`useBuiltinPIOCore` 等設定；本 repo 目前 `src/**` 沒有使用這些設定，因此會出現官方 extension 可用、Singular Blockly 偵測不到的 false negative。使用設定作為公開/文件化 API 比反查 extension private folders 更穩定。

**Alternatives considered**:
- 繼續假設 `~/.platformio/penv`：被拒絕，已知在 fresh install、portable/builtin Python、custom PATH、不同 OS 與官方 extension 初始化流程中不可靠。
- 直接 import 或呼叫 PlatformIO extension private internals：被拒絕，版本耦合高且沒有穩定契約。
- 完全忽略 proxy/PyPI 設定：被拒絕，企業/學校網路常見 proxy 會影響 pip/installer 修復結果。

## 決策 6：AI packet 與 issue draft 預設遮罩敏感資訊，且只產生草稿

**Decision**: AI packet 與 issue draft 都由 Extension Host 產生可複製的 Markdown/plain text，預設遮罩使用者名稱、home path、workspace path、proxy credentials、token-like 字串與其他已知敏感片段。issue draft 只建立本地草稿/clipboard 內容；不可自動公開建立 GitHub issue。

**Rationale**: 使用者需要 AI 回傳「這次解決問題的方法」，因此 packet 必須包含環境、診斷、嘗試過的修復與期望回覆格式。但公開 issue 需要 human approval、隱私檢查與重複 issue 判斷。預設遮罩可降低支援過程外洩本機路徑或 proxy credential 的風險。

**Alternatives considered**:
- 複製原始 log：被拒絕，容易洩漏路徑、帳號、proxy/token。
- 自動呼叫 GitHub API 建 issue：被拒絕，超出 v1 governance 邊界，也需要額外認證/權限與 duplicate triage。
- 只保留現有 diagnostic clipboard summary：被拒絕，缺少修復歷程、問題脈絡與 AI 回覆契約。

## 決策 7：環境 fingerprint 用於判斷歷程有效性，而非硬性綁死單一路徑

**Decision**: fingerprint 應由 OS/platform、workspace path hash、相關 VS Code/PlatformIO 設定 hash、resolved executable paths、版本 probe 摘要與關鍵 env hints 組成；fingerprint 改變時提示使用者重設或確認保留歷程。

**Rationale**: 修復歷程只在相同或高度相似環境下才有診斷價值。若使用者更新 PlatformIO、切換 custom PATH、換 workspace 或改 proxy，舊歷程可能誤導；但 fingerprint 不能包含原始敏感資料，因此需儲存 hash/摘要並在匯出時遮罩。

**Alternatives considered**:
- 永久累積全部歷程：被拒絕，容易讓 AI packet 與 issue draft 混入過期嘗試。
- 只用 workspace path 判斷：被拒絕，不能偵測 Python/PlatformIO/PATH/proxy 改變。
- 只用 `pio --version`：被拒絕，無法反映 custom PATH、proxy、mpremote 或 Python 變化。
