# 功能規格：受管理的 PlatformIO 雙 Core 環境

**功能分支**：`codex/067-managed-platformio-environment`

**建立日期**：2026-08-15

**狀態**：實作完成，待跨平台 CI 與實機發布驗證

**輸入**：建立不依賴系統 Python 的 Singular 受管理 PlatformIO 環境，在 Extension 啟用後背景預先初始化並於每次開啟積木編輯器時重查狀態，保留既有 PlatformIO／PIOArduino provider，引入依工作負載選擇與安全 fallback 的雙 Core 模型，並在合併與發布前完成跨作業系統、路徑及架構驗證。

## 使用者情境與測試 *(必填)*

### 使用者故事 1－沒有 Python 也能開始使用（優先級：P1）

學生在沒有安裝 Python、pip 或 PlatformIO Core 的電腦上安裝 Singular Blockly。擴充功能能在自己的受管理儲存位置準備所需環境，讓 CyberBrick Python 工作流不再取決於系統 Python 或第三方 provider 是否已完成初始化。

**優先此項的理由**：首次安裝若失敗，學生無法進入任何後續編譯、上傳或修復流程，是整體功能最關鍵的可用性門檻。

**獨立測試方式**：在不提供系統 Python 的乾淨支援平台上安裝 VSIX，完成環境準備後重新啟動編輯器，確認 Python 工作流可探測裝置且不會重複安裝。

**驗收情境**：

1. **給定** 支援的電腦沒有系統 Python、pip 或既有 penv，**當** 安裝後的 Extension 在 `onStartupFinished` 啟用，**則** 系統立即在背景開始準備受管理環境，不等待第一次上傳，也不要求系統管理員權限。
2. **給定** 受管理環境已成功建立，**當** 學生重新啟動編輯器或暫時離線，**則** 系統重用既有環境，不再次下載或要求安裝 Python。
3. **給定** 環境安裝中斷，**當** 學生下次重試，**則** 系統能從一致狀態重新開始或恢復既有可用版本，不留下被誤判為成功的半套環境。
4. **給定** 啟用時的背景安裝仍在進行、曾失敗或環境已損壞，**當** 學生從活動列開啟積木編輯器，**則** 系統再次檢查並冪等續裝／修復；編輯器本身不因下載失敗而被阻擋。

---

### 使用者故事 2－雙 Core 自動選擇與安全備援（優先級：P1）

學生不需要理解 Provider Core 與 Singular Core 的差異。Arduino 工作流優先沿用 PlatformIO／PIOArduino provider，CyberBrick Python 工作流優先使用 Singular 環境；主要環境確定因本機執行環境損壞而無法工作時，系統只在安全階段切換到另一套環境。

**優先此項的理由**：保留既有 Arduino 相容性，同時解除 Python 工作流對 provider penv 的單點依賴，是本功能的主要價值。

**獨立測試方式**：分別損壞 Provider Core 與 Singular Core，在 Arduino 及 Python 工作流中確認選擇順序、單次 fallback、錯誤分類與後續黏著選擇符合規則。

**驗收情境**：

1. **給定** Provider Core 可用，**當** 學生建置 Arduino 專案，**則** 系統優先使用 Provider Core。
2. **給定** Singular Core 可用，**當** 學生使用 CyberBrick USB 或其他 penv Python 功能，**則** 系統優先使用 Singular Core。
3. **給定** 主要環境在開始建置或上傳前被判定為本機環境故障，**當** 備援環境健康，**則** 系統最多自動切換一次並完成操作。
4. **給定** 上傳程序已經開始，**當** 程序失敗，**則** 系統不得以另一套 Core 自動重複上傳。
5. **給定** 失敗原因是編譯錯誤、網路、裝置、序列埠或使用者取消，**當** 系統處理錯誤，**則** 不得把問題誤判為 Core 故障並切換環境。

---

### 使用者故事 3－不同路徑與權限下可靠安裝（優先級：P1）

使用中文名稱、空白、合法特殊字元、長路徑或非預設磁碟的學生，能在 Windows、macOS 與 Linux 上使用受管理環境。若選定位置不可寫、無法執行或不受支援，系統在執行下載內容前阻止操作並提供可行指引。

**優先此項的理由**：路徑與權限是目前 penv 問題最難在開發者電腦重現的來源，必須成為正式支援契約。

