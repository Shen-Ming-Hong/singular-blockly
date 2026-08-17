# 安全審查紀錄：受管理的 PlatformIO 雙 Core 環境

**審查日期**：2026-08-17

**功能規格**：[spec.md](../spec.md)

**供應鏈契約**：[managed-runtime-manifest.md](../contracts/managed-runtime-manifest.md)

## 下載與供應鏈

- [x] artifact URL 與每一個 redirect 中繼／最終位置皆套用 HTTPS host allowlist，限制 redirect 次數，拒絕 credentials、不受信任 host 與不支援 target。
- [x] 下載設定 timeout 與解碼後大小上限；只有宣告 content encoding 時允許 wire `Content-Length` 與解碼後大小不同，最後仍要求 manifest size 與 SHA-256 完全相符。
- [x] CPython artifact、installer 與 PlatformIO 受測版本範圍固定在 manifest／本機 constraint；安裝後 probe 超出 `>=6.1.0 <7.0.0` 不得寫入 ready record。
- [x] ARM64 release-candidate artifact 必須由產品 factory 明確允許，且 publish workflow 要求完整 ARM64 evidence matrix。

## Archive、檔案系統與交易

- [x] archive 在解壓前拒絕絕對路徑、`..`、控制字元、escaping symlink、hardlink 與特殊裝置；安全的 archive-internal alias 只驗證、不建立連結。
- [x] managed storage 在 ownership marker 寫入前拒絕 filesystem root、相對路徑、UNC／network path 與完整根路徑鏈的既有 symlink component，並以 realpath containment 防止 macOS alias 與路徑逃逸；被拒絕的 symlink target 保持零寫入。
- [x] `.singular-managed-runtime-root.json` ownership marker 只認領空目錄；非空未受管目錄與無效 marker 都保留並拒絕操作。
- [x] install 與 cleanup 共用具 owner、PID、建立時間與 lease 的原子 lock；有效或 PID 仍存活的 lock 不刪除。序列化 stale-lock 回收的 guard 也具有短租約，owner 崩潰後可復原，malformed guard 維持 fail-closed。
- [x] staging／version 只有在 marker 與 transaction ownership 可證明時才能清除；未知檔、provider penv 與 workspace 永不納入 cleanup。
- [x] 安裝在 immutable candidate 完成健康 probe 後才原子寫入 `current.json`；checksum、ENOSPC、權限、probe 或中斷失敗都保留上一個 current。
- [x] 新 immutable version directory 只使用固定長度 transaction UUID；完整 runtime／artifact id 保留在 record，避免不受信任的上游名稱或預設 Windows global storage 深度無限制放大每個子檔案路徑。

## 程序、信任與 fallback

- [x] managed Core、Arduino PlatformIO、monitor 與 installer 的新程序路徑使用 argv 邊界與 `shell: false`；特殊字元不會變成 shell 語法。既有 provider-only Windows compatibility path 保留原行為但不接收未驗證動態參數。取消／逾時會終止 POSIX process group 或 Windows process tree，等待 close 後才回報完成。
- [x] runtime-only 安裝／probe 不讀取專案程式；pkg install、build、upload、monitor 與裝置操作在 workspace untrusted 時拒絕執行。
- [x] fallback 採 fail-closed 分類，只允許 process spawn 前的本機 executable／import／permission／managed-store corruption，以及明確 `managed-provisioning` probe／prepare 失敗；`CoreEnvironmentManager` 是雙 Core 唯一 authority，MicroPython 不會在 manager 禁止後再走 legacy provider。網路、編譯、設定、裝置、serial、取消與 project-process／post-spawn 錯誤不得切換 Core 或重複上傳。
- [x] Arduino provider 優先、Python managed 優先，sticky 選擇只影響 Singular 自己的操作，不修改或清理 provider 擁有的 Core。

## Workspace 同意與 WebView 呈現

- [x] 一般資料夾在安全詢問前只做專案類型與既有偏好的唯讀檢查；缺少 `.vscode/settings.json` 時不建立目錄或檔案。
- [x] Project Skill 強制安裝與 workspace settings 初始化都以 `createAndShowWebView()` 的 `opened` 結果為 authority boundary；`cancelled`／`no-workspace` 不觸發 workspace-local 寫入。
- [x] 並行 editor-open 共用單一 in-flight Promise，避免活動列的重複事件各自取得不同安全詢問結果或重複執行 Skill 後置動作。
- [x] Activation 與 workspace-folder change 都沒有 Project Skill 安裝入口；既有 Blockly 專案只在 editor 回報 `opened` 後靜默維護受管理 Skill，一般資料夾不會因 activation 被認領為專案。
- [x] OTA 共用進度只消費既有、已驗證的 operation state；動態摘要與步驟使用 `textContent`，未使用 `innerHTML`、`eval` 或可由 Host payload 注入的 selector／style。
- [x] OTA 設定與清除互斥，running state 同時停用衝突控制項；清除 request 仍只傳已選 USB port，不擴張 WebView 到 Host 的權限或秘密資料面。
- [x] 診斷面板的 managed repair、cleanup、既有 auto repair 與 retest 使用共用 busy gate，不在安裝交易或修復流程中交錯讀寫狀態。
- [x] 同一 Extension Host 的 background ensure 與 explicit repair 共用單一 provisioning Promise，避免 installer lock 等待期間由兩個 attempt 互相覆寫診斷狀態；跨視窗仍由受管 store lock 序列化。

## 隱私、CI 與發布

- [x] logs、診斷、clipboard 與 issue draft 遮蔽 home／workspace、proxy credentials、token-like secrets 與敏感 URL；managed storage 對 WebView 與可分享輸出只提供穩定摘要。顯示實際 managed root 時，WebView 只送固定 command，由 Extension Host 直接呼叫本機檔案管理員，不回傳或記錄完整路徑。
- [x] managed installer failure evidence 在進入診斷、AI packet 或 issue draft 前遮蔽 raw／URI-encoded managed root、home、workspace、credentials 與 token，移除控制字元並限制為 4,000 字元；background log 只記 attempt／stage，不記 raw stdout／stderr。
- [x] evidence 只記錄 OS／arch、runner、path case 名稱、PR／event、head／tree、VSIX／manifest／artifact SHA 與結果，不保存原始使用者路徑或環境變數。
- [x] workflows 使用最小 `contents: read` 權限、SHA-pinned actions，未使用 `pull_request_target`；具網路與執行未信任程式碼的真實矩陣需由 label／release gate 核准。可執行 checkout 直接綁定 GitHub event immutable SHA；reusable release workflow 必須由 caller 傳入同一 annotated release tag 作 `candidate_ref`，runtime 矩陣不使用 npm dependency cache。跨 job 輸出的 candidate SHA 僅能用於 evidence 比對，不能決定後續執行內容。
- [x] evidence verifier 拒絕錯誤 PR／event、過期 commit／tree、不同 VSIX／manifest／artifact、缺少或重複平台與未完成 path/offline cases。
- [x] `npm audit --omit=dev --audit-level=high` 回報正式依賴 0 個已知漏洞；新增的 runtime dependencies 固定為 `@vscode/proxy-agent@0.44.0` 與 `tar@7.5.22`，分別承接 VS Code proxy 設定與受控 archive 解析。

## 結論

下載、archive、路徑、子程序、workspace consent、WebView DOM、log、cleanup 與 GitHub workflow trust boundaries 均已有 fail-closed 實作與自動化負面測試。`v0.87.1` 正式發布仍必須通過 `implementation.md` 中尚未完成的六平台遠端矩陣、乾淨 Windows F5 與實機 smoke。