**獨立測試方式**：在各作業系統建立中文、空白、特殊字元、長路徑、不同磁碟、不可寫與連結目錄，驗證成功案例與拒絕案例都有一致結果。

**驗收情境**：

1. **給定** 使用者與專案路徑包含中文、空白或合法特殊字元，**當** 系統安裝並執行環境，**則** 不因路徑解析或命令 quoting 失敗。
2. **給定** 受管理位置不可寫或內容不可執行，**當** 學生開始安裝，**則** 系統顯示可理解的錯誤，不破壞既有環境或專案。
3. **給定** 使用者指定不受支援的網路位置或平台，**當** 系統檢查環境，**則** 明確拒絕並說明支援界線，不靜默改用未知位置。

---

### 使用者故事 4－可診斷、修復與清理（優先級：P2）

教師或維護者能在既有 PlatformIO 診斷頁同時查看兩套 Core 的狀態、版本、儲存位置、工作負載選擇與最近 fallback 原因，並能安全地重新測試、修復或清理 Singular 管理的內容。

**優先此項的理由**：自動化不能完全消除 proxy、防毒軟體、磁碟或第三方服務故障；清楚且不洩漏個資的診斷是可支援性的必要條件。

**獨立測試方式**：建立兩套 Core 的健康、降級、缺失與損壞組合，確認診斷顯示、修復目標、歷史失效及清理邊界正確。

**驗收情境**：

1. **給定** 任一 Core 可用、降級或損壞，**當** 使用者開啟 PlatformIO 診斷，**則** 可分辨兩套環境及目前工作負載選擇。
2. **給定** 使用者重新安裝或清理 Singular Core，**當** 操作完成，**則** Provider Core 與使用者專案內容不被修改或刪除。
3. **給定** 套件尚未發生真實安裝，**當** 系統顯示健康狀態，**則** 不虛構套件安裝成功，狀態保持未知。
4. **給定** 診斷或錯誤被複製分享，**當** 系統產生摘要，**則** 不包含完整使用者路徑、專案內容或機密資料。
5. **給定** 維護者需要確認 F5 測試實際使用的 Singular Core，**當** 在 managed Core 卡片選擇開啟資料夾，**則** Extension Host 直接在作業系統檔案管理員顯示受管理根目錄，且完整路徑不傳入 WebView、不寫入日誌或剪貼簿摘要。

---

### 使用者故事 5－既有 Provider 使用者維持相容（優先級：P1）

已安裝 PlatformIO IDE 或 PIOArduino 的使用者仍保有原本的 provider 引導、Arduino Core 與設定，不會因 Singular Core 上線而被強制移除、清理或改寫。

**優先此項的理由**：Provider Extension 仍是既有 Arduino 生態的重要入口，改動不得破壞 spec 063 已交付的 VS Code／VSCodium 行為。

**獨立測試方式**：分別測試只安裝官方 provider、只安裝 PIOArduino、兩者皆有及兩者皆無，確認引導、優先順序與既有 Arduino 工作流相容。

**驗收情境**：

1. **給定** 任一 provider 已安裝且健康，**當** 使用者開啟積木編輯器或建置 Arduino 專案，**則** 不重複安裝 provider，Arduino 行為與既有版本一致。
2. **給定** 未安裝任何 provider，**當** 使用者開啟任一板型的積木編輯器，**則** 系統仍執行既有官方 provider、PIOArduino、Extensions 搜尋的引導順序。
3. **給定** 兩個 provider 同時安裝，**當** 系統選擇 Provider Core，**則** 採固定且可診斷的優先順序，不自動停用其中任何一個。

---

### 使用者故事 6－合併與發布前證明支援矩陣（優先級：P2）

維護者能在 PR 合併前取得實際跨作業系統安裝證據，並阻止未通過必要環境驗證的 Runtime 變更或發布候選進入正式發布。

**優先此項的理由**：受管理 runtime 位於所有使用者操作之前；若只在開發者電腦測試，路徑、權限或架構錯誤可能讓整個 Extension 無法使用。

**獨立測試方式**：建立一般 PR、Runtime 相關 PR、外部 PR 與發布候選 PR，確認快速測試、核准後完整測試、ARM 發布閘門與合併後內容一致性判斷正確。

**驗收情境**：

1. **給定** 任意 PR，**當** CI 啟動，**則** 自動執行不依賴外部下載的三作業系統快速測試。
2. **給定** PR 修改 Runtime 敏感範圍，**當** 維護者核准完整測試，**則** 合併前在三作業系統 x64 完成真實安裝驗證。
3. **給定** PR 是正式發布候選，**當** 維護者要求合併，**則** x64 與承諾支援的 ARM64 結果都必須通過。
4. **給定** squash merge 產生新的 commit，**當** 建立正式版本標記前，**則** 系統確認合併後檔案內容與已測試內容一致。
5. **給定** PR 來自外部貢獻者，**當** 執行測試，**則** 未信任程式碼不得取得發布機密或直接使用永久自架 runner。

---

### 使用者故事 7－未同意前不修改一般資料夾（優先級：P1）

使用者可能在任意資料夾誤按積木編輯器。系統可以先辨識資料夾並詢問是否建立專案，但在使用者明確同意前，不得安裝 Project Skill、建立 Blockly 專案檔或初始化 workspace 設定。

**優先此項的理由**：未經同意寫入 `.agents/`、`blockly/` 或 `.vscode/` 會破壞使用者對專案安全警告的信任，也使「取消後不變更資料夾」的承諾失真。

**獨立測試方式**：在沒有 Blockly marker 的一般資料夾執行開啟命令，分別回覆取消、繼續與不再提醒；比較操作前後檔案樹與 Skill／設定服務呼叫紀錄。

**驗收情境**：

1. **給定** 一般資料夾尚未包含 Blockly 專案，**當** 使用者取消或關閉安全詢問，**則** `.agents/`、`.claude/`、`blockly/` 與 `.vscode/` 都不得因本次操作建立或變更。
2. **給定** 使用者在安全詢問中選擇繼續，**當** 編輯器開始初始化專案，**則** 系統才可寫入 workspace 設定並安裝 Project Skill。
3. **給定** 使用者選擇「不再提醒」並繼續，**當** 系統保存偏好，**則** 此選擇視為本次明確同意；偏好與專案相關寫入都必須發生在選擇之後。
4. **給定** 資料夾已是 Blockly 專案，**當** 使用者開啟積木編輯器，**則** 系統不重複詢問，並只在編輯器確認開啟後靜默維護 Project Skill；單純 Extension activation 或新增 workspace folder 不得建立 Skill。

---

### 使用者故事 8－OTA 設定與刪除共用可見進度（優先級：P2）

使用者開始 CyberBrick OTA 設定或清除 OTA 時，能在同一個符合專案視覺風格的進度區立即看見工作正在進行、目前階段與最後結果，不會面對透明或看似靜止的進度條。

**優先此項的理由**：裝置操作需要等待且期間不可拔除 USB；缺少可見回饋容易造成重複點擊、拔線或誤以為介面故障。

**獨立測試方式**：以 WebView 契約測試確認兩個操作都在送出 Host request 前啟用同一進度元件，並驗證 determinate／indeterminate ARIA、主題 token、reduced-motion、高對比與 terminal state。

**驗收情境**：

1. **給定** 使用者按下 OTA 設定或確認清除 OTA，**當** Host request 尚未完成，**則** 共用進度卡必須先變成可見的執行中狀態並鎖定衝突控制項。
2. **給定** OTA 設定回報已知里程碑，**當** 每個有效步驟完成，**則** determinate 進度只依實際完成步驟前進，不向學生顯示分數或百分比。
3. **給定** OTA 清除服務沒有中間里程碑，**當** 清除仍在執行，**則** 進度條採可見的 indeterminate 呈現，不虛構完成百分比。
4. **給定** 任一操作成功或失敗，**當** WebView 收到結果，**則** 同一進度卡顯示對應圖示、在地化摘要與 terminal 樣式並解除控制項鎖定。
5. **給定** 使用者採用亮色、暗色、高對比或 reduced-motion 偏好，**當** 進度卡顯示，**則** 使用專案既有 theme token 且仍具清楚的靜態或動態視覺差異。

### 邊界情境

- 安裝中斷、編輯器被關閉、下載只完成一部分或 checksum 不符時，不得提交 ready 狀態。
- 兩個 VS Code 視窗同時要求安裝或更新時，只允許一個受管理交易修改環境。
- 受管理目標或 archive 內容試圖透過 symlink、hardlink、絕對路徑或父目錄逃逸時，必須拒絕操作。
- 自訂儲存路徑變更時，必須先驗證新環境再切換，且不得自動刪除舊環境。
- 既有未鎖定開發平台版本的專案可能在兩套 Core 得到不同工具鏈時，系統必須提出警告而非宣稱結果完全相同。
- Provider UI 自行啟動的任務與 Singular 命令同時執行時，系統不得宣稱能控制外部 Extension，但 Singular 自己的中間產物必須維持隔離。
- 正式 VSIX smoke test 在不可變 tag 後失敗時，任何發布目的地都不得開始；修正必須遵循新的版本與正式發布流程。
- 啟用時沒有網路、proxy 阻擋或 VS Code 很快關閉時，背景初始化可失敗或中斷，但不得阻止 Extension 啟用；開啟編輯器與上傳前的 `ensureReady()` 仍可安全重試。
- 一般資料夾的安全詢問被 Escape、關閉按鈕或取消動作結束時，必須等同取消，不得把讀取偏好的動作變成建立 `.vscode/` 的副作用。
- 活動列 resolve 與 visibility change 同時觸發開啟命令時，並行呼叫必須共用同一個 editor-open Promise 與安全詢問結果，不得讓一條取消、另一條繼續安裝 Skill。
- OTA 設定與 OTA 清除不得同時執行；切換 operation 時只能由最新明確啟動或有效 Host 回應決定共用進度卡內容。
- reduced-motion 關閉動畫後，執行中進度仍必須以邊框、色彩與靜態填色清楚可見。

## 需求 *(必填)*

### 功能需求

- **FR-001**：系統必須提供不依賴系統 Python、pip 或 venv 的 Singular 受管理 Python／PlatformIO 環境。
- **FR-002**：受管理環境必須安裝在 Extension 擁有的使用者可寫入儲存位置，並允許使用者以 machine-scoped 設定改到另一個經驗證的本機位置。
- **FR-003**：系統必須支援 Windows、macOS 與 glibc Linux 的 x64；ARM64 只有在對應真實平台驗證通過後才能宣告正式支援。
- **FR-004**：所有下載的可執行 artifact 必須具有版本、平台、架構、來源、checksum 與授權紀錄；checksum 不符時不得解壓或執行。
- **FR-005**：安裝、更新與修復必須具備 staging、健康檢查、原子切換與 rollback；任何中斷都不得把半套環境標記為可用。
- **FR-006**：系統必須保留 spec 063 的 provider 偵測與安裝引導，且不得恢復硬性 Extension 相依。
- **FR-007**：Arduino 工作負載必須以 Provider Core 為主要環境、Singular Core 為備援；Python／penv 工作負載必須使用相反順序。
- **FR-008**：每次操作最多自動 fallback 一次，且 fallback 後的選擇在目前視窗及同類工作負載保持穩定，直到明確重新測試、修復或重開視窗。
- **FR-009**：自動 fallback 只允許在建置或上傳程序開始前，且錯誤能合理歸因於本機 Core、Python、pip、權限或套件儲存損壞時發生。
- **FR-010**：編譯、專案設定、DNS、proxy、TLS、遠端 Registry、裝置、序列埠與使用者取消錯誤不得觸發 Core 自動切換。
- **FR-011**：上傳程序開始後不得自動以另一套 Core 重試；兩套環境都失敗時必須分別保留可行動的失敗原因。
- **FR-012**：兩套 Core 的 workspace、cache、penv 與子程序環境必須隔離；原始專案仍留在使用者 workspace，不建立 shadow project。
- **FR-013**：執行任何可能載入專案腳本的套件解析、建置或上傳前，必須確認 workspace 已受信任。
- **FR-014**：新產生的 Arduino 專案必須使用受測的開發平台版本；既有未鎖版專案只警告，不得在背景自動重寫。
- **FR-015**：PlatformIO 診斷必須同時呈現 Provider 與 Singular 環境的版本、隱私化儲存位置摘要、儲存用量、健康狀態、套件狀態、工作負載選擇及最近 fallback 原因；Singular 卡片必須提供由 Extension Host 直接在作業系統檔案管理員顯示 managed root 的本機動作，不得把完整根目錄傳入 WebView、日誌或可分享摘要。
- **FR-016**：診斷不得以虛構安裝或外部網路探測宣告套件健康；未經實際需要的安裝驗證時狀態必須為未知。
- **FR-017**：修復與清理只能修改 Singular 明確擁有的內容；不得刪除 Provider Core、Extension、專案或未受管理檔案。
- **FR-018**：系統必須支援中文、空白、合法特殊字元、Emoji、Unicode 正規化差異、Windows 不同磁碟與支援範圍內的長路徑。
- **FR-019**：不受支援的平台、網路位置、非法路徑或權限不足必須在執行下載內容前失敗，並提供可行動且不洩漏隱私的診斷。
- **FR-020**：所有 PR 必須執行三作業系統的決定性快速測試，不得在這個層級依賴真實外部下載。
- **FR-021**：Runtime 敏感 PR 必須由維護者核准後，在合併前通過 Windows、macOS、Linux x64 真實安裝測試。
- **FR-022**：正式發布候選 PR 必須在合併前通過 x64 與所有宣告支援 ARM64 平台的完整安裝測試。
- **FR-023**：完整測試結果必須綁定 PR、commit、Git tree、候選 VSIX、runtime manifest 與各平台結果；新 commit 或內容變更會使結果失效。
- **FR-024**：外部 PR 測試必須使用唯讀權限且不得取得發布機密；未經維護者信任的程式碼不得在永久自架 runner 執行。
- **FR-025**：tag 產生的正式 VSIX 必須在任何發布目的地開始前通過封裝資源與安裝 smoke test。
- **FR-026**：使用者可見狀態、錯誤與診斷變更必須支援專案全部 15 個語系。
- **FR-027**：所有環境選擇、安裝狀態、路徑處理、錯誤分類、rollback 與發布 gate 決策必須可由自動化測試獨立驗證。
- **FR-028**：Extension 以 `onStartupFinished` 啟用後必須非阻塞地開始檢查並預先初始化 Singular Core，不得等待第一次建置、上傳或 monitor 操作。
- **FR-029**：每次從活動列或命令開啟 Blockly 編輯器時必須再次檢查 Singular Core；同視窗同時觸發只允許共用一個初始化 Promise，跨視窗由安裝 lock 序列化。背景失敗不得阻止編輯器開啟，上傳仍須呼叫冪等 `ensureReady()` 作最後防線。
- **FR-030**：managed root 必須具有固定 ownership marker；只有空的新目錄可被認領。安裝、修復與 cleanup 必須共用跨視窗 lock，cleanup 只能移除有效 transaction／version marker 或 manifest hash 可證明擁有的項目。
- **FR-031**：PlatformIO 套件解析必須在 manifest 的受測版本範圍內，且安裝後版本 probe 不在該範圍時不得提交 ready 狀態。
- **FR-032**：對尚未成立的 Blockly 專案，系統必須先取得安全詢問的明確繼續選擇，之後才可強制安裝 Project Skill 或初始化 workspace 設定；同一時間的並行開啟命令必須共用單一結果。
- **FR-033**：安全詢問前的專案類型與偏好讀取必須無檔案系統副作用；取消、Escape 或關閉詢問後，不得因本次開啟動作建立或修改 `.agents/`、`.claude/`、`blockly/` 或 `.vscode/`。
- **FR-034**：既有 Blockly 專案開啟積木編輯器時不需重複詢問，但 Project Skill 的唯一產品安裝入口仍必須位於編輯器回報 `opened` 之後；Extension activation 與新增 workspace folder 不得自行安裝 Skill。
- **FR-035**：CyberBrick OTA 設定與 OTA 清除必須共用單一進度呈現區，且在各自 Host request 送出前進入可見的 running state。
- **FR-036**：共用進度呈現必須使用已定義的專案 theme token，支援亮色、暗色、forced-colors 與 prefers-reduced-motion；不得依賴未定義的 CSS 變數。
- **FR-037**：OTA 設定必須依已完成里程碑提供 determinate progress；沒有中間事件的 OTA 清除必須省略 `aria-valuenow` 並呈現 indeterminate progress，直到成功或失敗結果才進入 terminal state。

### 核心概念

- **Provider Core**：由 PlatformIO IDE 或 PIOArduino Extension 建立與維護的既有 PlatformIO 環境。
- **Singular Core**：由 Singular Blockly 擁有、安裝、更新與修復的 Python／PlatformIO 環境。
- **工作負載設定檔**：決定 Arduino 或 Python 操作的主要與備援環境順序。
- **Runtime Manifest**：記錄支援平台、artifact、版本、checksum、授權與受測工具相容性的正式契約。
- **健康狀態**：環境的可用、不可用或尚未經真實操作確認的狀態，不把未知誤報為成功。
- **安裝交易**：從 staging、驗證、切換到 rollback 的完整狀態流程。
- **Release Gate Evidence**：證明特定 PR 與檔案內容已在指定 OS／CPU 矩陣完成驗證的記錄。

## 成功指標 *(必填)*

### 可量測目標

- **SC-001**：在沒有系統 Python 的支援平台乾淨環境中，100% 能在 15 分鐘內完成受管理環境準備並通過工具版本探測，外部服務故障除外。
- **SC-002**：中文、空白、合法特殊字元、Emoji、Unicode 正規化與 Windows 長路徑測試矩陣在各對應支援平台全數通過。
- **SC-003**：安裝中斷、checksum 錯誤、權限不足、空間不足與更新失敗案例 100% 不會留下被判定為 ready 的半套環境，且既有可用版本能保持或恢復。
- **SC-004**：主要環境故障的允許案例每次最多發生一次 fallback；上傳開始後與禁止分類錯誤的自動 fallback 次數為 0。
- **SC-005**：既有官方 PlatformIO 與 PIOArduino 使用者的 provider 引導、Arduino 建置與診斷回歸測試全數通過。
- **SC-006**：受管理環境已安裝後，重新啟動與離線啟動的重複 runtime 下載次數為 0。
- **SC-007**：所有 Runtime 敏感 PR 在合併前具有三作業系統 x64 成功證據；所有正式發布在宣告支援的平台／架構上具有成功證據。
- **SC-008**：未通過 Release Installation Gate 或正式 VSIX smoke test 的版本發布次數為 0。
- **SC-009**：診斷、CI artifact 與可複製錯誤摘要中的未遮蔽完整使用者路徑、專案內容及 secrets 數量為 0。
- **SC-010**：新增或修改的業務邏輯由決定性自動測試完整涵蓋，且既有 compile、lint、unit、integration、i18n 與封裝檢查全數通過。
- **SC-011**：支援平台首次安裝後，runtime 初始化開始點早於任何上傳請求；啟用與開啟編輯器同時觸發時，單一視窗的真實 installer 呼叫次數為 1。
- **SC-012**：一般資料夾在安全詢問取消後，Project Skill 安裝與 workspace 設定呼叫次數皆為 0，且受保護目錄的檔案差異數為 0。
- **SC-013**：OTA 設定與清除的自動化契約 100% 證明共用進度卡在 Host request 前可見；清除執行期間不得出現虛構的 `aria-valuenow`。
- **SC-014**：共用進度元件在亮色、暗色、高對比與 reduced-motion 驗收中都具有可辨識 running、succeeded 與 failed 狀態，未定義 theme token 使用數為 0。

## 假設

- 一般使用者可連線至受信任的 Python 與 Python 套件來源完成首次安裝；proxy 與 TLS 問題會被診斷，但不由本功能繞過安全設定。
- VS Code 只有在 Extension 被啟用後才能執行初始化；本 Extension 的 `onStartupFinished` activation event 代表安裝後首次啟動／重新載入視窗時開始，而不是 Marketplace 下載位元組完成的瞬間。
- 受管理環境只正式支援本機可寫入儲存；UNC、網路磁碟、musl Linux、Web Extension 與無原生程序能力的環境不在第一版範圍。
- Python artifact 由 Extension release manifest 固定版本；PlatformIO Core 使用安裝或更新當下「受測範圍內」的最新穩定版，開發平台與 mpremote 使用明確版本。
- 公開 repository 使用標準 GitHub-hosted runner；完整真實下載不建立每日排程，只由核准的 Runtime PR 或發布候選觸發。
- Provider Extension 啟動的外部任務不受 Singular 互斥鎖控制；本功能只保證 Singular 自己的程序與中間產物隔離。
- Cloud runner 不執行實體裝置上傳；Arduino 與 CyberBrick 實機 smoke test保留在發布前人工硬體 checklist。

## 超出範圍

- 自動安裝或移除 PlatformIO provider 以外的系統軟體、驅動程式、Git 或 USB 驅動。
- 自動修復 proxy、防毒軟體、企業憑證、作業系統 ACL 或磁碟空間。
- 支援網路磁碟、UNC、musl Linux、Web Extension 或所有歷史作業系統版本。
- 控制或禁止使用者直接從其他 Extension、終端機或外部程序操作同一裝置。
- 在 cloud runner 執行實體 Arduino、CyberBrick 或序列埠上傳。
- 自動重寫所有既有未鎖版 `platformio.ini`。
